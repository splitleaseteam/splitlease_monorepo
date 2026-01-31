/**
 * Type definitions for Lease Documents Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Defines payload interfaces for all 5 document types:
 * - Host Payout Schedule
 * - Supplemental Agreement
 * - Periodic Tenancy Agreement
 * - Credit Card Authorization (Prorated)
 * - Credit Card Authorization (Non-Prorated)
 */

// ================================================
// USER CONTEXT
// ================================================

export interface UserContext {
  id: string;
  email: string;
}

// ================================================
// PAYMENT ENTRY (Host Payout Schedule)
// ================================================

export interface PaymentEntry {
  date: string; // Input format: "MM/DD/YY" or "YYYY-MM-DD"
  rent: string; // Currency string e.g., "1028.58"
  total: string; // Currency string
}

// ================================================
// HOST PAYOUT PAYLOAD
// ================================================

export interface HostPayoutPayload {
  agreementNumber: string;
  hostName: string;
  hostEmail: string;
  hostPhone: string;
  address: string;
  payoutNumber: string;
  maintenanceFee: string;
  payments: PaymentEntry[]; // Up to 13 payment entries
}

// ================================================
// SUPPLEMENTAL AGREEMENT PAYLOAD
// ================================================

export interface SupplementalPayload {
  agreementNumber: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfWeeks: string;
  guestsAllowed: string;
  hostName: string;
  listingTitle: string;
  listingDescription: string;
  location: string;
  typeOfSpace: string;
  spaceDetails: string;
  supplementalNumber: string;
  image1Url?: string;
  image2Url?: string;
  image3Url?: string;
}

// ================================================
// PERIODIC TENANCY AGREEMENT PAYLOAD
// ================================================

export interface PeriodicTenancyPayload {
  agreementNumber: string;
  checkInDate: string;
  checkOutDate: string;
  checkInDay: string;
  checkOutDay: string;
  numberOfWeeks: string;
  guestsAllowed: string;
  hostName: string;
  guestName: string;
  supplementalNumber: string;
  authorizationCardNumber: string;
  hostPayoutScheduleNumber: string;
  extraRequestsOnCancellationPolicy?: string;
  damageDeposit: string;
  listingTitle: string;
  listingDescription: string;
  location: string;
  typeOfSpace: string;
  spaceDetails: string;
  houseRules: string | string[];
  image1Url?: string;
  image2Url?: string;
  image3Url?: string;
}

// ================================================
// CREDIT CARD AUTHORIZATION PAYLOAD
// ================================================

export interface CreditCardAuthPayload {
  agreementNumber: string;
  hostName: string;
  guestName: string;
  weeksNumber: string;
  listingDescription: string;
  numberOfPayments: string;
  fourWeekRent: string;
  damageDeposit: string;
  maintenanceFee: string;
  splitleaseCredit: string;
  lastPaymentRent: string;
  penultimateWeekNumber: string;
  lastPaymentWeeks: string;
  isProrated: boolean;
}

// ================================================
// GENERATE ALL PAYLOAD
// ================================================

export interface GenerateAllPayload {
  // Host Payout data
  hostPayout: HostPayoutPayload;
  // Supplemental data
  supplemental: SupplementalPayload;
  // Periodic Tenancy data
  periodicTenancy: PeriodicTenancyPayload;
  // Credit Card Auth data
  creditCardAuth: CreditCardAuthPayload;
}

// ================================================
// DOCUMENT RESULT
// ================================================

export interface DocumentResult {
  success: boolean;
  filename?: string;
  driveUrl?: string;
  fileId?: string;
  error?: string;
}

// ================================================
// GENERATE ALL RESULT
// ================================================

export interface GenerateAllResult {
  hostPayout: DocumentResult;
  supplemental: DocumentResult;
  periodicTenancy: DocumentResult;
  creditCardAuth: DocumentResult;
}

// ================================================
// TEMPLATE DATA TYPES (Internal)
// ================================================

export interface HostPayoutTemplateData {
  address: string;
  agreement_number: string;
  host_email: string;
  host_name: string;
  host_phone: string;
  payout_number: string;
  [key: `date${number}`]: string;
  [key: `rent${number}`]: string;
  [key: `total${number}`]: string;
  [key: `maintenance_fee${number}`]: string;
}

export interface SupplementalTemplateData {
  agreement_number: string;
  start_date: string;
  end_date: string;
  weeks_number: string;
  guest_allowed: string;
  guests_allowed: string;
  host_name: string;
  listing_description: string;
  listing_title: string;
  spacedetails: string;
  location: string;
  type_of_space: string;
  supplement_number: string;
  image1?: unknown;
  image2?: unknown;
  image3?: unknown;
}

export interface PeriodicTenancyTemplateData {
  agreement_number: string;
  start_date: string;
  end_date: string;
  last_date: string;
  check_in: string;
  check_out: string;
  week_duration: string;
  guests_allowed: string;
  host_name: string;
  guest_name: string;
  supplemental_number: string;
  credit_card_form_number: string;
  payout_number: string;
  cancellation_policy_rest: string;
  damage_deposit: string;
  listing_title: string;
  spacedetails: string;
  listing_description: string;
  location: string;
  type_of_space: string;
  House_rules_items: string;
  image1?: unknown;
  image2?: unknown;
  image3?: unknown;
}

export interface CreditCardAuthTemplateData {
  agreement_number: string;
  host_name: string;
  guest_name: string;
  maintenancefee: string;
  weeks_number: string;
  ListingDescription: string;
  fourweekrent: string;
  damagedeposit: string;
  totalfirstpayment: string;
  penultimateweeknumber: string;
  totalsecondpayment: string;
  slcredit: string;
  lastpaymenttotal: string;
  numberofpayments: string;
  lastpaymentweeks: string;
  lastpaymentrent: string;
}
