-- =====================================================
-- PATTERN 4: BS+BS COMPETITIVE BIDDING - DATABASE SCHEMA
-- =====================================================
-- Created: 2026-01-29
-- Purpose: Full database schema for competitive bidding system
-- Tables: bidding_sessions, bidding_participants, bids, bidding_results, bidding_notifications
--
-- Business Rules Enforced:
-- - Minimum bid increment: 10% above previous bid
-- - Maximum rounds per session: 3
-- - Loser compensation: 25% of winning bid
-- - Exactly 2 participants per session (both Big Spenders)

-- =====================================================
-- TABLE: bidding_sessions
-- =====================================================
-- Tracks all competitive bidding sessions
CREATE TABLE IF NOT EXISTS bidding_sessions (
    -- Primary identification
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Session metadata
    target_night DATE NOT NULL,
    property_id UUID NOT NULL,
    listing_id UUID,

    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Status values: pending, active, completed, expired, cancelled

    -- Timing
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Rules configuration
    max_rounds INTEGER NOT NULL DEFAULT 3,
    round_duration_seconds INTEGER NOT NULL DEFAULT 3600, -- 1 hour
    minimum_increment_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- 10%

    -- Current state
    current_round INTEGER NOT NULL DEFAULT 1,
    current_high_bid_id UUID,

    -- Winner determination
    winner_user_id UUID,
    winning_bid_amount DECIMAL(10,2),
    loser_compensation_amount DECIMAL(10,2),

    -- Financial tracking
    platform_revenue DECIMAL(10,2),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT bidding_sessions_status_check CHECK (
        status IN ('pending', 'active', 'completed', 'expired', 'cancelled')
    )
);

-- Indexes for performance
CREATE INDEX idx_bidding_sessions_target_night ON bidding_sessions(target_night);
CREATE INDEX idx_bidding_sessions_property_id ON bidding_sessions(property_id);
CREATE INDEX idx_bidding_sessions_status ON bidding_sessions(status);
CREATE INDEX idx_bidding_sessions_expires_at ON bidding_sessions(expires_at) WHERE status = 'active';

-- =====================================================
-- TABLE: bidding_participants
-- =====================================================
-- Tracks users participating in each session
CREATE TABLE IF NOT EXISTS bidding_participants (
    -- Primary identification
    participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES bidding_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- User metadata
    user_name VARCHAR(255),
    user_archetype VARCHAR(50) NOT NULL DEFAULT 'big_spender',

    -- Bidding state
    current_bid_amount DECIMAL(10,2),
    max_auto_bid_amount DECIMAL(10,2),
    last_bid_at TIMESTAMPTZ,
    total_bids_placed INTEGER NOT NULL DEFAULT 0,

    -- Outcome
    is_winner BOOLEAN NOT NULL DEFAULT FALSE,
    compensation_amount DECIMAL(10,2) DEFAULT 0,

    -- Participation tracking
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified_at TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(session_id, user_id)
);

-- Indexes
CREATE INDEX idx_bidding_participants_session_id ON bidding_participants(session_id);
CREATE INDEX idx_bidding_participants_user_id ON bidding_participants(user_id);

