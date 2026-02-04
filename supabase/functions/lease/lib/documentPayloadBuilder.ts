/**
 * Document Payload Builder
 * Split Lease - Supabase Edge Functions
 *
 * Builds Python-compatible payloads for the lease-documents edge function.
 * Maps lease, proposal, user, and listing data to document template fields.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ProposalData, ActiveTerms } from './types.ts';

// ================================================
// TYPES
// ================================================

interface UserData {
  _id: string;
  'first name'?: string;
  'last name'?: string;
  email?: string;
  'Phone Number'?: string;
}

interface ListingData {
  _id: string;
  Name?: string;
  Title?: string;
  Description?: string;
  Location?: string;
  'Type of Space'?: string;
  'Space Details'?: string;
  'House Rules'?: string[];
  address?: string;
  image1?: string;
  image2?: string;
  image3?: string;
}

interface PaymentRecord {
  'Payment Date': string;
  Amount: number;
}

interface DocumentPayloadContext {
  leaseId: string;
  agreementNumber: string;
  proposal: ProposalData;
  activeTerms: ActiveTerms;
  moveOutDate: string;
  hostPaymentRecords: PaymentRecord[];
}

interface GenerateAllPayload {
  hostPayout: Record<string, unknown>;
  supplemental: Record<string, unknown>;
  periodicTenancy: Record<string, unknown>;
  creditCardAuth: Record<string, unknown>;
}

// ================================================
// DATA FETCHERS
// ================================================

/**
 * Fetch user details needed for documents
 */
async function fetchUserData(
  supabase: SupabaseClient,
  userId: string
): Promise<UserData | null> {
  const { data, error } = await supabase
    .from('user')
    .select('_id, "first name", "last name", email, "Phone Number"')
    .eq('_id', userId)
    .single();

  if (error) {
    console.warn(`[documentPayloadBuilder] Could not fetch user ${userId}:`, error.message);
    return null;
  }

  return data as UserData;
}

/**
 * Fetch listing details needed for documents
 */
async function fetchListingData(
  supabase: SupabaseClient,
  listingId: string
): Promise<ListingData | null> {
  const { data, error } = await supabase
    .from('listing')
    .select(
      '_id, Name, Title, Description, Location, "Type of Space", "Space Details", "House Rules", address, image1, image2, image3'
    )
    .eq('_id', listingId)
    .single();

  if (error) {
    console.warn(`[documentPayloadBuilder] Could not fetch listing ${listingId}:`, error.message);
    return null;
  }

  return data as ListingData;
}

/**
 * Fetch host payment records for payout schedule
 */
async function fetchHostPaymentRecords(
  supabase: SupabaseClient,
  leaseId: string
): Promise<PaymentRecord[]> {
  const { data, error } = await supabase
    .from('host_payment_records')
    .select('"Payment Date", Amount')
    .eq('Lease', leaseId)
    .order('Payment Date', { ascending: true });

  if (error) {
    console.warn('[documentPayloadBuilder] Could not fetch host payment records:', error.message);
    return [];
  }

  return (data || []) as PaymentRecord[];
}

// ================================================
// HELPER FUNCTIONS
// ================================================

/**
 * Format a full name from first and last name
 */
function formatFullName(user: UserData | null): string {
  if (!user) return '';
  const firstName = user['first name'] || '';
  const lastName = user['last name'] || '';
  return `${firstName} ${lastName}`.trim();
}

/**
 * Format date for document display (DD/MM/YYYY)
 */
function formatDateForDocument(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format currency for document display
 */
function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '0.00';
  return amount.toFixed(2);
}

/**
 * Get day name from date
 */
function getDayName(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()] || '';
}

/**
 * Calculate payment schedule values
 */
