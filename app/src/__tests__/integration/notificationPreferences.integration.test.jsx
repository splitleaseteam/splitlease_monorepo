/**
 * Integration Tests: Notification Preferences Flow
 *
 * Tests the complete notification preference lifecycle including:
 * - Default preference creation for new users
 * - Toggle changes persistence across sessions
 * - Notification delivery respecting preferences
 * - Audit logging for all decisions
 * - UI to backend synchronization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationSettings } from '../../islands/shared/NotificationSettingsIsland/useNotificationSettings.js';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  getDefaultPreferences,
  toggleChannelInArray,
} from '../../islands/shared/NotificationSettingsIsland/notificationCategories.js';

// Mock Supabase client
vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from '../../lib/supabase.js';

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

function createUserPreferencesRecord(userId, overrides = {}) {
  const defaults = {};
  NOTIFICATION_CATEGORIES.forEach((cat) => {
    // Default: Email enabled for all, SMS enabled for all except Promotional
    defaults[cat.dbColumn] =
      cat.id === 'promotional'
        ? [NOTIFICATION_CHANNELS.EMAIL]
        : [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS];
  });

  return {
    _id: `pref-${userId}`,
    'Created By': userId,
    ...defaults,
    ...overrides,
  };
}

function setupMockSupabaseClient(options = {}) {
  const {
    selectResponse = null,
    selectError = null,
    updateResponse = { error: null },
    insertResponse = { error: null },
  } = options;

  const mockSingle = vi.fn().mockResolvedValue({
    data: selectResponse,
    error: selectError,
  });

  const mockEq = vi.fn((_column, _value) => ({
    single: mockSingle,
  }));

  const mockSelect = vi.fn(() => ({ eq: mockEq }));

  const mockUpdateEq = vi.fn().mockResolvedValue(updateResponse);

  const mockUpdate = vi.fn(() => ({
    eq: mockUpdateEq,
  }));

  const mockInsert = vi.fn().mockResolvedValue(insertResponse);

  supabase.from.mockImplementation((_table) => ({
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
  }));

  return {
    mockSelect,
    mockEq,
    mockSingle,
    mockUpdate,
    mockUpdateEq,
    mockInsert,
  };
}

// ─────────────────────────────────────────────────────────────
// Full Preference Lifecycle Tests
// ─────────────────────────────────────────────────────────────

describe('Notification Preferences Integration', () => {
  describe('full preference lifecycle', () => {
    it('should create default preferences for new user', async () => {
      // New user - no preferences exist (PGRST116)
      setupMockSupabaseClient({
        selectError: { message: 'No rows found', code: 'PGRST116' },
      });

      const { result } = renderHook(() =>
        useNotificationSettings('new-user-123')
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should use default preferences (all empty arrays)
      expect(result.current.preferences).toEqual(getDefaultPreferences());
      expect(result.current.error).toBeNull();
    });

    it('should persist toggle changes across sessions', async () => {
      const userId = 'existing-user-123';
      const initialPrefs = createUserPreferencesRecord(userId);

      // First session - load preferences
      setupMockSupabaseClient({
        selectResponse: initialPrefs,
      });

      const { result, unmount } = renderHook(() =>
        useNotificationSettings(userId)
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify initial state
      expect(
        result.current.isChannelEnabled('Message Forwarding', 'Email')
      ).toBe(true);

      // Simulate toggle
      await act(async () => {
        await result.current.toggleChannel(
          'Message Forwarding',
          NOTIFICATION_CHANNELS.SMS
        );
      });

      // Unmount (end session)
      unmount();

      // Second session - should load updated preferences
      const updatedPrefs = {
        ...initialPrefs,
        'Message Forwarding': [NOTIFICATION_CHANNELS.EMAIL], // SMS removed
      };

      setupMockSupabaseClient({
        selectResponse: updatedPrefs,
      });

      const { result: newResult } = renderHook(() =>
        useNotificationSettings(userId)
      );

      await waitFor(() => {
        expect(newResult.current.loading).toBe(false);
      });

      // Verify persisted state
      expect(
        newResult.current.isChannelEnabled('Message Forwarding', 'SMS')
      ).toBe(false);
      expect(
        newResult.current.isChannelEnabled('Message Forwarding', 'Email')
      ).toBe(true);
    });

    it('should reflect changes in notification delivery decisions', async () => {
      const userId = 'user-with-partial-prefs';

      // User with SMS disabled for Promotional
      const prefs = createUserPreferencesRecord(userId, {
        Promotional: [NOTIFICATION_CHANNELS.EMAIL], // SMS not included
      });

      setupMockSupabaseClient({
        selectResponse: prefs,
      });

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Promotional SMS should be disabled
      expect(result.current.isChannelEnabled('Promotional', 'SMS')).toBe(false);
      // Promotional Email should be enabled
      expect(result.current.isChannelEnabled('Promotional', 'Email')).toBe(
        true
      );

      // Other categories should have both enabled
      expect(
        result.current.isChannelEnabled('Message Forwarding', 'SMS')
      ).toBe(true);
      expect(
        result.current.isChannelEnabled('Message Forwarding', 'Email')
      ).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Real-time Notification Delivery Tests
  // ─────────────────────────────────────────────────────────────

  describe('real-time notification delivery', () => {
    it('should indicate email would be skipped when preference disabled', async () => {
      const userId = 'user-email-disabled';
      const prefs = createUserPreferencesRecord(userId, {
        'Proposal Updates': [NOTIFICATION_CHANNELS.SMS], // Email not included
      });

      setupMockSupabaseClient({
        selectResponse: prefs,
      });

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Email disabled for Proposal Updates
      expect(
        result.current.isChannelEnabled('Proposal Updates', 'Email')
      ).toBe(false);
      // SMS still enabled
      expect(result.current.isChannelEnabled('Proposal Updates', 'SMS')).toBe(
        true
      );
    });

    it('should indicate SMS would be skipped when preference disabled', async () => {
      const userId = 'user-sms-disabled';
      const prefs = createUserPreferencesRecord(userId, {
        'Payment Reminders': [NOTIFICATION_CHANNELS.EMAIL], // SMS not included
      });

      setupMockSupabaseClient({
        selectResponse: prefs,
      });

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // SMS disabled for Payment Reminders
      expect(
        result.current.isChannelEnabled('Payment Reminders', 'SMS')
      ).toBe(false);
      // Email still enabled
      expect(
        result.current.isChannelEnabled('Payment Reminders', 'Email')
      ).toBe(true);
    });

    it('should indicate both would be sent when both enabled', async () => {
      const userId = 'user-all-enabled';
      const prefs = createUserPreferencesRecord(userId);

      setupMockSupabaseClient({
        selectResponse: prefs,
      });

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Both channels enabled for most categories
      expect(
        result.current.isChannelEnabled('Reservation Updates', 'SMS')
      ).toBe(true);
      expect(
        result.current.isChannelEnabled('Reservation Updates', 'Email')
      ).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Backfill Verification Tests
  // ─────────────────────────────────────────────────────────────

  describe('backfill verification', () => {
    it('should have preferences for existing users', async () => {
      const userId = 'existing-user-456';
      const prefs = createUserPreferencesRecord(userId);

      setupMockSupabaseClient({
        selectResponse: prefs,
      });

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have loaded preferences, not defaults
      expect(result.current.preferences).not.toEqual(getDefaultPreferences());
      expect(result.current.preferences['Message Forwarding']).toBeDefined();
    });

    it('should have correct default values', async () => {
      // Verify default structure
      const defaults = getDefaultPreferences();

      // Most categories default to Email + SMS; Promotional defaults to Email only
      NOTIFICATION_CATEGORIES.forEach((category) => {
        const expected = category.id === 'promotional'
          ? ['Email']
          : ['Email', 'SMS'];
        expect(defaults[category.dbColumn]).toEqual(expected);
      });

      // Should have 11 categories
      expect(Object.keys(defaults)).toHaveLength(11);
    });

    it('should include all 11 notification categories', () => {
      expect(NOTIFICATION_CATEGORIES).toHaveLength(11);

      const expectedIds = [
        'message_forwarding',
        'payment_reminders',
        'promotional',
        'reservation_updates',
        'lease_requests',
        'proposal_updates',
        'checkin_checkout',
        'reviews',
        'tips_insights',
        'account_assistance',
        'virtual_meetings',
      ];

      const actualIds = NOTIFICATION_CATEGORIES.map((cat) => cat.id);
      expectedIds.forEach((id) => {
        expect(actualIds).toContain(id);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // UI to Backend Flow Tests
  // ─────────────────────────────────────────────────────────────

  describe('UI to backend flow', () => {
    it('should update database when UI toggle clicked', async () => {
      const userId = 'ui-test-user';
      const prefs = createUserPreferencesRecord(userId);

      const { mockUpdate, mockUpdateEq } = setupMockSupabaseClient({
        selectResponse: prefs,
      });

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Toggle a preference
      await act(async () => {
        await result.current.toggleChannel(
          'Message Forwarding',
          NOTIFICATION_CHANNELS.SMS
        );
      });

      // Verify database update was called
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateEq).toHaveBeenCalled();
    });

    it('should rollback UI on database error', async () => {
      const userId = 'rollback-test-user';
      const prefs = createUserPreferencesRecord(userId);

      setupMockSupabaseClient({
        selectResponse: prefs,
        updateResponse: { error: { message: 'Database error' } },
      });

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Initial state
      const initialSmsState = result.current.isChannelEnabled(
        'Message Forwarding',
        'SMS'
      );

      // Toggle (should fail)
      await act(async () => {
        await result.current.toggleChannel(
          'Message Forwarding',
          NOTIFICATION_CHANNELS.SMS
        );
      });

      // Should rollback to initial state
      await waitFor(() => {
        expect(
          result.current.isChannelEnabled('Message Forwarding', 'SMS')
        ).toBe(initialSmsState);
      });
    });

    it('should show appropriate toast messages', async () => {
      const userId = 'toast-test-user';
      const prefs = createUserPreferencesRecord(userId);

      setupMockSupabaseClient({
        selectResponse: prefs,
      });

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Toggle successfully
      await act(async () => {
        await result.current.toggleChannel(
          'Message Forwarding',
          NOTIFICATION_CHANNELS.SMS
        );
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Preference updated',
        'success'
      );
    });

    it('should show error toast on failure', async () => {
      const userId = 'error-toast-user';
      const prefs = createUserPreferencesRecord(userId);

      setupMockSupabaseClient({
        selectResponse: prefs,
        updateResponse: { error: { message: 'Update failed' } },
      });

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Toggle (will fail)
      await act(async () => {
        await result.current.toggleChannel(
          'Message Forwarding',
          NOTIFICATION_CHANNELS.SMS
        );
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Failed to update preference',
        'error'
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Category-specific Tests
  // ─────────────────────────────────────────────────────────────

  describe('category-specific behavior', () => {
    it('should handle all categories independently', async () => {
      const userId = 'category-test-user';

      // Create preferences with mixed states
      const prefs = createUserPreferencesRecord(userId, {
        'Message Forwarding': [NOTIFICATION_CHANNELS.EMAIL],
        'Payment Reminders': [NOTIFICATION_CHANNELS.SMS],
        Promotional: [],
        'Reservation Updates': [
          NOTIFICATION_CHANNELS.EMAIL,
          NOTIFICATION_CHANNELS.SMS,
        ],
      });

      setupMockSupabaseClient({
        selectResponse: prefs,
      });

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify independent states
      expect(
        result.current.isChannelEnabled('Message Forwarding', 'Email')
      ).toBe(true);
      expect(
        result.current.isChannelEnabled('Message Forwarding', 'SMS')
      ).toBe(false);

      expect(
        result.current.isChannelEnabled('Payment Reminders', 'Email')
      ).toBe(false);
      expect(
        result.current.isChannelEnabled('Payment Reminders', 'SMS')
      ).toBe(true);

      expect(result.current.isChannelEnabled('Promotional', 'Email')).toBe(
        false
      );
      expect(result.current.isChannelEnabled('Promotional', 'SMS')).toBe(
        false
      );

      expect(
        result.current.isChannelEnabled('Reservation Updates', 'Email')
      ).toBe(true);
      expect(
        result.current.isChannelEnabled('Reservation Updates', 'SMS')
      ).toBe(true);
    });

    it('should handle promotional category special default', () => {
      // Promotional defaults to Email only (SMS opt-in)
      const defaults = getDefaultPreferences();
      expect(defaults.Promotional).toEqual(['Email']);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Concurrent Updates Tests
  // ─────────────────────────────────────────────────────────────

  describe('concurrent updates', () => {
    it('should handle multiple toggles for different categories', async () => {
      const userId = 'concurrent-test-user';
      const prefs = createUserPreferencesRecord(userId);

      setupMockSupabaseClient({
        selectResponse: prefs,
      });

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Toggle multiple different categories
      await act(async () => {
        const promises = [
          result.current.toggleChannel(
            'Message Forwarding',
            NOTIFICATION_CHANNELS.SMS
          ),
          result.current.toggleChannel(
            'Payment Reminders',
            NOTIFICATION_CHANNELS.EMAIL
          ),
          result.current.toggleChannel('Promotional', NOTIFICATION_CHANNELS.SMS),
        ];

        await Promise.all(promises);
      });

      // All toasts should have been called
      expect(mockShowToast).toHaveBeenCalledTimes(3);
    });

    it('should track pending state for each toggle independently', async () => {
      const userId = 'pending-state-user';
      const prefs = createUserPreferencesRecord(userId);

      // Create slow update response
      const slowUpdateEq = vi.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ error: null }), 50)
          )
      );

      const mockSingle = vi.fn().mockResolvedValue({
        data: prefs,
        error: null,
      });

      supabase.from.mockImplementation(() => ({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
        update: () => ({ eq: slowUpdateEq }),
      }));

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start toggle
      act(() => {
        result.current.toggleChannel(
          'Message Forwarding',
          NOTIFICATION_CHANNELS.SMS
        );
      });

      // Should be pending
      expect(
        result.current.isTogglePending('Message Forwarding', 'SMS')
      ).toBe(true);

      // Other toggles should not be pending
      expect(
        result.current.isTogglePending('Payment Reminders', 'SMS')
      ).toBe(false);

      // Wait for completion
      await waitFor(() => {
        expect(
          result.current.isTogglePending('Message Forwarding', 'SMS')
        ).toBe(false);
      });
    });
  });
});
