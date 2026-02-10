# Slack Events Module

Universal endpoint for receiving and processing Slack Events API subscriptions on PythonAnywhere.

## What It Does

Single endpoint (`/slack/events`) that receives all Slack event webhooks across multiple apps, workspaces, and channels. Validates signatures, processes events, and logs to per-workspace audit files.

## Architecture

```
Slack → POST /slack/events → routes.py (signature verification) → event_handler.py → logs/slack_events/{team_id}.log
```

## Files

- `routes.py` — Flask blueprint with `/slack/events`, `/slack/health`, `/slack/test-config`
- `event_handler.py` — Service class routing events to type-specific handlers
- `__init__.py` — Module initialization

## Supported Events

`message`, `app_mention`, `reaction_added`, `reaction_removed`, `file_created`, `file_shared` + generic catch-all

## Non-Obvious Behavior

### Signature Verification
All requests verified via HMAC-SHA256 using `SLACK_SIGNING_SECRET`. Requests older than 5 minutes are rejected (replay attack prevention). Invalid signatures return 401.

### Always Returns 200
The endpoint **always** returns `200 OK` regardless of processing outcome — this is intentional to prevent Slack's retry mechanism (3 retries on non-200).

### Multi-Workspace Support
Events are logged to separate files per `team_id`, allowing audit trails per workspace.

### Logging Integration
Uses the existing Slack webhook logging module (`log_success`/`log_error`) to send processing notifications back to Slack channels.

## Environment Variables

```
SLACK_SIGNING_SECRET  — Required for signature verification
SLACK_BOT_TOKEN       — Optional, for making Slack API calls (xoxb-)
SLACK_APP_TOKEN       — Optional, for Socket Mode (xapp-)
```

## Traps

- Endpoint URL for Slack app config: `https://splitlease.pythonanywhere.com/slack/events`
- Bot must be **invited** to a channel to receive events from it (`/invite @botname`)
- Event processing is synchronous — long-running handlers can cause Slack timeouts (must respond within 3 seconds)
- Log directory `logs/slack_events/` must exist and be writable
- After deployment, PythonAnywhere web app must be **manually reloaded** (Web tab → Reload)

## Adding a New Event Handler

1. Add method `_handle_{event_type}_event()` to `event_handler.py`
2. Add routing in `process_event()`: `elif event_type == '{type}': return self._handle_{type}_event(...)`
