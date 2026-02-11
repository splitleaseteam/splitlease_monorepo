import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import Header from '../../shared/Header';
import Footer from '../../shared/Footer';
import { EditListingDetails } from '../../shared/EditListingDetails/EditListingDetails';
import ScheduleCohost from '../../shared/ScheduleCohost/ScheduleCohost.jsx';
import ImportListingReviewsModal from '../../shared/ImportListingReviewsModal/ImportListingReviewsModal.jsx';
import AIImportAssistantModal from '../../shared/AIImportAssistantModal/AIImportAssistantModal.jsx';
import ReferralModal from '../AccountProfilePage/components/ReferralModal';
import { ListingDashboardProvider, useListingDashboard } from './context/ListingDashboardContext';
import NavigationHeader from './components/NavigationHeader.jsx';
import ActionCardGrid from './components/ActionCardGrid.jsx';
import AlertBanner from './components/AlertBanner.jsx';
import SecondaryActions from './components/SecondaryActions.jsx';
import PropertyInfoSection from './components/PropertyInfoSection.jsx';
import MiniPanels from './components/MiniPanels.jsx';
import DetailsSection from './components/DetailsSection.jsx';
import AmenitiesSection from './components/AmenitiesSection.jsx';
import DescriptionSection from './components/DescriptionSection.jsx';
import PricingSection from './components/PricingSection.jsx';
import RulesSection from './components/RulesSection.jsx';
import AvailabilitySection from './components/AvailabilitySection.jsx';
import CancellationPolicySection from './components/CancellationPolicySection.jsx';
import CollapsibleSection from './components/CollapsibleSection.jsx';
import '../../../styles/components/listing-dashboard.css';
import '../AccountProfilePage/AccountProfilePage.css'; // For ReferralModal styles

const PhotosSection = lazy(() => import('./components/PhotosSection.jsx'));
const InsightsPanel = lazy(() => import('./components/InsightsPanel.jsx'));
const PricingEditSection = lazy(() => import('./components/PricingEditSection.jsx'));

// Section completeness checks — expand only incomplete sections by default
function getSectionCompletion(listing) {
  return {
    description: !!(listing.description && listing.description.length > 20),
    amenities: (listing.inUnitAmenities?.length || 0) + (listing.buildingAmenities?.length || 0) > 0,
    details: !!(listing.features?.bedrooms && listing.features?.bathrooms),
    pricing: (listing.monthlyHostRate || 0) > 0 || (listing.weeklyHostRate || 0) > 0,
    rules: (listing.houseRules?.length || 0) > 0,
    availability: !!listing.earliestAvailableDate,
    photos: (listing.photos?.length || 0) >= 3,
    cancellation: !!listing.cancellationPolicy,
  };
}

