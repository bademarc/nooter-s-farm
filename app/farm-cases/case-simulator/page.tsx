"use client"

import { useState, useRef, useContext, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Package, 
  ArrowLeft, 
  Sparkles, 
  ChevronRight, 
  BarChart, 
  RotateCcw,
  Star,
  CircleDollarSign
} from "lucide-react"
import { GameContext } from "@/context/game-context"
import { useCaseSimulator, Item, Case } from "./hooks/use-case-simulator"
import confetti from "canvas-confetti"
import { FixCoinsScript } from "./components/fix-coins-script"
import { CaseOpeningAnimation } from "./components/case-opening-animation"
import { CaseSounds } from "./components/case-sounds"
import { VolumeControl } from "./components/volume-control"

// Mock data for cases
const farmCases: Case[] = [
  {
    id: "seeds-case",
    name: "Seed Vault",
    description: "Contains various rare and exotic seeds for your farm",
    price: 100,
    theme: "green",
    image: "🌱",
    items: [
      { id: "s1", name: "Magic Beans", description: "Grows into giant plants overnight", rarity: "Epic", value: 400, icon: "🌱" },
      { id: "s2", name: "Golden Corn Seeds", description: "Yields premium golden corn", rarity: "Rare", value: 250, icon: "🌽" },
      { id: "s3", name: "Rainbow Flower Seeds", description: "Blooms into multicolored flowers", rarity: "Uncommon", value: 150, icon: "🌷" },
      { id: "s4", name: "Wheat Seeds", description: "Standard wheat seeds", rarity: "Common", value: 50, icon: "🌾" },
      { id: "s5", name: "Ancient Tree Seed", description: "Grows into a mystical ancient tree", rarity: "Legendary", value: 800, icon: "🌳" },
      { id: "s6", name: "Pumpkin Seeds", description: "Grows large pumpkins", rarity: "Common", value: 50, icon: "🎃" },
      { id: "s7", name: "Magic Mushroom Spores", description: "Grows exotic mushrooms", rarity: "Rare", value: 300, icon: "🍄" }
    ]
  },
  {
    id: "livestock-case",
    name: "Farmyard Friends",
    description: "Contains various animal companions for your farm",
    price: 150,
    theme: "brown",
    image: "🐄",
    items: [
      { id: "l1", name: "Golden Hen", description: "Lays golden eggs daily", rarity: "Epic", value: 500, icon: "🐔" },
      { id: "l2", name: "Super Cow", description: "Produces premium milk", rarity: "Rare", value: 300, icon: "🐄" },
      { id: "l3", name: "Spotted Pig", description: "Happy little pig", rarity: "Common", value: 100, icon: "🐖" },
      { id: "l4", name: "Rainbow Sheep", description: "Grows colorful wool", rarity: "Uncommon", value: 200, icon: "🐑" },
      { id: "l5", name: "Mythical Unicorn", description: "A legendary farm companion", rarity: "Legendary", value: 1000, icon: "🦄" },
      { id: "l6", name: "Farm Duck", description: "Quacks and swims", rarity: "Common", value: 75, icon: "🦆" },
      { id: "l7", name: "Fancy Goat", description: "Produces specialty milk", rarity: "Uncommon", value: 175, icon: "🐐" }
    ]
  },
  {
    id: "tools-case",
    name: "Farmer's Toolkit",
    description: "Contains various tools to help with farming",
    price: 125,
    theme: "blue",
    image: "🔨",
    items: [
      { id: "t1", name: "Diamond Hoe", description: "Super durable hoe for farming", rarity: "Epic", value: 450, icon: "⛏️" },
      { id: "t2", name: "Enchanted Watering Can", description: "Waters plants automatically", rarity: "Rare", value: 325, icon: "🚿" },
      { id: "t3", name: "Steel Shovel", description: "Standard shovel for digging", rarity: "Common", value: 80, icon: "🧹" },
      { id: "t4", name: "Silver Pruning Shears", description: "For precision plant trimming", rarity: "Uncommon", value: 175, icon: "✂️" },
      { id: "t5", name: "Legendary Scythe", description: "Harvests entire fields in one swing", rarity: "Legendary", value: 900, icon: "🔪" },
      { id: "t6", name: "Garden Rake", description: "Basic rake for leaves", rarity: "Common", value: 60, icon: "🧰" },
      { id: "t7", name: "Golden Trowel", description: "For precision planting", rarity: "Rare", value: 275, icon: "🔧" }
    ]
  },
  {
    id: "special-case",
    name: "Seasonal Treasures",
    description: "Limited edition seasonal farming items",
    price: 200,
    theme: "gold",
    image: "🏆",
    items: [
      { id: "sp1", name: "Harvest Crown", description: "Boosts crop yields significantly", rarity: "Legendary", value: 1200, icon: "👑" },
      { id: "sp2", name: "Spring Essence", description: "Speeds up plant growth in spring", rarity: "Epic", value: 600, icon: "🌸" },
      { id: "sp3", name: "Summer Sun Token", description: "Protects plants from drought", rarity: "Rare", value: 350, icon: "☀️" },
      { id: "sp4", name: "Autumn Leaf Charm", description: "Extends harvest season", rarity: "Uncommon", value: 200, icon: "🍂" },
      { id: "sp5", name: "Winter Frost Amulet", description: "Protects crops from frost", rarity: "Rare", value: 325, icon: "❄️" },
      { id: "sp6", name: "Basic Fertilizer", description: "Slightly improves soil quality", rarity: "Common", value: 100, icon: "🧪" },
      { id: "sp7", name: "Field Expansion Deed", description: "Adds a new field to your farm", rarity: "Epic", value: 550, icon: "📜" }
    ]
  }
]

