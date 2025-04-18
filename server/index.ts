// Create a new folder 'server' with the following files:

// server/index.ts
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // In production, specify your frontend URL
    methods: ["GET", "POST"]
  }
});

// Game state
const GAME_STATE = {
  INACTIVE: "inactive",
  COUNTDOWN: "countdown",
  ACTIVE: "active",
  CRASHED: "crashed",
};

const gameState = {
  currentState: GAME_STATE.INACTIVE,
  multiplier: 1.0,
  crashPoint: 0,
  countdown: 5,
  players: new Map(), // Maps socket ID to player data
  playersJoined: 0,
  lastCrash: null,
  gameHistory: [],
};

// Generate crash point using the same algorithm
const generateCrashPoint = () => {
  const houseEdgePercent = 5;
  const houseEdge = 1 - (houseEdgePercent / 100);
  
  const randomValue = Math.random();
  let crashPoint;
  
  if (randomValue < 0.45) {
    crashPoint = 1.0 + (randomValue * 1.0);
  } else if (randomValue < 0.85) {
    crashPoint = 2.0 + ((randomValue - 0.45) * 7.5);
  } else if (randomValue < 0.98) {
    crashPoint = 5.0 + ((randomValue - 0.85) * 38.46);
  } else {
    crashPoint = 10.0 + ((randomValue - 0.98) * 4500);
  }
  
  return Math.max(1.01, crashPoint * houseEdge);
};

// Game loop
let gameInterval = null;
let countdownInterval = null;

const startCountdown = () => {
  gameState.currentState = GAME_STATE.COUNTDOWN;
  gameState.countdown = 5;
  gameState.multiplier = 1.0;
  gameState.playersJoined = gameState.players.size;
  
  io.emit('gameStateUpdate', {
    state: gameState.currentState,
    countdown: gameState.countdown,
    playersJoined: gameState.playersJoined
  });
  
  countdownInterval = setInterval(() => {
    gameState.countdown -= 1;
    
    io.emit('countdown', gameState.countdown);
    
    if (gameState.countdown <= 0) {
      clearInterval(countdownInterval);
      startGame();
    }
  }, 1000);
};

const startGame = () => {
  gameState.currentState = GAME_STATE.ACTIVE;
  gameState.multiplier = 1.0;
  gameState.crashPoint = generateCrashPoint();
  
  console.log(`Game started with crash point: ${gameState.crashPoint.toFixed(2)}x`);
  
  io.emit('gameStateUpdate', {
    state: gameState.currentState,
    multiplier: gameState.multiplier
  });
  
  let currentMultiplier = 1.0;
  
  gameInterval = setInterval(() => {
    // Calculate next multiplier with exponential growth
    const growthFactor = 1 + (currentMultiplier / 50);
    currentMultiplier = currentMultiplier * growthFactor;
    gameState.multiplier = currentMultiplier;
    
    // Check for auto-cashouts
    gameState.players.forEach((player, socketId) => {
      if (player.inGame && !player.cashedOut && player.autoCashoutAt && currentMultiplier >= player.autoCashoutAt) {
        playerCashout(socketId, true);
      }
    });
    
    // Emit updated multiplier to all clients
    io.emit('multiplierUpdate', currentMultiplier);
    
    // Check for crash
    if (currentMultiplier >= gameState.crashPoint) {
      endGame(gameState.crashPoint);
    }
  }, 100);
};

const endGame = (finalMultiplier) => {
  clearInterval(gameInterval);
  gameState.currentState = GAME_STATE.CRASHED;
  gameState.lastCrash = finalMultiplier;
  
  // Add to history
  gameState.gameHistory.unshift({
    value: finalMultiplier.toFixed(2),
    color: "red"
  });
  
  if (gameState.gameHistory.length > 10) {
    gameState.gameHistory.pop();
  }
  
  // Process remaining players who didn't cash out
  gameState.players.forEach((player, socketId) => {
    if (player.inGame && !player.cashedOut) {
      // Player lost their bet
      player.inGame = false;
      
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('gameLost', {
          betAmount: player.betAmount,
          crashPoint: finalMultiplier
        });
      }
    }
  });
  
  io.emit('gameCrashed', {
    crashPoint: finalMultiplier,
    nextGameIn: 5,
    history: gameState.gameHistory
  });
  
  // Reset for next game
  setTimeout(() => {
    resetGame();
    startCountdown();
  }, 5000);
};

