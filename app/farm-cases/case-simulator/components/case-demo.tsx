"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  CaseOpeningAnimation, 
  CaseType, 
  CASE_ITEMS, 
  ADDITIONAL_ITEMS 
} from './case-opening-animation'
import { Item } from '../hooks/use-case-simulator'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Volume2, VolumeX } from 'lucide-react'

export function CaseDemo() {
  const [isOpening, setIsOpening] = useState(false)
  const [currentCaseType, setCurrentCaseType] = useState<CaseType>(CaseType.GOLDEN)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [openHistory, setOpenHistory] = useState<Item[]>([])
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Sound effects
  useEffect(() => {
    // Preload sound effects
    const clickSound = new Audio('/sounds/click.mp3')
    const openSound = new Audio('/sounds/case-open.mp3')
    const winSound = new Audio('/sounds/win.mp3')
    
    // Preload them
    clickSound.load()
    openSound.load()
    winSound.load()

    return () => {
      // Cleanup
      clickSound.pause()
      openSound.pause()
      winSound.pause()
    }
  }, [])

  // Play a sound effect if enabled
  const playSound = (type: 'click' | 'open' | 'win') => {
    if (!isSoundEnabled) return

    try {
      const sound = new Audio(`/sounds/${type === 'click' ? 'click.mp3' : type === 'open' ? 'case-open.mp3' : 'win.mp3'}`)
      sound.volume = type === 'win' ? 0.7 : 0.5
      sound.play()
    } catch (error) {
      console.log('Failed to play sound')
    }
  }

  // Function to trigger confetti for rare items
  const triggerConfetti = (rarity: string) => {
    if (rarity === 'Legendary' || rarity === 'Epic') {
      const colors = rarity === 'Legendary' ? ['#FFD700', '#FFA500'] : ['#9400D3', '#8A2BE2']
      
      confetti({
        particleCount: rarity === 'Legendary' ? 200 : 100,
        spread: 70,
        origin: { y: 0.6 },
        colors,
        startVelocity: 30,
        gravity: 0.8,
        scalar: 0.9,
        shapes: ['circle', 'square']
      })
    }
  }

  // Function to select an item based on rarity distribution
  const selectItem = (caseType: CaseType): Item => {
    const items = [...CASE_ITEMS[caseType], ...ADDITIONAL_ITEMS]
    
    // Rarity weights from the requirements
    const rarityWeights = {
      "Common": 0.6,
      "Uncommon": 0.25,
      "Rare": 0.1,
      "Epic": 0.04,
      "Legendary": 0.01
    }
    
    // Use weighted random selection based on rarity distribution
    const totalWeight = Object.values(rarityWeights).reduce((sum, weight) => sum + weight, 0)
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
    let selectedRarity = Object.keys(rarityWeights)[0]
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
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

  const openCase = (caseType: CaseType) => {
    playSound('click')
    setIsLoading(true)
    
    // Small delay for animation purposes
    setTimeout(() => {
      setCurrentCaseType(caseType)
      setIsOpening(true)
      setIsLoading(false)
      
      // Select an item using our custom selection function
      const item = selectItem(caseType)
      setSelectedItem(item)
      
      // Play the opening sound
      playSound('open')
    }, 800)
  }

  const handleAnimationComplete = () => {
    setIsOpening(false)
    
    if (selectedItem) {
      // Play win sound and trigger confetti for rare items
      playSound('win')
      triggerConfetti(selectedItem.rarity)
      
      // Add to history
      setOpenHistory(prev => [selectedItem, ...prev])
    }
  }

  const CaseCard = ({ type, title, description, items }: { 
    type: CaseType,
    title: string,
    description: string,
    items: Item[]
  }) => {
    const getGradientByType = () => {
      switch(type) {
        case CaseType.GOLDEN: return "from-yellow-600 to-yellow-400";
        case CaseType.SILVER: return "from-gray-400 to-gray-300";
        case CaseType.BRONZE: return "from-amber-700 to-amber-500";
      }
    }
    
    const getBorderByType = () => {
      switch(type) {
        case CaseType.GOLDEN: return "border-yellow-500";
        case CaseType.SILVER: return "border-gray-400";
        case CaseType.BRONZE: return "border-amber-700";
      }
    }
    
    const getButtonBgByType = () => {
      switch(type) {
        case CaseType.GOLDEN: return "bg-yellow-600 hover:bg-yellow-700";
        case CaseType.SILVER: return "bg-gray-600 hover:bg-gray-700";
        case CaseType.BRONZE: return "bg-amber-800 hover:bg-amber-900";
      }
    }
    
    return (
      <motion.div 
        className={`border ${getBorderByType()} rounded-lg overflow-hidden bg-black/50`}
        whileHover={{ 
          scale: 1.03, 
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          transition: { duration: 0.2 }
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: type === CaseType.GOLDEN ? 0.1 : type === CaseType.SILVER ? 0.2 : 0.3 }}
      >
        <div className={`bg-gradient-to-r ${getGradientByType()} text-black p-3`}>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm">{description}</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {items.slice(0, 4).map((item) => (
              <motion.div 
                key={item.id} 
                className="text-sm flex items-center"
                whileHover={{ x: 5, color: '#fff' }}
              >
                <span className="mr-1">{item.icon}</span> {item.name}
              </motion.div>
            ))}
          </div>
          <Button 
            onClick={() => openCase(type)}
            className={`w-full ${getButtonBgByType()} relative overflow-hidden`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                Open {title}
                <span className="absolute top-0 left-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform"></span>
              </>
            )}
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <motion.div 
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold">Nooters Farm Case Opening</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          className="rounded-full"
          title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </Button>
      </motion.div>
      
      <AnimatePresence mode="wait">
        {!isOpening ? (
          <motion.div
            key="case-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <CaseCard 
                type={CaseType.GOLDEN}
                title="GOLDEN Case"
                description="Contains premium tokens"
                items={CASE_ITEMS[CaseType.GOLDEN]}
              />
              
              <CaseCard 
                type={CaseType.SILVER}
                title="SILVER Case"
                description="Contains silver tier tokens"
                items={CASE_ITEMS[CaseType.SILVER]}
              />
              
              <CaseCard 
                type={CaseType.BRONZE}
                title="BRONZE Case"
                description="Contains standard tokens"
                items={CASE_ITEMS[CaseType.BRONZE]}
              />
            </div>
            
            {/* Opening History */}
            {openHistory.length > 0 && (
              <motion.div 
                className="mt-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-xl font-bold mb-3">Opening History</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {openHistory.map((item, index) => (
                    <motion.div 
                      key={`history-${index}`}
                      className={`border rounded-md p-2 text-center ${
                        item.rarity === 'Legendary' ? 'border-yellow-500 bg-yellow-950/30' :
                        item.rarity === 'Epic' ? 'border-purple-500 bg-purple-950/30' :
                        item.rarity === 'Rare' ? 'border-blue-500 bg-blue-950/30' :
                        item.rarity === 'Uncommon' ? 'border-green-500 bg-green-950/30' :
                        'border-gray-500 bg-gray-900/30'
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.05,
                        type: "spring", 
                        stiffness: 200
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: item.rarity === 'Legendary' ? '0 0 15px rgba(255, 215, 0, 0.5)' : 
                                  item.rarity === 'Epic' ? '0 0 15px rgba(148, 0, 211, 0.5)' : 
                                  'none'
                      }}
                    >
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.rarity}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="case-opening"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {selectedItem && (
              <CaseOpeningAnimation
                items={[...CASE_ITEMS[currentCaseType], ...ADDITIONAL_ITEMS]}
                selectedItem={selectedItem}
                onComplete={handleAnimationComplete}
                caseType={currentCaseType}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Sponsor */}
      <motion.div 
        className="mt-12 border-t border-gray-800 pt-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <a 
          href="https://hackathon.nootonabstract.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-400 hover:text-white"
        >
          Powered by Noot On Abstract
        </a>
      </motion.div>
    </div>
  )
} 