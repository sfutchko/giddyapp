-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false, -- Private bucket - only accessible via authenticated requests
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload their own verification documents
CREATE POLICY "Users can upload own verification documents" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM seller_verifications
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can view their own verification documents
CREATE POLICY "Users can view own verification documents" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM seller_verifications
    WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can view all verification documents
CREATE POLICY "Admins can view all verification documents" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- Policy: Users can delete their own verification documents
CREATE POLICY "Users can delete own verification documents" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM seller_verifications
    WHERE user_id = auth.uid()
    AND status IN ('draft', 'rejected')
  )
);