# Pattern 5: Fee Transparency - Quick Start Guide

**Get up and running in 5 minutes**

---

## 🚀 Installation (2 minutes)

### Step 1: Install Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install prop-types
```

### Step 2: Copy Files

```bash
# Copy all frontend files to your project
cp -r pattern_5/frontend/* src/
```

### Step 3: Configure Environment

```bash
# Create .env.local
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
REACT_APP_API_ENDPOINT=/api
```

---

## 🎯 Basic Usage (3 minutes)

### Example 1: Simple Fee Display

```jsx
import React from 'react';
import { PriceDisplay } from './components/PriceDisplay';

function MyComponent() {
  return (
    <PriceDisplay
      basePrice={2000}
      transactionType="date_change"
    />
  );
}
```

**Result:** Shows $2,000 base + $30 fee (1.5%) = $2,030 total

---

### Example 2: With Urgency & Buyout

```jsx
import React from 'react';
import { PriceDisplay } from './components/PriceDisplay';

function UrgentBuyout() {
  return (
    <PriceDisplay
      basePrice={180}           // Base: $180
      transactionType="buyout"
      urgencyMultiplier={4.5}   // 180 × 4.5 = $810
      buyoutMultiplier={3.5}    // 810 × 3.5 = $2,835
      defaultExpanded={true}
    />
  );
}
```

**Result:** Shows $2,835 total + $42.52 fee = $2,877.52

---

### Example 3: Complete Payment Flow

```jsx
import React, { useState } from 'react';
import { DateChangeRequestManager } from './components/DateChangeRequestManager';

function DateChange() {
  const handleComplete = (data) => {
    console.log('Payment complete:', data.paymentIntent.id);
    // Redirect to success page
  };

  return (
    <DateChangeRequestManager
      leaseId="lease-123"
      userId="user-456"
      landlordId="landlord-789"
      onRequestComplete={handleComplete}
    />
  );
}
```

**Result:** Full 4-step flow (Date → Fee → Payment → Confirmation)

---

## 📊 Common Scenarios

### Scenario 1: Calculate Fee (No UI)

```javascript
import { calculateFeeBreakdown } from './utils/feeCalculations';

const breakdown = calculateFeeBreakdown(2000, 'date_change');

console.log(breakdown);
// {
//   basePrice: 2000,
//   totalFee: 30,
//   totalPrice: 2030,
//   effectiveRate: 1.5,
//   savingsVsTraditional: 310,
//   ...
// }
```

---

### Scenario 2: Validate Before Calculation

```javascript
import { validateFeeCalculation, calculateFeeBreakdown } from './utils/feeCalculations';

const basePrice = 1000;
const transactionType = 'buyout';

const validation = validateFeeCalculation(basePrice, transactionType);

if (validation.isValid) {
  const breakdown = calculateFeeBreakdown(basePrice, transactionType);
  console.log('Total:', breakdown.totalPrice);
} else {
  console.error('Errors:', validation.errors);
}
```

---

### Scenario 3: Batch Calculations

```javascript
import { calculateBatchFees } from './utils/feeCalculations';

const items = [
  { basePrice: 1000, transactionType: 'date_change' },
  { basePrice: 2000, transactionType: 'lease_takeover' },
  { basePrice: 1500, transactionType: 'buyout' }
];

const result = calculateBatchFees(items);

console.log('Total fees:', result.totalFee);     // $67.50
console.log('Total price:', result.totalPrice);  // $4,567.50
```

---

### Scenario 4: Using Hooks

```jsx
import React from 'react';
import { useFeeCalculation } from './hooks/useFeeCalculation';

function MyComponent({ basePrice }) {
  const {
    feeBreakdown,
    isCalculating,
    totalPrice,
    effectiveRate
  } = useFeeCalculation(basePrice, 'date_change');

  if (isCalculating) return <div>Calculating...</div>;

  return (
    <div>
      <h3>Total: ${totalPrice}</h3>
      <p>Fee: {effectiveRate}%</p>
    </div>
  );
}
```

---

## 🎨 Customization

### Change Display Variant

```jsx
<PriceDisplay
  basePrice={2000}
  variant="minimal"  // Options: minimal | default | detailed
/>
```

### Hide Competitor Comparison

```jsx
<PriceDisplay
  basePrice={2000}
  showComparison={false}
/>
```

### Disable Value Proposition

```jsx
<PriceDisplay
  basePrice={2000}
  showValueProposition={false}
/>
```

### Custom Callback on Fee Accept

```jsx
<PriceDisplay
  basePrice={2000}
  onFeeAccepted={(breakdown) => {
    console.log('User accepted fee:', breakdown.totalFee);
    // Track analytics, update state, etc.
  }}
/>
```

---

## 🔧 Testing

### Run All Tests

```bash
npm test
```

### Test Specific Function

```javascript
import { calculateFeeBreakdown } from './utils/feeCalculations';

test('calculates fee correctly', () => {
  const result = calculateFeeBreakdown(1000, 'date_change');
  expect(result.totalFee).toBe(15);
  expect(result.effectiveRate).toBe(1.5);
});
```

---

## 🐛 Troubleshooting

### Issue: Stripe not loading

**Solution:**
```javascript
// Check your .env.local
console.log(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Should start with: pk_test_ or pk_live_
```

---

### Issue: Fee calculation returns null

**Solution:**
```javascript
import { validateFeeCalculation } from './utils/feeCalculations';

const validation = validateFeeCalculation(basePrice, transactionType);
if (!validation.isValid) {
  console.error('Validation failed:', validation.errors);
}
```

---

### Issue: Component not rendering

**Solution:**
```jsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PriceDisplay } from './components/PriceDisplay';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <PriceDisplay basePrice={2000} />
    </ThemeProvider>
  );
}
```

---

## 📱 Mobile Optimization

All components are mobile-responsive by default:

```jsx
// Desktop: Full breakdown visible
// Tablet: Adjusted spacing
// Mobile: Stacked layout, touch-friendly buttons

<PriceDisplay
  basePrice={2000}
  // Automatically adapts to screen size
/>
```

---

## 🎯 Production Checklist

Before deploying:

- [ ] Update `REACT_APP_STRIPE_PUBLISHABLE_KEY` to live key
- [ ] Set `REACT_APP_API_ENDPOINT` to production API
- [ ] Test payment flow end-to-end
- [ ] Verify analytics tracking
- [ ] Run accessibility audit (`npm run test:a11y`)
- [ ] Build for production (`npm run build`)
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

---

## 📚 Next Steps

1. **Read full documentation:** `README.md`
2. **Explore components:** `components/` directory
3. **Check test examples:** `__tests__/` directory
4. **Review implementation:** `IMPLEMENTATION_SUMMARY.md`

---

## 💡 Tips

### Tip 1: Use Recommended Variant

```jsx
import { useFeeVisibility } from './hooks/useFeeVisibility';

const { recommendedVariant } = useFeeVisibility({ feeAmount: 43 });

<PriceDisplay variant={recommendedVariant} />
// Auto-selects: minimal, default, or detailed based on user experience
```

### Tip 2: Format Currency Consistently

```javascript
import { formatCurrency } from './utils/feeCalculations';

formatCurrency(2877.525);  // "$2,877.53"
formatCurrency(15);        // "$15.00"
```

### Tip 3: Track Analytics

```javascript
import { useFeeVisibility } from './hooks/useFeeVisibility';

const { handleFeeAccepted, handleFeeRejected } = useFeeVisibility({
  feeAmount: 43,
  trackAnalytics: true
});

// Automatically tracks events to analytics platform
```

---

## 🎉 You're Ready!

Start with a simple `<PriceDisplay />` and expand from there.

**Need help?** Check `README.md` or `IMPLEMENTATION_SUMMARY.md`

---

**Happy coding! 🚀**
