# Webhook Handler Testing Audit Report
**Generated:** 2026-01-24
**Codebase:** Split Lease
**Auditor:** Claude Code (Automated Audit)

---

## Executive Summary

| Metric | Count | Status |
|--------|-------|--------|
| Webhook handlers found | 4 | - |
| Handlers needing tests | 4 | 100% |
| Signature validation gaps | 3 | 75% lack signature verification |
| Idempotency gaps | 3 | 75% lack idempotency protection |
| Test coverage | 0% | No webhook tests exist |

### Critical Security Findings

🚨 **CRITICAL:** All inbound webhook handlers (SendGrid, Twilio, Slack callback) lack signature verification, allowing arbitrary requests to trigger side effects.

---

## Infrastructure Check

### Webhook Test Helpers Status

| Helper | Status | Location |
|--------|--------|----------|
| Stripe signature generator | ❌ DOES NOT EXIST | N/A |
| Twilio signature generator | ❌ DOES NOT EXIST | N/A |
| SendGrid signature generator | ❌ DOES NOT EXIST | N/A |
| Slack signature generator | ❌ DOES NOT EXIST | N/A |
| Webhook event factory functions | ❌ DOES NOT EXIST | N/A |
| Test database setup for webhook tests | ❌ DOES NOT EXIST | N/A |
| Vitest configuration | ❌ DOES NOT EXIST | N/A |

---

## Handler 1: SendGrid Delivery Webhook

### Location
- **File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts:49-112`
- **Function:** `handleSendGridWebhook()`
- **Action:** `webhook-sendgrid`
- **Endpoint:** `POST /functions/v1/reminder-scheduler`

### Purpose
Handles delivery status updates from SendGrid for reminder emails sent via the House Manual feature.

### Current Implementation Analysis

```typescript
export const handleSendGridWebhook = async (
  payload: WebhookPayload,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ updated: boolean }> => {
  // NO SIGNATURE VERIFICATION - Anyone can POST fake events
  // Maps events: delivered, bounce, blocked, dropped, deferred, open
  // Updates remindersfromhousemanual table
}
```

### Security Vulnerabilities

| Vulnerability | Severity | Description |
|--------------|----------|-------------|
| No signature verification | 🔴 CRITICAL | Anyone can POST fake delivery events |
| No idempotency | 🟡 HIGH | Duplicate events cause duplicate DB updates |
| No timestamp validation | 🟡 HIGH | Replay attacks possible |
| No rate limiting | 🟠 MEDIUM | Vulnerable to flood attacks |

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
| Unknown event logged and ignored | ❌ MISSING | P2 |
| Invalid messageId returns updated:false | ❌ MISSING | P2 |
| Database error handled gracefully | ❌ MISSING | P2 |

---

## Handler 2: Twilio Delivery Webhook

### Location
- **File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts:117-162`
- **Function:** `handleTwilioWebhook()`
- **Action:** `webhook-twilio`
- **Endpoint:** `POST /functions/v1/reminder-scheduler`

### Purpose
Handles delivery status updates from Twilio for reminder SMS messages.

### Current Implementation Analysis

```typescript
export const handleTwilioWebhook = async (
  payload: WebhookPayload,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ updated: boolean }> => {
  // NO SIGNATURE VERIFICATION - Anyone can POST fake events
  // Maps events: delivered, failed, undelivered
  // Updates remindersfromhousemanual table
}
```

### Security Vulnerabilities

| Vulnerability | Severity | Description |
|--------------|----------|-------------|
| No signature verification | 🔴 CRITICAL | Anyone can POST fake delivery events |
| No idempotency | 🟡 HIGH | Duplicate events cause duplicate DB updates |
| No URL validation | 🟡 HIGH | Webhook URL not validated |
| No rate limiting | 🟠 MEDIUM | Vulnerable to flood attacks |

### Missing Tests

