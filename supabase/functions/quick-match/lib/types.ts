/**
 * Quick Match Type Definitions
 * Split Lease - Supabase Edge Functions
 *
 * TypeScript interfaces for the Quick Match feature
 */

// ─────────────────────────────────────────────────────────────
// Request/Response Types
// ─────────────────────────────────────────────────────────────

export interface GetProposalPayload {
  readonly proposal_id: string;
}

export interface SearchCandidatesPayload {
  readonly proposal_id: string;
  readonly filters?: SearchFilters;
  readonly limit?: number;
}

export interface SaveChoicePayload {
  readonly proposal_id: string;
  readonly matched_listing_id: string;
  readonly match_score: number;
  readonly match_reason?: string;
}

export interface SearchFilters {
  readonly borough?: string;
  readonly max_price?: number;
  readonly min_score?: number;
}

// ─────────────────────────────────────────────────────────────
// Domain Types
// ─────────────────────────────────────────────────────────────

export interface GuestInfo {
  readonly id: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly fullName: string | null;
  readonly email: string | null;
}

export interface ListingInfo {
  readonly id: string;
  readonly title: string | null;
  readonly borough: string | null;
  readonly boroughName: string | null;
  readonly hood: string | null;
  readonly hoodName: string | null;
  readonly address: unknown;
  readonly nightlyRates: NightlyRates;
  readonly cleaningFee: number | null;
  readonly damageDeposit: number | null;
  readonly minimumNights: number | null;
  readonly maximumNights: number | null;
  readonly daysAvailable: number[];
  readonly nightsAvailable: number[];
  readonly active: boolean;
}

export interface NightlyRates {
  readonly rate1: number | null;
  readonly rate2: number | null;
  readonly rate3: number | null;
  readonly rate4: number | null;
  readonly rate5: number | null;
  readonly rate6: number | null;
  readonly rate7: number | null;
}

export interface HostInfo {
  readonly id: string;
  readonly firstName: string | null;
  readonly fullName: string | null;
  readonly linkedInVerified: boolean;
  readonly phoneVerified: boolean;
  readonly userVerified: boolean;
}

export interface ProposalDetails {
  readonly id: string;
  readonly guest: GuestInfo;
  readonly listing: ListingInfo;
  readonly daysSelected: number[];
  readonly nightsPerWeek: number;
  readonly nightlyPrice: number;
  readonly moveInStart: string | null;
  readonly moveInEnd: string | null;
  readonly status: string | null;
  readonly reservationWeeks: number | null;
}

// ─────────────────────────────────────────────────────────────
// Scoring Types
// ─────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  readonly borough: ScoreComponent;
  readonly price: ScoreComponent;
  readonly schedule: ScoreComponent;
  readonly weeklyStay: ScoreComponent;
  readonly duration: ScoreComponent;
  readonly host: ScoreComponent;
}

export interface ScoreComponent {
  readonly score: number;
  readonly max: number;
  readonly label: string;
}

export type MatchTier = 'excellent' | 'good' | 'fair' | 'poor';

export interface CandidateMatch {
  readonly listing: ListingInfo;
  readonly host: HostInfo;
  readonly score: number;
  readonly breakdown: ScoreBreakdown;
  readonly tier: MatchTier;
}

export interface SearchCandidatesResult {
  readonly candidates: CandidateMatch[];
  readonly total: number;
  readonly filtersApplied: SearchFilters;
}

export interface SaveChoiceResult {
  readonly success: boolean;
  readonly matchId: string;
}

// ─────────────────────────────────────────────────────────────
// Database Row Types (from Supabase)
// ─────────────────────────────────────────────────────────────

export interface ProposalRow {
  readonly id: string;
  readonly guest_user_id: string | null;
  readonly listing_id: string | null;
  readonly guest_email_address: string;
  readonly host_user_id: string | null;
  readonly proposal_workflow_status: string | null;
  readonly move_in_range_start_date: string;
  readonly move_in_range_end_date: string;
  readonly reservation_span_in_weeks: number;
  readonly guest_selected_days_numbers_json: number[] | null;
  readonly guest_selected_nights_numbers_json: number[] | null;
  readonly nights_per_week_count: number;
  readonly calculated_nightly_price: number | null;
  readonly cleaning_fee_amount: number | null;
  readonly damage_deposit_amount: number | null;
  readonly is_deleted: boolean | null;
}

export interface ListingRow {
  readonly id: string;
  readonly listing_title: string | null;
  readonly host_user_id: string | null;
  readonly borough: string | null;
  readonly primary_neighborhood_reference_id: string | null;
  readonly address_with_lat_lng_json: unknown;
  readonly available_days_as_day_numbers_json: number[];
  readonly available_nights_as_day_numbers_json: number[];
  readonly minimum_nights_per_stay: number;
  readonly maximum_nights_per_stay: number | null;
  readonly nightly_rate_for_1_night_stay?: number | null;
  readonly nightly_rate_for_2_night_stay?: number | null;
  readonly nightly_rate_for_3_night_stay?: number | null;
  readonly nightly_rate_for_4_night_stay?: number | null;
  readonly nightly_rate_for_5_night_stay?: number | null;
  readonly nightly_rate_for_7_night_stay?: number | null;
  readonly cleaning_fee_amount?: number | null;
  readonly damage_deposit_amount?: number | null;
  readonly is_active: boolean | null;
  readonly is_deleted: boolean | null;
  // Joined fields
  readonly boroughName?: string | null;
  readonly hoodName?: string | null;
}

export interface UserRow {
  readonly id: string;
  readonly first_name: string | null;
  readonly last_name: string | null;
  readonly email: string | null;
  readonly linkedin_profile_id: string | null;
  readonly is_phone_verified: boolean | null;
  readonly is_user_verified: boolean | null;
}
