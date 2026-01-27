# Implementation Plan: Date Change Request Notification System

## Overview

Implement a comprehensive multi-channel notification system for date change requests that sends contextual notifications to both Guest and Host users when requests are SUBMITTED, ACCEPTED, or REJECTED. The system will deliver notifications via Email (with magic login links), SMS, and in-app messaging, with content that adapts based on user role and request type (Adding/Removing/Swapping dates).

## Success Criteria

- [ ] Notifications sent to BOTH Guest and Host when a request is SUBMITTED
- [ ] Notifications sent to BOTH Guest and Host when a request is ACCEPTED
- [ ] Notifications sent to BOTH Guest and Host when a request is REJECTED
- [ ] Email notifications include magic login links routing to correct page (guest-leases/host-leases)
- [ ] SMS notifications sent to users who have SMS notifications enabled
- [ ] In-app messages created in the messaging thread for the lease
- [ ] Content varies correctly based on recipient role (Guest vs Host)
- [ ] Content varies correctly based on whether recipient is the requester or receiver
- [ ] Content varies correctly based on request type (Adding/Removing/Swapping)
- [ ] BCC recipients included per Bubble workflow pattern
- [ ] Non-blocking notification delivery (failures don't fail the main operation)

## Notification Content Matrix

### Key Insight: The "Is Requester?" Variable

Both Guest AND Host can initiate date change requests. The notification text changes based on:
1. **Recipient role** (Guest or Host)
2. **Is the recipient the requester?** (Yes = "You've requested...", No = "[Name] requested...")
3. **Request type** (Adding, Removing, Swapping)

### Buy vs Sell Perspective

The financial perspective depends on WHO initiated the request and WHAT type:

| Requester | Request Type | Requester's Perspective | Receiver's Perspective |
|-----------|--------------|------------------------|------------------------|
| Guest | Adding | Guest is BUYING (more nights) | Host is SELLING |
| Guest | Removing | Guest is SELLING (giving up nights) | Host is BUYING back |
| Host | Adding | Host is SELLING (offering nights) | Guest is BUYING |
| Host | Removing | Host is BUYING back (reclaiming) | Guest is SELLING |

### Full Content Matrix (36 Combinations)

#### SUBMITTED Event (12 combinations)

| Recipient | Is Requester? | Request Type | Email Body Text |
|-----------|---------------|--------------|-----------------|
| Guest | ✅ Yes | Adding | "You've requested to **buy** the following night..." |
| Guest | ✅ Yes | Removing | "You've requested to **sell** the following night..." |
| Guest | ✅ Yes | Swapping | "You've requested to **swap** nights..." |
| Guest | ❌ No | Adding | "[Host Name] requested to **add** a night to your stay..." |
| Guest | ❌ No | Removing | "[Host Name] requested to **remove** a night from your stay..." |
| Guest | ❌ No | Swapping | "[Host Name] requested to **swap** nights..." |
| Host | ✅ Yes | Adding | "You've requested to **sell** a night to your guest..." |
| Host | ✅ Yes | Removing | "You've requested to **buy back** a night from your guest..." |
| Host | ✅ Yes | Swapping | "You've requested to **swap** nights..." |
| Host | ❌ No | Adding | "[Guest Name] requested to **buy** the following night..." |
| Host | ❌ No | Removing | "[Guest Name] requested to **sell** the following night..." |
| Host | ❌ No | Swapping | "[Guest Name] requested to **swap** nights..." |

#### ACCEPTED Event (12 combinations)

| Recipient | Is Requester? | Request Type | Email Body Text |
|-----------|---------------|--------------|-----------------|
| Guest | ✅ Yes | Adding | "Great news! Your request to add a night has been approved!" |
| Guest | ✅ Yes | Removing | "Your request to remove a night has been approved." |
| Guest | ✅ Yes | Swapping | "Your request to swap nights has been approved!" |
| Guest | ❌ No | Adding | "You've approved [Host Name]'s request to add a night." |
| Guest | ❌ No | Removing | "You've approved [Host Name]'s request to remove a night." |
| Guest | ❌ No | Swapping | "You've approved [Host Name]'s request to swap nights." |
| Host | ✅ Yes | Adding | "Great news! Your request to add a night has been approved!" |
| Host | ✅ Yes | Removing | "Your request to remove a night has been approved." |
| Host | ✅ Yes | Swapping | "Your request to swap nights has been approved!" |
| Host | ❌ No | Adding | "You've approved [Guest Name]'s request to add a night." |
| Host | ❌ No | Removing | "You've approved [Guest Name]'s request to remove a night." |
| Host | ❌ No | Swapping | "You've approved [Guest Name]'s request to swap nights." |

#### REJECTED Event (12 combinations)

| Recipient | Is Requester? | Request Type | Email Body Text |
|-----------|---------------|--------------|-----------------|
| Guest | ✅ Yes | Adding | "Unfortunately, your request to add a night was declined." |
| Guest | ✅ Yes | Removing | "Your request to remove a night was declined." |
| Guest | ✅ Yes | Swapping | "Your request to swap nights was declined." |
| Guest | ❌ No | Adding | "You've declined [Host Name]'s request to add a night." |
| Guest | ❌ No | Removing | "You've declined [Host Name]'s request to remove a night." |
| Guest | ❌ No | Swapping | "You've declined [Host Name]'s request to swap nights." |
| Host | ✅ Yes | Adding | "Unfortunately, your request to add a night was declined." |
| Host | ✅ Yes | Removing | "Your request to remove a night was declined." |
| Host | ✅ Yes | Swapping | "Your request to swap nights was declined." |
| Host | ❌ No | Adding | "You've declined [Guest Name]'s request to add a night." |
| Host | ❌ No | Removing | "You've declined [Guest Name]'s request to remove a night." |
| Host | ❌ No | Swapping | "You've declined [Guest Name]'s request to swap nights." |

## Context & References

### Relevant Files

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `supabase/functions/date-change-request/handlers/create.ts` | Creates date change requests | Add notification dispatch after successful creation |
| `supabase/functions/date-change-request/handlers/accept.ts` | Accepts date change requests | Add notification dispatch after successful acceptance |
| `supabase/functions/date-change-request/handlers/decline.ts` | Declines date change requests | Add notification dispatch after successful decline |
| `supabase/functions/date-change-request/handlers/notifications.ts` | **NEW FILE** | Core notification orchestration logic |
| `supabase/functions/date-change-request/lib/notificationContent.ts` | **NEW FILE** | Content generation based on role/type |
| `supabase/functions/date-change-request/lib/types.ts` | Type definitions | Add notification-related types |
| `supabase/functions/_shared/emailUtils.ts` | Email sending utilities | Reference for patterns |
| `supabase/functions/lease/handlers/notifications.ts` | Lease notification example | Reference for multi-channel pattern |
| `supabase/functions/lease/handlers/magicLinks.ts` | Magic link generation | Reference for magic link pattern |

### Related Documentation

- `.claude/Documentation/Backend(EDGE - Functions)/Endpoints/SEND_EMAIL_USAGE.md` - Email template and sending patterns
- `supabase/CLAUDE.md` - Edge function architecture and patterns
- `supabase/functions/_shared/emailUtils.ts` - BCC configuration and email helpers

### Existing Patterns to Follow

1. **Multi-Channel Notification Pattern** (from `lease/handlers/notifications.ts`):
   - Send all notifications concurrently via `Promise.allSettled`
   - Non-blocking: log failures but don't fail main operation
   - Check user notification preferences before sending

2. **Magic Link Generation Pattern** (from `lease/handlers/magicLinks.ts`):
   - Call `auth-user` Edge Function with `generate_magic_link` action
   - Audit magic links in `magic_link_audit` table
   - Include redirect URL in link generation

3. **Email Sending Pattern** (from `_shared/emailUtils.ts`):
   - Use `sendEmail()` utility for consistent sending
   - Include BCC recipients for internal tracking
   - Use template IDs from `EMAIL_TEMPLATES` constant

4. **In-App Messaging Pattern** (from `messages/handlers/sendSplitBotMessage.ts`):
   - Use `messages` Edge Function with appropriate action
   - Include CTA buttons for user guidance
   - Support role-based visibility

## Implementation Steps

### Step 1: Define Notification Types and Interfaces

**Files:** `supabase/functions/date-change-request/lib/types.ts`
**Purpose:** Add TypeScript interfaces for notification payloads and configuration

**Details:**
- Add `NotificationEvent` type: `'SUBMITTED' | 'ACCEPTED' | 'REJECTED'`
- Add `NotificationRecipient` interface with email, phone, name, notification preferences
- Add `NotificationContext` interface containing request details, lease info, user data
- Add `NotificationContent` interface for generated email/SMS/in-app content

```typescript
// Types to add to lib/types.ts

export type NotificationEvent = 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';

export interface NotificationRecipient {
  userId: string;
  email: string | null;
  firstName: string | null;
  phone: string | null;
  notificationPreferences: {
    email_notifications?: boolean;
    sms_notifications?: boolean;
  } | null;
  role: 'guest' | 'host';
}

export interface NotificationContext {
  event: NotificationEvent;
  requestId: string;
  requestType: RequestType;
  leaseId: string;
  agreementNumber: string | null;
  dateAdded: string | null;
  dateRemoved: string | null;
  priceRate: number | null;
  requestedBy: NotificationRecipient;
  receiver: NotificationRecipient;
  message: string | null;
  answerMessage: string | null;
}

export interface NotificationContent {
  subject: string;
  emailBody: string;
  smsBody: string;
  inAppMessage: string;
  ctaButtonText: string;
  ctaUrl: string;
}
```

**Validation:** TypeScript compilation passes, types are correctly imported in handlers

---

### Step 2: Create Content Generation Module

**Files:** `supabase/functions/date-change-request/lib/notificationContent.ts`
**Purpose:** Generate notification content based on event, recipient role, request type, AND whether recipient is the requester

**Details:**
- Create `generateNotificationContent()` function with `isRequester` parameter
- The `isRequester` flag is CRITICAL - it determines "You've requested..." vs "[Name] requested..."
- Implement Buy vs Sell perspective mapping based on WHO requested and WHAT type:
  - Guest requests Adding = Guest BUYING (want more nights)
  - Guest requests Removing = Guest SELLING (giving up nights)
  - Host requests Adding = Host SELLING (offering more nights to guest)
  - Host requests Removing = Host BUYING (taking back nights from guest)
- Generate distinct subjects for each request type:
  - Adding: "[splitlease] Night Addition Requested/Approved/Declined"
  - Removing: "[splitlease] Night Removal Requested/Approved/Declined"
  - Swapping: "[splitlease] Night Swap Requested/Approved/Declined"
- Generate body text that varies based on `isRequester`:
  - When `isRequester === true`: "You've requested to..."
  - When `isRequester === false`: "[Other Person's Name] requested to..."
- Use "Celebration" tone for ACCEPTED, "General" tone for SUBMITTED/REJECTED

```typescript
// Key functions in notificationContent.ts

import { NotificationContext, NotificationContent, RequestType, NotificationEvent } from './types.ts';

/**
 * Generate notification content for a date change request notification.
 *
 * @param context - The full notification context with request and user data
 * @param recipientRole - Whether the recipient is 'guest' or 'host'
 * @param isRequester - TRUE if recipient initiated the request, FALSE if they're receiving it
 * @returns NotificationContent with subject, body, SMS text, etc.
 */
export function generateNotificationContent(
  context: NotificationContext,
  recipientRole: 'guest' | 'host',
  isRequester: boolean
): NotificationContent {
  const { event, requestType, requestedBy, receiver, dateAdded, dateRemoved, priceRate } = context;

  // Get the "other person's" name for non-requester notifications
  const otherPersonName = isRequester
    ? receiver.firstName || 'the other party'
    : requestedBy.firstName || 'the other party';

  // Get subject line
  const subject = getSubjectLine(event, requestType);

  // Get body text based on all factors
  const emailBody = getEmailBodyText(event, requestType, recipientRole, isRequester, otherPersonName, {
    dateAdded,
    dateRemoved,
    priceRate,
  });

  // SMS is shorter version
  const smsBody = getSmsBodyText(event, requestType, isRequester, otherPersonName);

  // In-app message (neutral, visible to both)
  const inAppMessage = getInAppMessageText(event, requestType, requestedBy.firstName);

  // CTA button
  const ctaButtonText = getCTAButtonText(event, isRequester);
  const ctaUrl = getCTAUrl(recipientRole, context.requestId);

  return {
    subject,
    emailBody,
    smsBody,
    inAppMessage,
    ctaButtonText,
    ctaUrl,
  };
}

// Subject line patterns (same for requester and receiver)
const SUBJECT_PATTERNS: Record<NotificationEvent, Record<RequestType, string>> = {
  SUBMITTED: {
    adding: '[splitlease] Night Addition Requested',
    removing: '[splitlease] Night Removal Requested',
    swapping: '[splitlease] Night Swap Requested',
  },
  ACCEPTED: {
    adding: '[splitlease] Night Addition Approved!',
    removing: '[splitlease] Night Removal Approved!',
    swapping: '[splitlease] Night Swap Approved!',
  },
  REJECTED: {
    adding: '[splitlease] Night Addition Declined',
    removing: '[splitlease] Night Removal Declined',
    swapping: '[splitlease] Night Swap Declined',
  },
};

function getSubjectLine(event: NotificationEvent, requestType: RequestType): string {
  return SUBJECT_PATTERNS[event][requestType];
}

/**
 * Generate email body text based on all context factors.
 *
 * The key branching logic:
 * 1. Is recipient the requester? → "You've requested..." vs "[Name] requested..."
 * 2. What event? → SUBMITTED (pending), ACCEPTED (approved), REJECTED (declined)
 * 3. What request type? → Adding (buy/sell), Removing (sell/buy), Swapping (swap)
 * 4. What role? → Determines buy/sell perspective
 */
function getEmailBodyText(
  event: NotificationEvent,
  requestType: RequestType,
  recipientRole: 'guest' | 'host',
  isRequester: boolean,
  otherPersonName: string,
  details: { dateAdded: string | null; dateRemoved: string | null; priceRate: number | null }
): string {
  // Format date for display
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'the requested date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const dateAddedFormatted = formatDate(details.dateAdded);
  const dateRemovedFormatted = formatDate(details.dateRemoved);
  const priceFormatted = details.priceRate ? `$${details.priceRate.toFixed(2)}` : 'the agreed price';

  // SUBMITTED event
  if (event === 'SUBMITTED') {
    if (isRequester) {
      // Requester sees confirmation of their own request
      switch (requestType) {
        case 'adding':
          return recipientRole === 'guest'
            ? `You've requested to buy the following night: ${dateAddedFormatted} for ${priceFormatted}. We'll notify you when ${otherPersonName} responds.`
            : `You've requested to sell the following night to your guest: ${dateAddedFormatted} for ${priceFormatted}. We'll notify you when ${otherPersonName} responds.`;
        case 'removing':
          return recipientRole === 'guest'
            ? `You've requested to sell (give up) the following night: ${dateRemovedFormatted} for ${priceFormatted}. We'll notify you when ${otherPersonName} responds.`
            : `You've requested to buy back the following night from your guest: ${dateRemovedFormatted} for ${priceFormatted}. We'll notify you when ${otherPersonName} responds.`;
        case 'swapping':
          return `You've requested to swap nights: Remove ${dateRemovedFormatted} and add ${dateAddedFormatted}. We'll notify you when ${otherPersonName} responds.`;
      }
    } else {
      // Receiver sees incoming request from other party
      switch (requestType) {
        case 'adding':
          return recipientRole === 'guest'
            ? `${otherPersonName} has requested to add a night to your stay: ${dateAddedFormatted} for ${priceFormatted}. Please review and respond.`
            : `${otherPersonName} has requested to buy the following night: ${dateAddedFormatted} for ${priceFormatted}. Please review and respond.`;
        case 'removing':
          return recipientRole === 'guest'
            ? `${otherPersonName} has requested to remove a night from your stay: ${dateRemovedFormatted} for ${priceFormatted}. Please review and respond.`
            : `${otherPersonName} has requested to sell (give up) the following night: ${dateRemovedFormatted} for ${priceFormatted}. Please review and respond.`;
        case 'swapping':
          return `${otherPersonName} has requested to swap nights: Remove ${dateRemovedFormatted} and add ${dateAddedFormatted}. Please review and respond.`;
      }
    }
  }

  // ACCEPTED event
  if (event === 'ACCEPTED') {
    if (isRequester) {
      // Requester learns their request was approved
      switch (requestType) {
        case 'adding':
          return `Great news! Your request to add ${dateAddedFormatted} has been approved by ${otherPersonName}!`;
        case 'removing':
          return `Your request to remove ${dateRemovedFormatted} has been approved by ${otherPersonName}.`;
        case 'swapping':
          return `Great news! Your request to swap nights has been approved by ${otherPersonName}!`;
      }
    } else {
      // Receiver (approver) gets confirmation they approved
      switch (requestType) {
        case 'adding':
          return `You've approved ${otherPersonName}'s request to add ${dateAddedFormatted}.`;
        case 'removing':
          return `You've approved ${otherPersonName}'s request to remove ${dateRemovedFormatted}.`;
        case 'swapping':
          return `You've approved ${otherPersonName}'s request to swap nights.`;
      }
    }
  }

  // REJECTED event
  if (event === 'REJECTED') {
    if (isRequester) {
      // Requester learns their request was declined
      switch (requestType) {
        case 'adding':
          return `Unfortunately, your request to add ${dateAddedFormatted} was declined by ${otherPersonName}.`;
        case 'removing':
          return `Your request to remove ${dateRemovedFormatted} was declined by ${otherPersonName}.`;
        case 'swapping':
          return `Your request to swap nights was declined by ${otherPersonName}.`;
      }
    } else {
      // Receiver (decliner) gets confirmation they declined
      switch (requestType) {
        case 'adding':
          return `You've declined ${otherPersonName}'s request to add ${dateAddedFormatted}.`;
        case 'removing':
          return `You've declined ${otherPersonName}'s request to remove ${dateRemovedFormatted}.`;
        case 'swapping':
          return `You've declined ${otherPersonName}'s request to swap nights.`;
      }
    }
  }

  return 'A date change request requires your attention.';
}

function getSmsBodyText(
  event: NotificationEvent,
  requestType: RequestType,
  isRequester: boolean,
  otherPersonName: string
): string {
  const typeLabel = requestType === 'adding' ? 'addition' : requestType === 'removing' ? 'removal' : 'swap';

  if (event === 'SUBMITTED') {
    return isRequester
      ? `Split Lease: Your night ${typeLabel} request has been submitted. Check your email for details.`
      : `Split Lease: ${otherPersonName} has requested a night ${typeLabel}. Check your email to review.`;
  }

  if (event === 'ACCEPTED') {
    return isRequester
      ? `Split Lease: Your night ${typeLabel} request was approved! Check your email for details.`
      : `Split Lease: You've approved ${otherPersonName}'s night ${typeLabel} request.`;
  }

  if (event === 'REJECTED') {
    return isRequester
      ? `Split Lease: Your night ${typeLabel} request was declined. Check your email for details.`
      : `Split Lease: You've declined ${otherPersonName}'s night ${typeLabel} request.`;
  }

  return 'Split Lease: A date change request needs your attention.';
}

function getInAppMessageText(
  event: NotificationEvent,
  requestType: RequestType,
  requesterName: string | null
): string {
  const name = requesterName || 'A user';
  const typeLabel = requestType === 'adding' ? 'add a night' : requestType === 'removing' ? 'remove a night' : 'swap nights';

  switch (event) {
    case 'SUBMITTED':
      return `${name} has requested to ${typeLabel}. Please review the request.`;
    case 'ACCEPTED':
      return `The request to ${typeLabel} has been approved.`;
    case 'REJECTED':
      return `The request to ${typeLabel} has been declined.`;
  }
}

function getCTAButtonText(event: NotificationEvent, isRequester: boolean): string {
  if (event === 'SUBMITTED') {
    return isRequester ? 'View Request' : 'Review Request';
  }
  return 'View Details';
}

function getCTAUrl(recipientRole: 'guest' | 'host', requestId: string): string {
  const basePath = recipientRole === 'guest' ? 'guest-leases' : 'host-leases';
  return `https://split.lease/${basePath}?request=${requestId}`;
}
```

**Validation:**
- Unit tests verify correct content for all **36 combinations** (3 events × 2 roles × 2 isRequester states × 3 types)
- Content matches Bubble workflow patterns
- "You've requested..." appears only when `isRequester === true`
- "[Name] requested..." appears only when `isRequester === false`

---

### Step 3: Create Notification Orchestration Handler

**Files:** `supabase/functions/date-change-request/handlers/notifications.ts`
**Purpose:** Orchestrate multi-channel notification delivery

**Details:**
- Create `sendDateChangeRequestNotifications()` function
- Fetch user data for both participants
- Generate magic links for both users
- Send notifications via all three channels concurrently
- Use `Promise.allSettled` for non-blocking delivery
- Log successes and failures for debugging

```typescript
// handlers/notifications.ts

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { NotificationContext, NotificationEvent, RequestType } from '../lib/types.ts';
import { generateNotificationContent } from '../lib/notificationContent.ts';
import { sendEmail, EMAIL_TEMPLATES, INTERNAL_BCC_EMAILS, SMS_CONFIG } from '../../_shared/emailUtils.ts';

