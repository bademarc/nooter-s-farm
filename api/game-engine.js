// lib/game-engine.js
import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';

// Game constants
export const GAME_STATE = {
  INACTIVE: "inactive",
  COUNTDOWN: "countdown",
  ACTIVE: "active",
  CRASHED: "crashed",
};

// Generate crash point using the same algorithm
export const generateCrashPoint = () => {
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

// Initial game state
export const initialGameState = {
  currentState: GAME_STATE.INACTIVE,
  multiplier: 1.0,
  crashPoint: 2.0,
  countdown: 5,
  players: [],
  history: []
};

// Hook for consuming game state
export function useGameState() {
  const [gameState, setGameState] = useState(initialGameState);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    // Connect to Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    
    const channel = pusher.subscribe('game-channel');
    
    // Listen for game state updates
    channel.bind('game-update', (data) => {
      setGameState(data);
    });
    
    // Set connected state
    pusher.connection.bind('connected', () => {
      setConnected(true);
    });
    
    // Cleanup
    return () => {
      channel.unbind_all();
      pusher.unsubscribe('game-channel');
    };
  }, []);
  
  // API functions
  const placeBet = async (betAmount, autoCashoutAt) => {
    try {
      const response = await fetch('/api/place-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, autoCashoutAt })
      });
      return await response.json();
    } catch (error) {
      console.error('Error placing bet:', error);
      return { success: false, error: 'Failed to place bet' };
    }
  };
  
  const cashout = async () => {
    try {
      const response = await fetch('/api/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error) {
      console.error('Error cashing out:', error);
      return { success: false, error: 'Failed to cash out' };
    }
  };
  
  return {
    gameState,
    connected,
    placeBet,
    cashout
  };
}