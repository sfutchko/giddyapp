'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { MapPin, Calendar, Ruler, DollarSign, CheckCircle, Heart, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { CompareButton } from './compare-button'

interface Horse {
  id: string
  slug: string
  name: string
  breed: string
  age: number
  gender: string
  height: number
  color?: string
  price: number
  status: string
  location: any
  created_at: string
  farm_name?: string | null
  farm_logo_url?: string | null
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

interface HorseGridProps {
  horses: Horse[]
}

export function HorseGrid({ horses }: HorseGridProps) {
  const [watchedHorses, setWatchedHorses] = useState<Set<string>>(new Set())
  const [watchCounts, setWatchCounts] = useState<Record<string, number>>({})
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUserAndWatching = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch user's watched horses
        const { data: userWatched } = await supabase
          .from('favorites')
          .select('horse_id')
          .eq('user_id', user.id)

        if (userWatched) {
          setWatchedHorses(new Set(userWatched.map(f => f.horse_id)))
        }
      }

      // Fetch watch counts for all horses
      const horseIds = horses.map(h => h.id)
      const { data: counts } = await supabase
        .from('favorites')
        .select('horse_id')
        .in('horse_id', horseIds)

      if (counts) {
        const countMap = counts.reduce((acc, curr) => {
          acc[curr.horse_id] = (acc[curr.horse_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        setWatchCounts(countMap)
      }
    }

    fetchUserAndWatching()
  }, [horses, supabase])

  const toggleWatch = async (e: React.MouseEvent, horseId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast.error('Please login to watch horses')
      router.push('/login')
      return
    }

    const isWatched = watchedHorses.has(horseId)

    try {
      if (isWatched) {
        // Remove from watched
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('horse_id', horseId)

        if (!error) {
          setWatchedHorses(prev => {
            const newSet = new Set(prev)
            newSet.delete(horseId)
            return newSet
          })
          setWatchCounts(prev => ({
            ...prev,
            [horseId]: Math.max(0, (prev[horseId] || 0) - 1)
          }))
          toast.success('Removed from watchlist')
        }
      } else {
        // Add to watchlist
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            horse_id: horseId
          })

        if (!error) {
          setWatchedHorses(prev => new Set(prev).add(horseId))
          setWatchCounts(prev => ({
            ...prev,
            [horseId]: (prev[horseId] || 0) + 1
          }))
          toast.success('Added to watchlist!')
        }
      }
    } catch (error: any) {
      toast.error('Failed to update watchlist')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {horses.map((horse) => {
        const primaryImage = horse.horse_images?.find(img => img.is_primary)?.url ||
                            horse.horse_images?.[0]?.url
        const isWatched = watchedHorses.has(horse.id)
        const watchCount = watchCounts[horse.id] || 0

        // Check if horse is new (listed within last 7 days)
        const isNew = new Date(horse.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

        return (
          <div
            key={horse.id}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group relative"
          >
            {/* Image */}
            <div className="relative h-64 bg-gray-200">
              {primaryImage ? (
                <Image
                  src={primaryImage}
                  alt={horse.name}
                  fill
                  className={`object-cover transition-transform duration-300 ${
                    horse.status === 'SOLD' ? 'opacity-75' : 'group-hover:scale-105'
                  }`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-sm">No image available</span>
                </div>
              )}

              {/* Sold overlay */}
              {horse.status === 'SOLD' && (
                <div className="absolute inset-0 bg-black bg-opacity-40" />
              )}

              {/* Price Badge or SOLD Badge */}
              {horse.status === 'SOLD' ? (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-md font-bold">
                  SOLD
                </div>
              ) : (
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md">
                  <span className="text-green-600 font-bold text-lg">
                    ${horse.price.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Badges - Top Left */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {/* NEW Badge */}
                {isNew && (
                  <div className="bg-amber-500 text-white px-2.5 py-1 rounded-full shadow-md inline-flex items-center justify-center w-fit">
                    <span className="text-xs font-bold whitespace-nowrap">NEW</span>
                  </div>
                )}
                {/* Verified Seller Badge */}
                {horse.profiles?.is_verified_seller && (
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-semibold">Verified</span>
                  </div>
                )}
              </div>

              {/* Watch Button */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <CompareButton
                  horse={{
                    id: horse.id,
                    name: horse.name,
                    slug: horse.slug,
                    breed: horse.breed,
                    age: horse.age,
                    gender: horse.gender,
                    height: horse.height,
                    price: horse.price,
                    color: (horse as any).color || 'Unknown',
                    image: primaryImage,
                  }}
                  variant="icon"
                />
                <button
                  onClick={(e) => toggleWatch(e, horse.id)}
                  className={`p-2 rounded-full shadow-lg transition-all ${
                    isWatched
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white text-gray-600 hover:text-red-500 hover:bg-gray-50'
                }`}
                title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                <Heart className={`h-5 w-5 ${isWatched ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Watch Count */}
              {watchCount > 0 && (
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {watchCount} watching
                </div>
              )}
            </div>

            {/* Content - Wrapped in Link */}
            <Link href={`/horses/${horse.slug}`}>
              <div className="p-4">
                {/* Location - More Prominent */}
                <div className="flex items-center gap-1 text-gray-600 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{horse.location?.city}, {horse.location?.state}</span>
                </div>

                {/* Breed and Color */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{horse.breed}</h3>
                  {horse.color && (
                    <p className="text-sm text-gray-600">{horse.color} • {horse.gender}</p>
                  )}
                  {!horse.color && (
                    <p className="text-sm text-gray-600 capitalize">{horse.gender.toLowerCase()}</p>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {/* Age and Height */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{horse.age} years</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Ruler className="h-4 w-4" />
                      <span>{horse.height} hh</span>
                    </div>
                  </div>

                  {/* Farm or Seller info */}
                  {(horse.farm_name || horse.profiles) && (
                    <div className="pt-2 mt-2 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {horse.farm_logo_url && (
                          <div className="relative w-8 h-8 flex-shrink-0">
                            <Image
                              src={horse.farm_logo_url}
                              alt={horse.farm_name || 'Farm logo'}
                              fill
                              className="object-contain"
                              sizes="32px"
                            />
                          </div>
                        )}
                        <span className="text-sm text-gray-600">
                          {horse.farm_name || horse.profiles?.name || 'Private Seller'}
                        </span>
                      </div>
                      {horse.profiles?.is_verified_seller && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )
      })}
    </div>
  )
}