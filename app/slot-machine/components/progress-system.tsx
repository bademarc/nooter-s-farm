"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Star, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type ProgressSystemProps = {
  spinCount: number
  winCount: number
}

export default function ProgressSystem({ spinCount, winCount }: ProgressSystemProps) {
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [previousLevel, setPreviousLevel] = useState(1)

  // Calculate XP required for next level
  const getXpForLevel = (lvl: number) => 100 * Math.pow(1.5, lvl - 1)

  // Calculate current level based on XP
  const calculateLevel = (currentXp: number) => {
    let lvl = 1
    let xpRequired = getXpForLevel(lvl)

    while (currentXp >= xpRequired) {
      lvl++
      xpRequired += getXpForLevel(lvl)
    }

    return lvl
  }

  // Calculate XP progress towards next level
  const calculateProgress = (currentXp: number, currentLevel: number) => {
    let totalXpForPreviousLevels = 0
    for (let i = 1; i < currentLevel; i++) {
      totalXpForPreviousLevels += getXpForLevel(i)
    }

    const xpForCurrentLevel = getXpForLevel(currentLevel)
    const progressInCurrentLevel = currentXp - totalXpForPreviousLevels
    return (progressInCurrentLevel / xpForCurrentLevel) * 100
  }

  // Load saved progress
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedXp = localStorage.getItem("playerXp")
      if (savedXp) {
        const parsedXp = Number.parseInt(savedXp)
        setXp(parsedXp)
        setLevel(calculateLevel(parsedXp))
      }
    }
  }, [])

  // Update XP based on spins and wins
  useEffect(() => {
    // Calculate new XP (5 XP per spin, 20 XP per win)
    const newXp = spinCount * 5 + winCount * 20

    if (newXp > xp) {
      // Save previous level for comparison
      setPreviousLevel(level)

      // Update XP
      setXp(newXp)

      // Calculate new level
      const newLevel = calculateLevel(newXp)

      // Check for level up
      if (newLevel > level) {
        setLevel(newLevel)
        setShowLevelUp(true)

        // Hide level up notification after 5 seconds
        setTimeout(() => {
          setShowLevelUp(false)
        }, 5000)
      }

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("playerXp", newXp.toString())
      }
    }
  }, [spinCount, winCount, xp, level])

  // Calculate progress percentage
  const progressPercentage = calculateProgress(xp, level)

  // Calculate XP needed for next level
  const xpForNextLevel = getXpForLevel(level)

  // Calculate XP progress in current level
  const xpInCurrentLevel =
    xp - Array.from({ length: level - 1 }, (_, i) => getXpForLevel(i + 1)).reduce((a, b) => a + b, 0)

  return (
    <div className="w-full">
      {/* Level display */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center mr-2">
            <Star className="w-3 h-3 text-black" />
          </div>
          <span className="text-white text-sm font-medium">Level {level}</span>
        </div>
        <span className="text-xs text-gray-400">
          {xpInCurrentLevel.toFixed(0)}/{xpForNextLevel.toFixed(0)} XP
        </span>
      </div>

      {/* Progress bar */}
      <Progress
        value={progressPercentage}
        className="h-2 bg-gray-800"
        indicatorClassName="bg-gradient-to-r from-amber-500 to-yellow-400"
      />

      {/* Level up notification */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="mt-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black p-2 rounded-md text-sm font-bold flex items-center justify-center"
          >
            <ChevronUp className="w-4 h-4 mr-1" />
            Level Up! {previousLevel} → {level}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
