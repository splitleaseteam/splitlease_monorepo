/**
 * BIDDING TYPES - JSDoc Type Definitions
 *
 * TypeScript-style type definitions using JSDoc for Pattern 4 Competitive Bidding.
 * Adapted from pattern_4/frontend/types/biddingTypes.ts and
 * pattern_4/backend/src/types/bidding.types.ts
 *
 * @module BiddingTypes
 * @version 1.0.0
 */

/**
 * @typedef {'active' | 'completed' | 'expired' | 'cancelled'} BiddingStatus
 */

/**
 * @typedef {'big_spender'} UserArchetype
 */

/**
 * @typedef {'pending' | 'processing' | 'completed' | 'failed' | 'refunded'} PaymentStatus
 */

/**
 * Individual bid record
 *
 * @typedef {Object} Bid
 * @property {string} bidId - Unique bid identifier
 * @property {string} userId - User who placed the bid (Bubble ID)
 * @property {string} userName - Display name of bidder
 * @property {number} amount - Bid amount in dollars
 * @property {Date} timestamp - When bid was placed
 * @property {boolean} isAutoBid - True if triggered by auto-bid system
 * @property {number} round - Round number (1, 2, or 3)
 * @property {Object} [metadata] - Optional bid metadata
 * @property {number} [metadata.previousBid] - Previous high bid amount
 * @property {number} [metadata.incrementPercentage] - Percentage increase
 * @property {string} [metadata.triggeredByBid] - Bid ID that triggered this auto-bid
 */

/**
 * Bidding participant (user in session)
 *
 * @typedef {Object} BiddingParticipant
 * @property {string} userId - User's Bubble ID
 * @property {string} name - Display name
 * @property {UserArchetype} archetype - User archetype (must be 'big_spender')
 * @property {number|null} currentBid - Current bid amount
 * @property {number|null} maxAutoBid - Maximum auto-bid amount
 * @property {Date|null} lastBidAt - Timestamp of last bid
 * @property {boolean} isWinner - True if this user won the session
 * @property {number} compensation - Compensation amount if lost (25% of winning bid)
 * @property {Object} [metadata] - Optional participant metadata
 * @property {number} [metadata.spendingScore] - Spending score
 * @property {number} [metadata.historicalBids] - Number of historical bids
 */

/**
 * Main bidding session
 *
 * @typedef {Object} BiddingSession
 * @property {string} sessionId - Unique session identifier
 * @property {Date} targetNight - Date being competed for
 * @property {string} propertyId - Property/listing ID
 * @property {BiddingParticipant[]} participants - Array of 2 participants
 * @property {Bid|null} currentHighBid - Current high bid (null if no bids yet)
 * @property {Bid[]} biddingHistory - Array of all bids in chronological order
 * @property {BiddingStatus} status - Current session status
 * @property {Date} startedAt - Session start time
 * @property {Date} expiresAt - Session expiration time
 * @property {number} maxRounds - Maximum rounds per user (typically 3)
 * @property {number} roundDuration - Duration per round in seconds (typically 3600 = 1 hour)
 * @property {number} minimumIncrement - Minimum bid increment (typically 10% of current high)
 * @property {Object} [metadata] - Optional session metadata
 * @property {string} [metadata.listingId] - Associated listing ID
 * @property {number} [metadata.basePrice] - Starting price
 */

/**
 * Bid validation result
 *
 * @typedef {Object} BidValidationResult
 * @property {boolean} valid - True if bid is valid
 * @property {string[]} errors - Array of validation error messages
 * @property {string[]} warnings - Array of warning messages
 * @property {number} minimumNextBid - Minimum valid bid amount
 * @property {number} maximumAllowed - Maximum reasonable bid amount
 * @property {number} suggestedBid - Suggested bid amount (current + 15%)
 */

