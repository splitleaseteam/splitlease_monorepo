/**
 * Type definitions for Host Payment Records Edge Function
 * Split Lease - Supabase Edge Functions
 */

/**
 * Rental type determines payment cycle intervals:
 * - Monthly: 31-day intervals
 * - Weekly/Nightly: 28-day (4-week) intervals
 */
export type RentalType = 'Monthly' | 'Weekly' | 'Nightly';

/**
 * Week pattern affects how partial periods are calculated for Weekly rentals
 */
export type WeekPattern =
  | 'Every week'
  | 'One week on, one week off'
  | 'Two weeks on, two weeks off'
  | 'One week on, three weeks off';

/**
 * Input for generating host payment records
 * Mirrors the Bubble API Event inputs
 */
export interface GeneratePaymentRecordsInput {
  /** The lease/reservation ID (Bookings-Leases.id) */
  leaseId: string;

  /** Rental type: 'Nightly', 'Weekly', or 'Monthly' */
  rentalType: RentalType;

  /** Move-in date (start of the lease) */
  moveInDate: string;

  /** Reservation span in weeks (for Nightly/Weekly) */
  reservationSpanWeeks?: number;

  /** Reservation span in months (for Monthly) */
  reservationSpanMonths?: number;

  /** Week pattern for Weekly rentals */
  weekPattern: WeekPattern;

  /** Rent for a 4-week period (for Nightly/Weekly) */
  fourWeekRent?: number;

  /** Rent per month (for Monthly) */
  rentPerMonth?: number;

  /** Maintenance fee per payment period */
  maintenanceFee: number;

  /** Optional: Damage deposit (added to first payment only) */
  damageDeposit?: number;
}

/**
 * Calculated payment schedule entry
 */
export interface PaymentScheduleEntry {
  /** Payment number (1-indexed) */
  paymentNumber: number;

  /** Scheduled payment date */
  scheduledDate: Date;

  /** Rent amount for this period (without maintenance) */
  rent: number;

  /** Total amount including maintenance fee */
  total: number;
}

/**
 * Result of payment schedule calculation
 */
export interface PaymentScheduleResult {
  /** Array of payment dates (formatted as mm-dd-yyyy) */
  paymentDates: string[];

  /** Array of rent amounts (without maintenance) */
  rentList: number[];

  /** Array of total amounts (rent + maintenance) */
  totalRentList: number[];

  /** Sum of all payments */
  totalCompensationAmount: number;

  /** Number of payment cycles */
  numberOfPaymentCycles: number;
}

/**
 * Payment record as stored in the database
 */
export interface PaymentRecord {
  id: string;
  booking_reservation: string;
  payment: number;
  scheduled_date: string;
  rent: number;
  maintenance_fee: number;
  total_paid_to_host: number;
  payment_to_host: boolean;
  payment_from_guest: boolean;
  damage_deposit?: number;
  source_calculation: string;
  created_at: string;
  updated_at: string;
}

/**
 * Lease data needed for payment record generation
 */
export interface LeaseData {
  id: string;
  proposal_id?: string;
  rental_type?: string;
  reservation_start_date?: string;
  reservation_span_in_weeks?: number;
  reservation_span_in_months?: number;
  week_pattern?: string;
  four_week_rent?: number;
  rent_per_month?: number;
  maintenance_fee?: number;
  damage_deposit?: number;
  platform_to_host_payment_records_json?: string[];
  total_host_compensation_amount?: number;
}

/**
 * Proposal data for fetching additional payment details
 */
export interface ProposalData {
  id: string;
  host_proposed_cleaning_fee?: number;
  host_proposed_damage_deposit?: number;
  four_week_host_compensation?: number;
  rental_type?: string;
}

/**
 * Response from generate action
 */
export interface GeneratePaymentRecordsResponse {
  /** IDs of created payment records */
  paymentRecordIds: string[];

  /** Total compensation amount */
  totalCompensation: number;

  /** Number of payment records created */
  recordCount: number;

  /** The lease ID */
  leaseId: string;
}

/**
 * User context from authentication
 */
export interface UserContext {
  id: string;
  email: string;
  role?: string;
}
