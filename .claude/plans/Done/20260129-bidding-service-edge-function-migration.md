# Implementation Plan: Bidding Service Edge Function Migration

**Created**: 2026-01-29
**Type**: BUILD
**Priority**: High
**Scope**: Backend - Edge Functions & Shared Services
**Estimated Files**: 15-20 new files

---

## 1. Objective

Migrate the BiddingService and bidding logic from the frontend (`app/src/`) to the Edge Functions shared layer (`supabase/functions/_shared/bidding/`) and implement three new Edge Functions for the bidding system:

1. `submit-bid` - Submit a new bid on a listing
2. `set-auto-bid` - Configure automatic bidding parameters
3. `withdraw-bid` - Cancel/withdraw an existing bid

---

## 2. Current State Analysis

### Source Files to Migrate

**Service Layer:**
- `app/src/services/BiddingService.js` - Main service class (680 lines)

**Logic Layer (4-layer architecture):**
- `app/src/logic/bidding/index.js` - Barrel exports + constants + utilities
- `app/src/logic/bidding/calculators/calculateMinimumNextBid.js`
- `app/src/logic/bidding/calculators/calculateLoserCompensation.js`
- `app/src/logic/bidding/calculators/calculateBidIncrement.js`
- `app/src/logic/bidding/rules/validateBid.js`
- `app/src/logic/bidding/rules/isSessionExpired.js`
- `app/src/logic/bidding/rules/shouldFinalizeSession.js`
- `app/src/logic/bidding/rules/checkBiddingEligibility.js`
- `app/src/logic/bidding/processors/processAutoBid.js`
- `app/src/logic/bidding/processors/determineWinner.js`

### Business Rules to Preserve

1. **Minimum bid increment**: 10% above previous bid
2. **Maximum rounds per session**: 3
3. **Loser compensation**: 25% of winning bid
4. **Exactly 2 participants per session** (both Big Spenders)
5. **Auto-bid (proxy bidding)**: eBay-style automatic counter-bidding
6. **Session expiration**: Based on expiresAt timestamp
7. **Session finalization**: When expired or both users reach max rounds

### Database Tables Involved

- `bidding_sessions` - Session management
- `bidding_participants` - Participant tracking
- `bids` - Individual bid records
- `bidding_results` - Final outcomes
- `bidding_notifications` - Notification records

---

## 3. Target Architecture

### Directory Structure

```
supabase/functions/
├── _shared/
│   └── bidding/
│       ├── index.ts              # Barrel exports
│       ├── types.ts              # TypeScript interfaces
│       ├── constants.ts          # Business constants
│       ├── BiddingService.ts     # Main service class
│       ├── calculators/
│       │   ├── index.ts
│       │   ├── calculateMinimumNextBid.ts
│       │   ├── calculateLoserCompensation.ts
│       │   └── calculateBidIncrement.ts
│       ├── rules/
│       │   ├── index.ts
│       │   ├── validateBid.ts
│       │   ├── isSessionExpired.ts
│       │   ├── shouldFinalizeSession.ts
│       │   └── checkBiddingEligibility.ts
│       └── processors/
│           ├── index.ts
│           ├── processAutoBid.ts
│           └── determineWinner.ts
├── submit-bid/
│   ├── index.ts                  # Edge Function entry point
│   └── deno.json                 # Import map
├── set-auto-bid/
│   ├── index.ts
│   └── deno.json
└── withdraw-bid/
    ├── index.ts
    └── deno.json
```

---

## 4. Implementation Steps

### Phase 1: Shared Bidding Module (7 files)

#### Step 1.1: Create Type Definitions
**File**: `supabase/functions/_shared/bidding/types.ts`

