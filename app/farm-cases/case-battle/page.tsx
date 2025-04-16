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
    case: {
      id: string
      name: string
      value: number
      opened: boolean
      result?: {
        name: string
        rarity: string
        value: number
      }
    }
    reward?: {
      nootTokens?: number
      farmCoins?: number
    }
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
        case: { 
          id: "case-1", 
          name: "Seed Chest", 
          value: 150, 
          opened: true, 
          result: { name: "Magic Beans", rarity: "Legendary", value: 600 } 
        },
        reward: {
          nootTokens: 150
        }
      },
      {
        id: "user-2",
        name: "HarvestQueen",
        avatar: "👩‍🌾",
        case: { 
          id: "case-3", 
          name: "Tool Crate", 
          value: 150, 
          opened: true, 
          result: { name: "Silver Hoe", rarity: "Rare", value: 300 } 
        }
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
        case: { 
          id: "case-5", 
          name: "Weather Box", 
          value: 175, 
          opened: false 
        }
      },
      {
        id: "user-4",
        name: "SoilTiller",
        avatar: "👨‍🌾",
        case: { 
          id: "case-7", 
          name: "Animal Feed", 
          value: 150, 
          opened: false 
        }
      }
    ],
    status: "waiting",
    createdAt: new Date("2023-06-16")
  }
]

// Rarity values in order from lowest to highest
const rarityValues = {
  "Common": 1,
  "Uncommon": 2,
  "Rare": 3,
  "Epic": 4,
  "Legendary": 5
}

// Rewards based on rarity
const rarityRewards = {
  "Common": { nootTokens: 10, farmCoins: 50 },
  "Uncommon": { nootTokens: 25, farmCoins: 100 },
  "Rare": { nootTokens: 50, farmCoins: 200 },
  "Epic": { nootTokens: 100, farmCoins: 400 },
  "Legendary": { nootTokens: 150, farmCoins: 600 }
}

