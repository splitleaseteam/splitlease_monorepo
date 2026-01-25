# Slack Events Module

Universal endpoint for receiving and processing Slack event subscriptions.

## Overview

This module provides a centralized endpoint (`/slack/events`) for handling all Slack Events API subscriptions. It supports multiple Slack apps, workspaces, and channels through a single universal endpoint.

## Features

- **URL Verification**: Automatically handles Slack's URL verification challenge
- **Signature Verification**: Validates requests are genuinely from Slack using HMAC-SHA256
- **Universal Routing**: Single endpoint for all Slack apps and channels
- **Event Processing**: Handles multiple event types (messages, reactions, files, etc.)
- **Logging Integration**: Uses existing Slack webhook logging for success/error notifications
- **Event Auditing**: Logs all events to files for debugging and auditing

## Architecture

```
Slack → POST /slack/events
          ↓
    routes.py (validates signature)
          ↓
    event_handler.py (processes event)
          ↓
    logs/slack_events/{team_id}.log (audit trail)
```

## Files

- `routes.py` - Flask blueprint with webhook endpoints
- `event_handler.py` - Service class for processing events
- `__init__.py` - Module initialization
- `README.md` - This file

## Setup Instructions

### 1. Configure Slack App

1. **Go to [Slack API Console](https://api.slack.com/apps)**

2. **Create or Select Your App**

3. **Enable Events API**
   - Navigate to: Features > Event Subscriptions
   - Toggle "Enable Events" to ON
   - Request URL: `https://splitlease.pythonanywhere.com/slack/events`
   - Wait for "Verified" checkmark

4. **Subscribe to Bot Events**
   Add the events you want to receive:
   - `message.channels` - Messages in public channels
   - `message.groups` - Messages in private channels
   - `message.im` - Direct messages to bot
   - `app_mention` - Bot is @mentioned
   - `reaction_added` - Reactions added to messages
   - `reaction_removed` - Reactions removed from messages
   - `file_created` - Files created
   - `file_shared` - Files shared in channels

5. **Get Your Credentials**

   **Signing Secret** (Required):
   - Go to: Basic Information > App Credentials
   - Copy "Signing Secret"
   - Set as `SLACK_SIGNING_SECRET` in environment

   **Bot Token** (Optional, for API interactions):
   - Go to: OAuth & Permissions
   - Copy "Bot User OAuth Token" (starts with `xoxb-`)
   - Set as `SLACK_BOT_TOKEN` in environment

### 2. Set Environment Variables

Add to your `.env` file:

```bash
# Required for signature verification
SLACK_SIGNING_SECRET=your-signing-secret-here

# Optional - for making API calls
SLACK_BOT_TOKEN=xoxb-your-bot-token-here

# Optional - for Socket Mode
SLACK_APP_TOKEN=xapp-your-app-token-here
```

### 3. Deploy to PythonAnywhere

```bash
# Pull latest code
cd /home/SplitLease/mysite
git pull origin main

# Install dependencies (slack-sdk already in requirements.txt)
pip3 install --user -r requirements.txt

# Set environment variables (via Web tab or .env file)
# See step 2 above

# Reload web app
# Web tab → Click "Reload"
```

### 4. Test the Setup

**Test URL Verification:**
```bash
curl https://splitlease.pythonanywhere.com/slack/health
# Expected: {"status": "healthy", "service": "Slack Events"}
```

**Test Configuration:**
```bash
curl https://splitlease.pythonanywhere.com/slack/test-config
# Expected: {"status": "ok", "configuration": {...}}
```

**Test from Slack:**
- Post a message in a channel where the bot is installed
- Check PythonAnywhere logs: `/var/log/SplitLease.pythonanywhere.com.error.log`
- Check event log: `logs/slack_events/{team_id}.log`

## Endpoint Reference

### POST `/slack/events`

Main endpoint for receiving Slack events.

**Request Headers:**
- `X-Slack-Signature` - HMAC-SHA256 signature for verification
- `X-Slack-Request-Timestamp` - Unix timestamp of request
- `Content-Type: application/json`

**Request Body:**
```json
{
  "type": "event_callback",
  "team_id": "T1234567890",
  "api_app_id": "A1234567890",
  "event": {
    "type": "message",
    "channel": "C1234567890",
    "user": "U1234567890",
    "text": "Hello, bot!",
    "ts": "1234567890.123456"
  }
}
```

**Response:**
- `200 OK` - Always returns 200 to prevent Slack retries
- Body: `{"status": "ok"}`

### GET `/slack/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "Slack Events"
}
```

### GET `/slack/test-config`

Configuration validation endpoint.

**Response:**
```json
{
  "status": "ok",
  "configuration": {
    "slack_signing_secret": true,
    "slack_bot_token": true,
    "slack_app_token": false
  },
  "message": "Signing secret configured"
}
```

## Supported Event Types

The handler currently supports:

- **`message`** - Channel/DM messages
- **`app_mention`** - Bot @mentions
- **`reaction_added`** - Emoji reactions added
- **`reaction_removed`** - Emoji reactions removed
- **`file_created`** - Files created
- **`file_shared`** - Files shared in channels
- **Generic handler** - Catches all other event types

## Event Processing Flow

1. **Receive Event** → `routes.py:handle_events()`
2. **Verify Signature** → `routes.py:verify_slack_signature()`
3. **Handle URL Verification** → Returns challenge if `type == 'url_verification'`
4. **Route to Handler** → `event_handler.py:process_event()`
5. **Process Event** → Specific handler method (e.g., `_handle_message_event()`)
6. **Log Event** → `_log_event_to_file()` writes to `logs/slack_events/{team_id}.log`
7. **Send Webhook** → Uses `log_success()` to notify Slack channel

## Security

### Signature Verification

All requests are verified using HMAC-SHA256:

```python
sig_basestring = f"v0:{timestamp}:{request_body}"
expected_signature = 'v0=' + hmac.new(
    signing_secret.encode(),
    sig_basestring.encode(),
    hashlib.sha256
).hexdigest()
```

- Requests older than 5 minutes are rejected
- Invalid signatures return 401 Unauthorized
- Prevents replay attacks and unauthorized requests

### Best Practices

- ✅ **Never commit** `SLACK_SIGNING_SECRET` to git
- ✅ **Always verify** signatures in production
- ✅ **Use HTTPS** for all webhook endpoints
- ✅ **Rotate secrets** periodically
- ✅ **Monitor logs** for suspicious activity

## Multi-App/Multi-Channel Support

The module is designed to handle events from multiple:

- **Slack Apps** - Identified by `api_app_id`
- **Workspaces** - Identified by `team_id`
- **Channels** - Identified by `channel_id`

All events are logged separately per team/workspace for easy auditing.

## Logging

### Application Logs
PythonAnywhere error log:
```bash
tail -f /var/log/SplitLease.pythonanywhere.com.error.log
```

### Event Audit Logs
Per-workspace event logs:
```bash
tail -f logs/slack_events/T1234567890.log
```

### Slack Webhook Notifications
Events trigger notifications via existing logging module:
- Success events → `log_success()` → Success webhook
- Error events → `log_error()` → Error webhook

## Customization

### Adding Custom Event Handlers

Edit `event_handler.py` and add a new method:

```python
def _handle_custom_event(self, event_data, team_id, api_app_id, channel_id):
    """Handle custom event type"""
    try:
        # Your custom logic here
        logger.info(f"Custom event: {event_data}")

        # Log to Slack
        log_success(f"Custom Event - Team: {team_id}")

        return {'status': 'success', 'message': 'Custom event processed'}
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return {'status': 'error', 'message': str(e)}
```

Then add routing in `process_event()`:

```python
elif event_type == 'custom_event':
    return self._handle_custom_event(event_data, team_id, api_app_id, channel_id)
