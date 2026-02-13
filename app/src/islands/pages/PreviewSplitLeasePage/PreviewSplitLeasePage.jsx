/**
 * Preview Split Lease Page - Host Preview Mode
 * Based on ViewSplitLeasePage but designed for hosts to preview their listing
 * - No proposal creation functionality (booking widget is display-only)
 * - Edit buttons to invoke EditListingDetails component for each section
 * - Host-only access (should verify host owns the listing)
 *
 * Follows the Hollow Component Pattern: all logic lives in usePreviewSplitLeaseLogic.
 */

import Header from '../../shared/Header.jsx';
import Footer from '../../shared/Footer.jsx';
import { EditListingDetails } from '../../shared/EditListingDetails/EditListingDetails.jsx';
import { COLORS } from '../../../lib/constants.js';
import '../../../styles/listing-schedule-selector.css';

import { usePreviewSplitLeaseLogic } from './usePreviewSplitLeaseLogic.js';
import { LoadingState, ErrorState, HostPreviewBanner, EditSectionButton } from './PreviewHelpers.jsx';
import { PhotoGallery } from './PreviewGallery.jsx';
import { PreviewHeader } from './PreviewHeader.jsx';
import { PreviewDetails } from './PreviewDetails.jsx';
import { PreviewPricing } from './PreviewPricing.jsx';
import { PreviewPhotoModal } from './PreviewPhotoModal.jsx';

export default function PreviewSplitLeasePage() {
  const logic = usePreviewSplitLeaseLogic();

  // ============================================================================
  // LOADING / ERROR STATES
  // ============================================================================

  if (logic.loading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '70vh', paddingTop: 'calc(80px + 2rem)' }}>
          <LoadingState />
        </main>
        <Footer />
      </>
    );
  }

  if (logic.error || !logic.listing) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '70vh', paddingTop: 'calc(80px + 2rem)' }}>
          <ErrorState message={logic.error} />
        </main>
        <Footer />
      </>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <>
      <Header />

      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
        paddingTop: 'calc(100px + 2rem)',
        display: 'grid',
        gridTemplateColumns: logic.isMobile ? '1fr' : '1fr 440px',
        gap: '2rem'
      }}>

        {/* LEFT COLUMN - CONTENT */}
        <div className="left-column">

          {/* Host Preview Banner */}
          <HostPreviewBanner />

          {/* Photo Gallery */}
          <section style={{ marginBottom: '2rem' }}>
            {logic.listing.photos && logic.listing.photos.length > 0 ? (
              <PhotoGallery
                photos={logic.listing.photos}
                listingName={logic.listing.listing_title}
                onPhotoClick={logic.handlePhotoClick}
                onEdit={logic.handleOpenEditModal}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '400px',
                background: COLORS.BG_LIGHT,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.TEXT_LIGHT,
                gap: '12px'
              }}>
                <span>No images available</span>
                <EditSectionButton onClick={() => logic.handleOpenEditModal('photos')} label="Add Photos" />
              </div>
            )}
          </section>

          {/* Listing Header + Features Grid */}
          <PreviewHeader
            listing={logic.listing}
            handleOpenEditModal={logic.handleOpenEditModal}
            handleLocationClick={logic.handleLocationClick}
          />

          {/* Details: Description, Storage, Neighborhood, Commute, Amenities, Rules, Map, Cancellation */}
          <PreviewDetails
            listing={logic.listing}
            expandedSections={logic.expandedSections}
            toggleSection={logic.toggleSection}
            handleOpenEditModal={logic.handleOpenEditModal}
            commuteSectionRef={logic.commuteSectionRef}
            amenitiesSectionRef={logic.amenitiesSectionRef}
            houseRulesSectionRef={logic.houseRulesSectionRef}
            mapSectionRef={logic.mapSectionRef}
            mapRef={logic.mapRef}
            shouldLoadMap={logic.shouldLoadMap}
            mapListings={logic.mapListings}
          />
        </div>

        {/* RIGHT COLUMN - BOOKING WIDGET (Preview Only) */}
        <PreviewPricing
          listing={logic.listing}
          isMobile={logic.isMobile}
          nightsSelected={logic.nightsSelected}
          moveInDate={logic.moveInDate}
          setMoveInDate={logic.setMoveInDate}
          minMoveInDate={logic.minMoveInDate}
          scheduleSelectorListing={logic.scheduleSelectorListing}
          selectedDayObjects={logic.selectedDayObjects}
          reservationSpan={logic.reservationSpan}
          setReservationSpan={logic.setReservationSpan}
          zatConfig={logic.zatConfig}
          handleScheduleChange={logic.handleScheduleChange}
          handlePriceChange={logic.handlePriceChange}
        />
      </main>

      {/* Photo Modal */}
      <PreviewPhotoModal
        listing={logic.listing}
        isMobile={logic.isMobile}
        showPhotoModal={logic.showPhotoModal}
        currentPhotoIndex={logic.currentPhotoIndex}
        setCurrentPhotoIndex={logic.setCurrentPhotoIndex}
        setShowPhotoModal={logic.setShowPhotoModal}
      />

      {/* Edit Listing Details Modal */}
      {logic.editModalOpen && logic.listing && (
        <EditListingDetails
          listing={logic.listing}
          editSection={logic.editSection}
          focusField={logic.editFocusField}
          onClose={logic.handleCloseEditModal}
          onSave={logic.handleSaveEdit}
          updateListing={logic.handleUpdateListing}
        />
      )}

      <Footer />
    </>
  );
}
