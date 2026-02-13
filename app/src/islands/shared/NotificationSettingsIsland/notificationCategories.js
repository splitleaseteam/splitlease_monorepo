/**
 * Notification Categories Configuration
 * Maps UI display to database column names in notificationsettingsos_lists_ table
 *
 * Each category stores an array of enum values: 'Email', 'SMS', 'In-App Message'
 */

// Enum values matching PostgreSQL notification channel enum
export const NOTIFICATION_CHANNELS = {
  EMAIL: 'Email',
  SMS: 'SMS',
  IN_APP: 'In-App Message'
};

export const NOTIFICATION_CATEGORIES = [
  {
    id: 'message_forwarding',
    label: 'Message Forwarding',
    description: 'Receive forwarded messages via your preferred channel',
    dbColumn: 'message_forwarding'
  },
  {
    id: 'payment_reminders',
    label: 'Payment Reminders',
    description: 'Billing and payment notifications',
    dbColumn: 'payment_reminders'
  },
  {
    id: 'promotional',
    label: 'Promotional',
    description: 'Marketing and promotional content',
    dbColumn: 'promotional'
  },
  {
    id: 'reservation_updates',
    label: 'Reservation Updates',
    description: 'Changes to your bookings',
    dbColumn: 'reservation_updates'
  },
  {
    id: 'lease_requests',
    label: 'Lease Requests',
    description: 'Lease-related inquiries',
    dbColumn: 'lease_requests'
  },
  {
    id: 'proposal_updates',
    label: 'Proposal Updates',
    description: 'Changes to proposals',
    dbColumn: 'proposal_updates'
  },
  {
    id: 'checkin_checkout',
    label: 'Check-in/Check-out Reminders',
    description: 'Guest arrival and departure alerts',
    dbColumn: 'check_in_out_reminders'
  },
  {
    id: 'reviews',
    label: 'Reviews',
    description: 'Rating and feedback notifications',
    dbColumn: 'reviews'
  },
  {
    id: 'tips_insights',
    label: 'Tips / Market Insights',
    description: 'Educational content and market analysis',
    dbColumn: 'tips_insights'
  },
  {
    id: 'account_assistance',
    label: 'Account Access Assistance',
    description: 'Help with account login and permissions',
    dbColumn: 'login_signup_assistance'
  },
  {
    id: 'virtual_meetings',
    label: 'Virtual Meetings',
    description: 'Video and online meeting notifications',
    dbColumn: 'virtual_meetings'
  }
];

/**
 * Get all database column names for queries
 */
export function getAllPreferenceColumns() {
  return NOTIFICATION_CATEGORIES.map(cat => cat.dbColumn);
}

/**
 * Get default preferences object
 * New users get sensible defaults: Email + SMS for most categories,
 * Email only for promotional content.
 */
export function getDefaultPreferences() {
  const defaults = {};
  NOTIFICATION_CATEGORIES.forEach(cat => {
    // Promotional content defaults to Email only (opt-in for SMS)
    // All other categories default to Email + SMS
    defaults[cat.dbColumn] = cat.id === 'promotional'
      ? [NOTIFICATION_CHANNELS.EMAIL]
      : [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS];
  });
  return defaults;
}

/**
 * Check if a channel is enabled for a category
 * @param {string[]} channelArray - The array of enabled channels
 * @param {string} channel - The channel to check (e.g., 'Email', 'SMS')
 * @returns {boolean}
 */
export function isChannelEnabled(channelArray, channel) {
  return Array.isArray(channelArray) && channelArray.includes(channel);
}

/**
 * Toggle a channel in an array (add if missing, remove if present)
 * @param {string[]} currentArray - Current array of channels
 * @param {string} channel - Channel to toggle
 * @returns {string[]} New array with channel toggled
 */
export function toggleChannelInArray(currentArray, channel) {
  const arr = Array.isArray(currentArray) ? [...currentArray] : [];
  const index = arr.indexOf(channel);
  if (index === -1) {
    arr.push(channel);
  } else {
    arr.splice(index, 1);
  }
  return arr;
}