```

### Channel-Specific Routing

Add channel filtering in event handlers:

```python
def _handle_message_event(self, event_data, team_id, api_app_id, channel_id):
    if channel_id == 'C_SPECIFIC_CHANNEL':
        # Handle messages from specific channel
        pass
    elif channel_id.startswith('D'):
        # Handle direct messages
        pass
    else:
        # Handle all other channels
        pass
```

## Troubleshooting

### URL Verification Fails

**Problem:** Slack shows "Your URL didn't respond with the challenge"

**Solution:**
1. Check endpoint is accessible: `curl https://splitlease.pythonanywhere.com/slack/events`
2. Check PythonAnywhere logs for errors
3. Verify blueprint is registered in `app.py`
4. Ensure web app is reloaded after deployment

### Events Not Received

**Problem:** Events aren't being received after URL verification

**Solution:**
1. Check bot is invited to channel: `/invite @botname`
2. Verify event subscriptions are configured in Slack app
3. Check required OAuth scopes are added
4. Monitor logs: `tail -f /var/log/SplitLease.pythonanywhere.com.error.log`

### Signature Verification Fails

**Problem:** Logs show "Invalid Slack signature"

**Solution:**
1. Verify `SLACK_SIGNING_SECRET` is set correctly
2. Check for whitespace in environment variable
3. Ensure signing secret matches Slack app settings
4. Check system time is synchronized (required for timestamp validation)

### Events Not Logged

**Problem:** Events received but not appearing in audit logs

**Solution:**
1. Check `logs/slack_events/` directory exists and is writable
2. Verify team_id is extracted correctly
3. Check disk space on PythonAnywhere

## Performance Considerations

- **Response Time**: Always returns 200 OK within 3 seconds
- **Processing**: Events are processed synchronously (add async if needed)
- **Retries**: Slack retries failed events up to 3 times
- **Rate Limits**: No rate limiting on this endpoint (handled by Slack)

## Future Enhancements

Potential improvements:

- [ ] Add async event processing with queues
- [ ] Add database storage for events
- [ ] Add event replay functionality
- [ ] Add bot response capabilities
- [ ] Add interactive component support
- [ ] Add slash command support
- [ ] Add modal/dialog support

## Resources

- [Slack Events API Documentation](https://api.slack.com/apis/connections/events-api)
- [Slack Event Types Reference](https://api.slack.com/events)
- [Slack Security Best Practices](https://api.slack.com/authentication/verifying-requests-from-slack)
- [Flask Blueprint Documentation](https://flask.palletsprojects.com/en/2.3.x/blueprints/)

## Support

For issues or questions:
- Check PythonAnywhere logs
- Review Slack API console for errors
- Check event audit logs in `logs/slack_events/`

---

**Module Version:** 1.0
**Created:** October 2025
**Author:** SplitLease Development Team
