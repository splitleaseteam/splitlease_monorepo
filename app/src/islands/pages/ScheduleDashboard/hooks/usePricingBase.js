import { useMemo } from 'react';
import {
  DEFAULT_NOTICE_MULTIPLIERS,
  EDGE_MULTIPLIERS,
  getNoticeThresholdForDate
} from '../helpers/priceCalculations.js';

/**
 * @param {Object} params
 * @param {string|null} params.selectedNight - Selected night string.
 * @param {Object} params.scheduleState - Schedule state with nights.
 * @param {Object} params.roommate - Roommate data.
 * @param {Object} params.lease - Lease data.
 */
export function usePricingBase({ selectedNight, scheduleState, roommate, lease }) {
  const basePrice = useMemo(() => {
    if (!selectedNight) return null;

    if (scheduleState.roommateNights?.includes(selectedNight)) {
      if (roommate?.pricingStrategy) {
        const roommateStrategy = roommate.pricingStrategy;
        const baseCost = roommateStrategy.baseRate;
        const noticeMultipliers = roommateStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

        const date = new Date(selectedNight + 'T12:00:00');
        if (!Number.isNaN(date.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dayOfWeek = date.getDay();
          const daysDiff = Math.floor((date - today) / (1000 * 60 * 60 * 24));

          const noticeThreshold = getNoticeThresholdForDate(daysDiff);
          const noticeMultiplier = noticeMultipliers[noticeThreshold] ?? 1.0;
          const edgeMultiplier = EDGE_MULTIPLIERS[roommateStrategy.edgePreference]?.[dayOfWeek] || 1.0;

          return Math.round(baseCost * noticeMultiplier * edgeMultiplier);
        }
      }

      if (roommate?.pricingStrategy?.baseRate) {
        return roommate.pricingStrategy.baseRate;
      }
    }

    return lease?.nightlyRate || null;
  }, [selectedNight, scheduleState.roommateNights, roommate, lease]);

  return { basePrice };
}
