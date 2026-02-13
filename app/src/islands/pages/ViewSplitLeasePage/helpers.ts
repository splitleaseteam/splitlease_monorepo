/**
 * URL parsing helper functions for ViewSplitLeasePage
 * Extracted from ViewSplitLeasePage.tsx for cleaner organization.
 */

import { createDay } from '../../../lib/scheduleSelector/dayHelpers.js';
import { logger } from '../../../lib/logger.js';

/**
 * Get initial schedule selection from URL parameter
 * URL format: ?days-selected=2,3,4,5,6 (0-based, where 0=Sunday, matching JS Date.getDay())
 * Returns: Array of Day objects (0-based, where 0=Sunday)
 */
export function getInitialScheduleFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const daysParam = urlParams.get('days-selected');

  if (!daysParam) {
    logger.debug('ViewSplitLeasePage: No days-selected URL param, using empty initial selection');
    return [];
  }

  try {
    // Parse 0-based indices from URL (matching SearchPage and JS Date.getDay() convention)
    const dayIndices = daysParam.split(',').map(d => parseInt(d.trim(), 10));
    const validDays = dayIndices.filter(d => d >= 0 && d <= 6); // Validate 0-based range (0=Sun...6=Sat)

    if (validDays.length > 0) {
      // Convert to Day objects using createDay
      const dayObjects = validDays.map(dayIndex => createDay(dayIndex, true));
      logger.debug('ViewSplitLeasePage: Loaded schedule from URL:', {
        urlParam: daysParam,
        dayIndices: validDays
      });
      return dayObjects;
    }
  } catch (e) {
    console.warn('\u26a0\ufe0f ViewSplitLeasePage: Failed to parse days-selected URL parameter:', e);
  }

  return [];
}

/**
 * Get initial reservation span from URL parameter
 * URL format: ?reservation-span=13 (weeks)
 * Returns: Number or null if not provided/invalid
 */
export function getInitialReservationSpanFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const spanParam = urlParams.get('reservation-span');

  if (!spanParam) return null;

  const parsed = parseInt(spanParam, 10);
  if (!isNaN(parsed) && parsed > 0) {
    logger.debug('ViewSplitLeasePage: Loaded reservation span from URL:', parsed);
    return parsed;
  }

  return null;
}

/**
 * Get initial move-in date from URL parameter
 * URL format: ?move-in=2025-02-15 (YYYY-MM-DD)
 * Returns: String (YYYY-MM-DD) or null if not provided/invalid
 */
export function getInitialMoveInFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const moveInParam = urlParams.get('move-in');

  if (!moveInParam) return null;

  // Basic validation: YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(moveInParam)) {
    logger.debug('ViewSplitLeasePage: Loaded move-in date from URL:', moveInParam);
    return moveInParam;
  }

  return null;
}
