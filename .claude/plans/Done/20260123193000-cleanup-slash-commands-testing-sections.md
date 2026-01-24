# Slash Commands Testing Sections Cleanup Plan

**Generated:** 2026-01-23 19:30:00
**Project:** Split Lease
**Type:** CLEANUP

## Executive Summary

This plan identifies and prescribes removal of prescriptive "Next Steps", "Implementation Priority", and other forward-looking sections from 19 testing-focused slash commands in `.claude/commands/`. These commands should remain focused on **audit/analysis** rather than **implementation guidance**.

**Key Finding:** The codebase has Stripe, Supabase Auth, Twilio SMS, and webhook handlers (features that exist), but does NOT have testing infrastructure (Vitest, Playwright, test files, MSW setup). Commands suggesting implementation of non-existent testing infrastructure should have those sections removed.

**Scope:** 19 slash command files
**Expected Outcome:** Clean audit commands that describe what to look for without prescribing implementation work

---

## Current State Analysis

### Files Requiring Cleanup

All 19 files in `.claude/commands/` (excluding `commands/` subdirectory) contain sections that need removal:

1. `audit-accessible-query-patterns.md` (267 lines)
2. `audit-async-loading-states.md` (301 lines)
3. `audit-coverage-thresholds.md` (557 lines)
4. `audit-custom-hook-tests.md` (753 lines)
5. `audit-database-seed-scripts.md` (317 lines)
6. `audit-form-submission-tests.md` (540 lines)
7. `audit-mock-auth-context.md` (291 lines)
8. `audit-msw-supabase-mocking.md` (248 lines)
9. `audit-page-object-model.md` (321 lines)
10. `audit-reusable-auth-state.md` (599 lines)
11. `audit-rls-pgtap-tests.md` (374 lines)
12. `audit-stripe-payment-tests.md` (323 lines)
13. `audit-supabase-auth-tests.md` (320 lines)
14. `audit-test-file-colocation.md` (303 lines)
15. `audit-test-sharding-ci.md` (584 lines)
16. `audit-twilio-sms-mocking.md` (292 lines)
17. `audit-vitest-rtl-setup.md` (315 lines)
18. `audit-webhook-handler-tests.md` (323 lines)
19. `audit-websocket-realtime-tests.md` (322 lines)

### Patterns Identified

#### Sections to KEEP (Core Audit Content)
- **Step 1: Prime the Codebase Context** - Instructions to run /prime
- **Step 2: Systematic File Review** - What files/patterns to find
- **What to Check for Each Target** - Specific audit criteria
- **Step 3: Create the Audit Document** - Output structure templates
- **Reference:** sections - Educational patterns and anti-patterns
- **Output Requirements** - Deliverable specifications
- **Post-Audit Actions** - Webhook notification steps

#### Sections to REMOVE (Prescriptive/Implementation)
- **Implementation Priority** tables (P0/P1/P2 rankings)
- **Next Steps** lists with actionable items like "Create...", "Add...", "Implement..."
- **Recommended [Configuration/File]** when suggesting NEW infrastructure
- **Progressive Coverage Plan** (phases, rollout schedules)
- **Migration Steps** (when suggesting file moves)

---

## File-by-File Action Plan

### 1. audit-accessible-query-patterns.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-accessible-query-patterns.md`

**Sections to Remove:**
- Lines 167-183: `## Implementation Priority` table
- Lines 176-183: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 167-183:
| Priority | Issue | Files Affected | Impact |
|----------|-------|----------------|--------|
| P0 | CSS class selectors | X files | Breaks on style changes |
...

## Next Steps

1. Install `eslint-plugin-testing-library`
2. Fix P0 CSS/ID selectors
3. Add accessible names to components
4. Add `{ name: '...' }` to role queries
5. Migrate dynamic text to test IDs
```

**Verification:** File should end after `## Post-Audit Actions` section (line 267)

---

### 2. audit-async-loading-states.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-async-loading-states.md`

**Sections to Remove:**
- Lines 246-262: `## Implementation Priority` table
- Lines 255-262: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 246-262:
| Priority | Component | Missing Tests | Impact |
...

## Next Steps

1. Add loading state tests for P0 components
2. Add error state + retry tests
3. Add empty state tests
4. Add accessibility assertions
5. Add optimistic update tests
```

**Verification:** File should end after `## Post-Audit Actions` section (line 301)

---

### 3. audit-coverage-thresholds.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-coverage-thresholds.md`

