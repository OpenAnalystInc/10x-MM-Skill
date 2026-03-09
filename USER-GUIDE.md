# Marketing Manager — User Guide

Connect to the Marketing Manager MCP Server from any AI client and start building marketing strategies, landing pages, and campaigns.

## What You Get

When connected, your AI client gains access to:
- **80 MCP Tools** — Strategy management, sandbox code execution, link platform, scheduling, testing, data branching
- **25 Skills** — Landing pages, SEO, copy, design, analytics, A/B testing, funnels, lead capture, speed optimization
- **6 AI Agents** — Agency Director, Creative Director, Technical Lead, Growth Strategist, Campaign Manager, QA Director

## Authentication

You need two credentials:

| Credential | What It Is | Where to Get It |
|-----------|-----------|----------------|
| `USER_PAT` | Personal Access Token for the MCP Server | Provided by your admin or generated at signup |
| `LINK_PLATFORM_PAT` | Token for Link Platform (10x.in) publishing | Your 10x.in account settings |

## Environment Variables

Create a `.env` file with:

```env
# Required — MCP Server connection (URL derived from handle: https://{handle}.mcp.10x.in)
USER_PAT=your-personal-access-token

# Required for publishing — Link Platform
LINK_PLATFORM_PAT=your-link-platform-token
LINK_PLATFORM_HANDLE=yourhandle           # Your 10x.in handle

# Optional — AI Provider (pick ONE)
# Option A: OpenAnalyst (recommended)
ANTHROPIC_BASE_URL=https://api.openanalyst.com/api
ANTHROPIC_AUTH_TOKEN=your-openanalyst-key

# Option B: OpenRouter
# OPENROUTER_API_KEY=your-openrouter-key
# DEFAULT_AI_PROVIDER=openrouter
# DEFAULT_AI_MODEL=anthropic/claude-sonnet-4-20250514
```

---

## MCP Client Configuration

Server URL: `https://mcp.10x.in/mcp`

---

### Claude Code (CLI)

**Option 1: Install as a skill**
```bash
git clone https://github.com/Anit-1to10x/Marketing-Manager-Skill.git
cd Marketing-Manager-Skill
claude skills add .
```

**Option 2: Add MCP server manually**

Add to your Claude Code MCP settings (`.mcp.json` in your project root or `~/.claude/.mcp.json` globally):

```json
{
  "mcpServers": {
    "marketing-manager-mcp": {
      "type": "url",
      "url": "https://mcp.10x.in/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_PAT_HERE"
      }
    }
  }
}
```

---

### Claude Desktop

Add to `claude_desktop_config.json`:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "marketing-manager-mcp": {
      "type": "url",
      "url": "https://mcp.10x.in/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_PAT_HERE"
      }
    }
  }
}
```

---

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "marketing-manager-mcp": {
      "url": "https://mcp.10x.in/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_PAT_HERE"
      }
    }
  }
}
```

---

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "marketing-manager-mcp": {
      "serverUrl": "https://mcp.10x.in/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_PAT_HERE"
      }
    }
  }
}
```

---

### Any MCP-Compatible Client

The server uses **MCP Streamable HTTP** transport. To connect from any client:

- **URL**: `https://mcp.10x.in/mcp`
- **Protocol**: JSON-RPC 2.0 over HTTP POST
- **Required Headers**:
  ```
  Content-Type: application/json
  Accept: application/json, text/event-stream
  Authorization: Bearer YOUR_PAT_HERE
  ```
- **Session**: After `initialize`, include the `mcp-session-id` response header in subsequent requests

**Initialize handshake**:
```bash
curl -X POST https://mcp.10x.in/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer YOUR_PAT_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {"name": "my-client", "version": "1.0"}
    }
  }'
```

Expected response (SSE format):
```
data: {"jsonrpc":"2.0","id":1,"result":{"serverInfo":{"name":"marketing-manager-mcp","version":"3.0.0"},"capabilities":{"tools":{}}}}
```

---

## What to Expect

