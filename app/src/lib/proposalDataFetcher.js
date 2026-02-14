/**
 * Proposal Data Fetcher Utilities
 * Handles URL parsing and data fetching for guest proposals page
 *
 * Based on the same pattern as listingDataFetcher.js but for user/proposal data
 */

import { supabase } from './supabase.js';

/**
 * Fetch all proposals for a guest user
 * Queries directly by guest_user_id field instead of relying on "Proposals List" array
 * to ensure data integrity and avoid missing proposals due to sync issues
 *
 * @param {string} userId - The user's id
 * @returns {Promise<Array>} Array of proposal objects
 */
export async function fetchProposalsByGuest(userId) {
  try {
    // Query proposals directly by guest_user_id field
    const { data: proposalsData, error: proposalsError } = await supabase
      .from('booking_proposal')
      .select('*')
      .eq('guest_user_id', userId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('original_created_at', { ascending: false });

    if (proposalsError) {
      console.error('Error fetching proposals:', proposalsError);
      return [];
    }

    console.log(`✅ Successfully fetched ${proposalsData?.length || 0} proposals for guest ${userId}`);

    return proposalsData || [];
  } catch (err) {
    console.error('Exception fetching proposals:', err);
    return [];
  }
}

/**
 * Fetch move-in date and reservation span from user's most recent proposal
 * for pre-populating new proposal creation flows.
 *
 * @param {string} userId - The user's id
 * @returns {Promise<{moveInDate: string|null, reservationSpanWeeks: number|null}|null>}
 *          Returns object with last proposal defaults, or null if no previous proposal exists
 */
export async function fetchLastProposalDefaults(userId) {
  if (!userId) {
    console.log('fetchLastProposalDefaults: No userId provided');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('booking_proposal')
      .select('move_in_range_start_date, reservation_span_in_weeks')
      .eq('guest_user_id', userId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('original_created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.log('No previous proposal found for pre-population');
      return null;
    }

    console.log('Found last proposal defaults:', {
      moveInDate: data.move_in_range_start_date,
      reservationSpanWeeks: data.reservation_span_in_weeks
    });

    return {
      moveInDate: data.move_in_range_start_date || null,
      reservationSpanWeeks: data.reservation_span_in_weeks || null
    };
  } catch (err) {
    console.warn('Error fetching last proposal defaults:', err);
    return null;
  }
}

/**
 * Load complete details for a specific proposal
 * Enriches proposal with:
 * - Listing data
 * - Host user data
 * - House rules
 * - Virtual meeting data
 *
 * @param {object} proposal - Base proposal object
 * @returns {Promise<object>} Enriched proposal object
 */
export async function loadProposalDetails(proposal) {
  try {
    const enrichedProposal = { ...proposal };

    // Load listing
    const listingId = proposal.listing_id;
    if (listingId) {
      const { data: listingData, error: listingError } = await supabase
        .from('listing')
        .select('*')
        .eq('id', listingId)
        .maybeSingle();

      if (!listingError && listingData) {
        enrichedProposal._listing = listingData;
      }
    }

    // Load guest user (from proposal's guest_user_id field)
    const guestUserId = proposal.guest_user_id;
    if (guestUserId) {
      const { data: guestData, error: guestError } = await supabase
        .from('user')
        .select(`
          id,
          first_name,
          last_name,
          profile_photo_url,
          bio_text,
          email,
          phone_number,
          linkedin_profile_id,
          is_phone_verified,
          is_email_confirmed,
          is_user_verified
        `)
        .eq('id', guestUserId)
        .maybeSingle();

      if (!guestError && guestData) {
        enrichedProposal._guest = guestData;
      }
    }

    // Load host user (from listing's host_user_id)
    if (enrichedProposal._listing?.host_user_id) {
      const { data: hostData, error: hostError } = await supabase
        .from('user')
        .select(`
          id,
          first_name,
          last_name,
          profile_photo_url,
          bio_text,
          email,
          phone_number,
          linkedin_profile_id,
          is_phone_verified,
          is_email_confirmed,
          is_user_verified
        `)
        .eq('id', enrichedProposal._listing.host_user_id)
        .maybeSingle();

      if (!hostError && hostData) {
        enrichedProposal._host = hostData;
      }
    }

    // Load house rules
    const houseRulesIds = proposal.house_rules_reference_ids_json;
    if (houseRulesIds && Array.isArray(houseRulesIds) && houseRulesIds.length > 0) {
      const { data: rulesData, error: rulesError } = await supabase
        .schema('reference_table').from('zat_features_houserule')
        .select('id, name, icon')
        .in('id', houseRulesIds);

      if (!rulesError && rulesData) {
        enrichedProposal._houseRules = rulesData;
      }
    }

    // Load virtual meeting
    const virtualMeetingId = proposal.virtual_meeting_record_id;
    if (virtualMeetingId) {
      const { data: vmData, error: vmError } = await supabase
        .from('virtualmeetingschedulesandlinks')
        .select('*')
        .eq('id', virtualMeetingId)
        .maybeSingle();

      if (!vmError && vmData) {
        enrichedProposal._virtualMeeting = vmData;
      }
    }

    return enrichedProposal;
  } catch (err) {
    console.error('Error loading proposal details:', err);
    return proposal;
  }
}