**Sections to Remove:**
- Lines 412-473: `## Implementation Priority` table
- Lines 422-473: `## Progressive Coverage Plan` (4 phases)
- Lines 465-473: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 412-473:
| Priority | Item | Impact |
...

## Progressive Coverage Plan

### Phase 1: Baseline (Week 1-2)
...

## Next Steps

1. Add coverage configuration if missing
2. Set global thresholds
3. Add per-directory overrides for critical paths
4. Configure CI to fail on threshold violation
5. Set up Codecov for PR feedback
6. Document progressive increase plan
```

**Verification:** File should end after `## Post-Audit Actions` section (line 557)

---

### 4. audit-custom-hook-tests.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-custom-hook-tests.md`

**Sections to Remove:**
- Lines 604-623: `## Implementation Priority` table
- Lines 615-623: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 604-623:
| Priority | Hook | Missing Tests | Impact |
...

## Next Steps

1. Create provider wrappers for context-dependent hooks
2. Add initial state tests for all hooks
3. Add async tests with MSW for data fetching hooks
4. Add validation and computed value tests for form hooks
5. Add timer tests for debounce/throttle hooks
6. Add localStorage tests for persistence hooks
```

**Verification:** File should end after `## Post-Audit Actions` section (line 753)

---

### 5. audit-database-seed-scripts.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-database-seed-scripts.md`

**Sections to Remove:**
- Lines 181-197: `## Implementation Priority` table
- Lines 190-197: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 181-197:
| Priority | Item | Impact | Files Affected |
...

## Next Steps

1. Create `tests/fixtures/` directory structure
2. Implement user factory with faker.js
3. Implement cleanup utilities respecting FK order
4. Migrate inline data creation to factories
5. Add global test setup with proper cleanup
```

**Verification:** File should end after `## Post-Audit Actions` section (line 317)

---

### 6. audit-form-submission-tests.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-form-submission-tests.md`

**Sections to Remove:**
- Lines 400-418: `## Implementation Priority` table
- Lines 410-418: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 400-418:
| Priority | Form | Missing Tests | Impact |
...

## Next Steps

1. Add validation tests for P0 forms
2. Add submission state tests
3. Add error handling tests
4. Add keyboard navigation tests
5. Add multi-step form tests
6. Add file upload tests
```

**Verification:** File should end after `## Post-Audit Actions` section (line 540)

---

### 7. audit-mock-auth-context.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-mock-auth-context.md`

**Sections to Remove:**
- Lines 161-176: `## Implementation Priority` table
- Lines 169-176: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 161-176:
| Priority | Component | Gap Type | Impact |
...

## Next Steps

1. Create/update MockAuthProvider if needed
2. Create user/session fixtures
3. Add render helpers
4. Add tests for P0 components
5. ...
```

**Verification:** File should end after `## Post-Audit Actions` section (line 291)

---

### 8. audit-msw-supabase-mocking.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-msw-supabase-mocking.md`

**Sections to Remove:**
- Lines 104-118: `## Implementation Priority` table
- Lines 112-118: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 104-118:
| Priority | Component | Effort | Impact |
...

## Next Steps

1. Set up MSW infrastructure (if not present)
2. Create shared handlers in `src/mocks/`
3. Add tests for P0 items
4. ...
```

**Verification:** File should end after `## Post-Audit Actions` section (line 248)

---

### 9. audit-page-object-model.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-page-object-model.md`

**Sections to Remove:**
- Lines 180-196: `## Implementation Priority` table
- Lines 189-196: `## Migration Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 180-196:
| Priority | Item | Impact | Effort |
...

## Migration Steps

1. Create `e2e/pages/BasePage.ts` with common functionality
2. Create page objects for most-used pages
3. Create fixture file to instantiate page objects
4. Update test files to import and use page objects
5. Extract common components into component page objects
```

**Verification:** File should end after `## Post-Audit Actions` section (line 321)

---

### 10. audit-reusable-auth-state.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-reusable-auth-state.md`

**Sections to Remove:**
- Lines 478-517: `## Implementation Priority` table
- Lines 508-517: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 478-517:
| Priority | Item | Impact |
...

## Next Steps

1. Create auth.setup.ts with login flow
2. Configure Playwright projects with storage state
3. Add setup project dependency
4. Refactor tests to remove inline logins
5. Add multi-role support
6. Add auth fixtures for mixed-role tests
7. Implement API-based auth for faster setup
```

**Verification:** File should end after `## Post-Audit Actions` section (line 599)

---

### 11. audit-rls-pgtap-tests.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-rls-pgtap-tests.md`

