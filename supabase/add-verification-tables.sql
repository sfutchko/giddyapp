-- Create seller_verifications table
CREATE TABLE IF NOT EXISTS seller_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'additional_info_required')),

  -- Business Information
  business_name TEXT,
  business_type TEXT CHECK (business_type IN ('individual', 'sole_proprietor', 'llc', 'corporation', 'partnership')),
  tax_id TEXT,

  -- Contact Information
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  website TEXT,

  -- Additional Information
  years_experience TEXT,
  professional_references TEXT,

  -- Review Information
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  reviewer_notes TEXT,
  rejection_reason TEXT,

  -- Constraints
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, id)
);

-- Create verification_documents table
CREATE TABLE IF NOT EXISTS verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES seller_verifications(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add is_admin column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_seller_verifications_user_id ON seller_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_verifications_status ON seller_verifications(status);
CREATE INDEX IF NOT EXISTS idx_verification_documents_verification_id ON verification_documents(verification_id);

-- Row Level Security for seller_verifications
ALTER TABLE seller_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification requests
CREATE POLICY "Users can view own verifications" ON seller_verifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own verification requests
CREATE POLICY "Users can create verification requests" ON seller_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own verification requests (only if rejected or additional info required)
CREATE POLICY "Users can update own verifications" ON seller_verifications
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status IN ('rejected', 'additional_info_required')
  );

-- Admins can view all verifications
CREATE POLICY "Admins can view all verifications" ON seller_verifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Admins can update all verifications
CREATE POLICY "Admins can update all verifications" ON seller_verifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Row Level Security for verification_documents
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

-- Users can view documents for their verifications
CREATE POLICY "Users can view own verification documents" ON verification_documents
  FOR SELECT
  TO authenticated
  USING (
    verification_id IN (
      SELECT id FROM seller_verifications
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert documents for their verifications
CREATE POLICY "Users can insert verification documents" ON verification_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    verification_id IN (
      SELECT id FROM seller_verifications
      WHERE user_id = auth.uid()
    )
  );

-- Admins can view all documents
CREATE POLICY "Admins can view all verification documents" ON verification_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_seller_verifications_updated_at
  BEFORE UPDATE ON seller_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();