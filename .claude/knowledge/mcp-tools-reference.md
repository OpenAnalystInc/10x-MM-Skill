# MCP Tools Reference (37 Link Platform tools)

## Connection

Each user gets their own MCP server at their handle subdomain:
```
URL:    https://{handle}.mcp.10x.in/mcp
Auth:   Authorization: Bearer {USER_PAT}
Accept: application/json, text/event-stream
```

The MCP server processes tool calls on the user's behalf. It is NOT a simple API proxy.

## API Hosts

| Host | URL | Purpose |
|------|-----|---------|
| Resource API | `https://api.10x.in` | REST API for all platform operations |
| Handle host | `https://{handle}.10x.in` | Live pages served here |
| MCP host | `https://{handle}.mcp.10x.in` | MCP server per user |
| MCP compat path | `https://api.10x.in/mcp/{handle}/mcp` | Alternative MCP access via resource host |

## Protocol: Streamable HTTP + JSON-RPC

All calls are JSON-RPC 2.0 over HTTP POST. Responses arrive as SSE (Server-Sent Events).

### Session Lifecycle

**CRITICAL**: You MUST initialize a session before calling any tools. The session ID must persist for the entire conversation.

```
1. POST initialize → get mcp-session-id from response header
2. Store session ID in .mm/mcp-session.json
3. All subsequent tool calls include: mcp-session-id: {id} header
4. On next conversation: read stored session ID, attempt to reuse it
5. If session expired: re-initialize and store new ID
```

