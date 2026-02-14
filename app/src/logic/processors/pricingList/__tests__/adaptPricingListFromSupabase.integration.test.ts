import { describe, it, expect } from 'vitest';
import { adaptPricingListFromSupabase } from '../adaptPricingListFromSupabase.js';

describe('adaptPricingListFromSupabase - Integration Tests', () => {
  it('maps snake_case database columns to camelCase frontend fields', () => {
    const rawPricingList = {
      id: 'abc123',
      listing: 'listing456',
      created_by: 'user789',
      host_compensation: [null, 100, 95, 90, 85, 80, 75],
      markup_and_discount_multiplier: [null, 1.17, 1.12, 1.08, 1.05, 1.02, 0.99],
      nightly_price: [null, 117, 111, 105, 99, 94, 76],
      unused_nights: [false, false, false, false, false, false, true],
      unused_nights_discount: [null, 0.03, 0.03, 0.03, 0.03, 0.03, 0],
      unit_markup: 0,
      overall_site_markup: 0.17,
      combined_markup: 0.17,
      full_time_discount: 0.13,
      starting_nightly_price: 76,
      slope: -6.83,
      weekly_price_adjust: 0.05,
      rental_type: 'Nightly',
      number_selected_nights: [1, 2, 3],
      original_updated_at: '2025-01-15T10:30:00Z'
    };

    const result = adaptPricingListFromSupabase(rawPricingList);

    expect(result).toEqual({
      id: 'abc123',
      listingId: 'listing456',
      createdBy: 'user789',
      hostCompensation: [null, 100, 95, 90, 85, 80, 75],
      markupAndDiscountMultiplier: [null, 1.17, 1.12, 1.08, 1.05, 1.02, 0.99],
      nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
      unusedNights: [false, false, false, false, false, false, true],
      unusedNightsDiscount: [null, 0.03, 0.03, 0.03, 0.03, 0.03, 0],
      unitMarkup: 0,
      overallSiteMarkup: 0.17,
      combinedMarkup: 0.17,
      fullTimeDiscount: 0.13,
      startingNightlyPrice: 76,
      slope: -6.83,
      weeklyPriceAdjust: 0.05,
      rentalType: 'Nightly',
      numberSelectedNights: [1, 2, 3],
      modifiedDate: '2025-01-15T10:30:00Z'
    });
  });

  it('applies defaults for missing optional fields', () => {
    const result = adaptPricingListFromSupabase({ id: 'abc123', listing: 'listing456' });

    expect(result.hostCompensation).toEqual([]);
    expect(result.nightlyPrice).toEqual([]);
    expect(result.unitMarkup).toBe(0);
    expect(result.overallSiteMarkup).toBe(0.17);
    expect(result.combinedMarkup).toBe(0.17);
    expect(result.fullTimeDiscount).toBe(0.13);
    expect(result.rentalType).toBe('Nightly');
  });

  it('throws when input is null or undefined', () => {
    expect(() => adaptPricingListFromSupabase(null)).toThrow(
      'adaptPricingListFromSupabase: rawPricingList is required'
    );
    expect(() => adaptPricingListFromSupabase(undefined)).toThrow(
      'adaptPricingListFromSupabase: rawPricingList is required'
    );
  });
});
