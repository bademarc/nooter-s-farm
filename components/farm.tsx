"use client";

import React, { useState, useEffect, useContext } from "react";
import { GameContext } from "@/context/game-context";
import { FarmPlot } from "@/components/farm-plot";
import { SeedSelector } from "@/components/seed-selector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import { 
  Cloud, 
  CloudRain, 
  Coins, 
  Sprout, 
  Sun, 
  Trophy, 
  Users, 
  Wallet, 
  ShoppingBag,
  Sparkles,
  Shovel,
  CircleSlash,
  CircleCheck,
  Calendar,
  ArrowRightLeft,
  User,
  RefreshCwIcon,
  CheckIcon,
  LockIcon,
  CircleDollarSign,
  Store,
  CloudLightning,
  Wind,
  Home,
  Cog,
  Settings,
  Hammer,
  Rocket,
  Shield
} from "lucide-react";
import { TokenSwap } from "@/components/token-swap";
import { Switch } from "@/components/ui/switch";
import dynamic from 'next/dynamic';
import DynamicWrapper from '@/components/dynamic-wrapper';

// Import FarmGame with SSR disabled and proper loading state
const FarmGame = dynamic(() => import('./farm-game/FarmGame'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex items-center justify-center bg-black/20 border border-white/10">
      <div className="text-white text-center">
        <div className="mb-4">Loading farm defense game...</div>
        <div className="text-sm text-white/60">Please wait while we prepare your defenses</div>
      </div>
    </div>
  )
});

// Use the actual Plot interface from game-context
interface Plot {
  status: "empty" | "growing" | "ready";
  crop: string | null;
  plantedAt: number | null;
  readyAt: number | null;
}

// Define simplified weather type
type Weather = "sunny" | "rainy" | "cloudy" | "windy" | "stormy";

// Define the daily task interface
interface DailyTask {
  current: number;
  target: number;
  completed: boolean;
  reward: number;
  lastCompleted: string | null;
}

// Define the daily tasks structure
interface DailyTasks {
  seedsPlanted: DailyTask;
  coinsEarned: DailyTask;
}

// Define interfaces for the defend farm game
interface Enemy {
  id: string;
  type: 'rabbit' | 'bird' | 'deer' | 'boar';
  health: number;
  posX: number;
  posY: number;
  speed: number;
  isActive: boolean;
}

interface Defense {
  id: string;
  type: 'scarecrow' | 'dog' | 'trap' | 'fence';
  posX: number;
  posY: number;
  range: number;
  isActive: boolean;
}

interface DefendGameState {
  isActive: boolean;
  wave: number;
  day: number;
  score: number;
  lives: number;
  farmCoinsEarned: number;
  enemies: Enemy[];
  defenses: Defense[];
  isPaused: boolean;
  gameOverStatus: boolean;
}

type EnemyType = 'rabbit' | 'bird' | 'deer' | 'boar';
type DefenseType = 'scarecrow' | 'dog' | 'trap' | 'fence';

interface EnemyTypeInfo {
  name: string;
  icon: string;
  health: number;
  speed: number;
  damage: number;
  value: number;
  description: string;
}

interface DefenseTypeInfo {
  name: string;
  icon: string;
  cost: number;
  range: number;
  effectiveness: Record<EnemyType, number>;
  description: string;
}

