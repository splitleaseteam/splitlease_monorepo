/**
 * =====================================================
 * BACKGROUND JOB: Session Cleanup
 * =====================================================
 * Periodically checks for expired sessions and finalizes them
 * Should run every 5 minutes via cron or pg_cron
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BiddingService } from '../services/BiddingService';
import { BiddingSession, BiddingSessionStatus } from '../types/bidding.types';
import { isSessionExpired } from '../utils/biddingLogic';

// =====================================================
// SESSION CLEANUP JOB
// =====================================================

export class SessionCleanupJob {
    constructor(private supabase: SupabaseClient) {}

    /**
     * Main job execution
     * Finds and processes expired sessions
     */
    async execute(): Promise<{
        processedSessions: number;
        errors: string[];
    }> {
        console.log('[SessionCleanup] Starting cleanup job...');

        const processedSessions: string[] = [];
        const errors: string[] = [];

        try {
            // Find all active sessions that have expired
            const expiredSessions = await this.findExpiredSessions();

            console.log(`[SessionCleanup] Found ${expiredSessions.length} expired sessions`);

            // Process each expired session
            for (const session of expiredSessions) {
                try {
                    await this.processExpiredSession(session);
                    processedSessions.push(session.sessionId);
                } catch (error) {
                    const errorMsg = `Failed to process session ${session.sessionId}: ${error.message}`;
                    console.error('[SessionCleanup]', errorMsg);
                    errors.push(errorMsg);
                }
            }

            console.log(
                `[SessionCleanup] Completed. Processed: ${processedSessions.length}, Errors: ${errors.length}`
            );

            return {
                processedSessions: processedSessions.length,
                errors,
            };
        } catch (error) {
            console.error('[SessionCleanup] Job failed:', error);
            throw error;
        }
    }

    /**
     * Find all expired sessions
     */
    private async findExpiredSessions(): Promise<BiddingSession[]> {
        const { data: sessions, error } = await this.supabase
            .from('bidding_sessions')
            .select('*')
            .eq('status', 'active')
            .lt('expires_at', new Date().toISOString());

        if (error) {
            throw new Error(`Failed to query expired sessions: ${error.message}`);
        }

        return (sessions || []).map(this.mapDatabaseSessionToModel);
    }

    /**
     * Process a single expired session
     */
    private async processExpiredSession(session: BiddingSession): Promise<void> {
        console.log(`[SessionCleanup] Processing expired session ${session.sessionId}`);

        const biddingService = new BiddingService(this.supabase);

        // Get bid history to check if there are any bids
        const bidHistory = await biddingService.getBidHistory(session.sessionId);

        if (bidHistory.length === 0) {
            // No bids placed - cancel the session
            console.log(`[SessionCleanup] No bids in session ${session.sessionId}, canceling`);
            await biddingService.cancelSession(
                session.sessionId,
                'Session expired with no bids'
            );
        } else {
            // Has bids - finalize with winner
            console.log(`[SessionCleanup] Finalizing session ${session.sessionId} with winner`);
            await biddingService.finalizeSession(session.sessionId);
        }
    }

    /**
     * Find sessions that are about to expire (15 minutes warning)
     */
    async findExpiringS Sessions(): Promise<BiddingSession[]> {
        const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);

        const { data: sessions, error } = await this.supabase
            .from('bidding_sessions')
            .select('*')
            .eq('status', 'active')
            .lt('expires_at', fifteenMinutesFromNow.toISOString())
            .gt('expires_at', new Date().toISOString());

        if (error) {
            throw new Error(`Failed to query expiring sessions: ${error.message}`);
        }

        return (sessions || []).map(this.mapDatabaseSessionToModel);
    }

    /**
     * Send warning notifications for expiring sessions
     */
    async sendExpirationWarnings(): Promise<number> {
        const expiringSessions = await this.findExpiringSessions();

        console.log(
            `[SessionCleanup] Sending expiration warnings for ${expiringSessions.length} sessions`
        );

        let sentCount = 0;

        for (const session of expiringSessions) {
            try {
                // Get participants
                const { data: participants } = await this.supabase
                    .from('bidding_participants')
                    .select('*')
                    .eq('session_id', session.sessionId);

                if (!participants) continue;

                // Send notification to each participant
                for (const participant of participants) {
                    await this.supabase.from('bidding_notifications').insert({
                        session_id: session.sessionId,
                        user_id: participant.user_id,
                        notification_type: 'session_ending_soon',
                        title: 'Bidding Ending Soon',
                        message: 'Only 15 minutes left to place your bid!',
                        action_url: `/bidding/${session.sessionId}`,
                        channels: ['push', 'email'],
                        sent_at: new Date().toISOString(),
                    });

                    sentCount++;
                }
            } catch (error) {
                console.error(
                    `[SessionCleanup] Failed to send warning for session ${session.sessionId}:`,
                    error
                );
            }
        }

        return sentCount;
    }

    /**
     * Clean up old completed sessions (older than 30 days)
     */
    async archiveOldSessions(): Promise<number> {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const { data: oldSessions, error } = await this.supabase
            .from('bidding_sessions')
            .select('session_id')
            .in('status', ['completed', 'cancelled', 'expired'])
            .lt('completed_at', thirtyDaysAgo.toISOString());

        if (error || !oldSessions) {
            console.error('[SessionCleanup] Failed to find old sessions:', error);
            return 0;
        }

        console.log(`[SessionCleanup] Archiving ${oldSessions.length} old sessions`);

        // Move to archive table (if exists) or just delete
        // For now, we'll just log - implement archiving as needed

        return oldSessions.length;
    }

    // =================================================
    // MAPPING HELPER
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
}

// =====================================================
// CRON JOB SETUP (pg_cron)
// =====================================================

/**
 * SQL to set up pg_cron job
 * Run this in Supabase SQL Editor:
 *
 * SELECT cron.schedule(
 *     'cleanup-expired-bidding-sessions',
 *     '*/5 * * * *', -- Every 5 minutes
 *     $$
 *     SELECT net.http_post(
 *         url := 'https://your-project.supabase.co/functions/v1/jobs/session-cleanup',
 *         headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
 *         body := '{}'::jsonb
 *     );
 *     $$
 * );
 *
 * -- Warning notifications (every 1 minute)
 * SELECT cron.schedule(
 *     'send-expiration-warnings',
 *     '* * * * *', -- Every minute
 *     $$
 *     SELECT net.http_post(
 *         url := 'https://your-project.supabase.co/functions/v1/jobs/expiration-warnings',
 *         headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
 *         body := '{}'::jsonb
 *     );
 *     $$
 * );
 */

// =====================================================
// EDGE FUNCTION WRAPPER
// =====================================================

/**
 * Edge Function to execute cleanup job
 * Path: /functions/v1/jobs/session-cleanup
 */

/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SessionCleanupJob } from './sessionCleanupJob.ts';

serve(async (req) => {
    // Verify service role key
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!authHeader || !authHeader.includes(serviceRoleKey)) {
        return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401 }
        );
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        serviceRoleKey ?? ''
    );

    const job = new SessionCleanupJob(supabase);
    const result = await job.execute();

    return new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
});
*/

// =====================================================
// EXPORT
// =====================================================

export default SessionCleanupJob;
