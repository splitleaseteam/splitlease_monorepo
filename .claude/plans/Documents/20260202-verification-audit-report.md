# Split Lease Codebase Verification Audit Report

**Generated:** 2026-02-02
**Audit Type:** Verification of Prior Findings
**Auditor:** Senior Staff Engineer (Independent Review)
**Status:** READ-ONLY ANALYSIS - No files modified

---

## Executive Summary

This verification audit validates, refutes, and extends the findings from prior audits conducted on 2026-01-28 through 2026-01-30. The analysis reveals **significant underestimations** in several areas and identifies **new issues** the prior audits missed.

| Category | Prior Audit Finding | Verification Result | Verdict |
|----------|--------------------|--------------------|---------|
| Orphan files (lib/) | 5 files | 5 files CONFIRMED | CONFIRMED |
| Unused hooks | 3 hooks flagged | 1 FALSE POSITIVE (useContractGenerator is used) | PARTIALLY REFUTED |
| Dead directories | 3 directories (AI*, DateChange*) | CONFIRMED unused | CONFIRMED |
| Console.log in logic/ | "5 statements" | **50 occurrences in 11 files** | UNDERESTIMATED |
| Console.* in frontend | Not quantified | **1,220 occurrences in 183 files** | NEW FINDING |
| LoadingState duplicates | 10 components | 9 LoadingState.jsx files found | CONFIRMED |
| HomePage useState | "14+ hooks" | 10 useState calls found | OVERESTIMATED |
| Hardcoded prod URLs | "6 instances" | **13 instances in 7 files** | UNDERESTIMATED |
| Admin auth bypass | CRITICAL security | CONFIRMED in messages/index.ts | CONFIRMED |
| Input sanitization gap | HIGH severity | CONFIRMED in proposal/create.ts | CONFIRMED |
| Plans backlog | 85 pending | **98 pending plans** | WORSE |

**Overall Assessment:** The prior audit was directionally correct but underestimated the scope of several issues, particularly debug residue and hardcoded URLs. Some claimed orphan files are actually used.

---

## Section 1: Confirmed Findings

### [VERIFY-001] Orphan Files in lib/

**Original Issue:** 5 orphan files in lib/ directory
**Status:** CONFIRMED
**Evidence:** Repository-wide grep for imports returned zero matches

| File | Import Search Result | Verdict |
|------|---------------------|---------|
| dateFormatters.js | No imports found | DEAD CODE |
| hotjar.js | No imports found | DEAD CODE (side-effect only) |
| pricingListService.js | No imports found | DEAD CODE |
| safeJson.js | No imports found | DEAD CODE |
| workflowClient.js | No imports found | DEAD CODE |

**Risk Assessment:** LOW - Safe to delete with no impact
**Adjustments:** None - original finding accurate

---

### [VERIFY-002] Dead Code Directories

**Original Issue:** AIRoomRedesign, AISuggestions, DateChangeRequestManager directories unused
**Status:** CONFIRMED
**Evidence:**

```
AIRoomRedesign/ - Only imports are internal (index.js, stories files)
AISuggestions/ - Only imports are internal (index.js, modal)
DateChangeRequestManager/ - Only self-references found
```

**Files affected:**
- `app/src/islands/shared/AIRoomRedesign/` (9 files)
- `app/src/islands/shared/AISuggestions/` (7 files)
- `app/src/islands/shared/DateChangeRequestManager/` (11 files)

**Risk Assessment:** LOW - Safe to delete entire directories
**Adjustments:** None - original finding accurate

---

### [VERIFY-003] Admin Auth Bypass (SECURITY)

**Original Issue:** Admin actions in messages function have no authentication
**Status:** CONFIRMED - CRITICAL
**Evidence:** File `supabase/functions/messages/index.ts` lines 84-92:

```typescript
const PUBLIC_ACTIONS: ReadonlySet<string> = new Set([
  'send_guest_inquiry',
  'create_proposal_thread',
  'send_splitbot_message',
  'admin_get_all_threads',    // SECURITY RISK
  'admin_delete_thread',       // SECURITY RISK
  'admin_send_reminder',       // SECURITY RISK
]);
```

**Risk Assessment:** CRITICAL - Any unauthenticated caller can perform admin operations
**Recommendation:** Remove admin_* actions from PUBLIC_ACTIONS immediately

---

### [VERIFY-004] Input Sanitization Gap (SECURITY)

**Original Issue:** User-provided text stored without sanitization in proposal creation
**Status:** CONFIRMED - HIGH SEVERITY
**Evidence:** File `supabase/functions/proposal/actions/create.ts` lines 407-410:

```typescript
"need for space": input.needForSpace || null,
about_yourself: input.aboutMe || null,
special_needs: input.specialNeeds || null,
Comment: input.comment || null,
```

No sanitization functions called. Search for "sanitize|escape|xss" in supabase/functions/ returned only 3 files, none in proposal function.

**Risk Assessment:** HIGH - XSS/injection vectors present
**Recommendation:** Add input sanitization before database storage

---

### [VERIFY-005] LoadingState Component Duplication

**Original Issue:** 10 duplicated LoadingState components
**Status:** CONFIRMED (9 files found)
**Evidence:** Glob search for `**/LoadingState.jsx` found:

1. `app/src/islands/pages/AdminThreadsPage/components/LoadingState.jsx`
2. `app/src/islands/pages/ExperienceResponsesPage/components/LoadingState.jsx`
3. `app/src/islands/pages/LeasesOverviewPage/components/LoadingState.jsx`
4. `app/src/islands/pages/ManageVirtualMeetingsPage/components/LoadingState.jsx`
5. `app/src/islands/pages/QuickPricePage/components/LoadingState.jsx`
6. `app/src/islands/pages/SearchPage/components/LoadingState.jsx`
7. `app/src/islands/pages/ViewSplitLeasePage/components/LoadingState.jsx`
8. `app/src/islands/pages/ManageLeasesPaymentRecordsPage/components/LoadingState.jsx`
9. `app/src/islands/shared/VisitReviewerHouseManual/components/AccessStates/LoadingState.jsx`

**Risk Assessment:** MEDIUM - Maintenance burden, inconsistent behavior
**Recommendation:** Consolidate to single shared component

---

## Section 2: False Positives Identified

### [FALSE-POS-001] useContractGenerator Hook

**Original Issue:** Listed as unused hook in Knip output
**Why This Is Not Dead:**

```
Grep search found 5 files importing useContractGenerator:
- app/src/islands/pages/contracts/HostPayoutPage.jsx
- app/src/islands/pages/contracts/PeriodicTenancyPage.jsx
- app/src/islands/pages/contracts/SupplementalPage.jsx
- app/src/islands/pages/contracts/CreditCardAuthPage.jsx
- app/src/hooks/useContractGenerator.js (definition)
```

**Recommendation:** Remove from cleanup list - actively used by 4 contract pages

---

### [FALSE-POS-002] logic/constants/index.js

**Original Issue:** Listed in Knip unused files
**Why This Is Not Dead:**

```
Grep search found 19 files importing from logic/constants:
- Multiple proposal pages
- Rental application wizard
- Quick price page
- Review modals
- Host proposals page
```

**Recommendation:** Remove from cleanup list - heavily used barrel file

---

### [FALSE-POS-003] HomePage useState Count

**Original Issue:** "14+ useState hooks" claimed
**Actual Count:** 10 useState calls found

```
Line 184: activeIndex (ScheduleSection internal component)
Line 355: manhattanId
Line 356: featuredListings
Line 357: isLoadingListings
Line 594: isAnimating
Line 691: isAIResearchModalOpen
Line 692: selectedDays
Line 693: isLoggedIn
Line 694: isPopupDismissed
Line 697: RecoveryComponent
```

**Recommendation:** Finding is still valid (10 useState is excessive for hollow component) but count was overstated

---

## Section 3: New Discoveries (Gaps in Prior Audit)

### [GAP-001] Massive Debug Residue

**Type:** Stale Artifact
**Files:** 183 files, 1,220 occurrences
**Why First Audit Missed This:** Only counted logic/ directory (50 occurrences)

**Evidence:**
```
console.log/debug/warn search across app/src/:
- Found 1,220 total occurrences across 183 files
```

**Top offenders:**
| File | Count |
|------|-------|
| lib/proposals/userProposalQueries.js | 43 |
| islands/pages/HostProposalsPage/useHostProposalsPageLogic.js | 37 |
| islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx | 58 |
| lib/listingDataFetcher.js | 31 |
| lib/auth/signup.js | 31 |

**Impact:** Performance overhead, security risk (data leakage), noise in production
**Confidence:** HIGH

---

### [GAP-002] Deprecated Re-export File

**Type:** Stale Artifact
**Files:** `app/src/logic/workflows/booking/cancelProposalWorkflow.js`
**Why First Audit Missed This:** Cross-boundary analysis not performed

**Description:** This 9-line file is marked @deprecated and only re-exports from the canonical location:

```typescript
/**
 * @deprecated Use workflows/proposals/cancelProposalWorkflow.js instead
 */
export { executeCancelProposal as cancelProposalWorkflow } from '../proposals/cancelProposalWorkflow.js';
```

