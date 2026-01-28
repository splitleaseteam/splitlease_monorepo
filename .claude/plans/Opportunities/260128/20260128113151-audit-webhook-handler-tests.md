# Webhook Handler Testing Opportunity Report
**Generated:** 2026-01-28T11:31:51Z
**Codebase:** Split Lease
**Auditor:** Claude Opus 4.5

## Executive Summary
- **Webhook handlers found:** 6
- **Handlers needing tests:** 6
- **Signature validation gaps:** 5 (only Python Slack handler has implementation)
- **Idempotency gaps:** 6 (no handlers implement idempotency checks)
- **Test coverage:** 0% (no dedicated webhook tests exist)

## Infrastructure Check

### Webhook Test Helpers Status
- [ ] Stripe signature generator exists - **NOT FOUND** (No Stripe integration present)
- [ ] Twilio signature generator exists - **NOT FOUND**
- [ ] SendGrid signature generator exists - **NOT FOUND**
- [ ] Slack signature generator exists - **PARTIAL** (Python implementation only, no TypeScript)
- [ ] Webhook event factory functions exist - **NOT FOUND**
- [ ] Test database setup for webhook tests - **NOT FOUND**

### Critical Finding: No Stripe Webhooks
The codebase does **NOT** contain any Stripe webhook handlers. Payment processing appears to be handled through Bubble.io (legacy system being migrated away from). No `stripe.webhooks.constructEvent()` or similar patterns were found.

---

## SendGrid Webhook Gaps

