/**
 * Type Definitions for Lease Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * NO FALLBACK PRINCIPLE: All types are explicit without default values
 */

// ================================================
// REQUEST/RESPONSE TYPES
// ================================================

export interface CreateLeasePayload {
  proposalId: string;
  isCounteroffer: boolean;
  fourWeekRent: number;
  fourWeekCompensation: number;
  // numberOfZeros removed - now using date-based daily counter (YYYYMMDD-XXXX)
}

export interface CreateLeaseResponse {
  leaseId: string;
  agreementNumber: string;
  staysCreated: number;
  guestPaymentRecordsCreated: number;
  hostPaymentRecordsCreated: number;
  magicLinks: {
    host: string;
    guest: string;
  };
  documentsGenerated: boolean;
}

export interface GetLeasePayload {
  leaseId: string;
}

// ================================================
// DATABASE RECORD TYPES
// ================================================

export interface LeaseData {
  id: string;
  agreement_number: string;
  proposal_id?: string;
  guest_user_id: string;
  host_user_id: string;
  listing_id: string;
  participant_user_ids_json: string[];
  cancellation_policy_text: string | null;
  first_payment_date: string;
  reservation_start_date: string;
  reservation_end_date: string;
  total_host_compensation_amount: number;
  total_guest_rent_amount: number;
  stay_ids_json: string[];
  guest_to_platform_payment_records_json: string[];
  platform_to_host_payment_records_json: string[];
  lease_type?: string;
  is_lease_signed: boolean;
  were_legal_documents_generated: boolean;
  thread_id: string | null;
  created_at: string;
  updated_at: string;
  booked_dates_json?: string[];
  total_week_count?: number;
  current_week_number?: number;
}

export interface ProposalData {
  id: string;
  guest_user_id: string;
  host_user_id: string;
  listing_id: string;
  proposal_workflow_status: string;
  rental_type: string;
  move_in_range_start_date: string;
  move_in_range_end_date: string;
  reservation_span_in_weeks: number;
  stay_duration_in_months: number;
  nights_per_week_count: number;
  calculated_nightly_price: number;
  damage_deposit_amount: number;
  cleaning_fee_amount: number;
  has_host_counter_offer: boolean;
  guest_selected_days_numbers_json: number[];
  guest_selected_nights_numbers_json?: number[];
  week_pattern_selection?: string;
  weeks_offered_schedule_text?: string;
  host_compensation_per_period: number;
  checkin_day_of_week_number: number | string;
  checkout_day_of_week_number: number | string;
  four_week_rent_amount?: number;
  four_week_host_compensation?: number;
  // Host counteroffer (HC) fields
  host_proposed_move_in_date?: string;
  host_proposed_reservation_span_weeks?: number;
  host_proposed_nights_per_week?: number;
  host_proposed_nightly_price?: number;
  host_proposed_four_week_rent?: number;
  host_proposed_four_week_compensation?: number;
  host_proposed_damage_deposit?: number;
  host_proposed_cleaning_fee?: number;
  host_proposed_duration_months?: number;
  host_proposed_week_pattern?: string;
  host_proposed_compensation_per_period?: number;
  host_proposed_selected_days_json?: number[];
  host_proposed_selected_nights_json?: number[];
  host_proposed_checkin_day?: number | string;
  host_proposed_checkout_day?: number | string;
  host_proposed_weeks_schedule?: string;
  host_proposed_total_host_compensation?: number;
  host_proposed_total_guest_price?: number;
  // Date fields
  booked_dates_list_json?: string[];
  total_reservation_price_for_guest?: number;
  total_compensation_for_host?: number;
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface StayData {
  id: string;
  lease_id: string;
  week_number_in_lease: number;
  guest_user_id: string;
  host_user_id: string;
  listing_id: string;
  dates_in_this_stay_period_json: string[];
  checkin_night_date: string;
  last_night_date: string;
  stay_status: string;
  created_at: string;
  updated_at: string;
}

// ================================================
// UTILITY TYPES
// ================================================

export interface UserContext {
  id: string;
  email: string;
}

export interface ActiveTerms {
  moveInDate: string;
  reservationWeeks: number;
  nightsPerWeek: number;
  nightlyPrice: number;
  fourWeekRent: number;
  damageDeposit: number;
  cleaningFee: number;
  maintenanceFee: number;
}

export interface PaymentPayload {
  leaseId: string;
  rentalType: string;
  moveInDate: string;
  reservationSpanWeeks?: number;
  reservationSpanMonths?: number;
  weekPattern: string;
  fourWeekRent?: number;
  rentPerMonth?: number;
  maintenanceFee: number;
  damageDeposit?: number;
}

export interface PaymentResult {
  success: boolean;
  recordCount: number;
  totalAmount: number;
  error?: string;
}

export interface MagicLinksResult {
  host: string;
  guest: string;
}
