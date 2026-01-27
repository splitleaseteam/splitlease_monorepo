---
name: git-commits
description: |
  Standardized git commit message formatter. Use this skill to structure all git commits with:
  [hostname][type] commit message

  CRITICAL: ALWAYS run `hostname` command FIRST to get the current device name, then use that value in the commit message.

  This ensures consistent commit history and traceability across the team.

  Triggers: Any git commit operation, or when the user asks to "commit changes"
---

# Git Commits Skill

Structure all git commits with a standardized prefix format.

## ⚠️ MANDATORY: Get Hostname FIRST

**Before EVERY commit, run this command:**
```bash
hostname
```

**Then use the output value in your commit message format.**

## Commit Message Format

```
[<HOSTNAME>][<type>] <commit_message>
```

Where `<HOSTNAME>` is the **actual output** from running the `hostname` command.

### Components

| Component | Description | Source |
|-----------|-------------|--------|
| `<HOSTNAME>` | Current device name (e.g., SPLIT-LEASE-6) | **Run `hostname` command** |
| `<type>` | Conventional commit type | `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style` |
| `<commit_message>` | Clear, imperative description | Write based on changes made |

### Conventional Commit Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `chore` | Maintenance tasks (deps, config, tooling) |
| `refactor` | Code restructuring without behavior change |
| `test` | Adding or updating tests |
| `style` | Formatting, whitespace, linting |
| `perf` | Performance improvements |
| `revert` | Reverting previous commits |

## Usage Workflow

### STEP 1: Get Hostname (REQUIRED)

```bash
hostname
```

**Example output:** `SPLIT-LEASE-6`

### STEP 2: Create Commit with Dynamic Hostname

Use the hostname from Step 1 in your commit message:

```bash
# If hostname returned: SPLIT-LEASE-6

# Feature commit
git commit -m "[SPLIT-LEASE-6][feat] add proposal submission workflow"

# Bug fix
git commit -m "[SPLIT-LEASE-6][fix] resolve FK constraint error in listing updates"

# Documentation
git commit -m "[SPLIT-LEASE-6][docs] update CLAUDE.md with git-commits skill"

# Chore
git commit -m "[SPLIT-LEASE-6][chore] update dependencies to latest versions"
```

**Different device example:**
```bash
# If hostname returned: SPLIT-LEASE-2

git commit -m "[SPLIT-LEASE-2][feat] add user authentication"
```

## Multi-File Commits

For commits spanning multiple files, use a summary message with the actual hostname:

```bash
# STEP 1: Get hostname first
hostname
# Output: SPLIT-LEASE-6

# STEP 2: Use that hostname in the commit
git commit -m "[SPLIT-LEASE-6][feat] implement booking confirmation flow

- Add BookingConfirmation component
- Create useBookingConfirmation hook
- Update routes.config.js with new route
- Add booking confirmation edge function"
```

## Complete Workflow

**EVERY TIME you commit, follow these steps in order:**

1. **Run `hostname` command** to get current device name
2. **Capture the output** (e.g., `SPLIT-LEASE-6`)
3. **Determine commit type** based on changes (`feat`, `fix`, `docs`, etc.)
4. **Write clear, imperative commit message** describing the change
5. **Construct commit** using format: `[<hostname_output>][<type>] <message>`
6. **Use heredoc format** for multi-line commits or co-authoring

## Heredoc Format (Recommended for Multi-line)

**STEP 1: Get hostname**
```bash
hostname
# Output: SPLIT-LEASE-6
```

**STEP 2: Use in heredoc commit**
```bash
git commit -m "$(cat <<'EOF'
[SPLIT-LEASE-6][feat] implement user authentication

- Add login/signup components
- Create auth edge functions
- Update routing configuration

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**If on different device (e.g., SPLIT-LEASE-2):**
```bash
git commit -m "$(cat <<'EOF'
[SPLIT-LEASE-2][feat] implement user authentication

- Add login/signup components
- Create auth edge functions
- Update routing configuration

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

## Rules

- **MANDATORY: Run `hostname` before EVERY commit** - Never use a hardcoded or guessed hostname
- **Always** substitute the actual hostname output into the commit message
- Keep messages imperative and concise ("add" not "added")
- Never commit without the proper format: `[<HOSTNAME>][<type>] <message>`
- Co-author Claude on all commits (append co-author line)
- Use heredoc for commits with body text or co-authoring

## ⚠️ Common Mistake to Avoid

❌ **WRONG:** Assuming the hostname without checking
```bash
# Don't do this - never assume the hostname!
git commit -m "[SPLIT-LEASE-6][feat] add feature"
```

✅ **CORRECT:** Always run hostname first
```bash
# Step 1: Get actual hostname
hostname
# Output: SPLIT-LEASE-6

# Step 2: Use that output
git commit -m "[SPLIT-LEASE-6][feat] add feature"
```
