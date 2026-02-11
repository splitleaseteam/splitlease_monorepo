import './steps.css';

/**
 * Step 6: What Stood Out
 */
export default function WhatStoodOutStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const hasError = !!fieldErrors.whatStoodOut;

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__field">
        <label htmlFor="whatStoodOut" className="survey-step__label">
          Memorable Aspects
        </label>

        <textarea
          id="whatStoodOut"
          className={`survey-step__textarea ${hasError ? 'survey-step__textarea--error' : ''}`}
          value={formData.whatStoodOut}
          onChange={(e) => onFieldChange('whatStoodOut', e.target.value)}
          placeholder="Was there anything particularly memorable about our service?"
          rows={5}
          autoFocus
        />

        {hasError && (
          <span className="survey-step__error">
            {fieldErrors.whatStoodOut}
          </span>
        )}
      </div>
    </div>
  );
}
