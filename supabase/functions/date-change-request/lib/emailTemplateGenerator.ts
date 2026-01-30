/**
 * Email Template Generator for Date Change Request Notifications
 * Split Lease - Supabase Edge Functions
 *
 * Generates complete email template variables for all date change scenarios:
 * - 16+ email scenarios (SUBMITTED, ACCEPTED, REJECTED, EXPIRING_SOON)
 * - Banner text generation (5 banner fields)
 * - Warning labels for expiry notices
 * - Conditional message inclusion
 *
 * FP PRINCIPLES:
 * - Pure functions with no side effects
 * - Immutable data structures
 * - Explicit dependencies
 */

import {
  NotificationEvent,
  RequestType,
  EmailTemplateVariables,
  EmailNotificationContext,
  NotificationRecipient,
} from './types.ts';
import {
  formatEmailDate,
  formatDateRange,
  formatDatesToAdd,
  formatDatesToRemove,
  formatTimeToExpiry,
} from './dateFormatters.ts';
import {
  getPriceAdjustmentString,
  formatPrice,
  calculateSavings,
  formatSavingsDisplay,
  calculateRefundAmount,
  calculateAdditionalCost,
} from './priceCalculations.ts';
import {
  buildPropertyDisplay,
} from './propertyDisplay.ts';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/**
 * Email scenario identifier
 * Combines event, request type, and requester status for precise template selection
 */
export type EmailScenario =
  // Reminder scenarios (EXPIRING_SOON event)
  | 'REMINDER_HOST_WAITING_GUEST'     // Host requested, waiting for guest
  | 'REMINDER_HOST_RESPOND_GUEST'     // Guest requested, host must respond
  | 'REMINDER_GUEST_RESPOND_HOST'     // Host requested, guest must respond
  | 'REMINDER_GUEST_WAITING_HOST'     // Guest requested, waiting for host

  // Host-initiated: Add date (SUBMITTED event)
  | 'HOST_ADD_OFFER_SENT'             // Host to host - confirmation
  | 'HOST_ADD_OFFER_TO_GUEST'         // Host to guest - offer

  // Host-initiated: Remove date (SUBMITTED event)
  | 'HOST_REMOVE_SENT'                // Host to host - confirmation
  | 'HOST_REMOVE_TO_GUEST'            // Host to guest - action required

  // Host-initiated: Swap date (SUBMITTED event)
  | 'HOST_SWAP_SENT'                  // Host to host - confirmation
  | 'HOST_SWAP_TO_GUEST'              // Host to guest - action required

  // Guest-initiated: All types (SUBMITTED event)
  | 'GUEST_ADD_SENT'                  // Guest to guest - confirmation
  | 'GUEST_REMOVE_SENT'               // Guest to guest - confirmation
  | 'GUEST_REMOVE_TO_HOST'            // Guest to host - action required
  | 'GUEST_SWAP_SENT'                 // Guest to guest - confirmation
  | 'GUEST_SWAP_TO_HOST'              // Guest to host - action required

  // Acceptance (ACCEPTED event)
  | 'GUEST_ACCEPTED_HOST_ADD'         // Guest accepted host's add request
  | 'GUEST_ACCEPTED_HOST_REMOVE'      // Guest accepted host's remove request

  // Decline (REJECTED event)
  | 'HOST_DECLINED_GUEST_ADD'         // Host declined guest's add request (to guest)
  | 'HOST_DECLINED_GUEST_ADD_CONF'    // Host declined guest's add request (to host)
  | 'GUEST_DECLINED_HOST_ADD'         // Guest declined host's add request (to host)
  | 'GUEST_DECLINED_HOST_ADD_CONF';   // Guest declined host's add request (to guest)

// ─────────────────────────────────────────────────────────────
// Main Template Generator
// ─────────────────────────────────────────────────────────────

/**
 * Generate complete email template variables for a date change notification
 *
 * This is the main entry point for email template generation.
 * It determines the scenario and generates all template variables including:
 * - Subject line
 * - Preheader text (warning labels)
 * - Title
 * - Body text
 * - Banner text (5 fields)
 * - Call-to-action button
 * - Footer message
 *
 * @param context - Full notification context
 * @param recipientRole - 'guest' or 'host'
 * @param isRequester - TRUE if recipient initiated the request, FALSE if receiving it
 * @returns Complete email template variables object
 */
