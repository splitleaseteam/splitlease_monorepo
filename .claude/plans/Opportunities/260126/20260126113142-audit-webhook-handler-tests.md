# Webhook Handler Testing Opportunity Report
**Generated:** 2026-01-26T11:31:42Z
**Codebase:** Split Lease
**Auditor:** Webhook Handler Test Audit Skill

## Executive Summary
- Webhook handlers found: **6**
- Handlers needing tests: **6**
- Signature validation gaps: **4** (handlers have implementation but no tests)
- Idempotency gaps: **6** (no idempotency handling found anywhere)

## Infrastructure Check

### Webhook Test Helpers Status
- [ ] Stripe signature generator exists
- [ ] Twilio signature generator exists
- [ ] SendGrid signature generator exists
- [ ] Slack signature generator exists (implementation exists in code but no test helper)
- [ ] Webhook event factory functions exist
- [ ] Test database setup for webhook tests

**Finding:** The codebase has **no dedicated test infrastructure for webhooks**. While there are Deno tests for `_shared/errors.ts` and `_shared/validation.ts`, there are **zero tests** for any webhook handlers.

---

## Stripe Webhook Gaps

### Status: **NO STRIPE WEBHOOKS FOUND**

The codebase does **not** currently have any Stripe webhook handlers. No files contain:
- `stripe.webhooks.constructEvent()`
- Routes for `/webhooks/stripe` or `/api/webhooks/stripe`
- Event handlers for `payment_intent.succeeded`, `payment_intent.payment_failed`, or `charge.refunded`

**Recommendation:** When Stripe payment integration is added, implement webhooks with proper test coverage from the start.

---

## Twilio Webhook Gaps

### Handler: SMS Delivery Status Webhook (reminder-scheduler)
- **File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts`
- **Function:** `handleTwilioWebhook()`
- **Purpose:** Updates delivery status in `remindersfromhousemanual` table

#### Current Implementation Analysis:
```typescript
export const handleTwilioWebhook = async (
  payload: WebhookPayload,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ updated: boolean }>
```

**Missing Tests:**
- [ ] Valid payload accepted (delivered/failed/undelivered events)
- [ ] Missing messageSid rejected (returns `{ updated: false }`)
- [ ] Unhandled event type returns `{ updated: false }`
- [ ] Database update succeeds for 'delivered' status
- [ ] Database update succeeds for 'failed' status
- [ ] Delivered status sets `delivered_at` timestamp
- [ ] Database error handled gracefully

**Missing Security:**
- [ ] **NO SIGNATURE VERIFICATION** - Handler does not validate Twilio signature
- [ ] **NO TIMESTAMP VALIDATION** - No replay attack prevention

**Missing Idempotency:**
- [ ] Duplicate event handling not implemented
- [ ] No idempotency key tracking

---

## SendGrid Webhook Gaps

### Handler: Email Delivery Status Webhook (reminder-scheduler)
- **File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts`
- **Function:** `handleSendGridWebhook()`
- **Purpose:** Updates email delivery/open status in `remindersfromhousemanual` table

#### Current Implementation Analysis:
```typescript
export const handleSendGridWebhook = async (
  payload: WebhookPayload,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ updated: boolean }>
```

**Missing Tests:**
- [ ] Valid 'delivered' event updates status
- [ ] Valid 'bounce' event updates status to 'bounced'
- [ ] Valid 'blocked' event updates status to 'bounced'
- [ ] Valid 'dropped' event updates status to 'failed'
- [ ] Valid 'deferred' event updates status to 'failed'
- [ ] Valid 'open' event sets `opened_at` timestamp
- [ ] Missing messageId rejected (returns `{ updated: false }`)
- [ ] Unhandled event type returns `{ updated: false }`
- [ ] Database error handled gracefully

**Missing Security:**
- [ ] **NO SIGNATURE VERIFICATION** - Handler does not validate SendGrid webhook signature
- [ ] **NO TIMESTAMP VALIDATION** - No replay attack prevention

**Missing Idempotency:**
- [ ] Duplicate event handling not implemented
- [ ] No idempotency key tracking

---

## Slack Webhook Gaps

### Handler 1: Co-Host Request Slack Callback
- **File:** `supabase/functions/cohost-request-slack-callback/index.ts`
- **Purpose:** Handles Slack interactive components (button clicks, modal submissions)

#### Current Implementation Analysis:
- Routes `block_actions` to `handleButtonClick()`
- Routes `view_submission` to `handleModalSubmission()`
- **Has CORS headers defined** but does not validate Slack signature

