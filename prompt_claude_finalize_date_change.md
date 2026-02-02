# 🖥️ CLAUDE CODE MISSION: Finalize Date Change Integration & Data Seeding

**Priority:** CRITICAL - Feature currently shows "Coming Soon"  
**Token Budget:** 400,000

---

## 🎯 OBJECTIVE

**Current Status:** The "Request Date Change" button now exists, but the modal integration is incomplete. The `GuestLeasesPage.jsx` needs to render the `DateChangeRequestManager` modal, which is already imported but not used.

**Your mission:**
1. Connect the `DateChangeRequestManager` modal in `GuestLeasesPage.jsx`.
2. Ensure the `dateChangeModal` state flows correctly from the hook to the component.
3. Verify the end-to-end flow manually or via test.
4. Implement the data seeding logic to support E2E tests for this feature.

---

## 📂 CODEBASE RECAP

- **Page Component:** `app/src/islands/pages/GuestLeasesPage.jsx`
- **Logic Hook:** `app/src/islands/pages/guest-leases/useGuestLeasesPageLogic.js`
- **Modal Component:** `app/src/islands/shared/DateChangeRequestManager/DateChangeRequestManager.jsx`

---

## 📋 PHASE 1: COMPLETE UI INTEGRATION (100k tokens)

### 1.1 Render Modal in GuestLeasesPage.jsx
Add the `DateChangeRequestManager` to the render output (e.g., after `CheckInCheckOutFlow`), passing:
- `isOpen`: `dateChangeModal.isOpen`
- `onClose`: `handleCloseDateChangeModal`
- `lease`: `dateChangeModal.lease`
- `currentUserId`: `user._id`

```jsx
{dateChangeModal.isOpen && (
  <DateChangeRequestManager
    isOpen={dateChangeModal.isOpen}
    onClose={handleCloseDateChangeModal}
    lease={dateChangeModal.lease}
    currentUserId={user?._id}
    userArchetype={user?.archetype} // Ensure this is available in user object
  />
)}
```

### 1.2 Verify User Archetype
Ensure `useGuestLeasesPageLogic.js` fetches and returns the user's archetype so personalized defaults work.

---

## 📋 PHASE 2: DATA SEEDING FOR E2E (200k tokens)

### 2.1 Finalize `test-data-factory.ts`
Implement the seeding functions we identified:
- `seedTestLeases(guestId)`: Create active leases with stays in "Upcoming" status.
- `seedArchetypes(users)`: Ensure test users have "big_spender" or "high_flex" archetypes.

### 2.2 Update `global-setup.ts`
Call the seeding functions before tests run.

---

## 📋 PHASE 3: VERIFICATION (100k tokens)

### 3.1 Run Date Change Spec
Execute the Playwright test specifically for this feature:
```bash
npx playwright test e2e/tests/pattern1-personalized-defaults.spec.ts
```

### 3.2 Manual Check
- Refresh local dev.
- Click "Request Date Change".
- Confirm Modal opens with "Big Spender" (or other) defaults applied.

---

## 🚀 START NOW

1. Edit [`GuestLeasesPage.jsx`](file:///c:/Users/igor/My%20Drive%20(splitleaseteam@gmail.com)/_Agent%20Context%20and%20Tools/SL1/Split%20Lease/app/src/islands/pages/GuestLeasesPage.jsx) to render the modal.
2. Verify `useGuestLeasesPageLogic.js` passes correct user data.
3. Run `npm run dev` and verify locally.
4. Implement the data seeding to make tests green.

**Expected result: Working Date Change feature + Green E2E tests!**
