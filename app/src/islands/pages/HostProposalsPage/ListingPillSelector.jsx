/**
 * ListingPillSelector Component (V7 Design)
 *
 * A horizontal pill/chip-style selector for filtering proposals by listing.
 * Each pill shows: circular thumbnail, listing name, and proposal count badge.
 *
 * Part of the Host Proposals V7 redesign.
 */

import { getInitialsAvatarUrl } from '../../../lib/avatarUtils.js';

/**
 * Get listing thumbnail URL with fallback
 * @param {Object} listing - The listing object
 * @returns {string} The thumbnail URL or placeholder
 */
function getListingThumbnail(listing) {
  if (listing?.thumbnail) return listing.thumbnail;
  if (listing?.photo) return listing.photo;
  // Generate a placeholder based on listing name
  const name = listing?.title || listing?.name || 'Listing';
  return getInitialsAvatarUrl(name);
}

/**
 * ListingPillSelector renders a horizontal row of listing pills
 *
 * @param {Object} props
 * @param {Array} props.listings - Array of listing objects
 * @param {string} props.selectedListingId - Currently selected listing ID
 * @param {Function} props.onListingChange - Callback when listing selection changes
 * @param {Object} props.proposalCounts - Map of listingId to proposal count
 */
export function ListingPillSelector({
  listings = [],
  selectedListingId,
  onListingChange,
  proposalCounts = {}
}) {
  if (!listings?.length) {
    return null;
  }

  return (
    <div className="hp7-listing-selector">
      {listings.map((listing) => {
        const listingId = listing.id;
        const isActive = listingId === selectedListingId;
        const count = proposalCounts[listingId] ?? 0;
        const listingName = listing.title || listing.listing_title || 'Unnamed Listing';
        const thumbnail = getListingThumbnail(listing);

        return (
          <button
            key={listingId}
            type="button"
            className={`hp7-listing-pill${isActive ? ' active' : ''}`}
            onClick={() => onListingChange?.(listingId)}
            aria-pressed={isActive}
            aria-label={`${listingName} - ${count} proposals`}
          >
            <img
              src={thumbnail}
              className="hp7-listing-pill-thumb"
              alt=""
              loading="lazy"
            />
            <span className="hp7-listing-pill-name">{listingName}</span>
            <span className="hp7-listing-pill-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ListingPillSelector;
