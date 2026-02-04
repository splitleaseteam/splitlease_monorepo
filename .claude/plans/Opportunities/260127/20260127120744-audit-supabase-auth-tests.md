# Supabase Auth Testing Opportunity Report
**Generated:** 2026-01-27T12:07:44Z
**Codebase:** Split Lease (React 18 + Vite + Supabase Edge Functions)

## Executive Summary
- **Auth components found:** 20+
- **Auth flows needing tests:** 15
- **Protected routes needing tests:** 10
- **Test infrastructure status:** ❌ NOT CONFIGURED (no Vitest, no testing-library)

> **CRITICAL**: This codebase has a comprehensive, production-ready authentication system (~2,000+ lines in `app/src/lib/auth.js` alone) with **ZERO test coverage**. The auth system handles login, signup, OAuth (LinkedIn & Google), magic links, password reset, session management, and protected routes—all untested.

---

## Infrastructure Check

### Auth Test Setup Status
- [ ] `auth-helpers.ts` exists for test user management — **MISSING**
- [ ] `createTestUser()` function exists — **MISSING**
- [ ] `createAuthenticatedClient()` function exists — **MISSING**
- [ ] Mock auth providers exist — **MISSING**
- [ ] MSW handlers for auth endpoints exist — **MISSING**
- [ ] Vitest configured — **MISSING** (no `vitest.config.js`)
- [ ] React Testing Library configured — **MISSING** (not in dependencies)

### Environment Configuration
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured for tests — **UNKNOWN** (no test environment setup)
- [ ] Test user cleanup in `afterAll` — **N/A**
- [ ] Local Supabase or staging configured — **EXISTS** (dev MCP server documented)

### Test Framework Status
**Current `package.json` has NO test runner:**
```json
{
  "scripts": {
    "test": "bun run test:stop && bun run lint && bun run knip:report && vite --port 8001 --strictPort"
  }
}
```
The `test` script runs a dev server, not actual tests.