```typescript
/**
 * Bidding System Type Definitions
 * Pattern 4: BS+BS Competitive Bidding
 */

// Session status enum
export type SessionStatus = 'pending' | 'active' | 'completed' | 'expired' | 'cancelled';

// User archetype (required for bidding eligibility)
export type UserArchetype = 'big_spender' | 'budget_conscious' | 'balanced';

// Bidding session interface
export interface BiddingSession {
  sessionId: string;
  targetNight: Date;
  propertyId: string;
  listingId?: string;
  status: SessionStatus;
  startedAt?: Date;
  expiresAt?: Date;
  completedAt?: Date;
  maxRounds: number;
  roundDurationSeconds: number;
  minimumIncrementPercent: number;
  currentRound: number;
  currentHighBidId?: string;
  winnerUserId?: string;
  winningBidAmount?: number;
  loserCompensationAmount?: number;
  platformRevenue?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Participant interface
export interface BiddingParticipant {
  participantId: string;
  sessionId: string;
  userId: string;
  userName?: string;
  userArchetype: UserArchetype;
  currentBidAmount?: number;
  maxAutoBidAmount?: number;
  lastBidAt?: Date;
  totalBidsPlaced: number;
  isWinner?: boolean;
  compensationAmount?: number;
  joinedAt: Date;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Bid interface
export interface Bid {
  bidId: string;
  sessionId: string;
  userId: string;
  amount: number;
  roundNumber: number;
  isAutoBid: boolean;
  previousHighBid?: number;
  incrementAmount?: number;
  incrementPercent?: number;
  wasValid: boolean;
  validationErrors?: string[];
  placedAt: Date;
  clientIp?: string;
  userAgent?: string;
  createdAt: Date;
}

// Validation result
export interface BidValidationResult {
  valid: boolean;
  errors: string[];
  minimumNextBid: number;
  maximumAllowed: number;
  suggestedBid: number;
}

// Auto-bid result
export interface AutoBidResult {
  autoBidTriggered: boolean;
  autoBid?: Bid;
  reason?: string;
}

// Winner determination result
export interface WinnerResult {
  winner: BiddingParticipant;
  loser: BiddingParticipant;
  winningBid: number;
  loserCompensation: number;
  platformRevenue: number;
}

// Eligibility check result
export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  requiredActions?: string[];
}

// Place bid request
export interface PlaceBidRequest {
  sessionId: string;
  userId: string;
  amount: number;
  isManualBid: boolean;
}

// Place bid response
export interface PlaceBidResponse {
  bid: Bid;
  autoBid?: Bid;
  newHighBidder: { userId: string; amount: number };
}

// Set auto-bid request
export interface SetAutoBidRequest {
  sessionId: string;
  userId: string;
  maxAmount: number;
}

// Withdraw bid request
export interface WithdrawBidRequest {
  sessionId: string;
  userId: string;
  reason?: string;
}

// Notification parameters
export interface NotificationParams {
  sessionId: string;
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  actionUrl?: string;
  channels: ('email' | 'push')[];
}

// Database record mappers (snake_case to camelCase)
export interface DatabaseBiddingSession {
  session_id: string;
  target_night: string;
  property_id: string;
  listing_id?: string;
  status: SessionStatus;
  started_at?: string;
  expires_at?: string;
  completed_at?: string;
  max_rounds: number;
  round_duration_seconds: number;
  minimum_increment_percent: string;
  current_round: number;
  current_high_bid_id?: string;
  winner_user_id?: string;
  winning_bid_amount?: string;
  loser_compensation_amount?: string;
  platform_revenue?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBiddingParticipant {
  participant_id: string;
  session_id: string;
  user_id: string;
  user_name?: string;
  user_archetype: UserArchetype;
  current_bid_amount?: string;
  max_auto_bid_amount?: string;
  last_bid_at?: string;
  total_bids_placed: number;
  is_winner?: boolean;
  compensation_amount?: string;
  joined_at: string;
  notified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBid {
  bid_id: string;
  session_id: string;
  user_id: string;
  amount: string;
  round_number: number;
  is_auto_bid: boolean;
  previous_high_bid?: string;
  increment_amount?: string;
  increment_percent?: string;
  was_valid: boolean;
  validation_errors?: string[];
  placed_at: string;
  client_ip?: string;
  user_agent?: string;
  created_at: string;
}
```

#### Step 1.2: Create Constants Module
**File**: `supabase/functions/_shared/bidding/constants.ts`

```typescript
/**
 * Bidding System Constants
 * Pattern 4: BS+BS Competitive Bidding
 */

export const BIDDING_CONSTANTS = {
  DEFAULT_MAX_ROUNDS: 3,
  DEFAULT_ROUND_DURATION_SECONDS: 3600, // 1 hour
  DEFAULT_MINIMUM_INCREMENT_PERCENT: 10.0, // 10%
  LOSER_COMPENSATION_PERCENT: 25.0, // 25%
  MAX_SESSION_DURATION_HOURS: 24,
  MIN_BID_AMOUNT: 100,
  MAX_BID_AMOUNT: 100000,
} as const;

export const BIDDING_RULES = {
  MINIMUM_PARTICIPANTS: 2,
  MAXIMUM_PARTICIPANTS: 2,
  REQUIRED_ARCHETYPE: 'big_spender',
} as const;

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique bid ID
 */
export function generateBidId(): string {
  return `bid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format currency for display (without $ symbol)
 */
