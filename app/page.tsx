"use client";

import React from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';

// Define Loader component
const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loader-container">
        <div className="logo-container">
          <div className="logo">N</div>
          <div className="glow-effect"></div>
        </div>
        
        <div className="sparkles-container">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`sparkle sparkle-${i+1}`}></div>
          ))}
        </div>
        
        <div className="progress-container">
          <div className="loading-text">
            <span>L</span>
            <span>O</span>
            <span>A</span>
            <span>D</span>
            <span>I</span>
            <span>N</span>
            <span>G</span>
            <span className="dots">
              <span className="dot">.</span>
              <span className="dot">.</span>
              <span className="dot">.</span>
            </span>
          </div>
          
          <div className="progress-bar">
            <div className="progress-track"></div>
            <div className="progress-fill"></div>
            <div className="progress-glow"></div>
          </div>
          
          <div className="status-text">NOOTER'S FARM</div>
        </div>
        
        <div className="grid-background">
          <div className="grid-line horizontal"></div>
          <div className="grid-line horizontal"></div>
          <div className="grid-line horizontal"></div>
          <div className="grid-line horizontal"></div>
          <div className="grid-line vertical"></div>
          <div className="grid-line vertical"></div>
          <div className="grid-line vertical"></div>
          <div className="grid-line vertical"></div>
        </div>
        
        <div className="farm-icons">
          <div className="farm-icon icon-shovel">⛏️</div>
          <div className="farm-icon icon-plant">🌱</div>
          <div className="farm-icon icon-coin">🪙</div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  overflow: hidden;
  position: relative;
  
  .loader-container {
    position: relative;
    width: 300px;
    height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  /* Grid background */
  .grid-background {
    position: absolute;
    inset: -100px;
    opacity: 0.15;
    z-index: 0;
  }
  
  .grid-line {
    position: absolute;
    background: rgba(255, 255, 255, 0.3);
  }
  
  .grid-line.horizontal {
    width: 100%;
    height: 1px;
    transform-origin: center;
  }
  
  .grid-line.horizontal:nth-child(1) { top: 20%; animation: gridPulse 4s infinite alternate; }
  .grid-line.horizontal:nth-child(2) { top: 40%; animation: gridPulse 4s infinite alternate 0.5s; }
  .grid-line.horizontal:nth-child(3) { top: 60%; animation: gridPulse 4s infinite alternate 1s; }
  .grid-line.horizontal:nth-child(4) { top: 80%; animation: gridPulse 4s infinite alternate 1.5s; }
  
  .grid-line.vertical {
    height: 100%;
    width: 1px;
    transform-origin: center;
  }
  
  .grid-line.vertical:nth-child(5) { left: 20%; animation: gridPulse 4s infinite alternate 0.2s; }
  .grid-line.vertical:nth-child(6) { left: 40%; animation: gridPulse 4s infinite alternate 0.7s; }
  .grid-line.vertical:nth-child(7) { left: 60%; animation: gridPulse 4s infinite alternate 1.2s; }
  .grid-line.vertical:nth-child(8) { left: 80%; animation: gridPulse 4s infinite alternate 1.7s; }
  
  @keyframes gridPulse {
    0% { opacity: 0.1; }
    100% { opacity: 0.3; }
  }
  
  /* Logo */
  .logo-container {
    position: relative;
    width: 100px;
    height: 100px;
    margin-bottom: 40px;
    z-index: 2;
  }
  
  .logo {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Arial', sans-serif;
    font-weight: 900;
    font-size: 64px;
    color: white;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
    animation: logoFloat 3s ease-in-out infinite;
  }
  
  @keyframes logoFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .glow-effect {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);
    animation: glowPulse 2s ease-in-out infinite;
  }
  
  @keyframes glowPulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.2); opacity: 0.5; }
  }
  
  /* Sparkles */
  .sparkles-container {
    position: absolute;
    inset: 0;
    z-index: 1;
  }
  
  .sparkle {
    position: absolute;
    width: 2px;
    height: 2px;
    background: white;
    border-radius: 50%;
    opacity: 0;
    animation: sparkleFade 3s infinite;
  }
  
  ${[...Array(20)].map((_, i) => `
    .sparkle-${i+1} {
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      animation-delay: ${Math.random() * 3}s;
      animation-duration: ${2 + Math.random() * 3}s;
    }
  `).join('')}
  
  @keyframes sparkleFade {
    0% { transform: scale(0); opacity: 0; }
    20% { transform: scale(1); opacity: 1; }
    80% { transform: scale(1); opacity: 1; }
    100% { transform: scale(0); opacity: 0; }
  }
  
  /* Progress Container */
  .progress-container {
    position: relative;
    width: 100%;
    z-index: 2;
  }
  
  /* Loading Text */
  .loading-text {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Arial', sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: white;
    letter-spacing: 2px;
    margin-bottom: 10px;
  }
  
  .loading-text span {
    display: inline-block;
    animation: textBounce 1.5s infinite alternate;
  }
  
  .loading-text span:nth-child(2) { animation-delay: 0.1s; }
  .loading-text span:nth-child(3) { animation-delay: 0.2s; }
  .loading-text span:nth-child(4) { animation-delay: 0.3s; }
  .loading-text span:nth-child(5) { animation-delay: 0.4s; }
  .loading-text span:nth-child(6) { animation-delay: 0.5s; }
  .loading-text span:nth-child(7) { animation-delay: 0.6s; }
  
  @keyframes textBounce {
    from { transform: translateY(0); opacity: 0.5; }
    to { transform: translateY(-5px); opacity: 1; }
  }
  
  .dots {
    display: flex;
    margin-left: 5px;
  }
  
  .dot {
    animation: dotBlink 1s infinite;
  }
  
  .dot:nth-child(2) { animation-delay: 0.3s; }
  .dot:nth-child(3) { animation-delay: 0.6s; }
  
  @keyframes dotBlink {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
  }
  
  /* Progress Bar */
  .progress-bar {
    position: relative;
    width: 100%;
    height: 4px;
    background: #222;
    border-radius: 2px;
    overflow: hidden;
    margin: 10px 0 15px;
  }
  
  .progress-track {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      rgba(255,255,255,0) 0%, 
      rgba(255,255,255,0.1) 50%, 
      rgba(255,255,255,0) 100%);
    animation: trackShine 2s linear infinite;
  }
  
  @keyframes trackShine {
    from { transform: translateX(-100%); }
    to { transform: translateX(100%); }
  }
  
  .progress-fill {
    position: absolute;
    height: 100%;
    width: 0%;
    background: white;
    border-radius: 2px;
    animation: progressFill 3s forwards infinite ease-in-out;
  }
  
  @keyframes progressFill {
    0% { width: 0%; }
    50% { width: 70%; }
    80% { width: 85%; }
    100% { width: 100%; }
  }
  
  .progress-glow {
    position: absolute;
    top: -2px;
    right: -5px;
    width: 10px;
    height: 8px;
    background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%);
    filter: blur(1px);
    opacity: 0.8;
    animation: progressFill 3s forwards infinite ease-in-out;
  }
  
  /* Status Text */
  .status-text {
    font-family: 'Arial', sans-serif;
    font-weight: 800;
    font-size: 22px;
    text-align: center;
    background: linear-gradient(to right, #fff, #888, #fff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 3s infinite linear;
  }
  
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: 200px 0; }
  }
  
  /* Farm Icons */
  .farm-icons {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0.2;
    z-index: 1;
    filter: grayscale(100%) brightness(1.5);
  }
  
  .farm-icon {
    position: absolute;
    font-size: 24px;
    opacity: 0;
    animation: iconFloat 5s infinite;
  }
  
  .icon-shovel {
    left: 10%;
    top: 70%;
    animation-delay: 0.5s;
  }
  
  .icon-plant {
    right: 15%;
    top: 30%;
    animation-delay: 1.5s;
  }
  
  .icon-coin {
    left: 40%;
    bottom: 10%;
    animation-delay: 1s;
  }
  
  @keyframes iconFloat {
    0% { transform: translateY(20px) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-20px) rotate(10deg); opacity: 0; }
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
    <Suspense fallback={<Loader />}>
      <HomePage />
    </Suspense>
  );
}