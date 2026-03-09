# Marketing Manager — MCP & WebMCP Documentation

This document covers the two MCP layers in the Marketing Manager system and how any client can connect to them.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR AI CLIENT                        │
│         (Claude Code, Cursor, Claude Desktop,            │
│          Windsurf, or any MCP-compatible client)         │
└────────────────────────┬────────────────────────────────┘
                         │
                         │  MCP Streamable HTTP
                         │  (JSON-RPC 2.0 over HTTP POST)
                         ▼
┌─────────────────────────────────────────────────────────┐
│            MARKETING MANAGER MCP SERVER                  │
│                    (80 Tools)                             │
│                                                          │
│  Port 3100 (local) / mcp.10x.in (production)            │
│                                                          │
│  ┌──────────────┐  ┌──────────┐  ┌───────────────┐     │
│  │  DynamoDB     │  │ Sandbox  │  │ Link Platform │     │
│  │  (strategies, │  │ (code    │  │ (pages, links,│     │
│  │   branches)   │  │  exec)   │  │  analytics)   │     │
│  └──────────────┘  └──────────┘  └───────────────┘     │
│                                                          │
│  ┌──────────────┐  ┌──────────┐  ┌───────────────┐     │
│  │  Testing      │  │ Handoff  │  │  Scheduling   │     │
│  │  (validation) │  │ (leader/ │  │  (Temporal     │     │
│  │              │  │  sub)    │  │   cron jobs)   │     │
│  └──────────────┘  └──────────┘  └───────────────┘     │
└─────────────────────────────────────────────────────────┘
                         │
                         │  Proxy (82 tools)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              LINK PLATFORM MCP (Port 3200)               │
│                                                          │
│  Pages, Links, Analytics, Tracking, Routing,             │
│  Webhooks, Agent Operations                              │
│  Published pages live at: {handle}.10x.in/{slug}         │
└─────────────────────────────────────────────────────────┘
                         │
                         │  Every published page includes:
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    WebMCP (Client-Side)                   │
│                                                          │
│  Embedded in every landing page as a <script>            │
│  Makes the page itself an MCP server                     │
│  AI agents can read, click, fill forms, track            │
│  window.__webmcp.getContext() exposes all tools          │
└─────────────────────────────────────────────────────────┘
```

---

## Part 1: Marketing Manager MCP Server (80 Tools)

### What It Is

A server that exposes 121 tools via the MCP (Model Context Protocol) Streamable HTTP transport. Any AI client that supports MCP can connect and use all 121 tools — strategy management, sandbox code execution, page publishing, analytics, scheduling, testing, and more.

### How It Works

The server speaks **JSON-RPC 2.0 over HTTP POST** with Server-Sent Events (SSE) responses.

**Connection flow:**
1. Client sends `initialize` request → gets session ID in response header
2. Client includes `mcp-session-id` in all subsequent requests
3. Client calls `tools/call` with tool name and arguments
4. Server returns results as SSE `data:` lines

### Connecting from Any Client

**Endpoint:** `https://mcp.10x.in/mcp`

**Required Headers:**
```
Content-Type: application/json
Accept: application/json, text/event-stream
Authorization: Bearer YOUR_PAT_HERE
```

### Client Configuration Examples

#### Claude Code
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
Save as `.mcp.json` in your project root or `~/.claude/.mcp.json` globally.

#### Cursor
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
Save as `.cursor/mcp.json` in your project root.

#### Claude Desktop
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
Save to:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

#### Windsurf
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
Save to `~/.codeium/windsurf/mcp_config.json`.

#### Any MCP Client (Raw HTTP)

**Step 1: Initialize**
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

Response (SSE):
```
event: message
data: {"result":{"serverInfo":{"name":"marketing-manager-mcp","version":"3.0.0"},"capabilities":{"tools":{"listChanged":true}}},"jsonrpc":"2.0","id":1}
```

Save the `mcp-session-id` response header for all subsequent requests.

**Step 2: List Tools**
```bash
curl -X POST https://mcp.10x.in/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer YOUR_PAT_HERE" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

**Step 3: Call a Tool**
```bash
curl -X POST https://mcp.10x.in/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer YOUR_PAT_HERE" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "strategy_list",
      "arguments": {"namespace": "default"}
    }
  }'
