/**
 * Integration tests for formatPricingListForDisplay processor.
 *
 * Tests formatting of pricing data for UI display including
 * currency formatting, label generation, and derived display values.
 */

import { describe, it, expect } from 'vitest';
import { formatPricingListForDisplay } from '../formatPricingListForDisplay.js';

describe('formatPricingListForDisplay - Integration Tests', () => {
  describe('price tiers formatting', () => {
    it('should format all 7 price tiers with labels', () => {
      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers).toEqual([
        { nights: 1, price: null, label: '1 night', formatted: 'N/A', isFullTime: false },
        { nights: 2, price: 117, label: '2 nights', formatted: '$117/night', isFullTime: false },
        { nights: 3, price: 111, label: '3 nights', formatted: '$111/night', isFullTime: false },
        { nights: 4, price: 105, label: '4 nights', formatted: '$105/night', isFullTime: false },
        { nights: 5, price: 99, label: '5 nights', formatted: '$99/night', isFullTime: false },
        { nights: 6, price: 94, label: '6 nights', formatted: '$94/night', isFullTime: false },
        { nights: 7, price: 76, label: '7 nights', formatted: '$76/night', isFullTime: true }
      ]);
    });

    it('should handle Bubble-style field name for nightly prices', () => {
      const pricingList = {
        'Nightly Price': [null, 120, 115, 110, 105, 100, 95]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers).toHaveLength(7);
      expect(result.priceTiers[1].price).toBe(120);
      expect(result.priceTiers[1].formatted).toBe('$120/night');
    });

    it('should mark 7-night tier as full-time', () => {
      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers[0].isFullTime).toBe(false);
      expect(result.priceTiers[6].isFullTime).toBe(true);
    });

    it('should format null prices as N/A', () => {
      const pricingList = {
        nightlyPrice: [null, 117, null, 105, null, 94, null]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers[0].formatted).toBe('N/A');
      expect(result.priceTiers[2].formatted).toBe('N/A');
      expect(result.priceTiers[4].formatted).toBe('N/A');
      expect(result.priceTiers[6].formatted).toBe('N/A');
    });

    it('should round decimal prices to whole numbers', () => {
      const pricingList = {
        nightlyPrice: [null, 117.49, 111.50, 105.99, 99.01, 94.75, 76.25]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers[1].formatted).toBe('$117/night');
      expect(result.priceTiers[2].formatted).toBe('$112/night');
      expect(result.priceTiers[3].formatted).toBe('$106/night');
      expect(result.priceTiers[4].formatted).toBe('$99/night');
      expect(result.priceTiers[5].formatted).toBe('$95/night');
      expect(result.priceTiers[6].formatted).toBe('$76/night');
    });
  });

  describe('starting price formatting', () => {
    it('should format starting price with camelCase field', () => {
      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
        startingNightlyPrice: 76
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.startingAt).toBe('$76/night');
      expect(result.startingPrice).toBe(76);
    });

    it('should format starting price with Bubble-style field', () => {
      const pricingList = {
        'Nightly Price': [null, 117, 111, 105, 99, 94, 76],
        'Starting Nightly Price': 76
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.startingAt).toBe('$76/night');
      expect(result.startingPrice).toBe(76);
    });

    it('should show "Price varies" when starting price is null', () => {
      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
        startingNightlyPrice: null
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.startingAt).toBe('Price varies');
      expect(result.startingPrice).toBeNull();
    });

    it('should show "Price varies" when starting price is undefined', () => {
      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.startingAt).toBe('Price varies');
      expect(result.startingPrice).toBeNull();
    });

    it('should round starting price to whole number', () => {
      const pricingList = {
        startingNightlyPrice: 76.78
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.startingAt).toBe('$77/night');
      expect(result.startingPrice).toBe(77);
    });
  });

  describe('markup percentage formatting', () => {
    it('should format markup with camelCase field', () => {
      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
        combinedMarkup: 0.17
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.markupDisplay).toBe('17%');
    });

    it('should format markup with Bubble-style field', () => {
      const pricingList = {
        'Nightly Price': [null, 117, 111, 105, 99, 94, 76],
        'Combined Markup': 0.17
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.markupDisplay).toBe('17%');
    });

    it('should default to 17% markup when not provided', () => {
      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.markupDisplay).toBe('17%');
    });

    it('should round markup percentage', () => {
      const pricingList = {
        combinedMarkup: 0.1715
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.markupDisplay).toBe('17%');
    });

    it('should handle zero markup', () => {
      const pricingList = {
        combinedMarkup: 0
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.markupDisplay).toBe('0%');
    });

    it('should handle high markup values', () => {
      const pricingList = {
        combinedMarkup: 0.25
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.markupDisplay).toBe('25%');
    });
  });

  describe('discount percentage formatting', () => {
    it('should format discount with camelCase field', () => {
      const pricingList = {
        fullTimeDiscount: 0.13
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.discountDisplay).toBe('13%');
    });

    it('should format discount with Bubble-style field', () => {
      const pricingList = {
        'Full Time Discount': 0.13
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.discountDisplay).toBe('13%');
    });

    it('should default to 13% discount when not provided', () => {
      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.discountDisplay).toBe('13%');
    });

    it('should round discount percentage', () => {
      const pricingList = {
        fullTimeDiscount: 0.1349
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.discountDisplay).toBe('13%');
    });
  });

  describe('full-time price formatting', () => {
    it('should format 7-night price as full-time price', () => {
      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.fullTimePrice).toBe('$76/night');
    });

    it('should show N/A for null full-time price', () => {
      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, null]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.fullTimePrice).toBe('N/A');
    });

    it('should handle missing nightly price array', () => {
      const pricingList = {};

      const result = formatPricingListForDisplay(pricingList);

      expect(result.fullTimePrice).toBe('N/A');
    });
  });

  describe('rental type handling', () => {
    it('should pass through rental type from camelCase field', () => {
      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
        rentalType: 'Nightly'
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.rentalType).toBe('Nightly');
    });

    it('should pass through rental type from Bubble-style field', () => {
      const pricingList = {
        'Nightly Price': [null, 117, 111, 105, 99, 94, 76],
        'rental type': 'Monthly'
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.rentalType).toBe('Monthly');
    });

    it('should default to Nightly when rental type not provided', () => {
      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.rentalType).toBe('Nightly');
    });
  });

  describe('validation', () => {
    it('should throw error when pricingList is null', () => {
      expect(() => formatPricingListForDisplay(null)).toThrow(
        'formatPricingListForDisplay: pricingList is required'
      );
    });

    it('should throw error when pricingList is undefined', () => {
      expect(() => formatPricingListForDisplay(undefined)).toThrow(
        'formatPricingListForDisplay: pricingList is required'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty pricing list', () => {
      const pricingList = {};

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers).toEqual([]);
      expect(result.startingAt).toBe('Price varies');
      expect(result.markupDisplay).toBe('17%');
      expect(result.discountDisplay).toBe('13%');
      expect(result.fullTimePrice).toBe('N/A');
      expect(result.rentalType).toBe('Nightly');
    });

    it('should handle NaN values gracefully', () => {
      const pricingList = {
        nightlyPrice: [null, NaN, 111, 105, 99, 94, 76],
        startingNightlyPrice: NaN
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers[1].formatted).toBe('N/A');
      expect(result.startingAt).toBe('Price varies');
    });

    it('should handle very large prices', () => {
      const pricingList = {
        nightlyPrice: [null, 9999, 8888, 7777, 6666, 5555, 4444]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers[1].formatted).toBe('$9999/night');
      expect(result.priceTiers[6].formatted).toBe('$4444/night');
    });

    it('should handle very small prices', () => {
      const pricingList = {
        nightlyPrice: [null, 10, 9, 8, 7, 6, 5]
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers[1].formatted).toBe('$10/night');
      expect(result.priceTiers[6].formatted).toBe('$5/night');
    });

    it('should handle zero prices', () => {
      const pricingList = {
        nightlyPrice: [null, 0, 95, 90, 85, 80, 75],
        startingNightlyPrice: 0
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers[1].formatted).toBe('$0/night');
      expect(result.startingAt).toBe('$0/night');
    });
  });

  describe('real-world scenarios', () => {
    it('should format typical NYC listing prices', () => {
      const pricingList = {
        nightlyPrice: [null, 150, 140, 130, 120, 110, 95],
        startingNightlyPrice: 95,
        combinedMarkup: 0.17,
        fullTimeDiscount: 0.13,
        rentalType: 'Nightly'
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers).toHaveLength(7);
      expect(result.startingAt).toBe('$95/night');
      expect(result.markupDisplay).toBe('17%');
      expect(result.discountDisplay).toBe('13%');
      expect(result.fullTimePrice).toBe('$95/night');
      expect(result.rentalType).toBe('Nightly');
    });

    it('should format luxury listing prices', () => {
      const pricingList = {
        nightlyPrice: [null, 500, 450, 400, 350, 300, 250],
        startingNightlyPrice: 250,
        combinedMarkup: 0.20,
        fullTimeDiscount: 0.15,
        rentalType: 'Nightly'
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.startingAt).toBe('$250/night');
      expect(result.markupDisplay).toBe('20%');
      expect(result.discountDisplay).toBe('15%');
      expect(result.fullTimePrice).toBe('$250/night');
    });

    it('should format budget listing prices', () => {
      const pricingList = {
        nightlyPrice: [null, 75, 70, 65, 60, 55, 50],
        startingNightlyPrice: 50,
        combinedMarkup: 0.15,
        fullTimeDiscount: 0.10
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.startingAt).toBe('$50/night');
      expect(result.markupDisplay).toBe('15%');
      expect(result.discountDisplay).toBe('10%');
    });

    it('should handle database response with Bubble-style fields', () => {
      const pricingList = {
        id: 'abc123',
        listing: 'listing456',
        'Nightly Price': [null, 117, 111, 105, 99, 94, 76],
        'Starting Nightly Price': 76,
        'Combined Markup': 0.17,
        'Full Time Discount': 0.13,
        'rental type': 'Nightly'
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers).toHaveLength(7);
      expect(result.startingAt).toBe('$76/night');
      expect(result.markupDisplay).toBe('17%');
      expect(result.discountDisplay).toBe('13%');
    });

    it('should handle frontend pricing list with camelCase fields', () => {
      const pricingList = {
        id: 'abc123',
        listingId: 'listing456',
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
        startingNightlyPrice: 76,
        combinedMarkup: 0.17,
        fullTimeDiscount: 0.13,
        rentalType: 'Nightly'
      };

      const result = formatPricingListForDisplay(pricingList);

      expect(result.priceTiers).toHaveLength(7);
      expect(result.startingAt).toBe('$76/night');
      expect(result.markupDisplay).toBe('17%');
      expect(result.discountDisplay).toBe('13%');
    });
  });
});
