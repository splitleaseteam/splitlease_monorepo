/**
 * =====================================================
 * PATTERN 4: BS+BS COMPETITIVE BIDDING - TYPE DEFINITIONS
 * =====================================================
 * Complete TypeScript type definitions for bidding system
 */

// =====================================================
// ENUMS
// =====================================================

export enum BiddingSessionStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    COMPLETED = 'completed',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled'
}

export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded'
}

export enum NotificationType {
    SESSION_STARTED = 'session_started',
    BID_PLACED = 'bid_placed',
    OUTBID = 'outbid',
    AUTO_BID_TRIGGERED = 'auto_bid_triggered',
    SESSION_ENDING_SOON = 'session_ending_soon',
    SESSION_ENDED = 'session_ended',
    WINNER_ANNOUNCEMENT = 'winner_announcement',
    LOSER_COMPENSATION = 'loser_compensation'
}

export enum NotificationChannel {
    EMAIL = 'email',
    PUSH = 'push',
    SMS = 'sms',
    IN_APP = 'in_app'
}

// =====================================================
// CORE INTERFACES
// =====================================================

/**
 * Bidding Session
 * Represents a competitive bidding session between two Big Spenders
 */
export interface BiddingSession {
    // Identification
    sessionId: string;
    targetNight: Date;
    propertyId: string;
    listingId?: string;

    // Status
    status: BiddingSessionStatus;

    // Timing
    startedAt?: Date;
    expiresAt?: Date;
    completedAt?: Date;

    // Configuration
    maxRounds: number;
    roundDurationSeconds: number;
    minimumIncrementPercent: number;

    // Current state
    currentRound: number;
    currentHighBidId?: string;

    // Winner determination
    winnerUserId?: string;
    winningBidAmount?: number;
    loserCompensationAmount?: number;

    // Financial
    platformRevenue?: number;

    // Audit
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Bidding Participant
 * User participating in a bidding session
 */
export interface BiddingParticipant {
    participantId: string;
    sessionId: string;
    userId: string;

    // User info
    userName: string;
    userArchetype: 'big_spender';

    // Bidding state
    currentBidAmount?: number;
    maxAutoBidAmount?: number;
    lastBidAt?: Date;
    totalBidsPlaced: number;

    // Outcome
    isWinner: boolean;
    compensationAmount: number;

    // Tracking
    joinedAt: Date;
    notifiedAt?: Date;

    // Audit
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Bid
 * Individual bid placed during session
 */
export interface Bid {
    bidId: string;
    sessionId: string;
    userId: string;

    // Bid details
    amount: number;
    roundNumber: number;
    isAutoBid: boolean;

    // Context
    previousHighBid?: number;
    incrementAmount?: number;
    incrementPercent?: number;

    // Validation
    wasValid: boolean;
    validationErrors?: string[];

    // Timing
    placedAt: Date;

    // Metadata
    clientIp?: string;
    userAgent?: string;

    // Audit
    createdAt: Date;
}

/**
 * Bidding Result
 * Final outcome of completed session
 */
export interface BiddingResult {
    resultId: string;
    sessionId: string;

    // Winner
    winnerUserId: string;
    winnerBidAmount: number;
    winnerPaymentStatus: PaymentStatus;
    winnerPaymentIntentId?: string;

    // Loser
    loserUserId: string;
    loserCompensationAmount: number;
    loserCompensationStatus: PaymentStatus;
    loserPayoutId?: string;

    // Platform
    platformRevenue: number;
    platformFeeCollected: boolean;

    // Calendar
    nightAssigned: boolean;
    nightAssignmentDate?: Date;

    // Finalization
    finalizedAt: Date;
    finalizedBy?: string;

    // Metadata
    totalBidsPlaced?: number;
    sessionDurationMinutes?: number;

    // Audit
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Bidding Notification
 * Notification sent to users during bidding
 */
export interface BiddingNotification {
    notificationId: string;
    sessionId: string;
    userId: string;

    // Content
    notificationType: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;

    // Delivery
    channels: NotificationChannel[];
    sentAt?: Date;
    readAt?: Date;

