# Calendar Automation Migration Implementation Plan

## Executive Summary

Migrate Python/Flask calendar automation service to TypeScript/Supabase Edge Functions. The service handles Google Calendar event creation with Google Meet links for virtual meetings between guests and hosts.

**Source**: Python/Flask service (349 lines routes.py, 372 lines google_calendar_service.py, 190 lines bubble_service.py, 194 lines google_calendar_oauth.py)

**Target**: Supabase Edge Functions (Deno/TypeScript) + React internal page

**Key Changes**:
- Bubble.io API → Supabase PostgreSQL
- Flask endpoints → Supabase Edge Functions
- Python google-auth → Deno Google Calendar API
- Standalone service → Integrated with Split Lease codebase

---

## 1. Database Schema Changes

### 1.1 Add Fields to `virtualmeetingschedulesandlinks` Table

The existing virtual meeting table already has most required fields. Add missing fields:

```sql
-- Migration: 20260128_calendar_automation_fields.sql

-- Add Google Calendar event IDs for tracking
ALTER TABLE "virtualmeetingschedulesandlinks"
ADD COLUMN IF NOT EXISTS "team_calendar_event_id" text,
ADD COLUMN IF NOT EXISTS "guest_calendar_event_id" text,
ADD COLUMN IF NOT EXISTS "host_calendar_event_id" text;

-- Add calendar invite sent timestamps
ALTER TABLE "virtualmeetingschedulesandlinks"
ADD COLUMN IF NOT EXISTS "guest_invite_sent_at" timestamptz,
ADD COLUMN IF NOT EXISTS "host_invite_sent_at" timestamptz;

-- Add calendar processing status
ALTER TABLE "virtualmeetingschedulesandlinks"
ADD COLUMN IF NOT EXISTS "calendar_status" text DEFAULT 'pending'
CHECK ("calendar_status" IN ('pending', 'meet_link_created', 'invites_sent', 'failed'));

-- Add error tracking
ALTER TABLE "virtualmeetingschedulesandlinks"
ADD COLUMN IF NOT EXISTS "calendar_error_message" text;

-- Index for processing queue
CREATE INDEX IF NOT EXISTS "idx_virtual_meetings_calendar_status"
ON "virtualmeetingschedulesandlinks"("calendar_status", "confirmedBySplitLease");

-- Comment columns
COMMENT ON COLUMN "virtualmeetingschedulesandlinks"."team_calendar_event_id" IS 'Google Calendar event ID for team calendar (with Meet link)';
COMMENT ON COLUMN "virtualmeetingschedulesandlinks"."guest_calendar_event_id" IS 'Google Calendar event ID for guest invite';
COMMENT ON COLUMN "virtualmeetingschedulesandlinks"."host_calendar_event_id" IS 'Google Calendar event ID for host invite';
COMMENT ON COLUMN "virtualmeetingschedulesandlinks"."calendar_status" IS 'Calendar automation processing status';
COMMENT ON COLUMN "virtualmeetingschedulesandlinks"."calendar_error_message" IS 'Error details if calendar processing failed';
```

---

## 2. Edge Function Architecture

### 2.1 Create New Edge Function: `calendar-automation`

**Location**: `supabase/functions/calendar-automation/index.ts`

**Actions**:
- `process_virtual_meeting` - Main webhook handler (replaces Flask `/webhook/bubble-trigger`)
- `health` - Health check endpoint
- `test_config` - Configuration verification

### 2.2 Google Calendar Service (TypeScript)

**Location**: `supabase/functions/calendar-automation/lib/googleCalendarService.ts`

**Key Functions**:
- `createEventWithMeet()` - Create event with Google Meet link
- `createEventWithExistingMeet()` - Create event using existing Meet link
- `extractMeetLink()` - Extract Meet URL from event
- `getEvent()` - Retrieve event by ID
- `deleteEvent()` - Delete event
- `updateEvent()` - Update event

**Authentication Strategy**:
- Use OAuth 2.0 for Gmail accounts (recommended - can create real Meet links)
- Fallback to service account for Workspace accounts
- Store OAuth tokens in Supabase secrets

### 2.3 Service Structure

