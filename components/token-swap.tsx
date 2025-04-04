"use client"

import { useState, useContext } from "react"
import { GameContext } from "@/context/game-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRightLeft, AlertCircle } from "lucide-react"

// Mock contract ABI for token swap
const SWAP_CONTRACT_ABI = [
  "function swapFarmCoinsForWNOOT(uint256 amount) external returns (bool)",
  "function getWNOOTBalance(address account) external view returns (uint256)",
]

const SWAP_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890" // Mock address

export const TokenSwap = () => {
  const { farmCoins, addFarmCoins } = useContext(GameContext)
  const [swapAmount, setSwapAmount] = useState<number>(100)
  const [wnootBalance, setWnootBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleSwap = async () => {
    if (!window.ethereum || swapAmount <= 0 || farmCoins < swapAmount) return

    setIsLoading(true)

    try {
      // In a real implementation, this would interact with the blockchain
      // For now, we'll simulate the swap

      // Deduct Farm Coins
      addFarmCoins(-swapAmount)

      // Add WNOOT (1:10 ratio - 100 Farm Coins = 10 WNOOT)
      const wnootReceived = swapAmount / 10
      setWnootBalance((prev) => prev + wnootReceived)

      alert(`Successfully swapped ${swapAmount} Farm Coins for ${wnootReceived} WNOOT!`)
    } catch (error) {
      console.error("Swap failed:", error)
      alert("Swap failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <ArrowRightLeft className="mr-2 h-5 w-5 text-green-400" />
        Token Swap
      </h2>

      <div className="bg-green-800 rounded-lg p-4">
        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-2">Swap your Farm Coins for $WNOOT tokens on the Abstract Testnet</p>
          <div className="flex items-center text-yellow-400 text-sm bg-yellow-900/30 p-2 rounded">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Exchange Rate: 100 Farm Coins = 10 $WNOOT</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">From: Farm Coins</label>
            <Input
              type="number"
              value={swapAmount}
              onChange={(e) => setSwapAmount(Number.parseInt(e.target.value) || 0)}
              min={0}
              max={farmCoins}
              className="bg-green-700 border-green-600"
            />
            <p className="text-xs text-gray-400 mt-1">Balance: {farmCoins} 🪙</p>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block">To: $WNOOT</label>
            <Input type="number" value={swapAmount / 10} readOnly className="bg-green-700 border-green-600" />
            <p className="text-xs text-gray-400 mt-1">Balance: {wnootBalance} $WNOOT</p>
          </div>
        </div>

        <Button
          onClick={handleSwap}
          disabled={isLoading || farmCoins < swapAmount || swapAmount <= 0}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isLoading ? "Processing..." : "Swap Tokens"}
        </Button>

        <p className="text-xs text-center mt-4 text-gray-400">
          Note: Connect your wallet to use your real $WNOOT tokens on the Abstract Testnet
        </p>
      </div>
    </div>
  )
}

