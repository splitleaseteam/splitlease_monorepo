/**
 * Host Proposals Page Logic Hook
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
import { supabase } from '../../../lib/supabase.js';
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';
import { getAllHouseRules } from '../../shared/EditListingDetails/services/houseRulesService.js';
import { getVMStateInfo, VM_STATES } from '../../../logic/rules/proposals/virtualMeetingRules.js';
import { DAYS_OF_WEEK, nightNamesToIndices } from '../../shared/HostEditingProposal/types.js';
import { showToast } from '../../shared/Toast.jsx';
import { findThreadByProposal } from '../../../lib/messagingUtils.js';
import { hostAcceptProposalWorkflow } from '../../../logic/workflows/proposals/hostAcceptProposalWorkflow.js';

// ============================================================================
// DATA NORMALIZERS
// ============================================================================
// These functions transform Bubble-format field names to camelCase for V7 components

/**
 * Normalize listing data from Bubble format to V7 component format
 * @param {Object} listing - Raw listing from database
 * @returns {Object} Normalized listing
 */
function normalizeListing(listing) {
  if (!listing) return null;
  return {
    ...listing,
    // Keep original fields for backwards compatibility
    // Add normalized aliases for V7 components
    title: listing.listing_title || listing.title || listing.listing_title || 'Unnamed Listing',
    name: listing.listing_title || listing.title || listing.listing_title || 'Unnamed Listing',
    thumbnail: listing['Cover Photo'] || listing.thumbnail || listing.cover_photo || null,
    neighborhood: listing.Neighborhood || listing.neighborhood || null,
    address: listing['Full Address'] || listing.address || listing.full_address || null,
    bedrooms: listing['Bedrooms (number)'] || listing.bedrooms || 0,
    bathrooms: listing['Bathrooms (number)'] || listing.bathrooms || 0,
    monthly_rate: listing['Monthly Rate'] || listing.monthly_rate || 0
  };
}

/**
 * Normalize guest data from Bubble format to V7 component format
 * @param {Object} guest - Raw guest from database
 * @returns {Object} Normalized guest
 */
function normalizeGuest(guest) {
  if (!guest) return null;

  // Determine verification status from database fields
  // is_user_verified is the main verification flag
  // "Selfie with ID" indicates ID verification was completed
  // "Verify - Linked In ID" indicates work/LinkedIn verification
  const isUserVerified = guest.is_user_verified || guest.id_verified || false;
  const hasIdVerification = !!(guest['Selfie with ID'] || guest.id_verified);
  const hasWorkVerification = !!(guest['Verify - Linked In ID'] || guest.work_verified);

  return {
    ...guest,
    // Add normalized aliases for V7 components
    name: (guest.first_name && guest.last_name ? `${guest.first_name} ${guest.last_name}` : null) || guest.name || guest.full_name || 'Guest',
    full_name: (guest.first_name && guest.last_name ? `${guest.first_name} ${guest.last_name}` : null) || guest.full_name || guest.name || 'Guest',
    first_name: guest.first_name || guest.firstName || 'Guest',
    profilePhoto: guest.profile_photo_url || guest.profilePhoto || guest.profile_photo || null,
    avatar: guest.profile_photo_url || guest.profilePhoto || guest.avatar || null,
    bio: guest.bio_text || guest.Bio || guest.bio || guest.about || null,
    id_verified: hasIdVerification || isUserVerified,
    work_verified: hasWorkVerification,
    is_verified: isUserVerified,
    review_count: guest.review_count || 0,
    created_at: guest.original_created_at || guest.created_at || null
  };
}

/**
 * Normalize proposal data from Bubble format to V7 component format
 * @param {Object} proposal - Raw proposal from database
 * @param {Object} normalizedGuest - Already normalized guest data
 * @returns {Object} Normalized proposal
 */
