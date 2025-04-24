"use client";

import { useContext, useState, useEffect } from "react";
import { GameContext } from "@/context/game-context";
import { 
  Star, 
  Sun, 
  Moon, 
  CloudRain, 
  Trophy, 
  Coins, 
  Menu, 
  User, 
  Settings, 
  Sprout,
  Home,
  ArrowRightLeft,
  ShoppingBag,
  Users
} from "lucide-react";
import { AccessibilityMenu } from "./accessibility-menu";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AbstractLogo } from "@/components/abstract-logo";

export interface NavbarProps {
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ 
  toggleSidebar, 
  activeTab, 
  setActiveTab
}: NavbarProps) {
  const { playerLevel, playerXp, playerXpToNext } = useContext(GameContext);
  
  // Add client-side state for player level and XP
  const [clientPlayerLevel, setClientPlayerLevel] = useState<number>(0);
  const [clientDisplayXp, setClientDisplayXp] = useState<number>(0);
  const [clientXpToNext, setClientXpToNext] = useState<number>(0);
  
  // Set values only on client side to avoid hydration mismatch
  useEffect(() => {
    setClientPlayerLevel(playerLevel);
    setClientDisplayXp(Math.min(playerXp, playerXpToNext));
    setClientXpToNext(playerXpToNext);
  }, [playerLevel, playerXp, playerXpToNext]);
  
  // Calculate progress percentage
  const progressPercentage = clientXpToNext > 0 ? (clientDisplayXp / clientXpToNext) * 100 : 0;
  
  return (
    <div className="sticky top-0 z-20 bg-black border-b border-[#333] py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white hover:bg-[#222]"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Abstract Logo */}
          <div className="ml-2 md:ml-0 flex items-center gap-2">
            <AbstractLogo />
            <span className="hidden md:inline text-white font-mono text-sm noot-text">Abstract Testnet</span>
          </div>
        </div>
        
        {/* Level progress in center */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-1.5 mr-3">
            <div className="w-6 h-6 rounded-none bg-white text-black flex items-center justify-center text-xs font-medium noot-title">
              {typeof window !== 'undefined' ? clientPlayerLevel : 0}
            </div>
            <span className="text-white text-xs noot-text">Level</span>
          </div>
          
          <div className="w-48 h-2 bg-[#222] relative">
            <div 
              className="absolute inset-0 bg-white" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <div className="ml-3 text-white/60 text-xs noot-text">
            {clientDisplayXp}/{clientXpToNext} XP
          </div>
        </div>
        
        {/* Right side - mobile nav buttons */}
        <div className="flex items-center md:hidden space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("farm")}
            className={`p-2 ${activeTab === "farm" ? "text-white bg-[#222]" : "text-white/70 hover:bg-[#222] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"} transition-all duration-200`}
          >
            <Home className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("quests")}
            className={`p-2 ${activeTab === "quests" ? "text-white bg-[#222]" : "text-white/70 hover:bg-[#222] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"} transition-all duration-200`}
          >
            <Trophy className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("market")}
            className={`p-2 ${activeTab === "market" ? "text-white bg-[#222]" : "text-white/70 hover:bg-[#222] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"} transition-all duration-200`}
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("social")}
            className={`p-2 ${activeTab === "social" ? "text-white bg-[#222]" : "text-white/70 hover:bg-[#222] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"} transition-all duration-200`}
          >
            <Users className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("profile")}
            className={`p-2 ${activeTab === "profile" ? "text-white bg-[#222]" : "text-white/70 hover:bg-[#222] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"} transition-all duration-200`}
          >
            <User className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("swap")}
            className={`p-2 ${activeTab === "swap" ? "text-white bg-[#222]" : "text-white/70 hover:bg-[#222] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"} transition-all duration-200`}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Accessibility Menu (desktop only) */}
        <div className="hidden md:block">
          <AccessibilityMenu />
        </div>
      </div>
    </div>
  );
}