# Specification: Sharing Willingness Pricing (Tier 2 Replacement)

## 1. Objective
Replace the current "Tier 2: Your Substitute Cost" with "Tier 2: Sharing Willingness" to reflect the unique constraints and inconveniences of co-occupancy arrangements.

## 2. Problem Statement
The current "Substitute Cost" (Low/Medium/High) was designed for buyouts but doesn't make sense for Share requests:
- **Buyouts**: You transfer full ownership → substitute cost is relevant
- **Shares**: You co-occupy → willingness to share is relevant (not substitute cost)

**Key insight**: Sharing is fundamentally different because:
- Limited bathroom access (coordinating morning routines)
- Reduced privacy and autonomy
- Potential scheduling conflicts
- You retain the night but with restrictions

## 3. Proposed Solution: 3-Tier Sharing Willingness

### 3.1 Multiplier Tiers
| Tier | Multiplier | Label | Description |
|------|------------|-------|-------------|
| **Accommodating** | 0.5x (50%) | "Happy to Share" | Comfortable with co-occupancy, willing to discount |
| **Standard** | 1.0x (100%) | "Willing to Share" | Neutral stance, fair market rate |
| **Reluctant** | 1.5x (150%) | "Only if You Really Need It" | Prefer not to share, premium required |

### 3.2 Price Calculation Flow

**For Share Requests:**
```
Final Price = Base Rate × Notice Multiplier × Sharing Willingness Multiplier

Example (Base = $150, 7 days notice = 1.5x disruptive):
- Happy to Share: $150 × 1.5 × 0.5 = $112.50
- Willing to Share: $150 × 1.5 × 1.0 = $225.00
- Only if Needed: $150 × 1.5 × 1.5 = $337.50
```

**For Buyout Requests:**
```
Final Price = Base Rate × Notice Multiplier × Edge Multiplier
(No sharing multiplier applied)
```

**For Swap Requests:**
```
Final Price = $0
(No pricing logic at all)
```

## 4. UI Changes

### 4.1 Pricing Settings Panel - Section 2

**BEFORE:**
```
┌─────────────────────────────────────┐
│ 02  Your Substitute Cost            │
│                                     │
│ ○ Low Cost                          │
│   Drive home / Stay with friend     │
│                                     │
│ ● Medium Cost                       │
│   Hotel nearby                      │
│                                     │
│ ○ High Cost                         │
│   Change flights / Late booking     │
└─────────────────────────────────────┘
```

**AFTER:**
```
┌─────────────────────────────────────┐
│ 02  Sharing Willingness             │
│     (Only applies to Share requests)│
│                                     │
│ ○ Happy to Share (50%)              │
│   Comfortable with co-occupancy     │
│                                     │
│ ● Willing to Share (100%)           │
│   Fair market rate                  │
│                                     │
│ ○ Only if You Really Need It (150%) │
│   Premium for inconvenience         │
└─────────────────────────────────────┘
```

### 4.2 Live Preview Updates
The "Live Preview" section must show **two separate price ranges**:
- **Buyout Prices**: Based on Time + Edge multipliers (no sharing)
- **Share Prices**: Based on Time + Sharing multipliers (no edge)

**Example Display:**
```
┌─────────────────────────────────────┐
│ 💡 Live Preview                     │
│                                     │
│ BUYOUT PRICES (14-day notice)       │
│ Mon: $165  Wed: $150  Fri: $180     │
│ Range: $120 - $450                  │
│                                     │
│ SHARE PRICES (14-day notice)        │
│ Any day: $165                       │
│ Range: $82 - $247                   │
│                                     │
│ ℹ️ Share prices don't vary by day   │
└─────────────────────────────────────┘
```

### 4.3 Request Panel Updates
When in "Share Mode," the BuyOutPanel should display:
```
┌─────────────────────────────────────┐
│ Share Feb 14 with Sarah             │
│                                     │
│ Base Rate: $150                     │
│ Notice (7 days): 1.5x               │
│ Sharing (Willing): 1.0x             │
│ ───────────────────────────────     │
│ Total: $225                         │
│                                     │
│ ⚠️ Sharing means coordinating       │
│    morning routines and reduced     │
│    privacy.                         │
└─────────────────────────────────────┘
```

## 5. Data Schema Updates

### 5.1 Pricing Strategy Object
**BEFORE:**
```javascript
pricingStrategy: {
  baseCostType: 'medium',      // 'low' | 'medium' | 'high'
  baseCostValue: 150,           // Derived from baseCostType
  noticeMultipliers: { ... },
  edgePreference: 'neutral'
}
```

**AFTER:**
```javascript
pricingStrategy: {
  baseRate: 150,                      // Renamed for clarity
  noticeMultipliers: { ... },         // Unchanged
  edgePreference: 'neutral',          // Only for buyouts
  sharingWillingness: 'standard'      // NEW: 'accommodating' | 'standard' | 'reluctant'
}
```

### 5.2 Sharing Multiplier Mapping
```javascript
const SHARING_MULTIPLIERS = {
  accommodating: 0.5,   // 50% - Happy to Share
  standard: 1.0,        // 100% - Willing to Share
  reluctant: 1.5        // 150% - Only if You Really Need It
};
```

