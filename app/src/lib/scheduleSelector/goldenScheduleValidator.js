import { isScheduleContiguous } from '../../logic/rules/scheduling/isScheduleContiguous.js';

const ABSOLUTE_MIN_NIGHTS = 2;
const ABSOLUTE_MAX_NIGHTS = 7;

/**
 * Golden Schedule Validator - Canonical implementation of all schedule validation rules.
 * 
 * @param {Object} params - Validation parameters
 * @param {number[]} params.selectedDayIndices - Array of selected day indices (0=Sunday, ..., 6=Saturday)
 * @param {Object} params.listing - Listing configuration
 * @param {number} [params.listing.minimumNights] - Host's minimum nights requirement
 * @param {number} [params.listing.maximumNights] - Host's maximum nights allowed
 * @param {number[]} [params.listing.daysAvailable] - Array of available day indices
 * 
 * @returns {Object} Validation result
 * @returns {boolean} result.valid - Whether schedule is valid (no ERROR-level violations)
 * @returns {Array} result.errors - Array of error objects { rule, message, severity }
 * @returns {Object} result.metadata - Additional data (nightsCount, isContiguous, checkInDay, checkOutDay, unusedNights)
 */
export function validateScheduleGolden({ selectedDayIndices, listing = {} }) {
  const errors = [];

  // Rule 1: Input Validation
  if (!Array.isArray(selectedDayIndices)) {
    throw new Error('selectedDayIndices must be an array');
  }

  if (selectedDayIndices.length === 0) {
    return {
      valid: false,
      errors: [{ rule: 'NO_DAYS_SELECTED', message: 'No days selected', severity: 'ERROR' }],
      metadata: { nightsCount: 0, isContiguous: false, checkInDay: null, checkOutDay: null, unusedNights: 7 }
    };
  }

  // Rule 2: Nights Calculation (CRITICAL!)
  // GOLDEN FORMULA - Full week special case
  let nightsCount;
  if (selectedDayIndices.length === 7) {
    nightsCount = 7;  // Full week = 7 nights (full-time rental)
  } else {
    nightsCount = Math.max(0, selectedDayIndices.length - 1);  // Partial week
  }

  // Rule 3: Contiguity Check
  const isContiguous = isScheduleContiguous({ selectedDayIndices });

  if (!isContiguous) {
    errors.push({
      rule: 'NOT_CONTIGUOUS',
      message: 'Days must be consecutive',
      severity: 'ERROR'
    });
  }

  // Rule 4: Absolute Minimum (Hardcoded - Cannot be overridden)
  if (nightsCount < ABSOLUTE_MIN_NIGHTS) {
    errors.push({
      rule: 'ABSOLUTE_MINIMUM',
      message: `Minimum ${ABSOLUTE_MIN_NIGHTS} nights (${ABSOLUTE_MIN_NIGHTS + 1} days) required`,
      severity: 'ERROR'
    });
  }

  // Rule 5: Host Minimum (Soft Constraint - Warning)
  if (listing.minimumNights && nightsCount < listing.minimumNights) {
    errors.push({
      rule: 'MINIMUM_NIGHTS',
      message: `Host requires minimum ${listing.minimumNights} nights`,
      severity: 'WARNING'  // Soft constraint
    });
  }

  // Rule 6: Absolute Maximum (Hardcoded)
  if (nightsCount > ABSOLUTE_MAX_NIGHTS) {
    errors.push({
      rule: 'ABSOLUTE_MAXIMUM',
      message: `Maximum ${ABSOLUTE_MAX_NIGHTS} nights allowed`,
      severity: 'ERROR'
    });
  }

  // Rule 7: Host Maximum (Soft Constraint - Warning)
  if (listing.maximumNights && nightsCount > listing.maximumNights) {
    errors.push({
      rule: 'MAXIMUM_NIGHTS',
      message: `Host allows maximum ${listing.maximumNights} nights`,
      severity: 'WARNING'  // Soft constraint
    });
  }

  // Rule 8: Day Availability (Hard Constraint)
  if (listing.daysAvailable && Array.isArray(listing.daysAvailable)) {
    const unavailable = selectedDayIndices.filter(d => !listing.daysAvailable.includes(d));
    
    if (unavailable.length > 0) {
      const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayNames = unavailable.map(idx => DAY_NAMES[idx]).join(', ');
      
      errors.push({
        rule: 'DAYS_NOT_AVAILABLE',
        message: `Selected days not available: ${dayNames}`,
        severity: 'ERROR'
      });
    }
  }

  // Rule 9: Calculate Check-In/Check-Out
  const sorted = [...selectedDayIndices].sort((a, b) => a - b);

  let checkInDay = sorted[0];
  let checkOutDay = sorted[sorted.length - 1];

  // Handle wrap-around case (has both Sunday=0 and Saturday=6)
  if (sorted.includes(0) && sorted.includes(6) && sorted.length < 7) {
    // Find the gap
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] > 1) {
        // Gap found between sorted[i] and sorted[i+1]
        checkInDay = sorted[i + 1];  // First day after gap
        checkOutDay = sorted[i];     // Last day before gap
        break;
      }
    }
  }

  const unusedNights = 7 - nightsCount;

  return {
    valid: errors.filter(e => e.severity === 'ERROR').length === 0,
    errors,
    metadata: {
      nightsCount,
      isContiguous,
      checkInDay,
      checkOutDay,
      unusedNights
    }
  };
}
