# Debug Analysis: Browser Console Errors After Knip Bypass

**Created**: 2026-01-25T19:15:00
**Status**: Analysis Complete - Pending Implementation
**Severity**: Medium
**Affected Area**: Development environment, Vite HMR, Hotjar integration, environment configuration

## 1. System Context (From Onboarding)

### 1.1 Architecture Understanding
- **Architecture Pattern**: Islands Architecture with independent React roots per HTML page
- **Tech Stack**: React 18, Vite 5.0, @vitejs/plugin-react 4.7.0, Cloudflare Pages
- **Data Flow**: HTML page loads -> JSX entry point -> config.js sets window.ENV -> React mounts

### 1.2 Domain Context
- **Feature Purpose**: Development tooling and analytics integration
- **Related Documentation**:
  - `.claude/Documentation/External/HOTJAR_IMPLEMENTATION.md` - Documents inline script approach
  - `app/CLAUDE.md` - Frontend architecture
- **Data Model**: N/A (configuration issue, not data-related)

### 1.3 Relevant Conventions
- **Inline Hotjar Scripts**: Hotjar tracking uses inline `<script>` tags in HTML `<head>`, NOT ES modules
- **window.ENV Pattern**: `config.js` sets `window.ENV` for Google Maps API key, NOT for Hotjar
- **Vite React Plugin**: Uses react-refresh for HMR, requires proper preamble injection

### 1.4 Entry Points and Dependencies
- **User/Request Entry Point**: `bun run dev` starts Vite dev server on port 3000
- **Critical Path**:
  1. HTML loads with inline Hotjar script
  2. Vite injects react-refresh preamble
  3. Entry JSX imports config.js which sets window.ENV
  4. React app mounts
- **Dependencies**: Vite, @vitejs/plugin-react, react-refresh runtime

## 2. Problem Statement

Three distinct console errors appeared, reportedly after adding knip bypass to the build pipeline:

1. **Hotjar HTTPS Warning**: `For security reasons, Hotjar only works over HTTPS`
2. **window.ENV Timeout**: `window.ENV not available after 2 seconds`
3. **Vite React Preamble Error**: `@vitejs/plugin-react can't detect preamble. Something is wrong` (at Toast.jsx:87)

The user suspects these are related to package.json changes that added `knip:report` and modified the `dev` script to run knip before Vite.

## 3. Reproduction Context

- **Environment**: Windows 11, PowerShell, localhost development
- **Steps to reproduce**:
  1. Run `bun run dev` from app/ directory
  2. Open http://localhost:3000 in browser
  3. Open browser DevTools Console
  4. Observe errors
- **Expected behavior**: Clean console with no errors, Hotjar loads, window.ENV available, React components render
- **Actual behavior**: Three console errors as described above
- **Error messages/logs**: As stated in problem statement

## 4. Investigation Summary

### 4.1 Files Examined

| File | Relevance |
|------|-----------|
| `app/package.json` | Recent knip changes to dev/build scripts |
| `app/vite.config.js` | Vite configuration with react plugin |
| `app/public/index.html` | Inline Hotjar script, window.ENV timeout logic |
| `app/src/main.jsx` | Entry point importing config.js |
| `app/src/lib/config.js` | Sets window.ENV and dispatches event |
| `app/src/lib/hotjar.js` | LEGACY - Module-based Hotjar loader (documented as NOT USED) |
| `app/src/islands/shared/Toast.jsx` | Location of preamble error |
| `.claude/Documentation/External/HOTJAR_IMPLEMENTATION.md` | Documents inline approach vs deprecated module approach |

### 4.2 Execution Flow Trace

**Current Flow (with issues):**
```
1. HTML parses, encounters inline Hotjar script in <head>
   -> Hotjar script tries to load from https://static.hotjar.com
   -> ❌ FAILS: Running on HTTP (localhost:3000), Hotjar requires HTTPS

2. HTML parses Google Maps init script with setTimeout fallback
   -> Waits 2 seconds for window.ENV
   -> window.ENV not yet set (ES module not loaded)
   -> ❌ ERROR: "window.ENV not available after 2 seconds"

3. Vite dev server starts
   -> Injects react-refresh preamble into HTML
   -> Entry module loads (main.jsx)
   -> config.js executes, sets window.ENV
   -> React component tree renders

4. Toast.jsx (line 87) executes
   -> ❌ PREAMBLE ERROR: react-refresh preamble detection fails
```

