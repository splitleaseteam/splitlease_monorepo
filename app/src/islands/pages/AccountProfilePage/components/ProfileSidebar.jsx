/**
 * ProfileSidebar.jsx
 *
 * Sticky sidebar component for the profile page.
 * Contains cover photo, avatar, profile info, and view-specific sections.
 *
 * Editor View: Profile strength meter, next action suggestions
 * Public View: Stats, verification badges, member since date
 */

import CoverPhotoEditor from './shared/CoverPhotoEditor.jsx';
import AvatarWithBadge from './shared/AvatarWithBadge.jsx';
import ProfileStrengthMeter from './shared/ProfileStrengthMeter.jsx';
import SearchScheduleSelector from '../../../shared/SearchScheduleSelector.jsx';
import TrustVerificationCard from './cards/TrustVerificationCard.jsx';
import AccountSettingsCard from './cards/AccountSettingsCard.jsx';
import { Calendar, Pencil } from 'lucide-react';

// ============================================================================
// PROFILE SIDEBAR
// ============================================================================

export default function ProfileSidebar({
  isEditorView,
  coverPhotoUrl,
  avatarUrl,
  firstName,
  lastName,
  jobTitle,
  profileStrength,
  verifications,
  onCoverPhotoChange,
  onAvatarChange,
  onStrengthClick,
  onVerifyEmail,
  onVerifyPhone,
  onVerifyGovId,
  onConnectLinkedIn,
  onEditPhone,
  emailAddress,
  phoneNumber,
  isVerifyingEmail,
  verificationEmailSent,
  // Schedule props (guest-only)
  selectedDays = [],
  onDayToggle,
  isHostUser = false,
  // Edit name props
  showEditNameIcon = false,
  onEditName,
  // Account settings (editor view)
  onOpenNotificationSettings,
  onChangePassword,
  // Public view specific
  responseTime,
  responseRate,
  memberSince
}) {
  const fullName = `${firstName} ${lastName}`.trim() || 'Your Name';

  // Format member since date
  const formatMemberSince = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const memberSinceFormatted = formatMemberSince(memberSince);

  return (
    <aside className="profile-sidebar">
      {/* Cover Photo */}
      <CoverPhotoEditor
        imageUrl={coverPhotoUrl}
        editable={isEditorView}
        onChange={onCoverPhotoChange}
      />

      {/* Avatar */}
      <div className="profile-avatar-container">
        <AvatarWithBadge
          imageUrl={avatarUrl}
          firstName={firstName}
          isEditorView={isEditorView}
          isVerified={verifications.govId}
          onChange={onAvatarChange}
        />
      </div>

      {/* Profile Info */}
      <div className="sidebar-profile-info">
        <h1 className="sidebar-profile-name">
          {fullName}
          {showEditNameIcon && (
            <button type="button" className="edit-name-btn" onClick={onEditName} aria-label="Edit name">
              <Pencil size={14} />
            </button>
          )}
        </h1>
        {jobTitle && <p className="sidebar-profile-title">{jobTitle}</p>}
      </div>

      {/* Editor View: Profile Strength Meter */}
      {isEditorView && (
        <ProfileStrengthMeter
          percentage={profileStrength}
          onClick={onStrengthClick}
          onInfoClick={() => setShowVerifications((prev) => !prev)}
        />
      )}

      {/* Public View: Stats */}
      {!isEditorView && (
        <div className="sidebar-stats">
          <div className="sidebar-stat-item">
            <div className="sidebar-stat-value">{responseTime || 'N/A'}</div>
            <div className="sidebar-stat-label">Response time</div>
          </div>
          <div className="sidebar-stat-item">
            <div className="sidebar-stat-value">{responseRate ? `${responseRate}%` : 'N/A'}</div>
            <div className="sidebar-stat-label">Response rate</div>
          </div>
        </div>
      )}

      {/* Schedule Selector - Editor View, Guest-only */}
      {isEditorView && !isHostUser && (
        <div className="sidebar-schedule-section">
          <SearchScheduleSelector
            initialSelection={selectedDays}
            onSelectionChange={onDayToggle}
            enablePersistence={true}
            updateUrl={false}
          />
        </div>
      )}

      {/* Trust & Verification - Editor View */}
      {isEditorView && (
        <div className="sidebar-verification-section">
          <TrustVerificationCard
            verifications={verifications}
            emailAddress={emailAddress}
            phoneNumber={phoneNumber}
            onVerifyEmail={onVerifyEmail}
            onVerifyPhone={onVerifyPhone}
            onVerifyGovId={onVerifyGovId}
            onConnectLinkedIn={onConnectLinkedIn}
            onEditPhone={onEditPhone}
            isVerifyingEmail={isVerifyingEmail}
            verificationEmailSent={verificationEmailSent}
            embedded={true}
          />
        </div>
      )}

      {/* Public View: Member Since */}
      {!isEditorView && memberSinceFormatted && (
        <div className="sidebar-member-since">
          <Calendar size={14} />
          <span className="sidebar-member-since-text">Member since {memberSinceFormatted}</span>
        </div>
      )}

      {/* Editor View: Account Settings (at bottom of sidebar) */}
      {isEditorView && (
        <AccountSettingsCard
          onOpenNotificationSettings={onOpenNotificationSettings}
          onChangePassword={onChangePassword}
        />
      )}
    </aside>
  );
}
