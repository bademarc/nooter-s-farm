"use client"

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Item } from '../hooks/use-case-simulator'
import { CircleDollarSign, Star } from 'lucide-react'
import Image from 'next/image'

// Add type declaration for the window object
declare global {
  interface Window {
    __animationSelectedItem?: Item;
  }
}

// Define case types
export enum CaseType {
  GOLDEN = "GOLDEN",
  BRONZE = "BRONZE",
  SILVER = "SILVER"
}

// Define item collections for each case
export const CASE_ITEMS: Record<CaseType, Item[]> = {
  [CaseType.GOLDEN]: [
    { id: "pinga", name: "$PINGA", description: "Golden case item", rarity: "Legendary", value: 1000, icon: "💰", image: "/case items/golden/bearish.jpg" },
    { id: "nutz", name: "$NUTZ", description: "Golden case item", rarity: "Epic", value: 800, icon: "🥜", image: "/case items/golden/nutz.jpg" },
    { id: "mop", name: "$MOP", description: "Golden case item", rarity: "Rare", value: 500, icon: "🧹", image: "/case items/golden/MOP.png" },
    { id: "feathers", name: "$FEATHERS", description: "Golden case item", rarity: "Uncommon", value: 300, icon: "🪶", image: "/case items/golden/Feathersabstract.jpg" },
    { id: "retsba", name: "$RETSBA", description: "Golden case item", rarity: "Uncommon", value: 250, icon: "🎭", image: "/case items/golden/RETSBA.jpg" },
    { id: "wojact", name: "$WOJACT", description: "Golden case item", rarity: "Common", value: 100, icon: "🙂", image: "/case items/golden/Wojact.jpg" },
    { id: "yup", name: "$YUP", description: "Golden case item", rarity: "Common", value: 50, icon: "👍", image: "/case items/golden/yup.jpg" }
  ],
  [CaseType.BRONZE]: [
    { id: "dojo3", name: "DOJO3", description: "Bronze case item", rarity: "Epic", value: 600, icon: "🥋", image: "/case items/bronze/Dojo3.jpg" },
    { id: "chester", name: "$CHESTER", description: "Bronze case item", rarity: "Rare", value: 400, icon: "🐱", image: "/case items/bronze/Chester.jpg" },
    { id: "77bit", name: "77-bit", description: "Bronze case item", rarity: "Uncommon", value: 200, icon: "🎮", image: "/case items/bronze/77-Bit.jpg" }
  ],
  [CaseType.SILVER]: [
    { id: "paingu", name: "$PAINGU", description: "Silver case item", rarity: "Legendary", value: 900, icon: "🐧", image: "/case items/silver/PAINGU.jpg" },
    { id: "penguin", name: "$PENGUIN", description: "Silver case item", rarity: "Epic", value: 700, icon: "🐧", image: "/case items/silver/PENGUIN.jpg" }
  ]
}

// Additional items that can appear in any case
export const ADDITIONAL_ITEMS: Item[] = [
  { id: "noot", name: "$NOOT", description: "Special item", rarity: "Legendary", value: 1200, icon: "🦆", image: "/NOOT.png" },
  { id: "farmcoins", name: "$FARM COINS", description: "Currency", rarity: "Rare", value: 350, icon: "🪙", image: "/placeholder.svg" },
  { id: "null", name: "NULL (nothing)", description: "Empty reward", rarity: "Common", value: 0, icon: "❌", image: "/placeholder.svg" }
]

interface CaseOpeningAnimationProps {
  items: Item[]
  selectedItem: Item
  onComplete: () => void
  caseType?: CaseType
  caseImageUrl?: string
  sponsorUrl?: string
}

