# Git Regression Prevention & Deployment Integrity Plan

**Created**: 2026-02-06
**Updated**: 2026-02-06 (added shared-account amendments)
**Status**: PENDING → EXECUTING
**Classification**: BUILD + INFRASTRUCTURE
**Priority**: HIGH — Affects production deployment integrity

---

## Shared Account Context

The entire team uses a single GitHub account (`splitleaseteam@gmail.com` / `sl6-sharath`) for all pushes and pulls. This means:

- **All commits appear from the same author** — git history alone cannot distinguish who/what made a commit
- **`enforce_admins: true` is mandatory** — since the pushing account IS the admin, branch protection without this flag is toothless
- **Machine hostname is the only differentiator** — commit trailers with `Machine: <hostname>` provide attribution
- **`pull.rebase = false` must be enforced on every machine** — one misconfigured machine can silently rebase

---

## Problem Statement

Multiple actors (developers, Claude Code sessions) push directly to `main` without pull requests. Cloudflare Pages auto-deploys the latest commit on `main`. Current issues:

1. **Git rebase rewrites history** — Older commits can land "on top" of newer ones, deploying stale code
2. **Force pushes overwrite remote history** — Newer commits by other actors get erased
3. **No server-side enforcement** — GitHub branch protection is completely unconfigured (confirmed: HTTP 404)
4. **No fast-forward validation** — Nothing prevents diverged pushes
5. **No deployment verification** — No confirmation that the deployed commit is the intended one

---

## Current State Audit

### What EXISTS

| Layer | Status | Detail |
|-------|--------|--------|
| Claude Code deny rules | Active | `git push --force`, `git push -f`, `git rebase` denied in `.claude/settings.json` |
| Post-commit hook | Active | Counter only (`.git/hooks/post-commit`) — no safety function |
| Pre-push hook | **Inactive** | Sample file only (`.git/hooks/pre-push.sample`) |
| GitHub branch protection | **None** | No rules configured on `splitleaseteam/splitlease` main branch |
| Deployment verification | **None** | No post-push or post-deploy verification |

### What's MISSING

1. GitHub branch protection rules (server-side enforcement)
2. Active pre-push hook (client-side fast-forward validation)
3. Push discipline automation (fetch-before-push)
4. Deployment commit verification (post-push SHA check)
5. Regression detection (compare deployed vs intended)

---

## Implementation Plan

### Layer 1: GitHub Branch Protection (Server-Side — HIGHEST PRIORITY)

**Why first**: Server-side rules cannot be bypassed by any client. This is the single most impactful change.

**Action**: Configure branch protection on `main` via GitHub API:

```bash
gh api repos/splitleaseteam/splitlease/branches/main/protection \
  --method PUT \
  --field "required_status_checks=null" \
  --field "enforce_admins=true" \
  --field "required_pull_request_reviews=null" \
  --field "restrictions=null" \
  --field "allow_force_pushes=false" \
  --field "allow_deletions=false" \
  --field "block_creations=false" \
  --field "required_linear_history=false" \
  --field "lock_branch=false" \
  --field "allow_fork_syncing=false"
```

**Key settings**:
- `allow_force_pushes: false` — **Blocks all force pushes at the server level**
- `allow_deletions: false` — Prevents accidental branch deletion
- `enforce_admins: true` — **MANDATORY for shared account** — without this, the single account bypasses its own rules
- `required_pull_request_reviews: null` — No PR requirement (preserves current workflow)
- `required_linear_history: false` — Allow merge commits (matches your merge-only strategy)

**Verification**: After applying, confirm with:
```bash
gh api repos/splitleaseteam/splitlease/branches/main/protection
```

---

### Layer 2: Pre-Push Hook (Client-Side Fast-Forward Validation)

**File**: `.git/hooks/pre-push`

**Purpose**: Before any push, verify that:
1. The push is a fast-forward (local branch is ahead of remote, not diverged)
2. No commits in local history rewrite remote history
3. Alert and abort if push would cause regression

**Logic**:
```
1. Fetch remote main (quiet)
2. Check if local HEAD is a descendant of origin/main
3. If NOT a descendant → ABORT push with clear error message
4. If descendant → allow push
```

**Important**: This hook must be copied to each developer's machine (git hooks are local). Consider using a setup script or `core.hooksPath` configuration.

**Portability note**: Since this is a Windows (PowerShell) environment, the hook should use `#!/bin/sh` (Git for Windows provides sh) or be written as a PowerShell script with git config pointing to it.

---

### Layer 3: Claude Code Hook Enhancement

**Current state**: `.claude/settings.json` already denies `git push --force`, `git push -f`, `git rebase`.

**Enhancements**:

1. **Add `PreToolUse` hook for git commands** — Intercept and validate git push commands before execution
2. **Enforce fetch-before-push discipline** — A hook that runs before any `git push` and:
   - Runs `git fetch origin main`
   - Checks if local is fast-forward of remote
   - Blocks the push if not, with instructions to merge first

