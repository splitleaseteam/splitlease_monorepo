# Twilio SMS Mocking Opportunity Report
**Generated:** 2026-01-29T11:39:36
**Codebase:** Split Lease
**Hostname:** thin3

## Executive Summary
- SMS sending functions found: **6**
- Functions needing mock coverage: **6**
- MSW handlers exist: **No**
- Module mocks exist: **No**

## Infrastructure Check

### SMS Mock Setup Status
- [ ] `twilioHandlers.ts` MSW handlers exist
- [ ] `__mocks__/twilio.ts` module mock exists
- [ ] `sentMessages` capture array exists
- [ ] `clearSentMessages()` helper exists
- [ ] Error response mocks configured

**Status: NO SMS MOCK INFRASTRUCTURE EXISTS**

The codebase has no Twilio mocking infrastructure. All SMS functions make real Twilio API calls with no test coverage.

## Critical Gaps (No Mocking)

### 1. Main SMS Edge Function
- **File:** `supabase/functions/send-sms/index.ts`
- **Function:** `handleSend()`
- **Twilio Usage:** Calls `sendSms()` from `twilioClient.ts` at line 130
- **Missing Mock Coverage:**
  - [ ] MSW handler for Twilio Messages API
  - [ ] Message content assertions
  - [ ] E.164 phone validation tests
  - [ ] Invalid phone number handling tests
  - [ ] Missing credentials error tests
  - [ ] Success/failure response tests

### 2. Twilio Client Library
- **File:** `supabase/functions/send-sms/lib/twilioClient.ts`
- **Function:** `sendSms(accountSid, authToken, requestBody)`
- **Twilio Endpoint:** `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
- **Missing Mock Coverage:**
  - [ ] HTTP Basic Auth header test
  - [ ] Form-urlencoded body format test
  - [ ] Response status code handling tests
  - [ ] `isSuccessResponse()` function tests
  - [ ] `getMessageSid()` function tests

### 3. Notification Sender Service
- **File:** `supabase/functions/_shared/notificationSender.ts`
- **Function:** `sendSmsViaEdgeFunction(params)`
- **Twilio Usage:** Calls `send-sms` edge function internally at line 207
- **Missing Mock Coverage:**
  - [ ] SMS sending with preference checking
  - [ ] Audit logging for sent notifications
  - [ ] Audit logging for skipped notifications (user opted out)
  - [ ] Admin override compliance logging
  - [ ] Missing credentials error handling

### 4. Emergency SMS Handler
- **File:** `supabase/functions/emergency/handlers/sendSMS.ts`
- **Function:** `handleSendSMS(payload, user, supabase)`
- **Twilio Usage:** Direct Twilio API call via `sendTwilioSMS()` at line 84
- **Missing Mock Coverage:**
  - [ ] Emergency message log creation (PENDING status)
  - [ ] Twilio API success - message log update (SENT status)
  - [ ] Twilio API failure - message log update (FAILED status)
  - [ ] `twilio_sid` storage verification
  - [ ] Error message logging

### 5. Magic Link SMS Handler
- **File:** `supabase/functions/auth-user/handlers/sendMagicLinkSms.ts`
- **Function:** `sendSmsViaTwilio(toPhone, body)`
- **Twilio Usage:** Direct Twilio API call at lines 89-96
- **Missing Mock Coverage:**
  - [ ] Magic link generation + SMS atomic operation
  - [ ] Phone number validation (E.164 format)
  - [ ] SMS message content test (contains magic link)
  - [ ] 15-minute expiry message content
  - [ ] Invalid phone number rejection

### 6. VM Messaging Helpers (Virtual Meetings)
- **File:** `supabase/functions/_shared/vmMessagingHelpers.ts`
- **Function:** `sendSms(params)` (private helper at line 174)
- **Twilio Usage:** Direct Twilio API call at lines 199-210
- **Missing Mock Coverage:**
  - [ ] Virtual meeting request SMS (host/guest)
  - [ ] Virtual meeting accept SMS (host/guest)
  - [ ] Preference checking for `virtual_meetings` category
  - [ ] SMS skip when user opted out
  - [ ] Invalid phone format handling

### 7. Admin Send Reminder Handler
- **File:** `supabase/functions/messages/handlers/adminSendReminder.ts`
- **Function:** `sendReminderSms(to, recipientName, threadSubject)`
- **Twilio Usage:** Direct Twilio API call at lines 171-185
- **Missing Mock Coverage:**
  - [ ] Phone number formatting (10-digit to E.164)
  - [ ] Message content verification
  - [ ] Notification preference checking (`message_forwarding`)
  - [ ] Admin role verification
  - [ ] Force override compliance logging

## Message Template Gaps

### Templates Without Tests
| Template Location | Message Type | Content Tested |
|-------------------|--------------|----------------|
| `sendMagicLinkSms.ts:58-59` | Magic link SMS | No |
| `vmMessagingHelpers.ts:407-408` | VM request SMS (guest) | No |
| `vmMessagingHelpers.ts:423-425` | VM request SMS (host) | No |
| `vmMessagingHelpers.ts:593-595` | VM accept SMS | No |
| `adminSendReminder.ts:168` | Reminder SMS | No |

### Missing Template Tests
- [ ] Character limit validation (160 chars for SMS)
- [ ] Long content truncation behavior
- [ ] URL formatting in messages
- [ ] Date/time formatting (EST timezone)
- [ ] Placeholder variable substitution

## Service Tests with Good Coverage (Reference)

**None** - No SMS-related tests exist in the codebase.

The codebase has extensive unit tests for:
- Business logic calculators (`app/src/logic/calculators/`)
- Business logic rules (`app/src/logic/rules/`)
- Data processors (`app/src/logic/processors/`)
- Auth workflows (`app/src/logic/workflows/auth/`)

But zero test coverage for any SMS functionality.

## Recommended MSW Handler

```typescript
// supabase/functions/_test_utils/twilioHandlers.ts
import { http, HttpResponse } from 'msw'

