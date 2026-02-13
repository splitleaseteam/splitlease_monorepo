/**
 * Create Reminder Handler
 * Split Lease - Reminder House Manual Feature
 *
 * Creates a new reminder in the database
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { CreateReminderPayload, CreateReminderResult, Reminder } from "../lib/types.ts";

/**
 * Generate a unique Bubble-compatible ID
 */
const generateReminderId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 17; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Handle create reminder action
 */
export const handleCreate = async (
  payload: CreateReminderPayload,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<CreateReminderResult> => {
  console.log('[create] Creating reminder for house manual:', payload.houseManualId);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Generate unique ID
  const reminderId = generateReminderId();
  const now = new Date().toISOString();

  // Build the reminder record
  const reminderRecord = {
    id: reminderId,
    house_manual: payload.houseManualId,
    created_by: payload.creatorId,
    message_to_send: payload.message,
    scheduled_date_and_time: payload.scheduledDateTime,
    is_an_email_reminder: payload.isEmailReminder,
    is_a_phone_reminder: payload.isSmsReminder,
    guest: payload.guestId || null,
    visit: payload.visitId || null,
    phone_number_in_case_no_guest_attached: payload.fallbackPhone || null,
    fallback_email: payload.fallbackEmail || null,
    type_of_reminders: payload.reminderType || 'custom',
    status: 'pending',
    delivery_status: 'pending',
    created_at: now,
    updated_at: now,
  };

  console.log('[create] Inserting reminder record');

  const { data, error } = await supabase
    .from('remindersfromhousemanual')
    .insert(reminderRecord)
    .select()
    .single();

  if (error) {
    console.error('[create] Insert error:', error);
    throw new Error(`Failed to create reminder: ${error.message}`);
  }

  console.log('[create] Reminder created successfully:', reminderId);

  return {
    reminder: data as Reminder,
    scheduled: true,
  };
};
