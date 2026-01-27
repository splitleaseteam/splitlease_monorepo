# Twilio SMS Mocking Opportunity Report
**Generated:** 2026-01-25T11:36:31Z
**Codebase:** Split Lease
**Audit Scope:** All Twilio SMS functionality requiring mock coverage for testing

## Executive Summary
- **SMS sending functions found:** 8 distinct implementations
- **Edge Functions using Twilio directly:** 5 (send-sms, auth-user, emergency, messages, house-manual stub)
- **Edge Functions calling send-sms internally:** 4 (lease, reminder-scheduler, _shared/notificationHelpers, _shared/vmMessagingHelpers)
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
| Vitest configuration | ⚠️ Partial | `app/vite.config.js` |
| Deno test runner | ✅ Yes | For Edge Functions |
| MSW (Mock Service Worker) | ❌ Not installed | N/A |
| React Testing Library | ❌ Not configured | N/A |
| Existing tests | ✅ 1 file | `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js` |

---

## Critical Gaps (No Mocking)

### 1. send-sms Edge Function (Primary SMS Gateway)

**File:** `supabase/functions/send-sms/index.ts`
**Function:** `handleSend()` (lines 98-147)
**Twilio Client:** `supabase/functions/send-sms/lib/twilioClient.ts`

**Implementation Details:**
```typescript
// twilioClient.ts lines 50-93: Direct Twilio API call
export async function sendSms(
  accountSid: string,
  authToken: string,
  requestBody: URLSearchParams
): Promise<TwilioResponse> {
  const endpoint = buildTwilioEndpoint(accountSid);
  const credentials = btoa(`${accountSid}:${authToken}`);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: requestBody.toString(),
  });
  // ...
}
```

**Missing Mock Coverage:**
- [ ] MSW handler for `https://api.twilio.com/2010-04-01/Accounts/*/Messages.json`
- [ ] Module mock for `twilioClient.ts` (`sendSms`, `buildTwilioRequestBody`)
- [ ] Message content assertions (to, from, body)
- [ ] Success response (201 Created with SID)
- [ ] Error response handling (400, 401, 403, 429)
- [ ] Invalid phone number handling (E.164 validation)
- [ ] Public from number bypass test (`+14155692985`)
- [ ] Missing credentials error handling
- [ ] `sentMessages` array for capture
- [ ] `clearSentMessages()` helper

**Test Scenarios Needed:**
1. Successful SMS send (201 response)
2. Invalid phone number format (E.164 validation)
3. Missing Twilio credentials
4. Invalid auth token (401)
5. Rate limiting (429)
6. Public from number bypass (`+14155692985`)
7. Health check action

---

### 2. Magic Link SMS (auth-user)

**File:** `supabase/functions/auth-user/handlers/sendMagicLinkSms.ts`
**Function:** `sendSmsViaTwilio()` (lines 66-112)
**Usage:** Atomic operation - generates Supabase magic link + sends via Twilio

**Implementation Details:**
```typescript
// Lines 66-112: Inline Twilio API call (duplicated from send-sms)
async function sendSmsViaTwilio(
  toPhone: string,
  body: string
): Promise<{ message_sid: string; sent_at: string }> {
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = btoa(`${accountSid}:${authToken}`);
  const formData = new URLSearchParams();
  formData.append('To', toPhone);
  formData.append('From', TWILIO_FROM_NUMBER);
  formData.append('Body', body);
  // ...
}
```

**Missing Mock Coverage:**
- [ ] MSW handler for magic link SMS endpoint
- [ ] Message template validation (contains magic link URL)
- [ ] Phone format validation (E.164)
- [ ] Atomic operation test (link generation + SMS send)
- [ ] Failure when link generation succeeds but SMS fails
- [ ] 15-minute expiry mention in message body
- [ ] Supabase Auth admin client mocking (`generateLink`)