**Sections to Remove:**
- Lines 210-226: `## Implementation Priority` table
- Lines 219-226: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 210-226:
| Priority | Table | Gap | Risk Level |
...

## Next Steps

1. Enable pgTAP extension if not present
2. Create test helper functions
3. Add pgTAP tests for P0 tables
4. Add cross-tenant access tests
5. Add to CI/CD pipeline
```

**Verification:** File should end after `## Post-Audit Actions` section (line 374)

---

### 12. audit-stripe-payment-tests.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-stripe-payment-tests.md`

**Sections to Remove:**
- Lines 187-203: `## Implementation Priority` table
- Lines 196-203: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 187-203:
| Priority | Component | Gap Type | Impact |
...

## Next Steps

1. Set up MSW handlers for Stripe API
2. Create webhook signature test helper
3. Add checkout component unit tests
4. Add E2E tests for main checkout flow
5. Add webhook handler tests with signature validation
```

**Verification:** File should end after `## Post-Audit Actions` section (line 323)

---

### 13. audit-supabase-auth-tests.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-supabase-auth-tests.md`

**Sections to Remove:**
- Lines 225-243: `## Implementation Priority` table
- Lines 235-243: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 225-243:
| Priority | Item | Impact |
...

## Next Steps

1. Create auth test helpers
2. Add MSW handlers for auth endpoints
3. Test sign in flow (integration)
4. Test protected routes (unit)
5. Test sign up flow
6. Test session refresh
```

**Verification:** File should end after `## Post-Audit Actions` section (line 320)

---

### 14. audit-test-file-colocation.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-test-file-colocation.md`

**Sections to Remove:**
- Lines 208-225: `## Implementation Priority` table
- Lines 218-225: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 208-225:
| Priority | Task | Files Affected |
...

## Next Steps

1. Run migration script for centralized tests
2. Update vitest config
3. Add VS Code file nesting
4. Create missing test file placeholders
5. Update import paths
```

**Verification:** File should end after `## Post-Audit Actions` section (line 303)

---

### 15. audit-test-sharding-ci.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-test-sharding-ci.md`

**Sections to Remove:**
- Lines 443-514: `## Implementation Priority` table
- Lines 504-514: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 443-514:
| Priority | Item | Impact |
...

## Next Steps

1. Add matrix strategy to CI workflow
2. Set fail-fast: false
3. Configure blob reporter
4. Add report merge job
5. Share auth state across shards
6. Add browser caching
7. Configure timeouts
8. Upload artifacts for debugging
```

**Verification:** File should end after `## Post-Audit Actions` section (line 584)

---

### 16. audit-twilio-sms-mocking.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-twilio-sms-mocking.md`

**Sections to Remove:**
- Lines 181-206: `## Implementation Priority` table
- Lines 199-206: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 181-206:
| Priority | Item | Impact |
...

## Next Steps

1. Create twilioHandlers.ts MSW handlers
2. Add module mock for simpler tests
3. Test booking confirmation SMS
4. Test reminder notifications
5. Test message templates
```

**Verification:** File should end after `## Post-Audit Actions` section (line 292)

---

### 17. audit-vitest-rtl-setup.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-vitest-rtl-setup.md`

**Sections to Remove:**
- Lines 236-257: `## Implementation Priority` table
- Lines 248-257: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 236-257:
| Priority | Item | Impact |
...

## Next Steps

1. Install missing dependencies
2. Create vitest.config.ts
3. Create src/test/setup.ts
4. Create src/test/test-utils.tsx
5. Update tsconfig.json
6. Add npm scripts
7. Run test to verify setup
```

**Verification:** File should end after `## Post-Audit Actions` section (line 315)

---

### 18. audit-webhook-handler-tests.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-webhook-handler-tests.md`

**Sections to Remove:**
- Lines 211-238: `## Implementation Priority` table
- Lines 231-238: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 211-238:
| Priority | Handler | Gap | Impact |
...

## Next Steps

1. Create signature generation helpers
2. Create event factory functions
3. Add signature validation tests
4. Add idempotency tests
5. Add side effect tests
```

**Verification:** File should end after `## Post-Audit Actions` section (line 323)

---

### 19. audit-websocket-realtime-tests.md

**File:** `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-websocket-realtime-tests.md`

**Sections to Remove:**
- Lines 213-242: `## Implementation Priority` table
- Lines 235-242: `## Next Steps` list

**Specific Changes:**
```markdown
REMOVE LINES 213-242:
| Priority | Item | Impact |
...

## Next Steps

1. Create MockWebSocket class
2. Add WebSocket mock to test setup
3. Create Supabase channel mocks
4. Add unit tests for chat hooks
5. Add E2E tests with routeWebSocket()
```

