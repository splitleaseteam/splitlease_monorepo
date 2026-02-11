import { useState, useEffect, useRef, useCallback } from 'react';
import { useListingDashboard } from '../context/ListingDashboardContext';
import { ChevronLeftIcon, ChevronRightIcon } from './icons.jsx';

// Icons
const StarIcon = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? '#f59e0b' : 'none'}
    stroke={filled ? '#f59e0b' : '#374151'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}
    className="photo-action-icon"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#374151"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}
    className="photo-action-icon"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const DragHandleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="5" r="1" fill="currentColor" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="19" r="1" fill="currentColor" />
    <circle cx="15" cy="5" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="19" r="1" fill="currentColor" />
  </svg>
);

// Lightbox-specific icon (not shared — unique close X)
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function PhotoLightbox({ photos, index, onClose, getImageUrl }) {
  const [currentIndex, setCurrentIndex] = useState(index);
  const closeRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Focus close button on mount
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Keyboard navigation + focus trap
  useEffect(() => {
    const focusable = [prevRef.current, closeRef.current, nextRef.current].filter(Boolean);
    const handleKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight') { goNext(); return; }
      if (e.key === 'ArrowLeft') { goPrev(); return; }
      if (e.key === 'Tab' && focusable.length > 0) {
        const currentIdx = focusable.indexOf(document.activeElement);
        if (e.shiftKey) {
          e.preventDefault();
          focusable[currentIdx <= 0 ? focusable.length - 1 : currentIdx - 1]?.focus();
        } else {
          e.preventDefault();
          focusable[currentIdx >= focusable.length - 1 ? 0 : currentIdx + 1]?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const photo = photos[currentIndex];
  const imageUrl = getImageUrl(photo);

  return (
    <div
      className="listing-dashboard-lightbox"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      {/* Close button */}
      <button
        ref={closeRef}
        className="listing-dashboard-lightbox__close"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <CloseIcon />
      </button>

      {/* Previous */}
      {photos.length > 1 && (
        <button
          ref={prevRef}
          className="listing-dashboard-lightbox__nav listing-dashboard-lightbox__nav--prev"
          onClick={goPrev}
          aria-label="Previous photo"
        >
          <ChevronLeftIcon size={32} />
        </button>
      )}

      {/* Photo */}
      <div className="listing-dashboard-lightbox__content">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={photo.photoType || `Photo ${currentIndex + 1}`}
            className="listing-dashboard-lightbox__image"
          />
        ) : (
          <p className="listing-dashboard-lightbox__no-image">No image available</p>
        )}
        <div className="listing-dashboard-lightbox__info">
          <span className="listing-dashboard-lightbox__counter">
            {currentIndex + 1} of {photos.length}
          </span>
          {photo.photoType && (
            <span className="listing-dashboard-lightbox__type">{photo.photoType}</span>
          )}
        </div>
      </div>

      {/* Next */}
      {photos.length > 1 && (
        <button
          ref={nextRef}
          className="listing-dashboard-lightbox__nav listing-dashboard-lightbox__nav--next"
          onClick={goNext}
          aria-label="Next photo"
        >
          <ChevronRightIcon size={32} />
        </button>
      )}
    </div>
  );
}

const PHOTO_TYPES = [
  'Dining Room',
  'Bathroom',
  'Bedroom',
  'Kitchen',
  'Living Room',
  'Workspace',
  'Other',
];

export default function PhotosSection() {
  // Get data and handlers from context (migrated from props pattern)
  const {
    listing,
    handleEditSection,
    handleSetCoverPhoto,
    handleDeletePhoto,
    handleReorderPhotos,
  } = useListingDashboard();

  const photos = listing?.photos || [];

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [keyboardDragIndex, setKeyboardDragIndex] = useState(null);
  const cardRefs = useRef([]);

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay to allow the drag image to be captured
    setTimeout(() => {
      e.target.closest('.listing-dashboard-photos__card')?.classList.add('listing-dashboard-photos__card--dragging');
    }, 0);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the card entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Call the reorder handler
    if (handleReorderPhotos) {
      handleReorderPhotos(draggedIndex, dropIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = (e) => {
    e.target.closest('.listing-dashboard-photos__card')?.classList.remove('listing-dashboard-photos__card--dragging');
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleCardKeyDown = (event, index) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();

      if (keyboardDragIndex === null) {
        setKeyboardDragIndex(index);
      } else {
        setKeyboardDragIndex(null);
      }
      return;
    }

    if (keyboardDragIndex === null) {
      return;
    }

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    const targetIndex = keyboardDragIndex + direction;

    if (targetIndex < 0 || targetIndex >= photos.length) {
      return;
    }

    handleReorderPhotos?.(keyboardDragIndex, targetIndex);
    setKeyboardDragIndex(targetIndex);

    window.requestAnimationFrame(() => {
      cardRefs.current[targetIndex]?.focus();
    });
  };

  // Helper to get a valid image URL
  const getImageUrl = (photo) => {
    // Handle different photo URL formats
    const url = photo?.url || photo?.Photo || photo?.URL || '';
    if (!url) return null;
    // If it's already a full URL, use it
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      return url;
    }
    return url;
  };

  // Handle image load error
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.parentElement.classList.add('listing-dashboard-photos__image-error');
  };

  return (
    <div id="photos" className="listing-dashboard-section">
      {/* Section Header */}
      <div className="listing-dashboard-section__header">
        <h2 className="listing-dashboard-section__title">Photos</h2>
        <button
          className="listing-dashboard-section__add-btn"
          onClick={() => handleEditSection('photos')}
        >
          Add Photos
        </button>
      </div>

      {/* Drag hint */}
      {photos.length > 1 && (
        <p className="listing-dashboard-photos__hint">
          Drag and drop photos to reorder. First photo is the cover photo.
        </p>
      )}
      {photos.length > 1 && (
        <p className="sr-only" aria-live="polite">
          Keyboard reorder available. Focus a photo, press Space to pick it up, use left and right arrows to move it, then press Space or Enter to drop.
        </p>
      )}

      {/* Photos Grid */}
      <div className="listing-dashboard-photos__grid">
        {photos.map((photo, index) => {
          const imageUrl = getImageUrl(photo);
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={photo.id || index}
              className={`listing-dashboard-photos__card ${isDragging ? 'listing-dashboard-photos__card--dragging' : ''} ${isDragOver ? 'listing-dashboard-photos__card--drag-over' : ''}`}
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onKeyDown={(event) => handleCardKeyDown(event, index)}
              tabIndex={0}
              role="group"
              aria-grabbed={keyboardDragIndex === index}
              aria-label={`Photo ${index + 1}${keyboardDragIndex === index ? ', picked up for reordering' : ''}`}
            >
              {/* Drag Handle */}
              <div className="listing-dashboard-photos__drag-handle" title="Drag to reorder">
                <DragHandleIcon />
              </div>

              {/* Photo Image */}
              <div className="listing-dashboard-photos__image-container">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={photo.photoType || `Photo ${index + 1}`}
                    className="listing-dashboard-photos__image"
                    onError={handleImageError}
                    draggable={false}
                    onClick={() => setLightboxIndex(index)}
                    style={{ cursor: 'zoom-in' }}
                  />
                ) : (
                  <div className="listing-dashboard-photos__placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    <span>No image</span>
                  </div>
                )}

                {/* Cover Photo Badge */}
                {(photo.isCover || index === 0) && (
                  <div className="listing-dashboard-photos__cover-badge">
                    Cover Photo
                  </div>
                )}

                {/* Action Buttons - Always visible */}
                <div className="listing-dashboard-photos__actions">
                  <button
                    className={`listing-dashboard-photos__star-btn ${(photo.isCover || index === 0) ? 'listing-dashboard-photos__star-btn--active' : ''}`}
                    onClick={() => handleSetCoverPhoto?.(photo.id)}
                    aria-label={(photo.isCover || index === 0) ? 'Current cover photo' : 'Set as cover photo'}
                  >
                    <StarIcon filled={photo.isCover || index === 0} />
                  </button>
                  <button
                    className="listing-dashboard-photos__delete-btn"
                    onClick={() => handleDeletePhoto?.(photo.id)}
                    aria-label="Delete photo"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {/* Photo Type Selector */}
              <div className="listing-dashboard-photos__type">
                <select
                  value={photo.photoType || 'Other'}
                  aria-label={`Photo type for photo ${index + 1}`}
                  onChange={() => {}}
                >
                  {PHOTO_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}

        {/* Empty state if no photos */}
        {photos.length === 0 && (
          <div className="listing-dashboard-photos__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            <p>No photos uploaded yet.</p>
            <button onClick={() => handleEditSection('photos')}>Add your first photo</button>
          </div>
        )}
      </div>

      {/* Photo Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          getImageUrl={getImageUrl}
        />
      )}
    </div>
  );
}