function normalizeProposal(proposal, normalizedGuest = null) {
  if (!proposal) return null;

  // Status - preserve original Bubble format (DO NOT normalize to snake_case)
  // ActionButtonsRow expects exact Bubble status strings for matching
  const rawStatus = proposal.proposal_workflow_status || proposal.status || '';
  const status = typeof rawStatus === 'string' ? rawStatus : rawStatus;

  return {
    ...proposal,
    // Add normalized aliases for V7 components
    status: status,

    // Guest info (use normalized guest if provided, otherwise normalize inline)
    guest: normalizedGuest || normalizeGuest(proposal.guest),

    // Dates
    start_date: proposal.move_in_range_start_date || proposal.start_date || null,
    end_date: proposal.planned_move_out_date || proposal.end_date || null,
    move_in_range_start: proposal.move_in_range_start_date || proposal.move_in_range_start || null,
    move_in_range_end: proposal.move_in_range_end_date || proposal.move_in_range_end || null,
    created_at: proposal.original_created_at || proposal.created_at || null,

    // Days/Schedule
    days_selected: proposal.guest_selected_days_numbers_json || proposal.days_selected || [],
    days_per_week: proposal.guest_selected_days_numbers_json || proposal.days_per_week || [],
    nights_selected: proposal.guest_selected_nights_numbers_json || proposal.nights_selected || [],
    nights_per_week: proposal.nights_per_week_count || proposal.nights_per_week || 0,
    check_in_day: proposal.checkin_day_of_week_number || proposal.check_in_day || null,
    check_out_day: proposal.checkout_day_of_week_number || proposal.check_out_day || null,

    // Duration
    duration_weeks: proposal.reservation_span_in_weeks || proposal.duration_weeks || proposal.total_weeks || 0,
    duration_months: proposal.reservation_span_text || proposal.duration_months || 0,

    // Pricing - prioritize host compensation fields
    nightly_rate: proposal.calculated_nightly_price || proposal.nightly_rate || 0,
    total_price: proposal.total_compensation_for_host || proposal.host_compensation_per_period || proposal.total_price || 0,
    host_compensation: proposal.host_compensation_per_period || proposal.total_compensation_for_host || proposal.host_compensation || 0,
    four_week_rent: proposal.four_week_rent_amount || proposal.four_week_rent || 0,
    four_week_compensation: proposal.four_week_host_compensation || proposal.four_week_compensation || 0,
    cleaning_fee_amount: proposal.cleaning_fee_amount || proposal.cleaning_fee || 0,
    damage_deposit_amount: proposal.damage_deposit_amount || proposal.damage_deposit || 0,

    // Guest info/message
    comment: proposal.guest_introduction_message || proposal.comment || null,
    need_for_space: proposal.guest_stated_need_for_space || proposal.need_for_space || null,
    about_yourself: proposal.guest_about_yourself_text || null,

    // Guest counteroffer detection
    last_modified_by: proposal['last_modified_by'] || proposal.last_modified_by || null,
    has_guest_counteroffer: proposal.has_guest_counteroffer || false,

    // Rental type (Monthly, Weekly, Nightly)
    rental_type: proposal.rental_type || 'nightly'
  };
}

/**
 * Hook for Host Proposals Page business logic
 * @param {Object} options - Hook options
 * @param {boolean} options.skipAuth - Skip authentication check (for demo mode)
 */
