---
description: Set up your Marketing Manager environment — configure authentication, verify MCP connection, and run initial sync. OS-aware (Windows/Mac/Linux).
---

# Marketing Manager Setup

You are setting up the Marketing Manager skills plugin for a new user. This must be fully automatic — detect the OS, install what's missing, create the `.env` file, configure MCP, and verify everything works.

**IMPORTANT**: You need a 10x.in account first. Sign up at https://10x.in

## Step 1: Detect Environment

Run these checks and store the results:

```bash
# OS detection
uname -s 2>/dev/null || echo "WINDOWS"
```

Determine:
- **OS**: Windows (PowerShell/Git Bash), macOS, or Linux
- **Shell**: bash, zsh, PowerShell
- **Package manager**: brew (macOS), apt/yum (Linux), choco/winget (Windows)

## Step 2: Check & Install Dependencies

Check each dependency. If missing, install it using the detected package manager.

### Required:
| Dependency | Check Command | Install (macOS) | Install (Linux) | Install (Windows) |
|-----------|---------------|-----------------|-----------------|-------------------|
| Node.js 18+ | `node --version` | `brew install node` | `curl -fsSL https://deb.nodesource.com/setup_18.x \| sudo bash - && sudo apt install -y nodejs` | `winget install OpenJS.NodeJS.LTS` |
| npm | `npm --version` | (comes with node) | (comes with node) | (comes with node) |
| git | `git --version` | `brew install git` | `sudo apt install -y git` | `winget install Git.Git` |
| GitHub CLI | `gh --version` | `brew install gh` | See https://github.com/cli/cli/blob/trunk/docs/install_linux.md | `winget install GitHub.cli` |

## Step 3: Create `.env` File

Check if `.env` already exists in the plugin root. If not, create it from `.env.example`.

**IMPORTANT**: Ask the user for each required value using `AskUserQuestion`. Do NOT generate or guess tokens.

Required values to collect:
1. **USER_PAT** — "Enter your Personal Access Token (get from your 10x.in profile settings)"
2. **LINK_PLATFORM_HANDLE** — "Enter your handle (your subdomain on 10x.in, e.g. 'mycompany')"
3. **MCP Server** — Auto-derived from handle: `https://{handle}.mcp.10x.in` (no user input needed)

Then ask for AI provider keys. The server needs at least ONE AI key to power thinking features:

4. **AI Provider** — Ask using AskUserQuestion with options:
   - "OpenAnalyst (Recommended)" — Anthropic-compatible proxy, best value
   - "OpenRouter" — Multi-model access via single key
   - "OpenAI" — Direct OpenAI API
   - "Anthropic" — Direct Anthropic API

Based on their choice, collect the appropriate key:
- **OpenAnalyst**: Ask for `ANTHROPIC_AUTH_TOKEN` — "Enter your OpenAnalyst API key (starts with sk-oa-v1-...)"
- **OpenRouter**: Ask for `OPENROUTER_API_KEY` — "Enter your OpenRouter API key (starts with sk-or-v1-..., get from https://openrouter.ai/keys)"
- **OpenAI**: Ask for `OPENAI_API_KEY` — "Enter your OpenAI API key (starts with sk-...)"
- **Anthropic**: Ask for `ANTHROPIC_API_KEY` — "Enter your Anthropic API key (starts with sk-ant-...)"

Write the `.env` file:
```
# Server MCP connection
# MCP Server URL is auto-derived: https://{LINK_PLATFORM_HANDLE}.mcp.10x.in
USER_PAT={user_value}

# Link Platform
LINK_PLATFORM_HANDLE={user_value}

# AI Provider (Bring Your Own Key)
# Priority: OpenAnalyst > OpenRouter > OpenAI > Anthropic
# At least ONE key is required for AI-powered features.
ANTHROPIC_BASE_URL=https://api.openanalyst.com/api
ANTHROPIC_AUTH_TOKEN={if openanalyst, user_value, else empty}
ANTHROPIC_API_KEY={if anthropic, user_value, else empty}
ANTHROPIC_DEFAULT_SONNET_MODEL=openanalyst-beta
OPENROUTER_API_KEY={if openrouter, user_value, else empty}
OPENAI_API_KEY={if openai, user_value, else empty}
DEFAULT_AI_PROVIDER={chosen_provider}
DEFAULT_AI_MODEL={model_for_provider}
```

