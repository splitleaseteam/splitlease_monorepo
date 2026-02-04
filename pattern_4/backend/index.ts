/**
 * =====================================================
 * PATTERN 4: BS+BS COMPETITIVE BIDDING - MAIN EXPORT
 * =====================================================
 * Central export point for all bidding backend modules
 */

// =====================================================
// SERVICES
// =====================================================

export { BiddingService } from './src/services/BiddingService.ts';
export { RealtimeBiddingService } from './src/services/RealtimeBiddingService.ts';

// =====================================================
// TYPES
// =====================================================

export type {
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
    AutoBidResult,
    BiddingWebSocketEvent,
    BiddingSessionSummary,
    UserBiddingStats,
    SessionAnalytics,
} from './src/types/bidding.types.ts';

export {
    BiddingSessionStatus,
    PaymentStatus,
    NotificationType,
    NotificationChannel,
    BiddingError,
    BidValidationError,
    SessionNotFoundError,
    SessionExpiredError,
    MaxRoundsExceededError,
    UnauthorizedBidError,
    BIDDING_CONSTANTS,
    BIDDING_RULES,
} from './src/types/bidding.types.ts';

// =====================================================
// UTILITIES
// =====================================================

export {
    validateBid,
    validateBidOrThrow,
    processAutoBid,
    determineWinner,
    calculateLoserCompensation,
    isSessionExpired,
    shouldFinalizeSession,
    calculateTimeRemaining,
    checkBiddingEligibility,
    generateBidId,
    generateSessionId,
    formatCurrency,
    calculateBidIncrement,
    getUserBidPosition,
    calculateExpiresAt,
    analyzeBidHistory,
} from './src/utils/biddingLogic.ts';

// =====================================================
// JOBS
// =====================================================

export { SessionCleanupJob } from './src/jobs/sessionCleanupJob.ts';

// =====================================================
// VERSION INFO
// =====================================================

export const VERSION = '1.0.0';
export const BUILD_DATE = '2026-01-28';

// =====================================================
// INITIALIZATION HELPER
// =====================================================

/**
 * Initialize bidding system with Supabase client
 * Convenience function for quick setup
 */
export function initializeBiddingSystem(supabaseClient: any) {
    const biddingService = new BiddingService(supabaseClient);
    const realtimeService = new RealtimeBiddingService(supabaseClient);

    return {
        bidding: biddingService,
        realtime: realtimeService,
        version: VERSION,
    };
}

// =====================================================
// EXPORTS
// =====================================================

import { BiddingService } from './src/services/BiddingService.ts';
import { RealtimeBiddingService } from './src/services/RealtimeBiddingService.ts';

export default {
    BiddingService,
    RealtimeBiddingService,
    initializeBiddingSystem,
    VERSION,
    BUILD_DATE,
};
