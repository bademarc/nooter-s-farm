"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"
import toast from "react-hot-toast"

interface Seed {
  type: string
  name: string
  icon: string
  cost: number
  growthTime: number
  reward: number
  level: number
  upgradeCost: number
  bestSeason: Season
  weatherBonus: Weather[]
}

interface Plot {
  status: "empty" | "growing" | "ready"
  crop: string | null
  plantedAt: number | null
  readyAt: number | null
}

// Add inventory interface for crops
interface CropInventory {
  [key: string]: {
    count: number
    marketValue: number
  }
}

// Define seasons
export type Season = "spring" | "summer" | "fall" | "winter"

// Define weather type
export type Weather = "sunny" | "rainy" | "cloudy" | "windy" | "stormy"

// Add animal interfaces
interface Animal {
  type: string;
  name: string;
  icon: string;
  cost: number;
  productType: string;
  productionTime: number; // in minutes
  productionAmount: number;
  lastCollected: number | null;
  readyAt: number | null;
  happiness: number; // 0-100
  fed: boolean;
}

// Define animal products
interface AnimalProduct {
  type: string;
  name: string;
  icon: string;
  marketValue: number;
}

// Add animal product inventory
interface AnimalProductInventory {
  [key: string]: {
    count: number;
    marketValue: number;
  }
}

// Add craftable item interface
interface CraftableItem {
  type: string;
  name: string;
  icon: string;
  ingredients: { 
    type: string;
    count: number;
    isAnimalProduct?: boolean;
  }[];
  marketValue: number;
}

// Add crafted item inventory
interface CraftedItemInventory {
  [key: string]: {
    count: number;
    marketValue: number;
  }
}

// Add booster interface
interface Booster {
  type: string;
  name: string;
  icon: string;
  cost: number;
  description: string;
  duration: number; // in minutes
  effect: {
    type: "growth" | "yield";
    multiplier: number;
  };
}

// Add boosted plots tracking
interface BoostedPlot {
  plotIndex: number;
  boosterType: string;
  appliedAt: number;
  expiresAt: number;
}

export interface GameContextType {
  plots: Plot[];
  setPlots: (plots: Plot[]) => void;
  selectedSeed: Seed | null;
  setSelectedSeed: (seed: Seed | null) => void;
  seeds: Seed[];
  farmCoins: number;
  addFarmCoins: (amount: number) => void;
  setFarmCoins: (coins: number | ((prevCoins: number) => number)) => void;
  playerLevel: number;
  playerXp: number;
  playerXpToNext: number;
  playerName: string;
  addXp: (amount: number) => void;
  farmSize: number;
  expandFarm: () => void;
  cropsHarvested: number;
  seedsPlanted: number;
  totalCoinsEarned: number;
  incrementCropsHarvested: () => void;
  incrementSeedsPlanted: () => void;
  addCoinsEarned: (amount: number) => void;
  resetGame: () => void;
  upgradeSeed: (seedType: string) => void;
  cropInventory: CropInventory;
  addCropToInventory: (cropType: string, adjustedValue?: number, plotIndex?: number) => void;
  sellCrop: (cropType: string, count: number) => void;
  sellAllCrops: () => void;
  currentSeason: Season;
  setCurrentSeason: (season: Season) => void;
  currentWeather: Weather;
  setCurrentWeather: (weather: Weather) => void;
  seasonDay: number;
  advanceDay: () => void;
  seasonLength: number;
  // Animal-related properties and methods
  animals: Animal[];
  animalProducts: AnimalProduct[];
  animalProductInventory: AnimalProductInventory;
  buyAnimal: (animalType: string) => void;
  feedAnimal: (animalIndex: number) => void;
  collectAnimalProduct: (animalIndex: number) => void;
  sellAnimalProduct: (productType: string, count: number) => void;
  sellAllAnimalProducts: () => void;
  // Crafting-related properties and methods
  craftableItems: CraftableItem[];
  craftedItemInventory: CraftedItemInventory;
  craftItem: (itemType: string) => void;
  sellCraftedItem: (itemType: string, count: number) => void;
  sellAllCraftedItems: () => void;
  // Booster-related properties and methods
  boosters: Booster[];
  boostedPlots: BoostedPlot[];
  buyBooster: (boosterType: string) => void;
  applyBooster: (plotIndex: number, boosterType: string) => void;
  getPlotBoosters: (plotIndex: number) => BoostedPlot[];
  ownedBoosters: { [key: string]: number };
  // --- ADD Profile State ---
  nickname: string;
  setNickname: (name: string) => void;
  bio: string;
  setBio: (bio: string) => void;
}

export const GameContext = createContext<GameContextType>({
  farmCoins: 0,
  addFarmCoins: () => {},
  setFarmCoins: () => {},
  playerLevel: 1,
  playerXp: 0,
  playerXpToNext: 100,
  playerName: "Nooter",
  addXp: () => {},
  plots: [],
  setPlots: () => {},
  farmSize: 3,
  expandFarm: () => {},
  selectedSeed: null,
  setSelectedSeed: () => {},
  seeds: [],
  upgradeSeed: () => {},
  resetGame: () => {},
  cropsHarvested: 0,
  seedsPlanted: 0,
  totalCoinsEarned: 0,
  incrementCropsHarvested: () => {},
  incrementSeedsPlanted: () => {},
  addCoinsEarned: () => {},
  // Add crop inventory defaults
  cropInventory: {},
  addCropToInventory: () => {},
  sellCrop: () => {},
  sellAllCrops: () => {},
  currentSeason: "spring",
  setCurrentSeason: () => {},
  currentWeather: "sunny",
  setCurrentWeather: () => {},
  seasonDay: 1,
  advanceDay: () => {},
  seasonLength: 28,
  // Animal-related defaults
  animals: [],
  animalProducts: [],
  animalProductInventory: {},
  buyAnimal: () => {},
  feedAnimal: () => {},
  collectAnimalProduct: () => {},
  sellAnimalProduct: () => {},
  sellAllAnimalProducts: () => {},
  // Crafting-related defaults
  craftableItems: [],
  craftedItemInventory: {},
  craftItem: () => {},
  sellCraftedItem: () => {},
  sellAllCraftedItems: () => {},
  // Booster-related defaults
  boosters: [],
  boostedPlots: [],
  buyBooster: () => {},
  applyBooster: () => {},
  getPlotBoosters: () => [],
  ownedBoosters: {},
  // --- ADD Profile Defaults ---
  nickname: 'Nooter', 
  setNickname: () => {},
  bio: 'I love farming!', 
  setBio: () => {},
})