### Health Check

After connecting, verify with:
```
curl https://mcp.10x.in/health
```

Expected:
```json
{"status": "ok", "version": "3.0.0", "transport": "http", "tools": 80}
```

### Available Tool Categories

| Category | Count | Examples |
|----------|-------|---------|
| Link Platform (`lp_*`) | 41 | `lp_pages_create`, `lp_links_upsert`, `lp_analytics_get` |
| Strategy (`strategy_*`) | 9 | `strategy_create_draft`, `strategy_publish`, `strategy_insights` |
| Data Branching (`branch_*`) | 8 | `branch_create`, `branch_merge`, `branch_list` |
| Handoff (`handoff_*`) | 6 | `handoff_task_assign`, `handoff_task_complete` |
| Testing (`test_*`) | 5 | `test_full_suite`, `test_validate_html` |
| Scheduling (`schedule_*`) | 5 | `schedule_create`, `schedule_list` |
| Sandbox (`sandbox_*`) | 4 | `sandbox_run_code`, `sandbox_preview` |
| Session (`session_*`) | 2 | `session_list`, `session_status` |

### Typical Workflow

1. **Create a strategy** → `strategy_create_draft` (creates a data branch automatically)
2. **Build content** → Use skills locally (landing page, copy, design)
3. **Test in sandbox** → `sandbox_run_code` (execute HTML/JS) → `sandbox_preview` (get preview URL)
4. **Review and iterate** → Preview URL shows your page, make changes
5. **Publish** → `lp_pages_create` + `lp_pages_publish` → live at `yourhandle.10x.in/slug`
6. **Track** → `lp_links_upsert` for tracking links, `lp_analytics_get` for metrics
7. **Finalize** → `strategy_publish` marks strategy as live

### Using with Claude Code Skills

If you installed the skill plugin, you also get:

| Command | What It Does |
|---------|-------------|
| `/setup` | Auto-configure your environment |
| `/health` | Check all service connections |
| `/deploy` | Publish a strategy to your live site |
| `/feedback` | Visual page annotation and review |
| `/test` | Run the test suite |

And 6 AI agents that orchestrate the 25 skills automatically. Just describe what you want:
- "Build me a landing page for my SaaS product"
- "Analyze my competitors and improve my conversion rate"
- "Set up A/B testing on my homepage"
- "Create a campaign with tracking links"

The Agency Director routes your request to the right specialist agents.

---

## Architecture

```
Your AI Client (Claude Code / Cursor / Claude Desktop)
  │
  ├── Skills (25) — local content generation
  │     Landing page, SEO, copy, design, analytics, A/B testing, etc.
  │
  ├── Agents (6) — orchestrate skills
  │     Agency Director → Creative Director, Technical Lead,
  │     Growth Strategist, Campaign Manager, QA Director
  │
  └── MCP (121 tools) → Marketing Manager Server
        │
        ├── DynamoDB — strategies, data branches
        ├── Sandbox — code execution, previews
        ├── Temporal — scheduled workflows
        └── Link Platform → 10x.in (pages, links, analytics)
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| MCP connection refused | Ensure server is running. Local: `npx tsx src/mcp-server/index.ts` |
| "Unauthorized" error | Check your `USER_PAT` is correct and included in the Authorization header |
| No tools showing up | Ensure `Accept: application/json, text/event-stream` header is present |
| Sandbox errors | Server needs write access to `.sandboxes/` directory |
| Publishing fails | Verify `LINK_PLATFORM_PAT` and `LINK_PLATFORM_HANDLE` are set |
| Strategy not found | Run `strategy_list` to see available strategies |
| DynamoDB errors | Ensure DynamoDB is running on port 3006 |

## Production Services

| Service | Endpoint |
|---------|----------|
| Marketing Manager MCP | `https://mcp.10x.in` |
| Link Platform API | `https://api.10x.in` |
| Temporal Cloud | `us-east-1.aws.api.temporal.io:7233` |
| DynamoDB | AWS managed (ap-south-1) |
