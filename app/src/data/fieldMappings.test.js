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
      expect(PRICING_FIELDS.DAMAGE_DEPOSIT).toBe('damage_deposit');
      expect(PRICING_FIELDS.CLEANING_FEE).toBe('cleaning_fee');
      expect(PRICING_FIELDS.MONTHLY_RATE).toBe('monthly_host_rate');
      expect(PRICING_FIELDS.WEEKLY_RATE).toBe('weekly_host_rate');
      expect(PRICING_FIELDS.PRICE_OVERRIDE).toBe('price_override');
    });

    it('has all 7 nightly rate fields', () => {
      expect(PRICING_FIELDS.NIGHTLY_RATE_1).toBe('nightly_rate_1_night');
      expect(PRICING_FIELDS.NIGHTLY_RATE_2).toBe('nightly_rate_2_nights');
      expect(PRICING_FIELDS.NIGHTLY_RATE_3).toBe('nightly_rate_3_nights');
      expect(PRICING_FIELDS.NIGHTLY_RATE_4).toBe('nightly_rate_4_nights');
      expect(PRICING_FIELDS.NIGHTLY_RATE_5).toBe('nightly_rate_5_nights');
      expect(PRICING_FIELDS.NIGHTLY_RATE_6).toBe('nightly_rate_6_nights');
      expect(PRICING_FIELDS.NIGHTLY_RATE_7).toBe('nightly_rate_7_nights');
    });
  });

  describe('NIGHTLY_RATE_BY_COUNT', () => {
    it('maps 1-7 to correct field names', () => {
      expect(NIGHTLY_RATE_BY_COUNT[1]).toBe('nightly_rate_1_night');
      expect(NIGHTLY_RATE_BY_COUNT[2]).toBe('nightly_rate_2_nights');
      expect(NIGHTLY_RATE_BY_COUNT[3]).toBe('nightly_rate_3_nights');
      expect(NIGHTLY_RATE_BY_COUNT[4]).toBe('nightly_rate_4_nights');
      expect(NIGHTLY_RATE_BY_COUNT[5]).toBe('nightly_rate_5_nights');
      expect(NIGHTLY_RATE_BY_COUNT[6]).toBe('nightly_rate_6_nights');
      expect(NIGHTLY_RATE_BY_COUNT[7]).toBe('nightly_rate_7_nights');
    });

    it('references PRICING_FIELDS constants', () => {
      expect(NIGHTLY_RATE_BY_COUNT[1]).toBe(PRICING_FIELDS.NIGHTLY_RATE_1);
      expect(NIGHTLY_RATE_BY_COUNT[7]).toBe(PRICING_FIELDS.NIGHTLY_RATE_7);
    });
  });

  describe('AVAILABILITY_FIELDS', () => {
    it('preserves leading space in FIRST_AVAILABLE', () => {
      // Legacy field has leading space - this is intentional
      expect(AVAILABILITY_FIELDS.FIRST_AVAILABLE).toBe(' First Available');
      expect(AVAILABILITY_FIELDS.FIRST_AVAILABLE[0]).toBe(' ');
    });

    it('has all expected availability fields', () => {
      expect(AVAILABILITY_FIELDS.DAYS_AVAILABLE).toBe('Days Available (List of Days)');
      expect(AVAILABILITY_FIELDS.BLOCKED_DATES).toBe('Dates - Blocked');
      expect(AVAILABILITY_FIELDS.MIN_WEEKS).toBe('Minimum Weeks');
      expect(AVAILABILITY_FIELDS.MAX_WEEKS).toBe('Maximum Weeks');
    });
  });

  describe('FEATURE_FIELDS', () => {
    it('has all expected feature fields', () => {
      expect(FEATURE_FIELDS.AMENITIES_IN_UNIT).toBe('Features - Amenities In-Unit');
      expect(FEATURE_FIELDS.AMENITIES_IN_BUILDING).toBe('Features - Amenities In-Building');
      expect(FEATURE_FIELDS.SAFETY).toBe('Features - Safety');
      expect(FEATURE_FIELDS.HOUSE_RULES).toBe('Features - House Rules');
      expect(FEATURE_FIELDS.PHOTOS).toBe('Features - Photos');
    });
  });

  describe('LEASE_FIELDS', () => {
    it('has rental type field', () => {
      expect(LEASE_FIELDS.RENTAL_TYPE).toBe('rental type');
    });
  });

  describe('LOCATION_FIELDS', () => {
    it('has all expected location fields', () => {
      expect(LOCATION_FIELDS.ADDRESS).toBe('Location - Address');
      expect(LOCATION_FIELDS.ZIP_CODE).toBe('Location - Zip Code');
      expect(LOCATION_FIELDS.BOROUGH).toBe('Location - Borough');
    });
  });

  describe('IDENTITY_FIELDS', () => {
    it('has _id as primary key', () => {
      expect(IDENTITY_FIELDS.ID).toBe('_id');
    });
  });
});
