---
name: audit_env_dns
description: >
  Verify user environment variables and MCP connectivity are correctly configured.
  Trigger words: env check, config check, setup check, verify env, environment audit.
metadata:
  version: "2.0.0"
  category: audit
  domain: marketing-engineering
compatibility:
  - claude-code
---

# Audit Env & DNS

## PURPOSE

Verify all required environment variables for the Marketing Manager plugin are set and the MCP server is reachable. MCP is the only entry point — you verify connectivity by calling the server through MCP, not by curling internal endpoints.

## INPUTS

- **env_file** (optional): Path to .env file (default: `.env`)

## PRECONDITIONS

1. `.env` file exists OR env vars are set in shell

## ALLOWED CHANGES

- None — read-only audit

## FORBIDDEN CHANGES

- Do NOT modify .env or any config files
- Do NOT expose secret values in output (mask them — show first 6 chars + `...`)

## PROCEDURE

### Step 1: Check Required User Env Vars

Read `.env` or check shell env for these variables:

| Variable | Required | Purpose | Valid Format |
|----------|----------|---------|-------------|
| `USER_PAT` | YES | Auth token for MCP server | Non-empty string |
| `LINK_PLATFORM_HANDLE` | YES | Your handle on Link Platform | Lowercase string, no spaces |

Commands to check (local env file read, no API calls):

```bash
# Check .env exists
test -f .env && echo ".env found" || echo "WARN: no .env (checking shell env)"

# Check each var is set (mask values)
grep -c "USER_PAT=" .env 2>/dev/null || echo "USER_PAT: not in .env"
grep -c "LINK_PLATFORM_HANDLE=" .env 2>/dev/null || echo "LINK_PLATFORM_HANDLE: not in .env"
```

### Step 2: Validate Formats

- `USER_PAT` must be non-empty (at least 10 chars)
- `LINK_PLATFORM_HANDLE` must be non-empty, lowercase, no spaces

### Step 3: Verify MCP Connectivity

Call the MCP server to confirm the connection works end-to-end:

```
system_health({ handle: "<LINK_PLATFORM_HANDLE>" })
```

- If this returns `{ status: "ok" }` → MCP server is reachable, PAT is valid, Link Platform is accessible
- If it errors → report specific error (auth failure vs connection failure)

### Step 4: Check .mcp.json

Read `.mcp.json` to verify MCP server config:

```json
{
  "mcpServers": {
    "marketing-manager-mcp": {
      "type": "http",
      "url": "https://<LINK_PLATFORM_HANDLE>.mcp.10x.in",
      "headers": { "Authorization": "Bearer <USER_PAT>" }
    }
  }
}
```

Verify:
- Server key is `marketing-manager-mcp`
- URL pattern is correct
- Auth header present

### Step 5: Report

```
ENV & CONFIG AUDIT
━━━━━━━━━━━━━━━━━━

Environment file: .env (found)

Required Variables:
  USER_PAT              = pat_abc...   ✓ (set, 32 chars)
  LINK_PLATFORM_HANDLE  = myhandle    ✓ (set)
  MCP URL (derived)     = https://myhandle.mcp.10x.in ✓

MCP Connectivity:
  system_health via MCP ✓ status: ok (server + Link Platform reachable)

.mcp.json:
  marketing-manager-mcp ✓ configured correctly

Result: PASS ✓ (all checks passed)
```

## STOP CONDITIONS

- STOP if both required vars are missing (cannot even attempt MCP check)

## FAILURE HANDLING

- If `USER_PAT` missing: run `/setup` command to configure
- If `system_health` fails with auth error: `USER_PAT` may be expired or wrong
- If `system_health` fails with connection error: check `LINK_PLATFORM_HANDLE` is correct and server is running
- If `LINK_PLATFORM_HANDLE` is wrong: `system_health` will return handle-not-found error
