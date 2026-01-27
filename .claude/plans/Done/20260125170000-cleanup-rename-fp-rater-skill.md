# Cleanup Plan: Rename fp-rater Skill to functional-code-rater

**Plan ID**: 20260125170000-cleanup-rename-fp-rater-skill
**Created**: 2026-01-25
**Classification**: CLEANUP
**Estimated Effort**: Low (6 files to update)

---

## 1. Executive Summary

### What is being cleaned up
Renaming the `fp-rater` skill to `functional-code-rater` to eliminate the ambiguous "fp" acronym and align with codebase naming conventions.

### Why
The codebase has an explicit guideline against project-specific abbreviations:
> "Always use full, descriptive names for directories, files, variables, and functions. For example, use `functional/` not `fp/`"

Additionally, there is already a skill named `functional-code` that provides functional programming guidance. Naming the rater skill `functional-code-rater` creates consistency and clarity.

### Scope and Boundaries
- Rename skill directory from `fp-rater` to `functional-code-rater`
- Update all references to the old skill name
- Does NOT modify the skill's functionality or behavior

### Expected Outcomes
- Clearer, more descriptive skill name
- Alignment with codebase naming conventions
- Consistency with existing `functional-code` skill naming

---

## 2. Current State Analysis

### Affected Files Inventory

| # | File Path | Type | Reference Location |
|---|-----------|------|-------------------|
| 1 | `.claude/skills/fp-rater/SKILL.md` | Skill Definition | Line 2: `name: fp-rater` |
| 2 | `.claude/CLAUDE.md` | Project Docs | Line 247: `/fp-rater` skill reference |
| 3 | `.claude/AGENTS.md` | Agent Docs | Line 211: `/fp-rater` skill reference |
| 4 | `.claude/settings.local.json` | Permissions Config | Line 15: `Skill(fp-rater)` |
| 5 | `.claude/agents/fp_chunk_1/raw_output.json` | Agent Output Cache | Lines 103, 195: skill list entries |
| 6 | `.claude/agents/fp_chunk_1/raw_output.jsonl` | Agent Output Cache | Line 1: skill list entry |

### Statistics
- **Total files affected**: 6
- **Directories to rename**: 1
- **Documentation files**: 2
- **Configuration files**: 1
- **Cache files**: 2

### Current Pattern (Code Snippets)

**File: `.claude/skills/fp-rater/SKILL.md` (Lines 1-5)**
```yaml
---
name: fp-rater
description: |
  Automatically rates functional programming adherence after editing or creating code files...
---
```

**File: `.claude/CLAUDE.md` (Line 247)**
```markdown
- **ALWAYS invoke `/fp-rater` skill after creating or updating code files** - Output the FP rating table...
```

**File: `.claude/AGENTS.md` (Line 211)**
```markdown
- **ALWAYS invoke `/fp-rater` skill after creating or updating code files** - Output the FP rating table...
```

**File: `.claude/settings.local.json` (Lines 14-16)**
```json
"Skill(fp-rater)",
```

### Relationship to Existing Skills

The codebase has a related skill `functional-code` at `.claude/skills/functional-code/SKILL.md`:
- **functional-code**: Guides writing pure, functional code (comprehensive FP guide with audit tools)
- **fp-rater**: Rates files for FP adherence after edits (simple rating output)

Renaming to `functional-code-rater` creates a clear parent-child relationship:
- `functional-code` = The guide/methodology
- `functional-code-rater` = The scoring mechanism for that methodology

---

## 3. Target State Definition

### Desired End State

| Original | New |
|----------|-----|
| `.claude/skills/fp-rater/` | `.claude/skills/functional-code-rater/` |
| `name: fp-rater` | `name: functional-code-rater` |
| `/fp-rater` | `/functional-code-rater` |
| `Skill(fp-rater)` | `Skill(functional-code-rater)` |

### Target Pattern Example

**File: `.claude/skills/functional-code-rater/SKILL.md` (Lines 1-5)**
```yaml
---
name: functional-code-rater
description: |
  Automatically rates functional programming adherence after editing or creating code files...
---
```

### Success Criteria
1. Skill directory renamed: `.claude/skills/functional-code-rater/` exists
2. Old directory removed: `.claude/skills/fp-rater/` does not exist
3. SKILL.md name updated: `name: functional-code-rater`
4. All documentation references updated to `/functional-code-rater`
5. Permission config updated to `Skill(functional-code-rater)`
6. Skill can be invoked successfully with new name
7. No grep results for `fp-rater` in `.claude/` directory (except cache files which may be stale)

