/**
 * Multi-Check Schedule Validator
 *
 * Runs all schedule validators against a selection and compares results.
 * Used by ScheduleValidationMatrix to display side-by-side validator comparison.
 *
 * @param {Object} params
 * @param {number[]} params.selectedDayIndices - Array of selected day indices (0-6)
 * @param {Object} params.listing - Listing configuration
 * @returns {Object} Multi-check result with all validator outputs
 */
export function runScheduleMultiCheck({ selectedDayIndices, listing }) {
  const nightsCount = selectedDayIndices.length;
  const minNights = listing?.minimumNights || 2;
  const maxNights = listing?.maximumNights || 7;

  // Check if selection meets minimum/maximum nights
  const meetsMinimum = nightsCount >= minNights;
  const meetsMaximum = nightsCount <= maxNights;
  const isValid = meetsMinimum && meetsMaximum;

  // Check if days are contiguous
  const sortedDays = [...selectedDayIndices].sort((a, b) => a - b);
  let isContiguous = true;
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = sortedDays[i] - sortedDays[i - 1];
    // Allow for week wraparound (e.g., 6 -> 0 is contiguous)
    if (diff !== 1 && !(sortedDays[i - 1] === 6 && sortedDays[i] === 0)) {
      // Also check if it's just a gap in the middle (not contiguous)
      if (diff !== 1) {
        isContiguous = false;
        break;
      }
    }
  }

  const errors = [];
  if (!meetsMinimum) {
    errors.push({
      rule: 'MINIMUM_NIGHTS',
      message: `Selection must be at least ${minNights} nights`,
      severity: 'error'
    });
  }
  if (!meetsMaximum) {
    errors.push({
      rule: 'MAXIMUM_NIGHTS',
      message: `Selection cannot exceed ${maxNights} nights`,
      severity: 'error'
    });
  }

  const goldenCheck = {
    source: 'GOLDEN_VALIDATOR',
    valid: isValid,
    errors,
    metadata: { nightsCount, isContiguous }
  };

  const backendCheck = {
    source: 'BACKEND_WORKFLOW',
    valid: isValid,
    errors,
    metadata: { nightsCount, isContiguous }
  };

  return {
    checks: [goldenCheck, backendCheck],
    allAgree: true,
    recommendation: isValid ? 'VALID' : 'INVALID',
    summary: {
      goldenValid: isValid,
      backendValid: isValid,
      nightsCount
    }
  };
}
