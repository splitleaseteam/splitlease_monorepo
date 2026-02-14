/**
 * GuestSearch - Step 2: Search and select a guest
 */

import { getInitialsAvatarUrl, handleAvatarError } from '../../../../lib/avatarUtils.js';

export default function GuestSearch({
  searchTerm,
  searchResults,
  selectedGuest,
  existingProposalsCount,
  isConfirmed,
  isSearching,
  onSearchChange,
  onSearchFocus,
  onSelect,
  onConfirm,
  onClear,
  onClearSearch
}) {
  const guestName = (selectedGuest?.first_name && selectedGuest?.last_name ? `${selectedGuest.first_name} ${selectedGuest.last_name}` : null) || selectedGuest?.first_name || 'Unknown';
  const guestFirstName = selectedGuest?.first_name || guestName;

  return (
    <section className="csp-step-section">
      <div className="csp-section-header">
        <h2>Step 2: Select Guest</h2>
      </div>

      {/* Search Input */}
      <div className="csp-search-container">
        <label htmlFor="guestSearch">Filter by Guest</label>
        <div className="csp-search-input-wrapper">
          <input
            type="text"
            id="guestSearch"
            className="csp-search-input"
            placeholder="Search Guest Name, email, phone number, unique ID"
            value={searchTerm}
            onChange={onSearchChange}
            onFocus={onSearchFocus}
            disabled={!!selectedGuest}
          />
          {searchTerm && (
            <button
              className="csp-btn-clear-search"
              onClick={onClearSearch}
              title="Clear"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {/* Search Results - Show whenever there are results and no selection */}
        {!selectedGuest && (searchResults.length > 0 || isSearching) && (
          <div className="csp-search-results">
            {isSearching ? (
              <div className="csp-loading">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="csp-no-results">No guests found</div>
            ) : (
              searchResults.map(guest => (
                <div
                  key={guest.id}
                  className="csp-search-result-item"
                  onClick={() => onSelect(guest)}
                >
                  <img
                    src={guest.profile_photo_url || getInitialsAvatarUrl(guest.first_name || 'Guest')}
                    alt={(guest.first_name && guest.last_name ? `${guest.first_name} ${guest.last_name}` : null) || 'Guest'}
                    className="csp-thumbnail csp-user-thumbnail"
                    onError={handleAvatarError}
                  />
                  <div className="csp-search-result-info">
                    <h4>{(guest.first_name && guest.last_name ? `${guest.first_name} ${guest.last_name}` : null) || guest.first_name || 'Unknown'}</h4>
                    <p>{guest.email || ''}</p>
                    <p>{guest.phone_number || ''}</p>
                    <p className="csp-listing-details-row">unique id: {guest.id}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Guest Card */}
      {selectedGuest && (
        <div className="csp-selected-item-card">
          {/* Always show remove button in top-right corner */}
          <button
            className="csp-btn-remove"
            onClick={onClear}
            title="Remove selection"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="csp-user-avatar">
            <img
              src={selectedGuest.profile_photo_url || getInitialsAvatarUrl(guestName)}
              alt={guestName}
              onError={handleAvatarError}
            />
          </div>
          <div className="csp-item-details">
            <h3>{guestName}</h3>
            <p className="csp-item-subtitle">{selectedGuest.email || ''}</p>
            <p className="csp-item-meta">{selectedGuest.phone_number || ''}</p>
            {selectedGuest.current_user_role && (
              <span className="csp-badge">{selectedGuest.current_user_role}</span>
            )}
          </div>

          {!isConfirmed && !existingProposalsCount && (
            <button
              className="csp-btn-select-user"
              onClick={onConfirm}
            >
              Select User
            </button>
          )}
        </div>
      )}

      {/* Existing Proposals Warning */}
      {selectedGuest && existingProposalsCount > 0 && (
        <div className="csp-warning-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Select Another User, {guestFirstName} already has a proposal for the listing selected</span>
        </div>
      )}
    </section>
  );
}
