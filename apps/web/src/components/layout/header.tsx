'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Menu, X, User as UserIcon, MessageSquare } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/notification-bell'

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingOffersCount, setPendingOffersCount] = useState(0)
  const supabase = createClient()

  // Function to refresh counts
  const refreshCounts = async (currentUser: User) => {
    // Fetch unread messages count
    const { data: unreadMessages, count } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, is_read, content', { count: 'exact' })
      .eq('recipient_id', currentUser.id)
      .eq('is_read', false)

    console.log('🔍 Unread messages for user:', currentUser.id)
    console.log('📊 Count:', count)
    console.log('📧 Messages:', unreadMessages)

    setUnreadCount(count || 0)

    // Fetch pending offers count (where user is either buyer or seller)
    const { count: pendingOffersCount } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .or(`seller_id.eq.${currentUser.id},buyer_id.eq.${currentUser.id}`)
      .eq('status', 'pending')

    setPendingOffersCount(pendingOffersCount || 0)
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await refreshCounts(user)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setUnreadCount(0)
        setPendingOffersCount(0)
      } else {
        refreshCounts(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Refresh counts when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        refreshCounts(user)
      }
    }

    const handleFocus = () => {
      if (user) {
        refreshCounts(user)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`unread_messages_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          // Double-check: only increment if this user is the recipient AND not the sender
          const newMessage = payload.new as any
          if (newMessage.recipient_id === user.id && newMessage.sender_id !== user.id) {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          // If message is marked as read, decrement count
          if (payload.new && (payload.new as any).is_read === true &&
              payload.old && (payload.old as any).is_read === false) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Subscribe to real-time offer updates
  useEffect(() => {
    if (!user) return

    const refreshOffers = async () => {
      // Refresh pending offers count (where user is either buyer or seller)
      const { count: pendingOffersCount } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .eq('status', 'pending')

      setPendingOffersCount(pendingOffersCount || 0)
    }

    const channel = supabase
      .channel(`offers_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `seller_id=eq.${user.id}`
        },
        refreshOffers
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `buyer_id=eq.${user.id}`
        },
        refreshOffers
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  return (
    <header className="bg-white shadow-sm border-b fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-green-600">
              GiddyApp
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/horses/map" className="text-gray-700 hover:text-green-600 transition-colors">
              Browse Horses
            </Link>
            <Link href="/how-it-works" className="text-gray-700 hover:text-green-600 transition-colors">
              How It Works
            </Link>
            {user ? (
              <>
                <Link href="/horses/new" className="text-gray-700 hover:text-green-600 transition-colors">
                  List a Horse
                </Link>
                <NotificationBell />
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <UserIcon className="h-4 w-4" />
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-green-600 transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-green-600"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="px-4 py-4 space-y-2">
            <Link
              href="/horses/map"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Browse Horses
            </Link>
            <Link
              href="/how-it-works"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>
            {user ? (
              <>
                <Link
                  href="/horses/new"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  List a Horse
                </Link>
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 bg-green-600 text-white rounded-lg text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 bg-green-600 text-white rounded-lg text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}