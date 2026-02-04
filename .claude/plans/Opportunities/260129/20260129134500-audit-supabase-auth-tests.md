# Supabase Auth Testing Opportunity Report
**Generated:** 2026-01-29T13:45:00Z
**Codebase:** Split Lease
**Hostname:** thin3

## Executive Summary
- Auth components found: 8
- Auth flows needing additional tests: 5
- Protected routes needing tests: 3
- Edge Function handlers needing tests: 11

## Infrastructure Check

### Auth Test Setup Status
- [x] Integration test file exists: `app/src/__tests__/integration/auth-flow.test.js`
- [x] E2E auth tests exist: `e2e/tests/auth.spec.ts`
- [x] Auth fixtures exist: `e2e/fixtures/auth.fixture.ts`
- [x] Mock Supabase client setup in tests
- [x] Mock secure storage setup in tests
- [x] Seed users defined: `e2e/fixtures/test-data-factory`
- [ ] MSW handlers for auth endpoints - **NOT FOUND**
- [ ] `createTestUser()` function with cleanup - **PARTIAL** (E2E fixture only)
- [ ] `createAuthenticatedClient()` function - **NOT FOUND**

### Environment Configuration
- [x] Supabase anon key mocked in tests
- [x] Supabase URL mocked in tests
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured for integration tests
- [ ] Test user cleanup in `afterAll` - **PARTIAL** (E2E only)
- [ ] Local Supabase configured for testing

## Existing Test Coverage (Reference)

### Integration Tests: `app/src/__tests__/integration/auth-flow.test.js`
✅ **Well Covered:**
- Login with valid credentials
- Login with invalid credentials
- Network error handling
- Logout flow
- Auth status check with Supabase session
- Token validation flow
- Protected page detection
- Complete login/logout cycle

### Unit Tests: `app/src/logic/workflows/auth/__tests__/`
✅ **Well Covered:**
- `validateTokenWorkflow.test.js` - Token validation, cached user type, profile photo handling
- `checkAuthStatusWorkflow.test.js` - Cookie auth, secure storage auth, priority logic

### Unit Tests: `app/src/logic/rules/auth/__tests__/`
✅ **Well Covered:**
- `isSessionValid.test.js` - Session validity checks, error handling

### E2E Tests: `e2e/tests/auth.spec.ts`
✅ **Well Covered:**
- Login happy paths (guest, host)
- Login persistence (navigation, refresh)
- Login error handling (invalid credentials, validation errors)
- Logout flow
- Signup navigation
- Protected routes redirect
- Accessibility tests
- Mobile responsiveness

## Critical Auth Flow Gaps (No Tests)

### 1. Sign Up Flow - Unit Tests MISSING
- **Files:**
  - Component: `app/src/islands/shared/SignUpLoginModal.jsx` (lines 1-1000+)
  - API: `supabase/functions/auth-user/handlers/signup.ts`
- **Missing Unit Tests:**
  - [ ] Successful signup flow (component state management)
  - [ ] Email duplicate detection
  - [ ] Password validation (< 4 chars)
  - [ ] Password mismatch detection
  - [ ] Email format validation
  - [ ] User type selection (Host/Guest)
  - [ ] Additional data submission (firstName, lastName, birthDate)
  - [ ] Error state rendering
  - [ ] Loading state during signup

### 2. OAuth Flows - Unit/Integration Tests MISSING
- **Files:**
  - Frontend: `app/src/lib/auth.js` (lines 1408-1985)
  - Backend: `supabase/functions/auth-user/handlers/oauthSignup.ts`
  - Backend: `supabase/functions/auth-user/handlers/oauthLogin.ts`
- **Missing Tests:**
  - [ ] LinkedIn OAuth signup initiation
  - [ ] LinkedIn OAuth callback handling
  - [ ] LinkedIn OAuth login flow
  - [ ] Google OAuth signup initiation
  - [ ] Google OAuth callback handling
  - [ ] Google OAuth login flow
  - [ ] OAuth duplicate email handling
  - [ ] OAuth user not found handling
  - [ ] OAuth storage key management (set/get/clear)

### 3. Password Reset Flow - Component Tests MISSING
- **Files:**
  - Component: `app/src/islands/pages/ResetPasswordPage.jsx`
  - API: `app/src/lib/auth.js` (lines 1217-1395)
  - Backend: `supabase/functions/auth-user/handlers/resetPassword.ts`
  - Backend: `supabase/functions/auth-user/handlers/updatePassword.ts`
