---
description: Check health of all services — Marketing Manager MCP server, Link Platform, and local environment.
---

# Health Check

Run a comprehensive health check of all connected services.

## Load Environment

Read `.env` from the plugin root. Extract:
- `USER_PAT`
- `LINK_PLATFORM_HANDLE`

If `.env` is missing, tell the user: "Run /setup first."

## Checks to Run

### 1. Local Environment
```bash
node --version
npm --version
git --version
gh auth status
```

### 2. Marketing Manager MCP Server
Each user's MCP server is at `https://{handle}.mcp.10x.in`.

```bash
curl -s "https://$LINK_PLATFORM_HANDLE.mcp.10x.in/health"
```
Expected: `{ "status": "ok", ... }`

Also check MCP session status by reading `.mm/mcp-session.json` — show whether a stored session exists and when it was last used.

If health passes, use `system_health` MCP tool (with stored session ID) for deeper check.

### 3. Link Platform (10x.in)
Use the `links_list` MCP tool to verify platform connectivity:
- `handle`: from `LINK_PLATFORM_HANDLE` env

### 4. Live Handle
```bash
curl -s -o /dev/null -w "%{http_code}" "https://$LINK_PLATFORM_HANDLE.10x.in"
```
Expected: 200 or 301

### 5. Local Sync Data
Check if `.10x/sync-data.json` exists and how old it is.
If older than 1 hour, recommend: "Run /sync to refresh your data."

### 6. MCP Connection
Check if `.mcp.json` points to the correct per-user MCP URL (`https://{handle}.mcp.10x.in`) and has auth headers configured.

## Output Format

```
Service Health Check
-------------------------------------

  Local Environment
    Node.js:     {version}
    npm:         {version}
    Git:         {version}
    GitHub CLI:  {version}

  Marketing Manager MCP Server
    URL:         https://{handle}.mcp.10x.in
    Status:      {ok / unreachable}
    MCP Session: {stored / none} (last used: {time})

  Link Platform (10x.in)
    Platform:    {ok / unreachable}
    Handle:      {handle}.10x.in {ok / down}

  MCP Configuration
    .mcp.json:   {configured / missing}
    Endpoint:    https://{handle}.mcp.10x.in
    Auth:        {token set / missing}

  Access Control
    Tier:        {FULL / LOCAL / NONE}
    PAT Status:  {valid (Xm remaining) / expired / not set}
    BYOK:        {provider / not configured}

  Local Data
    Last sync:   {time or "never — run /sync"}
    Strategies:  {count} ({live} live, {drafts} drafts)
    Links:       {count} ({healthy} healthy)

  Session Tracking
    .mm/:        {exists / missing — run 10x-mm init}
    Sessions:    {count} archived, last: {date}
    Active:      {current session info or "none"}

-------------------------------------
  Overall: {ALL HEALTHY / DEGRADED / ISSUES FOUND}
```

If `.mm/context.json` exists and has a `lastSession`, show a brief summary:
```
  Last Session ({date}, {duration}):
    - {accomplished items}
    - In progress: {inProgress items}
```

If any check fails, provide the specific fix command.

$ARGUMENTS
