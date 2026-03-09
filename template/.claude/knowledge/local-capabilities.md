# Local Capabilities

## Prerequisites

Local capabilities require at minimum a BYOK API key in `.env` (local tier), or a valid PAT (full tier). Without either, the AI assistant cannot function. Check tier with `10x-mm auth` or `/health`.

- **Full tier** (valid PAT): All local + server capabilities
- **Local tier** (BYOK only): All local capabilities listed below. Server features (Link Platform tools) blocked.
- **None tier**: Nothing works. Run /setup.

## What Local CAN Do

- **File Operations** — Read, write, edit files in user's workspace
- **Content Generation** — Run 25 marketing skills (landing pages, copy, design, SEO, analytics, funnels, leads, A/B testing)
- **User Interaction** — Ask questions, present options, show progress
- **Sync** — Run `/sync` to cache all platform data locally
- **Git Operations** — Branches, commits, PRs
- **Skill Orchestration** — Coordinate agents: discovery → copy → design → build → QA → launch
- **Session Tracking** — Log every Link Platform tool call to `.mm/sessions/current.json`, archive completed sessions, maintain `.mm/context.json` rolling summary for cross-session continuity
- **MCP Session Management** — Store and reuse `mcp-session-id` for persistent server connection within a conversation

## What Local CANNOT Do (Use Server MCP)

- **Testing** — Submit via `agent_start_run` for server validation
- **Publishing** — Use `links_upsert` (with publish payload including `slug`, `title`, `html`)
- **Auditing** — Cannot run audits locally. Use `system_audit_events`
- **Analytics** — Cannot query analytics directly. Use `analytics_get`
- **Scheduling** — Cannot create scheduled tasks. Use `webhooks_create` / `webhooks_list`
- **Link Management** — Cannot manage links directly. Use `links_upsert` / `links_list`
- **Domain Management** — Cannot manage domains directly. Use `routing_list_context_origins`

## MCP Connection

Each user gets their own MCP server:
```
URL:  https://{handle}.mcp.10x.in
Auth: Bearer {USER_PAT}
```

The `.mcp.json` config points to this URL. The `{handle}` comes from `LINK_PLATFORM_HANDLE` in `.env`.

### Session Persistence

The MCP session ID must persist across tool calls within a conversation:
1. On first Link Platform tool call: initialize session, store ID in `.mm/mcp-session.json`
2. On subsequent calls: include stored ID in `mcp-session-id` header
3. On new conversation: try to reuse stored session ID first
4. On 404/invalid session: re-initialize and store new ID

## Common Mistakes to Avoid

1. Use only Link Platform tools — never try to call internal `lp_*`, `branch_*`, `sandbox_*`, `test_*`, `handoff_*`, or `schedule_*` tools directly
2. MCP requests MUST include `Accept: application/json, text/event-stream`
3. Parse SSE responses: look for `data: {...}` line to get JSON-RPC result
4. Store and reuse `mcp-session-id` — do not create a new session per tool call
5. The URL is `https://{handle}.mcp.10x.in` — NOT `/user-mcp` or `/mcp`
6. Tool params use `slug`, `html`, `title` — NOT `pageSlug`, `contentHtml`
7. `links_upsert` (publish) requires full HTML content, not just a slug
8. PAT (JWT) expires every 1 hour — handle 401 errors gracefully
