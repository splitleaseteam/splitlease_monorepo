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

        # Parse all JSONL entries
        entries = []
        for line in lines:
            try:
                entry = json.loads(line.strip())
                entries.append(entry)
            except:
                continue

        # Look for assistant's final response text
        last_response = None
        for entry in reversed(entries):
            if entry.get('role') == 'assistant' and entry.get('content'):
                content = entry['content']
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get('type') == 'text':
                            text = block.get('text', '').strip()
                            if text and len(text) > 20:
                                last_response = text
                                break
                elif isinstance(content, str) and len(content) > 20:
                    last_response = content.strip()
                if last_response:
                    break

        # Extract first meaningful sentence or paragraph
        if last_response:
            # Get first sentence or first 200 chars
            sentences = last_response.split('\n')
            for sentence in sentences:
                sentence = sentence.strip()
                if sentence and len(sentence) > 15:
                    # Limit to 200 chars
                    if len(sentence) > 200:
                        sentence = sentence[:197] + "..."
                    return sentence

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
