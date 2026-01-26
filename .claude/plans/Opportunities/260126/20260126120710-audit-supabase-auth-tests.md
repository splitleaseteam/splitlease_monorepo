# Supabase Auth Testing Opportunity Report
**Generated:** 2026-01-26T12:07:10
**Codebase:** Split Lease
**Auditor:** Claude Code Audit Agent

## Executive Summary
- **Auth components found:** 12
- **Auth flows needing tests:** 18+
- **Protected routes needing tests:** 10+
- **Test infrastructure status:** MISSING
- **Risk Level:** HIGH - No auth test coverage exists

### Key Finding
The Split Lease codebase has **ZERO authentication test coverage**. The only existing test file (`calculateMatchScore.test.js`) is unrelated to authentication. This represents a significant gap for a codebase handling user credentials, session management, OAuth, and protected routes.

---

## Infrastructure Check

### Auth Test Setup Status
- [ ] **`auth-helpers.ts` exists for test user management** - MISSING
- [ ] **`createTestUser()` function exists** - MISSING
- [ ] **`createAuthenticatedClient()` function exists** - MISSING
- [ ] **Mock auth providers exist** - MISSING
- [ ] **MSW handlers for auth endpoints exist** - MISSING
- [ ] **Vitest configuration exists** - MISSING (`vitest.config.js` not found)
- [ ] **Test setup file exists** - MISSING (`setupTests.js` not found)

### Environment Configuration
- [ ] **`SUPABASE_SERVICE_ROLE_KEY` configured for tests** - UNKNOWN
- [ ] **Test user cleanup in `afterAll`** - MISSING (no tests exist)
- [ ] **Local Supabase or staging configured** - UNKNOWN

### What Needs to Be Created
1. `app/vitest.config.js` - Test runner configuration
2. `app/src/test/setup.ts` - Global test setup (MSW, mocks)
3. `app/src/test/helpers/auth-helpers.ts` - Test user management
4. `app/src/test/mocks/auth-mocks.ts` - Mock auth provider/context
5. `app/src/test/mocks/handlers/auth-handlers.ts` - MSW handlers

---

## Critical Auth Flow Gaps (No Tests)

### 1. Sign Up Flow (`signupUser`)
- **Files:**
  - Frontend: `app/src/lib/auth.js:651-854` (`signupUser` function)
  - Component: `app/src/islands/shared/SignUpLoginModal.jsx:1142-1235` (`handleSignupSubmit`)
  - Backend: `supabase/functions/auth-user/handlers/signup.ts`
- **Missing Tests:**
  - [ ] Successful signup with valid credentials
  - [ ] Weak password rejection (< 4 chars)
  - [ ] Password mismatch handling (`password !== retype`)
  - [ ] Duplicate email handling
  - [ ] Email validation (invalid format)
  - [ ] Birthday validation (must be 18+)
  - [ ] User type selection (Host/Guest) persisted correctly
  - [ ] Session tokens stored correctly after signup
  - [ ] Loading states during signup
  - [ ] Network error handling

### 2. Sign In Flow (`loginUser`)
- **Files:**
  - Frontend: `app/src/lib/auth.js:477-630` (`loginUser` function)
  - Component: `app/src/islands/shared/SignUpLoginModal.jsx:1238-1322` (`handleLoginSubmit`)
  - Backend: `supabase/functions/auth-user/handlers/login.ts`
- **Missing Tests:**
  - [ ] Successful signin with valid credentials
  - [ ] Invalid password rejection
  - [ ] Non-existent user handling
  - [ ] Session token storage after login
  - [ ] Supabase session sync (`setSession`)
  - [ ] Loading state during login
  - [ ] Error message display
  - [ ] Network error handling

### 3. Session Management
- **Files:**
  - Core: `app/src/lib/auth.js:132-216` (`checkAuthStatus`)
  - Validation: `app/src/lib/auth.js:871-1049` (`validateTokenAndFetchUser`)
  - Storage: `app/src/lib/secureStorage.js` (entire file)
  - Hook: `app/src/hooks/useAuthenticatedUser.js`
- **Missing Tests:**
  - [ ] Session retrieval via `getSession()`
  - [ ] Session initialization race condition handling (200ms delay)
  - [ ] Session refresh mechanism
  - [ ] Session expiry handling
  - [ ] Sign out invalidates session
  - [ ] Token migration from legacy storage (`migrateFromLegacyStorage`)
  - [ ] Cookie-based auth fallback (`checkSplitLeaseCookies`)
  - [ ] Multi-source auth state sync (Supabase session vs localStorage)

