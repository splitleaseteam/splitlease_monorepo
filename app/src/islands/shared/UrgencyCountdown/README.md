# UrgencyCountdown

Real-time countdown component showing exponential urgency pricing as check-in date approaches.

## What It Does

Displays a countdown timer with dynamically calculated prices. As the check-in date gets closer, prices increase exponentially. Shows future price projections so users see cost escalation.

## Pricing Formula

```
multiplier = exp(steepness * (1 - days_out / lookback_window))
```

With default steepness = 2.0, lookback = 90 days:
- 90 days out: 1.0x (base price)
- 30 days: 2.2x
- 14 days: 3.2x
- 7 days: 4.5x
- 3 days: 6.4x
- 1 day: 8.8x (peak)

## Urgency Levels

| Level | Days | Color | Timer Interval |
|-------|------|-------|---------------|
| Low | 14+ | Blue (#4A90E2) | 6 hours |
| Medium | 8-14 | Amber (#FFA726) | 1 hour |
| High | 4-7 | Orange (#FF5722) | 15 minutes |
| Critical | 0-3 | Red (#F44336) | 1 minute |

CTA button only shown at Medium+ urgency. Critical level adds pulsing animation.

## Non-Obvious Behavior

- Timer intervals are **adaptive** — updates more frequently as urgency increases
- `variant` prop controls layout: `default`, `compact`, `prominent`, `minimal`
- `transactionType` affects messaging: `buyout`, `crash`, `swap`
- `budgetContext` (optional) triggers warnings when projected price exceeds user's budget
- `onPriceUpdate` fires on every timer tick with full pricing breakdown

## Key Sub-Components

- `CountdownTimer` — Auto-updating countdown with urgency-styled digits
- `PriceProgression` — Future price projection table
- `UrgencyIndicator` — Visual urgency bar with progress
- `ActionPrompt` — CTA button showing potential savings

## Hooks

- `useCountdown` — Timer state with pause/resume/reset
- `useUrgencyPricing` — Live pricing calculations with alert system
- `usePriceProjections` — Future price forecasting

## Traps

- The exponential curve means prices change dramatically in the last few days — ensure `urgencySteepness` is tested with real price ranges before deploying
- `marketDemandMultiplier` stacks multiplicatively with urgency — a 1.5x demand multiplier at 4.5x urgency = 6.75x final price
- Reduced-motion users get no pulsing animation on critical CTAs — ensure the urgency message is clear without animation
