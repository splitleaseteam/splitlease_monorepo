# Webhook Handler Testing Opportunity Report
**Generated:** 2026-01-27T11:31:36
**Codebase:** Split Lease

## Executive Summary
- Webhook handlers found: **6**
- Handlers needing tests: **6**
- Signature validation gaps: **5** (critical)
- Idempotency gaps: **6** (all handlers)

## Infrastructure Check

### Webhook Test Helpers Status
- [ ] Stripe signature generator exists
- [ ] Twilio signature generator exists
- [ ] SendGrid signature generator exists
- [ ] Slack signature generator exists
- [ ] Webhook event factory functions exist
- [ ] Test database setup for webhook tests

**Note:** The codebase has only 2 test files in `supabase/functions/_shared/`:
- `validation_test.ts` - Tests validation utilities
- `errors_test.ts` - Tests error classes

No webhook-specific test files or test helpers exist.

---

## Slack Webhook Gaps

### Handler: cohost-request-slack-callback
- **File:** `supabase/functions/cohost-request-slack-callback/index.ts`
- **Type:** Slack Interactive Components (button clicks, modal submissions)
- **Missing Tests:**
  - [ ] Valid Slack signature accepted (`x-slack-signature` header)
  - [ ] Invalid Slack signature rejected (401 response)
  - [ ] Expired timestamp rejected (>5 min old)
  - [ ] Missing signature header rejected
  - [ ] `block_actions` type routes to button click handler
  - [ ] `view_submission` type routes to modal handler
  - [ ] Unknown payload type returns 400
  - [ ] Co-host selection updates database correctly
  - [ ] Meeting time assignment updates database correctly
  - [ ] Original Slack message updated after assignment
  - [ ] Host notification triggered after assignment
  - [ ] Duplicate button clicks handled (idempotency)
  - [ ] CORS preflight handled correctly

**Security Concern:** Currently does NOT validate Slack signature. The handler has `x-slack-signature` and `x-slack-request-timestamp` in CORS headers but never validates them.

### Handler: slack-event-webhook (PythonAnywhere)
- **File:** `pythonanywhere/mysite/modules/signup_automation_zap/slack_event_webhook.py`
- **Type:** Slack Event Subscriptions (message events)
- **Signature Verification:** Implemented via `SlackVerifier.verify_slack_request()` but UNTESTED
- **Missing Tests:**
  - [ ] Valid Slack signature accepted
  - [ ] Invalid Slack signature rejected (401)
  - [ ] Expired timestamp rejected (>5 min)
  - [ ] URL verification challenge handled
  - [ ] Message events routed correctly
  - [ ] Bot messages ignored
  - [ ] Signup data extraction from text
  - [ ] Signup data extraction from JSON
  - [ ] User existence check before creation
  - [ ] Duplicate signup handling

---

## SendGrid Webhook Gaps

### Handler: webhook-sendgrid (reminder-scheduler)
- **File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts`
- **Type:** SendGrid Event Webhooks (delivery tracking)
- **Missing Tests:**
  - [ ] Valid SendGrid signature accepted (not implemented!)
  - [ ] Invalid signature rejected
  - [ ] `delivered` event updates reminder status
  - [ ] `bounce` event updates reminder status to `bounced`
  - [ ] `blocked` event updates reminder status to `bounced`
  - [ ] `dropped` event updates reminder status to `failed`
  - [ ] `deferred` event updates reminder status to `failed`
  - [ ] `open` event updates `opened_at` timestamp
  - [ ] Missing messageId returns `{ updated: false }`
  - [ ] Unknown event type ignored
  - [ ] Duplicate event handling (idempotency)
  - [ ] Database update errors handled

**Security Concern:** No SendGrid signature verification implemented.

---

## Twilio Webhook Gaps

### Handler: webhook-twilio (reminder-scheduler)
- **File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts`
- **Type:** Twilio SMS Status Callbacks
- **Missing Tests:**
  - [ ] Valid Twilio signature accepted (not implemented!)
  - [ ] Invalid signature rejected
  - [ ] `delivered` event updates reminder status
  - [ ] `failed` event updates reminder status
  - [ ] `undelivered` event updates reminder status
  - [ ] Missing messageSid returns `{ updated: false }`
  - [ ] Unknown event type ignored
  - [ ] Duplicate event handling (idempotency)
  - [ ] Database update errors handled

**Security Concern:** No Twilio signature verification implemented.

---

## Zapier/External Integration Gaps

### Handler: send-calendar-invite (virtual-meeting)
- **File:** `supabase/functions/virtual-meeting/handlers/sendCalendarInvite.ts`
- **Type:** Outbound webhook trigger to Zapier
- **Missing Tests:**
  - [ ] Valid input accepted
  - [ ] Missing proposalId rejected
  - [ ] Missing userId rejected
  - [ ] Bubble workflow called with correct params
  - [ ] Bubble API error handled
  - [ ] Network error handled
  - [ ] Success response formatted correctly

---

## Generic Slack Webhook Gaps

### Handler: slack (FAQ inquiry)
- **File:** `supabase/functions/slack/index.ts`
- **Type:** Outbound Slack webhooks
- **Missing Tests:**
  - [ ] Required fields validated (name, email, inquiry)
  - [ ] Invalid email rejected
  - [ ] Slack webhook called with correct payload
  - [ ] Both webhooks called (acquisition + general)
  - [ ] Partial webhook failure handled
  - [ ] Total webhook failure handled
  - [ ] diagnose action returns environment info
  - [ ] Unknown action rejected

---

## Security Test Gaps

