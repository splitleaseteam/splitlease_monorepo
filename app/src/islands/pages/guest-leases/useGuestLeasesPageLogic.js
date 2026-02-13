/**
 * Guest Leases Page Logic Hook
 *
 * Follows the Hollow Component Pattern:
 * - This hook contains ALL business logic
 * - The component contains ONLY JSX rendering
 *
 * Four-Layer Architecture:
 * - Uses calculators from logic/calculators/lease/
 * - Uses rules from logic/rules/lease/
 * - Uses processors from logic/processors/lease/
 * - Uses API wrappers from lib/api/guestLeases.js
 *
 * Features:
 * - Authentication check (Guest users only)
 * - Fetch leases with related data (stays, date changes, payments)
 * - Lease card expand/collapse state
 * - Check-in/checkout modal management
 * - Date change request handling
 * - Document downloads
 *
 * Authentication:
 * - Page requires authenticated Guest user
 * - User ID comes from session, NOT URL
 * - Redirects to home if not authenticated or not a Guest
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation.js';
import { supabase } from '../../../lib/supabase.js';
import {
  fetchGuestLeases,
  sendCheckinMessage,
  updateStayStatus,
  submitCleaningPhotos,
  submitStoragePhotos,
  approveDateChangeRequest,
  rejectDateChangeRequest
} from '../../../lib/api/guestLeases.js';
import { useToast } from '../../shared/Toast';

/**
 * Main logic hook for Guest Leases Page
 * @returns {Object} All state and handlers for the page
 */
