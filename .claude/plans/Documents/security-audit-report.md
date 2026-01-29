# Security Audit Report - Split Lease

**Generated**: 2026-01-28
**Auditor**: Claude Opus 4.5 (Automated Security Audit)
**Scope**: Full codebase security review (Frontend, Edge Functions, Configuration)
**Project**: Split Lease - React 18 + Vite Islands Architecture | Supabase Edge Functions | Cloudflare Pages

---

## Executive Summary

| Severity | Count |
|----------|-------|
| **Critical** | 2 |
| **High** | 4 |
| **Medium** | 6 |
| **Low / Recommendations** | 8 |

### Risk Overview

The Split Lease codebase demonstrates several good security practices, including:
- API keys stored server-side in Supabase Secrets (not exposed in frontend)
- Edge Functions acting as a proxy for backend API calls
- Input validation utilities in place
- RLS policies configured for storage buckets

However, critical issues exist that require immediate attention, primarily around **unprotected internal/admin pages** and **CORS misconfiguration**.

---

## Critical Issues (Fix Immediately)

### [CRIT-001] Internal Admin Pages Have No Authentication

**Location**: `app/src/routes.config.js` (lines 415-700+), multiple internal page components

**Description**:
Over 25 internal/admin pages prefixed with `/_` (e.g., `/_emergency`, `/_admin-threads`, `/_manage-rental-applications`, `/_proposal-manage`, `/_quick-price`, `/_verify-users`, `/_simulation-admin`) are configured with `protected: false` and have **no authentication checks** in their page logic.

**Evidence**:
```javascript
// routes.config.js
{
  path: '/_emergency',
  file: 'internal-emergency.html',
  protected: false,  // NO AUTH REQUIRED
  ...
}
```

```javascript
// useInternalEmergencyPageLogic.js (line 52-56)
useEffect(() => {
  // No redirect if not authenticated - this is an internal page accessible without login
  // Just load the data directly
  loadInitialData();
}, []);
```

**Affected Pages**:
- `/_emergency` - Emergency management dashboard
- `/_admin-threads` - Admin threads management
- `/_manage-rental-applications` - Rental application management
- `/_proposal-manage` - Proposal management
- `/_quick-price` - Pricing management
- `/_verify-users` - User verification
- `/_simulation-admin` - Simulation admin
- `/_send-magic-login-links` - Magic link sender
- `/_modify-listings` - Listing modifications
- `/_message-curation` - Message curation
- `/_ai-tools` - AI tools
- `/_create-document` - Document creation
- `/_listings-overview` - Listings overview
- `/_leases-overview` - Leases overview
- And 10+ more internal tools

**Impact**:
- **Unauthorized access to sensitive user data** (PII, rental applications, emergency reports)
- **Ability to modify system data** (listings, proposals, user verification status)
- **Administrative actions** can be performed by anyone with the URL
- **Regulatory compliance violations** (GDPR, CCPA for PII exposure)

**Remediation**:
1. Set `protected: true` for ALL internal routes in `routes.config.js`
2. Add authentication checks in each internal page's logic hook
3. Implement admin role verification (not just authenticated user check)
4. Consider adding IP allowlisting or VPN requirement for admin pages

---

### [CRIT-002] Overly Permissive CORS Configuration

**Location**: `supabase/functions/_shared/cors.ts`

**Description**:
The CORS configuration allows requests from ANY origin (`*`), which enables cross-site attacks and data exfiltration.

**Evidence**:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // ALLOWS ANY WEBSITE
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};
```

**Impact**:
- Any malicious website can make authenticated requests to the API
- CSRF attacks are possible even with proper auth tokens
- Credential theft via phishing sites making API calls

**Remediation**:
1. Replace wildcard with specific allowed origins:
```typescript
const ALLOWED_ORIGINS = [
  'https://split.lease',
  'https://app.split.lease',
  'https://splitlease.pages.dev',
  'http://localhost:3000'  // Dev only
];

