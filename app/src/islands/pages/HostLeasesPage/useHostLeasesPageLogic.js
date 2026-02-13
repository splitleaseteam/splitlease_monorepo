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
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';
import { supabase } from '../../../lib/supabase.js';
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
    id: listing.id,
    title: listing.listing_title || listing.title || 'Unnamed Listing',
    name: listing.listing_title || listing.title || 'Unnamed Listing',
    thumbnail: listing.thumbnail || listing.cover_photo || null,
    neighborhood: listing.neighborhood_name_entered_by_host || listing.neighborhood || null,
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
    id: guest.id,
    name: (guest.first_name && guest.last_name ? `${guest.first_name} ${guest.last_name}` : null) || guest.name || 'Guest',
    firstName: guest.first_name || guest.firstName || 'Guest',
    email: guest.email || null,
    phone: guest.phone_number || guest.phone || null,
    profilePhoto: guest.profile_photo_url || guest.profilePhoto || null,
    isVerified: guest.is_user_verified || false,
    hasIdVerification: !!guest.selfie_with_id_photo_url,
    hasWorkVerification: !!guest.linkedin_profile_id,
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
    id: lease.id,
    agreementNumber: lease.agreement_number,
    leaseStatus: lease.lease_status,
    leaseSigned: lease.lease_signed,
    listing: lease.listing ? normalizeListing(lease.listing) : null,
    listingId: lease.listing_id,
    guest: lease.guest ? normalizeGuest(lease.guest) : null,
    guestId: lease.guest_user_id,
    hostId: lease.host_user_id,
    reservationStart: lease.reservation_start_date,
    reservationEnd: lease.reservation_end_date,
    firstPaymentDate: lease.first_payment_date,
    nextPaymentDueDate: lease.next_payment_due_date,
    totalRent: lease.total_rent,
    totalCompensation: lease.total_compensation,
    paidToDate: lease.paid_to_date_from_guest,
    contract: lease.contract,
    supplementalAgreement: lease.supplemental_agreement,
    hostPayoutSchedule: lease.host_payout_schedule || null,
    periodicTenancyAgreement: lease.periodic_tenancy_agreement || null,
    createdDate: lease.original_created_at,
    modifiedDate: lease.original_updated_at,
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
    id: stay.id,
    leaseId: stay.lease_id,
    weekNumber: stay.week_number_in_lease,
    checkInNight: stay.checkin_night_date,
    lastNight: stay.last_night_date,
    stayStatus: stay.stay_status,
    reviewSubmittedByHost: stay.review_submitted_by_host || false,
    datesInPeriod: stay.dates_in_this_stay_period_json || [],
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
    id: payment.id,
    leaseId: payment.booking_reservation,
    paymentNumber: payment.payment,
    scheduledDate: payment.scheduled_date,
    actualDate: payment.actual_date_of_payment,
    rentAmount: payment.rent,
    maintenanceFee: payment.maintenance_fee,
    damageDeposit: payment.damage_deposit,
    totalAmount: payment.total_paid_to_host,
    bankTransactionNumber: payment.bank_transaction_number,
    paymentReceipt: payment.payment_receipt,
    isPaid: payment.payment_to_host,
    isRefunded: payment.is_refunded,
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
    id: dcr.id,
    leaseId: dcr.lease,
    requestedById: dcr.requested_by,
    requestReceiverId: dcr.request_receiver,
    requestedByUser: dcr.requestedByUser ? normalizeGuest(dcr.requestedByUser) : null,
    stayAssociated1: dcr.stay_associated_1,
    stayAssociated2: dcr.stay_associated_2,
    status: dcr.request_status,
    requestType: dcr.type_of_request,
    originalDate: dcr.list_of_old_dates_in_the_stay,
    requestedDate: dcr.list_of_new_dates_in_the_stay,
    priceAdjustment: dcr.price_rate_of_the_night,
    createdDate: dcr.original_created_at,
  };
}

/**
 * Hook for Host Leases Page business logic
 */
export function useHostLeasesPageLogic() {
  // ============================================================================
  // AUTH (via useAuthenticatedUser hook)
  // ============================================================================
  const {
    user: authUser,
    userId: authUserId,
    loading: authLoading,
    isAuthenticated
  } = useAuthenticatedUser({ requiredRole: 'host', redirectOnFail: '/' });

  // Map hook user to the shape this component expects
  const user = authUser ? {
    userId: authUser.id,
    id: authUser.id,
    firstName: authUser.firstName,
    email: authUser.email,
    userType: authUser.userType
  } : null;

  const authState = {
    isChecking: authLoading,
    isAuthenticated,
    shouldRedirect: false,
    userType: authUser?.userType || null
  };

  // ============================================================================
  // DATA STATE
  // ============================================================================
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
  // LOAD DATA AFTER AUTH
  // ============================================================================
  useEffect(() => {
    if (!authLoading && isAuthenticated && authUserId) {
      loadHostData(authUserId);
    }
  }, [authLoading, isAuthenticated, authUserId]);

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
      // Schema: id, Reviewer, Reviewee/Target, Stay, Lease, House Manual, Visit,
      // Created By, type, Rating Details (JSONB), Created Date, Modified Date
      const { error: reviewError } = await supabase
        .from('mainreview')
        .insert({
          id: reviewId,
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
          original_updated_at: new Date().toISOString(),
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
