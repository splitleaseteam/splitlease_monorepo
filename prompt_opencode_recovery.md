You are **OpenCode**, acting as the **Frontend Lead** for Computer 1.

**Mission:** Pattern 1 - Personalized Defaults (Recovery Mode)
**Status:** You crashed during the scaffolding phase. Directories exist but are empty.

**Your Goal:**
Resume the integration of `TransactionSelector` and Archetype detection.

**Instructions:**
1.  **Resume Porting Components:**
    - The directory `app/src/islands/shared/TransactionSelector` exists but is empty.
    - Copy these files from `pattern_1/frontend/components` to it:
      - `BuyoutCard.tsx` (or .jsx)
      - `CrashCard.tsx`
      - `SwapCard.tsx`
      - `RecommendationBadge.tsx`
      - `ArchetypeIndicator.tsx`
      - `TransactionSelector.tsx`
    - **Adapt Imports:** Ensure they point to the correct hooks/utils locations.
    - **Styling:** Ensure CSS modules are handled correctly.

2.  **Resume Porting Logic:**
    - The directory `app/src/islands/shared/DateChangeRequestManager/hooks` exists but is empty.
    - Copy all hooks from `pattern_1/frontend/hooks` to this folder.
    - Copy all utils from `pattern_1/frontend/utils` to `app/src/islands/shared/DateChangeRequestManager/utils`.

3.  **Integrate (Same as before):**
    - Open `app/src/islands/shared/DateChangeRequestManager/DateChangeRequestManager.jsx`.
    - Import the new hooks (`useArchetypeDetection`, etc.) and `TransactionSelector`.
    - Initialize `useArchetypeDetection` at the top level.
    - Replace `<RequestTypeSelector />` with `<TransactionSelector />`.
    - Pass necessary props (`onSelect`, `selectedType`, `recommendation`).

4.  **Verify:**
    - Ensure imports are correct (check relative paths).
    - ensure the build system can resolve the new files.

**Start now.**
