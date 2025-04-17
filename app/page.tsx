"use client";

import React from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';

// Define Loader component
const Loader = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="loader">
          <p>loading</p>
          <div className="words">
            <span className="word">game</span>
            <span className="word">tokens</span>
            <span className="word">cases</span>
            <span className="word">$NOOT</span>
            <span className="word">Abstract Testnet</span>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`

  * {
    background-color: #000;
     display: flex;
  justify-content: center;
  align-items: center;
  
    }
  .card {
  
  /* color used to softly clip top and bottom of the .words container */
  padding: 1rem 2rem;
  border-radius: 1.25rem;
  background-color: #000;
  justify-content: center;
  align-items: center;
}
.loader {
background-color: #000;
  font-family: "Poppins", sans-serif;
  font-weight: 500;
  font-size: 25px;
  -webkit-box-sizing: content-box;
  box-sizing: content-box;
  height: 40px;
  padding: 10px 10px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
}

.words {
  overflow: hidden;
  position: relative;
  background-color: #000;
}
.words::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    var(--bg-color) 10%,
    transparent 30%,
    transparent 70%,
    var(--bg-color) 90%
  );
  z-index: 20;
}

.word {
  display: block;
  height: 100%;
  padding-left: 6px;
  color: grey;
  animation: spin_4991 4s infinite;
}

@keyframes spin_4991 {
  10% {
    -webkit-transform: translateY(-102%);
    transform: translateY(-102%);
  }

  25% {
    -webkit-transform: translateY(-100%);
    transform: translateY(-100%);
  }

  35% {
    -webkit-transform: translateY(-202%);
    transform: translateY(-202%);
  }

  50% {
    -webkit-transform: translateY(-200%);
    transform: translateY(-200%);
  }

  60% {
    -webkit-transform: translateY(-302%);
    transform: translateY(-302%);
  }

  75% {
    -webkit-transform: translateY(-300%);
    transform: translateY(-300%);
  }

  85% {
    -webkit-transform: translateY(-402%);
    transform: translateY(-402%);
  }

  100% {
    -webkit-transform: translateY(-400%);
    transform: translateY(-400%);
  }
}
`;

// Import the actual Home component with SSR disabled entirely
const HomePage = dynamic(() => import('@/components/home-page'), {
  ssr: false,
  loading: () => <Loader />
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