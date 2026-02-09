/**
 * Host Leases Page Logic Hook
 *
 * Follows the Hollow Component Pattern:
 * - ALL business logic is contained in this hook
 * - Page component only handles rendering
 *
 * Architecture:
 * - Uses Supabase Edge Functions for API calls
 * - Delegates to four-layer logic architecture
 */

import { useState, useEffect, useCallback } from 'react';
import { checkAuthStatus, validateTokenAndFetchUser, getFirstName, getUserType } from '../../../lib/auth.js';
import { getUserId } from '../../../lib/secureStorage.js';
import { supabase } from '../../../lib/supabase.js';
import { isHost } from '../../../logic/rules/users/isHost.js';
import { showToast } from '../../shared/Toast.jsx';

// ============================================================================
// DATA NORMALIZERS
// ============================================================================

/**
 * Normalize listing data from Bubble format
 * @param {Object} listing - Raw listing from database
 * @returns {Object} Normalized listing
 */
function normalizeListing(listing) {
  if (!listing) return null;
  return {
    ...listing,
    id: listing.id || listing._id,
    title: listing.listing_title || listing.title || 'Unnamed Listing',
    name: listing.listing_title || listing.title || 'Unnamed Listing',
    thumbnail: listing.thumbnail || listing.cover_photo || null,
    neighborhood: listing.neighborhood || null,
  };
}

/**
 * Normalize guest data from Bubble format
 * @param {Object} guest - Raw guest from database
 * @returns {Object} Normalized guest
 */
function normalizeGuest(guest) {
  if (!guest) return null;
  return {
    ...guest,
    id: guest.id || guest._id,
    name: (guest.first_name && guest.last_name ? `${guest.first_name} ${guest.last_name}` : null) || guest.name || 'Guest',
    firstName: guest.first_name || guest.firstName || 'Guest',
    email: guest.email || null,
    phone: guest.phone_number || guest.phone || null,
    profilePhoto: guest.profile_photo_url || guest.profilePhoto || null,
    isVerified: guest.is_user_verified || false,
    hasIdVerification: !!(guest['Selfie with ID']),
    hasWorkVerification: !!(guest['Verify - Linked In ID']),
  };
}

/**
 * Normalize lease data from Bubble format
 * @param {Object} lease - Raw lease from database
 * @returns {Object} Normalized lease
 */
function normalizeLease(lease) {
  if (!lease) return null;
  return {
    ...lease,
    id: lease._id,
    agreementNumber: lease['Agreement Number'],
    leaseStatus: lease['Lease Status'],
    leaseSigned: lease['Lease signed?'],
    listing: lease.listing ? normalizeListing(lease.listing) : null,
    listingId: lease.Listing,
    guest: lease.guest ? normalizeGuest(lease.guest) : null,
    guestId: lease.Guest,
    hostId: lease.Host,
    reservationStart: lease['Reservation Period : Start'] || lease['Move In Date'],
    reservationEnd: lease['Reservation Period : End'] || lease['Move-out'],
    firstPaymentDate: lease['First Payment Date'],
    nextPaymentDueDate: lease['Next Payment Due Date'],
    totalRent: lease['Total Rent'],
    totalCompensation: lease['Total Compensation'],
    paidToDate: lease['Paid to Date from Guest'],
    contract: lease.Contract,
    supplementalAgreement: lease['supplemental agreement'],
    hostPayoutSchedule: lease['Host Payout Schedule'] || null,
    periodicTenancyAgreement: lease['Periodic Tenancy Agreement'] || null,
    createdDate: lease.bubble_created_at,
    modifiedDate: lease.bubble_updated_at,
    // Related data
    stays: (lease.stays || []).map(normalizeStay),
    paymentRecords: (lease.paymentRecords || []).map(normalizePaymentRecord),
    dateChangeRequests: (lease.dateChangeRequests || []).map(normalizeDateChangeRequest),
  };
}

/**
 * Normalize stay data
 * @param {Object} stay - Raw stay from database
 * @returns {Object} Normalized stay
 */
function normalizeStay(stay) {
  if (!stay) return null;
  return {
    id: stay._id,
    leaseId: stay.Lease,
    weekNumber: stay['Week Number'],
    checkInNight: stay['Check In (night)'],
    lastNight: stay['Last Night (night)'],
    stayStatus: stay['Stay Status'],
    reviewSubmittedByHost: stay['Review Submitted by Host'] || false,
    datesInPeriod: stay['Dates - List of dates in this period'] || [],
  };
}

