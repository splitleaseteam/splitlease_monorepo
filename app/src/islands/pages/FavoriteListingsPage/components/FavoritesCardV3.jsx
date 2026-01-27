/**
 * FavoritesCardV3 Component
 *
 * Premium "Featured + Stack" design for favorites.
 * Layout: Large hero image + 2 stacked slots (photo + embedded mini-map)
 *
 * Design Features:
 * - Premium purple color scheme (#1E0A3C primary)
 * - Gold accents for verified badges
 * - Glassmorphism effects
 * - Photo count badge on photo thumbnail
 * - EMBEDDED MINI-MAP: Second slot shows listing location (replaces disconnected sidebar)
 * - Heart button in action bar
 *
 * To switch back to V2, change USE_CARD_V3 to false in FavoriteListingsPage.jsx
 */

import { useState, useRef, useEffect, memo } from 'react';
import { useDeviceDetection } from '../../../../hooks/useDeviceDetection.js';

// Premium Design Tokens
const TOKENS = {
  colors: {
    primary: '#1E0A3C',
    primaryRich: '#31135D',
    primaryAccent: '#6D31C2',
    primaryLight: '#F5F0FA',
    text: '#0D0D0D',
    textSecondary: '#3D3D3D',
    textMuted: '#6B6B6B',
    textLight: '#9A9A9A',
    gold: '#C9A962',
    goldLight: '#F5EFE0',
    danger: '#C53030',
    border: 'rgba(0, 0, 0, 0.06)',
    card: '#FFFFFF',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    pill: '100px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
    glow: '0 0 40px rgba(109, 49, 194, 0.15)',
  },
};

