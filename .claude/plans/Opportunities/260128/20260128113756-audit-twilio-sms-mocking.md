# Twilio SMS Mocking Opportunity Report
**Generated:** 2026-01-28T11:37:56
**Codebase:** Split Lease
**Hostname:** thin3

## Executive Summary
- SMS sending functions found: **8**
- Functions needing mock coverage: **8** (100%)
- MSW handlers exist: **No**
- Module mocks exist: **No**
- Test infrastructure for SMS: **None**

## Infrastructure Check

### SMS Mock Setup Status
- [ ] `twilioHandlers.ts` MSW handlers exist
- [ ] `__mocks__/twilio.ts` module mock exists
- [ ] `sentMessages` capture array exists
- [ ] `clearSentMessages()` helper exists
- [ ] Error response mocks configured

**Current State:** No Twilio mocking infrastructure exists. The codebase has test helper files (`supabase/functions/tests/helpers/assertions.ts` and `fixtures.ts`) but they don't include SMS mocking capabilities.

## Critical Gaps (No Mocking)

### 1. Core SMS Edge Function
- **File:** `supabase/functions/send-sms/index.ts`
- **Function:** `handleSend()` (line 98-147)
- **Twilio Usage:** Direct `fetch()` to Twilio API via `twilioClient.ts`
- **Missing Mock Coverage:**
  - [ ] MSW handler for Twilio Messages API endpoint
  - [ ] Message content assertion capability
  - [ ] Success response (201 Created) tests
  - [ ] Error response tests (invalid number, auth failure)
  - [ ] E.164 phone validation tests

### 2. Twilio Client Library
- **File:** `supabase/functions/send-sms/lib/twilioClient.ts`
- **Function:** `sendSms()` (line 50-93)
- **Twilio Usage:** `fetch()` to `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
- **Missing Mock Coverage:**
  - [ ] Unit tests for `buildTwilioEndpoint()`
  - [ ] Unit tests for `buildTwilioRequestBody()`
  - [ ] Unit tests for `isSuccessResponse()`
  - [ ] Unit tests for `getMessageSid()`

### 3. Emergency SMS Handler
- **File:** `supabase/functions/emergency/handlers/sendSMS.ts`
- **Function:** `handleSendSMS()` (line 22-124), `sendTwilioSMS()` (line 129-166)
- **Twilio Usage:** Direct `fetch()` to Twilio API (duplicated implementation)
- **Missing Mock Coverage:**
  - [ ] Emergency SMS delivery tests
  - [ ] Database logging (`emergency_message` table) tests
  - [ ] Success/failure status update tests
  - [ ] Error handling tests

### 4. Magic Link SMS Handler
- **File:** `supabase/functions/auth-user/handlers/sendMagicLinkSms.ts`
- **Function:** `sendSmsViaTwilio()` (line 66-112), `handleSendMagicLinkSms()` (line 114-197)
- **Twilio Usage:** Direct `fetch()` to Twilio API
- **Missing Mock Coverage:**
  - [ ] Magic link generation + SMS atomic operation tests
  - [ ] SMS message content tests (includes magic link URL)
  - [ ] Invalid phone number handling tests
  - [ ] Supabase Auth `generateLink()` integration tests

### 5. Admin Send Reminder SMS
- **File:** `supabase/functions/messages/handlers/adminSendReminder.ts`
- **Function:** `sendReminderSms()` (line 139-192)
- **Twilio Usage:** Direct `fetch()` to Twilio API
- **Missing Mock Coverage:**
  - [ ] Admin SMS reminder tests
  - [ ] Phone number formatting tests (line 154-159)
  - [ ] Notification preferences respect tests
  - [ ] Thread participant lookup tests

### 6. Reminder Scheduler SMS
- **File:** `supabase/functions/reminder-scheduler/lib/scheduler.ts`
- **Function:** `sendSmsNotification()` (line 74-107)
- **Twilio Usage:** Internal Edge Function call to `send-sms`
- **Missing Mock Coverage:**
  - [ ] SMS notification via Edge Function tests
  - [ ] Guest contact info fetch tests
  - [ ] Delivery status determination tests
  - [ ] Batch processing tests

### 7. Lease Notification SMS
- **File:** `supabase/functions/lease/handlers/notifications.ts`
- **Function:** `sendGuestSms()` (line 199-230), `sendHostSms()` (line 235-267)
- **Twilio Usage:** Internal Edge Function call to `send-sms`
- **Missing Mock Coverage:**
  - [ ] Lease creation guest SMS tests
  - [ ] Lease creation host SMS tests
  - [ ] Notification preferences filtering tests
  - [ ] Message content tests

### 8. Date Change Request SMS
- **File:** `supabase/functions/date-change-request/handlers/notifications.ts`
- **Function:** `sendSmsNotification()` (line 453-515)
- **Twilio Usage:** Internal Edge Function call to `send-sms`
- **Missing Mock Coverage:**
  - [ ] SUBMITTED event SMS tests
  - [ ] ACCEPTED event SMS tests
  - [ ] REJECTED event SMS tests
  - [ ] Phone number E.164 formatting tests
  - [ ] Requester vs receiver message content tests

## Notification Helpers (Shared Infrastructure)

### Shared SMS Sending Helper
- **File:** `supabase/functions/_shared/notificationHelpers.ts`
- **Function:** `sendProposalSms()` (line 172-216)
- **Missing Mock Coverage:**
  - [ ] Fire-and-forget SMS delivery tests
  - [ ] Internal Edge Function invocation tests

## Message Template Gaps

### Templates Without Tests
| Template Type | Location | Content Tested |
|---------------|----------|----------------|
| Magic link SMS | `sendMagicLinkSms.ts:58-60` | No |
| Emergency SMS | `sendSMS.ts:89` | No |
| Admin reminder SMS | `adminSendReminder.ts:161` | No |
| Lease guest SMS | `notifications.ts:222-223` | No |
| Lease host SMS | `notifications.ts:258-259` | No |
| Date change SMS | Via `notificationContent.ts` | No |
| Proposal SMS | Via `notificationHelpers.ts` | No |

### Missing Template Tests
- [ ] Character limit validation (160 chars for single SMS)
- [ ] Long message truncation/segmentation
- [ ] Date formatting in messages
- [ ] Price formatting in messages
- [ ] Phone number masking in logs

## Service Tests with Good Coverage (Reference)

**None.** No SMS-related tests exist in the codebase. The test infrastructure exists but has no SMS mocking.

## Duplicated Twilio Implementation (Technical Debt)

Three files have their own direct Twilio API calls instead of using the shared `send-sms` Edge Function:
1. `emergency/handlers/sendSMS.ts` - Line 129-166
2. `auth-user/handlers/sendMagicLinkSms.ts` - Line 66-112
3. `messages/handlers/adminSendReminder.ts` - Line 163-178

**Recommendation:** Consolidate all direct Twilio calls to use the `send-sms` Edge Function for consistency and easier mocking.

## Recommended MSW Handler

```typescript
// supabase/functions/tests/mocks/twilioHandlers.ts
import { http, HttpResponse } from 'msw';

