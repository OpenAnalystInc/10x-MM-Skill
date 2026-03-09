---
description: Submit content to the server for validation. Runs a full audit via system_audit_events and submits work via agent_start_run. Returns PASS/FAIL with fixes applied.
---

# Server Test Suite

Submit your built content to the server for comprehensive validation. The server runs audits, fixes issues autonomously, and returns validated content.

## How It Works

This command triggers the **local-to-server submission**:
1. Your local assistant sends the HTML/CSS/JS to the server via `agent_start_run`
2. The server runs a full audit via `system_audit_events`
3. If tests fail, the server agent fixes issues and re-tests
4. Once all tests pass, validated content is returned to you

## Step 0: Verify Access Tier

Read `.env` and check `USER_PAT`. The `agent_start_run` and `system_audit_events` tools require a valid PAT (full tier).

- If no PAT or expired: **STOP**. Tell user: "Server testing requires a valid PAT. Get a fresh one from your 10x.in profile settings."
- If local tier only: **STOP**. Tell user: "Server testing requires full tier access. You can run local audits (audit_build, audit_lint, etc.) without a PAT."
- If PAT valid: proceed.

## Prerequisites

- MCP connection active — your server is at `https://{handle}.mcp.10x.in`
- MCP session initialized — check `.mm/mcp-session.json` for stored session ID
- Built content must exist (run the landing-page skill first)

## Step 1: Ensure MCP Session

Check `.mm/mcp-session.json` for a stored session ID. If none or expired:
1. Initialize: POST `initialize` to `https://{handle}.mcp.10x.in`
2. Store `mcp-session-id` from response header
3. All tool calls use this session ID

## Step 2: Find Content to Test

Look for built content in order:
1. Argument-provided path
2. `projects/{most-recent}/build/index.html`
3. Ask the user for the path

Read the HTML, CSS, and JS files.

## Step 3: Read Session Context

Read `.mm/context.json` for relevant history to include with the submission. The server benefits from knowing what the user has been working on.

## Step 4: Run Audit

Use the `system_audit_events` MCP tool to validate the content:
- `html`: the HTML content (required)
- `css`: CSS content if separate (optional)
- `js`: JS content if separate (optional)

This runs the full validation suite including:

| Test | What It Checks | PASS Criteria |
|------|----------------|---------------|
| **HTML Validation** | DOCTYPE, lang, viewport, title, h1, alt text, skip link, semantic HTML, WebMCP, toolname attributes | All critical checks pass |
| **Link Check** | Every href/src/action URL is reachable | Zero broken links |
| **CSS Validation** | Custom properties, responsive breakpoints, focus styles | Design system compliance |
| **Performance** | Total size < 1.5MB, lazy loading, deferred scripts, resource hints | Under budget |

## Step 5: Submit Work to Server

Use the `agent_start_run` MCP tool:
- `html`: the HTML content (required)
- `css`: CSS content (optional)
- `js`: JS content (optional)
- `intent`: `test_only` (unless user says otherwise)

The server will test, fix, and return validated content.

## Step 6: Handle Results

### If ALL PASS:
The server returns validated content.

Print:
```
Server Tests: ALL PASSED

  HTML:        PASS (16/16 checks)
  Links:       PASS (12 URLs checked, 0 broken)
  CSS:         PASS (custom props, responsive, focus)
  Performance: PASS (342KB total)

  Content validated and ready.
  Run /deploy to publish, or review the preview.
```

### If ANY FAIL:
The server agent will attempt to fix issues and re-test.

If fixes succeed:
```
Server Tests: PASSED (after fixes)

  Fixes Applied:
  - Added missing alt text to 2 images
  - Added WebMCP snippet (was missing)
  - Fixed 1 broken link (typo in URL)

  Content validated and ready.
```

If fixes need user input:
```
Server Tests: NEEDS INPUT

  The server needs your input on these items:
  1. Image at line 45 has no alt text — what should it say?
  2. Form action URL returns 404 — what's the correct endpoint?

  Answer these questions and re-run /test.
```

## Step 7: Log to Session

Log the audit and submit_work tool calls to `.mm/sessions/current.json`.

## Step 8: Save Test Results

Write test results to `projects/{project}/testing/server-test-results.json`.

## Error Handling

- **401 Unauthorized**: PAT expired. Tell user: "Your PAT has expired. Get a fresh one from 10x.in profile settings."
- **Session expired**: Re-initialize MCP session and retry.
- **Server unreachable**: Check server health at `https://{handle}.mcp.10x.in/health`.

$ARGUMENTS
