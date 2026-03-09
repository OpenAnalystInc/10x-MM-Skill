# Server Capabilities

## Prerequisites

Server capabilities require authentication. The platform uses a **dual auth model**:

- **JWT (Cognito ID token, `eyJ...`)**: Required for control-plane operations — site-deployments, profile, pages, agent proposals/runs. Expires every 1 hour.
- **PAT (`patv1_*`)**: Required for automation endpoints — links CRUD, tracking, analytics, webhooks. Long-lived.

### Access Tiers
- **Full tier** (valid PAT + JWT available): All MCP tools + direct API operations
- **Local tier** (BYOK key only): Local skills only — no server capabilities
- **None tier**: Nothing works. Direct to /setup.

Before calling any Link Platform tool, verify the PAT is present and not expired. For site-deployments (page hosting), a JWT (Cognito ID token) is required — PAT alone is insufficient.

## Architecture

Each user gets their own MCP server at `https://{handle}.mcp.10x.in`. The server runs a **Claude Code instance** (the leader) that processes tool calls on the user's behalf.

```
Local Assistant (you)
  → MCP Streamable HTTP (Bearer USER_PAT) →
    User's MCP Server (https://{handle}.mcp.10x.in)
      └── Claude Code Leader (tests, fixes, deploys)
          └── Link Platform API (https://api.10x.in) — handled internally
```

**This is NOT a simple API proxy.** The server's Claude Code instance:
- Receives your Link Platform tool calls
- Processes them intelligently (testing, fixing, deciding)
- Calls the Link Platform API on your behalf
- Returns results back through MCP

**MCP proxy size limitation**: The MCP proxy has a payload size limit (~1KB). Large HTML content cannot be passed through MCP tool calls. For page hosting, use the Direct API (site-deployments) instead.

## API Hosts

| Host | URL | Purpose |
|------|-----|---------|
| Resource API | `https://api.10x.in` | REST API for all platform operations |
| Handle host | `https://{handle}.10x.in` | Live pages served here |
| MCP host | `https://{handle}.mcp.10x.in` | MCP server per user |
| MCP compat path | `https://api.10x.in/mcp/{handle}/mcp` | Alternative MCP access via resource host |

## MCP Session Management

The server maintains sessions in-memory (`Map<string, Transport>`). Each user's session is isolated by their PAT.

**Session lifecycle:**
1. Client sends `initialize` → server creates session, returns `mcp-session-id` header
2. Client stores session ID and reuses it for all subsequent calls
3. Session persists as long as the server process is running
4. If session expires or server restarts: client re-initializes

**IMPORTANT**: Store the `mcp-session-id` locally in `.mm/mcp-session.json` so it survives across tool calls within the same conversation. On conversation start, attempt to reuse the stored session ID before re-initializing.

## What the Server Does

### Content Testing & Deployment
- Accepts HTML/CSS/JS via `agent_start_run`
- Tests content in an isolated sandbox environment
- Runs validation (HTML structure, CSS, links, performance)
- Autonomous fix cycles (max 3 rounds)
- Returns verdict with results

### Page Hosting (Site Deployments) — Direct API

**CRITICAL**: Page hosting is done via the site-deployments Direct API, NOT via `links_upsert`.

```
POST https://api.10x.in/v2/handles/{handle}/site-deployments
Authorization: Bearer {JWT_COGNITO_TOKEN}
Content-Type: application/json
```

**Auth**: JWT (Cognito ID token) required. PAT does NOT work for this endpoint.

**Response**: `201 Created` with deployment object.

**Important**: Deployment files must include a root `index.html` — without it, activation fails with `missing_entrypoint`.

**Activation**: Copies uploaded files into the live `profiles/{handle}/` prefix then marks the deployment active.

#### Preview Endpoint
```
GET /v2/handles/{handle}/site-deployments/{deploymentId}/preview
```
Returns a signed `previewUrl`. Do NOT use raw S3 bucket URLs — the bucket is origin-private behind CloudFront.

#### Site Mode Endpoint
```
PUT /v2/handles/{handle}/site-mode
```
Body: `{"mode":"LINKTREE"}`. Requires JWT with owner role.

