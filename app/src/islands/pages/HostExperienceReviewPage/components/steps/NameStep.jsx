import React from 'react';
import './steps.css';

/**
 * Step 1: Name Input
 */
export default function NameStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const hasError = !!fieldErrors.hostName;

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__field">
        <label htmlFor="hostName" className="survey-step__label">
          Your Name
        </label>

        <input
          type="text"
          id="hostName"
          className={`survey-step__input ${hasError ? 'survey-step__input--error' : ''}`}
          value={formData.hostName}
          onChange={(e) => onFieldChange('hostName', e.target.value)}
          placeholder="Enter your name"
          autoFocus
        />

        {hasError && (
          <span className="survey-step__error">
            {fieldErrors.hostName}
          </span>
        )}
      </div>
    </div>
  );
}
