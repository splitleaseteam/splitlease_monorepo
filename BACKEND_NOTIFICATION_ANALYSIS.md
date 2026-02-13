# Backend Notification Logic Analysis
**Date**: 2026-02-13
**Analyst**: Claude Agent (Backend Logic)
**Scope**: Supabase Edge Functions notification implementation
**Context**: Follow-up to Agent 1 (Frontend) and Agent 2 (Masking Service) findings

---

## Executive Summary

The backend notification system is **well-architected** with comprehensive preference checking and audit logging, but **CONFIRMS the critical mismatch** identified by Agent 1:

✅ **Backend expects**: Boolean columns (`proposal_updates_sms`, `promotional_email`, etc.) in `notification_preferences` table
❌ **Frontend provides**: Array columns (`['Email', 'SMS']`) in `notificationsettingsos_lists_` table

**Key Finding**: NO email/SMS masking logic exists in active Edge Functions. The masking service documented by Agent 2 was decommissioned and removed from the active codebase.

---

## 1. Backend Schema Expectations (Confirmed)

### Notification Helpers (`_shared/notificationHelpers.ts`)

**Interface Definition** (Lines 24-59):
```typescript
export interface NotificationPreferences {
  user_id: string;
  // 11 categories × 2 channels = 22 boolean fields
  proposal_updates_sms: boolean;
  proposal_updates_email: boolean;
  message_forwarding_sms: boolean;
  message_forwarding_email: boolean;
  payment_reminders_sms: boolean;
  payment_reminders_email: boolean;
  promotional_sms: boolean;           // Default: false
  promotional_email: boolean;
  reservation_updates_sms: boolean;
  reservation_updates_email: boolean;
  lease_requests_sms: boolean;
  lease_requests_email: boolean;
  checkin_checkout_sms: boolean;
  checkin_checkout_email: boolean;
  reviews_sms: boolean;
  reviews_email: boolean;
  tips_insights_sms: boolean;
  tips_insights_email: boolean;
  account_assistance_sms: boolean;
  account_assistance_email: boolean;
  virtual_meetings_sms: boolean;
  virtual_meetings_email: boolean;
}
```

**Preference Checking Logic** (Lines 120-140):
```typescript
export function shouldSendEmail(
  prefs: NotificationPreferences | null,
  category: NotificationCategory
): boolean {
  if (!prefs) return false;  // Privacy-first default
  const key = `${category}_email` as keyof NotificationPreferences;
  return prefs[key] === true;
}

export function shouldSendSms(
  prefs: NotificationPreferences | null,
  category: NotificationCategory
): boolean {
  if (!prefs) return false;  // Privacy-first default
  const key = `${category}_sms` as keyof NotificationPreferences;
  return prefs[key] === true;
}
```

**Database Query** (Lines 98-114):
```typescript
export async function getNotificationPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from('notification_preferences')  // ← BOOLEAN SCHEMA EXPECTED
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;  // Privacy-first: skip notifications if no prefs
  }

  return data as NotificationPreferences;
}
```

### Notification Sender (`_shared/notificationSender.ts`)

**Default Preferences** (Lines 494-528):
```typescript
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'user_id'> = {
  // OPT-OUT model: All enabled except promotional_sms
  checkin_checkout_sms: true,
  checkin_checkout_email: true,
  account_assistance_sms: true,
  account_assistance_email: true,
  message_forwarding_sms: true,
  message_forwarding_email: true,
  payment_reminders_sms: true,
  payment_reminders_email: true,
  proposal_updates_sms: true,
  proposal_updates_email: true,
  reservation_updates_sms: true,
  reservation_updates_email: true,
  reviews_sms: true,
  reviews_email: true,
  virtual_meetings_sms: true,
  virtual_meetings_email: true,
  lease_requests_sms: true,
  lease_requests_email: true,
  tips_insights_sms: true,
  tips_insights_email: true,
  promotional_sms: false,  // Email only for promotional
  promotional_email: true,
};
```

