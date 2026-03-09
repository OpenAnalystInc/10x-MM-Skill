---
name: rollback_release
description: >
  Rollback a published strategy using agent_rollback_run MCP tool.
  Trigger words: rollback, revert, undo release, restore previous, rollback release.
metadata:
  version: "3.0.0"
  category: release
  domain: marketing-engineering
compatibility:
  - claude-code
---

# Rollback Release

## PURPOSE

Rollback a live strategy using the `agent_rollback_run` MCP tool. This archives the strategy and takes the page offline. Your server handles all backend operations.

## INPUTS

- **strategyId** (required): Strategy to rollback
- **handle** (required): Your handle/workspace (from `LINK_PLATFORM_HANDLE` env)
- **slug** (optional): If provided, also takes the live page offline
- **reason** (optional): Why you're rolling back (for audit trail)

## PRECONDITIONS

1. Strategy exists and has status `live` — check with `agent_get_run_status`
2. `USER_PAT` and `LINK_PLATFORM_HANDLE` env vars are set

## PROCEDURE

### Step 1: Confirm Strategy Is Live

```
agent_get_run_status({ handle: "<handle>", strategyId: "<strategyId>" })
```

Verify status is `live`. If already archived, inform user — nothing to do.

### Step 2: Confirm With User

```
About to rollback:
  Strategy: <name> (<strategyId>)
  Page:     <slug> (will be taken offline if slug provided)
  This will archive the strategy and take the page offline.
  Continue? [y/N]
```

### Step 3: Rollback via MCP

```
agent_rollback_run({
  handle: "<handle>",
  strategyId: "<strategyId>",
  slug: "<slug>",
  reason: "<reason>"
})
```

The server handles archiving the strategy and taking the page offline.

### Step 4: Update Local Reference

Update `.10x/strategy.json`:
```json
{
  "status": "archived",
  "rolledBackAt": "<ISO timestamp>",
  "rollbackReason": "<reason>"
}
```

### Step 5: Report

```
ROLLED BACK
===========
Strategy:   <name> (<strategyId>)  live -> archived
Page:       <slug> (taken offline)
Rolled back: <timestamp>

The strategy is now archived. Data is preserved for reference.

To re-publish: create a new strategy via agent_create_proposal
```

## STOP CONDITIONS

- STOP if strategy is not `live` (already archived or still draft)
- STOP if user does not confirm
- STOP if `agent_rollback_run` fails

## FAILURE HANDLING

- If strategy is already archived: inform user, no action needed
- If rollback fails: report server error to user
- If auth fails: verify `USER_PAT` in `.env`
