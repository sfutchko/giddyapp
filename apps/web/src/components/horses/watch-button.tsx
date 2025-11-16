'use client'

import { useState, useEffect } from 'react'
import { Heart, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface WatchButtonProps {
  horseId: string
  horseName: string
  className?: string
  showCount?: boolean
  iconClassName?: string
  variant?: 'button' | 'icon-only'
}

export function WatchButton({ horseId, horseName, className = '', showCount = true, iconClassName = 'h-5 w-5', variant = 'button' }: WatchButtonProps) {
  const [isWatched, setIsWatched] = useState(false)
  const [watchCount, setWatchCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchWatchStatus = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Fetch watch count
      const { count } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('horse_id', horseId)

      setWatchCount(count || 0)

      // Check if current user is watching
      if (user) {
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('horse_id', horseId)
          .maybeSingle()

        setIsWatched(!!data)
      }

      setLoading(false)
    }

    fetchWatchStatus()
  }, [horseId, supabase])

  const toggleWatch = async () => {
    if (!user) {
      toast.error('Please login to watch horses')
      router.push('/login')
      return
    }

    setLoading(true)

    try {
      if (isWatched) {
        // Remove from watchlist
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('horse_id', horseId)

        if (!error) {
          setIsWatched(false)
          setWatchCount(prev => Math.max(0, prev - 1))
          toast.success(`${horseName} removed from watchlist`)
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
          setIsWatched(true)
          setWatchCount(prev => prev + 1)
          toast.success(`${horseName} added to watchlist!`)
        }
      }
    } catch (error) {
      toast.error('Failed to update watchlist')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'icon-only') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={toggleWatch}
          disabled={loading}
          className="group relative"
          title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Heart className={`${iconClassName} ${isWatched ? 'fill-rose-500 text-rose-500' : 'text-stone-700'} transition-all group-hover:scale-110`} />
        </button>
        {showCount && watchCount > 0 && (
          <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {watchCount}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={toggleWatch}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
          isWatched
            ? 'bg-rose-50 border-2 border-rose-400 text-rose-700 hover:bg-rose-100'
            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        <Heart className={`${iconClassName} ${isWatched ? 'fill-current' : ''}`} />
        {isWatched ? 'Watching' : 'Watch'}
      </button>

      {showCount && watchCount > 0 && (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Eye className="h-4 w-4" />
          <span>{watchCount} watching</span>
        </div>
      )}
    </div>
  )
}