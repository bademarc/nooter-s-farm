"use client"

import { useContext, useEffect, useState } from "react"
import { GameContext } from "@/context/game-context"
import { Trophy } from "lucide-react"

interface LeaderboardEntry {
  address: string
  name: string
  coins: number
}

export const Leaderboard = () => {
  const { farmCoins, playerName } = useContext(GameContext)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  // Simulate leaderboard data
  useEffect(() => {
    const mockLeaderboard: LeaderboardEntry[] = [
      { address: "0x1234...5678", name: "FarmKing", coins: 5432 },
      { address: "0x8765...4321", name: "CropMaster", coins: 4321 },
      { address: "0x9876...5432", name: "HarvestPro", coins: 3210 },
      { address: "0x5432...9876", name: "SeedWizard", coins: 2109 },
      { address: "0x2109...8765", name: "PlantLord", coins: 1098 },
    ]

    // Add the current player to the leaderboard
    const playerEntry = {
      address: "You",
      name: playerName,
      coins: farmCoins,
    }

    const combinedLeaderboard = [...mockLeaderboard, playerEntry].sort((a, b) => b.coins - a.coins).slice(0, 10)

    setLeaderboard(combinedLeaderboard)
  }, [farmCoins, playerName])

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Trophy className="mr-2 h-5 w-5 text-yellow-400" />
        Leaderboard
      </h2>

      <div className="bg-green-800 rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 bg-green-950 p-2 font-bold">
          <div>Rank</div>
          <div>Farmer</div>
          <div className="text-right">Coins</div>
        </div>

        {leaderboard.map((entry, index) => (
          <div
            key={index}
            className={`grid grid-cols-3 p-2 ${
              entry.address === "You" ? "bg-green-700" : index % 2 === 0 ? "bg-green-800" : "bg-green-850"
            }`}
          >
            <div className="flex items-center">
              {index === 0 && <span className="text-yellow-400 mr-1">🏆</span>}
              {index === 1 && <span className="text-gray-300 mr-1">🥈</span>}
              {index === 2 && <span className="text-amber-700 mr-1">🥉</span>}
              {index > 2 && <span>{index + 1}</span>}
            </div>
            <div className="truncate">{entry.name}</div>
            <div className="text-right">{entry.coins} 🪙</div>
          </div>
        ))}
      </div>
    </div>
  )
}