-- =====================================================
-- TABLE: bids
-- =====================================================
-- Individual bid records
CREATE TABLE IF NOT EXISTS bids (
    -- Primary identification
    bid_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES bidding_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Bid details
    amount DECIMAL(10,2) NOT NULL,
    round_number INTEGER NOT NULL,
    is_auto_bid BOOLEAN NOT NULL DEFAULT FALSE,

    -- Context
    previous_high_bid DECIMAL(10,2),
    increment_amount DECIMAL(10,2),
    increment_percent DECIMAL(5,2),

    -- Validation
    was_valid BOOLEAN NOT NULL DEFAULT TRUE,
    validation_errors TEXT[],

    -- Timing
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    client_ip INET,
    user_agent TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bids_session_id ON bids(session_id);
CREATE INDEX idx_bids_user_id ON bids(user_id);
CREATE INDEX idx_bids_placed_at ON bids(placed_at);
CREATE INDEX idx_bids_session_round ON bids(session_id, round_number);

-- =====================================================
-- TABLE: bidding_results
-- =====================================================
-- Final outcomes of completed sessions
CREATE TABLE IF NOT EXISTS bidding_results (
    -- Primary identification
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL UNIQUE REFERENCES bidding_sessions(session_id) ON DELETE CASCADE,

    -- Winner details
    winner_user_id UUID NOT NULL,
    winner_bid_amount DECIMAL(10,2) NOT NULL,
    winner_payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    winner_payment_intent_id VARCHAR(255),

    -- Loser details
    loser_user_id UUID NOT NULL,
    loser_compensation_amount DECIMAL(10,2) NOT NULL,
    loser_compensation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    loser_payout_id VARCHAR(255),

    -- Platform financials
    platform_revenue DECIMAL(10,2) NOT NULL,
    platform_fee_collected BOOLEAN NOT NULL DEFAULT FALSE,

    -- Calendar update
    night_assigned BOOLEAN NOT NULL DEFAULT FALSE,
    night_assignment_date TIMESTAMPTZ,

    -- Finalization
    finalized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalized_by UUID, -- Admin or system user

    -- Metadata
    total_bids_placed INTEGER,
    session_duration_minutes INTEGER,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bidding_results_session_id ON bidding_results(session_id);
CREATE INDEX idx_bidding_results_winner_user_id ON bidding_results(winner_user_id);
CREATE INDEX idx_bidding_results_loser_user_id ON bidding_results(loser_user_id);

-- =====================================================
-- TABLE: bidding_notifications
-- =====================================================
-- Track all notifications sent during bidding
CREATE TABLE IF NOT EXISTS bidding_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES bidding_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Notification details
    notification_type VARCHAR(50) NOT NULL,
    -- Types: session_started, bid_placed, outbid, auto_bid_triggered,
    --        session_ending_soon, session_ended, winner_announcement, loser_compensation

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,

    -- Delivery
    channels VARCHAR(20)[], -- ['email', 'push', 'sms', 'in_app']
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bidding_notifications_session_id ON bidding_notifications(session_id);
CREATE INDEX idx_bidding_notifications_user_id ON bidding_notifications(user_id);
CREATE INDEX idx_bidding_notifications_sent_at ON bidding_notifications(sent_at);

-- =====================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- =====================================================
-- Note: update_updated_at_column() function already exists from urgency pricing migration

-- Trigger for bidding_sessions
CREATE TRIGGER update_bidding_sessions_updated_at
    BEFORE UPDATE ON bidding_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bidding_participants
CREATE TRIGGER update_bidding_participants_updated_at
    BEFORE UPDATE ON bidding_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bidding_results
CREATE TRIGGER update_bidding_results_updated_at
    BEFORE UPDATE ON bidding_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Calculate minimum next bid
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_minimum_next_bid(
    p_session_id UUID
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_current_high_bid DECIMAL(10,2);
    v_minimum_increment_percent DECIMAL(5,2);
    v_minimum_next_bid DECIMAL(10,2);
BEGIN
    -- Get current session state
    SELECT
        COALESCE(winning_bid_amount, 0),
        minimum_increment_percent
    INTO
        v_current_high_bid,
        v_minimum_increment_percent
    FROM bidding_sessions
    WHERE session_id = p_session_id;

    -- Calculate minimum next bid (current + increment %)
    v_minimum_next_bid := v_current_high_bid * (1 + (v_minimum_increment_percent / 100));

    -- Round to 2 decimal places
    v_minimum_next_bid := ROUND(v_minimum_next_bid, 2);

    RETURN v_minimum_next_bid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Finalize bidding session
-- =====================================================
CREATE OR REPLACE FUNCTION finalize_bidding_session(
    p_session_id UUID
)
RETURNS TABLE (
    winner_user_id UUID,
    loser_user_id UUID,
    winning_bid DECIMAL(10,2),
    compensation DECIMAL(10,2),
    platform_revenue DECIMAL(10,2)
) AS $$
DECLARE
    v_winner_id UUID;
    v_loser_id UUID;
    v_winning_bid DECIMAL(10,2);
    v_compensation DECIMAL(10,2);
    v_platform_revenue DECIMAL(10,2);
BEGIN
    -- Get current high bidder as winner
    SELECT
        bs.winner_user_id,
        bs.winning_bid_amount
    INTO
        v_winner_id,
        v_winning_bid
    FROM bidding_sessions bs
    WHERE bs.session_id = p_session_id;

    -- Get loser (other participant)
    SELECT user_id INTO v_loser_id
    FROM bidding_participants
    WHERE session_id = p_session_id
      AND user_id != v_winner_id
    LIMIT 1;

    -- Calculate compensation (25% of winning bid)
    v_compensation := ROUND(v_winning_bid * 0.25, 2);

    -- Calculate platform revenue
    v_platform_revenue := v_winning_bid - v_compensation;

    -- Update session
    UPDATE bidding_sessions
    SET
        status = 'completed',
        completed_at = NOW(),
        loser_compensation_amount = v_compensation,
        platform_revenue = v_platform_revenue
    WHERE session_id = p_session_id;

    -- Update participants
    UPDATE bidding_participants
    SET is_winner = TRUE
    WHERE session_id = p_session_id AND user_id = v_winner_id;

    UPDATE bidding_participants
    SET
        compensation_amount = v_compensation,
        is_winner = FALSE
    WHERE session_id = p_session_id AND user_id = v_loser_id;

    -- Create result record
    INSERT INTO bidding_results (
        session_id,
        winner_user_id,
        winner_bid_amount,
        loser_user_id,
        loser_compensation_amount,
        platform_revenue,
        total_bids_placed,
        session_duration_minutes
    )
    SELECT
        p_session_id,
        v_winner_id,
        v_winning_bid,
        v_loser_id,
        v_compensation,
        v_platform_revenue,
        COUNT(b.bid_id),
        EXTRACT(EPOCH FROM (NOW() - bs.started_at)) / 60
    FROM bidding_sessions bs
    LEFT JOIN bids b ON b.session_id = bs.session_id
    WHERE bs.session_id = p_session_id
    GROUP BY bs.session_id, bs.started_at;

    -- Return result
    RETURN QUERY
    SELECT
        v_winner_id,
        v_loser_id,
        v_winning_bid,
        v_compensation,
        v_platform_revenue;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE bidding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidding_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidding_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidding_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for bidding_sessions
CREATE POLICY "Users can view their sessions"
    ON bidding_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bidding_participants bp
            WHERE bp.session_id = bidding_sessions.session_id
              AND bp.user_id = auth.uid()
        )
    );

-- Policies for bidding_participants
CREATE POLICY "Users can view participants in their sessions"
    ON bidding_participants FOR SELECT
    USING (
        session_id IN (
            SELECT session_id FROM bidding_participants
            WHERE user_id = auth.uid()
        )
    );

-- Policies for bids
CREATE POLICY "Users can view bids in their sessions"
    ON bids FOR SELECT
    USING (
        session_id IN (
            SELECT session_id FROM bidding_participants
            WHERE user_id = auth.uid()
        )
    );

-- Policies for bidding_results
CREATE POLICY "Users can view results they participated in"
    ON bidding_results FOR SELECT
    USING (
        winner_user_id = auth.uid() OR loser_user_id = auth.uid()
    );

-- Policies for bidding_notifications
CREATE POLICY "Users can view their own notifications"
    ON bidding_notifications FOR SELECT
    USING (user_id = auth.uid());

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE bidding_sessions IS 'Competitive bidding sessions between Big Spender pairs (Pattern 4: BS+BS)';
COMMENT ON TABLE bidding_participants IS 'Users participating in bidding sessions (exactly 2 Big Spenders per session)';
COMMENT ON TABLE bids IS 'Individual bids placed during sessions';
COMMENT ON TABLE bidding_results IS 'Final outcomes and financial settlement for completed sessions';
COMMENT ON TABLE bidding_notifications IS 'Notifications sent during bidding process';

COMMENT ON COLUMN bidding_sessions.minimum_increment_percent IS 'Required % increase for next bid (default 10%)';
COMMENT ON COLUMN bidding_sessions.round_duration_seconds IS 'Duration of each bidding round in seconds (default 3600 = 1 hour)';
COMMENT ON COLUMN bidding_sessions.max_rounds IS 'Maximum number of bids per user per session (default 3)';
COMMENT ON COLUMN bidding_participants.max_auto_bid_amount IS 'eBay-style proxy bidding maximum amount';
COMMENT ON COLUMN bids.is_auto_bid IS 'TRUE if bid was placed automatically by proxy bidding system';
COMMENT ON COLUMN bidding_results.loser_compensation_amount IS '25% of winning bid paid to loser as compensation';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