**Initialization Function** (Lines 534-560):
```typescript
export async function createDefaultNotificationPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('notification_preferences').insert({
      user_id: userId,
      ...DEFAULT_NOTIFICATION_PREFERENCES,
    });

    if (error) {
      // Ignore unique violation (preferences already exist)
      if (error.code === '23505') {
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

---

## 2. Schema Mismatch: Boolean vs Array

### Backend Expects (Boolean Columns)
```sql
-- notification_preferences table (expected by backend)
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  proposal_updates_sms BOOLEAN DEFAULT true,
  proposal_updates_email BOOLEAN DEFAULT true,
  message_forwarding_sms BOOLEAN DEFAULT true,
  message_forwarding_email BOOLEAN DEFAULT true,
  -- ... 18 more boolean columns
);
```

**Checking Logic**:
```typescript
// Example: Check if SMS enabled for proposal updates
const key = 'proposal_updates_sms';  // Concatenate category + channel
return prefs[key] === true;          // Direct boolean check
```

### Frontend Provides (Array Columns)
```sql
-- notificationsettingsos_lists_ table (written by frontend)
CREATE TABLE notificationsettingsos_lists_ (
  id UUID PRIMARY KEY,
  "Created By" TEXT,  -- User ID
  "Proposal Updates" TEXT[],  -- ARRAY: ['Email', 'SMS', 'In-App Message']
  "Message Forwarding" TEXT[],
  "Payment Reminders" TEXT[],
  -- ... 8 more array columns
);
```

**Frontend Logic** (from Agent 1 findings):
```javascript
// Example data structure in frontend:
{
  "Created By": "user_123",
  "Proposal Updates": ["Email", "SMS"],     // Array of enabled channels
  "Message Forwarding": ["Email"],          // Email only
  "Promotional": []                         // All disabled
}
```

### Why This Breaks

```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTION: Disable SMS for Proposal Updates             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend Updates:                                          │
│  notificationsettingsos_lists_                             │
│                                                             │
│  UPDATE notificationsettingsos_lists_                      │
│  SET "Proposal Updates" = ARRAY['Email']  -- Remove 'SMS' │
│  WHERE "Created By" = 'user_123'                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │  ✅ SUCCESS - Frontend shows disabled
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Later: Proposal Created                                    │
│  Backend Edge Function Triggered                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend Queries:                                           │
│  notification_preferences table                             │
│                                                             │
│  SELECT proposal_updates_sms                                │
│  FROM notification_preferences                              │
│  WHERE user_id = 'user_123'                                │
│                                                             │
│  Result: No row found (table doesn't exist or empty)       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  shouldSendSms() returns FALSE                              │
│  Reason: "No preferences found (privacy-first default)"    │
│                                                             │
│  ⚠️ BUT USER EXPECTED SMS TO BE DISABLED!                 │
│  ⚠️ BACKEND SKIPS SMS FOR WRONG REASON!                   │
└─────────────────────────────────────────────────────────────┘
```

**Net Effect**: User preferences are **IGNORED** because the backend reads from a table the frontend never writes to.

---

## 3. Masking & Forwarding Service Status

### Current Active Codebase: NO MASKING

Searched for masking/forwarding logic in all Edge Functions:
- ✅ `send-sms/index.ts` - Direct Twilio proxy (NO masking)
- ✅ `send-email/index.ts` - Direct SendGrid proxy (NO masking)
- ✅ `messagingHelpers.ts` - In-app messaging (NO phone masking)
- ✅ `vmMessagingHelpers.ts` - Virtual meeting notifications (NO masking)

**Evidence - Direct SMS Send** (`send-sms/index.ts:98-147`):
```typescript
const handleSend = async (payload: SendSmsPayload): Promise<SendSmsResult> => {
  // Validate phone formats
  validatePhoneNumber(payload.to, 'payload.to');
  validatePhoneNumber(payload.from, 'payload.from');

  // Get Twilio credentials
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

  // Build request body (URL-encoded)
  const requestBody = buildTwilioRequestBody({
    toPhone: payload.to,      // ACTUAL recipient phone
    fromPhone: payload.from,  // ACTUAL sender phone (no masking)
    body: payload.body,
  });

  // Send to Twilio
  const response = await sendSms(accountSid, authToken, requestBody);
  // ...
};
```

**No Proxy Number Pool**: Unlike Agent 2's backup service which used `+14155692985` as a shared proxy, the current system sends SMS **directly** from sender to recipient.

### Decommissioned Masking Service (Per Agent 2)

**Location**: `c:\Users\Split Lease\Downloads\backup021326\`
**Architecture**: Flask app (PythonAnywhere) → Twilio webhooks → Bubble.io workflows
**Status**: Removed from active codebase after low adoption (118 SMS over 5 months)

**Key Differences**:
| Feature | Decommissioned Service | Current Active Code |
|---------|------------------------|---------------------|
| Phone Masking | ✅ Single proxy: `+14155692985` | ❌ Direct sends |
| User Pairing | ✅ SQLite `user_pairs` table | ❌ Not implemented |
| SMS Interception | ✅ Twilio webhook to PythonAnywhere | ❌ Not implemented |
| Message Routing | ✅ Forward to Bubble.io workflow | ✅ Direct in-app messages |
| Database | ✅ SQLite on PythonAnywhere | ✅ Supabase PostgreSQL |

---

## 4. Notification Logic Flow (Current Implementation)

### Main Notification Sender (`notificationSender.ts:270-398`)

```
┌─────────────────────────────────────────────────────────────┐
│  sendNotification({                                         │
│    supabase,                                                │
│    userId,                                                  │
│    category,  // 'proposal_updates', 'message_forwarding'  │
│    email?: { templateId, toEmail, variables },             │
│    sms?: { toPhone, body },                                │
│    forceOverride?: boolean,                                │
│    adminUserId?: string                                    │
│  })                                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Generate correlation ID (UUID)                          │
│     correlationId = crypto.randomUUID()                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Fetch User Preferences                                  │
│     const prefs = await getNotificationPreferences(         │
│       supabase, userId                                      │
│     );                                                      │
│                                                             │
│     Query: SELECT * FROM notification_preferences          │
│            WHERE user_id = $userId                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Check Email Permission                                  │
│     if (email) {                                            │
│       const emailAllowed = forceOverride ||                │
│                           shouldSendEmail(prefs, category); │
│                                                             │
│       if (!emailAllowed) {                                 │
│         // Log skip reason and exit                        │
│       } else {                                             │
│         // Send email via send-email Edge Function        │
│       }                                                     │
│     }                                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Check SMS Permission                                    │
│     if (sms) {                                              │
│       const smsAllowed = forceOverride ||                  │
│                         shouldSendSms(prefs, category);    │
│                                                             │
│       if (!smsAllowed) {                                   │
│         // Log skip reason and exit                        │
│       } else {                                             │
│         // Send SMS via send-sms Edge Function            │
│       }                                                     │
│     }                                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Log to Audit Table                                      │
│     INSERT INTO notification_audit (                        │
│       user_id, category, channel, action,                  │
│       skip_reason, admin_override, admin_user_id,          │
│       template_id, recipient_email, recipient_phone,       │
│       edge_function, correlation_id                        │
│     )                                                       │
│                                                             │
│     Logs BOTH sent AND skipped notifications              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Return Result                                           │
│     {                                                       │
│       emailSent: boolean,                                  │
│       emailSkipped: boolean,                               │
│       emailSkipReason?: string,                            │
│       smsSent: boolean,                                    │
│       smsSkipped: boolean,                                 │
│       smsSkipReason?: string,                              │
│       correlationId: string                                │
│     }                                                       │
└─────────────────────────────────────────────────────────────┘
```

### Example Usage (from `proposal/actions/create_suggested.ts:698-745`)

**❌ INCORRECT PATTERN (Old System)**:
```typescript
// Lines 701-720 - Uses legacy fire-and-forget helpers
const guestPrefs = await getNotificationPreferences(supabase, input.guestId);

if (shouldSendEmail(guestPrefs, 'proposal_updates')) {
  sendProposalEmail({  // ❌ NO audit logging, NO error handling
    templateId: EMAIL_TEMPLATES.GUEST_PROPOSAL_SUBMITTED,
    toEmail: guestData.email,
    toName: guestFirstName,
    variables: { ... }
  });
}

if (shouldSendSms(guestPrefs, 'proposal_updates')) {
  sendProposalSms({  // ❌ NO audit logging, NO error handling
    to: phoneNumber,
    body: `Your proposal for ${resolvedListingName} has been submitted!`
  });
}
```

**✅ RECOMMENDED PATTERN (New System)**:
```typescript
// Should use notificationSender.sendNotification()
const result = await sendNotification({
  supabase,
  userId: input.guestId,
  category: 'proposal_updates',
  edgeFunction: 'proposal/create_suggested',
  correlationId: crypto.randomUUID(),
  email: {
    templateId: EMAIL_TEMPLATES.GUEST_PROPOSAL_SUBMITTED,
    toEmail: guestData.email,
    toName: guestFirstName,
    variables: { ... }
  },
  sms: {
    toPhone: phoneNumber,
    body: `Your proposal for ${resolvedListingName} has been submitted!`
  }
});

// Result includes full audit trail:
// - emailSent, emailSkipped, emailSkipReason
// - smsSent, smsSkipped, smsSkipReason
// - correlationId for tracking
```

---

## 5. TODO Comments Found

### Only TODO: Error Reporting (`_shared/errorReporting.ts:69`)
```typescript
// TODO: Add Sentry integration when DSN is configured
```

**Context**: The error reporting module has a placeholder for Sentry integration but is not yet configured.

**Current Behavior**: Errors are logged to console and Slack webhooks only.

**No Other TODOs**: Comprehensive search across all `_shared/` files found NO other TODO comments related to notifications.

---

## 6. Signup Handler Analysis

### Notification Preferences Initialization (`auth-user/handlers/signup.ts:286-297`)

**✅ CORRECTLY IMPLEMENTED**:
```typescript
// Lines 286-297
console.log('[signup] Creating default notification preferences...');

const prefsResult = await createDefaultNotificationPreferences(
  supabaseAdmin,
  generatedUserId
);

if (prefsResult.success) {
  console.log('[signup] ✅ Notification preferences created (opt-out model)');
} else {
  // Non-blocking - user can configure preferences later via UI
  console.warn('[signup] ⚠️ Failed to create notification preferences:', prefsResult.error);
}
```

**Good Practice**:
- Preferences created during signup
- Uses opt-out model (all enabled except promotional SMS)
- Non-blocking: signup succeeds even if preferences creation fails
- Clear logging for debugging

**Verification** (Lines 303-305):
```typescript
console.log(`[signup]    notification_preferences created: ${prefsResult.success ? 'yes' : 'no'}`);
```

---

## 7. Edge Function Usage Patterns

### Functions Using NEW System (✅ Recommended)
- `auth-user/handlers/signup.ts` - Creates default preferences during signup

### Functions Using OLD System (❌ Needs Migration)
- `proposal/actions/create_suggested.ts:698-745` - Uses `sendProposalEmail()` and `sendProposalSms()`
- `vmMessagingHelpers.ts:109-169` - Uses direct `sendEmail()` wrapper
- `vmMessagingHelpers.ts:174-220` - Uses direct `sendSms()` with Twilio

**Migration Required**: These functions should be updated to use `notificationSender.sendNotification()` for:
- Full audit trail
- Consistent error handling
- Admin override support
- Correlation ID tracking

---

## 8. Virtual Meeting Notifications (Special Case)

### VM Messaging Helpers (`_shared/vmMessagingHelpers.ts`)

**Preference Checking** (Lines 340-367):
```typescript
// Fetch notification preferences for both users
const [guestPrefs, hostPrefs] = await Promise.all([
  getNotificationPreferences(supabase, context.guestUserId),
  getNotificationPreferences(supabase, context.hostUserId),
]);

// Email to GUEST
if (context.notifyGuestEmail && context.guestEmail) {
  // Check preference table for virtual_meetings category
  if (!checkEmailPreference(guestPrefs, 'virtual_meetings')) {
    console.log('[vmMessaging] Guest email SKIPPED (preference: virtual_meetings disabled)');
  } else {
    result.guestEmailSent = await sendEmail({ ... });
  }
}
```

**Implementation Notes**:
- ✅ Correctly checks `notification_preferences` table
- ✅ Uses `virtual_meetings` category
- ❌ Uses custom `sendEmail()` wrapper instead of `notificationSender`
- ❌ Does NOT log to `notification_audit` table
- ✅ Correctly handles both SMS and Email channels

**Twilio Integration** (Lines 174-220):
```typescript
async function sendSms(params: { toPhone: string; messageBody: string }): Promise<boolean> {
  // Validate phone format (E.164)
  if (!params.toPhone || !/^\+[1-9]\d{1,14}$/.test(params.toPhone)) {
    return false;
  }

  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromPhone = Deno.env.get('TWILIO_FROM_PHONE');

  // Direct Twilio API call (no masking)
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const authHeader = 'Basic ' + btoa(`${twilioSid}:${twilioToken}`);

  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: params.toPhone,      // Direct recipient (no masking)
      From: fromPhone,         // Direct sender (no masking)
      Body: params.messageBody,
    }).toString(),
  });

  return response.status === 201;
}
```

**Key Observation**: Virtual meeting notifications bypass `notificationSender` and make **direct Twilio API calls**.

---

## 9. Critical Gaps Summary

### 🔴 CRITICAL: Schema Mismatch (Confirmed by Backend)
**Status**: Same issue as Agent 1 findings
**Impact**: User preferences completely ignored
**Evidence**:
- Backend queries `notification_preferences` (boolean schema)
- Frontend writes to `notificationsettingsos_lists_` (array schema)
- No sync mechanism between tables

**Backend Confirmation**:
```typescript
// notificationHelpers.ts:103
await supabase.from('notification_preferences').select('*')...

