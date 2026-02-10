/**
 * Default Selection Engine
 *
 * Core algorithm for selecting personalized transaction defaults based on:
 * - User archetype
 * - Date urgency
 * - Historical behavior
 * - Roommate acceptance patterns
 */

import { BehaviorArchetype } from './archetype-detection.ts';
import { UrgencyResult } from './urgency-calculator.ts';

export interface TransactionContext {
  requestingUser: BehaviorArchetype;
  targetNight: {
    date: Date;
    basePrice: number;
    dayOfWeek: string;
    marketDemand: number;  // 0.7 (low) to 1.4 (high)
  };
  daysUntilCheckIn: number;
  roommate: {
    id: string;
    archetype: BehaviorArchetype;
    acceptanceRate: number;
    avgResponseTimeHours: number;
  };
  userHistory: {
    previousTransactions: number;
    lastTransactionType: 'full_week' | 'shared_night' | 'alternating' | null;
    lastTransactionSuccess: boolean;
  };
}

export interface TransactionOption {
  type: 'full_week' | 'shared_night' | 'alternating';
  price: number;
  platformFee: number;
  totalCost: number;
  priority: number;  // 1 (highest) to 3 (lowest)
  recommended: boolean;
  confidence: number;  // 0-1
  roommateReceives: number;
  urgencyMultiplier: number;
  estimatedAcceptanceProbability: number;
  reasoning: string[];
  savingsVsFullWeek?: number;
  requiresUserNight?: boolean;
  potentialMatches?: number;
}

export interface DefaultSelectionResult {
  primaryOption: 'full_week' | 'shared_night' | 'alternating';
  sortedOptions: Array<'full_week' | 'shared_night' | 'alternating'>;
  reasoning: string[];
  confidence: number;
}

/**
 * Main algorithm: Select personalized default transaction type
 */
export function selectPersonalizedDefault(
  context: TransactionContext
): DefaultSelectionResult {

  const {
    requestingUser,
    daysUntilCheckIn,
    userHistory
  } = context;

  // RULE 1: High Urgency + Big Spender → BUYOUT
  if (
    requestingUser.archetypeType === 'big_spender' &&
    daysUntilCheckIn <= 14
  ) {
    return {
      primaryOption: 'full_week',
      sortedOptions: ['full_week', 'shared_night', 'alternating'],
      reasoning: [
        'High urgency booking',
        'Your typical preference for guaranteed access',
        `Similar users choose full week ${(requestingUser.signals.fullWeekPreference * 100).toFixed(0)}% of the time`
      ],
      confidence: 0.85
    };
  }

  // RULE 2: High Flexibility + Any Urgency → SWAP
  if (requestingUser.archetypeType === 'high_flexibility') {
    return {
      primaryOption: 'alternating',
      sortedOptions: ['alternating', 'shared_night', 'full_week'],
      reasoning: [
        'You prefer fair exchanges',
        userHistory.previousTransactions > 0
          ? `You've completed ${userHistory.previousTransactions} successful transactions`
          : 'Swaps offer no-cost solutions',
        `${context.roommate.archetype.signals.acceptanceRate > 0 ?
          (context.roommate.archetype.signals.acceptanceRate * 100).toFixed(0) + '% acceptance rate' :
          'Good potential for acceptance'}`
      ],
      confidence: 0.78
    };
  }

  // RULE 3: Average User + Low Urgency (21+ days) → SWAP
  if (daysUntilCheckIn > 21) {
    return {
      primaryOption: 'alternating',
      sortedOptions: ['alternating', 'shared_night', 'full_week'],
      reasoning: [
        'Plenty of time to find a fair alternating arrangement',
        'Save money with no-cost exchange',
        'Average success rate: 72%'
      ],
      confidence: 0.65
    };
  }

  // RULE 4: Average User + Medium Urgency (7-21 days) → CRASH
  if (
    daysUntilCheckIn >= 7 &&
    daysUntilCheckIn <= 21 &&
    requestingUser.archetypeType === 'average_user'
  ) {
    return {
      primaryOption: 'shared_night',
      sortedOptions: ['shared_night', 'alternating', 'full_week'],
      reasoning: [
        'Good balance of cost and certainty',
        'Shared space keeps costs low',
        `${(context.roommate.acceptanceRate * 100).toFixed(0)}% acceptance rate for shared arrangements`
      ],
      confidence: 0.70
    };
  }

  // RULE 5: Average User + High Urgency (< 7 days) → CRASH
  if (
    daysUntilCheckIn < 7 &&
    requestingUser.archetypeType === 'average_user'
  ) {
    return {
      primaryOption: 'shared_night',
      sortedOptions: ['shared_night', 'full_week', 'alternating'],
      reasoning: [
        'Urgent need at reasonable cost',
        'Buyout may be too expensive',
        'Your belongings are already there'
      ],
      confidence: 0.75
    };
  }

  // RULE 6: Big Spender + Low Urgency → Still BUYOUT (they prefer it)
  if (requestingUser.archetypeType === 'big_spender') {
    return {
      primaryOption: 'full_week',
      sortedOptions: ['full_week', 'shared_night', 'alternating'],
      reasoning: [
        'Guaranteed access is worth it',
        'Your time is valuable',
        'Consistent with your booking patterns'
      ],
      confidence: 0.72
    };
  }

  // RULE 7: New User (No History) → CRASH
  if (userHistory.previousTransactions === 0) {
    return {
      primaryOption: 'shared_night',
      sortedOptions: ['shared_night', 'alternating', 'full_week'],
      reasoning: [
        'Since this is your first request, we suggest shared arrangement',
        'Good balance of cost and flexibility',
        'Try other options once you build history'
      ],
      confidence: 0.40
    };
  }

  // DEFAULT FALLBACK
  return {
    primaryOption: 'shared_night',
    sortedOptions: ['shared_night', 'alternating', 'full_week'],
    reasoning: ['Balanced option for your situation'],
    confidence: 0.50
  };
}

