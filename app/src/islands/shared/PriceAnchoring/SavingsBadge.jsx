/**
 * SavingsBadge Component
 * Displays savings amount and percentage
 */

import React, { useEffect, useState } from 'react';

/**
 * @param {Object} props
 * @param {number} props.savingsAmount
 * @param {number} props.savingsPercentage
 * @param {"small" | "medium" | "large"} [props.size="medium"]
 * @param {"default" | "prominent" | "subtle"} [props.variant="default"]
 * @param {boolean} [props.animated=false]
 * @param {string} [props.className=""]
 */
export default function SavingsBadge({
  savingsAmount,
  savingsPercentage,
  size = 'medium',
  variant = 'default',
  animated = false,
  className = '',
}) {
  const [displayAmount, setDisplayAmount] = useState(animated ? 0 : savingsAmount);

  useEffect(() => {
    if (!animated) {
      setDisplayAmount(savingsAmount);
      return;
    }

    const duration = 800;
    const steps = 60;
    const increment = savingsAmount / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayAmount(savingsAmount);
        clearInterval(interval);
      } else {
        setDisplayAmount(increment * currentStep);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [savingsAmount, animated]);

  if (savingsAmount <= 0) return null;

  const badgeClasses = [
    'savings-badge',
    `savings-badge--${size}`,
    `savings-badge--${variant}`,
    savingsPercentage > 80 && 'savings-badge--huge',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  return (
    <div className={badgeClasses}>
      <div className="savings-badge__icon">💰</div>
      <div className="savings-badge__content">
        <div className="savings-badge__amount">Save {formatCurrency(displayAmount)}</div>
        <div className="savings-badge__percentage">{savingsPercentage.toFixed(0)}% off</div>
      </div>
    </div>
  );
}
