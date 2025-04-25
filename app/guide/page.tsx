"use client";

import { useContext } from "react";
import Link from "next/link";
import { GameContext } from "@/context/game-context";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, BookOpen, Clock, Star, Zap, Sprout, Flower, LineChart, Users, ShoppingBag, 
    Sun, CloudRain, Cloud, Wind, CloudLightning, Home, Hammer, Rocket, Shield, Coins, 
    ArrowRightLeft, Calendar, Trophy, CircleCheck, CircleDollarSign
} from "lucide-react";

// Helper function to format time (e.g., from minutes to hours/minutes)
const formatTime = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
};

// Define an interface for the structure of the example seed data
interface ExampleSeedData {
  type: string;
  name: string;
  levelUnlock: number;
  growthTime: number;
  xp: number;
  cost: number;
  reward: number;
  bestSeason: string;
  weatherBonus: string[];
}

export default function GuidePage() {
  const { 
    playerLevel, 
    playerXp,
    playerXpToNext,
    farmSize,
    animals: animalTypes,
    animalProducts,
    craftableItems,
    boosters,
    currentSeason,
    currentWeather,
    seasonDay,
    seasonLength
  } = useContext(GameContext);

  // GuidePage always uses the static example data for tables
  const exampleSeeds: ExampleSeedData[] = [
    { type: "carrot", name: "Carrot", levelUnlock: 5, growthTime: 240, xp: 8, cost: 5, reward: 8, bestSeason: 'spring', weatherBonus: ['rainy'] },
    { type: "radish", name: "Radish", levelUnlock: 13, growthTime: 360, xp: 14, cost: 13, reward: 13, bestSeason: 'spring', weatherBonus: ['cloudy'] },
    { type: "broccoli", name: "Broccoli", levelUnlock: 15, growthTime: 600, xp: 25, cost: 15, reward: 18, bestSeason: 'fall', weatherBonus: ['cloudy'] },
    { type: "corn", name: "Corn", levelUnlock: 24, growthTime: 720, xp: 32, cost: 24, reward: 40, bestSeason: 'summer', weatherBonus: ['sunny'] },
    { type: "eggplant", name: "Aubergine", levelUnlock: 28, growthTime: 900, xp: 40, cost: 28, reward: 42, bestSeason: 'summer', weatherBonus: [] },
    { type: "tomato", name: "Tomatoes", levelUnlock: 30, growthTime: 960, xp: 45, cost: 30, reward: 50, bestSeason: 'summer', weatherBonus: ['sunny'] },
    { type: "zucchini", name: "Zucchini", levelUnlock: 35, growthTime: 1200, xp: 50, cost: 32, reward: 55, bestSeason: 'summer', weatherBonus: [] },
    { type: "pear", name: "Pear", levelUnlock: 80, growthTime: 2400, xp: 150, cost: 80, reward: 160, bestSeason: 'fall', weatherBonus: ['sunny'] },
  ];

  const exampleAnimalTypes = animalTypes || [
    { type: 'cow', name: 'Cow', icon: '🐄', cost: 200, productType: 'milk', productionTime: 120 }, // 2 hours
    { type: 'chicken', name: 'Chicken', icon: '🐔', cost: 100, productType: 'egg', productionTime: 60 }, // 1 hour
    { type: 'sheep', name: 'Sheep', icon: '🐑', cost: 250, productType: 'wool', productionTime: 180 }, // 3 hours
  ];

  const exampleAnimalProducts = animalProducts || [
    { type: 'milk', name: 'Milk', icon: '🥛', marketValue: 20 },
    { type: 'egg', name: 'Egg', icon: '🥚', marketValue: 10 },
    { type: 'wool', name: 'Wool', icon: '🧶', marketValue: 30 },
  ];

  const exampleCraftableItems = craftableItems || [
    { type: 'bread', name: 'Bread', icon: '🍞', ingredients: [{ type: 'wheat', count: 3, isAnimalProduct: false }], marketValue: 50 },
    { type: 'cheese', name: 'Cheese', icon: '🧀', ingredients: [{ type: 'milk', count: 2, isAnimalProduct: true }], marketValue: 60 },
    { type: 'sweater', name: 'Sweater', icon: '👕', ingredients: [{ type: 'wool', count: 2, isAnimalProduct: true }], marketValue: 80 },
    { type: 'salad', name: 'Salad', icon: '🥗', ingredients: [{ type: 'lettuce', count: 2, isAnimalProduct: false }, { type: 'tomato', count: 1, isAnimalProduct: false }], marketValue: 70 },
  ];

  const exampleBoosters = boosters || [
    { type: 'nitrogen', name: 'Nitrogen Boost', icon: '🇳', cost: 6, description: 'Speeds up growth for short crops', duration: 120, effect: { type: 'growth', multiplier: 0.8 } }, // 20% faster
    { type: 'potassium', name: 'Potassium Boost', icon: '🇰', cost: 10, description: 'Speeds up growth for medium crops', duration: 120, effect: { type: 'growth', multiplier: 0.75 } }, // 25% faster
    { type: 'phosphorus', name: 'Phosphorus Boost', icon: '🇵', cost: 14, description: 'Speeds up growth for long crops', duration: 120, effect: { type: 'growth', multiplier: 0.7 } }, // 30% faster
  ];

  const getSeedName = (type: string) => exampleSeeds.find(s => s.type === type)?.name || type;
  const getProductName = (type: string) => exampleAnimalProducts.find(p => p.type === type)?.name || type;

  return (
    <div className="min-h-screen bg-black text-gray-200 p-4 lg:p-8 noot-theme">
      <div className="max-w-5xl mx-auto">
        {/* Header */} 
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="outline" className="flex items-center noot-button noot-button-outline text-white hover:bg-gray-800 border-1 border-gray-700 hover:border-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Farm
            </Button>
          </Link>
          <h1 className="text-2xl font-fantasy text-white noot-title">Nooter's Farm Guide</h1>
        </div>

        {/* Main content - use dark card style */}
        <div className="noot-card border-gray-700 p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-6 border-b border-gray-700 pb-4">
            <BookOpen className="w-8 h-8 text-white" />
            <h2 className="font-fantasy text-xl text-white noot-title">
              🌾 Welcome to Nooter's Farm! 🚜
            </h2>
          </div>

          <p className="mb-6 text-lg handwritten text-gray-300">
            Ready to cultivate your digital homestead? This guide covers everything from planting your first seed to mastering the market and defending your farm. Let's get growing! 🚀
          </p>

          {/* Section Navigation - Use dark, neutral buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
            <a href="#farming" className="noot-button noot-button-dark p-3 rounded-lg text-center transition-all hover:scale-105 flex flex-col items-center justify-center border-1 border-gray-700 hover:border-white hover:bg-gray-800">
              <Sprout className="w-5 h-5 mb-1 text-gray-400" />
              <span className="font-fantasy text-sm">Farming</span>
            </a>
            <a href="#leveling" className="noot-button noot-button-dark p-3 rounded-lg text-center transition-all hover:scale-105 flex flex-col items-center justify-center border-1 border-gray-700 hover:border-white hover:bg-gray-800">
              <LineChart className="w-5 h-5 mb-1 text-gray-400" />
              <span className="font-fantasy text-sm">Leveling</span>
            </a>
            <a href="#seasons" className="noot-button noot-button-dark p-3 rounded-lg text-center transition-all hover:scale-105 flex flex-col items-center justify-center border-1 border-gray-700 hover:border-white hover:bg-gray-800">
              <Calendar className="w-5 h-5 mb-1 text-gray-400" />
              <span className="font-fantasy text-sm">Seasons</span>
            </a>
            <a href="#animals" className="noot-button noot-button-dark p-3 rounded-lg text-center transition-all hover:scale-105 flex flex-col items-center justify-center border-1 border-gray-700 hover:border-white hover:bg-gray-800">
              <Home className="w-5 h-5 mb-1 text-gray-400" />
              <span className="font-fantasy text-sm">Animals</span>
            </a>
            <a href="#crafting" className="noot-button noot-button-dark p-3 rounded-lg text-center transition-all hover:scale-105 flex flex-col items-center justify-center border-1 border-gray-700 hover:border-white hover:bg-gray-800">
              <Hammer className="w-5 h-5 mb-1 text-gray-400" />
              <span className="font-fantasy text-sm">Crafting</span>
            </a>
            <a href="#market" className="noot-button noot-button-dark p-3 rounded-lg text-center transition-all hover:scale-105 flex flex-col items-center justify-center border-1 border-gray-700 hover:border-white hover:bg-gray-800">
              <ShoppingBag className="w-5 h-5 mb-1 text-gray-400" />
              <span className="font-fantasy text-sm">Market</span>
            </a>
             <a href="#boosters" className="noot-button noot-button-dark p-3 rounded-lg text-center transition-all hover:scale-105 flex flex-col items-center justify-center border-1 border-gray-700 hover:border-white hover:bg-gray-800">
              <Rocket className="w-5 h-5 mb-1 text-gray-400" />
              <span className="font-fantasy text-sm">Boosters</span>
            </a>
            <a href="#tasks" className="noot-button noot-button-dark p-3 rounded-lg text-center transition-all hover:scale-105 flex flex-col items-center justify-center border-1 border-gray-700 hover:border-white hover:bg-gray-800">
              <Star className="w-5 h-5 mb-1 text-gray-400" />
              <span className="font-fantasy text-sm">Daily Tasks</span>
            </a>
            <a href="#minigames" className="noot-button noot-button-dark p-3 rounded-lg text-center transition-all hover:scale-105 flex flex-col items-center justify-center border-1 border-gray-700 hover:border-white hover:bg-gray-800">
              <Shield className="w-5 h-5 mb-1 text-gray-400" />
              <span className="font-fantasy text-sm">Minigames</span>
            </a>
            <a href="#swap" className="noot-button noot-button-dark p-3 rounded-lg text-center transition-all hover:scale-105 flex flex-col items-center justify-center border-1 border-gray-700 hover:border-white hover:bg-gray-800">
              <ArrowRightLeft className="w-5 h-5 mb-1 text-gray-400" />
              <span className="font-fantasy text-sm">Token Swap</span>
            </a>
          </div>

          {/* Sections - Apply scroll-mt for anchor links, simplify backgrounds */}
          {/* Farming Section */}
          <section id="farming" className="mb-10 scroll-mt-20">
            <h3 className="text-xl font-fantasy text-white mb-4 flex items-center border-b border-gray-700 pb-2">
              <Sprout className="w-6 h-6 mr-2 text-white" />
              🌱 1. Farming Basics & Strategy
            </h3>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-700">
              <p className="mb-3 text-gray-300">Farming is the core of Nooter's Farm. Here's the cycle:</p>
              <ol className="list-decimal list-inside space-y-2 mb-3 text-gray-300">
                <li><span className="font-medium text-white">Buy Seeds:</span> Purchase seeds from the Market tab.</li>
                <li><span className="font-medium text-white">Select & Plant:</span> Choose a seed from the 'Seed Selector' panel and click an empty plot on your farm. Coins are deducted upon planting.</li>
                <li><span className="font-medium text-white">Wait for Growth:</span> Each crop has a specific growth time, influenced by the current <a href="#seasons" className="underline hover:text-white">Season and Weather</a>. You can click a growing plot to see remaining time and apply <a href="#boosters" className="underline hover:text-white">Boosters</a>.</li>
                <li><span className="font-medium text-white">Harvest:</span> Once a crop is ready (indicated by a checkmark <CircleCheck className="inline h-4 w-4 text-green-500"/>), click the plot to harvest. The crop goes into your inventory (visible in the Market tab).</li>
                <li><span className="font-medium text-white">Sell Crops:</span> Sell your harvested crops in the Market tab for Farm Coins <Coins className="inline h-4 w-4 text-white"/>.</li>
              </ol>
              <div className="mt-4 bg-gray-800/60 p-3 rounded-md border border-gray-700">
                <p className="handwritten text-sm text-gray-300"><span className="text-white">👉 Strategy Tip:</span> Balance short-term crops for quick XP and coins with long-term crops for larger payouts. Pay attention to seasonal and weather bonuses to maximize efficiency!</p>
              </div>
            </div>
            {/* Crop Types Table - Simplify appearance */}
            <div className="bg-gray-900/50 p-4 rounded-lg overflow-x-auto border border-gray-700">
               <h4 className="text-lg font-fantasy text-white mb-3 flex items-center">
                <Flower className="w-5 h-5 mr-2 text-gray-400" />
                Crop Data
              </h4>
              <table className="w-full min-w-[900px] border-collapse text-gray-300">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2 text-left font-fantasy text-gray-400">Seed</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Level</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Base Time</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Base XP</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Buy Cost</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Sell Value</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Base XP/h</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Base Profit/h</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Season/Weather Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {exampleSeeds.map((seed: ExampleSeedData) => {
                    const growthHours = seed.growthTime / 60;
                    const xpPerHour = growthHours > 0 ? (seed.xp / growthHours).toFixed(2) : 'N/A';
                    const profitPerHour = growthHours > 0 ? ((seed.reward - seed.cost) / growthHours).toFixed(2) : 'N/A';
                    return (
                      <tr key={seed.type} className={`border-b border-gray-700 ${playerLevel >= seed.levelUnlock ? "" : "opacity-50"}`}>
                        <td className="p-2 text-white">{seed.name}</td>
                        <td className="p-2">{seed.levelUnlock}</td>
                        <td className="p-2">{formatTime(seed.growthTime)}</td>
                        <td className="p-2">{seed.xp}</td>
                        <td className="p-2">{seed.cost} <Coins className="inline h-3 w-3 text-white" /></td>
                        <td className="p-2">{seed.reward} <Coins className="inline h-3 w-3 text-white" /></td>
                        <td className="p-2">{xpPerHour}</td>
                        <td className="p-2">{profitPerHour}</td>
                        <td className="p-2 text-sm text-gray-400">
                          {seed.bestSeason ? `Prefers ${seed.bestSeason}. ` : ''}
                          {seed.weatherBonus && seed.weatherBonus.length > 0 ? `Likes ${seed.weatherBonus.join(', ')}.` : ''}
                          {(playerLevel < seed.levelUnlock) ? ` (Locked until Lv ${seed.levelUnlock})` : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-3 text-xs italic text-gray-500">*Base Time, XP/h, and Profit/h calculated without season/weather/booster effects. Actual results will vary.</p>
            </div>
          </section>

          {/* Leveling & Expansions Section */}
          <section id="leveling" className="mb-10 scroll-mt-20">
            <h3 className="text-xl font-fantasy text-white mb-4 flex items-center border-b border-gray-700 pb-2">
              <LineChart className="w-6 h-6 mr-2 text-white" />
              📈 2. Leveling & Expansions
            </h3>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-700 text-gray-300">
              <p className="mb-3">Leveling up unlocks new possibilities on your farm:</p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li><span className="font-medium text-white">Earn XP:</span> Gain experience points (XP) primarily from harvesting crops, completing daily tasks, crafting items, and potentially other activities.</li>
                <li><span className="font-medium text-white">Level Up:</span> Reach XP milestones to increase your Farmer Level. Check your progress in the footer or Profile tab.</li>
                <li><span className="font-medium text-white">Unlock Seeds:</span> Some seeds require a certain level to plant (see Crop Data table).</li>
                <li><span className="font-medium text-white">Expand Farm:</span> Increase your farm plot size at specific levels, allowing you to plant more crops simultaneously. Requires coins and meeting the level requirement.</li>
              </ul>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg overflow-x-auto border border-gray-700">
               <h4 className="text-lg font-fantasy text-white mb-3">Level Progression</h4>
              <table className="w-full min-w-[600px] border-collapse text-gray-300">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2 text-left font-fantasy text-gray-400">Level</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">XP to Reach</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Farm Size Unlock</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Farm Expansion Cost</th>
                     <th className="p-2 text-left font-fantasy text-gray-400">Other Rewards</th>
                  </tr>
                </thead>
                <tbody>
                  {[ {level: 1, xp: 0, size: '2x2 (Start)', cost: '-', rewardText: 'Start Farming!'}, {level: 2, xp: 150, size: '3x3', cost: 100, rewardText: '+50 Coins'}, {level: 3, xp: 650, size: '-', cost: '-', rewardText: '+100 Coins'}, {level: 4, xp: 1200, size: '-', cost: '-', rewardText: '+150 Coins'}, {level: 5, xp: 2000, size: '4x4', cost: 500, rewardText: '+200 Coins'}, {level: 10, xp: 16000, size: '5x5', cost: 1000, rewardText: '+500 Coins'}, {level: 15, xp: 81000, size: '6x6 (Max)', cost: 2500, rewardText: '+1000 Coins'}, {level: 20, xp: 330000, size: '-', cost: '-', rewardText: 'Max Level: Unique Badge, +3000 Coins'}].map((lvlData) => (
                    <tr key={lvlData.level} className={`border-b border-gray-700 ${playerLevel >= lvlData.level ? "text-white" : "text-gray-500"}`}>
                      <td className="p-2">{lvlData.level}</td>
                      <td className="p-2">{lvlData.xp.toLocaleString()}</td>
                      <td className="p-2">{lvlData.size}</td>
                      <td className="p-2">{typeof lvlData.cost === 'number' ? <>{lvlData.cost} <Coins className="inline h-3 w-3 text-white" /></> : lvlData.cost}</td>
                      <td className="p-2" dangerouslySetInnerHTML={{ __html: lvlData.rewardText.replace(/(\d+)\s*Coins/g, (match, p1) => `${p1} <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-coins inline text-white"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82-.71-.71"/><path d="m11.29 18.71-.71.7-2.82-2.82.71-.71"/><path d="m10.37 18.09.7.7-2.8 2.8-.7-.7"/><path d="m13.88 16.71.71.7-2.82 2.82-.71-.71"/></svg>`) }}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-sm italic text-gray-400">Your current level: {playerLevel} ({playerXp} / {playerXpToNext} XP)</p>
            </div>
          </section>

          {/* Seasons & Weather Section */}
          <section id="seasons" className="mb-10 scroll-mt-20">
            <h3 className="text-xl font-fantasy text-white mb-4 flex items-center border-b border-gray-700 pb-2">
              <Calendar className="w-6 h-6 mr-2 text-white" />
              ☀️ 3. Seasons & Weather
            </h3>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-700 text-gray-300">
              <p className="mb-3">The environment plays a crucial role in your farm's success:</p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li><span className="font-medium text-white">Seasons (Spring, Summer, Fall, Winter):</span> Each season lasts {seasonLength} in-game days. Certain crops grow faster (e.g., 20% faster) and yield more (e.g., 30% more) during their preferred season. Planting crops out of season can significantly slow growth (e.g., 40% slower) and reduce yield (e.g., 20% less).</li>
                <li><span className="font-medium text-white">Weather (Sunny <Sun className="inline h-4 w-4 text-white"/>, Rainy <CloudRain className="inline h-4 w-4 text-gray-400"/>, Cloudy <Cloud className="inline h-4 w-4 text-gray-500"/>, Windy <Wind className="inline h-4 w-4 text-gray-300"/>, Stormy <CloudLightning className="inline h-4 w-4 text-gray-600"/>):</span> Weather changes daily and affects crops. Some crops have specific weather bonuses (e.g., 15% faster growth, 20% more yield). Stormy weather generally slows growth (e.g., 25% slower) and reduces yield (e.g., 15% less) for most crops.</li>
                <li><span className="font-medium text-white">Check Conditions:</span> The current season, day, and weather are displayed in the header and the 'Farm' tab sidebar.</li>
              </ul>
              <div className="mt-4 bg-gray-800/60 p-3 rounded-md border border-gray-700">
                <p className="handwritten text-sm text-gray-300"><span className="text-white">👉 Planning Tip:</span> Check the Crop Data table for preferred seasons and weather. Adapt your planting strategy to the current conditions for optimal results!</p>
              </div>
            </div>
          </section>

          {/* Animals Section */}
          <section id="animals" className="mb-10 scroll-mt-20">
            <h3 className="text-xl font-fantasy text-white mb-4 flex items-center border-b border-gray-700 pb-2">
              <Home className="w-6 h-6 mr-2 text-white" />
              🐄 4. Raising Animals
            </h3>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-700 text-gray-300">
              <p className="mb-3">Animals add another layer to your farm, providing valuable resources:</p>
              <ol className="list-decimal list-inside space-y-2 mb-3">
                <li><span className="font-medium text-white">Buy Animals:</span> Purchase Cows, Chickens, and Sheep from the 'Animals' tab market section.</li>
                <li><span className="font-medium text-white">Feed Animals:</span> Animals need to be fed regularly (check their status in the 'Your Animals' list). Click the 'Feed' button. Fed animals are happier and produce goods.</li>
                <li><span className="font-medium text-white">Collect Products:</span> Once an animal's production timer is complete, click 'Collect'. The product (Milk, Eggs, Wool) goes into your Animal Products inventory (visible in the 'Animals' or 'Market' tabs).</li>
                <li><span className="font-medium text-white">Sell Products:</span> Sell collected products in the Market or use them for Crafting.</li>
              </ol>
               <div className="mt-4 bg-gray-800/60 p-3 rounded-md border border-gray-700">
                 <p className="handwritten text-sm text-gray-300"><span className="text-white">💡 Animal Care:</span> Keep your animals fed to ensure continuous production. Use the 'Feed All' and 'Collect All' buttons for efficiency.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 p-4 rounded-lg overflow-x-auto border border-gray-700">
                <h4 className="text-lg font-fantasy text-white mb-3">Animal Types</h4>
                <table className="w-full border-collapse text-gray-300">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-2 text-left font-fantasy text-gray-400">Animal</th>
                      <th className="p-2 text-left font-fantasy text-gray-400">Cost</th>
                      <th className="p-2 text-left font-fantasy text-gray-400">Product</th>
                      <th className="p-2 text-left font-fantasy text-gray-400">Prod. Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exampleAnimalTypes.map(animal => (
                      <tr key={animal.type} className="border-b border-gray-700">
                        <td className="p-2 flex items-center text-white">{animal.icon} {animal.name}</td>
                        <td className="p-2">{animal.cost} <Coins className="inline h-3 w-3 text-white" /></td>
                        <td className="p-2">{exampleAnimalProducts.find(p => p.type === animal.productType)?.icon} {getProductName(animal.productType)}</td>
                        <td className="p-2">{formatTime(animal.productionTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg overflow-x-auto border border-gray-700">
                 <h4 className="text-lg font-fantasy text-white mb-3">Animal Products</h4>
                 <table className="w-full border-collapse text-gray-300">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-2 text-left font-fantasy text-gray-400">Product</th>
                      <th className="p-2 text-left font-fantasy text-gray-400">Sell Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exampleAnimalProducts.map(product => (
                      <tr key={product.type} className="border-b border-gray-700">
                        <td className="p-2 flex items-center text-white">{product.icon} {product.name}</td>
                        <td className="p-2">{product.marketValue} <Coins className="inline h-3 w-3 text-white" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Crafting Section */}
          <section id="crafting" className="mb-10 scroll-mt-20">
            <h3 className="text-xl font-fantasy text-white mb-4 flex items-center border-b border-gray-700 pb-2">
              <Hammer className="w-6 h-6 mr-2 text-white" />
              🛠️ 5. Crafting
            </h3>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-700 text-gray-300">
              <p className="mb-3">Combine your farm's bounty into more valuable goods:</p>
              <ol className="list-decimal list-inside space-y-2 mb-3">
                <li><span className="font-medium text-white">Check Recipes:</span> Go to the 'Crafting' tab to see available recipes, required ingredients (crops or animal products), and the market value of the final item.</li>
                <li><span className="font-medium text-white">Gather Ingredients:</span> Ensure you have enough of the required raw materials in your inventories. Ingredient availability is shown on the recipe card.</li>
                <li><span className="font-medium text-white">Craft Item:</span> Click the 'Craft' button on the recipe. Ingredients are consumed, and the crafted item is added to your Crafted Items inventory.</li>
                <li><span className="font-medium text-white">Sell Crafted Goods:</span> Sell your crafted items in the Market tab, usually for a higher profit than selling the raw ingredients.</li>
              </ol>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg overflow-x-auto border border-gray-700">
              <h4 className="text-lg font-fantasy text-white mb-3">Crafting Recipes</h4>
              <table className="w-full min-w-[600px] border-collapse text-gray-300">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2 text-left font-fantasy text-gray-400">Item</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Ingredients</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Sell Value</th>
                  </tr>
                </thead>
                <tbody>
                  {exampleCraftableItems.map(item => (
                    <tr key={item.type} className="border-b border-gray-700">
                      <td className="p-2 flex items-center text-white">{item.icon} {item.name}</td>
                      <td className="p-2 text-sm">
                        {item.ingredients.map((ing, idx) => (
                          <span key={idx}>
                            {ing.count}x {ing.isAnimalProduct ? getProductName(ing.type) : getSeedName(ing.type)}
                            {idx < item.ingredients.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </td>
                      <td className="p-2">{item.marketValue} <Coins className="inline h-3 w-3 text-white" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

           {/* Market Section */}
          <section id="market" className="mb-10 scroll-mt-20">
            <h3 className="text-xl font-fantasy text-white mb-4 flex items-center border-b border-gray-700 pb-2">
              <ShoppingBag className="w-6 h-6 mr-2 text-white" />
              🏪 6. Marketplace
            </h3>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-700 text-gray-300">
              <p className="mb-3">The Market tab is your hub for buying and selling:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700">
                  <h4 className="font-fantasy text-white mb-2">Buying</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li>Purchase Seeds for planting.</li>
                    <li>Buy Animals in the 'Animals' tab.</li>
                    <li>Acquire Boosters in the 'Boosters' tab.</li>
                  </ul>
                </div>
                <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700">
                  <h4 className="font-fantasy text-white mb-2">Selling</h4>
                   <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li>Sell harvested Crops directly from your inventory.</li>
                    <li>Sell collected Animal Products.</li>
                    <li>Sell Crafted Items for higher profits.</li>
                    <li>Use the 'Sell All' buttons for quick sales.</li>
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-sm italic text-gray-500">Market prices for buying seeds/animals/boosters and selling goods appear to be fixed in the current version.</p>
            </div>
          </section>

          {/* Boosters Section */}
          <section id="boosters" className="mb-10 scroll-mt-20">
            <h3 className="text-xl font-fantasy text-white mb-4 flex items-center border-b border-gray-700 pb-2">
              <Rocket className="w-6 h-6 mr-2 text-white" />
              🧪 7. Boosters
            </h3>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-700 text-gray-300">
              <p className="mb-3">Give your crops an edge with boosters:</p>
              <ol className="list-decimal list-inside space-y-2 mb-3">
                <li><span className="font-medium text-white">Purchase Boosters:</span> Buy different types of boosters (like Nitrogen, Potassium, Phosphorus) from the 'Boosters' tab store using Farm Coins.</li>
                <li><span className="font-medium text-white">Check Inventory:</span> Your purchased boosters are stored in the 'Your Boosters' section.</li>
                <li><span className="font-medium text-white">Apply Boosters:</span> Click on a currently <span className="italic">growing</span> crop plot on your farm. If you own applicable boosters, a menu will appear allowing you to select and apply one.</li>
                <li><span className="font-medium text-white">Effects:</span> Growth boosters immediately speed up the remaining growth time for a set duration. Yield boosters (if available) would increase the amount harvested. Check the booster description for details.</li>
              </ol>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg overflow-x-auto border border-gray-700">
              <h4 className="text-lg font-fantasy text-white mb-3">Booster Types</h4>
              <table className="w-full min-w-[600px] border-collapse text-gray-300">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2 text-left font-fantasy text-gray-400">Booster</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Cost</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Effect Type</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Description</th>
                    <th className="p-2 text-left font-fantasy text-gray-400">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {exampleBoosters.map(booster => (
                    <tr key={booster.type} className="border-b border-gray-700">
                      <td className="p-2 flex items-center text-white">{booster.icon} {booster.name}</td>
                      <td className="p-2">{booster.cost} <Coins className="inline h-3 w-3 text-white" /></td>
                      <td className="p-2 capitalize">{booster.effect.type}</td>
                      <td className="p-2 text-sm">{booster.description}</td>
                      <td className="p-2">{formatTime(booster.duration)}</td>
                    </tr>
                  ))}
                   <tr className="border-b border-gray-700 opacity-70">
                      <td className="p-2 flex items-center text-white">🧪 Fertilizer</td>
                      <td className="p-2">N/A*</td>
                      <td className="p-2 capitalize">Growth</td>
                      <td className="p-2 text-sm">Instant growth boost (Obtained via special means?)</td>
                      <td className="p-2">Instant</td>
                    </tr>
                </tbody>
              </table>
                <p className="mt-3 text-xs italic text-gray-500">*Fertilizer might be obtained through quests or special events, not direct purchase.</p>
            </div>
          </section>

           {/* Daily Tasks Section */}
          <section id="tasks" className="mb-10 scroll-mt-20">
            <h3 className="text-xl font-fantasy text-white mb-4 flex items-center border-b border-gray-700 pb-2">
              <Star className="w-6 h-6 mr-2 text-white" />
              📋 8. Daily Tasks
            </h3>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-700 text-gray-300">
              <p className="mb-3">Complete simple tasks each day for bonus coins! Check the 'Quests' tab:</p>
              <ul className="list-disc list-inside space-y-3 mb-3">
                <li>
                  <span className="font-medium text-white">Plant Seeds:</span> Plant the required number of seeds (e.g., 5). Progress tracked automatically.
                  <span className="block text-xs text-gray-400">Reward: 20 <Coins className="inline h-3 w-3 text-white" /></span>
                </li>
                 <li>
                  <span className="font-medium text-white">Earn Coins:</span> Earn the target amount of Farm Coins (e.g., 100) through selling crops, products, or other means.
                   <span className="block text-xs text-gray-400">Reward: 15 <Coins className="inline h-3 w-3 text-white" /></span>
                 </li>
              </ul>
              <p>Tasks reset daily. Once a task's target is met, the reward is automatically added to your coin balance and the task is marked complete for the day.</p>
              <div className="mt-4 bg-gray-800/60 p-3 rounded-md border border-gray-700">
                <p className="handwritten text-sm text-gray-300"><span className="text-white">💡 Tip:</span> Completing daily tasks is an easy way to boost your income and XP gain!</p>
              </div>
            </div>
          </section>

           {/* Minigames Section */}
          <section id="minigames" className="mb-10 scroll-mt-20">
            <h3 className="text-xl font-fantasy text-white mb-4 flex items-center border-b border-gray-700 pb-2">
              <Shield className="w-6 h-6 mr-2 text-white" />
               🎮 9. Minigames
            </h3>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-700 text-gray-300">
               <p className="mb-3">Take a break from farming and earn extra coins with minigames:</p>
               <div className="grid md:grid-cols-2 gap-4 mb-4">
                 <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700">
                    <h4 className="font-fantasy text-white mb-2 flex items-center"><Shield className="inline h-4 w-4 mr-1 text-white"/> Defend Farm</h4>
                    <p className="text-sm text-gray-300">A Phaser-based tower defense game. Protect your crops from waves of pests. Place defenses strategically. Earn coins based on your performance.</p>
                 </div>
                 <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700">
                    <h4 className="font-fantasy text-white mb-2 flex items-center"><Rocket className="inline h-4 w-4 mr-1 text-white"/> Crashout</h4>
                    <p className="text-sm text-gray-300">A timing and risk-based game. Place a bet and try to cash out before the multiplier crashes. High risk, high reward!</p>
                 </div>
               </div>
               
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700">
                    <h4 className="font-fantasy text-white mb-2 flex items-center"><Zap className="inline h-4 w-4 mr-1 text-white"/> Platformer</h4>
                    <p className="text-sm text-gray-300">Jump and run through farm-themed levels. Collect coins and power-ups while avoiding obstacles. Complete levels to earn farm rewards.</p>
                 </div>
                 <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700">
                    <h4 className="font-fantasy text-white mb-2 flex items-center"><CircleDollarSign className="inline h-4 w-4 mr-1 text-white"/> Slot Machine</h4>
                    <p className="text-sm text-gray-300">Try your luck with the farm-themed slot machine. Match crop and animal symbols to win coins. Special combinations offer bigger payouts.</p>
                 </div>
                 <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700">
                    <h4 className="font-fantasy text-white mb-2 flex items-center"><Trophy className="inline h-4 w-4 mr-1 text-white"/> Sport Betting</h4>
                    <p className="text-sm text-gray-300">Bet on virtual farmyard sports events. Predict winners correctly to multiply your wager. Different events offer varying odds and potential payouts.</p>
                 </div>
                 <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700">
                    <h4 className="font-fantasy text-white mb-2 flex items-center"><Star className="inline h-4 w-4 mr-1 text-white"/> Noot Case</h4>
                    <p className="text-sm text-gray-300">Open special cases containing random rewards. Each case has different tiers of possible items and coin amounts. Higher-tier cases cost more but offer better rewards.</p>
                 </div>
                 <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700">
                    <h4 className="font-fantasy text-white mb-2 flex items-center"><Users className="inline h-4 w-4 mr-1 text-white"/> Noot.io</h4>
                    <p className="text-sm text-gray-300">A multiplayer arena where you control your farmer character. Grow by collecting resources and outsmarting other players. Earn rewards based on your final size and survival time.</p>
                 </div>
               </div>
               
               <div className="mt-4 bg-gray-800/60 p-3 rounded-md border border-gray-700">
                <p className="handwritten text-sm text-gray-300"><span className="text-white">💡 Gambling Tip:</span> Set limits on how many coins you're willing to risk in games of chance. Remember that farming is always a reliable way to earn coins!</p>
               </div>
               
               <p className="mt-4 text-sm italic text-gray-500">Access these games via their respective tabs in the main interface.</p>
            </div>
          </section>

          {/* Token Swap Section */}
          <section id="swap" className="mb-10 scroll-mt-20">
            <h3 className="text-xl font-fantasy text-white mb-4 flex items-center border-b border-gray-700 pb-2">
              <ArrowRightLeft className="w-6 h-6 mr-2 text-white" />
               🔄 10. Token Swap
            </h3>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-700 text-gray-300">
               <p className="mb-3">Convert your hard-earned Farm Coins into $NOOT tokens:</p>
                <ul className="list-disc list-inside space-y-2 mb-3">
                  <li>Navigate to the 'Swap' tab.</li>
                  <li>Enter the amount of Farm Coins <Coins className="inline h-4 w-4 text-white"/> you wish to swap.</li>
                  <li>See the estimated amount of $NOOT you will receive (exchange rate may apply).</li>
                  <li>Connect your wallet and confirm the transaction.</li>
                </ul>
                 <p className="mt-4 text-sm italic text-gray-500">This feature connects the in-game economy to the broader $NOOT ecosystem.</p>
            </div>
          </section>

          {/* Social Interactions Placeholder */}
          <section id="social" className="mb-10 scroll-mt-20">
            <h3 className="text-xl font-fantasy text-white mb-4 flex items-center border-b border-gray-700 pb-2">
              <Users className="w-6 h-6 mr-2 text-white" />
              📱 11. Social Interactions (Coming Soon)
            </h3>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-700 opacity-60">
              <p className="mb-3 text-gray-400">Features to connect with friends and other farmers via Farcaster are planned for the future!</p>
              <ul className="list-disc list-inside space-y-2 mb-3 text-gray-400">
                <li>View friends' farms.</li>
                <li>Donate/request items.</li>
                <li>Earn social rewards.</li>
              </ul>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
} 