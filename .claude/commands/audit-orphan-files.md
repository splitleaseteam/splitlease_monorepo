---
name: audit-orphan-files
description: Detect orphan files (dead code) using AST dependency analysis. Identifies files with no consumers that haven't been updated in a while - prime candidates for tree-shaking/removal. Creates timestamped MD report and notifies via Slack webhook.
---

# Orphan Files Audit (Dead Code Detection)

> **Note:** This slash command uses the `ast-dependency-analyzer` skill to identify files that nothing imports from (orphan files) and cross-references with git history to find stale code.

You are conducting a comprehensive orphan file audit to identify dead code that can be safely removed. Orphan files are files that exist in the codebase but **nothing imports from** them.

## Step 1: Prime the Codebase

**Execute `/prime`** to understand the full codebase structure.

## Step 2: Run AST Dependency Analysis

**Invoke the `ast-dependency-analyzer` skill** to analyze the codebase.

The skill will provide:
- **reverse_dependencies**: Who depends on each file (key for finding orphans)
- Files with **zero dependents** are orphans

## Step 3: Identify Orphan Files

From the AST analysis output, identify orphan files:

### Orphan Detection Logic

**Orphan File = File with zero reverse_dependencies**

From the `reverse_dependencies` map in the AST output:
- Files with empty or missing `reverse_dependencies` lists have **no consumers**
- These are candidates for removal

### Exclusion Criteria (False Positives)

Some files have zero dependents but should NOT be removed:

| File Type | Reason | Action |
|-----------|--------|--------|
| **Entry points** | `main.jsx`, `index.html`, `vite.config.js` | Framework-required |
| **Page components** | Have HTML entry points | Keep |
| **Test files** | Not imported by app code | Keep |
| **CSS/SCSS files** | Imported via different mechanism | Manual review |
| **Configuration** | `tsconfig.json`, `.eslintrc.js` | Keep |
| **Type definition files** | `.d.ts` files | Keep |
| **Storybook/docs** | Documentation files | Keep |

### Severity Assessment

| Severity | Criteria | Action |
|----------|----------|--------|
| **High** | Orphan + not modified in 6+ months | Strong removal candidate |
| **Medium** | Orphan + not modified in 3-6 months | Review before removal |
| **Low** | Orphan + recently modified | May be in development, keep |

## Step 4: Check Git History for Stale Files

For each orphan file, check when it was last modified:

```bash
# Get last modified date for a file
git log -1 --format="%ai" -- path/to/file.js

# Get last modified date for multiple files
git log -1 --format="%ai %H %s" -- path/to/file1.js path/to/file2.js
```

**Interpretation:**
- Files not modified in 6+ months are likely stale/abandoned
- Recently modified orphans may be new features in progress

## Step 5: Create the Audit Document

Create an MD file at `.claude/plans/Documents/<timestamp>-audit-orphan-files.md` with the following structure:

```markdown
# Orphan Files Audit Report (Dead Code Detection)
**Generated:** <timestamp>
**Codebase:** Split Lease
**Method:** AST-based dependency analysis + git history

## Executive Summary
- Total files analyzed: X
- Orphan files found: X (no reverse dependencies)
- High priority removals: X (stale + orphan)
- Medium priority reviews: X
- Low priority (keep): X
- Total potential deletions: X lines of code

## Orphan Files by Severity

### 🔴 High Priority (Orphan + Stale)

Files with no consumers AND not modified in 6+ months:

#### [file_path]
- **Last Modified:** [date from git]
- **Days Since Modified:** [X days]
- **File Type:** Component | Utility | Page | Other
- **Lines of Code:** [X]
- **Export Summary:** [what it exports]

**Reason for Orphan Status:**
- Not imported by any other file
- Appears to be dead/abandoned code

**Recommendation:** DELETE - Safe to remove, high confidence

#### [another file]
[Same structure]

### 🟡 Medium Priority (Orphan + Moderately Stale)

Files with no consumers, modified 3-6 months ago:

#### [file_path]
- **Last Modified:** [date from git]
- **Days Since Modified:** [X days]
- **File Type:** Component | Utility | Page | Other

**Recommendation:** REVIEW - Check with team before deleting

### 🟢 Low Priority (Orphan + Recent)

Files with no consumers but recently modified:

#### [file_path]
- **Last Modified:** [date from git]
- **Days Since Modified:** [X days]
- **File Type:** Component | Utility | Page | Other

**Recommendation:** KEEP - May be in development or used in non-standard way

## Excluded Files (False Positives)

The following files have zero dependents but should NOT be removed:

| File | Reason | Last Modified |
|------|--------|---------------|
| `app/src/main.jsx` | Entry point (Vite) | [date] |
| `app/index.html` | HTML entry point | [date] |
| `app/vite.config.js` | Configuration | [date] |
| `app/src/pages/SomePage/index.jsx` | Has HTML entry | [date] |

## Orphan Files by Type

### Components
| File | Last Modified | Days Stale | LOC | Action |
|------|---------------|------------|-----|--------|
| `app/src/islands/shared/OldWidget.jsx` | 2024-06-15 | 220 | 45 | Delete |

### Utilities
| File | Last Modified | Days Stale | LOC | Action |
|------|---------------|------------|-----|--------|
| `app/src/lib/deprecatedHelpers.js` | 2024-03-10 | 315 | 120 | Delete |

### Pages
| File | Last Modified | Days Stale | Has HTML | Action |
|------|---------------|------------|----------|--------|
| `app/src/islands/pages/OldFeaturePage.jsx` | 2024-05-20 | 245 | Yes | Review |

## Stale Code Metrics

**Age Distribution of Orphan Files:**
- Orphan files 365+ days old: X
- Orphan files 180-364 days old: X
- Orphan files 90-179 days old: X
- Orphan files 30-89 days old: X
- Orphan files <30 days old: X

**Potential Code Reduction:**
- Total files safe to delete: X
- Estimated lines of code: X
- Percentage of codebase: X%

**Risk Assessment:**
- High confidence removals: X (6+ months stale)
- Medium confidence: X (3-6 months stale)
- Low confidence: X (recent orphans)

## Removal Roadmap

### Phase 1: Safe Deletes (High Confidence)
1. [High priority orphan file 1]
2. [High priority orphan file 2]

### Phase 2: Review Before Delete (Medium Confidence)
1. [Medium priority file 1] - Confirm with team
2. [Medium priority file 2] - Check documentation references

### Phase 3: Keep / Monitor (Low Confidence)
1. [Low priority file 1] - May be in progress
2. [Low priority file 2] - Check external usage

## Recommendations

### Immediate Actions
- [ ] Review high priority orphans with development team
- [ ] Delete confirmed dead code (Phase 1)
- [ ] Update documentation after removal

### Prevention
- [ ] Add lint rule to detect new unused files
- [ ] Require code review for new component additions
- [ ] Regular orphan audits (quarterly)

### Process Improvements
- [ ] Establish file removal process for deprecated features
- [ ] Document entry point files to exclude from audits
- [ ] Consider automatic tree-shaking in build process

## AST Analysis Metadata

**Analysis Settings:**
- Root directory: `app/src`
- Files analyzed: X
- Files with zero dependents: X
- Analysis timestamp: [from AST output]

**Git History Summary:**
- Oldest orphan file: [file] ([days] days)
- Most recent orphan: [file] ([days] days)
- Average orphan age: [days] days
```

## Step 6: Report to Slack

After creating the audit document, send a webhook POST request to the URL in the `TINYTASKAGENT` environment variable:

```bash
python "C:/Users/Split Lease/Documents/Split Lease/.claude/skills/slack-webhook/scripts/send_slack.py" "Orphan files audit complete: [X] dead files found - [Y] safe to delete - Report: [filepath]" --type success
```

## Detection Reference