```
supabase/functions/calendar-automation/
├── index.ts                    # Main router (FP architecture)
├── deno.json                   # Import map
├── handlers/
│   ├── processVirtualMeeting.ts    # Main workflow handler
│   ├── health.ts                   # Health check
│   └── testConfig.ts               # Config verification
├── lib/
│   ├── googleCalendarService.ts    # Google Calendar API wrapper
│   ├── types.ts                    # Type definitions
│   ├── validators.ts               # Input validation
│   └── errorHandling.ts            # Error utilities
└── _shared/                        # Use existing shared utilities
    ├── functional/result.ts
    ├── functional/orchestration.ts
    └── slack.ts
```

---

## 3. Google Calendar Integration

### 3.1 Authentication Setup

**Environment Variables** (Supabase Secrets):
```bash
# OAuth 2.0 (preferred - works with free Gmail)
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REFRESH_TOKEN=your-refresh-token

# Service Account (alternative - requires Workspace)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your-private-key

# Calendar IDs
GOOGLE_TEAM_CALENDAR_ID=primary  # For Meet link creation
GOOGLE_SERVICE_CALENDAR_ID=primary  # For invites
```

### 3.2 OAuth Token Management

**Strategy**:
- Store refresh token in Supabase secrets
- Automatically refresh access tokens when expired
- Cache access token in memory for performance

### 3.3 Google Calendar API Wrapper

**Key Implementation Details**:

```typescript
// lib/googleCalendarService.ts

import { GoogleCalendarAPI } from './googleCalendarAPI.ts';

export class GoogleCalendarService {
  private api: GoogleCalendarAPI;

  constructor() {
    const credentials = this.loadCredentials();
    this.api = new GoogleCalendarAPI(credentials);
  }

  async createEventWithMeet(params: CreateEventParams): Promise<CalendarEvent> {
    const event = {
      summary: params.summary,
      description: params.description,
      start: { dateTime: params.startTime },
      end: { dateTime: params.endTime },
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    return await this.api.events.insert({
      calendarId: params.calendarId,
      requestBody: event,
      conferenceDataVersion: 1
    });
  }

  extractMeetLink(event: CalendarEvent): string {
    // Check conferenceData first (Workspace)
    if (event.conferenceData?.entryPoints) {
      const video = event.conferenceData.entryPoints
        .find(ep => ep.entryPointType === 'video');
      if (video?.uri) return video.uri;
    }

    // Check hangoutLink (free Gmail)
    if (event.hangoutLink) return event.hangoutLink;

    throw new Error('No Meet link found in event');
  }
}
```

---

## 4. Internal Page: Virtual Meeting Calendar Manager

### 4.1 Page Structure

**Location**: `app/src/islands/pages/InternalVirtualMeetingCalendarPage/`

**Files**:
```
InternalVirtualMeetingCalendarPage/
├── InternalVirtualMeetingCalendarPage.jsx  # Hollow component
├── useInternalVirtualMeetingCalendarPageLogic.js  # Business logic
├── components/
│   ├── MeetingList.jsx          # List of meetings needing calendar invites
│   ├── MeetingCard.jsx          # Single meeting card
│   ├── ConfirmModal.jsx         # Confirmation before sending invites
│   ├── StatusDisplay.jsx        # Calendar automation status
│   └── ErrorDisplay.jsx         # Error details
└── InternalVirtualMeetingCalendarPage.css
```

### 4.2 Route Configuration

**Add to** `app/src/routes.config.js`:
```javascript
{
  path: '/_internal/virtual-meeting-calendar',
  file: 'internal-virtual-meeting-calendar.html',
  aliases: ['/_internal/virtual-meeting-calendar.html'],
  protected: false,
  cloudflareInternal: true,
  internalName: 'virtual-meeting-calendar-view',
  hasDynamicSegment: false
}
```

### 4.3 HTML Entry Point

**Create** `app/public/internal-virtual-meeting-calendar.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Virtual Meeting Calendar - Split Lease Internal</title>
  <link rel="icon" type="image/png" href="/assets/images/split-lease-purple-circle.png">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/internal-virtual-meeting-calendar.jsx"></script>
</body>
</html>
```

### 4.4 JSX Entry Point

**Create** `app/src/internal-virtual-meeting-calendar.jsx`:
```javascript
import React from 'react';
import { createRoot } from 'react-dom/client';
import InternalVirtualMeetingCalendarPage from './src/islands/pages/InternalVirtualMeetingCalendarPage/InternalVirtualMeetingCalendarPage.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<InternalVirtualMeetingCalendarPage />);
```

---

## 5. Implementation Steps

### Phase 1: Database & Configuration (Day 1)

**Step 1.1**: Create database migration
- Create `supabase/migrations/20260128_calendar_automation_fields.sql`
- Add calendar event ID fields to virtual meeting table
- Add status tracking fields
- Run migration locally: `supabase db reset`