interface GameProviderProps {
  children: ReactNode
}

export const GameProvider = ({ children }: GameProviderProps) => {
  const [farmCoins, setFarmCoins] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const savedCoins = localStorage.getItem("farm-coins");
      if (savedCoins) return JSON.parse(savedCoins);
      
      // If no saved coins, give starter coins for new players
      console.log("New player detected! Adding 500 starter coins");
      // We'll save this to localStorage below
      return 500; // Starting coins for new players
    }
    return 0;
  })

  // Add a specific debugging effect to ensure proper initialization from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCoins = localStorage.getItem("farm-coins");
        console.log("[CoinFix] Initial load check - State:", farmCoins, "Storage:", savedCoins ? JSON.parse(savedCoins) : "Not found");
        
        if (savedCoins) {
          const parsedCoins = JSON.parse(savedCoins);
          // Check if there's a mismatch between state and localStorage
          if (parsedCoins !== farmCoins) {
            console.log(`[CoinFix] Fixing mismatch: ${farmCoins} → ${parsedCoins}`);
            setFarmCoins(parsedCoins);
          }
        } else {
          // If no localStorage value exists, initialize it
          console.log("[CoinFix] No localStorage value, setting initial coins");
          localStorage.setItem("farm-coins", JSON.stringify(farmCoins));
        }
      } catch (error) {
        console.error("[CoinFix] Error during localStorage sync:", error);
      }
    }
  }, []); // Empty dependency array to run only once on mount

  // Add manual debug function to global scope for emergency fixes
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore - Adding debug method to window
      window.__fixCoins = (amount: number) => {
        console.log(`[CoinFix] Manual fix requested: ${amount}`);
        setFarmCoins(amount);
        localStorage.setItem("farm-coins", JSON.stringify(amount));
      };
    }
  }, []);

  const [playerLevel, setPlayerLevel] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("player-level")
      return saved ? Number.parseInt(saved) : 1
    }
    return 1
  })

  const [playerXp, setPlayerXp] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("player-xp")
      return saved ? Number.parseInt(saved) : 0
    }
    return 0
  })

  const [playerXpToNext, setPlayerXpToNext] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("player-xp-next")
      return saved ? Number.parseInt(saved) : 100
    }
    return 100
  })

  const [playerName] = useState<string>("Nooter")

  const [farmSize, setFarmSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("farmSize")
      return saved ? Number.parseInt(saved) : 3
    }
    return 3
  })

  const [plots, setPlots] = useState<Plot[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("plots")
      if (saved) return JSON.parse(saved)
    }
    return Array(25)
      .fill(null)
      .map(() => ({ status: "empty", crop: null, plantedAt: null, readyAt: null }))
  })

  const [seeds, setSeeds] = useState<Seed[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("seeds")
      if (saved) {
        try {
          const parsedSeeds = JSON.parse(saved);
          
          // Check if seeds have the correct seasonal information
          const summerSeeds = parsedSeeds.filter(
            (seed: any) => seed.bestSeason === "summer"
          );
          
          console.log("Loaded seeds from localStorage, summer seeds:", summerSeeds);
          
          // If we don't have any summer seeds, something is wrong with the data
          // Reset to default seeds
          if (summerSeeds.length === 0) {
            console.warn("No summer seeds found in localStorage, resetting to defaults");
            const defaultSeeds: Seed[] = [
              { type: "carrot", name: "Carrot", icon: "CARROT", cost: 5, growthTime: 2, reward: 8, level: 1, upgradeCost: 40, bestSeason: "spring" as Season, weatherBonus: ["rainy"] },
              { type: "radish", name: "Radish", icon: "RADISH", cost: 13, growthTime: 3, reward: 13, level: 1, upgradeCost: 60, bestSeason: "fall" as Season, weatherBonus: ["cloudy", "windy"] },
              { type: "lettuce", name: "Broccoli", icon: "BROCCOLI", cost: 15, growthTime: 5, reward: 18, level: 1, upgradeCost: 75, bestSeason: "spring" as Season, weatherBonus: ["rainy", "cloudy"] },
              { type: "corn", name: "Corn", icon: "CORN", cost: 24, growthTime: 6, reward: 40, level: 1, upgradeCost: 100, bestSeason: "summer" as Season, weatherBonus: ["sunny", "rainy"] },
              { type: "eggplant", name: "Aubergine", icon: "AUBERGINE", cost: 28, growthTime: 7.5, reward: 42, level: 1, upgradeCost: 120, bestSeason: "summer" as Season, weatherBonus: ["sunny"] },
              { type: "tomato", name: "Dometos", icon: "TOMATO", cost: 30, growthTime: 8, reward: 50, level: 1, upgradeCost: 130, bestSeason: "summer" as Season, weatherBonus: ["sunny"] },
              { type: "strawberry", name: "Zucchini", icon: "ZUCCHINI", cost: 35, growthTime: 12, reward: 60, level: 1, upgradeCost: 140, bestSeason: "spring" as Season, weatherBonus: ["rainy"] },
              { type: "watermelon", name: "Pear", icon: "PEAR", cost: 80, growthTime: 18, reward: 150, level: 1, upgradeCost: 200, bestSeason: "fall" as Season, weatherBonus: ["sunny", "cloudy"] },
            ];
            localStorage.setItem("seeds", JSON.stringify(defaultSeeds));
            return defaultSeeds;
          }
          
          return parsedSeeds;
        } catch (error) {
          console.error("Error parsing seeds from localStorage:", error);
        }
      }
    }
    
    // Default seeds if nothing is in localStorage
    return [
      { type: "carrot", name: "Carrot", icon: "CARROT", cost: 5, growthTime: 2, reward: 8, level: 1, upgradeCost: 40, bestSeason: "spring" as Season, weatherBonus: ["rainy"] },
      { type: "radish", name: "Radish", icon: "RADISH", cost: 13, growthTime: 3, reward: 13, level: 1, upgradeCost: 60, bestSeason: "fall" as Season, weatherBonus: ["cloudy", "windy"] },
      { type: "lettuce", name: "Broccoli", icon: "BROCCOLI", cost: 15, growthTime: 5, reward: 18, level: 1, upgradeCost: 75, bestSeason: "spring" as Season, weatherBonus: ["rainy", "cloudy"] },
      { type: "corn", name: "Corn", icon: "CORN", cost: 24, growthTime: 6, reward: 40, level: 1, upgradeCost: 100, bestSeason: "summer" as Season, weatherBonus: ["sunny", "rainy"] },
      { type: "eggplant", name: "Aubergine", icon: "AUBERGINE", cost: 28, growthTime: 7.5, reward: 42, level: 1, upgradeCost: 120, bestSeason: "summer" as Season, weatherBonus: ["sunny"] },
      { type: "tomato", name: "Dometos", icon: "TOMATO", cost: 30, growthTime: 8, reward: 50, level: 1, upgradeCost: 130, bestSeason: "summer" as Season, weatherBonus: ["sunny"] },
      { type: "strawberry", name: "Zucchini", icon: "ZUCCHINI", cost: 35, growthTime: 12, reward: 60, level: 1, upgradeCost: 140, bestSeason: "spring" as Season, weatherBonus: ["rainy"] },
      { type: "watermelon", name: "Pear", icon: "PEAR", cost: 80, growthTime: 18, reward: 150, level: 1, upgradeCost: 200, bestSeason: "fall" as Season, weatherBonus: ["sunny", "cloudy"] },
    ]
  })

  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null)

  const [cropsHarvested, setCropsHarvested] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("stats-crops-harvested")
      return saved ? Number.parseInt(saved) : 0
    }
    return 0
  })

  const [seedsPlanted, setSeedsPlanted] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("stats-seeds-planted")
      return saved ? Number.parseInt(saved) : 0
    }
    return 0
  })

  const [totalCoinsEarned, setTotalCoinsEarned] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("stats-coins-earned")
      return saved ? Number.parseInt(saved) : 0
    }
    return 0
  })

  // Add crop inventory state
  const [cropInventory, setCropInventory] = useState<CropInventory>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crop-inventory")
      if (saved) return JSON.parse(saved)
    }
    return {}
  })

  // Season and weather state
  const [currentSeason, setCurrentSeason] = useState<Season>("spring")
  const [currentWeather, setCurrentWeather] = useState<Weather>("sunny")
  const [seasonDay, setSeasonDay] = useState<number>(1)
  const seasonLength = 28 // 28 days per season

  // Define animal products
  const defaultAnimalProducts: AnimalProduct[] = [
    { type: "milk", name: "Milk", icon: "🥛", marketValue: 25 },
    { type: "egg", name: "Eggs", icon: "🥚", marketValue: 15 },
    { type: "wool", name: "Wool", icon: "🧶", marketValue: 40 }
  ];

  // Define animal state
  const [animals, setAnimals] = useState<Animal[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("animals");
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  // Define animal products state
  const [animalProducts] = useState<AnimalProduct[]>(defaultAnimalProducts);

  // Define animal product inventory
  const [animalProductInventory, setAnimalProductInventory] = useState<AnimalProductInventory>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("animal-product-inventory");
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  // Define craftable items
  const defaultCraftableItems: CraftableItem[] = [
    { 
      type: "bread",
      name: "Bread",
      icon: "🍞",
      ingredients: [{ type: "wheat", count: 1, isAnimalProduct: false }],
      marketValue: 15
    },
    { 
      type: "cheese",
      name: "Cheese",
      icon: "🧀",
      ingredients: [{ type: "milk", count: 1, isAnimalProduct: true }],
      marketValue: 30
    },
    { 
      type: "clothes",
      name: "Clothes",
      icon: "👕",
      ingredients: [{ type: "wool", count: 1, isAnimalProduct: true }],
      marketValue: 50
    }
  ];

  // State for craftable items
  const [craftableItems] = useState<CraftableItem[]>(defaultCraftableItems);

  // State for crafted item inventory
  const [craftedItemInventory, setCraftedItemInventory] = useState<CraftedItemInventory>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crafted-item-inventory");
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  // Define boosters
  const defaultBoosters: Booster[] = [
    {
      type: "basic-fertilizer",
      name: "Basic Fertilizer",
      icon: "🌱",
      cost: 20,
      description: "Increases crop yield by 25%",
      duration: 60, // 60 minutes
      effect: {
        type: "yield",
        multiplier: 1.25
      }
    },
    {
      type: "premium-fertilizer",
      name: "Premium Fertilizer",
      icon: "🌿",
      cost: 50,
      description: "Increases crop yield by 50%",
      duration: 120, // 120 minutes
      effect: {
        type: "yield",
        multiplier: 1.5
      }
    },
    {
      type: "growth-accelerator",
      name: "Growth Accelerator",
      icon: "⚡",
      cost: 35,
      description: "Speeds up growth by 30%",
      duration: 60, // 60 minutes
      effect: {
        type: "growth",
        multiplier: 0.7 // Multiply growth time by 0.7 (30% reduction)
      }
    },
    {
      type: "super-accelerator",
      name: "Super Accelerator",
      icon: "🔥",
      cost: 75,
      description: "Speeds up growth by 50%",
      duration: 120, // 120 minutes
      effect: {
        type: "growth",
        multiplier: 0.5 // Multiply growth time by 0.5 (50% reduction)
      }
    }
  ];

  // State for boosters
  const [boosters] = useState<Booster[]>(defaultBoosters);
  
  // State for owned boosters
  const [ownedBoosters, setOwnedBoosters] = useState<{ [key: string]: number }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("owned-boosters");
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  // State for boosted plots
  const [boostedPlots, setBoostedPlots] = useState<BoostedPlot[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("boosted-plots");
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  // --- ADD Profile State ---
  const [nickname, setNicknameState] = useState<string>('Nooter');
  const [bio, setBioState] = useState<string>('I love farming!');

  // Load profile from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNickname = localStorage.getItem('player-nickname');
      const savedBio = localStorage.getItem('player-bio');
      if (savedNickname) {
        setNicknameState(savedNickname);
      }
      if (savedBio) {
        setBioState(savedBio);
      }
    }
  }, []);

  // --- ADD Profile Setters ---
  const setNickname = (newName: string) => {
    console.log(`[GameContext] Setting nickname to: "${newName}"`); // Log input
    setNicknameState(newName);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem('player-nickname', newName); // Saves nickname
        // Try reading it back immediately (won't log, but ensures it tries)
        const verifySave = localStorage.getItem('player-nickname'); 
        console.log(`[GameContext] Saved nickname "${newName}" to localStorage. Verification: ${verifySave}`); 
      } catch (e) {
        console.error('[GameContext] Failed to save nickname to localStorage:', e); // Log error
      }
    }
  };

  const setBio = (newBio: string) => {
    console.log(`[GameContext] Setting bio to: "${newBio}"`); // Log input
    setBioState(newBio);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem('player-bio', newBio); // Saves bio
        // Try reading it back immediately
        const verifySave = localStorage.getItem('player-bio');
        console.log(`[GameContext] Saved bio "${newBio}" to localStorage. Verification: ${verifySave}`); 
      } catch (e) {
        console.error('[GameContext] Failed to save bio to localStorage:', e); // Log error
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Save all other state
      localStorage.setItem("farm-coins", JSON.stringify(farmCoins));
      localStorage.setItem("plots", JSON.stringify(plots))
      localStorage.setItem("farmSize", farmSize.toString())
      localStorage.setItem("seeds", JSON.stringify(seeds))
      localStorage.setItem("player-level", playerLevel.toString())
      localStorage.setItem("player-xp", playerXp.toString())
      localStorage.setItem("player-xp-next", playerXpToNext.toString())
      localStorage.setItem("stats-crops-harvested", cropsHarvested.toString())
      localStorage.setItem("stats-seeds-planted", seedsPlanted.toString())
      localStorage.setItem("stats-coins-earned", totalCoinsEarned.toString())
      localStorage.setItem("crop-inventory", JSON.stringify(cropInventory))
      localStorage.setItem("animals", JSON.stringify(animals))
      localStorage.setItem("animal-product-inventory", JSON.stringify(animalProductInventory))
      localStorage.setItem("crafted-item-inventory", JSON.stringify(craftedItemInventory))
      localStorage.setItem("owned-boosters", JSON.stringify(ownedBoosters))
      localStorage.setItem("boosted-plots", JSON.stringify(boostedPlots))

      // ---- ADD BACKUP SAVE FOR PROFILE ----
      try {
        localStorage.setItem('player-nickname', nickname);
        localStorage.setItem('player-bio', bio);
      } catch (e) {
        console.error('[GameContext] Failed to save profile in main effect:', e);
      }
      // ---- END BACKUP SAVE ----
    }
  }, [farmCoins, plots, farmSize, seeds, playerLevel, playerXp, playerXpToNext, cropsHarvested, seedsPlanted, totalCoinsEarned, cropInventory, animals, animalProductInventory, craftedItemInventory, ownedBoosters, boostedPlots,
    // Add nickname and bio as dependencies here for the backup save
    nickname, bio 
  ])

  // Add a welcome bonus for players
  useEffect(() => {
    // Only run on the client side
    if (typeof window === "undefined") return;
    
    // Check if we already gave a welcome bonus today
    const lastBonusDate = localStorage.getItem("last-welcome-bonus");
    const today = new Date().toDateString();
    
    if (lastBonusDate !== today) {
      // Wait a moment to let the UI load
      const timer = setTimeout(() => {
        // Add 200 coins as welcome bonus
        setFarmCoins(prev => prev + 200);
        addCoinsEarned(200);
        
        // Show a welcome message with the bonus
        toast.success("Welcome bonus: +200 coins!", {
          icon: "💰",
          duration: 4000
        });
        
        // Save today's date so bonus isn't given again today
        localStorage.setItem("last-welcome-bonus", today);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const incrementCropsHarvested = () => {
    setCropsHarvested(prev => prev + 1)
  }

  const incrementSeedsPlanted = () => {
    setSeedsPlanted(prev => prev + 1)
  }

  const addCoinsEarned = (amount: number) => {
    if (amount > 0) {
      setTotalCoinsEarned(prev => prev + amount)
    }
  }

  const addXp = (amount: number) => {
    if (amount <= 0) return;
    
    let newXp = playerXp + amount;
    let currentXpToNext = playerXpToNext;
    let currentLevel = playerLevel;
    let didLevelUp = false;
    
    // Check if player should level up
    if (newXp >= currentXpToNext) {
      currentLevel += 1;
      didLevelUp = true;
      newXp = newXp - currentXpToNext;
      currentXpToNext = Math.floor(currentXpToNext * 1.5);
    }
    
    // Apply level up rewards
    if (didLevelUp) {
      setPlayerLevel(currentLevel);
      setPlayerXpToNext(currentXpToNext);
      // Give coins as level up reward
      const levelReward = currentLevel * 10;
      setFarmCoins(prev => prev + levelReward);
      addCoinsEarned(levelReward);
      
      // Show level up notification if available
      if (typeof window !== "undefined") {
        toast.success(`Level Up! You are now level ${currentLevel}!`, {
          icon: '🏆',
          duration: 4000
        });
      }
    }
    
    setPlayerXp(newXp);
  };

  const addFarmCoins = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.warn('Invalid coin amount:', amount);
      return;
    }
    const roundedAmount = Math.round(amount * 100) / 100;
    if (roundedAmount === 0) return;
    setFarmCoins(prevCoins => {
      // Prevent negative balance
      const newTotalRaw = prevCoins + roundedAmount;
      const newTotal = Math.round(Math.max(newTotalRaw, 0) * 100) / 100;
      // Update earned stats only for positive increments
      if (roundedAmount > 0) {
        const newEarned = totalCoinsEarned + roundedAmount;
        setTotalCoinsEarned(newEarned);
        // Show toast for significant earnings
        if (roundedAmount >= 50) {
          setTimeout(() => {
            toast.success(`Wow! You earned ${roundedAmount.toFixed(2)} coins!`);
          }, 0);
        } else if (roundedAmount >= 10) {
          setTimeout(() => {
            toast.success(`You earned ${roundedAmount.toFixed(2)} coins!`);
          }, 0);
        }
        // Save to storage
        if (typeof window !== 'undefined') {
          localStorage.setItem('farm-coins', JSON.stringify(newTotal));
          localStorage.setItem('total-coins-earned', JSON.stringify(newEarned));
        }
      } else {
        // Deduction: save new balance only
        if (typeof window !== 'undefined') {
          localStorage.setItem('farm-coins', JSON.stringify(newTotal));
        }
      }
      return newTotal;
    });
  }

  const expandFarm = () => {
    if (farmSize >= 6 || farmCoins < 100) return
    
    // Check if player level meets requirements for expanding
    const requiredLevel = farmSize + 2; // Level 3 for 4×4, Level 4 for 5×5, Level 5 for 6×6
    
    if (playerLevel < requiredLevel) {
      if (typeof window !== "undefined") {
        // Use toast if available in this context
        toast.error(`LEVEL LOCKED: You need to be level ${requiredLevel} to expand your farm! (${requiredLevel - playerLevel} more level${requiredLevel - playerLevel > 1 ? 's' : ''} needed)`, {
          duration: 5000,
          style: {
            background: '#300',
            color: '#fff',
            border: '1px solid #f00',
            padding: '16px',
            fontWeight: 'bold',
          },
          icon: '🔒',
        });
      }
      return;
    }
    
    setFarmSize((prev) => prev + 1)
    addFarmCoins(-100)
  }

  const upgradeSeed = (seedType: string) => {
    const seedIndex = seeds.findIndex((s) => s.type === seedType)
    if (seedIndex === -1) return
    const seed = seeds[seedIndex]
    if (seed.level >= 3 || farmCoins < seed.upgradeCost) return

    const newSeeds = [...seeds]
    newSeeds[seedIndex] = {
      ...seed,
      level: seed.level + 1,
      growthTime: Math.max(seed.growthTime * 0.8, 0.5),
      reward: Math.floor(seed.reward * 1.2),
      upgradeCost: Math.floor(seed.upgradeCost * 1.5),
      bestSeason: seed.bestSeason,
      weatherBonus: seed.weatherBonus
    }
    setSeeds(newSeeds)
    addFarmCoins(-seed.upgradeCost)
    if (selectedSeed?.type === seedType) setSelectedSeed(newSeeds[seedIndex])
  }

  // Add crop to inventory
  const addCropToInventory = (cropType: string, adjustedValue?: number, plotIndex?: number) => {
    console.log(`Adding ${cropType} to inventory with adjusted value:`, adjustedValue);
    
    const seed = seeds.find(s => s.type === cropType);
    if (!seed) {
      console.error(`Seed not found for crop type: ${cropType}`);
      return;
    }
    
    // Check for active yield boosters on this plot
    let yieldMultiplier = 1.0;
    if (plotIndex !== undefined) {
      const activeBoosters = getPlotBoosters(plotIndex);
      
      for (const boostedPlot of activeBoosters) {
        const booster = boosters.find(b => b.type === boostedPlot.boosterType);
        if (booster && booster.effect.type === "yield") {
          yieldMultiplier *= booster.effect.multiplier;
        }
      }
    }
    
    setCropInventory(prev => {
      const updatedInventory = { ...prev };
      let marketValue = adjustedValue !== undefined ? adjustedValue : Math.floor(seed.reward * 1.2);
      
      // Apply yield booster if available
      if (yieldMultiplier > 1.0) {
        marketValue = Math.floor(marketValue * yieldMultiplier);
      }
      
      if (updatedInventory[cropType]) {
        // Increment count if crop already exists
        updatedInventory[cropType] = {
          ...updatedInventory[cropType],
          count: updatedInventory[cropType].count + 1,
          marketValue: marketValue // Update the market value with the new adjusted value
        };
      } else {
        // Add new crop entry
        updatedInventory[cropType] = {
          count: 1,
          marketValue: marketValue
        };
      }
      
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("crop-inventory", JSON.stringify(updatedInventory));
      }
      
      return updatedInventory;
    });
    
    // If a booster affected the yield, show a notification
    if (plotIndex !== undefined && yieldMultiplier > 1.0) {
      if (typeof window !== "undefined") {
        toast.success(`Booster increased crop yield by ${Math.floor((yieldMultiplier - 1) * 100)}%!`, {
          duration: 3000
        });
      }
    }
  };
  
  // Sell a crop from inventory
  const sellCrop = (cropType: string, amount: number = 1) => {
    setCropInventory(prev => {
      if (!prev[cropType] || prev[cropType].count < amount) return prev;
      
      const saleValue = prev[cropType].marketValue * amount;
      addFarmCoins(saleValue);
      
      const newCount = prev[cropType].count - amount;
      const newInventory = { ...prev };
      
      if (newCount <= 0) {
        delete newInventory[cropType];
      } else {
        newInventory[cropType] = {
          ...prev[cropType],
          count: newCount
        };
      }
      
      return newInventory;
    });
  };
  
  // Sell all crops from inventory
  const sellAllCrops = () => {
    let totalValue = 0;
    
    Object.entries(cropInventory).forEach(([cropType, crop]) => {
      totalValue += crop.marketValue * crop.count;
    });
    
    if (totalValue > 0) {
      addFarmCoins(totalValue);
      setCropInventory({});
    }
  };

  const resetGame = () => {
    setFarmCoins(100)
    setFarmSize(3)
    setPlots(
      Array(25)
        .fill(null)
        .map(() => ({ status: "empty" as "empty" | "growing" | "ready", crop: null, plantedAt: null, readyAt: null }))
    )
    
    // Make sure seeds have correct seasons
    const initialSeeds: Seed[] = [
      { type: "carrot", name: "Carrot", icon: "CARROT", cost: 5, growthTime: 2, reward: 8, level: 1, upgradeCost: 40, bestSeason: "spring" as Season, weatherBonus: ["rainy"] },
      { type: "radish", name: "Radish", icon: "RADISH", cost: 13, growthTime: 3, reward: 13, level: 1, upgradeCost: 60, bestSeason: "fall" as Season, weatherBonus: ["cloudy", "windy"] },
      { type: "lettuce", name: "Broccoli", icon: "BROCCOLI", cost: 15, growthTime: 5, reward: 18, level: 1, upgradeCost: 75, bestSeason: "spring" as Season, weatherBonus: ["rainy", "cloudy"] },
      { type: "corn", name: "Corn", icon: "CORN", cost: 24, growthTime: 6, reward: 40, level: 1, upgradeCost: 100, bestSeason: "summer" as Season, weatherBonus: ["sunny", "rainy"] },
      { type: "eggplant", name: "Aubergine", icon: "AUBERGINE", cost: 28, growthTime: 7.5, reward: 42, level: 1, upgradeCost: 120, bestSeason: "summer" as Season, weatherBonus: ["sunny"] },
      { type: "tomato", name: "Dometos", icon: "TOMATO", cost: 30, growthTime: 8, reward: 50, level: 1, upgradeCost: 130, bestSeason: "summer" as Season, weatherBonus: ["sunny"] },
      { type: "strawberry", name: "Zucchini", icon: "ZUCCHINI", cost: 35, growthTime: 12, reward: 60, level: 1, upgradeCost: 140, bestSeason: "spring" as Season, weatherBonus: ["rainy"] },
      { type: "watermelon", name: "Pear", icon: "PEAR", cost: 80, growthTime: 18, reward: 150, level: 1, upgradeCost: 200, bestSeason: "fall" as Season, weatherBonus: ["sunny", "cloudy"] },
    ];
    
    setSeeds(initialSeeds);
    
    // Log the seed data to confirm it's correct
    console.log("Reset game: Setting seeds with summer crops:", 
      initialSeeds.filter(seed => seed.bestSeason === "summer"));
    
    if (typeof window !== "undefined") {
      // Make sure localStorage is updated with correct seed data
      localStorage.setItem("seeds", JSON.stringify(initialSeeds));
    }
    
    setSelectedSeed(null)
    setPlayerLevel(1)
    setPlayerXp(0)
    setPlayerXpToNext(100)
    setCropsHarvested(0)
    setSeedsPlanted(0)
    setTotalCoinsEarned(0)
    setCropInventory({})
    setCurrentSeason("spring")
    setCurrentWeather("sunny")
    setSeasonDay(1)
    
    // Reset animals
    setAnimals([]);
    setAnimalProductInventory({});
  }

  const advanceDay = () => {
    let newDay = seasonDay + 1;
    let newSeason = currentSeason;
    
    // If we've reached the end of the season, move to the next one
    if (newDay > seasonLength) {
      newDay = 1;
      
      // Cycle through seasons
      if (currentSeason === "spring") newSeason = "summer";
      else if (currentSeason === "summer") newSeason = "fall";
      else if (currentSeason === "fall") newSeason = "winter";
      else newSeason = "spring";
      
      setCurrentSeason(newSeason);
      
      // Display season change notification
      if (typeof window !== "undefined") {
        toast.success(`${newSeason.charAt(0).toUpperCase() + newSeason.slice(1)} has begun!`);
      }
    }
    
    setSeasonDay(newDay);
    
    // Random chance to change weather
    const weatherChances = {
      spring: { sunny: 0.4, rainy: 0.4, cloudy: 0.1, windy: 0.05, stormy: 0.05 },
      summer: { sunny: 0.6, rainy: 0.1, cloudy: 0.1, windy: 0.1, stormy: 0.1 },
      fall: { sunny: 0.3, rainy: 0.2, cloudy: 0.3, windy: 0.15, stormy: 0.05 },
      winter: { sunny: 0.2, rainy: 0.05, cloudy: 0.4, windy: 0.2, stormy: 0.15 }
    };
    
    const seasonWeatherChances = weatherChances[newSeason];
    const random = Math.random();
    let cumulativeChance = 0;
    
    let newWeather: Weather = "sunny";
    
    for (const [weather, chance] of Object.entries(seasonWeatherChances)) {
      cumulativeChance += chance;
      if (random <= cumulativeChance) {
        newWeather = weather as Weather;
        break;
      }
    }
    
    setCurrentWeather(newWeather);
  }

  // Buy animal function
  const buyAnimal = (animalType: string) => {
    // Define available animals
    const availableAnimals = [
      { 
        type: "cow", name: "Cow", icon: "🐄", cost: 200, 
        productType: "milk", productionTime: 120, productionAmount: 1, 
        lastCollected: null, readyAt: null, happiness: 100, fed: true 
      },
      { 
        type: "chicken", name: "Chicken", icon: "🐔", cost: 100, 
        productType: "egg", productionTime: 60, productionAmount: 2, 
        lastCollected: null, readyAt: null, happiness: 100, fed: true 
      },
      { 
        type: "sheep", name: "Sheep", icon: "🐑", cost: 250, 
        productType: "wool", productionTime: 180, productionAmount: 1, 
        lastCollected: null, readyAt: null, happiness: 100, fed: true 
      }
    ];
    
    // Find the animal to buy
    const animalToBuy = availableAnimals.find(animal => animal.type === animalType);
    
    if (!animalToBuy) return;
    
    // Check if player has enough coins
    if (farmCoins < animalToBuy.cost) {
      if (typeof window !== "undefined") {
        toast.error(`Not enough coins to buy a ${animalToBuy.name}!`, {
          duration: 3000
        });
      }
      return;
    }
    
    // Add the animal to the farm
    const now = Date.now();
    const newAnimal = {
      ...animalToBuy,
      lastCollected: now,
      readyAt: now + (animalToBuy.productionTime * 60 * 1000)
    };
    
    setAnimals(prev => [...prev, newAnimal]);
    addFarmCoins(-animalToBuy.cost);
    
    // Success notification
    if (typeof window !== "undefined") {
      toast.success(`Purchased a ${animalToBuy.name} for ${animalToBuy.cost} coins!`, {
        duration: 3000
      });
    }
    
    // Give XP for buying a new animal
    addXp(animalToBuy.cost / 10);
  };

  // Feed animal function
  const feedAnimal = (animalIndex: number) => {
    if (animalIndex < 0 || animalIndex >= animals.length) return;
    
    // Check if animal needs feeding
    if (animals[animalIndex].fed) {
      if (typeof window !== "undefined") {
        toast(`Your ${animals[animalIndex].name} is already fed!`, {
          duration: 3000,
          icon: 'ℹ️',
        });
      }
      return;
    }
    
    // Feed costs 10 coins
    if (farmCoins < 10) {
      if (typeof window !== "undefined") {
        toast.error(`You need 10 coins to feed your ${animals[animalIndex].name}!`, {
          duration: 3000
        });
      }
      return;
    }
    
    // Update animal
    setAnimals(prev => {
      const updatedAnimals = [...prev];
      updatedAnimals[animalIndex] = {
        ...updatedAnimals[animalIndex],
        fed: true,
        happiness: Math.min(100, updatedAnimals[animalIndex].happiness + 20)
      };
      return updatedAnimals;
    });
    
    addFarmCoins(-10);
    
    // Success notification
    if (typeof window !== "undefined") {
      toast.success(`Fed your ${animals[animalIndex].name}! Happiness increased.`, {
        duration: 3000
      });
    }
    
    // Give a small amount of XP for feeding
    addXp(2);
  };

  // Collect animal product function
  const collectAnimalProduct = (animalIndex: number) => {
    if (animalIndex < 0 || animalIndex >= animals.length) return;
    
    const animal = animals[animalIndex];
    const now = Date.now();
    
    // Check if product is ready
    if (!animal.readyAt || now < animal.readyAt) {
      if (typeof window !== "undefined") {
        toast(`Your ${animal.name} isn't ready to produce yet!`, {
          duration: 3000,
          icon: 'ℹ️',
        });
      }
      return;
    }
    
    // Add product to inventory
    const product = animalProducts.find(p => p.type === animal.productType);
    if (!product) return;
    
    // Calculate adjusted value based on happiness
    const happinessMultiplier = animal.happiness / 100;
    const adjustedAmount = Math.max(1, Math.round(animal.productionAmount * happinessMultiplier));
    
    setAnimalProductInventory(prev => {
      const updatedInventory = { ...prev };
      
      if (updatedInventory[animal.productType]) {
        // Increment count if product already exists
        updatedInventory[animal.productType] = {
          ...updatedInventory[animal.productType],
          count: updatedInventory[animal.productType].count + adjustedAmount
        };
      } else {
        // Add new product entry
        updatedInventory[animal.productType] = {
          count: adjustedAmount,
          marketValue: product.marketValue
        };
      }
      
      return updatedInventory;
    });
    
    // Reset animal production timer
    setAnimals(prev => {
      const updatedAnimals = [...prev];
      const newReadyAt = now + (animal.productionTime * 60 * 1000);
      
      updatedAnimals[animalIndex] = {
        ...updatedAnimals[animalIndex],
        lastCollected: now,
        readyAt: newReadyAt,
        // Animal gets hungry after producing
        fed: false,
        // Happiness decreases a bit each time if not at max
        happiness: animal.happiness > 80 ? animal.happiness - 5 : animal.happiness
      };
      
      return updatedAnimals;
    });
    
    // Success notification
    if (typeof window !== "undefined") {
      toast.success(`Collected ${adjustedAmount} ${product.name} from your ${animal.name}!`, {
        duration: 3000,
        icon: product.icon
      });
    }
    
    // Give XP for collecting products
    addXp(5);
  };

  // Sell animal product function
  const sellAnimalProduct = (productType: string, count: number = 1) => {
    setAnimalProductInventory(prev => {
      if (!prev[productType] || prev[productType].count < count) return prev;
      
      const saleValue = prev[productType].marketValue * count;
      addFarmCoins(saleValue);
      
      const newCount = prev[productType].count - count;
      const newInventory = { ...prev };
      
      if (newCount <= 0) {
        delete newInventory[productType];
      } else {
        newInventory[productType] = {
          ...prev[productType],
          count: newCount
        };
      }
      
      return newInventory;
    });
  };

  // Sell all animal products function
  const sellAllAnimalProducts = () => {
    let totalValue = 0;
    
    Object.entries(animalProductInventory).forEach(([productType, product]) => {
      totalValue += product.marketValue * product.count;
    });
    
    if (totalValue > 0) {
      addFarmCoins(totalValue);
      setAnimalProductInventory({});
      
      // Success notification
      if (typeof window !== "undefined") {
        toast.success(`Sold all animal products for ${totalValue} coins!`, {
          duration: 3000
        });
      }
    }
  };

  // Update animals when time passes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let animalStateChanged = false;
      
      setAnimals(prev => {
        const updatedAnimals = prev.map(animal => {
          // Decrease happiness if animal is not fed
          if (!animal.fed && animal.happiness > 0) {
            animalStateChanged = true;
            return {
              ...animal,
              happiness: Math.max(0, animal.happiness - 1)
            };
          }
          return animal;
        });
        
        return animalStateChanged ? updatedAnimals : prev;
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Craft an item
  const craftItem = (itemType: string) => {
    const item = craftableItems.find(i => i.type === itemType);
    if (!item) {
      console.error(`Item not found for crafting: ${itemType}`);
      return;
    }
    
    // Check if we have all the required ingredients
    let canCraft = true;
    let missingDetails: { name: string, type: string, have: number, need: number }[] = [];
    
    for (const ingredient of item.ingredients) {
      if (ingredient.isAnimalProduct) {
        // Check animal product inventory
        const productInventory = animalProductInventory[ingredient.type];
        const currentAmount = productInventory ? productInventory.count : 0;
        
        if (currentAmount < ingredient.count) {
          canCraft = false;
          const product = animalProducts.find(p => p.type === ingredient.type);
          missingDetails.push({
            name: product ? product.name : ingredient.type,
            type: ingredient.type,
            have: currentAmount,
            need: ingredient.count
          });
        }
      } else {
        // Check crop inventory
        const cropInv = cropInventory[ingredient.type];
        const currentAmount = cropInv ? cropInv.count : 0;
        
        if (currentAmount < ingredient.count) {
          canCraft = false;
          const seed = seeds.find(s => s.type === ingredient.type);
          missingDetails.push({
            name: seed ? seed.name : ingredient.type,
            type: ingredient.type,
            have: currentAmount,
            need: ingredient.count
          });
        }
      }
    }
    
    if (!canCraft) {
      // Show clear error notification for missing ingredients
      if (typeof window !== "undefined") {
        // Create a detailed message
        const missingItemsText = missingDetails.map(item => 
          `${item.name}: ${item.have}/${item.need} (Need ${item.need - item.have} more)`
        ).join('\n');
        
        // Use the standard toast error
        toast.error(`Missing ingredients for ${item.name}: ${missingItemsText}`, {
          duration: 5000
        });
      }
      return;
    }
    
    // Deduct ingredients from inventories
    for (const ingredient of item.ingredients) {
      if (ingredient.isAnimalProduct) {
        // Deduct from animal product inventory
        setAnimalProductInventory(prev => {
          const updatedInventory = { ...prev };
          const newCount = updatedInventory[ingredient.type].count - ingredient.count;
          
          if (newCount <= 0) {
            delete updatedInventory[ingredient.type];
          } else {
            updatedInventory[ingredient.type] = {
              ...updatedInventory[ingredient.type],
              count: newCount
            };
          }
          
          return updatedInventory;
        });
      } else {
        // Deduct from crop inventory
        setCropInventory(prev => {
          const updatedInventory = { ...prev };
          const newCount = updatedInventory[ingredient.type].count - ingredient.count;
          
          if (newCount <= 0) {
            delete updatedInventory[ingredient.type];
          } else {
            updatedInventory[ingredient.type] = {
              ...updatedInventory[ingredient.type],
              count: newCount
            };
          }
          
          return updatedInventory;
        });
      }
    }
    
    // Add crafted item to inventory
    setCraftedItemInventory(prev => {
      const updatedInventory = { ...prev };
      
      if (updatedInventory[itemType]) {
        // Increment count if item already exists
        updatedInventory[itemType] = {
          ...updatedInventory[itemType],
          count: updatedInventory[itemType].count + 1
        };
      } else {
        // Add new item entry
        updatedInventory[itemType] = {
          count: 1,
          marketValue: item.marketValue
        };
      }
      
      return updatedInventory;
    });
    
    // Success notification
    if (typeof window !== "undefined") {
      toast.success(`Crafted ${item.name}!`, {
        duration: 3000,
        icon: item.icon
      });
    }
    
    // Give XP for crafting
    addXp(10);
  };
  
  // Sell crafted item
  const sellCraftedItem = (itemType: string, count: number = 1) => {
    setCraftedItemInventory(prev => {
      if (!prev[itemType] || prev[itemType].count < count) return prev;
      
      const item = craftableItems.find(i => i.type === itemType);
      if (!item) return prev;
      
      const saleValue = prev[itemType].marketValue * count;
      addFarmCoins(saleValue);
      addCoinsEarned(saleValue);
      
      const newCount = prev[itemType].count - count;
      const newInventory = { ...prev };
      
      if (newCount <= 0) {
        delete newInventory[itemType];
      } else {
        newInventory[itemType] = {
          ...prev[itemType],
          count: newCount
        };
      }
      
      // Success notification
      if (typeof window !== "undefined" && count > 0) {
        toast.success(`Sold ${count} ${item.name} for ${saleValue} coins!`, {
          duration: 3000
        });
      }
      
      return newInventory;
    });
  };
  
  // Sell all crafted items
  const sellAllCraftedItems = () => {
    let totalSale = 0;
    
    Object.entries(craftedItemInventory).forEach(([itemType, data]) => {
      const { count, marketValue } = data;
      totalSale += marketValue * count;
    });
    
    if (totalSale > 0) {
      addFarmCoins(totalSale);
      addCoinsEarned(totalSale);
      setCraftedItemInventory({});
      
      // Success notification
      if (typeof window !== "undefined") {
        toast.success(`Sold all crafted items for ${totalSale} coins!`, {
          duration: 3000
        });
      }
    }
  };

  // Buy booster function
  const buyBooster = (boosterType: string) => {
    const booster = boosters.find(b => b.type === boosterType);
    if (!booster) {
      console.error(`Booster not found: ${boosterType}`);
      return;
    }
    
    // Check if player has enough coins
    if (farmCoins < booster.cost) {
      if (typeof window !== "undefined") {
        toast.error(`Not enough coins to buy ${booster.name}!`, {
          duration: 3000
        });
      }
      return;
    }
    
    // Deduct coins and add booster to inventory
    addFarmCoins(-booster.cost);
    
    setOwnedBoosters(prev => {
      const updated = { ...prev };
      updated[boosterType] = (updated[boosterType] || 0) + 1;
      return updated;
    });
    
    // Success notification
    if (typeof window !== "undefined") {
      toast.success(`Purchased ${booster.name}!`, {
        duration: 3000
      });
    }
    
    // Give XP for purchasing
    addXp(5);
  };
  
  // Apply booster to plot
  const applyBooster = (plotIndex: number, boosterType: string) => {
    // Check if player owns this booster
    if (!ownedBoosters[boosterType] || ownedBoosters[boosterType] <= 0) {
      if (typeof window !== "undefined") {
        toast.error(`You don't have any of this booster!`, {
          duration: 3000
        });
      }
      return;
    }
    
    // Check if plot exists and has a crop growing
    if (plotIndex < 0 || plotIndex >= plots.length || plots[plotIndex].status !== "growing") {
      if (typeof window !== "undefined") {
        toast.error(`Cannot apply booster to this plot. It must have a growing crop.`, {
          duration: 3000
        });
      }
      return;
    }
    
    const booster = boosters.find(b => b.type === boosterType);
    if (!booster) return;
    
    // Calculate expiration time
    const now = Date.now();
    const expiresAt = now + (booster.duration * 60 * 1000);
    
    // Apply booster effect to plot
    if (booster.effect.type === "growth" && plots[plotIndex].readyAt) {
      // Recalculate growth time for the plot
      const currentTimeRemaining = plots[plotIndex].readyAt! - now;
      const newTimeRemaining = currentTimeRemaining * booster.effect.multiplier;
      const newReadyAt = now + newTimeRemaining;
      
      setPlots(prev => {
        const updatedPlots = [...prev];
        updatedPlots[plotIndex] = {
          ...updatedPlots[plotIndex],
          readyAt: newReadyAt
        };
        return updatedPlots;
      });
    }
    
    // Add to boosted plots
    setBoostedPlots(prev => [
      ...prev.filter(bp => bp.plotIndex !== plotIndex || bp.boosterType !== boosterType),
      { plotIndex, boosterType, appliedAt: now, expiresAt }
    ]);
    
    // Remove from inventory
    setOwnedBoosters(prev => {
      const updated = { ...prev };
      updated[boosterType] = prev[boosterType] - 1;
      if (updated[boosterType] <= 0) {
        delete updated[boosterType];
      }
      return updated;
    });
    
    // Success notification
    if (typeof window !== "undefined") {
      toast.success(`Applied ${booster.name} to your crop!`, {
        duration: 3000
      });
    }
    
    // Give XP for using a booster
    addXp(3);
  };
  
  // Get all boosters applied to a plot
  const getPlotBoosters = (plotIndex: number): BoostedPlot[] => {
    const now = Date.now();
    
    // Create a new array with only non-expired boosters
    const updatedBoostedPlots = boostedPlots.filter(bp => bp.expiresAt > now);
    
    // If we found any expired boosters, update the state
    if (updatedBoostedPlots.length !== boostedPlots.length) {
      console.log(`Cleaning up ${boostedPlots.length - updatedBoostedPlots.length} expired boosters`);
      setBoostedPlots(updatedBoostedPlots);
    }
    
    // Return active boosters for this plot
    return updatedBoostedPlots.filter(bp => bp.plotIndex === plotIndex);
  };
  
  // Modify resetGame to also reset boosters
  const resetGameWithBoosters = () => {
    // ... existing reset code ...
    
    // Reset boosters
    setOwnedBoosters({});
    setBoostedPlots([]);
  };

  return (
    <GameContext.Provider
      value={{
        farmCoins,
        addFarmCoins,
        setFarmCoins,
        playerLevel,
        playerXp,
        playerXpToNext,
        playerName,
        addXp,
        plots,
        setPlots,
        farmSize,
        expandFarm,
        selectedSeed,
        setSelectedSeed,
        seeds,
        upgradeSeed,
        resetGame: resetGameWithBoosters,
        cropsHarvested,
        seedsPlanted,
        totalCoinsEarned,
        incrementCropsHarvested,
        incrementSeedsPlanted,
        addCoinsEarned,
        cropInventory,
        addCropToInventory,
        sellCrop,
        sellAllCrops,
        currentSeason,
        setCurrentSeason,
        currentWeather,
        setCurrentWeather,
        seasonDay,
        advanceDay,
        seasonLength,
        animals,
        animalProducts,
        animalProductInventory,
        buyAnimal,
        feedAnimal,
        collectAnimalProduct,
        sellAnimalProduct,
        sellAllAnimalProducts,
        craftableItems,
        craftedItemInventory,
        craftItem,
        sellCraftedItem,
        sellAllCraftedItems,
        boosters,
        boostedPlots,
        buyBooster,
        applyBooster,
        getPlotBoosters,
        ownedBoosters,
        // --- ADD Profile Values ---
        nickname, 
        setNickname,
        bio,
        setBio,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}