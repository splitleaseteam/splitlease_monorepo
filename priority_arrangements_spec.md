# Specification: Co-Occupancy Priority Arrangements

## 1. Objective
Clarify the value proposition of each Sharing Willingness tier by explicitly describing the **priority arrangement** concept and payment structure.

## 2. Core Concept: Priority Arrangements

When two people share a night, **one person has priority** for morning routine, bathroom scheduling, and space usage. This is a fundamental rule of co-occupancy.

### 2.1 Priority Rules
- **Original Night Owner**: Gets priority arrangements by default (their night)
- **Guest Sharer**: Pays for the privilege to share, but with secondary priority
- **Morning Routine**: Priority person gets first choice of bathroom time
- **Space Usage**: Priority person has first claim to common areas
- **Scheduling Conflicts**: Priority person's needs come first

### 2.2 Why This Matters
The sharing willingness tiers reflect how much compensation the original owner needs to accept the inconvenience of co-occupancy **while maintaining priority**.

## 3. Updated Tier Descriptions

### Tier 1: Happy to Share (50%)
**Label**: "Happy to Share"  
**Percentage**: 50%  
**Description**: "They pay at least half but you get priority arrangements"

**Meaning**:
- You're comfortable sharing your night
- Guest pays 50% of time-based pricing
- **You still have priority** for bathroom, schedule, etc.
- This is a discount because you're flexible and don't mind coordinating

**Example**:
- Base rate: $150
- 7-day notice: 1.5x multiplier
- Full price would be: $150 × 1.5 = $225
- With 50% sharing: $225 × 0.5 = **$112.50**
- Guest pays $112.50, you get priority

### Tier 2: Willing to Share (100%)
**Label**: "Willing to Share"  
**Percentage**: 100%  
**Description**: "Your night is free, but you still get priority"

**Meaning**:
- Guest pays full time-based price
- **You retain your night for free** (no cost to you)
- **You still have priority** arrangements
- This is the "fair market" rate for sharing

**Example**:
- Base rate: $150
- 7-day notice: 1.5x multiplier
- Guest pays: $150 × 1.5 × 1.0 = **$225**
- You pay nothing, you get priority

### Tier 3: Only if You Really Need It (150%)
**Label**: "Only if You Really Need It"  
**Percentage**: 150%  
**Description**: "Premium for inconvenience"

**Meaning**:
- You're reluctant to share
- Guest pays a **premium** to incentivize you
- You still have priority, plus extra compensation
- This is for emergency/urgent requests

**Example**:
- Base rate: $150
- 7-day notice: 1.5x multiplier
- Guest pays: $150 × 1.5 × 1.5 = **$337.50**
- You get premium payment + priority

## 4. UI Implementation

### 4.1 Current Implementation
```javascript
const SHARING_WILLINGNESS_OPTIONS = [
  {
    key: 'accommodating',
    multiplier: 0.5,
    label: 'Happy to Share',
    percentage: '50%',
    description: 'They pay at least half but you get priority arrangements'
  },
  {
    key: 'standard',
    multiplier: 1.0,
    label: 'Willing to Share',
    percentage: '100%',
    description: 'Your night is free, but you still get priority'
  },
  {
    key: 'reluctant',
    multiplier: 1.5,
    label: 'Only if You Really Need It',
    percentage: '150%',
    description: 'Premium for inconvenience'
  }
];
```

### 4.2 Tooltip Enhancement
Add an info tooltip next to "Sharing Willingness" header:

> **What are "priority arrangements"?**
> 
> When sharing a night, the original owner (you) gets first choice for:
> - Morning bathroom time
> - Common area usage
> - Scheduling preferences
> 
> Your roommate pays for the privilege to share, but you maintain priority rights to the space.

### 4.3 Visual Hierarchy
```
┌─────────────────────────────────────────────────┐
│ 02  Sharing Willingness  ℹ️                     │
│     (Only applies to Share requests)            │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ ○ Happy to Share                 50%        │ │
│ │   They pay at least half but you get        │ │
│ │   priority arrangements                     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ ● Willing to Share              100%        │ │
│ │   Your night is free, but you still get     │ │
│ │   priority                                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ ○ Only if You Really Need It    150%        │ │
│ │   Premium for inconvenience                 │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 5. Request Panel Enhancement

### 5.1 Share Request Breakdown
When submitting a share request, display:

```
┌─────────────────────────────────────┐
│ Share Feb 14 with Sarah             │
│                                     │
│ Base Rate: $150                     │
│ Notice (7 days): 1.5x               │
│ Sharing (Willing): 1.0x             │
│ ───────────────────────────────     │
│ Sarah pays: $225                    │
│ You pay: $0                         │
│                                     │
│ ⚠️ You retain priority for:         │
│    • Morning bathroom time          │
│    • Space scheduling               │
│    • Common area usage              │
└─────────────────────────────────────┘
```

### 5.2 Incoming Share Request (Chat)
When viewing an incoming share request:

```
Sarah wants to share Feb 14 for $225

✓ Accept  ✗ Decline

ℹ️ If you accept:
• Sarah pays $225 (based on your "Willing to Share" setting)
• You keep your night for free
• You have priority for morning routine & scheduling
```

## 6. Chat Message Updates

### 6.1 Outgoing Share Request
**Current**:
```
"Requested to share Feb 14 for $112.50"
```

**Enhanced**:
```
"Requested to share Feb 14 for $112.50 (you keep priority)"
```

### 6.2 Transaction History
**Share Transaction Display**:
```
┌───────────────────────────────────────┐
│ Feb 14, 2026 • Share                  │
│ Sarah C.                              │
│ $225 incoming                         │
│ Status: Pending                       │
│                                       │
│ 🔑 You have priority arrangements     │
└───────────────────────────────────────┘
```

## 7. Documentation & Help Text

### 7.1 FAQ Addition
**Q: What does "priority arrangements" mean when sharing?**

A: When you share a night with your roommate, both of you are present. The person who originally owned the night (the person who accepted the share request) has priority for:
- First choice of morning bathroom time
- Primary claim to common areas
- Scheduling precedence

The sharing guest pays for the privilege to use the space but understands they have secondary priority.

**Q: If I share my night, do I lose it?**

A: No! Unlike a buyout, sharing means you **keep your night**. You're both there. The guest pays you to share the space, but you maintain priority rights.

**Q: Why would I charge 50% instead of 100%?**

A: If you're comfortable with co-occupancy and don't mind coordinating, you might offer a discount (50%). If you want fair market compensation or prefer not to share, you'd choose 100% or 150%.

## 8. Acceptance Criteria
- [ ] Tier descriptions updated in `BuyoutFormulaSettings.jsx`
- [ ] Tooltip added explaining priority arrangements
- [ ] Request panel shows "You retain priority" message
- [ ] Chat messages include priority context
- [ ] Transaction history displays priority indicator
- [ ] FAQ documentation updated

## 9. Future Enhancements
- **Priority Badge**: Visual indicator in calendar for shared nights
- **Co-occupancy Rules**: Allow users to set detailed rules (bathroom schedules, quiet hours)
- **Priority Swap**: Option to negotiate priority reversal for extra payment
