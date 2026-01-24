# Webhook Handler Testing Audit Report
**Generated:** 2026-01-23
**Codebase:** Split Lease
**Auditor:** Claude Code

---

## Executive Summary

- **Webhook handlers found:** 3 (SendGrid, Twilio, Slack webhook consumer)
- **Handlers needing tests:** 3 (100%)
- **Signature validation gaps:** 3 (0% have signature verification)
- **Idempotency gaps:** 3 (0% have idempotency protection)
- **Test coverage:** 0% (No test files exist)

### Critical Security Findings

🚨 **CRITICAL:** All webhook handlers lack signature verification, allowing arbitrary requests to trigger side effects without authentication.

---

## Infrastructure Check

### Webhook Test Helpers Status

| Helper | Status | Location |
|--------|--------|----------|
| Stripe signature generator | ❌ DOES NOT EXIST | N/A |
| Twilio signature generator | ❌ DOES NOT EXIST | N/A |
| SendGrid signature generator | ❌ DOES NOT EXIST | N/A |
| Webhook event factory functions | ❌ DOES NOT EXIST | N/A |
| Test database setup for webhook tests | ❌ DOES NOT EXIST | N/A |
| Vitest configuration | ❌ DOES NOT EXIST | N/A |

---

## Handler 1: SendGrid Delivery Webhook

### Location
**File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts:49-112`
**Function:** `handleSendGridWebhook()`
**Action:** `webhook-sendgrid`
**Endpoint:** `POST /functions/v1/reminder-scheduler`

### Purpose
Handles delivery status updates from SendGrid for reminder emails.

### Current Implementation Analysis

```typescript
export const handleSendGridWebhook = async (
  payload: WebhookPayload,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ updated: boolean }> => {
  // NO SIGNATURE VERIFICATION
  // Processes events: delivered, bounce, blocked, dropped, deferred, open
  // Updates remindersfromhousemanual table
}
```

### Security Vulnerabilities

1. **❌ NO SIGNATURE VERIFICATION** - Anyone can POST fake delivery events
2. **❌ NO IDEMPOTENCY** - Duplicate events will cause duplicate DB updates
3. **❌ NO TIMESTAMP VALIDATION** - Replay attacks possible
4. **❌ NO RATE LIMITING** - Vulnerable to flood attacks

### Missing Tests

| Test Case | Status | Priority |
|-----------|--------|----------|
| Valid SendGrid signature accepted | ❌ MISSING | P0 |
| Invalid signature rejected (400) | ❌ MISSING | P0 |
| Missing signature header rejected (400) | ❌ MISSING | P0 |
| Expired timestamp rejected (400) | ❌ MISSING | P1 |
| Duplicate event ignored (idempotency) | ❌ MISSING | P0 |
| `delivered` event updates delivery_status | ❌ MISSING | P1 |
| `delivered` event sets delivered_at | ❌ MISSING | P1 |
| `open` event sets opened_at | ❌ MISSING | P1 |
| `bounce` event sets delivery_status to bounced | ❌ MISSING | P1 |
| `failed` event sets delivery_status to failed | ❌ MISSING | P1 |
| Unknown event logged and ignored | ❌ MISSING | P2 |
| Invalid messageId returns updated:false | ❌ MISSING | P2 |
| Database error handled gracefully | ❌ MISSING | P2 |

### Side Effects to Test

| Side Effect | Tested | Impact |
|-------------|--------|--------|
| DB: delivery_status column updated | ❌ | Data integrity |
| DB: delivered_at timestamp set | ❌ | Analytics accuracy |
| DB: opened_at timestamp set | ❌ | Email open tracking |
| Console: event logged | ❌ | Debuggability |
| Response: 200 on success | ❌ | API contract |
| Response: {updated: true/false} | ❌ | API contract |

---

## Handler 2: Twilio Delivery Webhook

### Location
**File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts:117-162`
**Function:** `handleTwilioWebhook()`
**Action:** `webhook-twilio`
**Endpoint:** `POST /functions/v1/reminder-scheduler`

### Purpose
Handles delivery status updates from Twilio for reminder SMS messages.

### Current Implementation Analysis

```typescript
export const handleTwilioWebhook = async (
  payload: WebhookPayload,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ updated: boolean }> => {
  // NO SIGNATURE VERIFICATION
  // Processes events: delivered, failed, undelivered
  // Updates remindersfromhousemanual table
}
```

### Security Vulnerabilities

