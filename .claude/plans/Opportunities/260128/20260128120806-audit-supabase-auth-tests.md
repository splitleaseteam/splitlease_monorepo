# Supabase Auth Testing Opportunity Report
**Generated:** 2026-01-28T12:08:06
**Codebase:** Split Lease
**Audit Tool:** `/audit-supabase-auth-tests`

## Executive Summary
- **Auth components found:** 12
- **Auth flows needing tests:** 15
- **Protected routes needing tests:** 10
- **Pure function tests needed:** 4
- **Test infrastructure status:** Partial (test config exists, no auth tests)

## Infrastructure Check

### Auth Test Setup Status
- [ ] `auth-helpers.ts` exists for test user management - **MISSING**
- [ ] `createTestUser()` function exists - **MISSING**
- [ ] `createAuthenticatedClient()` function exists - **MISSING**
- [ ] Mock auth providers exist - **MISSING**
- [ ] MSW handlers for auth endpoints exist - **MISSING**

### Test Configuration Status
| Item | Status | Path |
|------|--------|------|
| Vitest config | **EXISTS** | `app/vitest.config.js` |
| Setup file | **EXISTS** | `app/vitest.setup.js` |
| Testing Library DOM | **EXISTS** | Imported in setup |
| Coverage thresholds | **EXISTS** | 30% statements |
| Edge Function test fixtures | **EXISTS** | `supabase/functions/tests/helpers/fixtures.ts` |
| Edge Function test assertions | **EXISTS** | `supabase/functions/tests/helpers/assertions.ts` |

### Environment Configuration
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured for tests - **UNKNOWN** (likely in CI secrets)
- [ ] Test user cleanup in `afterAll` - **NOT IMPLEMENTED**
- [ ] Local Supabase or staging configured - **UNKNOWN**

---

## Critical Auth Flow Gaps (No Tests)

### 1. Sign Up Flow
- **Files:**
  - Frontend: `app/src/lib/auth.js:651` (`signupUser` function)
  - Component: `app/src/islands/shared/SignUpLoginModal.jsx:29` (imports `signupUser`)
  - Edge Function: `supabase/functions/auth-user/handlers/signup.ts:63` (`handleSignup`)
- **API Calls:**
  - `supabase.auth.admin.createUser()` at `signup.ts:198`
  - `supabase.auth.signInWithPassword()` at `signup.ts:229`
- **Missing Tests:**
  - [ ] Successful signup with valid credentials
  - [ ] Weak password rejection (< 4 chars)
  - [ ] Password mismatch handling
  - [ ] Duplicate email detection (public.user table)
  - [ ] Duplicate email detection (Supabase Auth)
  - [ ] User type mapping to FK values
  - [ ] Session token generation and storage
  - [ ] User profile creation in `public.user` table
  - [ ] Bubble sync queue enqueueing
  - [ ] Welcome email triggering

### 2. Sign In Flow (Login)
- **Files:**
  - Frontend: `app/src/lib/auth.js:477` (`loginUser` function)
  - Component: `app/src/islands/shared/SignUpLoginModal.jsx:28` (imports `loginUser`)
  - Edge Function: `supabase/functions/auth-user/handlers/login.ts:25` (`handleLogin`)
- **API Calls:**
  - `supabase.auth.signInWithPassword()` at `login.ts:50`
  - Profile fetch from `public.user` table at `login.ts:83`
- **Missing Tests:**
  - [ ] Successful login with valid credentials
  - [ ] Invalid email rejection
  - [ ] Invalid password rejection ("Invalid login credentials")
  - [ ] Unconfirmed email handling
  - [ ] Session storage in localStorage
  - [ ] Session persistence verification loop
  - [ ] User profile data extraction
  - [ ] Loading state during login
  - [ ] Error display in UI

### 3. Session Management
- **Files:**
  - Auth check: `app/src/lib/auth.js:132` (`checkAuthStatus`)
  - Session valid: `app/src/lib/auth.js:228` (`isSessionValid`)
  - Token management: `app/src/lib/secureStorage.js` (all storage functions)
  - Workflow: `app/src/logic/workflows/auth/checkAuthStatusWorkflow.js`
