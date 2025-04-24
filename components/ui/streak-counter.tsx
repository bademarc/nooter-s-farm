"use client"

import { motion } from "framer-motion"
import { Flame } from "lucide-react"

interface StreakCounterProps {
  count: number
  className?: string
}

export function StreakCounter({ count, className = "" }: StreakCounterProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-white ${className}`}
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, repeatType: "loop" }}
      >
        <Flame className="h-4 w-4 text-yellow-300" />
      </motion.div>
      <motion.span
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, repeatType: "loop" }}
        className="font-bold"
      >
        {count} Day Streak!
      </motion.span>
    </motion.div>
  )
} 