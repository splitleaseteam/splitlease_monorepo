# AGENT 1 FINDINGS: Standard Messaging & Notification Flow Analysis

**Date**: 2026-02-13
**Analyst**: Claude Code (Agent 1)
**Scope**: Frontend notification settings, backend notification logic, database schema analysis

---

## Executive Summary

This analysis reveals a **CRITICAL ARCHITECTURAL MISMATCH** between the frontend and backend notification systems. The frontend manages user preferences in the legacy Bubble table `notificationsettingsos_lists_` using array-based columns, while the backend notification system expects preferences in a new `notification_preferences` table with boolean columns. **These two systems are completely disconnected.**

---

## 1. Frontend: Notification Settings Page

### Location
- **Component**: `app/src/islands/shared/NotificationSettingsIsland/NotificationSettingsIsland.jsx`
- **Hook**: `app/src/islands/shared/NotificationSettingsIsland/useNotificationSettings.js`
- **Categories Config**: `app/src/islands/shared/NotificationSettingsIsland/notificationCategories.js`
- **Modal Wrapper**: `app/src/islands/modals/NotificationSettingsModal.jsx`
- **Usage**: Embedded in `AccountProfilePage.jsx`

### User Interface
Users can toggle notification preferences for **11 categories** across **2 channels** (SMS and Email):

| Category ID | Display Label | Description |
|-------------|---------------|-------------|
| `message_forwarding` | Message Forwarding | Receive forwarded messages via your preferred channel |
| `payment_reminders` | Payment Reminders | Billing and payment notifications |
| `promotional` | Promotional | Marketing and promotional content |
| `reservation_updates` | Reservation Updates | Changes to your bookings |
| `lease_requests` | Lease Requests | Lease-related inquiries |
| `proposal_updates` | Proposal Updates | Changes to proposals |
| `checkin_checkout` | Check-in/Check-out Reminders | Guest arrival and departure alerts |
| `reviews` | Reviews | Rating and feedback notifications |
| `tips_insights` | Tips / Market Insights | Educational content and market analysis |
| `account_assistance` | Account Access Assistance | Help with account login and permissions |
| `virtual_meetings` | Virtual Meetings | Video and online meeting notifications |

### Database Storage (Frontend)
- **Table**: `notificationsettingsos_lists_`
- **Schema**: Legacy Bubble table with **array-based columns**
- **User Identifier Column**: `Created By` (matches user ID)
- **Data Format**: Each category stores an **array of enabled channels**

**Example Data Structure**:
```javascript
{
  "Created By": "user_123",
  "Message Forwarding": ["Email", "SMS"],          // Both enabled
  "Payment Reminders": ["Email", "SMS"],           // Both enabled
  "Promotional": ["Email"],                        // Email only
  "Reservation Updates": ["Email", "SMS"],         // Both enabled
  // ... 7 more categories
}
```

### Default Preferences (Frontend)
```javascript
// From notificationCategories.js getDefaultPreferences()
{
  "Message Forwarding": ["Email", "SMS"],
  "Payment Reminders": ["Email", "SMS"],
  "Promotional": ["Email"],                    // SMS opt-in required
  "Reservation Updates": ["Email", "SMS"],
  "Lease Requests": ["Email", "SMS"],
  "Proposal Updates": ["Email", "SMS"],
  "Check In/Out Reminders": ["Email", "SMS"],
  "Reviews": ["Email", "SMS"],
  "Tips/Insights": ["Email", "SMS"],
  "Login/Signup Assistance": ["Email", "SMS"],
  "Virtual Meetings": ["Email", "SMS"]
}
```

### Optimistic Update Pattern
The frontend uses optimistic updates with automatic rollback:
1. User clicks toggle
2. UI updates immediately (optimistic)
3. Supabase update request sent
4. On success: Show success toast
5. On failure: Rollback to previous value, show error toast

---

## 2. Backend: Notification Logic

