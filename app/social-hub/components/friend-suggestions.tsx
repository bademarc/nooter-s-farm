"use client"

import { UserPlus, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { AvatarFallback } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ShimmerButton } from "@/components/ui/shimmer-button"

// Sample friend suggestions data
const friendSuggestionsData = [
  {
    id: 1,
    name: "FarmExpert",
    avatar: "/images/nooter.png",
    level: 92,
    mutualFriends: 5,
  },
  {
    id: 2,
    name: "CropWizard",
    avatar: "/images/nooter.png",
    level: 78,
    mutualFriends: 3,
  },
  {
    id: 3,
    name: "NooterTamer",
    avatar: "/images/nooter.png",
    level: 65,
    mutualFriends: 8,
  },
  {
    id: 4,
    name: "HarvestKing",
    avatar: "/images/nooter.png",
    level: 120,
    mutualFriends: 2,
  },
  {
    id: 5,
    name: "FarmQueen",
    avatar: "/images/nooter.png",
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
    <Card>
      <CardHeader className="pb-3 flex items-center">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold">Friend Suggestions</h3>
        </div>
      </CardHeader>
      <CardContent>
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
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Avatar>
                        <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                        <AvatarFallback>{friend.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{friend.name}</span>
                        <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-100">
                          Lvl {friend.level}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{friend.mutualFriends} mutual friends</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <ShimmerButton className="h-8 px-2 py-1 text-xs" onClick={() => handleAddFriend(friend.id)}>
                      <UserPlus className="h-3 w-3 mr-1" />
                      Add
                    </ShimmerButton>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDismiss(friend.id)}>
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
              className="py-4 text-center text-muted-foreground"
            >
              <p>No more suggestions right now.</p>
              <p className="text-sm">Check back later!</p>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          className="w-full mt-4 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 dark:hover:text-blue-300"
        >
          View All Suggestions
        </Button>
      </CardContent>
    </Card>
  )
}