export function formatCurrency(amount: number): string {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Calculate time remaining in session (in seconds)
 */
export function calculateTimeRemaining(expiresAt: Date | undefined): number {
  if (!expiresAt) {
    return 0;
  }

  const now = new Date();
  const remainingMs = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.floor(remainingMs / 1000));
}

/**
 * Calculate session expiration time
 */
export function calculateExpiresAt(
  startedAt: Date,
  roundDurationSeconds: number,
  maxRounds: number
): Date {
  const totalDurationSeconds = roundDurationSeconds * maxRounds;
  return new Date(startedAt.getTime() + totalDurationSeconds * 1000);
}

/**
 * Get user's current position in bidding (1st or 2nd)
 */
export function getUserBidPosition(userId: string, winnerUserId: string | undefined): 1 | 2 {
  return winnerUserId === userId ? 1 : 2;
}
```

#### Step 1.3: Create Calculators
**File**: `supabase/functions/_shared/bidding/calculators/calculateMinimumNextBid.ts`

```typescript
/**
 * Calculate the minimum next bid amount based on current high bid and increment percentage.
 *
 * @rule New bids must exceed current high by at least the minimum increment percentage.
 * @rule Default minimum increment is 10% of current high bid.
 */
export function calculateMinimumNextBid(
  currentHighBid: number,
  minimumIncrementPercent: number = 10
): number {
  // Handle edge case of no current bids
  if (currentHighBid === 0 || currentHighBid === null || currentHighBid === undefined) {
    return 0;
  }

  // Calculate the minimum increment amount
  const minimumIncrement = currentHighBid * (minimumIncrementPercent / 100);

  // Calculate minimum next bid and round to nearest cent
  return Math.round((currentHighBid + minimumIncrement) * 100) / 100;
}
```

**File**: `supabase/functions/_shared/bidding/calculators/calculateLoserCompensation.ts`

```typescript
/**
 * Calculate the loser's compensation amount based on the winning bid.
 *
 * @rule Loser receives 25% of the winning bid as compensation.
 * @rule Compensation encourages participation and reduces sting of losing.
 */
export function calculateLoserCompensation(
  winningBid: number,
  compensationPercent: number = 25
): number {
  if (winningBid === null || winningBid === undefined || winningBid <= 0) {
    return 0;
  }

  // Round to nearest cent
  return Math.round(winningBid * (compensationPercent / 100) * 100) / 100;
}
```

**File**: `supabase/functions/_shared/bidding/calculators/calculateBidIncrement.ts`

```typescript
/**
 * Calculate the increment between a new bid and the previous bid.
 *
 * @rule Used to track bid increments for analytics and validation.
 */
export interface BidIncrementResult {
  amount: number;
  percent: number;
}

export function calculateBidIncrement(
  newBid: number,
  previousBid: number
): BidIncrementResult {
  const amount = newBid - previousBid;

  // Calculate percentage increment (avoid division by zero)
  let percent = 0;
  if (previousBid > 0) {
    percent = (amount / previousBid) * 100;
  }

  return {
    amount: Math.round(amount * 100) / 100,
    percent: Math.round(percent * 100) / 100,
  };
}
```

**File**: `supabase/functions/_shared/bidding/calculators/index.ts`

```typescript
export { calculateMinimumNextBid } from './calculateMinimumNextBid.ts';
export { calculateLoserCompensation } from './calculateLoserCompensation.ts';
export { calculateBidIncrement, type BidIncrementResult } from './calculateBidIncrement.ts';
```

#### Step 1.4: Create Rules
**File**: `supabase/functions/_shared/bidding/rules/isSessionExpired.ts`

```typescript
import type { BiddingSession } from '../types.ts';

/**
 * Check if a bidding session has expired.
 *
 * @rule A session is expired if current time is past expiresAt.
 * @rule A session without expiresAt is never considered expired by time.
 */
