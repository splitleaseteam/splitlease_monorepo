/**
 * VerifyUsersPage - Admin tool for verifying user identity documents
 *
 * Hollow component pattern: All logic is in useVerifyUsersPageLogic.js
 * This component only handles rendering.
 *
 * Features:
 * - Search users by email or name
 * - View verification documents (profile photo, selfie, ID front/back)
 * - Toggle verification status
 * - Image modal for full-size document review
 * - Responsive design for desktop and mobile
 */

import useVerifyUsersPageLogic from './useVerifyUsersPageLogic.js';
import AdminHeader from '../shared/AdminHeader/AdminHeader';
import './VerifyUsersPage.css';

export default function VerifyUsersPage() {
  const {
    // User selection state
    selectedUser,
    searchQuery,
    searchResults,
    isSearching,
    isDropdownOpen,
    dropdownRef,

    // Verification state
    isProcessing,

    // Image modal state
    modalImage,

    // Loading/error state
    loading,
    error,

    // User selection handlers
    handleSelectUser,
    clearSelection,
    handleSearchChange,
    handleDropdownToggle,
    setIsDropdownOpen,

    // Verification handlers
    toggleVerification,

    // Image modal handlers
    openImageModal,
    closeImageModal,
    openImageExternal,

    // Computed values
    getCompletenessColor,
    documentSections,
  } = useVerifyUsersPageLogic();

  return (
    <div className="verify-users-page">
      <AdminHeader />
      {/* Header */}
      <header className="verify-users-header">
        <h1 className="verify-users-title">User Verification</h1>
        <p className="verify-users-subtitle">
          Verify user identity by reviewing their submitted documents
        </p>
      </header>

      {/* Main Content */}
      <main className="verify-users-main">
        {/* User Selection */}
        <UserSelect
          selectedUser={selectedUser}
          searchQuery={searchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          isDropdownOpen={isDropdownOpen}
          dropdownRef={dropdownRef}
          onSearchChange={handleSearchChange}
          onDropdownToggle={handleDropdownToggle}
          onSelectUser={handleSelectUser}
          onClear={clearSelection}
          setIsDropdownOpen={setIsDropdownOpen}
        />

        {/* Identity Verification Container - Only shown when user is selected */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : selectedUser ? (
          <IdentityVerificationContainer
            user={selectedUser}
            isProcessing={isProcessing}
            onToggleVerification={toggleVerification}
            onImageClick={openImageModal}
            documentSections={documentSections}
            getCompletenessColor={getCompletenessColor}
          />
        ) : (
          <EmptyState />
        )}

        {/* Instructions */}
        <Instructions />
      </main>

      {/* Footer */}
      <footer className="verify-users-footer">
        <p className="verify-users-footer-text">
          Split Lease Admin Dashboard - Internal Use Only
        </p>
      </footer>

      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          imageUrl={modalImage.url}
          title={modalImage.title}
          onClose={closeImageModal}
          onOpenExternal={() => openImageExternal(modalImage.url)}
        />
      )}
    </div>
  );
}

// ===== USER SELECT COMPONENT =====

