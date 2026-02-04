/**
 * FeelingsStep - Step 5: How the challenge made them feel
 */

import React from 'react';

export default function FeelingsStep({ formData, updateField }) {
  return (
    <div className="step feelings-step">
      <h2 className="step-question">
        How did that challenge make you feel?
      </h2>

      <p className="step-helper">
        Help us understand the emotional impact of the housing challenges you faced.
      </p>

      <textarea
        className="step-textarea"
        placeholder="Describe how you felt..."
        value={formData.challengeExperience}
        onChange={(e) => updateField('challengeExperience', e.target.value)}
        rows={5}
        autoFocus
      />
    </div>
  );
}