export function generateEmailTemplateVariables(
  context: EmailNotificationContext,
  recipientRole: 'guest' | 'host',
  isRequester: boolean
): EmailTemplateVariables {
  // Determine the scenario
  const scenario = determineScenario(context, recipientRole, isRequester);

  // Generate variables based on scenario
  return generateVariablesForScenario(scenario, context, recipientRole, isRequester);
}

// ─────────────────────────────────────────────────────────────
// Scenario Determination
// ─────────────────────────────────────────────────────────────

/**
 * Determine the email scenario based on event, type, and roles
 */
function determineScenario(
  context: EmailNotificationContext,
  recipientRole: 'guest' | 'host',
  isRequester: boolean
): EmailScenario {
  const { event, requestType } = context;

  // Reminder scenarios
  if (event === 'EXPIRING_SOON') {
    if (recipientRole === 'host') {
      return isRequester ? 'REMINDER_HOST_WAITING_GUEST' : 'REMINDER_HOST_RESPOND_GUEST';
    } else {
      return isRequester ? 'REMINDER_GUEST_WAITING_HOST' : 'REMINDER_GUEST_RESPOND_HOST';
    }
  }

  // Acceptance scenarios
  if (event === 'ACCEPTED') {
    if (requestType === 'adding') {
      return isRequester ? 'GUEST_ACCEPTED_HOST_ADD' : 'GUEST_ACCEPTED_HOST_ADD';
    }
    if (requestType === 'removing') {
      return 'GUEST_ACCEPTED_HOST_REMOVE';
    }
    // Swap acceptance - use add format for now
    return 'GUEST_ACCEPTED_HOST_ADD';
  }

  // Decline scenarios
  if (event === 'REJECTED') {
    if (recipientRole === 'guest') {
      return 'HOST_DECLINED_GUEST_ADD';
    } else {
      return 'HOST_DECLINED_GUEST_ADD_CONF';
    }
  }

  // Submitted scenarios
  if (event === 'SUBMITTED') {
    // Host-initiated
    if (isRequester && recipientRole === 'host') {
      switch (requestType) {
        case 'adding': return 'HOST_ADD_OFFER_SENT';
        case 'removing': return 'HOST_REMOVE_SENT';
        case 'swapping': return 'HOST_SWAP_SENT';
      }
    }

    if (!isRequester && recipientRole === 'guest') {
      // Guest receiving host's request
      switch (requestType) {
        case 'adding': return 'HOST_ADD_OFFER_TO_GUEST';
        case 'removing': return 'HOST_REMOVE_TO_GUEST';
        case 'swapping': return 'HOST_SWAP_TO_GUEST';
      }
    }

    // Guest-initiated
    if (isRequester && recipientRole === 'guest') {
      switch (requestType) {
        case 'adding': return 'GUEST_ADD_SENT';
        case 'removing': return 'GUEST_REMOVE_SENT';
        case 'swapping': return 'GUEST_SWAP_SENT';
      }
    }

    if (!isRequester && recipientRole === 'host') {
      // Host receiving guest's request
      switch (requestType) {
        case 'adding': return 'GUEST_ADD_TO_HOST'; // Not defined - use generic
        case 'removing': return 'GUEST_REMOVE_TO_HOST';
        case 'swapping': return 'GUEST_SWAP_TO_HOST';
      }
    }
  }

  // Fallback (should not happen)
  return 'HOST_ADD_OFFER_SENT';
}

// ─────────────────────────────────────────────────────────────
// Scenario-Based Variable Generation
// ─────────────────────────────────────────────────────────────

/**
 * Generate variables for a specific scenario
 */