| Test Case | Status | Priority |
|-----------|--------|----------|
| Valid Twilio signature accepted | ❌ MISSING | P0 |
| Invalid signature rejected (400) | ❌ MISSING | P0 |
| Missing X-Twilio-Signature header rejected (400) | ❌ MISSING | P0 |
| URL mismatch rejected (400) | ❌ MISSING | P0 |
| Duplicate event ignored (idempotency) | ❌ MISSING | P0 |
| `delivered` event updates delivery_status | ❌ MISSING | P1 |
| `failed` event sets delivery_status to failed | ❌ MISSING | P1 |
| `undelivered` event sets delivery_status to failed | ❌ MISSING | P1 |
| Unknown event logged and ignored | ❌ MISSING | P2 |
| Invalid messageSid returns updated:false | ❌ MISSING | P2 |

---

## Handler 3: Slack Callback Webhook

### Location
- **File:** `supabase/functions/cohost-request-slack-callback/index.ts:69-118`
- **Function:** Main handler (Deno.serve)
- **Endpoint:** `POST /functions/v1/cohost-request-slack-callback`

### Purpose
Handles interactive element callbacks from Slack (button clicks and modal submissions) for co-host request assignment workflow.

### Current Implementation Analysis

```typescript
serve(async (req: Request) => {
  // Parses form-urlencoded payload from Slack
  // NO SIGNATURE VERIFICATION despite allowing x-slack-signature in CORS headers
  // Routes block_actions (button clicks) to modal opener
  // Routes view_submission (modal submit) to database update + host notification
});
```

### Security Vulnerabilities

| Vulnerability | Severity | Description |
|--------------|----------|-------------|
| No signature verification | 🔴 CRITICAL | Allows CORS for x-slack-signature but doesn't verify it |
| No idempotency | 🟡 HIGH | Duplicate callbacks could cause duplicate assignments |
| No timestamp validation | 🟡 HIGH | Replay attacks possible |

### Missing Tests

| Test Case | Status | Priority |
|-----------|--------|----------|
| Valid Slack signature accepted | ❌ MISSING | P0 |
| Invalid signature rejected (400) | ❌ MISSING | P0 |
| Missing X-Slack-Signature header rejected (400) | ❌ MISSING | P0 |
| Expired timestamp rejected (400) | ❌ MISSING | P0 |
| block_actions routes to modal opener | ❌ MISSING | P1 |
| view_submission updates database correctly | ❌ MISSING | P1 |
| Co-host selection validation works | ❌ MISSING | P1 |
| Meeting time selection validation works | ❌ MISSING | P1 |
| Host notification triggered on success | ❌ MISSING | P1 |
| Original Slack message updated on assignment | ❌ MISSING | P2 |
| Unknown payload type returns 400 | ❌ MISSING | P2 |

---

## Handler 4: Slack Outbound (FAQ Inquiry)

### Location
- **File:** `supabase/functions/slack/index.ts:170-238`
- **Function:** `handleFaqInquiry()`
- **Action:** `faq_inquiry`
- **Endpoint:** `POST /functions/v1/slack`

### Purpose
Sends FAQ inquiries to Slack channels (outbound webhook, not inbound).

### Security Assessment

**⚠️ LOW RISK:** This function makes **outbound** webhook calls to Slack. It doesn't receive webhooks from external services, so signature verification is not applicable.

**Current protections:**
- ✅ Validates email format
- ✅ Validates required fields (name, email, inquiry)

**Missing protections:**
- ⚠️ No rate limiting to prevent Slack spam

### Missing Tests

| Test Case | Status | Priority |
|-----------|--------|----------|
| Valid payload sends to both Slack channels | ❌ MISSING | P1 |
| Email validation rejects invalid format | ❌ MISSING | P2 |
| Missing required field returns 400 | ❌ MISSING | P2 |
| Webhook failure handled gracefully | ❌ MISSING | P2 |
| Missing env vars returns error | ❌ MISSING | P2 |

---

## Handlers NOT Found (But Should Exist)

### Stripe Payment Webhooks

**Expected Location:** `supabase/functions/stripe-webhook/index.ts`

**Status:** ❌ NOT IMPLEMENTED

**Required Events to Handle:**

