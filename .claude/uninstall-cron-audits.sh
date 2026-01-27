#!/bin/bash
# Uninstall Claude Audit Cron Jobs
# Split Lease - Remove scheduled audit commands

echo "============================================================"
echo "Uninstalling Claude Audit Cron Jobs"
echo "============================================================"

# Get current crontab
crontab -l > /tmp/current_crontab 2>/dev/null || true

# Check if audit cron jobs exist
if grep -q "cron-audits.sh" /tmp/current_crontab 2>/dev/null; then
  echo "Found audit cron jobs. Removing..."
  # Remove audit cron entries
  crontab -l | grep -v "cron-audits.sh" | crontab -
  echo "✅ Removed all audit cron jobs"
else
  echo "⚠️  No audit cron jobs found"
fi

echo ""
echo "============================================================"
echo "Remaining cron jobs:"
echo "============================================================"
crontab -l | grep -v "^#" | grep -v "^$" || echo "No cron jobs remaining"
echo "============================================================"
