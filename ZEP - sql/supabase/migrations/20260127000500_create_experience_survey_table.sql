-- Experience Survey Table
-- Stores host feedback collected via the 11-step survey wizard
-- Created: January 27, 2026

CREATE TABLE experience_survey (
  -- Primary key
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Step 1: Name
  host_name TEXT,

  -- Step 2: Experience (REQUIRED)
  experience_description TEXT NOT NULL,

  -- Step 3: Prior Challenge
  prior_challenge TEXT,

  -- Step 4: Challenge Impact
  challenge_impact TEXT,

  -- Step 5: What Changed
  what_changed TEXT,

  -- Step 6: What Stood Out
  what_stood_out TEXT,

  -- Step 7: Additional Service
  additional_service_needed TEXT,

  -- Step 8: Public Share Permission
  can_share_publicly BOOLEAN DEFAULT false,

  -- Step 9: Recommendation Score (NPS 1-10)
  recommendation_score INTEGER CHECK (recommendation_score >= 1 AND recommendation_score <= 10),

  -- Step 10: Staff Appreciation
  staff_to_thank TEXT,

  -- Step 11: Questions
  additional_questions TEXT,

  -- Metadata
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted')),
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_experience_survey_user_id ON experience_survey(user_id);
CREATE INDEX idx_experience_survey_status ON experience_survey(status);
CREATE INDEX idx_experience_survey_created_at ON experience_survey(created_at DESC);

-- Row Level Security
ALTER TABLE experience_survey ENABLE ROW LEVEL SECURITY;

-- Users can only read their own surveys
CREATE POLICY "Users can read own surveys"
  ON experience_survey FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own surveys
CREATE POLICY "Users can insert own surveys"
  ON experience_survey FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_experience_survey_updated_at
  BEFORE UPDATE ON experience_survey
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment for documentation
COMMENT ON TABLE experience_survey IS 'Host experience feedback collected via 11-step survey wizard';
COMMENT ON COLUMN experience_survey.recommendation_score IS 'NPS-style score: 1-10 scale';
COMMENT ON COLUMN experience_survey.can_share_publicly IS 'Permission to use feedback in marketing';
