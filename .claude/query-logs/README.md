# Query Logs

This directory contains per-entry JSON log files from Claude Code sessions.

## Filename Format

```
{timestamp}-{hostname}-{commit}.json
```

- **timestamp**: `YYYYMMDDHHMMSS` format
- **hostname**: Machine name (e.g., `DESKTOP-ABC123`)
- **commit**: Short git hash at time of query

## Structure

Each JSON file contains:

```json
{
  "ts": "20260204065000",
  "device": "DESKTOP-ABC123",
  "commit": "f553717",
  "prompt": "User's query",
  "summary": "Slack summary sent",
  "complete": "Full assistant response"
}
```

## Version Control

These files are git-tracked. Each machine creates uniquely-named files, preventing merge conflicts.
