/**
 * Proposal Management Page Logic Hook
 *
 * Follows the Hollow Component Pattern:
 * - ALL business logic is contained in this hook
 * - Page component only handles rendering
 *
 * Features:
 * - Admin-only access (Gold Standard Auth Pattern)
 * - Advanced proposal filtering
 * - Status management
 * - Quick proposal creation
 *
 * Architecture:
 * - Uses Supabase for database queries
 * - Uses Edge Functions for proposal operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { checkAuthStatus, validateTokenAndFetchUser } from '../../../lib/auth.js';
import { supabase } from '../../../lib/supabase.js';

// ============================================================================
// SUPABASE CONFIGURATION (for Edge Function calls with soft headers pattern)
// ============================================================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qzsmhgyojmwvtjmnrdea.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c21oZ3lvam13dnRqbW5yZGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTE2NDksImV4cCI6MjA4MzUyNzY0OX0.cSPOwU1wyiBorIicEGoyDEmoh34G0Hf_39bRXkwvCDc';

// Create an anonymous Supabase client for admin queries
// This bypasses authenticated user's RLS policies and uses anon role policies
// which have unrestricted SELECT access to proposals for internal admin pages
const anonSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Call the proposal Edge Function with soft headers pattern.
 * Works for both authenticated and unauthenticated requests.
 *
 * @param {string} action - The action to perform
 * @param {Object} payload - The payload for the action
 * @returns {Promise<Object>} - The response data
 */
