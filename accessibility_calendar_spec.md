# Specification: High-Contrast Pricing Calendar for Accessibility

## 1. Objective
Improve the readability of the Pricing Settings calendar to ensure it is accessible and comfortable for older adults. The focus is on increasing contrast, text size, and visual clarity without compromising the modern aesthetic.

## 2. Accessibility Audit (Current State Analysis)
Based on the provided screenshot and request:
- **Low Contrast**: The white text on mint green background (`#66D2B1`) likely fails WCAG AA standards for small text.
- **Small Fonts**: The price tags ("$165", "$225") are quite small relative to the day number.
- **Visual Noise**: The "dots" between cells (removed in previous step, but grid spacing remains tight).
- **Zebra Striping**: Recently added, helps with row tracking but might reduce contrast if stripe color is too dark or too close to day cell overlay.

## 3. Design Improvements

### 3.1 Color & Contrast (WCAG AAA Target)
- **Day Numbers**:
    - **Current**: White on Green.
    - **New**: Dark, high-contrast text on a lighter background OR keep the dark background but use BOLD white text.
    - **Recommendation**: Switch to a **"Light Theme" selection state** for better legibility.
        - Background: Very light green/mint (`#E6F7F2` or similar).
        - Text: Dark Green/Teal (`#004D40`) for maximum contrast.
        - Border: 2px solid Dark Green (`#004D40`) to clearly define the selection area.

### 3.2 Typography & Scale
- **Day Number**: Increase font weight to **600** or **700**. Increase size by 10-15%.
- **Price Tag**:
    - Increase font size slightly (e.g., 0.75rem -> 0.85rem).
    - Ensure price background (pill) has high contrast against the day cell background.
    - **New Style**: White pill with Dark Text (if background is dark) OR Dark pill with White Text (if background is light).
    - *Decision*: If we go with Light Background selection:
        - Price Pill: Dark Teal background, White text. This creates a clear "primary" element.

### 3.3 Layout & Spacing
- **Cell Definition**: Ensure distinct separation between days. The Zebra Striping helps, but selected "blocks" (My Nights) need to stand out.
- **Spacing**: Increase padding slightly inside day cells if space permits.

## 4. Implementation Details (CSS)

Target Selector: `.schedule-dashboard__calendar--pricing`

```css
/* Pricing Mode Specific Overrides */

/* "My Days" (Selected/Green) - High Contrast Version */
.schedule-dashboard__calendar--pricing .schedule-calendar__day--mine {
  background-color: #E0F2F1 !important; /* Very light teal */
  color: #004D40 !important;           /* Dark teal text */
  border: 2px solid #00695C !important; /* Strong border definition */
  font-weight: 700 !important;
  font-size: 1.1rem;
}

/* Price Badge/Pill */
.schedule-dashboard__calendar--pricing .schedule-calendar__price {
  background-color: #004D40 !important; /* Dark background for pill */
  color: #FFFFFF !important;            /* White text */
  font-weight: 600;
  font-size: 0.85rem;
  padding: 2px 6px;
  border-radius: 12px;
}

/* Month Headers */
.schedule-dashboard__calendar--pricing h3 {
  font-size: 1.25rem;
  color: #111827; /* Near black */
  font-weight: 700;
}

/* Weekday Labels */
.schedule-calendar__header {
  color: #374151; /* Dark gray */
  font-weight: 600;
}
```

## 5. Verification Plan
- **Contrast Checker**: Verify text colors meet WCAG AAA (contrast ratio > 7:1) for normal text or AA (4.5:1) for large/bold text.
- **User Simulator**: (Mental check) Can a user with 20/40 vision (typical aging eye) read the price?
- **Visual Regression**: Ensure the new "Light Selection" style looks intentional and premium, not "unselected".

## 6. Acceptance Criteria
- [ ] Day numbers on user's nights are Dark on Light (or meet AAA contrast).
- [ ] Price tags are legible and larger.
- [ ] Selected days have a solid border for clear definition.
- [ ] Text is bold and larger.
