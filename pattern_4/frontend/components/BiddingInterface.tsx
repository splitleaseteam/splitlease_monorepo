/**
 * BIDDING INTERFACE COMPONENT
 *
 * Main UI for placing bids, viewing current status, and managing auto-bids.
 * Includes quick bid buttons, validation, and real-time updates.
 *
 * Features:
 * - Live bid amount input with validation
 * - Quick bid increment buttons
 * - Auto-bid (proxy bidding) setup
 * - Winning/losing status display
 * - Countdown timer
 * - Bidding history
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BiddingSession, Bid } from '../types/biddingTypes';
import { validateBid } from '../utils/biddingLogic';
import { BiddingHistory } from './BiddingHistory';
import { CountdownTimer } from './CountdownTimer';
import { formatCurrency } from '../utils/formatting';

interface BiddingInterfaceProps {
  session: BiddingSession;
  currentUserId: string;
  targetNight: Date;
  onPlaceBid: (amount: number, autoBidMax?: number) => Promise<void>;
  onWithdraw: () => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

export const BiddingInterface: React.FC<BiddingInterfaceProps> = ({
  session,
  currentUserId,
  targetNight,
  onPlaceBid,
  onWithdraw,
  isSubmitting,
  error
}) => {

  const [bidAmount, setBidAmount] = useState<string>('');
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [autoBidMax, setAutoBidMax] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate derived state
  const isUserHighBidder = useMemo(() => {
    return session.currentHighBid?.userId === currentUserId;
  }, [session.currentHighBid, currentUserId]);

  const otherParticipant = useMemo(() => {
    return session.participants.find(p => p.userId !== currentUserId);
  }, [session.participants, currentUserId]);

  const currentHigh = session.currentHighBid?.amount || 0;
  const minimumBid = currentHigh + session.minimumIncrement;
  const suggestedBid = Math.round(currentHigh * 1.15);

  const userBidCount = session.biddingHistory.filter(
    b => b.userId === currentUserId
  ).length;

  const canBid = session.status === 'active' &&
                 !isUserHighBidder &&
                 userBidCount < session.maxRounds;

  // Validate current bid input
  const validation = useMemo(() => {
    if (!bidAmount) return null;
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) return null;
    return validateBid(amount, session, currentUserId);
  }, [bidAmount, session, currentUserId]);

  // Auto-set suggested bid on mount
  useEffect(() => {
    if (canBid && !bidAmount) {
      setBidAmount(suggestedBid.toString());
    }
  }, [canBid, suggestedBid]);

  // Handle bid submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation?.valid) {
      return;
    }

    const amount = parseFloat(bidAmount);
    const maxAutoBid = autoBidEnabled && autoBidMax
      ? parseFloat(autoBidMax)
      : undefined;

    await onPlaceBid(amount, maxAutoBid);

    // Reset form
    setBidAmount('');
    setAutoBidEnabled(false);
    setAutoBidMax('');
  };

  // Quick bid buttons
  const handleQuickBid = (amount: number) => {
    setBidAmount(amount.toString());
  };

  return (
    <div className="bidding-interface">

      {/* Header */}
      <div className="bidding-header">
        <div className="competition-notice">
          <span className="icon">⚡</span>
          <span className="text">
            <strong>{otherParticipant?.name}</strong> also wants this date!
          </span>
        </div>
        <div className="bidding-status">
          {session.status === 'active' && (
            <span className="status-active">
              <span className="status-dot" />
              Live Bidding
            </span>
          )}
        </div>
      </div>

      {/* Current High Bid Display */}
      <div className={`current-bid ${isUserHighBidder ? 'you-winning' : 'them-winning'}`}>
        <div className="bid-label">Current High Bid</div>
        <div className="bid-amount">${formatCurrency(currentHigh)}</div>
        <div className="bid-holder">
          {isUserHighBidder ? (
            <span className="you-leading">
              <span className="trophy-icon">🏆</span>
              You're leading!
            </span>
          ) : (
            <span className="them-leading">
              {otherParticipant?.name} is leading
            </span>
          )}
        </div>
        {session.currentHighBid && (
          <div className="bid-time">
            Placed {formatTimeAgo(session.currentHighBid.timestamp)}
          </div>
        )}
      </div>

      {/* Time Remaining */}
      <div className="time-remaining-section">
        <div className="timer-label">Time Remaining</div>
        <CountdownTimer
          expiresAt={session.expiresAt}
          onExpire={() => console.log('Session expired')}
        />
      </div>

      {/* Bidding Form */}
      {canBid && (
        <form onSubmit={handleSubmit} className="bid-form">
          <div className="form-header">
            <h4>Place Your Bid</h4>
            <div className="minimum-notice">
              Minimum: ${formatCurrency(minimumBid)}
            </div>
          </div>

          {/* Bid Amount Input */}
          <div className="bid-input-group">
            <label htmlFor="bid-amount">Your Bid Amount</label>
            <div className="currency-input">
              <span className="currency-symbol">$</span>
              <input
                id="bid-amount"
                type="number"
                min={minimumBid}
                step={10}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={minimumBid.toString()}
                className={validation && !validation.valid ? 'invalid' : ''}
                disabled={isSubmitting}
              />
            </div>

            {/* Validation Errors */}
            {validation && !validation.valid && (
              <div className="validation-errors">
                {validation.errors.map((err, idx) => (
                  <div key={idx} className="error-message">
                    ⚠️ {err}
                  </div>
                ))}
              </div>
            )}

            {/* Validation Success */}
            {validation?.valid && (
              <div className="validation-success">
                ✓ Valid bid
              </div>
            )}

            {/* Quick Bid Buttons */}
            <div className="quick-bid-buttons">
              <button
                type="button"
                onClick={() => handleQuickBid(minimumBid)}
                className="quick-bid-btn"
              >
                Min (${formatCurrency(minimumBid)})
              </button>
              <button
                type="button"
                onClick={() => handleQuickBid(minimumBid + 100)}
                className="quick-bid-btn"
              >
                +$100
              </button>
              <button
                type="button"
                onClick={() => handleQuickBid(minimumBid + 250)}
                className="quick-bid-btn"
              >
                +$250
              </button>
              <button
                type="button"
                onClick={() => handleQuickBid(suggestedBid)}
                className="quick-bid-btn suggested"
              >
                Suggested (${formatCurrency(suggestedBid)})
              </button>
            </div>
          </div>

          {/* Auto-Bid Section */}
          <div className="auto-bid-section">
            <label className="auto-bid-toggle">
              <input
                type="checkbox"
                checked={autoBidEnabled}
                onChange={(e) => setAutoBidEnabled(e.target.checked)}
              />
              <span className="toggle-label">
                Enable Auto-Bid (max amount)
              </span>
              <span className="info-icon" title="Automatically bid up to your max if outbid">
                ℹ️
              </span>
            </label>

            {autoBidEnabled && (
              <div className="max-bid-input-group">
                <label htmlFor="max-autobid">Maximum Auto-Bid</label>
                <div className="currency-input">
                  <span className="currency-symbol">$</span>
                  <input
                    id="max-autobid"
                    type="number"
                    min={minimumBid + session.minimumIncrement}
                    step={50}
                    value={autoBidMax}
                    onChange={(e) => setAutoBidMax(e.target.value)}
                    placeholder={(minimumBid + 500).toString()}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="auto-bid-explainer">
                  We'll automatically bid up to ${autoBidMax || '___'} if {otherParticipant?.name} bids higher.
                  Works like eBay proxy bidding.
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-bid-btn"
            disabled={!validation?.valid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Submitting...
              </>
            ) : (
              <>
                Submit Bid ${bidAmount || '___'}
              </>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="submission-error">
              <span className="error-icon">❌</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          {/* Advanced Options */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="advanced-toggle"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="advanced-options">
              <button
                type="button"
                onClick={onWithdraw}
                className="withdraw-btn"
              >
                Withdraw from Bidding
              </button>
              <p className="withdraw-warning">
                ⚠️ You won't be able to re-enter this session
              </p>
            </div>
          )}
        </form>
      )}

      {/* Winning Status */}
      {isUserHighBidder && session.status === 'active' && (
        <div className="winning-status">
          <div className="winning-banner">
            <span className="trophy-icon">🏆</span>
            You have the high bid!
          </div>
          <p className="winning-message">
            You'll win automatically if no one bids higher before the timer ends.
          </p>
          <div className="winning-details">
            <div className="detail-row">
              <span className="detail-label">You'll pay:</span>
              <span className="detail-value">
                ${formatCurrency(currentHigh)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">
                {otherParticipant?.name} will receive:
              </span>
              <span className="detail-value">
                ${formatCurrency(Math.round(currentHigh * 0.25))} compensation
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cannot Bid Status */}
      {!canBid && !isUserHighBidder && (
        <div className="cannot-bid-notice">
          {userBidCount >= session.maxRounds ? (
            <>
              <span className="notice-icon">🚫</span>
              <span className="notice-text">
                You've reached the maximum of {session.maxRounds} bids.
              </span>
            </>
          ) : session.status !== 'active' ? (
            <>
              <span className="notice-icon">⏸️</span>
              <span className="notice-text">
                Bidding has ended.
              </span>
            </>
          ) : null}
        </div>
      )}

      {/* Bidding History */}
      <BiddingHistory
        history={session.biddingHistory}
        currentUserId={currentUserId}
        participants={session.participants}
      />

    </div>
  );
};

/**
 * Format timestamp as "5m ago"
 */
function formatTimeAgo(timestamp: Date): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export default BiddingInterface;
