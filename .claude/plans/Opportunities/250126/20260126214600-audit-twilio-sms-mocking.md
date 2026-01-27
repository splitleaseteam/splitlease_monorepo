# Twilio SMS Mocking Opportunity Report
**Generated:** 2026-01-26T21:46:00Z
**Codebase:** Split Lease

## Executive Summary
- **SMS sending functions found:** 7 files with direct Twilio API calls
- **Functions needing mock coverage:** 7 (100% - no existing mocks)
- **MSW handlers exist:** No
- **Module mocks exist:** No
- **Integration test infrastructure:** Partial (test helpers exist but no SMS mocks)

## Infrastructure Check

### SMS Mock Setup Status
- [ ] `twilioHandlers.ts` MSW handlers exist
- [ ] `__mocks__/twilio.ts` module mock exists
- [ ] `sentMessages` capture array exists
- [ ] `clearSentMessages()` helper exists
- [ ] Error response mocks configured

### Existing Test Infrastructure
The project has basic test infrastructure in place:
- `supabase/functions/tests/helpers/assertions.ts` - Custom assertions for Result types
- `supabase/functions/tests/helpers/fixtures.ts` - Mock request/payload factories
- No SMS-specific mocking infrastructure exists

## Critical Gaps (No Mocking)

### 1. send-sms Edge Function (Primary SMS Service)
- **File:** `supabase/functions/send-sms/index.ts`
- **Functions:**
  - `handleSend()` - Main SMS sending handler (line 98)
  - `handleHealth()` - Health check endpoint (line 79)
- **Twilio Usage:**
  - Direct Twilio API calls via `twilioClient.ts`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` environment variables
  - Form-urlencoded POST to `https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json`
- **Missing Mock Coverage:**
  - [ ] MSW handler for Twilio Messages.json endpoint
  - [ ] Message content assertion tests
  - [ ] Phone number validation tests (E.164 format)
  - [ ] Public from number bypass test (+14155692985)
  - [ ] Authorization header tests
  - [ ] Invalid phone handling (Twilio error 21211)
  - [ ] Missing credentials error handling

### 2. Virtual Meeting SMS Notifications
- **File:** `supabase/functions/_shared/vmMessagingHelpers.ts`
- **Functions:**
  - `sendSms()` - Internal Twilio client (line 169)
  - `sendVMRequestMessages()` - VM request notifications (line 226)
  - `sendVMAcceptMessages()` - VM accept notifications (line 410)
- **Twilio Usage:**
  - Direct Twilio API calls (line 191-204)
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_PHONE` env vars
- **Missing Mock Coverage:**
  - [ ] VM request SMS to guest test
  - [ ] VM request SMS to host test
  - [ ] VM accept SMS test
  - [ ] Message content contains guest/host names
  - [ ] Phone format validation (E.164 regex at line 177)
  - [ ] Missing credentials graceful degradation (line 186-189)

### 3. Emergency Management SMS
- **File:** `supabase/functions/emergency/handlers/sendSMS.ts`
- **Functions:**
  - `handleSendSMS()` - Emergency SMS handler (line 22)
  - `sendTwilioSMS()` - Direct Twilio call (line 129)
- **Twilio Usage:**
  - Direct Twilio API calls (line 138-154)
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` env vars
- **Missing Mock Coverage:**
  - [ ] Emergency SMS delivery test
  - [ ] Database log entry creation (emergency_message table)
  - [ ] Twilio SID update on success test
  - [ ] Error message update on failure test
  - [ ] Emergency verification test (line 44-51)

### 4. Magic Link SMS (Auth User)
- **File:** `supabase/functions/auth-user/handlers/sendMagicLinkSms.ts`
- **Functions:**
  - `handleSendMagicLinkSms()` - Magic link SMS handler (line 114)
  - `sendSmsViaTwilio()` - Internal Twilio client (line 66)
- **Twilio Usage:**
  - Direct Twilio API calls (line 81-96)
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` env vars
  - Fixed from number: `+14155692985` (magic link number)
- **Missing Mock Coverage:**
  - [ ] Magic link SMS delivery test
  - [ ] Message contains magic link URL test
  - [ ] E.164 phone validation test (line 46-53)
  - [ ] Atomic operation test (link + SMS succeed/fail together)
  - [ ] 15-minute expiration message test
  - [ ] Supabase auth admin.generateLink() mocking

### 5. Admin Send Reminder (Messages)
- **File:** `supabase/functions/messages/handlers/adminSendReminder.ts`
- **Functions:**
  - `sendReminderSms()` - Reminder SMS sender (line 139)
  - `handleAdminSendReminder()` - Admin handler (line 198)
