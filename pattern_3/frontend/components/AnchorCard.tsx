/**
 * PATTERN 3: PRICE ANCHORING - AnchorCard Component
 * Displays the anchor price (buyout) - always shown first, largest
 */

import React from 'react';
import type { AnchorCardProps } from '../types';
import { formatCurrencyWithSymbol } from '../utils';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AnchorCard Component
 *
 * Displays the anchor option (typically buyout) with prominent styling
 *
 * @example
 * ```tsx
 * <AnchorCard
 *   option={buyoutOption}
 *   isSelected={false}
 *   onSelect={() => selectBuyout()}
 * />
 * ```
 */
export const AnchorCard: React.FC<AnchorCardProps> = ({
  option,
  isSelected,
  onSelect,
  className = '',
}) => {
  // ========================================================================
  // STYLES
  // ========================================================================

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    padding: '32px',
    borderRadius: '12px',
    border: '3px solid #FFD700',
    background: isSelected
      ? 'linear-gradient(135deg, #FFFEF7 0%, #FFF9E6 100%)'
      : 'linear-gradient(135deg, #FFFEF7 0%, #FFFFFF 100%)',
    boxShadow: isSelected
      ? '0 8px 20px rgba(255, 215, 0, 0.3)'
      : '0 6px 16px rgba(255, 215, 0, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    zIndex: 3,
  };

  const handleClick = () => {
    onSelect();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div
      className={`anchor-card ${className}`}
      style={cardStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label="Anchor price option - buyout"
    >
      {/* Badge */}
      <div
        className="anchor-card__badge"
        style={{
          position: 'absolute',
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 16px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: 700,
          background: '#FFD700',
          color: '#92400E',
          letterSpacing: '0.5px',
        }}
      >
        REFERENCE PRICE
      </div>

      {/* Header */}
      <div
        className="anchor-card__header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '28px' }}>🏆</div>
        <div>
          <h4
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#92400E',
              margin: 0,
            }}
          >
            Exclusive Buyout
          </h4>
          <p
            style={{
              fontSize: '13px',
              color: '#A16207',
              margin: 0,
            }}
          >
            Guaranteed availability
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="anchor-card__price" style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '42px',
            fontWeight: 700,
            color: '#B8860B',
            lineHeight: 1,
          }}
        >
          {formatCurrencyWithSymbol(option.totalCost)}
        </div>
        {option.platformFee > 0 && (
          <div
            style={{
              fontSize: '12px',
              color: '#A16207',
              marginTop: '4px',
            }}
          >
            Includes ${option.platformFee.toFixed(2)} platform fee
          </div>
        )}
      </div>

      {/* Description */}
      <div
        className="anchor-card__description"
        style={{
          padding: '16px',
          background: 'rgba(255, 215, 0, 0.1)',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <p
          style={{
            fontSize: '14px',
            color: '#78350F',
            margin: 0,
            fontWeight: 500,
          }}
        >
          This is the reference rate. Other options show savings compared to this price.
        </p>
      </div>

      {/* Features */}
      <ul
        className="anchor-card__features"
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <li
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            color: '#78350F',
          }}
        >
          <span style={{ color: '#FFD700', fontSize: '16px' }}>✓</span>
          <span>Guaranteed exclusive access</span>
        </li>
        <li
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            color: '#78350F',
          }}
        >
          <span style={{ color: '#FFD700', fontSize: '16px' }}>✓</span>
          <span>Immediate confirmation</span>
        </li>
        <li
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            color: '#78350F',
          }}
        >
          <span style={{ color: '#FFD700', fontSize: '16px' }}>✓</span>
          <span>Premium option</span>
        </li>
      </ul>

      {/* Selection Indicator */}
      {isSelected && (
        <div
          className="anchor-card__selected"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#FFD700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#92400E',
            fontSize: '16px',
            fontWeight: 700,
          }}
        >
          ✓
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AnchorCard;
