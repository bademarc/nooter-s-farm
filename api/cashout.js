// api/cashout.js
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
  
  // Get user ID (you'd use a real auth system in production)
  const userId = req.cookies.userId || req.body.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  // Find player
  const player = gameState.players.find(p => p.id === userId);
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  // Check if player can cash out
  if (!player.inGame || player.cashedOut) {
    return res.status(400).json({ error: 'Cannot cash out' });
  }
  
  if (gameState.currentState !== 'active') {
    return res.status(400).json({ error: 'Game not active' });
  }
  
  // Process cashout
  player.cashedOut = true;
  player.cashedOutAt = gameState.multiplier;
  
  const winnings = player.betAmount * gameState.multiplier;
  player.balance += winnings;
  
  // Add to history
  gameState.history.unshift({
    value: gameState.multiplier.toFixed(2),
    color: "green"
  });
  
  if (gameState.history.length > 10) {
    gameState.history.pop();
  }
  
  // Broadcast cashout
  pusher.trigger('game-channel', 'player-cashout', {
    username: player.username,
    multiplier: gameState.multiplier,
    winning: winnings
  });
  
  // Send response
  res.status(200).json({ 
    success: true, 
    multiplier: gameState.multiplier,
    winnings,
    newBalance: player.balance
  });
}