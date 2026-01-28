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
import { checkAuthStatus, validateTokenAndFetchUser, getUserType } from '../../../lib/auth.js';
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
  // STATE
  // ============================================================================

  // Auth state
  const [authState, setAuthState] = useState({
    isChecking: true,
    isAuthenticated: false,
    isGuest: false,
    shouldRedirect: false,
    redirectReason: null
  });

  // Data state
  const [user, setUser] = useState(null);
  const [leases, setLeases] = useState([]);

  // UI state - Lease card expansion
  const [expandedLeaseId, setExpandedLeaseId] = useState(null);

  // UI state - Check-in/checkout modal
  const [checkInOutModal, setCheckInOutModal] = useState({
    isOpen: false,
    mode: 'checkin', // 'checkin' | 'checkout'
    stay: null
  });

  // Loading and error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // AUTHENTICATION CHECK
  // ============================================================================

  /**
   * Check authentication status and user type
   * Redirects if not authenticated or not a Guest
   *
   * Uses two-step auth pattern (same as GuestProposalsPage):
   * 1. checkAuthStatus() - lightweight check for tokens/cookies
   * 2. validateTokenAndFetchUser() - validates token AND fetches user data
   */
  useEffect(() => {
    async function checkAuth() {
      console.log('🔐 Guest Leases: Checking authentication...');

      // Step 1: Lightweight auth check
      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        console.log('❌ Guest Leases: User not authenticated, redirecting to home');
        setAuthState({
          isChecking: false,
          isAuthenticated: false,
          isGuest: false,
          shouldRedirect: true,
          redirectReason: 'NOT_AUTHENTICATED'
        });
        window.location.href = '/';
        return;
      }

      // Step 2: Deep validation with clearOnFailure: false
      const userData = await validateTokenAndFetchUser({ clearOnFailure: false });

      let userType = null;
      let isGuest = false;

      if (userData) {
        // Success path: Use validated user data
        userType = userData.userType;
        isGuest = userType === 'Guest' || userType?.includes?.('Guest');
        console.log('✅ Guest Leases: User data loaded, userType:', userType);
        setUser(userData);
      } else {
        // Fallback to Supabase session metadata
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          userType = session.user.user_metadata?.user_type || getUserType() || null;
          isGuest = userType === 'Guest' || userType?.includes?.('Guest');
          console.log('⚠️ Guest Leases: Using fallback session data, userType:', userType);

          if (!userType) {
            console.log('❌ Guest Leases: Cannot determine user type, redirecting');
            setAuthState({
              isChecking: false,
              isAuthenticated: true,
              isGuest: false,
              shouldRedirect: true,
              redirectReason: 'USER_TYPE_UNKNOWN'
            });
            window.location.href = '/';
            return;
          }

          // Set minimal user data from session
          setUser({
            _id: session.user.id,
            email: session.user.email,
            firstName: session.user.user_metadata?.first_name || 'Guest',
            lastName: session.user.user_metadata?.last_name || '',
            userType
          });
        } else {
          console.log('❌ Guest Leases: No valid session, redirecting to home');
          setAuthState({
            isChecking: false,
            isAuthenticated: false,
            isGuest: false,
            shouldRedirect: true,
            redirectReason: 'TOKEN_INVALID'
          });
          window.location.href = '/';
          return;
        }
      }

      // Check if user is a Guest
      if (!isGuest) {
        console.log('❌ Guest Leases: User is not a Guest, redirecting');
        setAuthState({
          isChecking: false,
          isAuthenticated: true,
          isGuest: false,
          shouldRedirect: true,
          redirectReason: 'NOT_GUEST'
        });
        // Redirect Hosts to host-leases page
        window.location.href = '/host-leases';
        return;
      }

      // Auth successful
      setAuthState({
        isChecking: false,
        isAuthenticated: true,
        isGuest: true,
        shouldRedirect: false,
        redirectReason: null
      });
    }

    checkAuth();
  }, []);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch leases when auth is complete
   */
  useEffect(() => {
    async function loadLeases() {
      if (authState.isChecking || authState.shouldRedirect || !user) {
        return;
      }

      console.log('📦 Guest Leases: Fetching leases for user:', user._id);
      setIsLoading(true);
      setError(null);

      try {
        const leasesData = await fetchGuestLeases();

        if (leasesData && Array.isArray(leasesData)) {
          setLeases(leasesData);
          console.log(`✅ Guest Leases: Loaded ${leasesData.length} leases`);

          // Auto-expand first lease if available
          if (leasesData.length > 0 && !expandedLeaseId) {
            setExpandedLeaseId(leasesData[0]._id);
          }
        } else {
          setLeases([]);
        }
      } catch (err) {
        console.error('❌ Guest Leases: Error fetching leases:', err);
        setError(err.message || 'Failed to load leases. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadLeases();
  }, [authState.isChecking, authState.shouldRedirect, user]);

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
    setIsLoading(true);
    setError(null);

    try {
      const leasesData = await fetchGuestLeases();
      if (leasesData && Array.isArray(leasesData)) {
        setLeases(leasesData);
        if (leasesData.length > 0 && !expandedLeaseId) {
          setExpandedLeaseId(leasesData[0]._id);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load leases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [expandedLeaseId]);

  // ============================================================================
  // HANDLERS - CHECK-IN/CHECKOUT
  // ============================================================================

  /**
   * Open check-in/checkout modal
   */
  const handleCheckInOut = useCallback((stay, mode) => {
    console.log(`🚪 Guest Leases: Opening ${mode} modal for stay:`, stay._id);
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
    console.log('📨 Guest Leases: Sending message for stay:', stay._id, message);

    try {
      await sendCheckinMessage(stay._id, message, 'custom');

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
    console.log("🚗 Guest Leases: I'm on my way for stay:", stay._id);

    try {
      await sendCheckinMessage(stay._id, "I'm on my way!", 'on_my_way');

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
    console.log("🏠 Guest Leases: I'm here for stay:", stay._id);

    try {
      // Send notification and update status
      await sendCheckinMessage(stay._id, "I've arrived!", 'im_here');
      await updateStayStatus(stay._id, 'in_progress');

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
    console.log(`📷 Guest Leases: Submitting ${photos.length} ${type} photos for stay:`, stay._id);

    try {
      // Upload photos to Supabase storage first
      const photoUrls = [];
      for (const photo of photos) {
        const fileName = `${stay._id}/${type}/${Date.now()}-${photo.name}`;
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
        await submitCleaningPhotos(stay._id, photoUrls);
      } else {
        await submitStoragePhotos(stay._id, photoUrls);
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
    console.log('👋 Guest Leases: Leaving property for stay:', stay._id);

    try {
      await updateStayStatus(stay._id, 'completed');

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
    console.log('⭐ Guest Leases: Submit review for stay:', stay._id);
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
    console.log('👁️ Guest Leases: See review for stay:', stay._id);
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
    console.log('✅ Guest Leases: Approve date change request:', request._id);

    try {
      await approveDateChangeRequest(request._id);

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
    console.log('❌ Guest Leases: Reject date change request:', request._id);

    try {
      await rejectDateChangeRequest(request._id);

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
   * Open date change request modal
   */
  const handleRequestDateChange = useCallback(() => {
    console.log('📅 Guest Leases: Request date change');
    // TODO: Open date change request modal
    showToast({
      title: 'Coming Soon',
      message: 'Date change requests will be available soon.',
      type: 'info'
    });
  }, [showToast]);

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
  // RETURN
  // ============================================================================

  return {
    // Auth state
    authState,

    // Raw data
    user,
    leases,

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
    handleSeeReputation
  };
}
