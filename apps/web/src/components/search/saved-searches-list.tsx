'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Bell, BellOff, Trash2, Calendar, ChevronRight } from 'lucide-react'
import { SavedSearch, deleteSavedSearch, updateSavedSearch } from '@/lib/actions/saved-searches'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface SavedSearchesListProps {
  searches: SavedSearch[]
}

export function SavedSearchesList({ searches: initialSearches }: SavedSearchesListProps) {
  const router = useRouter()
  const [searches, setSearches] = useState(initialSearches)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) {
      return
    }

    setDeletingId(id)
    const result = await deleteSavedSearch(id)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Search deleted')
      setSearches(searches.filter(s => s.id !== id))
    }

    setDeletingId(null)
  }

  const toggleNotification = async (search: SavedSearch) => {
    const result = await updateSavedSearch(
      search.id,
      search.name,
      search.filters,
      !search.notify_on_match
    )

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success(search.notify_on_match ? 'Notifications disabled' : 'Notifications enabled')
      setSearches(searches.map(s =>
        s.id === search.id ? { ...s, notify_on_match: !s.notify_on_match } : s
      ))
    }
  }

  const buildSearchUrl = (filters: any) => {
    const params = new URLSearchParams()

    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString())
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString())
    if (filters.breed) params.set('breed', filters.breed)
    if (filters.minAge) params.set('minAge', filters.minAge.toString())
    if (filters.maxAge) params.set('maxAge', filters.maxAge.toString())
    if (filters.minHeight) params.set('minHeight', filters.minHeight.toString())
    if (filters.maxHeight) params.set('maxHeight', filters.maxHeight.toString())
    if (filters.gender) params.set('gender', filters.gender)
    if (filters.color) params.set('color', filters.color)
    if (filters.disciplines && filters.disciplines.length > 0) {
      params.set('disciplines', filters.disciplines.join(','))
    }
    if (filters.state) params.set('state', filters.state)
    if (filters.sortBy) params.set('sortBy', filters.sortBy)

    return `/horses?${params.toString()}`
  }

  const formatFilterSummary = (filters: any): string => {
    const parts: string[] = []

    if (filters.breed) parts.push(filters.breed)
    if (filters.minPrice || filters.maxPrice) {
      const priceRange = []
      if (filters.minPrice) priceRange.push(`$${filters.minPrice.toLocaleString()}+`)
      if (filters.maxPrice) priceRange.push(`up to $${filters.maxPrice.toLocaleString()}`)
      parts.push(priceRange.join(' '))
    }
    if (filters.minAge || filters.maxAge) {
      const ageRange = []
      if (filters.minAge) ageRange.push(`${filters.minAge}+`)
      if (filters.maxAge) ageRange.push(`up to ${filters.maxAge}`)
      parts.push(ageRange.join(' ') + ' years')
    }
    if (filters.gender) parts.push(filters.gender.toLowerCase())
    if (filters.state) parts.push(filters.state)
    if (filters.disciplines && filters.disciplines.length > 0) {
      parts.push(filters.disciplines.join(', '))
    }

    return parts.length > 0 ? parts.join(' • ') : 'All horses'
  }

  if (searches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No saved searches yet
        </h3>
        <p className="text-gray-600 mb-6">
          Save your search criteria to quickly find horses that match what you're looking for
        </p>
        <Link
          href="/horses/map"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          <Search className="h-5 w-5" />
          Browse Horses
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {searches.map((search) => (
        <div
          key={search.id}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-gray-900">{search.name}</h3>
                {search.notify_on_match && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    <Bell className="h-3 w-3" />
                    Alerts On
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {formatFilterSummary(search.filters)}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Saved {new Date(search.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => toggleNotification(search)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={search.notify_on_match ? 'Disable notifications' : 'Enable notifications'}
              >
                {search.notify_on_match ? (
                  <BellOff className="h-5 w-5 text-gray-600" />
                ) : (
                  <Bell className="h-5 w-5 text-gray-400" />
                )}
              </button>

              <button
                onClick={() => handleDelete(search.id)}
                disabled={deletingId === search.id}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete search"
              >
                <Trash2 className="h-5 w-5 text-red-600" />
              </button>

              <Link
                href={buildSearchUrl(search.filters)}
                className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                View Results
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