- **Missing Tests:**
  - [ ] Password reset request (email submission)
  - [ ] Reset link verification (PASSWORD_RECOVERY event)
  - [ ] Password update with valid session
  - [ ] Password update validation (< 4 chars)
  - [ ] Confirm password mismatch
  - [ ] Expired/invalid reset link handling
  - [ ] Session preservation after password update
  - [ ] Loading states during reset flow

### 4. Magic Link / OTP Verification - Component Tests MISSING
- **Files:**
  - Component: `app/src/islands/pages/AuthVerifyPage/AuthVerifyPage.jsx`
  - Hook: `app/src/islands/pages/AuthVerifyPage/useAuthVerifyPageLogic.js`
  - Backend: `supabase/functions/auth-user/handlers/verifyEmail.ts`
  - Backend: `supabase/functions/auth-user/handlers/generateMagicLink.ts`
  - Backend: `supabase/functions/auth-user/handlers/sendMagicLinkSms.ts`
- **Missing Tests:**
  - [ ] Magic link token extraction from URL
  - [ ] OTP verification via `supabase.auth.verifyOtp()`
  - [ ] Session sync to secure storage
  - [ ] Success state rendering and redirect
  - [ ] Error state handling (expired, already used, invalid)
  - [ ] Timeout handling
  - [ ] Redirect URL validation (prevent open redirect)

### 5. useAuthenticatedUser Hook - Unit Tests MISSING
- **Files:**
  - Hook: `app/src/hooks/useAuthenticatedUser.js`
- **Missing Tests:**
  - [ ] Token validation path (userData available)
  - [ ] Supabase session fallback path
  - [ ] Unauthenticated user handling
  - [ ] Loading state management
  - [ ] Error state handling
  - [ ] User object structure validation

## Edge Function Handler Gaps

### Auth-User Edge Function Handlers Without Tests
| Handler | File | Test Status |
|---------|------|-------------|
| `handleLogin` | `supabase/functions/auth-user/handlers/login.ts` | No tests |
| `handleSignup` | `supabase/functions/auth-user/handlers/signup.ts` | No tests |
| `handleLogout` | `supabase/functions/auth-user/handlers/logout.ts` | No tests |
| `handleValidate` | `supabase/functions/auth-user/handlers/validate.ts` | No tests |
| `handleRequestPasswordReset` | `supabase/functions/auth-user/handlers/resetPassword.ts` | No tests |
| `handleUpdatePassword` | `supabase/functions/auth-user/handlers/updatePassword.ts` | No tests |
| `handleGenerateMagicLink` | `supabase/functions/auth-user/handlers/generateMagicLink.ts` | No tests |
| `handleOAuthSignup` | `supabase/functions/auth-user/handlers/oauthSignup.ts` | No tests |
| `handleOAuthLogin` | `supabase/functions/auth-user/handlers/oauthLogin.ts` | No tests |
| `handleSendMagicLinkSms` | `supabase/functions/auth-user/handlers/sendMagicLinkSms.ts` | No tests |
| `handleVerifyEmail` | `supabase/functions/auth-user/handlers/verifyEmail.ts` | No tests |

## Protected Route Gaps

### Routes Needing Additional Auth Tests
| Route | Component | Auth Check | Has Integration Test |
|-------|-----------|------------|---------------------|
| /host-overview | HostOverviewPage.jsx | Yes | No |
| /self-listing | SelfListingPage.tsx | Yes | No |
| /listing-dashboard | ListingDashboardPage | Yes | No |

Note: E2E tests cover redirect behavior for protected routes, but no unit/integration tests exist for the auth-checking logic within these components.

## Auth Context/Provider Gaps

### No Centralized AuthContext
The codebase uses:
- `useAuthenticatedUser` hook (no tests)
- Direct `supabase.auth.getSession()` calls
- Secure storage for auth state

**Missing:**
- [ ] No centralized AuthContext/AuthProvider pattern
- [ ] No mock auth provider for testing

## Component Test Gaps (Unit)

