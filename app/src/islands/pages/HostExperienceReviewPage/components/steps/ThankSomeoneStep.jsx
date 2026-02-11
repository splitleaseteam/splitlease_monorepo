import './steps.css';

/**
 * Step 10: Thank Someone - Staff Appreciation
 */
export default function ThankSomeoneStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const hasError = !!fieldErrors.staffToThank;

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__field">
        <label htmlFor="staffToThank" className="survey-step__label">
          Staff Appreciation
        </label>

        <textarea
          id="staffToThank"
          className={`survey-step__textarea ${hasError ? 'survey-step__textarea--error' : ''}`}
          value={formData.staffToThank}
          onChange={(e) => onFieldChange('staffToThank', e.target.value)}
          placeholder="Is there anyone at Split Lease you want to thank for excellent service?"
          rows={5}
          autoFocus
        />

        {hasError && (
          <span className="survey-step__error">
            {fieldErrors.staffToThank}
          </span>
        )}
      </div>
    </div>
  );
}
