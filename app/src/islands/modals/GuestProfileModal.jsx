/**
 * GuestProfileModal Component - v1.0 PROTOCOL REDESIGN
 *
 * Shows guest profile with verification badges, bio, and guest needs
 * Design: POPUP_REPLICATION_PROTOCOL - Monochromatic purple, pill buttons, mobile bottom sheet
 * Based on HostProfileModal pattern
 */

import { createPortal } from 'react-dom';
import { X, User, Linkedin, Phone, Mail, CreditCard, CheckCircle } from 'lucide-react';
import { getInitialsAvatarUrl, handleAvatarError } from '../../lib/avatarUtils.js';

export default function GuestProfileModal({ guest, onClose }) {
  if (!guest) {
    console.warn('GuestProfileModal: No guest data provided');
    return null;
  }

  console.log('GuestProfileModal rendering with guest:', guest);

  // Get guest display name
  const firstName = guest.firstName || guest.first_name || guest.name || '';
  const lastName = guest.lastName || guest.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Guest';
  const displayName = firstName || fullName;

  // Get photo URL
  const photoUrl = guest.profilePhoto || guest.avatar || guest.profile_photo_url;
  const avatarUrl = photoUrl || getInitialsAvatarUrl(displayName);

  // Get bio
  const bio = guest.bio || guest.Bio || '';

  // Get guest needs/special requests
  const needForSpace = guest.stated_need_for_space_text || '';
  const specialNeeds = guest.stated_special_needs_text || '';

  // Verification items data - only show verified items for a positive impression
  const allVerifications = [
    {
      icon: Linkedin,
      label: 'LinkedIn',
      verified: !!guest.linkedin_profile_id
    },
    {
      icon: Phone,
      label: 'Phone',
      verified: guest.is_phone_verified === true
    },
    {
      icon: Mail,
      label: 'Email',
      verified: guest.is_email_confirmed === true
    },
    {
      icon: CreditCard,
      label: 'Identity',
      verified: guest.is_identity_verified === true
    },
  ];

  // Only show verifications that are complete (positive framing)
  const verifiedItems = allVerifications.filter(item => item.verified);

  // Review count
  const reviewCount = guest.review_count || 0;

  const modalContent = (
    <div className="protocol-overlay" onClick={onClose}>
      <div className="protocol-modal guest-profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Grab Handle */}
        <div className="protocol-grab-handle" />

        {/* Header */}
        <div className="protocol-header">
          <div className="protocol-header-left">
            <User size={24} strokeWidth={2} color="var(--protocol-primary)" aria-hidden="true" />
            <h2 className="protocol-title">Guest Profile</h2>
          </div>
          <button
            className="protocol-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="protocol-body">
          {/* Guest Info Section */}
          <div className="gpm-guest-section">
            {/* Guest Photo */}
            <img
              src={avatarUrl}
              alt={displayName}
              className="gpm-guest-photo"
              onError={handleAvatarError}
            />

            {/* Guest Info and Verification */}
            <div className="gpm-guest-info">
              <div className="gpm-guest-name">{fullName}</div>
              {reviewCount > 0 && (
                <div className="gpm-review-count">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</div>
              )}

              {/* Only show verified items - positive framing */}
              {verifiedItems.length > 0 && (
                <div className="gpm-verification-badges">
                  {verifiedItems.map(({ icon: _Icon, label }) => (
                    <div key={label} className="gpm-verified-badge">
                      <CheckCircle size={12} strokeWidth={2} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bio Section */}
          {bio && (
            <div className="gpm-section">
              <div className="gpm-section-title">About</div>
              <div className="gpm-section-content">{bio}</div>
            </div>
          )}

          {/* Need for Space Section */}
          {needForSpace && (
            <div className="gpm-section">
              <div className="gpm-section-title">Need for Space</div>
              <div className="gpm-section-content">{needForSpace}</div>
            </div>
          )}

          {/* Special Needs Section */}
          {specialNeeds && (
            <div className="gpm-section">
              <div className="gpm-section-title">Special Requests</div>
              <div className="gpm-section-content">{specialNeeds}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="protocol-footer protocol-footer-full">
          <button className="protocol-btn protocol-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