---

## 4. File-by-File Action Plan

### File: `.claude/skills/fp-rater/SKILL.md`
**Current State**: Skill definition file with `name: fp-rater`

**Required Changes**:
1. Rename parent directory from `fp-rater` to `functional-code-rater`
2. Update frontmatter `name` field from `fp-rater` to `functional-code-rater`

**Code Reference**:
```yaml
# BEFORE
---
name: fp-rater
description: |

# AFTER
---
name: functional-code-rater
description: |
```

**Dependencies**: None - this is the source definition

**Verification**:
- `Test-Path ".claude/skills/functional-code-rater/SKILL.md"` returns True
- Grep for `name: functional-code-rater` returns match

---

### File: `.claude/CLAUDE.md`
**Current State**: Line 247 references `/fp-rater` skill

**Required Changes**:
Replace `/fp-rater` with `/functional-code-rater`

**Code Reference**:
```markdown
# BEFORE (Line 247)
- **ALWAYS invoke `/fp-rater` skill after creating or updating code files**

# AFTER
- **ALWAYS invoke `/functional-code-rater` skill after creating or updating code files**
```

**Dependencies**: None

**Verification**:
- Grep for `/fp-rater` in file returns no matches
- Grep for `/functional-code-rater` in file returns 1 match

---

### File: `.claude/AGENTS.md`
**Current State**: Line 211 references `/fp-rater` skill

**Required Changes**:
Replace `/fp-rater` with `/functional-code-rater`

**Code Reference**:
```markdown
# BEFORE (Line 211)
- **ALWAYS invoke `/fp-rater` skill after creating or updating code files**

# AFTER
- **ALWAYS invoke `/functional-code-rater` skill after creating or updating code files**
```

**Dependencies**: None

**Verification**:
- Grep for `/fp-rater` in file returns no matches
- Grep for `/functional-code-rater` in file returns 1 match

---

### File: `.claude/settings.local.json`
**Current State**: Line 15 has `"Skill(fp-rater)"` in permissions allow list

**Required Changes**:
Replace `Skill(fp-rater)` with `Skill(functional-code-rater)`

**Code Reference**:
```json
// BEFORE (Line 15)
"Skill(fp-rater)",

// AFTER
"Skill(functional-code-rater)",
```

**Dependencies**: None

**Verification**:
- JSON is valid (no syntax errors)
- Grep for `fp-rater` in file returns no matches
- Grep for `functional-code-rater` in file returns 1 match

---

### Files: `.claude/agents/fp_chunk_1/raw_output.json` and `raw_output.jsonl`
**Current State**: Agent cache files containing skill inventory lists

**Required Changes**:
- **OPTION A (Recommended)**: Delete these cache files - they will be regenerated
- **OPTION B**: Update the skill name references

**Rationale for Option A**:
- These are generated cache files, not source files
- Deleting them is simpler and ensures clean regeneration
- The directory name `fp_chunk_1` suggests these are temporary processing outputs

**Dependencies**: None

**Verification**:
- Files deleted OR updated to contain `functional-code-rater`

---

## 5. Execution Order

Execute changes in this order to minimize risk:

### Phase 1: Rename Source Files (CRITICAL)
1. **Rename skill directory**: `.claude/skills/fp-rater/` to `.claude/skills/functional-code-rater/`
2. **Update SKILL.md**: Change `name: fp-rater` to `name: functional-code-rater`

### Phase 2: Update References (SAFE)
3. **Update CLAUDE.md**: Replace `/fp-rater` with `/functional-code-rater`
4. **Update AGENTS.md**: Replace `/fp-rater` with `/functional-code-rater`
5. **Update settings.local.json**: Replace `Skill(fp-rater)` with `Skill(functional-code-rater)`

### Phase 3: Clean Cache (OPTIONAL)
6. **Delete cache files**: Remove `.claude/agents/fp_chunk_1/raw_output.json` and `.claude/agents/fp_chunk_1/raw_output.jsonl`
   - OR update them to reflect the new name

### Safe Stopping Points
- After Phase 1: Skill renamed, but old references remain (skill will work if invoked by new name)
- After Phase 2: All documentation current, cache may be stale
- After Phase 3: Complete cleanup

