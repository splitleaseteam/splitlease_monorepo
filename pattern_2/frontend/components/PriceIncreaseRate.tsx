/**
 * Pattern 2: Urgency Countdown - PriceIncreaseRate Component
 *
 * Production-ready component showing daily price increase rate
 */

import React from 'react';
import { PriceIncreaseRateProps } from '../types';
import { formatCurrency } from '../utils/urgencyCalculations';
import '../styles/PriceIncreaseRate.css';

/**
 * PriceIncreaseRate - Display daily price increase rate
 *
 * Features:
 * - Clear rate communication
 * - Visual fire icon for urgency
 * - Calculation transparency
 * - Responsive design
 * - Urgency-based styling
 */
export const PriceIncreaseRate: React.FC<PriceIncreaseRateProps> = ({
  increaseRatePerDay,
  urgencyLevel,
  currentPrice,
  peakPrice,
  className = '',
}) => {
  // Don't show if no increase
  if (increaseRatePerDay <= 0) {
    return null;
  }

  // Calculate total potential increase
  const totalIncrease = peakPrice - currentPrice;
  const increasePercentage = (totalIncrease / currentPrice) * 100;

  return (
    <div
      className={`price-increase-rate rate-${urgencyLevel} ${className}`}
      role="status"
      aria-label={`Price increasing $${increaseRatePerDay} per day`}
      data-testid="price-increase-rate"
    >
      {/* Main rate display */}
      <div className="rate-container">
        <div className="rate-icon">
          {urgencyLevel === 'critical' && '🔥'}
          {urgencyLevel === 'high' && '📈'}
          {urgencyLevel === 'medium' && '⬆️'}
          {urgencyLevel === 'low' && '➡️'}
        </div>

        <div className="rate-content">
          <div className="rate-main">
            <span className="rate-label">Price increases</span>
            <span className="rate-value">
              ${formatCurrency(increaseRatePerDay)}
            </span>
            <span className="rate-period">/day</span>
          </div>

          {/* Additional context for high/critical urgency */}
          {(urgencyLevel === 'high' || urgencyLevel === 'critical') && (
            <div className="rate-context">
              Could reach ${formatCurrency(peakPrice)} at peak
            </div>
          )}
        </div>
      </div>

      {/* Visual indicator bar */}
      <div className="rate-indicator" aria-hidden="true">
        <div className="rate-indicator-bar">
          <div
            className="rate-indicator-fill"
            style={{ width: `${Math.min(100, increasePercentage)}%` }}
          />
        </div>
        <div className="rate-indicator-label">
          +{Math.round(increasePercentage)}% potential increase
        </div>
      </div>
    </div>
  );
};

/**
 * CompactPriceIncreaseRate - Minimal version
 */
export const CompactPriceIncreaseRate: React.FC<
  Pick<PriceIncreaseRateProps, 'increaseRatePerDay' | 'urgencyLevel' | 'className'>
> = ({ increaseRatePerDay, urgencyLevel, className = '' }) => {
  if (increaseRatePerDay <= 0) {
    return null;
  }

  return (
    <div
      className={`price-increase-rate-compact rate-${urgencyLevel} ${className}`}
      data-testid="price-increase-rate-compact"
    >
      <span className="rate-icon-compact">
        {urgencyLevel === 'critical' ? '🔥' : '📈'}
      </span>
      <span className="rate-text-compact">
        +${formatCurrency(increaseRatePerDay)}/day
      </span>
    </div>
  );
};

/**
 * DetailedPriceIncreaseRate - Extended version with breakdown
 */
