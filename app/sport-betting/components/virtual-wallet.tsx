import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { ArrowUpRight, ArrowDownLeft, Gift, Clock } from "lucide-react"

// Sample data for transactions
const transactions = [
  {
    id: 1,
    date: "2023-04-23",
    time: "20:15",
    type: "win",
    description: "Bet win: Arsenal vs Chelsea",
    amount: 420,
  },
  {
    id: 2,
    date: "2023-04-23",
    time: "19:30",
    type: "bet",
    description: "Placed bet: Arsenal vs Chelsea",
    amount: -200,
  },
  {
    id: 3,
    date: "2023-04-21",
    time: "15:45",
    type: "bet",
    description: "Placed bet: Lakers vs Celtics",
    amount: -150,
  },
  {
    id: 4,
    date: "2023-04-20",
    time: "20:30",
    type: "win",
    description: "Bet win: Barcelona vs Real Madrid",
    amount: 320,
  },
  {
    id: 5,
    date: "2023-04-20",
    time: "19:45",
    type: "bet",
    description: "Placed bet: Barcelona vs Real Madrid",
    amount: -100,
  },
  {
    id: 6,
    date: "2023-04-18",
    time: "18:15",
    type: "bet",
    description: "Placed bet: T1 vs G2",
    amount: -300,
  },
  {
    id: 7,
    date: "2023-04-15",
    time: "14:15",
    type: "bet",
    description: "Placed bet: Djokovic vs Nadal",
    amount: -250,
  },
  {
    id: 8,
    date: "2023-04-10",
    time: "12:00",
    type: "bonus",
    description: "Daily login bonus",
    amount: 100,
  },
  {
    id: 9,
    date: "2023-04-01",
    time: "09:00",
    type: "bonus",
    description: "Welcome bonus",
    amount: 1000,
  },
]

export default function VirtualWallet() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Virtual Wallet</CardTitle>
        <CardDescription>Manage your virtual coins and view transaction history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <h3 className="text-3xl font-bold">5,000</h3>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">Get More Coins</Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-medium text-muted-foreground">Total Won</p>
                </div>
                <h3 className="mt-2 text-2xl font-bold text-green-600">+3,840</h3>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4 text-red-500" />
                  <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                </div>
                <h3 className="mt-2 text-2xl font-bold text-red-600">-2,000</h3>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="wins">Wins</TabsTrigger>
            <TabsTrigger value="bets">Bets</TabsTrigger>
            <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    {transaction.type === "win" && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900">
                        <ArrowUpRight className="h-5 w-5" />
                      </div>
                    )}
                    {transaction.type === "bet" && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900">
                        <ArrowDownLeft className="h-5 w-5" />
                      </div>
                    )}
                    {transaction.type === "bonus" && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900">
                        <Gift className="h-5 w-5" />
                      </div>
                    )}

                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {transaction.date} at {transaction.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-lg font-bold ${
                      transaction.amount > 0 ? "text-green-600" : transaction.amount < 0 ? "text-red-600" : ""
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="wins" className="mt-4">
            <div className="space-y-4">
              {transactions
                .filter((transaction) => transaction.type === "win")
                .map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900">
                        <ArrowUpRight className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {transaction.date} at {transaction.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-lg font-bold text-green-600">+{transaction.amount}</div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="bets" className="mt-4">
            <div className="space-y-4">
              {transactions
                .filter((transaction) => transaction.type === "bet")
                .map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900">
                        <ArrowDownLeft className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {transaction.date} at {transaction.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-lg font-bold text-red-600">{transaction.amount}</div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="bonuses" className="mt-4">
            <div className="space-y-4">
              {transactions
                .filter((transaction) => transaction.type === "bonus")
                .map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900">
                        <Gift className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {transaction.date} at {transaction.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-lg font-bold text-amber-600">+{transaction.amount}</div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
