// =====================================================
// PRICE ANCHORING SERVICE - UNIT TESTS
// =====================================================
// Pattern 3: Price Anchoring - Test Suite
// =====================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPriceAnchoringService, PRICE_TIER_MULTIPLIERS } from '../lib/priceAnchoringService';

// =====================================================
// MOCK SUPABASE CLIENT
// =====================================================

function createMockSupabase() {
  return {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
          single: vi.fn(),
        })),
        single: vi.fn(),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  };
}

// =====================================================
// MOCK DATA
// =====================================================

const mockTiers = [
  {
    tier_id: 'premium',
    tier_name: 'Premium',
    multiplier: 1.15,
    calculated_price: 517.50,
    display_order: 1,
    badge_text: 'Fastest',
    description: 'Priority handling',
    acceptance_rate: 0.89,
    avg_response_time_hours: 4,
    is_recommended: false,
    features: [
      { text: 'Highest acceptance rate', icon: 'trophy', order: 1 },
      { text: 'Same-day response typical', icon: 'bolt', order: 2 },
      { text: 'VIP processing', icon: 'crown', order: 3 },
    ],
    savings_amount: 2317.50,
    savings_percentage: 81.75,
  },
  {
    tier_id: 'recommended',
    tier_name: 'Recommended',
    multiplier: 1.00,
    calculated_price: 450.00,
    display_order: 2,
    badge_text: 'Most Popular',
    description: 'Best value',
    acceptance_rate: 0.73,
    avg_response_time_hours: 12,
    is_recommended: true,
    features: [
      { text: 'Fair market rate', icon: 'star', order: 1 },
      { text: 'Faster acceptance', icon: 'zap', order: 2 },
      { text: 'Preferred by 73% of users', icon: 'users', order: 3 },
    ],
    savings_amount: 2385.00,
    savings_percentage: 84.13,
  },
  {
    tier_id: 'budget',
    tier_name: 'Budget',
    multiplier: 0.90,
    calculated_price: 405.00,
    display_order: 3,
    badge_text: null,
    description: 'Basic offer',
    acceptance_rate: 0.45,
    avg_response_time_hours: 48,
    is_recommended: false,
    features: [
      { text: 'Standard processing', icon: 'check', order: 1 },
      { text: 'May take longer to accept', icon: 'clock', order: 2 },
      { text: 'Lower priority', icon: 'info', order: 3 },
    ],
    savings_amount: 2430.00,
    savings_percentage: 85.72,
  },
];

const mockRecommendedTier = [
  {
    tier_id: 'recommended',
    tier_name: 'Recommended',
    multiplier: 1.00,
    reason: 'Most popular choice among users',
  },
];

// =====================================================
// TEST SUITE
// =====================================================

