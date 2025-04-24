"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Clock, TrendingUp } from "lucide-react"

// Sample data for matches
const allMatches = [
  // Football matches
  {
    id: 1,
    category: "football",
    league: "Premier League",
    status: "live",
    time: "65'",
    team1: {
      name: "Arsenal",
      logo: "/placeholder.svg?height=50&width=50",
      score: 2,
    },
    team2: {
      name: "Chelsea",
      logo: "/placeholder.svg?height=50&width=50",
      score: 1,
    },
    odds: {
      team1: 2.1,
      draw: 3.5,
      team2: 4.2,
    },
  },
  {
    id: 2,
    category: "football",
    league: "La Liga",
    status: "upcoming",
    time: "Tomorrow, 15:30",
    team1: {
      name: "Barcelona",
      logo: "/placeholder.svg?height=50&width=50",
      score: null,
    },
    team2: {
      name: "Real Madrid",
      logo: "/placeholder.svg?height=50&width=50",
      score: null,
    },
    odds: {
      team1: 2.5,
      draw: 3.2,
      team2: 2.8,
    },
  },
  {
    id: 3,
    category: "football",
    league: "Bundesliga",
    status: "upcoming",
    time: "Today, 18:00",
    team1: {
      name: "Bayern Munich",
      logo: "/placeholder.svg?height=50&width=50",
      score: null,
    },
    team2: {
      name: "Dortmund",
      logo: "/placeholder.svg?height=50&width=50",
      score: null,
    },
    odds: {
      team1: 1.7,
      draw: 3.8,
      team2: 4.5,
    },
  },

  // Basketball matches
  {
    id: 4,
    category: "basketball",
    league: "NBA",
    status: "upcoming",
    time: "Today, 20:00",
    team1: {
      name: "Lakers",
      logo: "/placeholder.svg?height=50&width=50",
      score: null,
    },
    team2: {
      name: "Celtics",
      logo: "/placeholder.svg?height=50&width=50",
      score: null,
    },
    odds: {
      team1: 1.9,
      draw: null,
      team2: 2.1,
    },
  },
  {
    id: 5,
    category: "basketball",
    league: "NBA",
    status: "live",
    time: "Q3 5:42",
    team1: {
      name: "Warriors",
      logo: "/placeholder.svg?height=50&width=50",
      score: 67,
    },
    team2: {
      name: "Nets",
      logo: "/placeholder.svg?height=50&width=50",
      score: 72,
    },
    odds: {
      team1: 2.2,
      draw: null,
      team2: 1.8,
    },
  },

  // Tennis matches
  {
    id: 6,
    category: "tennis",
    league: "Wimbledon",
    status: "upcoming",
    time: "Tomorrow, 14:00",
    team1: {
      name: "Djokovic",
      logo: "/placeholder.svg?height=50&width=50",
      score: null,
    },
    team2: {
      name: "Nadal",
      logo: "/placeholder.svg?height=50&width=50",
      score: null,
    },
    odds: {
      team1: 1.8,
      draw: null,
      team2: 2.2,
    },
  },

  // Esports matches
  {
    id: 7,
    category: "esports",
    league: "League of Legends",
    status: "upcoming",
    time: "Today, 22:00",
    team1: {
      name: "T1",
      logo: "/placeholder.svg?height=50&width=50",
      score: null,
    },
    team2: {
      name: "G2",
      logo: "/placeholder.svg?height=50&width=50",
      score: null,
    },
    odds: {
      team1: 1.6,
      draw: null,
      team2: 2.4,
    },
  },
]

interface MatchListProps {
  category: string
}

export default function MatchList({ category }: MatchListProps) {
  const [selectedBets, setSelectedBets] = useState<{ [key: number]: string }>({})

  const handleSelectBet = (matchId: number, betType: string) => {
    setSelectedBets((prev) => ({
      ...prev,
      [matchId]: betType,
    }))
  }

  // Filter matches based on category
  const filteredMatches = category === "all" ? allMatches : allMatches.filter((match) => match.category === category)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredMatches.map((match) => (
        <Card key={match.id} className="overflow-hidden shadow-md transition-all hover:shadow-lg">
          <CardContent className="p-0">
            <div className="flex items-center justify-between bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">{match.league}</span>
                {match.status === "live" ? (
                  <Badge className="bg-red-500 text-white">LIVE</Badge>
                ) : (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{match.time}</span>
                  </div>
                )}
              </div>
              {match.status === "live" && <TrendingUp className="h-4 w-4 text-green-500" />}
            </div>

            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src={match.team1.logo || "/placeholder.svg"}
                    alt={match.team1.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <span className="font-medium">{match.team1.name}</span>
                </div>
                {match.status === "live" && <span className="text-xl font-bold">{match.team1.score}</span>}
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src={match.team2.logo || "/placeholder.svg"}
                    alt={match.team2.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <span className="font-medium">{match.team2.name}</span>
                </div>
                {match.status === "live" && <span className="text-xl font-bold">{match.team2.score}</span>}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button
                  variant={selectedBets[match.id] === "team1" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectBet(match.id, "team1")}
                  className={selectedBets[match.id] === "team1" ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {match.team1.name} <span className="ml-1 font-bold">{match.odds.team1}</span>
                </Button>

                {match.odds.draw !== null && (
                  <Button
                    variant={selectedBets[match.id] === "draw" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelectBet(match.id, "draw")}
                    className={selectedBets[match.id] === "draw" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    Draw <span className="ml-1 font-bold">{match.odds.draw}</span>
                  </Button>
                )}

                <Button
                  variant={selectedBets[match.id] === "team2" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectBet(match.id, "team2")}
                  className={selectedBets[match.id] === "team2" ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {match.team2.name} <span className="ml-1 font-bold">{match.odds.team2}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
