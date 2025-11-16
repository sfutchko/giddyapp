'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ViewTrackerProps {
  horseId: string
}

export function ViewTracker({ horseId }: ViewTrackerProps) {
  useEffect(() => {
    const trackView = async () => {
      const supabase = createClient()

      const viewedKey = `viewed_horse_${horseId}`
      const hasViewed = sessionStorage.getItem(viewedKey)

      if (!hasViewed) {
        const { error } = await supabase.rpc('increment_horse_views', {
          horse_id: horseId
        })

        if (!error) {
          sessionStorage.setItem(viewedKey, 'true')
        }
      }
    }

    trackView()
  }, [horseId])

  return null
}
