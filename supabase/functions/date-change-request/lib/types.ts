/**
 * Date Change Request Types
 * Split Lease - Supabase Edge Functions
 */

// ─────────────────────────────────────────────────────────────
// Request Types
// ─────────────────────────────────────────────────────────────

export type RequestType = 'adding' | 'removing' | 'swapping';

export type RequestStatus =
  | 'waiting_for_answer'
  | 'Approved'
  | 'Rejected'
  | 'expired'
  | 'cancelled';

// ─────────────────────────────────────────────────────────────
// Input Types (from API requests)
// ─────────────────────────────────────────────────────────────

export interface CreateDateChangeRequestInput {
  leaseId: string;
  typeOfRequest: RequestType;
  dateAdded?: string | null;
  dateRemoved?: string | null;
  message?: string;
  priceRate?: number;
  percentageOfRegular?: number;
  requestedById: string;
  receiverId: string;
}

export interface GetDateChangeRequestsInput {
  leaseId: string;
}

export interface AcceptRequestInput {
  requestId: string;
  message?: string;
}

export interface DeclineRequestInput {
  requestId: string;
  reason?: string;
}

export interface CancelRequestInput {
  requestId: string;
}

export interface GetThrottleStatusInput {
  userId: string;
  leaseId?: string; // Optional: for enhanced throttle status with lease-specific data
}

export interface ApplyHardBlockInput {
  leaseId: string;
  userId: string;
}

export interface UpdateWarningPreferenceInput {
  leaseId: string;
  userId: string;
  dontShowAgain: boolean;
}

export interface RestoreThrottleAbilityInput {
  leaseId: string;
  userRole: 'host' | 'guest';
}

// ─────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────

export interface CreateDateChangeRequestResponse {
  requestId: string;
  leaseId: string;
  createdAt: string;
}

export interface GetDateChangeRequestsResponse {
  requests: DateChangeRequestData[];
}

export interface AcceptRequestResponse {
  requestId: string;
  status: RequestStatus;
  answeredAt: string;
}

export interface DeclineRequestResponse {
  requestId: string;
  status: RequestStatus;
  answeredAt: string;
}

export interface CancelRequestResponse {
  requestId: string;
  status: RequestStatus;
}

export interface ThrottleStatusResponse {
  requestCount: number;
  limit: number;
  isThrottled: boolean;
  windowResetTime: string;
}

// Enhanced throttle status response (with lease-specific throttle fields)
export interface EnhancedThrottleStatusResponse {
  pendingRequestCount: number;
  throttleLevel: ThrottleLevel;
  isBlocked: boolean;
  showWarning: boolean;
  otherParticipantName: string;
  blockedUntil: string | null;
  // Legacy fields for backward compatibility
  requestCount: number;
  limit: number;
  isThrottled: boolean;
  windowResetTime: string;
}

export interface ApplyHardBlockResponse {
  success: boolean;
  blockedAt: string;
}

export interface UpdateWarningPreferenceResponse {
  success: boolean;
}

export interface RestoreThrottleAbilityResponse {
  success: boolean;
  restoredAt: string;
}

// ─────────────────────────────────────────────────────────────
// Database Types
// ─────────────────────────────────────────────────────────────

export interface DateChangeRequestData {
  _id: string;
  'Lease': string | null;
  'Requested by': string | null;
  'Request receiver': string | null;
  'type of request': RequestType;
  'date added': string | null;
  'date removed': string | null;
  'Message from Requested by': string | null;
  'Price/Rate of the night': number | null;
  '%compared to regular nightly price': number | null;
  'request status': RequestStatus;
  'expiration date': string | null;
  'visible to the guest?': boolean;
  'visible to the host?': boolean;
  'Created Date': string;
  'Created By': string | null;
  'Modified Date': string;
  'answer date': string | null;
  'Answer to Request': string | null;
  'Stay Associated 1': string | null;
  'Stay Associated 2': string | null;
  'LIST of NEW Dates in the stay': string[] | null;
  'LIST of OLD Dates in the stay': string[] | null;
  pending: boolean;
}

export interface LeaseData {
  _id: string;
  'Agreement Number': string | null;
  'Guest': string | null;
  'Host': string | null;
  'Listing': string | null;
  'Reservation Period : Start': string | null;
  'Reservation Period : End': string | null;
  'List of Booked Dates': string[] | null;
  'Date Change Requests': string[] | null;
  'Lease Status': string | null;
  // Throttling fields (synced from Bubble)
  'Throttling - guest ability to create requests?': boolean | null;
  'Throttling - host ability to create requests?': boolean | null;
  'Throttling - guest NOT show warning popup': boolean | null;
  'Throttling - host NOT show warning popup': boolean | null;
}

