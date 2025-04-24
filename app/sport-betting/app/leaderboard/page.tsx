import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Trophy, TrendingUp, Calendar, Filter } from "lucide-react"

// Sample data for leaderboard
const leaderboardData = [
  {
    id: 1,
    rank: 1,
    name: "Alex Johnson",
    avatar: "AJ",
    winRate: 78,
    profit: 12450,
    bets: 145,
    streak: 8,
    badge: "Elite",
  },
  {
    id: 2,
    rank: 2,
    name: "Sarah Williams",
    avatar: "SW",
    winRate: 72,
    profit: 9870,
    bets: 132,
    streak: 5,
    badge: "Pro",
  },
  {
    id: 3,
    rank: 3,
    name: "Michael Brown",
    avatar: "MB",
    winRate: 70,
    profit: 8540,
    bets: 128,
    streak: 3,
    badge: "Pro",
  },
  {
    id: 4,
    rank: 4,
    name: "Emily Davis",
    avatar: "ED",
    winRate: 68,
    profit: 7650,
    bets: 115,
    streak: 4,
    badge: "Pro",
  },
  {
    id: 5,
    rank: 5,
    name: "John Doe",
    avatar: "JD",
    winRate: 68,
    profit: 6780,
    bets: 110,
    streak: 2,
    badge: "Pro",
  },
  {
    id: 6,
    rank: 6,
    name: "Lisa Anderson",
    avatar: "LA",
    winRate: 65,
    profit: 5430,
    bets: 98,
    streak: 0,
    badge: "Advanced",
  },
  {
    id: 7,
    rank: 7,
    name: "Robert Wilson",
    avatar: "RW",
    winRate: 62,
    profit: 4870,
    bets: 92,
    streak: 2,
    badge: "Advanced",
  },
  {
    id: 8,
    rank: 8,
    name: "Jennifer Taylor",
    avatar: "JT",
    winRate: 60,
    profit: 4250,
    bets: 85,
    streak: 1,
    badge: "Advanced",
  },
  {
    id: 9,
    rank: 9,
    name: "David Martinez",
    avatar: "DM",
    winRate: 58,
    profit: 3780,
    bets: 78,
    streak: 0,
    badge: "Regular",
  },
  {
    id: 10,
    rank: 10,
    name: "Jessica Lee",
    avatar: "JL",
    winRate: 55,
    profit: 3240,
    bets: 72,
    streak: 0,
    badge: "Regular",
  },
]

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">See who's leading the pack in virtual sports betting</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top Winner</p>
              <h3 className="text-xl font-bold">{leaderboardData[0].name}</h3>
              <p className="text-sm text-muted-foreground">{leaderboardData[0].profit} coins profit</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Highest Win Rate</p>
              <h3 className="text-xl font-bold">{leaderboardData[0].name}</h3>
              <p className="text-sm text-muted-foreground">{leaderboardData[0].winRate}% win rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 text-white">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Longest Streak</p>
              <h3 className="text-xl font-bold">{leaderboardData[0].name}</h3>
              <p className="text-sm text-muted-foreground">{leaderboardData[0].streak} wins in a row</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </Button>
      </div>

      <Tabs defaultValue="all-time">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-time">All Time</TabsTrigger>
          <TabsTrigger value="this-month">This Month</TabsTrigger>
          <TabsTrigger value="this-week">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="all-time" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Time Leaders</CardTitle>
              <CardDescription>The top performers since the beginning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">Rank</th>
                      <th className="px-4 py-3 text-left font-medium">User</th>
                      <th className="px-4 py-3 text-right font-medium">Win Rate</th>
                      <th className="px-4 py-3 text-right font-medium">Profit</th>
                      <th className="px-4 py-3 text-right font-medium">Bets</th>
                      <th className="px-4 py-3 text-right font-medium">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {user.rank === 1 && <Trophy className="h-4 w-4 text-amber-500" />}
                            {user.rank === 2 && <Trophy className="h-4 w-4 text-gray-400" />}
                            {user.rank === 3 && <Trophy className="h-4 w-4 text-amber-700" />}
                            <span className="font-medium">{user.rank}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary">{user.avatar}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <Badge
                                variant="outline"
                                className={`
                                  ${user.badge === "Elite" ? "border-amber-500 text-amber-500" : ""}
                                  ${user.badge === "Pro" ? "border-green-500 text-green-500" : ""}
                                  ${user.badge === "Advanced" ? "border-blue-500 text-blue-500" : ""}
                                  ${user.badge === "Regular" ? "border-gray-500 text-gray-500" : ""}
                                `}
                              >
                                {user.badge}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-medium">{user.winRate}%</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-medium text-green-600">{user.profit}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-medium">{user.bets}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-medium">{user.streak}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="this-month" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>This Month's Leaders</CardTitle>
              <CardDescription>The top performers for the current month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-12">
                <p className="text-center text-muted-foreground">Monthly leaderboard data will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="this-week" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>This Week's Leaders</CardTitle>
              <CardDescription>The top performers for the current week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-12">
                <p className="text-center text-muted-foreground">Weekly leaderboard data will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
