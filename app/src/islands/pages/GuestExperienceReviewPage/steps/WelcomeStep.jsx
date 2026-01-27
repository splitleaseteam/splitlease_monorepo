/**
 * WelcomeStep - Step 1: Introduction to the survey
 */

import React from 'react';

export default function WelcomeStep() {
  return (
    <div className="step welcome-step">
      <div className="welcome-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 9h.01M15 9h.01" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h2 className="step-title">Welcome to Your Experience Review</h2>

      <p className="step-description">
        We value your feedback! This short survey will help us understand your experience
        with Split Lease and how we can improve our service.
      </p>

      <div className="welcome-features">
        <div className="feature-item">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>Takes about 5 minutes</span>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>Your responses are confidential</span>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>Helps us serve you better</span>
        </div>
      </div>

      <p className="step-hint">
        Click <strong>Next</strong> to begin
      </p>
    </div>
  );
}