**Missing Dependencies:**
- `vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- `msw` (Mock Service Worker)
- `happy-dom` or `jsdom`

---

## Critical Auth Flow Gaps (No Tests)

### 1. Sign Up Flow
- **Files:**
  - Component: `app/src/islands/shared/SignUpLoginModal.jsx:1-800+`
  - Frontend API: `app/src/lib/auth.js:651-854` (`signupUser()`)
  - Edge Function: `supabase/functions/auth-user/handlers/signup.ts:1-300+`
- **Missing Tests:**
  - [ ] Successful signup with email/password
  - [ ] Weak password rejection (< 4 chars)
  - [ ] Password mismatch handling
  - [ ] Duplicate email handling
  - [ ] Email validation
  - [ ] User metadata creation (firstName, lastName, userType, birthDate, phoneNumber)
  - [ ] Session token storage after signup
  - [ ] Host/Guest account creation
  - [ ] Supabase session persistence verification

### 2. Sign In Flow (Email/Password)
- **Files:**
  - Component: `app/src/islands/shared/SignUpLoginModal.jsx` (LOGIN view)
  - Frontend API: `app/src/lib/auth.js:477-630` (`loginUser()`)
  - Edge Function: `supabase/functions/auth-user/handlers/login.ts:1-156`
- **Missing Tests:**
  - [ ] Successful signin with valid credentials
  - [ ] Invalid password rejection (401)
  - [ ] Non-existent user handling
  - [ ] Email not confirmed error
  - [ ] Loading state during authentication
  - [ ] Error display in UI
  - [ ] Session token storage
  - [ ] User type (Host/Guest) persistence
  - [ ] Login notification email trigger

### 3. Session Management
- **Files:**
  - Hook: `app/src/hooks/useAuthenticatedUser.js:1-98` (Gold Standard Auth Pattern)
  - Context: `app/src/lib/auth.js:871-1049` (`validateTokenAndFetchUser()`)
  - Storage: `app/src/lib/secureStorage.js:1-200+`
- **Missing Tests:**
  - [ ] 3-step fallback: Token → Session → Guest
  - [ ] Session retrieval via `supabase.auth.getSession()`
  - [ ] Session refresh handling
  - [ ] Session expiry handling
  - [ ] Token sync between Supabase and secure storage
  - [ ] Auth state persistence across page loads
  - [ ] `checkAuthStatus()` behavior

### 4. Password Reset Flow
- **Files:**
  - Component: `app/src/islands/pages/ResetPasswordPage.jsx`
  - Frontend API: `app/src/lib/auth.js:1215-1391` (`requestPasswordReset()`, `updatePassword()`)
  - Edge Function: `supabase/functions/auth-user/handlers/resetPassword.ts:1-310`
  - Edge Function: `supabase/functions/auth-user/handlers/updatePassword.ts`
- **Missing Tests:**
  - [ ] Password reset email request (always returns success for security)
  - [ ] Legacy user migration (create auth.users entry)
  - [ ] Branded email sending via send-email function
  - [ ] Password update with valid session
  - [ ] Invalid/expired reset link handling
  - [ ] Session preservation after password change
  - [ ] Minimum password length validation (4 chars)

### 5. Magic Link / OTP Verification
- **Files:**
  - Page: `app/src/islands/pages/AuthVerifyPage/AuthVerifyPage.jsx`
  - Hook: `app/src/islands/pages/AuthVerifyPage/useAuthVerifyPageLogic.js:1-238`
  - Entry: `app/src/auth-verify.jsx`
- **Missing Tests:**
  - [ ] OTP verification via `supabase.auth.verifyOtp()`
  - [ ] Expired token handling
  - [ ] Already used token handling
  - [ ] Invalid token handling
  - [ ] Loading → Verifying → Success/Error state transitions
  - [ ] Redirect URL extraction and validation (prevent open redirects)
  - [ ] Session sync to secure storage after verification
  - [ ] Timeout handling (15 seconds)

### 6. OAuth Flows (LinkedIn & Google)
- **Files:**
  - Frontend API: `app/src/lib/auth.js:1393-1982` (OAuth functions)
  - Global Handler: `app/src/lib/oauthCallbackHandler.js:1-174`
  - Edge Function: `supabase/functions/auth-user/handlers/oauthSignup.ts`
  - Edge Function: `supabase/functions/auth-user/handlers/oauthLogin.ts`
- **Missing Tests:**
  - [ ] LinkedIn OAuth signup initiation
  - [ ] LinkedIn OAuth signup callback processing
  - [ ] LinkedIn OAuth login initiation
  - [ ] LinkedIn OAuth login callback processing
  - [ ] Google OAuth signup initiation
  - [ ] Google OAuth signup callback processing
  - [ ] Google OAuth login initiation
  - [ ] Google OAuth login callback processing
  - [ ] User not found handling (prompt signup)
  - [ ] OAuth token extraction from URL hash
  - [ ] Custom event dispatching (`oauth-login-success`, `oauth-login-error`)
  - [ ] Duplicate processing prevention

### 7. Logout Flow
- **Files:**
  - Frontend API: `app/src/lib/auth.js:1093-1155` (`logoutUser()`)
  - Edge Function: `supabase/functions/auth-user/handlers/logout.ts`
- **Missing Tests:**
  - [ ] `supabase.auth.signOut()` invocation
  - [ ] Local auth data clearing
  - [ ] Edge function notification
  - [ ] Graceful handling when no active session

---

## Protected Route Gaps

### Routes Requiring Auth Tests
| Route | Component | Auth Check Method | Test Exists |
|-------|-----------|-------------------|-------------|
| `/account-profile` | AccountProfilePage | `isProtectedPage()` | ❌ No |
| `/host-dashboard` | HostDashboardPage | `isProtectedPage()` | ❌ No |
| `/guest-proposals` | GuestProposalsPage | `checkAuthStatus()` | ❌ No |
| `/host-proposals` | HostProposalsPage | `checkAuthStatus()` | ❌ No |
| `/self-listing` | SelfListingPage | `checkAuthStatus()` | ❌ No |
| `/listing-dashboard` | ListingDashboardPage | `useListingAuth()` | ❌ No |
| `/host-overview` | HostOverviewPage | `checkAuthStatus()` | ❌ No |
| `/favorite-listings` | FavoriteListingsPage | `checkAuthStatus()` | ❌ No |
| `/rental-application` | RentalApplicationPage | `checkAuthStatus()` | ❌ No |
| `/preview-split-lease` | PreviewSplitLeasePage | `checkAuthStatus()` | ❌ No |

### Missing Protected Route Tests
- [ ] Unauthenticated user redirect to login
- [ ] Authenticated user access granted
- [ ] Loading state during auth check
- [ ] Role-based access (Host vs Guest pages)
- [ ] Return URL preservation after login

### Protected Route Logic Files
- **`app/src/lib/auth.js:1060-1081`** — `isProtectedPage()` (duplicate of rules file)
- **`app/src/logic/rules/auth/isProtectedPage.js:1-42`** — Pure function for route checking

---

## Auth Context/Provider Gaps

### useAuthenticatedUser Hook (Gold Standard Pattern)
- **File:** `app/src/hooks/useAuthenticatedUser.js:1-98`
- **Missing Tests:**
  - [ ] Initial loading state (`loading: true`)
  - [ ] Token validation success path
  - [ ] Supabase session fallback when token fails
  - [ ] Guest fallback when no auth found
  - [ ] Error handling and error state
  - [ ] `isAuthenticated` computed correctly
  - [ ] User data structure validation

### Secure Storage Module
- **File:** `app/src/lib/secureStorage.js:1-200+`
- **Missing Tests:**
  - [ ] `setAuthToken()` / `getAuthToken()` persistence
  - [ ] `setSessionId()` / `getSessionId()` persistence
  - [ ] `setAuthState()` / `getAuthState()` behavior
  - [ ] `setUserType()` / `getUserType()` behavior
  - [ ] `clearAllAuthData()` completeness
  - [ ] OAuth flow flag management (LinkedIn & Google)
  - [ ] `hasValidTokens()` validation logic

---

## Component Test Gaps (Unit)

### SignUpLoginModal
- **File:** `app/src/islands/shared/SignUpLoginModal.jsx:1-800+`
- **Test File:** ❌ **MISSING**
- **Views to Test:**
  - [ ] ENTRY view - initial state
  - [ ] USER_TYPE view - Host/Guest selection
  - [ ] IDENTITY view - Name, email, birthday form
  - [ ] PASSWORD view - Password creation
  - [ ] LOGIN view - Email/password login
  - [ ] PASSWORD_RESET view - Reset request
  - [ ] RESET_SENT view - Confirmation
  - [ ] MAGIC_LINK view - Magic link request
  - [ ] MAGIC_LINK_SENT view - Confirmation
  - [ ] SUCCESS view - Post-auth success
- **Missing Tests:**
  - [ ] Form validation errors display
  - [ ] API error display (toast messages)
  - [ ] Loading states during API calls
  - [ ] View transitions
  - [ ] OAuth button click handlers
  - [ ] onAuthSuccess callback invocation

### AuthVerifyPage
- **File:** `app/src/islands/pages/AuthVerifyPage/AuthVerifyPage.jsx`
- **Test File:** ❌ **MISSING**
- **Missing Tests:**
  - [ ] Loading state rendering
  - [ ] Verifying state rendering
  - [ ] Success state rendering with redirect countdown
  - [ ] Error state rendering with retry button
  - [ ] Status-specific icons and messages

### ResetPasswordPage
- **File:** `app/src/islands/pages/ResetPasswordPage.jsx`
- **Test File:** ❌ **MISSING**
- **Missing Tests:**
  - [ ] Password input validation
  - [ ] Password visibility toggle
  - [ ] Submit button disabled states
  - [ ] Success/error feedback
  - [ ] Session requirement check

---

## Integration Test Gaps

### Auth Flows Needing Integration Tests
| Flow | Test File | Status |
|------|-----------|--------|
| Sign up → Auto-login → Session persist | None | ❌ Missing |
| Login → Session → Token validation | None | ❌ Missing |
| Password reset → Email → Update | None | ❌ Missing |
| Magic link → Verify → Session | None | ❌ Missing |
| OAuth signup → Callback → User creation | None | ❌ Missing |
| OAuth login → Callback → Session | None | ❌ Missing |
| Protected route → Redirect → Login → Return | None | ❌ Missing |

---

## Edge Function Test Gaps

### auth-user Edge Function
- **File:** `supabase/functions/auth-user/index.ts:1-305`
- **Test File:** ❌ **MISSING**
- **Missing Tests:**
  - [ ] Action routing to correct handlers
  - [ ] Invalid action rejection
  - [ ] CORS preflight handling
  - [ ] Error response formatting
  - [ ] Slack error reporting

### Handler Tests Needed
| Handler | File | Priority | Status |
|---------|------|----------|--------|
| `handleLogin` | `handlers/login.ts:1-156` | Critical | ❌ Missing |
| `handleSignup` | `handlers/signup.ts:1-300+` | Critical | ❌ Missing |
| `handleRequestPasswordReset` | `handlers/resetPassword.ts:1-310` | High | ❌ Missing |
| `handleUpdatePassword` | `handlers/updatePassword.ts` | High | ❌ Missing |
| `handleValidate` | `handlers/validate.ts` | High | ❌ Missing |
| `handleGenerateMagicLink` | `handlers/generateMagicLink.ts` | Medium | ❌ Missing |
| `handleOAuthSignup` | `handlers/oauthSignup.ts` | Medium | ❌ Missing |
| `handleOAuthLogin` | `handlers/oauthLogin.ts` | Medium | ❌ Missing |
| `handleSendMagicLinkSms` | `handlers/sendMagicLinkSms.ts` | Medium | ❌ Missing |
| `handleVerifyEmail` | `handlers/verifyEmail.ts` | Medium | ❌ Missing |
| `handleLogout` | `handlers/logout.ts` | Low | ❌ Missing |

---

## Components with Good Auth Test Coverage (Reference)

**NONE** — No auth-related tests exist in this codebase.

The only existing test file is:
- `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js` (not auth-related)

---

## Recommended Test Infrastructure Setup

### Step 1: Install Testing Dependencies
```bash
cd app
bun add -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom happy-dom msw
```

### Step 2: Create vitest.config.js
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/auth.js', 'src/hooks/useAuthenticatedUser.js', 'src/lib/secureStorage.js'],
    },
  },
});
```

