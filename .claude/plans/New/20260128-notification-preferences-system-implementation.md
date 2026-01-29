# Notification Preferences System - Implementation Plan

**Plan ID**: 20260128-notification-preferences-system-implementation
**Classification**: BUILD
**Priority**: High
**Estimated Effort**: 3-4 days
**Created**: 2026-01-28

---

## Executive Summary

Implement a comprehensive notification preferences system that respects user opt-in/opt-out choices for all Email and SMS notifications sent by the Split Lease platform. The frontend UI already exists (`NotificationSettingsIsland`), and the database table (`notification_preferences`) is in place. This plan focuses on backend integration: ensuring every Edge Function that sends notifications checks user preferences before dispatching.

---

## Current State Analysis

### Existing Infrastructure

#### Database Table: `notification_preferences`
- **22 boolean columns** for 11 categories x 2 channels (SMS + Email)
- **Foreign key**: `user_id` -> `public.user._id`
- **Default**: All booleans `false` (privacy-first, opt-in model)
- **Row creation**: Auto-created for new users on first UI access

#### Notification Categories (from `notificationCategories.js`)
| ID | SMS Column | Email Column |
|----|------------|--------------|
| `message_forwarding` | `message_forwarding_sms` | `message_forwarding_email` |
| `payment_reminders` | `payment_reminders_sms` | `payment_reminders_email` |
| `promotional` | `promotional_sms` | `promotional_email` |
| `reservation_updates` | `reservation_updates_sms` | `reservation_updates_email` |
| `lease_requests` | `lease_requests_sms` | `lease_requests_email` |
| `proposal_updates` | `proposal_updates_sms` | `proposal_updates_email` |
| `checkin_checkout` | `checkin_checkout_sms` | `checkin_checkout_email` |
| `reviews` | `reviews_sms` | `reviews_email` |
| `tips_insights` | `tips_insights_sms` | `tips_insights_email` |
| `account_assistance` | `account_assistance_sms` | `account_assistance_email` |
| `virtual_meetings` | `virtual_meetings_sms` | `virtual_meetings_email` |

#### Existing Backend Utilities (`notificationHelpers.ts`)
- `getNotificationPreferences(supabase, userId)` - Fetch preferences
- `shouldSendEmail(prefs, category)` - Pure function check
- `shouldSendSms(prefs, category)` - Pure function check
- `sendProposalEmail(params)` - Fire-and-forget email
- `sendProposalSms(params)` - Fire-and-forget SMS

**ISSUE**: The `NotificationCategory` type in `notificationHelpers.ts` is missing `promotional` category.

#### Existing Frontend UI
- `app/src/islands/shared/NotificationSettingsIsland/` - Complete UI component
- Uses optimistic updates with rollback
- Integrated with toast notifications
- Modal wrapper available in `NotificationSettingsModal.jsx`

### Edge Functions That Send Notifications

Based on codebase analysis, the following Edge Functions send email/SMS and need preference checks:

| Edge Function | File | Current Notification Logic | Category Mapping |
|--------------|------|---------------------------|------------------|
| `send-email` | `supabase/functions/send-email/index.ts` | Low-level send (no preferences) | N/A (base service) |
| `send-sms` | `supabase/functions/send-sms/index.ts` | Low-level send (no preferences) | N/A (base service) |
| `proposal/create` | `actions/create.ts` | No direct notifications (uses messaging) | `proposal_updates` |
| `date-change-request` | `handlers/notifications.ts` | Uses legacy `notification preferences` JSON column | `reservation_updates` |
| `lease` | `handlers/notifications.ts` | Uses legacy `notification preferences` JSON column | `lease_requests` |
| `virtual-meeting` | `_shared/vmMessagingHelpers.ts` | Direct Twilio calls, context-based flags | `virtual_meetings` |
| `auth-user/signup` | `_shared/emailUtils.ts` | Sends welcome email/SMS unconditionally | `account_assistance` |
| `auth-user/login` | `handlers/login.ts` | Sends login notification (optional) | `account_assistance` |
| `auth-user/resetPassword` | `handlers/resetPassword.ts` | Sends reset link unconditionally | Exempt (security) |
| `messages/adminSendReminder` | `handlers/adminSendReminder.ts` | Admin-triggered reminders | `message_forwarding` |
| `reminder-scheduler` | `handlers/processPending.ts` | House manual reminders | `checkin_checkout` |
| `reviews-overview` | Various handlers | Review request notifications | `reviews` |

