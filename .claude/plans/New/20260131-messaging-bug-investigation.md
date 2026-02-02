# Messaging Bug Investigation Report

**Date**: 2026-01-31
**Status**: Analysis Complete - Awaiting Implementation

---

## Bug Description

When a guest user creates a proposal:
1. The message thread IS being created
2. But the message content is NOT being created
3. The confirmation message to the guest is not sent
4. The message to the host is not sent

Additionally, the same issue exists in the "ContactHostMessaging" shared island - sending messages is not working there either.

---

## Root Cause Analysis

### Issue #1: Proposal Creation - SplitBot Messages Failing Silently

**Location**: `supabase/functions/proposal/actions/create.ts` (lines 700-777)

The SplitBot message creation is wrapped in a try-catch with **non-blocking error handling**:

```typescript
// Line 772-776
} catch (msgError) {
  // Non-blocking - proposal and thread are created, messages are secondary
  console.error(`[proposal:create] SplitBot messages failed:`, msgError);
  console.warn(`[proposal:create] Proposal and thread created, but SplitBot messages failed`);
}
```

**Root Cause**: The CTA (Call-to-Action) lookup is failing or returning null, which prevents message creation.

Looking at the code flow:
1. Lines 728-731 fetch CTAs for guest and host:
```typescript
const [guestCTA, hostCTA] = await Promise.all([
  getCTAForProposalStatus(supabase, status, 'guest', templateContext),
  getCTAForProposalStatus(supabase, status, 'host', templateContext),
]);
```

2. Lines 736-749 create guest message **only if guestCTA exists**:
```typescript
if (guestCTA) {
  // ... create message
}
```

3. Lines 752-765 create host message **only if hostCTA exists**:
```typescript
if (hostCTA) {
  // ... create message
}
```

**The Problem**: The `getCTAForProposalStatus` function in `supabase/functions/_shared/ctaHelpers.ts` (lines 247-283) first calls `getCTANameForStatus()` which uses the `STATUS_TO_CTA` mapping (lines 30-73).

Looking at the STATUS_TO_CTA mapping, the status `"Proposal Submitted by guest - Awaiting Rental Application"` IS mapped:

```typescript
'Proposal Submitted by guest - Awaiting Rental Application': {
  guest: 'fill_out_rental_application',
  host: 'view_proposal_host',
},
```

However, the CTA database lookup (`getCTAByName`) may be failing because:
1. The CTAs `fill_out_rental_application` and `view_proposal_host` may not exist in `reference_table.os_messaging_cta`
2. The database query is failing silently (error logged but null returned)

**Key Evidence from code (ctaHelpers.ts line 204-209)**:
```typescript
if (error) {
  console.error(`[ctaHelpers] Failed to fetch CTA '${ctaName}':`, error);
  return null;  // <-- Returns null, causing message creation to be skipped
}
```

### Issue #2: ContactHostMessaging - Same Pattern

**Location**: `app/src/islands/shared/ContactHostMessaging.jsx` (lines 509-566)

For authenticated users, the component calls:
```javascript
await supabase.functions.invoke('messages', {
  body: {
    action: 'send_message',
    payload: {
      recipient_user_id: hostUserId,
      listing_id: listing.id,
      message_body: formData.message.trim(),
      send_welcome_messages: true
    }
  }
});
```

This invokes `supabase/functions/messages/handlers/sendMessage.ts`.

**Potential Issue**: The `sendMessage` handler (lines 57-117) also uses CTA lookup for welcome messages:

```typescript
const [guestCTA, hostCTA] = await Promise.all([
  getCTAByName(supabase, 'create_proposal_guest'),
  getCTAByName(supabase, 'new_inquiry_host_view'),
]);
```

If these CTAs (`create_proposal_guest`, `new_inquiry_host_view`) don't exist in the database, welcome messages are skipped.

---

## Data Flow Diagram

```
PROPOSAL CREATION FLOW:
=======================
1. Guest submits proposal
      ↓
2. proposalService.createProposal() [app/src/lib/proposalService.js]
      ↓
3. Edge Function: proposal/actions/create.ts
      ↓
4. findOrCreateProposalThread() → Thread created ✅
      ↓
5. getCTAForProposalStatus(status, 'guest') → Returns NULL ❌
      ↓
6. getCTAForProposalStatus(status, 'host') → Returns NULL ❌
      ↓
7. if (guestCTA) → FALSE, message creation SKIPPED
8. if (hostCTA) → FALSE, message creation SKIPPED
      ↓
9. Thread exists but NO messages created


CONTACT HOST FLOW:
==================
1. Guest sends message via ContactHostMessaging modal
      ↓
2. supabase.functions.invoke('messages', { action: 'send_message' })
      ↓
3. messages/handlers/sendMessage.ts
      ↓
4. createMessage() → User's message IS created ✅
      ↓
5. sendInquiryWelcomeMessages() if isNewThread && send_welcome_messages
      ↓
6. getCTAByName('create_proposal_guest') → NULL? ❌
7. getCTAByName('new_inquiry_host_view') → NULL? ❌
      ↓
8. Welcome messages potentially skipped
```

