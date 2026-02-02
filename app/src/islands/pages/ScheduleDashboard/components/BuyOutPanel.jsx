/**
 * Buy Out Panel Component
 *
 * Action panel for selected night:
 * - Selected night display with readable date format
 * - Price breakdown using useFeeCalculation hook
 * - Buy Out button (primary CTA)
 * - Swap Instead link (secondary)
 * - Cancel button (tertiary/ghost)
 * - Optional message input with character counter
 * - Loading/pending states
 * - Success confirmation state
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useFeeCalculation } from '../../../../logic/hooks/useFeeCalculation';
import BuyoutFormulaSettings from './BuyoutFormulaSettings.jsx';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_MESSAGE_LENGTH = 200;

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
 * Price breakdown display
 */
function PriceBreakdown({ feeBreakdown, isCalculating, priceLabel = 'Base price' }) {
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
        <span>{priceLabel}</span>
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
  onBack,
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
        {isCounter ? 'Counter with a Swap' : 'Offer a Swap'}
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

      {/* Swap Info */}
      <div className="buyout-panel__swap-info">
        <span className="buyout-panel__swap-info-icon" aria-hidden="true">&#x1F4B0;</span>
        <span>Swaps are free — no platform fee applies.</span>
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
          className="buyout-panel__btn buyout-panel__btn--secondary"
          onClick={onBack}
          disabled={isSubmitting}
        >
          {isCounter ? 'Back to Request' : 'Back to Buyout'}
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
    { key: 'buyout', label: 'Buyout', icon: '💰' },
    { key: 'share', label: 'Share', icon: '👥' },
    { key: 'swap', label: 'Swap', icon: '🔄' }
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
          <span className="buyout-panel__type-tab-icon">{icon}</span>
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
  onCancelSwapMode,
  onSelectCounterNight,
  onSubmitCounterRequest,
  onCancelCounterMode,
  // Buyout Settings props
  buyoutPreferences,
  isBuyoutSettingsOpen = false,
  isSavingPreferences = false,
  computedSuggestedPrices = [],
  onToggleBuyoutSettings,
  onBuyoutPreferenceChange,
  onSaveBuyoutPreferences,
  onResetBuyoutPreferences
}) {
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSwapSuccess, setShowSwapSuccess] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  // Use the fee calculation hook - pass requestType for potential future different fee structures
  const { feeBreakdown, isCalculating, error: feeError } = useFeeCalculation(
    basePrice,
    requestType === 'share' ? 'share' : 'date_change',
    { autoCalculate: true }
  );

  const formattedDate = formatSelectedDate(selectedDate);
  const remainingChars = MAX_MESSAGE_LENGTH - message.length;

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
      // Pass totalPrice from feeBreakdown to parent for transaction creation
      const totalPrice = feeBreakdown?.totalPrice || basePrice || 0;
      await onBuyOut?.(message, totalPrice);
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
      const totalPrice = feeBreakdown?.totalPrice || basePrice || 0;
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
          <h3 className="buyout-panel__empty-title">Select a Night</h3>
          <p className="buyout-panel__empty-text">
            Click on an available night in the calendar to request a buyout from your roommate.
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
            Waiting for {roommateName}'s response. You'll be notified when they respond.
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
            Waiting for {roommateName}'s response. You'll be notified when they respond.
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
            Waiting for {roommateName}'s response. If accepted, you'll both have access to this night.
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
          onBack={isCounterMode ? onCancelCounterMode : onCancelSwapMode}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Active Panel Content (Buyout/Share Mode) */}
      {showActivePanel && (
        <>
          {/* Request Type Toggle Tabs */}
          <RequestTypeTabs
            activeType={requestType}
            onTypeChange={handleTypeChange}
            disabled={isSubmitting}
          />

          {/* Mode-specific heading */}
          <h3 className="buyout-panel__heading">
            {requestType === 'share' ? 'Share Night' : 'Buy Out Night'}
          </h3>

          {/* Mode-specific description */}
          {requestType === 'share' && (
            <p className="buyout-panel__description">
              Request to share the space with {roommateName} on this night 👥
            </p>
          )}

          {/* Content Row - Horizontal layout in compact mode */}
          <div className={compact ? 'buyout-panel__content-row' : ''}>
            {/* Selected Night */}
            <div className="buyout-panel__selected">
              <span className="buyout-panel__date">{formattedDate}</span>
              <span className="buyout-panel__owner">
                Currently held by {roommateName}
              </span>
            </div>

            {/* Price Breakdown */}
            <PriceBreakdown
              feeBreakdown={feeBreakdown}
              isCalculating={isCalculating}
              priceLabel={requestType === 'share' ? 'Share fee' : 'Base price'}
            />
          </div>

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
          </div>

          {/* Actions */}
          <div className="buyout-panel__actions">
            <button
              type="button"
              className="buyout-panel__btn buyout-panel__btn--primary"
              onClick={requestType === 'share' ? handleShare : handleBuyOut}
              disabled={isSubmitting || isCalculating || !feeBreakdown}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  Sending Request...
                </>
              ) : (
                requestType === 'share' ? 'Send Share Request' : 'Buy Out Night'
              )}
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
  onCancelSwapMode: PropTypes.func,
  onSelectCounterNight: PropTypes.func,
  onSubmitCounterRequest: PropTypes.func,
  onCancelCounterMode: PropTypes.func,
  // Buyout Settings props
  buyoutPreferences: PropTypes.shape({
    weekendPremium: PropTypes.number,
    holidayPremium: PropTypes.number,
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
  onResetBuyoutPreferences: PropTypes.func
};
