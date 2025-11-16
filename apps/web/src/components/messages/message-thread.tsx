'use client'

import { useState, useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Send, Loader2, MoreVertical, Paperclip, X, FileText, Image as ImageIcon, File } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { BlockUserButton } from '@/components/users/block-user-button'
import { ReportUserButton } from '@/components/users/report-user-button'
import { isUserBlocked, isBlockedBy } from '@/lib/actions/blocking'
import { TemplatePicker } from './template-picker'

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
  messages: Message[]
}

interface MessageThreadProps {
  conversation: Conversation
  user: User
  onUpdate: (conversationId: string, messages: Message[]) => void
  onBack: () => void
}

export function MessageThread({ conversation, user, onUpdate, onBack }: MessageThreadProps) {
  const [messages, setMessages] = useState(conversation.messages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [userIsBlocked, setUserIsBlocked] = useState(false)
  const [blockedByOther, setBlockedByOther] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Check if user is blocked on mount
  useEffect(() => {
    const checkBlockStatus = async () => {
      const [blocked, blockedBy] = await Promise.all([
        isUserBlocked(conversation.otherUser.id),
        isBlockedBy(conversation.otherUser.id)
      ])
      setUserIsBlocked(blocked.isBlocked)
      setBlockedByOther(blockedBy.isBlocked)
    }
    checkBlockStatus()
  }, [conversation.otherUser.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Mark messages as read
    const markAsRead = async () => {
      const unreadMessages = messages.filter(
        m => m.recipient_id === user.id && !m.is_read
      )

      if (unreadMessages.length > 0) {
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(m => m.id))
          .eq('recipient_id', user.id)

        if (!error) {
          const updatedMessages = messages.map(m => ({
            ...m,
            is_read: m.recipient_id === user.id ? true : m.is_read
          }))
          setMessages(updatedMessages)
          onUpdate(conversation.id, updatedMessages)
        }
      }
    }

    markAsRead()
  }, [conversation.id])

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        async (payload) => {
          const newMsg = payload.new as Message

          // Don't add the message if we already sent it (avoid duplicates)
          if (newMsg.sender_id === user.id) {
            return
          }

          // Construct sender/recipient info from what we know
          const fullMessage: Message = {
            ...newMsg,
            sender: conversation.otherUser, // The other user sent it
            recipient: {
              id: user.id,
              name: user.user_metadata?.name || null,
              email: user.email || 'Unknown'
            }
          }

          setMessages(prev => {
            const updated = [...prev, fullMessage]
            onUpdate(conversation.id, updated)
            return updated
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const maxSize = 25 * 1024 * 1024 // 25MB

    for (const file of files) {
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 25MB limit`,
          variant: 'destructive'
        })
        continue
      }
      validFiles.push(file)
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType.startsWith('video/')) return 'video'
    return 'document'
  }

  const uploadFiles = async (messageId: string): Promise<MessageAttachment[]> => {
    if (selectedFiles.length === 0) return []

    const uploadedAttachments: MessageAttachment[] = []

    for (const file of selectedFiles) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${messageId}/${Date.now()}_${file.name}`
        const filePath = `${user.id}/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive'
          })
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(filePath)

        // Create attachment record
        const { data: attachment, error: attachmentError } = await supabase
          .from('message_attachments')
          .insert({
            message_id: messageId,
            file_name: file.name,
            file_type: getFileType(file.type),
            file_size: file.size,
            mime_type: file.type,
            storage_url: publicUrl,
            storage_path: filePath,
            uploaded_by: user.id
          })
          .select()
          .single()

        if (attachmentError) {
          console.error('Attachment record error:', attachmentError)
          toast({
            title: 'Error saving attachment',
            description: `Failed to save ${file.name}`,
            variant: 'destructive'
          })
          continue
        }

        uploadedAttachments.push(attachment)
      } catch (error) {
        console.error('File upload error:', error)
        toast({
          title: 'Upload error',
          description: `Error uploading ${file.name}`,
          variant: 'destructive'
        })
      }
    }

    return uploadedAttachments
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!newMessage.trim() && selectedFiles.length === 0) || sending) return

    setSending(true)
    setUploading(true)

    try {
      const { data: insertedMessage, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversation.id,
          sender_id: user.id,
          recipient_id: conversation.otherUser.id,
          horse_id: conversation.horse?.id,
          content: newMessage.trim() || '📎 Attachment'
        }])
        .select('*')
        .single()

      if (error) throw error

      // Upload files if any
      let attachments: MessageAttachment[] = []
      if (selectedFiles.length > 0) {
        attachments = await uploadFiles(insertedMessage.id)
      }

      // Construct the full message object with sender/recipient info and attachments
      const fullMessage = {
        ...insertedMessage,
        sender: {
          id: user.id,
          name: user.user_metadata?.name || null,
          email: user.email || 'Unknown'
        },
        recipient: conversation.otherUser,
        attachments
      }

      setMessages(prev => {
        const updated = [...prev, fullMessage]
        onUpdate(conversation.id, updated)
        return updated
      })
      setNewMessage('')
      setSelectedFiles([])

    } catch (error: any) {
      console.error('Send message error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  const getPrimaryImage = () => {
    const images = conversation.horse?.horse_images
    return images?.find(img => img.is_primary)?.url || images?.[0]?.url
  }

  const horseImage = getPrimaryImage()

  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* User & Horse Info */}
          <div className="flex items-center gap-3 flex-1">
            {horseImage && (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                <Image
                  src={horseImage}
                  alt={conversation.horse?.name || 'Horse'}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">
                {conversation.otherUser.name || conversation.otherUser.email}
              </p>
              {conversation.horse && (
                <Link
                  href={`/horses/${conversation.horse.slug}`}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Re: {conversation.horse.name}
                </Link>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[180px] z-20">
                  <BlockUserButton
                    userId={conversation.otherUser.id}
                    userName={conversation.otherUser.name || conversation.otherUser.email}
                    isBlocked={userIsBlocked}
                    onBlockChange={(blocked) => {
                      setUserIsBlocked(blocked)
                      setShowMenu(false)
                      if (blocked) {
                        onBack()
                      }
                    }}
                    variant="menu-item"
                  />
                  <ReportUserButton
                    userId={conversation.otherUser.id}
                    userName={conversation.otherUser.name || conversation.otherUser.email}
                    variant="menu-item"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ).map((message) => {
          const isMe = message.sender_id === user.id

          return (
            <div
              key={message.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isMe
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.content && message.content !== '📎 Attachment' && (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment) => {
                      const isImage = attachment.file_type === 'image'
                      const isPDF = attachment.file_type === 'pdf'

                      return (
                        <div key={attachment.id} className="rounded-lg overflow-hidden">
                          {isImage ? (
                            <a
                              href={attachment.storage_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <div className="relative w-full max-w-xs">
                                <Image
                                  src={attachment.storage_url}
                                  alt={attachment.file_name}
                                  width={300}
                                  height={200}
                                  className="rounded-lg object-cover w-full h-auto"
                                />
                              </div>
                            </a>
                          ) : (
                            <a
                              href={attachment.storage_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={attachment.file_name}
                              className={`flex items-center gap-2 p-3 rounded-lg border ${
                                isMe
                                  ? 'bg-green-700 border-green-500'
                                  : 'bg-white border-gray-300'
                              }`}
                            >
                              {isPDF ? (
                                <FileText className="h-5 w-5 flex-shrink-0" />
                              ) : (
                                <File className="h-5 w-5 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {attachment.file_name}
                                </p>
                                <p className={`text-xs ${
                                  isMe ? 'text-green-100' : 'text-gray-500'
                                }`}>
                                  {formatFileSize(attachment.file_size)}
                                </p>
                              </div>
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                <p className={`text-xs mt-1 ${
                  isMe ? 'text-green-100' : 'text-gray-500'
                }`}>
                  {formatRelativeTime(message.created_at)}
                  {isMe && message.is_read && ' • Read'}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {userIsBlocked || blockedByOther ? (
        <div className="border-t p-4 bg-gray-50">
          <p className="text-center text-gray-600 text-sm">
            {userIsBlocked
              ? 'You have blocked this user. Unblock them to send messages.'
              : 'You cannot send messages to this user.'}
          </p>
        </div>
      ) : (
        <form onSubmit={sendMessage} className="border-t p-4">
          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
                >
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4 text-gray-600" />
                  ) : file.type === 'application/pdf' ? (
                    <FileText className="h-4 w-4 text-gray-600" />
                  ) : (
                    <File className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-gray-700 truncate max-w-[150px]">
                    {file.name}
                  </span>
                  <span className="text-gray-500 text-xs">
                    ({formatFileSize(file.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-1 text-gray-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <TemplatePicker
              onSelectTemplate={(content) => setNewMessage(content)}
              className="mb-2"
            />

            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 mb-2"
              title="Attach files"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending || uploading}
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || uploading || (!newMessage.trim() && selectedFiles.length === 0)}
              className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending || uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {uploading && <span className="text-sm">Uploading...</span>}
                </>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}