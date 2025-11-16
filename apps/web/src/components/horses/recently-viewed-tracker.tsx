'use client'

import { useEffect } from 'react'

interface RecentlyViewedTrackerProps {
  horseId: string
  horseName: string
  horseSlug: string
  horseImage?: string
  horsePrice: number
}

interface RecentlyViewedHorse {
  id: string
  name: string
  slug: string
  image?: string
  price: number
  viewedAt: string
}

const MAX_RECENT_HORSES = 10

export function RecentlyViewedTracker({
  horseId,
  horseName,
  horseSlug,
  horseImage,
  horsePrice,
}: RecentlyViewedTrackerProps) {
  useEffect(() => {
    const trackView = () => {
      try {
        const stored = localStorage.getItem('recently_viewed_horses')
        let recentlyViewed: RecentlyViewedHorse[] = stored ? JSON.parse(stored) : []

        // Remove if already exists
        recentlyViewed = recentlyViewed.filter(h => h.id !== horseId)

        // Add to front
        recentlyViewed.unshift({
          id: horseId,
          name: horseName,
          slug: horseSlug,
          image: horseImage,
          price: horsePrice,
          viewedAt: new Date().toISOString(),
        })

        // Keep only last MAX_RECENT_HORSES
        recentlyViewed = recentlyViewed.slice(0, MAX_RECENT_HORSES)

        localStorage.setItem('recently_viewed_horses', JSON.stringify(recentlyViewed))
      } catch (error) {
        console.error('Error tracking recently viewed horse:', error)
      }
    }

    trackView()
  }, [horseId, horseName, horseSlug, horseImage, horsePrice])

  return null
}

export function getRecentlyViewedHorses(): RecentlyViewedHorse[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem('recently_viewed_horses')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading recently viewed horses:', error)
    return []
  }
}
