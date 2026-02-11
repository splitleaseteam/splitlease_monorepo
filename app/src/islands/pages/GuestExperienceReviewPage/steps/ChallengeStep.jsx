/**
 * ChallengeStep - Step 4: Biggest challenge before Split Lease
 */

import React from 'react';

export default function ChallengeStep({ formData, updateField }) {
  return (
    <div className="step challenge-step">
      <h2 className="step-question">
        What was your biggest challenge before using Split Lease?
      </h2>

      <p className="step-helper">
        We&apos;d love to understand the problems you were facing before finding us.
      </p>

      <textarea
        className="step-textarea"
        placeholder="Describe your challenges..."
        value={formData.challenge}
        onChange={(e) => updateField('challenge', e.target.value)}
        rows={5}
        autoFocus
      />
    </div>
  );
}
