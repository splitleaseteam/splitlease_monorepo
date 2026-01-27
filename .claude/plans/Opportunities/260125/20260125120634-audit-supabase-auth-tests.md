# Supabase Auth Testing Opportunity Report
**Generated:** 2026-01-25T12:06:34
**Codebase:** Split Lease

## Executive Summary
- Auth components found: **15+**
- Auth flows needing tests: **12**
- Protected routes needing tests: **10**
- **Current auth test coverage: 0%**

This audit reveals a **critical gap** in authentication test coverage. The Split Lease codebase has comprehensive, well-architected authentication functionality spanning frontend components, custom hooks, auth modules, and Edge Functions—but **zero test coverage** for any auth-related code.

---

## Infrastructure Check

### Auth Test Setup Status
- [ ] `auth-helpers.ts` exists for test user management - **MISSING**
- [ ] `createTestUser()` function exists - **MISSING**
- [ ] `createAuthenticatedClient()` function exists - **MISSING**
- [ ] Mock auth providers exist - **MISSING**
- [ ] MSW handlers for auth endpoints exist - **MISSING**

### Environment Configuration
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured for tests - **NOT VERIFIED**
- [ ] Test user cleanup in `afterAll` - **NO TEST FILES EXIST**
- [ ] Local Supabase or staging configured - **LOCAL SUPABASE AVAILABLE**

### Test Infrastructure Status
- [ ] Vitest configured - **PARTIAL** (config exists but minimal use)
- [ ] React Testing Library installed - **NEEDS VERIFICATION**
- [ ] MSW (Mock Service Worker) configured - **MISSING**
- [ ] Test database seeding scripts - **MISSING**

---

## Critical Auth Flow Gaps (No Tests)

### 1. Sign Up Flow
- **Files:**
  - Component: `app/src/islands/shared/SignUpLoginModal.jsx`
  - Module: `app/src/lib/auth.js` - `signupUser()` function
  - Sub-module: `app/src/lib/auth/signup.js`
  - Edge Function: `supabase/functions/auth-user/handlers/signup.ts`
- **API Calls:**
  - `supabase.auth.signUp()` via Edge Function
  - Creates records in: `public.user`, `host_account`, `guest_account`
- **Missing Tests:**
  - [ ] Successful signup with email/password
  - [ ] Multi-step form progression (User Type → Identity → Password)
  - [ ] Weak password rejection (validation)
  - [ ] Duplicate email handling
  - [ ] Email format validation
  - [ ] User type selection (Host vs Guest)
  - [ ] User metadata creation
  - [ ] Post-signup automatic login
  - [ ] Signup modal state management

### 2. Sign In Flow
- **Files:**
  - Component: `app/src/islands/shared/SignUpLoginModal.jsx`
  - Module: `app/src/lib/auth.js` - `loginUser()` function
  - Sub-module: `app/src/lib/auth/login.js`
  - Edge Function: `supabase/functions/auth-user/handlers/login.ts`
- **API Calls:**
  - `supabase.auth.signInWithPassword()` via Edge Function
- **Missing Tests:**
  - [ ] Successful signin with valid credentials
  - [ ] Invalid password rejection
  - [ ] Non-existent user handling
  - [ ] Loading state during authentication
  - [ ] Error message display
  - [ ] Session token storage (secureStorage)
  - [ ] Post-login redirect behavior
  - [ ] "Remember me" functionality (if applicable)

### 3. Session Management
- **Files:**
  - Hook: `app/src/hooks/useAuthenticatedUser.js` - **Gold standard 3-step fallback pattern**
  - Module: `app/src/lib/auth.js` - `checkAuthStatus()`, `isSessionValid()`, `clearAuthData()`
  - Workflow: `app/src/logic/workflows/auth/checkAuthStatusWorkflow.js`
  - Workflow: `app/src/logic/workflows/auth/validateTokenWorkflow.js`
  - Edge Function: `supabase/functions/auth-user/handlers/validate.ts`
- **API Calls:**
  - `supabase.auth.getSession()`
  - Token validation via Edge Function
- **Missing Tests:**
  - [ ] Session retrieval on app load
  - [ ] Token validation workflow (3-step fallback)
  - [ ] Session refresh before expiry
  - [ ] Session expiry handling
  - [ ] Sign out session invalidation
  - [ ] Secure storage token persistence
  - [ ] Guest fallback behavior
  - [ ] `useAuthenticatedUser` hook states (loading, error, authenticated)

