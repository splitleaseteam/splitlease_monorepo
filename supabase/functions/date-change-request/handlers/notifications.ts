/**
 * Notifications Handler for Date Change Request Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Orchestrates multi-channel notification delivery for date change requests:
 * - Email (via send-email Edge Function with magic links)
 * - SMS (via send-sms Edge Function)
 * - In-app messaging (via messages Edge Function)
 *
 * Notifications are non-blocking - failures are logged but don't fail
 * the main operation.
 *
 * Key Design: The `isRequester` flag determines notification perspective:
 * - TRUE: "You've requested..." (recipient initiated the request)
 * - FALSE: "[Name] requested..." (recipient is receiving the request)
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  NotificationContext,
  NotificationRecipient,
  DateChangeNotificationParams,
  RequestType,
  NotificationEvent,
} from '../lib/types.ts';
import { generateNotificationContent } from '../lib/notificationContent.ts';
import { generateEmailTemplateVariables, getTemplateIdForScenario as _getTemplateIdForScenario } from '../lib/emailTemplateGenerator.ts';
import { sendEmail, EMAIL_TEMPLATES } from '../../_shared/emailUtils.ts';
import { fetchListingFromLease, buildPropertyDisplay as _buildPropertyDisplay } from '../lib/propertyDisplay.ts';
import type { EmailNotificationContext, ListingData as _ListingData } from '../lib/types.ts';
import {
  getNotificationPreferences as _NotificationPreferences,
  shouldSendEmail as checkEmailPreference,
  shouldSendSms as checkSmsPreference,
  NotificationPreferences as _NotificationPreferences,
} from '../../_shared/notificationHelpers.ts';

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

/**
 * Email template IDs
 * GENERAL: Used for SUBMITTED and REJECTED events
 * CELEBRATION: Used for ACCEPTED events (approval)
 */
const _DATE_CHANGE_EMAIL_TEMPLATES = {
  GENERAL: EMAIL_TEMPLATES.BASIC_EMAIL,
  CELEBRATION: EMAIL_TEMPLATES.BASIC_EMAIL, // TODO: Create celebration template if desired
};

/**
 * BCC recipients for internal tracking
 * These Slack channel emails pipe directly into Slack
 */
const DATE_CHANGE_BCC_EMAILS: readonly string[] = [
  'customer-reservations-aaaadcrzzindbwl2eznwtujfvm@splitlease.slack.com',
  'emails-for-review-aaaagbdra6rjlq6q3pqevmxgym@splitlease.slack.com',
  'splitleaseteam@gmail.com',
];

/**
 * Split Lease Twilio phone number for SMS
 */
const SMS_FROM_NUMBER = '+14155692985';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UserQueryResult {
  id: string;
  email: string | null;
  first_name: string | null;
  phone_number: string | null;
}

interface UsersResult {
  requester: NotificationRecipient | null;
  receiver: NotificationRecipient | null;
}

interface MagicLinksResult {
  requester: string;
  receiver: string;
}

interface LeaseQueryResult {
  agreement_number: string | null;
  guest_user_id: string | null;
  host_user_id: string | null;
}

// ─────────────────────────────────────────────────────────────
// Main Entry Point
// ─────────────────────────────────────────────────────────────

/**
 * Send date change request notifications to both parties via all channels.
 *
 * This is the main entry point called from create, accept, and decline handlers.
 * All notifications are non-blocking - failures are logged but don't fail
 * the main operation.
 *
 * @param supabase - Supabase client
 * @param params - Notification parameters including event, request details, and user IDs
 */
export async function sendDateChangeRequestNotifications(
  supabase: SupabaseClient,
  params: DateChangeNotificationParams
): Promise<void> {
  console.log(`[dcr:notifications] Sending ${params.event} notifications for request:`, params.requestId);

  // Step 1: Fetch all required data
  const [users, lease] = await Promise.all([
    fetchUsers(supabase, params.requestedById, params.receiverId, params.leaseId),
    fetchLease(supabase, params.leaseId),
  ]);

  if (!users.requester || !users.receiver) {
    console.warn('[dcr:notifications] Missing user data, skipping notifications');
    return;
  }

  if (!lease) {
    console.warn('[dcr:notifications] Missing lease data, skipping notifications');
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
    agreementNumber: lease.agreement_number,
    dateAdded: params.dateAdded,
    dateRemoved: params.dateRemoved,
    priceRate: params.priceRate,
    requestedBy: users.requester,
    receiver: users.receiver,
    message: params.message,
    answerMessage: params.answerMessage,
  };

  // Step 4: Send all notifications concurrently (non-blocking)
  // Note: Email/SMS functions now check notification_preferences table
  const results = await Promise.allSettled([
    // Requester notifications (isRequester = true)
    sendEmailNotification(supabase, context, 'requester', magicLinks.requester),
    sendSmsNotification(supabase, context, 'requester'),

    // Receiver notifications (isRequester = false)
    sendEmailNotification(supabase, context, 'receiver', magicLinks.receiver),
    sendSmsNotification(supabase, context, 'receiver'),

    // In-app message (single message visible to both)
    sendInAppNotification(supabase, context),
  ]);

  // Log results summary
  const fulfilled = results.filter(r => r.status === 'fulfilled').length;
  const rejected = results.filter(r => r.status === 'rejected').length;
  console.log(`[dcr:notifications] Complete: ${fulfilled} succeeded, ${rejected} failed`);
}

