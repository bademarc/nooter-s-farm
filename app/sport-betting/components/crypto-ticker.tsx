"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bitcoin, EclipseIcon as Ethereum, DollarSign, TrendingUp, TrendingDown, Sparkles } from "lucide-react"

// Sample crypto data
const initialCryptoData = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", price: 39876.42, change: 2.4, icon: Bitcoin, hot: true },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", price: 2345.18, change: -1.2, icon: Ethereum, hot: false },
  { id: "tether", name: "Tether", symbol: "USDT", price: 1.0, change: 0.1, icon: DollarSign, hot: false },
  { id: "solana", name: "Solana", symbol: "SOL", price: 103.75, change: 5.8, icon: DollarSign, hot: true },
  { id: "cardano", name: "Cardano", symbol: "ADA", price: 0.52, change: -0.7, icon: DollarSign, hot: false },
]

export default function CryptoTicker() {
  const [cryptoData, setCryptoData] = useState(initialCryptoData)
  const [highlightedCoin, setHighlightedCoin] = useState<string | null>(null)

  useEffect(() => {
    // Simulate price changes every 3 seconds
    const interval = setInterval(() => {
      setCryptoData((prev) =>
        prev.map((crypto) => {
          const changeAmount = Math.random() * 0.02 - 0.01 // -1% to +1% change
          const newPrice = crypto.price * (1 + changeAmount)
          const newChange = crypto.change + (Math.random() * 0.6 - 0.3) // -0.3% to +0.3% change

          // Randomly create a significant price movement to grab attention
          const bigMove = Math.random() > 0.95
          const finalPrice = bigMove ? newPrice * (1 + Math.random() * 0.05) : newPrice
          const finalChange = bigMove ? newChange + Math.random() * 3 : newChange

          // Highlight coin with big movement
          if (bigMove) {
            setHighlightedCoin(crypto.id)
            setTimeout(() => setHighlightedCoin(null), 2000)
          }

          return {
            ...crypto,
            price: finalPrice,
            change: finalChange,
            hot: bigMove ? true : crypto.hot,
          }
        }),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mb-4 overflow-hidden rounded-lg bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
      <div className="flex items-center overflow-x-auto py-2 scrollbar-hide">
        {cryptoData.map((crypto) => (
          <div key={crypto.id} className="flex shrink-0 items-center gap-2 px-3">
            <motion.div
              animate={
                highlightedCoin === crypto.id
                  ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, 10, -10, 0],
                    }
                  : {}
              }
              transition={{ duration: 0.5 }}
            >
              <crypto.icon
                className={`h-5 w-5 ${
                  crypto.id === "bitcoin"
                    ? "text-yellow-400"
                    : crypto.id === "ethereum"
                      ? "text-purple-400"
                      : "text-blue-400"
                }`}
              />
            </motion.div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-white">{crypto.symbol}</span>
                <motion.span
                  key={`${crypto.id}-${crypto.price.toFixed(2)}`}
                  initial={{ opacity: 0.5, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    color: highlightedCoin === crypto.id ? ["#ffffff", "#fcd34d", "#ffffff"] : "#ffffff",
                  }}
                  className="font-medium text-white"
                >
                  ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.span>
                {crypto.hot && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500/30"
                  >
                    <Sparkles className="h-2.5 w-2.5 text-red-400" />
                  </motion.div>
                )}
              </div>
              <div className={`flex items-center text-xs ${crypto.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                {crypto.change >= 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                <motion.span
                  key={`${crypto.id}-${crypto.change.toFixed(2)}`}
                  animate={
                    highlightedCoin === crypto.id
                      ? {
                          scale: [1, 1.2, 1],
                        }
                      : {}
                  }
                >
                  {crypto.change.toFixed(2)}%
                </motion.span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
