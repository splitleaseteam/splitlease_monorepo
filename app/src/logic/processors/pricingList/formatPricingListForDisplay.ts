/**
 * Format a pricing list for UI display.
 *
 * Transforms raw pricing data into display-friendly format with
 * formatted currency strings and human-readable labels.
 *
 * @intent Prepare pricing data for UI rendering.
 * @rule Formats prices as currency strings with $ prefix.
 * @rule Provides labels for each night tier.
 * @rule Includes derived display values (starting price text).
 *
 * @param pricingList - Adapted pricing list object.
 * @returns Display-formatted pricing data.
 *
 * @throws Error if pricingList is null or undefined.
 *
 * @example
 * ```ts
 * formatPricingListForDisplay({
 *   nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
 *   startingNightlyPrice: 76,
 *   combinedMarkup: 0.17
 * })
 * // => {
 * //   priceTiers: [
 * //     { nights: 1, price: null, label: '1 night', formatted: 'N/A' },
 * //     { nights: 2, price: 117, label: '2 nights', formatted: '$117/night' },
 * //     ...
 * //   ],
 * //   startingAt: '$76/night',
 * //   markupDisplay: '17%'
 * // }
 * ```
 */
import type {
  DisplayPricingData,
  FrontendPricingList,
  PriceTierDisplay,
  SupabasePricingRow
} from './types.js';

type PricingListInput = Partial<FrontendPricingList> | Partial<SupabasePricingRow>;

export function formatPricingListForDisplay(
  pricingList: PricingListInput
): DisplayPricingData {
  if (!pricingList) {
    throw new Error('formatPricingListForDisplay: pricingList is required');
  }

  const nightlyPrices = pricingList.nightlyPrice || (pricingList as Partial<SupabasePricingRow>)['Nightly Price'] || [];

  // Build price tiers array
  const priceTiers: PriceTierDisplay[] = nightlyPrices.map((price, index) => {
    const nights = index + 1;
    return {
      nights,
      price,
      label: nights === 1 ? '1 night' : `${nights} nights`,
      formatted: formatPrice(price),
      isFullTime: nights === 7
    };
  });

  // Format starting price
  const startingPrice = pricingList.startingNightlyPrice ?? (pricingList as Partial<SupabasePricingRow>)['Starting Nightly Price'];
  const startingAt = startingPrice != null && !isNaN(startingPrice as number)
    ? `$${Math.round(startingPrice as number)}/night`
    : 'Price varies';

  // Format markup percentage
  const combinedMarkup = pricingList.combinedMarkup ?? (pricingList as Partial<SupabasePricingRow>)['Combined Markup'] ?? 0.17;
  const markupDisplay = `${Math.round(combinedMarkup * 100)}%`;

  // Format discount percentage
  const fullTimeDiscount = pricingList.fullTimeDiscount ?? (pricingList as Partial<SupabasePricingRow>)['Full Time Discount'] ?? 0.13;
  const discountDisplay = `${Math.round(fullTimeDiscount * 100)}%`;

  return {
    priceTiers,
    startingAt,
    startingPrice: startingPrice != null && !isNaN(startingPrice as number) ? Math.round(startingPrice as number) : null,
    markupDisplay,
    discountDisplay,
    fullTimePrice: formatPrice(nightlyPrices[6]), // 7-night price
    rentalType: (pricingList.rentalType ?? (pricingList as Partial<SupabasePricingRow>).rental_type ?? 'Nightly') as 'Nightly' | 'Monthly' | 'Weekly'
  };
}

/**
 * Format a price for display.
 * @param price - The price to format.
 * @returns Formatted price string.
 */
function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || isNaN(price)) {
    return 'N/A';
  }
  return `$${Math.round(price)}/night`;
}
