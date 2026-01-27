# Iteration 22: Modern Auth Implementation Plan

**When**: After modernization is complete (next week)
**Purpose**: Implement robust, consistent authentication for all internal pages
**Approach**: Multi-layer security (route config + page logic + edge functions + infrastructure)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: INFRASTRUCTURE                       │
│              (Cloudflare Access - Optional but Recommended)      │
├─────────────────────────────────────────────────────────────────┤
│                    LAYER 2: ROUTE CONFIG                         │
│              (protected: true in routes.config.js)               │
├─────────────────────────────────────────────────────────────────┤
│                    LAYER 3: PAGE LOGIC                           │
│         (useInternalPageAuth hook with admin verification)       │
├─────────────────────────────────────────────────────────────────┤
│                    LAYER 4: EDGE FUNCTIONS                       │
│              (Server-side authorization checks)                  │
└─────────────────────────────────────────────────────────────────┘
```

**Defense in Depth**: Each layer provides independent security. If one layer fails, others still protect.

---

## Implementation Steps

### Step 1: Create Shared Auth Hook (30 min)

Create a reusable hook for all internal pages.

**File**: `app/src/lib/useInternalPageAuth.js` (NEW FILE)

```javascript
/**
 * useInternalPageAuth - Shared authentication hook for internal pages
 *
 * This hook provides a consistent auth experience for all internal pages:
 * - Checks if user is logged in
 * - Verifies admin status
 * - Handles redirects
 * - Provides loading states
 *
 * Usage:
 *   const authState = useInternalPageAuth();
 *
 *   if (authState.isChecking) return <LoadingSpinner />;
 *   if (authState.shouldRedirect) return <UnauthorizedMessage />;
 *   // Render page content
 *
 * @returns {Object} authState - Authentication state object
 */

import { useState, useEffect } from 'react';
import { checkAuthStatus, validateTokenAndFetchUser } from './auth.js';
import { supabase } from './supabase.js';

// Admin email whitelist (move to environment variable in production)
const ADMIN_EMAILS = [
  'igor@splitlease.com',
  'admin@splitlease.com',
  // Add more admin emails here
];

// Alternative: Admin role check (if you add roles to user table)
const ADMIN_ROLES = ['admin', 'super_admin'];

export function useInternalPageAuth() {
  const [authState, setAuthState] = useState({
    isChecking: true,
    isAuthenticated: false,
    isAdmin: false,
    shouldRedirect: false,
    user: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // ============================================================
        // STEP 1: Check if user is authenticated
        // ============================================================
        const isAuth = await checkAuthStatus();

        if (!isAuth) {
          if (isMounted) {
            setAuthState({
              isChecking: false,
              isAuthenticated: false,
              isAdmin: false,
              shouldRedirect: true,
              user: null,
              error: 'Not authenticated',
            });

            // Redirect to login after showing message
            setTimeout(() => {
              const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
              window.location.href = `/?login=true&returnTo=${returnTo}`;
            }, 1500);
          }
          return;
        }

        // ============================================================
        // STEP 2: Validate user data and check admin status
        // ============================================================
        const userData = await validateTokenAndFetchUser({ clearOnFailure: false });

        if (!userData) {
          if (isMounted) {
            setAuthState({
              isChecking: false,
              isAuthenticated: true,
              isAdmin: false,
              shouldRedirect: true,
              user: null,
              error: 'Unable to verify user',
            });

            setTimeout(() => {
              window.location.href = '/?login=true';
            }, 1500);
          }
          return;
        }

        // ============================================================
        // STEP 3: Check admin status
        // ============================================================
        const userEmail = userData.email?.toLowerCase();

        // METHOD A: Email whitelist (simple, quick to implement)
        const isAdminByEmail = ADMIN_EMAILS.some(email =>
          email.toLowerCase() === userEmail
        );

        // METHOD B: Role-based (requires user.role field in database)
        // Uncomment when ready to use role-based auth:
        // const isAdminByRole = userData.role && ADMIN_ROLES.includes(userData.role);

        const isAdmin = isAdminByEmail; // Change to isAdminByRole when ready

        if (!isAdmin) {
          if (isMounted) {
            setAuthState({
              isChecking: false,
              isAuthenticated: true,
              isAdmin: false,
              shouldRedirect: true,
              user: userData,
              error: 'Insufficient permissions',
            });

            // Redirect to 403 page or home
            setTimeout(() => {
              window.location.href = '/404'; // Or create /403 page
            }, 1500);
          }
          return;
        }

        // ============================================================
        // SUCCESS: User is authenticated and is admin
        // ============================================================
        if (isMounted) {
          setAuthState({
            isChecking: false,
            isAuthenticated: true,
            isAdmin: true,
            shouldRedirect: false,
            user: userData,
            error: null,
          });
        }

      } catch (err) {
        console.error('[useInternalPageAuth] Auth check failed:', err);

        if (isMounted) {
          setAuthState({
            isChecking: false,
            isAuthenticated: false,
            isAdmin: false,
            shouldRedirect: true,
            user: null,
            error: err.message,
          });

          setTimeout(() => {
            window.location.href = '/?login=true';
          }, 1500);
        }
      }
    };

    checkAuth();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  return authState;
}
```

---

### Step 2: Create UI Components for Auth States (15 min)

**File**: `app/src/islands/shared/AuthGuard/LoadingState.jsx` (NEW FILE)

```javascript
import React from 'react';
import './AuthGuard.css';

