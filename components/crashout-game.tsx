/// components/crashout-game.tsx
"use client";

// Add TypeScript declaration for window._loggedUrls
declare global {
  interface Window {
    _loggedUrls?: {[key: string]: boolean};
  }
}

import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { GameContext } from '@/context/game-context';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import './crashout/crashout-styles.css';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import { Client, Room } from 'colyseus.js';
import axios from 'axios';

// Constants for game states (same as server)
const GAME_STATE = {
  INACTIVE: "inactive",
  COUNTDOWN: "countdown",
  ACTIVE: "active",
  CRASHED: "crashed",
  CASHED_OUT: "cashed_out",
};

// Helper components
const DemoModeSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) => {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-10 items-center rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-700'}`}
    >
      <span className="sr-only">Toggle Demo Mode</span>
      <span 
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${enabled ? 'translate-x-5' : 'translate-x-1'}`} 
      />
    </button>
  );
};

export function CrashoutGame() {
  // Existing local state
  const { farmCoins, addFarmCoins } = useContext(GameContext);
  const { theme } = useTheme();
  
  // Refs
  const multiplierTextRef = useRef<HTMLDivElement>(null);
  const gameResultRef = useRef<HTMLDivElement>(null);
  const countdownTextRef = useRef<HTMLDivElement>(null);
  const countdownOverlayRef = useRef<HTMLDivElement>(null);
  const lossVideoRef = useRef<HTMLVideoElement>(null);
  
  // Game state
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [gameState, setGameState] = useState<string>(GAME_STATE.INACTIVE);
  const [countdown, setCountdown] = useState<number>(10);
  const [betAmount, setBetAmount] = useState<string>('10');
  const [autoCashout, setAutoCashout] = useState<string>('2');
  const [gameHistory, setGameHistory] = useState<Array<{value: string, color: string, timestamp: number}>>([]);
  const [joinWindowTimeLeft, setJoinWindowTimeLeft] = useState<number>(0);
  const joinWindowRef = useRef<NodeJS.Timeout | null>(null);
  
  // UI state
  const [isPlayDisabled, setIsPlayDisabled] = useState<boolean>(false);
  const [isCashoutDisabled, setIsCashoutDisabled] = useState<boolean>(true);
  const [showGameStartedImage, setShowGameStartedImage] = useState<boolean>(false);
  const [showLossImage, setShowLossImage] = useState<boolean>(false);
  const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);
  
  // Auto-play
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(true);
  const [canPlaceBet, setCanPlaceBet] = useState<boolean>(true);
  const [playerJoined, setPlayerJoined] = useState<boolean>(false);
  const [nextGameStartTime, setNextGameStartTime] = useState<number | null>(null);
  
  // ---- Colyseus specific state ----
  const colyseusClientRef = useRef<Client | null>(null);
  const colyseusRoomRef = useRef<Room | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected");

  // Online specific state
  const [onlinePlayersCount, setOnlinePlayersCount] = useState<number>(0);
  const [playersInGame, setPlayersInGame] = useState<number>(0);
  const [recentCashouts, setRecentCashouts] = useState<Array<{username: string, multiplier: number, winning: number, timestamp: number}>>([]);
  const [username, setUsername] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('crashoutUsername') || `Player-${Math.floor(Math.random() * 10000)}`;
    }
    return `Player-${Math.floor(Math.random() * 10000)}`;
  });

  // Audio handling
  const audioRefs = useRef<{[key: string]: HTMLAudioElement | null}>({
    crash: null,
    cashout: null,
    win: null,
    backgroundMusic: null
  });
  
  // Audio control state
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseFloat(localStorage.getItem('crashoutVolume') || '0.5');
    }
    return 0.5;
  });
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('crashoutMuted') === 'true';
    }
    return false;
  });
  
  // Play sound function
  const playSound = (type: string) => {
    if (audioRefs.current[type] && !muted) {
      const audio = audioRefs.current[type];
      if (audio) {
        audio.volume = type === 'backgroundMusic' ? volume * 0.3 : volume;
        audio.currentTime = 0;
        audio.play().catch(e => {
          console.warn(`Could not play ${type} sound:`, e);
        });
      }
    }
  };
  
  // Offline demo mode
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const demoTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Event buffering
  const latestGameStateRef = useRef<any>(null);
  const latestMultiplierRef = useRef<number | null>(1.0);
  const isProcessingUpdatesRef = useRef<boolean>(false);
  
  // Settings for update throttling
  const MIN_UPDATE_INTERVAL = 500; // ms
  const FLUSH_INTERVAL = 200; // ms
  const MAX_QUEUED_EVENTS = 50; // max events in queue
  
  // ---- ADD didMountRef HERE ----
  const didMountRef = useRef<boolean>(false);
  // ---- END ADD didMountRef ----
  
  // --- Helper Functions ---

  const batchUpdate = (updates: { [key: string]: any }) => {
    window.requestAnimationFrame(() => {
      Object.entries(updates).forEach(([key, value]) => {
        switch (key) {
          case 'gameState': setGameState(value); break;
          case 'multiplier':
            setMultiplier(value);
            if (multiplierTextRef.current) updateMultiplierDisplay(value);
            break;
          case 'countdown': setCountdown(value); break;
          case 'playersInGame': setPlayersInGame(value); break;
          case 'canPlaceBet': setCanPlaceBet(value); break;
          case 'isCashoutDisabled': setIsCashoutDisabled(value); break;
          case 'showGameStartedImage': setShowGameStartedImage(value); break;
          case 'showLossImage': setShowLossImage(value); break;
          case 'joinWindowTimeLeft': setJoinWindowTimeLeft(value); break;
        }
      });
    });
  };
  
  const updateMultiplierDOMElements = (value: number) => {
    if (!multiplierTextRef.current) return;
    
    // Skip update if multiplier is basically the same (reduce rounding noise)
    const currentValue = parseFloat(multiplierTextRef.current.textContent?.replace('x', '') || '1.00');
    if (Math.abs(currentValue - value) < 0.03) return;
    
    // Format once
    const valueFormatted = `${value.toFixed(2)}x`;
    
    // Update text content only if it has changed
    if (multiplierTextRef.current.textContent !== valueFormatted) {
      multiplierTextRef.current.textContent = valueFormatted;
    }
      
    // Simplified color logic - just three colors to reduce calculations
    const textColor = 
      gameState === GAME_STATE.CASHED_OUT ? (value < 5 ? "#88ddff" : "#ffaa00") :
      value < 2 ? "#0f0" : // Green
      value < 10 ? "#ffff00" : // Yellow
      "#ff8800"; // Orange
      
    // Only update color if it's different
    if (multiplierTextRef.current.style.color !== textColor) {
      multiplierTextRef.current.style.color = textColor;
    }
      
    // Even more drastically simplified size logic - only 3 size steps
    const baseSize = 6;
    const sizeClass = value < 3 ? `${baseSize}rem` : 
                     value < 10 ? `${baseSize * 1.4}rem` : 
                     `${baseSize * 1.8}rem`;
    
    if (multiplierTextRef.current.style.fontSize !== sizeClass) {
      multiplierTextRef.current.style.fontSize = sizeClass;
    }
  };
  
  const updateMultiplierDisplay = (value: number) => {
    if (!multiplierTextRef.current) return;
    
    // To reduce layout thrashing, batch all DOM updates
    if (!window.requestAnimationFrame) {
      // Fallback for browsers without requestAnimationFrame
      updateMultiplierDOMElements(value);
    } else {
      requestAnimationFrame(() => {
        updateMultiplierDOMElements(value);
      });
    }
  };
  
  const updateGameHistory = (newHistory: Array<{value: string, color: string, timestamp: number}>) => {
    // Add timestamp to history entries for uniqueness
    const timestampedHistory = newHistory.map((entry, index) => ({
      ...entry, 
      timestamp: Date.now() - (index * 100) // Add slight offset to ensure uniqueness
    }));
    
    // Filter out duplicates by checking if the same value already exists
    const uniqueHistory = timestampedHistory.reduce((acc, current) => {
      // Only add if this exact value doesn't exist or is from a different time
      const exists = acc.find(item => 
        item.value === current.value && 
        Math.abs(item.timestamp - current.timestamp) < 5000 // Within 5 seconds
      );
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as Array<{value: string, color: string, timestamp: number}>);
    
    // Limit history size
    const limitedHistory = uniqueHistory.slice(0, 50); // Keep latest 50

    setGameHistory(limitedHistory);
  };
  
  // --- Define timer functions before use ---
  const clearJoinWindowTimer = useCallback(() => {
    if (joinWindowRef.current) {
      clearInterval(joinWindowRef.current);
      joinWindowRef.current = null;
    }
  }, []);

  const startJoinWindowTimer = useCallback((seconds: number) => {
    clearJoinWindowTimer();
    setJoinWindowTimeLeft(seconds);
    joinWindowRef.current = setInterval(() => {
      setJoinWindowTimeLeft(prev => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          clearJoinWindowTimer();
          return 0;
        }
        return newValue;
      });
    }, 1000);
  }, [clearJoinWindowTimer]);

  // ---- Colyseus Event Handling ----

  // Handle full state synchronization from Colyseus
  const handleColyseusStateChange = useCallback((newState: any) => {
    console.log('Colyseus state changed:', newState);
    latestGameStateRef.current = newState;
    const updates: { [key: string]: any } = {};

    if (newState.gameState !== undefined && newState.gameState !== gameState) updates.gameState = newState.gameState;
    if (newState.currentMultiplier !== undefined && newState.currentMultiplier !== multiplier) updates.multiplier = newState.currentMultiplier;
    if (newState.countdown !== undefined && newState.countdown !== countdown) updates.countdown = newState.countdown;
    if (newState.playersInGame !== undefined && newState.playersInGame !== playersInGame) updates.playersInGame = newState.playersInGame;
    if (newState.nextGameStartTime !== undefined && newState.nextGameStartTime !== nextGameStartTime) setNextGameStartTime(newState.nextGameStartTime);
    if (newState.joinWindowTimeLeft !== undefined && newState.joinWindowTimeLeft !== joinWindowTimeLeft) updates.joinWindowTimeLeft = newState.joinWindowTimeLeft;

    // Update history if it exists in the state
    if (newState.gameHistory) {
      updateGameHistory(newState.gameHistory);
    }

    // Update player count if available
    if (newState.onlinePlayers !== undefined && newState.onlinePlayers !== onlinePlayersCount) {
        setOnlinePlayersCount(newState.onlinePlayers);
    }

    // --- Update local state based on game state ---
    const currentServerState = newState.gameState || gameState;

    // Background music
    if (audioRefs.current.backgroundMusic) {
      if (currentServerState === GAME_STATE.ACTIVE || currentServerState === GAME_STATE.COUNTDOWN) {
        playSound('backgroundMusic');
      } else if (currentServerState === GAME_STATE.CRASHED || currentServerState === GAME_STATE.INACTIVE) {
        if (!audioRefs.current.backgroundMusic.paused) {
            audioRefs.current.backgroundMusic.pause();
            audioRefs.current.backgroundMusic.currentTime = 0;
        }
      }
    }

    // UI elements and player status derived from state
    let newCanPlaceBet = false;
    let newIsCashoutDisabled = true;

    if (currentServerState === GAME_STATE.INACTIVE) {
      updates.showLossImage = false;
      if (playerJoined) setPlayerJoined(false);
      if (cashedOutAt !== null) setCashedOutAt(null);
      newIsCashoutDisabled = true;
      newCanPlaceBet = false;
    } else if (currentServerState === GAME_STATE.COUNTDOWN) {
      updates.showLossImage = false;
      newIsCashoutDisabled = true;
      if (newState.joinWindowTimeLeft > 0 && !playerJoined) {
         newCanPlaceBet = true;
       } else {
         newCanPlaceBet = false;
       }
      if (newState.joinWindowTimeLeft > 0 && joinWindowRef.current === null) {
        startJoinWindowTimer(newState.joinWindowTimeLeft);
      } else if (newState.joinWindowTimeLeft <= 0 && joinWindowRef.current !== null) {
        clearJoinWindowTimer();
      }
    } else if (currentServerState === GAME_STATE.ACTIVE) {
      if (joinWindowRef.current !== null) clearJoinWindowTimer();
      newCanPlaceBet = false;
      updates.showGameStartedImage = true;
      newIsCashoutDisabled = !playerJoined || cashedOutAt !== null;
    } else if (currentServerState === GAME_STATE.CRASHED) {
        updates.showGameStartedImage = false;
        updates.showLossImage = true;
        newIsCashoutDisabled = true;
        newCanPlaceBet = false;
        if (joinWindowRef.current !== null) clearJoinWindowTimer();

        if (newState.crashPoint) {
           requestAnimationFrame(() => {
             if (multiplierTextRef.current) {
               multiplierTextRef.current.style.color = "#f00";
               multiplierTextRef.current.textContent = `${newState.crashPoint.toFixed(2)}x`;
             }
           });
        }
    }

    // Update derived state if changed
    if (newCanPlaceBet !== canPlaceBet) updates.canPlaceBet = newCanPlaceBet;
    if (newIsCashoutDisabled !== isCashoutDisabled) updates.isCashoutDisabled = newIsCashoutDisabled;

    // Apply batched updates
    if (Object.keys(updates).length > 0) {
      batchUpdate(updates);
    }

  }, [
      gameState, multiplier, countdown, playersInGame, nextGameStartTime,
      canPlaceBet, joinWindowTimeLeft, playerJoined, cashedOutAt, onlinePlayersCount, isCashoutDisabled,
      updateGameHistory, batchUpdate, playSound, startJoinWindowTimer, clearJoinWindowTimer
  ]);

  // Handle custom messages from Colyseus room
  const handleColyseusMessage = useCallback((type: string | number, message: any) => {
    console.log('Colyseus message received:', type, message);

    switch (type) {
      case 'bet-accepted':
        setPlayerJoined(true);
        setIsPlayDisabled(true);
        setIsCashoutDisabled(false);
        toast.success("Bet placed successfully!");
        break;
      case 'bet-rejected':
        setIsPlayDisabled(false);
        toast.error(`Bet rejected: ${message?.reason || 'Unknown reason'}`);
        break;
      case 'cashout-success':
        setCashedOutAt(message.multiplier);
        setIsCashoutDisabled(true);
        playSound('win');
        if (message.winAmount) {
          addFarmCoins(message.winAmount);
          toast.success(`Cashed out at ${message.multiplier.toFixed(2)}x! Won ${message.winAmount.toFixed(2)} coins!`);
        } else {
            toast.success(`Cashed out at ${message.multiplier.toFixed(2)}x!`);
        }
        break;
      case 'cashout-failed':
         setIsCashoutDisabled(true);
         toast.error(`Cashout failed: ${message?.reason || 'Game likely crashed'}`);
         if (message?.reason?.toLowerCase().includes('crashed')) {
             playSound('crash');
         }
         break;
      case 'game-lost':
        playSound('crash');
        break;
      case 'player-cashed-out':
        setRecentCashouts(prev => {
          const newCashout = {
              username: message.username || 'Unknown',
              multiplier: message.multiplier || 0,
              winning: message.winning || 0,
              timestamp: Date.now()
          };
          const newList = [newCashout, ...prev];
          return newList.slice(0, 15);
        });
        playSound('cashout');
        break;
      case 'game-crashed-final':
           playSound('crash');
           if (message && message.crashPoint) {
             logGameResult(message.crashPoint);
           }
           break;
       case 'username-update-success':
           toast.success("Username updated successfully!");
           break;
       case 'username-update-failed':
           toast.error(`Failed to update username: ${message?.reason || 'Unknown reason'}`);
           break;
      default:
        console.warn(`Unhandled Colyseus message type: ${type}`);
    }
  }, [playSound, addFarmCoins, logGameResult]);

  // Demo mode functions
  const startDemoMode = () => {
    setOfflineMode(true);
    setIsConnected(false);
    setConnectionStatus("demo");
    toast.info("Running in offline demo mode. Connect to server for full functionality.");
    
    // Set initial state
    setGameState(GAME_STATE.COUNTDOWN);
    setCountdown(10);
    setMultiplier(1.0);
    updateMultiplierDisplay(1.0);
    
    // Basic demo history
    const demoHistory = [
      { value: "1.84", color: "red", timestamp: Date.now() - 5000 },
      { value: "2.56", color: "red", timestamp: Date.now() - 10000 },
      { value: "1.37", color: "red", timestamp: Date.now() - 15000 },
      { value: "4.20", color: "red", timestamp: Date.now() - 20000 },
      { value: "1.12", color: "red", timestamp: Date.now() - 25000 }
    ];
    updateGameHistory(demoHistory);
    
    // Start countdown
    let count = 10;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count <= 0) {
        clearInterval(countdownInterval);
        startDemoGame();
      }
    }, 1000);
    
    // Start demo game after countdown
    const startDemoGame = () => {
      setGameState(GAME_STATE.ACTIVE);
      setShowGameStartedImage(true);
      setCanPlaceBet(false);
      
      // Generate random crash point between 1.1 and 10
      const demoCrashPoint = Math.random() * 9 + 1.1;
      
      // Start multiplier increase
      let demoMultiplier = 1.0;
      
      // Clear any existing interval
      if (demoIntervalRef.current !== null) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      
      demoIntervalRef.current = setInterval(() => {
        demoMultiplier *= 1.01; // Increase by 1% each tick
        setMultiplier(demoMultiplier);
        updateMultiplierDisplay(demoMultiplier);
        
        // If reached crash point, trigger crash
        if (demoMultiplier >= demoCrashPoint) {
          if (demoIntervalRef.current !== null) {
            clearInterval(demoIntervalRef.current);
            demoIntervalRef.current = null;
          }
          triggerDemoCrash();
        }
      }, 100);
    };
    
    // Simulate crash
    const triggerDemoCrash = () => {
      setGameState(GAME_STATE.CRASHED);
      setShowGameStartedImage(false);
      setShowLossImage(true);
      
      // Play crash sound
      playSound('crash');
      
      // Update history
      const newHistoryEntry = {
        value: multiplier.toFixed(2),
        color: "red",
        timestamp: Date.now()
      };
      
      setGameHistory(prev => {
        const updatedHistory = [newHistoryEntry, ...prev].slice(0, 50);
        return updatedHistory;
      });
      
      // Clean up any existing timer
      if (demoTimerRef.current !== null) {
        clearTimeout(demoTimerRef.current);
        demoTimerRef.current = null;
      }
      
      // Reset after 5 seconds
      demoTimerRef.current = setTimeout(() => {
        setShowLossImage(false);
        
        // Clean up first timer
        demoTimerRef.current = null;
        
        // Start new game after delay
        setTimeout(() => {
          startDemoMode();
        }, 3000);
      }, 5000);
    };
    
    // Allow demo cashout if player joined
    setIsPlayDisabled(false);
    setCanPlaceBet(true);
    setPlayerJoined(false);
  };
  
  useEffect(() => {
    // Check if we should start in demo mode
    const shouldStartInDemoMode = 
      process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || 
      localStorage.getItem('crashoutDemoMode') === 'true';
    
    if (shouldStartInDemoMode) {
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        startDemoMode();
      }, 100);
    }
    
    // Clean up demo mode timers on unmount
    return () => {
      if (demoIntervalRef.current !== null) {
        clearInterval(demoIntervalRef.current);
      }
      if (demoTimerRef.current !== null) {
        clearTimeout(demoTimerRef.current);
      }
    };
  }, []);
  
  // --- connectToServer ---
  const connectToServer = useCallback(async (retryCount = 0) => {
    if (isConnected || connectionStatus === 'connecting' || connectionStatus === 'connected') {
      console.log(`Skipping connection attempt. Status: ${connectionStatus}, Connected: ${isConnected}`);
      return;
    }

    if (retryCount === 0) {
      toast.info("Connecting to game server...");
      setConnectionStatus("connecting");
    }

    if (!colyseusClientRef.current) {
      const wsEndpoint = process.env.NEXT_PUBLIC_COLYSEUS_ENDPOINT ||
                         (typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws') + `://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:2567`;
      console.log(`Initializing Colyseus client for endpoint: ${wsEndpoint}`);
      try {
        colyseusClientRef.current = new Client(wsEndpoint);
      } catch (initError) {
          console.error("Failed to initialize Colyseus client:", initError);
           toast.error("Internal error: Could not setup connection client.");
           setConnectionStatus("failed");
           startDemoMode();
           return;
      }
    }
    const client = colyseusClientRef.current;

    try {
      if (localStorage.getItem('crashoutDemoMode') === 'true') {
        throw new Error('Manual demo mode enabled');
      }
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && !localStorage.getItem('crashoutDemoModeDisabled')) {
         console.log("Demo mode preferred by environment variable. Attempting connection first...");
       }

      console.log("Attempting to join or create 'crashout_room'...");
      const room = await client.joinOrCreate<{ /* Define expected State structure type here */ }>("crashout_room", {
          username: username,
       });

      console.log("Successfully joined room:", room.roomId, room.sessionId);
      colyseusRoomRef.current = room;
      setIsConnected(true);
      setOfflineMode(false);
      setConnectionStatus("connected");
      toast.success("Connected to game server!");

      // Add this line to sync with Redis after connecting
      syncWithRedis();

      room.onStateChange((state: any) => {
        // Use the ref to check if it's the first state update
        if (latestGameStateRef.current === null) {
             console.log("Initial Colyseus state received via onStateChange:", state);
        } else {
             console.log("Subsequent Colyseus state received:", state);
        }
        // Process the state (initial or update)
        handleColyseusStateChange(state);
      });

      room.onMessage("*", (type: string | number, message: any) => {
        handleColyseusMessage(type, message);
      });

      room.onError((code: number, message?: string) => {
        console.error("Colyseus room error:", code, message);
        toast.error(`Server error: ${message || 'Unknown error'} (Code: ${code})`);
        setIsConnected(false);
        setConnectionStatus("error");
        colyseusRoomRef.current = null;

        setTimeout(() => connectToServer(0), 5000);

      });

      room.onLeave((code: number) => {
        console.log(`Left Colyseus room (code: ${code})`);
        const wasConnected = isConnected;
        setIsConnected(false);
        colyseusRoomRef.current = null;

        if (code > 1001 && wasConnected) {
           toast.warning(`Disconnected from server (Code: ${code}). Attempting to reconnect...`);
           setConnectionStatus("disconnected");
           setTimeout(() => connectToServer(0), 3000);
        } else if (wasConnected) {
           setConnectionStatus("disconnected");
        } else {
           setConnectionStatus("disconnected");
        }
      });

    } catch (err: any) {
      console.error('Error connecting to Colyseus:', err);
      setIsConnected(false);
      colyseusRoomRef.current = null;

      let errorMessage = err.message || 'Unknown connection error';
      if (errorMessage.includes('failed to join room') || errorMessage.includes('timeout')) {
           errorMessage = "Failed to join game room. Server might be busy or offline.";
           setConnectionStatus("failed");
      } else if (err.code) {
           errorMessage = `Connection error ${err.code}: ${errorMessage}`;
           setConnectionStatus("error");
      } else {
           setConnectionStatus("failed");
      }

      if (err.message?.includes('Demo mode enabled')) {
           localStorage.setItem('crashoutDemoMode', 'true');
      } else {
           toast.error(errorMessage);
      }

      if (retryCount < 3 && !err.message?.includes('Demo mode enabled')) {
        const delay = 1000 * (retryCount + 1);
        console.log(`Retrying Colyseus connection in ${delay/1000} seconds...`);
         if (!err.message?.includes('Demo mode enabled')) {
             toast.info(`Retrying connection in ${delay/1000} seconds...`);
         }
        setTimeout(() => connectToServer(retryCount + 1), delay);
      } else {
        if (!offlineMode) {
             toast.error('Failed to connect to game server. Switching to offline demo mode.');
             startDemoMode();
         }
      }
    }
  }, [
      username, isConnected, connectionStatus,
      handleColyseusStateChange, handleColyseusMessage, startDemoMode,
      syncWithRedis
  ]);

  // Add an effect to sync with Redis periodically
  useEffect(() => {
    if (!offlineMode && isConnected) {
      // Log player activity when they join or leave a game
      logPlayerActivity();
      
      // Set up periodic sync (every 30 seconds)
      const syncInterval = setInterval(() => {
        syncWithRedis();
      }, 30000);
      
      return () => clearInterval(syncInterval);
    }
  }, [offlineMode, isConnected, logPlayerActivity, syncWithRedis]);

  // Main setup effect
  useEffect(() => {
    if (didMountRef.current) {
        console.log('[Dev Only/StrictMode] Skipping setup effect run.');
        return;
    }
    didMountRef.current = true;

    console.log('CrashoutGame component mounted - Running setup effect');
    
    audioRefs.current.crash = new Audio('/sounds/crash.mp3');
    audioRefs.current.cashout = new Audio('/sounds/cashout.mp3');
    audioRefs.current.win = new Audio('/sounds/win.mp3');
    const bgMusic = new Audio('/sounds/background_music.mp3');
    bgMusic.loop = true;
    bgMusic.volume = muted ? 0 : volume * 0.3;
    audioRefs.current.backgroundMusic = bgMusic;

    const shouldStartInDemoMode =
      process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
      localStorage.getItem('crashoutDemoMode') === 'true';

    if (!shouldStartInDemoMode) {
        connectToServer();
    } else {
        console.log("Initial setup: Starting in demo mode based on settings.");
    }

    return () => {
      console.log('CrashoutGame setup cleanup running.');
      clearJoinWindowTimer();

      if (colyseusRoomRef.current) {
        console.log('Leaving Colyseus room on unmount...');
        colyseusRoomRef.current.leave(true);
        colyseusRoomRef.current = null;
      }
      
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });

      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
      didMountRef.current = false;
    };
  }, []);

  // Handle placing a bet
  const handlePlay = useCallback(async () => {
    if (offlineMode) {
        if (!canPlaceBet || isPlayDisabled) {
            toast.warning("Cannot place demo bet now.");
            return;
        }
        const bet = parseFloat(betAmount);
        if (isNaN(bet) || bet <= 0) { toast.error("Invalid bet amount."); return; }

        setPlayerJoined(true);
        setIsPlayDisabled(true);
        setIsCashoutDisabled(false);
        toast.info("Demo bet placed!");
        return;
    }

    if (!canPlaceBet || !isConnected || joinWindowTimeLeft <= 0 || isPlayDisabled || !colyseusRoomRef.current) {
      toast.warning("Cannot place bet now. Ensure you are connected and the join window is open.");
      return;
    }

    const bet = parseFloat(betAmount);
    const cashoutTarget = parseFloat(autoCashout);

    if (isNaN(bet) || bet <= 0) { toast.error("Invalid bet amount."); return; }
    if (isNaN(cashoutTarget) || cashoutTarget < 1.01) { toast.error("Invalid auto cashout multiplier (must be >= 1.01)."); return; }

    setIsPlayDisabled(true);
    toast.info("Placing bet...");

    colyseusRoomRef.current.send("place-bet", {
      betAmount: bet,
      autoCashout: cashoutTarget,
    });

  }, [
      canPlaceBet, isConnected, betAmount, autoCashout, joinWindowTimeLeft, isPlayDisabled, farmCoins, offlineMode
  ]);

  // Handle cashing out
  const handleCashout = useCallback(async () => {
    if (offlineMode) {
        if (!playerJoined || gameState !== GAME_STATE.ACTIVE || isCashoutDisabled || cashedOutAt !== null) {
            toast.warning("Cannot cashout demo game now.");
            return;
        }
        const winAmount = parseFloat(betAmount) * multiplier;
        setCashedOutAt(multiplier);
        setIsCashoutDisabled(true);
        playSound('win');
        addFarmCoins(winAmount);
        toast.success(`Demo Cashout at ${multiplier.toFixed(2)}x! Won ${winAmount.toFixed(2)} coins!`);

        if (demoIntervalRef.current !== null) {
            clearInterval(demoIntervalRef.current);
            demoIntervalRef.current = null;
        }
        return;
    }

    if (!playerJoined || gameState !== GAME_STATE.ACTIVE || !isConnected || isCashoutDisabled || !colyseusRoomRef.current || cashedOutAt !== null) {
       toast.warning("Cannot cash out now.");
       return;
    }

    setIsCashoutDisabled(true);
    toast.info("Cashing out...");

    colyseusRoomRef.current.send("cashout");

  }, [
      playerJoined, gameState, isConnected, isCashoutDisabled, cashedOutAt, offlineMode, multiplier, betAmount, addFarmCoins, playSound
  ]);

  // Handle changing username
  const changeUsername = useCallback(async (newUsername: string) => {
    if (offlineMode) {
        if (!newUsername || newUsername.trim().length === 0 || newUsername.length > 20) {
            toast.error("Invalid username (1-20 characters).");
            return;
        }
        const trimmedUsername = newUsername.trim();
        setUsername(trimmedUsername);
        if (typeof window !== 'undefined') {
            localStorage.setItem('crashoutUsername', trimmedUsername);
        }
        toast.success("Demo username updated!");
        return;
    }

    if (!isConnected || !colyseusRoomRef.current) {
      toast.error("Cannot change username while offline.");
      return;
    }
    if (!newUsername || newUsername.trim().length === 0 || newUsername.length > 20) {
      toast.error("Invalid username (1-20 characters).");
      return;
    }

    const trimmedUsername = newUsername.trim();
    const oldUsername = username;
    setUsername(trimmedUsername);
    if (typeof window !== 'undefined') {
       localStorage.setItem('crashoutUsername', trimmedUsername);
     }
    toast.info("Updating username...");

    colyseusRoomRef.current.send("update-username", { newUsername: trimmedUsername });

  }, [isConnected, username, offlineMode]);

  // Add these new functions for Redis integration
  const syncWithRedis = useCallback(async () => {
    if (offlineMode) return;
    
    try {
      // Get current game state from Redis
      const response = await axios.get('/api/redis?action=getGameState');
      if (response.data.success && response.data.gameState) {
        console.log('Synced with Redis game state:', response.data.gameState);
        
        // Update local state based on Redis data
        if (response.data.gameState.state) {
          setGameState(response.data.gameState.state);
        }
        
        if (response.data.gameState.nextGameTime) {
          setNextGameStartTime(response.data.gameState.nextGameTime);
        }
      }
      
      // Get game history
      const historyResponse = await axios.get('/api/redis?action=getHistory');
      if (historyResponse.data.success && historyResponse.data.history) {
        // Convert Redis history format to game history format
        const formattedHistory = historyResponse.data.history.map(item => ({
          value: item.crashPoint.toFixed(2),
          color: parseFloat(item.crashPoint) >= 2.0 ? "green" : "red",
          timestamp: item.timestamp
        }));
        
        updateGameHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Error syncing with Redis:', error);
    }
  }, [offlineMode, updateGameHistory]);

  // Function to log player activity to Redis
  const logPlayerActivity = useCallback(async () => {
    if (offlineMode) return;
    
    try {
      await axios.post('/api/redis', {
        action: 'updatePlayer',
        data: {
          playerId: username,
          lastBet: parseFloat(betAmount) || 0,
          autoCashout: parseFloat(autoCashout) || 2.0,
          lastGameResult: cashedOutAt ? 'win' : (playerJoined && gameState === GAME_STATE.CRASHED ? 'loss' : null)
        }
      });
    } catch (error) {
      console.error('Error logging player activity:', error);
    }
  }, [offlineMode, username, betAmount, autoCashout, cashedOutAt, playerJoined, gameState]);

  // Function to log game results to Redis
  const logGameResult = useCallback(async (crashPoint) => {
    if (offlineMode) return;
    
    try {
      await axios.post('/api/redis', {
        action: 'logGameResult',
        data: {
          crashPoint: crashPoint,
          playerCount: playersInGame,
          activePlayerCount: onlinePlayersCount
        }
      });
    } catch (error) {
      console.error('Error logging game result:', error);
    }
  }, [offlineMode, playersInGame, onlinePlayersCount]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2 flex justify-between">
        <span>Farm Crashout Game {offlineMode && <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full ml-2">Demo Mode</span>}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMuted(prev => !prev)} 
              className="text-white hover:text-green-400 transition-colors"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-green-500"
              disabled={muted}
            />
          </div>
          <span className={`text-sm ${
            connectionStatus === 'connected' ? 'text-green-500' :
            connectionStatus === 'connecting' ? 'text-yellow-500' :
            connectionStatus === 'disconnected' ? 'text-gray-500' :
            connectionStatus === 'demo' ? 'text-yellow-500' :
            'text-red-500'
          }`}>
            {connectionStatus === 'connected' ? `Online (${onlinePlayersCount} players)` :
             connectionStatus === 'connecting' ? 'Connecting...' :
             connectionStatus === 'disconnected' ? 'Disconnected' :
             connectionStatus === 'demo' ? 'Demo Mode' :
             connectionStatus === 'error' ? 'Connection Error' :
             'Offline'
            }
             {isConnected && connectionStatus !== 'connected' && !offlineMode && (
                 <span className="ml-2 text-xs bg-yellow-600 text-white px-1 rounded">
                     Reconnecting...
                 </span>
             )}
          </span>
        </div>
      </h2>
      
      <div className="container mx-auto p-4 max-w-2xl bg-[#111] rounded-lg shadow-xl">
        <div className="game-container">            
          <div className="game-display relative h-80 bg-[#222] rounded-lg mb-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white px-3 py-1 text-center font-semibold z-10">
              {gameState === GAME_STATE.INACTIVE && nextGameStartTime && !offlineMode && (
                <div>Next game starting automatically in {Math.max(0, Math.floor((nextGameStartTime - Date.now()) / 1000))}s</div>
              )}
                {gameState === GAME_STATE.INACTIVE && offlineMode && (
                    <div>Demo inactive. Next round starts soon.</div>
                )}
               {gameState === GAME_STATE.COUNTDOWN && (
                  <div>
                     Game starting in {countdown}s - Players: {playersInGame}
                     {joinWindowTimeLeft > 0 && !offlineMode ? (
                         <span className="ml-2 text-yellow-300">Join window: {joinWindowTimeLeft}s</span>
                     ) : !offlineMode ? (
                         <span className="ml-2 text-red-300">Join window closed</span>
                     ) : null}
                  </div>
               )}
               {gameState === GAME_STATE.ACTIVE && (
                 <div>
                   {playerJoined
                     ? "Game in progress - Good luck!"
                     : "Game in progress - Join next round!"}
                    {offlineMode && <span className="text-xs bg-yellow-500 px-1 rounded ml-1">Demo</span>}
                 </div>
               )}
               {gameState === GAME_STATE.CRASHED && (
                 <div>Game over! {offlineMode ? 'Demo restarts soon.' : 'Next round starts automatically.'}</div>
               )}
            </div>
            
            {gameState !== GAME_STATE.INACTIVE && (
              <div className={`absolute top-8 left-0 right-0 px-3 py-1 text-center font-semibold text-sm z-10
                ${playerJoined ? 'bg-green-600' : 'bg-red-600'} transition-colors duration-300`}>
                {playerJoined
                  ? `Playing ${cashedOutAt ? `(Cashed out at ${cashedOutAt.toFixed(2)}x)` : ''}`
                  : "Not playing"}
                    {offlineMode && playerJoined && <span className="text-xs bg-yellow-500 px-1 rounded ml-1">Demo Bet</span>}
              </div>
            )}
            
            <div ref={multiplierTextRef} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-white z-50 multiplier-text">1.00x</div>
            
            <video 
              ref={lossVideoRef}
              className="absolute inset-0 w-full h-full object-cover z-30"
              style={{ 
                display: showLossImage ? 'block' : 'none',
                opacity: showLossImage ? '1' : '0',
                transition: 'opacity 0.3s ease-in-out'
              }}
              muted playsInline preload="auto" src="/images/crashout/Loss.mp4"
            ></video>
            
            {showGameStartedImage && (
              <img 
                src="/images/crashout/Game Started.gif" 
                alt="Game started"
                className="absolute inset-0 w-full h-full object-cover z-10" 
              />
            )}
          </div>
          
          <div className="hidden">
            <audio src="/sounds/crash.mp3" ref={el => { if (el) audioRefs.current.crash = el; }}></audio>
            <audio src="/sounds/cashout.mp3" ref={el => { if (el) audioRefs.current.cashout = el; }}></audio>
            <audio src="/sounds/win.mp3" ref={el => { if (el) audioRefs.current.win = el; }}></audio>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bet-section">
              <label htmlFor="betAmount" className="block mb-2 text-white flex justify-between">
                <span>Bet Amount (Farm Coins)</span>
                {gameState === GAME_STATE.COUNTDOWN && !offlineMode && (
                  <span className={`text-xs ${joinWindowTimeLeft > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {joinWindowTimeLeft > 0 ? `Join window: ${joinWindowTimeLeft}s` : "Join window closed"}
                  </span>
                )}
              </label>
              <input 
                type="number" 
                id="betAmount" 
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className={`w-full p-2 bg-[#333] rounded border ${canPlaceBet && (offlineMode || joinWindowTimeLeft > 0) ? 'border-green-500' : 'border-red-900 opacity-80'} 
                  text-white transition-all duration-300`}
                placeholder="Enter bet amount"
                min="1"
                step="1"
                disabled={!canPlaceBet || (!offlineMode && !isConnected) || (!offlineMode && joinWindowTimeLeft <= 0) || isPlayDisabled}
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
                disabled={!canPlaceBet || (!offlineMode && !isConnected) || isPlayDisabled}
              />
            </div>
          </div>
          
          <div className="farm-coins mb-4 text-center">
            <p className="text-lg">Available Farm Coins: <span className="font-bold">{farmCoins}</span></p>
          </div>
          
          <div className="game-buttons mt-4 grid grid-cols-2 gap-4">
            <button 
              onClick={handlePlay}
              disabled={isPlayDisabled || !canPlaceBet || (!offlineMode && !isConnected) || (!offlineMode && joinWindowTimeLeft <= 0)}
              className={`py-3 text-lg font-bold rounded transition-all duration-300 ${
                isPlayDisabled || !canPlaceBet || (!offlineMode && !isConnected) || (!offlineMode && joinWindowTimeLeft <= 0)
                  ? "bg-green-800 opacity-50 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700 hover:scale-[1.02]"
              }`}
            >
              {offlineMode ? (canPlaceBet ? "Place Demo Bet" : "Demo Wait") :
              gameState === GAME_STATE.COUNTDOWN ? (joinWindowTimeLeft > 0 ? `Place Bet (${joinWindowTimeLeft}s)` : "Join Window Closed") :
              (canPlaceBet ? "Place Bet" : "Wait for Next Round")}
            </button>
            
            <button 
              onClick={handleCashout}
              disabled={isCashoutDisabled || !playerJoined || gameState !== GAME_STATE.ACTIVE || (!offlineMode && !isConnected) || cashedOutAt !== null}
              className={`py-3 text-lg font-bold rounded transition-all duration-300 ${
                isCashoutDisabled || !playerJoined || gameState !== GAME_STATE.ACTIVE || (!offlineMode && !isConnected) || cashedOutAt !== null
                  ? "bg-yellow-800 opacity-50 cursor-not-allowed" 
                  : "bg-yellow-600 hover:bg-yellow-700 hover:scale-[1.02]"
              }`}
            >
              {cashedOutAt ? `Cashed Out (${cashedOutAt.toFixed(2)}x)` : "Cashout Now"}
            </button>
          </div>
          
          <div className="game-history mt-6">
            <h3 className="text-xl mb-4 text-white flex items-center">
              <span>Game History</span>
              <div className="h-[1px] flex-grow ml-3 bg-gradient-to-r from-white/10 to-transparent"></div>
            </h3>
            
            <div className="relative overflow-hidden">
              <div className="flex space-x-3 overflow-x-auto py-2 scrollbar-hide history-scroll" 
                   style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {gameHistory.map((entry, index) => {
                  const valueString = typeof entry.value === 'string' ? entry.value : String(entry.value ?? '0');
                  const value = parseFloat(valueString) || 0;
                  const isHigh = value >= 2.0;
                  const isVeryHigh = value >= 5.0;
                  
                  return (
                    <div
                      key={entry.timestamp || index}
                      className={`
                        flex-shrink-0 w-20 h-20
                        relative overflow-hidden rounded-md shadow-lg
                        transition-all duration-300 transform
                        ${isVeryHigh ? 'animate-bounce-slow' : isHigh ? 'animate-pulse' : ''}
                      `}
                    >
                      <div
                        className={`
                          w-full h-full
                          flex items-center justify-center text-center font-bold text-lg
                          ${entry.color === "green" 
                            ? "bg-gradient-to-br from-emerald-400 to-green-600" 
                            : "bg-gradient-to-br from-red-400 to-red-700"}
                        `}
                        style={{ 
                          color: "#fff",
                          textShadow: "1px 1px 2px rgba(0,0,0,0.5)"
                        }}
                      >
                        {value.toFixed(2)}x
                        {index === 0 && (
                          <div className="absolute top-0 right-0 bg-blue-600 text-xs px-1 rounded-bl-md">
                            Latest
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {gameHistory.length === 0 && (
                   <div className="text-gray-500 text-center w-full">No game history yet.</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="recent-cashouts mt-6">
            <h3 className="text-xl mb-4 text-white">Recent Cashouts</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {recentCashouts.map((cashout, index) => (
                <div key={cashout.timestamp || index} className="bg-[#222] p-2 rounded flex justify-between text-sm">
                  <span className="truncate w-1/3" title={cashout.username}>{cashout.username}</span>
                  <span className="text-green-500 font-semibold w-1/4 text-center">{cashout.multiplier.toFixed(2)}x</span>
                  <span className="w-1/3 text-right">{cashout.winning.toFixed(2)} coins</span>
                </div>
              ))}
              {recentCashouts.length === 0 && (
                <div className="text-gray-500 text-center">No recent cashouts</div>
              )}
            </div>
          </div>
          
          <div className="username-editor mt-6 bg-[#222] p-4 rounded">
            <h3 className="text-xl mb-2 text-white">Your Profile</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 p-2 bg-[#333] rounded border border-[#444] text-white"
                placeholder="Your username"
                maxLength={20}
              />
              <button
                onClick={() => changeUsername(username)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isConnected && !offlineMode}
              >
                Update
              </button>
            </div>
          </div>
          
          <div className="game-info mt-6 bg-[#222] p-4 rounded text-sm text-white/70">
            <h4 className="font-bold mb-2">How to Play:</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Enter your bet amount in farm coins</li>
              <li>Set an auto-cashout multiplier (optional)</li>
              <li>Click "Place Bet" during the join window to play the next round</li>
              <li>Wait for the multiplier to increase</li>
              <li>Click "Cashout Now" before the game crashes to win</li>
              <li>If you wait too long, you'll lose your bet!</li>
              <li>Play against other players in real-time (when connected)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}