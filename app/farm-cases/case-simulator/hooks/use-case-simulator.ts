import { useState, useRef } from "react"
import confetti from "canvas-confetti"

// Add type declaration for the window object
declare global {
  interface Window {
    __debugSelectedItem?: Item;
  }
}

// Define item type
export interface Item {
  id: string
  name: string
  description: string
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary"
  value: number
  icon: string
  image?: string
}

// Define case type
export interface Case {
  id: string
  name: string
  description: string
  price: number
  theme: string
  items: Item[]
  image: string
}

export function useCaseSimulator() {
  const [isOpening, setIsOpening] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [openHistory, setOpenHistory] = useState<Item[]>([])
  const confettiRef = useRef<HTMLDivElement>(null)
  
  // Store the reward callback in a ref
  const rewardCoinsRef = useRef<((amount: number) => void) | null>(null)
  
  // Function to select an item based on rarity distribution
  const selectItem = (items: Item[], rarityDistribution?: Record<string, number>) => {
    // If no custom distribution is provided, use simple random selection
    if (!rarityDistribution) {
      const randomIndex = Math.floor(Math.random() * items.length)
      return items[randomIndex]
    }
    
    // Use weighted random selection based on rarity distribution
    const totalWeight = Object.values(rarityDistribution).reduce((sum, weight) => sum + weight, 0)
    let randomValue = Math.random() * totalWeight
    
    // Group items by rarity
    const itemsByRarity: Record<string, Item[]> = {}
    items.forEach(item => {
      if (!itemsByRarity[item.rarity]) {
        itemsByRarity[item.rarity] = []
      }
      itemsByRarity[item.rarity].push(item)
    })
    
    // Select rarity based on distribution
    let selectedRarity = Object.keys(rarityDistribution)[0]
    for (const [rarity, weight] of Object.entries(rarityDistribution)) {
      if (randomValue <= weight) {
        selectedRarity = rarity
        break
      }
      randomValue -= weight
    }
    
    // Select random item from the chosen rarity
    const rarityItems = itemsByRarity[selectedRarity] || items
    const randomIndex = Math.floor(Math.random() * rarityItems.length)
    return rarityItems[randomIndex]
  }
  
  const triggerConfetti = () => {
    if (typeof window !== 'undefined' && confettiRef.current) {
      const rect = confettiRef.current.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      
      // Simple confetti effect
      const colors = ['#ffd700', '#ffffff', '#ff4081', '#00e5ff']
      
      for (let i = 0; i < 100; i++) {
        const div = document.createElement('div')
        div.style.position = 'fixed'
        div.style.width = '10px'
        div.style.height = '10px'
        div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
        div.style.left = `${x}px`
        div.style.top = `${y}px`
        div.style.borderRadius = '50%'
        div.style.zIndex = '9999'
        
        document.body.appendChild(div)
        
        const angle = Math.random() * Math.PI * 2
        const velocity = 5 + Math.random() * 10
        const vx = Math.cos(angle) * velocity
        const vy = Math.sin(angle) * velocity
        
        let posX = x
        let posY = y
        
        const animate = () => {
          posX += vx
          posY += vy + 0.5 // gravity
          div.style.left = `${posX}px`
          div.style.top = `${posY}px`
          div.style.opacity = `${1 - (posY - y) / 500}`
          
          if (posY < window.innerHeight && parseFloat(div.style.opacity) > 0) {
            requestAnimationFrame(animate)
          } else {
            document.body.removeChild(div)
          }
        }
        
        setTimeout(() => requestAnimationFrame(animate), Math.random() * 500)
      }
    }
  }
  
  const openCase = (
    selectedCase: Case, 
    hasEnoughCoins: boolean, 
    deductCoins: () => void,
    rewardCoins: (amount: number) => void,
    rarityDistribution?: Record<string, number>
  ) => {
    if (!selectedCase || !hasEnoughCoins) return
    
    // Store the reward callback for later use
    rewardCoinsRef.current = rewardCoins
    
    // Deduct coins
    deductCoins()
    
    // Start opening sequence
    setIsOpening(true)
    
    // Select an item using our custom selection function
    const item = selectItem(selectedCase.items, rarityDistribution)
    
    // Log the selected item before setting it in state
    console.log("ITEM SELECTED:", item.name, item.id);
    
    // Store the selected item in the state - this is important!
    // This exact same item will be used throughout the animation and for rewards
    setSelectedItem(item)
    
    // Make a global reference to ensure no other item gets substituted
    window.__debugSelectedItem = item;
    
    // Start the scrolling animation after a brief delay to ensure state is set
    setTimeout(() => {
      console.log("SCROLLING STARTED with item:", item.name, item.id);
      setIsScrolling(true)
    }, 100)
    
    // The scrolling animation component will call handleScrollingComplete when done
  }
  
  // Function to handle completion of scrolling animation
  const handleScrollingComplete = () => {
    setIsScrolling(false)
    setShowResult(true)
    
    // Only proceed with these actions if we have a selected item
    if (selectedItem) {
      console.log("ANIMATION COMPLETE with item:", selectedItem.name, selectedItem.id);
      
      // Compare with the original selected item from the global reference
      if (window.__debugSelectedItem && window.__debugSelectedItem.id !== selectedItem.id) {
        console.error("MISMATCH DETECTED - Expected:", window.__debugSelectedItem.name, 
                    "Got:", selectedItem.name);
      }
      
      // Ensure we're working with the current selected item from state
      const currentItem = selectedItem;
      
      // Add opened item to history
      setOpenHistory(prev => [currentItem, ...prev])
      
      // Show confetti for Rare or better items
      if (currentItem.rarity !== "Common" && currentItem.rarity !== "Uncommon") {
        triggerConfetti()
      }
      
      // Reward player with coins based on item value
      // Only if the item's value is greater than 0 and we have a reward callback
      if (currentItem.value > 0 && rewardCoinsRef.current) {
        // Calculate reward - set this to the item's value
        const rewardAmount = Math.floor(currentItem.value)
        
        // Add coins to player's balance using the stored callback
        rewardCoinsRef.current(rewardAmount)
        
        // Log the reward for debugging
        console.log(`Rewarded ${rewardAmount} coins for ${currentItem.name}`)
      }
    }
  }
  
  const resetCase = () => {
    setIsOpening(false)
    setIsScrolling(false)
    setShowResult(false)
    setSelectedItem(null)
  }

  return {
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
  }
} 