export function Farm() {
  const { 
    plots: gamePlots, 
    setPlots: setGamePlots, 
    farmCoins,
    addFarmCoins,
    seeds,
    selectedSeed,
    setSelectedSeed,
    playerLevel,
    playerXp,
    playerXpToNext,
    farmSize,
    expandFarm,
    cropsHarvested,
    seedsPlanted,
    totalCoinsEarned,
    incrementCropsHarvested,
    incrementSeedsPlanted,
    addCropToInventory,
    cropInventory,
    sellCrop,
    sellAllCrops,
    currentSeason,
    setCurrentSeason,
    currentWeather,
    setCurrentWeather,
    seasonDay,
    advanceDay,
    seasonLength,
    // Animal-related values
    animals,
    animalProducts,
    animalProductInventory,
    buyAnimal,
    feedAnimal,
    collectAnimalProduct,
    sellAnimalProduct,
    sellAllAnimalProducts,
    // Crafting-related values
    craftableItems,
    craftedItemInventory,
    craftItem,
    sellCraftedItem,
    sellAllCraftedItems,
    // Booster-related values
    boosters,
    boostedPlots,
    buyBooster,
    applyBooster,
    getPlotBoosters,
    ownedBoosters,
    addCoinsEarned
  } = useContext(GameContext);
  
  // Add debug logging for seasonal crops
  useEffect(() => {
    console.log("Current season:", currentSeason);
    console.log("Seeds with current season:", seeds.filter(seed => seed.bestSeason === currentSeason));
    console.log("All seeds:", seeds);
  }, [currentSeason, seeds]);
  
  const [activeTab, setActiveTab] = useState<"farm" | "quests" | "market" | "swap" | "social" | "profile" | "animals" | "crafting" | "boosters" | "defend">("farm");
  const [showParticles, setShowParticles] = useState(false);
  const [harvestAnimation, setHarvestAnimation] = useState<{
    plotIndex: number;
    amount: number;
  } | null>(null);
  
  // User profile state
  const [nickname, setNickname] = useState("Nooter");
  const [bio, setBio] = useState("I love farming!");
  const [editingProfile, setEditingProfile] = useState(false);
  // Add a state for forcing rerenders
  const [profileVersion, setProfileVersion] = useState(0);
  
  // Function to save profile data
  const saveProfileData = (newNickname: string, newBio: string) => {
    // Validate inputs
    if (!newNickname.trim()) {
      toast.error("Nickname cannot be empty!", {
        style: {
          background: '#300',
          color: '#fff',
          padding: '16px',
          fontWeight: 'bold',
        },
        duration: 3000,
      });
      return false;
    }

    if (!newBio.trim()) {
      toast.error("Bio cannot be empty!", {
        style: {
          background: '#300',
          color: '#fff',
          padding: '16px',
          fontWeight: 'bold',
        },
        duration: 3000,
      });
      return false;
    }
    
    console.log("SAVING PROFILE:", { newNickname, newBio });
    
    // Update state
    setNickname(newNickname);
    setBio(newBio);
    
    // Force rerender of all components using profile data
    setProfileVersion(v => v + 1);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('player-nickname', newNickname);
        localStorage.setItem('player-bio', newBio);
        console.log('Profile saved to localStorage:', { nickname: newNickname, bio: newBio });
        
        // Verify it was saved correctly
        const savedNickname = localStorage.getItem('player-nickname');
        const savedBio = localStorage.getItem('player-bio');
        console.log('Verification - Read from localStorage:', { 
          nickname: savedNickname, 
          bio: savedBio 
        });
      } catch (error) {
        console.error('Error saving profile to localStorage:', error);
        toast.error("Error saving profile! Please try again.");
        return false;
      }
    }
    
    // Show success notification
    toast.success("Profile updated successfully!", {
      icon: '👨‍🌾',
      style: {
        background: '#030',
        color: '#fff',
        padding: '16px',
        fontWeight: 'bold',
      },
      duration: 3000,
    });
    
    return true;
  };
  
  // Daily tasks tracking with proper interface
  const [dailyTasks, setDailyTasks] = useState<DailyTasks>({
    seedsPlanted: {
      current: 0,
      target: 5,
      completed: false,
      reward: 20,
      lastCompleted: null
    },
    coinsEarned: {
      current: 0,
      target: 100,
      completed: false,
      reward: 15,
      lastCompleted: null
    }
  });
  
  // Season and weather visual effects
  const weatherEffects = {
    sunny: { 
      icon: <Sun className="text-amber-500" />, 
      label: "Sunny", 
      bgClass: "bg-gradient-to-b from-sky-400 to-blue-500" 
    },
    rainy: { 
      icon: <CloudRain className="text-blue-500" />, 
      label: "Rainy", 
      bgClass: "bg-gradient-to-b from-gray-400 to-slate-600" 
    },
    cloudy: { 
      icon: <Cloud className="text-gray-400" />, 
      label: "Cloudy", 
      bgClass: "bg-gradient-to-b from-gray-300 to-slate-400" 
    },
    windy: { 
      icon: <Wind className="text-blue-300" />, 
      label: "Windy", 
      bgClass: "bg-gradient-to-b from-blue-200 to-blue-400" 
    },
    stormy: { 
      icon: <CloudLightning className="text-indigo-400" />, 
      label: "Stormy", 
      bgClass: "bg-gradient-to-b from-indigo-500 to-purple-700" 
    }
  };
  
  const seasonColors = {
    spring: "text-green-400",
    summer: "text-yellow-500",
    fall: "text-orange-500",
    winter: "text-blue-300"
  };
  
  const seasonIcons = {
    spring: <Sprout className={`${seasonColors.spring}`} />,
    summer: <Sun className={`${seasonColors.summer}`} />,
    fall: <Cloud className={`${seasonColors.fall}`} />,
    winter: <CloudRain className={`${seasonColors.winter}`} />
  };
  
  // XP display with gain animation
  const [xpGainAnimation, setXpGainAnimation] = useState({ amount: 0, show: false });
  
  // Load player data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDailyTasks = localStorage.getItem('daily-tasks');
      
      // Check if daily tasks need resetting (new day)
      const lastResetDate = localStorage.getItem('daily-tasks-reset-date');
      const today = new Date().toDateString();
      
      if (!lastResetDate || lastResetDate !== today) {
        // Reset daily tasks for a new day
        const resetTasks = {
          seedsPlanted: {
            current: 0,
            target: 5,
            completed: false,
            reward: 20,
            lastCompleted: null
          },
          coinsEarned: {
            current: 0,
            target: 100,
            completed: false,
            reward: 15,
            lastCompleted: null
          }
        };
        
        setDailyTasks(resetTasks);
        
        // Save the reset date and reset tasks
        localStorage.setItem('daily-tasks-reset-date', today);
        localStorage.setItem('daily-tasks', JSON.stringify(resetTasks));
      } else if (savedDailyTasks) {
        // Only load saved tasks if it's still the same day
        setDailyTasks(JSON.parse(savedDailyTasks));
      }
    }
  }, []);
  
  // Save daily tasks to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('daily-tasks', JSON.stringify(dailyTasks));
    }
  }, [dailyTasks]);
  
  // Rain animation component for rainy weather
  const RainEffect = () => {
    if (currentWeather !== "rainy") return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-0.5 h-10 bg-blue-400/30 rounded-full animate-rainfall"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${0.8 + Math.random() * 0.6}s`,
              animationDelay: `${Math.random() * 0.5}s`
            }}
          />
        ))}
      </div>
    );
  };
  
  // Sunshine animation for sunny weather
  const SunshineEffect = () => {
    if (currentWeather !== "sunny") return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none z-5">
        <div className="absolute top-5 right-5 origin-center">
          <div className="w-20 h-20 rounded-full bg-amber-300/20 animate-pulse-glow"></div>
          <div className="absolute inset-0 w-20 h-20">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-10 h-0.5 bg-amber-300/20 left-10 top-10 origin-left animate-pulse-slow"
                style={{
                  transform: `rotate(${i * 45}deg)`
                }}
              />
            ))}
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-2 h-2 bg-amber-300/10 rounded-full animate-sparkle"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDuration: `${2 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 0.5}s`
            }}
          />
        ))}
      </div>
    );
  };
  
  // Cloud animation for cloudy weather
  const CloudyEffect = () => {
    if (currentWeather !== "cloudy") return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none z-5">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-gray-300/10 rounded-full animate-float-clouds"
            style={{
              width: `${40 + Math.random() * 60}px`,
              height: `${30 + Math.random() * 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${10 + Math.random() * 30}%`,
              animationDuration: `${10 + Math.random() * 20}s`,
              animationDelay: `${Math.random() * -10}s`
            }}
          />
        ))}
      </div>
    );
  };
  
  // Wind animation component for windy weather
  const WindEffect = () => {
    if (currentWeather !== "windy") return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-20 h-0.5 bg-blue-300/20 rounded-full animate-wind"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${1 + Math.random() * 2}s`,
              animationDelay: `${Math.random() * 0.5}s`,
              transform: `rotate(${Math.random() * 20 - 10}deg)`
            }}
          />
        ))}
      </div>
    );
  };
  
  // Storm animation component for stormy weather
  const StormEffect = () => {
    if (currentWeather !== "stormy") return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Rain */}
        {[...Array(20)].map((_, i) => (
          <div 
            key={`rain-${i}`}
            className="absolute w-0.5 h-12 bg-blue-400/40 rounded-full animate-storm-rain"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${0.5 + Math.random() * 0.3}s`,
              animationDelay: `${Math.random() * 0.5}s`
            }}
          />
        ))}
        
        {/* Lightning flashes */}
        {[...Array(3)].map((_, i) => (
          <div 
            key={`lightning-${i}`}
            className="absolute inset-0 bg-white opacity-0 animate-lightning"
            style={{
              animationDelay: `${2 + Math.random() * 5}s`,
              animationDuration: '0.2s'
            }}
          />
        ))}
      </div>
    );
  };
  
  // Add the SnowEffect component after the StormEffect component
  // Snow animation component for winter season
  const SnowEffect = () => {
    if (currentSeason !== "winter") return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Small fast snowflakes in foreground */}
        {[...Array(30)].map((_, i) => (
          <div 
            key={`snow-small-${i}`}
            className="absolute bg-white/80 rounded-full animate-snow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              animationDuration: `${3 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.7 + Math.random() * 0.3
            }}
          />
        ))}
        
        {/* Medium snowflakes */}
        {[...Array(15)].map((_, i) => (
          <div 
            key={`snow-medium-${i}`}
            className="absolute bg-white/70 rounded-full animate-snow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 2}px`,
              height: `${2 + Math.random() * 2}px`,
              animationDuration: `${6 + Math.random() * 5}s`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.5 + Math.random() * 0.3,
              zIndex: 9
            }}
          />
        ))}
        
        {/* Large slow snowflakes in background */}
        {[...Array(8)].map((_, i) => (
          <div 
            key={`snow-large-${i}`}
            className="absolute bg-white/60 rounded-full animate-snow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${3 + Math.random() * 3}px`,
              height: `${3 + Math.random() * 3}px`,
              animationDuration: `${8 + Math.random() * 6}s`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.4 + Math.random() * 0.2,
              zIndex: 8
            }}
          />
        ))}
      </div>
    );
  };
  
  // Growth timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updatedAnyPlot = gamePlots.some((plot) => {
        return plot.status === "growing" && plot.readyAt && plot.readyAt <= now;
      });

      if (updatedAnyPlot) {
        // Create a new array with updated plots to avoid type issues
        const updatedPlots = gamePlots.map((plot) => {
          if (
            plot.status === "growing" &&
            plot.readyAt &&
            plot.readyAt <= now
          ) {
            return { ...plot, status: "ready" as const };
          }
          return plot;
        });
        
        // Update state with the new array
        setGamePlots(updatedPlots);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [gamePlots, setGamePlots]);
  
  // Check if any plots just became ready
  useEffect(() => {
    const readyPlots = gamePlots.filter(plot => plot.status === "ready");
    if (readyPlots.length > 0) {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 2000);
    }
  }, [gamePlots]);
  
  // Effect to add a daily tick (passage of time)
  useEffect(() => {
    const interval = setInterval(() => {
      // Advance the day every 10 minutes in real time
      advanceDay();
    }, 10 * 60 * 1000); // 10 minutes in milliseconds
    
    return () => clearInterval(interval);
  }, [advanceDay]);
  
  // Helper to get season-adjusted growth time
  const getSeasonAdjustedGrowthTime = (seedType: string) => {
    const seed = seeds.find(s => s.type === seedType);
    if (!seed) return 1;
    
    // Base growth time
    let adjustedTime = seed.growthTime;
    
    // Apply season modifier
    if (seed.bestSeason === currentSeason) {
      // 20% faster growth in the best season
      adjustedTime *= 0.8;
    } else if (
      (currentSeason === "winter" && seed.bestSeason !== "winter") || 
      (currentSeason === "fall" && seed.bestSeason === "spring") ||
      (currentSeason === "spring" && seed.bestSeason === "fall")
    ) {
      // 40% slower growth in opposite or winter season
      adjustedTime *= 1.4;
    }
    
    // Apply weather modifier
    if (seed.weatherBonus && Array.isArray(seed.weatherBonus) && seed.weatherBonus.includes(currentWeather)) {
      // 15% faster growth in preferred weather
      adjustedTime *= 0.85;
    } else if (currentWeather === "stormy") {
      // 25% slower growth in stormy weather
      adjustedTime *= 1.25;
    }
    
    return Math.max(1, adjustedTime);
  };
  
  // Helper to get weather-adjusted yield
  const getWeatherAdjustedYield = (seedType: string) => {
    const seed = seeds.find(s => s.type === seedType);
    if (!seed) return 1;
    
    // Base reward
    let adjustedReward = seed.reward;
    
    // Seasonal bonus (30% more in the best season)
    if (seed.bestSeason === currentSeason) {
      adjustedReward *= 1.3;
    } else if (
      (currentSeason === "winter" && seed.bestSeason !== "winter") || 
      (currentSeason === "fall" && seed.bestSeason === "spring") ||
      (currentSeason === "spring" && seed.bestSeason === "fall")
    ) {
      // 20% reduced yield in opposite or winter season
      adjustedReward *= 0.8;
    }
    
    // Weather bonus (20% more in preferred weather)
    if (seed.weatherBonus && Array.isArray(seed.weatherBonus) && seed.weatherBonus.includes(currentWeather)) {
      adjustedReward *= 1.2;
    } else if (currentWeather === "stormy") {
      // 15% reduced yield in stormy weather
      adjustedReward *= 0.85;
    }
    
    return Math.floor(adjustedReward);
  };
  
  const handlePlotClick = (index: number) => {
    const plot = gamePlots[index];
    console.log("Clicked plot:", plot);
    
    // If plot is ready for harvest
    if (plot.status === "ready" && plot.crop) {
      console.log("Harvesting plot with crop:", plot.crop);
      // Find the corresponding seed to get rewards
      const seed = seeds.find(s => s.type === plot.crop);
      if (seed) {
        console.log("Found seed for crop:", seed);
        // Get weather and season adjusted yield
        const adjustedYield = getWeatherAdjustedYield(plot.crop);
        console.log("Adjusted yield value:", adjustedYield);
        
        // Instead of directly giving coins, add to inventory with adjusted value
        // Pass only the required parameters
        addCropToInventory(plot.crop, adjustedYield);
        
        // Increment crops harvested stat
        incrementCropsHarvested();
        
        // Show harvest animation with market value
        const harvestValue = Math.floor(adjustedYield * 1.2);
        setHarvestAnimation({ plotIndex: index, amount: harvestValue });
        setTimeout(() => setHarvestAnimation(null), 1000);
        
        // Show XP gain animation for harvesting
        const xpGained = Math.floor(adjustedYield / 2);
        setXpGainAnimation({ amount: xpGained, show: true });
        setTimeout(() => setXpGainAnimation({ amount: 0, show: false }), 1500);
        
        // Apply glow effect to progress bars
        if (typeof document !== 'undefined') {
          const progressBars = document.querySelectorAll('.xp-progress-bar');
          progressBars.forEach(bar => {
            bar.classList.remove('progress-glow');
            // Force a reflow to ensure the animation restarts
            void (bar as HTMLElement).offsetWidth;
            bar.classList.add('progress-glow');
          });
        }
        
        // Update daily task for earning coins
        updateDailyTask('coinsEarned', adjustedYield);
        
        // Update plots
        const updatedPlots = [...gamePlots];
        updatedPlots[index] = { 
          status: "empty", 
          crop: null, 
          plantedAt: null, 
          readyAt: null 
        };
        setGamePlots(updatedPlots);
        
        // Show message with bonus information if applicable
        let harvestMessage = `Harvested ${plot.crop}! Added to inventory.`;
        
        if (seed.bestSeason === currentSeason) {
          harvestMessage += ` (${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} season bonus!)`;
        }
        
        if (seed.weatherBonus && Array.isArray(seed.weatherBonus) && seed.weatherBonus.includes(currentWeather)) {
          harvestMessage += ` (${currentWeather.charAt(0).toUpperCase() + currentWeather.slice(1)} weather bonus!)`;
        }
        
        toast.success(harvestMessage);
      }
    } 
    // If we have a selected seed and the plot is empty
    else if (selectedSeed && plot.status === "empty") {
      if (farmCoins >= selectedSeed.cost) {
        // Get season-adjusted growth time
        const adjustedGrowthTime = getSeasonAdjustedGrowthTime(selectedSeed.type);
        
        // First update the plot
        const updatedPlots = [...gamePlots];
        const growthTime = adjustedGrowthTime * 60 * 1000; // Convert minutes to ms
        const now = Date.now();
        const readyAt = now + growthTime;
        
        updatedPlots[index] = {
          status: "growing",
          crop: selectedSeed.type,
          plantedAt: now,
          readyAt: readyAt
        };
        setGamePlots(updatedPlots);
        
        // Then deduct coins after the plot is successfully updated
        addFarmCoins(-selectedSeed.cost);
        
        // Increment seeds planted stat
        incrementSeedsPlanted();
        
        // Update daily task for planting seeds
        updateDailyTask('seedsPlanted', 1);
        
        // Calculate growth time in minutes and seconds for display
        const minutes = Math.floor(adjustedGrowthTime);
        const seconds = Math.floor((adjustedGrowthTime - minutes) * 60);
        
        // Visual planting effect with growth time information
        let plantingMessage = `Planted ${selectedSeed.name}!`;
        
        // Add growth time information
        plantingMessage += ` (Growth time: ${minutes}m ${seconds}s)`;
        
        // Add season information if it's the best season
        if (selectedSeed.bestSeason === currentSeason) {
          plantingMessage += ` - Perfect season for ${selectedSeed.name}!`;
        }
        
        // Add weather information if it's preferred weather
        if (selectedSeed.weatherBonus && Array.isArray(selectedSeed.weatherBonus) && selectedSeed.weatherBonus.includes(currentWeather)) {
          plantingMessage += ` - ${currentWeather.charAt(0).toUpperCase() + currentWeather.slice(1)} weather boosts growth!`;
        }
        
        toast.success(plantingMessage);
      } else {
        toast.error("Not enough coins!");
      }
    } else if (!selectedSeed && plot.status === "empty") {
      toast("Select a seed first!");
    } else if (plot.status === "growing" && plot.crop) {
      // Calculate growth percentage
      const now = Date.now();
      const totalGrowthTime = (plot.readyAt || 0) - (plot.plantedAt || 0);
      const elapsedTime = now - (plot.plantedAt || 0);
      const growthPercentage = Math.min(Math.floor((elapsedTime / totalGrowthTime) * 100), 99);
      
      // Get the seed for this crop
      const seed = seeds.find(s => s.type === plot.crop);
      
      if (seed) {
        // First, dismiss any existing booster selectors
        toast.dismiss("booster-selector");
        
        // Check if player has any boosters to apply
        const hasAvailableBoosters = Object.entries(ownedBoosters)
          .some(([_, count]) => count > 0);
        
        // Show available boosters if the user has any
        if (hasAvailableBoosters) {
          console.log("Showing booster options for plot", index);
          // Use setTimeout to ensure the popup is shown after any state updates
          setTimeout(() => {
            showBoosterOptions(index);
          }, 50);
        } else {
          // Default growth information message if no boosters available
          // Fix null issue by providing a default value of 0 if readyAt is null
          const timeRemaining = plot.readyAt ? getTimeRemaining(plot.readyAt) : "unknown";
          toast.success(
            `${seed.name} - ${growthPercentage}% grown. Ready in ${timeRemaining}`,
            { duration: 3000 }
          );
        }
      }
    }
  };
  
  const handleCompleteTask = (taskType: 'seedsPlanted' | 'coinsEarned') => {
    // Check if task is already completed
    if (dailyTasks[taskType].completed) {
      toast.error("This task has already been completed today!");
      return;
    }
    
    // Check if task requirements have been met
    if (dailyTasks[taskType].current < dailyTasks[taskType].target) {
      toast.error(`You need to ${taskType === 'seedsPlanted' ? 'plant more seeds' : 'earn more coins'} to complete this task!`);
      return;
    }
    
    // Get current date for tracking completion time
    const now = new Date().toISOString();
    
    // Mark task as completed and record completion time
    const updatedDailyTasks = {
      ...dailyTasks,
      [taskType]: {
        ...dailyTasks[taskType],
        completed: true,
        lastCompleted: now
      }
    };
    
    // Award coins for completing task
    addFarmCoins(dailyTasks[taskType].reward);
    setDailyTasks(updatedDailyTasks);
    localStorage.setItem('daily-tasks', JSON.stringify(updatedDailyTasks));
    toast.success(`Daily task completed! +${dailyTasks[taskType].reward} coins`);
  };
  
  // Daily quests (mock data)
  const dailyQuests = [
    { id: 1, title: "Plant 5 Seeds", description: "Plant any 5 seeds", reward: 50, progress: 0.6 },
    { id: 2, title: "Harvest 3 Tomatoes", description: "Harvest 3 tomato plants", reward: 30, progress: 0.33 }
  ];
  
  // Weekly quests (mock data)
  const weeklyQuests = [
    { id: 3, title: "Master Farmer", description: "Harvest 50 crops", reward: 200, progress: 0.25 },
    { id: 4, title: "Weather Watcher", description: "Grow crops in all weather conditions", reward: 150, progress: 0.66 }
  ];
  
  // Add animations for XP gain and level up
  useEffect(() => {
    if (typeof document !== "undefined") {
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes float-up {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 1.5s ease-out forwards;
        }
        
        @keyframes glow-pulse {
          0% { box-shadow: 0 0 0px rgba(255, 255, 255, 0); }
          50% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
          100% { box-shadow: 0 0 0px rgba(255, 255, 255, 0); }
        }
        .progress-glow {
          animation: glow-pulse 1.5s ease-out;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);
  
  // Ensure the displayed XP never exceeds xpToNextLevel
  const displayXp = Math.min(playerXp, playerXpToNext);
  
  // Update daily tasks progress
  const updateDailyTask = (taskName: 'seedsPlanted' | 'coinsEarned', amount: number) => {
    setDailyTasks(prev => {
      const task = prev[taskName];
      
      // Skip updating if the task is already completed for today
      if (task.completed) {
        return prev;
      }
      
      const newCurrent = task.current + amount;
      const completed = newCurrent >= task.target && !task.completed;
      
      // If task is newly completed, award coins
      if (completed) {
        addFarmCoins(task.reward);
        toast.success(`Daily task completed! +${task.reward} coins`);
      }
      
      const updatedTask = {
        ...task,
        current: newCurrent,
        completed: completed || task.completed,
        lastCompleted: completed ? new Date().toISOString() : task.lastCompleted
      };
      
      const updatedTasks = {
        ...prev,
        [taskName]: updatedTask
      };
      
      // Save updated tasks to localStorage
      localStorage.setItem('daily-tasks', JSON.stringify(updatedTasks));
      
      return updatedTasks;
    });
  };
  
  // Display time remaining for growing crops
  const getTimeRemaining = (readyAt: number): string => {
    const now = Date.now();
    const timeLeft = Math.max(0, readyAt - now);
    
    if (timeLeft <= 0) return "Ready!";
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };
  
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  // Error alert state for farm expansion
  const [expansionError, setExpansionError] = useState<{
    show: boolean;
    type: 'level' | 'coins';
    message: string;
  } | null>(null);
  
  // Add a unified profile management system
  useEffect(() => {
    // Load profile data from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedNickname = localStorage.getItem('player-nickname');
      const savedBio = localStorage.getItem('player-bio');
      
      // Apply saved profile data if available
      if (savedNickname) setNickname(savedNickname);
      if (savedBio) setBio(savedBio);
      
      console.log('Profile loaded from localStorage:', { 
        nickname: savedNickname || 'not found', 
        bio: savedBio || 'not found' 
      });
    }
  }, [profileVersion]); // Run on component mount and when profileVersion changes

  // Add a direct update function that can be called from any component
  const updateProfile = (newNickname: string, newBio: string) => {
    console.log('Direct profile update:', { nickname: newNickname, bio: newBio });
    setNickname(newNickname);
    setBio(newBio);
    setProfileVersion(v => v + 1);
  };
  
  // Helper to get crop name from type
  const getCropName = (cropType: string) => {
    const seed = seeds.find(s => s.type === cropType);
    return seed ? seed.name : cropType;
  };
  
  // Map seed types to appropriate icons
  const getSeedIcon = (seedType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      eggplant: <span className="text-purple-500">🍆</span>, // aubergine
      lettuce: <span className="text-green-500">🥦</span>, // broccoli
      carrot: <span className="text-orange-500">🥕</span>, // carrot
      corn: <span className="text-yellow-500">🌽</span>, // corn
      tomato: <span className="text-red-500">🍅</span>, // tomato
      watermelon: <span className="text-green-500">🍐</span>, // pear
      radish: <span className="text-pink-500">🥬</span>, // radish 
      strawberry: <span className="text-green-500">🥒</span>, // zucchini
    };
    
    return iconMap[seedType] || <Sprout className="text-green-500 w-6 h-6" />;
  };
  
  // Add animations for level-locked button
  useEffect(() => {
    if (typeof document !== "undefined") {
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes float-up {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 1.5s ease-out forwards;
        }
        
        @keyframes glow-pulse {
          0% { box-shadow: 0 0 0px rgba(255, 255, 255, 0); }
          50% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
          100% { box-shadow: 0 0 0px rgba(255, 255, 255, 0); }
        }
        .progress-glow {
          animation: glow-pulse 1.5s ease-out;
        }
        
        @keyframes pulse-red {
          0% { background-color: rgba(239, 68, 68, 0.1); }
          50% { background-color: rgba(239, 68, 68, 0.2); }
          100% { background-color: rgba(239, 68, 68, 0.1); }
        }
        .pulse-red {
          animation: pulse-red 2s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);
  
  // Debug effect to track profile changes
  useEffect(() => {
    console.log('Profile state changed:', { nickname, bio, profileVersion });
  }, [nickname, bio, profileVersion]);
  
  // Add a manual day advance button for debugging/testing
  const handleAdvanceDay = () => {
    advanceDay();
    toast.success(`Advanced to Day ${seasonDay} of ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}`);
  };
  
  // Add helper function to get animal product name
  const getProductName = (productType: string) => {
    const product = animalProducts.find(p => p.type === productType);
    return product ? product.name : productType;
  };
  
  // Helper function to get animal product icon
  const getProductIcon = (productType: string) => {
    const product = animalProducts.find(p => p.type === productType);
    if (!product) return "❓";
    return product.icon;
  };
  
  // Add getTimeRemaining function for animal production
  const getAnimalTimeRemaining = (readyAt: number | null) => {
    if (!readyAt) return "Ready!";
    
    const now = Date.now();
    const timeLeft = Math.max(0, readyAt - now);
    
    if (timeLeft <= 0) return "Ready!";
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Helper function to get crafted item icon
  const getCraftedItemIcon = (itemType: string) => {
    const item = craftableItems.find(i => i.type === itemType);
    if (!item) return "❓";
    return item.icon;
  };
  
  // Helper function to get crafted item name
  const getCraftedItemName = (itemType: string) => {
    const item = craftableItems.find(i => i.type === itemType);
    if (!item) return "Unknown";
    return item.name;
  };
  
  // Helper function to get booster icon
  const getBoosterIcon = (boosterType: string) => {
    const booster = boosters.find(b => b.type === boosterType);
    if (!booster) return "❓";
    return booster.icon;
  };
  
  // Helper function to get booster name
  const getBoosterName = (boosterType: string) => {
    const booster = boosters.find(b => b.type === boosterType);
    if (!booster) return "Unknown Booster";
    return booster.name;
  };
  
  // Helper function to get booster count
  const getBoosterCount = (boosterType: string) => {
    return ownedBoosters[boosterType] || 0;
  };
  
  // Rebuild the booster popup with a completely different approach
  const showBoosterOptions = (index: number) => {
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    
    // If not in browser, show a simple fallback
    if (!isBrowser) {
      console.log("Cannot create modal: not in browser environment");
      return;
    }
    
    // Check for active boosters on this plot
    const activeBoosters = getPlotBoosters(index);
    
    // First dismiss any existing toasts
    toast.dismiss();
    
    // Now we know we're in the browser
    // Create a modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'fixed inset-0 flex items-center justify-center z-[1000]';
    modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    
    // Create the modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-black border border-gray-700 w-[300px] rounded shadow-lg';
    modalContent.style.position = 'fixed';
    modalContent.style.top = '50%';
    modalContent.style.left = '50%';
    modalContent.style.transform = 'translate(-50%, -50%)';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.display = 'flex';
    modalContent.style.flexDirection = 'column';
    
    // Create the header
    const header = document.createElement('div');
    header.className = 'p-3 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-black';
    header.innerHTML = `
      <h3 class="text-white font-medium flex items-center">
        <span class="mr-2">🚀</span>
        Apply Booster
      </h3>
    `;
    
    // Create the body
    const body = document.createElement('div');
    body.className = 'p-3 overflow-auto';
    body.style.maxHeight = '250px';
    
    // Add booster items
    const availableBoosters = Object.entries(ownedBoosters).filter(([_, count]) => count > 0);
    
    if (availableBoosters.length === 0) {
      // No boosters available
      body.innerHTML = `
        <div class="text-center text-gray-400 p-4">
          <p>No boosters available</p>
          <p class="text-xs mt-1">Purchase boosters from the Boosters tab</p>
        </div>
      `;
    } else {
      // Create booster items
      availableBoosters.forEach(([boosterType, count]) => {
        const booster = boosters.find(b => b.type === boosterType);
        if (!booster || count <= 0) return;
        
        // Check if this booster is already active
        const isActive = activeBoosters.some(ab => ab.boosterType === boosterType);
        
        const boosterItem = document.createElement('div');
        boosterItem.className = `flex items-center justify-between p-2 border mb-2 hover:border-white cursor-pointer ${
          isActive ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-700 bg-gray-900'
        }`;
        
        boosterItem.innerHTML = `
          <div class="flex items-center">
            <div class="w-8 h-8 flex items-center justify-center text-xl mr-2 bg-black border border-gray-700">
              ${booster.icon}
            </div>
            <div>
              <div class="text-white text-sm">${booster.name}</div>
              <div class="text-gray-400 text-xs">Qty: ${count}</div>
            </div>
          </div>
          ${!isActive ? `
            <div class="bg-blue-900/30 px-2 py-1 border border-blue-500/50 text-blue-300 text-xs">
              Apply
            </div>
          ` : ''}
        `;
        
        // Add click handler
        boosterItem.addEventListener('click', () => {
          if (!isActive) {
            // Apply booster
            applyBooster(index, boosterType);
            
            // Remove modal
            document.body.removeChild(modalContainer);
            
            // Show success toast
            toast.success(`Applied ${booster.name} to your crop!`);
          } else {
            toast.error(`This booster is already active!`);
          }
        });
        
        body.appendChild(boosterItem);
      });
    }
    
    // Create the footer
    const footer = document.createElement('div');
    footer.className = 'p-2 border-t border-gray-700 flex justify-end';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'bg-white text-black hover:bg-gray-200 text-xs px-2 py-1 rounded';
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
    });
    
    footer.appendChild(closeButton);
    
    // Add elements to modal
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalContent.appendChild(footer);
    modalContainer.appendChild(modalContent);
    
    // Add modal to body
    document.body.appendChild(modalContainer);
    
    // Add click handler to close when clicking outside
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        document.body.removeChild(modalContainer);
      }
    });
  };
  
  // Add this code in useEffect to ensure the user has some boosters for testing
  // Add after other useEffect declarations

  // Add a function to give emergency coins
  const handleEmergencyCoins = () => {
    // Give the player some emergency coins
    addFarmCoins(100);
    addCoinsEarned(100);
    
    toast.success("Emergency funds: +100 coins!", { 
      icon: "💰",
      duration: 3000 
    });
  };
  
  // Function to collect products from all ready animals
  const handleCollectAllAnimals = () => {
    let totalCollected = 0;
    let productsCollected: Record<string, number> = {};
    
    // Loop through each animal and collect if ready
    animals.forEach((animal, index) => {
      // Check if animal is ready to collect from
      if (animal.readyAt && Date.now() >= animal.readyAt) {
        // Call the existing collect function for each ready animal
        collectAnimalProduct(index);
        
        // Track which products were collected
        const productType = animal.productType;
        productsCollected[productType] = (productsCollected[productType] || 0) + 1;
        totalCollected++;
      }
    });
    
    if (totalCollected === 0) {
      toast('No animals are ready to collect from', {
        icon: 'ℹ️',
        duration: 3000
      });
    } else {
      toast.success(`Collected products from ${totalCollected} animals!`, {
        duration: 3000
      });
    }
  };
  
  // Function to feed all hungry animals
  const handleFeedAllAnimals = () => {
    let totalFed = 0;
    
    // Loop through each animal and feed if hungry
    animals.forEach((animal, index) => {
      // Check if animal needs feeding
      if (!animal.fed) {
        // Call the existing feed function for each hungry animal
        feedAnimal(index);
        totalFed++;
      }
    });
    
    if (totalFed === 0) {
      toast('All animals are already fed!', {
        icon: 'ℹ️',
        duration: 3000
      });
    }
    // Note: We don't need a success message here as feedAnimal already shows one
  };
  
  // Add Defend Farm game state
  const [defendGameState, setDefendGameState] = useState<DefendGameState>({
    isActive: false,
    wave: 1,
    day: 1,
    score: 0,
    lives: 5,
    farmCoinsEarned: 0,
    enemies: [],
    defenses: [],
    isPaused: false,
    gameOverStatus: false
  });
  
  // Enemy types for the defend farm game
  const enemyTypes: Record<EnemyType, EnemyTypeInfo> = {
    rabbit: { 
      name: "Rabbit", 
      icon: "🐰", 
      health: 1, 
      speed: 8, 
      damage: 1,
      value: 2,
      description: "Fast but weak; nibbles at crops"
    },
    bird: { 
      name: "Bird", 
      icon: "🐦", 
      health: 1, 
      speed: 10, 
      damage: 1,
      value: 2,
      description: "Flies in to peck at seeds" 
    },
    deer: { 
      name: "Deer", 
      icon: "🦌", 
      health: 3, 
      speed: 5, 
      damage: 2,
      value: 5,
      description: "Tougher; tramples fields" 
    },
    boar: { 
      name: "Boar", 
      icon: "🐗", 
      health: 5, 
      speed: 3, 
      damage: 3,
      value: 10,
      description: "Destroys structures and crops" 
    }
  };
  
  // Defense types for defend farm game
  const defenseTypes: Record<DefenseType, DefenseTypeInfo> = {
    scarecrow: {
      name: "Scarecrow",
      icon: "🎭",
      cost: 15,
      range: 100,
      effectiveness: {
        bird: 0.8,
        rabbit: 0.2,
        deer: 0.1,
        boar: 0
      },
      description: "Deters birds effectively"
    },
    dog: {
      name: "Farm Dog",
      icon: "🐕",
      cost: 25,
      range: 150,
      effectiveness: {
        bird: 0.3,
        rabbit: 0.9,
        deer: 0.4,
        boar: 0.2
      },
      description: "Chases away small animals"
    },
    trap: {
      name: "Trap",
      icon: "🪤",
      cost: 20,
      range: 50,
      effectiveness: {
        bird: 0.1,
        rabbit: 0.7,
        deer: 0.6,
        boar: 0.3
      },
      description: "Catches smaller pests"
    },
    fence: {
      name: "Strong Fence",
      icon: "🧱",
      cost: 35,
      range: 200,
      effectiveness: {
        bird: 0.1,
        rabbit: 0.5,
        deer: 0.8,
        boar: 0.6
      },
      description: "Blocks larger animals"
    }
  };
  
  // Initialize the defend game
  const startDefendGame = () => {
    setDefendGameState({
      ...defendGameState,
      isActive: true,
      wave: 1,
      day: 1,
      score: 0,
      lives: 5,
      farmCoinsEarned: 0,
      enemies: [],
      defenses: [],
      isPaused: false,
      gameOverStatus: false
    });
    
    // Start the first wave after a brief delay
    setTimeout(() => {
      startNewWave();
    }, 1500);
  };
  
  // Start a new wave of enemies
  const startNewWave = () => {
    // Generate enemies based on current wave
    const numberOfEnemies = 3 + Math.floor(defendGameState.wave * 1.5);
    const newEnemies: Enemy[] = [];
    
    for (let i = 0; i < numberOfEnemies; i++) {
      // Determine enemy type based on wave difficulty
      let enemyType: EnemyType;
      const rand = Math.random();
      
      if (defendGameState.wave < 3) {
        // Early waves: mostly rabbits and birds
        enemyType = rand < 0.7 ? "rabbit" : "bird";
      } else if (defendGameState.wave < 6) {
        // Middle waves: add deer
        if (rand < 0.5) enemyType = "rabbit";
        else if (rand < 0.8) enemyType = "bird";
        else enemyType = "deer";
      } else {
        // Later waves: add boars
        if (rand < 0.3) enemyType = "rabbit";
        else if (rand < 0.6) enemyType = "bird";
        else if (rand < 0.85) enemyType = "deer";
        else enemyType = "boar";
      }
      
      // Random position (left side of screen)
      const posY = 100 + Math.random() * 400;
      
      newEnemies.push({
        id: `enemy-${Date.now()}-${i}`,
        type: enemyType,
        health: enemyTypes[enemyType].health,
        posX: -50, // Start off-screen
        posY: posY,
        speed: enemyTypes[enemyType].speed * (0.8 + Math.random() * 0.4), // Some speed variation
        isActive: true
      });
    }
    
    setDefendGameState(prevState => ({
      ...prevState,
      enemies: newEnemies
    }));
  };
  
  // Handle swatting/clicking an enemy
  const handleSwatEnemy = (enemyId: string) => {
    setDefendGameState(prevState => {
      const updatedEnemies = prevState.enemies.map(enemy => {
        if (enemy.id === enemyId && enemy.isActive) {
          // Reduce health and check if defeated
          const newHealth = enemy.health - 1;
          if (newHealth <= 0) {
            // Enemy defeated
            const enemyValue = enemyTypes[enemy.type].value;
            toast.success(`+${enemyValue} coins!`, { duration: 1000 });
            return {
              ...enemy,
              isActive: false,
              health: 0
            };
          }
          return {
            ...enemy,
            health: newHealth
          };
        }
        return enemy;
      });
      
      // Count defeated enemies
      const defeatedCount = updatedEnemies.filter(e => !e.isActive).length;
      const totalEnemies = updatedEnemies.length;
      
      // Calculate new score
      const newScore = prevState.score + 10;
      
      // Calculate coins earned
      const newlyDefeatedEnemies = updatedEnemies.filter(e => 
        !e.isActive && 
        prevState.enemies.find(pe => pe.id === e.id)?.isActive === true
      );
      
      const coinsEarned = prevState.farmCoinsEarned + newlyDefeatedEnemies.reduce(
        (total, e) => total + enemyTypes[e.type].value, 
        0
      );
      
      // Check if wave is complete
      if (defeatedCount === totalEnemies && totalEnemies > 0) {
        // Wave completed
        toast.success(`Wave ${prevState.wave} completed!`, { 
          duration: 3000,
          icon: '🎉' 
        });
        
        // Start next wave after delay
        setTimeout(() => {
          setDefendGameState(prev => ({
            ...prev,
            wave: prev.wave + 1,
            enemies: []
          }));
          startNewWave();
        }, 3000);
      }
      
      return {
        ...prevState,
        enemies: updatedEnemies,
        score: newScore,
        farmCoinsEarned: coinsEarned
      };
    });
  };
  
  // Place a defense
  const placeDefense = (defenseType: DefenseType, posX: number, posY: number) => {
    // Check if player has enough coins
    if (farmCoins < defenseTypes[defenseType].cost) {
      toast.error(`Not enough coins to place ${defenseTypes[defenseType].name}!`, {
        duration: 2000
      });
      return;
    }
    
    // Subtract cost from coins
    addFarmCoins(-defenseTypes[defenseType].cost);
    
    // Add the defense
    setDefendGameState(prev => ({
      ...prev,
      defenses: [
        ...prev.defenses,
        {
          id: `defense-${Date.now()}`,
          type: defenseType,
          posX: posX,
          posY: posY,
          range: defenseTypes[defenseType].range,
          isActive: true
        }
      ]
    }));
    
    toast.success(`${defenseTypes[defenseType].name} placed!`, {
      duration: 2000
    });
  };
  
  // End game and collect rewards
  const endDefendGame = (wasSuccessful: boolean) => {
    // Add coins earned to player's total
    if (defendGameState.farmCoinsEarned > 0) {
      addFarmCoins(defendGameState.farmCoinsEarned);
      toast.success(`You earned ${defendGameState.farmCoinsEarned} Farm Coins!`, {
        duration: 3000,
        icon: '💰'
      });
    }
    
    // Reset game state
    setDefendGameState({
      ...defendGameState,
      isActive: false,
      gameOverStatus: true
    });
  };
  
  // Use clientSide state to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // This runs only on the client, after hydration
    setIsClient(true);
  }, []);
  
  // Add client-side state for player level to prevent hydration mismatch
  const [clientPlayerLevel, setClientPlayerLevel] = useState(0);
  const [clientDisplayXp, setClientDisplayXp] = useState(0);
  const [clientXpToNext, setClientXpToNext] = useState(100);
  
  // Update client player level after mount
  useEffect(() => {
    setClientPlayerLevel(playerLevel);
    setClientDisplayXp(playerXp);
    setClientXpToNext(playerXpToNext);
  }, [playerLevel, playerXp, playerXpToNext]);
  
  return (
    <div className="flex flex-col h-full min-h-screen bg-black text-white">
      {/* Expansion error alert */}
      {expansionError && expansionError.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" 
             onClick={() => setExpansionError(null)}>
          <div className="absolute inset-0 bg-black bg-opacity-70"></div>
          <div 
            className="relative z-10 p-6 border-2 animate-pulse max-w-md w-full mx-4"
            style={{ 
              borderColor: expansionError.type === 'level' ? '#ff4444' : '#ff9900',
              backgroundColor: expansionError.type === 'level' ? '#330000' : '#332200'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start mb-4">
              <div className="mr-3 text-4xl">
                {expansionError.type === 'level' ? '🔒' : '💰'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {expansionError.type === 'level' ? 'Level Locked!' : 'Not Enough Coins!'}
                </h3>
                <p className="text-white">{expansionError.message}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                className="bg-white text-black px-4 py-2"
                onClick={() => setExpansionError(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sticky navigation bar */}
      <header className="sticky top-0 z-10 bg-black border-b border-[#333]" key={`header-${profileVersion}`}>
        <div className="container mx-auto py-3 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border border-[#333] overflow-hidden">
                <img src="/images/nooter.png" alt="Nooter" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-bold text-white noot-title">Nooter's Farm</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Player Level */}
              <div className="border border-[#333] px-2 py-1 flex items-center gap-1 text-white text-sm noot-text">
                <User className="h-4 w-4 text-white/80" />
                <span>{nickname}</span>
                <div className="ml-1 w-5 h-5 rounded-none bg-white text-black flex items-center justify-center text-xs font-medium noot-title">
                  {typeof window !== 'undefined' ? clientPlayerLevel : 0}
                </div>
              </div>
              
              {/* Season display */}
              <div className="border border-[#333] px-2 py-1 flex items-center gap-1 text-white text-sm noot-text">
                {seasonIcons[currentSeason]}
                <span className={seasonColors[currentSeason]}>
                  {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}
                </span>
                <span className="text-white/60 text-xs">
                  Day {seasonDay}/{seasonLength}
                </span>
              </div>
              
              {/* Weather display */}
              <div className="border border-[#333] px-2 py-1 flex items-center gap-1 text-white/80 text-sm noot-text">
                {weatherEffects[currentWeather].icon}
                <span>{weatherEffects[currentWeather].label}</span>
              </div>
              
              {/* Coins display */}
              <div className="border border-[#333] px-2 py-1 flex items-center gap-1 text-white text-sm noot-text">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span>{farmCoins}</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Level up animation */}
      {showLevelUp && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-black/70 border border-white p-6 rounded-none animate-pulse-glow">
            <div className="text-4xl font-bold text-white text-center noot-title animate-fadeIn">
              LEVEL UP!
            </div>
            <div className="text-2xl text-white text-center mt-2 noot-text">
              You are now level {typeof window !== 'undefined' ? clientPlayerLevel : 0}
            </div>
            <div className="flex justify-center mt-4">
              <Trophy className="h-16 w-16 text-yellow-500 animate-float" />
            </div>
          </div>
        </div>
      )}
      
      {/* Main tabbed interface */}
      <div className="container mx-auto py-6 px-4 flex-grow">
        <div className="grid grid-cols-9 md:w-[900px] bg-[#111] border border-[#333] mb-6 noot-text">
          <button 
            onClick={() => setActiveTab("farm")}
            className={`px-4 py-2 flex items-center justify-center gap-2 ${activeTab === "farm" ? "bg-white text-black" : "text-white/80"}`}
          >
            <Sprout className="h-4 w-4" />
            Farm
          </button>
          <button 
            onClick={() => setActiveTab("animals")}
            className={`px-4 py-2 flex items-center justify-center gap-2 ${activeTab === "animals" ? "bg-white text-black" : "text-white/80"}`}
          >
            <span className="h-4 w-4 flex items-center justify-center">🐄</span>
            Animals
          </button>
          <button 
            onClick={() => setActiveTab("crafting")}
            className={`px-4 py-2 flex items-center justify-center gap-2 ${activeTab === "crafting" ? "bg-white text-black" : "text-white/80"}`}
          >
            <Hammer className="h-4 w-4" />
            Crafting
          </button>
          <button 
            onClick={() => setActiveTab("boosters")}
            className={`px-4 py-2 flex items-center justify-center gap-2 ${activeTab === "boosters" ? "bg-white text-black" : "text-white/80"}`}
          >
            <Rocket className="h-4 w-4" />
            Boosters
          </button>
          <button 
            onClick={() => setActiveTab("quests")}
            className={`px-4 py-2 flex items-center justify-center gap-2 ${activeTab === "quests" ? "bg-white text-black" : "text-white/80"}`}
          >
            <Trophy className="h-4 w-4" />
            Quests
          </button>
          <button 
            onClick={() => setActiveTab("market")}
            className={`px-4 py-2 flex items-center justify-center gap-2 ${activeTab === "market" ? "bg-white text-black" : "text-white/80"}`}
          >
            <ShoppingBag className="h-4 w-4" />
            Market
          </button>
          <button 
            onClick={() => setActiveTab("swap")}
            className={`px-4 py-2 flex items-center justify-center gap-2 ${activeTab === "swap" ? "bg-white text-black" : "text-white/80"}`}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Swap
          </button>
          <button 
            onClick={() => setActiveTab("social")}
            className={`px-4 py-2 flex items-center justify-center gap-2 ${activeTab === "social" ? "bg-white text-black" : "text-white/80"}`}
          >
            <Users className="h-4 w-4" />
            Social
          </button>
          <button 
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 flex items-center justify-center gap-2 ${activeTab === "profile" ? "bg-white text-black" : "text-white/80"}`}
          >
            <User className="h-4 w-4" />
            Profile
          </button>
          <button 
            onClick={() => setActiveTab("defend")}
            className={`px-4 py-2 flex items-center justify-center gap-2 ${activeTab === "defend" ? "bg-white text-black" : "text-white/80"}`}
          >
            <Shield className="h-4 w-4" />
            Defend Farm
          </button>
        </div>
        
        {/* Farm Tab */}
        {activeTab === "farm" && (
          <>
            {/* Emergency Funds Button */}
            <div className="w-full bg-black border border-yellow-500 p-3 mb-4 flex justify-between items-center animate-fadeIn">
              <div className="flex items-center">
                <Coins className="h-5 w-5 mr-2 text-yellow-500" />
                <span className="text-white noot-text">Need coins? Get a bonus!</span>
              </div>
              <Button
                onClick={handleEmergencyCoins}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 border-0 rounded-none"
                size="sm"
              >
                Get 100 Coins
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Left sidebar - Seeds and tools */}
              <div className="lg:col-span-1 space-y-4">
                <div className="noot-card">
                  <div className="border-b border-[#333] p-4">
                    <h2 className="noot-header flex items-center text-white noot-title">
                      <Sprout className="h-5 w-5 mr-2" />
                      Seed Selector
                    </h2>
                    <p className="text-white/60 text-sm noot-text">
                      Choose a seed to plant
                    </p>
                  </div>
                  <div className="p-4">
                    <SeedSelector />
                  </div>
                </div>
                
                <div className="noot-card">
                  <div className="border-b border-[#333] p-4">
                    <h2 className="noot-header flex items-center text-white noot-title">
                      <Shovel className="h-5 w-5 mr-2" />
                      Tools
                    </h2>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedSeed(null)} 
                      className={`flex items-center rounded-none border-[#333] text-white hover:bg-[#222] ${!selectedSeed ? 'bg-[#222]' : 'bg-transparent'}`}
                    >
                      <CircleSlash className="h-4 w-4 mr-2" />
                      Clear selection
                    </Button>
                  </div>
                </div>
                
                <div className="noot-card">
                  <div className="border-b border-[#333] p-4">
                    <h2 className="noot-header flex items-center text-white noot-title">
                      <Calendar className="h-5 w-5 mr-2" />
                      Season & Weather
                    </h2>
                    <p className="text-white/60 text-sm noot-text">
                      Plan your crops based on seasons
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <div className={`text-xl font-bold mb-1 ${seasonColors[currentSeason]}`}>
                        {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Day {seasonDay} of {seasonLength}</span>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleAdvanceDay}
                            className="bg-transparent text-white border-[#333] rounded-none hover:bg-[#222] text-xs"
                          >
                            Skip Day
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (typeof window !== "undefined") {
                                // Clear seed data
                                localStorage.removeItem("seeds");
                                // Force reload the page
                                window.location.reload();
                              }
                            }}
                            className="bg-transparent text-white border-[#333] rounded-none hover:bg-[#222] text-xs"
                          >
                            Fix Seasons
                          </Button>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-[#222] mt-2">
                        <div 
                          className={`h-full ${
                            currentSeason === "spring" ? "bg-green-500" : 
                            currentSeason === "summer" ? "bg-yellow-500" : 
                            currentSeason === "fall" ? "bg-orange-500" : 
                            "bg-blue-500"
                          }`}
                          style={{ width: `${(seasonDay / seasonLength) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="border border-[#333] p-3 bg-[#111]">
                      <div className="text-sm text-white mb-2 flex items-center">
                        {weatherEffects[currentWeather].icon}
                        <span className="ml-2">{weatherEffects[currentWeather].label} Weather</span>
                      </div>
                      
                      <div className="text-xs text-white/60">
                        {currentWeather === "sunny" && "Perfect for sun-loving crops like tomatoes."}
                        {currentWeather === "rainy" && "Great for thirsty crops like carrots and lettuce."}
                        {currentWeather === "cloudy" && "Moderate growth for most plants."}
                        {currentWeather === "windy" && "Some plants like cabbage thrive in wind."}
                        {currentWeather === "stormy" && "Most crops grow slower in storms."}
                      </div>
                    </div>
                    
                    <div className="mt-4 border border-[#333] p-3 bg-[#111]">
                      <div className="text-sm text-white mb-2">Seasonal Crops</div>
                      <div className="grid grid-cols-2 gap-2">
                        {seeds
                          .filter(seed => seed.bestSeason === currentSeason)
                          .map(seed => (
                            <div 
                              key={seed.type} 
                              className="flex items-center p-1 border border-[#333] bg-black"
                            >
                              <div className="mr-1 w-5 h-5 flex justify-center items-center">
                                {getSeedIcon(seed.type)}
                              </div>
                              <span className="text-xs text-white truncate">{seed.name}</span>
                            </div>
                          ))
                        }
                      </div>
                      {seeds.filter(seed => seed.bestSeason === currentSeason).length === 0 && (
                        <div className="text-xs text-white/60 text-center py-2">
                          No crops prefer this season
                          <div className="mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (typeof window !== "undefined") {
                                  // Reset seed data in localStorage
                                  localStorage.removeItem("seeds");
                                  
                                  // Show reload message
                                  toast.success("Seed data has been reset. Refresh the page for changes to take effect.", {
                                    duration: 5000
                                  });
                                  
                                  // Log debug info
                                  console.log("Current seeds:", seeds);
                                  console.log("Current season:", currentSeason);
                                  console.log("Seeds for current season:", seeds.filter(s => s.bestSeason === currentSeason));
                                }
                              }}
                              className="bg-transparent text-white border-[#333] rounded-none hover:bg-[#222] text-xs"
                            >
                              Fix Seasonal Crops
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Farm grid */}
              <div className="lg:col-span-2">
                <div className="noot-card relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-[#111] opacity-50"
                  ></div>
                  
                  {/* Weather effects */}
                  {currentWeather === "rainy" && <RainEffect />}
                  {currentWeather === "sunny" && <SunshineEffect />}
                  {currentWeather === "cloudy" && <CloudyEffect />}
                  {currentWeather === "windy" && <WindEffect />}
                  {currentWeather === "stormy" && <StormEffect />}
                  {currentSeason === "winter" && <SnowEffect />}
                  
                  {/* Season overlay */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0" 
                    style={{ 
                      backgroundColor: 
                        currentSeason === "spring" ? "rgba(74, 222, 128, 0.05)" : 
                        currentSeason === "summer" ? "rgba(250, 204, 21, 0.05)" : 
                        currentSeason === "fall" ? "rgba(249, 115, 22, 0.05)" : 
                        "rgba(96, 165, 250, 0.05)"
                    }}
                  ></div>
                  
                  {/* Particle effect for crop ready */}
                  {showParticles && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      {[...Array(20)].map((_, i) => (
                        <div 
                          key={i}
                          className="absolute animate-float"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 2}s`
                          }}
                        >
                          <Sparkles className="text-yellow-400 h-4 w-4" />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Harvest animation */}
                  {harvestAnimation && (
                    <div 
                      className="reward-text"
                      style={{
                        left: `${(harvestAnimation.plotIndex % farmSize) * (100 / farmSize) + 16.5}%`,
                        top: `${Math.floor(harvestAnimation.plotIndex / farmSize) * (100 / farmSize) + 16.5}%`
                      }}
                    >
                      +{harvestAnimation.amount}
                    </div>
                  )}
                  
                  <div className="p-6 relative z-1">
                    <div className={`grid grid-cols-${farmSize} gap-4`} style={{ gridTemplateColumns: `repeat(${farmSize}, minmax(0, 1fr))` }}>
                      {gamePlots.slice(0, farmSize * farmSize).map((plot, index) => (
                        <div 
                          key={index}
                          onClick={() => handlePlotClick(index)}
                          className="relative aspect-square hover:cursor-pointer overflow-hidden hoverable border border-[#333]"
                        >
                          <FarmPlot
                            id={`plot-${index}`}
                            plot={plot}
                            onPlant={() => {}}
                            onHarvest={() => {}}
                          />
                          
                          {/* Ready indicator */}
                          {plot.status === "ready" && (
                            <div className="absolute top-2 right-2 bg-white p-1">
                              <CircleCheck className="h-4 w-4 text-black" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Farm expansion button */}
                    {farmSize < 6 ? (
                      <div className="mt-4 border border-[#333] p-3 bg-black/70">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-white text-sm">Farm Size: {farmSize}×{farmSize}</div>
                          <div className="text-white/60 text-xs">
                            Next: {farmSize + 1}×{farmSize + 1}
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => {
                            const requiredLevel = farmSize + 2;
                            if (playerLevel < requiredLevel) {
                              // Show error alert
                              setExpansionError({
                                show: true,
                                type: 'level',
                                message: `You need to be level ${requiredLevel} to expand your farm! (${requiredLevel - playerLevel} more level${requiredLevel - playerLevel > 1 ? 's' : ''} needed)`
                              });
                              
                              // Also show toast for redundancy
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
                              return;
                            }
                            
                            if (farmCoins < 100) {
                              // Show error alert
                              setExpansionError({
                                show: true,
                                type: 'coins',
                                message: `You need 100 coins to expand your farm! (${100 - farmCoins} more coins needed)`
                              });
                              
                              // Also show toast for redundancy
                              toast.error(`NOT ENOUGH COINS: You need 100 coins to expand your farm! (${100 - farmCoins} more coins needed)`, {
                                duration: 5000,
                                style: {
                                  background: '#300',
                                  color: '#fff',
                                  border: '1px solid #f00',
                                  padding: '16px',
                                  fontWeight: 'bold',
                                },
                                icon: '💰',
                              });
                              return;
                            }
                            
                            expandFarm();
                            toast.success(`Farm expanded to ${farmSize + 1}×${farmSize + 1}!`, {
                              icon: '✅',
                              style: {
                                background: '#030',
                                color: '#fff',
                                padding: '16px',
                                fontWeight: 'bold',
                              }
                            });
                          }}
                          className={`w-full bg-white text-black hover:bg-white/90 border-0 rounded-none flex items-center justify-center gap-2 ${
                            playerLevel < farmSize + 2 ? 'relative overflow-hidden' : ''
                          }`}
                        >
                          {/* Level lock indicator */}
                          {playerLevel < farmSize + 2 && (
                            <>
                              <div className="absolute inset-0 bg-red-500/10 pointer-events-none pulse-red"></div>
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-bl-md text-xs flex items-center">
                                <LockIcon className="h-3 w-3 mr-1" />
                                <span>Level {farmSize + 2}</span>
                              </div>
                            </>
                          )}
                          <Sprout className="h-4 w-4" />
                          Expand Farm (100 <Coins className="h-3 w-3 inline" />)
                        </Button>
                        
                        <div className="mt-2 text-white/60 text-xs flex justify-between">
                          <span>Required Level: {farmSize + 2}</span>
                          <span>Cost: 100 coins</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 border border-[#333] p-3 bg-black/70">
                        <div className="flex justify-between items-center">
                          <div className="text-white text-sm">Farm Size: {farmSize}×{farmSize}</div>
                          <div className="flex items-center text-green-500 text-xs">
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Maximum Size
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Animals Tab */}
        {activeTab === "animals" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Barn Section */}
            <div className="noot-card">
              <div className="border-b border-[#333] p-4">
                <h2 className="noot-header flex items-center text-white noot-title">
                  <span className="mr-2 text-xl">🏡</span>
                  Your Animals
                </h2>
                <p className="text-white/60 text-sm noot-text">
                  Care for your animals to collect their products
                </p>
                
                {/* Add action buttons for animals */}
                {animals.length > 0 && (
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={handleCollectAllAnimals}
                      className="px-3 py-1.5 bg-white text-black hover:bg-white/90 border-0 rounded-none text-sm font-medium noot-text flex items-center"
                    >
                      <span className="mr-1">🧺</span>
                      Collect All
                    </button>
                    <button
                      onClick={handleFeedAllAnimals}
                      className="px-3 py-1.5 bg-white text-black hover:bg-white/90 border-0 rounded-none text-sm font-medium noot-text flex items-center"
                    >
                      <span className="mr-1">🌾</span>
                      Feed All
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4">
                {animals.length === 0 ? (
                  <div className="text-center text-white/60 p-10">
                    <div className="text-5xl mb-4 opacity-50">🐄</div>
                    <p>You don't have any animals yet</p>
                    <p className="text-xs mt-2">Buy animals from the market below</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {animals.map((animal, index) => (
                      <div 
                        key={`${animal.type}-${index}`} 
                        className="border border-[#333] bg-[#111] overflow-hidden"
                      >
                        <div className="p-3 border-b border-[#333] flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-3xl mr-3">{animal.icon}</div>
                            <div>
                              <div className="text-white font-medium">{animal.name}</div>
                              <div className="text-white/60 text-xs">Produces: {getProductIcon(animal.productType)} {getProductName(animal.productType)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm ${animal.fed ? "text-green-500" : "text-red-500"}`}>
                              {animal.fed ? "Fed" : "Hungry"}
                            </div>
                            <div className="w-20 h-1.5 bg-[#222] mt-1">
                              <div 
                                className="h-full bg-white"
                                style={{ 
                                  width: `${animal.happiness}%`,
                                  backgroundColor: animal.happiness > 70 ? '#4ade80' : 
                                                  animal.happiness > 40 ? '#facc15' : '#ef4444'
                                }}
                              />
                            </div>
                            <div className="text-xs text-white/60 mt-0.5">
                              Happiness: {animal.happiness}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 flex justify-between items-center">
                          <div>
                            <div className="text-white/70 text-xs">
                              {animal.readyAt && Date.now() >= animal.readyAt 
                                ? <span className="text-green-500 font-medium">Ready to collect!</span>
                                : `Ready in: ${getAnimalTimeRemaining(animal.readyAt)}`
                              }
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => feedAnimal(index)}
                              disabled={animal.fed}
                              className={`bg-white text-black hover:bg-white/90 border-0 rounded-none h-7 px-3 py-0 ${animal.fed ? 'opacity-50' : ''}`}
                              size="sm"
                            >
                              <span className="mr-1">🍽️</span>
                              Feed
                            </Button>
                            <Button 
                              onClick={() => collectAnimalProduct(index)}
                              disabled={!animal.readyAt || Date.now() < animal.readyAt}
                              className={`bg-white text-black hover:bg-white/90 border-0 rounded-none h-7 px-3 py-0 ${(!animal.readyAt || Date.now() < animal.readyAt) ? 'opacity-50' : ''}`}
                              size="sm"
                            >
                              <span className="mr-1">📦</span>
                              Collect
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Buy Animals & Products Section */}
            <div className="grid grid-cols-1 gap-6">
              {/* Animal Market */}
              <div className="noot-card">
                <div className="border-b border-[#333] p-4">
                  <h2 className="noot-header flex items-center text-white noot-title">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Animal Market
                  </h2>
                  <p className="text-white/60 text-sm noot-text">
                    Expand your farm with livestock
                  </p>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Cow */}
                    <div 
                      onClick={() => buyAnimal("cow")}
                      className={`border ${farmCoins >= 200 ? 'border-[#333] hover:border-white cursor-pointer' : 'border-[#333] opacity-50 cursor-not-allowed'} bg-black p-3 transition-all`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="text-4xl mb-2">🐄</div>
                        <div className="text-white font-medium mb-1">Cow</div>
                        <div className="text-white/60 text-xs mb-3">Produces milk</div>
                        <div className="flex items-center text-yellow-500 text-sm">
                          <Coins className="h-3 w-3 mr-1" />
                          <span>200</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chicken */}
                    <div 
                      onClick={() => buyAnimal("chicken")}
                      className={`border ${farmCoins >= 100 ? 'border-[#333] hover:border-white cursor-pointer' : 'border-[#333] opacity-50 cursor-not-allowed'} bg-black p-3 transition-all`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="text-4xl mb-2">🐔</div>
                        <div className="text-white font-medium mb-1">Chicken</div>
                        <div className="text-white/60 text-xs mb-3">Produces eggs</div>
                        <div className="flex items-center text-yellow-500 text-sm">
                          <Coins className="h-3 w-3 mr-1" />
                          <span>100</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sheep */}
                    <div 
                      onClick={() => buyAnimal("sheep")}
                      className={`border ${farmCoins >= 250 ? 'border-[#333] hover:border-white cursor-pointer' : 'border-[#333] opacity-50 cursor-not-allowed'} bg-black p-3 transition-all`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="text-4xl mb-2">🐑</div>
                        <div className="text-white font-medium mb-1">Sheep</div>
                        <div className="text-white/60 text-xs mb-3">Produces wool</div>
                        <div className="flex items-center text-yellow-500 text-sm">
                          <Coins className="h-3 w-3 mr-1" />
                          <span>250</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-[#333] p-3 mt-4 bg-[#111]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">Your Coins</span>
                      <div className="flex items-center">
                        <Coins className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-white">{farmCoins}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Animal Products Inventory */}
              <div className="noot-card">
                <div className="border-b border-[#333] p-4">
                  <h2 className="noot-header flex items-center text-white noot-title">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Animal Products
                  </h2>
                  <p className="text-white/60 text-sm noot-text">
                    Sell your collected animal products
                  </p>
                </div>
                <div className="p-4">
                  {Object.keys(animalProductInventory).length === 0 ? (
                    <div className="text-center text-white/60 p-10">
                      <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>No animal products in inventory</p>
                      <p className="text-xs mt-2">Collect products from your animals first</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {Object.entries(animalProductInventory).map(([productType, product]) => (
                          <div 
                            key={productType} 
                            className="flex items-center justify-between p-3 border border-[#333] bg-[#111]"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 flex items-center justify-center text-2xl mr-3">
                                {getProductIcon(productType)}
                              </div>
                              <div>
                                <div className="text-white text-sm">{getProductName(productType)}</div>
                                <div className="text-white/60 text-xs">Qty: {product.count}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-white text-sm flex items-center">
                                <Coins className="h-3 w-3 mr-1 text-yellow-500" />
                                <span>{product.marketValue}</span>
                              </div>
                              <Button 
                                onClick={() => {
                                  sellAnimalProduct(productType, 1);
                                  toast.success(`Sold 1 ${getProductName(productType)} for ${product.marketValue} coins!`);
                                }}
                                className="bg-white text-black hover:bg-white/90 border-0 rounded-none h-7 px-2 py-0"
                                size="sm"
                              >
                                Sell
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        onClick={() => sellAllAnimalProducts()}
                        className="w-full mt-4 bg-white text-black hover:bg-white/90 border-0 rounded-none"
                        size="sm"
                      >
                        Sell All Products
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Crafting Tab */}
        {activeTab === "crafting" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Crafting Workshop */}
            <div className="noot-card">
              <div className="border-b border-[#333] p-4">
                <h2 className="noot-header flex items-center text-white noot-title">
                  <Hammer className="h-5 w-5 mr-2" />
                  Crafting Workshop
                </h2>
                <p className="text-white/60 text-sm noot-text">
                  Create valuable items from your raw materials
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {craftableItems.map((item) => (
                    <div 
                      key={item.type} 
                      className="p-4 border border-[#333] bg-[#111] hover:border-white transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-10 h-10 border border-[#333] flex items-center justify-center text-2xl mr-3 bg-black">
                            {item.icon}
                          </div>
                          <div>
                            <div className="text-white noot-text font-medium">{item.name}</div>
                            <div className="flex items-center text-white/60 text-xs">
                              <CircleDollarSign className="h-3 w-3 mr-1 text-yellow-500" />
                              <span>Sells for {item.marketValue} coins</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => craftItem(item.type)}
                          className="bg-white text-black hover:bg-white/90 border-0 rounded-none"
                          size="sm"
                        >
                          Craft
                        </Button>
                      </div>
                      
                      <div className="mt-2">
                        <div className="text-xs text-white/60 mb-1">Ingredients:</div>
                        <div className="flex flex-wrap gap-2">
                          {item.ingredients.map((ingredient, idx) => {
                            const isAvailable = ingredient.isAnimalProduct
                              ? animalProductInventory[ingredient.type] && animalProductInventory[ingredient.type].count >= ingredient.count
                              : cropInventory[ingredient.type] && cropInventory[ingredient.type].count >= ingredient.count;
                            
                            return (
                              <div 
                                key={`${item.type}-${ingredient.type}-${idx}`} 
                                className={`text-xs px-2 py-1 border ${isAvailable ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}
                              >
                                {ingredient.count}x {ingredient.isAnimalProduct 
                                  ? animalProducts.find(p => p.type === ingredient.type)?.name || ingredient.type
                                  : seeds.find(s => s.type === ingredient.type)?.name || ingredient.type
                                }
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Crafted Items Inventory */}
            <div className="noot-card">
              <div className="border-b border-[#333] p-4">
                <h2 className="noot-header flex items-center text-white noot-title">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Crafted Items
                </h2>
                <p className="text-white/60 text-sm noot-text">
                  Sell your crafted items for profits
                </p>
              </div>
              <div className="p-4">
                {Object.keys(craftedItemInventory).length === 0 ? (
                  <div className="text-center text-white/60 p-10">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No crafted items in inventory</p>
                    <p className="text-xs mt-2">Craft items from the workshop to see them here</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {Object.entries(craftedItemInventory).map(([itemType, item]) => (
                        <div 
                          key={itemType} 
                          className="flex items-center justify-between p-3 border border-[#333] bg-[#111]"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 flex items-center justify-center text-2xl mr-3">
                              {getCraftedItemIcon(itemType)}
                            </div>
                            <div>
                              <div className="text-white text-sm">{getCraftedItemName(itemType)}</div>
                              <div className="text-white/60 text-xs">Qty: {item.count}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-white text-sm flex items-center">
                              <CircleDollarSign className="h-3 w-3 mr-1 text-yellow-500" />
                              <span>{item.marketValue}</span>
                            </div>
                            <Button 
                              onClick={() => {
                                sellCraftedItem(itemType, 1);
                              }}
                              className="bg-white text-black hover:bg-white/90 border-0 rounded-none h-7 px-2 py-0"
                              size="sm"
                            >
                              Sell
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={() => {
                        sellAllCraftedItems();
                      }}
                      className="w-full mt-4 bg-white text-black hover:bg-white/90 border-0 rounded-none"
                      size="sm"
                    >
                      Sell All Crafted Items
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Token Swap Tab */}
        {activeTab === "swap" && (
          <div className="animate-fadeIn w-full">
            <div className="noot-card">
              <div className="border-b border-[#333] p-4">
                <h2 className="noot-header flex items-center text-white noot-title">
                  <ArrowRightLeft className="h-5 w-5 mr-2" />
                  Token Swap
                </h2>
                <p className="text-white/60 text-sm noot-text">
                  Swap your Farm Coins for $NOOT tokens
                </p>
              </div>
              <div className="p-4">
                <TokenSwap />
              </div>
            </div>
          </div>
        )}
        
        {/* Quests Tab */}
        {activeTab === "quests" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Daily Quests */}
            <div className="noot-card">
              <div className="border-b border-[#333] p-4">
                <h2 className="noot-header flex items-center text-white noot-title">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Daily Quests
                </h2>
                <p className="text-white/60 text-sm noot-text">
                  Resets every 24 hours
                </p>
              </div>
              <div className="p-4">
                {dailyQuests.map(quest => (
                  <div key={quest.id} className="flex items-center justify-between p-3 border border-[#333] mb-2 bg-[#111] noot-text">
                    <div className="flex items-center">
                      <div className="w-8 h-8 border border-[#333] flex items-center justify-center mr-3">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-white">{quest.title}</div>
                        <div className="text-white/60 text-xs">{quest.description}</div>
                        <div className="w-full h-1 bg-[#222] mt-1">
                          <div 
                            className="h-full bg-white"
                            style={{ width: `${quest.progress * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-white">
                      <Coins className="h-4 w-4 mr-1 text-white" />
                      {quest.reward}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Weekly Quests */}
            <div className="noot-card">
              <div className="border-b border-[#333] p-4">
                <h2 className="noot-header flex items-center text-white noot-title">
                  <Trophy className="h-5 w-5 mr-2" />
                  Weekly Quests
                </h2>
                <p className="text-white/60 text-sm noot-text">
                  Resets every 7 days
                </p>
              </div>
              <div className="p-4">
                {weeklyQuests.map(quest => (
                  <div key={quest.id} className="flex items-center justify-between p-3 border border-[#333] mb-2 bg-[#111] noot-text">
                    <div className="flex items-center">
                      <div className="w-8 h-8 border border-[#333] flex items-center justify-center mr-3">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-white">{quest.title}</div>
                        <div className="text-white/60 text-xs">{quest.description}</div>
                        <div className="w-full h-1 bg-[#222] mt-1">
                          <div 
                            className="h-full bg-white"
                            style={{ width: `${quest.progress * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-white">
                      <Coins className="h-4 w-4 mr-1 text-white" />
                      {quest.reward}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Market Tab */}
        {activeTab === "market" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Buy Seeds Section */}
            <div className="noot-card">
              <div className="border-b border-[#333] p-4">
                <h2 className="noot-header flex items-center text-white noot-title">
                  <Store className="h-5 w-5 mr-2" />
                  Buy Seeds
                </h2>
                <p className="text-white/60 text-sm noot-text">
                  Stock up on seeds to plant in your farm
                </p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 mb-4 max-h-[280px] overflow-y-auto pr-1">
                  {seeds.map((seed) => (
                    <div
                      key={seed.type}
                      onClick={() => {
                        if (farmCoins >= seed.cost) {
                          addFarmCoins(-seed.cost);
                          toast.success(`Purchased ${seed.name} seed!`);
                          setSelectedSeed(seed);
                        } else {
                          toast.error("Not enough coins!");
                        }
                      }}
                      className={`aspect-square flex flex-col items-center justify-center p-2 border transition-all duration-200 cursor-pointer 
                        ${farmCoins < seed.cost ? "opacity-50 cursor-not-allowed" : "bg-black border-[#333] hover:border-white"}
                        ${seed.bestSeason === currentSeason ? "border-2 border-yellow-500" : ""}
                      `}
                    >
                      <div className="w-10 h-10 border border-[#333] flex items-center justify-center text-lg font-bold text-white mb-1 bg-black">
                        {getSeedIcon(seed.type)}
                      </div>
                      <span className="text-xs font-medium text-white truncate max-w-full">{seed.name}</span>
                      <div className="mt-1 flex items-center justify-center bg-[#111] border border-[#333] px-2 py-0.5">
                        <CircleDollarSign className="text-white w-3 h-3 mr-0.5" />
                        <span className="text-xs text-white">{seed.cost}</span>
                      </div>
                      {seed.bestSeason === currentSeason && (
                        <div className={`mt-1 text-xs ${seasonColors[currentSeason]}`}>
                          In Season
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="border border-[#333] p-3 mt-4 bg-[#111]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">Your Coins</span>
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-white">{farmCoins}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sell Crops Section */}
            <div className="noot-card">
              <div className="border-b border-[#333] p-4">
                <h2 className="noot-header flex items-center text-white noot-title">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Sell Crops
                </h2>
                <p className="text-white/60 text-sm noot-text">
                  Sell your harvested crops for coins
                </p>
              </div>
              <div className="p-4">
                {Object.keys(cropInventory).length === 0 ? (
                  <div className="text-center text-white/60 p-10">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No crops in inventory</p>
                    <p className="text-xs mt-2">Harvest crops from your farm to sell them here</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {Object.entries(cropInventory).map(([cropType, crop]) => (
                        <div 
                          key={cropType} 
                          className="flex items-center justify-between p-3 border border-[#333] bg-[#111]"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 border border-[#333] flex items-center justify-center text-lg mr-3 bg-black">
                              {getSeedIcon(cropType)}
                            </div>
                            <div>
                              <div className="text-white text-sm">{getCropName(cropType)}</div>
                              <div className="text-white/60 text-xs">Qty: {crop.count}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-white text-sm flex items-center">
                              <CircleDollarSign className="h-3 w-3 mr-1 text-yellow-500" />
                              <span>{crop.marketValue}</span>
                            </div>
                            <Button 
                              onClick={() => {
                                sellCrop(cropType, 1);
                                toast.success(`Sold 1 ${getCropName(cropType)} for ${crop.marketValue} coins!`);
                              }}
                              className="bg-white text-black hover:bg-white/90 border-0 rounded-none h-7 px-2 py-0"
                              size="sm"
                            >
                              Sell
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={() => {
                        sellAllCrops();
                        toast.success("Sold all crops!");
                      }}
                      className="w-full mt-4 bg-white text-black hover:bg-white/90 border-0 rounded-none"
                      size="sm"
                    >
                      Sell All Crops
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Social Tab */}
        {activeTab === "social" && (
          <div className="noot-card animate-fadeIn">
            <div className="border-b border-[#333] p-4">
              <h2 className="noot-header flex items-center text-white noot-title">
                <Users className="h-5 w-5 mr-2" />
                Social Hub
              </h2>
              <p className="text-white/60 text-sm noot-text">
                Connect with other farmers
              </p>
            </div>
            <div className="p-8 flex flex-col items-center justify-center">
              <p className="text-white/60 text-center noot-text">Social features coming soon!</p>
              <div className="grid grid-cols-1 gap-2 mt-6 w-full max-w-md">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="border border-[#333] bg-[#111] p-4 flex items-center">
                    <div className="w-10 h-10 border border-[#333] rounded-full flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-white/50" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-[#222] w-3/4 mb-2"></div>
                      <div className="h-2 bg-[#222] w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="animate-fadeIn" key={`profile-${profileVersion}`}>
            <div className="noot-card">
              <div className="border-b border-[#333] p-4">
                <h2 className="noot-header flex items-center text-white noot-title">
                  <User className="h-5 w-5 mr-2" />
                  Farmer Profile
                </h2>
                <p className="text-white/60 text-sm noot-text">
                  Your farming identity
                </p>
              </div>
              <div className="p-4">
                {editingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white mb-1">Nickname</label>
                      <input 
                        type="text" 
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full bg-[#111] border border-[#333] p-2 text-white noot-text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white mb-1">Bio</label>
                      <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-[#111] border border-[#333] p-2 text-white noot-text h-24"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 border border-[#333] flex items-center justify-center mr-4">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg text-white font-bold">{nickname}</h3>
                        <div className="flex items-center text-white/60 text-sm gap-2">
                          <div className="w-6 h-6 rounded-none bg-white text-black flex items-center justify-center text-xs font-medium noot-title level-indicator">
                            {typeof window !== 'undefined' ? clientPlayerLevel : 0}
                          </div>
                          <span>Farmer</span>
                        </div>
                      </div>
                    </div>
                    <div className="border border-[#333] p-3 bg-[#111] text-white/80 mb-4">
                      <p>{bio}</p>
                    </div>
                    
                    {/* XP Progress Bar */}
                    <div className="mt-4 relative">
                      <div className="flex justify-between text-sm text-white/60 mb-1">
                        <span>Level Progress</span>
                        <span>{typeof window !== 'undefined' ? clientDisplayXp : 0} / {typeof window !== 'undefined' ? clientXpToNext : 100} XP</span>
                      </div>
                      <div className="flex h-6 bg-black border border-[#333] overflow-hidden">
                        <div className="w-6 h-6 rounded-none bg-white text-black flex items-center justify-center text-xs font-medium noot-title shrink-0 level-indicator">
                          {typeof window !== 'undefined' ? clientPlayerLevel : 0}
                        </div>
                        <span className="px-1 text-white text-xs noot-text whitespace-nowrap">Level</span>
                        <div className="flex-1 bg-[#111] h-full relative">
                          <div 
                            className="h-full bg-white absolute top-0 left-0 xp-progress-bar"
                            style={{ width: `${Math.max(Math.min(((typeof window !== 'undefined' ? clientDisplayXp : 0) / (typeof window !== 'undefined' ? clientXpToNext : 100)) * 100, 100), 0)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* XP gain animation container */}
                    {xpGainAnimation.show && (
                      <div className="text-right mt-1 text-xs text-green-400 animate-float-up">
                        +{xpGainAnimation.amount} XP
                      </div>
                    )}
                  </div>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    if (editingProfile) {
                      // Save profile with our dedicated function
                      const saveSuccessful = saveProfileData(nickname, bio);
                      // Only exit edit mode if save was successful
                      if (saveSuccessful) {
                        // Directly update profile for immediate reflection
                        updateProfile(nickname, bio);
                        setEditingProfile(false);
                      }
                    } else {
                      setEditingProfile(true);
                    }
                  }}
                  className="mt-4 w-full bg-white text-black border-0 rounded-none hover:bg-white/90 noot-text"
                >
                  {editingProfile ? "Save Profile" : "Edit Profile"}
                </Button>
              </div>
            </div>
            
            {/* Farming statistics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="noot-card">
                <div className="border-b border-[#333] p-4">
                  <h2 className="noot-header flex items-center text-white noot-title">
                    <Trophy className="h-5 w-5 mr-2" />
                    Farming Statistics
                  </h2>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="border border-[#333] p-3">
                      <div className="text-sm text-white/60">Farms Created</div>
                      <div className="text-xl text-white font-bold">1</div>
                    </div>
                    <div className="border border-[#333] p-3">
                      <div className="text-sm text-white/60">Crops Harvested</div>
                      <div className="text-xl text-white font-bold">{cropsHarvested}</div>
                    </div>
                    <div className="border border-[#333] p-3">
                      <div className="text-sm text-white/60">Farm Coins</div>
                      <div className="text-xl text-white font-bold">{farmCoins}</div>
                    </div>
                    <div className="border border-[#333] p-3">
                      <div className="text-sm text-white/60">Total XP</div>
                      <div className="text-xl text-white font-bold">{playerXp}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="noot-card">
                <div className="border-b border-[#333] p-4">
                  <h2 className="noot-header flex items-center text-white noot-title">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Achievements
                  </h2>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="border border-[#333] p-3 flex items-center">
                      <Sparkles className="h-5 w-5 mr-3 text-yellow-500" />
                      <span className="text-white">First Harvest</span>
                    </div>
                    <div className="border border-[#333] p-3 flex items-center">
                      <Sparkles className="h-5 w-5 mr-3 text-yellow-500" />
                      <span className="text-white">100 Coins Collected</span>
                    </div>
                    <div className="border border-[#333] p-3 flex items-center opacity-50">
                      <LockIcon className="h-5 w-5 mr-3 text-white" />
                      <span className="text-white">Weather Master - Plant during all weather types</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Boosters Tab */}
        {activeTab === "boosters" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Boosters Store */}
            <div className="noot-card">
              <div className="border-b border-[#333] p-4">
                <h2 className="noot-header flex items-center text-white noot-title">
                  <Rocket className="h-5 w-5 mr-2" />
                  Boosters Store
                </h2>
                <p className="text-white/60 text-sm noot-text">
                  Buy fertilizers and growth accelerators to enhance your crops
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {boosters.map((booster) => (
                    <div 
                      key={booster.type} 
                      className="p-4 border border-[#333] bg-[#111] hover:border-white transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-10 h-10 border border-[#333] flex items-center justify-center text-2xl mr-3 bg-black">
                            {booster.icon}
                          </div>
                          <div>
                            <div className="text-white noot-text font-medium">{booster.name}</div>
                            <div className="text-white/60 text-xs mb-1">{booster.description}</div>
                            <div className="text-white/60 text-xs">Duration: {booster.duration} minutes</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center text-yellow-500 mb-1">
                            <CircleDollarSign className="h-3 w-3 mr-1" />
                            <span>{booster.cost}</span>
                          </div>
                          <Button 
                            onClick={() => buyBooster(booster.type)}
                            className="bg-white text-black hover:bg-white/90 border-0 rounded-none"
                            size="sm"
                            disabled={farmCoins < booster.cost}
                          >
                            Buy
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Your Boosters */}
            <div className="noot-card">
              <div className="border-b border-[#333] p-4">
                <h2 className="noot-header flex items-center text-white noot-title">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Your Boosters
                </h2>
                <p className="text-white/60 text-sm noot-text">
                  Apply boosters to crops when harvesting for increased yields
                </p>
              </div>
              <div className="p-4">
                {Object.keys(ownedBoosters).length === 0 ? (
                  <div className="text-center text-white/60 p-10">
                    <Rocket className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No boosters in inventory</p>
                    <p className="text-xs mt-2">Purchase boosters from the store to enhance your crops</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {Object.entries(ownedBoosters).map(([boosterType, count]) => {
                        const booster = boosters.find(b => b.type === boosterType);
                        if (!booster || count <= 0) return null;
                        
                        return (
                          <div 
                            key={boosterType} 
                            className="flex items-center justify-between p-3 border border-[#333] bg-[#111]"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 flex items-center justify-center text-2xl mr-3">
                                {booster.icon}
                              </div>
                              <div>
                                <div className="text-white text-sm">{booster.name}</div>
                                <div className="text-white/60 text-xs mb-1">
                                  {booster.effect.type === "growth" 
                                    ? `Growth speed: ${Math.floor((1 - booster.effect.multiplier) * 100)}% faster` 
                                    : `Yield bonus: +${Math.floor((booster.effect.multiplier - 1) * 100)}%`}
                                </div>
                                <div className="text-white/60 text-xs">Qty: {count}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 p-3 border border-[#333] bg-[#111]">
                      <h3 className="text-white mb-2">How to use boosters:</h3>
                      <ol className="text-white/60 text-sm list-decimal pl-5 space-y-1">
                        <li>Plant a crop in your farm</li>
                        <li>Click on a growing crop</li>
                        <li>Select a booster to apply</li>
                        <li>Growth boosters work immediately</li>
                        <li>Yield boosters apply when harvesting</li>
                      </ol>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Defend Farm Tab */}
        {activeTab === "defend" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
              Defend Your Farm
            </h2>
            
            <div className="noot-card p-1">
              {isClient && (
                <FarmGame 
                  farmCoins={farmCoins} 
                  addFarmCoins={addFarmCoins}
                />
              )}
              {!isClient && (
                <div className="w-full h-[600px] flex items-center justify-center bg-black/20">
                  <div className="text-white text-center">
                    <div className="mb-4">Loading farm defense...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <footer className="bg-black border-t border-[#333] py-3 px-4" key={`footer-${profileVersion}`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm text-white/60">
            Nooter's Farm - First CTO on Abstract
          </div>
          
          <div className="flex items-center gap-2">
            {/* XP Progress */}
            <div className="border border-[#333] h-6 flex items-center text-white text-xs noot-text overflow-hidden" style={{ width: '180px' }}>
              <div className="w-5 h-5 rounded-none bg-white text-black flex items-center justify-center text-xs font-medium noot-title shrink-0 level-indicator">
                {typeof window !== 'undefined' ? clientPlayerLevel : 0}
              </div>
              <div className="flex-1 relative h-full">
                <div 
                  className="h-full bg-white/20 absolute top-0 left-0 xp-progress-bar"
                  style={{ width: `${Math.max(Math.min(((typeof window !== 'undefined' ? clientDisplayXp : 0) / (typeof window !== 'undefined' ? clientXpToNext : 100)) * 100, 100), 0)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-center whitespace-nowrap px-1 text-white/80">
                  {typeof window !== 'undefined' ? clientDisplayXp : 0}/{typeof window !== 'undefined' ? clientXpToNext : 100} XP
                </div>
              </div>
            </div>
            
            {/* Coins display */}
            <div className="border border-[#333] px-2 py-1 flex items-center gap-1 text-white text-sm noot-text">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>{farmCoins}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}