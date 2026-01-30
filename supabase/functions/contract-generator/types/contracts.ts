// Contract Generator Type Definitions

export interface ContractRequest {
  action: ContractAction;
  payload: Record<string, unknown>;
}

export type ContractAction =
  | 'generate_credit_card_auth'
  | 'generate_credit_card_auth_nonprorated'
  | 'generate_host_payout'
  | 'generate_periodic_tenancy'
  | 'generate_supplemental'
  | 'list_templates'
  | 'get_template_schema';

export interface ContractResponse {
  success: boolean;
  data?: ContractResult;
  error?: ContractError;
}

export interface ContractResult {
  filename: string;
  downloadUrl: string;
  driveUrl?: string;
  driveFileId?: string;
}

export interface ContractError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'TEMPLATE_LOAD_ERROR'
  | 'DOCUMENT_GENERATION_ERROR'
  | 'DRIVE_UPLOAD_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'UNKNOWN_ACTION'
  | 'INTERNAL_ERROR';

// Credit Card Auth Payload
export interface CreditCardAuthPayload {
  agreementNumber: string;
  hostName: string;
  guestName: string;
  fourWeekRent: string;
  maintenanceFee: string;
  damageDeposit: string;
  splitleaseCredit: string;
  lastPaymentRent: string;
  weeksNumber: string;
  listingDescription: string;
  penultimateWeekNumber: string;
  numberOfPayments: string;
  lastPaymentWeeks: string;
}

// Host Payout Payload
export interface HostPayoutPayload {
  agreementNumber: string;
  hostName: string;
  hostEmail: string;
  hostPhone: string;
  address: string;
  payoutNumber: string;
  maintenanceFee: string;
  periods: PayoutPeriod[];
}

export interface PayoutPeriod {
  date: string;
  rent: string;
  total: string;
}

// Periodic Tenancy Payload
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
  cancellationPolicyRest: string;
  damageDeposit: string;
  listingTitle: string;
  spaceDetails: string;
  listingDescription: string;
  location: string;
  typeOfSpace: string;
  houseRules: string | HouseRule[];
  image1?: string;
  image2?: string;
  image3?: string;
}

export interface HouseRule {
  text: string;
}

// Supplemental Payload
export interface SupplementalPayload {
  agreementNumber: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfWeeks: string;
  guestsAllowed: string;
  hostName: string;
  listingDescription: string;
  listingTitle: string;
  spaceDetails: string;
  location: string;
  typeOfSpace: string;
  supplementalNumber: string;
  image1?: string;
  image2?: string;
  image3?: string;
}

// Template metadata
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  action: ContractAction;
}

// Template schema for form generation
export interface TemplateSchema {
  name: string;
  description: string;
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'textarea' | 'array';
  label: string;
  required: boolean;
  description?: string;
  placeholder?: string;
}
