'use client'

import { useEffect, useState } from 'react'
import { getHorsePriceHistory } from '@/lib/actions/price-history'
import type { PriceHistoryEntry } from '@/lib/actions/price-history'
import { formatDistanceToNow } from 'date-fns'
import { TrendingDown, TrendingUp, Clock } from 'lucide-react'

interface PriceHistoryChartProps {
  horseId: string
}

export function PriceHistoryChart({ horseId }: PriceHistoryChartProps) {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const fetchHistory = async () => {
      const result = await getHorsePriceHistory(horseId, 20)
      if ('history' in result) {
        setHistory(result.history)
      }
      setLoading(false)
    }

    fetchHistory()
  }, [horseId])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return null
  }

  const displayHistory = showAll ? history : history.slice(0, 5)

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Price History
      </h3>

      <div className="space-y-3">
        {displayHistory.map((entry) => {
          const isPriceIncrease = entry.price_change > 0
          const changeColor = isPriceIncrease ? 'text-red-600' : 'text-green-600'
          const bgColor = isPriceIncrease ? 'bg-red-50' : 'bg-green-50'
          const Icon = isPriceIncrease ? TrendingUp : TrendingDown

          return (
            <div
              key={entry.id}
              className={`p-4 rounded-lg ${bgColor} flex items-start justify-between`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 ${changeColor}`} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-gray-900">
                      ${entry.new_price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      (was ${entry.old_price.toLocaleString()})
                    </span>
                  </div>
                  <div className={`text-sm font-medium ${changeColor} mt-1`}>
                    {isPriceIncrease ? '+' : ''}${Math.abs(entry.price_change).toLocaleString()} ({isPriceIncrease ? '+' : ''}{entry.price_change_percent}%)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {history.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
        >
          {showAll ? 'Show less' : `Show all ${history.length} price changes`}
        </button>
      )}
    </div>
  )
}
