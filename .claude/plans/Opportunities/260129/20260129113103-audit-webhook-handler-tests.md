# Webhook Handler Testing Opportunity Report
**Generated:** 2026-01-29T11:31:03Z
**Codebase:** Split Lease
**Audit Type:** Webhook Handler Test Coverage

## Executive Summary
- Webhook handlers found: **6**
- Handlers needing tests: **6**
- Signature validation gaps: **4** (SendGrid, Twilio delivery webhooks have NO signature validation)
- Idempotency gaps: **6** (NO idempotency handling in any webhook handler)

## Infrastructure Check

### Webhook Test Helpers Status
- [ ] Stripe signature generator exists
- [ ] Twilio signature generator exists (exists in Python but not for Deno tests)
- [ ] SendGrid signature generator exists
- [ ] Webhook event factory functions exist
- [ ] Test database setup for webhook tests

**Critical Finding:** Zero test files exist for Edge Functions (`supabase/functions/**/*.test.ts` - none found). Zero test files exist for Python webhook handlers in pythonanywhere.

## Webhook Handlers Identified

| Handler | Location | Language | Signature Verification | Tests |
|---------|----------|----------|------------------------|-------|
| SendGrid Webhook | `supabase/functions/reminder-scheduler/handlers/webhook.ts` | TypeScript/Deno | **NONE** | **NONE** |
| Twilio Webhook | `supabase/functions/reminder-scheduler/handlers/webhook.ts` | TypeScript/Deno | **NONE** | **NONE** |
| Slack Events | `pythonanywhere/mysite/modules/slack_events/routes.py` | Python/Flask | YES (HMAC-SHA256) | **NONE** |
| Slack Event Webhook | `pythonanywhere/mysite/modules/signup_automation_zap/slack_event_webhook.py` | Python/Flask | YES (HMAC-SHA256) | **NONE** |
| Direct Signup Webhook | `pythonanywhere/mysite/modules/signup_automation_zap/slack_event_webhook.py` | Python/Flask | **NONE** | **NONE** |
| Slack Edge Function | `supabase/functions/slack/index.ts` | TypeScript/Deno | **NONE** (outbound only) | **NONE** |

---

## SendGrid Webhook Gaps

### Handler: `handleSendGridWebhook`
- **File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts:49-112`
- **Purpose:** Process SendGrid delivery status events (delivered, bounced, failed, opened)
- **Events Handled:** `delivered`, `bounce`, `blocked`, `dropped`, `deferred`, `open`

#### Security Gaps (CRITICAL)
- [ ] **NO signature verification** - Handler accepts any POST request
- [ ] **NO timestamp validation** - No protection against replay attacks
- [ ] **NO webhook secret validation** - No shared secret verification

#### Missing Tests
- [ ] Valid SendGrid event processed correctly
- [ ] Invalid signature rejected (not implemented)
- [ ] Missing `messageId` handled gracefully
- [ ] `delivered` event updates `delivery_status` to `delivered`
- [ ] `delivered` event sets `delivered_at` timestamp
- [ ] `bounce` event updates `delivery_status` to `bounced`
- [ ] `blocked` event updates `delivery_status` to `bounced`
- [ ] `dropped` event updates `delivery_status` to `failed`
- [ ] `deferred` event updates `delivery_status` to `failed`
- [ ] `open` event sets `opened_at` timestamp
- [ ] Unknown event type handled gracefully
- [ ] Database update errors handled
- [ ] Duplicate event ignored (idempotency)

#### Recommended Signature Verification
```typescript
// SendGrid Event Webhook uses ECDSA signatures
import { createVerify } from 'node:crypto';

export function verifyWebhook(
  publicKey: string,
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  const timestampPayload = timestamp + payload;
  const verify = createVerify('sha256');
  verify.update(timestampPayload);
  verify.end();
  return verify.verify(publicKey, signature, 'base64');
}
```

---

## Twilio Webhook Gaps

### Handler: `handleTwilioWebhook`
- **File:** `supabase/functions/reminder-scheduler/handlers/webhook.ts:117-162`
- **Purpose:** Process Twilio SMS delivery status callbacks
- **Events Handled:** `delivered`, `failed`, `undelivered`

#### Security Gaps (CRITICAL)
- [ ] **NO signature verification** - Handler accepts any POST request
- [ ] **NO request URL validation** - Twilio signatures include request URL
- [ ] **NO auth token validation** - No Twilio auth token verification

#### Missing Tests
- [ ] Valid Twilio event processed correctly
- [ ] Invalid signature rejected (not implemented)
- [ ] Missing `messageSid` handled gracefully
- [ ] `delivered` event updates `delivery_status` to `delivered`
- [ ] `delivered` event sets `delivered_at` timestamp
- [ ] `failed` event updates `delivery_status` to `failed`
- [ ] `undelivered` event updates `delivery_status` to `failed`
- [ ] Error code stored when delivery fails
- [ ] Unknown event type handled gracefully
- [ ] Database update errors handled
- [ ] Duplicate event ignored (idempotency)

#### Recommended Signature Verification
```typescript
// Twilio Request Signature Validation
import * as crypto from 'node:crypto';

