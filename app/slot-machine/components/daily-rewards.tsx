"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Gift, Calendar, Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"

type DailyRewardsProps = {
  onClaimReward: (amount: number) => void
}

export default function DailyRewards({ onClaimReward }: DailyRewardsProps) {
  const [showRewards, setShowRewards] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null)
  const [canClaim, setCanClaim] = useState(false)
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState("")
  const [showNotification, setShowNotification] = useState(false)

  // Daily rewards based on streak
  const dailyRewards = [
    { day: 1, amount: 50, color: "bg-blue-500" },
    { day: 2, amount: 75, color: "bg-green-500" },
    { day: 3, amount: 100, color: "bg-yellow-500" },
    { day: 4, amount: 150, color: "bg-orange-500" },
    { day: 5, amount: 200, color: "bg-red-500" },
    { day: 6, amount: 300, color: "bg-purple-500" },
    { day: 7, amount: 500, color: "bg-pink-500" },
  ]

  // Load saved data
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStreak = localStorage.getItem("dailyRewardStreak")
      const savedLastClaim = localStorage.getItem("dailyRewardLastClaim")

      if (savedStreak) {
        setCurrentStreak(Number.parseInt(savedStreak))
      }

      if (savedLastClaim) {
        setLastClaimDate(savedLastClaim)
      }
    }
  }, [])

  // Check if user can claim reward
  useEffect(() => {
    const checkClaimStatus = () => {
      if (!lastClaimDate) {
        setCanClaim(true)
        return
      }

      const now = new Date()
      const lastClaim = new Date(lastClaimDate)
      const timeDiff = now.getTime() - lastClaim.getTime()
      const hoursDiff = timeDiff / (1000 * 60 * 60)

      // Reset streak if more than 48 hours have passed
      if (hoursDiff > 48) {
        setCurrentStreak(0)
        setCanClaim(true)
        return
      }

      // Can claim if 24 hours have passed
      if (hoursDiff >= 24) {
        setCanClaim(true)
        return
      }

      // Calculate time until next claim
      const nextClaimTime = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000)
      const timeUntilNext = nextClaimTime.getTime() - now.getTime()
      const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60))
      const minutesUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60))

      setTimeUntilNextClaim(`${hoursUntilNext}h ${minutesUntilNext}m`)
      setCanClaim(false)
    }

    checkClaimStatus()
    const interval = setInterval(checkClaimStatus, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [lastClaimDate])

  // Show notification when reward is available
  useEffect(() => {
    if (canClaim && !showNotification) {
      setShowNotification(true)
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [canClaim, showNotification])

  const handleClaimReward = () => {
    if (!canClaim) return

    // Get reward for current day
    const day = (currentStreak % 7) + 1
    const reward = dailyRewards.find((r) => r.day === day)

    if (reward) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6, x: 0.5 },
      })

      // Update streak and last claim date
      const newStreak = currentStreak + 1
      const now = new Date().toISOString()

      setCurrentStreak(newStreak)
      setLastClaimDate(now)
      setCanClaim(false)

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("dailyRewardStreak", newStreak.toString())
        localStorage.setItem("dailyRewardLastClaim", now)
      }

      // Provide reward to parent component
      onClaimReward(reward.amount)
    }
  }

  return (
    <>
      {/* Daily reward notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-amber-500/30 rounded-lg shadow-lg p-4 max-w-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center animate-pulse">
                <Gift className="w-6 h-6 text-black" />
              </div>
              <div>
                <h4 className="text-amber-400 font-bold">Daily Reward Available!</h4>
                <p className="text-white text-sm">Claim your daily bonus now!</p>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowNotification(false)
                    setShowRewards(true)
                  }}
                  className="mt-2 bg-amber-500 hover:bg-amber-600 text-black"
                >
                  Claim Now
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily rewards dialog */}
      <Dialog open={showRewards} onOpenChange={setShowRewards}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Calendar className="w-6 h-6 text-amber-400" /> Daily Rewards
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {/* Current streak */}
            <div className="text-center mb-6">
              <p className="text-gray-400">Current Streak</p>
              <h3 className="text-3xl font-bold text-amber-400">{currentStreak} Days</h3>
              <p className="text-sm text-gray-300 mt-1">
                {canClaim ? "Claim your daily reward now!" : `Next reward in ${timeUntilNextClaim}`}
              </p>
            </div>

            {/* Rewards calendar */}
            <div className="grid grid-cols-7 gap-2">
              {dailyRewards.map((reward, index) => {
                const isToday = (currentStreak % 7) + 1 === reward.day
                const isClaimed = currentStreak >= reward.day && !isToday
                const isNext = !canClaim ? false : isToday

                return (
                  <div
                    key={reward.day}
                    className={cn(
                      "relative rounded-lg p-3 flex flex-col items-center justify-center border",
                      isToday && canClaim
                        ? "border-amber-500 bg-amber-500/20 animate-pulse"
                        : isClaimed
                          ? "border-gray-600 bg-gray-800"
                          : "border-gray-800 bg-gray-900/50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center mb-1",
                        isClaimed ? "bg-green-500" : reward.color,
                      )}
                    >
                      {isClaimed ? <Check className="w-4 h-4 text-white" /> : <span>Day {reward.day}</span>}
                    </div>
                    <span className="text-lg font-bold">${reward.amount}</span>
                    {isNext && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Claim button */}
            <Button
              className={cn(
                "w-full mt-6 py-6 text-lg font-bold",
                canClaim
                  ? "bg-amber-500 hover:bg-amber-600 text-black"
                  : "bg-gray-700 text-gray-300 cursor-not-allowed",
              )}
              onClick={handleClaimReward}
              disabled={!canClaim}
            >
              {canClaim ? (
                <>
                  <Gift className="w-5 h-5 mr-2" /> Claim Daily Reward
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 mr-2" /> Come Back Tomorrow
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return the button to open daily rewards */}
      <button
        onClick={() => setShowRewards(true)}
        className={cn(
          "flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors",
          canClaim
            ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 animate-pulse"
            : "text-white/70 hover:text-white hover:bg-white/10",
        )}
      >
        <Gift className="w-4 h-4" /> {canClaim ? "Claim Reward!" : "Daily Reward"}
      </button>
    </>
  )
}
