import { describe, it, expect } from 'vitest';
import { extractHostRatesFromListing } from '../extractHostRatesFromListing.js';

describe('extractHostRatesFromListing - Integration Tests', () => {
  it('extracts nightly rates from canonical snake_case listing fields', () => {
    const listing = {
      nightly_rate_for_1_night_stay: 150,
      nightly_rate_for_2_night_stay: 140,
      nightly_rate_for_3_night_stay: 130,
      nightly_rate_for_4_night_stay: 120,
      nightly_rate_for_5_night_stay: 110,
      nightly_rate_for_6_night_stay: 100,
      nightly_rate_for_7_night_stay: 90,
      cleaning_fee: 50,
      damage_deposit: 200,
      price_override: 120,
      rental_type: 'Nightly' as const
    };

    expect(extractHostRatesFromListing(listing)).toEqual({
      rate1Night: 150,
      rate2Nights: 140,
      rate3Nights: 130,
      rate4Nights: 120,
      rate5Nights: 110,
      rate6Nights: 100,
      rate7Nights: 90,
      cleaningFee: 50,
      damageDeposit: 200,
      priceOverride: 120
    });
  });

  it('normalizes invalid values to null and coerces numeric strings', () => {
    const listing = {
      nightly_rate_for_1_night_stay: null,
      nightly_rate_for_2_night_stay: '100',
      nightly_rate_for_3_night_stay: 'bad',
      nightly_rate_for_4_night_stay: -1,
      nightly_rate_for_5_night_stay: '',
      nightly_rate_for_6_night_stay: '85.5',
      nightly_rate_for_7_night_stay: undefined
    };

    const result = extractHostRatesFromListing(listing);

    expect(result.rate1Night).toBeNull();
    expect(result.rate2Nights).toBe(100);
    expect(result.rate3Nights).toBeNull();
    expect(result.rate4Nights).toBeNull();
    expect(result.rate5Nights).toBeNull();
    expect(result.rate6Nights).toBe(85.5);
    expect(result.rate7Nights).toBeNull();
  });

  it('converts weekly and monthly host rates into synthetic nightly rates', () => {
    const weekly = extractHostRatesFromListing({
      rental_type: 'Weekly',
      weekly_rate_paid_to_host: 700
    });

    expect(weekly.rate1Night).toBe(700);
    expect(weekly.rate7Nights).toBe(100);

    const monthly = extractHostRatesFromListing({
      rental_type: 'Monthly',
      monthly_rate_paid_to_host: 3040
    });

    expect(monthly.rate1Night).toBeCloseTo(700, 0);
    expect(monthly.rate7Nights).toBeCloseTo(100, 0);
  });

  it('throws when listing is null or undefined', () => {
    expect(() => extractHostRatesFromListing(null)).toThrow(
      'extractHostRatesFromListing: listing is required'
    );
    expect(() => extractHostRatesFromListing(undefined)).toThrow(
      'extractHostRatesFromListing: listing is required'
    );
  });
});