- **API Calls:**
  - `supabase.auth.getSession()` at `auth.js:157`
- **Missing Tests:**
  - [ ] Session retrieval from Supabase client
  - [ ] Session fallback to secure storage
  - [ ] Cookie-based auth check (Split Lease cookies)
  - [ ] Session validity check (state-based)
  - [ ] Token storage and retrieval
  - [ ] Legacy storage migration
  - [ ] Auth state persistence

### 4. Token Validation & User Fetch
- **Files:**
  - Frontend: `app/src/lib/auth.js:871` (`validateTokenAndFetchUser`)
  - Edge Function: `supabase/functions/auth-user/handlers/validate.ts` (assumed)
  - Workflow: `app/src/logic/workflows/auth/validateTokenWorkflow.js`
- **Missing Tests:**
  - [ ] Valid token validation
  - [ ] Invalid token rejection
  - [ ] User data extraction from response
  - [ ] User type caching
  - [ ] `clearOnFailure` option behavior
  - [ ] Supabase session sync fallback

### 5. Password Reset Flow
- **Files:**
  - Request reset: `app/src/lib/auth.js:1215` (`requestPasswordReset`)
  - Update password: `app/src/lib/auth.js:1272` (`updatePassword`)
  - Page component: `app/src/islands/pages/ResetPasswordPage.jsx`
  - Edge Functions: `supabase/functions/auth-user/handlers/resetPassword.ts`, `updatePassword.ts`
- **API Calls:**
  - `supabase.auth.getSession()` at `auth.js:1290`
  - Edge Function invocation for password update
- **Missing Tests:**
  - [ ] Password reset email request
  - [ ] Always-success response (email enumeration prevention)
  - [ ] PASSWORD_RECOVERY event detection
  - [ ] Password update with valid session
  - [ ] Password validation (min 4 chars)
  - [ ] Password mismatch detection
  - [ ] Session preservation after password update
  - [ ] Invalid/expired reset link handling

### 6. Logout Flow
- **Files:**
  - Frontend: `app/src/lib/auth.js:1093` (`logoutUser`)
  - Edge Function: `supabase/functions/auth-user/handlers/logout.ts`
- **API Calls:**
  - `supabase.auth.signOut()` at `auth.js:1111`
- **Missing Tests:**
  - [ ] Supabase client signOut invocation
  - [ ] Auth data clearing from storage
  - [ ] Cookie clearing
  - [ ] Logout without existing token
  - [ ] Network error graceful handling

### 7. LinkedIn OAuth Signup Flow
- **Files:**
  - Initiate: `app/src/lib/auth.js:1404` (`initiateLinkedInOAuth`)
  - Callback: `app/src/lib/auth.js:1438` (`handleLinkedInOAuthCallback`)
  - Edge Function: `supabase/functions/auth-user/handlers/oauthSignup.ts`
- **API Calls:**
  - `supabase.auth.signInWithOAuth()` at `auth.js:1411`
- **Missing Tests:**
  - [ ] OAuth redirect initiation
  - [ ] User type storage before redirect
  - [ ] Callback session extraction
  - [ ] Provider verification (linkedin_oidc)
  - [ ] User data extraction from metadata
  - [ ] Edge Function user record creation
  - [ ] Session storage after callback

### 8. LinkedIn OAuth Login Flow
- **Files:**
  - Initiate: `app/src/lib/auth.js:1539` (`initiateLinkedInOAuthLogin`)
  - Callback: `app/src/lib/auth.js:1577` (`handleLinkedInOAuthLoginCallback`)
  - Edge Function: `supabase/functions/auth-user/handlers/oauthLogin.ts`
- **Missing Tests:**
  - [ ] Login flow flag setting
  - [ ] OAuth redirect with current page as return URL
  - [ ] User existence verification
  - [ ] User not found error handling (`userNotFound: true`)
  - [ ] Session storage on success

### 9. Google OAuth Signup Flow
- **Files:**
  - Initiate: `app/src/lib/auth.js:1696` (`initiateGoogleOAuth`)
  - Callback: `app/src/lib/auth.js:1730` (`handleGoogleOAuthCallback`)
- **Missing Tests:**
  - [ ] Same test coverage as LinkedIn OAuth Signup

