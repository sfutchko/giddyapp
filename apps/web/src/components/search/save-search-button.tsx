'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Bookmark, X } from 'lucide-react'
import { createSavedSearch } from '@/lib/actions/saved-searches'
import { HorseFilters } from '@/lib/actions/horses'
import { toast } from 'sonner'

export function SaveSearchButton() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [notifyOnMatch, setNotifyOnMatch] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const hasFilters = Array.from(searchParams.keys()).length > 0

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for this search')
      return
    }

    setIsSaving(true)

    // Build filters object from URL params
    const filters: HorseFilters = {}

    if (searchParams.get('minPrice')) filters.minPrice = Number(searchParams.get('minPrice'))
    if (searchParams.get('maxPrice')) filters.maxPrice = Number(searchParams.get('maxPrice'))
    if (searchParams.get('breed')) filters.breed = searchParams.get('breed') || undefined
    if (searchParams.get('minAge')) filters.minAge = Number(searchParams.get('minAge'))
    if (searchParams.get('maxAge')) filters.maxAge = Number(searchParams.get('maxAge'))
    if (searchParams.get('minHeight')) filters.minHeight = Number(searchParams.get('minHeight'))
    if (searchParams.get('maxHeight')) filters.maxHeight = Number(searchParams.get('maxHeight'))
    if (searchParams.get('gender')) filters.gender = searchParams.get('gender') || undefined
    if (searchParams.get('color')) filters.color = searchParams.get('color') || undefined
    if (searchParams.get('disciplines')) filters.disciplines = searchParams.get('disciplines')?.split(',').filter(Boolean)
    if (searchParams.get('state')) filters.state = searchParams.get('state') || undefined
    if (searchParams.get('sortBy')) filters.sortBy = searchParams.get('sortBy') as any

    const result = await createSavedSearch(name, filters, notifyOnMatch)

    setIsSaving(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Search saved successfully!')
      setIsOpen(false)
      setName('')
      setNotifyOnMatch(false)
    }
  }

  if (!hasFilters) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        <Bookmark className="h-4 w-4" />
        Save Search
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Save Search</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Dressage Horses Under $20k"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notify"
                    checked={notifyOnMatch}
                    onChange={(e) => setNotifyOnMatch(e.target.checked)}
                    className="mr-2 text-green-600 focus:ring-green-500 rounded"
                  />
                  <label htmlFor="notify" className="text-sm text-gray-700">
                    Notify me when new horses match this search
                  </label>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-2">Current filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(searchParams.entries()).map(([key, value]) => (
                      <span key={key} className="inline-flex items-center px-2 py-1 bg-white rounded text-xs">
                        <span className="font-medium">{key}:</span>
                        <span className="ml-1 text-gray-600">{value}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Search'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
