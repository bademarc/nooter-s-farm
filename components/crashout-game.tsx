/// components/crashout-game.tsx
"use client";

// Add TypeScript declaration for window._loggedUrls
declare global {
  interface Window {
    _loggedUrls?: {[key: string]: boolean};
    _audioInstances?: {[key: string]: HTMLAudioElement};
    _crashoutAudioInitialized?: boolean;
  }
}

import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { GameContext } from '@/context/game-context';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import './crashout/crashout-styles.css';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import axios from 'axios';

// Define required types and enums
enum GameState {
  INACTIVE = 'INACTIVE',
  WAITING = 'WAITING',
  RUNNING = 'RUNNING',
  CRASHED = 'CRASHED'
}

interface PlayerData {
  username: string;
  betAmount: number;
}

interface CashoutData {
  username: string;
  multiplier: number;
  winAmount: number;
}

interface GameHistoryEntry {
  id?: string;
  value: string;
  color: string;
  timestamp: number;
  crashPoint?: number | string;
}

interface HighScoreEntry {
  username: string;
  multiplier: number;
  winAmount: number;
  timestamp: number;
}

// Constants for game states (same as server)
const GAME_STATE = {
  INACTIVE: "inactive",
  COUNTDOWN: "countdown",
  ACTIVE: "active",
  CRASHED: "crashed",
  CASHED_OUT: "cashed_out",
};

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const API_TIMEOUT_MS = 10000; // 10 seconds

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

