/**
 * Default Selection Engine - Pattern 1: Personalized Defaults
 *
 * Core recommendation algorithm for selecting personalized transaction defaults.
 * Uses rule-based logic to recommend buyout, crash, or swap based on context.
 *
 * SCAFFOLDING: Uses simple heuristics. Replace with ML model when ready.
 *
 * @module utils/defaultSelectionEngine
 */

import type {
  TransactionContext,
  DefaultSelectionResult,
  TransactionOption,
  TransactionType,
} from '../types';

/**
 * Select personalized default transaction option
 *
 * Analyzes user archetype, urgency, and context to recommend best transaction type.
 *
 * Decision tree:
 * 1. Big Spender + High Urgency → Buyout
 * 2. High Flex + Any Urgency → Swap
 * 3. Average + Low Urgency → Swap
 * 4. Average + Medium Urgency → Crash
 * 5. Average + High Urgency → Crash
 * 6. Big Spender + Low Urgency → Buyout
 *
 * @param context - Transaction context
 * @returns Default selection result with recommendations
 */
export function selectPersonalizedDefault(
  context: TransactionContext
): DefaultSelectionResult {
  const {
    requestingUserArchetype,
    requestingUserConfidence,
    daysUntilCheckIn,
    roommate,
    userHistory,
  } = context;

  // ========================================
  // RULE 1: Big Spender + High Urgency → BUYOUT
  // ========================================
  if (
    requestingUserArchetype === 'big_spender' &&
    daysUntilCheckIn <= 14
  ) {
    return {
      primaryOption: 'buyout',
      sortedOptions: buildSortedOptions(context, ['buyout', 'crash', 'swap']),
      reasoning: [
        'High urgency booking',
        'Your typical preference for guaranteed access',
        `Similar users choose buyout ${Math.round(0.70 * 100)}% of the time`,
        'Immediate confirmation likely',
      ],
      confidence: 0.85,
    };
  }

  // ========================================
  // RULE 2: High Flex + Any Urgency → SWAP
  // ========================================
  if (requestingUserArchetype === 'high_flexibility') {
    const previousSwaps = userHistory.previousTransactions || 0;
    return {
      primaryOption: 'swap',
      sortedOptions: buildSortedOptions(context, ['swap', 'crash', 'buyout']),
      reasoning: [
        'You prefer fair exchanges',
        previousSwaps > 0
          ? `You've completed ${previousSwaps} successful transactions`
          : 'Build goodwill with reciprocal exchanges',
        `${roommate.name} accepts ${Math.round(roommate.acceptanceRate * 100)}% of swaps`,
      ],
      confidence: 0.78,
    };
  }

  // ========================================
  // RULE 3: Average User + Low Urgency (>21 days) → SWAP
  // ========================================
  if (
    daysUntilCheckIn > 21 &&
    requestingUserArchetype === 'average_user'
  ) {
    return {
      primaryOption: 'swap',
      sortedOptions: buildSortedOptions(context, ['swap', 'crash', 'buyout']),
      reasoning: [
        'Plenty of time to find a fair swap',
        'Save money with no-cost exchange',
        'Average success rate: 72%',
      ],
      confidence: 0.65,
    };
  }

  // ========================================
  // RULE 4: Average User + Medium Urgency (8-21 days) → CRASH
  // ========================================
  if (
    daysUntilCheckIn >= 8 &&
    daysUntilCheckIn <= 21 &&
    requestingUserArchetype === 'average_user'
  ) {
    return {
      primaryOption: 'crash',
      sortedOptions: buildSortedOptions(context, ['crash', 'swap', 'buyout']),
      reasoning: [
        'Good balance of cost and certainty',
        'Shared space keeps costs low',
        `${Math.round(roommate.acceptanceRate * 100)}% acceptance rate for crashes`,
      ],
      confidence: 0.70,
    };
  }

  // ========================================
  // RULE 5: Average User + High Urgency (<8 days) → CRASH
  // ========================================
  if (
    daysUntilCheckIn < 8 &&
    requestingUserArchetype === 'average_user'
  ) {
    return {
      primaryOption: 'crash',
      sortedOptions: buildSortedOptions(context, ['crash', 'buyout', 'swap']),
      reasoning: [
        'Urgent need at reasonable cost',
        'Buyout may be too expensive with urgency premium',
        'Your belongings are already there',
      ],
      confidence: 0.75,
    };
  }

  // ========================================
  // RULE 6: Big Spender + Low Urgency → BUYOUT
  // ========================================
  if (requestingUserArchetype === 'big_spender') {
    return {
      primaryOption: 'buyout',
      sortedOptions: buildSortedOptions(context, ['buyout', 'crash', 'swap']),
      reasoning: [
        'Guaranteed access is worth it',
        'Your time is valuable',
        'No urgency premium at this notice level',
      ],
      confidence: 0.72,
    };
  }

  // ========================================
  // DEFAULT FALLBACK (should rarely hit this)
  // ========================================
  return {
    primaryOption: 'crash',
    sortedOptions: buildSortedOptions(context, ['crash', 'swap', 'buyout']),
    reasoning: ['Balanced option for your situation'],
    confidence: 0.50,
  };
}

/**
 * Build sorted transaction options in specified order
 *
 * Creates full TransactionOption objects with pricing, confidence, and metadata.
 *
 * @param context - Transaction context
 * @param order - Desired order of transaction types
 * @returns Sorted array of transaction options
 */
