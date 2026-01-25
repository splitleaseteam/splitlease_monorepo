# Webhook Handler Testing Opportunity Report
**Generated:** 2026-01-25T11:31:40Z
**Codebase:** Split Lease
**Audit Type:** Webhook Handler Test Coverage

## Executive Summary
- **Webhook handlers found:** 4
- **Handlers needing tests:** 4 (100%)
- **Signature validation gaps:** 4 (CRITICAL)
- **Idempotency gaps:** 4
- **Test files found:** 0

### Critical Finding
**No webhook handlers in the Split Lease codebase have any test coverage.** The Edge Functions directory (`supabase/functions/`) contains no `.test.ts` or `.spec.ts` files. All identified webhook handlers lack tests for signature verification, idempotency, and business logic.

---

## Infrastructure Check

### Webhook Test Helpers Status
- [ ] Stripe signature generator exists - **NOT FOUND**
- [ ] Twilio signature generator exists - **NOT FOUND**
- [ ] SendGrid signature generator exists - **NOT FOUND**
- [ ] Slack signature generator exists - **NOT FOUND**
- [ ] Webhook event factory functions exist - **NOT FOUND**
- [ ] Test database setup for webhook tests - **NOT FOUND**

### Test Framework Status
- **Edge Functions Test Files:** 0 found in `supabase/functions/`
- **App Test Files:** 1 found (`app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`) - not webhook related

---

## Identified Webhook Handlers

### 1. SendGrid Webhook Handler (Delivery Tracking)

**File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts:49-112`
**Entry Point:** `supabase/functions/reminder-scheduler/index.ts` (action: `webhook-sendgrid`)

**Current Implementation:**
- Handles email delivery status updates: `delivered`, `bounce`, `blocked`, `dropped`, `deferred`, `open`
- Updates `remindersfromhousemanual` table with delivery status
- No signature verification implemented

**Missing Tests:**
- [ ] Valid SendGrid signature accepted
- [ ] Invalid SendGrid signature rejected
- [ ] Missing signature rejected
- [ ] `delivered` event updates delivery_status correctly
- [ ] `bounce` event maps to 'bounced' status
- [ ] `open` event updates opened_at timestamp
- [ ] `dropped` event maps to 'failed' status
- [ ] Missing messageId returns `{ updated: false }`
- [ ] Unknown event types handled gracefully
- [ ] Database update errors handled
- [ ] Duplicate event processing (idempotency)
- [ ] Returns 200 for successful processing

---

### 2. Twilio Webhook Handler (SMS Delivery Tracking)

**File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts:117-162`
**Entry Point:** `supabase/functions/reminder-scheduler/index.ts` (action: `webhook-twilio`)

**Current Implementation:**
- Handles SMS delivery status updates: `delivered`, `failed`, `undelivered`
- Updates `remindersfromhousemanual` table via `twilio_message_sid`
- **No Twilio signature verification implemented** (CRITICAL SECURITY GAP)

**Missing Tests:**
- [ ] Valid Twilio signature accepted
- [ ] Invalid Twilio signature rejected (X-Twilio-Signature header)
- [ ] Missing signature rejected
- [ ] `delivered` event updates delivery_status correctly
- [ ] `failed` event maps to 'failed' status
- [ ] `undelivered` event maps to 'failed' status
- [ ] Missing messageSid returns `{ updated: false }`
- [ ] Unknown event types handled gracefully
- [ ] Database update errors handled
- [ ] Duplicate event processing (idempotency)
- [ ] Returns 200 for successful processing
- [ ] Timestamp validation for replay attack prevention

---

### 3. Slack Interactive Callback Handler

**File:** `supabase/functions/cohost-request-slack-callback/index.ts`

**Current Implementation:**
- Handles Slack interactive components (buttons, modals)
- Processes `block_actions` (button clicks) and `view_submission` (modal submissions)
- Updates `co_hostrequest` table with assignment data
- Triggers host notifications via internal Edge Function call
- **CORS headers mention `x-slack-signature` but NO signature validation is implemented** (CRITICAL SECURITY GAP)

**Missing Tests:**
- [ ] Valid Slack signature accepted (HMAC-SHA256)
- [ ] Invalid Slack signature rejected
- [ ] Request timestamp validation (prevent replay attacks)
- [ ] Missing payload parameter returns 400
- [ ] `block_actions` type routes to button handler
- [ ] `view_submission` type routes to modal handler
- [ ] Unknown payload type returns 400
- [ ] Button click opens modal with correct fields
- [ ] Modal submission validates co-host selection
- [ ] Modal submission validates time selection
- [ ] Database update succeeds and returns 200
- [ ] Database update fails returns proper error
- [ ] Slack message update fires after assignment
- [ ] Host notification trigger fires correctly
- [ ] CORS preflight returns correct headers

