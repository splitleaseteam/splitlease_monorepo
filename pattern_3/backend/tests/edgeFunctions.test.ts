// =====================================================
// EDGE FUNCTIONS - INTEGRATION TESTS
// =====================================================
// Pattern 3: Price Anchoring - Edge Function Tests
// =====================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// =====================================================
// TEST CONFIGURATION
// =====================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-key';

const functionsBaseUrl = `${SUPABASE_URL}/functions/v1`;

// =====================================================
// HELPER: CALL EDGE FUNCTION
// =====================================================

async function callEdgeFunction(
  functionName: string,
  body: any
): Promise<{ status: number; data: any }> {
  const response = await fetch(`${functionsBaseUrl}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return {
    status: response.status,
    data,
  };
}

// =====================================================
// TEST SUITE: get_pricing_tiers
// =====================================================

describe('Edge Function: get_pricing_tiers', () => {
  it('should return pricing tiers for valid request', async () => {
    const { status, data } = await callEdgeFunction('get_pricing_tiers', {
      base_price: 450,
      anchor_price: 2835,
      anchor_type: 'buyout',
      session_id: 'test-session-001',
    });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.tiers).toHaveLength(3);
    expect(data.data.anchor.price).toBe(2835);
    expect(data.data.recommended_tier).toBeDefined();
  });

  it('should validate tier calculations', async () => {
    const { status, data } = await callEdgeFunction('get_pricing_tiers', {
      base_price: 450,
      anchor_price: 2835,
      anchor_type: 'buyout',
      session_id: 'test-session-002',
    });

    expect(status).toBe(200);

    const tiers = data.data.tiers;

    // Premium tier (115%)
    const premium = tiers.find((t: any) => t.tier_id === 'premium');
    expect(premium.calculated_price).toBe(517.50);
    expect(premium.multiplier).toBe(1.15);

    // Recommended tier (100%)
    const recommended = tiers.find((t: any) => t.tier_id === 'recommended');
    expect(recommended.calculated_price).toBe(450.00);
    expect(recommended.multiplier).toBe(1.00);

    // Budget tier (90%)
    const budget = tiers.find((t: any) => t.tier_id === 'budget');
    expect(budget.calculated_price).toBe(405.00);
    expect(budget.multiplier).toBe(0.90);
  });

  it('should validate savings calculations', async () => {
    const { status, data } = await callEdgeFunction('get_pricing_tiers', {
      base_price: 450,
      anchor_price: 2835,
      session_id: 'test-session-003',
    });

    expect(status).toBe(200);

    const tiers = data.data.tiers;

    tiers.forEach((tier: any) => {
      // All tiers should show savings vs anchor
      expect(tier.savings_amount).toBeGreaterThan(0);
      expect(tier.savings_percentage).toBeGreaterThan(0);

      // Savings should be calculated correctly
      const expectedSavings = 2835 - tier.calculated_price;
      expect(tier.savings_amount).toBeCloseTo(expectedSavings, 2);
    });
  });

  it('should include tier features', async () => {
    const { status, data } = await callEdgeFunction('get_pricing_tiers', {
      base_price: 450,
      anchor_price: 2835,
      session_id: 'test-session-004',
    });

    expect(status).toBe(200);

    const tiers = data.data.tiers;

    tiers.forEach((tier: any) => {
      expect(tier.features).toBeDefined();
      expect(Array.isArray(tier.features)).toBe(true);
      expect(tier.features.length).toBeGreaterThan(0);

      tier.features.forEach((feature: any) => {
        expect(feature.text).toBeDefined();
        expect(feature.icon).toBeDefined();
        expect(feature.order).toBeDefined();
      });
    });
  });

  it('should recommend premium for big spender', async () => {
    const { status, data } = await callEdgeFunction('get_pricing_tiers', {
      base_price: 450,
      anchor_price: 2835,
      user_archetype: 'big_spender',
      urgency: 'high',
      session_id: 'test-session-005',
    });

    expect(status).toBe(200);
    expect(data.data.recommended_tier.tier_id).toBe('premium');
  });

  it('should recommend budget for high flexibility', async () => {
    const { status, data } = await callEdgeFunction('get_pricing_tiers', {
      base_price: 450,
      anchor_price: 2835,
      user_archetype: 'high_flexibility',
      urgency: 'low',
      session_id: 'test-session-006',
    });

    expect(status).toBe(200);
    expect(data.data.recommended_tier.tier_id).toBe('budget');
  });

  it('should reject invalid base_price', async () => {
    const { status, data } = await callEdgeFunction('get_pricing_tiers', {
      base_price: -100,
      anchor_price: 2835,
      session_id: 'test-session-007',
    });

    expect(status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_REQUEST');
  });

  it('should reject missing session_id', async () => {
    const { status, data } = await callEdgeFunction('get_pricing_tiers', {
      base_price: 450,
      anchor_price: 2835,
    });

    expect(status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('session_id');
  });

  it('should reject invalid anchor_type', async () => {
    const { status, data } = await callEdgeFunction('get_pricing_tiers', {
      base_price: 450,
      anchor_price: 2835,
      anchor_type: 'invalid_type',
      session_id: 'test-session-008',
    });

    expect(status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('anchor_type');
  });
});

// =====================================================
// TEST SUITE: track_tier_selection
// =====================================================

describe('Edge Function: track_tier_selection', () => {
  it('should create tier selection record', async () => {
    const { status, data } = await callEdgeFunction('track_tier_selection', {
      booking_id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '987fcdeb-51a3-12d3-a456-426614174000',
      session_id: 'test-session-101',
      tier_id: 'recommended',
      base_price: 450,
      anchor_price: 2835,
      anchor_type: 'buyout',
      platform_fee: 5,
    });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.selection_id).toBeDefined();
    expect(data.data.tier_id).toBe('recommended');
    expect(data.data.tier_name).toBe('Recommended');
  });

  it('should calculate final price correctly', async () => {
    const { status, data } = await callEdgeFunction('track_tier_selection', {
      booking_id: '123e4567-e89b-12d3-a456-426614174001',
      user_id: '987fcdeb-51a3-12d3-a456-426614174000',
      session_id: 'test-session-102',
      tier_id: 'premium',
      base_price: 450,
      anchor_price: 2835,
      anchor_type: 'buyout',
      platform_fee: 5,
    });

    expect(status).toBe(200);

    // Premium tier: 450 * 1.15 = 517.50
    expect(data.data.final_price).toBe(517.50);

    // Total cost: 517.50 + 5 = 522.50
    expect(data.data.total_cost).toBe(522.50);

    // Savings: 2835 - 522.50 = 2312.50
    expect(data.data.savings_amount).toBeCloseTo(2312.50, 2);
  });

  it('should validate savings calculations for budget tier', async () => {
    const { status, data } = await callEdgeFunction('track_tier_selection', {
      booking_id: '123e4567-e89b-12d3-a456-426614174002',
      user_id: '987fcdeb-51a3-12d3-a456-426614174000',
      session_id: 'test-session-103',
      tier_id: 'budget',
      base_price: 450,
      anchor_price: 2835,
      anchor_type: 'buyout',
      platform_fee: 5,
    });

    expect(status).toBe(200);

    // Budget tier: 450 * 0.90 = 405.00
    expect(data.data.final_price).toBe(405.00);

    // Total cost: 405.00 + 5 = 410.00
    expect(data.data.total_cost).toBe(410.00);

    // Savings percentage should be > 85%
    expect(data.data.savings_percentage).toBeGreaterThan(85);
  });

  it('should reject invalid booking_id format', async () => {
    const { status, data } = await callEdgeFunction('track_tier_selection', {
      booking_id: 'invalid-uuid',
      user_id: '987fcdeb-51a3-12d3-a456-426614174000',
      session_id: 'test-session-104',
      tier_id: 'recommended',
      base_price: 450,
      anchor_price: 2835,
      anchor_type: 'buyout',
    });

    expect(status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('booking_id');
  });

  it('should reject invalid tier_id', async () => {
    const { status, data } = await callEdgeFunction('track_tier_selection', {
      booking_id: '123e4567-e89b-12d3-a456-426614174003',
      user_id: '987fcdeb-51a3-12d3-a456-426614174000',
      session_id: 'test-session-105',
      tier_id: 'invalid_tier',
      base_price: 450,
      anchor_price: 2835,
      anchor_type: 'buyout',
    });

    expect(status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should handle metadata correctly', async () => {
    const { status, data } = await callEdgeFunction('track_tier_selection', {
      booking_id: '123e4567-e89b-12d3-a456-426614174004',
      user_id: '987fcdeb-51a3-12d3-a456-426614174000',
      session_id: 'test-session-106',
      tier_id: 'recommended',
      base_price: 450,
      anchor_price: 2835,
      anchor_type: 'buyout',
      metadata: {
        user_archetype: 'big_spender',
        test_mode: true,
      },
    });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });
});

// =====================================================
// TEST SUITE: calculate_savings
// =====================================================

describe('Edge Function: calculate_savings', () => {
  it('should calculate massive savings correctly', async () => {
    const { status, data } = await callEdgeFunction('calculate_savings', {
      offer_price: 329,
      anchor_price: 2835,
      format: 'both',
    });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.savings_amount).toBeCloseTo(2506, 2);
    expect(data.data.savings_percentage).toBeCloseTo(88.39, 2);
    expect(data.data.is_saving).toBe(true);
    expect(data.data.saving_tier).toBe('massive');
    expect(data.data.display_message).toContain('Incredible value');
  });

  it('should calculate good savings correctly', async () => {
    const { status, data } = await callEdgeFunction('calculate_savings', {
      offer_price: 1400,
      anchor_price: 2835,
    });

    expect(status).toBe(200);
    expect(data.data.savings_percentage).toBeGreaterThan(50);
    expect(data.data.saving_tier).toBe('good');
    expect(data.data.display_message).toContain('Great deal');
  });

  it('should calculate modest savings correctly', async () => {
    const { status, data } = await callEdgeFunction('calculate_savings', {
      offer_price: 2750,
      anchor_price: 2835,
    });

    expect(status).toBe(200);
    expect(data.data.savings_percentage).toBeCloseTo(3, 1);
    expect(data.data.saving_tier).toBe('modest');
  });

  it('should handle no savings (more expensive)', async () => {
    const { status, data } = await callEdgeFunction('calculate_savings', {
      offer_price: 3000,
      anchor_price: 2835,
    });

    expect(status).toBe(200);
    expect(data.data.savings_amount).toBeLessThan(0);
    expect(data.data.is_saving).toBe(false);
    expect(data.data.saving_tier).toBe('none');
    expect(data.data.display_message).toContain('No savings');
  });

  it('should handle "basically free" case', async () => {
    const { status, data } = await callEdgeFunction('calculate_savings', {
      offer_price: 5,
      anchor_price: 2835,
    });

    expect(status).toBe(200);
    expect(data.data.savings_percentage).toBeGreaterThan(99);
    expect(data.data.display_message).toContain('Basically free');
  });

  it('should format absolute only', async () => {
    const { status, data } = await callEdgeFunction('calculate_savings', {
      offer_price: 329,
      anchor_price: 2835,
      format: 'absolute',
    });

    expect(status).toBe(200);
    expect(data.data.formatted_combined).toContain('$');
    expect(data.data.formatted_combined).not.toContain('%');
  });

  it('should format percentage only', async () => {
    const { status, data } = await callEdgeFunction('calculate_savings', {
      offer_price: 329,
      anchor_price: 2835,
      format: 'percentage',
    });

    expect(status).toBe(200);
    expect(data.data.formatted_combined).toContain('%');
    expect(data.data.formatted_combined).not.toContain('$');
  });

  it('should format both (default)', async () => {
    const { status, data } = await callEdgeFunction('calculate_savings', {
      offer_price: 329,
      anchor_price: 2835,
      format: 'both',
    });

    expect(status).toBe(200);
    expect(data.data.formatted_combined).toContain('$');
    expect(data.data.formatted_combined).toContain('%');
  });

  it('should reject invalid format', async () => {
    const { status, data } = await callEdgeFunction('calculate_savings', {
      offer_price: 329,
      anchor_price: 2835,
      format: 'invalid',
    });

    expect(status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should reject invalid anchor_price', async () => {
    const { status, data } = await callEdgeFunction('calculate_savings', {
      offer_price: 329,
      anchor_price: 0,
    });

    expect(status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('anchor_price');
  });
});

// =====================================================
// END-TO-END WORKFLOW TEST
// =====================================================

describe('End-to-End: Complete User Flow', () => {
  it('should handle complete anchoring flow', async () => {
    const sessionId = `e2e-session-${Date.now()}`;

    // Step 1: Get pricing tiers
    const tiersResponse = await callEdgeFunction('get_pricing_tiers', {
      base_price: 450,
      anchor_price: 2835,
      anchor_type: 'buyout',
      user_archetype: 'big_spender',
      urgency: 'medium',
      session_id: sessionId,
    });

    expect(tiersResponse.status).toBe(200);
    expect(tiersResponse.data.success).toBe(true);

    const tiers = tiersResponse.data.data.tiers;
    const recommendedTier = tiersResponse.data.data.recommended_tier;

    // Step 2: Calculate savings for selected tier
    const selectedTier = tiers.find((t: any) => t.tier_id === recommendedTier.tier_id);

    const savingsResponse = await callEdgeFunction('calculate_savings', {
      offer_price: selectedTier.calculated_price,
      anchor_price: 2835,
      format: 'both',
    });

    expect(savingsResponse.status).toBe(200);
    expect(savingsResponse.data.data.is_saving).toBe(true);

    // Step 3: Track tier selection
    const selectionResponse = await callEdgeFunction('track_tier_selection', {
      booking_id: `e2e-booking-${Date.now()}`,
      user_id: `e2e-user-${Date.now()}`,
      session_id: sessionId,
      tier_id: recommendedTier.tier_id,
      base_price: 450,
      anchor_price: 2835,
      anchor_type: 'buyout',
      platform_fee: 5,
      metadata: {
        e2e_test: true,
        recommended_tier: recommendedTier.tier_id,
      },
    });

    expect(selectionResponse.status).toBe(200);
    expect(selectionResponse.data.success).toBe(true);
    expect(selectionResponse.data.data.selection_id).toBeDefined();
  });
});
