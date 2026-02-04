# Message Creation System Analysis
**Created**: 2026-02-03 14:30:00
**Bug Status**: Messages NOT created for key actions (thread created but empty)

---

## Bug Overview

**Problem**: Messages are NOT being created when key actions occur:
1. Proposal submission (guest submits proposal)
2. Counter-offer acceptance
3. Meeting scheduling requests
4. Rental application submission

**Symptom**: Thread is created successfully, but NO messages appear in the conversation. The thread exists but is empty.

**Impact**: Users see empty conversation threads with no guidance or call-to-action messages.

---

## Architecture Overview

### Message System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      MESSAGE SYSTEM FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Proposal Actions (supabase/functions/proposal/actions/)        │
│  ├─ create.ts ────────────────────────┐                         │
│  ├─ accept_counteroffer.ts ───────────┤                         │
│  ├─ accept_proposal.ts ───────────────┤                         │
│  ├─ create_counteroffer.ts ───────────┤                         │
│  └─ update.ts ────────────────────────┘                         │
│                                        │                         │
│                                        ▼                         │
│  Message Creation Logic                                          │
│  (supabase/functions/_shared/messagingHelpers.ts)                │
│  ├─ findOrCreateProposalThread()  ← Finds/creates thread        │
│  ├─ createSplitBotMessage()       ← Creates automated messages  │
│  └─ updateThreadLastMessage()     ← Updates thread preview      │
│                                        │                         │
│                                        ▼                         │
│  Messages Edge Function                                          │
│  (supabase/functions/messages/)                                  │
│  ├─ handlers/createProposalThread.ts                            │
│  │   └─ Creates thread + initial SplitBot messages              │
│  └─ handlers/sendSplitBotMessage.ts                             │
│      └─ Sends automated messages with CTAs                      │
│                                        │                         │
│                                        ▼                         │
│  Database Tables                                                 │
│  ├─ thread (conversation threads)                               │
│  ├─ _message (individual messages)                              │
│  └─ os_messaging_cta (call-to-action templates)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

### Edge Functions

| File | Purpose | Key Exports |
|------|---------|-------------|
| `supabase/functions/messages/index.ts` | Main router for message operations | Actions: `create_proposal_thread`, `send_splitbot_message`, `send_message`, `get_messages`, `get_threads` |
| `supabase/functions/messages/handlers/createProposalThread.ts` | Create thread + initial SplitBot messages | `handleCreateProposalThread()` |
| `supabase/functions/messages/handlers/sendSplitBotMessage.ts` | Send automated messages to existing thread | `handleSendSplitBotMessage()` |
| `supabase/functions/messages/handlers/sendMessage.ts` | User-sent messages | `handleSendMessage()` |
| `supabase/functions/messages/handlers/getMessages.ts` | Fetch messages for thread | `handleGetMessages()` |
| `supabase/functions/messages/handlers/getThreads.ts` | Fetch all threads for user | `handleGetThreads()` |

### Shared Helpers

| File | Purpose | Key Exports |
|------|---------|-------------|
| `supabase/functions/_shared/messagingHelpers.ts` | Core message/thread operations | `createSplitBotMessage()`, `findOrCreateProposalThread()`, `updateThreadLastMessage()`, `createThread()`, `createMessage()` |
| `supabase/functions/_shared/ctaHelpers.ts` | CTA template rendering | `getCTAForProposalStatus()`, `getCTAByName()`, `renderTemplate()`, `buildTemplateContext()` |
| `supabase/functions/_shared/negotiationSummaryHelpers.ts` | AI summary generation for host | `generateHostProposalSummary()` |

### Proposal Actions (Call Message Creation)

| File | Purpose | Messages Created? |
|------|---------|-------------------|
| `supabase/functions/proposal/actions/create.ts` | Create new proposal | ✅ **YES** - Lines 713-786 |
| `supabase/functions/proposal/actions/accept_counteroffer.ts` | Accept host's counteroffer | ✅ **YES** - Lines 98-238 |
| `supabase/functions/proposal/actions/accept_proposal.ts` | Accept guest proposal | ❓ **UNKNOWN** - Not read yet |
| `supabase/functions/proposal/actions/create_counteroffer.ts` | Host creates counteroffer | ❓ **UNKNOWN** - Not read yet |
| `supabase/functions/proposal/actions/update.ts` | Update proposal | ❓ **UNKNOWN** - Not read yet |

---

## How Messages SHOULD Be Created