export function getCorsHeaders(requestOrigin: string) {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    ...
  };
}
```

---

## High Severity Issues

### [HIGH-001] XSS Vulnerability via dangerouslySetInnerHTML with Insufficient Sanitization

**Location**:
- `app/src/islands/pages/ViewSplitLeasePage/components/DescriptionSection.tsx` (line 56)
- `app/src/islands/shared/VisitReviewerHouseManual/components/ContentSection.jsx` (line 311)
- `app/src/islands/pages/ViewSplitLeasePage/components/AmenitiesGrid.tsx` (line 60)
- Multiple other files using `innerHTML =`

**Description**:
User-controlled content is rendered with `dangerouslySetInnerHTML` with basic regex-based sanitization that is easily bypassed.

**Evidence**:
```typescript
// DescriptionSection.tsx - Insufficient sanitization
const formattedDescription = useMemo(() => {
  if (!description) return '';

  // Basic HTML sanitization (remove script tags, etc.)
  const sanitized = description
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  return sanitized;
}, [description]);

// Later rendered with dangerouslySetInnerHTML
```

**Bypass Example**:
```html
<img src=x onerror="alert(document.cookie)">
<svg onload="alert('XSS')">
<body onpageshow="alert('XSS')">
```

**Impact**:
- Session hijacking via cookie theft
- Defacement of listing pages
- Phishing attacks embedded in listings
- Malware distribution

**Remediation**:
1. Use a robust HTML sanitization library (DOMPurify):
```javascript
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(description, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: []
});
```
2. Prefer text-based rendering when HTML is not required
3. Implement Content Security Policy headers

---

### [HIGH-002] Known Vulnerable Dependencies

**Location**: `app/package.json`

**Description**:
npm audit reveals multiple high-severity vulnerabilities in dependencies.

**Vulnerabilities Found**:

| Package | Severity | Issue | CVE/Advisory |
|---------|----------|-------|--------------|
| `tar` (via supabase) | High | Arbitrary File Overwrite via Path Sanitization | GHSA-8qq5-rm4j-mr97 |
| `tar` (via supabase) | High | Race Condition Path Reservation | GHSA-r6q2-hw4h-h46w |
| `tar` (via supabase) | High | Hardlink Path Traversal | GHSA-34x7-hfp2-rc4v |
| `esbuild` (via vite) | Moderate | Dev Server Request Leakage | GHSA-67mh-4wv8-2f99 |

**Impact**:
- Supply chain attacks
- Arbitrary file system access during build/development
- Development server information disclosure

**Remediation**:
1. Update Supabase CLI: `npm update supabase`
2. Update Vite to latest version: `npm update vite`
3. Run `npm audit fix` to apply automatic fixes
4. Consider enabling Dependabot or similar for continuous monitoring

---

### [HIGH-003] Sensitive API Keys Committed to Repository

**Location**:
- `app/.env.production`
- `app/.env.development`
- `.claude/Documentation/CLOUDFLARE_PAGES_ENV_CONFIG.md`

**Description**:
Google Maps API keys and Supabase anon keys are committed to the repository. While Supabase anon keys are designed to be public, the Google Maps API key should be restricted or rotated.

**Evidence**:
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCFcO3jCTvR69iA4UAxPi-sWHJ7zWPMJWo
```

**Impact**:
- API key abuse leading to unexpected billing
- Rate limit exhaustion
- Service disruption

**Remediation**:
1. Rotate the Google Maps API key immediately
2. Apply API key restrictions in Google Cloud Console:
   - HTTP referrer restrictions for production domains only
   - API restrictions to only Maps JavaScript API
3. Move sensitive keys to environment variables in CI/CD
4. Add `.env.production` and `.env.development` to `.gitignore`

---

### [HIGH-004] No CSRF Protection

**Location**: All Edge Functions and frontend API calls

**Description**:
The application does not implement CSRF tokens or other anti-CSRF measures. Combined with overly permissive CORS, this creates a significant attack vector.

**Impact**:
- Attackers can trick authenticated users into making unwanted API calls
- Actions like creating proposals, modifying listings, or changing settings can be triggered without user consent

**Remediation**:
1. Implement CSRF tokens for state-changing operations
2. Use `SameSite=Strict` or `SameSite=Lax` for cookies
3. Add `Origin` header validation in Edge Functions
4. Consider implementing Double Submit Cookie pattern

---

## Medium Severity Issues

### [MED-001] Debug Export in Production Code

**Location**: `app/src/lib/secureStorage.js` (lines 408-417)

**Description**:
A debug utility is exported that can dump all authentication tokens.

