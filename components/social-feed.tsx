"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { HeartIcon, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "./ui/badge"
import { cn } from "../lib/utils"

export function SocialFeed() {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: {
        name: "NootExplorer",
        avatar: "/avatars/noot1.png",
        verified: true,
      },
      content: "Just completed the Ancient Ruins quest! Found some rare artifacts and earned 500 XP. Who wants to join me for the Forest Expedition next?",
      timestamp: "3 hours ago",
      likes: 24,
      comments: 5,
      liked: false,
      saved: false,
      media: "/images/quest-complete.jpg",
      tags: ["QuestComplete", "AncientRuins"]
    },
    {
      id: 2,
      author: {
        name: "NootMaster99",
        avatar: "/avatars/noot2.png",
        verified: false,
      },
      content: "Trading rare items at the marketplace tomorrow. Looking for enchanted boots and magical scrolls. I have plenty of healing potions to offer!",
      timestamp: "6 hours ago",
      likes: 17,
      comments: 12,
      liked: true,
      saved: true,
      media: null,
      tags: ["Trading", "Marketplace"]
    },
    {
      id: 3,
      author: {
        name: "AdventureNoot",
        avatar: "/avatars/noot3.png",
        verified: true,
      },
      content: "Reached level 50 today! The journey has been incredible. Thanks to everyone who helped along the way. Special shoutout to the Noot Guild!",
      timestamp: "1 day ago",
      likes: 86,
      comments: 32,
      liked: false,
      saved: false,
      media: "/images/level-up.jpg",
      tags: ["LevelUp", "Milestone"]
    },
  ])
  
  const [newPostContent, setNewPostContent] = useState("")
  
  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        }
      }
      return post
    }))
  }
  
  const handleSave = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          saved: !post.saved
        }
      }
      return post
    }))
  }
  
  const handleSubmitPost = (e) => {
    e.preventDefault()
    if (!newPostContent.trim()) return
    
    const newPost = {
      id: Date.now(),
      author: {
        name: "YourNootName",
        avatar: "/avatars/user.png",
        verified: false,
      },
      content: newPostContent,
      timestamp: "Just now",
      likes: 0,
      comments: 0,
      liked: false,
      saved: false,
      media: null,
      tags: []
    }
    
    setPosts([newPost, ...posts])
    setNewPostContent("")
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Post creation area */}
      <div className="bg-[#171717] border border-[#333] p-4 rounded-none shadow-md">
        <form onSubmit={handleSubmitPost} className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 border border-[#333]">
              <AvatarImage src="/avatars/user.png" alt="Your Avatar" />
              <AvatarFallback>YN</AvatarFallback>
            </Avatar>
            <Input
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your quest adventures..."
              className="flex-1 bg-[#222] border-[#333] focus:border-[#444] text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="bg-transparent border-[#333] hover:bg-[#222] text-white rounded-none">
                📷 Photo
              </Button>
              <Button type="button" variant="outline" size="sm" className="bg-transparent border-[#333] hover:bg-[#222] text-white rounded-none">
                📍 Location
              </Button>
            </div>
            <Button 
              type="submit" 
              className="bg-[#333] hover:bg-[#444] text-white border border-[#444] rounded-none"
              disabled={!newPostContent.trim()}
            >
              Post
            </Button>
          </div>
        </form>
      </div>
      
      {/* Feed posts */}
      <AnimatePresence>
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#171717] border border-[#333] shadow-md rounded-none overflow-hidden"
          >
            {/* Post header */}
            <div className="p-4 flex justify-between items-center border-b border-[#333]">
              <div className="flex items-center gap-3">
                <Avatar className="border border-[#333]">
                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  <AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white">{post.author.name}</span>
                    {post.author.verified && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-white/60">{post.timestamp}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-[#222] rounded-none h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Post content */}
            <div className="p-4">
              <p className="text-white mb-3">{post.content}</p>
              
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="bg-[#222] text-white border-[#333] hover:bg-[#333] rounded-none"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {post.media && (
                <div className="mt-3 mb-4 rounded-none overflow-hidden border border-[#333]">
                  <img src={post.media} alt="Post media" className="w-full h-auto" />
                </div>
              )}
            </div>
            
            {/* Post actions */}
            <div className="px-4 py-2 border-t border-[#333] flex justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleLike(post.id)} 
                  className="flex items-center gap-1 text-white/70 hover:text-white"
                >
                  <HeartIcon 
                    className={cn(
                      "h-5 w-5", 
                      post.liked ? "fill-red-500 text-red-500" : ""
                    )} 
                  />
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-1 text-white/70 hover:text-white">
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.comments}</span>
                </button>
                <button className="flex items-center gap-1 text-white/70 hover:text-white">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              <button 
                onClick={() => handleSave(post.id)}
                className={cn(
                  "text-white/70 hover:text-white",
                  post.saved ? "text-yellow-500" : ""
                )}
              >
                <Bookmark className={cn("h-5 w-5", post.saved ? "fill-yellow-500" : "")} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
} 