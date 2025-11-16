'use client'

import { useState, useEffect } from 'react'
import { getUserTransactions } from '@/lib/actions/transactions'
import { formatCurrency } from '@/lib/utils/currency'
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { markNotificationsByTypeAsRead } from '@/lib/actions/notifications'

interface Transaction {
  id: string
  horse_id: string
  buyer_id: string
  seller_id: string
  final_price_cents: number
  platform_fee_cents: number
  seller_receives_cents: number
  status: string
  escrow_release_date: string
  created_at: string
  completed_at: string | null
  horses: {
    id: string
    name: string
    slug: string
  }
  buyer: {
    id: string
    name: string
    email: string
  }
  seller: {
    id: string
    name: string
    email: string
  }
}

type FilterType = 'all' | 'purchases' | 'sales' | 'active' | 'completed'
type StatusType = 'all' | 'pending' | 'payment_held' | 'completed' | 'refunded' | 'cancelled'

export function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [statusFilter, setStatusFilter] = useState<StatusType>('all')
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    loadTransactions()
    // Mark transaction/refund-related notifications as read when viewing this page
    markNotificationsByTypeAsRead(['refund_requested'])
  }, [])

  async function loadTransactions() {
    setLoading(true)
    const result = await getUserTransactions()

    if (result.success && result.transactions) {
      setTransactions(result.transactions)
      if (result.transactions.length > 0) {
        setCurrentUserId(result.transactions[0].buyer_id || result.transactions[0].seller_id)
      }
    }
    setLoading(false)
  }

  const filteredTransactions = transactions.filter(t => {
    // Role filter
    if (filter === 'purchases' && t.buyer_id !== currentUserId) return false
    if (filter === 'sales' && t.seller_id !== currentUserId) return false

    // Status filter
    if (filter === 'active' && !['pending', 'payment_processing', 'payment_held'].includes(t.status)) return false
    if (filter === 'completed' && t.status !== 'completed') return false

    // Detailed status filter
    if (statusFilter !== 'all' && t.status !== statusFilter) return false

    return true
  })

  // Calculate stats
  const stats = {
    totalPurchases: transactions.filter(t => t.buyer_id === currentUserId).length,
    totalSales: transactions.filter(t => t.seller_id === currentUserId).length,
    activeEscrow: transactions.filter(t => t.status === 'payment_held').length,
    totalRevenue: transactions
      .filter(t => t.seller_id === currentUserId && t.status === 'completed')
      .reduce((sum, t) => sum + t.seller_receives_cents, 0),
    totalSpent: transactions
      .filter(t => t.buyer_id === currentUserId && ['payment_held', 'completed'].includes(t.status))
      .reduce((sum, t) => sum + t.final_price_cents, 0),
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-1">View and manage your purchase and sale transactions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingDown className="h-5 w-5" />}
          label="Total Purchases"
          value={stats.totalPurchases.toString()}
          subtext={`${formatCurrency(stats.totalSpent)} spent`}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Sales"
          value={stats.totalSales.toString()}
          subtext={`${formatCurrency(stats.totalRevenue)} earned`}
          color="green"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Active Escrow"
          value={stats.activeEscrow.toString()}
          subtext="Funds in holding"
          color="amber"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="Completed"
          value={transactions.filter(t => t.status === 'completed').length.toString()}
          subtext="All time"
          color="gray"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="font-semibold text-gray-900">Filters</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="All Transactions"
          />
          <FilterButton
            active={filter === 'purchases'}
            onClick={() => setFilter('purchases')}
            label="My Purchases"
          />
          <FilterButton
            active={filter === 'sales'}
            onClick={() => setFilter('sales')}
            label="My Sales"
          />
          <FilterButton
            active={filter === 'active'}
            onClick={() => setFilter('active')}
            label="Active"
          />
          <FilterButton
            active={filter === 'completed'}
            onClick={() => setFilter('completed')}
            label="Completed"
          />
        </div>

        <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
          <FilterButton
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            label="All Statuses"
            size="sm"
          />
          <FilterButton
            active={statusFilter === 'payment_held'}
            onClick={() => setStatusFilter('payment_held')}
            label="In Escrow"
            size="sm"
          />
          <FilterButton
            active={statusFilter === 'completed'}
            onClick={() => setStatusFilter('completed')}
            label="Completed"
            size="sm"
          />
          <FilterButton
            active={statusFilter === 'refunded'}
            onClick={() => setStatusFilter('refunded')}
            label="Refunded"
            size="sm"
          />
          <FilterButton
            active={statusFilter === 'cancelled'}
            onClick={() => setStatusFilter('cancelled')}
            label="Cancelled"
            size="sm"
          />
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
          <p className="text-gray-600">
            {filter !== 'all'
              ? 'Try adjusting your filters to see more results'
              : 'You haven\'t made any transactions yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, subtext, color }: {
  icon: React.ReactNode
  label: string
  value: string
  subtext: string
  color: 'blue' | 'green' | 'amber' | 'gray'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    gray: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className={`inline-flex items-center justify-center p-2 rounded-lg ${colorClasses[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtext}</p>
    </div>
  )
}

function FilterButton({ active, onClick, label, size = 'md' }: {
  active: boolean
  onClick: () => void
  label: string
  size?: 'sm' | 'md'
}) {
  const sizeClasses = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2'

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses} rounded-lg font-medium transition-colors ${
        active
          ? 'bg-green-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

function TransactionCard({ transaction, currentUserId }: {
  transaction: Transaction
  currentUserId: string
}) {
  const isBuyer = transaction.buyer_id === currentUserId
  const role = isBuyer ? 'buyer' : 'seller'
  const otherParty = isBuyer ? transaction.seller : transaction.buyer

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
    payment_processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: Clock },
    payment_held: { label: 'In Escrow', color: 'bg-amber-100 text-amber-700', icon: Clock },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-700', icon: DollarSign },
    partially_refunded: { label: 'Partial Refund', color: 'bg-purple-100 text-purple-700', icon: DollarSign },
    disputed: { label: 'Disputed', color: 'bg-red-100 text-red-700', icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  }

  const status = statusConfig[transaction.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <Link href={`/transactions/${transaction.id}`}>
      <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900">{transaction.horses.name}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(transaction.created_at).toLocaleDateString()}
              </span>
              <span>•</span>
              <span>{isBuyer ? 'Purchased from' : 'Sold to'}: {otherParty.name || otherParty.email}</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(isBuyer ? transaction.final_price_cents : transaction.seller_receives_cents)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isBuyer ? 'Total Paid' : 'You Receive'}
            </p>
          </div>
        </div>

        {transaction.status === 'payment_held' && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
            <p className="font-medium text-amber-900 mb-1">
              {isBuyer ? 'Funds in Escrow' : 'Awaiting Payment Release'}
            </p>
            <p className="text-amber-700">
              {isBuyer
                ? 'Release funds when satisfied or wait for auto-release on '
                : 'Funds will be transferred on '}
              {new Date(transaction.escrow_release_date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}
