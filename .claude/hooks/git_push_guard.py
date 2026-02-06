#!/usr/bin/env python3
"""
Git Push Guard — Claude Code PreToolUse Hook
Intercepts Bash tool calls containing 'git push' and validates
that the push is a fast-forward before allowing it to proceed.

Also enforces fetch-before-push discipline.
"""
import json
import sys
import subprocess
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent


def log_debug(message):
    """Log debug messages for troubleshooting"""
    log_path = Path(__file__).parent / 'git_push_guard.log'
    from datetime import datetime
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write(f"{datetime.now().isoformat()} - {message}\n")


def is_git_push_command(command):
    """Check if the Bash command contains a git push"""
    if not command:
        return False
    # Match 'git push' anywhere in the command string
    normalized = command.strip().lower()
    return 'git push' in normalized


def check_fast_forward():
    """
    Verify that local HEAD is a fast-forward of origin/main.
    Returns (is_fast_forward: bool, reason: str)
    """
    try:
        # Fetch latest remote state
        fetch_result = subprocess.run(
            ['git', 'fetch', 'origin', 'main', '--quiet'],
            capture_output=True, text=True, timeout=15,
            cwd=PROJECT_ROOT
        )

        if fetch_result.returncode != 0:
            return True, "Could not fetch origin/main — allowing push (may be first push)"

        # Check if origin/main is an ancestor of HEAD
        ancestor_check = subprocess.run(
            ['git', 'merge-base', '--is-ancestor', 'origin/main', 'HEAD'],
            capture_output=True, text=True, timeout=10,
            cwd=PROJECT_ROOT
        )

        if ancestor_check.returncode == 0:
            return True, "Fast-forward confirmed: HEAD is descendant of origin/main"
        else:
            return False, (
                "BLOCKED: Local branch has diverged from origin/main. "
                "This push would rewrite remote history. "
                "Run: git fetch origin main && git merge origin/main — then push again."
            )

    except subprocess.TimeoutExpired:
        return True, "Git command timed out — allowing push"
    except Exception as e:
        log_debug(f"Error in fast-forward check: {e}")
        return True, f"Error during check: {e} — allowing push"


def main():
    try:
        # Read hook input from stdin
        input_data = json.load(sys.stdin)

        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})

        # Only intercept Bash tool calls
        if tool_name != 'Bash':
            return

        command = tool_input.get('command', '')

        # Only intercept git push commands
        if not is_git_push_command(command):
            return

        log_debug(f"Intercepted git push command: {command[:100]}")

        # Block force push variants (defense in depth — settings.json also blocks these)
        lower_command = command.lower()
        if '--force' in lower_command or ' -f ' in lower_command or lower_command.endswith(' -f'):
            reason = "Force push is prohibited. It rewrites remote history and can deploy stale code."
            log_debug(f"BLOCKED force push: {reason}")
            result = {"decision": "block", "reason": reason}
            print(json.dumps(result))
            return

        # Validate fast-forward
        is_ff, reason = check_fast_forward()

        if not is_ff:
            log_debug(f"BLOCKED diverged push: {reason}")
            result = {"decision": "block", "reason": reason}
            print(json.dumps(result))
        else:
            log_debug(f"ALLOWED: {reason}")
            # No output = allow (Claude hooks treat no output as approval)

    except json.JSONDecodeError:
        # If we can't parse input, don't block
        log_debug("Could not parse hook input JSON")
    except Exception as e:
        log_debug(f"Unexpected error: {e}")
        # On error, don't block — fail open


if __name__ == "__main__":
    main()