export function useHostProposalsPageLogic({ skipAuth = false } = {}) {
  // ============================================================================
  // AUTH - consolidated hook handles authentication, role check, and redirect
  // ============================================================================
  const { user: authUser, userId: authUserId, loading: authLoading, isAuthenticated } = useAuthenticatedUser(
    skipAuth ? {} : { requireHost: true, redirectOnFail: '/' }
  );

  // Derived authState for backward-compatible component API
  const authState = skipAuth
    ? { isChecking: false, isAuthenticated: true, shouldRedirect: false, userType: 'host' }
    : {
        isChecking: authLoading,
        isAuthenticated,
        shouldRedirect: !authLoading && !isAuthenticated,
        userType: authUser?.userType || null
      };

  // ============================================================================
  // DATA STATE
  // ============================================================================
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [showRejectOnOpen, setShowRejectOnOpen] = useState(false);
  const [acceptMode, setAcceptMode] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // ============================================================================
  // VIRTUAL MEETING STATE
  // ============================================================================
  const [isVirtualMeetingModalOpen, setIsVirtualMeetingModalOpen] = useState(false);
  const [virtualMeetingView, setVirtualMeetingView] = useState('');
  const [virtualMeetingProposal, setVirtualMeetingProposal] = useState(null);

  // ============================================================================
  // UI STATE
  // ============================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // PROPOSAL COUNTS STATE (for pill selector badges)
  // ============================================================================
  const [proposalCountsByListing, setProposalCountsByListing] = useState({});

  // ============================================================================
  // REFERENCE DATA STATE
  // ============================================================================
  const [allHouseRules, setAllHouseRules] = useState([]);

  // ============================================================================
  // AUTH -> USER STATE + DATA LOADING
  // ============================================================================
  useEffect(() => {
    // Skip auth check in demo mode
    if (skipAuth) {
      setIsLoading(false);
      return;
    }

    if (authLoading) return;
    if (!isAuthenticated || !authUser) return;

    // Map authUser to local user state shape that rest of file expects
    const localUser = {
      userId: authUser.id,
      id: authUser.id,
      firstName: authUser.firstName || 'Host',
      email: authUser.email || '',
      userType: authUser.userType || ''
    };
    setUser(localUser);

    // Load host data
    loadHostData(authUser.id);
  }, [authLoading, isAuthenticated, authUser, skipAuth]);

  // ============================================================================
  // LOAD REFERENCE DATA (House Rules)
  // ============================================================================
  useEffect(() => {
    async function loadReferenceData() {
      try {
        const rules = await getAllHouseRules();
        setAllHouseRules(rules);
      } catch (err) {
        console.error('[HostProposals] Failed to load house rules:', err);
      }
    }
    loadReferenceData();
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load host listings and proposals
   * Sorts listings by proposal count (most proposals first) and selects the one with most recent proposals
   */
  const loadHostData = async (userId) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch host's listings via Edge Function
      const listingsResult = await fetchHostListings(userId);

      if (listingsResult.length > 0) {
        // Fetch proposal counts for all listings to determine sort order
        const listingIds = listingsResult.map(l => l.id);

        // Get proposal counts and most recent proposal date for each listing
        const { data: proposalStats, error: statsError } = await supabase
          .from('booking_proposal')
          .select('listing_id, original_created_at')
          .in('listing_id', listingIds)
          .or('is_deleted.is.null,is_deleted.eq.false');

        if (statsError) {
          console.warn('[useHostProposalsPageLogic] Could not fetch proposal stats:', statsError);
        }

        // Calculate stats per listing
        const statsMap = {};
        const countsMap = {}; // Simple count map for UI
        (proposalStats || []).forEach(p => {
          const listingId = p.listing_id;
          if (!statsMap[listingId]) {
            statsMap[listingId] = { count: 0, mostRecent: null };
          }
          statsMap[listingId].count++;
          countsMap[listingId] = (countsMap[listingId] || 0) + 1;
          const createdDate = new Date(p.original_created_at);
          if (!statsMap[listingId].mostRecent || createdDate > statsMap[listingId].mostRecent) {
            statsMap[listingId].mostRecent = createdDate;
          }
        });

        // Store proposal counts for pill selector badges
        setProposalCountsByListing(countsMap);

        // Sort listings: most recent proposal first, then by proposal count
        const sortedListings = [...listingsResult].sort((a, b) => {
          const aId = a.id;
          const bId = b.id;
          const aStats = statsMap[aId] || { count: 0, mostRecent: null };
          const bStats = statsMap[bId] || { count: 0, mostRecent: null };

          // First, prioritize listings with proposals
          if (aStats.count > 0 && bStats.count === 0) return -1;
          if (bStats.count > 0 && aStats.count === 0) return 1;

          // Then sort by most recent proposal date
          if (aStats.mostRecent && bStats.mostRecent) {
            return bStats.mostRecent - aStats.mostRecent;
          }
          if (aStats.mostRecent) return -1;
          if (bStats.mostRecent) return 1;

          // Finally, sort by proposal count
          return bStats.count - aStats.count;
        });


        // Normalize listings for V7 components
        const normalizedListings = sortedListings.map(normalizeListing);
        setListings(normalizedListings);

        // Check for listingId URL parameter to pre-select a specific listing
        const urlParams = new URLSearchParams(window.location.search);
        const preselectedListingId = urlParams.get('listingId');

        let listingToSelect = normalizedListings[0];
        if (preselectedListingId) {
          const matchedListing = normalizedListings.find(l =>
            l.id === preselectedListingId
          );
          if (matchedListing) {
            listingToSelect = matchedListing;
          }
        }

        setSelectedListing(listingToSelect);

        // Fetch proposals for the selected listing
        // Pass userId explicitly since user state may not be set yet (async state update)
        const proposalsResult = await fetchProposalsForListing(listingToSelect.id, userId);
        setProposals(proposalsResult);
      } else {
        setListings([]);
        setProposals([]);
      }

    } catch (err) {
      console.error('Failed to load host data:', err);
      setError('Failed to load your listings and proposals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch host's listings using RPC function
   *
   * Uses get_host_listings RPC to handle host listing lookups
   * (matches on host_user_id and created_by_user_id).
   *
   * Pattern: RPC handles finding listings where:
   * - host_user_id = user.id, OR
   * - created_by_user_id = user.id
   */
  const fetchHostListings = async (userId) => {
    try {

      // Use RPC function to fetch listings (handles special characters in column names)
      const { data: listings, error } = await supabase
        .rpc('get_host_listings', { host_user_id: userId });

      if (error) {
        console.error('[useHostProposalsPageLogic] Error fetching listings:', error);
        throw error;
      }

      return listings || [];
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      return [];
    }
  };

  /**
   * Fetch proposals for a specific listing directly from Supabase
   * Includes guest information for display
   * @param {string} listingId - The listing ID to fetch proposals for
   * @param {string} [hostUserIdOverride] - Optional host user ID (used when user state isn't set yet)
   */
  const fetchProposalsForListing = async (listingId, hostUserIdOverride = null) => {
    try {

      const { data: proposals, error } = await supabase
        .from('booking_proposal')
        .select(`
          id,
          proposal_workflow_status,
          guest_user_id,
          host_user_id,
          listing_id,
          move_in_range_start_date,
          move_in_range_end_date,
          planned_move_out_date,
          reservation_span_text,
          reservation_span_in_weeks,
          nights_per_week_count,
          guest_selected_nights_numbers_json,
          guest_selected_days_numbers_json,
          checkin_day_of_week_number,
          checkout_day_of_week_number,
          host_proposed_selected_nights_json,
          host_proposed_selected_days_json,
          calculated_nightly_price,
          four_week_rent_amount,
          total_reservation_price_for_guest,
          total_compensation_for_host,
          host_compensation_per_period,
          four_week_host_compensation,
          cleaning_fee_amount,
          damage_deposit_amount,
          guest_email_address,
          guest_stated_need_for_space,
          guest_about_yourself_text,
          guest_introduction_message,
          original_created_at,
          original_updated_at,
          virtual_meeting_record_id,
          has_host_counter_offer,
          host_proposed_reservation_span_weeks,
          host_proposed_nightly_price,
          host_proposed_total_guest_price,
          host_proposed_move_in_date,
          host_proposed_checkin_day,
          host_proposed_checkout_day,
          host_proposed_nights_per_week,
          host_proposed_house_rules_json,
          rental_type
        `)
        .eq('listing_id', listingId)
        .neq('is_deleted', true)
        .order('original_created_at', { ascending: false });

      if (error) {
        console.error('[useHostProposalsPageLogic] Error fetching proposals:', error);
        throw error;
      }


      // Enrich proposals with guest data
      if (proposals && proposals.length > 0) {
        const guestIds = [...new Set(proposals.map(p => p.guest_user_id).filter(Boolean))];

        if (guestIds.length > 0) {

          const { data: guests, error: guestError } = await supabase
            .from('user')
            .select('id, first_name, last_name, email, profile_photo_url, bio_text, is_user_verified, "Verify - Linked In ID", "Verify - Phone", "Selfie with ID", review_count, original_created_at')
            .in('id', guestIds);

          if (guestError) {
            console.error('[useHostProposalsPageLogic] Error fetching guests:', guestError);
          }


          const guestMap = {};
          guests?.forEach(g => { guestMap[g.id] = g; });

          // Attach normalized guest data to each proposal
          proposals.forEach(p => {
            if (p.guest_user_id && guestMap[p.guest_user_id]) {
              const normalized = normalizeGuest(guestMap[p.guest_user_id]);
              p.guest = normalized;
            }
          });
        }

        // Enrich proposals with virtual meeting data
        const vmIds = [...new Set(proposals.map(p => p.virtual_meeting_record_id).filter(Boolean))];

        if (vmIds.length > 0) {
          const { data: virtualMeetings } = await supabase
            .from('virtualmeetingschedulesandlinks')
            .select(`
              _id,
              "requested by",
              "booked date",
              "meeting declined",
              "confirmedBySplitLease",
              "suggested dates and times",
              "meeting link"
            `)
            .in('_id', vmIds);

          const vmMap = {};
          virtualMeetings?.forEach(vm => { vmMap[vm._id] = vm; });

          // Attach virtual meeting data to each proposal (normalize field names)
          proposals.forEach(p => {
            if (p.virtual_meeting_record_id && vmMap[p.virtual_meeting_record_id]) {
              const rawVm = vmMap[p.virtual_meeting_record_id];
              // Normalize field names for consistency with virtualMeetingRules.js
              p.virtualMeeting = {
                _id: rawVm._id,
                requestedBy: rawVm['requested by'],
                bookedDate: rawVm['booked date'],
                meetingDeclined: rawVm['meeting declined'],
                confirmedBySplitlease: rawVm['confirmedBySplitLease'],
                suggestedTimes: rawVm['suggested dates and times'],
                meetingLink: rawVm['meeting link']
              };
            }
          });
        }

        // Enrich proposals with negotiation summaries (host-directed)
        const proposalIds = proposals.map(p => p.id);
        // Use override if provided (needed when called before user state is set), otherwise fall back to user state
        const hostUserId = hostUserIdOverride || user?.userId || user?.id;

        if (proposalIds.length > 0 && hostUserId) {
          const { data: summariesData, error: summariesError } = await supabase
            .from('negotiationsummary')
            .select('*')
            .in('"Proposal associated"', proposalIds)
            .eq('"To Account"', hostUserId)
            .order('original_created_at', { ascending: false });

          if (summariesError) {
            console.error('[useHostProposalsPageLogic] Error fetching negotiation summaries:', summariesError);
          } else {
            const summaryMap = {};
            summariesData?.forEach(summary => {
              const proposalId = summary['Proposal associated'];
              if (!summaryMap[proposalId]) {
                summaryMap[proposalId] = [];
              }
              summaryMap[proposalId].push(summary);
            });

            // Attach summaries to proposals
            proposals.forEach(p => {
              p.negotiationSummaries = summaryMap[p.id] || [];
            });

          }
        }
      }

      // Normalize all proposals for V7 components
      const normalizedProposals = (proposals || []).map(p => normalizeProposal(p, p.guest));
      return normalizedProposals;
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      return [];
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle listing selection change
   * Accepts either a listing object or a listing ID
   */
  const handleListingChange = useCallback(async (listingOrId) => {
    // Support both listing object and listing ID
    let listing = listingOrId;
    if (typeof listingOrId === 'string') {
      // Find the listing from the current listings array
      listing = listings.find(l => l.id === listingOrId);
      if (!listing) {
        console.warn('[useHostProposalsPageLogic] Listing not found:', listingOrId);
        return;
      }
    }

    setSelectedListing(listing);
    setIsLoading(true);

    try {
      const proposalsResult = await fetchProposalsForListing(listing.id);
      setProposals(proposalsResult);
    } catch (err) {
      console.error('Failed to load proposals for listing:', err);
      setError('Failed to load proposals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [listings]);

  /**
   * Handle proposal card click - open modal
   */
  const handleProposalClick = useCallback((proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);
  }, []);

  /**
   * Handle modal close
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProposal(null);
  }, []);

  /**
   * Handle proposal deletion (soft delete via status update)
   */
  const handleDeleteProposal = useCallback(async (proposal) => {
    if (!confirm('Are you sure you want to delete this proposal?')) {
      return;
    }

    try {
      // Use proposal Edge Function to update status
      const { data, error } = await supabase.functions.invoke('proposal', {
        body: {
          action: 'update',
          payload: {
            proposalId: proposal.id,
            status: 'Deleted'
          }
        }
      });

      if (error) throw error;

      // Remove from local state
      setProposals(prev => prev.filter(p => p.id !== proposal.id));

    } catch (err) {
      console.error('Failed to delete proposal:', err);
      showToast({ title: 'Error', content: 'Failed to delete proposal. Please try again.', type: 'error' });
    }
  }, []);

  /**
   * Handle accept proposal - opens HostEditingProposal in accept mode for confirmation
   */
  const handleAcceptProposal = useCallback((proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(false); // Close the details modal
    setShowRejectOnOpen(false);
    setAcceptMode(true); // Signal to open in accept mode
    setIsEditingProposal(true); // Open the editing view
  }, []);

  /**
   * Handle confirm acceptance - executes the full acceptance workflow
   * Creates lease, sends notifications, shows success
   */
  const handleConfirmAcceptance = useCallback(async (proposal) => {
    setIsAccepting(true);
    try {

      // Execute the acceptance workflow
      const result = await hostAcceptProposalWorkflow({
        proposalId: proposal.id,
        proposal
      });


      // Optimistically update the proposal status in local state immediately
      // This gives instant feedback while the server refresh catches up
      const acceptedStatus = 'Proposal or Counteroffer Accepted / Drafting Lease Documents';
      setProposals(prev => prev.map(p =>
        p.id === proposal.id
          ? { ...p, status: acceptedStatus, proposal_workflow_status: acceptedStatus }
          : p
      ));

      // Add a small delay to ensure the Supabase write has propagated
      // before refreshing from the server
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh proposals from server to get the authoritative state
      if (selectedListing) {
        const proposalsResult = await fetchProposalsForListing(selectedListing.id);
        setProposals(proposalsResult);
      }

      // Close editing view and reset state
      setIsEditingProposal(false);
      setAcceptMode(false);
      setSelectedProposal(null);

      // Show success toast with 48-hour message
      showToast({
        title: 'Proposal Accepted!',
        content: 'Lease documents will be ready within 48 hours. Both parties have been notified.',
        type: 'success'
      });

    } catch (err) {
      console.error('[useHostProposalsPageLogic] Failed to accept proposal:', err);
      showToast({
        title: 'Error',
        content: err.message || 'Failed to accept proposal. Please try again.',
        type: 'error'
      });
    } finally {
      setIsAccepting(false);
    }
  }, [selectedListing]);

  /**
   * Handle reject proposal - opens HostEditingProposal with reject section visible
   */
  const handleRejectProposal = useCallback((proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(false); // Close the details modal
    setShowRejectOnOpen(true); // Signal to open with reject section visible
    setIsEditingProposal(true); // Open the editing view
  }, []);

  /**
   * Handle modify proposal - open HostEditingProposal component
   */
  const handleModifyProposal = useCallback((proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(false); // Close the details modal
    setShowRejectOnOpen(false); // Don't show reject section
    setIsEditingProposal(true); // Open the editing view
  }, []);

  /**
   * Handle closing the editing view
   */
  const handleCloseEditing = useCallback(() => {
    setIsEditingProposal(false);
    setSelectedProposal(null);
    setShowRejectOnOpen(false); // Reset reject section state
    setAcceptMode(false); // Reset accept mode state
  }, []);

  /**
   * Handle accept proposal as-is from editing view
   */
  const handleAcceptAsIs = useCallback(async (proposal) => {
    await handleAcceptProposal(proposal);
    setIsEditingProposal(false);
  }, [handleAcceptProposal]);

  /**
   * Convert day name to 0-based day index
   * Handles string names ('Monday'), numeric indices (1), or undefined
   * @param {string|number|undefined} dayName - Day name or index
   * @returns {number|null} 0-based day index (0-6) or null if invalid
   */
  const dayNameToIndex = (dayName) => {
    if (typeof dayName === 'number') return dayName;
    if (typeof dayName !== 'string') return null;
    const day = DAYS_OF_WEEK.find(d =>
      d.name.toLowerCase() === dayName.toLowerCase()
    );
    return day?.dayIndex ?? null;
  };

  /**
   * Handle counteroffer submission from editing view
   *
   * Transforms frontend field names to Edge Function expected format:
   * - Frontend uses camelCase (numberOfWeeks, checkIn, etc.)
   * - Edge Function expects host_counter_offer_ prefix snake_case (host_counter_offer_reservation_span_weeks, host_counter_offer_check_in, etc.)
   * - Day/night values come as strings ('Monday', 'Monday Night') and must be converted to indices
   *
   * IMPORTANT: ALL host_counter_offer_ fields must be populated (with either new or original values)
   * to enable strikethrough comparison in the UI. If a field wasn't changed,
   * we copy the original value to the hc_ field.
   */
  const handleCounteroffer = useCallback(async (counterofferData) => {
    try {
      // Transform frontend field names to Edge Function expected format
      // The Edge Function expects hc_ prefixed snake_case fields
      const {
        proposal,
        numberOfWeeks,
        checkIn,
        checkOut,
        nightsSelected,
        daysSelected,
        newHouseRules,
        moveInDate
      } = counterofferData;

      // Use the proposal from counterofferData or fall back to selectedProposal
      const originalProposal = proposal || selectedProposal;


      // Get original values from proposal for fields not being changed
      const originalWeeks = originalProposal.reservation_span_in_weeks || originalProposal.duration_weeks || 0;
      const originalCheckIn = originalProposal.checkin_day_of_week_number ?? originalProposal.check_in_day;
      const originalCheckOut = originalProposal.checkout_day_of_week_number ?? originalProposal.check_out_day;
      const originalNights = originalProposal.guest_selected_nights_numbers_json || originalProposal.nights_selected || [];
      const originalDays = originalProposal.guest_selected_days_numbers_json || originalProposal.days_selected || [];
      const originalMoveIn = originalProposal.move_in_range_start_date || originalProposal.move_in_range_start;
      const originalNightlyPrice = originalProposal.calculated_nightly_price || originalProposal.nightly_rate || 0;
      const originalCleaningFee = originalProposal.cleaning_fee_amount || originalProposal.cleaning_fee || 0;
      const originalDamageDeposit = originalProposal.damage_deposit_amount || originalProposal.damage_deposit || 0;
      const originalTotalPrice = originalProposal.total_reservation_price_for_guest || originalProposal.total_price || 0;
      const originalFourWeekRent = originalProposal.four_week_rent_amount || originalProposal.four_week_rent || 0;

      // Convert day/night values to indices
      const convertedCheckIn = checkIn !== undefined ? dayNameToIndex(checkIn) : null;
      const convertedCheckOut = checkOut !== undefined ? dayNameToIndex(checkOut) : null;
      const convertedNights = nightsSelected !== undefined && Array.isArray(nightsSelected)
        ? nightNamesToIndices(nightsSelected)
        : null;
      const convertedDays = daysSelected !== undefined && Array.isArray(daysSelected)
        ? daysSelected.map(dayNameToIndex).filter(idx => idx !== null)
        : null;
      const convertedMoveIn = moveInDate !== undefined
        ? (moveInDate instanceof Date ? moveInDate.toISOString().split('T')[0] : moveInDate)
        : null;

      // Build the payload with ALL hc_ fields (new value or original)
      // This enables UI strikethrough comparison
      const hcReservationSpanWeeks = numberOfWeeks ?? originalWeeks;
      const hcNightsSelected = convertedNights ?? originalNights;
      const hcNightsPerWeek = Array.isArray(hcNightsSelected) ? hcNightsSelected.length : (originalNights?.length || 0);
      const hcNightlyPrice = parseFloat(originalNightlyPrice) || 0;

      // Calculate derived financial fields based on counteroffer terms
      // Total price = nightly rate Ã— nights per week Ã— total weeks
      const hcTotalPrice = hcNightlyPrice * hcNightsPerWeek * hcReservationSpanWeeks;
      // Four week rent = nightly rate Ã— nights per week Ã— 4
      const hcFourWeekRent = hcNightlyPrice * hcNightsPerWeek * 4;

      const payload = {
        proposal_id: originalProposal.id,
        status: 'Host Counteroffer Submitted / Awaiting Guest Review',

        // Schedule fields - use new value if provided, otherwise copy original
        host_counter_offer_reservation_span_weeks: hcReservationSpanWeeks,
        host_counter_offer_check_in: convertedCheckIn ?? (typeof originalCheckIn === 'number' ? originalCheckIn : parseInt(originalCheckIn, 10) || 0),
        host_counter_offer_check_out: convertedCheckOut ?? (typeof originalCheckOut === 'number' ? originalCheckOut : parseInt(originalCheckOut, 10) || 0),
        host_counter_offer_nights_selected: hcNightsSelected,
        host_counter_offer_days_selected: convertedDays ?? originalDays,
        host_counter_offer_move_in_date: convertedMoveIn ?? originalMoveIn,
        host_counter_offer_nights_per_week: hcNightsPerWeek,

        // Financial fields - recalculate based on counteroffer terms
        host_counter_offer_nightly_price: hcNightlyPrice,
        host_counter_offer_cleaning_fee: parseFloat(originalCleaningFee) || 0,
        host_counter_offer_damage_deposit: parseFloat(originalDamageDeposit) || 0,
        host_counter_offer_total_price: hcTotalPrice,
        host_counter_offer_four_week_rent: hcFourWeekRent,

        // House rules - convert to array of IDs
        host_counter_offer_house_rules: Array.isArray(newHouseRules)
          ? newHouseRules.map(rule => rule.id || rule).filter(Boolean)
          : []
      };


      // Validate session exists before Edge Function call
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[useHostProposalsPageLogic] Session error:', sessionError);
      }

      if (!session?.access_token) {
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshedSession) {
          throw new Error('Session expired. Please refresh the page and try again.');
        }
      }

      // Get the latest session (might have been refreshed above)
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const authToken = currentSession?.access_token;


      const { data, error } = await supabase.functions.invoke('proposal', {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: {
          action: 'update',
          payload
        }
      });

      if (error) throw error;

      // Refresh proposals
      if (selectedListing) {
        const proposalsResult = await fetchProposalsForListing(selectedListing.id);
        setProposals(proposalsResult);
      }

      setIsEditingProposal(false);
      setSelectedProposal(null);
      showToast({ title: 'Counteroffer Sent!', content: 'Your counteroffer has been submitted for guest review.', type: 'success' });

    } catch (err) {
      console.error('Failed to send counteroffer:', err);
      // Extract proper error message
      const errorMessage = err?.message || err?.error?.message || err?.error ||
        (typeof err === 'string' ? err : 'Failed to send counteroffer. Please try again.');
      const displayMessage = typeof errorMessage === 'string' ? errorMessage : 'Failed to send counteroffer. Please try again.';
      showToast({ title: 'Error', content: displayMessage, type: 'error' });
    }
  }, [selectedProposal, selectedListing]);

  /**
   * Handle reject from editing view
   */
  const handleRejectFromEditing = useCallback(async (proposal, reason) => {
    try {
      // Status must use full Bubble display format for status transition validation
      const { data, error } = await supabase.functions.invoke('proposal', {
        body: {
          action: 'update',
          payload: {
            proposal_id: proposal.id,
            status: 'Proposal Rejected by Host',
            reason_for_cancellation: reason
          }
        }
      });

      if (error) throw error;

      // Refresh proposals
      if (selectedListing) {
        const proposalsResult = await fetchProposalsForListing(selectedListing.id);
        setProposals(proposalsResult);
      }

      setIsEditingProposal(false);
      setSelectedProposal(null);
      showToast({ title: 'Proposal Rejected', content: 'The proposal has been rejected.', type: 'info' });

    } catch (err) {
      console.error('Failed to reject proposal:', err);
      showToast({ title: 'Error', content: 'Failed to reject proposal. Please try again.', type: 'error' });
    }
  }, [selectedListing]);

  /**
   * Handle alert notifications from editing component
   * Supports object format { type, title, content } from HostEditingProposal
   */
  const handleEditingAlert = useCallback((alertData) => {
    // HostEditingProposal calls with object: { type, title, content }
    if (alertData && typeof alertData === 'object') {
      const toastType = alertData.type === 'information' ? 'info' : (alertData.type || 'info');
      showToast({
        title: alertData.title || 'Notification',
        content: alertData.content || '',
        type: toastType
      });
    } else if (typeof alertData === 'string') {
      // Fallback for string messages
      showToast({ title: alertData, type: 'info' });
    }
  }, []);

  /**
   * Handle send message
   */
  const handleSendMessage = useCallback(async (proposal) => {
    const guest = proposal.guest || {};
    const guestName = guest.firstName || guest.first_name || 'Guest';

    // Get proposal ID
    const proposalId = proposal.id;
    if (!proposalId) {
      showToast({ title: 'Error', content: 'Unable to find proposal ID', type: 'error' });
      return;
    }

    // Look up thread for this proposal
    const threadId = await findThreadByProposal(proposalId);

    if (threadId) {
      // Navigate to messages page with thread pre-selected
      window.location.href = `/messages?thread=${threadId}`;
    } else {
      // Thread not found - this is unusual, show error
      console.warn('[useHostProposalsPageLogic] No thread found for proposal:', proposalId);
      showToast({
        title: 'Thread Not Found',
        content: `Unable to find message thread for this proposal. Please try again.`,
        type: 'warning'
      });
    }
  }, []);

  /**
   * Handle remind Split Lease
   * TODO: Implement proper reminder system (email/notification)
   */
  const handleRemindSplitLease = useCallback(async (proposal) => {
    try {
      // For now, just show a confirmation - can be connected to a notification system later
      showToast({ title: 'Coming Soon', content: 'Reminder feature coming soon! For urgent matters, please contact support@splitlease.com', type: 'info' });
    } catch (err) {
      console.error('Failed to send reminder:', err);
      showToast({ title: 'Error', content: 'Failed to send reminder. Please try again.', type: 'error' });
    }
  }, []);

  /**
   * Handle virtual meeting button click - opens VirtualMeetingManager modal
   * Determines the appropriate view based on VM state (request, respond, details, etc.)
   */
  const handleChooseVirtualMeeting = useCallback((proposal) => {
    if (!proposal) return;

    const vm = proposal.virtualMeeting;
    const currentUserId = user?.userId || user?.id;

    let view = 'request'; // Default: no VM exists, show request view

    if (!vm) {
      // No VM exists - show request view
      view = 'request';
    } else if (vm.meetingDeclined) {
      // VM was declined - show request alternative view
      view = 'request';
    } else if (vm.confirmedBySplitlease) {
      // VM confirmed - show details view
      view = 'details';
    } else if (vm.bookedDate && !vm.meetingDeclined) {
      // VM is booked but not confirmed
      if (vm.requestedBy === currentUserId) {
        // Host requested - show details (awaiting guest response)
        view = 'details';
      } else {
        // Guest requested - host needs to respond
        view = 'respond';
      }
    } else if (vm.requestedBy && vm.requestedBy !== currentUserId) {
      // Pending request from guest - host needs to respond
      view = 'respond';
    } else if (vm.requestedBy === currentUserId) {
      // Host already requested - show details/status
      view = 'details';
    }

    setVirtualMeetingProposal(proposal);
    setVirtualMeetingView(view);
    setIsVirtualMeetingModalOpen(true);
    setIsModalOpen(false); // Close the details modal
  }, [user]);

  /**
   * Handle closing the virtual meeting modal
   */
  const handleCloseVirtualMeetingModal = useCallback(() => {
    setIsVirtualMeetingModalOpen(false);
    setVirtualMeetingView('');
    setVirtualMeetingProposal(null);
  }, []);

  /**
   * Handle successful virtual meeting operation - refresh proposals
   */
  const handleVirtualMeetingSuccess = useCallback(async () => {
    // Refresh proposals to get updated VM data
    if (selectedListing) {
      const proposalsResult = await fetchProposalsForListing(selectedListing.id);
      setProposals(proposalsResult);
    }
    handleCloseVirtualMeetingModal();
  }, [selectedListing, handleCloseVirtualMeetingModal]);

  /**
   * Handle request rental application
   * Sends a reminder to the guest to submit their rental application
   */
  const handleRequestRentalApp = useCallback((proposal) => {
    const guest = proposal.guest || {};
    const guestName = guest.firstName || guest.first_name || 'Guest';
    showToast({ title: 'Request Sent!', content: `Rental application request sent to ${guestName}! They will be notified to complete their application.`, type: 'success' });
    // TODO: Call API to send rental app request notification to guest
  }, []);

  /**
   * Handle edit listing
   */
  const handleEditListing = useCallback(() => {
    if (selectedListing) {
      window.location.href = `/listing-dashboard?id=${selectedListing.id}`;
    }
  }, [selectedListing]);

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    if (user) {
      loadHostData(user.userId);
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
    proposals,
    selectedProposal,
    isModalOpen,
    isEditingProposal,
    showRejectOnOpen,
    acceptMode,
    isAccepting,

    // Virtual meeting state
    isVirtualMeetingModalOpen,
    virtualMeetingView,
    virtualMeetingProposal,

    // Reference data
    allHouseRules,

    // UI state
    isLoading,
    error,

    // Proposal counts for pill selector
    proposalCountsByListing,

    // Handlers
    handleListingChange,
    handleProposalClick,
    handleCloseModal,
    handleDeleteProposal,
    handleAcceptProposal,
    handleRejectProposal,
    handleModifyProposal,
    handleSendMessage,
    handleRemindSplitLease,
    handleChooseVirtualMeeting,
    handleRequestRentalApp,
    handleEditListing,
    handleRetry,

    // Virtual meeting handlers
    handleCloseVirtualMeetingModal,
    handleVirtualMeetingSuccess,

    // Editing handlers
    handleCloseEditing,
    handleAcceptAsIs,
    handleCounteroffer,
    handleRejectFromEditing,
    handleEditingAlert,
    handleConfirmAcceptance
  };
}