describe('PriceAnchoringService', () => {
  let service: any;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = createPriceAnchoringService(mockSupabase as any);
  });

  // =====================================================
  // GET PRICING TIERS
  // =====================================================

  describe('getPricingTiers', () => {
    it('should fetch pricing tiers with correct anchor', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockTiers, error: null });

      const result = await service.getPricingTiers(450, 2835, 'buyout');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_all_tier_prices', {
        p_base_price: 450,
        p_anchor_price: 2835,
      });

      expect(result.tiers).toHaveLength(3);
      expect(result.anchor.price).toBe(2835);
      expect(result.anchor.type).toBe('buyout');
      expect(result.anchor.description).toContain('buyout');
    });

    it('should use base price as anchor if not provided', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockTiers, error: null });

      const result = await service.getPricingTiers(450);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_all_tier_prices', {
        p_base_price: 450,
        p_anchor_price: 450,
      });

      expect(result.anchor.price).toBe(450);
    });

    it('should throw error if no tiers found', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await expect(service.getPricingTiers(450)).rejects.toThrow('No active pricing tiers found');
    });

    it('should throw error on database error', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.getPricingTiers(450)).rejects.toThrow('Failed to fetch pricing tiers');
    });
  });

  // =====================================================
  // GET RECOMMENDED TIER
  // =====================================================

  describe('getRecommendedTier', () => {
    it('should fetch recommended tier for big spender', async () => {
      const premiumTier = [
        {
          tier_id: 'premium',
          tier_name: 'Premium',
          multiplier: 1.15,
          reason: 'Recommended based on your profile and urgency',
        },
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: premiumTier, error: null });

      const result = await service.getRecommendedTier('big_spender', 'high');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_recommended_tier', {
        p_user_archetype: 'big_spender',
        p_urgency: 'high',
      });

      expect(result.tier_id).toBe('premium');
      expect(result.reason).toContain('profile and urgency');
    });

    it('should return default recommendation on error', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Error' },
      });

      const result = await service.getRecommendedTier();

      expect(result.tier_id).toBe('recommended');
      expect(result.tier_name).toBe('Recommended');
      expect(result.multiplier).toBe(1.0);
    });

    it('should use default values if not provided', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockRecommendedTier, error: null });

      await service.getRecommendedTier();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_recommended_tier', {
        p_user_archetype: 'average_user',
        p_urgency: 'medium',
      });
    });
  });

  // =====================================================
  // GET ANCHOR CONTEXT
  // =====================================================

  describe('getAnchorContext', () => {
    it('should fetch complete anchor context', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: mockTiers, error: null })
        .mockResolvedValueOnce({ data: mockRecommendedTier, error: null });

      const result = await service.getAnchorContext(450, 2835, 'buyout', 'big_spender', 'high');

      expect(result.anchor.price).toBe(2835);
      expect(result.tiers).toHaveLength(3);
      expect(result.recommended_tier.tier_id).toBe('recommended');
      expect(result.base_price).toBe(450);
    });
  });

  // =====================================================
  // CALCULATE TIER PRICE
  // =====================================================

  describe('calculateTierPrice', () => {
    it('should calculate price for premium tier', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: 517.50, error: null });

      const result = await service.calculateTierPrice(450, 'premium');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('calculate_tier_price', {
        p_base_price: 450,
        p_tier_id: 'premium',
      });

      expect(result).toBe(517.50);
    });

    it('should calculate price for budget tier', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: 405.00, error: null });

      const result = await service.calculateTierPrice(450, 'budget');

      expect(result).toBe(405.00);
    });

    it('should throw error on invalid tier', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid tier' },
      });

      await expect(service.calculateTierPrice(450, 'invalid')).rejects.toThrow(
        'Failed to calculate tier price'
      );
    });
  });

  // =====================================================
  // CALCULATE SAVINGS
  // =====================================================

  describe('calculateSavings', () => {
    it('should calculate savings for crash vs buyout', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [{ savings_amount: 2506.00, savings_percentage: 88.39 }],
        error: null,
      });

      const result = await service.calculateSavings(329, 2835);

      expect(result.amount).toBe(2506.00);
      expect(result.percentage).toBe(88.39);
    });

    it('should calculate zero savings when prices equal', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [{ savings_amount: 0, savings_percentage: 0 }],
        error: null,
      });

      const result = await service.calculateSavings(450, 450);

      expect(result.amount).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('should handle negative savings (more expensive)', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [{ savings_amount: -165.00, savings_percentage: -5.82 }],
        error: null,
      });

      const result = await service.calculateSavings(3000, 2835);

      expect(result.amount).toBe(-165.00);
      expect(result.percentage).toBe(-5.82);
    });
  });

  // =====================================================
  // CALCULATE SAVINGS LOCAL (WITH FORMATTING)
  // =====================================================

  describe('calculateSavingsLocal', () => {
    it('should calculate and format massive savings', () => {
      const result = service.calculateSavingsLocal(329, 2835);

      expect(result.savings_amount).toBe(2506);
      expect(result.savings_percentage).toBe(88.39);
      expect(result.is_saving).toBe(true);
      expect(result.saving_tier).toBe('massive');
      expect(result.formatted_amount).toContain('$2,506');
      expect(result.formatted_percentage).toBe('88%');
      expect(result.display_message).toContain('Incredible value');
    });

    it('should classify savings tiers correctly', () => {
      // Massive (>50%)
      const massive = service.calculateSavingsLocal(329, 2835);
      expect(massive.saving_tier).toBe('massive');

      // Good (20-50%)
      const good = service.calculateSavingsLocal(1400, 2835);
      expect(good.saving_tier).toBe('good');

      // Modest (<20%)
      const modest = service.calculateSavingsLocal(2750, 2835);
      expect(modest.saving_tier).toBe('modest');

      // None (negative)
      const none = service.calculateSavingsLocal(3000, 2835);
      expect(none.saving_tier).toBe('none');
    });

    it('should format "basically free" for 99%+ savings', () => {
      const result = service.calculateSavingsLocal(5, 2835);

      expect(result.savings_percentage).toBeGreaterThan(99);
      expect(result.display_message).toContain('Basically free');
    });

    it('should handle no savings correctly', () => {
      const result = service.calculateSavingsLocal(3000, 2835);

      expect(result.is_saving).toBe(false);
      expect(result.saving_tier).toBe('none');
      expect(result.display_message).toContain('No savings');
    });
  });

  // =====================================================
  // TRACK TIER SELECTION
  // =====================================================

  describe('trackTierSelection', () => {
    it('should create tier selection record', async () => {
      const tierData = {
        tier_id: 'recommended',
        tier_name: 'Recommended',
        multiplier: 1.00,
      };

      const selectionData = {
        id: 'selection-123',
      };

      mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: tierData,
        error: null,
      });

      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: [{ savings_amount: 2380, savings_percentage: 83.95 }],
          error: null,
        })
        .mockResolvedValueOnce({ data: mockTiers, error: null })
        .mockResolvedValueOnce({ data: 'event-123', error: null });

      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: selectionData,
        error: null,
      });

      const result = await service.trackTierSelection({
        bookingId: 'booking-123',
        userId: 'user-123',
        sessionId: 'session-123',
        tierId: 'recommended',
        basePrice: 450,
        anchorPrice: 2835,
        anchorType: 'buyout',
        platformFee: 5,
        metadata: { test: true },
      });

      expect(result).toBe('selection-123');
    });

    it('should throw error for invalid tier', async () => {
      mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Tier not found' },
      });

      await expect(
        service.trackTierSelection({
          bookingId: 'booking-123',
          userId: 'user-123',
          sessionId: 'session-123',
          tierId: 'invalid',
          basePrice: 450,
          anchorPrice: 2835,
          anchorType: 'buyout',
        })
      ).rejects.toThrow('Invalid or inactive tier');
    });
  });

  // =====================================================
  // TRACK ANALYTICS EVENT
  // =====================================================

  describe('trackAnalyticsEvent', () => {
    it('should track tiers_viewed event', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: mockTiers, error: null })
        .mockResolvedValueOnce({ data: 'event-123', error: null });

      const result = await service.trackAnalyticsEvent({
        sessionId: 'session-123',
        eventType: 'tiers_viewed',
        basePrice: 450,
        anchorPrice: 2835,
        anchorType: 'buyout',
      });

      expect(result).toBe('event-123');
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'track_tier_selection_event',
        expect.objectContaining({
          p_session_id: 'session-123',
          p_event_type: 'tiers_viewed',
        })
      );
    });

    it('should track tier_selected event with tier info', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: mockTiers, error: null })
        .mockResolvedValueOnce({ data: 'event-456', error: null });

      await service.trackAnalyticsEvent({
        userId: 'user-123',
        sessionId: 'session-123',
        eventType: 'tier_selected',
        basePrice: 450,
        anchorPrice: 2835,
        anchorType: 'buyout',
        selectedTierId: 'recommended',
        selectedPrice: 455,
        bookingId: 'booking-123',
      });

      expect(mockSupabase.rpc).toHaveBeenLastCalledWith(
        'track_tier_selection_event',
        expect.objectContaining({
          p_selected_tier_id: 'recommended',
          p_selected_price: 455,
        })
      );
    });
  });

  // =====================================================
  // GET TIER ANALYTICS
  // =====================================================

  describe('getTierAnalytics', () => {
    it('should fetch tier performance analytics', async () => {
      const mockAnalytics = [
        {
          tier_id: 'premium',
          tier_name: 'Premium',
          total_views: 1000,
          total_selections: 250,
          selection_rate: 25.0,
          avg_savings_amount: 2300.0,
          avg_savings_percentage: 81.0,
          total_revenue: 129375.0,
        },
        {
          tier_id: 'recommended',
          tier_name: 'Recommended',
          total_views: 1000,
          total_selections: 500,
          selection_rate: 50.0,
          avg_savings_amount: 2380.0,
          avg_savings_percentage: 84.0,
          total_revenue: 227500.0,
        },
        {
          tier_id: 'budget',
          tier_name: 'Budget',
          total_views: 1000,
          total_selections: 250,
          selection_rate: 25.0,
          avg_savings_amount: 2430.0,
          avg_savings_percentage: 86.0,
          total_revenue: 101250.0,
        },
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: mockAnalytics, error: null });

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const result = await service.getTierAnalytics(startDate, endDate);

      expect(result).toHaveLength(3);
      expect(result[0].tier_id).toBe('premium');
      expect(result[1].selection_rate).toBe(50.0);
    });

    it('should use default date range if not provided', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await service.getTierAnalytics();

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_tier_analytics',
        expect.objectContaining({
          p_start_date: expect.any(String),
          p_end_date: expect.any(String),
        })
      );
    });
  });

  // =====================================================
  // TIER MULTIPLIERS
  // =====================================================

  describe('Tier Multipliers', () => {
    it('should have correct multiplier values', () => {
      expect(PRICE_TIER_MULTIPLIERS.BUDGET).toBe(0.90);
      expect(PRICE_TIER_MULTIPLIERS.RECOMMENDED).toBe(1.00);
      expect(PRICE_TIER_MULTIPLIERS.PREMIUM).toBe(1.15);
    });

    it('should calculate prices correctly with multipliers', () => {
      const basePrice = 450;

      const budgetPrice = basePrice * PRICE_TIER_MULTIPLIERS.BUDGET;
      const recommendedPrice = basePrice * PRICE_TIER_MULTIPLIERS.RECOMMENDED;
      const premiumPrice = basePrice * PRICE_TIER_MULTIPLIERS.PREMIUM;

      expect(budgetPrice).toBe(405);
      expect(recommendedPrice).toBe(450);
      expect(premiumPrice).toBe(517.5);
    });
  });
});

