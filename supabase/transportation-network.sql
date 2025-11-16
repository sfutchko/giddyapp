-- Transportation Network System
-- Handles horse transportation, quotes, tracking, and insurance

-- ============================================
-- TRANSPORTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  description TEXT,

  -- Contact & Location
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  headquarters_address TEXT,
  headquarters_city TEXT,
  headquarters_state TEXT,
  headquarters_zip TEXT,

  -- Service Areas (JSONB array of states/regions)
  service_areas JSONB DEFAULT '[]'::jsonb,

  -- Credentials & Insurance
  usdot_number TEXT,
  mc_number TEXT,
  insurance_policy_number TEXT,
  insurance_coverage_amount DECIMAL(12,2),
  insurance_expiration_date DATE,
  is_insured BOOLEAN DEFAULT false,

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_documents JSONB DEFAULT '[]'::jsonb,

  -- Stats
  total_trips INTEGER DEFAULT 0,
  completed_trips INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_accepting_quotes BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSPORT QUOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transport_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request Info
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  -- Pickup & Delivery
  pickup_address TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  pickup_state TEXT NOT NULL,
  pickup_zip TEXT NOT NULL,
  pickup_latitude DECIMAL(10,8),
  pickup_longitude DECIMAL(11,8),

  delivery_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_zip TEXT NOT NULL,
  delivery_latitude DECIMAL(10,8),
  delivery_longitude DECIMAL(11,8),

  distance_miles INTEGER,

  -- Horse Details
  horse_count INTEGER DEFAULT 1,
  horse_height DECIMAL(4,2),
  special_requirements TEXT,

  -- Dates
  preferred_pickup_date DATE,
  preferred_delivery_date DATE,
  flexible_dates BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'in_transit', 'delivered', 'cancelled')),

  -- Additional Services
  requires_health_certificate BOOLEAN DEFAULT false,
  requires_coggins BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSPORTER QUOTE RESPONSES
-- ============================================
CREATE TABLE IF NOT EXISTS transporter_quote_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID REFERENCES transport_quotes(id) ON DELETE CASCADE NOT NULL,
  transporter_id UUID REFERENCES transporters(id) ON DELETE CASCADE NOT NULL,

  -- Quote Details
  quoted_price DECIMAL(10,2) NOT NULL,
  estimated_pickup_date DATE,
  estimated_delivery_date DATE,
  estimated_duration_days INTEGER,

  -- Services Included
  includes_insurance BOOLEAN DEFAULT true,
  insurance_coverage_amount DECIMAL(12,2),
  includes_health_cert_check BOOLEAN DEFAULT false,
  includes_coggins_check BOOLEAN DEFAULT false,

  -- Vehicle Details
  vehicle_type TEXT, -- 'slant', 'straight', 'gooseneck', 'commercial'
  vehicle_capacity INTEGER,
  is_climate_controlled BOOLEAN DEFAULT false,

  -- Terms
  deposit_amount DECIMAL(10,2),
  deposit_due_date DATE,
  payment_terms TEXT,
  cancellation_policy TEXT,

  notes TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ,

  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(quote_request_id, transporter_id)
);

-- ============================================
-- TRANSPORT BOOKINGS
-- ============================================
CREATE TABLE IF NOT EXISTS transport_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_response_id UUID REFERENCES transporter_quote_responses(id) ON DELETE CASCADE NOT NULL,
  quote_request_id UUID REFERENCES transport_quotes(id) ON DELETE CASCADE NOT NULL,
  transporter_id UUID REFERENCES transporters(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Confirmed Details
  confirmed_price DECIMAL(10,2) NOT NULL,
  confirmed_pickup_date DATE NOT NULL,
  confirmed_delivery_date DATE NOT NULL,

  -- Payment
  deposit_paid BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10,2),
  deposit_paid_at TIMESTAMPTZ,

  full_payment_amount DECIMAL(10,2) NOT NULL,
  full_payment_paid BOOLEAN DEFAULT false,
  full_payment_paid_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_transit', 'delivered', 'cancelled', 'disputed')),

  -- Tracking
  current_location_latitude DECIMAL(10,8),
  current_location_longitude DECIMAL(11,8),
  current_location_updated_at TIMESTAMPTZ,

  estimated_arrival TIMESTAMPTZ,
  actual_pickup_date TIMESTAMPTZ,
  actual_delivery_date TIMESTAMPTZ,

  -- Documents
  bill_of_lading_url TEXT,
  insurance_certificate_url TEXT,
  delivery_receipt_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSPORT TRACKING UPDATES
-- ============================================
CREATE TABLE IF NOT EXISTS transport_tracking_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES transport_bookings(id) ON DELETE CASCADE NOT NULL,

  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location_name TEXT,

  status_update TEXT,
  notes TEXT,

  estimated_arrival TIMESTAMPTZ,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSPORTER REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS transporter_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES transport_bookings(id) ON DELETE CASCADE NOT NULL,
  transporter_id UUID REFERENCES transporters(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Ratings (1-5)
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  care_rating INTEGER CHECK (care_rating >= 1 AND care_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),

  -- Review
  title TEXT,
  review_text TEXT NOT NULL,
  photos JSONB DEFAULT '[]'::jsonb,

  -- Response
  transporter_reply TEXT,
  transporter_replied_at TIMESTAMPTZ,

  -- Helpful Votes
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(booking_id, reviewer_id)
);

-- ============================================
-- INSURANCE OPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS transport_insurance_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  provider_name TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  description TEXT,

  -- Coverage
  coverage_amount DECIMAL(12,2) NOT NULL,
  deductible DECIMAL(10,2),

  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  price_per_mile DECIMAL(6,4),
  price_per_thousand_value DECIMAL(6,4),

  -- Terms
  coverage_details JSONB DEFAULT '{}'::jsonb,
  exclusions TEXT[],
  requirements TEXT[],

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transporters_user_id ON transporters(user_id);
CREATE INDEX IF NOT EXISTS idx_transporters_is_verified ON transporters(is_verified);
CREATE INDEX IF NOT EXISTS idx_transporters_service_areas ON transporters USING GIN(service_areas);

