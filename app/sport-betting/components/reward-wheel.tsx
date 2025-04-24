"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "../components/ui/button"
import { X } from "lucide-react"
import useSound from "../hooks/use-sound"

interface RewardWheelProps {
  onReward: (reward: number) => void
  onClose: () => void
}

// Define wheel segments
const segments = [
  { value: 100, color: "#ef4444" }, // red
  { value: 500, color: "#3b82f6" }, // blue
  { value: 200, color: "#22c55e" }, // green
  { value: 1000, color: "#eab308" }, // yellow
  { value: 300, color: "#8b5cf6" }, // purple
  { value: 2000, color: "#ec4899" }, // pink
  { value: 400, color: "#f97316" }, // orange
  { value: 250, color: "#06b6d4" }, // cyan
]

export default function RewardWheel({ onReward, onClose }: RewardWheelProps) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<number | null>(null)
  const { playWheelSound, playWinSound } = useSound()

  const spinWheel = () => {
    if (spinning) return

    playWheelSound()
    setSpinning(true)
    setResult(null)

    // Calculate a random segment to land on
    const segmentIndex = Math.floor(Math.random() * segments.length)
    const segmentValue = segments[segmentIndex].value

    // Calculate rotation (at least 5 full rotations + the position to land on the segment)
    const segmentAngle = 360 / segments.length
    const segmentPosition = 360 - segmentIndex * segmentAngle - segmentAngle / 2
    const fullRotations = 5 * 360
    const finalRotation = fullRotations + segmentPosition

    setRotation(finalRotation)

    // Set result after animation completes
    setTimeout(() => {
      setResult(segmentValue)
      playWinSound()
      onReward(segmentValue)
    }, 5000)
  }

  // Draw wheel segments
  const segmentAngle = 360 / segments.length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        className="relative w-[90%] max-w-md rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-center shadow-xl"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 rounded-full text-white/80 hover:bg-white/20 hover:text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <h2 className="mb-4 text-xl font-bold text-white">Spin to Win!</h2>

        <div className="relative mx-auto mb-6 h-64 w-64">
          {/* Wheel */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage: `conic-gradient(${segments
                .map((segment, index) => `${segment.color} ${index * segmentAngle}deg ${(index + 1) * segmentAngle}deg`)
                .join(", ")})`,
            }}
            animate={{ rotate: rotation }}
            transition={{ duration: 5, ease: "easeOut" }}
          >
            {/* Segment values */}
            {segments.map((segment, index) => {
              const angle = index * segmentAngle + segmentAngle / 2
              const radians = (angle * Math.PI) / 180
              const x = Math.cos(radians) * 100
              const y = Math.sin(radians) * 100

              return (
                <div
                  key={index}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-white"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-80px) rotate(-${angle}deg)`,
                  }}
                >
                  {segment.value}
                </div>
              )
            })}
          </motion.div>

          {/* Center */}
          <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>

          {/* Pointer */}
          <div className="absolute left-1/2 top-0 h-8 w-4 -translate-x-1/2 -translate-y-1/2 transform">
            <div className="h-0 w-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        </div>

        {result !== null ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4 text-center"
          >
            <div className="text-lg text-white">You won:</div>
            <div className="text-3xl font-bold text-yellow-400">{result} coins</div>
          </motion.div>
        ) : (
          <Button
            onClick={spinWheel}
            disabled={spinning}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-white hover:from-purple-700 hover:to-pink-700"
          >
            {spinning ? "Spinning..." : "SPIN NOW"}
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}
