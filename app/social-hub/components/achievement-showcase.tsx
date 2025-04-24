"use client"

import { useState, useEffect } from "react"
import { Trophy, ChevronRight, ChevronLeft, Star, Gift } from "lucide-react"
import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { AnimatedProgress } from "@/components/ui/animated-progress"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { RewardPopup } from "@/components/ui/reward-popup"
import { Confetti } from "@/components/ui/confetti"

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
        return "text-gray-500 dark:text-gray-400"
      case "Uncommon":
        return "text-green-500 dark:text-green-400"
      case "Rare":
        return "text-blue-500 dark:text-blue-400"
      case "Epic":
        return "text-purple-500 dark:text-purple-400"
      case "Legendary":
        return "text-yellow-500 dark:text-yellow-400"
      default:
        return "text-gray-500 dark:text-gray-400"
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress < 25) return "bg-red-500"
    if (progress < 50) return "bg-orange-500"
    if (progress < 75) return "bg-yellow-500"
    return "bg-green-500"
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
  }, [])

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
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold">Achievements</h3>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevPage}
              className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted"
              disabled={totalPages <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
            <span className="text-xs text-muted-foreground">
              {currentPage + 1}/{totalPages}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextPage}
              className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted"
              disabled={totalPages <= 1}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {currentAchievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-2xl"
                  >
                    {achievement.icon}
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium">{achievement.title}</h4>
                      <span className={`text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{achievement.description}</p>
                    <div className="flex items-center gap-2">
                      <AnimatedProgress
                        value={achievement.progress}
                        className="h-2 flex-1"
                        barClassName={getProgressColor(achievement.progress)}
                      />
                      <span className="text-xs text-muted-foreground">
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
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400"
                      >
                        <Gift className="h-3 w-3" />
                        Claim Reward
                      </motion.button>
                    )}
                    {claimedRewards.includes(achievement.id) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground"
                      >
                        <Star className="h-3 w-3 text-yellow-500" />
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