function generateVariablesForScenario(
  scenario: EmailScenario,
  context: EmailNotificationContext,
  recipientRole: 'guest' | 'host',
  isRequester: boolean
): EmailTemplateVariables {
  // Get common data
  const recipient = isRequester ? context.requestedBy : context.receiver;
  const otherParty = isRequester ? context.receiver : context.requestedBy;
  const firstName = recipient.firstName || 'there';
  const otherPartyName = otherParty.firstName || 'the other party';

  // Get property display
  const propertyDisplay = context.listingData
    ? buildPropertyDisplay(context.listingData).full
    : 'Property';

  // Get date displays
  const dateAddedDisplay = formatDatesToAdd(context.dateAdded);
  const dateRemovedDisplay = formatDatesToRemove(context.dateRemoved);
  const originalDates = context.leaseData.checkIn && context.leaseData.checkOut
    ? formatDateRange(context.leaseData.checkIn, context.leaseData.checkOut)
    : 'Original booking dates';

  // Get time to expiry
  const timeToExpiry = context.requestId
    ? formatTimeToExpiry(context.requestId) // This is wrong - need expiration date
    : '24 hours';

  // Build variables object
  const variables: EmailTemplateVariables = {
    first_name: firstName,
    guest_name: context.requestedBy.role === 'guest' ? context.requestedBy.firstName || 'Guest' : otherPartyName,
    host_name: context.requestedBy.role === 'host' ? context.requestedBy.firstName || 'Host' : otherPartyName,
    property_display: propertyDisplay,
    original_dates: originalDates,
    dates_to_add: dateAddedDisplay,
    dates_to_remove: dateRemovedDisplay,
    date_to_add: dateAddedDisplay,
    date_to_remove: dateRemovedDisplay,
    time_to_expiry: timeToExpiry,
  };

  // Add optional message
  if (isRequester && context.message) {
    if (recipientRole === 'host') {
      variables.host_message = context.message;
    } else {
      variables.guest_message = context.message;
    }
  } else if (!isRequester && context.message) {
    // Message from the other party
    if (otherParty.role === 'host') {
      variables.host_message = context.message;
    } else {
      variables.guest_message = context.message;
    }
  }

  // Generate scenario-specific content
  switch (scenario) {
    // Reminder scenarios
    case 'REMINDER_HOST_WAITING_GUEST':
      return generateReminderHostWaitingGuest(context, variables, otherPartyName);

    case 'REMINDER_HOST_RESPOND_GUEST':
      return generateReminderHostRespondGuest(context, variables, otherPartyName);

    case 'REMINDER_GUEST_RESPOND_HOST':
      return generateReminderGuestRespondHost(context, variables, otherPartyName);

    case 'REMINDER_GUEST_WAITING_HOST':
      return generateReminderGuestWaitingHost(context, variables, otherPartyName);

    // Host-initiated add date
    case 'HOST_ADD_OFFER_SENT':
      return generateHostAddOfferSent(context, variables, otherPartyName);

    case 'HOST_ADD_OFFER_TO_GUEST':
      return generateHostAddOfferToGuest(context, variables, otherPartyName);

    // Host-initiated remove date
    case 'HOST_REMOVE_SENT':
      return generateHostRemoveSent(context, variables, otherPartyName);

    case 'HOST_REMOVE_TO_GUEST':
      return generateHostRemoveToGuest(context, variables, otherPartyName);

    // Host-initiated swap date
    case 'HOST_SWAP_SENT':
      return generateHostSwapSent(context, variables, otherPartyName);

    case 'HOST_SWAP_TO_GUEST':
      return generateHostSwapToGuest(context, variables, otherPartyName);

    // Guest-initiated
    case 'GUEST_ADD_SENT':
      return generateGuestAddSent(context, variables, otherPartyName);

    case 'GUEST_REMOVE_SENT':
      return generateGuestRemoveSent(context, variables, otherPartyName);

    case 'GUEST_REMOVE_TO_HOST':
      return generateGuestRemoveToHost(context, variables, otherPartyName);

    case 'GUEST_SWAP_SENT':
      return generateGuestSwapSent(context, variables, otherPartyName);

    case 'GUEST_SWAP_TO_HOST':
      return generateGuestSwapToHost(context, variables, otherPartyName);

    // Acceptance
    case 'GUEST_ACCEPTED_HOST_ADD':
      return generateGuestAcceptedHostAdd(context, variables, otherPartyName);

    case 'GUEST_ACCEPTED_HOST_REMOVE':
      return generateGuestAcceptedHostRemove(context, variables, otherPartyName);

    // Decline
    case 'HOST_DECLINED_GUEST_ADD':
      return generateHostDeclinedGuestAdd(context, variables, otherPartyName);

    case 'HOST_DECLINED_GUEST_ADD_CONF':
      return generateHostDeclinedGuestAddConf(context, variables, otherPartyName);

    default:
      return variables;
  }
}

// ─────────────────────────────────────────────────────────────
// Reminder Scenario Generators
// ─────────────────────────────────────────────────────────────