// ─────────────────────────────────────────────────────────────
// User Data Fetching
// ─────────────────────────────────────────────────────────────

/**
 * Fetch user data for both requester and receiver
 */
async function fetchUsers(
  supabase: SupabaseClient,
  requesterId: string,
  receiverId: string,
  leaseId: string
): Promise<UsersResult> {
  // Fetch users
  const { data: users, error: usersError } = await supabase
    .from('user')
    .select('id, email, first_name, phone_number')
    .in('id', [requesterId, receiverId]);

  if (usersError || !users) {
    console.warn('[dcr:notifications] User fetch failed:', usersError?.message);
    return { requester: null, receiver: null };
  }

  const requesterData = users.find(u => u.id === requesterId) as UserQueryResult | undefined;
  const receiverData = users.find(u => u.id === receiverId) as UserQueryResult | undefined;

  // Fetch lease to determine roles
  const { data: lease, error: leaseError } = await supabase
    .from('booking_lease')
    .select('guest_user_id, host_user_id')
    .eq('id', leaseId)
    .maybeSingle();

  if (leaseError || !lease) {
    console.warn('[dcr:notifications] Lease fetch for roles failed:', leaseError?.message);
    return { requester: null, receiver: null };
  }

  // Determine roles based on lease participants
  const requesterRole: 'guest' | 'host' = lease.guest_user_id === requesterId ? 'guest' : 'host';
  const receiverRole: 'guest' | 'host' = requesterRole === 'guest' ? 'host' : 'guest';

  return {
    requester: requesterData ? mapToRecipient(requesterData, requesterRole) : null,
    receiver: receiverData ? mapToRecipient(receiverData, receiverRole) : null,
  };
}

/**
 * Map database user record to NotificationRecipient
 */
function mapToRecipient(user: UserQueryResult, role: 'guest' | 'host'): NotificationRecipient {
  return {
    userId: user.id,
    email: user.email,
    firstName: user.first_name,
    phone: user.phone_number,
    notificationPreferences: null,
    role,
  };
}

/**
 * Fetch lease data including Agreement Number
 */
async function fetchLease(
  supabase: SupabaseClient,
  leaseId: string
): Promise<LeaseQueryResult | null> {
  const { data, error } = await supabase
    .from('booking_lease')
    .select('agreement_number, guest_user_id, host_user_id')
    .eq('id', leaseId)
    .maybeSingle();

  if (error) {
    console.warn('[dcr:notifications] Lease fetch failed:', error.message);
    return null;
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// Magic Link Generation
// ─────────────────────────────────────────────────────────────

/**
 * Generate magic login links for both parties
 */
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

/**
 * Generate a single magic link and audit it
 */
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
    console.warn('[dcr:notifications] Magic link exception:', (error as Error).message);
    return '';
  }
}

/**
 * Audit magic link creation for security tracking
 */
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
    console.warn('[dcr:notifications] Magic link audit failed:', (error as Error).message);
  }
}

// ─────────────────────────────────────────────────────────────
// Email Notifications
// ─────────────────────────────────────────────────────────────

/**
 * Send email notification to a recipient
 * Uses new notification_preferences table for preference checking
 * Uses new email template generator with 16+ scenarios
 *
 * @param supabase - Supabase client for preference lookup
 * @param context - Full notification context
 * @param recipientType - 'requester' or 'receiver'
 * @param magicLink - Pre-generated magic link for this recipient
 */