### What Makes an Orphan File?

An **orphan file** is a source file that exists in the codebase but **nothing imports from**:

```javascript
// app/src/islands/shared/OldWidget.jsx
export default function OldWidget() {
  return <div>Old feature</div>;
}

// This file is an ORPHAN if:
// - No other file does: import OldWidget from './OldWidget'
// - No HTML entry point references it
// - reverse_dependencies list is empty
```

**Why Orphans Happen:**
- Feature was replaced but old file not deleted
- Experimental code that was abandoned
- Refactoring left behind unused files
- Component renamed but old file not removed
- Feature flag removed but dependent code not cleaned up

### Orphan vs Tree-Shaking

| Aspect | Orphan Files | Tree-Shaking |
|--------|--------------|--------------|
| **Detection** | No imports at all (file-level) | Unused exports within imported files |
| **Removal** | Delete entire file | Build tool eliminates unused code |
| **Impact** | Clear file removal | Smaller bundle size |
| **Detection Method** | AST `reverse_dependencies` | Build tools (Webpack, Rollup) |

Orphan files are a **coarser** dead code detection - entire files that nothing uses.

### AST Detection for Orphans

From the `ast-dependency-analyzer` skill:

```python
# Find orphans using reverse_dependencies
orphans = []
for file_path in context.symbol_table.keys():
    dependents = context.reverse_dependencies.get(file_path, [])
    if len(dependents) == 0:
        orphans.append(file_path)
```

### Git History for Staleness

```bash
# Get last commit that touched the file
git log -1 --format="%ai %s" -- path/to/file.js

# Output: 2024-03-15 10:30:00 +0000 "Add new feature"

# Calculate days since modified
# Use current date minus last modified date
```

### Exclusion Patterns

**Files to ALWAYS exclude from orphan removal:**

| Pattern | Examples | Reason |
|---------|----------|--------|
| `main.{js,jsx,ts}` | `main.jsx`, `main.tsx` | Entry point |
| `vite.config.js` | `vite.config.js` | Build config |
| `index.html` | `index.html` | HTML entry |
| **.{test,spec}.{js,ts} | `*.test.js` | Test files |
| `*.d.ts` | `*.d.ts` | Type definitions |
| `package.json` | `package.json` | Package config |
| `tsconfig.json` | `tsconfig.json` | TS config |
| `.eslintrc.js` | `.eslintrc.js` | Lint config |

**Files to MANUAL REVIEW:**

| Pattern | Examples | Reason |
|---------|----------|--------|
| `**/pages/**/index.{js,jsx}` | Page components | May have HTML entry |
| `**/public/**` | Static assets | Different import mechanism |
| `**/*.css` | Stylesheets | Imported via CSS |
| `**/*.scss` | Stylesheets | Imported via CSS |

## Output Requirements

1. **Start with `/prime`** - Understand codebase structure
2. **Use `ast-dependency-analyzer` skill** - Get reverse_dependencies
3. **Check git history** - Determine staleness of each orphan
4. **Apply exclusions** - Filter out entry points, tests, config files
5. **Categorize by severity** - Based on staleness (high/medium/low)
6. **Be actionable** - Provide clear delete/review/keep recommendations
7. **Be accurate** - Only report actual orphans from AST analysis
8. **Use timestamp format** - `YYYYMMDDHHMMSS-audit-orphan-files.md`

## If No Orphans Found

If the AST analysis finds NO orphan files:

```markdown
# Orphan Files Audit Report
**Generated:** <timestamp>
**Codebase:** Split Lease
**Method:** AST-based dependency analysis

## Executive Summary
- Total files analyzed: X
- Orphan files found: **0**

## Result

No orphan files (files with zero imports) were detected in this codebase.

This indicates:
- All source files are imported by at least one other file
- No obvious dead code at the file level
- Good codebase hygiene

**Note:** This doesn't guarantee all code is used - there may be unused
exports within imported files (tree-shaking can catch those).
```
