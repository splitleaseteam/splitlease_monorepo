/**
 * Helper functions for ProposalCard component
 *
 * Pure utility functions for day conversion, schedule parsing,
 * and proposal data extraction. No React dependencies.
 */

// Day abbreviations for schedule display (single letter like Bubble)
export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Convert a day value to a day name
 * Handles multiple formats:
 * - String day names: "Monday", "Friday", etc. (returned as-is)
 * - Numeric strings from Supabase: "0", "3" (0-indexed, where 0=Sunday, 1=Monday, etc.)
 * - Numeric values: 0, 3 (0-indexed)
 *
 * Note: Database now stores 0-indexed days natively (0=Sunday through 6=Saturday)
 *
 * @param {string|number} dayValue - The day value to convert
 * @returns {string} The day name or empty string if invalid
 */
export function _convertDayValueToName(dayValue) {
  if (dayValue === null || dayValue === undefined) return '';

  // If it's a number, convert from 0-indexed to day name
  if (typeof dayValue === 'number') {
    return DAY_NAMES[dayValue] || '';
  }

  // If it's a string, check if it's a numeric string or a day name
  if (typeof dayValue === 'string') {
    const trimmed = dayValue.trim();

    // Check if it's a numeric string (e.g., "0", "3")
    const numericValue = parseInt(trimmed, 10);
    if (!isNaN(numericValue) && String(numericValue) === trimmed) {
      // It's a numeric string, convert from 0-indexed to day name
      return DAY_NAMES[numericValue] || '';
    }

    // It's already a day name string (e.g., "Monday")
    return trimmed;
  }

  return '';
}

/**
 * Get the check-in to checkout day range from proposal
 *
 * Priority order:
 * 1. Use explicit check in/out day fields if available (most reliable)
 * 2. Fall back to deriving from Days Selected array
 *
 * Days Selected represents the range from check-in to checkout (inclusive).
 * Check-in = first day, Checkout = last day in the selection.
 *
 * @param {Object} proposal - Proposal object
 * @returns {string|null} "Monday to Friday" format (check-in day to checkout day) or null if unavailable
 */
export function getCheckInOutRange(proposal) {
  // Priority 1: Use explicit check-in/check-out day fields if available
  const checkInDay = proposal.checkin_day_of_week_number ?? proposal.host_proposed_checkin_day;
  const checkOutDay = proposal.checkout_day_of_week_number ?? proposal.host_proposed_checkout_day;

  if (checkInDay != null && checkOutDay != null) {
    const checkInIndex = typeof checkInDay === 'number' ? checkInDay : parseInt(checkInDay, 10);
    const checkOutIndex = typeof checkOutDay === 'number' ? checkOutDay : parseInt(checkOutDay, 10);

    if (!isNaN(checkInIndex) && !isNaN(checkOutIndex) &&
        checkInIndex >= 0 && checkInIndex <= 6 &&
        checkOutIndex >= 0 && checkOutIndex <= 6) {
      return `${DAY_NAMES[checkInIndex]} to ${DAY_NAMES[checkOutIndex]}`;
    }
  }

  // Priority 2: Derive from guest selected days array
  let daysSelected = proposal.guest_selected_days_numbers_json || [];

  // Parse if it's a JSON string
  if (typeof daysSelected === 'string') {
    try {
      daysSelected = JSON.parse(daysSelected);
    } catch (_e) {
      daysSelected = [];
    }
  }

  if (!Array.isArray(daysSelected) || daysSelected.length === 0) {
    return null;
  }

  // Convert to day indices (0-indexed: 0=Sunday through 6=Saturday)
  const dayIndices = daysSelected.map(day => {
    if (typeof day === 'number') return day;
    if (typeof day === 'string') {
      const trimmed = day.trim();
      const numericValue = parseInt(trimmed, 10);
      if (!isNaN(numericValue) && String(numericValue) === trimmed) {
        return numericValue; // 0-indexed
      }
      // It's a day name - find its 0-indexed position
      const jsIndex = DAY_NAMES.indexOf(trimmed);
      return jsIndex >= 0 ? jsIndex : -1;
    }
    return -1;
  }).filter(idx => idx >= 0 && idx <= 6);

  if (dayIndices.length === 0) {
    return null;
  }

  const sorted = [...dayIndices].sort((a, b) => a - b);

  // Handle wrap-around case (e.g., Fri, Sat, Sun, Mon = [5, 6, 0, 1])
  const hasLowNumbers = sorted.some(d => d <= 2); // Sun, Mon, Tue
  const hasHighNumbers = sorted.some(d => d >= 4); // Thu, Fri, Sat

  if (hasLowNumbers && hasHighNumbers && sorted.length < 7) {
    // Find gap to determine actual start/end
    let gapIndex = -1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] > 1) {
        gapIndex = i;
        break;
      }
    }

    if (gapIndex !== -1) {
      // Wrapped selection: check-in is after the gap, checkout is before the gap
      const checkInDayIndex = sorted[gapIndex];
      const checkOutDayIndex = sorted[gapIndex - 1];

      return `${DAY_NAMES[checkInDayIndex]} to ${DAY_NAMES[checkOutDayIndex]}`;
    }
  }

  // Standard case (no wrap-around): check-in is first day, checkout is last day
  const checkInDayIndex = sorted[0];
  const checkOutDayIndex = sorted[sorted.length - 1];

  return `${DAY_NAMES[checkInDayIndex]} to ${DAY_NAMES[checkOutDayIndex]}`;
}

