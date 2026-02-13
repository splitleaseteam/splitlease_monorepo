/**
 * User Proposal Query Functions
 * Implements direct booking_proposal query approach per user requirement
 *
 * Data flow:
 * 1. Get user ID from authenticated session (NOT from URL)
 * 2. Fetch user data
 * 3. Extract proposal IDs by querying booking_proposal table
 * 4. Fetch proposals by those specific IDs
 * 5. Fetch related listings and hosts (nested fetches)
 * 6. Return user + proposals + selected proposal
 */

import { supabase } from '../supabase.js';
import { getUserIdFromSession, getProposalIdFromQuery } from './urlParser.js';

/**
 * STEP 1: Fetch user data
 *
 * @param {string} userId - User ID from URL path
 * @returns {Promise<Object>} User object
 */
export async function fetchUserWithProposalList(userId) {
  // Use .maybeSingle() instead of .single() to avoid 406 error when no rows found
  const { data, error } = await supabase
    .from('user')
    .select(`
      id,
      first_name,
      last_name,
      profile_photo_url,
      email
    `)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('fetchUserWithProposalList: Error fetching user:', error);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  if (!data) {
    console.error('fetchUserWithProposalList: User not found with ID:', userId);
    throw new Error(`User with ID ${userId} not found. Please check the URL.`);
  }

  console.log('fetchUserWithProposalList: User fetched:', data.first_name || `${data.first_name} ${data.last_name}`);
  return data;
}

/**
 * STEP 2: Fetch proposal IDs for a guest user by querying the proposal table directly
 * This ensures data integrity and avoids missing proposals due to Proposals List sync issues
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} Array of proposal IDs
 */
