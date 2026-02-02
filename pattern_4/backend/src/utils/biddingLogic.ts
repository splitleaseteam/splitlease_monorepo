/**
 * =====================================================
 * PATTERN 4: BS+BS COMPETITIVE BIDDING - CORE LOGIC
 * =====================================================
 * Core bidding validation, auto-bid, and winner determination logic
 */

import {
    BiddingSession,
    BiddingParticipant,
    Bid,
    BidValidationResult,
    WinnerDeterminationResult,
    AutoBidResult,
    BidValidationError,
    SessionExpiredError,
    MaxRoundsExceededError,
    UnauthorizedBidError,
    BIDDING_CONSTANTS,
} from '../types/bidding.types.ts';

// =====================================================
// BID VALIDATION
// =====================================================

/**
 * Validate a new bid against session rules
 *
 * Rules enforced:
 * 1. Bid must exceed current high by minimum increment (10%)
 * 2. Cannot bid on own high bid
 * 3. Session must be active
 * 4. Within max rounds limit per user
 * 5. Reasonable maximum (configurable)
 *
 * @param proposedBid - Amount being bid
 * @param session - Current session state
 * @param userId - User placing bid
 * @param bidHistory - All bids in session
 * @returns Validation result with errors if invalid
 */
export function validateBid(
    proposedBid: number,
    session: BiddingSession,
    userId: string,
    bidHistory: Bid[]
): BidValidationResult {
    const errors: string[] = [];

    // Get current high bid
    const currentHigh = session.winningBidAmount || 0;

    // Calculate minimum increment
    const minimumIncrementPercent = session.minimumIncrementPercent || BIDDING_CONSTANTS.DEFAULT_MINIMUM_INCREMENT_PERCENT;
    const minimumIncrement = Math.round(currentHigh * (minimumIncrementPercent / 100));
    const minimumNextBid = currentHigh + minimumIncrement;

    // Rule 1: Must exceed current high bid by minimum increment
    if (proposedBid <= currentHigh) {
        errors.push(`Bid must exceed current high bid ($${formatCurrency(currentHigh)})`);
    }

    if (proposedBid < minimumNextBid) {
        errors.push(
            `Minimum bid is $${formatCurrency(minimumNextBid)} ` +
            `(${minimumIncrementPercent}% increment required)`
        );
    }

    // Rule 2: Cannot bid on own high bid
    if (session.winnerUserId === userId) {
        errors.push('You already have the high bid');
    }

    // Rule 3: Session must be active
    if (session.status !== 'active') {
        errors.push(`Bidding session has ${session.status} status`);
    }

    // Check if session expired
    if (session.expiresAt && new Date() > session.expiresAt) {
        errors.push('Bidding session has expired');
    }

    // Rule 4: Within max rounds per user
    const userBids = bidHistory.filter((b) => b.userId === userId);
    const maxRounds = session.maxRounds || BIDDING_CONSTANTS.DEFAULT_MAX_ROUNDS;

    if (userBids.length >= maxRounds) {
        errors.push(`Maximum ${maxRounds} bids per user reached`);
    }

    // Rule 5: Reasonable maximum (2x current high)
    const maximumAllowed = currentHigh > 0 ? currentHigh * 2 : BIDDING_CONSTANTS.MAX_BID_AMOUNT;
    if (proposedBid > maximumAllowed) {
        errors.push(`Bid cannot exceed $${formatCurrency(maximumAllowed)}`);
    }

    // Additional validation: Minimum bid amount
    if (proposedBid < BIDDING_CONSTANTS.MIN_BID_AMOUNT) {
        errors.push(`Bid must be at least $${BIDDING_CONSTANTS.MIN_BID_AMOUNT}`);
    }

    // Suggested bid (current + 15% as recommendation)
    const suggestedBid = Math.round(currentHigh * 1.15);

    return {
        valid: errors.length === 0,
        errors,
        minimumNextBid,
        maximumAllowed,
        suggestedBid: Math.max(suggestedBid, minimumNextBid),
    };
}

/**
 * Validate bid and throw if invalid
 * Convenience wrapper for validateBid that throws exceptions
 */
export function validateBidOrThrow(
    proposedBid: number,
    session: BiddingSession,
    userId: string,
    bidHistory: Bid[]
): void {
    const validation = validateBid(proposedBid, session, userId, bidHistory);

    if (!validation.valid) {
        throw new BidValidationError(
            'Bid validation failed: ' + validation.errors.join(', '),
            validation.errors
        );
    }
}

// =====================================================
// AUTO-BID LOGIC (eBay-style proxy bidding)
// =====================================================

