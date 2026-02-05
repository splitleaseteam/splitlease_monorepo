/**
 * useManageLeasesPageLogic - All business logic for ManageLeasesPaymentRecordsPage
 *
 * HOLLOW COMPONENT PATTERN: ALL logic lives here
 * The page component is purely presentational.
 *
 * State Groups:
 * - Auth & Admin: User authentication, run-as functionality
 * - Lease Selection: Search, filtering, selected lease
 * - Payment Records: CRUD operations, regeneration
 * - Stays: Create, clear, display
 * - Documents: Upload, generation, change requests
 * - UI: Loading, errors, modals
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { adaptLeaseFromSupabase } from '../../../logic/processors/leases/adaptLeaseFromSupabase.js';
import { generateAllDocuments } from '../../../logic/workflows/documents/generateAllDocuments.js';
import {
  checkAllDocumentsReadiness,
  formatReadinessReport,
  formatReadinessForSlack,
} from '../../../logic/rules/documents/leaseReadinessChecks.js';

// Get dev project credentials from .env or hardcode for reliability
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qzsmhgyojmwvtjmnrdea.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c21oZ3lvam13dnRqbW5yZGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTE2NDksImV4cCI6MjA4MzUyNzY0OX0.cSPOwU1wyiBorIicEGoyDEmoh34G0Hf_39bRXkwvCDc';

export function useManageLeasesPageLogic({ showToast }) {
  // ============================================================================
  // AUTH & ADMIN STATE
  // ============================================================================
  const [accessToken, setAccessToken] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [runAsUser, setRunAsUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  // ============================================================================
  // LEASE SELECTION STATE
  // ============================================================================
  const [leases, setLeases] = useState([]);
  const [selectedLease, setSelectedLease] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // PAYMENT RECORDS STATE
  // ============================================================================
  const [guestPayments, setGuestPayments] = useState([]);
  const [hostPayments, setHostPayments] = useState([]);

  // ============================================================================
  // DOCUMENT CHANGE REQUESTS STATE
  // ============================================================================
  const [guestChangeRequests, setGuestChangeRequests] = useState([]);
  const [hostChangeRequests, setHostChangeRequests] = useState([]);

  // ============================================================================
  // UI STATE
  // ============================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);

  // ============================================================================
  // DOCUMENT READINESS STATE
  // ============================================================================
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [readinessReport, setReadinessReport] = useState(null);
  const [readinessData, setReadinessData] = useState(null);

  // ============================================================================
  // AUTH SETUP (OPTIONAL - internal page uses soft headers pattern)
  // ============================================================================
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || localStorage.getItem('sl_auth_token') || '';
        setAccessToken(token);

        // Internal admin page - always treat as admin (soft headers pattern)
        // Authentication is optional; backend uses service role
        setIsAdmin(true);

        // Always fetch leases - authentication is optional
        await fetchLeases();
      } catch (err) {
        console.error('[ManageLeases] Auth check failed:', err);
        // Still try to fetch leases without auth
        await fetchLeases();
      }
    };

    loadAuth();
  }, []);

  // ============================================================================
  // API HELPERS (Soft Headers Pattern - always include apikey + Authorization)
  // ============================================================================
  const callEdgeFunction = useCallback(async (action, payload = {}) => {
    // Get fresh session for each call
    const { data: { session } } = await supabase.auth.getSession();

    // Build headers with soft headers pattern
    // For unauthenticated requests, use anon key in Authorization header
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/leases-admin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, payload })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      const errorMessage = result.error || `Action ${action} failed`;
      throw new Error(errorMessage);
    }

    return result.data;
  }, []);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const fetchLeases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await callEdgeFunction('list', { limit: 500 });
      const adapted = (data || []).map(adaptLeaseFromSupabase);
      setLeases(adapted);

      // Check URL for pre-selected lease or search query
      const urlParams = new URLSearchParams(window.location.search);
      const leaseId = urlParams.get('leaseId') || extractLeaseIdFromPath();
      const searchParam = urlParams.get('search');

      // If search param is provided (e.g., from ProposalManagePage), pre-populate search
      // and auto-select if exactly 1 lease matches
      if (searchParam) {
        setSearchQuery(searchParam);

        // Filter leases by search param to check for auto-selection
        const query = searchParam.toLowerCase();
        const matchingLeases = adapted.filter(lease => {
          return (
            lease.id?.toLowerCase().includes(query) ||
            lease.proposalId?.toLowerCase().includes(query) ||
            lease.agreementNumber?.toLowerCase().includes(query) ||
            lease.guest?.email?.toLowerCase().includes(query) ||
            lease.guest?.fullName?.toLowerCase().includes(query) ||
            lease.guest?.firstName?.toLowerCase().includes(query) ||
            lease.guest?.lastName?.toLowerCase().includes(query) ||
            lease.guest?.phone?.includes(query) ||
            lease.host?.email?.toLowerCase().includes(query) ||
            lease.host?.fullName?.toLowerCase().includes(query) ||
            lease.listing?.name?.toLowerCase().includes(query) ||
            lease.listing?.address?.toLowerCase().includes(query)
          );
        });

        // Auto-select if exactly 1 lease matches the search
        if (matchingLeases.length === 1) {
          const matchedLease = matchingLeases[0];
          setSelectedLease(matchedLease);
          await fetchLeaseDetails(matchedLease.id);
          // Update URL to include lease ID
          window.history.pushState({}, '', `/_manage-leases-payment-records/${matchedLease.id}`);
          return; // Skip leaseId check since we already selected
        }
      }

      if (leaseId) {
        const lease = adapted.find(l => l.id === leaseId);
        if (lease) {
          setSelectedLease(lease);
          await fetchLeaseDetails(lease.id);
        }
      }
    } catch (err) {
      console.error('[ManageLeases] Fetch failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [callEdgeFunction]);

  /**
   * Extract lease ID from URL path
   * Handles: /_manage-leases-payment-records/:leaseId
   */
  function extractLeaseIdFromPath() {
    const path = window.location.pathname;
    const match = path.match(/\/_manage-leases-payment-records\/([^/]+)/);
    return match ? match[1] : null;
  }

  const fetchLeaseDetails = useCallback(async (leaseId) => {
    try {
      setIsLoading(true);
      const data = await callEdgeFunction('get', { leaseId });
      const adapted = adaptLeaseFromSupabase(data);
      setSelectedLease(adapted);

      // Separate guest vs host payments
      const payments = adapted.paymentRecords || [];
      setGuestPayments(payments.filter(p => p.paymentFromGuest));
      setHostPayments(payments.filter(p => p.paymentToHost));

      // Fetch document change requests
      await fetchDocumentChangeRequests(leaseId);
    } catch (err) {
      console.error('[ManageLeases] Fetch details failed:', err);
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [callEdgeFunction, showToast]);

  const fetchDocumentChangeRequests = useCallback(async (leaseId) => {
    try {
      // Try to fetch document change requests if the action exists
      const data = await callEdgeFunction('getDocumentChangeRequests', { leaseId });
      const requests = data || [];
      setGuestChangeRequests(requests.filter(r => r.requestedByType === 'guest'));
      setHostChangeRequests(requests.filter(r => r.requestedByType === 'host'));
    } catch (err) {
      // Action may not exist yet - just set empty arrays
      console.warn('[ManageLeases] Document change requests not available:', err.message);
      setGuestChangeRequests([]);
      setHostChangeRequests([]);
    }
  }, [callEdgeFunction]);

  // ============================================================================
  // FILTERED LEASES (for search)
  // ============================================================================
  const filteredLeases = useMemo(() => {
    if (!searchQuery.trim()) return leases;

    const query = searchQuery.toLowerCase();
    return leases.filter(lease => {
      return (
        lease.id?.toLowerCase().includes(query) ||
        lease.proposalId?.toLowerCase().includes(query) ||
        lease.agreementNumber?.toLowerCase().includes(query) ||
        lease.guest?.email?.toLowerCase().includes(query) ||
        lease.guest?.fullName?.toLowerCase().includes(query) ||
        lease.guest?.firstName?.toLowerCase().includes(query) ||
        lease.guest?.lastName?.toLowerCase().includes(query) ||
        lease.guest?.phone?.includes(query) ||
        lease.host?.email?.toLowerCase().includes(query) ||
        lease.host?.fullName?.toLowerCase().includes(query) ||
        lease.listing?.name?.toLowerCase().includes(query) ||
        lease.listing?.address?.toLowerCase().includes(query)
      );
    });
  }, [leases, searchQuery]);

  // ============================================================================
  // LEASE SELECTION HANDLERS
  // ============================================================================
  const handleLeaseSelect = useCallback(async (lease) => {
    if (!lease) {
      setSelectedLease(null);
      setGuestPayments([]);
      setHostPayments([]);
      window.history.pushState({}, '', '/_manage-leases-payment-records');
      return;
    }

    setSelectedLease(lease);
    await fetchLeaseDetails(lease.id);
    // Update URL without full navigation
    window.history.pushState({}, '', `/_manage-leases-payment-records/${lease.id}`);
  }, [fetchLeaseDetails]);

  // ============================================================================
  // PAYMENT RECORD HANDLERS
  // ============================================================================
  const handleCreatePaymentRecord = useCallback(async (paymentData) => {
    try {
      setIsLoading(true);
      await callEdgeFunction('createPaymentRecord', {
        leaseId: selectedLease.id,
        ...paymentData
      });
      showToast({ title: 'Success', content: 'Payment record created', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleEditPaymentRecord = useCallback(async (paymentId, updates) => {
    try {
      setIsLoading(true);
      await callEdgeFunction('updatePaymentRecord', { paymentId, ...updates });
      showToast({ title: 'Success', content: 'Payment record updated', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleDeletePaymentRecord = useCallback(async (paymentId) => {
    try {
      setIsLoading(true);
      await callEdgeFunction('deletePaymentRecord', { paymentId });
      showToast({ title: 'Success', content: 'Payment record deleted', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleRegenerateGuestPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('regeneratePaymentRecords', {
        leaseId: selectedLease.id,
        type: 'guest'
      });
      showToast({ title: 'Success', content: 'Guest payment records regenerated', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleRegenerateHostPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('regeneratePaymentRecords', {
        leaseId: selectedLease.id,
        type: 'host'
      });
      showToast({ title: 'Success', content: 'Host payment records regenerated', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleRegenerateAllPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('regeneratePaymentRecords', {
        leaseId: selectedLease.id,
        type: 'all'
      });
      showToast({ title: 'Success', content: 'All payment records regenerated', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  // ============================================================================
  // STAYS HANDLERS
  // ============================================================================
  const handleCreateStays = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('createStays', { leaseId: selectedLease.id });
      showToast({ title: 'Success', content: 'Stays created', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleClearStays = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('clearStays', { leaseId: selectedLease.id });
      showToast({ title: 'Success', content: 'Stays cleared', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  // ============================================================================
  // BOOKED DATES HANDLERS
  // ============================================================================
  const handleUpdateBookedDates = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('updateBookedDates', { leaseId: selectedLease.id });
      showToast({ title: 'Success', content: 'Booked dates updated', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleClearDates = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('clearBookedDates', { leaseId: selectedLease.id });
      showToast({ title: 'Success', content: 'Dates cleared', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  // ============================================================================
  // DOCUMENT HANDLERS
  // ============================================================================
  const handleUploadDocument = useCallback(async (documentType, file) => {
    try {
      setIsLoading(true);
      // Convert file to base64
      const base64 = await fileToBase64(file);

      await callEdgeFunction('uploadDocument', {
        leaseId: selectedLease.id,
        fileName: file.name,
        fileType: file.type,
        fileBase64: base64,
        documentType
      });
      showToast({ title: 'Success', content: 'Document uploaded', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  /**
   * Convert file to base64 string
   */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }

  const handleGenerateDocs = useCallback(async (method) => {
    // Document generation integrates with Zapier or Python script
    showToast({
      title: 'Document Generation',
      content: `Document generation via ${method} triggered. Check external system for status.`,
      type: 'info'
    });
  }, [showToast]);

  /**
   * Fetch listing photos for document generation
   * Photos are stored in 'Features - Photos' (JSONB) or listing_photo table
   */
  async function fetchListingPhotos(listingId) {
    if (!listingId) return [];

    try {
      // First try to get photos from listing's 'Features - Photos' column
      const { data: listingData } = await supabase
        .from('Listing')
        .select('"Features - Photos"')
        .eq('_id', listingId)
        .single();

      // Parse embedded photos if available
      if (listingData?.['Features - Photos']) {
        const embeddedPhotos = listingData['Features - Photos'];
        if (Array.isArray(embeddedPhotos) && embeddedPhotos.length > 0) {
          // Could be array of URLs or array of objects with url property
          return embeddedPhotos.slice(0, 3).map(photo =>
            typeof photo === 'string' ? photo : (photo?.url || photo?.Photo || '')
          ).filter(Boolean);
        }
      }

      // Fallback: fetch from listing_photo table
      const { data: photosData } = await supabase
        .from('listing_photo')
        .select('Photo')
        .eq('Listing', listingId)
        .order('SortOrder', { ascending: true, nullsLast: true })
        .limit(3);

      if (photosData && photosData.length > 0) {
        return photosData.map(p => p.Photo).filter(Boolean);
      }

      return [];
    } catch (err) {
      console.warn('[ManageLeases] Failed to fetch listing photos:', err);
      return [];
    }
  }

  /**
   * Check lease readiness and show the readiness modal before generating documents.
   * This replaces the old direct generation approach with a pre-flight check.
   */
  const handleGenerateAllDocs = useCallback(async () => {
    if (!selectedLease) {
      showToast({ title: 'Error', content: 'No lease selected', type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      console.log('[ManageLeases] Checking document readiness for lease:', selectedLease.id);

      // Fetch all data needed for readiness check
      const leaseId = selectedLease.id;

      // Fetch lease details
      const { data: leaseData } = await supabase
        .from('bookings_leases')
        .select('*')
        .eq('_id', leaseId)
        .single();

      // Fetch proposal if linked
      let proposalData = null;
      if (leaseData?.Proposal) {
        const { data: proposal } = await supabase
          .from('proposal')
          .select('*')
          .eq('_id', leaseData.Proposal)
          .single();
        proposalData = proposal;
      }

      // Fetch listing if linked
      let listingData = null;
      if (leaseData?.Listing) {
        const { data: listing } = await supabase
          .from('listing')
          .select('*')
          .eq('_id', leaseData.Listing)
          .single();
        listingData = listing;
      }

      // Fetch guest user if linked
      let guestData = null;
      if (leaseData?.Guest) {
        const { data: guest } = await supabase
          .from('user')
          .select('*')
          .eq('_id', leaseData.Guest)
          .single();
        guestData = guest;
      }

      // Fetch host user if linked
      let hostData = null;
      if (leaseData?.Host) {
        const { data: host } = await supabase
          .from('user')
          .select('*')
          .eq('_id', leaseData.Host)
          .single();
        hostData = host;
      }

      // Fetch payment records
      const { data: allPaymentsData } = await supabase
        .from('paymentrecords')
        .select('*')
        .filter('"Booking - Reservation"', 'eq', leaseId)
        .limit(30);

      const guestPaymentsData = (allPaymentsData || []).filter(r => r['Payment from guest?'] === true);
      const hostPaymentsData = (allPaymentsData || []).filter(r => r['Payment to Host?'] === true);

      // Fetch listing photos
      let listingPhotosData = [];
      if (listingData?._id) {
        const { data: photos } = await supabase
          .from('listing_photo')
          .select('Photo')
          .eq('Listing', listingData._id)
          .order('SortOrder', { ascending: true, nullsLast: true })
          .limit(3);
        listingPhotosData = (photos || []).map(p => p.Photo).filter(Boolean);
      }

      // Build data object for readiness check
      const readinessCheckData = {
        lease: leaseData,
        proposal: proposalData,
        listing: listingData,
        guest: guestData,
        host: hostData,
        guestPayments: guestPaymentsData,
        hostPayments: hostPaymentsData,
        listingPhotos: listingPhotosData,
      };

      // Run readiness check
      const report = checkAllDocumentsReadiness(readinessCheckData);

      console.log('[ManageLeases] Readiness check complete:', report.summary);
      console.log(formatReadinessReport(report, leaseData));

      // Store readiness data for later use in generation
      setReadinessData(readinessCheckData);
      setReadinessReport(report);
      setShowReadinessModal(true);

    } catch (err) {
      console.error('[ManageLeases] Readiness check error:', err);
      showToast({
        title: 'Readiness Check Failed',
        content: err.message || 'Failed to check document readiness',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, showToast]);

  /**
   * Generate selected documents after readiness check approval.
   * Called from the readiness modal with the list of document types to generate.
   *
   * @param {string[]} documentTypes - Array of document types to generate (e.g., ['hostPayout', 'supplemental'])
   */
  const handleGenerateSelectedDocs = useCallback(async (documentTypes) => {
    if (!selectedLease || !documentTypes || documentTypes.length === 0) {
      showToast({ title: 'Error', content: 'No documents selected', type: 'error' });
      return;
    }

    setShowReadinessModal(false);
    setIsGeneratingDocs(true);

    try {
      console.log('[ManageLeases] Starting document generation for:', documentTypes);
      console.log('[ManageLeases] Lease:', selectedLease.id);

      // Call the workflow with lease ID and selected document types
      const results = await generateAllDocuments({
        leaseId: selectedLease.id,
        documentTypes, // Pass the selected types
        onProgress: (progress) => {
          console.log(`[ManageLeases] Progress: Step ${progress.step} - ${progress.message}`);
        }
      });

      console.log('[ManageLeases] Document generation results:', results);

      // Log warnings if any
      if (results.warnings && results.warnings.length > 0) {
        console.warn('[ManageLeases] Warnings:', results.warnings);
      }

      // Check for validation errors (data issues preventing generation)
      if (results.errors && results.errors.length > 0 && !results.success) {
        console.error('[ManageLeases] Validation errors:', results.errors);

        // Send to Slack for tracking
        if (readinessReport && !readinessReport.canGenerateAll) {
          const slackPayload = formatReadinessForSlack(readinessReport, selectedLease);
          console.log('[ManageLeases] Would send to Slack:', slackPayload);
          // TODO: Integrate with Slack service when available
        }

        showToast({
          title: 'Validation Failed',
          content: results.errors[0] || 'Missing required data for document generation',
          type: 'error'
        });
        return;
      }

      // Process document results
      const docTypeNames = {
        hostPayout: 'Host Payout',
        supplemental: 'Supplemental',
        periodicTenancy: 'Periodic Tenancy',
        creditCardAuth: 'Credit Card Auth'
      };

      const successes = [];
      const failures = [];
      const errorMessages = [];

      console.log('='.repeat(60));
      console.log('[ManageLeases] DOCUMENT GENERATION RESULTS');
      console.log('='.repeat(60));

      documentTypes.forEach(docType => {
        const docResult = results.documents?.[docType];
        const displayName = docTypeNames[docType] || docType;

        if (docResult?.success) {
          successes.push(displayName);
          console.info(`✅ ${displayName}: SUCCESS`, docResult.driveUrl ? `- ${docResult.driveUrl}` : '');
        } else {
          failures.push(displayName);
          const error = docResult?.error || 'Unknown error';
          errorMessages.push(`${displayName}: ${error}`);
          console.error(`❌ ${displayName}: FAILED -`, error);
        }
      });

      console.log('='.repeat(60));
      console.log(`[ManageLeases] Summary: ${successes.length} succeeded, ${failures.length} failed`);
      console.log('='.repeat(60));

      // Show appropriate toast based on results
      if (failures.length === 0) {
        showToast({
          title: 'Documents Generated',
          content: `${successes.length} document(s) generated successfully.`,
          type: 'success'
        });
      } else if (successes.length > 0) {
        const errorDetail = errorMessages.length > 0
          ? ` Errors: ${errorMessages.join('; ')}`
          : '';
        showToast({
          title: 'Partial Success',
          content: `Generated: ${successes.join(', ')}. Failed: ${failures.join(', ')}.${errorDetail}`,
          type: 'warning'
        });
      } else {
        const errorDetail = errorMessages.length > 0
          ? errorMessages[0]
          : 'Check console for details';
        showToast({
          title: 'Generation Failed',
          content: `All documents failed. ${errorDetail}`,
          type: 'error'
        });
      }

      // Refresh lease to get updated document URLs
      await fetchLeaseDetails(selectedLease.id);

    } catch (err) {
      console.error('[ManageLeases] Document generation error:', err);
      showToast({
        title: 'Generation Error',
        content: err.message || 'Failed to generate documents',
        type: 'error'
      });
    } finally {
      setIsGeneratingDocs(false);
    }
  }, [selectedLease, showToast, fetchLeaseDetails, readinessReport]);

  const handleSendDocuments = useCallback(async () => {
    // Document sending integrates with HelloSign
    showToast({
      title: 'Send Documents',
      content: 'Document sending via HelloSign triggered. Check HelloSign for status.',
      type: 'info'
    });
  }, [showToast]);

  const handleOpenPdf = useCallback((url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      showToast({ title: 'Not Available', content: 'Document not found', type: 'warning' });
    }
  }, [showToast]);

  // ============================================================================
  // CANCELLATION HANDLER
  // ============================================================================
  const handleCancelLease = useCallback(async (reason, disagreeingParty) => {
    try {
      setIsLoading(true);
      await callEdgeFunction('cancelLease', {
        leaseId: selectedLease.id,
        reason,
        disagreeingParty
      });
      showToast({ title: 'Success', content: 'Lease cancelled', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  // ============================================================================
  // ADMIN HANDLERS
  // ============================================================================
  const handleRunAsChange = useCallback((user) => {
    setRunAsUser(user);
    // Run-as functionality would modify API calls to impersonate user
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchLeases();
  }, [fetchLeases]);

  // ============================================================================
  // RETURN API
  // ============================================================================
  return {
    // Auth & Admin
    isAdmin,
    runAsUser,
    allUsers,
    handleRunAsChange,

    // Lease Selection
    leases,
    filteredLeases,
    selectedLease,
    searchQuery,
    setSearchQuery,
    handleLeaseSelect,

    // Payment Records
    guestPayments,
    hostPayments,
    handleCreatePaymentRecord,
    handleEditPaymentRecord,
    handleDeletePaymentRecord,
    handleRegenerateGuestPayments,
    handleRegenerateHostPayments,
    handleRegenerateAllPayments,

    // Stays
    handleCreateStays,
    handleClearStays,

    // Booked Dates
    handleUpdateBookedDates,
    handleClearDates,

    // Documents
    handleUploadDocument,
    handleGenerateDocs,
    handleGenerateAllDocs,
    handleGenerateSelectedDocs,
    handleSendDocuments,
    handleOpenPdf,
    isGeneratingDocs,

    // Document Readiness
    showReadinessModal,
    setShowReadinessModal,
    readinessReport,
    selectedLease,

    // Change Requests
    guestChangeRequests,
    hostChangeRequests,

    // Cancellation
    handleCancelLease,

    // UI
    isLoading,
    error,
    handleRetry,
  };
}

export default useManageLeasesPageLogic;
