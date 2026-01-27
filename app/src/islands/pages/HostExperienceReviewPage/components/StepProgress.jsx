import React from 'react';
import './StepProgress.css';

/**
 * Visual progress indicator for multi-step wizard
 * Shows completed, current, and pending steps
 */
export default function StepProgress({
  currentStep,
  totalSteps,
  progress,
  onStepClick
}) {
  return (
    <div className="step-progress">
      {/* Progress Bar */}
      <div className="step-progress__bar">
        <div
          className="step-progress__bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Counter */}
      <div className="step-progress__counter">
        Step {currentStep} of {totalSteps}
      </div>

      {/* Step Dots (optional - for visual indicator) */}
      <div className="step-progress__dots">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <button
              key={stepNumber}
              className={`step-progress__dot ${
                isCompleted ? 'step-progress__dot--completed' : ''
              } ${
                isCurrent ? 'step-progress__dot--current' : ''
              }`}
              onClick={() => isCompleted && onStepClick(stepNumber)}
              disabled={!isCompleted}
              aria-label={`Step ${stepNumber}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
            >
              {isCompleted ? '✓' : stepNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