export function LoadingState() {
  return (
    <div className="auth-guard-loading">
      <div className="spinner"></div>
      <p>Verifying access...</p>
    </div>
  );
}
```

**File**: `app/src/islands/shared/AuthGuard/UnauthorizedState.jsx` (NEW FILE)

```javascript
import React from 'react';
import './AuthGuard.css';

export function UnauthorizedState({ error }) {
  const getMessage = () => {
    if (error === 'Not authenticated') {
      return {
        title: 'Authentication Required',
        message: 'You must be logged in to access this page.',
        action: 'Redirecting to login...'
      };
    }
    if (error === 'Insufficient permissions') {
      return {
        title: 'Access Denied',
        message: 'This page is restricted to administrators only.',
        action: 'Redirecting...'
      };
    }
    return {
      title: 'Access Error',
      message: 'Unable to verify your access permissions.',
      action: 'Redirecting...'
    };
  };

  const { title, message, action } = getMessage();

  return (
    <div className="auth-guard-unauthorized">
      <div className="icon">🔒</div>
      <h1>{title}</h1>
      <p>{message}</p>
      <p className="action">{action}</p>
    </div>
  );
}
```

**File**: `app/src/islands/shared/AuthGuard/AuthGuard.css` (NEW FILE)

```css
.auth-guard-loading,
.auth-guard-unauthorized {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
}

.auth-guard-loading .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.auth-guard-loading p {
  color: #666;
  font-size: 1rem;
}

.auth-guard-unauthorized .icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.auth-guard-unauthorized h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.auth-guard-unauthorized p {
  color: #666;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.auth-guard-unauthorized .action {
  color: #3498db;
  font-style: italic;
}
```

---

### Step 3: Apply to Internal Pages (2-3 hours)

Update each internal page logic hook to use the new auth guard.

**Pattern for ALL internal pages:**

**BEFORE** (current no-auth state):
```javascript
export function useAdminThreadsPageLogic() {
  const [authState, setAuthState] = useState('checking');
  const [threads, setThreads] = useState([]);
  // ... other state

  useEffect(() => {
    // No auth check currently
    setAuthState('authorized');
  }, []);

  // ... rest of logic
}
```

**AFTER** (with modern auth):
```javascript
import { useInternalPageAuth } from '../../../lib/useInternalPageAuth.js';
import { LoadingState } from '../../shared/AuthGuard/LoadingState.jsx';
import { UnauthorizedState } from '../../shared/AuthGuard/UnauthorizedState.jsx';

export function useAdminThreadsPageLogic() {
  const authState = useInternalPageAuth();
  const [threads, setThreads] = useState([]);
  // ... other state

  // Data fetching only proceeds if authenticated and authorized
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.isAdmin || authState.isChecking) {
      return; // Don't fetch data until auth confirmed
    }

    fetchThreads();
  }, [authState.isAuthenticated, authState.isAdmin, authState.isChecking]);

  return {
    authState,  // ← Export auth state
    threads,
    // ... other exports
  };
}
```

**COMPONENT UPDATE** (page component):
```javascript
import { LoadingState } from '../shared/AuthGuard/LoadingState';
import { UnauthorizedState } from '../shared/AuthGuard/UnauthorizedState';