```

### All 121 Tools

#### Link Platform (82 tools) — `lp_*`

| Tool | Description |
|------|-------------|
| `lp_health` | Server + monolith connectivity check |
| `lp_usage_meters` | Get usage/rate limit data |
| `lp_audit_events` | List audit events |
| `lp_links_list` | List all links for a handle |
| `lp_links_upsert` | Create/update a link |
| `lp_links_health_check` | Run destination health checks |
| `lp_links_route_preview` | Preview routing decision for a link |
| `lp_tracking_list_templates` | List tracking templates |
| `lp_tracking_upsert_template` | Upsert tracking template (meta_pixel, ga4, etc.) |
| `lp_tracking_list_rules` | List A/B personalization rules |
| `lp_tracking_upsert_rule` | Upsert personalization rule |
| `lp_tracking_resolve_context` | Resolve CTX token into attribution + vars |
| `lp_tracking_write_signal` | Write a chain signal |
| `lp_tracking_resolve_chain` | Resolve chain trigger decision |
| `lp_routing_list_origins` | List allowlisted browser origins |
| `lp_routing_update_origins` | Replace allowlisted browser origins |
| `lp_routing_read_session` | Read a chain session (signals + state) |
| `lp_routing_prefetch` | Prefetch multiple chain trigger decisions |
| `lp_analytics_get` | Get click/conversion rollups |
| `lp_analytics_export` | Export analytics data |
| `lp_analytics_campaign_health` | Campaign health via agent discovery |
| `lp_webhooks_list` | List webhook subscriptions |
| `lp_webhooks_create` | Create webhook subscription |
| `lp_webhooks_delete` | Delete webhook subscription |
| `lp_webhooks_test` | Send test event to webhook |
| `lp_agent_discover` | Agent discovery for marketing signals |
| `lp_agent_generate_strategy` | Generate strategy recommendations |
| `lp_agent_list_proposals` | List proposals with status filter |
| `lp_agent_create_proposal` | Create an execution proposal |
| `lp_agent_approve_proposal` | Approve a pending proposal |
| `lp_agent_reject_proposal` | Reject a pending proposal |
| `lp_agent_start_run` | Start an execution run |
| `lp_agent_get_run_status` | Get run status with step details |
| `lp_agent_rollback_run` | Rollback a completed run |
| `lp_pages_list` | List all pages for a handle |
| `lp_pages_create` | Create a new page (HTML content → S3) |
| `lp_pages_get` | Get page details by slug |
| `lp_pages_update` | Update existing page content |
| `lp_pages_publish` | Publish draft page → live at `{handle}.10x.in/{slug}` |
| `lp_pages_preview` | Preview a page (returns rendered HTML) |
| `lp_pages_delete` | Delete a page and its S3 content |

#### Strategy Management (9 tools) — `strategy_*`

| Tool | Description |
|------|-------------|
| `strategy_create_draft` | Create new strategy as draft (auto-creates data branch) |
| `strategy_list` | List all strategies, filter by status |
| `strategy_get` | Get full strategy details + performance data |
| `strategy_publish` | Publish draft → live |
| `strategy_discard` | Discard strategy (kept for history) |
| `strategy_archive` | Archive live strategy for reference |
| `strategy_update_performance` | Update metrics (clicks, conversions) |
| `strategy_insights` | Analytics insights across all strategies |
| `strategy_compare` | Compare two strategies side-by-side |

#### Data Branching (8 tools) — `branch_*`

| Tool | Description |
|------|-------------|
| `branch_create` | Create strategy branch with table isolation |
| `branch_list` | List branch registrations |
| `branch_get` | Get branch details with table registrations |
| `branch_merge` | Merge branch into target |
| `branch_delete` | Delete branch and cleanup data |
| `branch_snapshot` | Create frozen snapshot of a source table |
| `branch_add_columns` | Add columns to shared table for branch |
| `branch_query` | Query data within branch scope |

#### Handoff (6 tools) — `handoff_*`

| Tool | Description |
|------|-------------|
| `handoff_submit` | Local → Server: submit content for validation |
| `handoff_respond` | Server → Local: return validated content |
| `table_decision` | Intelligent table isolation decision |
| `handoff_task_assign` | Server assigns task to local agent |
| `handoff_task_complete` | Local submits completed work for review |
| `handoff_review_response` | Server returns review results |

#### Testing (5 tools) — `test_*`

| Tool | Description |
|------|-------------|
| `test_full_suite` | Complete test suite (HTML + links + CSS + performance) |
| `test_validate_html` | HTML structure, accessibility, WebMCP |
| `test_check_links` | Verify all URLs are reachable |
| `test_validate_css` | Design system compliance |
| `test_check_performance` | File size, lazy loading, deferred scripts |

#### Scheduling (5 tools) — `schedule_*`

| Tool | Description |
|------|-------------|
| `schedule_create` | Create recurring cron job |
| `schedule_list` | List all scheduled tasks |
| `schedule_pause` | Pause a scheduled task |
| `schedule_resume` | Resume a paused task |
| `schedule_delete` | Delete a scheduled task |

#### Sandbox (4 tools) — `sandbox_*`

| Tool | Description |
|------|-------------|
| `sandbox_run_code` | Execute code in isolated sandbox (node/python/bash) |
| `sandbox_preview` | Generate preview URL for sandbox output |
| `sandbox_deploy` | Deploy sandbox output to live platform |
| `sandbox_status` | Check sandbox state and list sandboxes |

#### Session (2 tools) — `session_*`

| Tool | Description |
|------|-------------|
| `session_list` | List all active server sessions |
| `session_status` | Get detailed session status |

---

## Part 2: Skills MCP Config (Local Machine)

### What It Is

The `.mcp.json` file in the Marketing-Manager-Skill folder tells your local AI client (Claude Code) how to connect to the Marketing Manager MCP Server. This is what makes the 121 tools available locally.

### How It Works

```
Your Local Machine
├── Marketing-Manager-Skill/
│   ├── .mcp.json          ← Tells Claude Code where the MCP server is
│   ├── .env               ← Your credentials (PAT tokens)
│   ├── .claude/
│   │   ├── agents/        ← 6 AI agents that use the MCP tools
│   │   ├── skills/        ← 25 skills that generate content locally
│   │   ├── commands/      ← 5 slash commands (/setup, /health, /deploy, etc.)
│   │   └── knowledge/     ← Reference docs for agents
│   └── .claude-plugin/
│       └── plugin.json    ← Plugin metadata
│
└── Marketing-Manager-Server/
    └── (running on port 3100)  ← The MCP server the .mcp.json points to