/**
 * Build full transaction options with pricing and details
 */
export function buildTransactionOptions(
  context: TransactionContext,
  sortedTypes: Array<'full_week' | 'shared_night' | 'alternating'>
): TransactionOption[] {

  const options: TransactionOption[] = [];
  const basePrice = context.targetNight.basePrice;
  const urgencyMultiplier = calculateUrgencyMultiplier(context.daysUntilCheckIn);
  const marketMultiplier = context.targetNight.marketDemand;

  sortedTypes.forEach((type, index) => {
    const option = buildOption(
      type,
      basePrice,
      urgencyMultiplier,
      marketMultiplier,
      context,
      index + 1,  // priority
      index === 0  // is recommended
    );
    options.push(option);
  });

  // Calculate savings vs full_week for other options
  const fullWeekPrice = options.find(o => o.type === 'full_week')?.totalCost || 0;
  options.forEach(option => {
    if (option.type !== 'full_week' && fullWeekPrice > 0) {
      option.savingsVsFullWeek = fullWeekPrice - option.totalCost;
    }
  });

  return options;
}

/**
 * Build individual transaction option
 */
function buildOption(
  type: 'full_week' | 'shared_night' | 'alternating',
  basePrice: number,
  urgencyMultiplier: number,
  marketMultiplier: number,
  context: TransactionContext,
  priority: number,
  recommended: boolean
): TransactionOption {

  let price = 0;
  let platformFee = 0;
  let reasoning: string[] = [];
  let confidence = 0.5;
  let requiresUserNight = false;
  let potentialMatches = 0;

  switch (type) {
    case 'full_week':
      // Buyout: Full night price + urgency + market demand
      price = Math.round(basePrice * urgencyMultiplier * marketMultiplier);
      platformFee = Math.round(price * 0.015);  // 1.5% platform fee
      reasoning = [
        'Guaranteed availability',
        `Roommate receives $${(price * 0.985).toFixed(2)}`,
        'Exclusive use (no shared space)',
        'Immediate confirmation'
      ];
      confidence = estimateAcceptance(context, 'full_week');
      break;

    case 'shared_night':
      // Shared Night: ~18% of full_week price + urgency
      price = Math.round(basePrice * 0.18 * urgencyMultiplier * marketMultiplier);
      platformFee = 5;  // Flat $5 fee for shared_night
      reasoning = [
        'Shared space accommodation',
        `Roommate receives $${(price - platformFee).toFixed(2)}`,
        'Significantly lower cost',
        `Save $${((basePrice * urgencyMultiplier * marketMultiplier) - price).toFixed(2)} vs full week`
      ];
      confidence = estimateAcceptance(context, 'shared_night');
      break;

    case 'alternating':
      // Swap: No price, only platform fee
      price = 0;
      platformFee = 5;  // Flat $5 coordination fee
      requiresUserNight = true;
      potentialMatches = estimatePotentialSwapMatches(context);
      reasoning = [
        'Fair exchange - no cost',
        'Requires you to offer a night in return',
        `${potentialMatches} potential matching nights`,
        'Most equitable option'
      ];
      confidence = estimateAcceptance(context, 'alternating');
      break;
  }

  const totalCost = price + platformFee;
  const roommateReceives = type === 'alternating' ? 0 : price - platformFee;

  // Estimate acceptance probability
  const estimatedAcceptanceProbability = confidence *
    context.roommate.acceptanceRate *
    (type === context.userHistory.lastTransactionType && context.userHistory.lastTransactionSuccess ? 1.15 : 1.0);

  return {
    type,
    price,
    platformFee,
    totalCost,
    priority,
    recommended,
    confidence,
    roommateReceives,
    urgencyMultiplier,
    estimatedAcceptanceProbability: Math.min(0.95, estimatedAcceptanceProbability),
    reasoning,
    requiresUserNight,
    potentialMatches
  };
}

