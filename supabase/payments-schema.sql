-- Stripe Connect Accounts
-- Stores seller Stripe Connect account information
CREATE TABLE IF NOT EXISTS stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL, -- 'standard' or 'express'
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  country TEXT,
  default_currency TEXT DEFAULT 'usd',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Payment Intents
-- Tracks Stripe Payment Intents for buyer payments
CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL, -- Total amount in cents
  platform_fee_cents INTEGER NOT NULL, -- Platform fee in cents
  seller_amount_cents INTEGER NOT NULL, -- Amount seller receives in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- 'pending', 'requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'canceled'
  client_secret TEXT,
  payment_method_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
-- Complete transaction records with all details
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id),

  -- Pricing
  listing_price_cents INTEGER NOT NULL, -- Original listing price
  final_price_cents INTEGER NOT NULL, -- Actual sale price (may be from offer)
  platform_fee_cents INTEGER NOT NULL, -- Platform fee charged
  seller_receives_cents INTEGER NOT NULL, -- Net amount to seller

  -- Payment tracking
  payment_intent_id UUID REFERENCES payment_intents(id),
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT, -- Transfer to seller's Connect account

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' - Transaction created
  -- 'payment_processing' - Payment being processed
  -- 'payment_held' - Payment successful, held in escrow
  -- 'completed' - Funds released to seller
  -- 'refunded' - Full refund issued
  -- 'partially_refunded' - Partial refund issued
  -- 'disputed' - Chargeback or dispute
  -- 'cancelled' - Transaction cancelled

  -- Escrow details
  escrow_release_date TIMESTAMPTZ, -- When funds will be auto-released
  escrow_released_at TIMESTAMPTZ, -- When funds were actually released
  escrow_released_by UUID REFERENCES auth.users(id), -- Who released (buyer, seller, or admin)

  -- Important dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,
  cancellation_reason TEXT
);

-- Transaction Events
-- Audit log for all transaction state changes
CREATE TABLE IF NOT EXISTS transaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  -- 'created', 'payment_initiated', 'payment_succeeded', 'payment_failed',
  -- 'funds_held', 'funds_released', 'refund_initiated', 'refund_completed',
  -- 'dispute_opened', 'dispute_resolved', 'cancelled'

  previous_status TEXT,
  new_status TEXT,
  amount_cents INTEGER, -- For refunds/disputes
  triggered_by UUID REFERENCES auth.users(id), -- User who triggered this event
  metadata JSONB, -- Additional event-specific data
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds
-- Track all refund requests and processing
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  stripe_refund_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL, -- Amount being refunded
  reason TEXT NOT NULL,
  -- 'duplicate', 'fraudulent', 'requested_by_customer', 'failed_inspection',
  -- 'transportation_failed', 'other'

  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending', 'processing', 'succeeded', 'failed', 'cancelled'

  requested_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id), -- Admin or system

  buyer_notes TEXT,
  seller_notes TEXT,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Platform Fee Configuration
-- Allows dynamic fee adjustments
CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.00, -- Platform fee as percentage
  min_fee_cents INTEGER DEFAULT 0, -- Minimum fee in cents
  max_fee_cents INTEGER, -- Maximum fee in cents (optional cap)
  stripe_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.9, -- Stripe's fee
  stripe_fee_fixed_cents INTEGER NOT NULL DEFAULT 30, -- Stripe's fixed fee
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default platform fee (5% + Stripe fees)
INSERT INTO platform_fees (fee_percentage, stripe_fee_percentage, stripe_fee_fixed_cents)
VALUES (5.00, 2.9, 30)
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_user_id ON stripe_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_stripe_id ON stripe_accounts(stripe_account_id);

CREATE INDEX IF NOT EXISTS idx_payment_intents_horse_id ON payment_intents(horse_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_buyer_id ON payment_intents(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_seller_id ON payment_intents(seller_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);

CREATE INDEX IF NOT EXISTS idx_transactions_horse_id ON transactions(horse_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_offer_id ON transactions(offer_id);

CREATE INDEX IF NOT EXISTS idx_transaction_events_transaction_id ON transaction_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_events_created_at ON transaction_events(created_at);

CREATE INDEX IF NOT EXISTS idx_refunds_transaction_id ON refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- Row Level Security (RLS)
ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;

-- Stripe Accounts: Users can only see their own
CREATE POLICY "Users can view own stripe account"
  ON stripe_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stripe account"
  ON stripe_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stripe account"
  ON stripe_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Payment Intents: Buyer and seller can view
CREATE POLICY "Buyer and seller can view payment intents"
  ON payment_intents FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Transactions: Buyer and seller can view
CREATE POLICY "Buyer and seller can view transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Transaction Events: Related parties can view
CREATE POLICY "Related parties can view transaction events"
  ON transaction_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_events.transaction_id
      AND (transactions.buyer_id = auth.uid() OR transactions.seller_id = auth.uid())
    )
  );

-- Refunds: Related parties can view
CREATE POLICY "Related parties can view refunds"
  ON refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = refunds.transaction_id
      AND (transactions.buyer_id = auth.uid() OR transactions.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can request refunds"
  ON refunds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = refunds.transaction_id
      AND (transactions.buyer_id = auth.uid() OR transactions.seller_id = auth.uid())
    )
    AND auth.uid() = requested_by
  );

-- Platform Fees: Public read access for current fees
CREATE POLICY "Anyone can view active platform fees"
  ON platform_fees FOR SELECT
  USING (is_active = true);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stripe_accounts_updated_at
  BEFORE UPDATE ON stripe_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at
  BEFORE UPDATE ON payment_intents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
