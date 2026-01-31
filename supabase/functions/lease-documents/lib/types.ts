/**
 * Type definitions for Lease Documents Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * 1:1 compatible with PythonAnywhere API payload format.
 * Uses space-separated keys to match Python's expected input.
 *
 * Document types:
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
// HOST PAYOUT PAYLOAD (Python-compatible)
// ================================================

/**
 * Host Payout Schedule payload matching Python API format.
 * Keys use spaces exactly as Python expects.
 */
export interface HostPayoutPayload {
  'Agreement Number': string;
  'Host Name': string;
  'Host Email': string;
  'Host Phone': string;
  'Address': string;
  'Payout Number': string;
  'Maintenance Fee': string;
  // Payment entries: Date1-13, Rent1-13, Total1-13
  'Date1'?: string;
  'Rent1'?: string;
  'Total1'?: string;
  'Date2'?: string;
  'Rent2'?: string;
  'Total2'?: string;
  'Date3'?: string;
  'Rent3'?: string;
  'Total3'?: string;
  'Date4'?: string;
  'Rent4'?: string;
  'Total4'?: string;
  'Date5'?: string;
  'Rent5'?: string;
  'Total5'?: string;
  'Date6'?: string;
  'Rent6'?: string;
  'Total6'?: string;
  'Date7'?: string;
  'Rent7'?: string;
  'Total7'?: string;
  'Date8'?: string;
  'Rent8'?: string;
  'Total8'?: string;
  'Date9'?: string;
  'Rent9'?: string;
  'Total9'?: string;
  'Date10'?: string;
  'Rent10'?: string;
  'Total10'?: string;
  'Date11'?: string;
  'Rent11'?: string;
  'Total11'?: string;
  'Date12'?: string;
  'Rent12'?: string;
  'Total12'?: string;
  'Date13'?: string;
  'Rent13'?: string;
  'Total13'?: string;
  [key: string]: string | undefined;
}

// ================================================
// SUPPLEMENTAL AGREEMENT PAYLOAD (Python-compatible)
// ================================================

/**
 * Supplemental Agreement payload matching Python API format.
 */
export interface SupplementalPayload {
  'Agreement Number': string;
  'Check in Date': string;
  'Check Out Date': string;
  'Number of weeks': string;
  'Guests Allowed': string;
  'Host Name': string;
  'Listing Title': string;
  'Listing Description': string;
  'Location': string;
  'Type of Space': string;
  'Space Details': string;
  'Supplemental Number': string;
  'image1'?: string; // URL for image
  'image2'?: string;
  'image3'?: string;
  [key: string]: string | undefined;
}

// ================================================
// PERIODIC TENANCY AGREEMENT PAYLOAD (Python-compatible)
// ================================================

/**
 * Periodic Tenancy Agreement payload matching Python API format.
 */
export interface PeriodicTenancyPayload {
  'Agreement Number': string;
  'Check in Date': string;
  'Check Out Date': string;
  'Check In Day': string;
  'Check Out Day': string;
  'Number of weeks': string;
  'Guests Allowed': string;
  'Host name': string; // Note: lowercase 'name' to match Python
  'Guest name': string; // Note: lowercase 'name' to match Python
  'Supplemental Number': string;
  'Authorization Card Number': string;
  'Host Payout Schedule Number': string;
  'Extra Requests on Cancellation Policy'?: string;
  'Damage Deposit': string;
  'Listing Title': string;
  'Listing Description': string;
  'Location': string;
  'Type of Space': string;
  'Space Details': string;
  'House Rules'?: string | string[];
  'image1'?: string; // Base64 encoded image or URL
  'image2'?: string;
  'image3'?: string;
  [key: string]: string | string[] | undefined;
}

// ================================================
// CREDIT CARD AUTHORIZATION PAYLOAD (Python-compatible)
// ================================================

/**
 * Credit Card Authorization payload matching Python API format.
 * Used for both prorated and non-prorated forms.
 */
export interface CreditCardAuthPayload {
  'Agreement Number': string;
  'Host Name': string;
  'Guest Name': string;
  'Four Week Rent': string;
  'Maintenance Fee': string;
  'Damage Deposit': string;
  'Splitlease Credit': string;
  'Last Payment Rent': string;
  'Weeks Number': string;
  'Listing Description': string;
  'Penultimate Week Number': string;
  'Number of Payments': string;
  'Last Payment Weeks': string;
  // Flag to determine which template to use (not in original Python, added for unified endpoint)
  'Is Prorated'?: boolean | string;
  [key: string]: string | boolean | undefined;
}

// ================================================
// GENERATE ALL PAYLOAD
// ================================================

/**
 * Payload for generating all documents at once.
 * Each sub-object uses Python-compatible format.
 */
export interface GenerateAllPayload {
  hostPayout: HostPayoutPayload;
  supplemental: SupplementalPayload;
  periodicTenancy: PeriodicTenancyPayload;
  creditCardAuth: CreditCardAuthPayload;
}

// ================================================
// DOCUMENT RESULT
// ================================================

export interface DocumentResult {
  success: boolean;
  filename?: string;
  driveUrl?: string;
  drive_url?: string; // Python compatibility alias
  web_view_link?: string; // Python compatibility alias
  fileId?: string;
  file_id?: string; // Python compatibility alias
  error?: string;
  returned_error?: 'yes' | 'no';
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
// TEMPLATE DATA TYPES (Internal - matches Python template variables)
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
  image1?: string;
  image2?: string;
  image3?: string;
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
  image1?: string;
  image2?: string;
  image3?: string;
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
