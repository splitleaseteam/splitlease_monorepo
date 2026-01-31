# Implementation Plan: Pattern 4 Bidding Backend Infrastructure

**Plan ID**: 20260129_pattern_4_bidding_backend_infrastructure
**Created**: 2026-01-29
**Type**: BUILD
**Complexity**: Multi-file (Database + Service Layer + Types)
**Context File Used**: largeCLAUDE.md

---

## 1. Objective

Set up the complete backend infrastructure for the Pattern 4 competitive bidding system (BS+BS - Big Spender vs Big Spender), including:
- Database migration with bidding tables
- Service layer with core bidding logic
- TypeScript type definitions

**Business Rules to Enforce**:
- Minimum bid increment: 10% above previous bid
- Maximum rounds per session: 3
- Loser compensation: 25% of winning bid

---

## 2. Source Reference Analysis

The Pattern 4 implementation package (`pattern_4/backend/`) provides complete reference implementations:

| Source File | Target Location | Purpose |
|-------------|-----------------|---------|
| `pattern_4/backend/supabase/migrations/20260128000000_create_bidding_tables.sql` | `supabase/migrations/` | Database schema |
| `pattern_4/backend/src/services/BiddingService.ts` | `app/src/services/` | Service layer |
| `pattern_4/backend/src/types/bidding.types.ts` | `app/src/types/` | Type definitions |
| `pattern_4/backend/src/utils/biddingLogic.ts` | `app/src/logic/` | Core bidding logic |

---

## 3. Implementation Steps

### Step 1: Create Database Migration

**File**: `supabase/migrations/20260129100000_create_bidding_tables.sql`

**Tables to Create**:

1. **bidding_sessions** - Tracks active bidding sessions
   - `session_id` (UUID, PK)
   - `target_night` (DATE, NOT NULL)
   - `property_id` (UUID, NOT NULL)
   - `listing_id` (UUID, nullable)
   - `status` (VARCHAR, CHECK: pending/active/completed/expired/cancelled)
   - `started_at`, `expires_at`, `completed_at` (TIMESTAMPTZ)
   - `max_rounds` (INTEGER, DEFAULT 3)
   - `round_duration_seconds` (INTEGER, DEFAULT 3600)
   - `minimum_increment_percent` (DECIMAL, DEFAULT 10.00)
   - `current_round` (INTEGER, DEFAULT 1)
   - `current_high_bid_id` (UUID)
   - `winner_user_id` (UUID)
   - `winning_bid_amount` (DECIMAL)
   - `loser_compensation_amount` (DECIMAL)
   - `platform_revenue` (DECIMAL)
   - Audit fields: `created_at`, `updated_at`

2. **bidding_participants** - Records participants in each session
   - `participant_id` (UUID, PK)
   - `session_id` (UUID, FK → bidding_sessions)
   - `user_id` (UUID, NOT NULL)
   - `user_name` (VARCHAR)
   - `user_archetype` (VARCHAR, DEFAULT 'big_spender')
   - `current_bid_amount` (DECIMAL)
   - `max_auto_bid_amount` (DECIMAL)
   - `last_bid_at` (TIMESTAMPTZ)
   - `total_bids_placed` (INTEGER, DEFAULT 0)
   - `is_winner` (BOOLEAN, DEFAULT FALSE)
   - `compensation_amount` (DECIMAL, DEFAULT 0)
   - Audit fields
   - UNIQUE constraint on (session_id, user_id)

3. **bids** - Stores individual bid records
   - `bid_id` (UUID, PK)
   - `session_id` (UUID, FK → bidding_sessions)
   - `user_id` (UUID, NOT NULL)
   - `amount` (DECIMAL, NOT NULL)
   - `round_number` (INTEGER, NOT NULL)
   - `is_auto_bid` (BOOLEAN, DEFAULT FALSE)
   - `previous_high_bid` (DECIMAL)
   - `increment_amount` (DECIMAL)
   - `increment_percent` (DECIMAL)
   - `was_valid` (BOOLEAN, DEFAULT TRUE)
   - `validation_errors` (TEXT[])
   - `placed_at` (TIMESTAMPTZ, DEFAULT NOW())
   - `client_ip` (INET)
   - `user_agent` (TEXT)
   - Audit fields