### 4. Password Reset Flow
- **Files:**
  - Request: `app/src/lib/auth.js:1215-1258` (`requestPasswordReset`)
  - Update: `app/src/lib/auth.js:1272-1391` (`updatePassword`)
  - Page: `app/src/islands/pages/ResetPasswordPage.jsx`
  - Backend: `supabase/functions/auth-user/handlers/resetPassword.ts`
  - Backend: `supabase/functions/auth-user/handlers/updatePassword.ts`
- **Missing Tests:**
  - [ ] Reset email request (always returns success for security)
  - [ ] Password update with valid token
  - [ ] Invalid/expired token handling
  - [ ] Password validation on update (min 4 chars)
  - [ ] Session preservation after password update
  - [ ] PASSWORD_RECOVERY event handling
  - [ ] Loading/verifying/success/error states

### 5. Magic Link / OTP Verification
- **Files:**
  - Page: `app/src/islands/pages/AuthVerifyPage/AuthVerifyPage.jsx`
  - Logic: `app/src/islands/pages/AuthVerifyPage/useAuthVerifyPageLogic.js`
  - Handler: `app/src/lib/auth.js:1369-1557` (`handleMagicLink`)
  - Backend: `supabase/functions/auth-user/handlers/generateMagicLink.ts`
- **Missing Tests:**
  - [ ] OTP verification with valid token_hash
  - [ ] Expired OTP handling
  - [ ] Already-used OTP handling
  - [ ] Invalid token type handling
  - [ ] Redirect after successful verification
  - [ ] Session sync to secure storage
  - [ ] Timeout handling (15s limit)
  - [ ] Error message mapping (`getErrorMessage`)

### 6. Logout Flow (`logoutUser`)
- **Files:**
  - Frontend: `app/src/lib/auth.js:1093-1155` (`logoutUser`)
  - Backend: `supabase/functions/auth-user/handlers/logout.ts`
- **Missing Tests:**
  - [ ] Successful logout clears all auth data
  - [ ] Supabase `signOut()` called
  - [ ] localStorage cleared (`clearAllAuthData`)
  - [ ] Cookies cleared
  - [ ] Graceful handling when no token exists
  - [ ] Network error handling (still clears local data)

### 7. LinkedIn OAuth Flow
- **Files:**
  - Signup: `app/src/lib/auth.js:1404-1531` (`initiateLinkedInOAuth`, `handleLinkedInOAuthCallback`)
  - Login: `app/src/lib/auth.js:1539-1683` (`initiateLinkedInOAuthLogin`, `handleLinkedInOAuthLoginCallback`)
  - Backend: `supabase/functions/auth-user/handlers/oauthSignup.ts`
  - Backend: `supabase/functions/auth-user/handlers/oauthLogin.ts`
- **Missing Tests:**
  - [ ] OAuth initiation stores user type before redirect
  - [ ] Callback extracts LinkedIn data correctly
  - [ ] User creation from OAuth data
  - [ ] Duplicate email handling during OAuth signup
  - [ ] User not found handling during OAuth login
  - [ ] Session storage after successful OAuth
  - [ ] Error handling and cleanup

### 8. Google OAuth Flow
- **Files:**
  - Signup: `app/src/lib/auth.js:1696-1829` (`initiateGoogleOAuth`, `handleGoogleOAuthCallback`)
  - Login: `app/src/lib/auth.js:1837-1981` (`initiateGoogleOAuthLogin`, `handleGoogleOAuthLoginCallback`)
- **Missing Tests:**
  - [ ] OAuth initiation stores user type before redirect
  - [ ] Callback extracts Google data correctly
  - [ ] User creation from OAuth data
  - [ ] Duplicate email handling
  - [ ] User not found handling
  - [ ] Session storage after OAuth

---

## Protected Route Gaps

