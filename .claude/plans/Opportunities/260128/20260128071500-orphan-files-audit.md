# Opportunity Report: Orphan Files Analysis (Dead Code Detection)

**Created**: 2026-01-28T07:15:00
**Status**: Analysis Complete
**Severity**: Low
**Affected Area**: Codebase - unused utility files

## 1. System Context

### 1.1 Architecture Understanding
- **Architecture Pattern**: Islands Architecture (React 18 + Vite)
- **Tech Stack**: React 18, Vite, JavaScript/JSX
- **Analysis Method**: Pattern-based import analysis + git history

### 1.2 Domain Context
- **Purpose**: Identify orphan files (dead code) - files with no consumers
- **Orphan Definition**: Files with zero import references - nothing imports from them
- **Stale Code**: Orphan files not modified in 3+ months
- **Why It Matters**: Dead code bloats codebase, confuses developers, increases maintenance burden

### 1.3 Entry Points and Dependencies
- **Analysis Scope**: `app/src` directory
- **Total JS/JSX files**: 1,093
- **Entry point files**: 81 (excluded from analysis)
- **Test files**: 9 (excluded from analysis)

## 2. Analysis Methodology

### 2.1 Detection Criteria

**Orphan Files**:
- Files with zero import statements referencing them
- Cross-verified with broader string searches

**Severity Assessment**:
- **High**: Orphan + 6+ months since last commit = DELETE
- **Medium**: Orphan + 3-6 months since last commit = REVIEW
- **Low**: Orphan + recently modified = KEEP (may be planned for use)

**Exclusion Criteria** (False Positives):
- Entry points (`*.jsx` files in `app/src/` root)
- Test files (`*.test.js`, `*.spec.js`)
- Configuration files (`vite.config.js`)
- Side-effect import files (`config.js`)

### 2.2 Files Analyzed

- Total lib files checked: 24
- Orphan files found: 5
- After exclusions applied: 5

## 3. Findings

### 3.1 Orphan Files by Severity

#### Low Priority (Orphan + Recent - KEEP/REVIEW)

| File Path | Last Modified | Days Stale | LOC | Purpose | Action |
|-----------|---------------|------------|-----|---------|--------|
| `lib/dateFormatters.js` | 2026-01-20 | 8 | 113 | Date formatting utilities | KEEP - recently created utility |
| `lib/hotjar.js` | 2025-11-20 | 69 | 32 | Hotjar analytics init | KEEP - side-effect module |
| `lib/pricingListService.js` | Unknown | - | 194 | Pricing list Edge Function client | REVIEW - may be unused |
| `lib/safeJson.js` | 2026-01-17 | 11 | 23 | Safe JSON parsing | KEEP - utility for future use |
| `lib/workflowClient.js` | 2025-12-13 | 46 | 184 | Workflow orchestration client | REVIEW - pgmq workflow system |

### 3.2 Detailed Analysis

#### `lib/dateFormatters.js` (113 LOC)
- **Status**: KEEP - Recently created utility
- **Last Modified**: 2026-01-20
- **Exports**: `formatDateDisplay`, `formatDateTimeDisplay`, `formatDateRange`
- **Purpose**: Centralized date formatting for consistency
- **Note**: Well-documented module, appears to be a planned consolidation effort

#### `lib/hotjar.js` (32 LOC)
- **Status**: KEEP - Side-effect module
- **Last Modified**: 2025-11-20
- **Purpose**: Initialize Hotjar analytics tracking
- **Note**: This is a side-effect module that runs on import. It's loaded from HTML `<script>` tags, not via JavaScript imports. NOT a true orphan.

#### `lib/pricingListService.js` (194 LOC)
- **Status**: REVIEW - May be unused or planned
- **Purpose**: Frontend service for pricing-list Edge Function
- **Exports**: `createPricingList`, `fetchPricingList`, `updatePricingList`, `recalculatePricingList`, `triggerPricingListCreation`
- **Note**: Well-documented but no callers found. May be planned for future pricing feature integration.

#### `lib/safeJson.js` (23 LOC)
- **Status**: KEEP - Utility for future use
- **Last Modified**: 2026-01-17
- **Exports**: `safeJsonParse`
- **Purpose**: Safe JSON parsing with fallback
- **Note**: Small utility module, harmless to keep

#### `lib/workflowClient.js` (184 LOC)
- **Status**: REVIEW - pgmq workflow system
- **Last Modified**: 2025-12-13
- **Exports**: `triggerWorkflow`, `getWorkflowStatus`, `waitForWorkflow`, `triggerWorkflowAsync`
- **Purpose**: Frontend client for workflow orchestration system
- **Note**: Part of the pgmq-based workflow system. May not be wired up yet but is part of a larger feature.

### 3.3 Summary Statistics

- **Total orphan files**: 5
- **High priority (safe to delete)**: 0
- **Medium priority (review first)**: 2
- **Low priority (keep)**: 3
- **Total potential deletions**: 0 files
- **Total LOC in orphan files**: 546 lines

## 4. Excluded Files (False Positives)

The following files appeared to have zero import references but are NOT orphans:

| File Path | Reason | Status |
|-----------|--------|--------|
| `lib/config.js` | Side-effect import (50+ usages as `import './lib/config.js'`) | Active |
| `lib/oauthCallbackHandler.js` | Side-effect import (1 usage) | Active |
| `lib/timing.js` | Import reference in auth.js | Active |
| All `*.jsx` entry points | Vite HTML entry points, not JavaScript imports | Active |
| All `*.test.js` files | Test files, loaded by test runner | Active |

## 5. Risk Assessment

**Risk Level**: Very Low

**Confidence Levels**:
- High confidence removals: 0 (none recommended)
- Medium confidence (review): 2 (pricingListService, workflowClient)
- Low confidence (keep): 3 (dateFormatters, hotjar, safeJson)

## 6. Recommendations

### Immediate Actions
- [ ] No files should be deleted without team review
- [ ] Verify `lib/pricingListService.js` integration status with pricing feature
- [ ] Verify `lib/workflowClient.js` usage in workflow system

### Prevention
- [ ] Document intended usage in orphan utility files
- [ ] Add TODO comments for planned integrations
- [ ] Regular orphan audits (quarterly)

### No Action Required
- `lib/dateFormatters.js` - New utility, keep for future consolidation
- `lib/hotjar.js` - Side-effect module, works correctly
- `lib/safeJson.js` - Tiny utility, negligible overhead

## 7. Potential Code Reduction

**Files Safe to Delete**: 0
**Estimated Lines of Code**: 0
**Percentage of Codebase**: 0%

**Recommendation**: The 5 "orphan" files identified are either:
1. Recently created utilities planned for integration
2. Side-effect modules that don't require import references
3. Part of larger feature systems not yet fully wired

No immediate code reduction is recommended.

## 8. Comparison with Previous Audit

This is the first orphan files audit. Future audits can track:
- New orphan files created
- Orphan files that became active
- Long-term stale files

## 9. Next Steps

1. [x] Analysis complete
2. [ ] Review `pricingListService.js` and `workflowClient.js` with development team
3. [ ] Add usage documentation to orphan files if they are planned integrations
4. [ ] Schedule follow-up audit in 3 months