export const sentMessages: Array<{ to: string; from: string; body: string }> = [];

export function clearSentMessages() {
  sentMessages.length = 0;
}

export const twilioHandlers = [
  http.post(
    'https://api.twilio.com/2010-04-01/Accounts/:accountSid/Messages.json',
    async ({ request, params }) => {
      const formData = await request.formData();
      const to = formData.get('To') as string;
      const from = formData.get('From') as string;
      const body = formData.get('Body') as string;

      // Test invalid phone number
      if (to === '+15551234567') {
        return HttpResponse.json(
          { code: 21211, message: 'Invalid "To" phone number', more_info: '', status: 400 },
          { status: 400 }
        );
      }

      // Test rate limiting
      if (to === '+15559999999') {
        return HttpResponse.json(
          { code: 21612, message: 'Message rate limit exceeded', more_info: '', status: 429 },
          { status: 429 }
        );
      }

      // Store for assertions
      sentMessages.push({ to, from, body });

      // Success response (201 Created)
      return HttpResponse.json(
        {
          sid: `SM${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
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
          uri: `/2010-04-01/Accounts/${params.accountSid}/Messages/SM${Date.now()}.json`,
        },
        { status: 201 }
      );
    }
  ),
];
```

## Recommended Module Mock (for Deno tests)

```typescript
// supabase/functions/tests/mocks/twilioMock.ts

export const sentMessages: Array<{ to: string; from: string; body: string }> = [];

export function clearSentMessages() {
  sentMessages.length = 0;
}

/**
 * Mock the fetch function for Twilio API calls
 */
export function mockTwilioFetch() {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    // Check if this is a Twilio API call
    if (url.includes('api.twilio.com') && url.includes('/Messages.json')) {
      const formData = new URLSearchParams(init?.body as string);
      const to = formData.get('To') || '';
      const from = formData.get('From') || '';
      const body = formData.get('Body') || '';

      // Test invalid phone number
      if (to === '+15551234567') {
        return new Response(
          JSON.stringify({ code: 21211, message: 'Invalid "To" phone number', status: 400 }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      sentMessages.push({ to, from, body });

      return new Response(
        JSON.stringify({
          sid: `SM${Date.now()}`,
          to,
          from,
          body,
          status: 'queued',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Pass through non-Twilio requests
    return originalFetch(input, init);
  };

  // Return cleanup function
  return () => {
    globalThis.fetch = originalFetch;
  };
}
```

## Recommended Test Patterns

### Pattern 1: Test SMS Sent

```typescript
import { sentMessages, clearSentMessages, mockTwilioFetch } from '../mocks/twilioMock.ts';
import { assertEquals } from 'jsr:@std/assert';

Deno.test('sends booking confirmation SMS', async () => {
  const cleanup = mockTwilioFetch();
  clearSentMessages();

  try {
    await handleSend({
      to: '+14155551234',
      from: '+14155692985',
      body: 'Your booking for Downtown Studio is confirmed!',
    });

    assertEquals(sentMessages.length, 1);
    assertEquals(sentMessages[0].to, '+14155551234');
    assertEquals(sentMessages[0].body.includes('Downtown Studio'), true);
  } finally {
    cleanup();
  }
});
```

### Pattern 2: Test Invalid Phone

```typescript
Deno.test('handles invalid phone number', async () => {
  const cleanup = mockTwilioFetch();
  clearSentMessages();

  try {
    await assertRejects(
      async () => {
        await handleSend({
          to: '+15551234567', // Invalid in mock
          from: '+14155692985',
          body: 'Test message',
        });
      },
      Error,
      'Twilio API error'
    );

    assertEquals(sentMessages.length, 0);
  } finally {
    cleanup();
  }
});
```

### Pattern 3: Test Message Content

```typescript
Deno.test('magic link SMS contains correct URL', async () => {
  const cleanup = mockTwilioFetch();
  clearSentMessages();

  try {
    await handleSendMagicLinkSms(supabaseUrl, serviceKey, {
      email: 'test@example.com',
      phoneNumber: '+14155551234',
      redirectTo: '/dashboard',
    });

    assertEquals(sentMessages.length, 1);
    assertEquals(sentMessages[0].body.includes('split.lease'), true);
    assertEquals(sentMessages[0].body.includes('expires in 15 minutes'), true);
  } finally {
    cleanup();
  }
});
```

## Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Real SMS in tests | Mock Twilio API |
| Not testing content | Assert message body contains expected text |
| Ignoring error cases | Test invalid numbers, rate limits |
| No message capture | Store sent messages for assertions |
| Duplicate Twilio implementations | Use centralized `send-sms` Edge Function |
| Testing via UI only | Direct unit/integration tests for handlers |

## Priority Actions

### Immediate (Critical)
1. Create `twilioMock.ts` with `sentMessages` array and mock fetch
2. Add tests for `send-sms/lib/twilioClient.ts` pure functions
3. Add tests for `send-sms/index.ts` handler

### Short-term (High Priority)
4. Add tests for `sendMagicLinkSms.ts` (auth flow critical path)
5. Add tests for `emergency/handlers/sendSMS.ts` (safety feature)
6. Consolidate duplicate Twilio implementations to use `send-sms`

### Medium-term (Normal Priority)
7. Add tests for notification helpers and shared infrastructure
8. Add tests for lease and date-change notification flows
9. Add character limit and message formatting tests

## Files Changed Summary

No files were changed during this audit. This is a read-only analysis.

## Conclusion

The Split Lease codebase has **8 distinct SMS sending functions** across the Edge Functions, but **zero test coverage** for any Twilio-related functionality. The test infrastructure exists (Deno test framework, custom assertions, fixtures) but lacks SMS mocking capabilities.

The most critical gap is the absence of any mock infrastructure for the Twilio API. Without mocks, it's impossible to:
- Verify SMS content is correct
- Test error handling for invalid numbers
- Ensure notifications respect user preferences
- Validate E.164 phone formatting
- Test the atomic magic link + SMS flow

**Recommendation:** Prioritize creating the mock infrastructure first, then systematically add tests starting with the core `send-sms` Edge Function and auth-critical `sendMagicLinkSms` handler.