**Missing Tests:**
- [ ] CORS preflight (OPTIONS) returns correctly
- [ ] Valid `block_actions` payload routes to handleButtonClick
- [ ] Valid `view_submission` payload routes to handleModalSubmission
- [ ] Missing payload parameter returns 400
- [ ] Invalid JSON in payload returns error
- [ ] Unknown payload type returns 400
- [ ] Button click opens modal via Slack API
- [ ] Modal submission updates database correctly
- [ ] Modal submission triggers host notification
- [ ] Modal submission updates original Slack message

**Missing Security:**
- [ ] **NO SIGNATURE VERIFICATION** - `x-slack-signature` header checked but not validated
- [ ] **NO TIMESTAMP VALIDATION** - `x-slack-request-timestamp` header not validated

**Missing Idempotency:**
- [ ] No duplicate submission prevention

---

### Handler 2: Slack Event Subscriptions (PythonAnywhere)
- **File:** `pythonanywhere/mysite/modules/signup_automation_zap/slack_event_webhook.py`
- **Function:** `SlackVerifier.verify_slack_request()`
- **Purpose:** Processes signup data from Slack messages

#### Current Implementation Analysis:
**HAS signature verification implemented:**
```python
def verify_slack_request(request_body: str, timestamp: str, signature: str) -> bool:
    # Check timestamp is recent (within 5 minutes)
    # Create signature base string: v0:{timestamp}:{request_body}
    # Calculate HMAC-SHA256 signature
    # Compare using hmac.compare_digest()
```

**Missing Tests:**
- [ ] Valid signature accepted
- [ ] Invalid signature rejected (returns 401)
- [ ] Missing signature headers handled
- [ ] Expired timestamp rejected (> 5 minutes old)
- [ ] URL verification challenge response (returns challenge)
- [ ] Message event extracts signup data correctly
- [ ] JSON format signup data extracted
- [ ] Text format signup data extracted
- [ ] User creation workflow triggered
- [ ] Duplicate user detection works
- [ ] Bot messages ignored

---

### Handler 3: Slack Events API (PythonAnywhere)
- **File:** `pythonanywhere/mysite/modules/slack_events/routes.py`
- **Function:** `handle_events()`
- **Purpose:** Universal endpoint for Slack event subscriptions

#### Current Implementation Analysis:
**HAS signature verification implemented:**
```python
def verify_slack_signature(request_body, timestamp, signature):
    # Similar to above
    # Note: Returns True if signing secret not configured (security risk!)
```

**Missing Tests:**
- [ ] Valid signature accepted
- [ ] Invalid signature rejected
- [ ] Missing signing secret allows all requests (⚠️ security risk in prod)
- [ ] URL verification challenge response
- [ ] Event callback routed to handler
- [ ] Rate limited event logged
- [ ] Unknown event type logged and returns 200
- [ ] Error handling returns 200 (Slack requirement)

---

### Handler 4: Slack Verification Module (PythonAnywhere)
- **File:** `pythonanywhere/mysite/modules/user_search_module/slack_verification.py`
- **Purpose:** Reusable signature verification decorator and function

**Has implementation but no tests for:**
- [ ] Decorator `verify_slack_signature` validates correctly
- [ ] Missing headers return 403
- [ ] Expired timestamp returns 403
- [ ] Invalid timestamp format returns 403
- [ ] Signature mismatch returns 403
- [ ] Standalone `verify_request_signature()` function works

---

## Security Test Gaps Summary

| Handler | Signature Verification | Timestamp Validation | Test Coverage |
|---------|------------------------|---------------------|---------------|
| Twilio Webhook (reminder-scheduler) | ❌ NOT IMPLEMENTED | ❌ NOT IMPLEMENTED | ❌ None |
| SendGrid Webhook (reminder-scheduler) | ❌ NOT IMPLEMENTED | ❌ NOT IMPLEMENTED | ❌ None |
| Slack Callback (Edge Function) | ❌ NOT IMPLEMENTED | ❌ NOT IMPLEMENTED | ❌ None |
| Slack Events (signup_automation_zap) | ✅ Implemented | ✅ Implemented | ❌ None |
| Slack Events (slack_events module) | ⚠️ Conditional | ✅ Implemented | ❌ None |
| Slack Verification (user_search_module) | ✅ Implemented | ✅ Implemented | ❌ None |

---

## Idempotency Test Gaps

| Handler | Idempotency Check | Duplicate Test |
|---------|-------------------|----------------|
| handleTwilioWebhook | ❌ NOT IMPLEMENTED | ❌ |
| handleSendGridWebhook | ❌ NOT IMPLEMENTED | ❌ |
| Slack Callback | ❌ NOT IMPLEMENTED | ❌ |
| Slack Events (signup) | ❌ NOT IMPLEMENTED | ❌ |