export function isSessionExpired(session: BiddingSession): boolean {
  if (!session.expiresAt) {
    return false;
  }

  const expiresAt = new Date(session.expiresAt);
  const now = new Date();

  return now > expiresAt;
}
```

**File**: `supabase/functions/_shared/bidding/rules/shouldFinalizeSession.ts`

```typescript
import type { BiddingSession, Bid } from '../types.ts';
import { isSessionExpired } from './isSessionExpired.ts';
import { BIDDING_CONSTANTS } from '../constants.ts';

/**
 * Determine if a bidding session should be finalized.
 *
 * @rule Session should be finalized if it has expired (time limit reached).
 * @rule Session should be finalized if both users have reached max rounds.
 * @rule Only active sessions can be finalized.
 */
export function shouldFinalizeSession(
  session: BiddingSession,
  bidHistory: Bid[]
): boolean {
  // Only active sessions can be finalized
  if (session.status !== 'active') {
    return false;
  }

  // Check expiration
  if (isSessionExpired(session)) {
    return true;
  }

  // Check if both users have reached max rounds
  const maxRounds = session.maxRounds || BIDDING_CONSTANTS.DEFAULT_MAX_ROUNDS;
  const userBidCounts = new Map<string, number>();

  bidHistory.forEach((bid) => {
    const count = userBidCounts.get(bid.userId) || 0;
    userBidCounts.set(bid.userId, count + 1);
  });

  // Need at least 2 participants who have both bid
  if (userBidCounts.size < 2) {
    return false;
  }

  // Check if ALL participants have reached max rounds
  return Array.from(userBidCounts.values()).every((count) => count >= maxRounds);
}
```

**File**: `supabase/functions/_shared/bidding/rules/validateBid.ts`

```typescript
import type { BiddingSession, Bid, BidValidationResult } from '../types.ts';
import { calculateMinimumNextBid } from '../calculators/calculateMinimumNextBid.ts';
import { BIDDING_CONSTANTS } from '../constants.ts';
import { formatCurrency } from '../constants.ts';

/**
 * Validate a proposed bid against session rules.
 *
 * @rule Bid must exceed current high by minimum increment (10%).
 * @rule Cannot bid on own high bid (must wait for other user to bid).
 * @rule Session must be active (not pending, completed, expired, or cancelled).
 * @rule User cannot exceed maximum rounds (3 bids per user).
 * @rule Bid cannot exceed maximum allowed (2x current high or $100,000).
 * @rule Bid must meet minimum amount ($100).
 */
export function validateBid(
  proposedBid: number,
  session: BiddingSession,
  userId: string,
  bidHistory: Bid[]
): BidValidationResult {
  const errors: string[] = [];

  // Get current high bid
  const currentHigh = session.winningBidAmount || 0;

  // Calculate minimum increment
  const minimumIncrementPercent = session.minimumIncrementPercent || BIDDING_CONSTANTS.DEFAULT_MINIMUM_INCREMENT_PERCENT;
  const minimumNextBid = calculateMinimumNextBid(currentHigh, minimumIncrementPercent);

  // Rule 1: Must exceed current high bid by minimum increment
  if (currentHigh > 0 && proposedBid <= currentHigh) {
    errors.push(`Bid must exceed current high bid ($${formatCurrency(currentHigh)})`);
  }

  if (currentHigh > 0 && proposedBid < minimumNextBid) {
    errors.push(
      `Minimum bid is $${formatCurrency(minimumNextBid)} ` +
      `(${minimumIncrementPercent}% increment required)`
    );
  }

  // Rule 2: Cannot bid on own high bid
  if (session.winnerUserId === userId) {
    errors.push('You already have the high bid');
  }

  // Rule 3: Session must be active
  if (session.status !== 'active') {
    errors.push(`Bidding session has ${session.status} status`);
  }

  // Check if session expired
  if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
    errors.push('Bidding session has expired');
  }

  // Rule 4: Within max rounds per user
  const userBids = bidHistory.filter((bid) => bid.userId === userId);
  const maxRounds = session.maxRounds || BIDDING_CONSTANTS.DEFAULT_MAX_ROUNDS;

  if (userBids.length >= maxRounds) {
    errors.push(`Maximum ${maxRounds} bids per user reached`);
  }

  // Rule 5: Reasonable maximum (2x current high or system max)
  const maximumAllowed = currentHigh > 0 ? currentHigh * 2 : BIDDING_CONSTANTS.MAX_BID_AMOUNT;
  if (proposedBid > maximumAllowed) {
    errors.push(`Bid cannot exceed $${formatCurrency(maximumAllowed)}`);
  }

  // Rule 6: Minimum bid amount
  if (proposedBid < BIDDING_CONSTANTS.MIN_BID_AMOUNT) {
    errors.push(`Bid must be at least $${BIDDING_CONSTANTS.MIN_BID_AMOUNT}`);
  }

  // Suggested bid (current + 15% as recommendation)
  const suggestedBid = currentHigh > 0
    ? Math.round(currentHigh * 1.15 * 100) / 100
    : BIDDING_CONSTANTS.MIN_BID_AMOUNT;

  return {
    valid: errors.length === 0,
    errors,
    minimumNextBid: minimumNextBid || BIDDING_CONSTANTS.MIN_BID_AMOUNT,
    maximumAllowed,
    suggestedBid: Math.max(suggestedBid, minimumNextBid || BIDDING_CONSTANTS.MIN_BID_AMOUNT),
  };
}
```

**File**: `supabase/functions/_shared/bidding/rules/checkBiddingEligibility.ts`

```typescript
import type { EligibilityResult, UserArchetype } from '../types.ts';