### Step-by-Step Flow (Proposal Creation Example)

```javascript
// 1. PROPOSAL ACTION (create.ts lines 591-620)
// ================================================
// Find or create thread for the proposal
const { threadId, isNew } = await findOrCreateProposalThread(supabase, {
  proposalId: proposalId,
  hostUserId: hostUserData._id,
  guestUserId: input.guestId,
  listingId: input.listingId,
  listingName: resolvedListingName,
});

// 2. GENERATE AI SUMMARY (lines 623-704)
// ================================================
// Generate AI summary for host message (non-blocking)
aiHostSummary = await generateHostProposalSummary(supabase, {
  listingName: resolvedListingName,
  reservationWeeks: input.reservationSpanWeeks,
  moveInStart: formatDateForDisplay(input.moveInStartRange),
  moveInEnd: formatDateForDisplay(input.moveInEndRange),
  selectedDays: formatDaysAsRange(input.daysSelected),
  hostCompensation: compensation.host_compensation_per_night,
  totalCompensation: compensation.total_compensation,
  guestComment: input.comment || undefined,
});

// 3. CREATE SPLITBOT MESSAGES (lines 713-786)
// ================================================
if (threadId) {
  // Get CTA templates for guest and host based on proposal status
  const [guestCTA, hostCTA] = await Promise.all([
    getCTAForProposalStatus(supabase, status, 'guest', templateContext),
    getCTAForProposalStatus(supabase, status, 'host', templateContext),
  ]);

  // Create guest message
  if (guestCTA) {
    await createSplitBotMessage(supabase, {
      threadId,
      messageBody: guestCTA.message || getDefaultMessage(status, 'guest', templateContext),
      callToAction: guestCTA.display,
      visibleToHost: false,
      visibleToGuest: true,
      recipientUserId: input.guestId,
    });
  }

  // Create host message (use AI summary if available)
  if (hostCTA) {
    await createSplitBotMessage(supabase, {
      threadId,
      messageBody: aiHostSummary || hostCTA.message || getDefaultMessage(status, 'host', templateContext),
      callToAction: hostCTA.display,
      visibleToHost: true,
      visibleToGuest: false,
      recipientUserId: hostAccountData.User,
    });
  }

  // Update thread preview
  await updateThreadLastMessage(supabase, threadId, lastMessageBody);
}
```

### Key Functions

#### `createSplitBotMessage()` (messagingHelpers.ts lines 483-528)

```javascript
export async function createSplitBotMessage(
  supabase: SupabaseClient,
  params: CreateSplitBotMessageParams
): Promise<string> {
  const messageId = await generateBubbleId(supabase);
  const now = new Date().toISOString();

  // Get thread info for host/guest IDs
  const thread = await getThread(supabase, params.threadId);
  if (!thread) {
    throw new Error('Thread not found');
  }

  const { error } = await supabase
    .from('_message')
    .insert({
      _id: messageId,
      thread_id: params.threadId,
      "Message Body": params.messageBody,
      originator_user_id: SPLITBOT_USER_ID,
      host_user_id: thread.hostUser,
      guest_user_id: thread.guestUser,
      "is Split Bot": true,
      "is Forwarded": true,
      "is Visible to Host": params.visibleToHost,
      "is Visible to Guest": params.visibleToGuest,
      "is deleted (is hidden)": false,
      "Call to Action": params.callToAction,
      "Split Bot Warning": params.splitBotWarning || null,
      "Unread Users": [params.recipientUserId],
      "Created Date": now,
      "Modified Date": now,
      "Created By": SPLITBOT_USER_ID,
      created_at: now,
      updated_at: now,
      pending: false,
    });

  if (error) {
    console.error('[messagingHelpers] Failed to create SplitBot message:', error);
    throw new Error(`Failed to create SplitBot message: ${error.message}`);
  }

  return messageId;
}
```

**Database Insert Location**: `_message` table

**Key Fields**:
- `thread_id` - Links message to conversation thread
- `"Message Body"` - The message text
- `"Call to Action"` - CTA button (e.g., "Submit Rental Application")
- `"is Visible to Host"` / `"is Visible to Guest"` - Visibility controls
- `"Unread Users"` - Array of user IDs who haven't read this message

---

## CTA System (Call-to-Action Templates)

### Database Table: `os_messaging_cta`

Stores reusable CTA templates for different proposal statuses and user roles.