**Test Scenarios Needed:**
1. Magic link SMS sent successfully
2. Invalid phone number format
3. Missing Twilio credentials
4. Link generation fails (no SMS sent)
5. Link generation succeeds but SMS fails (atomicity test)
6. Invalid email format

---

### 3. Emergency SMS (emergency)

**File:** `supabase/functions/emergency/handlers/sendSMS.ts`
**Function:** `sendTwilioSMS()` (lines 129-166)
**Usage:** Emergency response SMS with database logging

**Implementation Details:**
```typescript
// Lines 129-166: Third duplicate of Twilio API call
async function sendTwilioSMS(params: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}): Promise<{ sid: string; status: string }> {
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const formData = new URLSearchParams();
  formData.append('To', to);
  formData.append('From', from);
  formData.append('Body', body);
  // ...
}
```

**Missing Mock Coverage:**
- [ ] MSW handler for emergency SMS
- [ ] Database logging verification (`emergency_message` table)
- [ ] Message log status updates (PENDING → SENT/FAILED)
- [ ] `twilio_sid` storage in database
- [ ] Error message capture on failure
- [ ] Emergency ID validation (exists check)

**Test Scenarios Needed:**
1. Emergency SMS sent and logged with SID
2. SMS failure logged in database with error
3. Emergency not found error
4. Missing recipient phone
5. Missing message body
6. Twilio error captured in log

---

### 4. Message Reminder SMS (messages)

**File:** `supabase/functions/messages/handlers/adminSendReminder.ts`
**Function:** `sendReminderSms()` (lines 139-192)
**Usage:** Admin-only thread reminder notifications

**Implementation Details:**
```typescript
// Lines 139-192: Fourth duplicate of Twilio API call
async function sendReminderSms(
  to: string,
  recipientName: string,
  threadSubject: string
): Promise<boolean> {
  // Phone number formatting (10 digits → E.164)
  let formattedPhone = to.replace(/\D/g, '');
  if (formattedPhone.length === 10) {
    formattedPhone = '+1' + formattedPhone;
  }
  // Direct Twilio API call...
}
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
1. Reminder sent to host via SMS
2. Reminder sent to guest via SMS
3. Reminder sent to both parties
4. Email only (no SMS)
5. SMS only (no email)
6. Non-admin user rejected
7. Thread not found error
8. Phone formatting edge cases

---

### 5. Lease Notification SMS (lease)

**File:** `supabase/functions/lease/handlers/notifications.ts`
**Functions:** `sendGuestSms()` (lines 199-230), `sendHostSms()` (lines 235-267)
**Usage:** Calls `send-sms` Edge Function (not direct Twilio API)

**Implementation Details:**
```typescript
// Lines 210-225: Calls send-sms Edge Function
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
- [ ] Mock for internal `send-sms` Edge Function invocation
- [ ] User preference filtering (`shouldSendSms()` logic)
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

### 6. Reminder Scheduler SMS (reminder-scheduler)

**File:** `supabase/functions/reminder-scheduler/lib/scheduler.ts`
**Function:** `sendSmsNotification()` (lines 74-107)
**Usage:** Calls `send-sms` Edge Function via Supabase client

**Implementation Details:**
```typescript
// Lines 74-107: Invokes send-sms Edge Function
export const sendSmsNotification = async (
  supabase: ReturnType<typeof createClient>,
  data: SmsNotificationData
): Promise<{ success: boolean; messageSid?: string; error?: string }> => {
  const { data: responseData, error } = await supabase.functions.invoke('send-sms', {
    body: {
      action: 'send',
      payload: {
        to: data.toPhone,
        from: data.fromPhone || DEFAULT_SMS_FROM,
        body: data.message,
      },
    },
  });
  // ...
}
```

**Missing Mock Coverage:**
- [ ] Supabase functions.invoke mock
- [ ] Message SID capture
- [ ] Error handling (success: false)
- [ ] `processReminder()` integration tests

**Test Scenarios Needed:**
1. SMS notification sent successfully
2. SMS notification fails with error
3. No phone number available
4. Reminder processing with SMS channel enabled

