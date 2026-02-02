# Twilio SMS Mocking Opportunity Report
**Generated:** 2026-02-01 10:21:02 UTC
**Codebase:** Split Lease

## Executive Summary
- SMS sending functions found: 6
- Functions needing mock coverage: 6
- MSW handlers exist: No
- Module mocks exist: No

**Overall Assessment:** Split Lease has comprehensive SMS functionality across Edge Functions but **completely lacks mock infrastructure** for testing. All SMS operations currently require live Twilio API calls during testing.

## Infrastructure Check

### SMS Mock Setup Status
- [ ] `twilioHandlers.ts` MSW handlers exist
- [ ] `__mocks__/twilio.ts` module mock exists
- [ ] `sentMessages` capture array exists
- [ ] `clearSentMessages()` helper exists
- [ ] Error response mocks configured

**Result:** None of the required mock infrastructure exists in the codebase.

---

## Critical Gaps (No Mocking)

### 1. Main SMS Gateway Function
- **File:** `supabase/functions/send-sms/index.ts`
- **Function:** `handleSend()` (line 130)
- **Twilio Usage:** Direct HTTP POST to `api.twilio.com` with form-urlencoded body and Basic Auth
- **Purpose:** Central SMS sending gateway that validates phone numbers and forwards to Twilio
- **Missing Mock Coverage:**
  - [ ] MSW handler for `api.twilio.com/2010-04-01/Accounts/:accountSid/Messages.json`
  - [ ] Message content assertion tests
  - [ ] Phone number validation tests
  - [ ] Invalid phone number error handling
  - [ ] Rate limiting tests
  - [ ] Twilio API error response handling (401, 400, 429)

### 2. Authentication Magic Link SMS
- **File:** `supabase/functions/auth-user/handlers/sendMagicLinkSms.ts`
- **Function:** `sendSmsViaTwilio()` (line 89)
- **Twilio Usage:** Direct HTTP POST to Twilio API within atomic database operation
- **Purpose:** Sends magic link authentication codes via SMS for passwordless login
- **Missing Mock Coverage:**
  - [ ] MSW handler for Twilio Messages API
  - [ ] Magic link delivery verification tests
  - [ ] Link expiration time tests
  - [ ] Atomic rollback on SMS failure tests
  - [ ] Invalid phone number handling
  - [ ] Message template content tests

### 3. Emergency Notifications
- **File:** `supabase/functions/emergency/handlers/sendSMS.ts`
- **Function:** `sendTwilioSMS()` (line 147)
- **Twilio Usage:** Direct HTTP POST to Twilio API with database logging
- **Purpose:** Sends critical emergency notifications to property contacts
- **Missing Mock Coverage:**
  - [ ] MSW handler for emergency SMS endpoint
  - [ ] Emergency message priority tests
  - [ ] Database logging verification tests
  - [ ] Multiple recipient notification tests
  - [ ] Failed SMS delivery retry logic tests
  - [ ] Emergency message content validation tests

### 4. Reminder Scheduler
- **File:** `supabase/functions/reminder-scheduler/lib/scheduler.ts`
- **Function:** `sendSmsNotification()` (line 81)
- **Twilio Usage:** Calls `send-sms` Edge Function (indirect Twilio usage)
- **Purpose:** Sends scheduled check-in/check-out reminder notifications
- **Missing Mock Coverage:**
  - [ ] MSW handler for `send-sms` Edge Function
  - [ ] Check-in reminder timing tests
  - [ ] Check-out reminder timing tests
  - [ ] Message template tests (date formatting, listing title)
  - [ ] Scheduled job execution tests
  - [ ] Failed reminder handling tests

### 5. Virtual Meeting Notifications
- **File:** `supabase/functions/_shared/vmMessagingHelpers.ts`
- **Function:** `sendSms()` (line 194)
- **Twilio Usage:** Direct HTTP POST to Twilio API
- **Purpose:** Sends SMS notifications for virtual meeting requests and acceptances
- **Missing Mock Coverage:**
  - [ ] MSW handler for meeting notification SMS
  - [ ] Meeting request notification tests
  - [ ] Meeting acceptance notification tests
  - [ ] Meeting link in message tests
  - [ ] Host vs guest notification tests
  - [ ] Message template content tests

### 6. House Manual Phone Call (Placeholder)
- **File:** `supabase/functions/house-manual/handlers/initiateCall.ts`
- **Function:** `handleInitiateCall()` (line 114)
- **Twilio Usage:** Placeholder for future Twilio Voice API integration
- **Purpose:** Will initiate automated phone calls for house manual access
- **Missing Mock Coverage:**
  - [ ] MSW handler for Twilio Voice API
  - [ ] Call initiation tests
  - [ ] Call status callback tests
  - [ ] Voice message playback tests
  - [ ] Call forwarding tests

---

## Message Template Gaps

