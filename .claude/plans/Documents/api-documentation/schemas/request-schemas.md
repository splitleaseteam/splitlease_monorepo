# Request Schemas

TypeScript interfaces for all 42 action payloads across Split Lease Edge Functions.

---

## Table of Contents

- [Proposal Function (11 actions)](#proposal-function)
- [Listing Function (4 actions)](#listing-function)
- [Lease Function (5 actions)](#lease-function)
- [Messages Function (9 actions)](#messages-function)
- [Auth User Function (11 actions)](#auth-user-function)
- [AI Gateway Function (2 actions)](#ai-gateway-function)

---

## Universal Request Wrapper

All Edge Functions use this action-based request pattern:

```typescript
interface ActionRequest<A extends string, P> {
  action: A;
  payload: P;
}
```

---

## Proposal Function

### 1. CreateProposalPayload

```typescript
interface CreateProposalPayload {
  listing_id: string;
  guest_user_id?: string;         // Optional if JWT auth

  // Schedule (0-indexed days: 0=Sun, 6=Sat)
  days_selected: number[];        // e.g., [1, 2, 3] for Mon-Wed
  weeks_selected: number[];       // e.g., [1, 2, 3, 4] for all weeks

  // Dates
  proposed_start_date: string;    // ISO date YYYY-MM-DD
  proposed_end_date: string;      // ISO date YYYY-MM-DD

  // Pricing
  guest_price_per_night?: number;
  total_rent?: number;

  // Optional
  special_requests?: string;
  number_of_guests?: number;
}
```

### 2. UpdateProposalPayload

```typescript
interface UpdateProposalPayload {
  proposal_id: string;

  // Status updates
  status?: ProposalStatus;

  // Schedule changes
  days_selected?: number[];
  weeks_selected?: number[];
  proposed_start_date?: string;
  proposed_end_date?: string;

  // Pricing changes
  guest_price_per_night?: number;
  total_rent?: number;
  host_compensation?: number;

  // Counteroffer fields (HC prefix)
  "HC Days Selected"?: number[];
  "HC Weeks Selected"?: number[];
  "HC Start Date"?: string;
  "HC End Date"?: string;
  "HC Price Per Night"?: number;
  "HC Total Rent"?: number;

  // Any additional fields
  [key: string]: unknown;
}

type ProposalStatus =
  | "Pending"
  | "Accepted"
  | "Declined"
  | "Counteroffer"
  | "Expired"
  | "Withdrawn";
```

### 3. GetProposalPayload

```typescript
interface GetProposalPayload {
  proposal_id: string;
}
```

### 4. SuggestProposalPayload

```typescript
interface SuggestProposalPayload {
  listing_id: string;

  // Guest preferences
  preferred_days?: number[];      // Days guest prefers
  preferred_weeks?: number[];     // Weeks guest prefers
  start_date?: string;
  end_date?: string;
  budget_per_night?: number;

  // Optional constraints
  min_nights?: number;
  max_nights?: number;
}
```

### 5. CreateSuggestedProposalPayload

```typescript
interface CreateSuggestedProposalPayload {
  listing_id: string;
  guest_user_id?: string;

  // From AI suggestion
  suggested_days: number[];
  suggested_weeks: number[];
  suggested_start_date: string;
  suggested_end_date: string;
  suggested_price_per_night: number;

  // Optional
  special_requests?: string;
}
```

### 6. CreateMockupPayload

```typescript
interface CreateMockupPayload {
  listing_id: string;

  // Mock schedule
  days_selected: number[];
  weeks_selected: number[];
  start_date: string;
  end_date: string;

  // Mock pricing
  price_per_night: number;
}
```

### 7. GetPrefillDataPayload

```typescript
interface GetPrefillDataPayload {
  listing_id: string;
  guest_user_id?: string;
}
```

### 8. CreateTestProposalPayload

```typescript
interface CreateTestProposalPayload {
  listing_id: string;
  guest_user_id: string;
  host_user_id: string;

  // Test data
  test_scenario?: "basic" | "counteroffer" | "expired";
}
```

### 9. CreateTestRentalApplicationPayload

```typescript
interface CreateTestRentalApplicationPayload {
  proposal_id: string;

  // Applicant info
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;

  // Application data
  employment_status?: string;
  annual_income?: number;
  credit_score_range?: string;
}
```

### 10. AcceptProposalPayload

```typescript
interface AcceptProposalPayload {
  proposal_id: string;

  // Final pricing (used for lease creation)
  four_week_rent: number;
  four_week_compensation: number;
}
```

### 11. CreateCounterofferPayload

```typescript
interface CreateCounterofferPayload {
  proposal_id: string;

  // Host's counteroffer terms
  hc_days_selected: number[];
  hc_weeks_selected: number[];
  hc_start_date: string;
  hc_end_date: string;
  hc_price_per_night: number;
  hc_total_rent: number;
  hc_host_compensation: number;

  // Optional message
  host_message?: string;
}
```

### 12. AcceptCounterofferPayload

```typescript
interface AcceptCounterofferPayload {
  proposal_id: string;

  // Final pricing from counteroffer
  four_week_rent: number;
  four_week_compensation: number;
}
```

---

## Listing Function

### 1. CreateListingPayload

```typescript
interface CreateListingPayload {
  listing_name: string;
  user_email?: string;            // Optional for logged-in users
}
```

### 2. GetListingPayload

```typescript
interface GetListingPayload {
  listing_id: string;
}
```

### 3. SubmitListingPayload

```typescript
interface SubmitListingPayload {
  listing_id: string;
  user_email: string;
  user_unique_id?: string;
  listing_data: ListingData;
}

interface ListingData {
  // Basic Info
  Name: string;
  "Type of Space": "Entire apartment" | "Private room" | "Shared room";
  Bedrooms: number;
  Beds: number;
  Bathrooms: number;
  "Type of Kitchen"?: string;
  "Type of Parking"?: string;

  // Address
  Address?: string;
  "Street Number"?: string;
  Street?: string;
  City: string;
  State: string;
  Zip: string;
  Neighborhood?: string;
  Latitude?: number;
  Longitude?: number;

  // Amenities
  "Amenities Inside Unit"?: string[];
  "Amenities Outside Unit"?: string[];

  // Descriptions
  "Description of Lodging"?: string;
  "Neighborhood Description"?: string;

  // Lease Style (0-indexed days)
  "Rental Type"?: "nightly" | "weekly" | "monthly";
  "Available Nights"?: number[];  // 0-6 for Sun-Sat
  "Weekly Pattern"?: string;

  // Pricing (per night count)
  "Damage Deposit"?: number;
  "Maintenance Fee"?: number;
  "Monthly Compensation"?: number;
  "Weekly Compensation"?: number;
  "Price 1 night selected"?: number;
  "Price 2 nights selected"?: number;
  "Price 3 nights selected"?: number;
  "Price 4 nights selected"?: number;
  "Price 5 nights selected"?: number;
  "Price 6 nights selected"?: number;
  "Price 7 nights selected"?: number;

  // Rules
  "Cancellation Policy"?: string;
  "Preferred Gender"?: string;
  "Number of Guests"?: number;
  "Check-In Time"?: string;
  "Check-Out Time"?: string;
  "Ideal Min Duration"?: number;
  "Ideal Max Duration"?: number;
  "House Rules"?: string[];
  "Blocked Dates"?: string[];     // ISO dates

  // Safety & Review
  "Safety Features"?: string[];
  "Square Footage"?: number;
  "First Day Available"?: string;
  "Previous Reviews Link"?: string;
  "Optional Notes"?: string;

  // Status
  Status?: string;
  "Is Draft"?: boolean;
}
```

### 4. DeleteListingPayload

```typescript
interface DeleteListingPayload {
  listing_id: string;
  user_email?: string;            // Optional for ownership verification
}
```

---

## Lease Function

### 1. CreateLeasePayload

```typescript
interface CreateLeasePayload {
  proposalId: string;

  // Whether from accepted counteroffer
  isCounteroffer: boolean;

  // Final pricing
  fourWeekRent: number;
  fourWeekCompensation: number;
}
```

### 2. GetLeasePayload

```typescript
interface GetLeasePayload {
  leaseId: string;
}
```

### 3. GenerateDatesPayload

```typescript
interface GenerateDatesPayload {
  leaseId?: string;               // Re-generate for existing lease

  // Or provide details for calculation
  start_date?: string;
  end_date?: string;
  days_selected?: number[];
  weeks_selected?: number[];
}
```

### 4. GetHostLeasesPayload

```typescript
interface GetHostLeasesPayload {
  limit?: number;                 // Default: 50
  offset?: number;                // Default: 0
  status?: string;                // Filter by lease status
}
```

### 5. GetGuestLeasesPayload

```typescript
interface GetGuestLeasesPayload {
  limit?: number;                 // Default: 50
  offset?: number;                // Default: 0
  status?: string;                // Filter by lease status
}
```

---

## Messages Function

### 1. SendMessagePayload

```typescript
interface SendMessagePayload {
  // Thread identification
  thread_id?: string;             // Existing thread
  recipient_user_id?: string;     // Required if no thread_id
  listing_id?: string;            // Optional context

  // Message content
  message_body: string;

  // SplitBot options
  splitbot?: boolean;
  call_to_action?: string;
  split_bot_warning?: string;

  // New thread options
  send_welcome_messages?: boolean;
}
```

### 2. GetMessagesPayload

```typescript
interface GetMessagesPayload {
  thread_id: string;
  limit?: number;                 // Default: 50
  offset?: number;                // Default: 0
}
```

### 3. GetThreadsPayload

```typescript
interface GetThreadsPayload {
  limit?: number;                 // Default: 20
  offset?: number;                // Default: 0
  user_id?: string;               // Legacy auth fallback
}
```

### 4. SendGuestInquiryPayload

```typescript
interface SendGuestInquiryPayload {
  guest_name: string;
  guest_email: string;
  listing_id: string;
  message: string;
}
```

### 5. CreateProposalThreadPayload

```typescript
interface CreateProposalThreadPayload {
  proposal_id: string;
  host_user_id: string;
  guest_user_id: string;
  listing_id: string;
  listing_name?: string;
}
```

### 6. SendSplitBotMessagePayload

```typescript
interface SendSplitBotMessagePayload {
  thread_id: string;
  message_body: string;
  call_to_action?: string;
  visible_to_host?: boolean;
  visible_to_guest?: boolean;
  recipient_user_id?: string;
}
```

### 7. AdminGetAllThreadsPayload

```typescript
interface AdminGetAllThreadsPayload {
  limit?: number;                 // Default: 100
  offset?: number;                // Default: 0
  include_deleted?: boolean;      // Default: false
}
```

### 8. AdminDeleteThreadPayload

```typescript
interface AdminDeleteThreadPayload {
  thread_id: string;
}
```

### 9. AdminSendReminderPayload

```typescript
interface AdminSendReminderPayload {
  thread_id: string;
  channel: "email" | "sms" | "both";
  message?: string;               // Custom reminder message
}
```

---

## Auth User Function

### 1. LoginPayload

```typescript
interface LoginPayload {
  email: string;
  password: string;
}
```

### 2. SignupPayload

```typescript
interface SignupPayload {
  email: string;
  password: string;
  retype: string;                 // Must match password

  additionalData?: {
    firstName?: string;
    lastName?: string;
    userType?: "Host" | "Guest";  // Default: Guest
    birthDate?: string;           // ISO date
    phoneNumber?: string;
  };
}
```

### 3. LogoutPayload

```typescript
interface LogoutPayload {
  // Empty - logout is client-side
}
```

### 4. ValidatePayload

```typescript
interface ValidatePayload {
  access_token: string;
}
```

### 5. RequestPasswordResetPayload

```typescript
interface RequestPasswordResetPayload {
  email: string;
}
```

### 6. UpdatePasswordPayload

```typescript
interface UpdatePasswordPayload {
  access_token: string;           // From reset link
  new_password: string;
}
```

### 7. GenerateMagicLinkPayload

```typescript
interface GenerateMagicLinkPayload {
  email: string;
  redirect_to?: string;           // URL after magic link click
}
```

### 8. OAuthSignupPayload

```typescript
interface OAuthSignupPayload {
  provider: "google" | "apple" | "facebook";
  provider_user_id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profile_photo?: string;
}
```

### 9. OAuthLoginPayload

```typescript
interface OAuthLoginPayload {
  provider: "google" | "apple" | "facebook";
  provider_user_id: string;
  email: string;
}
```

### 10. SendMagicLinkSmsPayload

```typescript
interface SendMagicLinkSmsPayload {
  phone_number: string;
  redirect_to?: string;
}
```

### 11. VerifyEmailPayload

```typescript
interface VerifyEmailPayload {
  token: string;
}
```

---

## AI Gateway Function

### 1. CompletePayload

```typescript
interface CompletePayload {
  prompt_key: PromptKey;
  variables?: Record<string, unknown>;
  options?: AIOptions;
}

type PromptKey =
  // Public prompts
  | "listing-description"
  | "listing-title"
  | "neighborhood-description"
  | "parse-call-transcription"
  | "negotiation-summary-suggested"
  | "negotiation-summary-counteroffer"
  | "negotiation-summary-host"
  | "echo-test"
  // Protected prompts (require JWT)
  | "deepfake-script"
  | "narration-script"
  | "jingle-lyrics";

interface AIOptions {
  model?: "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo" | "gpt-3.5-turbo";
  temperature?: number;           // 0-2
  max_tokens?: number;            // 1-4096
}
```

### 2. StreamPayload

```typescript
interface StreamPayload {
  prompt_key: PromptKey;
  variables?: Record<string, unknown>;
  options?: AIOptions;
}
```

---

## Type Exports

For use in frontend code:

```typescript
// Re-export all payload types
export type {
  // Proposal
  CreateProposalPayload,
  UpdateProposalPayload,
  GetProposalPayload,
  SuggestProposalPayload,
  CreateSuggestedProposalPayload,
  CreateMockupPayload,
  GetPrefillDataPayload,
  CreateTestProposalPayload,
  CreateTestRentalApplicationPayload,
  AcceptProposalPayload,
  CreateCounterofferPayload,
  AcceptCounterofferPayload,

  // Listing
  CreateListingPayload,
  GetListingPayload,
  SubmitListingPayload,
  DeleteListingPayload,
  ListingData,

  // Lease
  CreateLeasePayload,
  GetLeasePayload,
  GenerateDatesPayload,
  GetHostLeasesPayload,
  GetGuestLeasesPayload,

  // Messages
  SendMessagePayload,
  GetMessagesPayload,
  GetThreadsPayload,
  SendGuestInquiryPayload,
  CreateProposalThreadPayload,
  SendSplitBotMessagePayload,
  AdminGetAllThreadsPayload,
  AdminDeleteThreadPayload,
  AdminSendReminderPayload,

  // Auth
  LoginPayload,
  SignupPayload,
  LogoutPayload,
  ValidatePayload,
  RequestPasswordResetPayload,
  UpdatePasswordPayload,
  GenerateMagicLinkPayload,
  OAuthSignupPayload,
  OAuthLoginPayload,
  SendMagicLinkSmsPayload,
  VerifyEmailPayload,

  // AI Gateway
  CompletePayload,
  StreamPayload,
  PromptKey,
  AIOptions,
};
```
