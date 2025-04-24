"use client"

import type React from "react"

import { useState } from "react"
import { Search, Send, Smile, Paperclip, MoreHorizontal, Phone, Video } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

// Sample conversations data
const conversations = [
  {
    id: 1,
    user: {
      name: "FarmExpert",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "online",
    },
    lastMessage: "Do you have any golden seeds to trade?",
    time: "2m ago",
    unread: 2,
  },
  {
    id: 2,
    user: {
      name: "CropWizard",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "online",
    },
    lastMessage: "Thanks for the help with my Nooters!",
    time: "1h ago",
    unread: 0,
  },
  {
    id: 3,
    user: {
      name: "NooterTamer",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "offline",
    },
    lastMessage: "Let me know when you're ready for the race",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 4,
    user: {
      name: "HarvestKing",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "online",
    },
    lastMessage: "Check out my new barn design!",
    time: "2d ago",
    unread: 0,
  },
]

// Sample messages for a conversation
const messages = [
  {
    id: 1,
    sender: "FarmExpert",
    avatar: "/placeholder.svg?height=40&width=40",
    content: "Hey there! Do you have any golden seeds to trade?",
    time: "10:30 AM",
    isMe: false,
  },
  {
    id: 2,
    sender: "Me",
    content: "Hi! I actually have a few golden seeds from last season's harvest. What are you offering in exchange?",
    time: "10:32 AM",
    isMe: true,
  },
  {
    id: 3,
    sender: "FarmExpert",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "I can trade you some rare Nooter feed or some special fertilizer that doubles crop growth. Which would you prefer?",
    time: "10:35 AM",
    isMe: false,
  },
  {
    id: 4,
    sender: "Me",
    content: "The special fertilizer sounds great! My crops could use a boost this season.",
    time: "10:38 AM",
    isMe: true,
  },
  {
    id: 5,
    sender: "FarmExpert",
    avatar: "/placeholder.svg?height=40&width=40",
    content: "Perfect! I'll bring it over to your farm tomorrow. How many golden seeds can you spare?",
    time: "10:40 AM",
    isMe: false,
  },
]

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter((convo) =>
    convo.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // In a real app, you would add the message to the conversation
      // and send it to the server
      setMessageText("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-yellow-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-green-500 to-yellow-400 shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/placeholder.svg?height=40&width=40"
              alt="Nooter's Farm Logo"
              className="h-10 w-10 rounded-full"
            />
            <h1 className="text-2xl font-bold text-white">Nooter's Farm</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-white overflow-hidden">
              <img src="/placeholder.svg?height=32&width=32" alt="User Avatar" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex h-[calc(80vh)]">
            {/* Conversations List */}
            <div className="w-1/3 border-r">
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Messages</h2>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-[calc(80vh-130px)]">
                  <div className="space-y-2">
                    {filteredConversations.map((convo) => (
                      <div
                        key={convo.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedConversation.id === convo.id ? "bg-green-100" : "hover:bg-gray-100"}`}
                        onClick={() => setSelectedConversation(convo)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={convo.user.avatar || "/placeholder.svg"} alt={convo.user.name} />
                              <AvatarFallback>{convo.user.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${convo.user.status === "online" ? "bg-green-500" : "bg-gray-400"}`}
                            ></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="font-medium truncate">{convo.user.name}</span>
                              <span className="text-xs text-gray-500">{convo.time}</span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{convo.lastMessage}</p>
                          </div>
                          {convo.unread > 0 && (
                            <span className="h-5 w-5 bg-green-500 rounded-full text-xs text-white flex items-center justify-center">
                              {convo.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Chat Area */}
            <div className="w-2/3 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage
                        src={selectedConversation.user.avatar || "/placeholder.svg"}
                        alt={selectedConversation.user.name}
                      />
                      <AvatarFallback>{selectedConversation.user.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${selectedConversation.user.status === "online" ? "bg-green-500" : "bg-gray-400"}`}
                    ></span>
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedConversation.user.name}</h3>
                    <p className="text-xs text-gray-500">
                      {selectedConversation.user.status === "online" ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`flex gap-2 max-w-[70%] ${message.isMe ? "flex-row-reverse" : ""}`}>
                        {!message.isMe && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.avatar || "/placeholder.svg"} alt={message.sender} />
                            <AvatarFallback>{message.sender.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div
                            className={`p-3 rounded-lg ${
                              message.isMe ? "bg-green-500 text-white rounded-tr-none" : "bg-gray-100 rounded-tl-none"
                            }`}
                          >
                            <p>{message.content}</p>
                          </div>
                          <p className={`text-xs text-gray-500 mt-1 ${message.isMe ? "text-right" : ""}`}>
                            {message.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-5 w-5 text-gray-500" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    className="flex-1"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyPress}
                  />
                  <Button variant="ghost" size="icon">
                    <Smile className="h-5 w-5 text-gray-500" />
                  </Button>
                  <Button
                    size="icon"
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
