"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import LiveMatches from "../components/live-matches"
import BettingSlip from "../components/betting-slip"
import CurrencyDisplay from "../components/currency-display"
import PopularBets from "../components/popular-bets"
import UpcomingMatches from "../components/upcoming-matches"
import WinnersBanner from "../components/winners-banner"
import CryptoTicker from "../components/crypto-ticker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Button } from "../components/ui/button"
import { Bell, Gift, Flame, Zap, Trophy, Sparkles, Clock, Wallet, Maximize2 } from "lucide-react"
import Confetti from "../components/confetti"
import QuickBetPanel from "../components/quick-bet-panel"
import CurrencySwitcher from "../components/currency-switcher"
import HotStreakBonus from "../components/hot-streak-bonus"
import LimitedTimeEvent from "../components/limited-time-event"
import AchievementUnlocked from "../components/achievement-unlocked"
import LevelUpNotification from "../components/level-up-notification"
import RewardWheel from "../components/reward-wheel"
import useSound from "../hooks/use-sound"

interface SportBettingPageProps {
  farmCoins: number;
  addFarmCoins: (amount: number) => void;
  walletAddress?: string; // Optional prop for wallet address
  provider?: any; // Optional prop for provider
}

export default function SportBettingPage({ 
  farmCoins, 
  addFarmCoins, 
  walletAddress = "",
  provider = null 
}: SportBettingPageProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [cryptoBalance, setCryptoBalance] = useState(0.025)
  const [activeCurrency, setActiveCurrency] = useState<"virtual" | "crypto">("virtual")
  const [showBonus, setShowBonus] = useState(false)
  const [pulseBalance, setPulseBalance] = useState(false)
  const [activeBets, setActiveBets] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showHotStreak, setShowHotStreak] = useState(false)
  const [showLimitedEvent, setShowLimitedEvent] = useState(false)
  const [showAchievement, setShowAchievement] = useState(false)
  const [achievementType, setAchievementType] = useState("")
  const [userLevel, setUserLevel] = useState(1)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [showRewardWheel, setShowRewardWheel] = useState(false)
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes in seconds
  const [betCount, setBetCount] = useState(0)
  const [winCount, setWinCount] = useState(0)
  const [xpPoints, setXpPoints] = useState(0)
  const [showPulsingBet, setShowPulsingBet] = useState(false)
  const [pulsingBetInterval, setPulsingBetInterval] = useState<NodeJS.Timeout | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const {
    playWinSound,
    playBetSound,
    playButtonSound,
    playLevelUpSound,
    playAchievementSound,
    playWheelSound,
    playTimerSound,
  } = useSound()

  // Reference to store timeout IDs for cleanup
  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    // Show bonus notification after 5 seconds
    const bonusTimer = setTimeout(() => {
      setShowBonus(true)
    }, 5000)
    timeoutRefs.current.push(bonusTimer)

    // Show limited time event after 15 seconds
    const eventTimer = setTimeout(() => {
      setShowLimitedEvent(true)
      playTimerSound()
    }, 15000)
    timeoutRefs.current.push(eventTimer)

    // Start pulsing bet suggestion after 10 seconds
    const pulsingBetTimer = setTimeout(() => {
      setShowPulsingBet(true)
      const interval = setInterval(() => {
        setShowPulsingBet((prev) => !prev)
      }, 3000)
      setPulsingBetInterval(interval)
    }, 10000)
    timeoutRefs.current.push(pulsingBetTimer)

    // Countdown timer for limited time event
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setShowLimitedEvent(false)
          return 1800
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      timeoutRefs.current.forEach(clearTimeout)
      if (pulsingBetInterval) clearInterval(pulsingBetInterval)
      clearInterval(countdownInterval)
    }
  }, [playTimerSound])

  useEffect(() => {
    // Show hot streak bonus when streak reaches 3
    if (streak >= 3) {
      setShowHotStreak(true)
    }
  }, [streak])

  useEffect(() => {
    // Check for achievements
    if (betCount === 5 && !achievementType) {
      setAchievementType("first_steps")
      setShowAchievement(true)
      playAchievementSound()
      addXp(50)
    } else if (winCount === 3 && achievementType !== "winning_streak") {
      setAchievementType("winning_streak")
      setShowAchievement(true)
      playAchievementSound()
      addXp(100)
    }
  }, [betCount, winCount, achievementType, playAchievementSound])

  useEffect(() => {
    // Level up system
    const xpNeeded = userLevel * 100
    if (xpPoints >= xpNeeded && userLevel < 10) {
      setUserLevel((prev) => prev + 1)
      setXpPoints((prev) => prev - xpNeeded)
      setShowLevelUp(true)
      playLevelUpSound()

      // Give reward for leveling up
      if (activeCurrency === "virtual") {
        addFarmCoins(userLevel * 200)
      } else {
        setCryptoBalance((prev) => prev + userLevel * 0.005)
      }

      // Show reward wheel every 3 levels
      if ((userLevel + 1) % 3 === 0) {
        const wheelTimer = setTimeout(() => {
          setShowRewardWheel(true)
          playWheelSound()
        }, 2000)
        timeoutRefs.current.push(wheelTimer)
      }
    }
  }, [xpPoints, userLevel, activeCurrency, playLevelUpSound, playWheelSound, addFarmCoins])

  const addXp = (amount: number) => {
    setXpPoints((prev) => prev + amount)
  }

  const handleWin = (amount: number) => {
    setShowConfetti(true)
    playWinSound()

    if (activeCurrency === "virtual") {
      addFarmCoins(amount)
    } else {
      setCryptoBalance((prev) => prev + amount / 40000) // Simulated conversion rate
    }

    setPulseBalance(true)
    setStreak((prev) => prev + 1)
    setWinCount((prev) => prev + 1)
    addXp(25)

    setTimeout(() => {
      setShowConfetti(false)
      setPulseBalance(false)
    }, 3000)
  }

  const handleLoss = () => {
    setStreak(0)
    addXp(5) // Small XP even for losses to keep engagement
  }

  const handlePlaceBet = (amount: number) => {
    playBetSound()

    if (activeCurrency === "virtual") {
      addFarmCoins(-amount)
    } else {
      setCryptoBalance((prev) => prev - amount / 40000) // Simulated conversion rate
    }
    setActiveBets((prev) => prev + 1)
    setBetCount((prev) => prev + 1)
    addXp(10)
  }

  const claimBonus = () => {
    playButtonSound()

    if (activeCurrency === "virtual") {
      addFarmCoins(500)
    } else {
      setCryptoBalance((prev) => prev + 0.01)
    }
    setPulseBalance(true)
    setShowBonus(false)
    addXp(20)

    setTimeout(() => {
      setPulseBalance(false)
    }, 2000)
  }

  const claimHotStreakBonus = () => {
    playButtonSound()

    if (activeCurrency === "virtual") {
      addFarmCoins(1000)
    } else {
      setCryptoBalance((prev) => prev + 0.025)
    }
    setPulseBalance(true)
    setShowHotStreak(false)
    addXp(50)

    setTimeout(() => {
      setPulseBalance(false)
    }, 2000)
  }

  const claimLimitedTimeReward = () => {
    playButtonSound()

    if (activeCurrency === "virtual") {
      addFarmCoins(2000)
    } else {
      setCryptoBalance((prev) => prev + 0.05)
    }
    setPulseBalance(true)
    setShowLimitedEvent(false)
    addXp(100)

    setTimeout(() => {
      setPulseBalance(false)
    }, 2000)
  }

  const handleWheelReward = (reward: number) => {
    playWinSound()

    if (activeCurrency === "virtual") {
      addFarmCoins(reward)
    } else {
      setCryptoBalance((prev) => prev + reward / 40000)
    }
    setPulseBalance(true)
    setShowRewardWheel(false)
    addXp(75)

    setTimeout(() => {
      setPulseBalance(false)
    }, 2000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    playButtonSound()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
      {showConfetti && <Confetti />}

      {/* Main Game Container */}
      <div 
        className={`relative overflow-hidden rounded-xl border border-purple-800 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl ${
          isFullscreen ? 'fixed inset-0 z-50 m-0 h-screen w-screen rounded-none border-0' : 'max-h-[800px] w-full max-w-3xl'
        }`}
      >
        {/* Game header with level progress */}
        <div className="border-b border-purple-800/50 bg-gradient-to-r from-gray-900/90 to-gray-800/90 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold">
                {userLevel}
              </div>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                  style={{ width: `${(xpPoints / (userLevel * 100)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showLimitedEvent && (
                <div className="flex items-center gap-1 text-sm text-amber-400">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs">
                <Sparkles className="h-3 w-3 text-yellow-400" />
                <span className="font-medium text-yellow-400">{xpPoints} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Currency and controls bar */}
        <div className="border-b border-purple-800/50 bg-gradient-to-r from-indigo-900/80 to-purple-900/80 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CurrencyDisplay
                virtualAmount={farmCoins}
                cryptoAmount={cryptoBalance}
                activeCurrency={activeCurrency}
                pulsing={pulseBalance}
              />
              <CurrencySwitcher activeCurrency={activeCurrency} onSwitch={(currency) => setActiveCurrency(currency)} />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="relative border-purple-500 bg-transparent text-white hover:bg-purple-800"
                onClick={() => playButtonSound()}
              >
                <Bell className="h-4 w-4" />
                {activeBets > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px]">
                    {activeBets}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-purple-500 bg-transparent text-white hover:bg-purple-800"
                onClick={() => {
                  setShowBonus(true)
                  playButtonSound()
                }}
              >
                <Gift className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-purple-500 bg-transparent text-white hover:bg-purple-800"
                onClick={toggleFullscreen}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500 bg-transparent text-white hover:bg-purple-800"
                onClick={() => playButtonSound()}
              >
                <Wallet className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main game content area */}
        <div className="h-[600px] overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-purple-600">
          <div className="p-4">
            <CryptoTicker />
            <WinnersBanner />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-500" />
                  <h2 className="text-xl font-bold">Hot Right Now</h2>
                </div>
                <Button
                  variant="link"
                  className="text-purple-400 hover:text-purple-300"
                  onClick={() => playButtonSound()}
                >
                  See All
                </Button>
              </div>
              <QuickBetPanel
                onPlaceBet={handlePlaceBet}
                onWin={handleWin}
                onLoss={handleLoss}
                activeCurrency={activeCurrency}
                isPulsing={showPulsingBet}
              />
            </motion.div>

            <div className="mt-6">
              <Tabs defaultValue="live" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                  <TabsTrigger
                    value="live"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-500 data-[state=active]:text-white"
                    onClick={() => playButtonSound()}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Live Now
                  </TabsTrigger>
                  <TabsTrigger
                    value="upcoming"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white"
                    onClick={() => playButtonSound()}
                  >
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger
                    value="popular"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                    onClick={() => playButtonSound()}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Popular
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="live" className="mt-4">
                  <LiveMatches
                    onPlaceBet={handlePlaceBet}
                    onWin={handleWin}
                    onLoss={handleLoss}
                    activeCurrency={activeCurrency}
                  />
                </TabsContent>

                <TabsContent value="upcoming" className="mt-4">
                  <UpcomingMatches onPlaceBet={handlePlaceBet} activeCurrency={activeCurrency} />
                </TabsContent>

                <TabsContent value="popular" className="mt-4">
                  <PopularBets onPlaceBet={handlePlaceBet} activeCurrency={activeCurrency} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="mt-6">
              <BettingSlip
                onPlaceBet={handlePlaceBet}
                onWin={handleWin}
                onLoss={handleLoss}
                activeCurrency={activeCurrency}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {showBonus && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-0 right-0 z-50 mx-auto w-[90%] max-w-md rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 p-4 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-300">
                  <Gift className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold">Daily Bonus Available!</h3>
                  <p className="text-sm">Claim {activeCurrency === "virtual" ? "500 coins" : "0.01 BTC"} now</p>
                </div>
              </div>
              <Button onClick={claimBonus} className="bg-white font-bold text-amber-600 hover:bg-yellow-100">
                CLAIM
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHotStreak && (
          <HotStreakBonus streak={streak} onClaim={claimHotStreakBonus} activeCurrency={activeCurrency} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLimitedEvent && (
          <LimitedTimeEvent onClaim={claimLimitedTimeReward} activeCurrency={activeCurrency} timeLeft={timeLeft} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAchievement && <AchievementUnlocked type={achievementType} onClose={() => setShowAchievement(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showLevelUp && <LevelUpNotification level={userLevel} onClose={() => setShowLevelUp(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showRewardWheel && <RewardWheel onReward={handleWheelReward} onClose={() => setShowRewardWheel(false)} />}
      </AnimatePresence>
    </div>
  )
}
