'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Check, X, Archive, Trash2 } from 'lucide-react'
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/actions/notifications'
import type { Notification } from '@/lib/actions/notifications'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const result = await getUnreadNotificationCount()
      if (result && 'count' in result) {
        setUnreadCount(result.count)
      }
    }

    fetchUnreadCount()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    console.log('🔔 Fetching notifications...')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('❌ Auth error:', authError)
      }

      if (!user) {
        console.log('❌ No user found')
        setLoading(false)
        return
      }

      console.log('👤 Fetching for user:', user.id)

      // Test if we can query at all
      const { data: testData, error: testError } = await supabase
        .from('notifications')
        .select('count', { count: 'exact', head: true })
        .eq('user_id', user.id)

      console.log('🧪 Test query - count:', testData, 'error:', testError)

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('❌ Error fetching notifications:', error)
      } else {
        console.log('✅ Fetched notifications:', data?.length, 'notifications')
        console.log('📋 Notifications data:', data)
        setNotifications(data as Notification[])
      }
    } catch (error) {
      console.error('❌ Exception fetching notifications:', error)
    }
    setLoading(false)
  }

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    await markNotificationAsRead(notificationId)

    // Update local state
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead()
    if ('success' in result) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    await deleteNotification(notificationId)

    // Update local state
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    const notification = notifications.find(n => n.id === notificationId)
    if (notification && !notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-4 w-4"
    switch (type) {
      case 'message':
        return <span className={iconClass}>💬</span>
      case 'offer':
      case 'offer_accepted':
      case 'offer_rejected':
      case 'offer_countered':
        return <span className={iconClass}>💰</span>
      case 'price_change':
        return <span className={iconClass}>📉</span>
      case 'viewing_request':
      case 'viewing_approved':
      case 'viewing_declined':
        return <span className={iconClass}>📅</span>
      case 'review':
        return <span className={iconClass}>⭐</span>
      case 'listing_sold':
        return <span className={iconClass}>🎉</span>
      default:
        return <Bell className={iconClass} />
    }
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <Link
                  href="/notifications"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  View all
                </Link>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                  <Bell className="h-12 w-12 mb-3 text-gray-400" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.action_url || '/notifications'}
                      onClick={() => {
                        if (!notification.is_read) {
                          markNotificationAsRead(notification.id, {} as React.MouseEvent)
                        }
                        setIsOpen(false)
                      }}
                      className={`block p-4 hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0 mt-1.5"></div>
                            )}
                          </div>

                          {/* Horse thumbnail if available */}
                          {notification.horse && notification.horse.horse_images?.[0] && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="relative w-12 h-12 rounded overflow-hidden">
                                <Image
                                  src={notification.horse.horse_images.find(img => img.is_primary)?.url || notification.horse.horse_images[0].url}
                                  alt={notification.horse.name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                              <div className="text-xs text-gray-500">
                                <p className="font-medium text-gray-700">{notification.horse.name}</p>
                                <p>${notification.horse.price.toLocaleString()}</p>
                              </div>
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            <div className="flex items-center gap-1">
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                                  className="p-1 text-gray-400 hover:text-green-600 rounded transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDelete(notification.id, e)}
                                className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <Link
                  href="/notifications"
                  className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
