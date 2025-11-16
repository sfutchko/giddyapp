'use client'

import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import {
  Heart,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Bell,
  BellOff,
  TrendingDown,
  TrendingUp,
  Home,
  Filter,
  X
} from 'lucide-react'

interface Horse {
  id: string
  slug: string
  name: string
  breed: string
  age: number
  gender: string
  height: number
  price: number
  status: string
  location: any
  created_at: string
  watched_at?: string
  horse_images?: Array<{
    url: string
    is_primary: boolean
  }>
  profiles?: {
    id: string
    name?: string | null
    full_name?: string | null
    is_verified_seller?: boolean
  }
}

interface WatchlistContentProps {
  user: User
  horses: Horse[]
  watchCounts: Record<string, number>
}

export function WatchlistContent({ user, horses: initialHorses, watchCounts }: WatchlistContentProps) {
  const [horses, setHorses] = useState(initialHorses)
  const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all')
  const [notifications, setNotifications] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const removeFromWatchlist = async (horseId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('horse_id', horseId)

      if (!error) {
        setHorses(horses.filter(h => h.id !== horseId))
        toast.success('Removed from watchlist')
      }
    } catch (error) {
      toast.error('Failed to remove from watchlist')
    }
  }

  const toggleNotifications = (horseId: string) => {
    setNotifications(prev => {
      const newSet = new Set(prev)
      if (newSet.has(horseId)) {
        newSet.delete(horseId)
        toast.success('Price notifications disabled')
      } else {
        newSet.add(horseId)
        toast.success('Price notifications enabled')
      }
      return newSet
    })
  }

  const filteredHorses = horses.filter(horse => {
    if (filter === 'available') return horse.status === 'ACTIVE'
    if (filter === 'sold') return horse.status === 'SOLD'
    return true
  })

  const getPrimaryImage = (images?: { url: string; is_primary: boolean }[]) => {
    return images?.find(img => img.is_primary)?.url || images?.[0]?.url
  }

  const getDaysWatched = (watchedAt?: string) => {
    if (!watchedAt) return 0
    const watched = new Date(watchedAt)
    const now = new Date()
    const days = Math.floor((now.getTime() - watched.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-green-600">
                GiddyApp
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <Home className="h-5 w-5" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            Watching
          </h1>
          <p className="text-gray-600 mt-2">
            Track horses you're watching and get notified of price changes
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({horses.length})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'available'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Available ({horses.filter(h => h.status === 'ACTIVE').length})
            </button>
            <button
              onClick={() => setFilter('sold')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'sold'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sold ({horses.filter(h => h.status === 'SOLD').length})
            </button>
          </div>
        </div>

        {/* Watched Horses */}
        {filteredHorses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No horses in your watchlist' : `No ${filter} horses`}
            </h2>
            <p className="text-gray-600 mb-6">
              Start watching horses to track price changes and availability
            </p>
            <Link
              href="/horses/map"
              className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Horses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHorses.map((horse) => {
              const primaryImage = getPrimaryImage(horse.horse_images)
              const watchCount = watchCounts[horse.id] || 0
              const daysWatched = getDaysWatched(horse.watched_at)
              const hasNotifications = notifications.has(horse.id)

              return (
                <div
                  key={horse.id}
                  className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden ${
                    horse.status === 'SOLD' ? 'opacity-75' : ''
                  }`}
                >
                  {/* Image */}
                  <Link href={`/horses/${horse.slug}`}>
                    <div className="relative h-48 bg-gray-200">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={horse.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-sm">No image available</span>
                        </div>
                      )}

                      {/* Status Badge */}
                      {horse.status === 'SOLD' ? (
                        <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          SOLD
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full shadow-md">
                          <span className="text-green-600 font-bold">
                            ${horse.price.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Watch Stats */}
                      <div className="absolute bottom-2 left-2 flex gap-2">
                        <div className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {watchCount} watching
                        </div>
                        <div className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {daysWatched}d ago
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-4">
                    <Link href={`/horses/${horse.slug}`}>
                      <h3 className="text-lg font-bold text-gray-900 hover:text-green-600 transition-colors">
                        {horse.name}
                      </h3>
                    </Link>

                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>{horse.breed}</span>
                        <span>{horse.age}yo • {horse.height}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{horse.location?.city}, {horse.location?.state}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <button
                        onClick={() => toggleNotifications(horse.id)}
                        className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1 ${
                          hasNotifications
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={hasNotifications ? 'Disable price alerts' : 'Enable price alerts'}
                      >
                        {hasNotifications ? (
                          <>
                            <Bell className="h-4 w-4" />
                            Alerts On
                          </>
                        ) : (
                          <>
                            <BellOff className="h-4 w-4" />
                            Alerts Off
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => removeFromWatchlist(horse.id)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm hover:bg-red-200 transition-colors flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info Box */}
        {horses.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Watching Benefits
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Get notified when prices change on watched horses</li>
              <li>• Track when horses become available or sold</li>
              <li>• Quickly access your interested horses from one place</li>
              <li>• See how many others are watching the same horses</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}