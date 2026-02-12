/**
 * Photo Gallery Component
 *
 * Adaptive photo gallery that adjusts layout based on number of photos.
 * - 1 photo: Single large image
 * - 2 photos: Two equal side-by-side
 * - 3 photos: Large left + 2 stacked right
 * - 4 photos: Large left + 3 smaller right
 * - 5+ photos: Classic Pinterest layout (large left + 4 smaller right with "Show all" overlay)
 *
 * Mobile: Always shows single image with "Show all X photos" button
 *
 * @component
 * @architecture Presentational Component
 * @performance Memoized to prevent unnecessary re-renders
 * @accessibility Includes keyboard navigation and ARIA labels
 */

import { memo } from 'react';
import styles from './PhotoGallery.module.css';

<<<<<<<< HEAD:app/src/islands/pages/ViewSplitLeasePage/components/PhotoGallery (1).tsx
interface Photo {
    id: string;
    Photo: string;
    'Photo (thumbnail)'?: string;
}

interface PhotoGalleryProps {
    photos: Photo[];
    listingName: string;
    onPhotoClick: (index: number) => void;
    currentIndex?: number;
    isModalOpen?: boolean;
    onCloseModal?: () => void;
    isMobile?: boolean;
}

========
// ============================================================================
// TYPES
// ============================================================================

interface Photo {
  id: string;
  Photo: string;
  'Photo (thumbnail)'?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  listingName: string;
  onPhotoClick: (index: number) => void;
  currentIndex: number;
  isModalOpen: boolean;
  onCloseModal: () => void;
  isMobile?: boolean;
}

interface PhotoTileProps {
  photo: Photo;
  index: number;
  onClick: (index: number) => void;
  alt: string;
  className?: string;
  priority?: boolean;
  useThumbnail?: boolean;
  showAllOverlay?: boolean;
  totalPhotos?: number;
}

interface PhotoLightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  listingName: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

