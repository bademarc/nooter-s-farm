// components/crashout-game.tsx (modified for online play)

"use client";

import React, { useState, useEffect, useRef, useContext } from 'react';
import { GameContext } from '@/context/game-context';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import './crashout/crashout-styles.css';
import { io, Socket } from 'socket.io-client';

// Constants for game states (same as server)
const GAME_STATE = {
  INACTIVE: "inactive",
  COUNTDOWN: "countdown",
  ACTIVE: "active",
  CRASHED: "crashed",
  CASHED_OUT: "cashed_out",
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
  const [gameHistory, setGameHistory] = useState<Array<{value: string, color: string}>>([]);
  
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
  
  // Online specific state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlinePlayersCount, setOnlinePlayersCount] = useState<number>(0);
  const [playersInGame, setPlayersInGame] = useState<number>(0);
  const [recentCashouts, setRecentCashouts] = useState<Array<{username: string, multiplier: number, winning: number}>>([]);
  const [username, setUsername] = useState<string>(() => {
    // Generate a random username or get from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('crashoutUsername') || `Player-${Math.floor(Math.random() * 10000)}`;
    }
    return `Player-${Math.floor(Math.random() * 10000)}`;
  });
  const [serverConnected, setServerConnected] = useState<boolean>(false);
  
  // Connect to server
  useEffect(() => {
    // Connect to the Socket.io server
    const newSocket = io('http://localhost:3001'); // Use your server URL
    
    newSocket.on('connect', () => {
      console.log('Connected to game server');
      setServerConnected(true);
      
      // Send username
      newSocket.emit('updateUsername', username);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from game server');
      setServerConnected(false);
    });
    
    // Game state updates
    newSocket.on('gameStateUpdate', (data) => {
      console.log('Game state update:', data);
      setGameState(data.state);
      
      if (data.multiplier) {
        setMultiplier(data.multiplier);
        updateMultiplierDisplay(data.multiplier);
      }
      
      if (data.countdown !== undefined) {
        setCountdown(data.countdown);
      }
      
      if (data.playersJoined !== undefined) {
        setPlayersInGame(data.playersJoined);
      }
      
      if (data.history) {
        setGameHistory(data.history);
      }
      
      // Update UI based on game state
      if (data.state === GAME_STATE.INACTIVE || data.state === GAME_STATE.COUNTDOWN) {
        setCanPlaceBet(true);
        setShowLossImage(false);
      } else if (data.state === GAME_STATE.ACTIVE) {
        setCanPlaceBet(false);
        setShowGameStartedImage(true);
      }
    });
    
    // Countdown updates
    newSocket.on('countdown', (count) => {
      setCountdown(count);
      if (countdownTextRef.current) {
        countdownTextRef.current.textContent = count.toString();
      }
      
      if (count > 0) {
        if (countdownOverlayRef.current) {
          countdownOverlayRef.current.classList.remove("hidden");
        }
      } else {
        if (countdownOverlayRef.current) {
          countdownOverlayRef.current.classList.add("hidden");
        }
      }
    });
    
    // Multiplier updates
    newSocket.on('multiplierUpdate', (value) => {
      setMultiplier(value);
      updateMultiplierDisplay(value);
    });
    
    // Game crashed
    newSocket.on('gameCrashed', (data) => {
      setGameState(GAME_STATE.CRASHED);
      setShowGameStartedImage(false);
      setShowLossImage(true);
      setIsCashoutDisabled(true);
      
      // Play crash sound
      playSound('crash');
      
      // Update display
      if (multiplierTextRef.current) {
        multiplierTextRef.current.style.color = "#f00";
        multiplierTextRef.current.textContent = `${data.crashPoint.toFixed(2)}x`;
      }
      
      // Show crash message
      if (gameResultRef.current) {
        gameResultRef.current.textContent = `Game crashed at ${data.crashPoint.toFixed(2)}x!`;
        gameResultRef.current.style.color = "#f00";
      }
      
      // Update history
      if (data.history) {
        setGameHistory(data.history);
      }
      
      // Start video
      if (lossVideoRef.current) {
        lossVideoRef.current.currentTime = 0;
        lossVideoRef.current.play().catch(e => {
          console.warn("Could not play crash video:", e);
        });
      }
      
      // Reset player joined state
      setPlayerJoined(false);
    });
    
    // Bet accepted
    newSocket.on('betAccepted', (data) => {
      setPlayerJoined(true);
      toast.success(`Bet placed: ${data.betAmount} coins`);
      
      // Update coins
      addFarmCoins(-data.betAmount);
    });
    
    // Cashout success
    newSocket.on('cashoutSuccess', (data) => {
      setCashedOutAt(data.multiplier);
      setGameState(GAME_STATE.CASHED_OUT);
      setIsCashoutDisabled(true);
      
      // Play sound
      if (data.multiplier >= 5) {
        playSound('win');
      } else {
        playSound('cashout');
      }
      
      // Show message
      toast.success(`Cashed out at ${data.multiplier.toFixed(2)}x! Won ${data.winnings.toFixed(2)} coins`);
      
      if (gameResultRef.current) {
        gameResultRef.current.textContent = `You cashed out at ${data.multiplier.toFixed(2)}x! You won ${data.winnings.toFixed(2)} coins`;
        gameResultRef.current.style.color = "#0f0";
      }
      
      // Update balance
      addFarmCoins(data.winnings);
    });
    
    // Game lost
    newSocket.on('gameLost', (data) => {
      if (playerJoined) {
        toast.error(`Game crashed at ${data.crashPoint.toFixed(2)}x! Lost ${data.betAmount.toFixed(2)} coins`);
      }
    });
    
    // Player joined
    newSocket.on('playerJoined', (data) => {
      toast.info(`${data.username} joined with ${data.betAmount} coins`);
    });
    
    // Player cashed out
    newSocket.on('playerCashedOut', (data) => {
      toast.info(`${data.username} cashed out at ${data.multiplier.toFixed(2)}x (${data.winning.toFixed(2)} coins)`);
      
      // Add to recent cashouts
      setRecentCashouts(prev => {
        const newCashouts = [data, ...prev];
        if (newCashouts.length > 5) newCashouts.pop();
        return newCashouts;
      });
    });
    
    // Error messages
    newSocket.on('error', (data) => {
      toast.error(data.message);
    });
    
    // Save socket instance
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // Save username to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crashoutUsername', username);
    }
  }, [username]);
  
  // Helper: Update multiplier display
  const updateMultiplierDisplay = (value: number) => {
    if (!multiplierTextRef.current) return;
    
    multiplierTextRef.current.textContent = `${value.toFixed(2)}x`;
    
    // Update color based on value
    let textColor;
    if (gameState === GAME_STATE.CASHED_OUT) {
      textColor = value < 5 ? "#88ddff" : "#ffaa00";
    } else {
      if (value < 1.5) {
        textColor = "#0f0"; // Green
      } else if (value < 3) {
        textColor = "#00ffff"; // Cyan
      } else if (value < 10) {
        textColor = "#ffff00"; // Yellow
      } else if (value < 20) {
        textColor = "#ff8800"; // Orange
      } else {
        textColor = "#ff00ff"; // Magenta for high values
      }
    }
    
    multiplierTextRef.current.style.color = textColor;
    
    // Increase text size for visual excitement
    const baseSize = 6;
    const sizeMultiplier = Math.min(3, 1 + (value / 50));
    multiplierTextRef.current.style.fontSize = `${baseSize * sizeMultiplier}rem`;
  };
  
  // Handle bet placement
  const handlePlay = () => {
    if (!socket || !serverConnected) {
      toast.error("Not connected to game server!");
      return;
    }
    
    // Validate bet amount
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
    
    // Check if we're accepting bets
    if (!canPlaceBet) {
      toast.error("Game already in progress! Wait for next round to bet.");
      return;
    }
    
    // Get auto cashout value
    const autoCashoutValue = parseFloat(autoCashout);
    const autoCashoutAt = !isNaN(autoCashoutValue) && autoCashoutValue > 1 ? autoCashoutValue : null;
    
    // Send bet to server
    socket.emit('placeBet', {
      betAmount: betAmountValue,
      autoCashoutAt
    });
  };
  
  // Handle manual cashout
  const handleCashout = () => {
    if (!socket || !serverConnected) {
      toast.error("Not connected to game server!");
      return;
    }
    
    if (playerJoined && gameState === GAME_STATE.ACTIVE) {
      socket.emit('cashout');
    } else {
      if (!playerJoined) {
        toast.error("You haven't joined this round!");
      } else if (gameState !== GAME_STATE.ACTIVE) {
        toast.error("Game not active!");
      }
    }
  };
  
  // Change username
  const changeUsername = (newName: string) => {
    if (!socket || !serverConnected) return;
    
    if (newName.length >= 3 && newName.length <= 20) {
      socket.emit('updateUsername', newName);
      setUsername(newName);
    } else {
      toast.error("Username must be between 3 and 20 characters");
    }
  };
  
  // Rest of your existing code (sound handling, etc.)
  // ...
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2 flex justify-between">
        <span>Farm Crashout Game</span>
        <span className={`text-sm ${serverConnected ? 'text-green-500' : 'text-red-500'}`}>
          {serverConnected ? 'Online' : 'Offline'} - Players: {onlinePlayersCount}
        </span>
      </h2>
      
      {/* Game display */}
      <div className="container mx-auto p-4 max-w-2xl bg-[#111] rounded-lg shadow-xl">
        <div className="game-container">            
          <div className="game-display relative h-80 bg-[#222] rounded-lg mb-6 overflow-hidden">
            {/* Game state indicator */}
            <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white px-3 py-1 text-center font-semibold z-10">
              {gameState === GAME_STATE.INACTIVE && nextGameStartTime && (
                <div>Next game starting soon...</div>
              )}
              {gameState === GAME_STATE.COUNTDOWN && (
                <div>Game starting soon... Players: {playersInGame}</div>
              )}
              {gameState === GAME_STATE.ACTIVE && (
                <div>{playerJoined ? "Game in progress - Good luck!" : "Game in progress - Join next round!"}</div>
              )}
              {gameState === GAME_STATE.CRASHED && (
                <div>Game over! Next round soon.</div>
              )}
            </div>
            
            {/* Player status indicator */}
            {gameState !== GAME_STATE.INACTIVE && (
              <div className={`absolute top-8 left-0 right-0 px-3 py-1 text-center font-semibold text-sm z-10 ${playerJoined ? 'bg-green-600' : 'bg-red-600'}`}>
                {playerJoined ? "You are playing this round" : "Not playing this round"}
              </div>
            )}
            
            {/* Game visuals */}
            {/* ... existing game visuals code ... */}
            
            {/* Multiplier text */}
            <div ref={multiplierTextRef} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-white z-50 multiplier-text">1.00x</div>
            
            {/* Countdown overlay */}
            <div ref={countdownOverlayRef} className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20 hidden">
              <div ref={countdownTextRef} className="text-5xl font-bold text-white"></div>
            </div>
          </div>
          
          {/* Bet inputs */}
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
                disabled={!canPlaceBet || !serverConnected}
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
                disabled={!canPlaceBet || !serverConnected}
              />
            </div>
          </div>
          
          {/* Coins display */}
          <div className="farm-coins mb-4 text-center">
            <p className="text-lg">Available Farm Coins: <span className="font-bold">{farmCoins}</span></p>
          </div>
          
          {/* Betting buttons */}
          <div className="game-buttons mt-4 grid grid-cols-2 gap-4">
            <button 
              onClick={handlePlay} 
              disabled={!canPlaceBet || !serverConnected}
              className={`py-3 text-lg font-bold rounded transition duration-300 ${
                !canPlaceBet || !serverConnected
                  ? "bg-green-800 opacity-50 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {canPlaceBet ? "Place Bet" : "Wait for Next Round"}
            </button>
            
            <button 
              onClick={handleCashout} 
              disabled={!playerJoined || gameState !== GAME_STATE.ACTIVE || !serverConnected}
              className={`py-3 text-lg font-bold rounded transition duration-300 ${
                !playerJoined || gameState !== GAME_STATE.ACTIVE || !serverConnected
                  ? "bg-yellow-800 opacity-50" 
                  : "bg-yellow-600 hover:bg-yellow-700"
              }`}
            >
              Cashout{playerJoined ? "" : " (Not Playing)"}
            </button>
          </div>
          
          {/* Game result text */}
          <div ref={gameResultRef} className="mt-6 text-center text-2xl font-bold"></div>
          
          {/* Game history */}
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
          
          {/* Recent cashouts */}
          <div className="recent-cashouts mt-6">
            <h3 className="text-xl mb-4 text-white">Recent Cashouts</h3>
            <div className="space-y-2">
              {recentCashouts.map((cashout, index) => (
                <div key={index} className="bg-[#222] p-2 rounded flex justify-between">
                  <span>{cashout.username}</span>
                  <span className="text-green-500">{cashout.multiplier.toFixed(2)}x</span>
                  <span>{cashout.winning.toFixed(2)} coins</span>
                </div>
              ))}
              {recentCashouts.length === 0 && (
                <div className="text-gray-500 text-center">No recent cashouts</div>
              )}
            </div>
          </div>
          
          {/* Username editor */}
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
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                disabled={!serverConnected}
              >
                Update
              </button>
            </div>
          </div>
          
          {/* Game instructions */}
          <div className="game-info mt-6 bg-[#222] p-4 rounded text-sm text-white/70">
            <h4 className="font-bold mb-2">How to Play:</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Enter your bet amount in farm coins</li>
              <li>Set an auto-cashout multiplier (optional)</li>
              <li>Click "Place Bet" to join the game</li>
              <li>Wait for the multiplier to increase</li>
              <li>Click Cashout before the game crashes</li>
              <li>If you wait too long, you'll lose your bet!</li>
              <li>Play against other players in real-time</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}