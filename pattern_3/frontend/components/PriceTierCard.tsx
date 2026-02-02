/**
 * PATTERN 3: PRICE ANCHORING - PriceTierCard Component
 * Individual card for Budget/Recommended/Premium tiers
 */

import React from 'react';
import type { PriceTierCardProps } from '../types';
import { formatCurrencyWithSymbol, formatTierMultiplier } from '../utils';
import SavingsBadge from './SavingsBadge';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * PriceTierCard Component
 *
 * Displays a single price tier with features, pricing, and savings
 *
 * @example
 * ```tsx
 * <PriceTierCard
 *   tier={recommendedTier}
 *   price={450}
 *   basePrice={450}
 *   savings={savingsInfo}
 *   isSelected={true}
 *   onSelect={() => handleSelect('recommended')}
 * />
 * ```
 */
export const PriceTierCard: React.FC<PriceTierCardProps> = ({
  tier,
  price,
  basePrice,
  savings,
  isSelected,
  onSelect,
  disabled = false,
  className = '',
}) => {
  // ========================================================================
  // COLOR MAPPING
  // ========================================================================

  const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    gray: {
      bg: '#F9FAFB',
      border: '#E5E7EB',
      text: '#374151',
      badge: '#6B7280',
    },
    blue: {
      bg: '#EFF6FF',
      border: '#3B82F6',
      text: '#1E40AF',
      badge: '#3B82F6',
    },
    purple: {
      bg: '#F5F3FF',
      border: '#8B5CF6',
      text: '#6B21A8',
      badge: '#8B5CF6',
    },
    gold: {
      bg: '#FFFBEB',
      border: '#F59E0B',
      text: '#92400E',
      badge: '#F59E0B',
    },
    teal: {
      bg: '#F0FDFA',
      border: '#14B8A6',
      text: '#115E59',
      badge: '#14B8A6',
    },
    green: {
      bg: '#F0FDF4',
      border: '#10B981',
      text: '#065F46',
      badge: '#10B981',
    },
  };

  const colors = colorMap[tier.color] || colorMap.gray;

  // ========================================================================
  // STYLES
  // ========================================================================

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    padding: '24px',
    borderRadius: '12px',
    border: `2px solid ${isSelected ? colors.border : '#E5E7EB'}`,
    background: isSelected ? colors.bg : '#FFFFFF',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: isSelected
      ? `0 4px 12px ${colors.border}33`
      : '0 1px 3px rgba(0, 0, 0, 0.1)',
    transform: tier.highlighted ? 'scale(1.02)' : 'scale(1)',
    opacity: disabled ? 0.6 : 1,
  };

  const handleClick = () => {
    if (!disabled) {
      onSelect();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect();
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div
      className={`price-tier-card ${className}`}
      style={cardStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={disabled}
    >
      {/* Savings Badge */}
      {savings && savings.amount > 0 && (
        <SavingsBadge
          savingsAmount={savings.amount}
          savingsPercentage={savings.percentage}
          size="large"
        />
      )}

      {/* Badge (Most Popular, Fastest, etc.) */}
      {tier.badge && (
        <div
          className="price-tier-card__badge"
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 16px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 600,
            background: colors.badge,
            color: 'white',
          }}
        >
          {tier.badge}
        </div>
      )}

      {/* Header: Icon & Name */}
      <div
        className="price-tier-card__header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: '20px' }}>
          {typeof tier.icon === 'string' ? tier.icon : <tier.icon />}
        </div>

        {/* Name */}
        <span
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: colors.text,
          }}
        >
          {tier.name}
        </span>
      </div>

      {/* Price Section */}
      <div className="price-tier-card__price" style={{ marginBottom: '16px' }}>
        {/* Main Price */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#1A1A1A',
            lineHeight: 1,
          }}
        >
          {formatCurrencyWithSymbol(price)}
        </div>

        {/* Savings Display */}
        {savings && savings.amount > 0 && (
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#10B981',
              marginTop: '4px',
            }}
          >
            Save {formatCurrencyWithSymbol(savings.amount)}
          </div>
        )}

        {/* Multiplier Info */}
        {tier.multiplier !== 1.0 && (
          <div
            style={{
              fontSize: '12px',
              color: '#6B7280',
              marginTop: '4px',
            }}
          >
            {formatTierMultiplier(tier.multiplier)}
          </div>
        )}
      </div>

      {/* Description */}
      <p
        className="price-tier-card__description"
        style={{
          fontSize: '14px',
          color: '#6B7280',
          marginBottom: '16px',
        }}
      >
        {tier.description}
      </p>

      {/* Features List */}
      <ul
        className="price-tier-card__features"
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {tier.features.map((feature, idx) => (
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
            {/* Checkmark */}
            <span style={{ color: colors.badge, flexShrink: 0 }}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Selection Indicator */}
      {isSelected && (
        <div
          className="price-tier-card__selected"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: colors.badge,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
          }}
        >
          ✓
        </div>
      )}

      {/* Acceptance Rate & Response Time (Optional) */}
      {(tier.acceptanceRate || tier.avgResponseTime) && (
        <div
          className="price-tier-card__stats"
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            gap: '16px',
            fontSize: '11px',
            color: '#6B7280',
          }}
        >
          {tier.acceptanceRate && (
            <div>
              <strong>{(tier.acceptanceRate * 100).toFixed(0)}%</strong> acceptance
            </div>
          )}
          {tier.avgResponseTime && (
            <div>
              <strong>
                {tier.avgResponseTime < 24
                  ? `${tier.avgResponseTime}h`
                  : `${Math.round(tier.avgResponseTime / 24)}d`}
              </strong>{' '}
              response
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

export default PriceTierCard;
