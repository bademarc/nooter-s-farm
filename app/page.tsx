"use client";

import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';

// Import the actual Home component with SSR disabled entirely
const HomePage = dynamic(() => import('@/components/home-page'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-black text-white">
      <div className="animate-pulse">
        Loading Nooter's Farm...
      </div>
    </div>
  ),
});

export default function Page() {
  // Apply fixes when component mounts
  useEffect(() => {
    // Apply game over z-index fix
    const fixGameOverZIndex = () => {
      if (typeof window === 'undefined' || !window.document) return;
      
      // Create a script element to add the fix directly to the page
      const script = document.createElement('script');
      script.innerText = `
        // Fix game over z-index
        (function() {
          const checkGameInterval = setInterval(() => {
            if (window.Phaser) {
              clearInterval(checkGameInterval);
              console.log("Applying game over z-index fix...");
              
              const fixZIndex = () => {
                const game = window.game || (window.Phaser.Game && window.Phaser.Game.instance);
                if (!game || !game.scene) return;
                
                // Apply fix to all scenes
                game.scene.scenes.forEach(scene => {
                  if (!scene || !scene.children || !scene.children.list) return;
                  
                  // Find highest existing depth
                  let maxDepth = 10;
                  scene.children.list.forEach(child => {
                    if (child.depth > maxDepth) maxDepth = child.depth;
                  });
                  
                  // Set UI z-index much higher
                  const uiDepth = maxDepth + 1000;
                  
                  // Fix all text elements first
                  scene.children.list.forEach(child => {
                    if (child.type === 'Text' && typeof child.setDepth === 'function') {
                      // Game over related text gets higher priority
                      if (child.text && (
                          child.text.includes('GAME OVER') || 
                          child.text.includes('Game Over') ||
                          child.text.includes('Score') ||
                          child.text.toLowerCase().includes('restart'))) {
                        child.setDepth(uiDepth);
                      } else {
                        // Other text still above game elements
                        child.setDepth(uiDepth - 100);
                      }
                    }
                    
                    // Fix containers that might hold UI
                    if (child.type === 'Container' && typeof child.setDepth === 'function') {
                      if (child.name && (
                          child.name.includes('UI') || 
                          child.name.includes('over') || 
                          child.name.includes('Game'))) {
                        child.setDepth(uiDepth);
                      }
                    }
                  });
                });
              };
              
              // Run fix now and periodically
              fixZIndex();
              setInterval(fixZIndex, 1000);
            }
          }, 500);
        })();
      `;
      
      // Add the script to the document
      document.body.appendChild(script);
    };
    
    fixGameOverZIndex();
  }, []);
  
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">
          Loading Nooter's Farm...
        </div>
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}