---

## Verification Steps

To verify this diagnosis, check the database:

```sql
-- Check if required CTAs exist in reference_table.os_messaging_cta
SELECT name, display, message FROM reference_table.os_messaging_cta
WHERE name IN (
  'fill_out_rental_application',
  'view_proposal_host',
  'view_proposal_guest',
  'create_proposal_guest',
  'new_inquiry_host_view'
);
```

Also check Edge Function logs for:
- `[ctaHelpers] Failed to fetch CTA`
- `[ctaHelpers] No CTA mapping for status`
- `[proposal:create] CTAs resolved - guest: none, host: none`

---

## Recommended Fix

### Option A: Ensure CTAs Exist in Database (Preferred)

Insert the missing CTAs into `reference_table.os_messaging_cta`:

```sql
INSERT INTO reference_table.os_messaging_cta (name, display, message, button_text, is_proposal_cta, visible_to_guest_only, visible_to_host_only)
VALUES
  ('fill_out_rental_application', 'Fill Out Rental Application',
   'Hi [Guest name]! Your proposal for [Listing name] has been submitted. Please complete your rental application to continue.',
   'Complete Application', true, true, false),
  ('view_proposal_host', 'View Proposal',
   'Hi [Host name]! [Guest name] has submitted a proposal for [Listing name]. Review their request and respond.',
   'View Proposal', true, false, true),
  ('view_proposal_guest', 'View Proposal',
   'Your proposal for [Listing name] is being reviewed by the host.',
   'View Status', true, true, false),
  ('create_proposal_guest', 'Create Proposal',
   'Hi [Guest name]! Start a conversation with [Host name] about [Listing name].',
   'Create Proposal', false, true, false),
  ('new_inquiry_host_view', 'New Inquiry',
   'Hi [Host name]! [Guest name] is interested in [Listing name].',
   'View Inquiry', false, false, true);
```

### Option B: Add Fallback Message Creation (Secondary)

Modify `proposal/actions/create.ts` to create messages even when CTAs are missing:

```typescript
// Line 735-749 - Always create guest message
const guestMessageBody = guestCTA?.message || getDefaultMessage(status, 'guest', templateContext);
const guestDisplay = guestCTA?.display || 'View Proposal';
const guestVisibility = getVisibilityForRole('guest');

await createSplitBotMessage(supabase, {
  threadId,
  messageBody: guestMessageBody,
  callToAction: guestDisplay,
  visibleToHost: guestVisibility.visibleToHost,
  visibleToGuest: guestVisibility.visibleToGuest,
  recipientUserId: input.guestId,
});
```

Similar change for host message.

---

## Files Involved

| File | Line Numbers | Role |
|------|--------------|------|
| `supabase/functions/proposal/actions/create.ts` | 700-777 | Main proposal creation with SplitBot messages |
| `supabase/functions/_shared/ctaHelpers.ts` | 30-73, 193-210, 247-283 | CTA mapping and database lookup |
| `supabase/functions/_shared/messagingHelpers.ts` | 483-528 | createSplitBotMessage function |
| `supabase/functions/messages/handlers/sendMessage.ts` | 57-117, 119-345 | Send message handler with welcome messages |
| `app/src/islands/shared/ContactHostMessaging.jsx` | 509-633 | Frontend contact host modal |
| `app/src/lib/proposalService.js` | 103-183 | Frontend proposal service |

---

## Priority

**HIGH** - This bug causes:
1. Guests to not receive confirmation that their proposal was submitted
2. Hosts to not be notified of new proposals
3. ContactHost messages potentially missing welcome context

---

## Next Steps

1. **Verify** - Check if CTAs exist in database using the SQL query above
2. **Check logs** - Look for CTA fetch errors in Edge Function logs
3. **Implement fix** - Either insert missing CTAs (Option A) or add fallback (Option B)
4. **Test** - Create a test proposal and verify messages are created

