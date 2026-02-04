/**
 * PATTERN 3: PRICE ANCHORING - PriceTierSelector Component
 * Main 3-card grid selector for Budget/Recommended/Premium tiers
 */

import React, { useState, useMemo } from 'react';
import type { PriceTierSelectorProps, PriceTier, PriceTierId, SavingsInfo } from '../types';
import { PRICE_TIERS, calculateTierPrice, calculateSavings } from '../utils';
import PriceTierCard from './PriceTierCard';

// ============================================================================
// ICON PLACEHOLDERS
// ============================================================================

// Simple icon placeholders (in real app, use @heroicons/react or similar)
const CheckIcon = () => <span>✓</span>;
const StarIcon = () => <span>⭐</span>;
const BoltIcon = () => <span>⚡</span>;

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * PriceTierSelector Component
 *
 * 3-tier price selector with visual hierarchy and savings display
 *
 * @example
 * ```tsx
 * <PriceTierSelector
 *   basePrice={450}
 *   onPriceChange={(price, tier) => setOfferPrice(price)}
 *   savingsContext={{ originalPrice: 500 }}
 *   defaultTier="recommended"
 * />
 * ```
 */
export const PriceTierSelector: React.FC<PriceTierSelectorProps> = ({
  basePrice,
  currentPrice,
  onPriceChange,
  savingsContext,
  tiers,
  defaultTier = 'recommended',
  showCustomOption = true,
  minPrice,
  maxPrice,
  disabled = false,
  className = '',
}) => {
  // ========================================================================
  // STATE
  // ========================================================================

  const [selectedTier, setSelectedTier] = useState<PriceTierId>(defaultTier);
  const [customPrice, setCustomPrice] = useState<string>(
    currentPrice?.toString() || basePrice.toString()
  );
  const [showCustomInput, setShowCustomInput] = useState(false);

  // ========================================================================
  // TIER DEFINITIONS
  // ========================================================================

  const defaultTiers: PriceTier[] = useMemo(
    () => [
      {
        ...PRICE_TIERS.budget,
        icon: CheckIcon,
      },
      {
        ...PRICE_TIERS.recommended,
        icon: StarIcon,
      },
      {
        ...PRICE_TIERS.premium,
        icon: BoltIcon,
      },
    ],
    []
  );

  const activeTiers = tiers || defaultTiers;

  // ========================================================================
  // CALCULATIONS
  // ========================================================================

  /**
   * Calculate price for each tier
   */
  const tierPrices = useMemo(() => {
    const prices: Record<string, number> = {};
    activeTiers.forEach((tier) => {
      prices[tier.id] = calculateTierPrice(basePrice, tier.id);
    });
    return prices;
  }, [basePrice, activeTiers]);

  /**
   * Calculate savings for each tier
   */
  const tierSavings = useMemo((): Record<string, SavingsInfo | null> => {
    if (!savingsContext?.originalPrice) {
      return {};
    }

    const savings: Record<string, SavingsInfo | null> = {};
    activeTiers.forEach((tier) => {
      const tierPrice = tierPrices[tier.id];
      savings[tier.id] = calculateSavings(tierPrice, savingsContext.originalPrice!);
    });
    return savings;
  }, [tierPrices, savingsContext, activeTiers]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  /**
   * Handle tier selection
   */
  const handleTierSelect = (tier: PriceTier) => {
    if (disabled) return;

    setSelectedTier(tier.id);
    const tierPrice = tierPrices[tier.id];
    onPriceChange(tierPrice, tier.id);
    setShowCustomInput(false);
  };

  /**
   * Handle custom price change
   */
  const handleCustomPriceChange = (value: string) => {
    setCustomPrice(value);
    const numValue = parseFloat(value);

    if (!isNaN(numValue)) {
      // Validate against min/max
      const min = minPrice || basePrice * 0.8;
      const max = maxPrice || basePrice * 1.3;

      if (numValue >= min && numValue <= max) {
        setSelectedTier('custom');
        onPriceChange(numValue, 'custom');
      }
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className={`price-tier-selector ${className}`}>
      {/* Header */}
      <div
        className="price-tier-selector__header"
        style={{
          textAlign: 'center',
          marginBottom: '24px',
        }}
      >
        <h3
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#1A1A1A',
            marginBottom: '8px',
          }}
        >
          Choose Your Offer Amount
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
          }}
        >
          Fair market price:{' '}
          <span style={{ fontWeight: 500 }}>${basePrice.toFixed(2)}</span>
        </p>
      </div>

      {/* Tier Cards Grid */}
      <div
        className="price-tier-selector__grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: showCustomOption ? '24px' : 0,
        }}
      >
        {activeTiers.map((tier) => (
          <PriceTierCard
            key={tier.id}
            tier={tier}
            price={tierPrices[tier.id]}
            basePrice={basePrice}
            savings={tierSavings[tier.id] || undefined}
            isSelected={selectedTier === tier.id}
            onSelect={() => handleTierSelect(tier)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Custom Price Option */}
      {showCustomOption && (
        <details
          className="price-tier-selector__custom"
          open={showCustomInput}
          onToggle={(e) => setShowCustomInput((e.target as HTMLDetailsElement).open)}
          style={{
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <summary
            style={{
              color: '#6B7280',
              padding: '8px 0',
              userSelect: 'none',
            }}
          >
            Or enter custom amount
          </summary>

          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6B7280',
                  fontSize: '16px',
                }}
              >
                $
              </span>
              <input
                type="number"
                min={minPrice || basePrice * 0.8}
                max={maxPrice || basePrice * 1.3}
                step={5}
                value={customPrice}
                onChange={(e) => handleCustomPriceChange(e.target.value)}
                disabled={disabled}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  paddingLeft: '28px',
                  paddingRight: '12px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Price range hint */}
            <div
              style={{
                fontSize: '12px',
                color: '#9CA3AF',
                whiteSpace: 'nowrap',
              }}
            >
              ${(minPrice || basePrice * 0.8).toFixed(0)} - $
              {(maxPrice || basePrice * 1.3).toFixed(0)}
            </div>
          </div>

          {/* Validation message */}
          {selectedTier === 'custom' && parseFloat(customPrice) > 0 && (
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#10B981',
              }}
            >
              ✓ Custom price set: ${parseFloat(customPrice).toFixed(2)}
            </div>
          )}
        </details>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default PriceTierSelector;
