---
name: audit-barrel-files
description: Detect and report barrel files (index.js/ts with re-exports) in the codebase. Identifies pure barrels, mixed barrels, hub files, and consumers. Creates timestamped MD report and notifies via Slack webhook.
---

# Barrel Files Audit

You are conducting a comprehensive barrel file audit to identify index files that re-export from other modules, creating dense dependency graphs that hinder refactoring.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Detect Barrel Files

Use Glob to find all index files in the codebase:

```bash
# Find all index.js/jsx/ts/tsx files
Glob: "**/index.{js,jsx,ts,tsx}"
# Exclude: node_modules, dist, build
```

For each index file found, read and analyze it to categorize as:

### Barrel Categories

| Category | Definition | Action |
|----------|------------|--------|
| **PURE_BARREL** | Only re-exports (`export * from`, `export { x } from`) | High priority for removal |
| **MIXED** | Has re-exports AND actual logic/code | Needs extraction first |
| **ENTRY_POINT** | Framework entry point or actual component | Keep (not a barrel) |

### Detection Patterns

**Barrel Indicators (re-exports):**
- `export * from './module'`
- `export { foo, bar } from './module'`
- `export { default as Component } from './Component'`
- `export default from './module'`

**Logic Indicators (NOT a barrel):**
- `function foo() {}`
- `const foo = () => {}`
- `const [state, setState] = useState()`
- `return (<JSX ...>)`
- `class Component extends ...`
- React hooks usage

### Severity Scoring

| Severity | Criteria |
|----------|----------|
| **High** | Has `export *` (star exports hide origin) OR re-exports from 5+ sources |
| **Medium** | Re-exports from 3-4 sources OR multiple named re-exports |
| **Low** | Re-exports from 1-2 sources OR single default re-export |

## Step 3: Find Barrel Consumers

For each barrel file identified, search for files that import from it:

```javascript
// If barrel is at: app/src/logic/calculators/index.js
// Search for imports like:
import { calculatePrice } from '../logic/calculators'
import { calculatePrice } from '../logic/calculators/index'
```

Use Grep to find consumers:
```
Pattern: from.*<barrel_dir_name>['"]
Example: from.*calculators['"]
```

## Step 4: Create the Audit Document

Create an MD file at `.claude/plans/Documents/<timestamp>-audit-barrel-files.md` with the following structure:

```markdown
# Barrel Files Audit Report
**Generated:** <timestamp>
**Codebase:** Split Lease

## Executive Summary
- Index files scanned: X
- Barrel files found: X
- Pure barrels (removable): X
- Mixed barrels (need extraction): X
- High severity: X
- Medium severity: X
- Low severity: X

## Barrel Files by Severity

### 🔴 High Severity (Star Exports or Many Sources)

#### [file path]
**Type:** PURE_BARREL | MIXED
**Re-exports:** X sources
**Exports:** [list of exported names]
**Consumers:** X files

**Re-export Sources:**
| Source | Exports |
|--------|---------|
| `./module1` | foo, bar |
| `./module2` | baz |

**Consumer Files:**
- `path/to/consumer1.js` (line X)
- `path/to/consumer2.js` (line X)

**Impact if Removed:** High/Medium/Low (estimated refactoring effort)

### 🟡 Medium Severity

[Repeat structure for medium severity barrels]

### 🟢 Low Severity

[Repeat structure for low severity barrels]

## Barrel Files by Category

### Pure Barrels (Safe to Remove)

| File | Re-exports | Consumers | Severity |
|------|------------|-----------|----------|
| `app/src/logic/calculators/index.js` | 6 | 12 | High |
| `app/src/islands/shared/FavoriteButton/index.js` | 1 | 3 | Low |

### Mixed Barrels (Require Extraction First)

| File | Issue | Recommendation |
|------|-------|----------------|
| `app/src/logic/workflows/index.js` | Has utility functions + re-exports | Extract utilities to separate file |

### Entry Points (Not Barrels)

| File | Reason |
|------|--------|
| `app/src/main.jsx` | Vite entry point |
| `app/src/islands/pages/SearchPage/index.jsx` | Contains component logic |

## Dependency Analysis

### Most Consumed Barrels

| Barrel | Consumer Count | Risk |
|--------|----------------|------|
| `app/src/logic/index.js` | 47 | High - many files to update |
| `app/src/lib/auth/index.js` | 23 | Medium |

### Circular Dependencies

[Check for and report any barrels that import from each other]

## Removal Roadmap

### Phase 1: Quick Wins (Low Risk, Few Consumers)
1. [Low severity barrel with 1-2 consumers]
2. [Another low severity barrel]

### Phase 2: Medium Impact
1. [Medium severity barrels]
2. [Pure barrels with moderate consumers]

### Phase 3: High Impact (Requires Planning)
1. [High severity barrels with many consumers]
2. [Mixed barrels requiring extraction]

## Recommendations

1. **Immediate Actions:**
   - [ ] Start with Phase 1 barrels (quick wins)
   - [ ] Update import path conventions if needed

2. **Process Improvements:**
   - [ ] Add pre-commit hook to detect new barrel files
   - [ ] Document import conventions for team

3. **Technical Debt:**
   - [ ] Prioritize mixed barrels for logic extraction
   - [ ] Consider import aliases for frequently-used deep paths
```

## Step 5: Report to Slack

After creating the audit document, send a webhook POST request to the URL in the `TINYTASKAGENT` environment variable (found in root `.env`) with:

```bash
python "C:/Users/Split Lease/Documents/Split Lease/.claude/skills/slack-webhook/scripts/send_slack.py" "Barrel files audit complete: [X] barrels found - Report: [filepath]" --type success
```

## Detection Reference

### What Makes a Barrel File?

A **barrel file** is typically an `index.js` (or .ts/.jsx) that re-exports from other modules:

```javascript
// Pure barrel - only re-exports
export * from './calculators';
export { validateUser } from './validators';
export { default as Auth } from './auth';

// Mixed barrel - re-exports + logic
import { API_URL } from './config';
export * from './calculators';
export const getApiUrl = () => API_URL;  // <- actual logic here!
```

### Why Remove Barrels?

| Issue | Without Barrels | With Barrels |
|--------|-----------------|--------------|
| Import path clarity | `from './logic/calculators/pricing/calculatePrice'` | `from './logic'` (obscures location) |
| Dependency graph | Sparse, direct connections | Dense, indirect connections |
| Refactoring impact | Clear, localized changes | Unclear, rippling effects |
| Tree-shaking | Better optimization | May include unused exports |

### Detection Rules

**Is a PURE_BARREL if:**
- File is named `index.js/jsx/ts/tsx`
- Contains 1+ re-export statements
- Contains NO function/class declarations
- Contains NO React hooks usage
- Contains NO JSX return statements

**Is MIXED if:**
- Contains re-exports AND has logic indicators
- Needs extraction before removal

**Is ENTRY_POINT if:**
- Contains actual component or logic code
- No re-exports (or minimal, alongside main code)

## Output Requirements

1. Be thorough - scan ALL index files in the codebase
2. Be specific - include exact file paths, line numbers, and export names
3. Be actionable - provide consumer counts and severity assessment
4. Use timestamp format: `YYYYMMDDHHMMSS-audit-barrel-files.md`
5. Only report actual barrel files found - do not fabricate issues
