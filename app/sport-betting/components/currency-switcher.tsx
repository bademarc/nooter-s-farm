"use client"

import { motion } from "framer-motion"
import { Coins, Bitcoin } from "lucide-react"
import useSound from "../hooks/use-sound"

interface CurrencySwitcherProps {
  activeCurrency: "virtual" | "crypto"
  onSwitch: (currency: "virtual" | "crypto") => void
}

export default function CurrencySwitcher({ activeCurrency, onSwitch }: CurrencySwitcherProps) {
  const { playButtonSound } = useSound()

  const handleChange = (currency: "virtual" | "crypto") => {
    playButtonSound()
    onSwitch(currency)
  }

  return (
    <div className="flex h-8 items-center rounded-full bg-gray-800 p-1">
      <button
        className={`relative flex h-6 items-center justify-center rounded-full px-2 ${
          activeCurrency === "virtual" ? "text-yellow-400" : "text-gray-400"
        }`}
        onClick={() => handleChange("virtual")}
      >
        {activeCurrency === "virtual" && (
          <motion.div
            layoutId="currencyIndicator"
            className="absolute inset-0 rounded-full bg-gray-700"
            initial={false}
            transition={{ type: "spring", duration: 0.5 }}
          />
        )}
        <Coins className="relative z-10 h-4 w-4" />
      </button>

      <button
        className={`relative flex h-6 items-center justify-center rounded-full px-2 ${
          activeCurrency === "crypto" ? "text-orange-400" : "text-gray-400"
        }`}
        onClick={() => handleChange("crypto")}
      >
        {activeCurrency === "crypto" && (
          <motion.div
            layoutId="currencyIndicator"
            className="absolute inset-0 rounded-full bg-gray-700"
            initial={false}
            transition={{ type: "spring", duration: 0.5 }}
          />
        )}
        <Bitcoin className="relative z-10 h-4 w-4" />
      </button>
    </div>
  )
}
