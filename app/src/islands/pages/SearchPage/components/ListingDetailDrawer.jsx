/**
 * ListingDetailDrawer - Slide-in detail panel for search results
 *
 * Desktop: slides from right, 500px wide
 * Mobile: slides from bottom, full height minus 40px
 *
 * Shows listing details using data already in the transformed listing object.
 * No new API calls — purely reads from the listing prop.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useImageCarousel } from '../../../../hooks/useImageCarousel.js';
import { formatHostName } from '../../../../logic/processors/display/formatHostName.js';
import { getNeighborhoodInfo, fetchNeighborhoodDescription } from '../../../../lib/dataLookups.js';
import FavoriteButton from '../../../shared/FavoriteButton/FavoriteButton.jsx';
import './ListingDetailDrawer.css';

export default function ListingDetailDrawer({
  isOpen,
  listing,
  onClose,
  onOpenContactModal,
  onOpenCreateProposalModal,
  showCreateProposalButton,
  proposalsByListingId,
  selectedNightsCount,
  _isLoggedIn,
  favoritedListingIds,
  onToggleFavorite,
  userId,
  onRequireAuth,
  pricePercentiles,
}) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [neighborhoodDesc, setNeighborhoodDesc] = useState(null);
  const drawerRef = useRef(null);
  const drawerBodyRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Swipe-to-close gesture (mobile only)
  const touchStartRef = useRef(null);
  const touchStartTimeRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const axisLockRef = useRef(null);
  const allowDragRef = useRef(false);

  const isMobileViewport = () => window.innerWidth <= 768;

  const handleTouchStart = useCallback((e) => {
    if (!isMobileViewport()) return;
    if (!e.touches || e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartTimeRef.current = Date.now();
    dragDistanceRef.current = 0;
    axisLockRef.current = null;

    const body = drawerBodyRef.current;
    const targetInBody = body?.contains(e.target);
    const bodyAtTop = !body || body.scrollTop <= 0;
    allowDragRef.current = !targetInBody || bodyAtTop;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isMobileViewport() || !touchStartRef.current || !drawerRef.current) return;
    if (!e.touches || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (!axisLockRef.current) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
      axisLockRef.current = Math.abs(deltaY) > Math.abs(deltaX) ? 'vertical' : 'horizontal';
    }

    // Never hijack horizontal gestures (e.g., iOS browser back swipe)
    if (axisLockRef.current === 'horizontal') return;

    const body = drawerBodyRef.current;
    if (body && body.contains(e.target) && body.scrollTop > 0) {
      dragDistanceRef.current = 0;
      drawerRef.current.classList.remove('dragging');
      drawerRef.current.style.transform = '';
      return;
    }

    // Only track downward drags
    if (deltaY <= 0 || !allowDragRef.current) {
      dragDistanceRef.current = 0;
      drawerRef.current.style.transform = '';
      return;
    }

    e.preventDefault();
    dragDistanceRef.current = deltaY;
    drawerRef.current.classList.add('dragging');
    drawerRef.current.style.transform = `translateY(${deltaY}px)`;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isMobileViewport() || !drawerRef.current) return;
    const distance = dragDistanceRef.current;
    const elapsed = Date.now() - touchStartTimeRef.current;
    const velocity = elapsed > 0 ? distance / elapsed : 0;

    drawerRef.current.classList.remove('dragging');
    drawerRef.current.style.transform = '';

    // Close if dragged > 100px or velocity > 0.3px/ms
    if (distance > 100 || velocity > 0.3) {
      onClose();
    }

    touchStartRef.current = null;
    dragDistanceRef.current = 0;
    axisLockRef.current = null;
    allowDragRef.current = false;
  }, [onClose]);

  const {
    currentImageIndex,
    hasImages,
    hasMultipleImages,
    handlePrevImage,
    handleNextImage,
  } = useImageCarousel(listing?.images);

  const listingId = listing?.id || listing?._id;
  const isFavorited = favoritedListingIds?.has(listingId);
  const proposalForListing = proposalsByListingId?.get(listingId) || null;

  // Build full listing URL with days-selected param
  const listingUrl = useMemo(() => {
    if (!listingId) return '#';
    const urlParams = new URLSearchParams(window.location.search);
    const daysSelected = urlParams.get('days-selected');
    return daysSelected
      ? `/view-split-lease/${listingId}?days-selected=${daysSelected}`
      : `/view-split-lease/${listingId}`;
  }, [listingId]);

  // Build pricing chips for 2-7 nights
  const pricingChips = useMemo(() => {
    if (!listing) return [];
    const chips = [];
    for (let n = 2; n <= 7; n++) {
      let price = null;
      // Try pricingList first
      if (listing.pricingList?.nightlyPrice) {
        const raw = listing.pricingList.nightlyPrice[n - 1];
        const parsed = Number(raw);
        if (!isNaN(parsed) && parsed > 0) price = parsed;
      }
      // Fallback to nightly rate fields
      if (price === null) {
        const rateKey = `nightly_rate_for_${n}_night_stay`;
        const rate = Number(listing[rateKey]);
        if (!isNaN(rate) && rate > 0) price = rate;
      }
      if (price !== null) {
        chips.push({ nights: n, price });
      }
    }
    return chips;
  }, [listing]);

  // Body scroll lock (iOS Safari compatible)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Focus trap: save previous focus, focus drawer on open
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      previousFocusRef.current = document.activeElement;
      drawerRef.current.focus();
    }
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Lazy-load neighborhood description on drawer open
  useEffect(() => {
    if (!isOpen || !listing?.neighborhoodReferenceId) {
      setNeighborhoodDesc(null);
      return;
    }
    const info = getNeighborhoodInfo(listing.neighborhoodReferenceId);
    if (info.needsFetch) {
      fetchNeighborhoodDescription(listing.neighborhoodReferenceId)
        .then(desc => setNeighborhoodDesc(desc));
    } else {
      setNeighborhoodDesc(info.description);
    }
  }, [isOpen, listing?.neighborhoodReferenceId]);

  // Focus trap: keep Tab inside drawer
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !drawerRef.current) return;

    const focusable = drawerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  if (!listing) return null;

  // Normalize protocol-relative icon URLs (// → https://)
  const normalizeIconUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    return url.startsWith('//') ? `https:${url}` : url;
  };

  // Price badge based on global percentiles
  const priceBadge = (() => {
    if (!pricePercentiles || !listing.price?.starting || listing.price.starting <= 0) return null;
    const price = listing.price.starting;
    if (price <= pricePercentiles.p25) return { label: 'Great Price', className: 'detail-drawer__price-badge--great' };
    if (price <= pricePercentiles.p50) return { label: 'Good Value', className: 'detail-drawer__price-badge--good' };
    return null;
  })();

  const hasDescription = listing.listingDescription && listing.listingDescription.trim().length > 0;
  const hasUnitAmenities = listing.unitAmenities?.length > 0;
  const hasBuildingAmenities = listing.buildingAmenities?.length > 0;
  const hasAnyAmenities = hasUnitAmenities || hasBuildingAmenities;
  const hasHouseRules = listing.houseRules?.length > 0;
  const hasSafetyFeatures = listing.safetyFeatures?.length > 0;
  const hasRulesSafetyCancellation = hasHouseRules || hasSafetyFeatures || listing.cancellationPolicy;
  const hasTransit = listing.transitTime;
  const hasCheckTimes = listing.checkInTime || listing.checkOutTime;
  const hasStayConstraints = listing.minNightsPerStay || listing.maxNightsPerStay || listing.minWeeksPerStay || listing.maxWeeksPerStay;
  const hasDetails = listing.parkingOption || listing.storageOption || listing.kitchenType || hasStayConstraints;
  // Prefer lazy-loaded description, fallback to pre-existing
  const resolvedNeighborhoodDesc = neighborhoodDesc || listing.neighborhoodDescription || '';
  const hasNeighborhoodDesc = resolvedNeighborhoodDesc.trim().length > 0;

  const handleShare = async () => {
    const url = `/view-split-lease/${listingId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, url: window.location.origin + url });
      } catch (_) { console.debug('Share dialog dismissed by user'); }
    } else {
      await navigator.clipboard.writeText(window.location.origin + url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`detail-drawer-backdrop${isOpen ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`detail-drawer${isOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${listing.title}`}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Drag handle (mobile) */}
        <div className="detail-drawer__drag-handle" aria-hidden="true" />

        {/* Header */}
        <div className="detail-drawer__header">
          <h2 className="detail-drawer__title">{listing.title}</h2>
          <a
            className="detail-drawer__view-full"
            href={listingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Full page
          </a>
          <button
            className="detail-drawer__share"
            onClick={handleShare}
            aria-label="Share this listing"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          <button
            className="detail-drawer__close"
            onClick={onClose}
            aria-label="Close listing details"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {shareToast && <div className="detail-drawer__toast">Link copied!</div>}
        </div>

        {/* Scrollable body */}
        <div ref={drawerBodyRef} className="detail-drawer__body">
          {/* 1. Photo gallery */}
          {hasImages && (
            <div className="detail-drawer__gallery">
              <img
                src={listing.images[currentImageIndex]}
                alt={`${listing.title} photo ${currentImageIndex + 1}`}
                loading="lazy"
                decoding="async"
              />
              <FavoriteButton
                listingId={listingId}
                userId={userId}
                initialFavorited={isFavorited}
                onToggle={(newState, id) => {
                  if (onToggleFavorite) onToggleFavorite(id, listing.title, newState);
                }}
                onRequireAuth={onRequireAuth}
                size="medium"
              />
              {hasMultipleImages && (
                <>
                  <button
                    className="detail-drawer__gallery-nav detail-drawer__gallery-nav--prev"
                    onClick={handlePrevImage}
                    aria-label="Previous photo"
                  >
                    &#8249;
                  </button>
                  <button
                    className="detail-drawer__gallery-nav detail-drawer__gallery-nav--next"
                    onClick={handleNextImage}
                    aria-label="Next photo"
                  >
                    &#8250;
                  </button>
                  <div className="detail-drawer__gallery-counter">
                    {currentImageIndex + 1} / {listing.images.length}
                  </div>
                </>
              )}
            </div>
          )}

          {!hasImages && (
            <div className="detail-drawer__gallery detail-drawer__gallery--placeholder" role="img" aria-label="No listing photos available">
              <span>No photos available</span>
            </div>
          )}

          {/* 2. Title, location, meta */}
          <div className="detail-drawer__section">
            <div className="detail-drawer__location">{listing.location}</div>
            <h3 className="detail-drawer__listing-title">{listing.title}</h3>
            <div className="detail-drawer__meta">
              <span className="detail-drawer__meta-item">
                <strong>{listing.type || 'Entire Place'}</strong>
              </span>
              <span className="detail-drawer__meta-item">
                <strong>{listing.maxGuests}</strong> guests
              </span>
              <span className="detail-drawer__meta-item">
                <strong>{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed`}</strong>
              </span>
              <span className="detail-drawer__meta-item">
                <strong>{listing.bathrooms}</strong> bath
              </span>
              {listing.squareFeet && (
                <span className="detail-drawer__meta-item">
                  <strong>{listing.squareFeet}</strong> sq ft
                </span>
              )}
            </div>
          </div>

          {/* 3. Pricing + badge (above the fold) */}
          {pricingChips.length > 0 && (
            <div className="detail-drawer__section">
              <div className="detail-drawer__section-heading-row">
                <h4 className="detail-drawer__section-heading">Nightly rates</h4>
                {priceBadge && (
                  <span className={`detail-drawer__price-badge ${priceBadge.className}`}>
                    {priceBadge.label}
                  </span>
                )}
              </div>
              <div className="detail-drawer__pricing-grid">
                {pricingChips.map(({ nights, price }) => (
                  <div
                    key={nights}
                    className={`detail-drawer__price-chip${nights === selectedNightsCount ? ' detail-drawer__price-chip--active' : ''}`}
                  >
                    <div className="detail-drawer__price-nights">
                      {nights} night{nights !== 1 ? 's' : ''}/wk
                    </div>
                    <div className="detail-drawer__price-amount">
                      ${price.toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Social proof (conversion accelerator) */}
          {(listing.favoriteCount > 0 || listing.isTrialAllowed) && (
            <div className="detail-drawer__section">
              <div className="detail-drawer__social-proof">
                {listing.favoriteCount > 0 && (
                  <span className="detail-drawer__social-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                    Saved by {listing.favoriteCount} guests
                  </span>
                )}
                {listing.isTrialAllowed && (
                  <span className="detail-drawer__social-badge detail-drawer__social-badge--trial">
                    Trial available
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 5. Transit / check-in / check-out */}
          {(hasTransit || hasCheckTimes || listing.weeks_offered) && (
            <div className="detail-drawer__section">
              <h4 className="detail-drawer__section-heading">Schedule & Transit</h4>
              <ul className="detail-drawer__details-list">
                {hasTransit && (
                  <li className="detail-drawer__detail-item">
                    <svg className="detail-drawer__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="3" width="16" height="18" rx="2" />
                      <circle cx="8.5" cy="15.5" r="1.5" />
                      <circle cx="15.5" cy="15.5" r="1.5" />
                      <path d="M4 11h16" />
                    </svg>
                    <span><span className="detail-drawer__detail-label">Transit:</span> {listing.transitTime}</span>
                  </li>
                )}
                {listing.checkInTime && (
                  <li className="detail-drawer__detail-item">
                    <svg className="detail-drawer__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span><span className="detail-drawer__detail-label">Check-in:</span> {listing.checkInTime}</span>
                  </li>
                )}
                {listing.checkOutTime && (
                  <li className="detail-drawer__detail-item">
                    <svg className="detail-drawer__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span><span className="detail-drawer__detail-label">Check-out:</span> {listing.checkOutTime}</span>
                  </li>
                )}
                {listing.weeks_offered && (
                  <li className="detail-drawer__detail-item">
                    <svg className="detail-drawer__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span><span className="detail-drawer__detail-label">Schedule:</span> {listing.weeks_offered}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* 6. Host */}
          <div className="detail-drawer__section">
            <div className="detail-drawer__host">
              {listing.host?.image ? (
                <img src={listing.host.image} alt={listing.host.name} className="detail-drawer__host-avatar" loading="lazy" decoding="async" />
              ) : (
                <div className="detail-drawer__host-avatar-placeholder">?</div>
              )}
              <span className="detail-drawer__host-name">
                Hosted by {formatHostName({ fullName: listing.host?.name || 'Host' })}
                {listing.host?.verified && <span className="detail-drawer__host-verified" title="Verified">&#10003;</span>}
              </span>
            </div>
          </div>

          {/* 7. Description (truncated) */}
          {hasDescription && (
            <div className="detail-drawer__section">
              <h4 className="detail-drawer__section-heading">About this space</h4>
              <p className={`detail-drawer__description${!descExpanded ? ' detail-drawer__description--truncated' : ''}`}>
                {listing.listingDescription}
              </p>
              {listing.listingDescription.length > 300 && (
                <button
                  className="detail-drawer__read-more"
                  onClick={() => setDescExpanded(prev => !prev)}
                >
                  {descExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {/* 8. Amenities (grouped by unit/building) */}
          {hasAnyAmenities && (
            <div className="detail-drawer__section">
              <h4 className="detail-drawer__section-heading">Amenities</h4>
              {hasUnitAmenities && (
                <>
                  {hasBuildingAmenities && <div className="detail-drawer__amenity-group-label">In-Unit</div>}
                  <div className="detail-drawer__amenities">
                    {listing.unitAmenities.map((amenity, idx) => (
                      <div key={`u-${idx}`} className="detail-drawer__amenity">
                        {normalizeIconUrl(amenity.icon)
                          ? <img src={normalizeIconUrl(amenity.icon)} alt="" className="detail-drawer__amenity-img" loading="lazy" decoding="async" />
                          : null}
                        <span>{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {hasBuildingAmenities && (
                <>
                  {hasUnitAmenities && <div className="detail-drawer__amenity-group-label">Building</div>}
                  <div className="detail-drawer__amenities">
                    {listing.buildingAmenities.map((amenity, idx) => (
                      <div key={`b-${idx}`} className="detail-drawer__amenity">
                        {normalizeIconUrl(amenity.icon)
                          ? <img src={normalizeIconUrl(amenity.icon)} alt="" className="detail-drawer__amenity-img" loading="lazy" decoding="async" />
                          : null}
                        <span>{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 9. Details (parking, storage, kitchen, stay constraints) */}
          {hasDetails && (
            <div className="detail-drawer__section">
              <h4 className="detail-drawer__section-heading">Details</h4>
              <ul className="detail-drawer__details-list">
                {listing.kitchenType && (
                  <li className="detail-drawer__detail-item">
                    <svg className="detail-drawer__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
                    </svg>
                    <span><span className="detail-drawer__detail-label">Kitchen:</span> {listing.kitchenType}</span>
                  </li>
                )}
                {listing.parkingOption && (
                  <li className="detail-drawer__detail-item">
                    <svg className="detail-drawer__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="22" height="18" rx="2" /><path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
                    </svg>
                    <span><span className="detail-drawer__detail-label">Parking:</span> {listing.parkingOption.label}</span>
                  </li>
                )}
                {listing.storageOption && (
                  <li className="detail-drawer__detail-item">
                    <svg className="detail-drawer__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    <span><span className="detail-drawer__detail-label">Storage:</span> {listing.storageOption.title || listing.storageOption.summaryGuest}</span>
                  </li>
                )}
                {hasStayConstraints && (
                  <li className="detail-drawer__detail-item">
                    <svg className="detail-drawer__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                    </svg>
                    <span>
                      <span className="detail-drawer__detail-label">Stay:</span>
                      {listing.minNightsPerStay && ` ${listing.minNightsPerStay}${listing.maxNightsPerStay ? `–${listing.maxNightsPerStay}` : '+'} nights/wk`}
                      {listing.minWeeksPerStay && ` · ${listing.minWeeksPerStay}${listing.maxWeeksPerStay ? `–${listing.maxWeeksPerStay}` : '+'} weeks`}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* 10. Rules + Safety + Cancellation (collapsed) */}
          {hasRulesSafetyCancellation && (
            <div className="detail-drawer__section">
              <button
                className="detail-drawer__collapse-toggle"
                onClick={() => setRulesExpanded(prev => !prev)}
                aria-expanded={rulesExpanded}
              >
                <h4 className="detail-drawer__section-heading">Rules, Safety & Cancellation</h4>
                <svg className={`detail-drawer__collapse-chevron${rulesExpanded ? ' detail-drawer__collapse-chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {rulesExpanded && (
                <div className="detail-drawer__collapse-content">
                  {hasHouseRules && (
                    <div className="detail-drawer__collapse-group">
                      <div className="detail-drawer__amenity-group-label">House Rules</div>
                      <div className="detail-drawer__chips">
                        {listing.houseRules.map((rule, idx) => (
                          <span key={idx} className="detail-drawer__chip">
                            {normalizeIconUrl(rule.icon)
                              ? <img src={normalizeIconUrl(rule.icon)} alt="" className="detail-drawer__chip-icon" loading="lazy" decoding="async" />
                              : null}
                            {rule.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasSafetyFeatures && (
                    <div className="detail-drawer__collapse-group">
                      <div className="detail-drawer__amenity-group-label">Safety</div>
                      <div className="detail-drawer__chips">
                        {listing.safetyFeatures.map((feature, idx) => (
                          <span key={idx} className="detail-drawer__chip detail-drawer__chip--safety">
                            {normalizeIconUrl(feature.icon)
                              ? <img src={normalizeIconUrl(feature.icon)} alt="" className="detail-drawer__chip-icon" loading="lazy" decoding="async" />
                              : null}
                            {feature.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {listing.cancellationPolicy && (
                    <div className="detail-drawer__collapse-group">
                      <div className="detail-drawer__amenity-group-label">Cancellation</div>
                      <div className="detail-drawer__cancellation">
                        <span className="detail-drawer__cancellation-label">{listing.cancellationPolicy.display}</span>
                        {listing.cancellationPolicy.bestCaseText && (
                          <p className="detail-drawer__cancellation-text">{listing.cancellationPolicy.bestCaseText}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 11. Neighborhood */}
          {hasNeighborhoodDesc && (
            <div className="detail-drawer__section">
              <h4 className="detail-drawer__section-heading">Neighborhood</h4>
              <p className="detail-drawer__neighborhood-desc">{resolvedNeighborhoodDesc}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="detail-drawer__footer">
          <button
            className="detail-drawer__btn detail-drawer__btn--secondary"
            onClick={() => {
              if (onOpenContactModal) onOpenContactModal(listing);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Message
          </button>
          {showCreateProposalButton && (
            proposalForListing ? (
              <button
                className="detail-drawer__btn detail-drawer__btn--primary"
                onClick={() => {
                  window.location.href = `/guest-proposals?proposal=${proposalForListing._id}`;
                }}
              >
                View Proposal
              </button>
            ) : (
              <button
                className="detail-drawer__btn detail-drawer__btn--primary"
                onClick={() => {
                  if (onOpenCreateProposalModal) onOpenCreateProposalModal(listing);
                }}
              >
                Create Proposal
              </button>
            )
          )}
          <a
            className="detail-drawer__btn detail-drawer__btn--primary"
            href={listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            View Full Listing
          </a>
        </div>
      </div>
    </>
  );
}