1. **❌ NO SIGNATURE VERIFICATION** - Anyone can POST fake delivery events
2. **❌ NO IDEMPOTENCY** - Duplicate events will cause duplicate DB updates
3. **❌ NO URL VALIDATION** - Webhook URL not validated against configured value
4. **❌ NO RATE LIMITING** - Vulnerable to flood attacks

### Missing Tests

| Test Case | Status | Priority |
|-----------|--------|----------|
| Valid Twilio signature accepted | ❌ MISSING | P0 |
| Invalid signature rejected (400) | ❌ MISSING | P0 |
| Missing X-Twilio-Signature header rejected (400) | ❌ MISSING | P0 |
| URL mismatch rejected (400) | ❌ MISSING | P0 |
| Duplicate event ignored (idempotency) | ❌ MISSING | P0 |
| `delivered` event updates delivery_status | ❌ MISSING | P1 |
| `delivered` event sets delivered_at | ❌ MISSING | P1 |
| `failed` event sets delivery_status to failed | ❌ MISSING | P1 |
| `undelivered` event sets delivery_status to failed | ❌ MISSING | P1 |
| Unknown event logged and ignored | ❌ MISSING | P2 |
| Invalid messageSid returns updated:false | ❌ MISSING | P2 |
| Database error handled gracefully | ❌ MISSING | P2 |

### Side Effects to Test

| Side Effect | Tested | Impact |
|-------------|--------|--------|
| DB: delivery_status column updated | ❌ | Data integrity |
| DB: delivered_at timestamp set | ❌ | Analytics accuracy |
| Console: event logged | ❌ | Debuggability |
| Response: 200 on success | ❌ | API contract |
| Response: {updated: true/false} | ❌ | API contract |

---

## Handler 3: Slack Webhook Consumer

### Location
**File:** `supabase/functions/slack/index.ts:170-238`
**Function:** `handleFaqInquiry()`
**Action:** `faq_inquiry`
**Endpoint:** `POST /functions/v1/slack`

### Purpose
Sends FAQ inquiries to Slack channels (outbound webhook, not inbound).

### Implementation Analysis

```typescript
async function handleFaqInquiry(payload: FaqInquiryPayload): Promise<{ message: string }> => {
  // This is an OUTBOUND webhook to Slack
  // Uses SLACK_WEBHOOK_ACQUISITION and SLACK_WEBHOOK_GENERAL env vars
  // NO signature verification (fire-and-forget pattern)
}
```

### Security Assessment

**⚠️ LOW RISK:** This function makes **outbound** webhook calls to Slack, not inbound. It doesn't receive webhooks from external services, so signature verification is not applicable. However:

- **✅ GOOD:** Validates email format
- **✅ GOOD:** Validates required fields
- **⚠️ CONSIDER:** Add rate limiting to prevent Slack abuse

### Missing Tests

| Test Case | Status | Priority |
|-----------|--------|----------|
| Valid payload sends to both channels | ❌ MISSING | P1 |
| Email validation works | ❌ MISSING | P2 |
| Missing required field returns 400 | ❌ MISSING | P2 |
| Invalid email format returns 400 | ❌ MISSING | P2 |
| Webhook failure handled gracefully | ❌ MISSING | P2 |
| Missing env vars returns error | ❌ MISSING | P2 |

---

## Handlers NOT Found (But Should Exist)

### Stripe Payment Webhooks

**Expected Location:** `supabase/functions/stripe-webhook/index.ts` (DOES NOT EXIST)

**Status:** ❌ NOT IMPLEMENTED

**Required Events to Handle:**

| Event | Purpose | Business Logic |
|-------|---------|----------------|
| `payment_intent.succeeded` | Payment completed | Confirm booking, send confirmation email |
| `payment_intent.payment_failed` | Payment failed | Update booking status, notify guest |
| `charge.refunded` | Refund issued | Update booking, send refund notification |
| `charge.dispute.created` | Dispute opened | Notify host, flag booking |
| `customer.subscription.created` | Subscription started | Enable recurring payments |
| `customer.subscription.deleted` | Subscription cancelled | Handle cancellation |

**Impact:** HIGH - Financial transactions without webhook verification are vulnerable to fraud.

---

## Security Test Gaps

### Signature Verification Coverage

| Handler | Signature Test | Timestamp Test | URL Validation | Secret Test |
|---------|----------------|----------------|----------------|-------------|
| SendGrid delivery | ❌ | ❌ | N/A | ❌ |
| Twilio delivery | ❌ | N/A | ❌ | ❌ |
| Stripe payment | N/A | N/A | N/A | N/A (not implemented) |
| Slack (outbound) | N/A | N/A | N/A | N/A |

**Overall Signature Coverage: 0%**

### Idempotency Test Coverage

