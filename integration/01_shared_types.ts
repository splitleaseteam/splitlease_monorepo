/**
 * COMPREHENSIVE SHARED TYPES
 * Integration Layer - All 5 Patterns
 *
 * This file provides complete TypeScript type definitions
 * for the entire date change request system across all patterns.
 */

// ============================================================================
// PATTERN 1: PERSONALIZED DEFAULTS - ARCHETYPE TYPES
// ============================================================================

export type UserArchetype =
  | 'BIG_SPENDER'      // Users who typically pay premium prices
  | 'HIGH_FLEX'        // Users who frequently change dates
  | 'AVERAGE';         // Standard users

export interface ArchetypeDetectionResult {
  archetype: UserArchetype;
  confidence: number; // 0-1 scale
  reason: string;
  calculatedAt: string; // ISO timestamp
  metadata?: {
    premiumBookingsCount?: number;
    dateChangeRequestsCount?: number;
    avgPriceMultiplier?: number;
  };
}

export interface ArchetypeDefaultConfig {
  archetype: UserArchetype;
  defaultPercentage: number; // 50-150
  label: string;
  description: string;
}

// ============================================================================
// PATTERN 2: URGENCY COUNTDOWN - URGENCY TYPES
// ============================================================================

export type UrgencyLevel =
  | 'CRITICAL'  // 0-3 days to check-in
  | 'HIGH'      // 4-7 days to check-in
  | 'MEDIUM'    // 8-14 days to check-in
  | 'LOW';      // 15+ days to check-in

export type UrgencyBand = 'red' | 'orange' | 'yellow' | 'green';

export interface UrgencyData {
  level: UrgencyLevel;
  band: UrgencyBand;
  daysUntilCheckIn: number;
  multiplier: number; // 1.0 - 1.5
  requiresAcknowledgment: boolean;
  message: string;
  color: string; // Hex color for UI
  icon: string;  // Emoji or icon identifier
}

// ============================================================================
// PATTERN 3: PRICE ANCHORING - TIER TYPES
// ============================================================================

export type PriceTierId =
  | 'economy'
  | 'standard'
  | 'priority'
  | 'express';

export interface PricingTier {
  id: PriceTierId;
  name: string;
  price: number; // In cents
  speed: string; // e.g., "5-7 days", "48 hours"
  description: string;
  multiplier: number; // Relative to base price
  recommended: boolean;
  acceptanceRate?: number; // Historical data (0-1)
  avgResponseTimeHours?: number;
  features: string[];
  badge?: string | null;
  color: string;
}

export interface PricingContext {
  basePrice: number;
  tiers: PricingTier[];
  selectedTier: PriceTierId;
  urgencyMultiplier: number;
  archetypeMultiplier?: number;
}

// ============================================================================
// PATTERN 4: BS+BS FLEXIBILITY - ELIGIBILITY TYPES
// ============================================================================

export type PairingType =
  | 'weekday_weekend'
  | 'weekend_weekday'
  | 'custom_alternating';

export interface RoommatePair {
  userA: {
    id: string;
    leaseId: string;
    nights: number[];
  };
  userB: {
    id: string;
    leaseId: string;
    nights: number[];
  };
  listingId: string;
  pairingType: PairingType;
  matchScore: number; // 0-100
}

export interface BSBSEligibility {
  eligible: boolean;
  reason: string;
  options: {
    canSplitRequest: boolean;
    canNegotiate: boolean;
  };
  roommateInfo?: {
    id: string;
    leaseId: string;
    nights: number[];
    relationship: string;
    pairingType: PairingType;
  };
}

// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - FEE TYPES
// ============================================================================

export type TransactionType =
  | 'BUYOUT'              // Exclusive use, premium price (3.5x)
  | 'CRASH'               // Shared space (40% of buyout)
  | 'SWAP'                // Exchange nights ($0 + settlement)
  | 'SWAP_WITH_SETTLEMENT'
  | 'STANDARD_CHANGE';    // Regular date change

