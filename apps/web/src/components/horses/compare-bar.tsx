'use client'

import { useCompare } from '@/contexts/compare-context'
import { X, GitCompare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare()
  const router = useRouter()

  if (compareList.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-green-600 shadow-2xl z-50 animate-in slide-in-from-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-gray-900">
                Compare Horses ({compareList.length}/4)
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto max-w-2xl">
              {compareList.map((horse) => (
                <div
                  key={horse.id}
                  className="flex items-center gap-2 bg-gray-100 rounded-lg pl-3 pr-2 py-2 whitespace-nowrap"
                >
                  {horse.image && (
                    <img
                      src={horse.image}
                      alt={horse.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-900">{horse.name}</span>
                  <button
                    onClick={() => removeFromCompare(horse.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearCompare}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear All
            </button>
            <Link
              href="/compare"
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Compare Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