// Inner component that uses context
function ListingDashboardContent() {
  const [showReferralModal, setShowReferralModal] = useState(false);
  const {
    listing,
    isLoading,
    error,
    editSection,
    showScheduleCohost,
    showImportReviews,
    currentUser,
    existingCohostRequest,
    handleCloseScheduleCohost,
    handleCohostRequestSubmitted,
    handleCloseImportReviews,
    handleSubmitImportReviews,
    isImportingReviews,
    showAIImportAssistant,
    handleCloseAIImportAssistant,
    handleAIImportComplete,
    handleStartAIGeneration,
    aiGenerationStatus,
    isAIGenerating,
    isAIComplete,
    aiGeneratedData,
    highlightedFields,
    handleCloseEdit,
    handleSaveEdit,
    updateListing,
    editFocusField,
  } = useListingDashboard();

  // Section completion — controls default collapsed/expanded state
  const completion = useMemo(() => listing ? getSectionCompletion(listing) : {}, [listing]);

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <div className="listing-dashboard">
          <div className="listing-dashboard__container">
            <div className="listing-dashboard__loading">
              <p>Loading listing...</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header />
        <div className="listing-dashboard">
          <div className="listing-dashboard__container">
            <div className="listing-dashboard__error">
              <p>Error: {error}</p>
              <button onClick={() => (window.location.href = '/host-overview')}>
                Go to My Listings
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // No listing found
  if (!listing) {
    return (
      <>
        <Header />
        <div className="listing-dashboard">
          <div className="listing-dashboard__container">
            <div className="listing-dashboard__not-found">
              <p>Listing not found</p>
              <button onClick={() => (window.location.href = '/host-dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="listing-dashboard">
        {/* Main Container */}
        <div className="listing-dashboard__container">
          <div className="listing-dashboard__card">
            {/* Navigation Header */}
            <NavigationHeader
              onInviteClick={() => setShowReferralModal(true)}
            />

            {/* Alert Banner - Schedule Cohost CTA */}
            <AlertBanner />

            {/* Action Cards Grid */}
            <ActionCardGrid />

            {/* Secondary Actions */}
            <SecondaryActions />

            {/* Property Info Section — always visible, not collapsible */}
            <div className={highlightedFields?.has('name') ? 'listing-dashboard-section--ai-highlighted' : ''}>
              <PropertyInfoSection />
            </div>

            <MiniPanels />

            {/* Insights Panel — suggestions to improve listing */}
            <CollapsibleSection
              listingId={listing.id}
              id="insights"
              title="\uD83D\uDCA1 Suggestions to improve your listing"
              defaultExpanded={false}
              unmountWhenCollapsed={true}
            >
              <Suspense fallback={<div className="listing-dashboard-section-loading">Loading...</div>}>
                <InsightsPanel />
              </Suspense>
            </CollapsibleSection>

            {/* Sections Grid — two-column on desktop */}
            <div className="listing-dashboard-sections-grid">
              {/* Description — full width */}
              <CollapsibleSection
                listingId={listing.id}
                id="description"
                title="Description"
                className="listing-dashboard-section--full-width"
                defaultExpanded={!completion.description}
                summary={
                  listing.description
                    ? listing.description.substring(0, 80) + (listing.description.length > 80 ? '...' : '')
                    : 'No description'
                }
              >
                <div className={
                  (highlightedFields?.has('description') || highlightedFields?.has('neighborhood'))
                    ? 'listing-dashboard-section--ai-highlighted'
                    : ''
                }>
                  <DescriptionSection />
                </div>
              </CollapsibleSection>

              {/* Amenities — pairs with Rules */}
              <CollapsibleSection
                listingId={listing.id}
                id="amenities"
                title="Amenities"
                defaultExpanded={!completion.amenities}
                summary={`${(listing.inUnitAmenities?.length || 0) + (listing.buildingAmenities?.length || 0)} amenities`}
              >
                <div className={highlightedFields?.has('amenities') ? 'listing-dashboard-section--ai-highlighted' : ''}>
                  <AmenitiesSection />
                </div>
              </CollapsibleSection>

              {/* Rules — pairs with Amenities */}
              <CollapsibleSection
                listingId={listing.id}
                id="rules"
                title="Rules"
                defaultExpanded={!completion.rules}
                summary={`${listing.houseRules?.length || 0} rules`}
              >
                <div className={
                  (highlightedFields?.has('rules') || highlightedFields?.has('safety'))
                    ? 'listing-dashboard-section--ai-highlighted'
                    : ''
                }>
                  <RulesSection />
                </div>
              </CollapsibleSection>

              {/* Details — pairs with Pricing */}
              <CollapsibleSection
                listingId={listing.id}
                id="details"
                title="Details"
                defaultExpanded={!completion.details}
                summary={`${listing.features?.bedrooms || 0} bed \u00B7 ${listing.features?.bathrooms || 0} bath${listing.features?.squareFootage ? ` \u00B7 ${listing.features.squareFootage} sqft` : ''}`}
              >
                <DetailsSection />
              </CollapsibleSection>

              {/* Pricing — pairs with Details */}
              <CollapsibleSection
                listingId={listing.id}
                id="pricing"
                title="Pricing & Lease Style"
                defaultExpanded={!completion.pricing}
                summary={
                  listing.monthlyHostRate > 0
                    ? `$${listing.monthlyHostRate}/mo`
                    : listing.weeklyHostRate > 0
                      ? `$${listing.weeklyHostRate}/wk`
                      : 'No pricing set'
                }
              >
                <PricingSection />
              </CollapsibleSection>

              {/* Availability — full width (calendar needs room) */}
              <CollapsibleSection
                listingId={listing.id}
                id="availability"
                title="Availability"
                className="listing-dashboard-section--full-width"
                defaultExpanded={false}
                unmountWhenCollapsed={true}
                summary={
                  listing.earliestAvailableDate
                    ? `Available ${new Date(listing.earliestAvailableDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${listing.leaseTermMin ? ` \u00B7 ${listing.leaseTermMin}-${listing.leaseTermMax || '?'} wk terms` : ''}`
                    : 'No availability set'
                }
              >
                <AvailabilitySection />
              </CollapsibleSection>

              {/* Photos — full width (grid needs room) */}
              <CollapsibleSection
                listingId={listing.id}
                id="photos"
                title="Photos"
                className="listing-dashboard-section--full-width"
                defaultExpanded={false}
                unmountWhenCollapsed={true}
                summary={`${listing.photos?.length || 0} photos`}
              >
                <Suspense fallback={<div className="listing-dashboard-section-loading">Loading...</div>}>
                  <PhotosSection />
                </Suspense>
              </CollapsibleSection>

              {/* Cancellation Policy — full width */}
              <CollapsibleSection
                listingId={listing.id}
                id="cancellation-policy"
                title="Cancellation Policy"
                className="listing-dashboard-section--full-width"
                defaultExpanded={!completion.cancellation}
                summary={listing.cancellationPolicy || 'Standard'}
              >
                <CancellationPolicySection />
              </CollapsibleSection>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Pricing Edit Section (Full-screen overlay) */}
      {editSection === 'pricing' && (
        <Suspense fallback={<div className="listing-dashboard-section-loading">Loading...</div>}>
          <PricingEditSection
            listing={listing}
            onClose={handleCloseEdit}
            onSave={async (updates) => {
              await updateListing(updates);
              handleSaveEdit(updates);
            }}
            isOwner={true}
          />
        </Suspense>
      )}

      {/* Edit Listing Details Modal */}
      {editSection && editSection !== 'pricing' && (
        <EditListingDetails
          focusField={editFocusField}
          listing={{
            _id: listing.id,
            Name: listing.title,
            Description: listing.listing_description,
            'Description - Neighborhood': listing.descriptionNeighborhood,
            'Location - Address': { address: listing.location?.address },
            'Location - City': listing.location?.city,
            'Location - State': listing.location?.state,
            'Location - Zip Code': listing.location?.zipCode,
            'Location - Borough': listing.location?.boroughDisplay,
            'Location - Hood': listing.location?.hoodsDisplay,
            'Features - Type of Space': listing.features?.typeOfSpace?.id,
            'Features - Qty Bedrooms': listing.features?.bedrooms,
            'Features - Qty Bathrooms': listing.features?.bathrooms,
            'Features - Qty Beds': listing.features?.bedrooms,
            'Features - Qty Guests': listing.maxGuests,
            'Features - SQFT Area': listing.features?.squareFootage,
            'Features - SQFT of Room': listing.features?.squareFootageRoom,
            'Kitchen Type': listing.features?.kitchenType?.id,
            'Features - Parking type': listing.features?.parkingType?.label,
            'Features - Secure Storage Option': listing.features?.storageType?.label,
            'Features - House Rules': listing.houseRules?.map(r => r.name) || [],
            'Features - Photos': listing.photos?.map(p => p.url) || [],
            'Features - Amenities In-Unit': listing.inUnitAmenities?.map(a => a.name) || [],
            'Features - Amenities In-Building': listing.buildingAmenities?.map(a => a.name) || [],
            'Features - Safety': listing.safetyFeatures?.map(s => s.name) || [],
            'First Available': listing.earliestAvailableDate,
            'Minimum Nights': listing.nightsPerWeekMin,
            'Maximum Nights': listing.nightsPerWeekMax,
            'Cancellation Policy': listing.cancellationPolicy,
          }}
          editSection={editSection}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
          updateListing={(id, updates) => updateListing(updates)}
        />
      )}

      {/* Schedule Cohost Modal */}
      {showScheduleCohost && (
        <ScheduleCohost
          userId={currentUser?.userId || currentUser?._id || currentUser?.id || ''}
          userEmail={currentUser?.email || ''}
          userName={currentUser?.firstName || currentUser?.name || ''}
          listingId={listing?.id}
          existingRequest={existingCohostRequest}
          onRequestSubmitted={handleCohostRequestSubmitted}
          onClose={handleCloseScheduleCohost}
        />
      )}

      {/* Import Listing Reviews Modal */}
      <ImportListingReviewsModal
        isOpen={showImportReviews}
        onClose={handleCloseImportReviews}
        onSubmit={handleSubmitImportReviews}
        currentUserEmail={currentUser?.email || ''}
        listingId={listing?.id}
        isLoading={isImportingReviews}
      />

      {/* AI Import Assistant Modal */}
      <AIImportAssistantModal
        isOpen={showAIImportAssistant}
        onClose={handleCloseAIImportAssistant}
        onComplete={handleAIImportComplete}
        generationStatus={aiGenerationStatus}
        isGenerating={isAIGenerating}
        isComplete={isAIComplete}
        generatedData={aiGeneratedData}
        onStartGeneration={handleStartAIGeneration}
      />

      {/* Referral Modal */}
      <ReferralModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        referralCode={currentUser?.userId || currentUser?._id || currentUser?.id || 'user'}
        userType="host"
        referrerName={currentUser?.first_name || currentUser?.firstName || currentUser?.name || ''}
      />
    </>
  );
}

// Main component with Provider
export default function ListingDashboardPage() {
  // Add body class for page-specific header styling
  useEffect(() => {
    document.body.classList.add('listing-dashboard-page');
    return () => {
      document.body.classList.remove('listing-dashboard-page');
    };
  }, []);

  return (
    <ListingDashboardProvider>
      <ListingDashboardContent />
    </ListingDashboardProvider>
  );
}
