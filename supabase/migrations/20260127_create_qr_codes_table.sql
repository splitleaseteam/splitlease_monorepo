-- Migration: Create QR Codes table
-- Split Lease - QR Code Landing Page Feature
-- Created: 2026-01-27

-- ============================================================
-- QR Codes Table
-- Stores QR code metadata for property check-in/out and information
-- ============================================================

CREATE TABLE public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  use_case TEXT NOT NULL CHECK (use_case IN ('check_in', 'check_out', 'emergency', 'general_info')),
  display_text TEXT, -- Human-readable use case label
  information_content TEXT, -- Custom message to display

  -- Relationships
  visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,

  -- Contact info for notifications
  host_phone TEXT,
  guest_phone TEXT,
  host_name TEXT,
  guest_name TEXT,
  property_name TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.qr_codes IS 'QR codes for property check-in/out, emergency, and general information';

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Public read access (QR codes need to be readable without auth for scanning)
CREATE POLICY "QR codes are publicly readable"
  ON public.qr_codes FOR SELECT
  USING (is_active = true);

-- Authenticated users can create QR codes
CREATE POLICY "Authenticated users can insert QR codes"
  ON public.qr_codes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update QR codes
CREATE POLICY "Authenticated users can update QR codes"
  ON public.qr_codes FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated users can delete QR codes
CREATE POLICY "Authenticated users can delete QR codes"
  ON public.qr_codes FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_qr_codes_visit_id ON public.qr_codes(visit_id);
CREATE INDEX idx_qr_codes_listing_id ON public.qr_codes(listing_id);
CREATE INDEX idx_qr_codes_property_id ON public.qr_codes(property_id);
CREATE INDEX idx_qr_codes_is_active ON public.qr_codes(is_active) WHERE is_active = true;

-- ============================================================
-- Trigger: Update updated_at on row modification
-- ============================================================

CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
