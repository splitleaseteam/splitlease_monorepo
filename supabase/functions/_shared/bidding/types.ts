/**
 * Bidding System Type Definitions
 * Pattern 4: BS+BS Competitive Bidding
 *
 * TypeScript interfaces for the bidding system Edge Functions.
 */

// Session status enum
export type SessionStatus = 'pending' | 'active' | 'completed' | 'expired' | 'cancelled';

// User archetype (required for bidding eligibility)
export type BiddingArchetype = 'big_spender' | 'budget_conscious' | 'balanced';

// Bidding session interface
export interface BiddingSession {
  sessionId: string;
  targetNight: Date;
  propertyId: string;
  listingId?: string;
  status: SessionStatus;
  startedAt?: Date;
  expiresAt?: Date;
  completedAt?: Date;
  maxRounds: number;
  roundDurationSeconds: number;
  minimumIncrementPercent: number;
  currentRound: number;
  currentHighBidId?: string;
  winnerUserId?: string;
  winningBidAmount?: number;
  loserCompensationAmount?: number;
  platformRevenue?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Participant interface
export interface BiddingParticipant {
  participantId: string;
  sessionId: string;
  userId: string;
  userName?: string;
  userArchetype: BiddingArchetype;
  currentBidAmount?: number;
  maxAutoBidAmount?: number;
  lastBidAt?: Date;
  totalBidsPlaced: number;
  isWinner?: boolean;
  compensationAmount?: number;
  joinedAt: Date;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Bid interface
export interface Bid {
  bidId: string;
  sessionId: string;
  userId: string;
  amount: number;
  roundNumber: number;
  isAutoBid: boolean;
  previousHighBid?: number;
  incrementAmount?: number;
  incrementPercent?: number;
  wasValid: boolean;
  validationErrors?: string[];
  placedAt: Date;
  clientIp?: string;
  userAgent?: string;
  createdAt: Date;
}

// Validation result
export interface BidValidationResult {
  valid: boolean;
  errors: string[];
  minimumNextBid: number;
  maximumAllowed: number;
  suggestedBid: number;
}

// Auto-bid result
export interface AutoBidResult {
  autoBidTriggered: boolean;
  autoBid?: Bid;
  reason?: string;
}

// Winner determination result
export interface WinnerResult {
  winner: BiddingParticipant;
  loser: BiddingParticipant;
  winningBid: number;
  loserCompensation: number;
  platformRevenue: number;
}

// Eligibility check result
export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  requiredActions?: string[];
}

// Place bid request
export interface PlaceBidRequest {
  sessionId: string;
  userId: string;
  amount: number;
  isManualBid: boolean;
}

// Place bid response
export interface PlaceBidResponse {
  bid: Bid;
  autoBid?: Bid;
  newHighBidder: { userId: string; amount: number };
}

// Set auto-bid request
export interface SetAutoBidRequest {
  sessionId: string;
  userId: string;
  maxAmount: number;
}

// Withdraw bid request
export interface WithdrawBidRequest {
  sessionId: string;
  userId: string;
  reason?: string;
}

// Notification parameters
export interface NotificationParams {
  sessionId: string;
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  actionUrl?: string;
  channels: ('email' | 'push')[];
}

// Create session request
export interface CreateSessionRequest {
  targetNight: Date | string;
  propertyId: string;
  listingId?: string;
  participantUserIds: [string, string];
  startingBid: number;
  maxRounds?: number;
  roundDurationSeconds?: number;
}

// Database record mappers (snake_case to camelCase)
export interface DatabaseBiddingSession {
  session_id: string;
  target_night: string;
  property_id: string;
  listing_id?: string;
  status: SessionStatus;
  started_at?: string;
  expires_at?: string;
  completed_at?: string;
  max_rounds: number;
  round_duration_seconds: number;
  minimum_increment_percent: string;
  current_round: number;
  current_high_bid_id?: string;
  winner_user_id?: string;
  winning_bid_amount?: string;
  loser_compensation_amount?: string;
  platform_revenue?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBiddingParticipant {
  participant_id: string;
  session_id: string;
  user_id: string;
  user_name?: string;
  user_archetype: BiddingArchetype;
  current_bid_amount?: string;
  max_auto_bid_amount?: string;
  last_bid_at?: string;
  total_bids_placed: number;
  is_winner?: boolean;
  compensation_amount?: string;
  joined_at: string;
  notified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBid {
  bid_id: string;
  session_id: string;
  user_id: string;
  amount: string;
  round_number: number;
  is_auto_bid: boolean;
  previous_high_bid?: string;
  increment_amount?: string;
  increment_percent?: string;
  was_valid: boolean;
  validation_errors?: string[];
  placed_at: string;
  client_ip?: string;
  user_agent?: string;
  created_at: string;
}
