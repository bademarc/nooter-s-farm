"use client"

import { useContext } from "react"
import { GameContext } from "@/context/game-context"
import { Star, Flame } from "lucide-react"

export const Navbar = () => {
  const { farmCoins, playerLevel, playerXp } = useContext(GameContext)

  // Calculate XP progress
  const xpRequired = playerLevel * 1000
  const progress = (playerXp / xpRequired) * 100

  return (
    <div className="bg-green-950 text-white p-2 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Star className="text-yellow-400 h-5 w-5" />
        <span className="font-bold">{playerLevel}</span>
        <div className="w-24 h-4 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-500" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-xs text-gray-300">
          {playerXp}/{xpRequired}XP
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <Flame className="text-orange-500 h-5 w-5 mr-1" />
          <span>2</span>
        </div>
        <div className="flex items-center">
          <span className="text-yellow-400 mr-1">🪙</span>
          <span>{farmCoins}</span>
        </div>
      </div>
    </div>
  )
}