export const sentMessages: Array<{
  to: string
  from: string
  body: string
  accountSid: string
}> = []

export function clearSentMessages() {
  sentMessages.length = 0
}

// Invalid numbers for testing error cases
const INVALID_NUMBERS = new Set(['+15551234567', '+10000000000'])

export const twilioHandlers = [
  http.post(
    'https://api.twilio.com/2010-04-01/Accounts/:accountSid/Messages.json',
    async ({ request, params }) => {
      const accountSid = params.accountSid as string
      const formData = await request.formData()
      const to = formData.get('To') as string
      const from = formData.get('From') as string
      const body = formData.get('Body') as string

      // Verify Basic Auth header
      const authHeader = request.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return HttpResponse.json(
          { code: 20003, message: 'Authentication Error' },
          { status: 401 }
        )
      }

      // Test invalid phone numbers
      if (INVALID_NUMBERS.has(to)) {
        return HttpResponse.json(
          { code: 21211, message: `The 'To' number ${to} is not a valid phone number.` },
          { status: 400 }
        )
      }

      // Capture sent message
      sentMessages.push({ to, from, body, accountSid })

      // Return success response (201 Created)
      return HttpResponse.json(
        {
          sid: `SM${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
          date_created: new Date().toISOString(),
          date_updated: new Date().toISOString(),
          date_sent: null,
          account_sid: accountSid,
          to,
          from,
          body,
          status: 'queued',
          num_segments: '1',
          direction: 'outbound-api',
        },
        { status: 201 }
      )
    }
  ),
]
```

## Recommended Module Mock (for Deno)

```typescript
// supabase/functions/_test_utils/twilioMock.ts

export const sentMessages: Array<{
  to: string
  from: string
  body: string
}> = []

export function clearSentMessages() {
  sentMessages.length = 0
}

/**
 * Mock implementation of sendTwilioSMS for unit tests
 */
export async function mockSendTwilioSMS(params: {
  accountSid: string
  authToken: string
  from: string
  to: string
  body: string
}): Promise<{ sid: string; status: string }> {
  const { to, from, body } = params

  // Simulate invalid phone number
  if (to === '+15551234567') {
    throw new Error('The \'To\' number +15551234567 is not a valid phone number.')
  }

  sentMessages.push({ to, from, body })

  return {
    sid: `SM${Date.now()}`,
    status: 'queued',
  }
}

/**
 * Mock fetch for Twilio API in integration tests
 */
export function createTwilioFetchMock() {
  return async (url: string, options: RequestInit) => {
    if (url.includes('api.twilio.com') && url.includes('Messages.json')) {
      const formData = new URLSearchParams(options.body as string)
      const to = formData.get('To') || ''
      const from = formData.get('From') || ''
      const body = formData.get('Body') || ''

      if (to === '+15551234567') {
        return new Response(
          JSON.stringify({ code: 21211, message: 'Invalid phone number' }),
          { status: 400 }
        )
      }

      sentMessages.push({ to, from, body })

      return new Response(
        JSON.stringify({
          sid: `SM${Date.now()}`,
          to,
          from,
          body,
          status: 'queued',
        }),
        { status: 201 }
      )
    }

    // Pass through non-Twilio requests
    return globalThis.fetch(url, options)
  }
}
```

## Test Pattern Examples

### Pattern 1: Test SMS Sent Successfully

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { sentMessages, clearSentMessages, twilioHandlers } from './_test_utils/twilioHandlers'
import { setupServer } from 'msw/node'

const server = setupServer(...twilioHandlers)

describe('send-sms edge function', () => {
  beforeEach(() => {
    clearSentMessages()
  })

  it('sends SMS via Twilio', async () => {
    const response = await fetch('http://localhost:54321/functions/v1/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        action: 'send',
        payload: {
          to: '+14155551234',
          from: '+14155692985',
          body: 'Test message',
        },
      }),
    })

    expect(response.status).toBe(200)
    expect(sentMessages).toHaveLength(1)
    expect(sentMessages[0]).toEqual({
      to: '+14155551234',
      from: '+14155692985',
      body: 'Test message',
      accountSid: expect.any(String),
    })
  })
})
```

### Pattern 2: Test Invalid Phone Number

```typescript
it('rejects invalid phone number', async () => {
  const response = await fetch('http://localhost:54321/functions/v1/send-sms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    body: JSON.stringify({
      action: 'send',
      payload: {
        to: '+15551234567', // Invalid in mock
        from: '+14155692985',
        body: 'Test message',
      },
    }),
  })

  expect(response.status).toBe(500)
  const data = await response.json()
  expect(data.error).toContain('not a valid phone number')
  expect(sentMessages).toHaveLength(0)
})
```

### Pattern 3: Test No SMS on User Opt-Out

```typescript
it('does not send SMS when user opted out', async () => {
  clearSentMessages()

  // User with virtual_meetings SMS disabled
  const result = await sendVMRequestMessages(supabase, {
    proposalId: 'test-proposal',
    hostUserId: 'host-123',
    guestUserId: 'guest-456',
    guestPhone: '+14155551234',
    notifyGuestSms: true,
  }, false)

  // SMS should be skipped due to preference
  expect(result.guestSmsSent).toBe(false)
  expect(sentMessages).toHaveLength(0)
})
```

## Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Real Twilio API calls in tests | Mock Twilio API with MSW handlers |
| Not testing SMS content | Assert `sentMessages[0].body` |
| Ignoring E.164 validation | Test both valid and invalid phone formats |
| No message capture | Use `sentMessages` array for assertions |
| Testing only success cases | Include invalid number, missing credentials tests |
| No preference checking tests | Verify opt-out behavior blocks SMS |

## Priority Recommendations

### High Priority (Security/Compliance)
1. **Emergency SMS** - Must test audit logging for all states (PENDING, SENT, FAILED)
2. **Notification Preferences** - Must verify opt-out is respected
3. **Admin Override Logging** - Compliance requires audit trail

### Medium Priority (Feature Coverage)
4. **Magic Link SMS** - Atomic operation must be tested
5. **VM Messaging** - Complex multi-recipient flow needs coverage
6. **Main send-sms function** - Core infrastructure

### Lower Priority (Polish)
7. **Message content templates** - Character limits, formatting
8. **Admin Reminder SMS** - Phone formatting edge cases
