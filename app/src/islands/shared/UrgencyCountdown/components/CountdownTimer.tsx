/**
 * Pattern 2: Urgency Countdown - CountdownTimer Component
 *
 * Production-ready countdown timer with adaptive formatting
 * and urgency-based styling
 */

import React from 'react';
import { CountdownTimerProps, CountdownConfig } from '../types';
import { useCountdownWithVisibility } from '../hooks/useCountdown';
import { formatCountdownText, formatTimeRemaining } from '../utils/dateFormatting';
import '../styles/CountdownTimer.css';

const DEFAULT_CONFIG: CountdownConfig = {
  showDays: true,
  showHours: true,
  showMinutes: false,
  showSeconds: false,
  format: 'long',
};

/**
 * CountdownTimer - Auto-updating countdown display
 *
 * Features:
 * - Adaptive update intervals based on urgency
 * - Responsive formatting (days → hours → minutes)
 * - Urgency-based animations and styling
 * - Accessibility support
 * - Battery-optimized (pauses when tab hidden)
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  urgencyLevel,
  config = DEFAULT_CONFIG,
  onTick,
  className = '',
}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const {
    timeRemaining,
    isComplete,
  } = useCountdownWithVisibility(targetDate, {
    onTick,
    enabled: true,
  });

  const { days, hours, minutes, seconds, totalHours } = timeRemaining;

  // Handle completion
  if (isComplete) {
    return (
      <div
        className={`countdown-timer countdown-complete ${className}`}
        role="timer"
        aria-label="Check-in time has arrived"
      >
        <div className="countdown-icon">🎉</div>
        <div className="countdown-text">Check-in time!</div>
      </div>
    );
  }

  // Determine display format based on time remaining
  const showInDays = days > 0 && mergedConfig.showDays;
  const showInHours = days === 0 && hours > 0 && mergedConfig.showHours;
  const showInMinutes = days === 0 && hours === 0 && mergedConfig.showMinutes;

  // Format main countdown text
  const countdownText = formatCountdownText(days, totalHours);

  // Format detailed time (for tooltips or extended display)
  const detailedTime = formatTimeRemaining(timeRemaining, mergedConfig.format);

  // Generate ARIA label for accessibility
  const ariaLabel = `${countdownText}. ${urgencyLevel} urgency level.`;

  return (
    <div
      className={`countdown-timer countdown-${urgencyLevel} ${className}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={ariaLabel}
      data-testid="countdown-timer"
    >
      {/* Clock Icon */}
      <div className={`countdown-icon animate-${urgencyLevel}`}>
        {urgencyLevel === 'critical' && '🚨'}
        {urgencyLevel === 'high' && '⏰'}
        {urgencyLevel === 'medium' && '⏱️'}
        {urgencyLevel === 'low' && '📅'}
      </div>

      {/* Main Countdown Text */}
      <div className="countdown-content">
        {showInDays && (
          <div className="countdown-main">
            <span className="countdown-number" data-testid="countdown-days">
              {days}
            </span>
            <span className="countdown-unit">
              {days === 1 ? 'day' : 'days'}
            </span>
            <span className="countdown-suffix">until check-in</span>
          </div>
        )}

        {showInHours && (
          <div className="countdown-main">
            <span className="countdown-number" data-testid="countdown-hours">
              {hours}
            </span>
            <span className="countdown-unit">
              {hours === 1 ? 'hour' : 'hours'}
            </span>
            <span className="countdown-suffix">until check-in</span>
          </div>
        )}

        {showInMinutes && (
          <div className="countdown-main">
            <span className="countdown-number" data-testid="countdown-minutes">
              {minutes}
            </span>
            <span className="countdown-unit">
              {minutes === 1 ? 'minute' : 'minutes'}
            </span>
            <span className="countdown-suffix">until check-in</span>
          </div>
        )}

        {/* Secondary time display for critical urgency */}
        {urgencyLevel === 'critical' && days === 0 && hours > 0 && (
          <div className="countdown-secondary">
            ({minutes} minutes)
          </div>
        )}

        {/* Detailed time tooltip */}
        <div className="countdown-tooltip" aria-hidden="true">
          {detailedTime} remaining
        </div>
      </div>

      {/* Urgency indicator dot */}
      <div className={`urgency-dot urgency-dot-${urgencyLevel}`} aria-hidden="true" />
    </div>
  );
};

/**
 * CompactCountdownTimer - Minimal countdown for tight spaces
 */
export const CompactCountdownTimer: React.FC<
  Omit<CountdownTimerProps, 'config'>
> = ({ targetDate, urgencyLevel, className = '' }) => {
  const { timeRemaining, isComplete } = useCountdownWithVisibility(targetDate);

  const { days, hours, totalHours } = timeRemaining;

  if (isComplete) {
    return (
      <span className={`countdown-compact countdown-complete ${className}`}>
        Now!
      </span>
    );
  }

  return (
    <span
      className={`countdown-compact countdown-${urgencyLevel} ${className}`}
      role="timer"
      aria-label={formatCountdownText(days, totalHours)}
    >
      {days > 0 ? `${days}d` : `${hours}h`}
    </span>
  );
};

/**
 * DetailedCountdownTimer - Full breakdown with days, hours, minutes
 */
export const DetailedCountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  urgencyLevel,
  className = '',
}) => {
  const { timeRemaining, isComplete } = useCountdownWithVisibility(targetDate);

  const { days, hours, minutes, seconds } = timeRemaining;

  if (isComplete) {
    return (
      <div className={`countdown-detailed countdown-complete ${className}`}>
        <div className="time-unit">
          <span className="time-value">00</span>
          <span className="time-label">days</span>
        </div>
        <div className="time-separator">:</div>
        <div className="time-unit">
          <span className="time-value">00</span>
          <span className="time-label">hours</span>
        </div>
        <div className="time-separator">:</div>
        <div className="time-unit">
          <span className="time-value">00</span>
          <span className="time-label">min</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`countdown-detailed countdown-${urgencyLevel} ${className}`}
      role="timer"
      aria-label={formatCountdownText(days, days * 24 + hours)}
    >
      {days > 0 && (
        <>
          <div className="time-unit">
            <span className="time-value">{String(days).padStart(2, '0')}</span>
            <span className="time-label">days</span>
          </div>
          <div className="time-separator">:</div>
        </>
      )}

      <div className="time-unit">
        <span className="time-value">{String(hours).padStart(2, '0')}</span>
        <span className="time-label">hours</span>
      </div>

      <div className="time-separator">:</div>

      <div className="time-unit">
        <span className="time-value">{String(minutes).padStart(2, '0')}</span>
        <span className="time-label">min</span>
      </div>

      {urgencyLevel === 'critical' && (
        <>
          <div className="time-separator">:</div>
          <div className="time-unit">
            <span className="time-value">{String(seconds).padStart(2, '0')}</span>
            <span className="time-label">sec</span>
          </div>
        </>
      )}
    </div>
  );
};

export default CountdownTimer;