4. **bidding_results** - Final outcomes of completed sessions
   - `result_id` (UUID, PK)
   - `session_id` (UUID, FK, UNIQUE)
   - Winner/loser details with payment status
   - Platform financials
   - Session analytics (total_bids_placed, session_duration_minutes)

5. **bidding_notifications** - Notifications sent during bidding
   - `notification_id` (UUID, PK)
   - `session_id` (UUID, FK)
   - `user_id` (UUID)
   - `notification_type` (VARCHAR)
   - `title`, `message`, `action_url`
   - `channels` (VARCHAR[])
   - `sent_at`, `read_at` (TIMESTAMPTZ)

**Additional Elements**:
- Performance indexes on frequently queried columns
- `updated_at` trigger function (reuse if exists, create if not)
- Helper functions: `calculate_minimum_next_bid()`, `finalize_bidding_session()`
- Row Level Security policies
- Table comments for documentation

**Adaptation Notes**:
- Use existing `update_updated_at_column()` trigger function if available (check migration `20260129_create_urgency_pricing_tables.sql`)
- Follow Split Lease migration naming convention: `20260129100000_` prefix
- Match existing table patterns (UUID PKs, TIMESTAMPTZ for dates)

---

### Step 2: Create Type Definitions

**File**: `app/src/types/bidding.ts`

**Content to Adapt** from `pattern_4/backend/src/types/bidding.types.ts`:

```typescript
// Enums
export enum BiddingSessionStatus { PENDING, ACTIVE, COMPLETED, EXPIRED, CANCELLED }
export enum PaymentStatus { PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED }
export enum NotificationType { SESSION_STARTED, BID_PLACED, OUTBID, etc. }
export enum NotificationChannel { EMAIL, PUSH, SMS, IN_APP }

// Core Interfaces
export interface BiddingSession { ... }
export interface BiddingParticipant { ... }
export interface Bid { ... }
export interface BiddingResult { ... }
export interface BiddingNotification { ... }

// Request/Response Types
export interface CreateBiddingSessionRequest { ... }
export interface PlaceBidRequest { ... }
export interface SetMaxAutoBidRequest { ... }
export interface BidValidationResult { ... }
export interface WinnerDeterminationResult { ... }
export interface AutoBidResult { ... }

// WebSocket Event Types (for future real-time)
export interface BidPlacedEvent { ... }
export interface AutoBidTriggeredEvent { ... }
export interface SessionEndedEvent { ... }

// Utility Types
export interface BiddingSessionSummary { ... }
export interface UserBiddingStats { ... }
export interface SessionAnalytics { ... }

// Error Classes
export class BiddingError extends Error { ... }
export class BidValidationError extends BiddingError { ... }
export class SessionNotFoundError extends BiddingError { ... }
export class SessionExpiredError extends BiddingError { ... }

// Type Guards
export function isBiddingSession(obj: any): obj is BiddingSession { ... }

// Constants
export const BIDDING_CONSTANTS = {
    DEFAULT_MAX_ROUNDS: 3,
    DEFAULT_ROUND_DURATION_SECONDS: 3600,
    DEFAULT_MINIMUM_INCREMENT_PERCENT: 10.0,
    LOSER_COMPENSATION_PERCENT: 25.0,
    MAX_SESSION_DURATION_HOURS: 24,
    MIN_BID_AMOUNT: 100,
    MAX_BID_AMOUNT: 100000,
}

export const BIDDING_RULES = {
    MINIMUM_PARTICIPANTS: 2,
    MAXIMUM_PARTICIPANTS: 2,
    REQUIRED_ARCHETYPE: 'big_spender',
}
```

**Adaptation Notes**:
- This is a NEW directory (`app/src/types/`) - verify it doesn't exist, create if needed
- Export types cleanly for consumption by service layer and components

---

### Step 3: Create Bidding Logic Module