### 4. Password Reset
- **Files:**
  - Component: `app/src/islands/pages/ResetPasswordPage.jsx`
  - Module: `app/src/lib/auth.js` - `requestPasswordReset()`, `updatePassword()`
  - Edge Function: `supabase/functions/auth-user/handlers/resetPassword.ts`
  - Edge Function: `supabase/functions/auth-user/handlers/updatePassword.ts`
- **API Calls:**
  - `supabase.auth.resetPasswordForEmail()`
  - `supabase.auth.updateUser({ password })`
- **Missing Tests:**
  - [ ] Reset email request success
  - [ ] Invalid email handling
  - [ ] Password update with valid token
  - [ ] Invalid/expired token handling
  - [ ] New password validation (strength requirements)
  - [ ] Password confirmation matching
  - [ ] Success redirect after reset

### 5. Magic Link / Passwordless Login
- **Files:**
  - Component: `app/src/islands/pages/AuthVerifyPage/AuthVerifyPage.jsx`
  - Logic Hook: `app/src/islands/pages/AuthVerifyPage/useAuthVerifyPageLogic.js`
  - Edge Function: `supabase/functions/auth-user/handlers/generateMagicLink.ts`
  - Edge Function: `supabase/functions/auth-user/handlers/sendMagicLinkSms.ts`
- **API Calls:**
  - `supabase.auth.signInWithOtp()`
  - `supabase.auth.verifyOtp()`
- **Missing Tests:**
  - [ ] Magic link email generation
  - [ ] Magic link SMS generation
  - [ ] OTP verification success
  - [ ] Invalid OTP handling
  - [ ] Expired OTP handling
  - [ ] Auto-login after verification
  - [ ] AuthVerifyPage state management

### 6. OAuth Authentication (LinkedIn & Google)
- **Files:**
  - Module: `app/src/lib/auth.js` - `initiateLinkedInOAuth()`, `initiateGoogleOAuth()`, etc.
  - Callback Handler: `app/src/lib/oauthCallbackHandler.js`
  - Edge Function: `supabase/functions/auth-user/handlers/oauthSignup.ts`
  - Edge Function: `supabase/functions/auth-user/handlers/oauthLogin.ts`
- **Missing Tests:**
  - [ ] LinkedIn OAuth initiation
  - [ ] Google OAuth initiation
  - [ ] OAuth callback handling
  - [ ] OAuth signup (new user creation)
  - [ ] OAuth login (existing user)
  - [ ] OAuth error handling
  - [ ] Provider data extraction

### 7. Logout Flow
- **Files:**
  - Module: `app/src/lib/auth.js` - `logoutUser()`
  - Sub-module: `app/src/lib/auth/logout.js`
  - Edge Function: `supabase/functions/auth-user/handlers/logout.ts`
  - Component: `app/src/islands/shared/Header.jsx` (logout button)
- **API Calls:**
  - `supabase.auth.signOut()`
- **Missing Tests:**
  - [ ] Successful logout
  - [ ] Session token clearing
  - [ ] Secure storage cleanup
  - [ ] UI state reset
  - [ ] Redirect after logout

---

## Protected Route Gaps

### Routes Needing Auth Tests

From `app/src/lib/auth.js` - `isProtectedPage()` function:

| Route | Component/Page | Auth Check | Test Exists |
|-------|----------------|------------|-------------|
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

