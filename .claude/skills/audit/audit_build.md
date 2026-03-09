---
name: audit_build
description: >
  Run the project build command and verify it succeeds. Gate: PASS or exact errors.
  Trigger words: build check, build audit, verify build, npm build, compile check.
metadata:
  version: "1.0.0"
  category: audit
  domain: marketing-engineering
compatibility:
  - claude-code
  - cursor
  - gemini-cli
---

# Audit Build

## PURPOSE
Run the project's build command and verify it completes successfully. This catches issues that type checking alone misses: missing imports at runtime, bundler errors, asset resolution failures.

## INPUTS
- **project_dir** (optional): Project root directory (default: current working directory)
- **build_command** (optional): Custom build command (default: auto-detect from package.json `build` script)

## PRECONDITIONS
1. `package.json` exists with a `build` script, or a custom build_command is provided
2. Dependencies are installed (`node_modules` exists)

## ALLOWED CHANGES
- Build artifacts may be created in the output directory (e.g., `dist/`)
- No source files are modified

## FORBIDDEN CHANGES
- Do NOT modify source files
- Do NOT modify build configuration
- Do NOT install or update dependencies

## PROCEDURE
1. **Detect Build Command**: Read `scripts.build` from package.json, or use provided build_command
2. **Clean Previous Build**: If a `dist/` or `build/` directory exists, note its presence
3. **Run Build**: Execute the build command with a timeout
4. **Check Exit Code**: 0 = success, non-zero = failure
5. **Verify Output**: Check that expected output directory/files were created
6. **Report**: PASS or FAIL with full error output

## COMMANDS TO RUN
```bash
# Check build script exists
node -e "const p=require('./package.json'); console.log(p.scripts?.build || 'NO BUILD SCRIPT')"

# Run build
npm run build 2>&1
echo "EXIT_CODE: $?"

# Verify output
test -d dist && echo "dist/ created" || echo "WARN: no dist/ directory"
```

## OUTPUT FORMAT
On success:
```
BUILD AUDIT
━━━━━━━━━━━
Result: PASS ✓
Command: npm run build (tsc)
Duration: 4.2s
Output:  dist/ (23 files)
```

On failure:
```
BUILD AUDIT
━━━━━━━━━━━
Result: FAIL ✗
Command: npm run build (tsc)
Exit code: 2

Error output:
  src/api/index.ts(5,8): error TS2307: Cannot find module './routes/thinking' or its corresponding type declarations.
  src/workers/index.ts(5,30): error TS2307: Cannot find module '../activities/thinking' or its corresponding type declarations.
```

## STOP CONDITIONS
- STOP if no build command is configured and none is provided
- STOP if dependencies are not installed

## FAILURE HANDLING
- If the build times out (>120s), kill the process and report timeout
- If the build script is missing, suggest adding one to package.json
- Capture both stdout and stderr for complete error context