**Implementation**: Add to `.claude/settings.json` hooks section:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python \".claude\\hooks\\git_push_guard.py\"",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
```

**New file**: `.claude/hooks/git_push_guard.py`
- Reads the Bash command from stdin (Claude hook input)
- If command contains `git push`:
  - Runs `git fetch origin main`
  - Checks `git merge-base --is-ancestor origin/main HEAD`
  - If NOT ancestor → output error JSON with `{"decision": "block", "reason": "..."}`
  - If ancestor → output `{"decision": "allow"}`
- If command does NOT contain `git push` → pass through

---

### Layer 4: Push Discipline Protocol (Documentation + Automation)

**Standard push sequence** (to be documented and enforced):

```
Step 1: git fetch origin main
Step 2: git merge origin/main          # NEVER rebase
Step 3: [resolve conflicts if any]
Step 4: git push origin main           # Will succeed as fast-forward
```

**If push is rejected** (non-fast-forward):
```
Step 1: git fetch origin main
Step 2: git merge origin/main
Step 3: [resolve conflicts]
Step 4: git add . && git commit
Step 5: git push origin main
```

**NEVER**:
- `git push --force`
- `git push --force-with-lease` (still rewrites history)
- `git rebase origin/main`
- `git pull --rebase`

**Implementation**:
- Add to CLAUDE.md as a mandatory push protocol
- The pre-push hook (Layer 2) enforces this automatically

---

### Layer 5: Deployment Verification (Post-Push)

**Purpose**: After each push, verify that Cloudflare Pages will deploy the correct commit.

**Option A: Post-push verification script**
- After `git push`, immediately run:
  ```bash
  git ls-remote origin main
  ```
- Compare the remote HEAD SHA with the local HEAD SHA
- If they match → deployment will be correct
- If they don't match → someone else pushed between your push and verification (race condition alert)

**Option B: Slack notification with deployed commit**
- Extend the existing Slack notifier to include commit SHA on every push
- Format: `Pushed {SHA} to main — deployment expected`
- Team can visually verify the latest notification matches their expectation

**Option C: Cloudflare Pages deployment hook** (most robust)
- Configure a Cloudflare Pages deployment webhook
- On deployment completion, send the deployed commit SHA to Slack
- Compare against the latest push notification
- If mismatch → alert the team

**Recommended**: Start with Option A + B (immediate, no external config needed). Add Option C later for full automation.

---

### Layer 6: Machine Attribution via Commit-Msg Hook

**Why**: All commits share the same `user.name` and `user.email`. Without attribution, there is no way to trace which machine or session produced a given commit after the fact.

**File**: `.git/hooks/commit-msg`

**Purpose**: Automatically append a `Machine: <hostname>` trailer to every commit message. This embeds attribution directly in git history without changing the author identity.

**Logic**:
```
1. Read the commit message file ($1)
2. Check if a "Machine:" trailer already exists (avoid duplicates)
3. If not present, append: "Machine: <COMPUTERNAME>"
4. Write back to the commit message file
```

**Example output**:
```
fix: resolve proposal sync timing issue

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
Machine: DESKTOP-SL8MAIN
```

**Benefits**:
- Every commit in `git log` shows which machine produced it
- Works retroactively for debugging — `git log --grep="Machine: DESKTOP-XYZ"` finds all commits from a specific machine
- No git config changes needed per machine — the hook reads the hostname at commit time
- Compatible with the existing `post-commit` counter hook

**Important**: Like the pre-push hook, this must exist on every machine. Consider using `core.hooksPath` pointing to a versioned hooks directory.

---

## Implementation Sequence

| Phase | Layer | Action | Effort | Impact |
|-------|-------|--------|--------|--------|
| 1 | Layer 1 | GitHub branch protection via `gh api` | 5 min | **CRITICAL** — blocks force pushes server-side |
| 2 | Layer 2 | Create `.git/hooks/pre-push` | 15 min | HIGH — prevents diverged pushes locally |
| 3 | Layer 3 | Create `.claude/hooks/git_push_guard.py` + update settings | 20 min | HIGH — Claude-specific enforcement |
| 4 | Layer 4 | Update CLAUDE.md with push protocol | 5 min | MEDIUM — documentation + awareness |
| 5 | Layer 5 | Add post-push SHA verification to push guard | 10 min | MEDIUM — deployment confidence |
| 6 | Layer 6 | Create `.git/hooks/commit-msg` for machine attribution | 10 min | HIGH — traceability for shared account |

**Total estimated effort**: ~65 minutes

---

## Files to Create

| File | Purpose |
|------|---------|
| `.git/hooks/pre-push` | Fast-forward validation hook (client-side) |
| `.git/hooks/commit-msg` | Machine hostname attribution trailer hook |
| `.claude/hooks/git_push_guard.py` | Claude Code PreToolUse hook for git push interception |

## Files to Modify

| File | Change |
|------|--------|
| `.claude/settings.json` | Add PreToolUse hook configuration for git push guard |
| `.claude/CLAUDE.md` | Add mandatory push protocol to Rules section |

## External Configuration

| Target | Change |
|--------|--------|
| GitHub `main` branch | Enable branch protection rules (via `gh api`) |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Pre-push hook slows down pushes | Fetch is fast; adds ~2-3 seconds |
| Hook not present on new clones | Document in setup instructions; consider `core.hooksPath` |
| Branch protection blocks legitimate operations | Settings are permissive (no PR required, no status checks) — only blocks force push + deletion |
| Race condition between concurrent pushers | Git's built-in fast-forward check handles this; second pusher must merge first |
| Windows compatibility of shell hooks | Git for Windows provides `sh`; alternatively use Python for hooks |

---

## Success Criteria

1. `git push --force` is blocked at both GitHub (server) and local (hook + Claude deny rule) levels
2. `git rebase` is blocked at Claude level (already done) and documented as prohibited
3. Every push to `main` is a fast-forward merge — no history rewriting
4. The latest commit on `main` is always the chronologically newest change
5. Team has visibility into which commit SHA is deployed after each push
6. Every commit contains a `Machine: <hostname>` trailer for attribution
7. `pull.rebase = false` is documented as mandatory for all team machines
