"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Farm } from "@/components/farm"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { WalletConnect } from "@/components/wallet-connect"
import { GameProvider } from "@/context/game-context"
import { AbstractLogo } from "@/components/abstract-logo"

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState("")
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null)

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const accounts = await provider.send("eth_requestAccounts", [])

        // Check if connected to Abstract Testnet (Chain ID: 11124)
        const network = await provider.getNetwork()
        if (network.chainId !== 11124) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x2B44" }], // 11124 in hex
            })
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x2B44", // 11124 in hex
                    chainName: "Abstract Testnet",
                    nativeCurrency: {
                      name: "ETH",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://api.testnet.abs.xyz"],
                    blockExplorerUrls: ["https://testnet.abscan.io/"],
                  },
                ],
              })
            } else {
              throw switchError
            }
          }
        }

        setProvider(provider)
        setAddress(accounts[0])
        setIsConnected(true)
      } catch (error) {
        console.error("Error connecting to wallet:", error)
      }
    } else {
      alert("MetaMask is not installed or Ethereum provider is unavailable!")
    }
  }

  return (
    <GameProvider>
      <main className="min-h-screen bg-green-900 flex flex-col">
        <Navbar />
        <div className="flex flex-col md:flex-row flex-1">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl md:text-4xl font-bold text-yellow-300 drop-shadow-md">Nooter&apos;s Farm</h1>
                <WalletConnect isConnected={isConnected} address={address} connectWallet={connectWallet} />
              </div>
              <Farm provider={provider} isConnected={isConnected} />
            </div>
            <div className="mt-8 text-center">
              <AbstractLogo />
              <p className="text-white text-sm mt-2">Built on Abstract Testnet for the $NOOT Hackathon</p>
            </div>
          </div>
        </div>
      </main>
    </GameProvider>
  )
}

