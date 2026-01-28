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
    """Extract user prompt and assistant response from transcript"""
    try:
        if not os.path.exists(transcript_path):
            return None, None

        with open(transcript_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Parse JSONL entries
        user_prompt = None
        last_text = None

        # Extract user prompt (first user message)
        for line in lines:
            try:
                entry = json.loads(line.strip())
                if entry.get('type') == 'user':
                    message = entry.get('message', {})
                    content = message.get('content')
                    if isinstance(content, str):
                        user_prompt = content.strip()
                        break
            except:
                continue

        # Extract last assistant message
        for line in reversed(lines):
            try:
                entry = json.loads(line.strip())
                if entry.get('type') == 'assistant':
                    message = entry.get('message', {})
                    content = message.get('content', [])

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
            return user_prompt, None

        # Extract just the first 1-2 meaningful sentences (max 200 chars for conciseness)
        lines = last_text.split('\n')

        for line in lines:
            line = line.strip()

            # Skip headers, bullets, code blocks, very short lines
            if not line or line.startswith('#') or line.startswith('-') or line.startswith('*') or line.startswith('```') or len(line) < 15:
                continue

            # Clean markdown
            clean_line = line.replace('**', '').replace('`', '').strip()

            # Take first substantial line, limit to 200 chars
            if len(clean_line) > 200:
                clean_line = clean_line[:197] + "..."

            return user_prompt, clean_line

        return user_prompt, None

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
        cwd = input_data.get('cwd', '')

        # Get hostname
        hostname = os.environ.get('COMPUTERNAME', os.environ.get('HOSTNAME', 'unknown'))

        # Extract prompt and summary from transcript
        user_prompt, summary = extract_info_from_transcript(transcript_path)

        # Only send if we got a real summary
        if not summary:
            print("No summary extracted from transcript", file=sys.stderr)
            sys.exit(0)

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
