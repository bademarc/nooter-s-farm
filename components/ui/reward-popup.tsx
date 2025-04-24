"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShimmerButton } from "@/components/ui/shimmer-button"

interface RewardPopupProps {
  title: string
  description: string
  reward: string
  icon: string
  onClaim: () => void
  onClose: () => void
}

export function RewardPopup({ title, description, reward, icon, onClaim, onClose }: RewardPopupProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isClaimed, setIsClaimed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isClaimed) setIsOpen(false)
    }, 10000)

    return () => clearTimeout(timer)
  }, [isClaimed])

  const handleClaim = () => {
    setIsClaimed(true)
    onClaim()
    setTimeout(() => {
      setIsOpen(false)
    }, 1500)
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border bg-card p-4 shadow-xl dark:bg-gray-800"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 rounded-full"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="mb-3 flex items-center gap-3">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-yellow-300 to-yellow-500 text-3xl"
            >
              {icon}
            </motion.div>
            <div>
              <h4 className="font-bold">{title}</h4>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="mb-4 rounded-md bg-muted p-3 text-center dark:bg-gray-700">
            <span className="text-sm font-medium">Reward: </span>
            <span className="text-sm font-bold text-primary">{reward}</span>
          </div>

          {!isClaimed ? (
            <ShimmerButton className="w-full" onClick={handleClaim}>
              Claim Reward!
            </ShimmerButton>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center rounded-md bg-green-100 p-2 text-center text-green-800 dark:bg-green-900 dark:text-green-100"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                ✓ Reward Claimed!
              </motion.span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
} 