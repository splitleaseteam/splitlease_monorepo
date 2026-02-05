# Duplicate Code Exploration Report
## Summary
- Total duplicate patterns found: 1394
- Highest priority for consolidation: Date handling (new Date + toLocaleDateString) across UI and logic

## Findings
### Duplicate Function Names
- format*: 192 occurrences
- calculate*: 95 occurrences
- parse*: 38 occurrences
- validate*: 37 occurrences

### Date Formatting (123 occurrences)
| File | Line | Pattern |
|------|------|---------|
| src/lib/availabilityValidation.js | 326 | return date.toLocaleDateString('en-US', { |
| src/lib/dateFormatters.js | 36 | return date.toLocaleDateString('en-US', { |
| src/lib/dateFormatters.js | 44 | return date.toLocaleDateString('en-US', { |
| src/islands/pages/HostLeasesPage/formatters.js | 59 | return d.toLocaleDateString('en-US', { |
| src/islands/pages/HostProposalsPage/formatters.js | 41 | return d.toLocaleDateString('en-US', { |
| src/islands/pages/HostProposalsPage/formatters.js | 57 | return d.toLocaleDateString('en-US', { |
| src/islands/pages/proposals/displayUtils.js | 43 | return date.toLocaleDateString('en-US', { |
| src/islands/pages/proposals/displayUtils.js | 376 | ? new Date(moveInDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) |
| src/islands/pages/proposals/displayUtils.js | 384 | endFormatted = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); |
| src/islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js | 580 | const formattedNightDate = nightDate.toLocaleDateString('en-US', { |

### Date Construction (819 occurrences)
| File | Line | Pattern |
|------|------|---------|
| src/lib/availabilityValidation.js | 237 | const checkDate = new Date(date); |
| src/lib/availabilityValidation.js | 276 | const today = new Date(); |
| src/lib/dateFormatters.js | 23 | const date = dateValue instanceof Date ? dateValue : new Date(dateValue); |
| src/lib/errorReporting.js | 89 | timestamp: new Date().toISOString(), |
| src/services/BiddingService.js | 79 | const startedAt = new Date(); |
| src/services/BiddingService.js | 395 | completed_at: new Date().toISOString(), |
| src/services/BiddingService.js | 458 | completed_at: new Date().toISOString(), |
| src/services/BiddingService.js | 479 | completed_at: new Date().toISOString(), |
| src/services/BiddingService.js | 576 | sent_at: new Date().toISOString(), |
| src/hooks/useBiddingRealtime.js | 276 | timestamp: new Date().toISOString() |

### Price Formatting (.toFixed(2), 89 occurrences)
| File | Line | Pattern |
|------|------|---------|
| src/services/BiddingService.js | 525 | message: `New high bid: $${newHighBid.toFixed(2)}. Place a higher bid to win.` |
| src/islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js | 106 | formatted: netAmount >= 0 ? `+$${Math.abs(netAmount).toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}` |
| src/islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js | 85 | return `$${value.toFixed(2)}`; |
| src/logic/bidding/index.js | 85 | return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); |
| src/logic/calculators/feeCalculations.js | 206 | return `${(rate * 100).toFixed(2)}%`; |
| src/logic/processors/documents/formatters.js | 100 | return numAmount.toFixed(2); |
| src/islands/modals/GuestEditingProposalModal.jsx | 73 | return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') |
| src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js | 468 | setAlertMessage(`4-Week Rent: $${priceBreakdown.fourWeekRent.toFixed(2)}`); |

### Error Handling (catch + console.error, 1 occurrence)
| File | Line | Pattern |
|------|------|---------|
| src/islands/pages/HomePage.jsx | 721 | .catch(err => console.error('Failed to load ResetPasswordPage:', err)); |

### Duplicate Imports
- `from 'react'`: 584 occurrences in `.jsx`
- Deep relative imports (`from '../../../'`): examples below
| File | Line | Pattern |
|------|------|---------|
| src/islands/pages/AccountProfilePage/useAccountProfilePageLogic.js | 15 | import { supabase } from '../../../lib/supabase.js'; |
| src/islands/pages/AuthVerifyPage/useAuthVerifyPageLogic.js | 14 | import { supabase } from '../../../lib/supabase.js'; |
| src/islands/pages/CreateSuggestedProposalPage/suggestedProposalService.js | 8 | import { supabase } from '../../../lib/supabase.js'; |
| src/islands/pages/guest-leases/useGuestLeasesPageLogic.js | 29 | import { checkAuthStatus, validateTokenAndFetchUser, getUserType } from '../../../lib/auth.js'; |

## Recommendations
1. Consolidate date formatting into `src/lib/dateFormatters.js` usage in UI components.
2. Add a single date parsing helper for `new Date(...)` normalization (timezone-safe) and use across schedule/dashboard views.
3. Centralize currency/price formatting in `src/lib/formatters.js` and replace local `toFixed(2)` logic.
4. Introduce path aliases in Vite usage (already defined) to reduce deep relative imports.
