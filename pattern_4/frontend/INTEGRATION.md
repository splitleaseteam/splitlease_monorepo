# Pattern 4 Integration Guide

Complete guide for integrating the BS+BS Competitive Bidding system into the DateChangeRequestManager.

---

## Quick Start

### 1. Install Package

```bash
npm install @splitlease/pattern-4-competitive-bidding
```

### 2. Basic Integration

```tsx
// In your DateChangeRequestManager component

import { CompetitiveBiddingManager } from '@splitlease/pattern-4-competitive-bidding';
import { detectRoommatePairs } from '@/logic/rules/leases/detectRoommatePairs';

function DateChangeRequestManager({ lease, currentUser }) {
  const [roommate, setRoommate] = useState(null);
  const [biddingSession, setBiddingSession] = useState(null);

  // Step 1: Detect if both users are Big Spenders
  useEffect(() => {
    const checkForCompetition = async () => {
      // Get roommate
      const detectedRoommate = await detectRoommateForUser(
        currentUser.id,
        lease.Listing
      );

      // Check if both are Big Spenders
      if (
        currentUser.archetype === 'BIG_SPENDER' &&
        detectedRoommate?.archetype === 'BIG_SPENDER'
      ) {
        // Both want same night - trigger competitive bidding
        const session = await initiateBiddingSession({
          userId: currentUser.id,
          roommateId: detectedRoommate.id,
          targetNight: requestedNight,
          propertyId: lease.Listing
        });

        setBiddingSession(session);
      }

      setRoommate(detectedRoommate);
    };

    checkForCompetition();
  }, [currentUser, lease]);

  // Step 2: Show competitive bidding if BS+BS
  if (biddingSession) {
    return (
      <CompetitiveBiddingManager
        sessionId={biddingSession.sessionId}
        currentUserId={currentUser.id}
        targetNight={requestedNight}
        propertyId={lease.Listing}
        onSessionEnd={(result) => {
          // Handle winner/loser
          if (result.winner === currentUser.id) {
            // User won - update calendar
            updateLeaseCalendar(currentUser.id, requestedNight);
            showNotification('You won the bidding!', 'success');
          } else {
            // User lost - credit compensation
            creditCompensation(currentUser.id, result.compensation);
            showNotification(`You'll receive $${result.compensation} compensation`, 'info');
          }
        }}
        onError={(error) => {
          console.error('Bidding error:', error);
          showNotification('Bidding error occurred', 'error');
        }}
      />
    );
  }

  // Step 3: Fall back to standard flow if not BS+BS
  return (
    <StandardDateChangeFlow
      lease={lease}
      currentUser={currentUser}
      roommate={roommate}
    />
  );
}
```

---

## Integration Points

### 1. Archetype Detection

First, detect if both users are Big Spenders:

```typescript
import { calculateArchetype } from '@/logic/rules/archetypes/archetypeCalculator';

