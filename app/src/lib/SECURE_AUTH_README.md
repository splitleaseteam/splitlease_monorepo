# Secure Authentication Storage System

## Overview

Split Lease now uses a **secure, encrypted storage system** for authentication tokens. This improves security by:

1. **Encrypting tokens** using AES-GCM encryption
2. **Using localStorage** with encryption (tokens encrypted at rest)
3. **Publishing only state** (not tokens) to the rest of the application
4. **Reducing session duration** from 24 hours to 1 hour

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     APPLICATION                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Can Access:                                           │
│  ✅ getAuthState() → boolean                           │
│  ✅ getUserId() → string (user ID)                     │
│  ✅ getUserType() → 'Host' | 'Guest'                   │
│  ✅ isSessionValid() → boolean                         │
│                                                         │
│  Cannot Access:                                        │
│  ❌ Raw tokens (encrypted in localStorage)           │
│  ❌ Session IDs (encrypted in localStorage)          │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
                          │ Uses public API only
                          │
┌─────────────────────────────────────────────────────────┐
│                    auth.js                              │
│             (Internal Token Management)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  getAuthToken() → Promise<string>                      │
│  getSessionId() → Promise<string>                      │
│                                                         │
│  ⬇️ Uses secureStorage.js                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
                          │ Encrypted storage layer
                          │
┌─────────────────────────────────────────────────────────┐
│                secureStorage.js                         │
│          (Encryption & Storage Management)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  localStorage (encrypted, persists until logout):    │
│  - __sl_at__  → Encrypted auth token                   │
│  - __sl_sid__ → Encrypted session/user ID              │
│  - __sl_rd__  → Encrypted refresh data (future)        │
│                                                         │
│  localStorage (public state, non-sensitive):           │
│  - sl_auth_state     → 'true' | 'false'                │
│  - sl_user_id        → user ID (public identifier)     │
│  - sl_user_type      → 'Host' | 'Guest'                │
│  - sl_session_valid  → 'true' | 'false'                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Key Changes

### Before (Insecure)

```javascript
// ❌ OLD: Tokens stored in plaintext localStorage
localStorage.getItem('splitlease_auth_token'); // Anyone can read this!
localStorage.getItem('splitlease_session_id'); // Not secure

// ❌ OLD: 24-hour sessions
const sessionValid = (Date.now() - lastAuth) < 86400000;
```

### After (Secure)

```javascript
// ✅ NEW: Tokens encrypted in localStorage
const token = await getAuthToken(); // Returns decrypted token only when needed
const sessionId = await getSessionId(); // Encrypted at rest

// ✅ NEW: Supabase Auth manages token expiry
// Client validates on every API request - Supabase Auth rejects expired tokens

// ✅ NEW: Only state exposed to app
const isAuthenticated = getAuthState(); // Returns boolean, no tokens
const userId = getUserId(); // Returns user ID (public identifier)
const userType = getUserType(); // Returns 'Host' or 'Guest', no sensitive data
```

## How It Works

### 1. **Encryption**

Tokens are encrypted using **AES-GCM** with a per-session key:

```javascript
// Generate unique encryption key per session
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

// Encrypt token with random IV
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  token
);
```

### 2. **Storage Locations**

| Data Type | Storage | Visibility | Lifetime |
|-----------|---------|------------|----------|
| Auth Token | localStorage (encrypted) | Internal only | Until logout |
| Session ID | localStorage (encrypted) | Internal only | Until logout |
| Auth State | localStorage (plaintext) | Public | Until logout or Supabase Auth token expiry |
| User ID | localStorage (plaintext) | **Public** | Until logout |
| User Type | localStorage (plaintext) | **Public** | Until logout |

### 3. **Session Management**

Sessions are managed entirely by **Supabase Auth API token expiry**:

```javascript
// Supabase Auth handles token expiry - we validate on each request
const userData = await validateTokenAndFetchUser();
if (!userData) {
  // Token expired or invalid - Supabase Auth rejected it
  clearAuthData();
  redirectToLogin();
}
```

No client-side session expiration is performed - the server validates tokens on each request.

## Usage Guide

### For Application Code (UI Components)

**✅ DO:**

```javascript
import { getAuthState, getUserId, getUserType } from './lib/auth.js';

// Check if user is authenticated
const isAuthenticated = getAuthState();

// Get user ID (public, non-sensitive identifier)
const userId = getUserId(); // e.g., '1234567890'

// Get user type for UI rendering
const userType = getUserType(); // 'Host' or 'Guest'

// Check session validity
const isValid = isSessionValid();
```

**❌ DON'T:**

```javascript
// ❌ Don't try to access tokens directly
const token = localStorage.getItem('splitlease_auth_token'); // Won't work

// ❌ Don't access localStorage directly
const token = localStorage.getItem('__sl_at__'); // Encrypted, useless

// ❌ Don't try to decrypt tokens in app code
const token = await getAuthToken(); // Only for internal auth.js use
```

### For Auth Functions (Internal Use)

**Only `auth.js` should access tokens:**