### Core System Architecture

#### Notification Sender (`supabase/functions/_shared/notificationSender.ts`)
**Purpose**: High-level notification orchestration with preference checking and audit logging

**Key Functions**:
- `sendNotification(params)` - Main notification dispatcher
- `sendEmailNotification()` - Email-only convenience wrapper
- `sendSmsNotification()` - SMS-only convenience wrapper
- `wouldSendNotification()` - Dry-run preference check
- `createDefaultNotificationPreferences()` - Initialize new user

**Flow**:
```
sendNotification()
    │
    ├─→ Fetch user preferences from notification_preferences table
    │
    ├─→ Check if category/channel enabled (or forceOverride)
    │
    ├─→ Log decision to notification_audit table
    │       ├─ Action: 'sent' or 'skipped'
    │       ├─ Correlation ID for tracking
    │       └─ Admin override flag (if applicable)
    │
    └─→ Send via appropriate channel (email/SMS)
        ├─ Email: Call send-email Edge Function
        └─ SMS: Call send-sms Edge Function
```

#### Notification Helpers (`supabase/functions/_shared/notificationHelpers.ts`)
**Purpose**: Lower-level utilities for preference checking

**Key Functions**:
- `getNotificationPreferences(supabase, userId)` - Fetch user preferences
- `shouldSendEmail(prefs, category)` - Check if email allowed
- `shouldSendSms(prefs, category)` - Check if SMS allowed
- `sendProposalEmail(params)` - Legacy fire-and-forget email sender
- `sendProposalSms(params)` - Legacy fire-and-forget SMS sender

**Privacy-First Design**:
- Returns `null` if no preferences exist
- `shouldSendEmail()` returns `false` if `prefs === null`
- `shouldSendSms()` returns `false` if `prefs === null`
- **Default behavior: DO NOT SEND if preferences missing**

#### Email Sending (`supabase/functions/send-email/index.ts`)
**Action Routing**: `{ action: "send", payload: { ... } }`

**Payload Structure**:
```typescript
{
  template_id: string,
  to_email: string,
  to_name?: string,
  from_email?: string,  // Default: 'no-reply@split.lease'
  from_name?: string,   // Default: 'Split Lease'
  subject?: string,
  variables: Record<string, string>,
  bcc_emails?: string[]
}
```

**Public Templates** (no auth required):
- `1757433099447x202755280527849400` - Magic Login Link
- `1560447575939x331870423481483500` - Welcome emails, internal notifications

**Email Provider**: SendGrid (via `SENDGRID_API_KEY` and `SENDGRID_EMAIL_ENDPOINT`)

#### SMS Sending (`supabase/functions/send-sms/index.ts`)
**Action Routing**: `{ action: "send", payload: { ... } }`

**Payload Structure**:
```typescript
{
  to: string,      // E.164 format: +15551234567
  from: string,    // Split Lease number: +14155692985
  body: string
}
```

**Public From Numbers** (no auth required):
- `+14155692985` - Magic link SMS

**SMS Provider**: Twilio (via `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`)

---

## 3. Notification Logic Decision Tree

