/**
 * Pattern 2: Urgency Countdown - Main Component
 *
 * Production-ready urgency countdown widget combining all sub-components
 * This is the primary component that integrates everything
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import analyticsService from '../../../../services/analyticsService';
import { UrgencyCountdownProps } from '../types';
import { useCountdownWithVisibility } from '../hooks/useCountdown';
import { useUrgencyPricing } from '../hooks/useUrgencyPricing';
import { usePriceProjections } from '../hooks/usePriceProjections';
import { getUrgencyMetadata } from '../utils/urgencyCalculations';
import { differenceInDays, differenceInHours } from '../utils/dateFormatting';

import CountdownTimer from './CountdownTimer';
import PriceProgression from './PriceProgression';
import UrgencyIndicator from './UrgencyIndicator';
import PriceIncreaseRate from './PriceIncreaseRate';
import ActionPrompt from './ActionPrompt';

import '../styles/UrgencyCountdown.css';

/**
 * UrgencyCountdown - Complete urgency countdown widget
 *
 * Features:
 * - Real-time countdown timer
 * - Dynamic pricing with exponential urgency
 * - Future price projections
 * - Visual urgency indicators
 * - Call-to-action prompts
 * - Responsive design
 * - Full accessibility
 */
export const UrgencyCountdown: React.FC<UrgencyCountdownProps> = ({
  targetDate,
  basePrice,
  urgencySteepness,
  marketDemandMultiplier,
  transactionType,
  variant = 'default',
  onPriceUpdate,
  onUrgencyChange,
  onActionClick,
  budgetContext,
  className = '',
  testId = 'urgency-countdown',
}) => {
  // Countdown timer
  const { timeRemaining, urgencyLevel } = useCountdownWithVisibility(
    targetDate,
    {
      onUrgencyChange,
    }
  );

  // Urgency pricing calculations
  const { pricing, loading, error, alerts } = useUrgencyPricing(
    targetDate,
    basePrice,
    {
      urgencySteepness,
      marketDemandMultiplier,
      onPriceUpdate,
    }
  );

  // Price projections
  const { projections } = usePriceProjections(targetDate, basePrice, {
    urgencySteepness,
    marketDemandMultiplier,
    forecastDays: 7,
  });

  const daysUntil = differenceInDays(targetDate);
  const hoursUntil = differenceInHours(targetDate);

  // Urgency metadata for styling
  const urgencyMetadata = getUrgencyMetadata(
    urgencyLevel,
    timeRemaining.days
  );

  // Budget alerts
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);
  const [backendVerification, setBackendVerification] = useState<{
    verified: boolean;
    mismatch: boolean;
    error: boolean;
    backendPrice?: number;
  }>({ verified: false, mismatch: false, error: false });

  useEffect(() => {
    if (
      budgetContext?.maxBudget &&
      pricing &&
      pricing.currentPrice > budgetContext.maxBudget
    ) {
      setShowBudgetWarning(true);
    } else {
      setShowBudgetWarning(false);
    }
  }, [pricing, budgetContext]);

  useEffect(() => {
    if (pricing && urgencyLevel) {
      analyticsService.trackUrgencyCalculated(
        urgencyLevel.toUpperCase(),
        pricing.currentMultiplier,
        daysUntil,
        urgencyMetadata.color
      );
    }
  }, [urgencyLevel, pricing?.currentMultiplier, daysUntil, urgencyMetadata.color]);

  /**
   * Backend verification effect
   * Validates the local calculation with the authoritative Edge Function
   */
  useEffect(() => {
    const verifyPricing = async () => {
      if (!pricing || !targetDate) return;

      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          'urgency-pricing',
          {
            body: {
              action: 'calculate',
              payload: {
                targetDate: targetDate.toISOString(),
                basePrice: basePrice,
                urgencySteepness: urgencySteepness || 2.0,
                marketDemandMultiplier: marketDemandMultiplier || 1.0,
              },
            },
          }
        );

        if (invokeError || !data?.success) {
          console.error('[UrgencyCountdown] Backend verification failed:', invokeError || data?.error);
          setBackendVerification({ verified: false, mismatch: false, error: true });
          return;
        }

        const backendPrice = data.data.currentPrice;
        const localPrice = pricing.currentPrice;
        
        // Check for discrepancy (allowing for rounding differences)
        const hasMismatch = Math.abs(backendPrice - localPrice) > 1.0;

        if (hasMismatch) {
          console.warn(
            `[UrgencyCountdown] Price mismatch detected! Local: ${localPrice}, Backend: ${backendPrice}`
          );
        }

        setBackendVerification({
          verified: true,
          mismatch: hasMismatch,
          error: false,
          backendPrice,
        });
      } catch (err) {
        console.error('[UrgencyCountdown] Error calling verification function:', err);
        setBackendVerification({ verified: false, mismatch: false, error: true });
      }
    };

    // Verify when pricing or dependencies change
    // We debounced it slightly by waiting for the initial pricing to settle
    if (pricing) {
      verifyPricing();
    }
  }, [targetDate, basePrice, urgencySteepness, marketDemandMultiplier, pricing?.calculatedAt]);

  // Loading state
  if (loading && !pricing) {
    return (
      <div
        className={`urgency-countdown urgency-loading ${className}`}
        data-testid={testId}
      >
        <div className="loading-spinner" />
        <div className="loading-text">Calculating pricing...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`urgency-countdown urgency-error ${className}`}
        data-testid={testId}
      >
        <div className="error-icon">⚠️</div>
        <div className="error-message">
          Unable to calculate urgency pricing
        </div>
      </div>
    );
  }

  if (!pricing) {
    return null;
  }

  // Calculate potential savings
  const potentialSavings =
    projections.length > 0
      ? projections[projections.length - 1].increaseFromCurrent
      : 0;

  return (
    <div
      className={`urgency-countdown urgency-${urgencyLevel} variant-${variant} ${className}`}
      data-testid={testId}
      style={
        {
          '--urgency-color': urgencyMetadata.color,
          '--urgency-bg': urgencyMetadata.backgroundColor,
        } as React.CSSProperties
      }
    >
      {/* Urgency Indicator Banner */}
      {urgencyMetadata.showProgressBar && (
        <UrgencyIndicator
          urgencyLevel={urgencyLevel}
          metadata={urgencyMetadata}
          daysUntil={daysUntil}
          showProgressBar={variant !== 'minimal'}
        />
      )}

      {/* Countdown Timer */}
      <div className="countdown-section">
        <CountdownTimer
          targetDate={targetDate}
          urgencyLevel={urgencyLevel}
        />
      </div>

      {/* Current Price Display */}
      <div className="current-price-section">
        <div className="price-header">
          <span className="price-label">Price Today</span>
          {pricing.currentMultiplier > 1.0 && (
            <span className="multiplier-badge">
              {pricing.currentMultiplier.toFixed(1)}x urgency
            </span>
          )}
        </div>
        <div className="price-display">
          <span className="price-amount">
            ${pricing.currentPrice.toLocaleString()}
          </span>
          <span className="price-period">/night</span>
        </div>

        {/* Backend Verification Status */}
        <div className="verification-status">
          {backendVerification.verified && !backendVerification.mismatch && (
            <span className="status-verified" title="Verified by backend">
              <span className="status-icon">✅</span>
              Authoritative Price
            </span>
          )}
          {backendVerification.mismatch && (
            <span className="status-mismatch" title="Backend price differs from local calculation">
              <span className="status-icon">⚠️</span>
              Price mismatch detected (Backend: ${backendVerification.backendPrice})
            </span>
          )}
          {backendVerification.error && (
            <span className="status-error" title="Could not reach backend for verification">
              <span className="status-icon">ℹ️</span>
              Local estimation only
            </span>
          )}
        </div>
      </div>

      {/* Budget Warning */}
      {showBudgetWarning && budgetContext?.maxBudget && (
        <div className="budget-warning" role="alert">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            Price (${pricing.currentPrice}) exceeds your budget ($
            {budgetContext.maxBudget})
          </span>
        </div>
      )}

      {/* Price Projections */}
      {variant !== 'minimal' && projections.length > 0 && (
        <div className="projections-section">
          <PriceProgression
            projections={projections}
            currentPrice={pricing.currentPrice}
            urgencyLevel={urgencyLevel}
            maxProjections={variant === 'compact' ? 2 : 3}
          />
        </div>
      )}

      {/* Price Increase Rate */}
      {pricing.increaseRatePerDay > 0 && variant !== 'minimal' && (
        <div className="rate-section">
          <PriceIncreaseRate
            increaseRatePerDay={pricing.increaseRatePerDay}
            urgencyLevel={urgencyLevel}
            currentPrice={pricing.currentPrice}
            peakPrice={pricing.peakPrice}
          />
        </div>
      )}

      {/* Call to Action */}
      {urgencyMetadata.showCTA && onActionClick && (
        <div className="action-section">
          <ActionPrompt
            currentPrice={pricing.currentPrice}
            urgencyLevel={urgencyLevel}
            savings={potentialSavings}
            onClick={onActionClick}
          />
        </div>
      )}

      {/* Price Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          {alerts.slice(0, 2).map((alert, index) => (
            <div
              key={index}
              className={`alert alert-${alert.priority}`}
              role="alert"
            >
              <span className="alert-icon">
                {alert.type === 'critical' && '🚨'}
                {alert.type === 'milestone' && '📍'}
                {alert.type === 'doubling' && '📈'}
                {alert.type === 'threshold' && '⚠️'}
              </span>
              <span className="alert-message">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Type Context */}
      {variant === 'prominent' && (
        <div className="transaction-context">
          <span className="context-icon">
            {transactionType === 'full_week' && '🏠'}
            {transactionType === 'shared_night' && '🛋️'}
            {transactionType === 'alternating' && '🔄'}
          </span>
          <span className="context-text">
            {transactionType === 'full_week' && 'Full week pricing'}
            {transactionType === 'shared_night' && 'Shared night pricing'}
            {transactionType === 'alternating' && 'Alternating pricing'}
          </span>
        </div>
      )}

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="debug-info">
          <summary>Debug Info</summary>
          <pre>
            {JSON.stringify(
              {
                urgencyLevel,
                daysUntil,
                hoursUntil,
                currentMultiplier: pricing.currentMultiplier,
                currentPrice: pricing.currentPrice,
                increaseRatePerDay: pricing.increaseRatePerDay,
                peakPrice: pricing.peakPrice,
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
};

/**
 * MinimalUrgencyCountdown - Compact version for constrained spaces
 */
export const MinimalUrgencyCountdown: React.FC<
  Omit<UrgencyCountdownProps, 'variant'>
> = (props) => {
  return <UrgencyCountdown {...props} variant="minimal" />;
};

/**
 * ProminentUrgencyCountdown - Full-featured version
 */
export const ProminentUrgencyCountdown: React.FC<
  Omit<UrgencyCountdownProps, 'variant'>
> = (props) => {
  return <UrgencyCountdown {...props} variant="prominent" />;
};

export default UrgencyCountdown;
