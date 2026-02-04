/**
 * PATTERN 3: PRICE ANCHORING - SavingsBadge Component
 * Displays savings amount and percentage with animations
 */

import React, { useEffect, useState } from 'react';
import type { SavingsBadgeProps } from '../types';
import { formatCurrencyWithSymbol, formatPercentage } from '../utils';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SavingsBadge Component
 *
 * Displays savings with optional animation and different size/variant options
 *
 * @example
 * ```tsx
 * <SavingsBadge
 *   savingsAmount={2511}
 *   savingsPercentage={88.6}
 *   size="large"
 *   variant="prominent"
 *   animated
 * />
 * ```
 */
export const SavingsBadge: React.FC<SavingsBadgeProps> = ({
  savingsAmount,
  savingsPercentage,
  size = 'medium',
  variant = 'default',
  animated = false,
  className = '',
}) => {
  // ========================================================================
  // STATE FOR ANIMATION
  // ========================================================================

  const [displayAmount, setDisplayAmount] = useState(animated ? 0 : savingsAmount);
  const [isAnimating, setIsAnimating] = useState(false);

  // ========================================================================
  // ANIMATION EFFECT
  // ========================================================================

  useEffect(() => {
    if (!animated) {
      setDisplayAmount(savingsAmount);
      return;
    }

    setIsAnimating(true);
    const duration = 800; // ms
    const steps = 60;
    const increment = savingsAmount / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayAmount(savingsAmount);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        setDisplayAmount(increment * currentStep);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [savingsAmount, animated]);

  // ========================================================================
  // EARLY RETURN
  // ========================================================================

  // Don't show badge if no savings
  if (savingsAmount <= 0) return null;

  // ========================================================================
  // CLASSNAMES
  // ========================================================================

  const badgeClasses = [
    'savings-badge',
    `savings-badge--${size}`,
    `savings-badge--${variant}`,
    savingsPercentage > 80 && 'savings-badge--huge',
    isAnimating && 'savings-badge--animating',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // ========================================================================
  // SIZE STYLES
  // ========================================================================

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: {
      padding: '4px 8px',
      fontSize: '11px',
      gap: '4px',
    },
    medium: {
      padding: '8px 16px',
      fontSize: '14px',
      gap: '8px',
    },
    large: {
      padding: '12px 20px',
      fontSize: '16px',
      gap: '10px',
    },
  };

  // ========================================================================
  // VARIANT STYLES
  // ========================================================================

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: 'linear-gradient(135deg, #4CAF50, #45B049)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
    },
    prominent: {
      background: 'linear-gradient(135deg, #FF9800, #F57C00)',
      color: 'white',
      boxShadow: '0 4px 16px rgba(255, 152, 0, 0.4)',
    },
    subtle: {
      background: '#E8F5E9',
      color: '#2E7D32',
      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.15)',
    },
  };

  // Huge savings override
  const finalVariantStyle =
    savingsPercentage > 80
      ? variantStyles.prominent
      : variantStyles[variant] || variantStyles.default;

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-12px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '24px',
    fontWeight: 600,
    zIndex: 10,
    ...sizeStyles[size],
    ...finalVariantStyle,
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className={badgeClasses} style={badgeStyle}>
      {/* Icon */}
      <div className="savings-badge__icon" style={{ fontSize: '1.2em' }}>
        💰
      </div>

      {/* Content */}
      <div className="savings-badge__content">
        {/* Amount */}
        <div className="savings-badge__amount" style={{ fontWeight: 700 }}>
          Save {formatCurrencyWithSymbol(displayAmount)}
        </div>

        {/* Percentage */}
        <div className="savings-badge__percentage" style={{ opacity: 0.9 }}>
          {formatPercentage(savingsPercentage)} off
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default SavingsBadge;
