/**
 * PricingSection Component
 *
 * Pricing controls for buyout settings with multipliers.
 */

import { useState, useCallback } from 'react';
import SectionHeader from './SectionHeader.jsx';

/**
 * Price input component
 */
function PriceInput({ label, value, onChange, min = 0, max = 1000 }) {
  const handleChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="price-input">
      <label className="price-input__label">{label}</label>
      <div className="price-input__wrapper">
        <span className="price-input__prefix">$</span>
        <input
          type="number"
          className="price-input__field"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
        />
      </div>
    </div>
  );
}

/**
 * Multiplier slider component
 */
function MultiplierSlider({ label, value, onChange, min = 1, max = 3, step = 0.05 }) {
  return (
    <div className="multiplier-slider">
      <div className="multiplier-slider__header">
        <label className="multiplier-slider__label">{label}</label>
        <span className="multiplier-slider__value">{value.toFixed(2)}x</span>
      </div>
      <input
        type="range"
        className="multiplier-slider__input"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
      />
      <div className="multiplier-slider__range">
        <span>{min}x</span>
        <span>{max}x</span>
      </div>
    </div>
  );
}

/**
 * Pricing section component
 * @param {Object} props
 * @param {Object} props.settings - Current pricing settings
 * @param {function} props.onSave - Callback to save settings
 * @param {function} props.onBack - Callback to go back
 */
export default function PricingSection({ settings, onSave, onBack }) {
  const [basePrice, setBasePrice] = useState(settings?.basePrice || 100);
  const [shortNotice, setShortNotice] = useState(settings?.shortNoticeMultiplier || 1.5);
  const [soonNotice, setSoonNotice] = useState(settings?.soonMultiplier || 1.25);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleBasePriceChange = useCallback((value) => {
    setBasePrice(value);
    setIsDirty(true);
  }, []);

  const handleShortNoticeChange = useCallback((value) => {
    setShortNotice(value);
    setIsDirty(true);
  }, []);

  const handleSoonNoticeChange = useCallback((value) => {
    setSoonNotice(value);
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    if (!isDirty || isSaving) return;

    setIsSaving(true);
    try {
      await onSave?.({
        basePrice,
        shortNoticeMultiplier: shortNotice,
        soonMultiplier: soonNotice
      });
      onBack();
    } catch (error) {
      console.error('Failed to save pricing settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate preview prices
  const shortNoticePrice = Math.round(basePrice * shortNotice);
  const soonNoticePrice = Math.round(basePrice * soonNotice);

  return (
    <div className="settings-section">
      <SectionHeader title="Buyout Pricing" onBack={onBack} />

      <div className="settings-section__content">
        <PriceInput
          label="Base Price (per night)"
          value={basePrice}
          onChange={handleBasePriceChange}
        />

        <div className="settings-divider" />

        <MultiplierSlider
          label="Short Notice (< 48 hours)"
          value={shortNotice}
          onChange={handleShortNoticeChange}
        />
        <p className="settings-hint">
          Price: ${shortNoticePrice}/night for last-minute requests
        </p>

        <div className="settings-divider" />

        <MultiplierSlider
          label="Soon (< 1 week)"
          value={soonNotice}
          onChange={handleSoonNoticeChange}
        />
        <p className="settings-hint">
          Price: ${soonNoticePrice}/night for requests within a week
        </p>

        <div className="settings-info-box">
          <span className="settings-info-box__icon">💡</span>
          <p>
            Multipliers apply automatically based on how soon the requested dates are.
            Requests further out use your base price.
          </p>
        </div>
      </div>

      <div className="settings-section__footer">
        <button
          className="settings-btn settings-btn--secondary"
          onClick={onBack}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          className="settings-btn settings-btn--primary"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