    // Audit
    createdAt: Date;
}

// =====================================================
// REQUEST/RESPONSE TYPES
// =====================================================

/**
 * Create Session Request
 */
export interface CreateBiddingSessionRequest {
    targetNight: Date;
    propertyId: string;
    listingId?: string;
    participantUserIds: [string, string]; // Exactly 2 Big Spenders
    startingBid: number;
    maxRounds?: number;
    roundDurationSeconds?: number;
}

/**
 * Place Bid Request
 */
export interface PlaceBidRequest {
    sessionId: string;
    userId: string;
    amount: number;
    isManualBid: boolean;
}

/**
 * Set Max Auto Bid Request
 */
export interface SetMaxAutoBidRequest {
    sessionId: string;
    userId: string;
    maxAmount: number;
}

/**
 * Bid Validation Result
 */
export interface BidValidationResult {
    valid: boolean;
    errors: string[];
    minimumNextBid: number;
    maximumAllowed: number;
    suggestedBid: number;
}

/**
 * Winner Determination Result
 */
export interface WinnerDeterminationResult {
    winner: BiddingParticipant;
    loser: BiddingParticipant;
    winningBid: number;
    loserCompensation: number;
    platformRevenue: number;
}

/**
 * Auto-Bid Processing Result
 */
export interface AutoBidResult {
    autoBidTriggered: boolean;
    autoBid?: Bid;
    reason?: string;
}

// =====================================================
// REALTIME EVENT TYPES
// =====================================================

/**
 * WebSocket Event: Bid Placed
 */
export interface BidPlacedEvent {
    eventType: 'bid:placed';
    sessionId: string;
    bid: Bid;
    newHighBidder: {
        userId: string;
        userName: string;
    };
    minimumNextBid: number;
}

/**
 * WebSocket Event: Auto-Bid Triggered
 */
export interface AutoBidTriggeredEvent {
    eventType: 'bid:autobid';
    sessionId: string;
    bid: Bid;
    triggeredBy: string; // User who caused auto-bid
}

/**
 * WebSocket Event: Session Ended
 */
export interface SessionEndedEvent {
    eventType: 'session:ended';
    sessionId: string;
    winner: {
        userId: string;
        userName: string;
        bidAmount: number;
    };
    loser: {
        userId: string;
        userName: string;
        compensation: number;
    };
    platformRevenue: number;
}

/**
 * WebSocket Event: Participant Update
 */
export interface ParticipantUpdateEvent {
    eventType: 'participant:update';
    sessionId: string;
    participant: BiddingParticipant;
}

/**
 * WebSocket Event: Time Update
 */
export interface TimeUpdateEvent {
    eventType: 'session:time_update';
    sessionId: string;
    timeRemainingSeconds: number;
    expiresAt: Date;
}

/**
 * Union type for all WebSocket events
 */
export type BiddingWebSocketEvent =
    | BidPlacedEvent
    | AutoBidTriggeredEvent
    | SessionEndedEvent
    | ParticipantUpdateEvent
    | TimeUpdateEvent;

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Session Summary
 * Lightweight session data for listing/dashboards
 */
export interface BiddingSessionSummary {
    sessionId: string;
    targetNight: Date;
    status: BiddingSessionStatus;
    currentHighBid: number;
    participants: Array<{
        userId: string;
        userName: string;
        isLeading: boolean;
    }>;
    timeRemainingSeconds: number;
    expiresAt: Date;
}

/**
 * User Bidding Stats
 * Aggregate stats for a user's bidding activity
 */
export interface UserBiddingStats {
    userId: string;
    totalSessionsParticipated: number;
    totalSessionsWon: number;
    totalSessionsLost: number;
    totalAmountBid: number;
    totalAmountWon: number;
    totalCompensationReceived: number;
    averageBidAmount: number;
    winRate: number; // 0-1
}

/**
 * Session Analytics
 * Detailed analytics for a completed session
 */
export interface SessionAnalytics {
    sessionId: string;
    totalBids: number;
    totalRounds: number;
    sessionDurationMinutes: number;
    winningBid: number;
    startingBid: number;
    priceIncrease: number;
    priceIncreasePercent: number;
    averageBidIncrement: number;
    autoBidsCount: number;
    manualBidsCount: number;
}

// =====================================================
// ERROR TYPES
// =====================================================

export class BiddingError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = 'BiddingError';
    }
}

export class BidValidationError extends BiddingError {
    constructor(message: string, public validationErrors: string[]) {
        super(message, 'BID_VALIDATION_ERROR', 400);
        this.name = 'BidValidationError';
    }
}

export class SessionNotFoundError extends BiddingError {
    constructor(sessionId: string) {
        super(`Session ${sessionId} not found`, 'SESSION_NOT_FOUND', 404);
        this.name = 'SessionNotFoundError';
    }
}

export class SessionExpiredError extends BiddingError {
    constructor(sessionId: string) {
        super(`Session ${sessionId} has expired`, 'SESSION_EXPIRED', 410);
        this.name = 'SessionExpiredError';
    }
}

export class MaxRoundsExceededError extends BiddingError {
    constructor(maxRounds: number) {
        super(`Maximum ${maxRounds} rounds exceeded`, 'MAX_ROUNDS_EXCEEDED', 403);
        this.name = 'MaxRoundsExceededError';
    }
}

export class UnauthorizedBidError extends BiddingError {
    constructor(message: string = 'Not authorized to place bid') {
        super(message, 'UNAUTHORIZED_BID', 403);
        this.name = 'UnauthorizedBidError';
    }
}

// =====================================================
// TYPE GUARDS
// =====================================================

export function isBiddingSession(obj: any): obj is BiddingSession {
    return (
        obj &&
        typeof obj.sessionId === 'string' &&
        obj.targetNight instanceof Date &&
        typeof obj.status === 'string'
    );
}

export function isBid(obj: any): obj is Bid {
    return (
        obj &&
        typeof obj.bidId === 'string' &&
        typeof obj.amount === 'number' &&
        obj.placedAt instanceof Date
    );
}

export function isBiddingParticipant(obj: any): obj is BiddingParticipant {
    return (
        obj &&
        typeof obj.participantId === 'string' &&
        typeof obj.userId === 'string' &&
        typeof obj.sessionId === 'string'
    );
}

// =====================================================
// CONSTANTS
// =====================================================

export const BIDDING_CONSTANTS = {
    DEFAULT_MAX_ROUNDS: 3,
    DEFAULT_ROUND_DURATION_SECONDS: 3600, // 1 hour
    DEFAULT_MINIMUM_INCREMENT_PERCENT: 10.0, // 10%
    LOSER_COMPENSATION_PERCENT: 25.0, // 25%
    MAX_SESSION_DURATION_HOURS: 24,
    MIN_BID_AMOUNT: 100,
    MAX_BID_AMOUNT: 100000,
} as const;

export const BIDDING_RULES = {
    MINIMUM_PARTICIPANTS: 2,
    MAXIMUM_PARTICIPANTS: 2,
    REQUIRED_ARCHETYPE: 'big_spender',
} as const;

// =====================================================
// All types are exported inline above (export interface/type ...)
// =====================================================
