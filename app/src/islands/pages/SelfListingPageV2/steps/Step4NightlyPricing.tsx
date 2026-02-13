/**
 * Step 4: Pricing Strategy - V5 Calculator (nightly only)
 */
import React from 'react';
import type { FormData } from '../types';

interface Step4Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  nightlyPricesRef: React.MutableRefObject<number[]>;
  getPlatformMultiplier: (nightsCount: number) => number;
  handleInfoClick: (tooltipId: string) => (e: React.MouseEvent) => void;
  baseNightlyRateInfoRef: React.RefObject<HTMLButtonElement>;
  longStayDiscountInfoRef: React.RefObject<HTMLButtonElement>;
  damageDepositInfoRef: React.RefObject<HTMLButtonElement>;
  cleaningFeeInfoRef: React.RefObject<HTMLButtonElement>;
  onNext: () => void;
  onBack: () => void;
}

export const Step4NightlyPricing: React.FC<Step4Props> = ({
  formData,
  updateFormData,
  nightlyPricesRef,
  getPlatformMultiplier,
  handleInfoClick,
  baseNightlyRateInfoRef,
  longStayDiscountInfoRef,
  damageDepositInfoRef,
  cleaningFeeInfoRef,
  onNext,
  onBack,
}) => {
  // Calculate GUEST prices for display (what guests will actually pay)
  const guestPrices = nightlyPricesRef.current.map((hostRate, idx) => {
    const nights = idx + 1;
    const multiplier = getPlatformMultiplier(nights);
    return Math.round(hostRate * multiplier);
  });
  const sum5Guest = guestPrices.slice(0, 5).reduce((a, b) => a + b, 0);
  const avgPrice = Math.round(sum5Guest / 5);

  return (
    <div className="section-card">
      <h2>Pricing Strategy</h2>
      <p className="subtitle">Set your base rate. Longer stays get automatic discounts to encourage bookings.</p>

      <div className="nightly-calculator-vertical">
        {/* Base Nightly Rate Input */}
        <div className="control-group" style={{ textAlign: 'center' }}>
          <label className="calc-label label-with-info">
            Base Nightly Rate
            <button
              ref={baseNightlyRateInfoRef}
              type="button"
              className="info-help-btn"
              onClick={handleInfoClick('baseNightlyRate')}
              aria-label="Learn more about base nightly rate"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
          </label>
          <div className="base-input-wrapper">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              className="base-input"
              value={formData.nightlyBaseRate}
              onChange={e => updateFormData({ nightlyBaseRate: Math.max(0, parseInt(e.target.value) || 0) })}
              min="0"
            />
          </div>
        </div>

        {/* Long Stay Discount Slider */}
        <div className="control-group">
          <div className="label-row">
            <span
              className="calc-label label-with-info clickable-label"
              onClick={handleInfoClick('longStayDiscount')}
              style={{ cursor: 'pointer' }}
            >
              Long Stay Discount
              <button
                ref={longStayDiscountInfoRef}
                type="button"
                className="info-help-btn"
                onClick={handleInfoClick('longStayDiscount')}
                aria-label="Learn more about long stay discount"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
            </span>
            <span className="value-display">{formData.nightlyDiscount}%</span>
          </div>
          <div className="range-wrapper">
            <input
              type="range"
              min="0"
              max="50"
              value={formData.nightlyDiscount}
              onChange={e => updateFormData({ nightlyDiscount: parseInt(e.target.value) })}
            />
          </div>
          <div className="marks">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
          </div>
          <p className="calc-hint">
            Consecutive nights get progressively cheaper. A 5-night stay averages <strong>${avgPrice}</strong>/night.
          </p>
        </div>

        {/* Color Palette Display - Shows GUEST prices (what guests will pay) */}
        <div className="nights-display-wrapper">
          <div className="nights-display-header">Price per consecutive night</div>
          <div className="palette-container">
            <div className="palette-row">
              {[1, 2, 3, 4, 5, 6, 7].map(night => (
                <div key={night} className={`palette-swatch n${night}`}>
                  <span className="swatch-number">NIGHT {night}</span>
                  <span className="swatch-price">${guestPrices[night - 1] || 0}</span>
                  <span className="swatch-label">PER NIGHT</span>
                </div>
              ))}
            </div>
          </div>
          <div className="formula-row">
            {[1, 2, 3, 4, 5, 6, 7].map(night => {
              const pricePerNight = guestPrices[night - 1] || 0;
              const total = night * pricePerNight;
              return <div key={night} className="formula-item">${total}</div>;
            })}
          </div>
          <div className="formula-total-row">
            <div className="formula-total-label">7-Night Total</div>
            <div className="formula-total">
              ${7 * (guestPrices[6] || 0)}
            </div>
          </div>
        </div>

        {/* Summary Row */}
        <div className="summary-row">
          <div className="summary-item">
            <div className="summary-label">Your Weekly Total</div>
            <div className="summary-value">${Math.round(formData.weeklyTotal)}</div>
            <div className="summary-sub">{formData.selectedNights.length} nights</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Est. Monthly</div>
            <div className="summary-value">${Math.round(formData.monthlyEstimate)}</div>
            <div className="summary-sub">x 4.33 weeks</div>
          </div>
        </div>

        {/* Smart Pricing explanation */}
        <details className="pricing-details">
          <summary>How does Smart Pricing work?</summary>
          <div className="details-content">
            We offer a setting to automatically adjust your pricing to encourage more nights per week. The first night is your full Base Rate.
            Each additional consecutive night gets slightly less expensive based on your Discount setting.
            This encourages guests to book longer stays (like Mon-Fri) instead of just two nights,
            maximizing your weekly net revenue and reducing turnover effort.
          </div>
        </details>

        {/* Damage Deposit and Cleaning Fee */}
        <div className="nightly-fees-row">
          <div className="fee-input-group">
            <label className="calc-label label-with-info">
              Damage Deposit
              <button
                ref={damageDepositInfoRef}
                type="button"
                className="info-help-btn"
                onClick={handleInfoClick('damageDeposit')}
                aria-label="Learn more about damage deposit"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
            </label>
            <div className="input-with-prefix">
              <span className="prefix">$</span>
              <input
                type="number"
                value={formData.securityDeposit || ''}
                onChange={e => updateFormData({ securityDeposit: parseInt(e.target.value) || 0 })}
                placeholder="500"
              />
            </div>
          </div>
          <div className="fee-input-group">
            <label className="calc-label label-with-info">
              Cleaning Fee
              <button
                ref={cleaningFeeInfoRef}
                type="button"
                className="info-help-btn"
                onClick={handleInfoClick('cleaningFee')}
                aria-label="Learn more about cleaning fee"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
            </label>
            <div className="input-with-prefix">
              <span className="prefix">$</span>
              <input
                type="number"
                value={formData.cleaningFee || ''}
                onChange={e => updateFormData({ cleaningFee: parseInt(e.target.value) || 0 })}
                placeholder="150"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn-next" onClick={onNext}>Continue</button>
        <button className="btn-back" onClick={onBack}>Back</button>
      </div>
    </div>
  );
};