```javascript
// Inside auth.js only
export async function validateTokenAndFetchUser() {
  // ✅ OK to get token here (internal to auth module)
  const token = await getAuthToken();
  const userId = await getSessionId();

  // Use for API calls
  const response = await fetch(API_ENDPOINT, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // Update activity on successful validation
  updateLastActivity();
}
```

### Login/Signup Flow

```javascript
import { loginUser, setAuthState } from './lib/auth.js';

async function handleLogin(email, password) {
  const result = await loginUser(email, password);

  if (result.success) {
    // Tokens are automatically stored (encrypted)
    // State is automatically set
    window.location.reload(); // Refresh to load authenticated UI
  } else {
    showError(result.error);
  }
}
```

### Logout Flow

```javascript
import { logoutUser } from './lib/auth.js';

async function handleLogout() {
  await logoutUser();
  // Clears both encrypted tokens AND public state
  window.location.href = '/';
}
```

## Security Benefits

### 1. **XSS Protection (Improved)**

**Before:**
- Tokens in localStorage accessible to any JavaScript
- XSS attack could steal tokens easily

**After:**
- Tokens encrypted in localStorage
- Even if XSS reads storage, gets encrypted gibberish
- Encryption key exists only in memory (not stored)

### 2. **Token Expiry (Managed by Supabase Auth)**

**Before:**
- Client-side 24-hour expiry check
- No server validation on expiry

**After:**
- **Supabase Auth API manages token expiry**
- Client validates tokens on every request
- Invalid/expired tokens immediately rejected
- Forces re-authentication when Supabase Auth says token is invalid

### 3. **Storage Isolation**

**Before:**
- Everything in localStorage (persists forever)
- Tokens survive browser restart

**After:**
- Sensitive data in localStorage (encrypted, persists until logout)
- Public state in localStorage (for convenience)
- Clear separation of concerns

### 4. **Minimal Token Exposure**

**Before:**
- Tokens accessed frequently throughout app
- High risk of accidental logging/exposure

**After:**
- Tokens accessed only by auth module
- Rest of app uses state booleans
- Reduced attack surface

## Migration from Legacy Storage

The system automatically migrates old localStorage tokens:

```javascript
// Called on first checkAuthStatus()
const migrated = await migrateFromLegacyStorage();

if (migrated) {
  // Old tokens found in localStorage
  // → Encrypted and stored in localStorage
  // → Old keys deleted
  // → State keys created
}
```

**Migration happens once per session** (when tab opens).

## Potential Future Enhancements

- Token refresh mechanism (auto-refresh before expiry)
- CSRF protection (X-CSRF-Token header)
- HttpOnly cookies via Cloudflare Worker (server-side cookie management)
- Cloudflare Worker auth proxy (rate limiting, anomaly detection)
- Multi-Factor Authentication (TOTP, SMS/email)
- Session management UI (active sessions, logout from all devices)

## Troubleshooting

### Issue: User keeps getting logged out

**Check:**
1. Supabase Auth token expiry - is the token actually expired?
2. Browser privacy settings - blocking localStorage?
3. Manual logout - was localStorage cleared properly?
4. Validate token with Supabase Auth API to check if it's still valid

**Solution:**
If the user is being logged out unexpectedly, check that the Supabase Auth token has not expired. Tokens in localStorage persist across refreshes, so unexpected logouts typically indicate server-side token rejection.

### Issue: Migration not working

**Check:**
1. Do old localStorage keys exist?
2. Are crypto APIs available? (HTTPS required)

**Debug:**
```javascript
import { migrateFromLegacyStorage } from './lib/secureStorage.js';

// Check migration manually
const migrated = await migrateFromLegacyStorage();
console.log('Migration:', migrated);
```

### Issue: Tokens not decrypting

**Possible Causes:**
1. Page refresh (encryption key lost)
2. localStorage cleared manually
3. Browser privacy mode

**Solution:**
This is expected behavior. User needs to log in again. Consider implementing token refresh with HttpOnly cookies for persistence.

## Testing

### Manual Testing

```javascript
// Open browser console
import { __DEV__ } from './lib/secureStorage.js';

// Test encryption
await __DEV__.checkEncryption();

// View stored tokens (dev only, REMOVE IN PRODUCTION)
const tokens = await __DEV__.dumpSecureStorage();
console.log('Tokens:', tokens);
```

### Unit Tests

Unit tests for encryption/decryption should cover:
- Token encryption (localStorage value differs from plaintext)
- Token decryption (round-trip returns original value)
- Legacy storage migration

## Best Practices

### ✅ DO:

1. Use `getAuthState()` for UI conditionals
2. Let `auth.js` handle token management
3. Check `isSessionValid()` before sensitive operations
4. Clear auth data on logout

### ❌ DON'T:

1. Access localStorage directly
2. Try to decrypt tokens in app code
3. Store sensitive data in localStorage
4. Bypass auth state checks
5. Log tokens to console (even in dev)

## Support

For questions or issues:
1. Check this README
2. Review `secureStorage.js` inline comments
3. Review `auth.js` inline comments
4. Contact the development team

---

**Last Updated:** 2026-02-10
**Version:** 1.0.0
**Status:** ✅ Production Ready
