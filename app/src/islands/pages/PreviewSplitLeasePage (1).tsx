/**
 * PreviewSplitLeasePage - Host Preview Mode
 * 
 * Allows hosts to preview their listing exactly as a guest would see it.
 * Uses the shared useViewSplitLeaseLogic hook with mode='preview'.
 * Adds edit affordances to all sections.
 * 
 * @component
 * @architecture Hollow Component Pattern (Shared)
 */

import React, { useState, useEffect } from 'react';
import { useViewSplitLeaseLogic } from './ViewSplitLeasePage/useViewSplitLeaseLogic';
import Header from '../shared/Header.jsx';
import Footer from '../shared/Footer.jsx';
import { PhotoGallery } from './ViewSplitLeasePage/components/PhotoGallery';
import { BookingWidget } from './ViewSplitLeasePage/components/BookingWidget';
import { ListingHeader } from './ViewSplitLeasePage/components/ListingHeader';
import { DescriptionSection } from './ViewSplitLeasePage/components/DescriptionSection';
import { AmenitiesGrid } from './ViewSplitLeasePage/components/AmenitiesGrid';
import { MapSection } from './ViewSplitLeasePage/components/MapSection';
import { HostInfoCard } from './ViewSplitLeasePage/components/HostInfoCard';
import styles from './PreviewSplitLeasePage.module.css';

// ============================================================================
// LOADING & ERROR STATES
// ============================================================================

