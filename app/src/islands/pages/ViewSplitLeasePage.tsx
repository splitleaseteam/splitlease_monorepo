/**
 * ViewSplitLeasePage - Hollow Component
 * 
 * Delegates all business logic to useViewSplitLeaseLogic hook.
 * UI-only component focused on rendering and user interactions.
 * 
 * @component
 * @architecture Hollow Component Pattern
 * @see useViewSplitLeaseLogic for business logic
 * @performance Components memoized to prevent unnecessary re-renders
 */

import { useState } from 'react';
import { useViewSplitLeaseLogic } from './ViewSplitLeasePage/useViewSplitLeaseLogic';
import Header from '../shared/Header';
import Footer from '../shared/Footer';
import CreateProposalFlowV2 from '../shared/CreateProposalFlowV2';
import ContactHostMessaging from '../shared/ContactHostMessaging';
import SignUpLoginModal from '../shared/AuthSignupLoginOAuthResetFlowModal';
import ProposalSuccessModal from '../modals/ProposalSuccessModal';
import { PhotoGallery } from './ViewSplitLeasePage/components/PhotoGallery';
import { BookingWidget } from './ViewSplitLeasePage/components/BookingWidget';
import { ListingHeader } from './ViewSplitLeasePage/components/ListingHeader';
import { DescriptionSection } from './ViewSplitLeasePage/components/DescriptionSection';
import { AmenitiesGrid } from './ViewSplitLeasePage/components/AmenitiesGrid';
import { MapSection } from './ViewSplitLeasePage/components/MapSection';
import { HostInfoCard } from './ViewSplitLeasePage/components/HostInfoCard';
import styles from './ViewSplitLeasePage.module.css';

// ============================================================================
// LOADING AND ERROR STATES
// ============================================================================