export default function AdminThreadsPage() {
  const logic = useAdminThreadsPageLogic();

  // Handle auth states FIRST
  if (logic.authState.isChecking) {
    return <LoadingState />;
  }

  if (logic.authState.shouldRedirect) {
    return <UnauthorizedState error={logic.authState.error} />;
  }

  // Render normal page content
  return (
    <div>
      {/* Page content */}
    </div>
  );
}
```

---

### Step 4: Update Routes Config (5 min)

**File**: `app/src/routes.config.js`

Change ALL internal routes from `protected: false` to `protected: true`:

**BEFORE**:
```javascript
{
  path: '/_admin-threads',
  file: 'admin-threads.html',
  aliases: ['/_admin-threads.html'],
  protected: false,  // ← CHANGE THIS
  cloudflareInternal: true,
  internalName: 'admin-threads-view',
  hasDynamicSegment: false
},
```

**AFTER**:
```javascript
{
  path: '/_admin-threads',
  file: 'admin-threads.html',
  aliases: ['/_admin-threads.html'],
  protected: true,  // ✅ Now protected
  cloudflareInternal: true,
  internalName: 'admin-threads-view',
  hasDynamicSegment: false
},
```

**Bulk Find/Replace**:
```javascript
// Find all internal routes (lines 393-686)
// Replace:
protected: false,