CREATE INDEX IF NOT EXISTS idx_transport_quotes_requester ON transport_quotes(requester_id);
CREATE INDEX IF NOT EXISTS idx_transport_quotes_horse ON transport_quotes(horse_id);
CREATE INDEX IF NOT EXISTS idx_transport_quotes_status ON transport_quotes(status);

CREATE INDEX IF NOT EXISTS idx_quote_responses_request ON transporter_quote_responses(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_quote_responses_transporter ON transporter_quote_responses(transporter_id);
CREATE INDEX IF NOT EXISTS idx_quote_responses_status ON transporter_quote_responses(status);

CREATE INDEX IF NOT EXISTS idx_bookings_transporter ON transport_bookings(transporter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON transport_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON transport_bookings(status);

CREATE INDEX IF NOT EXISTS idx_tracking_booking ON transport_tracking_updates(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_transporter ON transporter_reviews(transporter_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Transporters
ALTER TABLE transporters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters viewable by all" ON transporters
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own transporter profile" ON transporters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transporter profile" ON transporters
  FOR UPDATE USING (auth.uid() = user_id);

-- Transport Quotes
ALTER TABLE transport_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quote requests" ON transport_quotes
  FOR SELECT USING (auth.uid() = requester_id);

CREATE POLICY "Users can create quote requests" ON transport_quotes
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own quote requests" ON transport_quotes
  FOR UPDATE USING (auth.uid() = requester_id);

-- Transporter Quote Responses
ALTER TABLE transporter_quote_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters can view responses to their quotes" ON transporter_quote_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transport_quotes
      WHERE transport_quotes.id = quote_request_id
      AND transport_quotes.requester_id = auth.uid()
    )
  );

CREATE POLICY "Transporters can view their own responses" ON transporter_quote_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transporters
      WHERE transporters.id = transporter_id
      AND transporters.user_id = auth.uid()
    )
  );

CREATE POLICY "Transporters can create responses" ON transporter_quote_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM transporters
      WHERE transporters.id = transporter_id
      AND transporters.user_id = auth.uid()
    )
  );

-- Transport Bookings
ALTER TABLE transport_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers and transporters can view bookings" ON transport_bookings
  FOR SELECT USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM transporters
      WHERE transporters.id = transporter_id
      AND transporters.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create bookings" ON transport_bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers and transporters can update bookings" ON transport_bookings
  FOR UPDATE USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM transporters
      WHERE transporters.id = transporter_id
      AND transporters.user_id = auth.uid()
    )
  );

-- Tracking Updates
ALTER TABLE transport_tracking_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking parties can view tracking" ON transport_tracking_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transport_bookings
      WHERE transport_bookings.id = booking_id
      AND (
        transport_bookings.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM transporters
          WHERE transporters.id = transport_bookings.transporter_id
          AND transporters.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Transporters can create tracking updates" ON transport_tracking_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM transport_bookings tb
      JOIN transporters t ON t.id = tb.transporter_id
      WHERE tb.id = booking_id
      AND t.user_id = auth.uid()
    )
  );

-- Reviews
ALTER TABLE transporter_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by all" ON transporter_reviews
  FOR SELECT USING (true);

CREATE POLICY "Customers can create reviews" ON transporter_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM transport_bookings
      WHERE transport_bookings.id = booking_id
      AND transport_bookings.customer_id = auth.uid()
      AND transport_bookings.status = 'delivered'
    )
  );

CREATE POLICY "Reviewers can update their reviews" ON transporter_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Insurance Options
ALTER TABLE transport_insurance_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insurance options viewable by all" ON transport_insurance_options
  FOR SELECT USING (is_active = true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update transporter stats when review is created
CREATE OR REPLACE FUNCTION update_transporter_stats_on_review()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE transporters
  SET
    total_reviews = (
      SELECT COUNT(*) FROM transporter_reviews WHERE transporter_id = NEW.transporter_id
    ),
    average_rating = (
      SELECT AVG(overall_rating)::DECIMAL(3,2) FROM transporter_reviews WHERE transporter_id = NEW.transporter_id
    ),
    updated_at = NOW()
  WHERE id = NEW.transporter_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_transporter_stats_on_review
AFTER INSERT ON transporter_reviews
FOR EACH ROW
EXECUTE FUNCTION update_transporter_stats_on_review();

-- Update booking status when delivered
CREATE OR REPLACE FUNCTION update_booking_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE transporters
    SET
      completed_trips = completed_trips + 1,
      updated_at = NOW()
    WHERE id = NEW.transporter_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_booking_on_delivery
AFTER UPDATE ON transport_bookings
FOR EACH ROW
WHEN (NEW.status IS DISTINCT FROM OLD.status)
EXECUTE FUNCTION update_booking_on_delivery();

-- Update quote status when response is accepted
CREATE OR REPLACE FUNCTION update_quote_on_response_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE transport_quotes
    SET status = 'accepted', updated_at = NOW()
    WHERE id = NEW.quote_request_id;

    -- Reject other pending quotes
    UPDATE transporter_quote_responses
    SET status = 'rejected', updated_at = NOW()
    WHERE quote_request_id = NEW.quote_request_id
    AND id != NEW.id
    AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quote_on_response_accepted
AFTER UPDATE ON transporter_quote_responses
FOR EACH ROW
WHEN (NEW.status IS DISTINCT FROM OLD.status)
EXECUTE FUNCTION update_quote_on_response_accepted();