**Step 1.2**: Set up Google Cloud Console
- Create OAuth 2.0 client ID (if using OAuth)
- Enable Calendar API
- Generate refresh token
- Configure calendar IDs

**Step 1.3**: Configure Supabase secrets
- Add Google OAuth credentials
- Add calendar IDs
- Test configuration

### Phase 2: Edge Function Core (Day 2-3)

**Step 2.1**: Create calendar-automation function structure
- Create directory: `supabase/functions/calendar-automation/`
- Create `deno.json` import map
- Create `index.ts` main router following FP architecture pattern

**Step 2.2**: Implement Google Calendar service
- Create `lib/googleCalendarService.ts`
- Implement OAuth token refresh logic
- Implement `createEventWithMeet()` method
- Implement `extractMeetLink()` method

**Step 2.3**: Implement handlers
- Create `handlers/processVirtualMeeting.ts`
- Create `handlers/health.ts`
- Create `handlers/testConfig.ts`

**Step 2.4**: Test locally
- `supabase functions serve calendar-automation`
- Test health endpoint
- Test config verification

### Phase 3: Main Workflow (Day 4-5)

**Step 3.1**: Implement processVirtualMeeting handler
```typescript
// handlers/processVirtualMeeting.ts

export async function handleProcessVirtualMeeting(
  payload: ProcessVirtualMeetingPayload,
  user: AuthenticatedUser | null,
  supabase: SupabaseClient
): Promise<ProcessVirtualMeetingResponse> {

  // 1. Validate input
  const validated = validateVirtualMeetingInput(payload);
  if (!validated.ok) throw validated.error;

  // 2. Fetch virtual meeting record
  const meeting = await fetchVirtualMeeting(validated.value.virtualMeetingId, supabase);
  if (!meeting) throw new ValidationError('Virtual meeting not found');

  // 3. Normalize dates to ISO 8601
  const startTime = normalizeDateTime(meeting.booked_date);
  const endTime = normalizeDateTime(meeting.end_of_meeting);

  // 4. Create team calendar event with Meet link
  const calendarService = new GoogleCalendarService();
  const teamEvent = await calendarService.createEventWithMeet({
    calendarId: Deno.env.get('GOOGLE_TEAM_CALENDAR_ID'),
    summary: `Virtual Meeting: ${meeting.guest_name} & ${meeting.host_name}`,
    description: `Split Lease virtual meeting`,
    startTime,
    endTime
  });

  // 5. Extract Meet link
  const meetLink = calendarService.extractMeetLink(teamEvent);

  // 6. Update virtual meeting with Meet link
  await updateVirtualMeeting(meeting._id, {
    meeting_link: meetLink,
    team_calendar_event_id: teamEvent.id,
    calendar_status: 'meet_link_created'
  }, supabase);

  // 7. Create guest calendar event
  const guestEvent = await calendarService.createEventWithExistingMeet({
    calendarId: Deno.env.get('GOOGLE_SERVICE_CALENDAR_ID'),
    summary: `Virtual Meeting: ${meeting.guest_name}`,
    location: meetLink,
    startTime,
    endTime,
    attendees: [{ email: meeting.guest_email, responseStatus: 'accepted' }],
    sendUpdates: 'all'
  });

  // 8. Create host calendar event
  const hostEvent = await calendarService.createEventWithExistingMeet({
    calendarId: Deno.env.get('GOOGLE_SERVICE_CALENDAR_ID'),
    summary: `Virtual Meeting: ${meeting.host_name}`,
    location: meetLink,
    startTime,
    endTime,
    attendees: [{ email: meeting.host_email, responseStatus: 'accepted' }],
    sendUpdates: 'all'
  });

  // 9. Update virtual meeting with event IDs and flags
  await updateVirtualMeeting(meeting._id, {
    guest_calendar_event_id: guestEvent.id,
    host_calendar_event_id: hostEvent.id,
    invitation_sent_to_guest: true,
    invitation_sent_to_host: true,
    guest_invite_sent_at: new Date().toISOString(),
    host_invite_sent_at: new Date().toISOString(),
    calendar_status: 'invites_sent'
  }, supabase);

  return {
    success: true,
    virtualMeetingId: meeting._id,
    meetLink,
    teamEventId: teamEvent.id,
    guestEventId: guestEvent.id,
    hostEventId: hostEvent.id
  };
}
```

