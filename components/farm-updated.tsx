'use client';

import { useState } from "react";
import { useContext } from "react";
import { GameContext } from "@/context/game-context";
import ClientWrapper from "./farm-game/ClientWrapper";

export function FarmUpdated() {
  const [activeTab, setActiveTab] = useState<"fields" | "barn" | "market" | "defend">("fields");
  const { farmCoins, addFarmCoins } = useContext(GameContext);
  
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-[#333]">
        <button 
          className={`px-4 py-2 focus:outline-none ${activeTab === "fields" ? "bg-white text-black" : "text-white"}`}
          onClick={() => setActiveTab("fields")}
        >
          Fields
        </button>
        <button 
          className={`px-4 py-2 focus:outline-none ${activeTab === "barn" ? "bg-white text-black" : "text-white"}`}
          onClick={() => setActiveTab("barn")}
        >
          Barn
        </button>
        <button 
          className={`px-4 py-2 focus:outline-none ${activeTab === "market" ? "bg-white text-black" : "text-white"}`}
          onClick={() => setActiveTab("market")}
        >
          Market
        </button>
        <button 
          className={`px-4 py-2 focus:outline-none ${activeTab === "defend" ? "bg-white text-black" : "text-white"}`}
          onClick={() => setActiveTab("defend")}
        >
          Defend Farm
        </button>
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "fields" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Your Fields</h2>
            {/* Fields content here */}
            <p>This is where you grow your crops.</p>
          </div>
        )}
        
        {activeTab === "barn" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Your Barn</h2>
            {/* Barn content here */}
            <p>This is where your harvested crops are stored.</p>
          </div>
        )}
        
        {activeTab === "market" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Market</h2>
            {/* Market content here */}
            <p>Buy and sell crops and items here.</p>
          </div>
        )}
        
        {activeTab === "defend" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Defend Your Farm</h2>
            {/* Use the ClientWrapper to safely load the game */}
            <ClientWrapper farmCoins={farmCoins} addFarmCoins={addFarmCoins} />
          </div>
        )}
      </div>
    </div>
  );
} 