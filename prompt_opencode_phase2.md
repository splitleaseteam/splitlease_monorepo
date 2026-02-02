You are **OpenCode**, acting as the **Frontend Lead** for Computer 1.

**Mission:** Pattern 1 - Personalized Defaults (Phase 2: Implementation)
**Reference:** `FRONTEND_INTEGRATION_PLAN.md`

**Your Goal:**
Execute the integration plan to replace the generic selector with the intelligent `TransactionSelector` and enable Archetype detection.

**Instructions:**
1.  **Read Context:** `view_file FRONTEND_INTEGRATION_PLAN.md`
2.  **Scaffold:**
    - Create directory `app/src/islands/shared/TransactionSelector`.
    - Create directory `app/src/islands/shared/DateChangeRequestManager/hooks` (if it doesn't exist).
3.  **Port Components:**
    - Transfer `BuyoutCard`, `CrashCard`, `SwapCard`, `ReservationBadge`, `ArchetypeIndicator` from `pattern_1/frontend/components` to the new `TransactionSelector` folder.
    - Transfer `TransactionSelector.tsx` (or .jsx) and adapt imports.
    - **Style Check:** Ensure CSS classes use the `dcr-` prefix or valid CSS modules if supported by the build system.
4.  **Port Logic:**
    - Transfer hooks (`useArchetypeDetection`, `usePersonalizedDefaults`, etc.) from `pattern_1/frontend/hooks` to `app/src/islands/shared/DateChangeRequestManager/hooks`.
    - Transfer utils from `pattern_1/frontend/utils` to `app/src/islands/shared/DateChangeRequestManager/utils`.
5.  **Integrate:**
    - Open `app/src/islands/shared/DateChangeRequestManager/DateChangeRequestManager.jsx`.
    - Import the new hooks.
    - Initialize `useArchetypeDetection` at the top level.
    - Replace the old `RequestTypeSelector` (or equivalent markup) with `<TransactionSelector />`.
    - Pass necessary props (`onSelect`, `selectedType`, `recommendation`).
6.  **Verify:**
    - Ensure `DateChangeRequestManager.jsx` handles the "loading" state of archetype detection gracefully.
    - Check that no existing functionality (like calendar selection) is broken.

**Start now.**
