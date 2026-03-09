const https = require('https');
const { z } = require('zod');

let requestId = 1;

async function registerProxyTools(server, config) {
  const remoteTools = await discoverRemoteTools(config);
  log(config, `Discovered ${remoteTools.length} remote tools`);

  for (const tool of remoteTools) {
    server.tool(
      tool.name,
      tool.description || '',
      z.object({}).passthrough(),
      async (args) => {
        return await forwardToolCall(config, tool.name, args);
      }
    );
  }

  return remoteTools.length;
}

async function ensureSession(config) {
  if (config.sessionId) return;

  log(config, 'Initializing remote MCP session...');
  const initResult = await mcpRequest(config, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: '10x-marketing-manager-proxy', version: '4.1.0' },
  }, true);

  if (!config.sessionId) {
    throw new Error('Remote MCP server did not return a session ID. Check your CLIENT_SECRET (PAT) and LINK_PLATFORM_HANDLE.');
  }

  await mcpNotification(config, 'notifications/initialized', {});
  log(config, `Session established: ${config.sessionId.slice(0, 8)}...`);
}

async function discoverRemoteTools(config) {
  await ensureSession(config);
  const result = await mcpRequest(config, 'tools/list', {});
  return result.tools || [];
}

async function forwardToolCall(config, toolName, args) {
  try {
    await ensureSession(config);
    const result = await mcpRequest(config, 'tools/call', {
      name: toolName,
      arguments: args,
    });
    return result;
  } catch (e) {
    if (e.message.includes('session') || e.message.includes('404')) {
      log(config, 'Session expired, re-initializing...');
      config.sessionId = null;
      await ensureSession(config);
      const result = await mcpRequest(config, 'tools/call', {
        name: toolName,
        arguments: args,
      });
      return result;
    }
    throw e;
  }
}

function mcpRequest(config, method, params, isInit) {
  return new Promise((resolve, reject) => {
    const id = requestId++;
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    });

    const url = new URL(config.mcpUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.pat}`,
        'Accept': 'application/json, text/event-stream',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': '10x-marketing-manager/4.1.0',
      },
    };
    if (config.sessionId) {
      options.headers['mcp-session-id'] = config.sessionId;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (isInit && res.headers['mcp-session-id']) {
          config.sessionId = res.headers['mcp-session-id'];
        }

        log(config, `${method} → ${res.statusCode}`);

        if (res.statusCode === 401) {
          reject(new Error('CLIENT_SECRET (PAT) rejected (401). Check that your PAT is valid and not revoked.'));
          return;
        }
        if (res.statusCode === 404) {
          reject(new Error('Remote session not found (404). Will re-initialize.'));
          return;
        }
        if (res.statusCode >= 400) {
          reject(new Error(`Remote MCP error ${res.statusCode}: ${data}`));
          return;
        }

        try {
          const parsed = parseSSEResponse(data);
          if (parsed.error) {
            reject(new Error(`MCP error: ${JSON.stringify(parsed.error)}`));
            return;
          }
          resolve(parsed.result);
        } catch (e) {
          reject(new Error(`Failed to parse remote response: ${e.message}\nRaw: ${data.slice(0, 500)}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Connection error to ${url.hostname}: ${e.message}`)));
    req.write(payload);
    req.end();
  });
}

function mcpNotification(config, method, params) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
    });

    const url = new URL(config.mcpUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.pat}`,
        'Accept': 'application/json, text/event-stream',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': '10x-marketing-manager/4.1.0',
      },
    };
    if (config.sessionId) {
      options.headers['mcp-session-id'] = config.sessionId;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve());
    });
    req.on('error', (e) => reject(new Error(`Notification error: ${e.message}`)));
    req.write(payload);
    req.end();
  });
}

function parseSSEResponse(raw) {
  const lines = raw.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        return JSON.parse(line.slice(6));
      } catch { continue; }
    }
  }
  return JSON.parse(raw);
}

function log(config, msg) {
  if (config.debug || process.env.DEBUG) {
    process.stderr.write(`[proxy] ${msg}\n`);
  }
}

module.exports = { registerProxyTools };