**Evidence**:
```javascript
/**
 * Export for debugging (REMOVE IN PRODUCTION)
 */
export const __DEV__ = {
  dumpSecureStorage() {
    return {
      token: getAuthToken(),
      sessionId: getSessionId(),
      refreshData: getRefreshData()
    };
  }
};
```

**Impact**:
- Attackers can call `__DEV__.dumpSecureStorage()` from browser console
- Authentication tokens can be extracted and used for session hijacking

**Remediation**:
1. Remove this export entirely, or
2. Gate it behind a development environment check:
```javascript
export const __DEV__ = import.meta.env.DEV ? { dumpSecureStorage() {...} } : null;
```

---

### [MED-002] Tokens Stored in localStorage (XSS Risk)

**Location**: `app/src/lib/secureStorage.js`

**Description**:
Authentication tokens are stored in localStorage, which is accessible to any JavaScript running on the page. If XSS exists (see HIGH-001), tokens can be stolen.

**Evidence**:
```javascript
export function setAuthToken(token) {
  if (!token) return;
  localStorage.setItem(SECURE_KEYS.AUTH_TOKEN, token);
}
```

**Impact**:
- XSS attacks can extract auth tokens
- Persistent access if tokens don't expire properly

**Remediation**:
1. Use HttpOnly cookies for token storage (server-side change)
2. Implement token rotation on sensitive operations
3. Add fingerprinting to detect token theft

---

### [MED-003] Verbose Error Messages

**Location**: `supabase/functions/_shared/errors.ts` (lines 57-65)

**Description**:
Error messages are passed directly to clients without sanitization.

**Evidence**:
```typescript
export function formatErrorResponse(error: Error): { success: false; error: string } {
  console.error('[Error Handler]', error);

  return {
    success: false,
    error: error.message || 'An error occurred',  // Full error message exposed
  };
}
```

**Impact**:
- Information disclosure about system internals
- Database structure hints
- Stack traces may reveal file paths

**Remediation**:
1. Map internal errors to generic user-facing messages
2. Log detailed errors server-side only
3. Return error codes instead of messages for structured handling

---

### [MED-004] Missing Security Headers

**Location**: `app/public/_headers`

**Description**:
The `_headers` file only sets Content-Type and Cache-Control. Critical security headers are missing.

**Missing Headers**:
- `Content-Security-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Strict-Transport-Security`
- `Referrer-Policy`
- `Permissions-Policy`

**Remediation**:
Add to `_headers`:
```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(self), microphone=()

/api/*
  X-Content-Type-Options: nosniff
```

For CSP, implement based on application needs.

---

### [MED-005] Sensitive Data in Console Logs

**Location**: Multiple files throughout codebase

**Description**:
Debug logging statements include sensitive authentication information.

**Evidence** (from grep results):
```javascript
// auth.js line 106-107
logger.debug('   Access Token:', access_token ? `${access_token.substring(0, 20)}...` : 'MISSING');
```

While partially redacted, these logs can still appear in browser DevTools in production.

**Impact**:
- Tokens visible in browser console
- Logs may be captured by browser extensions
- Customer support sessions may expose credentials

**Remediation**:
1. Gate all sensitive logging behind `import.meta.env.DEV`
2. Use log levels appropriately (error vs debug)
3. Implement structured logging that strips sensitive fields

---

### [MED-006] Potential IDOR in Edge Functions

**Location**: Multiple Edge Function handlers

**Description**:
Some Edge Function handlers accept `userId` directly from request payload without verifying the authenticated user owns that ID.

**Evidence**:
```typescript
// verify-users/index.ts
const { userId } = payload;
// No verification that authenticated user can perform action on this userId
```

**Impact**:
- Users may access or modify other users' data
- Privilege escalation

**Remediation**:
1. Always extract user ID from the authenticated JWT token
2. Verify the authenticated user has permission to act on the requested resource
3. Implement authorization middleware

---

## Low Severity / Recommendations

### [LOW-001] Password Minimum Length Too Short

**Location**: `app/src/lib/auth.js` (line 662)

**Description**:
Password validation only requires 4 characters minimum.

```javascript
if (password.length < 4) {
  return { success: false, error: 'Password must be at least 4 characters long.' };
}
```

**Recommendation**: Increase to at least 8 characters with complexity requirements.

