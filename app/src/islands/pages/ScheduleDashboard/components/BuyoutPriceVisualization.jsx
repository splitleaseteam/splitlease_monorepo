/**
 * Buyout Price Visualization Component
 *
 * Displays a bar chart showing suggested buyout prices for the next 14 days.
 * - X-Axis: Dates
 * - Y-Axis: Suggested Price
 * - Color coding:
 *   - Green: Within preferred range
 *   - Yellow: Near floor/ceiling
 *   - Red: Outside acceptable range (clamped)
 *
 * Updates live as user adjusts formula settings.
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format date for display (e.g., "Jan 15")
 */
function formatDateShort(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get day of week abbreviation (e.g., "Mon")
 */
function getDayAbbrev(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Determine bar color based on price relative to floor/ceiling
 */
function getBarColor(price, floor, ceiling) {
  const range = ceiling - floor;
  const buffer = range * 0.15; // 15% buffer zone

  if (price <= floor || price >= ceiling) {
    return 'red'; // At or beyond limits (clamped)
  }
  if (price <= floor + buffer || price >= ceiling - buffer) {
    return 'yellow'; // Near limits
  }
  return 'green'; // Comfortable range
}

/**
 * Calculate bar height as percentage
 */
function calculateBarHeight(price, minPrice, maxPrice) {
  if (maxPrice === minPrice) return 50;
  const normalized = (price - minPrice) / (maxPrice - minPrice);
  // Clamp between 10% and 100%
  return Math.max(10, Math.min(100, normalized * 90 + 10));
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PriceBar({ data, barHeight, color }) {
  return (
    <div className="buyout-viz__bar-container">
      <div className="buyout-viz__price-label">
        ${data.suggestedPrice.toFixed(0)}
      </div>
      <div className="buyout-viz__bar-wrapper">
        <div
          className={`buyout-viz__bar buyout-viz__bar--${color}`}
          style={{ height: `${barHeight}%` }}
          title={`$${data.suggestedPrice.toFixed(2)} - ${data.factors?.join(', ') || 'Base rate'}`}
        />
      </div>
      <div className="buyout-viz__date-label">
        <span className="buyout-viz__day">{getDayAbbrev(data.date)}</span>
        <span className="buyout-viz__date">{formatDateShort(data.date)}</span>
      </div>
    </div>
  );
}

function EmptyVisualization() {
  return (
    <div className="buyout-viz buyout-viz--empty">
      <div className="buyout-viz__empty-state">
        <span className="buyout-viz__empty-icon" aria-hidden="true">&#x1F4CA;</span>
        <p>Adjust the settings to see how prices change</p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BuyoutPriceVisualization({
  prices = [],
  floorPrice = 50,
  ceilingPrice = 300
}) {
  // Calculate visualization metrics
  const { minPrice, maxPrice, pricesWithMeta } = useMemo(() => {
    if (!prices || prices.length === 0) {
      return { minPrice: 0, maxPrice: 100, pricesWithMeta: [] };
    }

    const allPrices = prices.map(p => p.suggestedPrice);
    const min = Math.min(...allPrices, floorPrice);
    const max = Math.max(...allPrices, ceilingPrice);

    const withMeta = prices.map(p => {
      const d = typeof p.date === 'string' ? new Date(p.date) : p.date;
      return {
        ...p,
        color: getBarColor(p.suggestedPrice, floorPrice, ceilingPrice),
        barHeight: calculateBarHeight(p.suggestedPrice, min, max)
      };
    });

    return { minPrice: min, maxPrice: max, pricesWithMeta: withMeta };
  }, [prices, floorPrice, ceilingPrice]);

  if (!prices || prices.length === 0) {
    return <EmptyVisualization />;
  }

  return (
    <div className="buyout-viz">
      <div className="buyout-viz__header">
        <h5 className="buyout-viz__title">Price Preview (Next 14 Days)</h5>
      </div>

      {/* Y-Axis Labels */}
      <div className="buyout-viz__chart-container">
        <div className="buyout-viz__y-axis">
          <span className="buyout-viz__y-label">${maxPrice.toFixed(0)}</span>
          <span className="buyout-viz__y-label buyout-viz__y-label--ceiling">
            ${ceilingPrice}
            <span className="buyout-viz__y-indicator">Ceiling</span>
          </span>
          <span className="buyout-viz__y-label buyout-viz__y-label--floor">
            ${floorPrice}
            <span className="buyout-viz__y-indicator">Floor</span>
          </span>
          <span className="buyout-viz__y-label">${minPrice.toFixed(0)}</span>
        </div>

        {/* Bars */}
        <div className="buyout-viz__chart">
          {/* Floor/Ceiling lines */}
          <div
            className="buyout-viz__threshold-line buyout-viz__threshold-line--ceiling"
            style={{
              bottom: `${calculateBarHeight(ceilingPrice, minPrice, maxPrice)}%`
            }}
          />
          <div
            className="buyout-viz__threshold-line buyout-viz__threshold-line--floor"
            style={{
              bottom: `${calculateBarHeight(floorPrice, minPrice, maxPrice)}%`
            }}
          />

          {/* Price Bars */}
          <div className="buyout-viz__bars">
            {pricesWithMeta.map((priceData, index) => (
              <PriceBar
                key={index}
                data={priceData}
                barHeight={priceData.barHeight}
                color={priceData.color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="buyout-viz__legend">
        <div className="buyout-viz__legend-item">
          <span className="buyout-viz__legend-color buyout-viz__legend-color--green" />
          <span>Within Range</span>
        </div>
        <div className="buyout-viz__legend-item">
          <span className="buyout-viz__legend-color buyout-viz__legend-color--yellow" />
          <span>Near Limit</span>
        </div>
        <div className="buyout-viz__legend-item">
          <span className="buyout-viz__legend-color buyout-viz__legend-color--red" />
          <span>At Limit</span>
        </div>
      </div>
    </div>
  );
}

BuyoutPriceVisualization.propTypes = {
  prices: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    suggestedPrice: PropTypes.number.isRequired,
    factors: PropTypes.arrayOf(PropTypes.string)
  })),
  floorPrice: PropTypes.number,
  ceilingPrice: PropTypes.number
};
