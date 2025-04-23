"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  CircleDollarSign,
  Coins,
  Bitcoin,
  Gem,
  CreditCard,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Sparkles,
  Settings,
  Flame,
  Trophy,
  Zap,
  Rocket,
  Share2,
  Users,
  Award,
  Gift,
  Calendar,
  Star,
  ChevronUp,
  Heart,
  MessageSquare,
  BarChart,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import confetti from "canvas-confetti"
import { useMobile } from "@/hooks/use-mobile"

// Define coin symbols
const SYMBOLS = [
  { id: "dollar", icon: CircleDollarSign, value: 10, color: "text-green-500", bgColor: "bg-green-500" },
  { id: "bitcoin", icon: Bitcoin, value: 50, color: "text-amber-500", bgColor: "bg-amber-500" },
  { id: "coins", icon: Coins, value: 20, color: "text-yellow-400", bgColor: "bg-yellow-400" },
  { id: "creditcard", icon: CreditCard, value: 15, color: "text-blue-400", bgColor: "bg-blue-400" },
  { id: "gem", icon: Gem, value: 30, color: "text-purple-400", bgColor: "bg-purple-400" },
]

// Define special effects for different win tiers
const WIN_TIERS = [
  { threshold: 0, icon: null, name: "", color: "from-green-600 to-emerald-500" },
  { threshold: 50, icon: Flame, name: "HOT WIN", color: "from-orange-500 to-red-500" },
  { threshold: 100, icon: Zap, name: "SUPER WIN", color: "from-blue-500 to-purple-600" },
  { threshold: 200, icon: Trophy, name: "MEGA WIN", color: "from-amber-500 to-yellow-500" },
  { threshold: 500, icon: Rocket, name: "INSANE WIN", color: "from-pink-500 to-rose-600" },
]

// Define achievements
const ACHIEVEMENTS = [
  { id: "first_win", name: "First Win", description: "Win your first game", icon: Star, color: "bg-green-500" },
  {
    id: "big_win",
    name: "Big Winner",
    description: "Win more than 100 credits in a single spin",
    icon: Zap,
    color: "bg-blue-500",
  },
  { id: "jackpot", name: "Jackpot King", description: "Hit the mega jackpot", icon: Crown, color: "bg-amber-500" },
  { id: "streak_5", name: "Hot Streak", description: "Win 5 times in a row", icon: Flame, color: "bg-orange-500" },
  {
    id: "spins_50",
    name: "Dedicated Player",
    description: "Spin the reels 50 times",
    icon: Award,
    color: "bg-purple-500",
  },
  {
    id: "spins_100",
    name: "Slot Enthusiast",
    description: "Spin the reels 100 times",
    icon: Trophy,
    color: "bg-indigo-500",
  },
  {
    id: "daily_7",
    name: "Weekly Regular",
    description: "Collect 7 daily rewards",
    icon: Calendar,
    color: "bg-teal-500",
  },
  {
    id: "social_share",
    name: "Social Butterfly",
    description: "Share your first big win",
    icon: Share2,
    color: "bg-pink-500",
  },
]

// Define levels
const LEVELS = [
  { level: 1, xpRequired: 0, reward: 50, color: "bg-gray-500" },
  { level: 2, xpRequired: 100, reward: 100, color: "bg-green-500" },
  { level: 3, xpRequired: 250, reward: 150, color: "bg-blue-500" },
  { level: 4, xpRequired: 500, reward: 200, color: "bg-purple-500" },
  { level: 5, xpRequired: 1000, reward: 250, color: "bg-amber-500" },
  { level: 6, xpRequired: 2000, reward: 300, color: "bg-orange-500" },
  { level: 7, xpRequired: 3500, reward: 350, color: "bg-red-500" },
  { level: 8, xpRequired: 5000, reward: 400, color: "bg-pink-500" },
  { level: 9, xpRequired: 7500, reward: 450, color: "bg-indigo-500" },
  { level: 10, xpRequired: 10000, reward: 1000, color: "bg-violet-500" },
]

// Mock leaderboard data
const LEADERBOARD = [
  { id: 1, name: "JackpotKing", score: 25000, avatar: "👑" },
  { id: 2, name: "LuckySpinner", score: 18750, avatar: "🍀" },
  { id: 3, name: "GoldenTouch", score: 15200, avatar: "✨" },
  { id: 4, name: "SlotMaster", score: 12800, avatar: "🎯" },
  { id: 5, name: "FortuneSeeker", score: 10500, avatar: "🔮" },
  { id: 6, name: "You", score: 0, avatar: "😎", isPlayer: true },
  { id: 7, name: "CasinoRoyal", score: 8200, avatar: "🎲" },
  { id: 8, name: "LuckyCharm", score: 7500, avatar: "🎰" },
  { id: 9, name: "RichQuick", score: 6800, avatar: "💰" },
  { id: 10, name: "SpinDoctor", score: 5900, avatar: "🌀" },
]

// Mock social feed
const SOCIAL_FEED = [
  { id: 1, name: "JackpotKing", avatar: "👑", win: 5000, likes: 128, comments: 24, time: "2h ago" },
  { id: 2, name: "LuckySpinner", avatar: "🍀", win: 2500, likes: 87, comments: 12, time: "5h ago" },
  { id: 3, name: "GoldenTouch", avatar: "✨", win: 1800, likes: 65, comments: 8, time: "8h ago" },
  { id: 4, name: "SlotMaster", avatar: "🎯", win: 1200, likes: 42, comments: 5, time: "12h ago" },
  { id: 5, name: "FortuneSeeker", avatar: "🔮", win: 950, likes: 36, comments: 3, time: "1d ago" },
]

// Custom Crown icon
function Crown(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  )
}