export interface UserData {
  _id: string;
  email: string | null;
  'Name - First': string | null;
  'Name - Full': string | null;
}

// ─────────────────────────────────────────────────────────────
// User Context (from authentication)
// ─────────────────────────────────────────────────────────────

export interface UserContext {
  id: string;
  email: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

// Throttling thresholds (two-tier system)
export const SOFT_WARNING_THRESHOLD = 5;  // Show warning popup at 5+ pending requests
export const HARD_BLOCK_THRESHOLD = 10;   // Block ability at 10+ pending requests
export const THROTTLE_WINDOW_HOURS = 24;
export const EXPIRATION_HOURS = 48;

// Legacy alias for backward compatibility
export const THROTTLE_LIMIT = SOFT_WARNING_THRESHOLD;

// Throttle level type
export type ThrottleLevel = 'none' | 'soft_warning' | 'hard_block';

// ─────────────────────────────────────────────────────────────
// Notification Types
// ─────────────────────────────────────────────────────────────

export type NotificationEvent = 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRING_SOON';

export interface NotificationRecipient {
  userId: string;
  email: string | null;
  firstName: string | null;
  phone: string | null;
  notificationPreferences: {
    email_notifications?: boolean;
    sms_notifications?: boolean;
  } | null;
  role: 'guest' | 'host';
}

export interface NotificationContext {
  event: NotificationEvent;
  requestId: string;
  requestType: RequestType;
  leaseId: string;
  agreementNumber: string | null;
  dateAdded: string | null;
  dateRemoved: string | null;
  priceRate: number | null;
  requestedBy: NotificationRecipient;
  receiver: NotificationRecipient;
  message: string | null;
  answerMessage: string | null;
}

export interface NotificationContent {
  subject: string;
  emailBody: string;
  smsBody: string;
  inAppMessage: string;
  ctaButtonText: string;
  ctaUrl: string;
}

export interface DateChangeNotificationParams {
  event: NotificationEvent;
  requestId: string;
  requestType: RequestType;
  leaseId: string;
  dateAdded: string | null;
  dateRemoved: string | null;
  priceRate: number | null;
  requestedById: string;
  receiverId: string;
  message: string | null;
  answerMessage: string | null;
}

// ─────────────────────────────────────────────────────────────
// Email Template Types
// ─────────────────────────────────────────────────────────────

/**
 * Email template variables matching SendGrid template format
 * These variables will be substituted into the SendGrid JSON template
 */
export interface EmailTemplateVariables {
  // Recipient info
  first_name?: string;
  to_email?: string;
  to_name?: string;

  // Email structure
  subject?: string;
  from_email?: string;
  from_name?: string;

  // Email content sections
  preheadertext?: string;  // Warning label for expiry/decline notices
  title?: string;
  bodytext?: string;  // Main body content (can include HTML <br> for paragraphs)

  // Banner text (up to 5 banner fields)
  bannertext1?: string;
  bannertext2?: string;
  bannertext3?: string;
  bannertext4?: string;
  bannertext5?: string;

  // Call-to-action
  buttontext?: string;
  buttonurl?: string;

  // Footer
  footermessage?: string;

  // Date change specific variables
  guest_name?: string;
  host_name?: string;
  property_display?: string;
  original_dates?: string;
  proposed_dates?: string;
  dates_to_add?: string;
  dates_to_remove?: string;
  date_to_add?: string;
  date_to_remove?: string;
  price_adjustment?: string;
  additional_cost?: string;
  refund_amount?: string;
  booking_reduction?: string;
  final_cost?: string;
  you_saved?: string;
  time_to_expiry?: string;

  // Optional message from host/guest
  host_message?: string;
  guest_message?: string;
}

/**
 * Listing data for email template generation
 */
export interface ListingData {
  _id: string;
  Title?: string | null;
  'Display Name'?: string | null;
  'Display Address'?: string | null;
  Address?: string | null;
  'Address Line 1'?: string | null;
  City?: string | null;
  State?: string | null;
  'Zip Code'?: string | null;
}

/**
 * Full email context with all data needed for template generation
 */
export interface EmailNotificationContext extends NotificationContext {
  leaseData: {
    checkIn: string | null;
    checkOut: string | null;
    agreementNumber: string | null;
  };
  listingData: ListingData | null;
  percentageOfRegular: number | null;
}