---

### 7. Notification Helpers SMS (_shared/notificationHelpers.ts)

**File:** `supabase/functions/_shared/notificationHelpers.ts`
**Function:** `sendProposalSms()` (lines 172-216)
**Usage:** Fire-and-forget SMS via internal Edge Function

**Implementation Details:**
```typescript
// Lines 172-216: Fire-and-forget internal call
export async function sendProposalSms(
  params: SendSmsParams
): Promise<void> {
  // Fire-and-forget - we don't await the full response
  fetch(smsEndpoint, {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify({
      action: 'send',
      payload: {
        to: params.to,
        from: SPLIT_LEASE_SMS_NUMBER,
        body: params.body,
      },
    }),
  }).then((response) => { ... }).catch((e) => { ... });
}
```

**Missing Mock Coverage:**
- [ ] Notification preference checks (`shouldSendSms()`)
- [ ] Fire-and-forget behavior testing
- [ ] Category-based preferences (proposal_updates_sms)

**Test Scenarios Needed:**
1. SMS sent when preferences allow
2. SMS skipped when preferences deny
3. Fire-and-forget doesn't block caller
4. Error logging without throwing

---

### 8. VM Messaging Helpers SMS (_shared/vmMessagingHelpers.ts)

**File:** `supabase/functions/_shared/vmMessagingHelpers.ts`
**Function:** `sendSms()` (lines 169-215)
**Usage:** Virtual meeting notifications (request/accept)

**Implementation Details:**
```typescript
// Lines 169-215: Direct Twilio API call (5th duplicate!)
async function sendSms(params: {
  toPhone: string;
  messageBody: string;
}): Promise<boolean> {
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromPhone = Deno.env.get('TWILIO_FROM_PHONE');
  // Direct fetch to Twilio API...
}
```

**Missing Mock Coverage:**
- [ ] MSW handler for VM SMS
- [ ] Phone validation (E.164 format check)
- [ ] Missing credentials handling
- [ ] VM request messages (host/guest)
- [ ] VM accept messages (confirmed/pending)

**Test Scenarios Needed:**
1. VM request SMS to guest
2. VM request SMS to host
3. VM accept SMS to both parties
4. Invalid phone format skipped
5. Missing Twilio credentials logged

---

### 9. Twilio Webhook Handler (reminder-scheduler)