### Handler: webhook-sendgrid (reminder-scheduler)
- **File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts:49-112`
- **Exposed via:** `supabase/functions/reminder-scheduler/index.ts` (action: `webhook-sendgrid`)
- **Authentication:** None (PUBLIC_ACTIONS includes this)
- **Missing Tests:**
  - [ ] Valid SendGrid webhook accepted
  - [ ] SendGrid signature verification (NOT IMPLEMENTED in handler)
  - [ ] Invalid payload rejected with 400
  - [ ] Missing messageId handled gracefully
  - [ ] `delivered` event updates delivery_status correctly
  - [ ] `bounce` event updates delivery_status to 'bounced'
  - [ ] `dropped` event updates delivery_status to 'failed'
  - [ ] `open` event updates opened_at timestamp
  - [ ] Unknown event types logged but not processed
  - [ ] Database update errors logged properly
  - [ ] Duplicate event ignored (idempotency NOT IMPLEMENTED)

### Security Concern: No Signature Verification
The SendGrid webhook handler does **NOT** verify the `X-Twilio-Email-Event-Webhook-Signature` header. Any attacker can spoof delivery events.

```typescript
// Current implementation (INSECURE):
export const handleSendGridWebhook = async (
  payload: WebhookPayload,  // No signature verification
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ updated: boolean }> => {
```

---

## Twilio Webhook Gaps

### Handler: webhook-twilio (reminder-scheduler)
- **File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts:117-162`
- **Exposed via:** `supabase/functions/reminder-scheduler/index.ts` (action: `webhook-twilio`)
- **Authentication:** None (PUBLIC_ACTIONS includes this)
- **Missing Tests:**
  - [ ] Valid Twilio webhook accepted
  - [ ] Twilio signature verification (NOT IMPLEMENTED in handler)
  - [ ] Invalid payload rejected with 400
  - [ ] Missing messageSid handled gracefully
  - [ ] `delivered` event updates delivery_status correctly
  - [ ] `failed` event updates delivery_status to 'failed'
  - [ ] `undelivered` event updates delivery_status to 'failed'
  - [ ] Unknown event types logged but not processed
  - [ ] Database update errors logged properly
  - [ ] Duplicate event ignored (idempotency NOT IMPLEMENTED)

### Security Concern: No Signature Verification
The Twilio webhook handler does **NOT** verify the `X-Twilio-Signature` header.

---

## Slack Webhook Gaps

### Handler: cohost-request-slack-callback
- **File:** `supabase/functions/cohost-request-slack-callback/index.ts:69-622`
- **Purpose:** Handles Slack interactive components (button clicks, modal submissions)
- **Authentication:** None (no signature verification)
- **Missing Tests:**
  - [ ] Valid Slack signature accepted
  - [ ] Invalid/missing Slack signature rejected (NOT IMPLEMENTED)
  - [ ] Expired timestamp rejected (NOT IMPLEMENTED)
  - [ ] `block_actions` payload type handled correctly
  - [ ] `view_submission` payload type handled correctly
  - [ ] Unknown payload type rejected with 400
  - [ ] `claim_cohost_request` action opens modal
  - [ ] `cohost_assignment_modal` submission updates database
  - [ ] Missing co-host selection returns validation error
  - [ ] Missing meeting time returns validation error
  - [ ] Database update errors handled gracefully
  - [ ] Original Slack message updated after assignment
  - [ ] Host notification triggered after assignment

### Security Concern: No Slack Signature Verification
The handler does NOT verify `X-Slack-Signature` header despite having CORS headers for it.

```typescript
// Current implementation (INSECURE):
const corsHeaders = {
  'Access-Control-Allow-Headers': '...x-slack-signature, x-slack-request-timestamp',
};
// But signature is never verified in the handler!
```

### Handler: slack (faq_inquiry)
- **File:** `supabase/functions/slack/index.ts:170-238`
- **Purpose:** Sends FAQ inquiries to Slack channels
- **Authentication:** None (public endpoint)
- **Missing Tests:**
  - [ ] Valid payload sends to both Slack channels
  - [ ] Invalid email format rejected
  - [ ] Missing required fields rejected
  - [ ] Webhook failure handling (partial success)
  - [ ] All webhooks failing returns 500

### Handler: slack-event-webhook (Python/PythonAnywhere)
- **File:** `pythonanywhere/mysite/modules/signup_automation_zap/slack_event_webhook.py:31-73`
- **Purpose:** Handles Slack Event Subscriptions for signup automation
- **Authentication:** IMPLEMENTED (signature verification present)
- **Missing Tests:**
  - [ ] Valid signature accepted
  - [ ] Invalid signature rejected (returns 401)
  - [ ] Expired timestamp rejected (5-minute window)
  - [ ] URL verification challenge handled
  - [ ] Message event extracts signup data correctly
  - [ ] Bot messages ignored
  - [ ] Non-signup channel messages ignored
  - [ ] User already exists handling
  - [ ] User creation success/failure handling

**NOTE:** This is the ONLY handler with signature verification implemented:
```python
@staticmethod
def verify_slack_request(request_body: str, timestamp: str, signature: str) -> bool:
    # Check timestamp is recent (within 5 minutes)
    if abs(current_timestamp - int(timestamp)) > 60 * 5:
        return False
    # Calculate expected signature using HMAC-SHA256
    expected_signature = 'v0=' + hmac.new(
        SLACK_SIGNING_SECRET.encode(),
        sig_basestring.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_signature, signature)
```

---

## Security Test Gaps Summary

| Handler | File | Signature Verification | Timestamp Check | Tests Exist |
|---------|------|------------------------|-----------------|-------------|
| webhook-sendgrid | reminder-scheduler/handlers/webhook.ts | **NO** | **NO** | **NO** |
| webhook-twilio | reminder-scheduler/handlers/webhook.ts | **NO** | **NO** | **NO** |
| cohost-request-slack-callback | cohost-request-slack-callback/index.ts | **NO** | **NO** | **NO** |
| slack (faq_inquiry) | slack/index.ts | N/A (outbound) | N/A | **NO** |
| slack-event-webhook (Python) | signup_automation_zap/slack_event_webhook.py | **YES** | **YES** | **NO** |

---

## Idempotency Test Gaps

| Handler | Idempotency Check | Duplicate Protection | Tests Exist |
|---------|-------------------|---------------------|-------------|
| webhook-sendgrid | **NO** | **NO** | **NO** |
| webhook-twilio | **NO** | **NO** | **NO** |
| cohost-request-slack-callback | **NO** | **NO** | **NO** |

### Recommended Implementation
For SendGrid/Twilio webhooks, implement event ID tracking:

```typescript
// Check if event already processed
const { data: existing } = await supabase
  .from('webhook_events')
  .select('id')
  .eq('event_id', payload.eventId)
  .single();

if (existing) {
  console.log(`[webhook] Event ${payload.eventId} already processed, skipping`);
  return { updated: false, reason: 'duplicate' };
}

// Process event, then record it
await supabase
  .from('webhook_events')
  .insert({ event_id: payload.eventId, processed_at: new Date().toISOString() });
```

---

## Side Effect Test Gaps

| Handler | DB Update | Email | Notification | Tests |
|---------|-----------|-------|--------------|-------|
| webhook-sendgrid | Updates `remindersfromhousemanual` | No | No | **NO** |
| webhook-twilio | Updates `remindersfromhousemanual` | No | No | **NO** |
| cohost-request-slack-callback | Updates `co_hostrequest` | Yes (via cohost-request) | Slack message update | **NO** |

---

## Response Code Test Gaps

| Scenario | Expected | Handler | Tested |
|----------|----------|---------|--------|
| Valid webhook | 200 | All | **NO** |
| Invalid signature | 401 | All (except Python) | **NO** (not implemented) |
| Invalid payload | 400 | All | **NO** |
| Database error | 500 | All | **NO** |
| Duplicate event | 200 (no retry) | All | **NO** (not implemented) |

---

## Handlers with Good Coverage (Reference)

**None.** No webhook handlers have any test coverage.

The only positive finding is the Python Slack Event webhook which has signature verification implemented (but no tests).

---

## Recommended Test Helpers

### SendGrid Signature Generator
```typescript
import * as crypto from 'crypto';

export function generateSendGridSignature(
  publicKey: string,
  payload: string,
  timestamp: string
): string {
  const timestampPayload = timestamp + payload;
  // SendGrid uses ECDSA signature - this is a simplified mock
  // In real tests, use the actual SendGrid verification library
  return crypto
    .createHmac('sha256', publicKey)
    .update(timestampPayload)
    .digest('base64');
}

export function createSendGridEvent(
  type: 'delivered' | 'bounce' | 'dropped' | 'open',
  messageId: string
) {
  return {
    event: type,
    messageId,
    timestamp: new Date().toISOString(),
    sg_event_id: `sg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  };
}
```

### Twilio Signature Generator
```typescript
import * as crypto from 'crypto';

