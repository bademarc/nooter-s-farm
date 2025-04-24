"use client"

import { useState, useEffect } from "react"
import { Heart, MessageCircle, Share2, MoreHorizontal, Award } from "lucide-react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Avatar } from "./ui/avatar"
import { AvatarImage } from "./ui/avatar"
import { AvatarFallback } from "./ui/avatar"
import { CardContent } from "./ui/card"
import { CardFooter } from "./ui/card"
import { CardHeader } from "./ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "../hooks/use-toast"
import { AnimatedCard } from "./ui/animated-card"
import { AnimatedBadge } from "./ui/animated-badge"
import { ShimmerButton } from "./ui/shimmer-button"
import { Confetti } from "./ui/confetti"

// Sample feed data
const feedItems = [
  {
    id: 1,
    user: {
      name: "CropMaster99",
      avatar: "/placeholder.svg?height=40&width=40",
      level: 78,
      isPremium: true,
    },
    time: "2 hours ago",
    content: "Just harvested my 1000th golden pumpkin! Who wants to trade for some rare seeds?",
    image: "/placeholder.svg?height=300&width=500",
    likes: 42,
    comments: 8,
    shares: 3,
    isNew: true,
  },
  {
    id: 2,
    user: {
      name: "FarmQueen",
      avatar: "/placeholder.svg?height=40&width=40",
      level: 65,
      isPremium: false,
    },
    time: "5 hours ago",
    content: "Check out my new barn design! Took me 3 weeks to gather all the materials. Worth it!",
    image: "/placeholder.svg?height=300&width=500",
    likes: 87,
    comments: 23,
    shares: 12,
    isNew: true,
  },
  {
    id: 3,
    user: {
      name: "NooterLover",
      avatar: "/placeholder.svg?height=40&width=40",
      level: 31,
      isPremium: false,
    },
    time: "Yesterday",
    content: "My Nooters just had babies! So cute! Anyone want to come visit and see them?",
    image: "/placeholder.svg?height=300&width=500",
    likes: 156,
    comments: 42,
    shares: 18,
    isNew: false,
  },
]

export default function FarmFeed() {
  const [postText, setPostText] = useState("")
  const [likedPosts, setLikedPosts] = useState<number[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [posts, setPosts] = useState(feedItems)
  const { toast } = useToast()

  const handleLike = (postId: number) => {
    if (likedPosts.includes(postId)) {
      setLikedPosts(likedPosts.filter((id) => id !== postId))
    } else {
      setLikedPosts([...likedPosts, postId])
      // Show confetti for the first like
      if (likedPosts.length === 0) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }

      toast({
        title: "Post liked!",
        description: "Keep spreading positivity in the farm community!",
        variant: "default",
      })
    }
  }

  const handlePost = () => {
    if (postText.trim()) {
      const newPost = {
        id: Date.now(),
        user: {
          name: "FarmerJoe123",
          avatar: "/placeholder.svg?height=40&width=40",
          level: 42,
          isPremium: false,
        },
        time: "Just now",
        content: postText,
        image: "",
        likes: 0,
        comments: 0,
        shares: 0,
        isNew: true,
      }

      setPosts([newPost, ...posts])
      setPostText("")
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)

      toast({
        title: "Post shared!",
        description: "Your farm update has been shared with the community!",
        variant: "success",
      })
    }
  }

  // Mark posts as not new after they've been viewed
  useEffect(() => {
    const timer = setTimeout(() => {
      setPosts(
        posts.map((post) => ({
          ...post,
          isNew: false,
        })),
      )
    }, 5000)

    return () => clearTimeout(timer)
  }, [posts])

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti />}

      {/* Create Post */}
      <div className="bg-[#171717] border border-[#333] overflow-hidden rounded-none shadow-md">
        <div className="border-b border-[#333] p-4">
          <h3 className="text-lg font-semibold text-white">Share with other farmers</h3>
        </div>
        <div className="p-4">
          <div className="flex gap-3">
            <Avatar className="border border-[#333]">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Your avatar" />
              <AvatarFallback>YA</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="What's happening on your farm?"
              className="resize-none bg-[#111] border-[#333] focus:border-[#444] text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
          </div>
        </div>
        <div className="border-t border-[#333] p-4 flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-transparent border-[#333] text-white hover:bg-[#222] rounded-none">
              📷 Photo
            </Button>
            <Button variant="outline" size="sm" className="bg-transparent border-[#333] text-white hover:bg-[#222] rounded-none">
              🎮 Game Update
            </Button>
          </div>
          <Button 
            disabled={!postText.trim()} 
            onClick={handlePost}
            className="bg-white text-black hover:bg-white/90 rounded-none"
          >
            Post
          </Button>
        </div>
      </div>

      {/* Feed Items */}
      {posts.map((item, index) => (
        <div key={item.id} className="bg-[#171717] border border-[#333] overflow-hidden rounded-none shadow-md">
          <div className="border-b border-[#333] p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Avatar className="border border-[#333]">
                    <AvatarImage src={item.user.avatar || "/placeholder.svg"} alt={item.user.name} />
                    <AvatarFallback>{item.user.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{item.user.name}</span>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="flex items-center gap-1"
                    >
                      <span className="inline-flex items-center bg-[#111] border border-[#333] px-2 py-0.5 text-xs font-medium text-white">
                        Lvl {item.user.level}
                      </span>
                      {item.user.isPremium && (
                        <span className="inline-flex items-center gap-1 bg-[#111] border border-[#333] px-2 py-0.5 text-xs font-medium text-white">
                          <Award className="h-3 w-3" />
                          Premium
                        </span>
                      )}
                      {item.isNew && <AnimatedBadge variant="new">New!</AnimatedBadge>}
                    </motion.div>
                  </div>
                  <p className="text-xs text-white/60">{item.time}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-[#222] rounded-none">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#171717] border-[#333] text-white rounded-none">
                  <DropdownMenuItem className="hover:bg-[#222] rounded-none">Save Post</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#222] rounded-none">Report</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#222] rounded-none">Hide Posts from {item.user.name}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="p-4">
            <p className="mb-3 text-white">{item.content}</p>
            {item.image && (
              <motion.div whileHover={{ scale: 1.01 }} className="border border-[#333] overflow-hidden bg-[#111] rounded-none">
                <img src={item.image || "/placeholder.svg"} alt="Post content" className="w-full h-auto object-cover" />
              </motion.div>
            )}
          </div>
          <div className="border-t border-[#333] p-4">
            <div className="w-full flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 bg-transparent hover:bg-[#222] text-white rounded-none"
                onClick={() => handleLike(item.id)}
              >
                <Heart
                  className={`h-4 w-4 ${likedPosts.includes(item.id) ? "fill-white" : ""}`}
                />
                <span>{item.likes + (likedPosts.includes(item.id) ? 1 : 0)}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 bg-transparent hover:bg-[#222] text-white rounded-none"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{item.comments}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 bg-transparent hover:bg-[#222] text-white rounded-none"
              >
                <Share2 className="h-4 w-4" />
                <span>{item.shares}</span>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 