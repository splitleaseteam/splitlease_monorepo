/**
 * AdditionalServiceStep - Step 8: Additional services desired
 */


export default function AdditionalServiceStep({ formData, updateField }) {
  return (
    <div className="step additional-service-step">
      <h2 className="step-question">
        What additional services would you like to see?
      </h2>

      <p className="step-helper">
        Help us understand what else we could offer to improve your experience.
      </p>

      <textarea
        className="step-textarea"
        placeholder="Suggest new features or services..."
        value={formData.additionalService}
        onChange={(e) => updateField('additionalService', e.target.value)}
        rows={5}
        autoFocus
      />
    </div>
  );
}
