# Implementation Plan: OAuth Session Persistence on Localhost

**PLAN ID**: 20260127085054
**TYPE**: BUILD
**CLASSIFICATION**: Single-file modification, environment-aware configuration
**CREATED**: 2026-01-27T08:50:54

---

## Executive Summary

Fix LinkedIn OAuth session persistence issue on localhost by implementing environment-aware session storage strategy in the Supabase client configuration. The root cause is that Supabase defaults to secure cookie storage, which browsers reject on HTTP (localhost:8000), causing sessions to fail persistence even after successful OAuth authentication.

---

## Problem Statement

### Current Behavior
- LinkedIn OAuth authentication succeeds on `http://localhost:8000`
- OAuth callback returns valid session tokens
- Session does NOT persist after successful login
- User appears logged out on page reload or navigation

### Root Cause
- Supabase client defaults to cookie-based session storage with `Secure` flag
- Browsers reject `Secure` cookies on HTTP connections (localhost)
- Session tokens are returned by OAuth but never persisted to storage
- Production HTTPS deployment (splitlease.nyc) is unaffected

### Current Code Location
```javascript
// app/src/lib/supabase.js (lines 10-13)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

No storage configuration is specified, so Supabase uses default cookie storage with `Secure` flag.

---

## Solution Design

### Strategy: Environment-Aware Storage Selection

Configure Supabase client to conditionally choose storage mechanism based on environment:

| Environment | Protocol | Storage Mechanism | Rationale |
|------------|----------|-------------------|-----------|
| **Localhost** | HTTP (`http://localhost:*`) | `localStorage` | Bypasses secure cookie requirement, allows session persistence on HTTP |
| **Production** | HTTPS (splitlease.nyc) | Default (cookies) | Maintains secure cookie storage, no changes to production behavior |

### Detection Logic

Use browser environment detection to identify localhost:

```javascript
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1');
```

### Storage Configuration

Pass `auth` options to `createClient` to override storage:

```javascript
const clientOptions = isLocalhost
  ? {
      auth: {
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  : undefined; // Use Supabase defaults for production

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);
```

---

## Implementation Steps

### Step 1: Modify Supabase Client Configuration

**File**: `app/src/lib/supabase.js`

**Changes**:
1. Add environment detection logic before `createClient` call
2. Define conditional client options based on environment
3. Pass options to `createClient` only on localhost
4. Add explanatory comments documenting the rationale

**Code Changes**:

```javascript
// BEFORE (lines 10-13)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// AFTER
// Environment-aware session storage:
// - Localhost (HTTP): Use localStorage to avoid Secure cookie rejection
// - Production (HTTPS): Use default cookie storage for security
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1');

const clientOptions = isLocalhost
  ? {
      auth: {
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  : undefined; // Production uses secure cookies (default)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);
```

### Step 2: Test Implementation

**Test Cases**:

1. **Localhost OAuth Flow**:
   - Navigate to `http://localhost:8000`
   - Initiate LinkedIn OAuth signup
   - Complete OAuth on LinkedIn
   - Verify redirect back to localhost
   - **Verify**: Session persists in `localStorage` (key: `supabase.auth.token`)
   - **Verify**: User remains logged in after page reload
   - **Verify**: User remains logged in after navigation to different page

2. **Production OAuth Flow** (Verification):
   - Deploy to production (splitlease.nyc)
   - Initiate LinkedIn OAuth signup
   - Complete OAuth on LinkedIn
   - **Verify**: Session persists in cookies (not localStorage)
   - **Verify**: Secure flag is set on cookies
   - **Verify**: User remains logged in after page reload

3. **Existing Auth Flows** (Regression Test):
   - Test email/password login on localhost
   - Test email/password login on production
   - **Verify**: No regression in existing auth flows

---

## Technical Considerations

### Security

**Localhost**:
- Using `localStorage` on localhost is **acceptable** because:
  - Localhost is a development environment
  - No production data is at risk
  - XSS attacks on localhost require local machine access (already compromised)

**Production**:
- Continues using secure cookies with `Secure` and `HttpOnly` flags
- No security degradation from this change
- Production behavior is unchanged

### Browser Compatibility

- `localStorage` is supported in all modern browsers
- `window.location.hostname` is universally supported
- No polyfills or fallbacks required

### Edge Cases

1. **127.0.0.1 vs localhost**: Both hostnames are detected
2. **Custom ports**: Detection works regardless of port (`:8000`, `:3000`, etc.)
3. **Server-Side Rendering**: Check for `typeof window !== 'undefined'` prevents SSR errors
4. **Production localhost**: Not applicable (production URL is `splitlease.nyc`)

### Performance

- **No impact**: Environment detection runs once at module initialization
- **No runtime overhead**: Storage choice is static after initialization

---

## Validation Criteria

### Success Criteria

1. ✅ LinkedIn OAuth sessions persist on localhost after successful authentication
2. ✅ Sessions persist across page reloads on localhost
3. ✅ Sessions persist across navigation on localhost
4. ✅ Production HTTPS continues using secure cookie storage
5. ✅ No regression in email/password authentication flows
6. ✅ No console errors related to session storage

### Failure Criteria

- ❌ Session still doesn't persist on localhost after OAuth
- ❌ Production switches to localStorage (incorrect)
- ❌ Existing auth flows break
- ❌ Console errors about storage

---

## Rollback Plan

### If Implementation Fails

**Rollback Action**: Revert `app/src/lib/supabase.js` to original state

