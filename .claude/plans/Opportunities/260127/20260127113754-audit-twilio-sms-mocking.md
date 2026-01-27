# Twilio SMS Mocking Opportunity Report
**Generated:** 2026-01-27T11:37:54
**Codebase:** Split Lease (React 18 + Vite Islands / Supabase Edge Functions)

## Executive Summary
- SMS sending functions found: **11**
- Functions needing mock coverage: **11** (100%)
- MSW handlers exist: **No**
- Module mocks exist: **No**
- Test infrastructure: **Minimal** (only 1 actual test file in entire codebase)

## Infrastructure Check

### SMS Mock Setup Status
- [ ] `twilioHandlers.ts` MSW handlers exist
- [ ] `__mocks__/twilio.ts` module mock exists
- [ ] `sentMessages` capture array exists
- [ ] `clearSentMessages()` helper exists
- [ ] Error response mocks configured
- [ ] Vitest configuration for mocking external APIs

**Critical Gap:** The codebase has **zero mock infrastructure**. No `__mocks__/` directory exists anywhere in the project. The only test file found is `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js` which tests pure functions, not API integrations.

## Critical Gaps (No Mocking)

### 1. Core Twilio Client (`send-sms` Edge Function)
- **File:** `supabase/functions/send-sms/lib/twilioClient.ts`
- **Functions:**
  - `sendSms()` at line 50 - Main Twilio API call
  - `buildTwilioRequestBody()` at line 22
  - `isSuccessResponse()` at line 99
  - `getMessageSid()` at line 106