async function callProposalEdgeFunction(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  // Build headers with optional auth (soft headers pattern)
  // For unauthenticated requests, use anon key in Authorization header
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`
  };

  const response = await fetch(`${SUPABASE_URL}/functions/v1/proposal`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, payload }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Request failed');
  }

  return result.data;
}

/**
 * Fetch records in batches to avoid PostgREST URL length limits.
 * Large .in() filters with 30+ IDs can cause 400 errors.
 *
 * @param {string} table - The table name
 * @param {string} selectColumns - The columns to select
 * @param {string[]} ids - Array of IDs to fetch
 * @param {number} batchSize - Number of IDs per batch (default 10)
 * @returns {Promise<Object[]>} - Combined results from all batches
 */
async function fetchInBatches(table, selectColumns, ids, batchSize = 10) {
  if (!ids || ids.length === 0) return [];

  const results = [];
  const batches = [];

  // Split IDs into batches
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize));
  }

  // Fetch each batch in parallel using anonymous client to bypass RLS
  const batchPromises = batches.map(async (batchIds) => {
    const { data, error } = await anonSupabase
      .from(table)
      .select(selectColumns)
      .in('_id', batchIds);

    if (error) {
      console.warn(`[ProposalManage] Batch fetch error for ${table}:`, error);
      return [];
    }
    return data || [];
  });

  const batchResults = await Promise.all(batchPromises);
  return batchResults.flat();
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROPOSAL_STATUSES = [
  'Proposal Submitted for guest by Split Lease - Awaiting Rental Application',
  'Proposal Submitted by guest - Awaiting Rental Application',
  'Proposal Submitted for guest by Split Lease - Pending Confirmation',
  'Host Review',
  'Host Counteroffer Submitted / Awaiting Guest Review',
  'Proposal or Counteroffer Accepted / Drafting Lease Documents',
  'Lease Documents Sent for Review',
  'Lease Documents Sent for Signatures',
  'Lease Documents Signed / Awaiting Initial payment',
  'Initial Payment Submitted / Lease activated',
  'Proposal Cancelled by Guest',
  'Proposal Rejected by Host',
  'Proposal Cancelled by Split Lease',
  'Guest Ignored Suggestion'
];

// ============================================================================
// DATA NORMALIZERS
// ============================================================================

/**
 * Normalize guest data from database format
 * @param {Object} guest - Raw guest from database
 * @returns {Object} Normalized guest
 */
function normalizeGuest(guest) {
  if (!guest) return null;

  return {
    _id: guest._id,
    firstName: guest['Name - First'] || guest.firstName || '',
    lastName: guest['Name - Last'] || guest.lastName || '',
    fullName: guest['Name - Full'] || guest.fullName || '',
    email: guest.email || '',
    phoneNumber: guest['Phone Number (as text)'] || guest['Phone Number'] || guest.phoneNumber || '',
    profilePhoto: guest['Profile Photo'] || guest.profilePhoto || null,
    aboutMe: guest['About Me / Bio'] || guest.aboutMe || '',
    isUsabilityTester: guest['is usability tester'] || guest.isUsabilityTester || false,
    isVerified: guest['user verified?'] || false
  };
}

/**
 * Normalize host data from database format
 * @param {Object} host - Raw host from database
 * @returns {Object} Normalized host
 */
function normalizeHost(host) {
  if (!host) return null;

  return {
    _id: host._id,
    firstName: host['Name - First'] || host.firstName || '',
    lastName: host['Name - Last'] || host.lastName || '',
    fullName: host['Name - Full'] || host.fullName || '',
    email: host.email || '',
    phoneNumber: host['Phone Number (as text)'] || host['Phone Number'] || host.phoneNumber || '',
    profilePhoto: host['Profile Photo'] || host.profilePhoto || null,
    isUsabilityTester: host['is usability tester'] || host.isUsabilityTester || false
  };
}

/**
 * Extract address string from Location - Address field
 * The field can be a string or a JSONB object with an 'address' property
 * @param {string|Object} locationAddress - Location address field value
 * @returns {string} Address string or empty string
 */
function extractAddressString(locationAddress) {
  if (!locationAddress) return '';

  // If it's already a string, return it
  if (typeof locationAddress === 'string') return locationAddress;

  // If it's an object with an 'address' property, extract it
  if (typeof locationAddress === 'object' && locationAddress.address) {
    return locationAddress.address;
  }

  return '';
}

/**
 * Extract cover photo URL from Features - Photos array
 * @param {Array} photos - Array of photo objects from listing
 * @returns {string|null} Cover photo URL or null
 */
function extractCoverPhotoUrl(photos) {
  if (!photos || !Array.isArray(photos) || photos.length === 0) return null;

  // First try to find the main/cover photo (toggleMainPhoto: true)
  const mainPhoto = photos.find(p => p.toggleMainPhoto === true);
  if (mainPhoto) {
    return mainPhoto.url || mainPhoto.Photo || null;
  }

  // Otherwise return the first photo's URL
  const firstPhoto = photos[0];
  return firstPhoto?.url || firstPhoto?.Photo || null;
}

/**
 * Normalize listing data from database format
 * @param {Object} listing - Raw listing from database
 * @returns {Object} Normalized listing
 */
function normalizeListing(listing) {
  if (!listing) return null;

  return {
    _id: listing._id,
    name: listing.Name || listing.name || 'Unnamed Listing',
    address: extractAddressString(listing['Location - Address']) || listing['Full Address'] || listing.address || '',
    rentalType: listing['rental type'] || listing.rentalType || '',
    coverPhoto: extractCoverPhotoUrl(listing['Features - Photos']) || listing['Cover Photo'] || listing.coverPhoto || null,
    damageDeposit: listing['damage_deposit'] || listing['Damage Deposit'] || listing.damageDeposit || 0,
    cleaningCost: listing['cleaning_fee'] || listing['Cleaning Cost / Maintenance Fee'] || listing.cleaningCost || 0,
    houseRules: listing['House Rules'] || listing.houseRules || []
  };
}

/**
 * Normalize proposal data from database format
 * @param {Object} proposal - Raw proposal from database
 * @param {Object} guest - Normalized guest data
 * @param {Object} host - Normalized host data
 * @param {Object} listing - Normalized listing data
 * @returns {Object} Normalized proposal
 */
function normalizeProposal(proposal, guest, host, listing) {
  if (!proposal) return null;

  // Parse days selected - handle both array and JSON string formats
  let daysSelected = proposal['Days Selected'] || proposal.daysSelected || [];
  if (typeof daysSelected === 'string') {
    try {
      daysSelected = JSON.parse(daysSelected);
    } catch {
      daysSelected = [];
    }
  }

  // Create weekly schedule array (7 booleans for Sun-Sat)
  const weeklySchedule = [false, false, false, false, false, false, false];
  if (Array.isArray(daysSelected)) {
    daysSelected.forEach(day => {
      if (typeof day === 'number' && day >= 0 && day <= 6) {
        weeklySchedule[day] = true;
      }
    });
  }

  return {
    _id: proposal._id,
    status: proposal.Status || proposal.status || '',
    createdDate: proposal['Created Date'] || proposal.createdDate || null,
    modifiedDate: proposal['Modified Date'] || proposal.modifiedDate || null,

    guest,
    host,
    listing,

    // Pricing
    pricing: {
      nightlyPrice: proposal['proposal nightly price'] || proposal.nightlyPrice || 0,
      totalReservationPrice: proposal['Total Price for Reservation (guest)'] || proposal.totalReservationPrice || 0,
      hostCompensation: proposal['host compensation'] || proposal.hostCompensation || 0,
      totalCompensation: proposal['Total Compensation (proposal - host)'] || proposal.totalCompensation || 0,
      pricePerFourWeeks: proposal['4 week rent'] || proposal.pricePerFourWeeks || 0,
      fourWeekCompensation: proposal['4 week compensation'] || proposal.fourWeekCompensation || 0
    },

    // Reservation details
    reservation: {
      moveInDate: proposal['Move in range start'] || proposal.moveInDate || null,
      checkInDate: proposal['check in day'] || proposal.checkInDate || null,
      checkOutDate: proposal['check out day'] || proposal.checkOutDate || null,
      reservationSpanWeeks: proposal['Reservation Span (Weeks)'] || proposal.reservationSpanWeeks || 0,
      weeklySchedule,
      daysSelected
    },

    // Guest info
    guestAbout: proposal.about_yourself || '',
    guestNeedForSpace: proposal['need for space'] || '',
    comment: proposal.Comment || ''
  };
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for Proposal Management Page business logic
 */
export function useProposalManagePageLogic() {
  // ============================================================================
  // AUTH STATE
  // ============================================================================
  const [authState, setAuthState] = useState({
    isChecking: true,
    isAuthenticated: false,
    isAdmin: false,
    shouldRedirect: false
  });

  // ============================================================================
  // FILTER STATE
  // ============================================================================
  const [filters, setFilters] = useState({
    guestSearch: '',
    hostSearch: '',
    status: '',
    proposalId: '',
    listingSearch: '',
    startDate: null,
    endDate: null,
    sortDirection: 'desc'
  });

  // ============================================================================
  // DATA STATE
  // ============================================================================
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // ============================================================================
  // CREATION FORM STATE
  // ============================================================================
  const [isCreationFormOpen, setIsCreationFormOpen] = useState(false);

  // ============================================================================
  // AUTH CHECK (Optional - no redirect for internal pages)
  // ============================================================================
  useEffect(() => {
    // No redirect if not authenticated - this is an internal page accessible without login
    // Always set authorized for internal pages
    setAuthState({
      isChecking: false,
      isAuthenticated: true,
      isAdmin: true,
      shouldRedirect: false
    });
  }, []);

  // ============================================================================
  // LOAD PROPOSALS WHEN FILTERS CHANGE
  // ============================================================================
  useEffect(() => {
    if (authState.isAdmin && !authState.isChecking) {
      loadProposals();
    }
  }, [filters, authState.isAdmin, authState.isChecking]);

  // ============================================================================
  // CHECK URL FOR PROPOSAL ID
  // ============================================================================
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const proposalId = urlParams.get('proposal');
    if (proposalId && proposalId !== filters.proposalId) {
      setFilters(prev => ({ ...prev, proposalId }));
    }
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load proposals with current filters
   */
  const loadProposals = useCallback(async () => {
    console.log('[ProposalManage] loadProposals called - starting data fetch');
    setIsLoading(true);
    setError(null);

    try {
      // Build query using anonymous client to bypass authenticated user's RLS
      // The anon role has unrestricted SELECT access for internal admin pages
      console.log('[ProposalManage] Building Supabase query for proposals (using anon client)...');
      let query = anonSupabase
        .from('proposal')
        .select(`
          _id,
          "Status",
          "Guest",
          "Host User",
          "Listing",
          "Move in range start",
          "Move in range end",
          "Move-out",
          "Reservation Span",
          "Reservation Span (Weeks)",
          "nights per week (num)",
          "Nights Selected (Nights list)",
          "Days Selected",
          "check in day",
          "check out day",
          "proposal nightly price",
          "4 week rent",
          "Total Price for Reservation (guest)",
          "Total Compensation (proposal - host)",
          "host compensation",
          "4 week compensation",
          "cleaning fee",
          "damage deposit",
          "need for space",
          "about_yourself",
          "Comment",
          "Created Date",
          "Modified Date"
        `, { count: 'exact' })
        .or('Deleted.is.null,Deleted.eq.false');

      // Apply filters
      if (filters.proposalId) {
        query = query.ilike('_id', `%${filters.proposalId}%`);
      }

      if (filters.status) {
        query = query.eq('Status', filters.status);
      }

      if (filters.startDate) {
        const startDateStr = filters.startDate instanceof Date
          ? filters.startDate.toISOString()
          : filters.startDate;
        query = query.gte('"Modified Date"', startDateStr);
      }

      if (filters.endDate) {
        const endDateStr = filters.endDate instanceof Date
          ? filters.endDate.toISOString()
          : filters.endDate;
        query = query.lte('"Modified Date"', endDateStr);
      }

      // Sort
      query = query.order('Modified Date', { ascending: filters.sortDirection === 'asc' });

      // Limit results
      query = query.limit(100);

      console.log('[ProposalManage] Executing proposal query...');
      const { data: proposalsData, error: proposalsError, count } = await query;

      console.log('[ProposalManage] Query result:', {
        dataLength: proposalsData?.length || 0,
        count,
        error: proposalsError,
        firstProposal: proposalsData?.[0] ? { _id: proposalsData[0]._id, Status: proposalsData[0].Status } : null
      });

      if (proposalsError) {
        console.error('[ProposalManage] Error fetching proposals:', proposalsError);
        throw proposalsError;
      }

      // Fetch related data (guests, hosts, listings)
      // Use batched fetching to avoid PostgREST URL length limits with large .in() filters
      const guestIds = [...new Set(proposalsData?.map(p => p.Guest).filter(Boolean))];
      const hostIds = [...new Set(proposalsData?.map(p => p['Host User']).filter(Boolean))];
      const listingIds = [...new Set(proposalsData?.map(p => p.Listing).filter(Boolean))];

      console.log(`[ProposalManage] Fetching related data: ${guestIds.length} guests, ${hostIds.length} hosts, ${listingIds.length} listings`);

      // Fetch all related data in parallel using batched queries
      const [guests, hosts, listings] = await Promise.all([
        fetchInBatches(
          'user',
          '_id, "Name - Full", "Name - First", "Name - Last", email, "Phone Number (as text)", "Profile Photo", "About Me / Bio", "user verified?", "is usability tester"',
          guestIds
        ),
        fetchInBatches(
          'user',
          '_id, "Name - Full", "Name - First", "Name - Last", email, "Phone Number (as text)", "Profile Photo", "is usability tester"',
          hostIds
        ),
        fetchInBatches(
          'listing',
          '_id, Name, "Location - Address", "rental type", "Features - Photos", "damage_deposit", "cleaning_fee"',
          listingIds
        )
      ]);

      // Build lookup maps
      const guestMap = {};
      guests.forEach(g => { guestMap[g._id] = normalizeGuest(g); });

      const hostMap = {};
      hosts.forEach(h => { hostMap[h._id] = normalizeHost(h); });

      const listingMap = {};
      listings.forEach(l => { listingMap[l._id] = normalizeListing(l); });

      console.log(`[ProposalManage] Loaded: ${guests.length} guests, ${hosts.length} hosts, ${listings.length} listings`);

      // Normalize and combine data
      const normalizedProposals = proposalsData?.map(p => {
        const guest = guestMap[p.Guest] || null;
        const host = hostMap[p['Host User']] || null;
        const listing = listingMap[p.Listing] || null;
        return normalizeProposal(p, guest, host, listing);
      }) || [];

      // Apply text search filters (client-side since they require joins)
      let filteredProposals = normalizedProposals;

      if (filters.guestSearch) {
        const searchLower = filters.guestSearch.toLowerCase();
        filteredProposals = filteredProposals.filter(p =>
          p.guest?.fullName?.toLowerCase().includes(searchLower) ||
          p.guest?.firstName?.toLowerCase().includes(searchLower) ||
          p.guest?.lastName?.toLowerCase().includes(searchLower) ||
          p.guest?.email?.toLowerCase().includes(searchLower) ||
          p.guest?.phoneNumber?.includes(filters.guestSearch)
        );
      }

      if (filters.hostSearch) {
        const searchLower = filters.hostSearch.toLowerCase();
        filteredProposals = filteredProposals.filter(p =>
          p.host?.fullName?.toLowerCase().includes(searchLower) ||
          p.host?.firstName?.toLowerCase().includes(searchLower) ||
          p.host?.lastName?.toLowerCase().includes(searchLower) ||
          p.host?.email?.toLowerCase().includes(searchLower) ||
          p.host?.phoneNumber?.includes(filters.hostSearch)
        );
      }

      if (filters.listingSearch) {
        const searchLower = filters.listingSearch.toLowerCase();
        filteredProposals = filteredProposals.filter(p =>
          p.listing?.name?.toLowerCase().includes(searchLower) ||
          p.listing?._id?.toLowerCase().includes(searchLower) ||
          p.listing?.rentalType?.toLowerCase().includes(searchLower)
        );
      }

      setProposals(filteredProposals);

      // Use database count unless client-side text search reduced the results
      // Text search filters (guest/host/listing name) are applied client-side
      const hasTextSearch = filters.guestSearch || filters.hostSearch || filters.listingSearch;
      const displayCount = hasTextSearch ? filteredProposals.length : (count || filteredProposals.length);
      setTotalCount(displayCount);

    } catch (err) {
      console.error('[ProposalManage] Failed to load proposals:', err);
      setError('Failed to load proposals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);

  /**
   * Handle clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setFilters({
      guestSearch: '',
      hostSearch: '',
      status: '',
      proposalId: '',
      listingSearch: '',
      startDate: null,
      endDate: null,
      sortDirection: 'desc'
    });
  }, []);

  /**
   * Handle status change for a proposal
   */
  const handleStatusChange = useCallback(async (proposalId, newStatus) => {
    try {
      // Optimistic update
      setProposals(prev =>
        prev.map(p =>
          p._id === proposalId
            ? { ...p, status: newStatus, modifiedDate: new Date().toISOString() }
            : p
        )
      );

      // Call Edge Function to update status using soft headers pattern
      await callProposalEdgeFunction('update', {
        proposal_id: proposalId,
        status: newStatus
      });

      console.log('[ProposalManage] Status updated:', proposalId, newStatus);

    } catch (err) {
      console.error('[ProposalManage] Failed to update status:', err);
      alert('Failed to update status. Please try again.');
      // Revert optimistic update by reloading
      loadProposals();
    }
  }, [loadProposals]);

  /**
   * Handle various proposal actions
   */
  const handleAction = useCallback(async (action, proposal) => {
    switch (action) {
      case 'viewListing':
        window.open(`/view-split-lease?id=${proposal.listing?._id}`, '_blank');
        break;

      case 'viewLease':
        // Navigate to lease management page with proposal ID pre-filled in search
        window.open(`/_manage-leases-payment-records?search=${proposal._id}`, '_blank');
        break;

      case 'modifyAsHost':
        // TODO: Open host editing modal
        alert('Host modification feature coming soon');
        break;

      case 'modifyAsGuest':
        // TODO: Open guest editing modal
        alert('Guest modification feature coming soon');
        break;

      case 'sendReminderGuest':
        try {
          alert(`Reminder sent to ${proposal.guest?.firstName || 'Guest'}`);
          // TODO: Implement actual reminder via messaging Edge Function
        } catch (err) {
          alert('Failed to send reminder');
        }
        break;

      case 'sendReminderHost':
        try {
          alert(`Reminder sent to ${proposal.host?.firstName || 'Host'}`);
          // TODO: Implement actual reminder via messaging Edge Function
        } catch (err) {
          alert('Failed to send reminder');
        }
        break;

      case 'cancelProposal':
        if (window.confirm(`Are you sure you want to cancel proposal ${proposal._id}?`)) {
          try {
            await handleStatusChange(proposal._id, 'Proposal Cancelled by Split Lease');
          } catch (err) {
            alert('Failed to cancel proposal');
          }
        }
        break;

      default:
        console.log('[ProposalManage] Unknown action:', action);
    }
  }, [handleStatusChange]);

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    loadProposals();
  }, [loadProposals]);

  /**
   * Toggle creation form visibility
   */
  const handleToggleCreationForm = useCallback(() => {
    setIsCreationFormOpen(prev => !prev);
  }, []);

  /**
   * Handle proposal creation
   */
  const handleCreateProposal = useCallback(async (proposalData) => {
    try {
      // Call Edge Function to create proposal using soft headers pattern
      const result = await callProposalEdgeFunction('create_suggested', {
        guestId: proposalData.selectedGuest._id,
        listingId: proposalData.selectedListing._id,
        moveInStartRange: proposalData.moveInDate,
        daysSelected: proposalData.weeklySchedule
          .map((active, i) => active ? i : null)
          .filter(i => i !== null),
        reservationSpanWeeks: proposalData.reservationSpanWeeks,
        aboutMe: proposalData.guestAbout,
        needForSpace: proposalData.guestNeedForSpace,
        specialNeeds: proposalData.guestSpecialNeeds,
        status: proposalData.proposalStatus
      });

      // Reload proposals to show the new one
      await loadProposals();

      return {
        success: true,
        proposalId: result?.proposalId,
        threadId: result?.threadId
      };

    } catch (err) {
      console.error('[ProposalManage] Failed to create proposal:', err);
      return { success: false, error: err.message };
    }
  }, [loadProposals]);

  // ============================================================================
  // MEMOIZED VALUES
  // ============================================================================

  const statusOptions = useMemo(() =>
    PROPOSAL_STATUSES.map(status => ({
      value: status,
      label: status || '(empty)'
    })),
    []
  );

  // ============================================================================
  // RETURN HOOK API
  // ============================================================================
  return {
    // Auth state
    authState,

    // Data
    proposals,
    filters,
    totalCount,
    statusOptions,

    // UI state
    isLoading,
    error,
    isCreationFormOpen,

    // Handlers
    handleFilterChange,
    handleClearFilters,
    handleStatusChange,
    handleAction,
    handleRetry,

    // Quick creation
    handleToggleCreationForm,
    handleCreateProposal
  };
}
