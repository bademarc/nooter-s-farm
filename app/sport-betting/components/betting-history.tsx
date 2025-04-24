import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Check, X, Clock } from "lucide-react"

// Sample data for betting history
const bettingHistory = [
  {
    id: 1,
    date: "2023-04-23",
    time: "19:45",
    event: "Arsenal vs Chelsea",
    selection: "Arsenal",
    stake: 200,
    odds: 2.1,
    status: "won",
    returns: 420,
  },
  {
    id: 2,
    date: "2023-04-21",
    time: "15:30",
    event: "Lakers vs Celtics",
    selection: "Celtics",
    stake: 150,
    odds: 1.9,
    status: "lost",
    returns: 0,
  },
  {
    id: 3,
    date: "2023-04-20",
    time: "20:00",
    event: "Barcelona vs Real Madrid",
    selection: "Draw",
    stake: 100,
    odds: 3.2,
    status: "won",
    returns: 320,
  },
  {
    id: 4,
    date: "2023-04-18",
    time: "18:15",
    event: "T1 vs G2",
    selection: "T1",
    stake: 300,
    odds: 1.6,
    status: "pending",
    returns: null,
  },
  {
    id: 5,
    date: "2023-04-15",
    time: "14:00",
    event: "Djokovic vs Nadal",
    selection: "Nadal",
    stake: 250,
    odds: 2.2,
    status: "lost",
    returns: 0,
  },
]

export default function BettingHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Betting History</CardTitle>
        <CardDescription>View your recent bets and their outcomes</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="won">Won</TabsTrigger>
            <TabsTrigger value="lost">Lost</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="space-y-4">
              {bettingHistory.map((bet) => (
                <div
                  key={bet.id}
                  className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="mb-2 sm:mb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{bet.event}</span>
                      {bet.status === "won" && <Badge className="bg-green-600">Won</Badge>}
                      {bet.status === "lost" && <Badge variant="destructive">Lost</Badge>}
                      {bet.status === "pending" && (
                        <Badge variant="outline" className="text-amber-500">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {bet.date} at {bet.time} • {bet.selection} @ {bet.odds}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Stake</div>
                      <div className="font-medium">{bet.stake} coins</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Returns</div>
                      <div className="font-medium">{bet.status === "pending" ? "—" : `${bet.returns} coins`}</div>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-full">
                      {bet.status === "won" && <Check className="h-5 w-5 text-green-500" />}
                      {bet.status === "lost" && <X className="h-5 w-5 text-red-500" />}
                      {bet.status === "pending" && <Clock className="h-5 w-5 text-amber-500" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="won" className="mt-4">
            <div className="space-y-4">
              {bettingHistory
                .filter((bet) => bet.status === "won")
                .map((bet) => (
                  <div
                    key={bet.id}
                    className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="mb-2 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{bet.event}</span>
                        <Badge className="bg-green-600">Won</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {bet.date} at {bet.time} • {bet.selection} @ {bet.odds}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Stake</div>
                        <div className="font-medium">{bet.stake} coins</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Returns</div>
                        <div className="font-medium">{bet.returns} coins</div>
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="lost" className="mt-4">
            <div className="space-y-4">
              {bettingHistory
                .filter((bet) => bet.status === "lost")
                .map((bet) => (
                  <div
                    key={bet.id}
                    className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="mb-2 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{bet.event}</span>
                        <Badge variant="destructive">Lost</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {bet.date} at {bet.time} • {bet.selection} @ {bet.odds}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Stake</div>
                        <div className="font-medium">{bet.stake} coins</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Returns</div>
                        <div className="font-medium">0 coins</div>
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full">
                        <X className="h-5 w-5 text-red-500" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            <div className="space-y-4">
              {bettingHistory
                .filter((bet) => bet.status === "pending")
                .map((bet) => (
                  <div
                    key={bet.id}
                    className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="mb-2 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{bet.event}</span>
                        <Badge variant="outline" className="text-amber-500">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {bet.date} at {bet.time} • {bet.selection} @ {bet.odds}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Stake</div>
                        <div className="font-medium">{bet.stake} coins</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Returns</div>
                        <div className="font-medium">—</div>
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full">
                        <Clock className="h-5 w-5 text-amber-500" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
