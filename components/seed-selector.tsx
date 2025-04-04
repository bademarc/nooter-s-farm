"use client"

import { useContext } from "react"
import { GameContext } from "@/context/game-context"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export const SeedSelector = () => {
  const { selectedSeed, setSelectedSeed, seeds, upgradeSeed, farmCoins } = useContext(GameContext)

  return (
    <div className="bg-amber-900/80 rounded-lg p-4 border border-amber-700">
      <h3 className="text-white text-center mb-2">Select a seed to plant</h3>
      <div className="grid grid-cols-3 gap-2">
        {seeds.map((seed) => (
          <TooltipProvider key={seed.type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setSelectedSeed(seed)}
                  className={`relative h-16 ${selectedSeed?.type === seed.type ? "ring-2 ring-yellow-400" : ""}`}
                  variant={selectedSeed?.type === seed.type ? "default" : "outline"}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xl">{seed.icon}</span>
                    <span className="text-xs mt-1">{seed.cost}🪙</span>
                  </div>
                  {seed.level > 1 && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {seed.level}
                    </div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p>
                    <strong>{seed.name}</strong>
                  </p>
                  <p>Cost: {seed.cost} Coins</p>
                  <p>Growth: {seed.growthTime} min</p>
                  <p>Reward: {seed.reward} Coins</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      <div className="mt-4">
        <h3 className="text-white text-center mb-2">Upgrades</h3>
        <div className="grid grid-cols-3 gap-2">
          {seeds.map((seed) => (
            <Button
              key={`upgrade-${seed.type}`}
              onClick={() => upgradeSeed(seed.type)}
              disabled={farmCoins < seed.upgradeCost || seed.level >= 3}
              className="text-xs"
              variant="outline"
            >
              Upgrade {seed.icon} ({seed.upgradeCost}🪙)
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