function generateReminderHostWaitingGuest(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  guestName: string
): EmailTemplateVariables {
  const priceAdj = getPriceAdjustmentString(0, context.priceRate);

  return {
    ...variables,
    subject: `Reminder: Your request to ${guestName} expires in 2 hours`,
    preheadertext: 'REQUEST EXPIRES IN 2 HOURS',
    title: `Waiting for ${guestName}'s Response`,
    bodytext: `He has not yet accepted your proposed date change for ${variables.property_display}. If the request expires, the original booking details will remain unchanged.`,
    bannertext1: `Guest: ${guestName}`,
    bannertext2: `Original Dates: ${variables.original_dates}`,
    bannertext3: `Proposed Dates: ${variables.date_to_add || variables.date_to_remove || 'Various dates'}`,
    bannertext4: `Price Adjustment: ${priceAdj}`,
    buttontext: 'Manage Request',
    buttonurl: generateUrl(context, 'host'),
    footermessage: 'You can manage or withdraw this request from your dashboard.',
  };
}

function generateReminderHostRespondGuest(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  guestName: string
): EmailTemplateVariables {
  const priceAdj = getPriceAdjustmentString(0, context.priceRate);

  return {
    ...variables,
    subject: `Response Needed: ${guestName}'s Request Expires in 2 Hours`,
    preheadertext: 'REQUEST EXPIRES IN 2 HOURS',
    title: `Action Required on ${guestName}'s Request`,
    bodytext: `${guestName} has requested to change the dates for their booking at ${variables.property_display}. If you don't respond, the request will expire and the original booking details will remain unchanged.`,
    bannertext1: `Guest: ${guestName}`,
    bannertext2: `Original Dates: ${variables.original_dates}`,
    bannertext3: `Proposed New Dates: ${variables.date_to_add || variables.date_to_remove || 'Various dates'}`,
    bannertext4: `Price Adjustment: ${priceAdj}`,
    buttontext: 'Review & Respond',
    buttonurl: generateUrl(context, 'host'),
    footermessage: 'Please review and respond before the request expires.',
  };
}

function generateReminderGuestRespondHost(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  hostName: string
): EmailTemplateVariables {
  const priceAdj = getPriceAdjustmentString(0, context.priceRate);

  return {
    ...variables,
    subject: 'Response Needed: A Request from Your Host Expires in 2 Hours',
    preheadertext: 'REQUEST EXPIRES IN 2 HOURS',
    title: 'A Request from Your Host is Expiring',
    bodytext: `Your host, ${hostName}, has requested to change the dates for your booking at ${variables.property_display}. If you don't respond, the request will be withdrawn and your original booking details will remain unchanged.`,
    bannertext1: `Host: ${hostName}`,
    bannertext2: `Original Dates: ${variables.original_dates}`,
    bannertext3: `Proposed New Dates: ${variables.date_to_add || variables.date_to_remove || 'Various dates'}`,
    bannertext4: `Price Adjustment: ${priceAdj}`,
    buttontext: 'Review Request',
    buttonurl: generateUrl(context, 'guest'),
    footermessage: 'Please review and respond before the request expires.',
  };
}

function generateReminderGuestWaitingHost(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  hostName: string
): EmailTemplateVariables {
  const priceAdj = getPriceAdjustmentString(0, context.priceRate);

  return {
    ...variables,
    subject: 'Your Date Change Request Expires in 2 Hours',
    preheadertext: 'REQUEST EXPIRES IN 2 HOURS',
    title: "Waiting for the Host's Response",
    bodytext: `The host, ${hostName}, has not yet responded to your date change request for ${variables.property_display}. If the host does not respond in time, your request will be withdrawn and your original booking will remain active.`,
    bannertext1: `Host: ${hostName}`,
    bannertext2: `Original Dates: ${variables.original_dates}`,
    bannertext3: `Proposed Dates: ${variables.date_to_add || variables.date_to_remove || 'Various dates'}`,
    bannertext4: `Price Adjustment: ${priceAdj}`,
    buttontext: 'View or Withdraw Request',
    buttonurl: generateUrl(context, 'guest'),
    footermessage: 'You can withdraw this request from your dashboard.',
  };
}

// ─────────────────────────────────────────────────────────────
// Host-Initiated: Add Date
// ─────────────────────────────────────────────────────────────

function generateHostAddOfferSent(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  guestName: string
): EmailTemplateVariables {
  const additionalCost = calculateAdditionalCost(context.priceRate);

  return {
    ...variables,
    subject: 'Your Offer to Add a Date Has Been Sent',
    title: `Offer Sent to ${guestName}`,
    bodytext: `We've sent your offer to add the following date(s) to ${guestName}'s booking at ${variables.property_display}. ${guestName} has 24 hours to respond before this offer expires. We will notify you as soon as they do.`,
    bannertext1: `Guest: ${guestName}`,
    bannertext2: `Date(s) to Add: ${variables.dates_to_add || 'N/A'}`,
    bannertext3: `Additional Cost: ${additionalCost}`,
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'View Offer Status',
    buttonurl: generateUrl(context, 'host'),
    footermessage: 'Track the status of your offer from your dashboard.',
  };
}

