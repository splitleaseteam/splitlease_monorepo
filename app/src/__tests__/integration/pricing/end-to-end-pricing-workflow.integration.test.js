import { describe, it, expect, vi } from 'vitest';
import {
  initializePricingListWorkflow,
  savePricingWorkflow,
  recalculatePricingListWorkflow
} from '../../../logic/workflows/pricingList/index.js';

describe('End-to-End Pricing Workflow Integration Tests', () => {
  const listing = {
    id: 'listing-e2e-1',
    rental_type: 'Nightly',
    nightly_rate_for_2_night_stay: 120,
    nightly_rate_for_3_night_stay: 115,
    nightly_rate_for_4_night_stay: 110,
    nightly_rate_for_5_night_stay: 105,
    nightly_rate_for_6_night_stay: 100,
    nightly_rate_for_7_night_stay: 95
  };

  it('runs initialize -> save -> recalculate flow successfully', async () => {
    const init = await initializePricingListWorkflow({
      listingId: listing.id,
      userId: 'host-1'
    });

    expect(init.success).toBe(true);
    expect(init.pricingList.nightlyPrice.every((price) => price === null)).toBe(true);

    const persist = vi.fn().mockResolvedValue({ success: true });
    const saved = await savePricingWorkflow({
      listing,
      listingId: listing.id,
      userId: 'host-1',
      onPersist: persist
    });

    expect(saved.success).toBe(true);
    expect(saved.pricingList.startingNightlyPrice).toBeGreaterThan(0);
    expect(persist).toHaveBeenCalledTimes(1);

    const recalculated = await recalculatePricingListWorkflow({
      listing,
      listingId: listing.id,
      existingPricingList: saved.pricingList,
      force: true
    });

    expect(recalculated.success).toBe(true);
    expect(recalculated.recalculated).toBe(true);
    expect(recalculated.forced).toBe(true);
  });

  it('skips recalculation when no changes are detected', async () => {
    const existingPricingList = {
      hostCompensation: [null, 120, 115, 110, 105, 100, 95],
      nightlyPrice: [null, 122.4, 120.75, 118.8, 116.55, 114, 98.8],
      markupAndDiscountMultiplier: [1, 1.02, 1.05, 1.08, 1.11, 1.14, 1.04],
      unusedNightsDiscount: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0],
      combinedMarkup: 0.17,
      fullTimeDiscount: 0.13,
      unitMarkup: 0,
      listingId: listing.id
    };

    const result = await recalculatePricingListWorkflow({
      listing: {
        nightly_rate_1_night: null,
        nightly_rate_2_nights: 120,
        nightly_rate_3_nights: 115,
        nightly_rate_4_nights: 110,
        nightly_rate_5_nights: 105,
        nightly_rate_6_nights: 100,
        nightly_rate_7_nights: 95
      },
      listingId: listing.id,
      existingPricingList: existingPricingList,
      force: false
    });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
  });
});
