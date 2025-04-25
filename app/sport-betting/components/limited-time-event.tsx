"use client"

import { motion } from "framer-motion"
import { Clock, Zap } from "lucide-react"
import { Button } from "../components/ui/button"

interface LimitedTimeEventProps {
  onClaim: () => void
  activeCurrency: "virtual" | "crypto"
  timeLeft: number
}

export default function LimitedTimeEvent({ onClaim, activeCurrency, timeLeft }: LimitedTimeEventProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-16 left-0 right-0 z-40 mx-auto w-[90%] max-w-md rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 p-4 shadow-[0_0_15px_rgba(219,39,119,0.5)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold">Limited Time Offer!</h3>
              <motion.div
                animate={{
                  color: ["#ffffff", "#ff0000", "#ffffff"],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className="flex items-center gap-1 rounded-full bg-pink-800 px-2 py-0.5 text-xs"
              >
                <Clock className="h-3 w-3" />
                <span>{formatTime(timeLeft)}</span>
              </motion.div>
            </div>
            <p className="text-sm">Claim 2000 Farm Coins now!</p>
          </div>
        </div>
        <Button onClick={onClaim} className="bg-white font-bold text-pink-600 hover:bg-pink-100">
          CLAIM NOW
        </Button>
      </div>
    </motion.div>
  )
}
