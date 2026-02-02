/**
 * PATTERN 3: PRICE ANCHORING - ComparisonCard Component
 * Displays crash/swap options with savings visualization vs anchor
 */

import React from 'react';
import type { ComparisonCardProps } from '../types';
import { formatCurrencyWithSymbol } from '../utils';
import SavingsBadge from './SavingsBadge';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getOptionTitle(type: string): string {
  const titles: Record<string, string> = {
    buyout: 'Exclusive Buyout',
    crash: 'Shared Crash',
    swap: 'Fair Exchange',
  };
  return titles[type] || type;
}

function getOptionIcon(type: string): string {
  const icons: Record<string, string> = {
    buyout: '🏆',
    crash: '🛋️',
    swap: '🔄',
  };
  return icons[type] || '•';
}

function getOptionBenefits(type: string): string[] {
  const benefits: Record<string, string[]> = {
    buyout: [
      'Guaranteed availability',
      'Exclusive use',
      'Immediate confirmation',
    ],
    crash: [
      'All your belongings there',
      'Familiar space',
      'Host earns extra income',
    ],
    swap: [
      'No money changes hands',
      'Fair trade',
      'Maintain your flexibility',
    ],
  };
  return benefits[type] || [];
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ComparisonCard Component
 *
 * Displays a price option with savings comparison to anchor
 *
 * @example
 * ```tsx
 * <ComparisonCard
 *   option={crashOption}
 *   anchor={buyoutAnchor}
 *   isSelected={true}
 *   onSelect={() => handleSelect('crash')}
 *   rank={2}
 * />
 * ```
 */
export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  option,
  anchor,
  isSelected,
  onSelect,
  rank,
  className = '',
}) => {
  // ========================================================================
  // CALCULATIONS
  // ========================================================================

  const savingsAmount = option.savingsVsAnchor;
  const savingsPercent = option.savingsPercentage;

  // ========================================================================
  // COLOR MAPPING
  // ========================================================================

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    crash: {
      bg: '#F0FFFE',
      border: '#4ECDC4',
      text: '#00897B',
    },
    swap: {
      bg: '#F1F8E9',
      border: '#4CAF50',
      text: '#2E7D32',
    },
  };

  const colors = colorMap[option.optionType] || colorMap.crash;

  // ========================================================================
  // STYLES
  // ========================================================================

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    padding: '28px',
    borderRadius: '12px',
    border: `2px solid ${isSelected ? colors.border : '#E5E7EB'}`,
    background: isSelected
      ? `linear-gradient(135deg, ${colors.bg} 0%, #FFFFFF 100%)`
      : '#FFFFFF',
    boxShadow: isSelected
      ? `0 6px 16px ${colors.border}33`
      : '0 4px 12px rgba(0, 0, 0, 0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    zIndex: rank === 2 ? 2 : 1,
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
      className={`comparison-card comparison-card--${option.optionType} ${className}`}
      style={cardStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={rank - 1}
      aria-pressed={isSelected}
    >
      {/* Savings Badge (prominent) */}
      <SavingsBadge
        savingsAmount={savingsAmount}
        savingsPercentage={savingsPercent}
        size="large"
        variant={savingsPercent > 80 ? 'prominent' : 'default'}
      />

      {/* Best Value Badge (for swap) */}
      {option.optionType === 'swap' && (
        <div
          className="comparison-card__best-value"
          style={{
            position: 'absolute',
            bottom: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 20px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 700,
            background: colors.border,
            color: 'white',
            letterSpacing: '0.5px',
          }}
        >
          BEST VALUE
        </div>
      )}

      {/* Header */}
      <div
        className="comparison-card__header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '24px' }}>{getOptionIcon(option.optionType)}</div>
          <h4
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: colors.text,
              margin: 0,
            }}
          >
            {getOptionTitle(option.optionType)}
          </h4>
        </div>
      </div>

      {/* Price Display with Comparison */}
      <div className="comparison-card__price" style={{ marginBottom: '16px' }}>
        {/* Main Price */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#1A1A1A',
            lineHeight: 1,
          }}
        >
          {formatCurrencyWithSymbol(option.totalCost)}
        </div>

        {/* Price Comparison */}
        <div
          className="comparison-card__vs"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            fontSize: '14px',
            color: '#9CA3AF',
          }}
        >
          <span>vs</span>
          <span
            style={{
              textDecoration: 'line-through',
              fontWeight: 400,
            }}
          >
            {formatCurrencyWithSymbol(anchor.anchorPrice)}
          </span>
        </div>
      </div>

      {/* Savings Highlight */}
      <div
        className="comparison-card__savings"
        style={{
          background: `${colors.border}15`,
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          borderLeft: `3px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: colors.text,
            marginBottom: '4px',
          }}
        >
          You save {formatCurrencyWithSymbol(savingsAmount)}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: colors.text,
            opacity: 0.8,
            fontWeight: 500,
          }}
        >
          ({savingsPercent.toFixed(0)}% off buyout)
        </div>
      </div>

      {/* Benefits */}
      <ul
        className="comparison-card__benefits"
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: option.optionType === 'crash' ? '16px' : 0,
        }}
      >
        {getOptionBenefits(option.optionType).map((benefit, idx) => (
          <li
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '13px',
              color: '#4B5563',
            }}
          >
            <span style={{ color: colors.border, flexShrink: 0 }}>✓</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      {/* Trade-off Notice (for crash) */}
      {option.optionType === 'crash' && (
        <div
          className="comparison-card__tradeoff"
          style={{
            padding: '10px',
            background: '#FEF3C7',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#92400E',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>⚠️</span>
          <span>Shared space (blow-up bed)</span>
        </div>
      )}

      {/* Selection Checkmark */}
      {isSelected && (
        <div
          className="comparison-card__selected"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: colors.border,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
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

export default ComparisonCard;
