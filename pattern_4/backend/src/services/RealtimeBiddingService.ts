/**
 * =====================================================
 * PATTERN 4: REALTIME BIDDING SERVICE
 * =====================================================
 * Supabase Realtime integration for live bidding updates
 * Alternative to Socket.io - uses Supabase's built-in Realtime
 */

import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import {
    BiddingSession,
    Bid,
    BiddingParticipant,
    BidPlacedEvent,
    AutoBidTriggeredEvent,
    SessionEndedEvent,
    ParticipantUpdateEvent,
    TimeUpdateEvent,
    BiddingWebSocketEvent,
} from '../types/bidding.types';

// =====================================================
// REALTIME BIDDING SERVICE
// =====================================================

/**
 * Manages real-time bidding updates via Supabase Realtime
 * Broadcasts events to all connected clients in a session
 */
export class RealtimeBiddingService {
    private channels: Map<string, RealtimeChannel> = new Map();

    constructor(private supabase: SupabaseClient) {}

    // =================================================
    // CHANNEL MANAGEMENT
    // =================================================

    /**
     * Subscribe to a bidding session channel
     * Returns channel for client to listen on
     */
    subscribeToSession(
        sessionId: string,
        callbacks: {
            onBidPlaced?: (event: BidPlacedEvent) => void;
            onAutoBid?: (event: AutoBidTriggeredEvent) => void;
            onSessionEnded?: (event: SessionEndedEvent) => void;
            onParticipantUpdate?: (event: ParticipantUpdateEvent) => void;
            onTimeUpdate?: (event: TimeUpdateEvent) => void;
        }
    ): RealtimeChannel {
        const channelName = `bidding_session:${sessionId}`;

        // Check if channel already exists
        if (this.channels.has(channelName)) {
            return this.channels.get(channelName)!;
        }

        // Create new channel
        const channel = this.supabase.channel(channelName);

        // Subscribe to database changes for this session
        channel
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bids',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    const bid = this.mapDatabaseBidToModel(payload.new);

                    if (bid.isAutoBid && callbacks.onAutoBid) {
                        callbacks.onAutoBid({
                            eventType: 'bid:autobid',
                            sessionId,
                            bid,
                            triggeredBy: 'other_user', // Will be enriched by server
                        });
                    } else if (callbacks.onBidPlaced) {
                        callbacks.onBidPlaced({
                            eventType: 'bid:placed',
                            sessionId,
                            bid,
                            newHighBidder: {
                                userId: bid.userId,
                                userName: 'User', // Will be enriched
                            },
                            minimumNextBid: 0, // Will be calculated
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'bidding_sessions',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    const session = payload.new;

                    // Session ended
                    if (session.status === 'completed' && callbacks.onSessionEnded) {
                        callbacks.onSessionEnded({
                            eventType: 'session:ended',
                            sessionId,
                            winner: {
                                userId: session.winner_user_id,
                                userName: 'Winner',
                                bidAmount: parseFloat(session.winning_bid_amount),
                            },
                            loser: {
                                userId: 'loser_id',
                                userName: 'Loser',
                                compensation: parseFloat(session.loser_compensation_amount || 0),
                            },
                            platformRevenue: parseFloat(session.platform_revenue || 0),
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'bidding_participants',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    if (callbacks.onParticipantUpdate) {
                        const participant = this.mapDatabaseParticipantToModel(payload.new);
                        callbacks.onParticipantUpdate({
                            eventType: 'participant:update',
                            sessionId,
                            participant,
                        });
                    }
                }
            )
            .subscribe();

        // Store channel
        this.channels.set(channelName, channel);

        return channel;
    }

    /**
     * Unsubscribe from a session channel
     */
    unsubscribeFromSession(sessionId: string): void {
        const channelName = `bidding_session:${sessionId}`;
        const channel = this.channels.get(channelName);

        if (channel) {
            this.supabase.removeChannel(channel);
            this.channels.delete(channelName);
        }
    }

    // =================================================
    // BROADCAST EVENTS
    // =================================================

    /**
     * Broadcast bid placed event
     * Notifies all participants in session
     */
    async broadcastBidPlaced(
        sessionId: string,
        bid: Bid,
        newHighBidder: { userId: string; userName: string },
        minimumNextBid: number
    ): Promise<void> {
        const channelName = `bidding_session:${sessionId}`;
        const channel = this.channels.get(channelName);

        if (!channel) {
            console.warn(`No channel for session ${sessionId}`);
            return;
        }

        const event: BidPlacedEvent = {
            eventType: 'bid:placed',
            sessionId,
            bid,
            newHighBidder,
            minimumNextBid,
        };

        await channel.send({
            type: 'broadcast',
            event: 'bid_placed',
            payload: event,
        });
    }

    /**
     * Broadcast auto-bid triggered event
     */
    async broadcastAutoBid(
        sessionId: string,
        bid: Bid,
        triggeredBy: string
    ): Promise<void> {
        const channelName = `bidding_session:${sessionId}`;
        const channel = this.channels.get(channelName);

        if (!channel) return;

        const event: AutoBidTriggeredEvent = {
            eventType: 'bid:autobid',
            sessionId,
            bid,
            triggeredBy,
        };

        await channel.send({
            type: 'broadcast',
            event: 'auto_bid_triggered',
            payload: event,
        });
    }

    /**
     * Broadcast session ended event
     */
    async broadcastSessionEnded(
        sessionId: string,
        winner: { userId: string; userName: string; bidAmount: number },
        loser: { userId: string; userName: string; compensation: number },
        platformRevenue: number
    ): Promise<void> {
        const channelName = `bidding_session:${sessionId}`;
        const channel = this.channels.get(channelName);

        if (!channel) return;

        const event: SessionEndedEvent = {
            eventType: 'session:ended',
            sessionId,
            winner,
            loser,
            platformRevenue,
        };

        await channel.send({
            type: 'broadcast',
            event: 'session_ended',
            payload: event,
        });
    }

    /**
     * Broadcast time update (every minute)
     */
    async broadcastTimeUpdate(
        sessionId: string,
        timeRemainingSeconds: number,
        expiresAt: Date
    ): Promise<void> {
        const channelName = `bidding_session:${sessionId}`;
        const channel = this.channels.get(channelName);

        if (!channel) return;

        const event: TimeUpdateEvent = {
            eventType: 'session:time_update',
            sessionId,
            timeRemainingSeconds,
            expiresAt,
        };

        await channel.send({
            type: 'broadcast',
            event: 'time_update',
            payload: event,
        });
    }

    // =================================================
    // PRESENCE TRACKING
    // =================================================

    /**
     * Track user presence in bidding session
     */
    async trackPresence(
        sessionId: string,
        userId: string,
        userName: string
    ): Promise<void> {
        const channelName = `bidding_session:${sessionId}`;
        const channel = this.channels.get(channelName);

        if (!channel) return;

        await channel.track({
            user_id: userId,
            user_name: userName,
            online_at: new Date().toISOString(),
        });
    }

    /**
     * Get all present users in a session
     */
    async getPresence(sessionId: string): Promise<Array<{
        userId: string;
        userName: string;
        onlineAt: string;
    }>> {
        const channelName = `bidding_session:${sessionId}`;
        const channel = this.channels.get(channelName);

        if (!channel) return [];

        const presenceState = channel.presenceState();

        return Object.values(presenceState).flat().map((presence: any) => ({
            userId: presence.user_id,
            userName: presence.user_name,
            onlineAt: presence.online_at,
        }));
    }

    // =================================================
    // CLEANUP
    // =================================================

    /**
     * Remove all channels (on service shutdown)
     */
    cleanup(): void {
        this.channels.forEach((channel) => {
            this.supabase.removeChannel(channel);
        });
        this.channels.clear();
    }

    // =================================================
    // MAPPING HELPERS
    // =================================================

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
}

// =====================================================
// CLIENT-SIDE HOOK (Reference Implementation)
// =====================================================

/**
 * Reference implementation for client-side hook
 * This would go in frontend code, included here for completeness
 */

/*
export function useRealtimeBidding(sessionId: string) {
    const [session, setSession] = useState<BiddingSession | null>(null);
    const [bids, setBids] = useState<Bid[]>([]);
    const [participants, setParticipants] = useState<BiddingParticipant[]>([]);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    useEffect(() => {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const realtimeService = new RealtimeBiddingService(supabase);

        // Subscribe to session updates
        const channel = realtimeService.subscribeToSession(sessionId, {
            onBidPlaced: (event) => {
                setBids(prev => [...prev, event.bid]);
                setSession(prev => prev ? {
                    ...prev,
                    winningBidAmount: event.bid.amount,
                    winnerUserId: event.bid.userId
                } : null);
            },

            onAutoBid: (event) => {
                setBids(prev => [...prev, event.bid]);
                // Show notification: "Auto-bid placed"
            },

            onSessionEnded: (event) => {
                setSession(prev => prev ? { ...prev, status: 'completed' } : null);
                // Navigate to results page
            },

            onParticipantUpdate: (event) => {
                setParticipants(prev => prev.map(p =>
                    p.userId === event.participant.userId ? event.participant : p
                ));
            },

            onTimeUpdate: (event) => {
                setTimeRemaining(event.timeRemainingSeconds);
            }
        });

        // Track presence
        realtimeService.trackPresence(sessionId, currentUserId, currentUserName);

        return () => {
            realtimeService.unsubscribeFromSession(sessionId);
        };
    }, [sessionId]);

    return {
        session,
        bids,
        participants,
        timeRemaining
    };
}
*/

// =====================================================
// EXPORT
// =====================================================

export default RealtimeBiddingService;
