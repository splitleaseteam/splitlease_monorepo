---
name: audit-mock-auth-context
description: Audit the codebase to find components that require authentication state but lack mock auth providers in their tests. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Mock Auth Context Audit

You are conducting a comprehensive audit to identify components that require authentication state but do not have proper mock auth providers in their tests.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Components checking authentication state** - Look for:
   - `useAuth()` hook usage
   - `useSession()` hook usage
   - Checks like `if (user)` or `if (!user)`
   - `user?.id`, `user?.email`, `user?.role`
   - `session?.access_token`

2. **Protected/guarded components** - Look for:
   - Route guards or protected route wrappers
   - Components that redirect when not authenticated
   - Components showing "please sign in" messages

3. **Role-based UI components** - Look for:
   - Conditionals based on `user.role`
   - Permission checks like `user.permissions.includes()`
   - Admin-only sections
   - Seller vs buyer UI differences

4. **Components accessing user metadata** - Look for:
   - `user.user_metadata`
   - `user_metadata.full_name`, `user_metadata.avatar_url`
   - User profile displays

5. **Auth action components** - Look for:
   - Login buttons/forms
   - Logout functionality
   - Sign up flows
   - Password reset components

### What to Check for Each Target

For each identified file, check if:
- A corresponding `.test.tsx` or `.test.ts` file exists
- The test file uses a mock auth provider (not mocking useContext directly)
- Tests exist for: authenticated state, guest state, loading state
- Role-based tests exist if component has role-specific UI
- Auth transition tests exist (login → authenticated, logout → guest)

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-mock-auth-context.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Mock Auth Context Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Total auth-dependent components found: X
- Components needing mock auth providers: X
- Role-based components needing role tests: X

## Infrastructure Check

### Mock Auth Provider Status
- [ ] `MockAuthProvider` component exists
- [ ] Test fixtures for users (`mockUsers`) exist
- [ ] Test fixtures for sessions (`mockSessions`) exist
- [ ] Custom render helpers exist (`renderWithAuth`, `renderAsBuyer`, etc.)
- [ ] Location: `path/to/test-utils`

## Critical Gaps (No Auth Tests at All)

### 1. [Component/File Name]
- **File:** `path/to/file.tsx`
- **Auth Dependencies:**
  - Uses `useAuth()` at line X
  - Checks `user.role` at line Y
- **Why Testing Needed:** [Brief explanation]
- **Recommended Test Scenarios:**
  - [ ] Authenticated user sees dashboard
  - [ ] Guest user redirected/sees login prompt
  - [ ] Loading state handled
  - [ ] User metadata displayed correctly

## Role-Based UI Gaps

### 1. [Component/File Name]
- **File:** `path/to/file.tsx`
- **Roles Involved:** buyer, seller, admin
- **Missing Role Tests:**
  - [ ] Buyer view test
  - [ ] Seller view test
  - [ ] Admin view test

## Permission Check Gaps

### 1. [Component/File Name]
- **File:** `path/to/file.tsx`
- **Permission Checks Found:**
  - Owner check: `user.id === resource.owner_id`
- **Missing Tests:**
  - [ ] Owner can edit
  - [ ] Non-owner cannot edit
  - [ ] Admin can edit regardless of ownership

## Auth State Transition Gaps

### 1. [Component/File Name]
- **File:** `path/to/file.tsx`
- **Transitions Found:** Login form submission
- **Missing Tests:**
  - [ ] signIn callback tested
  - [ ] signOut callback tested
  - [ ] Error states tested

## Components with Good Auth Coverage (Reference)

List components that already have proper mock auth setup as examples.

## Recommended Test Infrastructure

If missing, recommend creating:

### MockAuthProvider Template
```typescript
// Location: src/test/MockAuthProvider.tsx
export function MockAuthProvider({ children, user, session, loading }) {
  // Implementation
}
```

### User Fixtures Template
```typescript
// Location: src/test/fixtures/users.ts
export const mockUsers = {
  buyer: { id: 'buyer-123', email: 'buyer@test.com', role: 'buyer' },
  seller: { id: 'seller-456', email: 'seller@test.com', role: 'seller' },
  admin: { id: 'admin-789', email: 'admin@test.com', role: 'admin' },
}
```

### Render Helpers Template
```typescript
// Location: src/test/test-utils.tsx
export function renderAsBuyer(ui) { ... }
export function renderAsSeller(ui) { ... }
export function renderAsAdmin(ui) { ... }
export function renderAsGuest(ui) { ... }
```

```

---

## Reference: Mock Auth Context Patterns

Use these patterns as reference when identifying what's missing in the codebase:

### When to Recommend Mock Auth Context

- Testing components that require logged-in state
- Testing role-based UI (seller vs buyer vs admin)
- Testing auth state transitions (login → logout)
- Testing components that access user data
- Isolating components from real auth infrastructure

### Pattern 1: Testing Protected Component Access

Components with auth guards need:
```typescript
// Test authenticated access
renderWithAuth(<Dashboard />)
expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()

// Test guest redirect
renderAsGuest(<Dashboard />)
expect(screen.getByText(/please sign in/i)).toBeInTheDocument()
```

### Pattern 2: Testing Role-Based UI

Components showing different UI per role need:
```typescript
// Buyer sees buyer nav
renderAsBuyer(<Navbar />)
expect(screen.getByRole('link', { name: /my bookings/i })).toBeInTheDocument()

// Seller sees seller nav
renderAsSeller(<Navbar />)
expect(screen.getByRole('link', { name: /my listings/i })).toBeInTheDocument()

// Admin sees admin nav
renderAsAdmin(<Navbar />)
expect(screen.getByRole('link', { name: /admin panel/i })).toBeInTheDocument()
```

### Pattern 3: Testing Auth State Transitions

Components with login/logout actions need:
```typescript
const onSignIn = vi.fn()
renderWithAuth(<LoginButton />, { user: null, onSignIn })
await user.click(screen.getByRole('button', { name: /sign in/i }))
expect(onSignIn).toHaveBeenCalled()
```

### Pattern 4: Testing Permission Checks

Components with ownership/permission checks need:
```typescript
// Owner can edit
renderWithAuth(<EditButton listing={listing} />, { user: { id: listing.seller_id } })
expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()

// Non-owner cannot edit
renderWithAuth(<EditButton listing={listing} />, { user: { id: 'different-id' } })
expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
```

### Pattern 5: Testing User Metadata Display

Components showing user info need:
```typescript
renderWithAuth(<ProfileCard />, {
  user: {
    ...mockUsers.seller,
    user_metadata: { full_name: 'Test User', verified: true },
  },
})
expect(screen.getByText('Test User')).toBeInTheDocument()
expect(screen.getByTestId('verified-badge')).toBeInTheDocument()
```

### Pattern 6: Testing Loading States

Auth-dependent components need:
```typescript
renderWithAuth(<Dashboard />, { loading: true })
expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Mocking `useContext` directly | Create MockAuthProvider component |
| Duplicating mock setup in each test | Use shared test-utils and fixtures |
| Hardcoding user data in tests | Use centralized mockUsers fixture |
| Only testing authenticated state | Also test guest and loading states |
| No role-based tests | Test each role's UI differences |

## Output Requirements

1. Be thorough - review EVERY file from /prime output
2. Be specific - include exact file paths and line numbers where auth hooks/checks occur
3. Be actionable - provide clear next steps for each gap found
4. Only report gaps - do not list files that already have proper mock auth coverage unless as reference examples
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-mock-auth-context.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
