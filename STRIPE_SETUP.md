# Stripe Payment Integration Setup Guide

## Overview

GiddyApp uses **Stripe Connect** for marketplace payments with a 7-day escrow system. This ensures secure transactions between buyers and sellers.

## Architecture

- **Platform Fee**: 5% of sale price
- **Stripe Fee**: 2.9% + $0.30 per transaction
- **Escrow Period**: 7 days (auto-release or manual release by buyer)
- **Seller Payouts**: Via Stripe Connect Express accounts

## Setup Steps

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification
3. Enable Connect in your Stripe Dashboard

### 2. Get API Keys

**Test Mode** (for development):
1. Go to Developers → API keys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)

**Live Mode** (for production):
1. Toggle to "Live mode" in dashboard
2. Copy **Publishable key** (starts with `pk_live_`)
3. Copy **Secret key** (starts with `sk_live_`)

### 3. Configure Webhooks

1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Set URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `charge.refunded`
5. Copy **Signing secret** (starts with `whsec_`)

### 4. Environment Variables

Add to your `.env.local`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# App URL (for Connect redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Database Migration

Execute the payments schema SQL in your Supabase dashboard:

```bash
# In Supabase SQL Editor, run:
supabase/payments-schema.sql
```

This creates:
- `stripe_accounts` - Seller Connect accounts
- `payment_intents` - Payment tracking
- `transactions` - Complete transaction records
- `transaction_events` - Audit log
- `refunds` - Refund management
- `platform_fees` - Fee configuration

### 6. Test the Integration

#### Test as Seller:
1. Login as a seller
2. Go to `/seller/stripe`
3. Complete Stripe Connect onboarding
4. Use test account details provided by Stripe

#### Test as Buyer:
1. Login as a buyer
2. Find an active horse listing
3. Click "Buy Now"
4. Use Stripe test card: `4242 4242 4242 4242`
5. Any future date for expiry
6. Any 3-digit CVC

### 7. Test Webhooks Locally

Use Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Use the webhook signing secret shown in terminal
```

## Fee Calculation

All calculations use **cents** (integers) to avoid floating-point errors:

```typescript
// Example: $10,000 horse
const priceCents = 1000000 // $10,000.00

// Stripe fee: 2.9% + $0.30
const stripeFeeCents = Math.round((1000000 * 2.9) / 100) + 30
// = 29030 cents ($290.30)

// Platform fee: 5%
const platformFeeCents = Math.round((1000000 * 5.0) / 100)
// = 50000 cents ($500.00)

// Seller receives
const sellerReceivesCents = 1000000 - 29030 - 50000
// = 920970 cents ($9,209.70)
```

## Payment Flow

### 1. Seller Onboarding
- Seller visits `/seller/stripe`
- Creates Stripe Connect Express account
- Completes identity verification
- Bank account connected

### 2. Buyer Purchase
- Buyer clicks "Buy Now" on horse listing
- Payment Intent created with platform fee
- Stripe Elements form displayed
- Buyer enters card details
- Payment processed immediately

### 3. Escrow Hold (7 days)
- Payment success webhook received
- Transaction created with status `payment_held`
- Horse marked as `SOLD`
- Escrow release date set to +7 days
- Both parties notified

### 4. Escrow Release
**Automatic (after 7 days)**:
- Cron job calls `autoReleaseEscrow()`
- Transfer created to seller's Connect account
- Transaction marked as `completed`
- Seller notified

**Manual (by buyer)**:
- Buyer calls `releaseEscrow(transactionId)`
- Immediate transfer to seller
- Transaction marked as `completed`

## Cron Job Setup

Set up a cron job to auto-release escrow:

**Vercel Cron** (add to `vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/release-escrow",
    "schedule": "0 */6 * * *"
  }]
}
```

**Or use external service** (e.g., cron-job.org):
- URL: `https://yourdomain.com/api/cron/release-escrow`
- Schedule: Every 6 hours

## Security Notes

1. **Never commit** `.env.local` or real API keys
2. **Always use test mode** during development
3. **Verify webhook signatures** (already implemented)
4. **Use HTTPS** in production
5. **Keep Stripe SDK updated**

## Common Issues

### Webhook 400 Error
- Check webhook secret is correct
- Verify endpoint URL is accessible
- Check Stripe CLI is forwarding correctly

### Payment Intent Fails
- Verify seller has completed Connect onboarding
- Check seller's `charges_enabled` and `payouts_enabled` are true
- Ensure horse is `ACTIVE` status

### Transfer Fails
- Confirm seller's bank account is verified
- Check seller hasn't been flagged by Stripe
- Verify `stripe_account_id` is correct

## Support

- Stripe Dashboard: [dashboard.stripe.com](https://dashboard.stripe.com)
- Stripe Docs: [stripe.com/docs](https://stripe.com/docs)
- Stripe Support: support@stripe.com

## Going Live

Before launching:
1. Switch to **Live mode** API keys
2. Update webhook endpoints to production URL
3. Complete Stripe business verification
4. Set up proper error monitoring (Sentry)
5. Test full payment flow end-to-end
6. Enable 2FA on Stripe account
7. Review Stripe's compliance requirements
