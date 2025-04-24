"use client"

import { motion } from "framer-motion"
import { Button } from "../components/ui/button"
import { Star, X } from "lucide-react"

interface LevelUpNotificationProps {
  level: number
  onClose: () => void
}

export default function LevelUpNotification({ level, onClose }: LevelUpNotificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed left-0 right-0 top-1/2 z-50 mx-auto w-[90%] max-w-md -translate-y-1/2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-center shadow-[0_0_30px_rgba(139,92,246,0.7)]"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 rounded-full text-white/80 hover:bg-white/20 hover:text-white"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <motion.div
        className="mb-4 flex justify-center"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ duration: 1, repeat: 2 }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <Star className="h-10 w-10 text-yellow-300" />
        </div>
      </motion.div>

      <motion.h2
        className="mb-2 text-2xl font-bold text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        LEVEL UP!
      </motion.h2>

      <motion.div
        className="mb-4 text-4xl font-bold text-yellow-300"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
      >
        Level {level}
      </motion.div>

      <motion.p
        className="mb-6 text-white/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        You've unlocked new rewards and betting options!
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Button className="w-full bg-white font-bold text-purple-600 hover:bg-white/90" onClick={onClose}>
          CONTINUE
        </Button>
      </motion.div>
    </motion.div>
  )
}
