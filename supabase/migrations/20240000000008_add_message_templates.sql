-- Create message_templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN (
    'greeting',
    'availability',
    'scheduling',
    'pricing',
    'details',
    'closing',
    'other'
  )),
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own templates"
  ON message_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON message_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON message_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON message_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_message_templates_user_id ON message_templates(user_id);
CREATE INDEX idx_message_templates_category ON message_templates(category);
CREATE INDEX idx_message_templates_usage_count ON message_templates(usage_count DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_message_templates_updated_at();

-- Insert some default templates for new users (optional)
-- These will be created when a user first accesses templates
CREATE OR REPLACE FUNCTION create_default_templates_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO message_templates (user_id, title, content, category, is_default) VALUES
    (p_user_id, 'Greeting - First Contact', 'Hi! Thanks for your interest in [horse name]. I''d be happy to answer any questions you have. When would be a good time for you to visit?', 'greeting', true),
    (p_user_id, 'Availability Confirmation', 'Yes, [horse name] is still available! Would you like to schedule a viewing?', 'availability', true),
    (p_user_id, 'Schedule Viewing', 'Great! I have availability on [day] at [time]. Does that work for you? The address is [location].', 'scheduling', true),
    (p_user_id, 'Price Discussion', 'The asking price is $[price]. I''m open to discussing the details once you''ve had a chance to meet [horse name] in person.', 'pricing', true),
    (p_user_id, 'Send Details', 'I can send you more information including veterinary records, training history, and additional photos. What would be most helpful?', 'details', true),
    (p_user_id, 'Thank You', 'Thank you for visiting! Please let me know if you have any other questions. I look forward to hearing from you.', 'closing', true)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