function UserSelect({
  selectedUser,
  searchQuery,
  searchResults,
  isSearching,
  isDropdownOpen,
  dropdownRef,
  onSearchChange,
  onDropdownToggle,
  onSelectUser,
  onClear,
  setIsDropdownOpen,
}) {
  return (
    <div className="verify-users-select-container">
      <h2 className="verify-users-section-title">Select User</h2>

      <div className="verify-users-select-row">
        {/* Email Input Field */}
        <div className="verify-users-email-container">
          <input
            type="text"
            placeholder="Type user's email"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsDropdownOpen(true)}
            className="verify-users-email-input"
            disabled={!!selectedUser}
          />
        </div>

        {/* User Dropdown Selector */}
        <div className="verify-users-dropdown-container" ref={dropdownRef}>
          <div
            onClick={onDropdownToggle}
            className={`verify-users-dropdown-trigger ${isDropdownOpen ? 'verify-users-dropdown-trigger--active' : ''}`}
            tabIndex={0}
          >
            <span className={selectedUser ? 'verify-users-dropdown-text--selected' : 'verify-users-dropdown-text--placeholder'}>
              {selectedUser
                ? `${selectedUser.fullName} - ${selectedUser.email}`
                : 'Choose an option...'}
            </span>
            <ChevronIcon isOpen={isDropdownOpen} />
          </div>

          {/* Dropdown List */}
          {isDropdownOpen && (
            <div className="verify-users-dropdown-list">
              {isSearching ? (
                <div className="verify-users-dropdown-loading">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <UserDropdownItem
                    key={user._id}
                    user={user}
                    isSelected={selectedUser?._id === user._id}
                    onSelect={onSelectUser}
                  />
                ))
              ) : (
                <div className="verify-users-dropdown-empty">No users found</div>
              )}
            </div>
          )}
        </div>

        {/* Clear Selection Button */}
        {selectedUser && (
          <button onClick={onClear} className="verify-users-clear-button">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function UserDropdownItem({ user, isSelected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(user)}
      className={`verify-users-dropdown-item ${isSelected ? 'verify-users-dropdown-item--selected' : ''}`}
    >
      <div className="verify-users-dropdown-item-content">
        {user.profilePhoto ? (
          <img
            src={user.profilePhoto}
            alt={user.fullName}
            className="verify-users-dropdown-avatar"
          />
        ) : (
          <div className="verify-users-dropdown-avatar-placeholder">
            <span className="verify-users-dropdown-avatar-initial">
              {user.fullName?.charAt(0) || '?'}
            </span>
          </div>
        )}
        <div>
          <p className="verify-users-dropdown-item-name">{user.fullName}</p>
          <p className="verify-users-dropdown-item-email">{user.email}</p>
        </div>
        {user.isVerified && (
          <span className="verify-users-verified-badge">Verified</span>
        )}
      </div>
    </div>
  );
}

// ===== IDENTITY VERIFICATION CONTAINER =====

function IdentityVerificationContainer({
  user,
  isProcessing,
  onToggleVerification,
  onImageClick,
  documentSections,
  getCompletenessColor,
}) {
  return (
    <div className="verify-users-verification-container">
      <h2 className="verify-users-verification-title">Identity Verification</h2>

      <div className="verify-users-verification-content">
        {/* Image Grid - 2x2 layout */}
        <div className="verify-users-image-grid">
          {documentSections.map((section) => (
            <ImageCard
              key={section.key}
              imageUrl={user[section.key]}
              label={`${user.fullName}'s ${section.label}`}
              title={section.title}
              userName={user.fullName}
              onClick={onImageClick}
            />
          ))}
        </div>

        {/* Verification Toggle - Right side */}
        <div className="verify-users-toggle-section">
          <VerificationToggle
            isVerified={user.isVerified}
            onToggle={onToggleVerification}
            disabled={isProcessing}
          />
          {isProcessing && (
            <p className="verify-users-processing-text">Processing...</p>
          )}
        </div>
      </div>

      {/* User Info Summary */}
      <div className="verify-users-summary">
        <div className="verify-users-summary-item">
          <span className="verify-users-summary-label">Email:</span> {user.email}
        </div>
        <div className="verify-users-summary-item">
          <span className="verify-users-summary-label">Phone:</span>{' '}
          {user.phoneNumber || 'Not provided'}
        </div>
        <div className="verify-users-summary-item">
          <span className="verify-users-summary-label">Profile Completeness:</span>{' '}
          <span style={{ color: getCompletenessColor(user.profileCompleteness || 0) }}>
            {user.profileCompleteness || 0}%
          </span>
        </div>
        <div className="verify-users-summary-item">
          <span className="verify-users-summary-label">Tasks Completed:</span>{' '}
          {user.tasksCompleted?.length > 0
            ? user.tasksCompleted.join(', ')
            : 'None'}
        </div>
      </div>
    </div>
  );
}

function ImageCard({ imageUrl, label, title, userName, onClick }) {
  const handleClick = () => {
    if (imageUrl) {
      onClick(imageUrl, `${userName}'s ${title}`);
    }
  };

  return (
    <div className="verify-users-image-card-container">
      <label className="verify-users-image-card-label">{label}</label>
      <div
        onClick={handleClick}
        className={`verify-users-image-card ${imageUrl ? 'verify-users-image-card--with-image' : 'verify-users-image-card--empty'}`}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={label}
              className="verify-users-image-card-img"
            />
            <div className="verify-users-image-card-overlay">
              <span className="verify-users-image-card-overlay-text">Click to view</span>
            </div>
          </>
        ) : (
          <div className="verify-users-image-card-placeholder">
            <ImagePlaceholderIcon />
            <span className="verify-users-placeholder-text">No image available</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== VERIFICATION TOGGLE =====

function VerificationToggle({ isVerified, onToggle, disabled }) {
  const buttonClasses = [
    'verify-users-toggle-button',
    isVerified ? 'verify-users-toggle-button--active' : 'verify-users-toggle-button--inactive',
    disabled ? 'verify-users-toggle-button--disabled' : '',
  ].filter(Boolean).join(' ');

  const knobClasses = [
    'verify-users-toggle-knob',
    isVerified ? 'verify-users-toggle-knob--active' : 'verify-users-toggle-knob--inactive',
  ].join(' ');

  const statusClasses = [
    'verify-users-toggle-status',
    isVerified ? 'verify-users-toggle-status--verified' : 'verify-users-toggle-status--not-verified',
  ].join(' ');

  return (
    <div className="verify-users-toggle-container">
      <label className="verify-users-toggle-label">User Verified?</label>
      <button
        type="button"
        onClick={() => !disabled && onToggle(!isVerified)}
        disabled={disabled}
        className={buttonClasses}
        role="switch"
        aria-checked={isVerified}
      >
        <span className={knobClasses} />
      </button>
      <span className={statusClasses}>
        {isVerified ? 'Verified' : 'Not Verified'}
      </span>
    </div>
  );
}

// ===== IMAGE MODAL =====

function ImageModal({ imageUrl, title, onClose, onOpenExternal }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="verify-users-modal-overlay" onClick={handleBackdropClick}>
      <div className="verify-users-modal-content">
        {/* Header */}
        <div className="verify-users-modal-header">
          <h3 className="verify-users-modal-title">{title}</h3>
          <div className="verify-users-modal-actions">
            <button
              onClick={onOpenExternal}
              className="verify-users-modal-icon-button"
              title="Open in new tab"
            >
              <ExternalLinkIcon />
            </button>
            <button
              onClick={onClose}
              className="verify-users-modal-icon-button"
              title="Close"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="verify-users-modal-image-container">
          <img
            src={imageUrl}
            alt={title}
            className="verify-users-modal-image"
          />
        </div>
      </div>
    </div>
  );
}

// ===== STATE COMPONENTS =====

function LoadingState() {
  return (
    <div className="verify-users-state-container">
      <div className="verify-users-spinner" />
      <span>Loading user...</span>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="verify-users-error-container">
      <span>{message}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="verify-users-empty-container">
      <UserIcon />
      <h3 className="verify-users-empty-title">No User Selected</h3>
      <p className="verify-users-empty-text">
        Search for a user by email or select from the dropdown above to begin verification
      </p>
    </div>
  );
}

function Instructions() {
  return (
    <div className="verify-users-instructions">
      <h4 className="verify-users-instructions-title">Verification Instructions</h4>
      <ul className="verify-users-instructions-list">
        <li>1. Select a user from the dropdown or search by email address</li>
        <li>2. Review all four identity documents (profile photo, selfie with ID, front and back of government ID)</li>
        <li>3. Click on any image to view it in full size</li>
        <li>4. Once verified, toggle the &quot;User Verified?&quot; switch to ON</li>
        <li>5. The system will automatically update the user&apos;s profile and send notifications</li>
      </ul>
    </div>
  );
}

// ===== ICONS =====

function ChevronIcon({ isOpen }) {
  return (
    <svg
      className={`verify-users-chevron-icon ${isOpen ? 'verify-users-chevron-icon--open' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      className="verify-users-user-icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg
      className="verify-users-placeholder-icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
