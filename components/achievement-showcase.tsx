"use client"

import { useState, useEffect } from "react"
import { Trophy, ChevronRight, ChevronLeft, Star, Gift } from "lucide-react"
import { Card } from "./ui/card"
import { CardContent } from "./ui/card"
import { CardHeader } from "./ui/card"
import { AnimatedProgress } from "./ui/animated-progress"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "../hooks/use-toast"
import { RewardPopup } from "./ui/reward-popup"
import { Confetti } from "./ui/confetti"

// Sample achievements data
const achievements = [
  {
    id: 1,
    title: "Crop Master",
    description: "Harvest 1,000 crops",
    icon: "🌽",
    progress: 85,
    total: 1000,
    current: 850,
    rarity: "Uncommon",
    reward: "500 Farm Coins",
    claimable: false,
  },
  {
    id: 2,
    title: "Animal Whisperer",
    description: "Raise 50 animals to max happiness",
    icon: "🐄",
    progress: 64,
    total: 50,
    current: 32,
    rarity: "Rare",
    reward: "Special Nooter Feed",
    claimable: false,
  },
  {
    id: 3,
    title: "Social Butterfly",
    description: "Make 100 friends in the game",
    icon: "🦋",
    progress: 42,
    total: 100,
    current: 42,
    rarity: "Epic",
    reward: "Exclusive Profile Frame",
    claimable: false,
  },
  {
    id: 4,
    title: "Nooter Champion",
    description: "Win 25 Nooter races",
    icon: "🏆",
    progress: 100,
    total: 25,
    current: 25,
    rarity: "Legendary",
    reward: "Golden Nooter Statue",
    claimable: true,
  },
]

export default function AchievementShowcase() {
  const [currentPage, setCurrentPage] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [claimedRewards, setClaimedRewards] = useState<number[]>([])
  const [rewardPopup, setRewardPopup] = useState<{
    show: boolean
    achievement: (typeof achievements)[0] | null
  }>({ show: false, achievement: null })
  const itemsPerPage = 2
  const totalPages = Math.ceil(achievements.length / itemsPerPage)
  const { toast } = useToast()

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const currentAchievements = achievements.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "text-white/60"
      case "Uncommon":
        return "text-white/70"
      case "Rare":
        return "text-white/80"
      case "Epic":
        return "text-white/90"
      case "Legendary":
        return "text-white"
      default:
        return "text-white/60"
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress < 25) return "bg-white/30"
    if (progress < 50) return "bg-white/50"
    if (progress < 75) return "bg-white/70"
    return "bg-white"
  }

  const handleClaimReward = (achievement: (typeof achievements)[0]) => {
    setRewardPopup({ show: true, achievement })
  }

  const onClaimReward = () => {
    if (rewardPopup.achievement) {
      setClaimedRewards([...claimedRewards, rewardPopup.achievement.id])
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)

      toast({
        title: "Reward Claimed!",
        description: `You've claimed: ${rewardPopup.achievement.reward}`,
        variant: "success",
      })
    }
  }

  // Simulate achievement progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * achievements.length)
      const achievement = achievements[randomIndex]

      if (achievement.progress < 100 && !achievement.claimable) {
        achievement.current = Math.min(achievement.current + 1, achievement.total)
        achievement.progress = Math.round((achievement.current / achievement.total) * 100)

        if (achievement.progress === 100) {
          achievement.claimable = true
          toast({
            title: "Achievement Completed!",
            description: `You've completed: ${achievement.title}`,
            variant: "success",
          })
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3000)
        }
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [toast])

  return (
    <>
      {showConfetti && <Confetti />}
      {rewardPopup.show && rewardPopup.achievement && (
        <RewardPopup
          title={rewardPopup.achievement.title}
          description={`You've completed: ${rewardPopup.achievement.description}`}
          reward={rewardPopup.achievement.reward}
          icon={rewardPopup.achievement.icon}
          onClaim={onClaimReward}
          onClose={() => setRewardPopup({ show: false, achievement: null })}
        />
      )}
      <Card className="bg-[#171717] border border-[#333] rounded-none">
        <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-[#333]">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-white mr-2" />
            <h3 className="text-lg font-semibold text-white">Achievements</h3>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevPage}
              className="h-6 w-6 rounded-none flex items-center justify-center border border-[#333] bg-[#111] text-white hover:bg-[#222]"
              disabled={totalPages <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
            <span className="text-xs text-white/60">
              {currentPage + 1}/{totalPages}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextPage}
              className="h-6 w-6 rounded-none flex items-center justify-center border border-[#333] bg-[#111] text-white hover:bg-[#222]"
              disabled={totalPages <= 1}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {currentAchievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 border border-[#333] p-3 bg-[#111] rounded-none"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="h-12 w-12 flex items-center justify-center border border-[#333] bg-[#171717] text-2xl rounded-none"
                  >
                    {achievement.icon}
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium text-white">{achievement.title}</h4>
                      <span className={`text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mb-1">{achievement.description}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-[#222] flex-1 rounded-none">
                        <div
                          className={`h-full ${getProgressColor(achievement.progress)}`}
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-white/60">
                        {achievement.current}/{achievement.total}
                      </span>
                    </div>
                    {achievement.claimable && !claimedRewards.includes(achievement.id) && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleClaimReward(achievement)}
                        className="mt-2 flex items-center gap-1 text-xs font-medium bg-white text-black px-2 py-1 border-none rounded-none"
                      >
                        <Gift className="h-3 w-3" />
                        Claim Reward
                      </motion.button>
                    )}
                    {claimedRewards.includes(achievement.id) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-white/60"
                      >
                        <Star className="h-3 w-3 text-white" />
                        Reward Claimed
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </>
  )
} 