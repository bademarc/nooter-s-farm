"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "../components/ui/button"
import { Sparkles, TrendingUp, Zap, Bitcoin, Coins, ArrowUpRight } from "lucide-react"
import Image from "next/image"
import useSound from "../hooks/use-sound"

interface QuickBetPanelProps {
  onPlaceBet: (amount: number) => void
  onWin: (amount: number) => void
  onLoss: () => void
  activeCurrency: "virtual" | "crypto"
  isPulsing?: boolean
}

export default function QuickBetPanel({
  onPlaceBet,
  onWin,
  onLoss,
  activeCurrency,
  isPulsing = false,
}: QuickBetPanelProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [multiplier, setMultiplier] = useState(1.5)
  const [betAmount, setBetAmount] = useState(activeCurrency === "virtual" ? 100 : 0.0025)
  const [spinCount, setSpinCount] = useState(0)
  const [showMultiplierBoost, setShowMultiplierBoost] = useState(false)

  const { playButtonSound, playSpinSound, playWinSound, playLoseSound } = useSound()

  const handleQuickBet = () => {
    playSpinSound()
    onPlaceBet(activeCurrency === "virtual" ? betAmount : betAmount * 40000) // Convert BTC to virtual for internal tracking
    setIsSpinning(true)
    setResult(null)
    setSpinCount((prev) => prev + 1)

    // Show multiplier boost after 3 spins
    if (spinCount === 2) {
      setShowMultiplierBoost(true)
    }

    // Simulate random result after 2 seconds
    setTimeout(() => {
      setIsSpinning(false)
      // Slightly increase win chance with each spin to hook the user
      const winChance = 0.4 + (spinCount * 0.05 > 0.3 ? 0.3 : spinCount * 0.05)
      const isWin = Math.random() < winChance // Increasing chance to win

      if (isWin) {
        setResult("win")
        playWinSound()
        onWin(Math.floor((activeCurrency === "virtual" ? betAmount : betAmount * 40000) * multiplier))
      } else {
        setResult("lose")
        playLoseSound()
        onLoss()
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setResult(null)
        // Increase multiplier slightly to encourage more betting
        setMultiplier((prev) => Math.min(prev + 0.2, 3.0))
      }, 3000)
    }, 2000)
  }

  const increaseBet = () => {
    playButtonSound()
    if (activeCurrency === "virtual") {
      setBetAmount((prev) => prev + 50)
    } else {
      setBetAmount((prev) => Number.parseFloat((prev + 0.001).toFixed(5)))
    }
  }

  const decreaseBet = () => {
    playButtonSound()
    if (activeCurrency === "virtual") {
      setBetAmount((prev) => Math.max(50, prev - 50))
    } else {
      setBetAmount((prev) => Math.max(0.001, Number.parseFloat((prev - 0.001).toFixed(5))))
    }
  }

  const boostMultiplier = () => {
    playButtonSound()
    setMultiplier((prev) => prev * 1.5)
    setShowMultiplierBoost(false)
  }

  return (
    <motion.div
      className="overflow-hidden rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      animate={
        isPulsing
          ? {
              boxShadow: ["0 0 15px rgba(0,0,0,0.5)", "0 0 25px rgba(139,92,246,0.8)", "0 0 15px rgba(0,0,0,0.5)"],
              scale: [1, 1.02, 1],
            }
          : {}
      }
    >
      <div className="relative h-40 overflow-hidden">
        <Image
          src="/placeholder.svg?height=400&width=800"
          alt="Quick Bet"
          width={800}
          height={400}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Crypto Spin</h3>
              </div>
              <p className="text-sm text-gray-300">Instant win up to 3x your bet!</p>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-purple-900/70 px-3 py-1 backdrop-blur-sm">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <motion.span
                className="font-bold text-white"
                animate={
                  showMultiplierBoost
                    ? {
                        color: ["#ffffff", "#22c55e", "#ffffff"],
                        scale: [1, 1.1, 1],
                      }
                    : {}
                }
                transition={{ duration: 1, repeat: showMultiplierBoost ? Number.POSITIVE_INFINITY : 0 }}
              >
                {multiplier.toFixed(1)}x
              </motion.span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={decreaseBet}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600"
            >
              -
            </button>

            <div className="flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-1">
              <span className="font-bold text-white">
                {activeCurrency === "virtual" ? betAmount : betAmount.toFixed(5)}
              </span>
              <span className="text-sm text-gray-400">{activeCurrency === "virtual" ? "coins" : "BTC"}</span>
            </div>

            <button
              onClick={increaseBet}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600"
            >
              +
            </button>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">Potential win</div>
            <div className="flex items-center gap-1 font-bold text-green-400">
              {activeCurrency === "virtual" ? (
                <>
                  <Coins className="h-3 w-3" />
                  {Math.floor(betAmount * multiplier)}
                </>
              ) : (
                <>
                  <Bitcoin className="h-3 w-3" />
                  {(betAmount * multiplier).toFixed(5)}
                </>
              )}
            </div>
          </div>
        </div>

        {showMultiplierBoost && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden rounded-lg bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                  <ArrowUpRight className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">Multiplier Boost!</div>
                  <div className="text-sm text-green-300">Boost your multiplier by 50%</div>
                </div>
              </div>
              <Button onClick={boostMultiplier} className="bg-green-500 text-white hover:bg-green-600">
                Boost
              </Button>
            </div>
          </motion.div>
        )}

        <Button
          onClick={handleQuickBet}
          disabled={isSpinning}
          className={`relative w-full overflow-hidden ${
            result === "win"
              ? "bg-gradient-to-r from-green-600 to-emerald-600"
              : result === "lose"
                ? "bg-gradient-to-r from-red-600 to-rose-600"
                : "bg-gradient-to-r from-purple-600 to-indigo-600"
          } py-6 text-lg font-bold`}
        >
          {isSpinning ? (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Sparkles className="h-5 w-5" />
              </motion.div>
              <span>Spinning...</span>
            </div>
          ) : result === "win" ? (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}>
              YOU WON{" "}
              {activeCurrency === "virtual"
                ? Math.floor(betAmount * multiplier) + " COINS!"
                : (betAmount * multiplier).toFixed(5) + " BTC!"}
            </motion.div>
          ) : result === "lose" ? (
            <motion.div initial={{ opacity: 0.8 }} animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 0.5 }}>
              Try Again! <span className="text-sm">You're due for a win!</span>
            </motion.div>
          ) : (
            <>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20"
                animate={{ x: ["100%", "-100%"] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror" }}
              />
              <span className="relative z-10">SPIN TO WIN</span>
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}