>>>>>>>> dde4e4b5b96fd0926091ebe5f9e47e060b986cb9:app/src/islands/pages/ViewSplitLeasePage/components/PhotoGallery.tsx
const PhotoGallery = memo(function PhotoGallery({
    photos,
    listingName,
    onPhotoClick,
    currentIndex,
    isModalOpen,
    onCloseModal,
    isMobile = false
}: PhotoGalleryProps) {
    const photoCount = photos.length;

    // Handle empty photo array
    if (photoCount === 0) {
        return (
            <div className={styles.photoGalleryEmpty}>
                <div className={styles.emptyPlaceholder}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p>No photos available</p>
                </div>
            </div>
        );
    }

    // ============================================================================
    // MOBILE LAYOUT
    // ============================================================================

    if (isMobile) {
        return (
            <>
                <div className={styles.photoGalleryMobileContainer}>
                    <div
                        onClick={() => onPhotoClick(0)}
                        className={styles.photoGalleryMobileImage}
                        role="button"
                        tabIndex={0}
                        aria-label={`View all ${photoCount} photos`}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onPhotoClick(0);
                            }
                        }}
                    >
                        <img
                            src={photos[0].Photo}
                            alt={`${listingName} - main photo`}
                            className={styles.photoGalleryMobileImg}
                            loading="eager"
                        />
                    </div>
                    {photoCount > 1 && (
                        <button
                            onClick={() => onPhotoClick(0)}
                            className={styles.photoGalleryShowAllButton}
                            aria-label={`Show all ${photoCount} photos`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                            Show all {photoCount}
                        </button>
                    )}
                </div>

                {/* Lightbox Modal */}
                {isModalOpen && (
                    <PhotoLightbox
                        photos={photos}
                        currentIndex={currentIndex}
                        onClose={onCloseModal}
                        listingName={listingName}
                    />
                )}
            </>
        );
    }

    // ============================================================================
    // DESKTOP LAYOUT
    // ============================================================================

    const getGridClass = () => {
        const baseClass = styles.photoGalleryDesktopGrid;
        if (photoCount === 1) return `${baseClass} ${styles.photoGalleryDesktopGrid1}`;
        if (photoCount === 2) return `${baseClass} ${styles.photoGalleryDesktopGrid2}`;
        if (photoCount === 3) return `${baseClass} ${styles.photoGalleryDesktopGrid3}`;
        if (photoCount === 4) return `${baseClass} ${styles.photoGalleryDesktopGrid4}`;
        return `${baseClass} ${styles.photoGalleryDesktopGrid5Plus}`;
    };

    // Single photo layout
    if (photoCount === 1) {
        return (
            <>
                <div className={getGridClass()}>
                    <PhotoTile
                        photo={photos[0]}
                        index={0}
                        onClick={onPhotoClick}
                        alt={`${listingName} - main photo`}
                        priority={true}
                    />
                </div>
                {isModalOpen && (
                    <PhotoLightbox
                        photos={photos}
                        currentIndex={currentIndex}
                        onClose={onCloseModal}
                        listingName={listingName}
                    />
                )}
            </>
        );
    }

    // Two photos layout
    if (photoCount === 2) {
        return (
            <>
                <div className={getGridClass()}>
                    {photos.map((photo, idx) => (
                        <PhotoTile
                            key={photo.id}
                            photo={photo}
                            index={idx}
                            onClick={onPhotoClick}
                            alt={`${listingName} - photo ${idx + 1}`}
                            priority={idx === 0}
                        />
                    ))}
                </div>
                {isModalOpen && (
                    <PhotoLightbox
                        photos={photos}
                        currentIndex={currentIndex}
                        onClose={onCloseModal}
                        listingName={listingName}
                    />
                )}
            </>
        );
    }

    // Three photos layout
    if (photoCount === 3) {
        return (
            <>
                <div className={getGridClass()}>
                    <PhotoTile
                        photo={photos[0]}
                        index={0}
                        onClick={onPhotoClick}
                        alt={`${listingName} - main photo`}
                        className={styles.photoGalleryImageWrapperSpan2}
                        priority={true}
                    />
                    {photos.slice(1, 3).map((photo, idx) => (
                        <PhotoTile
                            key={photo.id}
                            photo={photo}
                            index={idx + 1}
                            onClick={onPhotoClick}
                            alt={`${listingName} - photo ${idx + 2}`}
                            useThumbnail={true}
                        />
                    ))}
                </div>
                {isModalOpen && (
                    <PhotoLightbox
                        photos={photos}
                        currentIndex={currentIndex}
                        onClose={onCloseModal}
                        listingName={listingName}
                    />
                )}
            </>
        );
    }

    // Four photos layout
    if (photoCount === 4) {
        return (
            <>
                <div className={getGridClass()}>
                    <PhotoTile
                        photo={photos[0]}
                        index={0}
                        onClick={onPhotoClick}
                        alt={`${listingName} - main photo`}
                        className={styles.photoGalleryImageWrapperSpan3}
                        priority={true}
                    />
                    {photos.slice(1, 4).map((photo, idx) => (
                        <PhotoTile
                            key={photo.id}
                            photo={photo}
                            index={idx + 1}
                            onClick={onPhotoClick}
                            alt={`${listingName} - photo ${idx + 2}`}
                            useThumbnail={true}
                        />
                    ))}
                </div>
                {isModalOpen && (
                    <PhotoLightbox
                        photos={photos}
                        currentIndex={currentIndex}
                        onClose={onCloseModal}
                        listingName={listingName}
                    />
                )}
            </>
        );
    }

    // 5+ photos layout (Pinterest style)
    const photosToShow = photos.slice(1, 5);

    return (
        <>
            <div className={getGridClass()}>
                <PhotoTile
                    photo={photos[0]}
                    index={0}
                    onClick={onPhotoClick}
                    alt={`${listingName} - main photo`}
                    className={styles.photoGalleryImageWrapperSpan2}
                    priority={true}
                />
                {photosToShow.map((photo, idx) => (
                    <PhotoTile
                        key={photo.id}
                        photo={photo}
                        index={idx + 1}
                        onClick={onPhotoClick}
                        alt={`${listingName} - photo ${idx + 2}`}
                        useThumbnail={true}
                        showAllOverlay={idx === 3 && photoCount > 5}
                        totalPhotos={photoCount}
                    />
                ))}
            </div>
            {isModalOpen && (
                <PhotoLightbox
                    photos={photos}
                    currentIndex={currentIndex}
                    onClose={onCloseModal}
                    listingName={listingName}
                />
            )}
        </>
    );
});

