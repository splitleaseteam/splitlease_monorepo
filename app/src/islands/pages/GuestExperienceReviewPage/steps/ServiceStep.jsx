/**
 * ServiceStep - Step 7: What stood out about the service
 */


export default function ServiceStep({ formData, updateField }) {
  return (
    <div className="step service-step">
      <h2 className="step-question">
        What stood out to you about our service?
      </h2>

      <p className="step-helper">
        Tell us what aspects of Split Lease impressed you the most.
      </p>

      <textarea
        className="step-textarea"
        placeholder="What made an impression..."
        value={formData.service}
        onChange={(e) => updateField('service', e.target.value)}
        rows={5}
        autoFocus
      />
    </div>
  );
}
