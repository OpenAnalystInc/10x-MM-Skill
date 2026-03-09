---
name: audit_runtime_smoke
description: >
  Smoke test the live platform — verify MCP server health, session state, link health, and published pages via MCP tools.
  Trigger words: smoke test, runtime test, server health, health check, platform check.
metadata:
  version: "2.0.0"
  category: audit
  domain: marketing-engineering
compatibility:
  - claude-code
---

# Audit Runtime Smoke

## PURPOSE

Verify the entire platform is healthy using MCP tools. MCP is the only entry point — you never hit servers directly. The server handles all internal health checks and reports status back through the tools.

## INPUTS

- **namespace** (required): Your handle (from `LINK_PLATFORM_HANDLE` env)
- **userId** (required): Your user ID
- **slug** (optional): If provided, also verify a specific published page

## PRECONDITIONS

1. `USER_PAT` and `LINK_PLATFORM_HANDLE` env vars are set
2. MCP connection to server is active (URL derived from handle: `https://{handle}.mcp.10x.in`)

## PROCEDURE

### Step 1: MCP Server Health

```
system_health({ handle: "<LINK_PLATFORM_HANDLE>" })
```

Expects: `{ status: "ok" }` — confirms MCP server is up AND Link Platform is reachable.

### Step 2: Link Platform Connectivity

```
links_list({ handle: "<LINK_PLATFORM_HANDLE>" })
```

Expects: array returned (even if empty). Confirms Link Platform API is accessible through server.

### Step 3: Link Health Check (if links exist)

```
system_audit_events({ html: "<html from page>" })
```

Confirms all published links and content are valid.

### Step 4: Page Health (if slug provided)

```
links_list({ handle: "<LINK_PLATFORM_HANDLE>" })
```

Confirms pages exist and are accessible.

### Step 5: Strategy Layer

```
agent_list_proposals({ handle: "<LINK_PLATFORM_HANDLE>" })
```

Confirms strategy layer is working through the server.

### Step 6: Report

```
RUNTIME SMOKE AUDIT
━━━━━━━━━━━━━━━━━━━

MCP Server Health:
  system_health               ✓ ok

Link Platform:
  links_list           ✓ <n> links
  system_audit_events            ✓ all healthy (or: <n> issues)

Strategy Layer:
  agent_list_proposals      ✓ <n> strategies

Pages:
  links_list           ✓ <n> pages

Result: PASS ✓ (<n>/5 checks passed)
```

## STOP CONDITIONS

- STOP and FAIL if `system_health` returns error — MCP server or Link Platform is down
- WARN (not fail) if audit reports broken links

## FAILURE HANDLING

- If `system_health` fails: check `LINK_PLATFORM_HANDLE` is correct, check server is running, check `USER_PAT` is valid
- If `system_audit_events` reports broken links: run `audit_links` on local HTML or use `links_upsert` to fix
- If `agent_list_proposals` fails: server may be down — check /health endpoint
