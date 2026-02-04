/**
 * PriceTierSelector Component
 * 3-tier price selector with visual hierarchy
 */

import React, { useState, useMemo, useEffect } from 'react';
import PriceTierCard from './PriceTierCard';
import './PriceAnchoring.css';

// Stub analytics service (integration file is outside app directory)
const analyticsService = {
  trackEvent: () => {},
  trackTierSelection: () => {},
  trackPriceView: () => {}
};

// Default Icons
const CheckIcon = () => <span>✓</span>;
const StarIcon = () => <span>⭐</span>;
const BoltIcon = () => <span>⚡</span>;

const PRICE_TIERS = {
  budget: {
    id: 'budget',
    name: 'Budget',
    multiplier: 0.90,
    badge: null,
    description: 'Basic offer',
    features: [
      'Standard processing',
      'May take longer to accept',
      'Lower priority',
    ],
    color: 'green', // Green for budget/swap
    icon: CheckIcon,
  },
  recommended: {
    id: 'recommended',
    name: 'Recommended',
    multiplier: 1.00,
    badge: 'Most Popular',
    description: 'Best value',
    features: [
      'Fair market rate',
      'Faster acceptance',
      'Preferred by 73% of users',
    ],
    color: 'teal', // Teal for recommended/crash
    highlighted: true,
    icon: StarIcon,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    multiplier: 1.15,
    badge: 'Fastest',
    description: 'Priority handling',
    features: [
      'Highest acceptance rate',
      'Same-day response typical',
      'VIP processing',
    ],
    color: 'purple', // Purple for premium
    icon: BoltIcon,
  },
};

/**
 * @param {Object} props
 * @param {number} props.basePrice - Base price for calculations
 * @param {number} props.currentPrice - Current selected price
 * @param {Function} props.onPriceChange - Callback when price/tier changes
 * @param {string} [props.defaultTier="recommended"]
 * @param {boolean} [props.disabled=false]
 * @param {number} [props.originalPrice] - Original price for savings calculation
 */
export default function PriceTierSelector({
  basePrice,
  currentPrice,
  onPriceChange,
  defaultTier = 'recommended',
  disabled = false,
  originalPrice,
}) {
  const [selectedTier, setSelectedTier] = useState(defaultTier);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPrice, setCustomPrice] = useState(basePrice.toString());

  const activeTiers = [
    PRICE_TIERS.premium,
    PRICE_TIERS.recommended,
    PRICE_TIERS.budget,
  ];

  // Log view event
  useEffect(() => {
    analyticsService.trackPriceTiersViewed(
      activeTiers.map(t => ({
        id: t.id,
        price: basePrice * t.multiplier,
        recommended: t.id === 'recommended'
      }))
    );
  }, [basePrice]);

  const handleTierSelect = (tier) => {
    if (disabled) return;
    
    setSelectedTier(tier.id);
    const tierPrice = basePrice * tier.multiplier;
    
    // Track selection
    analyticsService.trackPriceTierSelected(
      tier.id,
      tierPrice,
      basePrice,
      tier.id === 'recommended'
    );

    onPriceChange(tierPrice, tier.id);
    setShowCustomInput(false);
  };

  const handleCustomPriceChange = (value) => {
    setCustomPrice(value);
    const numValue = parseFloat(value);

    if (!isNaN(numValue)) {
      setSelectedTier('custom');
      onPriceChange(numValue, 'custom');
      analyticsService.trackCustomPriceEntered(numValue, basePrice);
    }
  };

  return (
    <div className="price-tier-selector">
      <div className="price-tier-selector__header">
        <h3 className="dcr-section-title">Choose Your Offer Amount</h3>
        <p className="dcr-section-description">
          Fair market price: <span style={{ fontWeight: 600 }}>${basePrice.toFixed(2)}</span>
        </p>
      </div>

      <div className="price-tier-selector__grid">
        {activeTiers.map((tier) => {
          const tierPrice = basePrice * tier.multiplier;
          const savings = originalPrice ? {
            amount: originalPrice - tierPrice,
            percentage: ((originalPrice - tierPrice) / originalPrice) * 100
          } : null;

          return (
            <PriceTierCard
              key={tier.id}
              tier={tier}
              price={tierPrice}
              basePrice={basePrice}
              savings={savings}
              isSelected={selectedTier === tier.id}
              onSelect={() => handleTierSelect(tier)}
              disabled={disabled}
            />
          );
        })}
      </div>

      <details 
        className="price-tier-selector__custom" 
        open={showCustomInput}
        onToggle={(e) => setShowCustomInput(e.target.open)}
      >
        <summary>Or enter custom amount</summary>
        <div className="custom-price-input-wrapper">
          <span className="currency-symbol">$</span>
          <input
            type="number"
            value={customPrice}
            onChange={(e) => handleCustomPriceChange(e.target.value)}
            disabled={disabled}
            placeholder="Enter amount"
            className="dcr-message-input" // Reuse existing input styling
            style={{ paddingLeft: '24px' }}
            aria-label="Custom offer amount"
          />
        </div>
      </details>
    </div>
  );
}
