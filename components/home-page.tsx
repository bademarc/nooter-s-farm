"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { Farm } from "@/components/farm";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { WalletConnect } from "@/components/wallet-connect";
import { GameProvider, GameContext } from "@/context/game-context";
import { Toaster as UIToaster } from "@/components/ui/toaster";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { 
  Menu, X, User, Trophy, Sparkles, Music, CloudRain, Settings, Volume,
  Check, Sprout, Coins, Lock
} from "lucide-react";

// Profile component
function ProfileContent() {
  const { farmCoins, playerLevel, playerXp } = useContext(GameContext);
  const [nickname, setNickname] = useState("Nooter");
  const [bio, setBio] = useState("I love farming!");
  const [editingProfile, setEditingProfile] = useState(false);
  
  return (
    <div className="mb-6">
      <div className="noot-card">
        <div className="border-b border-[#333] p-4">
          <h2 className="flex items-center text-white noot-title">
            <User className="h-5 w-5 mr-2" />
            Player Profile
          </h2>
          <p className="text-white/60 text-sm noot-text">
            Your farming identity
          </p>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Avatar & Stats */}
            <div className="md:w-1/3">
              <div className="bg-[#111] border border-[#333] p-6 text-center">
                <div className="w-24 h-24 bg-[#222] border border-[#333] mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/images/nooter.png" 
                    alt="Nooter Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="mb-4">
                  {!editingProfile ? (
                    <h2 className="text-xl font-bold mb-1 text-white noot-title">{nickname}</h2>
                  ) : (
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="bg-black border border-[#333] px-2 py-1 text-white text-center w-full mb-1 noot-text"
                      maxLength={20}
                    />
                  )}
                  
                  <div className="inline-flex items-center bg-black border border-[#333] px-2 py-1 text-sm text-white noot-text">
                    <Trophy className="mr-1 h-3 w-3" /> Level {playerLevel}
                  </div>
                </div>
                
                {!editingProfile ? (
                  <p className="text-sm bg-black border border-[#333] p-3 text-white noot-text">{bio}</p>
                ) : (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-black border border-[#333] p-2 text-white text-sm w-full h-20 noot-text"
                    maxLength={100}
                  />
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="mt-4 w-full text-xs"
                >
                  {editingProfile ? "Save Profile" : "Edit Profile"}
                </Button>
              </div>
            </div>
            
            {/* Statistics & Achievements */}
            <div className="md:w-2/3 space-y-6">
              <div className="bg-[#111] border border-[#333] p-5">
                <h3 className="text-lg font-bold mb-4 flex items-center text-white noot-title">
                  <Trophy className="h-5 w-5 mr-2 text-white" />
                  Farming Statistics
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-black border border-[#333]">
                    <div className="text-2xl font-bold text-white noot-title">1</div>
                    <div className="text-sm text-white/60 noot-text">Farms Created</div>
                  </div>
                  <div className="text-center p-3 bg-black border border-[#333]">
                    <div className="text-2xl font-bold text-white noot-title">0</div>
                    <div className="text-sm text-white/60 noot-text">Crops Harvested</div>
                  </div>
                  <div className="text-center p-3 bg-black border border-[#333]">
                    <div className="text-2xl font-bold text-white noot-title">{farmCoins}</div>
                    <div className="text-sm text-white/60 noot-text">Farm Coins</div>
                  </div>
                  <div className="text-center p-3 bg-black border border-[#333]">
                    <div className="text-2xl font-bold text-white noot-title">{playerXp}</div>
                    <div className="text-sm text-white/60 noot-text">Total XP</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#111] border border-[#333] p-5">
                <h3 className="text-lg font-bold mb-4 flex items-center text-white noot-title">
                  <Sparkles className="h-5 w-5 mr-2 text-white" />
                  Achievements
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center p-3 bg-black border border-[#333] noot-text">
                    <div className="w-10 h-10 bg-[#222] border border-[#333] flex items-center justify-center mr-3">
                      <Sprout className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-white">New Farmer</div>
                      <div className="text-xs text-white/60">Start your farming journey</div>
                    </div>
                    <div className="ml-auto">
                      <div className="w-6 h-6 bg-white flex items-center justify-center">
                        <Check className="h-4 w-4 text-black" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-black border border-[#333] opacity-60 noot-text">
                    <div className="w-10 h-10 bg-[#222] border border-[#333] flex items-center justify-center mr-3">
                      <Coins className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Money Maker</div>
                      <div className="text-xs text-white/60">Earn 1000 Farm Coins</div>
                    </div>
                    <div className="ml-auto">
                      <div className="w-6 h-6 bg-[#222] border border-[#333] flex items-center justify-center">
                        <Lock className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings component
function SettingsContent() {
  const [volume, setVolume] = useState(100);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [weatherEffects, setWeatherEffects] = useState(true);
  const [highPerformance, setHighPerformance] = useState(false);
  
  return (
    <div className="mb-6">
      <div className="noot-card">
        <div className="border-b border-[#333] p-4">
          <h2 className="flex items-center text-white noot-title">
            <Settings className="h-5 w-5 mr-2" />
            Settings
          </h2>
          <p className="text-white/60 text-sm noot-text">
            Configure your farming experience
          </p>
        </div>
        <div className="p-6 space-y-5">
          {/* Audio Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white noot-title">Audio</h3>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center text-white noot-text">
                <Music className="mr-2 h-4 w-4" />
                Music
              </label>
              <Switch 
                checked={musicEnabled}
                onCheckedChange={setMusicEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center text-white noot-text">
                <Volume className="mr-2 h-4 w-4" />
                Sound Effects
              </label>
              <Switch 
                checked={soundsEnabled}
                onCheckedChange={setSoundsEnabled}
              />
            </div>
          </div>
          
          {/* Visual Settings */}
          <div className="space-y-3 pt-2">
            <h3 className="text-lg font-medium text-white noot-title">Visual</h3>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center text-white noot-text">
                <CloudRain className="mr-2 h-4 w-4" />
                Weather Effects
              </label>
              <Switch 
                checked={weatherEffects}
                onCheckedChange={setWeatherEffects}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center text-white noot-text">
                <Sparkles className="mr-2 h-4 w-4" />
                High Performance Mode
              </label>
              <Switch 
                checked={highPerformance}
                onCheckedChange={setHighPerformance}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [tab, setTab] = useState("farm");
  const [activeView, setActiveView] = useState("farm");
  const [isMounted, setIsMounted] = useState(false);

  // Handle mobile menu
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    if (showSidebar) {
      setShowSidebar(false);
    }
  };

  // Use a callback for clipboard operations that only works client-side
  const copyToClipboard = useCallback((text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          toast.success("Contract address copied to clipboard");
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          toast.error("Failed to copy to clipboard");
        });
    }
  }, []);

  // Set isMounted to true after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <GameProvider>
      <div className="flex min-h-screen w-full bg-black text-white relative noot-theme">
        {/* Dark overlay when sidebar is visible on mobile */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-20 md:hidden" 
            onClick={handleOverlayClick}
          />
        )}
        
        {/* Sidebar */}
        <Sidebar 
          showSidebar={showSidebar} 
          setShowSidebar={setShowSidebar}
          activeTab={tab}
          setActiveTab={setTab}
          activeView={activeView}
          setActiveView={setActiveView}
          provider={null}
          isConnected={false}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen bg-black">
          <Navbar 
            toggleSidebar={toggleSidebar} 
            activeTab={tab}
            setActiveTab={setTab}
          />
          
          <div className="flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6 relative">
            {tab === "farm" && <Farm />}
            {tab === "profile" && <div className="animate-fadeIn"><ProfileContent /></div>}
            {tab === "settings" && <div className="animate-fadeIn"><SettingsContent /></div>}
          </div>
        </main>
        
        <WalletConnect />
        
        <UIToaster />
        
        {/* NOOT Contract Address Display */}
        <div className="fixed bottom-4 left-4 md:left-1/2 md:transform md:-translate-x-1/2 z-10 bg-[#111] border border-[#333] py-1 px-3 text-xs font-mono text-white/60 flex items-center noot-text">
          <span className="mr-2">$NOOT:</span>
          <span className="hidden md:inline">0x85Ca16Fd0e81659e0b8Be337294149E722528731</span>
          <span className="md:hidden">0x85Ca...28731</span>
          <button 
            className="ml-2 text-white/40 hover:text-white" 
            onClick={() => {
              if (isMounted) {
                copyToClipboard("0x85Ca16Fd0e81659e0b8Be337294149E722528731");
              }
            }}
          >
            copy
          </button>
        </div>
      </div>
    </GameProvider>
  );
} 