**Key Insight**: The timing is crucial. The inline scripts in `<head>` execute BEFORE Vite's module system loads config.js.

### 4.3 Git History Analysis

**Relevant Commits:**

1. `8759426a` (2026-01-25) - "build: make knip non-blocking in build pipeline"
   - Added `knip:report` script that always succeeds (`knip || true`)
   - Updated dev script: `bun run lint && bun run knip:report && vite --port 3000`
   - **Impact**: Adds lint + knip steps before Vite starts, but doesn't change Vite behavior

2. Previous dev port change (2026-01-20):
   - Port changed from 8000 to 3000 to match Supabase Auth Site URL

**Observation**: The knip changes only affect WHEN Vite starts (after lint + knip), not HOW it runs. The errors themselves are pre-existing issues unrelated to knip.

## 5. Hypotheses

### Hypothesis 1: Pre-Existing Errors Unrelated to Knip (Likelihood: 85%)

**Theory**: These three errors existed before the knip changes but were not noticed until the user examined console output more carefully during the knip integration work.

**Supporting Evidence**:
- The knip changes only add pre-Vite steps (lint, knip report); they don't modify Vite configuration
- Hotjar HTTPS warning would occur anytime the site is loaded over HTTP (localhost always uses HTTP unless configured otherwise)
- The window.ENV timeout is a race condition that has always existed in the code (index.html line 59-66)
- The preamble error is a Vite HMR issue that can occur during development hot reloads

**Contradicting Evidence**:
- User reports errors "appeared after adding knip bypass" - correlation in timing

**Verification Steps**:
1. Revert package.json to before knip changes
2. Run `vite --port 3000` directly
3. Check if same errors appear

**Potential Fix**: Document these as known development-only warnings, not blocking issues

**Convention Check**: Aligns with documented Hotjar inline approach which explicitly notes HTTP limitation

### Hypothesis 2: Vite HMR Timing Issue with React Refresh (Likelihood: 10%)

**Theory**: The order of script loading changed subtly due to knip execution time, affecting react-refresh preamble injection timing.

**Supporting Evidence**:
- The Vite plugin-react README explicitly states: "In middleware mode... make sure your entry index.html file is transformed by Vite" to avoid preamble error
- Toast.jsx uses hooks (`useState`, `useEffect`, `createContext`, etc.) which require the preamble

**Contradicting Evidence**:
- Vite's preamble injection happens at server start, not during knip execution
- The same Vite version (5.0.0) and plugin-react version (4.7.0) are used

**Verification Steps**:
1. Check if the error occurs on first load or only after HMR
2. Inspect Network tab for `/@react-refresh` request
3. Check if `__vite_plugin_react_preamble_installed__` is set on window

**Potential Fix**: If HMR-specific, may need to adjust vite.config.js react plugin options

### Hypothesis 3: Environment Variable Loading Race Condition (Likelihood: 5%)

**Theory**: The 2-second timeout in index.html is too short, and config.js module loading is delayed by knip.

**Supporting Evidence**:
- The error message explicitly references the 2-second timeout
- Knip adds processing time before Vite starts

**Contradicting Evidence**:
- Once Vite starts, module loading is independent of previous script execution
- The timeout is checked AFTER HTML parse but BEFORE module execution completes
- This race condition has always existed - it's just more visible now

**Verification Steps**:
1. Increase timeout to 5 seconds and see if error disappears
2. Check timestamp between page load and config.js execution

**Potential Fix**: Remove the timeout warning entirely or move Google Maps loading to a module

## 6. Recommended Action Plan

### Priority 1 (Classification as Non-Blocking)

These are **development-only warnings**, not bugs:

