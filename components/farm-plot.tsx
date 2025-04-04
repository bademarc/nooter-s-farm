"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SproutIcon as Seed, TreesIcon as Plant, Timer } from "lucide-react"

interface Plot {
  status: "empty" | "growing" | "ready"
  crop: string | null
  plantedAt: number | null
  readyAt: number | null
}

interface FarmPlotProps {
  plot: Plot
  onPlant: () => void
  onHarvest: () => void
}

export const FarmPlot = ({ plot, onPlant, onHarvest }: FarmPlotProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("")

  useEffect(() => {
    if (plot.status !== "growing" || !plot.readyAt) return

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = plot.readyAt! - now

      if (remaining <= 0) {
        clearInterval(interval)
        setTimeLeft("")
        return
      }

      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setTimeLeft(`${minutes}m ${seconds}s`)
    }, 1000)

    return () => clearInterval(interval)
  }, [plot])

  const getPlotBackground = () => {
    switch (plot.status) {
      case "empty":
        return "bg-amber-800"
      case "growing":
        return "bg-amber-800"
      case "ready":
        return "bg-amber-800"
      default:
        return "bg-amber-800"
    }
  }

  const getCropImage = () => {
    if (plot.status === "empty") return null

    switch (plot.crop) {
      case "carrot":
        return plot.status === "ready" ? "🥕" : "🌱"
      case "potato":
        return plot.status === "ready" ? "🥔" : "🌱"
      case "pumpkin":
        return plot.status === "ready" ? "🎃" : "🌱"
      default:
        return "🌱"
    }
  }

  return (
    <div
      className={`${getPlotBackground()} rounded-lg border-4 border-green-600 p-2 aspect-square flex flex-col items-center justify-center relative overflow-hidden`}
    >
      {plot.status === "empty" ? (
        <Button onClick={onPlant} className="bg-green-700 hover:bg-green-800 text-white" size="sm">
          <Seed className="mr-1 h-4 w-4" />
          Plant
        </Button>
      ) : (
        <>
          <div className="text-4xl mb-2">{getCropImage()}</div>

          {plot.status === "growing" && (
            <div className="text-white text-xs font-mono bg-black/50 px-2 py-1 rounded">
              <Timer className="inline h-3 w-3 mr-1" />
              {timeLeft}
            </div>
          )}

          {plot.status === "ready" && (
            <Button onClick={onHarvest} className="bg-yellow-600 hover:bg-yellow-700 text-white mt-2" size="sm">
              <Plant className="mr-1 h-4 w-4" />
              Harvest
            </Button>
          )}
        </>
      )}
    </div>
  )
}

