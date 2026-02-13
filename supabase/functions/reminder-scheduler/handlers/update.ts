/**
 * Update Reminder Handler
 * Split Lease - Reminder House Manual Feature
 *
 * Updates an existing reminder
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { UpdateReminderPayload, UpdateReminderResult, Reminder } from "../lib/types.ts";

/**
 * Handle update reminder action
 */
export const handleUpdate = async (
  payload: UpdateReminderPayload,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<UpdateReminderResult> => {
  console.log('[update] Updating reminder:', payload.reminderId);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.message !== undefined) {
    updates.message_to_send = payload.message;
  }

  if (payload.scheduledDateTime !== undefined) {
    updates.scheduled_date_and_time = payload.scheduledDateTime;
  }

  if (payload.isEmailReminder !== undefined) {
    updates.is_an_email_reminder = payload.isEmailReminder;
  }

  if (payload.isSmsReminder !== undefined) {
    updates.is_a_phone_reminder = payload.isSmsReminder;
  }

  if (payload.fallbackPhone !== undefined) {
    updates.phone_number_in_case_no_guest_attached = payload.fallbackPhone;
  }

  if (payload.fallbackEmail !== undefined) {
    updates.fallback_email = payload.fallbackEmail;
  }

  if (payload.reminderType !== undefined) {
    updates.type_of_reminders = payload.reminderType;
  }

  if (payload.status !== undefined) {
    updates['status'] = payload.status;
  }

  // Determine if rescheduled (scheduled time changed)
  const rescheduled = payload.scheduledDateTime !== undefined;

  console.log('[update] Applying updates:', Object.keys(updates));

  const { data, error } = await supabase
    .from('remindersfromhousemanual')
    .update(updates)
    .eq('id', payload.reminderId)
    .select()
    .single();

  if (error) {
    console.error('[update] Update error:', error);
    throw new Error(`Failed to update reminder: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Reminder not found: ${payload.reminderId}`);
  }

  console.log('[update] Reminder updated successfully');

  return {
    reminder: data as Reminder,
    rescheduled,
  };
};
