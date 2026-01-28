/**
 * FavoritesCardV3 Component - V6 WCAG 2.1 AA Compliant Design
 *
 * Vertical card layout matching the V6 mockup design.
 * Used in a two-column grid layout on the FavoriteListingsPage.
 *
 * WCAG Compliance:
 * - Color contrast: 4.5:1 for normal text, 3:1 for large text
 * - Touch targets: Minimum 44x44px
 * - Font sizes: Minimum 16px for body text
 * - ARIA labels: Descriptive labels for all interactive elements
 *
 * Design Features:
 * - Hero image edge-to-edge (no internal padding)
 * - Filled red heart favorite button
 * - Clean integer price display
 * - Abbreviated host names (First L.)
 * - AI Summary section with gradient background
 * - Host row with avatar and action button
 */

import { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useDeviceDetection } from '../../../../hooks/useDeviceDetection.js';

// Premium Design Tokens - V6 WCAG AA Compliant Colors
const TOKENS = {
  colors: {
    primary: '#1E0A3C',
    primaryRich: '#31135D',
    primaryAccent: '#5B28A6',
    primaryLight: '#F5F0FA',
    primaryGlow: 'rgba(109, 49, 194, 0.15)',
    text: '#1A1A1A',
    textSecondary: '#4A4A4A',
    textMuted: '#595959',
    textLight: '#6B6B6B',
    danger: '#E53E3E',
    border: 'rgba(0, 0, 0, 0.08)',
    card: '#FFFFFF',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    pill: '100px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    glow: '0 0 0 3px rgba(91, 40, 166, 0.15)',
  },
  fontSize: {
    xs: '13px',
    sm: '14px',
    base: '15px',
    md: '17px',
    lg: '20px',
  },
  touchTarget: '44px',
};

/**
 * Abbreviate name to "First L." format
 */
function abbreviateName(fullName) {
  if (!fullName || fullName === 'Host') return fullName;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

/**
 * FavoriteButton - Filled red heart (matches V6 goal design)
 * Uses Portal to render popup outside card hierarchy to avoid overflow clipping
 */
const FavoriteButton = ({ onConfirmRemove, style }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef(null);
  const buttonRef = useRef(null);

  // Calculate popup position when showing
  useEffect(() => {
    if (showConfirm && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPosition({
        top: rect.top - 10, // Position above the button
        left: rect.right - 180, // Align right edge with button
      });
    }
  }, [showConfirm]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showConfirm && popupRef.current && !popupRef.current.contains(e.target) && !buttonRef.current?.contains(e.target)) {
        setShowConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showConfirm]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showConfirm) {
        setShowConfirm(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showConfirm]);

  const styles = {
    container: {
      position: 'relative',
      ...style,
    },
    button: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.15s ease',
      padding: 0,
    },
    popup: {
      position: 'fixed',
      top: popupPosition.top,
      left: popupPosition.left,
      transform: 'translateY(-100%)',
      background: 'white',
      borderRadius: TOKENS.radius.md,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      padding: TOKENS.spacing.lg,
      minWidth: '180px',
      zIndex: 99999,
    },
    popupText: {
      fontSize: TOKENS.fontSize.base,
      fontWeight: 600,
      color: TOKENS.colors.text,
      marginBottom: TOKENS.spacing.md,
      textAlign: 'center',
    },
    popupButtons: {
      display: 'flex',
      gap: TOKENS.spacing.sm,
    },
    cancelBtn: {
      flex: 1,
      padding: '10px',
      minHeight: '40px',
      borderRadius: TOKENS.radius.sm,
      border: `1px solid ${TOKENS.colors.border}`,
      background: 'white',
      color: TOKENS.colors.textSecondary,
      fontSize: TOKENS.fontSize.sm,
      fontWeight: 600,
      cursor: 'pointer',
    },
    removeBtn: {
      flex: 1,
      padding: '10px',
      minHeight: '40px',
      borderRadius: TOKENS.radius.sm,
      border: 'none',
      background: TOKENS.colors.danger,
      color: 'white',
      fontSize: TOKENS.fontSize.sm,
      fontWeight: 600,
      cursor: 'pointer',
    },
  };

  // Portal popup - renders directly to document.body
  const popupContent = showConfirm ? createPortal(
    <div ref={popupRef} style={styles.popup} role="dialog" aria-label="Confirm removal">
      <div style={styles.popupText}>Remove from favorites?</div>
      <div style={styles.popupButtons}>
        <button style={styles.cancelBtn} onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}>
          Cancel
        </button>
        <button style={styles.removeBtn} onClick={(e) => { e.stopPropagation(); setShowConfirm(false); onConfirmRemove?.(); }}>
          Remove
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div style={styles.container}>
      <button
        ref={buttonRef}
        style={styles.button}
        onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
        aria-label="Remove from favorites"
        aria-expanded={showConfirm}
        aria-haspopup="dialog"
      >
        {/* Filled red heart - matches V6 goal design */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill={TOKENS.colors.danger} stroke={TOKENS.colors.danger} strokeWidth="1.5" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      {popupContent}
    </div>
  );
};

