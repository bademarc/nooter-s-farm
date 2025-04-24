"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Menu, Home, Calendar, Trophy, Users, Wallet, LogIn, Moon, Sun, Coins } from "lucide-react"
import { useTheme } from "next-themes"

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                  <span className="text-green-600 dark:text-green-400">Sports</span>
                  <span>Bet</span>
                </Link>
                <Link
                  href="/"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </Link>
                <Link
                  href="/matches"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Calendar className="h-5 w-5" />
                  <span>Matches</span>
                </Link>
                <Link
                  href="/leaderboard"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Trophy className="h-5 w-5" />
                  <span>Leaderboard</span>
                </Link>
                <Link
                  href="/community"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Users className="h-5 w-5" />
                  <span>Community</span>
                </Link>
                {isLoggedIn && (
                  <Link
                    href="/wallet"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Wallet className="h-5 w-5" />
                    <span>Wallet</span>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-1 text-xl font-bold">
            <span className="text-green-600 dark:text-green-400">Sports</span>
            <span>Bet</span>
          </Link>

          <nav className="hidden md:flex md:gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/matches"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Matches
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Leaderboard
            </Link>
            <Link
              href="/community"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Community
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="mr-2"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isLoggedIn ? (
            <>
              <Button variant="ghost" className="hidden gap-2 md:flex">
                <Coins className="h-4 w-4 text-amber-500" />
                <span>5,000</span>
              </Button>

              <Link href="/profile">
                <Avatar>
                  <AvatarFallback className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    JD
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" className="hidden md:inline-flex" onClick={() => setIsLoggedIn(true)}>
                Log In
              </Button>
              <Button
                className="hidden bg-green-600 hover:bg-green-700 md:inline-flex"
                onClick={() => setIsLoggedIn(true)}
              >
                Sign Up
              </Button>
              <Button size="icon" className="md:hidden" onClick={() => setIsLoggedIn(true)}>
                <LogIn className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
