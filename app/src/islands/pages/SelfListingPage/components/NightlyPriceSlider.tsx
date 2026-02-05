import React, { useState, useEffect, useCallback, useRef } from 'react';

interface NightlyPriceSliderProps {
  initialP1?: number;
  initialDecay?: number;
  onPricesChange?: (data: {
    p1: number;
    n1: number;
    n2: number;
    n3: number;
    n4: number;
    n5: number;
    n6: number;
    n7: number;
    decay: number;
    total: number;
  }) => void;
}

/**
 * NightlyPriceSlider - Native React pricing slider with gradient legend
 *
 * Color Palette Style - displays 7 nights as gradient swatches from dark to light
 * instead of a table. Includes base rate input and long stay discount slider.
 *
 * Ported from SelfListingPageV2 for consistency and maintainability.
 */
export const NightlyPriceSlider: React.FC<NightlyPriceSliderProps> = ({
  initialP1 = 100,
  initialDecay = 0.95,
  onPricesChange
}) => {
  // Convert initial decay to discount percentage
  // decay = 1 - (discount/100)^0.25 approximately
  const initialDiscountPercent = Math.round((1 - initialDecay) * 100 / 0.25) || 20;

  const [baseRate, setBaseRate] = useState(initialP1);
  const [discountPercent, setDiscountPercent] = useState(Math.min(50, Math.max(0, initialDiscountPercent)));
  const nightlyPricesRef = useRef<number[]>([initialP1, initialP1, initialP1, initialP1, initialP1, initialP1, initialP1]);

  // Callback ref to avoid re-renders
  const onPricesChangeRef = useRef(onPricesChange);
  useEffect(() => {
    onPricesChangeRef.current = onPricesChange;
  }, [onPricesChange]);

  const N = 7;

  // Platform pricing constants (must match priceCalculations.js)
  const SITE_MARKUP = 0.17;
  const UNUSED_NIGHTS_DISCOUNT_MULTIPLIER = 0.03;
  const FULL_TIME_DISCOUNT = 0.13;

  const fmt0 = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const fmtShort = (n: number) => '$' + Math.round(n);
  const roundUp = (n: number) => Math.ceil(n);

  /**
   * Calculate the platform multiplier for a given night count
   * This is what the platform applies to host rates to get guest prices
   * Formula: 1 + siteMarkup - unusedDiscount - fullTimeDiscount
   */
  const getPlatformMultiplier = useCallback((nightsCount: number): number => {
    const unusedNights = 7 - nightsCount;
    const unusedDiscount = unusedNights * UNUSED_NIGHTS_DISCOUNT_MULTIPLIER;
    const fullTimeDiscount = nightsCount === 7 ? FULL_TIME_DISCOUNT : 0;
    return 1 + SITE_MARKUP - unusedDiscount - fullTimeDiscount;
  }, []);

  /**
   * Calculate host rates that produce desired guest prices after platform markup
   *
   * Strategy:
   * 1. Host sets desired GUEST price curve (base rate with long stay discount)
   * 2. We reverse-calculate HOST rates by dividing by platform multiplier
   * 3. This ensures guest prices ALWAYS decrease as nights increase
   */
  const calculatePrices = useCallback(() => {
    // Calculate desired guest prices (what host wants guests to see)
    // Apply host's long stay discount progressively
    const desiredGuestPrices: number[] = [];
    for (let nights = 1; nights <= N; nights++) {
      // Progressive discount: night 1 = 0%, night 7 = full discount
      const progressiveFactor = (nights - 1) / (N - 1);
      const nightDiscount = progressiveFactor * (discountPercent / 100);
      const guestPrice = baseRate * (1 - nightDiscount);
      desiredGuestPrices.push(guestPrice);
    }

    // Reverse-calculate host rates: hostRate = guestPrice / platformMultiplier
    const hostRates: number[] = [];
    for (let nights = 1; nights <= N; nights++) {
      const multiplier = getPlatformMultiplier(nights);
      const hostRate = desiredGuestPrices[nights - 1] / multiplier;
      hostRates.push(roundUp(hostRate));
    }

    nightlyPricesRef.current = hostRates;

    // Calculate decay (for backward compatibility)
    const decay = hostRates.length > 1 && hostRates[0] > 0
      ? hostRates[hostRates.length - 1] / hostRates[0]
      : 1;

    // Broadcast changes
    if (onPricesChangeRef.current) {
      const roundedNightly = hostRates.map(v => Math.round(v));
      onPricesChangeRef.current({
        p1: roundedNightly[0],
        n1: roundedNightly[0],
        n2: roundedNightly[1],
        n3: roundedNightly[2],
        n4: roundedNightly[3],
        n5: roundedNightly[4],
        n6: roundedNightly[5],
        n7: roundedNightly[6],
        decay: +decay.toFixed(3),
        total: roundedNightly.reduce((a, b) => a + b, 0)
      });
    }

    return { prices: hostRates, decay, desiredGuestPrices };
  }, [baseRate, discountPercent, getPlatformMultiplier]);

  // Recalculate whenever base rate or discount changes
  useEffect(() => {
    calculatePrices();
  }, [calculatePrices]);

  // Calculate GUEST prices for display (what guests actually pay)
  // Host rates are stored but we show guest prices to the host
  const hostRates = nightlyPricesRef.current;
  const guestPrices: number[] = hostRates.map((hostRate, idx) => {
    const nights = idx + 1;
    const multiplier = getPlatformMultiplier(nights);
    return Math.round(hostRate * multiplier);
  });

  // Calculate derived values using GUEST prices
  const fiveNightGuestPrice = guestPrices[4]; // Guest price per night for 5-night stay
  const fiveNightTotal = 5 * fiveNightGuestPrice;
  const avgPrice = fiveNightGuestPrice; // For 5-night stay
  const monthlyEstimate = fiveNightTotal * 4;
  const sevenNightTotal = 7 * guestPrices[6]; // 7 nights × guest price per night

  // Handle base rate input change
  const handleBaseRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val) || val < 0) val = 0;
    setBaseRate(val);
  };

  // Handle discount slider change
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscountPercent(parseInt(e.target.value));
  };

  return (
    <div className="nightly-price-slider">
      {/* Base Nightly Rate Input */}
      <div className="control-group" style={{ textAlign: 'center' }}>
        <label className="calc-label" style={{ display: 'block', marginBottom: '10px' }}>
          Base Nightly Rate
        </label>
        <div className="base-input-wrapper">
          <span className="currency-symbol">$</span>
          <input
            type="number"
            className="base-input"
            value={baseRate}
            onChange={handleBaseRateChange}
            min="0"
            step="1"
          />
        </div>
      </div>

      {/* Long Stay Discount Slider */}
      <div className="control-group">
        <div className="label-row">
          <span className="calc-label">Long Stay Discount</span>
          <span className="value-display">{discountPercent}%</span>
        </div>
        <div className="range-wrapper">
          <input
            type="range"
            min="0"
            max="50"
            value={discountPercent}
            onChange={handleDiscountChange}
          />
        </div>
        <div className="marks">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
        </div>
        <p className="calc-hint">
          Consecutive nights get progressively cheaper. A 5-night stay averages <strong>{fmt0(avgPrice)}</strong>/night.
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
                <span className="swatch-price">{fmtShort(guestPrices[night - 1])}</span>
                <span className="swatch-label">PER NIGHT</span>
              </div>
            ))}
          </div>
        </div>
        <div className="formula-row">
          {guestPrices.map((pricePerNight, idx) => {
            // Total for N nights = N * (guest price per night for that stay length)
            const nightCount = idx + 1;
            const total = nightCount * pricePerNight;
            return <div key={idx} className="formula-item">{fmtShort(total)}</div>;
          })}
        </div>
        <div className="formula-total-row">
          <div className="formula-total-label">7-Night Total</div>
          <div className="formula-total">{fmtShort(sevenNightTotal)}</div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="summary-row">
        <div className="summary-item">
          <div className="summary-label">5-Night Total</div>
          <div className="summary-value">{fmt0(fiveNightTotal)}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Est. Monthly (4 weeks)</div>
          <div className="summary-value">{fmt0(monthlyEstimate)}</div>
        </div>
      </div>

      {/* Smart Pricing explanation */}
      <details className="pricing-details">
        <summary>How does Smart Pricing work?</summary>
        <div className="details-content">
          We calculate a "decay curve" for your pricing. The first night is your full Base Rate.
          Each consecutive night gets slightly cheaper based on your Discount setting.
          <br /><br />
          This encourages guests to book longer blocks (like Mon-Fri) instead of just two nights,
          maximizing your occupancy and reducing turnover effort.
        </div>
      </details>
    </div>
  );
};
