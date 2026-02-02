/**
 * PriceTierCard Component
 * Individual card for Budget/Recommended/Premium tiers
 */

import React from 'react';
import SavingsBadge from './SavingsBadge';

/**
 * @param {Object} props
 * @param {Object} props.tier - Tier definition
 * @param {number} props.price - Calculated price for this tier
 * @param {number} props.basePrice - Base price for comparison
 * @param {Object} [props.savings] - Savings info
 * @param {boolean} props.isSelected - Selection state
 * @param {Function} props.onSelect - Selection handler
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {string} [props.className=""] - Extra classes
 */
export default function PriceTierCard({
  tier,
  price,
  basePrice,
  savings,
  isSelected,
  onSelect,
  disabled = false,
  className = '',
}) {
  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);

  const cardClasses = [
    'price-tier-card',
    `price-tier-card--${tier.id}`,
    tier.highlighted && 'price-tier-card--highlighted',
    isSelected && 'selected',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      className={cardClasses}
      onClick={() => !disabled && onSelect()}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-label={`Select ${tier.name} tier: ${formatCurrency(price)}`}
    >
      {/* Savings Badge */}
      {savings && savings.amount > 0 && (
        <SavingsBadge
          savingsAmount={savings.amount}
          savingsPercentage={savings.percentage}
          size="large"
        />
      )}

      {/* Badge (Most Popular, etc.) */}
      {tier.badge && <div className="price-tier-card__badge">{tier.badge}</div>}

      {/* Header */}
      <div className="price-tier-card__header">
        <div className="price-tier-card__icon">
          {typeof tier.icon === 'function' ? <tier.icon /> : tier.icon}
        </div>
        <span className="price-tier-card__name">{tier.name}</span>
      </div>

      {/* Price */}
      <div className="price-tier-card__price">
        <div className="price-tier-card__amount">{formatCurrency(price)}</div>
        {savings && savings.amount > 0 && (
          <div className="price-tier-card__savings-text">
            Save {formatCurrency(savings.amount)}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="price-tier-card__description">{tier.description}</p>

      {/* Features */}
      <ul className="price-tier-card__features">
        {tier.features.map((feature, idx) => (
          <li key={idx}>
            <span className="feature-check">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* Selection Indicator */}
      {isSelected && <div className="price-tier-card__selected">✓</div>}
    </div>
  );
}
