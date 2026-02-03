# Refactoring Specification: test_e2e.md

**Created**: 2026-02-03
**Target File**: `.claude/commands/test_e2e.md`
**Goal**: Improve code cleanliness, organization, performance, and LLM iterability

---

## Current Issues Analysis

### 1. Structural Problems

| Issue | Location | Impact |
|-------|----------|--------|
| Mixed concerns | Lines 14-30 | Instructions blend setup, execution, and reporting logic |
| Redundant "IMPORTANT" markers | Lines 18, 22, 26, 71 | Dilutes emphasis, LLMs may ignore repeated urgency |
| Ambiguous variable syntax | Lines 7-10 | `$ARGUMENT if provided, otherwise...` is non-standard |
| Inline path templates | Lines 60, 79-82 | Repeated, error-prone, hard to modify |
| Manual setup instructions | Lines 34-56 | Should be automatable or externalized |
| Unordered execution flow | Lines 14-30 | Bullet list lacks sequencing clarity |

### 2. LLM-Specific Problems

- **No state machine**: LLMs benefit from explicit phase transitions
- **Implicit error handling**: Scattered across multiple bullets
- **Path construction logic embedded in prose**: Should be a formula
- **No early-exit conditions**: Fail-fast criteria buried in instructions
- **Output format at the end**: Should be front-loaded for goal clarity

---

## Proposed Structure

### New Section Order (Optimized for LLM Processing)

```
1. HEADER (name, purpose, single sentence)
2. OUTPUT CONTRACT (what success looks like - goal-first)
3. INPUTS (typed, with defaults, validation rules)
4. DERIVED VALUES (computed from inputs, explicit formulas)
5. PRECONDITIONS (fail-fast checks before execution)
6. EXECUTION PHASES (numbered, sequential, with checkpoints)
7. ERROR TAXONOMY (categorized error types and responses)
8. APPENDIX: MANUAL SETUP (reference only, not inline)
```

---

## Detailed Refactoring Plan

### Phase 1: Output Contract First

**Rationale**: LLMs perform better when the goal is stated upfront. Move output format to the top.

```markdown
## Output Contract

Returns a JSON object. The LLM MUST produce ONLY this JSON (no prose wrapper):

| Field | Type | Description |
|-------|------|-------------|
| `test_name` | string | Name extracted from test file |
| `status` | enum | `"passed"` or `"failed"` |
| `screenshots` | string[] | Absolute paths to captured screenshots |
| `error` | object \| null | Error details if failed |
| `steps_completed` | number | Count of steps executed before pass/fail |

### Error Object Schema
```json
{
  "step": 1,
  "action": "click",
  "selector": "#submit-button",
  "expected": "Element visible",
  "actual": "Element not found",
  "screenshot": "/path/to/error_screenshot.png"
}
```
```

### Phase 2: Typed Inputs with Validation

**Rationale**: Explicit types and defaults reduce ambiguity.

```markdown
## Inputs

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `e2e_test_file` | filepath | YES | - | Must exist, must be .md |
| `application_url` | url | NO | `http://localhost:8080` | Must respond to GET |
| `adw_id` | string | NO | `<random 8-char hex>` | 8 alphanumeric chars |
| `agent_name` | string | NO | `test_e2e` | No spaces, filesystem-safe |
```

### Phase 3: Derived Values (Explicit Formulas)

**Rationale**: Remove path construction from prose. Make formulas copy-pasteable.

```markdown
## Derived Values

Compute these ONCE at the start and reuse:

| Variable | Formula |
|----------|---------|
| `CODEBASE_ROOT` | Result of `pwd` in project root |
| `TEST_DIR_NAME` | `e2e_test_file` filename without `test_` prefix and `.md` extension |
| `SCREENSHOT_DIR` | `{CODEBASE_ROOT}/agents/{adw_id}/{agent_name}/img/{TEST_DIR_NAME}` |
| `SCREENSHOT_PATH(n, desc)` | `{SCREENSHOT_DIR}/{n:02d}_{desc}.png` |

### Example Resolution
- Input: `e2e_test_file = "test_basic_search.md"`
- `TEST_DIR_NAME` = `"basic_search"`
- `SCREENSHOT_DIR` = `/path/to/codebase/agents/a1b2c3d4/test_e2e/img/basic_search`
```

### Phase 4: Preconditions (Fail-Fast)

**Rationale**: Check prerequisites before any Playwright operations.

```markdown
## Preconditions

Execute these checks IN ORDER. On ANY failure, abort with status `"failed"` and appropriate error:

1. **Test file exists**: `Read(e2e_test_file)` succeeds
2. **Test file is valid**: Contains `## User Story`, `## Test Steps`, `## Success Criteria`
3. **Server responds**: `GET {application_url}` returns 2xx status
4. **Screenshot dir writable**: `mkdir -p {SCREENSHOT_DIR}` succeeds
5. **Playwright available**: Browser can be launched (headed mode)

