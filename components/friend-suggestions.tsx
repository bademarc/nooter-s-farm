"use client"

import { UserPlus, Users, X } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { CardContent } from "./ui/card"
import { CardHeader } from "./ui/card"
import { Avatar } from "./ui/avatar"
import { AvatarImage } from "./ui/avatar"
import { AvatarFallback } from "./ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useToast } from "../hooks/use-toast"
import { ShimmerButton } from "./ui/shimmer-button"

// Sample friend suggestions data
const friendSuggestionsData = [
  {
    id: 1,
    name: "FarmExpert",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 92,
    mutualFriends: 5,
  },
  {
    id: 2,
    name: "CropWizard",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 78,
    mutualFriends: 3,
  },
  {
    id: 3,
    name: "NooterTamer",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 65,
    mutualFriends: 8,
  },
  {
    id: 4,
    name: "HarvestKing",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 120,
    mutualFriends: 2,
  },
  {
    id: 5,
    name: "FarmQueen",
    avatar: "/placeholder.svg?height=40&width=40",
    level: 105,
    mutualFriends: 6,
  },
]

export default function FriendSuggestions() {
  const [friendSuggestions, setFriendSuggestions] = useState(friendSuggestionsData)
  const [addedFriends, setAddedFriends] = useState<number[]>([])
  const [dismissedFriends, setDismissedFriends] = useState<number[]>([])
  const { toast } = useToast()

  const handleAddFriend = (id: number) => {
    setAddedFriends([...addedFriends, id])
    toast({
      title: "Friend Request Sent!",
      description: `You sent a friend request to ${friendSuggestions.find((f) => f.id === id)?.name}!`,
      variant: "success",
    })
  }

  const handleDismiss = (id: number) => {
    setDismissedFriends([...dismissedFriends, id])
  }

  const visibleSuggestions = friendSuggestions.filter(
    (friend) => !addedFriends.includes(friend.id) && !dismissedFriends.includes(friend.id),
  )

  return (
    <Card className="bg-[#171717] border border-[#333] rounded-none">
      <CardHeader className="pb-3 flex items-center border-b border-[#333]">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-white mr-2" />
          <h3 className="text-lg font-semibold text-white">Friend Suggestions</h3>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <AnimatePresence>
          {visibleSuggestions.length > 0 ? (
            <motion.div className="space-y-4">
              {visibleSuggestions.slice(0, 3).map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between border border-[#333] p-3 bg-[#111] rounded-none"
                >
                  <div className="flex items-center gap-3">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Avatar className="border border-[#333]">
                        <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                        <AvatarFallback>{friend.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{friend.name}</span>
                        <span className="text-xs bg-black border border-[#333] px-1.5 py-0.5 text-white">
                          Lvl {friend.level}
                        </span>
                      </div>
                      <p className="text-xs text-white/60">{friend.mutualFriends} mutual friends</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      className="h-8 px-2 py-1 text-xs bg-white text-black hover:bg-white/90 rounded-none" 
                      onClick={() => handleAddFriend(friend.id)}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-8 w-8 bg-transparent border-[#333] text-white hover:bg-[#222] rounded-none" 
                      onClick={() => handleDismiss(friend.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-4 text-center text-white/60"
            >
              <p>No more suggestions right now.</p>
              <p className="text-sm">Check back later!</p>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="outline"
          className="w-full mt-4 bg-transparent border border-[#333] text-white hover:bg-[#222] rounded-none"
        >
          View All Suggestions
        </Button>
      </CardContent>
    </Card>
  )
} 