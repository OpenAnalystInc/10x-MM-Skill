const { z } = require('zod');
const remoteToolDefs = require('./remote-tool-defs');

// Module-level session cache: { [cacheKey]: { sessionId, createdAt } }
// Survives warm Vercel invocations. Expires after 5 minutes.
const sessionCache = {};
const SESSION_TTL_MS = 5 * 60 * 1000;

function registerStatelessProxyTools(server, config) {
  for (const tool of remoteToolDefs) {
    server.tool(
      tool.name,
      tool.description,
      z.object({}).passthrough(),
      async (args) => {
        return await proxyToolCall(config, tool.name, args);
      }
    );
  }
  return remoteToolDefs.length;
}

async function getOrCreateSession(config) {
  const cacheKey = `${config.handle}:${config.pat.slice(-8)}`;
  const cached = sessionCache[cacheKey];

  if (cached && (Date.now() - cached.createdAt) < SESSION_TTL_MS) {
    return cached.sessionId;
  }

  // Initialize new session (matches validate-mcp-deployed.mjs pattern)
  const init = await mcpFetch(config.mcpUrl, config.pat, {
    jsonrpc: '2.0', id: 'init-1', method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: '10x-marketing-manager-http', version: '4.1.0' },
    },
  }, null);

  if (!init.sessionId) {
    throw new Error(`No session ID from remote. Status: ${init.status}`);
  }

  // Cache the session
  sessionCache[cacheKey] = {
    sessionId: init.sessionId,
    createdAt: Date.now(),
  };

  return init.sessionId;
}

async function proxyToolCall(config, toolName, args) {
  let sessionId;
  try {
    sessionId = await getOrCreateSession(config);
  } catch (e) {
    throw new Error(`Session init failed: ${e.message}`);
  }

  // Call the tool
  const result = await mcpFetch(config.mcpUrl, config.pat, {
    jsonrpc: '2.0', id: `call-${toolName}`, method: 'tools/call',
    params: { name: toolName, arguments: args },
  }, sessionId);

  // If session expired (404), retry with a fresh session
  if (result.status === 404) {
    const cacheKey = `${config.handle}:${config.pat.slice(-8)}`;
    delete sessionCache[cacheKey];

    sessionId = await getOrCreateSession(config);
    const retry = await mcpFetch(config.mcpUrl, config.pat, {
      jsonrpc: '2.0', id: `call-${toolName}-retry`, method: 'tools/call',
      params: { name: toolName, arguments: args },
    }, sessionId);

    if (retry.status >= 400) {
      throw new Error(`Remote tool error ${retry.status}: ${retry.body.slice(0, 300)}`);
    }
    const parsed = parseMcpBody(retry.contentType, retry.body);
    if (parsed.error) throw new Error(`MCP error: ${JSON.stringify(parsed.error)}`);
    return parsed.result;
  }

  if (result.status >= 400) {
    throw new Error(`Remote tool error ${result.status}: ${result.body.slice(0, 300)}`);
  }

  const parsed = parseMcpBody(result.contentType, result.body);
  if (parsed.error) throw new Error(`MCP error: ${JSON.stringify(parsed.error)}`);
  return parsed.result;
}

// Use fetch() — matches the working validate-mcp-deployed.mjs pattern
async function mcpFetch(mcpUrl, pat, payload, sessionId) {
  const body = JSON.stringify(payload);
  const headers = {
    'accept': 'application/json, text/event-stream',
    'content-type': 'application/json',
    'authorization': `Bearer ${pat}`,
  };
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    const bodyText = await response.text();
    const sid = response.headers.get('mcp-session-id') || null;
    const ct = response.headers.get('content-type') || '';

    return {
      status: response.status,
      sessionId: sid,
      contentType: ct,
      body: bodyText,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Parse SSE or JSON response body (from validate-mcp-deployed.mjs)
function parseMcpBody(contentType, bodyText) {
  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('text/event-stream')) {
    return parseSsePayload(bodyText);
  }
  return JSON.parse(bodyText);
}

function parseSsePayload(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).filter(l => l.startsWith('data:'));
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i].replace(/^data:\s*/, ''));
    } catch { continue; }
  }
  return null;
}

module.exports = { registerStatelessProxyTools };
