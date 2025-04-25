"use client"

import { ReactNode, useEffect } from "react"
import { GameProvider } from "@/context/game-context"
import { GuideProvider } from "@/context/guide-context"
import { AbstractWalletProvider } from '@abstract-foundation/agw-react'
import { abstractTestnet } from 'viem/chains'

export function Providers({ children }: { children: ReactNode }) {
  // Add debug logging for context initialization
  useEffect(() => {
    console.log("[Providers] Client-side providers initialized");
  }, []);
  
  return (
    <AbstractWalletProvider chain={abstractTestnet}>
      <GameProvider>
        <GuideProvider>
          {children}
        </GuideProvider>
      </GameProvider>
    </AbstractWalletProvider>
  )
} 