/**
 * ModifyListingsPage - Admin tool for modifying listings
 *
 * Follows the Hollow Component Pattern - all business logic is in
 * useModifyListingsPageLogic.js, this component contains only JSX.
 */

import useModifyListingsPageLogic from './useModifyListingsPageLogic';
import { NavigationTabs, Alert } from './shared';
import {
  AddressSection,
  FeaturesSection,
  LeaseStylesSection,
  PhotosSection,
  RulesSection,
  ReviewsSection
} from './sections';
import {
  SearchOptimising,
  StatusSection,
  SpaceSnapshot,
  ListingPreview
} from './sidebar';
import AdminHeader from '../../shared/AdminHeader/AdminHeader';
import './ModifyListingsPage.css';


export default function ModifyListingsPage() {
  const logic = useModifyListingsPageLogic();

  // Show loading state
  if (logic.isLoading) {
    return (
      <div className="modify-listings-page">
        <AdminHeader />
        <Header />
        <div className="modify-listings-page__loading-container">
          <div className="modify-listings-page__spinner" />
          <p className="modify-listings-page__loading-text">Loading listing...</p>
        </div>
      </div>
    );
  }

  // Show search/select state when no listing loaded
  if (!logic.listing) {
    return (
      <div className="modify-listings-page">
        <AdminHeader />
        <Header />
        <div className="modify-listings-page__search-container">
          <h2 className="modify-listings-page__search-title">Modify Listings</h2>
          <p className="modify-listings-page__search-subtitle">
            Search for a listing by name or ID to begin editing.
          </p>

          {/* Search Input - matches CreateSuggestedProposal pattern */}
          <div className="modify-listings-page__search-input-wrapper">
            <SearchIcon className="modify-listings-page__search-icon" />
            <input
              type="text"
              value={logic.searchQuery}
              onChange={logic.handleSearchChange}
              onFocus={logic.handleSearchFocus}
              placeholder="Search by name, ID, host, or rental type..."
              className="modify-listings-page__search-input"
            />
            {logic.searchQuery && (
              <button
                type="button"
                onClick={logic.handleClearSearch}
                className="modify-listings-page__clear-search-btn"
                aria-label="Clear search"
              >
                Ã—
              </button>
            )}
            {logic.isSearching && <div className="modify-listings-page__mini-spinner" />}
          </div>

          {/* Search Results */}
          {logic.searchResults.length > 0 && (
            <div className="modify-listings-page__search-results">
              {logic.searchResults.map(result => (
                <button
                  key={result.id}
                  onClick={() => logic.selectSearchResult(result)}
                  className="modify-listings-page__search-result-item"
                >
                  <div className="modify-listings-page__search-result-main">
                    <span className="modify-listings-page__search-result-name">
                      {result.listing_title || 'Unnamed Listing'}
                    </span>
                    <span className="modify-listings-page__search-result-address">
                      {result.address_with_lat_lng_json?.address || 'No address'}
                    </span>
                  </div>
                  <div className="modify-listings-page__search-result-status">
                    <StatusBadge
                      label={result.is_approved ? 'Approved' : 'Pending'}
                      type={result.is_approved ? 'success' : 'warning'}
                    />
                    <StatusBadge
                      label={result.is_active ? 'Active' : 'Inactive'}
                      type={result.is_active ? 'success' : 'neutral'}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Error State */}
          {logic.error && (
            <div className="modify-listings-page__error-box">
              <p>{logic.error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render active section
  const renderSection = () => {
    const sectionProps = {
      listing: logic.listing,
      onUpdate: logic.updateListingData,
      isSaving: logic.isSaving,
      onSave: () => logic.saveSection(logic.activeSection),
      lastSaved: logic.lastSaved
    };

    switch (logic.activeSection) {
      case 'address':
        return <AddressSection {...sectionProps} />;
      case 'features':
        return (
          <FeaturesSection
            {...sectionProps}
            amenitiesInUnit={logic.amenitiesInUnit}
            amenitiesInBuilding={logic.amenitiesInBuilding}
          />
        );
      case 'leaseStyles':
        return <LeaseStylesSection {...sectionProps} />;
      case 'photos':
        return (
          <PhotosSection
            {...sectionProps}
            onUploadPhoto={logic.onUploadPhoto}
            onDeletePhoto={logic.onDeletePhoto}
          />
        );
      case 'rules':
        return (
          <RulesSection
            {...sectionProps}
            houseRules={logic.houseRules}
            cancellationPolicyOptions={logic.cancellationPolicyOptions}
          />
        );
      case 'reviews':
        return (
          <ReviewsSection
            {...sectionProps}
            safetyFeatures={logic.safetyFeatures}
          />
        );
      default:
        return <AddressSection {...sectionProps} />;
    }
  };

  return (
    <div className="modify-listings-page">
      <AdminHeader />
      <Header
        listingName={logic.listing?.listing_title}
        hasChanges={logic.hasUnsavedChanges}
        onSave={logic.saveChanges}
        onClear={logic.clearListing}
        isSaving={logic.isSaving}
      />

      {/* Alert */}
      {logic.alert && (
        <Alert
          type={logic.alert.type}
          message={logic.alert.message}
          onClose={logic.dismissAlert}
        />
      )}

      {/* Main Layout */}
      <div className="modify-listings-page__layout">
        {/* Left Sidebar - Navigation */}
        <div className="modify-listings-page__left-sidebar">
          <NavigationTabs
            sections={logic.sections}
            activeSection={logic.activeSection}
            onSectionChange={logic.setActiveSection}
            sectionStatus={logic.sectionStatus}
          />
        </div>

        {/* Main Content */}
        <div className="modify-listings-page__main-content">
          {renderSection()}
        </div>

        {/* Right Sidebar */}
        <div className="modify-listings-page__right-sidebar">
          <ListingPreview listing={logic.listing} />
          <StatusSection
            listing={logic.listing}
            onUpdate={logic.updateListingData}
            isProcessing={logic.isSaving}
          />
          <SpaceSnapshot listing={logic.listing} />
          <SearchOptimising listing={logic.listing} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function Header({ listingName, hasChanges, onSave, onClear, isSaving }) {
  return (
    <header className="modify-listings-page__header">
      <div className="modify-listings-page__header-left">
        <a href="/" className="modify-listings-page__logo">
          Split Lease
        </a>
        <span className="modify-listings-page__header-divider">/</span>
        <span className="modify-listings-page__header-title">Modify Listings</span>
        {listingName && (
          <>
            <span className="modify-listings-page__header-divider">/</span>
            <span className="modify-listings-page__listing-name">{listingName}</span>
          </>
        )}
        {hasChanges && (
          <span className="modify-listings-page__unsaved-badge">Unsaved changes</span>
        )}
      </div>
      <div className="modify-listings-page__header-right">
        {listingName && (
          <>
            <button
              onClick={onClear}
              className="modify-listings-page__header-btn modify-listings-page__header-btn--secondary"
            >
              Close Listing
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || !hasChanges}
              className="modify-listings-page__header-btn modify-listings-page__header-btn--primary"
            >
              {isSaving ? 'Saving...' : 'Save All'}
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function StatusBadge({ label, type }) {
  const typeClass = `modify-listings-page__status-badge--${type}`;
  return (
    <span className={`modify-listings-page__status-badge ${typeClass}`}>
      {label}
    </span>
  );
}

function SearchIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
