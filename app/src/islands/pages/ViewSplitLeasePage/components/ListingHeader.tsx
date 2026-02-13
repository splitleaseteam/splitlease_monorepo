/**
 * ListingHeader Component
 *
 * Displays listing title, location, host info, and action buttons (favorite, share).
 * Includes neighborhood pill that scrolls to map when clicked.
 *
 * @component
 * @architecture Presentational Component
 * @performance Memoized
 */

import { memo } from 'react';
import FavoriteButton from '../../../shared/FavoriteButton/FavoriteButton';
// @ts-ignore - JS module without type declarations
import { formatHostName } from '../../../../logic/processors/display/formatHostName';
import styles from './ListingHeader.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface ListingHeaderProps {
    listing: any;
    isFavorited: boolean;
    onToggleFavorite: (listingId: string, listingTitle: string, newState: boolean) => void;
    onLocationClick: () => void;
    isAuthenticated: boolean;
    userId: string | null;
    onRequireAuth: (() => void) | undefined;
}

const ListingHeader = memo(function ListingHeader({
    listing,
    isFavorited,
    onToggleFavorite,
    onLocationClick,
    isAuthenticated,
    userId,
    onRequireAuth
}: ListingHeaderProps) {

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: listing.listing_title,
                    text: `Check out this listing: ${listing.listing_title}`,
                    url: url
                });
            } catch (err) {
                // User cancelled share, no action needed
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(url);
                // Show toast notification (if toast service available)
                console.log('Link copied to clipboard');
            } catch (err) {
                console.error('Failed to copy link');
            }
        }
    };

    return (
        <header className={styles.listingHeaderContainer}>
            {/* Title */}
            <h1 className={styles.listingTitle}>{listing.listing_title}</h1>

            {/* Meta Row */}
            <div className={styles.metaRow}>
                {/* Location Pill */}
                <button
                    onClick={onLocationClick}
                    className={styles.locationPill}
                    aria-label={`View ${listing.resolvedNeighborhood} on map`}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>{listing.resolvedNeighborhood || 'Neighborhood'}, {listing.resolvedBorough || 'NYC'}</span>
                    <svg className={styles.locationArrow} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>

                {/* Action Buttons */}
                <div className={styles.actionButtons}>
                    <button
                        onClick={handleShare}
                        className={styles.actionButton}
                        aria-label="Share listing"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                        Share
                    </button>

                    <FavoriteButton
                        listingId={listing.id}
                        userId={userId || null}
                        initialFavorited={isFavorited}
                        onToggle={onToggleFavorite}
                        onRequireAuth={onRequireAuth || (() => {})}
                        size="medium"
                    />
                </div>
            </div>

            {/* Property Type & Specs */}
            <div className={styles.specsRow}>
                <span className={styles.specItem}>
                    <strong>{listing.resolvedTypeOfSpace || 'Entire Place'}</strong>
                </span>
                <span className={styles.specDivider}>â€¢</span>
                <span className={styles.specItem}>
                    <strong>{listing.max_guest_count || 1}</strong> {listing.max_guest_count === 1 ? 'guest' : 'guests'}
                </span>
                <span className={styles.specDivider}>â€¢</span>
                <span className={styles.specItem}>
                    <strong>
                        {listing.bedroom_count === 0
                            ? 'Studio'
                            : `${listing.bedroom_count} ${listing.bedroom_count === 1 ? 'bedroom' : 'bedrooms'}`
                        }
                    </strong>
                </span>
                <span className={styles.specDivider}>â€¢</span>
                <span className={styles.specItem}>
                    <strong>{listing.bathroom_count || 1}</strong> {listing.bathroom_count === 1 ? 'bath' : 'baths'}
                </span>
            </div>

            {/* Host Info */}
            {listing.host && (
                <div className={styles.hostRow}>
                    {listing.host.profile_photo_url ? (
                        <img
                            src={listing.host.profile_photo_url}
                            alt={listing.host.first_name || 'Host'}
                            className={styles.hostAvatar}
                        />
                    ) : (
                        <div className={styles.hostAvatarPlaceholder}>
                            {(listing.host.first_name || 'H').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className={styles.hostName}>
                        Hosted by {formatHostName({ fullName: listing.host.first_name && listing.host.last_name ? `${listing.host.first_name} ${listing.host.last_name}` : listing.host.first_name || 'Host' })}
                        {listing.host.is_user_verified && (
                            <svg className={styles.verifiedBadge} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </span>
                </div>
            )}
        </header>
    );
});

ListingHeader.displayName = 'ListingHeader';

export { ListingHeader };
