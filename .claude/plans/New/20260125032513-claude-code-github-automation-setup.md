# Implementation Plan: Claude Code GitHub Automation Setup

## Overview

This plan provides a comprehensive guide for enhancing the existing Claude Code GitHub automation setup on the Split Lease repository. The repository already has basic workflow files in place; this plan focuses on optimizing them, adding missing configurations, and ensuring proper integration with the project's existing CLAUDE.md guidelines.

## Success Criteria

- [ ] Anthropic API key or OAuth token configured in GitHub Secrets
- [ ] Claude GitHub App installed on the repository
- [ ] Workflow files optimized with path filtering and cost controls
- [ ] CLAUDE.md enhanced with GitHub automation context
- [ ] PR-based code review automation working
- [ ] @claude mention response system working
- [ ] Issue assignment automation working
- [ ] Test commit/PR successfully triggers automation

---

## Context & References

### Current State Analysis

The repository already has two workflow files:

| File | Purpose | Status |
|------|---------|--------|
| `.github/workflows/claude-code-review.yml` | PR code review automation | Exists - needs optimization |
| `.github/workflows/claude.yml` | @claude mention responses | Exists - needs optimization |

**Key Findings:**
1. Both workflows currently use `CLAUDE_CODE_OAUTH_TOKEN` for authentication
2. Path filters are commented out (all files trigger reviews)
3. No cost optimization controls in place (no `--max-turns` limit)
4. Tool allowlist is limited to `gh` commands only
5. Missing model specification (defaults to whatever Claude defaults to)

### Relevant Files

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `.github/workflows/claude-code-review.yml` | PR review automation | Add path filters, cost controls, model spec |
| `.github/workflows/claude.yml` | @claude mentions | Add permissions, cost controls |
| `.claude/CLAUDE.md` | Project guidelines | Add GitHub automation section |
| `.github/CODEOWNERS` | Code ownership | Create for PR review routing |

### Related Documentation

