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
