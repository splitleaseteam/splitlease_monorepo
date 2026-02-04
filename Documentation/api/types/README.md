# TypeScript Type Definitions

Complete TypeScript type definitions for the Split Lease API, including all request/response types, database models, and shared types.

---

## Overview

This document provides comprehensive TypeScript definitions for all API endpoints, database models, and shared types used throughout the Split Lease platform.

**Usage**:
```typescript
import type {
  EdgeFunctionRequest,
  EdgeFunctionResponse,
  Proposal,
  Listing,
  User
} from '@splitlease/types';
```

---

## Core Types

### EdgeFunctionRequest

Standard request format for all Edge Functions.

```typescript
interface EdgeFunctionRequest {
  action: string;
  payload: Record<string, any>;
}
```

**Example**:
```typescript
const request: EdgeFunctionRequest = {
  action: 'create',
  payload: {
    listingId: 'listing_123',
    checkInDate: '2026-02-01',
    checkOutDate: '2026-02-28'
  }
};
```

---

### EdgeFunctionResponse

Standard response format for all Edge Functions.

```typescript
interface EdgeFunctionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**Example**:
```typescript
const response: EdgeFunctionResponse<Proposal> = {
  success: true,
  data: {
    _id: 'prop_abc123',
    listingId: 'listing_123',
    status: 'pending',
    // ... other proposal fields
  }
};
```

---

## User Types

### User

Core user profile type.

```typescript
interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  userType: 'Host' | 'Guest';
  profilePhoto?: string;
  phoneNumber?: string;
  birthDate?: string; // ISO date string
  aboutMe?: string;
  needForSpace?: string;
  specialNeeds?: string;
  isUsabilityTester?: boolean;
  hasSubmittedRentalApp?: boolean;

  // Identity verification
  identityDocumentType?: string;
  selfieUrl?: string;
  frontIdUrl?: string;
  backIdUrl?: string;
  identityVerified?: boolean;
  identitySubmittedAt?: string; // ISO datetime
  identityVerifiedAt?: string; // ISO datetime

  // Timestamps
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime

  // Bubble sync
  bubbleId?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  bubbleSyncError?: string;
}
```

---

### AuthResponse

Authentication response type.

```typescript
interface AuthResponse {
  success: boolean;
  userId?: string;
  token?: string;
  expires?: number;
  error?: string;
  reason?: string;

  // Supabase Auth fields
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  supabaseUserId?: string;
  userType?: 'Host' | 'Guest';
  hostAccountId?: string;
  guestAccountId?: string;
}
```

---

## Listing Types

### Listing

Property listing type.

```typescript
interface Listing {
  _id: string;
  hostAccountId: string;
  title?: string;
  description?: string;
  buildingName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  boroughId?: string;
  neighborhoodId?: string;
  latitude?: number;
  longitude?: number;
  pricingListId?: string;

  // Pricing
  baseNightlyRate?: number;
  baseWeeklyRate?: number;
  baseFourWeekRate?: number;

  // Availability
  availableDays?: number[]; // 0-6 (Sun-Sat)
  blockedDates?: string[]; // ISO date strings
  amenities?: string[];
  photos?: string[];
  status?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Bubble sync
  bubbleId?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  bubbleSyncError?: string;
}
```

---

### ListingCreateRequest

Request type for creating a listing.

```typescript
interface ListingCreateRequest {
  title?: string;
  description?: string;
  buildingName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  boroughId?: string;
  neighborhoodId?: string;
  latitude?: number;
  longitude?: number;
  baseNightlyRate?: number;
  baseWeeklyRate?: number;
  baseFourWeekRate?: number;
  availableDays?: number[];
  blockedDates?: string[];
  amenities?: string[];
  photos?: string[];
}
```

---

## Proposal Types

### Proposal

Booking proposal type.

```typescript
interface Proposal {
  _id: string;
  listingId: string;
  guestAccountId: string;
  hostAccountId: string;
  checkInDate: string; // ISO date string
  checkOutDate: string; // ISO date string
  selectedDays: number[]; // 0-6 (Sun-Sat)

