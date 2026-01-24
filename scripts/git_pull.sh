#!/usr/bin/env bash
export PATH=/usr/bin:/bin:/usr/local/bin

LOG_FILE="/home/splitlease/git_pull.log"

# Log start
echo "========================================" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] START: git_pull.sh" >> "$LOG_FILE"

cd /home/splitlease/Documents/splitlease || exit 1

# Run git pull and capture output
if git pull -f origin main >> "$LOG_FILE" 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: git pull completed" >> "$LOG_FILE"
    EXIT_CODE=0
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: git pull failed with exit code $?" >> "$LOG_FILE"
    EXIT_CODE=1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] END: git_pull.sh (exit: $EXIT_CODE)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

exit $EXIT_CODE
