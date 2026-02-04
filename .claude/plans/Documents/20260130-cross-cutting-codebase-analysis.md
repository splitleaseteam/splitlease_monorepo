# Cross-Cutting Codebase Analysis Report

**Generated:** 2026-01-30
**Scope:** Full codebase spanning frontend (app/) and backend (supabase/functions/)

---

## Executive Summary

This comprehensive analysis examines cross-cutting concerns across the Split Lease codebase. The overall health is **MODERATE** with several areas requiring attention. Key findings:

- **85 active plans** in `.claude/plans/New/` indicate significant backlog
- **202 unused files** detected by Knip (dead code accumulation)
- **53 Edge Functions** deployed (significant backend complexity)
- Environment configuration is well-structured but has some hardcoded fallbacks
- Day indexing is consistently 0-based throughout (good alignment)

---

## 1. Configuration Health

### 1.1 Vite Configuration (app/vite.config.js)

**Severity: LOW**

**Findings:**
- Well-structured multi-page routing with Route Registry pattern
- Custom plugins for HTML file handling and asset copying work correctly
- Server proxy configured for `/api` routes (port 8788)

**Issues:**
1. **Manual chunk splitting disabled** (lines 276-289) - Comment indicates circular dependency issues with `vendor-react` chunk. This affects bundle optimization.
   - Impact: Larger initial bundle sizes
   - Recommendation: Investigate dependency graph and re-enable with proper analysis

2. **Dev server port mismatch** - Package.json shows `--port 3000` but CLAUDE.md documents port 8000
   ```json
   // package.json shows:
   "dev": "bun run lint && bun run knip:report && vite --port 3000"
   ```
   - Impact: Confusion in development setup
   - Recommendation: Standardize on one port across documentation

### 1.2 ESLint Configuration (app/eslint.config.js)

**Severity: LOW**

**Findings:**
- Modern flat config format (ESLint 9+)
- Good enforcement of error handling patterns:
  - `no-empty` with `allowEmptyCatch: false`
  - Custom rule blocking `|| true` pattern
  - Empty catch block detection

**Issues:**
1. React version hardcoded as `'18.2'` but package.json shows `^18.2.0` (minor mismatch OK)
2. Many rules are warnings instead of errors - this is intentional for gradual adoption

### 1.3 Deno Configuration (supabase/functions/deno.json)

**Severity: LOW**

**Findings:**
- Comprehensive lint rules enabled
- `no-explicit-any` excluded (intentional flexibility)
- Good formatting configuration

**Issues:**
1. Test configuration excludes `./tests/integration/**` but no integration tests exist
2. Each Edge Function has its own `deno.json` - 31 separate config files

### 1.4 Environment Variable Management

**Severity: MEDIUM**

**Findings:**
- Clear separation between development and production environments
- `.env.development` points to `splitlease-backend-dev`
- `.env.production` points to `splitlease-backend-live`

**Issues:**
1. **Hardcoded production URL fallbacks** in `AiSignupMarketReport.jsx`:
   ```javascript
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qcfifybkaddcoimjroca.supabase.co';
   ```
   This occurs 6 times in that file alone. If env var is missing, it falls back to PRODUCTION URL even in development.
   - **File:** `app/src/islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx`
   - **Lines:** 224-225, 308-309, 398-399, 517, 660, 782
   - **Severity: HIGH** - Could cause development traffic to hit production

2. **VITE_ENABLE_* feature flags** declared in `vite-env.d.ts` but not in `.env.*` files:
   - `VITE_ENABLE_SMART_PRICING`
   - `VITE_ENABLE_SMART_DATES`
   - `VITE_ENABLE_ANALYTICS`

### 1.5 Build and Deployment Configuration

**Severity: LOW**

**Findings:**
- Route Registry pattern is well-implemented
- Auto-generation of `_redirects` and `_routes.json` works correctly
- Cloudflare `_internal/` pattern properly handles 308 redirect prevention

**Issues:**
1. **Playwright config exists in two locations:**
   - `playwright.config.ts` (project root)
   - `e2e/playwright.config.ts`
   - Potential confusion about which to use

---

## 2. API Contract Alignment

### 2.1 Frontend API Calls vs Edge Function Endpoints

**Severity: MEDIUM**

