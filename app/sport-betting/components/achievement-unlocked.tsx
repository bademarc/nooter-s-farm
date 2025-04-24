"use client"

import { motion } from "framer-motion"
import { Trophy } from "lucide-react"
import { Button } from "../components/ui/button"
import { X } from "lucide-react"

interface AchievementUnlockedProps {
  type: string
  onClose: () => void
}

export default function AchievementUnlocked({ type, onClose }: AchievementUnlockedProps) {
  const getAchievementDetails = () => {
    switch (type) {
      case "first_steps":
        return {
          title: "First Steps",
          description: "Place your first 5 bets",
          reward: "+50 XP",
          color: "from-blue-600 to-cyan-600",
        }
      case "winning_streak":
        return {
          title: "Hot Streak",
          description: "Win 3 bets in a row",
          reward: "+100 XP",
          color: "from-amber-600 to-yellow-600",
        }
      default:
        return {
          title: "Achievement Unlocked",
          description: "You've reached a milestone!",
          reward: "+25 XP",
          color: "from-purple-600 to-indigo-600",
        }
    }
  }

  const details = getAchievementDetails()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -50 }}
      className={`fixed left-0 right-0 top-16 z-40 mx-auto w-[90%] max-w-md rounded-lg bg-gradient-to-r ${details.color} p-4 shadow-[0_0_15px_rgba(139,92,246,0.5)]`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Trophy className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <motion.h3
              className="text-lg font-bold text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {details.title}
            </motion.h3>
            <motion.p
              className="text-sm text-white/80"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {details.description}
            </motion.p>
            <motion.div
              className="mt-1 text-sm font-bold text-yellow-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {details.reward}
            </motion.div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-white/80 hover:bg-white/20 hover:text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
