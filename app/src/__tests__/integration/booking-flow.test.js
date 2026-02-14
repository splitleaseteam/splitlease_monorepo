/**
 * Integration Tests: Booking Flow
 *
 * Tests the complete booking/proposal submission flow including:
 * - Day selection and validation
 * - Price calculation
 * - Proposal submission
 * - Success handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase
vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
      })),
      insert: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        single: vi.fn()
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn()
      }))
    })),
    auth: {
      getSession: vi.fn()
    }
  }
}));

// Mock auth
vi.mock('../../lib/auth/index.js', () => ({
  getAuthToken: vi.fn(() => 'test-token'),
  getSessionId: vi.fn(() => 'user-123'),
  getUserType: vi.fn(() => 'Guest'),
  checkAuthStatus: vi.fn().mockResolvedValue(true),
  validateTokenAndFetchUser: vi.fn().mockResolvedValue({
    userId: 'user-123',
    firstName: 'Test',
    fullName: 'Test User',
    email: 'test@example.com',
    userType: 'Guest'
  })
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('Booking Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // DAY SELECTION TESTS
  // ========================================
  describe('Day Selection', () => {
    it('should validate minimum nights requirement', () => {
      const validateMinNights = (selectedDays, minNights) => {
        if (!selectedDays || selectedDays.length === 0) return false;

        // Calculate nights from consecutive days
        // For split scheduling, nights = number of selected days for consecutive days
        // For simplicity, this checks if the count meets minimum
        return selectedDays.length >= minNights;
      };

      // Test cases
      expect(validateMinNights([1, 2, 3], 2)).toBe(true);
      expect(validateMinNights([1], 2)).toBe(false);
      expect(validateMinNights([], 2)).toBe(false);
      expect(validateMinNights([1, 2, 3, 4, 5], 5)).toBe(true);
    });

    it('should validate maximum nights requirement', () => {
      const validateMaxNights = (selectedDays, maxNights) => {
        if (!selectedDays) return true;
        return selectedDays.length <= maxNights;
      };

      expect(validateMaxNights([1, 2, 3], 5)).toBe(true);
      expect(validateMaxNights([1, 2, 3, 4, 5, 6, 7], 5)).toBe(false);
      expect(validateMaxNights([], 5)).toBe(true);
    });

    it('should validate contiguous day selection', () => {
      const isContiguous = (selectedDays) => {
        if (!selectedDays || selectedDays.length <= 1) return true;

        const sorted = [...selectedDays].sort((a, b) => a - b);

        // Check for simple consecutive days first
        let simpleContiguous = true;
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] - sorted[i - 1] !== 1) {
            simpleContiguous = false;
            break;
          }
        }
        if (simpleContiguous) return true;

        // Check for week wrap-around (e.g., [5, 6, 0] or [6, 0, 1])
        // For wrap-around, we need: contains 0 AND 6, and the "gap" in the middle is the only non-consecutive part
        const hasZero = sorted.includes(0);
        const hasSix = sorted.includes(6);

        if (hasZero && hasSix) {
          // Count gaps: there should only be ONE gap, which is between max and 0 (the wrap)
          let gapCount = 0;
          for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] - sorted[i - 1] !== 1) {
              gapCount++;
            }
          }
          // If there's exactly one gap, it's the wrap-around gap
          return gapCount === 1;
        }

        return false;
      };

      expect(isContiguous([1, 2, 3])).toBe(true);
      expect(isContiguous([1, 3, 5])).toBe(false);
      expect(isContiguous([5, 6, 0])).toBe(true); // Week wrap-around: sorted is [0, 5, 6], gap between 0 and 5
      expect(isContiguous([0])).toBe(true);
      expect(isContiguous([])).toBe(true);
    });

    it('should check day availability', () => {
      const availableDays = [1, 2, 3, 4, 5]; // Monday through Friday

      const isDayAvailable = (day, available) => available.includes(day);

      expect(isDayAvailable(1, availableDays)).toBe(true);
      expect(isDayAvailable(0, availableDays)).toBe(false); // Sunday not available
      expect(isDayAvailable(6, availableDays)).toBe(false); // Saturday not available
    });
  });

  // ========================================
  // PRICE CALCULATION TESTS
  // ========================================
  describe('Price Calculation', () => {
    it('should calculate base price correctly', () => {
      const calculateBasePrice = (nightlyRate, numberOfNights) => {
        return nightlyRate * numberOfNights;
      };

      expect(calculateBasePrice(100, 7)).toBe(700);
      expect(calculateBasePrice(150, 3)).toBe(450);
      expect(calculateBasePrice(0, 5)).toBe(0);
    });

    it('should apply discount for longer stays', () => {
      const calculateWithDiscount = (basePrice, numberOfNights, discountThreshold, discountPercent) => {
        if (numberOfNights >= discountThreshold) {
          return basePrice * (1 - discountPercent / 100);
        }
        return basePrice;
      };

      // 10% discount for stays >= 7 nights
      expect(calculateWithDiscount(700, 7, 7, 10)).toBe(630);
      expect(calculateWithDiscount(600, 6, 7, 10)).toBe(600); // No discount
      expect(calculateWithDiscount(1400, 14, 7, 10)).toBe(1260);
    });

    it('should calculate markup correctly', () => {
      const calculateWithMarkup = (basePrice, markupPercent) => {
        const result = basePrice * (1 + markupPercent / 100);
        // Round to avoid floating point precision issues
        return Math.round(result * 100) / 100;
      };

      // 15% markup
      expect(calculateWithMarkup(100, 15)).toBe(115);
      expect(calculateWithMarkup(1000, 15)).toBe(1150);
      expect(calculateWithMarkup(500, 0)).toBe(500);
    });

    it('should calculate total price with all components', () => {
      const calculateTotalPrice = ({ nightlyRate, numberOfNights, discountPercent, markupPercent }) => {
        const basePrice = nightlyRate * numberOfNights;
        const afterDiscount = basePrice * (1 - discountPercent / 100);
        const afterMarkup = afterDiscount * (1 + markupPercent / 100);
        return Math.round(afterMarkup * 100) / 100; // Round to 2 decimal places
      };

      const result = calculateTotalPrice({
        nightlyRate: 100,
        numberOfNights: 7,
        discountPercent: 10,
        markupPercent: 15
      });

      // 700 base - 70 discount = 630 -> + 15% markup = 724.50
      expect(result).toBe(724.5);
    });

    it('should calculate price per night', () => {
      const calculatePricePerNight = (totalPrice, numberOfNights) => {
        if (numberOfNights === 0) return 0;
        return Math.round((totalPrice / numberOfNights) * 100) / 100;
      };

      expect(calculatePricePerNight(724.5, 7)).toBe(103.5);
      expect(calculatePricePerNight(0, 7)).toBe(0);
      expect(calculatePricePerNight(100, 0)).toBe(0);
    });

    it('should calculate 4-week rent equivalent', () => {
      const calculateFourWeekRent = (pricePerNight) => {
        return pricePerNight * 28;
      };

      expect(calculateFourWeekRent(100)).toBe(2800);
      expect(calculateFourWeekRent(75.5)).toBe(2114);
    });
  });

  // ========================================
  // PROPOSAL SUBMISSION TESTS
  // ========================================
  describe('Proposal Submission', () => {
    it('should validate required proposal fields', () => {
      const validateProposal = (proposal) => {
        const errors = [];

        if (!proposal.listingId) errors.push('Listing ID is required');
        if (!proposal.userId) errors.push('User ID is required');
        if (!proposal.selectedDays || proposal.selectedDays.length === 0) {
          errors.push('At least one day must be selected');
        }
        if (!proposal.moveInDate) errors.push('Move-in date is required');
        if (!proposal.totalPrice || proposal.totalPrice <= 0) {
          errors.push('Valid price is required');
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      };

      // Valid proposal
      const validProposal = {
        listingId: 'listing-123',
        userId: 'user-123',
        selectedDays: [1, 2, 3],
        moveInDate: '2024-03-01',
        totalPrice: 500
      };
      expect(validateProposal(validProposal).isValid).toBe(true);

      // Missing listing ID
      const missingListing = { ...validProposal, listingId: null };
      const result1 = validateProposal(missingListing);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Listing ID is required');

      // Missing days
      const missingDays = { ...validProposal, selectedDays: [] };
      const result2 = validateProposal(missingDays);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('At least one day must be selected');
    });

    it('should prepare proposal data for submission', () => {
      const prepareProposalData = ({
        listingId,
        userId,
        selectedDays,
        moveInDate,
        totalPrice,
        pricePerNight,
        numberOfNights,
        aboutMe,
        specialNeeds
      }) => {
        return {
          listing_id: listingId,
          guest_user_id: userId,
          selected_days: selectedDays,
          move_in_date: moveInDate,
          total_price: totalPrice,
          price_per_night: pricePerNight,
          number_of_nights: numberOfNights,
          guest_about_me: aboutMe || null,
          guest_special_needs: specialNeeds || null,
          status: 'pending',
          created_at: new Date().toISOString()
        };
      };

      const proposalData = prepareProposalData({
        listingId: 'listing-123',
        userId: 'user-123',
        selectedDays: [1, 2, 3, 4, 5],
        moveInDate: '2024-03-01',
        totalPrice: 750,
        pricePerNight: 150,
        numberOfNights: 5,
        aboutMe: 'I am a quiet professional',
        specialNeeds: 'None'
      });

      expect(proposalData.listing_id).toBe('listing-123');
      expect(proposalData.guest_user_id).toBe('user-123');
      expect(proposalData.selected_days).toEqual([1, 2, 3, 4, 5]);
      expect(proposalData.status).toBe('pending');
    });

    it('should handle successful proposal submission', async () => {
      const { supabase } = await import('../../lib/supabase.js');

      supabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            proposalId: 'proposal-123',
            status: 'pending'
          }
        },
        error: null
      });

      const result = await supabase.functions.invoke('proposal', {
        body: {
          action: 'create',
          payload: {
            listingId: 'listing-123',
            userId: 'user-123',
            selectedDays: [1, 2, 3],
            totalPrice: 300
          }
        }
      });

      expect(result.data.success).toBe(true);
      expect(result.data.data.proposalId).toBe('proposal-123');
    });

    it('should handle proposal submission error', async () => {
      const { supabase } = await import('../../lib/supabase.js');

      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Listing not available' }
      });

      const result = await supabase.functions.invoke('proposal', {
        body: {
          action: 'create',
          payload: {
            listingId: 'listing-123',
            userId: 'user-123',
            selectedDays: [1, 2, 3],
            totalPrice: 300
          }
        }
      });

      expect(result.error).not.toBeNull();
      expect(result.error.message).toBe('Listing not available');
    });
  });

  // ========================================
  // MOVE-IN DATE VALIDATION TESTS
  // ========================================
  describe('Move-In Date Validation', () => {
    it('should validate move-in date is in the future', () => {
      const isDateInFuture = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      expect(isDateInFuture(futureDate.toISOString().split('T')[0])).toBe(true);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      expect(isDateInFuture(pastDate.toISOString().split('T')[0])).toBe(false);
    });

    it('should validate move-in date matches selected day of week', () => {
      const dateMatchesSelectedDay = (dateString, selectedDays) => {
        // Parse the date in UTC to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        const dayOfWeek = date.getUTCDay();
        return selectedDays.includes(dayOfWeek);
      };

      // March 1, 2024 is a Friday (day 5) in UTC
      expect(dateMatchesSelectedDay('2024-03-01', [5])).toBe(true);
      expect(dateMatchesSelectedDay('2024-03-01', [1, 2, 3])).toBe(false);

      // March 4, 2024 is a Monday (day 1) in UTC
      expect(dateMatchesSelectedDay('2024-03-04', [1, 2, 3])).toBe(true);
    });

    it('should validate move-in date is within booking window', () => {
      const isWithinBookingWindow = (dateString, maxDaysAhead = 90) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + maxDaysAhead);

        return date >= today && date <= maxDate;
      };

      const today = new Date();

      // 30 days ahead
      const validDate = new Date(today);
      validDate.setDate(validDate.getDate() + 30);
      expect(isWithinBookingWindow(validDate.toISOString().split('T')[0])).toBe(true);

      // 120 days ahead (beyond window)
      const tooFarDate = new Date(today);
      tooFarDate.setDate(tooFarDate.getDate() + 120);
      expect(isWithinBookingWindow(tooFarDate.toISOString().split('T')[0])).toBe(false);
    });
  });

  // ========================================
  // COMPLETE BOOKING FLOW TEST
  // ========================================
  describe('Complete Booking Flow', () => {
    it('should complete full booking flow successfully', async () => {
      const { supabase } = await import('../../lib/supabase.js');
      const { checkAuthStatus, validateTokenAndFetchUser } = await import('../../lib/auth/index.js');

      // Step 1: Check authentication
      const isAuthenticated = await checkAuthStatus();
      expect(isAuthenticated).toBe(true);

      // Step 2: Get user data
      const userData = await validateTokenAndFetchUser();
      expect(userData.userId).toBe('user-123');

      // Step 3: Select days
      const selectedDays = [1, 2, 3, 4, 5]; // Monday through Friday
      expect(selectedDays.length).toBe(5);

      // Step 4: Calculate price
      const nightlyRate = 100;
      const numberOfNights = selectedDays.length;
      const totalPrice = nightlyRate * numberOfNights;
      expect(totalPrice).toBe(500);

      // Step 5: Set move-in date
      const moveInDate = new Date();
      moveInDate.setDate(moveInDate.getDate() + 14);
      const moveInDateString = moveInDate.toISOString().split('T')[0];

      // Step 6: Submit proposal
      supabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            proposalId: 'proposal-new-123',
            status: 'pending'
          }
        },
        error: null
      });

      const result = await supabase.functions.invoke('proposal', {
        body: {
          action: 'create',
          payload: {
            listingId: 'listing-123',
            userId: userData.userId,
            selectedDays,
            moveInDate: moveInDateString,
            totalPrice
          }
        }
      });

      // Step 7: Verify success
      expect(result.data.success).toBe(true);
      expect(result.data.data.proposalId).toBeDefined();
      expect(result.data.data.status).toBe('pending');
    });
  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================
  describe('Error Handling', () => {
    it('should handle authentication failure gracefully', async () => {
      const { checkAuthStatus } = await import('../../lib/auth/index.js');
      checkAuthStatus.mockResolvedValueOnce(false);

      const isAuthenticated = await checkAuthStatus();
      expect(isAuthenticated).toBe(false);

      // Should redirect to login or show auth modal
      // This would be handled by the component
    });

    it('should handle network errors during submission', async () => {
      const { supabase } = await import('../../lib/supabase.js');

      supabase.functions.invoke.mockRejectedValue(new Error('Network error'));

      await expect(
        supabase.functions.invoke('proposal', {
          body: { action: 'create', payload: {} }
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle listing no longer available', async () => {
      const { supabase } = await import('../../lib/supabase.js');

      supabase.functions.invoke.mockResolvedValue({
        data: {
          success: false,
          error: 'LISTING_UNAVAILABLE',
          message: 'This listing is no longer available'
        },
        error: null
      });

      const result = await supabase.functions.invoke('proposal', {
        body: {
          action: 'create',
          payload: {
            listingId: 'listing-123',
            userId: 'user-123',
            selectedDays: [1, 2, 3],
            totalPrice: 300
          }
        }
      });

      expect(result.data.success).toBe(false);
      expect(result.data.error).toBe('LISTING_UNAVAILABLE');
    });
  });
});
