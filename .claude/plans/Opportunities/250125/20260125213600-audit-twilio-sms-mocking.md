# Twilio SMS Mocking Opportunity Report
**Generated:** 2026-01-25T21:36:00Z
**Codebase:** Split Lease
**Audit Scope:** All Twilio SMS functionality requiring mock coverage for testing

## Executive Summary
- **SMS sending functions found:** 7 distinct implementations
- **Edge Functions using Twilio:** 7 (send-sms, auth-user, emergency, messages, lease, reminder-scheduler, house-manual)
- **MSW handlers exist:** No
- **Module mocks exist:** No
- **`sentMessages` capture arrays:** No
- **Test coverage for SMS:** None (0%)

---

## Infrastructure Check

### SMS Mock Setup Status
| Component | Status | Location |
|-----------|--------|----------|
| `twilioHandlers.ts` MSW handlers | ❌ Missing | N/A |
| `__mocks__/twilio.ts` module mock | ❌ Missing | N/A |
| `sentMessages` capture array | ❌ Missing | N/A |
| `clearSentMessages()` helper | ❌ Missing | N/A |
| Error response mocks | ❌ Missing | N/A |
| Twilio test configuration | ❌ Missing | N/A |

### Existing Test Infrastructure
| Component | Status | Location |
|-----------|--------|----------|
| Vitest configuration | ✅ Partial | `app/vite.config.js` |
| Deno test runner | ✅ Yes | For Edge Functions |
| MSW (Mock Service Worker) | ❌ Not installed | N/A |
| React Testing Library | ❌ Not configured | N/A |

---

## Critical Gaps (No Mocking)

### 1. send-sms Edge Function (Primary SMS Gateway)

**File:** `/supabase/functions/send-sms/index.ts`
**Function:** `handleSend()`
**Twilio Usage:** Direct `fetch()` to Twilio API at line 130

**Implementation Details:**
```typescript
// Line 130 in send-sms/index.ts
const response = await sendSms(accountSid, authToken, requestBody);
```

**Client Library:** `/supabase/functions/send-sms/lib/twilioClient.ts`
```typescript
// Line 64-71: Direct Twilio API call
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: requestBody.toString(),
});
```

**Missing Mock Coverage:**
- [ ] MSW handler for `https://api.twilio.com/2010-04-01/Accounts/*/Messages.json`
- [ ] Module mock for `twilioClient.ts` (`sendSms`, `buildTwilioRequestBody`)
- [ ] Message content assertions (to, from, body)
- [ ] Success response (201 Created with SID)
- [ ] Error response handling (400, 401, 403)
- [ ] Invalid phone number handling (E.164 validation)
- [ ] Public from number bypass test (`+14155692985`)
- [ ] Missing credentials error handling
- [ ] `sentMessages` array for capture
- [ ] `clearSentMessages()` helper

**Test Scenarios Needed:**
1. Successful SMS send (201 response)
2. Invalid phone number format (validation)
3. Missing Twilio credentials
4. Invalid auth token (401)
5. Rate limiting (429)
6. Public from number bypass (`+14155692985`)
7. Message body too long (>1600 chars for SMS)

---

### 2. Magic Link SMS (auth-user)

**File:** `/supabase/functions/auth-user/handlers/sendMagicLinkSms.ts`
**Function:** `sendSmsViaTwilio()`
**Twilio Usage:** Direct API call at line 89-96

**Implementation Details:**
```typescript
// Line 89-96: Inline Twilio API call (duplicated from send-sms)
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: formData.toString(),
});
```

**Missing Mock Coverage:**
- [ ] MSW handler for magic link SMS endpoint
- [ ] Message template validation (contains magic link)
- [ ] Phone format validation (E.164)
- [ ] Atomic operation test (link generation + SMS send)
- [ ] Failure when link generation succeeds but SMS fails
- [ ] 15-minute expiry mention in message
- [ ] Supabase Auth admin client mocking

**Test Scenarios Needed:**
1. Magic link SMS sent successfully
2. Invalid phone number format
3. Missing Twilio credentials
4. Link generation fails (no SMS sent)
5. Link generation succeeds but SMS fails (atomicity)

---

### 3. Emergency SMS (emergency)

