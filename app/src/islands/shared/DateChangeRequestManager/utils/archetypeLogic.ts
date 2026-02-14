/**
 * Archetype Logic - Pattern 1: Personalized Defaults
 *
 * User archetype detection using heuristic-based classification.
 * Analyzes behavioral signals to classify users into archetypes.
 *
 * SCAFFOLDING: Uses simple heuristics. Replace with ML model when ready.
 *
 * @module utils/archetypeLogic
 */

import type {
  ArchetypeType,
  ArchetypeSignals,
  ArchetypeDetectionResult,
  ArchetypeScoreBreakdown,
  BookingHistory,
  DateChangeHistory,
} from '../types';

/**
 * Detect user archetype from behavioral signals
 *
 * Uses weighted scoring system across four categories:
 * - Economic signals (40% weight)
 * - Behavioral signals (35% weight)
 * - Flexibility indicators (25% weight)
 *
 * @param signals - Behavioral signals for classification
 * @returns Archetype detection result with confidence
 */
export function detectArchetype(
  signals: ArchetypeSignals
): ArchetypeDetectionResult {
  const scoreBreakdown = calculateArchetypeScores(signals);
  const { normalized } = scoreBreakdown;

  // Select archetype with highest normalized score
  const winner = Object.entries(normalized).reduce((a, b) =>
    a[1] > b[1] ? a : b
  ) as [ArchetypeType, number];

  // Calculate confidence as margin over second place
  const scores = Object.values(normalized).sort((a, b) => b - a);
  const margin = scores[0] - scores[1];

  // Confidence ranges from 0.5 (no margin) to 0.95 (large margin)
  const confidence = Math.min(0.95, Math.max(0.5, margin + 0.5));

  // Generate human-readable reason
  const reason = generateArchetypeReason(winner[0], signals, scoreBreakdown);

  return {
    archetype: winner[0],
    confidence,
    reason,
    signals,
  };
}

/**
 * Calculate archetype scores from behavioral signals
 *
 * @param signals - Behavioral signals
 * @returns Score breakdown for all archetypes
 */
function calculateArchetypeScores(
  signals: ArchetypeSignals
): ArchetypeScoreBreakdown {
  let bigSpenderScore = 0;
  let budgetConsciousScore = 0;
  let balancedScore = 0;

  // ========================================
  // ECONOMIC SIGNALS (40% weight)
  // ========================================

  // Average transaction value
  if (signals.avgTransactionValue > 1000) {
    bigSpenderScore += 30;
  } else if (signals.avgTransactionValue < 300) {
    budgetConsciousScore += 20;
  } else {
    balancedScore += 15;
  }

  // Willingness to pay
  if (signals.willingnessToPay > 0.7) {
    bigSpenderScore += 25;
  } else if (signals.willingnessToPay < 0.4) {
    budgetConsciousScore += 25;
  } else {
    balancedScore += 15;
  }

  // Price rejection rate
  if (signals.priceRejectionRate < 0.3) {
    bigSpenderScore += 15;
  } else if (signals.priceRejectionRate > 0.6) {
    budgetConsciousScore += 20;
  } else {
    balancedScore += 10;
  }

  // ========================================
  // BEHAVIORAL SIGNALS (35% weight)
  // ========================================

  // Response time (longer response = less urgent = big spender)
  if (signals.avgResponseTimeHours > 3) {
    bigSpenderScore += 15;
  } else if (signals.avgResponseTimeHours < 2) {
    budgetConsciousScore += 25;
  } else {
    balancedScore += 10;
  }

  // Acceptance rate (lower = pickier = big spender)
  if (signals.acceptanceRate < 0.5) {
    bigSpenderScore += 15;
  } else if (signals.acceptanceRate > 0.7) {
    budgetConsciousScore += 20;
  } else {
    balancedScore += 10;
  }

  // Request frequency (higher = more flexibility needs)
  if (signals.requestFrequencyPerMonth > 2) {
    bigSpenderScore += 10;
  } else if (signals.requestFrequencyPerMonth < 1) {
    balancedScore += 10;
  } else {
    budgetConsciousScore += 15;
  }

  // ========================================
  // FLEXIBILITY INDICATORS (25% weight)
  // ========================================

  // Flexibility score
  if (signals.flexibilityScore < 40) {
    bigSpenderScore += 20;
  } else if (signals.flexibilityScore > 70) {
    budgetConsciousScore += 30;
  } else {
    balancedScore += 15;
  }

  // Accommodation history
  if (signals.accommodationHistory > 10) {
    budgetConsciousScore += 15;
  } else if (signals.accommodationHistory < 3) {
    bigSpenderScore += 10;
  } else {
    balancedScore += 10;
  }

  // Reciprocity ratio (lower = takes more than gives = big spender)
  if (signals.reciprocityRatio < 0.5) {
    bigSpenderScore += 10;
  } else if (signals.reciprocityRatio > 1.5) {
    budgetConsciousScore += 15;
  } else {
    balancedScore += 10;
  }

  // ========================================
  // TRANSACTION PREFERENCES (bonus points)
  // ========================================

  if (signals.fullWeekPreference > 0.6) {
    bigSpenderScore += 10;
  }

  if (signals.alternatingPreference > 0.5) {
    budgetConsciousScore += 10;
  }

  if (signals.sharedNightPreference > 0.4) {
    balancedScore += 10;
  }

  // Normalize to 0-1 range
  const total = bigSpenderScore + budgetConsciousScore + balancedScore;
  const normalized = {
    big_spender: total > 0 ? bigSpenderScore / 100 : 0.33,
    budget_conscious: total > 0 ? budgetConsciousScore / 100 : 0.33,
    balanced: total > 0 ? balancedScore / 100 : 0.34,
  };

  return {
    bigSpenderScore,
    budgetConsciousScore,
    balancedScore,
    normalized,
  };
}