### Step 3: Create Test Setup File
```typescript
// app/src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  sessionStorage.clear();
});
afterAll(() => server.close());
```

---

## Recommended Test Helper Templates

### createTestUser (for Integration Tests)
```typescript
// app/src/test/helpers/auth-helpers.ts
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createTestUser(overrides = {}) {
  const email = `test-${crypto.randomUUID()}@test.splitlease.com`;
  const password = 'TestPassword123!';

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      user_type: 'Guest',
      first_name: 'Test',
      last_name: 'User',
      ...overrides,
    },
  });

  if (error) throw error;

  return {
    user: data.user,
    email,
    password,
    cleanup: async () => {
      await adminClient.auth.admin.deleteUser(data.user!.id);
    },
  };
}
```

### Mock Auth Provider (for Unit Tests)
```typescript
// app/src/test/mocks/MockAuthProvider.tsx
import React, { createContext, useContext } from 'react';
import { vi } from 'vitest';

const MockAuthContext = createContext<any>(null);

interface MockAuthProviderProps {
  children: React.ReactNode;
  user?: any;
  loading?: boolean;
  error?: Error | null;
}

export function MockAuthProvider({
  children,
  user = null,
  loading = false,
  error = null,
}: MockAuthProviderProps) {
  const value = {
    user,
    userId: user?.id || null,
    loading,
    error,
    isAuthenticated: !!user,
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export const useMockAuth = () => useContext(MockAuthContext);
```

