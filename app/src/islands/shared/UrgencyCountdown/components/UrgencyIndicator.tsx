/**
 * Pattern 2: Urgency Countdown - UrgencyIndicator Component
 *
 * Production-ready urgency level indicator with visual feedback
 */

import React from 'react';
import { UrgencyIndicatorProps } from '../types';
import '../styles/UrgencyIndicator.css';

/**
 * UrgencyIndicator - Visual urgency level display
 *
 * Features:
 * - Color-coded urgency levels
 * - Progress bar visualization
 * - Animated indicators for critical urgency
 * - Accessibility support
 * - Responsive design
 */
export const UrgencyIndicator: React.FC<UrgencyIndicatorProps> = ({
  urgencyLevel,
  metadata,
  daysUntil,
  showProgressBar = true,
  className = '',
}) => {
  const { label, message, color, backgroundColor, animationIntensity } = metadata;

  // Calculate progress percentage (higher urgency = higher percentage)
  const progressPercentage = calculateProgressPercentage(daysUntil);

  return (
    <div
      className={`urgency-indicator urgency-${urgencyLevel} animate-${animationIntensity} ${className}`}
      style={{
        '--urgency-color': color,
        '--urgency-bg': backgroundColor,
      } as React.CSSProperties}
      role="status"
      aria-label={`${label}: ${message}`}
      data-testid="urgency-indicator"
    >
      {/* Urgency badge */}
      <div className="urgency-badge">
        <div className="badge-icon">
          {urgencyLevel === 'critical' && '🚨'}
          {urgencyLevel === 'high' && '⚠️'}
          {urgencyLevel === 'medium' && '⏰'}
          {urgencyLevel === 'low' && 'ℹ️'}
        </div>
        <div className="badge-content">
          <div className="badge-label">{label}</div>
          <div className="badge-message">{message}</div>
        </div>
      </div>

      {/* Progress bar */}
      {showProgressBar && (
        <div className="urgency-progress" aria-hidden="true">
          <div
            className="urgency-progress-fill"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="progress-shimmer" />
          </div>
          <div className="urgency-progress-label">
            {Math.round(progressPercentage)}% urgency
          </div>
        </div>
      )}

      {/* Pulsing indicator for critical urgency */}
      {urgencyLevel === 'critical' && (
        <div className="urgency-pulse" aria-hidden="true">
          <div className="pulse-ring" />
          <div className="pulse-ring pulse-delay-1" />
          <div className="pulse-ring pulse-delay-2" />
        </div>
      )}
    </div>
  );
};

/**
 * Calculate progress percentage based on days until check-in
 * More urgent = higher percentage
 */
function calculateProgressPercentage(daysUntil: number): number {
  // 90 days = 0%, 0 days = 100%
  const maxDays = 90;
  const percentage = ((maxDays - Math.min(daysUntil, maxDays)) / maxDays) * 100;
  return Math.max(0, Math.min(100, percentage));
}

/**
 * CompactUrgencyIndicator - Minimal urgency badge
 */
export const CompactUrgencyIndicator: React.FC<
  Omit<UrgencyIndicatorProps, 'showProgressBar'>
> = ({ urgencyLevel, metadata, className = '' }) => {
  const { label, color } = metadata;

  return (
    <span
      className={`urgency-indicator-compact urgency-${urgencyLevel} ${className}`}
      style={{ '--urgency-color': color } as React.CSSProperties}
      role="status"
      aria-label={label}
      data-testid="urgency-indicator-compact"
    >
      <span className="compact-dot" />
      <span className="compact-label">{label}</span>
    </span>
  );
};

/**
 * UrgencyBadge - Icon-only urgency indicator
 */
export const UrgencyBadge: React.FC<
  Pick<UrgencyIndicatorProps, 'urgencyLevel' | 'className'>
> = ({ urgencyLevel, className = '' }) => {
  const icons = {
    critical: '🚨',
    high: '⚠️',
    medium: '⏰',
    low: 'ℹ️',
  };

  const labels = {
    critical: 'Critical urgency',
    high: 'High urgency',
    medium: 'Medium urgency',
    low: 'Low urgency',
  };

  return (
    <span
      className={`urgency-badge-icon urgency-${urgencyLevel} ${className}`}
      role="img"
      aria-label={labels[urgencyLevel]}
      data-testid="urgency-badge"
    >
      {icons[urgencyLevel]}
    </span>
  );
};

/**
 * UrgencyProgressBar - Standalone progress bar
 */
export const UrgencyProgressBar: React.FC<{
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  daysUntil: number;
  showLabel?: boolean;
  className?: string;
}> = ({ urgencyLevel, daysUntil, showLabel = false, className = '' }) => {
  const progressPercentage = calculateProgressPercentage(daysUntil);

  return (
    <div
      className={`urgency-progress-standalone urgency-${urgencyLevel} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(progressPercentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${Math.round(progressPercentage)}% urgency level`}
      data-testid="urgency-progress-bar"
    >
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="progress-label">
          {Math.round(progressPercentage)}% urgency
        </div>
      )}
    </div>
  );
};

/**
 * UrgencyTimeline - Visual timeline showing urgency phases
 */
export const UrgencyTimeline: React.FC<{
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  daysUntil: number;
  className?: string;
}> = ({ urgencyLevel, daysUntil, className = '' }) => {
  const phases = [
    { level: 'low', label: 'Low', threshold: 14 },
    { level: 'medium', label: 'Med', threshold: 7 },
    { level: 'high', label: 'High', threshold: 3 },
    { level: 'critical', label: 'Critical', threshold: 0 },
  ];

  return (
    <div
      className={`urgency-timeline ${className}`}
      role="status"
      aria-label={`Current urgency: ${urgencyLevel}`}
      data-testid="urgency-timeline"
    >
      {phases.map((phase, index) => {
        const isActive = urgencyLevel === phase.level;
        const isPassed =
          index > phases.findIndex((p) => p.level === urgencyLevel);

        return (
          <div
            key={phase.level}
            className={`timeline-phase ${
              isActive ? 'phase-active' : isPassed ? 'phase-passed' : 'phase-upcoming'
            }`}
          >
            <div className="phase-marker" />
            <div className="phase-label">{phase.label}</div>
            {index < phases.length - 1 && <div className="phase-connector" />}
          </div>
        );
      })}
    </div>
  );
};

export default UrgencyIndicator;