function calculatePaymentSchedule(
  reservationWeeks: number,
  fourWeekRent: number,
  maintenanceFee: number,
  damageDeposit: number,
  splitleaseCredit: number
): {
  numberOfPayments: number;
  penultimateWeekNumber: number;
  lastPaymentWeeks: number;
  lastPaymentRent: number;
  isProrated: boolean;
} {
  const weeksPerPayment = 4;
  const fullPayments = Math.floor(reservationWeeks / weeksPerPayment);
  const remainingWeeks = reservationWeeks % weeksPerPayment;
  const isProrated = remainingWeeks > 0;

  const numberOfPayments = isProrated ? fullPayments + 1 : fullPayments;
  const penultimateWeekNumber = numberOfPayments > 1 ? (numberOfPayments - 1) * weeksPerPayment : 0;
  const lastPaymentWeeks = isProrated ? remainingWeeks : weeksPerPayment;
  const lastPaymentRent = isProrated
    ? (fourWeekRent / weeksPerPayment) * remainingWeeks
    : fourWeekRent;

  return {
    numberOfPayments,
    penultimateWeekNumber,
    lastPaymentWeeks,
    lastPaymentRent,
    isProrated,
  };
}

// ================================================
// PAYLOAD BUILDERS
// ================================================

/**
 * Build Host Payout payload
 */
function buildHostPayoutPayload(
  context: DocumentPayloadContext,
  hostUser: UserData | null,
  listing: ListingData | null
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    'Agreement Number': context.agreementNumber,
    'Host Name': formatFullName(hostUser),
    'Host Email': hostUser?.email || '',
    'Host Phone': hostUser?.['Phone Number'] || '',
    Address: listing?.address || listing?.Location || '',
    'Payout Number': `${context.agreementNumber}-PO`,
    'Maintenance Fee': formatCurrency(context.activeTerms.maintenanceFee),
  };

  // Add payment entries (Date1-13, Rent1-13, Total1-13)
  context.hostPaymentRecords.forEach((record, index) => {
    if (index < 13) {
      const num = index + 1;
      payload[`Date${num}`] = formatDateForDocument(record['Payment Date']);
      payload[`Rent${num}`] = formatCurrency(record.Amount);
      payload[`Total${num}`] = formatCurrency(record.Amount + context.activeTerms.maintenanceFee);
    }
  });

  return payload;
}

/**
 * Build Supplemental Agreement payload
 */
function buildSupplementalPayload(
  context: DocumentPayloadContext,
  hostUser: UserData | null,
  listing: ListingData | null
): Record<string, unknown> {
  return {
    'Agreement Number': context.agreementNumber,
    'Check in Date': formatDateForDocument(context.activeTerms.moveInDate),
    'Check Out Date': formatDateForDocument(context.moveOutDate),
    'Number of weeks': String(context.activeTerms.reservationWeeks),
    'Guests Allowed': '1', // Default to 1, could be from listing
    'Host Name': formatFullName(hostUser),
    'Listing Title': listing?.Title || listing?.Name || '',
    'Listing Description': listing?.Description || '',
    Location: listing?.Location || '',
    'Type of Space': listing?.['Type of Space'] || '',
    'Space Details': listing?.['Space Details'] || '',
    'Supplemental Number': `${context.agreementNumber}-SA`,
    image1: listing?.image1 || '',
    image2: listing?.image2 || '',
    image3: listing?.image3 || '',
  };
}

/**
 * Build Periodic Tenancy Agreement payload
 */