**Analysis of 31 files with `supabase.functions.invoke` calls:**

| Edge Function | Frontend Callers | Actions Used |
|---------------|-----------------|--------------|
| `proposal` | 8+ files | create, update, get, acceptCounteroffer |
| `lease` | 3+ files | create |
| `messages` | 4+ files | get_messages, send_message, send_splitbot_message |
| `virtual-meeting` | 1 file | accept, create, decline, delete, send_calendar_invite, notify_participants |
| `identity-verification` | 1 file | submit_verification, get_status |
| `house-manual` | 2+ files | get, get-by-visit, create, update, delete |
| `experience-survey` | 2 files | submit_referral, send |
| `magic-login-links` | 2 files | generate_magic_link, send |
| `ai-gateway` | 2 files | complete |

**Issues:**
1. **Inconsistent action naming conventions:**
   - Some use snake_case: `get_messages`, `send_message`
   - Some use camelCase: `acceptCounteroffer`
   - Some use kebab-case: `get-by-visit`
   - Recommendation: Standardize on snake_case per REST conventions

2. **Direct fetch calls bypassing supabase client** in some files:
   ```javascript
   // Direct fetch instead of supabase.functions.invoke
   const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guest-payment-records`, ...
   ```
   - Files: `useZUnitPaymentRecordsJsPageLogic.js`, `useCompareTermsModalLogic.js`
   - Impact: Inconsistent auth header handling

### 2.2 Request/Response Type Consistency

**Severity: MEDIUM**

**Findings:**
- Backend uses TypeScript with good type definitions in `_shared/types.ts`
- Frontend is primarily JavaScript with some TypeScript migration in progress

**Issues:**
1. **Mixed TypeScript/JavaScript in frontend:**
   - `ViewSplitLeasePage.tsx` exists alongside `ViewSplitLeasePage.jsx`
   - `PreviewSplitLeasePage.tsx` exists
   - No shared type definitions between frontend and backend

2. **No API contract validation** - Frontend accepts whatever backend returns without runtime validation

### 2.3 Error Handling Alignment

**Severity: LOW**

**Findings:**
- Backend has structured error classes in `_shared/errors.ts`:
  - `BubbleApiError`, `SupabaseSyncError`, `ValidationError`, `AuthenticationError`, `OpenAIError`
- Frontend has `lib/errorReporting.js` for error handling

**Issues:**
1. **ESLint enforcement working** - No empty catch blocks detected in codebase search
2. **|| true pattern** only found in test file comment (acceptable)

---

## 3. Shared Patterns

### 3.1 Day Indexing Consistency

**Severity: LOW - WELL ALIGNED**

**Findings:**
- All frontend code uses 0-based indexing (0=Sunday, 6=Saturday)
- `DAY_NAMES` array at index 0 = 'Sunday'
- `DAYS_OF_WEEK` objects have `dayIndex: 0` for Sunday
- `Date.getDay()` calls return 0-6 as expected

**Files checked:**
- `GuestEditingProposalModal.jsx` - Uses `dayIndex: 0` for Sunday
- `useScheduleSelectorLogicCore.js` - Uses `dayOfWeek` consistently
- `validateMoveInDateWorkflow.js` - Uses `getDay()` correctly

**Conversion functions present:**
- `adaptDaysFromBubble.js` (for legacy Bubble API)
- `adaptDaysToBubble.js` (for legacy Bubble API)

### 3.2 Date/Time Handling

**Severity: LOW**

**Findings:**
- Uses `date-fns` and `date-fns-tz` for date manipulation (good choice)
- `lib/dateFormatters.js` centralizes formatting logic

### 3.3 Error Message Formats

**Severity: MEDIUM**

**Issues:**
1. **No standardized error response format** across all Edge Functions
2. Backend uses `{ success: false, error: string }` pattern
3. Some functions return `{ error: string }` without `success` field

### 3.4 Loading/Error State Patterns

**Severity: LOW**

**Findings:**
- Hollow component pattern delegates state to `useXxxPageLogic` hooks
- Loading states handled consistently with `isLoading` boolean pattern

---

## 4. Development Experience

### 4.1 Script Organization (package.json)

**Severity: LOW**

**Findings:**
- 28 scripts available (comprehensive)
- Good separation of concerns:
  - `dev`, `build`, `preview` for development lifecycle
  - `lint`, `lint:fix`, `lint:check` for code quality
  - `test`, `test:watch`, `test:coverage`, `test:ui` for testing
  - `storybook`, `storybook:build` for component development
  - `knip`, `knip:report` for dead code detection
  - `typecheck` for TypeScript validation

**Issues:**
1. **Duplicate test scripts:**
   - `test:dev` overlaps with `dev` functionality
   - `test:unit`, `test:unit:run`, `test:unit:coverage` redundancy

2. **knip:report uses `|| true`** to prevent build failures:
   ```json
   "knip:report": "knip || true"
   ```
   This silences Knip warnings in the dev workflow

### 4.2 Documentation Quality

**Severity: MEDIUM**

**Findings:**
- Excellent CLAUDE.md files throughout the codebase
- Nested documentation in `app/`, `app/src/`, `supabase/` directories

**Issues:**
1. **85 plans in `.claude/plans/New/`** - significant backlog
2. **Port documentation mismatch** - CLAUDE.md says 8000, scripts use 3000
3. **No user-facing README.md** in project root for external contributors

### 4.3 Development Workflow Friction Points

**Severity: MEDIUM**

**Issues:**
1. **Mandatory lint + knip on every dev start:**
   ```json
   "dev": "bun run lint && bun run knip:report && vite --port 3000"
   ```
   - Adds 5-10 seconds to every `bun run dev`
   - Consider `dev:quick` script without checks

2. **TypeScript not enforced** - `strict: false` in tsconfig.json

3. **No pre-commit hooks visible** - husky installed but no `.husky/` directory configuration shown

---

## 5. Dependency Analysis

### 5.1 Package Overview

**Total Dependencies:** 57 direct dependencies (44 dev, 13 runtime)

### 5.2 Outdated Packages

**Severity: LOW**

| Package | Installed | Note |
|---------|-----------|------|
| react | 18.3.1 | Latest in 18.x line |
| vite | 5.4.21 | Vite 6 available but 5.x still supported |
| typescript | 5.9.3 | Bleeding edge |
| @supabase/supabase-js | 2.80.0 | Recent |

Most packages are reasonably up to date.

### 5.3 Unused Dependencies (via Knip)

**Severity: MEDIUM**

Knip reports **202 unused files** but package dependencies appear actively used.

Notable potentially unused packages to verify:
- `pg` - PostgreSQL client (likely only used in scripts)
- `node-releases` - May be transitive dependency
- `styled-components` - Mixed usage with Tailwind

### 5.4 Security Vulnerabilities

**Severity: UNKNOWN**

npm audit did not produce output. Manual security review recommended.

### 5.5 Bundle Size Concerns

**Severity: MEDIUM**

Large dependencies:
- `framer-motion` (12.x) - Animation library, significant size
- `gsap` - Another animation library (potential duplication)
- `lottie-react` - Third animation library
- `@react-google-maps/api` - Google Maps SDK

**Recommendation:** Audit animation library usage - having 3 different animation libraries is unusual.

---

## 6. Plans & Documentation Review

### 6.1 Active Plans in New/

**Severity: HIGH**

**Count: 85 plans** awaiting execution

**Categories observed:**
- Code refactor plans (14 files with `code_refactor_plan` suffix)
- Debug investigations (8+ files)
- Feature implementations (15+ files)
- Migration plans (5+ files)
- CI/CD and testing plans (4+ files)

**Most Recent Plans (requiring attention):**
1. `20260129231500-bulk-pricing-list-execution-prompt.md`
2. `20260129230000-host-proposals-payment-bug-orchestrator.md`
3. `20260129230000-bulk-pricing-list-fix-orchestration.md`
4. `20260129152000-counteroffer-summary-debug-analysis.md`
5. `20260129-host-proposals-accept-decline-fix.md`

### 6.2 Stale Documentation

**Severity: MEDIUM**

**Issues:**
1. **supabase/CLAUDE.md outdated:**
   - Lists 9 Edge Functions but 53 actually exist
   - Missing documentation for newer functions like:
     - `calendar-automation`, `experience-survey`
     - `guest-management`, `pricing-list`, `pricing-admin`
     - `workflow-enqueue`, `workflow-orchestrator`

2. **Edge Function count discrepancy:**
   - Documented: 9 functions
   - Actual: 53 functions (6x more than documented)

### 6.3 Pattern Implementation Gaps

**Severity: MEDIUM**

| Documented Pattern | Implementation Status |
|--------------------|----------------------|
| Hollow Component | Partially followed - some pages have logic inline |
| Four-Layer Logic | Well implemented in `src/logic/` |
| Route Registry | Fully implemented |
| Action-Based Edge Functions | Consistently implemented |
| Queue-Based Sync | Implemented but many functions don't use it |

---

## 7. Git & Project Health

### 7.1 Recent Commit Patterns

**Severity: LOW**

Recent commits show:
- Good commit message formatting
- Mix of features, fixes, and documentation
- Proper prefixes: `feat:`, `fix:`, `chore:`, `docs:`

### 7.2 Branch Hygiene

**Severity: LOW**

- Main branch is clean (no uncommitted changes)
- Single main branch strategy in use

### 7.3 Version Control Issues

**Severity: LOW**

No obvious issues detected. Git status shows clean working tree.

---

## Summary by Severity

### CRITICAL (0 issues)

None identified.

### HIGH (2 issues)

1. **Hardcoded production URL fallbacks** in `AiSignupMarketReport.jsx` - Could cause dev traffic to hit production
2. **85 pending plans** in `.claude/plans/New/` - Significant technical debt backlog

### MEDIUM (8 issues)

1. Environment variable feature flags declared but not defined
2. Inconsistent API action naming conventions (snake_case vs camelCase vs kebab-case)
3. Direct fetch calls bypassing supabase client in some files
4. Mixed TypeScript/JavaScript with no shared types
5. No standardized error response format across Edge Functions
6. Mandatory lint+knip on every dev start (friction)
7. 202 unused files detected by Knip
8. Edge Function documentation severely outdated (9 documented vs 53 actual)

### LOW (10 issues)

1. Manual chunk splitting disabled in Vite
2. Dev server port mismatch in documentation
3. Duplicate Playwright configs
4. Redundant test scripts in package.json
5. TypeScript strict mode disabled
6. No visible pre-commit hook configuration
7. Three different animation libraries (potential redundancy)
8. Test config excludes non-existent integration tests
9. 31 separate deno.json files for Edge Functions
10. No user-facing README.md

---

## Recommended Priority Actions

1. **Remove hardcoded production URLs** from `AiSignupMarketReport.jsx` (HIGH)
2. **Triage and archive old plans** in `.claude/plans/New/` (HIGH)
3. **Update supabase/CLAUDE.md** to document all 53 Edge Functions (MEDIUM)
4. **Standardize API action naming** to snake_case across all endpoints (MEDIUM)
5. **Create `dev:quick` script** without lint/knip for faster iteration (MEDIUM)
6. **Audit animation libraries** - consolidate to one (gsap OR framer-motion) (LOW)

---

## Files Referenced in This Analysis

### Configuration Files
- `C:\Users\Split Lease\Documents\Split Lease - Team\app\vite.config.js`
- `C:\Users\Split Lease\Documents\Split Lease - Team\app\eslint.config.js`
- `C:\Users\Split Lease\Documents\Split Lease - Team\app\package.json`
- `C:\Users\Split Lease\Documents\Split Lease - Team\app\knip.json`
- `C:\Users\Split Lease\Documents\Split Lease - Team\app\vitest.config.js`
- `C:\Users\Split Lease\Documents\Split Lease - Team\app\tailwind.config.js`
- `C:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\deno.json`

### Environment Files
- `C:\Users\Split Lease\Documents\Split Lease - Team\app\.env.development`
- `C:\Users\Split Lease\Documents\Split Lease - Team\app\.env.production`

### Documentation Files
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\CLAUDE.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\app\CLAUDE.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\app\src\CLAUDE.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\supabase\CLAUDE.md`

### Key Source Files
- `C:\Users\Split Lease\Documents\Split Lease - Team\app\src\routes.config.js`
- `C:\Users\Split Lease\Documents\Split Lease - Team\app\src\islands\shared\AiSignupMarketReport\AiSignupMarketReport.jsx`
- `C:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\_shared\cors.ts`
