"use client"

import { useState } from "react"
import { Trophy, Search, Filter, Star, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

// Sample achievements data
const achievements = [
  {
    id: 1,
    title: "Crop Master",
    description: "Harvest 1,000 crops",
    icon: "🌽",
    progress: 85,
    total: 1000,
    current: 850,
    rarity: "Uncommon",
    category: "Farming",
    unlocked: true,
    reward: "500 Farm Coins",
  },
  {
    id: 2,
    title: "Animal Whisperer",
    description: "Raise 50 animals to max happiness",
    icon: "🐄",
    progress: 64,
    total: 50,
    current: 32,
    rarity: "Rare",
    category: "Animals",
    unlocked: true,
    reward: "Special Nooter Feed",
  },
  {
    id: 3,
    title: "Social Butterfly",
    description: "Make 100 friends in the game",
    icon: "🦋",
    progress: 42,
    total: 100,
    current: 42,
    rarity: "Epic",
    category: "Social",
    unlocked: true,
    reward: "Exclusive Profile Frame",
  },
  {
    id: 4,
    title: "Nooter Champion",
    description: "Win 25 Nooter races",
    icon: "🏆",
    progress: 20,
    total: 25,
    current: 5,
    rarity: "Legendary",
    category: "Competition",
    unlocked: true,
    reward: "Golden Nooter Statue",
  },
  {
    id: 5,
    title: "Seed Collector",
    description: "Collect all 50 seed varieties",
    icon: "🌱",
    progress: 76,
    total: 50,
    current: 38,
    rarity: "Rare",
    category: "Farming",
    unlocked: true,
    reward: "Rare Mystery Seeds",
  },
  {
    id: 6,
    title: "Master Trader",
    description: "Complete 200 trades with other players",
    icon: "🔄",
    progress: 35,
    total: 200,
    current: 70,
    rarity: "Epic",
    category: "Social",
    unlocked: true,
    reward: "Trading Post Upgrade",
  },
  {
    id: 7,
    title: "Farm Architect",
    description: "Unlock all farm building upgrades",
    icon: "🏡",
    progress: 60,
    total: 20,
    current: 12,
    rarity: "Epic",
    category: "Building",
    unlocked: true,
    reward: "Exclusive Building Skin",
  },
  {
    id: 8,
    title: "Secret Achievement",
    description: "???",
    icon: "❓",
    progress: 0,
    total: 1,
    current: 0,
    rarity: "Legendary",
    category: "Secret",
    unlocked: false,
    reward: "???",
  },
]

export default function AchievementsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredAchievements = achievements.filter((achievement) => {
    const matchesSearch =
      achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (selectedCategory !== "all") {
      return matchesSearch && achievement.category === selectedCategory
    }

    return matchesSearch
  })

  const categories = ["all", ...new Set(achievements.map((a) => a.category))]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "text-gray-500"
      case "Uncommon":
        return "text-green-500"
      case "Rare":
        return "text-blue-500"
      case "Epic":
        return "text-purple-500"
      case "Legendary":
        return "text-yellow-500"
      default:
        return "text-gray-500"
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress < 25) return "bg-red-500"
    if (progress < 50) return "bg-orange-500"
    if (progress < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-yellow-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-green-500 to-yellow-400 shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/placeholder.svg?height=40&width=40"
              alt="Nooter's Farm Logo"
              className="h-10 w-10 rounded-full"
            />
            <h1 className="text-2xl font-bold text-white">Nooter's Farm</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-white overflow-hidden">
              <img src="/placeholder.svg?height=32&width=32" alt="User Avatar" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                <h2 className="text-2xl font-bold">Achievements</h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                  <Star className="h-4 w-4" />
                  <span className="font-medium">Total Progress: 48%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search achievements..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
                <select
                  className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Tabs defaultValue="in-progress">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="locked">Locked</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAchievements.map((achievement) => (
                    <Card
                      key={achievement.id}
                      className={`hover:shadow-md transition-shadow ${!achievement.unlocked ? "opacity-70" : ""}`}
                    >
                      <CardHeader className="pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center text-2xl">
                            {achievement.unlocked ? achievement.icon : <Lock className="h-6 w-6 text-gray-500" />}
                          </div>
                          <div>
                            <h4 className="font-medium">
                              {achievement.unlocked ? achievement.title : "Locked Achievement"}
                            </h4>
                            <span className={`text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                              {achievement.rarity}
                            </span>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">{achievement.category}</Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">
                          {achievement.unlocked ? achievement.description : "???"}
                        </p>
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>
                              {achievement.unlocked ? `${achievement.current}/${achievement.total}` : "0/???"}
                            </span>
                          </div>
                          <Progress
                            value={achievement.unlocked ? achievement.progress : 0}
                            className={`h-2 ${achievement.unlocked ? getProgressColor(achievement.progress) : "bg-gray-300"}`}
                          />
                        </div>
                        <div className="text-xs bg-gray-100 p-2 rounded-md">
                          <span className="font-medium">Reward:</span>{" "}
                          {achievement.unlocked ? achievement.reward : "???"}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="in-progress">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAchievements
                    .filter((a) => a.unlocked && a.progress > 0 && a.progress < 100)
                    .map((achievement) => (
                      <Card key={achievement.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center text-2xl">
                              {achievement.icon}
                            </div>
                            <div>
                              <h4 className="font-medium">{achievement.title}</h4>
                              <span className={`text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                                {achievement.rarity}
                              </span>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300">{achievement.category}</Badge>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>
                                {achievement.current}/{achievement.total}
                              </span>
                            </div>
                            <Progress
                              value={achievement.progress}
                              className={`h-2 ${getProgressColor(achievement.progress)}`}
                            />
                          </div>
                          <div className="text-xs bg-gray-100 p-2 rounded-md">
                            <span className="font-medium">Reward:</span> {achievement.reward}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="completed">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAchievements
                    .filter((a) => a.unlocked && a.progress === 100)
                    .map((achievement) => (
                      <Card
                        key={achievement.id}
                        className="hover:shadow-md transition-shadow border-2 border-green-300"
                      >
                        <CardHeader className="pb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-2xl">
                              {achievement.icon}
                            </div>
                            <div>
                              <h4 className="font-medium">{achievement.title}</h4>
                              <span className={`text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                                {achievement.rarity}
                              </span>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>
                                {achievement.total}/{achievement.total}
                              </span>
                            </div>
                            <Progress value={100} className="h-2 bg-green-500" />
                          </div>
                          <div className="text-xs bg-gray-100 p-2 rounded-md">
                            <span className="font-medium">Reward:</span> {achievement.reward}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="locked">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAchievements
                    .filter((a) => !a.unlocked)
                    .map((achievement) => (
                      <Card key={achievement.id} className="hover:shadow-md transition-shadow opacity-70">
                        <CardHeader className="pb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Lock className="h-6 w-6 text-gray-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">Locked Achievement</h4>
                              <span className={`text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                                {achievement.rarity}
                              </span>
                            </div>
                          </div>
                          <Badge className="bg-gray-100 text-gray-800 border-gray-300">Locked</Badge>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-3">???</p>
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>0/???</span>
                            </div>
                            <Progress value={0} className="h-2 bg-gray-300" />
                          </div>
                          <div className="text-xs bg-gray-100 p-2 rounded-md">
                            <span className="font-medium">Reward:</span> ???
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
