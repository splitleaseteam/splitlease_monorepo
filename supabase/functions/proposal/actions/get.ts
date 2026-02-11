/**
 * Get Proposal Action
 * Split Lease - Supabase Edge Functions
 *
 * Retrieves proposal details by ID using the proposal_detail view
 * which pre-joins proposal, listing, guest, and host data.
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError } from "../../_shared/errors.ts";
import { GetProposalInput, ProposalData, ProposalStatusName } from "../lib/types.ts";
import { getStatusStage } from "../lib/status.ts";

/**
 * Response structure for get proposal
 */
interface GetProposalResponse {
  proposal: ProposalData;
  status_display: string;
  status_stage: number;
  listing?: {
    _id: string;
    Name: string;
    "Location - Address": Record<string, unknown>;
  };
  guest?: {
    _id: string;
    "Name - Full": string;
    email: string;
  };
  host?: {
    _id: string;
    "Name - Full": string;
    email: string;
  };
}

/**
 * Columns added by the proposal_detail view's JOINs.
 * These are stripped from the row to reconstruct the pure proposal object.
 */
const VIEW_JOIN_COLUMNS = [
  "listing_id",
  "listing_name",
  "listing_address",
  "listing_borough",
  "listing_hood",
  "listing_rental_type",
  "listing_house_rules",
  "guest_id",
  "guest_full_name",
  "guest_first_name",
  "guest_last_name",
  "guest_email",
  "guest_avatar",
  "guest_phone",
  "host_id",
  "host_full_name",
  "host_first_name",
  "host_last_name",
  "host_email_fetched",
  "host_avatar",
  "host_phone",
] as const;

/**
 * Handle get proposal request
 */
export async function handleGet(
  payload: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<GetProposalResponse> {
  console.log(`[proposal:get] Starting get request`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as GetProposalInput;

  if (!input.proposal_id || typeof input.proposal_id !== "string") {
    throw new ValidationError("proposal_id is required and must be a string");
  }

  console.log(`[proposal:get] Fetching proposal: ${input.proposal_id}`);

  // ================================================
  // FETCH FROM proposal_detail VIEW (single query)
  // ================================================

  const { data: row, error: viewError } = await supabase
    .from("proposal_detail")
    .select("*")
    .eq("_id", input.proposal_id)
    .single();

  if (viewError || !row) {
    console.error(`[proposal:get] Proposal fetch failed:`, viewError);
    throw new ValidationError(`Proposal not found: ${input.proposal_id}`);
  }

  // ================================================
  // SEPARATE PROPOSAL DATA FROM JOIN COLUMNS
  // ================================================

  // deno-lint-ignore no-explicit-any
  const viewRow = row as Record<string, any>;

  // Extract the pure proposal columns by removing the view's join aliases
  const joinColumnSet = new Set<string>(VIEW_JOIN_COLUMNS);
  const proposalRecord: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(viewRow)) {
    if (!joinColumnSet.has(key)) {
      proposalRecord[key] = value;
    }
  }
  const proposalData = proposalRecord as unknown as ProposalData;

  console.log(`[proposal:get] Found proposal with status: ${proposalData.Status}`);

  // ================================================
  // BUILD RESPONSE
  // ================================================

  const statusName = proposalData.Status as ProposalStatusName;

  const response: GetProposalResponse = {
    proposal: proposalData,
    status_display: statusName,
    status_stage: getStatusStage(statusName),
  };

  // Map listing join columns to the original response shape
  if (viewRow.listing_id) {
    response.listing = {
      _id: viewRow.listing_id,
      Name: viewRow.listing_name,
      "Location - Address": viewRow.listing_address,
    };
  }

  // Map guest join columns to the original response shape
  if (viewRow.guest_id) {
    response.guest = {
      _id: viewRow.guest_id,
      "Name - Full": viewRow.guest_full_name,
      email: viewRow.guest_email,
    };
  }

  // Map host join columns to the original response shape
  if (viewRow.host_id) {
    response.host = {
      _id: viewRow.host_id,
      "Name - Full": viewRow.host_full_name,
      email: viewRow.host_email_fetched,
    };
  }

  console.log(`[proposal:get] Returning proposal with enriched data`);

  return response;
}
