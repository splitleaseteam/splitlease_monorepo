import React from 'react';
import './steps.css';

/**
 * Step 11: Any Questions - Final Step
 */
export default function QuestionsStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const hasError = !!fieldErrors.additionalQuestions;

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__field">
        <label htmlFor="additionalQuestions" className="survey-step__label">
          Your Questions
        </label>

        <textarea
          id="additionalQuestions"
          className={`survey-step__textarea ${hasError ? 'survey-step__textarea--error' : ''}`}
          value={formData.additionalQuestions}
          onChange={(e) => onFieldChange('additionalQuestions', e.target.value)}
          placeholder="Do you have any questions regarding our service?"
          rows={5}
          autoFocus
        />

        {hasError && (
          <span className="survey-step__error">
            {fieldErrors.additionalQuestions}
          </span>
        )}
      </div>

      <p className="survey-step__final-note">
        This is the last step! Click Submit to send your feedback.
      </p>
    </div>
  );
}
