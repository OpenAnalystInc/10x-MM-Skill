---
name: audit_typescript
description: >
  Run TypeScript type checking and report any errors. Gate: PASS or exact errors.
  Trigger words: typecheck, type check, tsc, typescript audit, check types.
metadata:
  version: "1.0.0"
  category: audit
  domain: marketing-engineering
compatibility:
  - claude-code
  - cursor
  - gemini-cli
---

# Audit TypeScript

## PURPOSE
Run the TypeScript compiler in type-check mode (`--noEmit`) and report results. This is an audit gate — the output is strictly PASS or FAIL with exact error details.

## INPUTS
- **project_dir** (optional): Project root directory (default: current working directory)
- **tsconfig_path** (optional): Path to tsconfig.json (default: `{project_dir}/tsconfig.json`)

## PRECONDITIONS
1. `tsconfig.json` exists in the project
2. `typescript` is installed (`node_modules/.bin/tsc` exists)
3. `node_modules` directory exists (dependencies installed)

## ALLOWED CHANGES
- None — this is a read-only audit

## FORBIDDEN CHANGES
- Do NOT modify any source files
- Do NOT modify tsconfig.json
- Do NOT install or update packages
- Do NOT create any files

## PROCEDURE
1. **Check Prerequisites**: Verify tsconfig.json and node_modules/.bin/tsc exist
2. **Run Type Check**: Execute `npx tsc --noEmit --pretty false`
3. **Parse Output**: Count errors by file and category
4. **Report**: Output PASS or FAIL with structured error list

## COMMANDS TO RUN
```bash
# Check tsc is available
test -f node_modules/.bin/tsc && echo "tsc found" || echo "ERROR: tsc not found — run npm install"

# Run type check
npx tsc --noEmit --pretty false 2>&1
echo "EXIT_CODE: $?"
```

## OUTPUT FORMAT
On success:
```
TYPESCRIPT AUDIT
━━━━━━━━━━━━━━━━
Result: PASS ✓
Errors: 0
```

On failure:
```
TYPESCRIPT AUDIT
━━━━━━━━━━━━━━━━
Result: FAIL ✗
Errors: 7

src/api/routes/strategy.ts(42,5): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
src/api/routes/strategy.ts(58,12): error TS2339: Property 'foo' does not exist on type 'Bar'.
src/compiler/publisher.ts(15,3): error TS7006: Parameter 'x' implicitly has an 'any' type.
...

By file:
  src/api/routes/strategy.ts    2 errors
  src/compiler/publisher.ts     1 error
  ...
```

## STOP CONDITIONS
- STOP if `tsconfig.json` does not exist — report "No tsconfig.json found"
- STOP if `tsc` is not available — report "TypeScript not installed"

## FAILURE HANDLING
- If tsc hangs (>60s), kill the process and report timeout
- If node_modules is missing, report "Dependencies not installed — run npm install"
- Return FAIL status for any type errors, even warnings configured as errors
