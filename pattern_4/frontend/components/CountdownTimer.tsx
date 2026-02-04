/**
 * COUNTDOWN TIMER COMPONENT
 *
 * Real-time countdown timer for bidding session expiration.
 * Updates every second with visual urgency indicators.
 *
 * Features:
 * - Live countdown
 * - Urgency color states
 * - Auto-expiration callback
 * - Formatted time display
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';

interface CountdownTimerProps {
  expiresAt: Date;
  onExpire?: () => void;
  showMilliseconds?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  totalSeconds: number;
  isExpired: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpire,
  showMilliseconds = false
}) => {

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(expiresAt)
  );

  // Update every second (or every 100ms if showing milliseconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      // Call expiration callback
      if (remaining.isExpired && onExpire) {
        onExpire();
        clearInterval(interval);
      }
    }, showMilliseconds ? 100 : 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire, showMilliseconds]);

  // Determine urgency level
  const urgencyLevel = getUrgencyLevel(timeRemaining.totalSeconds);

  if (timeRemaining.isExpired) {
    return (
      <div className="countdown-timer expired">
        <div className="timer-display">
          <span className="timer-icon">⏰</span>
          <span className="timer-text">Time's Up!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`countdown-timer urgency-${urgencyLevel}`}>

      {/* Visual Countdown Display */}
      <div className="timer-display">

        {/* Days (if > 0) */}
        {timeRemaining.days > 0 && (
          <div className="time-segment">
            <div className="time-value">{pad(timeRemaining.days)}</div>
            <div className="time-label">days</div>
          </div>
        )}

        {/* Hours */}
        <div className="time-segment">
          <div className="time-value">{pad(timeRemaining.hours)}</div>
          <div className="time-label">hours</div>
        </div>

        {/* Separator */}
        <div className="time-separator">:</div>

        {/* Minutes */}
        <div className="time-segment">
          <div className="time-value">{pad(timeRemaining.minutes)}</div>
          <div className="time-label">min</div>
        </div>

        {/* Separator */}
        <div className="time-separator">:</div>

        {/* Seconds */}
        <div className="time-segment">
          <div className="time-value">{pad(timeRemaining.seconds)}</div>
          <div className="time-label">sec</div>
        </div>

        {/* Milliseconds (optional) */}
        {showMilliseconds && (
          <>
            <div className="time-separator">.</div>
            <div className="time-segment milliseconds">
              <div className="time-value">
                {pad(Math.floor(timeRemaining.milliseconds / 100), 1)}
              </div>
            </div>
          </>
        )}

      </div>

      {/* Urgency Warning */}
      {urgencyLevel === 'critical' && (
        <div className="urgency-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">Less than 5 minutes left!</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="countdown-progress">
        <div
          className="progress-fill"
          style={{
            width: `${getProgressPercentage(timeRemaining.totalSeconds, expiresAt)}%`
          }}
        />
      </div>

    </div>
  );
};

/**
 * Calculate time remaining until expiration
 */
function calculateTimeRemaining(expiresAt: Date): TimeRemaining {
  const now = new Date().getTime();
  const target = new Date(expiresAt).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
      totalSeconds: 0,
      isExpired: true
    };
  }

  const milliseconds = diff % 1000;
  const totalSeconds = Math.floor(diff / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const days = Math.floor(totalSeconds / 86400);

  return {
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    totalSeconds,
    isExpired: false
  };
}

/**
 * Determine urgency level based on time remaining
 */
function getUrgencyLevel(totalSeconds: number): 'low' | 'medium' | 'high' | 'critical' {
  if (totalSeconds <= 300) return 'critical'; // < 5 minutes
  if (totalSeconds <= 900) return 'high';     // < 15 minutes
  if (totalSeconds <= 1800) return 'medium';  // < 30 minutes
  return 'low';
}

/**
 * Calculate progress percentage (inverse - fills as time decreases)
 */
function getProgressPercentage(currentSeconds: number, expiresAt: Date): number {
  // Assume session started 1 hour ago (3600 seconds)
  const totalDuration = 3600;
  const elapsed = totalDuration - currentSeconds;
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
}

/**
 * Pad number with leading zeros
 */
function pad(num: number, length: number = 2): string {
  return num.toString().padStart(length, '0');
}

export default CountdownTimer;