async function shouldEnableCompetitiveBidding(
  userId: string,
  roommateId: string,
  targetNight: Date
): Promise<boolean> {

  // Fetch both users' archetypes
  const { data: user } = await supabase
    .from('user')
    .select('archetype, archetype_calculated_at')
    .eq('_id', userId)
    .single();

  const { data: roommate } = await supabase
    .from('user')
    .select('archetype, archetype_calculated_at')
    .eq('_id', roommateId)
    .single();

  // Both must be Big Spenders
  if (
    user.archetype !== 'BIG_SPENDER' ||
    roommate.archetype !== 'BIG_SPENDER'
  ) {
    return false;
  }

  // Both must want the same night
  const bothWantSameNight = await checkIfBothWantNight(
    userId,
    roommateId,
    targetNight
  );

  if (!bothWantSameNight) {
    return false;
  }

  // Must be within urgency window (30 days)
  const daysUntil = differenceInDays(targetNight, new Date());
  if (daysUntil > 30) {
    return false;
  }

  return true;
}
```

### 2. Session Initialization

Create a bidding session when conditions are met:

```typescript
async function initiateBiddingSession(params: {
  userId: string;
  roommateId: string;
  targetNight: Date;
  propertyId: string;
}): Promise<BiddingSession> {

  // Call backend to create session
  const response = await fetch('/api/bidding/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participants: [params.userId, params.roommateId],
      targetNight: params.targetNight,
      propertyId: params.propertyId,
      startingPrice: calculateBuyoutPrice(params.targetNight),
      maxRounds: 3,
      roundDuration: 3600 // 1 hour
    })
  });

  const session = await response.json();

  // Notify both users
  await sendNotification(params.roommateId, {
    type: 'competitive_bidding_started',
    message: 'Your roommate also wants this night. Bidding is now open!',
    sessionId: session.sessionId
  });

  return session;
}
```

### 3. Winner Determination

Handle session completion:

```typescript
function handleSessionEnd(result: BiddingResult) {

  if (result.winner === currentUser.id) {
    // WINNER

    // 1. Update lease calendar
    updateLeaseNight(currentUser.id, targetNight);

    // 2. Process payment
    processPayment(currentUser.id, result.winningBid);

    // 3. Send confirmation
    sendEmail(currentUser.email, 'winner_confirmation', {
      night: targetNight,
      amount: result.winningBid,
      compensation: result.compensation
    });

  } else {
    // LOSER

    // 1. Credit compensation
    creditAccount(currentUser.id, result.compensation);

    // 2. Send notification
    sendEmail(currentUser.email, 'loser_compensation', {
      compensation: result.compensation,
      alternativeOptions: ['crash', 'different_night']
    });

    // 3. Offer alternatives
    showAlternativeOptions(currentUser.id, targetNight);
  }

  // Track analytics
  analyticsService.track('competitive_bidding_ended', {
    sessionId: result.sessionId,
    winner: result.winner,
    loser: result.loser,
    winningBid: result.winningBid,
    compensation: result.compensation,
    platformRevenue: result.platformRevenue
  });
}
```

### 4. Payment Processing

Integrate with Stripe for bid payments:

```typescript
import stripeService from '@/services/stripeService';

async function processWinningBid(
  userId: string,
  amount: number,
  sessionId: string
) {

  // Create payment intent
  const paymentIntent = await stripeService.createPaymentIntent({
    amount: amount * 100, // Convert to cents
    currency: 'usd',
    customer: userId,
    metadata: {
      type: 'competitive_bidding',
      sessionId,
      night: targetNight.toISOString()
    }
  });

  // Charge user
  const charge = await stripeService.confirmPayment(
    paymentIntent.client_secret
  );

  if (charge.status === 'succeeded') {
    // Update database
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount,
        type: 'competitive_bidding_win',
        session_id: sessionId,
        stripe_charge_id: charge.id,
        created_at: new Date().toISOString()
      });

    return true;
  }

  throw new Error('Payment failed');
}
```

### 5. Compensation Payout

Credit loser's account:

```typescript
async function creditCompensation(
  userId: string,
  amount: number,
  sessionId: string
) {

  // Credit user's balance
  await supabase.rpc('credit_user_balance', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: 'Competitive bidding compensation',
    p_session_id: sessionId
  });

  // Record transaction
  await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      amount,
      type: 'competitive_bidding_compensation',
      session_id: sessionId,
      created_at: new Date().toISOString()
    });

  // Send notification
  await sendNotification(userId, {
    type: 'compensation_credited',
    message: `$${amount} compensation credited to your account`,
    amount
  });
}
```

---

## State Management

### Redux Integration (if using Redux)

```typescript
// actions/competitiveBidding.ts
export const startBiddingSession = (session: BiddingSession) => ({
  type: 'BIDDING_SESSION_STARTED',
  payload: session
});

export const placeBid = (bid: Bid) => ({
  type: 'BID_PLACED',
  payload: bid
});

export const endBiddingSession = (result: BiddingResult) => ({
  type: 'BIDDING_SESSION_ENDED',
  payload: result
});

// reducer/competitiveBidding.ts
const initialState = {
  activeSession: null,
  sessions: [],
  loading: false,
  error: null
};