**Key Columns**:
- `display` (text) - CTA button text (e.g., "Submit Rental Application", "Review Proposal")
- `message` (text) - Template message body with placeholders (e.g., "{{hostName}} is reviewing your proposal...")
- `proposal_statuses` (text[]) - Array of proposal statuses this CTA applies to
- `role_visibility` (text[]) - Which roles see this message (`["guest"]`, `["host"]`, `["both"]`)

**Template Variables**:
- `{{hostName}}` - Host's first name
- `{{guestName}}` - Guest's first name
- `{{listingName}}` - Listing name

### CTA Lookup Functions

#### `getCTAForProposalStatus()` (ctaHelpers.ts)

```javascript
export async function getCTAForProposalStatus(
  supabase: SupabaseClient,
  proposalStatus: string,
  recipientRole: 'guest' | 'host',
  templateContext: TemplateContext
): Promise<{ display: string; message: string } | null> {
  // 1. Query os_messaging_cta table for matching status
  const { data: ctas, error } = await supabase
    .from('os_messaging_cta')
    .select('display, message, role_visibility')
    .contains('proposal_statuses', [proposalStatus]);

  // 2. Filter by role visibility
  const matchingCTA = ctas?.find(cta =>
    cta.role_visibility.includes(recipientRole) ||
    cta.role_visibility.includes('both')
  );

  // 3. Render template with context
  if (matchingCTA) {
    return {
      display: matchingCTA.display,
      message: renderTemplate(matchingCTA.message, templateContext)
    };
  }

  return null;
}
```

---

## Likely Bug Locations

### 1. CTA Table Missing Entries ⚠️ **HIGH PROBABILITY**

**Issue**: The `os_messaging_cta` table might be missing entries for certain proposal statuses.

**Evidence**:
- `create.ts` lines 737-743: Falls back to `getDefaultMessage()` if `guestCTA` or `hostCTA` is null
- If CTA lookup returns `null`, no message is created (wrapped in `if (guestCTA)` / `if (hostCTA)`)

**Check**:
```sql
-- Check if CTAs exist for key statuses
SELECT proposal_statuses, role_visibility, display
FROM os_messaging_cta
WHERE 'Rental Application Pending' = ANY(proposal_statuses)
   OR 'Rental Application Not Submitted' = ANY(proposal_statuses)
   OR 'Proposal or Counteroffer Accepted / Drafting Lease Documents' = ANY(proposal_statuses);
```

**Fix**: Add missing CTA entries to database

---

### 2. Non-Blocking Error Handling 🔍 **MEDIUM PROBABILITY**

**Issue**: Message creation is wrapped in try-catch blocks that log errors but don't fail the request.

**Evidence**:
- `create.ts` lines 781-785:
  ```javascript
  } catch (msgError) {
    // Non-blocking - proposal and thread are created, messages are secondary
    console.error(`[proposal:create] SplitBot messages failed:`, msgError);
    console.warn(`[proposal:create] Proposal and thread created, but SplitBot messages failed`);
  }
  ```
- `accept_counteroffer.ts` lines 235-238:
  ```javascript
  } catch (messageError) {
    console.error('[accept_counteroffer] Failed to create messages:', messageError);
    // Non-blocking - counteroffer was still accepted
  }
  ```

**Problem**: Errors are silently swallowed. User never knows messages failed.

**Check**: Review Supabase Edge Function logs for error messages

---

### 3. Thread Creation Without Proposal FK 🔍 **MEDIUM PROBABILITY**

**Issue**: In `accept_counteroffer.ts` (lines 99-154), the code implements a **multi-strategy thread lookup** to handle missing `Proposal` foreign keys.

**Evidence**:
```javascript
// Strategy 1: Look up thread by Proposal FK
const { data: threadByProposal } = await supabase
  .from('thread')
  .select('_id')
  .eq('Proposal', proposalId)
  .limit(1)
  .maybeSingle();

// Strategy 2: Fallback - find thread by host+guest+listing match
if (!threadId) {
  const { data: threadByMatch } = await supabase
    .from('thread')
    .select('_id')
    .eq('host_user_id', proposal['Host User'])
    .eq('guest_user_id', proposal.Guest)
    .eq('Listing', proposal.Listing)
    .limit(1)
    .maybeSingle();
}

// Strategy 3: Last resort - create new thread
if (!threadId) {
  console.warn('[accept_counteroffer] No existing thread found, creating new one');
  // Creates thread manually
}
```

**Why This Matters**: If threads are created WITHOUT the `Proposal` FK, later lookups by `proposalId` will fail.

