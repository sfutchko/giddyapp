-- Add video and document tables for horse listings

-- Horse videos table
CREATE TABLE IF NOT EXISTS horse_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  duration INTEGER,
  file_size BIGINT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Horse documents table (health records, registration papers, etc.)
CREATE TABLE IF NOT EXISTS horse_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_horse_videos_horse_id ON horse_videos(horse_id);
CREATE INDEX IF NOT EXISTS idx_horse_documents_horse_id ON horse_documents(horse_id);

-- Enable RLS
ALTER TABLE horse_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE horse_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for horse_videos
CREATE POLICY "Anyone can view horse videos"
  ON horse_videos FOR SELECT
  USING (true);

CREATE POLICY "Horse owners can insert videos"
  ON horse_videos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM horses
      WHERE horses.id = horse_videos.horse_id
      AND horses.seller_id = auth.uid()
    )
  );

CREATE POLICY "Horse owners can update their videos"
  ON horse_videos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM horses
      WHERE horses.id = horse_videos.horse_id
      AND horses.seller_id = auth.uid()
    )
  );

CREATE POLICY "Horse owners can delete their videos"
  ON horse_videos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM horses
      WHERE horses.id = horse_videos.horse_id
      AND horses.seller_id = auth.uid()
    )
  );

-- RLS Policies for horse_documents
CREATE POLICY "Anyone can view horse documents"
  ON horse_documents FOR SELECT
  USING (true);

CREATE POLICY "Horse owners can insert documents"
  ON horse_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM horses
      WHERE horses.id = horse_documents.horse_id
      AND horses.seller_id = auth.uid()
    )
  );

CREATE POLICY "Horse owners can delete their documents"
  ON horse_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM horses
      WHERE horses.id = horse_documents.horse_id
      AND horses.seller_id = auth.uid()
    )
  );

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('horse-videos', 'horse-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos
CREATE POLICY "Anyone can view horse videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'horse-videos');

CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'horse-videos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'horse-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'horse-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('horse-documents', 'horse-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents
CREATE POLICY "Anyone can view horse documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'horse-documents');

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'horse-documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'horse-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
