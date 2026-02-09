import { describe, it, expect } from 'vitest';
import {
  PRICING_FIELDS,
  NIGHTLY_RATE_BY_COUNT,
  AVAILABILITY_FIELDS,
  FEATURE_FIELDS,
  LEASE_FIELDS,
  LOCATION_FIELDS,
  IDENTITY_FIELDS,
} from './fieldMappings';

describe('fieldMappings', () => {
  describe('PRICING_FIELDS', () => {
    it('has all expected pricing fields', () => {
      expect(PRICING_FIELDS.DAMAGE_DEPOSIT).toBe('damage_deposit_amount');
      expect(PRICING_FIELDS.CLEANING_FEE).toBe('cleaning_fee_amount');
      expect(PRICING_FIELDS.MONTHLY_RATE).toBe('monthly_rate_paid_to_host');
      expect(PRICING_FIELDS.WEEKLY_RATE).toBe('weekly_rate_paid_to_host');
      expect(PRICING_FIELDS.PRICE_OVERRIDE).toBe('price_override');
    });

    it('has all 7 nightly rate fields', () => {
      expect(PRICING_FIELDS.NIGHTLY_RATE_1).toBe('nightly_rate_for_1_night_stay');
      expect(PRICING_FIELDS.NIGHTLY_RATE_2).toBe('nightly_rate_for_2_night_stay');
      expect(PRICING_FIELDS.NIGHTLY_RATE_3).toBe('nightly_rate_for_3_night_stay');
      expect(PRICING_FIELDS.NIGHTLY_RATE_4).toBe('nightly_rate_for_4_night_stay');
      expect(PRICING_FIELDS.NIGHTLY_RATE_5).toBe('nightly_rate_for_5_night_stay');
      expect(PRICING_FIELDS.NIGHTLY_RATE_6).toBe('nightly_rate_for_6_night_stay');
      expect(PRICING_FIELDS.NIGHTLY_RATE_7).toBe('nightly_rate_for_7_night_stay');
    });
  });

  describe('NIGHTLY_RATE_BY_COUNT', () => {
    it('maps 1-7 to correct field names', () => {
      expect(NIGHTLY_RATE_BY_COUNT[1]).toBe('nightly_rate_for_1_night_stay');
      expect(NIGHTLY_RATE_BY_COUNT[2]).toBe('nightly_rate_for_2_night_stay');
      expect(NIGHTLY_RATE_BY_COUNT[3]).toBe('nightly_rate_for_3_night_stay');
      expect(NIGHTLY_RATE_BY_COUNT[4]).toBe('nightly_rate_for_4_night_stay');
      expect(NIGHTLY_RATE_BY_COUNT[5]).toBe('nightly_rate_for_5_night_stay');
      expect(NIGHTLY_RATE_BY_COUNT[6]).toBe('nightly_rate_for_6_night_stay');
      expect(NIGHTLY_RATE_BY_COUNT[7]).toBe('nightly_rate_for_7_night_stay');
    });

    it('references PRICING_FIELDS constants', () => {
      expect(NIGHTLY_RATE_BY_COUNT[1]).toBe(PRICING_FIELDS.NIGHTLY_RATE_1);
      expect(NIGHTLY_RATE_BY_COUNT[7]).toBe(PRICING_FIELDS.NIGHTLY_RATE_7);
    });
  });

  describe('AVAILABILITY_FIELDS', () => {
    it('has snake_case field names', () => {
      expect(AVAILABILITY_FIELDS.FIRST_AVAILABLE).toBe('first_available_date');
    });

    it('has all expected availability fields', () => {
      expect(AVAILABILITY_FIELDS.DAYS_AVAILABLE).toBe('available_days_as_day_numbers_json');
      expect(AVAILABILITY_FIELDS.BLOCKED_DATES).toBe('blocked_specific_dates_json');
      expect(AVAILABILITY_FIELDS.MIN_WEEKS).toBe('minimum_weeks_per_stay');
      expect(AVAILABILITY_FIELDS.MAX_WEEKS).toBe('maximum_weeks_per_stay');
    });
  });

  describe('FEATURE_FIELDS', () => {
    it('has all expected feature fields', () => {
      expect(FEATURE_FIELDS.AMENITIES_IN_UNIT).toBe('in_unit_amenity_reference_ids_json');
      expect(FEATURE_FIELDS.AMENITIES_IN_BUILDING).toBe('in_building_amenity_reference_ids_json');
      expect(FEATURE_FIELDS.SAFETY).toBe('safety_feature_reference_ids_json');
      expect(FEATURE_FIELDS.HOUSE_RULES).toBe('house_rule_reference_ids_json');
      expect(FEATURE_FIELDS.PHOTOS).toBe('photos_with_urls_captions_and_sort_order_json');
    });
  });

  describe('LEASE_FIELDS', () => {
    it('has rental type field', () => {
      expect(LEASE_FIELDS.RENTAL_TYPE).toBe('rental_type');
    });
  });

  describe('LOCATION_FIELDS', () => {
    it('has all expected location fields', () => {
      expect(LOCATION_FIELDS.ADDRESS).toBe('address_with_lat_lng_json');
      expect(LOCATION_FIELDS.ZIP_CODE).toBe('zip_code');
      expect(LOCATION_FIELDS.BOROUGH).toBe('borough');
    });
  });

  describe('IDENTITY_FIELDS', () => {
    it('has id as primary key', () => {
      expect(IDENTITY_FIELDS.ID).toBe('id');
    });
  });
});