Model defaults per provider:
- OpenAnalyst: `openanalyst-beta`
- OpenRouter: `anthropic/claude-sonnet-4-20250514`
- OpenAI: `gpt-4o`
- Anthropic: `claude-sonnet-4-20250514`

Add `.env` to `.gitignore` if not already there.

## Step 4: Configure MCP Connection

Verify `.mcp.json` exists and points to the user's MCP server. Each user gets their own server at `https://{handle}.mcp.10x.in`:

```json
{
  "mcpServers": {
    "marketing-manager-mcp": {
      "type": "http",
      "url": "https://{LINK_PLATFORM_HANDLE}.mcp.10x.in",
      "headers": {
        "Authorization": "Bearer ${USER_PAT}",
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

Replace `{LINK_PLATFORM_HANDLE}` with the user's actual handle value. The MCP server URL is derived from the handle — there is no separate `MM_SERVER_URL` setting.

**IMPORTANT**: The PAT is a JWT that expires every 1 hour. If the user gets 401 errors later, they need to refresh it from their 10x.in profile settings.

## Step 5: Verify GitHub Authentication

```bash
gh auth status
```

If not authenticated:
- Run `gh auth login`

## Step 6: Verify Connection to Services

### Verify MCP Server:
```bash
curl -s "https://{LINK_PLATFORM_HANDLE}.mcp.10x.in/health"
```
Expected: `{ "status": "ok", "version": "3.0.0", "userTools": 37, ... }`

### Initialize MCP Session:
Send an `initialize` JSON-RPC request to verify the PAT works:
```bash
curl -s -X POST "https://{handle}.mcp.10x.in" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $USER_PAT" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"10x-mm","version":"3.1.0"}}}'
```
Expected: SSE response with `mcp-session-id` header. Store this session ID in `.mm/mcp-session.json`.

If you get `"Invalid or unrecognized PAT"`, the PAT is wrong or expired (JWT expires every 1 hour).

### Verify via MCP tool:
Use the `system_health` MCP tool to confirm the connection is working.

### Verify handle exists:
Confirm the user's handle resolves: `https://{handle}.10x.in`

## Step 7: Run Initial Sync

After setup is verified, run the sync skill to populate `.10x/sync-data.json`:

Tell the user: "Running initial sync to pull all your data locally..."

This calls the `marketer-sync` skill which hits all MCP endpoints and saves data locally.

## Step 8: Print Summary

After all steps complete, print:

```
Setup Complete!

  OS: {detected_os}
  Node: {version}
  Git: {version}
  GitHub CLI: {version}

  MCP Server: Connected to https://{LINK_PLATFORM_HANDLE}.mcp.10x.in
  Handle: {LINK_PLATFORM_HANDLE}.10x.in
  Auth: USER_PAT configured
  AI Provider: {provider_name} ({model})

  MCP Tools Available (37 Link Platform tools):
    Workflow:   agent_start_run, agent_get_run_status, system_health + system_usage_meters
    Strategy:   agent_create_proposal, agent_list_proposals, analytics_get, analytics_campaign_health
    Deploy:     links_upsert, agent_rollback_run
    Quality:    system_audit_events
    Links:      links_upsert, links_list
    Pages:      links_upsert, links_list
    Schedule:   webhooks_create, webhooks_list
    System:     system_health, tracking_list_templates, routing_list_context_origins

  Available commands:
    /sync      — Sync all data locally (run this first!)
    /deploy    — Deploy a strategy to your live handle
    /health    — Check all service health
    /feedback  — Annotate your page visually for precise edits
    /test      — Run tests

  Your pages will be live at: https://{LINK_PLATFORM_HANDLE}.10x.in/{slug}

  Architecture:
    Your local assistant <-> Your MCP Server ({handle}.mcp.10x.in) <-> Link Platform (10x.in)
    Each user gets an isolated session — your data is safe.
```

## Error Handling

- If a dependency install fails, print the manual install command and continue with other steps
- If MCP server verification fails, warn the user but still save the `.env` (they may be offline)
- If sync fails, continue setup and tell user to run `/sync` later
- Never exit on a single failure — complete all steps and report what worked/failed at the end

$ARGUMENTS
