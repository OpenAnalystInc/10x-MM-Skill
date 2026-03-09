const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { registerProxyTools } = require('./server/proxy-tools');
const { registerDirectTools } = require('./server/direct-tools');

module.exports = async function serve() {
  const jwt = process.env.CLIENT_ID || null;
  const pat = process.env.CLIENT_SECRET;
  const handle = process.env.LINK_PLATFORM_HANDLE || deriveHandleFromJWT(jwt);

  if (!pat) {
    process.stderr.write('ERROR: CLIENT_SECRET is required. Set it to your PAT (patv1_*) in your MCP client env config.\n');
    process.stderr.write('Get your PAT from https://10x.in profile settings.\n');
    process.exit(1);
  }
  if (!pat.startsWith('patv1_')) {
    process.stderr.write('WARNING: CLIENT_SECRET does not look like a PAT (expected patv1_* format). Proceeding anyway.\n');
  }
  if (!handle) {
    process.stderr.write('ERROR: LINK_PLATFORM_HANDLE is required (or set CLIENT_ID to a JWT so the handle can be derived).\n');
    process.exit(1);
  }

  const config = {
    jwt,
    pat,
    handle,
    mcpUrl: `https://api.10x.in/mcp/${handle}/mcp`,
    apiUrl: 'https://api.10x.in',
    sessionId: null,
    debug: !!process.env.DEBUG,
  };

  process.stderr.write(`10x-marketing-manager MCP server starting (handle: ${handle})...\n`);

  const server = new McpServer({
    name: '10x-marketing-manager',
    version: require('../package.json').version,
  });

  // Register 37 proxied tools from remote MCP server
  let proxyCount = 0;
  try {
    proxyCount = await registerProxyTools(server, config);
  } catch (e) {
    process.stderr.write(`WARNING: Could not discover remote tools: ${e.message}\n`);
    process.stderr.write('The server will start with direct API tools only. Proxy tools unavailable.\n');
  }

  // Register 7 direct API tools (JWT-authed)
  registerDirectTools(server, config);
  const directCount = 7;

  process.stderr.write(`Registered ${proxyCount} proxy tools + ${directCount} direct tools = ${proxyCount + directCount} total\n`);
  if (!jwt) {
    process.stderr.write('NOTE: No CLIENT_ID (JWT) set. Direct API tools (site_deploy_*, pages_list, etc.) will require it.\n');
  }

  // Start stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write('MCP server ready. Listening on stdio.\n');
};

function deriveHandleFromJWT(jwt) {
  if (!jwt) return null;
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return payload['cognito:username'] || payload.handle || payload.sub || null;
  } catch {
    return null;
  }
}
