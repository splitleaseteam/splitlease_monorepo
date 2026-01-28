#!/usr/bin/env python3
"""
Slack Notifier Hook for Claude Code
Forwards completion messages to a Slack webhook when Claude finishes responding.
"""
import json
import sys
import os
import requests
import subprocess
from pathlib import Path

def load_env_file():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent.parent.parent / '.env'
    env_vars = {}

    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()

    return env_vars

def extract_info_from_transcript(transcript_path):
    """Extract prompt, summary, and git commit info from transcript"""
    try:
        if not os.path.exists(transcript_path):
            return None, "Completed task", None

        with open(transcript_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Parse all JSONL entries
        entries = []
        for line in lines:
            try:
                entry = json.loads(line.strip())
                entries.append(entry)
            except:
                continue

        # Extract user prompt (first user message)
        user_prompt = None
        for entry in entries:
            if entry.get('role') == 'user' and entry.get('content'):
                content = entry['content']
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get('type') == 'text':
                            user_prompt = block.get('text', '').strip()
                            break
                elif isinstance(content, str):
                    user_prompt = content.strip()
                if user_prompt:
                    break

        # Look for git commit in tool uses
        git_commit_hash = None
        for entry in reversed(entries):
            if entry.get('type') == 'tool_use' and entry.get('name') == 'Bash':
                tool_input = entry.get('input', {})
                command = tool_input.get('command', '')
                if 'git commit' in command:
                    # Try to find the commit hash from the result
                    # We'll get it from git log instead
                    git_commit_hash = "commit_made"
                    break

        # Extract summary from recent tool uses
        tools_used = []
        for entry in reversed(entries[-20:]):
            if entry.get('type') == 'tool_use':
                tool_name = entry.get('name', 'Unknown')
                if tool_name not in tools_used:
                    tools_used.append(tool_name)

        summary = f"Used: {', '.join(tools_used[:5])}" if tools_used else "Completed"

        return user_prompt, summary, git_commit_hash

    except Exception as e:
        return None, f"Error: {str(e)}", None

def get_latest_commit_hash(cwd):
    """Get the latest git commit hash"""
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--short', 'HEAD'],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except:
        pass
    return None

def send_to_slack(webhook_url, message):
    """Send message to Slack webhook"""
    try:
        payload = {
            "text": message,
            "unfurl_links": False,
            "unfurl_media": False
        }

        response = requests.post(
            webhook_url,
            json=payload,
            timeout=10
        )

        if response.status_code != 200:
            print(f"Failed to send to Slack: {response.status_code}", file=sys.stderr)
            return False

        return True

    except Exception as e:
        print(f"Error sending to Slack: {str(e)}", file=sys.stderr)
        return False

def main():
    try:
        # Read hook input from stdin
        input_data = json.load(sys.stdin)

        # Get environment variables
        env_vars = load_env_file()
        webhook_url = env_vars.get('TINYTASKAGENT')

        if not webhook_url:
            print("TINYTASKAGENT environment variable not set", file=sys.stderr)
            sys.exit(1)

        # Extract information from hook input
        transcript_path = input_data.get('transcript_path', '')
        session_id = input_data.get('session_id', 'unknown')
        cwd = input_data.get('cwd', '')

        # Get hostname
        hostname = os.environ.get('COMPUTERNAME', os.environ.get('HOSTNAME', 'unknown'))

        # Extract info from transcript
        user_prompt, summary, commit_detected = extract_info_from_transcript(transcript_path)

        # Get commit hash if commit was made
        commit_hash = None
        if commit_detected and cwd:
            commit_hash = get_latest_commit_hash(cwd)

        # Format the message (simple, no emojis)
        message_parts = [
            f"Host: {hostname}",
            f"Session: {session_id}",
            f"Prompt: {user_prompt if user_prompt else 'N/A'}",
            f"Outcome: {summary}",
        ]

        if commit_hash:
            message_parts.append(f"Commit: Yes ({commit_hash})")
        else:
            message_parts.append("Commit: No")

        message = "\n".join(message_parts)

        # Send to Slack
        success = send_to_slack(webhook_url, message)

        if success:
            print("Sent notification to Slack")
        else:
            print("Failed to send notification to Slack", file=sys.stderr)
            sys.exit(1)

    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error in Slack notifier: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
