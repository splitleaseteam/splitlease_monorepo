import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationSettings } from '../useNotificationSettings.js';
import { getDefaultPreferences, NOTIFICATION_CHANNELS } from '../notificationCategories.js';

vi.mock('../../../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn()
  }
}));

import { supabase } from '../../../../lib/supabase.js';

function setupSupabase({ selectData = null, selectError = null, updateError = null } = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: selectData, error: selectError });
  const selectEq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq: selectEq }));

  const updateEq = vi.fn().mockResolvedValue({ error: updateError });
  const update = vi.fn(() => ({ eq: updateEq }));

  supabase.from.mockReturnValue({ select, update });
  return { maybeSingle, updateEq };
}

describe('useNotificationSettings', () => {
  beforeEach(() => {
    window.showToast = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete window.showToast;
  });

  it('loads defaults when no row is returned', async () => {
    setupSupabase({ selectData: null, selectError: null });

    const { result } = renderHook(() => useNotificationSettings('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.preferences).toEqual(getDefaultPreferences());
    expect(result.current.error).toBeNull();
  });

  it('loads and toggles snake_case preference columns', async () => {
    const row = {
      id: 'pref-1',
      created_by: 'user-1',
      ...getDefaultPreferences(),
      message_forwarding: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS]
    };

    const { updateEq } = setupSupabase({ selectData: row });
    const { result } = renderHook(() => useNotificationSettings('user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isChannelEnabled('message_forwarding', NOTIFICATION_CHANNELS.SMS)).toBe(true);

    await act(async () => {
      await result.current.toggleChannel('message_forwarding', NOTIFICATION_CHANNELS.SMS);
    });

    expect(updateEq).toHaveBeenCalled();
    expect(result.current.isChannelEnabled('message_forwarding', NOTIFICATION_CHANNELS.SMS)).toBe(false);
  });

  it('surfaces fetch errors', async () => {
    setupSupabase({ selectData: null, selectError: { message: 'Database error' } });

    const { result } = renderHook(() => useNotificationSettings('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Database error');
  });
});
