#!/bin/bash
# Claude Audit Cron Jobs
# Runs audit commands at scheduled times
# Split Lease - .claude/cron-audits.sh

# Set working directory
cd /home/splitlease/Documents/splitlease

# Log location
LOG_DIR="/home/splitlease/Documents/splitlease/.claude/logs"
mkdir -p "$LOG_DIR"

# Function to run an audit command
run_audit() {
  local COMMAND="$1"
  local TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
  local LOG_FILE="$LOG_DIR/audit-${TIMESTAMP}.log"

  echo "========================================" | tee -a "$LOG_FILE"
  echo "Running: $COMMAND" | tee -a "$LOG_FILE"
  echo "Time: $(date)" | tee -a "$LOG_FILE"
  echo "========================================" | tee -a "$LOG_FILE"

  # Run the audit command using Claude Code CLI
  /home/splitlease/.local/bin/claude "$COMMAND" >> "$LOG_FILE" 2>&1

  # Send completion notification to Slack
  WEBHOOK=$(grep "^TINYTASKAGENT=" /home/splitlease/Documents/splitlease/.env | cut -d'=' -f2-)
  if [ -n "$WEBHOOK" ]; then
    curl -X POST "$WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{
        \"text\": \"✅ Completed: $COMMAND at $(date +\"%H:%M\")\",
        \"blocks\": [
          {
            \"type\": \"section\",
            \"text\": {
              \"type\": \"mrkdwn\",
              \"text\": \"*Audit Completed*\n\n*Command:* \`$COMMAND\`\n*Time:* $(date)\n*Log:* \`$LOG_FILE\`\"
            }
          }
        ]
      }"
  fi

  echo "Audit completed at $(date)" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"
}

# Parse command line argument to determine which audit to run
case "$1" in
  audit-twilio-sms-mocking)
    run_audit "/audit-twilio-sms-mocking"
    ;;
  audit-vitest-rtl-setup)
    run_audit "/audit-vitest-rtl-setup"
    ;;
  audit-custom-hook-tests)
    run_audit "/audit-custom-hook-tests"
    ;;
  audit-barrel-files)
    run_audit "/audit-barrel-files"
    ;;
  *)
    echo "Usage: $0 {audit-twilio-sms-mocking|audit-vitest-rtl-setup|audit-custom-hook-tests|audit-barrel-files}"
    exit 1
    ;;
esac