---

### [LOW-002] No Rate Limiting on Auth Endpoints

**Location**: `supabase/functions/auth-user/index.ts`

**Description**:
No rate limiting is implemented on login/signup endpoints, allowing brute force attacks.

**Recommendation**: Implement rate limiting via Supabase policies or Edge Function middleware.

---

### [LOW-003] Session Verification Retries May Be Excessive

**Location**: `app/src/lib/auth.js` (lines 569-584)

**Description**:
Session verification loops up to 5 times with 100ms delays. This could mask timing issues.

**Recommendation**: Review and simplify session persistence logic.

---

### [LOW-004] Open Redirect Potential

**Location**: Multiple files with `window.location.href =` assignments

**Description**:
Some redirects use URL parameters without validation.

**Evidence**:
```javascript
// useAuthVerifyPageLogic.js
window.location.href = redirectTo;  // From URL parameter
```

**Recommendation**: Validate redirect URLs are relative or on allowed domains.

---

### [LOW-005] Deprecated Code References

**Location**: Various Edge Function files

**Description**:
References to "Bubble API" legacy system suggest incomplete migration.

**Recommendation**: Complete migration and remove legacy code paths.

---

### [LOW-006] No Audit Logging

**Description**:
Critical operations (user verification, proposal management) lack audit trails.

**Recommendation**: Implement audit logging for administrative actions.

---

### [LOW-007] Google Maps API Key Exposed to Frontend

**Location**: `app/.env.*` files

**Description**:
The Google Maps API key is used directly in the frontend. While necessary for Maps JavaScript API, ensure key restrictions are applied.

**Recommendation**: Verify HTTP referrer restrictions in Google Cloud Console.

---

### [LOW-008] Incomplete Input Sanitization

**Location**: `supabase/functions/_shared/validation.ts`

**Description**:
Validation utilities don't sanitize for SQL injection or other injection attacks beyond format validation.

**Recommendation**: Add input sanitization for string fields that will be used in database queries.

---

## Secure Patterns Found (Positive Observations)

1. **API Keys Server-Side**: Bubble API key and OpenAI key are stored in Supabase Secrets, not exposed to frontend
2. **Edge Function Proxy**: Frontend cannot directly call external APIs; all calls go through Edge Functions
3. **Supabase Auth Integration**: Using Supabase Auth with proper JWT validation
4. **RLS Policies**: Storage buckets have Row-Level Security policies configured
5. **Input Validation Utilities**: Centralized validation in `_shared/validation.ts`
6. **Error Type System**: Custom error classes with appropriate HTTP status code mapping
7. **Session Verification**: Multi-step session verification with retries
8. **Password Reset Security**: Returns success for all emails to prevent enumeration
9. **OAuth Implementation**: Proper state management for OAuth flows
10. **gitignore Configuration**: Sensitive files properly excluded from version control

---

## Priority Action Items

### Immediate (This Week)
1. Add authentication to all internal/admin pages (CRIT-001)
2. Fix CORS configuration to allow specific origins only (CRIT-002)
3. Update vulnerable dependencies (HIGH-002)

### Short-term (Within 2 Weeks)
4. Implement proper HTML sanitization with DOMPurify (HIGH-001)
5. Rotate and restrict Google Maps API key (HIGH-003)
6. Add security headers to _headers file (MED-004)
7. Remove debug exports from production code (MED-001)

### Medium-term (Within 1 Month)
8. Implement CSRF protection (HIGH-004)
9. Migrate token storage to HttpOnly cookies (MED-002)
10. Implement audit logging (LOW-006)
11. Implement rate limiting (LOW-002)

---

## Methodology

This audit was conducted through:
1. Static code analysis of JavaScript/TypeScript source files
2. Configuration file review (.env, _headers, routes.config.js, cors.ts)
3. Dependency vulnerability scanning (npm audit)
4. Pattern matching for known vulnerability signatures
5. Route and authentication flow analysis
6. OWASP Top 10 checklist verification

---

## Disclaimer

This automated security audit provides a point-in-time assessment based on static code analysis. It does not replace:
- Professional penetration testing
- Dynamic application security testing (DAST)
- Manual security review by qualified professionals
- Continuous security monitoring

**Findings should be validated** before implementing fixes in a production environment.