PhotoGallery.displayName = 'PhotoGallery';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Individual photo tile
 */
interface PhotoTileProps {
    photo: Photo;
    index: number;
    onClick: (index: number) => void;
    alt: string;
    className?: string;
    priority?: boolean;
    useThumbnail?: boolean;
    showAllOverlay?: boolean;
    totalPhotos?: number;
}

const PhotoTile = memo(function PhotoTile({
    photo,
    index,
    onClick,
    alt,
    className = '',
    priority = false,
    useThumbnail = false,
    showAllOverlay = false,
    totalPhotos = 0
}: PhotoTileProps) {
    const photoUrl = useThumbnail && photo['Photo (thumbnail)']
        ? photo['Photo (thumbnail)']
        : photo.Photo;

    return (
        <div
            onClick={() => onClick(index)}
            className={`${styles.photoGalleryImageWrapper} ${className}`}
            role="button"
            tabIndex={0}
            aria-label={showAllOverlay ? `View all ${totalPhotos} photos` : alt}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(index);
                }
            }}
        >
            <img
                src={photoUrl}
                alt={alt}
                className={styles.photoGalleryImage}
                loading={priority ? 'eager' : 'lazy'}
            />
            {showAllOverlay && (
                <div className={styles.photoGalleryOverlay}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick(0);
                        }}
                        className={styles.photoGalleryDesktopShowAll}
                        aria-label={`View all ${totalPhotos} photos`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <span>Show All Photos</span>
                    </button>
                </div>
            )}
        </div>
    );
});

PhotoTile.displayName = 'PhotoTile';

/**
 * Photo lightbox modal
 */
interface PhotoLightboxProps {
    photos: Photo[];
    currentIndex: number;
    onClose: () => void;
    listingName: string;
}

const PhotoLightbox = memo(function PhotoLightbox({
    photos,
    currentIndex,
    onClose,
    listingName
}: PhotoLightboxProps) {
    const handlePrevious = () => {
        const newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
        // Note: Parent component should handle index updates
    };

    const handleNext = () => {
        const newIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
        // Note: Parent component should handle index updates
    };

    return (
        <div
            className={styles.lightboxBackdrop}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Photo lightbox"
        >
            <div className={styles.lightboxContainer} onClick={(e) => e.stopPropagation()}>
                <button
                    className={styles.lightboxClose}
                    onClick={onClose}
                    aria-label="Close lightbox"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className={styles.lightboxContent}>
                    <img
                        src={photos[currentIndex].Photo}
                        alt={`${listingName} - photo ${currentIndex + 1} of ${photos.length}`}
                        className={styles.lightboxImage}
                    />
                </div>

                {photos.length > 1 && (
                    <>
                        <button
                            className={styles.lightboxPrev}
                            onClick={handlePrevious}
                            aria-label="Previous photo"
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button
                            className={styles.lightboxNext}
                            onClick={handleNext}
                            aria-label="Next photo"
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                        <div className={styles.lightboxCounter}>
                            {currentIndex + 1} / {photos.length}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});

PhotoLightbox.displayName = 'PhotoLightbox';

export { PhotoGallery };
