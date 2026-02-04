/**
 * Pattern 2: Urgency Countdown - PriceProgression Component
 *
 * Production-ready price projection display showing future price increases
 */

import React from 'react';
import { PriceProgressionProps } from '../types';
import { formatCurrency, formatPercentage } from '../utils/urgencyCalculations';
import { differenceInDays, formatProjectionTimeline } from '../utils/dateFormatting';
import '../styles/PriceProgression.css';

/**
 * PriceProgression - Display future price projections
 *
 * Features:
 * - Clear timeline labels
 * - Price increase indicators
 * - Percentage change display
 * - Responsive layout
 * - Accessibility support
 */
export const PriceProgression: React.FC<PriceProgressionProps> = ({
  projections,
  currentPrice,
  urgencyLevel,
  maxProjections = 3,
  showPercentage = true,
  className = '',
}) => {
  if (projections.length === 0) {
    return null;
  }

  // Limit number of projections shown
  const limitedProjections = projections.slice(0, maxProjections);

  // Calculate current days for timeline formatting
  const firstProjection = projections[0];
  const currentDays = firstProjection.daysOut + 1; // Approximate

  return (
    <div
      className={`price-progression price-progression-${urgencyLevel} ${className}`}
      data-testid="price-progression"
    >
      <div className="progression-header">
        <h4 className="progression-title">Price Increases</h4>
        <p className="progression-subtitle">
          Future pricing if you wait
        </p>
      </div>

      <div className="progression-list">
        {limitedProjections.map((projection, index) => {
          const timelineText = formatProjectionTimeline(
            currentDays,
            projection.daysOut
          );

          const isPositiveIncrease = projection.increaseFromCurrent > 0;
          const increaseMagnitude = Math.abs(projection.increaseFromCurrent);
          const percentIncrease = Math.abs(projection.percentageIncrease);

          return (
            <div
              key={projection.daysOut}
              className={`progression-item ${
                isPositiveIncrease ? 'progression-increase' : 'progression-same'
              }`}
              data-testid={`projection-${index}`}
            >
              {/* Timeline label */}
              <div className="progression-timeline">
                <span className="timeline-icon">
                  {projection.daysOut === 1 && '🔴'}
                  {projection.daysOut === 3 && '🟠'}
                  {projection.daysOut > 3 && '🟡'}
                </span>
                <span className="timeline-text">{timelineText}</span>
              </div>

              {/* Price display */}
              <div className="progression-price-container">
                <div className="progression-price">
                  ${formatCurrency(projection.price)}
                  <span className="price-night">/night</span>
                </div>

                {/* Increase indicator */}
                {isPositiveIncrease && (
                  <div className="progression-increase-badge">
                    <span className="increase-arrow">↑</span>
                    <span className="increase-amount">
                      +${formatCurrency(increaseMagnitude)}
                    </span>
                    {showPercentage && (
                      <span className="increase-percentage">
                        ({formatPercentage(percentIncrease, 0)})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="progression-bar-container">
                <div
                  className="progression-bar"
                  style={{
                    width: `${Math.min(100, (projection.price / currentPrice) * 50)}%`,
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total increase summary */}
      {limitedProjections.length > 0 && (
        <div className="progression-summary">
          <div className="summary-icon">📈</div>
          <div className="summary-text">
            Price could increase by{' '}
            <strong>
              ${formatCurrency(limitedProjections[limitedProjections.length - 1].increaseFromCurrent)}
            </strong>{' '}
            if you wait
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * CompactPriceProgression - Minimal version for tight spaces
 */
export const CompactPriceProgression: React.FC<
  Omit<PriceProgressionProps, 'maxProjections' | 'showPercentage'>
> = ({ projections, currentPrice, urgencyLevel, className = '' }) => {
  if (projections.length === 0) {
    return null;
  }

  // Show only the most distant projection (highest increase)
  const maxProjection = projections[projections.length - 1];
  const increase = maxProjection.increaseFromCurrent;

  if (increase <= 0) {
    return null;
  }

  return (
    <div
      className={`price-progression-compact progression-${urgencyLevel} ${className}`}
      data-testid="price-progression-compact"
    >
      <span className="compact-icon">📈</span>
      <span className="compact-text">
        +${formatCurrency(increase)} later
      </span>
    </div>
  );
};

/**
 * PriceProgressionTable - Tabular display for detailed view
 */
export const PriceProgressionTable: React.FC<PriceProgressionProps> = ({
  projections,
  currentPrice,
  urgencyLevel,
  showPercentage = true,
  className = '',
}) => {
  if (projections.length === 0) {
    return null;
  }

  const currentDays = projections[0].daysOut + 1;

  return (
    <div
      className={`price-progression-table progression-${urgencyLevel} ${className}`}
      data-testid="price-progression-table"
    >
      <table className="progression-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Days Out</th>
            <th>Price</th>
            <th>Increase</th>
            {showPercentage && <th>Change</th>}
          </tr>
        </thead>
        <tbody>
          {projections.map((projection) => {
            const timelineText = formatProjectionTimeline(
              currentDays,
              projection.daysOut
            );

            return (
              <tr key={projection.daysOut}>
                <td className="table-timeline">{timelineText}</td>
                <td className="table-days">{projection.daysOut}</td>
                <td className="table-price">
                  ${formatCurrency(projection.price)}
                </td>
                <td className="table-increase">
                  {projection.increaseFromCurrent > 0 ? '+' : ''}
                  ${formatCurrency(Math.abs(projection.increaseFromCurrent))}
                </td>
                {showPercentage && (
                  <td className="table-percentage">
                    {projection.increaseFromCurrent > 0 ? '+' : ''}
                    {formatPercentage(projection.percentageIncrease, 1)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * PriceProgressionChart - Visual chart representation
 */
export const PriceProgressionChart: React.FC<PriceProgressionProps> = ({
  projections,
  currentPrice,
  urgencyLevel,
  className = '',
}) => {
  if (projections.length === 0) {
    return null;
  }

  // Find max price for scaling
  const maxPrice = Math.max(
    currentPrice,
    ...projections.map((p) => p.price)
  );

  const currentDays = projections[0].daysOut + 1;

  return (
    <div
      className={`price-progression-chart progression-${urgencyLevel} ${className}`}
      data-testid="price-progression-chart"
    >
      <div className="chart-header">
        <h4>Price Trajectory</h4>
      </div>

      <div className="chart-container">
        {/* Y-axis labels */}
        <div className="chart-y-axis">
          <div className="y-label">${formatCurrency(maxPrice)}</div>
          <div className="y-label">${formatCurrency(maxPrice / 2)}</div>
          <div className="y-label">$0</div>
        </div>

        {/* Chart bars */}
        <div className="chart-bars">
          {projections.map((projection) => {
            const heightPercent = (projection.price / maxPrice) * 100;
            const timelineText = formatProjectionTimeline(
              currentDays,
              projection.daysOut
            );

            return (
              <div key={projection.daysOut} className="chart-bar-container">
                <div
                  className="chart-bar"
                  style={{ height: `${heightPercent}%` }}
                  title={`${timelineText}: $${formatCurrency(projection.price)}`}
                >
                  <div className="bar-fill" />
                </div>
                <div className="chart-label">{timelineText}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PriceProgression;
