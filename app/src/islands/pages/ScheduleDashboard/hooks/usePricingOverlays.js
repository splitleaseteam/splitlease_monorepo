import { useMemo } from 'react';
import { toDateString } from '../helpers/dateHelpers.js';
import {
  DEFAULT_NOTICE_MULTIPLIERS,
  EDGE_MULTIPLIERS,
  getNoticeThresholdForDate
} from '../helpers/priceCalculations.js';

/**
 * @param {Object} params
 * @param {Object} params.pricingStrategy - Current user's pricing strategy.
 * @param {string[]} params.userNights - Current user's nights (YYYY-MM-DD).
 * @param {string[]} params.coTenantNights - Co-tenant's nights (YYYY-MM-DD).
 * @param {string[]} [params.roommateNights] - @deprecated Use coTenantNights instead.
 * @param {Object|null} params.coTenantStrategy - Co-tenant's pricing strategy.
 * @param {Object|null} [params.roommateStrategy] - @deprecated Use coTenantStrategy instead.
 */
export function usePricingOverlays({
  pricingStrategy,
  userNights,
  coTenantNights,
  roommateNights, // @deprecated - use coTenantNights
  coTenantStrategy,
  roommateStrategy // @deprecated - use coTenantStrategy
}) {
  // Support both new and deprecated param names
  const resolvedCoTenantNights = coTenantNights || roommateNights;
  const resolvedCoTenantStrategy = coTenantStrategy || roommateStrategy;
  const computedSuggestedPrices = useMemo(() => {
    const prices = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const baseCost = pricingStrategy.baseRate;
    const noticeMultipliers = pricingStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = toDateString(date);
      const dayOfWeek = date.getDay();

      const factors = [];

      const noticeThreshold = getNoticeThresholdForDate(i);
      const noticeMultiplier = noticeMultipliers[noticeThreshold] ?? 1.0;
      if (noticeMultiplier !== 1.0) {
        factors.push(`Notice ${noticeMultiplier}x (${noticeThreshold})`);
      }

      const edgeMultiplier = EDGE_MULTIPLIERS[pricingStrategy.edgePreference][dayOfWeek] || 1.0;
      if (edgeMultiplier !== 1.0) {
        factors.push(`Edge ${edgeMultiplier}x`);
      }

      const price = Math.round(baseCost * noticeMultiplier * edgeMultiplier);

      prices.push({
        date: dateStr,
        suggestedPrice: price,
        factors: factors.length > 0 ? factors : ['Base cost'],
        noticeThreshold,
        edgeMultiplier
      });
    }

    return prices;
  }, [pricingStrategy]);

  const priceOverlays = useMemo(() => {
    if (!userNights || userNights.length === 0) return null;

    const overlays = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const baseCost = pricingStrategy.baseRate;
    const noticeMultipliers = pricingStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

    for (const nightStr of userNights) {
      const date = new Date(nightStr + 'T12:00:00');
      if (Number.isNaN(date.getTime())) continue;

      const dayOfWeek = date.getDay();
      const daysDiff = Math.floor((date - today) / (1000 * 60 * 60 * 24));

      const noticeThreshold = getNoticeThresholdForDate(daysDiff);
      const noticeMultiplier = noticeMultipliers[noticeThreshold] ?? 1.0;
      const edgeMultiplier = EDGE_MULTIPLIERS[pricingStrategy.edgePreference][dayOfWeek] || 1.0;

      const price = Math.round(baseCost * noticeMultiplier * edgeMultiplier);

      let tier = 'within';
      if (noticeThreshold === 'emergency' || noticeThreshold === 'disruptive') {
        tier = 'limit';
      } else if (noticeThreshold === 'inconvenient') {
        tier = 'near';
      }

      overlays[nightStr] = {
        price,
        tier,
        noticeThreshold,
        edgeMultiplier
      };
    }

    return Object.keys(overlays).length > 0 ? overlays : null;
  }, [userNights, pricingStrategy]);

  const coTenantPriceOverlays = useMemo(() => {
    if (!resolvedCoTenantNights || resolvedCoTenantNights.length === 0) return null;
    if (!resolvedCoTenantStrategy) return null;

    const overlays = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const baseCost = resolvedCoTenantStrategy.baseRate;
    const noticeMultipliers = resolvedCoTenantStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

    for (const nightStr of resolvedCoTenantNights) {
      const date = new Date(nightStr + 'T12:00:00');
      if (Number.isNaN(date.getTime())) continue;

      const dayOfWeek = date.getDay();
      const daysDiff = Math.floor((date - today) / (1000 * 60 * 60 * 24));

      if (daysDiff < 0) continue;

      const noticeThreshold = getNoticeThresholdForDate(daysDiff);
      const noticeMultiplier = noticeMultipliers[noticeThreshold] ?? 1.0;
      const edgeMultiplier = EDGE_MULTIPLIERS[resolvedCoTenantStrategy.edgePreference]?.[dayOfWeek] || 1.0;

      const price = Math.round(baseCost * noticeMultiplier * edgeMultiplier);

      let tier = 'within';
      if (noticeThreshold === 'emergency' || noticeThreshold === 'disruptive') {
        tier = 'limit';
      } else if (noticeThreshold === 'inconvenient') {
        tier = 'near';
      }

      overlays[nightStr] = {
        price,
        tier,
        noticeThreshold,
        edgeMultiplier
      };
    }

    return Object.keys(overlays).length > 0 ? overlays : null;
  }, [resolvedCoTenantNights, resolvedCoTenantStrategy]);

  const computedExamples = useMemo(() => {
    const baseCost = pricingStrategy.baseRate;
    const { edgePreference } = pricingStrategy;
    const noticeMultipliers = pricingStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;
    const noticeThreshold = 'standard';
    const noticeMultiplier = noticeMultipliers[noticeThreshold] ?? 1.0;

    const monEdge = EDGE_MULTIPLIERS[edgePreference][1] || 1.0;
    const monday = Math.round(baseCost * noticeMultiplier * monEdge);

    const wedEdge = EDGE_MULTIPLIERS[edgePreference][3] || 1.0;
    const wednesday = Math.round(baseCost * noticeMultiplier * wedEdge);

    const friEdge = EDGE_MULTIPLIERS[edgePreference][5] || 1.0;
    const friday = Math.round(baseCost * noticeMultiplier * friEdge);

    const allPrices = [];
    Object.values(noticeMultipliers).forEach((nm) => {
      Object.values(EDGE_MULTIPLIERS[edgePreference]).forEach((em) => {
        allPrices.push(Math.round(baseCost * nm * em));
      });
    });
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    return {
      monday,
      wednesday,
      friday,
      baseCost,
      noticeMultiplier,
      noticeThreshold,
      edgePreference,
      minPrice,
      maxPrice
    };
  }, [pricingStrategy]);

  return {
    computedSuggestedPrices,
    priceOverlays,
    coTenantPriceOverlays,
    roommatePriceOverlays: coTenantPriceOverlays, // @deprecated - use coTenantPriceOverlays
    computedExamples
  };
}
