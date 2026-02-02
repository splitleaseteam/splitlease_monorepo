---
name: audit-barrel-files
description: Detect and report barrel/hub files using AST dependency analysis. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Barrel & Hub Files Audit (AST-Based)

> **Note:** This slash command uses the `ast-dependency-analyzer` skill. The skill provides general-purpose AST dependency analysis that can be used for many tasks (barrel detection, circular dependencies, orphan files, etc.). This command focuses specifically on barrel and hub file detection.

You are conducting a comprehensive barrel and hub file audit using the AST Dependency Analyzer skill.

## Your Task

1. **Run `/prime`** to understand the codebase structure
2. **Invoke `ast-dependency-analyzer` skill** to get dependency analysis
3. **Identify opportunities** in `.claude/plans/Opportunities/YYMMDD/` with timestamp format `YYYYMMDDHHMMSS-barrel-files-audit.md` (where YYMMDD is today's date folder)
4. **Send Slack notification** via `TINYTASKAGENT` webhook

---

## Opportunity Report Template

Create an opportunity file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-barrel-files-audit.md` (where YYMMDD is today's date) using this structure:

```markdown
# Opportunity Report: Barrel & Hub Files Analysis

**Created**: [timestamp]
**Status**: Analysis Complete
**Severity**: [based on findings]
**Affected Area**: Codebase dependency structure

## 1. System Context

### 1.1 Architecture Understanding
- **Architecture Pattern**: [from codebase]
- **Tech Stack**: React 18, Vite, JavaScript/TypeScript
- **Analysis Method**: AST-based dependency analysis using tree-sitter

### 1.2 Domain Context
- **Purpose**: Identify barrel files (re-exporters) and hub files (highly depended upon)
- **Barrel Definition**: Files with `export_type = "re-export"` - re-export from other modules
- **Hub Definition**: Files with high `reverse_dependencies` count (many consumers)
- **Why It Matters**: Barrels create dense dependency graphs that hinder refactoring

### 1.3 Entry Points and Dependencies
- **Analysis Tool**: `ast-dependency-analyzer` skill
- **Data Source**: `app/src` directory
- **Key Outputs**:
  - `symbol_table`: What each file exports (with export types)
  - `dependency_graph`: What each file imports
  - `reverse_dependencies`: Who depends on each file

## 2. Analysis Methodology

### 2.1 Detection Criteria

**Barrel Files**:
- **Pure Barrel**: All exports are `re-export` type (no local definitions)
- **Mixed Barrel**: Has `re-export` exports AND local exports
- **Detection**: Check `export_type` field in `symbol_table`

**Hub Files**:
- **High Hub**: 20+ files import from it
- **Medium Hub**: 10-19 files import from it
- **Low Hub**: 5-9 files import from it
- **Detection**: Check `reverse_dependencies` count

**Severity Scoring**:
- **High**: Star exports (`export *`) OR 5+ re-export sources OR 20+ consumers
- **Medium**: 3-4 re-export sources OR 10-19 consumers
- **Low**: 1-2 re-export sources OR <10 consumers

### 2.2 Files Analyzed

Total JS/TS files analyzed: [from AST output]
Files with re-exports: [count]
Files with high dependency counts: [count]

## 3. Findings

### 3.1 Barrel Files by Severity

#### 🔴 High Severity Barrels

| File Path | Type | Re-exports | Star Export | Consumers | Severity |
|-----------|------|------------|-------------|-----------|----------|
| `app/src/...` | PURE/MIXED | X | Yes/No | X | High |

**Details**:
[For each high severity barrel, provide:]
- File path
- Re-export sources (what it re-exports from)
- Consumer list (from reverse_dependencies)
- Impact assessment
- Removal priority

#### 🟡 Medium Severity Barrels
[Same table format]

#### 🟢 Low Severity Barrels
[Same table format]

### 3.2 Hub Files (Highly Depended Upon)

| File Path | Consumer Count | Type | Notes |
|-----------|----------------|------|-------|
| `app/src/...` | X | Utility/Component/Barrel | [notes] |

### 3.3 Summary Statistics

- **Total barrel files**: X
- **Pure barrels (removable)**: X
- **Mixed barrels (need extraction)**: X
- **High severity**: X
- **Medium severity**: X
- **Low severity**: X
- **Total hub files**: X

## 4. Removal Roadmap

### Phase 1: Quick Wins (Low Risk)
1. [Low severity pure barrel with <5 consumers]
2. [Another low severity barrel]

### Phase 2: Medium Impact
1. [Medium severity pure barrels]
2. [Pure barrels with moderate consumers]

### Phase 3: High Impact (Requires Planning)
1. [High severity barrels with many consumers]
2. [Mixed barrels requiring extraction]

## 5. Recommendations

### Immediate Actions
- [ ] [Action item 1]
- [ ] [Action item 2]

### Structural Improvements
- [ ] [Improvement 1]
- [ ] [Improvement 2]

### Technical Debt
- [ ] [Debt item 1]
- [ ] [Debt item 2]

## 6. Risk Assessment

**Risk Level**: [High/Medium/Low]

**Risks**:
- [Risk 1]
- [Risk 2]

**Mitigations**:
- [Mitigation 1]
- [Mitigation 2]

## 7. References

### Relevant Files
| File | Purpose | Action Needed |
|------|---------|---------------|
| `app/src/...` | [description] | [action] |

### Related Documentation
- `.claude/skills/ast-dependency-analyzer/SKILL.md` - Analysis tool reference
- [Other relevant docs]

## 8. Next Steps

1. [Review findings with team]
2. [Plan Phase 1 removals]
3. [Create follow-up tasks]
```

## Slack Notification Format

After creating the plan, send a Slack webhook:

```bash
python "C:/Users/Split Lease/Documents/Split Lease/.claude/skills/slack-webhook/scripts/send_slack.py" "Barrel & hub files audit complete: [X] barrels, [Y] hubs found - Opportunities: .claude/plans/Opportunities/YYMMDD/[report-name].md" --type success
```

## Output Requirements

1. **Invoke `ast-dependency-analyzer` skill** for accurate detection
2. **Create plan** in `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-barrel-files-audit.md`
3. **Use the template above** for plan structure
4. **Include specific findings** - file paths, consumer counts, severity
5. **Send Slack notification** after plan creation
6. **Be accurate** - Only report actual findings from AST analysis

## If No Barrels Found

If the AST analysis finds NO barrel files, still create an opportunity report documenting the clean state:

```markdown
# Opportunity Report: Barrel & Hub Files Analysis

**Created**: [timestamp]
**Status**: Analysis Complete - No Barrels Found
**Severity**: N/A
**Result**: Codebase has clean dependency structure

## Summary

No barrel files (re-export files) were detected in this codebase.

### Hub Files Found

The following files are highly depended upon (legitimate utilities, not barrels):

| File | Consumers | Type |
|------|-----------|------|
| `app/src/lib/...` | X | Utility |

This codebase has:
- No re-export barrel files
- Direct imports throughout
- Well-defined utility hubs
```
