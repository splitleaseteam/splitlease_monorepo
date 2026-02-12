/**
 * Payload Builder for Lease Documents Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Builds API payloads from Supabase data using corrected field mappings.
 * Implements "Fields For Lease Documents" prep step before API call.
 *
 * Key corrections applied from schema verification:
 * - Move In/Out dates from `proposal` table (not `bookings_leases`)
 * - Column `Payment Records SL-Hosts` (not `Host-SL`)
 * - Column `cleaning fee` (not `Maintenance Fee`)
 * - Financial fields from `proposal` table
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type {
  HostPayoutPayload,
  SupplementalPayload,
  PeriodicTenancyPayload,
  CreditCardAuthPayload,
  GenerateAllPayload,
} from './types.ts';

// ================================================
// TYPES
// ================================================

interface LeaseRecord {
  id: string;
  'Agreement Number': string;
  'Reservation Period : Start': string | null;
  'Reservation Period : End': string | null;
  'Payment Records Guest-SL': string[] | null;
  'Payment Records SL-Hosts': string[] | null;
  Proposal: string;
  Listing: string;
  Guest: string;
  Host: string;
}

interface ProposalRecord {
  id: string;
  'hc move in date': string | null;
  'Move-out': string | null;
  'rental type': string | null;
  '4 week rent': number | null;
  'hc 4 week rent': number | null;
  'damage deposit': number | null;
  'hc damage deposit': number | null;
  'cleaning fee': number | null;
  'hc cleaning fee': number | null;
  'Reservation Span': string | null;
  'Reservation Span (Weeks)': number | null;
  'week pattern': string | null;
}

interface ListingRecord {
  id: string;
  title: string | null;
  address: string | null;
  description: string | null;
  'type of space': string | null;
  'guests allowed': number | null;
  'host restrictions': string[] | null;
  images: string[] | null;
}

interface UserRecord {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface GuestPaymentRecord {
  'Payment #': number;
  'Scheduled Date': string;
  'Rent': number | null;
  'Maintenance Fee': number | null;
  'Total Paid by Guest': number | null;
  'Damage Deposit': number | null;
}

interface HostPaymentRecord {
  'Payment #': number;
  'Scheduled Date': string;
  'Rent': number | null;
  'Maintenance Fee': number | null;
  'Total Paid to Host': number | null;
}

/**
 * Intermediate structure holding all fetched and formatted data
 * before building document-specific payloads.
 */
export interface FieldsForLeaseDocuments {
  // Identifiers
  agreementNumber: string;
  leaseId: string;

  // People
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hostName: string;
  hostEmail: string;
  hostPhone: string;

  // Listing
  address: string;
  listingTitle: string;
  listingDescription: string;
  typeOfSpace: string;
  guestsAllowed: number;
  hostRestrictions: string[];
  formattedHouseRules: string;
  images: string[];

  // Dates & Duration
  moveInDate: Date;
  moveOutDate: Date;
  formattedMoveInDate: string;
  formattedMoveOutDate: string;
  checkInDay: string;
  checkOutDay: string;
  numberOfWeeks: number;
  rentalType: string;
  weekPattern: string | null;

  // Financial (raw numbers)
  fourWeekRent: number;
  damageDeposit: number;
  maintenanceFee: number;

  // Financial (formatted strings)
  formattedFourWeekRent: string;
  formattedDamageDeposit: string;
  formattedMaintenanceFee: string;

  // Guest Payments
  guestPayments: GuestPaymentRecord[];
  numberOfGuestPayments: number;

  // Host Payments
  hostPayments: HostPaymentRecord[];
  numberOfHostPayments: number;

  // Calculated fields
  firstPaymentTotal: number;
  formattedFirstPaymentTotal: string;
  lastPaymentRent: number;
  formattedLastPaymentRent: string;
  isProrated: boolean;
  penultimateWeekNumber: number;
  lastPaymentWeeks: number;
}

// ================================================
// FORMAT HELPERS
// ================================================

/**
 * Format ISO date to MM/DD/YYYY for document display
 */
