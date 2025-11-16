-- Create storage bucket for horse documents
-- Run this SQL in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('horse-documents', 'horse-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for horse-documents bucket

-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'horse-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'horse-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'horse-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view/download documents (controlled by RLS on horse_documents table)
CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'horse-documents');

-- Set bucket size limits (optional)
-- Maximum file size: 50MB
-- You can adjust these in the Supabase Dashboard under Storage settings