---

### 4. Slack FAQ Inquiry Handler

**File:** `supabase/functions/slack/index.ts`

**Current Implementation:**
- Sends FAQ inquiries to Slack channels via webhooks
- Validates required fields (name, email, inquiry)
- Validates email format
- Sends to multiple Slack channels (acquisition, general)
- **Outbound webhook only** - no inbound signature verification needed

**Missing Tests:**
- [ ] Valid payload sends to both Slack channels
- [ ] Missing required fields returns validation error
- [ ] Invalid email format returns validation error
- [ ] Missing webhook environment variables throws config error
- [ ] Partial webhook failure (one success, one fail) returns success
- [ ] All webhooks fail returns error
- [ ] CORS preflight returns correct headers
- [ ] Non-POST methods return 400
- [ ] `diagnose` action returns environment info

---

## Security Test Gaps

| Handler | Signature Verification | Timestamp Validation | Replay Prevention |
|---------|----------------------|---------------------|-------------------|
| SendGrid webhook | NOT IMPLEMENTED | NOT IMPLEMENTED | NOT IMPLEMENTED |
| Twilio webhook | NOT IMPLEMENTED | NOT IMPLEMENTED | NOT IMPLEMENTED |
| Slack callback | NOT IMPLEMENTED (headers defined) | NOT IMPLEMENTED | NOT IMPLEMENTED |
| Slack FAQ | N/A (outbound only) | N/A | N/A |

### CRITICAL: No webhook handlers verify request authenticity

All inbound webhook handlers accept requests without verifying they come from the expected source. This exposes the system to:
- **Spoofed delivery updates**: Attackers could mark messages as delivered/failed
- **Unauthorized co-host assignments**: Anyone could trigger the Slack callback
- **Data manipulation**: Attackers could inject false data into the database

---

## Idempotency Test Gaps

| Handler | Idempotency Key | Duplicate Check | Test Coverage |
|---------|-----------------|-----------------|---------------|
| SendGrid webhook | `sendgrid_message_id` | DB lookup only | NONE |
| Twilio webhook | `twilio_message_sid` | DB lookup only | NONE |
| Slack callback | `requestId` | Not implemented | NONE |

**Note:** Current implementations rely on database constraints but don't explicitly check for or handle duplicate events.

---

## Side Effect Test Gaps

| Handler | DB Update | Email/SMS Trigger | Notification |
|---------|-----------|-------------------|--------------|
| SendGrid webhook | Updates `delivery_status`, `delivered_at`, `opened_at` | None | None |
| Twilio webhook | Updates `delivery_status`, `delivered_at` | None | None |
| Slack callback | Updates `co_hostrequest` table | None | Triggers `cohost-request/notify-host` |

---

## Response Code Test Gaps

| Scenario | Expected | Tested |
|----------|----------|--------|
| Valid webhook with correct signature | 200 | NOT TESTED |
| Invalid signature | 400/401 | NOT TESTED |
| Missing signature | 400/401 | NOT TESTED |
| Expired timestamp | 400 | NOT TESTED |
| Duplicate event | 200 (idempotent) | NOT TESTED |
| Database error | 500 | NOT TESTED |
| Missing required fields | 400 | NOT TESTED |

---

## Handlers with Good Coverage (Reference)

**None identified.** No webhook handlers in this codebase have test coverage.

---

## Recommended Test Helpers

### SendGrid Signature Generator
```typescript
import { createHmac } from 'crypto';

/**
 * Generate SendGrid Event Webhook signature
 * SendGrid uses ECDSA with SHA-256 for webhook signatures
 * For testing, we can use a simplified HMAC approach with a test key
 */
export function generateSendGridSignature(
  payload: string,
  verificationKey: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): { signature: string; timestamp: string } {
  const timestampPayload = `${timestamp}${payload}`;
  const signature = createHmac('sha256', verificationKey)
    .update(timestampPayload)
    .digest('base64');

  return {
    signature,
    timestamp: timestamp.toString()
  };
}
```

### SendGrid Event Factory
```typescript
export function createSendGridEvent(
  event: 'delivered' | 'bounce' | 'blocked' | 'dropped' | 'deferred' | 'open',
  messageId: string,
  timestamp?: string
) {
  return {
    event,
    messageId,
    timestamp: timestamp || new Date().toISOString(),
    email: 'test@example.com',
    sg_event_id: `evt_${Date.now()}`,
    sg_message_id: messageId,
  };
}
```