function buildSortedOptions(
  context: TransactionContext,
  order: TransactionType[]
): TransactionOption[] {
  const options = order.map((type, index) => {
    const baseOption = buildTransactionOption(context, type);
    return {
      ...baseOption,
      recommended: index === 0, // First in order is recommended
      priority: index + 1, // 1 = highest priority
    };
  });

  return options;
}

/**
 * Build a single transaction option with pricing and metadata
 *
 * @param context - Transaction context
 * @param type - Transaction type to build
 * @returns Complete transaction option
 */
function buildTransactionOption(
  context: TransactionContext,
  type: TransactionType
): TransactionOption {
  const { targetNight, daysUntilCheckIn, roommate } = context;

  // Calculate urgency multiplier
  const urgencyMultiplier = calculateUrgencyMultiplier(daysUntilCheckIn);

  // Calculate base price and fees per transaction type
  let price: number;
  let platformFee: number;
  let roommateReceives: number | undefined;
  let savingsVsBuyout: number | undefined;
  let requiresUserNight: boolean | undefined;
  let potentialMatches: number | undefined;

  if (type === 'buyout') {
    // Buyout: High price, urgency premium applies
    const basePrice = targetNight.basePrice * targetNight.marketDemand;
    price = Math.round(basePrice * urgencyMultiplier);
    platformFee = Math.round(price * 0.015); // 1.5% platform fee
    roommateReceives = Math.round(price * 0.985); // Roommate gets 98.5%
  } else if (type === 'crash') {
    // Crash: ~20% of buyout price
    const buyoutPrice = Math.round(
      targetNight.basePrice * targetNight.marketDemand * urgencyMultiplier
    );
    price = Math.round(buyoutPrice * 0.20);
    platformFee = Math.round(price * 0.015);
    roommateReceives = Math.round(price * 0.985);
    savingsVsBuyout = buyoutPrice - (price + platformFee);
  } else {
    // Swap: Free exchange, only platform fee
    price = 0;
    platformFee = 500; // $5 platform fee for swap processing
    requiresUserNight = true;
    potentialMatches = 2; // SCAFFOLDING: Would come from real match algorithm
    const buyoutPrice = Math.round(
      targetNight.basePrice * targetNight.marketDemand * urgencyMultiplier
    );
    savingsVsBuyout = buyoutPrice;
  }

  const totalCost = price + platformFee;

  // Calculate confidence/acceptance probability
  const confidence = calculateConfidence(type, context);
  const estimatedAcceptanceProbability = calculateAcceptanceProbability(
    type,
    roommate.acceptanceRate,
    urgencyMultiplier
  );

  return {
    type,
    price,
    platformFee,
    totalCost,
    targetDate: targetNight.date,
    roommate,
    confidence,
    estimatedAcceptanceProbability,
    urgencyMultiplier,
    recommended: false, // Set by buildSortedOptions
    priority: 1, // Set by buildSortedOptions
    roommateReceives,
    savingsVsBuyout,
    requiresUserNight,
    potentialMatches,
  };
}

/**
 * Calculate urgency multiplier based on days until check-in
 *
 * Linear model:
 * - 0-3 days: 1.5x (critical)
 * - 4-7 days: 1.25x (high)
 * - 8-14 days: 1.1x (medium)
 * - 15+ days: 1.0x (low)
 *
 * SCAFFOLDING: Replace with exponential model or dynamic pricing algorithm
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
 * Calculate confidence in recommendation
 *
 * Based on archetype confidence and context factors.
 *
 * @param type - Transaction type
 * @param context - Transaction context
 * @returns Confidence score (0-1)
 */
function calculateConfidence(
  type: TransactionType,
  context: TransactionContext
): number {
  const { requestingUserConfidence, daysUntilCheckIn } = context;

  // Start with user archetype confidence
  let confidence = requestingUserConfidence;

  // Boost confidence for buyout with high urgency
  if (type === 'buyout' && daysUntilCheckIn <= 7) {
    confidence = Math.min(0.95, confidence + 0.1);
  }

  // Reduce confidence for swap with low urgency (less time to find match)
  if (type === 'swap' && daysUntilCheckIn <= 7) {
    confidence = Math.max(0.4, confidence - 0.15);
  }

  return confidence;
}

/**
 * Calculate estimated acceptance probability
 *
 * Based on roommate's historical acceptance rate and urgency.
 *
 * @param type - Transaction type
 * @param roommateAcceptanceRate - Roommate's historical acceptance rate
 * @param urgencyMultiplier - Urgency multiplier
 * @returns Estimated acceptance probability (0-1)
 */
function calculateAcceptanceProbability(
  type: TransactionType,
  roommateAcceptanceRate: number,
  urgencyMultiplier: number
): number {
  let probability = roommateAcceptanceRate;

  // Buyout has higher acceptance (financial incentive)
  if (type === 'buyout') {
    probability = Math.min(0.95, probability + 0.15);
  }

  // Higher urgency multiplier may reduce acceptance (expensive)
  if (urgencyMultiplier > 1.2) {
    probability = Math.max(0.3, probability - 0.1);
  }

  // Swap has lower acceptance (requires matching availability)
  if (type === 'swap') {
    probability = Math.max(0.4, probability - 0.1);
  }

  return probability;
}

/**
 * Get recommendation reasoning for display
 *
 * @param result - Default selection result
 * @returns Array of reasoning strings
 */
export function getRecommendationReasoning(
  result: DefaultSelectionResult
): string[] {
  return result.reasoning;
}

/**
 * Get primary recommendation
 *
 * @param result - Default selection result
 * @returns Primary transaction type
 */
export function getPrimaryRecommendation(
  result: DefaultSelectionResult
): TransactionType {
  return result.primaryOption;
}
