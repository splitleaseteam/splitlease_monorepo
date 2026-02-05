# Agent 1 Table Name Fix Status
## Files Modified
- app/src/islands/pages/ScheduleDashboard/api/scheduleDashboardApi.js: Changed 3 references
- app/src/islands/pages/ManageLeasesPaymentRecordsPage/useManageLeasesPageLogic.js: Changed 1 reference
- app/src/lib/api/dateChangeRequests.js: Changed 3 references
- app/src/islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js: Changed 1 reference
## Changes Made
| File | Line | Before | After |
|------|------|--------|-------|
| app/src/islands/pages/ScheduleDashboard/api/scheduleDashboardApi.js | 41 | from('User') | from('user') |
| app/src/islands/pages/ScheduleDashboard/api/scheduleDashboardApi.js | 51 | from('User') | from('user') |
| app/src/islands/pages/ScheduleDashboard/api/scheduleDashboardApi.js | 61 | from('Listing') | from('listing') |
| app/src/islands/pages/ManageLeasesPaymentRecordsPage/useManageLeasesPageLogic.js | 495 | from('Listing') | from('listing') |
| app/src/lib/api/dateChangeRequests.js | 101 | from('date_change_requests') | from('datechangerequest') |
| app/src/lib/api/dateChangeRequests.js | 112 | from('date_change_requests') | from('datechangerequest') |
| app/src/lib/api/dateChangeRequests.js | 123 | from('date_change_requests') | from('datechangerequest') |
| app/src/islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js | 1140 | date_change_requests | datechangerequest |
## Verification
- [ ] No 404 errors in Network tab
- [ ] /guest-leases loads
- [ ] /schedule/cotenant-lease-001 loads
