import { describe, it, expect } from 'vitest';
import { adaptPricingListForSupabase } from '../adaptPricingListForSupabase.js';

describe('adaptPricingListForSupabase - Integration Tests', () => {
  it('maps camelCase fields to snake_case database columns', () => {
    const pricingList = {
      id: 'abc123',
      createdBy: 'user789',
      hostCompensation: [null, 100, 95, 90, 85, 80, 75],
      markupAndDiscountMultiplier: [null, 1.17, 1.12, 1.08, 1.05, 1.02, 0.99],
      nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
      unusedNights: [false, false, false, false, false, false, true],
      unusedNightsDiscount: [null, 0.03, 0.03, 0.03, 0.03, 0.03, 0],
      unitMarkup: 0,
      combinedMarkup: 0.17,
      fullTimeDiscount: 0.13,
      startingNightlyPrice: 76,
      weeklyPriceAdjust: 0.05,
      modifiedDate: '2025-01-15T10:30:00Z'
    };

    const result = adaptPricingListForSupabase(pricingList);

    expect(result).toEqual({
      id: 'abc123',
      created_by: 'user789',
      host_compensation: [null, 100, 95, 90, 85, 80, 75],
      markup_and_discount_multiplier: [null, 1.17, 1.12, 1.08, 1.05, 1.02, 0.99],
      nightly_price: [null, 117, 111, 105, 99, 94, 76],
      unused_nights: [false, false, false, false, false, false, true],
      unused_nights_discount: [null, 0.03, 0.03, 0.03, 0.03, 0.03, 0],
      unit_markup: 0,
      combined_markup: 0.17,
      full_time_discount: 0.13,
      starting_nightly_price: 76,
      weekly_price_adjust: 0.05,
      original_updated_at: '2025-01-15T10:30:00Z'
    });
  });

  it('omits undefined values and preserves null values', () => {
    const pricingList = {
      id: 'abc123',
      nightlyPrice: null,
      combinedMarkup: null,
      unitMarkup: undefined
    };

    const result = adaptPricingListForSupabase(pricingList);

    expect(result).toEqual({
      id: 'abc123',
      nightly_price: null,
      combined_markup: null
    });
    expect(result).not.toHaveProperty('unit_markup');
  });

  it('throws when input is null or undefined', () => {
    expect(() => adaptPricingListForSupabase(null)).toThrow(
      'adaptPricingListForSupabase: pricingList is required'
    );
    expect(() => adaptPricingListForSupabase(undefined)).toThrow(
      'adaptPricingListForSupabase: pricingList is required'
    );
  });
});
