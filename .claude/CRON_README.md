# Claude Audit Cron Jobs

Scheduled audit commands that run automatically at specific times.

## Installed Cron Jobs

| Time (Daily) | Command | Purpose |
|--------------|---------|---------|
| 10:15 AM | `/audit-twilio-sms-mocking` | Audit Twilio SMS mocking coverage |
| 11:15 AM | `/audit-vitest-rtl-setup` | Audit Vitest + React Testing Library setup |
| 11:45 AM | `/audit-custom-hook-tests` | Audit custom React hook test coverage |
| 12:15 PM | `/audit-barrel-files` | Audit for barrel/hub file detection |

## File Structure

```
.claude/
├── cron-audits.sh          # Main script that runs audit commands
├── crontab                 # Cron job schedule configuration
├── setup-cron-audits.sh    # Installation script
├── uninstall-cron-audits.sh # Uninstallation script
└── logs/                   # Audit execution logs (auto-created)
    └── audit-YYYYMMDD-HHMMSS.log
```

## Usage

### Install Cron Jobs

```bash
./.claude/setup-cron-audits.sh
```

### Uninstall Cron Jobs

```bash
./.claude/uninstall-cron-audits.sh
```

### View Installed Cron Jobs

```bash
crontab -l | grep audit
```

### Run Audit Manually

```bash
./.claude/cron-audits.sh audit-twilio-sms-mocking
./.claude/cron-audits.sh audit-vitest-rtl-setup
./.claude/cron-audits.sh audit-custom-hook-tests
./.claude/cron-audits.sh audit-barrel-files
```

## Logs

Each audit run creates a log file in `.claude/logs/`:
- Format: `audit-YYYYMMDD-HHMMSS.log`
- Contains: Command output, timestamps, completion status

Example:
```bash
ls -la .claude/logs/
# .claude/logs/audit-20260124-101500.log
# .claude/logs/audit-20260124-111500.log
```

## Slack Notifications

After each audit completes, a notification is sent to the Slack webhook configured in `.env`:
```
TINYTASKAGENT=https://hooks.slack.com/services/...
```

Notification includes:
- Command name
- Completion time
- Log file location

## Troubleshooting

### Check if cron jobs are running

```bash
# View recent logs
ls -lt .claude/logs/ | head -5

# Check cron service status
systemctl status cron
```

### Test cron job manually

```bash
# Run the exact command cron would execute
/home/splitlease/Documents/splitlease/.claude/cron-audits.sh audit-twilio-sms-mocking
```

### View cron execution logs

```bash
# System cron logs
sudo grep CRON /var/log/syslog | tail -20
```

## Modifying Schedule

To change the schedule, edit `.claude/crontab` and reinstall:

```bash
# Edit the crontab file
nano .claude/crontab

# Reinstall
./.claude/setup-cron-audits.sh
```

Cron format: `minute hour day month dayofweek command`
- `15 10 * * *` = 10:15 AM every day
- `0 */2 * * *` = Every 2 hours
- `0 0 * * 1` = Midnight every Monday

## Claude CLI Path

The cron jobs use the Claude CLI at: `/home/splitlease/.local/bin/claude`

If you move the installation, update the path in `.claude/cron-audits.sh`.

## Security Notes

- Cron jobs run as the `splitlease` user
- Scripts are executable by owner only (`chmod 700`)
- Logs may contain sensitive information - restrict access
- Slack webhook URL is stored in `.env` (not in git)
