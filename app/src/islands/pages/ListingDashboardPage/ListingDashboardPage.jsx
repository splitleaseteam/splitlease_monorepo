import { useState, useEffect, lazy, Suspense } from 'react';
import Header from '../../shared/Header';
import Footer from '../../shared/Footer';
import { EditListingDetails } from '../../shared/EditListingDetails/EditListingDetails';
import ScheduleCohost from '../../shared/ScheduleCohost/ScheduleCohost.jsx';
import ImportListingReviewsModal from '../../shared/ImportListingReviewsModal/ImportListingReviewsModal.jsx';
import AIImportAssistantModal from '../../shared/AIImportAssistantModal/AIImportAssistantModal.jsx';
import ReferralModal from '../AccountProfilePage/components/ReferralModal';
import { ListingDashboardProvider, useListingDashboard } from './context/ListingDashboardContext';
import NavigationHeader from './components/NavigationHeader.jsx';
import AlertBanner from './components/AlertBanner.jsx';
import ListingHeader from './components/ListingHeader.jsx';
import SectionTabs from './components/SectionTabs.jsx';
import ListingDetailsTab from './components/tabs/ListingDetailsTab.jsx';
import PricingCalendarTab from './components/tabs/PricingCalendarTab.jsx';
import MediaPoliciesTab from './components/tabs/MediaPoliciesTab.jsx';
import '../../../styles/components/listing-dashboard.css';
import '../AccountProfilePage/AccountProfilePage.css'; // For ReferralModal styles

const PricingEditSection = lazy(() => import('./components/PricingEditSection.jsx'));

const SECTION_TABS = [
  { id: 'listing', label: 'Listing Details' },
  { id: 'pricing', label: 'Pricing & Calendar' },
  { id: 'media', label: 'Media & Policies' },
];

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

  // Tab state with localStorage persistence
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('ld-active-tab') || 'listing';
    } catch {
      return 'listing';
    }
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    try {
      localStorage.setItem('ld-active-tab', tabId);
    } catch (e) { console.warn('Failed to save active tab to localStorage:', e); }
  };

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

            {/* NEW: Listing Header (Title + Status + Actions) */}
            <ListingHeader />

            {/* Section Tabs */}
            <SectionTabs
              tabs={SECTION_TABS}
              activeTab={activeTab}
              onChange={handleTabChange}
              renderPanel={(tab) => {
                switch (tab.id) {
                  case 'listing': return <ListingDetailsTab />;
                  case 'pricing': return <PricingCalendarTab />;
                  case 'media': return <MediaPoliciesTab />;
                  default: return null;
                }
              }}
            />
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
            id: listing.id,
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
          userId={currentUser?.userId || currentUser?.id || ''}
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
        referralCode={currentUser?.userId || currentUser?.id || 'user'}
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