**File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts`
**Function:** `handleTwilioWebhook()` (lines 117-162)
**Usage:** Receives webhooks FROM Twilio for delivery status tracking

**Implementation Details:**
```typescript
// Lines 117-162: Handles inbound Twilio webhooks
export const handleTwilioWebhook = async (
  payload: WebhookPayload,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ updated: boolean }> => {
  const deliveryStatus = mapTwilioEvent(payload.event);
  // Updates remindersfromhousemanual table
}
```

**Missing Mock Coverage:**
- [ ] Webhook payload mocks (delivered, failed, undelivered events)
- [ ] Database update verification (`delivery_status`, `delivered_at`)
- [ ] Message SID lookup (`twilio_message_sid`)
- [ ] Event mapping tests

**Test Scenarios Needed:**
1. Delivered event updates status
2. Failed event updates status
3. Undelivered event updates status
4. Unknown event ignored
5. Missing message SID handled gracefully

---

## Code Duplication Issue

### Problem: 5 Duplicate Twilio API Implementations

Each Edge Function implements its own `fetch()` call to Twilio:

| Function | File | Lines | Status |
|----------|------|-------|--------|
| `twilioClient.sendSms()` | `send-sms/lib/twilioClient.ts` | 50-93 | ✅ Reference |
| `sendSmsViaTwilio()` | `auth-user/handlers/sendMagicLinkSms.ts` | 66-112 | ❌ Duplicate |
| `sendTwilioSMS()` | `emergency/handlers/sendSMS.ts` | 129-166 | ❌ Duplicate |
| `sendReminderSms()` | `messages/handlers/adminSendReminder.ts` | 139-192 | ❌ Duplicate |
| `sendSms()` | `_shared/vmMessagingHelpers.ts` | 169-215 | ❌ Duplicate |

**Recommendation:** Consolidate all Twilio API calls to use `twilioClient.ts` from `send-sms/lib/` or create a shared `_shared/twilioClient.ts`.

---

## Message Template Gaps

### Templates Without Tests

| Template | File | Line | Content Tested |
|----------|------|------|----------------|
| Magic Link | `sendMagicLinkSms.ts` | 58-59 | ❌ No |
| Lease Guest | `notifications.ts` | 222 | ❌ No |
| Lease Host | `notifications.ts` | 259 | ❌ No |
| Message Reminder | `adminSendReminder.ts` | 161 | ❌ No |
| Emergency Alert | `sendSMS.ts` | variable | ❌ No |
| VM Request Guest | `vmMessagingHelpers.ts` | 379-381 | ❌ No |
| VM Request Host | `vmMessagingHelpers.ts` | 391-393 | ❌ No |
| VM Accept | `vmMessagingHelpers.ts` | 542-544 | ❌ No |

### Missing Template Tests
- [ ] Character limit validation (160 for single SMS, 1600 for concatenated)
- [ ] E.164 phone format in all templates
- [ ] Dynamic content interpolation (agreement numbers, names, links, dates)
- [ ] URL encoding in magic links
- [ ] Special character handling
- [ ] Timezone formatting (EST in VM messages)

---

## Frontend SMS Usage

### Emergency Service (`app/src/lib/emergencyService.js`)

**Function:** `sendSMS()` (lines 100-102)
**Usage:** Calls emergency Edge Function

**Missing Tests:**
- [ ] Supabase function invocation mock
- [ ] Payload construction tests
- [ ] Error handling tests

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
        accountSid: accountSid as string,
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

export function buildTwilioEndpoint(accountSid: string): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
}

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
    },
  };
}

export function isSuccessResponse(response: TwilioResponse): boolean {
  return response.statusCode === 201;
}

export function getMessageSid(response: TwilioResponse): string | undefined {
  if (isSuccessResponse(response) && response.body && typeof response.body === 'object') {
    return (response.body as { sid: string }).sid;
  }
  return undefined;
}
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
| Inline `fetch()` to Twilio | Extract to shared `twilioClient.ts` |
| Testing payment then SMS separately | Test atomic operations |
| Fire-and-forget without logging | Verify error handling |

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
8. **VM messaging tests** - User engagement feature

### Low Priority (Infrastructure)
9. **Webhook handler tests** - Delivery status tracking
10. **Reminder scheduler tests** - Automated notifications
11. **Code consolidation** - Remove Twilio API duplicates

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
   └── index.ts

   supabase/functions/send-sms/lib/__mocks__/
   └── twilioClient.ts
   ```

3. **Create test files** for each SMS function:
   - `send-sms/index_test.ts`
   - `auth-user/handlers/sendMagicLinkSms_test.ts`
   - `emergency/handlers/sendSMS_test.ts`
   - `messages/handlers/adminSendReminder_test.ts`
   - `lease/handlers/notifications_test.ts`
   - `reminder-scheduler/lib/scheduler_test.ts`
   - `_shared/vmMessagingHelpers_test.ts`
   - `reminder-scheduler/handlers/webhook_test.ts`

4. **Consolidate Twilio API calls**:
   - Move `twilioClient.ts` to `_shared/`
   - Update all Edge Functions to use shared client
   - Remove 4 duplicate implementations

5. **Add to CI/CD pipeline**:
   ```yaml
   - name: Run SMS tests
     run: deno test supabase/functions/**/*_test.ts
   ```

---

**Report Generated:** 2026-01-25T11:36:31Z
**Audit Command:** `/audit-twilio-sms-mocking`
**Status:** Complete - 8 SMS implementations identified, 0% test coverage
**Previous Audit:** 2026-01-25T21:36:00Z (same findings, updated details)
