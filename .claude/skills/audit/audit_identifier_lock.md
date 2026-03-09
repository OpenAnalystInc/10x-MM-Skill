---
name: audit_identifier_lock
description: >
  Map all exports, imports, and identifiers in the project and verify nothing was renamed or moved.
  Trigger words: identifier lock, check names, audit identifiers, verify exports, check imports.
metadata:
  version: "1.0.0"
  category: audit
  domain: marketing-engineering
compatibility:
  - claude-code
  - cursor
  - gemini-cli
---

# Audit Identifier Lock

## PURPOSE
Map every export, import, function name, class name, and variable in the project scope. Compare against the previous snapshot (if exists) to detect unauthorized renames, moves, or deletions. This enforces the Identifier Lock principle.

## INPUTS
- **target_dir** (required): Directory to audit (e.g., `src/`, `pages/`)
- **snapshot_path** (optional): Path to previous identifier snapshot JSON (default: `.identifier-lock.json`)
- **file_patterns** (optional): Glob patterns for files to include (default: `**/*.{ts,tsx,js,jsx,html}`)

## PRECONDITIONS
1. The target directory exists
2. Files matching the pattern exist in the directory

## ALLOWED CHANGES
- Create or update the `.identifier-lock.json` snapshot file
- Write audit results to stdout

## FORBIDDEN CHANGES
- Do NOT modify any source code files
- Do NOT rename, move, or delete any identifiers
- Do NOT modify package.json or config files

## PROCEDURE
1. **Scan Files**: Find all files matching the glob patterns in target_dir
2. **Extract Identifiers**: For each file, extract:
   - Named exports (`export const`, `export function`, `export class`, `export type`, `export interface`)
   - Default exports
   - Import statements (what's imported and from where)
   - Top-level function/class/variable declarations
   - HTML `data-testid`, `data-block-id`, `id` attributes
3. **Build Current Map**: Create a map of `{ file → identifiers[] }` with each identifier's name, type, and line number
4. **Load Previous Snapshot**: If `.identifier-lock.json` exists, load it
5. **Compare**:
   - **Added**: Identifiers in current but not in previous → OK (new additions)
   - **Removed**: Identifiers in previous but not in current → FAIL (unauthorized deletion)
   - **Renamed**: Same file, different name, same line range → FAIL (unauthorized rename)
   - **Moved**: Same name, different file → WARN (needs verification)
6. **Report Results**: PASS if no removals or renames; FAIL otherwise
7. **Update Snapshot**: Save current map as the new snapshot

## COMMANDS TO RUN
```bash
# Count files to scan
find "{target_dir}" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.html" \) | wc -l

# Extract exports from TypeScript files
grep -rn "^export " "{target_dir}" --include="*.ts" --include="*.tsx"
```

## OUTPUT FORMAT
```
IDENTIFIER LOCK AUDIT — src/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files scanned:     24
Identifiers found: 187
Previous snapshot: YES (.identifier-lock.json, 183 identifiers)

Changes:
  ADDED   4 new identifiers
  REMOVED 0 identifiers
  RENAMED 0 identifiers
  MOVED   0 identifiers

Result: PASS ✓

Snapshot updated: .identifier-lock.json
```

On failure:
```
Result: FAIL ✗

Violations:
  REMOVED src/utils/helpers.ts:15  export function formatDate
  RENAMED src/api/routes.ts:42     getUser → fetchUser (unauthorized rename)
```

## STOP CONDITIONS
- STOP if the target directory does not exist
- STOP if no files match the pattern

## FAILURE HANDLING
- If a previous snapshot doesn't exist, create the initial snapshot and report PASS (first run)
- If files can't be read, report which files failed and continue with the rest
- Return FAIL exit status (non-zero) on any removed or renamed identifiers
