import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  getAllPreferenceColumns,
  getDefaultPreferences,
  isChannelEnabled,
  toggleChannelInArray
} from '../notificationCategories.js';

describe('notificationCategories', () => {
  it('exports expected category metadata and snake_case db columns', () => {
    expect(NOTIFICATION_CATEGORIES).toHaveLength(11);
    const columns = NOTIFICATION_CATEGORIES.map((cat) => cat.dbColumn);
    expect(columns).toContain('message_forwarding');
    expect(columns).toContain('check_in_out_reminders');
    expect(columns).toContain('login_signup_assistance');
  });

  it('returns db column list and defaults keyed by db columns', () => {
    const columns = getAllPreferenceColumns();
    const defaults = getDefaultPreferences();

    expect(columns).toHaveLength(11);
    columns.forEach((column) => expect(defaults[column]).toBeDefined());
    expect(defaults.promotional).toEqual([NOTIFICATION_CHANNELS.EMAIL]);
    expect(defaults.message_forwarding).toEqual([
      NOTIFICATION_CHANNELS.EMAIL,
      NOTIFICATION_CHANNELS.SMS
    ]);
  });

  it('supports channel helpers', () => {
    expect(isChannelEnabled(['Email', 'SMS'], 'SMS')).toBe(true);
    expect(isChannelEnabled(['Email'], 'SMS')).toBe(false);

    expect(toggleChannelInArray(['Email'], 'SMS')).toEqual(['Email', 'SMS']);
    expect(toggleChannelInArray(['Email', 'SMS'], 'SMS')).toEqual(['Email']);
  });
});