export function validateTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const data = url + Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], '');

  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## Slack Webhook Gaps

### Handler: Slack Events API (`/events`)
- **File:** `pythonanywhere/mysite/modules/slack_events/routes.py:75-172`
- **Purpose:** Receive and process Slack Events API subscriptions
- **Signature Verification:** YES - HMAC-SHA256 with `SLACK_SIGNING_SECRET_SIGNUP`

#### Implemented (Good Coverage)
- [x] Signature verification via HMAC-SHA256
- [x] Timestamp validation (5-minute window)
- [x] URL verification challenge handling
- [x] Bot message filtering

#### Missing Tests
- [ ] Valid signature accepted - returns 200
- [ ] Invalid signature rejected - returns 401
- [ ] Missing signature headers handled - returns 401
- [ ] Expired timestamp rejected - returns 401
- [ ] URL verification challenge responds correctly
- [ ] `event_callback` type processed correctly
- [ ] `app_rate_limited` type logged and acknowledged
- [ ] Unknown event types acknowledged with 200
- [ ] JSON parsing errors handled
- [ ] Event handler exceptions don't cause 500 (always returns 200)

#### Security Concern
```python
# Line 50-51: Skips verification when secret not configured
if not signing_secret:
    logger.warning("SLACK_SIGNING_SECRET_SIGNUP not configured - skipping signature verification")
    return True  # Allow for development, but log warning
```
**Risk:** In development/misconfigured environments, ANY request is accepted.

---

### Handler: Slack Signup Event Webhook
- **File:** `pythonanywhere/mysite/modules/signup_automation_zap/slack_event_webhook.py:428-472`
- **Purpose:** Process signup data from Slack messages
- **Signature Verification:** YES - HMAC-SHA256 with `SLACK_SIGNING_SECRET`

#### Implemented (Good Coverage)
- [x] Signature verification via `SlackVerifier` class
- [x] Timestamp validation (5-minute window)
- [x] URL verification challenge handling
- [x] Bot message filtering

#### Missing Tests
- [ ] Valid signature accepted
- [ ] Invalid signature rejected - returns 401
- [ ] Missing signature headers handled
- [ ] Expired timestamp rejected
- [ ] URL verification challenge responds correctly
- [ ] Message event extraction tested
- [ ] Signup data extraction from text tested
- [ ] Signup data extraction from JSON tested
- [ ] User existence check tested
- [ ] User creation tested
- [ ] Slack notification sent on success
- [ ] Slack notification sent on duplicate user

---

### Handler: Direct Signup Webhook (`/webhook/signup`)
- **File:** `pythonanywhere/mysite/modules/signup_automation_zap/slack_event_webhook.py:517-533`
- **Purpose:** Direct webhook for manual signup testing
- **Signature Verification:** **NONE**

#### Security Gap (MODERATE)
- [ ] **NO authentication** - Endpoint is completely open
- [ ] **NO rate limiting** - Could be abused for user enumeration

#### Missing Tests
- [ ] Valid signup data creates user
- [ ] Missing email returns 400
- [ ] Invalid user type returns 400
- [ ] Invalid version returns 400
- [ ] Duplicate user returns appropriate error
- [ ] API key authentication (not implemented)

---

## Slack Edge Function (Outbound Only)

### Handler: FAQ Inquiry
- **File:** `supabase/functions/slack/index.ts:170-238`
- **Purpose:** Send FAQ inquiries TO Slack (not receiving webhooks)
- **Note:** This is an OUTBOUND webhook sender, not a receiver

No signature verification needed as this function SENDS to Slack, doesn't receive from Slack.

---

## Security Test Gaps

| Handler | Signature Test | Timestamp Test | Secret Test | Replay Protection |
|---------|----------------|----------------|-------------|-------------------|
| SendGrid Webhook | N/A (not implemented) | N/A (not implemented) | N/A (not implemented) | N/A |
| Twilio Webhook | N/A (not implemented) | N/A (not implemented) | N/A (not implemented) | N/A |
| Slack Events API | ? | ? | ? | ? |
| Slack Signup Webhook | ? | ? | ? | ? |
| Direct Signup | N/A (none) | N/A (none) | N/A (none) | N/A |

---

## Idempotency Test Gaps

| Handler | Idempotency Check | Duplicate Test | Event ID Storage |
|---------|-------------------|----------------|------------------|
| SendGrid Webhook | **NOT IMPLEMENTED** | N/A | N/A |
| Twilio Webhook | **NOT IMPLEMENTED** | N/A | N/A |
| Slack Events API | **NOT IMPLEMENTED** | N/A | N/A |
| Slack Signup Webhook | **NOT IMPLEMENTED** | N/A | N/A |

