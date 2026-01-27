---
name: git-commits
description: |
  Standardized git commit message formatter. Use this skill to structure all git commits with:
  [hostname][type] commit message

  This ensures consistent commit history and traceability across the team.

  Triggers: Any git commit operation, or when the user asks to "commit changes"
---

# Git Commits Skill

Structure all git commits with a standardized prefix format.

## Commit Message Format

```
[<hostname>][<type>] <commit_message>
```

### Components

| Component | Description | Example |
|-----------|-------------|---------|
| `hostname` | Machine/device identifier | `SPLIT-LEASE-6` |
| `type` | Conventional commit type | `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style` |
| `commit_message` | Clear, imperative description | `add user authentication flow` |

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

## Usage

### Retrieve System Info

```bash
# Get hostname
hostname
```

### Commit Examples

```bash
# Feature commit
git commit -m "[SPLIT-LEASE-6][feat] add proposal submission workflow"

# Bug fix
git commit -m "[SPLIT-LEASE-6][fix] resolve FK constraint error in listing updates"

# Documentation
git commit -m "[SPLIT-LEASE-6][docs] update CLAUDE.md with git-commits skill"

# Chore
git commit -m "[SPLIT-LEASE-6][chore] update dependencies to latest versions"
```

## Multi-File Commits

For commits spanning multiple files, use a summary message:

```bash
git commit -m "[SPLIT-LEASE-6][feat] implement booking confirmation flow

- Add BookingConfirmation component
- Create useBookingConfirmation hook
- Update routes.config.js with new route
- Add booking confirmation edge function"
```

## Workflow Integration

**Before committing:**
1. Get hostname: `hostname`
2. Determine commit type based on changes
3. Write clear, imperative commit message
4. Use heredoc format for multi-line commits

## Heredoc Format (Recommended)

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

## Rules

- **Always** use the standardized prefix format
- Keep messages imperative and concise ("add" not "added")
- Never commit without the proper format
- Co-author Claude on all commits (append co-author line)
- Use heredoc for commits with body text or co-authoring