  // Pricing
  nightlyRate: number;
  weeklyRate?: number;
  fourWeekRate?: number;
  totalRent: number;
  serviceFee: number;
  total: number;

  // Status
  status: ProposalStatus;

  // Messages
  guestMessage?: string;
  hostMessage?: string;

  // Related entities
  rentalApplicationId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Bubble sync
  bubbleId?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  bubbleSyncError?: string;
}
```

---

### ProposalStatus

Proposal status enumeration.

```typescript
type ProposalStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'counteroffered';
```

---

### ProposalCreateRequest

Request type for creating a proposal.

```typescript
interface ProposalCreateRequest {
  listingId: string;
  checkInDate: string;
  checkOutDate: string;
  selectedDays: number[];
  guestMessage?: string;
  rentalApplicationId?: string;
}
```

---

### ProposalUpdateRequest

Request type for updating a proposal.

```typescript
interface ProposalUpdateRequest {
  proposalId: string;
  status?: ProposalStatus;
  guestMessage?: string;
  hostMessage?: string;
  counterofferData?: CounterofferData;
}
```

---

### CounterofferData

Counteroffer data type.

```typescript
interface CounterofferData {
  checkInDate?: string;
  checkOutDate?: string;
  selectedDays?: number[];
  nightlyRate?: number;
  totalRent?: number;
  serviceFee?: number;
  total?: number;
  message?: string;
}
```

---

## Rental Application Types

### RentalApplication

Rental application type.

```typescript
interface RentalApplication {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  aboutMe?: string;
  needForSpace?: string;
  specialNeeds?: string;
  profilePhoto?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;

  // Bubble sync
  bubbleId?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  bubbleSyncError?: string;
}
```

---

### RentalApplicationRequest

Request type for submitting a rental application.

```typescript
interface RentalApplicationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  aboutMe?: string;
  needForSpace?: string;
  specialNeeds?: string;
  profilePhoto?: string;
}
```

---

## Review Types

### Review

Review type for host/guest reviews.

```typescript
interface Review {
  _id: string;
  stayId: string;
  leaseId?: string;
  reviewerId: string;
  revieweeId: string;
  listingId?: string;
  reviewType: 'host_reviews_guest' | 'guest_reviews_host';
  comment?: string;
  overallRating?: number; // 1-5
  wouldRecommend?: boolean;
  status: 'draft' | 'published' | 'hidden';
  createdAt: string;
  updatedAt: string;

  // Rating details
  ratingDetails?: ReviewRatingDetail[];

  // Bubble sync
  bubbleId?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  bubbleSyncError?: string;
}
```

---

### ReviewRatingDetail

Individual rating category type.

```typescript
interface ReviewRatingDetail {
  _id: string;
  reviewId: string;
  category: string;
  categoryLabel: string;
  rating: number; // 1-5
  createdAt: string;
}
```

---

### ReviewCreateRequest

Request type for creating a review.

```typescript
interface ReviewCreateRequest {
  stayId: string;
  reviewType: 'host_reviews_guest' | 'guest_reviews_host';
  comment?: string;
  overallRating?: number;
  wouldRecommend?: boolean;
  ratingDetails?: {
    category: string;
    categoryLabel: string;
    rating: number;
  }[];
}
```

---

## Message Types

### Message

Real-time message type.

```typescript
interface Message {
  id: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  proposalId?: string;
  message: string;
  readAt?: string;
  createdAt: string;
}
```

---

### MessageCreateRequest

Request type for sending a message.

```typescript
interface MessageCreateRequest {
  recipientId: string;
  proposalId?: string;
  message: string;
}
```

---

## Booking & Lease Types

### Stay

Stay record type.

```typescript
interface Stay {
  _id: string;
  proposalId: string;
  leaseId?: string;
  guestId: string;
  hostId: string;
  listingId: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  reviewByHostId?: string;
  reviewByGuestId?: string;
  reviewByHostSubmittedAt?: string;
  reviewByGuestSubmittedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### Lease

Lease agreement type.

```typescript
interface Lease {
  _id: string;
  proposalId: string;
  guestId: string;
  hostId: string;
  listingId: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: number;
  status: 'active' | 'expired' | 'terminated';
  contractUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Pricing Types

### PricingList

Dynamic pricing list type.

```typescript
interface PricingList {
  _id: string;
  listingId?: string;
  name: string;
  baseNightlyRate: number;
  baseWeeklyRate?: number;
  baseFourWeekRate?: number;

