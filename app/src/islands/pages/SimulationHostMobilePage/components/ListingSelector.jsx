/**
 * Listing Selector Component
 * Allows host to choose which listing to use for the simulation
 */

export default function ListingSelector({ listings, selectedListing, onSelect }) {
  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <div className="simulation-host-listing-selector">
      <h3 className="simulation-host-listing-selector__title">
        Select a Listing
      </h3>
      <p className="simulation-host-listing-selector__description">
        Choose which listing to use for receiving test proposals
      </p>

      <div className="simulation-host-listing-selector__grid">
        {listings.map((listing) => {
          const isSelected = selectedListing?.id === listing.id;
          const name = listing.listing_title || 'Unnamed Listing';
          const address = typeof listing.address_with_lat_lng_json === 'object'
            ? (listing.address_with_lat_lng_json?.address || '')
            : (listing.address_with_lat_lng_json || '');
          const coverPhoto = listing.profile_photo_url || listing.photos_with_urls_captions_and_sort_order_json?.[0]?.url;

          return (
            <button
              key={listing.id}
              className={`simulation-host-listing-card ${isSelected ? 'simulation-host-listing-card--selected' : ''}`}
              onClick={() => onSelect(listing)}
            >
              {coverPhoto && (
                <div
                  className="simulation-host-listing-card__image"
                  style={{ backgroundImage: `url(${coverPhoto})` }}
                />
              )}
              <div className="simulation-host-listing-card__content">
                <h4 className="simulation-host-listing-card__name">{name}</h4>
                {address && (
                  <p className="simulation-host-listing-card__address">{address}</p>
                )}
                {isSelected && (
                  <span className="simulation-host-listing-card__selected-badge">
                    ✓ Selected
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
