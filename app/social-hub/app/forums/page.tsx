"use client"

import { useState } from "react"
import { Search, MessageSquare, Plus, Filter, MessageCircle, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Sample forum categories
const categories = [
  { id: 1, name: "Farming Tips", icon: "🌱", count: 156 },
  { id: 2, name: "Nooter Care", icon: "🐄", count: 89 },
  { id: 3, name: "Trading Post", icon: "🔄", count: 124 },
  { id: 4, name: "Game Updates", icon: "📢", count: 45 },
  { id: 5, name: "Competitions", icon: "🏆", count: 67 },
  { id: 6, name: "Technical Support", icon: "🔧", count: 32 },
]

// Sample forum threads
const threads = [
  {
    id: 1,
    title: "Best layout for maximum crop yield?",
    author: {
      name: "FarmExpert",
      avatar: "/placeholder.svg?height=40&width=40",
      level: 92,
    },
    category: "Farming Tips",
    replies: 24,
    views: 156,
    lastReply: {
      author: "CropWizard",
      time: "2 hours ago",
    },
    pinned: true,
    hot: true,
  },
  {
    id: 2,
    title: "Trading rare golden seeds for special fertilizer",
    author: {
      name: "SeedCollector",
      avatar: "/placeholder.svg?height=40&width=40",
      level: 45,
    },
    category: "Trading Post",
    replies: 18,
    views: 87,
    lastReply: {
      author: "FarmQueen",
      time: "5 hours ago",
    },
    pinned: false,
    hot: true,
  },
  {
    id: 3,
    title: "How to increase Nooter happiness?",
    author: {
      name: "NooterLover",
      avatar: "/placeholder.svg?height=40&width=40",
      level: 31,
    },
    category: "Nooter Care",
    replies: 42,
    views: 210,
    lastReply: {
      author: "AnimalWhisperer",
      time: "Yesterday",
    },
    pinned: false,
    hot: false,
  },
  {
    id: 4,
    title: "Spring Festival 2023 - Official Thread",
    author: {
      name: "GameMod",
      avatar: "/placeholder.svg?height=40&width=40",
      level: 150,
    },
    category: "Game Updates",
    replies: 67,
    views: 432,
    lastReply: {
      author: "FestivalFan",
      time: "3 hours ago",
    },
    pinned: true,
    hot: true,
  },
  {
    id: 5,
    title: "Game keeps crashing when visiting neighbor farms",
    author: {
      name: "TechNewbie",
      avatar: "/placeholder.svg?height=40&width=40",
      level: 12,
    },
    category: "Technical Support",
    replies: 8,
    views: 45,
    lastReply: {
      author: "TechSupport",
      time: "1 day ago",
    },
    pinned: false,
    hot: false,
  },
]

export default function ForumsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredThreads = threads.filter(
    (thread) =>
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <MessageSquare className="h-6 w-6 text-blue-500 mr-2" />
                <h2 className="text-2xl font-bold">Forums</h2>
              </div>

              <Button className="bg-green-500 hover:bg-green-600">
                <Plus className="h-4 w-4 mr-2" />
                New Thread
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Sidebar - Categories */}
              <div className="md:w-1/4">
                <Card>
                  <CardHeader className="pb-3">
                    <h3 className="text-lg font-semibold">Categories</h3>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{category.icon}</span>
                          <span>{category.name}</span>
                        </div>
                        <Badge variant="outline">{category.count}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Main Content - Threads */}
              <div className="md:w-3/4">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search forums..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                </div>

                <Tabs defaultValue="all">
                  <TabsList className="mb-6">
                    <TabsTrigger value="all">All Threads</TabsTrigger>
                    <TabsTrigger value="hot">Hot Topics</TabsTrigger>
                    <TabsTrigger value="pinned">Pinned</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <div className="space-y-4">
                      {filteredThreads.map((thread) => (
                        <Card key={thread.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar>
                                <AvatarImage
                                  src={thread.author.avatar || "/placeholder.svg"}
                                  alt={thread.author.name}
                                />
                                <AvatarFallback>{thread.author.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{thread.title}</h4>
                                  {thread.pinned && (
                                    <Badge
                                      variant="outline"
                                      className="bg-yellow-100 text-yellow-800 border-yellow-300"
                                    >
                                      Pinned
                                    </Badge>
                                  )}
                                  {thread.hot && (
                                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                      Hot
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                  <span>By {thread.author.name}</span>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs">
                                    {thread.category}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="h-3 w-3" />
                                    <span>{thread.replies} replies</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    <span>{thread.views} views</span>
                                  </div>
                                  <div>
                                    Last reply by <span className="font-medium">{thread.lastReply.author}</span>{" "}
                                    {thread.lastReply.time}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="hot">
                    <div className="space-y-4">
                      {filteredThreads
                        .filter((thread) => thread.hot)
                        .map((thread) => (
                          <Card key={thread.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Avatar>
                                  <AvatarImage
                                    src={thread.author.avatar || "/placeholder.svg"}
                                    alt={thread.author.name}
                                  />
                                  <AvatarFallback>{thread.author.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{thread.title}</h4>
                                    {thread.pinned && (
                                      <Badge
                                        variant="outline"
                                        className="bg-yellow-100 text-yellow-800 border-yellow-300"
                                      >
                                        Pinned
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                      Hot
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                    <span>By {thread.author.name}</span>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs">
                                      {thread.category}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <MessageCircle className="h-3 w-3" />
                                      <span>{thread.replies} replies</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      <span>{thread.views} views</span>
                                    </div>
                                    <div>
                                      Last reply by <span className="font-medium">{thread.lastReply.author}</span>{" "}
                                      {thread.lastReply.time}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="pinned">
                    <div className="space-y-4">
                      {filteredThreads
                        .filter((thread) => thread.pinned)
                        .map((thread) => (
                          <Card key={thread.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Avatar>
                                  <AvatarImage
                                    src={thread.author.avatar || "/placeholder.svg"}
                                    alt={thread.author.name}
                                  />
                                  <AvatarFallback>{thread.author.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{thread.title}</h4>
                                    <Badge
                                      variant="outline"
                                      className="bg-yellow-100 text-yellow-800 border-yellow-300"
                                    >
                                      Pinned
                                    </Badge>
                                    {thread.hot && (
                                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                        Hot
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                    <span>By {thread.author.name}</span>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs">
                                      {thread.category}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <MessageCircle className="h-3 w-3" />
                                      <span>{thread.replies} replies</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      <span>{thread.views} views</span>
                                    </div>
                                    <div>
                                      Last reply by <span className="font-medium">{thread.lastReply.author}</span>{" "}
                                      {thread.lastReply.time}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