### Templates Without Tests
| Template | Location | Content Tested | Purpose |
|----------|----------|----------------|---------|
| Magic Link | `sendMagicLinkSms.ts` | No | Passwordless authentication |
| Emergency | `emergency/handlers/sendSMS.ts` | No | Critical notifications |
| Check-in Reminder | `reminder-scheduler/lib/scheduler.ts` | No | Arrival reminders |
| Check-out Reminder | `reminder-scheduler/lib/scheduler.ts` | No | Departure reminders |
| Meeting Request | `vmMessagingHelpers.ts` | No | Virtual meeting invites |
| Meeting Accept | `vmMessagingHelpers.ts` | No | Meeting confirmations |

### Missing Template Tests
- [ ] Character limit validation (160 chars for single SMS)
- [ ] Long listing title truncation
- [ ] Date formatting consistency
- [ ] Price/currency formatting
- [ ] Phone number format validation
- [ ] URL encoding for magic links
- [ ] Emoji and special character handling

---

## Service Tests with Good Coverage (Reference)

**None found.** No SMS services currently have proper mock coverage or test infrastructure.

---

## Twilio API Usage Patterns Found

### Pattern 1: Direct HTTP POST (Most Common)
```typescript
// Found in: send-sms/index.ts, sendMagicLinkSms.ts, emergency/handlers/sendSMS.ts, vmMessagingHelpers.ts
const response = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`
    },
    body: new URLSearchParams({
      To: phoneNumber,
      From: twilioPhoneNumber,
      Body: message
    })
  }
)
```

### Pattern 2: Edge Function Proxy
```typescript
// Found in: reminder-scheduler/lib/scheduler.ts
const response = await fetch(`${env.SUPABASE_URL}/functions/v1/send-sms`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({ to, body })
})
```

---

## Recommended MSW Handler

```typescript
// app/src/mocks/twilioHandlers.ts
import { http, HttpResponse } from 'msw'

export const sentMessages: Array<{ to: string; body: string; timestamp: number }> = []

export function clearSentMessages() {
  sentMessages.length = 0
}

