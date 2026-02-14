import { describe, it, expect, vi } from 'vitest';
import { recalculatePricingListWorkflow } from '../recalculatePricingListWorkflow.js';

const listing = {
  id: 'listing-1',
  rental_type: 'Nightly',
  nightly_rate_for_2_night_stay: 100,
  nightly_rate_for_3_night_stay: 95,
  nightly_rate_for_4_night_stay: 90,
  nightly_rate_for_5_night_stay: 85,
  nightly_rate_for_6_night_stay: 80,
  nightly_rate_for_7_night_stay: 75
};

describe('recalculatePricingListWorkflow - Integration Tests', () => {
  it('forces recalculation when force=true', async () => {
    const persist = vi.fn().mockResolvedValue({ success: true });

    const result = await recalculatePricingListWorkflow({
      listing,
      listingId: 'listing-1',
      force: true,
      onPersist: persist
    });

    expect(result.success).toBe(true);
    expect(result.recalculated).toBe(true);
    expect(result.forced).toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('skips recalculation when no changes are detected and force=false', async () => {
    const existingPricingList = {
      listingId: 'listing-1',
      hostCompensation: [null, 100, 95, 90, 85, 80, 75],
      nightlyPrice: [null, 102, 100, 97, 94, 91, 78],
      markupAndDiscountMultiplier: [1, 1.02, 1.05, 1.08, 1.11, 1.14, 1.04],
      unusedNightsDiscount: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0],
      combinedMarkup: 0.17,
      unitMarkup: 0,
      fullTimeDiscount: 0.13
    };

    const result = await recalculatePricingListWorkflow({
      listing: {
        nightly_rate_1_night: null,
        nightly_rate_2_nights: 100,
        nightly_rate_3_nights: 95,
        nightly_rate_4_nights: 90,
        nightly_rate_5_nights: 85,
        nightly_rate_6_nights: 80,
        nightly_rate_7_nights: 75
      },
      listingId: 'listing-1',
      existingPricingList: existingPricingList as any,
      force: false
    });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('No changes detected');
  });

  it('propagates persist callback errors', async () => {
    const persist = vi.fn().mockRejectedValue(new Error('Persistence failed'));

    await expect(
      recalculatePricingListWorkflow({
        listing,
        listingId: 'listing-1',
        force: true,
        onPersist: persist
      })
    ).rejects.toThrow('Persistence failed');
  });

  it('throws for missing required input', async () => {
    await expect(recalculatePricingListWorkflow({ listingId: 'listing-1', force: true } as any)).rejects.toThrow(
      'recalculatePricingListWorkflow: listing is required'
    );

    await expect(recalculatePricingListWorkflow({ listing, force: true } as any)).rejects.toThrow(
      'recalculatePricingListWorkflow: listingId is required'
    );
  });
});
