# Response Schemas

TypeScript interfaces for all response structures across Split Lease Edge Functions.

---

## Table of Contents

- [Universal Response Wrapper](#universal-response-wrapper)
- [Proposal Responses](#proposal-responses)
- [Listing Responses](#listing-responses)
- [Lease Responses](#lease-responses)
- [Messages Responses](#messages-responses)
- [Auth User Responses](#auth-user-responses)
- [AI Gateway Responses](#ai-gateway-responses)
- [Error Responses](#error-responses)

---

## Universal Response Wrapper

All Edge Functions return responses in this format:

```typescript
// Success response
interface SuccessResponse<T> {
  success: true;
  data: T;
}

// Error response
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;          // Error code for programmatic handling
  details?: unknown;      // Additional error context
}

// Union type for any response
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

---

## Proposal Responses

### CreateProposalResponse

```typescript
interface CreateProposalResponse {
  proposal_id: string;
  bubble_id: string;              // Same as proposal_id
  status: "Pending";
  created_at: string;             // ISO timestamp
  listing_id: string;
  guest_user_id: string;
  host_user_id: string;

  // Schedule
  days_selected: number[];
  weeks_selected: number[];
  proposed_start_date: string;
  proposed_end_date: string;

  // Pricing
  guest_price_per_night: number;
  total_rent: number;
  host_compensation: number;
  nights_count: number;
}
```

### UpdateProposalResponse

```typescript
interface UpdateProposalResponse {
  proposal_id: string;
  updated_fields: string[];
  status: ProposalStatus;
  modified_at: string;
}
```

### GetProposalResponse

```typescript
interface GetProposalResponse {
  // Core identifiers
  _id: string;
  "Created Date": string;
  "Modified Date": string;

  // Participants
  "Guest User": string;
  "Host User": string;
  Listing: string;

  // Status
  Status: ProposalStatus;

  // Schedule (0-indexed)
  "Days Selected": number[];
  "Weeks Selected": number[];
  "Proposed Start Date": string;
  "Proposed End Date": string;

  // Original pricing
  "Guest Price Per Night": number;
  "Total Rent": number;
  "Host Compensation": number;
  "Number of Nights": number;

  // Counteroffer fields (if applicable)
  "HC Days Selected"?: number[];
  "HC Weeks Selected"?: number[];
  "HC Start Date"?: string;
  "HC End Date"?: string;
  "HC Price Per Night"?: number;
  "HC Total Rent"?: number;
  "HC Host Compensation"?: number;

  // Metadata
  "Special Requests"?: string;
  "Number of Guests"?: number;

  // Joined data
  listing?: ListingData;
  guest?: UserData;
  host?: UserData;
}
```

### SuggestProposalResponse

```typescript
interface SuggestProposalResponse {
  suggestions: ProposalSuggestion[];
  listing_id: string;
  calculated_at: string;
}

interface ProposalSuggestion {
  score: number;                  // Match quality (0-100)
  days: number[];
  weeks: number[];
  start_date: string;
  end_date: string;
  price_per_night: number;
  total_rent: number;
  nights_count: number;
  reason: string;                 // AI-generated explanation
}
```

### AcceptProposalResponse

```typescript
interface AcceptProposalResponse {
  proposal_id: string;
  lease_id: string;
  status: "Accepted";
  accepted_at: string;
  lease_creation_started: boolean;
}
```

### CreateCounterofferResponse

```typescript
interface CreateCounterofferResponse {
  proposal_id: string;
  status: "Counteroffer";
  counteroffer_created_at: string;

  // Counteroffer details
  hc_days_selected: number[];
  hc_weeks_selected: number[];
  hc_start_date: string;
  hc_end_date: string;
  hc_price_per_night: number;
  hc_total_rent: number;
}
```

---

## Listing Responses

### CreateListingResponse

```typescript
interface CreateListingResponse {
  _id: string;
  listing_id: string;             // Same as _id
  Name: string;
  Status: "Draft";
  Active: boolean;
  "Host User"?: string;
  "Created Date": string;
  "Modified Date": string;
}
```

### GetListingResponse

```typescript
interface GetListingResponse {
  // Identifiers
  _id: string;
  "Created Date": string;
  "Modified Date": string;

  // Basic Info
  Name: string;
  "Type of Space": string;
  Bedrooms: number;
  Beds: number;
  Bathrooms: number;

  // Location
  Address?: string;
  City: string;
  State: string;
  Zip: string;
  Neighborhood?: string;
  Latitude?: number;
  Longitude?: number;

  // Media
  Photos?: string[];
  "Cover Photo"?: string;

  // Pricing
  "Price 1 night selected"?: number;
  "Price 2 nights selected"?: number;
  "Price 3 nights selected"?: number;
  "Price 4 nights selected"?: number;
  "Price 5 nights selected"?: number;
  "Price 6 nights selected"?: number;
  "Price 7 nights selected"?: number;
  "Damage Deposit"?: number;

  // Schedule
  "Available Nights"?: number[];
  "Blocked Dates"?: string[];
  "First Day Available"?: string;

  // Host
  "Host User": string;
  host?: UserData;

  // Status
  Status: string;
  Active: boolean;
  "Is Draft"?: boolean;

  // All other fields
  [key: string]: unknown;
}
```

### SubmitListingResponse

```typescript
interface SubmitListingResponse {
  _id: string;
  listing_id: string;
  status: string;
  name: string;
  message: string;                // Success message
  submitted_at: string;
  validation_passed: boolean;
}
```

### DeleteListingResponse

```typescript
interface DeleteListingResponse {
  deleted: true;
  listing_id: string;
  deletedAt: string;
}
```

---

## Lease Responses

### CreateLeaseResponse

```typescript
interface CreateLeaseResponse {
  leaseId: string;
  agreementNumber: string;        // YYYYMMDD-XXXX format

  // Creation stats
  staysCreated: number;
  guestPaymentRecordsCreated: number;
  hostPaymentRecordsCreated: number;

  // Magic links
  magicLinks: {
    host: string;
    guest: string;
  };

  // Document generation
  documentsGenerated: boolean;
}
```

### GetLeaseResponse

```typescript
interface GetLeaseResponse {
  lease: LeaseRecord;
  proposal: ProposalRecord;
  listing: ListingRecord;
  guest: UserData;
  host: UserData;
  stays: StayRecord[];
  paymentRecords: {
    guest: PaymentRecord[];
    host: PaymentRecord[];
  };
}

interface LeaseRecord {
  _id: string;
  "Agreement Number": string;
  "Created Date": string;

  // Participants
  "Guest User": string;
  "Host User": string;
  Listing: string;
  Proposal: string;

  // Dates
  "Start Date": string;
  "End Date": string;

  // Schedule
  "Days Selected": number[];
  "Weeks Selected": number[];

  // Pricing
  "Total Rent": number;
  "Host Compensation": number;
  "Damage Deposit": number;

  // Status
  Status: string;
  Active: boolean;
}

interface StayRecord {
  _id: string;
  Lease: string;
  "Check-In Date": string;
  "Check-Out Date": string;
  "Night Dates": string[];
  Status: string;
}

interface PaymentRecord {
  _id: string;
  Lease: string;
  Amount: number;
  "Due Date": string;
  "Payment Type": "Guest" | "Host";
  Status: "Pending" | "Paid" | "Overdue";
  "Stripe Payment Intent"?: string;
}
```

### GetLeasesListResponse

```typescript
interface GetLeasesListResponse {
  leases: LeaseSummary[];
  total: number;
  limit: number;
  offset: number;
}

interface LeaseSummary {
  _id: string;
  "Agreement Number": string;
  "Start Date": string;
  "End Date": string;
  "Total Rent": number;
  Status: string;
  listing_name: string;
  counterpart_name: string;       // Host or guest name
}
```

---

## Messages Responses

### SendMessageResponse

```typescript
interface SendMessageResponse {
  success: true;
  message_id: string;
  thread_id: string;
  is_new_thread: boolean;
  timestamp: string;
  welcome_messages_sent?: boolean;
}
```

### GetMessagesResponse

```typescript
interface GetMessagesResponse {
  messages: Message[];
  thread: ThreadMetadata;
  total: number;
}

interface Message {
  _id: string;
  thread_id: string;
  sender_user_id: string;
  message_body: string;
  is_splitbot: boolean;
  call_to_action?: string;
  visible_to_host: boolean;
  visible_to_guest: boolean;
  created_at: string;

  // Joined sender data
  sender?: {
    _id: string;
    "Name - Full": string;
    "Profile Photo"?: string;
  };
}

interface ThreadMetadata {
  _id: string;
  host_user_id: string;
  guest_user_id: string;
  listing_id?: string;
  proposal_id?: string;
  subject?: string;
  created_at: string;
}
```

### GetThreadsResponse

```typescript
interface GetThreadsResponse {
  threads: Thread[];
  total: number;
}

interface Thread {
  _id: string;
  host_user_id: string;
  guest_user_id: string;
  listing_id?: string;
  proposal_id?: string;
  subject?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  created_at: string;

  // Joined data
  host?: UserData;
  guest?: UserData;
  listing?: {
    _id: string;
    Name: string;
    "Cover Photo"?: string;
  };
}
```

### SendGuestInquiryResponse

```typescript
interface SendGuestInquiryResponse {
  success: true;
  thread_id: string;
  message_id: string;
  inquiry_logged: boolean;
}
```

### AdminGetAllThreadsResponse

```typescript
interface AdminGetAllThreadsResponse {
  threads: AdminThread[];
  total: number;
}

interface AdminThread extends Thread {
  is_deleted: boolean;
  deleted_at?: string;
  message_count: number;
  last_activity_by: string;
}
```

---

## Auth User Responses

### LoginResponse

```typescript
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;             // Seconds

  // User identifiers
  user_id: string;                // Bubble-style ID
  supabase_user_id: string;       // UUID
  host_account_id: string;        // Legacy (same as user_id)

  // User info
  user_type: "Host" | "Guest";
  email: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
}
```

### SignupResponse

```typescript
interface SignupResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;

  // Generated identifiers
  user_id: string;
  host_account_id: string;
  supabase_user_id: string;
  user_type: "Host" | "Guest";
}
```

### ValidateResponse

```typescript
interface ValidateResponse {
  valid: boolean;
  user_id: string;
  email: string;
  user_type: "Host" | "Guest";
  expires_at: string;             // ISO timestamp
}
```

### PasswordResetResponse

```typescript
interface PasswordResetResponse {
  message: string;
  // Always returns generic success to prevent email enumeration
  // "If an account exists with this email, a password reset link has been sent."
}
```

### MagicLinkResponse

```typescript
interface MagicLinkResponse {
  magic_link: string;
  expires_at: string;
}
```

### OAuthResponse

```typescript
interface OAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
  supabase_user_id: string;
  user_type: "Host" | "Guest";
  is_new_user: boolean;
}
```

---

## AI Gateway Responses

### CompleteResponse

```typescript
interface CompleteResponse {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### StreamResponse

Streaming responses use Server-Sent Events (SSE):

```typescript
// Each SSE event contains:
interface StreamChunk {
  content: string;                // Partial text
  done: boolean;
}

// Final event includes:
interface StreamComplete {
  content: string;                // Full accumulated text
  done: true;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

---

## Error Responses

### Standard Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: ErrorCode;
  details?: unknown;
}

type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_REQUIRED"
  | "AUTHORIZATION_FAILED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "BUBBLE_API_ERROR"
  | "SUPABASE_ERROR"
  | "OPENAI_ERROR";
```

### HTTP Status Code Mapping

```typescript
const STATUS_CODES: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  AUTHENTICATION_REQUIRED: 401,
  AUTHORIZATION_FAILED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  BUBBLE_API_ERROR: 502,
  SUPABASE_ERROR: 503,
  OPENAI_ERROR: 503,
};
```

### Error Examples

```typescript
// Validation error
{
  success: false,
  error: "Missing required field: listing_id",
  code: "VALIDATION_ERROR",
  details: {
    field: "listing_id",
    constraint: "required"
  }
}

// Authentication error
{
  success: false,
  error: "Invalid or expired token",
  code: "AUTHENTICATION_REQUIRED"
}

// Not found error
{
  success: false,
  error: "Proposal not found",
  code: "NOT_FOUND",
  details: {
    resource: "proposal",
    id: "1234567890123x0987654321"
  }
}

// Bubble API error
{
  success: false,
  error: "Bubble API returned 503",
  code: "BUBBLE_API_ERROR",
  details: {
    status: 503,
    message: "Service temporarily unavailable"
  }
}
```

---

## Shared Types

### UserData

```typescript
interface UserData {
  _id: string;
  "Name - Full": string;
  "Name - First"?: string;
  "Name - Last"?: string;
  Email: string;
  "Profile Photo"?: string;
  "User Type": "Host" | "Guest";
  "Phone Number"?: string;
  "Created Date": string;
}
```

### PaginatedResponse

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}
```

---

## Type Exports

```typescript
export type {
  // Universal
  SuccessResponse,
  ErrorResponse,
  ApiResponse,
  ErrorCode,

  // Proposal
  CreateProposalResponse,
  UpdateProposalResponse,
  GetProposalResponse,
  SuggestProposalResponse,
  ProposalSuggestion,
  AcceptProposalResponse,
  CreateCounterofferResponse,

  // Listing
  CreateListingResponse,
  GetListingResponse,
  SubmitListingResponse,
  DeleteListingResponse,

  // Lease
  CreateLeaseResponse,
  GetLeaseResponse,
  GetLeasesListResponse,
  LeaseRecord,
  StayRecord,
  PaymentRecord,
  LeaseSummary,

  // Messages
  SendMessageResponse,
  GetMessagesResponse,
  GetThreadsResponse,
  SendGuestInquiryResponse,
  AdminGetAllThreadsResponse,
  Message,
  Thread,
  ThreadMetadata,

  // Auth
  LoginResponse,
  SignupResponse,
  ValidateResponse,
  PasswordResetResponse,
  MagicLinkResponse,
  OAuthResponse,

  // AI Gateway
  CompleteResponse,
  StreamChunk,
  StreamComplete,

  // Shared
  UserData,
  PaginatedResponse,
};
```
