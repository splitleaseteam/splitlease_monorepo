/**
 * Notification Sender with Preference Checking
 * Split Lease - Edge Functions
 *
 * High-level notification sending that automatically:
 * 1. Fetches user's notification preferences
 * 2. Checks if the category/channel is enabled
 * 3. Logs all decisions to notification_audit table
 * 4. Sends via the appropriate channel (email/SMS)
 *
 * All notification sends should go through these functions to ensure
 * consistent preference handling and audit logging.
 *
 * DESIGN PRINCIPLES:
 * - Preference-first: Always check before sending
 * - Audit everything: Log both sent and skipped notifications
 * - Admin override: Support compliance-logged overrides
 * - Fire-and-forget: Failures don't block main workflows
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getNotificationPreferences,
  shouldSendEmail,
  shouldSendSms,
  NotificationCategory,
  NotificationPreferences,
} from "./notificationHelpers.ts";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface EmailParams {
  templateId: string;
  toEmail: string;
  toName?: string;
  fromEmail?: string;
  fromName?: string;
  subject?: string;
  variables: Record<string, string>;
  bccEmails?: string[];
}

export interface SmsParams {
  toPhone: string;
  body: string;
}

export interface SendNotificationParams {
  supabase: SupabaseClient;
  userId: string;
  category: NotificationCategory;
  email?: EmailParams;
  sms?: SmsParams;
  /** Edge function name for audit trail */
  edgeFunction?: string;
  /** Correlation ID to link related notifications */
  correlationId?: string;
  /** Admin override - bypasses user preferences (logged for compliance) */
  forceOverride?: boolean;
  /** Admin user ID when using forceOverride */
  adminUserId?: string;
}

export interface NotificationResult {
  emailSent: boolean;
  emailSkipped: boolean;
  emailSkipReason?: string;
  smsSent: boolean;
  smsSkipped: boolean;
  smsSkipReason?: string;
  correlationId: string;
}

// ─────────────────────────────────────────────────────────────
// AUDIT LOGGING
// ─────────────────────────────────────────────────────────────

interface AuditLogParams {
  supabase: SupabaseClient;
  userId: string;
  category: NotificationCategory;
  channel: 'email' | 'sms';
  action: 'sent' | 'skipped';
  skipReason?: string;
  adminOverride?: boolean;
  adminUserId?: string;
  templateId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  edgeFunction?: string;
  correlationId?: string;
}

/**
 * Log notification decision to audit table
 * Non-blocking - audit failures don't affect notification delivery
 */
async function logNotificationAudit(params: AuditLogParams): Promise<void> {
  try {
    const { error } = await params.supabase.from('notification_audit').insert({
      user_id: params.userId,
      category: params.category,
      channel: params.channel,
      action: params.action,
      skip_reason: params.skipReason,
      admin_override: params.adminOverride || false,
      admin_user_id: params.adminUserId,
      template_id: params.templateId,
      recipient_email: params.recipientEmail,
      recipient_phone: params.recipientPhone,
      edge_function: params.edgeFunction,
      correlation_id: params.correlationId,
    });

    if (error) {
      console.warn('[notificationSender] Audit log failed:', error.message);
    }
  } catch (error) {
    // Non-blocking - audit logging shouldn't fail the notification
    console.warn('[notificationSender] Audit log error:', (error as Error).message);
  }
}

// ─────────────────────────────────────────────────────────────
// EMAIL SENDING
// ─────────────────────────────────────────────────────────────

/**
 * Send email via send-email Edge Function
 * Returns true if queued successfully
 */