**Files**:
- `app/src/logic/bidding/index.js` (barrel export)
- `app/src/logic/bidding/calculators/calculateMinimumNextBid.js`
- `app/src/logic/bidding/calculators/calculateLoserCompensation.js`
- `app/src/logic/bidding/calculators/calculateBidIncrement.js`
- `app/src/logic/bidding/rules/validateBid.js`
- `app/src/logic/bidding/rules/isSessionExpired.js`
- `app/src/logic/bidding/rules/shouldFinalizeSession.js`
- `app/src/logic/bidding/rules/checkBiddingEligibility.js`
- `app/src/logic/bidding/processors/processAutoBid.js`
- `app/src/logic/bidding/processors/determineWinner.js`
- `app/src/logic/bidding/workflows/placeBidWorkflow.js`

**Adapt from**: `pattern_4/backend/src/utils/biddingLogic.ts`

**Key Functions to Implement**:

**Calculators** (pure math functions):
```javascript
// calculateMinimumNextBid.js
export function calculateMinimumNextBid(currentHighBid, minimumIncrementPercent = 10) {
    const minimumIncrement = Math.round(currentHighBid * (minimumIncrementPercent / 100));
    return currentHighBid + minimumIncrement;
}

// calculateLoserCompensation.js
export function calculateLoserCompensation(winningBid, compensationPercent = 25) {
    return Math.round(winningBid * (compensationPercent / 100));
}

// calculateBidIncrement.js
export function calculateBidIncrement(newBid, previousBid) {
    const amount = newBid - previousBid;
    const percent = (amount / previousBid) * 100;
    return {
        amount: Math.round(amount),
        percent: Math.round(percent * 100) / 100,
    };
}
```

**Rules** (boolean predicates):
```javascript
// validateBid.js
export function validateBid(proposedBid, session, userId, bidHistory) {
    // Returns { valid: boolean, errors: string[], minimumNextBid: number, ... }
    // Enforces: 10% minimum increment, cannot bid on own high bid, max rounds limit
}

// isSessionExpired.js
export function isSessionExpired(session) {
    if (!session.expiresAt) return false;
    return new Date() > new Date(session.expiresAt);
}

// shouldFinalizeSession.js
export function shouldFinalizeSession(session, bidHistory) {
    // Check if session expired OR both users reached max rounds
}

// checkBiddingEligibility.js
export function checkBiddingEligibility(requester, roommate, targetNight) {
    // Both must be 'big_spender' archetype
    // Target night within 30 days
}
```

**Processors** (data transformation):
```javascript
// processAutoBid.js
export function processAutoBid(session, participants, newBid) {
    // eBay-style proxy bidding logic
    // Returns { autoBidTriggered: boolean, autoBid?: Bid, reason?: string }
}

// determineWinner.js
export function determineWinner(session, participants) {
    // Returns { winner, loser, winningBid, loserCompensation, platformRevenue }
}
```

**Adaptation Notes**:
- Follow the four-layer logic architecture (calculators → rules → processors → workflows)
- Use JavaScript (.js files) to match existing frontend patterns
- Keep functions pure where possible
- Add barrel export in `app/src/logic/bidding/index.js`

---

### Step 4: Create Service Layer

**File**: `app/src/services/BiddingService.ts` (or `.js` if matching frontend patterns)

**Adapt from**: `pattern_4/backend/src/services/BiddingService.ts`

**Service Methods**:

```typescript
export class BiddingService {
    constructor(private supabase: SupabaseClient) {}

    // Session Management
    async createSession(request: CreateBiddingSessionRequest): Promise<BiddingSession>
    async getSession(sessionId: string): Promise<BiddingSession>
    async getParticipants(sessionId: string): Promise<BiddingParticipant[]>
    async getBidHistory(sessionId: string): Promise<Bid[]>

    // Bidding Actions
    async placeBid(request: PlaceBidRequest): Promise<{ bid: Bid, autoBid?: Bid, newHighBidder }>
    async setMaxAutoBid(request: SetMaxAutoBidRequest): Promise<void>

    // Session Finalization
    async finalizeSession(sessionId: string): Promise<WinnerDeterminationResult>
    async expireSession(sessionId: string): Promise<void>
    async cancelSession(sessionId: string, reason?: string): Promise<void>

    // Notifications (private helpers)
    private async notifySessionStarted(sessionId, userIds): Promise<void>
    private async notifyOutbid(sessionId, userId, newHighBid): Promise<void>
    private async notifyWinner(sessionId, userId, winningBid): Promise<void>
    private async notifyLoserWithCompensation(sessionId, userId, compensation): Promise<void>

    // Data Mappers (private helpers)
    private mapDatabaseSessionToModel(dbSession: any): BiddingSession
    private mapDatabaseParticipantToModel(dbParticipant: any): BiddingParticipant
    private mapDatabaseBidToModel(dbBid: any): Bid
}
```

