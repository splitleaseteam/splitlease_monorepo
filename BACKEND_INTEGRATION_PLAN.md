# Backend Integration Plan: Pattern 1 - Personalized Defaults

**Computer 1 Mission - Backend Lead**
**Date:** 2026-01-29
**Status:** Ready for Review
**Impact:** +204% revenue per transaction

---

## Executive Summary

This document outlines the complete integration strategy for merging the Pattern 1 backend implementation (user archetypes and personalized transaction recommendations) into the existing Split Lease Supabase backend.

**Key Challenge:** Schema naming mismatches between reference implementation and current database.

**Solution:** Adapt migrations to work with existing table names, create missing tables, and integrate Edge Functions with minimal disruption.

---

## 1. Schema Analysis and Conflicts

### 1.1 Critical Table Name Mismatches

| Reference Migration | Current Database | Status | Action Required |
|---------------------|------------------|--------|-----------------|
| `date_change_requests` | `datechangerequest` | ❌ MISMATCH | Adapt migration to use existing table |
| `leases` | `bookings_leases` | ❌ MISMATCH | Adapt migration to reference correct table |
| `profiles` | ❌ MISSING | ❌ MISSING | Create table OR adapt RLS policies |
| `auth.users` | ✅ EXISTS | ✅ OK | Use as-is (Supabase native auth) |

### 1.2 New Tables to Create

| Table | Purpose | Conflicts | Priority |
|-------|---------|-----------|----------|
| `user_archetypes` | Store user behavioral archetypes | None | HIGH |
| `recommendation_logs` | Analytics and A/B testing logs | None | HIGH |
| `admin_audit_log` | Admin action audit trail | None | MEDIUM |
| `archetype_job_logs` | Background job monitoring | None | MEDIUM |
| `lease_nights` | Nightly pricing data | **⚠️ May conflict with existing pricing** | HIGH |

### 1.3 Schema Enhancements Required

**Table: `datechangerequest` (existing)**

Migration 004 adds these columns:
- `transaction_type` TEXT CHECK (transaction_type IN ('buyout', 'crash', 'swap'))
- `base_price` DECIMAL(10, 2)
- `proposed_price` DECIMAL(10, 2)
- `urgency_multiplier` DECIMAL(3, 2) DEFAULT 1.0
- `market_demand` DECIMAL(3, 2) DEFAULT 1.0
- `recommended_option` TEXT CHECK (recommended_option IN ('buyout', 'crash', 'swap'))
- `user_followed_recommendation` BOOLEAN
- `requester_archetype` TEXT
- `receiver_archetype` TEXT

**Risk:** Check if any of these columns already exist with different types/constraints.

---

## 2. Database User Reference Analysis

### 2.1 Current User Table Structure

Based on investigation findings:
- **Primary user table:** `user` (Bubble-style, 854 rows)
- **Columns likely include:** `_id` (text), `email`, `bubble_id`, `user_type`, etc.
- **Auth table:** `auth.users` (Supabase native, UUID-based)

### 2.2 Foreign Key Strategy

**Reference migrations assume:**
```sql
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
```

**Problem:** Pattern 1 code may need to work with:
1. **Supabase auth users** (UUID) - NEW signups after auth migration
2. **Bubble users** (TEXT `_id`) - LEGACY users from Bubble

**Solution Options:**

**Option A: Dual-Reference (Recommended)**
```sql
-- Support both auth systems during migration
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
bubble_user_id TEXT REFERENCES "user"(_id) ON DELETE CASCADE,
CHECK ((user_id IS NOT NULL) OR (bubble_user_id IS NOT NULL))
```

**Option B: Auth-Only (Future-proof)**
```sql
-- Force all users to have Supabase auth (requires backfill)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
```

**Option C: Bubble-Only (Legacy)**
```sql
-- Use existing Bubble user table only
user_id TEXT NOT NULL REFERENCES "user"(_id) ON DELETE CASCADE
```

**Recommendation:** Start with **Option A** to support hybrid environment, migrate to **Option B** after full auth migration complete.

---

## 3. Profiles Table vs Role Detection

### 3.1 Problem

RLS policies in reference migrations check:
```sql
EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
)
```

But `profiles` table **does not exist** in current database.

### 3.2 Solution Options

