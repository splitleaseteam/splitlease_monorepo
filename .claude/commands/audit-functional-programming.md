---
name: audit-functional-programming
description: Audit codebase for functional programming (FP) violations using the functional-code skill. Reviews purity, immutability, declarative style, error handling, and separation of concerns. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Functional Programming Audit

You are conducting a comprehensive functional programming audit of the codebase to identify violations of FP principles and generate actionable refactoring suggestions.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Invoke the Functional Code Skill

Use the Skill tool to invoke the `functional-code` skill. This will audit the codebase for:

| FP Principle | What It Checks |
|--------------|----------------|
| **PURITY** | Functions with side effects, hidden dependencies |
| **IMMUTABILITY** | Array mutations (push, pop, sort), object mutations |
| **DECLARATIVE STYLE** | Imperative for/while loops that could be map/filter/reduce |
| **EFFECTS AT EDGES** | I/O operations in core business logic (calculators/rules/processors) |
| **ERRORS AS VALUES** | Exceptions used for validation/expected errors |
| **COMPOSITION** | Functions that are too large or do too much |

## Step 3: Create the Audit Document

After the functional-code skill completes its analysis, create an MD file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-functional-programming-audit.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Functional Programming Opportunity Report
**Generated:** <timestamp>
**Codebase:** Split Lease

## Executive Summary
- Files audited: X
- Total violations: X
- High priority: X
- Medium priority: X
- Low priority: X

## Summary by Principle

| Principle | Violations | Priority |
|-----------|------------|----------|
| IMMUTABILITY | X | High/Medium/Low |
| EFFECTS AT EDGES | X | High/Medium/Low |
| DECLARATIVE STYLE | X | High/Medium/Low |
| ERRORS AS VALUES | X | High/Medium/Low |
| PURITY | X | High/Medium/Low |
| COMPOSITION | X | High/Medium/Low |

## Detailed Findings

### IMMUTABILITY

#### 🔴 [file path]:[line number]
**Type:** Mutating Method
**Current Code:**
```javascript
[code snippet]
```
**Suggested Fix:** [specific fix suggestion]
**Rationale:** [explanation]

### EFFECTS AT EDGES

#### 🔴 [file path]:[line number]
**Type:** I/O in Core Logic
**Current Code:**
```javascript
[code snippet]
```
**Suggested Fix:** [specific fix suggestion]
**Rationale:** [explanation]

[Repeat for other principles with violations]

## Refactoring Roadmap

### Phase 1: Critical (High Severity)
1. [High priority item 1]
2. [High priority item 2]

### Phase 2: Important (Medium Severity)
1. [Medium priority item 1]
2. [Medium priority item 2]

### Phase 3: Enhancement (Low Severity)
1. [Low priority item 1]
2. [Low priority item 2]

## FP Score Summary

**Overall Score:** X/10

| Principle | Score | Notes |
|-----------|-------|-------|
| Purity | X/10 | [notes] |
| Immutability | X/10 | [notes] |
| Explicit Dependencies | X/10 | [notes] |
| Effects at Edges | X/10 | [notes] |
| Errors as Values | X/10 | [notes] |
| Declarative Style | X/10 | [notes] |
| Composition | X/10 | [notes] |
```

## Step 4: Report to Slack

After creating the audit document, send a webhook POST request to the URL in the `TINYTASKAGENT` environment variable (found in root `.env`) with:

```bash
python "C:/Users/Split Lease/Documents/Split Lease/.claude/skills/slack-webhook/scripts/send_slack.py" "Functional programming audit complete: [X] violations found - Report: [filepath]" --type success
```

## Output Requirements

1. Be thorough - review the functional-code skill's output comprehensively
2. Be specific - include exact file paths, line numbers, and code snippets
3. Be actionable - provide specific fix suggestions for each violation
4. Save to `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-functional-programming-audit.md`
5. Only report actual violations found - do not fabricate issues

## Reference: FP Principles

Use these principles as reference when reviewing violations:

### 1. Purity
- Same inputs → same outputs (no hidden state)
- No side effects in business logic

### 2. Immutability
- Use spread operator: `{...obj}`, `[...arr]`
- Avoid mutating methods: `push`, `pop`, `sort`, `reverse`

### 3. Explicit Dependencies
- Pass all dependencies as parameters
- No hidden globals or closures

### 4. Effects at Edges
- I/O only in workflow/handler layer
- Core logic (calculators/rules/processors) remains pure

### 5. Errors as Values
- Return Result types for expected failures
- Exceptions only for unexpected errors

### 6. Declarative Style
- Prefer `map`/`filter`/`reduce` over for/while loops
- Use pipeline composition over nested calls

### 7. Composition
- Small, focused functions
- Build complexity through composition