- **Twilio Usage:** Direct `fetch()` to `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
- **Missing Mock Coverage:**
  - [ ] MSW handler for Twilio Messages API
  - [ ] Message content assertion
  - [ ] E.164 phone validation tests
  - [ ] HTTP Basic Auth header tests
  - [ ] Error response handling (non-201 status)
  - [ ] Invalid phone number handling (Twilio error 21211)

### 2. Send SMS Edge Function Entry Point
- **File:** `supabase/functions/send-sms/index.ts`
- **Functions:**
  - `handleSend()` at line 98 - SMS send handler
  - `handleHealth()` at line 79 - Health check
- **Missing Mock Coverage:**
  - [ ] Public phone number bypass test ('+14155692985')
  - [ ] Authorization header validation
  - [ ] Payload validation tests
  - [ ] CORS preflight handling

### 3. Emergency SMS Handler
- **File:** `supabase/functions/emergency/handlers/sendSMS.ts`
- **Function:** `handleSendSMS()` at line 22
- **Twilio Usage:** Direct `fetch()` at line 147 (internal `sendTwilioSMS()`)
- **Missing Mock Coverage:**
  - [ ] Emergency ID validation
  - [ ] Message logging to `emergency_message` table
  - [ ] Twilio error handling and status update
  - [ ] Database rollback on Twilio failure

### 4. Magic Link SMS Handler
- **File:** `supabase/functions/auth-user/handlers/sendMagicLinkSms.ts`
- **Function:** `handleSendMagicLinkSms()` at line 114
- **Twilio Usage:** `sendSmsViaTwilio()` at line 66 (internal function)
- **Missing Mock Coverage:**
  - [ ] Magic link generation + SMS atomicity
  - [ ] Phone number E.164 validation
  - [ ] SMS message template test
  - [ ] Supabase Auth integration mock

### 5. Reminder Scheduler SMS
- **File:** `supabase/functions/reminder-scheduler/lib/scheduler.ts`
- **Function:** `sendSmsNotification()` at line 74
- **Twilio Usage:** Invokes `send-sms` Edge Function via `supabase.functions.invoke()`
- **Missing Mock Coverage:**
  - [ ] Reminder processing batch tests
  - [ ] Guest contact info lookup
  - [ ] Delivery status determination
  - [ ] Fallback phone number handling

### 6. Notification Helpers (Proposals)
- **File:** `supabase/functions/_shared/notificationHelpers.ts`
- **Function:** `sendProposalSms()` at line 172
- **Twilio Usage:** Fire-and-forget `fetch()` to `send-sms` endpoint
- **Missing Mock Coverage:**
  - [ ] Notification preference check tests
  - [ ] Fire-and-forget behavior verification
  - [ ] Phone number masking in logs

### 7. Virtual Meeting Messaging
- **File:** `supabase/functions/_shared/vmMessagingHelpers.ts`
- **Function:** `sendSms()` at line 169 (internal)
- **Twilio Usage:** Direct `fetch()` to Twilio API at line 194
- **Missing Mock Coverage:**
  - [ ] VM request SMS (host/guest)
  - [ ] VM accept SMS
  - [ ] Phone validation bypass test
  - [ ] Twilio credential check

### 8. Date Change Request Notifications
- **File:** `supabase/functions/date-change-request/handlers/notifications.ts`
- **Function:** `sendSmsNotification()` at line 453
- **Twilio Usage:** `fetch()` to `send-sms` endpoint at line 495
- **Missing Mock Coverage:**
  - [ ] E.164 phone formatting tests
  - [ ] Notification preference check
  - [ ] SUBMITTED/ACCEPTED/REJECTED event SMS
  - [ ] isRequester flag handling

### 9. Lease Creation Notifications
- **File:** `supabase/functions/lease/handlers/notifications.ts`
- **Functions:**
  - `sendGuestSms()` at line 199
  - `sendHostSms()` at line 235
- **Twilio Usage:** `fetch()` to `send-sms` endpoint
- **Missing Mock Coverage:**
  - [ ] Guest lease SMS content test
  - [ ] Host lease SMS content test
  - [ ] Agreement number in message
  - [ ] Notification preference check

### 10. Admin Reminder SMS
- **File:** `supabase/functions/messages/handlers/adminSendReminder.ts`
- **Missing Mock Coverage:**
  - [ ] Admin authentication
  - [ ] Reminder message content
  - [ ] Thread association

## Message Template Gaps

### SMS Templates Without Tests
| Template/Message | File | Content Tested |
|------------------|------|----------------|
| Magic link SMS | `auth-user/handlers/sendMagicLinkSms.ts:58` | No |
| Emergency SMS | `emergency/handlers/sendSMS.ts` | No |
| Reminder SMS | `reminder-scheduler/lib/scheduler.ts` | No |
| Proposal SMS | `_shared/notificationHelpers.ts` | No |
| VM Request SMS | `_shared/vmMessagingHelpers.ts` | No |
| VM Accept SMS | `_shared/vmMessagingHelpers.ts` | No |
| Date Change SMS | `date-change-request/handlers/notifications.ts` | No |
| Lease Guest SMS | `lease/handlers/notifications.ts:222` | No |
| Lease Host SMS | `lease/handlers/notifications.ts:259` | No |

### Missing Template Tests
- [ ] Character limit validation (160 chars for single segment)
- [ ] Multi-segment message handling
- [ ] Dynamic content interpolation
- [ ] URL shortening/truncation
- [ ] EST timezone formatting in messages

## Twilio Configuration

### Environment Variables Used
| Variable | Files Using It |
|----------|---------------|
| `TWILIO_ACCOUNT_SID` | `send-sms/index.ts`, `emergency/handlers/sendSMS.ts`, `auth-user/handlers/sendMagicLinkSms.ts`, `_shared/vmMessagingHelpers.ts` |
| `TWILIO_AUTH_TOKEN` | Same as above |
| `TWILIO_PHONE_NUMBER` | `emergency/handlers/sendSMS.ts` |
| `TWILIO_FROM_PHONE` | `_shared/vmMessagingHelpers.ts` |

### Hardcoded Phone Numbers
| Phone Number | Purpose | Files |
|--------------|---------|-------|
| `+14155692985` | Public magic link SMS (no auth required) | `send-sms/index.ts:58`, `auth-user/handlers/sendMagicLinkSms.ts:28`, `reminder-scheduler/lib/scheduler.ts:20`, `_shared/notificationHelpers.ts:166`, `date-change-request/handlers/notifications.ts:56`, `lease/handlers/notifications.ts:222,259` |

## Service Tests with Good Coverage (Reference)

**None.** No SMS-related tests exist in the codebase. The only test file is:
- `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js` - Tests pure matching score calculation

## Recommended MSW Handler

```typescript
// src/mocks/twilioHandlers.ts
import { http, HttpResponse } from 'msw'

