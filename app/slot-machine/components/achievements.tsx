"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Award, Trophy, Star, Zap, Gift, Target, Crown, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

export type Achievement = {
  id: string
  name: string
  description: string
  icon: React.ElementType
  requirement: number
  currentValue: number
  unlocked: boolean
  color: string
}

type AchievementsProps = {
  spinCount: number
  winCount: number
  biggestWin: number
  totalWinnings: number
  lossStreak: number
  winStreak: number
}

export default function Achievements({
  spinCount,
  winCount,
  biggestWin,
  totalWinnings,
  lossStreak,
  winStreak,
}: AchievementsProps) {
  const [showAchievements, setShowAchievements] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [newUnlock, setNewUnlock] = useState<Achievement | null>(null)

  // Initialize achievements
  useEffect(() => {
    const initialAchievements: Achievement[] = [
      {
        id: "first-spin",
        name: "First Spin",
        description: "Spin the reels for the first time",
        icon: Zap,
        requirement: 1,
        currentValue: spinCount,
        unlocked: spinCount >= 1,
        color: "bg-blue-500",
      },
      {
        id: "regular-player",
        name: "Regular Player",
        description: "Spin the reels 50 times",
        icon: Target,
        requirement: 50,
        currentValue: spinCount,
        unlocked: spinCount >= 50,
        color: "bg-green-500",
      },
      {
        id: "high-roller",
        name: "High Roller",
        description: "Spin the reels 100 times",
        icon: Crown,
        requirement: 100,
        currentValue: spinCount,
        unlocked: spinCount >= 100,
        color: "bg-purple-500",
      },
      {
        id: "first-win",
        name: "First Win",
        description: "Win your first spin",
        icon: Star,
        requirement: 1,
        currentValue: winCount,
        unlocked: winCount >= 1,
        color: "bg-yellow-500",
      },
      {
        id: "lucky-streak",
        name: "Lucky Streak",
        description: "Win 3 times in a row",
        icon: Flame,
        requirement: 3,
        currentValue: winStreak,
        unlocked: winStreak >= 3,
        color: "bg-red-500",
      },
      {
        id: "big-winner",
        name: "Big Winner",
        description: "Win more than 100 credits in a single spin",
        icon: Trophy,
        requirement: 100,
        currentValue: biggestWin,
        unlocked: biggestWin >= 100,
        color: "bg-amber-500",
      },
      {
        id: "jackpot",
        name: "Jackpot",
        description: "Win more than 500 credits in a single spin",
        icon: Award,
        requirement: 500,
        currentValue: biggestWin,
        unlocked: biggestWin >= 500,
        color: "bg-pink-500",
      },
      {
        id: "millionaire",
        name: "Millionaire",
        description: "Accumulate 5000 credits in total winnings",
        icon: Gift,
        requirement: 5000,
        currentValue: totalWinnings,
        unlocked: totalWinnings >= 5000,
        color: "bg-indigo-500",
      },
    ]

    // Load unlocked achievements from localStorage
    if (typeof window !== "undefined") {
      const savedAchievements = localStorage.getItem("slotMachineAchievements")
      if (savedAchievements) {
        try {
          const parsedAchievements = JSON.parse(savedAchievements)
          // Merge saved unlocked state with current values
          initialAchievements.forEach((achievement) => {
            const savedAchievement = parsedAchievements.find((a: Achievement) => a.id === achievement.id)
            if (savedAchievement) {
              achievement.unlocked = savedAchievement.unlocked
            }
          })
        } catch (e) {
          console.error("Error loading saved achievements:", e)
        }
      }
    }

    setAchievements(initialAchievements)
  }, [spinCount, winCount, biggestWin, totalWinnings, lossStreak, winStreak])

  // Update achievements when stats change
  useEffect(() => {
    setAchievements((prevAchievements) => {
      const updatedAchievements = prevAchievements.map((achievement) => {
        let currentValue = achievement.currentValue
        let unlocked = achievement.unlocked

        // Update current values based on the achievement type
        switch (achievement.id) {
          case "first-spin":
          case "regular-player":
          case "high-roller":
            currentValue = spinCount
            break
          case "first-win":
            currentValue = winCount
            break
          case "lucky-streak":
            currentValue = winStreak
            break
          case "big-winner":
          case "jackpot":
            currentValue = biggestWin
            break
          case "millionaire":
            currentValue = totalWinnings
            break
        }

        // Check if achievement is newly unlocked
        const newlyUnlocked = !unlocked && currentValue >= achievement.requirement
        if (newlyUnlocked) {
          unlocked = true
          // Show notification for newly unlocked achievement
          setNewUnlock({ ...achievement, currentValue, unlocked })
        }

        return {
          ...achievement,
          currentValue,
          unlocked,
        }
      })

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("slotMachineAchievements", JSON.stringify(updatedAchievements))
      }

      return updatedAchievements
    })
  }, [spinCount, winCount, biggestWin, totalWinnings, lossStreak, winStreak])

  // Clear new unlock notification after delay
  useEffect(() => {
    if (newUnlock) {
      const timer = setTimeout(() => {
        setNewUnlock(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [newUnlock])

  return (
    <>
      {/* Achievement unlock notification */}
      <AnimatePresence>
        {newUnlock && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-4 max-w-sm w-full"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  newUnlock.color,
                  "animate-pulse-slow",
                )}
              >
                <newUnlock.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-amber-400 font-bold text-lg">Achievement Unlocked!</h4>
                <p className="text-white font-medium">{newUnlock.name}</p>
                <p className="text-gray-300 text-sm">{newUnlock.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievements dialog */}
      <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" /> Achievements
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  "border rounded-lg p-4 transition-all duration-300",
                  achievement.unlocked ? "border-gray-600 bg-gray-800" : "border-gray-800 bg-gray-900 opacity-70",
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      achievement.unlocked ? achievement.color : "bg-gray-700",
                    )}
                  >
                    <achievement.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold">{achievement.name}</h4>
                    <p className="text-sm text-gray-300">{achievement.description}</p>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>
                      {achievement.currentValue}/{achievement.requirement}
                    </span>
                  </div>
                  <Progress
                    value={(achievement.currentValue / achievement.requirement) * 100}
                    className="h-2 bg-gray-700"
                    indicatorClassName={cn(
                      achievement.unlocked ? achievement.color : "bg-gray-500",
                      "transition-all duration-500",
                    )}
                  />
                </div>

                {achievement.unlocked && <div className="mt-2 text-xs text-amber-400 font-medium">✓ Completed</div>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Return the button to open achievements */}
      <button
        onClick={() => setShowAchievements(true)}
        className="flex items-center gap-1 text-white/70 hover:text-white hover:bg-white/10 px-3 py-1 rounded-md text-sm transition-colors"
      >
        <Trophy className="w-4 h-4" /> Achievements
      </button>
    </>
  )
}