/**
 * Normalize payment record data
 * @param {Object} payment - Raw payment from database
 * @returns {Object} Normalized payment
 */
function normalizePaymentRecord(payment) {
  if (!payment) return null;
  return {
    id: payment._id,
    leaseId: payment['Booking - Reservation'],
    paymentNumber: payment['Payment #'],
    scheduledDate: payment['Scheduled Date'],
    actualDate: payment['Actual Date'],
    rentAmount: payment['Rent Amount'],
    maintenanceFee: payment['Maintenance Fee'],
    damageDeposit: payment['Damage Deposit'],
    totalAmount: payment['Total Amount'],
    bankTransactionNumber: payment['Bank Transaction Number'],
    paymentReceipt: payment['Payment Receipt'],
    isPaid: payment['Is Paid'],
    isRefunded: payment['Is Refunded'],
  };
}

/**
 * Normalize date change request data
 * @param {Object} dcr - Raw date change request from database
 * @returns {Object} Normalized date change request
 */
function normalizeDateChangeRequest(dcr) {
  if (!dcr) return null;
  return {
    id: dcr._id,
    leaseId: dcr.Lease,
    requestedById: dcr['Requested by'],
    requestReceiverId: dcr['Request receiver'],
    requestedByUser: dcr.requestedByUser ? normalizeGuest(dcr.requestedByUser) : null,
    stayAssociated1: dcr['Stay Associated 1'],
    stayAssociated2: dcr['Stay Associated 2'],
    status: dcr.status,
    requestType: dcr['Request Type'],
    originalDate: dcr['Original Date'],
    requestedDate: dcr['Requested Date'],
    priceAdjustment: dcr['Price Adjustment'],
    createdDate: dcr.bubble_created_at,
  };
}

/**
 * Hook for Host Leases Page business logic
 */
