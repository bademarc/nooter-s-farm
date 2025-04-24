"use client"

import { useState } from "react"
import { Search, UserPlus, UserCheck, UserX, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Sample friends data
const friendsData = [
  {
    id: 1,
    name: "FarmExpert",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 92,
    status: "online",
    lastActive: "Now",
  },
  {
    id: 2,
    name: "CropWizard",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 78,
    status: "online",
    lastActive: "Now",
  },
  {
    id: 3,
    name: "NooterTamer",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 65,
    status: "offline",
    lastActive: "3 hours ago",
  },
  {
    id: 4,
    name: "HarvestKing",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 120,
    status: "online",
    lastActive: "Now",
  },
  {
    id: 5,
    name: "FarmQueen",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 105,
    status: "offline",
    lastActive: "Yesterday",
  },
]

// Sample friend requests data
const friendRequestsData = [
  {
    id: 101,
    name: "SeedCollector",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 45,
    mutualFriends: 2,
  },
  {
    id: 102,
    name: "AnimalLover",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 37,
    mutualFriends: 5,
  },
]

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [friends, setFriends] = useState(friendsData)
  const [friendRequests, setFriendRequests] = useState(friendRequestsData)

  const handleAcceptRequest = (id: number) => {
    const acceptedRequest = friendRequests.find((request) => request.id === id)
    if (acceptedRequest) {
      setFriendRequests(friendRequests.filter((request) => request.id !== id))
      setFriends([
        ...friends,
        {
          ...acceptedRequest,
          status: "online",
          lastActive: "Now",
        },
      ])
    }
  }

  const handleRejectRequest = (id: number) => {
    setFriendRequests(friendRequests.filter((request) => request.id !== id))
  }

  const filteredFriends = friends.filter((friend) => friend.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
            <Button variant="ghost" size="icon" className="relative text-white hover:bg-green-600">
              <UserPlus className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                {friendRequests.length}
              </span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-white overflow-hidden">
              <img src="/placeholder.svg?height=32&width=32" alt="User Avatar" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-6">Friends & Connections</h2>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search friends..."
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
                <TabsTrigger value="all">All Friends ({friends.length})</TabsTrigger>
                <TabsTrigger value="online">Online ({friends.filter((f) => f.status === "online").length})</TabsTrigger>
                <TabsTrigger value="requests">Requests ({friendRequests.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => (
                    <Card key={friend.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                              <AvatarFallback>{friend.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${friend.status === "online" ? "bg-green-500" : "bg-gray-400"}`}
                            ></span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{friend.name}</span>
                              <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                                Lvl {friend.level}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {friend.status === "online" ? "Online" : `Last active: ${friend.lastActive}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            Visit Farm
                          </Button>
                          <Button size="sm" variant="outline">
                            Message
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="lucide lucide-more-vertical"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="12" cy="5" r="1" />
                                  <circle cx="12" cy="19" r="1" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Profile</DropdownMenuItem>
                              <DropdownMenuItem>Block User</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500">Remove Friend</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No friends found matching your search.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="online" className="space-y-4">
                {filteredFriends.filter((f) => f.status === "online").length > 0 ? (
                  filteredFriends
                    .filter((f) => f.status === "online")
                    .map((friend) => (
                      <Card key={friend.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar>
                                <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                                <AvatarFallback>{friend.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{friend.name}</span>
                                <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                                  Lvl {friend.level}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">Online</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              Visit Farm
                            </Button>
                            <Button size="sm" variant="outline">
                              Message
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No online friends at the moment.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="requests" className="space-y-4">
                {friendRequests.length > 0 ? (
                  friendRequests.map((request) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.avatar || "/placeholder.svg"} alt={request.name} />
                            <AvatarFallback>{request.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{request.name}</span>
                              <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                                Lvl {request.level}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{request.mutualFriends} mutual friends</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No pending friend requests.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