**File:** `/supabase/functions/emergency/handlers/sendSMS.ts`
**Function:** `sendTwilioSMS()`
**Twilio Usage:** Direct API call at line 147-154

**Implementation Details:**
```typescript
// Line 147-154: Third duplicate of Twilio API call
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    To: formattedPhone,
    From: TWILIO_PHONE_NUMBER,
    Body: message,
  }),
});
```

**Missing Mock Coverage:**
- [ ] MSW handler for emergency SMS
- [ ] Database logging verification (`emergency_message` table)
- [ ] Message log status updates (PENDING → SENT/FAILED)
- [ ] `twilio_sid` storage in database
- [ ] Error message capture on failure
- [ ] Emergency ID validation

**Test Scenarios Needed:**
1. Emergency SMS sent and logged
2. SMS failure logged in database
3. Emergency not found error
4. Missing recipient phone
5. Missing message body
6. Twilio error captured in log

---

### 4. Message Reminder SMS (messages)

**File:** `/supabase/functions/messages/handlers/adminSendReminder.ts`
**Function:** `sendReminderSms()`
**Twilio Usage:** Direct API call at line 164-178

**Implementation Details:**
```typescript
// Line 164-178: Fourth duplicate of Twilio API call
const response = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: formattedPhone,
      From: TWILIO_PHONE_NUMBER,
      Body: message,
    }),
  }
);
```

**Missing Mock Coverage:**
- [ ] MSW handler for reminder SMS
- [ ] Phone number formatting test (10 digits → E.164)
- [ ] Admin role verification mock
- [ ] Thread fetching mock
- [ ] User data fetching mock
- [ ] Message template validation (contains thread subject)
- [ ] Host vs guest notification tests

**Test Scenarios Needed:**
1. Reminder sent to host
2. Reminder sent to guest
3. Reminder sent to both
4. Email only (no SMS)
5. SMS only (no email)
6. Non-admin user rejected
7. Thread not found

---

### 5. Lease Notification SMS (lease)

**File:** `/supabase/functions/lease/handlers/notifications.ts`
**Functions:** `sendGuestSms()`, `sendHostSms()`
**Twilio Usage:** Calls `send-sms` Edge Function (not direct API)

**Implementation Details:**
```typescript
// Line 211-225: Calls send-sms Edge Function
await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'send',
    payload: {
      to: guest['Cell phone number'],
      from: '+14155692985',
      body: `Split Lease: Your lease (${agreementNumber}) is being drafted!`,
    },
  }),
});
```

