"use client"

import { motion } from "framer-motion"
import { Coins, Bitcoin } from "lucide-react"

interface CurrencyDisplayProps {
  virtualAmount: number
  cryptoAmount: number
  activeCurrency: "virtual" | "crypto"
  pulsing?: boolean
}

export default function CurrencyDisplay({
  virtualAmount,
  cryptoAmount,
  activeCurrency,
  pulsing = false,
}: CurrencyDisplayProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-800/50 to-indigo-800/50 px-3 py-1.5 backdrop-blur-sm">
      {activeCurrency === "virtual" ? (
        <motion.div animate={pulsing ? { rotate: [0, 15, -15, 0] } : {}} transition={{ duration: 0.5 }}>
          <Coins className="h-5 w-5 text-yellow-400" />
        </motion.div>
      ) : (
        <motion.div animate={pulsing ? { rotate: [0, 15, -15, 0] } : {}} transition={{ duration: 0.5 }}>
          <Bitcoin className="h-5 w-5 text-orange-400" />
        </motion.div>
      )}
      <motion.span
        className="font-bold text-white"
        animate={
          pulsing
            ? {
                scale: [1, 1.2, 1],
                color: ["#ffffff", "#fcd34d", "#ffffff"],
              }
            : {}
        }
        transition={{ duration: 0.5 }}
      >
        {activeCurrency === "virtual" ? (virtualAmount ?? 0).toLocaleString() : (cryptoAmount ?? 0).toFixed(5) + " BTC"}
      </motion.span>
    </div>
  )
}
