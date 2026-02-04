---
name: audit-stripe-payment-tests
description: Audit the codebase to find Stripe payment integrations (checkout flows, payment intents, webhooks, refunds) that lack proper testing. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Stripe Payment Testing Audit

You are conducting a comprehensive audit to identify Stripe payment integrations that do not have proper test coverage for checkout flows, payment intents, webhook handling, and refunds.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Payment Intent creation** - Look for:
   - `stripe.paymentIntents.create`
   - `PaymentIntent` imports
   - API routes handling `/create-payment-intent` or similar
   - Client secret handling

2. **Checkout components** - Look for:
   - `@stripe/stripe-js` imports
   - `@stripe/react-stripe-js` components
   - `<Elements>` provider
   - `<CardElement>` or `<PaymentElement>`
   - `useStripe()`, `useElements()` hooks

3. **Webhook handlers** - Look for:
   - Routes for `/webhooks/stripe` or `/api/webhooks`
   - `stripe.webhooks.constructEvent`
   - Event handlers for `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Signature verification code

4. **Payment hooks** - Look for:
   - `usePayment`, `useCheckout`, `useStripe` custom hooks
   - Payment state management
   - `confirmPayment`, `confirmCardPayment` calls

5. **Refund handling** - Look for:
   - `stripe.refunds.create`
   - Refund API endpoints
   - Cancellation flows

6. **Subscription billing** - Look for:
   - `stripe.subscriptions.create`
   - `stripe.customers.create`
   - Subscription management UI

### What to Check for Each Target

For each identified file, check if:
- A corresponding test file exists
- MSW handlers mock Stripe API endpoints
- Tests cover: success, decline, 3DS, network errors
- Webhook tests verify signature validation
- E2E tests exist for checkout flows
- Test cards are used (not real cards)

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-stripe-payment-tests.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Stripe Payment Testing Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Payment-related files found: X
- Files needing test coverage: X
- Webhook handlers needing tests: X
- E2E checkout coverage: Present/Missing

## Infrastructure Check

### Stripe Test Setup Status
- [ ] MSW handlers for Stripe API exist
- [ ] Test helper for filling Stripe card forms exists
- [ ] Test cards constant file exists
- [ ] Webhook signature generator for tests exists

### Test Environment
- [ ] `STRIPE_SECRET_KEY` test mode key configured
- [ ] `STRIPE_WEBHOOK_SECRET` test secret configured
- [ ] Stripe test mode properly isolated

## Critical Gaps (No Tests at All)

### 1. [Component/File Name]
- **File:** `path/to/file.tsx`
- **Stripe Operations:**
  - Creates PaymentIntent at line X
  - Handles card input at line Y
- **Why Testing Critical:** Revenue-impacting code
- **Recommended Test Scenarios:**
  - [ ] Payment intent creation
  - [ ] Success card (4242...)
  - [ ] Declined card (4000000000000002)
  - [ ] 3DS required card (4000002500003155)
  - [ ] Network timeout
  - [ ] Loading states

## Webhook Handler Gaps

### 1. [Handler Name]
- **File:** `path/to/webhook.ts`
- **Events Handled:**
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- **Missing Tests:**
  - [ ] Signature validation test
  - [ ] Success event processing
  - [ ] Failed event processing
  - [ ] Idempotency handling
  - [ ] Invalid signature rejection

## E2E Checkout Gaps

### Checkout Flows Found
| Flow | File | E2E Test |
|------|------|----------|
| One-time payment | `path/to/checkout.tsx` | Missing |
| Subscription signup | `path/to/subscribe.tsx` | Missing |

### Missing E2E Scenarios
- [ ] Full checkout with success card
- [ ] Declined card handling
- [ ] 3DS authentication flow
- [ ] Cart abandonment
- [ ] Payment retry after failure

## Refund/Cancellation Gaps

### 1. [Handler Name]
- **File:** `path/to/refunds.ts`
- **Missing Tests:**
  - [ ] Full refund processing
  - [ ] Partial refund
  - [ ] Refund failure handling

## Components with Good Coverage (Reference)

List payment components that already have proper test coverage as examples.

## Recommended MSW Handlers

Based on the audit, these handlers are needed:

### Payment Intent Handler
```typescript
http.post('https://api.stripe.com/v1/payment_intents', async ({ request }) => {
  // Implementation based on actual endpoints found
})
```

### Webhook Test Helper
```typescript
function generateWebhookSignature(payload: string, secret: string): string {
  // Helper for webhook tests
}
```

## Test Cards Reference

| Card Number | Scenario | Status |
|-------------|----------|--------|
| `4242424242424242` | Success | Tests: ? |
| `4000000000000002` | Decline | Tests: ? |
| `4000002500003155` | 3D Secure | Tests: ? |
| `4000000000009995` | Insufficient funds | Tests: ? |

## Security Checklist

| Check | Status |
|-------|--------|
| Webhook signatures validated | ? |
| Idempotency in webhook handlers | ? |
| Payment amounts validated server-side | ? |
| Test mode keys isolated from prod | ? |
| Card data never logged | ? |

```

