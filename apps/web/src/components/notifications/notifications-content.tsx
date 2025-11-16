'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, Check, Trash2, Settings, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Notification, NotificationType } from '@/lib/actions/notifications'
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/actions/notifications'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface NotificationsContentProps {
  initialNotifications: Notification[]
}

export function NotificationsContent({ initialNotifications }: NotificationsContentProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const router = useRouter()

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.is_read) return false
    if (typeFilter !== 'all' && n.type !== typeFilter) return false
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId)
    if ('success' in result) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      toast.success('Marked as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead()
    if ('success' in result) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success(`Marked ${result.count} notifications as read`)
    }
  }

  const handleDelete = async (notificationId: string) => {
    const result = await deleteNotification(notificationId)
    if ('success' in result) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      toast.success('Notification deleted')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <span className="text-xl">💬</span>
      case 'offer':
      case 'offer_accepted':
      case 'offer_rejected':
      case 'offer_countered':
        return <span className="text-xl">💰</span>
      case 'price_change':
        return <span className="text-xl">📉</span>
      case 'viewing_request':
      case 'viewing_approved':
      case 'viewing_declined':
        return <span className="text-xl">📅</span>
      case 'review':
        return <span className="text-xl">⭐</span>
      case 'listing_sold':
        return <span className="text-xl">🎉</span>
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
              </p>
            </div>
            <Link
              href="/notifications/preferences"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="hidden sm:inline">Preferences</span>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <option value="all">All Types</option>
              <option value="message">Messages</option>
              <option value="offer">Offers</option>
              <option value="price_change">Price Changes</option>
              <option value="viewing_request">Viewing Requests</option>
              <option value="review">Reviews</option>
            </select>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="ml-auto px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-gray-600">
              {filter === 'unread'
                ? 'You are all caught up!'
                : 'Notifications about messages, offers, and updates will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow ${
                  !notification.is_read ? 'border-l-4 border-l-green-600' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <Link
                          href={notification.action_url || '/notifications'}
                          className="block group"
                          onClick={() => {
                            if (!notification.is_read) {
                              handleMarkAsRead(notification.id)
                            }
                          }}
                        >
                          <h3 className={`text-base ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'} group-hover:text-green-600`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </Link>

                        {/* Horse thumbnail if available */}
                        {notification.horse && notification.horse.horse_images?.[0] && (
                          <Link
                            href={notification.action_url || `/horses/${notification.horse.slug}`}
                            className="mt-3 flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={notification.horse.horse_images.find(img => img.is_primary)?.url || notification.horse.horse_images[0].url}
                                alt={notification.horse.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{notification.horse.name}</p>
                              <p className="text-sm text-gray-600">${notification.horse.price.toLocaleString()}</p>
                            </div>
                          </Link>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                          <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                          {!notification.is_read && (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