/**
 * Calculate urgency multiplier based on days until check-in
 */
function calculateUrgencyMultiplier(daysUntilCheckIn: number): number {
  if (daysUntilCheckIn <= 3) return 1.5;  // CRITICAL: 50% premium
  if (daysUntilCheckIn <= 7) return 1.25;  // HIGH: 25% premium
  if (daysUntilCheckIn <= 14) return 1.1;  // MEDIUM: 10% premium
  return 1.0;  // LOW: No premium
}

/**
 * Estimate acceptance probability for transaction type
 */
function estimateAcceptance(
  context: TransactionContext,
  type: 'full_week' | 'shared_night' | 'alternating'
): number {

  const roommate = context.roommate.archetype;
  let baseConfidence = 0.5;

  switch (type) {
    case 'full_week':
      // Big spenders more likely to accept full_week
      if (roommate.archetypeType === 'big_spender') {
        baseConfidence = 0.75;
      } else if (roommate.archetypeType === 'high_flexibility') {
        baseConfidence = 0.45;  // Flex users prefer other options
      } else {
        baseConfidence = 0.60;
      }
      break;

    case 'shared_night':
      // High flex users more likely to accept shared_night
      if (roommate.archetypeType === 'high_flexibility') {
        baseConfidence = 0.70;
      } else if (roommate.archetypeType === 'big_spender') {
        baseConfidence = 0.50;
      } else {
        baseConfidence = 0.65;
      }
      break;

    case 'alternating':
      // High flex users love alternating
      if (roommate.archetypeType === 'high_flexibility') {
        baseConfidence = 0.80;
      } else if (roommate.archetypeType === 'big_spender') {
        baseConfidence = 0.35;  // Big spenders don't like alternating
      } else {
        baseConfidence = 0.60;
      }
      break;
  }

  // Adjust based on roommate's historical preference
  const preferenceBoost = roommate.signals[`${type}Preference` as keyof typeof roommate.signals] as number;
  if (typeof preferenceBoost === 'number' && preferenceBoost > 0.5) {
    baseConfidence += (preferenceBoost - 0.5) * 0.4;  // Up to +0.2 boost
  }

  return Math.min(0.95, Math.max(0.2, baseConfidence));
}

/**
 * Estimate potential alternating matches
 */
function estimatePotentialSwapMatches(context: TransactionContext): number {
  // Simplified estimation - in production, query actual available nights
  const baseMatches = context.roommate.archetype.signals.flexibilityScore / 10;
  const urgencyPenalty = context.daysUntilCheckIn < 14 ? 0.5 : 1;
  return Math.max(1, Math.round(baseMatches * urgencyPenalty));
}

/**
 * Validate transaction context
 */
export function validateContext(context: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!context.requestingUser) {
    errors.push('Missing requestingUser');
  }
  if (!context.targetNight) {
    errors.push('Missing targetNight');
  }
  if (typeof context.daysUntilCheckIn !== 'number') {
    errors.push('Missing or invalid daysUntilCheckIn');
  }
  if (!context.roommate) {
    errors.push('Missing roommate');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