### Precondition Failure Response
```json
{
  "test_name": "unknown",
  "status": "failed",
  "screenshots": [],
  "error": {
    "phase": "precondition",
    "check": "server_responds",
    "message": "GET http://localhost:8080 returned 503"
  },
  "steps_completed": 0
}
```
```

### Phase 5: Execution Phases (State Machine)

**Rationale**: Numbered phases with explicit transitions. LLMs can checkpoint progress.

```markdown
## Execution Phases

### Phase 1: INITIALIZE
1. Parse test file sections: `User Story`, `Test Steps`, `Success Criteria`
2. Create screenshot directory
3. Launch Playwright browser (headed mode)
4. Navigate to `application_url`
5. Wait for page load (networkidle or 5s timeout)
6. Capture screenshot: `SCREENSHOT_PATH(1, "initial_state")`

→ On success: Proceed to Phase 2
→ On failure: Abort with error, capture failure screenshot

### Phase 2: EXECUTE TEST STEPS
For each step in `Test Steps` (1-indexed):
1. Parse step action (click, type, wait, verify, etc.)
2. Execute action via Playwright MCP
3. If step contains `**Verify**`: Assert condition
4. Capture screenshot: `SCREENSHOT_PATH(n+1, "{action}_{target}")`
5. Log: `(Step {n} ✓) {description}`

→ On step failure:
  - Log: `(Step {n} ❌) {description}: {error_message}`
  - Capture screenshot: `SCREENSHOT_PATH(n+1, "error_{action}")`
  - Abort immediately (do not continue)

### Phase 3: VALIDATE SUCCESS CRITERIA
For each criterion in `Success Criteria`:
1. Evaluate criterion against current page state
2. Log result

→ All pass: status = `"passed"`
→ Any fail: status = `"failed"`, include first failing criterion in error

### Phase 4: FINALIZE
1. Capture final screenshot: `SCREENSHOT_PATH(999, "final_state")`
2. Close browser
3. Compile JSON output
4. Return ONLY the JSON (no additional prose)
```

### Phase 6: Error Taxonomy

**Rationale**: Categorized errors help LLMs choose appropriate responses.

```markdown
## Error Taxonomy

| Category | Examples | Response |
|----------|----------|----------|
| `precondition` | Server down, file not found | Abort before browser launch |
| `navigation` | Page timeout, 404 error | Abort with screenshot |
| `element` | Selector not found, not clickable | Abort with screenshot, include selector |
| `assertion` | Verify step failed | Abort with expected vs actual |
| `infrastructure` | Playwright crash, screenshot save failed | Abort with system error |

### Error Message Format
Always use: `(Step {n} ❌) {action} on "{selector}": {specific_error}`

Example: `(Step 3 ❌) click on "#submit-button": Element not visible after 5000ms`
```

### Phase 7: Appendix (Externalized Setup)

**Rationale**: Manual setup instructions are reference material, not execution instructions.

```markdown
## Appendix: Manual Setup Reference

> **Note**: This section is for human operators preparing the test environment.
> The LLM executor assumes the environment is already running.

### Option A: Bun Dev Server
```bash
cd app && bun run dev
# Serves at http://localhost:8000
```

### Option B: Static File Server
```bash
cd app/dist && npx serve -p 8080
```

### Verify Setup
1. Open browser to application_url
2. Confirm React Islands mount (check for interactive components)
3. Check browser console for errors
```

---

## Migration Checklist

- [ ] Create new file: `test_e2e_v2.md`
- [ ] Implement Output Contract section
- [ ] Implement Typed Inputs section
- [ ] Implement Derived Values section
- [ ] Implement Preconditions section
- [ ] Implement Execution Phases section
- [ ] Implement Error Taxonomy section
- [ ] Move setup to Appendix
- [ ] Test with 3 existing E2E test files
- [ ] Deprecate old file (rename to `ZEP-test_e2e.md`)
- [ ] Update any skills that reference `test_e2e`

---

## Expected Improvements

| Metric | Before | After |
|--------|--------|-------|
| Section count | 6 (unstructured) | 7 (purpose-ordered) |
| Redundant text | ~15 lines | 0 |
| Path construction mentions | 4 (scattered) | 1 (formula table) |
| Explicit error categories | 0 | 5 |
| Phase transitions | Implicit | Explicit with arrows |
| Output schema | End of file | Top of file |
| LLM checkpoint opportunities | 0 | 4 (per phase) |

---

## Files Concerned

| File | Role |
|------|------|
| [.claude/commands/test_e2e.md](.claude/commands/test_e2e.md) | Current skill (to be refactored) |
| [.claude/commands/resolve_failed_e2e_test.md](.claude/commands/resolve_failed_e2e_test.md) | Depends on test_e2e output format |
| [.claude/Documentation/e2e-test-specs/](.claude/Documentation/e2e-test-specs/) | Contains test files consumed by this skill |

---

## Appendix: Proposed Full Refactored File

See companion file: `20260203-test-e2e-refactored.md` (to be created upon approval)
