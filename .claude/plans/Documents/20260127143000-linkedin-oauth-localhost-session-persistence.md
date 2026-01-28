# LinkedIn OAuth Localhost Session Persistence Analysis

**Created**: 2026-01-27 14:30:00
**Issue**: OAuth login succeeds but session doesn't persist on localhost

---

## Executive Summary

The LinkedIn OAuth login on localhost fails to persist the session because **Supabase Auth uses cookies with the `Secure` attribute by default**, which are only sent over HTTPS connections. On `localhost` (HTTP), the browser blocks these cookies, preventing session persistence.

---

## Root Cause Analysis

### The Problem Flow

1. User initiates LinkedIn OAuth login on `http://localhost:8000`
2. OAuth redirect completes successfully to LinkedIn
3. LinkedIn redirects back with authorization code/tokens in URL
4. `oauthCallbackHandler.js` detects the OAuth callback and processes it
5. Supabase client receives the session tokens
6. **Supabase attempts to store session in a cookie with `Secure` attribute**
7. Browser rejects the cookie because the page is served over HTTP
8. `getSession()` returns null because the cookie was never stored
9. Header shows "User not authenticated"

### Console Log Sequence (Observed)

```
[OAuth] Detected LinkedIn OAuth login callback, processing...
[OAuth] LinkedIn login callback processed successfully
[Header] No immediate Supabase session, waiting briefly for initialization...
[Header] User not authenticated
```

The key insight: The OAuth callback **does process successfully** (line 2), but when the Header component tries to retrieve the session using `getSession()`, it returns null because Supabase couldn't persist the cookies.

---

## Technical Deep Dive

### 1. Supabase Client Configuration (`app/src/lib/supabase.js`)

```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

The Supabase client is initialized with **default settings**, which means:
- Session storage: Uses browser's localStorage for tokens, but cookies for session state
- Cookie attributes: `Secure=true`, `SameSite=Lax` by default
- No custom storage adapter is configured

### 2. How Supabase Stores Sessions (Default Behavior)

Per Supabase documentation:
> "The default behavior if you're not using SSR is to store this information in local storage."

However, there's a nuance:
- **Access token and refresh token**: Stored in localStorage under key `sb-<project-ref>-auth-token`
- **Session cookies**: Supabase also sets cookies for session management with `Secure` attribute

### 3. The `Secure` Cookie Problem on Localhost

From Supabase docs on `SameSite`:
> "Cookies typically require the `Secure` attribute, which only sends them over HTTPS. However, this can be a problem when developing on `localhost`."

Modern browsers (Chrome, Firefox, Safari) enforce:
- `Secure` cookies are only sent over HTTPS
- Exception: Some browsers allow `Secure` cookies on `localhost` but **only if using HTTPS localhost**

### 4. OAuth Callback Handler (`oauthCallbackHandler.js`)

```javascript
// Wait a moment for Supabase to process the OAuth tokens from URL hash
await new Promise(resolve => setTimeout(resolve, 100));

// Now call the appropriate handler
const result = await handleLinkedInOAuthLoginCallback();
```

The 100ms delay assumes Supabase has time to process and store the session, but if cookies are blocked, the session is never stored.

### 5. Header Session Check (`Header.jsx` lines 91-99)

```javascript
if (!hasSupabaseSession) {
  console.log('[Header] No immediate Supabase session, waiting briefly for initialization...');
  await new Promise(resolve => setTimeout(resolve, 200));
  const { data: retryData } = await supabase.auth.getSession();
  session = retryData?.session;
  // ...
}
```

Even with the 200ms wait, `getSession()` returns null because the session cookie was never stored.

### 6. The Verification Loop in `auth.js` (Lines 569-585)

```javascript
// CRITICAL: Verify the session is actually persisted before proceeding
let verifyAttempts = 0;
const maxVerifyAttempts = 5;
while (verifyAttempts < maxVerifyAttempts) {
  const { data: { session: verifiedSession } } = await supabase.auth.getSession();
  if (verifiedSession && verifiedSession.access_token === access_token) {
    logger.debug('✅ Session verified and persisted');
    break;
  }
  verifyAttempts++;
  await delay(100);
}
```

This loop tries to verify session persistence, but it will **always fail** on HTTP localhost because the session cookie cannot be stored.

---

## Why It Works on Production

On `https://splitlease.com`:
1. Page is served over HTTPS
2. Supabase sets session cookie with `Secure` attribute
3. Browser accepts the cookie (HTTPS matches `Secure` requirement)
4. `getSession()` returns the valid session
5. User appears authenticated

