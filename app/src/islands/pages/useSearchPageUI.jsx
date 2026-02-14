/**
 * useSearchPageUI - UI-only state, effects, and handlers for SearchPage
 *
 * Extracted from SearchPage.jsx to reduce main file size.
 * Contains:
 * - Filter popup state and handlers
 * - Toast notification state
 * - Header scroll hide/show effect
 * - Escape key overlay dismissal
 * - Card <-> Map hover sync
 * - Scroll-to-listing-card handlers
 * - Schedule selector mounting effect
 * - URL day-selection tracking
 * - Check-in/check-out computed values
 * - Filter tags computation
 * - Proposal modal open/close/submit handlers
 *
 * No business logic -- purely UI orchestration.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import SearchScheduleSelector from '../shared/SearchScheduleSelector.jsx';
import { logger } from '../../lib/logger.js';
import { checkAuthStatus, logoutUser } from '../../lib/auth/index.js';
import { createDay } from '../../lib/scheduleSelector/dayHelpers.js';
import { calculateNextAvailableCheckIn } from '../../logic/calculators/scheduling/calculateNextAvailableCheckIn.js';
import { shiftMoveInDateIfPast } from '../../logic/calculators/scheduling/shiftMoveInDateIfPast.js';
import { calculateCheckInOutFromDays } from '../../logic/calculators/scheduling/calculateCheckInOutFromDays.js';
import { countSelectedNights } from '../../lib/scheduleSelector/nightCalculations.js';
import { isGuest } from '../../logic/rules/users/isGuest.js';
import { isHost } from '../../logic/rules/users/isHost.js';
import { createProposal } from '../../lib/proposalService.js';

/**
 * @param {Object} params
 * @param {Object} params.logic - Return value of useSearchPageLogic()
 * @param {Object} params.auth - Return value of useSearchPageAuth()
 */
