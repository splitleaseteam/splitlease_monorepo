/**
 * Validate if a pricing list has valid structure.
 *
 * Checks that all required arrays have exactly 7 elements and
 * that scalar fields are within expected ranges.
 *
 * @intent Validate pricing_list data integrity before use.
 * @rule All arrays must have exactly 7 elements.
 * @rule Scalar markups must be between 0 and 1.
 * @rule At least one nightly price must be non-null.
 *
 * @param params - Named parameters.
 * @returns True if valid, false otherwise.
 *
 * @example
 * ```ts
 * isPricingListValid({
 *   pricingList: {
 *     hostCompensation: [null, 100, 95, 90, 85, 80, 75],
 *     nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
 *     combinedMarkup: 0.17
 *   }
 * })
 * // => true
 * ```
 */
import { PRICING_CONSTANTS } from '../../constants/pricingConstants.js';
import type { PricingList, PricingValidationCriteria } from './types.js';

export function isPricingListValid({ pricingList }: PricingValidationCriteria): boolean {
  // Null or undefined is invalid
  if (!pricingList || typeof pricingList !== 'object') {
    return false;
  }

  // Validate array fields have correct length
  // Support both camelCase (frontend) and snake_case (database) field names
  const arrayFieldMappings: Array<[string, string]> = [
    ['hostCompensation', 'host_compensation'],
    ['nightlyPrice', 'nightly_price'],
    ['markupAndDiscountMultiplier', 'markup_and_discount_multiplier'],
    ['unusedNightsDiscount', 'unused_nights_discount']
  ];

  for (const [camelField, snakeField] of arrayFieldMappings) {
    // Check camelCase first, then snake_case
    const foundArray = (pricingList as Record<string, unknown>)[camelField] ??
                       (pricingList as Record<string, unknown>)[snakeField];

    // Skip if field is not present (may be optional)
    if (foundArray === null || foundArray === undefined) {
      continue;
    }

    // If present, must be valid array with 7 elements
    if (!Array.isArray(foundArray)) {
      return false;
    }

    if (foundArray.length !== PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH) {
      return false;
    }
  }

  // Validate at least one price exists
  // Check both camelCase and snake_case field names
  const nightlyPrices = (pricingList as Record<string, unknown>).nightlyPrice ??
                        (pricingList as Record<string, unknown>).nightly_price;
  if (nightlyPrices && Array.isArray(nightlyPrices)) {
    const hasValidPrice = nightlyPrices.some(
      price => price !== null && price !== undefined && typeof price === 'number' && !isNaN(price)
    );
    if (!hasValidPrice) {
      return false;
    }
  }

  // Validate scalar markups if present
  // Check both camelCase and snake_case field names
  const combinedMarkup = (pricingList as Record<string, unknown>).combinedMarkup ??
                         (pricingList as Record<string, unknown>).combined_markup;
  if (combinedMarkup !== undefined && combinedMarkup !== null) {
    if (typeof combinedMarkup !== 'number' || isNaN(combinedMarkup as number)) {
      return false;
    }
    if ((combinedMarkup as number) < 0 || (combinedMarkup as number) > 1) {
      return false;
    }
  }

  return true;
}
