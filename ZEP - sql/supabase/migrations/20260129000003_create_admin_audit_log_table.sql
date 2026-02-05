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
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_auth ON public.admin_audit_log(admin_auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_bubble ON public.admin_audit_log(admin_bubble_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);

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
