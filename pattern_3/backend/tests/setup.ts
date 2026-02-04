// =====================================================
// TEST SETUP
// =====================================================
// Global test setup and configuration
// =====================================================

import { beforeAll, afterAll, vi } from 'vitest';

// =====================================================
// GLOBAL SETUP
// =====================================================

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

  // Mock console methods to reduce noise during tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

// =====================================================
// GLOBAL TEARDOWN
// =====================================================

afterAll(() => {
  // Restore console methods
  vi.restoreAllMocks();
});

// =====================================================
// GLOBAL MOCKS
// =====================================================

// Mock Date.now() for consistent timestamps
const mockTimestamp = new Date('2026-01-28T10:00:00.000Z').getTime();
vi.spyOn(Date, 'now').mockImplementation(() => mockTimestamp);

// =====================================================
// TEST UTILITIES
// =====================================================

export function createMockUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockSessionId(): string {
  return `test-session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export function createMockBookingId(): string {
  return createMockUUID();
}

export function createMockUserId(): string {
  return createMockUUID();
}

// =====================================================
// ASSERTIONS
// =====================================================

export function assertValidUUID(value: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error(`Invalid UUID format: ${value}`);
  }
}

export function assertValidPrice(value: number): void {
  if (typeof value !== 'number' || isNaN(value) || value < 0) {
    throw new Error(`Invalid price: ${value}`);
  }
}

export function assertValidPercentage(value: number): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid percentage: ${value}`);
  }
}

// =====================================================
// MOCK DATA GENERATORS
// =====================================================

export function generateMockTierData() {
  return {
    tier_id: 'recommended',
    tier_name: 'Recommended',
    multiplier: 1.00,
    calculated_price: 450.00,
    display_order: 2,
    badge_text: 'Most Popular',
    description: 'Best value',
    acceptance_rate: 0.73,
    avg_response_time_hours: 12,
    is_recommended: true,
    features: [
      { text: 'Fair market rate', icon: 'star', order: 1 },
      { text: 'Faster acceptance', icon: 'zap', order: 2 },
      { text: 'Preferred by 73% of users', icon: 'users', order: 3 },
    ],
    savings_amount: 2385.00,
    savings_percentage: 84.13,
  };
}

export function generateMockPricingRequest() {
  return {
    base_price: 450,
    anchor_price: 2835,
    anchor_type: 'buyout' as const,
    session_id: createMockSessionId(),
    user_id: createMockUserId(),
  };
}

export function generateMockSelectionRequest() {
  return {
    booking_id: createMockBookingId(),
    user_id: createMockUserId(),
    session_id: createMockSessionId(),
    tier_id: 'recommended',
    base_price: 450,
    anchor_price: 2835,
    anchor_type: 'buyout' as const,
    platform_fee: 5,
  };
}

// =====================================================
// END OF SETUP
// =====================================================
