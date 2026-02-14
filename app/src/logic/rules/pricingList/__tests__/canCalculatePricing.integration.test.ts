import { describe, it, expect } from 'vitest';
import { canCalculatePricing } from '../canCalculatePricing.js';

describe('canCalculatePricing - Integration Tests', () => {
  it('accepts nightly listings with at least one valid canonical nightly rate', () => {
    expect(
      canCalculatePricing({
        listing: {
          rental_type: 'Nightly',
          nightly_rate_for_2_night_stay: 100
        }
      })
    ).toBe(true);
  });

  it('rejects nightly listings when all canonical rates are missing or invalid', () => {
    expect(
      canCalculatePricing({
        listing: {
          rental_type: 'Nightly',
          nightly_rate_for_2_night_stay: null,
          nightly_rate_for_3_night_stay: 0,
          nightly_rate_for_4_night_stay: -10
        }
      })
    ).toBe(false);
  });

  it('accepts weekly and monthly listings with valid host rates', () => {
    expect(
      canCalculatePricing({
        listing: { rental_type: 'Weekly', weekly_rate_paid_to_host: 900 }
      })
    ).toBe(true);

    expect(
      canCalculatePricing({
        listing: { rental_type: 'Monthly', monthly_rate_paid_to_host: 3600 }
      })
    ).toBe(true);
  });

  it('rejects string rates because validation expects numeric type', () => {
    expect(
      canCalculatePricing({
        listing: { rental_type: 'Nightly', nightly_rate_for_2_night_stay: '100' }
      })
    ).toBe(false);
  });

  it('throws when listing is missing', () => {
    expect(() => canCalculatePricing({ listing: null })).toThrow('canCalculatePricing: listing is required');
    expect(() => canCalculatePricing({ listing: undefined })).toThrow('canCalculatePricing: listing is required');
  });
});
