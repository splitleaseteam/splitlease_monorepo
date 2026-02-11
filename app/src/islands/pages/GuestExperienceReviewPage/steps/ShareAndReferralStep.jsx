/**
 * ShareAndReferralStep - Step 11: Consent to share + Referral
 */

import React from 'react';

export default function ShareAndReferralStep({
  formData,
  updateField,
  referralEmail,
  setReferralEmail,
  handleSubmitReferral,
  isSubmittingReferral,
}) {
  return (
    <div className="step share-referral-step">
      {/* Share Consent Section */}
      <div className="share-section">
        <h2 className="step-question">
          Can we share your experience with others?
        </h2>

        <p className="step-helper">
          Your story could help others find the perfect home. We may use your
          feedback on our website or marketing materials.
        </p>

        <div className="share-options">
          <label className={`share-option ${formData.canShare === true ? 'selected' : ''}`}>
            <input
              type="radio"
              name="canShare"
              checked={formData.canShare === true}
              onChange={() => updateField('canShare', true)}
            />
            <div className="share-option-content">
              <div className="share-option-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Yes, I&apos;m happy to share</span>
            </div>
          </label>

          <label className={`share-option ${formData.canShare === false ? 'selected' : ''}`}>
            <input
              type="radio"
              name="canShare"
              checked={formData.canShare === false}
              onChange={() => updateField('canShare', false)}
            />
            <div className="share-option-content">
              <div className="share-option-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round"/>
                  <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round"/>
                </svg>
              </div>
              <span>No, keep it private</span>
            </div>
          </label>
        </div>
      </div>

      {/* Referral Section */}
      <div className="referral-section">
        <div className="step-divider"></div>

        <h2 className="step-question secondary">
          Know someone who could benefit from Split Lease?
        </h2>

        <p className="step-helper">
          Refer a friend and help them discover flexible housing options!
        </p>

        <div className="referral-input-group">
          <input
            type="email"
            className="step-input"
            placeholder="Friend's email address..."
            value={referralEmail}
            onChange={(e) => setReferralEmail(e.target.value)}
            disabled={isSubmittingReferral}
          />

          <button
            type="button"
            className="btn btn-secondary referral-btn"
            onClick={handleSubmitReferral}
            disabled={isSubmittingReferral || !referralEmail.trim()}
          >
            {isSubmittingReferral ? (
              <>
                <span className="btn-spinner"></span>
                Sending...
              </>
            ) : (
              <>
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Send Referral
              </>
            )}
          </button>
        </div>

        <p className="referral-note">
          Your friend will receive an invitation email. This is optional and won&apos;t affect your survey submission.
        </p>
      </div>
    </div>
  );
}
