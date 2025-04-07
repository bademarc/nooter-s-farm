'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import FarmGame with SSR disabled
const FarmGame = dynamic(
  () => import('./FarmGame').then((mod) => mod.default || mod),
  { ssr: false, loading: () => <LoadingPlaceholder /> }
);

// Loading placeholder component
function LoadingPlaceholder() {
  return (
    <div className="w-full max-w-[800px] h-[600px] md:h-[600px] h-[400px] flex items-center justify-center bg-black/20 border border-white/10 overflow-hidden">
      <div className="text-white text-center px-4">
        <div className="mb-4">Loading farm defense game...</div>
        <div className="text-sm text-white/60">Please wait while we load the game</div>
      </div>
    </div>
  );
}

// Client-side wrapper component
export default function ClientWrapper({ farmCoins, addFarmCoins }: { 
  farmCoins: number, 
  addFarmCoins: (amount: number) => void 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    console.log("ClientWrapper mounted");
    setIsMounted(true);
    
    // Check if we're on a mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Only render the FarmGame component on the client
  if (!isMounted) {
    return <LoadingPlaceholder />;
  }
  
  console.log("Rendering FarmGame with coins:", farmCoins, "Mobile:", isMobile);
  return (
    <div className={`farm-game-container w-full ${isMobile ? 'mobile-view' : ''}`}>
      <FarmGame farmCoins={farmCoins} addFarmCoins={addFarmCoins} />
    </div>
  );
} 