### Routes Needing Auth Tests
| Route | Component | Auth Check Location | Test Exists |
|-------|-----------|---------------------|-------------|
| `/account-profile` | AccountProfilePage | `isProtectedPage()` | No |
| `/host-dashboard` | HostDashboardPage | `isProtectedPage()` | No |
| `/guest-proposals` | GuestProposalsPage | `isProtectedPage()` in auth.js | No |
| `/host-proposals` | HostProposalsPage | `isProtectedPage()` in auth.js | No |
| `/self-listing` | SelfListingPage | `isProtectedPage()` in auth.js | No |
| `/listing-dashboard` | ListingDashboardPage | `useListingAuth` hook | No |
| `/host-overview` | HostOverviewPage | Uses `requireAuth` pattern | No |
| `/favorite-listings` | FavoriteListingsPage | `useAuthenticatedUser` hook | No |
| `/rental-application` | RentalApplicationPage | `isProtectedPage()` in auth.js | No |
| `/preview-split-lease` | PreviewSplitLeasePage | `isProtectedPage()` in auth.js | No |

### Protected Page Rule (`isProtectedPage`)
- **Files:**
  - Pure function: `app/src/logic/rules/auth/isProtectedPage.js`
  - Legacy in auth.js: `app/src/lib/auth.js:1060-1081`
- **Discrepancy:** Two implementations exist with different protected paths!
  - `rules/auth/isProtectedPage.js`: Only `/account-profile`, `/host-dashboard`
  - `lib/auth.js`: Full list of 10 paths
- **Missing Tests:**
  - [ ] Each protected path correctly identified
  - [ ] Public paths return false
  - [ ] `.html` extension normalized correctly
  - [ ] Path prefix matching works (`/account-profile/123`)

### Missing Protected Route Tests
- [ ] Unauthenticated user redirect to login
- [ ] Authenticated user gains access
- [ ] Loading state during auth check
- [ ] Session expiry mid-visit handling

---

## Auth Context/Provider Gaps

### `useAuthenticatedUser` Hook
- **File:** `app/src/hooks/useAuthenticatedUser.js`
- **Pattern:** Gold Standard Auth Pattern (3-step fallback)
- **Missing Tests:**
  - [ ] Step 1: Token validation success path
  - [ ] Step 2: Fallback to Supabase session metadata
  - [ ] Step 3: Returns null when no auth
  - [ ] Loading state while authenticating
  - [ ] Error state handling
  - [ ] `isAuthenticated` derived correctly
  - [ ] Integration with `validateTokenAndFetchUser`

### Secure Storage Module
- **File:** `app/src/lib/secureStorage.js`
- **Functions needing tests:**
  - [ ] `setAuthToken` / `getAuthToken`
  - [ ] `setSessionId` / `getSessionId`
  - [ ] `setAuthState` / `getAuthState`
  - [ ] `setUserType` / `getUserType`
  - [ ] `clearAllAuthData` (clears everything including Supabase keys)
  - [ ] `hasValidTokens`
  - [ ] `migrateFromLegacyStorage`
  - [ ] LinkedIn/Google OAuth storage helpers

---

## Component Test Gaps (Unit)

### SignUpLoginModal
- **File:** `app/src/islands/shared/SignUpLoginModal.jsx`
- **Test File:** MISSING
- **Views needing tests:**
  - [ ] Entry view renders correctly
  - [ ] User type selection (Guest/Host cards)
  - [ ] Identity form validation (name, email, birthday)
  - [ ] Password form with requirements indicator
  - [ ] Login form with OAuth buttons
  - [ ] Password reset flow
  - [ ] Magic link flow
  - [ ] Success/confirmation views
  - [ ] Error display
  - [ ] View navigation (back buttons)
  - [ ] Form data persistence between steps
  - [ ] OAuth callback handling
  - [ ] Duplicate email modal
  - [ ] User not found modal

### ResetPasswordPage
- **File:** `app/src/islands/pages/ResetPasswordPage.jsx`
- **Test File:** MISSING
- **Missing Tests:**
  - [ ] Loading state on mount
  - [ ] Error state for invalid/expired link
  - [ ] Ready state shows form
  - [ ] Password validation (min 4 chars, match)
  - [ ] Success state and redirect
  - [ ] PASSWORD_RECOVERY event handling
  - [ ] Eye icon password visibility toggle

### AuthVerifyPage
- **File:** `app/src/islands/pages/AuthVerifyPage/AuthVerifyPage.jsx`
- **Test File:** MISSING
- **Missing Tests:**
  - [ ] Loading state on mount
  - [ ] Verifying state during OTP check
  - [ ] Success state with redirect countdown
  - [ ] Error states (expired, invalid, timeout)
  - [ ] Request new link button

---

## Integration Test Gaps

