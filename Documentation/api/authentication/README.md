# Authentication & Authorization

Complete guide to authentication flows, authorization patterns, and security in the Split Lease API.

---

## Overview

Split Lease uses Supabase Auth for user authentication with support for:

- **Email/Password**: Traditional authentication
- **OAuth**: LinkedIn and Google sign-in
- **Magic Links**: SMS-based passwordless authentication
- **Password Reset**: Self-service password recovery

### Architecture

```
Frontend → Supabase Edge Function (auth-user) → Supabase Auth / Bubble API
         ↓
    JWT Token (access_token + refresh_token)
         ↓
    Secure Storage (encrypted localStorage)
         ↓
    Authenticated Requests
```

---

## Authentication Flow

### Email/Password Login

**Endpoint**: `POST /functions/v1/auth-user`

**Action**: `login`

**Request**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'login',
    payload: {
      email: 'user@example.com',
      password: 'password123'
    }
  })
});

const { success, data, error } = await response.json();
```

**Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": "abc123xyz",
    "supabase_user_id": "xyz789abc",
    "user_type": "Guest",
    "host_account_id": "host_123",
    "guest_account_id": "guest_456",
    "expires_in": 3600
  }
}
```

**Frontend Storage**:
```javascript
import { setAuthToken, setSessionId, setAuthState, setUserType } from 'lib/auth.js';

// Store tokens securely
setAuthToken(data.access_token);
setSessionId(data.user_id);
setAuthState(true, data.user_id);
setUserType(data.user_type);

// Set Supabase session (for authenticated requests)
await supabase.auth.setSession({
  access_token: data.access_token,
  refresh_token: data.refresh_token
});
```

---

### User Signup

**Endpoint**: `POST /functions/v1/auth-user`

**Action**: `signup`

**Request**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'signup',
    payload: {
      email: 'user@example.com',
      password: 'password123',
      retype: 'password123',
      additionalData: {
        firstName: 'John',
        lastName: 'Doe',
        userType: 'Guest',
        birthDate: '1990-01-01',
        phoneNumber: '+1234567890'
      }
    }
  })
});

const { success, data, error } = await response.json();
```

**Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": "abc123xyz",
    "supabase_user_id": "xyz789abc",
    "user_type": "Guest",
    "host_account_id": "host_123",
    "guest_account_id": "guest_456",
    "expires_in": 3600
  }
}
```

**What Happens**:
1. User created in Supabase Auth
2. User record created in `public.user` table
3. `host_account` and `guest_account` records created
4. Bubble sync enqueued via `sync_queue`
5. Session returned to frontend

---

### Token Validation

**Endpoint**: `POST /functions/v1/auth-user`

**Action**: `validate`

**Request**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`,
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'validate',
    payload: {
      token: access_token,
      user_id: user_id
    }
  })
});

const { success, data, error } = await response.json();
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "abc123xyz",
    "firstName": "John",
    "fullName": "John Doe",
    "email": "john@example.com",
    "profilePhoto": "https://example.com/photo.jpg",
    "userType": "Guest",
    "accountHostId": "host_123",
    "aboutMe": "Software engineer",
    "needForSpace": "Quiet place to work",
    "specialNeeds": "None",
    "proposalCount": 5,
    "hasSubmittedRentalApp": true,
    "isUsabilityTester": false,
    "phoneNumber": "+1234567890"
  }
}
```

---

### Logout

**Endpoint**: `POST /functions/v1/auth-user`

**Action**: `logout`

**Request**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`,
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'logout',
    payload: {
      token: access_token
    }
  })
});

const { success, data, error } = await response.json();
```

**Frontend Cleanup**:
```javascript
import { clearAuthData } from 'lib/auth.js';

// Sign out from Supabase Auth client
await supabase.auth.signOut();

// Clear all auth data from secure storage
clearAuthData();

// Redirect to home
window.location.href = '/';
```

---

## OAuth Authentication

### LinkedIn OAuth

**Step 1: Initiate OAuth Flow**

```javascript
import { initiateLinkedInOAuth } from 'lib/auth.js';

const result = await initiateLinkedInOAuth('Guest');
// Redirects to LinkedIn for authentication
```

**Step 2: Handle OAuth Callback**

User is redirected back to `/account-profile` with valid Supabase session.

```javascript
import { handleLinkedInOAuthCallback } from 'lib/auth.js';

const result = await handleLinkedInOAuthCallback();

if (result.success) {
  // User created or logged in
  console.log('User ID:', result.data.user_id);
  console.log('Is New User:', result.isNewUser);
} else if (result.isDuplicate) {
  // Email already registered with different provider
  console.log('Email already exists:', result.existingEmail);
}
```

