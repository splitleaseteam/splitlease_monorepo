/**
 * =====================================================
 * PATTERN 4: BS+BS COMPETITIVE BIDDING - SERVICE LAYER
 * =====================================================
 * Main service class for managing bidding sessions
 * Orchestrates database operations, validation, and business logic
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
    BiddingSession,
    BiddingParticipant,
    Bid,
    BiddingResult,
    BiddingNotification,
    CreateBiddingSessionRequest,
    PlaceBidRequest,
    SetMaxAutoBidRequest,
    BidValidationResult,
    WinnerDeterminationResult,
    BiddingSessionStatus,
    NotificationType,
    NotificationChannel,
    SessionNotFoundError,
    SessionExpiredError,
    BidValidationError,
    BIDDING_CONSTANTS,
} from '../types/bidding.types';

import {
    validateBid,
    validateBidOrThrow,
    processAutoBid,
    determineWinner,
    isSessionExpired,
    shouldFinalizeSession,
    calculateTimeRemaining,
    checkBiddingEligibility,
    generateSessionId,
    generateBidId,
    calculateExpiresAt,
    calculateBidIncrement,
} from '../utils/biddingLogic';

// =====================================================
// BIDDING SERVICE CLASS
// =====================================================

export class BiddingService {
    constructor(private supabase: SupabaseClient) {}

    // =================================================
    // SESSION MANAGEMENT
    // =================================================

    /**
     * Create a new bidding session
     * Validates eligibility and initializes session with 2 participants
     */
    async createSession(
        request: CreateBiddingSessionRequest
    ): Promise<BiddingSession> {
        const {
            targetNight,
            propertyId,
            listingId,
            participantUserIds,
            startingBid,
            maxRounds = BIDDING_CONSTANTS.DEFAULT_MAX_ROUNDS,
            roundDurationSeconds = BIDDING_CONSTANTS.DEFAULT_ROUND_DURATION_SECONDS,
        } = request;

        // Validate exactly 2 participants
        if (participantUserIds.length !== 2) {
            throw new Error('Bidding session requires exactly 2 participants');
        }

        // Generate session ID
        const sessionId = generateSessionId();

        // Calculate expiration
        const startedAt = new Date();
        const expiresAt = calculateExpiresAt(startedAt, roundDurationSeconds, maxRounds);

        // Create session record
        const { data: session, error: sessionError } = await this.supabase
            .from('bidding_sessions')
            .insert({
                session_id: sessionId,
                target_night: targetNight.toISOString().split('T')[0],
                property_id: propertyId,
                listing_id: listingId,
                status: 'active',
                started_at: startedAt.toISOString(),
                expires_at: expiresAt.toISOString(),
                max_rounds: maxRounds,
                round_duration_seconds: roundDurationSeconds,
                minimum_increment_percent: BIDDING_CONSTANTS.DEFAULT_MINIMUM_INCREMENT_PERCENT,
                current_round: 1,
                winning_bid_amount: startingBid,
            })
            .select()
            .single();

        if (sessionError || !session) {
            throw new Error(`Failed to create session: ${sessionError?.message}`);
        }

        // Create participants
        await Promise.all(
            participantUserIds.map(async (userId) => {
                const { error: participantError } = await this.supabase
                    .from('bidding_participants')
                    .insert({
                        session_id: sessionId,
                        user_id: userId,
                        user_archetype: 'big_spender',
                        total_bids_placed: 0,
                    });

                if (participantError) {
                    throw new Error(`Failed to create participant: ${participantError.message}`);
                }
            })
        );

        // Send notifications to both participants
        await this.notifySessionStarted(sessionId, participantUserIds);

        // Return created session
        return this.mapDatabaseSessionToModel(session);
    }

    /**
     * Get session by ID
     */
    async getSession(sessionId: string): Promise<BiddingSession> {
        const { data: session, error } = await this.supabase
            .from('bidding_sessions')
            .select('*')
            .eq('session_id', sessionId)
            .single();

        if (error || !session) {
            throw new SessionNotFoundError(sessionId);
        }

        return this.mapDatabaseSessionToModel(session);
    }

    /**
     * Get all participants in a session
     */
    async getParticipants(sessionId: string): Promise<BiddingParticipant[]> {
        const { data: participants, error } = await this.supabase
            .from('bidding_participants')
            .select('*')
            .eq('session_id', sessionId);

        if (error) {
            throw new Error(`Failed to get participants: ${error.message}`);
        }

        return (participants || []).map(this.mapDatabaseParticipantToModel);
    }

    /**
     * Get all bids in a session
     */
    async getBidHistory(sessionId: string): Promise<Bid[]> {
        const { data: bids, error } = await this.supabase
            .from('bids')
            .select('*')
            .eq('session_id', sessionId)
            .order('placed_at', { ascending: true });

        if (error) {
            throw new Error(`Failed to get bid history: ${error.message}`);
        }

        return (bids || []).map(this.mapDatabaseBidToModel);
    }

    // =================================================
    // BIDDING ACTIONS
    // =================================================

    /**
     * Place a bid
     * Validates bid, processes auto-bid if triggered, updates session state
     */
    async placeBid(request: PlaceBidRequest): Promise<{
        bid: Bid;
        autoBid?: Bid;
        newHighBidder: { userId: string; amount: number };
    }> {
        const { sessionId, userId, amount, isManualBid } = request;

        // Get current session state
        const session = await this.getSession(sessionId);
        const participants = await this.getParticipants(sessionId);
        const bidHistory = await this.getBidHistory(sessionId);

        // Check if session is active
        if (session.status !== 'active') {
            throw new Error(`Cannot place bid: session is ${session.status}`);
        }

        // Check if session expired
        if (isSessionExpired(session)) {
            await this.expireSession(sessionId);
            throw new SessionExpiredError(sessionId);
        }

        // Validate bid
        validateBidOrThrow(amount, session, userId, bidHistory);

        // Calculate increment
        const previousHighBid = session.winningBidAmount || 0;
        const { amount: incrementAmount, percent: incrementPercent } =
            calculateBidIncrement(amount, previousHighBid);

        // Create bid record
        const bidId = generateBidId();
        const { data: bid, error: bidError } = await this.supabase
            .from('bids')
            .insert({
                bid_id: bidId,
                session_id: sessionId,
                user_id: userId,
                amount,
                round_number: session.currentRound,
                is_auto_bid: !isManualBid,
                previous_high_bid: previousHighBid,
                increment_amount: incrementAmount,
                increment_percent: incrementPercent,
                was_valid: true,
            })
            .select()
            .single();

        if (bidError || !bid) {
            throw new Error(`Failed to place bid: ${bidError?.message}`);
        }

        const placedBid = this.mapDatabaseBidToModel(bid);

        // Update session with new high bid
        await this.supabase
            .from('bidding_sessions')
            .update({
                current_high_bid_id: bidId,
                winner_user_id: userId,
                winning_bid_amount: amount,
                updated_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId);

        // Update participant
        await this.supabase
            .from('bidding_participants')
            .update({
                current_bid_amount: amount,
                last_bid_at: new Date().toISOString(),
                total_bids_placed: this.supabase.sql`total_bids_placed + 1`,
                updated_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId)
            .eq('user_id', userId);

        // Check for auto-bid trigger
        const autoBidResult = processAutoBid(
            { ...session, winningBidAmount: amount, winnerUserId: userId },
            participants,
            placedBid
        );

        let autoBid: Bid | undefined;

        if (autoBidResult.autoBidTriggered && autoBidResult.autoBid) {
            // Process auto-bid recursively
            const autoBidResponse = await this.placeBid({
                sessionId,
                userId: autoBidResult.autoBid.userId,
                amount: autoBidResult.autoBid.amount,
                isManualBid: false,
            });

            autoBid = autoBidResponse.bid;

            // Notify about auto-bid
            await this.notifyAutoBidTriggered(sessionId, autoBid, userId);
        }

        // Notify other participant that they were outbid
        const otherParticipant = participants.find((p) => p.userId !== userId);
        if (otherParticipant && !autoBid) {
            await this.notifyOutbid(sessionId, otherParticipant.userId, amount);
        }

        // Check if session should be finalized
        const updatedBidHistory = await this.getBidHistory(sessionId);
        if (shouldFinalizeSession(session, updatedBidHistory)) {
            await this.finalizeSession(sessionId);
        }

        return {
            bid: placedBid,
            autoBid,
            newHighBidder: { userId, amount },
        };
    }

    /**
     * Set max auto-bid amount for participant
     */
    async setMaxAutoBid(request: SetMaxAutoBidRequest): Promise<void> {
        const { sessionId, userId, maxAmount } = request;

        // Get session to validate
        const session = await this.getSession(sessionId);

        if (session.status !== 'active') {
            throw new Error(`Cannot set auto-bid: session is ${session.status}`);
        }

        // Update participant
        const { error } = await this.supabase
            .from('bidding_participants')
            .update({
                max_auto_bid_amount: maxAmount,
                updated_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId)
            .eq('user_id', userId);

        if (error) {
            throw new Error(`Failed to set max auto-bid: ${error.message}`);
        }
    }

    // =================================================
    // SESSION FINALIZATION
    // =================================================

    /**
     * Finalize a bidding session
     * Determines winner, calculates compensation, creates result record
     */
    async finalizeSession(sessionId: string): Promise<WinnerDeterminationResult> {
        const session = await this.getSession(sessionId);
        const participants = await this.getParticipants(sessionId);

        // Determine winner
        const result = determineWinner(session, participants);

        // Update session status
        await this.supabase
            .from('bidding_sessions')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                loser_compensation_amount: result.loserCompensation,
                platform_revenue: result.platformRevenue,
            })
            .eq('session_id', sessionId);

        // Update participants
        await this.supabase
            .from('bidding_participants')
            .update({
                is_winner: true,
                updated_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId)
            .eq('user_id', result.winner.userId);

        await this.supabase
            .from('bidding_participants')
            .update({
                is_winner: false,
                compensation_amount: result.loserCompensation,
                updated_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId)
            .eq('user_id', result.loser.userId);

        // Get bid history for analytics
        const bidHistory = await this.getBidHistory(sessionId);

        // Create result record
        await this.supabase.from('bidding_results').insert({
            session_id: sessionId,
            winner_user_id: result.winner.userId,
            winner_bid_amount: result.winningBid,
            winner_payment_status: 'pending',
            loser_user_id: result.loser.userId,
            loser_compensation_amount: result.loserCompensation,
            loser_compensation_status: 'pending',
            platform_revenue: result.platformRevenue,
            platform_fee_collected: false,
            night_assigned: false,
            total_bids_placed: bidHistory.length,
        });

        // Send notifications
        await this.notifyWinner(sessionId, result.winner.userId, result.winningBid);
        await this.notifyLoserWithCompensation(
            sessionId,
            result.loser.userId,
            result.loserCompensation
        );

        return result;
    }

    /**
     * Expire a session (time limit reached)
     */
    async expireSession(sessionId: string): Promise<void> {
        await this.supabase
            .from('bidding_sessions')
            .update({
                status: 'expired',
                completed_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId);

        // If there are bids, still finalize with winner
        const bidHistory = await this.getBidHistory(sessionId);
        if (bidHistory.length > 0) {
            await this.finalizeSession(sessionId);
        }
    }

    /**
     * Cancel a session (manual cancellation)
     */
    async cancelSession(sessionId: string, reason?: string): Promise<void> {
        await this.supabase
            .from('bidding_sessions')
            .update({
                status: 'cancelled',
                completed_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId);

        // Notify participants
        const participants = await this.getParticipants(sessionId);
        await Promise.all(
            participants.map((p) =>
                this.sendNotification({
                    sessionId,
                    userId: p.userId,
                    notificationType: NotificationType.SESSION_ENDED,
                    title: 'Bidding Session Cancelled',
                    message: reason || 'The bidding session has been cancelled.',
                    channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
                })
            )
        );
    }

    // =================================================
    // NOTIFICATIONS
    // =================================================

    /**
     * Notify participants that session started
     */
    private async notifySessionStarted(
        sessionId: string,
        userIds: string[]
    ): Promise<void> {
        await Promise.all(
            userIds.map((userId) =>
                this.sendNotification({
                    sessionId,
                    userId,
                    notificationType: NotificationType.SESSION_STARTED,
                    title: 'Competitive Bidding Started',
                    message: 'Your roommate also wants this night! Bidding is now open.',
                    actionUrl: `/bidding/${sessionId}`,
                    channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
                })
            )
        );
    }

    /**
     * Notify user they were outbid
     */
    private async notifyOutbid(
        sessionId: string,
        userId: string,
        newHighBid: number
    ): Promise<void> {
        await this.sendNotification({
            sessionId,
            userId,
            notificationType: NotificationType.OUTBID,
            title: 'You were outbid!',
            message: `New high bid: $${newHighBid.toFixed(2)}. Place a higher bid to win.`,
            actionUrl: `/bidding/${sessionId}`,
            channels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
        });
    }

    /**
     * Notify about auto-bid trigger
     */
    private async notifyAutoBidTriggered(
        sessionId: string,
        autoBid: Bid,
        triggeredByUserId: string
    ): Promise<void> {
        await this.sendNotification({
            sessionId,
            userId: autoBid.userId,
            notificationType: NotificationType.AUTO_BID_TRIGGERED,
            title: 'Auto-bid Placed',
            message: `Your auto-bid placed a bid of $${autoBid.amount.toFixed(2)}.`,
            actionUrl: `/bidding/${sessionId}`,
            channels: [NotificationChannel.PUSH],
        });
    }

    /**
     * Notify winner
     */
    private async notifyWinner(
        sessionId: string,
        userId: string,
        winningBid: number
    ): Promise<void> {
        await this.sendNotification({
            sessionId,
            userId,
            notificationType: NotificationType.WINNER_ANNOUNCEMENT,
            title: 'You won the bidding!',
            message: `Congratulations! You won with a bid of $${winningBid.toFixed(2)}.`,
            actionUrl: `/bidding/${sessionId}/result`,
            channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
        });
    }

    /**
     * Notify loser with compensation info
     */
    private async notifyLoserWithCompensation(
        sessionId: string,
        userId: string,
        compensation: number
    ): Promise<void> {
        await this.sendNotification({
            sessionId,
            userId,
            notificationType: NotificationType.LOSER_COMPENSATION,
            title: 'Bidding Ended - Compensation Awarded',
            message: `You received $${compensation.toFixed(2)} compensation (25% of winning bid).`,
            actionUrl: `/bidding/${sessionId}/result`,
            channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
        });
    }

    /**
     * Send notification (generic)
     */
    private async sendNotification(params: {
        sessionId: string;
        userId: string;
        notificationType: NotificationType;
        title: string;
        message: string;
        actionUrl?: string;
        channels: NotificationChannel[];
    }): Promise<void> {
        const { error } = await this.supabase.from('bidding_notifications').insert({
            session_id: params.sessionId,
            user_id: params.userId,
            notification_type: params.notificationType,
            title: params.title,
            message: params.message,
            action_url: params.actionUrl,
            channels: params.channels,
            sent_at: new Date().toISOString(),
        });

        if (error) {
            console.error('Failed to create notification:', error);
        }
    }

    // =================================================
    // MAPPING HELPERS
    // =================================================

    private mapDatabaseSessionToModel(dbSession: any): BiddingSession {
        return {
            sessionId: dbSession.session_id,
            targetNight: new Date(dbSession.target_night),
            propertyId: dbSession.property_id,
            listingId: dbSession.listing_id,
            status: dbSession.status as BiddingSessionStatus,
            startedAt: dbSession.started_at ? new Date(dbSession.started_at) : undefined,
            expiresAt: dbSession.expires_at ? new Date(dbSession.expires_at) : undefined,
            completedAt: dbSession.completed_at ? new Date(dbSession.completed_at) : undefined,
            maxRounds: dbSession.max_rounds,
            roundDurationSeconds: dbSession.round_duration_seconds,
            minimumIncrementPercent: parseFloat(dbSession.minimum_increment_percent),
            currentRound: dbSession.current_round,
            currentHighBidId: dbSession.current_high_bid_id,
            winnerUserId: dbSession.winner_user_id,
            winningBidAmount: dbSession.winning_bid_amount
                ? parseFloat(dbSession.winning_bid_amount)
                : undefined,
            loserCompensationAmount: dbSession.loser_compensation_amount
                ? parseFloat(dbSession.loser_compensation_amount)
                : undefined,
            platformRevenue: dbSession.platform_revenue
                ? parseFloat(dbSession.platform_revenue)
                : undefined,
            createdAt: new Date(dbSession.created_at),
            updatedAt: new Date(dbSession.updated_at),
        };
    }

    private mapDatabaseParticipantToModel(dbParticipant: any): BiddingParticipant {
        return {
            participantId: dbParticipant.participant_id,
            sessionId: dbParticipant.session_id,
            userId: dbParticipant.user_id,
            userName: dbParticipant.user_name || '',
            userArchetype: 'big_spender',
            currentBidAmount: dbParticipant.current_bid_amount
                ? parseFloat(dbParticipant.current_bid_amount)
                : undefined,
            maxAutoBidAmount: dbParticipant.max_auto_bid_amount
                ? parseFloat(dbParticipant.max_auto_bid_amount)
                : undefined,
            lastBidAt: dbParticipant.last_bid_at
                ? new Date(dbParticipant.last_bid_at)
                : undefined,
            totalBidsPlaced: dbParticipant.total_bids_placed,
            isWinner: dbParticipant.is_winner,
            compensationAmount: dbParticipant.compensation_amount
                ? parseFloat(dbParticipant.compensation_amount)
                : 0,
            joinedAt: new Date(dbParticipant.joined_at),
            notifiedAt: dbParticipant.notified_at
                ? new Date(dbParticipant.notified_at)
                : undefined,
            createdAt: new Date(dbParticipant.created_at),
            updatedAt: new Date(dbParticipant.updated_at),
        };
    }

    private mapDatabaseBidToModel(dbBid: any): Bid {
        return {
            bidId: dbBid.bid_id,
            sessionId: dbBid.session_id,
            userId: dbBid.user_id,
            amount: parseFloat(dbBid.amount),
            roundNumber: dbBid.round_number,
            isAutoBid: dbBid.is_auto_bid,
            previousHighBid: dbBid.previous_high_bid
                ? parseFloat(dbBid.previous_high_bid)
                : undefined,
            incrementAmount: dbBid.increment_amount
                ? parseFloat(dbBid.increment_amount)
                : undefined,
            incrementPercent: dbBid.increment_percent
                ? parseFloat(dbBid.increment_percent)
                : undefined,
            wasValid: dbBid.was_valid,
            validationErrors: dbBid.validation_errors,
            placedAt: new Date(dbBid.placed_at),
            clientIp: dbBid.client_ip,
            userAgent: dbBid.user_agent,
            createdAt: new Date(dbBid.created_at),
        };
    }
}

// =====================================================
// EXPORT
// =====================================================

export default BiddingService;
