# Twilio SMS Mocking Opportunity Report
**Generated:** 2026-01-26T11:36:42Z
**Codebase:** Split Lease

## Executive Summary
- SMS sending functions found: **12**
- Functions needing mock coverage: **12**
- MSW handlers exist: **No**
- Module mocks exist: **No**
- `sentMessages` capture array exists: **No**

## Infrastructure Check

### SMS Mock Setup Status
- [ ] `twilioHandlers.ts` MSW handlers exist
- [ ] `__mocks__/twilio.ts` module mock exists
- [ ] `sentMessages` capture array exists
- [ ] `clearSentMessages()` helper exists
- [ ] Error response mocks configured
- [ ] `setupTests.ts` with MSW integration configured

## Critical Gaps (No Mocking)

### 1. Core SMS Edge Function (`send-sms`)
- **File:** `supabase/functions/send-sms/index.ts`
- **Function:** `handleSend()` (lines 98-147)
- **Twilio Usage:** Direct Twilio API call via `sendSms()` at line 130
- **Twilio Client:** `supabase/functions/send-sms/lib/twilioClient.ts`
- **Missing Mock Coverage:**
  - [ ] MSW handler for Twilio Messages API
  - [ ] Message SID generation mock
  - [ ] E.164 phone validation tests
  - [ ] Authentication error tests
  - [ ] Invalid phone number handling

### 2. Emergency SMS Handler
- **File:** `supabase/functions/emergency/handlers/sendSMS.ts`
- **Function:** `handleSendSMS()` (lines 22-124)
- **Twilio Usage:** Direct API call via `sendTwilioSMS()` at line 84
- **Missing Mock Coverage:**
  - [ ] Emergency SMS delivery tests
  - [ ] Database logging (emergency_message table) tests
  - [ ] Twilio SID capture tests
  - [ ] Failure status update tests
  - [ ] Invalid emergency ID handling

### 3. Magic Link SMS Handler
- **File:** `supabase/functions/auth-user/handlers/sendMagicLinkSms.ts`
- **Function:** `handleSendMagicLinkSms()` (lines 114-197)
- **Twilio Usage:** Direct API call via `sendSmsViaTwilio()` at line 171
- **Missing Mock Coverage:**
  - [ ] Magic link SMS delivery tests
  - [ ] E.164 phone format validation tests
  - [ ] Message content assertion (magic link URL)
  - [ ] Supabase Auth generateLink integration tests
  - [ ] SMS delivery failure handling

### 4. Virtual Meeting Messaging Helpers
- **File:** `supabase/functions/_shared/vmMessagingHelpers.ts`
- **Function:** `sendSms()` (lines 169-215)
- **Twilio Usage:** Direct Twilio API call at lines 191-205
- **Used By:** `sendVMRequestMessages()`, `sendVMAcceptMessages()`
- **Missing Mock Coverage:**
  - [ ] VM request SMS notification tests
  - [ ] VM accept SMS notification tests
  - [ ] Guest notification tests
  - [ ] Host notification tests
  - [ ] Invalid phone format skipping tests

### 5. Notification Helpers
- **File:** `supabase/functions/_shared/notificationHelpers.ts`
- **Function:** `sendProposalSms()` (lines 172-216)
- **Twilio Usage:** Calls `send-sms` Edge Function at line 188
- **Missing Mock Coverage:**
  - [ ] Proposal SMS notification tests
  - [ ] Fire-and-forget behavior verification
  - [ ] SMS body content tests
  - [ ] Error logging (non-blocking) tests

### 6. Reminder Scheduler
- **File:** `supabase/functions/reminder-scheduler/lib/scheduler.ts`
- **Function:** `sendSmsNotification()` (lines 74-107)
- **Twilio Usage:** Calls `send-sms` Edge Function via `supabase.functions.invoke()`
- **Missing Mock Coverage:**
  - [ ] Scheduled reminder SMS tests
  - [ ] Message SID capture tests
  - [ ] Error handling with retry support
  - [ ] Delivery status determination tests

### 7. Admin Send Reminder
- **File:** `supabase/functions/messages/handlers/adminSendReminder.ts`
- **Function:** `sendReminderSms()` (lines 139-192)
- **Twilio Usage:** Direct Twilio API call at lines 164-178
- **Missing Mock Coverage:**
  - [ ] Admin reminder SMS delivery tests
  - [ ] Phone number formatting (E.164) tests
  - [ ] Twilio error response handling
  - [ ] Thread-based SMS content tests

### 8. Date Change Request Notifications
- **File:** `supabase/functions/date-change-request/handlers/notifications.ts`
- **Function:** `sendSmsNotification()` (lines 453-515)
- **Twilio Usage:** Calls `send-sms` Edge Function at lines 494-509
- **Missing Mock Coverage:**
  - [ ] Date change SUBMITTED SMS tests
  - [ ] Date change ACCEPTED SMS tests
  - [ ] Date change REJECTED SMS tests
  - [ ] Requester vs receiver perspective tests
  - [ ] Notification preference checking tests

