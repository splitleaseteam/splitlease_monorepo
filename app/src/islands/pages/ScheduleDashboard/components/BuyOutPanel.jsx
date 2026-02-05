/**
 * Buy Out Panel Component - Compact UI with "Guidance via Friction"
 *
 * Core Philosophy:
 * - Defaults Matter: Pre-fill the "Fair" price
 * - Friction as Guidance: Make "fair" easy, "lowballing" harder
 * - Progressive Disclosure: Only show math (fees/breakdown) on hover
 *
 * Information Architecture:
 * Layer 1 (Visible): Date context, Price knob, Feedback, Send button
 * Layer 2 (On Hover): Fee breakdown tooltip, Price context tooltip
 * Layer 3 (Expandable): Flexibility comparison, Notes
 *
 * Flexibility Lever Logic:
 * - Delta = MyScore - RoommateScore
 * - If Delta < 0 (less flexible): -10% button is ghost/muted, shows warning
 * - If Delta >= 2 (more flexible): -10% button is normal, green feedback
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useFeeCalculation } from '../../../../logic/hooks/useFeeCalculation';
import { calculateTransactionFee, calculatePaymentBreakdown } from '../../../../logic/calculators/feeCalculations';
import BuyoutFormulaSettings from './BuyoutFormulaSettings.jsx';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_MESSAGE_LENGTH = 200;
const FLEXIBILITY_THRESHOLD = 2; // Delta needed for "earned" discounts
const SWAP_FEE = 5.00; // Flat swap fee
const SHARE_FEE = 5.00; // Flat share fee

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse a date string or Date object to a readable format
 */