interface UserInfo {
  userId: string;
  archetype: UserArchetype;
}

/**
 * Check if competitive bidding should be enabled between two users.
 *
 * @rule Both users must be Big Spenders (archetype = 'big_spender').
 * @rule Target night must be within 30 days from now.
 * @rule Target night cannot be in the past.
 */
export function checkBiddingEligibility(
  requester: UserInfo,
  roommate: UserInfo,
  targetNight: Date | string
): EligibilityResult {
  // Rule 1: Both must be Big Spenders
  if (requester.archetype !== 'big_spender' || roommate.archetype !== 'big_spender') {
    return {
      eligible: false,
      reason: 'Both users must be Big Spenders to enable competitive bidding',
    };
  }

  // Parse target night if string
  const targetDate = targetNight instanceof Date ? targetNight : new Date(targetNight);
  const now = new Date();

  // Calculate days until target night
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntil = Math.floor((targetDate.getTime() - now.getTime()) / msPerDay);

  // Rule 2: Must be within reasonable timeframe (30 days)
  if (daysUntil > 30) {
    return {
      eligible: false,
      reason: 'Target night must be within 30 days',
    };
  }

  // Rule 3: Cannot be in the past
  if (daysUntil < 0) {
    return {
      eligible: false,
      reason: 'Target night is in the past',
    };
  }

  return { eligible: true };
}
```

**File**: `supabase/functions/_shared/bidding/rules/index.ts`

```typescript
export { isSessionExpired } from './isSessionExpired.ts';
export { shouldFinalizeSession } from './shouldFinalizeSession.ts';
export { validateBid } from './validateBid.ts';
export { checkBiddingEligibility } from './checkBiddingEligibility.ts';
```

#### Step 1.5: Create Processors
**File**: `supabase/functions/_shared/bidding/processors/processAutoBid.ts`

```typescript
import type { BiddingSession, BiddingParticipant, Bid, AutoBidResult } from '../types.ts';
import { calculateMinimumNextBid } from '../calculators/calculateMinimumNextBid.ts';
import { BIDDING_CONSTANTS, generateBidId, formatCurrency } from '../constants.ts';

/**
 * Process auto-bid (eBay-style proxy bidding) after a manual bid is placed.
 *
 * @rule If other participant has a maxAutoBidAmount set and it exceeds the new bid,
 *       automatically place a counter-bid at (newBid + minimum increment).
 * @rule Auto-bid amount cannot exceed the participant's maxAutoBidAmount.
 * @rule Only triggers if new bid is below other participant's max.
 */
