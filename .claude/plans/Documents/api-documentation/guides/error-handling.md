# Error Handling Guide

Complete guide to error handling patterns across Split Lease Edge Functions.

---

## Table of Contents

- [Overview](#overview)
- [Error Response Format](#error-response-format)
- [HTTP Status Codes](#http-status-codes)
- [Error Classes](#error-classes)
- [Error Logging](#error-logging)
- [Client-Side Error Handling](#client-side-error-handling)
- [Debugging Guide](#debugging-guide)

---

## Overview

Split Lease Edge Functions use a functional programming approach to error handling:

1. **Explicit errors** - No thrown exceptions; all errors are returned as `Result<T, E>` types
2. **Immutable logging** - All errors are logged to Slack with full context
3. **Consistent format** - All error responses follow the same JSON structure
4. **HTTP semantics** - Appropriate HTTP status codes for each error type

---

## Error Response Format

All error responses follow this structure:

```typescript
interface ErrorResponse {
  success: false;
  error: string;                  // Human-readable error message
  code?: string;                  // Programmatic error code
  details?: unknown;              // Additional context (optional)
}
```

### Example Error Responses

**Validation Error (400):**

```json
{
  "success": false,
  "error": "Missing required field: listing_id",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "listing_id",
    "constraint": "required"
  }
}
```

**Authentication Error (401):**

```json
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "AUTHENTICATION_REQUIRED"
}
```

**Not Found Error (404):**

```json
{
  "success": false,
  "error": "Proposal not found",
  "code": "NOT_FOUND",
  "details": {
    "resource": "proposal",
    "id": "1234567890123x0987654321"
  }
}
```

**Bubble API Error (502):**

```json
{
  "success": false,
  "error": "Bubble API returned 503",
  "code": "BUBBLE_API_ERROR",
  "details": {
    "originalStatus": 503,
    "endpoint": "/api/1.1/obj/listing"
  }
}
```

---

## HTTP Status Codes

| Code | Name | When Used |
|------|------|-----------|
| **400** | Bad Request | Validation errors, malformed JSON, missing fields |
| **401** | Unauthorized | Missing or invalid authentication token |
| **403** | Forbidden | Valid token but insufficient permissions |
| **404** | Not Found | Resource does not exist |
| **409** | Conflict | Duplicate entry, constraint violation |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Unexpected server errors |
| **502** | Bad Gateway | Bubble API errors |
| **503** | Service Unavailable | Supabase or OpenAI errors |

### Error Code to Status Mapping

```typescript
const STATUS_CODES: Record<string, number> = {
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

---

## Error Classes

### Class Hierarchy

```
SplitLeaseError (abstract)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── RateLimitError (429)
├── InternalError (500)
├── BubbleApiError (502)
├── SupabaseError (503)
└── OpenAIError (503)
```

### Error Class Definitions

```typescript
// Base class
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

  toJSON(): ErrorResponse {
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

// Validation (400)
class ValidationError extends SplitLeaseError {
  readonly statusCode = 400;
  readonly code = "VALIDATION_ERROR";

  constructor(message: string, field?: string) {
    super(message, field ? { field } : undefined);
  }
}

// Authentication (401)
class AuthenticationError extends SplitLeaseError {
  readonly statusCode = 401;
  readonly code = "AUTHENTICATION_REQUIRED";
}

// Authorization (403)
class AuthorizationError extends SplitLeaseError {
  readonly statusCode = 403;
  readonly code = "AUTHORIZATION_FAILED";
}

// Not Found (404)
class NotFoundError extends SplitLeaseError {
  readonly statusCode = 404;
  readonly code = "NOT_FOUND";

  constructor(resource: string, id?: string) {
    super(`${resource} not found`, id ? { resource, id } : { resource });
  }
}

// Conflict (409)
class ConflictError extends SplitLeaseError {
  readonly statusCode = 409;
  readonly code = "CONFLICT";
}

// Rate Limit (429)
class RateLimitError extends SplitLeaseError {
  readonly statusCode = 429;
  readonly code = "RATE_LIMITED";
  readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
    this.retryAfter = retryAfter;
  }

  toResponse(): Response {
    return new Response(JSON.stringify(this.toJSON()), {
      status: this.statusCode,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(this.retryAfter),
      },
    });
  }
}

// Bubble API (502)
class BubbleApiError extends SplitLeaseError {
  readonly statusCode = 502;
  readonly code = "BUBBLE_API_ERROR";

  constructor(message: string, originalStatus?: number, endpoint?: string) {
    super(message, { originalStatus, endpoint });
  }
}

// Supabase (503)
class SupabaseError extends SplitLeaseError {
  readonly statusCode = 503;
  readonly code = "SUPABASE_ERROR";

  constructor(message: string, pgCode?: string, hint?: string) {
    super(message, { pgCode, hint });
  }
}

// OpenAI (503)
class OpenAIError extends SplitLeaseError {
  readonly statusCode = 503;
  readonly code = "OPENAI_ERROR";
}

// Internal (500)
class InternalError extends SplitLeaseError {
  readonly statusCode = 500;
  readonly code = "INTERNAL_ERROR";
}
```

---

## Error Logging

All errors are logged to Slack with full context for debugging.

### Slack Logging Implementation

```typescript
// _shared/slack.ts
interface SlackErrorLog {
  function: string;
  action: string;
  error: SplitLeaseError;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    payload?: unknown;
  };
  timestamp: string;
  environment: string;
}

async function logErrorToSlack(log: SlackErrorLog): Promise<void> {
  const webhookUrl = Deno.env.get("SLACK_ERROR_WEBHOOK");
  if (!webhookUrl) return;

  const message = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🚨 Edge Function Error: ${log.function}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Action:*\n${log.action}` },
          { type: "mrkdwn", text: `*Status:*\n${log.error.statusCode}` },
          { type: "mrkdwn", text: `*Code:*\n${log.error.code}` },
          { type: "mrkdwn", text: `*Environment:*\n${log.environment}` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Error Message:*\n\`\`\`${log.error.message}\`\`\``,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Timestamp: ${log.timestamp}`,
          },
        ],
      },
    ],
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
}
```

### Automatic Error Logging

```typescript
// In handler wrapper
async function handleAction(
  request: Request,
  functionName: string,
  action: string,
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    const splitError = error instanceof SplitLeaseError
      ? error
      : new InternalError(error.message);

    // Log to Slack
    await logErrorToSlack({
      function: functionName,
      action,
      error: splitError,
      request: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers),
      },
      timestamp: new Date().toISOString(),
      environment: Deno.env.get("ENVIRONMENT") || "unknown",
    });

    return splitError.toResponse();
  }
}
```

---

## Client-Side Error Handling

### API Client with Error Handling

```typescript
// lib/api.ts
interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    action: string,
    payload: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ action, payload }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new ApiError(data.error, data.code, response.status);
    }

    return data.data as T;
  }

  private getToken(): string {
    return localStorage.getItem("access_token") || "";
  }
}

class ApiError extends Error {
  constructor(
    message: string,
    public code: string | undefined,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }

  isValidation(): boolean {
    return this.status === 400;
  }

  isAuthentication(): boolean {
    return this.status === 401;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isRateLimited(): boolean {
    return this.status === 429;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}
```

### React Error Handling Hook

```typescript
// hooks/useApiError.ts
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface UseApiErrorReturn {
  error: string | null;
  handleError: (error: ApiError) => void;
  clearError: () => void;
}

function useApiError(): UseApiErrorReturn {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleError = useCallback((error: ApiError) => {
    // Handle based on error type
    if (error.isAuthentication()) {
      // Redirect to login
      localStorage.removeItem("access_token");
      navigate("/login", { state: { message: "Session expired" } });
      return;
    }

    if (error.isRateLimited()) {
      setError("Too many requests. Please wait a moment and try again.");
      return;
    }

    if (error.isServerError()) {
      setError("Something went wrong. Please try again later.");
      return;
    }

    // Show the actual error message
    setError(error.message);
  }, [navigate]);

  const clearError = useCallback(() => setError(null), []);

  return { error, handleError, clearError };
}
```

### Error Boundary Component

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to error tracking service
    console.error("Error boundary caught:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-container">
            <h2>Something went wrong</h2>
            <p>Please refresh the page or try again later.</p>
            <button onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

---

## Debugging Guide

### Common Errors and Solutions

#### Validation Error (400)

**Symptoms:**
```json
{
  "success": false,
  "error": "Missing required field: listing_id",
  "code": "VALIDATION_ERROR"
}
```

**Causes:**
- Missing required fields in payload
- Invalid field types (string instead of number)
- Invalid date format (not ISO)

**Solutions:**
1. Check request payload against schema
2. Ensure all required fields are present
3. Verify field types match schema

#### Authentication Error (401)

**Symptoms:**
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "AUTHENTICATION_REQUIRED"
}
```

**Causes:**
- Missing Authorization header
- Expired JWT token
- Malformed token

**Solutions:**
1. Verify Authorization header is present
2. Check token expiration (`exp` claim)
3. Implement token refresh logic

#### Not Found Error (404)

**Symptoms:**
```json
{
  "success": false,
  "error": "Proposal not found",
  "code": "NOT_FOUND"
}
```

**Causes:**
- Invalid ID format
- Resource deleted
- Wrong ID provided

**Solutions:**
1. Verify the ID exists in database
2. Check for soft-deleted records
3. Verify ID format (Bubble-style: `1234567890123x0987654321`)

#### Bubble API Error (502)

**Symptoms:**
```json
{
  "success": false,
  "error": "Bubble API returned 503",
  "code": "BUBBLE_API_ERROR"
}
```

**Causes:**
- Bubble service downtime
- Bubble API rate limits
- Network issues

**Solutions:**
1. Check Bubble status page
2. Implement retry with exponential backoff
3. Add circuit breaker pattern

#### Supabase Error (503)

**Symptoms:**
```json
{
  "success": false,
  "error": "Database constraint violation",
  "code": "SUPABASE_ERROR",
  "details": {
    "pgCode": "23503",
    "hint": "Key (listing_id)=(123) is not present in table \"listings\""
  }
}
```

**Common PostgreSQL Codes:**
- `23503` - Foreign key violation
- `23505` - Unique constraint violation
- `42P01` - Table does not exist
- `42501` - Insufficient privilege

**Solutions:**
1. Check FK references exist before insert
2. Handle unique constraint errors gracefully
3. Verify RLS policies are configured correctly

### Debugging Tools

#### View Edge Function Logs

```bash
# Real-time logs
supabase functions logs <function-name> --follow

# Recent logs
supabase functions logs <function-name> --limit 100
```

#### Test Endpoint Locally

```bash
# Start local functions
supabase functions serve

# Test with curl
curl -X POST http://localhost:54321/functions/v1/proposal \
  -H "Content-Type: application/json" \
  -d '{"action": "get", "payload": {"proposal_id": "test123"}}'
```

#### Check Slack Error Channel

All production errors are logged to the `#edge-function-errors` Slack channel with:
- Function name
- Action
- Error code and message
- Request details
- Timestamp
