/**
 * BIDDING INTERFACE COMPONENT
 *
 * Main UI for Pattern 4 competitive bidding between Big Spenders.
 * Handles bid placement, auto-bid management, and real-time updates.
 *
 * Features:
 * - Real-time bid updates via Supabase Realtime
 * - Manual bid placement with validation
 * - Auto-bid (proxy bidding) setup
 * - Countdown timer
 * - Bid history
 * - Winner/loser status display
 *
 * @module BiddingInterface
 * @version 1.0.0
 */

import { useState, useEffect, useMemo } from 'react';
import { useBiddingRealtime } from '../../../hooks/useBiddingRealtime.js';
import { canUserBid } from '../../../logic/bidding/rules/canUserBid.js';
import { isBidValid } from '../../../logic/bidding/rules/isBidValid.js';
import { calculateLoserCompensation } from '../../../logic/bidding/calculators/calculateCompensation.js';
import CountdownTimer from './CountdownTimer.jsx';
import BiddingHistory from './BiddingHistory.jsx';
import './BiddingInterface.css';

/**
 * Format currency for display
 */
function formatCurrency(amount) {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Bidding Interface Component
 *
 * @param {Object} props
 * @param {string} props.sessionId - Bidding session ID
 * @param {string} props.currentUserId - Current user's Bubble ID
 * @param {Date} props.targetNight - Night being competed for
 * @param {Function} [props.onClose] - Close callback
 * @param {Function} [props.onSessionEnd] - Session end callback
 */
export default function BiddingInterface({
  sessionId,
  currentUserId,
  _targetNight,
  onClose,
  onSessionEnd
}) {
  const {
    session,
    placeBid,
    setMaxAutoBid,
    withdrawBid,
    connectionStatus,
    error: realtimeError
  } = useBiddingRealtime(sessionId, currentUserId);

  const [bidAmount, setBidAmount] = useState('');
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [autoBidMax, setAutoBidMax] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Derived state
  const isUserHighBidder = useMemo(() => {
    return session?.currentHighBid?.userId === currentUserId;
  }, [session?.currentHighBid, currentUserId]);

  const otherParticipant = useMemo(() => {
    return session?.participants?.find(p => p.userId !== currentUserId);
  }, [session?.participants, currentUserId]);

  const currentHigh = session?.currentHighBid?.amount || 0;
  const minimumBid = currentHigh + (session?.minimumIncrement || 0);
  const suggestedBid = currentHigh > 0 ? Math.round(currentHigh * 1.15) : minimumBid;

  const userBidCount = session?.biddingHistory?.filter(b => b.userId === currentUserId).length || 0;

  const { canBid, reason: cannotBidReason } = session
    ? canUserBid({ session, userId: currentUserId })
    : { canBid: false, reason: 'Loading session...' };

  // Validate current bid input
  const validation = useMemo(() => {
    if (!bidAmount || !session) return null;
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) return null;
    return isBidValid({ proposedBid: amount, session, userId: currentUserId });
  }, [bidAmount, session, currentUserId]);

  // Auto-set suggested bid on mount
  useEffect(() => {
    if (canBid && !bidAmount && suggestedBid > 0) {
      setBidAmount(suggestedBid.toString());
    }
  }, [canBid, suggestedBid, bidAmount]);

  // Handle session end
  useEffect(() => {
    if (session?.status === 'completed' && onSessionEnd) {
      onSessionEnd(session);
    }
  }, [session?.status, onSessionEnd]);

  // Handle bid submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validation?.valid) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const amount = parseFloat(bidAmount);
      const maxAutoBid = autoBidEnabled && autoBidMax ? parseFloat(autoBidMax) : undefined;

      await placeBid(amount, maxAutoBid);

      // Reset form
      setBidAmount('');
      setAutoBidEnabled(false);
      setAutoBidMax('');
    } catch (err) {
      console.error('[BiddingInterface] Bid submission error:', err);
      setSubmitError(err.message || 'Failed to place bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick bid buttons
  const handleQuickBid = (amount) => {
    setBidAmount(amount.toString());
  };

  // Withdraw handler
  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw? You cannot re-enter this session.')) {
      return;
    }

    try {
      await withdrawBid();
      if (onClose) onClose();
    } catch (err) {
      console.error('[BiddingInterface] Withdraw error:', err);
      setSubmitError(err.message || 'Failed to withdraw');
    }
  };

  // Loading state
  if (!session || connectionStatus === 'connecting') {
    return (
      <div className="bidding-interface bidding-interface--loading">
        <div className="bidding-interface__spinner" />
        <p>Connecting to bidding session...</p>
      </div>
    );
  }

  // Error state
  if (connectionStatus === 'error' || realtimeError) {
    return (
      <div className="bidding-interface bidding-interface--error">
        <span className="bidding-interface__error-icon">❌</span>
        <p>Connection error: {realtimeError?.message || 'Failed to connect'}</p>
        <button onClick={onClose} className="bidding-interface__close-btn">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bidding-interface">
      {/* Header */}
      <div className="bidding-interface__header">
        <div className="bidding-interface__competition-notice">
          <span className="bidding-interface__icon">⚡</span>
          <span className="bidding-interface__text">
            <strong>{otherParticipant?.name || 'Another user'}</strong> also wants this date!
          </span>
        </div>

        <div className="bidding-interface__status">
          {session.status === 'active' && (
            <span className="bidding-interface__status-active">
              <span className="bidding-interface__status-dot" />
              Live Bidding
            </span>
          )}
          {session.status === 'completed' && (
            <span className="bidding-interface__status-completed">
              Session Ended
            </span>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="bidding-interface__close-btn"
            aria-label="Close bidding interface"
          >
            ✕
          </button>
        )}
      </div>

      {/* Current High Bid Display */}
      <div className={`bidding-interface__current-bid ${isUserHighBidder ? 'bidding-interface__current-bid--you-winning' : 'bidding-interface__current-bid--them-winning'}`}>
        <div className="bidding-interface__bid-label">Current High Bid</div>
        <div className="bidding-interface__bid-amount">${formatCurrency(currentHigh)}</div>
        <div className="bidding-interface__bid-holder">
          {isUserHighBidder ? (
            <span className="bidding-interface__you-leading">
              <span className="bidding-interface__trophy-icon">🏆</span>
              You&apos;re leading!
            </span>
          ) : (
            <span className="bidding-interface__them-leading">
              {otherParticipant?.name || 'Opponent'} is leading
            </span>
          )}
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="bidding-interface__timer-section">
        <div className="bidding-interface__timer-label">Time Remaining</div>
        <CountdownTimer
          expiresAt={session.expiresAt}
          onExpire={() => console.log('[BiddingInterface] Session expired')}
        />
      </div>

      {/* Bidding Form */}
      {canBid && session.status === 'active' && (
        <form onSubmit={handleSubmit} className="bidding-interface__bid-form">
          <div className="bidding-interface__form-header">
            <h4>Place Your Bid</h4>
            <div className="bidding-interface__minimum-notice">
              Minimum: ${formatCurrency(minimumBid)}
            </div>
          </div>

          {/* Bid Amount Input */}
          <div className="bidding-interface__bid-input-group">
            <label htmlFor="bid-amount">Your Bid Amount</label>
            <div className="bidding-interface__currency-input">
              <span className="bidding-interface__currency-symbol">$</span>
              <input
                id="bid-amount"
                type="number"
                min={minimumBid}
                step={10}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={minimumBid.toString()}
                className={validation && !validation.valid ? 'bidding-interface__input--invalid' : ''}
                disabled={isSubmitting}
              />
            </div>

            {/* Validation Errors */}
            {validation && !validation.valid && (
              <div className="bidding-interface__validation-errors">
                {validation.errors.map((err, idx) => (
                  <div key={idx} className="bidding-interface__error-message">
                    ⚠️ {err}
                  </div>
                ))}
              </div>
            )}

            {/* Validation Success */}
            {validation?.valid && (
              <div className="bidding-interface__validation-success">
                ✓ Valid bid
              </div>
            )}

            {/* Quick Bid Buttons */}
            <div className="bidding-interface__quick-bid-buttons">
              <button
                type="button"
                onClick={() => handleQuickBid(minimumBid)}
                className="bidding-interface__quick-bid-btn"
              >
                Min (${formatCurrency(minimumBid)})
              </button>
              <button
                type="button"
                onClick={() => handleQuickBid(minimumBid + 100)}
                className="bidding-interface__quick-bid-btn"
              >
                +$100
              </button>
              <button
                type="button"
                onClick={() => handleQuickBid(minimumBid + 250)}
                className="bidding-interface__quick-bid-btn"
              >
                +$250
              </button>
              <button
                type="button"
                onClick={() => handleQuickBid(suggestedBid)}
                className="bidding-interface__quick-bid-btn bidding-interface__quick-bid-btn--suggested"
              >
                Suggested (${formatCurrency(suggestedBid)})
              </button>
            </div>
          </div>

          {/* Auto-Bid Section */}
          <div className="bidding-interface__auto-bid-section">
            <label className="bidding-interface__auto-bid-toggle">
              <input
                type="checkbox"
                checked={autoBidEnabled}
                onChange={(e) => setAutoBidEnabled(e.target.checked)}
              />
              <span className="bidding-interface__toggle-label">
                Enable Auto-Bid (max amount)
              </span>
              <span className="bidding-interface__info-icon" title="Automatically bid up to your max if outbid">
                ℹ️
              </span>
            </label>

            {autoBidEnabled && (
              <div className="bidding-interface__max-bid-input-group">
                <label htmlFor="max-autobid">Maximum Auto-Bid</label>
                <div className="bidding-interface__currency-input">
                  <span className="bidding-interface__currency-symbol">$</span>
                  <input
                    id="max-autobid"
                    type="number"
                    min={minimumBid + (session.minimumIncrement || 0)}
                    step={50}
                    value={autoBidMax}
                    onChange={(e) => setAutoBidMax(e.target.value)}
                    placeholder={(minimumBid + 500).toString()}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="bidding-interface__auto-bid-explainer">
                  We&apos;ll automatically bid up to ${autoBidMax || '___'} if {otherParticipant?.name} bids higher. Works like eBay proxy bidding.
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bidding-interface__submit-bid-btn"
            disabled={!validation?.valid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="bidding-interface__spinner" />
                Submitting...
              </>
            ) : (
              <>
                Submit Bid ${bidAmount || '___'}
              </>
            )}
          </button>

          {/* Error Display */}
          {submitError && (
            <div className="bidding-interface__submission-error">
              <span className="bidding-interface__error-icon">❌</span>
              <span className="bidding-interface__error-text">{submitError}</span>
            </div>
          )}

          {/* Advanced Options */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="bidding-interface__advanced-toggle"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="bidding-interface__advanced-options">
              <button
                type="button"
                onClick={handleWithdraw}
                className="bidding-interface__withdraw-btn"
              >
                Withdraw from Bidding
              </button>
              <p className="bidding-interface__withdraw-warning">
                ⚠️ You won&apos;t be able to re-enter this session
              </p>
            </div>
          )}
        </form>
      )}

      {/* Winning Status */}
      {isUserHighBidder && session.status === 'active' && (
        <div className="bidding-interface__winning-status">
          <div className="bidding-interface__winning-banner">
            <span className="bidding-interface__trophy-icon">🏆</span>
            You have the high bid!
          </div>
          <p className="bidding-interface__winning-message">
            You&apos;ll win automatically if no one bids higher before the timer ends.
          </p>
          <div className="bidding-interface__winning-details">
            <div className="bidding-interface__detail-row">
              <span className="bidding-interface__detail-label">You&apos;ll pay:</span>
              <span className="bidding-interface__detail-value">
                ${formatCurrency(currentHigh)}
              </span>
            </div>
            <div className="bidding-interface__detail-row">
              <span className="bidding-interface__detail-label">
                {otherParticipant?.name} will receive:
              </span>
              <span className="bidding-interface__detail-value">
                ${formatCurrency(calculateLoserCompensation({ winningBid: currentHigh }))} compensation
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cannot Bid Status */}
      {!canBid && session.status === 'active' && (
        <div className="bidding-interface__cannot-bid-notice">
          <span className="bidding-interface__notice-icon">🚫</span>
          <span className="bidding-interface__notice-text">{cannotBidReason}</span>
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
}
