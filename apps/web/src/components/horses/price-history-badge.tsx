'use client'

import { TrendingDown, TrendingUp, DollarSign } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getHorsePriceStats } from '@/lib/actions/price-history'

interface PriceHistoryBadgeProps {
  horseId: string
  currentPrice: number
}

export function PriceHistoryBadge({ horseId, currentPrice }: PriceHistoryBadgeProps) {
  const [stats, setStats] = useState<{
    lowest: number
    highest: number
    hasRecentDrop: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const result = await getHorsePriceStats(horseId)
      if ('stats' in result) {
        setStats({
          lowest: result.stats.lowest,
          highest: result.stats.highest,
          hasRecentDrop: result.stats.hasRecentDrop
        })
      }
      setLoading(false)
    }

    fetchStats()
  }, [horseId])

  if (loading || !stats) return null

  const savingsFromHighest = stats.highest - currentPrice
  const percentOff = ((savingsFromHighest / stats.highest) * 100).toFixed(0)
  const isAtLowest = currentPrice === stats.lowest
  const hasHistory = stats.lowest !== stats.highest

  if (!hasHistory) return null

  return (
    <div className="space-y-2">
      {/* Recent Price Drop Badge */}
      {stats.hasRecentDrop && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <TrendingDown className="h-4 w-4" />
          <span>Price Recently Reduced!</span>
        </div>
      )}

      {/* Lowest Price Badge */}
      {isAtLowest && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          <DollarSign className="h-4 w-4" />
          <span>Lowest Price Ever!</span>
        </div>
      )}

      {/* Savings Badge */}
      {savingsFromHighest > 0 && !isAtLowest && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
          <TrendingDown className="h-4 w-4" />
          <span>Save ${savingsFromHighest.toLocaleString()} ({percentOff}% off highest price)</span>
        </div>
      )}

      {/* Price Range Info */}
      <div className="text-sm text-gray-600">
        <p>Price range: ${stats.lowest.toLocaleString()} - ${stats.highest.toLocaleString()}</p>
      </div>
    </div>
  )
}