| Handler | Idempotency Check | Duplicate Event Test | Processing State Tracking |
|---------|-------------------|---------------------|--------------------------|
| SendGrid delivery | ❌ | ❌ | ❌ |
| Twilio delivery | ❌ | ❌ | ❌ |
| Stripe payment | N/A | N/A | N/A |

**Overall Idempotency Coverage: 0%**

---

## Side Effect Test Gaps

### Database Updates

| Handler | delivery_status | delivered_at | opened_at | booking_status |
|---------|----------------|--------------|-----------|----------------|
| SendGrid delivery | ❌ | ❌ | ❌ | N/A |
| Twilio delivery | ❌ | ❌ | N/A | N/A |
| Stripe payment | N/A | N/A | N/A | ❌ |

### External Service Calls

| Handler | Email Sent | SMS Sent | Slack Notification | Error Logged |
|---------|------------|----------|-------------------|--------------|
| SendGrid delivery | N/A | N/A | ❌ | ❌ |
| Twilio delivery | N/A | N/A | ❌ | ❌ |
| Stripe payment | ❌ | ❌ | ❌ | ❌ |

---

## Response Code Test Gaps

| Scenario | Expected | Tested | Handler |
|----------|----------|--------|----------|
| Valid webhook | 200 | ❌ | All |
| Invalid signature | 400 | ❌ | SendGrid, Twilio |
| Expired timestamp | 400 | ❌ | SendGrid |
| Missing header | 400 | ❌ | SendGrid, Twilio |
| Malformed JSON | 400 | ❌ | All |
| Transient DB error | 500 | ❌ | All |
| Invalid messageId | 200 with updated:false | ❌ | SendGrid |
| Invalid messageSid | 200 with updated:false | ❌ | Twilio |

---

## Recommended Test Helpers

### 1. SendGrid Signature Generator

```typescript
// supabase/functions/reminder-scheduler/__tests__/helpers/sendgrid.ts

/**
 * Generate SendGrid webhook signature
 * SendGrid uses HMAC-SHA256 with a timestamp
 */
export function generateSendGridSignature(
  payload: string,
  timestamp: number,
  secret: string
): string {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(`${timestamp}${payload}`);

  return crypto.subtle
    .importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then(key => crypto.subtle.sign('HMAC', key, messageData))
    .then(signature => {
      const signedPayload = `${timestamp}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;
      return signedPayload;
    });
}

/**
 * Create a SendGrid webhook event payload
 */
export function createSendGridEvent(
  event: 'delivered' | 'open' | 'bounce' | 'dropped' | 'deferred',
  messageId: string,
  timestamp?: number
): Record<string, unknown> {
  return {
    event,
    sg_message_id: messageId,
    timestamp: timestamp || Math.floor(Date.now() / 1000),
    email: 'test@example.com',
  };
}
```

### 2. Twilio Signature Generator

```typescript
// supabase/functions/reminder-scheduler/__tests__/helpers/twilio.ts

/**
 * Generate Twilio webhook signature
 * Twilio uses HMAC-SHA1 with URL + sorted params
 */
export function generateTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string
): string {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(authToken);

  // Sort params and concatenate
  const sortedParams = Object.keys(params).sort();
  const data = url + sortedParams.map(k => k + params[k]).join('');
  const messageData = encoder.encode(data);

  return crypto.subtle
    .importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
    .then(key => crypto.subtle.sign('HMAC', key, messageData))
    .then(signature => btoa(String.fromCharCode(...new Uint8Array(signature))));
}

/**
 * Create a Twilio webhook event payload
 */
export function createTwilioEvent(
  status: 'delivered' | 'failed' | 'undelivered',
  messageSid: string
): Record<string, string> {
  return {
    MessageSid: messageSid,
    MessageStatus: status,
    To: '+1234567890',
  };
}
```

### 3. Webhook Event Factory

```typescript
// supabase/functions/__tests__/helpers/webhookFactory.ts

/**
 * Factory for creating webhook test payloads
 */
export class WebhookEventFactory {
  private static eventId = 0;

  static createSendGridDeliveryEvent(overrides?: Partial<SendGridEvent>) {
    return {
      event: 'delivered',
      sg_message_id: `sg_test_${++this.eventId}`,
      timestamp: Math.floor(Date.now() / 1000),
      email: 'guest@example.com',
      ...overrides,
    };
  }

  static createTwilioDeliveryEvent(overrides?: Partial<TwilioEvent>) {
    return {
      MessageSid: `SM${++this.eventId}`,
      MessageStatus: 'delivered',
      To: '+1234567890',
      ...overrides,
    };
  }

