# Collapsible Panel Spec - Schedule Dashboard Middle Sections

## Overview

The middle row sections (**Buy Out Panel** + **Chat with Roommate**) should be collapsible to maximize calendar/history visibility when not actively negotiating.

---

## Layout Behavior

```
 EXPANDED (default when night selected):
┌─────────────────────┬─────────────────────┐
│ Section 1: Calendar │ Section 2: Profile  │
├─────────────────────┴─────────────────────┤
│ ═══════ COLLAPSE BAR (click to hide) ═════│
├─────────────────────┬─────────────────────┤
│ Section 3: Buy Out  │ Section 4: Chat     │
├─────────────────────┴─────────────────────┤
│ Section 5: Transaction History            │
└───────────────────────────────────────────┘

 COLLAPSED (panel slides up, bar remains as handle):
┌─────────────────────┬─────────────────────┐
│ Section 1: Calendar │ Section 2: Profile  │
├─────────────────────┴─────────────────────┤
│ ▼ Buy Out Night · 💬 2 unread (click)     │  ← Underlay bar
├───────────────────────────────────────────┤
│ Section 5: Transaction History            │
└───────────────────────────────────────────┘
```

---

## States

| State | Trigger | Visual |
|-------|---------|--------|
| **Expanded** | Night selected, or user clicks collapsed bar | Full height sections visible |
| **Collapsed** | User clicks collapse button, or clears selection | Sections hidden, underlay bar shows summary |
| **Peek** | Hover on collapsed bar (optional) | Quick preview tooltip |

---

## Collapse Bar Design

**When Expanded:**
```
┌────────────────────────────────────────────────────┐
│  ▲ Hide Panels                    [x] Auto-collapse │
└────────────────────────────────────────────────────┘
```
- Left: Chevron + "Hide Panels" text
- Right: Optional checkbox "Auto-collapse when no selection"

**When Collapsed (Underlay Bar):**
```
┌────────────────────────────────────────────────────┐
│ ▼ Buy Out: Feb 13, 2026  ·  💬 Chat (2 new)        │
└────────────────────────────────────────────────────┘
```
- Shows: Currently selected night (if any)
- Shows: Unread message count badge
- Click anywhere → Expands both panels

---

## Auto-Expand Triggers

The collapsed panels should **automatically re-expand** when:

1. **User selects a night** from the calendar
2. **New message received** from roommate (with optional animation pulse)
3. **Incoming request notification** (roommate sends counter-offer)

---

## Auto-Collapse Triggers (optional setting)

If "Auto-collapse" is enabled:
1. User clicks "Buy Out Night" → Show success → Collapse after 3s
2. User clicks "Cancel" → Collapse immediately
3. No interaction for 60s → Collapse (with toast: "Panels collapsed")

---

## Implementation Details

### State Management (in `useScheduleDashboardLogic.js`)

```javascript
// Add to hook
const [panelsCollapsed, setPanelsCollapsed] = useState(false);
const [autoCollapse, setAutoCollapse] = useState(false);

// Auto-expand when night selected
useEffect(() => {
  if (selectedNight && panelsCollapsed) {
    setPanelsCollapsed(false);
  }
}, [selectedNight]);

// Auto-expand on new message
useEffect(() => {
  if (hasNewMessage && panelsCollapsed) {
    setPanelsCollapsed(false);
  }
}, [hasNewMessage]);

// Handlers
const handleTogglePanels = () => setPanelsCollapsed(!panelsCollapsed);
const handleToggleAutoCollapse = () => setAutoCollapse(!autoCollapse);
```

### CSS Transition

```css
.schedule-dashboard__middle-row {
  transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
  overflow: hidden;
}

.schedule-dashboard__middle-row--collapsed {
  max-height: 0;
  opacity: 0;
  pointer-events: none;
}

.schedule-dashboard__collapse-bar {
  cursor: pointer;
  background: var(--surface-secondary);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schedule-dashboard__collapse-bar:hover {
  background: var(--surface-hover);
}
```

### Component Structure (in `index.jsx`)

```jsx
{/* Collapse Bar */}
<div 
  className="schedule-dashboard__collapse-bar"
  onClick={handleTogglePanels}
>
  <span>
    {panelsCollapsed ? '▼' : '▲'} 
    {panelsCollapsed 
      ? `Buy Out: ${selectedNight || 'Select a night'} · 💬 Chat` 
      : 'Hide Panels'}
  </span>
  {!panelsCollapsed && (
    <label>
      <input 
        type="checkbox" 
        checked={autoCollapse}
        onChange={handleToggleAutoCollapse}
      /> 
      Auto-collapse
    </label>
  )}
</div>

{/* Middle Row - Collapsible */}
<div className={`schedule-dashboard__middle-row ${panelsCollapsed ? 'schedule-dashboard__middle-row--collapsed' : ''}`}>
  {/* BuyOutPanel + ChatThread */}
</div>
```

---

## Accessibility

- `aria-expanded` on collapse bar
- `aria-hidden` on collapsed panels
- Keyboard: Enter/Space to toggle
- Focus trap when expanded (optional)

---

## Mobile Consideration (Phase 2)

On mobile, these would become bottom sheets instead of collapsible panels. Not in scope for this spec.
