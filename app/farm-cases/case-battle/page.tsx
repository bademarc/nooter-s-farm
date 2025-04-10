"use client"

import { useState, useContext } from "react"
import Link from "next/link"
import { 
  Trophy, 
  Users, 
  BarChart, 
  ArrowLeft, 
  Plus, 
  User, 
  RefreshCw,
  Check,
  X
} from "lucide-react"
import { GameContext } from "@/context/game-context"

// Define the battle type
interface Battle {
  id: string
  title: string
  participants: {
    id: string
    name: string
    avatar: string
    cases: Array<{
      id: string
      name: string
      value: number
      opened: boolean
      result?: {
        name: string
        rarity: string
        value: number
      }
    }>
    totalValue: number
  }[]
  status: "waiting" | "active" | "completed"
  winner?: string
  createdAt: Date
}

// Mock data for battles
const mockBattles: Battle[] = [
  {
    id: "battle-1",
    title: "Farming Showdown",
    participants: [
      {
        id: "user-1",
        name: "FarmKing",
        avatar: "👨‍🌾",
        cases: [
          { id: "case-1", name: "Seed Chest", value: 100, opened: true, result: { name: "Magic Beans", rarity: "Rare", value: 350 } },
          { id: "case-2", name: "Livestock Box", value: 200, opened: true, result: { name: "Golden Chicken", rarity: "Legendary", value: 600 } }
        ],
        totalValue: 950
      },
      {
        id: "user-2",
        name: "HarvestQueen",
        avatar: "👩‍🌾",
        cases: [
          { id: "case-3", name: "Tool Crate", value: 150, opened: true, result: { name: "Silver Hoe", rarity: "Uncommon", value: 200 } },
          { id: "case-4", name: "Orchard Package", value: 250, opened: true, result: { name: "Apple Tree Sapling", rarity: "Common", value: 150 } }
        ],
        totalValue: 350
      }
    ],
    status: "completed",
    winner: "user-1",
    createdAt: new Date("2023-06-15")
  },
  {
    id: "battle-2",
    title: "Seasonal Farmers Match",
    participants: [
      {
        id: "user-3",
        name: "CropMaster",
        avatar: "🧑‍🌾",
        cases: [
          { id: "case-5", name: "Weather Box", value: 175, opened: false },
          { id: "case-6", name: "Crop Booster", value: 125, opened: false }
        ],
        totalValue: 0
      },
      {
        id: "user-4",
        name: "SoilTiller",
        avatar: "👨‍🌾",
        cases: [
          { id: "case-7", name: "Animal Feed", value: 150, opened: false },
          { id: "case-8", name: "Fertilizer Pack", value: 100, opened: false }
        ],
        totalValue: 0
      }
    ],
    status: "waiting",
    createdAt: new Date("2023-06-16")
  }
]

