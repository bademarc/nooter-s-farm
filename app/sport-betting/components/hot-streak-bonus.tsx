"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "../components/ui/button"
import { Flame } from "lucide-react"

interface HotStreakBonusProps {
  streak: number
  onClaim: () => void
  activeCurrency: "virtual" | "crypto"
}

export default function HotStreakBonus({ streak, onClaim, activeCurrency }: HotStreakBonusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-16 left-0 right-0 z-40 mx-auto w-[90%] max-w-md rounded-lg bg-gradient-to-r from-red-600 to-orange-600 p-4 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500"
            animate={{
              boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 20px rgba(239,68,68,0.8)", "0 0 0px rgba(239,68,68,0)"],
            }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          >
            <Flame className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h3 className="font-bold">
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className="mr-1"
              >
                🔥
              </motion.span>
              {streak} Win Streak!
            </h3>
            <p className="text-sm">Claim {activeCurrency === "virtual" ? "1000 coins" : "0.025 BTC"} bonus</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={onClaim} className="bg-white font-bold text-red-600 hover:bg-red-100">
            CLAIM
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
