/**
 * API service for favorite listings
 *
 * Favorites are now stored on the LISTING table in the `user_ids_who_favorited_json`
 * JSONB array column. Each listing stores an array of user IDs who favorited it.
 *
 * Previously favorites were stored on the user table's "Favorited Listings" field,
 * but that has been migrated to the listing table.
 */

import { supabase } from '../../../lib/supabase.js';

/**
 * Fetch favorited listing IDs for a user by querying the listing table
 * Finds all listings where user_ids_who_favorited_json contains the userId
 * @param {string} userId - The user's ID
 * @returns {Promise<string[]>} Array of favorited listing IDs
 */
export async function getFavoritedListingIds(userId) {
  console.log('[favoritesApi] getFavoritedListingIds called with:', { userId });

  try {
    const { data: listings, error } = await supabase
      .from('listing')
      .select('id')
      .filter('user_ids_who_favorited_json', 'cs', JSON.stringify([userId]));

    if (error) {
      console.error('[favoritesApi] Error fetching favorited listing IDs:', error);
      throw error;
    }

    const favorites = (listings || []).map(l => l.id);
    console.log('[favoritesApi] Found', favorites.length, 'favorited listings');
    return favorites;
  } catch (err) {
    console.error('[favoritesApi] Failed to fetch favorited listing IDs:', err);
    throw err;
  }
}

/**
 * Check if a specific listing is favorited by the user
 * @param {string} userId - The user's ID
 * @param {string} listingId - The listing ID to check
 * @returns {Promise<boolean>} True if favorited, false otherwise
 */
export async function isListingFavorited(userId, listingId) {
  try {
    const { data: listing, error } = await supabase
      .from('listing')
      .select('user_ids_who_favorited_json')
      .eq('id', listingId)
      .maybeSingle();

    if (error) {
      console.error('[favoritesApi] Error checking if listing is favorited:', error);
      return false;
    }

    const favoritedBy = listing?.user_ids_who_favorited_json || [];
    return Array.isArray(favoritedBy) && favoritedBy.includes(userId);
  } catch (err) {
    console.error('[favoritesApi] Failed to check if listing is favorited:', err);
    return false;
  }
}

/**
 * Remove a listing from user's favorites
 * Updates the listing table's user_ids_who_favorited_json JSONB field
 * @param {string} userId - The user's ID
 * @param {string} listingId - The listing ID to remove from favorites
 * @returns {Promise<{success: boolean, favorites: string[]}>}
 */
export async function removeFromFavorites(userId, listingId) {
  try {
    console.log('[favoritesApi] Removing from favorites:', { userId, listingId });

    // Fetch current favorited users for this listing
    const { data: listing, error: fetchError } = await supabase
      .from('listing')
      .select('user_ids_who_favorited_json')
      .eq('id', listingId)
      .maybeSingle();

    if (fetchError) {
      console.error('[favoritesApi] Error fetching listing favorites:', fetchError);
      throw fetchError;
    }

    const currentFavoritedBy = listing?.user_ids_who_favorited_json || [];

    // Remove the user ID
    const newFavoritedBy = currentFavoritedBy.filter(id => id !== userId);

    // Update listing table
    const { error: updateError } = await supabase
      .from('listing')
      .update({ user_ids_who_favorited_json: newFavoritedBy })
      .eq('id', listingId);

    if (updateError) {
      console.error('[favoritesApi] Error updating listing favorites:', updateError);
      throw updateError;
    }

    // Return remaining favorited listing IDs for this user
    const remainingFavorites = await getFavoritedListingIds(userId);

    console.log('[favoritesApi] Removed from favorites successfully');
    return { success: true, favorites: remainingFavorites };
  } catch (err) {
    console.error('[favoritesApi] Failed to remove from favorites:', err);
    throw err;
  }
}

/**
 * Add a listing to user's favorites
 * Updates the listing table's user_ids_who_favorited_json JSONB field
 * @param {string} userId - The user's ID
 * @param {string} listingId - The listing ID to add to favorites
 * @returns {Promise<{success: boolean, favorites: string[]}>}
 */
export async function addToFavorites(userId, listingId) {
  try {
    console.log('[favoritesApi] Adding to favorites:', { userId, listingId });

    // Fetch current favorited users for this listing
    const { data: listing, error: fetchError } = await supabase
      .from('listing')
      .select('user_ids_who_favorited_json')
      .eq('id', listingId)
      .maybeSingle();

    if (fetchError) {
      console.error('[favoritesApi] Error fetching listing favorites:', fetchError);
      throw fetchError;
    }

    const currentFavoritedBy = listing?.user_ids_who_favorited_json || [];

    // Add the user ID (avoid duplicates)
    let newFavoritedBy;
    if (!currentFavoritedBy.includes(userId)) {
      newFavoritedBy = [...currentFavoritedBy, userId];
    } else {
      newFavoritedBy = currentFavoritedBy;
    }

    // Update listing table
    const { error: updateError } = await supabase
      .from('listing')
      .update({ user_ids_who_favorited_json: newFavoritedBy })
      .eq('id', listingId);

    if (updateError) {
      console.error('[favoritesApi] Error updating listing favorites:', updateError);
      throw updateError;
    }

    // Return all favorited listing IDs for this user
    const allFavorites = await getFavoritedListingIds(userId);

    console.log('[favoritesApi] Added to favorites successfully');
    return { success: true, favorites: allFavorites };
  } catch (err) {
    console.error('[favoritesApi] Failed to add to favorites:', err);
    throw err;
  }
}