interface DateChangeNotificationParams {
  event: NotificationEvent;
  requestId: string;
  requestType: RequestType;
  leaseId: string;
  dateAdded: string | null;
  dateRemoved: string | null;
  priceRate: number | null;
  requestedById: string;
  receiverId: string;
  message: string | null;
  answerMessage: string | null;
}

export async function sendDateChangeRequestNotifications(
  supabase: SupabaseClient,
  params: DateChangeNotificationParams
): Promise<void> {
  console.log(`[dcr:notifications] Sending ${params.event} notifications for request:`, params.requestId);

  // Step 1: Fetch all required data
  const [users, lease] = await Promise.all([
    fetchUsers(supabase, params.requestedById, params.receiverId),
    fetchLease(supabase, params.leaseId),
  ]);

  if (!users.requester || !users.receiver || !lease) {
    console.warn('[dcr:notifications] Missing data, skipping notifications');
    return;
  }

  // Step 2: Generate magic links for both users
  const magicLinks = await generateMagicLinks(
    supabase,
    users.requester,
    users.receiver,
    params.leaseId,
    params.requestId
  );

  // Step 3: Build notification context
  const context: NotificationContext = {
    event: params.event,
    requestId: params.requestId,
    requestType: params.requestType,
    leaseId: params.leaseId,
    agreementNumber: lease['Agreement Number'],
    dateAdded: params.dateAdded,
    dateRemoved: params.dateRemoved,
    priceRate: params.priceRate,
    requestedBy: users.requester,
    receiver: users.receiver,
    message: params.message,
    answerMessage: params.answerMessage,
  };

  // Step 4: Send all notifications concurrently (non-blocking)
  await Promise.allSettled([
    // Requester notifications
    sendEmailNotification(context, 'requester', magicLinks.requester),
    sendSmsNotification(context, 'requester'),

    // Receiver notifications
    sendEmailNotification(context, 'receiver', magicLinks.receiver),
    sendSmsNotification(context, 'receiver'),

    // In-app message (single message visible to both)
    sendInAppNotification(supabase, context),
  ]);

  console.log('[dcr:notifications] All notification requests dispatched');
}
```

**Validation:**
- Logs show all notification channels attempted
- Failures in one channel don't affect others

---

### Step 4: Implement Email Notification Sending

**Files:** `supabase/functions/date-change-request/handlers/notifications.ts`
**Purpose:** Send email notifications with magic links and appropriate template

**Details:**
- Use "Celebration" template (`CORE-Send Email: Celebration`) for ACCEPTED
- Use "General" template (`CORE-Send Email: General`) for SUBMITTED/REJECTED
- Include standard BCC list for internal tracking
- Include magic link in email body
- Check user's email notification preference before sending

```typescript
// Add to handlers/notifications.ts

