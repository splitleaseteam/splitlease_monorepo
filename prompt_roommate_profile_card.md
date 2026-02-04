# Roommate Profile Card Implementation

## Context

The ScheduleDashboard has a placeholder `RoommateProfileCard` component that needs full implementation.

**Location**: `app/src/islands/pages/ScheduleDashboard/components/RoommateProfileCard.jsx`

---

## Reference Screenshot

See the "YOUR ROOMMATE" section in the dashboard mockup showing:
- Avatar + Name + Role ("Co-tenant")
- Flexibility Score gauge (7/10)
- Response pattern text
- Net Flow section

---

## Requirements

### Layout

```
┌─────────────────────────────────────┐
│  YOUR ROOMMATE                      │
│  ┌────┐                             │
│  │ SC │  Sarah Chen                 │
│  └────┘  Co-tenant                  │
│                                     │
│  Flexibility Score           7/10   │
│  ███████████░░░░  Flexible          │
│                                     │
│  💬 Usually responds within 2 hours │
│                                     │
│  ┌─────────────────────────────────┐│
│  │      THIS MONTH                 ││
│  │      +$125.00                   ││
│  │   They've paid you more         ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## Components

### 1. Avatar Section
- Initials fallback if no avatar URL
- Name in bold
- "Co-tenant" or role label below

### 2. Flexibility Score Gauge
- Score 1-10 (integer)
- Visual bar (filled portion = score/10)
- Label based on score:
  - 1-3: "Inflexible"
  - 4-6: "Moderate"
  - 7-8: "Flexible"
  - 9-10: "Very Flexible"

### 3. Response Pattern
- Icon: 💬
- Text from `responsePatterns` prop
- e.g., "Usually responds within 2 hours"

### 4. Net Flow Card
- Background card with highlight
- "THIS MONTH" label
- Amount with sign:
  - Positive (green): "+$125.00" + "They've paid you more"
  - Negative (red): "-$75.00" + "You've paid them more"
  - Zero (gray): "$0.00" + "Even this month"

---

## Props Interface

```jsx
RoommateProfileCard.propTypes = {
  roommate: PropTypes.shape({
    _id: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    avatarUrl: PropTypes.string,
    email: PropTypes.string,
  }),
  flexibilityScore: PropTypes.number, // 1-10
  responsePatterns: PropTypes.string, // "Usually responds within X hours"
  netFlow: PropTypes.shape({
    amount: PropTypes.number,
    direction: PropTypes.oneOf(['positive', 'negative', 'neutral']),
    formatted: PropTypes.string, // "+$125.00"
  }),
};
```

---

## Implementation

```jsx
export default function RoommateProfileCard({
  roommate,
  flexibilityScore = 5,
  responsePatterns = 'Response time unknown',
  netFlow = { amount: 0, direction: 'neutral', formatted: '$0.00' },
}) {
  const initials = roommate
    ? `${roommate.firstName?.[0] || ''}${roommate.lastName?.[0] || ''}`
    : '?';

  const getFlexibilityLabel = (score) => {
    if (score >= 9) return 'Very Flexible';
    if (score >= 7) return 'Flexible';
    if (score >= 4) return 'Moderate';
    return 'Inflexible';
  };

  const getNetFlowMessage = (direction) => {
    if (direction === 'positive') return "They've paid you more";
    if (direction === 'negative') return "You've paid them more";
    return 'Even this month';
  };

  return (
    <div className="roommate-profile">
      <h3 className="roommate-profile__heading">YOUR ROOMMATE</h3>

      {/* Avatar + Name */}
      <div className="roommate-profile__header">
        <div className="roommate-profile__avatar">
          {roommate?.avatarUrl ? (
            <img src={roommate.avatarUrl} alt={roommate.firstName} />
          ) : (
            <span className="roommate-profile__initials">{initials}</span>
          )}
        </div>
        <div className="roommate-profile__info">
          <span className="roommate-profile__name">
            {roommate?.firstName} {roommate?.lastName}
          </span>
          <span className="roommate-profile__role">Co-tenant</span>
        </div>
      </div>

      {/* Flexibility Score */}
      <div className="roommate-profile__flexibility">
        <div className="roommate-profile__flexibility-header">
          <span>Flexibility Score</span>
          <span>{flexibilityScore}/10</span>
        </div>
        <div className="roommate-profile__gauge">
          <div
            className="roommate-profile__gauge-fill"
            style={{ width: `${flexibilityScore * 10}%` }}
          />
        </div>
        <span className="roommate-profile__flexibility-label">
          {getFlexibilityLabel(flexibilityScore)}
        </span>
      </div>

      {/* Response Pattern */}
      <div className="roommate-profile__response">
        <span className="roommate-profile__response-icon">💬</span>
        <span>{responsePatterns}</span>
      </div>

      {/* Net Flow */}
      <div className={`roommate-profile__netflow roommate-profile__netflow--${netFlow.direction}`}>
        <span className="roommate-profile__netflow-label">THIS MONTH</span>
        <span className="roommate-profile__netflow-amount">{netFlow.formatted}</span>
        <span className="roommate-profile__netflow-message">
          {getNetFlowMessage(netFlow.direction)}
        </span>
      </div>
    </div>
  );
}
```

---

## CSS Classes to Implement

```css
.roommate-profile { }
.roommate-profile__heading { }
.roommate-profile__header { }
.roommate-profile__avatar { }
.roommate-profile__initials { }
.roommate-profile__info { }
.roommate-profile__name { }
.roommate-profile__role { }
.roommate-profile__flexibility { }
.roommate-profile__gauge { }
.roommate-profile__gauge-fill { }
.roommate-profile__response { }
.roommate-profile__netflow { }
.roommate-profile__netflow--positive { color: green; }
.roommate-profile__netflow--negative { color: red; }
.roommate-profile__netflow--neutral { color: gray; }
```