### Gap Analysis

1. **Inconsistent preference checking**: Some functions use legacy JSON column, some have no checks
2. **Missing category**: `promotional` not in TypeScript type
3. **No unified preference-aware send functions**: Each handler implements its own logic
4. **Legacy data structure**: `date-change-request` and `lease` use old `notification preferences` JSON structure
5. **No audit logging**: No record of notifications skipped due to preferences

---

## Implementation Plan

### Phase 1: Database Migration & Utilities Enhancement

#### Task 1.1: Ensure Preference Row Creation on User Signup
**Files to modify**:
- `supabase/functions/auth-user/handlers/signup.ts`

**Changes**:
```typescript
// After user creation, create default notification_preferences row
const { error: prefsError } = await supabaseAdmin
  .from('notification_preferences')
  .insert({
    user_id: newUserId,
    // All boolean columns default to false via table defaults
  });

if (prefsError && prefsError.code !== '23505') { // Ignore unique violation
  console.warn('[signup] Failed to create notification preferences:', prefsError.message);
  // Non-blocking - user can configure later
}
```

#### Task 1.2: Update notificationHelpers.ts Type Definition
**Files to modify**:
- `supabase/functions/_shared/notificationHelpers.ts`

**Changes**:
1. Add `promotional` to `NotificationCategory` type
2. Add all 22 boolean fields to `NotificationPreferences` interface
3. Add `getNotificationCategory(eventType)` helper for mapping event types to categories

```typescript
export type NotificationCategory =
  | 'proposal_updates'
  | 'message_forwarding'
  | 'payment_reminders'
  | 'promotional'           // ADD THIS
  | 'reservation_updates'
  | 'lease_requests'
  | 'checkin_checkout'
  | 'reviews'
  | 'tips_insights'
  | 'account_assistance'
  | 'virtual_meetings';

export interface NotificationPreferences {
  user_id: string;
  // Proposal Updates
  proposal_updates_sms: boolean;
  proposal_updates_email: boolean;
  // Message Forwarding
  message_forwarding_sms: boolean;
  message_forwarding_email: boolean;
  // Payment Reminders
  payment_reminders_sms: boolean;
  payment_reminders_email: boolean;
  // Promotional
  promotional_sms: boolean;
  promotional_email: boolean;
  // Reservation Updates
  reservation_updates_sms: boolean;
  reservation_updates_email: boolean;
  // Lease Requests
  lease_requests_sms: boolean;
  lease_requests_email: boolean;
  // Check-in/Check-out
  checkin_checkout_sms: boolean;
  checkin_checkout_email: boolean;
  // Reviews
  reviews_sms: boolean;
  reviews_email: boolean;
  // Tips/Insights
  tips_insights_sms: boolean;
  tips_insights_email: boolean;
  // Account Assistance
  account_assistance_sms: boolean;
  account_assistance_email: boolean;
  // Virtual Meetings
  virtual_meetings_sms: boolean;
  virtual_meetings_email: boolean;
}
```

#### Task 1.3: Create Preference-Aware Send Functions
**Files to create**:
- `supabase/functions/_shared/notificationSender.ts`

**Purpose**: High-level notification sending that automatically checks preferences

