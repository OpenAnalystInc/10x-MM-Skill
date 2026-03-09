---
name: generate_preview
description: >
  Generate a preview by submitting HTML content to the server via agent_start_run.
  Trigger words: preview, generate preview, preview url, test preview.
metadata:
  version: "3.0.0"
  category: release
  domain: marketing-engineering
compatibility:
  - claude-code
---

# Generate Preview

## PURPOSE

Submit local HTML content to the server via `agent_start_run` for preview generation. The server processes the content and returns a preview URL.

## INPUTS

- **html** (required): HTML content to preview (from landing-page or build skills)
- **handle** (required): Your handle (from `LINK_PLATFORM_HANDLE` env)
- **slug** (optional): Target page slug for preview context

## PROCEDURE

### Step 1: Submit Content for Preview

```
agent_start_run({
  html: "<html_content>",
  handle: "<handle>",
  slug: "<slug>",
  intent: "preview"
})
```

The server processes the content and returns a preview URL.

### Step 2: Report

```
PREVIEW READY
=============
Preview URL:  <preview_url from response>
Handle:       <handle>
Page Slug:    <slug>

Share this URL to review before publishing.
Next: run open_pr_review or publish_release
```

## STOP CONDITIONS

- STOP if `agent_start_run` returns an error
- STOP if HTML content is empty

## FAILURE HANDLING

- If submission fails: check the error message from the server response
- If auth fails: verify `USER_PAT` in `.env`
- Never run a local build server — always submit via MCP