function LoadingState() {
    return (
        <div className={styles.loadingStateContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading listing...</p>
        </div>
    );
}

function ErrorState({ message }) {
    return (
        <div className={styles.errorStateContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Property Not Found</h2>
            <p className={styles.errorMessage}>
                {message || 'The property you are looking for does not exist or has been removed.'}
            </p>
            <a href="/search" className={styles.errorButton}>
                Browse All Listings
            </a>
        </div>
    );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ViewSplitLeasePage() {
    // ==========================================================================
    // BUSINESS LOGIC (via Hook)
    // ==========================================================================

    const {
        // Loading & Data
        loading,
        error,
        listing,
        zatConfig,
        informationalTexts,

        // Auth & User
        isAuthenticated,
        authUserId,
        loggedInUserData,
        isFavorited,
        existingProposalForListing,

        // Booking State
        selectedDayObjects,
        moveInDate,
        reservationSpan,

        // Computed Values
        minMoveInDate,
        priceBreakdown,
        validationErrors,
        isBookingValid,
        formattedPrice,
        formattedStartingPrice,

        // Modals
        isProposalModalOpen,
        showContactHostModal,
        showAuthModal,
        showPhotoModal,
        showSuccessModal,
        currentPhotoIndex,
        successProposalId,
        isSubmittingProposal,

        // UI State
        isMobile,
        shouldLoadMap,
        mapRef,

        // Handlers: Schedule
        handleScheduleChange,
        handleMoveInDateChange,
        handleReservationSpanChange,

        // Handlers: Modals
        handleOpenContactModal,
        handleCloseContactModal,
        handleOpenProposalModal,
        handleCloseProposalModal,
        handlePhotoClick,
        handleClosePhotoModal,
        handleCloseSuccessModal,

        // Handlers: Actions
        handleSubmitProposal,
        handleAuthSuccess,
        handleToggleFavorite,
        handleLoadMap,

        // Setters
        setShowAuthModal,
        setShouldLoadMap

    } = useViewSplitLeaseLogic({ mode: 'view' });

    // ==========================================================================
    // UI-ONLY STATE (Expandable sections, tooltips, etc.)
    // ==========================================================================

    const [expandedSections, setExpandedSections] = useState({
        description: false,
        neighborhood: false,
        amenities: false
    });

    const [activeInfoTooltip, setActiveInfoTooltip] = useState(null);

    // ==========================================================================
    // UI-ONLY HANDLERS
    // ==========================================================================

    const toggleSection = (sectionName) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // ==========================================================================
    // RENDER
    // ==========================================================================

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;
    if (!listing) return <ErrorState message="Listing not found" />;

    return (
        <div className={styles.pageContainer}>
            <Header />

            {/* Photo Gallery */}
            <PhotoGallery
                photos={listing.photos || []}
                listingName={listing.listing_title}
                onPhotoClick={handlePhotoClick}
                currentIndex={currentPhotoIndex}
                isModalOpen={showPhotoModal}
                onCloseModal={handleClosePhotoModal}
                isMobile={isMobile}
            />

            <div className={styles.contentGrid}>
                {/* Left Column: Listing Details */}
                <main className={styles.leftColumn}>
                    <ListingHeader
                        listing={listing}
                        isFavorited={isFavorited}
                        onToggleFavorite={handleToggleFavorite}
                        onLocationClick={() => scrollToSection('map-section')}
                        isAuthenticated={isAuthenticated}
                        userId={authUserId}
                        onRequireAuth={() => setShowAuthModal(true)}
                    />

                    <DescriptionSection
                        description={listing.listing_description}
                        isExpanded={expandedSections.description}
                        onToggle={() => toggleSection('description')}
                    />

                    <AmenitiesGrid
                        amenities={listing.amenitiesInUnit}
                        safetyFeatures={listing.safetyFeatures}
                        isExpanded={expandedSections.amenities}
                        onToggle={() => toggleSection('amenities')}
                    />

                    <div id="map-section">
                        <MapSection
                            coordinates={listing.coordinates}
                            listingName={listing.listing_title}
                            neighborhood={listing.neighborhoodName}
                            shouldLoad={shouldLoadMap}
                            onLoadMap={handleLoadMap}
                            mapRef={mapRef}
                        />
                    </div>

                    <HostInfoCard
                        host={listing.hostData}
                        onContactClick={handleOpenContactModal}
                        isAuthenticated={isAuthenticated}
                    />
                </main>

                {/* Right Column: Booking Widget */}
                <aside className={styles.rightColumn}>
                    <BookingWidget
                        listing={listing}
                        selectedDays={selectedDayObjects}
                        moveInDate={moveInDate}
                        reservationSpan={reservationSpan}
                        priceBreakdown={priceBreakdown}
                        minMoveInDate={minMoveInDate}
                        validationErrors={validationErrors}
                        isValid={isBookingValid}
                        formattedPrice={formattedPrice}
                        formattedStartingPrice={formattedStartingPrice}
                        existingProposal={existingProposalForListing}
                        onScheduleChange={handleScheduleChange}
                        onMoveInDateChange={handleMoveInDateChange}
                        onReservationSpanChange={handleReservationSpanChange}
                        onSubmit={handleOpenProposalModal}
                    />
                </aside>
            </div>

            {/* Modals */}
            {isProposalModalOpen && (
                <CreateProposalFlowV2
                    listing={listing}
                    moveInDate={moveInDate}
                    daysSelected={selectedDayObjects}
                    reservationSpan={reservationSpan}
                    pricingBreakdown={priceBreakdown}
                    zatConfig={zatConfig}
                    isFirstProposal={!loggedInUserData || !existingProposalForListing}
                    useFullFlow={true}
                    existingUserData={loggedInUserData ? {
                        needForSpace: loggedInUserData.needForSpace || '',
                        aboutYourself: loggedInUserData.aboutMe || '',
                        hasUniqueRequirements: !!loggedInUserData.specialNeeds,
                        uniqueRequirements: loggedInUserData.specialNeeds || ''
                    } : null}
                    onClose={handleCloseProposalModal}
                    onSubmit={handleSubmitProposal}
                    isSubmitting={isSubmittingProposal}
                />
            )}

            {showContactHostModal && (
                <ContactHostMessaging
                    isOpen={showContactHostModal}
                    listing={listing}
                    onClose={handleCloseContactModal}
                    onLoginRequired={() => setShowAuthModal(true)}
                />
            )}

            {showAuthModal && (
                <SignUpLoginModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    initialView="signup-step1"
                    onAuthSuccess={handleAuthSuccess}
                    defaultUserType="guest"
                    skipReload={true}
                />
            )}

            {showSuccessModal && (
                <ProposalSuccessModal
                    proposalId={successProposalId}
                    listingName={listing.listing_title}
                    hasSubmittedRentalApp={false}
                    onClose={handleCloseSuccessModal}
                />
            )}

            <Footer />
        </div>
    );
}