export default function SlotMachine() {
  const [balance, setBalance] = useState(1000)
  const [bet, setBet] = useState(10)
  const [reels, setReels] = useState([
    { spinning: false, symbol: SYMBOLS[0], position: 0, symbols: [], stopDelay: 0 },
    { spinning: false, symbol: SYMBOLS[1], position: 0, symbols: [], stopDelay: 0 },
    { spinning: false, symbol: SYMBOLS[2], position: 0, symbols: [], stopDelay: 0 },
  ])
  const [isSpinning, setIsSpinning] = useState(false)
  const [winAmount, setWinAmount] = useState(0)
  const [showWin, setShowWin] = useState(false)
  const [muted, setMuted] = useState(false)
  const [jackpotMode, setJackpotMode] = useState(false)
  const [winningLines, setWinningLines] = useState<number[]>([])
  const [autoSpin, setAutoSpin] = useState(false)
  const [autoSpinCount, setAutoSpinCount] = useState(0)
  const [maxAutoSpins, setMaxAutoSpins] = useState(50)
  const [spinCount, setSpinCount] = useState(0)
  const [totalWinnings, setTotalWinnings] = useState(0)
  const [biggestWin, setBiggestWin] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [winTier, setWinTier] = useState(0)
  const [lossStreak, setLossStreak] = useState(0)
  const [winStreak, setWinStreak] = useState(0)
  const [showLossEffect, setShowLossEffect] = useState(false)
  const [nearMiss, setNearMiss] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [lastResults, setLastResults] = useState<Array<{ win: boolean; amount: number }>>([])
  const [showIntro, setShowIntro] = useState(true)

  // New dopamine-triggering features
  const [showSocial, setShowSocial] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showDailyReward, setShowDailyReward] = useState(false)
  const [dailyRewardAvailable, setDailyRewardAvailable] = useState(true)
  const [dailyRewardStreak, setDailyRewardStreak] = useState(1)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [showNotification, setShowNotification] = useState(false)
  const [notification, setNotification] = useState({ title: "", message: "", icon: null })
  const [jackpot, setJackpot] = useState(5000)
  const [showShareWin, setShowShareWin] = useState(false)
  const [shareWinAmount, setShareWinAmount] = useState(0)
  const [showRandomBonus, setShowRandomBonus] = useState(false)
  const [randomBonusAmount, setRandomBonusAmount] = useState(0)
  const [bonusMultiplier, setBonusMultiplier] = useState(1)
  const [showBonusMultiplier, setShowBonusMultiplier] = useState(false)
  const [bonusMultiplierTimer, setBonusMultiplierTimer] = useState(0)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [playerRank, setPlayerRank] = useState(6)
  const [leaderboardData, setLeaderboardData] = useState(LEADERBOARD)
  const [socialFeed, setSocialFeed] = useState(SOCIAL_FEED)
  const [notifications, setNotifications] = useState(0)

  // Audio refs
  const spinSound = useRef<HTMLAudioElement | null>(null)
  const winSound = useRef<HTMLAudioElement | null>(null)
  const jackpotSound = useRef<HTMLAudioElement | null>(null)
  const reelStopSound = useRef<HTMLAudioElement | null>(null)
  const clickSound = useRef<HTMLAudioElement | null>(null)
  const coinSound = useRef<HTMLAudioElement | null>(null)
  const lossSound = useRef<HTMLAudioElement | null>(null)
  const nearMissSound = useRef<HTMLAudioElement | null>(null)
  const levelUpSound = useRef<HTMLAudioElement | null>(null)
  const achievementSound = useRef<HTMLAudioElement | null>(null)
  const bonusSound = useRef<HTMLAudioElement | null>(null)

  // Other refs
  const machineRef = useRef<HTMLDivElement>(null)
  const autoSpinRef = useRef<NodeJS.Timeout | null>(null)
  const bonusMultiplierRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const isMobile = useMobile()

  // Initialize audio elements
  useEffect(() => {
    spinSound.current = new Audio("/spin-sound.mp3")
    winSound.current = new Audio("/win-sound.mp3")
    jackpotSound.current = new Audio("/jackpot-sound.mp3")
    reelStopSound.current = new Audio("/reel-stop.mp3")
    clickSound.current = new Audio("/click-sound.mp3")
    coinSound.current = new Audio("/coin-sound.mp3")
    lossSound.current = new Audio("/loss-sound.mp3")
    nearMissSound.current = new Audio("/near-miss.mp3")
    levelUpSound.current = new Audio("/level-up.mp3")
    achievementSound.current = new Audio("/achievement.mp3")
    bonusSound.current = new Audio("/bonus.mp3")

    // Hide intro after 3 seconds
    const timer = setTimeout(() => {
      setShowIntro(false)
      checkDailyReward()
    }, 3000)

    return () => {
      clearTimeout(timer)
      if (spinSound.current) spinSound.current = null
      if (winSound.current) winSound.current = null
      if (jackpotSound.current) jackpotSound.current = null
      if (reelStopSound.current) reelStopSound.current = null
      if (clickSound.current) clickSound.current = null
      if (coinSound.current) coinSound.current = null
      if (lossSound.current) lossSound.current = null
      if (nearMissSound.current) nearMissSound.current = null
      if (levelUpSound.current) levelUpSound.current = null
      if (achievementSound.current) achievementSound.current = null
      if (bonusSound.current) bonusSound.current = null

      if (autoSpinRef.current) {
        clearTimeout(autoSpinRef.current)
      }

      if (bonusMultiplierRef.current) {
        clearTimeout(bonusMultiplierRef.current)
      }
    }
  }, [])

  // Save game state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "slotMachineState",
        JSON.stringify({
          balance,
          totalWinnings,
          biggestWin,
          spinCount,
          xp,
          level,
          unlockedAchievements,
          dailyRewardStreak,
          lastDailyReward: localStorage.getItem("lastDailyReward") || null,
        }),
      )

      // Update player score in leaderboard
      setLeaderboardData((prev) =>
        prev
          .map((player) => (player.isPlayer ? { ...player, score: Math.floor(totalWinnings) } : player))
          .sort((a, b) => b.score - a.score),
      )

      // Update player rank
      const newLeaderboard = [...leaderboardData].sort((a, b) => b.score - a.score)
      const playerIndex = newLeaderboard.findIndex((player) => player.isPlayer)
      if (playerIndex !== -1) {
        setPlayerRank(playerIndex + 1)
      }
    }
  }, [
    balance,
    totalWinnings,
    biggestWin,
    spinCount,
    xp,
    level,
    unlockedAchievements,
    dailyRewardStreak,
    leaderboardData,
  ])

  // Load game state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("slotMachineState")
      if (savedState) {
        try {
          const { balance, totalWinnings, biggestWin, spinCount, xp, level, unlockedAchievements, dailyRewardStreak } =
            JSON.parse(savedState)

          setBalance(balance)
          setTotalWinnings(totalWinnings)
          setBiggestWin(biggestWin)
          setSpinCount(spinCount)
          setXp(xp || 0)
          setLevel(level || 1)
          setUnlockedAchievements(unlockedAchievements || [])
          setDailyRewardStreak(dailyRewardStreak || 1)

          // Update leaderboard with player score
          setLeaderboardData((prev) =>
            prev
              .map((player) => (player.isPlayer ? { ...player, score: Math.floor(totalWinnings) } : player))
              .sort((a, b) => b.score - a.score),
          )
        } catch (e) {
          console.error("Error loading saved state:", e)
        }
      }
    }
  }, [])

  // Handle auto-spin
  useEffect(() => {
    if (autoSpin && !isSpinning && balance >= bet && (maxAutoSpins === 0 || autoSpinCount < maxAutoSpins)) {
      autoSpinRef.current = setTimeout(() => {
        spin()
        setAutoSpinCount((prev) => prev + 1)
      }, 1000)
    } else if (autoSpin && (balance < bet || (maxAutoSpins > 0 && autoSpinCount >= maxAutoSpins))) {
      setAutoSpin(false)
      setAutoSpinCount(0)
      toast({
        title: "Auto-spin stopped",
        description:
          balance < bet ? "Your balance is too low to continue auto-spin." : "Reached maximum number of auto-spins.",
        variant: "default",
      })
    }

    return () => {
      if (autoSpinRef.current) {
        clearTimeout(autoSpinRef.current)
      }
    }
  }, [autoSpin, isSpinning, balance, bet, autoSpinCount, maxAutoSpins, toast])

  // Reset loss effect after a delay
  useEffect(() => {
    if (showLossEffect) {
      const timer = setTimeout(() => {
        setShowLossEffect(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showLossEffect])

  // Reset near miss effect after a delay
  useEffect(() => {
    if (nearMiss) {
      const timer = setTimeout(() => {
        setNearMiss(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [nearMiss])

  // Handle bonus multiplier timer
  useEffect(() => {
    if (bonusMultiplier > 1 && bonusMultiplierTimer > 0) {
      const timer = setInterval(() => {
        setBonusMultiplierTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setBonusMultiplier(1)
            setShowBonusMultiplier(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [bonusMultiplier, bonusMultiplierTimer])

  // Check for level up
  useEffect(() => {
    const currentLevel = getCurrentLevel(xp)
    if (currentLevel > level) {
      // Level up!
      const levelData = LEVELS.find((l) => l.level === currentLevel)
      if (levelData) {
        setLevel(currentLevel)
        setShowLevelUp(true)
        playSound(levelUpSound.current)

        // Award level up bonus
        setBalance((prev) => prev + levelData.reward)

        // Show notification
        showNotificationMessage({
          title: `Level Up! Level ${currentLevel}`,
          message: `You've reached level ${currentLevel} and earned ${levelData.reward} credits!`,
          icon: ChevronUp,
        })
      }
    }
  }, [xp, level])

  // Increase jackpot with each spin
  useEffect(() => {
    if (isSpinning) {
      setJackpot((prev) => prev + bet * 0.01)
    }
  }, [isSpinning, bet])

  // Random chance for bonus multiplier
  useEffect(() => {
    if (isSpinning && Math.random() < 0.05 && bonusMultiplier === 1) {
      // 5% chance to get a bonus multiplier
      const newMultiplier = [1.5, 2, 2.5, 3][Math.floor(Math.random() * 4)]
      const duration = [3, 5, 7, 10][Math.floor(Math.random() * 4)]

      setBonusMultiplier(newMultiplier)
      setBonusMultiplierTimer(duration)
      setShowBonusMultiplier(true)
      playSound(bonusSound.current)

      showNotificationMessage({
        title: "Bonus Multiplier!",
        message: `${newMultiplier}x multiplier active for ${duration} seconds!`,
        icon: Zap,
      })
    }
  }, [isSpinning])

  // Check for achievements
  const checkAchievements = () => {
    const newAchievements: string[] = []

    // First win
    if (!unlockedAchievements.includes("first_win") && totalWinnings > 0) {
      newAchievements.push("first_win")
    }

    // Big win
    if (!unlockedAchievements.includes("big_win") && winAmount >= 100) {
      newAchievements.push("big_win")
    }

    // Jackpot
    if (!unlockedAchievements.includes("jackpot") && winAmount >= 500) {
      newAchievements.push("jackpot")
    }

    // Win streak
    if (!unlockedAchievements.includes("streak_5") && winStreak >= 5) {
      newAchievements.push("streak_5")
    }

    // Spin count
    if (!unlockedAchievements.includes("spins_50") && spinCount >= 50) {
      newAchievements.push("spins_50")
    }

    if (!unlockedAchievements.includes("spins_100") && spinCount >= 100) {
      newAchievements.push("spins_100")
    }

    // Daily rewards
    if (!unlockedAchievements.includes("daily_7") && dailyRewardStreak >= 7) {
      newAchievements.push("daily_7")
    }

    // Unlock new achievements
    if (newAchievements.length > 0) {
      setUnlockedAchievements((prev) => [...prev, ...newAchievements])

      // Show notification for the first achievement
      const achievementId = newAchievements[0]
      const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId)

      if (achievement) {
        playSound(achievementSound.current)

        showNotificationMessage({
          title: "Achievement Unlocked!",
          message: achievement.name,
          icon: achievement.icon,
        })

        // Award XP for achievement
        addXp(50)
      }

      // Increment notifications
      setNotifications((prev) => prev + newAchievements.length)
    }
  }

  // Check for daily reward
  const checkDailyReward = () => {
    const lastReward = localStorage.getItem("lastDailyReward")
    const today = new Date().toDateString()

    if (lastReward !== today) {
      setDailyRewardAvailable(true)

      // Check if streak should continue or reset
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayString = yesterday.toDateString()

      if (lastReward !== yesterdayString && lastReward !== null) {
        // Reset streak if more than a day has passed
        setDailyRewardStreak(1)
      }

      // Show daily reward popup after a short delay
      setTimeout(() => {
        setShowDailyReward(true)
      }, 1500)
    } else {
      setDailyRewardAvailable(false)
    }
  }

  // Claim daily reward
  const claimDailyReward = () => {
    const baseReward = 50
    const bonusReward = Math.floor(dailyRewardStreak * 10)
    const totalReward = baseReward + bonusReward

    // Add reward to balance
    setBalance((prev) => prev + totalReward)

    // Mark as claimed
    localStorage.setItem("lastDailyReward", new Date().toDateString())
    setDailyRewardAvailable(false)

    // Increment streak
    setDailyRewardStreak((prev) => prev + 1)

    // Add XP
    addXp(25)

    // Close dialog
    setShowDailyReward(false)

    // Show toast
    toast({
      title: "Daily Reward Claimed!",
      description: `You received ${totalReward} credits (${baseReward} + ${bonusReward} streak bonus)`,
      variant: "default",
      className: "bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold",
    })

    // Check achievements
    checkAchievements()

    playSound(coinSound.current)
  }

  // Get current level based on XP
  const getCurrentLevel = (currentXp: number) => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (currentXp >= LEVELS[i].xpRequired) {
        return LEVELS[i].level
      }
    }
    return 1
  }

  // Get XP progress to next level
  const getXpProgress = () => {
    const currentLevelData = LEVELS.find((l) => l.level === level)
    const nextLevelData = LEVELS.find((l) => l.level === level + 1)

    if (!currentLevelData || !nextLevelData) return 100

    const currentLevelXp = currentLevelData.xpRequired
    const nextLevelXp = nextLevelData.xpRequired
    const xpRange = nextLevelXp - currentLevelXp
    const xpProgress = xp - currentLevelXp

    return Math.min(100, Math.floor((xpProgress / xpRange) * 100))
  }

  // Add XP with animation
  const addXp = (amount: number) => {
    setXp((prev) => prev + amount)
  }

  // Show notification message
  const showNotificationMessage = ({ title, message, icon }) => {
    setNotification({ title, message, icon })
    setShowNotification(true)

    setTimeout(() => {
      setShowNotification(false)
    }, 3000)
  }

  // Random bonus chance
  const checkRandomBonus = () => {
    // 2% chance for random bonus after a loss
    if (Math.random() < 0.02) {
      const bonusAmount = Math.floor(bet * (Math.random() * 3 + 1))
      setRandomBonusAmount(bonusAmount)
      setShowRandomBonus(true)
      playSound(bonusSound.current)

      // Add to balance
      setBalance((prev) => prev + bonusAmount)

      // Show notification
      showNotificationMessage({
        title: "Surprise Bonus!",
        message: `You received a random bonus of ${bonusAmount} credits!`,
        icon: Gift,
      })

      // Add XP
      addXp(10)

      setTimeout(() => {
        setShowRandomBonus(false)
      }, 3000)
    }
  }

  // Share win on social
  const shareWin = () => {
    // Add to social feed
    const newPost = {
      id: Date.now(),
      name: "You",
      avatar: "😎",
      win: shareWinAmount,
      likes: 0,
      comments: 0,
      time: "Just now",
    }

    setSocialFeed((prev) => [newPost, ...prev])

    // Close dialog
    setShowShareWin(false)

    // Unlock achievement if first share
    if (!unlockedAchievements.includes("social_share")) {
      setUnlockedAchievements((prev) => [...prev, "social_share"])

      // Show notification
      const achievement = ACHIEVEMENTS.find((a) => a.id === "social_share")
      if (achievement) {
        playSound(achievementSound.current)

        showNotificationMessage({
          title: "Achievement Unlocked!",
          message: achievement.name,
          icon: achievement.icon,
        })

        // Award XP for achievement
        addXp(50)
      }
    }

    // Show toast
    toast({
      title: "Win Shared!",
      description: "Your win has been shared with other players!",
      variant: "default",
    })
  }

  const playSound = (sound: HTMLAudioElement | null) => {
    if (sound && !muted) {
      sound.currentTime = 0
      sound.play().catch((e) => console.error("Error playing sound:", e))
    }
  }

  const increaseBet = () => {
    playSound(clickSound.current)
    if (bet < 100 && bet < balance) {
      setBet((prev) => Math.min(prev + 5, 100, balance))
    }
  }

  const decreaseBet = () => {
    playSound(clickSound.current)
    if (bet > 5) {
      setBet((prev) => Math.max(prev - 5, 5))
    }
  }

  const toggleAutoSpin = () => {
    playSound(clickSound.current)
    if (!autoSpin) {
      setAutoSpinCount(0)
    }
    setAutoSpin(!autoSpin)
  }

  const stopAutoSpin = () => {
    playSound(clickSound.current)
    setAutoSpin(false)
    setAutoSpinCount(0)
  }

  const getWinTier = (amount: number) => {
    for (let i = WIN_TIERS.length - 1; i >= 0; i--) {
      if (amount >= WIN_TIERS[i].threshold) {
        return i
      }
    }
    return 0
  }

  const triggerWinAnimation = (multiplier: number, tier: number) => {
    if (!machineRef.current) return

    // Create confetti explosion
    const rect = machineRef.current.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    // First confetti burst
    confetti({
      particleCount: multiplier * 30,
      spread: 70,
      origin: { x: x / window.innerWidth, y: y / window.innerHeight },
      colors: ["#FFD700", "#FFA500", "#FF4500", "#32CD32", "#1E90FF"],
    })

    // Second confetti burst with delay
    setTimeout(() => {
      confetti({
        particleCount: multiplier * 20,
        spread: 90,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        colors: ["#FFD700", "#FFA500", "#FF4500", "#32CD32", "#1E90FF"],
      })
    }, 300)

    // For mega wins, add more confetti bursts
    if (tier >= 3) {
      setTimeout(() => {
        confetti({
          particleCount: multiplier * 40,
          spread: 120,
          origin: { x: x / window.innerWidth, y: y / window.innerHeight },
          colors: ["#FFD700", "#FFA500", "#FF4500", "#32CD32", "#1E90FF"],
          shapes: ["circle", "square"],
        })
      }, 600)
    }

    // Add pulsing glow effect to the machine
    machineRef.current.classList.add("win-pulse")
    setTimeout(() => {
      if (machineRef.current) {
        machineRef.current.classList.remove("win-pulse")
      }
    }, 3000)
  }

  const generateReelSymbols = () => {
    // Generate a sequence of symbols for each reel
    return reels.map((_, reelIndex) => {
      // Create an array of 20 random symbols for the spinning animation
      const symbols = Array.from({ length: 20 }, () => {
        return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      })

      return symbols
    })
  }

  const checkForNearMiss = (symbols: string[]) => {
    // Check if two symbols are the same (potential near miss)
    const counts: Record<string, number> = {}
    symbols.forEach((symbol) => {
      counts[symbol] = (counts[symbol] || 0) + 1
    })

    return Object.values(counts).includes(2)
  }

  const spin = () => {
    // Check if player has enough balance
    if (balance < bet) {
      toast({
        title: "Insufficient funds",
        description: "Please add more credits or lower your bet.",
        variant: "destructive",
      })
      return
    }

    // Increment spin count
    setSpinCount((prev) => prev + 1)

    // Reset previous win state
    setJackpotMode(false)
    setWinAmount(0)
    setShowWin(false)
    setWinningLines([])
    setWinTier(0)
    setNearMiss(false)

    // Deduct bet from balance
    setBalance((prev) => prev - bet)
    setIsSpinning(true)
    playSound(spinSound.current)

    // Generate symbols for each reel
    const reelSymbols = generateReelSymbols()

    // Set all reels to spinning with random positions and stop delays
    setReels(
      reels.map((reel, index) => ({
        ...reel,
        spinning: true,
        position: Math.floor(Math.random() * 20), // Random starting position for animation
        symbols: reelSymbols[index],
        stopDelay: 800 + index * 600 + Math.random() * 400, // Random stop delay for each reel
      })),
    )

    // Stop each reel after its delay
    reels.forEach((_, index) => {
      setTimeout(() => {
        playSound(reelStopSound.current)

        setReels((prevReels) => {
          const newReels = [...prevReels]
          // Select a random symbol
          const randomSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
          newReels[index] = {
            ...newReels[index],
            spinning: false,
            symbol: randomSymbol,
          }
          return newReels
        })

        // Check for wins after the last reel stops
        if (index === reels.length - 1) {
          setTimeout(() => {
            checkWin()
            setIsSpinning(false)
          }, 500)
        }
      }, reels[index].stopDelay)
    })

    // Add XP for spinning
    addXp(1)
  }

  const checkWin = () => {
    // Get the symbols from each reel
    const symbols = reels.map((reel) => reel.symbol.id)

    // Check if all three symbols are the same (three of a kind)
    const allSame = symbols.every((symbol) => symbol === symbols[0])

    // Check for near miss (2 of the same symbol)
    const isNearMiss = !allSame && checkForNearMiss(symbols)

    if (isNearMiss) {
      setNearMiss(true)
      playSound(nearMissSound.current)
      setLossStreak((prev) => prev + 1)
      setWinStreak(0)
      setLastResults((prev) => [...prev.slice(-9), { win: false, amount: 0 }])

      // Check for random bonus after loss
      checkRandomBonus()
    }

    if (allSame) {
      // Find the matching symbol
      const winningSymbol = SYMBOLS.find((s) => s.id === symbols[0])

      if (winningSymbol) {
        // Calculate win amount based on symbol value and any active multipliers
        const multiplier = winningSymbol.value / 10
        const win = bet * multiplier * 3 * bonusMultiplier

        // Update state with win information
        setWinAmount(win)
        setShowWin(true)
        setBalance((prev) => prev + win)
        setWinningLines([0]) // Middle line is winning
        setTotalWinnings((prev) => prev + win)
        setBiggestWin((prev) => Math.max(prev, win))
        setLossStreak(0)
        setWinStreak((prev) => prev + 1)
        setLastResults((prev) => [...prev.slice(-9), { win: true, amount: win }])

        // Determine win tier
        const tier = getWinTier(win)
        setWinTier(tier)

        // Add XP based on win amount
        const xpGain = Math.floor(win / 10) + 5
        addXp(xpGain)

        // Special effects for wins
        if (tier >= 3) {
          setJackpotMode(true)
          playSound(jackpotSound.current)
          triggerWinAnimation(multiplier, tier)

          toast({
            title: WIN_TIERS[tier].name,
            description: `You won ${win.toFixed(2)} credits!`,
            variant: "default",
            className: `bg-gradient-to-r ${WIN_TIERS[tier].color} text-white font-bold`,
          })

          // Prompt to share big wins
          if (win >= 100) {
            setShareWinAmount(win)
            setTimeout(() => {
              setShowShareWin(true)
            }, 2000)
          }
        } else {
          playSound(winSound.current)
          triggerWinAnimation(multiplier, tier)

          toast({
            title: tier > 0 ? WIN_TIERS[tier].name : "Winner!",
            description: `You won ${win.toFixed(2)} credits!`,
            variant: "default",
            className: `bg-gradient-to-r ${WIN_TIERS[tier].color} text-white`,
          })
        }

        // Play coin sounds in sequence for big wins
        if (win > 50) {
          for (let i = 0; i < Math.min(10, Math.floor(win / 20)); i++) {
            setTimeout(() => {
              playSound(coinSound.current)
            }, i * 200)
          }
        }

        // Check for achievements
        checkAchievements()
      }
    } else {
      // Handle loss
      setShowLossEffect(true)
      playSound(lossSound.current)
      setLossStreak((prev) => prev + 1)
      setWinStreak(0)
      setLastResults((prev) => [...prev.slice(-9), { win: false, amount: 0 }])

      // Check for random bonus after loss
      checkRandomBonus()
    }
  }

  // Get the appropriate win tier styling
  const getWinTierStyle = () => {
    return {
      bgColor: WIN_TIERS[winTier].color,
      icon: WIN_TIERS[winTier].icon,
      name: WIN_TIERS[winTier].name,
    }
  }

  const winTierStyle = getWinTierStyle()

  return (
    <>
      {/* Intro animation */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.2,
              }}
              className="text-center"
            >
              <motion.h1
                className="text-5xl font-bold text-amber-400 mb-4"
                animate={{
                  scale: [1, 1.1, 1],
                  textShadow: [
                    "0 0 10px rgba(251, 191, 36, 0.7)",
                    "0 0 20px rgba(251, 191, 36, 0.9)",
                    "0 0 10px rgba(251, 191, 36, 0.7)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                }}
              >
                MEGA FORTUNE
              </motion.h1>
              <motion.div
                className="flex justify-center gap-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {SYMBOLS.map((symbol, i) => (
                  <motion.div
                    key={symbol.id}
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="relative"
                  >
                    <symbol.icon className={`w-12 h-12 ${symbol.color}`} />
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        boxShadow: [
                          `0 0 0px ${symbol.bgColor}`,
                          `0 0 20px ${symbol.bgColor}`,
                          `0 0 0px ${symbol.bgColor}`,
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "loop",
                        delay: i * 0.2,
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
              <motion.p
                className="text-white text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                Match 3 coins to win big!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level up notification */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold px-6 py-4 rounded-lg shadow-lg"
            onClick={() => setShowLevelUp(false)}
          >
            <div className="flex items-center gap-3">
              <ChevronUp className="w-6 h-6" />
              <div>
                <h3 className="text-xl">LEVEL UP!</h3>
                <p>You reached Level {level}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification popup */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-3">
              {notification.icon && <notification.icon className="w-6 h-6 text-amber-400" />}
              <div>
                <h3 className="text-lg font-bold">{notification.title}</h3>
                <p className="text-sm text-white/80">{notification.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Random bonus notification */}
      <AnimatePresence>
        {showRandomBonus && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [-2, 2, -2, 2, 0],
              }}
              transition={{ duration: 0.5, repeat: 5 }}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold px-8 py-6 rounded-lg shadow-lg"
            >
              <div className="flex flex-col items-center gap-2">
                <Gift className="w-8 h-8" />
                <h3 className="text-2xl">SURPRISE BONUS!</h3>
                <p className="text-3xl">${randomBonusAmount}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bonus multiplier indicator */}
      <AnimatePresence>
        {showBonusMultiplier && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="font-bold">{bonusMultiplier}x MULTIPLIER</span>
              <span className="text-sm opacity-80">{bonusMultiplierTimer}s</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center w-full mx-auto">
        {/* Top bar with social, achievements, etc. */}
        <div className="w-full flex justify-between items-center mb-2">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                playSound(clickSound.current)
                setShowSocial(true)
              }}
              className="text-white/70 hover:text-white hover:bg-white/10 relative"
            >
              <Users className="w-4 h-4 mr-1" />
              Social
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                playSound(clickSound.current)
                setShowAchievements(true)
                setNotifications(0)
              }}
              className="text-white/70 hover:text-white hover:bg-white/10 relative"
            >
              <Award className="w-4 h-4 mr-1" />
              Achievements
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                playSound(clickSound.current)
                setShowLeaderboard(true)
              }}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Rank #{playerRank}
            </Button>
          </div>

          <div className="flex items-center gap-1">
            {dailyRewardAvailable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  playSound(clickSound.current)
                  setShowDailyReward(true)
                }}
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 animate-pulse"
              >
                <Gift className="w-4 h-4 mr-1" />
                Claim Daily
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                playSound(clickSound.current)
                setShowStats(!showStats)
              }}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {showStats ? "Hide Stats" : "Show Stats"}
            </Button>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="w-full mb-2 px-1">
          <div className="flex justify-between items-center text-xs text-white/70 mb-1">
            <span>Level {level}</span>
            <span>XP: {xp}</span>
            <span>Level {level + 1}</span>
          </div>
          <Progress
            value={getXpProgress()}
            className="h-2 bg-gray-800"
            indicatorClassName="bg-gradient-to-r from-amber-500 to-yellow-500"
          />
        </div>

        {/* Stats panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full mb-4 overflow-hidden"
            >
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-white/60">Total Spins:</span>
                    <span className="font-bold">{spinCount}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/60">Total Winnings:</span>
                    <span className="font-bold text-green-400">${totalWinnings.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/60">Biggest Win:</span>
                    <span className="font-bold text-amber-400">${biggestWin.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/60">Current Streak:</span>
                    <span className={winStreak > 0 ? "font-bold text-green-400" : "font-bold text-red-400"}>
                      {winStreak > 0 ? `${winStreak} Wins` : `${lossStreak} Losses`}
                    </span>
                  </div>
                </div>

                {/* Last 10 results */}
                <div className="mt-2">
                  <span className="text-white/60 text-xs">Last Results:</span>
                  <div className="flex gap-1 mt-1">
                    {lastResults.length === 0 && <span className="text-xs text-white/40">No spins yet</span>}
                    {lastResults.map((result, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          result.win ? "bg-green-500 text-white" : "bg-red-500/50 text-white/70"
                        }`}
                        title={result.win ? `Win: ${result.amount.toFixed(2)}` : "Loss"}
                      >
                        {result.win ? "$" : "×"}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jackpot */}
                <div className="mt-3 bg-gradient-to-r from-amber-600 to-yellow-600 p-2 rounded-md text-center">
                  <div className="text-xs text-white/80">PROGRESSIVE JACKPOT</div>
                  <div className="text-xl font-bold">${Math.floor(jackpot).toLocaleString()}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cabinet */}
        <motion.div
          ref={machineRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className={cn(
            "w-full rounded-lg overflow-hidden shadow-2xl transition-all duration-300 relative",
            jackpotMode
              ? "bg-gradient-to-b from-yellow-500 to-amber-700 border-8 border-yellow-400 shadow-yellow-400/50"
              : "bg-gradient-to-b from-indigo-800 to-purple-900 border-8 border-indigo-950 shadow-purple-500/30",
            showLossEffect && "shake-animation",
          )}
        >
          {/* Ambient light effect */}
          <div className="absolute -inset-40 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-full blur-3xl transform -rotate-12 opacity-50"></div>

          {/* Near miss effect */}
          {nearMiss && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute inset-0 bg-orange-500/10 animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-400 font-bold text-2xl animate-bounce-small">
                SO CLOSE!
              </div>
            </div>
          )}

          {/* Display */}
          <div className="relative bg-black text-white p-4 flex justify-between items-center border-b-4 border-indigo-950">
            <div>
              <p className="text-sm opacity-70">BALANCE</p>
              <motion.p
                key={balance}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.3 }}
                className="text-xl font-bold"
              >
                ${balance.toFixed(2)}
              </motion.p>
            </div>
            <div>
              <p className="text-sm opacity-70">BET</p>
              <p className="text-xl font-bold">${bet.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => {
                  playSound(clickSound.current)
                  setMuted(!muted)
                }}
              >
                {muted ? <VolumeX /> : <Volume2 />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => {
                  playSound(clickSound.current)
                  setShowSettings(true)
                }}
              >
                <Settings />
              </Button>
            </div>
          </div>

          {/* Logo */}
          <div
            className={cn(
              "py-3 px-4 flex justify-center items-center border-b-4 border-indigo-950 relative overflow-hidden",
              jackpotMode
                ? "bg-gradient-to-r from-amber-600 to-yellow-500"
                : "bg-gradient-to-r from-indigo-900 to-purple-900",
            )}
          >
            {/* Animated background light */}
            <div className="absolute inset-0 w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/20 to-purple-500/0 animate-pulse-slow"></div>
              {jackpotMode && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-amber-500/30 to-yellow-500/0 animate-pulse-fast"></div>
              )}
            </div>

            <h2
              className={cn(
                "text-3xl font-bold tracking-wider flex items-center gap-2 relative z-10",
                jackpotMode ? "text-white" : "text-amber-400",
              )}
            >
              {jackpotMode && <Sparkles className="w-6 h-6 animate-pulse" />}
              MEGA FORTUNE
              {jackpotMode && <Sparkles className="w-6 h-6 animate-pulse" />}
            </h2>
          </div>

          {/* Auto-spin indicator */}
          {autoSpin && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs text-center py-1 font-bold">
              AUTO-SPIN: {maxAutoSpins > 0 ? `${autoSpinCount}/${maxAutoSpins}` : "∞"}
            </div>
          )}

          {/* Spin counter */}
          <div className="bg-black/80 text-white text-xs text-center py-1">SPINS: {spinCount}</div>

          {/* Reels container */}
          <div className="p-4 bg-gradient-to-b from-gray-900 to-black relative">
            {/* Win lines */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              {winningLines.includes(0) && (
                <div className="absolute left-0 right-0 top-1/2 h-1 bg-yellow-400 transform -translate-y-1/2 animate-pulse-fast"></div>
              )}
            </div>

            <div className="flex justify-center gap-2 p-2 bg-gray-800 rounded-lg border-2 border-gray-700 relative overflow-hidden">
              {/* Background light effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5"></div>

              {reels.map((reel, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-1/3 aspect-square flex items-center justify-center rounded-md bg-black border-2 overflow-hidden relative",
                    reel.spinning ? "border-blue-500" : jackpotMode ? "border-yellow-400" : "border-gray-700",
                    showWin && !reel.spinning && "shadow-inner shadow-yellow-400/50",
                  )}
                >
                  {/* Reel background glow */}
                  <div
                    className={cn(
                      "absolute inset-0 opacity-20",
                      reel.spinning
                        ? "bg-blue-500 animate-pulse"
                        : showWin
                          ? "bg-yellow-500 animate-pulse"
                          : "bg-gray-800",
                    )}
                  ></div>

                  <AnimatePresence mode="wait">
                    {reel.spinning ? (
                      <motion.div
                        key="spinning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full relative overflow-hidden"
                      >
                        <div className="absolute inset-0 flex flex-col items-center animate-reel-spin">
                          {Array.from({ length: 10 }).map((_, i) => {
                            const symbol = reel.symbols[i % reel.symbols.length]
                            return (
                              <div key={i} className="flex items-center justify-center h-full min-h-full py-4">
                                <symbol.icon className={cn("w-12 h-12", symbol.color)} />
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="stopped"
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className={cn("relative flex items-center justify-center", showWin && "coin-glow")}
                      >
                        {/* Background glow for symbol */}
                        {showWin && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                            className={cn("absolute inset-0 rounded-full", reel.symbol.bgColor, "opacity-20 blur-xl")}
                          />
                        )}

                        <motion.div
                          animate={
                            showWin
                              ? {
                                  scale: [1, 1.1, 1],
                                  rotate: [0, 5, 0, -5, 0],
                                }
                              : {}
                          }
                          transition={{
                            duration: 1.5,
                            repeat: showWin ? Number.POSITIVE_INFINITY : 0,
                            repeatType: "loop",
                          }}
                        >
                          <reel.symbol.icon
                            className={cn("w-16 h-16 z-10", reel.symbol.color, showWin && "drop-shadow-glow")}
                          />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Win display */}
          <AnimatePresence>
            {showWin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={cn(
                  "text-white text-center py-3 font-bold text-xl overflow-hidden",
                  `bg-gradient-to-r ${winTierStyle.bgColor}`,
                )}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
                  className="flex items-center justify-center gap-2"
                >
                  {winTierStyle.icon && <winTierStyle.icon className="w-5 h-5" />}
                  {winTierStyle.name && <span>{winTierStyle.name}!</span>}${winAmount.toFixed(2)}
                  {winTierStyle.icon && <winTierStyle.icon className="w-5 h-5" />}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="p-4 bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col gap-4">
            {/* Bet controls */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={decreaseBet}
                disabled={bet <= 5 || isSpinning || autoSpin}
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <div className="flex-1">
                <Slider
                  value={[bet]}
                  min={5}
                  max={100}
                  step={5}
                  disabled={isSpinning || autoSpin}
                  onValueChange={(value) => {
                    playSound(clickSound.current)
                    setBet(value[0])
                  }}
                  className="[&>span:first-child]:h-3 [&>span:first-child]:bg-gray-700 [&_[role=slider]]:bg-amber-400 [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-gray-800 [&>span:first-child_span]:bg-amber-400"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={increaseBet}
                disabled={bet >= 100 || bet >= balance || isSpinning || autoSpin}
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Spin buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="lg"
                disabled={isSpinning || balance < bet}
                onClick={spin}
                className={cn(
                  "font-bold text-xl py-7 transition-all duration-300 shadow-lg relative overflow-hidden",
                  isSpinning
                    ? "bg-gray-600 text-gray-300"
                    : jackpotMode
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
                      : "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white",
                )}
              >
                {/* Button glow effect */}
                <div className="absolute inset-0 w-full h-full">
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-20",
                      isSpinning ? "" : "animate-shimmer",
                    )}
                  ></div>
                </div>

                <span className="relative z-10">{isSpinning ? "SPINNING..." : "SPIN"}</span>
              </Button>

              {autoSpin ? (
                <Button
                  size="lg"
                  onClick={stopAutoSpin}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-7"
                >
                  STOP AUTO
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled={isSpinning || balance < bet}
                  onClick={toggleAutoSpin}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-lg py-7"
                >
                  AUTO SPIN
                </Button>
              )}
            </div>
          </div>

          {/* Paytable */}
          <div className="p-4 bg-black text-white">
            <h3 className="text-center font-bold mb-2">MATCH 3 COINS TO WIN</h3>
            <div className="grid grid-cols-5 gap-2">
              {SYMBOLS.map((symbol) => (
                <div key={symbol.id} className="flex flex-col items-center bg-gray-900 p-2 rounded-md">
                  <symbol.icon className={cn("w-8 h-8", symbol.color)} />
                  <span className="mt-1 font-bold">{symbol.value}x</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-white text-sm max-w-md text-center opacity-80"
        >
          <p>Match THREE identical coin symbols to win! Each coin has a different multiplier value.</p>
          <p className="mt-2">Higher bets lead to bigger potential payouts. Good luck!</p>
        </motion.div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Game Settings</DialogTitle>
            <DialogDescription className="text-gray-400">Customize your gameplay experience</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Auto-Spin Count</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={maxAutoSpins}
                  onChange={(e) => setMaxAutoSpins(Number.parseInt(e.target.value) || 0)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <span className="text-xs text-gray-400">(0 = unlimited)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sound Effects</label>
              <Button
                variant={muted ? "outline" : "default"}
                onClick={() => setMuted(!muted)}
                className={muted ? "bg-gray-800 text-gray-300" : ""}
              >
                {muted ? "Sound Off" : "Sound On"}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reset Game</label>
              <Button
                variant="destructive"
                onClick={() => {
                  setBalance(1000)
                  setTotalWinnings(0)
                  setBiggestWin(0)
                  setSpinCount(0)
                  setLastResults([])
                  setWinStreak(0)
                  setLossStreak(0)
                  setXp(0)
                  setLevel(1)
                  setUnlockedAchievements([])
                  setDailyRewardStreak(1)
                  setShowSettings(false)

                  toast({
                    title: "Game Reset",
                    description: "Your game has been reset to default values.",
                    variant: "default",
                  })
                }}
              >
                Reset All Stats
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Reward Dialog */}
      <Dialog open={showDailyReward} onOpenChange={setShowDailyReward}>
        <DialogContent className="bg-gradient-to-b from-amber-900 to-amber-950 text-white border-amber-700">
          <DialogHeader>
            <DialogTitle className="text-amber-400 text-xl">Daily Reward!</DialogTitle>
            <DialogDescription className="text-amber-300/70">
              Come back every day to increase your streak bonus!
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex flex-col items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [-5, 5, -5, 5, 0],
                }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="w-24 h-24 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mb-4"
              >
                <Gift className="w-12 h-12 text-white" />
              </motion.div>

              <h3 className="text-2xl font-bold text-white mb-2">Day {dailyRewardStreak} Streak</h3>

              <div className="bg-amber-900/50 p-3 rounded-lg mb-4 w-full">
                <div className="flex justify-between mb-1">
                  <span>Base Reward:</span>
                  <span className="font-bold">50 credits</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Streak Bonus:</span>
                  <span className="font-bold text-amber-400">+{dailyRewardStreak * 10} credits</span>
                </div>
                <div className="border-t border-amber-700 my-2"></div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-bold text-amber-300">{50 + dailyRewardStreak * 10} credits</span>
                </div>
              </div>

              {/* Streak calendar */}
              <div className="grid grid-cols-7 gap-1 w-full mb-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-8 rounded flex items-center justify-center ${
                      i < dailyRewardStreak - 1
                        ? "bg-amber-500 text-white"
                        : i === dailyRewardStreak - 1
                          ? "bg-amber-400 text-black font-bold ring-2 ring-white"
                          : "bg-gray-700 text-gray-500"
                    }`}
                  >
                    {i < dailyRewardStreak - 1 && <Check className="w-4 h-4" />}
                    {i === dailyRewardStreak - 1 && "TODAY"}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={claimDailyReward}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold py-6 text-lg"
            >
              CLAIM REWARD
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Achievements Dialog */}
      <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Achievements
            </DialogTitle>
            <DialogDescription className="text-gray-400">Complete challenges to earn rewards and XP</DialogDescription>
          </DialogHeader>

          <div className="py-2 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-3">
              {ACHIEVEMENTS.map((achievement) => {
                const isUnlocked = unlockedAchievements.includes(achievement.id)
                return (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border ${
                      isUnlocked ? "bg-gray-800 border-amber-500" : "bg-gray-800/50 border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isUnlocked ? achievement.color : "bg-gray-700"
                        }`}
                      >
                        <achievement.icon className={`w-5 h-5 ${isUnlocked ? "text-white" : "text-gray-400"}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold ${isUnlocked ? "text-white" : "text-gray-400"}`}>
                          {achievement.name}
                        </h4>
                        <p className="text-sm text-gray-400">{achievement.description}</p>
                      </div>
                      {isUnlocked && (
                        <div className="bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded">+50 XP</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Social Dialog */}
      <Dialog open={showSocial} onOpenChange={setShowSocial}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle>Social Hub</DialogTitle>
            <DialogDescription className="text-gray-400">See what other players are winning</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="w-full bg-gray-800">
              <TabsTrigger value="feed" className="flex-1">
                <MessageSquare className="w-4 h-4 mr-1" />
                Feed
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex-1">
                <BarChart className="w-4 h-4 mr-1" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="max-h-[60vh] overflow-y-auto mt-4">
              <div className="space-y-4">
                {socialFeed.map((post) => (
                  <div key={post.id} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        {post.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold">{post.name}</div>
                        <div className="text-xs text-gray-400">{post.time}</div>
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-3 mb-2">
                      <div className="text-sm">Won a massive jackpot!</div>
                      <div className="text-xl font-bold text-amber-400">${post.win.toLocaleString()}</div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <button className="flex items-center gap-1 hover:text-white">
                        <Heart className="w-4 h-4" />
                        {post.likes}
                      </button>
                      <button className="flex items-center gap-1 hover:text-white">
                        <MessageSquare className="w-4 h-4" />
                        {post.comments}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="leaderboard" className="max-h-[60vh] overflow-y-auto mt-4">
              <div className="space-y-2">
                {leaderboardData.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center p-3 rounded-lg ${
                      player.isPlayer
                        ? "bg-amber-500/20 border border-amber-500"
                        : index < 3
                          ? "bg-gray-800"
                          : "bg-gray-800/50"
                    }`}
                  >
                    <div className="w-6 text-center font-bold">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                    </div>
                    <div className="w-8 h-8 mx-2 rounded-full bg-gray-700 flex items-center justify-center">
                      {player.avatar}
                    </div>
                    <div className="flex-1 font-bold">
                      {player.name}
                      {player.isPlayer && <span className="text-xs ml-2 text-amber-400">(You)</span>}
                    </div>
                    <div className="font-bold text-right">${player.score.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Share Win Dialog */}
      <Dialog open={showShareWin} onOpenChange={setShowShareWin}>
        <DialogContent className="bg-gradient-to-b from-amber-800 to-amber-950 text-white border-amber-700">
          <DialogHeader>
            <DialogTitle className="text-amber-400 text-xl">Share Your Big Win!</DialogTitle>
            <DialogDescription className="text-amber-300/70">
              Let other players see your amazing luck!
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex flex-col items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [-2, 2, -2, 2, 0],
                }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className="w-24 h-24 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mb-4"
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>

              <h3 className="text-2xl font-bold text-white mb-2">Congratulations!</h3>
              <p className="text-center mb-4">You just won ${shareWinAmount.toFixed(2)}!</p>

              <div className="bg-amber-900/50 p-4 rounded-lg mb-4 w-full">
                <p className="text-center">Share this win with other players and earn an achievement!</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowShareWin(false)}
              variant="outline"
              className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Maybe Later
            </Button>
            <Button
              onClick={shareWin}
              className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Win
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
