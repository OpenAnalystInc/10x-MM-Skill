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

## What Local CANNOT Do (Use Server MCP or Direct API)

- **Testing** — Submit via `agent_start_run` for server validation
- **Page Hosting** — Use site-deployments Direct API (`POST /v2/handles/{handle}/site-deployments` with `inlineHtml` or `files`). Requires JWT (Cognito ID token). PAT does NOT work for this.
- **Creating Redirect Links** — Use `links_upsert` (creates 302 redirects to a `destinationUrl` only — does NOT host HTML pages)
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

**MCP proxy size limitation**: The MCP proxy has a payload size limit (~1KB). Large HTML content cannot be passed through MCP. For page hosting, use the Direct API (site-deployments) instead.

### API Hosts

| Host | URL | Purpose |
|------|-----|---------|
| Resource API | `https://api.10x.in` | REST API for all platform operations |
| Handle host | `https://{handle}.10x.in` | Live pages served here |
| MCP host | `https://{handle}.mcp.10x.in` | MCP server per user |

### Session Persistence

The MCP session ID must persist across tool calls within a conversation:
1. On first Link Platform tool call: initialize session, store ID in `.mm/mcp-session.json`
2. On subsequent calls: include stored ID in `mcp-session-id` header
3. On new conversation: try to reuse stored session ID first
4. On 404/invalid session: re-initialize and store new ID

## Authentication — Dual Model

| Token | Format | Scope | Lifetime |
|-------|--------|-------|----------|
| JWT (Cognito) | `eyJ...` | `/v2/handles/*` control plane — site-deployments, profile, pages, agent | 1 hour |
| PAT | `patv1_*` | `/v2/public/handles/*` automation — links, tracking, analytics, webhooks | Long-lived |

- MCP server uses PAT for auth
- Site-deployments (page hosting) requires JWT — PAT alone is insufficient
- `links_upsert` creates redirect links only (NOT pages) — works with PAT

## Common Mistakes to Avoid

1. **Using `links_upsert` for page hosting** — `links_upsert` creates REDIRECT LINKS (302) only. The `html` parameter is accepted but IGNORED. Use site-deployments Direct API for page hosting.
2. **Wrong auth for site-deployments** — Site-deployments requires JWT (Cognito ID token). PAT (`patv1_*`) will NOT work.
3. **Passing large HTML through MCP** — MCP proxy has ~1KB payload limit. Use Direct API for page content.
4. Use only Link Platform tools — never try to call internal `lp_*`, `branch_*`, `sandbox_*`, `test_*`, `handoff_*`, or `schedule_*` tools directly
5. MCP requests MUST include `Accept: application/json, text/event-stream`
6. Parse SSE responses: look for `data: {...}` line to get JSON-RPC result
7. Store and reuse `mcp-session-id` — do not create a new session per tool call
8. The URL is `https://{handle}.mcp.10x.in` — NOT `/user-mcp` or `/mcp`
9. Tool params use `slug`, `html`, `title` — NOT `pageSlug`, `contentHtml`
10. PAT (JWT) expires every 1 hour — handle 401 errors gracefully
11. `agent_create_proposal` requires `idempotencyKey` (<=128 chars) + `strategyId`
12. `agent_start_run` requires `proposalId`
13. `agent_generate_strategy` requires `idempotencyKey`