### 9. Lease Notifications
- **File:** `supabase/functions/lease/handlers/notifications.ts`
- **Functions:** `sendGuestSms()` (lines 199-230), `sendHostSms()` (lines 235-267)
- **Twilio Usage:** Calls `send-sms` Edge Function
- **Missing Mock Coverage:**
  - [ ] Lease creation guest SMS tests
  - [ ] Lease creation host SMS tests
  - [ ] Agreement number in message tests
  - [ ] Guest name personalization tests
  - [ ] Notification preference checking tests

### 10. House Manual Initiate Call (Stub)
- **File:** `supabase/functions/house-manual/handlers/initiateCall.ts`
- **Function:** `handleInitiateCall()` (lines 46-129)
- **Twilio Usage:** Stub implementation (TODO at line 114)
- **Missing Mock Coverage:**
  - [ ] Call initiation stub behavior tests
  - [ ] Twilio credentials check tests
  - [ ] "unavailable" status when not configured tests
  - [ ] Phone number validation tests

### 11. Simulation Guest Step E (Mock-only)
- **File:** `supabase/functions/simulation-guest/actions/stepEHostSms.ts`
- **Function:** `handleStepE()` (lines 24-53)
- **Twilio Usage:** None (returns mock data)
- **Notes:** This is simulation-only, returns mock message data

### 12. Magic Login Links Send Magic Link
- **File:** `supabase/functions/magic-login-links/handlers/sendMagicLink.ts`
- **Function:** Reuses `handleSendMagicLinkSms()` at line 155
- **Missing Mock Coverage:**
  - [ ] Admin magic link SMS delivery tests
  - [ ] Phone override functionality tests
  - [ ] Audit logging tests

## Message Template Gaps

### Templates Without Tests
| Template Type | File | Content Tested |
|---------------|------|----------------|
| VM Request SMS | vmMessagingHelpers.ts | No |
| VM Accept SMS | vmMessagingHelpers.ts | No |
| Proposal SMS | notificationHelpers.ts | No |
| Reminder SMS | scheduler.ts | No |
| Emergency SMS | emergency/sendSMS.ts | No |
| Magic Link SMS | sendMagicLinkSms.ts | No |
| Date Change SMS | date-change-request/notifications.ts | No |
| Lease SMS | lease/notifications.ts | No |
| Admin Reminder SMS | adminSendReminder.ts | No |

### Missing Template Tests
- [ ] Character limit validation (160 chars for single SMS)
- [ ] Long message truncation or multi-part SMS
- [ ] Date formatting (EST timezone)
- [ ] Price/amount formatting
- [ ] URL shortening for magic links

## Service Tests with Good Coverage (Reference)

**None found.** The codebase currently has no Twilio SMS mock infrastructure.

The only test file found was:
- `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js` (unrelated to SMS)

No `__mocks__` directories or MSW handlers exist for Twilio mocking.

## Recommended MSW Handler

```typescript
// src/mocks/twilioHandlers.ts
import { http, HttpResponse } from 'msw'

export interface SentMessage {
  to: string
  body: string
  from: string
  timestamp: string
}

export const sentMessages: SentMessage[] = []

export function clearSentMessages() {
  sentMessages.length = 0
}

export function getLastSentMessage(): SentMessage | undefined {
  return sentMessages[sentMessages.length - 1]
}

// Test phone numbers that trigger specific behaviors
const TEST_PHONE_INVALID = '+15551234567'
const TEST_PHONE_UNDELIVERABLE = '+15559999999'

export const twilioHandlers = [
  // Twilio Messages API
  http.post(
    'https://api.twilio.com/2010-04-01/Accounts/:accountSid/Messages.json',
    async ({ request, params }) => {
      const formData = await request.formData()
      const to = formData.get('To') as string
      const body = formData.get('Body') as string
      const from = formData.get('From') as string

      // Simulate invalid phone number
      if (to === TEST_PHONE_INVALID) {
        return HttpResponse.json(
          {
            code: 21211,
            message: "The 'To' number is not a valid phone number",
            more_info: 'https://www.twilio.com/docs/errors/21211',
            status: 400,
          },
          { status: 400 }
        )
      }

      // Simulate undeliverable number
      if (to === TEST_PHONE_UNDELIVERABLE) {
        return HttpResponse.json(
          {
            code: 21608,
            message: 'The number is undeliverable',
            status: 400,
          },
          { status: 400 }
        )
      }

      // Success case
      const messageSid = `SM${Date.now()}${Math.random().toString(36).slice(2, 8)}`

      sentMessages.push({
        to,
        body,
        from,
        timestamp: new Date().toISOString(),
      })

      return HttpResponse.json(
        {
          sid: messageSid,
          account_sid: params.accountSid,
          to,
          from,
          body,
          status: 'queued',
          date_created: new Date().toISOString(),
          date_sent: null,
          date_updated: new Date().toISOString(),
          direction: 'outbound-api',
          price: null,
          price_unit: 'USD',
        },
        { status: 201 }
      )
    }
  ),
]
```