**Option A: Create Profiles Table (Recommended)**
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'host', 'guest')),
  bubble_user_id TEXT REFERENCES "user"(_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill existing users
INSERT INTO public.profiles (id, role, bubble_user_id)
SELECT
  id,
  'user' as role,
  NULL as bubble_user_id  -- TODO: Map to existing Bubble users
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
```

**Option B: Use Existing User Table**
```sql
-- Modify RLS policies to check user.user_type or user.role
EXISTS (
  SELECT 1 FROM public."user"
  WHERE "user"._id = auth.uid()::text  -- Type conversion needed
  AND "user".user_type = 'admin'  -- Assuming this column exists
)
```

**Option C: Service-Role Only**
```sql
-- Remove admin RLS policies, rely on service_role for admin operations
-- Edge Functions use SUPABASE_SERVICE_ROLE_KEY to bypass RLS
```

**Recommendation:** **Option A** - Create profiles table for future-proof auth system. Use **Option C** temporarily if needed for fast deployment.

---

## 4. Migration Execution Plan

### Phase 1: Core Tables (No Breaking Changes)

**Order:**

1. **Migration 001: Create `user_archetypes` table**
   - ✅ No conflicts
   - ✅ Can run immediately
   - **Modification Required:**
     - Change FK to support dual-reference OR use bubble user table
     - Create profiles table first if using auth.users FK

2. **Migration 002: Create `recommendation_logs` table**
   - ✅ No conflicts
   - ✅ Can run immediately
   - **Modification Required:**
     - Same dual-reference strategy as above
     - Change `roommate_id UUID REFERENCES auth.users(id)` to match user reference strategy

3. **Migration 003: Create `admin_audit_log` table**
   - ✅ No conflicts
   - ✅ Can run immediately
   - **Modification Required:**
     - Same user reference strategy

4. **Migration 005: Create `archetype_job_logs` table**
   - ✅ No conflicts
   - ✅ Can run immediately
   - **⚠️ WARNING:** Contains pg_cron job setup (lines 47-68)
   - **Note:** Check if pg_cron extension is enabled
   - **Note:** Migration references `app.settings.supabase_url` - verify this setting exists

### Phase 2: Schema Enhancements (Requires Validation)

5. **Migration 004: Enhance `datechangerequest` table + Create `lease_nights` table**
   - ⚠️ **HIGH RISK** - Modifying existing table with active data (99 rows)
   - **Pre-flight checks required:**
     - [ ] Verify `datechangerequest` table structure
     - [ ] Check if any of the new columns already exist
     - [ ] Confirm foreign key constraints won't break existing data
   - **Table Name Changes Required:**
     - `ALTER TABLE public.date_change_requests` → `ALTER TABLE public.datechangerequest`
   - **Foreign Key Validation:**
     - `lease_id UUID REFERENCES public.leases(id)` → `lease_id UUID REFERENCES public.bookings_leases(id)`
     - **⚠️ Verify `bookings_leases` has UUID `id` column** (may be TEXT `_id` instead)

### Phase 3: Profiles Table (If Using Option A)

6. **Create `profiles` table** (new migration)
   - Run before migrations 001-003 if using auth.users FK references
   - Include backfill logic for existing auth users

---

## 5. Edge Function Integration Strategy

### 5.1 Required Edge Functions

| Function | Purpose | Dependencies | Integration Risk |
|----------|---------|--------------|------------------|
| `transaction-recommendations` | Main recommendation API | `user_archetypes`, `datechangerequest`, `lease_nights`, archetype detection libs | MEDIUM |
| `user-archetype` | Archetype management API | `user_archetypes`, `admin_audit_log` | LOW |
| `archetype-recalculation-job` | Background job | `user_archetypes`, `archetype_job_logs` | LOW |

### 5.2 Shared Utilities

Copy these files to `supabase/functions/_shared/`:

| File | Purpose | Conflicts with Existing? |
|------|---------|--------------------------|
| `archetype-detection.ts` | User archetype detection algorithm | ✅ No conflicts |
| `default-selection-engine.ts` | Personalized default selection logic | ✅ No conflicts |
| `urgency-calculator.ts` | Urgency level calculation | ✅ No conflicts |

**Note:** `cors.ts` already exists in `_shared/` - verify compatibility.

### 5.3 Integration Steps

1. **Copy shared utilities:**
   ```bash
   cp pattern_1/backend/functions/_shared/archetype-detection.ts supabase/functions/_shared/
   cp pattern_1/backend/functions/_shared/default-selection-engine.ts supabase/functions/_shared/
   cp pattern_1/backend/functions/_shared/urgency-calculator.ts supabase/functions/_shared/
   ```

2. **Copy Edge Functions:**
   ```bash
   cp -r pattern_1/backend/functions/transaction-recommendations supabase/functions/
   cp -r pattern_1/backend/functions/user-archetype supabase/functions/
   cp -r pattern_1/backend/functions/archetype-recalculation-job supabase/functions/
   ```

3. **Update `supabase/config.toml`:**
   ```toml
   [functions.transaction-recommendations]
   verify_jwt = false  # Functions handle their own auth

   [functions.user-archetype]
   verify_jwt = false

   [functions.archetype-recalculation-job]
   verify_jwt = false
   ```

4. **Adapt Edge Function Code:**
   - **Change table references:**
     - `date_change_requests` → `datechangerequest`
     - `leases` → `bookings_leases`
   - **Update user ID references:**
     - Support dual-reference if using Option A
     - Change UUID references to TEXT if using Bubble user table

5. **Deploy functions:**
   ```bash
   supabase functions deploy transaction-recommendations
   supabase functions deploy user-archetype
   supabase functions deploy archetype-recalculation-job
   ```

---

## 6. Safety Checks and Validation

### 6.1 Pre-Migration Checks

**Run these queries BEFORE applying migrations:**

```sql
-- Check 1: Verify table names
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('datechangerequest', 'bookings_leases', 'user', 'profiles');

-- Check 2: Check existing columns in datechangerequest
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'datechangerequest';

-- Check 3: Check bookings_leases ID column type
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings_leases'
  AND column_name IN ('id', '_id');

-- Check 4: Verify pg_cron extension
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check 5: Check if app.settings exist
SHOW app.settings.supabase_url;
```

### 6.2 Data Safety

**Backup Strategy:**

```sql
-- Backup datechangerequest table before schema changes
CREATE TABLE datechangerequest_backup_20260129 AS
SELECT * FROM datechangerequest;

-- Backup bookings_leases if modifying
CREATE TABLE bookings_leases_backup_20260129 AS
SELECT * FROM bookings_leases;
```

### 6.3 Rollback Plan

**If migrations fail:**

```sql
-- Drop new tables (in reverse order)
DROP TABLE IF EXISTS public.lease_nights CASCADE;
DROP TABLE IF EXISTS public.archetype_job_logs CASCADE;
DROP TABLE IF EXISTS public.admin_audit_log CASCADE;
DROP TABLE IF EXISTS public.recommendation_logs CASCADE;
DROP TABLE IF EXISTS public.user_archetypes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Restore backups if schema was modified
DROP TABLE IF EXISTS public.datechangerequest CASCADE;
CREATE TABLE public.datechangerequest AS
SELECT * FROM datechangerequest_backup_20260129;

-- Restore indexes, constraints, triggers manually
```

**Edge Function Rollback:**

```bash
# Remove deployed functions if they cause issues
supabase functions delete transaction-recommendations
supabase functions delete user-archetype
supabase functions delete archetype-recalculation-job
```

---

## 7. Adapted Migrations (Ready to Run)

### 7.1 Migration 001_adapted: Create `user_archetypes` table

**File:** `supabase/migrations/20260129_001_create_user_archetypes_table.sql`

**Changes from reference:**
- Use dual-reference for user IDs (support Bubble + Supabase auth)
- Remove profiles dependency from RLS policies (use service_role only)

```sql
-- Migration: Create User Archetypes Table (ADAPTED)
-- Pattern 1: Personalized Defaults
-- Adapted for Split Lease existing schema

-- Create user_archetypes table
CREATE TABLE IF NOT EXISTS public.user_archetypes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Dual-reference for hybrid auth system
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bubble_user_id TEXT REFERENCES "user"(_id) ON DELETE CASCADE,

  -- At least one user reference must be present
  CHECK ((auth_user_id IS NOT NULL) OR (bubble_user_id IS NOT NULL)),

  archetype_type TEXT NOT NULL CHECK (archetype_type IN ('big_spender', 'high_flexibility', 'average_user')),
  confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  reasoning TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_manual_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  override_by_auth_user_id UUID REFERENCES auth.users(id),
  override_by_bubble_user_id TEXT REFERENCES "user"(_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one archetype per user (check both IDs)
  UNIQUE(auth_user_id),
  UNIQUE(bubble_user_id)
);

-- Create indexes
CREATE INDEX idx_user_archetypes_auth_user_id ON public.user_archetypes(auth_user_id);
CREATE INDEX idx_user_archetypes_bubble_user_id ON public.user_archetypes(bubble_user_id);
CREATE INDEX idx_user_archetypes_type ON public.user_archetypes(archetype_type);
CREATE INDEX idx_user_archetypes_updated_at ON public.user_archetypes(updated_at);
CREATE INDEX idx_user_archetypes_signals ON public.user_archetypes USING GIN (signals);

-- Add comments
COMMENT ON TABLE public.user_archetypes IS 'Stores user behavioral archetypes for personalized defaults';
COMMENT ON COLUMN public.user_archetypes.archetype_type IS 'User archetype: big_spender, high_flexibility, or average_user';
COMMENT ON COLUMN public.user_archetypes.confidence IS 'Confidence score (0-1) in archetype classification';
COMMENT ON COLUMN public.user_archetypes.signals IS 'JSON object containing archetype signals (economic, behavioral, flexibility)';

-- Enable Row Level Security
ALTER TABLE public.user_archetypes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Simplified - Service role only for admin operations)