function generateHostAddOfferToGuest(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  hostName: string
): EmailTemplateVariables {
  const additionalCost = calculateAdditionalCost(context.priceRate);
  let bodytext = `Your host, ${hostName}, has offered to add the following date(s) to your booking at ${variables.property_display}. Please review and respond within 24 hours. If you don't respond in time, this offer will expire.`;

  if (variables.host_message) {
    bodytext += `<br><br>Message from ${hostName}: ${variables.host_message}`;
  }

  return {
    ...variables,
    subject: 'New Offer from Your Host to Add a Date',
    title: 'Your Host Has Offered to Add a Date',
    bodytext,
    bannertext1: `Host: ${hostName}`,
    bannertext2: `Date(s) to Add: ${variables.dates_to_add || 'N/A'}`,
    bannertext3: `Additional Cost: ${additionalCost}`,
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'Review & Respond',
    buttonurl: generateUrl(context, 'guest'),
    footermessage: 'Review the offer details and respond before it expires.',
  };
}

// ─────────────────────────────────────────────────────────────
// Host-Initiated: Remove Date
// ─────────────────────────────────────────────────────────────

function generateHostRemoveSent(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  guestName: string
): EmailTemplateVariables {
  const refundAmount = calculateRefundAmount(context.priceRate);
  let bodytext = `We have sent your request to remove the following date(s) from ${guestName}'s booking at ${variables.property_display}. ${guestName} has 24 hours to respond before this request expires. We will notify you as soon as they do.`;

  if (variables.host_message) {
    bodytext += `<br><br>Here is the message you included: '${variables.host_message}'`;
  }

  return {
    ...variables,
    subject: 'Confirmation: Your Request to Remove a Date Was Sent',
    title: `Request Sent to ${guestName}`,
    bodytext,
    bannertext1: `Guest: ${guestName}`,
    bannertext2: `Date(s) to Remove: ${variables.dates_to_remove || 'N/A'}`,
    bannertext3: `Refund Amount: ${refundAmount}`,
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'View Request Status',
    buttonurl: generateUrl(context, 'host'),
    footermessage: 'Track the status of your request from your dashboard.',
  };
}

function generateHostRemoveToGuest(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  hostName: string
): EmailTemplateVariables {
  const refundAmount = calculateRefundAmount(context.priceRate);
  let bodytext = `Your host, ${hostName}, has requested to remove the following date(s) from your booking at ${variables.property_display}. Please review this request and respond within 24 hours. If you don't respond in time, the request will expire and your booking will not be changed.`;

  if (variables.host_message) {
    bodytext += `<br><br>Message from ${hostName}: ${variables.host_message}`;
  }

  return {
    ...variables,
    subject: 'Action Required: Request from Your Host to Remove a Date',
    title: 'Your Host Has Requested to Remove a Date',
    bodytext,
    bannertext1: `Host: ${hostName}`,
    bannertext2: `Date(s) to Remove: ${variables.dates_to_remove || 'N/A'}`,
    bannertext3: `Refund Amount: ${refundAmount}`,
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'Review & Respond',
    buttonurl: generateUrl(context, 'guest'),
    footermessage: 'Review the request details and respond before it expires.',
  };
}

// ─────────────────────────────────────────────────────────────
// Host-Initiated: Swap Date
// ─────────────────────────────────────────────────────────────

function generateHostSwapSent(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  guestName: string
): EmailTemplateVariables {
  const priceAdjustment = getPriceAdjustmentString(0, context.priceRate);
  let bodytext = `We have sent your request to swap dates for ${guestName}'s booking at ${variables.property_display}. ${guestName} has 24 hours to respond before this request expires. We will notify you of their decision.`;

  if (variables.host_message) {
    bodytext += `<br><br>Here is the message you included: '${variables.host_message}'`;
  }

  return {
    ...variables,
    subject: 'Confirmation: Your Date Swap Request Was Sent',
    title: `Date Swap Request Sent to ${guestName}`,
    bodytext,
    bannertext1: `Date to Add: ${variables.date_to_add || 'N/A'}`,
    bannertext2: `Date to Remove: ${variables.date_to_remove || 'N/A'}`,
    bannertext3: `Price Adjustment: ${priceAdjustment}`,
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'View Request Status',
    buttonurl: generateUrl(context, 'host'),
    footermessage: 'Track the status of your request from your dashboard.',
  };
}

