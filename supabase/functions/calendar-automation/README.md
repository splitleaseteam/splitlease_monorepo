# Calendar Automation Edge Function

Automates Google Calendar event creation and Google Meet link generation for virtual meetings between hosts, guests, and Split Lease team. Migrated from Python/Flask service.

## Overview

This Edge Function processes confirmed virtual meetings by creating three Google Calendar events (team, guest, host), generating a Google Meet link, and updating the meeting record with event IDs and invite status.

## Architecture

- **Runtime**: Deno 2 (Supabase Edge Functions)
- **Pattern**: Functional Programming (FP) - pure functions, immutable data, fail-fast
- **Auth**: Public (all actions accessible without authentication)
- **External Services**: Google Calendar API via service account
- **Actions**: process_virtual_meeting, health, test_config

## API Endpoints

### POST /functions/v1/calendar-automation

All requests use action-based routing:

```json
{
  "action": "action_name",
  "payload": { ... }
}
```

### Actions

#### 1. `process_virtual_meeting` - Create calendar events with Meet link

**Payload**:
```json
{
  "action": "process_virtual_meeting",
  "payload": {
    "virtualMeetingId": "vm-abc123"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "virtualMeetingId": "vm-abc123",
    "meetLink": "https://meet.google.com/abc-defg-hij",
    "teamEventId": "team_event_id_123",
    "guestEventId": "guest_event_id_456",
    "hostEventId": "host_event_id_789"
  }
}
```

#### 2. `health` - Health check

**Payload**:
```json
{
  "action": "health",
  "payload": {}
}
```

#### 3. `test_config` - Verify Google Calendar configuration

**Payload**:
```json
{
  "action": "test_config",
  "payload": {}
}
```

## Process Virtual Meeting Workflow

1. Validate input (`virtualMeetingId` required)
2. Fetch virtual meeting record from `virtualmeetingschedulesandlinks`
3. Validate record is confirmed and has required fields (guest/host name, email, dates)
4. Normalize dates to ISO 8601
5. Create **team calendar event** with auto-generated Meet link
6. Extract Meet link from team event
7. Update meeting record with Meet link and status (`meet_link_created`)
8. Create **guest calendar event** with existing Meet link
9. Create **host calendar event** with existing Meet link
10. Update meeting record with event IDs and invite flags (`invites_sent`)

## Dependencies

- `_shared/errors.ts` - ValidationError, AuthenticationError
- `_shared/functional/result.ts` - Result type (ok/err)
- `_shared/functional/orchestration.ts` - FP request parsing, action routing
- `_shared/functional/errorLog.ts` - Immutable error log
- `_shared/slack.ts` - Error reporting to Slack
- `lib/googleCalendarService.ts` - Google Calendar API wrapper

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_TEAM_CALENDAR_ID` | Yes | Calendar ID for internal team events |
| `GOOGLE_SERVICE_CALENDAR_ID` | Yes | Calendar ID for guest/host invite events |
| `SUPABASE_URL` | Yes | Supabase project URL (auto-configured) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (auto-configured) |

## Database Table

### virtualmeetingschedulesandlinks (read + updated)

**Key fields read**:
- `guest name`, `guest email`, `host name`, `host email`
- `booked date`, `end of meeting`

**Fields updated**:
- `meeting link`: Google Meet URL
- `team_calendar_event_id`, `guest_calendar_event_id`, `host_calendar_event_id`: Event IDs
- `invitation sent to guest?`, `invitation sent to host?`: Boolean flags
- `guest_invite_sent_at`, `host_invite_sent_at`: Timestamps
- `calendar_status`: `meet_link_created` -> `invites_sent`

## Local Development

```bash
# Start local Supabase
supabase start

# Serve this function
supabase functions serve calendar-automation

# Test health check
curl -X POST http://localhost:54321/functions/v1/calendar-automation \
  -H "Content-Type: application/json" \
  -d '{"action":"health","payload":{}}'

# Test virtual meeting processing
curl -X POST http://localhost:54321/functions/v1/calendar-automation \
  -H "Content-Type: application/json" \
  -d '{"action":"process_virtual_meeting","payload":{"virtualMeetingId":"vm-abc123"}}'
```

## File Structure

```
calendar-automation/
├── index.ts              # Main router (FP orchestration)
├── deno.json             # Import map
├── handlers/
│   ├── processVirtualMeeting.ts  # Main workflow handler
│   ├── health.ts                 # Health check
│   └── testConfig.ts             # Config verification
└── lib/
    ├── types.ts                   # Type definitions
    ├── validators.ts              # Input validation
    └── googleCalendarService.ts   # Google Calendar API wrapper
```

## Critical Notes

- **All actions are public** - No authentication required (triggered by internal systems)
- **No fallback logic** - Errors fail fast
- **Three calendar events created per meeting** - Team (with Meet link generation), guest, host
- **Timezone**: All events created in `America/New_York`
- **Service account limitation** - `sendUpdates: 'none'` because service accounts cannot send calendar invite emails
- **Migrated from Python/Flask** - Originally the `bubble_trigger` endpoint in the calendar automation service

---

**Version**: 1.0.0
**Date**: 2026-02-12
**Pattern**: Calendar Automation (FP Orchestration)
