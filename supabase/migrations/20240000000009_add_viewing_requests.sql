-- Create viewing_requests table
CREATE TABLE IF NOT EXISTS viewing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled', 'completed')),
  message TEXT,
  seller_notes TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE viewing_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own requests (as requester)"
  ON viewing_requests FOR SELECT
  USING (auth.uid() = requester_id);

CREATE POLICY "Users can view requests for their horses (as seller)"
  ON viewing_requests FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Users can create viewing requests"
  ON viewing_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters can update their own pending requests"
  ON viewing_requests FOR UPDATE
  USING (auth.uid() = requester_id AND status = 'pending')
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Sellers can update requests for their horses"
  ON viewing_requests FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Requesters can delete their own pending requests"
  ON viewing_requests FOR DELETE
  USING (auth.uid() = requester_id AND status = 'pending');

-- Indexes
CREATE INDEX idx_viewing_requests_horse_id ON viewing_requests(horse_id);
CREATE INDEX idx_viewing_requests_requester_id ON viewing_requests(requester_id);
CREATE INDEX idx_viewing_requests_seller_id ON viewing_requests(seller_id);
CREATE INDEX idx_viewing_requests_status ON viewing_requests(status);
CREATE INDEX idx_viewing_requests_requested_date ON viewing_requests(requested_date);
CREATE INDEX idx_viewing_requests_created_at ON viewing_requests(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_viewing_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER viewing_requests_updated_at
  BEFORE UPDATE ON viewing_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_viewing_requests_updated_at();

-- Trigger to set timestamp when status changes
CREATE OR REPLACE FUNCTION set_viewing_request_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.approved_at = NOW();
  ELSIF NEW.status = 'declined' AND OLD.status != 'declined' THEN
    NEW.declined_at = NOW();
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = NOW();
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER viewing_request_status_timestamp
  BEFORE UPDATE ON viewing_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_viewing_request_status_timestamp();

-- Prevent self-requests (can't request to view your own horse)
CREATE OR REPLACE FUNCTION prevent_self_viewing_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.requester_id = NEW.seller_id THEN
    RAISE EXCEPTION 'Cannot request to view your own horse';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_self_viewing_request
  BEFORE INSERT ON viewing_requests
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_viewing_request();