## Recommended Module Mock (Deno)

```typescript
// supabase/functions/_mocks/twilioMock.ts

export interface SentMessage {
  to: string
  body: string
  from: string
}

export const sentMessages: SentMessage[] = []

export function clearSentMessages() {
  sentMessages.length = 0
}

/**
 * Mock sendSms function that captures messages for assertions
 */
export function mockSendSms(
  _accountSid: string,
  _authToken: string,
  requestBody: URLSearchParams
): Promise<{ statusCode: number; body: Record<string, unknown> }> {
  const to = requestBody.get('To') || ''
  const body = requestBody.get('Body') || ''
  const from = requestBody.get('From') || ''

  // Simulate invalid phone
  if (to === '+15551234567') {
    return Promise.resolve({
      statusCode: 400,
      body: { code: 21211, message: 'Invalid phone number' },
    })
  }

  sentMessages.push({ to, body, from })

  return Promise.resolve({
    statusCode: 201,
    body: {
      sid: `SM${Date.now()}`,
      to,
      from,
      body,
      status: 'queued',
    },
  })
}
```

## Test Pattern Examples

### Pattern 1: Test SMS Sent (with MSW)

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { sentMessages, clearSentMessages } from '../mocks/twilioHandlers'
import { sendSmsNotification } from './scheduler'

describe('sendSmsNotification', () => {
  beforeEach(() => {
    clearSentMessages()
  })

  it('sends reminder SMS to guest', async () => {
    const result = await sendSmsNotification(mockSupabase, {
      toPhone: '+14155551234',
      message: 'Your check-in is tomorrow at 3 PM',
    })

    expect(result.success).toBe(true)
    expect(sentMessages).toHaveLength(1)
    expect(sentMessages[0].to).toBe('+14155551234')
    expect(sentMessages[0].body).toContain('check-in is tomorrow')
  })
})
```

### Pattern 2: Test Invalid Phone Number

```typescript
it('handles invalid phone number gracefully', async () => {
  const result = await sendSmsNotification(mockSupabase, {
    toPhone: '+15551234567', // Invalid in mock
    message: 'Test message',
  })

  expect(result.success).toBe(false)
  expect(result.error).toContain('invalid')
  expect(sentMessages).toHaveLength(0)
})
```

### Pattern 3: Test No SMS on Condition

```typescript
it('does not send SMS when user preferences opt out', async () => {
  clearSentMessages()

  const mockUser = {
    ...baseUser,
    'notification preferences': { sms_notifications: false },
  }

  await sendLeaseNotifications(
    mockSupabase,
    mockUser._id,
    hostId,
    leaseId,
    'SL-00001',
    magicLinks
  )

  expect(sentMessages).toHaveLength(0)
})
```

### Pattern 4: Test Message Content

```typescript
it('includes agreement number in lease SMS', async () => {
  clearSentMessages()

  await sendHostSms(supabaseUrl, serviceRoleKey, host, guest, 'SL-12345')

  expect(sentMessages[0].body).toContain('SL-12345')
  expect(sentMessages[0].body).toContain('lease')
})
```

## Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Real Twilio calls in tests | Mock Twilio API with MSW or module mock |
| Not testing message content | Assert on `sentMessages[].body` |
| Ignoring error cases | Test invalid phone numbers, rate limits |
| No message capture | Use `sentMessages` array for assertions |
| Hardcoding Twilio credentials | Use environment variables with test values |
| Testing only happy path | Test SMS opt-out, missing phone, invalid format |

## Priority Recommendations

### High Priority (Core SMS Infrastructure)
1. Create `twilioHandlers.ts` MSW handlers
2. Add mock infrastructure to test setup
3. Test `send-sms` Edge Function (the core SMS gateway)

### Medium Priority (Critical User Flows)
4. Test Magic Link SMS delivery
5. Test Emergency SMS notifications
6. Test Lease creation notifications

### Lower Priority (Notification Channels)
7. Test Virtual Meeting SMS notifications
8. Test Date Change Request SMS
9. Test Admin Reminder SMS

## Implementation Steps

1. **Create mock infrastructure:**
   - `app/src/mocks/twilioHandlers.ts` (MSW handlers)
   - `supabase/functions/_mocks/twilioMock.ts` (Deno module mock)

2. **Update test setup:**
   - Configure MSW server in `setupTests.ts`
   - Add Twilio handlers to server

3. **Write tests for each SMS function:**
   - Start with `send-sms/index.ts` as the foundation
   - Then test functions that call it

4. **Add test utilities:**
   - `clearSentMessages()` helper
   - `getLastSentMessage()` helper
   - Test phone number constants

---

**Generated by:** Twilio SMS Mocking Audit
**Total SMS Functions Identified:** 12
**Mock Coverage Status:** 0% (No mock infrastructure exists)
