"use client";

import { useContext, useState, useEffect } from "react";
import { GameContext } from "@/context/game-context";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  Trophy, 
  Package, 
  Settings, 
  User, 
  Repeat, 
  ChevronRight, 
  Sprout, 
  ChevronsLeft, 
  ChevronsRight, 
  Home,
  BarChart,
  X,
  Sun,
  Moon,
  Coins,
  Gamepad2,
  ArrowRightLeft,
  Users,
  Wallet,
  Briefcase,
  BookOpen
} from "lucide-react";
import { Leaderboard } from "./leaderboard";
import { ethers, Contract } from "ethers";
import { AccessibilityMenu } from "./accessibility-menu";
import Link from "next/link";

// Add type declarations for window.gameFunctions
declare global {
  interface Window {
    gameFunctions?: {
      resetGame: () => void;
    };
  }
}

export interface SidebarProps {
  provider?: any; // Using a more generic type for provider
  isConnected?: boolean;
  setActiveView: (view: string) => void;
  activeView: string;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar = ({ 
  provider, 
  isConnected,
  setActiveView,
  activeView,
  showSidebar,
  setShowSidebar,
  activeTab,
  setActiveTab
}: SidebarProps) => {
  const { farmCoins, seeds, playerLevel, playerXp, upgradeSeed, resetGame } = useContext(GameContext);
  const [openTab, setOpenTab] = useState<string | null>("swap");
  const [collapsed, setCollapsed] = useState(false);
  const [clientSideFarmCoins, setClientSideFarmCoins] = useState<number>(0);
  const [isCoinAnimating, setIsCoinAnimating] = useState(false);
  
  // Set farm coins only on client side to avoid hydration mismatch
  useEffect(() => {
    // Check if the farmCoins value has actually changed from the displayed value
    if (farmCoins !== clientSideFarmCoins) {
        // Only trigger animation if it's not the initial load (where clientSideFarmCoins is 0)
        if (clientSideFarmCoins !== 0) {
            setIsCoinAnimating(true);
            const timer = setTimeout(() => setIsCoinAnimating(false), 500); // Animation duration
            // Cleanup function to clear the timeout
             // Important: This cleanup needs to be returned correctly
             const cleanup = () => clearTimeout(timer);
             return cleanup;
        }
        // Update the displayed value regardless of animation
        setClientSideFarmCoins(farmCoins);
    }
    // This handles the initial load case gracefully or when farmCoins becomes 0
    else if ((clientSideFarmCoins === 0 && farmCoins !== 0) || (clientSideFarmCoins !== 0 && farmCoins === 0)) {
       setClientSideFarmCoins(farmCoins);
    }
  
  }, [farmCoins, clientSideFarmCoins]); // Add clientSideFarmCoins as a dependency

  const handleMintNFT = async () => {
    if (!provider || !isConnected) {
      alert("Please connect your wallet first!");
      return;
    }
    try {
      const signer = await provider.getSigner();
      const contractAddress = "YOUR_NFT_CONTRACT_ADDRESS"; // Replace with actual address
      const nftABI = ["function mint(address to) external"];
      const contract = new Contract(contractAddress, nftABI, signer);
      const tx = await contract.mint(await signer.getAddress());
      await tx.wait();
      alert("NFT minted successfully!");
    } catch (error) {
      console.error("Mint failed:", error);
      alert("Failed to mint NFT.");
    }
  };

  const handleResetGame = () => {
    try {
      // Call the reset game function from the game component
      if (typeof window !== 'undefined' && window.gameFunctions?.resetGame) {
        window.gameFunctions.resetGame();
        // Reset farm coins in the context
        resetGame();
        console.log("Game reset successfully");
      } else {
        console.error("Reset game function not available");
      }
    } catch (error) {
      console.error("Error resetting game:", error);
    }
  };

  const renderTabContent = () => {
    switch (openTab) {
      case "market":
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-gradient">Market</h2>
            <p className="text-foreground/80">Coming soon! Buy special items for your farm.</p>
          </div>
        );
      case "leaderboard":
        return <Leaderboard />;
      case "inventory":
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-gradient">Inventory</h2>
            <p className="text-foreground/80">Your items will appear here.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    
    if (tab === "farm") {
      setActiveView('farm');
      window.location.href = '/';
    } else if (tab === "market") {
      setActiveView('market');
    } else if (tab === "social") {
      setActiveView('social');
      window.location.href = '/social-hub';
    } else if (tab === "case-simulator") {
      setActiveView('case-simulator');
      window.location.href = '/case-simulator';
    } else if (tab === "swap") {
      setActiveView('swap');
    } else if (tab === "profile" || tab === "settings") {
      setActiveView(tab);
    } else {
      setActiveView(tab);
    }
    
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  return (
    <aside 
      className={`fixed md:sticky top-0 left-0 z-30 h-full w-72 bg-black border-r border-[#333] transition-all duration-300 transform overflow-hidden 
      ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <div className="flex flex-col h-full overflow-auto">
        {/* Close button - only visible on mobile */}
        <div className="md:hidden absolute top-4 right-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-[#222] text-white"
            onClick={() => setShowSidebar(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Logo and game title */}
        <div className="p-4 border-b border-[#333] flex items-center justify-center">
          <div className="relative group">
            <div className="w-12 h-12 rounded-none bg-black border border-[#333] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform overflow-hidden">
              <img src="/images/nooter.png" alt="Nooter" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="ml-3">
            <h1 className="font-bold text-xl text-white noot-title">Nooter's Farm</h1>
            <p className="text-xs text-white/60 noot-text">First Noot Noot Playground on Abstract</p>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="px-2 py-4 space-y-1">
          <Button 
            variant={activeTab === "farm" ? "default" : "ghost"} 
            className={`w-full justify-start rounded-none border border-transparent noot-text transition-all duration-200 ${activeTab === "farm" ? "bg-white text-black hover:bg-white/90" : "text-white/80 hover:bg-[#222] hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"}`}
            onClick={() => handleTabClick("farm")}
          >
            <Home className="h-4 w-4 mr-2" />
            <span>Farm</span>
            {activeTab === "farm" && (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )}
          </Button>
          
          <Link href="/guide" passHref legacyBehavior>
            <Button 
              variant={"ghost"}
              className={`w-full justify-start rounded-none border border-transparent noot-text text-white/80 hover:bg-[#222] hover:text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              <span>Game Guide</span>
            </Button>
          </Link>
          
          <Button 
            variant={activeTab === "profile" ? "default" : "ghost"} 
            className={`w-full justify-start rounded-none border border-transparent noot-text transition-all duration-200 ${activeTab === "profile" ? "bg-white text-black hover:bg-white/90" : "text-white/80 hover:bg-[#222] hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"}`}
            onClick={() => handleTabClick("profile")}
          >
            <User className="h-4 w-4 mr-2" />
            <span>Profile</span>
            {activeTab === "profile" && (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )}
          </Button>
          
          <Button 
            variant={activeTab === "settings" ? "default" : "ghost"} 
            className={`w-full justify-start rounded-none border border-transparent noot-text transition-all duration-200 ${activeTab === "settings" ? "bg-white text-black hover:bg-white/90" : "text-white/80 hover:bg-[#222] hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"}`}
            onClick={() => handleTabClick("settings")}
          >
            <Settings className="h-4 w-4 mr-2" />
            <span>Settings</span>
            {activeTab === "settings" && (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )}
          </Button>
          
          <Link
            href="/farm-cases"
            className="flex w-full items-center rounded-none border border-transparent px-3 py-2 text-white/80 hover:bg-[#222] hover:text-white noot-text transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          >
            <Package className="h-4 w-4 mr-2" />
            <span className="text-sm">Noot Gamble</span>
          </Link>
          
          <Button
            variant={activeTab === "social" ? "default" : "ghost"}
            className={`w-full justify-start rounded-none border border-transparent noot-text transition-all duration-200 ${activeTab === "social" ? "bg-white text-black hover:bg-white/90" : "text-white/80 hover:bg-[#222] hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"}`}
            onClick={() => handleTabClick("social")}
          >
            <Users className="h-4 w-4 mr-2" />
            <span>Social Hub</span>
            {activeTab === "social" && (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )}
          </Button>
          
          <div className="flex-grow"></div>
          
          {!collapsed && (
            <div className="pt-4 border-t border-[#333] mt-4">
              <Button
                variant="outline"
                className="w-full justify-start rounded-none border-[#333] text-white hover:bg-[#222] hover:text-white noot-text transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                onClick={handleResetGame}
              >
                <Repeat className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          )}
        </nav>
        
        {/* Farm Coins display */}
        <div className="px-4 py-3 border-y border-[#333]">
          <div className="flex items-center">
            <Coins className="h-5 w-5 text-yellow-500 mr-2" />
            <div>
              <div className="text-sm text-white/70 noot-text">Farm Coins</div>
              <div className={`font-bold text-lg noot-title transition-all duration-300 ${isCoinAnimating ? 'animate-pulse text-yellow-400 scale-105' : 'text-white'}`}>
                {clientSideFarmCoins.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tokenomics information */}
        <div className="p-4 border-t border-[#333] text-xs text-white/60 space-y-2 noot-text">
          <div className="flex justify-between">
            <span>Total Supply</span>
            <span>1,000,000,000 $NOOT</span>
          </div>
          <div className="flex justify-between">
            <span>Network</span>
            <span>Abstract</span>
          </div>
          <div className="flex justify-between">
            <span>Taxes</span>
            <span>No taxes</span>
          </div>
          <div className="flex justify-between">
            <span>Liquidity</span>
            <span>Locked</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

