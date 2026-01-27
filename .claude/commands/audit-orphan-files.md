---
name: audit-orphan-files
description: Detect orphan files (dead code) using AST dependency analysis. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Orphan Files Audit (Dead Code Detection)

> **Note:** This slash command uses the `ast-dependency-analyzer` skill to identify files that nothing imports from (orphan files) and cross-references with git history to find stale code.

You are conducting a comprehensive orphan file audit to identify dead code that can be safely removed.

## Your Task

1. **Run `/prime`** to understand the codebase structure
2. **Invoke `ast-dependency-analyzer` skill** to get dependency analysis
3. **Check git history** for each orphan file (last modified date)
4. **Identify opportunities** in `.claude/plans/Opportunities/YYMMDD/` with timestamp format `YYYYMMDDHHMMSS-orphan-files-audit.md` (where YYMMDD is today's date folder)
5. **Send Slack notification** via `TINYTASKAGENT` webhook

---

## Opportunity Report Template

Create an opportunity file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-orphan-files-audit.md` (where YYMMDD is today's date) using this structure:

```markdown
# Opportunity Report: Orphan Files Analysis (Dead Code Detection)

**Created**: [timestamp]
**Status**: Analysis Complete
**Severity**: [based on stale code count]
**Affected Area**: Codebase - dead/unused files

## 1. System Context

### 1.1 Architecture Understanding
- **Architecture Pattern**: [from codebase]
- **Tech Stack**: React 18, Vite, JavaScript/TypeScript
- **Analysis Method**: AST-based dependency analysis + git history

### 1.2 Domain Context
- **Purpose**: Identify orphan files (dead code) - files with no consumers
- **Orphan Definition**: Files with zero `reverse_dependencies` - nothing imports from them
- **Stale Code**: Orphan files not modified in 3+ months
- **Why It Matters**: Dead code bloats codebase, confuses developers, increases maintenance burden

### 1.3 Entry Points and Dependencies
- **Analysis Tool**: `ast-dependency-analyzer` skill + git log
- **Data Source**: `app/src` directory
- **Key Outputs**:
  - `reverse_dependencies`: Who depends on each file (empty = orphan)
  - Git history: Last modified date for staleness assessment

## 2. Analysis Methodology

### 2.1 Detection Criteria

**Orphan Files**:
- Files with `reverse_dependencies` count = 0 (no consumers)
- Files NOT imported by any other file in the codebase

**Severity Assessment**:
- **High**: Orphan + 6+ months since last commit → DELETE (safe)
- **Medium**: Orphan + 3-6 months since last commit → REVIEW first
- **Low**: Orphan + recently modified → KEEP (may be in development)

**Exclusion Criteria** (False Positives):
- Entry points (`main.jsx`, `index.html`)
- Configuration files (`vite.config.js`, `tsconfig.json`)
- Test files (`*.test.js`, `*.spec.js`)
- Type definitions (`*.d.ts`)
- Files with HTML entry points
- CSS/SCSS files (different import mechanism)

### 2.2 Git History Analysis

For each orphan file, check staleness:
```bash
git log -1 --format="%ai %s" -- path/to/file.js
```

**Interpretation**:
- Files not modified in 6+ months = stale/abandoned
- Recently modified orphans = WIP or experimental

### 2.3 Files Analyzed

Total JS/TS files analyzed: [from AST output]
Orphan files found: [count]
After exclusions applied: [count]

## 3. Findings

### 3.1 Orphan Files by Severity

#### 🔴 High Priority (Orphan + Stale - DELETE)

| File Path | Last Modified | Days Stale | LOC | File Type | Action |
|-----------|---------------|------------|-----|-----------|--------|
| `app/src/...` | [date] | X | X | Component/Utility | DELETE |

**Details**:
[For each high priority orphan, provide:]
- File path
- Last modified date from git
- Days since modification
- What it exports (from symbol_table)
- Reason it's safe to delete

#### 🟡 Medium Priority (Orphan + Moderately Stale - REVIEW)

| File Path | Last Modified | Days Stale | LOC | File Type | Action |
|-----------|---------------|------------|-----|-----------|--------|
| `app/src/...` | [date] | X | X | Component/Utility | REVIEW |

#### 🟢 Low Priority (Orphan + Recent - KEEP)

| File Path | Last Modified | Days Stale | LOC | File Type | Action |
|-----------|---------------|------------|-----|-----------|--------|
| `app/src/...` | [date] | X | X | Component/Utility | KEEP |

### 3.2 Excluded Files (False Positives)

The following files have zero dependents but should NOT be removed:

| File Path | Reason | Last Modified |
|-----------|--------|---------------|
| `app/src/main.jsx` | Entry point (Vite) | [date] |
| `app/index.html` | HTML entry point | [date] |
| `app/vite.config.js` | Configuration | [date] |

### 3.3 Summary Statistics

- **Total orphan files**: X
- **High priority (safe to delete)**: X
- **Medium priority (review first)**: X
- **Low priority (keep)**: X
- **Total potential deletions**: X files, X lines of code
- **Percentage of codebase**: X%

## 4. Stale Code Metrics

### 4.1 Age Distribution

| Age Range | Count | Percentage |
|-----------|-------|------------|
| 365+ days old | X | X% |
| 180-364 days old | X | X% |
| 90-179 days old | X | X% |
| 30-89 days old | X | X% |
| <30 days old | X | X% |

### 4.2 File Type Distribution

| Type | Count | Total LOC |
|------|-------|-----------|
| Components | X | X |
| Utilities | X | X |
| Pages | X | X |
| Other | X | X |

### 4.3 Risk Assessment

**Risk Level**: [High/Medium/Low]

**Confidence Levels**:
- High confidence removals (6+ months stale): X
- Medium confidence (3-6 months stale): X
- Low confidence (recent orphans): X

## 5. Removal Roadmap

### Phase 1: Safe Deletes (High Confidence)

1. [High priority orphan file 1] - DELETE
2. [High priority orphan file 2] - DELETE
3. [High priority orphan file 3] - DELETE

### Phase 2: Review Before Delete (Medium Confidence)

1. [Medium priority file 1] - Review with team first
2. [Medium priority file 2] - Check external references

### Phase 3: Keep / Monitor (Low Confidence)

1. [Low priority file 1] - Keep (may be in progress)
2. [Low priority file 2] - Monitor for usage

## 6. Recommendations

### Immediate Actions
- [ ] Review high priority orphans with development team
- [ ] Delete confirmed dead code (Phase 1)
- [ ] Update documentation after removal
- [ ] Commit deletions with descriptive messages

### Prevention
- [ ] Add lint rule to detect new unused files
- [ ] Require code review for new component additions
- [ ] Regular orphan audits (quarterly)
- [ ] Document entry point files to exclude

### Process Improvements
- [ ] Establish file removal process for deprecated features
- [ ] Add pre-commit hook to flag potential orphans
- [ ] Consider automatic tree-shaking in build process
- [ ] Track file creation vs deletion rate

## 7. Potential Code Reduction

**Files Safe to Delete**: X
**Estimated Lines of Code**: X
**Percentage of Codebase**: X%

**Impact**:
- Reduced bundle size: X KB
- Faster build times: X seconds
- Reduced maintenance burden: X fewer files to understand

## 8. References

### Relevant Files
| File | Purpose | Action |
|------|---------|--------|
| `app/src/...` | [description] | DELETE/REVIEW/KEEP |

### Related Documentation
- `.claude/skills/ast-dependency-analyzer/SKILL.md` - Analysis tool reference
- [Other relevant docs]

## 9. Next Steps

1. Get team approval for Phase 1 deletions
2. Create backup branch before deletions
3. Execute Phase 1 removals
4. Run tests to verify no breakage
5. Update any documentation references
6. Plan Phase 2 reviews
```

## Slack Notification Format

After creating the plan, send a Slack webhook:

```bash
python "C:/Users/Split Lease/Documents/Split Lease/.claude/skills/slack-webhook/scripts/send_slack.py" "Orphan files audit complete: [X] dead files found - [Y] safe to delete - Opportunities: .claude/plans/Opportunities/YYMMDD/[report-name].md" --type success
```

## Output Requirements

1. **Invoke `ast-dependency-analyzer` skill** to get reverse_dependencies
2. **Check git history** for each orphan file (last modified date)
3. **Apply exclusions** (entry points, tests, configs)
4. **Create opportunity report** in `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-orphan-files-audit.md`
5. **Use the template above** for plan structure
6. **Include specific findings** - file paths, staleness, recommendations
7. **Send Slack notification** after plan creation
8. **Be accurate** - Only report actual orphans from AST analysis

## If No Orphans Found

If the AST analysis finds NO orphan files, still create an opportunity report documenting the clean state:

```markdown
# Opportunity Report: Orphan Files Analysis

**Created**: [timestamp]
**Status**: Analysis Complete - No Orphans Found
**Severity**: N/A
**Result**: Codebase has no dead files

## Summary

No orphan files (files with zero imports) were detected in this codebase.

This indicates:
- All source files are imported by at least one other file
- No obvious dead code at the file level
- Good codebase hygiene

**Note**: This doesn't guarantee all code is used - there may be unused
exports within imported files (tree-shaking can catch those).
```
