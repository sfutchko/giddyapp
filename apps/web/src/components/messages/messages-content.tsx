'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { formatRelativeTime } from '@/lib/utils'
import { MessageThread } from './message-thread'
import { MessageSquare, Search, ChevronLeft } from 'lucide-react'
import { markNotificationsByTypeAsRead } from '@/lib/actions/notifications'

interface MessageAttachment {
  id: string
  message_id: string
  file_name: string
  file_type: string
  file_size: number
  mime_type: string
  storage_url: string
  storage_path: string
  thumbnail_url?: string
  uploaded_by: string
  created_at: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  created_at: string
  sender: { id: string; name?: string; email: string }
  recipient: { id: string; name?: string; email: string }
  horse?: {
    id: string
    name: string
    slug: string
    horse_images?: Array<{ url: string; is_primary: boolean }>
  }
  attachments?: MessageAttachment[]
}

interface Conversation {
  id: string
  otherUser: { id: string; name?: string; email: string }
  horse?: {
    id: string
    name: string
    slug: string
    horse_images?: Array<{ url: string; is_primary: boolean }>
  }
  lastMessage: Message
  unreadCount: number
  messages: Message[]
}

interface MessagesContentProps {
  user: User
  conversations: Conversation[]
}

export function MessagesContent({ user, conversations: initialConversations }: MessagesContentProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Mark message notifications as read when viewing this page
  useEffect(() => {
    markNotificationsByTypeAsRead(['message'])
  }, [])

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase()
    return (
      conv.otherUser.name?.toLowerCase().includes(searchLower) ||
      conv.otherUser.email.toLowerCase().includes(searchLower) ||
      conv.horse?.name.toLowerCase().includes(searchLower) ||
      conv.lastMessage.content.toLowerCase().includes(searchLower)
    )
  })

  const handleConversationUpdate = (conversationId: string, messages: Message[]) => {
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        if (conv.id === conversationId) {
          const updatedMessages = [...messages]
          const lastMessage = updatedMessages[updatedMessages.length - 1]
          const unreadCount = updatedMessages.filter(
            m => m.recipient_id === user.id && !m.is_read
          ).length

          return {
            ...conv,
            messages: updatedMessages,
            lastMessage,
            unreadCount
          }
        }
        return conv
      })
    })
  }

  const getPrimaryImage = (images?: { url: string; is_primary: boolean }[]) => {
    return images?.find(img => img.is_primary)?.url || images?.[0]?.url
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
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Conversations List */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 bg-white border-r`}>
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Messages</h2>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare className="h-12 w-12 mb-3 text-gray-300" />
                <p className="text-center">
                  {searchQuery
                    ? 'No conversations found'
                    : 'No messages yet'
                  }
                </p>
                {!searchQuery && (
                  <p className="text-sm mt-2">
                    Start a conversation by contacting a seller
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map(conversation => {
                  const horseImage = getPrimaryImage(conversation.horse?.horse_images)
                  const isSelected = selectedConversation?.id === conversation.id

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full p-4 hover:bg-gray-50 text-left transition-colors ${
                        isSelected ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Horse Image */}
                        {horseImage ? (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={horseImage}
                              alt={conversation.horse?.name || 'Horse'}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {conversation.otherUser.name || conversation.otherUser.email}
                              </p>
                              {conversation.horse && (
                                <p className="text-xs text-gray-500">
                                  Re: {conversation.horse.name}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(conversation.lastMessage.created_at)}
                            </span>
                          </div>

                          <p className={`text-sm truncate ${
                            conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                          }`}>
                            {conversation.lastMessage.sender_id === user.id && 'You: '}
                            {conversation.lastMessage.content}
                          </p>

                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-green-600 text-white text-xs rounded-full mt-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Message Thread */}
        {selectedConversation ? (
          <MessageThread
            conversation={selectedConversation}
            user={user}
            onUpdate={handleConversationUpdate}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}