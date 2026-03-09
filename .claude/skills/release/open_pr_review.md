---
name: open_pr_review
description: >
  Run audit via system_audit_events then submit work to server for final review via agent_start_run.
  Trigger words: open pr, review, code review, pr review, submit for review.
metadata:
  version: "3.0.0"
  category: release
  domain: marketing-engineering
compatibility:
  - claude-code
---

# Open PR Review

## PURPOSE

Run an audit on the HTML content using `system_audit_events`, then submit the work to the server for final review via `agent_start_run`. The server tests, validates, and returns a verdict.

## INPUTS

- **html** (required): HTML content to review
- **strategyId** (required): Strategy ID (from `.10x/strategy.json`)
- **handle** (required): Your handle (from `LINK_PLATFORM_HANDLE` env)
- **slug** (required): Target page slug

## PROCEDURE

### Step 1: Run Audit

Use the `system_audit_events` MCP tool to validate the content:

```
system_audit_events({
  html: "<html>",
  handle: "<handle>"
})
```

The audit checks HTML structure, links, CSS, and performance. If the audit returns failures, fix the issues before proceeding.

### Step 2: Submit to Server for Review

Once the audit passes, submit the work:

```
agent_start_run({
  html: "<html>",
  handle: "<handle>",
  slug: "<slug>",
  strategyId: "<strategyId>",
  intent: "review"
})
```

### Step 3: Handle Server Verdict

The server will return a verdict: `approved`, `needs_revision`, or `rejected`.

| Verdict | Action |
|---------|--------|
| `approved` | Proceed to `publish_release` |
| `needs_revision` | Fix the specific feedback, resubmit |
| `rejected` | Review server feedback and address issues |

### Step 4: Report

```
PR REVIEW SUBMITTED
===================
Audit:      PASS
Submitted:  to server for final review

Verdict: <approved / needs_revision / rejected>

Next: publish_release (if approved)
```

## STOP CONDITIONS

- STOP if `system_audit_events` returns critical failures
- STOP if `agent_start_run` returns error

## FAILURE HANDLING

- If audit fails: fix HTML then re-run
- If server returns `needs_revision`: address feedback, resubmit via `agent_start_run`
- If server returns `rejected` after 2 rounds: review feedback carefully
