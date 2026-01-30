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
from datetime import datetime

def log_debug(message):
    """Log debug messages to file for troubleshooting"""
    log_path = Path(__file__).parent / 'slack_notifier.log'
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write(f"{datetime.now().isoformat()} - {message}\n")

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
    """Extract user prompt and what was actually done (tools/files)"""
    try:
        if not os.path.exists(transcript_path):
            return None, None

        with open(transcript_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Parse JSONL entries
        user_prompt = None
        tools_used = set()
        files_changed = []

        # Extract user prompt (first user message)
        for line in lines:
            try:
                entry = json.loads(line.strip())
                if entry.get('type') == 'user':
                    message = entry.get('message', {})
                    content = message.get('content')
                    if isinstance(content, str):
                        user_prompt = content.strip()
                        if len(user_prompt) > 80:
                            user_prompt = user_prompt[:77] + "..."
                        break
            except:
                continue

        # Extract tools used and files changed
        for line in reversed(lines[-30:]):
            try:
                entry = json.loads(line.strip())
                if entry.get('type') == 'tool_use':
                    tool_name = entry.get('name', '')
                    tool_input = entry.get('input', {})

                    if tool_name == 'Edit':
                        tools_used.add('edited')
                        file_path = tool_input.get('file_path', '')
                        if file_path:
                            file_name = file_path.split('/')[-1].split('\\')[-1]
                            if file_name not in files_changed:
                                files_changed.append(file_name)
                    elif tool_name == 'Write':
                        tools_used.add('created')
                    elif tool_name == 'Bash':
                        cmd = tool_input.get('command', '')
                        if 'git commit' in cmd:
                            tools_used.add('committed')
            except:
                continue

        # Build simple summary
        if tools_used:
            summary = ', '.join(sorted(tools_used))
            if files_changed and len(files_changed) <= 2:
                summary += f" {', '.join(files_changed)}"
        else:
            summary = None

        return user_prompt, summary

    except Exception as e:
        return None, None

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
        log_debug("Hook started")

        # Read hook input from stdin
        input_data = json.load(sys.stdin)
        log_debug(f"Input received: {list(input_data.keys())}")

        # Get environment variables
        env_vars = load_env_file()
        webhook_url = env_vars.get('TINYTASKAGENT')

        if not webhook_url:
            log_debug("ERROR: TINYTASKAGENT not set")
            print("TINYTASKAGENT environment variable not set", file=sys.stderr)
            sys.exit(1)

        # Extract information from hook input
        transcript_path = input_data.get('transcript_path', '')
        cwd = input_data.get('cwd', '')

        # Get hostname
        hostname = os.environ.get('COMPUTERNAME', os.environ.get('HOSTNAME', 'unknown'))

        # Extract prompt and summary from transcript
        user_prompt, summary = extract_info_from_transcript(transcript_path)

        # Use fallback if no tool summary extracted
        if not summary:
            summary = "conversation completed"

        # Check for git commit
        commit_hash = get_latest_commit_hash(cwd) if cwd else None

        # Format the message
        message_parts = [summary]

        if user_prompt:
            message_parts.append(f"Prompt: {user_prompt}")

        if commit_hash:
            message_parts.append(f"Commit: {commit_hash}")

        message_parts.append(f"-{hostname}")

        message = "\n".join(message_parts)

        # Send to Slack
        log_debug(f"Sending: {message[:100]}...")
        success = send_to_slack(webhook_url, message)

        if success:
            log_debug("SUCCESS: Notification sent")
            print("Sent notification to Slack")
        else:
            log_debug("FAILED: Could not send notification")
            print("Failed to send notification to Slack", file=sys.stderr)
            sys.exit(1)

    except json.JSONDecodeError as e:
        log_debug(f"JSON ERROR: {e}")
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        log_debug(f"EXCEPTION: {str(e)}")
        print(f"Error in Slack notifier: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
