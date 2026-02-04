import React from 'react';
import './steps.css';

/**
 * Step 3: Prior Challenge
 */
export default function PriorChallengeStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const hasError = !!fieldErrors.priorChallenge;

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__field">
        <label htmlFor="priorChallenge" className="survey-step__label">
          Your Biggest Challenge
        </label>

        <textarea
          id="priorChallenge"
          className={`survey-step__textarea ${hasError ? 'survey-step__textarea--error' : ''}`}
          value={formData.priorChallenge}
          onChange={(e) => onFieldChange('priorChallenge', e.target.value)}
          placeholder="What was the biggest challenge you faced before using Split Lease?"
          rows={5}
          autoFocus
        />

        {hasError && (
          <span className="survey-step__error">
            {fieldErrors.priorChallenge}
          </span>
        )}
      </div>
    </div>
  );
}