export interface FeeBreakdown {
  basePrice: number;
  platformFee: number;        // 0.75%
  landlordShare: number;      // 0.75%
  tenantShare: number;        // Total fee (1.5%)
  totalFee: number;           // Sum of platform + landlord
  totalPrice: number;         // Base + total fee
  effectiveRate: number;      // Percentage (1.5)
  savingsVsTraditional: number; // vs 17% markup
  transactionType: TransactionType;
  feeStructure: string;
  calculatedAt: string;
}

export interface FeeStructureConfig {
  platformRate: number;    // 0.0075
  landlordRate: number;    // 0.0075
  totalRate: number;       // 0.015
  traditionalMarkup: number; // 0.17
}

// ============================================================================
// CORE DATA MODELS
// ============================================================================

export interface DateChangeRequest {
  id: string;
  leaseId: string;
  requestorId: string;
  newStartDate?: string;
  newEndDate?: string;
  reason: string;
  status: 'pending' | 'approved' | 'declined' | 'expired';

  // Pattern 1: Archetype
  archetype: UserArchetype;
  archetypeConfidence?: number;

  // Pattern 2: Urgency
  urgencyMultiplier: number;
  urgencyBand: UrgencyBand;
  urgencyLevel?: UrgencyLevel;
  urgencyAcknowledged: boolean;

  // Pattern 3: Pricing Tiers
  selectedTier: PriceTierId;
  tierPrice: number;
  tierSpeed: string;

  // Pattern 4: BS+BS
  isBSBS: boolean;
  bsbsFlexibilityEnabled: boolean;
  roommateId?: string | null;

  // Pattern 5: Fee Transparency
  feeBreakdown: FeeBreakdown;
  transactionType: TransactionType;

  // Snapshots (for confirmation display)
  pricingSnapshot: string; // JSONB stringified
  urgencySnapshot: string; // JSONB stringified

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface Lease {
  id: string;
  listingId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: 'active' | 'pending' | 'cancelled';
  leaseMembers: LeaseMember[];
  proposal?: ProposalData;
}

export interface LeaseMember {
  id: string;
  userId: string;
  role: 'landlord' | 'tenant';
  nights?: number[]; // For alternating schedules
}

export interface ProposalData {
  'Nights Selected (Nights list)': number[];
  'Total Price for Reservation (guest)': number;
  [key: string]: any;
}

export interface UserProfile {
  _id: string;
  email: string;
  fullName?: string;
  archetype?: UserArchetype;
  archetypeCalculatedAt?: string;
  archetypeMetadata?: Record<string, any>;
  bookingHistory?: BookingHistoryItem[];
  dateChangeHistory?: DateChangeRequest[];
}

export interface BookingHistoryItem {
  id: string;
  basePrice: number;
  finalPrice: number;
  date: string;
  listingId: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateRequestParams {
  leaseId: string;
  requestorId: string;
  newStartDate?: string;
  newEndDate?: string;
  reason: string;
  selectedTier?: PriceTierId;
  archetypeOverride?: UserArchetype;
  urgencyAcknowledged?: boolean;
}

export interface CreateRequestResponse {
  data: DateChangeRequest;
  metadata: {
    archetype: UserArchetype;
    urgency: UrgencyData;
    pricingTiers: PricingTier[];
    bsbsEligibility: BSBSEligibility | null;
  };
}

export interface ArchetypeSuggestionResponse {
  archetype: UserArchetype;
  explanation: string;
  confidence: number;
}

export interface UrgencyCalculationResponse {
  urgencyData: UrgencyData;
}

export interface PricingTiersResponse {
  tiers: PricingTier[];
}

export interface BSBSValidationResponse {
  eligibility: BSBSEligibility;
}

export interface RequestDetailsResponse {
  request: DateChangeRequest;
  pricingSnapshot: PricingTier[];
  urgencySnapshot: UrgencyData;
}

// ============================================================================
// ANALYTICS EVENT TYPES
// ============================================================================

export interface AnalyticsEvent {
  eventName: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp: string;
  sessionId?: string;
}

export interface ArchetypeAnalyticsEvent extends AnalyticsEvent {
  eventName: 'archetype_detected' | 'archetype_default_applied';
  properties: {
    archetype: UserArchetype;
    confidence: number;
    defaultPercentage?: number;
    pattern: 'personalized_defaults';
  };
}

export interface UrgencyAnalyticsEvent extends AnalyticsEvent {
  eventName: 'urgency_calculated' | 'urgency_acknowledged';
  properties: {
    urgencyLevel: UrgencyLevel;
    multiplier: number;
    daysUntilCheckin: number;
    pattern: 'urgency_countdown';
  };
}

export interface PricingAnalyticsEvent extends AnalyticsEvent {
  eventName: 'price_tier_viewed' | 'price_tier_selected';
  properties: {
    tierCount?: number;
    tierIds?: PriceTierId[];
    tierId?: PriceTierId;
    price?: number;
    basePrice?: number;
    premiumPercentage?: number;
    pattern: 'price_anchoring';
  };
}

export interface CompetitiveAnalyticsEvent extends AnalyticsEvent {
  eventName: 'competitive_indicator_shown' | 'counter_offer_submitted';
  properties: {
    interestedUsers?: number;
    currentOffer?: number;
    originalOffer?: number;
    counterOffer?: number;
    difference?: number;
    pattern: 'bs_bs_competition';
  };
}

export interface ConfirmationAnalyticsEvent extends AnalyticsEvent {
  eventName: 'confirmation_viewed' | 'date_change_request_submitted';
  properties: {
    archetype: UserArchetype;
    tier: PriceTierId;
    totalPrice: number;
    urgencyLevel: UrgencyLevel;
    requestId?: string;
    patternsUsed: string[];
    pattern: 'fee_transparency';
  };
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

export interface DateChangeRequestState {
  // Form State
  newStartDate: string;
  newEndDate: string;
  reason: string;
  currentStep: number; // 1: Dates, 2: Options, 3: Confirm