export function useSearchPageUI({ logic, auth }) {
  const {
    filterPanelActive, setFilterPanelActive,
    menuOpen, setMenuOpen,
    mobileMapVisible, setMobileMapVisible,
    weekPattern,
    setSelectedBoroughs, setSelectedNeighborhoods,
    setPriceTier, setWeekPattern, setSortBy,
    mapRef,
    isDetailDrawerOpen, handleCloseDetailDrawer,
    handleOpenContactModal, handleOpenAIResearchModal,
  } = logic;

  const {
    isLoggedIn, currentUser, authUserId,
    setProposalsByListingId,
    lastProposalDefaults,
    setReservationSpanForProposal,
    pendingProposalData, setPendingProposalData,
    setShowSuccessModal, setSuccessProposalId,
    isSubmittingProposal, setIsSubmittingProposal,
    setShowAuthModalForProposal,
  } = auth;

  // ==========================================================================
  // UI-ONLY STATE
  // ==========================================================================

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState('login');
  const [isCreateProposalModalOpen, setIsCreateProposalModalOpen] = useState(false);
  const [selectedListingForProposal, setSelectedListingForProposal] = useState(null);
  const [selectedDayObjectsForProposal, setSelectedDayObjectsForProposal] = useState([]);
  const [moveInDateForProposal, setMoveInDateForProposal] = useState('');
  const [selectedNightsCount, setSelectedNightsCount] = useState(4);
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const [mobileHeaderHidden, setMobileHeaderHidden] = useState(false);
  const [desktopHeaderCollapsed, setDesktopHeaderCollapsed] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const menuRef = useRef(null);
  const hoverTimerRef = useRef(null);

  const [selectedDaysForDisplay, setSelectedDaysForDisplay] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const daysParam = urlParams.get('days-selected');
    if (daysParam) {
      return daysParam.split(',').map(d => parseInt(d.trim(), 10)).filter(d => !isNaN(d) && d >= 0 && d <= 6);
    }
    return [1, 2, 3, 4, 5];
  });

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const checkInOutDays = useMemo(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const result = calculateCheckInOutFromDays(selectedDaysForDisplay);
    if (!result) return { checkIn: '', checkOut: '' };
    return {
      checkIn: dayNames[result.checkIn],
      checkOut: dayNames[result.checkOut]
    };
  }, [selectedDaysForDisplay]);

  const activeFilterTags = useMemo(() => {
    const tags = [];
    const { selectedBoroughs, boroughs, selectedNeighborhoods, neighborhoods, priceTier, weekPattern: wp } = logic;

    if (selectedBoroughs.length > 0) {
      const boroughNames = selectedBoroughs
        .map(value => boroughs.find(b => b.value === value)?.name)
        .filter(Boolean);
      const label = boroughNames.length > 2
        ? `${boroughNames.slice(0, 2).join(', ')} +${boroughNames.length - 2}`
        : boroughNames.join(', ');
      tags.push({
        id: 'boroughs',
        icon: 'map-pin',
        label: label || `${selectedBoroughs.length} boroughs`,
        onRemove: () => setSelectedBoroughs([])
      });
    }

    if (selectedNeighborhoods.length > 0) {
      const neighborhoodNames = selectedNeighborhoods
        .map(id => neighborhoods.find(n => n.id === id)?.name)
        .filter(Boolean)
        .slice(0, 2);
      const label = neighborhoodNames.length > 2
        ? `${neighborhoodNames.join(', ')} +${selectedNeighborhoods.length - 2}`
        : neighborhoodNames.join(', ');
      tags.push({
        id: 'neighborhoods',
        icon: 'map-pin',
        label: label || `${selectedNeighborhoods.length} neighborhoods`,
        onRemove: () => setSelectedNeighborhoods([])
      });
    }

    if (priceTier && priceTier !== 'all') {
      const priceLabels = {
        'under-200': 'Under $200',
        '200-350': '$200-$350',
        '350-500': '$350-$500',
        '500-plus': '$500+'
      };
      tags.push({
        id: 'price',
        icon: 'dollar-sign',
        label: priceLabels[priceTier] || priceTier,
        onRemove: () => setPriceTier('all')
      });
    }

    if (wp && wp !== 'every-week') {
      const patternLabels = {
        'one-on-off': 'Every other week',
        'two-on-off': '2 weeks on/off',
        'one-three-off': '1 on, 3 off'
      };
      tags.push({
        id: 'weekPattern',
        icon: 'repeat',
        label: patternLabels[wp] || wp,
        onRemove: () => setWeekPattern('every-week')
      });
    }

    return tags;
  }, [logic.selectedBoroughs, logic.selectedNeighborhoods, logic.priceTier, logic.weekPattern, logic.boroughs, logic.neighborhoods]);

  const showCreateProposalButton = useMemo(() => {
    if (!isLoggedIn || !currentUser) return false;
    const userIsGuest = isGuest({ userType: currentUser.userType });
    const hasExistingProposals = (currentUser.proposalCount ?? 0) > 0;
    return userIsGuest && hasExistingProposals;
  }, [isLoggedIn, currentUser]);

  const showMessageButton = useMemo(() => {
    if (!isLoggedIn || !currentUser) return true;
    const userIsHost = isHost({ userType: currentUser.userType });
    return !userIsHost;
  }, [isLoggedIn, currentUser]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Listen for URL changes to update selected days display
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const daysParam = urlParams.get('days-selected');
      if (daysParam) {
        const days = daysParam.split(',').map(d => parseInt(d.trim(), 10)).filter(d => !isNaN(d) && d >= 0 && d <= 6);
        setSelectedDaysForDisplay(days);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('daysSelected', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('daysSelected', handleUrlChange);
    };
  }, []);

  // Close hamburger menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Header scroll hide/show effect
  useEffect(() => {
    let lastScrollY = 0;
    let ticking = false;
    let latestRead = null;

    const handleScroll = (e) => {
      const scrollTarget = e?.target;
      const currentScrollY =
        scrollTarget && scrollTarget !== window
          ? (scrollTarget.scrollTop || 0)
          : (window.scrollY || window.pageYOffset || 0);
      const viewportWidth = window.innerWidth;

      latestRead = { currentScrollY, viewportWidth };

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const read = latestRead;
          if (!read) {
            ticking = false;
            return;
          }

          const { currentScrollY: nextScrollY, viewportWidth: nextViewportWidth } = read;
          const isMobile = nextViewportWidth <= 768;
          const isDesktop = nextViewportWidth >= 769;
          let nextMobileHeaderHidden = false;
          let nextDesktopHeaderCollapsed = false;

          if (isMobile) {
            nextMobileHeaderHidden = nextScrollY > 250 && nextScrollY > lastScrollY;
          } else if (isDesktop) {
            nextDesktopHeaderCollapsed = nextScrollY > 150 && nextScrollY > lastScrollY;
          }

          setMobileHeaderHidden(prev => (prev === nextMobileHeaderHidden ? prev : nextMobileHeaderHidden));
          setDesktopHeaderCollapsed(prev => (prev === nextDesktopHeaderCollapsed ? prev : nextDesktopHeaderCollapsed));

          lastScrollY = nextScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    const listingsContent = document.querySelector('.listings-content');

    if (listingsContent) {
      listingsContent.addEventListener('scroll', handleScroll, { passive: true });
      return () => listingsContent.removeEventListener('scroll', handleScroll);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mount SearchScheduleSelector component
  useEffect(() => {
    const mountPointDesktop = document.getElementById('schedule-selector-mount-point');
    const mountPointMobile = document.getElementById('schedule-selector-mount-point-mobile');
    const roots = [];

    const selectorProps = {
      enablePersistence: true,
      onSelectionChange: (days) => {
        logger.debug('Schedule selector changed:', days);
        const nightsCount = countSelectedNights(days);
        setSelectedNightsCount(nightsCount);
      },
      onError: (error) => logger.error('SearchScheduleSelector error:', error),
      weekPattern: weekPattern
    };

    if (mountPointDesktop) {
      const rootDesktop = createRoot(mountPointDesktop);
      rootDesktop.render(<SearchScheduleSelector {...selectorProps} />);
      roots.push(rootDesktop);
    }

    if (mountPointMobile) {
      const rootMobile = createRoot(mountPointMobile);
      rootMobile.render(<SearchScheduleSelector {...selectorProps} />);
      roots.push(rootMobile);
    }

    return () => {
      roots.forEach(root => root.unmount());
    };
  }, [weekPattern]);

  // QW3: Escape key closes overlays in priority order
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        const target = e.target;
        const isTextInput = !!(
          target && (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable
          )
        );

        if (isTextInput) return;

        if (isDetailDrawerOpen) {
          handleCloseDetailDrawer();
        } else if (filterPopupOpen) {
          setFilterPopupOpen(false);
        } else if (filterPanelActive) {
          setFilterPanelActive(false);
        } else if (mobileMapVisible) {
          setMobileMapVisible(false);
        } else if (menuOpen) {
          setMenuOpen(false);
        }
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isDetailDrawerOpen, filterPopupOpen, filterPanelActive, mobileMapVisible, menuOpen, handleCloseDetailDrawer]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const toggleFilterPopup = useCallback(() => {
    setFilterPopupOpen(prev => !prev);
  }, []);

  const closeFilterPopup = useCallback(() => {
    setFilterPopupOpen(false);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedBoroughs([]);
    setSelectedNeighborhoods([]);
    setPriceTier('all');
    setWeekPattern('every-week');
    setSortBy('recommended');
    setFilterPopupOpen(false);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  }, []);

  const handleNavigate = useCallback((path) => {
    window.location.href = path;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
      window.location.reload();
    } catch (error) {
      logger.error('[SearchPage] Logout error:', error);
    }
  }, []);

  // Scroll to listing card
  const scrollToListingCard = useCallback((listing) => {
    const listingId = listing.id;
    const listingCard = document.querySelector(`[data-listing-id="${listingId}"]`);

    if (listingCard) {
      listingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      listingCard.classList.add('listing-card--highlighted');
      setTimeout(() => {
        listingCard.classList.remove('listing-card--highlighted');
      }, 2000);
    }
  }, []);

  const scrollToListingCardWithRetry = useCallback((listing, attempts = 5) => {
    const listingId = listing.id;
    const listingCard = document.querySelector(`[data-listing-id="${listingId}"]`);

    if (listingCard) {
      scrollToListingCard(listing);
      return;
    }

    if (attempts > 0) {
      window.setTimeout(() => {
        scrollToListingCardWithRetry(listing, attempts - 1);
      }, 120);
    }
  }, [scrollToListingCard]);

  const handleMobileMarkerClick = useCallback((listing) => {
    setMobileMapVisible(false);
    window.setTimeout(() => {
      scrollToListingCardWithRetry(listing);
    }, 300);
  }, [scrollToListingCardWithRetry]);

  // Card <-> Map hover sync
  const handleCardHover = useCallback((listing) => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      mapRef.current?.highlightListing(listing.id);
    }, 150);
  }, [mapRef]);

  const handleCardLeave = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
    mapRef.current?.stopPulse();
  }, [mapRef]);

  const handleLocationClick = useCallback((listing) => {
    if (mapRef.current) {
      mapRef.current.zoomToListing(listing.id);
    }
  }, [mapRef]);

  const handleRequireAuth = useCallback(() => {
    setAuthModalView('signup');
    setIsAuthModalOpen(true);
  }, []);

  // ==========================================================================
  // PROPOSAL HANDLERS
  // ==========================================================================

  const handleOpenCreateProposalModal = useCallback((listing) => {
    const urlParams = new URLSearchParams(window.location.search);
    const daysParam = urlParams.get('days-selected');

    let initialDays = [];
    if (daysParam) {
      try {
        const zeroBased = daysParam.split(',').map(d => parseInt(d.trim(), 10));
        initialDays = zeroBased
          .filter(d => d >= 0 && d <= 6)
          .map(dayIndex => createDay(dayIndex, true));
      } catch (e) {
        logger.warn('Failed to parse days from URL:', e);
      }
    }

    if (initialDays.length === 0) {
      initialDays = [1, 2, 3, 4, 5].map(dayIndex => createDay(dayIndex, true));
    }

    const today = new Date();
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);
    const minMoveInDate = twoWeeksFromNow.toISOString().split('T')[0];

    let smartMoveInDate = minMoveInDate;

    if (lastProposalDefaults?.moveInDate) {
      smartMoveInDate = shiftMoveInDateIfPast({
        previousMoveInDate: lastProposalDefaults.moveInDate,
        minDate: minMoveInDate
      }) || minMoveInDate;
    } else if (initialDays.length > 0) {
      try {
        const selectedDayIndices = initialDays.map(d => d.dayOfWeek);
        smartMoveInDate = calculateNextAvailableCheckIn({
          selectedDayIndices,
          minDate: minMoveInDate
        });
      } catch (err) {
        smartMoveInDate = minMoveInDate;
      }
    }

    const prefillReservationSpan = lastProposalDefaults?.reservationSpanWeeks || 13;

    setSelectedListingForProposal(listing);
    setSelectedDayObjectsForProposal(initialDays);
    setMoveInDateForProposal(smartMoveInDate);
    setReservationSpanForProposal(prefillReservationSpan);
    setIsCreateProposalModalOpen(true);
  }, [lastProposalDefaults, setReservationSpanForProposal]);

  const handleCloseCreateProposalModal = useCallback(() => {
    setIsCreateProposalModalOpen(false);
    setSelectedListingForProposal(null);
  }, []);

  const handleSubmitProposal = useCallback(async (proposalData) => {
    setIsSubmittingProposal(true);

    try {
      if (!authUserId) {
        throw new Error('Authentication required. Please log in again.');
      }

      const result = await createProposal({
        guestId: authUserId,
        listingId: selectedListingForProposal?.id,
        moveInDate: proposalData.moveInDate,
        daysSelectedObjects: proposalData.daysSelectedObjects,
        reservationSpanWeeks: proposalData.reservationSpan || 13,
        pricing: {
          pricePerNight: proposalData.pricePerNight,
          pricePerFourWeeks: proposalData.pricePerFourWeeks,
          totalPrice: proposalData.totalPrice
        },
        details: {
          needForSpace: proposalData.needForSpace,
          aboutMe: proposalData.aboutYourself,
          specialNeeds: proposalData.hasUniqueRequirements ? proposalData.uniqueRequirements : '',
          moveInRangeText: proposalData.moveInRange
        }
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const { clearProposalDraft } = await import('../shared/CreateProposalFlow.jsx');
      clearProposalDraft(proposalData.listingId);
      setIsCreateProposalModalOpen(false);
      setPendingProposalData(null);
      setSuccessProposalId(result.proposalId);
      setShowSuccessModal(true);

      if (result.proposalId && selectedListingForProposal) {
        const listingId = selectedListingForProposal.id;
        setProposalsByListingId(prev => {
          const updated = new Map(prev);
          updated.set(listingId, { id: result.proposalId });
          return updated;
        });
      }

    } catch (error) {
      logger.error('[SearchPage] Error submitting proposal:', error);
      showToast(error.message || 'Failed to submit proposal. Please try again.', 'error');
    } finally {
      setIsSubmittingProposal(false);
    }
  }, [authUserId, selectedListingForProposal, showToast]);

  const handleCreateProposalSubmit = useCallback(async (proposalData) => {
    const isAuthenticated = await checkAuthStatus();

    if (!isAuthenticated) {
      setPendingProposalData(proposalData);
      setIsCreateProposalModalOpen(false);
      setShowAuthModalForProposal(true);
      return;
    }

    await handleSubmitProposal(proposalData);
  }, [handleSubmitProposal]);

  const handleAuthSuccessForProposal = useCallback(async (authResult) => {
    setShowAuthModalForProposal(false);

    if (pendingProposalData) {
      setTimeout(async () => {
        await handleSubmitProposal(pendingProposalData);
      }, 500);
    }
  }, [pendingProposalData, handleSubmitProposal]);

  // ==========================================================================
  // SHARED PROPS (convenience objects for render)
  // ==========================================================================

  const listingsGridSharedProps = useMemo(() => ({
    onOpenContactModal: handleOpenContactModal,
    onOpenInfoModal: logic.handleOpenInfoModal,
    onLocationClick: handleLocationClick,
    onCardHover: handleCardHover,
    onCardLeave: handleCardLeave,
    onOpenDetailDrawer: logic.handleOpenDetailDrawer,
    isLoggedIn,
    userId: authUserId,
    favoritedListingIds: auth.favoritedListingIds,
    onToggleFavorite: auth.handleToggleFavorite,
    onRequireAuth: handleRequireAuth,
    showCreateProposalButton,
    onOpenCreateProposalModal: handleOpenCreateProposalModal,
    proposalsByListingId: auth.proposalsByListingId,
    selectedNightsCount,
    showMessageButton,
  }), [
    handleOpenContactModal, logic.handleOpenInfoModal, handleLocationClick,
    handleCardHover, handleCardLeave, logic.handleOpenDetailDrawer,
    isLoggedIn, authUserId, auth.favoritedListingIds, auth.handleToggleFavorite,
    handleRequireAuth, showCreateProposalButton, handleOpenCreateProposalModal,
    auth.proposalsByListingId, selectedNightsCount, showMessageButton,
  ]);

  return {
    // UI State
    isAuthModalOpen, setIsAuthModalOpen,
    authModalView, setAuthModalView,
    isCreateProposalModalOpen,
    selectedListingForProposal, setSelectedListingForProposal,
    selectedDayObjectsForProposal,
    moveInDateForProposal,
    selectedNightsCount,
    filterPopupOpen,
    mobileHeaderHidden,
    desktopHeaderCollapsed,
    toast, setToast,
    menuRef,
    // Computed
    checkInOutDays,
    activeFilterTags,
    showCreateProposalButton,
    showMessageButton,
    listingsGridSharedProps,
    // Handlers
    toggleFilterPopup,
    closeFilterPopup,
    clearAllFilters,
    showToast,
    handleNavigate,
    handleLogout,
    scrollToListingCard,
    handleMobileMarkerClick,
    handleCardHover,
    handleCardLeave,
    handleLocationClick,
    handleRequireAuth,
    handleOpenCreateProposalModal,
    handleCloseCreateProposalModal,
    handleCreateProposalSubmit,
    handleAuthSuccessForProposal,
    isSubmittingProposal,
  };
}