### MSW Handlers for Auth Endpoints
```typescript
// app/src/test/mocks/handlers/auth.ts
import { http, HttpResponse } from 'msw';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const authHandlers = [
  // Login handler
  http.post(`${SUPABASE_URL}/functions/v1/auth-user`, async ({ request }) => {
    const body = await request.json() as { action: string; payload: any };

    if (body.action === 'login') {
      const { email, password } = body.payload;

      if (email === 'test@example.com' && password === 'validpassword') {
        return HttpResponse.json({
          success: true,
          data: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            user_id: 'test-user-id',
            user_type: 'Guest',
          },
        });
      }

      return HttpResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (body.action === 'signup') {
      return HttpResponse.json({
        success: true,
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user_id: 'new-user-id',
          user_type: body.payload.additionalData?.userType || 'Guest',
        },
      });
    }

    if (body.action === 'validate') {
      return HttpResponse.json({
        success: true,
        data: {
          userId: 'test-user-id',
          firstName: 'Test',
          email: 'test@example.com',
          userType: 'Guest',
        },
      });
    }

    return HttpResponse.json({ success: false, error: 'Unknown action' });
  }),

  // Supabase Auth API mock
  http.post(`${SUPABASE_URL}/auth/v1/token`, async () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        user_metadata: {
          user_id: 'test-user-id',
          user_type: 'Guest',
        },
      },
    });
  }),
];
```