```typescript
/**
 * Notification Sender with Preference Checking
 *
 * All notification sends should go through these functions.
 * They automatically:
 * 1. Fetch user's notification preferences
 * 2. Check if the category/channel is enabled
 * 3. Log the decision (sent vs. skipped)
 * 4. Send via the appropriate channel
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getNotificationPreferences,
  shouldSendEmail,
  shouldSendSms,
  NotificationCategory,
} from "./notificationHelpers.ts";

export interface SendNotificationParams {
  supabase: SupabaseClient;
  userId: string;
  category: NotificationCategory;
  email?: {
    templateId: string;
    toEmail: string;
    toName?: string;
    subject?: string;
    variables: Record<string, string>;
  };
  sms?: {
    toPhone: string;
    body: string;
  };
}

export interface NotificationResult {
  emailSent: boolean;
  emailSkipped: boolean;
  emailSkipReason?: string;
  smsSent: boolean;
  smsSkipped: boolean;
  smsSkipReason?: string;
}

/**
 * Send notification with automatic preference checking
 * Fire-and-forget pattern - errors are logged but don't throw
 */
export async function sendNotification(
  params: SendNotificationParams
): Promise<NotificationResult> {
  const result: NotificationResult = {
    emailSent: false,
    emailSkipped: false,
    smsSent: false,
    smsSkipped: false,
  };

  // Fetch user preferences
  const prefs = await getNotificationPreferences(params.supabase, params.userId);

  // Log preference state
  console.log(`[notificationSender] User ${params.userId.slice(0,8)}... prefs for ${params.category}:`, {
    hasPrefs: !!prefs,
    email: prefs ? shouldSendEmail(prefs, params.category) : false,
    sms: prefs ? shouldSendSms(prefs, params.category) : false,
  });

  // Handle Email
  if (params.email) {
    if (!shouldSendEmail(prefs, params.category)) {
      result.emailSkipped = true;
      result.emailSkipReason = prefs ? 'User opted out' : 'No preferences (privacy-first)';
      console.log(`[notificationSender] Email SKIPPED: ${result.emailSkipReason}`);
    } else {
      // Send email via send-email Edge Function
      const emailResult = await sendEmailViaEdgeFunction(params.email);
      result.emailSent = emailResult;
    }
  }

  // Handle SMS
  if (params.sms) {
    if (!shouldSendSms(prefs, params.category)) {
      result.smsSkipped = true;
      result.smsSkipReason = prefs ? 'User opted out' : 'No preferences (privacy-first)';
      console.log(`[notificationSender] SMS SKIPPED: ${result.smsSkipReason}`);
    } else {
      // Send SMS via send-sms Edge Function
      const smsResult = await sendSmsViaEdgeFunction(params.sms);
      result.smsSent = smsResult;
    }
  }

  return result;
}

// Internal helpers
async function sendEmailViaEdgeFunction(params: SendNotificationParams['email']): Promise<boolean> {
  // Implementation using existing sendProposalEmail pattern
}

async function sendSmsViaEdgeFunction(params: SendNotificationParams['sms']): Promise<boolean> {
  // Implementation using existing sendProposalSms pattern
}
```

### Phase 2: Edge Function Integration

#### Task 2.1: Proposal Notifications
**Files to modify**:
- `supabase/functions/proposal/actions/create.ts`
- `supabase/functions/proposal/actions/update.ts`
- `supabase/functions/proposal/actions/create_suggested.ts`

**Category**: `proposal_updates`

**Current state**: No email/SMS notifications sent directly (uses in-app messaging only)

**Changes needed**:
- Add optional email notification to host when proposal is created
- Add optional SMS notification to host when proposal is created
- Use `sendNotification()` with category `proposal_updates`

#### Task 2.2: Date Change Request Notifications
**Files to modify**:
- `supabase/functions/date-change-request/handlers/notifications.ts`

**Category**: `reservation_updates`

**Current state**: Uses legacy JSON-based preferences (`notification preferences` column on user table)

**Changes needed**:
1. Replace legacy preference check with new table lookup:
```typescript
// OLD (lines 398-444):
function shouldSendEmail(prefs: { email_notifications?: boolean } | null): boolean {
  if (!prefs || typeof prefs !== 'object') return true; // Default to yes
  return prefs.email_notifications !== false;
}

// NEW:
import { getNotificationPreferences, shouldSendEmail } from '../../_shared/notificationHelpers.ts';

// In sendEmailNotification:
const prefs = await getNotificationPreferences(supabase, recipient.userId);
if (!shouldSendEmail(prefs, 'reservation_updates')) {
  console.log(`[dcr:notifications] Skipping email for ${recipientType} (preference)`);
  return;
}
```

2. Apply same pattern to SMS checks using `shouldSendSms(prefs, 'reservation_updates')`

#### Task 2.3: Lease Notifications
**Files to modify**:
- `supabase/functions/lease/handlers/notifications.ts`

**Category**: `lease_requests`

**Current state**: Uses legacy JSON-based preferences

**Changes needed**: Same pattern as Task 2.2:
1. Import `getNotificationPreferences`, `shouldSendEmail`, `shouldSendSms`
2. Replace `shouldSendEmail(prefs)` with `shouldSendEmail(prefs, 'lease_requests')`
3. Replace `shouldSendSms(prefs)` with `shouldSendSms(prefs, 'lease_requests')`

#### Task 2.4: Virtual Meeting Notifications
**Files to modify**:
- `supabase/functions/_shared/vmMessagingHelpers.ts`

**Category**: `virtual_meetings`

