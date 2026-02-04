# Video Bug Hunt Analyzer

**Orchestrator skill for analyzing Loom bug hunt videos and generating fix plans.**

## Purpose

Watches a Loom video where bugs are demonstrated and explained, extracts all reported issues, categorizes them by priority and impact, explores the codebase for context, and generates a comprehensive plan for another agent to fix and retest the issues.

## Usage

```bash
/video-bug-hunt <loom-url>
```

Or with transcript file:

```bash
/video-bug-hunt <loom-url> --transcript <path-to-transcript.txt>
```

## What This Skill Does

### Phase 1: Video & Transcript Analysis (15-20 min)
1. **Navigate to Loom video** using Playwright MCP
2. **Extract transcript** (auto-detect or use provided file)
3. **Analyze video content** to identify:
   - All bugs mentioned or demonstrated
   - Timestamps for each bug
   - Visual evidence (take screenshots if needed)
   - Expected vs actual behavior

### Phase 2: Bug Categorization (10-15 min)
4. **Categorize each bug** by:
   - **Priority:** HIGH / MEDIUM / LOW
   - **Impact:** CRITICAL / HIGH / MEDIUM / LOW
   - **Type:** Functional / UI/UX / Performance / Data / Security
   - **Component:** Which part of the system (Frontend/Backend/Database)
   - **Estimated Fix Time:** Quick (<30min) / Medium (30-60min) / Complex (>60min)

### Phase 3: Codebase Exploration (20-30 min)
5. **Explore codebase** for each bug:
   - Search for related files (components, functions, Edge Functions)
   - Identify likely root causes
   - Check for similar patterns in other areas
   - Review recent changes that might have introduced the bug

### Phase 4: Fix Proposal Generation (15-20 min)
6. **Generate fix proposals** for each bug:
   - Root cause analysis
   - Proposed solution with code snippets
   - Files to modify
   - Testing strategy
   - Potential side effects / regression risks

### Phase 5: Plan Generation (10 min)
7. **Create comprehensive fix plan**:
   - Prioritized bug list with HIGH → MEDIUM → LOW order
   - Step-by-step fix instructions for each bug
   - Test scenarios to verify fixes
   - Rollback plan if fixes cause issues
   - Estimated total time to complete

## Output

Creates a markdown file in `.claude/plans/New/` with format:

```
[YYYYMMDD-HHMMSS]-video-bug-hunt-plan.md
```

Contains:
- **Executive Summary**: Bug count by priority/impact
- **High Priority Bugs**: Critical issues blocking core functionality
- **Medium Priority Bugs**: Important but not blocking
- **Low Priority Bugs**: UX improvements and minor issues
- **Bug Details**: For each bug:
  - Description
  - Steps to reproduce
  - Expected vs actual behavior
  - Root cause analysis
  - Proposed fix with code examples
  - Files to modify
  - Testing strategy
- **Implementation Timeline**: Recommended fix order
- **Risk Assessment**: Potential regressions

## Example

```bash
# Analyze a Loom video with bug demonstrations
/video-bug-hunt https://www.loom.com/share/abc123xyz

# With pre-downloaded transcript
/video-bug-hunt https://www.loom.com/share/abc123xyz --transcript ./bug-hunt-transcript.txt
```

## Implementation Strategy

This skill orchestrates multiple specialized agents:

1. **video-transcript-extractor** (Haiku) - Fast transcript extraction
2. **bug-analyzer** (Opus) - Deep analysis of bugs from transcript
3. **codebase-explorer** (Sonnet) - Fast codebase search for context
4. **fix-proposer** (Opus) - Generate detailed fix proposals
5. **plan-generator** (Sonnet) - Compile final plan document

## Requirements

- Playwright MCP server (for video access)
- Access to codebase (for exploration)
- OpenAI API (optional, for transcript extraction if needed)

## Notes

- Does NOT fix bugs (only creates the plan)
- Another agent/skill should execute the plan
- Plan includes retest strategy for each fix
- Categorization helps prioritize work
- Codebase exploration is superficial (grep/glob, not deep analysis)