export interface SentMessage {
  to: string
  from: string
  body: string
  timestamp: string
}

export const sentMessages: SentMessage[] = []

export function clearSentMessages(): void {
  sentMessages.length = 0
}

export function getLastMessage(): SentMessage | undefined {
  return sentMessages[sentMessages.length - 1]
}

export const twilioHandlers = [
  http.post(
    'https://api.twilio.com/2010-04-01/Accounts/:accountSid/Messages.json',
    async ({ request, params }) => {
      const formData = await request.formData()
      const to = formData.get('To') as string
      const from = formData.get('From') as string
      const body = formData.get('Body') as string

      // Simulate invalid phone number error
      if (to === '+15551234567') {
        return HttpResponse.json(
          {
            code: 21211,
            message: 'The "To" number +15551234567 is not a valid phone number.',
            more_info: 'https://www.twilio.com/docs/errors/21211',
            status: 400,
          },
          { status: 400 }
        )
      }

      // Simulate unverified number error (trial accounts)
      if (to.startsWith('+1555')) {
        return HttpResponse.json(
          {
            code: 21608,
            message: 'The number is unverified. Trial accounts cannot send to unverified numbers.',
            more_info: 'https://www.twilio.com/docs/errors/21608',
            status: 400,
          },
          { status: 400 }
        )
      }

      // Success response
      const messageSid = `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`

      sentMessages.push({
        to,
        from,
        body,
        timestamp: new Date().toISOString(),
      })

      return HttpResponse.json(
        {
          sid: messageSid,
          date_created: new Date().toISOString(),
          date_updated: new Date().toISOString(),
          date_sent: null,
          account_sid: params.accountSid,
          to,
          from,
          messaging_service_sid: null,
          body,
          status: 'queued',
          num_segments: '1',
          num_media: '0',
          direction: 'outbound-api',
          api_version: '2010-04-01',
          price: null,
          price_unit: 'USD',
          error_code: null,
          error_message: null,
          uri: `/2010-04-01/Accounts/${params.accountSid}/Messages/${messageSid}.json`,
        },
        { status: 201 }
      )
    }
  ),
]
```

## Recommended Module Mock (for Deno Edge Functions)

```typescript
// supabase/functions/_test_utils/twilioMock.ts

export interface MockSentMessage {
  to: string
  from: string
  body: string
}

export const mockSentMessages: MockSentMessage[] = []

export function clearMockSentMessages(): void {
  mockSentMessages.length = 0
}

/**
 * Mock fetch for Twilio API in Deno tests
 */
