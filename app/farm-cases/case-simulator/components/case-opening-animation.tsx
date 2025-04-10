"use client"

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Item } from '../hooks/use-case-simulator'
import { CircleDollarSign, Star } from 'lucide-react'

interface CaseOpeningAnimationProps {
  items: Item[]
  selectedItem: Item
  onComplete: () => void
  caseImageUrl?: string
}

export function CaseOpeningAnimation({ 
  items, 
  selectedItem, 
  onComplete,
  caseImageUrl
}: CaseOpeningAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(true)
  const [showFlash, setShowFlash] = useState(false)
  
  // Create an array of items to display in the scrolling animation
  // We want to include the selectedItem, but also have a mixture of other items
  // The total items should be around 50 to create a good scrolling effect
  const scrollingItems = useRef<Item[]>([])
  
  // Setup the scrolling items on mount
  useEffect(() => {
    // A helper to get random items but ensure we have a good mix of rarities
    const getRandomItems = (count: number): Item[] => {
      const result: Item[] = []
      
      // Function to get a weighted random item
      const getRandomItem = (): Item => {
        const rarityWeights = {
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
        
        // Get items of this rarity
        const rarityItems = items.filter(item => item.rarity === targetRarity)
        
        // If no items of this rarity, just pick a random item
        if (rarityItems.length === 0) {
          return items[Math.floor(Math.random() * items.length)]
        }
        
        return rarityItems[Math.floor(Math.random() * rarityItems.length)]
      }
      
      // Fill the result array with random items
      for (let i = 0; i < count; i++) {
        result.push(getRandomItem())
      }
      
      return result
    }
    
    // Create the scrolling sequence
    // First 30-40 items are random
    const randomItems = getRandomItems(35)
    
    // Insert the selected item at position ~40-45 (this will be where it stops)
    const finalPosition = 40 + Math.floor(Math.random() * 5)
    
    // Add 10 more random items after the selected item
    const trailingItems = getRandomItems(10)
    
    // Combine everything into the full scrolling sequence
    scrollingItems.current = [
      ...randomItems,
      selectedItem,
      ...trailingItems
    ]
    
    // Start the scrolling animation after a short delay for better UX
    setTimeout(() => {
      startScrollingAnimation()
    }, 500)
  }, [items, selectedItem])
  
  // Function to create the scrolling animation
  const startScrollingAnimation = () => {
    if (!containerRef.current) return
    
    // Set initial state
    setIsScrolling(true)
    
    // Calculate the position where the selected item will be when it stops
    // This should be in the center of the container
    const itemWidth = 140 // Width of each item in pixels
    const selectedItemIndex = 40 // Position where the selected item is in the scrollingItems array
    const scrollDistance = selectedItemIndex * itemWidth
    
    // Set the container's scroll position to 0
    containerRef.current.scrollLeft = 0
    
    // Force a re-render to ensure items are visible
    setIsScrolling(false)
    setTimeout(() => {
      setIsScrolling(true)
      
      // Need a small delay to ensure the DOM has updated
      setTimeout(() => {
        if (!containerRef.current) return
        
        // Start the actual scrolling animation
        const startTime = Date.now()
        const duration = 8000 // 8 seconds of scrolling animation
        
        const animate = () => {
          if (!containerRef.current) return
          
          const currentTime = Date.now()
          const elapsed = currentTime - startTime
          const progress = Math.min(elapsed / duration, 1) // Value between 0 and 1
          
          // Custom easing function with slowdown near the end
          // This makes it slow down as it approaches the winning item
          const customEase = (t: number) => {
            // Fast at the beginning (first 70%)
            if (t < 0.7) {
              return t * 1.3;
            }
            
            // Slow down dramatically for last 30%
            // Use cubic ease-out for a smooth slowdown
            const normalized = (t - 0.7) / 0.3; // normalize to 0-1 range
            const slowdown = 1 - Math.pow(1 - normalized, 3); // cubic ease-out
            return 0.7 + (slowdown * 0.3); // map back to 0.7-1.0 range
          };
          
          const easedProgress = Math.min(customEase(progress), 1);
          
          // Set the scroll position
          containerRef.current.scrollLeft = easedProgress * scrollDistance
          
          // Continue animation if not complete
          if (progress < 1) {
            requestAnimationFrame(animate)
          } else {
            // Animation complete - show final highlight for a moment
            setTimeout(() => {
              // Slight adjustment to ensure perfect centering of selected item
              if (containerRef.current) {
                containerRef.current.scrollLeft = scrollDistance;
              }
              
              // Wait a moment with the result visible before calling completion
              setTimeout(() => {
                // Add a flash effect
                setShowFlash(true)
                setTimeout(() => {
                  setShowFlash(false)
                  setIsScrolling(false)
                  onComplete()
                }, 600)
              }, 800) // Longer delay after scrolling stops
            }, 200)
          }
        }
        
        // Start the animation
        requestAnimationFrame(animate)
      }, 50)
    }, 50)
  }
  
  // Create a component to render individual items
  const ItemDisplay = ({ item, isSelected }: { item: Item, isSelected?: boolean }) => {
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
    
    return (
      <div className={`border-2 ${isSelected ? 'border-white ring-2 ring-yellow-500' : rarityColor} h-full flex flex-col min-w-[140px] w-[140px] mx-2 overflow-hidden shadow-md transform transition-transform duration-200 hover:scale-105`}>
        {/* Item icon display */}
        <div className={`flex-1 flex items-center justify-center p-2 ${isSelected ? 'bg-[#3A3A3A]' : 'bg-[#2A2A2A]'}`}>
          <span className="text-4xl">{item.icon}</span>
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
        
        {isSelected && (
          <div className="absolute inset-0 pointer-events-none border-2 border-white bg-yellow-500/10 flex items-center justify-center">
            <div className="bg-black/70 px-2 py-1 rounded-md text-xs text-white font-bold rotate-[-15deg]">
              YOUR PRIZE!
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // The indicator for the center position (where the selected item will stop)
  const CenterIndicator = () => (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div className="relative h-full w-[2px] bg-yellow-500">
        <div className="absolute -top-[1px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-yellow-500"></div>
        <div className="absolute -bottom-[1px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-yellow-500"></div>
      </div>
    </div>
  )
  
  return (
    <div className="relative">
      {/* Case image at the top */}
      {caseImageUrl && (
        <div className="text-center mb-4">
          <div className="text-6xl inline-block">{caseImageUrl}</div>
        </div>
      )}
      
      {/* Flash effect */}
      {showFlash && (
        <div className="absolute inset-0 bg-yellow-500/50 z-10 animate-pulse pointer-events-none" />
      )}
      
      {/* Scrolling container with items */}
      <div className="relative">
        {/* The scrolling container */}
        <div 
          ref={containerRef}
          className="flex overflow-x-hidden py-6 px-4 scrollbar-none bg-[#1D1D1D] border-2 border-gray-800"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none', 
            height: '140px',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth'
          }}
        >
          {/* Display items - force rendering immediately rather than using ref */}
          <div className="min-w-[calc(50%-70px)]" />
          
          {isScrolling && Array.isArray(scrollingItems.current) && scrollingItems.current.length > 0 ? (
            scrollingItems.current.map((item, index) => (
              <ItemDisplay 
                key={`scroll-${index}`} 
                item={item} 
                isSelected={item.id === selectedItem.id}
              />
            ))
          ) : (
            // Fallback items if the scrolling items aren't populated yet
            [...Array(20)].map((_, index) => (
              <ItemDisplay 
                key={`fallback-${index}`} 
                item={{
                  id: `fallback-${index}`,
                  name: index % 7 === 0 ? "Golden Hen" : 
                        index % 7 === 1 ? "Super Cow" :
                        index % 7 === 2 ? "Spotted Pig" :
                        index % 7 === 3 ? "Rainbow Sheep" :
                        index % 7 === 4 ? "Mythical Unicorn" :
                        index % 7 === 5 ? "Farm Duck" : "Fancy Goat",
                  icon: index % 7 === 0 ? "🐔" : 
                        index % 7 === 1 ? "🐄" :
                        index % 7 === 2 ? "🐖" :
                        index % 7 === 3 ? "🐑" :
                        index % 7 === 4 ? "🦄" :
                        index % 7 === 5 ? "🦆" : "🐐",
                  rarity: index % 5 === 0 ? "Common" :
                          index % 5 === 1 ? "Uncommon" :
                          index % 5 === 2 ? "Rare" :
                          index % 5 === 3 ? "Epic" : "Legendary",
                  value: 100 + (index * 50),
                  description: "Farm animal"
                }} 
              />
            ))
          )}
          
          <div className="min-w-[calc(50%-70px)]" />
        </div>
        
        {/* The center indicator */}
        <CenterIndicator />
        
        {/* Gradient overlays for better visual effect */}
        <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-black to-transparent pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
      </div>
      
      {/* Status text */}
      <div className="text-center mt-4">
        {isScrolling ? (
          <div className="text-white/80">
            <p className="font-bold text-yellow-500 text-lg mb-2">Rolling...</p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 max-w-lg mx-auto text-sm">
              <div className="flex items-center"><span className="mr-1 text-lg">🐔</span> Golden Hen</div>
              <div className="flex items-center"><span className="mr-1 text-lg">🐄</span> Super Cow</div>
              <div className="flex items-center"><span className="mr-1 text-lg">🐖</span> Spotted Pig</div>
              <div className="flex items-center"><span className="mr-1 text-lg">🐑</span> Rainbow Sheep</div>
              <div className="flex items-center"><span className="mr-1 text-lg">🦄</span> Mythical Unicorn</div>
              <div className="flex items-center"><span className="mr-1 text-lg">🦆</span> Farm Duck</div>
              <div className="flex items-center"><span className="mr-1 text-lg">🐐</span> Fancy Goat</div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold p-3 rounded-md shadow-lg"
          >
            <p className="text-xl">YOU GOT: {selectedItem.icon} {selectedItem.name}!</p>
          </motion.div>
        )}
      </div>
    </div>
  )
} 