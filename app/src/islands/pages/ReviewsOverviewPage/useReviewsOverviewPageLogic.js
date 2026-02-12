/**
 * Reviews Overview Page Logic Hook
 *
 * Follows the Hollow Component Pattern:
 * - This hook contains ALL business logic
 * - The component contains ONLY JSX rendering
 *
 * Features:
 * - Authentication check (any authenticated user)
 * - Tab navigation state management
 * - Fetch reviews by tab (lazy loading)
 * - Create review modal management
 * - View review modal management
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';
import { supabase } from '../../../lib/supabase.js';
import { useToast } from '../../shared/Toast';
import { loadReviewsOverviewWorkflow, loadReviewCountsWorkflow } from '../../../logic/workflows/reviews/loadReviewsOverviewWorkflow.js';
import { submitReviewWorkflow } from '../../../logic/workflows/reviews/submitReviewWorkflow.js';

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchPendingReviews() {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reviews-overview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({ action: 'get_pending_reviews', payload: {} })
  });
  return response.json();
}

async function fetchReceivedReviews(limit = 20, offset = 0) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reviews-overview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({ action: 'get_received_reviews', payload: { limit, offset } })
  });
  return response.json();
}

async function fetchSubmittedReviews(limit = 20, offset = 0) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reviews-overview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({ action: 'get_submitted_reviews', payload: { limit, offset } })
  });
  return response.json();
}

async function createReview(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reviews-overview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({ action: 'create_review', payload })
  });
  return response.json();
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useReviewsOverviewPageLogic() {
  const { showToast } = useToast();

  // ============================================================================
  // AUTH (via useAuthenticatedUser hook)
  // ============================================================================
  const {
    user: authUser,
    userId: authUserId,
    loading: authLoading,
    isAuthenticated
  } = useAuthenticatedUser({ redirectOnFail: '/' });

  // Map hook user to the shape this component expects
  const user = authUser ? {
    id: authUser.id,
    email: authUser.email,
    firstName: authUser.firstName,
    lastName: authUser.fullName ? authUser.fullName.split(' ').slice(1).join(' ') : '',
    userType: authUser.userType
  } : null;

  const authState = {
    isChecking: authLoading,
    isAuthenticated,
    shouldRedirect: false,
    redirectReason: null
  };

  // Tab state
  const [activeTab, setActiveTab] = useState('pending');

  // Data state
  const [pendingReviews, setPendingReviews] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const [averageReceivedRating, setAverageReceivedRating] = useState(null);

  // Counts (for badges)
  const [pendingCount, setPendingCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);

  // Loading/error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [createReviewModal, setCreateReviewModal] = useState({
    isOpen: false,
    review: null,
    isSubmitting: false
  });
  const [viewReviewModal, setViewReviewModal] = useState({
    isOpen: false,
    review: null
  });

  // ============================================================================
  // LOAD ALL COUNTS ON MOUNT
  // ============================================================================

  const loadAllCounts = useCallback(async () => {
    if (!authState.isAuthenticated || authState.isChecking) return;

    try {
      const counts = await loadReviewCountsWorkflow({
        fetchPendingReviews,
        fetchReceivedReviews,
        fetchSubmittedReviews
      });

      setPendingCount(counts.pending);
      setReceivedCount(counts.received);
      setSubmittedCount(counts.submitted);
    } catch (err) {
      console.error('[Reviews Overview] Error loading counts:', err);
    }
  }, [authState.isAuthenticated, authState.isChecking]);

  useEffect(() => {
    if (authState.isAuthenticated && !authState.isChecking) {
      loadAllCounts();
    }
  }, [authState.isAuthenticated, authState.isChecking, loadAllCounts]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const loadTabData = useCallback(async (tab) => {
    if (authState.isChecking || authState.shouldRedirect || !user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await loadReviewsOverviewWorkflow({
        fetchPendingReviews,
        fetchReceivedReviews,
        fetchSubmittedReviews,
        activeTab: tab
      });

      if (results.error) {
        throw new Error(results.error);
      }

      if (tab === 'pending') {
        setPendingReviews(results.pending.reviews);
        setPendingCount(results.pending.totalCount);
      } else if (tab === 'received') {
        setReceivedReviews(results.received.reviews);
        setReceivedCount(results.received.totalCount);
        setAverageReceivedRating(results.received.averageRating);
      } else if (tab === 'submitted') {
        setSubmittedReviews(results.submitted.reviews);
        setSubmittedCount(results.submitted.totalCount);
      }

    } catch (err) {
      console.error('❌ Reviews Overview: Error loading data:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [authState.isChecking, authState.shouldRedirect, user]);

  // Load data when auth completes or tab changes
  useEffect(() => {
    if (authState.isAuthenticated && !authState.isChecking && user) {
      loadTabData(activeTab);
    }
  }, [activeTab, authState.isAuthenticated, authState.isChecking, user, loadTabData]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleRetry = useCallback(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  const handleOpenCreateReview = useCallback((review) => {
    setCreateReviewModal({ isOpen: true, review, isSubmitting: false });
  }, []);

  const handleCloseCreateReview = useCallback(() => {
    setCreateReviewModal({ isOpen: false, review: null, isSubmitting: false });
  }, []);

  const handleSubmitReview = useCallback(async (formData) => {
    setCreateReviewModal(prev => ({ ...prev, isSubmitting: true }));

    try {
      const reviewType = user?.userType === 'Host' ? 'host_reviews_guest' : 'guest_reviews_host';

      await submitReviewWorkflow({
        stayId: formData.stayId,
        ratings: formData.ratings,
        comment: formData.comment,
        wouldRecommend: formData.wouldRecommend,
        reviewType,
        createReview
      });

      showToast({
        title: 'Review Submitted',
        message: 'Thank you for your feedback!',
        type: 'success'
      });

      handleCloseCreateReview();

      // Refresh pending reviews and counts
      loadTabData('pending');
      loadAllCounts();

    } catch (err) {
      console.error('❌ Reviews Overview: Error submitting review:', err);
      showToast({
        title: 'Error',
        message: err.message || 'Failed to submit review. Please try again.',
        type: 'error'
      });
      setCreateReviewModal(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [user, showToast, handleCloseCreateReview, loadTabData, loadAllCounts]);

  const handleOpenViewReview = useCallback((review) => {
    setViewReviewModal({ isOpen: true, review });
  }, []);

  const handleCloseViewReview = useCallback(() => {
    setViewReviewModal({ isOpen: false, review: null });
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Auth state
    authState,
    user,

    // Tab state
    activeTab,
    handleTabChange,

    // Data
    pendingReviews,
    receivedReviews,
    submittedReviews,
    averageReceivedRating,

    // Counts
    pendingCount,
    receivedCount,
    submittedCount,

    // Loading/error
    isLoading,
    error,
    handleRetry,

    // Modal state
    createReviewModal,
    viewReviewModal,
    handleOpenCreateReview,
    handleCloseCreateReview,
    handleSubmitReview,
    handleOpenViewReview,
    handleCloseViewReview
  };
}
