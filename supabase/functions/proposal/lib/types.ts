/**
 * Type definitions for Proposal Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * These types define the input/output contracts and internal data structures
 * for proposal creation and management.
 */

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for creating a new proposal
 * Maps to Bubble CORE-create_proposal-NEW workflow (37 parameters)
 *
 * NOTE: Uses camelCase to match frontend payload format
 */
export interface CreateProposalInput {
  // Required Identifiers
  listingId: string;
  guestId: string;

  // Required Pricing
  estimatedBookingTotal: number;

  // Optional Guest Preferences (tech-debt: should be collected from user)
  guestFlexibility?: string;
  preferredGender?: string; // → os_gender_type.name

  // Dates & Duration
  moveInStartRange: string; // ISO date
  moveInEndRange: string; // ISO date
  reservationSpanWeeks: number;
  reservationSpan: string; // → os_stay_periods.name
  actualWeeks?: number;

  // Day/Night Selection (Bubble indexing: 1-7, Sun=1)
  daysSelected: number[];
  nightsSelected: number[];
  checkIn: number;
  checkOut: number;

  // Pricing Details
  proposalPrice: number;
  fourWeekRent?: number;
  fourWeekCompensation?: number;
  hostCompensation?: number;

  // Guest Information
  comment?: string;
  needForSpace?: string;
  aboutMe?: string;
  specialNeeds?: string;

  // Optional Overrides
  status?: string; // → os_proposal_status.name
  suggestedReason?: string;
  originProposalId?: string;
  moveInRangeText?: string;
  flexibleMoveIn?: boolean;
  numberOfMatches?: number;

  // Custom schedule (user's freeform description of their preferred recurrent pattern)
  customScheduleDescription?: string;
}

/**
 * Input for updating an existing proposal
 */
export interface UpdateProposalInput {
  proposal_id: string;

  // All fields optional for partial update
  status?: string;
  proposal_price?: number;
  move_in_start_range?: string;
  move_in_end_range?: string;
  days_selected?: number[];
  nights_selected?: number[];
  reservation_span_weeks?: number;
  comment?: string;

  // Host counteroffer fields
  hc_nightly_price?: number;
  hc_days_selected?: number[];
  hc_nights_selected?: number[];
  hc_nights_per_week?: number;
  hc_move_in_date?: string;
  hc_reservation_span_weeks?: number;
  hc_cleaning_fee?: number;
  hc_damage_deposit?: number;
  hc_total_price?: number;
  hc_four_week_rent?: number;
  hc_four_week_compensation?: number;
  hc_host_compensation?: number;
  hc_total_host_compensation?: number;
  hc_duration_in_months?: number;
  hc_check_in?: number;
  hc_check_out?: number;
  hc_house_rules?: string[];

  // Cancellation
  reason_for_cancellation?: string;
}

/**
 * Input for getting proposal details
 */
export interface GetProposalInput {
  proposal_id: string;
}

// ============================================
// OUTPUT TYPES
// ============================================

/**
 * Response after creating a proposal
 * NOTE: Uses camelCase to match frontend expectations
 */
export interface CreateProposalResponse {
  proposalId: string;
  status: string;
  orderRanking: number;
  listingId: string;
  guestId: string;
  hostId: string;
  createdAt: string;
  threadId: string | null;
  aiHostSummary: string | null;
}

/**
 * Response after updating a proposal
 */
export interface UpdateProposalResponse {
  proposal_id: string;
  status: string;
  updated_fields: string[];
  updated_at: string;
}

/**
 * Full proposal data for get request
 */
export interface ProposalData {
  id: string;
  listing_id: string;
  guest_user_id: string;
  host_user_id: string;
  proposal_workflow_status: string;
  calculated_nightly_price: number;
  move_in_range_start_date: string;
  move_in_range_end_date: string;
  reservation_span_in_weeks: number;
  reservation_span_text: string;
  guest_selected_days_numbers_json: number[];
  guest_selected_nights_numbers_json: number[];
  checkin_day_of_week_number: number;
  checkout_day_of_week_number: number;
  total_reservation_price_for_guest: number;
  total_compensation_for_host: number;
  cleaning_fee_amount: number;
  damage_deposit_amount: number;
  guest_schedule_flexibility_text: string;
  preferred_roommate_gender: string;
  guest_stated_need_for_space?: string;
  guest_about_yourself_text?: string;
  guest_special_needs_text?: string; // Verify column name
  guest_introduction_message?: string;
  display_sort_order: number;
  is_finalized: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  
  // Host counteroffer fields
  host_proposed_nightly_price?: number;
  host_proposed_selected_days_json?: number[];
  host_proposed_selected_nights_json?: number[];
  host_proposed_move_in_date?: string;
  host_proposed_reservation_span_weeks?: number;
  host_proposed_nights_per_week?: number;
  host_proposed_total_guest_price?: number;
  has_host_counter_offer?: boolean;
  
  // Cancellation
  reason_for_cancellation?: string;
}

