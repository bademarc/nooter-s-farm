import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import MatchList from "@/components/match-list"

export default function MatchesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Matches</h1>
        <p className="text-muted-foreground">Browse all upcoming and live matches across different sports</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search matches, teams, leagues..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="football">Football</TabsTrigger>
          <TabsTrigger value="basketball">Basketball</TabsTrigger>
          <TabsTrigger value="tennis">Tennis</TabsTrigger>
          <TabsTrigger value="esports">Esports</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <MatchList category="all" />
        </TabsContent>
        <TabsContent value="football">
          <MatchList category="football" />
        </TabsContent>
        <TabsContent value="basketball">
          <MatchList category="basketball" />
        </TabsContent>
        <TabsContent value="tennis">
          <MatchList category="tennis" />
        </TabsContent>
        <TabsContent value="esports">
          <MatchList category="esports" />
        </TabsContent>
      </Tabs>

      <Card className="mb-8 bg-green-50 dark:bg-green-950">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="text-lg font-bold">New to Sports Betting?</h3>
            <p className="text-muted-foreground">Learn the basics and strategies to improve your betting experience</p>
          </div>
          <Button className="bg-green-600 hover:bg-green-700">Betting Guide</Button>
        </CardContent>
      </Card>
    </div>
  )
}