const DATE_CHANGE_EMAIL_TEMPLATES = {
  GENERAL: '1756320055390x685004717147094100', // General Email Template 4
  CELEBRATION: '1757000000000x000000000000000000', // TODO: Get actual celebration template ID
};

const DATE_CHANGE_BCC_EMAILS: readonly string[] = [
  'customer-reservations@splitlease.slack.com', // TODO: Verify actual email
  'emails-for-review-aaaagbdra6rjlq6q3pqevmxgym@splitlease.slack.com',
  'splitleaseteam@gmail.com',
];

async function sendEmailNotification(
  context: NotificationContext,
  recipientType: 'requester' | 'receiver',
  magicLink: string
): Promise<void> {
  const recipient = recipientType === 'requester' ? context.requestedBy : context.receiver;

  // Check if user wants email notifications
  if (!shouldSendEmail(recipient.notificationPreferences)) {
    console.log(`[dcr:notifications] Skipping email for ${recipientType} (preference)`);
    return;
  }

  if (!recipient.email) {
    console.log(`[dcr:notifications] Skipping email for ${recipientType} (no email)`);
    return;
  }

  // CRITICAL: Determine if this recipient is the one who initiated the request
  const isRequester = recipientType === 'requester';

  const content = generateNotificationContent(context, recipient.role, isRequester);
  const templateId = context.event === 'ACCEPTED'
    ? DATE_CHANGE_EMAIL_TEMPLATES.CELEBRATION
    : DATE_CHANGE_EMAIL_TEMPLATES.GENERAL;

  await sendEmail({
    templateId,
    toEmail: recipient.email,
    toName: recipient.firstName || undefined,
    subject: content.subject,
    variables: {
      title: content.subject,
      bodytext1: content.emailBody,
      bodytext2: `Click below to view the request details.`,
      button_url: magicLink || content.ctaUrl,
      button_text: content.ctaButtonText,
      logourl: 'https://splitlease.com/assets/images/split-lease-logo.png',
      preheadertext: content.subject,
      warningmessage: '',
      banner: '',
    },
    bccEmails: DATE_CHANGE_BCC_EMAILS,
  });

  console.log(`[dcr:notifications] Email sent to ${recipientType}: ${recipient.email}`);
}