export function useGuestLeasesPageLogic() {
  const { showToast } = useToast();

  // ============================================================================
  // AUTH (via useAuthenticatedUser hook)
  // ============================================================================
  const {
    user: authUser,
    userId: authUserId,
    loading: authLoading,
    isAuthenticated,
    redirectReason
  } = useAuthenticatedUser({ requiredRole: 'guest', redirectOnFail: '/' });

  // DEV MODE: Skip auth for design testing (?dev=true in URL)
  const isDevMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === 'true';

  // Map hook user to the shape this component expects
  const user = isDevMode
    ? { id: 'dev-user-123', email: 'splitleasetesting@test.com', firstName: 'Test', lastName: 'Guest', userType: 'Guest' }
    : authUser
      ? {
          id: authUser.id,
          email: authUser.email,
          firstName: authUser.firstName,
          lastName: authUser.fullName ? authUser.fullName.split(' ').slice(1).join(' ') : '',
          userType: authUser.userType
        }
      : null;

  const authState = {
    isChecking: isDevMode ? false : authLoading,
    isAuthenticated: isDevMode ? true : isAuthenticated,
    isGuest: isDevMode ? true : (authUser?.userType === 'Guest' || authUser?.userType?.includes?.('Guest')),
    shouldRedirect: false,
    redirectReason: redirectReason || null
  };

  // ============================================================================
  // STATE
  // ============================================================================

  // Data state
  const [leases, setLeases] = useState([]);

  // UI state - Lease card expansion
  const [expandedLeaseId, setExpandedLeaseId] = useState(null);

  // UI state - Check-in/checkout modal
  const [checkInOutModal, setCheckInOutModal] = useState({
    isOpen: false,
    mode: 'checkin', // 'checkin' | 'checkout'
    stay: null
  });

  // Loading and error state via useAsyncOperation
  const {
    data: fetchedLeases,
    isLoading,
    error: rawLoadError,
    execute: executeLoadLeases
  } = useAsyncOperation(
    async () => {
      console.log('Guest Leases: Fetching leases for user:', authUserId);
      const leasesData = await fetchGuestLeases();

      if (leasesData && Array.isArray(leasesData)) {
        console.log(`Guest Leases: Loaded ${leasesData.length} leases`);
        return leasesData;
      }
      return [];
    },
    { initialData: null }
  );

  // Normalize error to string for consumers (handle SESSION_EXPIRED specially)
  const error = rawLoadError
    ? (rawLoadError.message === 'SESSION_EXPIRED'
        ? 'Your session has expired. Please refresh the page to log in again.'
        : (rawLoadError.message || 'Failed to load leases. Please try again.'))
    : null;

  // Sync fetched leases into local state (leases is also mutated by other handlers)
  useEffect(() => {
    if (fetchedLeases !== null) {
      setLeases(fetchedLeases);
    }
  }, [fetchedLeases]);

  // Auto-expand first lease when leases load
  useEffect(() => {
    if (fetchedLeases && fetchedLeases.length > 0 && !expandedLeaseId) {
      setExpandedLeaseId(fetchedLeases[0].id);
    }
  }, [fetchedLeases, expandedLeaseId]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * DEV MODE: Set mock data for design testing
   */
  useEffect(() => {
    if (!isDevMode) return;

    const mockLeases = [
      {
        id: 'lease-001',
        agreementNumber: 'SL-2026-001',
        status: 'active',
        startDate: '2026-01-15',
        endDate: '2026-06-15',
        currentWeekNumber: 3,
        totalWeekCount: 22,
        listing: {
          id: 'listing-001',
          name: 'Sunny Chelsea Studio',
          neighborhood: 'Chelsea, Manhattan',
          address: '234 W 23rd St, New York, NY 10011',
          imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'
        },
        host: {
          id: 'host-001',
          firstName: 'Sarah',
          lastName: 'Miller',
          email: 'sarah.miller@example.com'
        },
        stays: [
          { id: 'stay-001', weekNumber: 1, checkIn: '2026-01-15', checkOut: '2026-01-22', status: 'completed', reviewSubmittedByGuest: true, reviewSubmittedByHost: { rating: 5, comment: 'Great guest!' } },
          { id: 'stay-002', weekNumber: 2, checkIn: '2026-01-22', checkOut: '2026-01-29', status: 'completed', reviewSubmittedByGuest: false, reviewSubmittedByHost: null },
          { id: 'stay-003', weekNumber: 3, checkIn: '2026-01-29', checkOut: '2026-02-05', status: 'in_progress', reviewSubmittedByGuest: false, reviewSubmittedByHost: null },
          { id: 'stay-004', weekNumber: 4, checkIn: '2026-02-05', checkOut: '2026-02-12', status: 'not_started', reviewSubmittedByGuest: false, reviewSubmittedByHost: null },
          { id: 'stay-005', weekNumber: 5, checkIn: '2026-02-12', checkOut: '2026-02-19', status: 'not_started', reviewSubmittedByGuest: false, reviewSubmittedByHost: null }
        ],
        dateChangeRequests: [
          { id: 'dcr-001', requestedBy: 'host-001', originalDate: '2026-02-12', newDate: '2026-02-14', reason: 'Personal conflict', status: 'pending' }
        ],
        paymentRecords: [
          { id: 'pay-001', date: '2026-01-10', amount: 850, status: 'paid', description: 'Week 1 rent', receiptUrl: '#' },
          { id: 'pay-002', date: '2026-01-17', amount: 850, status: 'paid', description: 'Week 2 rent', receiptUrl: '#' },
          { id: 'pay-003', date: '2026-01-24', amount: 850, status: 'pending', description: 'Week 3 rent', receiptUrl: null }
        ],
        periodicTenancyAgreement: '#',
        supplementalAgreement: '#',
        creditCardAuthorizationForm: null
      }
    ];

    setLeases(mockLeases);
    setExpandedLeaseId('lease-001');
  }, [isDevMode]);

  /**
   * Fetch leases when auth is complete
   * IMPORTANT: Dependencies use primitives (authLoading, isAuthenticated, authUserId)
   * instead of objects (authState, user) to prevent infinite re-render loops.
   */
  useEffect(() => {
    if (authLoading || !isAuthenticated || !authUserId || isDevMode) {
      return;
    }

    executeLoadLeases().catch((err) => {
      console.error('Guest Leases: Error fetching leases:', err);
    });
  }, [authLoading, isAuthenticated, authUserId, isDevMode, executeLoadLeases]);

  // ============================================================================
  // HANDLERS - LEASE CARD
  // ============================================================================

  /**
   * Toggle lease card expand/collapse
   */
  const handleToggleExpand = useCallback((leaseId) => {
    setExpandedLeaseId(prevId => prevId === leaseId ? null : leaseId);
  }, []);

  /**
   * Retry loading leases after error
   */
  const handleRetry = useCallback(async () => {
    try {
      await executeLoadLeases();
    } catch (err) {
      console.error('Guest Leases: Error retrying lease fetch:', err);
    }
  }, [executeLoadLeases]);

  // ============================================================================
  // HANDLERS - CHECK-IN/CHECKOUT
  // ============================================================================

  /**
   * Open check-in/checkout modal
   */
  const handleCheckInOut = useCallback((stay, mode) => {
    console.log(`🚪 Guest Leases: Opening ${mode} modal for stay:`, stay.id);
    setCheckInOutModal({
      isOpen: true,
      mode,
      stay
    });
  }, []);

  /**
   * Close check-in/checkout modal
   */
  const handleCloseCheckInOutModal = useCallback(() => {
    setCheckInOutModal({
      isOpen: false,
      mode: 'checkin',
      stay: null
    });
  }, []);

  /**
   * Send check-in/checkout message to host
   */
  const handleSendMessage = useCallback(async (message, stay) => {
    console.log('📨 Guest Leases: Sending message for stay:', stay.id, message);

    try {
      await sendCheckinMessage(stay.id, message, 'custom');

      showToast({
        title: 'Message Sent',
        message: 'Your message has been sent to the host.',
        type: 'success'
      });

      handleCloseCheckInOutModal();
    } catch (err) {
      console.error('❌ Guest Leases: Error sending message:', err);
      showToast({
        title: 'Error',
        message: err.message || 'Failed to send message. Please try again.',
        type: 'error'
      });
    }
  }, [showToast, handleCloseCheckInOutModal]);

  /**
   * Send "I'm on my way" notification
   */
  const handleImOnMyWay = useCallback(async (stay) => {
    console.log("🚗 Guest Leases: I'm on my way for stay:", stay.id);

    try {
      await sendCheckinMessage(stay.id, "I'm on my way!", 'on_my_way');

      showToast({
        title: 'Notification Sent',
        message: "The host has been notified that you're on your way.",
        type: 'success'
      });

      handleCloseCheckInOutModal();
    } catch (err) {
      console.error('❌ Guest Leases: Error sending on my way notification:', err);
      showToast({
        title: 'Error',
        message: err.message || 'Failed to send notification. Please try again.',
        type: 'error'
      });
    }
  }, [showToast, handleCloseCheckInOutModal]);

  /**
   * Send "I'm here" notification and update stay status
   */
  const handleImHere = useCallback(async (stay) => {
    console.log("🏠 Guest Leases: I'm here for stay:", stay.id);

    try {
      // Send notification and update status
      await sendCheckinMessage(stay.id, "I've arrived!", 'im_here');
      await updateStayStatus(stay.id, 'in_progress');

      showToast({
        title: 'Check-In Complete',
        message: "The host has been notified that you've arrived.",
        type: 'success'
      });

      handleCloseCheckInOutModal();
      // Refresh leases to reflect status change
      handleRetry();
    } catch (err) {
      console.error('❌ Guest Leases: Error sending arrival notification:', err);
      showToast({
        title: 'Error',
        message: err.message || 'Failed to send notification. Please try again.',
        type: 'error'
      });
    }
  }, [showToast, handleRetry, handleCloseCheckInOutModal]);

  /**
   * Submit cleaning or storage photos
   * Note: Photos are File objects that need to be uploaded to storage first
   */
  const handleSubmitPhotos = useCallback(async (photos, type, stay) => {
    console.log(`📷 Guest Leases: Submitting ${photos.length} ${type} photos for stay:`, stay.id);

    try {
      // Upload photos to Supabase storage first
      const photoUrls = [];
      for (const photo of photos) {
        const fileName = `${stay.id}/${type}/${Date.now()}-${photo.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('stay-photos')
          .upload(fileName, photo);

        if (uploadError) {
          throw new Error(`Failed to upload photo: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('stay-photos')
          .getPublicUrl(uploadData.path);

        photoUrls.push(urlData.publicUrl);
      }

      // Submit photo URLs to the API
      if (type === 'cleaning') {
        await submitCleaningPhotos(stay.id, photoUrls);
      } else {
        await submitStoragePhotos(stay.id, photoUrls);
      }

      showToast({
        title: 'Photos Submitted',
        message: `Your ${type} photos have been submitted successfully.`,
        type: 'success'
      });

      handleCloseCheckInOutModal();
    } catch (err) {
      console.error('❌ Guest Leases: Error submitting photos:', err);
      showToast({
        title: 'Error',
        message: err.message || 'Failed to submit photos. Please try again.',
        type: 'error'
      });
    }
  }, [showToast, handleCloseCheckInOutModal]);

  /**
   * Mark guest as leaving the property
   */
  const handleLeavingProperty = useCallback(async (stay) => {
    console.log('👋 Guest Leases: Leaving property for stay:', stay.id);

    try {
      await updateStayStatus(stay.id, 'completed');

      showToast({
        title: 'Check-Out Complete',
        message: 'Thank you! Safe travels!',
        type: 'success'
      });

      handleCloseCheckInOutModal();
      handleRetry();
    } catch (err) {
      console.error('❌ Guest Leases: Error completing checkout:', err);
      showToast({
        title: 'Error',
        message: err.message || 'Failed to complete checkout. Please try again.',
        type: 'error'
      });
    }
  }, [showToast, handleCloseCheckInOutModal, handleRetry]);

  // ============================================================================
  // HANDLERS - REVIEWS
  // ============================================================================

  /**
   * Open review submission modal
   */
  const handleSubmitReview = useCallback((stay) => {
    console.log('⭐ Guest Leases: Submit review for stay:', stay.id);
    // TODO: Open review modal or navigate to review page
    showToast({
      title: 'Coming Soon',
      message: 'Review submission will be available soon.',
      type: 'info'
    });
  }, [showToast]);

  /**
   * View review from host
   */
  const handleSeeReview = useCallback((stay) => {
    console.log('👁️ Guest Leases: See review for stay:', stay.id);
    // TODO: Open review view modal
    if (stay.reviewSubmittedByHost) {
      showToast({
        title: `Host Review: ${stay.reviewSubmittedByHost.rating}/5`,
        message: stay.reviewSubmittedByHost.comment || 'No comment provided.',
        type: 'info'
      });
    }
  }, [showToast]);

  // ============================================================================
  // HANDLERS - DATE CHANGES
  // ============================================================================

  /**
   * Approve a date change request
   */
  const handleDateChangeApprove = useCallback(async (request) => {
    console.log('✅ Guest Leases: Approve date change request:', request.id);

    try {
      await approveDateChangeRequest(request.id);

      showToast({
        title: 'Request Approved',
        message: 'The date change request has been approved.',
        type: 'success'
      });

      handleRetry();
    } catch (err) {
      console.error('❌ Guest Leases: Error approving date change:', err);
      showToast({
        title: 'Error',
        message: err.message || 'Failed to approve request. Please try again.',
        type: 'error'
      });
    }
  }, [showToast, handleRetry]);

  /**
   * Reject a date change request
   */
  const handleDateChangeReject = useCallback(async (request) => {
    console.log('❌ Guest Leases: Reject date change request:', request.id);

    try {
      await rejectDateChangeRequest(request.id);

      showToast({
        title: 'Request Rejected',
        message: 'The date change request has been rejected.',
        type: 'info'
      });

      handleRetry();
    } catch (err) {
      console.error('❌ Guest Leases: Error rejecting date change:', err);
      showToast({
        title: 'Error',
        message: err.message || 'Failed to reject request. Please try again.',
        type: 'error'
      });
    }
  }, [showToast, handleRetry]);

  /**
   * Navigate to Schedule Dashboard for date change requests
   */
  const handleRequestDateChange = useCallback((lease) => {
    window.location.href = `/schedule/${lease.id}`;
  }, []);

  // ============================================================================
  // HANDLERS - DOCUMENTS
  // ============================================================================

  /**
   * Download a document (PTA, supplemental, CC auth)
   */
  const handleDownloadDocument = useCallback((docType, url) => {
    console.log('📄 Guest Leases: Download document:', docType, url);

    if (!url) {
      showToast({
        title: 'Document Unavailable',
        message: `The ${docType} document is not available.`,
        type: 'warning'
      });
      return;
    }

    // Open document in new tab
    window.open(url, '_blank');
  }, [showToast]);

  // ============================================================================
  // HANDLERS - OTHER
  // ============================================================================

  /**
   * Request emergency assistance
   */
  const handleEmergencyAssistance = useCallback(() => {
    console.log('🚨 Guest Leases: Emergency assistance requested');
    // Navigate to emergency report page
    window.location.href = '/report-emergency';
  }, []);

  /**
   * View reputation/flexibility score details
   */
  const handleSeeReputation = useCallback(() => {
    console.log('📊 Guest Leases: See reputation');
    // TODO: Open reputation modal or navigate to reputation page
    showToast({
      title: 'Coming Soon',
      message: 'Reputation details will be available soon.',
      type: 'info'
    });
  }, [showToast]);

  // ============================================================================
  // COMPUTED VALUES (for hybrid design)
  // ============================================================================

  /**
   * Find the next upcoming stay across all leases
   * Used by HeroSection component
   */
  const nextStay = (() => {
    if (!leases || leases.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let upcomingStay = null;
    let upcomingLease = null;

    for (const lease of leases) {
      if (!lease.stays || lease.stays.length === 0) continue;

      for (const stay of lease.stays) {
        const checkIn = new Date(stay.checkIn);
        checkIn.setHours(0, 0, 0, 0);

        // Include stays that are upcoming or currently in progress
        if (stay.status === 'in_progress' ||
            (stay.status === 'not_started' && checkIn >= today)) {
          if (!upcomingStay || checkIn < new Date(upcomingStay.checkIn)) {
            upcomingStay = stay;
            upcomingLease = lease;
          }
        }
      }
    }

    return upcomingStay ? { ...upcomingStay, lease: upcomingLease } : null;
  })();

  /**
   * Get host info from the next stay's lease
   */
  const nextStayHost = nextStay?.lease?.host || null;
  const nextStayListing = nextStay?.lease?.listing || null;

  /**
   * Compute payment status across all leases
   * Returns: 'current' | 'overdue' | 'pending'
   */
  const paymentsStatus = (() => {
    if (!leases || leases.length === 0) return 'current';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const lease of leases) {
      if (!lease.paymentRecords) continue;

      for (const payment of lease.paymentRecords) {
        if (payment.status === 'overdue') return 'overdue';
        if (payment.status === 'pending') {
          const dueDate = new Date(payment.date);
          dueDate.setHours(0, 0, 0, 0);
          if (dueDate < today) return 'overdue';
        }
      }
    }

    // Check for pending payments due soon
    for (const lease of leases) {
      if (!lease.paymentRecords) continue;
      for (const payment of lease.paymentRecords) {
        if (payment.status === 'pending') return 'pending';
      }
    }

    return 'current';
  })();

  /**
   * Compute documents status
   * Returns: 'signed' | 'pending'
   */
  const documentsStatus = (() => {
    if (!leases || leases.length === 0) return 'signed';

    for (const lease of leases) {
      // Check if required documents are present
      if (lease.status === 'active' && !lease.periodicTenancyAgreement) {
        return 'pending';
      }
    }

    return 'signed';
  })();

  /**
   * Compute celebration banner content
   * Returns: { title, message } or null
   */
  const [celebrationBanner, setCelebrationBanner] = useState({ isVisible: false, title: '', message: '' });

  // Update celebration banner when next stay changes
  useEffect(() => {
    if (!nextStay) {
      setCelebrationBanner({ isVisible: false, title: '', message: '' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(nextStay.checkIn);
    checkIn.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((checkIn - today) / (1000 * 60 * 60 * 24));

    if (nextStay.status === 'in_progress') {
      setCelebrationBanner({
        isVisible: true,
        title: 'Check-in complete!',
        message: 'Enjoy your stay at ' + (nextStayListing?.name || 'your rental')
      });
    } else if (daysUntil === 0) {
      setCelebrationBanner({
        isVisible: true,
        title: 'Your stay begins today!',
        message: 'Get ready to check in at ' + (nextStayListing?.name || 'your rental')
      });
    } else if (daysUntil === 1) {
      setCelebrationBanner({
        isVisible: true,
        title: 'Your stay begins tomorrow!',
        message: 'Remember to review check-in instructions'
      });
    } else {
      setCelebrationBanner({ isVisible: false, title: '', message: '' });
    }
  }, [nextStay, nextStayListing?.name]);

  /**
   * Dismiss celebration banner
   */
  const handleDismissCelebration = useCallback(() => {
    setCelebrationBanner(prev => ({ ...prev, isVisible: false }));
  }, []);

  /**
   * Handle view details from hero section
   * Expands the lease card for the next stay
   */
  const handleViewStayDetails = useCallback(() => {
    if (nextStay?.lease?.id) {
      setExpandedLeaseId(nextStay.lease.id);
      // Scroll to the lease card
      const leaseCard = document.querySelector(`[data-lease-id="${nextStay.lease.id}"]`);
      if (leaseCard) {
        leaseCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [nextStay]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Auth state
    authState,

    // Raw data
    user,
    leases,

    // Computed values (hybrid design)
    nextStay,
    nextStayHost,
    nextStayListing,
    paymentsStatus,
    documentsStatus,
    celebrationBanner,

    // UI state
    expandedLeaseId,
    checkInOutModal,
    isLoading,
    error,

    // Handlers - Lease card
    handleToggleExpand,
    handleRetry,

    // Handlers - Check-in/checkout
    handleCheckInOut,
    handleCloseCheckInOutModal,
    handleSendMessage,
    handleImOnMyWay,
    handleImHere,
    handleSubmitPhotos,
    handleLeavingProperty,

    // Handlers - Reviews
    handleSubmitReview,
    handleSeeReview,

    // Handlers - Date changes
    handleDateChangeApprove,
    handleDateChangeReject,
    handleRequestDateChange,

    // Handlers - Documents
    handleDownloadDocument,

    // Handlers - Other
    handleEmergencyAssistance,
    handleSeeReputation,

    // Handlers - Hybrid design
    handleDismissCelebration,
    handleViewStayDetails
  };
}
