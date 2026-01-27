#!/bin/bash
# Setup Claude Audit Cron Jobs
# Split Lease - Install scheduled audit commands

set -e

CRON_FILE="/home/splitlease/Documents/splitlease/.claude/crontab"
SCRIPT_FILE="/home/splitlease/Documents/splitlease/.claude/cron-audits.sh"

echo "============================================================"
echo "Setting up Claude Audit Cron Jobs"
echo "============================================================"

# Make the audit script executable
chmod +x "$SCRIPT_FILE"
echo "✅ Made audit script executable: $SCRIPT_FILE"

# Create logs directory
mkdir -p /home/splitlease/Documents/splitlease/.claude/logs
echo "✅ Created logs directory"

# Check if Claude CLI path is correct
if [ ! -f "/home/splitlease/.local/bin/claude" ]; then
  echo "⚠️  WARNING: Claude CLI not found at /home/splitlease/.local/bin/claude"
  echo "   Please run: 'which claude' to find the correct path"
  echo "   Then update $SCRIPT_FILE with the correct path"
  exit 1
fi

# Install cron jobs
crontab -l > /tmp/current_crontab 2>/dev/null || true

# Check if our cron jobs are already installed
if grep -q "cron-audits.sh" /tmp/current_crontab 2>/dev/null; then
  echo "⚠️  Audit cron jobs already installed. Removing old entries..."
  # Remove old audit cron entries
  crontab -l | grep -v "cron-audits.sh" | crontab -
fi

# Append new cron jobs
cat "$CRON_FILE" >> /tmp/current_crontab
crontab /tmp/current_crontab
echo "✅ Installed cron jobs from: $CRON_FILE"

# Show installed cron jobs
echo ""
echo "============================================================"
echo "Installed Cron Jobs:"
echo "============================================================"
crontab -l | grep -E "audit-twilio|audit-vitest|audit-custom|audit-barrel" || echo "No audit jobs found"

echo ""
echo "============================================================"
echo "Schedule Summary:"
echo "============================================================"
echo "10:15 AM - /audit-twilio-sms-mocking"
echo "11:15 AM - /audit-vitest-rtl-setup"
echo "11:45 AM - /audit-custom-hook-tests"
echo "12:15 PM - /audit-barrel-files"
echo ""
echo "Logs will be saved to: .claude/logs/audit-YYYYMMDD-HHMMSS.log"
echo "============================================================"
echo ""
echo "✅ Setup complete!"