- **Twilio Usage:**
  - Direct Twilio API calls (line 164-178)
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` env vars
- **Missing Mock Coverage:**
  - [ ] Reminder SMS to host test
  - [ ] Reminder SMS to guest test
  - [ ] Admin role verification test
  - [ ] Phone number formatting test (lines 154-159)
  - [ ] Message contains thread subject test
  - [ ] Both email and SMS notification test

### 6. Reminder Scheduler (Cron Job)
- **File:** `supabase/functions/reminder-scheduler/handlers/processPending.ts`
- **Functions:**
  - `handleProcessPending()` - Batch process reminders (line 21)
- **Twilio Usage:**
  - Indirect - calls `processReminder()` from scheduler.ts
  - Uses `fetchGuestContactInfo()` to get phone numbers
- **Missing Mock Coverage:**
  - [ ] Batch processing test
  - [ ] SMS delivery status tracking test
  - [ ] Twilio message SID storage test
  - [ ] Failed SMS retry logic test (status reset to 'pending')
  - [ ] Guest contact info fetching test

### 7. House Manual Phone Call (Stub Implementation)
- **File:** `supabase/functions/house-manual/handlers/initiateCall.ts`
- **Functions:**
  - `handleInitiateCall()` - Initiate AI phone call (line 46)
- **Twilio Usage:**
  - STUB/TODO implementation (lines 113-119 commented out)
  - Checks for `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Missing Mock Coverage:**
  - [ ] Phone call initiation test (when implemented)
  - [ ] TwiML webhook handling test
  - [ ] Call record database entry test
  - [ ] Unavailable status when Twilio not configured test

## Message Template Gaps

### Templates Without Tests
| Template | File | Content Tested |
|----------|------|----------------|
| Magic link SMS | `auth-user/handlers/sendMagicLinkSms.ts` | No |
| VM request SMS | `_shared/vmMessagingHelpers.ts` | No |
| VM accept SMS | `_shared/vmMessagingHelpers.ts` | No |
| Reminder SMS | `messages/handlers/adminSendReminder.ts` | No |
| Emergency SMS | `emergency/handlers/sendSMS.ts` | No |

### Missing Template Tests
- [ ] Character limit validation (160 chars for standard SMS)
- [ ] Long title/message truncation
- [ ] Date formatting (EST timezone in VM messages)
- [ ] Phone number formatting (E.164)
- [ ] Message encoding (UTF-8 for special characters)
- [ ] Newline handling (`\n` vs literal)

## SMS Flow Testing Gaps

### End-to-End SMS Workflows Not Tested
1. **Magic Link Flow:**
   - [ ] User requests magic link → SMS sent with link → User clicks link → Authenticated
   - [ ] Link expires after 15 minutes
   - [ ] Invalid phone number rejection

2. **Virtual Meeting Flow:**
   - [ ] Host requests VM → Guest receives SMS
   - [ ] Guest accepts VM → Both parties receive confirmation SMS
   - [ ] SMS contains proper date/time formatting
   - [ ] SMS notification preferences respected (notifyGuestSms, notifyHostSms)

3. **Emergency Flow:**
   - [ ] Admin triggers emergency SMS
   - [ ] SMS logged to database with Twilio SID
   - [ ] Failed SMS logged with error message
   - [ ] Emergency report verification

4. **Reminder Flow:**
   - [ ] Cron job processes pending reminders
   - [ ] SMS sent to guest/host based on preferences
   - [ ] Delivery status tracked (sent/failed)
   - [ ] Failed reminders retried

## Service Tests with Good Coverage (Reference)

Currently **no SMS services have proper mock coverage**. The following test infrastructure exists but is not used for SMS:

- `supabase/functions/tests/helpers/assertions.ts` - Result type assertions
- `supabase/functions/tests/helpers/fixtures.ts` - Mock Request/payload factories

## Recommended MSW Handler

