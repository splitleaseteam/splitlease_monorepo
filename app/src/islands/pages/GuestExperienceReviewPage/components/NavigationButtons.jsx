/**
 * NavigationButtons - Back/Next buttons for survey navigation
 */

import React from 'react';

export default function NavigationButtons({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isSubmitting,
  isLastStep,
}) {
  return (
    <div className="navigation-buttons">
      {currentStep > 1 && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      )}

      <button
        type="button"
        className={`btn ${isLastStep ? 'btn-success' : 'btn-primary'}`}
        onClick={onNext}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="btn-spinner"></span>
            Submitting...
          </>
        ) : isLastStep ? (
          <>
            Submit
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        ) : (
          <>
            Next
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
