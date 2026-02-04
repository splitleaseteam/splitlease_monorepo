/**
 * Bidding System - Shared Module
 * Pattern 4: BS+BS Competitive Bidding
 *
 * Backend implementation for competitive bidding between two Big Spender users.
 *
 * Business Rules:
 * - Minimum bid increment: 10% above previous bid
 * - Maximum rounds per session: 3
 * - Loser compensation: 25% of winning bid
 * - Exactly 2 participants per session (both Big Spenders)
 */

// Types
export * from './types.ts';

// Constants
export * from './constants.ts';

// Service
export { BiddingService, default as BiddingServiceDefault } from './BiddingService.ts';

// Calculators
export * from './calculators/index.ts';

// Rules
export * from './rules/index.ts';

// Processors
export * from './processors/index.ts';