**Verification:** File should end after `## Post-Audit Actions` section (line 322)

---

## Execution Order

Execute changes in numerical file order (1-19) to track progress systematically.

**Group 1: Test Pattern Audits (Files 1-5)**
1. audit-accessible-query-patterns.md
2. audit-async-loading-states.md
3. audit-coverage-thresholds.md
4. audit-custom-hook-tests.md
5. audit-database-seed-scripts.md

**Group 2: Component/Integration Test Audits (Files 6-10)**
6. audit-form-submission-tests.md
7. audit-mock-auth-context.md
8. audit-msw-supabase-mocking.md
9. audit-page-object-model.md
10. audit-reusable-auth-state.md

**Group 3: Security/Database Audits (Files 11-13)**
11. audit-rls-pgtap-tests.md
12. audit-stripe-payment-tests.md
13. audit-supabase-auth-tests.md

**Group 4: Infrastructure/CI Audits (Files 14-17)**
14. audit-test-file-colocation.md
15. audit-test-sharding-ci.md
16. audit-twilio-sms-mocking.md
17. audit-vitest-rtl-setup.md

**Group 5: Webhook/Realtime Audits (Files 18-19)**
18. audit-webhook-handler-tests.md
19. audit-websocket-realtime-tests.md

---

## Risk Assessment

### Low Risk Changes
- All changes are **removals only** - no code modifications
- Removing documentation sections cannot break functionality
- Changes are isolated to individual files

### Potential Issues
- **None identified** - These are documentation-only changes

### Rollback Considerations
- Files can be restored from git history if needed
- No dependencies between file edits

---

## Verification Checklist

After completing all edits:

- [ ] All 19 files edited
- [ ] No `## Implementation Priority` sections remain
- [ ] No `## Next Steps` sections with implementation items remain
- [ ] `## Progressive Coverage Plan` removed from audit-coverage-thresholds.md
- [ ] `## Migration Steps` removed from audit-page-object-model.md
- [ ] All files end with `## Post-Audit Actions` section
- [ ] No new sections added
- [ ] Core audit content (Steps 1-3, Reference sections) preserved
- [ ] File line counts reduced appropriately

---

## Summary of Changes

| File | Lines Removed | New Line Count |
|------|---------------|----------------|
| audit-accessible-query-patterns.md | ~17 | ~250 |
| audit-async-loading-states.md | ~17 | ~284 |
| audit-coverage-thresholds.md | ~62 | ~495 |
| audit-custom-hook-tests.md | ~20 | ~733 |
| audit-database-seed-scripts.md | ~17 | ~300 |
| audit-form-submission-tests.md | ~19 | ~521 |
| audit-mock-auth-context.md | ~16 | ~275 |
| audit-msw-supabase-mocking.md | ~15 | ~233 |
| audit-page-object-model.md | ~17 | ~304 |
| audit-reusable-auth-state.md | ~40 | ~559 |
| audit-rls-pgtap-tests.md | ~17 | ~357 |
| audit-stripe-payment-tests.md | ~17 | ~306 |
| audit-supabase-auth-tests.md | ~19 | ~301 |
| audit-test-file-colocation.md | ~18 | ~285 |
| audit-test-sharding-ci.md | ~72 | ~512 |
| audit-twilio-sms-mocking.md | ~26 | ~266 |
| audit-vitest-rtl-setup.md | ~22 | ~293 |
| audit-webhook-handler-tests.md | ~28 | ~295 |
| audit-websocket-realtime-tests.md | ~30 | ~292 |
| **TOTAL** | **~514** | **~7,066** |

---

## Files Referenced

### Slash Commands (All 19 files to be edited)
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-accessible-query-patterns.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-async-loading-states.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-coverage-thresholds.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-custom-hook-tests.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-database-seed-scripts.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-form-submission-tests.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-mock-auth-context.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-msw-supabase-mocking.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-page-object-model.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-reusable-auth-state.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-rls-pgtap-tests.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-stripe-payment-tests.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-supabase-auth-tests.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-test-file-colocation.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-test-sharding-ci.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-twilio-sms-mocking.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-vitest-rtl-setup.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-webhook-handler-tests.md`
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\audit-websocket-realtime-tests.md`

### Context Documentation
- `C:\Users\Split Lease\Documents\Split Lease - Team\.claude\CLAUDE.md` - Project instructions

---

**Plan Status:** Ready for execution
**Next Action:** Execute edits following file-by-file action plan
