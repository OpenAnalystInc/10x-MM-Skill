---
name: scaffold_funnel_routes
description: >
  Take a validated funnel spec and create page files with navigation wiring.
  Trigger words: scaffold funnel, generate pages, wire funnel, create funnel pages, scaffold routes.
metadata:
  version: "1.0.0"
  category: build
  domain: marketing-engineering
compatibility:
  - claude-code
  - cursor
  - gemini-cli
---

# Scaffold Funnel Routes

## PURPOSE
Take a validated funnel spec JSON file and deterministically generate the page files, directory structure, and navigation wiring. This is a pure code generation step — no AI reasoning needed.

## INPUTS
- **funnel_spec_path** (required): Path to the validated funnel spec JSON (e.g., `funnels/product-launch.json`)
- **output_dir** (optional): Base directory for generated pages (default: `pages/`)
- **template_style** (optional): HTML template style — `minimal`, `tailwind`, `custom` (default: `minimal`)

## PRECONDITIONS
1. The funnel spec file exists and is valid JSON
2. The funnel spec conforms to the Funnel schema (has `pages`, `navigation_rules`, `success_conditions`)
3. The output directory's parent exists
4. No existing files will be overwritten (check first)

## ALLOWED CHANGES
- Create new HTML/JSX page files at paths defined in the funnel spec
- Create a navigation manifest file (`_nav.json`) in the output directory
- Create the output directory and subdirectories as needed
- Add `data-testid` attributes matching `required_selectors` from the spec

## FORBIDDEN CHANGES
- Do NOT overwrite existing page files — STOP and warn if conflicts exist
- Do NOT modify the funnel spec file
- Do NOT add JavaScript logic beyond navigation links and data attributes
- Do NOT install packages or modify package.json
- Do NOT inject analytics/tracking code (that's `add_tracking_events` skill)
- Do NOT add custom CSS beyond structural layout

## PROCEDURE
1. **Read Spec**: Parse the funnel spec JSON file
2. **Check Conflicts**: For each page in the spec, check if `file_path` already exists. If any do, STOP and list conflicts.
3. **Create Directory Structure**: Create all necessary directories for page file paths
4. **Generate Pages**: For each page in the spec:
   a. Create an HTML file at the specified `file_path`
   b. Apply the `layout_type` as a CSS class on the body/main element
   c. Add placeholder sections for each block in `blocks[]` (empty divs with `data-block-id`)
   d. Add `data-testid` attributes for each entry in `required_selectors`
   e. Set `<title>` and `<meta>` from `seo_meta` if present
   f. Add navigation links based on `navigation_rules` where this page is the `from`
5. **Generate Nav Manifest**: Create `_nav.json` with the complete navigation graph
6. **Verify**: Check all files were created successfully

## COMMANDS TO RUN
```bash
# Read and validate the spec
node -e "const f=JSON.parse(require('fs').readFileSync('{funnel_spec_path}','utf8')); console.log(f.pages.length + ' pages to scaffold')"

# After scaffolding, verify all files exist
for file in {list_of_file_paths}; do
  test -f "$file" && echo "OK: $file" || echo "MISSING: $file"
done
```

## OUTPUT FORMAT
```
Scaffolded 4 pages from "Product Launch Funnel":
  CREATED pages/landing.html        (hero-split, 3 blocks, 2 selectors)
  CREATED pages/features.html       (two-column, 4 blocks, 1 selector)
  CREATED pages/pricing.html        (single-column, 2 blocks, 1 selector)
  CREATED pages/checkout.html       (full-width, 1 block, 2 selectors)
  CREATED pages/_nav.json           (4 routes, 3 navigation rules)

Navigation graph:
  /landing → /features (cta_click)
  /features → /pricing (scroll_bottom)
  /pricing → /checkout (plan_select)
```

## STOP CONDITIONS
- STOP if the funnel spec file does not exist or is not valid JSON
- STOP if any `file_path` in the spec already exists (list conflicts)
- STOP if the spec has zero pages
- STOP if any page is missing required fields (`route`, `file_path`, `layout_type`)

## FAILURE HANDLING
- If a directory cannot be created, report the OS error and suggest checking permissions
- If the spec is malformed, show the parse error with context
- If a file write fails, report which files succeeded and which failed
- On partial failure, do NOT clean up created files — let the user decide
