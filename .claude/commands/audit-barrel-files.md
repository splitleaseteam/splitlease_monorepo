---
name: audit-barrel-files
description: Detect and report barrel/hub files using AST dependency analysis. Identifies pure barrels, mixed barrels, and hub files across ALL JS/TS files (not just index). Creates timestamped MD report and notifies via Slack webhook.
---

# Barrel & Hub Files Audit (AST-Based)

You are conducting a comprehensive barrel and hub file audit using the AST Dependency Analyzer. This approach is superior to regex-based detection because it:

- Uses **tree-sitter AST parsing** for accurate export/import extraction
- Analyzes **ALL JS/TS files**, not just index files
- Builds **complete dependency graph** with reverse dependencies
- Detects **hub files** (files that many others depend on)
- Supports **caching** for fast re-runs

## Step 1: Prime the Codebase

**Execute `/prime`** to understand the full codebase structure.

## Step 2: Run AST Dependency Analysis

Use the Python AST analyzer from the adws directory:

```bash
# Navigate to adws directory
cd "c:\Users\Split Lease\Documents\Split Lease - Dev\adws"

# Run the analysis on the app/src directory
python -c "
import sys
sys.path.insert(0, '.')
from adw_modules.ast_dependency_analyzer import analyze_dependencies

# Analyze the entire app/src directory
context = analyze_dependencies('app/src', force_refresh=True)

# Get markdown output
print(context.to_prompt_context())
"
```

This will output:
- **Symbol Table**: All exports by file
- **Dependency Graph**: All imports by file
- **Reverse Dependencies**: Who depends on each file (consumers)

## Step 3: Analyze the AST Output for Barrels

From the AST analysis output, identify barrel files using these criteria:

### Barrel Detection Logic

**Barrel File = File with RE_EXPORT exports**

From the `symbol_table` in the AST output, find files where:
- `export_type = "re-export"` (the export comes from another module)

**Categorization:**

| Category | Criteria |
|----------|----------|
| **PURE_BARREL** | File has ONLY `re-export` type exports (no declarations, no named exports without source) |
| **MIXED** | File has `re-export` exports AND other export types (declaration, named, default) |
| **HUB_FILE** | File has high `reverse_dependencies` count (many files import from it) |

**Severity Scoring:**

| Severity | Criteria |
|----------|----------|
| **High** | Has star re-export (`name = "*"`) OR re-exports from 5+ sources OR 20+ consumers |
| **Medium** | Re-exports from 3-4 sources OR 10-19 consumers |
| **Low** | Re-exports from 1-2 sources OR <10 consumers |

### What Makes a Hub File?

A **hub file** is any file that many other files depend on, creating a bottleneck:

- **High hub**: 20+ files import from it
- **Medium hub**: 10-19 files import from it
- **Low hub**: 5-9 files import from it

Hub files are NOT necessarily barrels—they could be legitimate utilities or components. But they deserve attention because:
- Changes to them ripple to many files
- They represent tight coupling points in the codebase

## Step 4: Create the Audit Document

Create an MD file at `.claude/plans/Documents/<timestamp>-audit-barrel-files.md` with the following structure:

```markdown
# Barrel & Hub Files Audit Report
**Generated:** <timestamp>
**Codebase:** Split Lease
**Method:** AST-based dependency analysis

## Executive Summary
- Total files analyzed: X
- Barrel files found: X
- Pure barrels (removable): X
- Mixed barrels (need extraction): X
- Hub files identified: X
- High severity: X
- Medium severity: X
- Low severity: X

## Barrel Files (Re-exporters)

### 🔴 High Severity Barrels

#### [file_path]
**Type:** PURE_BARREL | MIXED
**Re-export Sources:** X
**Star Exports:** Yes/No
**Consumers:** X files (from reverse_dependencies)

**Re-export Details:**
| Export Name | Source Module | Line |
|-------------|---------------|------|
| `calculatePrice` | `./pricing/calculate` | 5 |
| `*` | `./utils` | 10 |

**Top Consumers:**
| Consumer File | What It Imports |
|---------------|-----------------|
| `path/to/file1.js` | calculatePrice, validate |
| `path/to/file2.js` | * |

**Impact if Removed:** High/Medium/Low
**Estimated Refactoring Effort:** X files need import updates

### 🟡 Medium Severity Barrels
[Same structure as above]

### 🟢 Low Severity Barrels
[Same structure as above]

## Hub Files (Highly Depended Upon)

Files that many other files depend on (potential bottlenecks):

| File | Consumer Count | Type | Notes |
|------|----------------|------|-------|
| `app/src/lib/supabase.js` | 47 | Utility | Core database client |
| `app/src/lib/auth.js` | 32 | Mixed | Auth utilities |
| `app/src/logic/calculators/index.js` | 23 | Pure Barrel | Should be removed |

### Hub File Analysis

#### `app/src/lib/supabase.js` (47 consumers)
- **Type:** Utility (legitimate hub)
- **Risk:** High - changes affect 47 files
- **Recommendation:** Keep as-is, but consider breaking into smaller modules if it grows

#### `app/src/logic/calculators/index.js` (23 consumers)
- **Type:** Pure Barrel
- **Action:** Remove - update 23 consumers to import directly

## Files by Category

### Pure Barrels (Safe to Remove)

| File | Re-exports | Consumers | Severity |
|------|------------|-----------|----------|
| `app/src/logic/calculators/index.js` | 6 | 23 | High |
| `app/src/islands/shared/FavoriteButton/index.js` | 1 | 3 | Low |

### Mixed Barrels (Require Extraction First)

| File | Issue | Recommendation |
|------|-------|----------------|
| `app/src/lib/utils/index.js` | Re-exports + helper functions | Extract helpers to `helpers.js` |
| `app/src/logic/workflows/index.js` | Re-exports + workflow orchestrators | Extract orchestrators to separate file |

### Non-Barrel Hubs (Legitimate)

| File | Consumers | Reason to Keep |
|------|-----------|----------------|
| `app/src/lib/supabase.js` | 47 | Core database client |
| `app/src/lib/auth.js` | 32 | Authentication utilities |

## Dependency Health Metrics

**Distribution of Dependency Counts:**
- Files with 0 dependents: X (leaf nodes)
- Files with 1-4 dependents: X
- Files with 5-9 dependents: X (low hubs)
- Files with 10-19 dependents: X (medium hubs)
- Files with 20+ dependents: X (high hubs)

**Barrel Prevalence:**
- Pure barrels: X% of all files
- Files with any re-exports: X% of all files

## Removal Roadmap

### Phase 1: Quick Wins (Low Risk, Few Consumers)
1. [Low severity pure barrel with <5 consumers]
2. [Another low severity pure barrel]

### Phase 2: Medium Impact
1. [Medium severity pure barrels]
2. [Pure barrels with moderate consumer counts]

### Phase 3: High Impact (Requires Planning)
1. [High severity pure barrels with many consumers]
2. [Mixed barrels requiring extraction]

## Recommendations

### Immediate Actions
- [ ] Start with Phase 1 barrels (quick wins)
- [ ] Document import path conventions for team

### Structural Improvements
- [ ] Consider breaking up high-count hub files into smaller modules
- [ ] Add pre-commit hook to detect new barrel files
- [ ] Establish direct import convention for new code

### Technical Debt
- [ ] Prioritize mixed barrels for logic extraction
- [ ] Plan migration for high-severity barrels

## AST Analysis Metadata

**Analysis Settings:**
- Root directory: `app/src`
- Files analyzed: X
- Parse errors: X
- Total exports: X
- Total imports: X
- Analysis timestamp: [from AST output]

**Dependency Graph Summary:**
- Average dependents per file: X
- Median dependents per file: X
- Max dependents: X ([file path])
```

