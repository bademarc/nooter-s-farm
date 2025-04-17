"use client";

import React, { useState, useEffect, useRef, useContext } from 'react';
import { GameContext } from '@/context/game-context';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import './crashout/crashout-styles.css';

// Constants for game states
const GAME_STATE = {
  INACTIVE: "inactive",
  COUNTDOWN: "countdown",
  ACTIVE: "active",
  CRASHED: "crashed",
};

export function CrashoutGame() {
  // Access farm coins from GameContext
  const { farmCoins, addFarmCoins } = useContext(GameContext);
  const { theme } = useTheme();
  
  // Refs for DOM elements
  const multiplierTextRef = useRef<HTMLDivElement>(null);
  const gameResultRef = useRef<HTMLDivElement>(null);
  const countdownTextRef = useRef<HTMLDivElement>(null);
  const countdownOverlayRef = useRef<HTMLDivElement>(null);
  
  // Game state
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [gameState, setGameState] = useState<string>(GAME_STATE.INACTIVE);
  const [countdown, setCountdown] = useState<number>(10);
  const [betAmount, setBetAmount] = useState<string>('10');
  const [autoCashout, setAutoCashout] = useState<string>('2');
  const [gameHistory, setGameHistory] = useState<Array<{value: string, color: string}>>([]);
  
  // Additional state
  const [isPlayDisabled, setIsPlayDisabled] = useState<boolean>(false);
  const [isCashoutDisabled, setIsCashoutDisabled] = useState<boolean>(true);
  
  // Refs for game logic - updated types for NodeJS.Timeout
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cashoutTriggeredRef = useRef<boolean>(false);
  const autoCashoutValueRef = useRef<number | null>(null);
  
  // Sound manager
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(theme === 'dark');
  const soundsRef = useRef<{[key: string]: HTMLAudioElement}>({});

  // Add a state to track whether we need to deduct coins
  const [pendingCoinDeduction, setPendingCoinDeduction] = useState<number | null>(null);
  
  // Use effect to handle coin deductions after render
  useEffect(() => {
    if (pendingCoinDeduction !== null) {
      addFarmCoins(pendingCoinDeduction);
      setPendingCoinDeduction(null);
    }
  }, [pendingCoinDeduction, addFarmCoins]);
  
  // Initialize sounds
  useEffect(() => {
    // Create audio elements
    soundsRef.current = {
      cashout: new Audio('/sounds/cashout.mp3'),
      crash: new Audio('/sounds/crash.mp3')
    };
    
    // Load the sounds
    Object.values(soundsRef.current).forEach(audio => {
      audio.load();
    });
    
    // Clean up
    return () => {
      Object.values(soundsRef.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);
  
  // Play sound function
  const playSound = (soundName: string) => {
    if (!soundEnabled) return;
    
    try {
      const sound = soundsRef.current[soundName];
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => {
          console.error('[Audio Playback] Error:', e);
        });
      }
    } catch (error) {
      console.error('[Sound Playback] Error:', error);
    }
  };
  
  // Reset game state
  const resetGame = () => {
    setMultiplier(1.0);
    if (multiplierTextRef.current) {
      multiplierTextRef.current.textContent = "1.00x";
      multiplierTextRef.current.style.color = "#fff";
    }
    setIsPlayDisabled(false);
    setIsCashoutDisabled(true);
    if (gameResultRef.current) {
      gameResultRef.current.textContent = "";
    }
    cashoutTriggeredRef.current = false;
    setGameState(GAME_STATE.INACTIVE);
    autoCashoutValueRef.current = null;
    setCountdown(10);
    
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
    
    if (countdownOverlayRef.current) {
      countdownOverlayRef.current.classList.add("hidden");
    }
  };
  
  // Start countdown timer
  const startCountdown = () => {
    resetGame();
    setGameState(GAME_STATE.COUNTDOWN);
    
    if (countdownOverlayRef.current) {
      countdownOverlayRef.current.classList.remove("hidden");
    }
    
    if (countdownTextRef.current) {
      countdownTextRef.current.textContent = countdown.toString();
    }
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        const newValue = prev - 1;
        
        if (countdownTextRef.current) {
          countdownTextRef.current.textContent = newValue.toString();
        }
        
        startInactivityTimer();
        
        if (newValue <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          
          if (countdownOverlayRef.current) {
            countdownOverlayRef.current.classList.add("hidden");
          }
          
          startGame();
        }
        
        return newValue;
      });
    }, 1000);
  };
  
  // Start the game
  const startGame = () => {
    setGameState(GAME_STATE.ACTIVE);
    setIsPlayDisabled(true);
    setIsCashoutDisabled(false);
    
    const autoCashoutValue = parseFloat(autoCashout) || null;
    autoCashoutValueRef.current = autoCashoutValue && autoCashoutValue <= 0 ? null : autoCashoutValue;
    
    gameIntervalRef.current = setInterval(() => {
      try {
        // Check for crash before updating state
        if (Math.random() < 0.01 + multiplier / 100) {
          endGame();
          return;
        }
        
        // Check for auto cashout before updating state
        if (autoCashoutValueRef.current && multiplier >= autoCashoutValueRef.current && !cashoutTriggeredRef.current) {
          handleCashout(true);
          return;
        }
        
        // Increase multiplier
        setMultiplier(prev => {
          const newValue = prev + 0.01 + Math.random() * 0.05;
          
          if (multiplierTextRef.current) {
            multiplierTextRef.current.textContent = `${newValue.toFixed(2)}x`;
            multiplierTextRef.current.style.color = "#0f0"; // Green while increasing
          }
          
          return newValue;
        });
      } catch (error) {
        console.error('[Game Progression] Error:', error);
        endGame();
      }
    }, 100);
  };
  
  // Handle cashout (manual or auto)
  const handleCashout = (auto = false) => {
    setIsPlayDisabled(false);
    setIsCashoutDisabled(true);
    
    if (gameState !== GAME_STATE.ACTIVE || cashoutTriggeredRef.current) return;
    
    cashoutTriggeredRef.current = true;
    
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
    
    setGameState(GAME_STATE.INACTIVE);
    
    const betAmountValue = parseFloat(betAmount) || 0;
    if (betAmountValue <= 0) {
      toast.error("Invalid bet amount!");
      resetGame();
      return;
    }
    
    // Check if player has enough coins
    if (betAmountValue > farmCoins) {
      toast.error("Not enough farm coins for this bet!");
      resetGame();
      return;
    }
    
    const winnings = (betAmountValue * multiplier).toFixed(2);
    
    // Schedule the coin update instead of doing it directly
    setPendingCoinDeduction(-betAmountValue + parseFloat(winnings));
    
    if (gameResultRef.current) {
      gameResultRef.current.textContent = auto
        ? `Auto Cashout! You won ${winnings} coins`
        : `You cashed out! You won ${winnings} coins`;
      gameResultRef.current.style.color = "#0f0"; // Green for winning result
    }
    
    updateHistory(multiplier.toFixed(2), "green");
    playSound('cashout');
  };
  
  // End game (crash)
  const endGame = () => {
    if (gameState !== GAME_STATE.ACTIVE) return;
    
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
    
    setGameState(GAME_STATE.CRASHED);
    
    if (gameResultRef.current) {
      gameResultRef.current.textContent = "Game Crashed!";
      gameResultRef.current.style.color = "#f00"; // Red for losing result
    }
    
    if (multiplierTextRef.current) {
      multiplierTextRef.current.style.color = "#f00"; // Red for crash multiplier
    }
    
    updateHistory(multiplier.toFixed(2), "red");
    
    // Schedule a coin deduction instead of doing it immediately
    const betAmountValue = parseFloat(betAmount) || 0;
    if (betAmountValue > 0 && !cashoutTriggeredRef.current) {
      setPendingCoinDeduction(-betAmountValue);
    }
    
    playSound('crash');
    
    // Reset the game after a delay
    setTimeout(() => {
      resetGame();
    }, 2000);
  };
  
  // Update game history
  const updateHistory = (value: string, color: string) => {
    setGameHistory(prev => {
      const newHistory = [{ value, color }, ...prev];
      if (newHistory.length > 5) newHistory.pop(); // Keep last 5 games
      return newHistory;
    });
  };
  
  // Start inactivity timer
  const startInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    inactivityTimerRef.current = setTimeout(() => {
      toast.info("Game inactive for too long. Restarting!");
      resetGame();
    }, 30000);
  };
  
  // Handle play button click
  const handlePlay = () => {
    const betAmountValue = parseFloat(betAmount);
    if (!betAmountValue || betAmountValue <= 0) {
      toast.error("Please enter a valid bet amount!");
      return;
    }
    
    // Check if player has enough coins
    if (betAmountValue > farmCoins) {
      toast.error("Not enough farm coins for this bet!");
      return;
    }
    
    setCountdown(5); // Reset countdown to 5 seconds instead of 10
    startCountdown();
    startInactivityTimer();
  };
  
  // Clean up intervals and timers
  useEffect(() => {
    const handleMouseMove = () => startInactivityTimer();
    const handleKeydown = () => startInactivityTimer();
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeydown);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeydown);
      
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, []);
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
        Farm Crashout Game
      </h2>
      
      <div className="container mx-auto p-4 max-w-2xl bg-[#111] rounded-lg shadow-xl">
        <div className="game-container">            
          <div className="game-display relative h-64 bg-[#222] rounded-lg mb-6 overflow-hidden">
            <div id="multiplierCurve" className="absolute bottom-0 left-0 w-full h-full"></div>
            <div ref={multiplierTextRef} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-white">1.00x</div>
            <div ref={countdownOverlayRef} className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 hidden">
              <div ref={countdownTextRef} className="text-5xl font-bold text-white"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bet-section">
              <label htmlFor="betAmount" className="block mb-2 text-white">Bet Amount (Farm Coins)</label>
              <input 
                type="number" 
                id="betAmount" 
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full p-2 bg-[#333] rounded border border-[#444] text-white"
                placeholder="Enter bet amount"
                min="1"
                step="1"
              />
            </div>
            
            <div className="auto-cashout-section">
              <label htmlFor="autoCashout" className="block mb-2 text-white">Auto Cashout Multiplier</label>
              <input 
                type="number" 
                id="autoCashout" 
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                className="w-full p-2 bg-[#333] rounded border border-[#444] text-white"
                placeholder="Auto cashout at"
                min="1.01"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="farm-coins mb-4 text-center">
            <p className="text-lg">Available Farm Coins: <span className="font-bold">{farmCoins}</span></p>
          </div>
          
          <div className="game-buttons mt-4 grid grid-cols-2 gap-4">
            <button 
              onClick={handlePlay} 
              disabled={isPlayDisabled}
              className={`py-3 text-lg font-bold rounded transition duration-300 ${
                isPlayDisabled 
                  ? "bg-green-800 opacity-50 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Play
            </button>
            <button 
              onClick={() => handleCashout(false)} 
              disabled={isCashoutDisabled}
              className={`py-3 text-lg font-bold rounded transition duration-300 ${
                isCashoutDisabled 
                  ? "bg-yellow-800 opacity-50 cursor-not-allowed" 
                  : "bg-yellow-600 hover:bg-yellow-700"
              }`}
            >
              Cashout
            </button>
          </div>
          
          <div ref={gameResultRef} className="mt-6 text-center text-2xl font-bold"></div>
          
          <div className="game-history mt-6">
            <h3 className="text-xl mb-4 text-white">Game History</h3>
            <div className="grid grid-cols-5 gap-2 text-center">
              {gameHistory.map((entry, index) => (
                <div 
                  key={index} 
                  className="p-2 rounded text-center"
                  style={{ 
                    backgroundColor: entry.color === "green" ? "#0f0" : "#f00",
                    color: "#000"
                  }}
                >
                  {entry.value}x
                </div>
              ))}
            </div>
          </div>
          
          <div className="game-info mt-6 bg-[#222] p-4 rounded text-sm text-white/70">
            <h4 className="font-bold mb-2">How to Play:</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Enter your bet amount in farm coins</li>
              <li>Set an auto-cashout multiplier (optional)</li>
              <li>Click Play to start the game</li>
              <li>Wait for the multiplier to increase</li>
              <li>Click Cashout before the game crashes</li>
              <li>If you wait too long, you'll lose your bet!</li>
            </ol>
          </div>
          
          <div className="settings mt-4 flex justify-center space-x-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="bg-[#333] hover:bg-[#444] text-white px-3 py-1 rounded"
            >
              🔊 Sound: {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 