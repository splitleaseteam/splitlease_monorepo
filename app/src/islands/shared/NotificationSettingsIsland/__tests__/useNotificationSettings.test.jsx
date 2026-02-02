/**
 * Tests for useNotificationSettings hook
 *
 * Tests the notification preferences management hook including:
 * - Initial fetch behavior
 * - Toggle preference functionality
 * - Optimistic updates and rollback
 * - Error handling
 * - Refetch capability
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationSettings } from '../useNotificationSettings.js';
import { getDefaultPreferences } from '../notificationCategories.js';

// Mock the supabase client
vi.mock('../../../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Get the mocked supabase
import { supabase } from '../../../../lib/supabase.js';

// Mock window.showToast
const mockShowToast = vi.fn();
beforeEach(() => {
  window.showToast = mockShowToast;
});

afterEach(() => {
  delete window.showToast;
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────
// Test Data Factory
// ─────────────────────────────────────────────────────────────

const mockPreferencesData = {
  _id: 'pref-123',
  'Created By': 'user-123',
  'Message Forwarding': ['Email', 'SMS'],
  'Payment Reminders': ['Email'],
  Promotional: [],
  'Reservation Updates': ['Email', 'SMS'],
  'Lease Requests': ['Email'],
  'Proposal Updates': ['Email', 'SMS'],
  'Check In/Out Reminders': ['Email'],
  Reviews: ['Email', 'SMS'],
  'Tips/Insights': [],
  'Login/Signup Assistance': ['Email'],
  'Virtual Meetings': ['Email', 'SMS'],
};

function createMockSupabaseResponse(data, error = null) {
  return {
    data,
    error,
  };
}

function setupMockFrom(selectResponse, updateResponse = null) {
  const mockSingle = vi.fn().mockResolvedValue(selectResponse);
  const mockEq = vi.fn(() => ({ single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockUpdate = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue(updateResponse || { error: null }),
  }));

  supabase.from.mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
  });

  return { mockSelect, mockEq, mockSingle, mockUpdate };
}

// ─────────────────────────────────────────────────────────────
// Initial Fetch Tests
// ─────────────────────────────────────────────────────────────

describe('useNotificationSettings', () => {
  describe('initial fetch', () => {
    it('should fetch preferences on mount', async () => {
      setupMockFrom(createMockSupabaseResponse(mockPreferencesData));

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledWith('notificationsettingsos_lists_');
      expect(result.current.preferences).toBeDefined();
    });

    it('should set loading state during fetch', async () => {
      // Delay the response
      const mockSingle = vi.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve(createMockSupabaseResponse(mockPreferencesData)),
              100
            )
          )
      );
      const mockEq = vi.fn(() => ({ single: mockSingle }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));

      supabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      // Initially loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle fetch error gracefully', async () => {
      setupMockFrom(
        createMockSupabaseResponse(null, { message: 'Database error' })
      );

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Database error');
    });

    it('should handle PGRST116 (no rows found) for new users', async () => {
      setupMockFrom(
        createMockSupabaseResponse(null, {
          message: 'No rows found',
          code: 'PGRST116',
        })
      );

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should use default preferences without error
      expect(result.current.error).toBeNull();
      expect(result.current.preferences).toEqual(getDefaultPreferences());
    });

    it('should handle null userId', async () => {
      const { result } = renderHook(() => useNotificationSettings(null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not attempt fetch
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should handle undefined userId', async () => {
      const { result } = renderHook(() => useNotificationSettings(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Toggle Preference Tests
  // ─────────────────────────────────────────────────────────────

  describe('toggleChannel', () => {
    it('should update state immediately (optimistic)', async () => {
      setupMockFrom(createMockSupabaseResponse(mockPreferencesData));

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Initial state: Message Forwarding has ['Email', 'SMS']
      expect(
        result.current.isChannelEnabled('Message Forwarding', 'SMS')
      ).toBe(true);

      // Toggle SMS off
      act(() => {
        result.current.toggleChannel('Message Forwarding', 'SMS');
      });

      // Optimistic update should happen immediately
      expect(
        result.current.isChannelEnabled('Message Forwarding', 'SMS')
      ).toBe(false);
    });

    it('should persist change to Supabase', async () => {
      const { mockUpdate } = setupMockFrom(
        createMockSupabaseResponse(mockPreferencesData)
      );

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleChannel('Message Forwarding', 'SMS');
      });

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should rollback on Supabase error', async () => {
      const mockUpdateResponse = { error: { message: 'Update failed' } };
      setupMockFrom(
        createMockSupabaseResponse(mockPreferencesData),
        mockUpdateResponse
      );

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Initial state
      const initialState = result.current.isChannelEnabled(
        'Message Forwarding',
        'SMS'
      );

      await act(async () => {
        await result.current.toggleChannel('Message Forwarding', 'SMS');
      });

      // Should rollback to initial state
      await waitFor(() => {
        expect(
          result.current.isChannelEnabled('Message Forwarding', 'SMS')
        ).toBe(initialState);
      });
    });

    it('should show toast on success', async () => {
      setupMockFrom(createMockSupabaseResponse(mockPreferencesData));

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleChannel('Message Forwarding', 'SMS');
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Preference updated',
        'success'
      );
    });

    it('should show error toast on failure', async () => {
      setupMockFrom(
        createMockSupabaseResponse(mockPreferencesData),
        { error: { message: 'Update failed' } }
      );

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleChannel('Message Forwarding', 'SMS');
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Failed to update preference',
        'error'
      );
    });

    it('should set isTogglePending during update', async () => {
      // Create a slow update
      const slowUpdate = vi.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ error: null }), 100)
          )
      );

      const mockSingle = vi
        .fn()
        .mockResolvedValue(createMockSupabaseResponse(mockPreferencesData));
      const mockEq = vi.fn(() => ({ single: mockSingle }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));

      supabase.from.mockReturnValue({
        select: mockSelect,
        update: vi.fn(() => ({ eq: slowUpdate })),
      });

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start toggle
      act(() => {
        result.current.toggleChannel('Message Forwarding', 'SMS');
      });

      // Should be pending
      expect(
        result.current.isTogglePending('Message Forwarding', 'SMS')
      ).toBe(true);

      // Wait for completion
      await waitFor(() => {
        expect(
          result.current.isTogglePending('Message Forwarding', 'SMS')
        ).toBe(false);
      });
    });

    it('should clear isTogglePending after update', async () => {
      setupMockFrom(createMockSupabaseResponse(mockPreferencesData));

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleChannel('Message Forwarding', 'SMS');
      });

      expect(
        result.current.isTogglePending('Message Forwarding', 'SMS')
      ).toBe(false);
    });

    it('should not toggle when userId is missing', async () => {
      setupMockFrom(createMockSupabaseResponse(mockPreferencesData));

      const { result } = renderHook(() => useNotificationSettings(null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const response = await act(async () => {
        return await result.current.toggleChannel('Message Forwarding', 'SMS');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('User preferences not loaded');
    });

    it('should not toggle when recordId is missing', async () => {
      // No data returned, so no recordId
      setupMockFrom(
        createMockSupabaseResponse(null, {
          message: 'No rows',
          code: 'PGRST116',
        })
      );

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const response = await act(async () => {
        return await result.current.toggleChannel('Message Forwarding', 'SMS');
      });

      expect(response.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Refetch Tests
  // ─────────────────────────────────────────────────────────────

  describe('refetch', () => {
    it('should reload preferences from database', async () => {
      const { mockSingle } = setupMockFrom(
        createMockSupabaseResponse(mockPreferencesData)
      );

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock call count
      mockSingle.mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      // Should have called single() again
      expect(mockSingle).toHaveBeenCalled();
    });

    it('should update state with fresh data', async () => {
      const initialData = { ...mockPreferencesData };
      const updatedData = {
        ...mockPreferencesData,
        'Message Forwarding': ['Email'], // SMS removed
      };

      const mockSingle = vi
        .fn()
        .mockResolvedValueOnce(createMockSupabaseResponse(initialData))
        .mockResolvedValueOnce(createMockSupabaseResponse(updatedData));

      const mockEq = vi.fn(() => ({ single: mockSingle }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));

      supabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Initial state has SMS
      expect(
        result.current.isChannelEnabled('Message Forwarding', 'SMS')
      ).toBe(true);

      await act(async () => {
        await result.current.refetch();
      });

      // After refetch, SMS should be removed
      expect(
        result.current.isChannelEnabled('Message Forwarding', 'SMS')
      ).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // isChannelEnabled Tests
  // ─────────────────────────────────────────────────────────────

  describe('isChannelEnabled', () => {
    it('should return true when channel is in array', async () => {
      setupMockFrom(createMockSupabaseResponse(mockPreferencesData));

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(
        result.current.isChannelEnabled('Message Forwarding', 'Email')
      ).toBe(true);
      expect(
        result.current.isChannelEnabled('Message Forwarding', 'SMS')
      ).toBe(true);
    });

    it('should return false when channel is not in array', async () => {
      setupMockFrom(createMockSupabaseResponse(mockPreferencesData));

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Promotional has empty array
      expect(result.current.isChannelEnabled('Promotional', 'Email')).toBe(
        false
      );
      expect(result.current.isChannelEnabled('Promotional', 'SMS')).toBe(
        false
      );
    });

    it('should return false for non-existent column', async () => {
      setupMockFrom(createMockSupabaseResponse(mockPreferencesData));

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(
        result.current.isChannelEnabled('Non Existent', 'Email')
      ).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle network timeout', async () => {
      const mockSingle = vi
        .fn()
        .mockRejectedValue(new Error('Network timeout'));
      const mockEq = vi.fn(() => ({ single: mockSingle }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));

      supabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network timeout');
    });

    it('should handle malformed response', async () => {
      // Response with missing expected fields
      setupMockFrom(
        createMockSupabaseResponse({
          _id: 'pref-123',
          // Missing most fields
        })
      );

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not crash
      expect(result.current.preferences).toBeDefined();
    });

    it('should expose CHANNELS constant', async () => {
      setupMockFrom(createMockSupabaseResponse(mockPreferencesData));

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      expect(result.current.CHANNELS).toBeDefined();
      expect(result.current.CHANNELS.EMAIL).toBe('Email');
      expect(result.current.CHANNELS.SMS).toBe('SMS');
    });

    it('should handle toggling same preference multiple times quickly', async () => {
      setupMockFrom(createMockSupabaseResponse(mockPreferencesData));

      const { result } = renderHook(() => useNotificationSettings('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Toggle multiple times quickly
      await act(async () => {
        const promise1 = result.current.toggleChannel('Message Forwarding', 'SMS');
        const promise2 = result.current.toggleChannel('Message Forwarding', 'SMS');

        await Promise.all([promise1, promise2]);
      });

      // Should not crash, final state depends on implementation
    });
  });
});
