"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import styles from './styles.module.css';
import { CASES } from './static-cases';

// Define TypeScript interfaces first
interface Item {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  value: number;
  image: string;
}

interface Case {
  id: string;
  name: string;
  price: number;
  items: Item[];
}

interface CaseOpeningProps {
  caseId: string;
}

// Mock case data - in a real app would come from API/database
const CASES: Record<string, Case> = {
  '1': {
    id: '1',
    name: 'Chroma Case',
    price: 2.49,
    items: [
      { id: '101', name: 'AK-47 | Elite Build', rarity: 'uncommon', value: 5.23, image: '' },
      { id: '102', name: 'AWP | Worm God', rarity: 'uncommon', value: 6.78, image: '' },
      { id: '103', name: 'M4A1-S | Hyper Beast', rarity: 'rare', value: 15.34, image: '' },
      { id: '104', name: 'MAC-10 | Neon Rider', rarity: 'rare', value: 12.45, image: '' },
      { id: '105', name: 'Galil AR | Chatterbox', rarity: 'epic', value: 25.67, image: '' },
      { id: '106', name: 'Karambit | Doppler', rarity: 'legendary', value: 320.50, image: '' },
    ]
  },
  '2': {
    id: '2',
    name: 'Danger Zone Case',
    price: 1.99,
    items: [
      { id: '201', name: 'Glock-18 | Weasel', rarity: 'uncommon', value: 4.12, image: '' },
      { id: '202', name: 'MP9 | Modest Threat', rarity: 'uncommon', value: 3.56, image: '' },
      { id: '203', name: 'AWP | Neo-Noir', rarity: 'rare', value: 24.89, image: '' },
      { id: '204', name: 'Desert Eagle | Mecha Industries', rarity: 'rare', value: 18.76, image: '' },
      { id: '205', name: 'AK-47 | Asiimov', rarity: 'epic', value: 45.23, image: '' },
      { id: '206', name: 'Butterfly Knife | Fade', rarity: 'legendary', value: 650.75, image: '' },
    ]
  },
  '3': {
    id: '3',
    name: 'Prisma Case',
    price: 2.99,
    items: [
      { id: '301', name: 'MP5-SD | Gauss', rarity: 'uncommon', value: 5.65, image: '' },
      { id: '302', name: 'R8 Revolver | Skull Crusher', rarity: 'uncommon', value: 4.32, image: '' },
      { id: '303', name: 'AWP | Atheris', rarity: 'rare', value: 20.45, image: '' },
      { id: '304', name: 'AUG | Momentum', rarity: 'rare', value: 15.78, image: '' },
      { id: '305', name: 'M4A4 | The Emperor', rarity: 'epic', value: 38.90, image: '' },
      { id: '306', name: 'Talon Knife | Marble Fade', rarity: 'legendary', value: 720.15, image: '' },
    ]
  }
};

