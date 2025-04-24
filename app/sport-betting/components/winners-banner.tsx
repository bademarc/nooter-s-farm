"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Bitcoin, Coins, Star } from "lucide-react"

// Sample data for recent winners
const recentWinners = [
  { name: "Alex", amount: 2500, amountBtc: 0.062, game: "Premier League", currency: "virtual", streak: 3 },
  { name: "Sarah", amount: 1800, amountBtc: 0.045, game: "NBA Finals", currency: "crypto", streak: 0 },
  { name: "Mike", amount: 3200, amountBtc: 0.08, game: "Champions League", currency: "virtual", streak: 5 },
  { name: "Jessica", amount: 1500, amountBtc: 0.0375, game: "Tennis Open", currency: "crypto", streak: 2 },
  { name: "David", amount: 4000, amountBtc: 0.1, game: "Formula 1", currency: "virtual", streak: 7 },
]

export default function WinnersBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showHighlight, setShowHighlight] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % recentWinners.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Show highlight animation for big wins or streaks
    if (
      recentWinners[currentIndex].amount > 3000 ||
      recentWinners[currentIndex].amountBtc > 0.07 ||
      recentWinners[currentIndex].streak >= 5
    ) {
      setShowHighlight(true)
      setTimeout(() => setShowHighlight(false), 1500)
    } else {
      setShowHighlight(false)
    }
  }, [currentIndex])

  return (
    <div
      className={`overflow-hidden rounded-lg ${
        showHighlight
          ? "bg-gradient-to-r from-amber-700/80 to-amber-800/80 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
          : "bg-gradient-to-r from-gray-800/80 to-gray-900/80"
      } p-3 backdrop-blur-sm transition-all duration-300`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            showHighlight ? "bg-yellow-500" : "bg-amber-500"
          }`}
        >
          {showHighlight ? <Star className="h-4 w-4 text-white" /> : <Trophy className="h-4 w-4 text-white" />}
        </div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1"
            >
              <span className={`font-bold ${showHighlight ? "text-yellow-300" : "text-amber-400"}`}>
                {recentWinners[currentIndex].name}
              </span>
              <span className="text-gray-300">just won</span>
              <motion.span
                className="flex items-center font-bold text-green-400"
                animate={
                  showHighlight
                    ? {
                        scale: [1, 1.2, 1],
                        color: ["#4ade80", "#fcd34d", "#4ade80"],
                      }
                    : {}
                }
                transition={{ duration: 1 }}
              >
                {recentWinners[currentIndex].currency === "virtual" ? (
                  <>
                    <Coins className="mr-1 h-3 w-3" />
                    {recentWinners[currentIndex].amount}
                  </>
                ) : (
                  <>
                    <Bitcoin className="mr-1 h-3 w-3" />
                    {recentWinners[currentIndex].amountBtc.toFixed(5)}
                  </>
                )}
              </motion.span>
              <span className="text-gray-300">on</span>
              <span className="text-white">{recentWinners[currentIndex].game}</span>

              {recentWinners[currentIndex].streak > 0 && (
                <motion.div
                  className="ml-1 flex items-center gap-0.5 rounded-full bg-red-900/50 px-1.5 py-0.5 text-xs"
                  animate={
                    recentWinners[currentIndex].streak >= 5
                      ? {
                          backgroundColor: [
                            "rgba(127, 29, 29, 0.5)",
                            "rgba(220, 38, 38, 0.5)",
                            "rgba(127, 29, 29, 0.5)",
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1,
                    repeat: recentWinners[currentIndex].streak >= 5 ? Number.POSITIVE_INFINITY : 0,
                  }}
                >
                  <Star className="h-2.5 w-2.5 text-red-400" />
                  <span className="text-red-400">{recentWinners[currentIndex].streak}x</span>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