// Add a utility function to get or create shared audio instances
const getAudioInstance = (key: string, src: string): HTMLAudioElement => {
  if (typeof window === 'undefined') return null as unknown as HTMLAudioElement;
  
  // Initialize the audio instances cache if it doesn't exist
  if (!window._audioInstances) {
    window._audioInstances = {};
  }
  
  // Return the existing instance if it exists
  if (window._audioInstances[key]) {
    return window._audioInstances[key];
  }
  
  // Log creation of a new audio instance to help with debugging
  console.info(`Creating new audio instance for: ${key}`);
  
  // Create a new instance if it doesn't exist yet
  const audio = new Audio(src);
  
  // Set up error handling on the audio element
  audio.addEventListener('error', (e) => {
    console.warn(`Audio error on ${key}:`, e);
  });
  
  // Store in global cache
  window._audioInstances[key] = audio;
  return audio;
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
  
  // Add didMountRef to prevent double mounting issues
  const didMountRef = useRef<boolean>(false);
  
  // Add intervals and timers refs
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const demoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const joinWindowRef = useRef<NodeJS.Timeout | null>(null);
  const apiRetryCountRef = useRef<number>(0);
  const pollingRateRef = useRef<number>(3000); // Default polling rate (ms)
  
  // Audio handling - use shared instances instead of creating new ones
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
  
  // Game state
  const [multiplier, setMultiplier] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
  const [countdown, setCountdown] = useState<number>(0);
  const [username, setUsername] = useState<string>('');
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [cashouts, setCashouts] = useState<CashoutData[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [highScores, setHighScores] = useState<HighScoreEntry[]>([]);
  const [betAmount, setBetAmount] = useState<string>('10');
  const [autoCashout, setAutoCashout] = useState<string>('2.0');
  const [playerJoined, setPlayerJoined] = useState<boolean>(false);
  const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);
  const [isCashoutDisabled, setIsCashoutDisabled] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  
  // UI state
  const [isPlayDisabled, setIsPlayDisabled] = useState<boolean>(false);
  const [showGameStartedImage, setShowGameStartedImage] = useState<boolean>(false);
  const [showLossImage, setShowLossImage] = useState<boolean>(false);
  const [joinWindowTimeLeft, setJoinWindowTimeLeft] = useState<number>(0);
  
  // Auto-play
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(true);
  const [canPlaceBet, setCanPlaceBet] = useState<boolean>(true);
  const [nextGameStartTime, setNextGameStartTime] = useState<number | null>(null);
  
  // Online specific state
  const [onlinePlayersCount, setOnlinePlayersCount] = useState<number>(0);
  const [playersInGame, setPlayersInGame] = useState<number>(0);
  const [recentCashouts, setRecentCashouts] = useState<Array<{username: string, multiplier: number, winning: number, timestamp: number}>>([]);

  // Create a currentGameData ref to track state changes without re-renders
  const currentGameData = useRef<any>(null);
  const apiError = useRef<boolean>(false);

  const setApiError = useCallback((value: boolean) => {
    apiError.current = value;
  }, []);

  // Utility function for fetching game data
  const getCurrentGameData = useCallback(async () => {
    try {
      const response = await axios.get('/api/game', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching game data:', error);
      return null;
    }
  }, []);

  // Utility function for fetching game history
  const getGameHistory = useCallback(async () => {
    try {
      const response = await axios.get('/api/game/history', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching game history:', error);
      return [];
    }
  }, []);

  // Define timer functions before they're used
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
  
  // Initialize audio with shared instances to avoid too many media players
  const initializeAudio = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Only initialize once to prevent multiple instances
    if (window._crashoutAudioInitialized) {
      console.info('Audio already initialized, reusing instances');
      
      // Update references to existing audio instances
      if (window._audioInstances) {
        audioRefs.current.crash = window._audioInstances['crashout_crash'] || null;
        audioRefs.current.cashout = window._audioInstances['crashout_cashout'] || null;
        audioRefs.current.win = window._audioInstances['crashout_win'] || null;
        audioRefs.current.backgroundMusic = window._audioInstances['crashout_bgm'] || null;
        
        // Update volume settings on existing instances
        if (audioRefs.current.backgroundMusic) {
          audioRefs.current.backgroundMusic.volume = muted ? 0 : volume * 0.3;
        }
      }
      return;
    }
    
    console.info('Initializing audio for Crashout game');
    window._crashoutAudioInitialized = true;
    
    // Preload all audio files with a single instance each
    audioRefs.current.crash = getAudioInstance('crashout_crash', '/sounds/crash.mp3');
    audioRefs.current.cashout = getAudioInstance('crashout_cashout', '/sounds/cashout.mp3');
    audioRefs.current.win = getAudioInstance('crashout_win', '/sounds/win.mp3');
    
    const bgMusic = getAudioInstance('crashout_bgm', '/sounds/background_music.mp3');
    bgMusic.loop = true;
    bgMusic.volume = muted ? 0 : volume * 0.3;
    audioRefs.current.backgroundMusic = bgMusic;
    
    // Set up instances to handle auto-play restrictions
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        // Set initial volume for all audio elements
        audio.volume = audio === audioRefs.current.backgroundMusic ? volume * 0.3 : volume;
        // Pre-mute if needed
        audio.muted = muted;
      }
    });
  }, [muted, volume]);
  
  // Modified playSound function to handle errors better
  const playSound = useCallback((type: string) => {
    if (!audioRefs.current[type] || muted) return;
    
    try {
      const audio = audioRefs.current[type];
      if (!audio) return;
      
      // Update volume before playing
      audio.volume = type === 'backgroundMusic' ? volume * 0.3 : volume;
      audio.muted = muted;
      
      // Handle background music specially to avoid resetting position
      if (type === 'backgroundMusic') {
        if (audio.paused) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
                console.warn(`Could not play background music:`, e);
              }
            });
          }
        }
        // Don't reset currentTime for background music
        return;
      }
      
      // For sound effects, reset position and play
      audio.currentTime = 0;
      
      // Use a promise with proper error handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
            console.warn(`Could not play ${type} sound:`, e);
          }
        });
      }
    } catch (err) {
      console.warn(`Error playing sound: ${type}`, err);
    }
  }, [muted, volume]);
  
  // Helper method to detect API availability with timeout
  const checkApiAvailability = useCallback(async () => {
    try {
      console.log('Checking API availability...');
      
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API check timeout')), API_TIMEOUT_MS);
      });
      
      // First try the health endpoint which has more detailed diagnostics
      try {
        const healthCheckPromise = fetch('/api/health', { 
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        })
        .then(res => res.json());
        
        // Race against timeout
        const healthData = await Promise.race([healthCheckPromise, timeoutPromise]);
        console.log('API health endpoint response:', healthData);
        
        if (healthData.redis?.status !== 'connected') {
          const errorMsg = healthData.redis?.error || 'Unknown Redis error';
          console.error('Redis not connected in health check:', errorMsg);
          toast.error(`Redis connection error: ${errorMsg}`);
          return false;
        }
        
        return true;
      } catch (healthError) {
        console.warn('Health endpoint not available, falling back to game endpoint:', healthError);
      }
      
      // Fall back to the game endpoint with timeout
      const gameCheckPromise = fetch('/api/game', { 
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      })
      .then(res => res.json());
      
      const data = await Promise.race([gameCheckPromise, timeoutPromise]);
      console.log('API game endpoint response:', data);
      
      if (data.redis === 'disconnected' || data.status === 'error') {
        toast.error(`Redis connection error: ${data.error || 'Unknown error'}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('API availability check failed:', error);
      toast.error(`API availability check failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }, []);
  
  // Modified startDemoMode function to prevent infinite loops
  const startDemoMode = useCallback(() => {
    console.log("Starting demo mode");
    setOfflineMode(true);
    setIsConnected(true);
    setConnectionStatus('Demo Mode');
    
    // Load demo username from localStorage or use default
    const storedUsername = localStorage.getItem('crashoutUsername') || 'Player' + Math.floor(Math.random() * 1000);
    setUsername(storedUsername);
    localStorage.setItem('crashoutUsername', storedUsername);
    localStorage.setItem('crashoutDemoMode', 'true');
    
    // Reset game state
    setGameState(GameState.WAITING);
    setMultiplier(1);
    setCountdown(5);
    setPlayers([]);
    setCashouts([]);
    setPlayerJoined(false);
    setCashedOutAt(null);
    setIsCashoutDisabled(true);
    
    // Sample game history
    setGameHistory([
      { 
        id: '1', 
        value: '1.25', 
        color: parseFloat('1.25') >= 2.0 ? 'green' : 'red',
        timestamp: Date.now() - 50000,
        crashPoint: 1.25
      },
      { 
        id: '2', 
        value: '2.5', 
        color: parseFloat('2.5') >= 2.0 ? 'green' : 'red',
        timestamp: Date.now() - 40000,
        crashPoint: 2.5
      },
      { 
        id: '3', 
        value: '1.1', 
        color: parseFloat('1.1') >= 2.0 ? 'green' : 'red',
        timestamp: Date.now() - 30000,
        crashPoint: 1.1
      },
      { 
        id: '4', 
        value: '5.2', 
        color: parseFloat('5.2') >= 2.0 ? 'green' : 'red',
        timestamp: Date.now() - 20000,
        crashPoint: 5.2
      },
      { 
        id: '5', 
        value: '1.9', 
        color: parseFloat('1.9') >= 2.0 ? 'green' : 'red',
        timestamp: Date.now() - 10000,
        crashPoint: 1.9
      }
    ]);
    
    // Clear any existing intervals/timers
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    
    if (demoTimerRef.current) {
      clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    
    // Start the demo game cycle
    let demoGameState = GameState.WAITING;
    let demoMultiplier = 1;
    let demoCountdown = 5;
    let demoCrashPoint = 1 + Math.random() * 10;
    
    // Use a separate variable to track countdown - don't modify state directly in intervals
    let countdownValue = demoCountdown;
    
    // Update countdown during WAITING state - using proper state updates
    const countdownInterval = setInterval(() => {
      countdownValue--;
      // Update state safely
      setCountdown(countdownValue);
      
      if (countdownValue <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
    
    // Switch to RUNNING state after countdown
    demoTimerRef.current = setTimeout(() => {
      // Switch to RUNNING state after countdown
      demoGameState = GameState.RUNNING;
      setGameState(GameState.RUNNING);
      setIsCashoutDisabled(false);
      
      // Update multiplier at intervals during RUNNING state
      demoIntervalRef.current = setInterval(() => {
        demoMultiplier = parseFloat((demoMultiplier * 1.05).toFixed(2));
        setMultiplier(demoMultiplier);
        
        // Check if we should crash
        if (demoMultiplier >= demoCrashPoint) {
          if (demoIntervalRef.current) {
            clearInterval(demoIntervalRef.current);
            demoIntervalRef.current = null;
          }
          
          // Crash the game
          setGameState(GameState.CRASHED);
          playSound('crash');
          
          // Add to history
          const newHistoryEntry: GameHistoryEntry = {
            id: Date.now().toString(),
            value: demoMultiplier.toFixed(2),
            color: demoMultiplier >= 2.0 ? 'green' : 'red',
            timestamp: Date.now(),
            crashPoint: demoMultiplier
          };
          setGameHistory(prev => [newHistoryEntry, ...prev.slice(0, 9)]);
          
          // If player joined but didn't cash out, they lost
          if (playerJoined && cashedOutAt === null) {
            toast.error(`Game crashed at ${demoMultiplier.toFixed(2)}x. You lost ${betAmount} Farm Coins.`);
          }
          
          // Reset for next round - delay to avoid multiple state updates
          setTimeout(() => {
            if (!offlineMode) return; // Only restart if still in demo mode
            startDemoMode();
          }, 5000);
        }
      }, 100);
    }, demoCountdown * 1000);
    
    toast.success("Started demo mode! You have 1000 Farm Coins to play with.");
  }, [playSound, betAmount, cashedOutAt, playerJoined, setOfflineMode, setIsConnected, setConnectionStatus, setUsername, setGameState, setMultiplier, setCountdown, setPlayers, setCashouts, setPlayerJoined, setCashedOutAt, setIsCashoutDisabled, setGameHistory, offlineMode]);

  // Set up polling for game state - Define this function here
  const setupPolling = useCallback(() => {
    // Polling setup logic...
    console.log("Setting up polling for game state");
    
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Start polling
    pollingIntervalRef.current = setInterval(() => {
      // Actual implementation would call fetchGameState() here
      console.log("Polling for game state");
    }, 1000);
  }, []);
  
  // Use a more stable structure for dependency arrays in useEffect
  useEffect(() => {
    console.log('CrashoutGame component mounted - Running setup effect');
    
    // Mark as mounted to prevent useEffect from running twice in development mode
    if (didMountRef.current) {
      console.log('[Dev Only/StrictMode] Skipping duplicate setup effect run.');
      return;
    }
    didMountRef.current = true;
    
    // Initialize audio with shared instances
    initializeAudio();

    // Check if environment explicitly sets demo mode
    const envDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const forceDemoMode = process.env.NEXT_PUBLIC_FORCE_DEMO_MODE === 'true';
    // Check localStorage for user preference
    const localStorageDemoMode = typeof window !== 'undefined' && localStorage.getItem('crashoutDemoMode') === 'true';
    // VERCEL_ENV is automatically available in Vercel deployments
    const isVercelPreview = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    
    const shouldStartInDemoMode = envDemoMode || localStorageDemoMode || isVercelPreview || forceDemoMode;

    if (!shouldStartInDemoMode) {
      // Try to connect to server and check API availability first
      checkApiAvailability().then(isAvailable => {
        if (isAvailable) {
          console.log("API available, starting online mode");
          setupPolling();
        } else {
          console.log("API not available, starting in demo mode");
          startDemoMode();
        }
      }).catch(() => {
        console.log("API check failed, starting in demo mode");
        startDemoMode();
      });
    } else {
      console.log("Initial setup: Starting in demo mode based on settings.");
      startDemoMode();
    }

    // Cleanup function
    return () => {
      console.log('CrashoutGame setup cleanup running.');
      clearJoinWindowTimer();
      
      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      // Clean up local timers and intervals
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
      
      // Cleanup audio
      if (audioRefs.current.backgroundMusic) {
        audioRefs.current.backgroundMusic.pause();
      }
    };
  }, []); // Empty dependency array as this should only run once

  // Handle background music based on game state with proper dependency tracking
  useEffect(() => {
    // Only manage audio playback when dependencies change
    if (audioRefs.current.backgroundMusic) {
      const bgMusic = audioRefs.current.backgroundMusic;
      
      // Update volume
      bgMusic.volume = muted ? 0 : volume * 0.3;
      
      // Handle playing/pausing based on game state
      if (gameState === GameState.RUNNING && !muted) {
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            if (err.name !== 'NotAllowedError') {
              console.warn('Background music playback error:', err);
            }
          });
        }
      } else {
        bgMusic.pause();
      }
    }
  }, [gameState, muted, volume]);

  // Use proper lifecycle handling for the updateGameState function
  useEffect(() => {
    // Skip if offline
    if (offlineMode) return;
    
    // Create polling interval
    const intervalId = setInterval(async () => {
      if (!isConnected) return;
      
      try {
        const data = await getCurrentGameData();
        
        if (!data) {
          console.warn('No game data received');
          return;
        }
        
        // Only update state if the data has changed
        if (JSON.stringify(data) !== JSON.stringify(currentGameData.current)) {
          currentGameData.current = data;
          
          // Handle game state transition
          const prevState = gameState;
          setGameState(data.state);
          
          // Handle multiplier updates
          if (data.state === GameState.RUNNING) {
            if (prevState !== GameState.RUNNING) {
              // Started a new round - play background music
              playSound('backgroundMusic');
            }
            setMultiplier(data.multiplier || 1.0);
          }
          
          // Handle crash
          if (data.state === GameState.CRASHED && prevState !== GameState.CRASHED) {
            // Just crashed - play crash sound
            playSound('crash');
            // Update game history with the new round
            getGameHistory().then(history => setGameHistory(history)).catch(console.error);
          }
        }
      } catch (error) {
        console.error('Error updating game state:', error);
        setApiError(true);
      }
    }, 1000);
    
    // Clean up interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [offlineMode, isConnected, gameState, setApiError, getCurrentGameData, getGameHistory, playSound]);

  // Store volume in localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crashoutVolume', volume.toString());
      
      // Update volume for all audio elements
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.volume = audio === audioRefs.current.backgroundMusic ? volume * 0.3 : volume;
        }
      });
    }
  }, [volume]);

  // Store muted state in localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crashoutMuted', muted ? 'true' : 'false');
      
      // Update muted state for all audio elements
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.muted = muted;
        }
      });
    }
  }, [muted]);

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
    const uniqueHistory = newHistory.reduce((acc, current) => {
      const exists = acc.some(
        (item) =>
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
  
  // Handle placing a bet
  const handlePlay = useCallback(async () => {
    if (offlineMode) {
      // Handle offline bet as before
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

    if (!canPlaceBet || !isConnected || joinWindowTimeLeft <= 0 || isPlayDisabled) {
      toast.warning("Cannot place bet now. Ensure you are connected and the join window is open.");
      return;
    }

    const bet = parseFloat(betAmount);
    const cashoutTarget = parseFloat(autoCashout);

    if (isNaN(bet) || bet <= 0) { toast.error("Invalid bet amount."); return; }
    if (isNaN(cashoutTarget) || cashoutTarget < 1.01) { toast.error("Invalid auto cashout multiplier (must be >= 1.01)."); return; }

    setIsPlayDisabled(true);
    toast.info("Placing bet...");

    try {
      const response = await axios.post('/api/game', {
        action: 'placeBet',
        username,
        betAmount: bet,
        autoCashout: cashoutTarget
      });

      if (response.data.success) {
        setPlayerJoined(true);
        setIsPlayDisabled(true);
        setIsCashoutDisabled(false);
        toast.success("Bet placed successfully!");
      } else {
        setIsPlayDisabled(false);
        toast.error(response.data.message || "Failed to place bet");
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      setIsPlayDisabled(false);
      toast.error("Error communicating with server. Please try again.");
    }
  }, [
    canPlaceBet, isConnected, betAmount, autoCashout, joinWindowTimeLeft, isPlayDisabled, offlineMode
  ]);

  // Handle cashing out
  const handleCashout = useCallback(async () => {
    if (offlineMode) {
      // Handle offline cashout as before
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

    if (!playerJoined || gameState !== GAME_STATE.ACTIVE || !isConnected || isCashoutDisabled || cashedOutAt !== null) {
      toast.warning("Cannot cash out now.");
      return;
    }

    setIsCashoutDisabled(true);
    toast.info("Cashing out...");

    try {
      const response = await axios.post('/api/game', {
        action: 'cashout',
        username
      });

      if (response.data.success) {
        setCashedOutAt(response.data.multiplier);
        playSound('win');
        
        if (response.data.winAmount) {
          addFarmCoins(response.data.winAmount);
          toast.success(`Cashed out at ${response.data.multiplier.toFixed(2)}x! Won ${response.data.winAmount.toFixed(2)} coins!`);
        } else {
          toast.success(`Cashed out at ${response.data.multiplier.toFixed(2)}x!`);
        }
      } else {
        setIsCashoutDisabled(!playerJoined);
        toast.error(response.data.message || "Failed to cash out");
      }
    } catch (error) {
      console.error('Error cashing out:', error);
      setIsCashoutDisabled(!playerJoined);
      toast.error("Error communicating with server. Please try again.");
    }
  }, [
    playerJoined, gameState, isConnected, isCashoutDisabled, cashedOutAt, offlineMode, multiplier, betAmount, addFarmCoins, playSound
  ]);

  // Handle changing username
  const changeUsername = useCallback(async (newUsername: string) => {
    if (offlineMode) {
      // Handle offline username change
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

    if (!isConnected) {
      toast.error("Cannot change username while offline.");
      return;
    }
    
    if (!newUsername || newUsername.trim().length === 0 || newUsername.length > 20) {
      toast.error("Invalid username (1-20 characters).");
      return;
    }

    const trimmedUsername = newUsername.trim();
    const oldUsername = username;
    
    // Update locally first for responsive UI
    setUsername(trimmedUsername);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crashoutUsername', trimmedUsername);
    }
    toast.info("Updating username...");

    try {
      // Notify the server
      await axios.post('/api/game', {
        action: 'playerActivity',
        username: trimmedUsername,
        oldUsername,
        betAmount: parseFloat(betAmount) || 10,
        autoCashout: parseFloat(autoCashout) || 2.0
      });
      
      toast.success("Username updated successfully!");
    } catch (error) {
      console.error('Error updating username:', error);
      // Revert on failure
      setUsername(oldUsername);
      if (typeof window !== 'undefined') {
        localStorage.setItem('crashoutUsername', oldUsername);
      }
      toast.error("Failed to update username on server.");
    }
  }, [isConnected, username, offlineMode, betAmount, autoCashout]);

  useEffect(() => {
    // When the component first mounts, check if API is reachable at all
    // If not, don't even try POST requests and go straight to demo mode
    if (!offlineMode) {
      checkApiAvailability().then(isAvailable => {
        if (!isAvailable) {
          toast.error("Game server API not available. Starting in demo mode.");
          startDemoMode();
        }
      });
    }
  }, [checkApiAvailability, offlineMode, startDemoMode]);

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
          {!offlineMode && (
            <button
              onClick={startDemoMode}
              className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded-full"
              title="Switch to offline demo mode"
            >
              Demo Mode
            </button>
          )}
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
            {/* No need to create audio elements here anymore */}
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