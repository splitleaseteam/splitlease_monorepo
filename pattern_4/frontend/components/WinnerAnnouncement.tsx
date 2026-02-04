/**
 * WINNER ANNOUNCEMENT COMPONENT
 *
 * Displays session results after bidding ends.
 * Shows winner, final amount, loser compensation, and next steps.
 *
 * Features:
 * - Winner/loser personalized views
 * - Compensation breakdown
 * - Platform revenue transparency
 * - Next steps CTA
 * - Confetti animation for winner
 *
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { BiddingSession } from '../types/biddingTypes';
import { formatCurrency } from '../utils/formatting';
import Confetti from 'react-confetti';

interface WinnerAnnouncementProps {
  session: BiddingSession;
  currentUserId: string;
  targetNight: Date;
}

export const WinnerAnnouncement: React.FC<WinnerAnnouncementProps> = ({
  session,
  currentUserId,
  targetNight
}) => {

  const [showConfetti, setShowConfetti] = useState(false);

  const isWinner = session.currentHighBid?.userId === currentUserId;
  const winningBid = session.currentHighBid?.amount || 0;
  const compensation = Math.round(winningBid * 0.25);
  const platformRevenue = winningBid - compensation;

  const winner = session.participants.find(
    p => p.userId === session.currentHighBid?.userId
  );

  const loser = session.participants.find(
    p => p.userId !== session.currentHighBid?.userId
  );

  // Show confetti for winner
  useEffect(() => {
    if (isWinner) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isWinner]);

  if (isWinner) {
    return (
      <div className="winner-announcement winner-view">

        {/* Confetti */}
        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            numberOfPieces={200}
            recycle={false}
          />
        )}

        {/* Winner Header */}
        <div className="announcement-header winner-header">
          <div className="trophy-icon">🏆</div>
          <h1 className="announcement-title">You Won!</h1>
          <p className="announcement-subtitle">
            Congratulations! You secured exclusive use of the night.
          </p>
        </div>

        {/* Winning Details */}
        <div className="announcement-details">

          {/* Winning Bid Amount */}
          <div className="detail-card primary">
            <div className="card-label">Your Winning Bid</div>
            <div className="card-value highlight">
              ${formatCurrency(winningBid)}
            </div>
            <div className="card-sublabel">
              Final bid placed {formatTimeAgo(session.currentHighBid!.timestamp)}
            </div>
          </div>

          {/* Target Night */}
          <div className="detail-card">
            <div className="card-label">Night Reserved</div>
            <div className="card-value">
              {formatNightDate(targetNight)}
            </div>
            <div className="card-sublabel">
              Exclusive use - {loser?.name} will not be present
            </div>
          </div>

          {/* Loser Compensation */}
          <div className="detail-card">
            <div className="card-label">Compensation to {loser?.name}</div>
            <div className="card-value">
              ${formatCurrency(compensation)}
            </div>
            <div className="card-sublabel">
              25% of your winning bid
            </div>
          </div>

        </div>

        {/* Payment Breakdown */}
        <div className="payment-breakdown">
          <h3 className="breakdown-title">Payment Breakdown</h3>
          <div className="breakdown-table">
            <div className="breakdown-row">
              <span className="row-label">Winning bid amount</span>
              <span className="row-value">${formatCurrency(winningBid)}</span>
            </div>
            <div className="breakdown-row">
              <span className="row-label">Platform fee (1.5%)</span>
              <span className="row-value">${formatCurrency(winningBid * 0.015)}</span>
            </div>
            <div className="breakdown-row total">
              <span className="row-label"><strong>Total you'll pay</strong></span>
              <span className="row-value">
                <strong>${formatCurrency(winningBid + (winningBid * 0.015))}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="next-steps">
          <h3 className="steps-title">What's Next?</h3>
          <div className="steps-list">
            <div className="step-item">
              <span className="step-number">1</span>
              <div className="step-content">
                <div className="step-title">Payment Processing</div>
                <div className="step-description">
                  Your payment will be processed within 24 hours
                </div>
              </div>
            </div>
            <div className="step-item">
              <span className="step-number">2</span>
              <div className="step-content">
                <div className="step-title">Calendar Updated</div>
                <div className="step-description">
                  Your lease calendar will be updated with the new night
                </div>
              </div>
            </div>
            <div className="step-item">
              <span className="step-number">3</span>
              <div className="step-content">
                <div className="step-title">Confirmation Email</div>
                <div className="step-description">
                  You'll receive a confirmation with all details
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="announcement-actions">
          <button className="action-btn primary">
            View Updated Calendar
          </button>
          <button className="action-btn secondary">
            Download Receipt
          </button>
        </div>

      </div>
    );
  }

  // LOSER VIEW
  return (
    <div className="winner-announcement loser-view">

      {/* Loser Header */}
      <div className="announcement-header loser-header">
        <div className="result-icon">💰</div>
        <h1 className="announcement-title">Bidding Complete</h1>
        <p className="announcement-subtitle">
          {winner?.name} won the bidding for this night
        </p>
      </div>

      {/* Losing Details */}
      <div className="announcement-details">

        {/* Winning Bid */}
        <div className="detail-card">
          <div className="card-label">Winning Bid</div>
          <div className="card-value">
            ${formatCurrency(winningBid)}
          </div>
          <div className="card-sublabel">
            By {winner?.name}
          </div>
        </div>

        {/* Your Compensation */}
        <div className="detail-card primary compensation">
          <div className="card-label">Your Compensation</div>
          <div className="card-value highlight">
            +${formatCurrency(compensation)}
          </div>
          <div className="card-sublabel">
            25% of winning bid (no fees)
          </div>
        </div>

        {/* Your Last Bid */}
        {loser?.currentBid && loser.currentBid > 0 && (
          <div className="detail-card">
            <div className="card-label">Your Last Bid</div>
            <div className="card-value">
              ${formatCurrency(loser.currentBid)}
            </div>
            <div className="card-sublabel">
              Difference: ${formatCurrency(winningBid - loser.currentBid)}
            </div>
          </div>
        )}

      </div>

      {/* Compensation Explanation */}
      <div className="compensation-explanation">
        <h3 className="explanation-title">
          <span className="title-icon">ℹ️</span>
          About Your Compensation
        </h3>
        <p className="explanation-text">
          As part of our fair competitive bidding system, you receive 25% of the winning
          bid amount as compensation. This is automatically credited to your account with
          no fees deducted.
        </p>
        <div className="compensation-breakdown">
          <div className="breakdown-item">
            <span className="item-label">Compensation amount:</span>
            <span className="item-value">${formatCurrency(compensation)}</span>
          </div>
          <div className="breakdown-item">
            <span className="item-label">Platform fees:</span>
            <span className="item-value">$0.00</span>
          </div>
          <div className="breakdown-item total">
            <span className="item-label">You receive:</span>
            <span className="item-value">${formatCurrency(compensation)}</span>
          </div>
        </div>
      </div>

      {/* Alternative Options */}
      <div className="alternative-options">
        <h3 className="options-title">Other Options Available</h3>
        <div className="option-card">
          <div className="option-icon">🛏️</div>
          <div className="option-content">
            <div className="option-title">Crash Option</div>
            <div className="option-description">
              Share the space on {formatNightDate(targetNight)} for a reduced rate
            </div>
            <div className="option-price">
              ~${formatCurrency(winningBid * 0.4)} (40% of buyout)
            </div>
          </div>
          <button className="option-btn">
            Request Crash
          </button>
        </div>
      </div>

      {/* Next Steps */}
      <div className="next-steps">
        <h3 className="steps-title">What Happens Now?</h3>
        <div className="steps-list">
          <div className="step-item">
            <span className="step-number">1</span>
            <div className="step-content">
              <div className="step-title">Compensation Credited</div>
              <div className="step-description">
                ${formatCurrency(compensation)} will be added to your account within 24 hours
              </div>
            </div>
          </div>
          <div className="step-item">
            <span className="step-number">2</span>
            <div className="step-content">
              <div className="step-title">Calendar Unchanged</div>
              <div className="step-description">
                Your existing lease schedule remains the same
              </div>
            </div>
          </div>
          <div className="step-item">
            <span className="step-number">3</span>
            <div className="step-content">
              <div className="step-title">Explore Alternatives</div>
              <div className="step-description">
                Consider crash option or request a different night
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="announcement-actions">
        <button className="action-btn primary">
          View My Calendar
        </button>
        <button className="action-btn secondary">
          Request Different Night
        </button>
      </div>

    </div>
  );
};

/**
 * Format time ago
 */
function formatTimeAgo(timestamp: Date): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Format night date
 */
function formatNightDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export default WinnerAnnouncement;