### Auth Check Implementations
- **File:** `app/src/islands/pages/useSearchPageAuth.js` - Search page auth verification
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/useListingAuth.js` - Listing auth

### Missing Protected Route Tests
- [ ] Unauthenticated user redirect to login
- [ ] Authenticated user access granted
- [ ] Loading state during auth check
- [ ] Role-based access (Host vs Guest routes)
- [ ] Deep link preservation after login redirect
- [ ] Session expiry mid-navigation

---

## Auth Context/Provider Gaps

### useAuthenticatedUser Hook (Primary Auth State)
- **File:** `app/src/hooks/useAuthenticatedUser.js`
- **Pattern:** 3-step fallback (Token validation → Supabase session → Guest fallback)
- **Returns:** `{ user, userId, loading, error, isAuthenticated }`
- **Missing Tests:**
  - [ ] Initial loading state
  - [ ] Successful token validation path
  - [ ] Fallback to Supabase session
  - [ ] Fallback to guest mode
  - [ ] Error state handling
  - [ ] `isAuthenticated` accuracy
  - [ ] Re-validation on token change

### Auth Workflows
- **File:** `app/src/logic/workflows/auth/checkAuthStatusWorkflow.js`
- **File:** `app/src/logic/workflows/auth/validateTokenWorkflow.js`
- **Missing Tests:**
  - [ ] Workflow execution paths
  - [ ] Error propagation
  - [ ] State transitions

---

## Component Test Gaps (Unit)

### SignUpLoginModal
- **File:** `app/src/islands/shared/SignUpLoginModal.jsx`
- **Test File:** **MISSING**
- **Features to Test:**
  - [ ] Modal open/close behavior
  - [ ] Tab switching (Login ↔ Signup)
  - [ ] Multi-step signup form navigation
  - [ ] Form validation errors display
  - [ ] API error message display
  - [ ] Loading states (buttons disabled)
  - [ ] Success callbacks
  - [ ] OAuth button rendering

### AuthVerifyPage
- **File:** `app/src/islands/pages/AuthVerifyPage/AuthVerifyPage.jsx`
- **Logic:** `app/src/islands/pages/AuthVerifyPage/useAuthVerifyPageLogic.js`
- **Test File:** **MISSING**
- **Features to Test:**
  - [ ] OTP input handling
  - [ ] Verification success state
  - [ ] Verification error state
  - [ ] Redirect after verification
  - [ ] Loading state

### ResetPasswordPage
- **File:** `app/src/islands/pages/ResetPasswordPage.jsx`
- **Test File:** **MISSING**
- **Features to Test:**
  - [ ] New password input
  - [ ] Password confirmation matching
  - [ ] Password strength indicator
  - [ ] Submit success/error states
  - [ ] Redirect after successful reset

### Header (Auth UI)
- **File:** `app/src/islands/shared/Header.jsx`
- **Test File:** **MISSING**
- **Features to Test:**
  - [ ] Unauthenticated state (Login button visible)
  - [ ] Authenticated state (User avatar, logout)
  - [ ] Loading state
  - [ ] Logout button functionality

### SignUpTrialHost
- **File:** `app/src/islands/shared/SignUpTrialHost/SignUpTrialHost.jsx`
- **Logic:** `app/src/islands/shared/SignUpTrialHost/useSignUpTrialHostLogic.js`
- **Test File:** **MISSING**
- **Features to Test:**
  - [ ] Trial host signup form
  - [ ] Validation
  - [ ] Submission flow

### AiSignupMarketReport
- **File:** `app/src/islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx`
- **Test File:** **MISSING**
- **Features to Test:**
  - [ ] AI-powered signup flow
  - [ ] Market report generation
  - [ ] User creation

---

## Edge Function Test Gaps

### auth-user Edge Function
- **File:** `supabase/functions/auth-user/index.ts`
- **Test File:** **MISSING**
- **Handlers Needing Tests:**

| Handler | File | Tests Missing |
|---------|------|---------------|
| `login` | `handlers/login.ts` | Valid login, invalid credentials, rate limiting |
| `signup` | `handlers/signup.ts` | Valid signup, duplicate email, validation errors |
| `logout` | `handlers/logout.ts` | Session invalidation |
| `validate` | `handlers/validate.ts` | Valid token, expired token, malformed token |
| `resetPassword` | `handlers/resetPassword.ts` | Email sent, invalid email |
| `updatePassword` | `handlers/updatePassword.ts` | Valid update, weak password |
| `generateMagicLink` | `handlers/generateMagicLink.ts` | Link generation |
| `oauthSignup` | `handlers/oauthSignup.ts` | New OAuth user creation |
| `oauthLogin` | `handlers/oauthLogin.ts` | Existing OAuth user login |
| `sendMagicLinkSms` | `handlers/sendMagicLinkSms.ts` | SMS delivery |
| `verifyEmail` | `handlers/verifyEmail.ts` | Email verification |

---

## Integration Test Gaps

### Auth Flows Needing Integration Tests

| Flow | Test File | Status |
|------|-----------|--------|
| Sign up → Email verify → Login | None | **Missing** |
| Login → Session storage → Page refresh | None | **Missing** |
| Password reset email → Click link → Update password | None | **Missing** |
| Magic link request → Click link → Auto-login | None | **Missing** |
| OAuth initiate → Provider redirect → Callback → Login | None | **Missing** |
| Session expiry → Auto-logout → Redirect | None | **Missing** |
| Protected route → Redirect to login → Login → Return to route | None | **Missing** |

---

## Components with Good Auth Test Coverage (Reference)

**None.** There are currently no auth tests in the codebase to use as reference.

The only test file in the frontend (`app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`) tests matching score calculation, not auth.

---

## Recommended Test Helper Templates

### createTestUser
```typescript
// app/src/test-utils/auth-helpers.ts
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createTestUser(overrides = {}) {
  const email = `test-${crypto.randomUUID()}@splitlease-test.com`
  const password = 'TestPassword123!'

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      user_type: 'guest',
      ...overrides.user_metadata,
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
      // Also cleanup public.user, host_account, guest_account if created
    }
  }
}

