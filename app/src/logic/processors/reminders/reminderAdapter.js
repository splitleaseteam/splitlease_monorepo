/**
 * Reminder data adapters.
 * Transform data between form, API, and database formats.
 * DB table: remindersfromhousemanual
 */

/**
 * Adapt form data for API submission.
 *
 * @param {object} params - Named parameters.
 * @param {object} params.formData - Form data from the UI.
 * @param {string} params.houseManualId - House manual ID.
 * @param {string} params.creatorId - Creator user ID.
 * @returns {object} Payload ready for API submission.
 */
export function adaptReminderForSubmission({ formData, houseManualId, creatorId }) {
  return {
    houseManualId,
    creatorId,
    message: formData.message?.trim() || '',
    scheduledDateTime: formData.scheduledDateTime instanceof Date
      ? formData.scheduledDateTime.toISOString()
      : formData.scheduledDateTime,
    isEmailReminder: Boolean(formData.isEmailReminder),
    isSmsReminder: Boolean(formData.isSmsReminder),
    guestId: formData.guestId || undefined,
    fallbackPhone: formData.fallbackPhone?.trim() || undefined,
    reminderType: formData.reminderType || 'custom',
  };
}

/**
 * Adapt database record to UI format.
 * Maps snake_case columns from remindersfromhousemanual table to camelCase.
 *
 * @param {object} params - Named parameters.
 * @param {object} params.dbRow - Database row from remindersfromhousemanual table.
 * @returns {object} UI-friendly reminder object.
 */
export function adaptReminderFromDatabase({ dbRow }) {
  if (!dbRow) {
    return null;
  }

  return {
    id: dbRow.id,
    houseManualId: dbRow.house_manual,
    guestId: dbRow.guest,
    creatorId: dbRow.created_by,
    message: dbRow.message_to_send,
    scheduledDateTime: dbRow.scheduled_date_and_time,
    isEmailReminder: Boolean(dbRow.is_an_email_reminder),
    isSmsReminder: Boolean(dbRow.is_a_phone_reminder),
    fallbackPhone: dbRow.phone_number_in_case_no_guest_attached,
    reminderType: dbRow.type_of_reminders || 'custom',
    emailSchedulerCode: dbRow.api_scheduled_code_for_email,
    smsSchedulerCode: dbRow.api_scheduled_code_for_sms,
    pending: dbRow.pending,
    createdAt: dbRow.original_created_at,
    modifiedAt: dbRow.original_updated_at,
  };
}

/**
 * Adapt multiple database records to UI format.
 *
 * @param {object} params - Named parameters.
 * @param {Array} params.dbRows - Array of database rows.
 * @returns {Array} Array of UI-friendly reminder objects.
 */
export function adaptRemindersFromDatabase({ dbRows }) {
  if (!Array.isArray(dbRows)) {
    return [];
  }

  return dbRows.map(row => adaptReminderFromDatabase({ dbRow: row }));
}

/**
 * Adapt update form data for API submission.
 *
 * @param {object} params - Named parameters.
 * @param {string} params.reminderId - Reminder ID to update.
 * @param {object} params.updates - Fields to update.
 * @returns {object} Payload ready for API submission.
 */
export function adaptReminderUpdateForSubmission({ reminderId, updates }) {
  const payload = { reminderId };

  if (updates.message !== undefined) {
    payload.message = updates.message?.trim() || '';
  }

  if (updates.scheduledDateTime !== undefined) {
    payload.scheduledDateTime = updates.scheduledDateTime instanceof Date
      ? updates.scheduledDateTime.toISOString()
      : updates.scheduledDateTime;
  }

  if (updates.isEmailReminder !== undefined) {
    payload.isEmailReminder = Boolean(updates.isEmailReminder);
  }

  if (updates.isSmsReminder !== undefined) {
    payload.isSmsReminder = Boolean(updates.isSmsReminder);
  }

  if (updates.fallbackPhone !== undefined) {
    payload.fallbackPhone = updates.fallbackPhone?.trim() || undefined;
  }

  if (updates.reminderType !== undefined) {
    payload.reminderType = updates.reminderType;
  }

  return payload;
}
