/**
 * PATTERN 3: PRICE ANCHORING - TYPE DEFINITIONS
 * Complete TypeScript type system for price anchoring components
 */

// ============================================================================
// CORE PRICE TYPES
// ============================================================================

/**
 * Represents a price tier in the anchoring system
 */
export type PriceTierId = 'budget' | 'recommended' | 'premium' | 'custom';

/**
 * Color scheme for tier cards
 */
export type TierColor = 'gray' | 'blue' | 'purple' | 'gold' | 'teal' | 'green';

/**
 * Tier multipliers relative to base price
 */
export interface TierMultipliers {
  budget: number;      // e.g., 0.90 (10% below base)
  recommended: number; // e.g., 1.00 (base price)
  premium: number;     // e.g., 1.15 (15% above base)
}

// ============================================================================
// PRICE TIER DEFINITION
// ============================================================================

/**
 * Complete definition of a price tier
 */
export interface PriceTier {
  id: PriceTierId;
  name: string;
  multiplier: number;
  icon: React.ComponentType<{ className?: string }> | string;
  badge: string | null;
  description: string;
  features: string[];
  color: TierColor;
  highlighted?: boolean;
  acceptanceRate?: number;  // Historical acceptance rate (0-1)
  avgResponseTime?: number; // Average response time in hours
  priority?: number;        // Display priority (1-3)
}

// ============================================================================
// PRICE ANCHOR MODELS
// ============================================================================

/**
 * Price anchor - the reference point for comparisons
 */
export interface PriceAnchor {
  anchorType: 'buyout' | 'market_rate' | 'competitor' | 'original';
  anchorPrice: number;
  source: string;
  confidence: number; // 0-1, how valid is this anchor
}

/**
 * Price comparison for a single option
 */
export interface PriceComparison {
  optionType: 'buyout' | 'crash' | 'swap' | 'tier';
  price: number;
  platformFee: number;
  totalCost: number;
  savingsVsAnchor: number;
  savingsPercentage: number;
  rank: 1 | 2 | 3;
  isAnchor: boolean;
}

/**
 * Complete anchoring context for a pricing decision
 */
export interface AnchoringContext {
  anchor: PriceAnchor;
  options: PriceComparison[];
  targetDate?: Date;
  userArchetype?: 'big_spender' | 'high_flexibility' | 'average_user';
}

// ============================================================================
// SAVINGS CALCULATION
// ============================================================================

/**
 * Savings information for display
 */
export interface SavingsInfo {
  amount: number;
  percentage: number;
  formattedAmount: string;
  formattedPercentage: string;
  tier?: 'massive' | 'good' | 'modest';
}

/**
 * Anchor context - how selected price compares to anchors
 */
export interface AnchorContextInfo {
  comparedToBase: {
    amount: number;
    direction: 'above' | 'below' | 'equal';
    formatted: string;
  };
  comparedToOriginal: {
    amount: number;
    direction: 'saving' | 'paying' | 'equal';
    formatted: string;
  };
}

// ============================================================================
// PLATFORM FEES
// ============================================================================

/**
 * Platform fees for different transaction types
 */
export interface PlatformFees {
  buyout: number;
  crash: number;
  swap: number;
  tier?: {
    budget: number;
    recommended: number;
    premium: number;
  };
}

// ============================================================================
// USER CONTEXT
// ============================================================================

/**
 * User preference and history context
 */
