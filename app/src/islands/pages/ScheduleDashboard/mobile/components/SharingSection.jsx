/**
 * SharingSection Component
 *
 * Sharing willingness settings with percentage slider.
 */

import React, { useState, useCallback } from 'react';
import SectionHeader from './SectionHeader.jsx';

/**
 * Get label for willingness level
 * @param {number} value - Willingness percentage (0-100)
 * @returns {Object} Label and description
 */
function getWillingnessLevel(value) {
  if (value < 20) {
    return {
      label: 'Rarely',
      description: 'Only accept sharing in special circumstances',
      color: 'var(--schedule-danger, #EF4444)'
    };
  }
  if (value < 40) {
    return {
      label: 'Sometimes',
      description: 'Open to sharing occasionally',
      color: 'var(--schedule-warning, #F59E0B)'
    };
  }
  if (value < 60) {
    return {
      label: 'Neutral',
      description: 'Balanced approach to sharing',
      color: 'var(--schedule-text-muted, #6B7280)'
    };
  }
  if (value < 80) {
    return {
      label: 'Often',
      description: 'Frequently open to sharing nights',
      color: 'var(--schedule-success, #3B82F6)'
    };
  }
  return {
    label: 'Always',
    description: 'Very open to sharing arrangements',
    color: 'var(--schedule-primary, #31135D)'
  };
}

/**
 * Percentage slider component
 */
function PercentageSlider({ label, value, onChange }) {
  const level = getWillingnessLevel(value);

  return (
    <div className="percentage-slider">
      <div className="percentage-slider__header">
        <label className="percentage-slider__label">{label}</label>
        <span
          className="percentage-slider__value"
          style={{ color: level.color }}
        >
          {value}% - {level.label}
        </span>
      </div>
      <input
        type="range"
        className="percentage-slider__input"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        min={0}
        max={100}
        step={5}
        style={{
          '--slider-progress': `${value}%`,
          '--slider-color': level.color
        }}
      />
      <div className="percentage-slider__range">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
      <p className="percentage-slider__description">{level.description}</p>
    </div>
  );
}

/**
 * Sharing section component
 * @param {Object} props
 * @param {number} props.value - Current sharing willingness (0-100)
 * @param {function} props.onSave - Callback to save preference
 * @param {function} props.onBack - Callback to go back
 */
export default function SharingSection({ value, onSave, onBack }) {
  const [willingness, setWillingness] = useState(value || 50);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = willingness !== value;

  const handleSave = useCallback(async () => {
    if (!isDirty || isSaving) return;

    setIsSaving(true);
    try {
      await onSave?.(willingness);
      onBack();
    } catch (error) {
      console.error('Failed to save sharing preference:', error);
    } finally {
      setIsSaving(false);
    }
  }, [willingness, isDirty, isSaving, onSave, onBack]);

  return (
    <div className="settings-section">
      <SectionHeader title="Sharing Preferences" onBack={onBack} />

      <div className="settings-section__content">
        <PercentageSlider
          label="Sharing Willingness"
          value={willingness}
          onChange={setWillingness}
        />

        <div className="settings-info-box">
          <span className="settings-info-box__icon">ℹ️</span>
          <p>
            This setting indicates how open you are to sharing nights with your co-tenant.
            A higher percentage means you're more likely to accept sharing requests.
          </p>
        </div>

        <div className="sharing-examples">
          <h3 className="sharing-examples__title">What this means:</h3>
          <ul className="sharing-examples__list">
            <li>
              <strong>Low (0-30%):</strong> Prefer exclusive nights, rarely share
            </li>
            <li>
              <strong>Medium (30-70%):</strong> Flexible, consider each request
            </li>
            <li>
              <strong>High (70-100%):</strong> Very open to sharing arrangements
            </li>
          </ul>
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
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