export async function extractProposalIds(userId) {
  // Query proposals directly by guest_user_id field
  const { data, error } = await supabase
    .from('booking_proposal')
    .select('id')
    .eq('guest_user_id', userId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .neq('proposal_workflow_status', 'Proposal Cancelled by Guest');

  if (error) {
    console.error('extractProposalIds: Error fetching proposal IDs:', error);
    return [];
  }

  const proposalIds = (data || []).map(p => p.id);
  console.log(`extractProposalIds: Found ${proposalIds.length} proposal IDs for guest ${userId}`);
  return proposalIds;
}

/**
 * STEP 3: Fetch proposals by their IDs from user's Proposals List
 * Note: Some proposal IDs may be orphaned (don't exist in proposal table)
 *
 * @param {Array<string>} proposalIds - Array of proposal IDs from user's list
 * @returns {Promise<Array<Object>>} Array of proposal objects with nested data
 */
export async function fetchProposalsByIds(proposalIds, currentUserId = null) {
  if (!proposalIds || proposalIds.length === 0) {
    console.warn('fetchProposalsByIds: No proposal IDs to fetch');
    return [];
  }

  // Step 1: Fetch all proposals by IDs
  // Filter out deleted proposals and cancelled-by-guest at database level for efficiency
  const { data: proposals, error: proposalError } = await supabase
    .from('booking_proposal')
    .select(`
      id,
      proposal_workflow_status,
      is_deleted,
      guest_user_id,
      listing_id,
      guest_selected_days_numbers_json,
      guest_selected_nights_numbers_json,
      reservation_span_in_weeks,
      nights_per_week_count,
      checkin_day_of_week_number,
      checkout_day_of_week_number,
      move_in_range_start_date,
      move_in_range_end_date,
      total_reservation_price_for_guest,
      calculated_nightly_price,
      cleaning_fee_amount,
      damage_deposit_amount,
      has_host_counter_offer,
      host_proposed_selected_days_json,
      host_proposed_checkin_day,
      host_proposed_checkout_day,
      host_proposed_nights_per_week,
      host_proposed_reservation_span_weeks,
      host_proposed_total_guest_price,
      host_proposed_nightly_price,
      original_created_at,
      original_updated_at,
      guest_about_yourself_text,
      rental_application_id,
      virtual_meeting_record_id,
      is_finalized,
      house_rules_reference_ids_json,
      reminder_count_sent_by_guest
    `)
    .in('id', proposalIds)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .neq('proposal_workflow_status', 'Proposal Cancelled by Guest')
    .order('original_created_at', { ascending: false });

  if (proposalError) {
    console.error('fetchProposalsByIds: Error fetching proposals:', proposalError);
    throw new Error(`Failed to fetch proposals: ${proposalError.message}`);
  }

  // Additional client-side safety filter (in case DB filter doesn't catch edge cases)
  const validProposals = (proposals || []).filter(p => {
    if (!p) return false;

    // Exclude deleted proposals (is_deleted = true or "true")
    if (p.is_deleted === true || p.is_deleted === 'true') return false;

    // Exclude proposals cancelled by guest
    if (p.proposal_workflow_status === 'Proposal Cancelled by Guest') return false;

    return true;
  });

  if (validProposals.length === 0) {
    console.log('fetchProposalsByIds: No valid proposals found');
    return [];
  }

  // Log if some proposals were orphaned
  if (validProposals.length < proposalIds.length) {
    console.warn(`fetchProposalsByIds: Found ${validProposals.length} proposals out of ${proposalIds.length} IDs (${proposalIds.length - validProposals.length} orphaned/filtered)`);
  } else {
    console.log(`fetchProposalsByIds: Fetched ${validProposals.length} proposals from user's list`);
  }

  // Step 2: Extract unique listing IDs from proposals
  const listingIds = [...new Set(validProposals.map(p => p.listing_id).filter(Boolean))];

  if (listingIds.length === 0) {
    console.warn('fetchProposalsByIds: No listings found for proposals');
    return validProposals.map(p => ({ ...p, listing: null }));
  }

  console.log(`fetchProposalsByIds: Fetching ${listingIds.length} unique listings`);

  // Step 3: Fetch all listings
  const { data: listings, error: listingError } = await supabase
    .from('listing')
    .select(`
      id,
      listing_title,
      listing_description,
      address_with_lat_lng_json,
      map_pin_offset_address_json,
      borough,
      primary_neighborhood_reference_id,
      photos_with_urls_captions_and_sort_order_json,
      house_rule_reference_ids_json,
      checkin_time_of_day,
      checkout_time_of_day,
      host_user_id,
      "House manual"
    `)
    .in('id', listingIds);

  if (listingError) {
    console.error('fetchProposalsByIds: Error fetching listings:', listingError);
    return validProposals.map(p => ({ ...p, listing: null }));
  }

  // Step 3.25: Extract featured photos from embedded photos_with_urls_captions_and_sort_order_json
  console.log(`fetchProposalsByIds: Extracting featured photos for ${listingIds.length} listings`);

  const embeddedPhotoMap = new Map();

  (listings || []).forEach(listing => {
    const photosField = listing.photos_with_urls_captions_and_sort_order_json;
    let photos = [];

    // Parse JSON if needed (may be double-encoded as string)
    if (Array.isArray(photosField)) {
      photos = photosField;
    } else if (typeof photosField === 'string') {
      try {
        photos = JSON.parse(photosField);
      } catch {
        void 0; // Intentional: malformed JSON falls back to empty array
      }
    }

    if (Array.isArray(photos) && photos.length > 0) {
      // Sort by sort_order and find main photo or use first one
      const sorted = [...photos].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const firstPhoto = sorted[0];

      if (typeof firstPhoto === 'object' && firstPhoto !== null) {
        const mainPhoto = sorted.find(p => p.toggleMainPhoto) || firstPhoto;
        let photoUrl = mainPhoto.url || mainPhoto.Photo || '';
        if (photoUrl.startsWith('//')) photoUrl = 'https:' + photoUrl;
        if (photoUrl) embeddedPhotoMap.set(listing.id, photoUrl);
      } else if (typeof firstPhoto === 'string') {
        let photoUrl = firstPhoto;
        if (photoUrl.startsWith('//')) photoUrl = 'https:' + photoUrl;
        if (photoUrl) embeddedPhotoMap.set(listing.id, photoUrl);
      }
    }
  });

  console.log(`fetchProposalsByIds: Found ${embeddedPhotoMap.size} embedded photos`);

  // Step 3.5: Fetch borough, neighborhood, and house rules names from lookup tables
  const boroughIds = [...new Set((listings || []).map(l => l.borough).filter(Boolean))];
  const hoodIds = [...new Set((listings || []).map(l => l.primary_neighborhood_reference_id).filter(Boolean))];

  // Collect all house rule IDs from all proposals
  // House Rules field is stored as a JSON string array: "[\"id1\", \"id2\"]"
  const allHouseRuleIds = [...new Set(
    validProposals
      .flatMap(p => {
        const houseRulesRaw = p.house_rules_reference_ids_json;
        if (!houseRulesRaw) return [];
        // Parse JSON string if needed
        if (typeof houseRulesRaw === 'string') {
          try {
            return JSON.parse(houseRulesRaw);
          } catch (e) {
            console.warn('fetchProposalsByIds: Failed to parse House Rules JSON:', e);
            return [];
          }
        }
        // Already an array
        if (Array.isArray(houseRulesRaw)) return houseRulesRaw;
        return [];
      })
      .filter(Boolean)
  )];

  console.log(`fetchProposalsByIds: Fetching ${boroughIds.length} boroughs, ${hoodIds.length} neighborhoods, ${allHouseRuleIds.length} house rules`);

  let boroughs = [];
  let hoods = [];

  if (boroughIds.length > 0) {
    const { data: boroughsData, error: boroughError } = await supabase
      .schema('reference_table')
      .from('zat_geo_borough_toplevel')
      .select('id, display_borough')
      .in('id', boroughIds);

    if (!boroughError) {
      boroughs = boroughsData || [];
      console.log(`fetchProposalsByIds: Fetched ${boroughs.length} boroughs`);
    }
  }

  if (hoodIds.length > 0) {
    const { data: hoodsData, error: hoodError } = await supabase
      .schema('reference_table')
      .from('zat_geo_hood_mediumlevel')
      .select('id, display')
      .in('id', hoodIds);

    if (!hoodError) {
      hoods = hoodsData || [];
      console.log(`fetchProposalsByIds: Fetched ${hoods.length} neighborhoods`);
    }
  }

  // Step 3.6: Fetch house rules names from lookup table
  let houseRules = [];
  if (allHouseRuleIds.length > 0) {
    const { data: houseRulesData, error: houseRulesError } = await supabase
      .schema('reference_table')
      .from('zat_features_houserule')
      .select('id, name')
      .in('id', allHouseRuleIds);

    if (!houseRulesError) {
      houseRules = houseRulesData || [];
      console.log(`fetchProposalsByIds: Fetched ${houseRules.length} house rules`);
    } else {
      console.error('fetchProposalsByIds: Error fetching house rules:', houseRulesError);
    }
  }

  // Step 4: Extract unique host user IDs from listings
  // After migration, host_user_id contains user.id directly
  const hostUserIds = [...new Set((listings || []).map(l => l.host_user_id).filter(Boolean))];

  console.log(`fetchProposalsByIds: Fetching ${hostUserIds.length} unique hosts`);

  let hosts = [];
  if (hostUserIds.length > 0) {
    const { data: hostsData, error: hostError } = await supabase
      .from('user')
      .select(`
        id,
        first_name,
        last_name,
        profile_photo_url,
        bio_text,
        linkedin_profile_id,
        is_phone_verified,
        is_user_verified
      `)
      .in('id', hostUserIds);

    if (hostError) {
      console.error('fetchProposalsByIds: Error fetching hosts:', hostError);
    } else {
      hosts = hostsData || [];
      console.log(`fetchProposalsByIds: Fetched ${hosts.length} hosts`);
    }
  }

  // Step 5.5: Extract unique guest IDs from proposals and fetch guest user data
  const guestIds = [...new Set(validProposals.map(p => p.guest_user_id).filter(Boolean))];

  console.log(`fetchProposalsByIds: Fetching ${guestIds.length} unique guests`);

  let guests = [];
  if (guestIds.length > 0) {
    const { data: guestsData, error: guestError } = await supabase
      .from('user')
      .select(`
        id,
        first_name,
        last_name,
        profile_photo_url,
        bio_text,
        linkedin_profile_id,
        is_phone_verified,
        is_user_verified,
        has_submitted_id_documents
      `)
      .in('id', guestIds);

    if (guestError) {
      console.error('fetchProposalsByIds: Error fetching guests:', guestError);
    } else {
      guests = guestsData || [];
      console.log(`fetchProposalsByIds: Fetched ${guests.length} guests`);
    }
  }

  // Step 5.6: Fetch rental application submitted status for proposals
  const rentalAppIds = [...new Set(
    validProposals
      .map(p => p.rental_application_id)
      .filter(Boolean)
  )];

  console.log(`fetchProposalsByIds: Fetching ${rentalAppIds.length} rental applications`);

  let rentalApps = [];
  if (rentalAppIds.length > 0) {
    const { data: rentalAppsData, error: rentalAppError } = await supabase
      .from('rentalapplication')
      .select('id, submitted, percentage_done')
      .in('id', rentalAppIds);

    if (rentalAppError) {
      console.error('fetchProposalsByIds: Error fetching rental applications:', rentalAppError);
    } else {
      rentalApps = rentalAppsData || [];
      console.log(`fetchProposalsByIds: Fetched ${rentalApps.length} rental applications`);
    }
  }

  // Create rental application lookup map
  const rentalAppMap = new Map(rentalApps.map(ra => [ra.id, ra]));

  // Step 6: Fetch virtual meetings for all proposals
  console.log(`fetchProposalsByIds: Fetching virtual meetings for ${validProposals.length} proposals`);

  const proposalIdsForVM = validProposals.map(p => p.id).filter(Boolean);
  let virtualMeetings = [];

  if (proposalIdsForVM.length > 0) {
    const { data: vmData, error: vmError } = await supabase
      .from('virtualmeetingschedulesandlinks')
      .select(`
        id,
        booked_date,
        confirmedbysplitlease,
        meeting_link,
        meeting_declined,
        requested_by,
        suggested_dates_and_times,
        guest_name,
        host_name,
        proposal
      `)
      .in('proposal', proposalIdsForVM);

    if (vmError) {
      console.error('fetchProposalsByIds: Error fetching virtual meetings:', vmError);
    } else {
      virtualMeetings = vmData || [];
      console.log(`fetchProposalsByIds: Fetched ${virtualMeetings.length} virtual meetings`);
    }
  }

  // Create virtual meeting lookup map
  const vmMap = new Map(virtualMeetings.map(vm => [vm.proposal, vm]));

  // Step 6.5: Fetch negotiation summaries for all proposals
  // IMPORTANT: Filter by "To Account" to ensure users only see summaries intended for them
  // - Guests see summaries where "To Account" = guest ID (why this listing was suggested)
  // - Hosts see summaries where "To Account" = host ID (proposal terms summary)
  const proposalIdsForSummaries = validProposals.map(p => p.id);
  let negotiationSummaries = [];

  if (proposalIdsForSummaries.length > 0) {
    let summariesQuery = supabase
      .from('negotiationsummary')
      .select('*')
      .in('proposal_associated', proposalIdsForSummaries)
      .order('original_created_at', { ascending: false });

    // Filter by "To Account" if currentUserId is provided
    if (currentUserId) {
      summariesQuery = summariesQuery.eq('to_account', currentUserId);
    }

    const { data: summariesData, error: summariesError } = await summariesQuery;

    if (summariesError) {
      console.error('fetchProposalsByIds: Error fetching negotiation summaries:', summariesError);
    } else {
      negotiationSummaries = summariesData || [];
      console.log(`fetchProposalsByIds: Fetched ${negotiationSummaries.length} negotiation summaries for user ${currentUserId || 'unknown'}`);
    }
  }

  // Create summary lookup map
  const summaryMap = new Map();
  negotiationSummaries.forEach(summary => {
    const proposalId = summary.proposal_associated;
    if (!summaryMap.has(proposalId)) {
      summaryMap.set(proposalId, []);
    }
    summaryMap.get(proposalId).push(summary);
  });

  // Step 6.6: Fetch SplitBot counteroffer summary messages
  // These are created when a host submits a counteroffer - stored in thread_message table
  // Link: proposal.id -> thread."Proposal" -> thread_message."Associated Thread/Conversation"
  console.log(`fetchProposalsByIds: Fetching counteroffer summaries for ${proposalIdsForSummaries.length} proposals`);

  const counterofferSummaryMap = new Map();

  if (proposalIdsForSummaries.length > 0) {
    // First, fetch threads for all proposals
    // Note: Use unquoted column name for .in() filter - Supabase JS client handles quoting
    const { data: threadsData, error: threadsError } = await supabase
      .from('thread')
      .select('id, proposal')
      .in('proposal', proposalIdsForSummaries);

    if (threadsError) {
      console.error('fetchProposalsByIds: Error fetching threads:', threadsError);
    } else if (threadsData && threadsData.length > 0) {
      const threadIds = threadsData.map(t => t.id);
      const threadToProposalMap = new Map(threadsData.map(t => [t.id, t.proposal]));

      // Fetch SplitBot counteroffer messages
        const { data: counterofferMsgs, error: counterofferError } = await supabase
          .from('thread_message')
          .select(`
            id,
            message_body_text,
            call_to_action_button_label,
            thread_id,
            original_created_at
          `)
          .in('thread_id', threadIds)
          .eq('is_from_split_bot', true)
          .eq('call_to_action_button_label', 'Respond to Counter Offer')
          .order('original_created_at', { ascending: false });

      if (counterofferError) {
        console.error('fetchProposalsByIds: Error fetching counteroffer messages:', counterofferError);
      } else if (counterofferMsgs && counterofferMsgs.length > 0) {
        // Map messages to their proposals (take only the most recent per proposal)
        counterofferMsgs.forEach(msg => {
          const threadId = msg.thread_id;
          const proposalId = threadToProposalMap.get(threadId);
          if (proposalId && !counterofferSummaryMap.has(proposalId)) {
            counterofferSummaryMap.set(proposalId, msg['message_body_text']);
          }
        });
      }
    }
  }

  // Step 7: Create lookup maps for efficient joining
  const listingMap = new Map((listings || []).map(l => [l.id, l]));
  // Key hosts by their id (Host User column now contains user.id directly)
  const hostMap = new Map(hosts.map(h => [h.id, h]));
  // Key guests by their id field
  const guestMap = new Map(guests.map(g => [g.id, g]));
  // Key boroughs and hoods by their id
  const boroughMap = new Map(boroughs.map(b => [b.id, b.display_borough]));
  const hoodMap = new Map(hoods.map(h => [h.id, h.display]));
  // Key featured photos by their Listing ID
  const featuredPhotoMap = embeddedPhotoMap;
  // Key house rules by their id to get names
  const houseRulesMap = new Map(houseRules.map(r => [r.id, r.name]));

  // Step 8: Manually join the data
  const enrichedProposals = validProposals.map((proposal) => {
    const listing = listingMap.get(proposal.listing_id);
    // Lookup host by host_user_id from listing (contains user.id directly)
    const host = listing ? hostMap.get(listing.host_user_id) : null;
    // Lookup guest by proposal's guest_user_id field
    const guest = guestMap.get(proposal.guest_user_id);
    // Lookup borough and hood names
    const boroughName = listing ? boroughMap.get(listing.borough) : null;
    const hoodName = listing ? hoodMap.get(listing.primary_neighborhood_reference_id) : null;
    // Lookup featured photo URL
    const featuredPhotoUrl = listing ? featuredPhotoMap.get(listing.id) : null;
    // Lookup virtual meeting
    const virtualMeeting = vmMap.get(proposal.id) || null;
    // Lookup rental application
    const rentalApplication = rentalAppMap.get(proposal.rental_application_id) || null;
    // Lookup negotiation summaries
    const negotiationSummaries = summaryMap.get(proposal.id) || [];
    // Lookup counteroffer summary (SplitBot message)
    const counterofferSummary = counterofferSummaryMap.get(proposal.id) || null;

    // Resolve house rules IDs to names (from proposal, not listing)
    // House Rules field is stored as a JSON string array: "[\"id1\", \"id2\"]"
    let proposalHouseRuleIds = [];
    const houseRulesRaw = proposal.house_rules_reference_ids_json;
    if (houseRulesRaw) {
      if (typeof houseRulesRaw === 'string') {
        try {
          proposalHouseRuleIds = JSON.parse(houseRulesRaw);
        } catch (_e) {
          proposalHouseRuleIds = [];
        }
      } else if (Array.isArray(houseRulesRaw)) {
        proposalHouseRuleIds = houseRulesRaw;
      }
    }
    const houseRulesResolved = proposalHouseRuleIds
      .map(id => houseRulesMap.get(id))
      .filter(Boolean);

    return {
      ...proposal,
      listing: listing ? {
        ...listing,
        host,
        boroughName,
        hoodName,
        featuredPhotoUrl,
        hasHouseManual: Boolean(listing['House manual'])
      } : null,
      guest: guest || null,
      virtualMeeting,
      rentalApplication,
      houseRules: houseRulesResolved,
      negotiationSummaries,
      counterofferSummary
    };
  });

  console.log(`fetchProposalsByIds: Successfully enriched ${enrichedProposals.length} proposals with listing and host data`);
  return enrichedProposals;
}

/**
 * COMPLETE FLOW: Get user's proposals from authenticated session
 * This is the main function to call from components
 *
 * User ID comes from secure storage (session), NOT from URL.
 * This ensures users can only view their own proposals.
 *
 * @returns {Promise<{user: Object, proposals: Array, selectedProposal: Object|null}>}
 */
export async function fetchUserProposalsFromUrl() {
  // Step 1: Get user ID from authenticated session (NOT URL)
  const userId = getUserIdFromSession();
  if (!userId) {
    throw new Error('NOT_AUTHENTICATED');
  }

  // Step 2: Fetch user data
  const user = await fetchUserWithProposalList(userId);

  // Step 3: Fetch proposal IDs by querying proposal table directly
  const proposalIds = await extractProposalIds(userId);

  // Handle case where user has no proposals
  if (proposalIds.length === 0) {
    console.log('fetchUserProposalsFromUrl: User has no proposals');
    return {
      user,
      proposals: [],
      selectedProposal: null
    };
  }

  // Step 4: Fetch proposals by those specific IDs (pass userId for summary filtering)
  const proposals = await fetchProposalsByIds(proposalIds, userId);

  if (proposals.length === 0) {
    console.log('fetchUserProposalsFromUrl: No valid proposals found (all IDs may be filtered out)');
    return {
      user,
      proposals: [],
      selectedProposal: null
    };
  }

  // Step 5: Check for preselected proposal
  const preselectedId = getProposalIdFromQuery();
  let selectedProposal = null;

  if (preselectedId) {
    selectedProposal = proposals.find(p => p.id === preselectedId);
    if (!selectedProposal) {
      console.warn(`fetchUserProposalsFromUrl: Preselected proposal ${preselectedId} not found, defaulting to first`);
      selectedProposal = proposals[0] || null;
    } else {
      console.log('fetchUserProposalsFromUrl: Using preselected proposal:', preselectedId);
    }
  } else {
    selectedProposal = proposals[0] || null;
    console.log('fetchUserProposalsFromUrl: Defaulting to first proposal');
  }

  return {
    user,
    proposals,
    selectedProposal
  };
}
