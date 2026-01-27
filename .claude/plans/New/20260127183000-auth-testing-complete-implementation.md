# Auth Testing Infrastructure - Complete Implementation Plan (All Tiers)

**Created:** 2026-01-27T18:30:00Z
**Type:** BUILD
**Total Estimated Effort:** 55-68 hours
**Priority:** P0 (Critical) → P3 (Nice to Have)
**Goal:** Comprehensive test coverage for Split Lease authentication system

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tier 0: Foundation (4-5 hours)](#tier-0-foundation-4-5-hours)
3. [Tier 1: Critical Path (14-18 hours)](#tier-1-critical-path-14-18-hours)
4. [Tier 2: Recovery & Gating (10-12 hours)](#tier-2-recovery--gating-10-12-hours)
5. [Tier 3: Alternative Auth Methods (15-17 hours)](#tier-3-alternative-auth-methods-15-17-hours)
6. [Tier 4: Edge Cases & Cleanup (12-15 hours)](#tier-4-edge-cases--cleanup-12-15-hours)
7. [Verification Steps](#verification-steps)
8. [Implementation Timeline](#implementation-timeline)
9. [Success Metrics](#success-metrics)

---

## Executive Summary

Implement comprehensive test coverage for Split Lease authentication system across 5 tiers:

| Tier | Focus Area | Time | Priority | Value |
|------|------------|------|----------|-------|
| **0** | Infrastructure Setup | 4-5 hrs | P0 | Foundation for all tests |
| **1** | Critical Path (Session, Login, Signup) | 14-18 hrs | P0 | 85% of user auth flows |
| **2** | Recovery & Gating (Protected Routes, Password Reset) | 10-12 hrs | P1 | Security & access control |
| **3** | Alternative Auth (Magic Links, OAuth) | 15-17 hrs | P2 | Alternative login methods |
| **4** | Edge Cases & UI Components | 12-15 hrs | P3 | Polish & completeness |
| **TOTAL** | | **55-68 hrs** | | **85%+ avg coverage** |

**Key Discovery:** Test infrastructure (Vitest, RTL) is ALREADY configured. We only need to add MSW for API mocking and create auth-specific test files.

**Coverage Targets:**
- Tier 0-1: 85-100% coverage (critical paths)
- Tier 2: 85%+ coverage (security gates)
- Tier 3: 85-90% coverage (alternative flows)
- Tier 4: 75-85% coverage (edge cases)

---

## 🎯 TIER 0: Foundation (4-5 hours)

**Priority:** P0 (Critical - Blocks all other tiers)
**Goal:** Set up test infrastructure with MSW for API mocking

### 0.1 Install MSW (30 min)

**Action:** Add Mock Service Worker for API mocking

```bash
cd app
bun add -D msw@latest
```

**Files Modified:**
- `app/package.json` — Adds `msw` to devDependencies

---

### 0.2 Create MSW Setup Files (2-3 hours)

#### File: `app/src/test/mocks/handlers/auth.js` (CREATE)

**Purpose:** MSW handlers for all auth-user Edge Function actions

**Implementation:**
```javascript
import { http, HttpResponse } from 'msw';

// Base URL pattern for auth-user Edge Function
const AUTH_FUNCTION_URL = '*/functions/v1/auth-user';

export const authHandlers = [
  http.post(AUTH_FUNCTION_URL, async ({ request }) => {
    const { action, payload } = await request.json();

    switch (action) {
      case 'login': {
        const { email, password } = payload;

        // Valid credentials
        if (email === 'test@example.com' && password === 'validpass') {
          return HttpResponse.json({
            access_token: 'mock-access-token-123',
            refresh_token: 'mock-refresh-token-123',
            expires_in: 3600,
            user_id: 'test-bubble-id',
            supabase_user_id: 'test-supabase-uuid',
            user_type: 'Guest',
            host_account_id: 'test-bubble-id',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            profilePhoto: null
          });
        }

        // Invalid credentials
        return HttpResponse.json(
          { success: false, error: 'Invalid email or password. Please try again.' },
          { status: 401 }
        );
      }

      case 'signup': {
        const { email, password, retype } = payload;

        // Weak password
        if (password.length < 4) {
          return HttpResponse.json(
            { success: false, error: 'Password must be at least 4 characters long.' },
            { status: 400 }
          );
        }

        // Password mismatch
        if (password !== retype) {
          return HttpResponse.json(
            { success: false, error: 'The two passwords do not match!' },
            { status: 400 }
          );
        }

        // Duplicate email
        if (email === 'test@example.com') {
          return HttpResponse.json(
            { success: false, error: 'This email is already in use.' },
            { status: 400 }
          );
        }

        // Successful signup
        return HttpResponse.json({
          access_token: 'mock-access-token-new',
          refresh_token: 'mock-refresh-token-new',
          expires_in: 3600,
          user_id: 'new-bubble-id-' + Date.now(),
          supabase_user_id: 'new-supabase-uuid-' + Date.now(),
          user_type: payload.additionalData?.userType || 'Guest',
          host_account_id: 'new-bubble-id-' + Date.now()
        }, { status: 201 });
      }

      case 'validate': {
        const { token, user_id } = payload;

        // Valid token
        if (token && user_id) {
          return HttpResponse.json({
            userId: user_id,
            firstName: 'Test',
            fullName: 'Test User',
            email: 'test@example.com',
            profilePhoto: null,
            userType: 'A Guest (I would like to rent a space)',
            accountHostId: user_id,
            aboutMe: null,
            needForSpace: null,
            specialNeeds: null,
            proposalCount: 0,
            hasSubmittedRentalApp: false,
            isUsabilityTester: false,
            phoneNumber: null
          });
        }

        // Invalid token
        return HttpResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 401 }
        );
      }

      case 'request_password_reset': {
        // ALWAYS returns success for security (prevent email enumeration)
        return HttpResponse.json({
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      case 'update_password': {
        const { password, access_token } = payload;

        // Weak password
        if (password.length < 4) {
          return HttpResponse.json(
            { success: false, error: 'Password must be at least 4 characters long.' },
            { status: 400 }
          );
        }

        // Invalid/expired token
        if (access_token === 'expired-or-invalid-token') {
          return HttpResponse.json(
            { success: false, error: 'Invalid or expired reset link. Please request a new password reset.' },
            { status: 401 }
          );
        }

        // Successful password update
        return HttpResponse.json({
          message: 'Password updated successfully. You can now sign in with your new password.'
        });
      }

      case 'oauth_login': {
        const { email } = payload;

        // User found
        if (email === 'test@example.com') {
          return HttpResponse.json({
            user_id: 'test-bubble-id',
            supabase_user_id: 'test-supabase-uuid',
            user_type: 'Guest',
            access_token: payload.access_token,
            refresh_token: payload.refresh_token,
            firstName: 'Test',
            lastName: 'User',
            profilePhoto: null
          });
        }

        // User not found (prompt signup)
        return HttpResponse.json({
          userNotFound: true,
          email,
          message: 'No account found with this email. Please sign up first.'
        });
      }

      case 'oauth_signup': {
        // Successful OAuth signup
        return HttpResponse.json({
          user_id: 'oauth-bubble-id-' + Date.now(),
          supabase_user_id: payload.supabaseUserId,
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
          user_type: 'Guest'
        }, { status: 201 });
      }

      case 'logout':
      case 'generate_magic_link':
      case 'send_magic_link_sms':
      case 'verify_email':
        // Stub handlers for other actions
        return HttpResponse.json({ success: true });

      default:
        return HttpResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  })
];
```

**Test Scenarios Supported:**
- ✅ Valid/invalid login credentials
- ✅ Successful signup
- ✅ Weak password rejection (< 4 chars)
- ✅ Duplicate email signup
- ✅ Password reset (always success for security)
- ✅ Token validation success/failure
- ✅ OAuth flows (userNotFound scenario)

---

#### File: `app/src/test/mocks/handlers/supabase.js` (CREATE)

**Purpose:** Mock Supabase client methods

**Implementation:**
```javascript
import { http, HttpResponse } from 'msw';

// Mock Supabase session structure
export function createMockSupabaseSession({
  userId = 'supabase-uuid',
  email = 'test@example.com',
  bubbleId = 'bubble-id',
  userType = 'Guest'
} = {}) {
  return {
    access_token: 'mock-supabase-token',
    refresh_token: 'mock-supabase-refresh',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: userId,
      email,
      aud: 'authenticated',
      role: 'authenticated',
      user_metadata: {
        user_id: bubbleId,
        user_type: userType,
        first_name: 'Test',
        family_name: 'User'
      },
      app_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };
}

export const supabaseHandlers = [
  // Supabase Auth API endpoints
  http.post('*/auth/v1/token', async ({ request }) => {
    const params = await request.json();

    if (params.grant_type === 'password') {
      const { email, password } = params;

      if (email === 'test@example.com' && password === 'validpass') {
        return HttpResponse.json(createMockSupabaseSession());
      }

      return HttpResponse.json(
        { error: 'Invalid login credentials' },
        { status: 400 }
      );
    }

    return HttpResponse.json({ error: 'Unsupported grant type' }, { status: 400 });
  }),

  // Get session
  http.get('*/auth/v1/user', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (authHeader && authHeader.startsWith('Bearer mock-')) {
      return HttpResponse.json(createMockSupabaseSession().user);
    }

    return HttpResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }),

  // Sign out
  http.post('*/auth/v1/logout', async () => {
    return HttpResponse.json({});
  }),

  // Verify OTP
  http.post('*/auth/v1/verify', async ({ request }) => {
    const { token_hash, type } = await request.json();

    if (token_hash === 'valid-otp-token') {
      return HttpResponse.json({
        session: createMockSupabaseSession(),
        user: createMockSupabaseSession().user
      });
    }

    return HttpResponse.json(
      { error: 'Token has expired or is invalid' },
      { status: 400 }
    );
  })
];
```

---

#### File: `app/src/test/mocks/server.js` (CREATE)

**Purpose:** MSW server instance for tests

**Implementation:**
```javascript
import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth.js';
import { supabaseHandlers } from './handlers/supabase.js';

// Combine all MSW handlers
export const server = setupServer(
  ...authHandlers,
  ...supabaseHandlers
);
```

---

### 0.3 Update Test Setup File (30 min)

#### File: `app/vitest.setup.js` (EDIT)

**Current State:**
```javascript
import '@testing-library/jest-dom';
```

**Add:**
```javascript
import '@testing-library/jest-dom';
import { server } from './src/test/mocks/server.js';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers and clear storage after each test
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  sessionStorage.clear();
});

// Clean up after all tests
afterAll(() => server.close());
```

---

### 0.4 Create Test Helper Utilities (1-2 hours)

#### File: `app/src/test/helpers/auth-helpers.js` (CREATE)

**Purpose:** Reusable auth test utilities

**Implementation:**
```javascript
/**
 * Mock authenticated user state in localStorage
 */
export function mockAuthenticatedUser({
  userId = 'test-user-id',
  sessionId = 'test-session-id',
  token = 'mock-token',
  userType = 'Guest',
  firstName = 'Test'
} = {}) {
  localStorage.setItem('__sl_at__', token);
  localStorage.setItem('__sl_sid__', sessionId);
  localStorage.setItem('sl_auth_state', 'true');
  localStorage.setItem('sl_user_id', userId);
  localStorage.setItem('sl_user_type', userType);
  localStorage.setItem('sl_first_name', firstName);
}

/**
 * Mock unauthenticated state (clear all auth data)
 */
export function mockUnauthenticatedUser() {
  localStorage.clear();
  sessionStorage.clear();
}

/**
 * Create mock Supabase session object
 */
export function createMockSupabaseSession({
  userId = 'supabase-uuid',
  email = 'test@example.com',
  bubbleId = 'bubble-id',
  userType = 'Guest'
} = {}) {
  return {
    access_token: 'mock-supabase-token',
    refresh_token: 'mock-supabase-refresh',
    expires_in: 3600,
    user: {
      id: userId,
      email,
      user_metadata: {
        user_id: bubbleId,
        user_type: userType,
        first_name: 'Test',
        family_name: 'User'
      }
    }
  };
}

/**
 * Wait for async state updates (useful for localStorage persistence checks)
 */
export async function waitForAuthPersistence(maxAttempts = 5, interval = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, interval));
    if (localStorage.getItem('__sl_at__')) return true;
  }
  return false;
}

/**
 * Mock window.location for redirect tests
 */
export function mockWindowLocation(pathname = '/', href = '') {
  delete window.location;
  window.location = {
    pathname,
    href,
    search: '',
    hash: '',
    origin: 'http://localhost',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  };
}
```

---

#### File: `app/src/test/fixtures/auth-responses.js` (CREATE)

**Purpose:** Mock auth API response payloads

**Implementation:**
```javascript
export const mockLoginSuccessResponse = {
  access_token: 'mock-access-token-123',
  refresh_token: 'mock-refresh-token-123',
  expires_in: 3600,
  user_id: 'test-bubble-id',
  supabase_user_id: 'test-supabase-uuid',
  user_type: 'Guest',
  host_account_id: 'test-bubble-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  profilePhoto: null
};

export const mockSignupSuccessResponse = {
  access_token: 'mock-access-token-new',
  refresh_token: 'mock-refresh-token-new',
  expires_in: 3600,
  user_id: 'new-bubble-id',
  supabase_user_id: 'new-supabase-uuid',
  user_type: 'Guest',
  host_account_id: 'new-bubble-id'
};

export const mockValidateSuccessResponse = {
  userId: 'test-bubble-id',
  firstName: 'Test',
  fullName: 'Test User',
  email: 'test@example.com',
  profilePhoto: null,
  userType: 'A Guest (I would like to rent a space)',
  accountHostId: 'test-bubble-id',
  aboutMe: null,
  needForSpace: null,
  specialNeeds: null,
  proposalCount: 0,
  hasSubmittedRentalApp: false,
  isUsabilityTester: false,
  phoneNumber: null
};

export const mockPasswordResetResponse = {
  message: 'If an account with that email exists, a password reset link has been sent.'
};

export const mockOAuthLoginUserNotFoundResponse = {
  userNotFound: true,
  email: 'unknown@example.com',
  message: 'No account found with this email. Please sign up first.'
};
```

---

## 🔐 TIER 1: Critical Path (14-18 hours)

**Priority:** P0 (Critical - Blocks Production)
**Goal:** Test core authentication flows (session, login, signup)

### Phase 1A: Session Management Tests (4-5 hours)

#### File: `app/src/lib/__tests__/secureStorage.test.js` (CREATE)

**Test Suites:**

1. **Token Management**
2. **Auth State Management**
3. **OAuth Flow Management**
4. **Data Clearing**
5. **Legacy Migration**

**Implementation:**
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  setAuthToken,
  getAuthToken,
  setSessionId,
  getSessionId,
  hasValidTokens,
  setAuthState,
  getAuthState,
  setUserType,
  getUserType,
  setFirstName,
  getFirstName,
  setAvatarUrl,
  getAvatarUrl,
  clearAllAuthData,
  migrateFromLegacyStorage,
  setLinkedInOAuthUserType,
  getLinkedInOAuthUserType,
  clearLinkedInOAuthUserType,
  setLinkedInOAuthLoginFlow,
  getLinkedInOAuthLoginFlow,
  clearLinkedInOAuthLoginFlow,
  setGoogleOAuthUserType,
  getGoogleOAuthUserType,
  clearGoogleOAuthUserType,
  setGoogleOAuthLoginFlow,
  getGoogleOAuthLoginFlow,
  clearGoogleOAuthLoginFlow
} from '../secureStorage.js';

describe('secureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Token Management', () => {
    it('should store and retrieve auth token', () => {
      setAuthToken('test-token-123');
      expect(getAuthToken()).toBe('test-token-123');
    });

    it('should return null when no token exists', () => {
      expect(getAuthToken()).toBeNull();
    });

    it('should store and retrieve session ID', () => {
      setSessionId('test-session-456');
      expect(getSessionId()).toBe('test-session-456');
    });

    it('should identify valid tokens when both exist', () => {
      setAuthToken('token');
      setSessionId('session');
      expect(hasValidTokens()).toBe(true);
    });

    it('should return false when either token is missing', () => {
      setAuthToken('token');
      expect(hasValidTokens()).toBe(false);

      localStorage.clear();
      setSessionId('session');
      expect(hasValidTokens()).toBe(false);
    });
  });

  describe('Auth State Management', () => {
    it('should store and retrieve auth state', () => {
      setAuthState(true, 'user-123');
      expect(getAuthState()).toBe(true);
    });

    it('should store and retrieve user type', () => {
      setUserType('Host');
      expect(getUserType()).toBe('Host');
    });

    it('should store and retrieve first name', () => {
      setFirstName('John');
      expect(getFirstName()).toBe('John');
    });

    it('should store and retrieve avatar URL', () => {
      setAvatarUrl('https://example.com/avatar.jpg');
      expect(getAvatarUrl()).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('OAuth Flow Management', () => {
    it('should store and retrieve LinkedIn OAuth user type', () => {
      setLinkedInOAuthUserType('Host');
      expect(getLinkedInOAuthUserType()).toBe('Host');
    });

    it('should clear LinkedIn OAuth user type', () => {
      setLinkedInOAuthUserType('Host');
      clearLinkedInOAuthUserType();
      expect(getLinkedInOAuthUserType()).toBeNull();
    });

    it('should store and retrieve LinkedIn OAuth login flow flag', () => {
      setLinkedInOAuthLoginFlow(true);
      expect(getLinkedInOAuthLoginFlow()).toBe(true);
    });

    it('should clear LinkedIn OAuth login flow flag', () => {
      setLinkedInOAuthLoginFlow(true);
      clearLinkedInOAuthLoginFlow();
      expect(getLinkedInOAuthLoginFlow()).toBe(false);
    });

    it('should store and retrieve Google OAuth user type', () => {
      setGoogleOAuthUserType('Guest');
      expect(getGoogleOAuthUserType()).toBe('Guest');
    });

    it('should clear Google OAuth user type', () => {
      setGoogleOAuthUserType('Guest');
      clearGoogleOAuthUserType();
      expect(getGoogleOAuthUserType()).toBeNull();
    });

    it('should store and retrieve Google OAuth login flow flag', () => {
      setGoogleOAuthLoginFlow(true);
      expect(getGoogleOAuthLoginFlow()).toBe(true);
    });

    it('should clear Google OAuth login flow flag', () => {
      setGoogleOAuthLoginFlow(true);
      clearGoogleOAuthLoginFlow();
      expect(getGoogleOAuthLoginFlow()).toBe(false);
    });
  });

  describe('Data Clearing', () => {
    it('should clear all auth data from localStorage', () => {
      setAuthToken('token');
      setSessionId('session');
      setAuthState(true, 'user-123');
      setUserType('Host');
      setFirstName('John');

      clearAllAuthData();

      expect(getAuthToken()).toBeNull();
      expect(getSessionId()).toBeNull();
      expect(getAuthState()).toBe(false);
      expect(getUserType()).toBeNull();
      expect(getFirstName()).toBeNull();
    });
  });

  describe('Legacy Migration', () => {
    it('should migrate from legacy storage keys', () => {
      // Set legacy keys
      localStorage.setItem('old_auth_token', 'legacy-token');
      localStorage.setItem('old_session_id', 'legacy-session');

      const migrated = migrateFromLegacyStorage();

      expect(migrated).toBe(true);
      expect(getAuthToken()).toBe('legacy-token');
      expect(getSessionId()).toBe('legacy-session');
    });

    it('should return false when no legacy data exists', () => {
      const migrated = migrateFromLegacyStorage();
      expect(migrated).toBe(false);
    });
  });
});
```

**Coverage Target:** 100% (pure functions, no async, no dependencies)

---

#### File: `app/src/hooks/__tests__/useAuthenticatedUser.test.js` (CREATE)

**Test Suites:**

1. **Initial Loading State**
2. **Three-Step Fallback Pattern**
3. **User Object Structure**
4. **Error Handling**
5. **Hook Cleanup**

**Implementation:**
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useAuthenticatedUser from '../useAuthenticatedUser.js';
import * as auth from '../../lib/auth.js';
import { createClient } from '../../lib/supabase.js';

vi.mock('../../lib/auth.js');
vi.mock('../../lib/supabase.js');

describe('useAuthenticatedUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading state', () => {
    vi.mocked(auth.validateTokenAndFetchUser).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useAuthenticatedUser());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should return user data on successful token validation', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      userType: 'Guest',
      avatarUrl: null,
      proposalCount: 0
    };

    vi.mocked(auth.validateTokenAndFetchUser).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.userId).toBe('user-123');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fall back to Supabase session when token validation fails', async () => {
    // Step 1: Token validation fails
    vi.mocked(auth.validateTokenAndFetchUser).mockResolvedValue(null);

    // Step 2: Supabase session exists
    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'supabase-uuid',
                email: 'test@example.com',
                user_metadata: {
                  user_id: 'bubble-id',
                  first_name: 'Test',
                  user_type: 'Guest'
                }
              }
            }
          },
          error: null
        })
      }
    };
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient);

    vi.mocked(auth.getSessionId).mockReturnValue('session-id');
    vi.mocked(auth.getUserId).mockReturnValue('bubble-id');
    vi.mocked(auth.getFirstName).mockReturnValue('Test');

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeTruthy();
    expect(result.current.user.id).toBe('bubble-id');
    expect(result.current.user.name).toBe('Test');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should return null user when no auth found (guest fallback)', async () => {
    // Step 1: Token validation fails
    vi.mocked(auth.validateTokenAndFetchUser).mockResolvedValue(null);

    // Step 2: No Supabase session
    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null
        })
      }
    };
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient);

    // Step 3: No session ID in storage
    vi.mocked(auth.getSessionId).mockReturnValue(null);

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.userId).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle validation errors gracefully', async () => {
    const mockError = new Error('Validation failed');
    vi.mocked(auth.validateTokenAndFetchUser).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe(mockError);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should not update state after unmount', async () => {
    vi.mocked(auth.validateTokenAndFetchUser).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ id: 'user' }), 100))
    );

    const { result, unmount } = renderHook(() => useAuthenticatedUser());

    unmount();

    await new Promise(resolve => setTimeout(resolve, 150));

    // Should still be in initial state (not updated after unmount)
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });
});
```

**Coverage Target:** 90%+ (hook logic, fallback patterns)

---

### Phase 1B: Login Flow Tests (5-6 hours)

#### File: `app/src/lib/__tests__/auth-login.test.js` (CREATE)

**Test Suites:**

1. **Successful Login**
2. **Invalid Credentials**
3. **Network Errors**
4. **Session Persistence Verification**

**Implementation:**
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loginUser } from '../auth.js';
import { mockUnauthenticatedUser } from '../../test/helpers/auth-helpers.js';

describe('loginUser', () => {
  beforeEach(() => {
    mockUnauthenticatedUser();
  });

  it('should successfully login with valid credentials', async () => {
    const result = await loginUser('test@example.com', 'validpass');

    expect(result.success).toBe(true);
    expect(result.data.access_token).toBe('mock-access-token-123');
    expect(result.data.user_id).toBe('test-bubble-id');

    // Verify tokens stored
    expect(localStorage.getItem('__sl_at__')).toBe('mock-access-token-123');
    expect(localStorage.getItem('__sl_sid__')).toBeTruthy();
  });

  it('should return error for invalid credentials', async () => {
    const result = await loginUser('test@example.com', 'wrongpass');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid email or password');

    // Verify no tokens stored
    expect(localStorage.getItem('__sl_at__')).toBeNull();
  });

  it('should clear old Supabase session keys on login', async () => {
    // Set old session keys
    localStorage.setItem('sb-old-auth-token', 'old-value');

    await loginUser('test@example.com', 'validpass');

    // Old keys should be cleared
    expect(localStorage.getItem('sb-old-auth-token')).toBeNull();
  });

  it('should persist session data to localStorage', async () => {
    const result = await loginUser('test@example.com', 'validpass');

    expect(result.success).toBe(true);

    // Verify all expected storage keys
    expect(localStorage.getItem('__sl_at__')).toBeTruthy();
    expect(localStorage.getItem('__sl_sid__')).toBeTruthy();
    expect(localStorage.getItem('sl_auth_state')).toBe('true');
    expect(localStorage.getItem('sl_user_id')).toBe('test-bubble-id');
    expect(localStorage.getItem('sl_user_type')).toBe('Guest');
  });

  it('should handle network errors gracefully', async () => {
    // Mock fetch failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await loginUser('test@example.com', 'validpass');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network');
  });
});
```

**Coverage Target:** 85%+ (core login logic)

---

#### File: `supabase/functions/auth-user/handlers/__tests__/login.test.ts` (CREATE)

**Test Suites:**

1. **Handler Signature**
2. **Supabase Auth Integration**
3. **Error Handling**

**Implementation:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { handleLogin } from '../login.ts';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
            refresh_token: 'test-refresh',
            expires_in: 3600,
            user: {
              id: 'supabase-uuid'
            }
          }
        },
        error: null
      })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          _id: 'bubble-id',
          email: 'test@example.com',
          'Name - First': 'Test',
          'Name - Last': 'User',
          'Profile Photo': null,
          'Type - User Current': 'A Guest (I would like to rent a space)'
        },
        error: null
      })
    }))
  }))
}));

describe('handleLogin', () => {
  it('should return user data on successful login', async () => {
    const result = await handleLogin(
      'http://test-supabase.co',
      'test-service-key',
      { email: 'test@example.com', password: 'validpass' }
    );

    expect(result.access_token).toBe('test-token');
    expect(result.user_id).toBe('bubble-id');
    expect(result.user_type).toBe('Guest');
  });

  it('should reject invalid credentials', async () => {
    // Mock auth failure
    vi.mocked(createClient).mockReturnValueOnce({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { session: null },
          error: { message: 'Invalid login credentials' }
        })
      }
    });

    await expect(
      handleLogin(
        'http://test-supabase.co',
        'test-service-key',
        { email: 'test@example.com', password: 'wrongpass' }
      )
    ).rejects.toThrow('Invalid email or password');
  });
});
```

**Coverage Target:** 80%+ (handler logic, error cases)

---

### Phase 1C: Signup Flow Tests (5-7 hours)

#### File: `app/src/lib/__tests__/auth-signup.test.js` (CREATE)

**Test Suites:**

1. **Successful Signup**
2. **Validation Errors**
3. **Duplicate Email**
4. **User Metadata**

**Implementation:**
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { signupUser } from '../auth.js';
import { mockUnauthenticatedUser } from '../../test/helpers/auth-helpers.js';

describe('signupUser', () => {
  beforeEach(() => {
    mockUnauthenticatedUser();
  });

  it('should successfully signup new user', async () => {
    const result = await signupUser(
      'new@example.com',
      'password123',
      'password123',
      {
        firstName: 'John',
        lastName: 'Doe',
        userType: 'Guest',
        birthDate: '1990-01-01'
      }
    );

    expect(result.success).toBe(true);
    expect(result.data.user_id).toBeDefined();
    expect(result.data.user_type).toBe('Guest');

    // Verify tokens stored
    expect(localStorage.getItem('__sl_at__')).toBeTruthy();
  });

  it('should reject weak password (< 4 chars)', async () => {
    const result = await signupUser('new@example.com', 'abc', 'abc');

    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 4 characters');
  });

  it('should reject password mismatch', async () => {
    const result = await signupUser('new@example.com', 'pass1234', 'pass5678');

    expect(result.success).toBe(false);
    expect(result.error).toContain('do not match');
  });

  it('should reject duplicate email', async () => {
    const result = await signupUser('test@example.com', 'password123', 'password123');

    expect(result.success).toBe(false);
    expect(result.error).toContain('already in use');
  });

  it('should send user metadata to Edge Function', async () => {
    const additionalData = {
      firstName: 'Jane',
      lastName: 'Smith',
      userType: 'Host',
      birthDate: '1985-05-15',
      phoneNumber: '+1234567890'
    };

    const result = await signupUser(
      'jane@example.com',
      'password123',
      'password123',
      additionalData
    );

    expect(result.success).toBe(true);
    expect(result.data.user_type).toBe('Host');
  });

  it('should default to Guest user type if not specified', async () => {
    const result = await signupUser(
      'default@example.com',
      'password123',
      'password123'
    );

    expect(result.success).toBe(true);
    expect(result.data.user_type).toBe('Guest');
  });
});
```

**Coverage Target:** 85%+ (signup validation and flow)

---

#### File: `supabase/functions/auth-user/handlers/__tests__/signup.test.ts` (CREATE)

**Test Suites:**

1. **User Creation**
2. **Host/Guest Account Creation**
3. **Validation**

**Implementation:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { handleSignup } from '../signup.ts';

describe('handleSignup', () => {
  it('should create new user and return tokens', async () => {
    const result = await handleSignup(
      'http://test-supabase.co',
      'test-service-key',
      {
        email: 'new@example.com',
        password: 'password123',
        retype: 'password123',
        additionalData: {
          firstName: 'John',
          lastName: 'Doe',
          userType: 'Guest'
        }
      }
    );

    expect(result.access_token).toBeDefined();
    expect(result.user_id).toBeDefined();
    expect(result.user_type).toBe('Guest');
  });

  it('should reject weak password', async () => {
    await expect(
      handleSignup(
        'http://test-supabase.co',
        'test-service-key',
        {
          email: 'new@example.com',
          password: 'ab',
          retype: 'ab'
        }
      )
    ).rejects.toThrow('at least 4 characters');
  });

  it('should reject password mismatch', async () => {
    await expect(
      handleSignup(
        'http://test-supabase.co',
        'test-service-key',
        {
          email: 'new@example.com',
          password: 'password123',
          retype: 'password456'
        }
      )
    ).rejects.toThrow('do not match');
  });
});
```

**Coverage Target:** 80%+ (signup handler logic)

---

## 🔒 TIER 2: Recovery & Gating (10-12 hours)

**Priority:** P1 (High - Before Major Release)
**Goal:** Test protected routes and password recovery flows

### Phase 2A: Protected Route Logic (4 hours)

#### File: `app/src/logic/rules/auth/__tests__/isProtectedPage.test.js` (CREATE)

**Test Suites:**

1. **Route Classification**
2. **Path Normalization**

**Implementation:**
```javascript
import { describe, it, expect } from 'vitest';
import { isProtectedPage } from '../isProtectedPage.js';

describe('isProtectedPage', () => {
  describe('Protected Routes', () => {
    const protectedRoutes = [
      '/account-profile',
      '/host-dashboard',
      '/guest-proposals',
      '/host-proposals',
      '/self-listing',
      '/listing-dashboard',
      '/host-overview',
      '/favorite-listings',
      '/rental-application',
      '/preview-split-lease'
    ];

    protectedRoutes.forEach(route => {
      it(`should identify ${route} as protected`, () => {
        expect(isProtectedPage(route)).toBe(true);
      });

      it(`should identify ${route}.html as protected (with .html suffix)`, () => {
        expect(isProtectedPage(`${route}.html`)).toBe(true);
      });
    });
  });

  describe('Public Routes', () => {
    const publicRoutes = [
      '/',
      '/browse',
      '/listing/123',
      '/about',
      '/login',
      '/signup',
      '/reset-password'
    ];

    publicRoutes.forEach(route => {
      it(`should identify ${route} as public`, () => {
        expect(isProtectedPage(route)).toBe(false);
      });
    });
  });

  describe('Path Normalization', () => {
    it('should handle trailing slashes', () => {
      expect(isProtectedPage('/account-profile/')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isProtectedPage('/Account-Profile')).toBe(true);
    });
  });
});
```

**Coverage Target:** 100% (pure function)

---

#### File: `app/src/lib/__tests__/auth-protected-routes.test.js` (CREATE)

**Test Suites:**

1. **Redirect Logic**

**Implementation:**
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkAuthStatus, redirectToLogin } from '../auth.js';
import { isProtectedPage } from '../../logic/rules/auth/isProtectedPage.js';
import { mockWindowLocation } from '../../test/helpers/auth-helpers.js';

describe('Protected Route Flow', () => {
  beforeEach(() => {
    mockWindowLocation('/account-profile');
  });

  it('should redirect unauthenticated users to login with return URL', async () => {
    vi.mocked(checkAuthStatus).mockResolvedValue(false);

    if (isProtectedPage(window.location.pathname)) {
      redirectToLogin(window.location.pathname);
    }

    expect(window.location.href).toContain('/login.html');
    expect(window.location.href).toContain('returnUrl=%2Faccount-profile');
  });

  it('should not redirect authenticated users', async () => {
    vi.mocked(checkAuthStatus).mockResolvedValue(true);
    const originalHref = window.location.href;

    if (!await checkAuthStatus() && isProtectedPage(window.location.pathname)) {
      redirectToLogin(window.location.pathname);
    }

    expect(window.location.href).toBe(originalHref);
  });

  it('should preserve query params in return URL', () => {
    mockWindowLocation('/account-profile', '?tab=settings');

    redirectToLogin('/account-profile?tab=settings');

    expect(window.location.href).toContain('returnUrl=%2Faccount-profile%3Ftab%3Dsettings');
  });
});
```

**Coverage Target:** 85%+ (integration test)

---

### Phase 2B: Password Reset Flow (6-8 hours)

#### File: `app/src/lib/__tests__/auth-password-reset.test.js` (CREATE)

**Test Suites:**

1. **Request Password Reset**
2. **Update Password**

**Implementation:**
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { requestPasswordReset, updatePassword } from '../auth.js';
import { mockUnauthenticatedUser } from '../../test/helpers/auth-helpers.js';

describe('Password Reset Flow', () => {
  beforeEach(() => {
    mockUnauthenticatedUser();
  });

  describe('requestPasswordReset', () => {
    it('should always return success to prevent email enumeration', async () => {
      // Non-existent email
      const result1 = await requestPasswordReset('nonexistent@example.com');
      expect(result1.success).toBe(true);
      expect(result1.message).toContain('If an account with that email exists');

      // Existing email
      const result2 = await requestPasswordReset('test@example.com');
      expect(result2.success).toBe(true);
      expect(result2.message).toContain('If an account with that email exists');
    });

    it('should validate email format', async () => {
      const result = await requestPasswordReset('invalid-email');
      expect(result.success).toBe(false);
      expect(result.error).toContain('valid email');
    });

    it('should accept redirectTo parameter', async () => {
      const result = await requestPasswordReset('test@example.com', '/custom-reset');
      expect(result.success).toBe(true);
    });
  });

  describe('updatePassword', () => {
    it('should update password with valid token', async () => {
      // Mock valid reset token in auth state
      localStorage.setItem('__sl_at__', 'valid-reset-token');

      const result = await updatePassword('newPassword123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Password updated successfully');
    });

    it('should reject weak passwords (< 4 chars)', async () => {
      const result = await updatePassword('abc');

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 4 characters');
    });

    it('should reject invalid/expired tokens', async () => {
      localStorage.setItem('__sl_at__', 'expired-or-invalid-token');

      const result = await updatePassword('newPassword123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or expired');
    });

    it('should preserve session after password change', async () => {
      localStorage.setItem('__sl_at__', 'valid-reset-token');

      await updatePassword('newPassword123');

      // Session should still be valid after password update
      expect(localStorage.getItem('__sl_at__')).toBeTruthy();
    });
  });
});
```

**Coverage Target:** 85%+ (password reset logic)

---

#### Files: Edge Function Handler Tests (2 hours)

- `supabase/functions/auth-user/handlers/__tests__/resetPassword.test.ts`
- `supabase/functions/auth-user/handlers/__tests__/updatePassword.test.ts`

**Coverage Target:** 80%+ each

---

## 📧 TIER 3: Alternative Auth Methods (15-17 hours)

**Priority:** P2 (Medium - Sprint Backlog)
**Goal:** Test magic links and OAuth flows

### Phase 3A: Magic Link / OTP Verification (5-6 hours)

#### File: `app/src/islands/pages/AuthVerifyPage/__tests__/useAuthVerifyPageLogic.test.js` (CREATE)

**Test Suites:**

1. **State Transitions**
2. **OTP Verification**
3. **Redirect URL Handling**
4. **Session Sync**

**Implementation:**
```javascript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useAuthVerifyPageLogic from '../useAuthVerifyPageLogic.js';
import { createClient } from '../../../lib/supabase.js';

vi.mock('../../../lib/supabase.js');

describe('useAuthVerifyPageLogic', () => {
  it('should start with loading status', () => {
    const { result } = renderHook(() => useAuthVerifyPageLogic());
    expect(result.current.status).toBe('loading');
  });

  it('should verify OTP and transition to success', async () => {
    const mockSupabase = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({
          data: { session: { access_token: 'token', user: { id: 'user-id' } } },
          error: null
        })
      }
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase);

    const { result } = renderHook(() => useAuthVerifyPageLogic());

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(mockSupabase.auth.verifyOtp).toHaveBeenCalled();
  });

  it('should handle expired tokens', async () => {
    const mockSupabase = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Token has expired' }
        })
      }
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase);

    const { result } = renderHook(() => useAuthVerifyPageLogic());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.error).toContain('expired');
    });
  });

  it('should sanitize redirect URL to prevent open redirects', async () => {
    // Mock URL with malicious redirect
    delete window.location;
    window.location = { search: '?redirectUrl=https://evil.com' };

    const { result } = renderHook(() => useAuthVerifyPageLogic());

    await waitFor(() => {
      expect(result.current.redirectUrl).not.toContain('evil.com');
      expect(result.current.redirectUrl).toContain('/'); // Internal redirect only
    });
  });
});
```

**Coverage Target:** 90%+ (verification logic)

---

#### File: `app/src/islands/pages/AuthVerifyPage/__tests__/AuthVerifyPage.test.jsx` (CREATE)

**Test Suites:**

1. **Status-Based Rendering**

**Implementation:**
```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthVerifyPage from '../AuthVerifyPage.jsx';
import useAuthVerifyPageLogic from '../useAuthVerifyPageLogic.js';

vi.mock('../useAuthVerifyPageLogic.js');

describe('AuthVerifyPage', () => {
  it('should render loading state', () => {
    vi.mocked(useAuthVerifyPageLogic).mockReturnValue({
      status: 'loading',
      error: null
    });

    render(<AuthVerifyPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render success state with redirect countdown', () => {
    vi.mocked(useAuthVerifyPageLogic).mockReturnValue({
      status: 'success',
      redirectUrl: '/account-profile',
      error: null
    });

    render(<AuthVerifyPage />);

    expect(screen.getByText(/verified successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
  });

  it('should render error state with retry button', () => {
    vi.mocked(useAuthVerifyPageLogic).mockReturnValue({
      status: 'error',
      error: 'Token has expired',
      redirectUrl: null
    });

    render(<AuthVerifyPage />);

    expect(screen.getByText(/token has expired/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
```

**Coverage Target:** 85%+ (component rendering)

---

### Phase 3B: OAuth Flows (LinkedIn & Google) (10-11 hours)

#### File: `app/src/lib/__tests__/auth-oauth-linkedin.test.js` (CREATE)

**Test Suites:**

1. **LinkedIn OAuth Signup**
2. **LinkedIn OAuth Login**

**Implementation:**
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initiateLinkedInOAuth,
  handleLinkedInOAuthCallback,
  initiateLinkedInOAuthLogin,
  handleLinkedInOAuthLoginCallback
} from '../auth.js';
import { mockWindowLocation } from '../../test/helpers/auth-helpers.js';

describe('LinkedIn OAuth Flows', () => {
  beforeEach(() => {
    localStorage.clear();
    mockWindowLocation('/');
  });

  describe('Signup Flow', () => {
    it('should store userType and redirect to LinkedIn', async () => {
      const result = await initiateLinkedInOAuth('Host');

      expect(localStorage.getItem('linkedin_oauth_user_type')).toBe('Host');
      expect(window.location.href).toContain('linkedin.com/oauth');
    });

    it('should handle callback and create user', async () => {
      // Mock OAuth session in URL hash
      window.location.hash = '#access_token=linkedin-token&refresh_token=linkedin-refresh';
      localStorage.setItem('linkedin_oauth_user_type', 'Host');

      const result = await handleLinkedInOAuthCallback();

      expect(result.success).toBe(true);
      expect(result.data.user_id).toBeDefined();

      // Flow flag should be cleared
      expect(localStorage.getItem('linkedin_oauth_user_type')).toBeNull();
    });

    it('should clear OAuth flags after successful callback', async () => {
      window.location.hash = '#access_token=token&refresh_token=refresh';
      localStorage.setItem('linkedin_oauth_user_type', 'Guest');

      await handleLinkedInOAuthCallback();

      expect(localStorage.getItem('linkedin_oauth_user_type')).toBeNull();
    });
  });

  describe('Login Flow', () => {
    it('should set login flow flag and redirect', async () => {
      await initiateLinkedInOAuthLogin();

      expect(localStorage.getItem('linkedin_oauth_login_flow')).toBe('true');
      expect(window.location.href).toContain('linkedin.com/oauth');
    });

    it('should handle user not found scenario', async () => {
      window.location.hash = '#access_token=token&refresh_token=refresh';
      localStorage.setItem('linkedin_oauth_login_flow', 'true');

      const result = await handleLinkedInOAuthLoginCallback();

      if (result.userNotFound) {
        expect(result.message).toContain('No account found');
        expect(result.email).toBeDefined();
      }
    });

    it('should dispatch custom events on success', async () => {
      const eventSpy = vi.fn();
      window.addEventListener('oauth-login-success', eventSpy);

      window.location.hash = '#access_token=token&refresh_token=refresh';
      localStorage.setItem('linkedin_oauth_login_flow', 'true');

      await handleLinkedInOAuthLoginCallback();

      expect(eventSpy).toHaveBeenCalled();
    });
  });
});
```

**Coverage Target:** 85%+ (OAuth logic)

---

#### File: `app/src/lib/__tests__/auth-oauth-google.test.js` (CREATE)

**Similar structure to LinkedIn tests**

**Coverage Target:** 85%+ (OAuth logic)

---

#### File: `app/src/lib/__tests__/oauthCallbackHandler.test.js` (CREATE)

**Test Suites:**

1. **Custom Event Dispatching**
2. **Duplicate Processing Prevention**

**Coverage Target:** 90%+ (callback handler logic)

---

#### Files: Edge Function Handler Tests (4 hours)

- `supabase/functions/auth-user/handlers/__tests__/oauthSignup.test.ts`
- `supabase/functions/auth-user/handlers/__tests__/oauthLogin.test.ts`

**Coverage Target:** 80%+ each

---

## 🎨 TIER 4: Edge Cases & Cleanup (12-15 hours)

**Priority:** P3 (Low - Nice to Have)
**Goal:** Component tests and edge case coverage

### Phase 4A: Component Tests (6-7 hours)

#### File: `app/src/islands/shared/__tests__/SignUpLoginModal.test.jsx` (CREATE)

**Test Suites:**

1. **View Transitions**
2. **Form Validation**
3. **Loading States**
4. **OAuth Buttons**

**Implementation:**
```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignUpLoginModal from '../SignUpLoginModal.jsx';

describe('SignUpLoginModal', () => {
  it('should transition from ENTRY to USER_TYPE view', async () => {
    render(<SignUpLoginModal isOpen={true} onClose={vi.fn()} />);

    const getStartedBtn = screen.getByText(/get started/i);
    await userEvent.click(getStartedBtn);

    expect(screen.getByText(/are you a host or guest/i)).toBeInTheDocument();
  });

  it('should display validation error for weak password', async () => {
    render(<SignUpLoginModal isOpen={true} onClose={vi.fn()} />);

    // Navigate to PASSWORD view (simulate previous steps)...

    const passwordInput = screen.getByLabelText(/^password$/i);
    await userEvent.type(passwordInput, 'ab');

    const submitBtn = screen.getByText(/sign up/i);
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/at least 4 characters/i)).toBeInTheDocument();
    });
  });

  it('should show loading spinner during signup', async () => {
    render(<SignUpLoginModal isOpen={true} onClose={vi.fn()} />);

    // Fill form and submit...

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('should initiate LinkedIn OAuth on button click', async () => {
    const mockInitiateLinkedIn = vi.fn();
    vi.mock('../../../lib/auth.js', () => ({
      initiateLinkedInOAuth: mockInitiateLinkedIn
    }));

    render(<SignUpLoginModal isOpen={true} onClose={vi.fn()} />);

    const linkedInBtn = screen.getByText(/sign up with linkedin/i);
    await userEvent.click(linkedInBtn);

    expect(mockInitiateLinkedIn).toHaveBeenCalled();
  });
});
```

**Coverage Target:** 80%+ (component UI)

---

#### File: `app/src/islands/pages/__tests__/ResetPasswordPage.test.jsx` (CREATE)

**Test Suites:**

1. **Password Input**
2. **Form Submission**

**Coverage Target:** 85%+ (component UI)

---

### Phase 4B: Edge Cases (6-8 hours)

#### File: `app/src/lib/__tests__/auth-logout.test.js` (CREATE)

**Test Suites:**

1. **Logout Behavior**

**Coverage Target:** 85%+ (logout logic)

---

#### File: `app/src/lib/__tests__/auth-role-based-access.test.js` (CREATE)

**Test Suites:**

1. **Host-Only Routes**
2. **Guest-Only Routes**

**Coverage Target:** 80%+ (role-based logic)

---

#### File: `app/src/lib/__tests__/auth-edge-cases.test.js` (CREATE)

**Test Suites:**

1. **Race Conditions**
2. **Network Failures**
3. **Data Corruption**

**Coverage Target:** 75%+ (edge cases)

---

## ✅ Verification Steps

### Step 1: Run All Tests
```bash
cd app
bun run test:unit
```

**Expected Output:**
- ✅ All tests pass
- ✅ Coverage report shows 85%+ for auth modules
- ✅ No console errors or warnings

---

### Step 2: Run Specific Test Suites
```bash
# Tier 0 - Infrastructure
bun run test:unit src/test/mocks/__tests__

# Tier 1A - Session Management
bun run test:unit src/lib/__tests__/secureStorage.test.js
bun run test:unit src/hooks/__tests__/useAuthenticatedUser.test.js

# Tier 1B - Login Flow
bun run test:unit src/lib/__tests__/auth-login.test.js

# Tier 1C - Signup Flow
bun run test:unit src/lib/__tests__/auth-signup.test.js

# Tier 2A - Protected Routes
bun run test:unit src/logic/rules/auth/__tests__/isProtectedPage.test.js
bun run test:unit src/lib/__tests__/auth-protected-routes.test.js

# Tier 2B - Password Reset
bun run test:unit src/lib/__tests__/auth-password-reset.test.js

# Tier 3A - Magic Link
bun run test:unit src/islands/pages/AuthVerifyPage/__tests__

# Tier 3B - OAuth
bun run test:unit src/lib/__tests__/auth-oauth-*.test.js

# Tier 4A - Components
bun run test:unit src/islands/**/__tests__/*.test.jsx

# Tier 4B - Edge Cases
bun run test:unit src/lib/__tests__/auth-edge-cases.test.js
```

---

### Step 3: Coverage Report
```bash
bun run test:unit:coverage
```

**Expected Coverage:**
- `secureStorage.js`: **100%**
- `useAuthenticatedUser.js`: **90%+**
- `auth.js` (login/signup): **85%+**
- `isProtectedPage.js`: **100%**
- Auth handlers (Edge Functions): **80%+**

---

### Step 4: Verify MSW Handlers Work
```bash
bun run test:unit src/test/mocks/__tests__/handlers-integration.test.js
```

**Test:** Verify MSW intercepts auth-user Edge Function calls correctly

---

## 📅 Implementation Timeline

### **Week 1: Foundation + Critical Path** (19-24 hours)
| Day | Focus | Hours | Deliverable |
|-----|-------|-------|-------------|
| 1-2 | Tier 0: Infrastructure | 4-5 | MSW setup complete |
| 3 | Tier 1A: Session Management | 4-5 | Storage + hook tests passing |
| 4-5 | Tier 1B: Login Flow | 5-6 | Login tests passing |
| 5-7 | Tier 1C: Signup Flow | 5-7 | Signup tests passing |

**End of Week 1:** 🎯 **Core auth flows have 85%+ test coverage**

---

### **Week 2: Recovery Flows** (10-12 hours)
| Day | Focus | Hours | Deliverable |
|-----|-------|-------|-------------|
| 8-9 | Tier 2A: Protected Routes | 4 | Route protection tests passing |
| 10-12 | Tier 2B: Password Reset | 6-8 | Password reset tests passing |

**End of Week 2:** 🎯 **Recovery flows + route protection tested**

---

### **Week 3: Alternative Auth** (15-17 hours)
| Day | Focus | Hours | Deliverable |
|-----|-------|-------|-------------|
| 13-14 | Tier 3A: Magic Link/OTP | 5-6 | Magic link tests passing |
| 15-19 | Tier 3B: OAuth Flows | 10-11 | OAuth tests passing |

**End of Week 3:** 🎯 **All auth methods have test coverage**

---

### **Week 4: Polish** (12-15 hours)
| Day | Focus | Hours | Deliverable |
|-----|-------|-------|-------------|
| 20-22 | Tier 4A: Component Tests | 6-7 | Component tests passing |
| 23-25 | Tier 4B: Edge Cases | 6-8 | Edge case tests passing |

**End of Week 4:** 🎯 **Comprehensive auth test suite complete**

---

## 🎯 Success Metrics

### Coverage Targets by Tier

| Tier | Module | Target Coverage | Critical? |
|------|--------|----------------|-----------|
| **0** | MSW Infrastructure | N/A (setup) | ✅ Yes |
| **1A** | `secureStorage.js` | 100% | ✅ Yes |
| **1A** | `useAuthenticatedUser.js` | 90%+ | ✅ Yes |
| **1B** | `loginUser()` | 85%+ | ✅ Yes |
| **1C** | `signupUser()` | 85%+ | ✅ Yes |
| **2A** | `isProtectedPage()` | 100% | ⚠️ High |
| **2B** | Password Reset | 85%+ | ⚠️ High |
| **3A** | Magic Link/OTP | 90%+ | 🟡 Medium |
| **3B** | OAuth Flows | 85%+ | 🟡 Medium |
| **4A** | UI Components | 80%+ | 🔵 Low |
| **4B** | Edge Cases | 75%+ | 🔵 Low |

---

### Quality Gates

**Before Production:**
- ✅ Tier 0 + 1 complete (infrastructure + critical path)
- ✅ 85%+ coverage on login, signup, session management
- ✅ All P0 tests passing

**Before Major Release:**
- ✅ Tier 2 complete (protected routes + password reset)
- ✅ 85%+ coverage on recovery flows
- ✅ All P0 + P1 tests passing

**Before Claiming "Comprehensive Coverage":**
- ✅ All tiers complete (0-4)
- ✅ 85%+ average coverage across all auth modules
- ✅ All tests passing (P0-P3)

---

## 📂 Critical Files Reference

### New Files to Create (26 total)

**Tier 0 (5 files):**
1. `app/src/test/mocks/handlers/auth.js`
2. `app/src/test/mocks/handlers/supabase.js`
3. `app/src/test/mocks/server.js`
4. `app/src/test/helpers/auth-helpers.js`
5. `app/src/test/fixtures/auth-responses.js`

**Tier 1 (4 files):**
6. `app/src/lib/__tests__/secureStorage.test.js`
7. `app/src/hooks/__tests__/useAuthenticatedUser.test.js`
8. `app/src/lib/__tests__/auth-login.test.js`
9. `app/src/lib/__tests__/auth-signup.test.js`
10. `supabase/functions/auth-user/handlers/__tests__/login.test.ts`
11. `supabase/functions/auth-user/handlers/__tests__/signup.test.ts`

**Tier 2 (4 files):**
12. `app/src/logic/rules/auth/__tests__/isProtectedPage.test.js`
13. `app/src/lib/__tests__/auth-protected-routes.test.js`
14. `app/src/lib/__tests__/auth-password-reset.test.js`
15. `supabase/functions/auth-user/handlers/__tests__/resetPassword.test.ts`
16. `supabase/functions/auth-user/handlers/__tests__/updatePassword.test.ts`

**Tier 3 (6 files):**
17. `app/src/islands/pages/AuthVerifyPage/__tests__/useAuthVerifyPageLogic.test.js`
18. `app/src/islands/pages/AuthVerifyPage/__tests__/AuthVerifyPage.test.jsx`
19. `app/src/lib/__tests__/auth-oauth-linkedin.test.js`
20. `app/src/lib/__tests__/auth-oauth-google.test.js`
21. `app/src/lib/__tests__/oauthCallbackHandler.test.js`
22. `supabase/functions/auth-user/handlers/__tests__/oauthSignup.test.ts`
23. `supabase/functions/auth-user/handlers/__tests__/oauthLogin.test.ts`

**Tier 4 (5 files):**
24. `app/src/islands/shared/__tests__/SignUpLoginModal.test.jsx`
25. `app/src/islands/pages/__tests__/ResetPasswordPage.test.jsx`
26. `app/src/lib/__tests__/auth-logout.test.js`
27. `app/src/lib/__tests__/auth-role-based-access.test.js`
28. `app/src/lib/__tests__/auth-edge-cases.test.js`

### Modified Files (2 total)

1. `app/package.json` — Add MSW dependency
2. `app/vitest.setup.js` — Add MSW server lifecycle hooks

---

## 🚀 Quick Start Commands

```bash
# Install MSW
cd app
bun add -D msw@latest

# Run tests (after implementation)
bun run test:unit

# Run with coverage
bun run test:unit:coverage

# Run specific tier
bun run test:unit src/lib/__tests__/secureStorage.test.js

# Watch mode (during development)
bun run test:unit --watch
```

---

## 🎓 Key Insights

**Test Pyramid Inversion:**
We spend MORE time on unit/integration tests (Tiers 0-2) than component tests (Tier 4A). This inverts the typical test pyramid but is **intentional**: auth logic is more critical than UI rendering. A button that looks wrong is annoying; a login flow that leaks sessions is catastrophic.

**Incremental Value Delivery:**
Each tier provides **immediate production value**. After Tier 1, you have 85% coverage of auth flows users actually hit. Tiers 2-4 are refinement, not prerequisites. This allows you to ship with confidence before completing all 68 hours.

**MSW vs Direct Mocking:**
The plan uses MSW (Mock Service Worker) to intercept HTTP requests at the network level rather than mocking the Supabase client directly. This approach tests the **actual integration points** (Edge Function calls) rather than implementation details, making tests more resilient to refactoring.

---

## 📊 Risk Mitigation

| Risk | Mitigation Strategy |
|------|-------------------|
| MSW version compatibility with Vitest | Use latest MSW v2.x which has first-class Vitest support |
| Supabase client mocking complexity | Mock at Edge Function level (HTTP) rather than client internals |
| Race conditions in session persistence tests | Use `waitFor` from RTL and retry logic in test helpers |
| Test data pollution between tests | Clear localStorage/sessionStorage in `afterEach` hook |
| Flaky tests due to timing issues | Use `waitFor` with appropriate timeouts, avoid hardcoded delays |

---

**TOTAL ESTIMATED TIME:** 55-68 hours
**PRIORITY:** P0 (Critical) → P3 (Nice to Have)
**DEPENDENCIES:** None (test infrastructure already exists)

---

**END OF DOCUMENT**
