"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Share2, Trophy, Users, MessageSquare, Heart, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type SocialFeaturesProps = {
  onShare: (platform: string) => void
  bigWin?: {
    amount: number
    multiplier: number
  }
}

export default function SocialFeatures({ onShare, bigWin }: SocialFeaturesProps) {
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [copied, setCopied] = useState(false)

  // Mock leaderboard data
  const leaderboardData = [
    { name: "JackpotKing", score: 12500, position: 1 },
    { name: "LuckySpinner", score: 8750, position: 2 },
    { name: "FortuneQueen", score: 7200, position: 3 },
    { name: "SlotMaster", score: 6100, position: 4 },
    { name: "GoldenReels", score: 5400, position: 5 },
    { name: "SpinDoctor", score: 4800, position: 6 },
    { name: "CasinoRoyale", score: 4200, position: 7 },
    { name: "LuckyCharm", score: 3600, position: 8 },
    { name: "MegaWinner", score: 3100, position: 9 },
    { name: "SlotNinja", score: 2800, position: 10 },
  ]

  const handleCopyLink = () => {
    const shareText = bigWin
      ? `I just won ${bigWin.amount.toFixed(2)} credits with a ${bigWin.multiplier}x multiplier in Mega Fortune Slots! Try your luck too!`
      : "Check out this amazing slot machine game - Mega Fortune Slots!"

    navigator.clipboard.writeText(shareText + " https://megafortune-slots.com")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform: string) => {
    onShare(platform)
    setShowShareDialog(false)
  }

  return (
    <>
      {/* Share button */}
      <button
        onClick={() => setShowShareDialog(true)}
        className="flex items-center gap-1 text-white/70 hover:text-white hover:bg-white/10 px-3 py-1 rounded-md text-sm transition-colors"
      >
        <Share2 className="w-4 h-4" /> Share
      </button>

      {/* Leaderboard button */}
      <button
        onClick={() => setShowLeaderboard(true)}
        className="flex items-center gap-1 text-white/70 hover:text-white hover:bg-white/10 px-3 py-1 rounded-md text-sm transition-colors"
      >
        <Trophy className="w-4 h-4" /> Leaderboard
      </button>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" /> Share Your Win
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {bigWin
                ? `Share your ${bigWin.amount.toFixed(2)} credit win with friends!`
                : "Share this game with your friends!"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Share message */}
            <div className="bg-gray-800 p-3 rounded-md text-sm">
              {bigWin
                ? `I just won ${bigWin.amount.toFixed(2)} credits with a ${bigWin.multiplier}x multiplier in Mega Fortune Slots! Try your luck too!`
                : "Check out this amazing slot machine game - Mega Fortune Slots!"}
            </div>

            {/* Copy link */}
            <div className="flex gap-2">
              <Input
                value="https://megafortune-slots.com"
                readOnly
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Share platforms */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => handleShare("twitter")}
                className="bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] border-[#1DA1F2]/20"
              >
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("facebook")}
                className="bg-[#4267B2]/10 hover:bg-[#4267B2]/20 text-[#4267B2] border-[#4267B2]/20"
              >
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("whatsapp")}
                className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border-[#25D366]/20"
              >
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("telegram")}
                className="bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] border-[#0088cc]/20"
              >
                Telegram
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leaderboard Dialog */}
      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Global Leaderboard
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Top players with the highest winnings this week
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Leaderboard tabs */}
            <div className="flex border-b border-gray-700">
              <button className="px-4 py-2 text-sm font-medium text-amber-400 border-b-2 border-amber-400">
                Weekly
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">All Time</button>
              <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">Friends</button>
            </div>

            {/* Leaderboard list */}
            <div className="space-y-2">
              {leaderboardData.map((player) => (
                <div
                  key={player.position}
                  className={cn(
                    "flex items-center p-3 rounded-md",
                    player.position === 1
                      ? "bg-amber-500/20 border border-amber-500/30"
                      : player.position <= 3
                        ? "bg-gray-800/80 border border-gray-700"
                        : "bg-gray-800/40",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3",
                      player.position === 1
                        ? "bg-amber-500 text-black"
                        : player.position === 2
                          ? "bg-gray-300 text-gray-900"
                          : player.position === 3
                            ? "bg-amber-700 text-white"
                            : "bg-gray-700 text-white",
                    )}
                  >
                    {player.position}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-gray-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> 42 friends
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-400">${player.score.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 flex items-center justify-end gap-1">
                      <Heart className="w-3 h-3 text-pink-500" /> 24 <MessageSquare className="w-3 h-3 ml-1" /> 8
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Your position */}
            <div className="mt-4 p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-md flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm mr-3">
                42
              </div>
              <div className="flex-1">
                <div className="font-medium">You</div>
                <div className="text-sm text-gray-400">Keep playing to climb the ranks!</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-amber-400">$1,250</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
