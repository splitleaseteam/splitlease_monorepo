/**
 * BIDDING TYPE DEFINITIONS
 *
 * TypeScript type definitions for Pattern 4 competitive bidding system.
 *
 * @version 1.0.0
 */

/**
 * Bidding session status
 */
export type BiddingStatus = 'active' | 'completed' | 'expired' | 'cancelled';

/**
 * User archetype (only Big Spenders participate in BS+BS)
 */
export type UserArchetype = 'big_spender';

/**
 * Main bidding session
 */
export interface BiddingSession {
  sessionId: string;
  targetNight: Date;
  propertyId: string;
  participants: BiddingParticipant[];
  currentHighBid: Bid | null;
  biddingHistory: Bid[];
  status: BiddingStatus;
  startedAt: Date;
  expiresAt: Date;
  maxRounds: number; // 3 from simulation
  roundDuration: number; // 1 hour per round (3600 seconds)
  minimumIncrement: number; // 10% of current bid
  metadata?: SessionMetadata;
}

/**
 * Bidding participant (user in session)
 */
export interface BiddingParticipant {
  userId: string;
  name: string;
  archetype: UserArchetype;
  currentBid: number | null;
  maxAutoBid: number | null; // Auto-bidding ceiling
  lastBidAt: Date | null;
  isWinner: boolean;
  compensation: number; // If lost, 25% of winning bid
  metadata?: ParticipantMetadata;
}

/**
 * Individual bid
 */
export interface Bid {
  bidId: string;
  userId: string;
  userName: string;
  amount: number;
  timestamp: Date;
  isAutoBid: boolean; // True if triggered by auto-bid
  round: number; // 1, 2, or 3
  metadata?: BidMetadata;
}

/**
 * Session metadata (optional context)
 */
export interface SessionMetadata {
  originalRequestId?: string;
  initiatorUserId?: string;
  basePrice?: number;
  urgencyMultiplier?: number;
  crashOptionPrice?: number;
  landlordId?: string;
  listingId?: string;
}

/**
 * Participant metadata
 */
export interface ParticipantMetadata {
  spendingScore?: number;
  historicalBids?: number;
  averageBidAmount?: number;
  competitivenessScore?: number;
}

/**
 * Bid metadata
 */
export interface BidMetadata {
  previousBid?: number;
  incrementPercentage?: number;
  triggeredByBid?: string; // If auto-bid, which bid triggered it
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Bid validation result
 */
export interface BidValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  minimumNextBid: number;
  maximumAllowed: number;
  suggestedBid: number;
}

/**
 * Session result (after completion)
 */
export interface SessionResult {
  sessionId: string;
  winner: BiddingParticipant;
  loser: BiddingParticipant;
  winningBid: number;
  loserCompensation: number;
  platformRevenue: number;
  totalRounds: number;
  sessionDuration: number; // minutes
  finalizedAt: Date;
}

/**
 * WebSocket event types
 */
export interface BidPlacedEvent {
  bid: Bid;
  session: BiddingSession;
  triggeredAutoBid?: Bid;
}

export interface AutoBidEvent {
  bid: Bid;
  triggeredBy: string;
  session: BiddingSession;
}

export interface SessionEndedEvent {
  sessionId: string;
  winner: string;
  loser: string;
  winningBid: number;
  compensation: number;
  session: BiddingSession;
  result: SessionResult;
}

export interface ParticipantUpdateEvent {
  participant: BiddingParticipant;
  changeType: 'bid_placed' | 'auto_bid_set' | 'status_changed';
}

export interface SessionErrorEvent {
  code: string;
  message: string;
  sessionId: string;
  userId?: string;
}

/**
 * API request types
 */
export interface PlaceBidRequest {
  sessionId: string;
  userId: string;
  amount: number;
  timestamp: Date;
}

export interface SetAutoBidRequest {
  sessionId: string;
  userId: string;
  maxAmount: number;
}

export interface WithdrawBidRequest {
  sessionId: string;
  userId: string;
}

/**
 * API response types
 */
export interface BidResponse {
  success: boolean;
  bid?: Bid;
  session?: BiddingSession;
  error?: string;
  triggeredAutoBid?: Bid;
}

export interface SessionResponse {
  success: boolean;
  session?: BiddingSession;
  error?: string;
}

export interface ValidationResponse {
  valid: boolean;
  validation: BidValidationResult;
}

/**
 * UI state types
 */
export type BiddingView = 'intro' | 'bidding' | 'winner_announcement';

export interface UserPreferences {
  autoEnableAutoBid: boolean;
  defaultAutoBidPercentage: number;
  showQuickBids: boolean;
  enableNotifications: boolean;
  soundEnabled: boolean;
}

/**
 * Analytics event types
 */
export interface BiddingAnalyticsEvent {
  eventName: string;
  sessionId: string;
  userId: string;
  timestamp: Date;
  properties: Record<string, any>;
}

export interface BidPlacedAnalytics extends BiddingAnalyticsEvent {
  eventName: 'bid_placed';
  properties: {
    bidAmount: number;
    isAutoBid: boolean;
    round: number;
    previousHighBid: number;
    increment: number;
    incrementPercentage: number;
  };
}

export interface SessionEndedAnalytics extends BiddingAnalyticsEvent {
  eventName: 'competitive_bidding_ended';
  properties: {
    winner: string;
    loser: string;
    winningBid: number;
    compensation: number;
    platformRevenue: number;
    totalRounds: number;
    sessionDuration: number;
  };
}

/**
 * Type guards
 */
export function isBid(obj: any): obj is Bid {
  return (
    obj &&
    typeof obj.bidId === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.amount === 'number'
  );
}

export function isBiddingSession(obj: any): obj is BiddingSession {
  return (
    obj &&
    typeof obj.sessionId === 'string' &&
    Array.isArray(obj.participants) &&
    Array.isArray(obj.biddingHistory)
  );
}

export function isBiddingParticipant(obj: any): obj is BiddingParticipant {
  return (
    obj &&
    typeof obj.userId === 'string' &&
    typeof obj.name === 'string' &&
    obj.archetype === 'big_spender'
  );
}

export default {
  isBid,
  isBiddingSession,
  isBiddingParticipant
};
