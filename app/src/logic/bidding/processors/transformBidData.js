/**
 * PROCESSOR: Transform Bid Data
 *
 * Transforms Supabase database row data to frontend-friendly format.
 * Handles date parsing, null handling, and field mapping.
 *
 * Pure function - no side effects.
 *
 * @module logic/bidding/processors
 */

/**
 * Transform bid from database format to frontend format
 *
 * @param {Object} params
 * @param {Object} params.dbBid - Raw bid data from database
 * @returns {Object} Transformed bid
 * @returns {string} return.bidId - Bid identifier
 * @returns {string} return.userId - User ID
 * @returns {string} return.userName - User display name
 * @returns {number} return.amount - Bid amount
 * @returns {Date} return.timestamp - Bid timestamp
 * @returns {boolean} return.isAutoBid - Auto-bid flag
 * @returns {number} return.round - Round number
 * @returns {Object} [return.metadata] - Optional metadata
 */
export function transformBid({ dbBid }) {
  return {
    bidId: dbBid.id || dbBid.bid_id,
    userId: dbBid.user_id,
    userName: dbBid.user_name || 'Unknown',
    amount: parseFloat(dbBid.amount),
    timestamp: new Date(dbBid.created_at || dbBid.timestamp),
    isAutoBid: dbBid.is_auto_bid || false,
    round: dbBid.round_number || dbBid.round || 1,
    metadata: dbBid.metadata || {}
  };
}

/**
 * Transform participant from database format
 *
 * @param {Object} params
 * @param {Object} params.dbParticipant - Raw participant data from database
 * @returns {Object} Transformed participant
 */
export function transformParticipant({ dbParticipant }) {
  return {
    userId: dbParticipant.user_id,
    name: dbParticipant.user_name || 'User',
    archetype: dbParticipant.user_archetype || 'big_spender',
    currentBid: dbParticipant.current_bid_amount ? parseFloat(dbParticipant.current_bid_amount) : null,
    maxAutoBid: dbParticipant.max_auto_bid_amount ? parseFloat(dbParticipant.max_auto_bid_amount) : null,
    lastBidAt: dbParticipant.last_bid_at ? new Date(dbParticipant.last_bid_at) : null,
    isWinner: dbParticipant.is_winner || false,
    compensation: parseFloat(dbParticipant.compensation_amount || 0),
    metadata: dbParticipant.metadata || {}
  };
}

/**
 * Transform session from database format
 *
 * @param {Object} params
 * @param {Object} params.dbSession - Raw session data from database
 * @param {Array} [params.dbBids] - Raw bids array from database
 * @param {Array} [params.dbParticipants] - Raw participants array from database
 * @returns {Object} Transformed session
 */
export function transformSession({ dbSession, dbBids = [], dbParticipants = [] }) {
  const transformedBids = dbBids.map(bid => transformBid({ dbBid: bid }));
  const transformedParticipants = dbParticipants.map(p => transformParticipant({ dbParticipant: p }));

  // Find current high bid
  const currentHighBid = transformedBids.length > 0
    ? transformedBids.reduce((highest, bid) =>
        bid.amount > (highest?.amount || 0) ? bid : highest
      , null)
    : null;

  return {
    sessionId: dbSession.id || dbSession.session_id,
    targetNight: new Date(dbSession.target_night),
    propertyId: dbSession.property_id,
    participants: transformedParticipants,
    currentHighBid,
    biddingHistory: transformedBids.sort((a, b) => a.timestamp - b.timestamp),
    status: dbSession.status,
    startedAt: new Date(dbSession.started_at || dbSession.created_at),
    expiresAt: new Date(dbSession.expires_at),
    maxRounds: dbSession.max_rounds || 3,
    roundDuration: dbSession.round_duration_seconds || 3600,
    minimumIncrement: parseFloat(dbSession.minimum_increment || 0),
    metadata: dbSession.metadata || {}
  };
}

/**
 * Transform Supabase Realtime payload to bid
 *
 * @param {Object} params
 * @param {Object} params.payload - Supabase Realtime payload
 * @returns {Object} Transformed bid
 */
export function transformRealtimePayload({ payload }) {
  // Handle INSERT/UPDATE events
  if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
    return transformBid({ dbBid: payload.new });
  }

  // Handle DELETE events
  if (payload.eventType === 'DELETE') {
    return transformBid({ dbBid: payload.old });
  }

  return null;
}

export default {
  transformBid,
  transformParticipant,
  transformSession,
  transformRealtimePayload
};