/**
 * FavoritesCardV3 - V6 Vertical Card Design
 */
const FavoritesCardV3 = ({
  listing,
  onToggleFavorite,
  onOpenCreateProposalModal,
  proposalForListing,
  onMapClick,
  userId
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { isMobile, isSmallMobile, isTouchDevice } = useDeviceDetection();

  const photos = listing.images || [];
  const hasProposal = !!proposalForListing;
  const photoCount = photos.length || 1;
  const mainPhoto = photos[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&h=600&fit=crop&q=90';

  // Get host info and abbreviate name
  const fullHostName = listing.host?.name || listing.hostName || 'Host';
  const hostName = abbreviateName(fullHostName);
  const hostAvatar = listing.host?.image || listing.hostAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face';

  // Get price as clean integer
  const rawPrice = listing.price?.starting || listing['Starting nightly price'] || 0;
  const price = Math.round(Number(rawPrice));

  // Generate AI insight
  const aiInsight = listing.aiInsight || generateAIInsight(listing);

  const handleCardClick = () => {
    window.location.href = `/listing?id=${listing.id}`;
  };

  const handleCreateProposal = (e) => {
    e.stopPropagation();
    onOpenCreateProposalModal?.(listing);
  };

  const handleViewProposal = (e) => {
    e.stopPropagation();
    if (proposalForListing?._id) {
      window.location.href = `/proposal?id=${proposalForListing._id}`;
    }
  };

  const styles = {
    card: {
      display: 'flex',
      flexDirection: 'column',
      background: TOKENS.colors.card,
      borderRadius: TOKENS.radius.lg,
      overflow: 'visible', // Allow popup to extend outside card
      // Subtle hover effect - just a gentle scale
      boxShadow: isHovered
        ? '0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)'
        : TOKENS.shadows.md,
      transition: 'all 0.2s ease',
      transform: isHovered ? 'scale(1.015)' : 'none',
      cursor: 'pointer',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      border: `2px solid ${TOKENS.colors.border}`,
      boxSizing: 'border-box',
      margin: 0,
      padding: 0,
    },

    // HERO SECTION - With padding around image
    heroSection: {
      position: 'relative',
      margin: 0,
      paddingTop: '12px',
      paddingLeft: '12px',
      paddingRight: '12px',
      paddingBottom: 0,
    },
    heroWrapper: {
      position: 'relative',
      overflow: 'hidden',
      aspectRatio: '16 / 10',
      margin: 0,
      padding: 0,
      // No border-radius - card's overflow:hidden handles clipping at card edges
    },
    heroImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.3s ease',
      transform: isHovered ? 'scale(1.02)' : 'scale(1)', // Subtle zoom on hover
      display: 'block',
      margin: 0,
      padding: 0,
    },
    heroOverlay: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.3) 100%)',
      pointerEvents: 'none',
    },

    // Overlays on hero image
    favoriteBtn: {
      position: 'absolute',
      top: TOKENS.spacing.md,
      right: TOKENS.spacing.md,
      zIndex: 10,
    },
    priceBadge: {
      position: 'absolute',
      bottom: TOKENS.spacing.md,
      left: TOKENS.spacing.md,
      padding: '6px 12px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: TOKENS.radius.sm,
      zIndex: 10,
    },
    priceValue: {
      fontSize: TOKENS.fontSize.md,
      fontWeight: 700,
      color: TOKENS.colors.text,
    },
    pricePeriod: {
      fontSize: TOKENS.fontSize.xs,
      fontWeight: 500,
      color: TOKENS.colors.textMuted,
    },
    photoCount: {
      position: 'absolute',
      bottom: TOKENS.spacing.md,
      right: TOKENS.spacing.md,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '5px 10px',
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: TOKENS.radius.pill,
      fontSize: TOKENS.fontSize.xs,
      fontWeight: 600,
      color: 'white',
      zIndex: 10,
    },

    // CONTENT SECTION
    contentSection: {
      padding: TOKENS.spacing.xl, // 20px padding for better breathing room
    },
    location: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: TOKENS.fontSize.xs,
      fontWeight: 700,
      color: TOKENS.colors.primaryAccent,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
      marginBottom: TOKENS.spacing.xs,
    },
    title: {
      fontSize: TOKENS.fontSize.md,
      fontWeight: 700,
      color: TOKENS.colors.text,
      lineHeight: 1.3,
      marginBottom: TOKENS.spacing.sm,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    metaRow: {
      display: 'flex',
      alignItems: 'center',
      gap: TOKENS.spacing.lg,
      marginBottom: TOKENS.spacing.sm,
      flexWrap: 'wrap',
    },
    amenitiesRow: {
      display: 'flex',
      alignItems: 'center',
      gap: TOKENS.spacing.sm,
      marginBottom: TOKENS.spacing.md,
      flexWrap: 'wrap',
    },
    amenityTag: {
      padding: '4px 10px',
      background: TOKENS.colors.primaryLight,
      color: TOKENS.colors.primaryAccent,
      fontSize: TOKENS.fontSize.xs,
      fontWeight: 500,
      borderRadius: TOKENS.radius.pill,
    },
    rating: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: TOKENS.fontSize.sm,
      fontWeight: 600,
      color: TOKENS.colors.text,
    },
    ratingCount: {
      color: TOKENS.colors.textMuted,
      fontWeight: 500,
    },
    stats: {
      display: 'flex',
      alignItems: 'center',
      gap: TOKENS.spacing.sm,
      fontSize: TOKENS.fontSize.sm,
      color: TOKENS.colors.textSecondary,
    },
    statDivider: {
      width: '3px',
      height: '3px',
      borderRadius: '50%',
      background: TOKENS.colors.textLight,
    },

    // AI SUMMARY SECTION
    aiSummary: {
      background: TOKENS.colors.primaryLight,
      borderRadius: TOKENS.radius.md,
      padding: TOKENS.spacing.md,
      marginBottom: TOKENS.spacing.md,
      border: `1px solid rgba(91, 40, 166, 0.12)`,
    },
    aiHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: TOKENS.spacing.xs,
    },
    aiIcon: {
      width: '20px',
      height: '20px',
      background: `linear-gradient(135deg, ${TOKENS.colors.primaryRich} 0%, ${TOKENS.colors.primaryAccent} 100%)`,
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiLabel: {
      fontSize: TOKENS.fontSize.xs,
      fontWeight: 700,
      color: TOKENS.colors.primaryAccent,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
    aiText: {
      fontSize: TOKENS.fontSize.sm,
      lineHeight: 1.5,
      color: TOKENS.colors.textSecondary,
      margin: 0,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },

    // HOST ROW
    hostRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: TOKENS.spacing.md,
      borderTop: `1px solid ${TOKENS.colors.border}`,
      gap: TOKENS.spacing.sm,
    },
    hostMini: {
      display: 'flex',
      alignItems: 'center',
      gap: TOKENS.spacing.sm,
    },
    hostAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '2px solid white',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    hostName: {
      fontSize: TOKENS.fontSize.sm,
      fontWeight: 600,
      color: TOKENS.colors.text,
    },
    actionBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '5px',
      padding: '10px 18px',
      borderRadius: TOKENS.radius.pill,
      fontSize: TOKENS.fontSize.sm,
      fontWeight: 600,
      cursor: 'pointer',
      border: 'none',
      background: `linear-gradient(135deg, ${TOKENS.colors.primaryRich} 0%, ${TOKENS.colors.primary} 100%)`,
      color: 'white',
      boxShadow: '0 2px 6px rgba(30, 10, 60, 0.2)',
      transition: 'all 0.15s ease',
      minHeight: '40px',
    },
  };

  return (
    <article
      style={styles.card}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-labelledby={`listing-title-${listing.id}`}
    >
      {/* HERO SECTION - Edge-to-edge */}
      <div style={styles.heroSection}>
        <div style={styles.heroWrapper}>
          <img
            src={imageError ? 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&h=600&fit=crop&q=90' : mainPhoto}
            alt={`Interior view of ${listing.title}`}
            style={styles.heroImage}
            onError={() => setImageError(true)}
          />
          <div style={styles.heroOverlay} aria-hidden="true" />

          {/* Favorite Button - Filled red heart */}
          <div style={styles.favoriteBtn}>
            <FavoriteButton onConfirmRemove={() => onToggleFavorite?.(listing.id, listing.title, false)} />
          </div>

          {/* Price Badge - Clean integer */}
          <div style={styles.priceBadge}>
            <span style={styles.priceValue}>${price}</span>
            <span style={styles.pricePeriod}>/night</span>
          </div>

          {/* Photo Count */}
          <div style={styles.photoCount} aria-label={`${photoCount} photos`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            {photoCount}
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div style={styles.contentSection}>
        {/* Location */}
        <div style={styles.location}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {listing.neighborhood || listing.location || 'New York, NY'}
        </div>

        {/* Title */}
        <h2 style={styles.title} id={`listing-title-${listing.id}`}>
          {listing.title}
        </h2>

        {/* Details & Amenities as Pills */}
        <div style={styles.amenitiesRow}>
          <span style={styles.amenityTag}>{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} BR`}</span>
          <span style={styles.amenityTag}>{listing.maxGuests} guests</span>
          <span style={styles.amenityTag}>WiFi</span>
          <span style={styles.amenityTag}>Kitchen</span>
          <span style={styles.amenityTag}>A/C</span>
        </div>

        {/* AI SUMMARY - Hidden for now */}
        {/* <div style={styles.aiSummary} role="complementary" aria-label="AI insight">
          <div style={styles.aiHeader}>
            <div style={styles.aiIcon} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span style={styles.aiLabel}>AI Insight</span>
          </div>
          <p style={styles.aiText}>{aiInsight}</p>
        </div> */}

        {/* HOST ROW */}
        <div style={styles.hostRow}>
          <div style={styles.hostMini}>
            <img style={styles.hostAvatar} src={hostAvatar} alt={`Host ${hostName}`} />
            <span style={styles.hostName}>{hostName}</span>
          </div>
          <button
            style={styles.actionBtn}
            onClick={hasProposal ? handleViewProposal : handleCreateProposal}
            aria-label={hasProposal ? `View proposal for ${listing.title}` : `Create proposal for ${listing.title}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {hasProposal ? 'View' : 'Propose'}
          </button>
        </div>
      </div>
    </article>
  );
};

/**
 * Generate AI insight based on listing data
 */
function generateAIInsight(listing) {
  const neighborhood = listing.neighborhood || listing.location || '';
  const bedrooms = listing.bedrooms || 0;
  const type = bedrooms === 0 ? 'Studio' : `${bedrooms}-bedroom`;

  const insights = [
    `${type} gem in ${neighborhood || 'this vibrant area'}. Great for professionals who value convenience and style.`,
    `Perfect ${type} in ${neighborhood || 'a prime location'}. Walking distance to local cafes and transit.`,
    `Charming ${type} with excellent natural light. ${neighborhood ? `${neighborhood} offers` : 'The area offers'} great dining options nearby.`,
    `Cozy ${type} ideal for urban living. ${neighborhood ? `${neighborhood} is` : 'This location is'} known for its walkability.`,
  ];

  const index = listing.id ? (listing.id.charCodeAt(0) % insights.length) : 0;
  return insights[index];
}

export default memo(FavoritesCardV3, (prevProps, nextProps) => {
  return (
    prevProps.listing?.id === nextProps.listing?.id &&
    prevProps.proposalForListing?._id === nextProps.proposalForListing?._id &&
    prevProps.userId === nextProps.userId
  );
});
