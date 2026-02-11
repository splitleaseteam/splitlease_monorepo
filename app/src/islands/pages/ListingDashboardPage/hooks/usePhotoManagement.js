import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '../../../../lib/supabase';
import { logger } from '../../../../lib/logger';

/**
 * Convert listing.photos (component format) back to the JSONB format
 * stored in listing.photos_with_urls_captions_and_sort_order_json
 *
 * Component photo shape: { id, url, isCover, photoType }
 * DB JSONB shape: { url, caption, sort_order, toggleMainPhoto, type, id }
 */
function photosToJsonb(photos) {
  return photos.map((photo, index) => ({
    id: photo.id,
    url: photo.url || '',
    caption: photo.caption || '',
    sort_order: index,
    toggleMainPhoto: photo.isCover || index === 0,
    type: photo.photoType || 'Other',
  }));
}

/**
 * Persist the current photos array to the listing's embedded JSONB column
 */
async function persistPhotosToListing(listingId, photos) {
  const jsonbData = photosToJsonb(photos);
  const { error } = await supabase
    .from('listing')
    .update({ photos_with_urls_captions_and_sort_order_json: jsonbData })
    .eq('id', listingId);

  if (error) {
    throw error;
  }
}

/**
 * Hook for managing listing photos
 * Handles cover photo selection, reordering, and deletion
 *
 * Photos are stored in the listing table's photos_with_urls_captions_and_sort_order_json
 * JSONB column as an array of objects: [{ url, caption, sort_order, ... }]
 */
export function usePhotoManagement(listing, setListing, fetchListing, listingId) {
  const listingRef = useRef(listing);

  useEffect(() => {
    listingRef.current = listing;
  }, [listing]);

  const handleSetCoverPhoto = useCallback(async (photoId) => {
    const currentListing = listingRef.current;
    if (!currentListing || !photoId) return;

    logger.debug('Setting cover photo:', photoId);

    const photoIndex = currentListing.photos.findIndex((photo) => photo.id === photoId);
    if (photoIndex === -1 || photoIndex === 0) {
      logger.debug('Photo not found or already first');
      return;
    }

    const newPhotos = [...currentListing.photos];
    const [selectedPhoto] = newPhotos.splice(photoIndex, 1);
    selectedPhoto.isCover = true;

    newPhotos.forEach(p => { p.isCover = false; });
    newPhotos.unshift(selectedPhoto);

    setListing(prev => ({
      ...prev,
      photos: newPhotos,
    }));

    try {
      await persistPhotosToListing(listingId, newPhotos);
      logger.debug('Cover photo updated in listing JSONB column');
    } catch (err) {
      logger.error('Error updating cover photo:', err);
      fetchListing(true);
    }
  }, [setListing, fetchListing, listingId]);

  const handleReorderPhotos = useCallback(async (fromIndex, toIndex) => {
    const currentListing = listingRef.current;
    if (!currentListing || fromIndex === toIndex) return;

    logger.debug('Reordering photos:', fromIndex, '->', toIndex);

    const newPhotos = [...currentListing.photos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);

    newPhotos.forEach((p, idx) => {
      p.isCover = idx === 0;
    });

    setListing(prev => ({
      ...prev,
      photos: newPhotos,
    }));

    try {
      await persistPhotosToListing(listingId, newPhotos);
      logger.debug('Photos reordered in listing JSONB column');
    } catch (err) {
      logger.error('Error reordering photos:', err);
      fetchListing(true);
    }
  }, [setListing, fetchListing, listingId]);

  const handleDeletePhoto = useCallback(async (photoId) => {
    const currentListing = listingRef.current;
    if (!currentListing || !photoId) return;

    logger.debug('Deleting photo:', photoId);

    const photoIndex = currentListing.photos.findIndex((photo) => photo.id === photoId);
    if (photoIndex === -1) {
      logger.debug('Photo not found');
      return;
    }

    const newPhotos = currentListing.photos.filter((photo) => photo.id !== photoId);

    if (newPhotos.length > 0 && currentListing.photos[photoIndex].isCover) {
      newPhotos[0].isCover = true;
    }

    setListing(prev => ({
      ...prev,
      photos: newPhotos,
    }));

    try {
      await persistPhotosToListing(listingId, newPhotos);
      logger.debug('Photo deleted from listing JSONB column');
    } catch (err) {
      logger.error('Error deleting photo:', err);
      fetchListing(true);
    }
  }, [setListing, fetchListing, listingId]);

  return {
    handleSetCoverPhoto,
    handleReorderPhotos,
    handleDeletePhoto
  };
}