## 6. Implementation Changes

### 6.1 Price Calculation Hook
Update `usePricingStrategy.js` (or equivalent):
```javascript
function calculateSharePrice(baseRate, noticeTier, sharingWillingness) {
  const noticeMultiplier = NOTICE_MULTIPLIERS[noticeTier];
  const sharingMultiplier = SHARING_MULTIPLIERS[sharingWillingness];
  return Math.round(baseRate * noticeMultiplier * sharingMultiplier);
}

function calculateBuyoutPrice(baseRate, noticeTier, edgePreference, dayOfWeek) {
  const noticeMultiplier = NOTICE_MULTIPLIERS[noticeTier];
  const edgeMultiplier = EDGE_MULTIPLIERS[edgePreference][dayOfWeek];
  return Math.round(baseRate * noticeMultiplier * edgeMultiplier);
}
```

### 6.2 Price Overlay Logic
The calendar pricing overlay must check `dashboardMode === 'pricing_settings'` AND `requestType`:
- If showing buyout prices: use edge multipliers
- If showing share prices: use sharing multipliers (no day-of-week variation)

### 6.3 BuyoutFormulaSettings Component
**Section 2 Refactor:**
1. Change header from "Your Substitute Cost" → "Sharing Willingness"
2. Add subtitle: "(Only applies to Share requests)"
3. Update radio button options to new labels
4. Update `baseCostType` state variable → `sharingWillingness`
5. Remove base rate derivation logic (no longer needed)

**Section 3 (Edge Preference):**
Add subtitle: "(Only applies to Buyout requests)"

## 7. Backward Compatibility

### 7.1 Migration Strategy
For users with existing `pricingStrategy`:
```javascript
function migratePricingStrategy(oldStrategy) {
  return {
    baseRate: oldStrategy.baseCostValue || 150,
    noticeMultipliers: oldStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS,
    edgePreference: oldStrategy.edgePreference || 'neutral',
    sharingWillingness: 'standard'  // Default to middle tier
  };
}
```

### 7.2 localStorage Handling
```javascript
const [pricingStrategy, setPricingStrategy] = useState(() => {
  const saved = localStorage.getItem('pricingStrategy');
  if (saved) {
    const parsed = JSON.parse(saved);
    // If old schema, migrate
    if (parsed.baseCostType) {
      return migratePricingStrategy(parsed);
    }
    return parsed;
  }
  return DEFAULT_PRICING_STRATEGY;
});
```

## 8. Edge Cases & Validation

### 8.1 Request Type Validation
- **Buyout**: Use notice + edge multipliers
- **Share**: Use notice + sharing multipliers
- **Swap**: No pricing (amount = $0)

### 8.2 Calendar Visual Distinction
When viewing pricing in calendar:
- **Buyout Mode**: Show gradient based on notice tier (red/yellow/green)
- **Share Mode**: Show consistent color (all same tier), only amount varies by notice

### 8.3 Chat Message Formatting
```javascript
// Buyout
"Requested to buy out Feb 14 for $225.00"

// Share
"Requested to share Feb 14 for $112.50"
```

## 9. User Education

### 9.1 Tooltip Content
**"Sharing Willingness" Header Tooltip:**
> "Set your pricing preference for co-occupancy requests. Sharing means you both use the space and coordinate schedules (like morning routines). This multiplier only affects Share requests, not Buyouts."

### 9.2 Info Box in Settings
Add below Section 2:
```
ℹ️ Why does sharing cost differently?
Sharing means coordinating bathroom time, reduced privacy, 
and less flexibility than a full buyout. Your willingness 
determines how much you discount (or premium) for this inconvenience.
```

## 10. Testing Scenarios

### 10.1 Price Calculation
- [ ] Share request with "Happy to Share" shows 50% multiplier
- [ ] Share request with "Only if Needed" shows 150% multiplier
- [ ] Buyout request ignores sharing willingness
- [ ] Swap request shows $0 (no pricing)

### 10.2 UI Rendering
- [ ] Section 2 shows new labels and percentages
- [ ] Live Preview shows separate Buyout/Share ranges
- [ ] Calendar overlay updates when switching willingness
- [ ] Request panel shows correct multiplier breakdown

### 10.3 Persistence
- [ ] Sharing willingness saves to localStorage
- [ ] Old pricing strategies migrate correctly
- [ ] Default is "Willing to Share (100%)"

## 11. Acceptance Criteria
- [x] Spec created with full implementation details
- [ ] Section 2 UI updated to "Sharing Willingness"
- [ ] Price calculation split by request type (buyout vs share)
- [ ] Live Preview shows both buyout and share price ranges
- [ ] Calendar overlay respects request type context
- [ ] localStorage migration handles old schemas
- [ ] User education tooltips added
- [ ] All pricing tests pass for new logic

## 12. Future Enhancements
- **Dynamic Multipliers**: Allow users to set custom percentages (e.g., 75%, 125%)
- **Time-of-Day Sharing**: Different rates for morning vs evening sharing
- **Roommate Compatibility Score**: Adjust sharing multiplier based on past co-occupancy experiences
