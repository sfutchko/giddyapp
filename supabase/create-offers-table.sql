-- Create offers table for horse offer/counter-offer system
CREATE TABLE IF NOT EXISTS offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Offer details
  offer_amount DECIMAL(10, 2) NOT NULL,
  offer_type VARCHAR(20) NOT NULL CHECK (offer_type IN ('initial', 'counter')),
  parent_offer_id UUID REFERENCES offers(id) ON DELETE SET NULL, -- For tracking counter-offers

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn', 'countered')),

  -- Message with offer
  message TEXT,

  -- Terms and conditions
  includes_transport BOOLEAN DEFAULT false,
  includes_vetting BOOLEAN DEFAULT false,
  contingencies TEXT,

  -- Expiration
  expires_at TIMESTAMPTZ,

  -- Response tracking
  responded_at TIMESTAMPTZ,
  response_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_offers_horse_id ON offers(horse_id);
CREATE INDEX idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX idx_offers_seller_id ON offers(seller_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_created_at ON offers(created_at DESC);

-- Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Buyers can view their own offers
CREATE POLICY "Buyers can view own offers"
  ON offers FOR SELECT
  USING (buyer_id = auth.uid());

-- Sellers can view offers on their horses
CREATE POLICY "Sellers can view offers on their horses"
  ON offers FOR SELECT
  USING (seller_id = auth.uid());

-- Buyers can create initial offers
CREATE POLICY "Buyers can create offers"
  ON offers FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid()
    AND offer_type = 'initial'
    AND status = 'pending'
  );

-- Sellers can create counter-offers
CREATE POLICY "Sellers can create counter offers"
  ON offers FOR INSERT
  WITH CHECK (
    seller_id = auth.uid()
    AND offer_type = 'counter'
    AND status = 'pending'
    AND parent_offer_id IS NOT NULL
  );

-- Buyers can update their pending offers (withdraw)
CREATE POLICY "Buyers can withdraw offers"
  ON offers FOR UPDATE
  USING (buyer_id = auth.uid() AND status = 'pending')
  WITH CHECK (status = 'withdrawn');

-- Sellers can update offer status (accept/reject)
CREATE POLICY "Sellers can respond to offers"
  ON offers FOR UPDATE
  USING (seller_id = auth.uid() AND status = 'pending')
  WITH CHECK (status IN ('accepted', 'rejected', 'countered'));

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_offers_updated_at();

-- Create function to expire old offers (run periodically)
CREATE OR REPLACE FUNCTION expire_old_offers()
RETURNS void AS $$
BEGIN
  UPDATE offers
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create offer_events table for tracking offer history
CREATE TABLE IF NOT EXISTS offer_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for offer events
CREATE INDEX idx_offer_events_offer_id ON offer_events(offer_id);
CREATE INDEX idx_offer_events_created_at ON offer_events(created_at DESC);

-- Enable RLS on offer_events
ALTER TABLE offer_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for offer_events
CREATE POLICY "Users can view events for their offers"
  ON offer_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = offer_events.offer_id
      AND (offers.buyer_id = auth.uid() OR offers.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can create events for their offers"
  ON offer_events FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = offer_events.offer_id
      AND (offers.buyer_id = auth.uid() OR offers.seller_id = auth.uid())
    )
  );