// ============================================
// INTERNAL TYPES
// ============================================

/**
 * Listing data fetched from database
 * All columns use snake_case names matching the listing table schema
 */
export interface ListingData {
  id: string;
  listing_title?: string;
  host_user_id: string;
  rental_type: string;
  house_rule_reference_ids_json: string[];
  weeks_offered_schedule_text?: string;
  available_days_as_day_numbers_json: number[];
  available_nights_as_day_numbers_json: number[];
  address_with_lat_lng_json: Record<string, unknown>;
  map_pin_offset_address_json?: string;
  borough?: string;
  cleaning_fee_amount: number;
  damage_deposit_amount: number;
  weekly_rate_paid_to_host?: number;
  nightly_rate_for_1_night_stay?: number;
  nightly_rate_for_2_night_stay?: number;
  nightly_rate_for_3_night_stay?: number;
  nightly_rate_for_4_night_stay?: number;
  nightly_rate_for_5_night_stay?: number;
  nightly_rate_for_7_night_stay?: number;
  monthly_rate_paid_to_host?: number;
  pricing_configuration_id?: string;
  unit_markup_percentage?: number;
  is_deleted?: boolean;
}

/**
 * Guest user data fetched from database
 * All columns use snake_case names matching the user table schema
 * NOTE: "Proposals List" and "Favorited Listings" columns were removed;
 * use junction tables user_proposal and user_listing_favorite instead
 */
export interface GuestData {
  id: string;
  email: string;
  rental_application_form_id: string | null;
  bio_text?: string;
  stated_need_for_space_text?: string;
  stated_special_needs_text?: string;
  onboarding_tasks_completed_list_json?: string[];
}

/**
 * Host user data fetched from database
 * NOTE: "Proposals List" column was removed; use junction table user_proposal instead
 */
export interface HostUserData {
  id: string;
  email: string;
}

/**
 * Rental application data
 */
export interface RentalApplicationData {
  id: string;
  submitted: boolean;
}

/**
 * Result of compensation calculation
 */
export interface CompensationResult {
  total_compensation: number;
  duration_months: number;
  four_week_rent: number;
  four_week_compensation: number;
  /** Host's per-night rate (used for "host compensation" field in proposal) */
  host_compensation_per_night: number;
}

/**
 * User context from authentication
 */
export interface UserContext {
  id: string;
  email: string;
}

// ============================================
// OPTION SET TYPES
// ============================================

/**
 * Proposal status display values from os_proposal_status
 * IMPORTANT: Use Bubble's display format for compatibility with Bubble Data API
 */
export type ProposalStatusName =
  | "Proposal Submitted for guest by Split Lease - Awaiting Rental Application"
  | "Proposal Submitted by guest - Awaiting Rental Application"
  | "Proposal Submitted for guest by Split Lease - Pending Confirmation"
  | "Host Review"
  | "Host Counteroffer Submitted / Awaiting Guest Review"
  | "Proposal or Counteroffer Accepted / Drafting Lease Documents"
  | "Lease Documents Sent for Review"
  | "Lease Documents Sent for Signatures"
  | "Lease Documents Signed / Awaiting Initial payment"
  | "Initial Payment Submitted / Lease activated "
  | "Proposal Cancelled by Guest"
  | "Proposal Rejected by Host"
  | "Proposal Cancelled by Split Lease"
  | "Guest Ignored Suggestion";

/**
 * Rental type options
 */
export type RentalType = "nightly" | "weekly" | "monthly";

/**
 * Reservation span options from os_stay_periods
 */
export type ReservationSpan =
  | "1_week"
  | "2_weeks"
  | "1_month"
  | "2_months"
  | "3_months"
  | "6_months"
  | "1_year"
  | "other";

// ============================================
// ASYNC WORKFLOW TYPES
// ============================================

/**
 * Payload for triggering async communications workflow
 */
export interface CommunicationsPayload {
  proposal_id: string;
  guest_id: string;
  host_id: string;
  listing_id: string;
  status: string;
  has_rental_app: boolean;
}

/**
 * Payload for triggering async suggestions workflow
 */
export interface SuggestionsPayload {
  proposal_id: string;
  listing_id: string;
  guest_id: string;
  days_selected: number[];
  nights_selected: number[];
  move_in_start_range: string;
}

/**
 * Payload for triggering proposal summary generation
 */
export interface SummaryPayload {
  proposal_id: string;
  host_id: string;
  guest_name: string;
  listing_name: string;
  move_in_start: string;
  nights_per_week: number;
  total_price: number;
  duration_weeks: number;
}

// ============================================
// MOCKUP PROPOSAL TYPES
// ============================================

/**
 * Input for creating a mockup proposal
 * Used when a host submits their first listing
 */
export interface CreateMockupProposalInput {
  listingId: string;
  hostUserId: string;
  hostEmail: string;
}

/**
 * Response after creating a mockup proposal
 */
export interface CreateMockupProposalResponse {
  proposalId: string;
  threadId: string | null;
  status: string;
  createdAt: string;
}
