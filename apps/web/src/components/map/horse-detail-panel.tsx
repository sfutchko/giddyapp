'use client'

import { X, Heart, MessageCircle, MapPin, Share2, ChevronLeft, ChevronRight, DollarSign, PlayCircle, Eye, Calendar, Ruler, Palette, Weight, Activity, Award, Stethoscope, FileText, ExternalLink, CheckCircle, Download, Star, Shield, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { RequestViewingButton } from '@/components/horses/request-viewing-button'
import { WatchButton } from '@/components/horses/watch-button'
import { MakeOfferModal } from '@/components/offers/make-offer-modal'
import { createClient } from '@/lib/supabase/client'
import { getUserReputation, getUserReviews } from '@/lib/actions/reviews'
import { getSimilarHorses } from '@/lib/actions/horses'
// Removed DocumentViewerModal import - feature incomplete

interface Horse {
  id: string
  name: string
  slug: string
  price: number
  location: string | { city?: string; state?: string; zipCode?: string; country?: string }
  latitude?: number
  longitude?: number
  breed?: string
  age?: number
  gender?: string
  height?: number
  weight?: number
  color?: string
  description?: string
  images?: Array<{ url: string; is_primary: boolean }>
  metadata?: {
    disciplines?: string[]
    temperament?: string
    healthStatus?: string
    registrations?: string
    competitionHistory?: string
    negotiable?: boolean
  }
  farm_name?: string
  farm_logo_url?: string
  view_count?: number
  created_at?: string
  horse_videos?: Array<{ id: string; url: string; title?: string }>
  horse_documents?: Array<{
    id: string
    url: string
    name: string
    type: string
    file_size?: number
  }>
  owner_id?: string
  seller_id?: string
  profiles?: {
    id: string
    name?: string | null
    full_name?: string | null
    email?: string
    phone?: string
    bio?: string | null
    is_verified_seller?: boolean
    location?: string | null
  } | null
}

interface HorseDetailPanelProps {
  horse: Horse | null
  onClose: () => void
  onHorseChange?: (horse: Horse) => void
}

export function HorseDetailPanel({ horse, onClose, onHorseChange }: HorseDetailPanelProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [existingOffer, setExistingOffer] = useState<{id: string; amount: number; status: string; created_at: string} | null>(null)
  const [existingViewingRequest, setExistingViewingRequest] = useState<any | null>(null)
  const [hasExistingConversation, setHasExistingConversation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showMakeOffer, setShowMakeOffer] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [sellerReputation, setSellerReputation] = useState<any>(null)
  const [sellerReviews, setSellerReviews] = useState<any[]>([])
  const [similarHorses, setSimilarHorses] = useState<any[]>([])
  const [similarHorsesType, setSimilarHorsesType] = useState<'breed' | 'nearby'>('breed')
  // Removed viewingDocument state - feature incomplete
  const videoRef = useRef<HTMLVideoElement>(null)
  const supabase = createClient()

  // Fetch existing offers, viewing requests, and conversations
  useEffect(() => {
    if (!horse) return

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Fetch existing offer
      const { data: offerData } = await supabase
        .from('offers')
        .select('id, offer_amount, status, created_at')
        .eq('horse_id', horse.id)
        .eq('buyer_id', user.id)
        .in('status', ['pending', 'countered'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (offerData) {
        setExistingOffer({
          id: offerData.id,
          amount: offerData.offer_amount,
          status: offerData.status,
          created_at: offerData.created_at
        })
      }

      // Fetch existing viewing request
      const { data: viewingData } = await supabase
        .from('viewing_requests')
        .select('*')
        .eq('horse_id', horse.id)
        .eq('requester_id', user.id)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setExistingViewingRequest(viewingData)

      // Check for existing conversation
      const sellerId = horse.seller_id || horse.owner_id
      if (sellerId) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('horse_id', horse.id)
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${sellerId}),and(sender_id.eq.${sellerId},recipient_id.eq.${user.id})`)
          .limit(1)

        setHasExistingConversation((count ?? 0) > 0)
      }

      setLoading(false)
    }

    fetchData()
  }, [horse, supabase])

  // Reset media index when horse changes
  useEffect(() => {
    setCurrentMediaIndex(0)
    setIsVideoPlaying(false)
  }, [horse?.id])

  // Fetch seller reputation and reviews
  useEffect(() => {
    if (!horse?.seller_id && !horse?.owner_id) return

    const fetchSellerData = async () => {
      const sellerId = horse.seller_id || horse.owner_id!

      const reputationResult = await getUserReputation(sellerId)
      if ('reputation' in reputationResult) {
        setSellerReputation(reputationResult.reputation)
      }

      const reviewsResult = await getUserReviews(sellerId, { limit: 3 })
      if ('reviews' in reviewsResult) {
        setSellerReviews(reviewsResult.reviews)
      }
    }

    fetchSellerData()
  }, [horse?.seller_id, horse?.owner_id])

  // Fetch similar horses (same breed) or nearby horses
  useEffect(() => {
    if (!horse?.id) return

    const fetchSimilar = async () => {
      console.log('🔍 Fetching similar/nearby horses for:', horse.name)

      // First try to get horses of the same breed
      if (horse.breed) {
        console.log('  - Trying same breed:', horse.breed)
        const result = await getSimilarHorses(horse.id, horse.breed, 4)
        if ('horses' in result && result.horses.length > 0) {
          console.log('  ✅ Found', result.horses.length, 'same breed horses')
          setSimilarHorses(result.horses)
          setSimilarHorsesType('breed')
          return
        }
        console.log('  - No same breed horses found')
      }

      // If no similar breed horses, get nearby horses
      if (horse.latitude && horse.longitude) {
        console.log('  - Trying nearby horses at:', horse.latitude, horse.longitude)
        const { data: nearbyHorses, error: nearbyError } = await supabase
          .from('horses')
          .select('id, name, slug, price, age, breed, latitude, longitude, status')
          .eq('status', 'active')
          .neq('id', horse.id)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(20)

        if (nearbyError) {
          console.error('  ❌ Error fetching nearby horses:', nearbyError)
        }

        console.log('  - Found', nearbyHorses?.length || 0, 'nearby horses')

        if (nearbyHorses && nearbyHorses.length > 0) {
          // Calculate distances and sort by proximity
          const horsesWithDistance = nearbyHorses.map(h => {
            const distance = Math.sqrt(
              Math.pow((h.latitude! - horse.latitude!) * 69, 2) +
              Math.pow((h.longitude! - horse.longitude!) * 69, 2)
            )
            return { ...h, distance }
          }).sort((a, b) => a.distance - b.distance).slice(0, 4)

          // Fetch images for nearby horses
          const horsesWithImages = await Promise.all(
            horsesWithDistance.map(async (h) => {
              const { data: images } = await supabase
                .from('horse_images')
                .select('url, is_primary')
                .eq('horse_id', h.id)
                .order('is_primary', { ascending: false })
                .limit(1)

              return {
                ...h,
                images: images || []
              }
            })
          )

          console.log('  ✅ Setting', horsesWithImages.length, 'nearby horses')
          setSimilarHorses(horsesWithImages)
          setSimilarHorsesType('nearby')
        }
      } else {
        console.log('  ❌ Horse has no lat/lng, cannot find nearby')
      }
    }

    fetchSimilar()
  }, [horse?.id, horse?.breed, horse?.latitude, horse?.longitude, supabase])

  // Track view count
  useEffect(() => {
    if (!horse?.id) return

    const trackView = async () => {
      console.log('📊 Attempting to increment view count for:', horse.id)
      try {
        const { data, error } = await supabase.rpc('increment_horse_views', { horse_id: horse.id })
        if (error) {
          console.error('  ❌ Error incrementing views:', error)
        } else {
          console.log('  ✅ View count incremented successfully')
        }
      } catch (error) {
        console.error('  ❌ Exception tracking view:', error)
      }
    }

    trackView()
  }, [horse?.id, supabase])

  if (!horse) return null

  // Support both 'images' and 'horse_images' field names
  const images = ((horse.images || (horse as any).horse_images) || [])
  const videos = horse.horse_videos || []

  // Combine images and videos into a single media array
  const allMedia = [
    ...videos.map(v => ({ type: 'video' as const, ...v })),
    ...images.map(img => ({ type: 'image' as const, ...img }))
  ]

  const currentMedia = allMedia[currentMediaIndex]

  // Format location string
  let locationString = ''
  if (typeof horse.location === 'string') {
    locationString = horse.location
  } else if (horse.location) {
    locationString = `${horse.location.city || ''}, ${horse.location.state || ''} ${horse.location.zipCode || ''}`.trim()
  }

  // Calculate days on market
  const daysOnMarket = horse.created_at
    ? Math.floor((Date.now() - new Date(horse.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Debug logging
  console.log('🐴 Horse data for:', horse.name)
  console.log('  - seller_id:', horse.seller_id)
  console.log('  - metadata:', horse.metadata)
  console.log('  - view_count:', horse.view_count)
  console.log('  - profiles:', horse.profiles)

  const nextMedia = () => {
    if (allMedia.length > 1) {
      setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length)
      setIsVideoPlaying(false)
    }
  }

  const prevMedia = () => {
    if (allMedia.length > 1) {
      setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length)
      setIsVideoPlaying(false)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/horses/${horse.slug}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: horse.name,
          text: `Check out ${horse.name} on GiddyApp`,
          url: url,
        })
      } catch (err) {
        console.log('Share cancelled or failed')
      }
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <>
      {/* Backdrop - Zillow style dark backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] animate-fade-in"
        onClick={onClose}
      />

      {/* Large Centered Modal Overlay - Zillow Style */}
      <div className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1400px] max-h-[95vh] pointer-events-auto animate-scale-in overflow-hidden flex flex-col">

          {/* Header with Close Button */}
          <div className="flex-shrink-0 absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="p-3 bg-white/95 hover:bg-white rounded-full transition-all shadow-lg backdrop-blur-sm"
            >
              <X className="h-6 w-6 text-stone-700" />
            </button>
          </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Media Gallery Section - HUGE like Zillow */}
          <div className="relative h-[400px] md:h-[600px] lg:h-[700px] bg-stone-900">
            {currentMedia ? (
              currentMedia.type === 'video' ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={currentMedia.url}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                  />
                  {currentMedia.title && (
                    <div className="absolute bottom-3 left-3 right-3 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 rounded-lg">
                      <p className="text-white text-sm font-medium">{currentMedia.title}</p>
                    </div>
                  )}
                </div>
              ) : (
                <Image
                  src={currentMedia.url}
                  alt={horse.name}
                  fill
                  className="object-cover"
                  sizes="540px"
                  priority
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-stone-400">No media available</div>
              </div>
            )}

            {/* Navigation Arrows */}
            {allMedia.length > 1 && (
              <>
                <button
                  onClick={prevMedia}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/95 hover:bg-white rounded-full shadow-lg transition-all"
                >
                  <ChevronLeft className="h-5 w-5 text-stone-800" />
                </button>
                <button
                  onClick={nextMedia}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/95 hover:bg-white rounded-full shadow-lg transition-all"
                >
                  <ChevronRight className="h-5 w-5 text-stone-800" />
                </button>
              </>
            )}

            {/* Media Counter */}
            {allMedia.length > 0 && (
              <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                {currentMediaIndex + 1} / {allMedia.length}
              </div>
            )}

            {/* Video/Photo Indicator */}
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs font-medium flex items-center gap-1.5">
              {currentMedia?.type === 'video' ? (
                <>
                  <PlayCircle className="h-3.5 w-3.5" />
                  Video
                </>
              ) : (
                <>Photo</>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {allMedia.length > 1 && (
            <div className="px-4 py-3 border-b border-stone-200 bg-stone-50">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {allMedia.map((media, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentMediaIndex(idx)
                      setIsVideoPlaying(false)
                    }}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      currentMediaIndex === idx ? 'border-emerald-600 shadow-md' : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <>
                        <video src={media.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <PlayCircle className="h-5 w-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <Image
                        src={media.url}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content - Two Column Layout like Zillow */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">

            {/* Left Column - Main Details (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Price & Title */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    ${horse.price.toLocaleString()}
                  </div>
                  {horse.metadata?.negotiable && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-lg">
                      <CheckCircle className="h-4 w-4" />
                      Negotiable
                    </div>
                  )}
                </div>

                <h1 className="text-4xl font-bold text-stone-900 mb-3">{horse.name}</h1>

                {/* Location */}
                {locationString && (
                  <div className="flex items-center gap-2 text-stone-600 text-lg">
                    <MapPin className="h-5 w-5" />
                    <span>{locationString}</span>
                  </div>
                )}
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-stone-200">
                {horse.breed && (
                  <div>
                    <div className="text-sm text-stone-500 mb-1">Breed</div>
                    <div className="text-xl font-bold text-stone-900">{horse.breed}</div>
                  </div>
                )}
                {horse.age !== undefined && (
                  <div>
                    <div className="text-sm text-stone-500 mb-1">Age</div>
                    <div className="text-xl font-bold text-stone-900">{horse.age} years</div>
                  </div>
                )}
                {horse.gender && (
                  <div>
                    <div className="text-sm text-stone-500 mb-1">Gender</div>
                    <div className="text-xl font-bold text-stone-900 capitalize">{horse.gender.toLowerCase()}</div>
                  </div>
                )}
                {horse.height && (
                  <div>
                    <div className="text-sm text-stone-500 mb-1">Height</div>
                    <div className="text-xl font-bold text-stone-900">{horse.height} hh</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {horse.description && (
                <div>
                  <h3 className="text-2xl font-bold text-stone-900 mb-4">About {horse.name}</h3>
                  <p className="text-stone-700 text-lg leading-relaxed whitespace-pre-line">
                    {horse.description}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Action Buttons Sidebar (1/3 width) */}
            <div className="lg:col-span-1 space-y-4">
              {/* Primary Action Buttons */}
              {!loading && (
                <div className="space-y-3">
                  <RequestViewingButton
                    horseId={horse.id}
                    horseName={horse.name}
                    sellerId={horse.seller_id || horse.owner_id || ''}
                    className="w-full justify-center text-base py-4 font-bold shadow-lg"
                    existingRequest={existingViewingRequest}
                  />

                  {hasExistingConversation ? (
                    <Link
                      href="/messages"
                      className="w-full px-6 py-4 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-900 transition-all flex items-center justify-center gap-2 shadow-lg text-base"
                    >
                      <MessageCircle className="h-5 w-5" />
                      View Messages
                    </Link>
                  ) : existingOffer ? (
                    <Link
                      href="/offers"
                      className="w-full px-6 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl hover:from-amber-500 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <DollarSign className="h-5 w-5" />
                      <span className="truncate">
                        {existingOffer.status === 'pending' && 'Offer Pending'}
                        {existingOffer.status === 'countered' && 'Counter Received'}
                        {' - $'}{existingOffer.amount.toLocaleString()}
                      </span>
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowMakeOffer(true)}
                        className="w-full px-4 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                      >
                        <DollarSign className="h-5 w-5" />
                        Make Offer
                      </button>
                      <Link
                        href={`/messages?horse=${horse.slug}`}
                        className="w-full px-4 py-4 bg-white border-2 border-stone-300 text-stone-700 font-bold rounded-xl hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="h-5 w-5" />
                        Contact Seller
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Secondary Actions */}
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <WatchButton
                    horseId={horse.id}
                    horseName={horse.name}
                    showCount={false}
                    variant="button"
                    className=""
                  />
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  >
                    <Share2 className="h-5 w-5" />
                    Share
                  </button>
                </div>

                <Link
                  href={`/horses/${horse.slug}`}
                  className="w-full px-4 py-3 border-2 border-emerald-200 bg-white text-center rounded-xl hover:bg-emerald-50 hover:border-emerald-400 transition-all flex items-center justify-center gap-2 font-semibold text-emerald-700"
                >
                  View Full Details
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              {/* Seller Information */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-stone-600" />
                  Seller
                </h3>

                {horse.profiles ? (
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-stone-900 flex items-center gap-2">
                        {horse.profiles.name || horse.profiles.full_name || 'Private Seller'}
                        {horse.profiles.is_verified_seller && (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                      {horse.profiles.location && (
                        <div className="text-sm text-stone-600 mt-1">
                          {horse.profiles.location}
                        </div>
                      )}
                    </div>

                    {horse.profiles.bio && (
                      <p className="text-sm text-stone-600 line-clamp-2">{horse.profiles.bio}</p>
                    )}

                    {sellerReputation && sellerReputation.total_reviews > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.round(sellerReputation.average_rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-stone-600">
                          {sellerReputation.total_reviews} reviews
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-stone-600">
                    Contact seller for more information
                  </div>
                )}

                {(horse.farm_name || horse.farm_logo_url) && (
                  <div className="mt-3 pt-3 border-t border-stone-200">
                    <div className="flex items-center gap-2">
                      {horse.farm_logo_url && (
                        <div className="relative w-8 h-8 rounded overflow-hidden bg-white border border-stone-200 flex-shrink-0">
                          <Image
                            src={horse.farm_logo_url}
                            alt={horse.farm_name || 'Farm logo'}
                            fill
                            className="object-contain p-1"
                            sizes="32px"
                          />
                        </div>
                      )}
                      {horse.farm_name && (
                        <div className="text-sm font-medium text-stone-700">{horse.farm_name}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Key Details Grid - COMPACT */}
          <div className="px-6 py-4 border-b border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-3">Key Details</h3>
            <div className="grid grid-cols-2 gap-3">
              {horse.breed && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded">
                    <Activity className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500">Breed</div>
                    <div className="text-sm font-semibold text-stone-900">{horse.breed}</div>
                  </div>
                </div>
              )}
              {horse.age && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500">Age</div>
                    <div className="text-sm font-semibold text-stone-900">{horse.age} years</div>
                  </div>
                </div>
              )}
              {horse.height && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-50 rounded">
                    <Ruler className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500">Height</div>
                    <div className="text-sm font-semibold text-stone-900">{horse.height} hands</div>
                  </div>
                </div>
              )}
              {horse.color && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 rounded">
                    <Palette className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500">Color</div>
                    <div className="text-sm font-semibold text-stone-900">{horse.color}</div>
                  </div>
                </div>
              )}
              {horse.weight && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 rounded">
                    <Weight className="h-4 w-4 text-rose-600" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500">Weight</div>
                    <div className="text-sm font-semibold text-stone-900">{horse.weight} lbs</div>
                  </div>
                </div>
              )}
              {horse.metadata?.temperament && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-50 rounded">
                    <Heart className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500">Temperament</div>
                    <div className="text-sm font-semibold text-stone-900">{horse.metadata.temperament}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Disciplines */}
          {horse.metadata?.disciplines && horse.metadata.disciplines.length > 0 && (
            <div className="px-6 py-4 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-3">Disciplines</h3>
              <div className="flex flex-wrap gap-2">
                {horse.metadata.disciplines.map((discipline) => (
                  <span
                    key={discipline}
                    className="px-3 py-1.5 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 rounded-lg font-semibold text-sm border border-emerald-200"
                  >
                    {discipline}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Health & Registration */}
          {(horse.metadata?.healthStatus || horse.metadata?.registrations) && (
            <div className="px-6 py-4 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-3">Health & Registration</h3>
              <div className="space-y-2">
                {horse.metadata.healthStatus && (
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="text-xs text-stone-500">Health: </span>
                      <span className="text-sm text-stone-900">{horse.metadata.healthStatus}</span>
                    </div>
                  </div>
                )}
                {horse.metadata.registrations && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="text-xs text-stone-500">Registered: </span>
                      <span className="text-sm text-stone-900">{horse.metadata.registrations}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Competition History */}
          {(horse.competition_experience || horse.metadata?.competitionHistory) && (
            <div className="px-6 py-4 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-2">Competition History</h3>
              <div className="flex items-start gap-2">
                <Award className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-stone-700 whitespace-pre-line">{horse.competition_experience || horse.metadata?.competitionHistory}</p>
              </div>
            </div>
          )}

          {/* Documents & Records */}
          {horse.horse_documents && horse.horse_documents.length > 0 && (
            <div className="px-6 py-4 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-3">Documents & Records</h3>
              <div className="space-y-2">
                {horse.horse_documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setViewingDocument(doc)}
                    className="w-full flex items-center gap-3 p-3 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors group text-left"
                  >
                    <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                      <FileText className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-stone-900 truncate">{doc.name}</div>
                      {doc.file_size && (
                        <div className="text-xs text-stone-500">
                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seller Reviews */}
          {sellerReputation && sellerReputation.total_reviews > 0 && (
            <div className="px-6 py-5 border-b border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-stone-900">Seller Reviews</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(sellerReputation.average_rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-stone-700">
                    {sellerReputation.average_rating.toFixed(1)} ({sellerReputation.total_reviews})
                  </span>
                </div>
              </div>

              {sellerReviews.length > 0 && (
                <div className="space-y-3">
                  {sellerReviews.map((review: any) => (
                    <div key={review.id} className="p-3 bg-stone-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-stone-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && (
                        <div className="font-medium text-stone-900 text-sm mb-1">{review.title}</div>
                      )}
                      {review.review_text && (
                        <p className="text-sm text-stone-600 line-clamp-2">{review.review_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Similar Horses or Nearby Horses */}
          {similarHorses.length > 0 && (
            <div className="px-6 py-5 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">
                {similarHorsesType === 'breed'
                  ? `Similar ${horse.breed || 'Horses'}`
                  : 'Nearby Horses'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {similarHorses.map((similar: any) => {
                  // Support both 'images' and 'horse_images' field names
                  const primaryImage = similar.images?.[0] || similar.horse_images?.find((img: any) => img.is_primary) || similar.horse_images?.[0]

                  console.log('Similar horse:', similar.name, 'images:', similar.images, 'horse_images:', similar.horse_images, 'primaryImage:', primaryImage)

                  return (
                    <button
                      key={similar.id}
                      onClick={() => onHorseChange?.(similar as Horse)}
                      className="text-left group"
                    >
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-stone-100">
                        {primaryImage?.url ? (
                          <Image
                            src={primaryImage.url}
                            alt={similar.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="200px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            No image
                          </div>
                        )}
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-xs font-bold">
                        ${similar.price.toLocaleString()}
                      </div>
                      {similarHorsesType === 'nearby' && similar.distance && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-600/90 backdrop-blur-sm rounded text-white text-xs font-bold">
                          {similar.distance < 1 ? '< 1 mi' : `${Math.round(similar.distance)} mi`}
                        </div>
                      )}
                    </div>
                    <div className="font-medium text-stone-900 text-sm truncate group-hover:text-emerald-600 transition-colors">
                      {similar.name}
                    </div>
                      <div className="text-xs text-stone-500">
                        {similar.age} yrs • {similar.breed}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Safety Tips */}
          <div className="px-6 py-5 border-b border-stone-200 bg-amber-50/50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Shield className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 mb-2">Safety Tips</h3>
                <ul className="text-sm text-stone-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Always arrange to see the horse in person before committing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Get a pre-purchase veterinary exam</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Never send money before seeing the horse</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Listing Stats */}
          <div className="px-6 py-4 bg-stone-50">
            <div className="flex items-center gap-5 text-sm text-stone-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span><span className="font-semibold text-stone-900">{daysOnMarket}</span> day{daysOnMarket !== 1 ? 's' : ''} on market</span>
              </div>
              <div className="h-4 w-px bg-stone-300" />
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span><span className="font-semibold text-stone-900">{horse.view_count || 0}</span> view{horse.view_count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Make Offer Modal */}
      <MakeOfferModal
        isOpen={showMakeOffer}
        onClose={() => setShowMakeOffer(false)}
        horseId={horse.id}
        horseName={horse.name}
        horsePrice={horse.price}
        sellerId={horse.seller_id || horse.owner_id || ''}
      />

      {/* Document Viewer Modal - Removed (feature incomplete) */}

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  )
}
