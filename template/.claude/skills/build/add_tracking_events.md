---
name: add_tracking_events
description: >
  Add event tracking attributes to page elements matching a tracking contract. Calls POST /tracking/ensure on the server.
  Trigger words: add tracking, wire tracking, tracking events, add analytics, connect tracking, ensure tracking.
metadata:
  version: "1.0.0"
  category: build
  domain: marketing-engineering
compatibility:
  - claude-code
  - cursor
  - gemini-cli
---

# Add Tracking Events

## PURPOSE
Add `data-track-*` attributes to page elements to match a tracking contract. Before adding, call the server's `POST /tracking/ensure` endpoint to verify tracking infrastructure exists. If not, guide the user through the plan/apply flow.

## INPUTS
- **page_path** (required): Path to the page file to instrument
- **strategy_id** (required): Strategy ID for the tracking contract
- **workspace_id** (required): Workspace ID
- **events** (required): Array of events to track: `{ event_name, selector, event_type }`
  - `event_type` must be: `click`, `impression`, `form_submit`, `scroll`, `custom`
- **api_url** (optional): Server URL (default: `https://api.10x.in`)
- **api_key** (optional): API key or JWT for authentication

## PRECONDITIONS
1. The target page file exists
2. The server is reachable at the API URL
3. User has valid authentication credentials
4. Each `selector` in the events array matches at least one element in the page

## ALLOWED CHANGES
- Add `data-track-event`, `data-track-type`, and `data-track-props` attributes to existing elements
- Add `data-tracking-strategy="{strategy_id}"` to the page's body/main element
- Create a tracking manifest file (`_tracking.json`) alongside the page

## FORBIDDEN CHANGES
- Do NOT add JavaScript tracking code or scripts
- Do NOT modify element content, structure, or existing attributes
- Do NOT remove existing `data-track-*` attributes
- Do NOT create new HTML elements
- Do NOT call POST /tracking/plan or /tracking/apply without user confirmation

## PROCEDURE
1. **Call POST /tracking/ensure**: Send the tracking contract to the server
   ```
   POST {api_url}/api/v1/tracking/ensure
   Body: {
     "contract": {
       "strategy_id": "{strategy_id}",
       "events_required": [list of event_names],
       "properties": {},
       "aggregation": []
     },
     "workspace_id": "{workspace_id}"
   }
   ```
2. **Check Response**:
   - If `exists: true` → tracking infra is ready, proceed to step 4
   - If `exists: false` → inform user and suggest running `POST /tracking/plan` + `POST /tracking/apply`. STOP until user confirms.
3. **Wait for Confirmation**: If infra doesn't exist, the user must approve the migration plan before proceeding
4. **Read Page**: Load the target HTML file
5. **For Each Event**:
   a. Find element(s) matching `selector` in the HTML
   b. Add `data-track-event="{event_name}"` attribute
   c. Add `data-track-type="{event_type}"` attribute
   d. If the event has custom properties, add `data-track-props='{json}'`
6. **Add Strategy Marker**: Add `data-tracking-strategy="{strategy_id}"` to the `<main>` or `<body>` element
7. **Write Tracking Manifest**: Create `_tracking.json` with all event mappings
8. **Write Page**: Save the modified page
9. **Verify**: Check all attributes were added

## COMMANDS TO RUN
```bash
# Check server is reachable
curl -sf "{api_url}/health" > /dev/null && echo "Server OK" || echo "ERROR: Server unreachable"

# Call tracking ensure
curl -X POST "{api_url}/api/v1/tracking/ensure" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"contract":{"strategy_id":"{strategy_id}","events_required":[...],"properties":{},"aggregation":[]},"workspace_id":"{workspace_id}"}'

# After wiring, verify attributes
grep -c 'data-track-event' "{page_path}"
```

## OUTPUT FORMAT
```
Tracking infrastructure: READY (Model A, contract abc12345)

Wired 4 events in pages/landing.html:
  [data-testid='hero-cta']     → click:cta_click
  [data-testid='form-block']   → form_submit:lead_capture
  [data-testid='pricing-card'] → click:plan_select
  body                         → impression:page_view

Created _tracking.json with 4 event mappings
Strategy marker: data-tracking-strategy="abc12345"
```

## STOP CONDITIONS
- STOP if the server is unreachable
- STOP if authentication fails (401/403)
- STOP if tracking infrastructure doesn't exist AND user hasn't approved the migration plan
- STOP if any selector doesn't match an element in the page
- STOP if the page file doesn't exist

## FAILURE HANDLING
- If the server returns an error, show the status code and error message
- If a selector doesn't match, list all available selectors in the page
- If the /ensure call shows infra missing, show the server's response and guide user to /tracking/plan
- On network errors, suggest checking server URL and that Docker is running
