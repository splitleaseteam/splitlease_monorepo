#!/bin/bash
# ============================================================================
# Claude Code Audit Runner
# Executes Claude Code with a slash command in non-interactive mode
# Usage: ./run-claude-audit.sh <slash-command>
# Example: ./run-claude-audit.sh /audit-page-object-model
# ============================================================================

set -euo pipefail

# Configuration
PROJECT_DIR="/home/splitlease/Documents/splitlease"
LOGS_DIR="${PROJECT_DIR}/logs"
CLAUDE_BIN="/home/splitlease/.local/bin/claude"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Validate input
if [ -z "${1:-}" ]; then
    echo "Error: No slash command provided"
    echo "Usage: $0 <slash-command>"
    exit 1
fi

SLASH_COMMAND="$1"
COMMAND_NAME=$(echo "$SLASH_COMMAND" | tr -d '/' | tr '-' '_')
LOG_FILE="${LOGS_DIR}/${COMMAND_NAME}_${TIMESTAMP}.log"

# Ensure logs directory exists
mkdir -p "$LOGS_DIR"

# Log start
echo "============================================" >> "$LOG_FILE"
echo "Claude Audit Run: $SLASH_COMMAND" >> "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"

# Change to project directory and run Claude
cd "$PROJECT_DIR"

# Run Claude with the slash command
# --print: Output response and exit (non-interactive)
# --dangerously-skip-permissions: Allow tool usage without prompts (for automation)
"$CLAUDE_BIN" --print --dangerously-skip-permissions "$SLASH_COMMAND" >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

# Log completion
echo "" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"
echo "Completed: $(date)" >> "$LOG_FILE"
echo "Exit code: $EXIT_CODE" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"

# Cleanup old logs (keep last 30 days)
find "$LOGS_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true

exit $EXIT_CODE