**Check**:
```sql
-- Check for threads missing Proposal FK
SELECT _id, host_user_id, guest_user_id, "Listing", "Proposal"
FROM thread
WHERE "Proposal" IS NULL
  AND "Listing" IS NOT NULL;
```

---

### 4. Missing `createSplitBotMessage()` Calls in Other Actions ⚠️ **HIGH PROBABILITY**

**Issue**: Other proposal actions might not be calling `createSplitBotMessage()` at all.

**Evidence**: Only verified 2 actions (`create.ts`, `accept_counteroffer.ts`) call message creation. The following actions are unverified:
- `accept_proposal.ts`
- `create_counteroffer.ts`
- `update.ts`

**Check**: Grep for `createSplitBotMessage` in these files

---

### 5. Database Trigger Failures ❓ **LOW PROBABILITY**

**Issue**: Database triggers might be failing to insert messages.

**Evidence**: None yet - need to check database schema

**Check**:
```sql
-- Check if triggers exist for _message table
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgrelid = '_message'::regclass;
```

---

## Missing Implementation: Other Proposal Actions

### Files NOT Yet Analyzed

| File | Purpose | Messages Created? | Priority |
|------|---------|-------------------|----------|
| `accept_proposal.ts` | Host accepts guest proposal | ❓ | **HIGH** |
| `create_counteroffer.ts` | Host creates counteroffer | ❓ | **HIGH** |
| `update.ts` | Update proposal | ❓ | **MEDIUM** |

**Next Steps**:
1. Read these 3 files
2. Check if they call `createSplitBotMessage()`
3. If not, add message creation logic

---

## Database Schema

### `thread` Table

| Column | Type | Description |
|--------|------|-------------|
| `_id` | text | Primary key (Bubble ID) |
| `host_user_id` | text | Host user ID |
| `guest_user_id` | text | Guest user ID |
| `Listing` | text | Listing ID (FK) |
| `Proposal` | text | Proposal ID (FK) ⚠️ **Can be NULL** |
| `"Thread Subject"` | text | Thread title/subject |
| `"~Last Message"` | text | Preview of last message |
| `"~Date Last Message"` | timestamp | Timestamp of last message |
| `"Participants"` | text[] | Array of participant user IDs |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Key Issue**: `Proposal` FK can be `NULL`, causing thread lookup failures.

---

### `_message` Table

| Column | Type | Description |
|--------|------|-------------|
| `_id` | text | Primary key (Bubble ID) |
| `thread_id` | text | Thread ID (FK to thread._id) |
| `"Message Body"` | text | Message content |
| `originator_user_id` | text | User who sent message |
| `host_user_id` | text | Host user ID (for visibility) |
| `guest_user_id` | text | Guest user ID (for visibility) |
| `"is Split Bot"` | boolean | Is automated message? |
| `"is Forwarded"` | boolean | Is forwarded message? (SplitBot uses `true`) |
| `"is Visible to Host"` | boolean | Host can see this message? |
| `"is Visible to Guest"` | boolean | Guest can see this message? |
| `"is deleted (is hidden)"` | boolean | Is message deleted? |
| `"Call to Action"` | text | CTA button text |
| `"Split Bot Warning"` | text | Warning message |
| `"Unread Users"` | text[] | Array of user IDs who haven't read |
| `"Created Date"` | timestamp | Creation timestamp |
| `"Modified Date"` | timestamp | Last update timestamp |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |
| `pending` | boolean | Is message pending? |

**Critical**: Message MUST have:
- `thread_id` - Links to thread
- `"Message Body"` - Content
- Visibility flags set correctly

---

### `os_messaging_cta` Table

| Column | Type | Description |
|--------|------|-------------|
| `display` | text | CTA button text |
| `message` | text | Template message body |
| `proposal_statuses` | text[] | Array of matching proposal statuses |
| `role_visibility` | text[] | `["guest"]`, `["host"]`, or `["both"]` |

**Critical**: If no matching CTA found, no message is created.

---

## Debugging Checklist

### 1. Check CTA Table ⚠️ **START HERE**

```sql
-- List all CTAs with their statuses
SELECT
  display,
  proposal_statuses,
  role_visibility,
  LEFT(message, 50) as message_preview
FROM os_messaging_cta
ORDER BY display;
```

**Expected Result**: Should have CTAs for:
- `"Rental Application Pending"`
- `"Rental Application Not Submitted"`
- `"Proposal or Counteroffer Accepted / Drafting Lease Documents"`
- All other proposal statuses