---

## Solutions

### Option 1: Use HTTPS on Localhost (Recommended)

Configure Vite to serve over HTTPS in development:

```javascript
// vite.config.js
import fs from 'fs';
import path from 'path';

export default {
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/localhost.pem')),
    },
    port: 8000,
  },
};
```

Generate certificates using `mkcert`:
```bash
# Install mkcert
choco install mkcert  # Windows
brew install mkcert   # macOS

# Generate certificates
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

**Pros**: Most production-like environment, no code changes needed
**Cons**: Requires certificate setup, may cause browser warnings

### Option 2: Configure Custom Storage Adapter

Override Supabase's default storage to use localStorage exclusively:

```javascript
// app/src/lib/supabase.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => {
        return Promise.resolve(localStorage.getItem(key));
      },
      setItem: (key, value) => {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key) => {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
    },
    // Disable auto-refresh token to avoid cookie issues
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

**Pros**: Works on HTTP localhost without HTTPS setup
**Cons**: Differs from production behavior, may mask other issues

### Option 3: Use `localhost` with HTTPS Tunnel (ngrok)

```bash
ngrok http 8000
```

Then use the ngrok HTTPS URL for OAuth redirect.

**Pros**: Quick to set up, no code changes
**Cons**: Requires external service, URL changes each session

### Option 4: Browser-Specific Workaround

Chrome has a flag to allow insecure cookies on localhost:
```
chrome://flags/#allow-insecure-localhost
```

**Pros**: Zero code changes
**Cons**: Only works in Chrome, requires manual flag setting, not recommended for team development

---

## Recommended Approach

**For this codebase, implement Option 2 (Custom Storage Adapter)** with environment detection:

```javascript
// app/src/lib/supabase.js
const isLocalDevelopment = import.meta.env.DEV && window.location.protocol === 'http:';

const authConfig = isLocalDevelopment
  ? {
      auth: {
        storage: {
          getItem: (key) => Promise.resolve(localStorage.getItem(key)),
          setItem: (key, value) => {
            localStorage.setItem(key, value);
            return Promise.resolve();
          },
          removeItem: (key) => {
            localStorage.removeItem(key);
            return Promise.resolve();
          },
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  : {};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, authConfig);
```

This approach:
1. Detects HTTP development environment
2. Uses localStorage-only storage on localhost
3. Uses default behavior (with cookies) in production
4. Requires no infrastructure changes

---

## Files Involved

| File | Role |
|------|------|
| `app/src/lib/supabase.js` | Supabase client initialization |
| `app/src/lib/oauthCallbackHandler.js` | OAuth callback detection and processing |
| `app/src/lib/auth.js` | OAuth flow handlers, session verification |
| `app/src/islands/shared/Header.jsx` | Session state checking in UI |
| `app/src/lib/secureStorage.js` | Custom auth state storage |

---

## Testing Checklist

After implementing the fix:

1. [ ] LinkedIn OAuth login on localhost (HTTP) - session persists
2. [ ] LinkedIn OAuth login on production (HTTPS) - session persists
3. [ ] Google OAuth login on localhost - session persists
4. [ ] Google OAuth login on production - session persists
5. [ ] Email/password login on localhost - works as before
6. [ ] Session survives page refresh on localhost
7. [ ] Logout works correctly on localhost
8. [ ] Session timeout works correctly

---

## References

- [Supabase SSR Advanced Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Supabase User Sessions](https://supabase.com/docs/guides/auth/sessions)
- [MDN: SameSite Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Chromium Secure Cookie Policies](https://www.chromium.org/updates/same-site/)