  static createStripePaymentEvent(overrides?: Partial<StripeEvent>) {
    return {
      id: `evt_test_${++this.eventId}`,
      type: 'payment_intent.succeeded',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `pi_test_${this.eventId}`,
          amount: 200000,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            booking_id: 'booking_123',
          },
        },
      },
      livemode: false,
      ...overrides,
    };
  }
}
```

### 4. Signature Verification Utilities

```typescript
// supabase/functions/_shared/webhookVerification.ts

/**
 * Verify SendGrid webhook signature
 */
export async function verifySendGridSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const [timestamp, signatureHash] = signature.split('.');

  // Check timestamp is within 5 minutes
  const eventTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - eventTime > 300) {
    return false;
  }

  // Regenerate signature and compare
  const expectedSignature = await generateSendGridSignature(payload, eventTime, secret);
  return signature === expectedSignature;
}

/**
 * Verify Twilio webhook signature
 */
export async function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): Promise<boolean> {
  const expectedSignature = await generateTwilioSignature(url, params, authToken);
  return signature === expectedSignature;
}

/**
 * Verify Stripe webhook signature
 */
export async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Stripe uses a specific signature format: t=<timestamp>,v1=<hash>
  const timestampMatch = signature.match(/t=([^,]+)/);
  const signatureMatch = signature.match(/v1=([^,]+)/);

  if (!timestampMatch || !signatureMatch) {
    return false;
  }

  const timestamp = parseInt(timestampMatch[1], 10);
  const signatureHash = signatureMatch[1];

  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > 300) {
    return false;
  }

  // Stripe uses HMAC-SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const signedPayload = `${timestamp}.${payload}`;
  const messageData = encoder.encode(signedPayload);

  const expectedSignature = await crypto.subtle
    .importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then(key => crypto.subtle.sign('HMAC', key, messageData))
    .then(sig => btoa(String.fromCharCode(...new Uint8Array(sig))));

  return signatureHash === expectedSignature;
}
```

---

## Implementation Priority

### P0 - Critical Security Vulnerabilities

| Handler | Gap | Impact | Est. Effort |
|---------|-----|--------|-------------|
| SendGrid webhook | No signature verification | Fake delivery events, data corruption | 4 hours |
| SendGrid webhook | No idempotency | Duplicate processing on retries | 2 hours |
| Twilio webhook | No signature verification | Fake delivery events, data corruption | 4 hours |
| Twilio webhook | No idempotency | Duplicate processing on retries | 2 hours |

### P1 - High Priority Features

| Handler | Gap | Impact | Est. Effort |
|---------|-----|--------|-------------|
| SendGrid webhook | No side effect tests | Unknown if DB updates work | 3 hours |
| Twilio webhook | No side effect tests | Unknown if DB updates work | 3 hours |
| Stripe webhook | Not implemented | No payment automation | 16 hours |

### P2 - Medium Priority

| Handler | Gap | Impact | Est. Effort |
|---------|-----|--------|-------------|
| Slack webhook | No tests | Unknown if Slack delivery works | 2 hours |
| All webhooks | No integration tests | End-to-end flows untested | 8 hours |

---

## Webhook Testing Checklist

### Security Tests

- [ ] Signature validation (valid signature accepted)
- [ ] Signature validation (invalid signature rejected with 400)
- [ ] Signature validation (missing signature header rejected with 400)
- [ ] Timestamp validation (fresh timestamp accepted)
- [ ] Timestamp validation (expired timestamp rejected with 400)
- [ ] URL validation (Twilio: webhook URL matches configured value)
- [ ] Replay protection (same timestamp+signature rejected)

### Functional Tests

- [ ] Payload parsing (valid JSON accepted)
- [ ] Payload parsing (malformed JSON rejected with 400)
- [ ] Event type routing (correct handler for each event type)
- [ ] Business logic (database updates performed correctly)
- [ ] Business logic (external notifications sent correctly)
- [ ] Idempotency (duplicate event ID processed only once)
- [ ] Idempotency (state tracking prevents reprocessing)

### Error Handling Tests

- [ ] Missing required fields (400 returned)
- [ ] Invalid record ID (200 with updated: false)
- [ ] Database connection error (500 returned, logged to Slack)
- [ ] Database constraint error (500 returned, logged to Slack)
- [ ] External service timeout (graceful degradation)

### Response Tests

- [ ] Success returns 200 status
- [ ] Success returns expected response format
- [ ] Validation errors return 400 status
- [ ] Server errors return 500 status
- [ ] Transient errors allow retry (5xx)
- [ ] Permanent errors prevent retry (2xx with error details)

### Integration Tests

- [ ] End-to-end SendGrid delivery flow
- [ ] End-to-end Twilio delivery flow
- [ ] End-to-end Stripe payment flow (when implemented)
- [ ] Concurrent webhook processing
- [ ] Rate limiting behavior

---

## Next Steps

### Immediate Actions (Week 1)

1. **Create signature verification utilities**
   - Implement `verifySendGridSignature()` in `_shared/webhookVerification.ts`
   - Implement `verifyTwilioSignature()` in `_shared/webhookVerification.ts`
   - Add environment variable validation for webhook secrets

2. **Add signature verification to handlers**
   - Update `handleSendGridWebhook()` to verify signatures
   - Update `handleTwilioWebhook()` to verify signatures
   - Return 400 for invalid signatures

3. **Implement idempotency**
   - Add `processed_webhooks` table to track event IDs
   - Check for existing events before processing
   - Return 200 early for already-processed events

### Short-term Actions (Week 2)

4. **Create test infrastructure**
   - Set up Vitest configuration
   - Create test helper functions (signature generators, event factories)
   - Set up test database with Supabase test harness

5. **Write handler tests**
   - SendGrid webhook handler tests (signature, idempotency, side effects)
   - Twilio webhook handler tests (signature, idempotency, side effects)
   - Integration tests for delivery tracking

### Medium-term Actions (Month 1)

6. **Implement Stripe webhook handler**
   - Create `stripe-webhook` edge function
   - Handle payment_intent events
   - Add signature verification using Stripe SDK
   - Write comprehensive tests

7. **Add monitoring and alerting**
   - Metrics for webhook success/failure rates
   - Alerts for repeated signature failures
   - Dashboard for delivery tracking

---

## Anti-Patterns to Flag

| Anti-Pattern | Location | Recommended Fix |
|--------------|----------|-----------------|
| Public webhook endpoints without auth | All webhook handlers | Add signature verification BEFORE processing |
| Accepting any POST request as valid | All webhook handlers | Verify signature, return 400 if invalid |
| No idempotency protection | All webhook handlers | Track processed event IDs, check before processing |
| Processing without validation | All webhook handlers | Validate all required fields before DB updates |
| Silent failures on webhook errors | All webhook handlers | Log all failures to Slack, return appropriate status codes |
| Hardcoded secrets | N/A | Use environment variables, validate at startup |

---

## Test File Structure Recommendation

```
supabase/functions/
├── _shared/
│   ├── webhookVerification.ts       # Signature verification utilities
│   └── __tests__/
│       └── webhookVerification.test.ts
├── reminder-scheduler/
│   ├── handlers/
│   │   └── webhook.ts
│   └── __tests__/
│       ├── helpers/
│       │   ├── sendgrid.ts
│       │   ├── twilio.ts
│       │   └── webhookFactory.ts
│       ├── unit/
│       │   ├── sendgridWebhook.test.ts
│       │   └── twilioWebhook.test.ts
│       └── integration/
│           └── deliveryTracking.test.ts
└── stripe-webhook/
    ├── index.ts                     # TO BE CREATED
    └── __tests__/
        ├── unit/
        │   ├── paymentSucceeded.test.ts
        │   ├── paymentFailed.test.ts
        │   └── chargeRefunded.test.ts
        └── integration/
            └── paymentFlow.test.ts
```

---

## Handlers with Good Coverage (Reference)

**None Found** - No webhook handlers currently have any test coverage.

---

## Environment Variables Required

| Variable | Handler | Purpose | Secret? |
|----------|---------|---------|---------|
| `SENDGRID_WEBHOOK_SECRET` | reminder-scheduler | Verify SendGrid signatures | ✅ YES |
| `TWILIO_AUTH_TOKEN` | reminder-scheduler | Verify Twilio signatures | ✅ YES |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | Verify Stripe signatures | ✅ YES |
| `WEBHOOK_TIMEOUT_SECONDS` | All | Maximum age of webhook timestamp | No |

---

## Conclusion

The Split Lease codebase currently has **zero webhook security** and **zero webhook test coverage**. All three webhook handlers (SendGrid, Twilio, and the future Stripe handler) are vulnerable to:

1. **Fake webhooks** - Anyone can POST fake events
2. **Replay attacks** - Old events can be replayed
3. **Duplicate processing** - Retries cause duplicate database updates
4. **Data corruption** - Invalid events update database without validation

**Recommended immediate action:** Implement signature verification and idempotency checks before these endpoints are exposed to production traffic.

---

**Audit Completed:** 2026-01-23
**Next Review:** After signature verification implementation
