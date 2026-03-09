---
name: create_strategy_branch
description: >
  Create a new strategy via agent_create_proposal MCP tool.
  Trigger words: new strategy, create strategy, register strategy, start strategy.
metadata:
  version: "3.0.0"
  category: release
  domain: marketing-engineering
compatibility:
  - claude-code
---

# Create Strategy

## PURPOSE

Create a new strategy via the Marketing Manager MCP server using the `agent_create_proposal` tool. Your server handles all backend storage and auth.

## INPUTS

- **name** (required): Human-readable strategy name (e.g., "Summer Sale Campaign")
- **description** (required): What this strategy does
- **goal** (required): Conversion goal (e.g., "lead generation", "product sale")
- **handle** (required): Your handle/workspace (from `LINK_PLATFORM_HANDLE` env)

## PROCEDURE

### Step 1: Create Strategy

Call the MCP tool:

```
agent_create_proposal({
  handle: "<your-handle>",
  name: "<strategy_name>",
  description: "<description>",
  goal: "<goal>"
})
```

**Response includes:**
- `strategyId` — unique strategy identifier
- `status: "draft"`

### Step 2: Save Local Reference

Write to `.10x/strategy.json`:

```json
{
  "strategyId": "<from response>",
  "name": "<strategy_name>",
  "handle": "<handle>",
  "status": "draft",
  "created_at": "<ISO timestamp>"
}
```

### Step 3: Report

```
STRATEGY CREATED
================
Strategy ID:  <strategyId>
Status:       draft
Handle:       <handle>

Local ref:    .10x/strategy.json (created)

Next steps:
  1. Build pages — landing-page skill or lp-* skills
  2. Wire tracking — lp-inject / lp-analytics skills
  3. Submit for server review — agent_start_run
  4. Publish — publish_release skill (uses links_upsert)
```

## STOP CONDITIONS

- STOP if `agent_create_proposal` returns an error
- STOP if handle is not set (check `LINK_PLATFORM_HANDLE` env)

## FAILURE HANDLING

- If tool fails with auth error: check `USER_PAT` env var is set
- If tool fails with handle error: verify `LINK_PLATFORM_HANDLE` is correct
- On any MCP error: report full error to user