- [Official Setup Guide](https://github.com/anthropics/claude-code-action/blob/main/docs/setup.md)
- [Usage Documentation](https://github.com/anthropics/claude-code-action/blob/main/docs/usage.md)
- [Claude Code Docs](https://code.claude.com/docs/en/github-actions)

### Existing Patterns to Follow

1. **Action-Based Pattern**: The project uses `{ action, payload }` pattern for Edge Functions; maintain similar explicit structure
2. **Documentation Hierarchy**: miniCLAUDE.md for simple tasks, largeCLAUDE.md for complex
3. **Commit Conventions**: Present tense, 50 chars or less, descriptive

---

## Implementation Steps

### Step 1: Configure GitHub Secrets

**Location:** GitHub Repository Settings
**Purpose:** Add required authentication secrets for the Claude Code Action

**Details:**

Navigate to: `https://github.com/splitleaseteam/splitlease/settings/secrets/actions`

Add one of the following secret configurations:

**Option A: API Key Authentication (Recommended for Teams)**
```
Secret Name: ANTHROPIC_API_KEY
Value: sk-ant-api03-... (your Anthropic API key from console.anthropic.com)
```

**Option B: OAuth Token Authentication (For Pro/Max Users)**
```
Secret Name: CLAUDE_CODE_OAUTH_TOKEN
Value: (generated via `claude setup-token` command locally)
```

**Note:** The existing workflows use `CLAUDE_CODE_OAUTH_TOKEN`. If switching to API key, update workflows accordingly.

**Validation:**
- Go to Settings > Secrets and variables > Actions
- Verify secret is listed (value will be hidden)

---

### Step 2: Install Claude GitHub App

**Location:** GitHub Marketplace
**Purpose:** Enable Claude to interact with PRs and issues

**Details:**

1. Visit: https://github.com/apps/claude
2. Click "Install" or "Configure"
3. Select the `splitleaseteam/splitlease` repository
4. Grant required permissions:
   - Repository contents: Read & Write
   - Issues: Read & Write
   - Pull requests: Read & Write

**Validation:**
- Go to repository Settings > Integrations > GitHub Apps
- Verify "Claude" app is listed and configured

---

### Step 3: Update PR Review Workflow (Cost-Optimized)

**Files:** `.github/workflows/claude-code-review.yml`
**Purpose:** Optimize the existing PR review workflow with path filters, cost controls, and project-specific prompts

**Replace the entire file with:**

```yaml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize]
    paths:
      # Frontend source files
      - 'app/src/**/*.js'
      - 'app/src/**/*.jsx'
      - 'app/src/**/*.ts'
      - 'app/src/**/*.tsx'
      - 'app/src/**/*.css'
      # Supabase Edge Functions
      - 'supabase/functions/**/*.ts'
      # Configuration files
      - 'app/vite.config.js'
      - 'app/eslint.config.js'
      - 'supabase/functions/deno.json'
      # Ignore documentation-only changes
      - '!**/*.md'
      - '!.claude/**'

# Prevent concurrent reviews for the same PR
concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  claude-review:
    # Optional: Skip reviews for dependabot or renovate
    if: |
      github.actor != 'dependabot[bot]' &&
      github.actor != 'renovate[bot]'

    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: read
      id-token: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for better context

      - name: Run Claude Code Review
        id: claude-review
        uses: anthropics/claude-code-action@v1
        with:
          # Authentication (use one of these)
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          # anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}
            PR TITLE: ${{ github.event.pull_request.title }}

            ## Review Instructions

            Review this pull request following the project's established patterns documented in CLAUDE.md.

            Focus your review on:

            ### Code Quality
            - Adherence to Islands Architecture (each page is independent React root)
            - Hollow Component pattern (pages delegate to useXxxPageLogic hooks)
            - Four-Layer Logic separation (calculators -> rules -> processors -> workflows)
            - No fallback mechanisms or over-engineering

            ### Technical Concerns
            - Day indexing: JavaScript uses 0-6, Bubble API uses 1-7 (convert at boundaries)
            - Edge Functions use { action, payload } pattern
            - Database updates should only send changed fields (FK constraint prevention)
            - No API keys exposed in frontend code

            ### Security
            - Sensitive data handling
            - Authentication/authorization checks
            - Input validation

            ### Performance
            - Unnecessary re-renders in React components
            - Efficient data fetching patterns

            Use `gh pr comment` via Bash tool to post your review as a comment on the PR.
            Be constructive and specific. Reference line numbers when possible.

          claude_args: |
            --max-turns 8
            --model claude-sonnet-4-20250514
            --allowedTools "Bash(gh pr comment:*),Bash(gh pr view:*),Bash(gh pr diff:*),Read,Grep,Glob"
```

**Key Changes:**
- Added comprehensive path filters for source files
- Added concurrency control to prevent duplicate reviews
- Limited to 8 turns for cost optimization
- Specified model explicitly
- Enhanced tool allowlist with Read, Grep, Glob for better analysis
- Project-specific review instructions based on CLAUDE.md patterns

**Validation:**
- Create a test branch with a simple change to `app/src/`
- Open a PR to trigger the workflow
- Verify review comment appears on PR

---

### Step 4: Update @claude Mention Workflow

**Files:** `.github/workflows/claude.yml`
**Purpose:** Optimize the @claude mention handler with additional triggers and permissions

**Replace the entire file with:**

```yaml
name: Claude Code

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  pull_request_review:
    types: [submitted]
  issues:
    types: [opened, assigned, labeled]

# Prevent concurrent responses on the same issue/PR
concurrency:
  group: claude-${{ github.event.issue.number || github.event.pull_request.number }}-${{ github.event.comment.id || github.run_id }}
  cancel-in-progress: false

jobs:
  claude:
    # Trigger conditions
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude')) ||
      (github.event_name == 'issues' && github.event.action == 'assigned' && github.event.assignee.login == 'claude') ||
      (github.event_name == 'issues' && github.event.action == 'labeled' && github.event.label.name == 'claude') ||
      (github.event_name == 'issues' && github.event.action == 'opened' && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')))

    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read  # Required for Claude to read CI results

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Claude Code
        id: claude
        uses: anthropics/claude-code-action@v1
        with:
          # Authentication (use one of these)
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          # anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

          # Allow Claude to read CI results
          additional_permissions: |
            actions: read

          # Control execution
          claude_args: |
            --max-turns 15
            --model claude-sonnet-4-20250514

          # Trigger configuration
          trigger_phrase: "@claude"
          assignee_trigger: "claude"
          label_trigger: "claude"

          # Allow specific bots to interact
          allowed_bots: "dependabot[bot],github-actions[bot]"
```

**Key Changes:**
- Added issue assignment trigger (`assignee_trigger: "claude"`)
- Added label trigger (`label_trigger: "claude"`)
- Increased max turns to 15 for interactive sessions
- Added `contents: write` permission for code changes
- Enabled CI result reading
- Added concurrency control

**Validation:**
- Create a test issue with "@claude can you explain the project structure?"
- Verify Claude responds to the issue

---

### Step 5: Create Issue Triage Workflow (Optional Enhancement)

**Files:** `.github/workflows/claude-issue-triage.yml`
**Purpose:** Auto-triage new issues by analyzing and suggesting labels

**Create new file:**

```yaml
name: Claude Issue Triage

on:
  issues:
    types: [opened]

jobs:
  triage:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Triage Issue with Claude
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          # anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

          prompt: |
            REPO: ${{ github.repository }}
            ISSUE NUMBER: ${{ github.event.issue.number }}
            ISSUE TITLE: ${{ github.event.issue.title }}
            ISSUE BODY: ${{ github.event.issue.body }}

            Analyze this issue and:
            1. Determine the type: bug, feature, chore, question, or documentation
            2. Identify affected areas: frontend, backend, database, auth, or infrastructure
            3. Estimate complexity: low, medium, or high

            Use `gh issue edit` to add appropriate labels.
            Use `gh issue comment` to post a brief acknowledgment with:
            - Classification summary
            - Suggested next steps
            - Relevant documentation links if applicable

          claude_args: |
            --max-turns 3
            --model claude-sonnet-4-20250514
            --allowedTools "Bash(gh issue edit:*),Bash(gh issue comment:*),Bash(gh issue view:*),Read"
```

**Validation:**
- Create a test issue describing a bug
- Verify Claude adds labels and posts triage comment

---

### Step 6: Create CODEOWNERS File

**Files:** `.github/CODEOWNERS`
**Purpose:** Define code ownership for automated review assignments

**Create new file:**

```
# Split Lease Code Owners
# These owners will be requested for review when someone opens a pull request

# Default owners for everything
* @splitleaseteam/core

# Frontend (React, Vite)
/app/ @splitleaseteam/frontend

# Supabase Edge Functions
/supabase/functions/ @splitleaseteam/backend

# Database & Migrations
/supabase/migrations/ @splitleaseteam/backend

# Documentation
/.claude/ @splitleaseteam/core
/Documentation/ @splitleaseteam/core

# Critical configuration
/app/vite.config.js @splitleaseteam/core
/app/src/routes.config.js @splitleaseteam/core
```

**Note:** Adjust team names (`@splitleaseteam/core`, etc.) based on actual GitHub team structure. If teams don't exist, use individual usernames.

**Validation:**
- Open a PR modifying files in different directories
- Verify correct reviewers are requested

---

### Step 7: Update CLAUDE.md for GitHub Automation Context

**Files:** `.claude/CLAUDE.md`
**Purpose:** Add section for GitHub automation behavior guidelines

**Add the following section after the "MCP Servers" section:**

```markdown
---

## GitHub Automation

Claude Code is integrated with this repository via GitHub Actions for automated code review and interactive assistance.

### Available Triggers

| Trigger | How to Use | What Happens |
|---------|------------|--------------|
| **PR Review** | Open/update a PR with code changes | Automatic review comment on PR |
| **@claude mention** | Comment `@claude <question>` on any issue/PR | Claude responds to the question |
| **Issue assignment** | Assign issue to `claude` | Claude analyzes and responds |
| **Label trigger** | Add `claude` label to issue | Claude analyzes and responds |

### What Claude Can Do in GitHub

- **Read**: Repository files, PR diffs, issue content, CI logs
- **Comment**: Post reviews, respond to questions, provide explanations
- **Analyze**: Code quality, security concerns, performance issues
- **Suggest**: Improvements, refactoring opportunities, documentation updates

### What Claude Cannot Do in GitHub (by design)

- Push commits directly (requires human approval)
- Merge PRs
- Delete branches
- Modify repository settings
- Access external services beyond the repository

### Review Guidelines for Claude

When reviewing PRs, Claude will check for:
1. Adherence to Islands Architecture and Hollow Component patterns
2. Four-Layer Logic separation (calculators, rules, processors, workflows)
3. Day indexing correctness (JS 0-6 vs Bubble 1-7)
4. Database update patterns (changed fields only)
5. Security concerns (no exposed API keys, proper auth checks)
6. Performance considerations (re-renders, data fetching)

### Interacting with Claude on GitHub

**Ask questions:**
```
@claude What does this function do and how could we improve it?
```

**Request explanations:**
```
@claude Can you explain the data flow in this component?
```

**Get implementation suggestions:**
```
@claude How should I implement feature X following our patterns?
```

**Review specific concerns:**
```
@claude Please check this PR for potential security issues
```
```

**Location in file:** Insert after line ~50 (after MCP Servers section)

**Validation:**
- Read the updated CLAUDE.md
- Verify section is well-formatted and accurate

---

### Step 8: Test the Complete Setup

**Purpose:** Validate all workflows are functioning correctly

**Test Plan:**

#### Test 1: PR Review Automation
1. Create a new branch: `git checkout -b test/claude-automation`
2. Make a small change to `app/src/lib/auth.js` (add a comment)
3. Commit and push: `git commit -m "test: validate Claude PR review"`
4. Open a PR against `main`
5. Wait for Claude to post a review comment (typically 1-3 minutes)
6. **Expected:** Review comment appears with code quality feedback

#### Test 2: @claude Mention Response
1. On the test PR, comment: `@claude Can you explain what changes this PR makes?`
2. Wait for Claude to respond (typically 1-2 minutes)
3. **Expected:** Claude responds with analysis of the changes

#### Test 3: Issue Assignment Trigger
1. Create a new issue: "Test: Claude Issue Analysis"
2. In issue body: "This is a test issue to validate Claude automation"
3. Assign the issue to `claude` user (or add `claude` label)
4. Wait for response
5. **Expected:** Claude responds with issue analysis

#### Test 4: Path Filtering
1. Create a branch with only documentation changes (modify a `.md` file)
2. Open a PR
3. **Expected:** Claude review workflow should NOT trigger (filtered out)

**Cleanup:**
- Close test PR without merging
- Close test issue
- Delete test branch

---

## Edge Cases & Error Handling

### Authentication Failures
- **Symptom:** Workflow fails with "unauthorized" error
- **Resolution:** Verify secret is correctly named and has valid value

### Rate Limiting
- **Symptom:** Workflow fails with rate limit error
- **Resolution:** Workflows have concurrency controls; wait and retry

### Path Filter Misses
- **Symptom:** Review not triggered for expected files
- **Resolution:** Check path patterns in workflow; adjust as needed

### Claude Response Too Long
- **Symptom:** Comment truncated or workflow times out
- **Resolution:** Reduce `--max-turns` or simplify prompt

---

## Testing Considerations

1. **Always test in a branch first** - Never test directly on main
2. **Monitor Actions tab** - Watch workflow runs for errors
3. **Check API usage** - Monitor Anthropic console for unexpected costs
4. **Verify permissions** - Ensure GitHub App has required access

---

## Rollback Strategy

### If PR Review Causes Issues
1. Temporarily disable by commenting out `on:` trigger in workflow
2. Investigate logs in Actions tab
3. Re-enable after fixing

### If @claude Mentions Cause Issues
1. Remove `claude` from assignees/labels that trigger
2. Comment out `issue_comment` trigger temporarily
3. Investigate and fix

### Complete Rollback
1. Delete workflow files from `.github/workflows/`
2. Uninstall Claude GitHub App from repository settings
3. Remove secrets (optional, they're harmless if app is uninstalled)

---

## Dependencies & Blockers

### Prerequisites
- [x] GitHub repository exists (splitleaseteam/splitlease)
- [x] GitHub Actions enabled on repository
- [ ] Valid Anthropic API key or OAuth token
- [ ] Claude GitHub App installation access

### External Dependencies
- Anthropic API availability
- GitHub Actions service availability
- Claude GitHub App service availability

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API key exposure | Low | High | Use GitHub Secrets; never commit keys |
| Unexpected API costs | Medium | Medium | Max turns limits; path filtering |
| Incorrect review comments | Medium | Low | Human review still required; Claude is advisory |
| Workflow failures | Low | Low | Concurrency controls; error handling |
| Rate limiting | Low | Low | Concurrency groups prevent spam |

---

## Cost Estimation

Based on workflow configuration:

| Workflow | Estimated Tokens/Run | Estimated Cost/Run |
|----------|---------------------|-------------------|
| PR Review | ~10,000-30,000 | ~$0.03-0.09 |
| @claude Response | ~5,000-20,000 | ~$0.015-0.06 |
| Issue Triage | ~2,000-5,000 | ~$0.006-0.015 |

**Monthly estimate (assuming 50 PRs, 20 @mentions, 30 issues):**
- Low end: ~$2-3/month
- High end: ~$8-10/month

---

## Summary of Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/claude-code-review.yml` | **Modify** | Optimize with path filters and cost controls |
| `.github/workflows/claude.yml` | **Modify** | Add triggers and permissions |
| `.github/workflows/claude-issue-triage.yml` | **Create** | New auto-triage workflow |
| `.github/CODEOWNERS` | **Create** | Define code ownership |
| `.claude/CLAUDE.md` | **Modify** | Add GitHub automation section |

---

## Referenced Files

### Existing Files (to be modified)
- `c:\Users\Split Lease\Documents\Split Lease - Team\.github\workflows\claude-code-review.yml`
- `c:\Users\Split Lease\Documents\Split Lease - Team\.github\workflows\claude.yml`
- `c:\Users\Split Lease\Documents\Split Lease - Team\.claude\CLAUDE.md`

### Files to Create
- `c:\Users\Split Lease\Documents\Split Lease - Team\.github\workflows\claude-issue-triage.yml`
- `c:\Users\Split Lease\Documents\Split Lease - Team\.github\CODEOWNERS`

### Reference Documentation
- `c:\Users\Split Lease\Documents\Split Lease - Team\.claude\Documentation\miniCLAUDE.md`
- `c:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\commands\review.md`
- `c:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\commands\pull_request.md`
- `c:\Users\Split Lease\Documents\Split Lease - Team\.claude\commands\commands\commit.md`

### External References
- https://github.com/anthropics/claude-code-action
- https://code.claude.com/docs/en/github-actions
- https://github.com/anthropics/claude-code-action/blob/main/docs/setup.md
- https://github.com/anthropics/claude-code-action/blob/main/docs/usage.md
