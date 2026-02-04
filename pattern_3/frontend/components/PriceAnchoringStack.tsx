/**
 * PATTERN 3: PRICE ANCHORING - PriceAnchoringStack Component
 * Main orchestrator for buyout/crash/swap anchoring pattern
 */

import React, { useState } from 'react';
import type { PriceAnchoringStackProps } from '../types';
import { usePriceAnchor } from '../hooks';
import AnchorCard from './AnchorCard';
import ComparisonCard from './ComparisonCard';
import PriceComparisonChart from './PriceComparisonChart';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * PriceAnchoringStack Component
 *
 * Complete price anchoring UI with descending visual cascade
 *
 * @example
 * ```tsx
 * <PriceAnchoringStack
 *   buyoutPrice={2835}
 *   crashPrice={324}
 *   swapPrice={0}
 *   platformFees={{ buyout: 43, crash: 5, swap: 5 }}
 *   onOptionSelected={(option) => handleSelect(option)}
 * />
 * ```
 */
export const PriceAnchoringStack: React.FC<PriceAnchoringStackProps> = ({
  buyoutPrice,
  crashPrice,
  swapPrice,
  platformFees,
  targetDate,
  onOptionSelected,
  className = '',
}) => {
  // ========================================================================
  // HOOKS
  // ========================================================================

  const { anchor, sortedOptions, selectedOption, selectOption } = usePriceAnchor({
    buyoutPrice,
    crashPrice,
    swapPrice,
    platformFees,
  });

  // ========================================================================
  // LOCAL STATE
  // ========================================================================

  const [showChart, setShowChart] = useState(false);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleOptionSelect = (optionType: string) => {
    selectOption(optionType);

    const option = sortedOptions.find((opt) => opt.optionType === optionType);
    if (option) {
      onOptionSelected(option);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className={`price-anchoring-stack ${className}`}>
      {/* Header with Anchor Context */}
      <div
        className="price-anchoring-stack__header"
        style={{
          marginBottom: '24px',
          textAlign: 'center',
        }}
      >
        <h3
          style={{
            fontSize: '22px',
            fontWeight: 600,
            color: '#1A1A1A',
            marginBottom: '8px',
          }}
        >
          Choose Your Option
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
          }}
        >
          Prices compared to exclusive buyout rate
        </p>
      </div>

      {/* Option Stack - Descending Visual Cascade */}
      <div
        className="price-anchoring-stack__options"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Visual Flow Line (Gold to Green gradient) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'linear-gradient(to bottom, #FFD700 0%, #4CAF50 100%)',
            zIndex: 0,
            opacity: 0.3,
            pointerEvents: 'none',
          }}
        />

        {/* Render Cards */}
        {sortedOptions.map((option, index) => {
          const isSelected = selectedOption?.optionType === option.optionType;

          // First option (buyout) is the anchor
          if (option.isAnchor) {
            return (
              <AnchorCard
                key={option.optionType}
                option={option}
                isSelected={isSelected}
                onSelect={() => handleOptionSelect(option.optionType)}
              />
            );
          }

          // Subsequent options show savings vs anchor
          return (
            <ComparisonCard
              key={option.optionType}
              option={option}
              anchor={anchor}
              isSelected={isSelected}
              onSelect={() => handleOptionSelect(option.optionType)}
              rank={index + 1}
            />
          );
        })}
      </div>

      {/* Toggle Chart Button */}
      <div
        style={{
          marginTop: '24px',
          textAlign: 'center',
        }}
      >
        <button
          onClick={() => setShowChart(!showChart)}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#6B7280',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#9CA3AF';
            e.currentTarget.style.color = '#1A1A1A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#D1D5DB';
            e.currentTarget.style.color = '#6B7280';
          }}
        >
          {showChart ? '📊 Hide Chart' : '📊 Show Price Comparison'}
        </button>
      </div>

      {/* Visual Comparison Chart (Optional) */}
      {showChart && (
        <div style={{ marginTop: '24px' }}>
          <PriceComparisonChart
            options={sortedOptions}
            anchor={anchor}
            selectedOption={selectedOption?.optionType}
          />
        </div>
      )}

      {/* Summary (if option selected) */}
      {selectedOption && (
        <div
          className="price-anchoring-stack__summary"
          style={{
            marginTop: '24px',
            padding: '20px',
            background: '#F9FAFB',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
          }}
        >
          <h4
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#1A1A1A',
              marginBottom: '12px',
            }}
          >
            Your Selection Summary
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
              }}
            >
              <span style={{ color: '#6B7280' }}>Selected option:</span>
              <span style={{ fontWeight: 600, color: '#1A1A1A' }}>
                {selectedOption.optionType === 'buyout' && 'Buyout'}
                {selectedOption.optionType === 'crash' && 'Crash'}
                {selectedOption.optionType === 'swap' && 'Swap'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
              }}
            >
              <span style={{ color: '#6B7280' }}>Total cost:</span>
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#1A1A1A' }}>
                ${selectedOption.totalCost.toFixed(2)}
              </span>
            </div>

            {selectedOption.savingsVsAnchor > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  paddingTop: '8px',
                  borderTop: '1px solid #E5E7EB',
                }}
              >
                <span style={{ color: '#6B7280' }}>You save:</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>
                  ${selectedOption.savingsVsAnchor.toFixed(2)} (
                  {selectedOption.savingsPercentage.toFixed(0)}% off)
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default PriceAnchoringStack;