**Original Code**:
```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Rollback Steps**:
1. Remove environment detection logic
2. Remove client options configuration
3. Restore single-line `createClient` call
4. Commit rollback

**Recovery Time**: < 5 minutes

---

## Alternative Approaches Considered

### Alternative 1: Use HTTPS on Localhost

**Description**: Configure localhost to use HTTPS with self-signed certificates

**Rejected Because**:
- Adds complexity to local development setup
- Requires certificate generation and trust configuration
- Browser security warnings for self-signed certificates
- Not necessary when simpler solution exists

### Alternative 2: Disable Secure Flag Globally

**Description**: Configure Supabase to not set `Secure` flag on cookies

**Rejected Because**:
- Would degrade production security
- Not supported by Supabase client configuration
- Violates security best practices

### Alternative 3: Proxy Localhost Through HTTPS

**Description**: Use ngrok or similar tool to proxy localhost through HTTPS

**Rejected Because**:
- External dependency for local development
- Adds latency and complexity
- Not sustainable for all developers

---

## Dependencies

### External Dependencies
- None

### Internal Dependencies
- `app/src/lib/supabase.js` (modification target)
- Supabase client library (already installed)

### Environment Variables
- `VITE_SUPABASE_URL` (already configured)
- `VITE_SUPABASE_ANON_KEY` (already configured)

---

## Impact Analysis

### Files Modified
1. `app/src/lib/supabase.js` (1 file)

### Files Impacted (No Changes Required)
- All files importing from `app/src/lib/supabase.js` (behavior unchanged)
- OAuth callback handlers in `app/src/lib/auth.js` (no changes needed)
- All page components using Supabase client (no changes needed)

### Deployment Impact
- **Zero**: Production behavior is unchanged
- **Dev**: Requires clearing existing stale cookies/localStorage before testing

---

## Testing Checklist

### Pre-Implementation
- [ ] Confirm current behavior: OAuth succeeds but session doesn't persist on localhost
- [ ] Backup current `app/src/lib/supabase.js` file

### During Implementation
- [ ] Modify `app/src/lib/supabase.js` per Step 1
- [ ] Verify no syntax errors
- [ ] Verify Vite dev server starts successfully

### Post-Implementation
- [ ] Test Case 1: LinkedIn OAuth on localhost
- [ ] Test Case 2: Session persistence on localhost (reload)
- [ ] Test Case 3: Session persistence on localhost (navigation)
- [ ] Test Case 4: Email/password login on localhost (regression)
- [ ] Test Case 5: Production deployment verification (if possible)

### Cleanup
- [ ] Clear localStorage before final test
- [ ] Verify no console warnings/errors
- [ ] Commit changes with descriptive message

---

## Documentation Updates

### Code Comments
- Add inline comments in `app/src/lib/supabase.js` explaining environment detection
- Document storage choice rationale

### No External Documentation Updates Required
- This is an internal fix, not a user-facing feature
- No README or CLAUDE.md updates needed

---

## Post-Implementation Actions

1. **Commit Changes**:
   ```bash
   git add app/src/lib/supabase.js
   git commit -m "[FIX] Environment-aware Supabase session storage for localhost OAuth persistence"
   ```

2. **Test on Production** (if deployment pipeline allows):
   - Verify no regression in production OAuth flows
   - Confirm secure cookies are still used

3. **Monitor**:
   - Watch for any session-related issues in production
   - Check Slack/error logs for related errors

4. **Move Plan to Done**:
   - Move this file from `.claude/plans/New/` to `.claude/plans/Done/`

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|---------|------------|
| Production switches to localStorage | Low | High | Environment detection explicitly checks hostname |
| Existing auth flows break | Low | High | Minimal changes, only adding optional config |
| Session still doesn't persist | Low | Medium | Rollback to original code, investigate alternative solutions |
| Security degradation | Very Low | High | Production behavior unchanged, localhost-only change |

**Overall Risk**: **LOW**

---

## Referenced Files

### Primary Target
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\src\lib\supabase.js`

### Related Context Files
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\src\lib\auth.js`
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\src\lib\oauthCallbackHandler.js`

### Documentation Files
- `c:\Users\Split Lease\Documents\Split Lease - Team\.claude\CLAUDE.md`
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\CLAUDE.md`
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\src\CLAUDE.md`

---

## Appendix: Technical Context

### Supabase Client Storage Options

Supabase client supports multiple storage backends:

1. **Cookie Storage** (default):
   - Uses `document.cookie` with `Secure`, `HttpOnly`, `SameSite` flags
   - Requires HTTPS for `Secure` flag to work
   - Best for production security

2. **localStorage**:
   - Uses `window.localStorage`
   - Works on HTTP and HTTPS
   - Accessible to JavaScript (no `HttpOnly`)
   - Acceptable for local development

3. **Custom Storage**:
   - Implement custom storage adapter
   - Overkill for this use case

### OAuth Callback Flow

1. User clicks "Sign up with LinkedIn"
2. `initiateLinkedInOAuth()` calls `supabase.auth.signInWithOAuth()`
3. Redirect to LinkedIn OAuth consent screen
4. User approves, LinkedIn redirects back to `redirectTo` URL with code
5. Supabase client exchanges code for session tokens
6. **CRITICAL**: Supabase client persists session to storage
7. `handleLinkedInOAuthCallback()` retrieves session via `getSession()`

**Current Issue**: Step 6 fails on localhost because cookie storage with `Secure` flag is rejected by browser on HTTP.

**Fix**: Use localStorage on localhost to bypass cookie security requirements.

---

**PLAN STATUS**: Ready for execution
**ESTIMATED TIME**: 15 minutes (implementation + testing)
**COMPLEXITY**: Low
