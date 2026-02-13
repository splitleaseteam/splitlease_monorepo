import ListingCardForMap from '../ListingCard/ListingCardForMap.jsx';
import { logger } from '../../../lib/logger.js';

/**
 * ListingCardOverlay - Renders the listing card popup on the map
 * Shows a loading spinner while fetching, then the full card with listing details
 */
export default function ListingCardOverlay({
  cardVisible,
  cardPosition,
  isLoadingListingDetails,
  selectedListingForCard,
  onClose,
  onMessageClick,
  isLoggedIn,
  favoritedListingIds,
  onToggleFavorite,
  userId,
  onRequireAuth,
  showMessageButton,
  selectedNightsCount,
  simpleMode,
}) {
  logger.debug('Rendering card overlay - State check:', {
    cardVisible,
    isLoadingListingDetails,
    hasSelectedListing: !!selectedListingForCard,
    selectedListing: selectedListingForCard,
    cardPosition,
    simpleMode
  });

  if (!cardVisible || simpleMode) return null;

  return (
    <>
      {isLoadingListingDetails && (
        <div
          style={{
            position: 'absolute',
            left: `${cardPosition.x}px`,
            top: `${cardPosition.y}px`,
            transform: 'translate(-50%, 0)',
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
          }}
        >
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ margin: '10px 0 0 0', textAlign: 'center' }}>Loading listing details...</p>
        </div>
      )}
      {!isLoadingListingDetails && selectedListingForCard && (() => {
        const listingId = selectedListingForCard.id;
        logger.debug('[GoogleMap] Rendering ListingCardForMap', {
          listingId,
          hasMessageCallback: !!onMessageClick
        });
        return (
          <ListingCardForMap
            listing={selectedListingForCard}
            onClose={onClose}
            isVisible={cardVisible}
            position={cardPosition}
            onMessageClick={onMessageClick}
            isLoggedIn={isLoggedIn}
            isFavorited={favoritedListingIds?.has(listingId)}
            onToggleFavorite={onToggleFavorite}
            userId={userId}
            onRequireAuth={onRequireAuth}
            showMessageButton={showMessageButton}
            selectedNightsCount={selectedNightsCount}
          />
        );
      })()}
    </>
  );
}