function LoadingState() {
    return (
        <div className={styles.loadingStateContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading preview...</p>
        </div>
    );
}

function ErrorState({ message }) {
    return (
        <div className={styles.errorStateContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Preview Not Available</h2>
            <p className={styles.errorMessage}>{message}</p>
            <a href="/listings-overview.html" className={styles.errorButton}>
                Return to Listings
            </a>
        </div>
    );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function PreviewSplitLeasePage() {
    // Get listing ID from URL (e.g. ?id=123)
    const getPreviewListingId = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id') || params.get('listing_id');
    };

    const listingId = getPreviewListingId();

    // ==========================================================================
    // SHARED LOGIC
    // ==========================================================================

    const {
        // Data
        loading,
        error,
        listing,
        informationalTexts,

        // Auth
        isAuthenticated,
        authUserId,

        // Booking State
        selectedDayObjects,
        moveInDate,
        reservationSpan,

        // Computed
        minMoveInDate,
        priceBreakdown,
        validationErrors,
        formattedPrice,
        formattedStartingPrice,

        // UI State
        isMobile,
        shouldLoadMap,
        mapRef,

        // Handlers (reused/overridden)
        handleScheduleChange,
        handleMoveInDateChange,
        handleReservationSpanChange,
        handlePhotoClick,
        handleClosePhotoModal,
        showPhotoModal,
        currentPhotoIndex,
        handleLoadMap

    } = useViewSplitLeaseLogic({
        mode: 'preview',
        listingId
    });

    // ==========================================================================
    // PREVIEW-SPECIFIC STATE
    // ==========================================================================

    const [expandedSections, setExpandedSections] = useState({
        description: false,
        neighborhood: false,
        amenities: false
    });

    const [activeInfoTooltip, setActiveInfoTooltip] = useState(null);

    // Verify ownership (Client-side check only - RLS handles real security)
    const isOwner = listing && authUserId && listing.hostUser === authUserId;

    // ==========================================================================
    // HANDLERS
    // ==========================================================================

    const toggleSection = (sectionName) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    const handleEdit = (section) => {
        // In a real implementation, this would open the specific edit modal
        console.log(`Edit clicked for section: ${section}`);
        // Example: setEditModal(section);
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

    // Enforce ownership check if critical
    // if (!isOwner) return <ErrorState message="You do not have permission to preview this listing." />;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.previewBanner}>
                <span>Preview Mode - This is how guests see your listing</span>
                <a href="/listings-overview.html" className={styles.exitPreviewButton}>Exit Preview</a>
            </div>

            <Header />

            {/* Photo Gallery with Edit Overlay */}
            <div className={styles.editableSection}>
                <PhotoGallery
                    photos={listing.photos}
                    listingName={listing.Name}
                    onPhotoClick={handlePhotoClick}
                    currentIndex={currentPhotoIndex}
                    isModalOpen={showPhotoModal}
                    onCloseModal={handleClosePhotoModal}
                    isMobile={isMobile}
                />
                <button className={styles.editButtonOverlay} onClick={() => handleEdit('photos')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit Photos
                </button>
            </div>

            <div className={styles.contentGrid}>
                {/* Left Column: Listing Details */}
                <main className={styles.leftColumn}>

                    <div className={styles.editableSection}>
                        <ListingHeader
                            listing={listing}
                            isFavorited={false}
                            onToggleFavorite={() => { }}
                            onLocationClick={() => scrollToSection('map-section')}
                            isAuthenticated={isAuthenticated}
                            userId={authUserId}
                            onRequireAuth={undefined}
                        />
                        <button className={styles.editButtonInline} onClick={() => handleEdit('details')}>
                            Edit Details
                        </button>
                    </div>

                    <div className={styles.editableSection}>
                        <DescriptionSection
                            description={listing.Description}
                            isExpanded={expandedSections.description}
                            onToggle={() => toggleSection('description')}
                        />
                        <button className={styles.editButtonInline} onClick={() => handleEdit('description')}>
                            Edit Description
                        </button>
                    </div>

                    <div className={styles.editableSection}>
                        <AmenitiesGrid
                            amenities={listing.amenitiesInUnit}
                            safetyFeatures={listing.safetyFeatures}
                            isExpanded={expandedSections.amenities}
                            onToggle={() => toggleSection('amenities')}
                        />
                        <button className={styles.editButtonInline} onClick={() => handleEdit('amenities')}>
                            Edit Amenities
                        </button>
                    </div>

                    <div id="map-section" className={styles.editableSection}>
                        <MapSection
                            coordinates={listing.coordinates}
                            listingName={listing.Name}
                            neighborhood={listing.neighborhoodName}
                            shouldLoad={shouldLoadMap}
                            onLoadMap={handleLoadMap}
                            mapRef={mapRef}
                        />
                        <button className={styles.editButtonInline} onClick={() => handleEdit('location')}>
                            Edit Location
                        </button>
                    </div>

                    <div className={styles.editableSection}>
                        <HostInfoCard
                            host={listing.hostData}
                            onContactClick={() => { }}
                            isAuthenticated={isAuthenticated}
                        />
                        <button className={styles.editButtonInline} onClick={() => handleEdit('profile')}>
                            Edit Profile
                        </button>
                    </div>
                </main>

                {/* Right Column: Booking Widget (Read-Only) */}
                <aside className={styles.rightColumn}>
                    <div className={styles.bookingWidgetOverlayWrapper}>
                        <BookingWidget
                            listing={listing}
                            selectedDays={selectedDayObjects}
                            moveInDate={moveInDate}
                            reservationSpan={reservationSpan}
                            priceBreakdown={priceBreakdown}
                            minMoveInDate={minMoveInDate}
                            validationErrors={validationErrors}
                            isValid={false} // Disabled in preview
                            formattedPrice={formattedPrice}
                            formattedStartingPrice={formattedStartingPrice}
                            existingProposal={null}
                            onScheduleChange={handleScheduleChange}
                            onMoveInDateChange={handleMoveInDateChange}
                            onReservationSpanChange={handleReservationSpanChange}
                            onSubmit={() => { }} // Disabled
                        />
                        <div className={styles.disabledOverlay}>
                            <span>Booking controls disabled in preview</span>
                        </div>
                    </div>

                    <div className={styles.pricingEditSection}>
                        <h3>Pricing Settings</h3>
                        <button className={styles.editButtonFull} onClick={() => handleEdit('pricing')}>
                            Edit Pricing & Schedule
                        </button>
                    </div>
                </aside>
            </div>

            <Footer />
        </div>
    );
}
