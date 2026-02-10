/**
 * Transaction Types - Pattern 1: Personalized Defaults
 *
 * Type definitions for transaction options, recommendations, and context.
 * Aligns with Split Lease Date Change Request system.
 *
 * @module types/transactionTypes
 */

/**
 * Transaction type identifiers
 */
export type TransactionType = 'full_week' | 'shared_night' | 'alternating';

/**
 * User archetype classifications
 */
export type ArchetypeType = 'big_spender' | 'high_flexibility' | 'average_user';

/**
 * Urgency level classifications
 */
export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Roommate information for transaction context
 */
export interface RoommateInfo {
  /** Unique roommate identifier */
  id: string;
  /** Display name */
  name: string;
  /** Roommate's archetype (if known) */
  archetype?: ArchetypeType;
  /** Historical acceptance rate for this transaction type (0-1) */
  acceptanceRate: number;
  /** Average response time in hours */
  avgResponseTimeHours: number;
  /** Current online status */
  isOnline: boolean;
}

/**
 * Transaction option with pricing and metadata
 */
export interface TransactionOption {
  /** Transaction type */
  type: TransactionType;
  /** Base price in cents */
  price: number;
  /** Platform fee in cents */
  platformFee: number;
  /** Total cost (price + fee) in cents */
  totalCost: number;
  /** Target date for transaction */
  targetDate: Date;
  /** Roommate involved in transaction */
  roommate: RoommateInfo;
  /** Confidence in recommendation (0-1) */
  confidence: number;
  /** Likelihood of acceptance (0-1) */
  estimatedAcceptanceProbability: number;
  /** Urgency multiplier applied (1.0 = no urgency) */
  urgencyMultiplier: number;
  /** Whether this is the recommended option */
  recommended: boolean;
  /** Priority ranking (1 = highest) */
  priority: number;
  /** Amount roommate will receive (full_week only) in cents */
  roommateReceives?: number;
  /** Savings vs full_week (shared_night/alternating only) in cents */
  savingsVsFullWeek?: number;
  /** Whether alternating requires user to offer a night */
  requiresUserNight?: boolean;
  /** Number of potential alternating matches */
  potentialMatches?: number;
  /** Reasoning strings for recommendation */
  reasoning?: string[];
}

/**
 * Target night information for transaction
 */
export interface TargetNight {
  /** Date of the night */
  date: Date;
  /** Base nightly price in cents */
  basePrice: number;
  /** Day of week (0-6, Sunday=0) */
  dayOfWeek: number;
  /** Market demand multiplier (0.7 = low, 1.4 = high) */
  marketDemand: number;
}

/**
 * User transaction history
 */
export interface UserHistory {
  /** Total number of previous transactions */
  previousTransactions: number;
  /** Type of last transaction */
  lastTransactionType: TransactionType | null;
  /** Whether last transaction was successful */
  lastTransactionSuccess: boolean;
}

/**
 * Complete transaction context for recommendation engine
 */
export interface TransactionContext {
  /** Requesting user's archetype */
  requestingUserArchetype: ArchetypeType;
  /** Requesting user's archetype confidence (0-1) */
  requestingUserConfidence: number;
  /** Target night information */
  targetNight: TargetNight;
  /** Days until check-in */
  daysUntilCheckIn: number;
  /** Roommate information */
  roommate: RoommateInfo;
  /** User's transaction history */
  userHistory: UserHistory;
}

/**
 * Default selection result from recommendation engine
 */
export interface DefaultSelectionResult {
  /** Primary recommended option */
  primaryOption: TransactionType;
  /** All options sorted by priority */
  sortedOptions: TransactionOption[];
  /** Reasoning for recommendation */
  reasoning: string[];
  /** Confidence in recommendation (0-1) */
  confidence: number;
}

/**
 * Context factors for analytics
 */
export interface ContextFactors {
  /** Days until check-in */
  daysUntilCheckIn: number;
  /** Is the date a weekday */
  isWeekday: boolean;
  /** Market demand multiplier */
  marketDemand: number;
  /** Roommate's archetype */
  roommateArchetype: ArchetypeType;
}

/**
 * API response for transaction recommendations
 */
export interface TransactionRecommendationsResponse {
  /** Primary recommendation */
  primaryRecommendation: TransactionType;
  /** All transaction options */
  options: TransactionOption[];
  /** User archetype information */
  userArchetype: {
    type: ArchetypeType;
    confidence: number;
  };
  /** Context factors */
  contextFactors: ContextFactors;
}

/**
 * Props for TransactionSelector component
 */
export interface TransactionSelectorProps {
  /** Current user ID */
  userId: string;
  /** Target date for transaction */
  targetDate: Date;
  /** Roommate ID */
  roommateId: string;
  /** Callback when transaction is selected */
  onTransactionSelected?: (option: TransactionOption) => void;
  /** Callback when user cancels */
  onCancel?: () => void;
  /** Optional initial selection */
  initialSelection?: TransactionType;
  /** Callback when selection changes */
  onSelectionChange?: (type: TransactionType) => void;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Controlled selected type */
  selectedType?: TransactionType | null;
  /** Controlled selection handler */
  onSelect?: (type: TransactionType) => void;
  /** Override recommendation type */
  recommendation?: TransactionType | null;
}

/**
 * Props for individual transaction cards
 */
export interface TransactionCardProps {
  /** Transaction option data */
  option: TransactionOption;
  /** Whether card is currently selected */
  isSelected: boolean;
  /** Whether card is expanded */
  isExpanded: boolean;
  /** Whether this is the primary recommendation */
  isPrimary: boolean;
  /** Callback when card is selected */
  onSelect: () => void;
  /** Callback when card should collapse */
  onCollapse: () => void;
  /** Card index for keyboard navigation */
  index: number;
}

/**
 * Props for RecommendationBadge component
 */
export interface RecommendationBadgeProps {
  /** Primary recommended option */
  primaryOption: TransactionType;
  /** Reasoning for recommendation */
  reasoning: string[];
  /** Whether to show expanded view */
  expanded?: boolean;
}

/**
 * Analytics event for transaction option viewed
 */
export interface TransactionOptionViewedEvent {
  userId: string;
  primaryRecommendation: TransactionType;
  archetypeType: ArchetypeType;
  archetypeConfidence: number;
  daysUntilCheckIn: number;
  pricing: {
    full_week: number;
    shared_night: number;
    alternating: number;
  };
}

/**
 * Analytics event for transaction option selected
 */
export interface TransactionOptionSelectedEvent {
  userId: string;
  selectedOption: TransactionType;
  wasRecommended: boolean;
  timeToDecisionSeconds: number;
}

/**
 * Analytics event for transaction option changed
 */
export interface TransactionOptionChangedEvent {
  userId: string;
  from: TransactionType;
  to: TransactionType;
  reason?: string;
}