function formatSelectedDate(date) {
  if (!date) return '';

  const dateObj = typeof date === 'string'
    ? new Date(date + 'T12:00:00') // Add time to avoid timezone issues
    : date;

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Compact date format for header (e.g., "Feb 19")
 */
function formatCompactDate(date) {
  if (!date) return '';

  const dateObj = typeof date === 'string'
    ? new Date(date + 'T12:00:00')
    : date;

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Calculate flexibility delta and determine discount eligibility
 * @param {number} myScore - Current user's flexibility score
 * @param {number} roommateScore - Roommate's flexibility score
 * @returns {{ delta: number, canDiscount: boolean, warning: string|null }}
 */
function getFlexibilityContext(myScore, roommateScore) {
  const delta = (myScore || 0) - (roommateScore || 0);
  const canDiscount = delta >= FLEXIBILITY_THRESHOLD;

  let warning = null;
  if (delta < 0 && roommateScore && myScore) {
    warning = `${roommateScore > myScore ? 'They\'re' : 'You\'re'} more flexible (${roommateScore}/10 vs ${myScore}/10). Discounts discouraged.`;
  }

  return { delta, canDiscount, warning };
}

/**
 * Generate transparent action button text showing full fee equation
 * - Buyout: "Send Offer ($132 + $2 fee = $134)"
 * - Swap: "Send Swap Request ($5 fee)"
 * - Share: "Send Share Request"
 */
function getActionButtonText(transactionType, baseAmount, feeAmount, totalAmount) {
  if (transactionType === 'share') {
    return `Send Share Request ($${SHARE_FEE.toFixed(0)} fee)`;
  }

  if (transactionType === 'swap') {
    return `Send Swap Request ($${SWAP_FEE.toFixed(0)} fee)`;
  }

  // Buyout: Show full equation
  const base = Number.isFinite(baseAmount) && baseAmount % 1 === 0
    ? baseAmount.toFixed(0)
    : baseAmount.toFixed(2);
  const fee = Number.isFinite(feeAmount) ? feeAmount.toFixed(2) : '0.00';
  const total = Number.isFinite(totalAmount) ? totalAmount.toFixed(2) : '0.00';

  return `Send Offer ($${base} + $${fee} fee = $${total})`;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Loading spinner
 */
function LoadingSpinner() {
  return (
    <span className="buyout-panel__spinner" aria-hidden="true">
      <span className="buyout-panel__spinner-circle" />
    </span>
  );
}

/**
 * Hover tooltip for fee breakdown (Layer 2 disclosure)
 * Shows different fee structures based on transaction type:
  * - Buyout: 1.5% per party
  * - Swap: $5 flat (initiator only)
  * - Share: $5 flat (initiator only)
 */
function FeeTooltip({ feeBreakdown, transactionType = 'buyout', roommateName = 'Roommate', children }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);

  // Calculate transaction-specific fees
  const transactionFees = useMemo(() => {
    if (!feeBreakdown?.basePrice) return null;
    return calculatePaymentBreakdown(transactionType, feeBreakdown.basePrice);
  }, [feeBreakdown?.basePrice, transactionType]);

  if (!feeBreakdown) return children;

  // Share: $5 flat fee (initiator only)
  if (transactionType === 'share') {
    return (
      <div
        className="buyout-panel__tooltip-wrapper"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        ref={tooltipRef}
      >
        {children}
        {showTooltip && (
          <div className="buyout-panel__tooltip" role="tooltip">
            <div className="buyout-panel__tooltip-row">
              <span>Fee</span>
              <span>$5.00</span>
            </div>
            <div className="buyout-panel__tooltip-divider" />
            <div className="buyout-panel__tooltip-row buyout-panel__tooltip-row--note">
              <span>Fee: $5.00 (you pay)</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Swap: $5 flat fee (initiator only)
  if (transactionType === 'swap') {
    return (
      <div
        className="buyout-panel__tooltip-wrapper"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        ref={tooltipRef}
      >
        {children}
        {showTooltip && (
          <div className="buyout-panel__tooltip" role="tooltip">
            <div className="buyout-panel__tooltip-row">
              <span>Fee</span>
              <span>$5.00</span>
            </div>
            <div className="buyout-panel__tooltip-divider" />
            <div className="buyout-panel__tooltip-row buyout-panel__tooltip-row--note">
              <span>Fee: $5.00 (you pay)</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Buyout: 1.5% per party
  return (
    <div
      className="buyout-panel__tooltip-wrapper"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      ref={tooltipRef}
    >
      {children}
      {showTooltip && transactionFees && (
        <div className="buyout-panel__tooltip" role="tooltip">
          <div className="buyout-panel__tooltip-row">
            <span>Base Offer</span>
            <span>${transactionFees.baseAmount.toFixed(2)}</span>
          </div>
          <div className="buyout-panel__tooltip-row">
            <span>Your Fee (1.5%)</span>
            <span>${transactionFees.fees.requestorFee.toFixed(2)}</span>
          </div>
          <div className="buyout-panel__tooltip-divider" />
          <div className="buyout-panel__tooltip-row buyout-panel__tooltip-row--total">
            <span>You Pay</span>
            <span>${transactionFees.requestorPays.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Price breakdown display - shows fee structure based on transaction type
  * - Buyout: 1.5% per party
  * - Swap: $5 flat (initiator only)
  * - Share: $5 flat (initiator only)
 */
function PriceBreakdown({ feeBreakdown, isCalculating, transactionType = 'buyout', roommateName = 'Roommate', priceLabel = 'Base offer' }) {
  if (isCalculating) {
    return (
      <div className="buyout-panel__pricing buyout-panel__pricing--loading">
        <LoadingSpinner />
        <span>Calculating...</span>
      </div>
    );
  }

  if (!feeBreakdown) {
    return null;
  }

  // Share: $5 flat fee (initiator only)
  if (transactionType === 'share') {
    return (
      <div className="buyout-panel__pricing">
        <div className="buyout-panel__price-row">
          <span>Share Fee</span>
          <span>$5.00</span>
        </div>
        <div className="buyout-panel__price-row buyout-panel__price-row--note">
          <span>(Fee: $5.00 you pay)</span>
        </div>
      </div>
    );
  }

  // Swap: $5 flat fee (initiator only)
  if (transactionType === 'swap') {
    return (
      <div className="buyout-panel__pricing">
        <div className="buyout-panel__price-row">
          <span>Swap Fee</span>
          <span>$5.00</span>
        </div>
        <div className="buyout-panel__price-row buyout-panel__price-row--note">
          <span>(Fee: $5.00 you pay)</span>
        </div>
      </div>
    );
  }

  // Buyout: 1.5% per party
  const transactionFees = calculatePaymentBreakdown(transactionType, feeBreakdown.basePrice);

  return (
    <div className="buyout-panel__pricing">
      <div className="buyout-panel__price-row">
        <span>{priceLabel}</span>
        <span>${transactionFees.baseAmount.toFixed(2)}</span>
      </div>
      <div className="buyout-panel__price-row">
        <span>Your Fee (1.5%)</span>
        <span>${transactionFees.fees.requestorFee.toFixed(2)}</span>
      </div>
      <div className="buyout-panel__price-row buyout-panel__price-row--divider" aria-hidden="true" />
      <div className="buyout-panel__price-row buyout-panel__price-row--total">
        <span>You Pay</span>
        <span>${transactionFees.requestorPays.toFixed(2)}</span>
      </div>
      <div className="buyout-panel__price-row buyout-panel__price-row--note">
        <span>({roommateName} also pays ${transactionFees.fees.recipientFee.toFixed(2)} fee)</span>
      </div>
    </div>
  );
}

/**
 * Counter-Offer Content - Respond to incoming request with different price
 */
function CounterOfferContent({ requestData, onCounterOffer, onCancel, isSubmitting }) {
  const [counterPrice, setCounterPrice] = useState(requestData.offeredPrice || 0);

  const deviation = requestData.suggestedPrice
    ? (((counterPrice - requestData.suggestedPrice) / requestData.suggestedPrice) * 100).toFixed(0)
    : 0;

  const handleSubmit = () => {
    if (counterPrice <= 0) return;
    onCounterOffer(counterPrice);
  };

  return (
    <div className="counter-offer-content">
      <h4 className="counter-offer-content__title">Counter This Request</h4>

      <div className="counter-offer-content__comparison">
        <div className="counter-offer-content__price-row">
          <span className="counter-offer-content__label">They offered:</span>
          <span className="counter-offer-content__value">${requestData.offeredPrice?.toFixed(2)}</span>
        </div>
        <div className="counter-offer-content__price-row">
          <span className="counter-offer-content__label">You suggested:</span>
          <span className="counter-offer-content__value">${requestData.suggestedPrice?.toFixed(2)}</span>
        </div>
        {deviation !== '0' && (
          <div className="counter-offer-content__deviation">
            {deviation > 0 ? `+${deviation}` : deviation}% from your suggestion
          </div>
        )}
      </div>

      <div className="counter-offer-content__input-section">
        <label className="counter-offer-content__input-label">Your counter-offer:</label>
        <div className="counter-offer-content__input-row">
          <span className="counter-offer-content__currency">$</span>
          <input
            type="number"
            className="counter-offer-content__input"
            value={counterPrice}
            onChange={(e) => setCounterPrice(Number(e.target.value))}
            min={0}
            step={5}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="counter-offer-content__actions">
        <button
          type="button"
          className="counter-offer-content__btn counter-offer-content__btn--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="counter-offer-content__btn counter-offer-content__btn--primary"
          onClick={handleSubmit}
          disabled={isSubmitting || counterPrice <= 0}
        >
          {isSubmitting ? 'Sending...' : 'Send Counter-Offer'}
        </button>
      </div>
    </div>
  );
}

/**
 * Swap Mode Content - Select a night to offer in exchange
 */
function SwapModeContent({
  mode = 'swap',
  requestedNight,
  roommateName,
  availableNights,
  selectedOfferNight,
  onSelectOffer,
  onSubmit,
  onCancel,
  isSubmitting
}) {
  const [message, setMessage] = useState('');
  const isCounter = mode === 'counter';

  const formattedRequestedDate = formatSelectedDate(requestedNight);

  // Filter user nights to only show upcoming, non-pending nights
  const selectableNights = (availableNights || [])
    .filter(night => {
      const nightDate = new Date(night + 'T12:00:00');
      return nightDate >= new Date();
    })
    .slice(0, 8);

  const handleSubmit = async () => {
    if (!selectedOfferNight || isSubmitting) return;
    try {
      await onSubmit(message);
    } catch (err) {
      console.error('Swap request failed:', err);
    }
  };

  const formatNightOption = (nightString) => {
    const date = new Date(nightString + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="buyout-panel__swap-mode">
      <h3 className="buyout-panel__heading">
        {isCounter ? 'Counter with a Swap' : 'Swap'}
      </h3>

      {/* Swap Visualization */}
      <div className="buyout-panel__swap-visual">
        {/* Their Night (Requesting) */}
        <div className="buyout-panel__swap-card buyout-panel__swap-card--theirs">
          <span className="buyout-panel__swap-label">
            {isCounter ? 'You give' : 'Requesting'}
          </span>
          <span className="buyout-panel__swap-date">{formattedRequestedDate}</span>
          <span className="buyout-panel__swap-owner">
            {isCounter ? 'Your night' : `${roommateName}'s night`}
          </span>
        </div>

        {/* Arrow */}
        <div className="buyout-panel__swap-arrow" aria-hidden="true">
          &#x21C4;
        </div>

        {/* Your Night (Offering) */}
        <div className={`buyout-panel__swap-card buyout-panel__swap-card--yours ${selectedOfferNight ? 'buyout-panel__swap-card--selected' : ''}`}>
          <span className="buyout-panel__swap-label">
            {isCounter ? 'You receive' : 'Offering'}
          </span>
          {selectedOfferNight ? (
            <>
              <span className="buyout-panel__swap-date">{formatNightOption(selectedOfferNight)}</span>
              <span className="buyout-panel__swap-owner">
                {isCounter ? `${roommateName}'s night` : 'Your night'}
              </span>
            </>
          ) : (
            <span className="buyout-panel__swap-placeholder">Select below</span>
          )}
        </div>
      </div>

      {/* Select Night to Offer */}
      <div className="buyout-panel__swap-selection">
        <label className="buyout-panel__swap-selection-label">
          {isCounter ? 'Select a night to receive:' : 'Select one of your nights to offer:'}
        </label>
        <div className="buyout-panel__swap-nights">
          {selectableNights.length > 0 ? (
            selectableNights.map(night => (
              <button
                key={night}
                type="button"
                className={`buyout-panel__swap-night-btn ${selectedOfferNight === night ? 'buyout-panel__swap-night-btn--selected' : ''}`}
                onClick={() => onSelectOffer(night)}
                disabled={isSubmitting}
              >
                {formatNightOption(night)}
              </button>
            ))
          ) : (
            <p className="buyout-panel__swap-no-nights">
              {isCounter ? 'No nights available to swap.' : 'No upcoming nights available to offer.'}
            </p>
          )}
        </div>
      </div>

      {/* Swap Fee Info */}
      <div className="buyout-panel__swap-info">
        <span className="buyout-panel__swap-info-icon" aria-hidden="true">&#x1F4B0;</span>
        <span>Swap Fee: $5.00 (split $2.50 each)</span>
      </div>

      {/* Message Input (optional) */}
      <div className="buyout-panel__message">
        <label htmlFor="swap-message" className="buyout-panel__message-label">
          Add a note (optional)
        </label>
        <textarea
          id="swap-message"
          className="buyout-panel__message-input"
          placeholder="e.g., Would this date work for you?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={200}
          disabled={isSubmitting}
        />
      </div>

      {/* Actions */}
      <div className="buyout-panel__actions">
        <button
          type="button"
          className="buyout-panel__btn buyout-panel__btn--primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedOfferNight}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              Sending Request...
            </>
          ) : (
            isCounter ? 'Send Counter Offer' : 'Send Swap Request'
          )}
        </button>

        <button
          type="button"
          className="buyout-panel__btn buyout-panel__btn--ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Request Type Toggle Tabs
 */
function RequestTypeTabs({ activeType, onTypeChange, disabled }) {
  const types = [
    { key: 'buyout', label: 'Buyout' },
    { key: 'swap', label: 'Swap' },
    { key: 'share', label: 'Share' }
  ];

  return (
    <div className="buyout-panel__type-tabs" role="tablist">
      {types.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={activeType === key}
          className={`buyout-panel__type-tab ${activeType === key ? 'buyout-panel__type-tab--active' : ''}`}
          onClick={() => onTypeChange(key)}
          disabled={disabled}
        >
          <span className="buyout-panel__type-tab-label">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default function BuyOutPanel({
  selectedDate,
  roommateName = 'Roommate',
  basePrice,
  onBuyOut,
  onShareRequest,
  onSwapInstead,
  onCancel,
  isSubmitting = false,
  compact = false,
  // Flexibility Score props (for "Guidance via Friction")
  myFlexibilityScore = null,
  roommateFlexibilityScore = null,
  // Request Type props
  requestType = 'buyout',
  onRequestTypeChange,
  // Swap Mode props
  isSwapMode = false,
  isCounterMode = false,
  swapOfferNight = null,
  userNights = [],
  roommateNights = [],
  counterOriginalNight = null,
  counterTargetNight = null,
  onSelectSwapOffer,
  onSubmitSwapRequest,
  onSelectCounterNight,
  onSubmitCounterRequest,
  // Buyout Settings props
  buyoutPreferences,
  isBuyoutSettingsOpen = false,
  isSavingPreferences = false,
  computedSuggestedPrices = [],
  onToggleBuyoutSettings,
  onBuyoutPreferenceChange,
  onSaveBuyoutPreferences,
  onResetBuyoutPreferences,
  // Lease type props for conditional labels
  lease = null, // { isCoTenant: bool, isGuestHost: bool, userRole: 'guest' | 'host' }
  guestName = null, // Guest's first name (for host view)
  hostName = null // Host's first name (for guest view)
}) {
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSwapSuccess, setShowSwapSuccess] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  // Compute labels based on lease type
  const counterpartyLabel = useMemo(() => {
    if (!lease || lease.isCoTenant) {
      return roommateName || 'Roommate';
    }
    // Guest-host lease
    if (lease.userRole === 'guest') {
      return hostName ? `Host (${hostName})` : 'Host';
    }
    return guestName ? `Guest (${guestName})` : 'Guest';
  }, [lease, roommateName, guestName, hostName]);

  const panelLabels = useMemo(() => {
    if (!lease || lease.isCoTenant) {
      return {
        emptyTitle: 'Select a Night',
        emptyText: 'Click on an available night in the calendar to request a buyout from your co-tenant.',
        successText: `Waiting for ${counterpartyLabel}'s response. You'll be notified when they respond.`,
        selectedOwner: `Currently held by ${counterpartyLabel}`,
        actionLabel: 'Buy Out Night'
      };
    }
    // Guest-host lease
    if (lease.userRole === 'guest') {
      return {
        emptyTitle: 'Request Date Change',
        emptyText: 'Select a night to request a change from your host.',
        successText: `Waiting for ${counterpartyLabel}'s response. You'll be notified when they respond.`,
        selectedOwner: `Host's night`,
        actionLabel: 'Request Night Change'
      };
    }
    // Host view
    return {
      emptyTitle: 'Review Booking',
      emptyText: `Select a guest's booking to review or respond.`,
      successText: `Response sent to ${counterpartyLabel}.`,
      selectedOwner: `${counterpartyLabel}'s booking`,
      actionLabel: 'Accept/Decline Booking'
    };
  }, [lease, counterpartyLabel]);
  const [customPrice, setCustomPrice] = useState(null);
  const [showNote, setShowNote] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [hasUsedDiscountStep, setHasUsedDiscountStep] = useState(false);
  const [showDiscountWarning, setShowDiscountWarning] = useState(false);
  const [showFeedbackDetail, setShowFeedbackDetail] = useState(false);

  // Flexibility context for smart -10% button
  const flexibilityContext = getFlexibilityContext(myFlexibilityScore, roommateFlexibilityScore);

  // When basePrice changes, reset customPrice to null (use suggested)
  useEffect(() => {
    setCustomPrice(null);
  }, [basePrice]);

  // Use the fee calculation hook - pass requestType for potential future different fee structures
  const priceForFees = requestType === 'share'
    ? basePrice
    : (customPrice ?? basePrice);

  const { feeBreakdown, isCalculating, error: feeError } = useFeeCalculation(
    priceForFees,
    requestType === 'share' ? 'share' : 'date_change',
    { autoCalculate: true }
  );

  const formattedDate = formatSelectedDate(selectedDate);
  const remainingChars = MAX_MESSAGE_LENGTH - message.length;
  const suggestedPrice = feeBreakdown?.basePrice ?? basePrice ?? 0;
  const offerPrice = customPrice ?? suggestedPrice;
  const stepAmount = suggestedPrice ? Math.round(suggestedPrice * 0.1) : 0;
  const transactionFees = calculatePaymentBreakdown(requestType, offerPrice || 0);
  const totalOfferPrice = transactionFees.requestorPays ?? offerPrice ?? 0;

  const getOfferFeedback = () => {
    if (!suggestedPrice) return null;
    const deviation = (offerPrice - suggestedPrice) / suggestedPrice;
    if (Math.abs(deviation) < 0.02) {
      return { label: `Matches ${roommateName}'s suggestion`, tone: 'fair' };
    }
    const percent = Math.round(Math.abs(deviation) * 100);
    if (deviation < 0) {
      return { label: `${percent}% below suggestion`, tone: 'low' };
    }
    return { label: `${percent}% above suggestion`, tone: 'fair' };
  };

  const offerFeedback = getOfferFeedback();

  // Determine which content state to show
  const showEmpty = !selectedDate && !showSuccess && !showSwapSuccess && !showShareSuccess;
  const showSuccessState = showSuccess;
  const showSwapSuccessState = showSwapSuccess;
  const showShareSuccessState = showShareSuccess;
  const showActivePanel = !showEmpty && !showSuccessState && !showSwapSuccessState && !showShareSuccessState && !isSwapMode && !isCounterMode;
  const showSwapPanel = (isSwapMode || isCounterMode) && !showSwapSuccessState;

  /**
   * Handle buy out submission
   * Passes message and calculated totalPrice to parent handler
   */
  const handleBuyOut = async () => {
    if (isSubmitting) return;

    try {
      // Use customPrice if set, otherwise fall back to feeBreakdown basePrice or basePrice prop
      const finalPrice = offerPrice ?? feeBreakdown?.basePrice ?? basePrice ?? 0;
      const totalPrice = calculatePaymentBreakdown(requestType, finalPrice).requestorPays || finalPrice || 0;
      await onBuyOut?.(message, totalPrice, finalPrice);
      setMessage('');
      setShowSuccess(true);
    } catch (err) {
      // Error handling is done in parent
      console.error('Buy out failed:', err);
    }
  };

  /**
   * Handle share request submission
   */
  const handleShare = async () => {
    if (isSubmitting) return;

    try {
      const totalPrice = calculatePaymentBreakdown(requestType, basePrice || 0).requestorPays || basePrice || 0;
      await onShareRequest?.(message, totalPrice);
      setMessage('');
      setShowShareSuccess(true);
    } catch (err) {
      console.error('Share request failed:', err);
    }
  };

  /**
   * Handle swap instead click
   */
  const handleSwapInstead = () => {
    onSwapInstead?.();
  };

  /**
   * Handle request type tab change
   */
  const handleTypeChange = (newType) => {
    onRequestTypeChange?.(newType);
  };

  /**
   * Handle cancel click
   */
  const handleCancel = () => {
    setMessage('');
    setShowNote(false);
    setShowFees(false);
    setHasUsedDiscountStep(false);
    onCancel?.();
  };

  /**
   * Handle message input change
   */
  const handleMessageChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessage(value);
    }
  };

  return (
    <div className={`buyout-panel ${compact ? 'buyout-panel--compact' : ''} ${showEmpty ? 'buyout-panel--empty' : ''}`}>
      {/* Empty State Content */}
      {showEmpty && (
        <div className="buyout-panel__empty-state">
          <span className="buyout-panel__empty-icon" aria-hidden="true">
            &#x1F4C5;
          </span>
          <h3 className="buyout-panel__empty-title">{panelLabels.emptyTitle}</h3>
          <p className="buyout-panel__empty-text">
            {panelLabels.emptyText}
          </p>
        </div>
      )}

      {/* Success State Content (Buyout) */}
      {showSuccessState && (
        <div className="buyout-panel__success-state">
          <span className="buyout-panel__success-icon" aria-hidden="true">
            &#x2713;
          </span>
          <h3 className="buyout-panel__success-title">Request Sent!</h3>
          <p className="buyout-panel__success-text">
            {panelLabels.successText}
          </p>
          <button
            type="button"
            className="buyout-panel__btn buyout-panel__btn--ghost"
            onClick={() => setShowSuccess(false)}
          >
            Select Another Night
          </button>
        </div>
      )}

      {/* Success State Content (Swap) */}
      {showSwapSuccessState && (
        <div className="buyout-panel__success-state buyout-panel__success-state--swap">
          <span className="buyout-panel__success-icon" aria-hidden="true">
            &#x21C4;
          </span>
          <h3 className="buyout-panel__success-title">Swap Request Sent!</h3>
          <p className="buyout-panel__success-text">
            {panelLabels.successText}
          </p>
          <button
            type="button"
            className="buyout-panel__btn buyout-panel__btn--ghost"
            onClick={() => setShowSwapSuccess(false)}
          >
            Select Another Night
          </button>
        </div>
      )}

      {/* Success State Content (Share) */}
      {showShareSuccessState && (
        <div className="buyout-panel__success-state buyout-panel__success-state--share">
          <span className="buyout-panel__success-icon" aria-hidden="true">
            &#x1F91D;
          </span>
          <h3 className="buyout-panel__success-title">Share Request Sent!</h3>
          <p className="buyout-panel__success-text">
            Waiting for {counterpartyLabel}'s response. If accepted, you'll both have access to this night.
          </p>
          <button
            type="button"
            className="buyout-panel__btn buyout-panel__btn--ghost"
            onClick={() => setShowShareSuccess(false)}
          >
            Select Another Night
          </button>
        </div>
      )}

      {/* Persistent Request Type Toggle Tabs */}
      {(showSwapPanel || showActivePanel) && !showSuccessState && !showSwapSuccessState && !showShareSuccessState && (
        <RequestTypeTabs
          activeType={isSwapMode || isCounterMode ? 'swap' : requestType}
          onTypeChange={handleTypeChange}
          disabled={isSubmitting}
        />
      )}

      {/* Swap Mode Panel */}
      {showSwapPanel && (
        <SwapModeContent
          mode={isCounterMode ? 'counter' : 'swap'}
          requestedNight={isCounterMode ? counterOriginalNight : selectedDate}
          roommateName={roommateName}
          availableNights={isCounterMode ? roommateNights : userNights}
          selectedOfferNight={isCounterMode ? counterTargetNight : swapOfferNight}
          onSelectOffer={isCounterMode ? onSelectCounterNight : onSelectSwapOffer}
          onSubmit={async (msg) => {
            const result = isCounterMode
              ? await onSubmitCounterRequest?.(msg)
              : await onSubmitSwapRequest?.(msg);
            if (result) {
              setShowSwapSuccess(true);
            }
          }}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Active Panel Content (Buyout/Share Mode) */}
      {showActivePanel && (
        <>
          {/* Compact Header: "Buying Out [date]" with close button */}
          {compact ? (
            <div className="buyout-panel__compact-header">
              <span className="buyout-panel__compact-title">
                {requestType === 'share' ? 'Share' : 'Buying Out'} {formatCompactDate(selectedDate)}
              </span>
              <button
                type="button"
                className="buyout-panel__compact-close"
                onClick={handleCancel}
                disabled={isSubmitting}
                aria-label="Cancel"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              {/* Full mode heading */}
              <h3 className="buyout-panel__heading">
                {requestType === 'share' ? 'Share Night' : 'Make an Offer'}
              </h3>

              {/* Mode-specific description */}
              {requestType === 'share' && (
                <p className="buyout-panel__description">
                  Request to share the space with {counterpartyLabel} on this night 👥
                </p>
              )}

              {/* Selected Night - Full mode only */}
              <div className="buyout-panel__selected">
                <span className="buyout-panel__date">{formattedDate}</span>
                <span className="buyout-panel__owner">
                  {panelLabels.selectedOwner}
                </span>
              </div>
            </>
          )}

          {/* Editable Price Offer - Only show for buyout mode */}
          {requestType !== 'share' && (
            <div className="buyout-panel__offer-price">
              <div className="buyout-panel__stepper">
                {/* Smart -10% button with Flexibility Lever logic */}
                <div className="buyout-panel__stepper-minus">
                  {!hasUsedDiscountStep && (
                    <button
                      type="button"
                      className={`buyout-panel__stepper-btn buyout-panel__stepper-btn--minus ${
                        (!flexibilityContext.canDiscount || offerFeedback?.tone === 'low')
                          ? 'buyout-panel__stepper-btn--ghost'
                          : ''
                      } ${showDiscountWarning ? 'buyout-panel__stepper-btn--warning' : ''}`}
                      onClick={() => {
                        if (hasUsedDiscountStep) return;
                        // If less flexible, show warning on first click
                        if (!flexibilityContext.canDiscount && !showDiscountWarning) {
                          setShowDiscountWarning(true);
                          return;
                        }
                        setCustomPrice(Math.max(1, Math.round((offerPrice - stepAmount) * 100) / 100));
                        setShowDiscountWarning(false);
                        setHasUsedDiscountStep(true);
                      }}
                      disabled={isSubmitting || !stepAmount}
                      title={flexibilityContext.warning || 'Reduce offer by 10%'}
                    >
                      -10%
                    </button>
                  )}
                  {hasUsedDiscountStep && (
                    <span className="buyout-panel__discount-note">-10% limit reached.</span>
                  )}
                </div>

                {/* Huge editable price display */}
                <div className="buyout-panel__stepper-center">
                  <span className="buyout-panel__currency">$</span>
                  <input
                    type="number"
                    className="buyout-panel__offer-input"
                    value={Number.isFinite(offerPrice) ? offerPrice : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const nextValue = value === '' ? null : Number(value);
                      if (Number.isFinite(nextValue) && Number.isFinite(offerPrice) && nextValue > offerPrice) {
                        setHasUsedDiscountStep(false);
                      }
                      setCustomPrice(nextValue);
                      setShowDiscountWarning(false);
                    }}
                    min={0}
                    step={1}
                    disabled={isSubmitting}
                  />
                </div>

                {/* +10% button (always normal style) */}
                <button
                  type="button"
                  className="buyout-panel__stepper-btn buyout-panel__stepper-btn--plus"
                  onClick={() => {
                    setCustomPrice(Math.round((offerPrice + stepAmount) * 100) / 100);
                    setShowDiscountWarning(false);
                    setHasUsedDiscountStep(false);
                  }}
                  disabled={isSubmitting || !stepAmount}
                >
                  +10%
                </button>
              </div>

              {/* Discount Warning (Friction for lowballing when less flexible) */}
              {showDiscountWarning && flexibilityContext.warning && (
                <div className="buyout-panel__discount-warning" role="alert">
                  <span className="buyout-panel__warning-icon">⚠️</span>
                  {flexibilityContext.warning}
                </div>
              )}


              {/* Offer Feedback with expandable "Why?" */}
              {offerFeedback && !showDiscountWarning && (
                <div
                  className={`buyout-panel__feedback buyout-panel__feedback--${offerFeedback.tone} ${showFeedbackDetail ? 'buyout-panel__feedback--expanded' : ''}`}
                  onClick={() => setShowFeedbackDetail(!showFeedbackDetail)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setShowFeedbackDetail(!showFeedbackDetail)}
                >
                  <span className="buyout-panel__feedback-indicator">
                    {offerFeedback.tone === 'fair' ? '🟢' : '🟠'}
                  </span>
                  <span className="buyout-panel__feedback-label">{offerFeedback.label}</span>
                  <span className="buyout-panel__feedback-toggle">
                    {showFeedbackDetail ? '▲' : 'ⓘ'}
                  </span>
                </div>
              )}

              {/* Feedback Detail (Layer 3) */}
              {showFeedbackDetail && offerFeedback && (
                <div className="buyout-panel__feedback-detail">
                  <p>Based on {roommateName}'s pricing preferences and current demand.</p>
                  {flexibilityContext.delta !== 0 && myFlexibilityScore && roommateFlexibilityScore && (
                    <p className="buyout-panel__flexibility-comparison">
                      Flexibility: You ({myFlexibilityScore}/10) vs {roommateName} ({roommateFlexibilityScore}/10)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Fee calculation error */}
          {feeError && (
            <div className="buyout-panel__error" role="alert">
              Unable to calculate price. Please try again.
            </div>
          )}

          {/* Message Input (optional) */}
          <div className="buyout-panel__message">
            <button
              type="button"
              className="buyout-panel__note-toggle"
              onClick={() => setShowNote((prev) => !prev)}
              aria-expanded={showNote}
            >
              {showNote ? 'Hide note' : '+ Add note'}
            </button>
            {showNote && (
              <>
                <label htmlFor="buyout-message" className="buyout-panel__message-label">
                  Add a note (optional)
                </label>
                <textarea
                  id="buyout-message"
                  className="buyout-panel__message-input"
                  placeholder={requestType === 'share'
                    ? "e.g., I just need the space for a few hours..."
                    : "e.g., I have an early meeting that day..."}
                  value={message}
                  onChange={handleMessageChange}
                  rows={2}
                  maxLength={MAX_MESSAGE_LENGTH}
                  disabled={isSubmitting}
                />
                <div className="buyout-panel__message-counter">
                  <span className={remainingChars < 20 ? 'buyout-panel__message-counter--low' : ''}>
                    {remainingChars} characters remaining
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Actions - Send button with fee tooltip on hover */}
          <div className={`buyout-panel__actions ${compact ? 'buyout-panel__actions--compact' : ''}`}>
            <FeeTooltip
              feeBreakdown={feeBreakdown}
              transactionType={requestType}
              roommateName={roommateName}
            >
              <button
                type="button"
                className={`buyout-panel__btn buyout-panel__btn--primary buyout-panel__btn--send ${
                  offerFeedback?.tone === 'low' && !flexibilityContext.canDiscount
                    ? 'buyout-panel__btn--cautious'
                    : ''
                }`}
                onClick={requestType === 'share' ? handleShare : handleBuyOut}
                disabled={isSubmitting || isCalculating || !feeBreakdown}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner />
                    Sending...
                  </>
                ) : (
                  getActionButtonText(
                    requestType,
                    offerPrice,
                    transactionFees.fees.requestorFee,
                    totalOfferPrice
                  )
                )}
              </button>
            </FeeTooltip>

            {/* Cancel button only in non-compact mode */}
            {!compact && (
              <button
                type="button"
                className="buyout-panel__btn buyout-panel__btn--ghost"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
          </div>
        </>
      )}

      {/* Settings Drawer Toggle - Always visible */}
      {buyoutPreferences && (
        <>
          <button
            type="button"
            className={`buyout-panel__settings-toggle ${isBuyoutSettingsOpen ? 'buyout-panel__settings-toggle--open' : ''}`}
            onClick={onToggleBuyoutSettings}
            aria-expanded={isBuyoutSettingsOpen}
            aria-controls="buyout-settings-drawer"
          >
            <span className="buyout-panel__settings-icon" aria-hidden="true">&#x2699;</span>
            Customize Pricing Preferences
            <span className="buyout-panel__settings-chevron" aria-hidden="true">
              {isBuyoutSettingsOpen ? '\u25B2' : '\u25BC'}
            </span>
          </button>

          {/* Settings Drawer Content */}
          <div
            id="buyout-settings-drawer"
            className={`buyout-panel__settings-drawer ${isBuyoutSettingsOpen ? 'buyout-panel__settings-drawer--open' : ''}`}
            aria-hidden={!isBuyoutSettingsOpen}
          >
            <BuyoutFormulaSettings
              preferences={buyoutPreferences}
              baseNightlyRate={basePrice}
              onPreferenceChange={onBuyoutPreferenceChange}
              onSave={onSaveBuyoutPreferences}
              onReset={onResetBuyoutPreferences}
              computedPrices={computedSuggestedPrices}
              isSaving={isSavingPreferences}
            />
          </div>
        </>
      )}
    </div>
  );
}

BuyOutPanel.propTypes = {
  selectedDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ]),
  roommateName: PropTypes.string,
  basePrice: PropTypes.number,
  onBuyOut: PropTypes.func,
  onShareRequest: PropTypes.func,
  onSwapInstead: PropTypes.func,
  onCancel: PropTypes.func,
  isSubmitting: PropTypes.bool,
  compact: PropTypes.bool,
  // Flexibility Score props (for "Guidance via Friction")
  myFlexibilityScore: PropTypes.number,
  roommateFlexibilityScore: PropTypes.number,
  // Request Type props
  requestType: PropTypes.oneOf(['buyout', 'share', 'swap']),
  onRequestTypeChange: PropTypes.func,
  // Swap Mode props
  isSwapMode: PropTypes.bool,
  isCounterMode: PropTypes.bool,
  swapOfferNight: PropTypes.string,
  userNights: PropTypes.arrayOf(PropTypes.string),
  roommateNights: PropTypes.arrayOf(PropTypes.string),
  counterOriginalNight: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ]),
  counterTargetNight: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ]),
  onSelectSwapOffer: PropTypes.func,
  onSubmitSwapRequest: PropTypes.func,
  onSelectCounterNight: PropTypes.func,
  onSubmitCounterRequest: PropTypes.func,
  // Buyout Settings props
  buyoutPreferences: PropTypes.shape({
    lastMinuteDiscount: PropTypes.number,
    demandFactorEnabled: PropTypes.bool,
    floorPrice: PropTypes.number,
    ceilingPrice: PropTypes.number
  }),
  isBuyoutSettingsOpen: PropTypes.bool,
  isSavingPreferences: PropTypes.bool,
  computedSuggestedPrices: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    suggestedPrice: PropTypes.number,
    factors: PropTypes.arrayOf(PropTypes.string)
  })),
  onToggleBuyoutSettings: PropTypes.func,
  onBuyoutPreferenceChange: PropTypes.func,
  onSaveBuyoutPreferences: PropTypes.func,
  onResetBuyoutPreferences: PropTypes.func,
  // Lease type props for conditional labels
  lease: PropTypes.shape({
    isCoTenant: PropTypes.bool,
    isGuestHost: PropTypes.bool,
    userRole: PropTypes.oneOf(['guest', 'host'])
  }),
  guestName: PropTypes.string,
  hostName: PropTypes.string
};