export function generateTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string
): string {
  // Sort parameters and concatenate
  const data = url + Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], '');

  return crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');
}

export function createTwilioStatusCallback(
  status: 'delivered' | 'failed' | 'undelivered',
  messageSid: string
) {
  return {
    MessageSid: messageSid,
    MessageStatus: status,
    event: status, // Normalized for handler
    timestamp: new Date().toISOString(),
  };
}
```

### Slack Signature Generator
```typescript
import * as crypto from 'crypto';

export function generateSlackSignature(
  signingSecret: string,
  timestamp: number,
  body: string
): string {
  const sigBasestring = `v0:${timestamp}:${body}`;
  const signature = crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');
  return `v0=${signature}`;
}

export function createSlackBlockAction(
  actionId: string,
  value: string,
  userId: string = 'U12345678'
) {
  return {
    type: 'block_actions',
    trigger_id: `trigger_${Date.now()}`,
    user: { id: userId, name: 'testuser', username: 'testuser' },
    actions: [{ action_id: actionId, value }],
    channel: { id: 'C12345678' },
    message: { ts: '1234567890.123456' },
  };
}

export function createSlackViewSubmission(
  callbackId: string,
  privateMetadata: string,
  values: Record<string, Record<string, any>>
) {
  return {
    type: 'view_submission',
    view: {
      callback_id: callbackId,
      private_metadata: privateMetadata,
      state: { values },
    },
    user: { id: 'U12345678', name: 'testuser', username: 'testuser' },
  };
}
```

---

## Priority Recommendations

### P0 - Critical (Security)
1. **Implement signature verification** for `webhook-sendgrid` and `webhook-twilio` handlers
2. **Implement Slack signature verification** in `cohost-request-slack-callback`

### P1 - High (Data Integrity)
1. **Implement idempotency checks** for all webhook handlers
2. **Add webhook_events table** to track processed events

### P2 - Medium (Quality)
1. **Create test helpers** (signature generators, event factories)
2. **Write unit tests** for all webhook handlers
3. **Add integration tests** with mocked external services

### P3 - Low (Maintenance)
1. **Port Python Slack signature verification** to TypeScript for consistency
2. **Standardize error handling** across all webhook handlers
3. **Add structured logging** for webhook processing

---

## Files Changed
None - this is an audit report only.

---

## Appendix: Webhook Handler Locations

| Handler | Location | Line Numbers |
|---------|----------|--------------|
| handleSendGridWebhook | supabase/functions/reminder-scheduler/handlers/webhook.ts | 49-112 |
| handleTwilioWebhook | supabase/functions/reminder-scheduler/handlers/webhook.ts | 117-162 |
| cohost-request-slack-callback | supabase/functions/cohost-request-slack-callback/index.ts | 69-622 |
| slack (faq_inquiry) | supabase/functions/slack/index.ts | 170-238 |
| SlackVerifier (Python) | pythonanywhere/mysite/modules/signup_automation_zap/slack_event_webhook.py | 31-73 |
| Twilio SMS Client | supabase/functions/send-sms/lib/twilioClient.ts | 1-111 |
