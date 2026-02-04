/**
 * BIDDING HISTORY COMPONENT
 *
 * Displays chronological list of all bids placed in the session.
 * Shows who bid, when, amount, and whether it was an auto-bid.
 *
 * Features:
 * - Chronological bid list (newest first)
 * - Auto-bid indicators
 * - Current high bid highlighting
 * - User identification
 * - Timestamp formatting
 *
 * @version 1.0.0
 */

import React, { useMemo } from 'react';
import { Bid, BiddingParticipant } from '../types/biddingTypes';
import { formatCurrency } from '../utils/formatting';

interface BiddingHistoryProps {
  history: Bid[];
  currentUserId: string;
  participants: BiddingParticipant[];
}

export const BiddingHistory: React.FC<BiddingHistoryProps> = ({
  history,
  currentUserId,
  participants
}) => {

  // Sort bids newest first
  const sortedBids = useMemo(() => {
    return [...history].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [history]);

  if (sortedBids.length === 0) {
    return (
      <div className="bidding-history empty">
        <div className="empty-state">
          <span className="empty-icon">📜</span>
          <p className="empty-text">No bids yet. Be the first to bid!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bidding-history">

      {/* Header */}
      <div className="history-header">
        <h4 className="history-title">Bidding History</h4>
        <div className="history-count">
          {sortedBids.length} {sortedBids.length === 1 ? 'bid' : 'bids'}
        </div>
      </div>

      {/* Bid List */}
      <div className="history-list">
        {sortedBids.map((bid, index) => (
          <BidItem
            key={bid.bidId}
            bid={bid}
            isCurrentUser={bid.userId === currentUserId}
            isHighBid={index === 0}
            participants={participants}
          />
        ))}
      </div>

    </div>
  );
};

/**
 * Individual Bid Item Component
 */
interface BidItemProps {
  bid: Bid;
  isCurrentUser: boolean;
  isHighBid: boolean;
  participants: BiddingParticipant[];
}

const BidItem: React.FC<BidItemProps> = ({
  bid,
  isCurrentUser,
  isHighBid,
  participants
}) => {

  const participant = participants.find(p => p.userId === bid.userId);

  return (
    <div className={`bid-item ${isCurrentUser ? 'current-user' : 'other-user'} ${isHighBid ? 'high-bid' : ''}`}>

      {/* Bid Badge */}
      <div className="bid-badge">
        {isHighBid && (
          <span className="high-bid-badge">🏆</span>
        )}
        {bid.isAutoBid && (
          <span className="auto-bid-badge">🤖</span>
        )}
      </div>

      {/* Bid Content */}
      <div className="bid-content">

        {/* Bidder Info */}
        <div className="bid-header">
          <div className="bidder-info">
            <span className="bidder-name">
              {isCurrentUser ? 'You' : bid.userName}
            </span>
            {bid.isAutoBid && (
              <span className="bid-type-label">Auto-bid</span>
            )}
          </div>
          <div className="bid-timestamp">
            {formatBidTimestamp(bid.timestamp)}
          </div>
        </div>

        {/* Bid Amount */}
        <div className="bid-amount-row">
          <span className="bid-amount">${formatCurrency(bid.amount)}</span>
          {isHighBid && (
            <span className="current-high-label">Current High</span>
          )}
        </div>

        {/* Bid Round */}
        <div className="bid-round">
          Round {bid.round}
        </div>

      </div>

    </div>
  );
};

/**
 * Format bid timestamp
 */
function formatBidTimestamp(timestamp: Date): string {
  const now = new Date();
  const bidTime = new Date(timestamp);
  const diff = now.getTime() - bidTime.getTime();

  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Format as time
  return bidTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export default BiddingHistory;
