"use client"

import { useState } from "react"
import { Trophy, Medal, Star, ArrowUp, ArrowDown, Minus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

// Sample leaderboard data
const farmValueLeaderboard = [
  { id: 1, name: "FarmKing", avatar: "/placeholder.svg?height=40&width=40", value: 2500000, change: "up" },
  { id: 2, name: "HarvestQueen", avatar: "/placeholder.svg?height=40&width=40", value: 2250000, change: "down" },
  { id: 3, name: "CropMaster", avatar: "/placeholder.svg?height=40&width=40", value: 2100000, change: "up" },
  { id: 4, name: "NooterLord", avatar: "/placeholder.svg?height=40&width=40", value: 1950000, change: "same" },
  { id: 5, name: "FarmExpert", avatar: "/placeholder.svg?height=40&width=40", value: 1800000, change: "up" },
  { id: 6, name: "FarmerJoe123", avatar: "/placeholder.svg?height=40&width=40", value: 1650000, change: "down" },
  { id: 7, name: "GreenThumb", avatar: "/placeholder.svg?height=40&width=40", value: 1500000, change: "up" },
  { id: 8, name: "HayMaker", avatar: "/placeholder.svg?height=40&width=40", value: 1350000, change: "same" },
  { id: 9, name: "CropWizard", avatar: "/placeholder.svg?height=40&width=40", value: 1200000, change: "down" },
  { id: 10, name: "FieldMaster", avatar: "/placeholder.svg?height=40&width=40", value: 1050000, change: "up" },
]

const nooterRacingLeaderboard = [
  { id: 1, name: "SpeedyFarmer", avatar: "/placeholder.svg?height=40&width=40", value: 152, change: "up" },
  { id: 2, name: "RacingQueen", avatar: "/placeholder.svg?height=40&width=40", value: 145, change: "up" },
  { id: 3, name: "NooterRacer", avatar: "/placeholder.svg?height=40&width=40", value: 139, change: "down" },
  { id: 4, name: "FastNooter", avatar: "/placeholder.svg?height=40&width=40", value: 132, change: "same" },
  { id: 5, name: "RacingKing", avatar: "/placeholder.svg?height=40&width=40", value: 128, change: "up" },
  { id: 6, name: "FarmerJoe123", avatar: "/placeholder.svg?height=40&width=40", value: 120, change: "down" },
  { id: 7, name: "SpeedDemon", avatar: "/placeholder.svg?height=40&width=40", value: 115, change: "up" },
  { id: 8, name: "RaceMaster", avatar: "/placeholder.svg?height=40&width=40", value: 110, change: "same" },
  { id: 9, name: "NooterPro", avatar: "/placeholder.svg?height=40&width=40", value: 105, change: "down" },
  { id: 10, name: "TrackStar", avatar: "/placeholder.svg?height=40&width=40", value: 100, change: "up" },
]

const cropYieldLeaderboard = [
  { id: 1, name: "HarvestKing", avatar: "/placeholder.svg?height=40&width=40", value: 50000, change: "up" },
  { id: 2, name: "CropQueen", avatar: "/placeholder.svg?height=40&width=40", value: 48500, change: "same" },
  { id: 3, name: "MasterGrower", avatar: "/placeholder.svg?height=40&width=40", value: 47200, change: "up" },
  { id: 4, name: "FarmWizard", avatar: "/placeholder.svg?height=40&width=40", value: 45800, change: "down" },
  { id: 5, name: "GreenGiant", avatar: "/placeholder.svg?height=40&width=40", value: 44500, change: "up" },
  { id: 6, name: "FarmerJoe123", avatar: "/placeholder.svg?height=40&width=40", value: 42000, change: "down" },
  { id: 7, name: "CropMaster", avatar: "/placeholder.svg?height=40&width=40", value: 41500, change: "up" },
  { id: 8, name: "HarvestPro", avatar: "/placeholder.svg?height=40&width=40", value: 40200, change: "same" },
  { id: 9, name: "FieldKing", avatar: "/placeholder.svg?height=40&width=40", value: 39000, change: "down" },
  { id: 10, name: "GrowMaster", avatar: "/placeholder.svg?height=40&width=40", value: 37500, change: "up" },
]

export default function LeaderboardsPage() {
  const [timeFrame, setTimeFrame] = useState("weekly")

  const getChangeIcon = (change: string) => {
    switch (change) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const formatValue = (value: number, type: string) => {
    if (type === "farm") {
      return `$${value.toLocaleString()}`
    } else if (type === "race") {
      return `${value} wins`
    } else {
      return `${value.toLocaleString()} kg`
    }
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    if (rank === 2) return "bg-gray-100 text-gray-800 border-gray-300"
    if (rank === 3) return "bg-amber-100 text-amber-800 border-amber-300"
    return "bg-white text-gray-800 border-gray-200"
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
                <h2 className="text-2xl font-bold">Leaderboards</h2>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={timeFrame === "weekly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFrame("weekly")}
                  className={timeFrame === "weekly" ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  Weekly
                </Button>
                <Button
                  variant={timeFrame === "monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFrame("monthly")}
                  className={timeFrame === "monthly" ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  Monthly
                </Button>
                <Button
                  variant={timeFrame === "alltime" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFrame("alltime")}
                  className={timeFrame === "alltime" ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  All Time
                </Button>
              </div>
            </div>

            <Tabs defaultValue="farm">
              <TabsList className="mb-6">
                <TabsTrigger value="farm" className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Farm Value
                </TabsTrigger>
                <TabsTrigger value="race" className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  Nooter Racing
                </TabsTrigger>
                <TabsTrigger value="crop" className="flex items-center gap-1">
                  <Medal className="h-4 w-4" />
                  Crop Yield
                </TabsTrigger>
              </TabsList>

              <TabsContent value="farm">
                <div className="space-y-4">
                  {farmValueLeaderboard.map((player, index) => (
                    <Card
                      key={player.id}
                      className={`hover:shadow-md transition-shadow ${index < 3 ? "border-2" : ""} ${index < 3 ? getRankStyle(index + 1) : ""}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 flex items-center justify-center font-bold rounded-full border-2 border-gray-200">
                            {index + 1}
                          </div>
                          <Avatar>
                            <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
                            <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatValue(player.value, "farm")}</span>
                          {getChangeIcon(player.change)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="race">
                <div className="space-y-4">
                  {nooterRacingLeaderboard.map((player, index) => (
                    <Card
                      key={player.id}
                      className={`hover:shadow-md transition-shadow ${index < 3 ? "border-2" : ""} ${index < 3 ? getRankStyle(index + 1) : ""}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 flex items-center justify-center font-bold rounded-full border-2 border-gray-200">
                            {index + 1}
                          </div>
                          <Avatar>
                            <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
                            <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatValue(player.value, "race")}</span>
                          {getChangeIcon(player.change)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="crop">
                <div className="space-y-4">
                  {cropYieldLeaderboard.map((player, index) => (
                    <Card
                      key={player.id}
                      className={`hover:shadow-md transition-shadow ${index < 3 ? "border-2" : ""} ${index < 3 ? getRankStyle(index + 1) : ""}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 flex items-center justify-center font-bold rounded-full border-2 border-gray-200">
                            {index + 1}
                          </div>
                          <Avatar>
                            <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
                            <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatValue(player.value, "crop")}</span>
                          {getChangeIcon(player.change)}
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