export default function CaseOpening({ caseId }: CaseOpeningProps) {
  const router = useRouter();
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Item | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [itemsPosition, setItemsPosition] = useState(0);
  const [generatedItems, setGeneratedItems] = useState<Item[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load case data based on caseId
  useEffect(() => {
    // In a real app, you would fetch this from an API
    const caseData = CASES[caseId as keyof typeof CASES];
    if (caseData) {
      setCurrentCase(caseData as Case);
    } else {
      // Handle invalid case ID
      router.push('/case-simulator');
    }
  }, [caseId, router]);

  // Generate items for the roulette display
  useEffect(() => {
    if (!currentCase) return;
    
    // Generate a large set of items for the roulette with random items from the case
    const items: Item[] = [];
    const itemCount = 50; // Number of items to display in roulette
    
    for (let i = 0; i < itemCount; i++) {
      // Get random item from the case with rarity weighting
      const randomIndex = Math.floor(Math.random() * currentCase.items.length);
      items.push(currentCase.items[randomIndex]);
    }
    
    // Set a fixed winning item at a specific position
    const winningItemIndex = 30; // Position where the winning item will be
    
    // Determine the winning item with weighted probability based on rarity
    const rarityWeights = {
      common: 0.5,
      uncommon: 0.35,
      rare: 0.1,
      epic: 0.04,
      legendary: 0.01
    };
    
    // Generate a random number between 0 and 1
    const rand = Math.random();
    let winningRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    
    // Determine rarity based on probability
    if (rand < rarityWeights.legendary) {
      winningRarity = 'legendary';
    } else if (rand < rarityWeights.legendary + rarityWeights.epic) {
      winningRarity = 'epic';
    } else if (rand < rarityWeights.legendary + rarityWeights.epic + rarityWeights.rare) {
      winningRarity = 'rare';
    } else if (rand < rarityWeights.legendary + rarityWeights.epic + rarityWeights.rare + rarityWeights.uncommon) {
      winningRarity = 'uncommon';
    } else {
      winningRarity = 'common';
    }
    
    // Get all items of the winning rarity
    const possibleWinningItems = currentCase.items.filter(item => item.rarity === winningRarity);
    
    // If there are no items of that rarity, get a random item
    const winningItem = possibleWinningItems.length > 0
      ? possibleWinningItems[Math.floor(Math.random() * possibleWinningItems.length)]
      : currentCase.items[Math.floor(Math.random() * currentCase.items.length)];
    
    items[winningItemIndex] = winningItem;
    setGeneratedItems(items);
    setResult(winningItem);
  }, [currentCase]);

  const handleSpin = () => {
    if (!currentCase || !containerRef.current || spinning) return;
    
    setSpinning(true);
    setShowResult(false);
    
    // Calculate the position to stop at
    const itemWidth = 130; // width of each item + margin
    const containerWidth = containerRef.current.offsetWidth;
    const centerPosition = containerWidth / 2;
    
    // Position to show the winning item (item #30) in the center
    const winningItemIndex = 30;
    const targetPosition = -(winningItemIndex * itemWidth) + centerPosition - (itemWidth / 2);
    
    // Set the final position with some randomness
    setItemsPosition(targetPosition + (Math.random() * 10 - 5));
    
    // Show result after the animation completes
    setTimeout(() => {
      setShowResult(true);
      setSpinning(false);
    }, 5500); // Animation time (5s) + a small buffer
  };

  const handleClose = () => {
    setShowResult(false);
    window.location.href = '/case-simulator';
  };

  if (!currentCase) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">
          Loading Case...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.caseSimulatorContainer}>
      <header className={styles.header}>
        <Link href="/case-simulator">
          <Button 
            variant="ghost" 
            className="text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
        </Link>
        <div className={styles.logo}>
          CS:GO Case Simulator
        </div>
      </header>

      <div className={styles.openingContainer}>
        <div className={styles.caseDetails}>
          <div className={styles.caseDetailsImage}>
            <div className={styles.casePlaceholder}>Case</div>
          </div>
          <div className={styles.caseInfo}>
            <div className={styles.caseTitlePrice}>
              <div className={styles.caseTitle}>{currentCase.name}</div>
              <div className={styles.casePrice}>${currentCase.price.toFixed(2)}</div>
            </div>
            <p>Contains items from the {currentCase.name} collection</p>
            <Button 
              className={styles.spinButton}
              onClick={handleSpin}
              disabled={spinning}
            >
              {spinning ? 'Spinning...' : `Open for $${currentCase.price.toFixed(2)}`}
            </Button>
          </div>
        </div>

        <div className={styles.itemsRoulette}>
          <div 
            className={styles.itemsContainer} 
            ref={containerRef}
            style={{ left: spinning ? `${itemsPosition}px` : '0px' }}
          >
            {generatedItems.map((item, index) => (
              <div 
                key={`${item.id}-${index}`} 
                className={`${styles.rouletteItem} ${styles[item.rarity]}`}
              >
                <div className={styles.itemImage}></div>
                <div className={styles.itemName}>{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showResult && result && (
        <div className={styles.resultOverlay}>
          <div className={styles.resultCard}>
            <div className={styles.winTitle}>You Won!</div>
            <div className={styles.resultItemImage}></div>
            <div className={styles.resultItemName}>{result.name}</div>
            <div className={styles.resultItemCondition}>Factory New</div>
            <div className={styles.resultItemValue}>${result.value.toFixed(2)}</div>
            <Button 
              className={styles.closeButton} 
              onClick={handleClose}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 