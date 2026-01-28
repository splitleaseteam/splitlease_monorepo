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
 * - Focus states: Visible focus indicators
 *
 * Design Features:
 * - Hero image with 16:9 aspect ratio
 * - Favorite button, price badge, photo count overlaid on hero
 * - Content section: location, title, meta row (rating + stats)
 * - AI Summary section with gradient background
 * - Host row with avatar and action button
 *
 * To switch back to V2, change USE_CARD_V3 to false in FavoriteListingsPage.jsx
 */

import { useState, useRef, useEffect, memo } from 'react';
import { useDeviceDetection } from '../../../../hooks/useDeviceDetection.js';

// Premium Design Tokens - V6 WCAG AA Compliant Colors
const TOKENS = {
  colors: {
    // Primary palette
    primary: '#1E0A3C',
    primaryRich: '#31135D',
    primaryAccent: '#5B28A6',      // WCAG 5.5:1 contrast on white
    primaryLight: '#F5F0FA',
    primaryGlow: 'rgba(109, 49, 194, 0.15)',

    // Text colors - All meet WCAG AA 4.5:1 on white
    text: '#1A1A1A',              // 16.1:1 contrast
    textSecondary: '#4A4A4A',     // 7.7:1 contrast
    textMuted: '#595959',         // 5.9:1 contrast
    textLight: '#6B6B6B',         // 5.0:1 contrast

    // Accent colors
    gold: '#8B6914',
    goldLight: '#F5EFE0',
    danger: '#B91C1C',

    // UI colors
    border: 'rgba(0, 0, 0, 0.12)',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    card: '#FFFFFF',
    bg: '#FAFAFA',

    // Focus state
    focus: '#1E0A3C',
  },
  spacing: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    pill: '100px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
    lg: '0 8px 20px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.05)',
    glow: '0 0 30px rgba(109, 49, 194, 0.15)',
  },
  // Typography
  fontSize: {
    xs: '14px',     // WCAG smallest for readable content
    sm: '15px',
    base: '16px',   // WCAG minimum for body text
    md: '18px',
    lg: '20px',
    xl: '26px',
  },
  lineHeight: {
    tight: 1.3,
    normal: 1.5,
    relaxed: 1.6,
  },
  // WCAG minimums
  touchTarget: '44px',
};

/**
 * FavoriteButton with confirmation popup
 * WCAG: 44x44px touch target, proper ARIA labels
 */