```

### The .mcp.json File

```json
{
  "mcpServers": {
    "marketing-manager-mcp": {
      "type": "url",
      "url": "https://${LINK_PLATFORM_HANDLE}.mcp.10x.in/mcp",
      "headers": {
        "Authorization": "Bearer ${USER_PAT}"
      }
    }
  }
}
```

- `LINK_PLATFORM_HANDLE` — your 10x.in handle; MCP URL is derived as `https://{handle}.mcp.10x.in`
- `USER_PAT` — your personal access token from `.env`

### What Happens When You Use It

1. You open Claude Code in the Skill folder (or install it as a skill)
2. Claude Code reads `.mcp.json` and connects to the MCP server
3. All 121 tools become available as MCP tool calls
4. The 6 agents orchestrate the 25 skills AND the 121 MCP tools together
5. Skills generate content locally (landing pages, copy, design)
6. MCP tools handle server operations (DynamoDB, sandbox, publishing, testing)

### The Agent-Skill-MCP Pipeline

```
User: "Build me a landing page"
        │
        ▼
Agency Director (agent)
        │
        ├──► Growth Strategist → strategy_create_draft (MCP tool)
        │
        ├──► Creative Director → landing-page skill (local)
        │       ├── Discovery Agent
        │       ├── Copywriting Agent
        │       └── Design Agent
        │
        ├──► Technical Lead → Build Agent (local)
        │       ├── Generates HTML with WebMCP snippet
        │       └── sandbox_run_code + sandbox_preview (MCP tools)
        │
        ├──► QA Director → test_full_suite (MCP tool)
        │       └── Verifies WebMCP integration
        │
        └──► Campaign Manager
                ├── lp_pages_create (MCP tool)
                ├── lp_pages_publish (MCP tool)
                ├── lp_links_upsert (MCP tool)
                └── strategy_publish (MCP tool)

Result: Page live at {handle}.10x.in/{slug}
        with WebMCP enabled for agent interaction
```