const resetGame = () => {
  gameState.currentState = GAME_STATE.INACTIVE;
  gameState.multiplier = 1.0;
  
  // Reset player states for the next round
  gameState.players.forEach(player => {
    player.inGame = false;
    player.cashedOut = false;
    player.betAmount = 0;
    player.autoCashoutAt = null;
  });
};

const playerCashout = (socketId, isAuto = false) => {
  const player = gameState.players.get(socketId);
  
  if (!player || !player.inGame || player.cashedOut) {
    return false;
  }
  
  player.cashedOut = true;
  player.cashedOutAt = gameState.multiplier;
  
  const winnings = player.betAmount * gameState.multiplier;
  
  // Update player data
  player.balance += winnings;
  
  // Add to history
  gameState.gameHistory.unshift({
    value: gameState.multiplier.toFixed(2),
    color: "green"
  });
  
  if (gameState.gameHistory.length > 10) {
    gameState.gameHistory.pop();
  }
  
  // Notify player
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    socket.emit('cashoutSuccess', {
      multiplier: gameState.multiplier,
      winnings: winnings,
      isAuto: isAuto,
      newBalance: player.balance
    });
    
    // Notify all players about the cashout
    io.emit('playerCashedOut', {
      username: player.username,
      multiplier: gameState.multiplier,
      winning: winnings
    });
  }
  
  return true;
};

// Socket events
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  // Init player data
  gameState.players.set(socket.id, {
    socketId: socket.id,
    username: `Player-${socket.id.substring(0, 5)}`,
    balance: 1000, // Starting balance
    inGame: false,
    betAmount: 0,
    autoCashoutAt: null,
    cashedOut: false,
    cashedOutAt: null,
    lastAction: Date.now()
  });
  
  // Send current game state to new player
  socket.emit('gameStateUpdate', {
    state: gameState.currentState,
    multiplier: gameState.multiplier,
    countdown: gameState.countdown,
    playersJoined: gameState.playersJoined,
    players: Array.from(gameState.players.values())
      .filter(p => p.inGame)
      .map(p => ({
        username: p.username,
        betAmount: p.betAmount,
        cashedOut: p.cashedOut,
        cashedOutAt: p.cashedOutAt
      })),
    history: gameState.gameHistory
  });
  
  // Handle player actions
  socket.on('placeBet', ({ betAmount, autoCashoutAt }) => {
    const player = gameState.players.get(socket.id);
    
    if (!player) return;
    
    // Validate bet
    if (gameState.currentState !== GAME_STATE.INACTIVE && gameState.currentState !== GAME_STATE.COUNTDOWN) {
      socket.emit('error', { message: 'Cannot place bet while game is in progress' });
      return;
    }
    
    if (betAmount <= 0 || betAmount > player.balance) {
      socket.emit('error', { message: 'Invalid bet amount' });
      return;
    }
    
    // Update player data
    player.inGame = true;
    player.betAmount = betAmount;
    player.autoCashoutAt = autoCashoutAt > 1 ? autoCashoutAt : null;
    player.cashedOut = false;
    player.cashedOutAt = null;
    player.balance -= betAmount;
    player.lastAction = Date.now();
    
    // Notify player
    socket.emit('betAccepted', {
      betAmount,
      autoCashoutAt,
      remainingBalance: player.balance
    });
    
    // Notify all players
    io.emit('playerJoined', {
      username: player.username,
      betAmount
    });
  });
  
  socket.on('cashout', () => {
    playerCashout(socket.id);
  });
  
  socket.on('updateUsername', (username) => {
    const player = gameState.players.get(socket.id);
    if (player) {
      player.username = username;
      socket.emit('usernameUpdated', username);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
    gameState.players.delete(socket.id);
  });
});

// Start the first game
setTimeout(() => {
  startCountdown();
}, 5000);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Crashout game server running on port ${PORT}`);
});