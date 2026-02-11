/**
 * BIDDING HISTORY COMPONENT
 *
 * Displays chronological list of all bids in the session.
 * Visually distinguishes user's bids vs opponent bids.
 *
 * @module BiddingInterface
 * @version 1.0.0
 */


/**
 * Format currency for display
 *
 * @param {number} amount - Dollar amount
 * @returns {string} Formatted currency
 */
function formatCurrency(amount) {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Format timestamp as relative time
 *
 * @param {Date} timestamp - Bid timestamp
 * @returns {string} Relative time string (e.g., "5m ago")
 */
function formatTimeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Bidding History Component
 *
 * @param {Object} props
 * @param {Array} props.history - Array of bid objects
 * @param {string} props.currentUserId - Current user's ID
 * @param {Array} props.participants - Array of participant objects
 */
export default function BiddingHistory({ history, currentUserId, participants }) {
  if (!history || history.length === 0) {
    return (
      <div className="bidding-history bidding-history--empty">
        <div className="bidding-history__empty-state">
          <span className="bidding-history__empty-icon">📊</span>
          <p className="bidding-history__empty-text">No bids yet. Be the first to bid!</p>
        </div>
      </div>
    );
  }

  // Sort bids by timestamp (newest first)
  const sortedBids = [...history].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Get participant names map
  const participantNames = participants?.reduce((acc, p) => {
    acc[p.userId] = p.name;
    return acc;
  }, {}) || {};

  return (
    <div className="bidding-history">
      <div className="bidding-history__header">
        <h4 className="bidding-history__title">Bid History</h4>
        <span className="bidding-history__count">{history.length} {history.length === 1 ? 'bid' : 'bids'}</span>
      </div>

      <div className="bidding-history__list">
        {sortedBids.map((bid, index) => {
          const isUserBid = bid.userId === currentUserId;
          const isHighestBid = index === 0; // Since sorted newest first, check if it's the current high
          const userName = participantNames[bid.userId] || bid.userName || 'Unknown';

          return (
            <div
              key={bid.bidId}
              className={`bidding-history__item ${
                isUserBid ? 'bidding-history__item--user' : 'bidding-history__item--opponent'
              } ${
                isHighestBid ? 'bidding-history__item--highest' : ''
              }`}
            >
              <div className="bidding-history__item-header">
                <span className="bidding-history__bidder">
                  {isUserBid && <span className="bidding-history__you-badge">You</span>}
                  {!isUserBid && userName}
                </span>

                {isHighestBid && (
                  <span className="bidding-history__high-badge">
                    🏆 High Bid
                  </span>
                )}

                {bid.isAutoBid && (
                  <span className="bidding-history__auto-badge">
                    🤖 Auto
                  </span>
                )}
              </div>

              <div className="bidding-history__item-body">
                <span className="bidding-history__amount">
                  ${formatCurrency(bid.amount)}
                </span>

                <span className="bidding-history__time">
                  {formatTimeAgo(bid.timestamp)}
                </span>
              </div>

              {bid.round && (
                <div className="bidding-history__round">
                  Round {bid.round}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
