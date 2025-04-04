"use client"

import { useContext, useState } from "react"
import { GameContext } from "@/context/game-context"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Trophy, Package, Settings, User, Repeat } from "lucide-react"
import { Leaderboard } from "./leaderboard"
import { TokenSwap } from "./token-swap"

export const Sidebar = () => {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const { farmCoins } = useContext(GameContext)

  const renderTabContent = () => {
    switch (activeTab) {
      case "market":
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Market</h2>
            <p className="text-gray-200">Coming soon! Buy special items for your farm.</p>
          </div>
        )
      case "leaderboard":
        return <Leaderboard />
      case "swap":
        return <TokenSwap />
      case "inventory":
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Inventory</h2>
            <p className="text-gray-200">Your items will appear here.</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-green-950 text-white w-full md:w-64 flex flex-col">
      <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible">
        <Button
          variant="ghost"
          className={`flex-1 justify-start ${activeTab === "market" ? "bg-green-800" : ""}`}
          onClick={() => setActiveTab(activeTab === "market" ? null : "market")}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Market</span>
        </Button>
        <Button
          variant="ghost"
          className={`flex-1 justify-start ${activeTab === "leaderboard" ? "bg-green-800" : ""}`}
          onClick={() => setActiveTab(activeTab === "leaderboard" ? null : "leaderboard")}
        >
          <Trophy className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Leaderboard</span>
        </Button>
        <Button
          variant="ghost"
          className={`flex-1 justify-start ${activeTab === "swap" ? "bg-green-800" : ""}`}
          onClick={() => setActiveTab(activeTab === "swap" ? null : "swap")}
        >
          <Repeat className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Swap Tokens</span>
        </Button>
        <Button
          variant="ghost"
          className={`flex-1 justify-start ${activeTab === "inventory" ? "bg-green-800" : ""}`}
          onClick={() => setActiveTab(activeTab === "inventory" ? null : "inventory")}
        >
          <Package className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Inventory</span>
        </Button>
        <Button variant="ghost" className="flex-1 justify-start" disabled>
          <Settings className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Settings</span>
        </Button>
        <Button variant="ghost" className="flex-1 justify-start" disabled>
          <User className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Profile</span>
        </Button>
      </div>

      {activeTab && <div className="flex-1 bg-green-900 border-t border-green-800">{renderTabContent()}</div>}
    </div>
  )
}

