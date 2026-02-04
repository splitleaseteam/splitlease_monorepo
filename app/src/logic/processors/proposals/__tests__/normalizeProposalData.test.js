/**
 * Tests for normalizeProposalData
 *
 * Normalize proposal data from Bubble format to V7 component format.
 * Transforms Bubble-format field names to camelCase for V7 components.
 */
import { describe, it, expect } from 'vitest';
import { normalizeProposalData } from '../normalizeProposalData.js';

describe('normalizeProposalData', () => {
  // ============================================================================
  // Null/Undefined Input
  // ============================================================================
  describe('null/undefined input', () => {
    it('should return null for null input', () => {
      const result = normalizeProposalData(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = normalizeProposalData(undefined);
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Status Normalization
  // ============================================================================
  describe('status normalization', () => {
    it('should normalize Status field (Bubble format)', () => {
      const proposal = { Status: 'Pending Confirmation' };
      const result = normalizeProposalData(proposal);
      expect(result.status).toBe('pending_confirmation');
    });

    it('should normalize status field (camelCase format)', () => {
      const proposal = { status: 'Host Review' };
      const result = normalizeProposalData(proposal);
      expect(result.status).toBe('host_review');
    });

    it('should handle empty status', () => {
      const proposal = { Status: '' };
      const result = normalizeProposalData(proposal);
      expect(result.status).toBe('');
    });

    it('should handle status with multiple spaces', () => {
      const proposal = { Status: 'Lease   Documents   Sent' };
      const result = normalizeProposalData(proposal);
      expect(result.status).toBe('lease_documents_sent');
    });

    it('should preserve object status as-is', () => {
      const statusObj = { key: 'value', stage: 2 };
      const proposal = { Status: statusObj };
      const result = normalizeProposalData(proposal);
      expect(result.status).toEqual(statusObj);
    });
  });

  // ============================================================================
  // Date Field Mapping
  // ============================================================================
  describe('date field mapping', () => {
    it('should map Move in range start to start_date', () => {
      const proposal = { 'Move in range start': '2025-12-01' };
      const result = normalizeProposalData(proposal);
      expect(result.start_date).toBe('2025-12-01');
      expect(result.move_in_range_start).toBe('2025-12-01');
    });

    it('should map Move-out to end_date', () => {
      const proposal = { 'Move-out': '2026-06-30' };
      const result = normalizeProposalData(proposal);
      expect(result.end_date).toBe('2026-06-30');
    });

    it('should map Move in range end', () => {
      const proposal = { 'Move in range end': '2025-12-15' };
      const result = normalizeProposalData(proposal);
      expect(result.move_in_range_end).toBe('2025-12-15');
    });

    it('should map Created Date to created_at', () => {
      const proposal = { 'Created Date': '2025-01-15T10:30:00Z' };
      const result = normalizeProposalData(proposal);
      expect(result.created_at).toBe('2025-01-15T10:30:00Z');
    });

    it('should fallback to camelCase fields', () => {
      const proposal = {
        start_date: '2025-12-01',
        end_date: '2026-06-30',
        move_in_range_start: '2025-12-01',
        move_in_range_end: '2025-12-15',
        created_at: '2025-01-15'
      };
      const result = normalizeProposalData(proposal);
      expect(result.start_date).toBe('2025-12-01');
      expect(result.end_date).toBe('2026-06-30');
      expect(result.move_in_range_start).toBe('2025-12-01');
      expect(result.move_in_range_end).toBe('2025-12-15');
      expect(result.created_at).toBe('2025-01-15');
    });

    it('should return null for missing date fields', () => {
      const proposal = {};
      const result = normalizeProposalData(proposal);
      expect(result.start_date).toBeNull();
      expect(result.end_date).toBeNull();
      expect(result.move_in_range_start).toBeNull();
      expect(result.move_in_range_end).toBeNull();
      expect(result.created_at).toBeNull();
    });
  });

  // ============================================================================
  // Days/Schedule Field Mapping
  // ============================================================================
  describe('days/schedule field mapping', () => {
    it('should map Days Selected', () => {
      const proposal = { 'Days Selected': [1, 2, 3, 4, 5] };
      const result = normalizeProposalData(proposal);
      expect(result.days_selected).toEqual([1, 2, 3, 4, 5]);
      expect(result.days_per_week).toEqual([1, 2, 3, 4, 5]);
    });

    it('should map Nights Selected', () => {
      const proposal = { 'Nights Selected (Nights list)': ['Mon', 'Tue', 'Wed'] };
      const result = normalizeProposalData(proposal);
      expect(result.nights_selected).toEqual(['Mon', 'Tue', 'Wed']);
    });

    it('should map nights per week', () => {
      const proposal = { 'nights per week (num)': 4 };
      const result = normalizeProposalData(proposal);
      expect(result.nights_per_week).toBe(4);
    });

    it('should map check in/out days', () => {
      const proposal = {
        'check in day': 'Monday',
        'check out day': 'Friday'
      };
      const result = normalizeProposalData(proposal);
      expect(result.check_in_day).toBe('Monday');
      expect(result.check_out_day).toBe('Friday');
    });

    it('should return empty array for missing days fields', () => {
      const proposal = {};
      const result = normalizeProposalData(proposal);
      expect(result.days_selected).toEqual([]);
      expect(result.days_per_week).toEqual([]);
      expect(result.nights_selected).toEqual([]);
    });

    it('should return 0 for missing nights per week', () => {
      const proposal = {};
      const result = normalizeProposalData(proposal);
      expect(result.nights_per_week).toBe(0);
    });
  });

  // ============================================================================
  // Duration Field Mapping
  // ============================================================================
  describe('duration field mapping', () => {
    it('should map Reservation Span (Weeks)', () => {
      const proposal = { 'Reservation Span (Weeks)': 12 };
      const result = normalizeProposalData(proposal);
      expect(result.duration_weeks).toBe(12);
    });

    it('should map Reservation Span (months)', () => {
      const proposal = { 'Reservation Span': 3 };
      const result = normalizeProposalData(proposal);
      expect(result.duration_months).toBe(3);
    });

    it('should fallback to total_weeks', () => {
      const proposal = { total_weeks: 8 };
      const result = normalizeProposalData(proposal);
      expect(result.duration_weeks).toBe(8);
    });

    it('should return 0 for missing duration fields', () => {
      const proposal = {};
      const result = normalizeProposalData(proposal);
      expect(result.duration_weeks).toBe(0);
      expect(result.duration_months).toBe(0);
    });
  });

  // ============================================================================
  // Pricing Field Mapping
  // ============================================================================
  describe('pricing field mapping', () => {
    it('should map proposal nightly price', () => {
      const proposal = { 'proposal nightly price': 150 };
      const result = normalizeProposalData(proposal);
      expect(result.nightly_rate).toBe(150);
    });

    it('should map Total Compensation (proposal - host)', () => {
      const proposal = { 'Total Compensation (proposal - host)': 3000 };
      const result = normalizeProposalData(proposal);
      expect(result.total_price).toBe(3000);
      expect(result.host_compensation).toBe(3000);
    });

    it('should map host compensation', () => {
      const proposal = { 'host compensation': 2500 };
      const result = normalizeProposalData(proposal);
      expect(result.host_compensation).toBe(2500);
    });

    it('should map 4 week rent and compensation', () => {
      const proposal = {
        '4 week rent': 2000,
        '4 week compensation': 1800
      };
      const result = normalizeProposalData(proposal);
      expect(result.four_week_rent).toBe(2000);
      expect(result.four_week_compensation).toBe(1800);
    });

    it('should map cleaning fee and damage deposit', () => {
      const proposal = {
        'cleaning fee': 100,
        'damage deposit': 500
      };
      const result = normalizeProposalData(proposal);
      expect(result.cleaning_fee).toBe(100);
      expect(result.damage_deposit).toBe(500);
    });

    it('should return 0 for missing pricing fields', () => {
      const proposal = {};
      const result = normalizeProposalData(proposal);
      expect(result.nightly_rate).toBe(0);
      expect(result.total_price).toBe(0);
      expect(result.host_compensation).toBe(0);
      expect(result.four_week_rent).toBe(0);
      expect(result.four_week_compensation).toBe(0);
      expect(result.cleaning_fee).toBe(0);
      expect(result.damage_deposit).toBe(0);
    });
  });

  // ============================================================================
  // Guest Info/Message Field Mapping
  // ============================================================================
  describe('guest info/message field mapping', () => {
    it('should map Comment', () => {
      const proposal = { Comment: 'Looking forward to staying!' };
      const result = normalizeProposalData(proposal);
      expect(result.comment).toBe('Looking forward to staying!');
    });

    it('should map need for space', () => {
      const proposal = { 'need for space': 'Remote work setup needed' };
      const result = normalizeProposalData(proposal);
      expect(result.need_for_space).toBe('Remote work setup needed');
    });

    it('should map about_yourself', () => {
      const proposal = { about_yourself: 'I am a software developer...' };
      const result = normalizeProposalData(proposal);
      expect(result.about_yourself).toBe('I am a software developer...');
    });

    it('should return null for missing guest info fields', () => {
      const proposal = {};
      const result = normalizeProposalData(proposal);
      expect(result.comment).toBeNull();
      expect(result.need_for_space).toBeNull();
      expect(result.about_yourself).toBeNull();
    });
  });

  // ============================================================================
  // Guest Counteroffer Fields
  // ============================================================================
  describe('guest counteroffer fields', () => {
    it('should map last_modified_by', () => {
      const proposal = { last_modified_by: 'guest' };
      const result = normalizeProposalData(proposal);
      expect(result.last_modified_by).toBe('guest');
    });

    it('should map has_guest_counteroffer', () => {
      const proposal = { has_guest_counteroffer: true };
      const result = normalizeProposalData(proposal);
      expect(result.has_guest_counteroffer).toBe(true);
    });

    it('should default has_guest_counteroffer to false', () => {
      const proposal = {};
      const result = normalizeProposalData(proposal);
      expect(result.has_guest_counteroffer).toBe(false);
    });
  });

  // ============================================================================
  // Guest Data Normalization
  // ============================================================================
  describe('guest data normalization', () => {
    it('should use provided normalized guest', () => {
      const normalizedGuest = {
        id: 'guest-123',
        firstName: 'John',
        lastName: 'Doe'
      };
      const proposal = {
        guest: { 'First Name': 'Jane', 'Last Name': 'Smith' }
      };
      const result = normalizeProposalData(proposal, normalizedGuest);
      expect(result.guest).toEqual(normalizedGuest);
    });

    it('should normalize inline guest when not provided', () => {
      const proposal = {
        guest: { 'First Name': 'Jane', 'Last Name': 'Smith' }
      };
      const result = normalizeProposalData(proposal);
      // Guest should be normalized (actual normalization depends on normalizeGuestData implementation)
      expect(result.guest).toBeDefined();
    });

    it('should handle null guest', () => {
      const proposal = { guest: null };
      const result = normalizeProposalData(proposal);
      expect(result.guest).toBeNull();
    });
  });

  // ============================================================================
  // Preserves Original Fields
  // ============================================================================
  describe('preserves original fields', () => {
    it('should preserve original proposal fields via spread', () => {
      const proposal = {
        _id: 'proposal-123',
        bubble_id: 'abc123xyz',
        customField: 'custom value',
        Status: 'Pending'
      };
      const result = normalizeProposalData(proposal);
      expect(result._id).toBe('proposal-123');
      expect(result.bubble_id).toBe('abc123xyz');
      expect(result.customField).toBe('custom value');
    });

    it('should override original fields with normalized versions', () => {
      const proposal = {
        Status: 'Pending Confirmation',
        status: 'old_status' // This should be overwritten
      };
      const result = normalizeProposalData(proposal);
      expect(result.status).toBe('pending_confirmation');
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should normalize complete Bubble proposal', () => {
      const bubbleProposal = {
        _id: 'proposal-123',
        Status: 'Host Counteroffer Submitted / Awaiting Guest Review',
        'Move in range start': '2025-12-01',
        'Move-out': '2026-03-31',
        'Days Selected': [1, 2, 3, 4, 5],
        'Nights Selected (Nights list)': ['Mon', 'Tue', 'Wed', 'Thu'],
        'nights per week (num)': 4,
        'check in day': 'Monday',
        'check out day': 'Friday',
        'Reservation Span (Weeks)': 17,
        'proposal nightly price': 120,
        'host compensation': 8160,
        Comment: 'Looking for a quiet workspace',
        'Created Date': '2025-01-15T10:30:00Z'
      };

      const result = normalizeProposalData(bubbleProposal);

      expect(result._id).toBe('proposal-123');
      expect(result.status).toBe('host_counteroffer_submitted_/_awaiting_guest_review');
      expect(result.start_date).toBe('2025-12-01');
      expect(result.end_date).toBe('2026-03-31');
      expect(result.days_selected).toEqual([1, 2, 3, 4, 5]);
      expect(result.nights_per_week).toBe(4);
      expect(result.check_in_day).toBe('Monday');
      expect(result.duration_weeks).toBe(17);
      expect(result.nightly_rate).toBe(120);
      expect(result.host_compensation).toBe(8160);
      expect(result.comment).toBe('Looking for a quiet workspace');
    });

    it('should normalize Supabase proposal (already camelCase)', () => {
      const supabaseProposal = {
        id: 'proposal-456',
        status: 'Pending',
        start_date: '2025-12-01',
        end_date: '2026-03-31',
        days_selected: [1, 2, 3, 4, 5],
        nights_per_week: 4,
        duration_weeks: 17,
        nightly_rate: 120,
        total_price: 8160,
        created_at: '2025-01-15T10:30:00Z'
      };

      const result = normalizeProposalData(supabaseProposal);

      expect(result.status).toBe('pending');
      expect(result.start_date).toBe('2025-12-01');
      expect(result.end_date).toBe('2026-03-31');
      expect(result.days_selected).toEqual([1, 2, 3, 4, 5]);
      expect(result.nights_per_week).toBe(4);
      expect(result.duration_weeks).toBe(17);
      expect(result.nightly_rate).toBe(120);
      expect(result.total_price).toBe(8160);
    });

    it('should handle minimal proposal data', () => {
      const minimalProposal = {
        _id: 'proposal-789',
        Status: 'Draft'
      };

      const result = normalizeProposalData(minimalProposal);

      expect(result._id).toBe('proposal-789');
      expect(result.status).toBe('draft');
      expect(result.days_selected).toEqual([]);
      expect(result.nightly_rate).toBe(0);
      expect(result.comment).toBeNull();
    });
  });
});
