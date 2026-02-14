import { describe, it, expect } from 'vitest';
import { formatPricingListForDisplay } from '../formatPricingListForDisplay.js';

describe('formatPricingListForDisplay - Integration Tests', () => {
  it('formats camelCase pricing list for UI display', () => {
    const result = formatPricingListForDisplay({
      nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
      startingNightlyPrice: 76,
      combinedMarkup: 0.17,
      fullTimeDiscount: 0.13,
      rentalType: 'Nightly'
    });

    expect(result.priceTiers).toHaveLength(7);
    expect(result.priceTiers[1].formatted).toBe('$117/night');
    expect(result.startingAt).toBe('$76/night');
    expect(result.markupDisplay).toBe('17%');
    expect(result.discountDisplay).toBe('13%');
    expect(result.fullTimePrice).toBe('$76/night');
    expect(result.rentalType).toBe('Nightly');
  });

  it('supports snake_case Supabase payloads', () => {
    const supabasePayload = {
      nightly_price: [null, 120, 115, 110, 105, 100, 95],
      starting_nightly_price: 95,
      combined_markup: 0.2,
      full_time_discount: 0.1,
      rental_type: 'Monthly'
    };

    const result = formatPricingListForDisplay(supabasePayload as any);

    expect(result.priceTiers[1].price).toBe(120);
    expect(result.startingPrice).toBe(95);
    expect(result.markupDisplay).toBe('20%');
    expect(result.discountDisplay).toBe('10%');
    expect(result.rentalType).toBe('Monthly');
  });

  it('handles empty and invalid values gracefully', () => {
    const result = formatPricingListForDisplay({
      nightlyPrice: [null, NaN, 10],
      startingNightlyPrice: NaN
    });

    expect(result.priceTiers[0].formatted).toBe('N/A');
    expect(result.priceTiers[1].formatted).toBe('N/A');
    expect(result.startingAt).toBe('Price varies');
  });

  it('throws when pricingList is null or undefined', () => {
    expect(() => formatPricingListForDisplay(null)).toThrow(
      'formatPricingListForDisplay: pricingList is required'
    );
    expect(() => formatPricingListForDisplay(undefined)).toThrow(
      'formatPricingListForDisplay: pricingList is required'
    );
  });
});