async function sendEmailNotification(
  supabase: SupabaseClient,
  context: NotificationContext,
  recipientType: 'requester' | 'receiver',
  magicLink: string
): Promise<void> {
  const recipient = recipientType === 'requester' ? context.requestedBy : context.receiver;

  if (!recipient.email) {
    console.log(`[dcr:notifications] Skipping email for ${recipientType} (no email)`);
    return;
  }

  // Check notification preferences from new table
  const prefs = await getNotificationPreferences(supabase, recipient.userId);
  if (!checkEmailPreference(prefs, 'reservation_updates')) {
    console.log(`[dcr:notifications] Skipping email for ${recipientType} (preference: reservation_updates disabled)`);
    return;
  }

  // CRITICAL: Determine if this recipient is the one who initiated the request
  const isRequester = recipientType === 'requester';

  try {
    // Fetch additional data needed for new email templates
    const listingData = await fetchListingFromLease(supabase, context.leaseId);

    // Fetch lease data with reservation dates
    const { data: leaseData } = await supabase
      .from('booking_lease')
      .select('reservation_start_date, reservation_end_date')
      .eq('id', context.leaseId)
      .maybeSingle();

    // Build full email notification context
    const emailContext: EmailNotificationContext = {
      ...context,
      leaseData: {
        checkIn: leaseData?.reservation_start_date || null,
        checkOut: leaseData?.reservation_end_date || null,
        agreementNumber: context.agreementNumber,
      },
      listingData: listingData,
      percentageOfRegular: null, // Would need to fetch from request data if needed
    };

    // Generate email template variables using new generator
    const templateVars = generateEmailTemplateVariables(
      emailContext,
      recipient.role,
      isRequester
    );

    // Determine template ID based on scenario (use BASIC_EMAIL as default for now)
    // TODO: Replace with scenario-based template IDs once templates are created in Bubble
    const templateId = EMAIL_TEMPLATES.BASIC_EMAIL;

    // Override button URL with magic link
    templateVars.buttonurl = magicLink;

    // Send email with all template variables
    await sendEmail({
      templateId,
      toEmail: recipient.email,
      toName: recipient.firstName || undefined,
      subject: templateVars.subject || 'Split Lease - Date Change Request',
      variables: templateVars,
      bccEmails: DATE_CHANGE_BCC_EMAILS,
    });

    console.log(`[dcr:notifications] Email sent to ${recipientType}: ${recipient.email}`);
  } catch (error) {
    console.warn(`[dcr:notifications] Email failed for ${recipientType} (non-blocking):`, (error as Error).message);
  }
}

// ─────────────────────────────────────────────────────────────
// SMS Notifications
// ─────────────────────────────────────────────────────────────

/**
 * Send SMS notification to a recipient
 * Uses new notification_preferences table for preference checking
 */
async function sendSmsNotification(
  supabase: SupabaseClient,
  context: NotificationContext,
  recipientType: 'requester' | 'receiver'
): Promise<void> {
  const recipient = recipientType === 'requester' ? context.requestedBy : context.receiver;

  if (!recipient.phone) {
    console.log(`[dcr:notifications] Skipping SMS for ${recipientType} (no phone)`);
    return;
  }

  // Check notification preferences from new table
  const prefs = await getNotificationPreferences(supabase, recipient.userId);
  if (!checkSmsPreference(prefs, 'reservation_updates')) {
    console.log(`[dcr:notifications] Skipping SMS for ${recipientType} (preference: reservation_updates disabled)`);
    return;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[dcr:notifications] Missing env vars for SMS');
    return;
  }

  // CRITICAL: Determine if this recipient is the one who initiated the request
  const isRequester = recipientType === 'requester';

  // Get the other person's name for the SMS content
  const _otherPersonName = isRequester
    ? context.receiver.firstName || 'the other party'
    : context.requestedBy.firstName || 'the other party';

  const content = generateNotificationContent(context, recipient.role, isRequester);

  const formattedPhone = formatPhoneToE164(recipient.phone);
  if (!formattedPhone) {
    console.warn(`[dcr:notifications] Invalid phone number for ${recipientType}`);
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
          to: formattedPhone,
          from: SMS_FROM_NUMBER,
          body: content.smsBody,
        },
      }),
    });

    console.log(`[dcr:notifications] SMS sent to ${recipientType}`);
  } catch (error) {
    console.warn(`[dcr:notifications] SMS failed for ${recipientType} (non-blocking):`, (error as Error).message);
  }
}

/**
 * Format phone number to E.164 format (+15551234567)
 */
function formatPhoneToE164(phone: string): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle US numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Already has country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // International format
  if (digits.length > 10) {
    return `+${digits}`;
  }

  // Invalid format
  return null;
}

// ─────────────────────────────────────────────────────────────
// In-App Notifications
// ─────────────────────────────────────────────────────────────

/**
 * Send in-app message notification to the lease's messaging thread
 */
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
    .from('message_thread')
    .select('id')
    .eq('lease_id', context.leaseId)
    .maybeSingle();

  if (threadError || !thread) {
    console.warn('[dcr:notifications] No messaging thread found for lease:', context.leaseId);
    return;
  }

  // Use neutral content for in-app (visible to both parties)
  const content = generateNotificationContent(context, 'guest', false);

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
          threadId: thread.id,
          ctaName: getCTANameForEvent(context.event, context.requestType),
          recipientRole: 'both',
          customMessageBody: content.inAppMessage,
        },
      }),
    });

    console.log('[dcr:notifications] In-app message sent');
  } catch (error) {
    console.warn('[dcr:notifications] In-app message failed (non-blocking):', (error as Error).message);
  }
}

/**
 * Map notification event to CTA name for in-app messaging
 */
function getCTANameForEvent(event: NotificationEvent, _requestType: RequestType): string {
  // Map to existing CTA names in os_messaging_cta table
  // These may need to be created if they don't exist
  const ctaMap: Record<NotificationEvent, string> = {
    SUBMITTED: 'date_change_requested',
    ACCEPTED: 'date_change_approved',
    REJECTED: 'date_change_declined',
  };
  return ctaMap[event];
}
