# Pattern 4: Bidding System - Coordination Status

## Backend Status (Left Agent)
- [ ] Database Migration (`supabase/migrations/`)
- [ ] Bidding Types (`app/src/types/bidding.types.ts`)
- [ ] Bidding Service (`app/src/lib/biddingService.ts`)
- [ ] Bid Validator (`app/src/logic/validators/bidValidator.ts`)

## Frontend Status (Right Agent)
- [ ] Bidding Interface Island (`app/src/islands/shared/CompetitiveBidding/`)
- [ ] Realtime Bidding Hook (`app/src/hooks/useBiddingRealtime.ts`)
- [ ] Integration with Main Page

## Shared Real-time Interface
- Realtime Event: `bid:placed`
- Realtime Event: `bid:autobid`
- Realtime Event: `session:ended`

*Note: Use Supabase Realtime for WebSocket communication.*