```typescript
// supabase/functions/tests/mocks/twilioHandlers.ts
import { http, HttpResponse } from 'msw';

const BASE_URL = 'https://api.twilio.com';
const API_VERSION = '2010-04-01';

export const sentMessages: Array<{
  to: string;
  from: string;
  body: string;
  sid?: string;
  timestamp: string;
}> = [];

export function clearSentMessages(): void {
  sentMessages.length = 0;
}

export const twilioHandlers = [
  // Send SMS endpoint
  http.post(
    `${BASE_URL}/${API_VERSION}/Accounts/:accountSid/Messages.json`,
    async ({ request, params }) => {
      const accountSid = params.accountSid;

      // Parse form-encoded body
      const formData = await request.formData();
      const to = formData.get('To') as string;
      const from = formData.get('From') as string;
      const body = formData.get('Body') as string;

      // Check for invalid phone number (Twilio error 21211)
      if (to === '+15551234567' || to === '+15551234568') {
        return HttpResponse.json(
          {
            code: 21211,
            message: 'Invalid To phone number',
            more_info: 'https://www.twilio.com/docs/errors/21211',
            status: 400,
          },
          { status: 400 }
        );
      }

      // Check for authentication error
      if (accountSid === 'invalid_sid') {
        return HttpResponse.json(
          {
            code: 20003,
            message: 'Authenticate',
            more_info: 'https://www.twilio.com/docs/errors/20003',
            status: 401,
          },
          { status: 401 }
        );
      }

      // Check for missing credentials
      if (!request.headers.get('Authorization')) {
        return HttpResponse.json(
          {
            code: 20003,
            message: 'Authenticate',
            status: 401,
          },
          { status: 401 }
        );
      }

      // Generate mock SID
      const sid = `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      // Capture message for assertions
      sentMessages.push({
        to,
        from,
        body,
        sid,
        timestamp: new Date().toISOString(),
      });

      // Return success response (Twilio returns 201 Created)
      return HttpResponse.json(
        {
          sid,
          account_sid: accountSid,
          to,
          from,
          body,
          status: 'queued',
          date_created: new Date().toISOString(),
          date_updated: new Date().toISOString(),
          date_sent: null,
          uri: `/${API_VERSION}/Accounts/${accountSid}/Messages/${sid}.json`,
        },
        { status: 201 }
      );
    }
  ),

  // Get message status endpoint
  http.get(
    `${BASE_URL}/${API_VERSION}/Accounts/:accountSid/Messages/:messageSid.json`,
    ({ params }) => {
      const { messageSid } = params;

      // Find in sent messages
      const message = sentMessages.find(m => m.sid === messageSid);

      if (!message) {
        return HttpResponse.json(
          {
            code: 20404,
            message: 'The requested resource was not found',
            more_info: 'https://www.twilio.com/docs/errors/20404',
            status: 404,
          },
          { status: 404 }
        );
      }

      return HttpResponse.json({
        sid: message.sid,
        to: message.to,
        from: message.from,
        body: message.body,
        status: 'delivered',
        date_created: message.timestamp,
        date_updated: new Date().toISOString(),
      });
    }
  ),
];
```

## Recommended Test Helper Utilities

```typescript
// supabase/functions/tests/helpers/twilioHelpers.ts

/**
 * Assertions for Twilio SMS testing
 */

import { assertEquals, assertExists } from 'jsr:@std/assert';
import { sentMessages, clearSentMessages } from '../mocks/twilioHandlers.ts';

/**
 * Assert that exactly N SMS were sent
 */
export function assertSmsSent(count: number): void {
  assertEquals(
    sentMessages.length,
    count,
    `Expected ${count} SMS to be sent, but ${sentMessages.length} were sent`
  );
}

/**
 * Assert that an SMS was sent to a specific phone number
 */
export function assertSmsSentTo(phone: string): void {
  const message = sentMessages.find(m => m.to === phone);
  assertExists(message, `Expected SMS to be sent to ${phone}, but none found`);
  return message;
}

/**
 * Assert that an SMS body contains specific text
 */
export function assertSmsBodyContains(index: number, text: string): void {
  const message = sentMessages[index];
  assertExists(message, `No SMS at index ${index}`);
  const body = message.body;

  if (!body.includes(text)) {
    throw new Error(
      `Expected SMS body to contain "${text}", but got: "${body}"`
    );
  }
}

/**
 * Assert that an SMS body matches a pattern
 */
export function assertSmsBodyMatches(index: number, pattern: RegExp): void {
  const message = sentMessages[index];
  assertExists(message, `No SMS at index ${index}`);
  const body = message.body;

  if (!pattern.test(body)) {
    throw new Error(
      `Expected SMS body to match ${pattern}, but got: "${body}"`
    );
  }
}

/**
 * Get the most recently sent SMS
 */
export function getLastSms() {
  if (sentMessages.length === 0) {
    throw new Error('No SMS have been sent');
  }
  return sentMessages[sentMessages.length - 1];
}

/**
 * Clear SMS capture array between tests
 */
export { clearSentMessages };
```

## Example Test Suite (send-sms Edge Function)

```typescript
// supabase/functions/send-sms/index_test.ts

import { assertEquals, assertExists, assertRejects } from 'jsr:@std/assert';
import { twilioHandlers } from '../tests/mocks/twilioHandlers.ts';
import { createMockRequest, createActionPayload } from '../tests/helpers/fixtures.ts';
import { assertSmsSent, assertSmsSentTo, assertSmsBodyContains, clearSentMessages } from '../tests/helpers/twilioHelpers.ts';