export async function createAuthenticatedClient(user: { email: string; password: string }) {
  const client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )

  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })

  if (error) throw error

  return { client, session: data.session }
}
```

### Mock Auth Provider
```typescript
// app/src/test-utils/MockAuthProvider.tsx
import React from 'react'
import { vi } from 'vitest'

interface MockAuthContextValue {
  user: any
  loading: boolean
  error: Error | null
  isAuthenticated: boolean
  signIn: ReturnType<typeof vi.fn>
  signOut: ReturnType<typeof vi.fn>
}

const MockAuthContext = React.createContext<MockAuthContextValue | null>(null)

interface MockAuthProviderProps {
  children: React.ReactNode
  user?: any
  loading?: boolean
  error?: Error | null
  isAuthenticated?: boolean
}

export function MockAuthProvider({
  children,
  user = null,
  loading = false,
  error = null,
  isAuthenticated = !!user,
}: MockAuthProviderProps) {
  const value: MockAuthContextValue = {
    user,
    loading,
    error,
    isAuthenticated,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  )
}

export const mockAuthenticatedUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    user_type: 'guest',
    full_name: 'Test User',
  },
}

export const mockHostUser = {
  ...mockAuthenticatedUser,
  user_metadata: {
    user_type: 'host',
    full_name: 'Test Host',
  },
}
```

### MSW Auth Handlers
```typescript
// app/src/test-utils/msw-handlers/auth.ts
import { http, HttpResponse } from 'msw'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL

export const authHandlers = [
  // Sign in with password
  http.post(`${SUPABASE_URL}/auth/v1/token*`, async ({ request }) => {
    const body = await request.json()

    if (body.email === 'valid@test.com' && body.password === 'ValidPass123!') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        user: {
          id: 'mock-user-id',
          email: body.email,
          user_metadata: { user_type: 'guest' },
        },
      })
    }

    return HttpResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid login credentials' },
      { status: 400 }
    )
  }),

  // Sign up
  http.post(`${SUPABASE_URL}/auth/v1/signup`, async ({ request }) => {
    const body = await request.json()

    if (body.email === 'existing@test.com') {
      return HttpResponse.json(
        { error: 'user_already_exists', message: 'User already registered' },
        { status: 422 }
      )
    }

    return HttpResponse.json({
      id: 'new-user-id',
      email: body.email,
      user_metadata: body.options?.data || {},
    })
  }),

  // Get session
  http.get(`${SUPABASE_URL}/auth/v1/user`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (authHeader === 'Bearer mock-access-token') {
      return HttpResponse.json({
        id: 'mock-user-id',
        email: 'test@example.com',
        user_metadata: { user_type: 'guest' },
      })
    }

    return HttpResponse.json(
      { error: 'invalid_token' },
      { status: 401 }
    )
  }),

  // Sign out
  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return HttpResponse.json({})
  }),
]
```

### useAuthenticatedUser Test Example
```typescript
// app/src/hooks/__tests__/useAuthenticatedUser.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthenticatedUser } from '../useAuthenticatedUser'

// Mock the auth module
vi.mock('../../lib/auth', () => ({
  validateTokenAndFetchUser: vi.fn(),
  checkAuthStatus: vi.fn(),
}))

import { validateTokenAndFetchUser, checkAuthStatus } from '../../lib/auth'