-- Policy 1: Service role has full access
CREATE POLICY "Service role full access to user_archetypes"
  ON public.user_archetypes FOR ALL
  USING (auth.role() = 'service_role');

-- Policy 2: Users can read their own archetype (check both ID types)
CREATE POLICY "Users can read own archetype"
  ON public.user_archetypes
  FOR SELECT
  USING (
    auth.uid() = auth_user_id
    OR auth.uid()::text = bubble_user_id
  );

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_archetype_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_user_archetype_timestamp
  BEFORE UPDATE ON public.user_archetypes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_archetype_timestamp();

-- Grant permissions
GRANT SELECT ON public.user_archetypes TO authenticated;
GRANT ALL ON public.user_archetypes TO service_role;
```

### 7.2 Migration 002_adapted: Create `recommendation_logs` table

**File:** `supabase/migrations/20260129_002_create_recommendation_logs_table.sql`

```sql
-- Migration: Create Recommendation Logs Table (ADAPTED)
-- Pattern 1: Personalized Defaults

CREATE TABLE IF NOT EXISTS public.recommendation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Dual-reference for user
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bubble_user_id TEXT REFERENCES "user"(_id) ON DELETE CASCADE,
  CHECK ((auth_user_id IS NOT NULL) OR (bubble_user_id IS NOT NULL)),

  -- Recommendation details
  primary_recommendation TEXT NOT NULL CHECK (primary_recommendation IN ('buyout', 'crash', 'swap')),
  archetype_type TEXT NOT NULL,
  archetype_confidence DECIMAL(3, 2),

  -- Context
  days_until_checkin INTEGER,
  urgency_level TEXT CHECK (urgency_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  target_date DATE,

  -- Roommate reference (dual)
  roommate_auth_user_id UUID REFERENCES auth.users(id),
  roommate_bubble_user_id TEXT REFERENCES "user"(_id),

  -- All options presented
  options JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- User interaction
  user_selected TEXT CHECK (user_selected IN ('buyout', 'crash', 'swap', NULL)),
  time_to_decision_seconds INTEGER,
  followed_recommendation BOOLEAN,

  -- Outcome
  request_submitted BOOLEAN DEFAULT FALSE,
  request_accepted BOOLEAN,
  final_transaction_type TEXT CHECK (final_transaction_type IN ('buyout', 'crash', 'swap', NULL)),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID,
  user_agent TEXT,

  -- A/B testing
  experiment_variant TEXT,
  experiment_id UUID
);

