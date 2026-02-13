import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { logger } from '../../../lib/logger.js';
import { fetchPhotoUrls, extractPhotos } from '../../../lib/supabaseUtils.js';
import { adaptPricingListFromSupabase } from '../../../logic/processors/pricingList/adaptPricingListFromSupabase.ts';

/**
 * Hook that provides a function to fetch detailed listing data from Supabase
 * when a map pin is clicked. Manages loading state internally.
 *
 * @returns {{ fetchDetailedListingData, isLoadingListingDetails }}
 */
export default function useFetchListingDetails() {
  const [isLoadingListingDetails, setIsLoadingListingDetails] = useState(false);

  const fetchDetailedListingData = useCallback(async (listingId) => {
    logger.debug('fetchDetailedListingData: Starting fetch for listing:', listingId);
    setIsLoadingListingDetails(true);

    try {
      logger.debug('fetchDetailedListingData: Querying Supabase...');
      const { data: listingData, error: listingError } = await supabase
        .from('listing')
        .select('*')
        .eq('id', listingId)
        .maybeSingle();

      if (listingError) {
        logger.error('fetchDetailedListingData: Supabase error:', listingError);
        throw listingError;
      }

      logger.debug('fetchDetailedListingData: Listing data received:', {
        id: listingData.id,
        name: listingData.listing_title,
        borough: listingData.borough
      });

      logger.debug('fetchDetailedListingData: Fetching photos...');
      // Extract photo IDs from the Features - Photos field
      const photosField = listingData.photos_with_urls_captions_and_sort_order_json;
      const photoIds = [];

      if (Array.isArray(photosField)) {
        photoIds.push(...photosField);
      } else if (typeof photosField === 'string') {
        try {
          const parsed = JSON.parse(photosField);
          if (Array.isArray(parsed)) {
            photoIds.push(...parsed);
          }
        } catch (e) {
          logger.error('fetchDetailedListingData: Failed to parse photos field:', e);
        }
      }

      logger.debug('fetchDetailedListingData: Extracted photo IDs:', photoIds);

      // Fetch URLs for the photo IDs
      const photoMap = await fetchPhotoUrls(photoIds);

      // Convert photo IDs to URLs using extractPhotos
      const images = extractPhotos(photosField, photoMap, listingId);
      logger.debug('fetchDetailedListingData: Photos received:', images.length, 'images');

      // Fetch pricing list if listing has a pricing configuration
      let pricingList = null;
      if (listingData.pricing_configuration_id) {
        try {
          const { data: pricingData } = await supabase
            .from('pricing_list')
            .select('*')
            .eq('id', listingData.pricing_configuration_id)
            .maybeSingle();
          if (pricingData) {
            pricingList = adaptPricingListFromSupabase(pricingData);
          }
        } catch (e) {
          logger.warn('Failed to fetch pricing list for map popup:', e);
        }
      }

      const detailedListing = {
        id: listingData.id,
        title: listingData.listing_title,
        images,
        location: listingData.borough,
        bedrooms: listingData.bedroom_count || 0,
        bathrooms: listingData.bathroom_count || 0,
        squareFeet: listingData.square_feet || 0,
        price: {
          starting: listingData.standardized_min_nightly_price_for_search_filter || 0
        },
        pricingList,
        isNew: false,
        isAvailable: listingData.is_active || false
      };

      logger.debug('fetchDetailedListingData: Detailed listing built:', detailedListing);
      return detailedListing;
    } catch (error) {
      logger.error('fetchDetailedListingData: Failed to fetch listing details:', error);
      return null;
    } finally {
      setIsLoadingListingDetails(false);
      logger.debug('fetchDetailedListingData: Loading state set to false');
    }
  }, []);

  return { fetchDetailedListingData, isLoadingListingDetails };
}
