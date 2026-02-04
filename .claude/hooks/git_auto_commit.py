#!/usr/bin/env python3
"""
Git Auto-Commit Hook for Claude Code
Automatically commits changes when Claude finishes a session.
Runs before the Slack notifier in the hook chain.
"""
import json
import sys
import os
import subprocess
from pathlib import Path
from datetime import datetime

# Files/patterns to exclude from auto-commit
EXCLUDED_PATTERNS = [
    '.env',
    '.env.local',
    'credentials',
    'secrets',
    '.vitest-results.json',
    'node_modules',
    '.claude/hooks/*.log',
    # Build artifacts - should not be committed
    'dist/',
    'app/dist',
    'build/',
    '.next/',
    'storybook-static/',
    # Lock files that may cause conflicts
    'package-lock.json',
    'bun.lockb',
    # IDE/editor files
    '.idea/',
    '.vscode/',
    '*.swp',
    '*.swo',
    # Coverage and test output
    'coverage/',
    '.nyc_output/',
]

def log_debug(message):
    """Log debug messages to file for troubleshooting"""
    log_path = Path(__file__).parent / 'git_auto_commit.log'
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write(f"{datetime.now().isoformat()} - {message}\n")

def run_git_command(args, cwd=None):
    """Run a git command and return output"""
    try:
        result = subprocess.run(
            ['git'] + args,
            capture_output=True,
            text=True,
            cwd=cwd,
            timeout=30
        )
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, '', 'Command timed out'
    except Exception as e:
        return False, '', str(e)

def get_repo_root():
    """Get the git repository root directory"""
    success, output, _ = run_git_command(['rev-parse', '--show-toplevel'])
    if success:
        return output
    return None

def get_changed_files(repo_root):
    """Get list of changed files (staged and unstaged)"""
    changed = []

    # Get unstaged changes
    success, output, _ = run_git_command(['diff', '--name-only'], cwd=repo_root)
    if success and output:
        changed.extend(output.split('\n'))

    # Get staged changes
    success, output, _ = run_git_command(['diff', '--cached', '--name-only'], cwd=repo_root)
    if success and output:
        changed.extend(output.split('\n'))

    # Get untracked files
    success, output, _ = run_git_command(['ls-files', '--others', '--exclude-standard'], cwd=repo_root)
    if success and output:
        changed.extend(output.split('\n'))

    # Deduplicate and filter
    changed = list(set(f for f in changed if f and f.strip()))

    # Filter out excluded patterns
    filtered = []
    for f in changed:
        excluded = False
        for pattern in EXCLUDED_PATTERNS:
            if pattern in f or f.endswith(pattern):
                excluded = True
                break
        if not excluded:
            filtered.append(f)

    return filtered

def extract_summary_from_transcript(transcript_path):
    """Extract a commit message from the transcript"""
    try:
        if not transcript_path or not os.path.exists(transcript_path):
            return None

        with open(transcript_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        user_prompt = None
        last_summary = None

        for line in lines:
            try:
                entry = json.loads(line.strip())
                entry_type = entry.get('type')
                message = entry.get('message', {})
                content = message.get('content')

                # Get first user prompt
                if entry_type == 'user' and user_prompt is None:
                    if isinstance(content, str):
                        text = content.strip()
                    elif isinstance(content, list):
                        for item in content:
                            if isinstance(item, dict) and item.get('type') == 'text':
                                text = item.get('text', '').strip()
                                break
                        else:
                            continue
                    else:
                        continue

                    # Skip system tags
                    if text and not text.startswith('<'):
                        user_prompt = text

                # Get last assistant text
                if entry_type == 'assistant' and isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict) and item.get('type') == 'text':
                            text = item.get('text', '').strip()
                            if text and len(text) > 20:
                                # Get first meaningful line
                                for line in text.split('\n'):
                                    line = line.strip()
                                    if line and not line.startswith('#') and not line.startswith('```'):
                                        last_summary = line[:100]
                                        break
            except:
                continue

        # Build commit message
        if user_prompt:
            # Truncate and clean
            msg = user_prompt[:80].replace('\n', ' ').strip()
            # Remove command prefixes
            if msg.startswith('/'):
                msg = msg.split(' ', 1)[-1] if ' ' in msg else msg[1:]
            return msg

        return last_summary

    except Exception as e:
        log_debug(f"Error extracting summary: {e}")
        return None

