/**
 * Tests for notificationCategories
 *
 * Tests the notification categories configuration module including:
 * - NOTIFICATION_CATEGORIES array structure
 * - getAllPreferenceColumns utility
 * - getDefaultPreferences utility
 * - isChannelEnabled utility
 * - toggleChannelInArray utility
 */

import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  getAllPreferenceColumns,
  getDefaultPreferences,
  isChannelEnabled,
  toggleChannelInArray,
} from '../notificationCategories.js';

describe('notificationCategories', () => {
  // ============================================================================
  // NOTIFICATION_CATEGORIES Tests
  // ============================================================================
  describe('NOTIFICATION_CATEGORIES', () => {
    it('should have 11 categories', () => {
      expect(NOTIFICATION_CATEGORIES).toHaveLength(11);
    });

    it('should have display info for each category', () => {
      NOTIFICATION_CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('label');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('dbColumn');

        // Verify non-empty strings
        expect(typeof category.id).toBe('string');
        expect(category.id.length).toBeGreaterThan(0);
        expect(typeof category.label).toBe('string');
        expect(category.label.length).toBeGreaterThan(0);
        expect(typeof category.description).toBe('string');
        expect(category.description.length).toBeGreaterThan(0);
        expect(typeof category.dbColumn).toBe('string');
        expect(category.dbColumn.length).toBeGreaterThan(0);
      });
    });

    it('should have unique ids for each category', () => {
      const ids = NOTIFICATION_CATEGORIES.map((cat) => cat.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(NOTIFICATION_CATEGORIES.length);
    });

    it('should have unique dbColumns for each category', () => {
      const dbColumns = NOTIFICATION_CATEGORIES.map((cat) => cat.dbColumn);
      const uniqueDbColumns = new Set(dbColumns);
      expect(uniqueDbColumns.size).toBe(NOTIFICATION_CATEGORIES.length);
    });

    it('should include expected category ids', () => {
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
      expectedIds.forEach((expectedId) => {
        expect(actualIds).toContain(expectedId);
      });
    });

    it('should map to correct database columns', () => {
      // Spot check some expected mappings
      const messageForwarding = NOTIFICATION_CATEGORIES.find(
        (cat) => cat.id === 'message_forwarding'
      );
      expect(messageForwarding.dbColumn).toBe('Message Forwarding');

      const checkinCheckout = NOTIFICATION_CATEGORIES.find(
        (cat) => cat.id === 'checkin_checkout'
      );
      expect(checkinCheckout.dbColumn).toBe('Check In/Out Reminders');

      const tipsInsights = NOTIFICATION_CATEGORIES.find(
        (cat) => cat.id === 'tips_insights'
      );
      expect(tipsInsights.dbColumn).toBe('Tips/Insights');

      const accountAssistance = NOTIFICATION_CATEGORIES.find(
        (cat) => cat.id === 'account_assistance'
      );
      expect(accountAssistance.dbColumn).toBe('Login/Signup Assistance');
    });
  });

  // ============================================================================
  // NOTIFICATION_CHANNELS Tests
  // ============================================================================
  describe('NOTIFICATION_CHANNELS', () => {
    it('should define EMAIL channel', () => {
      expect(NOTIFICATION_CHANNELS.EMAIL).toBe('Email');
    });

    it('should define SMS channel', () => {
      expect(NOTIFICATION_CHANNELS.SMS).toBe('SMS');
    });

    it('should define IN_APP channel', () => {
      expect(NOTIFICATION_CHANNELS.IN_APP).toBe('In-App Message');
    });
  });

  // ============================================================================
  // getAllPreferenceColumns Tests
  // ============================================================================
  describe('getAllPreferenceColumns', () => {
    it('should return all 11 column names', () => {
      const columns = getAllPreferenceColumns();
      expect(columns).toHaveLength(11);
    });

    it('should return dbColumn values from categories', () => {
      const columns = getAllPreferenceColumns();
      const expectedColumns = NOTIFICATION_CATEGORIES.map((cat) => cat.dbColumn);
      expect(columns).toEqual(expectedColumns);
    });

    it('should include expected column names', () => {
      const columns = getAllPreferenceColumns();
      expect(columns).toContain('Message Forwarding');
      expect(columns).toContain('Payment Reminders');
      expect(columns).toContain('Promotional');
      expect(columns).toContain('Reservation Updates');
      expect(columns).toContain('Lease Requests');
      expect(columns).toContain('Proposal Updates');
      expect(columns).toContain('Check In/Out Reminders');
      expect(columns).toContain('Reviews');
      expect(columns).toContain('Tips/Insights');
      expect(columns).toContain('Login/Signup Assistance');
      expect(columns).toContain('Virtual Meetings');
    });

    it('should return an array', () => {
      const columns = getAllPreferenceColumns();
      expect(Array.isArray(columns)).toBe(true);
    });
  });

  // ============================================================================
  // getDefaultPreferences Tests
  // ============================================================================
  describe('getDefaultPreferences', () => {
    it('should return all categories with empty arrays', () => {
      const defaults = getDefaultPreferences();

      // Should have 11 keys (one for each category)
      expect(Object.keys(defaults)).toHaveLength(11);

      // Each value should be an empty array
      Object.values(defaults).forEach((value) => {
        expect(Array.isArray(value)).toBe(true);
        expect(value).toHaveLength(0);
      });
    });

    it('should use dbColumn names as keys', () => {
      const defaults = getDefaultPreferences();
      const expectedKeys = NOTIFICATION_CATEGORIES.map((cat) => cat.dbColumn);

      expectedKeys.forEach((key) => {
        expect(defaults).toHaveProperty(key);
      });
    });

    it('should return a new object each time', () => {
      const defaults1 = getDefaultPreferences();
      const defaults2 = getDefaultPreferences();

      expect(defaults1).not.toBe(defaults2);
      expect(defaults1).toEqual(defaults2);
    });

    it('should return an object', () => {
      const defaults = getDefaultPreferences();
      expect(typeof defaults).toBe('object');
      expect(defaults).not.toBeNull();
    });
  });

  // ============================================================================
  // isChannelEnabled Tests
  // ============================================================================
  describe('isChannelEnabled', () => {
    it('should return true when channel is in array', () => {
      const channelArray = ['Email', 'SMS'];
      expect(isChannelEnabled(channelArray, 'Email')).toBe(true);
      expect(isChannelEnabled(channelArray, 'SMS')).toBe(true);
    });

    it('should return false when channel is not in array', () => {
      const channelArray = ['Email'];
      expect(isChannelEnabled(channelArray, 'SMS')).toBe(false);
      expect(isChannelEnabled(channelArray, 'In-App Message')).toBe(false);
    });

    it('should handle empty array', () => {
      const channelArray = [];
      expect(isChannelEnabled(channelArray, 'Email')).toBe(false);
      expect(isChannelEnabled(channelArray, 'SMS')).toBe(false);
    });

    it('should handle null', () => {
      expect(isChannelEnabled(null, 'Email')).toBe(false);
    });

    it('should handle undefined', () => {
      expect(isChannelEnabled(undefined, 'Email')).toBe(false);
    });

    it('should handle non-array values', () => {
      expect(isChannelEnabled('Email', 'Email')).toBe(false);
      expect(isChannelEnabled(123, 'Email')).toBe(false);
      expect(isChannelEnabled({}, 'Email')).toBe(false);
    });

    it('should be case-sensitive', () => {
      const channelArray = ['Email'];
      expect(isChannelEnabled(channelArray, 'email')).toBe(false);
      expect(isChannelEnabled(channelArray, 'EMAIL')).toBe(false);
    });
  });

  // ============================================================================
  // toggleChannelInArray Tests
  // ============================================================================
  describe('toggleChannelInArray', () => {
    it('should add channel when not present', () => {
      const currentArray = ['Email'];
      const result = toggleChannelInArray(currentArray, 'SMS');

      expect(result).toContain('Email');
      expect(result).toContain('SMS');
      expect(result).toHaveLength(2);
    });

    it('should remove channel when present', () => {
      const currentArray = ['Email', 'SMS'];
      const result = toggleChannelInArray(currentArray, 'SMS');

      expect(result).toContain('Email');
      expect(result).not.toContain('SMS');
      expect(result).toHaveLength(1);
    });

    it('should not mutate original array', () => {
      const currentArray = ['Email', 'SMS'];
      const originalCopy = [...currentArray];
      toggleChannelInArray(currentArray, 'SMS');

      expect(currentArray).toEqual(originalCopy);
    });

    it('should handle empty array - add channel', () => {
      const currentArray = [];
      const result = toggleChannelInArray(currentArray, 'Email');

      expect(result).toContain('Email');
      expect(result).toHaveLength(1);
    });

    it('should handle null - create new array with channel', () => {
      const result = toggleChannelInArray(null, 'Email');

      expect(result).toContain('Email');
      expect(result).toHaveLength(1);
    });

    it('should handle undefined - create new array with channel', () => {
      const result = toggleChannelInArray(undefined, 'Email');

      expect(result).toContain('Email');
      expect(result).toHaveLength(1);
    });

    it('should handle non-array values - create new array with channel', () => {
      const result1 = toggleChannelInArray('string', 'Email');
      expect(result1).toContain('Email');
      expect(result1).toHaveLength(1);

      const result2 = toggleChannelInArray(123, 'SMS');
      expect(result2).toContain('SMS');
      expect(result2).toHaveLength(1);
    });

    it('should return a new array reference', () => {
      const currentArray = ['Email'];
      const result = toggleChannelInArray(currentArray, 'SMS');

      expect(result).not.toBe(currentArray);
    });

    it('should toggle single-item array correctly', () => {
      const currentArray = ['Email'];
      const result = toggleChannelInArray(currentArray, 'Email');

      expect(result).not.toContain('Email');
      expect(result).toHaveLength(0);
    });

    it('should preserve other channels when toggling', () => {
      const currentArray = ['Email', 'SMS', 'In-App Message'];
      const result = toggleChannelInArray(currentArray, 'SMS');

      expect(result).toContain('Email');
      expect(result).toContain('In-App Message');
      expect(result).not.toContain('SMS');
      expect(result).toHaveLength(2);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle channel names with special characters', () => {
      const currentArray = [];
      const result = toggleChannelInArray(currentArray, 'In-App Message');
      expect(result).toContain('In-App Message');
    });

    it('should handle repeated toggle operations', () => {
      let array = [];
      array = toggleChannelInArray(array, 'Email');
      expect(array).toContain('Email');

      array = toggleChannelInArray(array, 'Email');
      expect(array).not.toContain('Email');

      array = toggleChannelInArray(array, 'Email');
      expect(array).toContain('Email');
    });

    it('should handle multiple channels being toggled in sequence', () => {
      let array = [];
      array = toggleChannelInArray(array, 'Email');
      array = toggleChannelInArray(array, 'SMS');
      array = toggleChannelInArray(array, 'In-App Message');

      expect(array).toHaveLength(3);
      expect(array).toContain('Email');
      expect(array).toContain('SMS');
      expect(array).toContain('In-App Message');
    });
  });
});
