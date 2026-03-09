const fs = require('fs');
const path = require('path');

// All 37 Link Platform MCP tools — every one requires a valid PAT (full tier)
const SERVER_TOOLS = [
  // Agent (9)
  'agent_approve_proposal', 'agent_create_proposal', 'agent_discover',
  'agent_generate_strategy', 'agent_get_run_status', 'agent_list_proposals',
  'agent_reject_proposal', 'agent_rollback_run', 'agent_start_run',
  // Analytics (3)
  'analytics_campaign_health', 'analytics_export', 'analytics_get',
  // Forms (2)
  'forms_feedback_record', 'forms_schema_get',
  // Links (5)
  'links_form_submit', 'links_health_check', 'links_list',
  'links_route_preview', 'links_upsert',
  // Routing (4)
  'routing_list_context_origins', 'routing_prefetch_decisions',
  'routing_read_chain_session', 'routing_update_context_origins',
  // System (3)
  'system_audit_events', 'system_health', 'system_usage_meters',
  // Tracking (7)
  'tracking_list_personalization_rules', 'tracking_list_templates',
  'tracking_resolve_chain', 'tracking_resolve_context',
  'tracking_upsert_personalization_rule', 'tracking_upsert_template',
  'tracking_write_signal',
  // Webhooks (4)
  'webhooks_create', 'webhooks_delete', 'webhooks_list', 'webhooks_test'
];

// Skills that require server access (PAT)
const SERVER_SKILLS = [
  'release/create_strategy_branch', 'release/generate_preview',
  'release/open_pr_review', 'release/publish_release', 'release/rollback_release',
  'audit/audit_runtime_smoke', 'audit/audit_links',
  'marketer-sync', 'marketer-dashboard'
];

// BYOK keys to check — in priority order (matching setup.md)
const BYOK_KEYS = [
  { env: 'ANTHROPIC_AUTH_TOKEN', provider: 'OpenAnalyst' },
  { env: 'OPENROUTER_API_KEY', provider: 'OpenRouter' },
  { env: 'OPENAI_API_KEY', provider: 'OpenAI' },
  { env: 'ANTHROPIC_API_KEY', provider: 'Anthropic' }
];

const EXPIRING_SOON_THRESHOLD = 10 * 60; // 10 minutes in seconds
const CLOCK_SKEW_BUFFER = 30; // 30 seconds

// ── Internal helpers ────────────────────────────────────────────────────────

function readEnvFile(cwd) {
  const envPath = path.join(cwd, '.env');
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const vars = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)/);
    if (match) vars[match[1]] = match[2].trim();
  }
  return vars;
}

function isPlaceholder(value) {
  if (!value) return true;
  return value.includes('<') || value.includes('your_') || value === '';
}

function decodeJWTPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Validate the USER_PAT token.
 * Supports two formats:
 *   1. Long-lived PAT: "patv1_tok_..." (no expiry, valid until revoked)
 *   2. JWT (Cognito): "eyJ..." (expires every 1 hour, has exp claim)
 * Returns { valid, expired, expiringSoon, expiresAt, expiresIn, handle, format, error }
 */
function validatePAT(cwd) {
  const vars = readEnvFile(cwd);
  if (!vars) return { valid: false, error: 'no_env' };

  const token = vars.USER_PAT;
  if (!token || isPlaceholder(token)) {
    return { valid: false, error: 'no_pat' };
  }

  // Format 1: Long-lived PAT (patv1_tok_...)
  // These don't expire (or expire after days/months set at creation).
  // We trust them as valid — the server will reject if revoked.
  if (token.startsWith('patv1_')) {
    return {
      valid: true,
      expired: false,
      expiringSoon: false,
      expiresAt: null,
      expiresIn: null,
      handle: vars.LINK_PLATFORM_HANDLE || null,
      format: 'patv1',
      error: null
    };
  }

  // Format 2: JWT (Cognito ID token)
  const payload = decodeJWTPayload(token);
  if (!payload) {
    return { valid: false, error: 'invalid_token' };
  }

  if (!payload.exp) {
    return { valid: false, error: 'no_exp_claim' };
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = payload.exp - now;
  const expiresAt = new Date(payload.exp * 1000).toISOString();

  if (expiresIn <= CLOCK_SKEW_BUFFER) {
    return {
      valid: false,
      expired: true,
      expiringSoon: false,
      expiresAt,
      expiresIn: 0,
      handle: payload.handle || payload.sub || null,
      format: 'jwt',
      error: 'expired'
    };
  }

  return {
    valid: true,
    expired: false,
    expiringSoon: expiresIn < EXPIRING_SOON_THRESHOLD,
    expiresAt,
    expiresIn,
    handle: payload.handle || payload.sub || null,
    format: 'jwt',
    error: null
  };
}

/**
 * Check if any BYOK (Bring Your Own Key) API key is configured.
 * Returns { found, provider, keyPreview }
 */
function hasBYOK(cwd) {
  const vars = readEnvFile(cwd);
  if (!vars) return { found: false, provider: null };

  for (const { env, provider } of BYOK_KEYS) {
    const val = vars[env];
    if (val && !isPlaceholder(val)) {
      return {
        found: true,
        provider,
        keyPreview: val.slice(0, 10) + '...'
      };
    }
  }
  return { found: false, provider: null };
}

/**
 * Determine user's access tier.
 * - 'full'  — valid PAT → all 37 server tools + all skills
 * - 'local' — no PAT but has BYOK key → local skills only
 * - 'none'  — nothing configured → blocked
 */
function getUserTier(cwd) {
  const pat = validatePAT(cwd);
  if (pat.valid) return 'full';
  const byok = hasBYOK(cwd);
  if (byok.found) return 'local';
  return 'none';
}

/**
 * Check if user can access the Marketing Manager server.
 * Returns { allowed, tier, message }
 */
function requireServer(cwd) {
  const tier = getUserTier(cwd);
  if (tier === 'full') {
    return { allowed: true, tier, message: '' };
  }
  if (tier === 'local') {
    return {
      allowed: false,
      tier,
      message: 'Server features require a valid PAT. You have a BYOK key configured, '
        + 'so local skills (content generation, design, build, local audits) work fine. '
        + 'Get a PAT from your 10x.in profile settings to unlock publishing, server testing, and analytics.'
    };
  }
  return {
    allowed: false,
    tier,
    message: 'No authentication configured. Run /setup to either get a PAT from 10x.in '
      + 'or provide your own AI API key.'
  };
}

/**
 * Check if a specific server tool is allowed for this user.
 */
function canUseTool(toolName, cwd) {
  if (!SERVER_TOOLS.includes(toolName)) {
    return { allowed: true, tier: getUserTier(cwd) };
  }
  return requireServer(cwd);
}

/**
 * Check if a specific skill is allowed for this user.
 */
function canUseSkill(skillName, cwd) {
  if (!SERVER_SKILLS.includes(skillName)) {
    return { allowed: true, tier: getUserTier(cwd) };
  }
  return requireServer(cwd);
}

/**
 * Get full auth diagnostic summary.
 */
function getAuthSummary(cwd) {
  const pat = validatePAT(cwd);
  const byok = hasBYOK(cwd);
  const tier = pat.valid ? 'full' : (byok.found ? 'local' : 'none');

  return {
    tier,
    pat,
    byok,
    serverAccess: tier === 'full',
    localAccess: tier !== 'none'
  };
}

module.exports = {
  validatePAT,
  hasBYOK,
  getUserTier,
  requireServer,
  canUseTool,
  canUseSkill,
  getAuthSummary,
  SERVER_TOOLS,
  SERVER_SKILLS,
  BYOK_KEYS
};
