import './steps.css';

/**
 * Step 2: Experience Description (REQUIRED)
 */
export default function ExperienceStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const hasError = !!fieldErrors.experienceDescription;

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__field">
        <label htmlFor="experienceDescription" className="survey-step__label">
          Your Experience
          <span className="survey-step__required">*</span>
        </label>

        <textarea
          id="experienceDescription"
          className={`survey-step__textarea ${hasError ? 'survey-step__textarea--error' : ''}`}
          value={formData.experienceDescription}
          onChange={(e) => onFieldChange('experienceDescription', e.target.value)}
          placeholder="Tell us about your experience using Split Lease..."
          rows={6}
          required
          autoFocus
        />

        {hasError && (
          <span className="survey-step__error">
            {fieldErrors.experienceDescription}
          </span>
        )}
      </div>
    </div>
  );
}