/**
 * Generate human-readable reason for archetype classification
 *
 * @param archetype - Detected archetype
 * @param signals - Behavioral signals
 * @param scores - Score breakdown
 * @returns Human-readable reason string
 */
function generateArchetypeReason(
  archetype: ArchetypeType,
  signals: ArchetypeSignals,
  scores: ArchetypeScoreBreakdown
): string {
  const reasons: string[] = [];

  if (archetype === 'big_spender') {
    if (signals.avgTransactionValue > 1000) {
      reasons.push(`Average transaction value of $${(signals.avgTransactionValue / 100).toFixed(0)}`);
    }
    if (signals.willingnessToPay > 0.7) {
      reasons.push('High willingness to pay for convenience');
    }
    if (signals.acceptanceRate < 0.5) {
      reasons.push('Selective about accepting proposals');
    }
    if (signals.fullWeekPreference > 0.6) {
      reasons.push(`Prefer full week (${(signals.fullWeekPreference * 100).toFixed(0)}% of time)`);
    }
  } else if (archetype === 'budget_conscious') {
    if (signals.flexibilityScore > 70) {
      reasons.push(`High flexibility score (${signals.flexibilityScore}/100)`);
    }
    if (signals.accommodationHistory > 10) {
      reasons.push(`Accommodated others ${signals.accommodationHistory} times`);
    }
    if (signals.alternatingPreference > 0.5) {
      reasons.push(`Prefer alternating (${(signals.alternatingPreference * 100).toFixed(0)}% of time)`);
    }
    if (signals.reciprocityRatio > 1.5) {
      reasons.push('Gives more than receives');
    }
  } else {
    reasons.push('Balanced preferences across all transaction types');
  }

  return reasons.join(', ') || 'Insufficient data for detailed classification';
}

/**
 * Detect archetype from booking and date change history
 *
 * Convenience function that builds signals from raw history data.
 * SCAFFOLDING: Simplified calculation. Enhance with more sophisticated analysis.
 *
 * @param params - User ID and history
 * @returns Archetype detection result
 */
export function detectUserArchetype(params: {
  userId: string;
  bookingHistory?: BookingHistory[];
  dateChangeHistory?: DateChangeHistory[];
}): ArchetypeDetectionResult {
  const { bookingHistory = [], dateChangeHistory = [] } = params;

  // Calculate signals from history
  const signals = buildSignalsFromHistory(bookingHistory, dateChangeHistory);

  // Detect archetype
  return detectArchetype(signals);
}

/**
 * Build behavioral signals from booking and date change history
 *
 * SCAFFOLDING: Simplified calculation. Replace with more sophisticated analysis.
 *
 * @param bookingHistory - User's booking history
 * @param dateChangeHistory - User's date change history
 * @returns Behavioral signals
 */
