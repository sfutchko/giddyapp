'use client'

import { useState, useEffect } from 'react'
import {
  getStripeAccount,
  createConnectOnboardingLink,
  createConnectDashboardLink,
  syncStripeAccountStatus
} from '@/lib/actions/stripe-connect'
import { CheckCircle, XCircle, ExternalLink, Loader2, CreditCard, DollarSign, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface StripeAccount {
  id: string
  stripe_account_id: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
}

export function StripeConnectSetup() {
  const [account, setAccount] = useState<StripeAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAccount()
  }, [])

  async function loadAccount() {
    setLoading(true)
    const result = await getStripeAccount()
    if (result.success && result.account) {
      setAccount(result.account as StripeAccount)
    }
    setLoading(false)
  }

  async function handleSetupClick() {
    setActionLoading(true)
    const result = await createConnectOnboardingLink()

    if (result.success && result.url) {
      window.location.href = result.url
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to create onboarding link',
        variant: 'destructive',
      })
      setActionLoading(false)
    }
  }

  async function handleDashboardClick() {
    setActionLoading(true)
    const result = await createConnectDashboardLink()

    if (result.success && result.url) {
      window.open(result.url, '_blank')
      setActionLoading(false)
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to create dashboard link',
        variant: 'destructive',
      })
      setActionLoading(false)
    }
  }

  async function handleSyncClick() {
    setActionLoading(true)
    const result = await syncStripeAccountStatus()

    if (result.success) {
      setAccount(result.account as StripeAccount)
      toast({
        title: 'Success',
        description: 'Account status synced successfully',
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to sync account',
        variant: 'destructive',
      })
    }
    setActionLoading(false)
  }

  const isFullySetup = account?.charges_enabled && account?.payouts_enabled && account?.details_submitted

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Settings</h1>
        <p className="text-gray-600">
          Set up your Stripe Connect account to receive payments for horse sales
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Account Status</h2>
            <p className="text-sm text-gray-600">
              {isFullySetup
                ? 'Your account is ready to receive payments'
                : 'Complete setup to start receiving payments'}
            </p>
          </div>
          {isFullySetup && (
            <div className="rounded-full bg-green-100 p-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          )}
        </div>

        {account && (
          <div className="space-y-3">
            <StatusItem
              label="Charges Enabled"
              enabled={account.charges_enabled}
              description="Can accept payments from buyers"
            />
            <StatusItem
              label="Payouts Enabled"
              enabled={account.payouts_enabled}
              description="Can receive funds to your bank account"
            />
            <StatusItem
              label="Details Submitted"
              enabled={account.details_submitted}
              description="Business information completed"
            />
          </div>
        )}

        <div className="mt-6 pt-6 border-t flex gap-3">
          {!isFullySetup ? (
            <button
              onClick={handleSetupClick}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ExternalLink className="h-5 w-5" />
              )}
              {account ? 'Complete Setup' : 'Start Setup'}
            </button>
          ) : (
            <button
              onClick={handleDashboardClick}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ExternalLink className="h-5 w-5" />
              )}
              Open Stripe Dashboard
            </button>
          )}

          {account && (
            <button
              onClick={handleSyncClick}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span>Refresh Status</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard
          icon={<DollarSign className="h-6 w-6" />}
          title="Platform Fee"
          description="5% platform fee + Stripe processing fees (2.9% + $0.30 per transaction)"
        />
        <InfoCard
          icon={<Shield className="h-6 w-6" />}
          title="7-Day Escrow"
          description="Funds are held securely for 7 days after each sale to ensure transaction completion"
        />
        <InfoCard
          icon={<CreditCard className="h-6 w-6" />}
          title="Secure Payments"
          description="Powered by Stripe Connect - bank-level security and PCI compliance"
        />
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
        <ol className="space-y-4">
          <Step
            number={1}
            title="Complete Stripe Setup"
            description="Provide your business information and bank details through Stripe's secure onboarding"
          />
          <Step
            number={2}
            title="List Your Horses"
            description="Create listings and accept offers from buyers on the platform"
          />
          <Step
            number={3}
            title="Buyer Makes Payment"
            description="When a sale is agreed, the buyer pays through our secure checkout"
          />
          <Step
            number={4}
            title="Funds Held in Escrow"
            description="Payment is held securely for 7 days while the transaction is completed"
          />
          <Step
            number={5}
            title="Receive Your Payment"
            description="After the escrow period, funds are automatically transferred to your bank account minus fees"
          />
        </ol>
      </div>
    </div>
  )
}

function StatusItem({ label, enabled, description }: { label: string; enabled: boolean; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        {enabled ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-gray-400" />
        )}
      </div>
      <div>
        <p className={`font-medium ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>
          {label}
        </p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}

function InfoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-5">
      <div className="text-green-600 mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}