```
┌─────────────────────────────────────────────────────────┐
│  Event Trigger (e.g., proposal created, message sent)  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ Call sendNotification()     │
        │ with:                       │
        │  - userId                   │
        │  - category                 │
        │  - email params (optional)  │
        │  - sms params (optional)    │
        │  - forceOverride (default:  │
        │    false)                   │
        └──────────┬──────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ Fetch notification_          │
        │ preferences by user_id       │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ Preferences exist?           │
        └──┬──────────────────────┬────┘
           │ YES                  │ NO
           │                      │
           ▼                      ▼
    ┌─────────────────┐    ┌──────────────────────┐
    │ Check category  │    │ Return skipped       │
    │ + channel flags │    │ (privacy-first       │
    │                 │    │  default)            │
    │ Example:        │    │                      │
    │ - category:     │    │ Skip Reason:         │
    │   proposal_     │    │ "No preferences      │
    │   updates       │    │  found"              │
    │ - channel: sms  │    └──────────────────────┘
    │                 │
    │ → proposal_     │
    │   updates_sms   │
    │   = true/false  │
    └────┬────────────┘
         │
         ▼
    ┌─────────────────────────┐
    │ Enabled OR              │
    │ forceOverride?          │
    └───┬──────────────┬──────┘
        │ YES          │ NO
        │              │
        ▼              ▼
┌───────────────┐  ┌────────────────────┐
│ Send via      │  │ Skip & log         │
│ channel       │  │                    │
│               │  │ Skip Reason:       │
│ - Email →     │  │ "User opted out"   │
│   send-email  │  │                    │
│   function    │  └────────────────────┘
│               │
│ - SMS →       │
│   send-sms    │
│   function    │
└───────────────┘
         │
         ▼
┌───────────────────────────┐
│ Log to notification_audit │
│                           │
│ - user_id                 │
│ - category                │
│ - channel                 │
│ - action: 'sent'          │
│ - admin_override (if used)│
│ - correlation_id          │
│ - timestamp               │
└───────────────────────────┘
```

### Admin Override Mechanism
```javascript
sendNotification({
  supabase,
  userId: 'user_123',
  category: 'proposal_updates',
  email: { /* ... */ },
  forceOverride: true,        // BYPASS user preferences
  adminUserId: 'admin_456'     // Required for compliance logging
})
```

**Override Behavior**:
- Notification sent **regardless of user preferences**
- Logged to `notification_audit` with `admin_override = true`
- Includes `admin_user_id` for accountability
- Used for compliance-required communications

---

## 4. Database Schema

### ⚠️ CRITICAL MISMATCH DETECTED ⚠️

**Problem**: The frontend and backend use **DIFFERENT TABLES** with **INCOMPATIBLE SCHEMAS**.

#### Frontend Table: `notificationsettingsos_lists_`
**Type**: Legacy Bubble.io table
**Schema**: Array-based columns

| Column Name | Type | Description |
|-------------|------|-------------|
| `id` | UUID | Primary key |
| `Created By` | TEXT | User ID (foreign key to user.id) |
| `Message Forwarding` | TEXT[] | Array: `['Email', 'SMS', 'In-App Message']` |
| `Payment Reminders` | TEXT[] | Array: `['Email', 'SMS', 'In-App Message']` |
| `Promotional` | TEXT[] | Array: `['Email', 'SMS', 'In-App Message']` |
| `Reservation Updates` | TEXT[] | Array: `['Email', 'SMS', 'In-App Message']` |
| `Lease Requests` | TEXT[] | Array: `['Email', 'SMS', 'In-App Message']` |
| `Proposal Updates` | TEXT[] | Array: `['Email', 'SMS', 'In-App Message']` |
| `Check In/Out Reminders` | TEXT[] | Array: `['Email', 'SMS', 'In-App Message']` |
| `Reviews` | TEXT[] | Array: `['Email', 'SMS', 'In-App Message']` |
| `Tips/Insights` | TEXT[] | Array: `['Email', 'SMS', 'In-App Message']` |
| `Login/Signup Assistance` | TEXT[] | Array: `['Email', 'SMS', 'In-App Message']` |
| `Virtual Meetings` | TEXT[] | Array: `['Email', 'SMS', 'In-App Message']` |
| `created_at` | TIMESTAMPTZ | Row creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Array Values**: `'Email'`, `'SMS'`, `'In-App Message'` (enum-like strings)

#### Backend Table: `notification_preferences`
**Type**: New Supabase table (expected by backend code)
**Schema**: Boolean columns (22 total: 11 categories × 2 channels)