| Handler | Signature Test | Timestamp Test | Secret Test |
|---------|----------------|----------------|-------------|
| cohost-request-slack-callback | **MISSING** | **MISSING** | N/A |
| slack-event-webhook (Python) | Implemented, **UNTESTED** | Implemented, **UNTESTED** | N/A |
| webhook-sendgrid | **NOT IMPLEMENTED** | N/A | N/A |
| webhook-twilio | **NOT IMPLEMENTED** | N/A | N/A |
| send-calendar-invite (outbound) | N/A | N/A | N/A |
| slack (outbound) | N/A | N/A | N/A |

---

## Idempotency Test Gaps

| Handler | Idempotency Check | Duplicate Test |
|---------|-------------------|----------------|
| cohost-request-slack-callback | **NOT IMPLEMENTED** | **MISSING** |
| slack-event-webhook | **NOT IMPLEMENTED** | **MISSING** |
| webhook-sendgrid | **NOT IMPLEMENTED** | **MISSING** |
| webhook-twilio | **NOT IMPLEMENTED** | **MISSING** |

---

## Side Effect Test Gaps

| Handler | DB Update | Email | Notification |
|---------|-----------|-------|--------------|
| cohost-request-slack-callback | **UNTESTED** | N/A | **UNTESTED** |
| slack-event-webhook | **UNTESTED** | N/A | **UNTESTED** |
| webhook-sendgrid | **UNTESTED** | N/A | N/A |
| webhook-twilio | **UNTESTED** | N/A | N/A |

---

## Response Code Test Gaps

| Scenario | Expected | Tested |
|----------|----------|--------|
| Valid webhook | 200 | **NO** |
| Invalid signature | 401 | **NO** |
| Missing payload | 400 | **NO** |
| Unknown payload type | 400 | **NO** |
| Database error | 500 | **NO** |
| Network error | 500 | **NO** |

---

## Handlers with Good Coverage (Reference)

**None.** No webhook handlers in this codebase have test coverage.

---

## Critical Security Findings

### 1. Missing Signature Verification (HIGH SEVERITY)
The following handlers accept webhooks without verifying the source:
- `cohost-request-slack-callback` - Accepts Slack interactive payloads without signature check
- `webhook-sendgrid` - Accepts SendGrid events without signature check
- `webhook-twilio` - Accepts Twilio status callbacks without signature check

**Risk:** Attackers could forge webhook requests to:
- Assign co-hosts to fake requests
- Mark messages as delivered when they weren't
- Manipulate delivery status data

### 2. No Idempotency Protection (MEDIUM SEVERITY)
All handlers will process duplicate events multiple times:
- Could result in duplicate database updates
- Could trigger duplicate notifications
- Could cause data inconsistency

---

## Recommended Test Helpers

### Slack Signature Generator
```typescript
import * as crypto from 'crypto';

export function generateSlackSignature(
  body: string,
  signingSecret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): { signature: string; timestamp: string } {
  const sigBasestring = `v0:${timestamp}:${body}`;
  const signature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring, 'utf8')
    .digest('hex');

  return {
    signature,
    timestamp: String(timestamp),
  };
}
```

### SendGrid Signature Generator
```typescript
import * as crypto from 'crypto';

export function generateSendGridSignature(
  publicKey: string,
  payload: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): string {
  // SendGrid uses ECDSA signatures
  // For testing, use the verification key from SendGrid dashboard
  const timestampedPayload = `${timestamp}${payload}`;
  // In tests, mock the verification function instead
  return `sha256=${crypto.createHash('sha256').update(timestampedPayload).digest('hex')}`;
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
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], '');
  const data = url + sortedParams;

  return crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');
}
```

### Slack Event Factory
```typescript
export function createSlackInteractivePayload(
  type: 'block_actions' | 'view_submission',
  data: Partial<SlackPayload>
): SlackPayload {
  const base = {
    type,
    user: { id: 'U123', name: 'testuser', username: 'testuser' },
    trigger_id: 'trigger_123',
    ...data,
  };

  if (type === 'block_actions') {
    return {
      ...base,
      actions: data.actions || [{ action_id: 'claim_cohost_request', value: '{}' }],
      channel: data.channel || { id: 'C123' },
      message: data.message || { ts: '123.456' },
    };
  }

  return {
    ...base,
    view: data.view || {
      private_metadata: '{}',
      state: { values: {} },
    },
  };
}
```

### SendGrid Event Factory
```typescript
export function createSendGridEvent(
  event: 'delivered' | 'bounce' | 'blocked' | 'dropped' | 'open',
  messageId: string,
  timestamp?: string
): object {
  return {
    event,
    messageId,
    timestamp: timestamp || new Date().toISOString(),
    email: 'test@example.com',
    sg_event_id: `event_${Date.now()}`,
  };
}
```

### Twilio Event Factory
```typescript
export function createTwilioEvent(
  status: 'delivered' | 'failed' | 'undelivered',
  messageSid: string
): object {
  return {
    event: status,
    messageSid,
    timestamp: new Date().toISOString(),
    AccountSid: 'AC123',
    From: '+15551234567',
    To: '+15559876543',
  };
}
```

---

## Priority Recommendations

### Immediate (Security Critical)
1. **Implement Slack signature verification** in `cohost-request-slack-callback`
2. **Implement SendGrid signature verification** in `webhook-sendgrid` handler
3. **Implement Twilio signature verification** in `webhook-twilio` handler

### Short-term (Reliability)
1. Add idempotency checks to all webhook handlers
2. Create webhook test helper library
3. Add comprehensive tests for all handlers

### Medium-term (Quality)
1. Add integration tests for webhook flows
2. Add monitoring for webhook failures
3. Document webhook security requirements
