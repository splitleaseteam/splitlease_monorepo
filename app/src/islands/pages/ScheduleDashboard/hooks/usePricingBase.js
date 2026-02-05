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
 * @param {Object} params.coTenant - Co-tenant data.
 * @param {Object} [params.roommate] - @deprecated Use coTenant instead.
 * @param {Object} params.lease - Lease data.
 */
export function usePricingBase({ selectedNight, scheduleState, coTenant, roommate, lease }) {
  // Support both new and deprecated param names
  const resolvedCoTenant = coTenant || roommate;

  const basePrice = useMemo(() => {
    if (!selectedNight) return null;

    // Check co-tenant nights (scheduleState may use roommateNights or coTenantNights)
    const coTenantNights = scheduleState.coTenantNights || scheduleState.roommateNights;
    if (coTenantNights?.includes(selectedNight)) {
      if (resolvedCoTenant?.pricingStrategy) {
        const coTenantStrategy = resolvedCoTenant.pricingStrategy;
        const baseCost = coTenantStrategy.baseRate;
        const noticeMultipliers = coTenantStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

        const date = new Date(selectedNight + 'T12:00:00');
        if (!Number.isNaN(date.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dayOfWeek = date.getDay();
          const daysDiff = Math.floor((date - today) / (1000 * 60 * 60 * 24));

          const noticeThreshold = getNoticeThresholdForDate(daysDiff);
          const noticeMultiplier = noticeMultipliers[noticeThreshold] ?? 1.0;
          const edgeMultiplier = EDGE_MULTIPLIERS[coTenantStrategy.edgePreference]?.[dayOfWeek] || 1.0;

          return Math.round(baseCost * noticeMultiplier * edgeMultiplier);
        }
      }

      if (resolvedCoTenant?.pricingStrategy?.baseRate) {
        return resolvedCoTenant.pricingStrategy.baseRate;
      }
    }

    return lease?.nightlyRate || null;
  }, [selectedNight, scheduleState.coTenantNights, scheduleState.roommateNights, resolvedCoTenant, lease]);

  return { basePrice };
}