// Expected row structure:
{
  user_id: "user_123",
  proposal_updates_sms: true,
  proposal_updates_email: true,
  // ... 20 more boolean columns
}

// What frontend actually provides (different table):
{
  "Created By": "user_123",
  "Proposal Updates": ["Email", "SMS"],  // Array, not booleans
  // ... 10 more array columns
}
```

### 🟡 MAJOR: Inconsistent Notification System Usage
**Status**: Dual systems coexist
**Impact**: Incomplete audit trail, inconsistent behavior
**Evidence**:
- NEW: `notificationSender.sendNotification()` - Full features
- OLD: `sendProposalEmail()` / `sendProposalSms()` - Fire-and-forget

**Files Using Old System**:
1. `proposal/actions/create_suggested.ts:698-745`
2. `vmMessagingHelpers.ts:109-220`

**Migration Needed**: ~2 files need updates

### 🟢 MINOR: No Masking Implementation
**Status**: Intentional design decision
**Impact**: None (service decommissioned)
**Evidence**: Agent 2 documented full masking service in backup, confirmed removed from active codebase

---

## 10. File References

### Notification Core Files
- `supabase/functions/_shared/notificationSender.ts` (561 lines) - Main notification system
- `supabase/functions/_shared/notificationHelpers.ts` (290 lines) - Legacy helpers
- `supabase/functions/_shared/vmMessagingHelpers.ts` (626 lines) - Virtual meeting notifications

### Communication Services
- `supabase/functions/send-email/index.ts` (166 lines) - SendGrid proxy
- `supabase/functions/send-sms/index.ts` (237 lines) - Twilio proxy

### Edge Functions Using Notifications
- `supabase/functions/auth-user/handlers/signup.ts` (412 lines)
- `supabase/functions/proposal/actions/create_suggested.ts` (869 lines)

### Database Schema (Expected)
- ⚠️ **MISSING**: Migration file for `notification_preferences` table
- ✅ **EXISTS**: Test schema in `__tests__/notification-migrations.test.sql`

---

## 11. Recommendations

### Immediate Actions

1. **VERIFY TABLE EXISTS**
   ```sql
   -- Use Supabase MCP to check:
   SELECT table_name
   FROM information_schema.tables
   WHERE table_name = 'notification_preferences';
   ```

2. **FIX SCHEMA MISMATCH** (Aligns with Agent 1 recommendation)
   - **Option A**: Migrate frontend to use `notification_preferences` (RECOMMENDED)
   - **Option B**: Migrate backend to use `notificationsettingsos_lists_`
   - **Option C**: Create sync trigger (NOT RECOMMENDED)

3. **MIGRATE TO NEW NOTIFICATION SYSTEM**
   - Update `proposal/actions/create_suggested.ts` to use `sendNotification()`
   - Update `vmMessagingHelpers.ts` to use `sendNotification()`
   - Deprecate `sendProposalEmail()` and `sendProposalSms()`

### Long-Term Actions

4. **CREATE MIGRATION FILE**
   - If table missing, create migration from test schema
   - Deploy to production
   - Backfill existing users with default preferences

5. **ADD DELIVERY WEBHOOKS**
   - Implement SendGrid delivery status webhooks
   - Implement Twilio delivery status webhooks
   - Add `delivery_status` column to `notification_audit`

6. **IMPLEMENT RATE LIMITING**
   - Add per-category rate limits
   - Implement digest mode for high-frequency events
   - Add quiet hours preference

---

## 12. Conclusion

The backend notification system is **architecturally sound** but suffers from the **critical schema mismatch** identified by Agent 1. The backend code is well-designed with:

✅ Comprehensive preference checking
✅ Full audit logging
✅ Admin override capability
✅ Privacy-first defaults
✅ Correlation ID tracking

However, it **cannot function properly** until the frontend-backend schema mismatch is resolved.

**No masking service exists** in the active codebase (confirmed removed after low adoption).

**Next Step**: Align with Agent 1 findings to implement unified schema solution across frontend and backend.

---

**Report Complete**
**Cross-Reference**: See `AGENT_1_FINDINGS.md` for frontend analysis
**Cross-Reference**: See `AGENT_2_FINDINGS.md` for masking service documentation
