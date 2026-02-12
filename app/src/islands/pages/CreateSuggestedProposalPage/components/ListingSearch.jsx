/**
 * ListingSearch - Step 1: Search and select a listing
 */

import { getFirstPhoto, getLastPhoto, getAddressString, getDefaultPhoto } from '../suggestedProposalService.js';

/**
 * Extract host name from listing data (joined with account_host and user)
 */
function getHostName(listing) {
  // Try joined user data first
  if (listing.account_host?.user?.first_name && listing.account_host?.user?.last_name) {
    return `${listing.account_host.user.first_name} ${listing.account_host.user.last_name}`;
  }
  // Fallback to denormalized field
  if (listing.host_display_name) {
    return listing.host_display_name;
  }
  return null;
}

/**
 * Extract host email from listing data (joined with account_host and user)
 */
function getHostEmail(listing) {
  // Try joined user data first
  if (listing.account_host?.user?.email) {
    return listing.account_host.user.email;
  }
  // Fallback to denormalized field
  if (listing['Host email']) {
    return listing['Host email'];
  }
  return null;
}

export default function ListingSearch({
  searchTerm,
  searchResults,
  selectedListing,
  listingPhotos,
  isSearching,
  onSearchChange,
  onSearchFocus,
  onSelect,
  onClear,
  onClearSearch
}) {
  return (
    <section className="csp-step-section">
      <div className="csp-section-header">
        <h2>Step 1: Select Listing</h2>
      </div>

      {/* Search Input */}
      <div className="csp-search-container">
        <label htmlFor="listingSearch">Filter by host</label>
        <div className="csp-search-input-wrapper">
          <input
            type="text"
            id="listingSearch"
            className="csp-search-input"
            placeholder="Search Host Name, email, listing name, unique id, rental type"
            value={searchTerm}
            onChange={onSearchChange}
            onFocus={onSearchFocus}
            disabled={!!selectedListing}
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
        {!selectedListing && (searchResults.length > 0 || isSearching) && (
          <div className="csp-search-results">
            {isSearching ? (
              <div className="csp-loading">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="csp-no-results">No listings found</div>
            ) : (
              searchResults.map(listing => {
                const isInactive = !listing.is_active;
                const isUnapproved = !listing.Approved;
                const hasWarnings = isInactive || isUnapproved;

                return (
                  <div
                    key={listing.id}
                    className={`csp-search-result-item ${hasWarnings ? 'csp-search-result-item--warning' : ''}`}
                    onClick={() => onSelect(listing)}
                  >
                    <img
                      src={getFirstPhoto(listing) || getDefaultPhoto()}
                      alt={listing.listing_title || 'Listing'}
                      className="csp-thumbnail"
                      onError={(e) => { e.target.src = getDefaultPhoto(); }}
                    />
                    <div className="csp-search-result-info">
                      <h4>
                        {getHostName(listing) || getHostEmail(listing) || 'Unknown Host'} - {listing.listing_title || 'Unnamed Listing'} - {listing.rental_type || 'Standard'} - {listing.maximum_weeks_per_stay ? `${listing.maximum_weeks_per_stay} weeks` : 'Every week'}
                      </h4>
                      <p className="csp-listing-details-row">unique id: {listing.id}</p>
                      <p className="csp-listing-details-row">host email: {getHostEmail(listing) || 'Not available'}</p>
                      {hasWarnings && (
                        <div className="csp-listing-warnings">
                          {isInactive && <span className="csp-warning-badge csp-warning-badge--inactive">Inactive</span>}
                          {isUnapproved && <span className="csp-warning-badge csp-warning-badge--unapproved">Unapproved</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected Listing Card */}
      {selectedListing && (() => {
        const isInactive = !selectedListing.is_active;
        const isUnapproved = !selectedListing.is_approved;
        const hasWarnings = isInactive || isUnapproved;
        const hostDisplay = getHostName(selectedListing) || getHostEmail(selectedListing) || 'Unknown';

        return (
          <div className={`csp-selected-item-card ${hasWarnings ? 'csp-selected-item-card--warning' : ''}`}>
            <div className="csp-item-photos">
              <img
                src={getFirstPhoto(selectedListing, listingPhotos) || getDefaultPhoto()}
                alt="Listing"
                className="csp-item-photo"
                onError={(e) => { e.target.src = getDefaultPhoto(); }}
              />
              <img
                src={getLastPhoto(selectedListing, listingPhotos) || getDefaultPhoto()}
                alt="Listing"
                className="csp-item-photo"
                onError={(e) => { e.target.src = getDefaultPhoto(); }}
              />
            </div>
            <div className="csp-item-details">
              <h3>{selectedListing.listing_title || 'Unnamed Listing'}</h3>
              <p className="csp-item-subtitle">{getAddressString(selectedListing)}</p>
              <p className="csp-item-meta">Host: {hostDisplay}</p>
              <div className="csp-badge-row">
                <span className="csp-badge">{selectedListing.rental_type || 'Standard'}</span>
                {isInactive && <span className="csp-warning-badge csp-warning-badge--inactive">Inactive</span>}
                {isUnapproved && <span className="csp-warning-badge csp-warning-badge--unapproved">Unapproved</span>}
              </div>
            </div>
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
          </div>
        );
      })()}
    </section>
  );
}