#### Single HTML (Inline)
```json
{ "inlineHtml": "<html>...</html>" }
```
Auto-activates to ACTIVE status. Page is immediately live at `{handle}.10x.in`.

#### Multi-File Upload
```json
{
  "files": [
    { "path": "index.html", "contentType": "text/html", "sizeBytes": 1234 },
    { "path": "styles.css", "contentType": "text/css", "sizeBytes": 567 }
  ]
}
```
Returns S3 pre-signed `putUrls` for each file. Upload via `PUT` to each URL.

### Strategy Lifecycle
- Creates and manages marketing strategies via `agent_create_proposal` (requires `idempotencyKey` + `strategyId`)
- Generates strategies via `agent_generate_strategy` (requires `idempotencyKey`)
- Executes strategies via `agent_start_run` (requires `proposalId`)
- Publishing strategy output to live pages is done via **site-deployments Direct API** (NOT `links_upsert`)
- Performance tracking with `analytics_get` and `analytics_campaign_health`

### Campaigns (JWT-required handle control plane)
- `POST /v2/handles/{handle}/campaigns` — Create campaigns (JWT, returns `201 Created`)
- `POST /v2/handles/{handle}/campaigns/{campaignId}/health` — Campaign health check (JWT)

### Quality Gate
- Server acts as leader in leader/subordinate architecture
- Reviews local work submitted via `agent_start_run`
- Returns verdict: approved, needs_revision, or rejected
- Runs full audits via `system_audit_events`

### Link Platform (internal)
- Links, tracking, routing, analytics managed internally
- Exposed to users through Link Platform tools:
  - **Redirect links**: `links_upsert` (`slug`, `payload: { destinationUrl }`) — creates 302 redirects ONLY
  - **Link listing**: `links_list`
  - **Page hosting**: Direct API site-deployments (`POST /v2/handles/{handle}/site-deployments`) — NOT via `links_upsert`
  - **Analytics**: `analytics_get`
  - **Domains**: `routing_list_context_origins`

### Scheduling
- Cron-based scheduled tasks via `webhooks_create`
- Types: health_check, data_sync, report_generation, link_health_monitor

### WebMCP — Page Relay
- Embed snippet via `tracking_list_templates`
- Enables AI-powered interaction with live pages via SSE relay

## Health Check

```bash
curl https://{handle}.mcp.10x.in/health
# Expected: {"status":"ok", "version":"3.0.0", "userTools":37, ...}
```

Or use the `system_health` tool after initializing a session.

## Upload Modes

| Mode | Endpoint | Auth | Best For |
|------|----------|------|----------|
| **Single HTML** | `POST /v2/handles/{handle}/site-deployments` with `inlineHtml` | JWT | Single-page sites, inline CSS/JS |
| **Multi-File** | `POST /v2/handles/{handle}/site-deployments` with `files` array | JWT | Pages with separate CSS/JS files |
| **Redirect Link** | `PUT /v2/public/handles/{handle}/links/{slug}` with `destinationUrl` | PAT | Short links, 302 redirects only |

**WARNING**: `links_upsert` does NOT host HTML pages. It only creates redirect links. The `html` parameter is accepted but IGNORED. Always use site-deployments for page hosting.

## Authentication

### Dual Auth Model

| Token Type | Format | Endpoints | Lifetime |
|------------|--------|-----------|----------|
| JWT (Cognito) | `eyJ...` | `/v2/handles/*` — profile, pages, site-deployments, agent | 1 hour |
| PAT | `patv1_*` | `/v2/public/handles/*` — links, tracking, analytics, webhooks | Long-lived |

**PAT scope families**: `tracking.templates.*`, `tracking.personalization.*`, `routing.context_origins.*`, `analytics.*`, `webhooks.*`, `system.*`

- The MCP server uses PAT for auth (`Bearer USER_PAT`)
- Site-deployments (page hosting) requires JWT — cannot use PAT
- Handle 401 errors by asking user to refresh their token from 10x.in profile settings
