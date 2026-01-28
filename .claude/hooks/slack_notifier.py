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

def extract_summary_from_transcript(transcript_path):
    """Extract a conversational summary from transcript"""
    try:
        if not os.path.exists(transcript_path):
            return "completed the task"

        with open(transcript_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Parse JSONL entries
        entries = []
        for line in lines:
            try:
                entry = json.loads(line.strip())
                entries.append(entry)
            except:
                continue

        # Strategy 1: Look for assistant messages with actual content (non-tool text)
        assistant_messages = []
        for entry in reversed(entries[-50:]):  # Check last 50 entries
            if entry.get('role') == 'assistant':
                content = entry.get('content', [])
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get('type') == 'text':
                            text = block.get('text', '').strip()
                            # Skip empty, very short, or technical messages
                            if text and len(text) > 30 and not text.startswith('<'):
                                assistant_messages.append(text)

        # Find the first substantive message
        for msg in assistant_messages:
            # Get first meaningful line/sentence
            lines = msg.split('\n')
            for line in lines:
                line = line.strip()
                # Skip markdown headers, bullets, code blocks
                if line and len(line) > 20 and not line.startswith('#') and not line.startswith('*') and not line.startswith('`'):
                    # Clean up and limit length
                    if len(line) > 150:
                        line = line[:147] + "..."
                    return line

        # Strategy 2: Fallback to describing what tools were used
        tools_used = []
        files_modified = []
        for entry in reversed(entries[-30:]):
            if entry.get('type') == 'tool_use':
                tool_name = entry.get('name', '')
                tool_input = entry.get('input', {})

                if tool_name == 'Edit' and tool_name not in [t[0] for t in tools_used]:
                    file_path = tool_input.get('file_path', '')
                    if file_path:
                        files_modified.append(file_path.split('/')[-1])
                    tools_used.append((tool_name, 'edited files'))
                elif tool_name == 'Write' and tool_name not in [t[0] for t in tools_used]:
                    tools_used.append((tool_name, 'created files'))
                elif tool_name == 'Bash' and tool_name not in [t[0] for t in tools_used]:
                    cmd = tool_input.get('command', '')
                    if 'git commit' in cmd:
                        tools_used.append(('Commit', 'committed changes'))
                    elif not any(t[0] == 'Bash' for t in tools_used):
                        tools_used.append((tool_name, 'ran commands'))

        if tools_used:
            actions = ', '.join([t[1] for t in tools_used[:3]])
            return actions

        return "completed the task"

    except Exception as e:
        return f"encountered an error: {str(e)}"

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

        # Get hostname and format device name
        hostname = os.environ.get('COMPUTERNAME', os.environ.get('HOSTNAME', 'unknown'))
        # Convert SPLIT-LEASE-8 to Splitlease 8
        device_name = hostname.replace('SPLIT-LEASE-', 'Splitlease ').replace('-', ' ')

        # Extract summary from transcript
        summary = extract_summary_from_transcript(transcript_path)

        # Format the message
        message = f"{device_name} says: {summary}"

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
