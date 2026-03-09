---
description: Deploy an approved strategy to your live handle on 10x.in. Uses Link Platform MCP tools to create the page, publish it, and start tracking.
---

# Deploy Strategy to Live

You are deploying a user's strategy to their live handle on the Link Platform. This makes the page accessible at `https://{handle}.10x.in/{slug}`.

## Step 0: Verify Access Tier

Read `.env` and check `USER_PAT`. Decode the JWT payload and verify it is not expired.

- If no PAT or expired: **STOP**. Tell user: "Deploy requires a valid PAT (full tier). Your PAT is [missing/expired]. Get a fresh one from your 10x.in profile settings."
- If PAT valid: proceed to Step 1.
- If local tier (BYOK only): **STOP**. Tell user: "Deploy requires server access (full tier). You can build pages locally but need a PAT from 10x.in to publish."

This check prevents wasted work — don't build content only to fail at the publish step.

## Prerequisites

Load the `.env` file from the plugin root. Verify these are set:
- `LINK_PLATFORM_HANDLE`
- `USER_PAT`

If `.env` is missing, tell the user: "Run /setup first to configure your environment."

**MCP Server URL**: `https://{LINK_PLATFORM_HANDLE}.mcp.10x.in`

**MCP Session**: Check `.mm/mcp-session.json` for a stored session ID. If none exists or expired, initialize a new MCP session first (see handoff-protocol.md).

## Step 1: Identify What to Deploy

Check the arguments. User may provide:
- A strategy name or ID
- A project folder path
- Or nothing (auto-detect from context)

If no argument:
1. Read `.mm/context.json` for recent work and strategies
2. Read `.10x/sync-data.json` for draft strategies
3. Use `agent_list_proposals` MCP tool with `status: 'draft'` to find recent drafts
4. Ask the user to confirm which strategy to deploy

Ask the user: "Deploy strategy `{name}` to `{handle}.10x.in/{slug}`?"

## Step 2: Determine the Slug

Generate a slug from the strategy name:
- "Summer Flash Sale" -> `summer-flash-sale`
- Kebab-case, lowercase, max 50 chars
- User can override with `--slug custom-name`

## Step 3: Collect the Page Content

Find the built HTML to deploy. Look in order:
1. `projects/{project}/build/index.html` (from landing-page skill)
2. Argument-provided path
3. Ask the user for the path

Read the HTML content. **Verify official WebMCP library (`webmcp.js`) is loaded** before deploying.

## Upload Mode Selection

Detect the project structure and choose the appropriate upload mode:
- Single `index.html` with inline CSS/JS → use `inlineHtml` param (single HTML mode)
- Multiple files (HTML + CSS + JS) → use `files` param (multi-file mode, returns S3 putUrls for upload)

**Note**: Folder upload mode is NOT supported by the site-deployments API. For multi-asset projects, use multi-file mode.

**IMPORTANT**: Multi-file deployments must include a root `index.html`. Without it, activation fails with `missing_entrypoint`.

## Step 4: Deploy Page via Site-Deployments API

**IMPORTANT**: Page hosting uses the site-deployments API, NOT `links_upsert`. The `links_upsert` tool only creates redirect links -- it does NOT host HTML pages.

**Auth**: Site-deployments requires a JWT (Cognito token), NOT a PAT. Read `LINK_PLATFORM_PAT` from `.env` for the JWT. If not set, ask the user for their JWT token.

**Note**: The MCP proxy has a payload size limit (~1KB). Large HTML content MUST go through the direct API, not through MCP.

### Single HTML Mode (most common)

```bash
curl -X POST "https://api.10x.in/v2/handles/{handle}/site-deployments" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"inlineHtml": "<full html content>"}'
```

Response: `201 Created` with `{"deploymentId": "...", "status": "ACTIVE"}` -- page is immediately live at `https://{handle}.10x.in`. **Check for HTTP 201 status** to confirm successful creation (not 200).

### Multi-File Mode

```bash
curl -X POST "https://api.10x.in/v2/handles/{handle}/site-deployments" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"files": [{"path": "index.html", "contentType": "text/html", "sizeBytes": 1234}, {"path": "styles.css", "contentType": "text/css", "sizeBytes": 567}]}'
```

Response (`201 Created`) includes `putUrls` for each file. Upload each file to its S3 putUrl, then the deployment auto-activates.

**IMPORTANT**: The files array must include a root `index.html`. Without it, activation fails with `missing_entrypoint`.

## Step 5: Verify Deployment via Preview

After a successful `201 Created` response, verify the deployment using the preview endpoint:

```bash
curl -s "https://api.10x.in/v2/handles/{handle}/site-deployments/{deploymentId}/preview" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

This returns a signed preview URL. Use it to confirm content is correct before relying on the live URL.

The site-deployments API auto-activates the page. No separate publish step is needed.

Also verify live: `curl -s -o /dev/null -w "%{http_code}" "https://{handle}.10x.in"` should return 200.

## Step 6: Create Campaign Redirect Links (Optional)

Use the `links_upsert` MCP tool to create campaign **redirect links** only (302 redirects for tracking):
- `slug`: the link slug (e.g., `summer-sale-twitter`)
- `payload`: link configuration object with target URL
- `handle`: from env (optional)

**IMPORTANT**: `links_upsert` creates SHORT REDIRECT LINKS only. It does NOT host pages. Use it for campaign tracking URLs that redirect to your deployed page.

## Step 7: Post-Deploy Verification

Use the `system_health` MCP tool to verify server health, then confirm the page is live:

```bash
curl -s -o /dev/null -w "%{http_code}" "https://{handle}.10x.in"
```

## Step 8: Log to Session

After successful deployment, log the tool calls to `.mm/sessions/current.json` (session tracking).

## Step 9: Save Reference Locally

Write/update `.10x/deployments.json`:

```json
{
  "deployments": [
    {
      "slug": "{slug}",
      "strategyId": "{strategyId}",
      "live_url": "https://{handle}.10x.in/{slug}",
      "deployed_at": "{timestamp}",
      "status": "live"
    }
  ]
}
```

Create `.10x/` directory if it doesn't exist.

## Step 10: Re-Sync

Run `/sync` to refresh local data with the new deployment.

## Step 11: Print Result

```
Deployed!

  Live URL: https://{handle}.10x.in/{slug}
  Strategy: {strategyId}
  Status: LIVE — tracking active

  WebMCP: Integrated — agents can interact with this page
  Analytics: run analytics_get or /sync to see performance

  Share this link with your audience.
  Metrics will appear within minutes of the first visit.
  Run /sync to pull latest data locally.
```

## Error Handling

- If the deployment already exists, the new deployment will replace it (site-deployments overwrites)
- If the API is unreachable, save the deployment intent locally and tell user to retry
- If official WebMCP library is missing from HTML, warn and ask to add it before deploying
- If strategy doesn't exist, list available drafts and let user pick
- If `missing_entrypoint` error: multi-file deployment is missing a root `index.html` file. Add one and retry.
- If 401/unauthorized on site-deployments: JWT has expired. Tell user: "Your JWT token has expired. Get a fresh one from your Cognito auth and update LINK_PLATFORM_PAT in .env"
- If 401/unauthorized on MCP tools: PAT has expired. Tell user: "Your PAT has expired (JWT tokens last 1 hour). Get a fresh one from your 10x.in profile settings and update .env"
- If MCP session expired: re-initialize session and retry
- If payload too large for MCP proxy (~1KB limit): use direct API call to site-deployments instead

$ARGUMENTS
