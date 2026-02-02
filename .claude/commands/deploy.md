# Deploy to Cloudflare

Build and deploy the Split Lease application to Cloudflare Pages, with automatic build error fixing and GitHub push.

## Purpose

Deploy the application to production on Cloudflare Pages while ensuring:
- All local changes are committed before deployment
- Build succeeds (with automatic fix attempts if it fails)
- Application is successfully deployed to Cloudflare
- All changes (including fixes) are pushed to GitHub
- When a build fails, DO NOT PUSH STALE/Outdated Builds. Fix and run build again

## Variables

PROJECT_ROOT: /splitlease (git root directory)
BUILD_TIMEOUT: 10 minutes
MAX_BUILD_ATTEMPTS: 3

## Instructions

### Pre-Deployment: Commit All Changes

0. Kill all existing bun/npm servers

1. Navigate to the project root:
   - Run `cd $(git rev-parse --show-toplevel)` to ensure you're in the git root

2. Stage and commit all current changes:
   - Run `git add -A` to stage all changes
   - Run `git diff --cached --stat` to see what will be committed
   - If there are changes:
     - Generate a descriptive commit message based on the staged changes
     - Run `git commit -m "<commit_message>"`
     - Use present tense (e.g., "update", "fix", "add")
     - git pull changes from remote. Proceed further only when pull is run successfully
   - If no changes, skip this step

### Build Phase: Build with Auto-Fix (BLOCKING GATE)

> **⛔ CRITICAL**: Deployment MUST NOT proceed unless build succeeds. This is a hard gate, not a suggestion.

3. Run the build:
   - Run `bun run build` with timeout of BUILD_TIMEOUT
   - Capture both stdout and stderr output in full
   - Track the attempt number (starting at 1)

4. Check build result:
   - If build succeeds (exit code 0):
     - Verify that `app/dist` directory exists and contains files
     - Log: "✓ Build succeeded on attempt N"
     - **ONLY THEN** proceed to Deployment Phase
   - If build fails (non-zero exit code):
     - **DO NOT PROCEED TO DEPLOYMENT**
     - Parse error messages to identify the specific issues
     - Log the full error output for visibility
     - Attempt to fix the error:
       - Read the relevant files mentioned in the error
       - Analyze the root cause (syntax error, missing import, type error, etc.)
       - Implement a targeted fix for the specific error
       - Commit the fix individually with message: "fix: resolve build error - <brief description>"
       - Increment attempt counter
       - Run `bun run build` again
     - Repeat fix attempts up to MAX_BUILD_ATTEMPTS times

5. Handle persistent build failure (MANDATORY if all attempts exhausted):
   - **DO NOT PROCEED TO DEPLOYMENT**
   - **DO NOT PUSH STALE CODE**
   - Create a failure report file at `.claude/plans/Documents/YYYYMMDDHHMMSS-build-failure-report.md` with:
     ```markdown
     # Build Failure Report

     **Date**: [timestamp]
     **Deployment**: CANCELLED
     **Build Attempts**: [N] of [MAX_BUILD_ATTEMPTS]

     ## Final Error Output
     ```
     [Full stderr/stdout from last build attempt]
     ```

     ## Error Analysis
     - **Error Type**: [e.g., TypeScript error, ESLint error, Missing module]
     - **Affected Files**: [list files mentioned in error]
     - **Root Cause**: [brief analysis]

     ## Fix Attempts Made
     1. [Description of fix attempt 1]
     2. [Description of fix attempt 2]
     ...

     ## Recommended Next Steps
     - [Specific action to resolve the issue]
     ```
   - Report to user: "❌ BUILD FAILED after [N] attempts. Deployment CANCELLED. See failure report: [path to MD file]"
   - **STOP EXECUTION** - Do not proceed to any further steps

### Deployment Phase: Deploy to Cloudflare

> **PREREQUISITE**: This phase is ONLY reached if build succeeded. If you're here, step 4 passed.

6. Deploy to Cloudflare Pages:
   - Run `npx wrangler pages deploy app/dist --project-name splitlease`
   - Capture deployment output including the deployment URL
   - Verify deployment succeeds (exit code 0)
   - If deployment fails:
     - Report the error to the user
     - Stop execution (do not push to GitHub)

### Post-Deployment: Push to GitHub

7. Push all commits to GitHub:
   - Run `git push origin $(git branch --show-current)` to push current branch
   - Verify push succeeds
   - If push fails (e.g., rejected, no upstream):
     - Report the error to the user
     - Provide the command they need to run manually

## Report

Provide a summary with:
1. Number of commits created (initial + any fixes)
2. Build status (success or failure after N attempts)
3. Deployment URL from Cloudflare (only if deployed)
4. GitHub push status (success or failure)
5. Failure report path (if build failed)

### Success Examples

Clean build:
```
Deployment Summary:
✓ Committed all local changes
✓ Build succeeded on attempt 1
✓ Deployed to Cloudflare: https://splitlease.pages.dev
✓ Pushed 1 commit to GitHub (branch: development)
```

Build with fixes:
```
Deployment Summary:
✓ Committed all local changes
✓ Build succeeded on attempt 2 (1 fix applied)
  - fix: resolve build error - missing import in components/Header.tsx
✓ Deployed to Cloudflare: https://splitlease.pages.dev
✓ Pushed 2 commits to GitHub (branch: development)
```

### Failure Example (DEPLOYMENT CANCELLED)

```
Deployment Summary:
✓ Committed all local changes
✗ BUILD FAILED after 3 attempts
  - Attempt 1: TypeScript error in LoginPage.jsx (line 45)
  - Attempt 2: Fixed import, new error - missing type declaration
  - Attempt 3: Type error persists after fix attempt

❌ DEPLOYMENT CANCELLED - Build gate not passed
❌ GitHub push SKIPPED - No stale code pushed

📄 Failure Report: .claude/plans/Documents/20260130143022-build-failure-report.md

Next Steps:
1. Review the failure report for full error details
2. Manually fix the identified issues
3. Run `bun run build` locally to verify
4. Re-run /deploy when build passes
```

> **REMEMBER**: A failed deployment is better than a broken production. Never proceed silently.