function formatDate(isoDate: string | Date | null): string {
  if (!isoDate) return '';
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  if (isNaN(date.getTime())) return '';

  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Get day of week name from date
 */
function getDayOfWeek(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Format number to currency string $X,XXX.XX
 */
function formatCurrency(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format house rules array to bulleted list
 */
function formatHouseRules(rules: string[] | null): string {
  if (!rules || rules.length === 0) {
    return 'No additional restrictions';
  }
  return rules.map((rule) => `• ${rule}`).join('\n');
}

/**
 * Calculate weeks between two dates
 */
function calculateWeeks(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
}

/**
 * Calculate remaining weeks for last payment (prorating)
 */
function calculateLastPaymentWeeks(
  totalWeeks: number,
  numberOfPayments: number,
  rentalType: string
): number {
  if (rentalType === 'Monthly') {
    // For monthly, calculate remaining months as fraction
    return totalWeeks % 4 || 4;
  }

  // For weekly/nightly, calculate remaining weeks in last payment period
  const fullCycles = numberOfPayments - 1;
  const weeksInFullCycles = fullCycles * 4;
  const remainingWeeks = totalWeeks - weeksInFullCycles;

  return remainingWeeks > 0 ? remainingWeeks : 4;
}

// ================================================
// DATA FETCHING
// ================================================

/**
 * Fetch all required data from Supabase and prepare Fields For Lease Documents
 */
export async function fetchFieldsForLeaseDocuments(
  supabase: SupabaseClient,
  leaseId: string
): Promise<FieldsForLeaseDocuments> {
  console.log(`[payloadBuilder] Fetching data for lease: ${leaseId}`);

  // Step 1: Fetch lease record
  const { data: lease, error: leaseError } = await supabase
    .from('bookings_leases')
    .select(
      `
      _id,
      "Agreement Number",
      "Reservation Period : Start",
      "Reservation Period : End",
      "Payment Records Guest-SL",
      "Payment Records SL-Hosts",
      Proposal,
      Listing,
      Guest,
      Host
    `
    )
    .eq('id', leaseId)
    .single();

  if (leaseError) {
    console.error('[payloadBuilder] Lease fetch error:', leaseError);
    throw new Error(`Failed to fetch lease: ${leaseError.message}`);
  }

  const leaseRecord = lease as LeaseRecord;
  console.log(`[payloadBuilder] Lease found: ${leaseRecord['Agreement Number']}`);

  // Step 2: Fetch proposal (financial & scheduling data)
  // CRITICAL: Financial fields are on proposal, NOT lease
  const { data: proposal, error: proposalError } = await supabase
    .from('proposal')
    .select(
      `
      _id,
      "hc move in date",
      "Move-out",
      "rental type",
      "4 week rent",
      "hc 4 week rent",
      "damage deposit",
      "hc damage deposit",
      "cleaning fee",
      "hc cleaning fee",
      "Reservation Span",
      "Reservation Span (Weeks)",
      "week pattern"
    `
    )
    .eq('id', leaseRecord.Proposal)
    .single();

  if (proposalError) {
    console.error('[payloadBuilder] Proposal fetch error:', proposalError);
    throw new Error(`Failed to fetch proposal: ${proposalError.message}`);
  }

  const proposalRecord = proposal as ProposalRecord;
  console.log(`[payloadBuilder] Proposal found: ${proposalRecord.id}`);

  // Step 3: Fetch listing
  const { data: listing, error: listingError } = await supabase
    .from('listing')
    .select(
      `
      _id,
      title,
      address,
      description,
      "type of space",
      "guests allowed",
      "host restrictions",
      images
    `
    )
    .eq('id', leaseRecord.Listing)
    .single();

  if (listingError) {
    console.error('[payloadBuilder] Listing fetch error:', listingError);
    throw new Error(`Failed to fetch listing: ${listingError.message}`);
  }

  const listingRecord = listing as ListingRecord;
  console.log(`[payloadBuilder] Listing found: ${listingRecord.title}`);

  // Step 4: Fetch users (parallel)
  const [guestResult, hostResult] = await Promise.all([
    supabase.from('user').select('id, name, email, phone').eq('id', leaseRecord.Guest).single(),
    supabase.from('user').select('id, name, email, phone').eq('id', leaseRecord.Host).single(),
  ]);

  const guest: UserRecord = guestResult.data || { id: '', name: '', email: '', phone: '' };
  const host: UserRecord = hostResult.data || { id: '', name: '', email: '', phone: '' };

  if (guestResult.error) {
    console.warn('[payloadBuilder] Guest fetch warning:', guestResult.error.message);
  }
  if (hostResult.error) {
    console.warn('[payloadBuilder] Host fetch warning:', hostResult.error.message);
  }

  // Step 5: Fetch payment records (parallel)
  const [guestPaymentsResult, hostPaymentsResult] = await Promise.all([
    supabase
      .from('paymentrecords')
      .select(`"Payment #", "Scheduled Date", "Rent", "Maintenance Fee", "Total Paid by Guest", "Damage Deposit"`)
      .eq('Booking - Reservation', leaseId)
      .eq('Payment from guest?', true)
      .eq('Payment to Host?', false)
      .order('Payment #', { ascending: true })
      .limit(13),
    supabase
      .from('paymentrecords')
      .select(`"Payment #", "Scheduled Date", "Rent", "Maintenance Fee", "Total Paid to Host"`)
      .eq('Booking - Reservation', leaseId)
      .eq('Payment to Host?', true)
      .eq('Payment from guest?', false)
      .order('Payment #', { ascending: true })
      .limit(13),
  ]);

  const guestPayments = (guestPaymentsResult.data || []) as GuestPaymentRecord[];
  const hostPayments = (hostPaymentsResult.data || []) as HostPaymentRecord[];

  console.log(
    `[payloadBuilder] Payment records: ${guestPayments.length} guest, ${hostPayments.length} host`
  );

  // Step 6: Determine values (use hc variants if available)
  const fourWeekRent = proposalRecord['hc 4 week rent'] ?? proposalRecord['4 week rent'] ?? 0;
  const damageDeposit = proposalRecord['hc damage deposit'] ?? proposalRecord['damage deposit'] ?? 0;
  const cleaningFee = proposalRecord['hc cleaning fee'] ?? proposalRecord['cleaning fee'] ?? 0;
  const rentalType = proposalRecord['rental type'] || 'Weekly';
  const reservationSpanWeeks = proposalRecord['Reservation Span (Weeks)'] ?? 0;
  const weekPattern = proposalRecord['week pattern'];

  // Parse dates
  const moveInDate = new Date(proposalRecord['hc move in date'] || '');
  const moveOutDate = new Date(proposalRecord['Move-out'] || '');

  // Calculate derived fields
  const numberOfWeeks = reservationSpanWeeks || calculateWeeks(moveInDate, moveOutDate);
  const firstPayment = guestPayments[0];
  const lastPayment = guestPayments[guestPayments.length - 1];
  const firstPaymentTotal = firstPayment?.['Total Paid by Guest'] ?? 0;
  const lastPaymentRent = lastPayment?.['Rent'] ?? 0;
  const isProrated =
    guestPayments.length > 1 && lastPaymentRent < (firstPayment?.['Rent'] ?? 0);
  const penultimateWeekNumber = Math.max(0, guestPayments.length - 1);
  const lastPaymentWeeks = calculateLastPaymentWeeks(
    numberOfWeeks,
    guestPayments.length,
    rentalType
  );

  // Build result
  const fields: FieldsForLeaseDocuments = {
    // Identifiers
    agreementNumber: leaseRecord['Agreement Number'] || '',
    leaseId: leaseRecord.id,

    // People
    guestName: guest.name || '',
    guestEmail: guest.email || '',
    guestPhone: guest.phone || '',
    hostName: host.name || '',
    hostEmail: host.email || '',
    hostPhone: host.phone || '',

    // Listing
    address: listingRecord.address || '',
    listingTitle: listingRecord.title || '',
    listingDescription: listingRecord.description || '',
    typeOfSpace: listingRecord['type of space'] || '',
    guestsAllowed: listingRecord['guests allowed'] ?? 1,
    hostRestrictions: listingRecord['host restrictions'] || [],
    formattedHouseRules: formatHouseRules(listingRecord['host restrictions']),
    images: listingRecord.images || [],

    // Dates & Duration
    moveInDate,
    moveOutDate,
    formattedMoveInDate: formatDate(moveInDate),
    formattedMoveOutDate: formatDate(moveOutDate),
    checkInDay: getDayOfWeek(moveInDate),
    checkOutDay: getDayOfWeek(moveOutDate),
    numberOfWeeks,
    rentalType,
    weekPattern,

    // Financial (raw)
    fourWeekRent,
    damageDeposit,
    maintenanceFee: cleaningFee,

    // Financial (formatted)
    formattedFourWeekRent: formatCurrency(fourWeekRent),
    formattedDamageDeposit: formatCurrency(damageDeposit),
    formattedMaintenanceFee: formatCurrency(cleaningFee),

    // Guest Payments
    guestPayments,
    numberOfGuestPayments: guestPayments.length,

    // Host Payments
    hostPayments,
    numberOfHostPayments: hostPayments.length,

    // Calculated
    firstPaymentTotal,
    formattedFirstPaymentTotal: formatCurrency(firstPaymentTotal),
    lastPaymentRent,
    formattedLastPaymentRent: formatCurrency(lastPaymentRent),
    isProrated,
    penultimateWeekNumber,
    lastPaymentWeeks,
  };

  console.log('[payloadBuilder] Fields prepared successfully');
  return fields;
}

// ================================================
// PAYLOAD BUILDERS
// ================================================

/**
 * Build Host Payout Schedule Form payload
 */
export function buildHostPayoutPayload(fields: FieldsForLeaseDocuments): HostPayoutPayload {
  const payload: HostPayoutPayload = {
    'Agreement Number': fields.agreementNumber,
    'Host Name': fields.hostName,
    'Host Email': fields.hostEmail,
    'Host Phone': fields.hostPhone,
    'Address': fields.address,
    'Payout Number': `PAY-${fields.agreementNumber}`,
    'Maintenance Fee': fields.formattedMaintenanceFee,
  };

  // Map up to 13 host payments
  fields.hostPayments.forEach((payment, index) => {
    const num = index + 1;
    payload[`Date${num}`] = formatDate(payment['Scheduled Date']);
    payload[`Rent${num}`] = formatCurrency(payment['Rent']);
    payload[`Total${num}`] = formatCurrency(payment['Total Paid to Host']);
  });

  console.log(`[payloadBuilder] Built HostPayoutPayload with ${fields.numberOfHostPayments} payments`);
  return payload;
}

/**
 * Build Supplemental Agreement payload
 */
export function buildSupplementalPayload(fields: FieldsForLeaseDocuments): SupplementalPayload {
  const payload: SupplementalPayload = {
    'Agreement Number': fields.agreementNumber,
    'Check in Date': fields.formattedMoveInDate,
    'Check Out Date': fields.formattedMoveOutDate,
    'Number of weeks': fields.numberOfWeeks.toString(),
    'Guests Allowed': fields.guestsAllowed.toString(),
    'Host Name': fields.hostName,
    'Listing Title': fields.listingTitle,
    'Listing Description': fields.listingDescription,
    'Location': fields.address,
    'Type of Space': fields.typeOfSpace,
    'Space Details': fields.listingDescription,
    'Supplemental Number': `SUP-${fields.agreementNumber}`,
    'image1': fields.images[0] || '',
    'image2': fields.images[1] || '',
    'image3': fields.images[2] || '',
  };

  console.log('[payloadBuilder] Built SupplementalPayload');
  return payload;
}

/**
 * Build Periodic Tenancy Agreement payload
 */
export function buildPeriodicTenancyPayload(fields: FieldsForLeaseDocuments): PeriodicTenancyPayload {
  const payload: PeriodicTenancyPayload = {
    'Agreement Number': fields.agreementNumber,
    'Check in Date': fields.formattedMoveInDate,
    'Check Out Date': fields.formattedMoveOutDate,
    'Check In Day': fields.checkInDay,
    'Check Out Day': fields.checkOutDay,
    'Number of weeks': fields.numberOfWeeks.toString(),
    'Guests Allowed': fields.guestsAllowed.toString(),
    'Host name': fields.hostName, // Note: lowercase 'name'
    'Guest name': fields.guestName, // Note: lowercase 'name'
    'Supplemental Number': `SUP-${fields.agreementNumber}`,
    'Authorization Card Number': `CCA-${fields.agreementNumber}`,
    'Host Payout Schedule Number': `PAY-${fields.agreementNumber}`,
    'Extra Requests on Cancellation Policy': '',
    'Damage Deposit': fields.formattedDamageDeposit,
    'Listing Title': fields.listingTitle,
    'Listing Description': fields.listingDescription,
    'Location': fields.address,
    'Type of Space': fields.typeOfSpace,
    'Space Details': fields.listingDescription,
    'House Rules': fields.formattedHouseRules,
    'image1': fields.images[0] || '',
    'image2': fields.images[1] || '',
    'image3': fields.images[2] || '',
  };

  console.log('[payloadBuilder] Built PeriodicTenancyPayload');
  return payload;
}

/**
 * Build Credit Card Authorization Form payload
 */
export function buildCreditCardAuthPayload(fields: FieldsForLeaseDocuments): CreditCardAuthPayload {
  // Calculate total first payment: Four Week Rent + Maintenance Fee + Damage Deposit
  const totalFirstPayment = fields.fourWeekRent + fields.maintenanceFee + fields.damageDeposit;

  // Calculate total second payment (subsequent payments): Four Week Rent + Maintenance Fee
  const totalSecondPayment = fields.fourWeekRent + fields.maintenanceFee;

  const payload: CreditCardAuthPayload = {
    'Agreement Number': fields.agreementNumber,
    'Host Name': fields.hostName,
    'Guest Name': fields.guestName,
    'Four Week Rent': fields.formattedFourWeekRent,
    'Maintenance Fee': fields.formattedMaintenanceFee,
    'Damage Deposit': fields.formattedDamageDeposit,
    'Splitlease Credit': '$0.00', // Future: fetch from proposal if applicable
    'Last Payment Rent': fields.formattedLastPaymentRent,
    'Weeks Number': fields.numberOfWeeks.toString(),
    'Listing Description': fields.listingDescription,
    'Penultimate Week Number': fields.penultimateWeekNumber.toString(),
    'Number of Payments': fields.numberOfGuestPayments.toString(),
    'Last Payment Weeks': fields.lastPaymentWeeks.toString(),
    'Is Prorated': fields.isProrated,
  };

  console.log(`[payloadBuilder] Built CreditCardAuthPayload (prorated: ${fields.isProrated})`);
  return payload;
}

/**
 * Build all payloads for generate_all action
 */
export function buildGenerateAllPayload(fields: FieldsForLeaseDocuments): GenerateAllPayload {
  return {
    hostPayout: buildHostPayoutPayload(fields),
    supplemental: buildSupplementalPayload(fields),
    periodicTenancy: buildPeriodicTenancyPayload(fields),
    creditCardAuth: buildCreditCardAuthPayload(fields),
  };
}

// ================================================
// MAIN ENTRY POINT
// ================================================

/**
 * Complete workflow: Fetch data and build all payloads for a lease
 *
 * @param supabase - Supabase client
 * @param leaseId - The lease ID to generate documents for
 * @returns GenerateAllPayload ready for edge function call
 */
export async function buildPayloadsForLease(
  supabase: SupabaseClient,
  leaseId: string
): Promise<GenerateAllPayload> {
  console.log(`[payloadBuilder] Starting payload build for lease: ${leaseId}`);

  // Step 1: Fetch and prepare all fields
  const fields = await fetchFieldsForLeaseDocuments(supabase, leaseId);

  // Step 2: Build all payloads
  const payloads = buildGenerateAllPayload(fields);

  console.log('[payloadBuilder] All payloads built successfully');
  return payloads;
}