**Current state**: Uses context flags (`notifyHostSms`, `notifyGuestSms`, etc.) passed from caller

**Changes needed**:
1. Add preference check before each notification send:
```typescript
// Before sending guest email (line 334):
if (context.notifyGuestEmail && context.guestEmail) {
  const prefs = await getNotificationPreferences(supabase, context.guestUserId);
  if (!shouldSendEmail(prefs, 'virtual_meetings')) {
    console.log('[vmMessaging] Guest email SKIPPED (preference)');
  } else {
    result.guestEmailSent = await sendEmail({...});
  }
}
```

2. Apply to all four notification points: guest email, host email, guest SMS, host SMS

#### Task 2.5: Authentication Notifications
**Files to modify**:
- `supabase/functions/_shared/emailUtils.ts`
- `supabase/functions/auth-user/handlers/signup.ts`
- `supabase/functions/auth-user/handlers/login.ts`

**Category**: `account_assistance`

**Current state**:
- Welcome emails sent unconditionally
- Login notifications sent unconditionally
- Password reset emails sent unconditionally (keep as-is - security critical)

**Changes needed**:
1. In `signup.ts`: After creating notification_preferences row, check before sending welcome email:
```typescript
const prefs = await getNotificationPreferences(supabase, userId);
if (shouldSendEmail(prefs, 'account_assistance')) {
  await sendWelcomeEmail(userType, email, firstName, verificationLink);
}
// Welcome SMS for Guests
if (phone && shouldSendSms(prefs, 'account_assistance')) {
  await sendWelcomeSms(phone, firstName);
}
```

2. In `login.ts`: Check before sending login notification:
```typescript
if (shouldSendEmail(prefs, 'account_assistance')) {
  await sendLoginNotificationEmail(email, firstName, loginTimestamp);
}
```

3. **EXCEPTION**: Password reset emails (`resetPassword.ts`) should ALWAYS send - no preference check (security critical)

#### Task 2.6: Admin Reminder Notifications (with Override Option) ✅ CONFIRMED
**Files to modify**:
- `supabase/functions/messages/handlers/adminSendReminder.ts`

**Category**: `message_forwarding`

**Current state**: Admin-triggered, no preference checks

**Admin Override Decision**: ✅ Admins can override user preferences when necessary

**Changes needed**:
1. Add `forceOverride` parameter to allow admins to bypass preferences:
```typescript
// Add to payload type:
interface AdminReminderPayload {
  // ... existing fields
  forceOverride?: boolean; // When true, bypass user preference checks
}

// Before sending email:
const prefs = await getNotificationPreferences(supabaseAdmin, recipient.user._id);
if ((payload.method === 'email' || payload.method === 'both') && recipient.user.email) {
  const shouldSend = payload.forceOverride || shouldSendEmail(prefs, 'message_forwarding');
  if (!shouldSend) {
    console.log('[adminSendReminder] Skipping email (user opted out, no override)');
  } else {
    if (payload.forceOverride && !shouldSendEmail(prefs, 'message_forwarding')) {
      console.log('[adminSendReminder] Sending email (ADMIN OVERRIDE - user had opted out)');
    }
    const emailSent = await sendReminderEmail(...);
    // ...
  }
}
```

2. Log override usage in audit table for compliance tracking

#### Task 2.7: House Manual Reminders
**Files to modify**:
- `supabase/functions/reminder-scheduler/handlers/processPending.ts`

**Category**: `checkin_checkout`

**Current state**: Likely sends reminders without preference check

**Changes needed**:
1. Before sending any reminder, fetch guest preferences:
```typescript
const prefs = await getNotificationPreferences(supabase, guestUserId);
if (reminderMethod === 'email' && !shouldSendEmail(prefs, 'checkin_checkout')) {
  // Update reminder status to 'skipped' instead of 'sent'
  continue;
}
if (reminderMethod === 'sms' && !shouldSendSms(prefs, 'checkin_checkout')) {
  continue;
}
```

#### Task 2.8: Review Request Notifications
**Files to modify**:
- `supabase/functions/reviews-overview/handlers/createReview.ts`
- Any handlers that send review request notifications

**Category**: `reviews`

**Changes needed**: Add preference checks before sending review request emails/SMS

### Phase 3: Testing & Validation

#### Task 3.1: Create Test Utility
**Files to create**:
- `supabase/functions/_shared/__tests__/notificationSender.test.ts` (if Deno testing is set up)

