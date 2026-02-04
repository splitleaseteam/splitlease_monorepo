# Shared Types

Core TypeScript types and utilities used across Split Lease Edge Functions.

---

## Table of Contents

- [Result Type](#result-type)
- [Error Classes](#error-classes)
- [Common Types](#common-types)
- [Utility Types](#utility-types)
- [Constants](#constants)

---

## Result Type

The Result type is the foundation of the FP architecture, providing explicit error handling without exceptions.

### Core Definition

```typescript
/**
 * Result type for explicit error handling
 * Inspired by Rust's Result<T, E>
 */
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Create a successful result
 */
function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create a failed result
 */
function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Type guard for success
 */
function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok === true;
}

/**
 * Type guard for failure
 */
function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return result.ok === false;
}
```

### Result Combinators

```typescript
/**
 * Transform the success value
 */
function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

/**
 * Transform the error value
 */
function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  return result.ok ? result : err(fn(result.error));
}

/**
 * Chain results (flatMap)
 */
function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

/**
 * Provide fallback on error
 */
function orElse<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => Result<T, F>
): Result<T, F> {
  return result.ok ? result : fn(result.error);
}

/**
 * Unwrap with default value
 */
function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

/**
 * Unwrap or throw
 */
function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}
```

### Async Result Utilities

```typescript
/**
 * Wrap a promise in a Result
 */
async function fromPromise<T>(
  promise: Promise<T>
): Promise<Result<T, Error>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Wrap a function that might throw
 */
function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Combine multiple results
 */
function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) return result;
    values.push(result.value);
  }
  return ok(values);
}
```

---

## Error Classes

Custom error classes with HTTP status mapping and Slack logging support.

### Base Error Class

```typescript
/**
 * Base class for all Split Lease errors
 */
abstract class SplitLeaseError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  readonly timestamp: string;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.details = details;
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }

  toResponse(): Response {
    return new Response(JSON.stringify(this.toJSON()), {
      status: this.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

### Specific Error Classes

```typescript
/**
 * Validation errors (400)
 */
class ValidationError extends SplitLeaseError {
  readonly statusCode = 400;
  readonly code = "VALIDATION_ERROR";

  constructor(message: string, field?: string) {
    super(message, field ? { field } : undefined);
  }
}

/**
 * Authentication errors (401)
 */
class AuthenticationError extends SplitLeaseError {
  readonly statusCode = 401;
  readonly code = "AUTHENTICATION_REQUIRED";
}

/**
 * Authorization errors (403)
 */
class AuthorizationError extends SplitLeaseError {
  readonly statusCode = 403;
  readonly code = "AUTHORIZATION_FAILED";
}

/**
 * Resource not found (404)
 */
class NotFoundError extends SplitLeaseError {
  readonly statusCode = 404;
  readonly code = "NOT_FOUND";

  constructor(resource: string, id?: string) {
    super(`${resource} not found`, id ? { resource, id } : { resource });
  }
}

/**
 * Conflict errors (409)
 */
class ConflictError extends SplitLeaseError {
  readonly statusCode = 409;
  readonly code = "CONFLICT";
}

/**
 * Rate limiting (429)
 */
class RateLimitError extends SplitLeaseError {
  readonly statusCode = 429;
  readonly code = "RATE_LIMITED";
  readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
    this.retryAfter = retryAfter;
  }
}

/**
 * Bubble API errors (502)
 */
class BubbleApiError extends SplitLeaseError {
  readonly statusCode = 502;
  readonly code = "BUBBLE_API_ERROR";

  constructor(message: string, originalStatus?: number) {
    super(message, { originalStatus });
  }
}

/**
 * Supabase errors (503)
 */
class SupabaseError extends SplitLeaseError {
  readonly statusCode = 503;
  readonly code = "SUPABASE_ERROR";

  constructor(message: string, pgCode?: string) {
    super(message, pgCode ? { pgCode } : undefined);
  }
}

/**
 * OpenAI API errors (503)
 */
class OpenAIError extends SplitLeaseError {
  readonly statusCode = 503;
  readonly code = "OPENAI_ERROR";
}

/**
 * Internal server errors (500)
 */
class InternalError extends SplitLeaseError {
  readonly statusCode = 500;
  readonly code = "INTERNAL_ERROR";
}
```

### Error Factory

```typescript
/**
 * Create appropriate error from HTTP response
 */
function fromHttpStatus(status: number, message: string): SplitLeaseError {
  switch (status) {
    case 400:
      return new ValidationError(message);
    case 401:
      return new AuthenticationError(message);
    case 403:
      return new AuthorizationError(message);
    case 404:
      return new NotFoundError("Resource", message);
    case 409:
      return new ConflictError(message);
    case 429:
      return new RateLimitError();
    default:
      return new InternalError(message);
  }
}
```

---

## Common Types

### Identifiers

```typescript
/**
 * Bubble-style ID (e.g., "1234567890123x0987654321")
 */
type BubbleId = string;

/**
 * Supabase UUID
 */
type SupabaseUUID = string;

/**
 * Listing ID
 */
type ListingId = BubbleId;

/**
 * User ID
 */
type UserId = BubbleId;

/**
 * Proposal ID
 */
type ProposalId = BubbleId;

/**
 * Lease ID
 */
type LeaseId = BubbleId;

/**
 * Thread ID
 */
type ThreadId = BubbleId;

/**
 * Message ID
 */
type MessageId = BubbleId;
```

### Enums

```typescript
/**
 * User types
 */
type UserType = "Host" | "Guest";

/**
 * Proposal status
 */
type ProposalStatus =
  | "Pending"
  | "Accepted"
  | "Declined"
  | "Counteroffer"
  | "Expired"
  | "Withdrawn";

/**
 * Lease status
 */
type LeaseStatus =
  | "Active"
  | "Pending"
  | "Completed"
  | "Cancelled"
  | "Terminated";

/**
 * Payment status
 */
type PaymentStatus = "Pending" | "Paid" | "Overdue" | "Refunded";

/**
 * Space types
 */
type SpaceType = "Entire apartment" | "Private room" | "Shared room";

/**
 * OAuth providers
 */
type OAuthProvider = "google" | "apple" | "facebook";

/**
 * AI models
 */
type AIModel = "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo" | "gpt-3.5-turbo";
```

### Schedule Types

```typescript
/**
 * Day index (0-indexed: 0=Sunday, 6=Saturday)
 */
type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Week index (1-indexed: 1-4 or 1-5)
 */
type WeekIndex = 1 | 2 | 3 | 4 | 5;

/**
 * Schedule selection
 */
interface Schedule {
  days: DayIndex[];
  weeks: WeekIndex[];
  startDate: string;              // ISO date YYYY-MM-DD
  endDate: string;                // ISO date YYYY-MM-DD
}

/**
 * Available nights pricing
 */
interface NightlyPricing {
  "Price 1 night selected": number;
  "Price 2 nights selected": number;
  "Price 3 nights selected": number;
  "Price 4 nights selected": number;
  "Price 5 nights selected": number;
  "Price 6 nights selected": number;
  "Price 7 nights selected": number;
}
```

### Date/Time Types

```typescript
/**
 * ISO date string (YYYY-MM-DD)
 */
type ISODate = string;

/**
 * ISO timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
type ISOTimestamp = string;

/**
 * Date range
 */
interface DateRange {
  start: ISODate;
  end: ISODate;
}
```

---

## Utility Types

### API Request/Response

```typescript
/**
 * Action-based request wrapper
 */
interface ActionRequest<A extends string, P> {
  action: A;
  payload: P;
}

/**
 * Standard API response
 */
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Paginated response
 */
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}
```

### Handler Types

```typescript
/**
 * Edge Function handler signature
 */
type EdgeHandler<P, R> = (
  payload: P,
  context: HandlerContext
) => Promise<Result<R, SplitLeaseError>>;

/**
 * Handler context
 */
interface HandlerContext {
  request: Request;
  userId?: UserId;
  supabaseUserId?: SupabaseUUID;
  isAuthenticated: boolean;
  headers: Headers;
}

/**
 * Action router map
 */
type ActionRouter<Actions extends string> = {
  [K in Actions]: EdgeHandler<unknown, unknown>;
};
```

### Database Types

```typescript
/**
 * Supabase query result
 */
interface QueryResult<T> {
  data: T | null;
  error: {
    message: string;
    code: string;
    details?: string;
    hint?: string;
  } | null;
}

/**
 * Sync queue item
 */
interface SyncQueueItem {
  id: number;
  operation: "INSERT" | "UPDATE" | "DELETE";
  table_name: string;
  record_id: string;
  payload: Record<string, unknown>;
  status: "pending" | "processing" | "completed" | "failed";
  retry_count: number;
  created_at: ISOTimestamp;
  processed_at?: ISOTimestamp;
  error_message?: string;
}
```

---

## Constants

### Day Names

```typescript
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const DAY_ABBREVIATIONS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

// Day index to name
function getDayName(index: DayIndex): string {
  return DAY_NAMES[index];
}
```

### Week Names

```typescript
const WEEK_NAMES = [
  "Week 1",
  "Week 2",
  "Week 3",
  "Week 4",
  "Week 5",
] as const;

const WEEK_ORDINALS = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
] as const;
```

### Public Prompts

```typescript
const PUBLIC_PROMPTS = new Set([
  "listing-description",
  "listing-title",
  "neighborhood-description",
  "parse-call-transcription",
  "negotiation-summary-suggested",
  "negotiation-summary-counteroffer",
  "negotiation-summary-host",
  "echo-test",
]);

function isPublicPrompt(key: string): boolean {
  return PUBLIC_PROMPTS.has(key);
}
```

### HTTP Headers

```typescript
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};
```

---

## Type Exports

```typescript
export {
  // Result
  Result,
  ok,
  err,
  isOk,
  isErr,
  map,
  mapErr,
  andThen,
  orElse,
  unwrapOr,
  unwrap,
  fromPromise,
  tryCatch,
  all,

  // Errors
  SplitLeaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  BubbleApiError,
  SupabaseError,
  OpenAIError,
  InternalError,
  fromHttpStatus,

  // Identifiers
  BubbleId,
  SupabaseUUID,
  ListingId,
  UserId,
  ProposalId,
  LeaseId,
  ThreadId,
  MessageId,

  // Enums
  UserType,
  ProposalStatus,
  LeaseStatus,
  PaymentStatus,
  SpaceType,
  OAuthProvider,
  AIModel,

  // Schedule
  DayIndex,
  WeekIndex,
  Schedule,
  NightlyPricing,

  // Date/Time
  ISODate,
  ISOTimestamp,
  DateRange,

  // API
  ActionRequest,
  ApiResponse,
  PaginatedResponse,
  EdgeHandler,
  HandlerContext,
  ActionRouter,

  // Database
  QueryResult,
  SyncQueueItem,

  // Constants
  DAY_NAMES,
  DAY_ABBREVIATIONS,
  WEEK_NAMES,
  WEEK_ORDINALS,
  PUBLIC_PROMPTS,
  isPublicPrompt,
  CORS_HEADERS,
  JSON_HEADERS,
  SSE_HEADERS,
};
```