/**
 * Process auto-bid after a manual bid is placed
 *
 * If the other participant has set a maxAutoBid and the new bid
 * is below their max, automatically counter-bid up to their max.
 *
 * @param session - Current session
 * @param participants - Session participants
 * @param newBid - Bid that was just placed
 * @returns Auto-bid result (null if no auto-bid triggered)
 */
export function processAutoBid(
    session: BiddingSession,
    participants: BiddingParticipant[],
    newBid: Bid
): AutoBidResult {
    // Find the other participant (not the one who just bid)
    const otherParticipant = participants.find((p) => p.userId !== newBid.userId);

    if (!otherParticipant) {
        return {
            autoBidTriggered: false,
            reason: 'No other participant found',
        };
    }

    // Check if other participant has auto-bid enabled
    if (!otherParticipant.maxAutoBidAmount) {
        return {
            autoBidTriggered: false,
            reason: 'Other participant has not set max auto-bid',
        };
    }

    // If new bid is below their max, auto-counter
    if (newBid.amount < otherParticipant.maxAutoBidAmount) {
        // Calculate auto-bid amount (new bid + minimum increment)
        const minimumIncrementPercent = session.minimumIncrementPercent || BIDDING_CONSTANTS.DEFAULT_MINIMUM_INCREMENT_PERCENT;
        const minimumIncrement = Math.round(newBid.amount * (minimumIncrementPercent / 100));

        // Don't exceed their maximum
        const autoBidAmount = Math.min(
            newBid.amount + minimumIncrement,
            otherParticipant.maxAutoBidAmount
        );

        // Create auto-bid
        const autoBid: Bid = {
            bidId: generateBidId(),
            sessionId: session.sessionId,
            userId: otherParticipant.userId,
            amount: autoBidAmount,
            roundNumber: session.currentRound,
            isAutoBid: true,
            previousHighBid: newBid.amount,
            incrementAmount: autoBidAmount - newBid.amount,
            incrementPercent: ((autoBidAmount - newBid.amount) / newBid.amount) * 100,
            wasValid: true,
            placedAt: new Date(),
            createdAt: new Date(),
        };

        return {
            autoBidTriggered: true,
            autoBid,
            reason: `Auto-bid to $${formatCurrency(autoBidAmount)} (max: $${formatCurrency(otherParticipant.maxAutoBidAmount)})`,
        };
    }

    // New bid exceeded their max, no auto-bid
    return {
        autoBidTriggered: false,
        reason: `New bid ($${formatCurrency(newBid.amount)}) exceeds max auto-bid ($${formatCurrency(otherParticipant.maxAutoBidAmount)})`,
    };
}

// =====================================================
// WINNER DETERMINATION
// =====================================================

/**
 * Determine winner and calculate final amounts
 *
 * Winner: User with highest bid
 * Loser: Other participant
 * Compensation: 25% of winning bid to loser
 * Platform Revenue: Winning bid - compensation
 *
 * @param session - Completed session
 * @param participants - Session participants
 * @returns Winner determination result
 */
export function determineWinner(
    session: BiddingSession,
    participants: BiddingParticipant[]
): WinnerDeterminationResult {
    if (!session.winnerUserId || !session.winningBidAmount) {
        throw new Error('Cannot determine winner: No bids in session');
    }

    if (participants.length !== 2) {
        throw new Error('Cannot determine winner: Must have exactly 2 participants');
    }

    // Find winner and loser
    const winner = participants.find((p) => p.userId === session.winnerUserId);
    const loser = participants.find((p) => p.userId !== session.winnerUserId);

    if (!winner || !loser) {
        throw new Error('Cannot find winner/loser in participants');
    }

    // Calculate amounts
    const winningBid = session.winningBidAmount;
    const loserCompensation = calculateLoserCompensation(winningBid);
    const platformRevenue = winningBid - loserCompensation;

    return {
        winner,
        loser,
        winningBid,
        loserCompensation,
        platformRevenue,
    };
}

/**
 * Calculate loser compensation (25% of winning bid)
 */
export function calculateLoserCompensation(winningBid: number): number {
    const compensationPercent = BIDDING_CONSTANTS.LOSER_COMPENSATION_PERCENT;
    return Math.round(winningBid * (compensationPercent / 100));
}

// =====================================================
// SESSION STATE CHECKS
// =====================================================

/**
 * Check if session has expired
 */
export function isSessionExpired(session: BiddingSession): boolean {
    if (!session.expiresAt) return false;
    return new Date() > session.expiresAt;
}

/**
 * Check if session should be finalized
 * (active and expired, or max rounds reached)
 */