### 10. Google OAuth Login Flow
- **Files:**
  - Initiate: `app/src/lib/auth.js:1837` (`initiateGoogleOAuthLogin`)
  - Callback: `app/src/lib/auth.js:1875` (`handleGoogleOAuthLoginCallback`)
- **Missing Tests:**
  - [ ] Same test coverage as LinkedIn OAuth Login

### 11. Magic Link / OTP Verification
- **Files:**
  - Page: `app/src/islands/pages/AuthVerifyPage/AuthVerifyPage.jsx`
  - Logic: `app/src/islands/pages/AuthVerifyPage/useAuthVerifyPageLogic.js`
- **API Calls:**
  - `supabase.auth.verifyOtp()` at `useAuthVerifyPageLogic.js:115`
- **Missing Tests:**
  - [ ] Token hash extraction from URL
  - [ ] OTP verification success
  - [ ] Expired token handling
  - [ ] Already-used token handling
  - [ ] Session sync to secure storage
  - [ ] Redirect after verification
  - [ ] Timeout handling (15s)

### 12. URL Auth Error Detection
- **Files:**
  - `app/src/lib/auth.js:1171` (`checkUrlForAuthError`)
  - `app/src/lib/auth.js:1196` (`clearAuthErrorFromUrl`)
- **Missing Tests:**
  - [ ] Error extraction from URL hash
  - [ ] Error description decoding
  - [ ] URL clearing after handling

---

## Protected Route Gaps

### Routes Needing Auth Tests
| Route | Component | Auth Check | Test Exists |
|-------|-----------|------------|-------------|
| `/guest-proposals` | GuestProposalsPage | Yes | **No** |
| `/host-proposals` | HostProposalsPage | Yes | **No** |
| `/account-profile` | AccountProfilePage | Yes | **No** |
| `/host-dashboard` | HostDashboardPage | Yes | **No** |
| `/self-listing` | SelfListingPage | Yes | **No** |
| `/listing-dashboard` | ListingDashboardPage | Yes | **No** |
| `/host-overview` | HostOverviewPage | Yes | **No** |
| `/favorite-listings` | FavoriteListingsPage | Yes | **No** |
| `/rental-application` | RentalApplicationPage | Yes | **No** |
| `/preview-split-lease` | PreviewSplitLeasePage | Yes | **No** |

**Note:** Protected path check implemented at `app/src/lib/auth.js:1060` (`isProtectedPage`)

### Missing Protected Route Tests
- [ ] Unauthenticated user redirect to login
- [ ] Authenticated user access granted
- [ ] Loading state during auth check
- [ ] Session expiry during navigation

---

## Auth Context/Provider Gaps

### No Dedicated Auth Context
The codebase uses a **hook-based pattern** (`useAuthenticatedUser`) instead of React Context.

- **File:** `app/src/hooks/useAuthenticatedUser.js`
- **Pattern:** "Gold Standard Auth Pattern" with 3-step fallback
- **Missing Tests:**
  - [ ] Step 1: Token validation success path
  - [ ] Step 2: Supabase session fallback
  - [ ] Step 3: No auth found (returns null)
  - [ ] Error handling
  - [ ] Loading state transitions
  - [ ] `isAuthenticated` computed value

---

## Component Test Gaps (Unit)

### SignUpLoginModal
- **File:** `app/src/islands/shared/SignUpLoginModal.jsx`
- **Test File:** **MISSING**
- **Missing Tests:**
  - [ ] Multi-view navigation (entry → user-type → identity → password)
  - [ ] Form validation errors display
  - [ ] API error display
  - [ ] Loading state during submission
  - [ ] Success callback invocation
  - [ ] OAuth button click handlers
  - [ ] Password visibility toggle

### ResetPasswordPage
- **File:** `app/src/islands/pages/ResetPasswordPage.jsx`
- **Test File:** **MISSING**
- **Missing Tests:**
  - [ ] Loading state on mount
  - [ ] PASSWORD_RECOVERY event handling
  - [ ] Form validation (password length, match)
  - [ ] Success state display
  - [ ] Auto-redirect after success
  - [ ] Error state display