## Step 5: Report to Slack

After creating the audit document, send a webhook POST request to the URL in the `TINYTASKAGENT` environment variable:

```bash
python "C:/Users/Split Lease/Documents/Split Lease/.claude/skills/slack-webhook/scripts/send_slack.py" "Barrel & hub files audit complete: [X] barrels, [Y] hubs found - Report: [filepath]" --type success
```

## Detection Reference

### What Makes a Barrel File?

A **barrel file** re-exports from other modules:

```javascript
// Pure barrel - only re-exports (AST: export_type = "re-export")
export * from './calculators';
export { validateUser } from './validators';
export { default as Auth } from './auth';

// Mixed barrel - re-exports + declarations (AST: mixed export types)
import { API_URL } from './config';
export * from './calculators';
export const getApiUrl = () => API_URL;  // <- declaration here
```

**AST Detection vs Regex:**

| Approach | Pros | Cons |
|----------|------|------|
| **AST (tree-sitter)** | Accurate, handles edge cases, distinguishes export types | Requires external tool |
| **Regex** | Simple, no dependencies | Misses edge cases, false positives |

### Why Remove Barrels?

| Issue | Without Barrels | With Barrels |
|--------|-----------------|--------------|
| Import path clarity | `from './logic/calculators/pricing'` | `from './logic'` (obscures location) |
| Dependency graph | Sparse, direct connections | Dense, indirect connections |
| Refactoring impact | Clear, localized changes | Uncertain, rippling effects |
| Tree-shaking | Better optimization | May include unused exports |

### AST Export Types

The AST analyzer categorizes exports into:

| Type | Example | Barrel? |
|------|---------|---------|
| `re-export` | `export { foo } from './bar'` | **YES** |
| `named` | `export { foo, bar }` | NO (local exports) |
| `default` | `export default function()` | NO (local exports) |
| `declaration` | `export const foo = ...` | NO (local exports) |
| `type` | `export type { Foo }` | Maybe (type-only barrel) |

**Pure Barrel Detection:**
```python
# In AST terms:
pure_barrel = all(exp.export_type == "re-export" for exp in file.exports)
mixed_barrel = any(exp.export_type == "re-export" for exp in file.exports) and \
               any(exp.export_type != "re-export" for exp in file.exports)
```

## Output Requirements

1. **Start with `/prime`** - Understand codebase structure
2. **Use AST analyzer** - Run the Python script for accurate detection
3. **Analyze ALL files** - Not just index files
4. **Detect BOTH barrels and hubs** - Barrels re-export, hubs have many consumers
5. **Be specific** - Include exact file paths, line numbers, export names
6. **Be actionable** - Provide consumer counts and severity assessment
7. **Be accurate** - Only report actual findings from AST analysis
8. **Use timestamp format** - `YYYYMMDDHHMMSS-audit-barrel-files.md`

## If No Barrels Found

If the AST analysis finds NO barrel files:

```markdown
# Barrel & Hub Files Audit Report
**Generated:** <timestamp>
**Codebase:** Split Lease
**Method:** AST-based dependency analysis

## Executive Summary
- Total files analyzed: X
- Barrel files found: **0**
- Hub files identified: X

## Result

No barrel files (re-export files) were detected in this codebase.

### Hub Files Found

The following files are highly depended upon (not barrels, but worth noting):

| File | Consumers | Type |
|------|-----------|------|
| `app/src/lib/supabase.js` | 47 | Utility |
| `app/src/lib/auth.js` | 32 | Utility |

These are legitimate utility modules, not barrels.

This codebase has a clean dependency structure with:
- No re-export barrel files
- Direct imports throughout
- Well-defined utility hubs
```