/**
 * Session result (after completion)
 *
 * @typedef {Object} SessionResult
 * @property {string} sessionId - Session identifier
 * @property {BiddingParticipant} winner - Winning participant
 * @property {BiddingParticipant} loser - Losing participant
 * @property {number} winningBid - Final winning bid amount
 * @property {number} loserCompensation - Compensation paid to loser (25%)
 * @property {number} platformRevenue - Revenue kept by platform (75%)
 * @property {number} totalRounds - Total rounds completed
 * @property {number} sessionDuration - Duration in minutes
 * @property {Date} finalizedAt - When session was finalized
 */

/**
 * WebSocket/Realtime Event: Bid Placed
 *
 * @typedef {Object} BidPlacedEvent
 * @property {Bid} bid - The bid that was placed
 * @property {BiddingSession} session - Updated session state
 * @property {Bid} [triggeredAutoBid] - Auto-bid that was triggered (if any)
 */

/**
 * WebSocket/Realtime Event: Auto-Bid Triggered
 *
 * @typedef {Object} AutoBidEvent
 * @property {Bid} bid - The auto-bid that was placed
 * @property {string} triggeredBy - User ID who triggered the auto-bid
 * @property {BiddingSession} session - Updated session state
 */

/**
 * WebSocket/Realtime Event: Session Ended
 *
 * @typedef {Object} SessionEndedEvent
 * @property {string} sessionId - Session identifier
 * @property {string} winner - Winner's user ID
 * @property {string} loser - Loser's user ID
 * @property {number} winningBid - Final winning bid amount
 * @property {number} compensation - Loser compensation amount
 * @property {BiddingSession} session - Final session state
 * @property {SessionResult} result - Complete session result
 */

/**
 * WebSocket/Realtime Event: Participant Update
 *
 * @typedef {Object} ParticipantUpdateEvent
 * @property {BiddingParticipant} participant - Updated participant data
 * @property {'bid_placed' | 'auto_bid_set' | 'status_changed'} changeType - Type of change
 */

/**
 * Error event from bidding system
 *
 * @typedef {Object} SessionErrorEvent
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {string} sessionId - Session identifier
 * @property {string} [userId] - User ID if error is user-specific
 */

/**
 * API Request: Place Bid
 *
 * @typedef {Object} PlaceBidRequest
 * @property {string} sessionId - Session identifier
 * @property {string} userId - User placing the bid
 * @property {number} amount - Bid amount
 * @property {Date} timestamp - Client timestamp
 */

/**
 * API Request: Set Auto-Bid
 *
 * @typedef {Object} SetAutoBidRequest
 * @property {string} sessionId - Session identifier
 * @property {string} userId - User setting auto-bid
 * @property {number} maxAmount - Maximum auto-bid amount
 */

/**
 * API Response: Bid Submission
 *
 * @typedef {Object} BidResponse
 * @property {boolean} success - True if bid was accepted
 * @property {Bid} [bid] - The placed bid (if successful)
 * @property {BiddingSession} [session] - Updated session state
 * @property {string} [error] - Error message (if failed)
 * @property {Bid} [triggeredAutoBid] - Auto-bid triggered by this bid
 */

/**
 * API Response: Session Data
 *
 * @typedef {Object} SessionResponse
 * @property {boolean} success - True if request succeeded
 * @property {BiddingSession} [session] - Session data
 * @property {string} [error] - Error message (if failed)
 */

/**
 * UI View State
 *
 * @typedef {'intro' | 'bidding' | 'winner_announcement'} BiddingView
 */

/**
 * Connection status for Realtime
 *
 * @typedef {'connecting' | 'connected' | 'disconnected' | 'error'} ConnectionStatus
 */

/**
 * Hook return value for useBiddingRealtime
 *
 * @typedef {Object} UseBiddingRealtimeReturn
 * @property {BiddingSession|null} session - Current session state
 * @property {(amount: number, maxAutoBid?: number) => Promise<void>} placeBid - Place a bid
 * @property {(maxAmount: number) => Promise<void>} setMaxAutoBid - Set max auto-bid
 * @property {() => Promise<void>} withdrawBid - Withdraw from session
 * @property {ConnectionStatus} connectionStatus - Realtime connection status
 * @property {Error|null} error - Current error (if any)
 */

export default {
  // Type definitions are exported via JSDoc comments
  // No runtime exports needed
};