export default function competitiveBiddingReducer(
  state = initialState,
  action
) {
  switch (action.type) {
    case 'BIDDING_SESSION_STARTED':
      return {
        ...state,
        activeSession: action.payload,
        sessions: [...state.sessions, action.payload]
      };

    case 'BID_PLACED':
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          biddingHistory: [
            ...state.activeSession.biddingHistory,
            action.payload
          ],
          currentHighBid: action.payload
        }
      };

    case 'BIDDING_SESSION_ENDED':
      return {
        ...state,
        activeSession: null
      };

    default:
      return state;
  }
}
```

---

## Notifications

### Email Templates

```typescript
// Pattern 4 email templates
const templates = {

  // Bidding started
  bidding_started: {
    subject: '🔥 Your roommate also wants this night!',
    body: `
      Hi {{userName}},

      Your roommate {{roommateNname}} also requested {{targetNight}}.
      Competitive bidding is now open!

      Current high bid: ${{currentBid}}
      Time remaining: {{timeRemaining}}

      [Place Your Bid →]
    `
  },

  // Winner notification
  winner_confirmation: {
    subject: '🏆 You won the bidding!',
    body: `
      Congratulations {{userName}}!

      You won the competitive bidding for {{targetNight}}.

      Winning bid: ${{winningBid}}
      Compensation to roommate: ${{compensation}}
      Your payment: ${{winningBid + fee}}

      Your calendar has been updated.

      [View Calendar →]
    `
  },

  // Loser notification
  loser_compensation: {
    subject: '💰 Compensation credited',
    body: `
      Hi {{userName}},

      Your roommate won the bidding for {{targetNight}}.

      Compensation credited: ${{compensation}}
      No fees deducted

      Alternative options:
      - Crash option: ${{crashPrice}}
      - Request different night

      [View Options →]
    `
  }
};
```

### Push Notifications

```typescript
async function sendBidNotification(
  userId: string,
  event: 'bid_placed' | 'autobid' | 'session_ended',
  data: any
) {

  // Check notification permissions
  if (!Notification.permission === 'granted') {
    return;
  }

  const messages = {
    bid_placed: `${data.userName} bid $${data.amount}`,
    autobid: `Auto-bid activated: $${data.amount}`,
    session_ended: `Bidding ended. Winner: ${data.winner}`
  };

  // Browser notification
  new Notification('Competitive Bidding Update', {
    body: messages[event],
    icon: '/bid-icon.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200]
  });

  // Also send via service worker if available
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification('Competitive Bidding', {
      body: messages[event],
      icon: '/bid-icon.png',
      data: { url: `/bidding/${data.sessionId}` }
    });
  }
}
```

---

## Analytics

### Track Key Events

```typescript
// Session started
analyticsService.track('competitive_bidding_started', {
  sessionId,
  participants: [userId, roommateId],
  targetNight,
  startingPrice,
  bothBigSpenders: true
});

// Bid placed
analyticsService.track('bid_placed', {
  sessionId,
  userId,
  bidAmount,
  isAutoBid: false,
  round: 2,
  previousHighBid,
  increment: bidAmount - previousHighBid,
  incrementPercentage: ((bidAmount - previousHighBid) / previousHighBid) * 100
});

// Auto-bid triggered
analyticsService.track('autobid_triggered', {
  sessionId,
  userId,
  autoBidAmount,
  triggeredByBid,
  maxAutoBid,
  remainingCapacity: maxAutoBid - autoBidAmount
});

// Session ended
analyticsService.track('competitive_bidding_ended', {
  sessionId,
  winner,
  loser,
  winningBid,
  compensation,
  platformRevenue,
  totalRounds,
  sessionDuration,
  autoBidsUsed
});
```

---

## Error Handling

### Common Errors

```typescript
class BiddingError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean
  ) {
    super(message);
  }
}

// Error types
const BiddingErrors = {
  SESSION_NOT_FOUND: new BiddingError(
    'Session not found',
    'SESSION_NOT_FOUND',
    false
  ),

  BID_TOO_LOW: new BiddingError(
    'Bid must meet minimum increment',
    'BID_TOO_LOW',
    true
  ),

  MAX_ROUNDS_REACHED: new BiddingError(
    'Maximum bid limit reached',
    'MAX_ROUNDS_REACHED',
    false
  ),

  SESSION_EXPIRED: new BiddingError(
    'Bidding session has expired',
    'SESSION_EXPIRED',
    false
  ),

  WEBSOCKET_DISCONNECTED: new BiddingError(
    'Connection to bidding server lost',
    'WEBSOCKET_DISCONNECTED',
    true
  )
};

