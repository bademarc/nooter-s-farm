"use client";

import { useContext } from "react";
import { GameContext } from "@/context/game-context";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, Leaf, Clock, CircleCheck, Sprout } from "lucide-react";
import React from "react";

// Function to get the appropriate background color for each seed type
const getSeedColor = (seedType: string) => {
  const colorMap: Record<string, string> = {
    wheat: "from-amber-400 to-amber-500",
    carrot: "from-orange-400 to-orange-500",
    radish: "from-red-400 to-red-500",
    lettuce: "from-green-400 to-green-500",
    potato: "from-amber-600 to-amber-700",
    corn: "from-yellow-400 to-yellow-500",
    eggplant: "from-purple-400 to-purple-500",
    tomato: "from-red-500 to-red-600",
    strawberry: "from-pink-400 to-pink-500",
    watermelon: "from-green-500 to-red-400",
    pumpkin: "from-orange-500 to-orange-600"
  };
  
  return colorMap[seedType] || "from-green-400 to-green-500";
};

export const SeedSelector = () => {
  const { seeds, selectedSeed, setSelectedSeed, farmCoins } = useContext(GameContext);

  // Map seed types to appropriate icons
  const getSeedIcon = (seedType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      eggplant: <span className="text-purple-500">🍆</span>, // aubergine
      lettuce: <span className="text-green-500">🥦</span>, // broccoli (closest match)
      carrot: <span className="text-orange-500">🥕</span>, // carrot
      corn: <span className="text-yellow-500">🌽</span>, // corn
      tomato: <span className="text-red-500">🍅</span>, // tomato
      watermelon: <span className="text-green-500">🍐</span>, // pear (as replacement)
      radish: <span className="text-pink-500">🥬</span>, // radish 
      strawberry: <span className="text-green-500">🥒</span>, // zucchini (as replacement)
      wheat: <span className="text-yellow-400">🌾</span>, // wheat
      potato: <span className="text-amber-700">🥔</span>, // potato
      pumpkin: <span className="text-orange-600">🎃</span>, // pumpkin
    };
    
    return iconMap[seedType] || <Sprout className="text-green-500 w-6 h-6" />;
  };

  // Improved click handler with better error prevention
  const handleSeedClick = (seed: any) => {
    if (farmCoins < seed.cost) return; // Don't allow selection if not enough coins
    setSelectedSeed(selectedSeed?.type === seed.type ? null : seed);
  };

  return (
    <div className="bg-black border border-[#333] noot-text">
      <div className="p-4">
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 mb-4 max-h-[280px] overflow-y-auto pr-1">
          {seeds.map((seed) => (
            <div
              key={seed.type}
              onClick={() => handleSeedClick(seed)}
              className={`aspect-square flex flex-col items-center justify-center p-2 border transition-all duration-200 cursor-pointer ${
                selectedSeed?.type === seed.type 
                  ? "bg-[#222] border-white" 
                  : "bg-black border-[#333] hover:border-white"
              } ${
                farmCoins < seed.cost ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="w-10 h-10 border border-[#333] flex items-center justify-center text-lg font-bold text-white mb-1 bg-black">
                {getSeedIcon(seed.type)}
              </div>
              <span className="text-xs font-medium text-white truncate max-w-full">{seed.name}</span>
              <div className="mt-1 flex items-center justify-center bg-[#111] border border-[#333] px-2 py-0.5">
                <CircleDollarSign className="text-white w-3 h-3 mr-0.5" />
                <span className="text-xs text-white">{seed.cost}</span>
              </div>
            </div>
          ))}
        </div>
        
        {selectedSeed && (
          <div className="mt-3 p-4 bg-[#111] border border-[#333] transition-all duration-300 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 border border-[#333] flex items-center justify-center text-lg font-bold text-white mr-2 bg-black">
                  {getSeedIcon(selectedSeed.type)}
                </div>
                <div>
                  <h3 className="font-medium text-white">{selectedSeed.name}</h3>
                  <div className="text-xs text-white/60">Level {selectedSeed.level}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-black border border-[#333] px-2 py-1">
                <CircleDollarSign className="text-white w-4 h-4" />
                <span className="text-white font-medium">{selectedSeed.cost}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mb-3">
              <div className="flex-1 bg-black border border-[#333] p-2 text-center">
                <div className="text-xs text-white/60 flex items-center justify-center">
                  <Clock className="w-3 h-3 mr-1 text-white" />
                  Growth
                </div>
                <div className="text-sm font-medium text-white">{Math.round(selectedSeed.growthTime * 60)}s</div>
              </div>
              <div className="flex-1 bg-black border border-[#333] p-2 text-center">
                <div className="text-xs text-white/60 flex items-center justify-center">
                  <CircleDollarSign className="w-3 h-3 mr-1 text-white" />
                  Reward
                </div>
                <div className="text-sm font-medium text-white">{selectedSeed.reward}</div>
              </div>
              <div className="flex-1 bg-black border border-[#333] p-2 text-center">
                <div className="text-xs text-white/60 flex items-center justify-center">
                  <CircleCheck className="w-3 h-3 mr-1 text-white" />
                  ROI
                </div>
                <div className="text-sm font-medium text-white">{Math.round((selectedSeed.reward / selectedSeed.cost) * 100)}%</div>
              </div>
            </div>
            
            <div className="flex items-center text-xs text-white bg-black border border-[#333] p-2">
              <Leaf className="w-3 h-3 mr-1 text-white flex-shrink-0" />
              <span>Grows in {Math.round(selectedSeed.growthTime * 60)}s and yields {selectedSeed.reward} coins when harvested.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};