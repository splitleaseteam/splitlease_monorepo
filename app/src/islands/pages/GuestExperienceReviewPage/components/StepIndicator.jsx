/**
 * StepIndicator - Numbered step progress indicator
 *
 * Shows numbered steps with visual indication of:
 * - Completed steps (filled circle with checkmark)
 * - Current step (highlighted)
 * - Upcoming steps (outlined)
 */

import React from 'react';

export default function StepIndicator({ currentStep, totalSteps, steps }) {
  return (
    <div className="step-indicator">
      <div className="step-progress-bar">
        <div
          className="step-progress-fill"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      <div className="step-dots">
        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div
              key={step.id}
              className={`step-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
              title={step.label}
            >
              {isCompleted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <span>{step.id}</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="step-label">
        Step {currentStep} of {totalSteps}: <strong>{steps[currentStep - 1]?.label}</strong>
      </p>
    </div>
  );
}
