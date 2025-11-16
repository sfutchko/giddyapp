import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MessagesContent } from '@/components/messages/messages-content'
import { getBlockedUserIds, getUsersWhoBlockedMe } from '@/lib/actions/blocking'

export default async function MessagesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get blocked user IDs to filter out
  const { blockedIds } = await getBlockedUserIds()
  const { blockerIds } = await getUsersWhoBlockedMe()
  const allBlockedUserIds = [...blockedIds, ...blockerIds]

  // Fetch all conversations for the user
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      horse:horses(id, name, slug, horse_images(url, is_primary)),
      attachments:message_attachments(*)
    `)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Fetch all unique user IDs from conversations
  const userIds = new Set<string>()
  messages?.forEach(msg => {
    userIds.add(msg.sender_id)
    userIds.add(msg.recipient_id)
  })

  // Fetch profiles for all users in conversations (if they exist)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', Array.from(userIds))

  // Create a map of user profiles
  const profilesMap = new Map()

  // Add known profiles
  profiles?.forEach(profile => {
    profilesMap.set(profile.id, profile)
  })

  // For users without profiles, create basic entries
  userIds.forEach(userId => {
    if (!profilesMap.has(userId)) {
      // For the current user, we know their email
      if (userId === user.id) {
        profilesMap.set(userId, {
          id: userId,
          email: user.email || 'Unknown',
          name: user.user_metadata?.name || null
        })
      } else {
        // For other users without profiles, we'll just use a placeholder
        profilesMap.set(userId, {
          id: userId,
          email: 'User',
          name: null
        })
      }
    }
  })

  // Filter out messages with blocked users
  const filteredMessages = messages?.filter(msg => {
    const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
    return !allBlockedUserIds.includes(otherUserId)
  }) || []

  // Add profile data to messages
  const conversations = filteredMessages.map(msg => ({
    ...msg,
    sender: profilesMap.get(msg.sender_id) || { id: msg.sender_id, email: 'User', name: null },
    recipient: profilesMap.get(msg.recipient_id) || { id: msg.recipient_id, email: 'User', name: null }
  }))

  // Group messages by conversation_id
  const conversationsMap = new Map()

  conversations?.forEach(message => {
    const conversationId = message.conversation_id

    if (!conversationsMap.has(conversationId)) {
      // Determine the other user
      const otherUser = message.sender_id === user.id ? message.recipient : message.sender
      const isUnread = message.recipient_id === user.id && !message.is_read

      conversationsMap.set(conversationId, {
        id: conversationId,
        otherUser,
        horse: message.horse,
        lastMessage: message,
        unreadCount: isUnread ? 1 : 0,
        messages: [message]
      })
    } else {
      const conversation = conversationsMap.get(conversationId)
      conversation.messages.push(message)

      // Update last message if this is newer
      if (new Date(message.created_at) > new Date(conversation.lastMessage.created_at)) {
        conversation.lastMessage = message
      }

      // Count unread messages
      if (message.recipient_id === user.id && !message.is_read) {
        conversation.unreadCount++
      }
    }
  })

  const conversationsList = Array.from(conversationsMap.values())
    .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime())

  return <MessagesContent user={user} conversations={conversationsList} />
}