**Step 3.2**: Add error handling and logging
- Use existing ErrorCollector pattern from `_shared/slack.ts`
- Log all errors to Slack
- Store error messages in database

**Step 3.3**: Deploy to Supabase
- `supabase functions deploy calendar-automation`
- Test in development environment
- Verify Google Calendar events are created

### Phase 4: Internal Page UI (Day 6-7)

**Step 4.1**: Create page structure
- Create `InternalVirtualMeetingCalendarPage.jsx`
- Create `useInternalVirtualMeetingCalendarPageLogic.js`
- Follow Hollow Component Pattern

**Step 4.2**: Implement logic hook
```javascript
// useInternalVirtualMeetingCalendarPageLogic.js

export function useInternalVirtualMeetingCalendarPageLogic() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch meetings needing calendar invites
  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from('virtualmeetingschedulesandlinks')
      .select('*')
      .eq('confirmedBySplitLease', true)
      .in('calendar_status', ['pending', 'meet_link_created', 'failed'])
      .order('booked_date', { ascending: true });

    if (error) setError(error.message);
    else setMeetings(data);
    setLoading(false);
  };

  // Process calendar invites for selected meeting
  const handleProcessMeeting = async (meetingId) => {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-automation`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'process_virtual_meeting',
          payload: { virtualMeetingId: meetingId }
        })
      }
    );

    if (response.ok) {
      // Refresh list
      await fetchMeetings();
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  return {
    meetings,
    loading,
    error,
    selectedMeeting,
    setSelectedMeeting,
    showConfirmModal,
    setShowConfirmModal,
    handleProcessMeeting,
    fetchMeetings
  };
}
```

**Step 4.3**: Create UI components
- MeetingList component
- MeetingCard component with status badges
- ConfirmModal for confirmation
- StatusDisplay for progress tracking

**Step 4.4**: Add styling
- Create `InternalVirtualMeetingCalendarPage.css`
- Follow existing internal page patterns
- Match design system

### Phase 5: Integration & Testing (Day 8)

**Step 5.1**: Update virtual-meeting function
- Add webhook trigger after meeting confirmation
- Call calendar-automation function automatically
- Or use manual trigger from internal page

**Step 5.2**: End-to-end testing
- Test full workflow: confirm meeting → calendar events created
- Test error scenarios: invalid dates, missing emails, API failures
- Test with real Gmail accounts
- Verify calendar invites arrive in email

**Step 5.3**: Monitor and debug
- Check Edge Function logs
- Verify Google Calendar events
- Test email notifications
- Check database status updates

**Step 5.4**: Deploy to production
- `supabase functions deploy calendar-automation --project-id splitlease-backend-live`
- Update production secrets
- Verify production Google Calendar integration

---

## 6. API Changes & Migration

### 6.1 Webhook Endpoint Migration

**Old Python Endpoint**:
```
POST /webhook/bubble-trigger
```

**New Supabase Edge Function**:
```
POST /functions/v1/calendar-automation
{
  "action": "process_virtual_meeting",
  "payload": {
    "virtualMeetingId": "string"
  }
}
```

### 6.2 Response Format

**Python Response**:
```json
{
  "status": "success",
  "meeting_link": "https://meet.google.com/xxx",
  "thing_id": "123"
}
```

**TypeScript Response**:
```json
{
  "success": true,
  "data": {
    "virtualMeetingId": "123",
    "meetLink": "https://meet.google.com/xxx",
    "teamEventId": "event1",
    "guestEventId": "event2",
    "hostEventId": "event3"
  }
}
```

---

## 7. Error Handling & Monitoring

### 7.1 Error Handling Strategy

**Use Existing Patterns**:
- `_shared/errors.ts` for custom error classes
- `_shared/functional/errorLog.ts` for error collection
- `_shared/slack.ts` for Slack notifications

**Error Types**:
- `ValidationError` - Invalid input data
- `GoogleCalendarError` - Google Calendar API failures
- `DatabaseError` - Supabase query failures

### 7.2 Logging

**Console Logging**:
- All major steps logged with `[calendar-automation]` prefix
- Include correlation IDs for request tracing

**Slack Notifications**:
- Failures sent to `#database` channel
- Include full error context
- Use existing ErrorCollector pattern

### 7.3 Monitoring

**Metrics to Track**:
- Processing time per meeting
- Success/failure rate
- Google Calendar API quota usage
- Error types and frequency

---

## 8. Security Considerations

### 8.1 Authentication

