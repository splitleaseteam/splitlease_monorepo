#!/usr/bin/env python3
"""
Slack Notifier Hook for Claude Code
Forwards completion messages to a Slack webhook when Claude finishes responding.
Also logs each query to a JSONL file for future review.
"""
import json
import sys
import os
import re
import subprocess
import requests
from pathlib import Path
from datetime import datetime

# Regex pattern to match the Slack divider
SLACK_DIVIDER_PATTERN = re.compile(r'~~~\s*FOR\s+SLACK\s*~~~', re.IGNORECASE)

# Log file location
LOG_DIR = Path.home() / '.claude' / 'logs'
LOG_FILE = LOG_DIR / 'splitlease.jsonl'

def log_debug(message):
    """Log debug messages to file for troubleshooting"""
    log_path = Path(__file__).parent / 'slack_notifier.log'
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write(f"{datetime.now().isoformat()} - {message}\n")


def get_git_commit():
    """Get the current git HEAD commit hash (short)"""
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--short', 'HEAD'],
            capture_output=True,
            text=True,
            timeout=5,
            cwd=Path(__file__).parent.parent.parent  # Project root
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return "unknown"


def write_to_log(entry):
    """Append a JSON entry to the log file"""
    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
        return True
    except Exception as e:
        log_debug(f"Failed to write log: {e}")
        return False

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
    """Extract latest user prompt, complete response, and summary for Slack"""
    try:
        if not os.path.exists(transcript_path):
            return None, None, None

        with open(transcript_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        latest_user_prompt = None
        last_assistant_text = None
        files_changed = []

        for line in lines:
            try:
                entry = json.loads(line.strip())
                entry_type = entry.get('type')
                message = entry.get('message', {})
                content = message.get('content')

                # Extract LATEST user prompt (overwrite each time we find one)
                if entry_type == 'user':
                    raw_prompt = None
                    if isinstance(content, str):
                        raw_prompt = content.strip()
                    elif isinstance(content, list):
                        for item in content:
                            if isinstance(item, dict) and item.get('type') == 'text':
                                raw_prompt = item.get('text', '').strip()
                                break

                    # Skip if it starts with system tags
                    if raw_prompt and not raw_prompt.startswith('<'):
                        latest_user_prompt = raw_prompt

                # Extract assistant text responses and tool uses
                if entry_type == 'assistant' and isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict):
                            if item.get('type') == 'text':
                                text = item.get('text', '').strip()
                                if text and len(text) > 10:
                                    last_assistant_text = text
                            elif item.get('type') == 'tool_use':
                                tool_name = item.get('name', '')
                                tool_input = item.get('input', {})
                                if tool_name in ('Edit', 'Write'):
                                    file_path = tool_input.get('file_path', '')
                                    if file_path:
                                        file_name = file_path.split('/')[-1].split('\\')[-1]
                                        if file_name not in files_changed:
                                            files_changed.append(file_name)
            except:
                continue

        # Store complete response (untruncated)
        complete_response = last_assistant_text

        # Build summary from last assistant text - extract only content after "~~~ FOR SLACK ~~~"
        summary = None
        if last_assistant_text:
            # Check if the divider exists
            divider_match = SLACK_DIVIDER_PATTERN.search(last_assistant_text)

            if divider_match:
                # Extract only the content after the divider
                slack_content = last_assistant_text[divider_match.end():].strip()
            else:
                # Fallback: use full text if no divider found
                slack_content = last_assistant_text

            # Get non-empty lines, skip code blocks
            summary_lines = []
            in_code_block = False
            for line in slack_content.split('\n'):
                stripped = line.strip()
                # Track code block state
                if stripped.startswith('```'):
                    in_code_block = not in_code_block
                    continue
                # Skip lines inside code blocks
                if in_code_block:
                    continue
                # Include non-empty lines (keep bullets and dashes for context)
                if stripped:
                    summary_lines.append(stripped)

            # Join all lines with newlines for complete message
            summary = '\n'.join(summary_lines)

            # Slack has a 40,000 char limit, but keep reasonable for readability
            # Only truncate if extremely long (over 4000 chars)
            if len(summary) > 4000:
                summary = summary[:3997] + "..."

        # Append files if we have them
        if files_changed and len(files_changed) <= 3:
            file_list = ', '.join(files_changed[-3:])
            if summary:
                summary = f"{summary} [{file_list}]"
            else:
                summary = f"Modified: {file_list}"

        return latest_user_prompt, summary, complete_response

    except Exception as e:
        return None, None, None

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

        # Get hostname and git commit
        hostname = os.environ.get('COMPUTERNAME', os.environ.get('HOSTNAME', 'unknown'))
        commit = get_git_commit()
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')

        # Extract prompt, summary, and complete response from transcript
        user_prompt, summary, complete_response = extract_info_from_transcript(transcript_path)

        # Write to JSONL log (always, even if partial data)
        log_entry = {
            "ts": timestamp,
            "device": hostname,
            "commit": commit,
            "prompt": user_prompt or "",
            "summary": summary or "",
            "complete": complete_response or ""
        }
        log_success = write_to_log(log_entry)
        if log_success:
            log_debug(f"Logged query to {LOG_FILE}")
        else:
            log_debug("Failed to write to JSONL log")

        # If no summary, use user prompt as context
        if not summary:
            if user_prompt:
                summary = f"Re: {user_prompt}"
            else:
                # Nothing meaningful to report
                log_debug("No meaningful content to send, skipping")
                print("No meaningful content to report")
                return

        # Format the message
        message_parts = [summary, f"-{hostname}"]

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
