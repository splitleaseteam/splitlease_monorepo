# Payment Issues

## Overview

This runbook covers troubleshooting and resolving payment-related issues including failed payments, refund requests, and billing discrepancies. Payments are processed through Stripe and synced between Supabase and Bubble.

## Prerequisites

- Access to Stripe Dashboard
- Access to Supabase Dashboard
- Access to Bubble Admin (for legacy data)
- Understanding of payment flow

## Payment Flow Overview

```
Guest initiates payment
    ↓
Frontend creates payment intent (Stripe)
    ↓
User completes payment (Stripe checkout)
    ↓
Stripe webhook fires
    ↓
Edge Function processes webhook
    ↓
Payment record created in Supabase
    ↓
Proposal status updated
    ↓
Sync to Bubble
```

## Common Issues

### Issue: Payment Failed During Checkout

**Symptoms:**
- User sees error during payment
- Money not charged
- Proposal still pending

**Diagnosis:**
1. Get payment intent ID from user or logs
2. Check Stripe Dashboard > Payments for the attempt
3. Look for decline reason

**Resolution:**

Common decline reasons:
| Decline Code | Meaning | Action |
|--------------|---------|--------|
| `insufficient_funds` | Card has no funds | User tries different card |
| `card_declined` | Generic decline | User contacts their bank |
| `expired_card` | Card expired | User updates card info |
| `incorrect_cvc` | Wrong CVV | User re-enters card |
| `processing_error` | Stripe issue | Retry later |

For technical failures:
1. Check Edge Function logs for webhook processing
2. Verify Stripe webhook endpoint is configured
3. Check STRIPE_SECRET_KEY is set correctly

---

### Issue: Payment Succeeded but Proposal Not Updated

**Symptoms:**
- Stripe shows successful charge
- User's proposal still shows "pending payment"
- Payment record may or may not exist

**Diagnosis:**
```sql
-- Check payment records
SELECT * FROM payment
WHERE proposal_id = '<proposal_id>'
ORDER BY created_at DESC;

-- Check proposal status
SELECT _id, status, payment_status
FROM proposal
WHERE _id = '<proposal_id>';
```

**Resolution:**

1. If payment record missing:
   - Check webhook delivery in Stripe Dashboard
   - Look for failed webhook deliveries
   - May need to manually process

2. If payment record exists but proposal not updated:
   - Check for database trigger issues
   - Manually update proposal:
   ```sql
   UPDATE proposal
   SET payment_status = 'paid',
       status = 'confirmed'
   WHERE _id = '<proposal_id>';
   ```

3. Resend webhook from Stripe:
   - Go to Stripe Dashboard > Webhooks > Events
   - Find the payment event
   - Click "Resend"

---

### Issue: Double Charge

**Symptoms:**
- User charged twice
- Two payment records in database

**Diagnosis:**
1. Check Stripe Dashboard for duplicate charges
2. Check database for duplicate payment records:
```sql
SELECT *
FROM payment
WHERE proposal_id = '<proposal_id>'
ORDER BY created_at;
```

**Resolution:**

1. Verify it's actually a double charge (not auth + capture)

2. If legitimate double charge:
   - Refund one charge via Stripe Dashboard
   - Remove duplicate payment record if needed
   ```sql
   DELETE FROM payment
   WHERE _id = '<duplicate_payment_id>';
   ```

3. Investigate root cause:
   - Check for webhook retry issues
   - Look for frontend double-submit

---

### Issue: Refund Request

**Symptoms:**
- User requests refund
- Need to process partial or full refund

**Procedure:**

1. **Verify refund is warranted** (check policies)

2. **Process refund in Stripe:**
   - Go to Stripe Dashboard > Payments
   - Find the payment
   - Click "Refund"
   - Enter amount (full or partial)

3. **Update database:**
```sql
UPDATE payment
SET refund_status = 'refunded',
    refund_amount = <amount>,
    refunded_at = NOW()
WHERE stripe_payment_id = '<payment_id>';
```

4. **Update proposal status if needed:**
```sql
UPDATE proposal
SET status = 'cancelled',
    payment_status = 'refunded'
WHERE _id = '<proposal_id>';
```

5. **Sync to Bubble:**
   - Check sync_queue for pending items
   - Trigger manual sync if needed

---

### Issue: Webhook Not Being Received

