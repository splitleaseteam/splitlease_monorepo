/**
 * ListingTabs Component
 *
 * A horizontal tab/pill-style selector for filtering leases by listing.
 * Each tab shows: circular thumbnail, listing name, and lease count badge.
 */

import { getInitialsAvatarUrl } from '../../../../lib/avatarUtils.js';

/**
 * Get listing thumbnail URL with fallback
 * @param {Object} listing - The listing object
 * @returns {string} The thumbnail URL or placeholder
 */
function getListingThumbnail(listing) {
  if (listing?.thumbnail) return listing.thumbnail;
  if (listing?.picture_url) return listing.picture_url;
  if (listing?.Image) return listing.Image;
  if (listing?.photo) return listing.photo;
  // Generate a placeholder based on listing name
  const name = listing?.title || listing?.name || 'Listing';
  return getInitialsAvatarUrl(name);
}

/**
 * ListingTabs renders a horizontal row of listing tabs
 *
 * @param {Object} props
 * @param {Array} props.listings - Array of listing objects
 * @param {string} props.selectedListingId - Currently selected listing ID
 * @param {Function} props.onListingChange - Callback when listing selection changes
 * @param {Object} props.leaseCountsByListing - Map of listingId to lease count
 */
export function ListingTabs({
  listings = [],
  selectedListingId,
  onListingChange,
  leaseCountsByListing = {}
}) {
  if (!listings?.length) {
    return null;
  }

  return (
    <div className="hl-listing-tabs">
      {listings.map((listing) => {
        const listingId = listing.id;
        const isActive = listingId === selectedListingId;
        const count = leaseCountsByListing[listingId] ?? 0;
        const listingName = listing.title || listing.listing_title || 'Unnamed Listing';
        const thumbnail = getListingThumbnail(listing);

        return (
          <button
            key={listingId}
            type="button"
            className={`hl-listing-tab${isActive ? ' active' : ''}`}
            onClick={() => onListingChange?.(listingId)}
            aria-pressed={isActive}
            aria-label={`${listingName} - ${count} leases`}
          >
            <img
              src={thumbnail}
              className="hl-listing-tab-thumb"
              alt=""
              loading="lazy"
            />
            <span className="hl-listing-tab-name">{listingName}</span>
            {count > 0 && (
              <span className="hl-listing-tab-count">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ListingTabs;