export function CaseOpeningAnimation({ 
  items, 
  selectedItem, 
  onComplete,
  caseType = CaseType.GOLDEN,
  caseImageUrl,
  sponsorUrl = "https://hackathon.nootonabstract.xyz"
}: CaseOpeningAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rollerRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(true)
  const [showFlash, setShowFlash] = useState(false)
  const [margin, setMargin] = useState(0)
  
  // Create an array of items to display in the scrolling animation
  // We want to include the selectedItem, but also have a mixture of other items
  const scrollingItems = useRef<Item[]>([])
  
  // Setup the scrolling items on mount and start animation
  useEffect(() => {
    console.log('ANIMATION COMPONENT: Setting up with selected item:', selectedItem.name, selectedItem.id);
    
    // Store the selected item globally for debug purposes
    if (typeof window !== 'undefined') {
      window.__animationSelectedItem = selectedItem;
    }
    
    // A helper to get random items but ensure we have a good mix of rarities
    const getRandomItems = (count: number, fakeChances = false): Item[] => {
      const result: Item[] = []
      
      // Function to get a weighted random item
      const getRandomItem = (): Item => {
        // Different weights for display vs actual result
        const rarityWeights = fakeChances ? 
          {
            "Common": 0.5, 
            "Uncommon": 0.25,
            "Rare": 0.13,
            "Epic": 0.08,
            "Legendary": 0.04
          } : 
          {
            "Common": 0.6,
            "Uncommon": 0.25,
            "Rare": 0.1,
            "Epic": 0.04,
            "Legendary": 0.01
          }
        
        const random = Math.random()
        let cumulativeWeight = 0
        let targetRarity: string | null = null
        
        // Determine which rarity to pick based on weights
        for (const [rarity, weight] of Object.entries(rarityWeights)) {
          cumulativeWeight += weight
          if (random <= cumulativeWeight) {
            targetRarity = rarity
            break
          }
        }
        
        // Get items of this rarity, excluding the selected item
        const rarityItems = items.filter(item => 
          item.rarity === targetRarity && 
          item.id !== selectedItem.id // Ensure we don't include duplicates of the selected item
        )
        
        // If no items of this rarity, just pick a random item (not the selected one)
        if (rarityItems.length === 0) {
          const otherItems = items.filter(item => item.id !== selectedItem.id)
          return otherItems.length > 0 ? 
            otherItems[Math.floor(Math.random() * otherItems.length)] : 
            items[Math.floor(Math.random() * items.length)]
        }
        
        return rarityItems[Math.floor(Math.random() * rarityItems.length)]
      }
      
      // Fill the result array with random items
      for (let i = 0; i < count; i++) {
        result.push(getRandomItem())
      }
      
      return result
    }
    
    // Generate a random result index between 40-60 (like in CS:GO simulator)
    const resultIndex = Math.floor(Math.random() * 20) + 40;
    
    // Create items for display
    const beforeItems = getRandomItems(resultIndex, true); // Items before the prize
    const afterItems = getRandomItems(5, true); // Items after the prize

    // Create the full array of items
    scrollingItems.current = [
      ...beforeItems,
      selectedItem, // The selected item at the result index
      ...afterItems
    ];
    
    // Calculate the offset to center the selected item
    if (containerRef.current) {
      const itemWidth = 160; // Item width (140px) + gaps (20px)
      const containerWidth = containerRef.current.clientWidth;
      const centerPosition = containerWidth / 2;
      
      // Calculate target position: resultIndex * itemWidth positions the winning item,
      // then subtract half the container width to center it, and add half item width for precise centering
      const targetOffset = (resultIndex * itemWidth) - centerPosition + (itemWidth / 2);
      
      // Start with initial position
      setMargin(0);
      
      // Start animation after a short delay
      setTimeout(() => startScrollAnimation(targetOffset), 500);
    }
  }, [items, selectedItem]);
  
  // Function to handle the actual scrolling animation
  const startScrollAnimation = (targetOffset: number) => {
    // Set initial state
    setIsScrolling(true);
    
    // Start from 0 position
    setMargin(0);
    
    // Need a small delay to ensure the DOM has updated after setting margin to 0
    setTimeout(() => {
      // Calculate animation timing
      const startTime = Date.now();
      const duration = 10000; // 10 seconds for the complete animation (like CS:GO simulator)
      
      // Define a cubic-bezier easing function similar to CS:GO
      const easeOutCubic = (t: number) => {
        // Fast at start, slow at end
        return 1 - Math.pow(1 - Math.min(t, 1), 3);
      };
      
      // Animation frame function
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply easing
        const easedProgress = easeOutCubic(progress);
        
        // Set the negative margin for scrolling (like CS:GO simulator)
        setMargin(-easedProgress * targetOffset);
        
        // Continue animation until complete
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation is complete
          // Ensure the final position is exact
          setMargin(-targetOffset);
          
          // Add flash effect 
          setTimeout(() => {
            setShowFlash(true);
            setTimeout(() => {
              setShowFlash(false);
              setIsScrolling(false);
              // Call the completion handler
              onComplete();
            }, 600);
          }, 400);
        }
      };
      
      // Start the animation loop
      requestAnimationFrame(animate);
    }, 50);
  };
  
  // Create a component to render individual items
  const ItemDisplay = ({ item, isSelected, isInCenter }: { 
    item: Item, 
    isSelected?: boolean,
    isInCenter?: boolean 
  }) => {
    const rarityColor = 
      item.rarity === "Common" ? "border-gray-400 bg-gray-800" : 
      item.rarity === "Uncommon" ? "border-green-500 bg-green-900/30" :
      item.rarity === "Rare" ? "border-blue-500 bg-blue-900/30" :
      item.rarity === "Epic" ? "border-purple-500 bg-purple-900/30" :
      "border-yellow-500 bg-yellow-900/30"
    
    const rarityBgColor = 
      item.rarity === "Common" ? "bg-gray-700" : 
      item.rarity === "Uncommon" ? "bg-green-700" :
      item.rarity === "Rare" ? "bg-blue-700" :
      item.rarity === "Epic" ? "bg-purple-700" :
      "bg-yellow-600"
    
    // Combined selection state for clarity
    const highlight = isSelected || isInCenter
    
    // Calculate if item is in center based on margin position
    const isItemCentered = isInCenter || 
      (!isScrolling && item.id === selectedItem.id)
    
    return (
      <div className={`border-2 ${highlight ? 'border-white ring-2 ring-yellow-500' : rarityColor} h-full flex flex-col min-w-[140px] w-[140px] mx-2 overflow-hidden shadow-md transform transition-transform duration-200 ${highlight ? 'scale-110 z-10' : 'hover:scale-105'}`}>
        {/* Item image display */}
        <div className={`flex-1 flex items-center justify-center p-2 ${highlight ? 'bg-[#3A3A3A]' : 'bg-[#2A2A2A]'} relative overflow-hidden`}>
          {item.image ? (
            <div className="relative w-full h-full">
              <Image 
                src={item.image} 
                alt={item.name}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <span className="text-4xl">{item.icon}</span>
          )}
        </div>
        
        {/* Item info at bottom */}
        <div className={`${rarityBgColor} p-1.5 text-center`}>
          {item.rarity === "Legendary" ? (
            <div className="flex items-center justify-center text-black font-bold text-xs">
              <Star className="h-3 w-3 mr-1 fill-current" />
              <span>Rare Special Item</span>
            </div>
          ) : (
            <p className="text-white text-xs truncate font-medium">{item.name}</p>
          )}
        </div>
        
        {isItemCentered && (
          <div className="absolute inset-0 pointer-events-none border-2 border-white bg-yellow-500/20 flex items-center justify-center">
            <div className="bg-black/80 px-2 py-1 rounded-md text-xs text-white font-bold rotate-[-15deg] shadow-lg">
              YOUR PRIZE!
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // The indicator for the center position (where the selected item will stop)
  const CenterIndicator = () => {
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Highlight box for the center item */}
        <div 
          className="absolute h-full border-4 border-yellow-500 z-20 bg-gradient-to-b from-yellow-500/10 to-yellow-600/10"
          style={{
            width: '140px',
            // Center it in the container
            left: `calc(50% - 70px)`
          }}
        >
          {/* Top label */}
          <div className="absolute -top-7 left-0 right-0 text-center">
            <div className="bg-yellow-500 text-black font-bold px-2 py-1 rounded-t-md text-xs inline-block">
              YOUR REWARD
            </div>
          </div>
        </div>
        
        {/* Vertical line with arrows */}
        <div className="relative h-full w-[2px] bg-yellow-500">
          <div className="absolute -top-[1px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-yellow-500"></div>
          <div className="absolute -bottom-[1px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-yellow-500"></div>
        </div>
      </div>
    )
  }
  
  // Helper to get case name for display
  const getCaseName = () => {
    switch(caseType) {
      case CaseType.GOLDEN: return "GOLDEN Case";
      case CaseType.BRONZE: return "BRONZE Case";
      case CaseType.SILVER: return "SILVER Case";
      default: return "Mystery Case";
    }
  }
  
  // Helper to get case background color
  const getCaseBackground = () => {
    switch(caseType) {
      case CaseType.GOLDEN: return "bg-gradient-to-r from-yellow-600 to-yellow-400";
      case CaseType.BRONZE: return "bg-gradient-to-r from-amber-700 to-amber-500";
      case CaseType.SILVER: return "bg-gradient-to-r from-gray-400 to-gray-300";
      default: return "bg-gradient-to-r from-blue-600 to-blue-400";
    }
  }
  
  return (
    <div className="relative">
      {/* Case image and sponsor at the top */}
      <div className="flex items-center justify-between mb-4">
        <div className={`text-center py-2 px-4 rounded-md ${getCaseBackground()} text-black font-bold`}>
          {getCaseName()}
        </div>
        
        <a 
          href={sponsorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-black/30 hover:bg-black/50 transition-colors px-3 py-1 rounded-md text-sm"
        >
          Powered by Noot On Abstract
        </a>
      </div>
      
      {/* Flash effect */}
      {showFlash && (
        <div className="absolute inset-0 bg-yellow-500/50 z-10 animate-pulse pointer-events-none" />
      )}
      
      {/* Scrolling container with items */}
      <div className="relative" ref={containerRef}>
        {/* The scrolling container */}
        <div className="overflow-hidden py-6 px-4 bg-[#1D1D1D] border-2 border-gray-800 h-[140px] relative">
          {/* Roller with transition like the CS:GO simulator */}
          <div 
            ref={rollerRef}
            className="flex items-center h-full"
            style={{ 
              marginLeft: `${margin}px`,
              transition: `margin-left 10000ms cubic-bezier(0.23, 0.78, 0.29, 1)`
            }}
          >
            {/* Initial spacing */}
            <div className="min-w-[calc(50%-70px)]" />
            
            {/* Display items */}
            {Array.isArray(scrollingItems.current) && scrollingItems.current.length > 0 ? (
              scrollingItems.current.map((item, index) => {
                // Determine if this item is the selected item
                const isSelectedItem = item.id === selectedItem.id;
                
                // Calculate if the item is centered based on margin position
                // For CS:GO style, we'll use the current margin to estimate which item is centered
                const itemWidth = 150; // Item width + margin
                const containerWidth = containerRef.current?.clientWidth || 0;
                const centerPoint = containerWidth / 2;
                const itemPosition = (index * itemWidth) + margin + (containerWidth / 2) - 70;
                const isInCenterPosition = Math.abs(itemPosition - centerPoint) < 15;
                
                return (
                  <ItemDisplay 
                    key={`scroll-${index}`} 
                    item={item} 
                    isSelected={isSelectedItem && !isScrolling}
                    isInCenter={(isInCenterPosition && isScrolling) || (isSelectedItem && !isScrolling)}
                  />
                );
              })
            ) : (
              // Fallback items
              [...Array(20)].map((_, index) => {
                const caseItems = CASE_ITEMS[caseType] || CASE_ITEMS[CaseType.GOLDEN];
                const randomItem = caseItems[index % caseItems.length] || ADDITIONAL_ITEMS[index % ADDITIONAL_ITEMS.length];
                
                return (
                  <ItemDisplay 
                    key={`fallback-${index}`} 
                    item={randomItem} 
                  />
                );
              })
            )}
            
            {/* End spacing */}
            <div className="min-w-[calc(50%-70px)]" />
          </div>
          
          {/* The center indicator */}
          <CenterIndicator />
          
          {/* Gradient overlays for better visual effect */}
          <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-black to-transparent pointer-events-none z-10"></div>
          <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-black to-transparent pointer-events-none z-10"></div>
        </div>
      </div>
      
      {/* Status text */}
      <div className="text-center mt-4">
        {isScrolling ? (
          <div className="text-white/80">
            <p className="font-bold text-yellow-500 text-lg mb-2">
              Rolling... <span className="text-white text-sm">(The item that stops in the middle is your prize!)</span>
            </p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 max-w-lg mx-auto text-sm">
              {Object.entries(CASE_ITEMS).map(([caseType, items]) => (
                items.slice(0, 2).map((item, idx) => (
                  <div key={`preview-${caseType}-${idx}`} className="flex items-center">
                    {item.icon && <span className="mr-1 text-lg">{item.icon}</span>}
                    <span>{item.name}</span>
                  </div>
                ))
              ))}
              {ADDITIONAL_ITEMS.map((item, idx) => (
                <div key={`preview-additional-${idx}`} className="flex items-center">
                  {item.icon && <span className="mr-1 text-lg">{item.icon}</span>}
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className={`${getCaseBackground()} text-black font-bold p-3 rounded-md shadow-lg`}
          >
            <p className="text-xl">YOU GOT: {selectedItem.icon} {selectedItem.name}!</p>
            <p className="text-sm mt-1">Value: {selectedItem.value} coins</p>
          </motion.div>
        )}
      </div>
      
      {/* Sponsor footer */}
      <div className="mt-6 text-center">
        <a 
          href={sponsorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Powered by Noot On Abstract - https://hackathon.nootonabstract.xyz
        </a>
      </div>
    </div>
  )
} 