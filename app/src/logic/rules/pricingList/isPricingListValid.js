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
 * @param {object} params - Named parameters.
 * @param {object} params.pricingList - The pricing list object to validate.
 * @returns {boolean} True if valid, false otherwise.
 *
 * @example
 * isPricingListValid({
 *   pricingList: {
 *     hostCompensation: [null, 100, 95, 90, 85, 80, 75],
 *     nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
 *     combinedMarkup: 0.17
 *   }
 * })
 * // => true
 */
import { PRICING_CONSTANTS } from '../../constants/pricingConstants.js';

export function isPricingListValid({ pricingList }) {
  // Null or undefined is invalid
  if (!pricingList || typeof pricingList !== 'object') {
    return false;
  }

  // Validate array fields have correct length
  const arrayFields = [
    'hostCompensation',
    'nightlyPrice',
    'markupAndDiscountMultiplier',
    'unusedNightsDiscount'
  ];

  // Map from camelCase to Bubble-style column names
  const fieldMappings = {
    hostCompensation: ['hostCompensation', 'Host Compensation'],
    nightlyPrice: ['nightlyPrice', 'Nightly Price'],
    markupAndDiscountMultiplier: ['markupAndDiscountMultiplier', 'Markup and Discount Multiplier'],
    unusedNightsDiscount: ['unusedNightsDiscount', 'Unused Nights Discount']
  };

  for (const field of arrayFields) {
    const possibleNames = fieldMappings[field] || [field];
    let foundArray = null;

    for (const name of possibleNames) {
      if (pricingList[name] !== undefined) {
        foundArray = pricingList[name];
        break;
      }
    }

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
  const nightlyPrices = pricingList.nightlyPrice || pricingList['Nightly Price'];
  if (nightlyPrices && Array.isArray(nightlyPrices)) {
    const hasValidPrice = nightlyPrices.some(
      price => price !== null && price !== undefined && typeof price === 'number' && !isNaN(price)
    );
    if (!hasValidPrice) {
      return false;
    }
  }

  // Validate scalar markups if present
  const combinedMarkup = pricingList.combinedMarkup ?? pricingList['Combined Markup'];
  if (combinedMarkup !== undefined && combinedMarkup !== null) {
    if (typeof combinedMarkup !== 'number' || isNaN(combinedMarkup)) {
      return false;
    }
    if (combinedMarkup < 0 || combinedMarkup > 1) {
      return false;
    }
  }

  return true;
}
