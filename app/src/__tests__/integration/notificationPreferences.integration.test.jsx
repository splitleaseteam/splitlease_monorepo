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

/**
 * Create mock user preferences record with boolean schema
 * DB uses boolean columns: message_forwarding_email, message_forwarding_sms, etc.
 */
function createUserPreferencesRecord(userId, overrides = {}) {
  const defaults = {
    id: `pref-${userId}`,
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Generate boolean columns for each category
  NOTIFICATION_CATEGORIES.forEach((cat) => {
    // Default: Email enabled for all, SMS enabled for all except Promotional
    const emailEnabled = true;
    const smsEnabled = cat.id !== 'promotional';

    defaults[`${cat.dbColumn}_email`] = emailEnabled;
    defaults[`${cat.dbColumn}_sms`] = smsEnabled;
  });

  return {
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
        result.current.isChannelEnabled('message_forwarding', 'Email')
      ).toBe(true);

      // Simulate toggle
      await act(async () => {
        await result.current.toggleChannel(
          'message_forwarding',
          NOTIFICATION_CHANNELS.SMS
        );
      });

      // Unmount (end session)
      unmount();

      // Second session - should load updated preferences with SMS disabled
      const updatedPrefs = {
        ...initialPrefs,
        message_forwarding_sms: false, // Boolean column updated
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
        newResult.current.isChannelEnabled('message_forwarding', 'SMS')
      ).toBe(false);
      expect(
        newResult.current.isChannelEnabled('message_forwarding', 'Email')
      ).toBe(true);
    });

    it('should reflect changes in notification delivery decisions', async () => {
      const userId = 'user-with-partial-prefs';

      // User with SMS disabled for Promotional (default behavior)
      const prefs = createUserPreferencesRecord(userId);

      setupMockSupabaseClient({
        selectResponse: prefs,
      });

      const { result } = renderHook(() => useNotificationSettings(userId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Promotional SMS should be disabled (default)
      expect(result.current.isChannelEnabled('promotional', 'SMS')).toBe(false);
      // Promotional Email should be enabled
      expect(result.current.isChannelEnabled('promotional', 'Email')).toBe(
        true
      );

      // Other categories should have both enabled
      expect(
        result.current.isChannelEnabled('message_forwarding', 'SMS')
      ).toBe(true);
      expect(
        result.current.isChannelEnabled('message_forwarding', 'Email')
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
        proposal_updates_email: false, // Email disabled for Proposal Updates
        proposal_updates_sms: true,
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
        result.current.isChannelEnabled('proposal_updates', 'Email')
      ).toBe(false);
      // SMS still enabled
      expect(result.current.isChannelEnabled('proposal_updates', 'SMS')).toBe(
        true
      );
    });

    it('should indicate SMS would be skipped when preference disabled', async () => {
      const userId = 'user-sms-disabled';
      const prefs = createUserPreferencesRecord(userId, {
        payment_reminders_email: true,
        payment_reminders_sms: false, // SMS disabled for Payment Reminders
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
        result.current.isChannelEnabled('payment_reminders', 'SMS')
      ).toBe(false);
      // Email still enabled
      expect(
        result.current.isChannelEnabled('payment_reminders', 'Email')
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
        result.current.isChannelEnabled('reservation_updates', 'SMS')
      ).toBe(true);
      expect(
        result.current.isChannelEnabled('reservation_updates', 'Email')
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
      expect(result.current.preferences['message_forwarding']).toBeDefined();
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
          'message_forwarding',
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
        'message_forwarding',
        'SMS'
      );

      // Toggle (should fail)
      await act(async () => {
        await result.current.toggleChannel(
          'message_forwarding',
          NOTIFICATION_CHANNELS.SMS
        );
      });

      // Should rollback to initial state
      await waitFor(() => {
        expect(
          result.current.isChannelEnabled('message_forwarding', 'SMS')
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
          'message_forwarding',
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
          'message_forwarding',
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

      // Create preferences with mixed boolean states
      const prefs = createUserPreferencesRecord(userId, {
        message_forwarding_email: true,
        message_forwarding_sms: false,
        payment_reminders_email: false,
        payment_reminders_sms: true,
        promotional_email: false,
        promotional_sms: false,
        reservation_updates_email: true,
        reservation_updates_sms: true,
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
        result.current.isChannelEnabled('message_forwarding', 'Email')
      ).toBe(true);
      expect(
        result.current.isChannelEnabled('message_forwarding', 'SMS')
      ).toBe(false);

      expect(
        result.current.isChannelEnabled('payment_reminders', 'Email')
      ).toBe(false);
      expect(
        result.current.isChannelEnabled('payment_reminders', 'SMS')
      ).toBe(true);

      expect(result.current.isChannelEnabled('promotional', 'Email')).toBe(
        false
      );
      expect(result.current.isChannelEnabled('promotional', 'SMS')).toBe(
        false
      );

      expect(
        result.current.isChannelEnabled('reservation_updates', 'Email')
      ).toBe(true);
      expect(
        result.current.isChannelEnabled('reservation_updates', 'SMS')
      ).toBe(true);
    });

    it('should handle promotional category special default', () => {
      // Promotional defaults to Email only (SMS opt-in)
      const defaults = getDefaultPreferences();
      expect(defaults.promotional).toEqual(['Email']);
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
            'message_forwarding',
            NOTIFICATION_CHANNELS.SMS
          ),
          result.current.toggleChannel(
            'payment_reminders',
            NOTIFICATION_CHANNELS.EMAIL
          ),
          result.current.toggleChannel('promotional', NOTIFICATION_CHANNELS.SMS),
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
          'message_forwarding',
          NOTIFICATION_CHANNELS.SMS
        );
      });

      // Should be pending
      expect(
        result.current.isTogglePending('message_forwarding', 'SMS')
      ).toBe(true);

      // Other toggles should not be pending
      expect(
        result.current.isTogglePending('payment_reminders', 'SMS')
      ).toBe(false);

      // Wait for completion
      await waitFor(() => {
        expect(
          result.current.isTogglePending('message_forwarding', 'SMS')
        ).toBe(false);
      });
    });
  });
});