### SignUpLoginModal Component Tests
- **File:** `app/src/islands/shared/SignUpLoginModal.jsx`
- **Test File:** None
- **Missing:**
  - [ ] Form validation errors display
  - [ ] Tab switching (Login/Signup)
  - [ ] Social login buttons (LinkedIn, Google)
  - [ ] Password visibility toggle
  - [ ] Loading state during submission
  - [ ] Success callback handling
  - [ ] Modal close behavior

### ResetPasswordPage Component Tests
- **File:** `app/src/islands/pages/ResetPasswordPage.jsx`
- **Test File:** None
- **Missing:**
  - [ ] Loading state (verifying reset link)
  - [ ] Ready state (form visible)
  - [ ] Error state (invalid link)
  - [ ] Success state (password updated)
  - [ ] Form validation
  - [ ] Password visibility toggle

### AuthVerifyPage Component Tests
- **File:** `app/src/islands/pages/AuthVerifyPage/AuthVerifyPage.jsx`
- **Test File:** None
- **Missing:**
  - [ ] Loading state rendering
  - [ ] Verifying state rendering
  - [ ] Success state with redirect notice
  - [ ] Error state with back button

## Integration Test Gaps

### Auth Flows Needing Integration Tests
| Flow | Test File | Status |
|------|-----------|--------|
| Sign up → Auto login → Token validation | None | Missing |
| OAuth signup → Callback → Session | None | Missing |
| Password reset request → Email → Reset → Login | None | Missing |
| Magic link request → Click → Verify → Session | None | Missing |
| Session expiry → Refresh → Continue | None | Missing |

## Recommended Test Helper Templates

### createTestUser (for Edge Function tests)
```typescript
import { createClient } from '@supabase/supabase-js';

export async function createTestUser(overrides = {}) {
  const adminClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const email = `test-${crypto.randomUUID().slice(0, 8)}@test.splitlease.com`;
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
    cleanup: async () => {
      await adminClient.auth.admin.deleteUser(data.user!.id);
      // Also clean up public.user table
      await adminClient.from('user').delete().eq('email', email.toLowerCase());
    }
  };
}
```

### Mock Auth Hook for Component Tests
```typescript
import { vi } from 'vitest';

export function createMockAuthenticatedUser(overrides = {}) {
  return {
    user: {
      id: 'test-user-123',
      name: 'Test User',
      email: 'test@example.com',
      userType: 'Guest',
      avatarUrl: null,
      proposalCount: 0,
      ...overrides.user,
    },
    userId: 'test-user-123',
    loading: false,
    error: null,
    isAuthenticated: true,
    ...overrides,
  };
}

export function mockUseAuthenticatedUser(mockValue = {}) {
  return vi.fn(() => createMockAuthenticatedUser(mockValue));
}
```

### MSW Handler Template for Auth Endpoints
```typescript
import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.post('*/functions/v1/auth-user', async ({ request }) => {
    const body = await request.json();
    const { action, payload } = body;

    if (action === 'login') {
      if (payload.email === 'valid@test.com' && payload.password === 'password123') {
        return HttpResponse.json({
          success: true,
          data: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            user_id: 'mock-user-123',
            supabase_user_id: 'mock-supabase-123',
            user_type: 'Guest',
          }
        });
      }
      return HttpResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    if (action === 'signup') {
      // ... signup mock
    }

    return HttpResponse.json({ error: 'Unknown action' }, { status: 400 });
  }),
];
```

## Priority Recommendations

### High Priority (Auth Security)
1. Add unit tests for `useAuthenticatedUser` hook
2. Add component tests for `SignUpLoginModal` signup flow
3. Add component tests for `ResetPasswordPage`
4. Create MSW handlers for auth endpoints

### Medium Priority (Feature Coverage)
5. Add tests for OAuth flows (LinkedIn, Google)
6. Add component tests for `AuthVerifyPage`
7. Add integration tests for complete signup flow

### Lower Priority (Edge Functions)
8. Add Deno tests for Edge Function handlers
9. Add tests for magic link SMS flow

## Anti-Patterns Found

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Direct localStorage manipulation in E2E auth fixtures | `e2e/fixtures/auth.fixture.ts` | Use API-based auth for more realistic tests |
| No test user cleanup in integration tests | `app/src/__tests__/integration/auth-flow.test.js` | Add cleanup in afterAll |
| Hardcoded test credentials | Various test files | Use fixtures/factories |
