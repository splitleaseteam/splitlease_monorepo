/**
 * Types Index - Pattern 1: Personalized Defaults
 *
 * Central export for all TypeScript types and interfaces.
 *
 * @module types
 */

// Re-export all transaction types
export type {
  TransactionType,
  UrgencyLevel,
  RoommateInfo,
  TransactionOption,
  TargetNight,
  UserHistory,
  TransactionContext,
  DefaultSelectionResult,
  ContextFactors,
  TransactionRecommendationsResponse,
  TransactionSelectorProps,
  TransactionCardProps,
  RecommendationBadgeProps,
  TransactionOptionViewedEvent,
  TransactionOptionSelectedEvent,
  TransactionOptionChangedEvent,
} from './transactionTypes';

// Re-export all archetype types
export type {
  ArchetypeType,
  ArchetypeSignals,
  UserArchetype,
  ArchetypeDetectionResult,
  ArchetypeScoreBreakdown,
  TransactionHistory,
  BookingHistory,
  DateChangeHistory,
  ArchetypeDefault,
  UserArchetypeResponse,
} from './archetypeTypes';

// Re-export archetype constants
export {
  USER_ARCHETYPES,
  ARCHETYPE_LABELS,
  ARCHETYPE_DESCRIPTIONS,
  ARCHETYPE_DEFAULT_PERCENTAGES,
} from './archetypeTypes';