// With:
protected: true,
```

**Verification**:
```bash
# Should return 24 matches (all internal pages)
grep -c "path: '/_.*protected: true" app/src/routes.config.js
```

---

### Step 5: Add Edge Function Authorization (1 hour)

Ensure Edge Functions verify admin status server-side.

**File**: `supabase/functions/_shared/middleware/adminAuth.ts` (NEW FILE)

```typescript
/**
 * Admin Authorization Middleware
 *
 * Verifies that the requesting user has admin privileges.
 * Use this middleware in Edge Functions that should only be accessible to admins.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADMIN_EMAILS = [
  'igor@splitlease.com',
  'admin@splitlease.com',
];

export async function verifyAdminAuth(req: Request): Promise<{
  isAuthorized: boolean;
  user: any;
  error?: string;
}> {
  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return {
        isAuthorized: false,
        user: null,
        error: 'Missing authorization header',
      };
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');

    // Verify with Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        isAuthorized: false,
        user: null,
        error: 'Invalid or expired token',
      };
    }

    // Check admin status
    const isAdmin = ADMIN_EMAILS.some(
      email => email.toLowerCase() === user.email?.toLowerCase()
    );

    if (!isAdmin) {
      return {
        isAuthorized: false,
        user,
        error: 'Insufficient permissions - admin access required',
      };
    }

    // Success
    return {
      isAuthorized: true,
      user,
    };

  } catch (err) {
    return {
      isAuthorized: false,
      user: null,
      error: `Auth verification failed: ${err.message}`,
    };
  }
}
```

**Usage in Edge Functions**:

```typescript
// Example: supabase/functions/pricing-admin/index.ts
import { verifyAdminAuth } from '../_shared/middleware/adminAuth.ts';

Deno.serve(async (req) => {
  // Verify admin auth FIRST
  const authResult = await verifyAdminAuth(req);

  if (!authResult.isAuthorized) {
    return new Response(
      JSON.stringify({
        success: false,
        error: authResult.error || 'Unauthorized',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Continue with function logic
  // authResult.user contains the authenticated user
});
```

**Functions to Update** (add admin auth middleware):
- `supabase/functions/pricing-admin/index.ts`
- `supabase/functions/messages/index.ts` (for admin_get_all_threads action)
- Any other Edge Functions called by internal pages

---

### Step 6: Infrastructure Layer - Cloudflare Access (Optional, 30 min)

For additional security, add Cloudflare Access as a defense-in-depth layer.

#### Option A: Cloudflare Access Dashboard

1. **Navigate to Cloudflare Dashboard**:
   - Go to Zero Trust → Access → Applications
   - Click "Add an application"

2. **Configure Application**:
   ```
   Application name: Split Lease Internal Pages
   Session Duration: 24 hours
   Application domain: split.lease
   Path: /_*
   ```

3. **Add Policy**:
   ```
   Policy name: Admin Email Domain
   Action: Allow
   Include:
     - Emails ending in: @splitlease.com
   ```

4. **Save and Deploy**

#### Option B: Cloudflare Terraform (Infrastructure as Code)

**File**: `infrastructure/cloudflare-access.tf` (NEW FILE)

```hcl
resource "cloudflare_access_application" "internal_pages" {
  zone_id          = var.zone_id
  name             = "Split Lease Internal Pages"
  domain           = "split.lease"
  type             = "self_hosted"
  session_duration = "24h"

  policies = [
    cloudflare_access_policy.admin_only.id
  ]

  cors_headers {
    allowed_origins = ["https://split.lease"]
    allow_credentials = true
  }
}

resource "cloudflare_access_policy" "admin_only" {
  application_id = cloudflare_access_application.internal_pages.id
  zone_id        = var.zone_id
  name           = "Admin Email Domain"
  precedence     = 1
  decision       = "allow"

  include {
    email_domain = ["splitlease.com"]
  }
}
```

---

## Complete Implementation Checklist

### Phase 1: Core Implementation (3-4 hours)

- [ ] Create `useInternalPageAuth.js` hook
- [ ] Create `LoadingState.jsx` component
- [ ] Create `UnauthorizedState.jsx` component
- [ ] Create `AuthGuard.css` styles
- [ ] Update routes.config.js (all `protected: true`)
- [ ] Test auth hook in isolation

### Phase 2: Page Updates (2-3 hours)

Update all 24 internal pages to use new auth:

- [ ] `/_admin-threads`
- [ ] `/_ai-tools`
- [ ] `/_co-host-requests`
- [ ] `/_create-document`
- [ ] `/_create-suggested-proposal`
- [ ] `/_email-sms-unit`
- [ ] `/_emergency`
- [ ] `/_experience-responses`
- [ ] `/_guest-relationships`
- [ ] `/_guest-simulation`
- [ ] `/_internal-test`
- [ ] `/_leases-overview`
- [ ] `/_listings-overview`
- [ ] `/_manage-informational-texts`
- [ ] `/_manage-rental-applications`
- [ ] `/_manage-virtual-meetings`
- [ ] `/_message-curation`
- [ ] `/_modify-listings`
- [ ] `/_proposal-manage`
- [ ] `/_quick-price`
- [ ] `/_send-magic-login-links`
- [ ] `/_simulation-admin`
- [ ] `/_usability-data-management`
- [ ] `/_verify-users`

### Phase 3: Edge Functions (1 hour)

- [ ] Create `adminAuth.ts` middleware
- [ ] Add admin check to `pricing-admin` function
- [ ] Add admin check to `messages` function (admin actions)
- [ ] Add admin check to any other admin functions

### Phase 4: Infrastructure (Optional, 30 min)

- [ ] Configure Cloudflare Access for `/_*` routes
- [ ] Test Cloudflare Access login flow
- [ ] Add admin email domains to whitelist

### Phase 5: Testing (2 hours)

- [ ] Test unauthenticated access (should redirect to login)
- [ ] Test authenticated non-admin access (should show 403/404)
- [ ] Test authenticated admin access (should work)
- [ ] Test all 24 pages manually
- [ ] Verify Edge Function authorization
- [ ] Verify Cloudflare Access (if configured)

---

## Testing Plan

### Test Suite 1: Authentication Flow

```javascript
// Test 1: Unauthenticated user
describe('Internal Page Auth - Unauthenticated', () => {
  beforeEach(() => {
    // Clear all auth
    localStorage.clear();
    sessionStorage.clear();
    cy.clearCookies();
  });

  it('should redirect to login', () => {
    cy.visit('/_listings-overview');
    cy.url().should('include', '?login=true');
    cy.url().should('include', 'returnTo=');
  });
});

// Test 2: Non-admin user
describe('Internal Page Auth - Non-Admin', () => {
  beforeEach(() => {
    cy.login('guest@example.com', 'password123');
  });

  it('should show access denied', () => {
    cy.visit('/_listings-overview');
    cy.contains('Access Denied').should('be.visible');
    cy.url().should('eventually.include', '/404');
  });
});

// Test 3: Admin user
describe('Internal Page Auth - Admin', () => {
  beforeEach(() => {
    cy.login('igor@splitlease.com', 'password123');
  });

  it('should access page successfully', () => {
    cy.visit('/_listings-overview');
    cy.url().should('include', '/_listings-overview');
    cy.contains('Listings Overview').should('be.visible');
  });
});
```

### Test Suite 2: Edge Function Authorization

```javascript
// Test Edge Function rejects non-admin
describe('Edge Function Admin Auth', () => {
  it('should reject non-admin user', async () => {
    const token = await getGuestToken();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/pricing-admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get_pricing_config',
      }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('admin');
  });

  it('should accept admin user', async () => {
    const token = await getAdminToken();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/pricing-admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get_pricing_config',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

---

## Migration Strategy

### Week 1: Preparation (Before Modernization Complete)

- [ ] Review this document
- [ ] Add admin emails to `ADMIN_EMAILS` constant
- [ ] Create test accounts (admin + non-admin)
- [ ] Set up testing environment

### Week 2: Implementation (After Modernization Complete)

**Day 1-2**: Core implementation
- Implement auth hook
- Create UI components
- Update 5 pages as proof of concept
- Test thoroughly

**Day 3**: Bulk page updates
- Update remaining 19 pages
- Update routes config
- Test each page

**Day 4**: Edge Functions
- Add admin middleware
- Update Edge Functions
- Test API authorization

**Day 5**: Infrastructure + Final Testing
- Configure Cloudflare Access (if using)
- Run full test suite
- Deploy to production

---

## Rollback Plan

If issues arise after deployment:

### Quick Rollback (5 minutes)

1. **Revert routes.config.js**:
   ```bash
   git checkout HEAD~1 app/src/routes.config.js
   ```

2. **Comment out auth checks in pages**:
   ```javascript
   // Temporarily disable auth
   // const authState = useInternalPageAuth();
   const authState = { isChecking: false, isAuthenticated: true, isAdmin: true };
   ```

3. **Redeploy**

### Full Rollback (15 minutes)

```bash
# Revert entire PR/commit
git revert <commit-hash>
git push origin main
```

---

## Future Enhancements

### Phase 2: Role-Based Access Control (RBAC)

Add `role` column to user table:

```sql
ALTER TABLE user ADD COLUMN role TEXT DEFAULT 'guest';
UPDATE user SET role = 'admin' WHERE email IN ('igor@splitlease.com');
```

Update auth hook to use roles:

```javascript
const isAdmin = userData.role === 'admin' || userData.role === 'super_admin';
```

### Phase 3: Granular Permissions

Different internal pages may need different permission levels:

```javascript
// app/src/lib/permissions.js
export const PERMISSIONS = {
  VIEW_LISTINGS: ['admin', 'sales'],
  MANAGE_PRICING: ['admin', 'finance'],
  VIEW_EMERGENCY: ['admin', 'support'],
};

export function hasPermission(userRole, permission) {
  return PERMISSIONS[permission]?.includes(userRole);
}
```

### Phase 4: Audit Logging

Log all internal page accesses:

```javascript
// In useInternalPageAuth hook
useEffect(() => {
  if (authState.isAuthenticated && authState.isAdmin) {
    // Log access
    logAuditEvent({
      event: 'INTERNAL_PAGE_ACCESS',
      page: window.location.pathname,
      user: authState.user.email,
      timestamp: new Date().toISOString(),
    });
  }
}, [authState]);
```

---

## Summary

**Total Implementation Time**: 8-12 hours

**Files Created**:
- `app/src/lib/useInternalPageAuth.js` (130 lines)
- `app/src/islands/shared/AuthGuard/LoadingState.jsx` (15 lines)
- `app/src/islands/shared/AuthGuard/UnauthorizedState.jsx` (40 lines)
- `app/src/islands/shared/AuthGuard/AuthGuard.css` (50 lines)
- `supabase/functions/_shared/middleware/adminAuth.ts` (80 lines)

**Files Modified**:
- `app/src/routes.config.js` (24 routes: `protected: false` → `protected: true`)
- 24 internal page logic files (add auth hook)
- 24 internal page components (add auth guards)

**Result**: Multi-layer defense-in-depth security for all internal pages.

---

**Previous Document**: `IT22_CLEANUP_OLD_AUTH_PATTERNS.md` - Remove old auth before implementing this.