---

## Side Effect Test Gaps

| Handler | DB Update | Notification | External API |
|---------|-----------|--------------|--------------|
| handleTwilioWebhook | ❌ Untested | N/A | N/A |
| handleSendGridWebhook | ❌ Untested | N/A | N/A |
| Slack Callback | ❌ Untested | ❌ Untested | ❌ Untested |
| Slack Events | ❌ Untested | ❌ Untested | ❌ Untested |

---

## Response Code Test Gaps

| Scenario | Expected | Handler | Tested |
|----------|----------|---------|--------|
| Valid webhook | 200 | All | ❌ |
| Missing required field | 400 | Slack Callback | ❌ |
| Invalid signature | 401/403 | Python handlers | ❌ |
| Database error | Varies | All | ❌ |
| Unknown event | 200 (Slack), varies | All | ❌ |

---

## Handlers with Good Coverage (Reference)

**None.** The codebase has zero test coverage for webhook handlers.

The only existing tests are for shared utilities:
- `supabase/functions/_shared/errors_test.ts` - Tests error classes
- `supabase/functions/_shared/validation_test.ts` - Tests validation functions

---

## Recommended Test Helpers

### Twilio Signature Generator
```typescript
import * as crypto from 'crypto';

export function generateTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string
): string {
  const data = url + Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], '')
  return crypto.createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64')
}
```

### SendGrid Webhook Event Factory
```typescript
export function createSendGridEvent(
  event: 'delivered' | 'bounce' | 'blocked' | 'dropped' | 'deferred' | 'open',
  messageId: string,
  timestamp?: string
) {
  return {
    messageId,
    event,
    timestamp: timestamp || new Date().toISOString(),
  }
}
```

### Slack Signature Generator
```typescript
import * as crypto from 'crypto';

export function generateSlackSignature(
  body: string,
  timestamp: number,
  signingSecret: string
): string {
  const sigBasestring = `v0:${timestamp}:${body}`;
  const signature = crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');
  return `v0=${signature}`;
}
```

### Slack Payload Factory
```typescript
export function createSlackInteractionPayload(
  type: 'block_actions' | 'view_submission',
  action?: { action_id: string; value: string }
) {
  return {
    type,
    user: { id: 'U123', name: 'test_user', username: 'test_user' },
    trigger_id: 'test_trigger_123',
    ...(type === 'block_actions' && action ? { actions: [action] } : {}),
    ...(type === 'view_submission' ? {
      view: {
        private_metadata: '{}',
        state: { values: {} }
      }
    } : {})
  }
}
```

---

## Priority Recommendations

### Critical (Security)
1. **Add Twilio signature verification** to `handleTwilioWebhook`
2. **Add SendGrid signature verification** to `handleSendGridWebhook`
3. **Add Slack signature verification** to `cohost-request-slack-callback`

### High Priority (Test Coverage)
1. Create test helpers for signature generation
2. Add unit tests for all webhook handlers
3. Test signature verification in Python handlers

### Medium Priority (Reliability)
1. Implement idempotency tracking across all handlers
2. Add duplicate event detection
3. Test database failure scenarios

### Low Priority (Enhancement)
1. Add structured logging with correlation IDs
2. Implement retry logic for transient errors
3. Add monitoring/alerting for webhook failures

---

## Files Requiring Changes

| File | Changes Needed |
|------|----------------|
| `supabase/functions/reminder-scheduler/handlers/webhook.ts` | Add signature verification, add tests |
| `supabase/functions/cohost-request-slack-callback/index.ts` | Add signature verification, add tests |
| `pythonanywhere/mysite/modules/signup_automation_zap/slack_event_webhook.py` | Add tests |
| `pythonanywhere/mysite/modules/slack_events/routes.py` | Add tests, fix conditional verification |
| `pythonanywhere/mysite/modules/user_search_module/slack_verification.py` | Add tests |

---

## Conclusion

The Split Lease codebase has **significant gaps in webhook handler testing**:

1. **Zero test coverage** for any webhook handler
2. **Missing signature verification** in 3 of 6 handlers (Edge Functions)
3. **No idempotency handling** anywhere
4. **No webhook test helpers** available

The Python handlers have signature verification implemented but untested. The Edge Function handlers (Twilio, SendGrid, Slack callback) have **no signature verification at all**, making them vulnerable to spoofed requests.

**Immediate action recommended:** Add signature verification to Edge Function webhook handlers before production use.
