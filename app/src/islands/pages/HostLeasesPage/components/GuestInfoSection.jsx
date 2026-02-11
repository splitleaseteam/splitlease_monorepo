/**
 * GuestInfoSection Component
 *
 * Displays guest details within a lease card.
 * Shows avatar, name, contact info, and verification badges.
 */
import { User, Mail, Phone, CheckCircle, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPhoneNumber } from '../formatters.js';

/**
 * Get guest avatar URL with fallback
 * @param {Object} guest - The guest object
 * @returns {string} Avatar URL
 */
function getGuestAvatar(guest) {
  if (guest?.profilePhoto) return guest.profilePhoto;
  const name = guest?.firstName || guest?.name || 'Guest';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6C7FEB&color=FFFFFF&size=80`;
}

/**
 * GuestInfoSection displays guest information
 *
 * @param {Object} props
 * @param {Object} props.guest - Normalized guest object
 * @param {boolean} props.isExpanded - Whether to show full details
 * @param {Function} props.onToggle - Toggle expanded state
 */
export function GuestInfoSection({ guest, isExpanded = false, onToggle }) {
  if (!guest) {
    return (
      <div className="hl-guest-section">
        <div className="hl-guest-header">
          <User size={20} />
          <span>Guest information not available</span>
        </div>
      </div>
    );
  }

  const {
    name,
    firstName,
    email,
    phone,
    profilePhoto,
    isVerified,
    hasIdVerification,
    hasWorkVerification,
  } = guest;

  const displayName = name || firstName || 'Guest';
  const avatar = getGuestAvatar(guest);

  return (
    <div className="hl-guest-section">
      <div className="hl-guest-header" onClick={onToggle} role="button" tabIndex={0}>
        <div className="hl-guest-summary">
          <img
            src={avatar}
            alt={`${displayName}'s avatar`}
            className="hl-guest-avatar"
          />
          <div className="hl-guest-name-badges">
            <span className="hl-guest-name">{displayName}</span>
            <div className="hl-guest-badges">
              {(isVerified || hasIdVerification) && (
                <span className="hl-verification-badge hl-verified-id" title="ID Verified">
                  <CheckCircle size={12} />
                  ID
                </span>
              )}
              {hasWorkVerification && (
                <span className="hl-verification-badge hl-verified-work" title="Work Verified">
                  <Briefcase size={12} />
                  Work
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="hl-guest-toggle"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Hide contact details' : 'Show contact details'}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="hl-guest-details">
          {email && (
            <div className="hl-guest-contact-row">
              <Mail size={14} />
              <a href={`mailto:${email}`} className="hl-guest-email">
                {email}
              </a>
            </div>
          )}
          {phone && (
            <div className="hl-guest-contact-row">
              <Phone size={14} />
              <a href={`tel:${phone}`} className="hl-guest-phone">
                {formatPhoneNumber(phone)}
              </a>
            </div>
          )}
          {!email && !phone && (
            <p className="hl-guest-no-contact">Contact details not available</p>
          )}
        </div>
      )}
    </div>
  );
}

export default GuestInfoSection;
