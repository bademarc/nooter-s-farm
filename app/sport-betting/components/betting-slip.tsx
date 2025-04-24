"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { X, ChevronUp, ChevronDown, Sparkles, Bitcoin, Coins } from "lucide-react"

interface BettingSlipProps {
  onPlaceBet: (amount: number) => void
  onWin: (amount: number) => void
  onLoss: () => void
  activeCurrency: "virtual" | "crypto"
}

// Sample data for betting slip
const initialBets = [
  {
    id: 1,
    event: "Arsenal vs Chelsea",
    selection: "Arsenal",
    odds: 2.1,
  },
  {
    id: 2,
    event: "Lakers vs Warriors",
    selection: "Warriors",
    odds: 1.8,
  },
]

export default function BettingSlip({ onPlaceBet, onWin, onLoss, activeCurrency }: BettingSlipProps) {
  const [bets, setBets] = useState(initialBets)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [totalStake, setTotalStake] = useState(100)
  const [cryptoStake, setCryptoStake] = useState(0.0025)
  const [isPlaced, setIsPlaced] = useState(false)
  const [isWon, setIsWon] = useState(false)
  const [showBoost, setShowBoost] = useState(false)
  const [boostMultiplier, setBoostMultiplier] = useState(1)

  useEffect(() => {
    // Show boost option after 3 seconds
    const timer = setTimeout(() => {
      setShowBoost(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const removeBet = (id: number) => {
    setBets((prev) => prev.filter((bet) => bet.id !== id))
  }

  const calculateTotalOdds = () => {
    if (bets.length === 0) return 0
    return bets.reduce((acc, bet) => acc * bet.odds, 1) * boostMultiplier
  }

  const calculatePotentialWin = () => {
    const odds = calculateTotalOdds()
    if (activeCurrency === "virtual") {
      return Math.floor(totalStake * odds)
    } else {
      return (cryptoStake * odds).toFixed(5)
    }
  }

  const placeBet = () => {
    if (bets.length === 0 || isPlaced) return

    const amount = activeCurrency === "virtual" ? totalStake : cryptoStake * 40000 // Convert to virtual for internal tracking

    onPlaceBet(amount)
    setIsPlaced(true)

    // Simulate win after 5 seconds
    setTimeout(() => {
      const isWin = Math.random() > 0.5 // 50% chance to win

      if (isWin) {
        setIsWon(true)
        const winAmount =
          activeCurrency === "virtual"
            ? Math.floor(totalStake * calculateTotalOdds())
            : Math.floor(cryptoStake * calculateTotalOdds() * 40000) // Convert to virtual for internal tracking
        onWin(winAmount)
      } else {
        onLoss()
      }
    }, 5000)
  }

  const applyBoost = () => {
    setBoostMultiplier(1.25)
    setShowBoost(false)
  }

  if (bets.length === 0 && !isPlaced) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg"
    >
      <div
        className="flex cursor-pointer items-center justify-between bg-gradient-to-r from-indigo-900/70 to-indigo-800/70 p-3"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-600 text-white">PARLAY</Badge>
          <span className="font-medium text-white">Betting Slip ({bets.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <div className="rounded-md bg-indigo-800/50 px-2 py-1 text-sm font-bold text-white">
              {calculateTotalOdds().toFixed(2)}x
            </div>
          )}
          {isCollapsed ? <ChevronUp className="h-5 w-5 text-white" /> : <ChevronDown className="h-5 w-5 text-white" />}
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {bets.map((bet) => (
                <div key={bet.id} className="mb-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{bet.event}</div>
                      <div className="text-sm text-gray-400">
                        {bet.selection} @ {bet.odds}
                      </div>
                    </div>

                    {!isPlaced && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-full p-0 text-gray-400 hover:bg-gray-700 hover:text-white"
                        onClick={() => removeBet(bet.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <AnimatePresence>
                {showBoost && !isPlaced && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="mb-4 rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-900/30 to-amber-800/30 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">Odds Boost Available!</div>
                          <div className="text-sm text-amber-300">Boost your odds by 25%</div>
                        </div>
                      </div>

                      <Button onClick={applyBoost} className="bg-amber-500 text-white hover:bg-amber-600">
                        Apply
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {boostMultiplier > 1 && (
                <div className="mb-4 rounded-lg bg-gradient-to-r from-amber-900/30 to-amber-800/30 p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <div className="text-sm font-medium text-amber-400">25% Odds Boost Applied!</div>
                  </div>
                </div>
              )}

              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">Total Stake</div>
                  {!isPlaced ? (
                    <div className="flex items-center gap-2">
                      {activeCurrency === "virtual" ? (
                        <Coins className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <Bitcoin className="h-4 w-4 text-orange-400" />
                      )}
                      <Input
                        type="number"
                        min={activeCurrency === "virtual" ? "50" : "0.001"}
                        step={activeCurrency === "virtual" ? "50" : "0.001"}
                        value={activeCurrency === "virtual" ? totalStake : cryptoStake}
                        onChange={(e) => {
                          if (activeCurrency === "virtual") {
                            setTotalStake(Number.parseInt(e.target.value) || 100)
                          } else {
                            setCryptoStake(Number.parseFloat(e.target.value) || 0.0025)
                          }
                        }}
                        className="w-24 border-gray-700 bg-gray-800 text-white"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 font-medium text-white">
                      {activeCurrency === "virtual" ? (
                        <>
                          <Coins className="h-4 w-4 text-yellow-400" />
                          {totalStake}
                        </>
                      ) : (
                        <>
                          <Bitcoin className="h-4 w-4 text-orange-400" />
                          {cryptoStake.toFixed(5)}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">Total Odds</div>
                  <div className="font-medium text-white">{calculateTotalOdds().toFixed(2)}x</div>
                </div>

                <div className="flex items-center justify-between rounded-md bg-gray-700/50 p-2">
                  <div className="text-sm font-medium text-gray-300">Potential Win</div>
                  <div className="flex items-center gap-1 font-bold text-green-400">
                    {activeCurrency === "virtual" ? (
                      <>
                        <Coins className="h-4 w-4" />
                        {Math.floor(totalStake * calculateTotalOdds())}
                      </>
                    ) : (
                      <>
                        <Bitcoin className="h-4 w-4" />
                        {(cryptoStake * calculateTotalOdds()).toFixed(5)}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isPlaced ? (
                <Button
                  disabled={!isWon}
                  className={`w-full ${
                    isWon
                      ? "bg-gradient-to-r from-green-600 to-emerald-600"
                      : "bg-gradient-to-r from-amber-600 to-orange-600"
                  }`}
                >
                  {isWon ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: 2 }}
                    >
                      YOU WON{" "}
                      {activeCurrency === "virtual"
                        ? Math.floor(totalStake * calculateTotalOdds()) + " COINS!"
                        : (cryptoStake * calculateTotalOdds()).toFixed(5) + " BTC!"}
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      >
                        ●
                      </motion.div>
                      Waiting for Results
                    </div>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={placeBet}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-6 text-lg font-bold"
                >
                  <motion.div className="relative" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20"
                      animate={{ x: ["100%", "-100%"] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror" }}
                    />
                    <span className="relative z-10">PLACE {bets.length} BET PARLAY</span>
                  </motion.div>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
