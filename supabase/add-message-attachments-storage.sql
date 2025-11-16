-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  true,
  26214400, -- 25MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'video/mp4',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for message-attachments bucket
DROP POLICY IF EXISTS "Users can view message attachments" ON storage.objects;
CREATE POLICY "Users can view message attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message-attachments' AND
    (
      -- Allow viewing if user is part of the conversation
      EXISTS (
        SELECT 1 FROM message_attachments ma
        JOIN messages m ON ma.message_id = m.id
        WHERE ma.storage_path = name
        AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can upload message attachments" ON storage.objects;
CREATE POLICY "Users can upload message attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-attachments' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own message attachments" ON storage.objects;
CREATE POLICY "Users can delete own message attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