---

## Anti-Patterns to Flag in Future Tests

| Flag This | Recommend Instead |
|-----------|-------------------|
| Real user emails in tests | Generate unique test emails with UUID |
| No test user cleanup | Always cleanup in `afterAll` or `afterEach` |
| Testing against production Supabase | Use local Supabase or MSW mocks |
| Only testing happy path | Test errors, invalid credentials, edge cases |
| Mocking Supabase client internals | Mock at the Edge Function level |
| Hardcoded test credentials | Use environment variables or fixtures |
| Testing storage directly | Test through auth functions |

---

## Priority Ranking

### P0 - Critical (Block Production)
1. Login flow unit tests
2. Signup flow unit tests
3. Session management tests
4. Protected route redirect tests

### P1 - High (Before Major Release)
1. Password reset flow tests
2. Magic link verification tests
3. OAuth callback processing tests
4. useAuthenticatedUser hook tests

### P2 - Medium (Sprint Backlog)
1. SignUpLoginModal component tests
2. Edge Function handler tests
3. Secure storage module tests
4. Error boundary tests

### P3 - Low (Nice to Have)
1. Logout flow tests
2. Role-based access tests
3. OAuth initiation tests
4. Performance/timeout tests

---

## Estimated Effort

| Category | Files to Test | Test Files to Create | Estimated Hours |
|----------|---------------|----------------------|-----------------|
| Test Infrastructure Setup | N/A | 3-4 | 4-6 hrs |
| Core Auth Functions (auth.js) | 1 | 1 | 8-12 hrs |
| Auth Hooks | 2 | 2 | 4-6 hrs |
| Secure Storage | 1 | 1 | 2-3 hrs |
| Auth Components | 3 | 3 | 6-8 hrs |
| Edge Functions | 11 | 11 | 12-16 hrs |
| Integration Tests | N/A | 3-4 | 8-10 hrs |
| **Total** | **18** | **23-26** | **44-61 hrs** |

---

## Next Steps

1. **Immediate**: Install Vitest and testing-library dependencies
2. **Week 1**: Set up test infrastructure (config, setup files, MSW handlers)
3. **Week 2**: Write unit tests for `auth.js` core functions
4. **Week 3**: Write component tests for SignUpLoginModal, AuthVerifyPage
5. **Week 4**: Write integration tests for critical auth flows
6. **Ongoing**: Add Edge Function tests as part of feature development