// Component for case battle
export default function CaseBattlePage() {
  const { playerLevel, playerXp } = useContext(GameContext)
  const [battles, setBattles] = useState<Battle[]>(mockBattles)
  const [activeTab, setActiveTab] = useState<"ongoing" | "completed" | "create">("ongoing")

  // Function to join a battle
  const joinBattle = (battleId: string) => {
    // Logic to join a battle would go here
    // For now, just show a notification
    console.log(`Joined battle: ${battleId}`)
  }

  // Function to start a battle
  const startBattle = (battleId: string) => {
    setBattles(prev => prev.map(battle => 
      battle.id === battleId 
        ? { ...battle, status: "active" } 
        : battle
    ))
  }

  // Function to simulate opening a case
  const openCase = (battleId: string, participantId: string, caseId: string) => {
    // In a real app, this would make an API call
    // For demo, we'll generate a random result
    setBattles(prev => prev.map(battle => {
      if (battle.id !== battleId) return battle
      
      // Calculate a random value for the case opening
      const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"]
      const randomRarity = rarities[Math.floor(Math.random() * rarities.length)]
      const baseValue = Math.floor(Math.random() * 200) + 50
      const rarityMultiplier = 
        randomRarity === "Common" ? 1 :
        randomRarity === "Uncommon" ? 1.5 :
        randomRarity === "Rare" ? 2.5 :
        randomRarity === "Epic" ? 4 : 8
      
      const finalValue = Math.floor(baseValue * rarityMultiplier)
      
      // Update the case to be opened with results
      const updatedParticipants = battle.participants.map(participant => {
        if (participant.id !== participantId) return participant
        
        const updatedCases = participant.cases.map(c => {
          if (c.id !== caseId) return c
          return {
            ...c,
            opened: true,
            result: {
              name: `Farm Item #${Math.floor(Math.random() * 1000)}`,
              rarity: randomRarity,
              value: finalValue
            }
          }
        })
        
        // Calculate new total value
        const newTotalValue = updatedCases.reduce((sum, c) => 
          sum + (c.result?.value || 0), 0
        )
        
        return {
          ...participant,
          cases: updatedCases,
          totalValue: newTotalValue
        }
      })
      
      // Check if battle is completed
      const allCasesOpened = updatedParticipants.every(p => 
        p.cases.every(c => c.opened)
      )
      
      let updatedStatus = battle.status
      let winner = battle.winner
      
      if (allCasesOpened && battle.status === "active") {
        updatedStatus = "completed"
        
        // Determine winner
        const highestValue = Math.max(...updatedParticipants.map(p => p.totalValue))
        const winningParticipant = updatedParticipants.find(p => p.totalValue === highestValue)
        
        if (winningParticipant) {
          winner = winningParticipant.id
          
          // If the player won, add XP - removed as addPlayerXp is not available
        }
      }
      
      return {
        ...battle,
        participants: updatedParticipants,
        status: updatedStatus,
        winner
      }
    }))
  }

  // Render different tabs based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "ongoing":
        return (
          <div className="space-y-6">
            <h2 className="noot-title text-xl mb-4">Available Battles</h2>
            {battles.filter(b => b.status !== "completed").length === 0 ? (
              <div className="noot-card p-8 text-center">
                <div className="text-4xl mb-4">🏆</div>
                <p className="text-muted-foreground">No ongoing battles found</p>
                <button 
                  className="noot-button bg-white text-black mt-4"
                  onClick={() => setActiveTab("create")}
                >
                  Create a Battle
                </button>
              </div>
            ) : (
              battles
                .filter(b => b.status !== "completed")
                .map(battle => (
                  <div key={battle.id} className="noot-card">
                    <div className="border-b border-[var(--noot-border)] p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{battle.title}</h3>
                        <div className="text-sm text-white/60 flex items-center mt-1">
                          <Users className="h-3 w-3 mr-1" />
                          {battle.participants.length} participants
                        </div>
                      </div>
                      <div className="flex">
                        {battle.status === "waiting" && (
                          <button 
                            className="noot-button bg-white text-black"
                            onClick={() => startBattle(battle.id)}
                          >
                            Start Battle
                          </button>
                        )}
                        {battle.status === "active" && (
                          <div className="px-3 py-1 bg-accent text-white text-xs flex items-center rounded-sm">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            In Progress
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {battle.participants.map(participant => (
                          <div key={participant.id} className="border border-[var(--noot-border)] bg-[var(--noot-bg)] p-4">
                            <div className="flex items-center mb-4">
                              <div className="h-8 w-8 flex items-center justify-center bg-[var(--noot-accent)] rounded-full mr-3 text-lg">
                                {participant.avatar}
                              </div>
                              <div>
                                <div className="font-medium">{participant.name}</div>
                                <div className="text-sm text-white/60">
                                  Total value: {participant.totalValue}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {participant.cases.map(c => (
                                <div 
                                  key={c.id} 
                                  className="flex items-center justify-between bg-[var(--noot-accent)] border border-[var(--noot-border)] p-2"
                                >
                                  <div>
                                    <div className="text-sm font-medium text-white">{c.name}</div>
                                    <div className="text-xs text-white/60">Value: {c.value}</div>
                                  </div>
                                  {battle.status === "active" && !c.opened && (
                                    <button
                                      className="px-3 py-1 bg-white text-black text-xs rounded-sm"
                                      onClick={() => openCase(battle.id, participant.id, c.id)}
                                    >
                                      Open
                                    </button>
                                  )}
                                  {c.opened && c.result && (
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-white">{c.result.name}</div>
                                      <div className={`text-xs ${
                                        c.result.rarity === "Legendary" ? "text-yellow-500" :
                                        c.result.rarity === "Epic" ? "text-purple-500" :
                                        c.result.rarity === "Rare" ? "text-blue-500" :
                                        c.result.rarity === "Uncommon" ? "text-green-500" :
                                        "text-gray-500"
                                      }`}>
                                        {c.result.rarity} | {c.result.value}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )
      
      case "completed":
        return (
          <div className="space-y-6">
            <h2 className="noot-title text-xl mb-4">Completed Battles</h2>
            {battles.filter(b => b.status === "completed").length === 0 ? (
              <div className="noot-card p-8 text-center">
                <p className="text-muted-foreground">No completed battles found</p>
              </div>
            ) : (
              battles
                .filter(b => b.status === "completed")
                .map(battle => {
                  const winner = battle.participants.find(p => p.id === battle.winner)
                  
                  return (
                    <div key={battle.id} className="noot-card">
                      <div className="border-b border-[var(--noot-border)] p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{battle.title}</h3>
                          <div className="text-sm text-white/60 mt-1">
                            {new Date(battle.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-[var(--noot-accent)] text-white text-xs flex items-center rounded-sm">
                          Completed
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-center border border-[var(--noot-border)] bg-[var(--noot-bg)] p-4 mb-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex items-center justify-center bg-yellow-500/20 rounded-full mr-3 text-xl">
                              {winner?.avatar || "👑"}
                            </div>
                            <div>
                              <div className="font-medium text-white">{winner?.name || "Unknown"} won!</div>
                              <div className="text-sm text-white/60">
                                Total value: {winner?.totalValue || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {battle.participants.map(participant => (
                            <div 
                              key={participant.id} 
                              className={`border ${
                                participant.id === battle.winner 
                                  ? "border-yellow-500" 
                                  : "border-[var(--noot-border)]"
                              } bg-[var(--noot-bg)] p-4`}
                            >
                              <div className="flex items-center mb-4">
                                <div className="h-8 w-8 flex items-center justify-center bg-[var(--noot-accent)] rounded-full mr-3 text-lg">
                                  {participant.avatar}
                                </div>
                                <div>
                                  <div className="font-medium text-white">{participant.name}</div>
                                  <div className="text-sm text-white/60">
                                    Total value: {participant.totalValue}
                                  </div>
                                </div>
                                {participant.id === battle.winner && (
                                  <div className="ml-2 text-yellow-500">
                                    <Trophy className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                {participant.cases.map(c => (
                                  <div 
                                    key={c.id} 
                                    className="flex items-center justify-between bg-[var(--noot-accent)] border border-[var(--noot-border)] p-2"
                                  >
                                    <div>
                                      <div className="text-sm font-medium text-white">{c.name}</div>
                                      <div className="text-xs text-white/60">Value: {c.value}</div>
                                    </div>
                                    {c.result && (
                                      <div className="text-right">
                                        <div className="text-sm font-medium text-white">{c.result.name}</div>
                                        <div className={`text-xs ${
                                          c.result.rarity === "Legendary" ? "text-yellow-500" :
                                          c.result.rarity === "Epic" ? "text-purple-500" :
                                          c.result.rarity === "Rare" ? "text-blue-500" :
                                          c.result.rarity === "Uncommon" ? "text-green-500" :
                                          "text-gray-500"
                                        }`}>
                                          {c.result.rarity} | {c.result.value}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        )
      
      case "create":
        return (
          <div className="space-y-6">
            <h2 className="noot-title text-xl mb-4">Create New Battle</h2>
            <div className="noot-card p-6">
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-1">Battle Title</label>
                <input
                  type="text"
                  className="noot-input w-full"
                  placeholder="Enter a title for your battle"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-1">Select Cases</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-[var(--noot-border)] bg-[var(--noot-bg)] p-3 cursor-pointer hover:border-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Farm Tools Case</div>
                        <div className="text-xs text-white/60">Value: 120</div>
                      </div>
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="border border-[var(--noot-border)] bg-[var(--noot-bg)] p-3 cursor-pointer hover:border-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Seed Collection</div>
                        <div className="text-xs text-white/60">Value: 80</div>
                      </div>
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="border border-[var(--noot-border)] bg-[var(--noot-bg)] p-3 cursor-pointer hover:border-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Animal Treats</div>
                        <div className="text-xs text-white/60">Value: 150</div>
                      </div>
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="border border-[var(--noot-border)] bg-[var(--noot-bg)] p-3 cursor-pointer hover:border-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Fertilizer Box</div>
                        <div className="text-xs text-white/60">Value: 100</div>
                      </div>
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm text-white/60 mb-1">Selected Cases</label>
                <div className="border border-[var(--noot-border)] bg-[var(--noot-bg)] p-3 text-center text-white/60">
                  No cases selected
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  className="noot-button bg-white text-black"
                  onClick={() => setActiveTab("ongoing")}
                >
                  Create Battle
                </button>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 noot-theme min-h-screen bg-black">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/farm-cases" className="mr-2">
            <button className="noot-button border-2 border-yellow-500 bg-black hover:bg-yellow-500 hover:text-black font-bold py-2 px-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          </Link>
          <Link href="/">
            <button className="noot-button border-2 border-yellow-500 bg-black hover:bg-yellow-500 hover:text-black font-bold py-2 px-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Main Page
            </button>
          </Link>
          <h1 className="text-3xl text-gradient-gold noot-title ml-4">Case Battles</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-black border-2 border-yellow-500 px-3 py-1">
            <BarChart className="h-4 w-4 mr-2 text-yellow-500" />
            <span className="text-sm font-bold">Level {playerLevel} | {playerXp} XP</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex border-b-2 border-yellow-500">
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "ongoing" 
              ? "border-yellow-500 text-yellow-500" 
              : "border-transparent text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab("ongoing")}
        >
          Ongoing Battles
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "completed" 
              ? "border-yellow-500 text-yellow-500" 
              : "border-transparent text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed Battles
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "create" 
              ? "border-yellow-500 text-yellow-500" 
              : "border-transparent text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab("create")}
        >
          Create Battle
        </button>
      </div>

      {renderTabContent()}
    </div>
  )
} 