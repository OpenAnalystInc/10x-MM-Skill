const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MM_DIR = '.mm';
const SESSIONS_DIR = path.join(MM_DIR, 'sessions');
const CURRENT_FILE = path.join(SESSIONS_DIR, 'current.json');
const CONTEXT_FILE = path.join(MM_DIR, 'context.json');
const MCP_SESSION_FILE = path.join(MM_DIR, 'mcp-session.json');
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const CONTEXT_SESSION_COUNT = 3;

// --- Helpers ---

function ensureDirs(cwd) {
  const mmDir = path.join(cwd, MM_DIR);
  const sessDir = path.join(cwd, SESSIONS_DIR);
  fs.mkdirSync(sessDir, { recursive: true });
  return { mmDir, sessDir };
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function timestamp() {
  return new Date().toISOString();
}

function fileTimestamp(iso) {
  return iso.replace(/:/g, '-').replace(/\.\d+Z$/, '');
}

function sanitizeArgs(args) {
  if (!args || typeof args !== 'object') return args;
  const sanitized = { ...args };
  // Strip large HTML/CSS/JS payloads — keep only intent and identifiers
  for (const key of ['html', 'contentHtml', 'css', 'js']) {
    if (sanitized[key] && typeof sanitized[key] === 'string' && sanitized[key].length > 200) {
      sanitized[key] = `[${sanitized[key].length} chars]`;
    }
  }
  return sanitized;
}

function summarizeResult(toolName, result) {
  if (!result || typeof result !== 'object') return result;
  const summary = {};
  // Extract key fields based on tool type
  if (result.verdict) summary.verdict = result.verdict;
  if (result.status) summary.status = result.status;
  if (result.error) summary.error = result.error;
  if (result.message) summary.message = result.message;
  if (result.url) summary.url = result.url;
  if (result.pageSlug) summary.pageSlug = result.pageSlug;
  if (result.strategyId) summary.strategyId = result.strategyId;
  if (result.proposalId) summary.proposalId = result.proposalId;
  if (result.runId) summary.runId = result.runId;
  if (result.subscriptionId) summary.subscriptionId = result.subscriptionId;
  if (result.count !== undefined) summary.count = result.count;
  if (result.issues !== undefined) summary.issues = result.issues;
  if (result.testResults) {
    summary.testResults = {
      passed: result.testResults.passed,
      failed: result.testResults.failed,
      total: result.testResults.total
    };
  }
  if (Array.isArray(result.items)) summary.itemCount = result.items.length;
  if (Array.isArray(result.strategies)) summary.strategyCount = result.strategies.length;
  if (Array.isArray(result.proposals)) summary.proposalCount = result.proposals.length;
  if (Array.isArray(result.links)) summary.linkCount = result.links.length;
  if (Array.isArray(result.pages)) summary.pageCount = result.pages.length;
  return Object.keys(summary).length > 0 ? summary : result;
}

// --- Tool name normalization ---

// --- State extraction from tool results ---

function extractState(session, toolName, args, result) {
  if (!result || typeof result !== 'object') return;

  const tool = toolName;

  switch (tool) {
    case 'agent_create_proposal':
    case 'agent_generate_strategy': {
      const id = result.proposalId || result.strategyId;
      if (id) {
        session.strategies[id] = {
          name: args.name || (args.payload && args.payload.name) || result.name || 'Untitled',
          status: result.status || 'draft',
          action: 'created'
        };
      }
      break;
    }

    case 'agent_list_proposals': {
      const items = result.proposals || result.strategies || (Array.isArray(result) ? result : []);
      for (const s of items) {
        const id = s.proposalId || s.id;
        if (id && !session.strategies[id]) {
          session.strategies[id] = {
            name: s.name || 'Untitled',
            status: s.status || 'unknown',
            action: 'listed'
          };
        }
      }
      break;
    }

    case 'links_upsert': {
      const slug = args.slug || args.pageSlug;
      if (!slug) break;
      const payload = args.payload || {};
      const hasHtml = payload.html || payload.files || payload.folder || args.html;
      const isPublish = payload.publish;
      const isLink = payload.destinationUrl || args.destinationUrl;

      if (isLink) {
        // Link creation/update
        const key = result.id || slug;
        session.links[key] = {
          slug,
          destination: payload.destinationUrl || args.destinationUrl || result.destinationUrl || '',
          action: 'created'
        };
      } else if (isPublish) {
        // Page publish
        if (!session.pages[slug]) session.pages[slug] = {};
        session.pages[slug].action = 'published';
        session.pages[slug].url = result.url || `https://${args.handle || 'unknown'}.10x.in/${slug}`;
      } else if (hasHtml) {
        // Page create/update
        session.pages[slug] = {
          url: result.url || `https://${args.handle || 'unknown'}.10x.in/${slug}`,
          action: 'created'
        };
      }
      break;
    }

    case 'links_list': {
      const links = result.links || (Array.isArray(result) ? result : []);
      // Just track count, don't overwrite individual entries
      if (links.length > 0 && !session._linksListed) {
        session._linksListed = true;
      }
      break;
    }

    case 'system_audit_events':
      session.audits.push({
        at: timestamp(),
        result: result.verdict || (result.issues === 0 ? 'pass' : 'fail'),
        issues: result.issues || (result.testResults ? result.testResults.failed : 0)
      });
      break;

    case 'agent_start_run':
      if (result.runId) {
        session._lastRunId = result.runId;
      }
      if (result.verdict) {
        session.audits.push({
          at: timestamp(),
          result: result.verdict,
          issues: result.testResults ? result.testResults.failed : 0,
          feedback: result.feedback ? String(result.feedback).slice(0, 200) : undefined
        });
        const submitSlug = args.slug || args.pageSlug || (args.payload && args.payload.slug);
        if (result.verdict === 'approved' && submitSlug) {
          if (!session.pages[submitSlug]) session.pages[submitSlug] = {};
          session.pages[submitSlug].action = 'approved';
        }
      }
      break;

    case 'agent_approve_proposal':
    case 'agent_reject_proposal': {
      const id = args.proposalId || result.proposalId;
      if (id && session.strategies[id]) {
        session.strategies[id].status = tool === 'agent_approve_proposal' ? 'approved' : 'rejected';
        session.strategies[id].action = tool === 'agent_approve_proposal' ? 'approved' : 'rejected';
      }
      break;
    }

    case 'agent_rollback_run': {
      const rollbackSlug = args.slug || args.pageSlug;
      if (rollbackSlug && session.pages[rollbackSlug]) {
        session.pages[rollbackSlug].action = 'rolled_back';
      }
      break;
    }

    case 'agent_get_run_status':
      if (result.status) {
        session._lastRunStatus = result.status;
      }
      break;

    case 'webhooks_create':
      if (result.subscriptionId) {
        session._webhooks = session._webhooks || [];
        session._webhooks.push({ id: result.subscriptionId, action: 'created' });
      }
      break;
  }

  // Track errors
  if (result.error) {
    session.errors.push({
      tool: toolName,
      error: String(result.error).slice(0, 300),
      at: timestamp()
    });
  }
}

// --- Public API ---

/**
 * Initialize a new session. Archives stale current.json if found.
 */
function initSession(cwd, userInfo = {}) {
  ensureDirs(cwd);
  const currentPath = path.join(cwd, CURRENT_FILE);

  // Archive stale session if exists
  const existing = readJSON(currentPath);
  if (existing && existing.startedAt) {
    const age = Date.now() - new Date(existing.startedAt).getTime();
    if (age > STALE_THRESHOLD_MS || existing.endedAt) {
      archiveSession(cwd, existing);
    }
  }

  const session = {
    sessionId: crypto.randomUUID(),
    startedAt: timestamp(),
    endedAt: null,
    user: {
      email: userInfo.email || process.env.USER_EMAIL || '',
      handle: userInfo.handle || process.env.LINK_PLATFORM_HANDLE || ''
    },
    model: userInfo.model || 'Opus 4.6',
    toolCalls: [],
    strategies: {},
    pages: {},
    links: {},
    audits: [],
    errors: []
  };

  writeJSON(currentPath, session);
  return session;
}

/**
 * Log a completed tool call to the current session.
 * Logs the tool call and extracts state from the result.
 */
function logToolCall(cwd, toolName, args, result, durationMs) {
  const currentPath = path.join(cwd, CURRENT_FILE);
  let session = readJSON(currentPath);

  if (!session) {
    session = initSession(cwd);
  }

  const entry = {
    tool: toolName,
    args: sanitizeArgs(args),
    result: summarizeResult(toolName, result),
    at: timestamp(),
    ms: durationMs || 0
  };

  session.toolCalls.push(entry);
  extractState(session, toolName, args || {}, result || {});
  writeJSON(currentPath, session);
  return session;
}

/**
 * End the current session: set endedAt, generate summary, archive, rebuild context.
 */
function endSession(cwd) {
  const currentPath = path.join(cwd, CURRENT_FILE);
  const session = readJSON(currentPath);
  if (!session) return null;

  session.endedAt = timestamp();
  session.summary = generateSummary(session);
  writeJSON(currentPath, session);

  archiveSession(cwd, session);
  rebuildContext(cwd);
  return session;
}

/**
 * Generate a human-readable summary from a session.
 */
function generateSummary(session) {
  const accomplished = [];
  const inProgress = [];
  const openIssues = [];

  // Pages
  for (const [slug, page] of Object.entries(session.pages || {})) {
    if (page.action === 'published') {
      accomplished.push(`Published '${slug}' at ${page.url || slug}`);
    } else if (page.action === 'created' || page.action === 'updated') {
      inProgress.push(`Page '${slug}' — ${page.action}, not yet published`);
    } else if (page.action === 'rolled_back') {
      openIssues.push(`Page '${slug}' was rolled back`);
    }
  }

  // Strategies
  for (const [id, strat] of Object.entries(session.strategies || {})) {
    if (strat.action === 'created') {
      if (strat.status === 'live') {
        accomplished.push(`Strategy '${strat.name}' is live`);
      } else {
        inProgress.push(`Strategy '${strat.name}' — ${strat.status}`);
      }
    }
  }

  // Links
  const linkCount = Object.keys(session.links || {}).length;
  if (linkCount > 0) {
    accomplished.push(`Created ${linkCount} link${linkCount > 1 ? 's' : ''}`);
  }

  // Audits
  const passedAudits = (session.audits || []).filter(a => a.result === 'pass' || a.result === 'approved');
  const failedAudits = (session.audits || []).filter(a => a.result === 'fail' || a.result === 'rejected');
  if (passedAudits.length > 0) {
    accomplished.push(`${passedAudits.length} audit${passedAudits.length > 1 ? 's' : ''} passed`);
  }
  if (failedAudits.length > 0) {
    openIssues.push(`${failedAudits.length} audit${failedAudits.length > 1 ? 's' : ''} failed`);
  }

  // Errors
  if ((session.errors || []).length > 0) {
    openIssues.push(`${session.errors.length} error${session.errors.length > 1 ? 's' : ''} occurred`);
  }

  // Duration
  let duration = '';
  if (session.startedAt && session.endedAt) {
    const ms = new Date(session.endedAt) - new Date(session.startedAt);
    const mins = Math.round(ms / 60000);
    duration = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  return {
    accomplished,
    inProgress,
    openIssues,
    duration,
    toolCallCount: (session.toolCalls || []).length,
    suggestions: openIssues.length > 0
      ? ['Resolve open issues before starting new work']
      : inProgress.length > 0
        ? ['Continue work on in-progress items']
        : []
  };
}

/**
 * Archive a session to sessions/{timestamp}.json and remove current.json.
 */
function archiveSession(cwd, session) {
  ensureDirs(cwd);
  const ts = fileTimestamp(session.startedAt || timestamp());
  const archivePath = path.join(cwd, SESSIONS_DIR, `${ts}.json`);
  writeJSON(archivePath, session);

  const currentPath = path.join(cwd, CURRENT_FILE);
  try { fs.unlinkSync(currentPath); } catch {}
}

/**
 * Rebuild context.json from the last N archived sessions.
 */
function rebuildContext(cwd) {
  const sessDir = path.join(cwd, SESSIONS_DIR);
  if (!fs.existsSync(sessDir)) return;

  const files = fs.readdirSync(sessDir)
    .filter(f => f.endsWith('.json') && f !== 'current.json')
    .sort()
    .reverse();

  // Delete sessions older than 30 days
  const cutoff = Date.now() - MAX_AGE_MS;
  for (const file of files) {
    const filePath = path.join(sessDir, file);
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
    }
  }

  // Reload after cleanup
  const remaining = fs.readdirSync(sessDir)
    .filter(f => f.endsWith('.json') && f !== 'current.json')
    .sort()
    .reverse();

  const recent = remaining.slice(0, CONTEXT_SESSION_COUNT);
  const sessions = recent.map(f => readJSON(path.join(sessDir, f))).filter(Boolean);

  // Build context
  const lastSession = sessions[0];
  const allStrategies = {};
  let totalToolCalls = 0;

  for (const s of sessions) {
    totalToolCalls += (s.toolCalls || []).length;
    for (const [id, strat] of Object.entries(s.strategies || {})) {
      if (!allStrategies[id] || strat.action !== 'listed') {
        allStrategies[id] = strat;
      }
    }
  }

  const context = {
    updatedAt: timestamp(),
    lastSession: lastSession ? {
      date: lastSession.startedAt ? lastSession.startedAt.split('T')[0] : '',
      duration: lastSession.summary?.duration || '',
      accomplished: lastSession.summary?.accomplished || [],
      inProgress: lastSession.summary?.inProgress || [],
      openIssues: lastSession.summary?.openIssues || []
    } : null,
    activeStrategies: Object.entries(allStrategies)
      .filter(([, s]) => s.status === 'live' || s.status === 'draft')
      .map(([id, s]) => ({ id, name: s.name, status: s.status })),
    totalSessions: remaining.length,
    recentToolCalls: totalToolCalls
  };

  writeJSON(path.join(cwd, CONTEXT_FILE), context);
  return context;
}

/**
 * Load context.json for use in tool calls.
 */
function loadContext(cwd) {
  return readJSON(path.join(cwd, CONTEXT_FILE));
}

/**
 * Load the current active session.
 */
function loadCurrentSession(cwd) {
  return readJSON(path.join(cwd, CURRENT_FILE));
}

/**
 * List all archived sessions (most recent first).
 */
function listSessions(cwd) {
  const sessDir = path.join(cwd, SESSIONS_DIR);
  if (!fs.existsSync(sessDir)) return [];

  return fs.readdirSync(sessDir)
    .filter(f => f.endsWith('.json') && f !== 'current.json')
    .sort()
    .reverse()
    .map(f => {
      const session = readJSON(path.join(sessDir, f));
      if (!session) return null;
      return {
        file: f,
        sessionId: session.sessionId,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        toolCallCount: (session.toolCalls || []).length,
        summary: session.summary || generateSummary(session)
      };
    })
    .filter(Boolean);
}

/**
 * Clear all session logs. Preserves context.json.
 */
function clearSessions(cwd) {
  const sessDir = path.join(cwd, SESSIONS_DIR);
  if (!fs.existsSync(sessDir)) return 0;

  const files = fs.readdirSync(sessDir).filter(f => f.endsWith('.json'));
  for (const f of files) {
    fs.unlinkSync(path.join(sessDir, f));
  }
  return files.length;
}

/**
 * Get session stats for doctor output.
 */
function getSessionStats(cwd) {
  const sessDir = path.join(cwd, SESSIONS_DIR);
  const mmDir = path.join(cwd, MM_DIR);

  const stats = {
    mmExists: fs.existsSync(mmDir),
    sessionCount: 0,
    lastSessionDate: null,
    activeStrategies: [],
    hasCurrentSession: false
  };

  if (!stats.mmExists) return stats;

  stats.hasCurrentSession = fs.existsSync(path.join(cwd, CURRENT_FILE));

  if (fs.existsSync(sessDir)) {
    const files = fs.readdirSync(sessDir)
      .filter(f => f.endsWith('.json') && f !== 'current.json')
      .sort()
      .reverse();
    stats.sessionCount = files.length;
    if (files.length > 0) {
      const latest = readJSON(path.join(sessDir, files[0]));
      stats.lastSessionDate = latest?.startedAt?.split('T')[0] || files[0].replace('.json', '');
    }
  }

  const context = readJSON(path.join(cwd, CONTEXT_FILE));
  if (context?.activeStrategies) {
    stats.activeStrategies = context.activeStrategies;
  }

  return stats;
}

// --- MCP Session Persistence ---

/**
 * Store MCP session ID for reuse across tool calls and conversations.
 */
function saveMcpSession(cwd, sessionId, serverUrl) {
  ensureDirs(cwd);
  writeJSON(path.join(cwd, MCP_SESSION_FILE), {
    sessionId,
    serverUrl: serverUrl || '',
    createdAt: timestamp(),
    lastUsedAt: timestamp()
  });
}

/**
 * Load stored MCP session ID. Returns null if not found or stale (>2hrs).
 */
function loadMcpSession(cwd) {
  const data = readJSON(path.join(cwd, MCP_SESSION_FILE));
  if (!data || !data.sessionId) return null;

  // Check staleness
  if (data.lastUsedAt) {
    const age = Date.now() - new Date(data.lastUsedAt).getTime();
    if (age > STALE_THRESHOLD_MS) {
      return { ...data, stale: true };
    }
  }

  return { ...data, stale: false };
}

/**
 * Update lastUsedAt timestamp for MCP session.
 */
function touchMcpSession(cwd) {
  const filePath = path.join(cwd, MCP_SESSION_FILE);
  const data = readJSON(filePath);
  if (data) {
    data.lastUsedAt = timestamp();
    writeJSON(filePath, data);
  }
}

/**
 * Clear stored MCP session (on session expiry or server restart).
 */
function clearMcpSession(cwd) {
  const filePath = path.join(cwd, MCP_SESSION_FILE);
  try { fs.unlinkSync(filePath); } catch {}
}

/**
 * Get MCP session info for doctor/health output.
 */
function getMcpSessionInfo(cwd) {
  const data = readJSON(path.join(cwd, MCP_SESSION_FILE));
  if (!data) return { exists: false };

  const age = data.lastUsedAt ? Date.now() - new Date(data.lastUsedAt).getTime() : Infinity;
  return {
    exists: true,
    sessionId: data.sessionId,
    serverUrl: data.serverUrl,
    createdAt: data.createdAt,
    lastUsedAt: data.lastUsedAt,
    stale: age > STALE_THRESHOLD_MS,
    ageMinutes: Math.round(age / 60000)
  };
}

module.exports = {
  initSession,
  logToolCall,
  endSession,
  generateSummary,
  archiveSession,
  rebuildContext,
  loadContext,
  loadCurrentSession,
  listSessions,
  clearSessions,
  getSessionStats,
  // MCP session persistence
  saveMcpSession,
  loadMcpSession,
  touchMcpSession,
  clearMcpSession,
  getMcpSessionInfo,
  // Constants for external use
  MM_DIR,
  SESSIONS_DIR,
  CURRENT_FILE,
  CONTEXT_FILE,
  MCP_SESSION_FILE
};
