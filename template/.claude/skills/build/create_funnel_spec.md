---
name: create_funnel_spec
description: >
  Generate a validated funnel specification JSON file from user requirements.
  Trigger words: create funnel, new funnel, funnel spec, define funnel, build funnel.
metadata:
  version: "1.0.0"
  category: build
  domain: marketing-engineering
compatibility:
  - claude-code
  - cursor
  - gemini-cli
---

# Create Funnel Spec

## PURPOSE
Generate a complete funnel specification JSON file that conforms to the Funnel schema. The funnel defines a sequence of pages with navigation rules, required events, and success conditions.

## INPUTS
- **funnel_name** (required): Human-readable name for the funnel (e.g., "Product Launch Funnel")
- **pages** (required): List of page descriptions with routes and layout types
- **success_conditions** (required): What constitutes a successful funnel completion (e.g., form submit, purchase)
- **navigation_rules** (optional): Custom rules for page-to-page flow
- **required_events** (optional): Events that must fire during the funnel

## PRECONDITIONS
1. Working directory contains a valid project with `package.json`
2. The server is reachable at the configured API URL (default: `https://api.10x.in`)
3. User has authenticated and has a valid JWT or API key
4. The Funnel schema definition is available at `src/shared/schemas/funnel.ts` on the server

## ALLOWED CHANGES
- Create a new `.json` file in the `funnels/` directory (create dir if needed)
- Create a new `.json` file at a user-specified path
- Write to stdout for preview

## FORBIDDEN CHANGES
- Do NOT modify any existing funnel spec files
- Do NOT modify server code or schema definitions
- Do NOT create TypeScript/JavaScript files — output is JSON only
- Do NOT add dependencies to package.json
- Do NOT execute arbitrary code

## PROCEDURE
1. **Gather Requirements**: Parse user inputs for funnel name, pages, and success conditions
2. **Validate Page Structure**: For each page, ensure it has:
   - A unique `route` (e.g., `/landing`, `/pricing`, `/checkout`)
   - A `file_path` relative to project root
   - A `layout_type` from allowed set: `single-column`, `two-column`, `hero-split`, `full-width`
   - A `blocks` array (can be empty initially)
   - Optional `seo_meta` object with `title`, `description`, `og_image`
   - Optional `required_selectors` array for testing
3. **Build Navigation Rules**: Define page-to-page flow as an array of `{ from, to, condition }` objects
4. **Define Required Events**: List events that must fire (e.g., `page_view`, `form_submit`, `cta_click`)
5. **Set Success Conditions**: Define completion criteria as `{ event, page, value_threshold? }`
6. **Generate Spec**: Assemble the complete funnel spec with a UUID `id`, workspace_id placeholder, and timestamp
7. **Validate**: Verify the spec matches the Funnel schema structure
8. **Write File**: Save to `funnels/{funnel_name_slug}.json`

## COMMANDS TO RUN
```bash
# Create funnels directory if it doesn't exist
mkdir -p funnels

# After writing the spec file, validate JSON syntax
node -e "JSON.parse(require('fs').readFileSync('funnels/{filename}.json', 'utf8')); console.log('Valid JSON')"
```

## OUTPUT FORMAT
```json
{
  "id": "<uuid>",
  "workspace_id": "<placeholder-or-actual>",
  "name": "Product Launch Funnel",
  "pages": [
    {
      "route": "/landing",
      "file_path": "pages/landing.html",
      "layout_type": "hero-split",
      "blocks": [],
      "seo_meta": { "title": "Welcome", "description": "..." },
      "required_selectors": ["[data-testid='hero']", "[data-testid='cta']"]
    }
  ],
  "navigation_rules": [
    { "from": "/landing", "to": "/pricing", "condition": "cta_click" }
  ],
  "required_events": ["page_view", "cta_click"],
  "success_conditions": [
    { "event": "form_submit", "page": "/checkout" }
  ]
}
```

## STOP CONDITIONS
- STOP if the user provides fewer than 1 page — a funnel must have at least one page
- STOP if no success conditions are defined — every funnel must define what "success" means
- STOP if a page route is duplicated
- STOP if layout_type is not in the allowed set

## FAILURE HANDLING
- If JSON validation fails, show the exact parse error and the line number
- If a required field is missing, list all missing fields and ask the user to provide them
- If the funnels directory cannot be created, report the filesystem error
- Never silently skip validation errors — always surface them