-- Create indexes
CREATE INDEX idx_recommendation_logs_auth_user ON public.recommendation_logs(auth_user_id);
CREATE INDEX idx_recommendation_logs_bubble_user ON public.recommendation_logs(bubble_user_id);
CREATE INDEX idx_recommendation_logs_created_at ON public.recommendation_logs(created_at);
CREATE INDEX idx_recommendation_logs_archetype ON public.recommendation_logs(archetype_type);
CREATE INDEX idx_recommendation_logs_followed ON public.recommendation_logs(followed_recommendation);
CREATE INDEX idx_recommendation_logs_experiment ON public.recommendation_logs(experiment_id) WHERE experiment_id IS NOT NULL;

-- Create composite index for analytics queries
CREATE INDEX idx_recommendation_logs_analytics ON public.recommendation_logs(
  archetype_type,
  primary_recommendation,
  followed_recommendation,
  created_at
);

-- Add comments
COMMENT ON TABLE public.recommendation_logs IS 'Logs all recommendation events for analytics and optimization';

-- Enable Row Level Security
ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access to recommendation_logs"
  ON public.recommendation_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read own logs"
  ON public.recommendation_logs
  FOR SELECT
  USING (
    auth.uid() = auth_user_id
    OR auth.uid()::text = bubble_user_id
  );