**Manual testing checklist**:
- [ ] New user signup creates notification_preferences row
- [ ] User with all prefs OFF receives NO emails/SMS
- [ ] User with email ON, SMS OFF receives ONLY emails
- [ ] User with SMS ON, email OFF receives ONLY SMS
- [ ] User with both ON receives both
- [ ] Password reset emails ALWAYS send (security exception)
- [ ] Each category can be independently controlled

#### Task 3.2: Test Each Notification Path
| Test Case | Category | Expected Behavior |
|-----------|----------|-------------------|
| Proposal created | `proposal_updates` | Host gets email/SMS if opted in |
| Date change requested | `reservation_updates` | Both parties notified if opted in |
| Lease created | `lease_requests` | Both parties notified if opted in |
| Virtual meeting requested | `virtual_meetings` | Both parties notified if opted in |
| User signs up | `account_assistance` | Welcome email/SMS if opted in |
| User logs in | `account_assistance` | Login notification if opted in |
| Password reset | (exempt) | ALWAYS sends |
| Admin reminder | `message_forwarding` | Sends if opted in |
| House manual reminder | `checkin_checkout` | Sends if opted in |
| Review request | `reviews` | Sends if opted in |

### Phase 4: Notification Audit Logging ✅ REQUIRED

#### Task 4.1: Create Audit Table
**Migration file**: `supabase/migrations/YYYYMMDDHHMMSS_create_notification_audit.sql`

```sql
CREATE TABLE IF NOT EXISTS notification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.user(_id),
  category TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  action TEXT NOT NULL CHECK (action IN ('sent', 'skipped')),
  skip_reason TEXT,
  template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edge_function TEXT,
  correlation_id TEXT
);

CREATE INDEX idx_notification_audit_user ON notification_audit(user_id);
CREATE INDEX idx_notification_audit_created ON notification_audit(created_at);
```

#### Task 4.2: Log All Notification Decisions
**Files to modify**:
- `supabase/functions/_shared/notificationSender.ts`

```typescript
async function logNotificationDecision(
  supabase: SupabaseClient,
  userId: string,
  category: NotificationCategory,
  channel: 'email' | 'sms',
  action: 'sent' | 'skipped',
  skipReason?: string,
  templateId?: string
): Promise<void> {
  try {
    await supabase.from('notification_audit').insert({
      user_id: userId,
      category,
      channel,
      action,
      skip_reason: skipReason,
      template_id: templateId,
    });
  } catch (error) {
    // Non-blocking - audit logging shouldn't fail the notification
    console.warn('[notificationSender] Audit log failed:', (error as Error).message);
  }
}
```

---

## Files Changed Summary

### New Files
| Path | Purpose |
|------|---------|
| `supabase/functions/_shared/notificationSender.ts` | High-level preference-aware send functions |
| `supabase/migrations/YYYYMMDDHHMMSS_create_notification_audit.sql` | Audit logging table (REQUIRED) |

### Modified Files
| Path | Change Type |
|------|-------------|
| `supabase/functions/_shared/notificationHelpers.ts` | Add missing category, expand type |
| `supabase/functions/auth-user/handlers/signup.ts` | Create prefs row, check before welcome notifications |
| `supabase/functions/auth-user/handlers/login.ts` | Check preferences before login notification |
| `supabase/functions/date-change-request/handlers/notifications.ts` | Migrate to new preferences table |
| `supabase/functions/lease/handlers/notifications.ts` | Migrate to new preferences table |
| `supabase/functions/_shared/vmMessagingHelpers.ts` | Add preference checks |
| `supabase/functions/messages/handlers/adminSendReminder.ts` | Add preference checks |
| `supabase/functions/reminder-scheduler/handlers/processPending.ts` | Add preference checks |
| `supabase/functions/reviews-overview/handlers/createReview.ts` | Add preference checks |

---

## Rollback Strategy

### Database
1. The `notification_preferences` table already exists - no schema rollback needed
2. If audit table is created, drop it: `DROP TABLE IF EXISTS notification_audit;`

### Code
1. Each Edge Function modification is isolated
2. Revert by removing preference check calls and restoring original logic
3. Functions should gracefully handle missing preferences (already implemented)

### Feature Flags
Consider adding an environment variable to disable preference checking during rollout:
```typescript
const ENFORCE_NOTIFICATION_PREFERENCES = Deno.env.get('ENFORCE_NOTIFICATION_PREFERENCES') !== 'false';

if (ENFORCE_NOTIFICATION_PREFERENCES && !shouldSendEmail(prefs, category)) {
  // Skip notification
} else {
  // Send notification (legacy behavior)
}
```

