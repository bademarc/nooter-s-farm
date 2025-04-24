"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Zap, TrendingUp, ArrowRight, Bitcoin, Coins } from "lucide-react"

interface LiveMatchesProps {
  onPlaceBet: (amount: number) => void
  onWin: (amount: number) => void
  onLoss: () => void
  activeCurrency: "virtual" | "crypto"
}

// Sample data for live matches
const liveMatches = [
  {
    id: 1,
    league: "Premier League",
    time: "65'",
    team1: {
      name: "Arsenal",
      logo: "/placeholder.svg?height=50&width=50",
      score: 2,
    },
    team2: {
      name: "Chelsea",
      logo: "/placeholder.svg?height=50&width=50",
      score: 1,
    },
    odds: {
      team1: 1.8,
      draw: 3.2,
      team2: 4.5,
    },
    momentum: "team1", // team with momentum
  },
  {
    id: 2,
    league: "NBA",
    time: "Q3 5:42",
    team1: {
      name: "Lakers",
      logo: "/placeholder.svg?height=50&width=50",
      score: 72,
    },
    team2: {
      name: "Warriors",
      logo: "/placeholder.svg?height=50&width=50",
      score: 68,
    },
    odds: {
      team1: 1.5,
      draw: null,
      team2: 2.7,
    },
    momentum: "team2", // team with momentum
  },
  {
    id: 3,
    league: "Tennis",
    time: "Set 3",
    team1: {
      name: "Djokovic",
      logo: "/placeholder.svg?height=50&width=50",
      score: 2,
    },
    team2: {
      name: "Nadal",
      logo: "/placeholder.svg?height=50&width=50",
      score: 1,
    },
    odds: {
      team1: 1.9,
      draw: null,
      team2: 2.1,
    },
    momentum: "team1", // team with momentum
  },
]

