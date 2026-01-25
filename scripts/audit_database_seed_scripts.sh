#!/usr/bin/env bash
export PATH=/usr/bin:/bin:/usr/local/bin

LOG_FILE="/home/splitlease/audit_database_seed_scripts.log"

# Log start
echo "========================================" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] START: audit_database_seed_scripts.sh" >> "$LOG_FILE"

cd /home/splitlease/Documents/splitlease || exit 1

# Run audit and capture output
if claude \
  --dangerously-skip-permissions \
  -p \
  "/audit-database-seed-scripts" >> "$LOG_FILE" 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: audit completed" >> "$LOG_FILE"
    EXIT_CODE=0
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: audit failed with exit code $?" >> "$LOG_FILE"
    EXIT_CODE=1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] END: audit_database_seed_scripts.sh (exit: $EXIT_CODE)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

exit $EXIT_CODE
