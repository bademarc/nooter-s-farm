"use client"

import { motion } from "framer-motion"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PulseNotificationProps {
  count: number
  onClick?: () => void
}

export function PulseNotification({ count, onClick }: PulseNotificationProps) {
  return (
    <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/20" onClick={onClick}>
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white"
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, repeatType: "loop" }}
          >
            {count}
          </motion.span>
        </motion.span>
      )}
    </Button>
  )
} 