---

### 2. Check Edge Function Logs

```bash
# View logs for messages function
supabase functions logs messages --tail

# View logs for proposal function
supabase functions logs proposal --tail
```

**Look for**:
- `[proposal:create] SplitBot messages failed:` errors
- `[createProposalThread]` errors
- `[messagingHelpers] Failed to create SplitBot message:` errors

---

### 3. Check Thread-Proposal Links

```sql
-- Find threads missing Proposal FK
SELECT
  t._id as thread_id,
  t.host_user_id,
  t.guest_user_id,
  t."Listing",
  t."Proposal",
  COUNT(m._id) as message_count
FROM thread t
LEFT JOIN _message m ON m.thread_id = t._id
WHERE t."Proposal" IS NULL
  AND t."Listing" IS NOT NULL
GROUP BY t._id
ORDER BY t.created_at DESC
LIMIT 20;
```

**Expected Result**: Should be zero or very few. If many, this is the bug.

---

### 4. Check Message Counts per Thread

```sql
-- Find threads with zero messages
SELECT
  t._id as thread_id,
  t."Thread Subject",
  t."Proposal",
  t.created_at,
  COUNT(m._id) as message_count
FROM thread t
LEFT JOIN _message m ON m.thread_id = t._id
GROUP BY t._id
HAVING COUNT(m._id) = 0
ORDER BY t.created_at DESC
LIMIT 20;
```

**Expected Result**: Should be zero. If many, messages are not being created.

---

### 5. Test Message Creation Manually

```javascript
// Call Edge Function directly
const { data, error } = await supabase.functions.invoke('messages', {
  body: {
    action: 'create_proposal_thread',
    payload: {
      proposalId: 'TEST_PROPOSAL_ID',
      guestId: 'GUEST_USER_ID',
      hostId: 'HOST_USER_ID',
      listingId: 'LISTING_ID',
      proposalStatus: 'Rental Application Pending',
    },
  },
});

console.log('Result:', data);
console.log('Error:', error);
```

---

## Recommended Fixes

### Fix 1: Add Missing CTA Entries ⚠️ **CRITICAL**

```sql
-- Example: Add CTA for "Rental Application Pending"
INSERT INTO os_messaging_cta (
  display,
  message,
  proposal_statuses,
  role_visibility,
  created_at,
  updated_at
) VALUES (
  'Submit Rental Application',
  'Hi {{guestName}}, your proposal for {{listingName}} is under review. Please submit your rental application to proceed.',
  ARRAY['Rental Application Pending', 'Rental Application Not Submitted'],
  ARRAY['guest'],
  NOW(),
  NOW()
);

-- Add CTA for host
INSERT INTO os_messaging_cta (
  display,
  message,
  proposal_statuses,
  role_visibility,
  created_at,
  updated_at
) VALUES (
  'Review Proposal',
  'Hi {{hostName}}, {{guestName}} has submitted a proposal for {{listingName}}. Please review and respond.',
  ARRAY['Rental Application Pending'],
  ARRAY['host'],
  NOW(),
  NOW()
);
```

---

### Fix 2: Update Thread Proposal FK When Found

Already implemented in `accept_counteroffer.ts` (lines 138-154). Apply same pattern to other actions.

```javascript
// If found via fallback strategy, update Proposal FK
if (threadId && !threadByProposal) {
  const { error: updateError } = await supabase
    .from('thread')
    .update({
      "Proposal": proposalId,
      "Modified Date": new Date().toISOString()
    })
    .eq('_id', threadId);

  if (updateError) {
    console.error('Failed to update thread Proposal FK:', updateError);
  } else {
    console.log('Updated thread Proposal FK:', threadId);
  }
}
```

---

### Fix 3: Add Message Creation to Missing Actions

Template for adding message creation to proposal actions:

```javascript
// At end of action handler (e.g., accept_proposal.ts)

// ================================================
// CREATE SPLITBOT MESSAGES (Non-blocking)
// ================================================

try {
  // Find or create thread
  const { threadId } = await findOrCreateProposalThread(supabase, {
    proposalId: proposalId,
    hostUserId: proposal['Host User'],
    guestUserId: proposal.Guest,
    listingId: proposal.Listing,
    listingName: listingName,
  });

  if (threadId) {
    // Get CTA for new status
    const [guestCTA, hostCTA] = await Promise.all([
      getCTAForProposalStatus(supabase, newStatus, 'guest', templateContext),
      getCTAForProposalStatus(supabase, newStatus, 'host', templateContext),
    ]);

    // Create guest message
    if (guestCTA) {
      await createSplitBotMessage(supabase, {
        threadId,
        messageBody: guestCTA.message,
        callToAction: guestCTA.display,
        visibleToHost: false,
        visibleToGuest: true,
        recipientUserId: proposal.Guest,
      });
    }

    // Create host message
    if (hostCTA) {
      await createSplitBotMessage(supabase, {
        threadId,
        messageBody: hostCTA.message,
        callToAction: hostCTA.display,
        visibleToHost: true,
        visibleToGuest: false,
        recipientUserId: proposal['Host User'],
      });
    }

    // Update thread preview
    await updateThreadLastMessage(supabase, threadId, guestCTA?.message || hostCTA?.message || '');
  }
} catch (msgError) {
  console.error('Failed to create messages:', msgError);
  // Non-blocking - action already completed
}
```

---

### Fix 4: Make Message Creation Failures Visible

**Problem**: Errors are logged but not surfaced to users.

**Option 1**: Add warning field to response
```javascript
return {
  proposalId,
  status,
  threadId,
  warnings: messageError ? ['Messages not sent - will retry'] : []
};
```

**Option 2**: Queue message creation for retry
```javascript
if (messageError) {
  // Add to retry queue
  await supabase.from('message_retry_queue').insert({
    threadId,
    proposalId,
    status,
    retryCount: 0,
    error: messageError.message,
  });
}
```

---

## Summary

### Root Causes (Most Likely to Least Likely)

1. **Missing CTA entries in `os_messaging_cta` table** ⚠️ 80% probability
   - If no matching CTA found, messages are not created
   - Easy to diagnose: Query the table

2. **Message creation not implemented in some actions** ⚠️ 60% probability
   - Only verified 2 actions call `createSplitBotMessage()`
   - Need to check `accept_proposal.ts`, `create_counteroffer.ts`, `update.ts`

3. **Thread lookup failures due to missing Proposal FK** 🔍 40% probability
   - If thread exists but Proposal FK is null, lookup by proposalId fails
   - Fallback strategies exist but might not be applied everywhere

4. **Silent error handling swallows failures** 🔍 30% probability
   - Try-catch blocks log but don't fail the request
   - Errors might be happening but not visible

5. **Database trigger failures** ❓ 10% probability
   - Less likely - would affect all message creation

---

## Next Steps

### Immediate Actions

1. **Check CTA table** (5 minutes)
   ```sql
   SELECT display, proposal_statuses, role_visibility
   FROM os_messaging_cta;
   ```

2. **Check Edge Function logs** (10 minutes)
   ```bash
   supabase functions logs messages --tail
   supabase functions logs proposal --tail
   ```

3. **Check thread-proposal links** (5 minutes)
   ```sql
   SELECT COUNT(*) FROM thread WHERE "Proposal" IS NULL AND "Listing" IS NOT NULL;
   ```

4. **Check empty threads** (5 minutes)
   ```sql
   SELECT COUNT(*) FROM (
     SELECT t._id
     FROM thread t
     LEFT JOIN _message m ON m.thread_id = t._id
     GROUP BY t._id
     HAVING COUNT(m._id) = 0
   ) as empty_threads;
   ```

### Code Review Tasks

1. **Read remaining proposal actions** (30 minutes)
   - `accept_proposal.ts`
   - `create_counteroffer.ts`
   - `update.ts`

2. **Verify message creation calls** (15 minutes)
   - Grep for `createSplitBotMessage` in all proposal actions

3. **Test message creation manually** (20 minutes)
   - Call Edge Function directly with test data

---

## Files Referenced

### Edge Functions
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\messages\index.ts`
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\messages\handlers\createProposalThread.ts`
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\messages\handlers\sendSplitBotMessage.ts`
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\proposal\index.ts`
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\proposal\actions\create.ts`
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\proposal\actions\accept_counteroffer.ts`

### Shared Helpers
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\_shared\messagingHelpers.ts`
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\_shared\ctaHelpers.ts`
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\_shared\negotiationSummaryHelpers.ts`

### Frontend (Not Modified)
- `c:\Users\Split Lease\Documents\Split Lease\app\src\messages.jsx`
- `c:\Users\Split Lease\Documents\Split Lease\app\src\islands\pages\MessagingPage\`

---

**End of Analysis**
