/**
 * ExperienceStep - Step 3: Describe overall experience
 */


export default function ExperienceStep({ formData, updateField }) {
  return (
    <div className="step experience-step">
      <h2 className="step-question">
        Please describe your experience with Split Lease.
      </h2>

      <p className="step-helper">
        Tell us about your overall experience using our platform.
      </p>

      <textarea
        className="step-textarea"
        placeholder="Share your thoughts..."
        value={formData.experience}
        onChange={(e) => updateField('experience', e.target.value)}
        rows={5}
        autoFocus
      />
    </div>
  );
}
