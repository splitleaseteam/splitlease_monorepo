---
name: audit-webhook-handler-tests
description: Audit the codebase to find webhook handlers (Stripe, Twilio, Zapier) that lack proper tests for signature verification, idempotency, and business logic. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Webhook Handler Testing Audit

You are conducting a comprehensive audit to identify webhook handlers that do not have proper test coverage for signature verification, idempotency, and business logic.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Stripe webhooks** - Look for:
   - Routes for `/webhooks/stripe` or `/api/webhooks/stripe`
   - `stripe.webhooks.constructEvent()`
   - Handlers for `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Refund and dispute handlers

2. **Twilio webhooks** - Look for:
   - Routes for `/webhooks/twilio`
   - SMS status callbacks
   - Incoming SMS handlers
   - Twilio signature validation

3. **Generic webhooks** - Look for:
   - Zapier webhook handlers
   - n8n webhook handlers
   - Any `/webhooks/*` routes

4. **Test helpers** - Check for:
   - Stripe signature generation helpers
   - Twilio signature generation helpers
   - Webhook test fixtures

### Core Concerns to Check

For each webhook handler:
1. **SIGNATURE**: Is signature verification tested?
2. **PARSING**: Is payload handling tested?
3. **IDEMPOTENCY**: Is duplicate event handling tested?
4. **RESPONSE**: Are status codes tested?
5. **SIDE EFFECTS**: Are business logic effects tested?

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-webhook-handler-tests.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Webhook Handler Testing Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Webhook handlers found: X
- Handlers needing tests: X
- Signature validation gaps: X
- Idempotency gaps: X

## Infrastructure Check

### Webhook Test Helpers Status
- [ ] Stripe signature generator exists
- [ ] Twilio signature generator exists
- [ ] Webhook event factory functions exist
- [ ] Test database setup for webhook tests

## Stripe Webhook Gaps

### Handler: payment_intent.succeeded
- **File:** `path/to/stripe-webhook.ts`
- **Missing Tests:**
  - [ ] Valid signature accepted
  - [ ] Invalid signature rejected
  - [ ] Expired timestamp rejected
  - [ ] Booking status updated to confirmed
  - [ ] Confirmation email sent
  - [ ] Seller notification sent
  - [ ] Duplicate event ignored (idempotency)

### Handler: payment_intent.payment_failed
- **File:** `path/to/stripe-webhook.ts`
- **Missing Tests:**
  - [ ] Booking status updated to payment_failed
  - [ ] Failure email sent
  - [ ] Error code stored

### Handler: charge.refunded
- **File:** `path/to/stripe-webhook.ts`
- **Missing Tests:**
  - [ ] Booking status updated
  - [ ] Refund amount recorded
  - [ ] Refund notification sent

## Twilio Webhook Gaps

### Handler: SMS Status Callback
- **File:** `path/to/twilio-webhook.ts`
- **Missing Tests:**
  - [ ] Valid signature accepted
  - [ ] Invalid signature rejected
  - [ ] Delivered status recorded
  - [ ] Failed status recorded with error code

### Handler: Incoming SMS
- **File:** `path/to/twilio-webhook.ts`
- **Missing Tests:**
  - [ ] Message created from SMS
  - [ ] TwiML response returned
  - [ ] Unknown sender handled

## Generic Webhook Gaps

### Handler: Zapier Trigger
- **File:** `path/to/zapier-webhook.ts`
- **Missing Tests:**
  - [ ] Secret validation
  - [ ] Booking data returned
  - [ ] Polling endpoint works

## Security Test Gaps

| Handler | Signature Test | Timestamp Test | Secret Test |
|---------|----------------|----------------|-------------|
| Stripe payment | ? | ? | N/A |
| Stripe refund | ? | ? | N/A |
| Twilio SMS | ? | N/A | N/A |
| Zapier | N/A | N/A | ? |

## Idempotency Test Gaps

| Handler | Idempotency Check | Duplicate Test |
|---------|-------------------|----------------|
| payment_intent.succeeded | ? | ? |
| payment_intent.payment_failed | ? | ? |

## Side Effect Test Gaps

| Handler | DB Update | Email | Notification |
|---------|-----------|-------|--------------|
| payment_intent.succeeded | ? | ? | ? |
| payment_intent.payment_failed | ? | ? | ? |
| charge.refunded | ? | ? | ? |

## Response Code Test Gaps

| Scenario | Expected | Tested |
|----------|----------|--------|
| Valid webhook | 200 | ? |
| Invalid signature | 400 | ? |
| Transient error | 500 (retry) | ? |
| Permanent error | 200 (no retry) | ? |

## Handlers with Good Coverage (Reference)

List any webhook handlers that already have proper test coverage.

## Recommended Test Helpers

### Stripe Signature Generator
```typescript
export function generateStripeSignature(
  payload: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000)
): string {
  const signedPayload = `${timestamp}.${payload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')
  return `t=${timestamp},v1=${signature}`
}
```

### Stripe Event Factory
```typescript
export function createStripeEvent(type: string, data: object, id?: string) {
  return {
    id: id || `evt_${Date.now()}`,
    type,
    created: Math.floor(Date.now() / 1000),
    data: { object: data },
    livemode: false,
  }
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
    .reduce((acc, key) => acc + key + params[key], '')
  return crypto.createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64')
}
```

```

---

## Reference: Webhook Testing Patterns

### Core Concerns

1. **SIGNATURE**: Verify request is from legitimate source
2. **PARSING**: Handle payload correctly
3. **IDEMPOTENCY**: Process same event only once
4. **RESPONSE**: Return correct status codes
5. **SIDE EFFECTS**: Trigger correct business logic

### Pattern 1: Test Valid Signature

```typescript
it('accepts valid signature', async () => {
  const event = createStripeEvent('payment_intent.succeeded', { id: 'pi_123' })
  const payload = JSON.stringify(event)
  const signature = generateStripeSignature(payload, WEBHOOK_SECRET)

  const response = await request(app)
    .post('/webhooks/stripe')
    .set('stripe-signature', signature)
    .send(payload)

  expect(response.status).toBe(200)
})
```

### Pattern 2: Test Invalid Signature

```typescript
it('rejects invalid signature', async () => {
  const response = await request(app)
    .post('/webhooks/stripe')
    .set('stripe-signature', 't=123,v1=invalid')
    .send({ type: 'test' })

  expect(response.status).toBe(400)
})
```

### Pattern 3: Test Idempotency

```typescript
it('processes same event only once', async () => {
  const updateBooking = vi.spyOn(bookingService, 'confirm')

  const event = createStripeEvent('payment_intent.succeeded', { ... }, 'evt_same')
  const payload = JSON.stringify(event)
  const signature = generateStripeSignature(payload, WEBHOOK_SECRET)

  await request(app).post('/webhooks/stripe').set('stripe-signature', signature).send(payload)
  await request(app).post('/webhooks/stripe').set('stripe-signature', signature).send(payload)

  expect(updateBooking).toHaveBeenCalledTimes(1)
})
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| No signature tests | Test valid, invalid, missing |
| No idempotency tests | Verify duplicate handling |
| Always returning 200 | Return 5xx for transient errors |
| Not testing side effects | Verify emails, DB updates |
| Hardcoded secrets | Use environment variables |

## Output Requirements

1. Be thorough - review EVERY webhook handler
2. Be specific - include exact file paths and handler names
3. Be actionable - provide test helper templates
4. Only report gaps - do not list tested handlers unless as reference
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-webhook-handler-tests.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
