import './steps.css';

/**
 * Step 5: What Changed
 */
export default function WhatChangedStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const hasError = !!fieldErrors.whatChanged;

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__field">
        <label htmlFor="whatChanged" className="survey-step__label">
          Changes After Using Split Lease
        </label>

        <textarea
          id="whatChanged"
          className={`survey-step__textarea ${hasError ? 'survey-step__textarea--error' : ''}`}
          value={formData.whatChanged}
          onChange={(e) => onFieldChange('whatChanged', e.target.value)}
          placeholder="How has your experience improved since joining us?"
          rows={5}
          autoFocus
        />

        {hasError && (
          <span className="survey-step__error">
            {fieldErrors.whatChanged}
          </span>
        )}
      </div>
    </div>
  );
}
