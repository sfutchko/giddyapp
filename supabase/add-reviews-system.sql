-- Reviews and Ratings System
-- Run this SQL in Supabase SQL Editor

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    horse_id UUID REFERENCES horses(id) ON DELETE SET NULL,

    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT NOT NULL,

    -- Review type (buyer reviewing seller or seller reviewing buyer)
    reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('buyer', 'seller')),

    -- Moderation
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'pending', 'flagged', 'removed')),
    moderation_notes TEXT,
    moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    moderated_at TIMESTAMPTZ,

    -- Metadata
    is_verified_purchase BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_transaction_reviewer UNIQUE (transaction_id, reviewer_id),
    CONSTRAINT valid_rating CHECK (rating BETWEEN 1 AND 5)
);

-- Create review responses table (for sellers to respond to reviews)
CREATE TABLE IF NOT EXISTS review_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    responder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    response TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Only one response per review
    CONSTRAINT unique_review_response UNIQUE (review_id)
);

-- Create review helpful votes table
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_review_vote UNIQUE (review_id, user_id)
);

-- Create review reports table
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'offensive', 'other')),
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_review_report UNIQUE (review_id, reporter_id)
);

-- Create seller reputation view
CREATE OR REPLACE VIEW seller_reputation AS
SELECT
    reviewee_id as seller_id,
    COUNT(*) as total_reviews,
    AVG(rating)::NUMERIC(3,2) as average_rating,
    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count,
    MAX(created_at) as last_review_date
FROM reviews
WHERE status = 'published' AND reviewer_type = 'buyer'
GROUP BY reviewee_id;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_transaction ON reviews(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reviews_horse ON reviews(horse_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_responses_review ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_review ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_responses_updated_at BEFORE UPDATE ON review_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone"
    ON reviews FOR SELECT
    USING (status = 'published');

CREATE POLICY "Users can create reviews for their transactions"
    ON reviews FOR INSERT
    WITH CHECK (
        auth.uid() = reviewer_id
        AND EXISTS (
            SELECT 1 FROM transactions
            WHERE id = transaction_id
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
            AND status = 'completed'
        )
    );

CREATE POLICY "Users can update their own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = reviewer_id)
    WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Admins can view all reviews"
    ON reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can moderate reviews"
    ON reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- RLS Policies for review responses
CREATE POLICY "Review responses are viewable by everyone"
    ON review_responses FOR SELECT
    USING (true);

CREATE POLICY "Reviewees can respond to their reviews"
    ON review_responses FOR INSERT
    WITH CHECK (
        auth.uid() = responder_id
        AND EXISTS (
            SELECT 1 FROM reviews
            WHERE id = review_id AND reviewee_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own responses"
    ON review_responses FOR UPDATE
    USING (auth.uid() = responder_id)
    WITH CHECK (auth.uid() = responder_id);

-- RLS Policies for helpful votes
CREATE POLICY "Helpful votes are viewable by everyone"
    ON review_helpful_votes FOR SELECT
    USING (true);

CREATE POLICY "Users can mark reviews as helpful"
    ON review_helpful_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their helpful votes"
    ON review_helpful_votes FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for review reports
CREATE POLICY "Users can view their own reports"
    ON review_reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
    ON review_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Users can report reviews"
    ON review_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports"
    ON review_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Function to update helpful count when vote is added/removed
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.review_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_helpful_count_on_vote
    AFTER INSERT OR DELETE ON review_helpful_votes
    FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- Function to update reported count when report is added
CREATE OR REPLACE FUNCTION update_review_reported_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews SET reported_count = reported_count + 1 WHERE id = NEW.review_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reported_count_on_report
    AFTER INSERT ON review_reports
    FOR EACH ROW EXECUTE FUNCTION update_review_reported_count();

-- Auto-flag reviews with multiple reports
CREATE OR REPLACE FUNCTION auto_flag_reported_reviews()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-flag if 3 or more reports
    IF (SELECT reported_count FROM reviews WHERE id = NEW.review_id) >= 3 THEN
        UPDATE reviews
        SET status = 'flagged',
            moderation_notes = 'Auto-flagged due to multiple reports'
        WHERE id = NEW.review_id AND status = 'published';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_flag_on_reports
    AFTER INSERT ON review_reports
    FOR EACH ROW EXECUTE FUNCTION auto_flag_reported_reviews();

COMMENT ON TABLE reviews IS 'User reviews for completed transactions';
COMMENT ON TABLE review_responses IS 'Seller responses to reviews';
COMMENT ON TABLE review_helpful_votes IS 'User votes marking reviews as helpful';
COMMENT ON TABLE review_reports IS 'Reports of inappropriate reviews';
COMMENT ON VIEW seller_reputation IS 'Aggregated seller reputation scores';