export const twilioHandlers = [
  // Mock Twilio Messages API
  http.post(
    'https://api.twilio.com/2010-04-01/Accounts/:accountSid/Messages.json',
    async ({ request, params }) => {
      const formData = await request.formData()
      const to = formData.get('To') as string
      const from = formData.get('From') as string
      const body = formData.get('Body') as string
      const accountSid = params.accountSid

      // Test invalid phone number
      if (to === '+15551234567' || to === '+18005550199') {
        return HttpResponse.json(
          {
            code: 21211,
            message: 'Invalid To phone number',
            more_info: 'https://www.twilio.com/docs/errors/21211',
            status: 400
          },
          { status: 400 }
        )
      }

      // Test rate limiting
      if (sentMessages.filter(m => m.to === to).length >= 10) {
        return HttpResponse.json(
          {
            code: 21603,
            message: 'A From phone number is required to send messages',
            status: 429
          },
          { status: 429, headers: { 'Retry-After': '60' } }
        )
      }

      // Test invalid credentials
      if (accountSid === 'ACinvalid') {
        return HttpResponse.json(
          {
            code: 20003,
            message: 'Authenticate',
            more_info: 'https://www.twilio.com/docs/errors/20003',
            status: 401
          },
          { status: 401 }
        )
      }

      // Capture successful message
      sentMessages.push({ to, body, timestamp: Date.now() })

      return HttpResponse.json({
        sid: `SM${Date.now()}`,
        account_sid: accountSid,
        to,
        from,
        body,
        status: 'queued',
        date_created: new Date().toISOString(),
        date_updated: new Date().toISOString(),
        date_sent: new Date().toISOString()
      })
    }
  ),

  // Mock send-sms Edge Function
  http.post('https://api.splitlease.com/functions/v1/send-sms', async ({ request }) => {
    const { to, body } = await request.json()

    if (to === '+15551234567') {
      return HttpResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    sentMessages.push({ to, body, timestamp: Date.now() })

    return HttpResponse.json({
      success: true,
      sid: `SM${Date.now()}`,
      to,
      body
    })
  })
]
```

---

## Recommended Module Mock

```typescript
// app/src/lib/__mocks__/twilio.ts
import { vi } from 'vitest'

export const sentMessages: Array<{ to: string; body: string; timestamp: number }> = []

export function clearSentMessages() {
  sentMessages.length = 0
}

export const mockTwilioClient = {
  messages: {
    create: vi.fn(async (options: { to: string; from: string; body: string }) => {
      const { to, body } = options

      if (to === '+15551234567') {
        throw new Error('Invalid phone number')
      }

      sentMessages.push({ to, body, timestamp: Date.now() })

      return {
        sid: `SM${Date.now()}`,
        to,
        from: options.from,
        body,
        status: 'queued',
        dateCreated: new Date()
      }
    }),

    list: vi.fn(async (filters: { to: string }) => {
      return {
        each: (callback: (msg: any) => void) => {
          sentMessages
            .filter(m => m.to === filters.to)
            .forEach(m => callback({
              sid: `SM${m.timestamp}`,
              to: m.to,
              body: m.body,
              status: 'sent'
            }))
        }
      }
    })
  }
}

export default function twilio(accountSid: string, authToken: string) {
  if (accountSid === 'ACinvalid') {
    throw new Error('Invalid credentials')
  }
  return mockTwilioClient
}
```

---

## Reference: Twilio SMS Mocking Patterns

### Mocking Approaches

| Approach | Speed | Use Case | Recommendation |
|----------|-------|----------|----------------|
| MSW Handlers | Fast | Full API simulation | ✅ **Recommended** |
| Module Mock | Fast | Simplified tests | ✅ **Recommended** |
| Twilio Test Creds | Slow | Real API integration | ❌ Not recommended |

### Pattern 1: Test SMS Sent
```typescript
it('sends booking confirmation SMS', async () => {
  clearSentMessages()

  await notificationService.sendBookingConfirmation({
    buyerPhone: '+14155551234',
    listingTitle: 'Downtown Studio',
    checkIn: '2025-03-01',
  })

  expect(sentMessages).toHaveLength(1)
  expect(sentMessages[0].to).toBe('+14155551234')
  expect(sentMessages[0].body).toContain('Downtown Studio')
  expect(sentMessages[0].body).toContain('March 1, 2025')
})
```

### Pattern 2: Test Invalid Phone
```typescript
it('handles invalid phone number', async () => {
  await expect(
    notificationService.sendBookingConfirmation({
      buyerPhone: '+15551234567', // Invalid in mock
      listingTitle: 'Test',
    })
  ).rejects.toThrow(/invalid phone number/i)

  expect(sentMessages).toHaveLength(0)
})
```

### Pattern 3: Test No SMS on Failure
```typescript
it('does not send SMS on payment failure', async () => {
  clearSentMessages()

  server.use(
    http.post('*/payment_intents/:id/confirm', () => {
      return HttpResponse.json(
        { status: 'requires_payment_method' },
        { status: 400 }
      )
    })
  )

  await expect(bookingService.createBooking({ ... })).rejects.toThrow()

  expect(sentMessages).toHaveLength(0)
})
```

### Pattern 4: Test Message Content
```typescript
it('includes magic link in SMS', async () => {
  clearSentMessages()

  await authService.sendMagicLinkSMS({
    phone: '+14155551234',
    token: 'abc123'
  })

  expect(sentMessages[0].body).toMatch(/https?:\/\/.*\/auth\/verify\/abc123/)
  expect(sentMessages[0].body.length).toBeLessThanOrEqual(160)
})
```

### Pattern 5: Test Rate Limiting
```typescript
it('respects rate limits', async () => {
  clearSentMessages()

  const promises = Array.from({ length: 15 }, (_, i) =>
    notificationService.sendSMS({
      to: '+14155551234',
      body: `Message ${i}`
    })
  )

  const results = await Promise.allSettled(promises)

  const failures = results.filter(r => r.status === 'rejected')
  expect(failures.length).toBeGreaterThan(0)
  expect(failures[0].reason).toMatch(/rate limit/i)
})
```

---

## Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| ❌ Real SMS in tests | ✅ Mock Twilio API with MSW |
| ❌ Not testing content | ✅ Assert message body contains expected text |
| ❌ Ignoring error cases | ✅ Test invalid numbers, rate limits, auth failures |
| ❌ No message capture | ✅ Store sent messages for assertions |
| ❌ Testing with real credits | ✅ Mock responses, never consume credits |
| ❌ Sleep/polling for delivery | ✅ Synchronous mock responses |

---

## Implementation Priority

### High Priority (Critical User Flows)
1. **`sendMagicLinkSms`** - Authentication is critical path
2. **`send-sms`** - Gateway used by multiple functions

### Medium Priority (Important Features)
3. **`sendTwilioSMS`** (emergency) - Critical but rare usage
4. **`sendSmsNotification`** (reminder) - User experience feature

### Low Priority (Nice to Have)
5. **`sendSms`** (virtual meetings) - Less frequently used
6. **`handleInitiateCall`** - Not yet implemented

---

## Next Steps

1. **Create MSW Handler Infrastructure**
   - Add `app/src/mocks/twilioHandlers.ts`
   - Integrate with existing MSW setup in `app/src/mocks/server.ts`

2. **Create Module Mock**
   - Add `app/src/lib/__mocks__/twilio.ts`
   - Document usage in test documentation

3. **Write Tests for Critical Functions**
   - Start with `sendMagicLinkSms` (authentication)
   - Then `send-sms` (gateway function)

4. **Add Test Utilities**
   - `clearSentMessages()` helper
   - Message assertion helpers
   - Error scenario helpers

5. **Document Testing Patterns**
   - Add to `app/CLAUDE.md` or test documentation
   - Include examples of common SMS test patterns

---

## Related Documentation

- [Twilio API Error Codes](https://www.twilio.com/docs/errors)
- [MSW Documentation](https://mswjs.io/)
- [Vitest Mock Documentation](https://vitest.dev/guide/mocking.html)

---

**Report ID:** 20260201102102-audit-twilio-sms-mocking
