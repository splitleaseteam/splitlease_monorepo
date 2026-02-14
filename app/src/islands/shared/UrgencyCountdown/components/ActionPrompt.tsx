/**
 * Pattern 2: Urgency Countdown - ActionPrompt Component
 *
 * Production-ready CTA component for urgency-based actions
 */

import React from 'react';
import { ActionPromptProps } from '../types';
import { formatCurrency } from '../utils/urgencyCalculations';
import '../styles/ActionPrompt.css';

/**
 * ActionPrompt - Urgency-based call-to-action button
 *
 * Features:
 * - Urgency-appropriate messaging
 * - Price locking language
 * - Animated effects for critical urgency
 * - Disabled/loading states
 * - Accessibility support
 */
export const ActionPrompt: React.FC<ActionPromptProps> = ({
  currentPrice,
  urgencyLevel,
  savings,
  onClick,
  disabled = false,
  loading = false,
  className = '',
}) => {
  // Get urgency-specific messaging
  const { ctaLabel, savingsText, icon } = getPromptContent(
    urgencyLevel,
    currentPrice,
    savings
  );

  return (
    <div
      className={`action-prompt prompt-${urgencyLevel} ${className}`}
      data-testid="action-prompt"
    >
      {/* Savings message (if applicable) */}
      {savings && savings > 0 && (
        <div className="prompt-savings">
          <span className="savings-icon">💰</span>
          <span className="savings-text">{savingsText}</span>
        </div>
      )}

      {/* Main CTA button */}
      <button
        type="button"
        className={`prompt-button button-${urgencyLevel} ${
          loading ? 'button-loading' : ''
        }`}
        onClick={onClick}
        disabled={disabled || loading}
        aria-label={`${ctaLabel}. Price: $${currentPrice}`}
        data-testid="action-prompt-button"
      >
        {loading ? (
          <span className="button-content">
            <span className="loading-spinner" />
            <span className="button-text">Processing...</span>
          </span>
        ) : (
          <span className="button-content">
            {icon && <span className="button-icon">{icon}</span>}
            <span className="button-text">{ctaLabel}</span>
            <span className="button-arrow">→</span>
          </span>
        )}
      </button>

      {/* Price display */}
      <div className="prompt-price">
        <span className="price-label">Lock in rate:</span>
        <span className="price-value">${formatCurrency(currentPrice)}</span>
      </div>

      {/* Critical urgency pulse effect */}
      {urgencyLevel === 'critical' && !disabled && !loading && (
        <div className="prompt-pulse" aria-hidden="true">
          <div className="pulse-ring" />
          <div className="pulse-ring pulse-delay-1" />
        </div>
      )}
    </div>
  );
};

/**
 * Get prompt content based on urgency level
 */
function getPromptContent(
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical',
  currentPrice: number,
  savings?: number
): {
  ctaLabel: string;
  savingsText: string;
  icon?: string;
} {
  const formattedPrice = formatCurrency(currentPrice);
  const formattedSavings = savings ? formatCurrency(savings) : '0';

  const content = {
    low: {
      ctaLabel: 'Reserve at This Price',
      savingsText: `Book early to save`,
      icon: '📅',
    },
    medium: {
      ctaLabel: `Lock in $${formattedPrice}`,
      savingsText: `Save $${formattedSavings} by booking today`,
      icon: '🔒',
    },
    high: {
      ctaLabel: `Secure $${formattedPrice} Now`,
      savingsText: `Act fast - save $${formattedSavings}`,
      icon: '⚡',
    },
    critical: {
      ctaLabel: `BOOK NOW AT $${formattedPrice}`,
      savingsText: `URGENT - Save $${formattedSavings} in next 6 hours`,
      icon: '🚨',
    },
  };

  return content[urgencyLevel];
}

/**
 * CompactActionPrompt - Minimal CTA button
 */
export const CompactActionPrompt: React.FC<
  Omit<ActionPromptProps, 'savings'>
> = ({ currentPrice, urgencyLevel, onClick, disabled, loading, className = '' }) => {
  const ctaLabel =
    urgencyLevel === 'critical'
      ? 'BOOK NOW'
      : urgencyLevel === 'high'
        ? 'Secure Rate'
        : 'Book';

  return (
    <button
      type="button"
      className={`action-prompt-compact prompt-${urgencyLevel} ${
        loading ? 'button-loading' : ''
      } ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid="action-prompt-compact"
    >
      {loading ? (
        <span className="loading-spinner" />
      ) : (
        <>
          <span>{ctaLabel}</span>
          <span className="compact-price">${formatCurrency(currentPrice)}</span>
        </>
      )}
    </button>
  );
};

/**
 * SplitActionPrompt - Primary and secondary actions
 */
export const SplitActionPrompt: React.FC<
  ActionPromptProps & {
    onSecondaryClick?: () => void;
    secondaryText?: string;
  }
> = ({
  currentPrice,
  urgencyLevel,
  savings,
  onClick,
  onSecondaryClick,
  secondaryText = 'Learn More',
  disabled,
  loading,
  className = '',
}) => {
  const { ctaLabel, savingsText, icon } = getPromptContent(
    urgencyLevel,
    currentPrice,
    savings
  );

  return (
    <div
      className={`action-prompt-split prompt-${urgencyLevel} ${className}`}
      data-testid="action-prompt-split"
    >
      {/* Savings message */}
      {savings && savings > 0 && (
        <div className="prompt-savings">{savingsText}</div>
      )}

      {/* Button group */}
      <div className="prompt-buttons">
        {/* Primary action */}
        <button
          type="button"
          className={`prompt-primary button-${urgencyLevel}`}
          onClick={onClick}
          disabled={disabled || loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              {icon && <span>{icon}</span>}
              <span>{ctaLabel}</span>
            </>
          )}
        </button>

        {/* Secondary action */}
        {onSecondaryClick && (
          <button
            type="button"
            className="prompt-secondary"
            onClick={onSecondaryClick}
            disabled={disabled || loading}
          >
            {secondaryText}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * TimerActionPrompt - CTA with countdown timer
 */
export const TimerActionPrompt: React.FC<
  ActionPromptProps & {
    expiresAt?: Date;
  }
> = ({
  currentPrice,
  urgencyLevel,
  savings,
  onClick,
  expiresAt,
  disabled,
  loading,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  React.useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiresAt.getTime() - now;

      if (distance < 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        hours > 0
          ? `${hours}h ${minutes}m`
          : `${minutes}m ${seconds}s`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const { ctaLabel, savingsText, icon } = getPromptContent(
    urgencyLevel,
    currentPrice,
    savings
  );

  return (
    <div
      className={`action-prompt-timer prompt-${urgencyLevel} ${className}`}
      data-testid="action-prompt-timer"
    >
      {/* Timer display */}
      {expiresAt && timeLeft && (
        <div className="prompt-timer">
          <span className="timer-icon">⏰</span>
          <span className="timer-text">
            This rate expires in <strong>{timeLeft}</strong>
          </span>
        </div>
      )}

      {/* Savings message */}
      {savings && savings > 0 && (
        <div className="prompt-savings">{savingsText}</div>
      )}

      {/* CTA button */}
      <button
        type="button"
        className={`prompt-button button-${urgencyLevel}`}
        onClick={onClick}
        disabled={disabled || loading || timeLeft === 'Expired'}
      >
        {loading ? (
          <span className="loading-spinner" />
        ) : (
          <>
            {icon && <span>{icon}</span>}
            <span>{ctaLabel}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ActionPrompt;
