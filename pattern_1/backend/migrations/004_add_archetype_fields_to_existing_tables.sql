-- Migration: Add Archetype Fields to Existing Tables
-- Pattern 1: Personalized Defaults
-- Description: Enhances existing tables with archetype-related fields

-- Add archetype fields to date_change_requests table
-- (Assuming this table already exists based on spec)

ALTER TABLE public.date_change_requests
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
CREATE INDEX IF NOT EXISTS idx_date_change_requests_transaction_type
  ON public.date_change_requests(transaction_type);
CREATE INDEX IF NOT EXISTS idx_date_change_requests_recommended
  ON public.date_change_requests(recommended_option);

-- Add comments
COMMENT ON COLUMN public.date_change_requests.transaction_type IS 'Type of transaction: buyout, crash, or swap';
COMMENT ON COLUMN public.date_change_requests.urgency_multiplier IS 'Urgency pricing multiplier applied';
COMMENT ON COLUMN public.date_change_requests.recommended_option IS 'What option the system recommended';
COMMENT ON COLUMN public.date_change_requests.user_followed_recommendation IS 'Whether user selected the recommended option';

-- Create or enhance lease_nights table for pricing data
CREATE TABLE IF NOT EXISTS public.lease_nights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
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
CREATE POLICY "Users can read lease nights"
  ON public.lease_nights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leases
      WHERE leases.id = lease_nights.lease_id
      AND (
        leases.tenant_1_id = auth.uid() OR
        leases.tenant_2_id = auth.uid()
      )
    )
  );

-- Grant permissions
GRANT SELECT ON public.lease_nights TO authenticated;
GRANT ALL ON public.lease_nights TO service_role;
