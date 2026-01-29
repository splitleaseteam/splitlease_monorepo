/**
 * Split Lease Edge Functions - TypeScript Types
 *
 * Complete type definitions for all Edge Function request/response payloads.
 * Generated from analysis of supabase/functions/ source code.
 */

// ============================================================================
// Common Types
// ============================================================================

/** Standard success response wrapper */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/** Standard error response wrapper */
export interface ErrorResponse {
  success: false;
  error: string;
}

/** Combined response type */
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/** Base request structure for all Edge Functions */
export interface EdgeFunctionRequest<TAction extends string, TPayload = Record<string, unknown>> {
  action: TAction;
  payload: TPayload;
}

// ============================================================================
// Auth User Types
// ============================================================================

export type AuthUserAction =
  | 'login'
  | 'signup'
  | 'logout'
  | 'validate'
  | 'request_password_reset'
  | 'update_password'
  | 'generate_magic_link'
  | 'oauth_signup'
  | 'oauth_login'
  | 'send_magic_link_sms'
  | 'verify_email';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  supabase_user_id: string;
  user_type: 'host' | 'guest' | 'both';
  host_account_id?: string;
  guest_account_id?: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface SignupResponse extends LoginResponse {}

export interface ValidatePayload {
  access_token: string;
}

export interface ValidateResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    user_type: string;
  };
}

export interface RequestPasswordResetPayload {
  email: string;
}

export interface UpdatePasswordPayload {
  access_token: string;
  new_password: string;
}

export interface GenerateMagicLinkPayload {
  email: string;
  redirect_to?: string;
}

export interface GenerateMagicLinkResponse {
  magic_link: string;
  expires_at: string;
}