  // Day-of-week scalars
  scalarMonday?: number;
  scalarTuesday?: number;
  scalarWednesday?: number;
  scalarThursday?: number;
  scalarFriday?: number;
  scalarSaturday?: number;
  scalarSunday?: number;

  createdAt: string;
  updatedAt: string;
}
```

---

### PricingCalculationRequest

Request type for pricing calculations.

```typescript
interface PricingCalculationRequest {
  listingId: string;
  checkInDate: string;
  checkOutDate: string;
  selectedDays: number[];
}
```

---

### PricingCalculationResponse

Response type for pricing calculations.

```typescript
interface PricingCalculationResponse {
  nightlyRate: number;
  weeklyRate?: number;
  fourWeekRate?: number;
  totalRent: number;
  serviceFee: number;
  total: number;
  breakdown?: {
    nightly: number;
    nights: number;
    weekly: number;
    weeks: number;
    fourWeek: number;
    fourWeekPeriods: number;
  };
}
```

---

## QR Code Types

### QRCode

QR code type.

```typescript
interface QRCode {
  id: string;
  useCase: 'check_in' | 'check_out' | 'emergency' | 'general_info';
  displayText?: string;
  informationContent?: string;
  visitId?: string;
  listingId?: string;
  propertyId?: string;
  hostPhone?: string;
  guestPhone?: string;
  hostName?: string;
  guestName?: string;
  propertyName?: string;
  isActive: boolean;
  scanCount: number;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Sync Types

### SyncQueueItem

Sync queue item type.

```typescript
interface SyncQueueItem {
  id: string;
  correlationId: string;
  sequence: number;
  table: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SIGNUP_ATOMIC';
  payload?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## Error Types

### ValidationError

Validation error type.

```typescript
class ValidationError extends Error {
  name: 'ValidationError';
  constructor(message: string);
}
```

---

### AuthenticationError

Authentication error type.

```typescript
class AuthenticationError extends Error {
  name: 'AuthenticationError';
  constructor(message: string = 'Unauthorized');
}
```

---

### BubbleApiError

Bubble API error type.

```typescript
class BubbleApiError extends Error {
  name: 'BubbleApiError';
  statusCode: number;
  bubbleResponse?: any;
  constructor(message: string, statusCode?: number, bubbleResponse?: any);
}
```

---

### SupabaseSyncError

Supabase sync error type.

```typescript
class SupabaseSyncError extends Error {
  name: 'SupabaseSyncError';
  originalError?: any;
  constructor(message: string, originalError?: any);
}
```

---

### OpenAIError

OpenAI API error type.

```typescript
class OpenAIError extends Error {
  name: 'OpenAIError';
  statusCode: number;
  openaiResponse?: unknown;
  constructor(message: string, statusCode?: number, openaiResponse?: unknown);
}
```

---

## AI Types

### AIGatewayRequest

AI gateway request type.

```typescript
interface AIGatewayRequest {
  prompt: string;
  variables?: Record<string, any>;
  responseFormat?: 'text' | 'json_object';
  model?: string;
  maxTokens?: number;
  temperature?: number;
}
```

---

### AIGatewayResponse

AI gateway response type.

```typescript
interface AIGatewayResponse {
  response: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

---

## Utility Types

### DateRange

Date range type.

```typescript
interface DateRange {
  start: string; // ISO date string
  end: string; // ISO date string
}
```

---

### Pagination

Pagination type.

```typescript
interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
```

---

### PaginatedResponse

Paginated response type.

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
```

---

## Bubble Types

### BubbleWorkflowResponse

Bubble workflow response type.

```typescript
interface BubbleWorkflowResponse {
  status?: string;
  response?: {
    listingId?: string;
    id?: string;
    userId?: string;
    token?: string;
    expires?: number;
    [key: string]: any;
  };
  bubbleId?: string;
  id?: string;
  [key: string]: any;
}
```

---

### BubbleSyncConfig

Bubble sync configuration type.

```typescript
interface BubbleSyncConfig {
  bubbleBaseUrl: string;
  bubbleApiKey: string;
  supabaseServiceKey: string;
}
```

---

## Workflow Types

### WorkflowConfig

Workflow configuration type.

```typescript
interface WorkflowConfig {
  workflowName: string;
  bubbleObjectType: string;
  supabaseTable: string;
}
```

---

## Enumerations

### DayOfWeek

Day of week enumeration (JavaScript 0-based).

```typescript
enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6
}
```

---

### DayOfWeekBubble

Day of week enumeration (Bubble 1-based).

```typescript
enum DayOfWeekBubble {
  Sunday = 1,
  Monday = 2,
  Tuesday = 3,
  Wednesday = 4,
  Thursday = 5,
  Friday = 6,
  Saturday = 7
}
```

---

### UserRole

User role enumeration.

```typescript
enum UserRole {
  Host = 'Host',
  Guest = 'Guest'
}
```

---

### ListingStatus

Listing status enumeration.

```typescript
enum ListingStatus {
  Draft = 'draft',
  Active = 'active',
  Inactive = 'inactive',
  Archived = 'archived'
}
```

---

### SyncStatus

Sync status enumeration.

```typescript
enum SyncStatus {
  Pending = 'pending',
  Synced = 'synced',
  Failed = 'failed'
}
```

---

## Type Guards

### isSuccess

Type guard for success responses.

```typescript
function isSuccess<T>(response: EdgeFunctionResponse<T>): response is EdgeFunctionResponse<T> & { success: true; data: T } {
  return response.success === true;
}
```

**Usage**:
```typescript
const response = await fetch(...);
const result = await response.json();

if (isSuccess(result)) {
  console.log(result.data.proposalId);
} else {
  console.error(result.error);
}
```

---

### isError

Type guard for error responses.

```typescript
function isError(response: EdgeFunctionResponse): response is EdgeFunctionResponse & { success: false; error: string } {
  return response.success === false;
}
```

---

## Type Utilities

### Optional

Utility type for optional fields.

```typescript
type Optional<T> = T | null | undefined;
```

---

### Nullable

Utility type for nullable fields.

```typescript
type Nullable<T> = T | null;
```

---

### WithRequired

Utility type to make fields required.

```typescript
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
```

---

## Example Usage

### Creating a Proposal

```typescript
import type { ProposalCreateRequest, EdgeFunctionResponse, Proposal } from '@splitlease/types';

const request: EdgeFunctionRequest<ProposalCreateRequest> = {
  action: 'create',
  payload: {
    listingId: 'listing_123',
    checkInDate: '2026-02-01',
    checkOutDate: '2026-02-28',
    selectedDays: [1, 2, 3, 4, 5], // Mon-Fri
    guestMessage: 'Looking forward to staying!'
  }
};

const response = await fetch('/functions/v1/proposal', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(request)
});

const result: EdgeFunctionResponse<Proposal> = await response.json();

if (result.success && result.data) {
  console.log('Proposal created:', result.data._id);
} else {
  console.error('Error:', result.error);
}
```

---

### Type-Safe Error Handling

```typescript
import type { EdgeFunctionResponse, isError } from '@splitlease/types';

async function handleProposal(request: ProposalCreateRequest): Promise<Proposal> {
  const response = await fetch('/functions/v1/proposal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', payload: request })
  });

  const result: EdgeFunctionResponse<Proposal> = await response.json();

  if (isError(result)) {
    throw new Error(result.error);
  }

  return result.data!;
}
```

---

## See Also

- [Edge Functions Reference](../edge-functions/README.md)
- [Database Schema](../database/README.md)
- [Code Examples](../examples/README.md)
