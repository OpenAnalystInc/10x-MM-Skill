---
name: audit_links
description: >
  Verify all routes exist and there are no broken internal links across pages.
  Trigger words: check links, broken links, link audit, verify routes, dead links.
metadata:
  version: "1.0.0"
  category: audit
  domain: marketing-engineering
compatibility:
  - claude-code
  - cursor
  - gemini-cli
---

# Audit Links

## PURPOSE
Scan all page files and navigation manifests to verify every internal link resolves to an existing route/page. Catches broken navigation, missing pages, and orphaned routes.

## INPUTS
- **pages_dir** (required): Directory containing page files (e.g., `pages/`)
- **funnel_spec_path** (optional): Path to funnel spec JSON to cross-check against
- **nav_manifest_path** (optional): Path to `_nav.json` if it exists

## PRECONDITIONS
1. The pages directory exists and contains HTML files
2. Pages use `data-route` attributes or have routes defined in the funnel spec

## ALLOWED CHANGES
- None — this is a read-only audit

## FORBIDDEN CHANGES
- Do NOT modify any files
- Do NOT create files
- Do NOT fix broken links (just report them)

## PROCEDURE
1. **Discover Pages**: Scan pages_dir for all `.html` files
2. **Extract Routes**: For each page, read the `data-route` attribute from body/main
3. **Extract Links**: For each page, find all `<a href="...">` where href starts with `/` (internal links)
4. **Extract Navigation Rules**: If funnel spec exists, read `navigation_rules[].from` and `.to`
5. **Extract Nav Manifest**: If `_nav.json` exists, read all route references
6. **Build Route Map**: Set of all known routes from discovered pages
7. **Check Links**: For each internal link found:
   - Does the target route exist in the route map?
   - If not, mark as BROKEN
8. **Check Navigation Rules**: For each rule:
   - Does `from` route exist? Does `to` route exist?
   - If not, mark as BROKEN
9. **Check Orphans**: Are there pages with routes that no other page links to? (WARN, not FAIL)
10. **Report**: PASS if zero broken links, FAIL otherwise

## COMMANDS TO RUN
```bash
# Count page files
find "{pages_dir}" -name "*.html" | wc -l

# Extract routes
grep -rh 'data-route=' "{pages_dir}" --include="*.html"

# Extract internal links
grep -roh 'href="/[^"]*"' "{pages_dir}" --include="*.html" | sort | uniq
```

## OUTPUT FORMAT
```
LINK AUDIT — pages/
━━━━━━━━━━━━━━━━━━━
Pages found:  5
Routes found: 5
Links found:  12

Link checks:
  /landing → /features     ✓
  /features → /pricing     ✓
  /pricing → /checkout     ✓
  /checkout → /thank-you   ✓
  /landing → /about        ✗ BROKEN (no page at /about)

Orphan routes (no incoming links):
  /landing  (entry point — OK)

Result: FAIL ✗ (1 broken link)
```

## STEP 11: Platform-Level Link Verification (via MCP)

After local scan, also verify published links through MCP:

```
system_audit_events({ html: "<html content>" })
links_list({ handle: "<LINK_PLATFORM_HANDLE>" })
```

This confirms all links registered on the platform (not just local HTML) are resolving correctly. Server handles the Link Platform auth internally.

## STOP CONDITIONS
- STOP if the pages directory doesn't exist
- STOP if no HTML files are found

## FAILURE HANDLING
- If a page can't be parsed, report the file and continue scanning others
- If the funnel spec is invalid JSON, warn and skip spec validation
- Return FAIL for any broken links, WARN for orphan routes
- If `system_audit_events` returns broken links: use `links_upsert` to fix or `links_list` to investigate