---

## Default Behavior Decision ✅ RESOLVED

**Decision**: Follow Bubble's existing behavior - **OPT-OUT model** (notifications enabled by default)

Based on the `CORE-Notification-Settings` Bubble workflow analysis, new users should have:

### Categories with BOTH SMS + Email Enabled (9 categories):
1. `checkin_checkout` - Check In/Out Reminders
2. `account_assistance` - Login/Signup Assistance
3. `message_forwarding` - Message Forwarding
4. `payment_reminders` - Payment Reminders
5. `proposal_updates` - Proposal Updates
6. `reservation_updates` - Reservation Updates
7. `reviews` - Reviews
8. `virtual_meetings` - Virtual Meetings
9. `lease_requests` - Lease Requests

### Categories with EMAIL ONLY (1 category):
10. `promotional` - Promotional (Email=true, SMS=false)

### Categories NOT in Bubble (1 category):
11. `tips_insights` - Tips/Market Insights (Default: Both enabled to match pattern)

### Implementation in signup.ts:
```typescript
// After creating notification_preferences row, set defaults to match Bubble behavior
const { error: prefsError } = await supabaseAdmin
  .from('notification_preferences')
  .insert({
    user_id: newUserId,
    // All categories default to BOTH enabled (opt-out model)
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
    // Promotional: Email only (no SMS) per Bubble behavior
    promotional_sms: false,
    promotional_email: true,
  });
```

---

## Dependencies & Prerequisites

1. **Database table exists**: `notification_preferences` table must be present
2. **Frontend UI working**: `NotificationSettingsIsland` should be functional
3. **SendGrid/Twilio configured**: Environment variables for email/SMS services
4. **Edge Functions deployed**: Changes require redeployment of affected functions

---

## Success Metrics

1. **Zero unexpected notifications**: Users with preferences OFF should receive no notifications for that category/channel
2. **Audit trail**: (If implemented) All notification decisions logged
3. **No breaking changes**: Existing notification flows continue to work
4. **Performance**: Preference check adds < 50ms latency per notification

---

## Open Questions - RESOLVED

1. ✅ **Should password reset emails ever be blockable?** → **No** - Security critical, always sends
2. ✅ **Should admin-triggered notifications respect user preferences?** → **Yes, with admin override option** - Admins can bypass with `forceOverride` flag
3. ⏳ **Should we batch preference fetches for multi-recipient notifications?** (Optimization for Phase 2)
4. ✅ **Should promotional emails be added later via separate marketing system?** → **Promotional defaults to Email-only (no SMS)** per Bubble behavior - included in this implementation

---

**Plan Status**: ✅ Ready for Execution (All decisions confirmed)
**Estimated Timeline**:
- Phase 1: 1 day (Database & Utilities)
- Phase 2: 2 days (Edge Function Integration)
- Phase 3: 0.5 day (Testing & Validation)
- Phase 4: 0.5 day (Audit Logging - REQUIRED)

**Total**: 4 days

---

## Execution Order

### Phase 1: Foundation (Day 1)
1. Task 4.1 (Create audit table migration) - Database first
2. Task 1.2 (Update types in notificationHelpers.ts) - TypeScript foundation
3. Task 1.3 (Create notificationSender.ts with audit logging) - Core utility
4. Task 1.1 (Signup preference row creation with defaults) - New user flow

### Phase 2: Edge Function Integration (Days 2-3)
5. Task 2.2 (Date change request) - First real integration
6. Task 2.3 (Lease notifications) - Similar pattern
7. Task 2.4 (Virtual meeting) - More complex
8. Task 2.5 (Auth notifications) - High traffic
9. Task 2.6 (Admin reminders with override) - Has admin override feature
10. Task 2.7 (House manual reminders) - Check-in/checkout
11. Task 2.8 (Reviews) - Review requests
12. Task 2.1 (Proposals) - If email notifications desired

### Phase 3: Testing & Validation (Day 4)
13. Task 3.1-3.2 (Testing all 22 preference paths)

### Summary
- **Audit logging**: Now required, implemented in Phase 1 before Edge Function integration
- **Admin override**: Implemented in Task 2.6
- **Default preferences**: Opt-OUT model matching Bubble behavior
