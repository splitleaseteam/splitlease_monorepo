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
    """Extract the last assistant response from transcript"""
    try:
        if not os.path.exists(transcript_path):
            return None

        with open(transcript_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Parse JSONL entries and find last assistant message
        last_text = None
        for line in reversed(lines):
            try:
                entry = json.loads(line.strip())

                # Check if this is an assistant message
                if entry.get('type') == 'assistant':
                    message = entry.get('message', {})
                    content = message.get('content', [])

                    # Look through content blocks for text
                    if isinstance(content, list):
                        for block in content:
                            if isinstance(block, dict) and block.get('type') == 'text':
                                text = block.get('text', '').strip()
                                if text and len(text) > 20:
                                    last_text = text
                                    break

                    if last_text:
                        break

            except:
                continue

        if not last_text:
            return None

        # Extract first meaningful sentence/line
        lines = last_text.split('\n')
        for line in lines:
            line = line.strip()
            # Skip markdown headers, skip very short lines
            if line and len(line) > 20 and not line.startswith('#'):
                # Remove markdown formatting
                line = line.replace('**', '').replace('*', '').replace('`', '')
                # Limit length
                if len(line) > 200:
                    line = line[:197] + "..."
                return line

        return None

    except Exception as e:
        return None

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

        # Only send if we got a real summary
        if not summary:
            print("No summary extracted from transcript", file=sys.stderr)
            sys.exit(0)  # Exit successfully even if no message sent

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
