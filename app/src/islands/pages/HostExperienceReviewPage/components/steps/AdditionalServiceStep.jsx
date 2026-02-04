import React from 'react';
import './steps.css';

/**
 * Step 7: Additional Service Needed
 */
export default function AdditionalServiceStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const hasError = !!fieldErrors.additionalServiceNeeded;

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__field">
        <label htmlFor="additionalServiceNeeded" className="survey-step__label">
          Service Suggestions
        </label>

        <textarea
          id="additionalServiceNeeded"
          className={`survey-step__textarea ${hasError ? 'survey-step__textarea--error' : ''}`}
          value={formData.additionalServiceNeeded}
          onChange={(e) => onFieldChange('additionalServiceNeeded', e.target.value)}
          placeholder="Is there any service you wish we offered?"
          rows={5}
          autoFocus
        />

        {hasError && (
          <span className="survey-step__error">
            {fieldErrors.additionalServiceNeeded}
          </span>
        )}
      </div>
    </div>
  );
}