Grep confirmed ZERO imports of this file.

**Recommendation:** Delete file
**Impact:** 9 lines removed, cleaner architecture
**Confidence:** HIGH

---

### [GAP-003] Expanded Hardcoded Production URLs

**Type:** Security Risk / Configuration Drift
**Files:** 7 files, 13+ instances
**Why First Audit Missed This:** Only counted AiSignupMarketReport.jsx

**Evidence:**

| File | URL | Type |
|------|-----|------|
| AiSignupMarketReport.jsx (6 occurrences) | qcfifybkaddcoimjroca.supabase.co | Fallback |
| LeasesOverviewPage/useLeasesOverviewPageLogic.js | qzsmhgyojmwvtjmnrdea.supabase.co | Fallback |
| **CoHostRequestsPage/useCoHostRequestsPageLogic.js** | qzsmhgyojmwvtjmnrdea.supabase.co | **HARDCODED (no env check!)** |
| ProposalManagePage/useProposalManagePageLogic.js | qzsmhgyojmwvtjmnrdea.supabase.co | Fallback |
| ManageRentalApplicationsPage/useManageRentalApplicationsPageLogic.js | qzsmhgyojmwvtjmnrdea.supabase.co | Fallback |
| SendMagicLoginLinksPage/useSendMagicLoginLinksPageLogic.js | qzsmhgyojmwvtjmnrdea.supabase.co | Fallback |
| ManageLeasesPaymentRecordsPage/useManageLeasesPageLogic.js | qzsmhgyojmwvtjmnrdea.supabase.co | Fallback |

**Critical:** Two different Supabase URLs found - indicates possible environment confusion
**Recommendation:** Remove all hardcoded URLs, require env variable
**Impact:** Prevents dev traffic hitting production
**Confidence:** HIGH

---

### [GAP-004] Unused Hooks (Additional)

**Type:** Dead Code
**Files:** 2 hooks confirmed unused
**Why First Audit Missed This:** Only listed hooks without verification

**Evidence:**
```
useDataLookups.js - Only referenced in its own file (example comment)
useProposalButtonStates.js - Only referenced in CLAUDE.md (documentation) and lint output
```

**Recommendation:** Delete or integrate into consuming components
**Impact:** ~50 lines removed
**Confidence:** HIGH

---

### [GAP-005] Plans Backlog Growth

**Type:** Stale Artifact
**Files:** 98 plan files in .claude/plans/New/
**Why First Audit Missed This:** Count has increased since audit

**Prior count:** 85 plans (2026-01-30)
**Current count:** 98 plans (2026-02-02)

**Growth rate:** +13 plans in 3 days
**Recommendation:** Triage and archive/execute oldest plans
**Impact:** Reduced cognitive overhead
**Confidence:** HIGH

---

### [GAP-006] Deprecated Constants

**Type:** Dead Code
**Files:** `app/src/lib/constants.js`
**Why First Audit Missed This:** Not traced to actual usage

**Evidence:** Grep found zero usages for:
- `REFERRAL_API_ENDPOINT` (Line 25, marked deprecated)
- `BUBBLE_MESSAGING_ENDPOINT` (Line 26, marked deprecated)
- `AI_SIGNUP_WORKFLOW_URL` (Line 27, marked deprecated)
- `triggerBubbleWorkflow` function (bubbleAPI.js) - throws error, zero usages

**Recommendation:** Remove deprecated constants and functions
**Impact:** ~20 lines removed
**Confidence:** HIGH

---

### [GAP-007] TODO/FIXME Backlog

**Type:** Maintenance Debt
**Files:** 21 files, 38 occurrences
**Why First Audit Missed This:** Not in scope

**Evidence:** Grep for TODO|FIXME|HACK|XXX found 38 markers

**Top files:**
- useProposalManagePageLogic.js: 4 TODOs
- useGuestLeasesPageLogic.js: 4 TODOs
- CounterofferSummarySection.jsx: 3 TODOs

**Recommendation:** Address or document deferred items
**Confidence:** MEDIUM

---

## Section 4: Disputed Findings (Require Further Investigation)

### [DISPUTE-001] Total Unused Files Count

**Original Claim:** 202 unused files
**Verification Status:** Cannot fully verify without running Knip

The prior audit relied on Knip output which may have false positives. Verified examples:
- `useContractGenerator.js` - FALSE POSITIVE (4 consumers found)
- `logic/constants/index.js` - FALSE POSITIVE (19 consumers found)

**Recommendation:** Re-run Knip with updated configuration, manually verify top 50 candidates
**Confidence:** MEDIUM - Some findings likely false positives

---

