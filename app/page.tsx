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
        <div className="farm-scene">
          <div className="sun"></div>
          <div className="clouds">
            <div className="cloud cloud1"></div>
            <div className="cloud cloud2"></div>
            <div className="cloud cloud3"></div>
          </div>
          <div className="tractor">
            <div className="tractor-body"></div>
            <div className="tractor-wheel wheel1"></div>
            <div className="tractor-wheel wheel2"></div>
          </div>
          <div className="crop crop1"></div>
          <div className="crop crop2"></div>
          <div className="crop crop3"></div>
          <div className="crop crop4"></div>
          <div className="crop crop5"></div>
        </div>
        <div className="coins-container">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`coin coin${i+1}`}></div>
          ))}
        </div>
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
          <div className="progress-fill"></div>
        </div>
        <div className="noot-text">NOOTER'S FARM</div>
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
  background: radial-gradient(circle, #150521 0%, #080110 100%);
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
  
  .farm-scene {
    width: 100%;
    height: 200px;
    position: relative;
    perspective: 500px;
  }
  
  .sun {
    position: absolute;
    top: 20px;
    right: 30px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(to bottom right, #ff9500, #ff5500);
    box-shadow: 0 0 30px #ff5500, 0 0 60px #ff3700;
    animation: pulse 3s infinite alternate;
  }
  
  @keyframes pulse {
    from { transform: scale(1); opacity: 0.8; }
    to { transform: scale(1.1); opacity: 1; }
  }
  
  .clouds {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
  }
  
  .cloud {
    position: absolute;
    background: rgba(128, 100, 169, 0.3);
    border-radius: 50%;
    filter: blur(5px);
  }
  
  .cloud1 {
    width: 80px;
    height: 30px;
    top: 40px;
    left: 20px;
    animation: floatCloud 20s linear infinite;
  }
  
  .cloud2 {
    width: 60px;
    height: 25px;
    top: 70px;
    left: -60px;
    animation: floatCloud 15s linear infinite;
  }
  
  .cloud3 {
    width: 70px;
    height: 25px;
    top: 30px;
    left: -30px;
    animation: floatCloud 18s linear infinite 2s;
  }
  
  @keyframes floatCloud {
    from { transform: translateX(0); }
    to { transform: translateX(400px); }
  }
  
  .tractor {
    position: absolute;
    bottom: 20px;
    left: 50px;
    animation: tractorMove 5s infinite alternate ease-in-out;
  }
  
  @keyframes tractorMove {
    from { transform: translateX(0); }
    to { transform: translateX(150px); }
  }
  
  .tractor-body {
    width: 60px;
    height: 30px;
    background: #cf2c7c;
    border-radius: 8px 15px 5px 5px;
    position: relative;
    z-index: 2;
    box-shadow: 0 0 15px #cf2c7c;
  }
  
  .tractor-body:before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: #cf2c7c;
    top: -15px;
    left: 15px;
    border-radius: 5px;
  }
  
  .tractor-wheel {
    position: absolute;
    background: #570861;
    border-radius: 50%;
    border: 3px solid #8a2be2;
    animation: wheelSpin 1s linear infinite;
    box-shadow: 0 0 10px #8a2be2;
  }
  
  .wheel1 {
    width: 20px;
    height: 20px;
    bottom: -10px;
    left: 5px;
  }
  
  .wheel2 {
    width: 25px;
    height: 25px;
    bottom: -12px;
    right: 5px;
  }
  
  @keyframes wheelSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .crop {
    position: absolute;
    bottom: 10px;
    width: 15px;
    height: 30px;
    background: linear-gradient(to top, transparent, #4CAF50);
    animation: growCrop 3s infinite alternate;
  }
  
  .crop:before {
    content: '';
    position: absolute;
    top: -5px;
    left: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #FFEB3B;
  }
  
  .crop1 { left: 20px; animation-delay: 0.2s; }
  .crop2 { left: 50px; animation-delay: 0.5s; }
  .crop3 { left: 80px; animation-delay: 0.8s; }
  .crop4 { left: 110px; animation-delay: 1.1s; }
  .crop5 { left: 140px; animation-delay: 1.4s; }
  
  @keyframes growCrop {
    from { height: 0; opacity: 0.5; }
    to { height: 30px; opacity: 1; }
  }
  
  .coins-container {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 0;
  }
  
  .coin {
    position: absolute;
    width: 15px;
    height: 15px;
    background: #ffd700;
    border-radius: 50%;
    box-shadow: 0 0 10px #ffd700, 0 0 20px rgba(255, 215, 0, 0.5);
    animation: coinFloat 5s infinite;
    opacity: 0;
  }
  
  ${[...Array(12)].map((_, i) => `
    .coin${i+1} {
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-delay: ${(i * 0.5) % 5}s;
      animation-duration: ${4 + Math.random() * 3}s;
    }
  `).join('')}
  
  @keyframes coinFloat {
    0% { transform: translateY(50px) rotate(0deg); opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { transform: translateY(-50px) rotate(360deg); opacity: 0; }
  }
  
  .loading-text {
    margin-top: 30px;
    display: flex;
    align-items: center;
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 24px;
    color: #8a2be2;
    letter-spacing: 4px;
    text-shadow: 0 0 10px #8a2be2;
  }
  
  .loading-text span {
    display: inline-block;
    animation: bounce 1s infinite alternate;
  }
  
  .loading-text span:nth-child(2) { animation-delay: 0.1s; }
  .loading-text span:nth-child(3) { animation-delay: 0.2s; }
  .loading-text span:nth-child(4) { animation-delay: 0.3s; }
  .loading-text span:nth-child(5) { animation-delay: 0.4s; }
  .loading-text span:nth-child(6) { animation-delay: 0.5s; }
  .loading-text span:nth-child(7) { animation-delay: 0.6s; }
  
  @keyframes bounce {
    from { transform: translateY(0px); }
    to { transform: translateY(-10px); }
  }
  
  .dots {
    display: flex;
    margin-left: 5px;
  }
  
  .dot {
    animation: blink 1s infinite;
  }
  
  .dot:nth-child(2) { animation-delay: 0.3s; }
  .dot:nth-child(3) { animation-delay: 0.6s; }
  
  @keyframes blink {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
  }
  
  .progress-bar {
    width: 250px;
    height: 8px;
    background: #2b153a;
    border-radius: 10px;
    margin-top: 15px;
    overflow: hidden;
    position: relative;
  }
  
  .progress-fill {
    position: absolute;
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #8a2be2, #cf2c7c);
    border-radius: 10px;
    box-shadow: 0 0 10px #cf2c7c;
    animation: progressFill 3s forwards infinite;
  }
  
  @keyframes progressFill {
    0% { width: 0%; }
    100% { width: 100%; }
  }
  
  .noot-text {
    margin-top: 15px;
    font-family: 'Poppins', sans-serif;
    font-weight: 800;
    font-size: 28px;
    background: linear-gradient(to right, #8a2be2, #cf2c7c, #ffd700);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 3s infinite linear;
    text-shadow: 0 0 5px rgba(138, 43, 226, 0.5);
  }
  
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: 200px 0; }
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