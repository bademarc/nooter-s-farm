"use client"

import { useContext, useEffect } from "react"
import { GameContext } from "@/context/game-context"

// This component adds the __fixCoins function to the window object
export function FixCoinsScript() {
  const { setFarmCoins, farmCoins } = useContext(GameContext)
  
  useEffect(() => {
    // Define the __fixCoins function on the window object
    if (typeof window !== 'undefined') {
      window.__fixCoins = (amount: number) => {
        console.log(`Setting coins to ${amount} via window.__fixCoins`);
        console.log(`Current coins in state before update: ${farmCoins}`);
        
        // Update React state
        setFarmCoins(amount);
        
        // Update localStorage
        localStorage.setItem("farm-coins", JSON.stringify(amount));
        
        console.log(`Coins should now be set to ${amount} in both state and localStorage`);
      };
      
      console.log("Emergency fix function registered on window object");
      
      // Initial sync from localStorage if needed
      try {
        const storedCoins = localStorage.getItem("farm-coins");
        if (storedCoins) {
          const parsedCoins = JSON.parse(storedCoins);
          if (!isNaN(parsedCoins) && farmCoins !== parsedCoins) {
            console.log(`Initial sync: Found ${parsedCoins} coins in localStorage, but ${farmCoins} in state. Syncing...`);
            setFarmCoins(parsedCoins);
          } else {
            console.log(`Initial check: State (${farmCoins}) and localStorage (${parsedCoins}) are in sync.`);
          }
        }
      } catch (error) {
        console.error("Error during initial localStorage sync:", error);
      }
    }
    
    return () => {
      // Clean up when component unmounts
      if (typeof window !== 'undefined' && window.__fixCoins) {
        // @ts-ignore - We know it exists because we just set it
        delete window.__fixCoins;
      }
    };
  }, [setFarmCoins, farmCoins]);
  
  // This component doesn't render anything
  return null;
} 