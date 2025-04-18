/// components/crashout-game.tsx
"use client";

// Wrap the global declarations in a proper module declaration to fix TypeScript errors
// Add TypeScript declaration for window._loggedUrls
declare module global {
  interface Window {
    _loggedUrls?: {[key: string]: boolean};
    _audioInstances?: {[key: string]: HTMLAudioElement};
    _crashoutAudioInitialized?: boolean;
    _ethereumPropertyProtected?: boolean;
    _propertyAccessAttempts?: {[key: string]: number};
    _propertyValues?: {[key: string]: any};
    _earlyWalletInjectionAttempts?: {[key: string]: number};
    _hiddenDescriptors?: {[key: string]: PropertyDescriptor | null};
  }
}

// Use alias for window with proper typing
const typedWindow = typeof window !== 'undefined' ? (window as any) : undefined;

// Add immediate protection for ethereum properties before imports
// This runs as soon as the file is parsed, before any components mount
if (typeof window !== 'undefined' && !typedWindow._ethereumPropertyProtected) {
  try {
    // Initialize tracking objects
    typedWindow._propertyAccessAttempts = typedWindow._propertyAccessAttempts || {};
    typedWindow._propertyValues = typedWindow._propertyValues || {};
    typedWindow._earlyWalletInjectionAttempts = typedWindow._earlyWalletInjectionAttempts || {};
    typedWindow._hiddenDescriptors = typedWindow._hiddenDescriptors || {};
    
    const protectProperty = (propName: string) => {
      try {
        // Silently skip if the property is already non-configurable
        // This prevents console errors in the browser
        const descriptor = Object.getOwnPropertyDescriptor(window, propName);
        if (descriptor && !descriptor.configurable) {
          console.log(`Property ${propName} is not configurable, skipping protection`);
          return;
        }
        
        // Store current value before we modify anything
        let currentValue = undefined;
        try {
          // Only try to get value if possible without errors
          if (!descriptor || (descriptor.get && !descriptor.set) || descriptor.value !== undefined) {
            currentValue = typedWindow[propName];
          }
        } catch (err) {
          // Silently ignore errors when reading current value
        }
        
        // Initialize value store
        typedWindow._propertyValues[propName] = currentValue;
        
        // Only try to redefine properties that don't exist yet or are configurable
        if (!descriptor || descriptor.configurable) {
          try {
            Object.defineProperty(window, propName, {
              configurable: true,
              enumerable: true,
              get: () => typedWindow._propertyValues[propName],
              set: (newValue) => {
                // Allow setting the property value in our storage
                typedWindow._propertyValues[propName] = newValue;
                
                // Track access attempts for debugging
                typedWindow._propertyAccessAttempts[propName] = 
                  (typedWindow._propertyAccessAttempts[propName] || 0) + 1;
              }
            });
          } catch (defineError) {
            // Silently ignore errors when defining properties
          }
        }
      } catch (err) {
        // Silent fail if property is protected
      }
    };
    
    // Protect common properties that cause conflicts with browser extensions
    // This expanded list covers most crypto wallet injections
    // Try to protect each property, ignoring any errors
    [
      'web3', 'solana', 'solflare', 'phantom',
      'keplr', 'xdefi', 'leap', 'cosmostation', 'terraWallets', 'evmProvider'
    ].forEach(propName => {
      try {
        protectProperty(propName);
      } catch (err) {
        // Ignore errors for individual properties
      }
    });
    
    typedWindow._ethereumPropertyProtected = true;
    
    // Add error handler for extension security policy access errors
    window.addEventListener('error', function(event) {
      if (event.error && event.error.message && 
          (event.error.message.includes('storage is not allowed') || 
           event.error.message.includes('security policy violations'))) {
        // Suppress console errors for extension content security policy violations
        event.preventDefault();
      }
    });
  } catch (e) {
    // Log any errors
    console.warn("Error setting up property protection:", e);
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
  // Add tracking for gambling-focused enhancements
  winStreak: number;
  lossStreak: number;
  previousBets: number[];
  useMartingale: boolean;
  highestWin: number;
  totalWon: number;
  totalLost: number;
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

// Map backend states to frontend GameState enum for better type safety
const mapBackendStateToFrontend = (backendState: string): GameState => {
  switch(backendState) {
    case GAME_STATE.ACTIVE:
      return GameState.RUNNING;
    case GAME_STATE.COUNTDOWN:
      return GameState.WAITING;
    case GAME_STATE.CRASHED:
      return GameState.CRASHED;
    case GAME_STATE.INACTIVE:
    default:
      return GameState.INACTIVE;
  }
};

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const API_TIMEOUT_MS = 15000; // 15 seconds - increased from 10 seconds
const JOIN_WINDOW_SECONDS = 15; // 15 seconds for join window
const GAME_COUNTDOWN_SECONDS = 15; // 15 seconds for game countdown

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
  const typedWindow = window as any;
  
  // Initialize the audio instances cache if it doesn't exist
  if (!typedWindow._audioInstances) {
    typedWindow._audioInstances = {};
  }
  
  // Return the existing instance if it exists
  if (typedWindow._audioInstances[key]) {
    return typedWindow._audioInstances[key];
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
  typedWindow._audioInstances[key] = audio;
  return audio;
};

// Add new sound function types
const playWinSound = (multiplier: number) => {
  // Play different win sounds based on multiplier amount
  if (multiplier >= 5.0) {
    return 'bigWin'; // Big win sound
  } else if (multiplier >= 2.0) {
    return 'win'; // Normal win
  } else {
    return 'smallWin'; // Small win
  }
};

const playLoseSound = (betAmount: number) => {
  // Play different lose sounds based on bet amount
  if (betAmount >= 100) {
    return 'bigLoss'; // Big loss sound
  } else {
    return 'crash'; // Normal crash sound
  }
};

// Calculate next bet using martingale strategy
const calculateMartingaleBet = (previousBets: number[], baseBet: number, maxBet: number = 1000): number => {
  if (!previousBets || previousBets.length === 0) {
    return baseBet;
  }
  
  // Doubling after a loss is the core martingale strategy
  const lastBet = previousBets[previousBets.length - 1];
  const suggestedBet = lastBet * 2;
  
  // Cap at max bet to prevent catastrophic losses
  return Math.min(suggestedBet, maxBet);
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
    backgroundMusic: null,
    bigWin: null,
    smallWin: null,
    bigLoss: null
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
  const jsonErrorCountRef = useRef<number>(0);
  const [redisJsonErrorPersistent, setRedisJsonErrorPersistent] = useState<boolean>(false);

  // Enhanced player state for gambling features
  const [winStreak, setWinStreak] = useState<number>(0);
  const [lossStreak, setLossStreak] = useState<number>(0);
  const [previousBets, setPreviousBets] = useState<number[]>([]);
  const [useMartingale, setUseMartingale] = useState<boolean>(false);
  const [highestWin, setHighestWin] = useState<number>(0);
  const [totalWon, setTotalWon] = useState<number>(0);
  const [totalLost, setTotalLost] = useState<number>(0);
  const [showHotStreak, setShowHotStreak] = useState<boolean>(false);
  const [streakEffect, setStreakEffect] = useState<string>('');

  const setApiError = useCallback((value: boolean) => {
    apiError.current = value;
  }, []);

  // Modify the getCurrentGameData function to use the auto-repair endpoint on JSON parsing errors
  const getCurrentGameData = useCallback(async () => {
    try {
      console.log('Fetching current game data...');
      const response = await axios.get('/api/game', {
        headers: { 
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        transformResponse: [
          // Add custom transform to handle malformed JSON before axios tries to parse it
          (data) => {
            if (typeof data !== 'string') return data;
            
            try {
              return JSON.parse(data);
            } catch (err: any) {
              console.warn('JSON parse error in response:', err.message);
              
              // Track JSON parsing errors for diagnostic purposes
              const jsonErrorData = {
                message: err.message,
                sample: data.slice(0, 100),
                timestamp: Date.now()
              };
              
              // Trigger auto-repair when JSON errors are detected
              if (err.message.includes('JSON')) {
                console.log('Triggering auto-repair due to JSON parse error');
                // Send the request to auto-repair endpoint asynchronously 
                // We don't await this to avoid delaying the current operation
                axios.post('/api/game/auto-repair', {
                  errorData: jsonErrorData
                }).then(repairResult => {
                  console.log('Auto-repair completed:', repairResult.data);
                  if (repairResult.data.repaired) {
                    toast.success('Game data has been automatically repaired');
                  }
                }).catch(repairErr => {
                  console.error('Auto-repair failed:', repairErr);
                });
              }
              
              // Try to clean the response
              if (data.startsWith('{') && data.includes('error')) {
                try {
                  // Extract the error message directly
                  const errorMatch = data.match(/error["']?\s*:\s*["']([^"']+)["']/i);
                  const errorMsg = errorMatch ? errorMatch[1] : 'Unknown JSON parse error';
                  
                  // Return a valid fallback object
                  return {
                    success: false,
                    message: 'Error parsing game data',
                    error: errorMsg,
                    redis: 'disconnected',
                    timestamp: Date.now(),
                    jsonError: true,
                    autoRepairTriggered: true
                  };
                } catch (e) {
                  // Last resort fallback
                  return {
                    success: false,
                    message: 'Invalid JSON from API',
                    error: String(err),
                    redis: 'disconnected',
                    jsonError: true,
                    autoRepairTriggered: true
                  };
                }
              }
              
              // Return a standard error object 
              return {
                success: false,
                message: 'API returned invalid data',
                error: String(err),
                redis: 'disconnected',
                jsonError: true,
                autoRepairTriggered: true
              };
            }
          }
        ]
      });
      
      console.log('Game data response status:', response.status);
      
      // Make sure we have data
      if (!response.data) {
        console.error('API returned empty data');
        return null;
      }
      
      // Check if the response is potentially invalid JSON that was already parsed
      if (response.data && typeof response.data === 'object' && response.data.error && 
          response.data.error.includes("JSON")) {
        console.warn('JSON parse error detected from API response:', response.data.error);
        
        // If auto-repair wasn't already triggered, do it now
        if (!response.data.autoRepairTriggered) {
          console.log('Triggering delayed auto-repair for JSON error');
          axios.post('/api/game/auto-repair', {
            errorData: {
              message: response.data.error,
              timestamp: Date.now()
            }
          }).catch(err => console.error('Error calling auto-repair:', err));
        }
        
        // Return a safe fallback object
        return {
          state: GAME_STATE.INACTIVE,
          multiplier: 1.0,
          countdown: 0,
          message: "API returned invalid JSON",
          error: response.data.error,
          redis: "disconnected",
          players: [],
          onlinePlayers: 0,
          recentCashouts: []
        };
      }
      
      // If the response contains gameState data, use it directly
      if (response.data.gameState) {
        console.log('Received game state data from API:', response.data.gameState.state);
        return {
          ...response.data.gameState,
          onlinePlayers: response.data.onlinePlayers,
          history: response.data.history,
          recentCashouts: response.data.cashouts
        };
      }
      
      // If the response contains a message but no game state data, 
      // let's create a default state to avoid undefined errors
      if (response.data.message && response.data.message === "Game API is running" && !response.data.gameState) {
        console.warn('API returned connection message without game state, creating default state');
        
        // Create a basic default state
        return {
          state: GAME_STATE.INACTIVE,
          multiplier: 1.0,
          countdown: 0,
          redis: response.data.redis || "unknown",
          message: response.data.message || "Game API is running",
          // Add any other default fields we need
          players: [],
          onlinePlayers: 0,
          recentCashouts: []
        };
      }
      
      return response.data;
    } catch (error: any) { // Type assertion to handle axios error properties
      console.error('Error fetching game data:', error);
      
      // Provide detailed error information
      if (error.response) {
        // Server responded with non-2xx status
        console.error('Server error response:', error.response.status, error.response.data);
        
        // Check if the error is a JSON parsing error
        const errorData = error.response.data;
        if (typeof errorData === 'string' && errorData.includes('JSON')) {
          console.warn('Possible JSON parse error in response');
          
          // Trigger auto-repair
          axios.post('/api/game/auto-repair', {
            errorData: {
              message: 'Error in response data: ' + (error.response.statusText || 'Unknown error'),
              sample: typeof errorData === 'string' ? errorData.slice(0, 100) : 'Non-string data',
              status: error.response.status,
              timestamp: Date.now()
            }
          }).catch(repairErr => console.error('Auto-repair request failed:', repairErr));
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received from server');
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', error.message);
      }
      
      // Return a fallback state object
      return {
        state: GAME_STATE.INACTIVE,
        multiplier: 1.0,
        countdown: 0,
        message: "Error connecting to game API",
        error: error.message,
        redis: "disconnected",
        players: [],
        onlinePlayers: 0,
        recentCashouts: []
      };
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
    const typedWindow = window as any;
    
    // Only initialize once to prevent multiple instances
    if (typedWindow._crashoutAudioInitialized) {
      console.info('Audio already initialized, reusing instances');
      
      // Update references to existing audio instances
      if (typedWindow._audioInstances) {
        audioRefs.current.crash = typedWindow._audioInstances['crashout_crash'] || null;
        audioRefs.current.cashout = typedWindow._audioInstances['crashout_cashout'] || null;
        audioRefs.current.win = typedWindow._audioInstances['crashout_win'] || null;
        audioRefs.current.backgroundMusic = typedWindow._audioInstances['crashout_bgm'] || null;
        // Add new gambling-focused sound effects
        audioRefs.current.bigWin = typedWindow._audioInstances['crashout_bigwin'] || null;
        audioRefs.current.smallWin = typedWindow._audioInstances['crashout_smallwin'] || null;
        audioRefs.current.bigLoss = typedWindow._audioInstances['crashout_bigloss'] || null;
        
        // Update volume settings on existing instances
        if (audioRefs.current.backgroundMusic) {
          audioRefs.current.backgroundMusic.volume = muted ? 0 : volume * 0.3;
        }
      }
      return;
    }
    
    console.info('Initializing audio for Crashout game');
    typedWindow._crashoutAudioInitialized = true;
    
    // Preload all audio files with a single instance each
    audioRefs.current.crash = getAudioInstance('crashout_crash', '/sounds/crash.mp3');
    audioRefs.current.cashout = getAudioInstance('crashout_cashout', '/sounds/cashout.mp3');
    audioRefs.current.win = getAudioInstance('crashout_win', '/sounds/win.mp3');
    // Add new gambling-focused sound effects
    audioRefs.current.bigWin = getAudioInstance('crashout_bigwin', '/sounds/bigwin.mp3');
    audioRefs.current.smallWin = getAudioInstance('crashout_smallwin', '/sounds/smallwin.mp3');
    audioRefs.current.bigLoss = getAudioInstance('crashout_bigloss', '/sounds/bigloss.mp3');
    
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
  
  // Modify the checkApiAvailability function to be more robust
  const checkApiAvailability = useCallback(async () => {
    try {
      console.log('Checking API availability...');
      apiRetryCountRef.current = 0; // Reset retry count
      
      // Try up to 5 retries with increasing timeout
      for (let attempt = 1; attempt <= 5; attempt++) {
        console.log(`API check attempt ${attempt}/5...`);
        
        try {
          // Set a timeout that increases with each retry
          const timeout = API_TIMEOUT_MS * (1 + (attempt * 0.5));
          console.log(`Using timeout of ${timeout}ms`);
          
          // Create axios instance with timeout
          const axiosInstance = axios.create({
            timeout: timeout
          });
          
          // Add more debug info in the request headers
          const response = await axiosInstance.get('/api/game', {
            headers: { 
              'Cache-Control': 'no-cache',
              'X-Debug-Client': 'crashout-game-component',
              'X-Debug-Timestamp': Date.now().toString(),
              'X-Debug-Attempt': attempt.toString()
            }
          });
          
          console.log('API game endpoint response:', response.data);
          
          // Check if we got any response at all
          if (!response.data) {
            console.warn('Empty response from game API');
            continue; // Try again
          }
          
          // Check if connected to Redis
          if (response.data.redis === 'connected') {
            console.log('Redis connected successfully');
            
            // Force remove any demo mode flags
            if (typeof window !== 'undefined') {
              localStorage.removeItem('crashoutDemoMode');
            }
            
            return true;
          } else if (response.data.redis === 'disconnected' || response.data.status === 'error') {
            const errorMsg = response.data.error || 'Unknown Redis error';
            console.error('Redis error in game check:', errorMsg);
            
            // Don't show toast on every retry - only on final attempt
            if (attempt === 5) {
              toast.error(`Game connection error: ${errorMsg}`);
            }
            
            // Try a direct call to health endpoint before giving up
            if (attempt === 5) {
              try {
                const healthResponse = await axiosInstance.get('/api/health', {
                  headers: { 'Cache-Control': 'no-cache' }
                });
                
                console.log('Health check response:', healthResponse.data);
                
                if (healthResponse.data.redis?.status === 'connected') {
                  console.log('Redis connected via health endpoint');
                  return true;
                }
              } catch (healthErr) {
                console.error('Health endpoint failed:', healthErr);
              }
            }
            
            continue; // Try again with next attempt
          }
          
          // If we got here with a valid response but no explicit redis status,
          // let's try to infer connection from presence of game state data
          if (response.data.state || response.data.gameHistory || response.data.onlinePlayers) {
            console.log('Inferring Redis connection from valid game data');
            return true;
          }
          
          // Continue to next attempt if we're not sure
          console.log('Ambiguous response, continuing to next attempt...');
        } catch (attemptError) {
          console.warn(`Attempt ${attempt} failed:`, attemptError);
          
          // Wait before next retry, with increasing backoff
          const backoffMs = 1000 * attempt;
          console.log(`Waiting ${backoffMs}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
      
      // One final direct check to really make sure
      try {
        console.log('Making final direct check to /api/redis-status endpoint...');
        const finalCheck = await axios.get('/api/redis-status', {
          timeout: API_TIMEOUT_MS * 2
        });
        
        if (finalCheck.data && finalCheck.data.connected) {
          console.log('Final redis check succeeded');
          return true;
        }
      } catch (finalError) {
        console.error('Final redis check failed:', finalError);
      }
      
      // If we got here, all attempts failed
      console.error('All API connection attempts failed after retries');
      toast.error('Could not connect to game server. Starting in demo mode.');
      return false;
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

  // Add a new endpoint check function
  const checkEndpoint = useCallback(async (url: string, timeout: number = API_TIMEOUT_MS) => {
    try {
      const response = await axios.get(url, {
        timeout: timeout,
        headers: { 'Cache-Control': 'no-cache' }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error };
    }
  }, []);
  
  // Helper function to update game history with proper validation
  const addToGameHistory = (newEntries: GameHistoryEntry[]) => {
    console.log('Adding new entries to game history:', newEntries);
    
    // Filter out invalid entries
    const validEntries = newEntries.filter(entry => {
      // Ensure we have a valid value
      const value = typeof entry.value === 'string' ? 
        parseFloat(entry.value) : 
        (typeof entry.crashPoint === 'number' ? entry.crashPoint : 0);
      
      // Log invalid entries for debugging
      if (isNaN(value) || value <= 0) {
        console.warn('Filtering out invalid history entry:', entry);
        return false;
      }
      
      // Entry is valid
      return true;
    });
    
    // Format entries consistently
    const formattedEntries = validEntries.map(entry => {
      const value = typeof entry.value === 'string' ? 
        parseFloat(entry.value) : 
        (typeof entry.crashPoint === 'number' ? entry.crashPoint : 1.01);
      
      return {
        ...entry,
        value: value.toFixed(2),
        color: value >= 2.0 ? 'green' : 'red',
        timestamp: entry.timestamp || Date.now()
      };
    });
    
    // Only update if we have valid entries
    if (formattedEntries.length > 0) {
      setGameHistory(prev => [...formattedEntries, ...prev.slice(0, 49-formattedEntries.length)]);
    }
  };
  
  // More reliable fetch with retries
  const fetchGameStateWithRetry = async (retryCount = 0): Promise<any> => {
    try {
      const data = await getCurrentGameData();
      if (data) {
        // Check if we have a JSON parse error
        if (data.error && typeof data.error === 'string' && data.error.includes('JSON')) {
          console.warn(`JSON parse error in API response: ${data.error}`);
          
          // Increment issue counter for tracking persistent issues
          jsonErrorCountRef.current++;
          
          // If we still have retries, try again
          if (retryCount < 2) {
            console.log(`JSON parse error, retry ${retryCount + 1}/3`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchGameStateWithRetry(retryCount + 1);
          }
          
          // Check if we're getting persistent JSON errors (5+ in a row)
          if (jsonErrorCountRef.current > 5) {
            console.warn('Persistent JSON parsing errors detected, considering fallback to demo mode');
            
            // First try the health endpoint to validate Redis status
            try {
              const healthResponse = await axios.get('/api/health', {
                headers: { 'Cache-Control': 'no-cache' }
              });
              
              if (healthResponse.data && healthResponse.data.redis?.status === 'connected') {
                console.log('Redis is connected via health endpoint despite JSON errors');
                jsonErrorCountRef.current = 0; // Reset counter since Redis appears to be working
                // Use fallback data but don't switch to demo mode
                return data;
              }
            } catch (healthErr) {
              console.error('Health endpoint also failed:', healthErr);
            }
            
            // If health check also fails, consider switching to demo mode
            setRedisJsonErrorPersistent(true);
          }
          
          // If we're out of retries, use the fallback data
          return data;
        }
        
        // Reset error counters on successful request
        if (apiError.current) {
          console.log('API connection restored');
          setApiError(false);
        }
        
        // Reset JSON error counter on successful request without JSON errors
        if (jsonErrorCountRef.current > 0) {
          jsonErrorCountRef.current = 0;
        }
        
        // Reset persistent JSON error flag if set
        if (redisJsonErrorPersistent) {
          setRedisJsonErrorPersistent(false);
        }
        
        return data;
      }
      
      // If we get an empty response but still have retries left
      if (retryCount < 2) {
        console.log(`Empty game data, retry ${retryCount + 1}/3`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchGameStateWithRetry(retryCount + 1);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching game state:', error);
      
      // Retry a few times before giving up
      if (retryCount < 2) {
        console.log(`Request failed, retry ${retryCount + 1}/3`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchGameStateWithRetry(retryCount + 1);
      }
      
      setApiError(true);
      return null;
    }
  };
  
  // Modify setupPolling function to be more reliable
  const setupPolling = useCallback(() => {
    console.log("Setting up polling for game state");
    
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Make sure demo mode is completely disabled
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    
    if (demoTimerRef.current) {
      clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    
    // Track reconnection attempts to avoid flickering
    const reconnectAttemptsRef = { count: 0 };
    
    // Set initial state immediately to avoid flickering
    setIsConnected(true);
    setConnectionStatus('Connected');
    setOfflineMode(false);
    
    // Force remove demo mode flag from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crashoutDemoMode');
    }
    
    console.log('Online mode activated - synchronizing with server');
    
    // Function to fetch and update game state
    const fetchGameState = async () => {
      // If already in offline mode, don't attempt to reconnect
      if (offlineMode) {
        return;
      }
      
      try {
        // Check if we've detected persistent JSON errors and need to switch to demo mode
        if (redisJsonErrorPersistent) {
          console.log("Persistent JSON errors detected, switching to demo mode");
          if (!offlineMode) {
            startDemoMode();
          }
          return;
        }
        
        // Only show reconnecting status after multiple consecutive failures
        const handleConnectionIssue = () => {
          reconnectAttemptsRef.count++;
          
          if (reconnectAttemptsRef.count === 1) {
            // First failure - silently try to reconnect without UI change
            console.log("Connection issue detected, silently attempting to reconnect");
            // Don't update UI state yet
          } else if (reconnectAttemptsRef.count < 5) {
            // After second failure, show reconnecting status
            console.log(`Connection issue persists (attempt ${reconnectAttemptsRef.count}), showing reconnecting status`);
            setIsConnected(false);
            setConnectionStatus('Reconnecting...');
          } else {
            // After multiple failures, switch to demo mode
            console.log("Multiple reconnection attempts failed, switching to demo mode");
            startDemoMode();
          }
        };
        
        // Handle successful connection
        const handleSuccessfulConnection = () => {
          if (reconnectAttemptsRef.count > 0) {
            console.log("Connection restored after issues");
          }
          
          // Reset reconnection counter
          reconnectAttemptsRef.count = 0;
          
          // Update connection status if needed
          if (!isConnected) {
            setIsConnected(true);
            setConnectionStatus('Connected');
            toast.success("Connection restored! Back online.");
          }
        };
        
        if (apiError.current) {
          // If we had an API error, try to reconnect
          console.log("Attempting to reconnect to API after error");
          const isAvailable = await checkApiAvailability();
          
          if (!isAvailable) {
            handleConnectionIssue();
            return;
          } else {
            // Successfully reconnected
            setApiError(false);
            handleSuccessfulConnection();
          }
        }
        
        // Use the sync action to get comprehensive game data
        const response = await axios.post('/api/game', {
          action: 'sync',
          username: username || 'guest'
        }, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        const data = response.data;
        
        if (!data || !data.gameState) {
          console.warn('No game data received during polling');
          handleConnectionIssue();
          return;
        }
        
        // We got data successfully - handle restored connection
        handleSuccessfulConnection();
        
        // Check if we have a connection issue reported in the data
        if (data.success === false || data.gameState.error) {
          const errorMsg = data.gameState.error || 'Unknown Redis error';
          console.error('Redis connection issue during polling:', errorMsg);
          
          // Special handling for JSON parse errors - these might be recoverable
          if (errorMsg.includes('JSON')) {
            console.warn('JSON parse error detected - will retry in next poll cycle');
            setApiError(true);
            return;
          }
          
          // Try a direct health check before setting api error
          try {
            const healthResponse = await axios.get('/api/health', {
              headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (healthResponse.data && healthResponse.data.redis && 
                healthResponse.data.redis.status === 'connected') {
              console.log('Redis is actually connected via health endpoint - continuing');
              // Reset connection status to connected if health check passes
              handleSuccessfulConnection();
              return;
            }
          } catch (healthErr) {
            console.error('Health check failed during polling:', healthErr);
          }
          
          setApiError(true);
          handleConnectionIssue();
          return;
        }
        
        // Always update game history from server to ensure consistency across devices
        if (data.history && Array.isArray(data.history) && data.history.length > 0) {
          addToGameHistory(data.history);
        }
        
        // Check if the state has changed - store previous state for comparison
        const prevGameState = currentGameData.current?.gameState?.state;
        const dataChanged = !currentGameData.current || 
          JSON.stringify(data.gameState) !== JSON.stringify(currentGameData.current.gameState);
        
        // Update the current game data reference
        currentGameData.current = data;
        
        // Extract the game state for easier access
        const gameStateData = data.gameState;
        
        // Check if state is undefined and provide a fallback
        if (gameStateData.state === undefined) {
          console.warn('Server returned undefined game state, using INACTIVE as fallback');
          gameStateData.state = GAME_STATE.INACTIVE;
        }
        
        // Always update these critical fields regardless of change detection
        // to ensure consistency across all clients
        if (gameStateData.state) {
          console.log(`Setting game state to: ${gameStateData.state}`);
          
          // Use the mapping function for consistency
          const mappedState = mapBackendStateToFrontend(gameStateData.state);
          
          // Only update if state has changed to avoid unnecessary re-renders
          if (gameState !== mappedState) {
            console.log(`Mapped state from ${gameStateData.state} to enum value: ${mappedState}`);
            setGameState(mappedState);
          }
        }
        
        if (gameStateData.multiplier !== undefined) {
          setMultiplier(gameStateData.multiplier);
        } else if (gameStateData.state === GAME_STATE.ACTIVE) {
          // If in active state but no multiplier provided, use a default
          console.warn('No multiplier provided but game is active, using 1.0 as fallback');
          setMultiplier(1.0);
        }
        
        if (gameStateData.countdown !== undefined) {
          setCountdown(gameStateData.countdown);
        } else if (gameStateData.timeLeft !== undefined) {
          // Support alternative property name
          setCountdown(gameStateData.timeLeft);
        }
        
        // If player data is available, update player state
        if (data.playerData) {
          // Check if player has joined the current game
          if (data.playerData.joined && !playerJoined) {
            setPlayerJoined(true);
          }
          
          // Check if player has cashed out
          if (data.playerData.cashedOut && data.playerData.cashedOutAt && !cashedOutAt) {
            setCashedOutAt(data.playerData.cashedOutAt);
          }
        }
        
        // If significant data changed, process all state updates
        if (dataChanged) {
          console.log('Game state updated from server:', gameStateData.state);
          
          // Handle game state specific logic
          switch (gameStateData.state) {
            case GAME_STATE.COUNTDOWN:
              if (gameStateData.timeLeft) {
                setCountdown(gameStateData.timeLeft);
              }
              
              // Use JOIN_WINDOW_SECONDS for join window with fallback to gameStateData.joinWindowTimeLeft
              const joinWindowTime = gameStateData.joinWindowTimeLeft !== undefined ? 
                gameStateData.joinWindowTimeLeft : JOIN_WINDOW_SECONDS;
              
              if (joinWindowTime && !joinWindowRef.current) {
                startJoinWindowTimer(joinWindowTime);
              }
              
              if (gameStateData.players) {
                setPlayersInGame(gameStateData.players.length);
                setPlayers(gameStateData.players);
              }
              
              // Always allow placing bets during countdown state
              setCanPlaceBet(true);
              setIsPlayDisabled(false);
              setIsCashoutDisabled(true);
              
              // Ensure join window is open
              setJoinWindowTimeLeft(joinWindowTime);
              break;
              
            case GAME_STATE.ACTIVE:
              if (gameStateData.multiplier) {
                setMultiplier(gameStateData.multiplier);
              }
              
              // Show game started animation if we just transitioned to running
              if (prevGameState === GAME_STATE.COUNTDOWN) {
                setShowGameStartedImage(true);
                setTimeout(() => setShowGameStartedImage(false), 2000);
              }
              
              setIsCashoutDisabled(!playerJoined || cashedOutAt !== null);
              setCanPlaceBet(false); // Can't place bet during active game
              break;
              
            case GAME_STATE.CRASHED:
              // Handle game crash
              if (gameStateData.crashPoint) {
                playSound('crash');
                
                // Create a new history entry if it doesn't exist already
                const crashPointStr = gameStateData.crashPoint.toString();
                const existingEntry = gameHistory.find(entry => 
                  entry.value === crashPointStr && 
                  Math.abs(entry.timestamp - Date.now()) < 5000
                );
                
                if (!existingEntry) {
                  const newEntry: GameHistoryEntry = {
                    value: crashPointStr,
                    color: parseFloat(crashPointStr) >= 2.0 ? 'green' : 'red',
                    timestamp: Date.now(),
                    crashPoint: gameStateData.crashPoint
                  };
                  
                  // Add to history
                  addToGameHistory([newEntry]);
                }
              }
              
              // Check if player lost
              if (playerJoined && cashedOutAt === null) {
                toast.error(`Game crashed at ${gameStateData.crashPoint}x. You lost ${betAmount} Farm Coins.`);
                // Show loss animation
                setShowLossImage(true);
                setTimeout(() => setShowLossImage(false), 3000);
              }
              
              setCanPlaceBet(false);
              setIsCashoutDisabled(true);
              break;
              
            case GAME_STATE.INACTIVE:
              // Game is inactive, waiting for next round
              if (gameStateData.nextGameTime) {
                setNextGameStartTime(gameStateData.nextGameTime);
              }
              
              // Only reset player's game status if the game just ended
              if (prevGameState === GAME_STATE.CRASHED || prevGameState === GAME_STATE.ACTIVE) {
                setPlayerJoined(false);
                setCashedOutAt(null);
              }
              
              setCanPlaceBet(false);
              setIsCashoutDisabled(true);
              break;
          }
          
          // Update online players
          if (data.onlinePlayers) {
            setOnlinePlayersCount(data.onlinePlayers);
          }
          
          // Update recent cashouts
          if (data.cashouts) {
            setRecentCashouts(data.cashouts);
          }
        }
      } catch (error) {
        console.error('Error in polling loop:', error);
        setApiError(true);
        
        // Use the same reconnection handling for any errors
        reconnectAttemptsRef.count++;
        
        if (reconnectAttemptsRef.count < 5) {
          setIsConnected(false);
          setConnectionStatus('Reconnecting...');
        } else {
          console.log(`Max reconnection attempts (${reconnectAttemptsRef.count}) reached, switching to demo mode`);
          if (!offlineMode) {
            startDemoMode();
          }
        }
      }
    };
    
    // Do an initial fetch right away
    fetchGameState().then(() => {
      toast.success('Connected to game server! Play with other players in real-time.');
    }).catch(err => {
      console.error('Initial game state fetch failed:', err);
      // Show error toast but don't immediately go to demo mode - let the polling cycle handle reconnection
      toast.error('Connection issue detected. Attempting to reconnect...');
      setIsConnected(false);
      setConnectionStatus('Reconnecting...');
    });
    
    // Use a more reasonable polling rate to avoid constant reloading
    const onlinePollingRate = 3000; // Poll every 3 seconds for online mode
    console.log(`Setting up polling at ${onlinePollingRate}ms intervals`);
    
    // Start polling at the specified rate
    pollingIntervalRef.current = setInterval(fetchGameState, onlinePollingRate);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [
    checkApiAvailability,
    getCurrentGameData, 
    offlineMode, 
    setApiError, 
    startDemoMode,
    addToGameHistory,
    playerJoined, 
    cashedOutAt, 
    betAmount, 
    playSound, 
    startJoinWindowTimer,
    isConnected,
    setIsConnected,
    setConnectionStatus,
    setOfflineMode,
    setGameState,
    setCountdown,
    setPlayersInGame,
    setPlayers,
    setCanPlaceBet,
    setIsCashoutDisabled,
    setMultiplier,
    setShowGameStartedImage,
    setGameHistory,
    setShowLossImage,
    setNextGameStartTime,
    setPlayerJoined,
    setCashedOutAt,
    setOnlinePlayersCount,
    setRecentCashouts,
    redisJsonErrorPersistent,
    setRedisJsonErrorPersistent,
    gameState,
    gameHistory,
    username
  ]);

  // Add back the main setup effect after the reconnection effect
  useEffect(() => {
    console.log('CrashoutGame component mounted - Running setup effect');
    
    // Mark as mounted to prevent useEffect from running twice in development mode
    if (didMountRef.current) {
      console.log('[Dev Only/StrictMode] Skipping duplicate setup effect run.');
      return;
    }
    didMountRef.current = true;
    
    // Set default username from localStorage or generate a new one
    const storedUsername = localStorage.getItem('crashoutUsername');
    if (!storedUsername) {
      const randomUsername = 'Player' + Math.floor(Math.random() * 10000);
      localStorage.setItem('crashoutUsername', randomUsername);
      setUsername(randomUsername);
    } else {
      setUsername(storedUsername);
    }
    
    // Initialize audio with shared instances
    initializeAudio();

    // Never force demo mode - always try online first
    console.log("Always trying to connect to online mode first");
    
    // Increase number of retries before falling back to demo mode
    const MAX_CONNECTION_ATTEMPTS = 5;
    let connectionAttempts = 0;
    
    const tryConnection = async () => {
      connectionAttempts++;
      console.log(`Connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`);
      
      // Try to connect to server and check API availability
      try {
        const isAvailable = await checkApiAvailability();
        if (isAvailable) {
          console.log("API available, starting online mode");
          // Make sure offline mode is false before setting up polling
          setOfflineMode(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('crashoutDemoMode');
          }
          setupPolling();
        } else if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
          // Try again with exponential backoff
          const delay = Math.min(2000 * Math.pow(1.5, connectionAttempts - 1), 10000);
          console.log(`Retrying connection in ${Math.round(delay/1000)}s`);
          setTimeout(tryConnection, delay);
        } else {
          console.log("Maximum connection attempts reached, starting demo mode");
          startDemoMode();
        }
      } catch (error) {
        console.error("API check error:", error);
        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
          const delay = Math.min(2000 * Math.pow(1.5, connectionAttempts - 1), 10000);
          setTimeout(tryConnection, delay);
        } else {
          console.log("Maximum connection attempts reached after errors, starting demo mode");
          startDemoMode();
        }
      }
    };
    
    // Start connection attempts
    tryConnection();

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
    
    // Always update text content with current value
    const valueFormatted = `${value.toFixed(2)}x`;
    multiplierTextRef.current.textContent = valueFormatted;
    
    // Log to ensure updates are happening
    console.log(`Updating UI multiplier to ${valueFormatted}`);
    
    // Simplified color logic - just three colors to reduce calculations
    const textColor = 
      gameState === GameState.CRASHED ? "#ff0000" : // Red when crashed
      value < 2 ? "#0f0" : // Green
      value < 10 ? "#ffff00" : // Yellow
      "#ff8800"; // Orange
    
    // Update color
    multiplierTextRef.current.style.color = textColor;
    
    // Even more drastically simplified size logic - only 3 size steps
    const baseSize = 6;
    const sizeClass = value < 3 ? `${baseSize}rem` : 
                     value < 10 ? `${baseSize * 1.4}rem` : 
                     `${baseSize * 1.8}rem`;
    
    multiplierTextRef.current.style.fontSize = sizeClass;
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
  
  // Handle placing a bet with martingale system support
  const handlePlay = useCallback(async () => {
    if (offlineMode) {
      // Handle offline bet with martingale option
      if (!canPlaceBet || isPlayDisabled) {
        toast.warning("Cannot place demo bet now.");
        return;
      }
      
      // Calculate bet amount based on martingale system if enabled
      let bet = parseFloat(betAmount);
      if (useMartingale && lossStreak > 0 && previousBets.length > 0) {
        // Calculate martingale bet
        bet = calculateMartingaleBet(previousBets, bet);
        // Update UI to match the calculated bet
        setBetAmount(bet.toString());
      }
      
      if (isNaN(bet) || bet <= 0) { 
        toast.error("Invalid bet amount."); 
        return; 
      }
      
      // Store the bet for martingale tracking
      setPreviousBets(prev => [...prev, bet]);

      setPlayerJoined(true);
      setIsPlayDisabled(true);
      setIsCashoutDisabled(false);
      toast.info(`Demo bet placed: ${bet} coins${useMartingale ? ' (Martingale active)' : ''}`);
      return;
    }

    // Ensure user has a username
    if (!username || username.trim() === '') {
      const randomUsername = 'Player' + Math.floor(Math.random() * 10000);
      setUsername(randomUsername);
      localStorage.setItem('crashoutUsername', randomUsername);
      toast.info(`Using random username: ${randomUsername}`);
    }

    // Log the values for debugging
    console.log("Attempting to place bet with:", {
      canPlaceBet,
      isConnected,
      joinWindowTimeLeft,
      gameState,
      isPlayDisabled,
      username: username || 'not set',
      useMartingale,
      lossStreak,
      previousBets
    });

    if (!canPlaceBet || !isConnected || isPlayDisabled) {
      toast.warning("Cannot place bet now. Ensure you are connected.");
      return;
    }

    // Calculate bet amount with martingale if enabled
    let bet = parseFloat(betAmount);
    if (useMartingale && lossStreak > 0 && previousBets.length > 0) {
      // Calculate martingale bet and update UI
      bet = calculateMartingaleBet(previousBets, parseFloat(betAmount));
      setBetAmount(bet.toString());
    }
    
    const cashoutTarget = parseFloat(autoCashout);

    if (isNaN(bet) || bet <= 0) { toast.error("Invalid bet amount."); return; }
    if (isNaN(cashoutTarget) || cashoutTarget < 1.01) { toast.error("Invalid auto cashout multiplier (must be >= 1.01)."); return; }

    // Store the bet for martingale tracking
    setPreviousBets(prev => [...prev, bet]);
    setIsPlayDisabled(true);
    toast.info(`Placing bet: ${bet} coins${useMartingale ? ' (Martingale active)' : ''}`);
    
    // Create a function that we can retry
    const attemptPlaceBet = async (retryCount = 0): Promise<boolean> => {
      try {
        console.log(`Sending bet to server (attempt ${retryCount + 1}):`, {
          username,
          betAmount: bet,
          autoCashout: cashoutTarget
        });

        const response = await axios.post('/api/game', {
          action: 'placeBet',
          username: username || 'Guest' + Math.floor(Math.random() * 1000),
          betAmount: bet,
          autoCashout: cashoutTarget
        });

        console.log("Bet response:", response.data);

        if (response.data.success) {
          setPlayerJoined(true);
          setIsPlayDisabled(true);
          setIsCashoutDisabled(false);
          toast.success("Bet placed successfully!");
          return true;
        } else {
          console.warn(`Bet failed: ${response.data.message}`);
          
          // Check if this is a timing issue we can retry
          if (response.data.message?.includes("Game is not in join phase") && retryCount < 2) {
            console.log("This appears to be a timing issue, will retry in 500ms");
            return false; // Signal for retry
          } else {
            // Other error that we can't auto-retry
            setIsPlayDisabled(false);
            toast.error(response.data.message || "Failed to place bet");
            return true; // We're done trying
          }
        }
      } catch (error) {
        console.error('Error placing bet:', error);
        
        // Check if we should retry
        if (retryCount < 2) {
          console.log(`Network error placing bet, will retry (attempt ${retryCount + 1})`);
          return false; // Signal for retry
        }
        
        setIsPlayDisabled(false);
        
        // Show more detailed error message
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          toast.error(`Error: ${error.response.data.message}`);
        } else {
          toast.error("Error communicating with server. Please try again.");
        }
        return true; // We're done trying
      }
    };
    
    // Try to place the bet with retries
    let attempt = 0;
    let done = false;
    
    while (!done && attempt < 3) {
      done = await attemptPlaceBet(attempt);
      if (!done) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500));
        attempt++;
      }
    }
    
    if (!done) {
      // If we exhausted all retries
      setIsPlayDisabled(false);
      toast.error("Unable to place bet after multiple attempts. Please try again.");
    }
  }, [
    canPlaceBet, isConnected, betAmount, autoCashout, joinWindowTimeLeft, isPlayDisabled, offlineMode, gameState, username,
    // Add dependencies for gambling enhancements
    useMartingale, lossStreak, previousBets, setPreviousBets, setBetAmount
  ]);

  // Handle cashing out with enhanced gambling features
  const handleCashout = useCallback(async () => {
    if (offlineMode) {
      // Handle offline cashout with streak tracking
      if (!playerJoined || gameState !== GameState.RUNNING || isCashoutDisabled || cashedOutAt !== null) {
          toast.warning("Cannot cashout demo game now.");
          return;
      }
      const winAmount = parseFloat(betAmount) * multiplier;
      setCashedOutAt(multiplier);
      setIsCashoutDisabled(true);
      
      // Play appropriate win sound based on multiplier
      const soundType = playWinSound(multiplier);
      playSound(soundType);
      
      // Update win streak and reset loss streak
      setWinStreak(prev => prev + 1);
      setLossStreak(0);
      
      // Update highest win if applicable
      if (winAmount > highestWin) {
        setHighestWin(winAmount);
      }
      
      // Update total won
      setTotalWon(prev => prev + winAmount);
      
      // Show streak effect for hot streaks
      if (winStreak >= 2) {
        setShowHotStreak(true);
        setStreakEffect('win');
        setTimeout(() => setShowHotStreak(false), 3000);
      }
      
      // Use the correct number of arguments
      addFarmCoins(winAmount);
      toast.success(`Demo Cashout at ${multiplier.toFixed(2)}x! Won ${winAmount.toFixed(2)} coins!`);

      if (demoIntervalRef.current !== null) {
          clearInterval(demoIntervalRef.current);
          demoIntervalRef.current = null;
      }
      return;
    }

    console.log("Cashout requested with state:", {
      playerJoined,
      gameState,
      isConnected,
      isCashoutDisabled,
      cashedOutAt,
      multiplier,
      winStreak,
      lossStreak
    });

    if (!playerJoined || gameState !== GameState.RUNNING || !isConnected || isCashoutDisabled || cashedOutAt !== null) {
      toast.warning("Cannot cash out now.");
      return;
    }

    setIsCashoutDisabled(true);
    toast.info("Cashing out...");

    // Create a function that we can retry
    const attemptCashout = async (retryCount = 0): Promise<boolean> => {
      try {
        console.log(`Sending cashout to server (attempt ${retryCount + 1}) for ${username} at multiplier ${multiplier.toFixed(2)}`);
        
        const response = await axios.post('/api/game', {
          action: 'cashout',
          username
        });

        console.log("Cashout response:", response.data);

        if (response.data.success) {
          setCashedOutAt(response.data.multiplier);
          
          // Play win sound based on multiplier
          const soundType = playWinSound(response.data.multiplier);
          playSound(soundType);
          
          // Update win streak and reset loss streak
          setWinStreak(prev => prev + 1);
          setLossStreak(0);
          
          if (response.data.winAmount) {
            // Update stats
            if (response.data.winAmount > highestWin) {
              setHighestWin(response.data.winAmount);
            }
            setTotalWon(prev => prev + response.data.winAmount);
            
            // Show hot streak effect
            if (winStreak >= 2) {
              setShowHotStreak(true);
              setStreakEffect('win');
              setTimeout(() => setShowHotStreak(false), 3000);
            }
            
            addFarmCoins(response.data.winAmount);
            toast.success(`Cashed out at ${response.data.multiplier.toFixed(2)}x! Won ${response.data.winAmount.toFixed(2)} coins!`);
          } else {
            toast.success(`Cashed out at ${response.data.multiplier.toFixed(2)}x!`);
          }
          return true;
        } else {
          console.warn(`Cashout failed: ${response.data.message}`);
          
          // Check if this is a timing issue we can retry
          if (response.data.message === "Cannot cash out - game is not active." && retryCount < 2) {
            console.log("This appears to be a timing issue, will retry cashout in 200ms");
            return false; // Signal for retry
          } else {
            // Other error that we can't auto-retry
            setIsCashoutDisabled(!playerJoined);
            toast.error(response.data.message || "Failed to cash out");
            return true; // We're done trying
          }
        }
      } catch (error) {
        console.error('Error cashing out:', error);
        
        // Check if we should retry
        if (retryCount < 2) {
          console.log(`Network error cashing out, will retry (attempt ${retryCount + 1})`);
          return false; // Signal for retry
        }
        
        setIsCashoutDisabled(!playerJoined);
        
        // Use proper TypeScript type checking
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          toast.error(`Error: ${error.response.data.message}`);
        } else {
          toast.error("Error communicating with server. Please try again.");
        }
        return true; // We're done trying
      }
    };
    
    // Try to cashout with retries
    let attempt = 0;
    let done = false;
    
    while (!done && attempt < 3) {
      done = await attemptCashout(attempt);
      if (!done) {
        // Wait before retry - shorter wait for cashout since timing is more critical
        await new Promise(resolve => setTimeout(resolve, 200));
        attempt++;
      }
    }
    
    if (!done) {
      // If we exhausted all retries
      setIsCashoutDisabled(!playerJoined);
      toast.error("Unable to cash out after multiple attempts. Please try again.");
    }
  }, [
    playerJoined, gameState, isConnected, isCashoutDisabled, cashedOutAt, offlineMode, multiplier, betAmount, addFarmCoins, playSound, username,
    // Add dependencies for gambling enhancements
    winStreak, setWinStreak, lossStreak, setLossStreak, highestWin, setHighestWin, setTotalWon, setShowHotStreak, setStreakEffect
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

  // Fix the multiplier display updating when game is running
  useEffect(() => {
    // Skip if offline
    if (offlineMode) return;
    
    // Only handle multiplier update logic when in RUNNING state
    if (gameState !== GameState.RUNNING) return;
    
    console.log('Setting up multiplier update interval for active game');
    
    // Set up interval to update multiplier locally between server updates
    // This provides smoother animation than waiting for API polling
    const multiplierInterval = setInterval(() => {
      if (gameState !== GameState.RUNNING) {
        // Clear if no longer in running state
        clearInterval(multiplierInterval);
        return;
      }
      
      // Calculate time since game started
      const startTime = currentGameData.current?.gameState?.startTime || 0;
      if (!startTime) return;
      
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      
      // Calculate multiplier using the same formula as the backend
      const growthRate = 0.05;
      const currentMultiplier = parseFloat((1.0 * Math.exp(growthRate * elapsedSeconds)).toFixed(2));
      
      console.log(`Local multiplier update: ${currentMultiplier.toFixed(2)}x (elapsed: ${elapsedSeconds.toFixed(1)}s)`);
      
      // Update multiplier
      setMultiplier(currentMultiplier);
      
      // Update UI display - call this directly to ensure it updates
      if (multiplierTextRef.current) {
        updateMultiplierDisplay(currentMultiplier);
      }
    }, 100); // Update every 100ms for smooth animation
    
    return () => {
      clearInterval(multiplierInterval);
    };
  }, [gameState, offlineMode, updateMultiplierDisplay]);

  // Update game loss handling to include streak tracking
  useEffect(() => {
    // Handle game crash events
    if (gameState === GameState.CRASHED && playerJoined && cashedOutAt === null) {
      // Player lost their bet
      const lostAmount = parseFloat(betAmount);
      
      // Play appropriate loss sound
      const soundType = playLoseSound(lostAmount);
      playSound(soundType);
      
      // Update loss streak and reset win streak
      setLossStreak(prev => prev + 1);
      setWinStreak(0);
      
      // Update total lost
      setTotalLost(prev => prev + lostAmount);
      
      // Show cold streak effect
      if (lossStreak >= 2) {
        setShowHotStreak(true);
        setStreakEffect('loss');
        setTimeout(() => setShowHotStreak(false), 3000);
      }
    }
  }, [gameState, playerJoined, cashedOutAt, betAmount, playSound]);

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
            isConnected ? 'text-green-500' :
            connectionStatus === 'Reconnecting...' ? 'text-yellow-500' :
            connectionStatus === 'Disconnected' ? 'text-gray-500' :
            offlineMode ? 'text-yellow-500' :
            'text-red-500'
          }`}>
            {isConnected ? `Online (${onlinePlayersCount} players)` :
             connectionStatus === 'Reconnecting...' ? 'Reconnecting...' :
             connectionStatus === 'Disconnected' ? 'Disconnected' :
             offlineMode ? 'Demo Mode' :
             'Connection Error'
            }
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
                  : (connectionStatus === 'Reconnecting...' ? "Reconnecting..." : "Not playing")}
                    {offlineMode && playerJoined && <span className="text-xs bg-yellow-500 px-1 rounded ml-1">Demo Bet</span>}
              </div>
            )}
            
            {/* Add streak indicator */}
            {(winStreak > 0 || lossStreak > 0) && (
              <div className={`absolute top-16 left-0 right-0 px-3 py-1 text-center font-semibold text-xs z-10
                ${winStreak > 0 ? 'bg-green-700' : 'bg-red-700'} transition-colors duration-300`}>
                {winStreak > 0 ? 
                  `🔥 Win Streak: ${winStreak} ${winStreak >= 3 ? '- HOT! 🔥' : ''}` : 
                  `❄️ Loss Streak: ${lossStreak} ${lossStreak >= 3 ? '- DUE FOR A WIN? 🍀' : ''}`}
              </div>
            )}
            
            {/* Hot/cold streak effect overlay */}
            {showHotStreak && (
              <div className={`absolute inset-0 z-20 bg-gradient-to-br ${
                streakEffect === 'win' ? 'from-green-500/30 to-yellow-500/30' : 'from-red-500/30 to-purple-500/30'
              } animate-pulse`}>
                {streakEffect === 'win' && winStreak >= 3 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-yellow-300 text-4xl font-bold animate-bounce">HOT STREAK! 🔥</div>
                  </div>
                )}
                {streakEffect === 'loss' && lossStreak >= 3 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-red-300 text-4xl font-bold animate-pulse">COLD STREAK! ❄️</div>
                  </div>
                )}
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
              {/* Add Martingale system toggle */}
              <div className="flex items-center mt-2 text-white text-sm">
                <input
                  type="checkbox"
                  id="martingale"
                  checked={useMartingale}
                  onChange={() => setUseMartingale(!useMartingale)}
                  className="mr-2"
                />
                <label htmlFor="martingale" className="cursor-pointer">
                  Use Martingale System (Double after loss)
                </label>
                {useMartingale && lossStreak > 0 && (
                  <span className="ml-2 text-yellow-400">
                    Next bet will be: {calculateMartingaleBet(previousBets, parseFloat(betAmount)).toFixed(0)}
                  </span>
                )}
              </div>
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
              {/* Add stats display */}
              <div className="mt-2 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Highest Win:</span>
                  <span className="text-green-400">{highestWin.toFixed(2)} coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Won:</span>
                  <span className="text-green-400">{totalWon.toFixed(2)} coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Lost:</span>
                  <span className="text-red-400">{totalLost.toFixed(2)} coins</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="farm-coins mb-4 text-center">
            <p className="text-lg">Available Farm Coins: <span className="font-bold">{farmCoins}</span></p>
          </div>
          
          <div className="game-buttons mt-4 grid grid-cols-2 gap-4">
            <button 
              onClick={handlePlay}
              disabled={
                isPlayDisabled || 
                !canPlaceBet || 
                (!offlineMode && !isConnected)
              }
              className={`py-3 text-lg font-bold rounded transition-all duration-300 ${
                isPlayDisabled || !canPlaceBet || (!offlineMode && !isConnected)
                  ? "bg-green-800 opacity-50 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700 hover:scale-[1.02]"
              }`}
            >
              {offlineMode ? (canPlaceBet ? "Place Demo Bet" : "Demo Wait") :
              gameState === GameState.WAITING ? (joinWindowTimeLeft > 0 ? `Place Bet (${joinWindowTimeLeft}s)` : "Join Window Closed") :
              (canPlaceBet ? "Place Bet" : "Wait for Next Round")}
              {useMartingale && lossStreak > 0 && canPlaceBet && (
                <span className="block text-xs">Martingale: {calculateMartingaleBet(previousBets, parseFloat(betAmount)).toFixed(0)} coins</span>
              )}
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
                  // Ensure we always have a valid numeric value
                  const valueString = typeof entry.value === 'string' ? entry.value : String(entry.value ?? '0');
                  const value = parseFloat(valueString) || 0;
                  
                  // Log the entry for debugging
                  if (index === 0) {
                    console.log('Latest history entry:', entry);
                  }
                  
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
                          ${value <= 0 ? "bg-gray-700" : // Use gray for invalid values 
                            entry.color === "green" 
                            ? "bg-gradient-to-br from-emerald-400 to-green-600" 
                            : "bg-gradient-to-br from-red-400 to-red-700"}
                        `}
                        style={{ 
                          color: "#fff",
                          textShadow: "1px 1px 2px rgba(0,0,0,0.5)"
                        }}
                      >
                        {value <= 0 ? "N/A" : value.toFixed(2) + "x"}
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