// =====================================================
// INTEGRATION TESTS
// =====================================================

describe('PriceAnchoringService - Integration Scenarios', () => {
  let service: any;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = createPriceAnchoringService(mockSupabase as any);
  });

  it('should handle complete user flow: view tiers -> select -> track', async () => {
    // Step 1: Get pricing tiers
    mockSupabase.rpc.mockResolvedValueOnce({ data: mockTiers, error: null });

    const { tiers, anchor } = await service.getPricingTiers(450, 2835, 'buyout');

    expect(tiers).toHaveLength(3);
    expect(anchor.price).toBe(2835);

    // Step 2: Calculate savings for selected tier
    const selectedTier = tiers.find((t: any) => t.tier_id === 'recommended');
    const savings = service.calculateSavingsLocal(
      selectedTier.calculated_price,
      anchor.price
    );

    expect(savings.savings_percentage).toBeGreaterThan(80);
    expect(savings.saving_tier).toBe('massive');

    // Step 3: Track selection
    mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
      data: { tier_id: 'recommended', tier_name: 'Recommended', multiplier: 1.00 },
      error: null,
    });

    mockSupabase.rpc
      .mockResolvedValueOnce({
        data: [{ savings_amount: 2380, savings_percentage: 83.95 }],
        error: null,
      })
      .mockResolvedValueOnce({ data: mockTiers, error: null })
      .mockResolvedValueOnce({ data: 'event-123', error: null });

    mockSupabase.from().insert().select().single.mockResolvedValueOnce({
      data: { id: 'selection-123' },
      error: null,
    });

    const selectionId = await service.trackTierSelection({
      bookingId: 'booking-123',
      userId: 'user-123',
      sessionId: 'session-123',
      tierId: 'recommended',
      basePrice: 450,
      anchorPrice: 2835,
      anchorType: 'buyout',
    });

    expect(selectionId).toBe('selection-123');
  });

  it('should handle edge case: swap more expensive than crash', async () => {
    const swapPrice = 210;
    const crashPrice = 324;
    const buyoutPrice = 2835;

    const swapSavings = service.calculateSavingsLocal(swapPrice, buyoutPrice);
    const crashSavings = service.calculateSavingsLocal(crashPrice, buyoutPrice);

    expect(swapSavings.savings_amount).toBeGreaterThan(crashSavings.savings_amount);
    expect(swapSavings.savings_percentage).toBeGreaterThan(crashSavings.savings_percentage);

    // Swap should still show as massive savings vs buyout
    expect(swapSavings.saving_tier).toBe('massive');
  });

  it('should handle edge case: very small savings', async () => {
    const offerPrice = 2750;
    const anchorPrice = 2835;

    const savings = service.calculateSavingsLocal(offerPrice, anchorPrice);

    expect(savings.savings_amount).toBe(85);
    expect(savings.savings_percentage).toBe(3);
    expect(savings.saving_tier).toBe('modest');
    expect(savings.display_message).not.toContain('Incredible');
  });

  it('should handle edge case: all prices similar', async () => {
    const buyoutPrice = 500;
    const crashPrice = 480;
    const swapPrice = 450;

    const crashSavings = service.calculateSavingsLocal(crashPrice, buyoutPrice);
    const swapSavings = service.calculateSavingsLocal(swapPrice, buyoutPrice);

    expect(crashSavings.savings_percentage).toBe(4);
    expect(swapSavings.savings_percentage).toBe(10);

    // Both should be modest
    expect(crashSavings.saving_tier).toBe('modest');
    expect(swapSavings.saving_tier).toBe('modest');
  });
});
