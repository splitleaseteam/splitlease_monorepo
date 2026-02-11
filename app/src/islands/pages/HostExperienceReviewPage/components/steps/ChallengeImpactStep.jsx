import './steps.css';

/**
 * Step 4: Challenge Impact
 */
export default function ChallengeImpactStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const hasError = !!fieldErrors.challengeImpact;

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__field">
        <label htmlFor="challengeImpact" className="survey-step__label">
          Impact Description
        </label>

        <textarea
          id="challengeImpact"
          className={`survey-step__textarea ${hasError ? 'survey-step__textarea--error' : ''}`}
          value={formData.challengeImpact}
          onChange={(e) => onFieldChange('challengeImpact', e.target.value)}
          placeholder="Describe how this challenge impacted your hosting experience..."
          rows={5}
          autoFocus
        />

        {hasError && (
          <span className="survey-step__error">
            {fieldErrors.challengeImpact}
          </span>
        )}
      </div>
    </div>
  );
}
