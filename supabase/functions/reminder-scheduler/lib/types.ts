/**
 * Type definitions for reminder-scheduler Edge Function
 * Split Lease - Reminder House Manual Feature
 */

// ─────────────────────────────────────────────────────────────
// Reminder Types
// ─────────────────────────────────────────────────────────────

/**
 * Reminder type codes
 */
export type ReminderType =
  | 'check-in'
  | 'check-out'
  | 'maintenance'
  | 'payment'
  | 'emergency'
  | 'amenity'
  | 'local-tip'
  | 'custom';

/**
 * Reminder status
 */
export type ReminderStatus = 'pending' | 'sent' | 'cancelled';

/**
 * Delivery status for tracking
 */
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';

/**
 * Reminder record from database
 */
export interface Reminder {
  readonly id: string;
  readonly house_manual: string;
  readonly guest?: string;
  readonly created_by: string;
  readonly message_to_send: string;
  readonly scheduled_date_and_time: string;
  readonly is_an_email_reminder: boolean;
  readonly is_a_phone_reminder: boolean;
  readonly phone_number_in_case_no_guest_attached?: string;
  readonly fallback_email?: string;
  readonly type_of_reminders?: ReminderType;
  readonly api_scheduled_code_for_email?: string;
  readonly api_scheduled_code_for_sms?: string;
  readonly status: ReminderStatus;
  readonly visit?: string;
  readonly delivery_status: DeliveryStatus;
  readonly delivered_at?: string;
  readonly opened_at?: string;
  readonly sendgrid_message_id?: string;
  readonly twilio_message_sid?: string;
  readonly created_at?: string;
  readonly updated_at?: string;
}

// ─────────────────────────────────────────────────────────────
// Request Payloads
// ─────────────────────────────────────────────────────────────

/**
 * Payload for creating a reminder
 */
export interface CreateReminderPayload {
  readonly houseManualId: string;
  readonly creatorId: string;
  readonly message: string;
  readonly scheduledDateTime: string;
  readonly isEmailReminder: boolean;
  readonly isSmsReminder: boolean;
  readonly guestId?: string;
  readonly visitId?: string;
  readonly fallbackPhone?: string;
  readonly fallbackEmail?: string;
  readonly reminderType?: ReminderType;
  readonly templateId?: string;
}

/**
 * Payload for updating a reminder
 */
export interface UpdateReminderPayload {
  readonly reminderId: string;
  readonly message?: string;
  readonly scheduledDateTime?: string;
  readonly isEmailReminder?: boolean;
  readonly isSmsReminder?: boolean;
  readonly fallbackPhone?: string;
  readonly fallbackEmail?: string;
  readonly reminderType?: ReminderType;
  readonly status?: ReminderStatus;
}

/**
 * Payload for getting reminders
 */
export interface GetRemindersPayload {
  readonly houseManualId?: string;
  readonly visitId?: string;
  readonly status?: ReminderStatus;
}

/**
 * Payload for getting reminders by visit (guest view)
 */
export interface GetByVisitPayload {
  readonly visitId: string;
}

/**
 * Payload for deleting a reminder
 */
export interface DeleteReminderPayload {
  readonly reminderId: string;
}

/**
 * Payload for processing pending reminders (cron job)
 */
export interface ProcessPendingPayload {
  readonly batchSize?: number;
}

/**
 * Payload for webhook updates
 */
export interface WebhookPayload {
  readonly messageId?: string;
  readonly messageSid?: string;
  readonly event: string;
  readonly timestamp?: string;
}

// ─────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────

/**
 * Result from create action
 */
export interface CreateReminderResult {
  readonly reminder: Reminder;
  readonly scheduled: boolean;
}

/**
 * Result from update action
 */
export interface UpdateReminderResult {
  readonly reminder: Reminder;
  readonly rescheduled: boolean;
}

/**
 * Result from get action
 */
export interface GetRemindersResult {
  readonly reminders: readonly Reminder[];
  readonly total: number;
}

/**
 * Result from delete action
 */
export interface DeleteReminderResult {
  readonly deleted: boolean;
  readonly reminderId: string;
}

/**
 * Result from process-pending action
 */
export interface ProcessPendingResult {
  readonly processed: number;
  readonly failed: number;
  readonly results: readonly ProcessedReminder[];
}

/**
 * Individual processed reminder result
 */
export interface ProcessedReminder {
  readonly reminderId: string;
  readonly emailSent: boolean;
  readonly smsSent: boolean;
  readonly error?: string;
}

// ─────────────────────────────────────────────────────────────
// Notification Types
// ─────────────────────────────────────────────────────────────

/**
 * Email notification data
 */
export interface EmailNotificationData {
  readonly toEmail: string;
  readonly toName?: string;
  readonly subject: string;
  readonly message: string;
  readonly templateId?: string;
  readonly variables?: Record<string, string>;
}

/**
 * SMS notification data
 */
export interface SmsNotificationData {
  readonly toPhone: string;
  readonly message: string;
  readonly fromPhone?: string;
}
