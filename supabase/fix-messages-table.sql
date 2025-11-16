-- Fix messages table to handle users without profiles and conversation_id type
-- First, change conversation_id from UUID to TEXT to allow string IDs
ALTER TABLE messages
  ALTER COLUMN conversation_id TYPE TEXT;

-- Drop existing foreign key constraints
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
  DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;

-- Add new foreign key constraints that reference auth.users instead of profiles
ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  ADD CONSTRAINT messages_recipient_id_fkey
    FOREIGN KEY (recipient_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Update the column name from 'read' to 'is_read' to avoid reserved keyword issues (if not already done)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'messages' AND column_name = 'read') THEN
    ALTER TABLE messages RENAME COLUMN read TO is_read;
  END IF;
END $$;

-- Update RLS policies to use auth.uid() directly
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON messages;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());