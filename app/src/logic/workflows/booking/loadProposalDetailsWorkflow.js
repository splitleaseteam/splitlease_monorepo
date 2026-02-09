/**
 * Workflow: Load complete proposal details with all enrichments.
 *
 * @intent Orchestrate loading and processing of proposal data from Supabase.
 * @rule Separates infrastructure (fetching) from domain logic (processing).
 * @rule Fetches raw data, then transforms via processors.
 * @rule Returns processed, validated proposal object ready for UI consumption.
 *
 * This workflow replaces the mixed fetcher/transformer pattern from proposalDataFetcher.js
 * by explicitly separating:
 * - Data fetching (infrastructure - still uses Supabase client)
 * - Data processing (domain logic - uses Logic Core processors)
 *
 * @param {object} params - Named parameters.
 * @param {object} params.supabase - Supabase client instance.
 * @param {object} params.rawProposal - Base proposal object (minimal data).
 * @param {object} [params.processListingData] - Listing processor function.
 * @param {object} [params.processUserData] - User processor function.
 * @param {object} [params.processProposalData] - Proposal processor function.
 * @returns {Promise<object>} Fully enriched and processed proposal object.
 *
 * @throws {Error} If rawProposal is missing.
 * @throws {Error} If critical data cannot be loaded.
 *
 * @example
 * import { loadProposalDetailsWorkflow } from '../logic/workflows/booking/loadProposalDetailsWorkflow.js'
 * import { processProposalData } from '../logic/processors/proposals/processProposalData.js'
 * import { processUserData } from '../logic/processors/user/processUserData.js'
 * import { processListingData } from '../logic/processors/listing/processListingData.js'
 * import { supabase } from '../lib/supabase.js'
 *
 * const enrichedProposal = await loadProposalDetailsWorkflow({
 *   supabase,
 *   rawProposal: { id: 'abc123', listing_id: 'xyz', guest_user_id: '456' },
 *   processProposalData,
 *   processUserData,
 *   processListingData
 * })
 */
export async function loadProposalDetailsWorkflow({
  supabase,
  rawProposal,
  processListingData,
  processUserData,
  processProposalData
}) {
  // Validation
  if (!rawProposal) {
    throw new Error('loadProposalDetailsWorkflow: rawProposal is required')
  }

  if (!supabase) {
    throw new Error('loadProposalDetailsWorkflow: supabase client is required')
  }

  // Step 1: Fetch listing data
  let processedListing = null
  const listingId = rawProposal.listing_id || rawProposal.Listing
  if (listingId) {
    const { data: listingData, error: listingError } = await supabase
      .from('listing')
      .select('*')
      .eq('id', listingId)
      .single()

    if (!listingError && listingData) {
      // Process listing if processor provided
      if (processListingData) {
        try {
          processedListing = processListingData({ rawListing: listingData })
        } catch (err) {
          console.warn('Warning: Failed to process listing data:', err.message)
          // Continue without processed listing - UI will handle gracefully
        }
      } else {
        // No processor provided, use raw data
        processedListing = listingData
      }
    }
  }

  // Step 2: Fetch guest user data
  let processedGuest = null
  const guestUserId = rawProposal.guest_user_id || rawProposal.Guest
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
        "Verify - Linked In ID",
        "Verify - Phone",
        "is email confirmed",
        "user verified?"
      `)
      .eq('id', guestUserId)
      .single()

    if (!guestError && guestData) {
      // Process user if processor provided
      if (processUserData) {
        try {
          processedGuest = processUserData(guestData)
        } catch (err) {
          console.warn('Warning: Failed to process guest data:', err.message)
        }
      } else {
        processedGuest = guestData
      }
    }
  }

  // Step 3: Fetch host user data (from proposal or listing creator)
  let processedHost = null
  const hostUserId = rawProposal.host_user_id || rawProposal['Host User'] || (processedListing && (processedListing.host_user_id || processedListing['Created By']))
  if (hostUserId) {
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
        "Verify - Linked In ID",
        "Verify - Phone",
        "is email confirmed",
        "user verified?"
      `)
      .eq('id', hostUserId)
      .single()

    if (!hostError && hostData) {
      // Process user if processor provided
      if (processUserData) {
        try {
          processedHost = processUserData(hostData)
        } catch (err) {
          console.warn('Warning: Failed to process host data:', err.message)
        }
      } else {
        processedHost = hostData
      }
    }
  }

  // Step 4: Fetch house rules (if any)
  let houseRules = null
  const houseRulesArray = rawProposal.house_rules_json || rawProposal['House Rules']
  if (
    houseRulesArray &&
    Array.isArray(houseRulesArray) &&
    houseRulesArray.length > 0
  ) {
    const { data: rulesData, error: rulesError } = await supabase
      .schema('reference_table')
      .from('zat_features_houserule')
      .select('_id, Name, Icon')
      .in('_id', houseRulesArray)

    if (!rulesError && rulesData) {
      houseRules = rulesData
    }
  }

  // Step 5: Fetch virtual meeting data (if any)
  let virtualMeeting = null
  const virtualMeetingId = rawProposal.virtual_meeting_record_id || rawProposal['virtual meeting']
  if (virtualMeetingId) {
    const { data: vmData, error: vmError } = await supabase
      .from('virtualmeetingschedulesandlinks')
      .select('*')
      .eq('_id', virtualMeetingId)
      .single()

    if (!vmError && vmData) {
      virtualMeeting = vmData
    }
  }

  // Step 6: Process proposal with all enriched data
  let processedProposal
  if (processProposalData) {
    try {
      processedProposal = processProposalData({
        rawProposal,
        listing: processedListing,
        guest: processedGuest,
        host: processedHost
      })
    } catch (err) {
      // If processor throws, this is a critical error
      throw new Error(`Failed to process proposal data: ${err.message}`)
    }
  } else {
    // No processor provided, create basic structure
    processedProposal = {
      ...rawProposal,
      _listing: processedListing,
      _guest: processedGuest,
      _host: processedHost
    }
  }

  // Step 7: Attach additional enrichments
  if (houseRules) {
    processedProposal._houseRules = houseRules
  }

  if (virtualMeeting) {
    processedProposal._virtualMeeting = virtualMeeting
  }

  return processedProposal
}
