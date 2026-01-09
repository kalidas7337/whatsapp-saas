'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  MessageSquare,
  Search,
  Send,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  User,
  Bot,
  UserCog,
  RefreshCw,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Contact {
  id: string
  phoneNumber: string
  name: string | null
  clientId: string | null
}

interface Conversation {
  id: string
  contact: Contact | null
  status: string
  assignedTo: string | null
  unreadCount: number
  messageCount: number
  lastMessageAt: string | null
  lastMessagePreview: string | null
  windowExpiresAt: string | null
  botMode: string
  tags: string[]
  createdAt: string
}

interface Message {
  id: string
  wamid: string | null
  direction: 'INBOUND' | 'OUTBOUND'
  type: string
  content: string | null
  mediaUrl: string | null
  status: string
  errorCode: string | null
  errorMessage: string | null
  sentAt: string | null
  deliveredAt: string | null
  readAt: string | null
  createdAt: string
}

export default function InboxPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/inbox/conversations?${params}`)
      const data = await res.json()

      if (data.success) {
        setConversations(data.data)
      } else {
        setError(data.error || 'Failed to load conversations')
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setIsLoadingConversations(false)
    }
  }, [statusFilter, searchQuery])

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true)
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/messages`)
      const data = await res.json()

      if (data.success) {
        setMessages(data.data)
      } else {
        setError(data.error || 'Failed to load messages')
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to load messages')
    } finally {
      setIsLoadingMessages(false)
    }
  }, [])

  // Initial load and polling
  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [fetchConversations])

  // Load selected conversation
  useEffect(() => {
    if (selectedId) {
      const conv = conversations.find((c) => c.id === selectedId)
      if (conv) {
        setSelectedConversation(conv)
        fetchMessages(selectedId)
      }
    }
  }, [selectedId, conversations, fetchMessages])

  // Poll messages for selected conversation
  useEffect(() => {
    if (!selectedId) return
    const interval = setInterval(() => fetchMessages(selectedId), 5000)
    return () => clearInterval(interval)
  }, [selectedId, fetchMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Select conversation
  const selectConversation = (conv: Conversation) => {
    router.push(`/inbox?id=${conv.id}`)
  }

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() || !selectedId || isSending) return

    setIsSending(true)
    try {
      const res = await fetch(`/api/inbox/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          text: messageText.trim(),
        }),
      })

      const data = await res.json()

      if (data.success) {
        setMessageText('')
        // Add message to list immediately
        setMessages((prev) => [...prev, data.data])
        // Refresh conversations to update preview
        fetchConversations()
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Get initials for avatar
  const getInitials = (name: string | null, phone: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }
    return phone.slice(-2)
  }

  // Format timestamp
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  // Get message status icon
  const getStatusIcon = (message: Message) => {
    if (message.direction === 'INBOUND') return null

    switch (message.status) {
      case 'PENDING':
        return <Clock className="h-3 w-3 text-muted-foreground" />
      case 'SENT':
        return <Check className="h-3 w-3 text-muted-foreground" />
      case 'DELIVERED':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case 'READ':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case 'FAILED':
        return <AlertCircle className="h-3 w-3 text-destructive" />
      default:
        return null
    }
  }

  // Empty state
  if (isLoadingConversations && conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] -m-6 flex">
      {/* Conversations List */}
      <div className="w-80 border-r flex flex-col bg-background">
        {/* Search and Filter Header */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchConversations()}
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm mt-1">
                Messages will appear here when customers contact you
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={cn(
                    'w-full p-4 text-left hover:bg-accent transition-colors',
                    selectedId === conv.id && 'bg-accent'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(conv.contact?.name || null, conv.contact?.phoneNumber || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {conv.contact?.name || conv.contact?.phoneNumber || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessagePreview || 'No messages'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="h-5 min-w-5 justify-center">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={conv.status === 'OPEN' ? 'default' : 'secondary'}
                          className="text-xs h-5"
                        >
                          {conv.status}
                        </Badge>
                        {conv.botMode === 'BOT' && (
                          <Bot className="h-3 w-3 text-muted-foreground" />
                        )}
                        {conv.botMode === 'HUMAN' && (
                          <User className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="h-16 border-b bg-background flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(
                      selectedConversation.contact?.name || null,
                      selectedConversation.contact?.phoneNumber || ''
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">
                    {selectedConversation.contact?.name ||
                      selectedConversation.contact?.phoneNumber ||
                      'Unknown'}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {selectedConversation.contact?.phoneNumber}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedConversation.botMode}
                  onValueChange={async (value) => {
                    await fetch(`/api/inbox/conversations/${selectedConversation.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ botMode: value }),
                    })
                    fetchConversations()
                  }}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOT">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        Bot Mode
                      </div>
                    </SelectItem>
                    <SelectItem value="HUMAN">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Human
                      </div>
                    </SelectItem>
                    <SelectItem value="HYBRID">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        Hybrid
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={async () => {
                        await fetch(`/api/inbox/conversations/${selectedConversation.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'RESOLVED' }),
                        })
                        fetchConversations()
                      }}
                    >
                      Mark as Resolved
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        await fetch(`/api/inbox/conversations/${selectedConversation.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'PENDING' }),
                        })
                        fetchConversations()
                      }}
                    >
                      Mark as Pending
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>View Contact Details</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No messages in this conversation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex',
                        message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-lg px-4 py-2',
                          message.direction === 'OUTBOUND'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border'
                        )}
                      >
                        {message.type !== 'TEXT' && (
                          <Badge variant="outline" className="mb-2 text-xs">
                            {message.type}
                          </Badge>
                        )}
                        <p className="whitespace-pre-wrap break-words">
                          {message.content || `[${message.type}]`}
                        </p>
                        <div
                          className={cn(
                            'flex items-center gap-1 mt-1 text-xs',
                            message.direction === 'OUTBOUND'
                              ? 'text-primary-foreground/70 justify-end'
                              : 'text-muted-foreground'
                          )}
                        >
                          <span>
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {getStatusIcon(message)}
                        </div>
                        {message.status === 'FAILED' && message.errorMessage && (
                          <p className="text-xs text-destructive mt-1">
                            Error: {message.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Composer */}
            <div className="border-t bg-background p-4">
              {selectedConversation.windowExpiresAt &&
              new Date(selectedConversation.windowExpiresAt) < new Date() ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    24-hour messaging window has expired. You can only send template messages.
                  </p>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[44px] max-h-32 resize-none"
                    rows={1}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!messageText.trim() || isSending}
                    size="icon"
                    className="h-11 w-11 shrink-0"
                  >
                    {isSending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Welcome to Team Inbox</h2>
              <p>Select a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:opacity-70">
            &times;
          </button>
        </div>
      )}
    </div>
  )
}
