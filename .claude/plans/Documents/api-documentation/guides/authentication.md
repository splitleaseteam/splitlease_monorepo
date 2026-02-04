# Authentication Guide

Complete guide to authentication patterns across Split Lease Edge Functions.

---

## Table of Contents

- [Overview](#overview)
- [Authentication Methods](#authentication-methods)
- [Per-Function Authentication Matrix](#per-function-authentication-matrix)
- [Implementation Examples](#implementation-examples)
- [Token Management](#token-management)
- [Security Considerations](#security-considerations)

---

## Overview

Split Lease Edge Functions support multiple authentication patterns to accommodate both modern JWT-based auth and legacy Bubble.io compatibility:

| Method | Description | Use Case |
|--------|-------------|----------|
| **JWT Token** | Supabase Auth JWT in Authorization header | Primary method for authenticated users |
| **Legacy User ID** | `user_id` in request payload | Bubble.io compatibility fallback |
| **Public** | No authentication required | Guest-facing operations, inquiries |
| **Prompt-Based** | Authentication based on prompt key | AI Gateway only |

---

## Authentication Methods

### 1. JWT Token Authentication (Primary)

The recommended authentication method using Supabase Auth JWT tokens.

**Request Format:**

```http
POST /functions/v1/{function-name}
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "action": "get_threads",
  "payload": {}
}
```

**Token Structure:**

```typescript
interface JWTPayload {
  sub: string;              // Supabase user UUID
  email: string;
  exp: number;              // Expiration timestamp
  iat: number;              // Issued at timestamp
  aud: string;              // Audience
  role: string;             // "authenticated" or "anon"

  // Custom claims (from user metadata)
  user_metadata?: {
    user_id: string;        // Bubble-style ID
    user_type: "Host" | "Guest";
    firstName?: string;
    lastName?: string;
  };
}
```

**Server-Side Validation:**

```typescript
// Edge Function authentication check
const authHeader = request.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return err(new AuthenticationError("Missing Authorization header"));
}

const token = authHeader.slice(7);
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return err(new AuthenticationError("Invalid or expired token"));
}

// Extract user metadata
const userId = user.user_metadata?.user_id;
const userType = user.user_metadata?.user_type;
```

### 2. Legacy User ID Authentication

Fallback for Bubble.io compatibility. The `user_id` is passed in the request payload.

**Request Format:**

```http
POST /functions/v1/messages
Content-Type: application/json

{
  "action": "get_threads",
  "payload": {
    "user_id": "1234567890123x0987654321"
  }
}
```

**Server-Side Handling:**

```typescript
// Check for JWT first, fall back to payload user_id
let userId: string | undefined;

const authHeader = request.headers.get("Authorization");
if (authHeader?.startsWith("Bearer ")) {
  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
  userId = user?.user_metadata?.user_id;
}

// Fallback to payload
if (!userId && payload.user_id) {
  userId = payload.user_id;
  // Note: Less secure - should validate ownership where applicable
}

if (!userId) {
  return err(new AuthenticationError("Authentication required"));
}
```

### 3. Public Actions

Some actions are intentionally public and require no authentication.

**Request Format:**

```http
POST /functions/v1/messages
Content-Type: application/json

{
  "action": "send_guest_inquiry",
  "payload": {
    "guest_name": "John Doe",
    "guest_email": "john@example.com",
    "listing_id": "1234567890123x0987654321",
    "message": "I'm interested in your listing"
  }
}
```

### 4. Prompt-Based Authentication (AI Gateway)

The AI Gateway uses prompt-based authentication where public prompts don't require auth.

**Public Prompt Request:**

```http
POST /functions/v1/ai-gateway
Content-Type: application/json

{
  "action": "complete",
  "payload": {
    "prompt_key": "listing-description",
    "variables": {
      "neighborhood": "Brooklyn Heights"
    }
  }
}
```

**Protected Prompt Request:**

```http
POST /functions/v1/ai-gateway
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "action": "complete",
  "payload": {
    "prompt_key": "deepfake-script",
    "variables": {
      "topic": "listing tour"
    }
  }
}
```

---

## Per-Function Authentication Matrix

### Proposal Function

| Action | Auth Required | Auth Method | Notes |
|--------|---------------|-------------|-------|
| `create` | No | - | Public proposal creation |
| `update` | Yes | JWT | Must be participant |
| `get` | No | - | Public read |
| `suggest` | No | - | AI suggestion generation |
| `create_suggested` | No | - | Create from suggestion |
| `create_mockup` | No | - | Internal testing |
| `get_prefill_data` | No | - | Form prefill |
| `createTestProposal` | No | - | Testing only |
| `createTestRentalApplication` | No | - | Testing only |
| `acceptProposal` | No | - | Internal service call |
| `createCounteroffer` | No | - | Internal service call |
| `acceptCounteroffer` | No | - | Internal service call |

### Listing Function

| Action | Auth Required | Auth Method | Notes |
|--------|---------------|-------------|-------|
| `create` | No | - | Public draft creation |
| `get` | No | - | Public read |
| `submit` | Yes | JWT | Protected - validates via email |
| `delete` | No | - | Bubble workflow handles auth |

### Lease Function

| Action | Auth Required | Auth Method | Notes |
|--------|---------------|-------------|-------|
| `create` | No | - | Internal service call |
| `get` | Yes | JWT | Must be lease participant |
| `generate_dates` | No | - | Internal service call |
| `get_host_leases` | Yes | JWT | Returns user's leases only |
| `get_guest_leases` | Yes | JWT | Returns user's leases only |

### Messages Function

| Action | Auth Required | Auth Method | Notes |
|--------|---------------|-------------|-------|
| `send_message` | Yes | JWT/Legacy | Auth or user_id in payload |
| `get_messages` | Yes | JWT/Legacy | Must be thread participant |
| `get_threads` | Yes | JWT/Legacy | Returns user's threads only |
| `send_guest_inquiry` | No | - | Public form submission |
| `create_proposal_thread` | No | - | Internal service call |
| `send_splitbot_message` | No | - | Internal service call |
| `admin_get_all_threads` | No | - | Internal admin page |
| `admin_delete_thread` | No | - | Internal admin page |
| `admin_send_reminder` | No | - | Internal admin page |

### Auth User Function

| Action | Auth Required | Auth Method | Notes |
|--------|---------------|-------------|-------|
| `login` | No | - | Authenticates user |
| `signup` | No | - | Creates new user |
| `logout` | No | - | Client-side operation |
| `validate` | No | - | Validates provided token |
| `request_password_reset` | No | - | Sends reset email |
| `update_password` | No | - | Uses reset token |
| `generate_magic_link` | No | - | Internal service |
| `oauth_signup` | No | - | OAuth flow |
| `oauth_login` | No | - | OAuth flow |
| `send_magic_link_sms` | No | - | SMS authentication |
| `verify_email` | No | - | Uses verification token |

### AI Gateway Function

| Prompt Key | Auth Required | Notes |
|------------|---------------|-------|
| `listing-description` | No | Public - self-listing |
| `listing-title` | No | Public - self-listing |
| `neighborhood-description` | No | Public - self-listing |
| `parse-call-transcription` | No | Public - voice processing |
| `echo-test` | No | Public - testing |
| `negotiation-summary-suggested` | No | Public - proposal flow |
| `negotiation-summary-counteroffer` | No | Public - proposal flow |
| `negotiation-summary-host` | No | Public - proposal flow |
| `deepfake-script` | Yes (JWT) | Protected - AI tools |
| `narration-script` | Yes (JWT) | Protected - AI tools |
| `jingle-lyrics` | Yes (JWT) | Protected - AI tools |

---

## Implementation Examples

### Frontend Authentication Flow

```typescript
// lib/auth.ts
import { supabase } from './supabase';

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    userType: 'Host' | 'Guest';
  };
}

// Login
export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await fetch('/functions/v1/auth-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      payload: { email, password }
    })
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error);
  }

  // Store tokens
  localStorage.setItem('access_token', result.data.access_token);
  localStorage.setItem('refresh_token', result.data.refresh_token);

  return {
    accessToken: result.data.access_token,
    refreshToken: result.data.refresh_token,
    expiresAt: Date.now() + (result.data.expires_in * 1000),
    user: {
      id: result.data.user_id,
      email: result.data.email,
      userType: result.data.user_type
    }
  };
}

// Make authenticated request
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('access_token');

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
}

// Example: Get user's threads
export async function getThreads() {
  const response = await authenticatedFetch('/functions/v1/messages', {
    method: 'POST',
    body: JSON.stringify({
      action: 'get_threads',
      payload: { limit: 20 }
    })
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}
```

### Edge Function Authentication Check

```typescript
// _shared/auth.ts
import { createClient } from '@supabase/supabase-js';
import { Result, ok, err } from './functional/result.ts';
import { AuthenticationError } from './errors.ts';

interface AuthContext {
  userId: string;
  supabaseUserId: string;
  userType: 'Host' | 'Guest';
  email: string;
}

export async function authenticateRequest(
  request: Request
): Promise<Result<AuthContext, AuthenticationError>> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return err(new AuthenticationError('Missing Authorization header'));
  }

  const token = authHeader.slice(7);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return err(new AuthenticationError('Invalid or expired token'));
  }

  const metadata = user.user_metadata || {};

  return ok({
    userId: metadata.user_id,
    supabaseUserId: user.id,
    userType: metadata.user_type || 'Guest',
    email: user.email!
  });
}

// Usage in handler
export async function handleGetThreads(
  request: Request,
  payload: GetThreadsPayload
): Promise<Response> {
  // Authenticate
  const authResult = await authenticateRequest(request);

  if (!authResult.ok) {
    return authResult.error.toResponse();
  }

  const { userId } = authResult.value;

  // Proceed with authenticated user
  const threads = await fetchUserThreads(userId, payload.limit, payload.offset);

  return new Response(
    JSON.stringify({ success: true, data: threads }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
```

---

## Token Management

### Token Refresh

```typescript
// Frontend token refresh
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken
  });

  if (error || !data.session) {
    // Clear invalid tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return null;
  }

  // Store new tokens
  localStorage.setItem('access_token', data.session.access_token);
  localStorage.setItem('refresh_token', data.session.refresh_token);

  return data.session.access_token;
}

// Auto-refresh wrapper
export async function fetchWithRefresh(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let response = await authenticatedFetch(url, options);

  // If unauthorized, try refresh
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await authenticatedFetch(url, options);
    }
  }

  return response;
}
```

### Token Validation

```typescript
// Validate token on page load
export async function validateSession(): Promise<boolean> {
  const token = localStorage.getItem('access_token');
  if (!token) return false;

  const response = await fetch('/functions/v1/auth-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'validate',
      payload: { access_token: token }
    })
  });

  const result = await response.json();
  return result.success && result.data.valid;
}
```

---

## Security Considerations

### Best Practices

1. **Always use HTTPS** - All Edge Function URLs use HTTPS by default.

2. **Token storage** - Use `localStorage` for web, secure storage for mobile apps.

3. **Token expiration** - Default expiration is 1 hour. Implement refresh logic.

4. **Validate on server** - Always validate tokens server-side, never trust client claims.

5. **Minimal payload auth** - Avoid relying solely on `user_id` in payload for sensitive operations.

### Security Headers

Edge Functions automatically include security headers:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Rate Limiting

Implement rate limiting for public endpoints:

```typescript
// Example rate limit check
const rateLimitKey = `rate:${clientIp}:${action}`;
const requests = await redis.incr(rateLimitKey);

if (requests === 1) {
  await redis.expire(rateLimitKey, 60); // 1 minute window
}

if (requests > 100) {
  return new RateLimitError(60).toResponse();
}
```

### Admin Actions

Admin actions (`admin_*`) are currently not protected by authentication. They rely on:
- Internal network access (admin pages not publicly linked)
- Future: Add admin role verification

```typescript
// Future admin authentication
const AUTH_REQUIRED_ADMIN_ACTIONS = new Set([
  'admin_get_all_threads',
  'admin_delete_thread',
  'admin_send_reminder'
]);

if (AUTH_REQUIRED_ADMIN_ACTIONS.has(action)) {
  const authResult = await authenticateRequest(request);
  if (!authResult.ok) return authResult.error.toResponse();

  // Verify admin role
  if (authResult.value.userType !== 'Admin') {
    return new AuthorizationError('Admin access required').toResponse();
  }
}
```
