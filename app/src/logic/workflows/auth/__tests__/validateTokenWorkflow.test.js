/**
 * Tests for validateTokenWorkflow
 *
 * Validate token and fetch user data workflow.
 * Three-step process to validate authentication and retrieve user profile.
 */
import { describe, it, expect, vi } from 'vitest';
import { validateTokenWorkflow } from '../validateTokenWorkflow.js';

describe('validateTokenWorkflow', () => {
  // Mock functions
  const createMockBubbleValidateFn = (isValid) => vi.fn().mockResolvedValue(isValid);
  const createMockSupabaseFetchUserFn = (userData) => vi.fn().mockResolvedValue(userData);

  const mockUserData = {
    _id: 'user_123',
    'Name - First': 'John',
    'Name - Full': 'John Doe',
    'Profile Photo': 'https://example.com/photo.jpg',
    'Type - User Current': 'A Guest (I would like to rent a space)'
  };

  // ============================================================================
  // Happy Path - Valid Token and User
  // ============================================================================
  describe('valid token and user', () => {
    it('should return user data for valid token', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(mockUserData);

      const result = await validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn,
        cachedUserType: null
      });

      expect(result).not.toBeNull();
      expect(result.userId).toBe('user_123');
      expect(result.firstName).toBe('John');
      expect(result.fullName).toBe('John Doe');
    });

    it('should call bubbleValidateFn with token and userId', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(mockUserData);

      await validateTokenWorkflow({
        token: 'my_token',
        userId: 'my_user',
        bubbleValidateFn,
        supabaseFetchUserFn
      });

      expect(bubbleValidateFn).toHaveBeenCalledWith('my_token', 'my_user');
    });

    it('should call supabaseFetchUserFn with userId', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(mockUserData);

      await validateTokenWorkflow({
        token: 'my_token',
        userId: 'my_user',
        bubbleValidateFn,
        supabaseFetchUserFn
      });

      expect(supabaseFetchUserFn).toHaveBeenCalledWith('my_user');
    });
  });

  // ============================================================================
  // Cached User Type
  // ============================================================================
  describe('cached user type', () => {
    it('should use cachedUserType when provided', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(mockUserData);

      const result = await validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn,
        cachedUserType: 'A Host (I have a space available to rent)'
      });

      expect(result.userType).toBe('A Host (I have a space available to rent)');
    });

    it('should fetch userType from userData when cachedUserType is null', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(mockUserData);

      const result = await validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn,
        cachedUserType: null
      });

      expect(result.userType).toBe('A Guest (I would like to rent a space)');
    });

    it('should fetch userType from userData when cachedUserType is empty string', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(mockUserData);

      const result = await validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn,
        cachedUserType: ''
      });

      expect(result.userType).toBe('A Guest (I would like to rent a space)');
    });
  });

  // ============================================================================
  // Profile Photo URL Handling
  // ============================================================================
  describe('profile photo URL handling', () => {
    it('should preserve https:// URL', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn({
        ...mockUserData,
        'Profile Photo': 'https://example.com/photo.jpg'
      });

      const result = await validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      });

      expect(result.profilePhoto).toBe('https://example.com/photo.jpg');
    });

    it('should add https: prefix to protocol-relative URL', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn({
        ...mockUserData,
        'Profile Photo': '//example.com/photo.jpg'
      });

      const result = await validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      });

      expect(result.profilePhoto).toBe('https://example.com/photo.jpg');
    });

    it('should handle null profile photo', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn({
        ...mockUserData,
        'Profile Photo': null
      });

      const result = await validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      });

      expect(result.profilePhoto).toBeNull();
    });

    it('should handle undefined profile photo', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const userDataNoPhoto = { ...mockUserData };
      delete userDataNoPhoto['Profile Photo'];
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(userDataNoPhoto);

      const result = await validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      });

      expect(result.profilePhoto).toBeNull();
    });
  });

  // ============================================================================
  // Invalid Token (Returns Null)
  // ============================================================================
  describe('invalid token (returns null)', () => {
    it('should return null when token validation fails', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(false);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(mockUserData);

      const result = await validateTokenWorkflow({
        token: 'invalid_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      });

      expect(result).toBeNull();
    });

    it('should not call supabaseFetchUserFn when token is invalid', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(false);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(mockUserData);

      await validateTokenWorkflow({
        token: 'invalid_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      });

      expect(supabaseFetchUserFn).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // User Not Found (Returns Null)
  // ============================================================================
  describe('user not found (returns null)', () => {
    it('should return null when user not found in Supabase', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(null);

      const result = await validateTokenWorkflow({
        token: 'valid_token',
        userId: 'nonexistent_user',
        bubbleValidateFn,
        supabaseFetchUserFn
      });

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Error Handling - Required Parameters
  // ============================================================================
  describe('error handling - required parameters', () => {
    const bubbleValidateFn = createMockBubbleValidateFn(true);
    const supabaseFetchUserFn = createMockSupabaseFetchUserFn(mockUserData);

    it('should throw error for null token', async () => {
      await expect(validateTokenWorkflow({
        token: null,
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      })).rejects.toThrow('token is required and must be a string');
    });

    it('should throw error for undefined token', async () => {
      await expect(validateTokenWorkflow({
        token: undefined,
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      })).rejects.toThrow('token is required and must be a string');
    });

    it('should throw error for empty string token', async () => {
      await expect(validateTokenWorkflow({
        token: '',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      })).rejects.toThrow('token is required and must be a string');
    });

    it('should throw error for non-string token', async () => {
      await expect(validateTokenWorkflow({
        token: 123,
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      })).rejects.toThrow('token is required and must be a string');
    });

    it('should throw error for null userId', async () => {
      await expect(validateTokenWorkflow({
        token: 'valid_token',
        userId: null,
        bubbleValidateFn,
        supabaseFetchUserFn
      })).rejects.toThrow('userId is required and must be a string');
    });

    it('should throw error for undefined userId', async () => {
      await expect(validateTokenWorkflow({
        token: 'valid_token',
        userId: undefined,
        bubbleValidateFn,
        supabaseFetchUserFn
      })).rejects.toThrow('userId is required and must be a string');
    });

    it('should throw error for empty string userId', async () => {
      await expect(validateTokenWorkflow({
        token: 'valid_token',
        userId: '',
        bubbleValidateFn,
        supabaseFetchUserFn
      })).rejects.toThrow('userId is required and must be a string');
    });

    it('should throw error for non-string userId', async () => {
      await expect(validateTokenWorkflow({
        token: 'valid_token',
        userId: 123,
        bubbleValidateFn,
        supabaseFetchUserFn
      })).rejects.toThrow('userId is required and must be a string');
    });
  });

  // ============================================================================
  // Error Handling - Function Parameters
  // ============================================================================
  describe('error handling - function parameters', () => {
    it('should throw error for non-function bubbleValidateFn', async () => {
      await expect(validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn: 'not a function',
        supabaseFetchUserFn: createMockSupabaseFetchUserFn(mockUserData)
      })).rejects.toThrow('bubbleValidateFn must be a function');
    });

    it('should throw error for null bubbleValidateFn', async () => {
      await expect(validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn: null,
        supabaseFetchUserFn: createMockSupabaseFetchUserFn(mockUserData)
      })).rejects.toThrow('bubbleValidateFn must be a function');
    });

    it('should throw error for non-function supabaseFetchUserFn', async () => {
      await expect(validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn: createMockBubbleValidateFn(true),
        supabaseFetchUserFn: 'not a function'
      })).rejects.toThrow('supabaseFetchUserFn must be a function');
    });

    it('should throw error for null supabaseFetchUserFn', async () => {
      await expect(validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn: createMockBubbleValidateFn(true),
        supabaseFetchUserFn: null
      })).rejects.toThrow('supabaseFetchUserFn must be a function');
    });
  });

  // ============================================================================
  // Output Structure Verification
  // ============================================================================
  describe('output structure verification', () => {
    it('should return object with all expected properties', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(mockUserData);

      const result = await validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      });

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('firstName');
      expect(result).toHaveProperty('fullName');
      expect(result).toHaveProperty('profilePhoto');
      expect(result).toHaveProperty('userType');
    });

    it('should handle missing name fields', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn({
        _id: 'user_123'
      });

      const result = await validateTokenWorkflow({
        token: 'valid_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      });

      expect(result.firstName).toBeNull();
      expect(result.fullName).toBeNull();
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should authenticate returning user with cached type', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(mockUserData);

      const result = await validateTokenWorkflow({
        token: 'session_token_xyz',
        userId: '1703456789012345678',
        bubbleValidateFn,
        supabaseFetchUserFn,
        cachedUserType: 'A Guest (I would like to rent a space)'
      });

      expect(result).not.toBeNull();
      expect(result.userType).toBe('A Guest (I would like to rent a space)');
    });

    it('should handle new user without cached type', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(true);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn({
        _id: 'new_user_123',
        'Name - First': 'Jane',
        'Name - Full': 'Jane Smith',
        'Type - User Current': 'A Host (I have a space available to rent)'
      });

      const result = await validateTokenWorkflow({
        token: 'new_session_token',
        userId: 'new_user_123',
        bubbleValidateFn,
        supabaseFetchUserFn,
        cachedUserType: null
      });

      expect(result.userType).toBe('A Host (I have a space available to rent)');
    });

    it('should reject expired token', async () => {
      const bubbleValidateFn = createMockBubbleValidateFn(false);
      const supabaseFetchUserFn = createMockSupabaseFetchUserFn(mockUserData);

      const result = await validateTokenWorkflow({
        token: 'expired_token',
        userId: 'user_123',
        bubbleValidateFn,
        supabaseFetchUserFn
      });

      expect(result).toBeNull();
    });
  });
});