| Event | Purpose | Business Logic |
|-------|---------|----------------|
| `payment_intent.succeeded` | Payment completed | Confirm booking, send confirmation email |
| `payment_intent.payment_failed` | Payment failed | Update booking status, notify guest |
| `charge.refunded` | Refund issued | Update booking, send refund notification |
| `charge.dispute.created` | Dispute opened | Notify host, flag booking |

**Impact:** HIGH - Financial transactions without webhook verification are vulnerable to fraud.

---

## Security Test Gaps

### Signature Verification Coverage

| Handler | Signature Test | Timestamp Test | URL Validation |
|---------|----------------|----------------|----------------|
| SendGrid delivery | ❌ | ❌ | N/A |
| Twilio delivery | ❌ | N/A | ❌ |
| Slack callback | ❌ | ❌ | N/A |
| Stripe payment | N/A (not implemented) | N/A | N/A |
| Slack outbound | N/A (outbound) | N/A | N/A |

**Overall Signature Coverage: 0%**

### Idempotency Test Coverage

| Handler | Idempotency Check | Duplicate Event Test |
|---------|-------------------|---------------------|
| SendGrid delivery | ❌ | ❌ |
| Twilio delivery | ❌ | ❌ |
| Slack callback | ❌ | ❌ |
| Stripe payment | N/A | N/A |

**Overall Idempotency Coverage: 0%**

---

## Side Effect Test Gaps

### Database Updates

| Handler | Primary DB Effect | Secondary Effect | Error Handling |
|---------|-------------------|------------------|----------------|
| SendGrid delivery | delivery_status update | delivered_at/opened_at | ❌ Untested |
| Twilio delivery | delivery_status update | delivered_at | ❌ Untested |
| Slack callback | co_hostrequest update | Slack message update | ❌ Untested |

### External Service Calls

| Handler | External Call | Tested |
|---------|--------------|--------|
| Slack callback | Slack API (views.open, chat.update) | ❌ |
| Slack callback | cohost-request function (notify-host) | ❌ |
| Slack outbound | Slack webhook URLs | ❌ |

---

## Response Code Test Gaps

| Scenario | Expected | Tested |
|----------|----------|--------|
| Valid webhook | 200 | ❌ |
| Invalid signature | 400 | ❌ |
| Expired timestamp | 400 | ❌ |
| Missing header | 400 | ❌ |
| Malformed JSON | 400 | ❌ |
| Transient DB error | 500 | ❌ |
| Invalid ID | 200 with updated:false | ❌ |

---

## Recommended Test Helpers

### 1. SendGrid Signature Generator

```typescript
// supabase/functions/__tests__/helpers/sendgrid.ts

export function generateSendGridSignature(
  payload: string,
  timestamp: number,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(`${timestamp}${payload}`);

  return crypto.subtle
    .importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then(key => crypto.subtle.sign('HMAC', key, messageData))
    .then(signature => {
      return `${timestamp}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;
    });
}

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
// supabase/functions/__tests__/helpers/twilio.ts

export function generateTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(authToken);

  const sortedParams = Object.keys(params).sort();
  const data = url + sortedParams.map(k => k + params[k]).join('');
  const messageData = encoder.encode(data);

  return crypto.subtle
    .importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
    .then(key => crypto.subtle.sign('HMAC', key, messageData))
    .then(signature => btoa(String.fromCharCode(...new Uint8Array(signature))));
}

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

### 3. Slack Signature Generator

```typescript
// supabase/functions/__tests__/helpers/slack.ts

export function generateSlackSignature(
  timestamp: string,
  body: string,
  signingSecret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingSecret);
  const signatureBaseString = `v0:${timestamp}:${body}`;
  const messageData = encoder.encode(signatureBaseString);

  return crypto.subtle
    .importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then(key => crypto.subtle.sign('HMAC', key, messageData))
    .then(signature => {
      const hex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return `v0=${hex}`;
    });
}

export function createSlackBlockActionsPayload(
  actionId: string,
  actionValue: string,
  userId: string
): string {
  return JSON.stringify({
    type: 'block_actions',
    trigger_id: `trigger_${Date.now()}`,
    user: { id: userId, name: 'test_user', username: 'test_user' },
    actions: [{ action_id: actionId, value: actionValue }],
  });
}
```

