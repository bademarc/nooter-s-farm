"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import SportBettingInterface from "../components/sport-betting-interface"
import PopularBets from "../components/popular-bets"
import WinnersBanner from "../components/winners-banner"
import CryptoTicker from "../components/crypto-ticker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Button } from "../components/ui/button"
import { Bell, Gift, Flame, Zap, Trophy, Sparkles, Clock, Wallet, Maximize2 } from "lucide-react"
import Confetti from "../components/confetti"
import HotStreakBonus from "../components/hot-streak-bonus"
import LimitedTimeEvent from "../components/limited-time-event"
import AchievementUnlocked from "../components/achievement-unlocked"
import LevelUpNotification from "../components/level-up-notification"
import RewardWheel from "../components/reward-wheel"
// import useSound from "../hooks/use-sound"

interface SportBettingPageProps {
  farmCoins: number;
  addFarmCoins: (amount: number) => void;
}

export default function SportBettingPage({ 
  farmCoins, 
  addFarmCoins, 
}: SportBettingPageProps) {
  const [showConfetti, setShowConfetti] = useState(false)
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
  const [showBonus, setShowBonus] = useState(false)

  // Comment out the hook destructuring
  // const {
  //   playWinSound,
  //   playBetSound,
  //   playButtonSound,
  //   playLevelUpSound,
  //   playAchievementSound,
  //   playWheelSound,
  //   playTimerSound,
  // } = useSound();

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
      // playTimerSound(); // <-- Commented out
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
  }, []) // Removed playTimerSound dependency

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
      // playAchievementSound(); // <-- Commented out
      addXp(50)
    } else if (winCount === 3 && achievementType !== "winning_streak") {
      setAchievementType("winning_streak")
      setShowAchievement(true)
      // playAchievementSound(); // <-- Commented out
      addXp(100)
    }
  }, [betCount, winCount, achievementType]) // Removed playAchievementSound dependency

  useEffect(() => {
    // Level up system
    const xpNeeded = userLevel * 100
    if (xpPoints >= xpNeeded && userLevel < 10) {
      setUserLevel((prev) => prev + 1)
      setXpPoints((prev) => prev - xpNeeded)
      setShowLevelUp(true)
      // playLevelUpSound(); // <-- Commented out

      // Give reward for leveling up
      addFarmCoins(userLevel * 200)

      // Show reward wheel every 3 levels
      if ((userLevel + 1) % 3 === 0) {
        const wheelTimer = setTimeout(() => {
          setShowRewardWheel(true)
          // playWheelSound(); // <-- Commented out
        }, 2000)
        timeoutRefs.current.push(wheelTimer)
      }
    }
  }, [xpPoints, userLevel, addFarmCoins]) // Removed sound hook dependencies

  const addXp = (amount: number) => {
    setXpPoints((prev) => prev + amount)
  }

  const handleWin = (amount: number, tokenSymbol: string) => {
    console.log(`Page received WIN notification: ${amount} ${tokenSymbol}`);
    setShowConfetti(true)
    // playWinSound(); // <-- Commented out
    setStreak((prev) => prev + 1)
    setWinCount((prev) => prev + 1)
    addXp(25) // Base XP for winning

    // --- Convert win amount to Farm Coins (Simple 1:1 for now) ---
    const farmCoinReward = Math.round(amount); // Use the crypto amount directly
    addFarmCoins(farmCoinReward);
    console.log(`Awarded ${farmCoinReward} Farm Coins for the win.`);
    // You could add more sophisticated conversion logic here based on tokenSymbol
    // if (tokenSymbol === 'NOOT') { addFarmCoins(amount * 1); }
    // else if (tokenSymbol === 'ABSTER') { addFarmCoins(amount * 0.5); } // Example

    const confettiTimer = setTimeout(() => setShowConfetti(false), 4000)
    timeoutRefs.current.push(confettiTimer)
  }

  const handleLoss = () => {
    console.log(`Page received LOSS notification`);
    setStreak(0)
    addXp(5)
  }

  const handleBetPlaced = () => {
    console.log("Page received BET PLACED notification");
    setBetCount(prev => prev + 1)
    addXp(10)
    setActiveBets(prev => prev + 1)
  }

  const claimBonus = () => {
    // playButtonSound(); // <-- Commented out
    addFarmCoins(500)
    setShowBonus(false)
    addXp(20)
  }

  const claimHotStreakBonus = () => {
    // playButtonSound(); // <-- Commented out
    addFarmCoins(1000)
    setShowHotStreak(false)
    setStreak(0)
    addXp(50)
  }

  const claimLimitedTimeReward = () => {
    // playButtonSound(); // <-- Commented out
    addFarmCoins(2000)
    setShowLimitedEvent(false)
    addXp(75)
    setTimeLeft(1800)
    const eventTimer = setTimeout(() => { setShowLimitedEvent(true); /* playTimerSound(); */ }, 30 * 60 * 1000)
    timeoutRefs.current.push(eventTimer)
  }

  const handleWheelReward = (reward: number) => {
    addFarmCoins(reward)
    addXp(reward / 10)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const toggleFullscreen = () => {
    // if (!document.fullscreenElement) {
    //    document.documentElement.requestFullscreen().catch(err => console.error(err))
    //    setIsFullscreen(true)
    // } else {
    //    if (document.exitFullscreen) {
    //      document.exitFullscreen()
    //      setIsFullscreen(false)
    //    }
    // }
    // playButtonSound(); // <-- Commented out
    console.log("Toggle fullscreen called (body commented out for debug)"); // Keep a log
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white p-4 md:p-6 lg:p-8 font-sans ${isFullscreen ? 'fixed inset-0 z-[100] overflow-auto' : ''}`}>
      <AnimatePresence>
        {showConfetti && <Confetti />}
        {showBonus && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 right-4 z-50"
          >
            <Button
              onClick={claimBonus}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg animate-pulse hover:animate-none"
            >
              <Gift className="mr-2 h-5 w-5" /> Claim Daily Bonus!
            </Button>
          </motion.div>
        )}
        {showHotStreak && (
          <HotStreakBonus streak={streak} onClaim={claimHotStreakBonus} />
        )}
        {showLimitedEvent && (
          <LimitedTimeEvent timeLeft={timeLeft} onClaim={claimLimitedTimeReward} onClose={() => setShowLimitedEvent(false)} />
        )}
        {showAchievement && (
          <AchievementUnlocked type={achievementType} onClose={() => setShowAchievement(false)} />
        )}
        {showLevelUp && (
          <LevelUpNotification level={userLevel} onClose={() => setShowLevelUp(false)} />
        )}
        {showRewardWheel && (
           <RewardWheel onReward={handleWheelReward} onClose={() => setShowRewardWheel(false)} />
        )}
      </AnimatePresence>

      {/* --- Top Bar --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        {/* Logo/Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          NootBets
        </h1>

        {/* Currency & Profile Area */}
        <div className="flex items-center space-x-4 bg-gray-800/50 p-2 rounded-lg border border-gray-700">
          {/* Level & XP */}
          <div className="text-center">
            <span className="text-xs text-gray-400">LVL</span>
            <div className="font-bold text-lg text-yellow-400">{userLevel}</div>
            <div className="w-16 h-1 bg-gray-600 rounded-full overflow-hidden mt-1">
              <motion.div 
                className="h-full bg-yellow-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (xpPoints / (userLevel * 100)) * 100)}%` }} 
              />
            </div>
             <span className="text-[10px] text-gray-500">{xpPoints} / {userLevel * 100} XP</span>
          </div>

          {/* Farm Coins Display (kept simple) */}
           <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
                <span className="font-semibold text-lg text-green-400">{farmCoins}</span>
                <span className="text-sm text-gray-400">Coins</span>
           </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => { toggleFullscreen(); /* playButtonSound(); */ }}
            className="text-gray-400 hover:text-white"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { /* playButtonSound(); */ }} className="text-gray-400 hover:text-white relative" title="Notifications">
              <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Sidebar / Main Betting Area (Now SportBettingInterface) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Ticker */}
          <CryptoTicker />
          
          {/* Winners Banner */}
          <WinnersBanner />

          {/* Render the new SportBettingInterface here */}
          <SportBettingInterface
            onWin={handleWin}
            onLoss={handleLoss}
            onBetPlaced={handleBetPlaced}
          />

          {/* Remove the old Tabs structure or repurpose it */}
          {/*
          <Tabs defaultValue="live" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800/70 mb-4">
              <TabsTrigger value="live" className="data-[state=active]:bg-red-600 data-[state=active]:text-white"><Flame className="mr-2 h-4 w-4" />Live</TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"><Clock className="mr-2 h-4 w-4" />Upcoming</TabsTrigger>
              <TabsTrigger value="quick" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"><Zap className="mr-2 h-4 w-4" />Quick Bets</TabsTrigger>
            </TabsList>
            <TabsContent value="live">
              <LiveMatches onBet={handlePlaceBet} onWin={handleWin} onLoss={handleLoss} />
            </TabsContent>
            <TabsContent value="upcoming">
              <UpcomingMatches onBet={handlePlaceBet} />
            </TabsContent>
            <TabsContent value="quick">
              <QuickBetPanel onBet={handlePlaceBet} />
            </TabsContent>
          </Tabs>
          */}
        </div>

        {/* Right Sidebar (Bet Slip / Popular Bets - Keep or Remove?) */}
        {/* The new interface includes a bet slip, so this might be redundant */}
        {/* <div className="lg:col-span-1 space-y-6">
          <BettingSlip activeBets={activeBets} />
          <PopularBets onBet={handlePlaceBet} isPulsing={showPulsingBet} />
        </div> */}
        
        {/* Keep Popular Bets if desired separately */}
         <div className="lg:col-span-1 space-y-6">
           <PopularBets onBet={() => { console.log("Popular bet clicked"); /* playButtonSound(); */ }} isPulsing={showPulsingBet} />
           {/* You could add other widgets here: Leaderboards, Chat, etc. */}
           <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold mb-3 text-center text-yellow-300">Activity Feed</h3>
                <div className="text-sm text-gray-400 space-y-2 max-h-48 overflow-y-auto">
                    <p>PlayerA won 500 NOOT on Nooters FC!</p>
                    <p>PlayerB just placed a bet on Abby's Army.</p>
                    <p>PlayerC reached Level 5!</p>
                </div>
            </div>
         </div>

      </div>
    </div>
  )
}
