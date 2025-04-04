"use client"

import { useEffect, useContext } from "react"
import type { ethers } from "ethers"
import { FarmPlot } from "./farm-plot"
import { SeedSelector } from "./seed-selector"
import { GameContext } from "@/context/game-context"
import { Button } from "@/components/ui/button"
import { Expand } from "lucide-react"

interface FarmProps {
  provider: ethers.providers.Web3Provider | null
  isConnected: boolean
}

export const Farm = ({ provider, isConnected }: FarmProps) => {
  const { farmCoins, addFarmCoins, plots, setPlots, farmSize, expandFarm, selectedSeed, setSelectedSeed } =
    useContext(GameContext)

  const handlePlant = (plotIndex: number) => {
    if (!selectedSeed) return

    const plot = plots[plotIndex]
    if (plot.status !== "empty") return

    // Check if player has enough coins
    if (farmCoins < selectedSeed.cost) {
      alert("Not enough Farm Coins!")
      return
    }

    // Plant the seed
    const newPlots = [...plots]
    newPlots[plotIndex] = {
      ...plot,
      status: "growing",
      crop: selectedSeed.type,
      plantedAt: Date.now(),
      readyAt: Date.now() + selectedSeed.growthTime * 60 * 1000,
    }

    setPlots(newPlots)
    addFarmCoins(-selectedSeed.cost)
  }

  const handleHarvest = (plotIndex: number) => {
    const plot = plots[plotIndex]
    if (plot.status !== "ready") return

    // Harvest the crop
    const newPlots = [...plots]
    const cropType = plot.crop
    let reward = 0

    switch (cropType) {
      case "carrot":
        reward = 10
        break
      case "potato":
        reward = 20
        break
      case "pumpkin":
        reward = 30
        break
      default:
        reward = 5
    }

    newPlots[plotIndex] = {
      ...plot,
      status: "empty",
      crop: null,
      plantedAt: null,
      readyAt: null,
    }

    setPlots(newPlots)
    addFarmCoins(reward)
  }

  // Update plot statuses based on time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const newPlots = [...plots]
      let updated = false

      for (let i = 0; i < newPlots.length; i++) {
        const plot = newPlots[i]
        if (plot.status === "growing" && plot.readyAt && now >= plot.readyAt) {
          newPlots[i] = {
            ...plot,
            status: "ready",
          }
          updated = true
        }
      }

      if (updated) {
        setPlots(newPlots)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [plots, setPlots])

  return (
    <div className="bg-green-800 p-4 rounded-lg shadow-lg">
      <div className="mb-4 flex justify-between items-center">
        <div className="text-yellow-300 font-bold">
          <span className="text-xl">🪙 {farmCoins}</span> Farm Coins
        </div>
        <Button
          onClick={expandFarm}
          disabled={farmCoins < 100 || farmSize >= 5}
          className="bg-brown-600 hover:bg-brown-700 text-white"
        >
          <Expand className="mr-2 h-4 w-4" />
          Expand Farm (100 Coins)
        </Button>
      </div>

      <div
        className={`grid grid-cols-${farmSize} gap-4 mb-4`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${farmSize}, 1fr)`,
        }}
      >
        {plots.slice(0, farmSize * farmSize).map((plot, index) => (
          <FarmPlot key={index} plot={plot} onPlant={() => handlePlant(index)} onHarvest={() => handleHarvest(index)} />
        ))}
      </div>

      <SeedSelector />
    </div>
  )
}

