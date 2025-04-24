"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { cn } from "../lib/utils"
import { motion } from "framer-motion"

export function NotificationDropdown() {
  const [unreadCount, setUnreadCount] = useState(3)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Quest Available",
      message: "Defeat the Dragon in the Misty Mountains",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 2,
      title: "Friend Request",
      message: "NootMaster99 wants to be your friend",
      time: "5 hours ago",
      unread: true,
    },
    {
      id: 3,
      title: "Event Starting Soon",
      message: "The Great Noot Race begins in 1 hour",
      time: "30 minutes ago",
      unread: true,
    },
    {
      id: 4,
      title: "Achievement Unlocked",
      message: "First Steps: Created your profile",
      time: "1 day ago",
      unread: false,
    },
  ])

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification
      )
    )
    setUnreadCount(Math.max(0, unreadCount - 1))
  }

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, unread: false }))
    )
    setUnreadCount(0)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline" 
          size="icon"
          className="relative bg-transparent border-[#333] hover:bg-[#222] hover:border-[#444] text-white rounded-none w-9 h-9"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full"
            >
              {unreadCount}
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="w-80 bg-[#171717] border border-[#333] text-white p-0 rounded-none"
      >
        <div className="flex items-center justify-between p-3 border-b border-[#333]">
          <DropdownMenuLabel className="font-bold">Notifications</DropdownMenuLabel>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={markAllAsRead}
            className="text-xs text-white/70 hover:text-white hover:bg-[#222] h-7 rounded-none"
          >
            Mark all as read
          </Button>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto py-1">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-white/70">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 focus:bg-[#222] hover:bg-[#222] cursor-pointer rounded-none border-l-2",
                  notification.unread ? "border-l-white" : "border-l-transparent"
                )}
              >
                <div className="w-full flex justify-between items-center">
                  <span className={cn(
                    "font-medium", 
                    notification.unread ? "text-white" : "text-white/80"
                  )}>
                    {notification.title}
                  </span>
                  <span className="text-[10px] text-white/60">
                    {notification.time}
                  </span>
                </div>
                <p className="text-sm text-white/70 w-full">
                  {notification.message}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        <DropdownMenuSeparator className="bg-[#333]" />
        <DropdownMenuItem className="p-2 text-center font-medium text-white/80 hover:bg-[#222] focus:bg-[#222] rounded-none cursor-pointer">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 