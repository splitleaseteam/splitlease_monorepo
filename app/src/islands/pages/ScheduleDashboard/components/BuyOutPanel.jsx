/**
 * Buy Out Panel Component
 *
 * Action panel for selected night with flexible offer system:
 * - Selected night display with readable date format
 * - Notice period context explaining suggested pricing
 * - Offer tier selector (Casual / Fair / I Need This)
 * - Custom price input option
 * - Price breakdown using useFeeCalculation hook
 * - Buy Out button (primary CTA)
 * - Swap Instead link (secondary)
 * - Cancel button (tertiary/ghost)
 * - Optional message input with character counter
 * - Loading/pending states
 * - Success confirmation state
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useFeeCalculation } from '../../../../logic/hooks/useFeeCalculation';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_MESSAGE_LENGTH = 200;

/**
 * Offer tiers for flexible buyout pricing
 * Suggested price is the "Fair" price (100%)
 */
const OFFER_TIERS = {
  CASUAL: {
    id: 'casual',
    label: 'Casual Check-in',
    multiplier: 0.7,
    description: "If they can't, no worries",
    icon: '💭',
  },
  FAIR: {
    id: 'fair',
    label: 'Fair Offer',
    multiplier: 1.0,
    description: 'Suggested based on notice period',
    icon: '✓',
    isDefault: true,
  },
  NEED_THIS: {
    id: 'need_this',
    label: 'I Really Need This',
    multiplier: 1.3,
    description: 'Higher chance of acceptance',
    icon: '⚡',
  },
  CUSTOM: {
    id: 'custom',
    label: 'Custom Amount',
    multiplier: null,
    description: 'Set your own price',
    icon: '✏️',
  },
};

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

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Empty state when no night is selected
 */
function EmptyState() {
  return (
    <div className="buyout-panel buyout-panel--empty">
      <div className="buyout-panel__empty-state">
        <span className="buyout-panel__empty-icon" aria-hidden="true">
          &#x1F4C5;
        </span>
        <h3 className="buyout-panel__empty-title">Select a Night</h3>
        <p className="buyout-panel__empty-text">
          Click on an available night in the calendar to request a buyout from your roommate.
        </p>
      </div>
    </div>
  );
}

/**
 * Success state after request is sent
 */
function SuccessState({ roommateName, onDismiss }) {
  return (
    <div className="buyout-panel buyout-panel--success">
      <div className="buyout-panel__success-state">
        <span className="buyout-panel__success-icon" aria-hidden="true">
          &#x2713;
        </span>
        <h3 className="buyout-panel__success-title">Request Sent!</h3>
        <p className="buyout-panel__success-text">
          Waiting for {roommateName}'s response. You'll be notified when they respond.
        </p>
        <button
          type="button"
          className="buyout-panel__btn buyout-panel__btn--ghost"
          onClick={onDismiss}
        >
          Select Another Night
        </button>
      </div>
    </div>
  );
}

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
 * Notice period context display
 * Explains why the suggested price is what it is
 */
function NoticeContext({ noticePricing }) {
  if (!noticePricing) return null;

  const { tier, daysUntil, suggestedPrice } = noticePricing;

  return (
    <div className="buyout-panel__notice-context">
      <div className="buyout-panel__notice-header">
        <span className="buyout-panel__notice-icon" aria-hidden="true">📅</span>
        <span className="buyout-panel__notice-label">{tier.label}</span>
      </div>
      <p className="buyout-panel__notice-description">
        {daysUntil === 0
          ? "Same-day request"
          : daysUntil === 1
          ? "1 day notice"
          : `${daysUntil} days notice`}
        {' — '}
        {tier.description}
      </p>
      <div className="buyout-panel__suggested-price">
        <span className="buyout-panel__suggested-label">Suggested price:</span>
        <span className="buyout-panel__suggested-amount">${suggestedPrice}</span>
      </div>
    </div>
  );
}

