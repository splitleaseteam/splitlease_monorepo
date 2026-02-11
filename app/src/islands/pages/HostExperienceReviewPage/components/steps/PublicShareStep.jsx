import './steps.css';

/**
 * Step 8: Permission to Share Publicly (Boolean)
 */
export default function PublicShareStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const canShare = formData.canSharePublicly;

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__toggle-container">
        <button
          type="button"
          className={`survey-step__toggle-option ${canShare ? 'survey-step__toggle-option--selected' : ''}`}
          onClick={() => onFieldChange('canSharePublicly', true)}
        >
          <span className="survey-step__toggle-icon">✓</span>
          <span>Yes, you can share my feedback</span>
        </button>

        <button
          type="button"
          className={`survey-step__toggle-option ${!canShare ? 'survey-step__toggle-option--selected' : ''}`}
          onClick={() => onFieldChange('canSharePublicly', false)}
        >
          <span className="survey-step__toggle-icon">✗</span>
          <span>No, keep my feedback private</span>
        </button>
      </div>

      <p className="survey-step__privacy-note">
        If you agree, we may use your feedback in marketing materials,
        testimonials, or case studies. Your personal information will
        never be shared without your consent.
      </p>
    </div>
  );
}