// Item display component
const ItemCard = ({ item }: { item: Item }) => {
  const rarityColor = 
    item.rarity === "Common" ? "border-gray-400 bg-gray-800" : 
    item.rarity === "Uncommon" ? "border-green-500 bg-green-900/30" :
    item.rarity === "Rare" ? "border-blue-500 bg-blue-900/30" :
    item.rarity === "Epic" ? "border-purple-500 bg-purple-900/30" :
    "border-yellow-500 bg-yellow-900/30"
    
  const rarityTextColor = 
    item.rarity === "Common" ? "text-gray-400" : 
    item.rarity === "Uncommon" ? "text-green-400" :
    item.rarity === "Rare" ? "text-blue-400" :
    item.rarity === "Epic" ? "text-purple-400" :
    "text-yellow-400"
  
  return (
    <div className={`border-2 ${rarityColor} p-4 h-full flex flex-col`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-4xl">{item.icon}</span>
        <div className="flex items-center">
          <CircleDollarSign className="h-3.5 w-3.5 text-white/70 mr-1" />
          <span className="text-sm">{item.value}</span>
        </div>
      </div>
      <h3 className="text-white font-medium text-lg">{item.name}</h3>
      <p className="text-white/60 text-sm mt-1 mb-auto">{item.description}</p>
      <div className={`mt-3 flex items-center ${rarityTextColor}`}>
        <Star className="h-3.5 w-3.5 mr-1 fill-current" />
        <span className="text-xs font-medium">{item.rarity}</span>
      </div>
    </div>
  )
}

// Case simulator component
export default function CaseSimulatorPage() {
  const { playerLevel, playerXp, farmCoins, addFarmCoins, setFarmCoins } = useContext(GameContext)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [viewingHistory, setViewingHistory] = useState(false)
  const [rewardMessage, setRewardMessage] = useState<string | null>(null)
  const [devButtonDebug, setDevButtonDebug] = useState<{clicks: number, lastClicked: number}>({
    clicks: 0,
    lastClicked: 0
  })
  
  // Define custom rarity distribution with better odds than pure random
  const rarityDistribution = {
    "Common": 0.5,    // 50% chance
    "Uncommon": 0.25, // 25% chance
    "Rare": 0.15,     // 15% chance
    "Epic": 0.07,     // 7% chance
    "Legendary": 0.03 // 3% chance
  }
  
  // Track if coins are being added to debug potential issues
  const [isAddingCoins, setIsAddingCoins] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  // Use our custom case simulator hook
  const {
    isOpening,
    isScrolling,
    showResult,
    selectedItem,
    openHistory,
    confettiRef,
    openCase,
    resetCase,
    handleScrollingComplete,
    triggerConfetti
  } = useCaseSimulator()
  
  // Debug function for coins
  const useDebugCoins = () => {
    // Log coins from context and localStorage for debugging
    useEffect(() => {
      const logCoinsDebug = () => {
        try {
          const storedCoins = localStorage.getItem("farm-coins");
          console.log("🔍 COINS DEBUG 🔍");
          console.log("Context coins:", farmCoins);
          console.log("localStorage coins:", storedCoins ? JSON.parse(storedCoins) : "not found");
          console.log("Window.__fixCoins available:", typeof window !== 'undefined' && !!window.__fixCoins);
          
          if (farmCoins === 0 && storedCoins && JSON.parse(storedCoins) > 0) {
            console.warn("⚠️ Coins mismatch detected! Context has 0 but localStorage has value");
          }
        } catch (error) {
          console.error("Error in debug log:", error);
        }
      };
      
      // Log on mount and every 2 seconds for monitoring
      logCoinsDebug();
      const interval = setInterval(logCoinsDebug, 2000);
      
      return () => clearInterval(interval);
    }, []);
  };
  
  // Call the debug hook
  useDebugCoins();
  
  // Monitor coin changes for debugging
  useEffect(() => {
    console.log(`[Coins Monitor] Farm coins value changed to: ${farmCoins}`);
  }, [farmCoins]);
  
  // Sync coins from localStorage on component mount
  useEffect(() => {
    try {
      const storedCoins = localStorage.getItem("farm-coins");
      if (storedCoins) {
        const parsedCoins = JSON.parse(storedCoins);
        if (!isNaN(parsedCoins) && farmCoins !== parsedCoins) {
          console.log(`Syncing coins from localStorage: ${parsedCoins}`);
          setFarmCoins(parsedCoins);
        }
      }
    } catch (error) {
      console.error("Error syncing coins from localStorage:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Diagnose and log the coin issue
  const diagnoseCoinsIssue = () => {
    try {
      const storedCoins = localStorage.getItem("farm-coins");
      const parsedCoins = storedCoins ? JSON.parse(storedCoins) : null;
      
      console.log("--- COINS DIAGNOSTIC ---");
      console.log("React State (coins):", farmCoins);
      console.log("localStorage (farm-coins):", storedCoins);
      console.log("Parsed localStorage:", parsedCoins);
      
      // Try to use emergency fix if available
      if (typeof window !== 'undefined' && window.__fixCoins) {
        console.log("Applying emergency fix via window.__fixCoins");
        if (parsedCoins && !isNaN(parsedCoins)) {
          window.__fixCoins(parsedCoins);
        } else {
          window.__fixCoins(1000); // Default value if parsed coins is invalid
        }
      } else {
        console.warn("Emergency fix not available, falling back to manual update");
        // Fallback - direct update
        setFarmCoins(parsedCoins && !isNaN(parsedCoins) ? parsedCoins : 1000);
        localStorage.setItem("farm-coins", JSON.stringify(parsedCoins && !isNaN(parsedCoins) ? parsedCoins : 1000));
      }
      
    } catch (error) {
      console.error("Error during coin diagnosis:", error);
    }
  };
  
  // Emergency fix to reset state to 1000
  const emergencyStateFix = () => {
    try {
      const targetAmount = 1000;
      
      console.log("🚨 EMERGENCY RESET 🚨");
      console.log("Current coins before reset:", farmCoins);
      console.log("Target reset amount:", targetAmount);
      
      // Update React state first
      setFarmCoins(targetAmount);
      
      // Update localStorage immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem("farm-coins", JSON.stringify(targetAmount));
        console.log("localStorage updated to:", targetAmount);
      }
      
      // Then try window.__fixCoins if available as a backup
      if (typeof window !== 'undefined' && window.__fixCoins) {
        console.log("Also applying via window.__fixCoins");
        window.__fixCoins(targetAmount);
      }
      
      // Trigger confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      console.log("Reset complete! Coins should now be:", targetAmount);
      
      alert("Coins have been reset to 1000");
    } catch (error: unknown) {
      console.error("Error during emergency reset:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert("Failed to reset coins: " + errorMessage);
    }
  };

  // Handle rewarding coins
  const handleRewardCoins = (amount: number) => {
    // Add coins to player's balance
    addFarmCoins(amount)
    
    // Show reward message
    setRewardMessage(`+ ${amount} coins!`)
    
    // Clear message after a few seconds
    setTimeout(() => {
      setRewardMessage(null)
    }, 3000)
  }
  
  // Enhanced function to handle adding dev coins with better feedback and debugging
  const handleAddDevCoins = () => {
    if (isAddingCoins) return // Prevent multiple simultaneous clicks
    
    // Set loading state
    setIsAddingCoins(true)
    
    // Update debug info
    setDevButtonDebug(prev => ({
      clicks: prev.clicks + 1,
      lastClicked: Date.now()
    }))
    
    // Show temporary feedback
    setRewardMessage("Adding coins...")
    
    console.log("Dev button clicked, adding 500 coins. Current balance:", farmCoins)
    
    // Add the coins with a slight delay for visual feedback
    setTimeout(() => {
      try {
        // Calculate new balance
        const newBalance = farmCoins + 500;
        console.log("Setting new balance to:", newBalance);
        
        // Directly update all storage mechanisms in sequence
        
        // 1. Update React state
        setFarmCoins(newBalance);
        
        // 2. Also update localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem("farm-coins", JSON.stringify(newBalance));
          console.log("localStorage updated with new balance:", newBalance);
        }
        
        // 3. Try window.__fixCoins too if available (belt and suspenders approach)
        if (typeof window !== 'undefined' && window.__fixCoins) {
          window.__fixCoins(newBalance);
          console.log("Also applied via window.__fixCoins");
        }
        
        // Update UI
        setRewardMessage(`+ 500 coins!`);
        
        // Log after state update (note: may not show updated value due to React state batching)
        console.log("Coins should now be set to:", newBalance);
        
        // Small confetti celebration for the dev coins
        if (confettiRef.current && typeof triggerConfetti === 'function') {
          triggerConfetti()
        }
      } catch (error: unknown) {
        console.error("Error adding dev coins:", error)
        setRewardMessage("Error adding coins")
      } finally {
        // Reset loading state after a delay
        setTimeout(() => {
          setIsAddingCoins(false)
          
          // Clear the message
          setTimeout(() => {
            setRewardMessage(null)
          }, 2000)
        }, 500)
      }
    }, 300)
  }
  
  // Handle opening the case
  const handleOpenCase = () => {
    if (!selectedCase) return
    
    // Check if user has enough coins
    if (farmCoins < selectedCase.price) {
      alert("Not enough coins to open this case!")
      return
    }
    
    // Call the modular openCase function with custom rarity distribution
    openCase(
      selectedCase, 
      farmCoins >= selectedCase.price, 
      () => addFarmCoins(-selectedCase.price),
      handleRewardCoins,
      rarityDistribution
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 noot-theme min-h-screen bg-black" ref={confettiRef}>
      {/* Add the script component to make window.__fixCoins available */}
      <FixCoinsScript />
      
      {/* Add sound effects */}
      <CaseSounds 
        isScrolling={isScrolling}
        isOpening={isOpening}
        showResult={showResult}
        itemRarity={selectedItem?.rarity}
      />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/farm-cases" className="mr-2">
            <button className="noot-button border-2 border-yellow-500 bg-black hover:bg-yellow-500 hover:text-black font-bold py-2 px-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          </Link>
          <Link href="/">
            <button className="noot-button border-2 border-yellow-500 bg-black hover:bg-yellow-500 hover:text-black font-bold py-2 px-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Main Page
            </button>
          </Link>
          <h1 className="text-3xl text-gradient-gold noot-title ml-4">Case Simulator</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex items-center bg-black border-2 border-yellow-500 px-3 py-1">
            <CircleDollarSign className="h-4 w-4 mr-2 text-yellow-500" />
            <span className="text-sm font-bold">{farmCoins} Coins</span>
            {rewardMessage && (
              <div className="absolute -top-8 left-0 right-0 text-center text-green-400 font-bold animate-bounce">
                {rewardMessage}
              </div>
            )}
            {debugInfo && (
              <div className="absolute -bottom-28 left-0 right-0 bg-black/90 border border-red-500 p-2 text-xs text-red-400 whitespace-pre-line">
                {debugInfo}
              </div>
            )}
          </div>
          {/* Dev button to add test coins - Updated with better feedback */}
          <button 
            onClick={handleAddDevCoins}
            disabled={isAddingCoins}
            className={`flex items-center ${
              isAddingCoins 
                ? "bg-purple-900 border-2 border-purple-700" 
                : "bg-purple-800 border-2 border-purple-500 hover:bg-purple-700"
            } px-3 py-1 transition-colors relative`}
            title={`Dev: Add 500 coins (Clicked ${devButtonDebug.clicks} times)`}
          >
            <Sparkles className={`h-4 w-4 mr-2 text-purple-300 ${isAddingCoins ? 'animate-spin' : ''}`} />
            <span className="text-sm font-bold text-purple-300">
              {isAddingCoins ? "Adding..." : "+500 (Dev)"}
            </span>
            {isAddingCoins && (
              <span className="absolute inset-0 bg-purple-500/20 animate-pulse"></span>
            )}
          </button>
          
          {/* Direct debug button */}
          <button 
            onClick={diagnoseCoinsIssue}
            className="flex items-center bg-red-900 border-2 border-red-700 px-3 py-1 hover:bg-red-800 transition-colors"
            title="Diagnose coin issues"
          >
            <Package className="h-4 w-4 mr-2 text-red-300" />
            <span className="text-sm font-bold text-red-300">Fix (Debug)</span>
          </button>
          
          {/* Emergency reset button */}
          <button 
            onClick={emergencyStateFix}
            className="flex items-center bg-orange-900 border-2 border-orange-700 px-3 py-1 hover:bg-orange-800 transition-colors"
            title="Emergency fix - sets coins to 1000"
          >
            <RotateCcw className="h-4 w-4 mr-2 text-orange-300" />
            <span className="text-sm font-bold text-orange-300">Reset (1000)</span>
          </button>
          
          <div className="flex items-center bg-black border-2 border-yellow-500 px-3 py-1">
            <BarChart className="h-4 w-4 mr-2 text-yellow-500" />
            <span className="text-sm font-bold">Level {playerLevel} | {playerXp} XP</span>
          </div>
          
          {/* Volume control */}
          <VolumeControl className="ml-2" />
        </div>
      </div>

      <div className="mb-6 flex border-b-2 border-yellow-500">
        <button
          className={`px-4 py-2 border-b-2 ${
            !viewingHistory 
              ? "border-yellow-500 text-yellow-500" 
              : "border-transparent text-white/60 hover:text-white"
          }`}
          onClick={() => setViewingHistory(false)}
        >
          Available Cases
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            viewingHistory 
              ? "border-yellow-500 text-yellow-500" 
              : "border-transparent text-white/60 hover:text-white"
          }`}
          onClick={() => setViewingHistory(true)}
        >
          Opening History
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!viewingHistory ? (
          <motion.div
            key="case-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {!selectedCase ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {farmCases.map(farmCase => (
                  <div 
                    key={farmCase.id}
                    onClick={() => setSelectedCase(farmCase)}
                    className="noot-card hover:border-white cursor-pointer transition-all transform hover:-translate-y-1"
                  >
                    <div className="p-6 flex flex-col items-center text-center h-full">
                      <div className="text-5xl mb-4">{farmCase.image}</div>
                      <h2 className="noot-title text-xl mb-2">{farmCase.name}</h2>
                      <p className="text-muted-foreground mb-4 flex-grow">
                        {farmCase.description}
                      </p>
                      <div className="mt-2 px-4 py-2 border border-[var(--noot-border)] bg-[var(--noot-bg)] flex items-center justify-center">
                        <CircleDollarSign className="h-4 w-4 mr-2 text-yellow-500" />
                        <span>{farmCase.price} Coins</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isOpening ? (
              <div className="max-w-md mx-auto text-center">
                {isScrolling && selectedItem ? (
                  <div className="noot-card p-6">
                    <CaseOpeningAnimation
                      items={selectedCase.items}
                      selectedItem={selectedItem}
                      onComplete={handleScrollingComplete}
                      caseImageUrl={selectedCase.image}
                    />
                  </div>
                ) : !showResult ? (
                  <div className="noot-card p-8">
                    <div className="flex justify-center mb-6">
                      <div className="text-6xl animate-bounce">{selectedCase.image}</div>
                    </div>
                    <h2 className="noot-title text-xl mb-4">Preparing Case...</h2>
                    <div className="flex justify-center">
                      <div className="w-16 h-16 border-4 border-t-highlight-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                ) : (
                  <div className="noot-card p-8">
                    <h2 className="noot-title text-xl mb-6">Your Reward!</h2>
                    
                    <div className="mb-6">
                      {selectedItem && <ItemCard item={selectedItem} />}
                    </div>
                    
                    {selectedItem && (
                      <div className="mb-6 text-center">
                        <div className="text-white/80 mb-2">Item Value:</div>
                        <div className="flex items-center justify-center">
                          <CircleDollarSign className="h-5 w-5 text-yellow-500 mr-2" />
                          <span className="text-xl font-bold text-yellow-500">{selectedItem.value} Coins</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-center space-x-4">
                      <button 
                        className="noot-button"
                        onClick={() => {
                          resetCase()
                          setSelectedCase(null)
                        }}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Choose Another Case
                      </button>
                      <button 
                        className="noot-button bg-white text-black"
                        onClick={() => {
                          resetCase()
                          setTimeout(() => handleOpenCase(), 100)
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Open Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="noot-card p-8">
                  <div className="flex justify-center mb-6">
                    <div className="text-6xl">{selectedCase.image}</div>
                  </div>
                  <h2 className="noot-title text-xl mb-2 text-center">{selectedCase.name}</h2>
                  <p className="text-muted-foreground mb-6 text-center">
                    {selectedCase.description}
                  </p>
                  
                  <div className="mb-6 border border-[var(--noot-border)] bg-[var(--noot-bg)] p-4">
                    <div className="text-sm mb-2">This case contains:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedCase.items.map(item => (
                        <div key={item.id} className="flex items-center">
                          <div className="w-6 h-6 flex items-center justify-center mr-1">
                            {item.icon}
                          </div>
                          <div className="text-xs truncate">
                            {item.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <CircleDollarSign className="h-4 w-4 mr-1 text-yellow-500" />
                      <span className="text-lg font-medium">{selectedCase.price}</span>
                    </div>
                    <div className="text-xs text-white/60">
                      Available: {farmCoins} coins
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button 
                      className="noot-button"
                      onClick={() => setSelectedCase(null)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Go Back
                    </button>
                    <button 
                      className="noot-button bg-white text-black"
                      onClick={handleOpenCase}
                      disabled={farmCoins < selectedCase.price}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Open Case
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="noot-card p-6">
              <h2 className="noot-title text-xl mb-4">Opening History</h2>
              
              {openHistory.length === 0 ? (
                <div className="text-center p-8 text-white/60">
                  <div className="text-4xl mb-4">📦</div>
                  <p>You haven't opened any cases yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {openHistory.map((item, index) => (
                    <ItemCard key={`${item.id}-${index}`} item={item} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}