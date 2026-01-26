/**
 * useManageRentalApplicationsPageLogic - All business logic for ManageRentalApplicationsPage
 *
 * This hook follows the Hollow Component pattern - ALL logic lives here,
 * the page component is purely presentational.
 *
 * State Management:
 * - applications: List of rental applications from API
 * - selectedApplication: Currently selected application for detail view
 * - UI state: loading, error, pagination, filters, modals
 *
 * @param {Object} options
 * @param {Function} options.showToast - Toast notification function
 * @returns {Object} All state and handlers for the page
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { checkAuthStatus } from '../../../lib/auth.js';
import { supabase } from '../../../lib/supabase.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ===== CONSTANTS =====
const DEFAULT_FILTERS = {
  searchQuery: '',
  status: '',
  completionStatus: 'all', // 'all' | 'completed' | 'incomplete'
  minIncome: ''
};

const DEFAULT_SORT = {
  field: 'created_at',
  direction: 'desc'
};

const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under-review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'conditionally-approved', label: 'Conditionally Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'expired', label: 'Expired' }
];

/**
 * Main logic hook for the Manage Rental Applications page
 */
export function useManageRentalApplicationsPageLogic({ showToast }) {
  // ===== AUTH STATE =====
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // ===== DATA STATE =====
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // ===== UI STATE =====
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSection, setEditSection] = useState(null);

  // ===== OPTIONS =====
  const statusOptions = STATUS_OPTIONS;

  // ===== URL PARAMETER HANDLING =====
  const getIdFromUrl = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }, []);

  // ===== AUTH CHECK (Optional - no redirect for internal pages) =====
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        // Try to get authentication token if user is logged in
        // No redirect if not authenticated - this is an internal page accessible without login
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Supabase Auth user - use session token
          setAccessToken(session.access_token);
          setCurrentUser(session.user);
        } else {
          // Legacy token auth user - get token from secure storage
          const legacyToken = localStorage.getItem('sl_auth_token') || sessionStorage.getItem('sl_auth_token');
          if (legacyToken) {
            setAccessToken(legacyToken);
            setCurrentUser({ authenticated: true });
          }
        }

        // Always authorize for internal pages
        setIsAuthorized(true);
      } catch (err) {
        console.error('[ManageRentalApps] Auth check failed:', err);
        // No redirect - just log the error and authorize anyway
        setIsAuthorized(true);
      } finally {
        setIsInitializing(false);
      }
    };

    verifyAccess();
  }, []);

  // ===== EDGE FUNCTION CALLER =====
  const callEdgeFunction = useCallback(async (action, payload = {}) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/rental-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ action, payload })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Action ${action} failed`);
    }

    return result;
  }, [accessToken]);

  // ===== FETCH APPLICATIONS =====
  const fetchApplications = useCallback(async () => {
    if (!accessToken || !isAuthorized) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await callEdgeFunction('list', {
        filters: {
          status: filters.status || undefined,
          searchQuery: filters.searchQuery || undefined,
          isCompleted: filters.completionStatus === 'all'
            ? undefined
            : filters.completionStatus === 'completed',
          minIncome: filters.minIncome ? parseFloat(filters.minIncome) : undefined
        },
        sort,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize
        }
      });

      setApplications(result.data || []);
      setPagination(prev => ({
        ...prev,
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 0
      }));
    } catch (err) {
      console.error('[ManageRentalApps] Fetch error:', err);
      setError(err.message);
      showToast({ title: 'Failed to load applications', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAuthorized, filters, sort, pagination.page, pagination.pageSize, callEdgeFunction, showToast]);

  // Fetch applications when ready
  useEffect(() => {
    if (accessToken && isAuthorized) {
      fetchApplications();
    }
  }, [accessToken, isAuthorized, fetchApplications]);

  // Handle URL deep linking
  useEffect(() => {
    if (accessToken && isAuthorized && !isLoading) {
      const urlId = getIdFromUrl();
      if (urlId) {
        handleSelectApplication(urlId);
      }
    }
  }, [accessToken, isAuthorized, isLoading, getIdFromUrl]);

  // ===== STATS =====
  const stats = useMemo(() => {
    // Note: For accurate stats, we'd ideally get these from the server
    // For now, calculate from current page if we don't have server stats
    return {
      submitted: applications.filter(a => a.status === 'submitted').length,
      underReview: applications.filter(a => a.status === 'under-review').length,
      approved: applications.filter(a => a.status === 'approved' || a.status === 'conditionally-approved').length,
      denied: applications.filter(a => a.status === 'denied').length,
      total: pagination.total
    };
  }, [applications, pagination.total]);

  // ===== HANDLERS =====

  // Filter handlers
  const handleUpdateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Sort handlers
  const handleUpdateSort = useCallback((field) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Pagination handlers
  const handleChangePage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const handleChangePageSize = useCallback((pageSize) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  // Selection handlers
  const handleSelectApplication = useCallback(async (id) => {
    setIsLoadingDetail(true);
    setError(null);

    try {
      const result = await callEdgeFunction('get', { id });

      setSelectedApplication(result.data);
      setViewMode('detail');

      // Update URL without full reload
      const url = new URL(window.location);
      url.searchParams.set('id', id);
      window.history.pushState({}, '', url);
    } catch (err) {
      console.error('[ManageRentalApps] Failed to fetch application:', err);
      showToast({ title: 'Failed to load application details', content: err.message, type: 'error' });
    } finally {
      setIsLoadingDetail(false);
    }
  }, [callEdgeFunction, showToast]);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedApplication(null);

    // Remove id from URL
    const url = new URL(window.location);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url);
  }, []);

  // Edit modal handlers
  const handleOpenEditModal = useCallback((section) => {
    setEditSection(section);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditSection(null);
  }, []);

  const handleSaveEdit = useCallback(async (updates) => {
    if (!selectedApplication) return;

    setIsSaving(true);

    try {
      const result = await callEdgeFunction('update', {
        id: selectedApplication.id,
        updates
      });

      setSelectedApplication(prev => ({ ...prev, ...result.data }));
      showToast({ title: 'Application updated successfully', type: 'success' });
      handleCloseEditModal();

      // Refresh the list to reflect changes
      fetchApplications();
    } catch (err) {
      console.error('[ManageRentalApps] Failed to update application:', err);
      showToast({ title: 'Failed to update application', content: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [selectedApplication, callEdgeFunction, showToast, handleCloseEditModal, fetchApplications]);

  // Status update handler
  const handleUpdateStatus = useCallback(async (newStatus) => {
    if (!selectedApplication) return;

    setIsSaving(true);

    try {
      const result = await callEdgeFunction('update_status', {
        id: selectedApplication.id,
        status: newStatus
      });

      setSelectedApplication(prev => ({ ...prev, status: result.data.status }));
      showToast({ title: `Status updated to "${newStatus}"`, type: 'success' });

      // Refresh the list to reflect changes
      fetchApplications();
    } catch (err) {
      console.error('[ManageRentalApps] Failed to update status:', err);
      showToast({ title: 'Failed to update status', content: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [selectedApplication, callEdgeFunction, showToast, fetchApplications]);

  // Retry handler
  const handleRetry = useCallback(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ===== RETURN =====
  return {
    // Auth
    isInitializing,
    isAuthorized,
    currentUser,

    // Data
    applications,
    selectedApplication,
    isLoading,
    isLoadingDetail,
    isSaving,
    error,

    // Stats
    stats,

    // UI
    viewMode,
    filters,
    sort,
    pagination,
    isEditModalOpen,
    editSection,
    statusOptions,

    // Handlers
    handleUpdateFilters,
    handleClearFilters,
    handleUpdateSort,
    handleChangePage,
    handleChangePageSize,
    handleSelectApplication,
    handleBackToList,
    handleOpenEditModal,
    handleCloseEditModal,
    handleSaveEdit,
    handleUpdateStatus,
    handleRetry
  };
}