**Critical Gap:** None of the webhook handlers implement idempotency. Processing the same webhook multiple times could cause duplicate database updates or operations.

---

## Side Effect Test Gaps

| Handler | DB Update | Email | Notification | Logging |
|---------|-----------|-------|--------------|---------|
| SendGrid Webhook | ? | N/A | N/A | ? |
| Twilio Webhook | ? | N/A | N/A | ? |
| Slack Events API | ? | N/A | ? | ? |
| Slack Signup Webhook | ? | N/A | ? | ? |

---

## Response Code Test Gaps

| Scenario | Expected | SendGrid | Twilio | Slack Events |
|----------|----------|----------|--------|--------------|
| Valid webhook | 200 | ? | ? | ? |
| Invalid signature | 400/401 | N/A | N/A | ? |
| Transient error | 500 (retry) | ? | ? | Returns 200 |
| Permanent error | 200 (no retry) | ? | ? | Returns 200 |
| Missing required field | 200 (logged) | ? | ? | ? |

---

## Handlers with Good Coverage (Reference)

### Slack Signature Verification
**File:** `pythonanywhere/mysite/modules/user_search_module/slack_verification.py`

This module implements proper Slack signature verification that could serve as a reference:

```python
def verify_slack_signature(slack_signing_secret: str):
    """Decorator to verify Slack request signatures"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get signature headers
            slack_signature = request.headers.get('X-Slack-Signature', '')
            slack_timestamp = request.headers.get('X-Slack-Request-Timestamp', '')

            # Check timestamp to prevent replay attacks (within 5 minutes)
            if abs(time.time() - request_timestamp) > 300:
                return jsonify({'error': 'Invalid request - timestamp expired'}), 403

            # Calculate expected signature
            sig_basestring = f'v0:{slack_timestamp}:{request_body}'
            my_signature = 'v0=' + hmac.new(
                slack_signing_secret.encode(),
                sig_basestring.encode(),
                hashlib.sha256
            ).hexdigest()

            # Compare signatures using constant-time comparison
            if not hmac.compare_digest(my_signature, slack_signature):
                return jsonify({'error': 'Invalid request - signature mismatch'}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator
```

---

## Recommended Test Helpers

### Stripe Signature Generator (for future Stripe webhooks)
```typescript
export function generateStripeSignature(
  payload: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000)
): string {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}
```

### SendGrid Signature Generator
```typescript
export function generateSendGridSignature(
  payload: string,
  publicKey: string,
  privateKey: string,
  timestamp = Math.floor(Date.now() / 1000)
): { signature: string; timestamp: string } {
  const timestampPayload = timestamp.toString() + payload;
  const sign = crypto.createSign('sha256');
  sign.update(timestampPayload);
  const signature = sign.sign(privateKey, 'base64');
  return { signature, timestamp: timestamp.toString() };
}
```

### Twilio Signature Generator
```typescript
export function generateTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string
): string {
  const data = url + Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], '');
  return crypto.createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');
}
```

### Slack Signature Generator
```typescript
export function generateSlackSignature(
  body: string,
  signingSecret: string,
  timestamp = Math.floor(Date.now() / 1000)
): { signature: string; timestamp: string } {
  const sigBasestring = `v0:${timestamp}:${body}`;
  const signature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');
  return { signature, timestamp: timestamp.toString() };
}
```

### Webhook Event Factory
```typescript
export function createSendGridEvent(
  event: string,
  messageId: string,
  timestamp?: string
): { event: string; messageId: string; timestamp: string } {
  return {
    event,
    messageId,
    timestamp: timestamp || new Date().toISOString(),
  };
}

export function createTwilioEvent(
  event: string,
  messageSid: string,
  timestamp?: string
): { event: string; messageSid: string; timestamp: string } {
  return {
    event,
    messageSid,
    timestamp: timestamp || new Date().toISOString(),
  };
}
```

---

## Priority Recommendations

### High Priority (Security)
1. **Implement SendGrid signature verification** in `reminder-scheduler/handlers/webhook.ts`
2. **Implement Twilio signature verification** in `reminder-scheduler/handlers/webhook.ts`
3. **Remove "skip verification" fallback** in `slack_events/routes.py` for production

### Medium Priority (Reliability)
4. **Implement idempotency** for all webhook handlers using event ID deduplication
5. **Add comprehensive test suite** for Deno Edge Functions

### Lower Priority (Completeness)
6. **Add rate limiting** to direct signup webhook
7. **Add authentication** to direct signup webhook

---

## Audit Metadata
- **Auditor:** Claude Opus 4.5
- **Date:** 2026-01-29
- **Files Reviewed:** 12
- **Test Files Found:** 0 (for webhook handlers)
