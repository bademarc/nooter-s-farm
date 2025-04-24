import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Coins, Trophy, TrendingUp, Settings } from "lucide-react"
import BettingHistory from "@/components/betting-history"
import VirtualWallet from "@/components/virtual-wallet"

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-green-100 text-green-800 text-xl dark:bg-green-800 dark:text-green-100">
              JD
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">John Doe</h1>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">Pro Bettor</Badge>
              <span className="text-sm text-muted-foreground">Member since April 2023</span>
            </div>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          <span>Edit Profile</span>
        </Button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <Coins className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Balance</p>
                <h3 className="text-2xl font-bold">5,000</h3>
              </div>
            </div>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Get More
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <Trophy className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rank</p>
                <h3 className="text-2xl font-bold">#42</h3>
              </div>
            </div>
            <Button size="sm" variant="outline">
              Leaderboard
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <h3 className="text-2xl font-bold">68%</h3>
              </div>
            </div>
            <Button size="sm" variant="outline">
              Stats
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Level Progress</CardTitle>
          <CardDescription>Reach level 10 to unlock premium features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Level 7</span>
            <span className="text-sm text-muted-foreground">2,450 / 3,000 XP</span>
          </div>
          <Progress value={82} className="h-2" />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-muted p-3 text-center">
              <div className="text-2xl font-bold">42</div>
              <div className="text-xs text-muted-foreground">Total Bets</div>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <div className="text-2xl font-bold">28</div>
              <div className="text-xs text-muted-foreground">Wins</div>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <div className="text-2xl font-bold">14</div>
              <div className="text-xs text-muted-foreground">Losses</div>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <div className="text-2xl font-bold">+2,450</div>
              <div className="text-xs text-muted-foreground">Profit</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Betting History</TabsTrigger>
          <TabsTrigger value="wallet">Virtual Wallet</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <BettingHistory />
        </TabsContent>
        <TabsContent value="wallet">
          <VirtualWallet />
        </TabsContent>
      </Tabs>
    </div>
  )
}