**Edge Function**:
- Use service role key for database operations
- Validate user context if provided
- Rate limiting for API calls

**Google Calendar API**:
- OAuth 2.0 tokens stored in Supabase secrets
- Automatic token refresh
- Token rotation support

### 8.2 Authorization

**Internal Page**:
- Route protection via `/_internal/` path
- No auth required (internal tool)
- Access logged

### 8.3 Input Validation

**Validate All Inputs**:
- Virtual meeting ID exists
- Meeting is confirmed (`confirmedBySplitLease = true`)
- Dates are valid and in future
- Email addresses are valid format

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Google Calendar Service**:
- Test Meet link creation
- Test Meet link extraction
- Test event CRUD operations
- Test OAuth token refresh

**Validators**:
- Test input validation
- Test date normalization
- Test email validation

### 9.2 Integration Tests

**Edge Function**:
- Test full workflow with mock Google Calendar
- Test error scenarios
- Test database updates

**Internal Page**:
- Test UI interactions
- Test API calls
- Test error display

### 9.3 End-to-End Tests

**Full Workflow**:
1. Confirm virtual meeting
2. Trigger calendar automation
3. Verify Google Calendar events created
4. Verify database updated
5. Verify emails sent

---

## 10. Rollout Plan

### 10.1 Phase 1: Development (Week 1)
- Database migration
- Edge Function development
- Internal page development
- Local testing

### 10.2 Phase 2: Staging (Week 2)
- Deploy to development environment
- Test with real Google Calendar
- Fix bugs and refine UX
- Load testing

### 10.3 Phase 3: Production (Week 3)
- Deploy to production
- Monitor for errors
- Gather feedback
- Iterate based on usage

---

## 11. Rollback Plan

### 11.1 Edge Function Rollback
- Disable function in Supabase dashboard
- Revert to manual calendar invite process
- Database remains intact (no destructive changes)

### 11.2 Database Rollback
- Migration is additive only (new columns)
- Safe to rollback without data loss
- Existing virtual meetings unaffected

---

## 12. Future Enhancements

### 12.1 Automated Triggers
- Auto-trigger after meeting confirmation
- Remove need for manual internal page

### 12.2 Batch Processing
- Process multiple meetings at once
- Scheduled cron job for pending meetings

### 12.3 Enhanced Notifications
- SMS notifications for meeting reminders
- Slack notifications for team

### 12.4 Analytics
- Track meeting attendance
- Calendar invite acceptance rates
- Meeting duration analysis

---

## 13. Dependencies

### 13.1 External Services
- Google Calendar API
- Google OAuth 2.0
- Supabase Edge Functions

### 13.2 Internal Dependencies
- `supabase/functions/_shared/functional/*`
- `supabase/functions/_shared/slack.ts`
- `supabase/functions/_shared/errors.ts`
- `app/src/lib/supabase.js` (frontend)

### 13.3 NPM/JSR Packages
- `@supabase/supabase-js@2`
- Google Calendar API (via REST or Deno-compatible library)

---

## 14. Estimated Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| Phase 1 | Database & Config | 1 day |
| Phase 2 | Edge Function Core | 2 days |
| Phase 3 | Main Workflow | 2 days |
| Phase 4 | Internal Page UI | 2 days |
| Phase 5 | Integration & Testing | 1 day |
| **Total** | | **8 days** |

---

## 15. Success Criteria

### 15.1 Functional Requirements
- [x] Google Meet links created successfully
- [x] Calendar events created for guest and host
- [x] Email invitations sent via Google Calendar
- [x] Database updated with event IDs and flags
- [x] Internal page displays meeting status
- [x] Error handling and logging works

### 15.2 Non-Functional Requirements
- [x] Response time < 5 seconds per meeting
- [x] 99% success rate for calendar operations
- [x] Zero data loss (all events tracked)
- [x] Secure credential storage
- [x] Comprehensive error monitoring

---

### Critical Files for Implementation

Based on this migration plan, here are the most critical files for implementation:

- **supabase/functions/virtual-meeting/index.ts** - Reference for Edge Function FP architecture pattern
- **supabase/functions/_shared/functional/orchestration.ts** - Core orchestration utilities for request/response handling
- **supabase/functions/_shared/slack.ts** - Error notification pattern
- **app/src/routes.config.js** - Route registry configuration for internal page
- **app/src/islands/pages/InternalEmergencyPage/InternalEmergencyPage.jsx** - Reference for internal page Hollow Component Pattern
