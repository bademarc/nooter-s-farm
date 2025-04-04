"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"

interface Seed {
  type: string
  name: string
  icon: string
  cost: number
  growthTime: number
  reward: number
  level: number
  upgradeCost: number
}

interface Plot {
  status: "empty" | "growing" | "ready"
  crop: string | null
  plantedAt: number | null
  readyAt: number | null
}

interface GameContextType {
  farmCoins: number
  addFarmCoins: (amount: number) => void
  playerLevel: number
  playerXp: number
  playerName: string
  plots: Plot[]
  setPlots: (plots: Plot[]) => void
  farmSize: number
  expandFarm: () => void
  selectedSeed: Seed | null
  setSelectedSeed: (seed: Seed | null) => void
  seeds: Seed[]
  upgradeSeed: (seedType: string) => void
}

export const GameContext = createContext<GameContextType>({
  farmCoins: 0,
  addFarmCoins: () => {},
  playerLevel: 1,
  playerXp: 0,
  playerName: "Nooter",
  plots: [],
  setPlots: () => {},
  farmSize: 3,
  expandFarm: () => {},
  selectedSeed: null,
  setSelectedSeed: () => {},
  seeds: [],
  upgradeSeed: () => {},
})

interface GameProviderProps {
  children: ReactNode
}

export const GameProvider = ({ children }: GameProviderProps) => {
  // Initialize state from localStorage or default values
  const [farmCoins, setFarmCoins] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("farmCoins")
      return saved ? Number.parseInt(saved) : 100
    }
    return 100
  })

  const [playerLevel, setPlayerLevel] = useState<number>(1)
  const [playerXp, setPlayerXp] = useState<number>(0)
  const [playerName, setPlayerName] = useState<string>("Nooter")

  const [farmSize, setFarmSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("farmSize")
      return saved ? Number.parseInt(saved) : 3
    }
    return 3
  })

  // Initialize 5x5 grid of empty plots (for future expansion)
  const [plots, setPlots] = useState<Plot[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("plots")
      if (saved) {
        return JSON.parse(saved)
      }
    }

    // Default: 25 empty plots (5x5 grid)
    return Array(25)
      .fill(null)
      .map(() => ({
        status: "empty",
        crop: null,
        plantedAt: null,
        readyAt: null,
      }))
  })

  // Seed definitions
  const [seeds, setSeeds] = useState<Seed[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("seeds")
      if (saved) {
        return JSON.parse(saved)
      }
    }

    return [
      {
        type: "carrot",
        name: "Carrot",
        icon: "🥕",
        cost: 5,
        growthTime: 1, // minutes
        reward: 10,
        level: 1,
        upgradeCost: 50,
      },
      {
        type: "potato",
        name: "Potato",
        icon: "🥔",
        cost: 10,
        growthTime: 2, // minutes
        reward: 20,
        level: 1,
        upgradeCost: 100,
      },
      {
        type: "pumpkin",
        name: "Pumpkin",
        icon: "🎃",
        cost: 15,
        growthTime: 3, // minutes
        reward: 30,
        level: 1,
        upgradeCost: 150,
      },
    ]
  })

  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null)

  // Save state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("farmCoins", farmCoins.toString())
      localStorage.setItem("plots", JSON.stringify(plots))
      localStorage.setItem("farmSize", farmSize.toString())
      localStorage.setItem("seeds", JSON.stringify(seeds))
    }
  }, [farmCoins, plots, farmSize, seeds])

  // Add farm coins and update XP
  const addFarmCoins = (amount: number) => {
    setFarmCoins((prev) => {
      const newAmount = prev + amount
      return newAmount < 0 ? 0 : newAmount
    })

    // If earning coins (positive amount), add XP
    if (amount > 0) {
      const newXp = playerXp + amount
      setPlayerXp(newXp)

      // Level up if enough XP
      const xpRequired = playerLevel * 1000
      if (newXp >= xpRequired) {
        setPlayerLevel((prev) => prev + 1)
        setPlayerXp(newXp - xpRequired)
      }
    }
  }

  // Expand farm size (up to 5x5)
  const expandFarm = () => {
    if (farmSize >= 5 || farmCoins < 100) return

    setFarmSize((prev) => prev + 1)
    addFarmCoins(-100) // Cost to expand
  }

  // Upgrade a seed
  const upgradeSeed = (seedType: string) => {
    const seedIndex = seeds.findIndex((s) => s.type === seedType)
    if (seedIndex === -1) return

    const seed = seeds[seedIndex]
    if (seed.level >= 3 || farmCoins < seed.upgradeCost) return

    const newSeeds = [...seeds]
    newSeeds[seedIndex] = {
      ...seed,
      level: seed.level + 1,
      growthTime: Math.max(seed.growthTime * 0.8, 0.5), // 20% faster growth
      reward: Math.floor(seed.reward * 1.2), // 20% more reward
      upgradeCost: Math.floor(seed.upgradeCost * 1.5), // 50% more expensive next time
    }

    setSeeds(newSeeds)
    addFarmCoins(-seed.upgradeCost)

    // Update selected seed if it was the upgraded one
    if (selectedSeed?.type === seedType) {
      setSelectedSeed(newSeeds[seedIndex])
    }
  }

  return (
    <GameContext.Provider
      value={{
        farmCoins,
        addFarmCoins,
        playerLevel,
        playerXp,
        playerName,
        plots,
        setPlots,
        farmSize,
        expandFarm,
        selectedSeed,
        setSelectedSeed,
        seeds,
        upgradeSeed,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

