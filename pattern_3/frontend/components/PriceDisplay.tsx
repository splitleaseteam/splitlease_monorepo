/**
 * PATTERN 3: PRICE ANCHORING - PriceDisplay Component
 * Enhanced price display with anchor context and savings
 */

import React from 'react';
import type { PriceDisplayProps } from '../types';
import { formatCurrencyWithSymbol } from '../utils';
import { getAnchorContext } from '../utils';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * PriceDisplay Component
 *
 * Displays price with optional anchor comparison and savings
 *
 * @example
 * ```tsx
 * <PriceDisplay
 *   price={324}
 *   anchorPrice={2835}
 *   showSavings
 *   size="lg"
 * />
 * ```
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  label,
  anchorPrice,
  showSavings = true,
  showOriginalPrice = true,
  size = 'md',
  variant = 'default',
  currency = '$',
  className = '',
}) => {
  // ========================================================================
  // ANCHOR CONTEXT
  // ========================================================================

  const anchorContext = anchorPrice
    ? getAnchorContext(price, anchorPrice, anchorPrice)
    : null;

  // ========================================================================
  // SIZE CLASSES
  // ========================================================================

  const sizeClasses: Record<string, string> = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  // ========================================================================
  // VARIANT STYLES
  // ========================================================================

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      color: '#1A1A1A',
    },
    emphasized: {
      color: '#2E7D32',
      fontWeight: 700,
    },
    muted: {
      color: '#666',
    },
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className={`price-display ${className}`} style={{ textAlign: 'center' }}>
      {/* Label */}
      {label && (
        <div
          className="price-display__label"
          style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '4px',
          }}
        >
          {label}
        </div>
      )}

      {/* Main Price */}
      <div
        className={`price-display__amount ${sizeClasses[size]}`}
        style={{
          fontWeight: 700,
          ...variantStyles[variant],
        }}
      >
        {formatCurrencyWithSymbol(price, currency)}
      </div>

      {/* Anchor Context */}
      {showSavings && anchorContext && (
        <div className="price-display__anchor" style={{ marginTop: '8px' }}>
          {/* Original price (crossed out) */}
          {showOriginalPrice && anchorPrice && anchorPrice > price && (
            <div
              className="price-display__original"
              style={{
                fontSize: '14px',
                color: '#999',
                textDecoration: 'line-through',
                marginBottom: '4px',
              }}
            >
              {formatCurrencyWithSymbol(anchorPrice, currency)}
            </div>
          )}

          {/* Savings badge */}
          {anchorContext.comparedToOriginal.direction === 'saving' && (
            <div
              className="price-display__savings-badge"
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#2E7D32',
              }}
            >
              {anchorContext.comparedToOriginal.formatted}
            </div>
          )}

          {/* Extra cost badge */}
          {anchorContext.comparedToOriginal.direction === 'paying' && (
            <div
              className="price-display__extra-badge"
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'rgba(255, 152, 0, 0.1)',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#E65100',
              }}
            >
              {anchorContext.comparedToOriginal.formatted}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default PriceDisplay;
