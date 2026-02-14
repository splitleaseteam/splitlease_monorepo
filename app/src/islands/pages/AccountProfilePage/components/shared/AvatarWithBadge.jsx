/**
 * AvatarWithBadge.jsx
 *
 * Avatar component with context-aware badge.
 * Editor View: Camera icon badge for uploading new photo
 * Public View: Verified checkmark badge (if user is verified)
 */

import { useRef } from 'react';
import { Camera, Check } from 'lucide-react';
import { getInitialsAvatarUrl, handleAvatarError } from '../../../../../lib/avatarUtils.js';

export default function AvatarWithBadge({
  imageUrl,
  firstName,
  isEditorView = false,
  isVerified = false,
  onChange
}) {
  const inputRef = useRef(null);

  const handleBadgeClick = (e) => {
    e.stopPropagation();
    if (isEditorView && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onChange) {
      onChange(file);
    }
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="profile-avatar-wrapper">
      {/* Avatar Image */}
      <img
        src={imageUrl || getInitialsAvatarUrl(firstName)}
        alt="Profile photo"
        className="profile-avatar-image"
        onError={handleAvatarError}
      />

      {/* Badge */}
      {isEditorView ? (
        // Editor View: Camera badge for upload
        <>
          <button
            type="button"
            className="profile-avatar-edit-badge"
            onClick={handleBadgeClick}
            aria-label="Change profile photo"
            title="Upload profile photo"
          >
            <Camera size={18} />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-label="Upload profile photo"
          />
        </>
      ) : isVerified ? (
        // Public View: Verified badge
        <div className="profile-avatar-verified-badge" title="Identity verified">
          <Check size={16} />
        </div>
      ) : null}
    </div>
  );
}
