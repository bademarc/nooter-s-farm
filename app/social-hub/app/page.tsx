"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import FarmFeed from "@/components/farm-feed"
import { EventsCarousel } from "@/components/events-carousel"
import FriendSuggestions from "@/components/friend-suggestions"
import AchievementShowcase from "@/components/achievement-showcase"
import { ThemeToggle } from "@/components/theme-toggle"
import { PulseNotification } from "@/components/ui/pulse-notification"
import { StreakCounter } from "@/components/ui/streak-counter"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { RewardPopup } from "@/components/ui/reward-popup"

export default function Home() {
  const [showDailyReward, setShowDailyReward] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toast } = useToast()

  // Show daily reward popup after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDailyReward(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleClaimDailyReward = () => {
    toast({
      title: "Daily Reward Claimed!",
      description: "Come back tomorrow for another reward!",
      variant: "default",
    })
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black">
      {showDailyReward && (
        <RewardPopup
          title="Daily Login Reward!"
          description="Thanks for visiting Nooter's Farm today!"
          reward="200 Farm Coins + 5 Premium Seeds"
          icon="🎁"
          onClaim={handleClaimDailyReward}
          onClose={() => setShowDailyReward(false)}
        />
      )}

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-green-500 to-yellow-400 shadow-md dark:from-green-700 dark:to-yellow-600"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.img
              whileHover={{ rotate: 10 }}
              src="/placeholder.svg?height=40&width=40"
              alt="Nooter's Farm Logo"
              className="h-10 w-10 rounded-full"
            />
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-white"
            >
              Nooter's Farm
            </motion.h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <StreakCounter count={7} className="mr-2" />
              <PulseNotification count={3} />
              <PulseNotification count={5} />
              <ThemeToggle />
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="h-8 w-8 rounded-full bg-white overflow-hidden"
              >
                <img
                  src="/placeholder.svg?height=32&width=32"
                  alt="User Avatar"
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: mobileMenuOpen ? "auto" : 0, opacity: mobileMenuOpen ? 1 : 0 }}
          className="overflow-hidden bg-white/10 backdrop-blur-sm md:hidden"
        >
          {mobileMenuOpen && (
            <div className="p-3 flex flex-col gap-2">
              <StreakCounter count={7} className="self-center" />
              <div className="flex justify-center gap-3">
                <PulseNotification count={3} />
                <PulseNotification count={5} />
                <ThemeToggle />
              </div>
              <div className="flex justify-between mt-2">
                <Button variant="ghost" className="text-white w-full">
                  Feed
                </Button>
                <Button variant="ghost" className="text-white w-full">
                  Friends
                </Button>
                <Button variant="ghost" className="text-white w-full">
                  Messages
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.header>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white shadow-sm sticky top-16 z-40 dark:bg-gray-900 hidden md:block"
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between overflow-x-auto">
            <Link
              href="/"
              className="py-3 px-4 border-b-2 border-green-500 font-medium text-green-600 dark:text-green-400"
            >
              Feed
            </Link>
            <Link
              href="/friends"
              className="py-3 px-4 border-b-2 border-transparent font-medium text-gray-600 hover:text-green-600 hover:border-green-300 dark:text-gray-300 dark:hover:text-green-400"
            >
              Friends
            </Link>
            <Link
              href="/messages"
              className="py-3 px-4 border-b-2 border-transparent font-medium text-gray-600 hover:text-green-600 hover:border-green-300 dark:text-gray-300 dark:hover:text-green-400"
            >
              Messages
            </Link>
            <Link
              href="/forums"
              className="py-3 px-4 border-b-2 border-transparent font-medium text-gray-600 hover:text-green-600 hover:border-green-300 dark:text-gray-300 dark:hover:text-green-400"
            >
              Forums
            </Link>
            <Link
              href="/leaderboards"
              className="py-3 px-4 border-b-2 border-transparent font-medium text-gray-600 hover:text-green-600 hover:border-green-300 dark:text-gray-300 dark:hover:text-green-400"
            >
              Leaderboards
            </Link>
            <Link
              href="/achievements"
              className="py-3 px-4 border-b-2 border-transparent font-medium text-gray-600 hover:text-green-600 hover:border-green-300 dark:text-gray-300 dark:hover:text-green-400"
            >
              Achievements
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Sidebar */}
          <motion.div variants={item} className="lg:col-span-1 space-y-6">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-md overflow-hidden dark:bg-gray-800"
            >
              <div className="p-4 bg-gradient-to-r from-green-500 to-yellow-400 dark:from-green-700 dark:to-yellow-600">
                <h2 className="text-xl font-bold text-white">Your Farm</h2>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="h-16 w-16 rounded-full bg-green-100 overflow-hidden dark:bg-green-900"
                  >
                    <img
                      src="/placeholder.svg?height=64&width=64"
                      alt="User Avatar"
                      className="h-full w-full object-cover"
                    />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold">FarmerJoe123</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Level 42 • Premium Farmer</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-green-50 p-2 rounded-lg text-center dark:bg-green-900/30"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-300">Crops</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">128</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-yellow-50 p-2 rounded-lg text-center dark:bg-yellow-900/30"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-300">Animals</p>
                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">64</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-blue-50 p-2 rounded-lg text-center dark:bg-blue-900/30"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-300">Friends</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">87</p>
                  </motion.div>
                </div>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500 dark:from-green-700 dark:to-yellow-600">
                    Visit My Farm
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            <motion.div variants={item}>
              <FriendSuggestions />
            </motion.div>

            <motion.div variants={item}>
              <AchievementShowcase />
            </motion.div>
          </motion.div>

          {/* Main Feed */}
          <motion.div variants={item} className="lg:col-span-2 space-y-6">
            <EventsCarousel />
            <FarmFeed />
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