export function useHostLeasesPageLogic() {
  // ============================================================================
  // AUTH STATE
  // ============================================================================
  const [authState, setAuthState] = useState({
    isChecking: true,
    isAuthenticated: false,
    shouldRedirect: false,
    userType: null
  });

  // ============================================================================
  // DATA STATE
  // ============================================================================
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [leases, setLeases] = useState([]);

  // ============================================================================
  // UI STATE
  // ============================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // EXPANSION STATE (which lease cards have sections expanded)
  // ============================================================================
  const [expandedSections, setExpandedSections] = useState({});
  // Format: { [leaseId]: { details: bool, allStays: bool, payments: bool, dateChanges: bool } }

  // ============================================================================
  // MODAL STATE
  // ============================================================================
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTargetStay, setReviewTargetStay] = useState(null);
  const [isDateChangeModalOpen, setIsDateChangeModalOpen] = useState(false);
  const [selectedDateChangeRequest, setSelectedDateChangeRequest] = useState(null);

  // ============================================================================
  // LEASE COUNTS STATE (for tab badges)
  // ============================================================================
  const [leaseCountsByListing, setLeaseCountsByListing] = useState({});

  // ============================================================================
  // AUTH CHECK
  // ============================================================================
  useEffect(() => {
    async function checkAuth() {
      try {
        const isLoggedIn = await checkAuthStatus();

        if (!isLoggedIn) {
          setAuthState({
            isChecking: false,
            isAuthenticated: false,
            shouldRedirect: true,
            userType: null
          });
          window.location.href = '/';
          return;
        }

        const userData = await validateTokenAndFetchUser({ clearOnFailure: false });

        let userType = null;
        let finalUserData = null;

        if (userData) {
          userType = userData['User Type'] || userData.userType;
          finalUserData = userData;
          console.log('[HostLeases] User data loaded, userType:', userType);
        } else {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            userType = session.user.user_metadata?.user_type || getUserType() || null;
            console.log('[HostLeases] Using fallback session data, userType:', userType);

            if (userType && isHost({ userType })) {
              finalUserData = {
                userId: session.user.user_metadata?.user_id || getUserId() || session.user.id,
                id: session.user.user_metadata?.user_id || getUserId() || session.user.id,
                firstName: session.user.user_metadata?.first_name || getFirstName() || session.user.email?.split('@')[0] || 'Host',
                email: session.user.email,
                userType: userType
              };
            }

            if (!userType) {
              console.log('[HostLeases] Cannot determine user type from session, redirecting');
              setAuthState({
                isChecking: false,
                isAuthenticated: true,
                shouldRedirect: true,
                userType: null
              });
              window.location.href = '/';
              return;
            }
          } else {
            console.log('[HostLeases] No valid session, redirecting');
            setAuthState({
              isChecking: false,
              isAuthenticated: false,
              shouldRedirect: true,
              userType: null
            });
            window.location.href = '/';
            return;
          }
        }

        // Check if user is a host
        if (!isHost({ userType })) {
          console.warn('[HostLeases] User is not a Host, redirecting...');
          setAuthState({
            isChecking: false,
            isAuthenticated: false,
            shouldRedirect: true,
            userType: userType
          });
          window.location.href = '/';
          return;
        }

        setUser(finalUserData);
        setAuthState({
          isChecking: false,
          isAuthenticated: true,
          shouldRedirect: false,
          userType: userType
        });

        // Load host data
        await loadHostData(finalUserData.userId || finalUserData.id);

      } catch (err) {
        console.error('Auth check failed:', err);
        setError('Authentication failed. Please log in again.');
        setAuthState({
          isChecking: false,
          isAuthenticated: false,
          shouldRedirect: true,
          userType: null
        });
      }
    }

    checkAuth();
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load host listings and leases
   */
  const loadHostData = async (userId) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch host's listings via RPC
      const listingsResult = await fetchHostListings(userId);

      if (listingsResult.length > 0) {
        // Normalize listings
        const normalizedListings = listingsResult.map(normalizeListing);
        setListings(normalizedListings);

        // Check URL param for pre-selected listing
        const urlParams = new URLSearchParams(window.location.search);
        const preselectedListingId = urlParams.get('listingId');

        let listingToSelect = normalizedListings[0];
        if (preselectedListingId) {
          const matchedListing = normalizedListings.find(l => l.id === preselectedListingId);
          if (matchedListing) {
            listingToSelect = matchedListing;
          }
        }

        setSelectedListing(listingToSelect);

        // Fetch leases for all listings to get counts
        const leasesResult = await fetchHostLeases(userId, null);

        // Calculate lease counts per listing
        const countsMap = {};
        leasesResult.forEach(lease => {
          const listingId = lease.listingId;
          countsMap[listingId] = (countsMap[listingId] || 0) + 1;
        });
        setLeaseCountsByListing(countsMap);

        // Filter leases for selected listing
        const filteredLeases = leasesResult.filter(l => l.listingId === listingToSelect.id);
        setLeases(filteredLeases);
      } else {
        setListings([]);
        setLeases([]);
      }

    } catch (err) {
      console.error('Failed to load host data:', err);
      setError('Failed to load your listings and leases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch host's listings using RPC function
   */
  const fetchHostListings = async (userId) => {
    try {
      console.log('[useHostLeasesPageLogic] Fetching listings for user:', userId);

      const { data: listings, error } = await supabase
        .rpc('get_host_listings', { host_user_id: userId });

      if (error) {
        console.error('[useHostLeasesPageLogic] Error fetching listings:', error);
        throw error;
      }

      console.log('[useHostLeasesPageLogic] Found listings:', listings?.length || 0);
      return listings || [];
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      return [];
    }
  };

  /**
   * Fetch host leases via Edge Function
   * @param {string} userId - The host user ID
   * @param {string|null} listingId - Optional listing ID to filter by
   */
  const fetchHostLeases = async (userId, listingId = null) => {
    try {
      console.log('[useHostLeasesPageLogic] Fetching leases for user:', userId, 'listing:', listingId);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        console.error('[useHostLeasesPageLogic] No auth token available');
        throw new Error('Authentication required');
      }

      const payload = {
        hostUserId: userId,
      };
      if (listingId) {
        payload.listingId = listingId;
      }

      const { data, error } = await supabase.functions.invoke('lease', {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: {
          action: 'get_host_leases',
          payload
        }
      });

      if (error) {
        console.error('[useHostLeasesPageLogic] Error fetching leases:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch leases');
      }

      console.log('[useHostLeasesPageLogic] Found leases:', data.data?.length || 0);

      // Normalize the leases
      const normalizedLeases = (data.data || []).map(normalizeLease);
      return normalizedLeases;
    } catch (err) {
      console.error('Failed to fetch leases:', err);
      return [];
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle listing selection change
   */
  const handleListingChange = useCallback(async (listingOrId) => {
    let listing = listingOrId;
    if (typeof listingOrId === 'string') {
      listing = listings.find(l => l.id === listingOrId);
      if (!listing) {
        console.warn('[useHostLeasesPageLogic] Listing not found:', listingOrId);
        return;
      }
    }

    setSelectedListing(listing);
    setIsLoading(true);
    setExpandedSections({}); // Reset expanded sections

    try {
      const userId = user?.userId || user?.id;
      const leasesResult = await fetchHostLeases(userId, listing.id);
      setLeases(leasesResult);
    } catch (err) {
      console.error('Failed to load leases for listing:', err);
      setError('Failed to load leases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [listings, user]);

  /**
   * Toggle expansion of a lease card section
   */
  const handleExpandSection = useCallback((leaseId, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [leaseId]: {
        ...prev[leaseId],
        [section]: true
      }
    }));
  }, []);

  /**
   * Collapse a lease card section
   */
  const handleCollapseSection = useCallback((leaseId, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [leaseId]: {
        ...prev[leaseId],
        [section]: false
      }
    }));
  }, []);

  /**
   * Toggle show all stays for a lease
   */
  const handleToggleShowAllStays = useCallback((leaseId) => {
    setExpandedSections(prev => ({
      ...prev,
      [leaseId]: {
        ...prev[leaseId],
        allStays: !prev[leaseId]?.allStays
      }
    }));
  }, []);

  /**
   * Toggle show details for a lease
   */
  const handleToggleShowDetails = useCallback((leaseId) => {
    setExpandedSections(prev => ({
      ...prev,
      [leaseId]: {
        ...prev[leaseId],
        details: !prev[leaseId]?.details
      }
    }));
  }, []);

  /**
   * Handle accept date change request
   */
  const handleAcceptDateChangeRequest = useCallback(async (requestId) => {
    try {
      console.log('[useHostLeasesPageLogic] Accepting date change request:', requestId);

      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      const { data, error } = await supabase.functions.invoke('date-change-request', {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: {
          action: 'accept',
          payload: { requestId }
        }
      });

      if (error) throw error;

      showToast({ title: 'Success', content: 'Date change request accepted.', type: 'success' });

      // Refresh leases
      const userId = user?.userId || user?.id;
      const leasesResult = await fetchHostLeases(userId, selectedListing?.id);
      setLeases(leasesResult);

    } catch (err) {
      console.error('Failed to accept date change request:', err);
      showToast({ title: 'Error', content: 'Failed to accept request. Please try again.', type: 'error' });
    }
  }, [user, selectedListing]);

  /**
   * Handle decline date change request
   */
  const handleDeclineDateChangeRequest = useCallback(async (requestId) => {
    try {
      console.log('[useHostLeasesPageLogic] Declining date change request:', requestId);

      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      const { data, error } = await supabase.functions.invoke('date-change-request', {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: {
          action: 'decline',
          payload: { requestId }
        }
      });

      if (error) throw error;

      showToast({ title: 'Done', content: 'Date change request declined.', type: 'info' });

      // Refresh leases
      const userId = user?.userId || user?.id;
      const leasesResult = await fetchHostLeases(userId, selectedListing?.id);
      setLeases(leasesResult);

    } catch (err) {
      console.error('Failed to decline date change request:', err);
      showToast({ title: 'Error', content: 'Failed to decline request. Please try again.', type: 'error' });
    }
  }, [user, selectedListing]);

  /**
   * Open guest review modal
   */
  const handleOpenReviewModal = useCallback((stay) => {
    setReviewTargetStay(stay);
    setIsReviewModalOpen(true);
  }, []);

  /**
   * Close guest review modal
   */
  const handleCloseReviewModal = useCallback(() => {
    setIsReviewModalOpen(false);
    setReviewTargetStay(null);
  }, []);

  /**
   * Submit guest review
   *
   * Creates a review record in mainreview table and updates the stay
   * to link the review.
   *
   * @param {Object} reviewData - Review data from modal
   * @param {number} reviewData.overallRating - 1-5 star rating
   * @param {string} reviewData.reviewText - Written review
   * @param {boolean} reviewData.wouldRecommend - Would recommend guest
   */
  const handleSubmitGuestReview = useCallback(async (reviewData) => {
    if (!reviewTargetStay) {
      showToast({ title: 'Error', content: 'No stay selected for review.', type: 'error' });
      return;
    }

    try {
      console.log('[useHostLeasesPageLogic] Submitting guest review:', reviewData);

      const userId = user?.userId || user?.id;
      const stayId = reviewTargetStay.id;

      // Find the lease that contains this stay to get the guest ID
      const lease = leases.find(l => l.stays?.some(s => s.id === stayId));
      const guestId = lease?.guestId || reviewTargetStay.guestId;

      if (!guestId) {
        throw new Error('Could not determine guest ID for review');
      }

      // Generate a unique review ID (Bubble-style)
      const reviewId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Create the review record in mainreview table
      // Schema: _id, Reviewer, Reviewee/Target, Stay, Lease, House Manual, Visit,
      // Created By, type, Rating Details (JSONB), Created Date, Modified Date
      const { error: reviewError } = await supabase
        .from('mainreview')
        .insert({
          _id: reviewId,
          Reviewer: userId,
          'Reviewee/Target': guestId,
          Stay: stayId,
          Lease: lease?.id,
          'Created By': userId,
          type: 'Host to Guest',
          'Created Date': new Date().toISOString(),
          'Modified Date': new Date().toISOString(),
          // Store rating data in Rating Details JSONB field
          'Rating Details': JSON.stringify({
            overallRating: reviewData.overallRating,
            cleanlinessRating: reviewData.cleanlinessRating || null,
            communicationRating: reviewData.communicationRating || null,
            houseRulesRating: reviewData.houseRulesRating || null,
            reviewText: reviewData.reviewText || '',
            wouldRecommend: reviewData.wouldRecommend ?? true,
          }),
        });

      if (reviewError) {
        console.error('[useHostLeasesPageLogic] Error creating review:', reviewError);
        throw new Error(`Failed to create review: ${reviewError.message}`);
      }

      // Update the stay to link the review
      const { error: stayError } = await supabase
        .from('lease_weekly_stay')
        .update({
          bubble_updated_at: new Date().toISOString(),
        })
        .eq('id', stayId);

      if (stayError) {
        console.error('[useHostLeasesPageLogic] Error updating stay:', stayError);
        // Review was created but stay update failed - not critical
        console.warn('Review created but stay link update failed');
      }

      showToast({ title: 'Success', content: 'Your review has been submitted!', type: 'success' });

      // Refresh leases to update the UI
      const leasesResult = await fetchHostLeases(userId, selectedListing?.id);
      setLeases(leasesResult);

      handleCloseReviewModal();
    } catch (err) {
      console.error('Failed to submit guest review:', err);
      showToast({ title: 'Error', content: err.message || 'Failed to submit review. Please try again.', type: 'error' });
    }
  }, [reviewTargetStay, user, leases, selectedListing, handleCloseReviewModal]);

  /**
   * Open date change detail modal
   */
  const handleViewDateChangeDetails = useCallback((request) => {
    setSelectedDateChangeRequest(request);
    setIsDateChangeModalOpen(true);
  }, []);

  /**
   * Close date change detail modal
   */
  const handleCloseDateChangeModal = useCallback(() => {
    setIsDateChangeModalOpen(false);
    setSelectedDateChangeRequest(null);
  }, []);

  /**
   * Open PDF document in new tab
   */
  const handleOpenDocument = useCallback((documentType, lease) => {
    let url = null;
    let documentName = 'Document';

    switch (documentType) {
      case 'contract':
        url = lease.contract;
        documentName = 'Lease Contract';
        break;
      case 'supplemental':
        url = lease.supplementalAgreement;
        documentName = 'Supplemental Agreement';
        break;
      case 'payoutSchedule':
        url = lease.hostPayoutSchedule;
        documentName = 'Payout Schedule';
        break;
      case 'periodicTenancy':
        url = lease.periodicTenancyAgreement;
        documentName = 'Periodic Tenancy Agreement';
        break;
      default:
        console.warn('Unknown document type:', documentType);
    }

    if (url) {
      window.open(url, '_blank');
    } else {
      showToast({ title: 'Not Available', content: `${documentName} is not available yet.`, type: 'info' });
    }
  }, []);

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    if (user) {
      loadHostData(user.userId || user.id);
    }
  }, [user]);

  // ============================================================================
  // RETURN HOOK API
  // ============================================================================
  return {
    // Auth state
    authState,

    // Data
    user,
    listings,
    selectedListing,
    leases,

    // UI state
    isLoading,
    error,

    // Expansion state
    expandedSections,

    // Modal state
    isReviewModalOpen,
    reviewTargetStay,
    isDateChangeModalOpen,
    selectedDateChangeRequest,

    // Lease counts for tabs
    leaseCountsByListing,

    // Handlers
    handleListingChange,
    handleExpandSection,
    handleCollapseSection,
    handleToggleShowAllStays,
    handleToggleShowDetails,
    handleAcceptDateChangeRequest,
    handleDeclineDateChangeRequest,
    handleOpenReviewModal,
    handleCloseReviewModal,
    handleSubmitGuestReview,
    handleViewDateChangeDetails,
    handleCloseDateChangeModal,
    handleOpenDocument,
    handleRetry,
  };
}