// Error handler
function handleBiddingError(error: BiddingError) {
  if (error.recoverable) {
    // Show retry UI
    showNotification(error.message, 'warning', {
      action: 'Retry',
      onAction: () => retryLastAction()
    });
  } else {
    // Show error and redirect
    showNotification(error.message, 'error');
    setTimeout(() => {
      navigateTo('/date-change-requests');
    }, 3000);
  }

  // Log to monitoring service
  if (window.Sentry) {
    Sentry.captureException(error, {
      tags: {
        component: 'competitive_bidding',
        code: error.code
      }
    });
  }
}
```

---

## Testing

### Integration Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompetitiveBiddingManager } from '@splitlease/pattern-4-competitive-bidding';

describe('Competitive Bidding Integration', () => {

  test('complete bidding flow', async () => {
    const onSessionEnd = jest.fn();

    render(
      <CompetitiveBiddingManager
        sessionId="test_session"
        currentUserId="user_123"
        targetNight={new Date('2026-10-15')}
        propertyId="prop_456"
        onSessionEnd={onSessionEnd}
      />
    );

    // Wait for session to load
    await waitFor(() => {
      expect(screen.getByText(/Current High Bid/i)).toBeInTheDocument();
    });

    // Place a bid
    const bidInput = screen.getByLabelText(/Your Bid Amount/i);
    await userEvent.clear(bidInput);
    await userEvent.type(bidInput, '3500');

    const submitBtn = screen.getByRole('button', { name: /Submit Bid/i });
    await userEvent.click(submitBtn);

    // Verify bid submitted
    await waitFor(() => {
      expect(screen.getByText(/\$3,500/i)).toBeInTheDocument();
    });

    // Session should eventually end
    await waitFor(() => {
      expect(onSessionEnd).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

});
```

---

## Performance Optimization

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const CompetitiveBiddingManager = lazy(() =>
  import('@splitlease/pattern-4-competitive-bidding')
);

function DateChangeFlow() {
  return (
    <Suspense fallback={<BiddingLoadingSkeleton />}>
      {shouldShowBidding && (
        <CompetitiveBiddingManager {...props} />
      )}
    </Suspense>
  );
}
```

### Memoization

```typescript
import { memo, useMemo } from 'react';

const BiddingInterfaceMemo = memo(BiddingInterface, (prev, next) => {
  // Only re-render if session actually changed
  return (
    prev.session.currentHighBid?.amount === next.session.currentHighBid?.amount &&
    prev.session.status === next.session.status
  );
});
```

---

## Security

### Input Validation

```typescript
// Always validate on server
function validateBidServer(bid: Bid, session: BiddingSession): boolean {

  // Check session is active
  if (session.status !== 'active') {
    throw new Error('Session not active');
  }

  // Verify user is participant
  if (!session.participants.some(p => p.userId === bid.userId)) {
    throw new Error('User not in session');
  }

  // Check minimum increment
  const minimumBid = session.currentHighBid.amount + session.minimumIncrement;
  if (bid.amount < minimumBid) {
    throw new Error('Bid too low');
  }

  // Check reasonable maximum
  if (bid.amount > session.currentHighBid.amount * 2) {
    throw new Error('Bid too high');
  }

  return true;
}
```

### Rate Limiting

```typescript
// Prevent bid spam
const bidRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60000 // 1 minute
});

async function placeBid(userId: string, amount: number) {

  if (!bidRateLimiter.check(userId)) {
    throw new Error('Too many bids. Please wait.');
  }

  // Proceed with bid
  await submitBid(userId, amount);
}
```

---

## Deployment

### Environment Variables

```env
# Production
REACT_APP_WEBSOCKET_URL=wss://api.splitlease.com
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_SENTRY_DSN=https://...

# Staging
REACT_APP_WEBSOCKET_URL=wss://staging-api.splitlease.com
REACT_APP_ENABLE_ANALYTICS=false
```

### Build Configuration

```json
{
  "scripts": {
    "build:prod": "NODE_ENV=production webpack --mode production",
    "deploy": "npm run build:prod && aws s3 sync dist/ s3://splitlease-frontend/"
  }
}
```

---

## Support

- **Slack:** #pattern-4-bidding
- **Email:** engineering@splitlease.com
- **Docs:** https://docs.splitlease.com/pattern-4

---

**Version:** 1.0.0
**Last Updated:** 2026-01-28