---

## Reference: Stripe Payment Testing Patterns

Use these patterns as reference when identifying what's missing in the codebase:

### When to Recommend Stripe Payment Testing

- Implementing checkout flows (one-time or subscription)
- Testing payment form validation and UX
- Verifying webhook processing (payment success, failures, disputes)
- Testing refund and cancellation flows
- Debugging payment-related bugs

### Test Approaches

| Approach | Speed | Use Case |
|----------|-------|----------|
| MSW Mocks | Fast | Unit tests, component isolation |
| Stripe Test Mode | Medium | Integration tests, real Stripe API |
| Playwright E2E | Slow | Full checkout flow, card form interaction |

### Pattern 1: MSW Handler for Payment Intent

```typescript
http.post('https://api.stripe.com/v1/payment_intents', async ({ request }) => {
  const formData = await request.formData()
  const amount = parseInt(formData.get('amount') as string)
  return HttpResponse.json({
    id: `pi_test_${Date.now()}`,
    client_secret: `pi_test_secret_${Date.now()}`,
    status: 'requires_payment_method',
    amount,
  })
})
```

### Pattern 2: Testing Card Decline

```typescript
server.use(
  http.post('*/payment_intents/:id/confirm', () => {
    return HttpResponse.json({
      status: 'requires_payment_method',
      last_payment_error: {
        code: 'card_declined',
        message: 'Your card was declined.',
      },
    })
  })
)
```

### Pattern 3: Webhook Signature Testing

```typescript
function generateWebhookSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${payload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')
  return `t=${timestamp},v1=${signature}`
}
```

### Pattern 4: E2E Stripe Card Fill

```typescript
async function fillStripeCard(page, card) {
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
  await stripeFrame.getByPlaceholder('Card number').fill(card.number)
  await stripeFrame.getByPlaceholder('MM / YY').fill(card.exp)
  await stripeFrame.getByPlaceholder('CVC').fill(card.cvc)
}
```

### Pattern 5: 3DS Authentication Test

```typescript
test('handles 3D Secure authentication', async ({ page }) => {
  await fillStripeCard(page, TEST_CARDS.REQUIRES_3DS)
  await page.getByRole('button', { name: /pay/i }).click()

  // Handle 3DS modal
  const threeDSFrame = page.frameLocator('iframe[name="stripe-challenge-frame"]')
  await threeDSFrame.getByRole('button', { name: 'Complete' }).click()

  await expect(page).toHaveURL(/\/booking-confirmed/)
})
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Using real cards in tests | Use Stripe test cards |
| No webhook signature validation tests | Test signature verification |
| Only testing success path | Test declines, 3DS, errors |
| Hardcoded API keys | Use environment variables |
| Mocking Stripe.js client-side | Mock server responses instead |
| No E2E checkout tests | Add Playwright checkout flow tests |

## Output Requirements

1. Be thorough - review EVERY file from /prime output
2. Be specific - include exact file paths and line numbers where Stripe operations occur
3. Be actionable - provide clear next steps for each gap found
4. Only report gaps - do not list files that already have proper Stripe test coverage unless as reference examples
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-stripe-payment-tests.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