  // Pattern 1: Archetype
  archetype: UserArchetype | null;
  archetypeLoading: boolean;
  archetypeExplanation: string;

  // Pattern 2: Urgency
  urgencyData: UrgencyData | null;
  urgencyAcknowledged: boolean;

  // Pattern 3: Pricing
  pricingTiers: PricingTier[];
  selectedTier: PriceTierId;
  pricingLoading: boolean;

  // Pattern 4: BS+BS
  bsbsEligibility: BSBSEligibility | null;
  showBSBSOptions: boolean;
  roommate: RoommatePair['userB'] | null;
  roommateLoading: boolean;

  // Pattern 5: Confirmation
  showConfirmation: boolean;
  confirmationData: ConfirmationData | null;

  // General
  loading: boolean;
  error: string | null;
}

export interface ConfirmationData {
  dates: {
    start: string;
    end: string;
  };
  archetype: UserArchetype;
  urgency: UrgencyData;
  tier: PricingTier;
  bsbs: BSBSEligibility | null;
  reason: string;
  feeBreakdown: FeeBreakdown;
}

// ============================================================================
// A/B TESTING TYPES
// ============================================================================

export interface ABTestVariant {
  id: string;
  value: any;
}

export interface ABTestConfig {
  variants: ABTestVariant[];
}

export type ABTestName =
  | 'archetype_default_big_spender'
  | 'urgency_threshold_critical'
  | 'price_tier_multipliers';

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ErrorRecoveryHandler {
  fallback: any;
  userMessage: string;
  logLevel: 'info' | 'warn' | 'error' | 'critical';
}

export type PatternErrorType =
  | 'archetype_detection'
  | 'urgency_calculation'
  | 'pricing_tiers'
  | 'bsbs_eligibility'
  | 'fee_calculation';

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface DateRange {
  start: Date | string;
  end: Date | string;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// RE-EXPORT COMMON TYPES FOR CONVENIENCE
// ============================================================================

export type {
  UserArchetype,
  UrgencyLevel,
  UrgencyBand,
  PriceTierId,
  TransactionType,
  PairingType
};