/**
 * Get all days with selection status
 * Handles both text day names (from Supabase) and numeric indices (0-indexed format)
 * Note: Database now stores 0-indexed days natively (0=Sunday through 6=Saturday)
 */
export function getAllDaysWithSelection(daysSelected) {
  const days = daysSelected || [];

  // Determine if we're dealing with text day names or numeric indices
  const isTextFormat = days.length > 0 && typeof days[0] === 'string';

  if (isTextFormat) {
    // Text format: ["Monday", "Tuesday", "Wednesday", etc.]
    const selectedSet = new Set(days);
    return DAY_LETTERS.map((letter, index) => ({
      index,
      letter,
      selected: selectedSet.has(DAY_NAMES[index])
    }));
  } else {
    // Numeric format: 0-indexed [0, 3, 4, 5, 6] for Sun, Wed-Sat
    const selectedSet = new Set(days);
    return DAY_LETTERS.map((letter, index) => ({
      index,
      letter,
      selected: selectedSet.has(index) // 0-indexed (0=Sunday, 6=Saturday)
    }));
  }
}

/**
 * Parse days selected from proposal for URL context
 * Handles both array and JSON string formats
 * Returns 0-indexed day numbers (0=Sunday through 6=Saturday)
 *
 * @param {Object} proposal - Proposal object
 * @returns {number[]} Array of 0-indexed day numbers
 */
export function parseDaysSelectedForContext(proposal) {
  let days = proposal.guest_selected_days_numbers_json || [];

  // Parse if JSON string
  if (typeof days === 'string') {
    try {
      days = JSON.parse(days);
    } catch (_e) {
      return [];
    }
  }

  if (!Array.isArray(days) || days.length === 0) return [];

  // Convert to numbers if needed (days stored as 0-indexed)
  return days.map(d => {
    if (typeof d === 'number') return d;
    if (typeof d === 'string') {
      const trimmed = d.trim();
      const numericValue = parseInt(trimmed, 10);
      // Check if it's a numeric string
      if (!isNaN(numericValue) && String(numericValue) === trimmed) {
        return numericValue;
      }
      // It's a day name - find its 0-indexed position
      const dayIndex = DAY_NAMES.indexOf(trimmed);
      return dayIndex >= 0 ? dayIndex : -1;
    }
    return -1;
  }).filter(d => d >= 0 && d <= 6);
}

/**
 * Get effective reservation span, accounting for counteroffers
 *
 * @param {Object} proposal - Proposal object
 * @returns {number|null} Reservation span in weeks or null if not available
 */
export function getEffectiveReservationSpan(proposal) {
  const isCounteroffer = proposal.has_host_counter_offer;
  return isCounteroffer
    ? proposal.host_proposed_reservation_span_weeks
    : proposal.reservation_span_in_weeks;
}
