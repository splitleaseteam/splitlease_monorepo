-- Migration: Create Admin Audit Log Table
-- Pattern 1: Personalized Defaults
-- Description: Tracks all admin actions on archetypes for accountability

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'recalculate_archetype',
    'override_archetype',
    'reset_archetype',
    'update_config'
  )),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create indexes
CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_target ON public.admin_audit_log(target_user_id);

-- Add comments
COMMENT ON TABLE public.admin_audit_log IS 'Audit trail for all admin actions on user archetypes';
COMMENT ON COLUMN public.admin_audit_log.action IS 'Type of admin action performed';
COMMENT ON COLUMN public.admin_audit_log.metadata IS 'Additional context about the action (old/new values, reason, etc.)';

-- Enable Row Level Security
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can insert
-- (No policy needed for service role)

-- Grant permissions
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