---

### Google OAuth

**Step 1: Initiate OAuth Flow**

```javascript
import { initiateGoogleOAuth } from 'lib/auth.js';

const result = await initiateGoogleOAuth('Host');
// Redirects to Google for authentication
```

**Step 2: Handle OAuth Callback**

User is redirected back to `/account-profile` with valid Supabase session.

```javascript
import { handleGoogleOAuthCallback } from 'lib/auth.js';

const result = await handleGoogleOAuthCallback();

if (result.success) {
  // User created or logged in
  console.log('User ID:', result.data.user_id);
  console.log('Is New User:', result.isNewUser);
}
```

---

### OAuth Login (Existing Users)

For existing users who previously signed up with OAuth:

**LinkedIn**:
```javascript
import { initiateLinkedInOAuthLogin } from 'lib/auth.js';

const result = await initiateLinkedInOAuthLogin();
// Redirects to LinkedIn, then back to current page

// Handle callback
const loginResult = await handleLinkedInOAuthLoginCallback();

if (loginResult.userNotFound) {
  // No account found with this LinkedIn email
  console.log('No account found. Please sign up first.');
}
```

**Google**:
```javascript
import { initiateGoogleOAuthLogin } from 'lib/auth.js';

const result = await initiateGoogleOAuthLogin();
// Redirects to Google, then back to current page

// Handle callback
const loginResult = await handleGoogleOAuthLoginCallback();

if (loginResult.userNotFound) {
  // No account found with this Google email
  console.log('No account found. Please sign up first.');
}
```

---

## Password Reset

### Request Password Reset

**Endpoint**: `POST /functions/v1/auth-user`

**Action**: `request_password_reset`

**Request**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'request_password_reset',
    payload: {
      email: 'user@example.com',
      redirectTo: `${window.location.origin}/reset-password`
    }
  })
});

const { success, data, error } = await response.json();

// ALWAYS returns success to prevent email enumeration
console.log(data.message);
// "If an account with that email exists, a password reset link has been sent."
```

**Security Note**: Always returns success, even if email doesn't exist. This prevents email enumeration attacks.

---

### Update Password

**Endpoint**: `POST /functions/v1/auth-user`

**Action**: `update_password`

**Prerequisite**: User must have active session from password reset link (PASSWORD_RECOVERY event).

**Request**:
```javascript
// Get current session from PASSWORD_RECOVERY event
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'update_password',
    payload: {
      password: 'new_password123',
      access_token: session.access_token
    }
  })
});

const { success, data, error } = await response.json();
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Password updated successfully."
  }
}
```

**Post-Update**: User remains logged in with existing session.

---

## Magic Link Authentication

### Send Magic Link

**Endpoint**: `POST /functions/v1/magic-login-links`

**Action**: `send`

**Request**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/magic-login-links`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'send',
    payload: {
      phoneNumber: '+1234567890'
    }
  })
});

const { success, data, error } = await response.json();
```

**What Happens**:
1. SMS sent with magic link
2. Link contains one-time token
3. User clicks link → authenticated session

---

## Authenticated Requests

### Making Authenticated Requests

All authenticated requests must include the JWT token in the Authorization header:

```javascript
const access_token = getAuthToken(); // From secure storage

const response = await fetch(`${SUPABASE_URL}/functions/v1/proposal`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`,
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'create',
    payload: { /* proposal data */ }
  })
});
```

---

### Authentication in Edge Functions

Edge Functions can validate authentication using Supabase Auth:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Edge Function code
const authHeader = req.headers.get('Authorization');
let user = null;

if (authHeader) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user: authUser } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  user = authUser;
}