### Auth Flows Needing Integration Tests
| Flow | Test File | Status |
|------|-----------|--------|
| Sign up → Auto login → Session active | None | **Missing** |
| Sign in → Session stored → Navigate to protected | None | **Missing** |
| OAuth signup → User created → Session active | None | **Missing** |
| OAuth login → Session active | None | **Missing** |
| Password reset request → Email link → Update password | None | **Missing** |
| Magic link request → Click link → Session active | None | **Missing** |
| Session expiry → Redirect to login | None | **Missing** |
| Logout → All data cleared → Can't access protected | None | **Missing** |

---

## Backend Edge Function Gaps

### auth-user Edge Function
- **File:** `supabase/functions/auth-user/index.ts`
- **Handlers needing tests:**
  - [ ] `login` - Supabase Auth login
  - [ ] `signup` - Supabase Auth signup + public.user creation
  - [ ] `logout` - Session invalidation
  - [ ] `validate` - Token validation + user data fetch
  - [ ] `request_password_reset` - Email enumeration protection
  - [ ] `update_password` - Password update with valid session
  - [ ] `generate_magic_link` - Magic link generation
  - [ ] `oauth_signup` - OAuth user creation
  - [ ] `oauth_login` - OAuth user verification
  - [ ] `send_magic_link_sms` - SMS magic link
  - [ ] `verify_email` - Email verification

---

## Components with Good Auth Test Coverage (Reference)

**None exist.** This codebase has no auth test coverage to use as reference.

---

## Recommended Test Helper Templates

### createTestUser Helper
```typescript
// app/src/test/helpers/auth-helpers.ts
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createTestUser(overrides = {}) {
  const email = `test-${crypto.randomUUID()}@test.splitlease.com`
  const password = 'TestPassword123!'

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      user_type: 'Guest',
      first_name: 'Test',
      last_name: 'User',
    },
    ...overrides,
  })

  if (error) throw error

  return {
    user: data.user,
    email,
    password,
    cleanup: async () => {
      await adminClient.auth.admin.deleteUser(data.user.id)
    }
  }
}
```

### Mock Auth Provider
```typescript
// app/src/test/mocks/MockAuthProvider.tsx
import { createContext, useContext } from 'react'
import { vi } from 'vitest'

interface MockAuthContextValue {
  user: { id: string; email: string; userType: string } | null
  loading: boolean
  isAuthenticated: boolean
  signIn: ReturnType<typeof vi.fn>
  signOut: ReturnType<typeof vi.fn>
}

const MockAuthContext = createContext<MockAuthContextValue | null>(null)

export function MockAuthProvider({
  children,
  user = null,
  loading = false,
}: {
  children: React.ReactNode
  user?: MockAuthContextValue['user']
  loading?: boolean
}) {
  const value: MockAuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  )
}

export const useMockAuth = () => {
  const context = useContext(MockAuthContext)
  if (!context) throw new Error('useMockAuth must be used within MockAuthProvider')
  return context
}
```

### MSW Auth Handlers
```typescript
// app/src/test/mocks/handlers/auth-handlers.ts
import { http, HttpResponse } from 'msw'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export const authHandlers = [
  // Login handler
  http.post(`${SUPABASE_URL}/functions/v1/auth-user`, async ({ request }) => {
    const body = await request.json()

    if (body.action === 'login') {
      if (body.payload.email === 'valid@test.com' && body.payload.password === 'ValidPass123') {
        return HttpResponse.json({
          success: true,
          data: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            user_id: 'mock-user-id',
            user_type: 'Guest',
          }
        })
      }
      return HttpResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    if (body.action === 'signup') {
      return HttpResponse.json({
        success: true,
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user_id: 'new-user-id',
          user_type: body.payload.additionalData?.userType || 'Guest',
        }
      })
    }

    if (body.action === 'validate') {
      return HttpResponse.json({
        success: true,
        data: {
          userId: 'mock-user-id',
          firstName: 'Test',
          email: 'test@example.com',
          userType: 'Guest',
        }
      })
    }

    return HttpResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  }),

  // Supabase Auth API mocks
  http.get(`${SUPABASE_URL}/auth/v1/token*`, () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        user_metadata: { user_type: 'Guest' }
      }
    })
  }),
]
```

---

## Priority Recommendations