// Component for case battle
export default function CaseBattlePage() {
  const { playerLevel, playerXp } = useContext(GameContext)
  const [battles, setBattles] = useState<Battle[]>(mockBattles)
  const [activeTab, setActiveTab] = useState<"ongoing" | "completed" | "create">("ongoing")
  const [rewardType, setRewardType] = useState<"nootTokens" | "farmCoins">("nootTokens")

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
      
      // Update the participant's case to be opened with results
      let updatedParticipants = battle.participants.map(participant => {
        if (participant.id !== participantId) return participant
        
        const updatedCase = {
          ...participant.case,
          opened: true,
          result: {
            name: `Farm Item #${Math.floor(Math.random() * 1000)}`,
            rarity: randomRarity,
            value: finalValue
          }
        }
        
        return {
          ...participant,
          case: updatedCase
        }
      })
      
      // Check if battle is completed
      const allCasesOpened = updatedParticipants.every(p => p.case.opened)
      
      let updatedStatus = battle.status
      let winner = battle.winner
      
      if (allCasesOpened && battle.status === "active") {
        updatedStatus = "completed"
        
        // Determine winner based on rarity
        let highestRarityValue = -1
        let highestValueParticipant = null
        
        for (const participant of updatedParticipants) {
          if (participant.case.result) {
            const rarityValue = rarityValues[participant.case.result.rarity as keyof typeof rarityValues]
            if (rarityValue > highestRarityValue) {
              highestRarityValue = rarityValue
              highestValueParticipant = participant
            } else if (rarityValue === highestRarityValue && participant.case.result.value > (highestValueParticipant?.case.result?.value || 0)) {
              // If same rarity, compare by value
              highestValueParticipant = participant
            }
          }
        }
        
        if (highestValueParticipant) {
          winner = highestValueParticipant.id
          
          // Assign reward to winner
          const rarity = highestValueParticipant.case.result!.rarity as keyof typeof rarityRewards
          const reward = rarityRewards[rarity]
          
          // Update participants with reward
          updatedParticipants = updatedParticipants.map(p => {
            if (p.id === winner) {
              return {
                ...p,
                reward: {
                  nootTokens: reward.nootTokens,
                  farmCoins: reward.farmCoins
                }
              }
            }
            return p
          })
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
                              </div>
                            </div>
                            <div>
                              <div 
                                className="flex items-center justify-between bg-[var(--noot-accent)] border border-[var(--noot-border)] p-2"
                              >
                                <div>
                                  <div className="text-sm font-medium text-white">{participant.case.name}</div>
                                  <div className="text-xs text-white/60">Value: {participant.case.value}</div>
                                </div>
                                {battle.status === "active" && !participant.case.opened && (
                                  <button
                                    className="px-3 py-1 bg-white text-black text-xs rounded-sm"
                                    onClick={() => openCase(battle.id, participant.id, participant.case.id)}
                                  >
                                    Open
                                  </button>
                                )}
                                {participant.case.opened && participant.case.result && (
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-white">{participant.case.result.name}</div>
                                    <div className={`text-xs ${
                                      participant.case.result.rarity === "Legendary" ? "text-yellow-500" :
                                      participant.case.result.rarity === "Epic" ? "text-purple-500" :
                                      participant.case.result.rarity === "Rare" ? "text-blue-500" :
                                      participant.case.result.rarity === "Uncommon" ? "text-green-500" :
                                      "text-gray-500"
                                    }`}>
                                      {participant.case.result.rarity} | {participant.case.result.value}
                                    </div>
                                  </div>
                                )}
                              </div>
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
            <div className="mb-4">
              <label className="mr-2 text-white/60">Reward Type:</label>
              <select 
                className="noot-input"
                value={rewardType}
                onChange={(e) => setRewardType(e.target.value as "nootTokens" | "farmCoins")}
              >
                <option value="nootTokens">Noot Tokens</option>
                <option value="farmCoins">Farm Coins</option>
              </select>
            </div>
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
                              <div className="text-sm text-yellow-500">
                                Reward: {winner?.reward ? 
                                  rewardType === "nootTokens" ? 
                                    `${winner.reward.nootTokens} Noot Tokens` : 
                                    `${winner.reward.farmCoins} Farm Coins`
                                  : "None"}
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
                                </div>
                                {participant.id === battle.winner && (
                                  <div className="ml-2 text-yellow-500">
                                    <Trophy className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div 
                                  className="flex items-center justify-between bg-[var(--noot-accent)] border border-[var(--noot-border)] p-2"
                                >
                                  <div>
                                    <div className="text-sm font-medium text-white">{participant.case.name}</div>
                                    <div className="text-xs text-white/60">Value: {participant.case.value}</div>
                                  </div>
                                  {participant.case.result && (
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-white">{participant.case.result.name}</div>
                                      <div className={`text-xs ${
                                        participant.case.result.rarity === "Legendary" ? "text-yellow-500" :
                                        participant.case.result.rarity === "Epic" ? "text-purple-500" :
                                        participant.case.result.rarity === "Rare" ? "text-blue-500" :
                                        participant.case.result.rarity === "Uncommon" ? "text-green-500" :
                                        "text-gray-500"
                                      }`}>
                                        {participant.case.result.rarity} | {participant.case.result.value}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {participant.id === battle.winner && participant.reward && (
                                <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500 text-center">
                                  <span className="text-yellow-500 font-medium">
                                    {rewardType === "nootTokens" ? 
                                      `Won ${participant.reward.nootTokens} Noot Tokens!` : 
                                      `Won ${participant.reward.farmCoins} Farm Coins!`}
                                  </span>
                                </div>
                              )}
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
                <label className="block text-sm text-white/60 mb-1">Select Case</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-[var(--noot-border)] bg-[var(--noot-bg)] p-3 cursor-pointer hover:border-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Farm Tools Case</div>
                        <div className="text-xs text-white/60">Value: 120</div>
                      </div>
                      <Check className="h-4 w-4 text-green-500" />
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
              
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-1">Reward Type</label>
                <select className="noot-input w-full">
                  <option value="nootTokens">Noot Tokens</option>
                  <option value="farmCoins">Farm Coins</option>
                </select>
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