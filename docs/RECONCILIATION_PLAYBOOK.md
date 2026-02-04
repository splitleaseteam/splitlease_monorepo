# Logic Reconciliation & Triple-Check Playbook

This playbook outlines the "meta-flow" for synchronizing complex business logic across frontend UI, internal logic functions, and backend database/Edge functions. It was successfully pioneered during the **Pricing Formula Reconciliation** of January 2026.

---

## 🎯 Objective
To ensure that when a critical calculation (Pricing, Availability, Schedule Selection) is performed, all parts of the application arrive at the exact same result, and any "logic drift" is automatically detected.

---

## 🏗️ The 5-Phase Meta-Flow

### Phase 1: Context Mining (Discovery)
*   **Goal:** Define the "Golden Spec" before looking at modern code.
*   **Actions:**
    *   Find the original reference (Bubble URL or screenshot).
    *   Extract discrete rules (e.g., "Must be contiguous," "Sundays only").
    *   Identify the **Three Sources**:
        1.  **Workflow (UI):** Real-time reactive code.
        2.  **Formula (Logic):** Client-side validation/processing.
        3.  **Reference (Backend/DB):** Truth stored in the database or Edge functions.

### Phase 2: Discrepancy Analysis (The "Gap" Report)
*   **Goal:** Pinpoint exact math/logic differences.
*   **Actions:**
    *   Create a "Discovery Prompt" for agents to map logic flow.
    *   Conduct a side-by-side comparison of implementation vs. spec.
    *   **Deliverable:** A table of root causes (e.g., "Frontend uses `*` while Backend uses `+`").

### Phase 3: Divide & Conquer (Parallel Execution)
*   **Goal:** Use multiple agents to refactor in parallel.
*   **Division Strategy:**
    *   **OpenCode:** Modular constants, simple helpers, and UI display updates.
    *   **Claude Code:** Core algorithm refactoring, backend integration, and verification script creation.
*   **Deliverable:** Independent prompts for each agent.

### Phase 4: Implementation of Triple-Check UI
*   **Goal:** Make discrepancies visible to users/developers.
*   **Actions:**
    *   Update the specific Unit Test Page (Section 11 pattern).
    *   Show all **three sources** in a comparison table.
    *   Implement **Diagnostic Messaging**:
        *   "UI = Logic ≠ DB" -> **Backend Out of Sync**
        *   "UI = DB ≠ Logic" -> **Internal Library Error**

### Phase 5: Final Scripted Verification
*   **Goal:** Prove the solution with zero manual intervention.
*   **Actions:**
    *   Create a standalone `scripts/verify-[topic].js`.
    *   Assert that UI-logic == Backend-logic == Golden-formula.
    *   **Deliverable:** A final **Verification Report** with Green Checkmarks across all test cases.

---

## 🚀 Template: Fresh Session Kick-off Prompt

*Copy and paste this into a new session to apply this meta-flow to a new topic (e.g., Availability, Booking Rules, Taxes).*

> "I want to apply the **Triple-Check Reconciliation Meta-Flow** to [TOPIC].
> 
> **The Goal:** Synchronize [TOPIC] logic across the UI, local validators, and the backend.
> 
> **Current Assets:**
> - [Path/To/UI_Component]
> - [Path/To/Logic_File]
> - [Path/To/Backend_Function]
> 
> **Your first task (Phase 1 & 2):**
> 1. Find the path to the internal unit test page for [TOPIC].
> 2. Analyze the 'Golden Rules' for this feature (refer to `docs/Pending` or legacy screenshots if available).
> 3. Create a **Discovery Report** identifying where these rules are implemented differently across the code.
> 4. Produce a Work Plan to move us to an Additive Multi-Check system."

---

## 🛠️ Best Practices
*   **Additive over Multiplicative:** Whenever possible, use additive formulas (`1 + m1 + m2 - d1`) rather than multiplicative nested logic to prevent compounding errors.
*   **Linear Scaling:** Prefer linear scaling (`unused_nights * constant`) over complex proportional ratios unless explicitly required.
*   **The Outlier Rule:** If two sources match and one doesn't, focus all investigative efforts on the outlier before assuming the whole system is broken.