### AuthVerifyPage
- **File:** `app/src/islands/pages/AuthVerifyPage/AuthVerifyPage.jsx`
- **Test File:** **MISSING**
- **Missing Tests:**
  - [ ] Loading → verifying → success states
  - [ ] Error message display
  - [ ] Request new link button

---

## Pure Function Test Gaps

### 1. checkAuthStatusWorkflow
- **File:** `app/src/logic/workflows/auth/checkAuthStatusWorkflow.js`
- **Test File:** **MISSING**
- **Missing Tests:**
  - [ ] Cookie priority check
  - [ ] Secure storage fallback
  - [ ] Input validation errors
  - [ ] Source attribution in response

### 2. validateTokenWorkflow
- **File:** `app/src/logic/workflows/auth/validateTokenWorkflow.js`
- **Test File:** **MISSING**
- **Missing Tests:**
  - [ ] Token validation step
  - [ ] User data fetch step
  - [ ] User type caching logic
  - [ ] Profile photo URL normalization
  - [ ] Input validation errors

### 3. isProtectedPage
- **File:** `app/src/logic/rules/auth/isProtectedPage.js`
- **Test File:** **MISSING**
- **Missing Tests:**
  - [ ] Protected path matching
  - [ ] Non-protected path rejection
  - [ ] .html extension normalization

### 4. isSessionValid
- **File:** `app/src/logic/rules/auth/isSessionValid.js`
- **Test File:** **MISSING**
- **Missing Tests:**
  - [ ] True auth state returns true
  - [ ] False auth state returns false

---

## Edge Function Test Gaps

### auth-user Router
- **File:** `supabase/functions/auth-user/index.ts`
- **Test File:** **MISSING**
- **Missing Tests:**
  - [ ] CORS preflight handling
  - [ ] Action validation
  - [ ] Handler routing (11 actions)
  - [ ] Error response formatting

### login.ts Handler
- **File:** `supabase/functions/auth-user/handlers/login.ts`
- **Test File:** **MISSING**
- **Existing Infrastructure:** `supabase/functions/tests/helpers/fixtures.ts` (ready to use)
- **Missing Tests:**
  - [ ] Valid credentials authentication
  - [ ] Invalid credentials error mapping
  - [ ] Email not confirmed error mapping
  - [ ] Profile fetch failure handling
  - [ ] Session token return structure

### signup.ts Handler
- **File:** `supabase/functions/auth-user/handlers/signup.ts`
- **Test File:** **MISSING**
- **Missing Tests:**
  - [ ] Email uniqueness checks (both tables)
  - [ ] Bubble ID generation
  - [ ] Auth user creation
  - [ ] User profile insertion
  - [ ] Cleanup on partial failure
  - [ ] User type FK mapping

---

## Components with Good Auth Test Coverage (Reference)

**None currently.** The only test file (`REG-001-fk-constraint-violation.test.js`) tests the `extractChangedFields` utility for listing updates, not auth.

---

## Recommended Test Helper Templates

### createTestUser
```typescript
// Suggested location: app/src/__tests__/helpers/auth-helpers.ts
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createTestUser(overrides = {}) {
  const email = `test-${crypto.randomUUID()}@test.com`;
  const password = 'TestPassword123!';

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    ...overrides,
  });

  if (error) throw error;

  return {
    user: data.user,
    email,
    password,
    cleanup: async () => adminClient.auth.admin.deleteUser(data.user!.id)
  };
}
```

### Mock Supabase Client
```typescript
// Suggested location: app/src/__tests__/mocks/supabase.ts
import { vi } from 'vitest';

export function createMockSupabaseClient() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn(),
      setSession: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
    },
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  };
}
```

### Mock useAuthenticatedUser
```typescript
// Suggested location: app/src/__tests__/mocks/hooks.ts
import { vi } from 'vitest';

export function mockUseAuthenticatedUser(overrides = {}) {
  return {
    user: null,
    userId: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    ...overrides,
  };
}

// Usage in tests:
vi.mock('@/hooks/useAuthenticatedUser', () => ({
  useAuthenticatedUser: () => mockUseAuthenticatedUser({
    user: { id: '123', name: 'Test User', email: 'test@test.com' },
    isAuthenticated: true,
  }),
}));
```

