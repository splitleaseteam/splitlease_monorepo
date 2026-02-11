/**
 * COUNTDOWN TIMER COMPONENT
 *
 * Real-time countdown timer for bidding session expiration.
 * Updates every second with visual urgency indicators.
 *
 * @module BiddingInterface
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';

/**
 * Calculate time remaining until expiration
 *
 * @param {Date} expiresAt - Expiration timestamp
 * @returns {Object} Time remaining breakdown
 */
function calculateTimeRemaining(expiresAt) {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  const diff = expires - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: true
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isExpired: false
  };
}

/**
 * Get urgency level based on time remaining
 *
 * @param {number} totalSeconds - Total seconds remaining
 * @returns {'low' | 'medium' | 'high' | 'critical'} Urgency level
 */
function getUrgencyLevel(totalSeconds) {
  if (totalSeconds > 3600) return 'low'; // > 1 hour
  if (totalSeconds > 600) return 'medium'; // > 10 minutes
  if (totalSeconds > 60) return 'high'; // > 1 minute
  return 'critical'; // < 1 minute
}

/**
 * Pad number with leading zero
 *
 * @param {number} num - Number to pad
 * @returns {string} Padded string
 */
function pad(num) {
  return String(num).padStart(2, '0');
}

/**
 * Countdown Timer Component
 *
 * @param {Object} props
 * @param {Date} props.expiresAt - Expiration timestamp
 * @param {Function} [props.onExpire] - Callback when timer expires
 */
export default function CountdownTimer({ expiresAt, onExpire }) {
  const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeRemaining(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      if (remaining.isExpired && onExpire) {
        onExpire();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const urgencyLevel = getUrgencyLevel(timeRemaining.totalSeconds);

  if (timeRemaining.isExpired) {
    return (
      <div className="countdown-timer countdown-timer--expired">
        <span className="countdown-timer__icon">⏰</span>
        <span className="countdown-timer__text">Time&apos;s Up!</span>
      </div>
    );
  }

  return (
    <div className={`countdown-timer countdown-timer--urgency-${urgencyLevel}`}>
      <div className="countdown-timer__display">
        {timeRemaining.days > 0 && (
          <div className="countdown-timer__segment">
            <div className="countdown-timer__value">{pad(timeRemaining.days)}</div>
            <div className="countdown-timer__label">days</div>
          </div>
        )}

        <div className="countdown-timer__segment">
          <div className="countdown-timer__value">{pad(timeRemaining.hours)}</div>
          <div className="countdown-timer__label">hr</div>
        </div>

        <div className="countdown-timer__separator">:</div>

        <div className="countdown-timer__segment">
          <div className="countdown-timer__value">{pad(timeRemaining.minutes)}</div>
          <div className="countdown-timer__label">min</div>
        </div>

        <div className="countdown-timer__separator">:</div>

        <div className="countdown-timer__segment">
          <div className="countdown-timer__value">{pad(timeRemaining.seconds)}</div>
          <div className="countdown-timer__label">sec</div>
        </div>
      </div>

      {urgencyLevel === 'critical' && (
        <div className="countdown-timer__warning">
          ⚠️ Bidding ends soon!
        </div>
      )}
    </div>
  );
}