function shouldSendEmail(prefs: { email_notifications?: boolean } | null): boolean {
  if (!prefs || typeof prefs !== 'object') return true; // Default to yes
  return prefs.email_notifications !== false;
}
```

**Validation:**
- Emails arrive at test addresses
- BCC recipients receive copies
- Magic links work correctly

---

### Step 5: Implement SMS Notification Sending

**Files:** `supabase/functions/date-change-request/handlers/notifications.ts`
**Purpose:** Send SMS notifications to users with phone numbers and SMS enabled

**Details:**
- Check user has phone number and SMS notifications enabled
- Use short, actionable message format
- Include core details: request type, status, and hint to check email

```typescript
// Add to handlers/notifications.ts

async function sendSmsNotification(
  context: NotificationContext,
  recipientType: 'requester' | 'receiver'
): Promise<void> {
  const recipient = recipientType === 'requester' ? context.requestedBy : context.receiver;

  // Check if user wants SMS notifications
  if (!shouldSendSms(recipient.notificationPreferences)) {
    console.log(`[dcr:notifications] Skipping SMS for ${recipientType} (preference)`);
    return;
  }

  if (!recipient.phone) {
    console.log(`[dcr:notifications] Skipping SMS for ${recipientType} (no phone)`);
    return;
  }

  // CRITICAL: Determine if this recipient is the one who initiated the request
  const isRequester = recipientType === 'requester';

  const content = generateNotificationContent(context, recipient.role, isRequester);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[dcr:notifications] Missing env vars for SMS');
    return;
  }

  try {
    await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send',
        payload: {
          to: formatPhoneToE164(recipient.phone),
          from: '+14155692985', // Split Lease Twilio number
          body: content.smsBody,
        },
      }),
    });

    console.log(`[dcr:notifications] SMS sent to ${recipientType}`);
  } catch (error) {
    console.warn(`[dcr:notifications] SMS failed for ${recipientType} (non-blocking):`, error);
  }
}

