# Handoff Protocol — Leader/Subordinate

## Architecture

- **Server = Leader** — Brain, decision maker, quality gate. Tests, fixes, approves.
- **Local = Subordinate** — Executor. Generates content, creates files, runs sync, interacts with user.

**Why:** Enables users running smaller/cheaper models locally to still produce quality output — the server (running a capable model) does all heavy lifting.

**MCP Server:** Each user gets their own at `https://{handle}.mcp.10x.in`. The server runs a Claude Code instance that processes tool calls intelligently.

---

## MCP Session Management

**CRITICAL**: The MCP session must persist for the entire conversation.

1. Before first Link Platform tool call, check `.mm/mcp-session.json` for a stored session ID
2. If found, attempt to reuse it (include in `mcp-session-id` header)
3. If not found or expired (404/error), initialize a new session:
   ```json
   { "jsonrpc": "2.0", "id": 1, "method": "initialize",
     "params": { "protocolVersion": "2025-03-26", "capabilities": {},
                 "clientInfo": { "name": "10x-mm", "version": "3.1.0" } } }
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
  "slug": "optional-page-slug"
}
```

**IMPORTANT**: Before submitting via `agent_start_run`, read `.mm/context.json` and include relevant session history (active strategies, recent work, in-progress items) so the server has continuity.

### What the Server Does

1. Receives the submitted content
2. Tests it in an isolated sandbox (HTML validation, CSS checks, link verification, performance)
3. Runs autonomous fix cycles if issues are found (max 3 rounds)
4. Returns a verdict with results

### Server Response

The server returns a verdict:

- **approved** — Content passed all tests. If intent was `test_and_publish`, it is now live.
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
   IF approved → show user / publish via links_upsert
   IF needs_revision → fix locally → resubmit
   IF rejected → server completed it
```

### Flow B: Create + Publish Directly

```
LOCAL                              SERVER
─────                              ──────
1. links_upsert ──────────────→  2. Create page (slug, title, html)
3. links_upsert (publish) ───→  4. Deploy to {handle}.10x.in/{slug}
   (with publish payload)           (html is required for publish too)
5. Confirm live ←────────────────
```

---

## Rules

1. **Max 2 revision rounds** — then server takes over (verdict: rejected)
2. **Local does:** File creation, content generation, sync, user Q&A
3. **Server does:** Testing, auditing, fixing code, publishing
4. **Server NEVER asks user directly** — tells local what to fix via feedback
5. **After rejection:** Server completes task end-to-end internally
6. **Always use agent_start_run** — never try to call internal handoff_*, sandbox_*, or test_* tools directly
7. **Read context before submitting** — read `.mm/context.json` and include relevant session history
8. **Reuse MCP session** — never create a new session per tool call, always reuse the stored session ID
9. **Correct param names** — use `slug` not `pageSlug`, `html` not `contentHtml`