-- Grant permissions
GRANT SELECT ON public.recommendation_logs TO authenticated;
GRANT ALL ON public.recommendation_logs TO service_role;
```

### 7.3 Migration 003_adapted: Create `admin_audit_log` table

**File:** `supabase/migrations/20260129_003_create_admin_audit_log_table.sql`

```sql
-- Migration: Create Admin Audit Log Table (ADAPTED)
-- Pattern 1: Personalized Defaults

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Admin user (dual reference)
  admin_auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_bubble_user_id TEXT REFERENCES "user"(_id) ON DELETE CASCADE,
  CHECK ((admin_auth_user_id IS NOT NULL) OR (admin_bubble_user_id IS NOT NULL)),

  action TEXT NOT NULL CHECK (action IN (
    'recalculate_archetype',
    'override_archetype',
    'reset_archetype',
    'update_config'
  )),

  -- Target user (dual reference)
  target_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_bubble_user_id TEXT REFERENCES "user"(_id) ON DELETE SET NULL,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create indexes
CREATE INDEX idx_admin_audit_log_admin_auth ON public.admin_audit_log(admin_auth_user_id);
CREATE INDEX idx_admin_audit_log_admin_bubble ON public.admin_audit_log(admin_bubble_user_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action);

-- Add comments
COMMENT ON TABLE public.admin_audit_log IS 'Audit trail for all admin actions on user archetypes';

-- Enable Row Level Security
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access to admin_audit_log"
  ON public.admin_audit_log FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
```

### 7.4 Migration 004_adapted: Enhance `datechangerequest` + Create `lease_nights`

**File:** `supabase/migrations/20260129_004_add_archetype_fields_to_existing_tables.sql`

**⚠️ HIGH RISK - REQUIRES PRE-FLIGHT VALIDATION**

```sql
-- Migration: Add Archetype Fields to Existing Tables (ADAPTED)
-- Pattern 1: Personalized Defaults
-- ⚠️ REQUIRES VALIDATION BEFORE RUNNING

-- Add archetype fields to datechangerequest table (NOT date_change_requests)
ALTER TABLE public.datechangerequest
  ADD COLUMN IF NOT EXISTS transaction_type TEXT CHECK (transaction_type IN ('buyout', 'crash', 'swap')),
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS proposed_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS urgency_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS market_demand DECIMAL(3, 2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS recommended_option TEXT CHECK (recommended_option IN ('buyout', 'crash', 'swap')),
  ADD COLUMN IF NOT EXISTS user_followed_recommendation BOOLEAN,
  ADD COLUMN IF NOT EXISTS requester_archetype TEXT,
  ADD COLUMN IF NOT EXISTS receiver_archetype TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_datechangerequest_transaction_type
  ON public.datechangerequest(transaction_type);
CREATE INDEX IF NOT EXISTS idx_datechangerequest_recommended
  ON public.datechangerequest(recommended_option);

-- Add comments
COMMENT ON COLUMN public.datechangerequest.transaction_type IS 'Type of transaction: buyout, crash, or swap';
COMMENT ON COLUMN public.datechangerequest.urgency_multiplier IS 'Urgency pricing multiplier applied';
COMMENT ON COLUMN public.datechangerequest.recommended_option IS 'What option the system recommended';
COMMENT ON COLUMN public.datechangerequest.user_followed_recommendation IS 'Whether user selected the recommended option';

-- Create lease_nights table for pricing data
-- ⚠️ VERIFY: bookings_leases has UUID id column (not TEXT _id)
CREATE TABLE IF NOT EXISTS public.lease_nights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID REFERENCES public.bookings_leases(id) ON DELETE CASCADE,  -- VERIFY THIS FK
  date DATE NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  market_demand DECIMAL(3, 2) DEFAULT 1.0,
  day_of_week TEXT,
  is_weekend BOOLEAN DEFAULT FALSE,
  is_holiday BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lease_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lease_nights_date ON public.lease_nights(date);
CREATE INDEX IF NOT EXISTS idx_lease_nights_lease_id ON public.lease_nights(lease_id);

-- Add comments
COMMENT ON TABLE public.lease_nights IS 'Stores nightly pricing data for each lease date';
COMMENT ON COLUMN public.lease_nights.market_demand IS 'Market demand multiplier (0.7-1.4)';

-- Enable RLS
ALTER TABLE public.lease_nights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lease_nights
CREATE POLICY "Service role full access to lease_nights"
  ON public.lease_nights FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read lease nights"
  ON public.lease_nights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings_leases
      WHERE bookings_leases.id = lease_nights.lease_id
      -- TODO: Add tenant check based on actual bookings_leases schema
    )
  );

