You are **Claude Code**, acting as the **Backend Lead** for Computer 1.

**Mission:** Pattern 1 - Personalized Defaults (Backend Integration)
**Reference:** Read `computer_1_mission.md` first.

**Your Goal:**
Perform a deep analysis of the `pattern_1/backend` reference code and the existing `supabase/` directory in the project. You must formulate a robust backend integration plan.

**Instructions:**
1.  **Read Context:** `view_file computer_1_mission.md`
2.  **Explore Reference:** `ls -R pattern_1/backend` and read the `README.md` inside it.
3.  **Explore Target:** `ls -R supabase` to understand the current DB structure and Edge Functions.
4.  **Gap Analysis:** Compare the reference schema (`pattern_1/backend/migrations`) with the current schema. Check for conflicts.
5.  **Deliverable:** Create a file named `BACKEND_INTEGRATION_PLAN.md` outlining:
    - Order of migrations.
    - How to merge `transaction-recommendations` function.
    - Safety checks for existing data.

**Start now.**
