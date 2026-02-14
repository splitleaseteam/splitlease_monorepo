/**
 * useNotificationSettings Hook
 *
 * Manages notification preferences stored in public.notification_preferences table.
 * Boolean schema adapter: Converts between boolean columns (DB) and arrays (UI).
 * DB: message_forwarding_email (boolean), message_forwarding_sms (boolean)
 * UI: message_forwarding: ['Email', 'SMS']
 */

import { useState, useEffect, useCallback } from 'react';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation.js';
import { supabase } from '../../../lib/supabase.js';
import {
  getDefaultPreferences,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CATEGORIES
} from './notificationCategories.js';

const TABLE_NAME = 'public.notification_preferences';

/**
 * Transform database boolean columns to UI array format
 * @param {Object} dbRow - Raw database row with boolean columns
 * @returns {Object} UI preferences object with arrays
 */
function transformDbToUi(dbRow) {
  if (!dbRow) return getDefaultPreferences();

  const uiPreferences = {};

  NOTIFICATION_CATEGORIES.forEach(category => {
    const channels = [];

    // Check if email channel is enabled
    if (dbRow[`${category.dbColumn}_email`]) {
      channels.push(NOTIFICATION_CHANNELS.EMAIL);
    }

    // Check if SMS channel is enabled
    if (dbRow[`${category.dbColumn}_sms`]) {
      channels.push(NOTIFICATION_CHANNELS.SMS);
    }

    uiPreferences[category.dbColumn] = channels;
  });

  return uiPreferences;
}

export function useNotificationSettings(userId) {
  const [preferences, setPreferences] = useState(getDefaultPreferences());
  const [recordId, setRecordId] = useState(null);
  const [pendingToggles, setPendingToggles] = useState(new Set());

  const { isLoading: loading, error: fetchError, execute: executeFetch } = useAsyncOperation(
    async () => {
      if (!userId) {
        return;
      }

      // Query by user_id column in public.notification_preferences
      const { data, error: queryError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (queryError && queryError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is expected for new users
        throw new Error(queryError.message || 'Failed to load notification settings');
      }

      if (data) {
        // User has existing preferences - transform from boolean schema to UI arrays
        setRecordId(data.id);
        const uiPreferences = transformDbToUi(data);
        setPreferences(uiPreferences);
      } else {
        // No preferences found - use defaults
        console.log('[useNotificationSettings] No preferences found for user:', userId);
        setPreferences(getDefaultPreferences());
      }
    }
  );

  const error = fetchError?.message ?? null;

  const fetchPreferences = useCallback(() => {
    executeFetch().catch((err) => {
      console.error('[useNotificationSettings] Error fetching preferences:', err);
    });
  }, [executeFetch]);

  /**
   * Toggle a specific channel for a category
   * @param {string} dbColumn - The database column base name (e.g., 'message_forwarding')
   * @param {string} channel - The channel to toggle (e.g., 'Email', 'SMS')
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const toggleChannel = useCallback(async (dbColumn, channel) => {
    if (!userId || !recordId) {
      console.warn('[useNotificationSettings] Cannot toggle: missing userId or recordId');
      return { success: false, error: 'User preferences not loaded' };
    }

    // Create a unique key for this specific toggle
    const toggleKey = `${dbColumn}:${channel}`;

    // Mark this toggle as pending
    setPendingToggles(prev => new Set([...prev, toggleKey]));

    // Get current UI state (array format)
    const currentArray = preferences[dbColumn] || [];
    const isCurrentlyEnabled = currentArray.includes(channel);

    // Compute new UI state
    const newArray = isCurrentlyEnabled
      ? currentArray.filter(c => c !== channel)
      : [...currentArray, channel];

    // Store previous value for rollback
    const previousArray = currentArray;

    // Optimistic update in UI
    setPreferences(prev => ({
      ...prev,
      [dbColumn]: newArray
    }));

    try {
      // Convert channel name to lowercase for boolean column suffix
      const channelSuffix = channel.toLowerCase(); // 'Email' -> 'email', 'SMS' -> 'sms'
      const booleanColumn = `${dbColumn}_${channelSuffix}`;

      // Update the specific boolean column in the database
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update({
          [booleanColumn]: !isCurrentlyEnabled
        })
        .eq('id', recordId);

      if (updateError) {
        throw updateError;
      }

      // Success
      const action = !isCurrentlyEnabled ? 'enabled' : 'disabled';
      console.log(`[useNotificationSettings] ✅ ${channel} ${action} for ${dbColumn}`);

      if (window.showToast) {
        window.showToast('Preference updated', 'success');
      }

      return { success: true };
    } catch (err) {
      console.error('[useNotificationSettings] Error toggling channel:', err);

      // Rollback on error
      setPreferences(prev => ({
        ...prev,
        [dbColumn]: previousArray
      }));

      if (window.showToast) {
        window.showToast('Failed to update preference', 'error');
      }

      return { success: false, error: err.message };
    } finally {
      // Remove from pending
      setPendingToggles(prev => {
        const next = new Set(prev);
        next.delete(toggleKey);
        return next;
      });
    }
  }, [userId, recordId, preferences]);

  /**
   * Check if a specific toggle is currently being saved
   * @param {string} dbColumn - The database column name
   * @param {string} channel - The channel ('Email' or 'SMS')
   */
  const isTogglePending = useCallback((dbColumn, channel) => {
    return pendingToggles.has(`${dbColumn}:${channel}`);
  }, [pendingToggles]);

  /**
   * Check if a channel is enabled for a category
   * @param {string} dbColumn - The database column name
   * @param {string} channel - The channel to check
   * @returns {boolean}
   */
  const isChannelEnabled = useCallback((dbColumn, channel) => {
    const arr = preferences[dbColumn];
    return Array.isArray(arr) && arr.includes(channel);
  }, [preferences]);

  // Fetch on mount
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    toggleChannel,
    isTogglePending,
    isChannelEnabled,
    refetch: fetchPreferences,
    // Expose channel constants for convenience
    CHANNELS: NOTIFICATION_CHANNELS
  };
}

export default useNotificationSettings;
