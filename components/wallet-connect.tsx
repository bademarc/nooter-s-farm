"use client"

import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

interface WalletConnectProps {
  isConnected: boolean
  address: string
  connectWallet: () => Promise<void>
}

export const WalletConnect = ({ isConnected, address, connectWallet }: WalletConnectProps) => {
  return (
    <div>
      {isConnected ? (
        <Button variant="outline" className="bg-green-700 text-white border-green-600">
          <Wallet className="mr-2 h-4 w-4" />
          {address.slice(0, 6)}...{address.slice(-4)}
        </Button>
      ) : (
        <Button onClick={connectWallet} className="bg-green-700 hover:bg-green-800 text-white">
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      )}
    </div>
  )
}

