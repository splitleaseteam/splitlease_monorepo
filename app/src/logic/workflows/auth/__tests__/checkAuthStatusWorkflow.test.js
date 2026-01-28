/**
 * Tests for checkAuthStatusWorkflow
 *
 * Orchestrates checking authentication status across multiple sources:
 * - Split Lease cookies (cross-domain compatibility)
 * - Secure storage tokens
 */
import { describe, it, expect } from 'vitest';
import { checkAuthStatusWorkflow } from '../checkAuthStatusWorkflow.js';

describe('checkAuthStatusWorkflow', () => {
  // ============================================================================
  // Happy Path - Authenticated via Cookies (Priority 1)
  // ============================================================================
  describe('authenticated via cookies (priority 1)', () => {
    it('should return authenticated when logged in via cookies', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: true, username: 'john@example.com' },
        authState: false,
        hasValidTokens: false
      });

      expect(result.isAuthenticated).toBe(true);
      expect(result.source).toBe('cookies');
      expect(result.username).toBe('john@example.com');
    });

    it('should prioritize cookies over secure storage', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: true, username: 'cookie@user.com' },
        authState: true,
        hasValidTokens: true
      });

      // Cookies take priority
      expect(result.isAuthenticated).toBe(true);
      expect(result.source).toBe('cookies');
      expect(result.username).toBe('cookie@user.com');
    });

    it('should handle cookies with empty username', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: true, username: '' },
        authState: false,
        hasValidTokens: false
      });

      expect(result.isAuthenticated).toBe(true);
      expect(result.source).toBe('cookies');
      expect(result.username).toBe('');
    });

    it('should handle cookies with null username', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: true, username: null },
        authState: false,
        hasValidTokens: false
      });

      expect(result.isAuthenticated).toBe(true);
      expect(result.source).toBe('cookies');
      expect(result.username).toBe(null);
    });
  });

  // ============================================================================
  // Happy Path - Authenticated via Secure Storage (Priority 2)
  // ============================================================================
  describe('authenticated via secure storage (priority 2)', () => {
    it('should return authenticated when not logged in via cookies but has valid tokens', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: true,
        hasValidTokens: true
      });

      expect(result.isAuthenticated).toBe(true);
      expect(result.source).toBe('secure_storage');
      expect(result.username).toBe(null);
    });

    it('should return authenticated when both authState and hasValidTokens are true', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: '' },
        authState: true,
        hasValidTokens: true
      });

      expect(result.isAuthenticated).toBe(true);
      expect(result.source).toBe('secure_storage');
    });
  });

  // ============================================================================
  // Not Authenticated
  // ============================================================================
  describe('not authenticated', () => {
    it('should return not authenticated when cookies not logged in and no valid tokens', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: false,
        hasValidTokens: false
      });

      expect(result.isAuthenticated).toBe(false);
      expect(result.source).toBe(null);
      expect(result.username).toBe(null);
    });

    it('should return not authenticated when only authState is true (no valid tokens)', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: true,
        hasValidTokens: false
      });

      expect(result.isAuthenticated).toBe(false);
      expect(result.source).toBe(null);
      expect(result.username).toBe(null);
    });

    it('should return not authenticated when only hasValidTokens is true (no authState)', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: false,
        hasValidTokens: true
      });

      expect(result.isAuthenticated).toBe(false);
      expect(result.source).toBe(null);
      expect(result.username).toBe(null);
    });

    it('should return not authenticated when all sources are false', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: '' },
        authState: false,
        hasValidTokens: false
      });

      expect(result.isAuthenticated).toBe(false);
      expect(result.source).toBe(null);
    });
  });

  // ============================================================================
  // Error Handling - splitLeaseCookies Validation
  // ============================================================================
  describe('error handling - splitLeaseCookies validation', () => {
    it('should throw error for null splitLeaseCookies', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: null,
        authState: true,
        hasValidTokens: true
      })).toThrow('splitLeaseCookies is required');
    });

    it('should throw error for undefined splitLeaseCookies', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: undefined,
        authState: true,
        hasValidTokens: true
      })).toThrow('splitLeaseCookies is required');
    });

    it('should throw error for non-object splitLeaseCookies', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: 'not an object',
        authState: true,
        hasValidTokens: true
      })).toThrow('splitLeaseCookies is required');
    });

    it('should handle array splitLeaseCookies (treated as object)', () => {
      // Note: Arrays are objects in JavaScript, so they pass the type check
      // The function will check for isLoggedIn property which won't exist
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: [],
        authState: true,
        hasValidTokens: true
      });
      // isLoggedIn is undefined (falsy), falls through to secure_storage
      expect(result.isAuthenticated).toBe(true);
      expect(result.source).toBe('secure_storage');
    });

    it('should throw error for number splitLeaseCookies', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: 123,
        authState: true,
        hasValidTokens: true
      })).toThrow('splitLeaseCookies is required');
    });
  });

  // ============================================================================
  // Error Handling - authState Validation
  // ============================================================================
  describe('error handling - authState validation', () => {
    it('should throw error for non-boolean authState', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: 'true',
        hasValidTokens: true
      })).toThrow('authState must be a boolean');
    });

    it('should throw error for null authState', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: null,
        hasValidTokens: true
      })).toThrow('authState must be a boolean');
    });

    it('should throw error for undefined authState', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: undefined,
        hasValidTokens: true
      })).toThrow('authState must be a boolean');
    });

    it('should throw error for number authState', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: 1,
        hasValidTokens: true
      })).toThrow('authState must be a boolean');
    });

    it('should throw error for object authState', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: {},
        hasValidTokens: true
      })).toThrow('authState must be a boolean');
    });
  });

  // ============================================================================
  // Error Handling - hasValidTokens Validation
  // ============================================================================
  describe('error handling - hasValidTokens validation', () => {
    it('should throw error for non-boolean hasValidTokens', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: true,
        hasValidTokens: 'true'
      })).toThrow('hasValidTokens must be a boolean');
    });

    it('should throw error for null hasValidTokens', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: true,
        hasValidTokens: null
      })).toThrow('hasValidTokens must be a boolean');
    });

    it('should throw error for undefined hasValidTokens', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: true,
        hasValidTokens: undefined
      })).toThrow('hasValidTokens must be a boolean');
    });

    it('should throw error for number hasValidTokens', () => {
      expect(() => checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: true,
        hasValidTokens: 0
      })).toThrow('hasValidTokens must be a boolean');
    });
  });

  // ============================================================================
  // Output Structure Verification
  // ============================================================================
  describe('output structure verification', () => {
    it('should return all expected properties', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: true, username: 'test@user.com' },
        authState: false,
        hasValidTokens: false
      });

      expect(result).toHaveProperty('isAuthenticated');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('username');
    });

    it('should return correct types for all properties when authenticated via cookies', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: true, username: 'test@user.com' },
        authState: false,
        hasValidTokens: false
      });

      expect(typeof result.isAuthenticated).toBe('boolean');
      expect(typeof result.source).toBe('string');
      expect(typeof result.username).toBe('string');
    });

    it('should return correct types for all properties when authenticated via secure storage', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: true,
        hasValidTokens: true
      });

      expect(typeof result.isAuthenticated).toBe('boolean');
      expect(typeof result.source).toBe('string');
      // username is null for secure_storage
      expect(result.username).toBe(null);
    });

    it('should return correct types for all properties when not authenticated', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: false,
        hasValidTokens: false
      });

      expect(typeof result.isAuthenticated).toBe('boolean');
      expect(result.source).toBe(null);
      expect(result.username).toBe(null);
    });
  });

  // ============================================================================
  // Priority Logic Tests
  // ============================================================================
  describe('priority logic tests', () => {
    it('should always prefer cookies when isLoggedIn is true', () => {
      const scenarios = [
        { authState: true, hasValidTokens: true },
        { authState: true, hasValidTokens: false },
        { authState: false, hasValidTokens: true },
        { authState: false, hasValidTokens: false }
      ];

      for (const scenario of scenarios) {
        const result = checkAuthStatusWorkflow({
          splitLeaseCookies: { isLoggedIn: true, username: 'priority@test.com' },
          ...scenario
        });

        expect(result.source).toBe('cookies');
        expect(result.username).toBe('priority@test.com');
      }
    });

    it('should use secure_storage only when cookies isLoggedIn is false', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: 'ignored@test.com' },
        authState: true,
        hasValidTokens: true
      });

      expect(result.source).toBe('secure_storage');
      expect(result.username).toBe(null); // secure_storage doesn't have username
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle splitLeaseCookies with extra properties', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: {
          isLoggedIn: true,
          username: 'test@user.com',
          extraProp: 'ignored',
          anotherProp: 123
        },
        authState: false,
        hasValidTokens: false
      });

      expect(result.isAuthenticated).toBe(true);
      expect(result.source).toBe('cookies');
    });

    it('should handle empty object splitLeaseCookies', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: {},
        authState: false,
        hasValidTokens: false
      });

      // isLoggedIn would be undefined (falsy), so not authenticated via cookies
      expect(result.isAuthenticated).toBe(false);
    });

    it('should handle splitLeaseCookies.isLoggedIn as undefined', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { username: 'test@user.com' },
        authState: true,
        hasValidTokens: true
      });

      // isLoggedIn is undefined (falsy), falls through to secure_storage
      expect(result.isAuthenticated).toBe(true);
      expect(result.source).toBe('secure_storage');
    });

    it('should handle username with spaces', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: true, username: ' test@user.com ' },
        authState: false,
        hasValidTokens: false
      });

      expect(result.username).toBe(' test@user.com ');
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should work with extra properties in params object', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: true, username: 'test@user.com' },
        authState: false,
        hasValidTokens: false,
        extraProp: 'ignored'
      });

      expect(result.isAuthenticated).toBe(true);
    });

    it('should throw error for missing params object', () => {
      expect(() => checkAuthStatusWorkflow())
        .toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => checkAuthStatusWorkflow({}))
        .toThrow();
    });
  });

  // ============================================================================
  // Real-World Scenario Tests
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should handle fresh login via cookies', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: true, username: 'newuser@splitlease.com' },
        authState: false,
        hasValidTokens: false
      });

      expect(result.isAuthenticated).toBe(true);
      expect(result.source).toBe('cookies');
    });

    it('should handle returning user with stored tokens', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: true,
        hasValidTokens: true
      });

      expect(result.isAuthenticated).toBe(true);
      expect(result.source).toBe('secure_storage');
    });

    it('should handle logged out user', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: false,
        hasValidTokens: false
      });

      expect(result.isAuthenticated).toBe(false);
    });

    it('should handle expired tokens', () => {
      const result = checkAuthStatusWorkflow({
        splitLeaseCookies: { isLoggedIn: false, username: null },
        authState: true,
        hasValidTokens: false // Tokens exist but are invalid/expired
      });

      expect(result.isAuthenticated).toBe(false);
    });
  });
});