export function processAutoBid(
  session: BiddingSession,
  participants: BiddingParticipant[],
  newBid: Bid
): AutoBidResult {
  // Find the other participant (not the one who just bid)
  const otherParticipant = participants.find((p) => p.userId !== newBid.userId);

  if (!otherParticipant) {
    return {
      autoBidTriggered: false,
      reason: 'No other participant found',
    };
  }

  // Check if other participant has auto-bid enabled
  if (!otherParticipant.maxAutoBidAmount) {
    return {
      autoBidTriggered: false,
      reason: 'Other participant has not set max auto-bid',
    };
  }

  // If new bid is below their max, auto-counter
  if (newBid.amount < otherParticipant.maxAutoBidAmount) {
    const minimumIncrementPercent = session.minimumIncrementPercent || BIDDING_CONSTANTS.DEFAULT_MINIMUM_INCREMENT_PERCENT;
    const minimumNextBid = calculateMinimumNextBid(newBid.amount, minimumIncrementPercent);

    // Don't exceed their maximum
    const autoBidAmount = Math.min(minimumNextBid, otherParticipant.maxAutoBidAmount);

    // Calculate increment details
    const incrementAmount = autoBidAmount - newBid.amount;
    const incrementPercent = newBid.amount > 0
      ? Math.round((incrementAmount / newBid.amount) * 10000) / 100
      : 0;

    const now = new Date();
    const autoBid: Bid = {
      bidId: generateBidId(),
      sessionId: session.sessionId,
      userId: otherParticipant.userId,
      amount: autoBidAmount,
      roundNumber: session.currentRound,
      isAutoBid: true,
      previousHighBid: newBid.amount,
      incrementAmount,
      incrementPercent,
      wasValid: true,
      placedAt: now,
      createdAt: now,
    };

    return {
      autoBidTriggered: true,
      autoBid,
      reason: `Auto-bid to $${formatCurrency(autoBidAmount)} (max: $${formatCurrency(otherParticipant.maxAutoBidAmount)})`,
    };
  }

  return {
    autoBidTriggered: false,
    reason: `New bid ($${formatCurrency(newBid.amount)}) exceeds max auto-bid ($${formatCurrency(otherParticipant.maxAutoBidAmount)})`,
  };
}
```

**File**: `supabase/functions/_shared/bidding/processors/determineWinner.ts`

```typescript
import type { BiddingSession, BiddingParticipant, WinnerResult } from '../types.ts';
import { calculateLoserCompensation } from '../calculators/calculateLoserCompensation.ts';

/**
 * Determine the winner and loser of a completed bidding session.
 *
 * @rule Winner is the user with the highest bid (session.winnerUserId).
 * @rule Loser is the other participant.
 * @rule Loser receives 25% of winning bid as compensation.
 * @rule Platform revenue is winning bid minus loser compensation (75% of winning bid).
 */
export function determineWinner(
  session: BiddingSession,
  participants: BiddingParticipant[]
): WinnerResult {
  // Validate session has winner info
  if (!session.winnerUserId || !session.winningBidAmount) {
    throw new Error('Cannot determine winner: No bids in session');
  }

  // Validate exactly 2 participants
  if (participants.length !== 2) {
    throw new Error('Cannot determine winner: Must have exactly 2 participants');
  }

  // Find winner and loser
  const winner = participants.find((p) => p.userId === session.winnerUserId);
  const loser = participants.find((p) => p.userId !== session.winnerUserId);

  if (!winner || !loser) {
    throw new Error('Cannot find winner/loser in participants');
  }

  // Calculate amounts
  const winningBid = session.winningBidAmount;
  const loserCompensation = calculateLoserCompensation(winningBid);
  const platformRevenue = Math.round((winningBid - loserCompensation) * 100) / 100;

  return {
    winner,
    loser,
    winningBid,
    loserCompensation,
    platformRevenue,
  };
}
```

**File**: `supabase/functions/_shared/bidding/processors/index.ts`

```typescript
export { processAutoBid } from './processAutoBid.ts';
export { determineWinner } from './determineWinner.ts';
```

#### Step 1.6: Create BiddingService Class
**File**: `supabase/functions/_shared/bidding/BiddingService.ts`

This will be the main service class, converted to TypeScript and using Supabase client. Due to its size (400+ lines), the implementation follows the same structure as the original but with:
- TypeScript types
- Deno/Supabase imports
- Async/await patterns
- Proper error handling with `ValidationError` and `SupabaseSyncError`

Key methods:
- `createSession()`
- `getSession()`
- `getParticipants()`
- `getBidHistory()`
- `placeBid()`
- `setMaxAutoBid()`
- `finalizeSession()`
- `expireSession()`
- `cancelSession()`
- Notification methods (`_notifySessionStarted`, `_notifyOutbid`, etc.)
- Database mappers (`_mapDatabaseSessionToModel`, etc.)

#### Step 1.7: Create Barrel Export
**File**: `supabase/functions/_shared/bidding/index.ts`

```typescript
/**
 * Bidding System - Shared Module
 * Pattern 4: BS+BS Competitive Bidding
 */

// Types
export * from './types.ts';

// Constants
export * from './constants.ts';

