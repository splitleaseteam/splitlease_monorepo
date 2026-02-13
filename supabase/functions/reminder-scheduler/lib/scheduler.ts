/**
 * Notification scheduling logic for reminder-scheduler Edge Function
 * Split Lease - Reminder House Manual Feature
 *
 * Handles sending notifications via send-email and send-sms Edge Functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type {
  Reminder,
  EmailNotificationData,
  SmsNotificationData,
  DeliveryStatus,
} from "./types.ts";

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const DEFAULT_SMS_FROM = '+14155692985';
const DEFAULT_EMAIL_TEMPLATE_ID = '1757433099447x202755280527849400'; // Default reminder template

// ─────────────────────────────────────────────────────────────
// Notification Sending
// ─────────────────────────────────────────────────────────────

/**
 * Send email notification via send-email Edge Function
 */
export const sendEmailNotification = async (
  supabase: ReturnType<typeof createClient>,
  data: EmailNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  console.log('[scheduler] Sending email notification to:', data.toEmail);

  try {
    const { data: responseData, error } = await supabase.functions.invoke('send-email', {
      body: {
        action: 'send',
        payload: {
          template_id: data.templateId || DEFAULT_EMAIL_TEMPLATE_ID,
          to_email: data.toEmail,
          to_name: data.toName,
          subject: data.subject,
          variables: {
            message: data.message,
            subject: data.subject,
            ...(data.variables || {}),
          },
        },
      },
    });

    if (error) {
      console.error('[scheduler] Email send error:', error);
      return { success: false, error: error.message };
    }

    console.log('[scheduler] Email sent successfully');
    return {
      success: true,
      messageId: responseData?.data?.message_id,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[scheduler] Email send exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Send SMS notification via send-sms Edge Function
 */
export const sendSmsNotification = async (
  supabase: ReturnType<typeof createClient>,
  data: SmsNotificationData
): Promise<{ success: boolean; messageSid?: string; error?: string }> => {
  console.log('[scheduler] Sending SMS notification to:', data.toPhone);

  try {
    const { data: responseData, error } = await supabase.functions.invoke('send-sms', {
      body: {
        action: 'send',
        payload: {
          to: data.toPhone,
          from: data.fromPhone || DEFAULT_SMS_FROM,
          body: data.message,
        },
      },
    });

    if (error) {
      console.error('[scheduler] SMS send error:', error);
      return { success: false, error: error.message };
    }

    console.log('[scheduler] SMS sent successfully');
    return {
      success: true,
      messageSid: responseData?.data?.message_sid,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[scheduler] SMS send exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Process a single reminder - send notifications and update status
 */
export const processReminder = async (
  supabase: ReturnType<typeof createClient>,
  reminder: Reminder,
  guestEmail?: string,
  guestPhone?: string,
  guestName?: string
): Promise<{
  emailSent: boolean;
  smsSent: boolean;
  sendgridMessageId?: string;
  twilioMessageSid?: string;
  error?: string;
}> => {
  console.log('[scheduler] Processing reminder:', reminder.id);

  let emailSent = false;
  let smsSent = false;
  let sendgridMessageId: string | undefined;
  let twilioMessageSid: string | undefined;
  const errors: string[] = [];

  // Send email if enabled
  if (reminder.is_an_email_reminder) {
    const toEmail = guestEmail || reminder.fallback_email;

    if (toEmail) {
      const emailResult = await sendEmailNotification(supabase, {
        toEmail,
        toName: guestName,
        subject: `Reminder: ${reminder.type_of_reminders || 'House Manual'}`,
        message: reminder.message_to_send,
      });

      emailSent = emailResult.success;
      sendgridMessageId = emailResult.messageId;

      if (!emailResult.success && emailResult.error) {
        errors.push(`Email: ${emailResult.error}`);
      }
    } else {
      errors.push('Email: No email address available');
    }
  }

  // Send SMS if enabled
  if (reminder.is_a_phone_reminder) {
    const toPhone = guestPhone || reminder.phone_number_in_case_no_guest_attached;

    if (toPhone) {
      const smsResult = await sendSmsNotification(supabase, {
        toPhone,
        message: reminder.message_to_send,
      });

      smsSent = smsResult.success;
      twilioMessageSid = smsResult.messageSid;

      if (!smsResult.success && smsResult.error) {
        errors.push(`SMS: ${smsResult.error}`);
      }
    } else {
      errors.push('SMS: No phone number available');
    }
  }

  return {
    emailSent,
    smsSent,
    sendgridMessageId,
    twilioMessageSid,
    error: errors.length > 0 ? errors.join('; ') : undefined,
  };
};

/**
 * Determine delivery status based on send results
 */
export const determineDeliveryStatus = (
  emailSent: boolean,
  smsSent: boolean,
  isEmailReminder: boolean,
  isSmsReminder: boolean
): DeliveryStatus => {
  // If both channels were requested
  if (isEmailReminder && isSmsReminder) {
    if (emailSent && smsSent) return 'sent';
    if (emailSent || smsSent) return 'sent'; // Partial success still counts as sent
    return 'failed';
  }

  // If only email was requested
  if (isEmailReminder && !isSmsReminder) {
    return emailSent ? 'sent' : 'failed';
  }

  // If only SMS was requested
  if (isSmsReminder && !isEmailReminder) {
    return smsSent ? 'sent' : 'failed';
  }

  return 'failed';
};

/**
 * Fetch guest contact info from user table
 */
export const fetchGuestContactInfo = async (
  supabase: ReturnType<typeof createClient>,
  guestId: string
): Promise<{ email?: string; phone?: string; name?: string }> => {
  console.log('[scheduler] Fetching guest contact info for:', guestId);

  const { data, error } = await supabase
    .from('user')
    .select('email, phone_number, first_name, last_name')
    .eq('id', guestId)
    .single();

  if (error || !data) {
    console.warn('[scheduler] Could not fetch guest info:', error?.message);
    return {};
  }

  const firstName = data.first_name || '';
  const lastName = data.last_name || '';
  const name = [firstName, lastName].filter(Boolean).join(' ');

  return {
    email: data.email,
    phone: data.phone_number,
    name: name || undefined,
  };
};

/**
 * Query pending reminders that are due to be sent
 */
export const queryPendingReminders = async (
  supabase: ReturnType<typeof createClient>,
  batchSize: number
): Promise<Reminder[]> => {
  console.log('[scheduler] Querying pending reminders, batch size:', batchSize);

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('remindersfromhousemanual')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_date_and_time', now)
    .order('scheduled_date_and_time', { ascending: true })
    .limit(batchSize);

  if (error) {
    console.error('[scheduler] Query error:', error);
    throw new Error(`Failed to query pending reminders: ${error.message}`);
  }

  console.log('[scheduler] Found pending reminders:', data?.length || 0);
  return (data || []) as Reminder[];
};

/**
 * Update reminder status after processing
 */
export const updateReminderStatus = async (
  supabase: ReturnType<typeof createClient>,
  reminderId: string,
  updates: {
    status: 'sent' | 'cancelled';
    delivery_status: DeliveryStatus;
    sendgrid_message_id?: string;
    twilio_message_sid?: string;
  }
): Promise<void> => {
  console.log('[scheduler] Updating reminder status:', reminderId, updates.status);

  const { error } = await supabase
    .from('remindersfromhousemanual')
    .update({
      status: updates.status,
      delivery_status: updates.delivery_status,
      sendgrid_message_id: updates.sendgrid_message_id,
      twilio_message_sid: updates.twilio_message_sid,
    })
    .eq('id', reminderId);

  if (error) {
    console.error('[scheduler] Update error:', error);
    throw new Error(`Failed to update reminder status: ${error.message}`);
  }
};