## Section 5: Recommended Cleanup Sequence

### Phase 1: Security (Immediate)

| Priority | Action | Risk |
|----------|--------|------|
| P0 | Remove admin_* from PUBLIC_ACTIONS in messages/index.ts | CRITICAL |
| P0 | Add input sanitization to proposal/actions/create.ts | HIGH |
| P0 | Remove hardcoded URL in CoHostRequestsPage (no env check) | HIGH |

### Phase 2: Dead Code (Week 1)

| Priority | Action | Impact |
|----------|--------|--------|
| P1 | Delete AIRoomRedesign/ directory (9 files) | ~500 lines |
| P1 | Delete AISuggestions/ directory (7 files) | ~400 lines |
| P1 | Delete DateChangeRequestManager/ directory (11 files) | ~600 lines |
| P1 | Delete 5 orphan lib/ files | ~500 lines |
| P1 | Delete booking/cancelProposalWorkflow.js | 9 lines |
| P1 | Remove 3 deprecated constants from constants.js | ~10 lines |
| P1 | Delete unused hooks (useDataLookups, useProposalButtonStates) | ~100 lines |

### Phase 3: Consolidation (Week 2)

| Priority | Action | Impact |
|----------|--------|--------|
| P2 | Consolidate 9 LoadingState components to shared | Maintainability |
| P2 | Remove hardcoded URLs from 6 remaining files | Configuration safety |
| P2 | Extract HomePage state to useHomePageLogic | Pattern compliance |

### Phase 4: Maintenance (Ongoing)

| Priority | Action | Impact |
|----------|--------|--------|
| P3 | Remove 1,220 console.* statements | Performance, security |
| P3 | Address 38 TODO/FIXME markers | Code quality |
| P3 | Triage 98 pending plans | Cognitive overhead |

---

## Appendix A: Dependency Tracing Summary

### Heavily Used Modules (NOT dead code)

| Module | Consumers |
|--------|-----------|
| lib/auth.js | 54 files |
| lib/supabase.js | 95+ files |
| lib/constants.js | 19+ files |
| lib/secureStorage.js | 15 files |
| logic/constants/index.js | 19 files |
| hooks/useDeviceDetection.js | 5 files |

### Confirmed Unused Modules

| Module | Verification Method |
|--------|---------------------|
| lib/dateFormatters.js | Repository grep: 0 imports |
| lib/hotjar.js | Repository grep: 0 imports (side-effect only) |
| lib/pricingListService.js | Repository grep: 0 imports |
| lib/safeJson.js | Repository grep: 0 imports |
| lib/workflowClient.js | Repository grep: 0 imports |
| hooks/useDataLookups.js | Only self-reference |
| hooks/useProposalButtonStates.js | Only documentation reference |

---

## Appendix B: Cross-Reference Matrix

| Prior Audit Claim | Verification Phase | Result |
|-------------------|-------------------|--------|
| 202 unused files | V1, V2 | PARTIALLY CONFIRMED (some false positives) |
| 32 barrel files | V1 | NOT VERIFIED (out of scope) |
| 761 FP violations | V1 | NOT VERIFIED (requires FP analysis tool) |
| 2.2% hook test coverage | V1 | CONFIRMED (2/92 hooks tested) |
| 50+ untested forms | V2 | NOT VERIFIED (requires form audit) |
| 9 unused dependencies | V4 | NOT VERIFIED (requires package.json audit) |
| 53 Edge Functions | V3 | CONFIRMED (saw handler imports) |

---

## Appendix C: Quality Gates Checklist

- [x] Every file in scope was examined
- [x] Exports traced to imports via repository-wide grep
- [x] Redundancy claims verified by comparing actual logic
- [x] Dynamic invocation patterns searched (string literals)
- [x] Cross-boundary dependencies traced (frontend ↔ backend)
- [x] Test files included in usage analysis
- [ ] Build configuration checked (out of scope for this verification)

---

## Conclusion

The prior audit was **directionally accurate** but suffered from:

1. **Underestimation** of debug residue (50 → 1,220 occurrences)
2. **Underestimation** of hardcoded URLs (6 → 13 instances)
3. **False positives** in unused file detection (useContractGenerator, logic/constants)
4. **Overestimation** of HomePage useState count (14+ → 10)
5. **Missing** deprecated re-export file, additional unused hooks, deprecated constants

**Security issues remain CRITICAL** and should be addressed immediately.

**Estimated cleanup impact:**
- ~2,500 lines of code removal (dead directories + orphan files)
- Security hardening for auth bypass and input sanitization
- Configuration safety through URL centralization

---

*Report generated by independent verification audit. No files were modified during this analysis.*
