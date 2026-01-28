#!/usr/bin/env bash
export PATH=/usr/bin:/bin:/usr/local/bin

LOG_FILE="/home/splitlease/test_webhook.log"

# Log start
echo "========================================" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] START: test_webhook.sh" >> "$LOG_FILE"

cd /home/splitlease/Documents/splitlease || exit 1

# Load TINYTASKAGENT from .env file if not already set
if [ -z "$TINYTASKAGENT" ] && [ -f .env ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Loading .env file..." >> "$LOG_FILE"
    export $(grep -v '^#' .env | xargs)
fi

HOSTNAME=$(hostname)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Hostname: $HOSTNAME" >> "$LOG_FILE"

# Run webhook and capture output
if python3 "/home/splitlease/Documents/splitlease/.claude/skills/slack-webhook/scripts/send_slack.py" "$HOSTNAME says pull request complete" --type success >> "$LOG_FILE" 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: webhook sent" >> "$LOG_FILE"
    EXIT_CODE=0
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: webhook failed with exit code $?" >> "$LOG_FILE"
    EXIT_CODE=1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] END: test_webhook.sh (exit: $EXIT_CODE)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

exit $EXIT_CODE