---

## 6. Risk Assessment

### Potential Breaking Changes
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Skill invocation fails with old name | Low | Medium | Update all references before testing |
| JSON syntax error in settings.local.json | Very Low | High | Validate JSON after edit |
| Cache files cause confusion | Low | Low | Delete cache files |

### Edge Cases
1. **Other agents/sessions referencing old name**: Low risk - they will get an error but it's recoverable
2. **Automated scripts invoking skill**: Check if any CI/CD or scripts reference the skill - none found in initial search

### Rollback Considerations
If issues arise:
1. Rename directory back to `fp-rater`
2. Revert SKILL.md name field
3. Git restore documentation files
4. Restore settings.local.json from git

Simple rollback - all changes are reversible file renames and string replacements.

---

## 7. Verification Checklist

### Post-Implementation Verification

- [ ] **Directory exists**: `.claude/skills/functional-code-rater/` exists
- [ ] **Old directory gone**: `.claude/skills/fp-rater/` does not exist
- [ ] **SKILL.md name correct**: Contains `name: functional-code-rater`
- [ ] **CLAUDE.md updated**: Contains `/functional-code-rater`, not `/fp-rater`
- [ ] **AGENTS.md updated**: Contains `/functional-code-rater`, not `/fp-rater`
- [ ] **settings.local.json valid**: Valid JSON, contains `Skill(functional-code-rater)`
- [ ] **No stale references**: `grep -r "fp-rater" .claude/` returns no matches (except cache if kept)
- [ ] **Skill invocable**: `/functional-code-rater` can be invoked successfully

### Definition of Done
1. All files updated per action plan
2. All verification checks pass
3. Git commit created with descriptive message
4. No functional regressions (skill works as before)

---

## 8. Reference Appendix

### All File Paths (Consolidated)

**Source Files to Modify:**
```
c:\Users\Split Lease\Documents\Split Lease - Team\.claude\skills\fp-rater\SKILL.md
c:\Users\Split Lease\Documents\Split Lease - Team\.claude\CLAUDE.md
c:\Users\Split Lease\Documents\Split Lease - Team\.claude\AGENTS.md
c:\Users\Split Lease\Documents\Split Lease - Team\.claude\settings.local.json
```

**Cache Files (Delete or Update):**
```
c:\Users\Split Lease\Documents\Split Lease - Team\.claude\agents\fp_chunk_1\raw_output.json
c:\Users\Split Lease\Documents\Split Lease - Team\.claude\agents\fp_chunk_1\raw_output.jsonl
```

**Directory to Rename:**
```
FROM: c:\Users\Split Lease\Documents\Split Lease - Team\.claude\skills\fp-rater\
TO:   c:\Users\Split Lease\Documents\Split Lease - Team\.claude\skills\functional-code-rater\
```

### Key Code Patterns

**Before/After Summary:**

| File | Before | After |
|------|--------|-------|
| SKILL.md (line 2) | `name: fp-rater` | `name: functional-code-rater` |
| CLAUDE.md (line 247) | `/fp-rater` | `/functional-code-rater` |
| AGENTS.md (line 211) | `/fp-rater` | `/functional-code-rater` |
| settings.local.json (line 15) | `"Skill(fp-rater)"` | `"Skill(functional-code-rater)"` |

### Related Documentation
- **Functional Code Skill**: `.claude/skills/functional-code/SKILL.md` (related skill for FP guidance)
- **Codebase Guidelines**: `.claude/CLAUDE.md` (contains the naming convention rule)

---

## Execution Commands (PowerShell)

```powershell
# Phase 1: Rename directory
Rename-Item -Path ".claude\skills\fp-rater" -NewName "functional-code-rater"

# Phase 2: Update files (using Edit tool - see file-by-file actions above)

# Phase 3: Clean cache (optional)
Remove-Item ".claude\agents\fp_chunk_1\raw_output.json" -ErrorAction SilentlyContinue
Remove-Item ".claude\agents\fp_chunk_1\raw_output.jsonl" -ErrorAction SilentlyContinue

# Verification
Test-Path ".claude\skills\functional-code-rater\SKILL.md"  # Should return True
Test-Path ".claude\skills\fp-rater"  # Should return False
```

---

**END OF PLAN**
