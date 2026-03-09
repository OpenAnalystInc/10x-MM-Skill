# Session Tracking — How Skills and Agents Use Session Data

## Overview

The Marketing Manager skill tracks every Link Platform tool call locally in `.mm/`. This gives continuity across sessions — the server knows what the user was building, what failed, and what's in progress.

## File Locations

| File | Purpose |
|------|---------|
| `.mm/sessions/current.json` | Active session — appended on every Link Platform tool call |
| `.mm/sessions/{timestamp}.json` | Archived completed sessions |
| `.mm/context.json` | Rolling summary of last 3 sessions (fed to server) |
| `.mm/mcp-session.json` | Stored MCP session ID for persistent server connection |

## MCP Session Persistence

**CRITICAL**: The MCP server maintains sessions in-memory. The session ID (`mcp-session-id` header) must be stored locally and reused across the entire conversation.

### `.mm/mcp-session.json` schema
```json
{
  "sessionId": "uuid-from-mcp-session-id-header",
  "serverUrl": "https://anit.mcp.10x.in",
  "createdAt": "ISO",
  "lastUsedAt": "ISO"
}
```

### On conversation start
1. Read `.mm/mcp-session.json`
2. If exists and `lastUsedAt` < 2 hours ago, try reusing the stored session ID
3. Send a tool call with the stored `mcp-session-id` header
4. If server returns error (session expired), re-initialize and store new ID
5. If no stored session, initialize fresh

### On every Link Platform tool call
1. Include `mcp-session-id` header from stored session
2. Update `lastUsedAt` in `.mm/mcp-session.json`

### On session expiry / server restart
1. Server returns 404 or error for stored session ID
2. Re-initialize: POST `initialize` to `https://{handle}.mcp.10x.in`
3. Store new session ID from response header
4. Retry the failed tool call with new session ID

## On Session Start

1. Read `.mm/context.json` — know what user did before
2. Check `.mm/sessions/current.json` — if stale (>2hrs old), archive it
3. Create fresh `current.json` with new session ID
4. Greet user with context: "Last session: [accomplished]. [inProgress] still needs work."

## On Every Link Platform Tool Call

After each Link Platform MCP tool call completes:

1. **Log the call** to `current.json`:
   - Tool name, sanitized arguments (no full HTML), timestamp, duration
   - Result summary: verdict, status, error messages, counts

2. **Extract state** automatically:
   - `agent_create_proposal` → add to `strategies` map
   - `agent_generate_strategy` → add to `strategies` map
   - `agent_start_run` → log verdict and feedback
   - `links_upsert` (redirect link creation) → add to `links` map (302 redirect only)
   - `links_list` → refresh links inventory
   - Site-deployment (Direct API) → add to `pages` map, mark status "deployed"
   - `system_audit_events` → append to `audits` array
   - Any error → append to `errors` array

**NOTE**: `links_upsert` creates redirect links only — it does NOT create pages. Page deployments happen via the site-deployments Direct API (`POST /v2/handles/{handle}/site-deployments`), which should be tracked separately in the `pages` map.

## On Session End / Next Session Start

1. Archive `current.json` → `sessions/{timestamp}.json`
2. Regenerate `context.json` from last 3 sessions (condensed)
3. Delete sessions older than 30 days

## When Submitting Work to Server

**IMPORTANT**: Before calling `agent_start_run`, read `.mm/context.json` and include relevant context so the server knows user history:

```
"I'm continuing work on Winter Campaign (draft). Last session I published Summer Sale
successfully. Current session: 3 tool calls, working on copy revisions."
```

This helps the server make better decisions about testing, fixing, and approving content.

## current.json Schema

```json
{
  "sessionId": "uuid",
  "startedAt": "ISO",
  "endedAt": null,
  "user": { "email": "...", "handle": "..." },
  "model": "Opus 4.6",
  "toolCalls": [
    { "tool": "system_health", "args": {}, "result": { "status": "ok" }, "at": "ISO", "ms": 320 }
  ],
  "strategies": { "str_abc": { "name": "Summer Sale", "status": "live", "action": "published" } },
  "pages": { "summer-sale": { "url": "https://anit.10x.in/summer-sale", "action": "deployed", "method": "site-deployment" } },
  "links": { "go-summer": { "slug": "go-summer", "destinationUrl": "https://example.com/summer", "action": "created", "type": "redirect" } },
  "audits": [ { "at": "ISO", "result": "pass", "issues": 0 } ],
  "errors": []
}
```

## context.json Schema

```json
{
  "updatedAt": "ISO",
  "lastSession": {
    "date": "2026-02-22",
    "duration": "45 min",
    "accomplished": ["Deployed 'Summer Sale' page at anit.10x.in via site-deployments"],
    "inProgress": ["Draft 'Winter Campaign' — needs copy review"],
    "openIssues": []
  },
  "activeStrategies": [
    { "id": "str_abc", "name": "Summer Sale", "status": "live" }
  ],
  "totalSessions": 5,
  "recentToolCalls": 24
}
```

## Rules for All Skills and Agents

1. **Always check context first** — read `.mm/context.json` before starting substantive work
2. **Never modify session files directly** — use the session module (`src/session.js`)
3. **Include context in server submissions** — feed relevant history into `agent_start_run`
4. **Don't log non-Link-Platform calls** — only Link Platform MCP tool calls are tracked
5. **Archive, don't delete** — stale sessions are archived, not discarded
6. **Distinguish links from pages** — `links_upsert` creates redirect links (tracked in `links` map); site-deployments creates pages (tracked in `pages` map)
