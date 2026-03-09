const https = require('https');
const schemas = require('./tool-schemas');

function registerDirectTools(server, config) {
  server.tool('site_deploy_inline', schemas.site_deploy_inline.description, schemas.site_deploy_inline.input, async (args) => {
    assertJWT(config);
    const body = JSON.stringify({ inlineHtml: args.html, commitMessage: args.commitMessage });
    const result = await apiRequest(config, 'POST', `/v2/handles/${config.handle}/site-deployments`, body, 201);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.tool('site_deploy_multifile', schemas.site_deploy_multifile.description, schemas.site_deploy_multifile.input, async (args) => {
    assertJWT(config);
    if (!args.files.some(f => f.path === 'index.html')) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'missing_entrypoint', message: 'files array must include a root index.html' }) }],
        isError: true,
      };
    }
    const body = JSON.stringify({ files: args.files, commitMessage: args.commitMessage });
    const result = await apiRequest(config, 'POST', `/v2/handles/${config.handle}/site-deployments`, body, 201);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.tool('site_list_deployments', schemas.site_list_deployments.description, schemas.site_list_deployments.input, async (args) => {
    assertJWT(config);
    const qs = new URLSearchParams();
    if (args.limit) qs.set('limit', String(args.limit));
    if (args.nextToken) qs.set('nextToken', args.nextToken);
    const qsStr = qs.toString();
    const urlPath = `/v2/handles/${config.handle}/site-deployments${qsStr ? '?' + qsStr : ''}`;
    const result = await apiRequest(config, 'GET', urlPath);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.tool('site_preview_deployment', schemas.site_preview_deployment.description, schemas.site_preview_deployment.input, async (args) => {
    assertJWT(config);
    const urlPath = `/v2/handles/${config.handle}/site-deployments/${encodeURIComponent(args.deploymentId)}/preview`;
    const result = await apiRequest(config, 'GET', urlPath);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.tool('pages_list', schemas.pages_list.description, schemas.pages_list.input, async (args) => {
    assertJWT(config);
    const qs = args.limit ? `?limit=${args.limit}` : '';
    const result = await apiRequest(config, 'GET', `/v2/handles/${config.handle}/pages${qs}`);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.tool('profile_update', schemas.profile_update.description, schemas.profile_update.input, async (args) => {
    assertJWT(config);
    const body = JSON.stringify(args);
    const result = await apiRequest(config, 'PUT', `/v2/handles/${config.handle}/profile`, body);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.tool('site_mode_update', schemas.site_mode_update.description, schemas.site_mode_update.input, async (args) => {
    assertJWT(config);
    const body = JSON.stringify({ mode: args.mode });
    const result = await apiRequest(config, 'PUT', `/v2/handles/${config.handle}/site-mode`, body);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });
}

function assertJWT(config) {
  if (!config.jwt) {
    throw new Error('CLIENT_ID (JWT) is required for this operation. Set it in your MCP client env config. Get it from your 10x.in profile settings.');
  }
  const parts = config.jwt.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000) + 30) {
        throw new Error('CLIENT_ID (JWT) has expired. JWTs last 1 hour. Get a fresh one from your 10x.in profile settings and update CLIENT_ID in your MCP client config.');
      }
    } catch (e) {
      if (e.message.includes('expired')) throw e;
    }
  }
}

function apiRequest(config, method, urlPath, body, expectedStatus) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.10x.in',
      port: 443,
      path: urlPath,
      method,
      headers: {
        'Authorization': `Bearer ${config.jwt}`,
        'Accept': 'application/json',
      },
    };
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 401) {
          reject(new Error('JWT expired or invalid (401). Get a fresh token from your 10x.in profile settings.'));
          return;
        }
        if (expectedStatus && res.statusCode !== expectedStatus) {
          reject(new Error(`Expected ${expectedStatus} but got ${res.statusCode}: ${data}`));
          return;
        }
        if (!expectedStatus && res.statusCode >= 400) {
          reject(new Error(`API error ${res.statusCode}: ${data}`));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data, statusCode: res.statusCode }); }
      });
    });
    req.on('error', (e) => reject(new Error(`Connection error to api.10x.in: ${e.message}`)));
    if (body) req.write(body);
    req.end();
  });
}

module.exports = { registerDirectTools };
