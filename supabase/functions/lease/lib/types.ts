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
  'Agreement Number': string;
  // FK CONSTRAINT: proposal.id
  Proposal: string;
  Guest: string;
  Host: string;
  // FK CONSTRAINT: listing.id
  Listing: string;
  Participants: string[];
  // FK CONSTRAINT: zat_features_cancellationpolicy.id (nullable - use null if no valid FK!)
  'Cancellation Policy': string | null;
  'First Payment Date': string;
  // SCHEMA-VERIFIED (2026-01-28): Actual column names have space before colon
  'Reservation Period : Start': string;
  'Reservation Period : End': string;
  'Total Compensation': number;
  'Total Rent': number;
  // Note: 'rental type' does NOT exist in bookings_leases table
  'List of Stays': string[];
  'Payment Records Guest-SL': string[];
  'Payment Records SL-Hosts': string[];
  'Lease Status': string;
  'Lease signed?': boolean;
  'were documents generated?': boolean;
  Thread: string | null;
  // SCHEMA-VERIFIED (2026-01-28): 'House Manual' column does NOT exist in bookings_leases
  'Created Date': string;
  'Modified Date': string;
  // Date fields (populated by date generation)
  'List of Booked Dates'?: string[];
  'total week count'?: number;
  'current week number'?: number;
}

export interface ProposalData {
  id: string;
  Guest: string;
  'Host User': string;
  Listing: string;
  Status: string;
  'rental type': string;
  'Move in range start': string;
  'Move in range end': string;
  'Reservation Span (Weeks)': number;
  'duration in months': number;
  'nights per week (num)': number;
  'proposal nightly price': number;
  'damage deposit': number;
  'cleaning fee': number;
  'maintenance fee': number;
  'counter offer happened': boolean;
  'Days Selected': number[];
  'week selection': { Display: string } | null;
  'host compensation': number;
  // Check-in/check-out days (can be string or { Display: string })
  'check in day': string | { Display: string };
  'check out day': string | { Display: string };
  // HC (Historical Copy) fields for counteroffers
  'hc move in date': string;
  'hc reservation span (weeks)': number;
  'hc nights per week': number;
  'hc nightly price': number;
  'hc 4 week rent': number;
  'hc 4 week compensation': number;
  'hc damage deposit': number;
  'hc cleaning fee': number;
  'hc maintenance fee': number;
  'hc duration in months': number;
  'hc weeks schedule': { Display: string } | null;
  'hc host compensation (per period)': number;
  'hc days selected': number[];
  'hc nights selected': number[];
  'hc check in day': string | { Display: string };
  'hc check out day': string | { Display: string };
  // Computed fields
  '4 week rent': number;
  '4 week compensation': number;
  // Date fields (populated by date generation)
  'List of Booked Dates'?: string[];
  'Check-In Dates'?: string[];
  'Check-Out Dates'?: string[];
  'total nights'?: number;
  // Nested listing data
  listing?: {
    id: string;
    Name: string;
    'House manual': string | null;
    'users with permission': string[];
    'cancellation policy': string;
  };
}

export interface StayData {
  id: string;
  Lease: string;
  'Week Number': number;
  Guest: string;
  Host: string;
  listing: string;
  'Dates - List of dates in this period': string[];
  'Check In (night)': string;
  'Last Night (night)': string;
  'Stay Status': string;
  'Created Date': string;
  'Modified Date': string;
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