export interface OAuthSignupPayload {
  provider: 'google' | 'apple' | 'facebook';
  provider_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface OAuthLoginPayload {
  provider: 'google' | 'apple' | 'facebook';
  provider_id: string;
}

export interface SendMagicLinkSmsPayload {
  phone: string;
}

export interface VerifyEmailPayload {
  token: string;
}

// ============================================================================
// Proposal Types
// ============================================================================

export type ProposalAction =
  | 'create'
  | 'update'
  | 'get'
  | 'suggest'
  | 'create_suggested'
  | 'create_mockup'
  | 'get_prefill_data'
  | 'createTestProposal'
  | 'createTestRentalApplication'
  | 'acceptProposal'
  | 'createCounteroffer'
  | 'acceptCounteroffer';

export interface ProposalCreatePayload {
  listing_id: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  selected_days?: number[]; // 0-6 (Sunday-Saturday)
  monthly_rate?: number;
  message?: string;
}

export interface ProposalUpdatePayload {
  proposal_id: string;
  status?: ProposalStatus;
  monthly_rate?: number;
  start_date?: string;
  end_date?: string;
  selected_days?: number[];
}

export interface ProposalGetPayload {
  proposal_id: string;
}

export interface ProposalSuggestPayload {
  guest_id: string;
  type: 'weekly_match' | 'same_address';
}

export interface ProposalCreateSuggestedPayload {
  listing_id: string;
  guest_id: string;
}

export interface ProposalCreateMockupPayload {
  listing_id: string;
}

export interface ProposalGetPrefillDataPayload {
  proposal_id: string;
}

export interface CreateCounterofferPayload {
  proposal_id: string;
  new_rate?: number;
  new_start_date?: string;
  new_end_date?: string;
  new_selected_days?: number[];
}

export type ProposalStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'counteroffer';

export interface Proposal {
  _id: string;
  listing_id: string;
  guest_id: string;
  host_id?: string;
  status: ProposalStatus;
  start_date: string;
  end_date: string;
  selected_days: number[];
  monthly_rate: number;
  service_fee: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Listing Types
// ============================================================================

export type ListingAction = 'create' | 'get' | 'submit' | 'delete';

export interface ListingCreatePayload {
  user_id: string;
  title?: string;
}

export interface ListingGetPayload {
  listing_id: string;
}

export interface ListingSubmitPayload {
  listing_id: string;
  user_email: string;
  title?: string;
  description?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  beds?: number;
  bathrooms?: number;
  monthly_rent?: number;
  amenities?: string[];
  photos?: string[];
  available_days?: number[];
  start_date?: string;
  end_date?: string;
}

export interface ListingDeletePayload {
  listing_id: string;
}

export interface Listing {
  _id: string;
  bubble_id?: string;
  user_id: string;
  title: string;
  description?: string;
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  zip_code: string;
  beds: number;
  bathrooms: number;
  monthly_rent: number;
  amenities?: string[];
  photos?: string[];
  available_days?: number[];
  start_date?: string;
  end_date?: string;
  status: 'draft' | 'pending_review' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Lease Types
// ============================================================================

export type LeaseAction =
  | 'create'
  | 'get'
  | 'generate_dates'
  | 'get_host_leases'
  | 'get_guest_leases';

export interface LeaseCreatePayload {
  proposal_id: string;
}

export interface LeaseGetPayload {
  lease_id: string;
}

export interface LeaseGenerateDatesPayload {
  proposal_id: string;
}

export interface Lease {
  _id: string;
  proposal_id: string;
  listing_id: string;
  host_id: string;
  guest_id: string;
  status: LeaseStatus;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit?: number;
  created_at: string;
  updated_at: string;
}

export type LeaseStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'terminated';

// ============================================================================
// Leases Admin Types
// ============================================================================

export type LeasesAdminAction =
  | 'list'
  | 'get'
  | 'updateStatus'
  | 'softDelete'
  | 'hardDelete'
  | 'bulkUpdateStatus'
  | 'bulkSoftDelete'
  | 'bulkExport'
  | 'uploadDocument'
  | 'deleteDocument'
  | 'listDocuments'
  | 'createPaymentRecord'
  | 'updatePaymentRecord'
  | 'deletePaymentRecord'
  | 'regeneratePaymentRecords'
  | 'createStays'
  | 'clearStays'
  | 'updateBookedDates'
  | 'clearBookedDates'
  | 'cancelLease'
  | 'getDocumentChangeRequests';

export interface LeasesAdminListPayload {
  page?: number;
  per_page?: number;
  status?: LeaseStatus;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export interface LeasesAdminListResponse {
  leases: Lease[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface LeasesAdminUpdateStatusPayload {
  lease_id: string;
  status: LeaseStatus;
}

export interface LeasesAdminBulkUpdatePayload {
  lease_ids: string[];
  status: LeaseStatus;
}

export interface LeasesAdminPaymentRecordPayload {
  lease_id: string;
  amount: number;
  due_date: string;
  type?: 'rent' | 'deposit' | 'fee';
  status?: 'pending' | 'paid' | 'overdue';
}

// ============================================================================
// Messages Types
// ============================================================================

export type MessagesAction =
  | 'send_message'
  | 'get_messages'
  | 'get_threads'
  | 'send_guest_inquiry'
  | 'create_proposal_thread'
  | 'admin_get_all_threads'
  | 'admin_delete_thread'
  | 'admin_send_reminder';

export interface SendMessagePayload {
  thread_id: string;
  content: string;
  sender_id?: string; // Optional for legacy support
}

export interface GetMessagesPayload {
  thread_id: string;
  limit?: number;
  offset?: number;
}

export interface SendGuestInquiryPayload {
  listing_id: string;
  message: string;
  guest_email?: string;
  guest_name?: string;
}

export interface CreateProposalThreadPayload {
  proposal_id: string;
}

export interface Message {
  _id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface MessageThread {
  _id: string;
  listing_id?: string;
  proposal_id?: string;
  host_id: string;
  guest_id: string;
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Message Curation Types
// ============================================================================

export type MessageCurationAction =
  | 'getThreads'
  | 'getThreadMessages'
  | 'getMessage'
  | 'deleteMessage'
  | 'deleteThread'
  | 'forwardMessage'
  | 'sendSplitBotMessage';

export interface GetThreadsPayload {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetThreadMessagesPayload {
  thread_id: string;
}

export interface DeleteMessagePayload {
  message_id: string;
}

export interface DeleteThreadPayload {
  thread_id: string;
}

export interface ForwardMessagePayload {
  message_id: string;
  to_thread_id: string;
}

export interface SendSplitBotMessagePayload {
  thread_id: string;
  content: string;
}

// ============================================================================
// AI Gateway Types
// ============================================================================

export type AIGatewayAction = 'complete' | 'stream';

export interface AIGatewayPayload {
  prompt_key: string;
  variables?: Record<string, unknown>;
}

export interface AICompleteResponse {
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Public prompts that don't require authentication */
export type PublicPromptKey =
  | 'listing-description'
  | 'listing-title'
  | 'neighborhood-description'
  | 'parse-call-transcription'
  | 'echo-test'
  | 'negotiation-summary-suggested'
  | 'negotiation-summary-counteroffer'
  | 'negotiation-summary-host';

// ============================================================================
// Bubble Sync Types
// ============================================================================

export type BubbleSyncAction =
  | 'process_queue'
  | 'process_queue_data_api'
  | 'sync_single'
  | 'retry_failed'
  | 'get_status'
  | 'cleanup'
  | 'build_request'
  | 'sync_signup_atomic';

export interface ProcessQueuePayload {
  batch_size?: number;
}

export interface SyncSinglePayload {
  table: string;
  record_id: string;
}

export interface CleanupPayload {
  older_than_days?: number;
}

export interface BuildRequestPayload {
  table: string;
  record_id: string;
}

export interface SyncStatusResponse {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

// ============================================================================
// Slack Types
// ============================================================================

export type SlackAction = 'faq_inquiry' | 'diagnose';

export interface FaqInquiryPayload {
  name: string;
  email: string;
  inquiry: string;
}

export interface DiagnoseResponse {
  status: 'healthy' | 'unhealthy';
  environment: {
    deno_version: string;
    env_var_count: number;
    slack_env_vars: string[];
    all_env_var_names: string[];
    slack_webhook_acquisition: string;
    slack_webhook_general: string;
    supabase_url: string;
    supabase_anon_key: string;
    supabase_service_role_key: string;
  };
  timestamp: string;
}

// ============================================================================
// Send Email Types
// ============================================================================

export type SendEmailAction = 'send' | 'health';

export interface SendEmailPayload {
  template_id: string;
  to_email: string;
  dynamic_template_data?: Record<string, unknown>;
  from_email?: string;
  from_name?: string;
}

export interface SendEmailResponse {
  message_id: string;
  to: string;
  template_id: string;
  sent_at: string;
}

export interface EmailHealthResponse {
  status: 'healthy' | 'unhealthy (missing secrets)';
  timestamp: string;
  actions: readonly string[];
  secrets: {
    SENDGRID_API_KEY: boolean;
    SENDGRID_EMAIL_ENDPOINT: boolean;
  };
}

/** Public email templates that don't require authentication */
export type PublicEmailTemplateId =
  | '1757433099447x202755280527849400' // Security 2 - Magic Login Link
  | '1560447575939x331870423481483500'; // Basic - Welcome emails

// ============================================================================
// Send SMS Types
// ============================================================================

export type SendSmsAction = 'send' | 'health';

export interface SendSmsPayload {
  to: string; // E.164 format: +15551234567
  from: string; // E.164 format
  body: string;
}

export interface SendSmsResponse {
  message_sid: string;
  to: string;
  from: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  sent_at: string;
}

export interface SmsHealthResponse {
  status: 'healthy' | 'unhealthy (missing secrets)';
  timestamp: string;
  actions: readonly string[];
  secrets: {
    TWILIO_ACCOUNT_SID: boolean;
    TWILIO_AUTH_TOKEN: boolean;
  };
}

/** Public SMS from numbers that don't require authentication */
export type PublicSmsFromNumber = '+14155692985'; // Magic link SMS

// ============================================================================
// Pricing Types
// ============================================================================

export type PricingAction = 'health';

export interface PricingHealthResponse {
  status: 'healthy';
  timestamp: string;
  message: string;
}

// ============================================================================
// Pricing Admin Types
// ============================================================================

export type PricingAdminAction =
  | 'list'
  | 'get'
  | 'updatePrice'
  | 'bulkUpdate'
  | 'setOverride'
  | 'toggleActive'
  | 'getConfig'
  | 'export';

export interface PricingAdminListPayload {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PricingAdminGetPayload {
  listing_id: string;
}

export interface PricingAdminUpdatePricePayload {
  listing_id: string;
  monthly_rent?: number;
  weekly_rate?: number;
  nightly_rate?: number;
}

export interface PricingAdminBulkUpdatePayload {
  listing_ids: string[];
  monthly_rent?: number;
  weekly_rate?: number;
  nightly_rate?: number;
}

export interface PricingAdminSetOverridePayload {
  listing_id: string;
  override_price: number;
  reason?: string;
  expires_at?: string;
}

export interface PricingAdminToggleActivePayload {
  listing_id: string;
  is_active: boolean;
}

export interface PricingAdminExportPayload {
  format: 'csv' | 'json';
}

// ============================================================================
// Magic Login Links Types
// ============================================================================

export type MagicLoginLinksAction =
  | 'list_users'
  | 'get_user_data'
  | 'send_magic_link'
  | 'get_destination_pages';

export interface ListUsersPayload {
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetUserDataPayload {
  user_id: string;
}

export interface SendMagicLinkPayload {
  user_id: string;
  destination?: string;
}

export interface GetDestinationPagesResponse {
  pages: Array<{
    path: string;
    name: string;
    description?: string;
  }>;
}

// ============================================================================
// Quick Match Types
// ============================================================================

export type QuickMatchAction = 'get_proposal' | 'search_candidates' | 'save_choice';

export interface QuickMatchGetProposalPayload {
  proposal_id: string;
}

export interface QuickMatchSearchCandidatesPayload {
  proposal_id: string;
}

export interface QuickMatchSaveChoicePayload {
  proposal_id: string;
  listing_id: string;
}

export interface QuickMatchCandidate {
  listing_id: string;
  score: number;
  match_factors: {
    schedule_overlap: number;
    price_match: number;
    location_match: number;
  };
  listing: Listing;
}

// ============================================================================
// Rental Application Types
// ============================================================================

export type RentalApplicationAction = 'submit' | 'get' | 'upload';

export interface RentalApplicationSubmitPayload {
  user_id: string;
  proposal_id: string;
  employment_status: 'employed' | 'self_employed' | 'unemployed' | 'student' | 'retired';
  annual_income: number;
  employer_name?: string;
  employer_phone?: string;
  move_in_date: string;
  references?: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
}

export interface RentalApplicationGetPayload {
  application_id?: string;
  proposal_id?: string;
}

export interface RentalApplicationUploadPayload {
  application_id: string;
  document_type: 'id' | 'pay_stub' | 'bank_statement' | 'tax_return' | 'other';
  file_url: string;
}

export interface RentalApplication {
  _id: string;
  user_id: string;
  proposal_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'incomplete';
  employment_status: string;
  annual_income: number;
  employer_name?: string;
  documents: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Virtual Meeting Types
// ============================================================================

export type VirtualMeetingAction =
  | 'create'
  | 'delete'
  | 'accept'
  | 'decline'
  | 'send_calendar_invite'
  | 'notify_participants'
  | 'admin_fetch_new_requests'
  | 'admin_fetch_confirmed'
  | 'admin_confirm_meeting'
  | 'admin_update_meeting_dates'
  | 'admin_delete_meeting'
  | 'admin_fetch_blocked_slots'
  | 'admin_block_time_slot'
  | 'admin_unblock_time_slot'
  | 'admin_block_full_day'
  | 'admin_unblock_full_day';

export interface VirtualMeetingCreatePayload {
  listing_id: string;
  guest_id: string;
  preferred_dates: string[]; // ISO date strings
  message?: string;
}

export interface VirtualMeetingAcceptPayload {
  meeting_id: string;
  booked_date: string; // ISO datetime string
}

export interface VirtualMeetingDeclinePayload {
  meeting_id: string;
  reason?: string;
}

export interface VirtualMeetingDeletePayload {
  meeting_id: string;
}

export interface VirtualMeetingNotifyPayload {
  meeting_id: string;
}

export interface AdminBlockTimeSlotPayload {
  date: string; // ISO date
  time_slot: string; // e.g., "10:00"
  reason?: string;
}

export interface AdminBlockFullDayPayload {
  date: string; // ISO date
  reason?: string;
}

export interface VirtualMeeting {
  _id: string;
  listing_id: string;
  host_id: string;
  guest_id: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed';
  preferred_dates: string[];
  booked_date?: string;
  meeting_link?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Workflow Orchestrator Types
// ============================================================================

export interface WorkflowOrchestratorPayload {
  triggered_by?: 'pg_net' | 'pg_cron' | 'manual';
}

export interface WorkflowStep {
  name: string;
  function: string;
  action: string;
  payload_template: Record<string, unknown>;
  on_failure: 'abort' | 'continue' | 'retry';
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  current_step: number;
  steps: WorkflowStep[];
  context: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  error_step?: string;
  retry_count: number;
}

// ============================================================================
// Communications Types (Placeholder)
// ============================================================================

export type CommunicationsAction = 'health';

export interface CommunicationsHealthResponse {
  status: 'healthy';
  timestamp: string;
  message: string;
}

// ============================================================================
// Error Types
// ============================================================================

/** HTTP status codes returned by Edge Functions */
export enum HttpStatusCode {
  OK = 200,
  BadRequest = 400,
  Unauthorized = 401,
  NotFound = 404,
  InternalServerError = 500,
}

/** Error codes from PostgREST */
export enum PostgrestErrorCode {
  ForeignKeyViolation = '23503',
  UniqueViolation = '23505',
}

/** Custom error class names used in Edge Functions */
export type ErrorClassName =
  | 'ValidationError'
  | 'AuthenticationError'
  | 'BubbleApiError'
  | 'SupabaseSyncError'
  | 'OpenAIError';

// ============================================================================
// Type Guards
// ============================================================================

export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return response.success === false;
}
