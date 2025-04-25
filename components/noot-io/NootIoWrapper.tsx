'use client';

import React, { useEffect, useRef, useState } from 'react';

interface NootIoWrapperProps {
  farmCoins: number;
  addFarmCoins: (amount: number) => void;
}

const NootIoWrapper: React.FC<NootIoWrapperProps> = ({ farmCoins, addFarmCoins }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isInitialRender = useRef(true);
  const [gameMode, setGameMode] = useState<'offline' | 'online' | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set up message listener to handle events from the iframe
    const handleMessage = (event: MessageEvent) => {
      // Make sure message is from our game
      if (event.data && event.data.type === 'noot-io') {
        // Handle different message types
        if (event.data.action === 'earn-coins') {
          // Add coins when the player earns them in the game
          addFarmCoins(event.data.coins || 0);
        } else if (event.data.action === 'game-mode-changed') {
          // Update game mode state when it changes in the iframe
          setGameMode(event.data.mode);
        } else if (event.data.action === 'game-started') {
          console.log('Game started in mode:', event.data.mode);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Cleanup function
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [addFarmCoins]);

  // Send initial farm coins to the game when it loads
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow && iframeLoaded) {
      // Send initial coins data to the game
      iframe.contentWindow.postMessage({
        type: 'noot-io-init',
        farmCoins
      }, '*');
      
      console.log('Sent initial farm coins to game:', farmCoins);
    }
  }, [farmCoins, iframeLoaded]);
  
  // Handle iframe load event
  const handleIframeLoad = () => {
    setIframeLoaded(true);
    console.log('Noot.io iframe loaded');
    
    // Auto-start in offline mode after a short delay
    setTimeout(() => {
      if (!gameMode) {
        console.log('Auto-starting game in offline mode');
        sendCommandToGame('start-offline');
      }
    }, 1000);
  };

  // Function to send commands to the iframe
  const sendCommandToGame = (command: string) => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      console.log('Sending command to game:', command);
      iframe.contentWindow.postMessage({
        type: 'noot-io-command',
        command: command
      }, "*"); // Use '*' as the target origin when sending command to iframe
      
      // Update local game mode state
      if (command === 'start-offline') {
        setGameMode('offline');
      } else if (command === 'start-online') {
        setGameMode('online');
      }
    } else {
      console.error("Cannot send command: Iframe not ready.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center" style={{ minHeight: '600px' }}>
      {/* Game status */}
      {gameMode && (
        <div className="mb-2 text-sm">
          <span className={`px-2 py-1 rounded ${gameMode === 'offline' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {gameMode === 'offline' ? 'Offline Mode' : 'Online Mode'}
          </span>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src="/noot-io/client/index.html"
        className="w-full h-full border-none"
        style={{ flex: 1, minHeight: '600px', position: 'relative', zIndex: 10 }}
        title="Noot.io Game"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin"
        onLoad={handleIframeLoad}
      />
      <div className="mt-4 text-white text-center text-sm">
        <p>Tip: Eat smaller cells and food to grow bigger! Avoid larger cells.</p>
        <p className="mt-1">Press SPACE to split your cell, W to eject mass.</p>
        <p className="text-yellow-400 mt-2">
          Every 100 mass points you gain adds 10 Farm Coins!
        </p>
      </div>
    </div>
  );
};

export default NootIoWrapper; 