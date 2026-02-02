/**
 * useTransactionPricing Hook - Pattern 1: Personalized Defaults
 *
 * React hook for calculating transaction pricing with urgency multipliers.
 *
 * @module hooks/useTransactionPricing
 */

import { useMemo } from 'react';
import type { TransactionType } from '../types';

/**
 * Hook parameters
 */
export interface UseTransactionPricingParams {
  /** Base nightly price in cents */
  basePrice: number;
  /** User's selected price percentage (50-150) */
  pricePercentage: number;
  /** Days until check-in */
  daysUntilCheckIn: number;
  /** Market demand multiplier (0.7-1.4) */
  marketDemand?: number;
  /** Transaction type */
  transactionType?: TransactionType;
}

/**
 * Pricing breakdown
 */
export interface PricingBreakdown {
  /** User's selected price (before urgency) in cents */
  baseProposal: number;
  /** Urgency multiplier applied */
  urgencyMultiplier: number;
  /** Urgency premium amount in cents */
  urgencyPremium: number;
  /** Final price (base + urgency) in cents */
  finalPrice: number;
  /** Platform fee in cents */
  platformFee: number;
  /** Total cost (final + fee) in cents */
  totalCost: number;
  /** Difference from base price in cents */
  difference: number;
}

/**
 * Hook return value
 */
export interface UseTransactionPricingReturn extends PricingBreakdown {
  /** Formatted urgency message */
  urgencyMessage: string;
  /** Whether urgency premium applies */
  hasUrgency: boolean;
  /** Urgency level (critical, high, medium, low) */
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Custom hook for transaction pricing calculation
 *
 * Calculates urgency-aware pricing based on days until check-in.
 *
 * @param params - Hook parameters
 * @returns Pricing breakdown with urgency info
 *
 * @example
 * ```tsx
 * const pricing = useTransactionPricing({
 *   basePrice: 15000, // $150
 *   pricePercentage: 100,
 *   daysUntilCheckIn: 7,
 *   marketDemand: 1.2,
 *   transactionType: 'buyout'
 * });
 * ```
 */
export function useTransactionPricing({
  basePrice,
  pricePercentage,
  daysUntilCheckIn,
  marketDemand = 1.0,
  transactionType = 'buyout',
}: UseTransactionPricingParams): UseTransactionPricingReturn {
  const pricing = useMemo(() => {
    // Calculate user's selected price (before urgency)
    const adjustedBasePrice = basePrice * marketDemand;
    const baseProposal = Math.round((adjustedBasePrice * pricePercentage) / 100);

    // Calculate urgency multiplier
    const urgencyMultiplier = calculateUrgencyMultiplier(daysUntilCheckIn);
    const urgencyLevel = getUrgencyLevel(daysUntilCheckIn);

    // Apply urgency multiplier to base proposal
    const urgencyPremium = Math.round(baseProposal * (urgencyMultiplier - 1));
    const finalPrice = baseProposal + urgencyPremium;

    // Calculate platform fee (1.5% for buyout/crash, flat $5 for swap)
    const platformFee =
      transactionType === 'swap'
        ? 500
        : Math.round(finalPrice * 0.015);

    const totalCost = finalPrice + platformFee;

    // Calculate difference from base price
    const difference = finalPrice - basePrice;

    // Generate urgency message
    const urgencyMessage = generateUrgencyMessage(
      daysUntilCheckIn,
      urgencyMultiplier
    );

    const hasUrgency = urgencyMultiplier > 1.0;

    return {
      baseProposal,
      urgencyMultiplier,
      urgencyPremium,
      finalPrice,
      platformFee,
      totalCost,
      difference,
      urgencyMessage,
      hasUrgency,
      urgencyLevel,
    };
  }, [basePrice, pricePercentage, daysUntilCheckIn, marketDemand, transactionType]);

  return pricing;
}

/**
 * Calculate urgency multiplier based on days until check-in
 *
 * Linear model:
 * - 0-3 days: 1.5x (critical)
 * - 4-7 days: 1.25x (high)
 * - 8-14 days: 1.1x (medium)
 * - 15+ days: 1.0x (low/none)
 *
 * @param daysUntilCheckIn - Days until check-in
 * @returns Urgency multiplier (1.0 or higher)
 */
function calculateUrgencyMultiplier(daysUntilCheckIn: number): number {
  if (daysUntilCheckIn <= 3) return 1.5;
  if (daysUntilCheckIn <= 7) return 1.25;
  if (daysUntilCheckIn <= 14) return 1.1;
  return 1.0;
}

/**
 * Get urgency level category
 *
 * @param daysUntilCheckIn - Days until check-in
 * @returns Urgency level
 */
function getUrgencyLevel(
  daysUntilCheckIn: number
): 'critical' | 'high' | 'medium' | 'low' {
  if (daysUntilCheckIn <= 3) return 'critical';
  if (daysUntilCheckIn <= 7) return 'high';
  if (daysUntilCheckIn <= 14) return 'medium';
  return 'low';
}

/**
 * Generate human-readable urgency message
 *
 * @param daysUntilCheckIn - Days until check-in
 * @param multiplier - Urgency multiplier
 * @returns Urgency message
 */
function generateUrgencyMessage(
  daysUntilCheckIn: number,
  multiplier: number
): string {
  if (multiplier === 1.0) {
    return 'No urgency premium';
  }

  const daysText = daysUntilCheckIn === 1 ? 'day' : 'days';
  const percentage = Math.round((multiplier - 1) * 100);

  if (daysUntilCheckIn <= 3) {
    return `⚠️ Critical urgency: +${percentage}% (${daysUntilCheckIn} ${daysText} notice)`;
  }

  if (daysUntilCheckIn <= 7) {
    return `⏰ High urgency: +${percentage}% (${daysUntilCheckIn} ${daysText} notice)`;
  }

  return `📅 Moderate urgency: +${percentage}% (${daysUntilCheckIn} ${daysText} notice)`;
}

/**
 * Format urgency premium for display
 *
 * @param premium - Premium amount in cents
 * @param multiplier - Multiplier applied
 * @returns Formatted string
 */
export function formatUrgencyPremium(
  premium: number,
  multiplier: number
): string {
  if (premium === 0) return '';

  const percentIncrease = Math.round((multiplier - 1) * 100);
  const dollars = (premium / 100).toFixed(2);

  return `+$${dollars} (${percentIncrease}% urgency adjustment)`;
}