function generateHostSwapToGuest(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  hostName: string
): EmailTemplateVariables {
  const priceAdjustment = getPriceAdjustmentString(0, context.priceRate);
  let bodytext = `Your host, ${hostName}, has requested to swap the following dates for your booking at ${variables.property_display}. Please review this request and respond within 24 hours. If you don't respond in time, the request will expire and your booking will not be changed.`;

  if (variables.host_message) {
    bodytext += `<br><br>Message from ${hostName}: ${variables.host_message}`;
  }

  return {
    ...variables,
    subject: 'Action Required: A New Date Swap Request from Your Host',
    title: 'Your Host Has Requested a Date Swap',
    bodytext,
    bannertext1: `Date to Add: ${variables.date_to_add || 'N/A'}`,
    bannertext2: `Date to Remove: ${variables.date_to_remove || 'N/A'}`,
    bannertext3: `Price Adjustment: ${priceAdjustment}`,
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'Review & Respond',
    buttonurl: generateUrl(context, 'guest'),
    footermessage: 'Review the request details and respond before it expires.',
  };
}

// ─────────────────────────────────────────────────────────────
// Guest-Initiated Scenarios
// ─────────────────────────────────────────────────────────────

function generateGuestAddSent(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  hostName: string
): EmailTemplateVariables {
  const additionalCost = calculateAdditionalCost(context.priceRate);

  return {
    ...variables,
    subject: 'Confirmation: Your Request to Add a Date Was Sent',
    title: `Request Sent to Your Host, ${hostName}`,
    bodytext: `We have sent your request to add the following date(s) to your booking at ${variables.property_display}. Your host has 24 hours to respond. We will notify you as soon as they do.`,
    bannertext1: `Host: ${hostName}`,
    bannertext2: `Date(s) to Add: ${variables.dates_to_add || 'N/A'}`,
    bannertext3: `Additional Cost: ${additionalCost}`,
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'View Request Status',
    buttonurl: generateUrl(context, 'guest'),
    footermessage: 'Track the status of your request from your dashboard.',
  };
}

function generateGuestRemoveSent(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  hostName: string
): EmailTemplateVariables {
  const refundAmount = calculateRefundAmount(context.priceRate);
  let bodytext = `We have sent your request to remove the following date(s) from your booking at ${variables.property_display}. Your host has 24 hours to respond. We will notify you as soon as they do.`;

  if (variables.guest_message) {
    bodytext += `<br><br>Here is the message you included: '${variables.guest_message}'`;
  }

  return {
    ...variables,
    subject: 'Confirmation: Your Request to Remove a Date Was Sent',
    title: `Request Sent to Your Host, ${hostName}`,
    bodytext,
    bannertext1: `Host: ${hostName}`,
    bannertext2: `Date(s) to Remove: ${variables.dates_to_remove || 'N/A'}`,
    bannertext3: `Refund Amount: ${refundAmount}`,
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'View Request Status',
    buttonurl: generateUrl(context, 'guest'),
    footermessage: 'Track the status of your request from your dashboard.',
  };
}

function generateGuestRemoveToHost(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  guestName: string
): EmailTemplateVariables {
  const bookingReduction = calculateRefundAmount(context.priceRate); // Simplified
  let bodytext = `Your guest, ${guestName}, has requested to remove the following date(s) from their booking at ${variables.property_display}. Please review this request and respond within 24 hours. If you don't respond in time, the request will expire and the original booking will remain.`;

  if (variables.guest_message) {
    bodytext += `<br><br>Message from ${guestName}: ${variables.guest_message}`;
  }

  return {
    ...variables,
    subject: 'Action Required: A Guest Has Requested to Remove a Date',
    title: `${guestName} Has Requested to Remove a Date`,
    bodytext,
    bannertext1: `Guest: ${guestName}`,
    bannertext2: `Date(s) to Remove: ${variables.dates_to_remove || 'N/A'}`,
    bannertext3: `Booking Reduction: ${bookingReduction}`,
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'Review & Respond',
    buttonurl: generateUrl(context, 'host'),
    footermessage: 'Review the request details and respond before it expires.',
  };
}

