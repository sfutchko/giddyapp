-- ============================================================================
-- COMPREHENSIVE REVIEWS AND RATINGS SYSTEM
-- ============================================================================
-- This creates a production-ready reviews and ratings system with:
-- - Transaction-based reviews (buyers and sellers can review each other)
-- - 5-star rating system with detailed categories
-- - Review moderation and reporting
-- - Helpful votes system
-- - Seller reply functionality
-- - Automatic reputation score calculation
-- - Review verification (must have completed transaction)
-- ============================================================================

-- ============================================================================
-- 1. REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who wrote the review and who it's for
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction context (must be from a completed offer)
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,

  -- Review type (buyer reviews seller, or seller reviews buyer)
  review_type VARCHAR(20) NOT NULL CHECK (review_type IN ('buyer_to_seller', 'seller_to_buyer')),

  -- Overall rating (1-5 stars)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

  -- Category ratings (optional, for seller reviews)
  communication_rating INTEGER CHECK (communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5)),
  accuracy_rating INTEGER CHECK (accuracy_rating IS NULL OR (accuracy_rating >= 1 AND accuracy_rating <= 5)),
  professionalism_rating INTEGER CHECK (professionalism_rating IS NULL OR (professionalism_rating >= 1 AND professionalism_rating <= 5)),

  -- Review content
  title VARCHAR(200),
  review_text TEXT NOT NULL CHECK (LENGTH(review_text) >= 10),

  -- Photos (optional - buyers can upload photos of the horse they received)
  photo_urls TEXT[],

  -- Moderation
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('pending', 'published', 'hidden', 'flagged', 'removed')),
  moderation_note TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id),

  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Seller reply
  seller_reply TEXT,
  seller_replied_at TIMESTAMPTZ,

  -- Verification
  verified_purchase BOOLEAN DEFAULT TRUE, -- All reviews require completed transaction

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one review per user per transaction
  CONSTRAINT unique_review_per_transaction UNIQUE (reviewer_id, offer_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id, status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_horse ON reviews(horse_id, status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_reviews_offer ON reviews(offer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view published reviews" ON reviews;
CREATE POLICY "Anyone can view published reviews"
  ON reviews FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
CREATE POLICY "Users can view their own reviews"
  ON reviews FOR SELECT
  USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

DROP POLICY IF EXISTS "Users can create reviews for completed transactions" ON reviews;
CREATE POLICY "Users can create reviews for completed transactions"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = offer_id
        AND offers.status = 'accepted'
        AND (offers.buyer_id = auth.uid() OR offers.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Reviewees can add seller replies" ON reviews;
CREATE POLICY "Reviewees can add seller replies"
  ON reviews FOR UPDATE
  USING (auth.uid() = reviewee_id)
  WITH CHECK (auth.uid() = reviewee_id);

-- ============================================================================
-- 2. REVIEW HELPFUL VOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL, -- true = helpful, false = not helpful
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One vote per user per review
  CONSTRAINT unique_vote_per_review UNIQUE (review_id, user_id)
);

-- Index for counting votes
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review ON review_helpful_votes(review_id);

-- Enable RLS
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view helpful votes" ON review_helpful_votes;
CREATE POLICY "Anyone can view helpful votes"
  ON review_helpful_votes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can vote on reviews" ON review_helpful_votes;
CREATE POLICY "Users can vote on reviews"
  ON review_helpful_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their votes" ON review_helpful_votes;
CREATE POLICY "Users can update their votes"
  ON review_helpful_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their votes" ON review_helpful_votes;
CREATE POLICY "Users can delete their votes"
  ON review_helpful_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. REVIEW REPORTS TABLE (for flagging inappropriate reviews)
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL CHECK (reason IN (
    'spam', 'offensive', 'fake', 'irrelevant', 'personal_info', 'other'
  )),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One report per user per review
  CONSTRAINT unique_report_per_review UNIQUE (review_id, reporter_id)
);

-- Index for moderation queue
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_review_reports_review ON review_reports(review_id);

-- Enable RLS
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can report reviews" ON review_reports;
CREATE POLICY "Users can report reviews"
  ON review_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON review_reports;
CREATE POLICY "Users can view their own reports"
  ON review_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- ============================================================================
-- 4. USER REPUTATION TABLE (cached reputation scores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_reputation (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Overall stats
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,

  -- Rating distribution
  rating_5_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_1_count INTEGER DEFAULT 0,

  -- Category averages (for sellers)
  average_communication DECIMAL(3, 2) DEFAULT 0.00,
  average_accuracy DECIMAL(3, 2) DEFAULT 0.00,
  average_professionalism DECIMAL(3, 2) DEFAULT 0.00,

  -- Seller-specific stats
  as_seller_reviews INTEGER DEFAULT 0,
  as_seller_rating DECIMAL(3, 2) DEFAULT 0.00,

  -- Buyer-specific stats
  as_buyer_reviews INTEGER DEFAULT 0,
  as_buyer_rating DECIMAL(3, 2) DEFAULT 0.00,

  -- Reputation score (0-100)
  reputation_score INTEGER DEFAULT 0,

  -- Badges
  is_top_rated BOOLEAN DEFAULT FALSE,
  is_verified_seller BOOLEAN DEFAULT FALSE,

  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view user reputation" ON user_reputation;
CREATE POLICY "Anyone can view user reputation"
  ON user_reputation FOR SELECT
  USING (true);

-- System can update reputation
DROP POLICY IF EXISTS "System can manage reputation" ON user_reputation;
CREATE POLICY "System can manage reputation"
  ON user_reputation FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 5. TRIGGER: Update review helpful counts
-- ============================================================================

CREATE OR REPLACE FUNCTION update_review_helpful_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_helpful <> NEW.is_helpful THEN
      IF NEW.is_helpful THEN
        UPDATE reviews
        SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1
        WHERE id = NEW.review_id;
      ELSE
        UPDATE reviews
        SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1
        WHERE id = NEW.review_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN
      UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    ELSE
      UPDATE reviews SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.review_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_helpful_counts_trigger ON review_helpful_votes;
CREATE TRIGGER review_helpful_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON review_helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_counts();

-- ============================================================================
-- 6. FUNCTION: Calculate and update user reputation
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_user_reputation(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_reviews INTEGER;
  v_average_rating DECIMAL(3, 2);
  v_rating_5 INTEGER;
  v_rating_4 INTEGER;
  v_rating_3 INTEGER;
  v_rating_2 INTEGER;
  v_rating_1 INTEGER;
  v_avg_communication DECIMAL(3, 2);
  v_avg_accuracy DECIMAL(3, 2);
  v_avg_professionalism DECIMAL(3, 2);
  v_seller_reviews INTEGER;
  v_seller_rating DECIMAL(3, 2);
  v_buyer_reviews INTEGER;
  v_buyer_rating DECIMAL(3, 2);
  v_reputation_score INTEGER;
  v_is_top_rated BOOLEAN;
BEGIN
  -- Get overall review stats
  SELECT
    COUNT(*)::INTEGER,
    COALESCE(AVG(rating), 0)::DECIMAL(3, 2),
    COUNT(*) FILTER (WHERE rating = 5)::INTEGER,
    COUNT(*) FILTER (WHERE rating = 4)::INTEGER,
    COUNT(*) FILTER (WHERE rating = 3)::INTEGER,
    COUNT(*) FILTER (WHERE rating = 2)::INTEGER,
    COUNT(*) FILTER (WHERE rating = 1)::INTEGER,
    COALESCE(AVG(communication_rating) FILTER (WHERE communication_rating IS NOT NULL), 0)::DECIMAL(3, 2),
    COALESCE(AVG(accuracy_rating) FILTER (WHERE accuracy_rating IS NOT NULL), 0)::DECIMAL(3, 2),
    COALESCE(AVG(professionalism_rating) FILTER (WHERE professionalism_rating IS NOT NULL), 0)::DECIMAL(3, 2)
  INTO
    v_total_reviews,
    v_average_rating,
    v_rating_5,
    v_rating_4,
    v_rating_3,
    v_rating_2,
    v_rating_1,
    v_avg_communication,
    v_avg_accuracy,
    v_avg_professionalism
  FROM reviews
  WHERE reviewee_id = p_user_id AND status = 'published';

  -- Get seller-specific stats
  SELECT
    COUNT(*)::INTEGER,
    COALESCE(AVG(rating), 0)::DECIMAL(3, 2)
  INTO v_seller_reviews, v_seller_rating
  FROM reviews
  WHERE reviewee_id = p_user_id
    AND status = 'published'
    AND review_type = 'buyer_to_seller';

  -- Get buyer-specific stats
  SELECT
    COUNT(*)::INTEGER,
    COALESCE(AVG(rating), 0)::DECIMAL(3, 2)
  INTO v_buyer_reviews, v_buyer_rating
  FROM reviews
  WHERE reviewee_id = p_user_id
    AND status = 'published'
    AND review_type = 'seller_to_buyer';

  -- Calculate reputation score (0-100)
  -- Formula: Base score from average rating + bonuses for volume and recency
  v_reputation_score := LEAST(100, (
    (v_average_rating * 20) + -- Max 100 points from 5-star rating
    LEAST(20, v_total_reviews) + -- Up to 20 bonus points for having many reviews
    (CASE WHEN v_total_reviews >= 10 THEN 10 ELSE 0 END) -- Bonus for 10+ reviews
  ))::INTEGER;

  -- Top rated if 4.5+ stars with at least 5 reviews
  v_is_top_rated := v_average_rating >= 4.5 AND v_total_reviews >= 5;

  -- Insert or update reputation
  INSERT INTO user_reputation (
    user_id,
    total_reviews,
    average_rating,
    rating_5_count,
    rating_4_count,
    rating_3_count,
    rating_2_count,
    rating_1_count,
    average_communication,
    average_accuracy,
    average_professionalism,
    as_seller_reviews,
    as_seller_rating,
    as_buyer_reviews,
    as_buyer_rating,
    reputation_score,
    is_top_rated,
    last_calculated_at
  ) VALUES (
    p_user_id,
    v_total_reviews,
    v_average_rating,
    v_rating_5,
    v_rating_4,
    v_rating_3,
    v_rating_2,
    v_rating_1,
    v_avg_communication,
    v_avg_accuracy,
    v_avg_professionalism,
    v_seller_reviews,
    v_seller_rating,
    v_buyer_reviews,
    v_buyer_rating,
    v_reputation_score,
    v_is_top_rated,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    rating_5_count = EXCLUDED.rating_5_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_1_count = EXCLUDED.rating_1_count,
    average_communication = EXCLUDED.average_communication,
    average_accuracy = EXCLUDED.average_accuracy,
    average_professionalism = EXCLUDED.average_professionalism,
    as_seller_reviews = EXCLUDED.as_seller_reviews,
    as_seller_rating = EXCLUDED.as_seller_rating,
    as_buyer_reviews = EXCLUDED.as_buyer_reviews,
    as_buyer_rating = EXCLUDED.as_buyer_rating,
    reputation_score = EXCLUDED.reputation_score,
    is_top_rated = EXCLUDED.is_top_rated,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. TRIGGER: Auto-update reputation when reviews change
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_reputation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reputation for the reviewee
  PERFORM calculate_user_reputation(COALESCE(NEW.reviewee_id, OLD.reviewee_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_reputation_trigger ON reviews;
CREATE TRIGGER reviews_reputation_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_reputation();

-- ============================================================================
-- 8. TRIGGER: Send notification when review is received
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewer_name VARCHAR;
  v_horse_name VARCHAR;
  v_horse_slug VARCHAR;
BEGIN
  -- Only notify for published reviews
  IF NEW.status = 'published' THEN
    -- Get reviewer name
    SELECT COALESCE(p.full_name, p.name, 'Someone')
    INTO v_reviewer_name
    FROM profiles p
    WHERE p.user_id = NEW.reviewer_id;

    -- Get horse details
    SELECT name, slug
    INTO v_horse_name, v_horse_slug
    FROM horses
    WHERE id = NEW.horse_id;

    -- Create notification
    PERFORM create_notification(
      p_user_id := NEW.reviewee_id,
      p_type := 'review',
      p_title := 'New review',
      p_message := format('%s left you a %s-star review%s',
        v_reviewer_name,
        NEW.rating,
        CASE WHEN v_horse_name IS NOT NULL THEN ' for ' || v_horse_name ELSE '' END
      ),
      p_horse_id := NEW.horse_id,
      p_action_url := '/profile/reviews',
      p_metadata := jsonb_build_object(
        'reviewer_name', v_reviewer_name,
        'rating', NEW.rating,
        'horse_name', v_horse_name,
        'review_id', NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_notification_trigger ON reviews;
CREATE TRIGGER review_notification_trigger
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_review();

-- ============================================================================
-- 9. FUNCTION: Check if user can review an offer
-- ============================================================================

CREATE OR REPLACE FUNCTION can_review_offer(p_offer_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_review BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM offers o
    WHERE o.id = p_offer_id
      AND o.status = 'accepted'
      AND (o.buyer_id = p_user_id OR o.seller_id = p_user_id)
      AND NOT EXISTS (
        SELECT 1 FROM reviews r
        WHERE r.offer_id = p_offer_id AND r.reviewer_id = p_user_id
      )
  ) INTO v_can_review;

  RETURN v_can_review;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. FUNCTION: Get user's average rating
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_rating(p_user_id UUID)
RETURNS DECIMAL(3, 2) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(average_rating, 0.00)
    FROM user_reputation
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_updated_at ON reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- ============================================================================
-- Reload schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';
