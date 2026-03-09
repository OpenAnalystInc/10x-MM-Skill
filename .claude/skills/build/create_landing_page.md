---
name: create_landing_page
description: >
  Create a single landing page from a Page schema definition with layout, blocks, and SEO meta.
  Trigger words: create page, new landing page, add page, build page, create landing.
metadata:
  version: "1.0.0"
  category: build
  domain: marketing-engineering
compatibility:
  - claude-code
  - cursor
  - gemini-cli
---

# Create Landing Page

## PURPOSE
Create a single landing page file from a Page schema definition. The page includes a layout type, content blocks, SEO metadata, and test selectors.

## INPUTS
- **page_name** (required): Human-readable name (e.g., "Product Hero Page")
- **route** (required): URL path for the page (e.g., `/landing`)
- **file_path** (required): Where to create the file (e.g., `pages/landing.html`)
- **layout_type** (required): One of `single-column`, `two-column`, `hero-split`, `full-width`
- **blocks** (optional): Array of block definitions to include (type + props)
- **seo_meta** (optional): Object with `title`, `description`, `og_image`

## PRECONDITIONS
1. The target file does not already exist (do NOT overwrite)
2. The parent directory exists or can be created
3. The `layout_type` is one of the 4 allowed values
4. If blocks are specified, each must have a valid `type` from the Block schema whitelist

## ALLOWED CHANGES
- Create one new HTML file at the specified `file_path`
- Create parent directories if needed
- Add `data-testid` attributes for each block and required selector

## FORBIDDEN CHANGES
- Do NOT overwrite existing files
- Do NOT modify other pages or the funnel spec
- Do NOT add JavaScript beyond structural `data-` attributes
- Do NOT inject tracking code or analytics
- Do NOT add external CDN links or third-party scripts

## PROCEDURE
1. **Validate Inputs**: Check layout_type is valid, route starts with `/`, file_path ends with `.html`
2. **Check File**: Verify target path does not exist
3. **Create Directories**: `mkdir -p` for parent directory
4. **Build HTML Structure**:
   a. DOCTYPE + html + head with charset, viewport, SEO meta tags
   b. Body with `data-route="{route}"` and `data-layout="{layout_type}"`
   c. Main element with layout class
   d. For each block: a `<section>` with `data-block-id="{block.id}"`, `data-block-type="{block.type}"`, and `data-testid="{block.type}-block"`
   e. Each block section contains a placeholder comment and structural markup appropriate to the block type
5. **Add Test Selectors**: Add `data-testid` attributes for required_selectors
6. **Write File**: Save the HTML file
7. **Verify**: Confirm file exists and is valid HTML structure

## COMMANDS TO RUN
```bash
# Create directory
mkdir -p $(dirname "{file_path}")

# After creation, verify
test -f "{file_path}" && echo "CREATED: {file_path}" || echo "FAILED: {file_path}"
```

## OUTPUT FORMAT
```
CREATED pages/landing.html
  Route:    /landing
  Layout:   hero-split
  Blocks:   hero, features, cta (3 total)
  SEO:      title="Welcome" description="..."
  Selectors: [data-testid='hero-block'], [data-testid='cta-block']
```

## STOP CONDITIONS
- STOP if the target file already exists
- STOP if `layout_type` is not one of: `single-column`, `two-column`, `hero-split`, `full-width`
- STOP if `route` does not start with `/`
- STOP if a block `type` is not in the whitelist: `hero`, `pricing`, `faq`, `form`, `testimonials`, `cta`, `features`, `footer`, `navbar`, `content`

## FAILURE HANDLING
- If the file already exists, report the conflict and suggest using a different path
- If an invalid block type is provided, list the allowed types
- If directory creation fails, report the filesystem error
- If HTML structure validation fails, show what's wrong