def generate_commit_message(changed_files, transcript_summary=None):
    """Generate a meaningful commit message"""
    # Categorize changes
    categories = {
        'feat': [],
        'fix': [],
        'docs': [],
        'chore': [],
        'style': [],
        'test': [],
    }

    for f in changed_files:
        f_lower = f.lower()
        if 'test' in f_lower or '__tests__' in f_lower:
            categories['test'].append(f)
        elif f.endswith('.md') or 'readme' in f_lower or 'doc' in f_lower:
            categories['docs'].append(f)
        elif '.claude/' in f or 'config' in f_lower or f.startswith('.'):
            categories['chore'].append(f)
        elif '.css' in f_lower or '.scss' in f_lower:
            categories['style'].append(f)
        else:
            categories['feat'].append(f)

    # Determine primary category
    primary = 'chore'
    max_count = 0
    for cat, files in categories.items():
        if len(files) > max_count:
            max_count = len(files)
            primary = cat

    # Build message
    if transcript_summary:
        # Clean up the summary for commit message
        summary = transcript_summary.strip()
        # Remove markdown formatting
        summary = summary.replace('**', '').replace('`', '')
        # Truncate
        if len(summary) > 70:
            summary = summary[:67] + '...'
        msg = f"{primary}: {summary}"
    else:
        # Generate from files
        file_names = [os.path.basename(f) for f in changed_files[:3]]
        if len(changed_files) > 3:
            file_names.append(f'+{len(changed_files) - 3} more')
        msg = f"{primary}: update {', '.join(file_names)}"

    return msg

def main():
    try:
        log_debug("=== Git Auto-Commit Hook Started ===")

        # Read hook input from stdin
        input_data = json.load(sys.stdin)
        log_debug(f"Input keys: {list(input_data.keys())}")

        # Get repo root
        repo_root = get_repo_root()
        if not repo_root:
            log_debug("Not in a git repository")
            print("Not in a git repository, skipping auto-commit")
            return

        log_debug(f"Repo root: {repo_root}")

        # Check for changes
        changed_files = get_changed_files(repo_root)

        if not changed_files:
            log_debug("No changes to commit")
            print("No changes detected, skipping auto-commit")
            return

        log_debug(f"Changed files: {changed_files}")

        # Extract summary from transcript
        transcript_path = input_data.get('transcript_path', '')
        summary = extract_summary_from_transcript(transcript_path)
        log_debug(f"Transcript summary: {summary}")

        # Generate commit message
        commit_msg = generate_commit_message(changed_files, summary)
        log_debug(f"Commit message: {commit_msg[:50]}...")

        # Stage changes (only the changed files, not -A to avoid secrets)
        for f in changed_files:
            success, _, err = run_git_command(['add', f], cwd=repo_root)
            if not success:
                log_debug(f"Failed to stage {f}: {err}")

        # Commit
        success, output, err = run_git_command(
            ['commit', '-m', commit_msg],
            cwd=repo_root
        )

        if success:
            log_debug(f"Commit successful: {output}")
            print(f"Auto-committed {len(changed_files)} file(s)")

            # Get commit hash for reference
            _, commit_hash, _ = run_git_command(['rev-parse', '--short', 'HEAD'], cwd=repo_root)
            print(f"Commit: {commit_hash}")
        else:
            # Check if it's just "nothing to commit"
            if 'nothing to commit' in err or 'nothing to commit' in output:
                log_debug("Nothing to commit (already staged or no changes)")
                print("No changes to commit")
            else:
                log_debug(f"Commit failed: {err}")
                print(f"Auto-commit failed: {err}", file=sys.stderr)

    except json.JSONDecodeError as e:
        log_debug(f"JSON error: {e}")
        print(f"Invalid JSON input: {e}", file=sys.stderr)
    except Exception as e:
        log_debug(f"Exception: {e}")
        print(f"Error in git auto-commit: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