-- Grant permissions
GRANT SELECT ON public.lease_nights TO authenticated;
GRANT ALL ON public.lease_nights TO service_role;
```

### 7.5 Migration 005_adapted: Create `archetype_job_logs` table

**File:** `supabase/migrations/20260129_005_create_job_logs_table.sql`

**⚠️ NOTE:** Contains pg_cron setup - verify extension enabled

```sql
-- Migration: Create Archetype Job Logs Table (ADAPTED)
-- Pattern 1: Personalized Defaults

CREATE TABLE IF NOT EXISTS public.archetype_job_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL CHECK (job_type IN ('recalculation', 'cleanup', 'migration')),
  processed_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_archetype_job_logs_job_type ON public.archetype_job_logs(job_type);
CREATE INDEX idx_archetype_job_logs_completed_at ON public.archetype_job_logs(completed_at);

-- Add comments
COMMENT ON TABLE public.archetype_job_logs IS 'Tracks background job executions for archetype system';

-- Enable RLS
ALTER TABLE public.archetype_job_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access to archetype_job_logs"
  ON public.archetype_job_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.archetype_job_logs TO authenticated;
GRANT ALL ON public.archetype_job_logs TO service_role;

-- ⚠️ pg_cron setup - VERIFY pg_cron extension is enabled first
-- Check with: SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- ⚠️ Commenting out cron job - uncomment after verifying environment settings
/*
SELECT cron.schedule(
  'daily-archetype-recalculation',
  '0 2 * * *',  -- Run at 2 AM daily
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/archetype-recalculation-job',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'config', jsonb_build_object(
          'batchSize', 100,
          'onlyStaleUsers', true
        )
      )
    ) as request_id;
  $$
);
*/