// Setup MSW server
import { setupServer } from 'msw/node';

const server = setupServer(...twilioHandlers);

// Start server before all tests
server.listen({ onUnhandledRequest: 'error' });

// Reset handlers after each test
server.resetHandlers();

// Close server after all tests
Deno.test({
  sanitizeResources: false,
  fn: async () => {
    server.close();
  },
});

Deno.test('send-sms: sends SMS successfully', async () => {
  clearSentMessages();

  const request = createMockRequest({
    body: createActionPayload('send', {
      to: '+14155551234',
      from: '+14155692985',
      body: 'Test message',
    }),
  });

  const response = await handleSendSms(request);
  const result = await response.json();

  assertEquals(result.success, true);
  assertExists(result.message_sid);
  assertSmsSent(1);
  assertSmsSentTo('+14155551234');
  assertSmsBodyContains(0, 'Test message');
});

Deno.test('send-sms: rejects invalid phone number', async () => {
  clearSentMessages();

  const request = createMockRequest({
    body: createActionPayload('send', {
      to: '+15551234567', // Invalid in mock
      from: '+14155692985',
      body: 'Test message',
    }),
  });

  await assertRejects(
    async () => await handleSendSms(request),
    Error,
    'invalid phone number'
  );

  assertSmsSent(0);
});

Deno.test('send-sms: bypasses auth for public from number', async () => {
  clearSentMessages();

  const request = createMockRequest({
    body: createActionPayload('send', {
      to: '+14155551234',
      from: '+14155692985', // Public magic link number
      body: 'Magic link test',
    }),
    headers: {}, // No auth header
  });

  const response = await handleSendSms(request);
  const result = await response.json();

  assertEquals(result.success, true);
  assertSmsSent(1);
});
```

## Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Real SMS in tests (costs money, slow) | Mock Twilio API with MSW |
| Not testing message content | Assert message body contains expected text |
| Ignoring error cases | Test invalid numbers, auth failures, network errors |
| No message capture | Store sent messages for assertions |
| Testing against real Twilio sandbox | Use MSW for faster, deterministic tests |
| Hardcoded test phone numbers | Use fixtures with consistent test numbers |
| Not clearing message array between tests | Call `clearSentMessages()` in beforeEach |
| Testing Twilio SDK directly | Test at HTTP boundary (what your code uses) |

## Priority Implementation Order

1. **HIGH PRIORITY:**
   - MSW handlers for Twilio Messages.json endpoint
   - Test helpers (assertSmsSent, assertSmsBodyContains, etc.)
   - send-sms Edge Function test suite (core SMS service)

2. **MEDIUM PRIORITY:**
   - Magic link SMS tests (auth-user)
   - Virtual meeting SMS tests (vmMessagingHelpers)
   - Emergency SMS tests (emergency)

3. **LOWER PRIORITY:**
   - Admin reminder SMS tests (messages)
   - Reminder scheduler tests (reminder-scheduler)
   - Phone call stub tests (house-manual) - when implemented

## Environment Variables for Testing

The following Twilio environment variables are used across the codebase:

| Variable | Used In | Required for Tests |
|----------|---------|-------------------|
| `TWILIO_ACCOUNT_SID` | All SMS functions | Mocked |
| `TWILIO_AUTH_TOKEN` | All SMS functions | Mocked |
| `TWILIO_FROM_PHONE` | Most functions | Mocked |
| `TWILIO_PHONE_NUMBER` | emergency, messages | Mocked |

**Note:** The magic link SMS uses a hardcoded from number `+14155692985` which is marked as "public" in send-sms (no auth required).

## Testing Strategy Recommendations

### Unit Tests
- Test individual handlers (handleSend, handleSendMagicLinkSms, etc.)
- Mock Twilio at HTTP boundary using MSW
- Assert message content, phone numbers, error handling

### Integration Tests
- Test full Edge Function request/response cycle
- Verify database logging (emergency_message table)
- Test environment variable validation

### Contract Tests
- Verify Twilio API contract matches current implementation
- Test form-encoded request format
- Validate response structure (201 status with sid)

## Summary

**Current State:** Zero test coverage for SMS functionality. All 7 SMS sending functions make real Twilio API calls in production code, with no mocking infrastructure.

**Impact:**
- Tests would require real Twilio credentials or test accounts
- Tests would be slow and cost money (real SMS)
- No way to test error scenarios (invalid numbers, auth failures)
- Cannot verify message content without inspecting Twilio logs

**Recommended Actions:**
1. Implement MSW handlers for Twilio API
2. Create test helper utilities for SMS assertions
3. Write test suites for each SMS function
4. Add SMS tests to CI/CD pipeline
5. Consider using Twilio Test Credentials for integration tests (optional)
