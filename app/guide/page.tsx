"use client";

import { useContext } from "react";
import Link from "next/link";
import { GameContext } from "@/context/game-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Clock, Star, Zap, Sprout, Flower, LineChart, Users, ShoppingBag } from "lucide-react";

export default function GuidePage() {
  const { playerLevel } = useContext(GameContext);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Farm
            </Button>
          </Link>
          <h1 className="text-2xl font-fantasy text-gradient-gold">Farville Alpha Guide</h1>
        </div>

        {/* Main content container */}
        <div className="parchment rounded-xl p-6 mb-8 border border-secondary/30 unroll-scroll">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <BookOpen className="w-8 h-8 text-highlight-gold" />
            <h2 className="font-fantasy text-xl text-gradient-gold">
              🌱 Farm in Farville's Alpha! 🌱
            </h2>
          </div>
          
          <p className="mb-6 text-lg handwritten">
            Ready to take your farm to the next level? Here's your ultimate guide to progressing, cooperating, and thriving in Farville's alpha version. Let's dive in! 🚀
          </p>

          {/* Section Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <a href="#quests" className="bg-primary/40 hover:bg-primary/60 p-3 rounded-lg text-center transition-all hover:scale-105">
              <Star className="w-5 h-5 mx-auto mb-1 text-highlight-gold" />
              <span className="font-fantasy">Daily Quests</span>
            </a>
            <a href="#strategy" className="bg-primary/40 hover:bg-primary/60 p-3 rounded-lg text-center transition-all hover:scale-105">
              <Sprout className="w-5 h-5 mx-auto mb-1 text-secondary" />
              <span className="font-fantasy">Farming Strategy</span>
            </a>
            <a href="#progression" className="bg-primary/40 hover:bg-primary/60 p-3 rounded-lg text-center transition-all hover:scale-105">
              <LineChart className="w-5 h-5 mx-auto mb-1 text-accent" />
              <span className="font-fantasy">Level Progression</span>
            </a>
            <a href="#social" className="bg-primary/40 hover:bg-primary/60 p-3 rounded-lg text-center transition-all hover:scale-105">
              <Users className="w-5 h-5 mx-auto mb-1 text-highlight-blue" />
              <span className="font-fantasy">Social Features</span>
            </a>
            <a href="#market" className="bg-primary/40 hover:bg-primary/60 p-3 rounded-lg text-center transition-all hover:scale-105">
              <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-highlight-gold" />
              <span className="font-fantasy">Market</span>
            </a>
          </div>

          {/* Daily Quests Section */}
          <section id="quests" className="mb-10">
            <h3 className="text-xl font-fantasy text-gradient mb-4 flex items-center">
              <Star className="w-6 h-6 mr-2 text-highlight-gold" />
              📋 1. Daily & Weekly Quests
            </h3>
            <div className="bg-card/60 p-4 rounded-lg mb-4">
              <p className="mb-3">Every day, check your quest log for fresh challenges:</p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li><span className="font-medium">Standard Quests:</span> Plant 🌾, harvest 🌽 or sell surplus.</li>
                <li><span className="font-medium">Social Quests:</span> Donate seeds or crops 🌱 and share gifts 🎁.</li>
              </ul>
              <p>And challenge yourself completing the Weekly quests which are more rewarding and difficult to achieve.</p>
              <div className="mt-4 bg-primary/30 p-3 rounded-md border border-secondary/30">
                <p className="handwritten text-sm"><span className="text-highlight-gold">👉 Tip:</span> Completing daily quests nets you extra XP and keeps you on track!</p>
              </div>
            </div>
          </section>

          {/* Farming Strategy Section */}
          <section id="strategy" className="mb-10">
            <h3 className="text-xl font-fantasy text-gradient mb-4 flex items-center">
              <Sprout className="w-6 h-6 mr-2 text-secondary" />
              🌾 2. Farming Strategy
            </h3>
            <div className="bg-card/60 p-4 rounded-lg">
              <p className="mb-3">Choose your crops wisely based on growth times and rewards:</p>
              <div className="grid md:grid-cols-3 gap-4 mb-3">
                <div className="bg-primary/30 p-3 rounded-md border border-secondary/30">
                  <h4 className="font-fantasy text-gradient-gold mb-2">Short Seeds</h4>
                  <p className="text-sm">
                    <span className="block mb-1">Wheat, Carrot, Radish</span>
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> 4-6h grow time ⏱️</span>
                    <span className="flex items-center"><Zap className="w-3 h-3 mr-1" /> Low cost 💰, quick XP ⚡</span>
                    <span className="block mt-1 text-xs italic">Perfect for frequent visits!</span>
                  </p>
                </div>
                <div className="bg-primary/30 p-3 rounded-md border border-secondary/30">
                  <h4 className="font-fantasy text-gradient-gold mb-2">Medium Seeds</h4>
                  <p className="text-sm">
                    <span className="block mb-1">Potato, Corn, Lettuce</span>
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> 10-12h cycles</span>
                    <span className="flex items-center"><Zap className="w-3 h-3 mr-1" /> Moderate cost, balanced XP/coin returns 💎</span>
                    <span className="block mt-1 text-xs italic">Good for daily farmers!</span>
                  </p>
                </div>
                <div className="bg-primary/30 p-3 rounded-md border border-secondary/30">
                  <h4 className="font-fantasy text-gradient-gold mb-2">Long Seeds</h4>
                  <p className="text-sm">
                    <span className="block mb-1">Pumpkin, Watermelon</span>
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> 36-48h maturation 🕰️</span>
                    <span className="flex items-center"><Zap className="w-3 h-3 mr-1" /> Massive yields 🍉</span>
                    <span className="block mt-1 text-xs italic">Ideal for larger farmland expansions!</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Level Progression Table */}
          <section id="progression" className="mb-10">
            <h3 className="text-xl font-fantasy text-gradient mb-4 flex items-center">
              <LineChart className="w-6 h-6 mr-2 text-accent" />
              📈 3. Leveling & Expansions
            </h3>
            <div className="bg-card/60 p-4 rounded-lg mb-4">
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li><span className="font-medium">Level Up:</span> Earn XP from daily, weekly, and monthly tasks to level up your farmer 🚀.</li>
                <li><span className="font-medium">Unlock new seeds:</span> Start with common seeds, then unlock more complex ones as you level up. 11 seeds in total.</li>
                <li><span className="font-medium">Farmland Expansions:</span> Expand up to a 6×6 plot as you progress through levels.</li>
              </ul>
            </div>
            <div className="bg-card/60 p-4 rounded-lg overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-b border-secondary/30">
                    <th className="p-2 text-left font-fantasy">Level</th>
                    <th className="p-2 text-left font-fantasy">Cumulative XP</th>
                    <th className="p-2 text-left font-fantasy">XP to Next Level</th>
                    <th className="p-2 text-left font-fantasy">Rewards / Unlocks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={`border-b border-primary/30 ${playerLevel >= 1 ? "bg-primary/20" : ""}`}>
                    <td className="p-2">1</td>
                    <td className="p-2">0</td>
                    <td className="p-2">150</td>
                    <td className="p-2">Start your farming journey</td>
                  </tr>
                  <tr className={`border-b border-primary/30 ${playerLevel >= 2 ? "bg-primary/20" : ""}`}>
                    <td className="p-2">2</td>
                    <td className="p-2">150</td>
                    <td className="p-2">500</td>
                    <td className="p-2">+50 COIN, 3×3 farmland (100 COIN)</td>
                  </tr>
                  <tr className={`border-b border-primary/30 ${playerLevel >= 3 ? "bg-primary/20" : ""}`}>
                    <td className="p-2">3</td>
                    <td className="p-2">650</td>
                    <td className="p-2">550</td>
                    <td className="p-2">+100 COIN</td>
                  </tr>
                  <tr className={`border-b border-primary/30 ${playerLevel >= 4 ? "bg-primary/20" : ""}`}>
                    <td className="p-2">4</td>
                    <td className="p-2">1,200</td>
                    <td className="p-2">800</td>
                    <td className="p-2">+150 COIN</td>
                  </tr>
                  <tr className={`border-b border-primary/30 ${playerLevel >= 5 ? "bg-primary/20" : ""}`}>
                    <td className="p-2">5</td>
                    <td className="p-2">2,000</td>
                    <td className="p-2">1,200</td>
                    <td className="p-2">+200 COIN, 4×4 farmland (500 COIN)</td>
                  </tr>
                  <tr className={`border-b border-primary/30 ${playerLevel >= 10 ? "bg-primary/20" : ""}`}>
                    <td className="p-2">10</td>
                    <td className="p-2">16,000</td>
                    <td className="p-2">7,000</td>
                    <td className="p-2">+500 COIN, 5×5 farmland (1000 COIN)</td>
                  </tr>
                  <tr className={`border-b border-primary/30 ${playerLevel >= 15 ? "bg-primary/20" : ""}`}>
                    <td className="p-2">15</td>
                    <td className="p-2">81,000</td>
                    <td className="p-2">27,000</td>
                    <td className="p-2">+1000 COIN, 6×6 farmland (2500 COIN)</td>
                  </tr>
                  <tr className={`border-b border-primary/30 ${playerLevel >= 20 ? "bg-primary/20" : ""}`}>
                    <td className="p-2">20</td>
                    <td className="p-2">330,000</td>
                    <td className="p-2">MAX LEVEL</td>
                    <td className="p-2">Max Level: Unique Farville alpha Badge, +3000 COIN</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-sm italic text-foreground/70">Your current level: {playerLevel}</p>
            </div>
          </section>

          {/* Social Interactions Section */}
          <section id="social" className="mb-10">
            <h3 className="text-xl font-fantasy text-gradient mb-4 flex items-center">
              <Users className="w-6 h-6 mr-2 text-highlight-blue" />
              📱 4. Farcaster Social Interactions
            </h3>
            <div className="bg-card/60 p-4 rounded-lg mb-4">
              <p className="mb-3">Stay connected and collaborate with your friends through Farcaster!</p>
              
              <h4 className="font-fantasy text-gradient-gold mb-2">Social Graph:</h4>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li>View your friends' farms in real-time: see what they're planting, harvesting, and achieving.</li>
                <li>Access a network of fellow farmers, forming connections and community bonds.</li>
              </ul>
              
              <h4 className="font-fantasy text-gradient-gold mb-2 mt-4">Key Interactions:</h4>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li><span className="font-medium">Donate and Receive:</span> Send and request crops and seeds directly with friends to support each other's farms.</li>
                <li><span className="font-medium">Engage Visually:</span> Browse friends' farm layouts and progress, providing inspiration and strategy tips.</li>
                <li><span className="font-medium">Social Rewards:</span> Earn bonus XP for interacting with friends: donating seeds, receiving items, and exploring their farms.</li>
              </ul>
            </div>
          </section>

          {/* Market Section */}
          <section id="market" className="mb-10">
            <h3 className="text-xl font-fantasy text-gradient mb-4 flex items-center">
              <ShoppingBag className="w-6 h-6 mr-2 text-highlight-gold" />
              🏪 5. Market
            </h3>
            <div className="bg-card/60 p-4 rounded-lg mb-4">
              <p className="mb-3">Trading System: Buy and sell crops in the marketplace 💰</p>
              <h4 className="font-fantasy text-gradient-gold mb-2">Categories:</h4>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li><span className="font-medium">Seeds Shop 🌱:</span> Purchase different seed types for planting</li>
                <li><span className="font-medium">Crop Market 🌾:</span> Sell your harvested crops for coins</li>
                <li><span className="font-medium">Boosters Store 🚀:</span> Buy fertilizers and growth accelerators</li>
              </ul>
            </div>
          </section>
          
          {/* Crop Types Table */}
          <section id="crops" className="mb-10">
            <h3 className="text-xl font-fantasy text-gradient mb-4 flex items-center">
              <Flower className="w-6 h-6 mr-2 text-highlight-blue" />
              Crop Types 🌽
            </h3>
            <div className="bg-card/60 p-4 rounded-lg overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-secondary/30">
                    <th className="p-2 text-left font-fantasy">Seed</th>
                    <th className="p-2 text-left font-fantasy">Level Unlock</th>
                    <th className="p-2 text-left font-fantasy">Prod. Time</th>
                    <th className="p-2 text-left font-fantasy">Death Time</th>
                    <th className="p-2 text-left font-fantasy">XP</th>
                    <th className="p-2 text-left font-fantasy">Buy (seed)</th>
                    <th className="p-2 text-left font-fantasy">Sell (crop)</th>
                    <th className="p-2 text-left font-fantasy">XP/hour</th>
                    <th className="p-2 text-left font-fantasy">COIN/hour</th>
                    <th className="p-2 text-left font-fantasy">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Wheat</td>
                    <td className="p-2">1</td>
                    <td className="p-2">6h</td>
                    <td className="p-2">3h (k=0.50)</td>
                    <td className="p-2">14</td>
                    <td className="p-2">10</td>
                    <td className="p-2">15</td>
                    <td className="p-2">2.33</td>
                    <td className="p-2">2.50</td>
                    <td className="p-2 text-sm">Basic feed crop—dies if ignored after 3h</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Carrot</td>
                    <td className="p-2">1</td>
                    <td className="p-2">4h</td>
                    <td className="p-2">3.3h (k=0.55)</td>
                    <td className="p-2">8</td>
                    <td className="p-2">5</td>
                    <td className="p-2">8</td>
                    <td className="p-2">2.00</td>
                    <td className="p-2">2.00</td>
                    <td className="p-2 text-sm">Quick harvest with synergy bonus</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Radish</td>
                    <td className="p-2">1</td>
                    <td className="p-2">6h</td>
                    <td className="p-2">3.6h (k=0.60)</td>
                    <td className="p-2">14</td>
                    <td className="p-2">13</td>
                    <td className="p-2">13</td>
                    <td className="p-2">2.33</td>
                    <td className="p-2">2.16</td>
                    <td className="p-2 text-sm">High XP, lower coin yield</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Lettuce</td>
                    <td className="p-2">1</td>
                    <td className="p-2">10h</td>
                    <td className="p-2">6h (k=0.60)</td>
                    <td className="p-2">25</td>
                    <td className="p-2">15</td>
                    <td className="p-2">18</td>
                    <td className="p-2">2.50</td>
                    <td className="p-2">1.80</td>
                    <td className="p-2 text-sm">Mid-length crop with weather bonuses</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Potato</td>
                    <td className="p-2">8</td>
                    <td className="p-2">12h</td>
                    <td className="p-2">7.8h (k=0.65)</td>
                    <td className="p-2">30</td>
                    <td className="p-2">60</td>
                    <td className="p-2">100</td>
                    <td className="p-2">2.50</td>
                    <td className="p-2">8.33</td>
                    <td className="p-2 text-sm">Strict harvest window, high-value tuber</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Corn</td>
                    <td className="p-2">1</td>
                    <td className="p-2">12h</td>
                    <td className="p-2">8.4h (k=0.70)</td>
                    <td className="p-2">32</td>
                    <td className="p-2">24</td>
                    <td className="p-2">40</td>
                    <td className="p-2">2.67</td>
                    <td className="p-2">3.33</td>
                    <td className="p-2 text-sm">Versatile crop, balanced returns</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Eggplant</td>
                    <td className="p-2">1</td>
                    <td className="p-2">15h</td>
                    <td className="p-2">12h (k=0.75)</td>
                    <td className="p-2">40</td>
                    <td className="p-2">28</td>
                    <td className="p-2">42</td>
                    <td className="p-2">2.67</td>
                    <td className="p-2">2.80</td>
                    <td className="p-2 text-sm">Ideal for cooking/quests</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Tomato</td>
                    <td className="p-2">5</td>
                    <td className="p-2">16h</td>
                    <td className="p-2">12.8h (k=0.80)</td>
                    <td className="p-2">45</td>
                    <td className="p-2">30</td>
                    <td className="p-2">50</td>
                    <td className="p-2">2.81</td>
                    <td className="p-2">3.13</td>
                    <td className="p-2 text-sm">Rare Golden Tomato bonus</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Strawberry</td>
                    <td className="p-2">1</td>
                    <td className="p-2">24h</td>
                    <td className="p-2">19.2h (k=0.80)</td>
                    <td className="p-2">55</td>
                    <td className="p-2">35</td>
                    <td className="p-2">60</td>
                    <td className="p-2">2.29</td>
                    <td className="p-2">2.50</td>
                    <td className="p-2 text-sm">Perfect for jam, confection bonuses</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Watermelon</td>
                    <td className="p-2">1</td>
                    <td className="p-2">36h</td>
                    <td className="p-2">32.4h (k=0.90)</td>
                    <td className="p-2">120</td>
                    <td className="p-2">80</td>
                    <td className="p-2">150</td>
                    <td className="p-2">3.33</td>
                    <td className="p-2">4.16</td>
                    <td className="p-2 text-sm">Sharing grants friend feed refresh</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Pumpkin</td>
                    <td className="p-2">3</td>
                    <td className="p-2">48h</td>
                    <td className="p-2">48h (k=1.00)</td>
                    <td className="p-2">165</td>
                    <td className="p-2">100</td>
                    <td className="p-2">250</td>
                    <td className="p-2">3.44</td>
                    <td className="p-2">5.21</td>
                    <td className="p-2 text-sm">Premium Halloween crop, orchard-style harvest</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          
          {/* Boosters Section */}
          <section id="boosters" className="mb-10">
            <h3 className="text-xl font-fantasy text-gradient mb-4 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-highlight-gold" />
              Boosters 🧪
            </h3>
            <div className="bg-card/60 p-4 rounded-lg overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-b border-secondary/30">
                    <th className="p-2 text-left font-fantasy">Type</th>
                    <th className="p-2 text-left font-fantasy">Cost (COIN)</th>
                    <th className="p-2 text-left font-fantasy">Effect</th>
                    <th className="p-2 text-left font-fantasy">Applicable on</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Fertilizer</td>
                    <td className="p-2">N.A.</td>
                    <td className="p-2">Instant growth boost</td>
                    <td className="p-2">Any growing crop</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Nitrogen</td>
                    <td className="p-2">6</td>
                    <td className="p-2">Boosts growth rate x1.25 for 2 hours</td>
                    <td className="p-2">Wheat, Carrot, Radish</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Potassium</td>
                    <td className="p-2">10</td>
                    <td className="p-2">Boosts growth rate x1.50 for 2 hours</td>
                    <td className="p-2">Lettuce, Potato, Corn, Eggplant, Tomato</td>
                  </tr>
                  <tr className="border-b border-primary/30">
                    <td className="p-2">Phosphorus</td>
                    <td className="p-2">14</td>
                    <td className="p-2">Boosts growth rate x2 for 2 hours</td>
                    <td className="p-2">Strawberry, Watermelon, Pumpkin</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 