**Adaptation Notes**:
- Create `app/src/services/` directory if it doesn't exist
- Use Supabase client from `app/src/lib/supabase.js`
- Import types from `app/src/types/bidding.ts`
- Import logic functions from `app/src/logic/bidding/`
- Follow existing service patterns in the codebase (if any)

---

## 4. File Changes Summary

| Action | File Path |
|--------|-----------|
| CREATE | `supabase/migrations/20260129100000_create_bidding_tables.sql` |
| CREATE | `app/src/types/bidding.ts` |
| CREATE | `app/src/services/BiddingService.ts` |
| CREATE | `app/src/logic/bidding/index.js` |
| CREATE | `app/src/logic/bidding/calculators/calculateMinimumNextBid.js` |
| CREATE | `app/src/logic/bidding/calculators/calculateLoserCompensation.js` |
| CREATE | `app/src/logic/bidding/calculators/calculateBidIncrement.js` |
| CREATE | `app/src/logic/bidding/rules/validateBid.js` |
| CREATE | `app/src/logic/bidding/rules/isSessionExpired.js` |
| CREATE | `app/src/logic/bidding/rules/shouldFinalizeSession.js` |
| CREATE | `app/src/logic/bidding/rules/checkBiddingEligibility.js` |
| CREATE | `app/src/logic/bidding/processors/processAutoBid.js` |
| CREATE | `app/src/logic/bidding/processors/determineWinner.js` |

---

## 5. Business Rules Validation

The implementation MUST enforce these business rules:

| Rule | Location | Enforcement |
|------|----------|-------------|
| 10% minimum bid increment | `validateBid.js`, `calculateMinimumNextBid.js` | Bid validation rejects bids below threshold |
| 3-round maximum per session | `validateBid.js`, `shouldFinalizeSession.js` | Tracks bids per user, blocks when max reached |
| 25% loser compensation | `calculateLoserCompensation.js`, `determineWinner.js` | Calculated on session finalization |
| 2 participants only | `BiddingService.createSession()` | Validation on session creation |
| Big Spender archetype required | `checkBiddingEligibility.js` | Pre-session eligibility check |

---

## 6. Dependencies

**Required existing modules**:
- `app/src/lib/supabase.js` - Supabase client
- Existing trigger function `update_updated_at_column()` (verify in migrations)

**No external dependencies required** - all logic is self-contained.

---

## 7. Testing Considerations

After implementation, test:
1. **Migration**: Run `supabase db reset` to verify migration applies cleanly
2. **Bid Validation**: Test 10% increment enforcement with edge cases
3. **Round Limits**: Verify users cannot exceed 3 bids
4. **Auto-bid Logic**: Test proxy bidding scenarios
5. **Winner Determination**: Test compensation and platform revenue calculations

---

## 8. Execution Order

1. **First**: Create database migration (foundation for all other components)
2. **Second**: Create type definitions (required by service layer)
3. **Third**: Create logic modules (pure functions, no dependencies)
4. **Fourth**: Create service layer (depends on types and logic modules)

---

## 9. Rollback Plan

If issues are discovered:
- Migration: Create a new migration to drop tables (never modify applied migrations)
- Service/Types/Logic: Simply delete the created files

---

**Plan Status**: READY FOR EXECUTION
**Estimated Files**: 14 new files
**Estimated Complexity**: Medium-High (multi-layer implementation)
