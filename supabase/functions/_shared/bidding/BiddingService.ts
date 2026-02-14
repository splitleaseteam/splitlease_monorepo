/**
 * BiddingService - Main Service Class
 * Pattern 4: BS+BS Competitive Bidding
 *
 * Orchestrates database operations, validation, and business logic for bidding sessions.
 *
 * Business Rules Enforced:
 * - Minimum bid increment: 10% above previous bid
 * - Maximum rounds per session: 3
 * - Loser compensation: 25% of winning bid
 * - Exactly 2 participants per session (both Big Spenders)
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type {
  BiddingSession,
  BiddingParticipant,
  Bid,
  PlaceBidRequest,
  PlaceBidResponse,
  CreateSessionRequest,
  NotificationParams,
  DatabaseBiddingSession,
  DatabaseBiddingParticipant,
  DatabaseBid,
  WinnerResult,
} from './types.ts';
import {
  validateBid,
  processAutoBid,
  determineWinner,
  calculateBidIncrement,
  BIDDING_CONSTANTS,
  generateSessionId,
  generateBidId,
  calculateExpiresAt,
} from '@splitlease/bidding-logic';
import { isSessionExpired } from './rules/isSessionExpired.ts';
import { shouldFinalizeSession } from './rules/shouldFinalizeSession.ts';

export class BiddingService {
  private supabase: SupabaseClient;

  /**
   * Create a BiddingService instance.
   * @param supabase - Supabase client instance
   */
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // =================================================
  // SESSION MANAGEMENT
  // =================================================

  /**
   * Create a new bidding session.
   * Validates eligibility and initializes session with 2 participants.
   */
  async createSession(request: CreateSessionRequest): Promise<BiddingSession> {
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

    // Format target night as date string
    const targetNightStr = targetNight instanceof Date
      ? targetNight.toISOString().split('T')[0]
      : targetNight;

    // Create session record
    const { data: session, error: sessionError } = await this.supabase
      .from('bidding_sessions')
      .insert({
        session_id: sessionId,
        target_night: targetNightStr,
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
      console.error('[BiddingService] Session creation error:', sessionError);
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
          console.error('[BiddingService] Participant creation error:', participantError);
          throw new Error(`Failed to create participant: ${participantError.message}`);
        }
      })
    );

    // Send notifications to both participants
    await this._notifySessionStarted(sessionId, participantUserIds);

    // Return created session
    return this._mapDatabaseSessionToModel(session);
  }

  /**
   * Get session by ID.
   */
  async getSession(sessionId: string): Promise<BiddingSession> {
    const { data: session, error } = await this.supabase
      .from('bidding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return this._mapDatabaseSessionToModel(session);
  }

  /**
   * Get all participants in a session.
   */
  async getParticipants(sessionId: string): Promise<BiddingParticipant[]> {
    const { data: participants, error } = await this.supabase
      .from('bidding_participants')
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      throw new Error(`Failed to get participants: ${error.message}`);
    }

    return (participants || []).map((p: DatabaseBiddingParticipant) =>
      this._mapDatabaseParticipantToModel(p)
    );
  }

  /**
   * Get all bids in a session.
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

    return (bids || []).map((b: DatabaseBid) => this._mapDatabaseBidToModel(b));
  }

  // =================================================
  // BIDDING ACTIONS
  // =================================================

  /**
   * Place a bid.
   * Validates bid, processes auto-bid if triggered, updates session state.
   */
  async placeBid(request: PlaceBidRequest): Promise<PlaceBidResponse> {
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
      throw new Error(`Session ${sessionId} has expired`);
    }

    // Validate bid using logic module
        const validation = validateBid({
      proposedBid: amount,
      session,
      userId,
      bidHistory,
    });

    if (!validation.valid) {
      throw new Error(`Bid validation failed: ${validation.errors.join(', ')}`);
    }

    // Calculate increment
    const previousHighBid = session.winningBidAmount || 0;
    const { amount: incrementAmount, percent: incrementPercent } =
      calculateBidIncrement({ newBid: amount, previousBid: previousHighBid });

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
      console.error('[BiddingService] Bid creation error:', bidError);
      throw new Error(`Failed to place bid: ${bidError?.message}`);
    }

    const placedBid = this._mapDatabaseBidToModel(bid);

    // Update session with new high bid
    const { error: sessionUpdateError } = await this.supabase
      .from('bidding_sessions')
      .update({
        current_high_bid_id: bidId,
        winner_user_id: userId,
        winning_bid_amount: amount,
      })
      .eq('session_id', sessionId);

    if (sessionUpdateError) {
      console.error('[BiddingService] Session update error:', sessionUpdateError);
    }

    // Update participant bid count
    const participant = participants.find(p => p.userId === userId);
    if (participant) {
      const { error: participantUpdateError } = await this.supabase
        .from('bidding_participants')
        .update({
          current_bid_amount: amount,
          last_bid_at: new Date().toISOString(),
          total_bids_placed: (participant.totalBidsPlaced || 0) + 1,
        })
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (participantUpdateError) {
        console.error('[BiddingService] Participant update error:', participantUpdateError);
      }
    }

    // Check for auto-bid trigger
    const updatedSession = { ...session, winningBidAmount: amount, winnerUserId: userId };
    const autoBidResult = processAutoBid({
      session: updatedSession,
      participants,
      newBid: placedBid,
    });

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
      await this._notifyAutoBidTriggered(sessionId, autoBid, userId);
    }

    // Notify other participant that they were outbid
    const otherParticipant = participants.find((p) => p.userId !== userId);
    if (otherParticipant && !autoBid) {
      await this._notifyOutbid(sessionId, otherParticipant.userId, amount);
    }

    // Check if session should be finalized
    const updatedBidHistory = await this.getBidHistory(sessionId);
    if (shouldFinalizeSession(updatedSession, updatedBidHistory)) {
      await this.finalizeSession(sessionId);
    }

    return {
      bid: placedBid,
      autoBid,
      newHighBidder: { userId, amount },
    };
  }

  /**
   * Set max auto-bid amount for participant.
   */
  async setMaxAutoBid(sessionId: string, userId: string, maxAmount: number): Promise<void> {
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
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to set max auto-bid: ${error.message}`);
    }
  }

  /**
   * Clear auto-bid for participant.
   */
  async clearAutoBid(sessionId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('bidding_participants')
      .update({
        max_auto_bid_amount: null,
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to clear auto-bid: ${error.message}`);
    }
  }

  /**
   * Get current auto-bid settings for participant.
   */
  async getAutoBidSettings(sessionId: string, userId: string): Promise<{ maxAutoBidAmount: number | null }> {
    const { data, error } = await this.supabase
      .from('bidding_participants')
      .select('max_auto_bid_amount')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get auto-bid settings: ${error.message}`);
    }

    return {
      maxAutoBidAmount: data?.max_auto_bid_amount ? parseFloat(data.max_auto_bid_amount) : null,
    };
  }

  /**
   * Withdraw from a bidding session.
   */
  async withdrawFromSession(sessionId: string, userId: string, reason?: string): Promise<void> {
    const session = await this.getSession(sessionId);

    // Can only withdraw from active sessions
    if (session.status !== 'active') {
      throw new Error(`Cannot withdraw: session is ${session.status}`);
    }

    // Check if user is current high bidder
    if (session.winnerUserId === userId) {
      throw new Error('Cannot withdraw while holding the high bid');
    }

    // Mark participant as withdrawn (set auto-bid to 0)
    const { error } = await this.supabase
      .from('bidding_participants')
      .update({
        max_auto_bid_amount: 0,
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to withdraw: ${error.message}`);
    }

    // If one user withdraws, finalize the session (other user wins)
    await this.finalizeSession(sessionId);

    // Send notification about withdrawal
    await this._sendNotification({
      sessionId,
      userId,
      notificationType: 'withdrawal',
      title: 'Withdrawal Confirmed',
      message: reason || 'You have withdrawn from the bidding session.',
      channels: ['email'],
    });
  }

  /**
   * Check if user can withdraw from session.
   */
  async canWithdraw(sessionId: string, userId: string): Promise<{ canWithdraw: boolean; reason?: string }> {
    const session = await this.getSession(sessionId);

    if (session.status !== 'active') {
      return { canWithdraw: false, reason: `Session is ${session.status}` };
    }

    if (session.winnerUserId === userId) {
      return { canWithdraw: false, reason: 'Cannot withdraw while holding the high bid' };
    }

    return { canWithdraw: true };
  }

  // =================================================
  // SESSION FINALIZATION
  // =================================================

  /**
   * Finalize a bidding session.
   * Determines winner, calculates compensation, creates result record.
   */
  async finalizeSession(sessionId: string): Promise<WinnerResult> {
    const session = await this.getSession(sessionId);
    const participants = await this.getParticipants(sessionId);

    // Determine winner using logic module
    const result = determineWinner({ session, participants });

    // Update session status
    const { error: sessionError } = await this.supabase
      .from('bidding_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        loser_compensation_amount: result.loserCompensation,
        platform_revenue: result.platformRevenue,
      })
      .eq('session_id', sessionId);

    if (sessionError) {
      console.error('[BiddingService] Finalize session error:', sessionError);
    }

    // Update winner
    await this.supabase
      .from('bidding_participants')
      .update({
        is_winner: true,
      })
      .eq('session_id', sessionId)
      .eq('user_id', result.winner.userId);

    // Update loser
    await this.supabase
      .from('bidding_participants')
      .update({
        is_winner: false,
        compensation_amount: result.loserCompensation,
      })
      .eq('session_id', sessionId)
      .eq('user_id', result.loser.userId);

    // Get bid history for analytics
    const bidHistory = await this.getBidHistory(sessionId);

    // Create result record
    const { error: resultError } = await this.supabase.from('bidding_results').insert({
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

    if (resultError) {
      console.error('[BiddingService] Result creation error:', resultError);
    }

    // Send notifications
    await this._notifyWinner(sessionId, result.winner.userId, result.winningBid);
    await this._notifyLoserWithCompensation(
      sessionId,
      result.loser.userId,
      result.loserCompensation
    );

    return result;
  }

  /**
   * Expire a session (time limit reached).
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
   * Cancel a session (manual cancellation).
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
        this._sendNotification({
          sessionId,
          userId: p.userId,
          notificationType: 'session_ended',
          title: 'Bidding Session Cancelled',
          message: reason || 'The bidding session has been cancelled.',
          channels: ['email', 'push'],
        })
      )
    );
  }

  // =================================================
  // NOTIFICATIONS (Private)
  // =================================================

  private async _notifySessionStarted(sessionId: string, userIds: string[]): Promise<void> {
    await Promise.all(
      userIds.map((userId) =>
        this._sendNotification({
          sessionId,
          userId,
          notificationType: 'session_started',
          title: 'Competitive Bidding Started',
          message: 'Your roommate also wants this night! Bidding is now open.',
          actionUrl: `/bidding/${sessionId}`,
          channels: ['email', 'push'],
        })
      )
    );
  }

  private async _notifyOutbid(sessionId: string, userId: string, newHighBid: number): Promise<void> {
    await this._sendNotification({
      sessionId,
      userId,
      notificationType: 'outbid',
      title: 'You were outbid!',
      message: `New high bid: $${newHighBid.toFixed(2)}. Place a higher bid to win.`,
      actionUrl: `/bidding/${sessionId}`,
      channels: ['push', 'email'],
    });
  }

  private async _notifyAutoBidTriggered(sessionId: string, autoBid: Bid, triggeredByUserId: string): Promise<void> {
    await this._sendNotification({
      sessionId,
      userId: autoBid.userId,
      notificationType: 'auto_bid_triggered',
      title: 'Auto-bid Placed',
      message: `Your auto-bid placed a bid of $${autoBid.amount.toFixed(2)}.`,
      actionUrl: `/bidding/${sessionId}`,
      channels: ['push'],
    });
  }

  private async _notifyWinner(sessionId: string, userId: string, winningBid: number): Promise<void> {
    await this._sendNotification({
      sessionId,
      userId,
      notificationType: 'winner_announcement',
      title: 'You won the bidding!',
      message: `Congratulations! You won with a bid of $${winningBid.toFixed(2)}.`,
      actionUrl: `/bidding/${sessionId}/result`,
      channels: ['email', 'push'],
    });
  }

  private async _notifyLoserWithCompensation(sessionId: string, userId: string, compensation: number): Promise<void> {
    await this._sendNotification({
      sessionId,
      userId,
      notificationType: 'loser_compensation',
      title: 'Bidding Ended - Compensation Awarded',
      message: `You received $${compensation.toFixed(2)} compensation (25% of winning bid).`,
      actionUrl: `/bidding/${sessionId}/result`,
      channels: ['email', 'push'],
    });
  }

  private async _sendNotification(params: NotificationParams): Promise<void> {
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
      console.error('[BiddingService] Failed to create notification:', error);
    }
  }

  // =================================================
  // MAPPING HELPERS (Private)
  // =================================================

  private _mapDatabaseSessionToModel(dbSession: DatabaseBiddingSession): BiddingSession {
    return {
      sessionId: dbSession.session_id,
      targetNight: new Date(dbSession.target_night),
      propertyId: dbSession.property_id,
      listingId: dbSession.listing_id,
      status: dbSession.status,
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

  private _mapDatabaseParticipantToModel(dbParticipant: DatabaseBiddingParticipant): BiddingParticipant {
    return {
      participantId: dbParticipant.participant_id,
      sessionId: dbParticipant.session_id,
      userId: dbParticipant.user_id,
      userName: dbParticipant.user_name || '',
      userArchetype: dbParticipant.user_archetype || 'big_spender',
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

  private _mapDatabaseBidToModel(dbBid: DatabaseBid): Bid {
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

export default BiddingService;
