'use client';

import React, { useEffect, useRef } from 'react';

interface NootIoWrapperProps {
  farmCoins: number;
  addFarmCoins: (amount: number) => void;
}

const NootIoWrapper: React.FC<NootIoWrapperProps> = ({ farmCoins, addFarmCoins }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isInitialRender = useRef(true);

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
    if (iframe && iframe.contentWindow) {
      // Wait for iframe to load
      const onIframeLoad = () => {
        // Send initial coins data to the game
        iframe.contentWindow?.postMessage({
          type: 'noot-io-init',
          farmCoins
        }, '*');
      };

      if (iframe.complete) {
        onIframeLoad();
      } else {
        iframe.addEventListener('load', onIframeLoad);
        return () => iframe.removeEventListener('load', onIframeLoad);
      }
    }
  }, [farmCoins]);

  // Function to send commands to the iframe
  const sendCommandToGame = (command: string) => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'noot-io-command',
        command: command
      }, parentOrigin); // Use the stored origin or '*' if not set yet
    } else {
      console.error("Cannot send command: Iframe not ready.");
    }
  };

  return (
    <div className="w-full h-[600px] flex flex-col items-center">
      {/* Add buttons above the iframe */}
      <div className="mb-2 flex space-x-4">
         {/* <button
           onClick={() => sendCommandToGame('start-online')} // Assuming default is online or handle explicitly
           className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition duration-150"
         >
           Play Online (Implicit)
         </button> */}
         <button
           onClick={() => sendCommandToGame('start-offline')}
           className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition duration-150"
         >
           Play Offline (vs Bots)
         </button>
      </div>
      <iframe
        ref={iframeRef}
        src="/noot-io/client/index.html"
        className="w-full h-full border-none"
        title="Noot.io Game"
        allowFullScreen
      />
      <div className="mt-4 text-white text-center text-sm">
        <p>Tip: Eat smaller cells and food to grow bigger! Avoid larger cells.</p>
        <p className="text-yellow-400 mt-2">
          Every 100 mass points you gain adds 10 Farm Coins!
        </p>
      </div>
    </div>
  );
};

export default NootIoWrapper; 