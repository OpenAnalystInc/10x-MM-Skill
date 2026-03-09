---
name: audit_lint
description: >
  Run the project linter and report violations. Gate: PASS or exact errors.
  Trigger words: lint, eslint, lint check, code quality, lint audit.
metadata:
  version: "1.0.0"
  category: audit
  domain: marketing-engineering
compatibility:
  - claude-code
  - cursor
  - gemini-cli
---

# Audit Lint

## PURPOSE
Run the project's configured linter (ESLint by default) and report all violations. This is an audit gate — PASS means zero errors.

## INPUTS
- **project_dir** (optional): Project root directory (default: current working directory)
- **target** (optional): Specific files/directories to lint (default: `src/`)
- **fix** (optional): Whether to auto-fix (default: `false` — audit mode is read-only)

## PRECONDITIONS
1. A linter configuration exists (`.eslintrc.*`, `eslint.config.*`, or `package.json` eslintConfig)
2. The linter is installed in node_modules
3. Dependencies are installed

## ALLOWED CHANGES
- None in audit mode (read-only)
- If `fix: true` is explicitly passed, auto-fixable issues may be corrected

## FORBIDDEN CHANGES
- Do NOT modify linter configuration
- Do NOT install or update packages
- Do NOT disable lint rules in source files

## PROCEDURE
1. **Detect Linter**: Check for ESLint config. Fall back to checking package.json scripts for a `lint` script.
2. **Run Linter**: Execute `npx eslint {target} --ext .ts,.tsx,.js,.jsx --format compact`
3. **Parse Output**: Extract error count, warning count, and per-file breakdown
4. **Report**: PASS (0 errors) or FAIL with details

## COMMANDS TO RUN
```bash
# Check eslint is available
test -f node_modules/.bin/eslint && echo "eslint found" || echo "WARN: eslint not found"

# Run lint
npx eslint "{target}" --ext .ts,.tsx,.js,.jsx --format compact 2>&1
echo "EXIT_CODE: $?"

# Alternative: use package.json script
npm run lint 2>&1
```

## OUTPUT FORMAT
On success:
```
LINT AUDIT
━━━━━━━━━━
Result: PASS ✓
Errors:   0
Warnings: 3
```

On failure:
```
LINT AUDIT
━━━━━━━━━━
Result: FAIL ✗
Errors:   5
Warnings: 8

src/api/routes/dolt.ts:15:3  error  Unexpected any. Specify a type  @typescript-eslint/no-explicit-any
src/compiler/publisher.ts:42:1  error  Missing return type  @typescript-eslint/explicit-function-return-type
...

By file:
  src/api/routes/dolt.ts       2 errors, 1 warning
  src/compiler/publisher.ts    3 errors, 2 warnings
```

## STOP CONDITIONS
- STOP if no linter is configured — report "No linter configuration found"
- STOP if eslint is not installed — report "ESLint not installed"

## FAILURE HANDLING
- If the linter crashes, report the error message
- If no lint config exists, check for a `lint` script in package.json and use that
- Warnings alone do NOT cause FAIL — only errors cause FAIL