### Immediate (P0) - Security Critical
1. **Create test infrastructure** (vitest.config.js, setup files, MSW)
2. **Test `loginUser` function** - credentials handling, session storage
3. **Test `signupUser` function** - user creation, validation
4. **Test `validateTokenAndFetchUser`** - session validation
5. **Test `clearAllAuthData`** - ensure complete cleanup

### High Priority (P1) - Core Functionality
6. Test OAuth flows (LinkedIn/Google signup and login)
7. Test password reset flow end-to-end
8. Test magic link verification
9. Test `useAuthenticatedUser` hook
10. Test protected route access control

### Medium Priority (P2) - Edge Cases
11. Test session race condition handling
12. Test legacy storage migration
13. Test error message mapping
14. Test component UI states (loading, error, success)

### Lower Priority (P3) - Nice to Have
15. Test Edge Function handlers directly
16. Integration tests with local Supabase
17. E2E tests for complete auth flows

---

## Anti-Patterns Found

| Issue | Location | Risk |
|-------|----------|------|
| Two `isProtectedPage` implementations with different paths | `rules/auth/` vs `lib/auth.js` | Routes may be inconsistent |
| No test user cleanup mechanism | N/A | Test data pollution in dev DB |
| Direct localStorage access scattered | Multiple files | Hard to mock in tests |
| OAuth callback handling in component `useEffect` | SignUpLoginModal.jsx | Hard to test, race conditions |

---

## Next Steps

1. **Set up Vitest + React Testing Library** - Use the `/audit-vitest-rtl-setup` skill
2. **Create auth test helpers** - `createTestUser`, `MockAuthProvider`
3. **Set up MSW** - Mock Supabase Edge Functions and Auth API
4. **Write first auth tests** - Start with `loginUser` and `signupUser` unit tests
5. **Add component tests** - SignUpLoginModal, ResetPasswordPage
6. **Add integration tests** - Full auth flows

---

## Appendix: File Inventory

### Frontend Auth Files (12 files)
| File | Purpose | Lines |
|------|---------|-------|
| `app/src/lib/auth.js` | Core auth functions | 1982 |
| `app/src/lib/secureStorage.js` | Token storage | 417 |
| `app/src/lib/oauthCallbackHandler.js` | Global OAuth callback | ~100 |
| `app/src/hooks/useAuthenticatedUser.js` | Auth hook | 98 |
| `app/src/islands/shared/SignUpLoginModal.jsx` | Auth modal | 2502 |
| `app/src/islands/pages/ResetPasswordPage.jsx` | Password reset | 261 |
| `app/src/islands/pages/AuthVerifyPage/AuthVerifyPage.jsx` | OTP verify | ~50 |
| `app/src/islands/pages/AuthVerifyPage/useAuthVerifyPageLogic.js` | OTP logic | 238 |
| `app/src/logic/rules/auth/isProtectedPage.js` | Route protection | 42 |
| `app/src/islands/pages/ListingDashboardPage/hooks/useListingAuth.js` | Listing auth | ~50 |
| `app/src/islands/pages/useSearchPageAuth.js` | Search auth | ~50 |
| `app/src/auth-verify.jsx` | Entry point | ~20 |

### Backend Auth Files (12 files)
| File | Purpose |
|------|---------|
| `supabase/functions/auth-user/index.ts` | Auth router |
| `supabase/functions/auth-user/handlers/login.ts` | Login handler |
| `supabase/functions/auth-user/handlers/signup.ts` | Signup handler |
| `supabase/functions/auth-user/handlers/logout.ts` | Logout handler |
| `supabase/functions/auth-user/handlers/validate.ts` | Token validation |
| `supabase/functions/auth-user/handlers/resetPassword.ts` | Password reset request |
| `supabase/functions/auth-user/handlers/updatePassword.ts` | Password update |
| `supabase/functions/auth-user/handlers/generateMagicLink.ts` | Magic link generation |
| `supabase/functions/auth-user/handlers/oauthSignup.ts` | OAuth signup |
| `supabase/functions/auth-user/handlers/oauthLogin.ts` | OAuth login |
| `supabase/functions/auth-user/handlers/sendMagicLinkSms.ts` | SMS magic link |
| `supabase/functions/auth-user/handlers/verifyEmail.ts` | Email verification |

---

**Report Generated By:** Claude Code Audit Agent
**Audit Duration:** ~5 minutes
**Confidence Level:** HIGH - Comprehensive file review completed
