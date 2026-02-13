/**
 * PreviewPhotoModal - Fullscreen photo viewer modal for PreviewSplitLeasePage
 */

import { COLORS } from '../../../lib/constants.js';

export function PreviewPhotoModal({
  listing,
  isMobile,
  showPhotoModal,
  currentPhotoIndex,
  setCurrentPhotoIndex,
  setShowPhotoModal
}) {
  if (!showPhotoModal || !listing.photos || listing.photos.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '1rem' : '2rem'
      }}
      onClick={() => setShowPhotoModal(false)}
    >
      <button
        onClick={() => setShowPhotoModal(false)}
        style={{
          position: 'absolute',
          top: isMobile ? '1rem' : '2rem',
          right: isMobile ? '1rem' : '2rem',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          fontSize: '2rem',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002
        }}
      >
        x
      </button>

      <img
        src={listing.photos[currentPhotoIndex]?.Photo}
        alt={`${listing.listing_title} - photo ${currentPhotoIndex + 1}`}
        style={{
          maxWidth: isMobile ? '95vw' : '90vw',
          maxHeight: isMobile ? '75vh' : '80vh',
          objectFit: 'contain',
          marginBottom: isMobile ? '6rem' : '5rem'
        }}
        onClick={(e) => e.stopPropagation()}
      />

      <div style={{
        position: 'absolute',
        bottom: isMobile ? '4rem' : '5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: isMobile ? '0.5rem' : '1.5rem',
        alignItems: 'center',
        zIndex: 1001
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : listing.photos.length - 1));
          }}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Previous
        </button>

        <span style={{ color: 'white', fontSize: '0.875rem' }}>
          {currentPhotoIndex + 1} / {listing.photos.length}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentPhotoIndex(prev => (prev < listing.photos.length - 1 ? prev + 1 : 0));
          }}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Next
        </button>
      </div>

      <button
        onClick={() => setShowPhotoModal(false)}
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          border: 'none',
          color: COLORS.TEXT_DARK,
          padding: '0.75rem 2.5rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          zIndex: 1001
        }}
      >
        Close
      </button>
    </div>
  );
}