const FavoriteButton = ({ onConfirmRemove, style }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const popupRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showConfirm && popupRef.current && !popupRef.current.contains(e.target) && !buttonRef.current?.contains(e.target)) {
        setShowConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showConfirm]);

  // Handle escape key for accessibility
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
      width: TOKENS.touchTarget,
      height: TOKENS.touchTarget,
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '2px solid transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.15s ease',
      boxSizing: 'border-box',
    },
    popup: {
      position: 'absolute',
      bottom: '52px',
      right: '0',
      background: 'white',
      borderRadius: TOKENS.radius.md,
      boxShadow: TOKENS.shadows.lg,
      padding: TOKENS.spacing.lg,
      minWidth: '200px',
      zIndex: 100,
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
      padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.md}`,
      minHeight: TOKENS.touchTarget,
      borderRadius: TOKENS.radius.sm,
      border: `2px solid ${TOKENS.colors.border}`,
      background: 'white',
      color: TOKENS.colors.textSecondary,
      fontSize: TOKENS.fontSize.xs,
      fontWeight: 600,
      cursor: 'pointer',
    },
    removeBtn: {
      flex: 1,
      padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.md}`,
      minHeight: TOKENS.touchTarget,
      borderRadius: TOKENS.radius.sm,
      border: 'none',
      background: TOKENS.colors.danger,
      color: 'white',
      fontSize: TOKENS.fontSize.xs,
      fontWeight: 600,
      cursor: 'pointer',
    },
  };

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
        <svg width="20" height="20" viewBox="0 0 24 24" fill={TOKENS.colors.danger} stroke={TOKENS.colors.danger} strokeWidth="2" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {showConfirm && (
        <div
          ref={popupRef}
          style={styles.popup}
          role="dialog"
          aria-label="Confirm removal"
        >
          <div style={styles.popupText}>Remove from favorites?</div>
          <div style={styles.popupButtons}>
            <button
              style={styles.cancelBtn}
              onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
            >
              Cancel
            </button>
            <button
              style={styles.removeBtn}
              onClick={(e) => { e.stopPropagation(); setShowConfirm(false); onConfirmRemove?.(); }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * FavoritesCardV3 - V6 Vertical Card Design
 * WCAG 2.1 AA Compliant
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

  // Get host info from listing
  const hostName = listing.host?.name || listing.hostName || 'Host';
  const hostAvatar = listing.host?.image || listing.hostAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face';

  // Generate AI insight (placeholder - would come from backend)
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

  const isCompact = isMobile || isSmallMobile;

  const styles = {
    card: {
      display: 'flex',
      flexDirection: 'column',
      background: TOKENS.colors.card,
      borderRadius: TOKENS.radius.xl,
      overflow: 'hidden',
      boxShadow: isHovered && !isTouchDevice ? `${TOKENS.shadows.lg}, ${TOKENS.shadows.glow}` : TOKENS.shadows.md,
      transition: isTouchDevice ? 'none' : 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      transform: isHovered && !isTouchDevice ? 'translateY(-4px)' : 'none',
      cursor: 'pointer',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      border: `2px solid ${TOKENS.colors.border}`,
      boxSizing: 'border-box',
    },

    // HERO SECTION - 16:9 aspect ratio
    heroSection: {
      position: 'relative',
      padding: TOKENS.spacing.lg,
      paddingBottom: 0,
    },
    heroWrapper: {
      position: 'relative',
      borderRadius: TOKENS.radius.lg,
      overflow: 'hidden',
      aspectRatio: '16 / 9',
    },
    heroImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      transform: isHovered && !isTouchDevice ? 'scale(1.03)' : 'scale(1)',
    },
    heroOverlay: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.4) 100%)',
      pointerEvents: 'none',
    },

    // Overlays on hero image
    favoriteBtn: {
      position: 'absolute',
      top: TOKENS.spacing.sm,
      right: TOKENS.spacing.sm,
      zIndex: 10,
    },
    priceBadge: {
      position: 'absolute',
      bottom: TOKENS.spacing.sm,
      left: TOKENS.spacing.sm,
      padding: '8px 14px',
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: TOKENS.radius.sm,
      zIndex: 10,
    },
    priceValue: {
      fontSize: TOKENS.fontSize.md,
      fontWeight: 800,
      color: TOKENS.colors.text,
    },
    pricePeriod: {
      fontSize: TOKENS.fontSize.xs,
      fontWeight: 500,
      color: TOKENS.colors.textMuted,
    },
    photoCount: {
      position: 'absolute',
      bottom: TOKENS.spacing.sm,
      right: TOKENS.spacing.sm,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      background: 'rgba(0, 0, 0, 0.75)',
      borderRadius: TOKENS.radius.pill,
      fontSize: TOKENS.fontSize.xs,
      fontWeight: 600,
      color: 'white',
      zIndex: 10,
    },

    // CONTENT SECTION
    contentSection: {
      padding: TOKENS.spacing.xl,
    },
    location: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: TOKENS.fontSize.xs,
      fontWeight: 700,
      color: TOKENS.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      marginBottom: TOKENS.spacing.sm,
    },
    title: {
      fontSize: TOKENS.fontSize.md,
      fontWeight: 700,
      color: TOKENS.colors.text,
      lineHeight: TOKENS.lineHeight.tight,
      marginBottom: TOKENS.spacing.md,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    metaRow: {
      display: 'flex',
      alignItems: 'center',
      gap: TOKENS.spacing.lg,
      marginBottom: TOKENS.spacing.lg,
      flexWrap: 'wrap',
    },
    rating: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: TOKENS.fontSize.base,
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
      fontSize: TOKENS.fontSize.base,
      color: TOKENS.colors.textSecondary,
    },
    statDivider: {
      width: '4px',
      height: '4px',
      borderRadius: '50%',
      background: TOKENS.colors.textLight,
    },

    // AI SUMMARY SECTION
    aiSummary: {
      background: `linear-gradient(135deg, ${TOKENS.colors.primaryLight} 0%, #F8F5FF 100%)`,
      borderRadius: TOKENS.radius.md,
      padding: TOKENS.spacing.lg,
      marginBottom: TOKENS.spacing.lg,
      border: '2px solid rgba(30, 10, 60, 0.15)',
    },
    aiHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: TOKENS.spacing.sm,
    },
    aiIcon: {
      width: '24px',
      height: '24px',
      background: `linear-gradient(135deg, ${TOKENS.colors.primaryRich} 0%, ${TOKENS.colors.primaryAccent} 100%)`,
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiLabel: {
      fontSize: TOKENS.fontSize.xs,
      fontWeight: 700,
      color: TOKENS.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    aiText: {
      fontSize: TOKENS.fontSize.base,
      lineHeight: TOKENS.lineHeight.relaxed,
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
      paddingTop: TOKENS.spacing.lg,
      borderTop: `2px solid ${TOKENS.colors.border}`,
      gap: TOKENS.spacing.md,
    },
    hostMini: {
      display: 'flex',
      alignItems: 'center',
      gap: TOKENS.spacing.sm,
    },
    hostAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '2px solid white',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
    },
    hostName: {
      fontSize: TOKENS.fontSize.base,
      fontWeight: 600,
      color: TOKENS.colors.text,
    },
    actionBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: `${TOKENS.spacing.md} ${TOKENS.spacing.xl}`,
      borderRadius: TOKENS.radius.pill,
      fontSize: TOKENS.fontSize.base,
      fontWeight: 600,
      cursor: 'pointer',
      border: 'none',
      background: `linear-gradient(135deg, ${TOKENS.colors.primaryRich} 0%, ${TOKENS.colors.primary} 100%)`,
      color: 'white',
      boxShadow: '0 2px 8px rgba(30, 10, 60, 0.25)',
      transition: 'all 0.15s ease',
      minHeight: TOKENS.touchTarget,
      minWidth: TOKENS.touchTarget,
      boxSizing: 'border-box',
    },
  };

  return (
    <article
      style={styles.card}
      onClick={handleCardClick}
      onMouseEnter={() => !isTouchDevice && setIsHovered(true)}
      onMouseLeave={() => !isTouchDevice && setIsHovered(false)}
      aria-labelledby={`listing-title-${listing.id}`}
    >
      {/* HERO SECTION */}
      <div style={styles.heroSection}>
        <div style={styles.heroWrapper}>
          <img
            src={imageError ? 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&h=600&fit=crop&q=90' : mainPhoto}
            alt={`Interior view of ${listing.title}`}
            style={styles.heroImage}
            onError={() => setImageError(true)}
          />
          <div style={styles.heroOverlay} aria-hidden="true" />

          {/* Favorite Button */}
          <div style={styles.favoriteBtn}>
            <FavoriteButton
              onConfirmRemove={() => onToggleFavorite?.(listing.id, listing.title, false)}
            />
          </div>

          {/* Price Badge */}
          <div style={styles.priceBadge}>
            <span style={styles.priceValue}>
              ${listing.price?.starting || listing['Starting nightly price'] || 0}
            </span>
            <span style={styles.pricePeriod}>/night</span>
          </div>

          {/* Photo Count */}
          <div style={styles.photoCount} aria-label={`${photoCount} photos available`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {listing.location || listing.neighborhood || 'New York, NY'}
        </div>

        {/* Title */}
        <h2 style={styles.title} id={`listing-title-${listing.id}`}>
          {listing.title}
        </h2>

        {/* Meta Row */}
        <div style={styles.metaRow}>
          <div style={styles.rating}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={TOKENS.colors.primary} stroke={TOKENS.colors.primary} strokeWidth="2" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span aria-label={`${listing.rating || '4.8'} out of 5 stars`}>{listing.rating || '4.8'}</span>
            <span style={styles.ratingCount}>({listing.reviewCount || 0} reviews)</span>
          </div>
          <div style={styles.stats}>
            <span>{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} BR`}</span>
            <span style={styles.statDivider} aria-hidden="true" />
            <span>{listing.maxGuests} guests</span>
          </div>
        </div>

        {/* AI SUMMARY */}
        <div style={styles.aiSummary} role="complementary" aria-label="AI generated insight">
          <div style={styles.aiHeader}>
            <div style={styles.aiIcon} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span style={styles.aiLabel}>AI Insight</span>
          </div>
          <p style={styles.aiText}>{aiInsight}</p>
        </div>

        {/* HOST ROW */}
        <div style={styles.hostRow}>
          <div style={styles.hostMini}>
            <img
              style={styles.hostAvatar}
              src={hostAvatar}
              alt={`Host ${hostName}`}
            />
            <span style={styles.hostName}>{hostName}</span>
          </div>
          <button
            style={styles.actionBtn}
            onClick={hasProposal ? handleViewProposal : handleCreateProposal}
            aria-label={hasProposal ? `View proposal for ${listing.title}` : `Create proposal for ${listing.title}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
 * This is a placeholder - would be replaced with actual AI-generated content from backend
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

  // Use listing id to consistently pick the same insight
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