### Render with Auth Provider Wrapper
```tsx
// Suggested location: app/src/__tests__/helpers/render.tsx
import { render } from '@testing-library/react';

// Since Split Lease uses hook pattern (not Context),
// we mock at the hook level rather than wrapping with provider
export function renderWithAuth(ui: React.ReactElement, options = {}) {
  // Set up localStorage mock for auth state
  const storage = new Map();
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
    (key) => storage.get(key) ?? null
  );
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
    (key, value) => storage.set(key, value)
  );

  return render(ui, options);
}
```

---

## Edge Function Test Pattern (Deno)

```typescript
// Suggested location: supabase/functions/auth-user/__tests__/login.test.ts
import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts';
import { createMockRequest, createActionPayload, sampleUser } from '../../tests/helpers/fixtures.ts';
import { handleLogin } from '../handlers/login.ts';

Deno.test('login - returns session tokens on success', async () => {
  // This would require mocking Supabase client
  // For integration tests, use a test database
  const result = await handleLogin(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { email: sampleUser.email, password: 'testPassword123' }
  );

  assertEquals(typeof result.access_token, 'string');
  assertEquals(typeof result.refresh_token, 'string');
  assertEquals(typeof result.user_id, 'string');
});
```

---

## Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Real user emails in tests | Generate unique test emails with UUID |
| No test user cleanup | Always cleanup in `afterAll` |
| Testing against production | Use local Supabase or staging |
| Only testing happy path | Test errors, invalid credentials, edge cases |
| Mocking internal implementations | Mock at boundaries (API, storage) |
| Hardcoded tokens in tests | Generate fresh tokens per test |

---

## Priority Recommendations

### P0 - Critical (Blocks Other Tests)
1. Create `auth-helpers.ts` with `createTestUser` and `cleanup`
2. Create `supabase-mock.ts` for unit testing
3. Add MSW handlers for auth Edge Function endpoints

### P1 - High (Core Auth Flows)
1. `loginUser` function tests
2. `signupUser` function tests
3. `useAuthenticatedUser` hook tests
4. `checkAuthStatus` function tests

### P2 - Medium (Supporting Flows)
1. Password reset flow tests
2. OAuth flow tests (LinkedIn, Google)
3. Session management tests
4. Protected route redirect tests

### P3 - Lower (Pure Functions)
1. `checkAuthStatusWorkflow` tests
2. `validateTokenWorkflow` tests
3. `isProtectedPage` tests
4. `isSessionValid` tests

---

## File Summary

**Frontend Auth Files (No Tests):**
- `app/src/lib/auth.js` (1982 lines)
- `app/src/lib/secureStorage.js` (418 lines)
- `app/src/hooks/useAuthenticatedUser.js` (97 lines)
- `app/src/islands/shared/SignUpLoginModal.jsx` (large)
- `app/src/islands/pages/ResetPasswordPage.jsx` (261 lines)
- `app/src/islands/pages/AuthVerifyPage/useAuthVerifyPageLogic.js` (237 lines)
- `app/src/logic/workflows/auth/checkAuthStatusWorkflow.js` (78 lines)
- `app/src/logic/workflows/auth/validateTokenWorkflow.js` (106 lines)
- `app/src/logic/rules/auth/isProtectedPage.js`
- `app/src/logic/rules/auth/isSessionValid.js`

**Edge Function Auth Files (No Tests):**
- `supabase/functions/auth-user/index.ts` (305 lines)
- `supabase/functions/auth-user/handlers/login.ts` (156 lines)
- `supabase/functions/auth-user/handlers/signup.ts` (422 lines)
- `supabase/functions/auth-user/handlers/logout.ts`
- `supabase/functions/auth-user/handlers/validate.ts`
- `supabase/functions/auth-user/handlers/resetPassword.ts`
- `supabase/functions/auth-user/handlers/updatePassword.ts`
- `supabase/functions/auth-user/handlers/oauthSignup.ts`
- `supabase/functions/auth-user/handlers/oauthLogin.ts`
- `supabase/functions/auth-user/handlers/sendMagicLinkSms.ts`
- `supabase/functions/auth-user/handlers/verifyEmail.ts`

**Total Estimated Test Files Needed:** 15-20
