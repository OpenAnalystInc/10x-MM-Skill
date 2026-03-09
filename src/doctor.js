const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function check(label, fn) {
  try {
    const result = fn();
    console.log(`  ${label}: ${result}`);
    return true;
  } catch (e) {
    console.log(`  ${label}: FAIL — ${e.message}`);
    return false;
  }
}

module.exports = function doctor() {
  const cwd = process.cwd();
  let passed = 0;
  let failed = 0;

  console.log('\n10x Marketing Manager — Diagnostics\n');

  // Node version
  console.log('Environment:');
  if (check('Node.js', () => {
    const v = process.version;
    const major = parseInt(v.slice(1));
    if (major < 18) throw new Error(`${v} (requires >= 18)`);
    return `${v}`;
  })) passed++; else failed++;

  if (check('Git', () => execSync('git --version', { encoding: 'utf8' }).trim())) passed++; else failed++;

  // Plugin files
  console.log('\nPlugin Files:');
  if (check('.claude/', () => {
    if (!fs.existsSync(path.join(cwd, '.claude'))) throw new Error('Not found. Run "10x-mm init"');
    return 'OK';
  })) passed++; else failed++;

  if (check('CLAUDE.md', () => {
    if (!fs.existsSync(path.join(cwd, 'CLAUDE.md'))) throw new Error('Not found');
    return 'OK';
  })) passed++; else failed++;

  if (check('.mcp.json', () => {
    const p = path.join(cwd, '.mcp.json');
    if (!fs.existsSync(p)) throw new Error('Not found. Run /setup in Claude Code');
    const content = JSON.parse(fs.readFileSync(p, 'utf8'));
    const url = content?.mcpServers?.['marketing-manager-mcp']?.url || '';
    if (!url || url.includes('<YOUR')) throw new Error('Not configured. Run /setup in Claude Code');
    return url;
  })) passed++; else failed++;

  // Authentication & Access Tier
  console.log('\nAuthentication:');
  const envPath = path.join(cwd, '.env');
  const envExists = fs.existsSync(envPath);

  if (!envExists) {
    console.log('  .env: Not found. Run /setup in Claude Code');
    failed++;
  } else {
    const { getAuthSummary } = require('./auth');
    const auth = getAuthSummary(cwd);

    // Access tier
    if (check('Access Tier', () => {
      if (auth.tier === 'full') return 'FULL — valid PAT + server access';
      if (auth.tier === 'local') return `LOCAL ONLY — BYOK (${auth.byok.provider}), no server access`;
      throw new Error('NONE — run /setup to configure PAT or AI key');
    })) passed++; else failed++;

    // PAT details
    if (check('USER_PAT', () => {
      if (auth.pat.error === 'no_pat') throw new Error('Not set');
      if (auth.pat.error === 'invalid_token') throw new Error('Not a valid token');
      if (auth.pat.error === 'no_exp_claim') throw new Error('JWT missing exp claim');
      if (auth.pat.expired) throw new Error(`Expired at ${auth.pat.expiresAt}. Refresh from 10x.in profile.`);
      if (auth.pat.format === 'patv1') return 'Valid (long-lived PAT)';
      const mins = Math.round(auth.pat.expiresIn / 60);
      const warn = auth.pat.expiringSoon ? ' (EXPIRING SOON!)' : '';
      return `Valid (JWT), expires in ${mins}m${warn}`;
    })) passed++; else failed++;

    // BYOK key
    check('BYOK Key', () => {
      if (!auth.byok.found) return 'Not configured (optional — server uses its own AI)';
      return `${auth.byok.provider} — ${auth.byok.keyPreview}`;
    });

    // Handle
    const envContent = fs.readFileSync(envPath, 'utf8');
    const handleMatch = envContent.match(/^LINK_PLATFORM_HANDLE=(.+)/m);
    const handle = handleMatch ? handleMatch[1].trim() : '';
    if (check('LINK_PLATFORM_HANDLE', () => {
      if (!handle || handle.includes('<') || handle.includes('your_')) throw new Error('Not set');
      return handle;
    })) passed++; else failed++;
  }

  // MCP connectivity
  console.log('\nMCP Server:');
  try {
    // Derive server URL from handle: https://{handle}.mcp.10x.in
    let handle = '';
    if (envExists) {
      const envContent2 = fs.readFileSync(envPath, 'utf8');
      const handleMatch = envContent2.match(/^LINK_PLATFORM_HANDLE=(.+)/m);
      if (handleMatch) handle = handleMatch[1].trim();
    }
    let serverUrl = '';
    if (handle) {
      serverUrl = `https://${handle}.mcp.10x.in`;
    } else {
      // Fallback to .mcp.json URL
      const mcpJson = JSON.parse(fs.readFileSync(path.join(cwd, '.mcp.json'), 'utf8'));
      serverUrl = mcpJson?.mcpServers?.['marketing-manager-mcp']?.url || '';
    }
    if (serverUrl) {
      console.log(`  URL: ${serverUrl}`);
      if (check('Health', () => {
        const result = execSync(`curl -s --connect-timeout 5 "${serverUrl}/health"`, { encoding: 'utf8' });
        const json = JSON.parse(result);
        if (json.status !== 'ok') throw new Error(json.status || 'unknown');
        const extra = json.version ? ` v${json.version}` : '';
        const tools = json.userTools ? `, ${json.userTools} tools` : '';
        return `OK${extra}${tools}`;
      })) passed++; else failed++;
    }

    // Check MCP session persistence
    const { getMcpSessionInfo } = require('./session');
    const mcpInfo = getMcpSessionInfo(cwd);
    check('MCP Session', () => {
      if (!mcpInfo.exists) return 'None stored';
      if (mcpInfo.stale) return `Stale (${mcpInfo.ageMinutes}m ago)`;
      return `Active (last used ${mcpInfo.ageMinutes}m ago)`;
    });
  } catch (e) {
    if (!e.message?.includes('FAIL')) {
      console.log(`  Health: FAIL — ${e.message}`);
      failed++;
    }
  }

  // Session tracking
  console.log('\nSession Tracking:');
  try {
    const { getSessionStats } = require('./session');
    const stats = getSessionStats(cwd);
    if (check('.mm/', () => {
      if (!stats.mmExists) throw new Error('Not found. Run "10x-mm init"');
      return 'OK';
    })) passed++; else failed++;

    check('Sessions', () => {
      const parts = [`${stats.sessionCount} archived`];
      if (stats.hasCurrentSession) parts.push('1 active');
      if (stats.lastSessionDate) parts.push(`last: ${stats.lastSessionDate}`);
      return parts.join(', ');
    });

    if (stats.activeStrategies.length > 0) {
      check('Strategies', () => {
        const live = stats.activeStrategies.filter(s => s.status === 'live').length;
        const draft = stats.activeStrategies.filter(s => s.status === 'draft').length;
        return `${stats.activeStrategies.length} active (${live} live, ${draft} draft)`;
      });
    }
  } catch (e) {
    console.log(`  Session tracking: FAIL — ${e.message}`);
    failed++;
  }

  // Summary
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`  Passed: ${passed}  Failed: ${failed}`);
  if (failed === 0) {
    console.log('  Status: ALL HEALTHY');
  } else {
    console.log('  Status: ISSUES FOUND — run /setup in Claude Code');
  }
  console.log();

  process.exit(failed > 0 ? 1 : 0);
};