function generateGuestSwapSent(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  hostName: string
): EmailTemplateVariables {
  const priceAdjustment = getPriceAdjustmentString(0, context.priceRate);
  let bodytext = `We have sent your request to swap dates for your booking at ${variables.property_display}. Your host has 24 hours to respond. We will notify you as soon as they do.`;

  if (variables.guest_message) {
    bodytext += `<br><br>Here is the message you included: '${variables.guest_message}'`;
  }

  return {
    ...variables,
    subject: 'Confirmation: Your Date Swap Request Was Sent',
    title: `Request Sent to Your Host, ${hostName}`,
    bodytext,
    bannertext1: `Host: ${hostName}`,
    bannertext2: `Date to Add: ${variables.date_to_add || 'N/A'}`,
    bannertext3: `Date to Remove: ${variables.date_to_remove || 'N/A'}`,
    bannertext4: `Price Adjustment: ${priceAdjustment}`,
    bannertext5: `Property: ${variables.property_display}`,
    buttontext: 'View Request Status',
    buttonurl: generateUrl(context, 'guest'),
    footermessage: 'Track the status of your request from your dashboard.',
  };
}

function generateGuestSwapToHost(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  guestName: string
): EmailTemplateVariables {
  const priceAdjustment = getPriceAdjustmentString(0, context.priceRate);
  let bodytext = `Your guest, ${guestName}, has requested to swap dates for their booking at ${variables.property_display}. Please review this request and respond within 24 hours. If you don't respond in time, the request will expire and the original booking will remain.`;

  if (variables.guest_message) {
    bodytext += `<br><br>Message from ${guestName}: ${variables.guest_message}`;
  }

  return {
    ...variables,
    subject: 'Action Required: A Guest Has Requested to Swap Dates',
    title: `${guestName} Has Requested a Date Swap`,
    bodytext,
    bannertext1: `Guest: ${guestName}`,
    bannertext2: `Date to Add: ${variables.date_to_add || 'N/A'}`,
    bannertext3: `Date to Remove: ${variables.date_to_remove || 'N/A'}`,
    bannertext4: `Price Adjustment: ${priceAdjustment}`,
    bannertext5: `Property: ${variables.property_display}`,
    buttontext: 'Review & Respond',
    buttonurl: generateUrl(context, 'host'),
    footermessage: 'Review the request details and respond before it expires.',
  };
}

// ─────────────────────────────────────────────────────────────
// Acceptance Scenarios
// ─────────────────────────────────────────────────────────────

function generateGuestAcceptedHostAdd(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  hostName: string
): EmailTemplateVariables {
  const finalCost = formatPrice(context.priceRate);
  const savings = formatSavingsDisplay(context.priceRate, context.percentageOfRegular);

  return {
    ...variables,
    subject: `Confirmed: Your Booking at ${variables.property_display} Has Been Updated`,
    title: "You're All Set! A New Date Has Been Added",
    bodytext: `You've successfully accepted the request from your host, ${hostName}, to add a date to your stay at ${variables.property_display}. Your itinerary has been updated with this change. We've also notified your host.`,
    bannertext1: `Date Added: ${variables.date_to_add || 'N/A'}`,
    bannertext2: `Final Cost for This Night: ${finalCost}`,
    bannertext3: savings ? `You Saved: ${savings}` : undefined,
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'View Updated Itinerary',
    buttonurl: generateUrl(context, 'guest'),
    footermessage: 'View your updated booking details in your dashboard.',
  };
}

function generateGuestAcceptedHostRemove(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  guestName: string
): EmailTemplateVariables {
  const bookingReduction = calculateRefundAmount(context.priceRate);

  return {
    ...variables,
    subject: `Success! Your Booking with ${guestName} Has Been Updated`,
    title: `${guestName} Accepted Your Request`,
    bodytext: `Your request to remove a date from ${guestName}'s stay at ${variables.property_display} has been accepted. The guest's refund has been processed and your calendar has been updated.`,
    bannertext1: `Date Removed: ${variables.date_to_remove || 'N/A'}`,
    bannertext2: `Booking Total Reduced By: ${bookingReduction}`,
    bannertext3: `Guest: ${guestName}`,
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'View Updated Booking',
    buttonurl: generateUrl(context, 'host'),
    footermessage: 'View your updated booking details in your dashboard.',
  };
}

// ─────────────────────────────────────────────────────────────
// Decline Scenarios
// ─────────────────────────────────────────────────────────────