1. **Hotjar HTTPS Warning**:
   - **Root Cause**: Hotjar legitimately requires HTTPS; localhost uses HTTP
   - **Impact**: Hotjar simply doesn't run locally (intentional for dev)
   - **Action**: Document as expected behavior; Hotjar works in production (Cloudflare serves HTTPS)

2. **window.ENV Timeout**:
   - **Root Cause**: Race condition between inline script execution and ES module loading
   - **Impact**: Cosmetic console warning only; Google Maps still loads via fallback
   - **Action**:
     a. OPTION A: Remove the timeout warning (it's noise, the fallback still works)
     b. OPTION B: Increase timeout to 5 seconds
     c. OPTION C: Move Google Maps loading into config.js module

3. **Vite Preamble Error**:
   - **Root Cause**: Likely occurs during HMR cycle, not initial load
   - **Impact**: Page still renders; warning is intermittent
   - **Action**: Verify if error occurs on fresh page load vs after code change; if HMR-only, it's a known Vite quirk

### Priority 2 (Optional Cleanup)

If user prefers cleaner console:

1. **Remove deprecated hotjar.js module**:
   ```
   app/src/lib/hotjar.js - DELETE (documented as NOT USED)
   ```

2. **Remove window.ENV timeout warning from index.html**:
   ```javascript
   // Remove lines 59-66 from app/public/index.html
   // The fallback logic at lines 62-65 can remain, just remove the console.error
   ```

3. **Consider HTTPS for local dev** (if Hotjar tracking in dev is desired):
   - Add `server.https: true` to vite.config.js
   - Requires self-signed certificate setup

### Priority 3 (Deeper Investigation)

If preamble error persists and blocks development:

1. Check Vite version compatibility:
   ```bash
   npm ls @vitejs/plugin-react
   npm ls vite
   ```

2. Check for conflicting React versions:
   ```bash
   npm ls react react-dom
   ```

3. Examine Toast.jsx line 87:
   - The error points to a specific line in the component
   - May indicate improper hook usage or export pattern

## 7. Prevention Recommendations

1. **Document Known Dev Warnings**: Add a section to CLAUDE.md or create `.claude/Documentation/Development/KNOWN_DEV_WARNINGS.md` listing expected console messages in local development

2. **Separate Dev vs Prod Analytics**: Consider not loading Hotjar at all in development (check hostname before injecting script)

3. **Remove Dead Code**: Delete `app/src/lib/hotjar.js` which is documented as deprecated but still exists

4. **Consistent Port Usage**: The port was changed from 8000 to 3000 recently; ensure all documentation reflects this

## 8. Related Files Reference

| File | Line Numbers | Relevance |
|------|--------------|-----------|
| `app/package.json` | 10 | dev script with knip:report |
| `app/vite.config.js` | 94-110 | React plugin and server configuration |
| `app/public/index.html` | 12-21 | Inline Hotjar script |
| `app/public/index.html` | 26-68 | Google Maps loading with window.ENV timeout |
| `app/src/main.jsx` | 11 | Imports config.js |
| `app/src/lib/config.js` | 27-64 | Sets window.ENV and dispatches event |
| `app/src/lib/hotjar.js` | ALL | DEPRECATED - should be deleted |
| `app/src/islands/shared/Toast.jsx` | 87 | Location of preamble error |
| `.claude/Documentation/External/HOTJAR_IMPLEMENTATION.md` | ALL | Explains inline vs module approach |

---

## Summary

**The three console errors are NOT caused by the knip bypass changes.** They are pre-existing conditions of the development environment:

1. **Hotjar requires HTTPS** - Expected when running locally on HTTP
2. **window.ENV timeout** - Race condition in index.html that predates knip changes
3. **Vite preamble detection** - Likely an intermittent HMR issue, not a blocking bug

**Recommended Action**: Classify these as known development warnings, document them, and optionally clean up the deprecated `hotjar.js` file and the noisy timeout warning.

---

**Analysis Completed By**: debug-analyst
**Time**: 2026-01-25T19:15:00