/**
 * Offer tier selector
 */
function OfferTierSelector({
  selectedTier,
  onTierSelect,
  suggestedPrice,
  customAmount,
  onCustomAmountChange,
}) {
  const tiers = Object.values(OFFER_TIERS);

  return (
    <div className="buyout-panel__offer-tiers">
      <label className="buyout-panel__offer-label">Your Offer</label>
      <div className="buyout-panel__tier-options">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.id;
          const tierPrice = tier.multiplier
            ? Math.round(suggestedPrice * tier.multiplier)
            : customAmount || suggestedPrice;

          return (
            <button
              key={tier.id}
              type="button"
              className={`buyout-panel__tier-option ${isSelected ? 'buyout-panel__tier-option--selected' : ''}`}
              onClick={() => onTierSelect(tier.id)}
              aria-pressed={isSelected}
            >
              <span className="buyout-panel__tier-icon" aria-hidden="true">
                {tier.icon}
              </span>
              <span className="buyout-panel__tier-name">{tier.label}</span>
              <span className="buyout-panel__tier-price">
                {tier.id === 'custom' ? (
                  isSelected ? '$...' : 'Custom'
                ) : (
                  `$${tierPrice}`
                )}
              </span>
              <span className="buyout-panel__tier-desc">{tier.description}</span>
            </button>
          );
        })}
      </div>

      {/* Custom amount input */}
      {selectedTier === 'custom' && (
        <div className="buyout-panel__custom-input">
          <label htmlFor="custom-amount">Enter your offer amount:</label>
          <div className="buyout-panel__custom-input-wrapper">
            <span className="buyout-panel__currency-prefix">$</span>
            <input
              id="custom-amount"
              type="number"
              min="1"
              step="1"
              value={customAmount || ''}
              onChange={(e) => onCustomAmountChange(Number(e.target.value) || 0)}
              placeholder={suggestedPrice.toString()}
              className="buyout-panel__custom-amount-field"
            />
          </div>
          <span className="buyout-panel__custom-hint">
            Suggested: ${suggestedPrice}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Price breakdown display
 */
function PriceBreakdown({ feeBreakdown, isCalculating }) {
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

  return (
    <div className="buyout-panel__pricing">
      <div className="buyout-panel__price-row">
        <span>Base price</span>
        <span>${feeBreakdown.basePrice.toFixed(2)}</span>
      </div>
      <div className="buyout-panel__price-row">
        <span>Platform fee ({feeBreakdown.effectiveRate}%)</span>
        <span>${feeBreakdown.totalFee.toFixed(2)}</span>
      </div>
      <div className="buyout-panel__price-row buyout-panel__price-row--divider" aria-hidden="true" />
      <div className="buyout-panel__price-row buyout-panel__price-row--total">
        <span>Total</span>
        <span>${feeBreakdown.totalPrice.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BuyOutPanel({
  selectedDate,
  roommateName = 'Roommate',
  basePrice,
  noticePricing, // { suggestedPrice, tier, daysUntil, multiplier }
  onBuyOut,
  onSwapInstead,
  onCancel,
  isSubmitting = false
}) {
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTier, setSelectedTier] = useState('fair');
  const [customAmount, setCustomAmount] = useState(0);

  // Calculate the actual offer price based on selected tier
  const offerPrice = useMemo(() => {
    const suggested = noticePricing?.suggestedPrice || basePrice || 0;

    if (selectedTier === 'custom') {
      return customAmount || suggested;
    }

    const tier = OFFER_TIERS[selectedTier.toUpperCase()];
    if (!tier || !tier.multiplier) {
      return suggested;
    }

    return Math.round(suggested * tier.multiplier);
  }, [noticePricing, basePrice, selectedTier, customAmount]);

  // Use the fee calculation hook with the offer price (not base price)
  const { feeBreakdown, isCalculating, error: feeError } = useFeeCalculation(
    offerPrice,
    'date_change',
    { autoCalculate: true }
  );

  // No night selected - show empty state
  if (!selectedDate && !showSuccess) {
    return <EmptyState />;
  }

  // Success state after submission
  if (showSuccess) {
    return (
      <SuccessState
        roommateName={roommateName}
        onDismiss={() => setShowSuccess(false)}
      />
    );
  }

  const formattedDate = formatSelectedDate(selectedDate);
  const remainingChars = MAX_MESSAGE_LENGTH - message.length;

  /**
   * Handle buy out submission
   */
  const handleBuyOut = async () => {
    if (isSubmitting) return;

    try {
      // Pass offer details to parent
      await onBuyOut?.({
        message,
        offerPrice,
        offerTier: selectedTier,
        suggestedPrice: noticePricing?.suggestedPrice || basePrice,
        noticeDays: noticePricing?.daysUntil,
      });
      setMessage('');
      setShowSuccess(true);
      // Reset tier selection for next request
      setSelectedTier('fair');
      setCustomAmount(0);
    } catch (err) {
      // Error handling is done in parent
      console.error('Buy out failed:', err);
    }
  };

  /**
   * Handle swap instead click
   */
  const handleSwapInstead = () => {
    onSwapInstead?.();
  };

  /**
   * Handle cancel click
   */
  const handleCancel = () => {
    setMessage('');
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
    <div className="buyout-panel">
      <h3 className="buyout-panel__heading">Buy Out Night</h3>

      {/* Selected Night */}
      <div className="buyout-panel__selected">
        <span className="buyout-panel__date">{formattedDate}</span>
        <span className="buyout-panel__owner">
          Currently held by {roommateName}
        </span>
      </div>

      {/* Notice Period Context */}
      <NoticeContext noticePricing={noticePricing} />

      {/* Offer Tier Selector */}
      {noticePricing && (
        <OfferTierSelector
          selectedTier={selectedTier}
          onTierSelect={setSelectedTier}
          suggestedPrice={noticePricing.suggestedPrice}
          customAmount={customAmount}
          onCustomAmountChange={setCustomAmount}
        />
      )}

      {/* Price Breakdown */}
      <PriceBreakdown feeBreakdown={feeBreakdown} isCalculating={isCalculating} />

      {/* Fee calculation error */}
      {feeError && (
        <div className="buyout-panel__error" role="alert">
          Unable to calculate price. Please try again.
        </div>
      )}

      {/* Message Input (optional) */}
      <div className="buyout-panel__message">
        <label htmlFor="buyout-message" className="buyout-panel__message-label">
          Add a note to your request (optional)
        </label>
        <textarea
          id="buyout-message"
          className="buyout-panel__message-input"
          placeholder="e.g., I have an early meeting that day..."
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
      </div>

      {/* Actions */}
      <div className="buyout-panel__actions">
        <button
          type="button"
          className="buyout-panel__btn buyout-panel__btn--primary"
          onClick={handleBuyOut}
          disabled={isSubmitting || isCalculating || !feeBreakdown}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              Sending Request...
            </>
          ) : (
            'Buy Out Night'
          )}
        </button>

        <button
          type="button"
          className="buyout-panel__btn buyout-panel__btn--secondary"
          onClick={handleSwapInstead}
          disabled={isSubmitting}
        >
          Offer a Swap Instead
        </button>

        <button
          type="button"
          className="buyout-panel__btn buyout-panel__btn--ghost"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
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
  noticePricing: PropTypes.shape({
    suggestedPrice: PropTypes.number,
    tier: PropTypes.shape({
      label: PropTypes.string,
      description: PropTypes.string,
      multiplier: PropTypes.number,
    }),
    daysUntil: PropTypes.number,
    multiplier: PropTypes.number,
  }),
  onBuyOut: PropTypes.func,
  onSwapInstead: PropTypes.func,
  onCancel: PropTypes.func,
  isSubmitting: PropTypes.bool
};
