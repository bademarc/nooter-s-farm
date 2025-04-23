"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Gift, X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"

type VariableRewardsProps = {
  spinCount: number
  onReward: (amount: number) => void
}

export default function VariableRewards({ spinCount, onReward }: VariableRewardsProps) {
  const [showReward, setShowReward] = useState(false)
  const [lastRewardSpin, setLastRewardSpin] = useState(0)
  const [rewardAmount, setRewardAmount] = useState(0)
  const [rewardTier, setRewardTier] = useState(0)

  // Check for random rewards
  useEffect(() => {
    // Only check for rewards every 5 spins and if at least 10 spins since last reward
    if (spinCount % 5 === 0 && spinCount > 0 && spinCount - lastRewardSpin >= 10) {
      // 30% chance of getting a reward
      const randomChance = Math.random()
      if (randomChance < 0.3) {
        generateReward()
      }
    }
  }, [spinCount, lastRewardSpin])

  const generateReward = () => {
    // Determine reward tier (1-5)
    // Higher tiers are rarer
    const tierRandom = Math.random()
    let tier = 1

    if (tierRandom < 0.01) {
      tier = 5 // 1% chance - mega reward
    } else if (tierRandom < 0.05) {
      tier = 4 // 4% chance - huge reward
    } else if (tierRandom < 0.15) {
      tier = 3 // 10% chance - big reward
    } else if (tierRandom < 0.4) {
      tier = 2 // 25% chance - medium reward
    }

    // Calculate reward amount based on tier
    const baseAmount = 50
    const multiplier = Math.pow(2, tier - 1)
    const variability = 0.2 // 20% variability

    // Add some randomness to the reward amount
    const randomFactor = 1 + (Math.random() * variability * 2 - variability)
    const amount = Math.round(baseAmount * multiplier * randomFactor)

    setRewardTier(tier)
    setRewardAmount(amount)
    setShowReward(true)
    setLastRewardSpin(spinCount)
  }

  const claimReward = () => {
    // Trigger confetti based on tier
    const particleCount = 50 * rewardTier

    confetti({
      particleCount,
      spread: 70,
      origin: { y: 0.6, x: 0.5 },
      colors: ["#FFD700", "#FFA500", "#FF4500", "#FF6347", "#FF8C00"],
    })

    // Pass reward to parent component
    onReward(rewardAmount)

    // Close dialog
    setShowReward(false)
  }

  return (
    <>
      {/* Mystery reward dialog */}
      <Dialog open={showReward} onOpenChange={setShowReward}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 p-0 overflow-hidden max-w-md">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 text-gray-400 hover:text-white hover:bg-white/10"
            onClick={() => setShowReward(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="relative">
            {/* Background effects based on tier */}
            <div
              className={cn(
                "absolute inset-0",
                rewardTier === 1 && "bg-gradient-to-b from-blue-500/20 to-blue-700/20",
                rewardTier === 2 && "bg-gradient-to-b from-green-500/20 to-green-700/20",
                rewardTier === 3 && "bg-gradient-to-b from-purple-500/20 to-purple-700/20",
                rewardTier === 4 && "bg-gradient-to-b from-amber-500/20 to-amber-700/20",
                rewardTier === 5 && "bg-gradient-to-b from-pink-500/20 to-pink-700/20",
              )}
            >
              {/* Animated particles */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute w-2 h-2 rounded-full opacity-60 animate-float-slow",
                      rewardTier === 1 && "bg-blue-500",
                      rewardTier === 2 && "bg-green-500",
                      rewardTier === 3 && "bg-purple-500",
                      rewardTier === 4 && "bg-amber-500",
                      rewardTier === 5 && "bg-pink-500",
                    )}
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDuration: `${5 + Math.random() * 10}s`,
                      animationDelay: `${Math.random() * 5}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="relative z-10 p-8 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <div className="mb-4">
                  <div
                    className={cn(
                      "w-24 h-24 rounded-full mx-auto flex items-center justify-center",
                      rewardTier === 1 && "bg-blue-500",
                      rewardTier === 2 && "bg-green-500",
                      rewardTier === 3 && "bg-purple-500",
                      rewardTier === 4 && "bg-amber-500",
                      rewardTier === 5 && "bg-pink-500",
                    )}
                  >
                    <Gift className="w-12 h-12 text-white" />
                  </div>
                </div>

                <h3
                  className={cn(
                    "text-2xl font-bold mb-2",
                    rewardTier === 1 && "text-blue-400",
                    rewardTier === 2 && "text-green-400",
                    rewardTier === 3 && "text-purple-400",
                    rewardTier === 4 && "text-amber-400",
                    rewardTier === 5 && "text-pink-400",
                  )}
                >
                  {rewardTier === 1 && "Lucky Bonus!"}
                  {rewardTier === 2 && "Special Reward!"}
                  {rewardTier === 3 && "Amazing Prize!"}
                  {rewardTier === 4 && "Incredible Jackpot!"}
                  {rewardTier === 5 && "MEGA FORTUNE BONUS!"}
                </h3>

                <p className="text-gray-300 mb-6">You've received a mystery reward!</p>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className={cn(
                    "text-4xl font-bold mb-8",
                    rewardTier === 1 && "text-blue-400",
                    rewardTier === 2 && "text-green-400",
                    rewardTier === 3 && "text-purple-400",
                    rewardTier === 4 && "text-amber-400",
                    rewardTier === 5 && "text-pink-400",
                  )}
                >
                  ${rewardAmount}
                </motion.div>

                <Button
                  onClick={claimReward}
                  className={cn(
                    "w-full py-6 text-lg font-bold",
                    rewardTier === 1 && "bg-blue-500 hover:bg-blue-600",
                    rewardTier === 2 && "bg-green-500 hover:bg-green-600",
                    rewardTier === 3 && "bg-purple-500 hover:bg-purple-600",
                    rewardTier === 4 && "bg-amber-500 hover:bg-amber-600 text-black",
                    rewardTier === 5 && "bg-pink-500 hover:bg-pink-600",
                  )}
                >
                  Claim Reward <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