// Require authentication
if (!user) {
  return new Response(
    JSON.stringify({ success: false, error: 'Authentication required' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}

// User is authenticated - proceed with request
console.log('Authenticated user:', user.id);
```

---

## Protected Pages

### Checking Protected Pages

Frontend can check if current page requires authentication:

```javascript
import { isProtectedPage } from 'lib/auth.js';
import { checkAuthStatus } from 'lib/auth.js';

if (isProtectedPage()) {
  const isAuthenticated = await checkAuthStatus();

  if (!isAuthenticated) {
    // Redirect to login with return URL
    window.location.href = `/signup-login?returnTo=${encodeURIComponent(window.location.pathname)}`;
  }
}
```

**Protected Pages**:
- `/guest-proposals`
- `/host-proposals`
- `/account-profile`
- `/host-dashboard`
- `/self-listing`
- `/listing-dashboard`
- `/host-overview`
- `/favorite-listings`
- `/rental-application`
- `/preview-split-lease`

---

## Token Management

### Token Refresh

Supabase Auth automatically refreshes tokens when they expire:

```javascript
import { supabase } from 'lib/supabase.js';

// Supabase client handles token refresh automatically
// When access_token expires, it uses refresh_token to get a new one

// Get current session
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  console.log('Access Token:', session.access_token);
  console.log('Expires At:', new Date(session.expires_at * 1000));
}
```

---

### Token Storage

Tokens are stored using encrypted localStorage:

```javascript
import { setAuthToken, getAuthToken, setSessionId, getSessionId } from 'lib/auth.js';

// Store tokens (encrypted)
setAuthToken(access_token);
setSessionId(user_id);

// Retrieve tokens (decrypted)
const token = getAuthToken();
const userId = getSessionId();
```

**Security**: Tokens are encrypted using AES encryption before storing in localStorage.

---

## User Types

Split Lease supports two user types:

- **Guest**: Users looking to rent properties
- **Host**: Users listing properties for rent

**Checking User Type**:
```javascript
import { getUserType } from 'lib/auth.js';

const userType = getUserType(); // 'Host' or 'Guest'

if (userType === 'Host') {
  // Show host-specific features
} else if (userType === 'Guest') {
  // Show guest-specific features
}
```

---

## Session Validation

### Frontend Session Check

```javascript
import { checkAuthStatus } from 'lib/auth.js';

const isAuthenticated = await checkAuthStatus();

if (isAuthenticated) {
  console.log('User is logged in');
} else {
  console.log('User is not logged in');
}
```

**What It Checks**:
1. Split Lease cookies (legacy Bubble auth)
2. Supabase Auth session (native Supabase signups)
3. Secure storage tokens (legacy auth)

---

### Backend Token Validation

```javascript
// Edge Function validates token
const { data, error } = await supabase.functions.invoke('auth-user', {
  body: {
    action: 'validate',
    payload: {
      token: access_token,
      user_id: user_id
    }
  }
});

if (data.success) {
  // Token is valid
  console.log('User data:', data.data);
} else {
  // Token is invalid or expired
  console.log('Validation failed:', data.error);
}
```

---

## Error Handling

### Authentication Errors

**Invalid Credentials**:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**User Not Found**:
```json
{
  "success": false,
  "error": "No account found with this email"
}
```

**Token Expired**:
```json
{
  "success": false,
  "error": "Token has expired. Please log in again."
}
```

**OAuth Provider Mismatch**:
```json
{
  "success": false,
  "error": "This email is already registered with a different sign-in method",
  "isDuplicate": true,
  "existingEmail": "user@example.com"
}
```

---

## Security Best Practices

### 1. Never Expose Tokens in URLs

Tokens should never be passed in query parameters or URL fragments.

**Bad**:
```javascript
window.location.href = `/page?token=${access_token}`;
```

**Good**:
```javascript
await supabase.auth.setSession({ access_token, refresh_token });
window.location.href = '/page';
```

---

### 2. Use HTTPS Always

All authentication requests must use HTTPS.

---

### 3. Validate Tokens on Every Request

Don't cache authentication state. Validate tokens on each protected request.

---

### 4. Implement Proper Logout

Clear all tokens and session data on logout:

```javascript
import { clearAuthData } from 'lib/auth.js';

await supabase.auth.signOut();
clearAuthData();
```

---

### 5. Handle Token Expiration Gracefully

When token expires, redirect to login with helpful message:

```javascript
try {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (response.status === 401) {
    // Token expired - redirect to login
    window.location.href = '/signup-login?session=expired';
  }
} catch (error) {
  console.error('Request failed:', error);
}
```

---

## Testing Authentication

### Test User Login

```javascript
// Use test credentials
const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'login',
    payload: {
      email: 'test@example.com',
      password: 'test123'
    }
  })
});
```

### Test Token Validation

```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${test_token}`,
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'validate',
    payload: {
      token: test_token,
      user_id: 'test_user_id'
    }
  })
});
```

---

## Migration Notes

### Legacy Bubble Auth

Split Lease is migrating from Bubble auth to Supabase Auth. During migration:

1. **Legacy users**: Authenticated via Bubble tokens in secure storage
2. **New users**: Authenticated via Supabase Auth
3. **Compatibility**: Both systems work in parallel

**Checking Auth Method**:
```javascript
// Check for Supabase session
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  // Native Supabase Auth
  console.log('Supabase Auth user:', session.user.id);
} else {
  // Legacy Bubble auth (check secure storage)
  const token = getAuthToken();
  if (token) {
    console.log('Legacy Bubble auth user');
  }
}
```

---

## See Also

- [Edge Functions Reference](../edge-functions/README.md)
- [Database Schema](../database/README.md)
- [Code Examples](../examples/README.md)
