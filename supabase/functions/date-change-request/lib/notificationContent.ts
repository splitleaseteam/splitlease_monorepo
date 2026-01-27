/**
 * Notification Content Generator for Date Change Requests
 * Split Lease - Supabase Edge Functions
 *
 * Generates notification content based on:
 * 1. Event type (SUBMITTED, ACCEPTED, REJECTED)
 * 2. Recipient role (guest or host)
 * 3. Whether recipient is the requester or receiver
 * 4. Request type (adding, removing, swapping)
 *
 * This creates 36 unique notification combinations:
 * 3 events x 2 roles x 2 isRequester states x 3 request types
 */

import {
  NotificationContext,
  NotificationContent,
  RequestType,
  NotificationEvent,
} from './types.ts';

// ─────────────────────────────────────────────────────────────
// Subject Line Patterns
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Main Content Generator
// ─────────────────────────────────────────────────────────────

/**
 * Generate notification content for a date change request notification.
 *
 * The `isRequester` flag is CRITICAL - it determines:
 * - TRUE: "You've requested..." (recipient initiated the request)
 * - FALSE: "[Name] requested..." (recipient is receiving the request)
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
  // If recipient is the requester, "other person" is the receiver
  // If recipient is the receiver, "other person" is the requester
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

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function getSubjectLine(event: NotificationEvent, requestType: RequestType): string {
  return SUBJECT_PATTERNS[event][requestType];
}

/**
 * Format date for display in notifications
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'the requested date';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/**
 * Format price for display
 */
function formatPrice(priceRate: number | null): string {
  return priceRate ? `$${priceRate.toFixed(2)}` : 'the agreed price';
}

/**
 * Generate email body text based on all context factors.
 *
 * The key branching logic:
 * 1. Is recipient the requester? - "You've requested..." vs "[Name] requested..."
 * 2. What event? - SUBMITTED (pending), ACCEPTED (approved), REJECTED (declined)
 * 3. What request type? - Adding (buy/sell), Removing (sell/buy), Swapping (swap)
 * 4. What role? - Determines buy/sell perspective for Guest vs Host
 *
 * Buy vs Sell Perspective:
 * - Guest requests Adding = Guest BUYING (wants more nights)
 * - Guest requests Removing = Guest SELLING (giving up nights)
 * - Host requests Adding = Host SELLING (offering more nights)
 * - Host requests Removing = Host BUYING (taking back nights)
 */
function getEmailBodyText(
  event: NotificationEvent,
  requestType: RequestType,
  recipientRole: 'guest' | 'host',
  isRequester: boolean,
  otherPersonName: string,
  details: { dateAdded: string | null; dateRemoved: string | null; priceRate: number | null }
): string {
  const dateAddedFormatted = formatDate(details.dateAdded);
  const dateRemovedFormatted = formatDate(details.dateRemoved);
  const priceFormatted = formatPrice(details.priceRate);

  // ─────────────────────────────────────────────────────────────
  // SUBMITTED Event
  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // ACCEPTED Event
  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // REJECTED Event
  // ─────────────────────────────────────────────────────────────
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

  // Fallback (should never reach here)
  return 'A date change request requires your attention.';
}

/**
 * Generate SMS body text (shorter version for SMS constraints)
 */
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

/**
 * Generate in-app message text (neutral, visible to both users)
 */
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

/**
 * Get CTA button text based on event and requester status
 */
function getCTAButtonText(event: NotificationEvent, isRequester: boolean): string {
  if (event === 'SUBMITTED') {
    return isRequester ? 'View Request' : 'Review Request';
  }
  return 'View Details';
}

/**
 * Get CTA URL based on recipient role
 */
function getCTAUrl(recipientRole: 'guest' | 'host', requestId: string): string {
  const basePath = recipientRole === 'guest' ? 'guest-leases' : 'host-leases';
  return `https://split.lease/${basePath}?request=${requestId}`;
}