### Request Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "links_upsert",
    "arguments": { "slug": "go-summer", "payload": { "destinationUrl": "https://example.com/summer", "title": "Summer Sale" } }
  }
}
```

### Response Format (SSE)
```
event: message
data: {"result":{"content":[{"type":"text","text":"..."}]},"jsonrpc":"2.0","id":1}
```

Parse the `data:` line to extract the JSON-RPC result. The `content[0].text` field contains the tool response (often JSON stringified).

### Authentication — Dual Model

Two auth tokens serve different purposes:

- **JWT (Cognito ID token, `eyJ...`)**: Required for `/v2/handles/*` control-plane endpoints — profile, pages, site-deployments, agent proposals/runs. Expires every 1 hour.
- **PAT (`patv1_*`)**: For `/v2/public/handles/*` automation endpoints — links CRUD, tracking, analytics, webhooks. Long-lived.
  PAT scope families (wildcards supported): `tracking.templates.*`, `tracking.personalization.*`, `routing.context_origins.*`, `analytics.*`, `webhooks.*`, `system.*`
- **MCP server** accepts PAT for auth (`Bearer USER_PAT`).
- If you get 401/unauthorized, the token may need refreshing.
- Tell the user: "Your PAT has expired. Get a fresh one from profile.10x.in."

**MCP proxy size limitation**: The MCP proxy has a payload size limit (~1KB) — you cannot pass large HTML content through MCP tool calls. For page hosting, use the Direct API (site-deployments) instead.

---

## Agent (9 tools)

### agent_create_proposal
Create an execution proposal for a marketing strategy or action.
- **API Endpoint**: `POST /v2/handles/{handle}/agent/proposals`
- **Auth**: JWT required
- **IMPORTANT**: Requires `idempotencyKey` (<=128 chars) and `strategyId` in the payload.
```json
{ "payload": "object (required)", "handle?": "string" }
```

### agent_generate_strategy
Generate strategy recommendations based on handle data.
- **API Endpoint**: `POST /v2/handles/{handle}/agent/strategies`
- **Auth**: JWT required
- **IMPORTANT**: Requires `idempotencyKey` (<=128 chars) in the payload.
```json
{ "handle?": "string" }
```

### agent_list_proposals
List proposals with optional status filter.
- **API Endpoint**: `GET /v2/handles/{handle}/agent/proposals`
- **Auth**: JWT required
```json
{ "status?": "string", "handle?": "string" }
```
Valid status values: `draft`, `live`, `discarded`, `archived`, `pending`, `approved`, `rejected`

### agent_approve_proposal
Approve a pending proposal.
- **API Endpoint**: `POST /v2/handles/{handle}/agent/proposals/{proposalId}/approve`
- **Auth**: JWT required
```json
{ "proposalId": "string (required)", "handle?": "string" }
```

### agent_reject_proposal
Reject a pending proposal.
- **API Endpoint**: `POST /v2/handles/{handle}/agent/proposals/{proposalId}/reject`
- **Auth**: JWT required
```json
{ "proposalId": "string (required)", "handle?": "string" }
```

### agent_start_run
Start an execution run (replaces submit_work — tests, validates, optionally publishes).
- **API Endpoint**: `POST /v2/handles/{handle}/agent/runs`
- **Auth**: JWT required
- **IMPORTANT**: Requires `proposalId` in the payload.
```json
{ "payload": "object (required)", "handle?": "string" }
```

### agent_get_run_status
Get run status with step details.
- **API Endpoint**: `GET /v2/handles/{handle}/agent/runs/{runId}`
- **Auth**: JWT required
```json
{ "runId": "string (required)", "handle?": "string" }
```

### agent_rollback_run
Rollback a completed run.
- **API Endpoint**: `POST /v2/handles/{handle}/agent/runs/{runId}/rollback`
- **Auth**: JWT required
```json
{ "runId": "string (required)", "handle?": "string" }
```

### agent_discover
Run agent discovery for marketing signals and opportunities.
- **API Endpoint**: `POST /v2/handles/{handle}/agent/discover`
- **Auth**: JWT required
- **Note**: Takes discovery filter in request body
```json
{ "handle?": "string" }
```

---

## Analytics (3 tools)

### analytics_get
Get click/conversion rollups and performance data.
- **API Endpoint**: `GET /v2/public/handles/{handle}/analytics`
- **Auth**: PAT
```json
{ "handle?": "string" }
```
Returns: `{ handle, analytics, campaignHealth }`

### analytics_campaign_health
Campaign health overview via agent discovery.
- **API Endpoint**: `GET /v2/public/handles/{handle}/analytics` (campaign subset)
- **Auth**: PAT
```json
{ "handle?": "string" }
```

### analytics_export
Export analytics data for external use.
- **API Endpoint**: `GET /v2/public/handles/{handle}/analytics/export`
- **Auth**: PAT
```json
{ "handle?": "string" }
```

---

## Forms (2 tools)

### forms_feedback_record
Record form submission feedback.
```json
{ "payload": "object (required)", "handle?": "string" }
```

### forms_schema_get
Get learned form schema for a handle.
```json
{ "handle?": "string" }
```

---

## Links (5 tools)

### links_upsert
Create or update a **redirect link** (302 redirect). This tool creates SHORT LINKS that redirect to a destination URL. It does NOT host HTML pages.
- **API Endpoint**: `PUT /v2/public/handles/{handle}/links/{slug}`
- **Auth**: PAT
```json
{ "slug": "string (required)", "payload": "object (required)", "handle?": "string" }
```
The `payload` object:
- **Short link (redirect)**: `{ destinationUrl: "https://...", title?: "..." }`

**WARNING**: The `html` parameter may be accepted but is IGNORED. To host HTML pages, use the Direct API site-deployments endpoint (see below).

### links_list
List all links for a handle.
- **API Endpoint**: `GET /v2/public/handles/{handle}/links`
- **Auth**: PAT
```json
{ "handle?": "string" }
```

### links_form_submit
Submit link form values with schema validation.
```json
{ "handle?": "string" }
```

### links_health_check
Run destination health checks on links.
- **API Endpoint**: `POST /v2/public/handles/{handle}/links/health-check`
- **Auth**: PAT
```json
{ "handle?": "string" }
```

### links_route_preview
Preview routing decisions for a link.
- **API Endpoint**: `POST /v2/public/handles/{handle}/links/{slug}/route-preview`
- **Auth**: PAT
```json
{ "handle?": "string" }
```

---

## Routing (4 tools)

### routing_list_context_origins
List allowlisted browser origins (custom domains).
- **API Endpoint**: `GET /v2/public/handles/{handle}/context-origins`
- **Auth**: PAT
```json
{ "handle?": "string" }
```

### routing_update_context_origins
Replace allowlisted browser origins.
- **API Endpoint**: `PUT /v2/public/handles/{handle}/context-origins`
- **Auth**: PAT
```json
{ "payload": "object (required)", "handle?": "string" }
```

### routing_prefetch_decisions
Prefetch multiple chain trigger decisions.
```json
{ "payload": "object (required)", "handle?": "string" }
```

### routing_read_chain_session
Read a chain session (signals + state).
```json
{ "sessionId": "string (required)", "handle?": "string" }
```

---

## System (3 tools)

### system_health
Server and platform connectivity check.
- **API Endpoint**: `GET /v2/system/health`
```json
{ "handle?": "string" }
```

### system_audit_events
List audit events (quality checks, deployments).
- **API Endpoint**: `GET /v2/public/handles/{handle}/audit-events`
- **Auth**: PAT
```json
{ "limit?": "number", "handle?": "string" }
```

### system_usage_meters
Get usage and rate limit data.
- **API Endpoint**: `GET /v2/public/handles/{handle}/usage-meters`
- **Auth**: PAT
```json
{ "handle?": "string" }
```

---

## Tracking (7 tools)

### tracking_list_templates
List tracking templates (embed snippets, WebMCP code).
- **API Endpoint**: `GET /v2/public/handles/{handle}/tracking-templates`
- **Auth**: PAT
```json
{ "handle?": "string" }
```

### tracking_upsert_template
Create or update a tracking template.
- **API Endpoint**: `POST /v2/public/handles/{handle}/tracking-templates`
- **Auth**: PAT
```json
{ "payload": "object (required)", "handle?": "string" }
```

### tracking_list_personalization_rules
List A/B personalization rules.
- **API Endpoint**: `GET /v2/public/handles/{handle}/personalization-rules`
- **Auth**: PAT
```json
{ "handle?": "string" }
```

### tracking_upsert_personalization_rule
Create or update a personalization rule.
- **API Endpoint**: `PUT /v2/public/handles/{handle}/personalization-rules/{ruleId}`
- **Auth**: PAT
```json
{ "ruleId": "string (required)", "payload": "object (required)", "handle?": "string" }
```

### tracking_resolve_chain
Resolve a chain trigger decision.
```json
{ "payload": "object (required)", "handle?": "string" }
```

### tracking_resolve_context
Resolve a CTX token into attribution and variables.
```json
{ "ctx": "string (required)", "handle?": "string" }
```

### tracking_write_signal
Write a chain signal (event tracking).
```json
{ "payload": "object (required)", "handle?": "string" }
```

---

## Webhooks (4 tools)

### webhooks_create
Create a webhook subscription (replaces scheduled tasks).
- **API Endpoint**: `POST /v2/public/handles/{handle}/webhooks`
- **Auth**: PAT
```json
{ "payload": "object (required)", "handle?": "string" }
```

### webhooks_list
List webhook subscriptions.
- **API Endpoint**: `GET /v2/public/handles/{handle}/webhooks`
- **Auth**: PAT
```json
{ "handle?": "string" }
```

### webhooks_delete
Delete a webhook subscription.
- **API Endpoint**: `DELETE /v2/public/handles/{handle}/webhooks/{subscriptionId}`
- **Auth**: PAT
```json
{ "subscriptionId": "string (required)", "handle?": "string" }
```

### webhooks_test
Send a test event to a webhook.
- **API Endpoint**: `POST /v2/public/handles/{handle}/webhooks/{subscriptionId}/test`
- **Auth**: PAT
```json
{ "subscriptionId": "string (required)", "handle?": "string" }
```

---

## Direct API — Site Deployments (Page Hosting)

**CRITICAL**: Pages are NOT hosted via `links_upsert`. That tool only creates redirect links. To deploy HTML pages, use the site-deployments API directly.

### Endpoint
```
POST https://api.10x.in/v2/handles/{handle}/site-deployments
Authorization: Bearer {JWT_COGNITO_TOKEN}
Content-Type: application/json
```

**Auth**: JWT (Cognito ID token) is REQUIRED. PAT (`patv1_*`) does NOT work for this endpoint.

**Returns `201 Created`** on success (not 200).

### Mode 1: Single HTML (Inline)
Deploy a page with inline HTML content. Auto-activates to ACTIVE status; page is immediately live at `{handle}.10x.in`.
```json
{
  "inlineHtml": "<html><head><title>My Page</title></head><body>...</body></html>"
}
```

### Mode 2: Multi-File Upload
Deploy a page with multiple files. Returns S3 pre-signed `putUrls` for upload.
```json
{
  "files": [
    { "path": "index.html", "contentType": "text/html", "sizeBytes": 1234 },
    { "path": "styles.css", "contentType": "text/css", "sizeBytes": 567 },
    { "path": "app.js", "contentType": "application/javascript", "sizeBytes": 890 }
  ]
}
```
Response includes `putUrls` — upload each file to its pre-signed S3 URL via `PUT`.

**Files must include a root `index.html`** — without it, activation fails with `missing_entrypoint`.

You can also pass just `{"note":"creator deploy"}` to create a draft deployment and get upload URLs.

### Activation
Activation copies files into the live `profiles/{handle}/` prefix then marks the deployment active.

### Preview
```
GET /v2/handles/{handle}/site-deployments/{deploymentId}/preview
Authorization: Bearer {JWT}
```
Returns a signed `previewUrl`. Do NOT use raw S3 URLs — the bucket is origin-private behind CloudFront.

### Site Mode
```
PUT /v2/handles/{handle}/site-mode
Authorization: Bearer {JWT}
Content-Type: application/json
Body: {"mode":"LINKTREE"}
```
Requires JWT with owner role. Switches the handle's site display mode.

### Why Not MCP for Page Hosting?
The MCP proxy has a payload size limit (~1KB). Large HTML content cannot pass through MCP tool calls. Use the Direct API for all page hosting operations.

---

## Upload Modes Summary

| Mode | Endpoint | Auth | Best For |
|------|----------|------|----------|
| **Single HTML** | `POST /v2/handles/{handle}/site-deployments` with `inlineHtml` | JWT | Single-page sites, inline CSS/JS |
| **Multi-File** | `POST /v2/handles/{handle}/site-deployments` with `files` array | JWT | Pages with separate CSS/JS files |
| **Redirect Link** | `PUT /v2/public/handles/{handle}/links/{slug}` with `destinationUrl` | PAT | Short links, 302 redirects |

---

## Quick Reference

| I want to... | Tool / Endpoint | Key params |
|---|---|---|
| Deploy a page (inline HTML) | Direct API: `POST /v2/handles/{handle}/site-deployments` | `inlineHtml` (JWT auth) |
| Deploy a page (multi-file) | Direct API: `POST /v2/handles/{handle}/site-deployments` | `files` array (JWT auth) |
| Create a redirect link | `links_upsert` | `slug`, `payload: { destinationUrl }` |
| List my links | `links_list` | `handle?` |
| Create a strategy | `agent_create_proposal` | `payload: { idempotencyKey, strategyId, ... }` |
| Generate a strategy | `agent_generate_strategy` | `payload: { idempotencyKey }` |
| List strategies | `agent_list_proposals` | `status?` |
| Submit for testing | `agent_start_run` | `payload: { proposalId }` |
| Check run status | `agent_get_run_status` | `runId` |
| Approve a proposal | `agent_approve_proposal` | `proposalId` |
| Rollback | `agent_rollback_run` | `runId` |
| Get analytics | `analytics_get` | `handle?` |
| Campaign health | `analytics_campaign_health` | `handle?` |
| Check health | `system_health` | `handle?` |
| Audit events | `system_audit_events` | `limit?` |
| Get embed code | `tracking_list_templates` | `handle?` |
| A/B rules | `tracking_list_personalization_rules` | `handle?` |
| Create webhook | `webhooks_create` | `payload` |
| List webhooks | `webhooks_list` | `handle?` |
| Custom domains | `routing_list_context_origins` | `handle?` |
| Preview a deployment | Direct API: `GET /v2/handles/{handle}/site-deployments/{id}/preview` | `deploymentId` (JWT auth) |
| Change site mode | Direct API: `PUT /v2/handles/{handle}/site-mode` | `mode` (JWT owner auth) |
| Create a campaign | Direct API: `POST /v2/handles/{handle}/campaigns` | campaign payload (JWT auth) |
| Discover opportunities | `agent_discover` | discovery filter (JWT auth) |

## API Endpoint Reference

### PAT-accessible (via MCP or direct)
| Endpoint | Tool |
|----------|------|
| `GET /v2/public/handles/{handle}/links` | `links_list` |
| `PUT /v2/public/handles/{handle}/links/{slug}` | `links_upsert` (REDIRECT LINKS ONLY) |
| `POST /v2/public/handles/{handle}/links/health-check` | `links_health_check` |
| `POST /v2/public/handles/{handle}/links/{slug}/route-preview` | `links_route_preview` |
| `GET /v2/public/handles/{handle}/tracking-templates` | `tracking_list_templates` |
| `POST /v2/public/handles/{handle}/tracking-templates` | `tracking_upsert_template` |
| `GET /v2/public/handles/{handle}/personalization-rules` | `tracking_list_personalization_rules` |
| `PUT /v2/public/handles/{handle}/personalization-rules/{ruleId}` | `tracking_upsert_personalization_rule` |
| `GET /v2/public/handles/{handle}/context-origins` | `routing_list_context_origins` |
| `PUT /v2/public/handles/{handle}/context-origins` | `routing_update_context_origins` |
| `GET /v2/public/handles/{handle}/analytics` | `analytics_get` |
| `GET /v2/public/handles/{handle}/analytics/export` | `analytics_export` |
| `GET /v2/public/handles/{handle}/webhooks` | `webhooks_list` |
| `POST /v2/public/handles/{handle}/webhooks` | `webhooks_create` |
| `DELETE /v2/public/handles/{handle}/webhooks/{subscriptionId}` | `webhooks_delete` |
| `POST /v2/public/handles/{handle}/webhooks/{subscriptionId}/test` | `webhooks_test` |
| `GET /v2/public/handles/{handle}/usage-meters` | `system_usage_meters` |
| `GET /v2/public/handles/{handle}/audit-events` | `system_audit_events` |
| `GET /v2/public/handles/{handle}/function-bindings` | Discovery (no-auth) |

### JWT-required (direct API only)
| Endpoint | Tool / Purpose |
|----------|---------------|
| `GET /v2/handles/{handle}/profile` | Profile management |
| `GET/POST/DELETE /v2/handles/{handle}/pages*` | Page management (creator economy) |
| `GET/POST /v2/handles/{handle}/site-deployments` | **HTML page deployment (THE correct way to host pages)** |
| `GET /v2/handles/{handle}/agent/*` | Agent proposals and runs |
| `GET /v2/handles/{handle}/site-deployments/{deploymentId}/preview` | Deployment preview (signed URL) |
| `PUT /v2/handles/{handle}/site-mode` | Site mode update (owner JWT required) |
| `POST /v2/handles/{handle}/campaigns` | Campaign creation |
| `POST /v2/handles/{handle}/campaigns/{campaignId}/health` | Campaign health check |
| `GET /v2/handles/{handle}/knowledge/*` | Knowledge base |
| `POST /v2/handles/{handle}/qa/*` | QA automation |
| `GET /v2/system/health` | System health (also available via MCP) |

## Common Mistakes

1. **Using `links_upsert` for page hosting**: `links_upsert` creates REDIRECT LINKS (302) only. The `html` parameter is accepted but IGNORED. Use the site-deployments Direct API for page hosting.
2. **Wrong auth for site-deployments**: Site-deployments requires a JWT (Cognito ID token). PAT (`patv1_*`) will NOT work.
3. **Passing large HTML through MCP**: The MCP proxy has a ~1KB payload limit. Use the Direct API for page content.
4. **Missing required params**: `agent_create_proposal` requires `idempotencyKey` + `strategyId`. `agent_start_run` requires `proposalId`. `agent_generate_strategy` requires `idempotencyKey`.
5. **Missing payload**: Most write tools require a `payload` object, not flat params.
6. **Expired PAT/JWT**: JWT tokens expire every 1 hour — watch for 401 errors.
7. **Lost session**: Always store `mcp-session-id` and reuse it.
8. **Wrong URL**: Each user has their own server at `https://{handle}.mcp.10x.in/mcp`.
9. **Missing Accept header**: Must include `application/json, text/event-stream`.

## Error Model

Deterministic auth/policy errors (do NOT retry):
- `401 missing_bearer_token` / `invalid_token_format` / `invalid_token` / `token_revoked` / `token_expired`
- `403 insufficient_scope` / `feature_locked` / `forbidden`

Resource/process errors:
- `404 not_found` (and route-specific variants)
- `409` domain/checkout conflicts
- `413 payload_too_large`
- `429 rate_limited`

Retry only `429` and selected `5xx` with backoff. Never retry auth, scope, or validation failures.
