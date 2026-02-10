/**
 * Host Overview Page Logic Hook
 *
 * Contains all business logic for the Host Overview page:
 * - Data fetching for listings, house manuals, virtual meetings
 * - CRUD operations for listings and house manuals
 * - Toast notifications
 * - Modal state management
 *
 * Database Tables Used:
 * - listing: Property listings owned by host
 * - House manual: Documentation for guests
 * - virtualmeetingschedulesandlinks: Scheduled virtual meetings
 * - user: Current user data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';
import { supabase } from '../../../lib/supabase.js';
import { initializeLookups, getBoroughName } from '../../../lib/dataLookups.js';

/**
 * Extract borough name from address string
 * Handles formats like "276 Belmont Ave, Brooklyn, NY 11207, USA"
 * @param {string|object} addressField - The Location - Address field (JSONB or string)
 * @returns {string} The borough name or empty string
 */
function extractBoroughFromAddress(addressField) {
  if (!addressField) return '';

  // If it's a JSONB object, get the address string
  const addressStr = typeof addressField === 'object' ? addressField.address : addressField;
  if (!addressStr || typeof addressStr !== 'string') return '';

  // NYC boroughs to look for in the address
  const boroughPatterns = [
    { pattern: /,\s*Brooklyn\s*,/i, name: 'Brooklyn' },
    { pattern: /,\s*Manhattan\s*,/i, name: 'Manhattan' },
    { pattern: /,\s*Queens\s*,/i, name: 'Queens' },
    { pattern: /,\s*Bronx\s*,/i, name: 'Bronx' },
    { pattern: /,\s*Staten Island\s*,/i, name: 'Staten Island' },
    // "New York, NY" typically means Manhattan
    { pattern: /,\s*New York\s*,\s*NY/i, name: 'Manhattan' },
  ];

  for (const { pattern, name } of boroughPatterns) {
    if (pattern.test(addressStr)) {
      return name;
    }
  }

  return '';
}

