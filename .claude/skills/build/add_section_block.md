---
name: add_section_block
description: >
  Add a content block (hero, pricing, FAQ, etc.) to an existing page file.
  Trigger words: add block, add section, insert block, new section, add hero, add pricing, add faq.
metadata:
  version: "1.0.0"
  category: build
  domain: marketing-engineering
compatibility:
  - claude-code
  - cursor
  - gemini-cli
---

# Add Section Block

## PURPOSE
Add a validated content block to an existing landing page. Each block has a type from the whitelist, typed props, and test selectors.

## INPUTS
- **page_path** (required): Path to the existing HTML page file
- **block_type** (required): One of `hero`, `pricing`, `faq`, `form`, `testimonials`, `cta`, `features`, `footer`, `navbar`, `content`
- **block_props** (required): Props object for the block (varies by type)
- **position** (optional): Where to insert — `before:{block_id}`, `after:{block_id}`, or `end` (default: `end`)

## PRECONDITIONS
1. The target page file exists
2. The `block_type` is in the allowed whitelist
3. The page has a `<main>` element where blocks are placed
4. If `position` references a block_id, that block exists in the page

## ALLOWED CHANGES
- Insert one new `<section>` element into the page's `<main>` at the specified position
- Add `data-block-id`, `data-block-type`, and `data-testid` attributes to the section
- Add structural HTML content inside the section based on block type and props

## FORBIDDEN CHANGES
- Do NOT remove or modify existing blocks
- Do NOT change the page layout, head, or meta tags
- Do NOT add JavaScript, inline styles, or external resources
- Do NOT modify any file other than the target page
- Do NOT rename existing IDs, classes, or data attributes

## PROCEDURE
1. **Read Page**: Load the target HTML file
2. **Validate Block Type**: Check against whitelist
3. **Generate Block ID**: Create a unique ID (`{block_type}-{short_uuid}`)
4. **Build Block HTML**: Based on block_type:
   - `hero`: heading, subheading, CTA button, optional image
   - `pricing`: plan cards with name, price, features list, CTA
   - `faq`: accordion items with question/answer pairs
   - `form`: form element with labeled fields and submit button
   - `testimonials`: quote cards with author, text, avatar
   - `cta`: heading, description, primary/secondary buttons
   - `features`: grid of feature cards with icon, title, description
   - `footer`: links columns, copyright, social links
   - `navbar`: logo, nav links, CTA button
   - `content`: generic prose content section
5. **Insert at Position**: Place the `<section>` at the specified position within `<main>`
6. **Map Identifier Lock**: Record the block_id and its selectors
7. **Write File**: Save the modified page
8. **Verify**: Confirm the block exists in the saved file

## COMMANDS TO RUN
```bash
# Verify the page exists
test -f "{page_path}" && echo "Page found" || echo "ERROR: Page not found"

# After insertion, verify block exists
grep -c 'data-block-id="{block_id}"' "{page_path}" && echo "Block inserted" || echo "ERROR: Block not found"
```

## OUTPUT FORMAT
```
INSERTED block into pages/landing.html
  Block ID:   hero-a1b2c3d4
  Block Type: hero
  Position:   end (after last block)
  Props:      heading="Welcome" subheading="Get started" cta_text="Sign Up"
  Selectors:  [data-testid='hero-block'], [data-testid='hero-cta']
```

## STOP CONDITIONS
- STOP if the page file does not exist
- STOP if block_type is not in the whitelist
- STOP if the page has no `<main>` element
- STOP if the referenced position block_id does not exist in the page

## FAILURE HANDLING
- If the page cannot be parsed, report the HTML structure issue
- If an invalid block type is given, list all valid types
- If the position block_id is not found, list existing block IDs in the page
- On write failure, do not leave the file in a corrupted state — write to temp first