export const DetailedPriceIncreaseRate: React.FC<PriceIncreaseRateProps> = ({
  increaseRatePerDay,
  urgencyLevel,
  currentPrice,
  peakPrice,
  className = '',
}) => {
  if (increaseRatePerDay <= 0) {
    return null;
  }

  const totalIncrease = peakPrice - currentPrice;
  const increasePercentage = (totalIncrease / currentPrice) * 100;

  // Calculate increases at different time intervals
  const increases = {
    daily: increaseRatePerDay,
    weekly: increaseRatePerDay * 7,
    twoWeeks: increaseRatePerDay * 14,
  };

  return (
    <div
      className={`price-increase-rate-detailed rate-${urgencyLevel} ${className}`}
      data-testid="price-increase-rate-detailed"
    >
      <div className="rate-header">
        <h4 className="rate-title">Price Increase Rate</h4>
        <div className="rate-urgency-badge">
          {urgencyLevel === 'critical' && '🔥 Critical'}
          {urgencyLevel === 'high' && '⚠️ High'}
          {urgencyLevel === 'medium' && '⏰ Moderate'}
          {urgencyLevel === 'low' && 'ℹ️ Low'}
        </div>
      </div>

      <div className="rate-breakdown">
        <div className="rate-item rate-primary">
          <span className="rate-item-label">Per Day</span>
          <span className="rate-item-value">
            +${formatCurrency(increases.daily)}
          </span>
        </div>

        <div className="rate-item">
          <span className="rate-item-label">Per Week</span>
          <span className="rate-item-value">
            +${formatCurrency(increases.weekly)}
          </span>
        </div>

        <div className="rate-item">
          <span className="rate-item-label">Two Weeks</span>
          <span className="rate-item-value">
            +${formatCurrency(increases.twoWeeks)}
          </span>
        </div>
      </div>

      <div className="rate-summary">
        <div className="summary-row">
          <span className="summary-label">Current Price:</span>
          <span className="summary-value">${formatCurrency(currentPrice)}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Peak Price:</span>
          <span className="summary-value">${formatCurrency(peakPrice)}</span>
        </div>
        <div className="summary-row summary-total">
          <span className="summary-label">Total Increase:</span>
          <span className="summary-value">
            +${formatCurrency(totalIncrease)} ({Math.round(increasePercentage)}%)
          </span>
        </div>
      </div>

      {/* Visual progress */}
      <div className="rate-visual">
        <div className="rate-progress-bar">
          <div
            className="rate-progress-current"
            style={{ width: '0%' }}
            title={`Current: $${formatCurrency(currentPrice)}`}
          />
          <div
            className="rate-progress-peak"
            style={{ width: `${Math.min(100, increasePercentage)}%` }}
            title={`Peak: $${formatCurrency(peakPrice)}`}
          />
        </div>
        <div className="rate-progress-labels">
          <span>Now</span>
          <span>Peak</span>
        </div>
      </div>
    </div>
  );
};

/**
 * PriceVelocityIndicator - Shows rate of price acceleration
 */
export const PriceVelocityIndicator: React.FC<{
  increaseRatePerDay: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  className?: string;
}> = ({ increaseRatePerDay, urgencyLevel, className = '' }) => {
  if (increaseRatePerDay <= 0) {
    return null;
  }

  // Determine velocity level
  let velocityLevel: 'slow' | 'moderate' | 'fast' | 'extreme';
  if (increaseRatePerDay < 50) velocityLevel = 'slow';
  else if (increaseRatePerDay < 100) velocityLevel = 'moderate';
  else if (increaseRatePerDay < 200) velocityLevel = 'fast';
  else velocityLevel = 'extreme';

  const velocityLabels = {
    slow: 'Gradual increase',
    moderate: 'Steady increase',
    fast: 'Rapid increase',
    extreme: 'Extreme acceleration',
  };

  return (
    <div
      className={`price-velocity velocity-${velocityLevel} urgency-${urgencyLevel} ${className}`}
      data-testid="price-velocity-indicator"
    >
      <div className="velocity-arrows">
        {velocityLevel === 'slow' && '→'}
        {velocityLevel === 'moderate' && '⬈'}
        {velocityLevel === 'fast' && '⬆️'}
        {velocityLevel === 'extreme' && '🚀'}
      </div>
      <div className="velocity-label">{velocityLabels[velocityLevel]}</div>
    </div>
  );
};

export default PriceIncreaseRate;
