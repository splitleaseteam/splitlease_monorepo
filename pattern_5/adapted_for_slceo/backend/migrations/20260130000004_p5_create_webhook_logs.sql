-- ============================================================================
-- PATTERN 5: FEE TRANSPARENCY - WEBHOOK LOGS MIGRATION
-- ============================================================================
-- Migration: Create webhook_logs table for tracking Stripe events
-- Version: 1.0
-- Date: 2026-01-30
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB,
    status VARCHAR(50) DEFAULT 'success',
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON public.webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at ON public.webhook_logs(processed_at);

-- Grant permissions
GRANT ALL ON public.webhook_logs TO service_role;
GRANT SELECT ON public.webhook_logs TO authenticated;