function shouldSendSms(prefs: { sms_notifications?: boolean } | null): boolean {
  if (!prefs || typeof prefs !== 'object') return false; // Default to no
  return prefs.sms_notifications === true;
}

function formatPhoneToE164(phone: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return null;
}
```

**Validation:**
- SMS arrives at test phone numbers
- Invalid phone numbers are gracefully skipped

---

### Step 6: Implement In-App Message Sending

**Files:** `supabase/functions/date-change-request/handlers/notifications.ts`
**Purpose:** Create in-app message in the lease's messaging thread

**Details:**
- Find or create messaging thread for the lease
- Use SplitBot sender for automated messages
- Include CTA button text for action guidance
- Make message visible to both host and guest

```typescript
// Add to handlers/notifications.ts

async function sendInAppNotification(
  supabase: SupabaseClient,
  context: NotificationContext
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[dcr:notifications] Missing env vars for in-app message');
    return;
  }

  // Find the messaging thread for this lease
  const { data: thread, error: threadError } = await supabase
    .from('messaging_threads')
    .select('_id')
    .eq('lease', context.leaseId)
    .maybeSingle();

  if (threadError || !thread) {
    console.warn('[dcr:notifications] No messaging thread found for lease:', context.leaseId);
    return;
  }

  const content = generateNotificationContent(context, 'guest'); // Use generic content for in-app

  try {
    await fetch(`${supabaseUrl}/functions/v1/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_splitbot_message',
        payload: {
          threadId: thread._id,
          ctaName: getCTANameForEvent(context.event, context.requestType),
          recipientRole: 'both',
          customMessageBody: content.inAppMessage,
        },
      }),
    });

    console.log('[dcr:notifications] In-app message sent');
  } catch (error) {
    console.warn('[dcr:notifications] In-app message failed (non-blocking):', error);
  }
}

function getCTANameForEvent(event: NotificationEvent, requestType: RequestType): string {
  // Map to existing CTA names in os_messaging_cta table
  // These may need to be created if they don't exist
  const ctaMap = {
    SUBMITTED: 'date_change_requested',
    ACCEPTED: 'date_change_approved',
    REJECTED: 'date_change_declined',
  };
  return ctaMap[event];
}
```

**Validation:**
- In-app messages appear in messaging thread
- Messages visible to both host and guest

---

### Step 7: Implement Magic Link Generation

**Files:** `supabase/functions/date-change-request/handlers/notifications.ts`
**Purpose:** Generate magic login links that route to correct page with request parameter

**Details:**
- Generate links for both requester and receiver
- Route to `guest-leases` or `host-leases` based on role
- Include `request` query parameter for deep linking
- Audit magic link generation for security tracking

```typescript
// Add to handlers/notifications.ts

interface MagicLinksResult {
  requester: string;
  receiver: string;
}

async function generateMagicLinks(
  supabase: SupabaseClient,
  requester: NotificationRecipient,
  receiver: NotificationRecipient,
  leaseId: string,
  requestId: string
): Promise<MagicLinksResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[dcr:notifications] Missing env vars for magic links');
    return { requester: '', receiver: '' };
  }

  const [requesterLink, receiverLink] = await Promise.all([
    generateSingleMagicLink(
      supabaseUrl,
      serviceRoleKey,
      supabase,
      requester.email,
      requester.userId,
      requester.role === 'guest' ? 'guest-leases' : 'host-leases',
      requestId,
      leaseId
    ),
    generateSingleMagicLink(
      supabaseUrl,
      serviceRoleKey,
      supabase,
      receiver.email,
      receiver.userId,
      receiver.role === 'guest' ? 'guest-leases' : 'host-leases',
      requestId,
      leaseId
    ),
  ]);

  return {
    requester: requesterLink,
    receiver: receiverLink,
  };
}

async function generateSingleMagicLink(
  supabaseUrl: string,
  serviceRoleKey: string,
  supabase: SupabaseClient,
  email: string | null,
  userId: string,
  destinationPage: string,
  requestId: string,
  leaseId: string
): Promise<string> {
  if (!email) {
    console.log('[dcr:notifications] No email for magic link generation');
    return '';
  }

  try {
    const redirectTo = `https://split.lease/${destinationPage}?request=${requestId}`;

    const response = await fetch(`${supabaseUrl}/functions/v1/auth-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate_magic_link',
        payload: {
          email,
          redirectTo,
        },
      }),
    });

    const result = await response.json();

    if (result.success && result.data?.action_link) {
      // Audit the magic link
      await auditMagicLink(supabase, userId, destinationPage, { requestId, leaseId });
      return result.data.action_link;
    }

    console.warn('[dcr:notifications] Magic link generation failed:', result.error);
    return '';
  } catch (error) {
    console.warn('[dcr:notifications] Magic link exception:', error);
    return '';
  }
}

async function auditMagicLink(
  supabase: SupabaseClient,
  userId: string,
  destinationPage: string,
  attachedData: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('magic_link_audit').insert({
      user_id: userId,
      destination_page: destinationPage,
      attached_data: attachedData,
      link_generated_at: new Date().toISOString(),
      created_by: 'date-change-request-notifications',
      sent_via: 'email',
    });
  } catch (error) {
    console.warn('[dcr:notifications] Magic link audit failed:', error);
  }
}
```

**Validation:**
- Magic links authenticate users correctly
- Links redirect to correct page with request parameter
- Audit records created in magic_link_audit table

---

### Step 8: Integrate Notifications into Create Handler

**Files:** `supabase/functions/date-change-request/handlers/create.ts`
**Purpose:** Dispatch SUBMITTED notifications after successful request creation

**Details:**
- Import and call `sendDateChangeRequestNotifications` after insert succeeds
- Pass all required context from the created request
- Ensure non-blocking (wrap in try-catch)

```typescript
// Add to create.ts after successful insert (around line 186)

import { sendDateChangeRequestNotifications } from './notifications.ts';

// ... existing code ...

console.log(`[date-change-request:create] Request created successfully`);

// ================================================
// SEND NOTIFICATIONS (non-blocking)
// ================================================

try {
  await sendDateChangeRequestNotifications(supabase, {
    event: 'SUBMITTED',
    requestId: requestId,
    requestType: input.typeOfRequest,
    leaseId: input.leaseId,
    dateAdded: input.dateAdded || null,
    dateRemoved: input.dateRemoved || null,
    priceRate: input.priceRate || null,
    requestedById: input.requestedById,
    receiverId: input.receiverId,
    message: input.message || null,
    answerMessage: null,
  });
} catch (notificationError) {
  console.error(`[date-change-request:create] Notification error (non-blocking):`, notificationError);
}

// ================================================
// ENQUEUE BUBBLE SYNC
// ================================================
// ... rest of existing code ...
```

**Validation:**
- Creating a request triggers all notification channels
- Request creation succeeds even if notifications fail

---

### Step 9: Integrate Notifications into Accept Handler

**Files:** `supabase/functions/date-change-request/handlers/accept.ts`
**Purpose:** Dispatch ACCEPTED notifications after successful acceptance

**Details:**
- Import and call `sendDateChangeRequestNotifications` after status update
- Fetch requester ID from the request data
- Pass acceptance message as answerMessage

```typescript
// Add to accept.ts after successful update (around line 108)

import { sendDateChangeRequestNotifications } from './notifications.ts';

// ... existing code ...

console.log(`[date-change-request:accept] Request status updated to Approved`);

// ================================================
// SEND NOTIFICATIONS (non-blocking)
// ================================================

try {
  await sendDateChangeRequestNotifications(supabase, {
    event: 'ACCEPTED',
    requestId: input.requestId,
    requestType: requestData['type of request'],
    leaseId: requestData['Lease'] || '',
    dateAdded: requestData['date added'],
    dateRemoved: requestData['date removed'],
    priceRate: requestData['Price/Rate of the night'],
    requestedById: requestData['Requested by'] || '',
    receiverId: requestData['Request receiver'] || '',
    message: requestData['Message from Requested by'],
    answerMessage: input.message || null,
  });
} catch (notificationError) {
  console.error(`[date-change-request:accept] Notification error (non-blocking):`, notificationError);
}

// ================================================
// UPDATE LEASE BOOKED DATES
// ================================================
// ... rest of existing code ...
```

**Validation:**
- Accepting a request triggers all notification channels
- Request acceptance succeeds even if notifications fail
- Celebration email template used

---

### Step 10: Integrate Notifications into Decline Handler

**Files:** `supabase/functions/date-change-request/handlers/decline.ts`
**Purpose:** Dispatch REJECTED notifications after successful decline

**Details:**
- Import and call `sendDateChangeRequestNotifications` after status update
- Fetch requester ID from the request data
- Pass decline reason as answerMessage

```typescript
// Add to decline.ts after successful update (around line 98)

import { sendDateChangeRequestNotifications } from './notifications.ts';

// ... existing code ...

console.log(`[date-change-request:decline] Request status updated to Rejected`);

// ================================================
// SEND NOTIFICATIONS (non-blocking)
// ================================================

try {
  await sendDateChangeRequestNotifications(supabase, {
    event: 'REJECTED',
    requestId: input.requestId,
    requestType: requestData['type of request'],
    leaseId: requestData['Lease'] || '',
    dateAdded: requestData['date added'],
    dateRemoved: requestData['date removed'],
    priceRate: requestData['Price/Rate of the night'],
    requestedById: requestData['Requested by'] || '',
    receiverId: requestData['Request receiver'] || '',
    message: requestData['Message from Requested by'],
    answerMessage: input.reason || null,
  });
} catch (notificationError) {
  console.error(`[date-change-request:decline] Notification error (non-blocking):`, notificationError);
}

// ================================================
// ENQUEUE BUBBLE SYNC
// ================================================
// ... rest of existing code ...
```

**Validation:**
- Declining a request triggers all notification channels
- Request decline succeeds even if notifications fail

---

### Step 11: Add Helper Functions for User Data Fetching

**Files:** `supabase/functions/date-change-request/handlers/notifications.ts`
**Purpose:** Fetch user and lease data needed for notifications

**Details:**
- Create `fetchUsers()` to get both requester and receiver data
- Create `fetchLease()` to get lease details including Agreement Number
- Map database fields to NotificationRecipient interface

```typescript
// Add to handlers/notifications.ts

interface UserQueryResult {
  _id: string;
  email: string | null;
  'First Name': string | null;
  'Cell phone number': string | null;
  'notification preferences': {
    email_notifications?: boolean;
    sms_notifications?: boolean;
  } | null;
}

interface UsersResult {
  requester: NotificationRecipient | null;
  receiver: NotificationRecipient | null;
}

async function fetchUsers(
  supabase: SupabaseClient,
  requesterId: string,
  receiverId: string
): Promise<UsersResult> {
  const { data: users, error } = await supabase
    .from('user')
    .select('_id, email, "First Name", "Cell phone number", "notification preferences"')
    .in('_id', [requesterId, receiverId]);

  if (error || !users) {
    console.warn('[dcr:notifications] User fetch failed:', error?.message);
    return { requester: null, receiver: null };
  }

  const requesterData = users.find(u => u._id === requesterId) as UserQueryResult | undefined;
  const receiverData = users.find(u => u._id === receiverId) as UserQueryResult | undefined;

  // Need to determine roles - fetch lease to check
  const { data: lease } = await supabase
    .from('bookings_leases')
    .select('"Guest", "Host"')
    .or(`Guest.eq.${requesterId},Host.eq.${requesterId}`)
    .maybeSingle();

  const requesterRole = lease?.Guest === requesterId ? 'guest' : 'host';
  const receiverRole = requesterRole === 'guest' ? 'host' : 'guest';

  return {
    requester: requesterData ? mapToRecipient(requesterData, requesterRole) : null,
    receiver: receiverData ? mapToRecipient(receiverData, receiverRole) : null,
  };
}

function mapToRecipient(user: UserQueryResult, role: 'guest' | 'host'): NotificationRecipient {
  return {
    userId: user._id,
    email: user.email,
    firstName: user['First Name'],
    phone: user['Cell phone number'],
    notificationPreferences: user['notification preferences'],
    role,
  };
}

async function fetchLease(
  supabase: SupabaseClient,
  leaseId: string
): Promise<{ 'Agreement Number': string | null; Guest: string | null; Host: string | null } | null> {
  const { data, error } = await supabase
    .from('bookings_leases')
    .select('"Agreement Number", "Guest", "Host"')
    .eq('_id', leaseId)
    .maybeSingle();

  if (error) {
    console.warn('[dcr:notifications] Lease fetch failed:', error.message);
    return null;
  }

  return data;
}
```

**Validation:**
- User data correctly fetched and mapped
- Missing users gracefully handled

---

## Edge Cases & Error Handling

| Edge Case | Handling |
|-----------|----------|
| User has no email | Skip email notification, log and continue |
| User has no phone | Skip SMS notification, log and continue |
| User has notifications disabled | Respect preference, skip that channel |
| No messaging thread for lease | Skip in-app notification, log warning |
| Magic link generation fails | Use direct URL instead of magic link |
| Any notification channel fails | Log error, continue with other channels |
| Request data incomplete | Log warning, skip notifications entirely |
| Missing environment variables | Log warning, skip affected notification type |

## Testing Considerations

### Unit Tests
- Test content generation for all **36 combinations** (3 events × 2 roles × 2 isRequester states × 3 types)
- Verify "You've requested..." only appears when `isRequester === true`
- Verify "[Name] requested..." only appears when `isRequester === false`
- Test Buy/Sell perspective correctness based on role and request type
- Test preference checking functions
- Test phone number formatting
- Test magic link URL construction

### Integration Tests
- Test full notification flow for SUBMITTED event
- Test full notification flow for ACCEPTED event
- Test full notification flow for REJECTED event
- Test with missing user data
- Test with notifications disabled
- Test email template rendering

### Manual Testing Checklist
- [ ] Create a date change request AS GUEST, verify:
  - [ ] Guest (requester) receives "You've requested..." email
  - [ ] Host (receiver) receives "[Guest Name] requested..." email
- [ ] Create a date change request AS HOST, verify:
  - [ ] Host (requester) receives "You've requested..." email
  - [ ] Guest (receiver) receives "[Host Name] requested..." email
- [ ] Accept a date change request, verify:
  - [ ] Requester receives "approved" celebration email
  - [ ] Approver receives "You've approved..." confirmation
- [ ] Decline a date change request, verify:
  - [ ] Requester receives "declined" email
  - [ ] Decliner receives "You've declined..." confirmation
- [ ] Verify magic links authenticate correctly
- [ ] Verify magic links redirect to correct page (guest-leases vs host-leases)
- [ ] Verify BCC recipients receive copies
- [ ] Verify SMS arrives at test phone with correct requester/receiver text
- [ ] Verify in-app message appears in thread
- [ ] Test with user who has SMS disabled
- [ ] Test with user who has email disabled
- [ ] Test all three request types: Adding, Removing, Swapping

## Rollback Strategy

1. **Immediate Rollback**: Remove notification calls from create.ts, accept.ts, decline.ts
2. **Feature Flag Option**: Add environment variable `ENABLE_DCR_NOTIFICATIONS=false` to disable
3. **Partial Rollback**: Comment out individual channels (email/SMS/in-app) if one is problematic

## Dependencies & Blockers

### Prerequisites
- Existing `send-email` Edge Function (DONE)
- Existing `send-sms` Edge Function (DONE)
- Existing `messages` Edge Function with `send_splitbot_message` action (DONE)
- Existing `auth-user` Edge Function with `generate_magic_link` action (DONE)
- Email template IDs configured in database (VERIFY)
- CTA names registered in `os_messaging_cta` table (MAY NEED TO ADD)

### Potential Blockers
- May need to create new email templates if existing ones don't fit
- May need to add CTA records for date change events
- Celebration template ID needs to be identified/created

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Notification spam from high-volume requests | Low | Medium | Throttle status already limits request frequency |
| Email delivery failures | Medium | Low | Non-blocking, logged for debugging |
| SMS cost increase | Low | Medium | Only sent to users with SMS enabled (opt-in) |
| Magic link security | Low | High | Links audited, short expiration |
| Performance impact | Low | Medium | Async dispatch via Promise.allSettled |

## File Summary

### New Files
| File | Purpose |
|------|---------|
| `supabase/functions/date-change-request/handlers/notifications.ts` | Main notification orchestration |
| `supabase/functions/date-change-request/lib/notificationContent.ts` | Content generation logic |

### Modified Files
| File | Changes |
|------|---------|
| `supabase/functions/date-change-request/lib/types.ts` | Add notification types |
| `supabase/functions/date-change-request/handlers/create.ts` | Add notification dispatch |
| `supabase/functions/date-change-request/handlers/accept.ts` | Add notification dispatch |
| `supabase/functions/date-change-request/handlers/decline.ts` | Add notification dispatch |

---

**Plan Version**: 1.1
**Created**: 2026-01-25
**Updated**: 2026-01-25
**Author**: Claude Code (Implementation Planning Architect)

**Revision History**:
- v1.1: Added `isRequester` parameter to content generation. Expanded notification matrix from 18 to 36 combinations to properly handle both Guest AND Host as potential requesters. Updated test cases to verify requester vs receiver content.
