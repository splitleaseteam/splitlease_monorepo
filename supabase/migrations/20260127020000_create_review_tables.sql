-- Migration: Create Review Tables for Reviews Overview Feature
-- Split Lease Platform
-- Date: 2026-01-27
--
-- This migration creates the review system tables for two-way reviews
-- between hosts and guests after completed stays.

-- ============================================================================
-- MAIN REVIEW TABLE
-- ============================================================================
-- Stores the primary review entity with overall rating, comment, and metadata

CREATE TABLE IF NOT EXISTS review (
  _id TEXT PRIMARY KEY DEFAULT generate_bubble_id(),

  -- Relationships
  stay_id TEXT NOT NULL REFERENCES bookings_stays(_id),
  lease_id TEXT REFERENCES bookings_leases(_id),
  reviewer_id TEXT NOT NULL REFERENCES "user"(_id),
  reviewee_id TEXT NOT NULL REFERENCES "user"(_id),
  listing_id TEXT REFERENCES listing(_id),

  -- Review Content
  review_type TEXT NOT NULL CHECK (review_type IN ('host_reviews_guest', 'guest_reviews_host')),
  comment TEXT,
  overall_rating NUMERIC(2,1) CHECK (overall_rating >= 1 AND overall_rating <= 5),
  would_recommend BOOLEAN,

  -- Metadata
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Bubble Sync Fields (for legacy sync if needed)
  bubble_id TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  bubble_sync_error TEXT,

  -- Constraints
  -- Each user can only submit one review per stay
  UNIQUE(stay_id, reviewer_id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_review_reviewer_id ON review(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_reviewee_id ON review(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_review_stay_id ON review(stay_id);
CREATE INDEX IF NOT EXISTS idx_review_listing_id ON review(listing_id);
CREATE INDEX IF NOT EXISTS idx_review_type ON review(review_type);
CREATE INDEX IF NOT EXISTS idx_review_created_at ON review(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_status ON review(status) WHERE status = 'published';

-- ============================================================================
-- REVIEW RATING DETAIL TABLE
-- ============================================================================
-- Stores individual category ratings for each review (e.g., cleanliness, communication)

CREATE TABLE IF NOT EXISTS review_rating_detail (
  _id TEXT PRIMARY KEY DEFAULT generate_bubble_id(),

  -- Parent Review
  review_id TEXT NOT NULL REFERENCES review(_id) ON DELETE CASCADE,

  -- Rating Data
  category TEXT NOT NULL,
  category_label TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  -- Each category can only appear once per review
  UNIQUE(review_id, category)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rating_detail_review_id ON review_rating_detail(review_id);

-- ============================================================================
-- ADD REVIEW TRACKING TO BOOKINGS_STAYS
-- ============================================================================
-- Add columns to track which reviews have been submitted for each stay

ALTER TABLE bookings_stays
ADD COLUMN IF NOT EXISTS review_by_host_id TEXT REFERENCES review(_id),
ADD COLUMN IF NOT EXISTS review_by_guest_id TEXT REFERENCES review(_id),
ADD COLUMN IF NOT EXISTS review_by_host_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS review_by_guest_submitted_at TIMESTAMPTZ;

-- Indexes for efficient pending review queries
CREATE INDEX IF NOT EXISTS idx_stays_review_by_host ON bookings_stays(review_by_host_id) WHERE review_by_host_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stays_review_by_guest ON bookings_stays(review_by_guest_id) WHERE review_by_guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stays_pending_host_review ON bookings_stays(host_id) WHERE review_by_host_id IS NULL AND status = 'completed';
CREATE INDEX IF NOT EXISTS idx_stays_pending_guest_review ON bookings_stays(guest_id) WHERE review_by_guest_id IS NULL AND status = 'completed';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on review tables
ALTER TABLE review ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_rating_detail ENABLE ROW LEVEL SECURITY;

-- Review policies
-- Users can read their own reviews (as reviewer or reviewee)
CREATE POLICY "Users can read reviews they're involved in"
  ON review FOR SELECT
  USING (
    auth.uid()::text = reviewer_id
    OR auth.uid()::text = reviewee_id
  );

-- Users can insert reviews for their stays
CREATE POLICY "Users can insert reviews for their stays"
  ON review FOR INSERT
  WITH CHECK (auth.uid()::text = reviewer_id);

-- Users can update their own reviews (draft only)
CREATE POLICY "Users can update their draft reviews"
  ON review FOR UPDATE
  USING (auth.uid()::text = reviewer_id AND status = 'draft');

-- Rating detail policies follow parent review
CREATE POLICY "Users can read rating details for accessible reviews"
  ON review_rating_detail FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM review r
      WHERE r._id = review_rating_detail.review_id
      AND (auth.uid()::text = r.reviewer_id OR auth.uid()::text = r.reviewee_id)
    )
  );

CREATE POLICY "Users can insert rating details for their reviews"
  ON review_rating_detail FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM review r
      WHERE r._id = review_rating_detail.review_id
      AND auth.uid()::text = r.reviewer_id
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE review IS 'Main review table for host/guest reviews after stays';
COMMENT ON TABLE review_rating_detail IS 'Individual category ratings for each review';
COMMENT ON COLUMN review.review_type IS 'Direction of review: host_reviews_guest or guest_reviews_host';
COMMENT ON COLUMN review.overall_rating IS 'Average rating calculated from category ratings, 1-5 scale';
COMMENT ON COLUMN bookings_stays.review_by_host_id IS 'Reference to host review for this stay';
COMMENT ON COLUMN bookings_stays.review_by_guest_id IS 'Reference to guest review for this stay';