/**
 * FavoriteButton with confirmation popup
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

  const styles = {
    container: {
      position: 'relative',
      ...style,
    },
    button: {
      all: 'unset',
      minHeight: '44px',
      minWidth: '44px',
      padding: TOKENS.spacing.md,
      borderRadius: TOKENS.radius.pill,
      background: 'rgba(197, 48, 48, 0.1)',
      border: '2px solid rgba(197, 48, 48, 0.3)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
      padding: '14px',
      minWidth: '180px',
      zIndex: 100,
    },
    popupText: {
      fontSize: '13px',
      fontWeight: 600,
      color: TOKENS.colors.text,
      marginBottom: '10px',
      textAlign: 'center',
    },
    popupButtons: {
      display: 'flex',
      gap: '8px',
    },
    cancelBtn: {
      flex: 1,
      padding: '8px 12px',
      minHeight: '40px',
      borderRadius: TOKENS.radius.sm,
      border: `1px solid ${TOKENS.colors.border}`,
      background: 'white',
      color: TOKENS.colors.textMuted,
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    removeBtn: {
      flex: 1,
      padding: '8px 12px',
      minHeight: '40px',
      borderRadius: TOKENS.radius.sm,
      border: 'none',
      background: TOKENS.colors.danger,
      color: 'white',
      fontSize: '12px',
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
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={TOKENS.colors.danger} stroke={TOKENS.colors.danger} strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {showConfirm && (
        <div ref={popupRef} style={styles.popup}>
          <div style={styles.popupText}>Remove from favorites?</div>
          <div style={styles.popupButtons}>
            <button style={styles.cancelBtn} onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}>Cancel</button>
            <button style={styles.removeBtn} onClick={(e) => { e.stopPropagation(); setShowConfirm(false); onConfirmRemove?.(); }}>Remove</button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * FavoritesCardV3 - Premium "Featured + Stack" design
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

  const { isMobile, isSmallMobile, isTouchDevice, isTablet } = useDeviceDetection();

  const photos = listing.images || [];
  const hasProposal = !!proposalForListing;
  const photoCount = photos.length || 1;

  // Get first 3 photos for the grid
  const mainPhoto = photos[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&h=600&fit=crop&q=90';
  const thumbPhoto1 = photos[1] || photos[0] || mainPhoto;
  const thumbPhoto2 = photos[2] || photos[1] || photos[0] || mainPhoto;

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

  const handleMessage = (e) => {
    e.stopPropagation();
    // Navigate to messages or open message modal
    window.location.href = `/messages?listing=${listing.id}`;
  };

  const handleMapClick = (e) => {
    e.stopPropagation();
    // Trigger callback to parent (can open full map modal or scroll to sidebar map)
    onMapClick?.(listing);
  };

  // Responsive layout: stack images vertically on mobile
  const isCompact = isMobile || isSmallMobile;

  // Generate Google Static Maps URL for mini-map preview
  const lat = listing.latitude || listing.lat || 40.7128;
  const lng = listing.longitude || listing.lng || -74.006;
  const mapZoom = 14;
  const mapSize = '300x200';
  const mapStyle = 'feature:all|element:geometry|color:0xf5f0fa|saturation:-50&style=feature:road|element:geometry|color:0xe8e0f0&style=feature:water|element:geometry|color:0xd4c8e8';
  const miniMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${mapZoom}&size=${mapSize}&scale=2&markers=color:0x6D31C2|${lat},${lng}&style=${mapStyle}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}`;

  const styles = {
    card: {
      all: 'unset',
      display: 'flex',
      flexDirection: 'column',
      background: TOKENS.colors.card,
      borderRadius: TOKENS.radius.xl,
      overflow: 'hidden',
      boxShadow: isHovered && !isTouchDevice ? `${TOKENS.shadows.xl}, ${TOKENS.shadows.glow}` : TOKENS.shadows.md,
      transition: isTouchDevice ? 'none' : 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      transform: isHovered && !isTouchDevice ? 'translateY(-6px)' : 'none',
      cursor: 'pointer',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      border: `2px solid ${TOKENS.colors.border}`,
      boxSizing: 'border-box',
    },

    // HERO SECTION - Featured + Stack layout
    heroSection: {
      position: 'relative',
      padding: TOKENS.spacing.lg,
      paddingBottom: 0,
    },
    stackedContainer: {
      display: 'flex',
      gap: TOKENS.spacing.md,
      height: isCompact ? '200px' : '280px',
    },
    stackedMain: {
      flex: 1,
      position: 'relative',
      borderRadius: TOKENS.radius.lg,
      overflow: 'hidden',
    },
    mainImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      transform: isHovered && !isTouchDevice ? 'scale(1.03)' : 'scale(1)',
    },
    mainOverlay: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)',
      pointerEvents: 'none',
    },
    stackedPreviews: {
      width: isCompact ? '80px' : '140px',
      display: isCompact ? 'none' : 'flex',
      flexDirection: 'column',
      gap: TOKENS.spacing.sm,
    },
    stackedPreview: {
      flex: 1,
      borderRadius: TOKENS.radius.md,
      overflow: 'hidden',
      position: 'relative',
    },
    previewImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.15s ease',
    },
    photoCount: {
      position: 'absolute',
      bottom: TOKENS.spacing.sm,
      right: TOKENS.spacing.sm,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 10px',
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: TOKENS.radius.pill,
      fontSize: '11px',
      fontWeight: 500,
      color: 'white',
      letterSpacing: '0.05em',
    },

    // MINI-MAP THUMBNAIL
    miniMapContainer: {
      flex: 1,
      borderRadius: TOKENS.radius.md,
      overflow: 'hidden',
      position: 'relative',
      cursor: 'pointer',
      border: `2px solid ${TOKENS.colors.primaryLight}`,
      transition: 'all 0.2s ease',
    },
    miniMapImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      filter: 'saturate(0.9)',
    },
    miniMapOverlay: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(109, 49, 194, 0) 50%, rgba(109, 49, 194, 0.15) 100%)',
      pointerEvents: 'none',
    },
    miniMapBadge: {
      position: 'absolute',
      bottom: TOKENS.spacing.sm,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 12px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: TOKENS.radius.pill,
      fontSize: '10px',
      fontWeight: 700,
      color: TOKENS.colors.primaryAccent,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      boxShadow: '0 2px 8px rgba(109, 49, 194, 0.2)',
      whiteSpace: 'nowrap',
    },
    miniMapPin: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -100%)',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${TOKENS.colors.primaryRich} 0%, ${TOKENS.colors.primaryAccent} 100%)`,
      borderRadius: '50% 50% 50% 0',
      rotate: '-45deg',
      boxShadow: '0 4px 12px rgba(109, 49, 194, 0.4)',
    },

    favoriteOverlay: {
      position: 'absolute',
      top: TOKENS.spacing.md,
      right: TOKENS.spacing.md,
      zIndex: 10,
    },
    favoriteBtn: {
      all: 'unset',
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '2px solid rgba(255, 255, 255, 0.6)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
      transition: 'all 0.15s ease',
      boxSizing: 'border-box',
    },

    // CONTENT SECTION
    contentSection: {
      padding: TOKENS.spacing.xl,
    },
    locationRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: TOKENS.spacing.md,
    },
    location: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      fontWeight: 600,
      color: TOKENS.colors.primaryAccent,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    verifiedBadge: {
      display: hasProposal ? 'flex' : 'none',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      background: '#EEF2FF',
      color: TOKENS.colors.primaryAccent,
      fontSize: '11px',
      fontWeight: 600,
      borderRadius: TOKENS.radius.pill,
      letterSpacing: '0.05em',
    },
    title: {
      fontSize: isCompact ? '18px' : '20px',
      fontWeight: 700,
      color: TOKENS.colors.text,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
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
      gap: '4px',
      fontSize: '14px',
      fontWeight: 600,
      color: TOKENS.colors.text,
    },
    ratingCount: {
      color: TOKENS.colors.textMuted,
      fontWeight: 400,
    },
    stats: {
      display: 'flex',
      alignItems: 'center',
      gap: TOKENS.spacing.sm,
      fontSize: '14px',
      color: TOKENS.colors.textMuted,
    },
    statDivider: {
      width: '3px',
      height: '3px',
      borderRadius: '50%',
      background: TOKENS.colors.textLight,
    },

    // AI INSIGHT CARD
    aiCard: {
      background: `linear-gradient(135deg, ${TOKENS.colors.primaryLight} 0%, #F8F5FF 100%)`,
      borderRadius: TOKENS.radius.md,
      padding: TOKENS.spacing.lg,
      marginBottom: TOKENS.spacing.lg,
      border: '2px solid rgba(109, 49, 194, 0.15)',
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
      boxShadow: '0 2px 8px rgba(109, 49, 194, 0.25)',
    },
    aiLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: TOKENS.colors.primaryAccent,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    aiText: {
      fontSize: '14px',
      lineHeight: 1.7,
      color: TOKENS.colors.textSecondary,
      margin: 0,
    },

    // BOTTOM BAR
    bottomBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: TOKENS.spacing.lg,
      padding: `${TOKENS.spacing.lg} ${TOKENS.spacing.xl}`,
      background: 'linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)',
      borderTop: `2px solid ${TOKENS.colors.border}`,
      flexWrap: isCompact ? 'wrap' : 'nowrap',
    },
    priceHost: {
      display: 'flex',
      alignItems: 'center',
      gap: TOKENS.spacing.xl,
      flex: isCompact ? '1 1 100%' : 'none',
      justifyContent: isCompact ? 'space-between' : 'flex-start',
      marginBottom: isCompact ? TOKENS.spacing.md : 0,
    },
    priceBlock: {
      display: 'flex',
      flexDirection: 'column',
    },
    priceValue: {
      fontSize: isCompact ? '22px' : '26px',
      fontWeight: 800,
      color: TOKENS.colors.text,
      letterSpacing: '-0.02em',
    },
    pricePeriod: {
      fontSize: '14px',
      fontWeight: 400,
      color: TOKENS.colors.textMuted,
    },
    priceContext: {
      fontSize: '12px',
      color: TOKENS.colors.primaryAccent,
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
    hostMini: {
      display: isCompact ? 'none' : 'flex',
      alignItems: 'center',
      gap: TOKENS.spacing.sm,
    },
    hostAvatar: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '2px solid white',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    hostInfo: {
      display: 'flex',
      flexDirection: 'column',
    },
    hostName: {
      fontSize: '14px',
      fontWeight: 600,
      color: TOKENS.colors.text,
    },
    hostMeta: {
      fontSize: '12px',
      color: TOKENS.colors.textMuted,
    },
    actionButtons: {
      display: 'flex',
      gap: TOKENS.spacing.sm,
      flex: isCompact ? '1 1 100%' : 'none',
    },
    btn: {
      minHeight: '44px',
      padding: `${TOKENS.spacing.md} ${TOKENS.spacing.xl}`,
      borderRadius: TOKENS.radius.pill,
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      border: 'none',
      letterSpacing: '-0.01em',
      boxSizing: 'border-box',
    },
    btnGhost: {
      background: 'transparent',
      color: TOKENS.colors.textSecondary,
    },
    btnPrimary: {
      background: `linear-gradient(135deg, ${TOKENS.colors.primaryRich} 0%, ${TOKENS.colors.primary} 100%)`,
      color: 'white',
      boxShadow: '0 4px 16px rgba(30, 10, 60, 0.25)',
      flex: isCompact ? 1 : 'none',
    },
  };

  return (
    <article
      style={styles.card}
      onClick={handleCardClick}
      onMouseEnter={() => !isTouchDevice && setIsHovered(true)}
      onMouseLeave={() => !isTouchDevice && setIsHovered(false)}
      aria-label={`Favorite listing: ${listing.title}`}
    >
      {/* HERO SECTION - Featured + Stack */}
      <div style={styles.heroSection}>
        <div style={styles.stackedContainer}>
          {/* Main Image */}
          <div style={styles.stackedMain}>
            <img
              src={imageError ? 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&h=600&fit=crop&q=90' : mainPhoto}
              alt={listing.title}
              style={styles.mainImage}
              onError={() => setImageError(true)}
            />
            <div style={styles.mainOverlay} />

            {/* Favorite button on main image */}
            <div style={styles.favoriteOverlay}>
              <button
                style={styles.favoriteBtn}
                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(listing.id, listing.title, false); }}
                aria-label="Remove from favorites"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={TOKENS.colors.danger} stroke={TOKENS.colors.danger} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* Photo count on mobile (since thumbnails hidden) */}
            {isCompact && (
              <div style={styles.photoCount}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                {photoCount} PHOTOS
              </div>
            )}
          </div>

          {/* Stacked Thumbnails: Photo + Mini-Map (hidden on mobile) */}
          <div style={styles.stackedPreviews}>
            {/* Photo thumbnail with count */}
            <div style={styles.stackedPreview}>
              <img src={thumbPhoto1} alt="Room view" style={styles.previewImage} />
              <div style={styles.photoCount}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                {photoCount}
              </div>
            </div>

            {/* Mini-Map thumbnail */}
            <div
              style={styles.miniMapContainer}
              onClick={handleMapClick}
              role="button"
              tabIndex={0}
              aria-label="View on map"
            >
              <img
                src={miniMapUrl}
                alt={`Map showing ${listing.location || listing.neighborhood || 'location'}`}
                style={styles.miniMapImage}
                onError={(e) => {
                  // Fallback to a styled placeholder if map fails to load
                  e.target.style.background = `linear-gradient(135deg, ${TOKENS.colors.primaryLight} 0%, #E8E0F0 100%)`;
                  e.target.style.opacity = '0.5';
                }}
              />
              <div style={styles.miniMapOverlay} />
              <div style={styles.miniMapBadge}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                VIEW MAP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div style={styles.contentSection}>
        <div style={styles.locationRow}>
          <div style={styles.location}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {listing.location || listing.neighborhood || 'New York, NY'}
          </div>
          <div style={styles.verifiedBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            PROPOSAL SENT
          </div>
        </div>

        <h2 style={styles.title}>{listing.title}</h2>

        <div style={styles.metaRow}>
          <div style={styles.rating}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={TOKENS.colors.primaryRich} stroke={TOKENS.colors.primaryRich} strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {listing.rating || '4.8'} <span style={styles.ratingCount}>({listing.reviewCount || 0} reviews)</span>
          </div>
          <div style={styles.stats}>
            <span>{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} BR`}</span>
            <span style={styles.statDivider} />
            <span>{listing.bathrooms} BA</span>
            <span style={styles.statDivider} />
            <span>{listing.maxGuests} guests</span>
          </div>
        </div>

        {/* AI INSIGHT */}
        {listing.aiInsight && (
          <div style={styles.aiCard}>
            <div style={styles.aiHeader}>
              <div style={styles.aiIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span style={styles.aiLabel}>AI Insight</span>
            </div>
            <p style={styles.aiText}>{listing.aiInsight}</p>
          </div>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div style={styles.bottomBar}>
        <div style={styles.priceHost}>
          <div style={styles.priceBlock}>
            <div style={styles.priceValue}>
              ${listing.price?.starting || listing['Starting nightly price'] || 0}
              <span style={styles.pricePeriod}>/night</span>
            </div>
            {listing.priceContext && <div style={styles.priceContext}>{listing.priceContext}</div>}
          </div>

          <div style={styles.hostMini}>
            <img
              style={styles.hostAvatar}
              src={listing.hostAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'}
              alt={listing.hostName || 'Host'}
            />
            <div style={styles.hostInfo}>
              <span style={styles.hostName}>{listing.hostName || 'Host'}</span>
              <span style={styles.hostMeta}>{listing.hostStatus || 'Verified'}</span>
            </div>
          </div>
        </div>

        <div style={styles.actionButtons}>
          <button style={{ ...styles.btn, ...styles.btnGhost }} onClick={handleMessage}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            {!isCompact && 'Message'}
          </button>

          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={hasProposal ? handleViewProposal : handleCreateProposal}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            {hasProposal ? 'View Proposal' : 'Create Proposal'}
          </button>

          <FavoriteButton
            onConfirmRemove={() => onToggleFavorite?.(listing.id, listing.title, false)}
          />
        </div>
      </div>
    </article>
  );
};

export default memo(FavoritesCardV3, (prevProps, nextProps) => {
  return (
    prevProps.listing?.id === nextProps.listing?.id &&
    prevProps.proposalForListing?._id === nextProps.proposalForListing?._id &&
    prevProps.userId === nextProps.userId
  );
});