| Column Name | Type | Default | Description |
|-------------|------|---------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | TEXT | NOT NULL | User ID (foreign key) |
| `message_forwarding_sms` | BOOLEAN | `true` | SMS enabled for message forwarding |
| `message_forwarding_email` | BOOLEAN | `true` | Email enabled for message forwarding |
| `payment_reminders_sms` | BOOLEAN | `true` | SMS enabled for payment reminders |
| `payment_reminders_email` | BOOLEAN | `true` | Email enabled for payment reminders |
| `promotional_sms` | BOOLEAN | `false` | SMS enabled for promotional (opt-in) |
| `promotional_email` | BOOLEAN | `true` | Email enabled for promotional |
| `reservation_updates_sms` | BOOLEAN | `true` | SMS enabled for reservation updates |
| `reservation_updates_email` | BOOLEAN | `true` | Email enabled for reservation updates |
| `lease_requests_sms` | BOOLEAN | `true` | SMS enabled for lease requests |
| `lease_requests_email` | BOOLEAN | `true` | Email enabled for lease requests |
| `proposal_updates_sms` | BOOLEAN | `true` | SMS enabled for proposal updates |
| `proposal_updates_email` | BOOLEAN | `true` | Email enabled for proposal updates |
| `checkin_checkout_sms` | BOOLEAN | `true` | SMS enabled for check-in/out |
| `checkin_checkout_email` | BOOLEAN | `true` | Email enabled for check-in/out |
| `reviews_sms` | BOOLEAN | `true` | SMS enabled for reviews |
| `reviews_email` | BOOLEAN | `true` | Email enabled for reviews |
| `tips_insights_sms` | BOOLEAN | `true` | SMS enabled for tips/insights |
| `tips_insights_email` | BOOLEAN | `true` | Email enabled for tips/insights |
| `account_assistance_sms` | BOOLEAN | `true` | SMS enabled for account assistance |
| `account_assistance_email` | BOOLEAN | `true` | Email enabled for account assistance |
| `virtual_meetings_sms` | BOOLEAN | `true` | SMS enabled for virtual meetings |
| `virtual_meetings_email` | BOOLEAN | `true` | Email enabled for virtual meetings |
| `created_at` | TIMESTAMPTZ | NOW() | Row creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOW() | Last update timestamp |

**Constraints**:
- `user_id` is UNIQUE (one preferences row per user)
- RLS enabled: users can only view/update their own preferences

#### Audit Table: `notification_audit`
**Purpose**: Compliance and debugging log for all notification decisions

| Column Name | Type | Description |
|-------------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Target user ID |
| `category` | ENUM | Notification category (see enum below) |
| `channel` | ENUM | `'email'` or `'sms'` |
| `action` | ENUM | `'sent'` or `'skipped'` |
| `skip_reason` | TEXT | Reason for skipping (if action = 'skipped') |
| `admin_override` | BOOLEAN | Whether admin forced this notification |
| `admin_user_id` | TEXT | Admin who triggered override (if applicable) |
| `template_id` | TEXT | Email template ID (if email) |
| `recipient_email` | TEXT | Email address (if email) |
| `recipient_phone` | TEXT | Phone number (if SMS) |
| `edge_function` | TEXT | Source function name (e.g., 'proposal/create') |
| `correlation_id` | UUID | Groups related notifications |
| `created_at` | TIMESTAMPTZ | Log timestamp |

**Indexes**:
- `idx_notification_audit_user_id` on `user_id`
- `idx_notification_audit_created_at` on `created_at`

**RLS**: Enabled - users can view their own audit records

#### Enum: `notification_category`
```sql
CREATE TYPE notification_category AS ENUM (
  'proposal_updates',
  'message_forwarding',
  'payment_reminders',
  'promotional',
  'reservation_updates',
  'lease_requests',
  'checkin_checkout',
  'reviews',
  'tips_insights',
  'account_assistance',
  'virtual_meetings'
);
```

---

## 5. Missing Features & Critical Gaps

