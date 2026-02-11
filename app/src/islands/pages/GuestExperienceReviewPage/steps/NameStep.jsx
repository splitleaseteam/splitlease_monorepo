/**
 * NameStep - Step 2: Capture the reviewer's name
 */


export default function NameStep({ formData, updateField }) {
  return (
    <div className="step name-step">
      <h2 className="step-question">
        What is your name?
      </h2>

      <p className="step-helper">
        This helps us personalize your experience and follow up if needed.
      </p>

      <input
        type="text"
        className="step-input"
        placeholder="Enter your name..."
        value={formData.name}
        onChange={(e) => updateField('name', e.target.value)}
        autoFocus
      />
    </div>
  );
}