function buildPeriodicTenancyPayload(
  context: DocumentPayloadContext,
  hostUser: UserData | null,
  guestUser: UserData | null,
  listing: ListingData | null
): Record<string, unknown> {
  return {
    'Agreement Number': context.agreementNumber,
    'Check in Date': formatDateForDocument(context.activeTerms.moveInDate),
    'Check Out Date': formatDateForDocument(context.moveOutDate),
    'Check In Day': getDayName(context.activeTerms.moveInDate),
    'Check Out Day': getDayName(context.moveOutDate),
    'Number of weeks': String(context.activeTerms.reservationWeeks),
    'Guests Allowed': '1',
    'Host name': formatFullName(hostUser),
    'Guest name': formatFullName(guestUser),
    'Supplemental Number': `${context.agreementNumber}-SA`,
    'Authorization Card Number': `${context.agreementNumber}-CC`,
    'Host Payout Schedule Number': `${context.agreementNumber}-PO`,
    'Extra Requests on Cancellation Policy': '',
    'Damage Deposit': formatCurrency(context.activeTerms.damageDeposit),
    'Listing Title': listing?.Title || listing?.Name || '',
    'Listing Description': listing?.Description || '',
    Location: listing?.Location || '',
    'Type of Space': listing?.['Type of Space'] || '',
    'Space Details': listing?.['Space Details'] || '',
    'House Rules': listing?.['House Rules'] || [],
    image1: listing?.image1 || '',
    image2: listing?.image2 || '',
    image3: listing?.image3 || '',
  };
}

/**
 * Build Credit Card Authorization payload
 */
function buildCreditCardAuthPayload(
  context: DocumentPayloadContext,
  hostUser: UserData | null,
  guestUser: UserData | null,
  listing: ListingData | null
): Record<string, unknown> {
  const schedule = calculatePaymentSchedule(
    context.activeTerms.reservationWeeks,
    context.activeTerms.fourWeekRent,
    context.activeTerms.maintenanceFee,
    context.activeTerms.damageDeposit,
    0 // Splitlease credit - would need to be passed if applicable
  );

  return {
    'Agreement Number': context.agreementNumber,
    'Host Name': formatFullName(hostUser),
    'Guest Name': formatFullName(guestUser),
    'Four Week Rent': formatCurrency(context.activeTerms.fourWeekRent),
    'Maintenance Fee': formatCurrency(context.activeTerms.maintenanceFee),
    'Damage Deposit': formatCurrency(context.activeTerms.damageDeposit),
    'Splitlease Credit': '0.00',
    'Last Payment Rent': formatCurrency(schedule.lastPaymentRent),
    'Weeks Number': String(context.activeTerms.reservationWeeks),
    'Listing Description': listing?.Description || '',
    'Penultimate Week Number': String(schedule.penultimateWeekNumber),
    'Number of Payments': String(schedule.numberOfPayments),
    'Last Payment Weeks': String(schedule.lastPaymentWeeks),
    'Is Prorated': schedule.isProrated,
  };
}

// ================================================
// MAIN EXPORT
// ================================================

/**
 * Build complete payload for generating all documents
 *
 * @param supabase - Supabase client
 * @param context - Document generation context with lease/proposal data
 * @returns GenerateAllPayload ready for lease-documents edge function
 */
export async function buildDocumentPayload(
  supabase: SupabaseClient,
  context: DocumentPayloadContext
): Promise<GenerateAllPayload> {
  console.log('[documentPayloadBuilder] Building document payload for agreement:', context.agreementNumber);

  // Fetch additional data in parallel
  const [hostUser, guestUser, listing, hostPayments] = await Promise.all([
    fetchUserData(supabase, context.proposal['Host User']),
    fetchUserData(supabase, context.proposal.Guest),
    fetchListingData(supabase, context.proposal.Listing),
    fetchHostPaymentRecords(supabase, context.leaseId),
  ]);

  // Update context with fetched payment records
  context.hostPaymentRecords = hostPayments;

  console.log('[documentPayloadBuilder] Fetched data:', {
    hostName: formatFullName(hostUser),
    guestName: formatFullName(guestUser),
    listingTitle: listing?.Title || listing?.Name || 'N/A',
    paymentRecordsCount: hostPayments.length,
  });

  // Build all payloads
  return {
    hostPayout: buildHostPayoutPayload(context, hostUser, listing),
    supplemental: buildSupplementalPayload(context, hostUser, listing),
    periodicTenancy: buildPeriodicTenancyPayload(context, hostUser, guestUser, listing),
    creditCardAuth: buildCreditCardAuthPayload(context, hostUser, guestUser, listing),
  };
}
