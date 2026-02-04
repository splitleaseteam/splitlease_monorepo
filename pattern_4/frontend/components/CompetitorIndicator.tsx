/**
 * COMPETITOR INDICATOR COMPONENT
 *
 * Visual indicator showing both participants in the bidding session
 * with their current status, bid amounts, and competitive positioning.
 *
 * Features:
 * - Head-to-head display
 * - Live status updates
 * - Visual winning/losing states
 * - Participant avatars
 * - Bid counts
 *
 * @version 1.0.0
 */

import React, { useMemo } from 'react';
import { BiddingSession, BiddingParticipant } from '../types/biddingTypes';
import { formatCurrency } from '../utils/formatting';

interface CompetitorIndicatorProps {
  session: BiddingSession;
  currentUserId: string;
}

export const CompetitorIndicator: React.FC<CompetitorIndicatorProps> = ({
  session,
  currentUserId
}) => {

  const [currentUser, otherUser] = useMemo(() => {
    const current = session.participants.find(p => p.userId === currentUserId);
    const other = session.participants.find(p => p.userId !== currentUserId);
    return [current, other];
  }, [session.participants, currentUserId]);

  if (!currentUser || !otherUser) {
    return null;
  }

  const isCurrentWinning = session.currentHighBid?.userId === currentUserId;
  const currentUserBid = currentUser.currentBid || 0;
  const otherUserBid = otherUser.currentBid || 0;

  const currentUserBidCount = session.biddingHistory.filter(
    b => b.userId === currentUserId
  ).length;

  const otherUserBidCount = session.biddingHistory.filter(
    b => b.userId === otherUser.userId
  ).length;

  return (
    <div className="competitor-indicator">

      {/* Header */}
      <div className="competitor-header">
        <h3 className="header-title">Competitive Buyout</h3>
        <div className="header-date">
          {formatDate(new Date())} {/* Target night */}
        </div>
      </div>

      {/* Head-to-Head Display */}
      <div className="head-to-head">

        {/* Current User Card */}
        <div className={`participant-card current-user ${isCurrentWinning ? 'winning' : 'losing'}`}>
          <div className="participant-header">
            <div className="participant-avatar">
              <div className="avatar-circle">
                {getInitials(currentUser.name)}
              </div>
              {isCurrentWinning && (
                <span className="winner-badge">🏆</span>
              )}
            </div>
            <div className="participant-info">
              <div className="participant-name">You</div>
              <div className="participant-archetype">
                {formatArchetype(currentUser.archetype)}
              </div>
            </div>
          </div>

          <div className="participant-bid">
            {currentUserBid > 0 ? (
              <>
                <div className="bid-label">Your Bid</div>
                <div className="bid-amount">${formatCurrency(currentUserBid)}</div>
                {currentUser.maxAutoBid && currentUser.maxAutoBid > currentUserBid && (
                  <div className="auto-bid-indicator">
                    <span className="auto-icon">🤖</span>
                    Auto-bid: ${formatCurrency(currentUser.maxAutoBid)}
                  </div>
                )}
              </>
            ) : (
              <div className="no-bid">No bid yet</div>
            )}
          </div>

          <div className="participant-stats">
            <div className="stat">
              <span className="stat-label">Bids:</span>
              <span className="stat-value">
                {currentUserBidCount} / {session.maxRounds}
              </span>
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="vs-divider">
          <div className="vs-circle">
            <span className="vs-text">VS</span>
          </div>
          <div className="divider-line" />
        </div>

        {/* Other User Card */}
        <div className={`participant-card other-user ${!isCurrentWinning && otherUserBid > 0 ? 'winning' : 'losing'}`}>
          <div className="participant-header">
            <div className="participant-avatar">
              <div className="avatar-circle">
                {getInitials(otherUser.name)}
              </div>
              {!isCurrentWinning && otherUserBid > 0 && (
                <span className="winner-badge">🏆</span>
              )}
            </div>
            <div className="participant-info">
              <div className="participant-name">{otherUser.name}</div>
              <div className="participant-archetype">
                {formatArchetype(otherUser.archetype)}
              </div>
            </div>
          </div>

          <div className="participant-bid">
            {otherUserBid > 0 ? (
              <>
                <div className="bid-label">Their Bid</div>
                <div className="bid-amount">${formatCurrency(otherUserBid)}</div>
                {otherUser.maxAutoBid && otherUser.maxAutoBid > otherUserBid && (
                  <div className="auto-bid-indicator">
                    <span className="auto-icon">🤖</span>
                    Auto-bid enabled
                  </div>
                )}
              </>
            ) : (
              <div className="no-bid">No bid yet</div>
            )}
          </div>

          <div className="participant-stats">
            <div className="stat">
              <span className="stat-label">Bids:</span>
              <span className="stat-value">
                {otherUserBidCount} / {session.maxRounds}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Competition Summary */}
      <div className="competition-summary">
        <div className="summary-item">
          <span className="summary-icon">💰</span>
          <span className="summary-text">
            Current High: <strong>${formatCurrency(session.currentHighBid?.amount || 0)}</strong>
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-icon">🎯</span>
          <span className="summary-text">
            Loser gets <strong>25%</strong> compensation
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-icon">⚡</span>
          <span className="summary-text">
            <strong>{session.maxRounds}</strong> rounds max
          </span>
        </div>
      </div>

      {/* Competitive Context Message */}
      {renderCompetitiveMessage(session, currentUserId, isCurrentWinning)}

    </div>
  );
};

/**
 * Render contextual competitive message
 */
function renderCompetitiveMessage(
  session: BiddingSession,
  currentUserId: string,
  isWinning: boolean
): React.ReactNode {

  const roundsRemaining = session.maxRounds - session.biddingHistory.filter(
    b => b.userId === currentUserId
  ).length;

  if (isWinning) {
    return (
      <div className="competitive-message winning">
        <span className="message-icon">🎯</span>
        <span className="message-text">
          You're in the lead! Hold your position or wait for a counter-bid.
        </span>
      </div>
    );
  }

  if (roundsRemaining === 0) {
    return (
      <div className="competitive-message no-bids-left">
        <span className="message-icon">🚫</span>
        <span className="message-text">
          You've used all {session.maxRounds} bids. You'll receive 25% compensation if you lose.
        </span>
      </div>
    );
  }

  if (!session.currentHighBid) {
    return (
      <div className="competitive-message no-bids-yet">
        <span className="message-icon">🚀</span>
        <span className="message-text">
          Be the first to bid! Set your price and enable auto-bidding.
        </span>
      </div>
    );
  }

  return (
    <div className="competitive-message losing">
      <span className="message-icon">⚡</span>
      <span className="message-text">
        You're behind! You have {roundsRemaining} {roundsRemaining === 1 ? 'bid' : 'bids'} left to take the lead.
      </span>
    </div>
  );
}

/**
 * Get user initials for avatar
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format archetype for display
 */
function formatArchetype(archetype: string): string {
  return archetype
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export default CompetitorIndicator;