---

## Part 3: WebMCP (Client-Side Agentic Web)

### What It Is

WebMCP is a JavaScript snippet embedded in every landing page that turns the page into an MCP server. Any AI agent visiting the page can discover interactive elements, read content, click buttons, fill forms, and track conversions — without API keys.

### How It Works

Every landing page built by the Marketing Manager Skill includes this WebMCP snippet before `</body>`:

```html
<!-- WebMCP Integration — Agentic Web -->
<script>
(function() {
  var WEBMCP_VERSION = '1.0.0';
  var pageTools = [];

  function discoverTools() {
    // Discover all clickable elements
    document.querySelectorAll('a[href], button[type="submit"], .cta').forEach(function(el, i) {
      var name = el.getAttribute('toolname') || 'click_' + (el.textContent || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
      var desc = el.getAttribute('tooldescription') || 'Click: ' + (el.textContent || '').trim().slice(0, 60);
      el.setAttribute('toolname', name);
      el.setAttribute('tooldescription', desc);
      pageTools.push({ name: name, description: desc, element: el, type: 'click' });
    });

    // Discover all forms
    document.querySelectorAll('form').forEach(function(form, i) {
      var name = form.getAttribute('toolname') || 'submit_form_' + (form.id || i);
      var desc = form.getAttribute('tooldescription') || 'Submit form: ' + (form.id || 'form_' + i);
      form.setAttribute('toolname', name);
      form.setAttribute('tooldescription', desc);
      var fields = [];
      form.querySelectorAll('input, select, textarea').forEach(function(field) {
        if (field.type !== 'hidden' && field.type !== 'submit') {
          fields.push({ name: field.name || field.id, type: field.type || 'text', required: field.required });
        }
      });
      pageTools.push({ name: name, description: desc, element: form, type: 'form', fields: fields });
    });

    // Discover all readable sections
    document.querySelectorAll('section, [data-section]').forEach(function(section, i) {
      var name = 'read_section_' + (section.id || section.dataset.section || i);
      var heading = section.querySelector('h1,h2,h3');
      var desc = 'Read content: ' + (heading ? heading.textContent.trim() : 'Section ' + i);
      section.setAttribute('toolname', name);
      section.setAttribute('tooldescription', desc);
      pageTools.push({ name: name, description: desc, element: section, type: 'read' });
    });

    console.log('[WebMCP] Discovered ' + pageTools.length + ' tools');
  }

  function getPageContext() {
    return {
      url: window.location.href,
      title: document.title,
      description: (document.querySelector('meta[name="description"]') || {}).content || '',
      tools: pageTools.map(function(t) { return { name: t.name, description: t.description, type: t.type }; }),
      sections: Array.from(document.querySelectorAll('section, [data-section]')).map(function(s) {
        var h = s.querySelector('h1,h2,h3');
        return { id: s.id || s.dataset.section, heading: h ? h.textContent.trim() : null, text: s.textContent.trim().slice(0, 200) };
      }),
      webmcpVersion: WEBMCP_VERSION
    };
  }

  window.__webmcp = {
    version: WEBMCP_VERSION,
    tools: pageTools,
    getContext: getPageContext,
    discoverTools: discoverTools
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', discoverTools);
  } else {
    discoverTools();
  }
})();
</script>
```

### What Gets Discovered

The WebMCP snippet auto-discovers three types of tools:

| Type | HTML Elements | Tool Name Pattern | What Agents Can Do |
|------|--------------|-------------------|-------------------|
| **click** | `<a>`, `<button>`, `.cta` | `click_*` or custom `toolname` | Click links, buttons, CTAs |
| **form** | `<form>` | `submit_form_*` or custom `toolname` | Fill and submit forms |
| **read** | `<section>`, `[data-section]` | `read_section_*` | Read section content |

### HTML Attributes for WebMCP

Every interactive element should have these attributes:

```html
<!-- Links and buttons -->
<a href="/signup"
   toolname="signup_cta"
   tooldescription="Sign up for the product">
  Get Started
</a>

<!-- Forms -->
<form id="contact"
      toolname="contact_form"
      tooldescription="Submit contact information">
  <input type="email" name="email" required />
  <button type="submit"
          toolname="submit_contact"
          tooldescription="Submit the contact form">
    Send
  </button>
</form>

<!-- Sections -->
<section id="pricing" data-section="pricing">
  <h2>Pricing Plans</h2>
  <!-- content -->
</section>
```

### Using WebMCP from Any Client

#### Browser Console (Testing)
```javascript
// See all discovered tools
window.__webmcp.getContext()

// List tool names
window.__webmcp.tools.map(t => t.name + ' (' + t.type + ')')

// Get page context (what an agent sees)
JSON.stringify(window.__webmcp.getContext(), null, 2)
```

#### AI Agent (Programmatic)
Any AI agent that can execute JavaScript on a page can interact via WebMCP:

```javascript
// 1. Discover what's available
const context = window.__webmcp.getContext();

// 2. Read a section
const heroSection = context.sections.find(s => s.id === 'hero');
console.log(heroSection.heading, heroSection.text);

// 3. Click a CTA
const signupTool = window.__webmcp.tools.find(t => t.name === 'signup_cta');
signupTool.element.click();

// 4. Fill and submit a form
const formTool = window.__webmcp.tools.find(t => t.name === 'contact_form');
const emailField = formTool.element.querySelector('input[name="email"]');
emailField.value = 'test@example.com';
formTool.element.submit();
```

#### WebSocket / Real-Time (Future)
The portfolio demo page includes a WebSocket manager for real-time features (live activity feed, visitor count). When a WebSocket server is available at the same host, the page connects automatically:

```javascript
// WebSocket connects to: ws(s)://{page-host}/ws
// Falls back to demo mode if no WebSocket server
```

This is extensible — when you add a WebSocket server to your infrastructure, pages will auto-connect for real-time agent interaction.

---

## Part 4: How the Server Uses This Same MCP

The Marketing Manager Server itself is an MCP client when it connects to the Link Platform MCP on port 3200. The same protocol works in both directions:

```
Any AI Client ──MCP──► Marketing Manager Server ──MCP──► Link Platform
     (you)              (port 3100, 121 tools)        (port 3200, 39 tools)
```

The server proxies 41 `lp_*` tools from the Link Platform MCP. When you call `lp_pages_create` from your client, the server:
1. Receives your MCP request
2. Forwards it to the Link Platform MCP on port 3200
3. Returns the response back to you

This means:
- **You** connect to ONE server (port 3100) and get ALL 121 tools
- **The server** handles the connection to Link Platform, DynamoDB, Temporal, and Sandbox internally
- **You don't need** to connect to multiple MCP servers separately

### Server-to-Server MCP Connection

The server connects to Link Platform MCP the same way any client connects:

```javascript
// Server's internal MCP client (src/mcp-server/clients/link-platform-mcp.ts)
{
  clientInfo: { name: 'marketing-manager-server', version: '3.0.0' },
  url: 'https://api.10x.in/mcp',  // Link Platform MCP
  headers: { Authorization: 'Bearer patv1_local_dev' }
}
```

---

## Quick Reference

### Endpoints

| What | Endpoint |
|------|----------|
| MCP Server | `https://mcp.10x.in/mcp` |
| Health Check | `https://mcp.10x.in/health` |
| Sandbox Preview | `https://mcp.10x.in/preview/{id}` |
| Published Pages | N/A | `{handle}.10x.in/{slug}` |

### Authentication

| Credential | Purpose | Where It Goes |
|-----------|---------|---------------|
| `USER_PAT` | MCP Server access | `Authorization: Bearer {PAT}` header |
| `LINK_PLATFORM_PAT` | Link Platform API | Used internally by server |
| `LINK_PLATFORM_HANDLE` | Your 10x.in handle | Used for page publishing |

### Production Services

| Service | Endpoint |
|---------|----------|
| Marketing Manager MCP | `https://mcp.10x.in` |
| Link Platform API | `https://api.10x.in` |
| Temporal Cloud | `us-east-1.aws.api.temporal.io:7233` |
| DynamoDB | AWS managed (ap-south-1) |

### Health Check

```bash
curl https://mcp.10x.in/health
# Expected: {"status":"ok","version":"3.0.0","transport":"http","tools":80}
```
