/**
 * Confidence Scoring - Pattern 1: Personalized Defaults
 *
 * Functions for calculating and interpreting confidence scores.
 *
 * @module utils/confidenceScoring
 */

import type { TransactionContext, ArchetypeType } from '../types';

/**
 * Confidence level categories
 */
export type ConfidenceLevel = 'very_high' | 'high' | 'medium' | 'low';

/**
 * Get confidence level from score
 *
 * @param score - Confidence score (0-1)
 * @returns Confidence level category
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.85) return 'very_high';
  if (score >= 0.70) return 'high';
  if (score >= 0.50) return 'medium';
  return 'low';
}

/**
 * Get confidence level label
 *
 * @param level - Confidence level
 * @returns Human-readable label
 */
export function getConfidenceLevelLabel(level: ConfidenceLevel): string {
  const labels: Record<ConfidenceLevel, string> = {
    very_high: 'Very Confident',
    high: 'Confident',
    medium: 'Moderately Confident',
    low: 'Low Confidence',
  };

  return labels[level];
}

/**
 * Get confidence color for UI
 *
 * @param level - Confidence level
 * @returns CSS color class
 */
export function getConfidenceColor(level: ConfidenceLevel): string {
  const colors: Record<ConfidenceLevel, string> = {
    very_high: 'green',
    high: 'blue',
    medium: 'yellow',
    low: 'gray',
  };

  return colors[level];
}

/**
 * Calculate overall recommendation confidence
 *
 * Combines archetype confidence with contextual factors.
 *
 * @param archetypeConfidence - Confidence in archetype classification (0-1)
 * @param context - Transaction context
 * @returns Overall confidence score (0-1)
 */
export function calculateRecommendationConfidence(
  archetypeConfidence: number,
  context: TransactionContext
): number {
  let confidence = archetypeConfidence;

  // Boost confidence with more transaction history
  const historyBoost = Math.min(
    0.1,
    (context.userHistory.previousTransactions / 10) * 0.1
  );
  confidence += historyBoost;

  // Reduce confidence with high urgency (less time to verify recommendation)
  if (context.daysUntilCheckIn <= 3) {
    confidence = Math.max(0.4, confidence - 0.1);
  }

  // Boost confidence with successful last transaction
  if (context.userHistory.lastTransactionSuccess) {
    confidence = Math.min(0.95, confidence + 0.05);
  }

  // Cap at 0.95 (never 100% certain)
  return Math.min(0.95, Math.max(0.4, confidence));
}

/**
 * Get confidence explanation
 *
 * Provides human-readable explanation for confidence level.
 *
 * @param confidence - Confidence score (0-1)
 * @param archetype - User archetype
 * @param previousTransactions - Number of previous transactions
 * @returns Explanation string
 */
export function getConfidenceExplanation(
  confidence: number,
  archetype: ArchetypeType,
  previousTransactions: number
): string {
  const level = getConfidenceLevel(confidence);

  if (level === 'very_high') {
    return `Strong match based on ${previousTransactions} previous transactions and clear ${archetype} behavior`;
  }

  if (level === 'high') {
    return `Good match based on ${archetype} archetype with ${previousTransactions} transactions`;
  }

  if (level === 'medium') {
    if (previousTransactions < 3) {
      return 'Limited history, but showing early signs of ' + archetype + ' behavior';
    }
    return 'Mixed signals, recommendation based on partial ' + archetype + ' match';
  }

  // low
  if (previousTransactions === 0) {
    return 'New user - recommendation based on general patterns';
  }
  return 'Uncertain match - consider all options carefully';
}

/**
 * Should show confidence indicator in UI
 *
 * Only show when confidence is meaningful (not for new users).
 *
 * @param confidence - Confidence score (0-1)
 * @param previousTransactions - Number of previous transactions
 * @returns Whether to show confidence indicator
 */
export function shouldShowConfidence(
  confidence: number,
  previousTransactions: number
): boolean {
  // Don't show for new users (not meaningful)
  if (previousTransactions === 0) return false;

  // Show if confidence is not exactly default (0.5)
  return Math.abs(confidence - 0.5) > 0.05;
}

/**
 * Calculate confidence delta between two scores
 *
 * @param newScore - New confidence score
 * @param oldScore - Old confidence score
 * @returns Delta (-1 to 1)
 */
export function calculateConfidenceDelta(
  newScore: number,
  oldScore: number
): number {
  return newScore - oldScore;
}

/**
 * Format confidence delta for display
 *
 * @param delta - Confidence delta
 * @returns Formatted string with direction indicator
 */
export function formatConfidenceDelta(delta: number): string {
  if (Math.abs(delta) < 0.01) return 'No change';

  const sign = delta > 0 ? '↑' : '↓';
  const percentage = Math.abs(Math.round(delta * 100));

  return `${sign} ${percentage}%`;
}
