// api/game-state.js
import Pusher from 'pusher';
import { initialGameState, generateCrashPoint } from '../lib/game-engine';

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
});

// In-memory game state (for demo purposes)
// In production, use a database or other persistence
let gameState = {...initialGameState};
let gameInterval = null;
let countdownInterval = null;

// Initialize game loop
export const startGameLoop = () => {
  // Clear any existing intervals
  if (gameInterval) clearInterval(gameInterval);
  if (countdownInterval) clearInterval(countdownInterval);
  
  // Start countdown
  gameState.currentState = 'countdown';
  gameState.countdown = 5;
  gameState.multiplier = 1.0;
  
  // Update state
  pusher.trigger('game-channel', 'game-update', gameState);
  
  // Countdown interval
  countdownInterval = setInterval(() => {
    gameState.countdown -= 1;
    
    // Broadcast update
    pusher.trigger('game-channel', 'game-update', gameState);
    
    if (gameState.countdown <= 0) {
      clearInterval(countdownInterval);
      startGame();
    }
  }, 1000);
};

// Start active game
const startGame = () => {
  gameState.currentState = 'active';
  gameState.multiplier = 1.0;
  gameState.crashPoint = generateCrashPoint();
  
  // Broadcast game start
  pusher.trigger('game-channel', 'game-update', gameState);
  
  // Game loop interval
  let currentMultiplier = 1.0;
  
  gameInterval = setInterval(() => {
    // Calculate next multiplier
    const growthFactor = 1 + (currentMultiplier / 50);
    currentMultiplier = currentMultiplier * growthFactor;
    gameState.multiplier = currentMultiplier;
    
    // Check for auto-cashouts
    gameState.players.forEach(player => {
      if (player.inGame && !player.cashedOut && player.autoCashoutAt && currentMultiplier >= player.autoCashoutAt) {
        // Process auto cashout
        player.cashedOut = true;
        player.cashedOutAt = currentMultiplier;
        
        // Broadcast cashout event
        pusher.trigger('game-channel', 'player-cashout', {
          username: player.username,
          multiplier: currentMultiplier,
          winning: player.betAmount * currentMultiplier
        });
      }
    });
    
    // Broadcast update
    pusher.trigger('game-channel', 'game-update', gameState);
    
    // Check for crash
    if (currentMultiplier >= gameState.crashPoint) {
      endGame(gameState.crashPoint);
    }
  }, 100);
};

// End game function
const endGame = (finalMultiplier) => {
  clearInterval(gameInterval);
  
  gameState.currentState = 'crashed';
  gameState.multiplier = finalMultiplier;
  
  // Add to history
  gameState.history.unshift({
    value: finalMultiplier.toFixed(2),
    color: "red"
  });
  
  if (gameState.history.length > 10) {
    gameState.history.pop();
  }
  
  // Process players who didn't cash out
  gameState.players.forEach(player => {
    if (player.inGame && !player.cashedOut) {
      player.inGame = false;
      
      // Broadcast loss event
      pusher.trigger('game-channel', 'player-loss', {
        username: player.username,
        betAmount: player.betAmount,
        crashPoint: finalMultiplier
      });
    }
  });
  
  // Broadcast game end
  pusher.trigger('game-channel', 'game-crashed', {
    crashPoint: finalMultiplier,
    nextGameIn: 5,
    history: gameState.history
  });
  
  // Schedule next game
  setTimeout(() => {
    resetGame();
    startGameLoop();
  }, 5000);
};

// Reset for next game
const resetGame = () => {
  gameState.currentState = 'inactive';
  gameState.multiplier = 1.0;
  
  // Reset player states
  gameState.players.forEach(player => {
    player.inGame = false;
    player.cashedOut = false;
    player.betAmount = 0;
    player.autoCashoutAt = null;
  });
};

// Serverless function handler
export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(gameState);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}