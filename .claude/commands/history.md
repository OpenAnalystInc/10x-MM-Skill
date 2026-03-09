---
description: Browse past sessions, show summaries, and session context
user-invocable: true
---

# /history — Session History

Show past Marketing Manager sessions with summaries and context.

## Steps

### 1. Load Session Data

Read the session tracking module:
- Check if `.mm/` directory exists. If not: "No session data found. Sessions are logged automatically when you use server tools."
- Read `.mm/context.json` for the rolling summary
- List `.mm/sessions/` for archived session files (most recent first)

### 2. Show Rolling Context

If `.mm/context.json` exists, show:

```
Session Context (last 3 sessions)
──────────────────────────────────────

  Last Session: {date} ({duration})
    Accomplished:
      - {item}
    In Progress:
      - {item}
    Open Issues:
      - {item}

  Active Strategies:
    - {name} ({status})

  Total Sessions: {count}
  Recent Tool Calls: {count}
```

### 3. List Archived Sessions

For each session file in `.mm/sessions/` (most recent first, max 10):

```
  {date}  {duration}  {toolCallCount} calls  {accomplished summary}
```

### 4. Show Details (if user asks)

If the user asks about a specific session, read the full JSON file and show:
- Session ID, start/end time, duration
- All tool calls with timestamps
- Strategies, pages, links touched
- Audit results
- Errors
- Summary

### 5. Current Session

If `.mm/sessions/current.json` exists, also show:

```
  Current Session (active)
    Started: {startedAt}
    Tool Calls: {count}
    Strategies: {list}
    Pages: {list}
```

### Output

Present the information clearly. If no sessions exist, tell the user sessions are logged automatically when they use server tools and suggest running `/health` or any server tool to start.
