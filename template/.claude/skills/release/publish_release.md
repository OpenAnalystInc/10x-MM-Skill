---
name: publish_release
description: >
  Publish a strategy and its page live via Link Platform MCP tools. Submits work to server for review first, then deploys.
  Trigger words: publish, release, deploy, go live, publish release, push live.
metadata:
  version: "4.0.0"
  category: release
  domain: marketing-engineering
compatibility:
  - claude-code
---

# Publish Release

## PURPOSE

Publish a strategy live using the site-deployments API. The flow is:
1. Submit to server for quality review via `agent_start_run` (needs `proposalId`)
2. Server tests, fixes, approves
3. Deploy the page via `POST /v2/handles/{handle}/site-deployments` with `{"inlineHtml": "<html>"}` (JWT auth)

**IMPORTANT**: `links_upsert` only creates redirect links (302 redirects). It does NOT host pages. Page hosting uses the site-deployments API with JWT (Cognito) auth, NOT PAT.

You need `USER_PAT` for MCP connection (server review) and `LINK_PLATFORM_PAT` (JWT) for site-deployments.

## INPUTS

- **strategyId** (required): From `.10x/strategy.json` or `agent_list_proposals`
- **slug** (required): URL slug for the page (e.g., "summer-sale")
- **handle** (required): Your handle (from `LINK_PLATFORM_HANDLE` env)
- **html** (required): The HTML content to publish
- **title** (required): Page title
- **description** (optional): Page meta description

## PRECONDITIONS

1. Strategy exists and is in `draft` status — check with `agent_get_run_status`
2. HTML content has been created and approved by server
3. `USER_PAT` and `LINK_PLATFORM_HANDLE` env vars are set

## PROCEDURE

### Step 1: Verify Strategy Status

```
agent_get_run_status({ handle: "<handle>", strategyId: "<strategyId>" })
```

Ensure status is `draft` or server-approved. If not yet approved, submit via `agent_start_run` first.

### Step 2: Submit for Server Review (if not already reviewed)

**Note**: `agent_start_run` requires a `proposalId` parameter.

```
agent_start_run({
  html: "<html>",
  handle: "<handle>",
  slug: "<slug>",
  strategyId: "<strategyId>",
  proposalId: "<proposalId>",
  intent: "review_and_publish"
})
```

Wait for the response with approval verdict.

### Step 3: Deploy Page via Site-Deployments API

**IMPORTANT**: Use the site-deployments API (NOT `links_upsert`) to host the page. `links_upsert` only creates redirect links.

**Auth**: Requires JWT (Cognito token) from `LINK_PLATFORM_PAT` in `.env`, NOT the PAT used for MCP.

```bash
curl -X POST "https://api.10x.in/v2/handles/<handle>/site-deployments" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"inlineHtml": "<full html content>"}'
```

Response: `201 Created` with `{"deploymentId": "...", "status": "ACTIVE"}` -- page is immediately live. **Check for HTTP 201 status** to confirm successful creation (not 200).

**Multi-file mode**: If deploying multiple files, the `files` array must include a root `index.html`. Without it, activation fails with `missing_entrypoint`.

### Step 4: Verify Deployment via Preview

After a successful `201 Created` response, verify using the preview endpoint:

```bash
curl -s "https://api.10x.in/v2/handles/<handle>/site-deployments/<deploymentId>/preview" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

This returns a signed preview URL. Use it to confirm content is correct.

The site-deployments API auto-activates. No separate publish step needed.

Also verify live:
```bash
curl -s -o /dev/null -w "%{http_code}" "https://<handle>.10x.in"
```

**Live URL:** `https://<handle>.10x.in`

### Step 5: Update Local Reference

Update `.10x/strategy.json`:
```json
{
  "status": "live",
  "slug": "<slug>",
  "liveUrl": "https://<handle>.10x.in/<slug>",
  "publishedAt": "<ISO timestamp>"
}
```

### Step 6: Report

```
PUBLISHED LIVE
==============
Strategy:  <name> (<strategyId>)
Page:      <slug>
Live URL:  https://<handle>.10x.in/<slug>
Status:    live

To rollback: run rollback_release skill (uses agent_rollback_run)
To monitor:  run analytics_get or marketer-sync skill
```

## STOP CONDITIONS

- STOP if strategy is not in `draft` state
- STOP if server review verdict is `needs_revision` or `rejected`
- STOP if site-deployments API call fails (expect 201, not 200)
- STOP if `missing_entrypoint` error (multi-file mode missing root `index.html`)
- STOP if user does not confirm before publishing

## FAILURE HANDLING

- If site-deployments API fails: check JWT token in `LINK_PLATFORM_PAT`, verify handle is correct. Expect `201 Created` response.
- If `missing_entrypoint` error: multi-file deployment is missing a root `index.html` file. Add one and retry.
- If auth fails on MCP tools: verify `USER_PAT` in `.env`
- If auth fails on site-deployments: verify `LINK_PLATFORM_PAT` (JWT/Cognito) in `.env`
- If handle not found: verify `LINK_PLATFORM_HANDLE` in `.env`
- If server review rejects: address feedback and resubmit via `agent_start_run`
- If payload too large for MCP (~1KB limit): use direct site-deployments API call