### Twilio Signature Generator
```typescript
import { createHmac } from 'crypto';

/**
 * Generate Twilio request signature
 * @see https://www.twilio.com/docs/usage/security#validating-requests
 */
export function generateTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string
): string {
  // Sort params alphabetically by key and concatenate
  const data = url + Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], '');

  return createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');
}

export function createTwilioStatusCallback(
  messageSid: string,
  status: 'delivered' | 'failed' | 'undelivered' | 'sent' | 'queued'
): Record<string, string> {
  return {
    MessageSid: messageSid,
    MessageStatus: status,
    AccountSid: 'AC_test_account_sid',
    From: '+15551234567',
    To: '+15559876543',
  };
}
```

### Slack Signature Generator
```typescript
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Generate Slack request signature
 * @see https://api.slack.com/authentication/verifying-requests-from-slack
 */
export function generateSlackSignature(
  signingSecret: string,
  timestamp: number,
  body: string
): string {
  const sigBaseString = `v0:${timestamp}:${body}`;
  const signature = createHmac('sha256', signingSecret)
    .update(sigBaseString)
    .digest('hex');

  return `v0=${signature}`;
}

export function createSlackInteractivePayload(
  type: 'block_actions' | 'view_submission',
  actionData: Record<string, unknown>
): string {
  const payload = {
    type,
    user: { id: 'U123456', name: 'testuser', username: 'testuser' },
    trigger_id: `${Date.now()}.12345.abcdef`,
    ...actionData
  };

  return `payload=${encodeURIComponent(JSON.stringify(payload))}`;
}
```

---

## Recommended Implementation Order

### Priority 1: Security (Signature Verification)
1. Implement Twilio signature verification in `handleTwilioWebhook`
2. Implement SendGrid signature verification in `handleSendGridWebhook`
3. Implement Slack signature verification in `cohost-request-slack-callback`

### Priority 2: Test Infrastructure
1. Create test helper utilities in `supabase/functions/_test-utils/`
2. Set up Vitest or Deno test configuration for Edge Functions
3. Create mock database client for isolated testing

### Priority 3: Unit Tests
1. Add signature validation tests for all webhook handlers
2. Add idempotency tests
3. Add database side-effect tests
4. Add error handling tests

### Priority 4: Integration Tests
1. End-to-end webhook flow tests
2. Error recovery tests
3. Rate limiting tests (if applicable)

---

## Files Requiring Changes

| File | Changes Needed |
|------|----------------|
| `supabase/functions/reminder-scheduler/handlers/webhook.ts` | Add SendGrid/Twilio signature verification |
| `supabase/functions/cohost-request-slack-callback/index.ts` | Add Slack signature verification |
| `supabase/functions/_shared/webhookValidation.ts` | **NEW FILE** - Create shared validation utilities |
| `supabase/functions/_test-utils/signatureHelpers.ts` | **NEW FILE** - Test signature generators |
| `supabase/functions/_test-utils/webhookFactories.ts` | **NEW FILE** - Event factory functions |
| `supabase/functions/reminder-scheduler/handlers/webhook.test.ts` | **NEW FILE** - Webhook handler tests |
| `supabase/functions/cohost-request-slack-callback/index.test.ts` | **NEW FILE** - Slack callback tests |
| `supabase/functions/slack/index.test.ts` | **NEW FILE** - Slack FAQ handler tests |

---

## Environment Variables Required for Testing

```env
# Test Twilio credentials
TWILIO_ACCOUNT_SID=AC_test_account_sid
TWILIO_AUTH_TOKEN=test_auth_token

# Test SendGrid credentials
SENDGRID_API_KEY=SG.test_api_key
SENDGRID_WEBHOOK_VERIFICATION_KEY=test_verification_key

# Test Slack credentials
SLACK_SIGNING_SECRET=test_signing_secret
SLACK_BOT_TOKEN=xoxb-test-token
SLACK_WEBHOOK_ACQUISITION=https://hooks.slack.test/acquisition
SLACK_WEBHOOK_GENERAL=https://hooks.slack.test/general
```

---

## Conclusion

The Split Lease codebase has **zero test coverage for webhook handlers** and **no signature verification** for inbound webhooks. This represents both a testing gap and a security vulnerability.

**Immediate action recommended:**
1. Implement signature verification for all inbound webhooks (security)
2. Create test infrastructure for Edge Functions
3. Add comprehensive tests for all webhook handlers

**Estimated effort:** 2-3 days for full implementation with tests
