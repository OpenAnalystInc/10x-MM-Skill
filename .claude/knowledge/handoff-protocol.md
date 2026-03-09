# Handoff Protocol — Leader/Subordinate

## Architecture

- **Server = Leader** — Brain, decision maker, quality gate. Tests, fixes, approves.
- **Local = Subordinate** — Executor. Generates content, creates files, runs sync, interacts with user.

**Why:** Enables users running smaller/cheaper models locally to still produce quality output — the server (running a capable model) does all heavy lifting.

**MCP Server:** Each user gets their own at `https://{handle}.mcp.10x.in`. The server runs a Claude Code instance that processes tool calls intelligently.

**MCP proxy size limitation**: The MCP proxy has a payload size limit (~1KB). Large HTML content cannot be passed through MCP tool calls. For page hosting, use the Direct API (site-deployments) instead.

---

## MCP Session Management

**CRITICAL**: The MCP session must persist for the entire conversation.

1. Before first Link Platform tool call, check `.mm/mcp-session.json` for a stored session ID
2. If found, attempt to reuse it (include in `mcp-session-id` header)
3. If not found or expired (404/error), initialize a new session:
   ```json
   { "jsonrpc": "2.0", "id": 1, "method": "initialize",
     "params": { "protocolVersion": "2025-03-26", "capabilities": {},
                 "clientInfo": { "name": "10x-mm", "version": "4.0.0" } } }
   ```
4. Store the new `mcp-session-id` from the response header in `.mm/mcp-session.json`
5. Use this session ID for ALL subsequent tool calls in the conversation

---

## Workflow: agent_start_run

All handoff between local and server flows through a single tool: `agent_start_run`.

### Submitting Work

Local submits finished content for server review and optional publishing:

```json
{
  "html": "<html>...</html>",
  "css": "body { ... }",
  "js": "console.log('...')",
  "intent": "test_only | test_and_preview | test_and_publish",
  "strategyId": "optional-strategy-id",
  "proposalId": "required-proposal-id",
  "slug": "optional-page-slug"
}
```

**IMPORTANT**: `agent_start_run` requires a `proposalId`. Create a proposal first via `agent_create_proposal` (which requires `idempotencyKey` + `strategyId`).

**IMPORTANT**: Before submitting via `agent_start_run`, read `.mm/context.json` and include relevant session history (active strategies, recent work, in-progress items) so the server has continuity.

### What the Server Does

1. Receives the submitted content
2. Tests it in an isolated sandbox (HTML validation, CSS checks, link verification, performance)
3. Runs autonomous fix cycles if issues are found (max 3 rounds)
4. Returns a verdict with results

### Server Response

The server returns a verdict:

- **approved** — Content passed all tests. If intent was `test_and_publish`, the server will deploy via site-deployments.
- **needs_revision** — Content has issues. Feedback array describes what to fix.
- **rejected** — Content failed critically. Server may complete the task internally.

Response includes:
```json
{
  "verdict": "approved | needs_revision | rejected",
  "testResults": { "html": "pass", "css": "pass", "links": "pass", "performance": "pass" },
  "feedback": [{ "severity": "critical|high|medium|low", "issue": "...", "fix": "..." }],
  "validatedOutput": { "html": "...(server-improved)..." },
  "previewUrl": "https://..."
}
```

---

## Flows

### Flow A: Local-Initiated (most common)

```
LOCAL                              SERVER ({handle}.mcp.10x.in)
─────                              ──────
1. Build content locally
   (skills generate HTML/CSS/JS)
2. agent_start_run ────────────→ 3. Receive content
                                   4. Test in sandbox
                                   5. Fix issues autonomously
                                   6. Re-test until PASS
7. Receive verdict ←──────────── 7. Return verdict + results
   IF approved → deploy via site-deployments Direct API
     POST https://api.10x.in/v2/handles/{handle}/site-deployments
     { "inlineHtml": "<validated html>" }  (JWT auth required)
   IF needs_revision → fix locally → resubmit
   IF rejected → server completed it
```

### Flow B: Deploy Page Directly (via site-deployments API)

```
LOCAL                              LINK PLATFORM API (api.10x.in)
─────                              ──────
1. POST /v2/handles/{handle}/site-deployments
   { "inlineHtml": "<html>...</html>" }
   Authorization: Bearer {JWT_COGNITO_TOKEN}
                                   2. Deploy page, auto-activate
3. Page is live at ←────────────── {handle}.10x.in
```

**Auth**: JWT (Cognito ID token) is required for site-deployments. PAT (`patv1_*`) will NOT work.

**NOTE**: `links_upsert` creates REDIRECT LINKS (302) only — it does NOT host HTML pages. The `html` parameter is accepted but IGNORED.

### Flow C: Create Redirect Link (via MCP)

```
LOCAL                              SERVER ({handle}.mcp.10x.in)
─────                              ──────
1. links_upsert ──────────────→  2. Create redirect link
   { slug, payload: {               (302 redirect to destinationUrl)
     destinationUrl, title } }
3. Confirm created ←──────────────
```

---

## Rules

1. **Max 2 revision rounds** — then server takes over (verdict: rejected)
2. **Local does:** File creation, content generation, sync, user Q&A
3. **Server does:** Testing, auditing, fixing code, approving
4. **Page hosting:** Use site-deployments Direct API (JWT auth), NOT `links_upsert`
5. **Server NEVER asks user directly** — tells local what to fix via feedback
6. **After rejection:** Server completes task end-to-end internally
7. **Always use agent_start_run** — never try to call internal handoff_*, sandbox_*, or test_* tools directly
8. **Read context before submitting** — read `.mm/context.json` and include relevant session history
9. **Reuse MCP session** — never create a new session per tool call, always reuse the stored session ID
10. **Correct param names** — use `slug` not `pageSlug`, `html` not `contentHtml`
11. **Required params** — `agent_create_proposal` needs `idempotencyKey` + `strategyId`; `agent_start_run` needs `proposalId`; `agent_generate_strategy` needs `idempotencyKey`
12. **MCP payload limit** — MCP proxy has ~1KB limit; use Direct API for large content
