-- Add sold_date and sold_price fields to horses table
ALTER TABLE horses
ADD COLUMN IF NOT EXISTS sold_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS sold_price DECIMAL(10, 2);

-- Add index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_horses_status ON horses(status);