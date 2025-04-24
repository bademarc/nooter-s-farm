"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Trophy, Users, TrendingUp, ArrowRight, Bitcoin, Coins } from "lucide-react"

interface PopularBetsProps {
  onPlaceBet: (amount: number) => void
  activeCurrency: "virtual" | "crypto"
}

// Sample data for popular bets
const popularBets = [
  {
    id: 1,
    title: "Premier League Winner",
    description: "Which team will win the Premier League this season?",
    options: [
      { name: "Manchester City", odds: 1.8, users: 1245 },
      { name: "Arsenal", odds: 3.5, users: 876 },
      { name: "Liverpool", odds: 4.2, users: 654 },
    ],
    trending: true,
    featured: true,
  },
  {
    id: 2,
    title: "NBA Finals MVP",
    description: "Who will be named the MVP of the NBA Finals?",
    options: [
      { name: "LeBron James", odds: 3.2, users: 987 },
      { name: "Steph Curry", odds: 2.8, users: 1102 },
      { name: "Giannis Antetokounmpo", odds: 4.5, users: 543 },
    ],
    trending: false,
    featured: true,
  },
  {
    id: 3,
    title: "Champions League Top Scorer",
    description: "Who will score the most goals in this season's Champions League?",
    options: [
      { name: "Erling Haaland", odds: 2.1, users: 1532 },
      { name: "Kylian Mbappé", odds: 2.5, users: 1245 },
      { name: "Robert Lewandowski", odds: 3.8, users: 876 },
    ],
    trending: true,
    featured: false,
  },
]

export default function PopularBets({ onPlaceBet, activeCurrency }: PopularBetsProps) {
  const [selectedBets, setSelectedBets] = useState<{ [key: number]: string }>({})
  const [betAmounts, setBetAmounts] = useState<{ [key: number]: number }>({})
  const [cryptoBetAmounts, setCryptoBetAmounts] = useState<{ [key: number]: number }>({})
  const [placedBets, setPlacedBets] = useState<number[]>([])

  const handleSelectBet = (betId: number, option: string) => {
    setSelectedBets((prev) => ({
      ...prev,
      [betId]: option,
    }))

    if (!betAmounts[betId]) {
      setBetAmounts((prev) => ({
        ...prev,
        [betId]: 100, // Default bet amount
      }))
    }

    if (!cryptoBetAmounts[betId]) {
      setCryptoBetAmounts((prev) => ({
        ...prev,
        [betId]: 0.0025, // Default crypto bet amount
      }))
    }
  }

  const handleBetAmountChange = (betId: number, value: string) => {
    if (activeCurrency === "virtual") {
      setBetAmounts((prev) => ({
        ...prev,
        [betId]: Number.parseInt(value) || 100,
      }))
    } else {
      setCryptoBetAmounts((prev) => ({
        ...prev,
        [betId]: Number.parseFloat(value) || 0.0025,
      }))
    }
  }

  const placeBet = (betId: number) => {
    if (!selectedBets[betId] || placedBets.includes(betId)) return

    const amount = activeCurrency === "virtual" ? betAmounts[betId] || 100 : (cryptoBetAmounts[betId] || 0.0025) * 40000 // Convert to virtual for internal tracking

    onPlaceBet(amount)
    setPlacedBets((prev) => [...prev, betId])
  }

  const getPotentialWin = (betId: number, odds: number) => {
    if (activeCurrency === "virtual") {
      return Math.floor((betAmounts[betId] || 100) * odds)
    } else {
      return ((cryptoBetAmounts[betId] || 0.0025) * odds).toFixed(5)
    }
  }

  return (
    <div className="space-y-4">
      {popularBets.map((bet) => (
        <motion.div
          key={bet.id}
          className="overflow-hidden rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/50 to-purple-800/50 p-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600 text-white">
                <Trophy className="mr-1 h-3 w-3" />
                POPULAR
              </Badge>
              <span className="font-medium text-white">{bet.title}</span>
            </div>

            {bet.trending && (
              <div className="flex items-center gap-1 rounded-full bg-green-900/50 px-2 py-0.5 text-xs backdrop-blur-sm">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-green-400">Trending</span>
              </div>
            )}
          </div>

          <div className="p-4">
            <p className="mb-4 text-sm text-gray-300">{bet.description}</p>

            <div className="mb-4 space-y-2">
              {bet.options.map((option) => (
                <div
                  key={option.name}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    selectedBets[bet.id] === option.name
                      ? "border-green-500 bg-green-900/20"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                  }`}
                  onClick={() => handleSelectBet(bet.id, option.name)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{option.name}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="h-3 w-3" />
                        <span>{option.users} users</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-400">{option.odds}x</div>
                  </div>
                </div>
              ))}
            </div>

            {selectedBets[bet.id] && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">Bet amount</div>
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
                      value={
                        activeCurrency === "virtual" ? betAmounts[bet.id] || 100 : cryptoBetAmounts[bet.id] || 0.0025
                      }
                      onChange={(e) => handleBetAmountChange(bet.id, e.target.value)}
                      className="w-24 border-gray-700 bg-gray-800 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-md bg-gray-800 p-2 text-sm">
                  <span className="text-gray-400">Potential win:</span>
                  <span className="flex items-center gap-1 font-bold text-green-400">
                    {activeCurrency === "virtual" ? <Coins className="h-3 w-3" /> : <Bitcoin className="h-3 w-3" />}
                    <span>
                      {getPotentialWin(bet.id, bet.options.find((o) => o.name === selectedBets[bet.id])?.odds || 0)}
                    </span>
                  </span>
                </div>

                {placedBets.includes(bet.id) ? (
                  <Button disabled className="w-full bg-gradient-to-r from-amber-600 to-orange-600">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      >
                        ●
                      </motion.div>
                      Bet Placed
                    </div>
                  </Button>
                ) : (
                  <Button
                    onClick={() => placeBet(bet.id)}
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