### 🔴 CRITICAL GAP 1: Frontend/Backend Schema Mismatch
**Severity**: CRITICAL
**Impact**: **USER PREFERENCES ARE NOT RESPECTED BY THE BACKEND**

**Description**:
- Frontend writes to `notificationsettingsos_lists_` (array-based schema)
- Backend reads from `notification_preferences` (boolean-based schema)
- **These tables are NEVER synchronized**
- Users who update their notification settings in the UI **will still receive notifications** they opted out of

**Evidence**:
```javascript
// Frontend (useNotificationSettings.js:17)
const TABLE_NAME = 'notificationsettingsos_lists_';

// Backend (notificationHelpers.ts:103)
await supabase.from('notification_preferences').select('*')...
```

**Consequence**:
- **Privacy violation**: Users cannot actually control their notification preferences
- **Compliance risk**: GDPR/CCPA require honoring user opt-out preferences
- **User trust**: Settings UI is non-functional (placebo effect)

**Required Fix**:
1. **Option A**: Migrate frontend to use `notification_preferences` table
   - Update `useNotificationSettings.js` to query boolean columns
   - Transform UI toggles to boolean updates
   - Migrate existing data from old table to new table

2. **Option B**: Migrate backend to use `notificationsettingsos_lists_` table
   - Update `notificationHelpers.ts` to check array membership
   - Update `notificationSender.ts` to use array-based logic

3. **Option C**: Create sync mechanism
   - Database trigger to keep both tables in sync
   - NOT RECOMMENDED (adds complexity, potential for drift)

### 🔴 CRITICAL GAP 2: Missing Migration File
**Severity**: CRITICAL
**Impact**: `notification_preferences` table may not exist in production

**Description**:
- Backend code expects `notification_preferences` table
- Migration file to create this table **NOT FOUND** in `supabase/migrations/`
- Test file exists (`__tests__/notification-migrations.test.sql`) but actual migration missing
- Table may only exist in test/dev environments

**Evidence**:
```bash
# Search result from migrations directory
$ grep -r "CREATE TABLE.*notification_preferences" supabase/migrations/
# (no results)
```

**Consequence**:
- Backend notification functions will **FAIL** if table doesn't exist
- Supabase queries will throw `relation does not exist` errors
- All notifications will be skipped (privacy-first default)

**Required Fix**:
1. Verify if table exists in production database via Supabase MCP
2. If missing: Create migration file with table schema from test file
3. Deploy migration to production
4. Backfill existing users with default preferences

### 🟡 MAJOR GAP 3: No Preference Initialization on Signup
**Severity**: MAJOR
**Impact**: New users have no preferences record, receive NO notifications

