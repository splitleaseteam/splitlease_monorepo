/**
 * SearchListingsGrid - Grid of property cards with lazy loading via IntersectionObserver
 *
 * Extracted from SearchPage.jsx to reduce main file size.
 * This is the version used by SearchPage (not the older ListingsGrid.jsx in this directory).
 */
import { useRef, useEffect } from 'react';
import PropertyCard from '../../../shared/ListingCard/PropertyCard.jsx';

export default function SearchListingsGrid({
  listings,
  onLoadMore,
  hasMore,
  isLoading,
  isPaused,
  onOpenContactModal,
  onOpenInfoModal,
  onLocationClick,
  onCardHover,
  onCardLeave,
  onOpenDetailDrawer,
  isLoggedIn,
  userId,
  favoritedListingIds,
  onToggleFavorite,
  onRequireAuth,
  showCreateProposalButton,
  onOpenCreateProposalModal,
  proposalsByListingId,
  selectedNightsCount,
  showMessageButton
}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || isLoading || isPaused) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: '100px', threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [hasMore, isLoading, isPaused, onLoadMore]);

  return (
    <div className="listings-container" role="list" aria-label="Search results listings">
      {listings.map((listing) => {
        const listingId = listing.id;
        const isFavorited = favoritedListingIds?.has(listingId);
        const proposalForListing = proposalsByListingId?.get(listingId) || null;
        return (
          <PropertyCard
            key={listing.id}
            listing={listing}
            onLocationClick={onLocationClick}
            onCardHover={onCardHover}
            onCardLeave={onCardLeave}
            onOpenDetailDrawer={onOpenDetailDrawer}
            onOpenContactModal={onOpenContactModal}
            onOpenInfoModal={onOpenInfoModal}
            isLoggedIn={isLoggedIn}
            isFavorited={isFavorited}
            userId={userId}
            onToggleFavorite={onToggleFavorite}
            onRequireAuth={onRequireAuth}
            showCreateProposalButton={showCreateProposalButton}
            onOpenCreateProposalModal={onOpenCreateProposalModal}
            proposalForListing={proposalForListing}
            selectedNightsCount={selectedNightsCount}
            variant="search"
          />
        );
      })}

      {hasMore && (
        <div ref={sentinelRef} className="lazy-load-sentinel">
          <div className="loading-more">
            <div className="spinner"></div>
            <span>Loading more listings...</span>
          </div>
        </div>
      )}
    </div>
  );
}