async function sendEmailViaEdgeFunction(params: EmailParams): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[notificationSender] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }

  const emailEndpoint = `${supabaseUrl}/functions/v1/send-email`;

  try {
    console.log(`[notificationSender] Sending email to ${params.toEmail} (template: ${params.templateId})`);

    const response = await fetch(emailEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        action: 'send',
        payload: {
          template_id: params.templateId,
          to_email: params.toEmail,
          to_name: params.toName,
          from_email: params.fromEmail ?? 'no-reply@split.lease',
          from_name: params.fromName ?? 'Split Lease',
          subject: params.subject,
          variables: params.variables,
          bcc_emails: params.bccEmails,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[notificationSender] Email send failed: ${response.status} - ${errorText}`);
      return false;
    }

    console.log(`[notificationSender] Email queued successfully to ${params.toEmail}`);
    return true;
  } catch (error) {
    console.error('[notificationSender] Email send error:', (error as Error).message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// SMS SENDING
// ─────────────────────────────────────────────────────────────

const SPLIT_LEASE_SMS_NUMBER = '+14155692985';

/**
 * Send SMS via send-sms Edge Function
 * Returns true if queued successfully
 */
async function sendSmsViaEdgeFunction(params: SmsParams): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[notificationSender] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }

  const smsEndpoint = `${supabaseUrl}/functions/v1/send-sms`;

  try {
    console.log(`[notificationSender] Sending SMS to ${params.toPhone.slice(0, 6)}...`);

    const response = await fetch(smsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        action: 'send',
        payload: {
          to: params.toPhone,
          from: SPLIT_LEASE_SMS_NUMBER,
          body: params.body,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[notificationSender] SMS send failed: ${response.status} - ${errorText}`);
      return false;
    }

    console.log(`[notificationSender] SMS queued successfully`);
    return true;
  } catch (error) {
    console.error('[notificationSender] SMS send error:', (error as Error).message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN SEND FUNCTION
// ─────────────────────────────────────────────────────────────

/**
 * Send notification with automatic preference checking and audit logging.
 *
 * This is the primary function for sending notifications. It:
 * 1. Fetches user preferences
 * 2. Checks if the category/channel is enabled (unless forceOverride)
 * 3. Logs the decision to notification_audit
 * 4. Sends via email/SMS if allowed
 *
 * @example
 * ```typescript
 * const result = await sendNotification({
 *   supabase,
 *   userId: guest.id,
 *   category: 'proposal_updates',
 *   edgeFunction: 'proposal/create',
 *   email: {
 *     templateId: 'xyz',
 *     toEmail: guest.email,
 *     toName: guest.firstName,
 *     variables: { ... }
 *   },
 *   sms: {
 *     toPhone: guest.phone,
 *     body: 'Your proposal has been submitted!'
 *   }
 * });
 * ```
 */
export async function sendNotification(
  params: SendNotificationParams
): Promise<NotificationResult> {
  // Generate correlation ID if not provided
  const correlationId = params.correlationId || crypto.randomUUID();

  const result: NotificationResult = {
    emailSent: false,
    emailSkipped: false,
    smsSent: false,
    smsSkipped: false,
    correlationId,
  };

  // Fetch user preferences
  const prefs = await getNotificationPreferences(params.supabase, params.userId);

  // Log preference state for debugging
  console.log(`[notificationSender] User ${params.userId.slice(0, 8)}... prefs for ${params.category}:`, {
    hasPrefs: !!prefs,
    emailEnabled: prefs ? shouldSendEmail(prefs, params.category) : false,
    smsEnabled: prefs ? shouldSendSms(prefs, params.category) : false,
    forceOverride: params.forceOverride || false,
  });

  // ─────────────────────────────────────────────────────────────
  // HANDLE EMAIL
  // ─────────────────────────────────────────────────────────────
  if (params.email) {
    const emailAllowed = params.forceOverride || shouldSendEmail(prefs, params.category);

    if (!emailAllowed) {
      result.emailSkipped = true;
      result.emailSkipReason = prefs ? 'User opted out' : 'No preferences found (privacy-first default)';
      console.log(`[notificationSender] Email SKIPPED: ${result.emailSkipReason}`);

      // Log skipped decision
      await logNotificationAudit({
        supabase: params.supabase,
        userId: params.userId,
        category: params.category,
        channel: 'email',
        action: 'skipped',
        skipReason: result.emailSkipReason,
        templateId: params.email.templateId,
        recipientEmail: params.email.toEmail,
        edgeFunction: params.edgeFunction,
        correlationId,
      });
    } else {
      // Check if this is an admin override
      const isOverride = params.forceOverride && !shouldSendEmail(prefs, params.category);
      if (isOverride) {
        console.log(`[notificationSender] Email sending with ADMIN OVERRIDE (user had opted out)`);
      }

      // Send email
      const sent = await sendEmailViaEdgeFunction(params.email);
      result.emailSent = sent;

      // Log sent decision
      await logNotificationAudit({
        supabase: params.supabase,
        userId: params.userId,
        category: params.category,
        channel: 'email',
        action: 'sent',
        adminOverride: isOverride,
        adminUserId: isOverride ? params.adminUserId : undefined,
        templateId: params.email.templateId,
        recipientEmail: params.email.toEmail,
        edgeFunction: params.edgeFunction,
        correlationId,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HANDLE SMS
  // ─────────────────────────────────────────────────────────────
  if (params.sms) {
    const smsAllowed = params.forceOverride || shouldSendSms(prefs, params.category);

    if (!smsAllowed) {
      result.smsSkipped = true;
      result.smsSkipReason = prefs ? 'User opted out' : 'No preferences found (privacy-first default)';
      console.log(`[notificationSender] SMS SKIPPED: ${result.smsSkipReason}`);

      // Log skipped decision
      await logNotificationAudit({
        supabase: params.supabase,
        userId: params.userId,
        category: params.category,
        channel: 'sms',
        action: 'skipped',
        skipReason: result.smsSkipReason,
        recipientPhone: params.sms.toPhone,
        edgeFunction: params.edgeFunction,
        correlationId,
      });
    } else {
      // Check if this is an admin override
      const isOverride = params.forceOverride && !shouldSendSms(prefs, params.category);
      if (isOverride) {
        console.log(`[notificationSender] SMS sending with ADMIN OVERRIDE (user had opted out)`);
      }

      // Send SMS
      const sent = await sendSmsViaEdgeFunction(params.sms);
      result.smsSent = sent;

      // Log sent decision
      await logNotificationAudit({
        supabase: params.supabase,
        userId: params.userId,
        category: params.category,
        channel: 'sms',
        action: 'sent',
        adminOverride: isOverride,
        adminUserId: isOverride ? params.adminUserId : undefined,
        recipientPhone: params.sms.toPhone,
        edgeFunction: params.edgeFunction,
        correlationId,
      });
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// CONVENIENCE FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Send email-only notification with preference checking
 */
export async function sendEmailNotification(
  supabase: SupabaseClient,
  userId: string,
  category: NotificationCategory,
  emailParams: EmailParams,
  options?: {
    edgeFunction?: string;
    correlationId?: string;
    forceOverride?: boolean;
    adminUserId?: string;
  }
): Promise<{ sent: boolean; skipped: boolean; skipReason?: string }> {
  const result = await sendNotification({
    supabase,
    userId,
    category,
    email: emailParams,
    ...options,
  });

  return {
    sent: result.emailSent,
    skipped: result.emailSkipped,
    skipReason: result.emailSkipReason,
  };
}

/**
 * Send SMS-only notification with preference checking
 */
export async function sendSmsNotification(
  supabase: SupabaseClient,
  userId: string,
  category: NotificationCategory,
  smsParams: SmsParams,
  options?: {
    edgeFunction?: string;
    correlationId?: string;
    forceOverride?: boolean;
    adminUserId?: string;
  }
): Promise<{ sent: boolean; skipped: boolean; skipReason?: string }> {
  const result = await sendNotification({
    supabase,
    userId,
    category,
    sms: smsParams,
    ...options,
  });

  return {
    sent: result.smsSent,
    skipped: result.smsSkipped,
    skipReason: result.smsSkipReason,
  };
}

/**
 * Check if a notification would be sent (without actually sending).
 * Useful for conditional logic before preparing notification content.
 */
export async function wouldSendNotification(
  supabase: SupabaseClient,
  userId: string,
  category: NotificationCategory,
  channel: 'email' | 'sms'
): Promise<boolean> {
  const prefs = await getNotificationPreferences(supabase, userId);

  if (channel === 'email') {
    return shouldSendEmail(prefs, category);
  } else {
    return shouldSendSms(prefs, category);
  }
}

// ─────────────────────────────────────────────────────────────
// DEFAULT PREFERENCES
// ─────────────────────────────────────────────────────────────

/**
 * Default notification preferences for new users.
 * Follows OPT-OUT model matching Bubble's CORE-Notification-Settings behavior.
 *
 * All categories enabled by default EXCEPT:
 * - promotional_sms: false (Email only for promotional content)
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'user_id'> = {
  // Check-in/Check-out - Both enabled
  checkin_checkout_sms: true,
  checkin_checkout_email: true,
  // Account Assistance - Both enabled
  account_assistance_sms: true,
  account_assistance_email: true,
  // Message Forwarding - Both enabled
  message_forwarding_sms: true,
  message_forwarding_email: true,
  // Payment Reminders - Both enabled
  payment_reminders_sms: true,
  payment_reminders_email: true,
  // Proposal Updates - Both enabled
  proposal_updates_sms: true,
  proposal_updates_email: true,
  // Reservation Updates - Both enabled
  reservation_updates_sms: true,
  reservation_updates_email: true,
  // Reviews - Both enabled
  reviews_sms: true,
  reviews_email: true,
  // Virtual Meetings - Both enabled
  virtual_meetings_sms: true,
  virtual_meetings_email: true,
  // Lease Requests - Both enabled
  lease_requests_sms: true,
  lease_requests_email: true,
  // Tips/Insights - Both enabled
  tips_insights_sms: true,
  tips_insights_email: true,
  // Promotional - Email only (no SMS per Bubble behavior)
  promotional_sms: false,
  promotional_email: true,
};

/**
 * Create default notification preferences row for a new user.
 * Call this during signup to ensure opt-out model is respected.
 */
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
        console.log(`[notificationSender] Preferences already exist for user ${userId.slice(0, 8)}...`);
        return { success: true };
      }
      console.error(`[notificationSender] Failed to create preferences for user ${userId.slice(0, 8)}...:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[notificationSender] Created default preferences for user ${userId.slice(0, 8)}...`);
    return { success: true };
  } catch (error) {
    console.error(`[notificationSender] Error creating preferences:`, (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
}
