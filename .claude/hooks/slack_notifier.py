#!/usr/bin/env python3
"""
Slack Notifier Hook for Claude Code
Forwards completion messages to a Slack webhook when Claude finishes responding.
"""
import json
import sys
import os
import requests
from datetime import datetime
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
    """Extract a summary of what Claude did from the transcript"""
    try:
        if not os.path.exists(transcript_path):
            return "Completed task"

        # Read the last few lines of the transcript to get recent activity
        with open(transcript_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Parse the last few JSONL entries
        recent_entries = []
        for line in reversed(lines[-10:]):  # Last 10 entries
            try:
                entry = json.loads(line.strip())
                recent_entries.append(entry)
            except:
                continue

        # Look for tool uses or assistant messages
        tools_used = []
        for entry in recent_entries:
            if entry.get('type') == 'tool_use':
                tool_name = entry.get('name', 'Unknown')
                tools_used.append(tool_name)

        if tools_used:
            # Get unique tools (preserve order)
            unique_tools = []
            for tool in tools_used:
                if tool not in unique_tools:
                    unique_tools.append(tool)
            return f"Used tools: {', '.join(unique_tools[:3])}"

        return "Completed response"

    except Exception as e:
        return f"Completed task (error reading transcript: {str(e)})"

def send_to_slack(webhook_url, message):
    """Send message to Slack webhook"""
    try:
        # Get hostname for the message prefix
        hostname = os.environ.get('COMPUTERNAME', os.environ.get('HOSTNAME', 'unknown'))

        payload = {
            "text": f"[{hostname}] {message}",
            "unfurl_links": False,
            "unfurl_media": False
        }

        response = requests.post(
            webhook_url,
            json=payload,
            timeout=10
        )

        if response.status_code != 200:
            print(f"Failed to send to Slack: {response.status_code} - {response.text}", file=sys.stderr)
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
        webhook_url = env_vars.get('NOISYAGENTLOG')

        if not webhook_url:
            print("NOISYAGENTLOG environment variable not set", file=sys.stderr)
            sys.exit(1)

        # Extract information from hook input
        transcript_path = input_data.get('transcript_path', '')
        session_id = input_data.get('session_id', 'unknown')
        cwd = input_data.get('cwd', '')

        # Create a summary message
        summary = extract_summary_from_transcript(transcript_path)

        # Get current timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Format the message
        message = f"🤖 Claude Code Stop Event | {timestamp}\n"
        message += f"📝 Summary: {summary}\n"
        message += f"📂 Directory: {os.path.basename(cwd) if cwd else 'unknown'}\n"
        message += f"🆔 Session: {session_id[:8]}..."

        # Send to Slack
        success = send_to_slack(webhook_url, message)

        if success:
            print(f"✓ Sent notification to Slack: {summary}")
        else:
            print(f"✗ Failed to send notification to Slack", file=sys.stderr)
            sys.exit(1)

    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error in Slack notifier: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
