# Expand Proposal Acceptance Messaging

**Created**: 2026-01-29
**Status**: Ready for Implementation
**Scope**: Add Slack notification (Step 5) + scaffold multi-channel workflow (Steps 16-17)

---

## Context

When a proposal is accepted (host accepts proposal OR guest accepts counteroffer), the CORE-create-lease workflow from Bubble sends notifications across multiple channels. Currently, we only send **in-app SplitBot messages**. This plan adds the missing channels.

### Current State
- ✅ In-app SplitBot message to guest (via `counteroffer_accepted` CTA)
- ✅ In-app SplitBot message to host (via `counteroffer_accepted` CTA)
- ❌ Internal Slack notification (Step 5)
- ❌ Celebratory emails to host/guest (Steps 11-15) - **OUT OF SCOPE** (needs Bubble template extraction)
- ❌ Multi-channel pre-reservation messages (Steps 16-17) - **SCAFFOLD ONLY**

---

## Implementation Plan

### Phase 1: Internal Slack Notification (Step 5)

**Purpose**: Alert customer-reservations team when a proposal/counteroffer is accepted

**Location**: `app/src/islands/modals/useCompareTermsModalLogic.js` (after lease creation, before in-app messages)

**Implementation**:
```javascript
// Step 5: Send internal Slack notification
try {
  await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/slack-notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'customer-reservations',
      subject: 'Counteroffer Accepted!',
      message: `
**Next Steps**: Draft Lease Documents

**Guest**: ${proposal.guest?.['Name - Full'] || 'Unknown'}
**Host**: ${proposal.host?.['Name - Full'] || 'Unknown'}
**Listing**: ${proposal.listing?.Name || 'Unknown'}
**Proposal ID**: ${proposal._id}
**Total Price**: $${counterofferTerms.totalPrice || originalTerms.totalPrice}
**Duration**: ${counterofferTerms.reservationWeeks || originalTerms.reservationWeeks} weeks
      `.trim()
    })
  });
  console.log('[useCompareTermsModalLogic] Slack notification sent');
} catch (slackErr) {
  console.warn('[useCompareTermsModalLogic] Could not send Slack notification:', slackErr);
}
```

**Dependencies**:
- Requires `slack-notify` Edge Function (check if exists, create if not)
- Uses existing `/slack-webhook` skill pattern

---

### Phase 2: Multi-Channel Pre-Reservation Messages (Steps 16-17) - SCAFFOLD

**Purpose**: Send SMS + Email + In-App messages to both host and guest with next-step instructions

**New Edge Function**: `supabase/functions/pre-reservation-notify/index.ts`

**Action**: `send_pre_reservation_messages`

**Payload**:
```typescript
interface PreReservationNotifyPayload {
  proposalId: string;
  leaseId: string;
  recipientRole: 'guest' | 'host' | 'both';
  channels: ('sms' | 'email' | 'in_app')[];
}
```

**Message Templates** (placeholders until Bubble extraction):

| Channel | Recipient | Template |
|---------|-----------|----------|
| SMS | Guest | `[Guest name], your reservation for [Listing name] has been confirmed! Check your email for next steps. - Split Lease` |
| SMS | Host | `[Host name], [Guest name] has confirmed their reservation at [Listing name]! Check your email for next steps. - Split Lease` |
| Email | Guest | Subject: `Your reservation is confirmed!` Body: TBD from Bubble |
| Email | Host | Subject: `New reservation confirmed!` Body: TBD from Bubble |
| In-App | Both | Already implemented via `counteroffer_accepted` CTA |

**Implementation Steps**:
1. Create `supabase/functions/pre-reservation-notify/index.ts`
2. Add handlers for each channel:
   - `sendSMS()` - uses Twilio (check existing integration)
   - `sendEmail()` - uses SendGrid (check existing integration)
   - `sendInApp()` - reuse existing `send_splitbot_message` handler
3. Add action routing in Edge Function
4. Call from `useCompareTermsModalLogic.js` after lease creation

---

### Phase 3: Wire Up in Frontend

**File**: `app/src/islands/modals/useCompareTermsModalLogic.js`

**Add after lease creation (around line 334)**:
```javascript
// Step 5: Internal Slack notification
// ... (Phase 1 code)

// Steps 16-17: Multi-channel pre-reservation messages
try {
  const notifyResponse = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pre-reservation-notify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_pre_reservation_messages',
        payload: {
          proposalId: proposal._id,
          leaseId: leaseResult.data?.leaseId,
          recipientRole: 'both',
          channels: ['sms', 'email', 'in_app']
        }
      })
    }
  );
  const notifyResult = await notifyResponse.json();
  if (notifyResult.success) {
    console.log('[useCompareTermsModalLogic] Pre-reservation notifications sent:', notifyResult.data);
  } else {
    console.warn('[useCompareTermsModalLogic] Pre-reservation notifications failed:', notifyResult.error);
  }
} catch (notifyErr) {
  console.warn('[useCompareTermsModalLogic] Error sending pre-reservation notifications:', notifyErr);
}
```

---

## Files to Create/Modify

### Create
- `supabase/functions/pre-reservation-notify/index.ts` - Main Edge Function
- `supabase/functions/pre-reservation-notify/handlers/sendSMS.ts` - SMS via Twilio
- `supabase/functions/pre-reservation-notify/handlers/sendEmail.ts` - Email via SendGrid

### Modify
- `app/src/islands/modals/useCompareTermsModalLogic.js` - Add Slack + multi-channel calls

### Check/Reuse
- `supabase/functions/slack-notify/` - May already exist
- `supabase/functions/_shared/twilioHelpers.ts` - Check for Twilio integration
- `supabase/functions/_shared/sendgridHelpers.ts` - Check for SendGrid integration

---

## Prerequisites Before Implementation

1. **Extract Bubble templates** for:
   - Celebratory email subjects and bodies (Steps 11-15)
   - Pre-reservation SMS text (Steps 16-17)
   - Pre-reservation email content (Steps 16-17)

2. **Verify integrations**:
   - Twilio credentials in Supabase secrets
   - SendGrid API key in Supabase secrets
   - Slack webhook URL for customer-reservations

3. **User notification preferences**:
   - Check if `user` table has SMS/email preference fields
   - Respect user preferences when sending

---

## Out of Scope (Future Work)

- Celebratory emails (Steps 11-15) - Needs full template extraction from Bubble
- SMS delivery status tracking
- Email open/click tracking
- Retry logic for failed notifications

---

## Testing Checklist

- [ ] Accept counteroffer → Slack notification appears in #customer-reservations
- [ ] Accept counteroffer → SMS sent to guest (if phone verified)
- [ ] Accept counteroffer → SMS sent to host (if phone verified)
- [ ] Accept counteroffer → Email sent to guest
- [ ] Accept counteroffer → Email sent to host
- [ ] Accept counteroffer → In-app messages appear for both (already working)
- [ ] Success modal still displays before page reload
- [ ] Notification failures don't block acceptance flow

---

## Reference Files

- [useCompareTermsModalLogic.js](app/src/islands/modals/useCompareTermsModalLogic.js) - Main acceptance logic
- [counterofferWorkflow.js](app/src/logic/workflows/proposals/counterofferWorkflow.js) - Counteroffer workflow
- [sendSplitBotMessage.ts](supabase/functions/messages/handlers/sendSplitBotMessage.ts) - In-app message handler
- [ctaHelpers.ts](supabase/functions/_shared/ctaHelpers.ts) - CTA lookup and templates
- [Requirements Doc](context - accepting of proposal.md) - Bubble workflow spec