export interface UserContext {
  urgency?: 'low' | 'medium' | 'high';
  budget?: 'tight' | 'moderate' | 'flexible';
  history?: {
    hasAcceptedPremium?: boolean;
    hasAcceptedBudget?: boolean;
    avgTierSelected?: PriceTierId;
    totalOffers?: number;
  };
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props for PriceTierSelector component
 */
export interface PriceTierSelectorProps {
  basePrice: number;
  currentPrice?: number;
  onPriceChange: (price: number, tierId: PriceTierId) => void;
  savingsContext?: {
    originalPrice?: number;
    guestSaved?: number;
    sellerEarned?: number;
  };
  tiers?: PriceTier[];
  defaultTier?: PriceTierId;
  showCustomOption?: boolean;
  minPrice?: number;
  maxPrice?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Props for PriceTierCard component
 */
export interface PriceTierCardProps {
  tier: PriceTier;
  price: number;
  basePrice: number;
  savings?: SavingsInfo;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Props for SavingsBadge component
 */
export interface SavingsBadgeProps {
  savingsAmount: number;
  savingsPercentage: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'prominent' | 'subtle';
  animated?: boolean;
  className?: string;
}

/**
 * Props for PriceDisplay component
 */
export interface PriceDisplayProps {
  price: number;
  label?: string;
  anchorPrice?: number;
  showSavings?: boolean;
  showOriginalPrice?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'emphasized' | 'muted';
  currency?: string;
  className?: string;
}

/**
 * Props for AnchorCard component (buyout display)
 */
export interface AnchorCardProps {
  option: PriceComparison;
  isSelected: boolean;
  onSelect: () => void;
  className?: string;
}

/**
 * Props for ComparisonCard component
 */
export interface ComparisonCardProps {
  option: PriceComparison;
  anchor: PriceAnchor;
  isSelected: boolean;
  onSelect: () => void;
  rank: number;
  className?: string;
}

/**
 * Props for PriceComparisonChart component
 */
export interface PriceComparisonChartProps {
  options: PriceComparison[];
  anchor: PriceAnchor;
  selectedOption?: string;
  className?: string;
}

/**
 * Props for PriceAnchoringStack component
 */
export interface PriceAnchoringStackProps {
  buyoutPrice: number;
  crashPrice: number;
  swapPrice: number;
  platformFees: PlatformFees;
  targetDate?: Date;
  onOptionSelected: (option: PriceComparison) => void;
  className?: string;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * Return type for usePriceAnchor hook
 */
export interface UsePriceAnchorReturn {
  anchor: PriceAnchor;
  sortedOptions: PriceComparison[];
  selectedOption: PriceComparison | null;
  selectOption: (optionType: string) => void;
  tierPrices: {
    budget: number;
    recommended: number;
    premium: number;
  };
}

/**
 * Return type for useSavingsCalculations hook
 */
export interface UseSavingsCalculationsReturn {
  calculateSavings: (offerPrice: number, originalPrice: number) => SavingsInfo;
  getAnchorContext: (selectedPrice: number, basePrice: number, originalPrice: number) => AnchorContextInfo;
  formatSavings: (savings: SavingsInfo) => string;
  getSavingsTier: (savingsPercentage: number) => 'massive' | 'good' | 'modest';
}

// ============================================================================
// ANALYTICS EVENTS
// ============================================================================

/**
 * Analytics event for tier selection
 */
export interface TierSelectedEvent {
  tier: PriceTierId;
  price: number;
  basePrice: number;
  savings: number;
  savingsPercentage: number;
  timestamp: number;
  context?: AnchorContextInfo;
}

/**
 * Analytics event for custom price entry
 */
export interface CustomPriceEnteredEvent {
  price: number;
  basePrice: number;
  closestTier: PriceTierId;
  deviation: number;
  timestamp: number;
}

/**
 * Analytics event for price anchor viewed
 */
export interface PriceAnchorViewedEvent {
  anchorPrice: number;
  anchorType: string;
  comparisonOptions: Array<{
    type: string;
    price: number;
    savings: number;
  }>;
  userArchetype?: string;
  timestamp: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Configuration for price tier defaults
 */
export interface PriceTierConfig {
  tiers: TierMultipliers;
  defaultTier: PriceTierId;
  allowCustom: boolean;
  minMultiplier: number;
  maxMultiplier: number;
}

/**
 * Formatting options for currency display
 */
export interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showCurrencySymbol?: boolean;
}

/**
 * Visual theme configuration
 */
export interface VisualTheme {
  colors: {
    budget: string;
    recommended: string;
    premium: string;
    savings: string;
    warning: string;
  };
  sizes: {
    anchor: {
      height: number;
      fontSize: number;
    };
    comparison: {
      height: number;
      fontSize: number;
    };
  };
}

// ============================================================================
// FORM INTEGRATION TYPES
// ============================================================================

/**
 * Date change request data with tier selection
 */
export interface DateChangeRequestData {
  newDates: {
    start: Date | null;
    end: Date | null;
  };
  offerPrice: number;
  selectedTier: PriceTierId;
  anchorContext?: AnchorContextInfo;
  basePrice: number;
  customMessage?: string;
}

/**
 * Original booking information
 */
export interface OriginalBooking {
  id: string;
  price: number;
  startDate: Date;
  endDate: Date;
  guestName?: string;
  propertyName?: string;
}

/**
 * User profile for personalization
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  budgetPreference?: 'tight' | 'moderate' | 'flexible';
  offerHistory?: {
    totalOffers: number;
    acceptedOffers: number;
    avgTierSelected?: PriceTierId;
    hasAcceptedPremium: boolean;
  };
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * API response for tier recommendation
 */
export interface TierRecommendationResponse {
  recommendedTier: PriceTierId;
  confidence: number;
  reason: string;
  alternatives?: PriceTierId[];
}

/**
 * API response for price validation
 */
export interface PriceValidationResponse {
  isValid: boolean;
  reason?: string;
  suggestedPrice?: number;
  minPrice: number;
  maxPrice: number;
}

// ============================================================================
// EDGE CASE TYPES
// ============================================================================

/**
 * Edge case scenario information
 */
export interface EdgeCaseScenario {
  type: 'small_savings' | 'similar_prices' | 'swap_more_expensive' | 'negative_savings';
  warning: string;
  recommendation: string;
  showWarning: boolean;
  emphasis: 'savings' | 'benefits' | 'warning';
}

// ============================================================================
// TESTING TYPES
// ============================================================================

/**
 * Test fixture for price anchoring
 */
export interface PriceAnchoringTestFixture {
  basePrice: number;
  tiers: PriceTier[];
  expectedSavings: {
    budget: number;
    recommended: number;
    premium: number;
  };
  userContext?: UserContext;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export all types for convenience
export type {
  // Core types are already exported above
};