-- Alternative: Use Supabase Edge Function cron trigger (preferred for Supabase hosted)
-- Add this to supabase/config.toml:
-- [functions.archetype-recalculation-job]
-- schedule = "0 2 * * *"
```

---

## 8. Edge Function Code Adaptations

### 8.1 Required Code Changes

**File:** `supabase/functions/transaction-recommendations/index.ts`

**Changes:**
1. Update table references:
   ```typescript
   // BEFORE:
   .from('date_change_requests')

   // AFTER:
   .from('datechangerequest')
   ```

2. Update lease table reference:
   ```typescript
   // BEFORE:
   .from('leases')

   // AFTER:
   .from('bookings_leases')
   ```

3. Update user ID handling (if using dual-reference):
   ```typescript
   // Add helper function to query by either user ID type
   async function getUserArchetype(supabase, userId) {
     const { data, error } = await supabase
       .from('user_archetypes')
       .select('*')
       .or(`auth_user_id.eq.${userId},bubble_user_id.eq.${userId}`)
       .single();

     if (error) throw error;
     return data;
   }
   ```

**File:** `supabase/functions/_shared/archetype-detection.ts`

**Changes:**
1. Update `getUserArchetypeSignals()` function:
   ```typescript
   // Query datechangerequest instead of date_change_requests
   const { data: requests, error: requestsError } = await supabase
     .from('datechangerequest')  // Changed from 'date_change_requests'
     .select('transaction_type, status, created_at')
     .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
     .order('created_at', { ascending: false })
     .limit(50);
   ```

### 8.2 Testing Checklist

After deployment, test:

- [ ] `transaction-recommendations` API with test user
- [ ] `user-archetype` GET endpoint
- [ ] `user-archetype` POST endpoint (admin only)
- [ ] Background job execution
- [ ] Analytics logging to `recommendation_logs`
- [ ] RLS policies work correctly for authenticated users

---

## 9. Deployment Checklist

### Pre-Deployment

- [ ] Review all adapted migrations
- [ ] Run pre-flight SQL checks (Section 6.1)
- [ ] Backup critical tables
- [ ] Verify pg_cron extension status
- [ ] Confirm SUPABASE_SERVICE_ROLE_KEY is configured
- [ ] Test migrations on local Supabase instance first

### Deployment Phase 1: Core Tables

- [ ] Run migration 001_adapted (user_archetypes)
- [ ] Run migration 002_adapted (recommendation_logs)
- [ ] Run migration 003_adapted (admin_audit_log)
- [ ] Run migration 005_adapted (archetype_job_logs)
- [ ] Verify all tables created successfully
- [ ] Test RLS policies

### Deployment Phase 2: Schema Enhancements

- [ ] **PAUSE: Validate datechangerequest schema**
- [ ] **PAUSE: Validate bookings_leases foreign key compatibility**
- [ ] Run migration 004_adapted (datechangerequest + lease_nights)
- [ ] Verify no data corruption in existing tables

### Deployment Phase 3: Edge Functions

- [ ] Copy shared utilities to `supabase/functions/_shared/`
- [ ] Adapt Edge Function code (table name changes)
- [ ] Update `supabase/config.toml`
- [ ] Deploy transaction-recommendations function
- [ ] Deploy user-archetype function
- [ ] Deploy archetype-recalculation-job function
- [ ] Test all endpoints
- [ ] Monitor logs for errors

### Post-Deployment

- [ ] Verify cron job scheduled (if using pg_cron)
- [ ] Test recommendation API with real users
- [ ] Monitor recommendation_logs table for activity
- [ ] Validate archetype detection accuracy
- [ ] Review error logs in Slack channels
- [ ] Update frontend to call new API endpoints

---

## 10. Rollback Procedures

### If Migrations Fail

```bash
# Connect to Supabase
supabase db reset  # Resets to last known good state

# Or manual rollback
psql $DATABASE_URL -f rollback_script.sql
```

### If Edge Functions Fail

```bash
# Delete problematic functions
supabase functions delete transaction-recommendations
supabase functions delete user-archetype
supabase functions delete archetype-recalculation-job

# Remove shared utilities
rm supabase/functions/_shared/archetype-detection.ts
rm supabase/functions/_shared/default-selection-engine.ts
rm supabase/functions/_shared/urgency-calculator.ts
```

### Data Recovery

```sql
-- Restore from backups
DROP TABLE IF EXISTS public.datechangerequest CASCADE;
CREATE TABLE public.datechangerequest AS
SELECT * FROM datechangerequest_backup_20260129;

-- Rebuild constraints and indexes
-- (Manual restore based on original schema)
```

---

## 11. Next Steps: Frontend Integration

Once backend is deployed and validated:

1. **Frontend Team (OpenCode) Tasks:**
   - Integrate recommendation API into date change flow
   - Display archetype-based defaults in UI
   - Show urgency indicators
   - Track user selections for analytics
   - Update DateChangeRequestManager to use new transaction_type field

2. **Testing:**
   - A/B test archetype defaults
   - Monitor recommendation follow rates
   - Validate pricing calculations
   - Test with different user archetypes

3. **Optimization:**
   - Fine-tune archetype thresholds based on data
   - Adjust urgency multipliers
   - Iterate on default selection rules

---

## 12. Success Metrics

**Backend Integration Success:**
- ✅ All 5 migrations run without errors
- ✅ All 3 Edge Functions deployed successfully
- ✅ RLS policies working correctly
- ✅ No data corruption in existing tables
- ✅ API response time < 300ms (P95)

**Business Impact (Post-Frontend Integration):**
- Target: +204% revenue per transaction
- Recommendation follow rate: >65% overall
- Big Spender follow rate: >75%
- Time to decision: <30 seconds

---

## 13. Contact and Support

**Backend Lead:** Computer 1
**Frontend Lead:** OpenCode
**Pattern Owner:** Computer 1
**Documentation:** `pattern_1/backend/README.md`

---

**Status:** ✅ PLAN COMPLETE - READY FOR EXECUTION
**Risk Level:** MEDIUM (Schema modifications to active tables)
**Estimated Integration Time:** 2-4 hours (careful validation required)
