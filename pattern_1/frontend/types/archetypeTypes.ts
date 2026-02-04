/**
 * Archetype Types - Pattern 1: Personalized Defaults
 *
 * Type definitions for user archetype detection and classification.
 *
 * @module types/archetypeTypes
 */

import { TransactionType } from './transactionTypes';

/**
 * User archetype type
 */
export type ArchetypeType = 'big_spender' | 'high_flexibility' | 'average_user';

/**
 * Behavioral signals used for archetype detection
 */
export interface ArchetypeSignals {
  // Economic signals (40% weight)
  /** Average transaction value in cents */
  avgTransactionValue: number;
  /** Willingness to pay (0-1 normalized) */
  willingnessToPay: number;
  /** Price rejection rate (0-1) */
  priceRejectionRate: number;

  // Behavioral signals (35% weight)
  /** Average response time in hours */
  avgResponseTimeHours: number;
  /** Overall acceptance rate (0-1) */
  acceptanceRate: number;
  /** Request frequency per month */
  requestFrequencyPerMonth: number;

  // Transaction preferences (15% weight)
  /** Preference for buyout (0-1) */
  buyoutPreference: number;
  /** Preference for crash (0-1) */
  crashPreference: number;
  /** Preference for swap (0-1) */
  swapPreference: number;

  // Flexibility indicators (10% weight)
  /** Flexibility score (0-100) */
  flexibilityScore: number;
  /** Times accommodated others */
  accommodationHistory: number;
  /** Given / Received ratio */
  reciprocityRatio: number;
}

/**
 * User archetype classification result
 */
export interface UserArchetype {
  /** User ID */
  userId: string;
  /** Archetype type */
  archetypeType: ArchetypeType;
  /** Confidence in classification (0-1) */
  confidence: number;
  /** Behavioral signals used for classification */
  signals: ArchetypeSignals;
  /** When archetype was last updated */
  lastUpdated: Date;
  /** Reason for classification (human-readable) */
  reason?: string;
}

/**
 * Archetype detection result
 */
export interface ArchetypeDetectionResult {
  /** Detected archetype */
  archetype: ArchetypeType;
  /** Confidence in detection (0-1) */
  confidence: number;
  /** Reason for classification */
  reason: string;
  /** Detailed signals breakdown */
  signals?: ArchetypeSignals;
}

/**
 * Archetype score breakdown
 */
export interface ArchetypeScoreBreakdown {
  /** Score for big spender (0-100) */
  bigSpenderScore: number;
  /** Score for high flexibility (0-100) */
  highFlexScore: number;
  /** Score for average user (0-100) */
  averageScore: number;
  /** Normalized scores (0-1) */
  normalized: {
    big_spender: number;
    high_flexibility: number;
    average_user: number;
  };
}

/**
 * Transaction history for archetype detection
 */
export interface TransactionHistory {
  /** Transaction ID */
  id: string;
  /** Transaction type */
  type: TransactionType;
  /** Base price in cents */
  basePrice: number;
  /** Final paid price in cents */
  finalPrice: number;
  /** Whether transaction was accepted */
  accepted: boolean;
  /** Response time in hours */
  responseTimeHours: number;
  /** Transaction date */
  date: Date;
}

/**
 * Booking history for archetype detection
 */
export interface BookingHistory {
  /** Booking ID */
  id: string;
  /** Base price for booking in cents */
  basePrice: number;
  /** Final price paid in cents */
  finalPrice: number;
  /** Number of nights */
  nights: number;
  /** Booking date */
  date: Date;
  /** Whether user was flexible with dates */
  wasFlexible: boolean;
}

/**
 * Date change history for archetype detection
 */
export interface DateChangeHistory {
  /** Request ID */
  id: string;
  /** Type of change requested */
  type: TransactionType;
  /** Whether request was accepted */
  accepted: boolean;
  /** Days notice given */
  daysNotice: number;
  /** Price offered in cents */
  priceOffered: number;
  /** Request date */
  date: Date;
}

/**
 * Archetype default configuration
 */
export interface ArchetypeDefault {
  /** Archetype type */
  archetype: ArchetypeType;
  /** Default price percentage (50-150) */
  defaultPercentage: number;
  /** Human-readable label */
  label: string;
  /** Description of archetype */
  description: string;
}

/**
 * API response for user archetype
 */
export interface UserArchetypeResponse {
  /** User ID */
  userId: string;
  /** Archetype type */
  archetypeType: ArchetypeType;
  /** Confidence (0-1) */
  confidence: number;
  /** Signals used */
  signals: ArchetypeSignals;
  /** When computed */
  computedAt: string;
  /** When next update is scheduled */
  nextUpdateIn: string;
}

/**
 * Archetype constants
 */
export const USER_ARCHETYPES = {
  BIG_SPENDER: 'big_spender' as const,
  HIGH_FLEX: 'high_flexibility' as const,
  AVERAGE: 'average_user' as const,
};

/**
 * Archetype labels
 */
export const ARCHETYPE_LABELS: Record<ArchetypeType, string> = {
  big_spender: 'Premium Booker',
  high_flexibility: 'Flexible Scheduler',
  average_user: 'Standard User',
};

/**
 * Archetype descriptions
 */
export const ARCHETYPE_DESCRIPTIONS: Record<ArchetypeType, string> = {
  big_spender: 'Users who typically pay premium for guaranteed access',
  high_flexibility: 'Users who prefer fair exchanges and frequent date changes',
  average_user: 'Standard user with balanced preferences',
};

/**
 * Default percentages by archetype
 */
export const ARCHETYPE_DEFAULT_PERCENTAGES: Record<ArchetypeType, number> = {
  big_spender: 120,
  high_flexibility: 90,
  average_user: 100,
};