// Service
export { BiddingService } from './BiddingService.ts';

// Calculators
export * from './calculators/index.ts';

// Rules
export * from './rules/index.ts';

// Processors
export * from './processors/index.ts';
```

---

### Phase 2: Edge Functions (3 functions)

#### Step 2.1: submit-bid Edge Function
**File**: `supabase/functions/submit-bid/index.ts`

```typescript
/**
 * Submit Bid Edge Function
 * Pattern 4: BS+BS Competitive Bidding
 *
 * Actions:
 * - submit: Submit a new bid on a session
 * - get_session: Get current session state
 * - get_bid_history: Get all bids in a session
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BiddingService } from "../_shared/bidding/index.ts";
import { ValidationError } from "../_shared/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

console.log("[submit-bid] Edge Function initializing...");

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const body = await req.json();
    const action = body.action || 'submit';
    const payload = body.payload || {};

    console.log(`[submit-bid] Action: ${action}`);

    const validActions = ['submit', 'get_session', 'get_bid_history'];
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const biddingService = new BiddingService(supabase);
    let result: unknown;

    switch (action) {
      case 'submit': {
        // Require authentication
        const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { sessionId, amount } = payload;
        if (!sessionId || !amount) {
          throw new ValidationError('sessionId and amount are required');
        }

        result = await biddingService.placeBid({
          sessionId,
          userId: user.id,
          amount: Number(amount),
          isManualBid: true,
        });
        break;
      }

      case 'get_session': {
        const { sessionId } = payload;
        if (!sessionId) {
          throw new ValidationError('sessionId is required');
        }
        result = await biddingService.getSession(sessionId);
        break;
      }

      case 'get_bid_history': {
        const { sessionId } = payload;
        if (!sessionId) {
          throw new ValidationError('sessionId is required');
        }
        result = await biddingService.getBidHistory(sessionId);
        break;
      }

      default:
        throw new Error(`Unhandled action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[submit-bid] Error:', error);
    const statusCode = (error as { name?: string }).name === 'ValidationError' ? 400 :
                       (error as { name?: string }).name === 'AuthenticationError' ? 401 : 500;
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Authentication helper (same pattern as proposal/index.ts)
async function authenticateFromHeaders(
  headers: Headers,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{ id: string; email: string } | null> {
  const authHeader = headers.get('Authorization');
  if (!authHeader) return null;

  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) return null;

    const { data: appUser, error: appUserError } = await authClient
      .from('user')
      .select('_id')
      .eq('email', user.email?.toLowerCase())
      .maybeSingle();

    if (appUserError || !appUser) return null;

    return { id: appUser._id, email: user.email ?? '' };
  } catch {
    return null;
  }
}
```

**File**: `supabase/functions/submit-bid/deno.json`

```json
{
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

#### Step 2.2: set-auto-bid Edge Function
**File**: `supabase/functions/set-auto-bid/index.ts`

Similar structure to submit-bid, with actions:
- `set`: Set max auto-bid amount
- `get`: Get current auto-bid settings
- `clear`: Remove auto-bid configuration

#### Step 2.3: withdraw-bid Edge Function
**File**: `supabase/functions/withdraw-bid/index.ts`

Similar structure, with actions:
- `withdraw`: Withdraw from session (cancels participation)
- `get_withdrawal_status`: Check if user can withdraw

---

### Phase 3: Configuration & Integration

#### Step 3.1: Update Supabase Config
**File**: `supabase/config.toml`

Add the three new functions to the Edge Functions configuration:

```toml
[functions.submit-bid]
verify_jwt = false

[functions.set-auto-bid]
verify_jwt = false

[functions.withdraw-bid]
verify_jwt = false
```

---

## 5. Notification Verification Requirements

The `BiddingService` inserts notifications to the `bidding_notifications` table. Verification points:

1. **Table Schema Check**: Verify `bidding_notifications` table exists with required columns:
   - `session_id`
   - `user_id`
   - `notification_type`
   - `title`
   - `message`
   - `action_url`
   - `channels`
   - `sent_at`

2. **Notification Types to Test**:
   - `session_started` - When session begins
   - `outbid` - When user is outbid
   - `auto_bid_triggered` - When auto-bid places a bid
   - `winner_announcement` - When session ends (winner)
   - `loser_compensation` - When session ends (loser with compensation)
   - `session_ended` - When session is cancelled

3. **Trigger Verification**: If database triggers exist for notifications, ensure they fire correctly on insert.

---

## 6. Testing Checklist

### Unit Tests (Logic Layer)
- [ ] `calculateMinimumNextBid` - various bid amounts
- [ ] `calculateLoserCompensation` - edge cases
- [ ] `calculateBidIncrement` - zero previous bid
- [ ] `validateBid` - all 6 rules
- [ ] `isSessionExpired` - with/without expiration
- [ ] `shouldFinalizeSession` - all conditions
- [ ] `processAutoBid` - trigger/no-trigger scenarios
- [ ] `determineWinner` - success/error cases
- [ ] `checkBiddingEligibility` - archetype checks

### Integration Tests (Edge Functions)
- [ ] `submit-bid` with valid authentication
- [ ] `submit-bid` without authentication (401)
- [ ] `submit-bid` with invalid session (404)
- [ ] `submit-bid` triggering auto-bid
- [ ] `set-auto-bid` with valid amount
- [ ] `set-auto-bid` on completed session (error)
- [ ] `withdraw-bid` from active session
- [ ] `withdraw-bid` when already withdrawn

### Notification Tests
- [ ] Verify notification inserted on session start
- [ ] Verify notification inserted on outbid
- [ ] Verify notification inserted on auto-bid trigger
- [ ] Verify notification inserted on session completion

---

## 7. Rollback Strategy

If issues are found:
1. Edge Functions can be reverted by deploying previous version
2. Shared module changes don't affect existing functionality (additive)
3. Frontend continues to use existing service until migration complete
4. Database schema unchanged - no migration rollback needed

---

## 8. Files to Create Summary

| Phase | File | Purpose |
|-------|------|---------|
| 1.1 | `_shared/bidding/types.ts` | TypeScript interfaces |
| 1.2 | `_shared/bidding/constants.ts` | Business constants + utilities |
| 1.3a | `_shared/bidding/calculators/calculateMinimumNextBid.ts` | Min bid calculator |
| 1.3b | `_shared/bidding/calculators/calculateLoserCompensation.ts` | Loser comp calculator |
| 1.3c | `_shared/bidding/calculators/calculateBidIncrement.ts` | Bid increment calculator |
| 1.3d | `_shared/bidding/calculators/index.ts` | Calculator barrel export |
| 1.4a | `_shared/bidding/rules/isSessionExpired.ts` | Expiration check |
| 1.4b | `_shared/bidding/rules/shouldFinalizeSession.ts` | Finalization check |
| 1.4c | `_shared/bidding/rules/validateBid.ts` | Bid validation |
| 1.4d | `_shared/bidding/rules/checkBiddingEligibility.ts` | Eligibility check |
| 1.4e | `_shared/bidding/rules/index.ts` | Rules barrel export |
| 1.5a | `_shared/bidding/processors/processAutoBid.ts` | Auto-bid processor |
| 1.5b | `_shared/bidding/processors/determineWinner.ts` | Winner determination |
| 1.5c | `_shared/bidding/processors/index.ts` | Processor barrel export |
| 1.6 | `_shared/bidding/BiddingService.ts` | Main service class |
| 1.7 | `_shared/bidding/index.ts` | Module barrel export |
| 2.1a | `submit-bid/index.ts` | Submit bid Edge Function |
| 2.1b | `submit-bid/deno.json` | Import map |
| 2.2a | `set-auto-bid/index.ts` | Set auto-bid Edge Function |
| 2.2b | `set-auto-bid/deno.json` | Import map |
| 2.3a | `withdraw-bid/index.ts` | Withdraw bid Edge Function |
| 2.3b | `withdraw-bid/deno.json` | Import map |

**Total: 22 new files**

---

## 9. Dependencies

- Existing `_shared/errors.ts` - Error classes
- Existing `_shared/validation.ts` - Input validation
- Existing `_shared/cors.ts` - CORS headers (optional, inlined in each function)
- Database tables: `bidding_sessions`, `bidding_participants`, `bids`, `bidding_results`, `bidding_notifications`

---

## 10. Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Shared Module | 4-6 hours |
| Phase 2: Edge Functions | 2-3 hours |
| Phase 3: Configuration | 30 minutes |
| Testing | 2-3 hours |
| **Total** | **9-12 hours** |

---

**Plan Status**: Ready for execution
**Next Step**: Begin Phase 1.1 - Create Type Definitions