**Description**:
- Backend defaults to "privacy-first" (skip notifications if prefs don't exist)
- No automatic preference creation during user signup
- Function `createDefaultNotificationPreferences()` exists but is **NEVER CALLED**

**Evidence**:
```typescript
// notificationSender.ts:534 - Function exists but unused
export async function createDefaultNotificationPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }>
```

**Consequence**:
- New users receive **ZERO notifications** until they manually configure settings
- Critical notifications (proposal updates, payment reminders) are missed
- Users unaware they need to enable notifications

**Required Fix**:
1. Call `createDefaultNotificationPreferences()` in signup handler
2. Add to `supabase/functions/auth-user/handlers/signup.ts`
3. Ensure all new users get opt-out defaults (all enabled except promotional SMS)

### 🟡 MAJOR GAP 4: Legacy Fire-and-Forget Functions Still in Use
**Severity**: MAJOR
**Impact**: Some notifications bypass preference checking

**Description**:
- Two notification systems coexist:
  - **NEW**: `notificationSender.ts` with preference checking and audit logging
  - **OLD**: `notificationHelpers.ts` fire-and-forget functions without preference checks

**Evidence**:
```typescript
// Old system (notificationHelpers.ts:150-196)
export function sendProposalEmail(params: SendEmailParams): Promise<void>
export function sendProposalSms(params: SendSmsParams): Promise<void>
// → No preference checking, no audit logging

// New system (notificationSender.ts:270-398)
export async function sendNotification(params: SendNotificationParams)
// → Full preference checking and audit logging
```

**Consequence**:
- Inconsistent behavior: Some workflows respect preferences, others don't
- Audit trail incomplete: Fire-and-forget sends not logged
- Users may receive opted-out notifications from legacy code paths

**Required Fix**:
1. Audit all Edge Functions using `sendProposalEmail()` and `sendProposalSms()`
2. Migrate to `sendNotification()` from `notificationSender.ts`
3. Deprecate legacy functions after migration complete

### 🟡 MAJOR GAP 5: No In-App Message Channel Implementation
**Severity**: MAJOR
**Impact**: Frontend offers toggle for unsupported feature

**Description**:
- Frontend enum includes `'In-App Message'` as a channel option
- Backend only supports `'email'` and `'sms'` channels
- No in-app notification system exists

**Evidence**:
```javascript
// Frontend (notificationCategories.js:12)
export const NOTIFICATION_CHANNELS = {
  EMAIL: 'Email',
  SMS: 'SMS',
  IN_APP: 'In-App Message'  // ← Not implemented
};

// Backend (notificationSender.ts:84)
channel: 'email' | 'sms';  // ← Only two channels
```

**Consequence**:
- Users can "enable" in-app messages but they never arrive
- False expectations about feature availability
- UI toggle has no effect

**Required Fix**:
1. Remove `IN_APP` from frontend enum until feature is implemented
2. OR implement in-app notification system:
   - Create `notification_inbox` table
   - Add real-time subscription for new notifications
   - Build notification bell UI component

### 🟢 MINOR GAP 6: Hardcoded Template IDs
**Severity**: MINOR
**Impact**: Email templates tightly coupled to code

**Description**:
- Email template IDs are hardcoded constants
- No admin UI to manage or preview templates
- Template changes require code deployment

**Evidence**:
```typescript
// notificationHelpers.ts:265-273
export const EMAIL_TEMPLATES = {
  GUEST_PROPOSAL_SUBMITTED: '1757429600000x000000000000000001',
  HOST_PROPOSAL_NIGHTLY: '1757429600000x000000000000000002',
  HOST_PROPOSAL_WEEKLY: '1757429600000x000000000000000003',
  HOST_PROPOSAL_MONTHLY: '1757429600000x000000000000000004',
} as const;
```

**Consequence**:
- Template management requires developer intervention
- No way for non-technical staff to update email content
- Risk of template ID mismatch if SendGrid templates are recreated

**Recommended Enhancement**:
1. Move template IDs to database table
2. Create admin UI for template management
3. Add template preview capability

### 🟢 MINOR GAP 7: No Notification Rate Limiting
**Severity**: MINOR
**Impact**: Users could be spammed by high-frequency events

**Description**:
- No rate limiting on notification sends
- Rapid events (e.g., multiple messages in thread) could trigger notification storm
- No batching or digest mechanism

**Consequence**:
- Poor user experience from too many notifications
- Increased SMS/email costs
- Users may disable all notifications to avoid spam

**Recommended Enhancement**:
1. Add rate limiting per category (e.g., max 1 message_forwarding SMS per hour)
2. Implement digest mode (batch multiple events into single notification)
3. Add "quiet hours" preference (no notifications 10pm-8am local time)

### 🟢 MINOR GAP 8: No Unsubscribe Link in Emails
**Severity**: MINOR
**Impact**: CAN-SPAM Act compliance risk for promotional emails

**Description**:
- Email templates do not include unsubscribe links
- Users must log in to account settings to opt out
- Required by law for promotional emails

**Consequence**:
- Legal compliance risk (CAN-SPAM requires one-click unsubscribe)
- Poor user experience (must navigate to settings)
- Risk of spam complaints

**Recommended Enhancement**:
1. Generate unique unsubscribe tokens for each email
2. Add unsubscribe link to all email templates
3. Create public unsubscribe handler (no login required)
4. Update `notification_preferences` when link clicked

### 🟢 MINOR GAP 9: Missing Notification Delivery Status Tracking
**Severity**: MINOR
**Impact**: Cannot verify if notifications were actually delivered

**Description**:
- Audit log records send attempts but not delivery status
- No webhook integration with SendGrid or Twilio for delivery confirmation
- No retry mechanism for failed sends

**Consequence**:
- Cannot debug why users claim they didn't receive notification
- No metrics on notification deliverability
- Failed sends not retried

**Recommended Enhancement**:
1. Add `delivery_status` column to `notification_audit` table
2. Implement webhooks for SendGrid (delivered/bounced/opened)
3. Implement webhooks for Twilio (delivered/failed/undelivered)
4. Add retry queue for failed deliveries

---

## 6. Example: How a Message Creates a Notification

**Scenario**: Guest sends message to host about a listing

**File**: `supabase/functions/messages/handlers/sendMessage.ts`

**Code Path**:
```typescript
// 1. User sends message via POST /messages
// Payload: { message_body, recipient_user_id, listing_id }

// 2. Handler creates message in database
const messageId = await createMessage(supabaseAdmin, {
  threadId,
  messageBody: typedPayload.message_body.trim(),
  senderUserId: senderBubbleId,
  // ... other fields
});

// 3. Database trigger on _message table fires
// (See: update_thread_last_message trigger)
// → Updates thread.last_message and thread.Modified Date

// 4. Realtime subscription broadcasts new message to connected clients
// → Both users' UIs update via WebSocket

// 5. ⚠️ NO NOTIFICATION SENT ⚠️
// → Messages do NOT trigger email/SMS notifications
// → Only in-app via Realtime
```

**Current Behavior**: Messages use **ONLY** Realtime (WebSocket) notifications. They do **NOT** trigger email or SMS notifications via the notification system.

**Expected Behavior**: Should call `notificationSender.sendNotification()` with category `'message_forwarding'` to respect user preferences.

---

## 7. Example: How a Proposal Creates a Notification

**Scenario**: Guest submits a proposal for a listing

**File**: `supabase/functions/proposal/actions/create_suggested.ts` (lines 1-150)

**Code Path**:
```typescript
// 1. Fetch user preferences
const prefs = await getNotificationPreferences(supabase, guestId);

// 2. Check if user wants email notification
if (shouldSendEmail(prefs, 'proposal_updates')) {
  // 3. Send guest confirmation email
  await sendProposalEmail({
    templateId: EMAIL_TEMPLATES.GUEST_PROPOSAL_SUBMITTED,
    toEmail: guest.email,
    toName: guest.firstName,
    variables: {
      // ... template variables
    }
  });
}

// 4. Check if user wants SMS notification
if (shouldSendSms(prefs, 'proposal_updates')) {
  // 5. Send guest confirmation SMS
  await sendProposalSms({
    to: guest.phone,
    body: `Your proposal for ${listing.name} has been submitted!`
  });
}
```

**⚠️ ISSUE**: This code uses the **OLD** fire-and-forget functions (`sendProposalEmail`, `sendProposalSms`) which:
- Do NOT log to `notification_audit` table
- Do NOT support admin override
- Do NOT track correlation IDs
- Return `void` (no error handling)

**Should use**: `notificationSender.sendNotification()` for full audit trail and error handling.

---

## 8. Recommendations

### Immediate Actions (Critical Fixes)

1. **FIX SCHEMA MISMATCH** (Highest Priority)
   - **Decision Required**: Which table is source of truth?
   - **Recommendation**: Use `notification_preferences` (backend table)
     - Reason: Boolean schema is more performant and easier to query
     - Reason: Backend code is newer and follows Supabase patterns
   - **Steps**:
     1. Create migration to add `notification_preferences` table (if missing)
     2. Write data migration script to convert array data to boolean columns
     3. Update frontend to use new table and boolean schema
     4. Deprecate `notificationsettingsos_lists_` table after verification

2. **VERIFY TABLE EXISTS IN PRODUCTION**
   - Use Supabase MCP to check if `notification_preferences` table exists
   - If missing: Deploy migration immediately
   - If exists: Verify schema matches backend expectations

3. **INITIALIZE PREFERENCES ON SIGNUP**
   - Add call to `createDefaultNotificationPreferences()` in signup handler
   - Backfill existing users with default preferences
   - Verify all users have exactly one preferences row

### Short-Term Actions (Major Gaps)

4. **MIGRATE TO NEW NOTIFICATION SYSTEM**
   - Audit all Edge Functions for legacy notification calls
   - Replace `sendProposalEmail()` / `sendProposalSms()` with `sendNotification()`
   - Ensure all notifications are logged to audit table

5. **IMPLEMENT MESSAGE FORWARDING NOTIFICATIONS**
   - Add notification trigger to `sendMessage` handler
   - Call `sendNotification()` with category `'message_forwarding'`
   - Respect user preferences for email/SMS delivery

6. **REMOVE IN-APP CHANNEL FROM FRONTEND**
   - Remove `IN_APP` from `NOTIFICATION_CHANNELS` enum
   - Remove toggle from UI until feature is implemented
   - Update documentation to reflect only email/SMS are supported

### Long-Term Actions (Enhancements)

7. **BUILD TEMPLATE MANAGEMENT SYSTEM**
   - Move template IDs to database
   - Create admin UI for managing templates
   - Add template preview and testing

8. **ADD COMPLIANCE FEATURES**
   - Implement one-click unsubscribe links
   - Add delivery status webhooks
   - Create notification analytics dashboard

9. **IMPLEMENT IN-APP NOTIFICATIONS**
   - Design `notification_inbox` table schema
   - Build notification bell UI component
   - Add real-time subscription for new notifications
   - Implement mark-as-read functionality

---

## 9. Reference Files

### Frontend
- `app/src/islands/shared/NotificationSettingsIsland/NotificationSettingsIsland.jsx`
- `app/src/islands/shared/NotificationSettingsIsland/useNotificationSettings.js`
- `app/src/islands/shared/NotificationSettingsIsland/notificationCategories.js`
- `app/src/islands/shared/NotificationSettingsIsland/NotificationCategoryRow.jsx`
- `app/src/islands/shared/NotificationSettingsIsland/NotificationToggle.jsx`
- `app/src/islands/modals/NotificationSettingsModal.jsx`

### Backend
- `supabase/functions/_shared/notificationSender.ts` (New system, recommended)
- `supabase/functions/_shared/notificationHelpers.ts` (Legacy system, deprecated)
- `supabase/functions/send-email/index.ts`
- `supabase/functions/send-sms/index.ts`
- `supabase/functions/messages/handlers/sendMessage.ts`
- `supabase/functions/proposal/actions/create_suggested.ts`

### Database
- `supabase/migrations/__tests__/notification-migrations.test.sql` (Test schema definition)
- ⚠️ **Missing**: Actual migration file to create `notification_preferences` table

---

## 10. Conclusion

The Split Lease notification system architecture is **partially implemented** with a **critical mismatch** between frontend and backend data storage. While the backend notification sender is well-designed with preference checking, audit logging, and admin override capabilities, **it is reading from a table that the frontend does not write to**.

**User Impact**: Users updating their notification preferences in the UI are under the false impression that they have control over their notifications, when in reality the backend is not reading their preferences.

**Next Steps**: Immediate action required to fix schema mismatch and establish single source of truth for notification preferences. All other enhancements should be deferred until this critical issue is resolved.

---

**End of Report**