export default function LiveMatches({ onPlaceBet, onWin, onLoss, activeCurrency }: LiveMatchesProps) {
  const [selectedBets, setSelectedBets] = useState<{ [key: number]: string }>({})
  const [betAmounts, setBetAmounts] = useState<{ [key: number]: number }>({})
  const [cryptoBetAmounts, setCryptoBetAmounts] = useState<{ [key: number]: number }>({})
  const [placedBets, setPlacedBets] = useState<number[]>([])
  const [winningBets, setWinningBets] = useState<number[]>([])

  const handleSelectBet = (matchId: number, betType: string) => {
    setSelectedBets((prev) => ({
      ...prev,
      [matchId]: betType,
    }))

    if (!betAmounts[matchId]) {
      setBetAmounts((prev) => ({
        ...prev,
        [matchId]: 100, // Default bet amount
      }))
    }

    if (!cryptoBetAmounts[matchId]) {
      setCryptoBetAmounts((prev) => ({
        ...prev,
        [matchId]: 0.0025, // Default crypto bet amount
      }))
    }
  }

  const handleBetAmountChange = (matchId: number, amount: number) => {
    if (activeCurrency === "virtual") {
      setBetAmounts((prev) => ({
        ...prev,
        [matchId]: amount,
      }))
    } else {
      setCryptoBetAmounts((prev) => ({
        ...prev,
        [matchId]: amount,
      }))
    }
  }

  const placeBet = (matchId: number) => {
    if (!selectedBets[matchId] || placedBets.includes(matchId)) return

    const amount =
      activeCurrency === "virtual" ? betAmounts[matchId] || 100 : (cryptoBetAmounts[matchId] || 0.0025) * 40000 // Convert to virtual for internal tracking

    onPlaceBet(amount)
    setPlacedBets((prev) => [...prev, matchId])

    // Simulate win after random time (5-15 seconds)
    const winTime = 5000 + Math.random() * 10000
    setTimeout(() => {
      const isWin = Math.random() > 0.5 // 50% chance to win

      if (isWin) {
        const match = liveMatches.find((m) => m.id === matchId)
        if (!match) return

        const betType = selectedBets[matchId]
        const odds = betType === "team1" ? match.odds.team1 : betType === "draw" ? match.odds.draw : match.odds.team2

        if (!odds) return

        const winAmount = Math.floor(
          (activeCurrency === "virtual" ? betAmounts[matchId] || 100 : (cryptoBetAmounts[matchId] || 0.0025) * 40000) *
            odds,
        )

        onWin(winAmount)
        setWinningBets((prev) => [...prev, matchId])
      } else {
        onLoss()
      }
    }, winTime)
  }

  const getDisplayAmount = (matchId: number) => {
    if (activeCurrency === "virtual") {
      return betAmounts[matchId] || 100
    } else {
      return (cryptoBetAmounts[matchId] || 0.0025).toFixed(5)
    }
  }

  const getPotentialWin = (matchId: number, odds: number) => {
    if (activeCurrency === "virtual") {
      return Math.floor((betAmounts[matchId] || 100) * odds)
    } else {
      return ((cryptoBetAmounts[matchId] || 0.0025) * odds).toFixed(5)
    }
  }

  return (
    <div className="space-y-4">
      {liveMatches.map((match) => (
        <motion.div
          key={match.id}
          className="overflow-hidden rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-red-900/50 to-red-800/50 p-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-600 text-white">
                <Zap className="mr-1 h-3 w-3" />
                LIVE
              </Badge>
              <span className="font-medium text-white">{match.league}</span>
              <span className="text-sm text-red-300">{match.time}</span>
            </div>

            {match.momentum && (
              <div className="flex items-center gap-1 rounded-full bg-gray-800/50 px-2 py-0.5 text-xs backdrop-blur-sm">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-green-400">
                  {match.momentum === "team1" ? match.team1.name : match.team2.name}
                </span>
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src={match.team1.logo || "/placeholder.svg"}
                    alt={match.team1.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  {match.momentum === "team1" && (
                    <motion.div
                      className="absolute -inset-1 rounded-full border-2 border-green-500"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                    />
                  )}
                </div>
                <span className="font-medium text-white">{match.team1.name}</span>
              </div>
              <span className="text-2xl font-bold text-white">{match.team1.score}</span>
            </div>

            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src={match.team2.logo || "/placeholder.svg"}
                    alt={match.team2.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  {match.momentum === "team2" && (
                    <motion.div
                      className="absolute -inset-1 rounded-full border-2 border-green-500"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                    />
                  )}
                </div>
                <span className="font-medium text-white">{match.team2.name}</span>
              </div>
              <span className="text-2xl font-bold text-white">{match.team2.score}</span>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className={`border-gray-700 bg-gray-800 hover:bg-gray-700 ${
                  selectedBets[match.id] === "team1" ? "border-green-500 bg-green-900/30 text-green-400" : "text-white"
                }`}
                onClick={() => handleSelectBet(match.id, "team1")}
              >
                <div className="flex flex-col">
                  <span>{match.team1.name}</span>
                  <span className="text-lg font-bold">{match.odds.team1}x</span>
                </div>
              </Button>

              {match.odds.draw !== null ? (
                <Button
                  variant="outline"
                  className={`border-gray-700 bg-gray-800 hover:bg-gray-700 ${
                    selectedBets[match.id] === "draw" ? "border-green-500 bg-green-900/30 text-green-400" : "text-white"
                  }`}
                  onClick={() => handleSelectBet(match.id, "draw")}
                >
                  <div className="flex flex-col">
                    <span>Draw</span>
                    <span className="text-lg font-bold">{match.odds.draw}x</span>
                  </div>
                </Button>
              ) : (
                <div className="hidden md:block"></div>
              )}

              <Button
                variant="outline"
                className={`border-gray-700 bg-gray-800 hover:bg-gray-700 ${
                  selectedBets[match.id] === "team2" ? "border-green-500 bg-green-900/30 text-green-400" : "text-white"
                }`}
                onClick={() => handleSelectBet(match.id, "team2")}
              >
                <div className="flex flex-col">
                  <span>{match.team2.name}</span>
                  <span className="text-lg font-bold">{match.odds.team2}x</span>
                </div>
              </Button>
            </div>

            {selectedBets[match.id] && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 border-gray-700 p-0 text-white"
                      onClick={() => {
                        if (activeCurrency === "virtual") {
                          handleBetAmountChange(match.id, Math.max(50, (betAmounts[match.id] || 100) - 50))
                        } else {
                          handleBetAmountChange(
                            match.id,
                            Math.max(
                              0.001,
                              Number.parseFloat(((cryptoBetAmounts[match.id] || 0.0025) - 0.001).toFixed(5)),
                            ),
                          )
                        }
                      }}
                    >
                      -
                    </Button>
                    <div className="flex items-center gap-1 rounded-md bg-gray-800 px-3 py-1 text-white">
                      {activeCurrency === "virtual" ? (
                        <Coins className="h-3 w-3 text-yellow-400" />
                      ) : (
                        <Bitcoin className="h-3 w-3 text-orange-400" />
                      )}
                      <span>{getDisplayAmount(match.id)}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 border-gray-700 p-0 text-white"
                      onClick={() => {
                        if (activeCurrency === "virtual") {
                          handleBetAmountChange(match.id, (betAmounts[match.id] || 100) + 50)
                        } else {
                          handleBetAmountChange(
                            match.id,
                            Number.parseFloat(((cryptoBetAmounts[match.id] || 0.0025) + 0.001).toFixed(5)),
                          )
                        }
                      }}
                    >
                      +
                    </Button>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-400">Potential win</div>
                    <div className="flex items-center gap-1 font-bold text-green-400">
                      {activeCurrency === "virtual" ? <Coins className="h-3 w-3" /> : <Bitcoin className="h-3 w-3" />}
                      <span>
                        {getPotentialWin(
                          match.id,
                          selectedBets[match.id] === "team1"
                            ? match.odds.team1
                            : selectedBets[match.id] === "draw"
                              ? match.odds.draw || 0
                              : match.odds.team2,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {placedBets.includes(match.id) ? (
                  <Button
                    disabled={!winningBets.includes(match.id)}
                    className={`w-full ${
                      winningBets.includes(match.id)
                        ? "bg-gradient-to-r from-green-600 to-emerald-600"
                        : "bg-gradient-to-r from-amber-600 to-orange-600"
                    }`}
                  >
                    {winningBets.includes(match.id) ? (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                      >
                        YOU WON! COLLECT WINNINGS
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                        >
                          ●
                        </motion.div>
                        Bet Placed - Waiting for Result
                      </div>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => placeBet(match.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    <div className="flex items-center gap-1">
                      Place Bet
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