describe('useAuthenticatedUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading state initially', () => {
    validateTokenAndFetchUser.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useAuthenticatedUser())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns authenticated user when token is valid', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    validateTokenAndFetchUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuthenticatedUser())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('falls back to Supabase session when token validation fails', async () => {
    const mockUser = { id: '456', email: 'session@example.com' }
    validateTokenAndFetchUser.mockRejectedValue(new Error('Invalid token'))
    checkAuthStatus.mockResolvedValue({ user: mockUser })

    const { result } = renderHook(() => useAuthenticatedUser())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('returns guest state when all auth methods fail', async () => {
    validateTokenAndFetchUser.mockRejectedValue(new Error('Invalid token'))
    checkAuthStatus.mockResolvedValue({ user: null })

    const { result } = renderHook(() => useAuthenticatedUser())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
```

---

## Priority Recommendations

### Immediate (P0) - Test Infrastructure
1. Set up Vitest with React Testing Library
2. Create `auth-helpers.ts` with `createTestUser()` and cleanup utilities
3. Create `MockAuthProvider` component
4. Set up MSW handlers for auth endpoints

### High Priority (P1) - Core Auth Tests
1. `useAuthenticatedUser` hook tests (3-step fallback pattern)
2. `lib/auth.js` unit tests (loginUser, signupUser, logoutUser)
3. `SignUpLoginModal` component tests
4. Protected route redirect tests

### Medium Priority (P2) - Flow Integration Tests
1. Complete signup → login flow
2. Password reset flow
3. Magic link verification flow
4. Session persistence across page refresh

### Lower Priority (P3) - Edge Function Tests
1. auth-user handler tests
2. OAuth flow tests
3. SMS magic link tests

---

## Anti-Patterns to Flag

| Current State | Recommendation |
|---------------|----------------|
| No test user cleanup | Always cleanup test users in `afterAll` |
| No test infrastructure | Set up Vitest + RTL + MSW |
| Testing would hit production | Configure local/staging Supabase |
| No error case testing | Test invalid credentials, expired tokens |
| No loading state testing | Test async states in components |
| No session management tests | Test token storage, refresh, expiry |

---

## Appendix: File Inventory

### Frontend Auth Files (15 files)
```
app/src/
├── lib/
│   ├── auth.js                    # Main auth module (1,982 lines)
│   ├── auth/
│   │   ├── login.js
│   │   ├── signup.js
│   │   └── logout.js
│   ├── secureStorage.js           # Encrypted token storage
│   └── oauthCallbackHandler.js    # OAuth redirect handling
├── hooks/
│   └── useAuthenticatedUser.js    # Primary auth hook
├── logic/workflows/auth/
│   ├── checkAuthStatusWorkflow.js
│   └── validateTokenWorkflow.js
├── islands/
│   ├── pages/
│   │   ├── AuthVerifyPage/
│   │   │   ├── AuthVerifyPage.jsx
│   │   │   └── useAuthVerifyPageLogic.js
│   │   ├── ResetPasswordPage.jsx
│   │   ├── useSearchPageAuth.js
│   │   └── ListingDashboardPage/hooks/useListingAuth.js
│   └── shared/
│       ├── SignUpLoginModal.jsx
│       ├── SignUpTrialHost/
│       │   ├── SignUpTrialHost.jsx
│       │   └── useSignUpTrialHostLogic.js
│       ├── AiSignupMarketReport/
│       │   └── AiSignupMarketReport.jsx
│       └── Header.jsx
└── auth-verify.jsx
```

### Backend Auth Files (12 files)
```
supabase/functions/
├── auth-user/
│   ├── index.ts                   # Main router
│   └── handlers/
│       ├── login.ts
│       ├── signup.ts
│       ├── logout.ts
│       ├── validate.ts
│       ├── resetPassword.ts
│       ├── updatePassword.ts
│       ├── generateMagicLink.ts
│       ├── oauthSignup.ts
│       ├── oauthLogin.ts
│       ├── sendMagicLinkSms.ts
│       └── verifyEmail.ts
└── _shared/
    ├── errors.ts
    ├── validation.ts
    └── cors.ts
```

### Test Files (0 auth-related)
```
# NO AUTH TEST FILES EXIST
# Only non-auth test file:
app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js
```