function generateHostDeclinedGuestAdd(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  hostName: string
): EmailTemplateVariables {
  let bodytext = `Unfortunately, your host, ${hostName}, was unable to accept your request to add a date to your booking at ${variables.property_display}. Your original booking details remain unchanged. No further action is needed from you.`;

  if (variables.host_message) {
    bodytext += `<br><br>Message from ${hostName}: ${variables.host_message}`;
  }

  return {
    ...variables,
    subject: 'Update on Your Date Addition Request',
    preheadertext: 'Date Request Declined',
    title: 'Your Host Has Declined Your Request',
    bodytext,
    bannertext1: `Requested Date to Add: ${variables.date_to_add || 'N/A'}`,
    bannertext2: 'Status: Declined by Host',
    bannertext3: `Host: ${hostName}`,
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'View Booking Details',
    buttonurl: generateUrl(context, 'guest'),
    footermessage: 'Your original booking remains unchanged.',
  };
}

function generateHostDeclinedGuestAddConf(
  context: EmailNotificationContext,
  variables: EmailTemplateVariables,
  guestName: string
): EmailTemplateVariables {
  return {
    ...variables,
    subject: 'Confirmation: You Have Declined the Request',
    title: `You Have Declined ${guestName}'s Request`,
    bodytext: `This confirms that you have declined the date addition request from your guest, ${guestName}, for their booking at ${variables.property_display}. We have notified ${guestName} of your decision. The original booking details remain unchanged.`,
    bannertext1: `Guest: ${guestName}`,
    bannertext2: `Requested Date to Add: ${variables.date_to_add || 'N/A'}`,
    bannertext3: 'Status: You Declined',
    bannertext4: `Property: ${variables.property_display}`,
    buttontext: 'View Booking Details',
    buttonurl: generateUrl(context, 'host'),
    footermessage: 'The original booking details remain unchanged.',
  };
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

/**
 * Generate URL for email CTA button
 */
function generateUrl(context: EmailNotificationContext, role: 'guest' | 'host'): string {
  const basePath = role === 'guest' ? 'guest-leases' : 'host-leases';
  return `https://split.lease/${basePath}?lease=${context.leaseId}&request=${context.requestId}`;
}

/**
 * Get template ID for a scenario
 * These template IDs should match what's created in Bubble
 */
export function getTemplateIdForScenario(scenario: EmailScenario): string {
  // TODO: Replace with actual template IDs from Bubble
  // For now, use the BASIC_EMAIL template as default
  const TEMPLATE_MAP: Record<EmailScenario, string> = {
    // Reminders
    'REMINDER_HOST_WAITING_GUEST': 'DCR_HOST_REMIND_WAITING',
    'REMINDER_HOST_RESPOND_GUEST': 'DCR_HOST_REMIND_RESPOND',
    'REMINDER_GUEST_RESPOND_HOST': 'DCR_GUEST_REMIND_RESPOND',
    'REMINDER_GUEST_WAITING_HOST': 'DCR_GUEST_REMIND_WAITING',

    // Host add
    'HOST_ADD_OFFER_SENT': 'DCR_HOST_ADD_OFFER_SENT',
    'HOST_ADD_OFFER_TO_GUEST': 'DCR_GUEST_ADD_OFFER',

    // Host remove
    'HOST_REMOVE_SENT': 'DCR_HOST_REMOVE_SENT',
    'HOST_REMOVE_TO_GUEST': 'DCR_GUEST_REMOVE_REQ',

    // Host swap
    'HOST_SWAP_SENT': 'DCR_HOST_SWAP_SENT',
    'HOST_SWAP_TO_GUEST': 'DCR_GUEST_SWAP_REQ',

    // Guest add
    'GUEST_ADD_SENT': 'DCR_GUEST_ADD_SENT',

    // Guest remove
    'GUEST_REMOVE_SENT': 'DCR_GUEST_REMOVE_SENT',
    'GUEST_REMOVE_TO_HOST': 'DCR_HOST_REMOVE_ACTION',

    // Guest swap
    'GUEST_SWAP_SENT': 'DCR_GUEST_SWAP_SENT',
    'GUEST_SWAP_TO_HOST': 'DCR_HOST_SWAP_ACTION',

    // Accept
    'GUEST_ACCEPTED_HOST_ADD': 'DCR_GUEST_ADD_ACCEPTED',
    'GUEST_ACCEPTED_HOST_REMOVE': 'DCR_HOST_REMOVE_ACCEPTED',

    // Decline
    'HOST_DECLINED_GUEST_ADD': 'DCR_GUEST_ADD_DECLINED',
    'HOST_DECLINED_GUEST_ADD_CONF': 'DCR_HOST_ADD_DECLINED',
  };

  // Return the template ID or default to BASIC_EMAIL
  return TEMPLATE_MAP[scenario] || '1560447575939x331870423481483500';
}