**Symptoms:**
- Payments succeed but system doesn't update
- No webhook events in logs

**Diagnosis:**
1. Check Stripe Dashboard > Webhooks
2. Look for failed deliveries
3. Verify endpoint URL is correct

**Resolution:**

1. **Verify webhook endpoint:**
   - Should be: `https://<project-id>.supabase.co/functions/v1/<webhook-function>`

2. **Check webhook signing secret:**
   - Verify STRIPE_WEBHOOK_SECRET is set
   ```bash
   supabase secrets list --project-ref <project-id>
   ```

3. **Check function is deployed:**
   ```bash
   supabase functions list --project-ref <project-id>
   ```

4. **Test webhook manually:**
   - Use Stripe CLI: `stripe trigger payment_intent.succeeded`

---

### Issue: Payment Amount Mismatch

**Symptoms:**
- Charged amount doesn't match expected
- User disputes incorrect charge

**Diagnosis:**
```sql
-- Compare amounts
SELECT
    p._id as proposal_id,
    p.total_price as expected_amount,
    pay.amount as charged_amount
FROM proposal p
LEFT JOIN payment pay ON pay.proposal_id = p._id
WHERE p._id = '<proposal_id>';
```

**Resolution:**

1. If overcharged:
   - Process partial refund for difference
   - Investigate pricing calculation bug

2. If undercharged:
   - Cannot charge more without new authorization
   - Decide if worth pursuing
   - Fix pricing bug for future

3. Investigate pricing logic:
   - Check pricing Edge Function
   - Review calculation inputs

---

### Issue: Dispute/Chargeback

**Symptoms:**
- Stripe shows dispute notification
- Funds held pending resolution

**Procedure:**

1. **Review dispute in Stripe Dashboard:**
   - Understand reason for dispute
   - Note deadline for response

2. **Gather evidence:**
   - Booking confirmation
   - Communication history
   - Terms of service
   - Any proof of service rendered

3. **Submit response via Stripe:**
   - Upload evidence
   - Write clear explanation
   - Submit before deadline

4. **Track outcome:**
   - Disputes typically resolve in 60-75 days
   - Update records based on outcome

---

### Issue: Payout Not Received (Host)

**Symptoms:**
- Host hasn't received their payout
- Payout shows as pending

**Diagnosis:**
1. Check Stripe Connect Dashboard
2. Verify host's connected account status
3. Check payout schedule

**Resolution:**

1. **If account not fully onboarded:**
   - Host needs to complete Stripe Connect onboarding
   - Provide onboarding link

2. **If payout delayed:**
   - Check Stripe payout schedule
   - May be normal delay (2-7 business days)

3. **If bank details wrong:**
   - Host updates bank info in Stripe
   - Retry payout

---

## Emergency: System-Wide Payment Failures

If all payments are failing:

1. **Check Stripe Status:** status.stripe.com
2. **Check our webhook endpoint:** Test with Stripe CLI
3. **Check secrets:** Verify STRIPE_SECRET_KEY is valid
4. **Check Edge Function:** Review logs and health
5. **Escalate:** Contact Engineering Lead immediately

## Verification

After resolving any payment issue:

1. **Stripe shows correct state:**
   - Payment status matches expected
   - Refunds processed if applicable

2. **Database is consistent:**
```sql
SELECT
    p._id,
    p.status,
    p.payment_status,
    pay.amount,
    pay.status as payment_record_status
FROM proposal p
LEFT JOIN payment pay ON pay.proposal_id = p._id
WHERE p._id = '<proposal_id>';
```

3. **User confirms resolution:**
   - Payment received/refunded
   - Can proceed with booking

4. **Synced to Bubble:**
```sql
SELECT * FROM sync_queue
WHERE record_id = '<payment_id>'
OR record_id = '<proposal_id>';
```

## Escalation

| Issue | Escalate To |
|-------|-------------|
| Stripe platform outage | Monitor stripe status |
| Security concern (fraud) | Security Team |
| Large refund (>$1000) | Finance + Engineering Lead |
| Dispute/chargeback | Finance |
| Payout issues | Finance + Engineering Lead |

## Related Runbooks

- [proposal-stuck.md](proposal-stuck.md) - Proposal issues
- [new-user-issues.md](new-user-issues.md) - User account issues
- [../incidents/outage-edge-functions.md](../incidents/outage-edge-functions.md) - Function issues

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