function buildSignalsFromHistory(
  bookingHistory: BookingHistory[],
  dateChangeHistory: DateChangeHistory[]
): ArchetypeSignals {
  // Default signals for new users
  if (bookingHistory.length === 0 && dateChangeHistory.length === 0) {
    return {
      avgTransactionValue: 0,
      willingnessToPay: 0.5,
      priceRejectionRate: 0.5,
      avgResponseTimeHours: 24,
      acceptanceRate: 0.5,
      requestFrequencyPerMonth: 0,
      fullWeekPreference: 0.33,
      sharedNightPreference: 0.33,
      alternatingPreference: 0.34,
      flexibilityScore: 50,
      accommodationHistory: 0,
      reciprocityRatio: 1.0,
    };
  }

  // Calculate average transaction value
  const allTransactions = [
    ...bookingHistory.map(b => b.finalPrice),
    ...dateChangeHistory.map(d => d.priceOffered),
  ];
  const avgTransactionValue =
    allTransactions.length > 0
      ? allTransactions.reduce((sum, val) => sum + val, 0) / allTransactions.length
      : 0;

  // Calculate willingness to pay (how much above base price)
  const premiumBookings = bookingHistory.filter(
    b => b.finalPrice > b.basePrice * 1.1
  );
  const willingnessToPay =
    bookingHistory.length > 0 ? premiumBookings.length / bookingHistory.length : 0.5;

  // Calculate price rejection rate
  const rejectedDueToPrice = dateChangeHistory.filter(d => !d.accepted);
  const priceRejectionRate =
    dateChangeHistory.length > 0
      ? rejectedDueToPrice.length / dateChangeHistory.length
      : 0.5;

  // Calculate average response time (placeholder - would need real data)
  const avgResponseTimeHours = 24;

  // Calculate acceptance rate
  const acceptedRequests = dateChangeHistory.filter(d => d.accepted);
  const acceptanceRate =
    dateChangeHistory.length > 0
      ? acceptedRequests.length / dateChangeHistory.length
      : 0.5;

  // Calculate request frequency
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const recentRequests = dateChangeHistory.filter(d => d.date >= oneMonthAgo);
  const requestFrequencyPerMonth = recentRequests.length;

  // Calculate transaction type preferences
  const fullWeeks = dateChangeHistory.filter(d => d.type === 'full_week').length;
  const sharedNights = dateChangeHistory.filter(d => d.type === 'shared_night').length;
  const alternations = dateChangeHistory.filter(d => d.type === 'alternating').length;
  const total = fullWeeks + sharedNights + alternations;

  const fullWeekPreference = total > 0 ? fullWeeks / total : 0.33;
  const sharedNightPreference = total > 0 ? sharedNights / total : 0.33;
  const alternatingPreference = total > 0 ? alternations / total : 0.34;

  // Calculate flexibility score (based on date flexibility in bookings)
  const flexibleBookings = bookingHistory.filter(b => b.wasFlexible);
  const flexibilityScore =
    bookingHistory.length > 0
      ? (flexibleBookings.length / bookingHistory.length) * 100
      : 50;

  // Calculate accommodation history (count of alternations)
  const accommodationHistory = alternations;

  // Calculate reciprocity ratio (placeholder - would need real data)
  const reciprocityRatio = 1.0;

  return {
    avgTransactionValue,
    willingnessToPay,
    priceRejectionRate,
    avgResponseTimeHours,
    acceptanceRate,
    requestFrequencyPerMonth,
    fullWeekPreference,
    sharedNightPreference,
    alternatingPreference,
    flexibilityScore,
    accommodationHistory,
    reciprocityRatio,
  };
}

/**
 * Get archetype label for display
 *
 * @param archetype - Archetype type
 * @returns Human-readable label
 */
export function getArchetypeLabel(archetype: ArchetypeType): string {
  const labels: Record<ArchetypeType, string> = {
    big_spender: 'Premium Booker',
    budget_conscious: 'Budget Conscious',
    balanced: 'Balanced',
  };

  return labels[archetype] || 'Standard User';
}

/**
 * Get archetype description
 *
 * @param archetype - Archetype type
 * @returns Description of archetype
 */
export function getArchetypeDescription(archetype: ArchetypeType): string {
  const descriptions: Record<ArchetypeType, string> = {
    big_spender: 'Users who typically pay premium for guaranteed access and convenience',
    budget_conscious: 'Users who prefer fair exchanges and are accommodating with dates',
    balanced: 'Standard users with balanced preferences across all transaction types',
  };

  return descriptions[archetype] || descriptions.balanced;
}