**Missing Mock Coverage:**
- [ ] Mock for `send-sms` Edge Function invocation
- [ ] User preference filtering (`sms_notifications`)
- [ ] Notification message templates (guest vs host)
- [ ] Agreement number in message
- [ ] Non-blocking error handling (logs but doesn't throw)

**Test Scenarios Needed:**
1. Guest SMS sent with correct template
2. Host SMS sent with correct template
3. SMS skipped when `sms_notifications: false`
4. SMS skipped when no phone number
5. SMS failure logged but doesn't block lease creation

---

### 6. Twilio Webhook Handler (reminder-scheduler)

**File:** `/supabase/functions/reminder-scheduler/handlers/webhook.ts`
**Function:** `handleTwilioWebhook()`
**Twilio Usage:** Receives webhooks FROM Twilio (outbound SMS status updates)

**Implementation Details:**
```typescript
// Line 117-162: Handles Twilio delivery status webhooks
export const handleTwilioWebhook = async (
  payload: WebhookPayload,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ updated: boolean }> => {
  // Updates remindersfromhousemanual table
  // based on Twilio status events
}
```

**Missing Mock Coverage:**
- [ ] MSW route for webhook endpoint
- [ ] Twilio event payload mock (delivered, failed, undelivered)
- [ ] Database update verification (`delivery_status`, `delivered_at`)
- [ ] Message SID lookup (`twilio_message_sid`)
- [ ] Event mapping tests (delivered → delivered, failed → failed)

**Test Scenarios Needed:**
1. Delivered event updates status
2. Failed event updates status
3. Undelivered event updates status
4. Unknown event ignored
5. Missing message SID handled

---

### 7. Phone Call Initiation (house-manual)

**File:** `/supabase/functions/house-manual/handlers/initiateCall.ts`
**Function:** `handleInitiateCall()`
**Twilio Usage:** Voice API (commented out stub)

**Implementation Details:**
```typescript
// Line 113-119: TODO comment for future Twilio Voice integration
// TODO: Actual Twilio API call would go here
// const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
// const call = await twilioClient.calls.create({
//   to: phoneNumber,
//   from: TWILIO_PHONE_NUMBER,
//   url: `${WEBHOOK_BASE_URL}/twilio/house-manual-call?callId=${callId}&type=${callType}`,
// });
```

**Missing Mock Coverage:**
- [ ] Not yet implemented (stub only)
- [ ] Future: Voice API mocking
- [ ] Future: Call status tracking
- [ ] Future: TwiML webhook handling

**Note:** This is a stub implementation for future Voice API integration.

---

## Message Template Gaps

### Templates Without Tests

| Template | File | Content Tested | Usage |
|----------|------|----------------|-------|
| Magic Link | `sendMagicLinkSms.ts:59` | ❌ No | Auth login links |
| Lease Guest Notification | `notifications.ts:222` | ❌ No | Lease creation |
| Lease Host Notification | `notifications.ts:259` | ❌ No | Lease creation |
| Message Reminder | `adminSendReminder.ts:161` | ❌ No | Thread reminders |
| Emergency Alert | `sendSMS.ts` | ❌ No | Emergency responses |

### Missing Template Tests
- [ ] Character limit validation (160 for single SMS, 1600 for concatenated)
- [ ] E.164 phone format in all templates
- [ ] Dynamic content interpolation (agreement numbers, names, links)
- [ ] URL encoding in magic links
- [ ] Special character handling
- [ ] Multilingual support (future)

---

## Frontend SMS Usage

### Phone Utilities (app/src/lib/phoneUtils.js)

**File:** `/app/src/lib/phoneUtils.js`
**Functions:** `toE164Format()`, `isValidUsPhoneNumber()`, `formatPhoneDisplay()`

**Current Test Coverage:** None

**Missing Tests:**
- [ ] E.164 format conversion tests
- [ ] Phone validation tests (various formats)
- [ ] Display formatting tests
- [ ] Edge cases (null, empty, invalid)

### Emergency Service (app/src/lib/emergencyService.js)

**File:** `/app/src/lib/emergencyService.js`
**Function:** `sendSMS()`

**Missing Tests:**
- [ ] Supabase function invocation mock
- [ ] Payload construction tests
- [ ] Error handling tests

---

## Code Duplication Issue

### Problem: 7 Duplicate Twilio API Implementations

Each Edge Function implements its own `fetch()` call to Twilio:

| Function | Lines | Duplicated Code |
|----------|-------|-----------------|
| `send-sms/lib/twilioClient.ts` | 64-71 | ✅ (Reference) |
| `sendMagicLinkSms.ts` | 89-96 | ❌ Duplicate |
| `emergency/sendSMS.ts` | 147-154 | ❌ Duplicate |
| `messages/adminSendReminder.ts` | 164-178 | ❌ Duplicate |

**Recommendation:** Consolidate to shared `twilioClient.ts` usage.

---

## Service Tests with Good Coverage (Reference)

### Existing Test Patterns in Codebase

**Error Class Tests** (`/supabase/functions/_shared/errors_test.ts`):
- Uses Deno test runner
- Tests instantiation, inheritance, properties
- Good pattern for Edge Function testing

**Matching Algorithm Tests** (`/app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`):
- Uses Vitest
- Tests with sample data
- Covers edge cases

**These patterns should be followed for SMS testing.**

---

## Recommended MSW Handler

```typescript
// supabase/functions/_shared/mocks/twilioHandlers.ts
import { http, HttpResponse } from 'msw';

const TWILIO_BASE_URL = 'https://api.twilio.com';
const TWILIO_API_VERSION = '2010-04-01';

// Capture sent messages for assertions
export const sentMessages: Array<{
  to: string;
  from: string;
  body: string;
  accountSid: string;
  timestamp: string;
}> = [];

export function clearSentMessages() {
  sentMessages.length = 0;
}

export const twilioHandlers = [
  // Mock Twilio Messages API
  http.post(
    `${TWILIO_BASE_URL}/${TWILIO_API_VERSION}/Accounts/:accountSid/Messages.json`,
    async ({ request, params }) => {
      const accountSid = params.accountSid;

      // Parse form data
      const formData = await request.formData();
      const to = formData.get('To') as string;
      const from = formData.get('From') as string;
      const body = formData.get('Body') as string;

      // Validate phone numbers (E.164)
      const E164_REGEX = /^\+[1-9]\d{1,14}$/;
      if (!E164_REGEX.test(to) || !E164_REGEX.test(from)) {
        return HttpResponse.json(
          {
            code: 21211,
            message: 'Invalid phone number',
            more_info: 'https://www.twilio.com/docs/errors/21211',
            status: 400,
          },
          { status: 400 }
        );
      }

      // Simulate specific test numbers for error scenarios
      if (to === '+15551234567') {
        // Invalid number error
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

      if (to === '+15551239999') {
        // Rate limit error
        return HttpResponse.json(
          {
            code: 20429,
            message: 'Too many requests',
            more_info: 'https://www.twilio.com/docs/errors/20429',
            status: 429,
          },
          { status: 429 }
        );
      }

      // Capture message for assertions
      sentMessages.push({
        to,
        from,
        body,
        accountSid,
        timestamp: new Date().toISOString(),
      });

      // Return success response (201 = Created)
      const messageSid = `SM${Date.now()}${Math.random().toString(36).substring(7)}`;
      return HttpResponse.json(
        {
          sid: messageSid,
          date_created: new Date().toISOString(),
          date_updated: new Date().toISOString(),
          date_sent: null,
          account_sid: accountSid,
          to,
          from,
          messaging_service_sid: null,
          body,
          status: 'queued',
          num_segments: Math.ceil(body.length / 160).toString(),
          num_media: '0',
          direction: 'outbound-api',
          api_version: TWILIO_API_VERSION,
          price: null,
          price_unit: 'USD',
          error_code: null,
          error_message: null,
          uri: `/${TWILIO_API_VERSION}/Accounts/${accountSid}/Messages/${messageSid}.json`,
        },
        { status: 201 }
      );
    }
  ),
];
```

---

## Recommended Module Mock

```typescript
// supabase/functions/send-sms/lib/__mocks__/twilioClient.ts
import type { TwilioResponse } from '../types.ts';

// Capture sent messages for assertions
export const sentMessages: Array<{
  to: string;
  from: string;
  body: string;
}> = [];

export function clearSentMessages() {
  sentMessages.length = 0;
}

// Mock buildTwilioRequestBody
export function buildTwilioRequestBody(params: {
  toPhone: string;
  fromPhone: string;
  body: string;
  statusCallback?: string;
}): URLSearchParams {
  const formData = new URLSearchParams();
  formData.append('To', params.toPhone);
  formData.append('From', params.fromPhone);
  formData.append('Body', params.body);
  if (params.statusCallback) {
    formData.append('StatusCallback', params.statusCallback);
  }
  return formData;
}

// Mock sendSms
export async function sendSms(
  _accountSid: string,
  _authToken: string,
  requestBody: URLSearchParams
): Promise<TwilioResponse> {
  const to = requestBody.get('To') as string;
  const from = requestBody.get('From') as string;
  const body = requestBody.get('Body') as string;

  // Capture message
  sentMessages.push({ to, from, body });

  // Simulate errors for test numbers
  if (to === '+15551234567') {
    return {
      statusCode: 400,
      body: {
        code: 21211,
        message: 'Invalid phone number',
        more_info: 'https://www.twilio.com/docs/errors/21211',
        status: 400,
      },
    };
  }

  // Return success
  const messageSid = `SM${Date.now()}`;
  return {
    statusCode: 201,
    body: {
      sid: messageSid,
      date_created: new Date().toISOString(),
      to,
      from,
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
      uri: `/2010-04-01/Accounts/${_accountSid}/Messages/${messageSid}.json`,
    },
  };
}

// Mock isSuccessResponse
export function isSuccessResponse(response: TwilioResponse): boolean {
  return response.statusCode === 201;
}

// Mock getMessageSid
export function getMessageSid(response: TwilioResponse): string | undefined {
  if (isSuccessResponse(response) && response.body && typeof response.body === 'object') {
    return (response.body as { sid: string }).sid;
  }
  return undefined;
}
```

---

## Test File Examples

### Example 1: Test SMS Sent (Vitest)

```typescript
// supabase/functions/send-sms/index_test.ts
import { assertEquals, assertExists } from 'jsr:@std/assert';
import { clearSentMessages, sentMessages } from './lib/__mocks__/twilioClient.ts';
import { handleSend } from './index.ts';

Deno.test('sendSMS sends message successfully', async () => {
  clearSentMessages();

  const result = await handleSend({
    to: '+14155551234',
    from: '+14155692985',
    body: 'Test message',
  });

  // Verify result
  assertEquals(result.status, 'queued');
  assertExists(result.message_sid);

  // Verify message was captured
  assertEquals(sentMessages.length, 1);
  assertEquals(sentMessages[0].to, '+14155551234');
  assertEquals(sentMessages[0].body, 'Test message');
});
```

### Example 2: Test Invalid Phone (Vitest)

```typescript
Deno.test('sendSMS rejects invalid phone number', async () => {
  clearSentMessages();

  await assertThrowsAsync(
    async () => {
      await handleSend({
        to: '+15551234567', // Invalid in mock
        from: '+14155692985',
        body: 'Test',
      });
    },
    Error,
    'Invalid phone number'
  );

  assertEquals(sentMessages.length, 0);
});
```

### Example 3: Test No SMS on Auth Failure

```typescript
Deno.test('sendSMS does not send when credentials missing', async () => {
  // Clear env vars
  delete Deno.env.get('TWILIO_ACCOUNT_SID');

  await assertThrowsAsync(
    async () => {
      await handleSend({
        to: '+14155551234',
        from: '+14155692985',
        body: 'Test',
      });
    },
    Error,
    'Missing Twilio credentials'
  );
});
```

---

## Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Real SMS in tests | Mock Twilio API |
| Testing with live credentials | Use MSW handlers |
| Not testing message content | Assert message body |
| Ignoring error cases | Test invalid numbers, auth failures |
| No message capture | Store for assertions |
| Duplicated API calls | Consolidate to shared client |
| Inline `fetch()` to Twilio | Extract to `twilioClient.ts` |
| Testing payment then SMS separately | Test atomic operations |

---

## Implementation Priority

### High Priority (Core SMS Functionality)
1. **MSW handlers for Twilio API** - Enables all other SMS tests
2. **`twilioClient.ts` module mock** - Test send-sms Edge Function
3. **Message capture utilities** - `sentMessages`, `clearSentMessages()`
4. **Phone validation tests** - E.164 format validation

### Medium Priority (Business Logic)
5. **Magic link SMS tests** - Auth flow critical path
6. **Emergency SMS tests** - Safety-critical feature
7. **Lease notification tests** - Business-critical workflow

### Low Priority (Nice to Have)
8. **Reminder SMS tests** - Admin feature
9. **Webhook handler tests** - Delivery status tracking
10. **Phone utility tests** - Frontend formatting

---

## Next Steps

1. **Install MSW** (if not already installed):
   ```bash
   bun add -D msw
   ```

2. **Create mock directory structure**:
   ```
   supabase/functions/_shared/mocks/
   ├── twilioHandlers.ts
   └── supabaseClient.ts
   ```

3. **Create test files** for each SMS function:
   - `send-sms/index_test.ts`
   - `auth-user/sendMagicLinkSms_test.ts`
   - `emergency/sendSMS_test.ts`
   - `messages/adminSendReminder_test.ts`
   - `lease/notifications_test.ts`

4. **Add to CI/CD pipeline**:
   ```yaml
   - name: Run SMS tests
     run: bun test supabase/functions/**/*_test.ts
   ```

5. **Set up Twilio test credentials** for integration tests (optional):
   - Use Twilio Test Account credentials
   - Test phone numbers: +15005550001 (valid), +15005550006 (invalid)

---

**Report Generated:** 2026-01-25T21:36:00Z
**Audit Command:** `/audit-twilio-sms-mocking`
**Status:** Complete - 7 SMS implementations identified, 0% test coverage