export function shouldFinalizeSession(session: BiddingSession, bidHistory: Bid[]): boolean {
    if (session.status !== 'active') return false;

    // Check expiration
    if (isSessionExpired(session)) return true;

    // Check if both users have reached max rounds
    const maxRounds = session.maxRounds || BIDDING_CONSTANTS.DEFAULT_MAX_ROUNDS;
    const userBidCounts = new Map<string, number>();

    bidHistory.forEach((bid) => {
        const count = userBidCounts.get(bid.userId) || 0;
        userBidCounts.set(bid.userId, count + 1);
    });

    // If both users have bid max rounds, finalize
    const allReachedMax = Array.from(userBidCounts.values()).every(
        (count) => count >= maxRounds
    );

    return allReachedMax;
}

/**
 * Calculate time remaining in session
 */
export function calculateTimeRemaining(session: BiddingSession): number {
    if (!session.expiresAt) return 0;

    const now = new Date();
    const expiresAt = session.expiresAt;

    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    return remainingSeconds;
}

// =====================================================
// ELIGIBILITY CHECKS
// =====================================================

/**
 * Check if competitive bidding should be enabled
 * Both users must be Big Spenders wanting the same night
 */
export interface BiddingEligibilityCheck {
    eligible: boolean;
    reason?: string;
    requiredActions?: string[];
}

export function checkBiddingEligibility(
    requester: { userId: string; archetype: string },
    roommate: { userId: string; archetype: string },
    targetNight: Date
): BiddingEligibilityCheck {
    // Both must be Big Spenders
    if (requester.archetype !== 'big_spender' || roommate.archetype !== 'big_spender') {
        return {
            eligible: false,
            reason: 'Both users must be Big Spenders to enable competitive bidding',
        };
    }

    // Must be within reasonable timeframe (e.g., 30 days)
    const daysUntil = Math.floor(
        (targetNight.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil > 30) {
        return {
            eligible: false,
            reason: 'Target night must be within 30 days',
        };
    }

    if (daysUntil < 0) {
        return {
            eligible: false,
            reason: 'Target night is in the past',
        };
    }

    return {
        eligible: true,
    };
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate unique bid ID
 */
export function generateBidId(): string {
    return `bid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Calculate increment between two bids
 */
export function calculateBidIncrement(
    newBid: number,
    previousBid: number
): { amount: number; percent: number } {
    const amount = newBid - previousBid;
    const percent = (amount / previousBid) * 100;

    return {
        amount: Math.round(amount),
        percent: Math.round(percent * 100) / 100, // 2 decimal places
    };
}

/**
 * Get user's current position in bidding (1st or 2nd)
 */
export function getUserBidPosition(
    userId: string,
    session: BiddingSession,
    participants: BiddingParticipant[]
): 1 | 2 {
    if (session.winnerUserId === userId) {
        return 1; // Leading
    }
    return 2; // Not leading
}

/**
 * Calculate session expiration time
 */
export function calculateExpiresAt(
    startedAt: Date,
    roundDurationSeconds: number,
    maxRounds: number
): Date {
    const totalDurationSeconds = roundDurationSeconds * maxRounds;
    const expiresAt = new Date(startedAt.getTime() + totalDurationSeconds * 1000);
    return expiresAt;
}

// =====================================================
// BID HISTORY ANALYSIS
// =====================================================

/**
 * Analyze bid history for insights
 */
export interface BidHistoryAnalysis {
    totalBids: number;
    manualBids: number;
    autoBids: number;
    averageIncrement: number;
    largestIncrement: number;
    smallestIncrement: number;
    totalPriceIncrease: number;
    priceIncreasePercent: number;
}

export function analyzeBidHistory(
    bidHistory: Bid[],
    startingBid: number
): BidHistoryAnalysis {
    const totalBids = bidHistory.length;
    const manualBids = bidHistory.filter((b) => !b.isAutoBid).length;
    const autoBids = bidHistory.filter((b) => b.isAutoBid).length;

    const increments = bidHistory
        .filter((b) => b.incrementAmount !== undefined)
        .map((b) => b.incrementAmount!);

    const averageIncrement = increments.length > 0
        ? increments.reduce((sum, inc) => sum + inc, 0) / increments.length
        : 0;

    const largestIncrement = increments.length > 0 ? Math.max(...increments) : 0;
    const smallestIncrement = increments.length > 0 ? Math.min(...increments) : 0;

    const finalBid = bidHistory.length > 0
        ? bidHistory[bidHistory.length - 1].amount
        : startingBid;

    const totalPriceIncrease = finalBid - startingBid;
    const priceIncreasePercent = (totalPriceIncrease / startingBid) * 100;

    return {
        totalBids,
        manualBids,
        autoBids,
        averageIncrement: Math.round(averageIncrement),
        largestIncrement,
        smallestIncrement,
        totalPriceIncrease,
        priceIncreasePercent: Math.round(priceIncreasePercent * 100) / 100,
    };
}

// =====================================================
// EXPORT ALL
// =====================================================
// All functions are exported inline above (export function ...)
// =====================================================
