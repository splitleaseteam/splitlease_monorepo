---
name: git-commits
description: |
  Standardized git commit message formatter. Use this skill to structure all git commits with:
  [SL-X][type] commit message

  Where X is the ticket/issue number being worked on.

  This ensures consistent commit history and traceability across the team.

  Triggers: Any git commit operation, or when the user asks to "commit changes"
---

# Git Commits Skill

Structure all git commits with a standardized prefix format.

## Commit Message Format

```
[SL-<ticket_number>][<type>] <commit_message>
```

Where `<ticket_number>` is the issue/ticket number being worked on (e.g., 3, 42, 100).

### Components

| Component | Description | Source |
|-----------|-------------|--------|
| `SL-<ticket_number>` | Ticket/issue reference (e.g., SL-3, SL-42) | From current task or user context |
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

## Usage Examples

```bash
# Feature commit (working on ticket SL-3)
git commit -m "[SL-3][feat] add proposal submission workflow"

# Bug fix (working on ticket SL-42)
git commit -m "[SL-42][fix] resolve FK constraint error in listing updates"

# Documentation (working on ticket SL-3)
git commit -m "[SL-3][docs] update CLAUDE.md with git-commits skill"

# Chore (working on ticket SL-100)
git commit -m "[SL-100][chore] update dependencies to latest versions"
```

## Multi-File Commits

For commits spanning multiple files, use a summary message with bullet points:

```bash
git commit -m "[SL-3][feat] implement booking confirmation flow

- Add BookingConfirmation component
- Create useBookingConfirmation hook
- Update routes.config.js with new route
- Add booking confirmation edge function"
```

## Complete Workflow

**EVERY TIME you commit, follow these steps in order:**

### Step 0: Sanitize Query Logs (MANDATORY)

Before staging any files, run the log sanitizer to redact sensitive data:

```powershell
# Run sanitization (from project root)
powershell -ExecutionPolicy Bypass -File .claude/scripts/sanitize-query-logs.ps1

# Or with verbose output to see what was sanitized
powershell -ExecutionPolicy Bypass -File .claude/scripts/sanitize-query-logs.ps1 -Verbose

# Dry run to preview without changes
powershell -ExecutionPolicy Bypass -File .claude/scripts/sanitize-query-logs.ps1 -DryRun
```

**What gets sanitized:**
| Pattern | Replacement |
|---------|-------------|
| Slack webhook URLs | `https://hooks.slack.com/services/REDACTED/REDACTED/REDACTED` |
| Gmail addresses | `redacted@example.com` |
| API keys (sk-*, key_*) | `REDACTED_API_KEY` |
| Bearer tokens | `Bearer REDACTED_TOKEN` |
| JWT tokens (eyJ...) | `REDACTED_JWT_TOKEN` |

### Step 1-5: Standard Commit Flow

1. **Identify the ticket number** from the current task context (e.g., SL-3)
2. **Determine commit type** based on changes (`feat`, `fix`, `docs`, etc.)
3. **Write clear, imperative commit message** describing the change
4. **Construct commit** using format: `[SL-<ticket>][<type>] <message>`
5. **Use heredoc format** for multi-line commits or co-authoring

## Heredoc Format (Recommended for Multi-line)

```bash
git commit -m "$(cat <<'EOF'
[SL-3][feat] implement user authentication

- Add login/signup components
- Create auth edge functions
- Update routing configuration

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Rules

- **Always use ticket number** from the current task context
- Keep messages imperative and concise ("add" not "added")
- Never commit without the proper format: `[SL-X][<type>] <message>`
- Co-author Claude on all commits (append co-author line)
- Use heredoc for commits with body text or co-authoring
- If no ticket number is available, ask the user or use `[SL-0]` for general maintenance