### 4. Stripe Signature Generator

```typescript
// supabase/functions/__tests__/helpers/stripe.ts

export function generateStripeSignature(
  payload: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000)
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const signedPayload = `${timestamp}.${payload}`;
  const messageData = encoder.encode(signedPayload);

  return crypto.subtle
    .importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then(key => crypto.subtle.sign('HMAC', key, messageData))
    .then(signature => {
      const hex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return `t=${timestamp},v1=${hex}`;
    });
}

export function createStripeEvent(type: string, data: object, id?: string) {
  return {
    id: id || `evt_${Date.now()}`,
    type,
    created: Math.floor(Date.now() / 1000),
    data: { object: data },
    livemode: false,
  };
}
```

---

## Implementation Priority

### P0 - Critical Security Vulnerabilities

| Handler | Gap | Impact | Est. Effort |
|---------|-----|--------|-------------|
| SendGrid webhook | No signature verification | Fake delivery events | 4 hours |
| SendGrid webhook | No idempotency | Duplicate processing | 2 hours |
| Twilio webhook | No signature verification | Fake delivery events | 4 hours |
| Twilio webhook | No idempotency | Duplicate processing | 2 hours |
| Slack callback | No signature verification | Fake co-host assignments | 4 hours |

### P1 - High Priority

| Handler | Gap | Impact | Est. Effort |
|---------|-----|--------|-------------|
| All handlers | No unit tests | Unknown behavior | 8 hours |
| All handlers | No side effect tests | Data integrity unknown | 8 hours |
| Stripe webhook | Not implemented | No payment automation | 16 hours |

### P2 - Medium Priority

| Handler | Gap | Impact | Est. Effort |
|---------|-----|--------|-------------|
| Slack outbound | No tests | Unknown Slack delivery | 2 hours |
| All handlers | No integration tests | E2E flows untested | 8 hours |

---

## Anti-Patterns to Flag

| Anti-Pattern | Location | Recommended Fix |
|--------------|----------|-----------------|
| Public webhook without auth | All inbound handlers | Add signature verification BEFORE processing |
| CORS allows signature header but doesn't verify | cohost-request-slack-callback | Either verify signature or remove from CORS |
| Processing without validation | SendGrid, Twilio handlers | Validate signature, then validate payload |
| No idempotency tracking | All handlers | Track processed event IDs |
| Silent failures | Some handlers | Log all failures to Slack |

---

## Test File Structure Recommendation

```
supabase/functions/
├── _shared/
│   ├── webhookVerification.ts       # Signature verification utilities
│   └── __tests__/
│       └── webhookVerification.test.ts
├── __tests__/
│   └── helpers/
│       ├── sendgrid.ts
│       ├── twilio.ts
│       ├── slack.ts
│       └── stripe.ts
├── reminder-scheduler/
│   └── __tests__/
│       ├── sendgridWebhook.test.ts
│       └── twilioWebhook.test.ts
├── cohost-request-slack-callback/
│   └── __tests__/
│       └── slackCallback.test.ts
└── stripe-webhook/                  # TO BE CREATED
    ├── index.ts
    └── __tests__/
        └── stripeWebhook.test.ts
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
| `SLACK_SIGNING_SECRET` | cohost-request-slack-callback | Verify Slack signatures | ✅ YES |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook (future) | Verify Stripe signatures | ✅ YES |

---

## Conclusion

The Split Lease codebase has **four webhook handlers** with **zero security verification** and **zero test coverage**:

1. **SendGrid webhook** - Updates email delivery status without signature verification
2. **Twilio webhook** - Updates SMS delivery status without signature verification
3. **Slack callback** - Processes co-host assignments without signature verification (despite allowing the header in CORS!)
4. **Slack outbound** - Low risk, but untested

**Recommended immediate action:** Implement signature verification for all three inbound webhook handlers before these endpoints are exposed to production traffic.

---

**Audit Completed:** 2026-01-24
**Previous Audit:** 2026-01-23 (same findings)
**Next Review:** After signature verification implementation
