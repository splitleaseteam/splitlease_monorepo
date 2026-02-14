import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationSettings } from '../../islands/shared/NotificationSettingsIsland/useNotificationSettings.js';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  getDefaultPreferences
} from '../../islands/shared/NotificationSettingsIsland/notificationCategories.js';

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn()
  }
}));

import { supabase } from '../../lib/supabase.js';

const mockShowToast = vi.fn();

function createPreferencesRow(userId, overrides = {}) {
  return {
    id: `pref-${userId}`,
    created_by: userId,
    ...getDefaultPreferences(),
    ...overrides
  };
}

function setupSupabase({ selectData = null, selectError = null, updateError = null } = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: selectData, error: selectError });
  const selectEq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq: selectEq }));

  const updateEq = vi.fn().mockResolvedValue({ error: updateError });
  const update = vi.fn(() => ({ eq: updateEq }));

  supabase.from.mockReturnValue({ select, update });

  return { maybeSingle, updateEq };
}

describe('Notification Preferences Integration', () => {
  beforeEach(() => {
    window.showToast = mockShowToast;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete window.showToast;
  });

  it('loads defaults when no preference row exists', async () => {
    setupSupabase({ selectData: null, selectError: null });

    const { result } = renderHook(() => useNotificationSettings('new-user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.preferences).toEqual(getDefaultPreferences());
  });

  it('loads existing snake_case preference columns', async () => {
    const row = createPreferencesRow('existing-user-1', {
      promotional: [NOTIFICATION_CHANNELS.EMAIL],
      message_forwarding: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS]
    });
    setupSupabase({ selectData: row });

    const { result } = renderHook(() => useNotificationSettings('existing-user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isChannelEnabled('promotional', NOTIFICATION_CHANNELS.SMS)).toBe(false);
    expect(result.current.isChannelEnabled('message_forwarding', NOTIFICATION_CHANNELS.SMS)).toBe(true);
  });

  it('persists toggle updates using snake_case db column names', async () => {
    const row = createPreferencesRow('toggle-user-1');
    const { updateEq } = setupSupabase({ selectData: row });

    const { result } = renderHook(() => useNotificationSettings('toggle-user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleChannel('message_forwarding', NOTIFICATION_CHANNELS.SMS);
    });

    expect(updateEq).toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('Preference updated', 'success');
  });

  it('rolls back optimistic update and shows toast on update failure', async () => {
    const row = createPreferencesRow('toggle-user-2');
    setupSupabase({ selectData: row, updateError: { message: 'Update failed' } });

    const { result } = renderHook(() => useNotificationSettings('toggle-user-2'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const before = result.current.isChannelEnabled('message_forwarding', NOTIFICATION_CHANNELS.SMS);

    await act(async () => {
      await result.current.toggleChannel('message_forwarding', NOTIFICATION_CHANNELS.SMS);
    });

    expect(result.current.isChannelEnabled('message_forwarding', NOTIFICATION_CHANNELS.SMS)).toBe(before);
    expect(mockShowToast).toHaveBeenCalledWith('Failed to update preference', 'error');
  });

  it('exposes all category defaults via dbColumn keys', () => {
    const defaults = getDefaultPreferences();
    expect(NOTIFICATION_CATEGORIES).toHaveLength(11);
    NOTIFICATION_CATEGORIES.forEach((cat) => {
      expect(defaults[cat.dbColumn]).toBeDefined();
    });
  });
});
