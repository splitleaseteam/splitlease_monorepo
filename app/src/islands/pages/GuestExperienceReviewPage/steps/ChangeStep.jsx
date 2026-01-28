/**
 * ChangeStep - Step 6: What changed after using Split Lease
 */

import React from 'react';

export default function ChangeStep({ formData, updateField }) {
  return (
    <div className="step change-step">
      <h2 className="step-question">
        What changed after you started using Split Lease?
      </h2>

      <p className="step-helper">
        Tell us about the differences you experienced after using our service.
      </p>

      <textarea
        className="step-textarea"
        placeholder="Describe what changed..."
        value={formData.change}
        onChange={(e) => updateField('change', e.target.value)}
        rows={5}
        autoFocus
      />
    </div>
  );
}
