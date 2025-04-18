// api/place-bet.js
import { gameState } from './game-state';
import Pusher from 'pusher';

// Initialize Pusher (same as in game-state.js)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { betAmount, autoCashoutAt } = req.body;
  
  // Validate request
  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }
  
  // Get user ID (you'd use a real auth system in production)
  const userId = req.cookies.userId || 'user-' + Math.random().toString(36).substr(2, 9);
  
  // Create or update player
  let player = gameState.players.find(p => p.id === userId);
  if (!player) {
    player = {
      id: userId,
      username: `Player-${userId.substr(0, 5)}`,
      balance: 1000, // Default starting balance
      inGame: false,
      betAmount: 0,
      autoCashoutAt: null,
      cashedOut: false,
      cashedOutAt: null
    };
    gameState.players.push(player);
  }
  
  // Check if player can place bet
  if (gameState.currentState !== 'inactive' && gameState.currentState !== 'countdown') {
    return res.status(400).json({ error: 'Cannot place bet while game is in progress' });
  }
  
  if (betAmount > player.balance) {
    return res.status(400).json({ error: 'Not enough balance' });
  }
  
  // Update player data
  player.inGame = true;
  player.betAmount = betAmount;
  player.autoCashoutAt = autoCashoutAt > 1 ? autoCashoutAt : null;
  player.cashedOut = false;
  player.cashedOutAt = null;
  player.balance -= betAmount;
  
  // Broadcast player joined
  pusher.trigger('game-channel', 'player-joined', {
    username: player.username,
    betAmount
  });
  
  // Send response
  res.status(200).json({ 
    success: true, 
    betAmount,
    autoCashoutAt,
    remainingBalance: player.balance
  });
}