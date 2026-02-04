/**
 * PATTERN 3: PRICE ANCHORING - PriceComparisonChart Component
 * Visual chart showing price comparison across options
 */

import React from 'react';
import type { PriceComparisonChartProps } from '../types';
import { formatCurrencyWithSymbol } from '../utils';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * PriceComparisonChart Component
 *
 * Visual bar chart showing price differences across options
 *
 * @example
 * ```tsx
 * <PriceComparisonChart
 *   options={sortedOptions}
 *   anchor={anchorPrice}
 *   selectedOption="crash"
 * />
 * ```
 */
export const PriceComparisonChart: React.FC<PriceComparisonChartProps> = ({
  options,
  anchor,
  selectedOption,
  className = '',
}) => {
  // ========================================================================
  // CALCULATIONS
  // ========================================================================

  // Find max price for scaling
  const maxPrice = Math.max(...options.map((opt) => opt.totalCost));

  // Calculate bar widths as percentages
  const optionsWithWidths = options.map((opt) => ({
    ...opt,
    widthPercent: (opt.totalCost / maxPrice) * 100,
  }));

  // ========================================================================
  // COLOR MAPPING
  // ========================================================================

  const colorMap: Record<string, string> = {
    buyout: '#FFD700',
    crash: '#4ECDC4',
    swap: '#4CAF50',
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className={`price-comparison-chart ${className}`}>
      {/* Header */}
      <div
        style={{
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        <h4
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1A1A1A',
            marginBottom: '4px',
          }}
        >
          Price Comparison
        </h4>
        <p
          style={{
            fontSize: '13px',
            color: '#6B7280',
          }}
        >
          All options compared to {formatCurrencyWithSymbol(anchor.anchorPrice)} buyout
        </p>
      </div>

      {/* Chart */}
      <div
        className="price-comparison-chart__bars"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {optionsWithWidths.map((opt, idx) => {
          const isSelected = opt.optionType === selectedOption;
          const color = colorMap[opt.optionType] || '#9CA3AF';

          return (
            <div
              key={opt.optionType}
              className="price-comparison-chart__bar-container"
              style={{
                opacity: isSelected ? 1 : 0.7,
                transition: 'opacity 0.2s ease',
              }}
            >
              {/* Label Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontSize: '13px',
                }}
              >
                <div
                  style={{
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#1A1A1A' : '#6B7280',
                  }}
                >
                  {opt.optionType === 'buyout' && '🏆 Buyout'}
                  {opt.optionType === 'crash' && '🛋️ Crash'}
                  {opt.optionType === 'swap' && '🔄 Swap'}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    color: isSelected ? color : '#9CA3AF',
                  }}
                >
                  {formatCurrencyWithSymbol(opt.totalCost)}
                </div>
              </div>

              {/* Bar */}
              <div
                style={{
                  position: 'relative',
                  height: '32px',
                  background: '#F3F4F6',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${opt.widthPercent}%`,
                    height: '100%',
                    background: isSelected
                      ? `linear-gradient(90deg, ${color}DD, ${color})`
                      : color,
                    borderRadius: '6px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '12px',
                    boxShadow: isSelected
                      ? `0 2px 8px ${color}40`
                      : 'none',
                  }}
                >
                  {/* Savings Label (inside bar if space) */}
                  {opt.savingsVsAnchor > 0 && opt.widthPercent > 40 && (
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'white',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      }}
                    >
                      Save {formatCurrencyWithSymbol(opt.savingsVsAnchor)}
                    </div>
                  )}
                </div>

                {/* Savings Label (outside bar if no space) */}
                {opt.savingsVsAnchor > 0 && opt.widthPercent <= 40 && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#6B7280',
                    }}
                  >
                    -${opt.savingsVsAnchor.toFixed(0)}
                  </div>
                )}
              </div>

              {/* Savings Percentage */}
              {opt.savingsVsAnchor > 0 && (
                <div
                  style={{
                    fontSize: '11px',
                    color: '#10B981',
                    marginTop: '4px',
                    textAlign: 'right',
                  }}
                >
                  {opt.savingsPercentage.toFixed(0)}% off
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #E5E7EB',
          fontSize: '11px',
          color: '#9CA3AF',
          textAlign: 'center',
        }}
      >
        Longer bars = higher price • All prices include platform fees
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default PriceComparisonChart;