export function useHostOverviewPageLogic() {
  // ============================================================================
  // AUTH (consolidated hook)
  // ============================================================================
  const { user: authUser, userId: authUserId, loading: authLoading, isAuthenticated } = useAuthenticatedUser({
    requireHost: true,
    redirectOnFail: '/'
  });

  // Derive authState shape for consumers
  const authState = {
    isChecking: authLoading,
    shouldRedirect: !authLoading && !isAuthenticated
  };

  // ============================================================================
  // STATE
  // ============================================================================

  // User data
  const [user, setUser] = useState(null);
  const userRef = useRef(null);

  // Data lists
  const [listingsToClaim, setListingsToClaim] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [houseManuals, setHouseManuals] = useState([]);
  const [virtualMeetings, setVirtualMeetings] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [showHelpBanner, setShowHelpBanner] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  // Create listing modal state
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);

  // Import listing modal state
  const [showImportListingModal, setShowImportListingModal] = useState(false);
  const [importListingLoading, setImportListingLoading] = useState(false);

  // Schedule cohost modal state
  const [showScheduleCohost, setShowScheduleCohost] = useState(false);

  // ============================================================================
  // TOAST NOTIFICATIONS
  // ============================================================================

  const showToast = useCallback((title, message, type = 'information', duration = 3000) => {
    const id = Date.now();
    const newToast = { id, title, message, type, duration };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchHostListings = useCallback(async (hostAccountId, userId) => {
    if (!hostAccountId && !userId) return [];

    try {
      // Initialize lookups cache (boroughs, neighborhoods, etc.)
      await initializeLookups();

      // Fetch listings from multiple sources in parallel:
      // 1. Bubble API (existing synced listings)
      // 2. listing table via RPC (self-listing submissions)
      // 3. user.Listings array (linked listings)

      const fetchPromises = [];

      // 1. Try Bubble API (only if hostAccountId is available)
      if (hostAccountId) {
        fetchPromises.push(
          supabase.functions.invoke('bubble-proxy', {
            body: {
              endpoint: 'listing',
              method: 'GET',
              params: {
                constraints: JSON.stringify([
                  { key: 'Creator', constraint_type: 'equals', value: hostAccountId },
                  { key: 'Complete', constraint_type: 'equals', value: true }
                ])
              }
            }
          }).then(result => {
            if (result.error) {
              console.warn('Bubble listings fetch failed:', result.error);
              return { type: 'bubble', data: { response: { results: [] } } };
            }
            return { type: 'bubble', ...result };
          }).catch(err => {
            console.warn('Bubble listings fetch failed:', err);
            return { type: 'bubble', data: { response: { results: [] } } };
          })
        );
      }

      // 2. Fetch from listing table where Host User = hostAccountId or Created By = hostAccountId
      // Using RPC function to handle column names with special characters
      // IMPORTANT: hostAccountId is the user.id, which is what listings use for host_user_id
      if (hostAccountId) {
        fetchPromises.push(
          supabase
            .rpc('get_host_listings', { host_user_id: hostAccountId })
            .then(result => {
              console.log('[HostOverview] listing query result:', result);
              return { type: 'listing_rpc', ...result };
            })
            .catch(err => {
              console.warn('listing fetch failed:', err);
              return { type: 'listing_rpc', data: [], error: err };
            })
        );
      }

      // 3. Fetch listing IDs from user.listings_json array (with Listings fallback for legacy data)
      if (hostAccountId) {
        fetchPromises.push(
          supabase
            .from('user')
            .select('listings_json')
            .eq('id', hostAccountId)
            .maybeSingle()
            .then(result => ({ type: 'user_listings', ...result }))
            .catch(err => {
              console.warn('user Listings fetch failed:', err);
              return { type: 'user_listings', data: null, error: err };
            })
        );
      }

      const results = await Promise.all(fetchPromises);

      // Process Bubble listings
      const bubbleResult = results.find(r => r?.type === 'bubble');
      const bubbleListings = bubbleResult?.data?.response?.results || [];
      const mappedBubbleListings = bubbleListings.map(listing => ({
        id: listing._id || listing.id,
        name: listing.listing_title || listing.name || 'Unnamed Listing',
        listing_title: listing.listing_title,
        complete: listing.is_listing_profile_complete || listing.complete,
        source: 'bubble',
        location: {
          borough: listing.borough?.Display || listing.borough || ''
        },
        leasesCount: listing['Leases Count'] || 0,
        proposalsCount: listing['Proposals Count'] || 0,
        photos: listing.photos_with_urls_captions_and_sort_order_json || [],
        // Pricing fields
        rental_type: listing.rental_type || 'Nightly',
        monthly_rate: listing.monthly_rate_paid_to_host,
        weekly_rate: listing.weekly_rate_paid_to_host,
        // Nightly rates for each night count
        nightly_rate_2: listing.nightly_rate_for_2_night_stay,
        nightly_rate_3: listing.nightly_rate_for_3_night_stay,
        nightly_rate_4: listing.nightly_rate_for_4_night_stay,
        nightly_rate_5: listing.nightly_rate_for_5_night_stay,
        nightly_rate_7: listing.nightly_rate_for_7_night_stay,
        cleaning_fee_amount: listing.cleaning_fee_amount,
        damage_deposit_amount: listing.damage_deposit_amount
      }));

      // Process listings from RPC
      let rpcListings = [];
      const rpcResult = results.find(r => r?.type === 'listing_rpc');
      if (rpcResult?.data && !rpcResult.error) {
        rpcListings = rpcResult.data.map(listing => {
          // Try FK lookup first, fall back to extracting from address string
          const boroughFromFK = getBoroughName(listing.borough);
          const boroughFromAddress = extractBoroughFromAddress(listing.address_with_lat_lng_json);
          const borough = boroughFromFK || boroughFromAddress || '';

          return {
            id: listing.id,
            name: listing.listing_title || 'Unnamed Listing',
            listing_title: listing.listing_title,
            complete: listing.is_listing_profile_complete || false,
            source: listing.source || 'listing',
              location: {
              borough,
              city: listing.city || '',
              state: listing.state || ''
            },
            leasesCount: 0,
            proposalsCount: 0,
            photos: listing.photos_with_urls_captions_and_sort_order_json || [],
            // Pricing fields from RPC
            rental_type: listing.rental_type,
            monthly_rate: listing.monthly_rate,
            weekly_rate: listing.weekly_rate,
            // Individual nightly rates from RPC
            nightly_rate_2: listing.rate_2_nights,
            nightly_rate_3: listing.rate_3_nights,
            nightly_rate_4: listing.rate_4_nights,
            nightly_rate_5: listing.rate_5_nights,
            nightly_rate_7: listing.rate_7_nights,
            rate_5_nights: listing.rate_5_nights,
            cleaning_fee_amount: listing.cleaning_fee,
            damage_deposit_amount: listing.damage_deposit,
            pricing_list: listing.pricing_list
          };
        });
      }

      // Check if we need to fetch additional listings from user.listings_json
      const userListingsResult = results.find(r => r?.type === 'user_listings');
      const linkedListingIds = userListingsResult?.data?.listings_json || userListingsResult?.data?.Listings || [];

      // Fetch any linked listings that aren't already in our results
      const existingIds = new Set([
        ...mappedBubbleListings.map(l => l.id),
        ...rpcListings.map(l => l.id)
      ]);

      const missingIds = linkedListingIds.filter(id => !existingIds.has(id));

      if (missingIds.length > 0) {
        // Fetch missing listings from listing table
        const { data: missingListings } = await supabase
          .from('listing')
          .select('*')
          .in('id', missingIds)
          .eq('is_deleted', false);

        if (missingListings) {
          const mappedMissing = missingListings.map(listing => {
            // Try FK lookup first, fall back to extracting from address string
            const boroughFromFK = getBoroughName(listing.borough);
            const boroughFromAddress = extractBoroughFromAddress(listing.address_with_lat_lng_json);
            const borough = boroughFromFK || boroughFromAddress || '';

            return {
              id: listing.id,
              name: listing.listing_title || 'Unnamed Listing',
              complete: listing.is_listing_profile_complete || false,
              source: 'listing',
              location: {
                borough,
                city: listing.city || '',
                state: listing.state || ''
              },
              leasesCount: 0,
              proposalsCount: 0,
              photos: listing.photos_with_urls_captions_and_sort_order_json || [],
              // Pricing fields (using original column names from direct query)
              rental_type: listing.rental_type,
              monthly_rate: listing.monthly_rate_paid_to_host,
              weekly_rate: listing.weekly_rate_paid_to_host,
              // Individual nightly rates
              nightly_rate_2: listing.nightly_rate_for_2_night_stay,
              nightly_rate_3: listing.nightly_rate_for_3_night_stay,
              nightly_rate_4: listing.nightly_rate_for_4_night_stay,
              nightly_rate_5: listing.nightly_rate_for_5_night_stay,
              nightly_rate_7: listing.nightly_rate_for_7_night_stay,
              rate_5_nights: listing.nightly_rate_for_5_night_stay,
              cleaning_fee_amount: listing.cleaning_fee_amount,
              damage_deposit_amount: listing.damage_deposit_amount,
              pricing_list: listing.pricing_list
            };
          });
          rpcListings = [...rpcListings, ...mappedMissing];
        }
      }

      // Combine all listings, deduplicated by id
      const allListings = [...mappedBubbleListings, ...rpcListings];
      const uniqueListings = allListings.filter((listing, index, self) =>
        index === self.findIndex(l => l.id === listing.id)
      );

      console.log('[HostOverview] Fetched listings:', {
        bubble: mappedBubbleListings.length,
        rpc: rpcListings.length,
        total: uniqueListings.length
      });

      // Fetch proposal and lease counts for all listings
      if (uniqueListings.length > 0) {
        const listingIds = uniqueListings.map(l => l.id);

        // Fetch proposals grouped by listing
        const { data: proposalData } = await supabase
          .from('booking_proposal')
          .select('listing_id')
          .in('listing_id', listingIds);

        // Fetch leases grouped by listing
        const { data: leaseData } = await supabase
          .from('booking_lease')
          .select('listing_id')
          .in('listing_id', listingIds);

        // Count proposals per listing
        const proposalCounts = {};
        (proposalData || []).forEach(p => {
          if (p.listing_id) {
            proposalCounts[p.listing_id] = (proposalCounts[p.listing_id] || 0) + 1;
          }
        });

        // Count leases per listing
        const leaseCounts = {};
        (leaseData || []).forEach(l => {
          if (l.listing_id) {
            leaseCounts[l.listing_id] = (leaseCounts[l.listing_id] || 0) + 1;
          }
        });

        // Merge counts into listings
        uniqueListings.forEach(listing => {
          listing.proposalsCount = proposalCounts[listing.id] || 0;
          listing.leasesCount = leaseCounts[listing.id] || 0;
        });

        console.log('[HostOverview] Proposal counts:', proposalCounts);
        console.log('[HostOverview] Lease counts:', leaseCounts);
      }

      return uniqueListings;
    } catch (err) {
      console.error('Error fetching host listings:', err);
      return [];
    }
  }, []);

  const fetchListingsToClaim = useCallback(async (hostAccountId) => {
    if (!hostAccountId) return [];

    try {
      // Fetch unclaimed listings assigned to this host
      const { data, error: fetchError } = await supabase.functions.invoke('bubble-proxy', {
        body: {
          endpoint: 'listing',
          method: 'GET',
          params: {
            constraints: JSON.stringify([
              { key: 'Complete', constraint_type: 'equals', value: true },
              { key: 'Claimable By', constraint_type: 'contains', value: hostAccountId }
            ])
          }
        }
      });

      if (fetchError) throw fetchError;

      const listings = data?.response?.results || [];
      return listings.map(listing => ({
        id: listing._id || listing.id,
        name: listing.listing_title || listing.name || 'Unnamed Listing',
        listing_title: listing.listing_title,
        complete: listing.is_listing_profile_complete || listing.complete,
        location: {
          borough: listing.borough?.Display || listing.borough || ''
        }
      }));
    } catch (err) {
      console.error('Error fetching listings to claim:', err);
      return [];
    }
  }, []);

  const fetchHouseManuals = useCallback(async (hostAccountId) => {
    if (!hostAccountId) return [];

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('bubble-proxy', {
        body: {
          endpoint: 'House manual',
          method: 'GET',
          params: {
            constraints: JSON.stringify([
              { key: 'Host', constraint_type: 'equals', value: hostAccountId }
            ])
          }
        }
      });

      if (fetchError) throw fetchError;

      const manuals = data?.response?.results || [];
      return manuals.map(manual => ({
        id: manual._id || manual.id,
        display: manual.Display || manual.display || 'House Manual',
        Display: manual.Display,
        audience: manual.Audience?.Display || manual.audience || 'Guests',
        createdOn: manual.original_created_at || manual.createdOn
      }));
    } catch (err) {
      console.error('Error fetching house manuals:', err);
      return [];
    }
  }, []);

  const fetchVirtualMeetings = useCallback(async (hostAccountId) => {
    if (!hostAccountId) return [];

    try {
      // Fetch virtual meetings where host is involved
      // Note: Table has 'host' column (user ID), not 'host_account_id'
      // Also fetch by proposal's host since older meetings may not have host field populated
      const { data, error: fetchError } = await supabase
        .from('virtualmeetingschedulesandlinks')
        .select('*')
        .eq('host', hostAccountId)
        .order('"booked date"', { ascending: true });

      if (fetchError) throw fetchError;

      return (data || []).map(meeting => ({
        id: meeting._id || meeting.id,
        guest: {
          firstName: meeting['guest name'] || 'Guest'
        },
        listing: {
          name: meeting['Listing (for Co-Host feature)'] || 'Listing'
        },
        bookedDate: meeting['booked date'],
        meetingLink: meeting['meeting link'],
        notifications: []
      }));
    } catch (err) {
      console.error('Error fetching virtual meetings:', err);
      return [];
    }
  }, []);

  const loadData = useCallback(async (finalUser = null) => {
    const activeUser = finalUser || userRef.current;
    if (!activeUser) return; // No user yet, skip

    setLoading(true);
    setError(null);

    try {
      // After migration, user.id serves as host reference directly
      const hostAccountId = activeUser.accountHostId || activeUser.id;
      const userId = activeUser.id;

      console.log('[HostOverview] loadData - hostAccountId:', hostAccountId, 'userId:', userId);

      // Fetch all data in parallel
      const [listings, claimListings, manuals, meetings] = await Promise.all([
        fetchHostListings(hostAccountId, userId),
        fetchListingsToClaim(hostAccountId),
        fetchHouseManuals(hostAccountId),
        fetchVirtualMeetings(hostAccountId)
      ]);

      setMyListings(listings);
      setListingsToClaim(claimListings);
      setHouseManuals(manuals);
      setVirtualMeetings(meetings);
    } catch (err) {
      console.error('[HostOverview] Error loading data:', err);
      setError('Failed to load your dashboard. Please try again.');
      showToast('Error', 'Failed to load dashboard data', 'error', 5000);
    } finally {
      setLoading(false);
    }
  }, [fetchHostListings, fetchListingsToClaim, fetchHouseManuals, fetchVirtualMeetings, showToast]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // When auth completes, map authUser to local state and trigger data fetch
  useEffect(() => {
    if (authLoading || !authUser) return;

    const mappedUser = {
      id: authUserId,
      firstName: authUser.firstName || 'Host',
      lastName: authUser.fullName?.split(' ').slice(1).join(' ') || '',
      email: authUser.email || '',
      accountHostId: authUser.accountHostId || authUserId
    };
    setUser(mappedUser);
    userRef.current = mappedUser;
    console.log('[HostOverview] User data loaded:', mappedUser.firstName);

    loadData(mappedUser);
  }, [authLoading, authUser, authUserId, loadData]);

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handleCreateNewListing = useCallback(() => {
    // Navigate directly to self-listing-v2 page for new listing creation
    window.location.href = '/self-listing-v2';
  }, []);

  const handleCloseCreateListingModal = useCallback(() => {
    setShowCreateListingModal(false);
  }, []);

  const handleImportListing = useCallback(() => {
    setShowImportListingModal(true);
  }, []);

  const handleCloseImportListingModal = useCallback(() => {
    setShowImportListingModal(false);
  }, []);

  const handleScheduleCohost = useCallback(() => {
    setShowScheduleCohost(true);
  }, []);

  const handleCloseScheduleCohost = useCallback(() => {
    setShowScheduleCohost(false);
  }, []);

  const handleCohostRequestSubmitted = useCallback(() => {
    showToast('Success', 'Your co-host request has been submitted!', 'success');
    setShowScheduleCohost(false);
  }, [showToast]);

  const handleImportListingSubmit = useCallback(async ({ listingUrl, emailAddress }) => {
    setImportListingLoading(true);
    try {
      // Send import request to Cloudflare Pages Function (same-origin, no CORS issues)
      const response = await fetch('/api/import-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingUrl,
          emailAddress,
          userId: user?.id,
          userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit import request');
      }

      showToast('Success', 'Import request submitted! We\'ll notify you when your listing is ready.', 'success', 5000);
      setShowImportListingModal(false);
    } catch (err) {
      console.error('Error submitting import request:', err);
      showToast('Error', 'Failed to submit import request. Please try again.', 'error', 5000);
    } finally {
      setImportListingLoading(false);
    }
  }, [user, showToast]);

  const handleCreateNewManual = useCallback(async () => {
    try {
      showToast('Creating Manual', 'Creating new house manual...', 'information');

      // Create new house manual via Bubble API
      const { data, error: createError } = await supabase.functions.invoke('bubble-proxy', {
        body: {
          endpoint: 'House manual',
          method: 'POST',
          body: {
            Host: user?.accountHostId,
            'Host Name': user?.firstName
          }
        }
      });

      if (createError) throw createError;

      const newManualId = data?.id;

      if (newManualId) {
        showToast('Success', 'House manual created! Redirecting...', 'success');
        // Navigate to edit the new manual
        window.location.href = `/host-house-manual/${newManualId}`;
      } else {
        // For now, just show success and reload
        showToast('Success', 'House manual created!', 'success');
        await loadData();
      }
    } catch (err) {
      console.error('Error creating house manual:', err);
      showToast('Error', 'Failed to create house manual', 'error', 5000);
    }
  }, [user, showToast, loadData]);

  const handleEditListing = useCallback((listing) => {
    showToast('Opening Listing', `Opening ${listing.name || listing.listing_title}...`, 'information');
    // Navigate to listing dashboard or edit page
    window.location.href = `/listing-dashboard?id=${listing.id}`;
  }, [showToast]);

  const handlePreviewListing = useCallback((listing) => {
    showToast('Preview', `Previewing ${listing.name || listing.listing_title}...`, 'information');
    // Open listing preview in new tab
    window.open(`/preview-split-lease/${listing.id}`, '_blank');
  }, [showToast]);

  const handleViewProposals = useCallback((listing) => {
    // Navigate to host-proposals page with listing pre-selected
    window.location.href = `/host-proposals?listingId=${listing.id}`;
  }, []);

  const handleViewLeases = useCallback((listing) => {
    // Navigate to host-leases page with listing pre-selected
    window.location.href = `/host-leases?listingId=${listing.id}`;
  }, []);

  const handleListingCardClick = useCallback((listing) => {
    // Navigate to listing dashboard (same as Manage button but for card click)
    window.location.href = `/listing-dashboard?id=${listing.id}`;
  }, []);

  const handleSeeDetails = useCallback((listing) => {
    showToast('Details', `Viewing details for ${listing.name || listing.listing_title}...`, 'information');
    // Navigate to claim listing details
    window.location.href = `/view-split-lease/${listing.id}?claim=true`;
  }, [showToast]);

  const handleEditManual = useCallback((manual) => {
    showToast('Opening Manual', `Opening ${manual.display || manual.Display}...`, 'information');
    // Navigate to house manual edit page
    window.location.href = `/host-house-manual/${manual.id}`;
  }, [showToast]);

  const handleViewVisits = useCallback((manual) => {
    showToast('Visits', `Viewing visit statistics for ${manual.display || manual.Display}...`, 'information');
    // TODO: Open visits modal or navigate to visits page
  }, [showToast]);

  const handleRespondToVirtualMeeting = useCallback((meeting) => {
    showToast('Virtual Meeting', 'Opening virtual meeting...', 'information');
    // TODO: Navigate to virtual meeting page or open modal
    if (meeting.meetingLink) {
      window.open(meeting.meetingLink, '_blank');
    }
  }, [showToast]);

  // ============================================================================
  // DELETE HANDLERS
  // ============================================================================

  const handleDeleteClick = useCallback((item, type) => {
    setItemToDelete(item);
    setDeleteType(type);
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      const itemId = itemToDelete.id;
      const itemName = itemToDelete.name || itemToDelete.listing_title || itemToDelete.display || 'item';

      if (deleteType === 'listing') {
        // Delete listing via listing edge function
        const { data, error } = await supabase.functions.invoke('listing', {
          body: {
            action: 'delete',
            payload: {
              listing_id: itemId,
              user_email: user?.email,
            }
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to delete listing');
        }

        setMyListings(prev => prev.filter(l => l.id !== itemId));
        showToast('Success', `${itemName} deleted successfully`, 'success');
      } else if (deleteType === 'claim') {
        // Remove from claim list (don't actually delete the listing)
        await supabase.functions.invoke('bubble-proxy', {
          body: {
            endpoint: `listing/${itemId}`,
            method: 'PATCH',
            body: {
              'Claimable By': [] // Clear the claimable by list
            }
          }
        });

        setListingsToClaim(prev => prev.filter(l => l.id !== itemId));
        showToast('Success', `${itemName} removed from claim list`, 'success');
      } else if (deleteType === 'manual') {
        // Delete house manual
        await supabase.functions.invoke('bubble-proxy', {
          body: {
            endpoint: `House manual/${itemId}`,
            method: 'DELETE'
          }
        });

        setHouseManuals(prev => prev.filter(m => m.id !== itemId));
        showToast('Success', `${itemName} deleted successfully`, 'success');
      }

      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setDeleteType(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      showToast('Error', 'Failed to delete item. Please try again.', 'error', 5000);
    }
  }, [itemToDelete, deleteType, showToast]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setDeleteType(null);
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Auth state
    authState,

    // Core data
    user,
    listingsToClaim,
    myListings,
    houseManuals,
    virtualMeetings,
    loading,
    error,

    // UI State
    showHelpBanner,
    setShowHelpBanner,
    toasts,
    removeToast,

    // Modal state
    showDeleteConfirm,
    itemToDelete,
    deleteType,
    showCreateListingModal,
    showImportListingModal,
    importListingLoading,
    showScheduleCohost,

    // Action handlers
    handleCreateNewListing,
    handleCloseCreateListingModal,
    handleImportListing,
    handleCloseImportListingModal,
    handleImportListingSubmit,
    handleScheduleCohost,
    handleCloseScheduleCohost,
    handleCohostRequestSubmitted,
    handleCreateNewManual,
    handleEditListing,
    handlePreviewListing,
    handleViewProposals,
    handleViewLeases,
    handleListingCardClick,
    handleSeeDetails,
    handleEditManual,
    handleViewVisits,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    handleRespondToVirtualMeeting,

    // Utility
    loadData
  };
}
