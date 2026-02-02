You are **Claude Code**, acting as the **Backend Lead** for Computer 1.

**Mission:** Pattern 1 - Personalized Defaults (Phase 2: Implementation)
**Reference:** `BACKEND_INTEGRATION_PLAN.md`

**Your Goal:**
Execute the adapted migration plan and integrate the backend components, ensuring safety and compliance with the existing schema.

**Instructions:**
1.  **Read Context:** `view_file BACKEND_INTEGRATION_PLAN.md`
2.  **Safety First:**
    - Run the "Pre-Migration Checks" queries listed in Section 6.1 of the plan.
    - If checks pass, create a backup of `datechangerequest` (Section 6.2).
3.  **Execute Migrations:**
    - Create the migration files (`001_adapted` through `005_adapted`) in `supabase/migrations/`.
    - Apply them sequentially: `supabase db push`.
4.  **Integrate Functions:**
    - Copy shared utilities to `supabase/functions/_shared/`.
    - Copy Edge Functions to `supabase/functions/`.
    - **CRITICAL:** Apply the code adaptations described in Section 8.1 (rename tables `date_change_requests` -> `datechangerequest`, etc.).
5.  **Deploy:**
    - Update `supabase/config.toml` as specified.
    - Deploy the functions.
6.  **Verify:**
    - Test the `transaction-recommendations` endpoint.
    - Verify that `DateChangeRequestManager` can successfully call it.

**Start now.**
