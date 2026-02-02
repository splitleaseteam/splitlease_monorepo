---
name: audit-supabase-auth-tests
description: Audit the codebase to find Supabase authentication flows (signup, signin, session management, password reset) that lack proper test coverage. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Supabase Auth Testing Audit

You are conducting a comprehensive audit to identify Supabase authentication flows that do not have proper test coverage.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Auth-related components** - Look for:
   - Login forms/pages
   - Signup forms/pages
   - Password reset components
   - Profile/settings pages
   - Protected route wrappers

2. **Auth contexts/providers** - Look for:
   - `AuthContext`, `AuthProvider`
   - `useAuth` hooks
   - Session management code
   - `supabase.auth.*` calls

3. **Auth API calls** - Look for:
   - `signInWithPassword`
   - `signUp`
   - `signOut`
   - `resetPasswordForEmail`
   - `updateUser`
   - `getSession`
   - `onAuthStateChange`

4. **Protected routes** - Look for:
   - Route guards
   - Auth redirect logic
   - Session verification

5. **Test helper files** - Check for:
   - `auth-helpers.ts` for test user creation
   - `createTestUser` functions
   - Mock auth providers

### What to Check for Each Target

For each auth-related file, check if:
- Unit tests exist for components
- Integration tests exist for auth flows
- Mock auth providers are used in component tests
- Auth error states are tested
- Session management is tested

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-supabase-auth-tests.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Supabase Auth Testing Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Auth components found: X
- Auth flows needing tests: X
- Protected routes needing tests: X

## Infrastructure Check

### Auth Test Setup Status
- [ ] `auth-helpers.ts` exists for test user management
- [ ] `createTestUser()` function exists
- [ ] `createAuthenticatedClient()` function exists
- [ ] Mock auth providers exist
- [ ] MSW handlers for auth endpoints exist

### Environment Configuration
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured for tests
- [ ] Test user cleanup in `afterAll`
- [ ] Local Supabase or staging configured

## Critical Auth Flow Gaps (No Tests)

### 1. Sign Up Flow
- **Files:**
  - Component: `path/to/SignUpForm.tsx`
  - API: `supabase.auth.signUp()` at line X
- **Missing Tests:**
  - [ ] Successful signup
  - [ ] Weak password rejection
  - [ ] Duplicate email handling
  - [ ] Email validation
  - [ ] User metadata creation

### 2. Sign In Flow
- **Files:**
  - Component: `path/to/LoginForm.tsx`
  - API: `supabase.auth.signInWithPassword()` at line X
- **Missing Tests:**
  - [ ] Successful signin
  - [ ] Invalid password rejection
  - [ ] Non-existent user handling
  - [ ] Loading state
  - [ ] Error display

### 3. Session Management
- **Files:**
  - Context: `path/to/AuthContext.tsx`
  - API: `supabase.auth.getSession()` at line X
- **Missing Tests:**
  - [ ] Session retrieval
  - [ ] Session refresh
  - [ ] Session expiry handling
  - [ ] Sign out invalidation

### 4. Password Reset
- **Files:**
  - Component: `path/to/PasswordResetForm.tsx`
- **Missing Tests:**
  - [ ] Reset email sent
  - [ ] Password update with token
  - [ ] Invalid token handling

## Protected Route Gaps

### Routes Needing Auth Tests
| Route | Component | Auth Check | Test Exists |
|-------|-----------|------------|-------------|
| /dashboard | Dashboard.tsx | Yes | No |
| /profile | Profile.tsx | Yes | No |
| /bookings | Bookings.tsx | Yes | No |

### Missing Protected Route Tests
- [ ] Unauthenticated user redirect
- [ ] Authenticated user access
- [ ] Loading state during auth check
- [ ] Role-based access (if applicable)

## Auth Context/Provider Gaps

### AuthContext
- **File:** `path/to/AuthContext.tsx`
- **Missing Tests:**
  - [ ] Initial auth state
  - [ ] signIn updates user state
  - [ ] signOut clears user state
  - [ ] Error handling
  - [ ] onAuthStateChange subscription

## Component Test Gaps (Unit)

### Login Form
- **File:** `path/to/LoginForm.tsx`
- **Test File:** Missing / Exists without auth tests
- **Missing:**
  - [ ] Form validation errors
  - [ ] API error display
  - [ ] Loading state
  - [ ] Success callback

### Signup Form
- **File:** `path/to/SignUpForm.tsx`
- **Missing:**
  - [ ] Password strength validation
  - [ ] Matching password confirmation
  - [ ] Terms acceptance

## Integration Test Gaps

### Auth Flows Needing Integration Tests
| Flow | Test File | Status |
|------|-----------|--------|
| Sign up → Verify → Login | None | Missing |
| Login → Session → Refresh | None | Missing |
| Password reset flow | None | Missing |

## Components with Good Auth Test Coverage (Reference)

List components that already have proper auth testing as examples.

## Recommended Test Helper Templates

### createTestUser
```typescript
export async function createTestUser(overrides = {}) {
  const email = `test-${crypto.randomUUID()}@test.com`
  const password = 'TestPassword123!'

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    ...overrides,
  })

  return {
    user: data.user,
    email,
    password,
    cleanup: async () => adminClient.auth.admin.deleteUser(data.user.id)
  }
}
```

### Mock Auth Provider
```typescript
export function MockAuthProvider({ children, user, loading }) {
  const value = {
    user,
    loading,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

```

---

## Reference: Supabase Auth Testing Patterns

### Test Approaches

| Approach | Speed | Fidelity | Use Case |
|----------|-------|----------|----------|
| MSW Mocks | Fast | Low | Unit tests |
| Supabase Local | Medium | High | Integration |
| Supabase Staging | Slow | Highest | E2E |

### Pattern 1: Integration Test - Sign In

```typescript
it('signs in with valid credentials', async () => {
  const { email, password, cleanup } = await createTestUser()
  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    expect(error).toBeNull()
    expect(data.session).toBeDefined()
  } finally {
    await cleanup()
  }
})
```

### Pattern 2: Unit Test - Auth Context

```typescript
it('provides user after sign in', async () => {
  server.use(
    http.post('*/auth/v1/token*', () => {
      return HttpResponse.json({
        access_token: 'mock-token',
        user: { id: '123', email: 'test@example.com' },
      })
    })
  )
  // ... render and test
})
```

### Pattern 3: Protected Route Test

```typescript
it('redirects unauthenticated users', () => {
  render(<ProtectedRoute><Dashboard /></ProtectedRoute>)
  expect(screen.getByText('Login Page')).toBeInTheDocument()
})
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Real user emails in tests | Generate unique test emails |
| No test user cleanup | Always cleanup in afterAll |
| Testing against production | Use local/staging Supabase |
| Only testing happy path | Test errors, invalid credentials |

## Output Requirements

1. Be thorough - review EVERY auth-related file
2. Be specific - include exact file paths and line numbers
3. Be actionable - provide test templates
4. Only report gaps - do not list already tested flows unless as reference
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-supabase-auth-tests.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
