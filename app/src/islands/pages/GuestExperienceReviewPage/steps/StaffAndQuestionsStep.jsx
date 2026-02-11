/**
 * StaffAndQuestionsStep - Step 10: Staff recognition and questions
 */

import React from 'react';

export default function StaffAndQuestionsStep({ formData, updateField }) {
  return (
    <div className="step staff-questions-step">
      <h2 className="step-question">
        Is there a Split Lease team member you&apos;d like to recognize?
      </h2>

      <p className="step-helper">
        Let us know if anyone on our team provided exceptional service.
      </p>

      <input
        type="text"
        className="step-input"
        placeholder="Team member name (optional)..."
        value={formData.staff}
        onChange={(e) => updateField('staff', e.target.value)}
      />

      <div className="step-divider"></div>

      <h2 className="step-question secondary">
        Do you have any questions for us?
      </h2>

      <p className="step-helper">
        Feel free to ask anything about Split Lease.
      </p>

      <textarea
        className="step-textarea"
        placeholder="Your questions (optional)..."
        value={formData.questions}
        onChange={(e) => updateField('questions', e.target.value)}
        rows={4}
      />
    </div>
  );
}