export function createTwilioFetchMock() {
  return async (url: string, options: RequestInit): Promise<Response> => {
    if (url.includes('api.twilio.com') && url.includes('Messages.json')) {
      const body = new URLSearchParams(options.body as string)
      const to = body.get('To') || ''
      const from = body.get('From') || ''
      const messageBody = body.get('Body') || ''

      // Simulate error for test phone number
      if (to === '+15551234567') {
        return new Response(
          JSON.stringify({
            code: 21211,
            message: 'Invalid phone number',
            status: 400,
          }),
          { status: 400 }
        )
      }

      mockSentMessages.push({ to, from, body: messageBody })

      return new Response(
        JSON.stringify({
          sid: `SM${Date.now()}`,
          to,
          from,
          body: messageBody,
          status: 'queued',
        }),
        { status: 201 }
      )
    }

    // Fallback to real fetch for non-Twilio URLs
    return globalThis.fetch(url, options)
  }
}
```

## Recommended Test Patterns

### Pattern 1: Test SMS Sent Successfully

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { sentMessages, clearSentMessages } from '../mocks/twilioHandlers'

describe('Lease Notifications', () => {
  beforeEach(() => {
    clearSentMessages()
  })

  it('sends SMS to guest when lease is created', async () => {
    await sendLeaseNotifications(supabase, guestId, hostId, leaseId, 'SL-00001', magicLinks)

    expect(sentMessages).toHaveLength(2) // Guest + Host
    expect(sentMessages[0].to).toBe('+14155551234')
    expect(sentMessages[0].body).toContain('SL-00001')
    expect(sentMessages[0].body).toContain('lease')
  })
})
```

### Pattern 2: Test Invalid Phone Handling

```typescript
it('handles invalid phone number gracefully', async () => {
  const guestWithInvalidPhone = { ...guest, 'Cell phone number': '+15551234567' }

  // Should not throw, SMS failures are non-blocking
  await expect(
    sendGuestSms(supabaseUrl, serviceRoleKey, guestWithInvalidPhone, 'SL-00001')
  ).resolves.not.toThrow()

  // SMS should not be in sent messages
  expect(sentMessages).toHaveLength(0)
})
```

### Pattern 3: Test Notification Preferences

```typescript
it('respects SMS notification preferences', async () => {
  const userWithSmsDisabled = {
    ...guest,
    'notification preferences': { sms_notifications: false },
  }

  await sendGuestSms(supabaseUrl, serviceRoleKey, userWithSmsDisabled, 'SL-00001')

  expect(sentMessages).toHaveLength(0)
})
```

### Pattern 4: Test Fire-and-Forget Behavior

```typescript
it('does not block on SMS failure', async () => {
  // Force Twilio error
  server.use(
    http.post('https://api.twilio.com/*/Messages.json', () => {
      return HttpResponse.json({ code: 21211 }, { status: 400 })
    })
  )

  const start = Date.now()
  await sendProposalSms({ to: '+15551234567', body: 'Test' })
  const elapsed = Date.now() - start

  // Should complete quickly (fire-and-forget)
  expect(elapsed).toBeLessThan(100)
})
```

## Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Real Twilio calls in tests | Mock Twilio API with MSW |
| Not testing SMS content | Assert message body contains expected text |
| Ignoring error cases | Test invalid numbers, network failures |
| No message capture | Store sent messages for assertions |
| Hardcoded test phones | Use designated test phone patterns |
| Testing with trial account limits | Mock trial account errors |

## Priority Recommendations

### High Priority (Security/Critical Path)
1. **Magic Link SMS** - Authentication flow, must work correctly
2. **Emergency SMS** - Safety-critical notifications
3. **Core `send-sms` function** - Foundation for all other SMS

### Medium Priority (User Experience)
4. **Lease Notifications** - Important business workflow
5. **Date Change Request SMS** - Transaction notifications
6. **Virtual Meeting SMS** - Scheduling confirmations

### Lower Priority (Can be tested manually)
7. **Reminder Scheduler** - Cron-based, less frequently tested
8. **Proposal SMS** - Fire-and-forget notifications
9. **Admin Reminder** - Internal tool

## Implementation Effort Estimate

| Task | Effort |
|------|--------|
| Set up MSW in test environment | 2-4 hours |
| Create twilioHandlers.ts | 1-2 hours |
| Add tests for `send-sms` function | 2-3 hours |
| Add tests for each notification handler | 1-2 hours each |
| Total estimated effort | **15-25 hours** |

## Files Changed

This is an audit document only. No code files were changed.
