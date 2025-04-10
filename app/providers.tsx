"use client"

import { ReactNode, useEffect } from "react"
import { GameProvider } from "@/context/game-context"

export function Providers({ children }: { children: ReactNode }) {
  // Add debug logging for context initialization
  useEffect(() => {
    console.log("[Providers] Client-side providers initialized");
  }, []);
  
  return (
    <GameProvider>
      {children}
    </GameProvider>
  )
} 