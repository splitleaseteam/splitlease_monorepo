/**
 * BasicInfoCard.jsx
 *
 * Basic information form card: First name, Last name, Job title, Date of Birth (conditional),
 * and Contact & Verification section (Email, Phone, Gov ID, LinkedIn).
 *
 * Editor view only (public view shows name in sidebar).
 *
 * Date of Birth is only shown when:
 * - User signed up via OAuth (LinkedIn/Google) where DOB isn't collected during signup
 * - The Date of Birth field is empty in the database
 * Once filled and saved, the DOB field is hidden on subsequent visits.
 */

import React from 'react';
import ProfileCard from '../shared/ProfileCard.jsx';
import { Mail, Phone, ShieldCheck, Linkedin, CheckCircle } from 'lucide-react';

export default function BasicInfoCard({
  firstName,
  lastName,
  jobTitle,
  dateOfBirth = '',
  showDateOfBirthField = false,
  errors = {},
  onFieldChange,
  // Contact & Verification props
  emailAddress = '',
  phoneNumber = '',
  verifications = {},
  onVerifyEmail,
  onVerifyPhone,
  onVerifyGovId,
  onConnectLinkedIn,
  onEditPhone,
  isVerifyingEmail = false,
  verificationEmailSent = false
}) {
  return (
    <ProfileCard title="Basic Information">
      <div className="profile-form-row">
        <div className="profile-form-group">
          <label className="profile-form-label" htmlFor="firstName">
            First Name *
          </label>
          <input
            id="firstName"
            type="text"
            className="profile-form-input"
            value={firstName}
            onChange={(e) => onFieldChange('firstName', e.target.value)}
            placeholder="Your first name"
          />
          {errors.firstName && (
            <span className="profile-form-error">{errors.firstName}</span>
          )}
        </div>

        <div className="profile-form-group">
          <label className="profile-form-label" htmlFor="lastName">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            className="profile-form-input"
            value={lastName}
            onChange={(e) => onFieldChange('lastName', e.target.value)}
            placeholder="Your last name"
          />
        </div>
      </div>

      <div className="profile-form-row">
        {/* Date of Birth - Only shown when user has no DOB in database (OAuth signups) */}
        {showDateOfBirthField && (
          <div className="profile-form-group">
            <label className="profile-form-label" htmlFor="dateOfBirth">
              Date of Birth
            </label>
            <input
              id="dateOfBirth"
              type="date"
              className="profile-form-input"
              value={dateOfBirth}
              onChange={(e) => onFieldChange('dateOfBirth', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        )}

        <div className="profile-form-group">
          <label className="profile-form-label" htmlFor="jobTitle">
            Job Title
          </label>
          <input
            id="jobTitle"
            type="text"
            className="profile-form-input"
            value={jobTitle}
            onChange={(e) => onFieldChange('jobTitle', e.target.value)}
            placeholder="e.g., Software Engineer, Marketing Manager"
          />
        </div>
      </div>

      {/* Contact & Verification Section */}
      <div className="profile-card-divider" />
      <h4 className="profile-card-subtitle">Contact & Verification</h4>

      <div className="verification-list">
        {/* Email */}
        <div className="verification-item">
          <div className="verification-item-left">
            <div className="verification-icon-container">
              <Mail size={24} />
            </div>
            <div className="verification-info">
              <span className="verification-title">Email Address</span>
              {emailAddress && (
                <span className="verification-value">{emailAddress}</span>
              )}
              {verifications.email ? (
                <span className="verification-status verification-status--verified">
                  <CheckCircle size={14} />
                  Verified
                </span>
              ) : (
                <span className="verification-status verification-status--unverified">
                  Not verified
                </span>
              )}
            </div>
          </div>
          <div className="verification-item-right">
            {!verifications.email && onVerifyEmail && (
              <button
                type="button"
                className={`verification-btn${verificationEmailSent ? ' verification-btn--success' : ''}`}
                onClick={onVerifyEmail}
                disabled={isVerifyingEmail || verificationEmailSent}
              >
                {isVerifyingEmail
                  ? 'Sending...'
                  : verificationEmailSent
                    ? 'Email Sent ✓'
                    : 'Verify'}
              </button>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="verification-item">
          <div className="verification-item-left">
            <div className="verification-icon-container">
              <Phone size={24} />
            </div>
            <div className="verification-info">
              <span className="verification-title">Phone Number</span>
              {phoneNumber && (
                <span className="verification-value">{phoneNumber}</span>
              )}
              {verifications.phone ? (
                <span className="verification-status verification-status--verified">
                  <CheckCircle size={14} />
                  Verified
                </span>
              ) : (
                <span className="verification-status verification-status--unverified">
                  Not verified
                </span>
              )}
            </div>
          </div>
          <div className="verification-item-right">
            {verifications.phone && onEditPhone && (
              <button
                type="button"
                className="verification-btn verification-btn--secondary"
                onClick={onEditPhone}
              >
                Edit
              </button>
            )}
            {!verifications.phone && onVerifyPhone && (
              <button
                type="button"
                className="verification-btn"
                onClick={onVerifyPhone}
              >
                Verify
              </button>
            )}
          </div>
        </div>

        {/* Government ID */}
        <div className="verification-item">
          <div className="verification-item-left">
            <div className="verification-icon-container">
              <ShieldCheck size={24} />
            </div>
            <div className="verification-info">
              <span className="verification-title">Government ID</span>
              {verifications.govId ? (
                <span className="verification-status verification-status--verified">
                  <CheckCircle size={14} />
                  Verified
                </span>
              ) : (
                <span className="verification-status verification-status--unverified">
                  Not verified
                </span>
              )}
            </div>
          </div>
          <div className="verification-item-right">
            {!verifications.govId && onVerifyGovId && (
              <button
                type="button"
                className="verification-btn"
                onClick={onVerifyGovId}
              >
                Verify
              </button>
            )}
          </div>
        </div>

        {/* LinkedIn */}
        <div className="verification-item">
          <div className="verification-item-left">
            <div className="verification-icon-container">
              <Linkedin size={24} />
            </div>
            <div className="verification-info">
              <span className="verification-title">LinkedIn</span>
              {verifications.linkedin ? (
                <span className="verification-status verification-status--verified">
                  <CheckCircle size={14} />
                  Connected
                </span>
              ) : (
                <span className="verification-status verification-status--unverified">
                  Not connected
                </span>
              )}
            </div>
          </div>
          <div className="verification-item-right">
            {!verifications.linkedin && onConnectLinkedIn && (
              <button
                type="button"
                className="verification-btn"
                onClick={onConnectLinkedIn}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </ProfileCard>
  );
}
