-- ============================================================================
-- PATTERN 5: FEE TRANSPARENCY - DATE CHANGE REQUEST FEE FIELDS MIGRATION
-- ============================================================================
-- Migration: Add fee_breakdown (JSONB), transaction_type, pricing fields
-- Version: 1.0
-- Date: 2026-01-28
-- Description: Adds comprehensive fee tracking to datechangerequest table
-- ============================================================================

-- Add fee breakdown and transaction type to datechangerequest table
ALTER TABLE public.datechangerequest
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50) DEFAULT 'date_change',
ADD COLUMN IF NOT EXISTS fee_breakdown JSONB,
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS fee_structure_version VARCHAR(50) DEFAULT '1.5_split_model_v1',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payment_processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_charge_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}'::jsonb;

-- Add constraints
ALTER TABLE public.datechangerequest
ADD CONSTRAINT valid_transaction_type
CHECK (transaction_type IN ('date_change', 'lease_takeover', 'sublet', 'renewal')),
ADD CONSTRAINT valid_payment_status
CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'failed', 'processing')),
ADD CONSTRAINT positive_base_price
CHECK (base_price IS NULL OR base_price > 0),
ADD CONSTRAINT positive_total_price
CHECK (total_price IS NULL OR total_price > 0);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dcr_transaction_type ON public.datechangerequest(transaction_type);
CREATE INDEX IF NOT EXISTS idx_dcr_payment_status ON public.datechangerequest(payment_status);
CREATE INDEX IF NOT EXISTS idx_dcr_fee_breakdown ON public.datechangerequest USING GIN (fee_breakdown);
CREATE INDEX IF NOT EXISTS idx_dcr_stripe_payment_intent ON public.datechangerequest(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_dcr_payment_processed_at ON public.datechangerequest(payment_processed_at);

-- Add column comments
COMMENT ON COLUMN public.datechangerequest.transaction_type IS 'Type of transaction (date_change, lease_takeover, sublet, etc.)';
COMMENT ON COLUMN public.datechangerequest.fee_breakdown IS 'JSONB object containing detailed fee breakdown (platform_fee, landlord_share, etc.)';
COMMENT ON COLUMN public.datechangerequest.base_price IS 'Base price (e.g., monthly rent) before fees';
COMMENT ON COLUMN public.datechangerequest.total_price IS 'Total price including all fees';
COMMENT ON COLUMN public.datechangerequest.fee_structure_version IS 'Version of fee structure used for this transaction';
COMMENT ON COLUMN public.datechangerequest.payment_status IS 'Current payment status of the request';
COMMENT ON COLUMN public.datechangerequest.payment_processed_at IS 'Timestamp when payment was processed';
COMMENT ON COLUMN public.datechangerequest.stripe_payment_intent_id IS 'Stripe PaymentIntent ID for this transaction';
COMMENT ON COLUMN public.datechangerequest.stripe_charge_id IS 'Stripe Charge ID for this transaction';
COMMENT ON COLUMN public.datechangerequest.payment_metadata IS 'Additional payment-related metadata';

-- Create view for fee analytics
CREATE OR REPLACE VIEW public.datechangerequest_fee_analytics AS
SELECT
    id,
    user_id,
    lease_id,
    transaction_type,
    base_price,
    total_price,
    (fee_breakdown->>'platform_fee')::DECIMAL as platform_fee,
    (fee_breakdown->>'landlord_share')::DECIMAL as landlord_share,
    (fee_breakdown->>'tenant_share')::DECIMAL as tenant_share,
    (fee_breakdown->>'total_fee')::DECIMAL as total_fee,
    (fee_breakdown->>'effective_rate')::DECIMAL as effective_rate,
    payment_status,
    status,
    created_at,
    payment_processed_at,
    stripe_payment_intent_id
FROM public.datechangerequest
WHERE fee_breakdown IS NOT NULL;

-- Grant permissions
GRANT SELECT ON public.datechangerequest_fee_analytics TO authenticated;

-- Create admin fee revenue summary view
CREATE OR REPLACE VIEW public.admin_fee_revenue_summary AS
SELECT
    DATE_TRUNC('day', payment_processed_at) as payment_date,
    transaction_type,
    COUNT(*) as transaction_count,
    SUM(base_price) as total_base_amount,
    SUM((fee_breakdown->>'platform_fee')::DECIMAL) as total_platform_fees,
    SUM((fee_breakdown->>'landlord_share')::DECIMAL) as total_landlord_share,
    SUM((fee_breakdown->>'total_fee')::DECIMAL) as total_fees_collected,
    AVG((fee_breakdown->>'effective_rate')::DECIMAL) as avg_effective_rate
FROM public.datechangerequest
WHERE payment_status = 'paid'
  AND fee_breakdown IS NOT NULL
  AND payment_processed_at IS NOT NULL
GROUP BY DATE_TRUNC('day', payment_processed_at), transaction_type
ORDER BY payment_date DESC;

-- Grant admin permissions
GRANT SELECT ON public.admin_fee_revenue_summary TO authenticated;

COMMENT ON TABLE public.datechangerequest IS 'Date change requests with comprehensive fee breakdown and transaction tracking';

-- ============================================================================
-- END MIGRATION
-- ============================================================================
