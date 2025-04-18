// Game API handler for Crashout Game
import Redis from 'ioredis';

// Initialize Redis client
const getRedisClient = () => {
  const redis = new Redis(process.env.REDIS_URL);
  return redis;
};

// Constants for game states
const GAME_STATE = {
  INACTIVE: "inactive",
  COUNTDOWN: "countdown",
  ACTIVE: "active",
  CRASHED: "crashed",
  CASHED_OUT: "cashed_out",
};

// Generate a crash point using a fair algorithm
// Returns a value between 1.1 and 10
const generateCrashPoint = () => {
  // Basic algorithm: 1.1 + random value (can be enhanced with different distribution)
  return 1.1 + Math.random() * 8.9;
};

// Get the current game state
const getGameState = async (redis) => {
  try {
    const gameStateRaw = await redis.get('crashout:gameState');
    if (!gameStateRaw) {
      // Initial state if nothing exists
      const initialState = {
        state: GAME_STATE.INACTIVE,
        multiplier: 1.0,
        countdown: 10,
        nextGameTime: Date.now() + 5000,
        playersInGame: 0,
        onlinePlayers: 0,
        crashPoint: 0,
        joinWindowTimeLeft: 0,
        lastUpdate: Date.now(),
      };
      await redis.set('crashout:gameState', JSON.stringify(initialState));
      return initialState;
    }
    return JSON.parse(gameStateRaw);
  } catch (error) {
    console.error('Error getting game state:', error);
    throw error;
  }
};

// Update the game state
const updateGameState = async (redis, updates) => {
  try {
    const currentState = await getGameState(redis);
    const newState = { ...currentState, ...updates, lastUpdate: Date.now() };
    await redis.set('crashout:gameState', JSON.stringify(newState));
    return newState;
  } catch (error) {
    console.error('Error updating game state:', error);
    throw error;
  }
};

// Get a player's data
const getPlayerData = async (redis, username) => {
  try {
    const playerDataRaw = await redis.get(`crashout:player:${username}`);
    if (!playerDataRaw) {
      return { betAmount: 0, autoCashout: 2.0, joined: false, cashedOut: false };
    }
    return JSON.parse(playerDataRaw);
  } catch (error) {
    console.error('Error getting player data:', error);
    throw error;
  }
};

// Update a player's data
const updatePlayerData = async (redis, username, updates) => {
  try {
    const currentData = await getPlayerData(redis, username);
    const newData = { ...currentData, ...updates, lastUpdate: Date.now() };
    await redis.set(`crashout:player:${username}`, JSON.stringify(newData));
    return newData;
  } catch (error) {
    console.error('Error updating player data:', error);
    throw error;
  }
};

// Get game history
const getGameHistory = async (redis) => {
  try {
    const historyRaw = await redis.lrange('crashout:history', 0, 50);
    return historyRaw.map(item => JSON.parse(item));
  } catch (error) {
    console.error('Error getting game history:', error);
    throw error;
  }
};

// Add a game result to history
const addGameToHistory = async (redis, crashPoint) => {
  try {
    const gameResult = {
      crashPoint,
      timestamp: Date.now(),
      color: crashPoint >= 2.0 ? "green" : "red" 
    };
    await redis.lpush('crashout:history', JSON.stringify(gameResult));
    await redis.ltrim('crashout:history', 0, 49); // Keep only 50 most recent games
    return gameResult;
  } catch (error) {
    console.error('Error adding game to history:', error);
    throw error;
  }
};

// Get recent cashouts
const getRecentCashouts = async (redis) => {
  try {
    const cashoutsRaw = await redis.lrange('crashout:cashouts', 0, 15);
    return cashoutsRaw.map(item => JSON.parse(item));
  } catch (error) {
    console.error('Error getting recent cashouts:', error);
    throw error;
  }
};

// Add a cashout to the recent list
const addCashout = async (redis, username, multiplier, winning) => {
  try {
    const cashout = {
      username,
      multiplier,
      winning,
      timestamp: Date.now()
    };
    await redis.lpush('crashout:cashouts', JSON.stringify(cashout));
    await redis.ltrim('crashout:cashouts', 0, 14); // Keep only 15 most recent cashouts
    return cashout;
  } catch (error) {
    console.error('Error adding cashout:', error);
    throw error;
  }
};

// Process player's bet
const placeBet = async (redis, username, betAmount, autoCashout) => {
  try {
    const gameState = await getGameState(redis);
    
    // Check if game is in countdown and join window is open
    if (gameState.state !== GAME_STATE.COUNTDOWN || gameState.joinWindowTimeLeft <= 0) {
      return { success: false, message: "Cannot place bet now. Join window is closed." };
    }
    
    // Check if player has already joined this round
    const playerData = await getPlayerData(redis, username);
    if (playerData.joined && !playerData.cashedOut) {
      return { success: false, message: "Already placed a bet for this round." };
    }
    
    // Validate bet amount and auto cashout
    if (isNaN(betAmount) || betAmount <= 0) {
      return { success: false, message: "Invalid bet amount." };
    }
    if (isNaN(autoCashout) || autoCashout < 1.01) {
      return { success: false, message: "Auto cashout must be at least 1.01x." };
    }
    
    // Update player data
    await updatePlayerData(redis, username, {
      betAmount,
      autoCashout,
      joined: true,
      cashedOut: false
    });
    
    // Update game state - increment players in game
    await updateGameState(redis, {
      playersInGame: gameState.playersInGame + 1
    });
    
    return { success: true, message: "Bet placed successfully!" };
  } catch (error) {
    console.error('Error placing bet:', error);
    throw error;
  }
};

// Process player's cashout
const processCashout = async (redis, username) => {
  try {
    const gameState = await getGameState(redis);
    
    // Check if game is active
    if (gameState.state !== GAME_STATE.ACTIVE) {
      return { success: false, message: "Cannot cash out - game is not active." };
    }
    
    // Check if player has joined and not already cashed out
    const playerData = await getPlayerData(redis, username);
    if (!playerData.joined) {
      return { success: false, message: "You haven't joined this game." };
    }
    if (playerData.cashedOut) {
      return { success: false, message: "Already cashed out." };
    }
    
    // Calculate winnings
    const winAmount = playerData.betAmount * gameState.multiplier;
    
    // Update player data
    await updatePlayerData(redis, username, {
      cashedOut: true,
      cashedOutAt: gameState.multiplier,
      winAmount
    });
    
    // Add to recent cashouts
    await addCashout(redis, username, gameState.multiplier, winAmount);
    
    return {
      success: true,
      multiplier: gameState.multiplier,
      winAmount
    };
  } catch (error) {
    console.error('Error processing cashout:', error);
    throw error;
  }
};

// Process auto-cashouts for all players
const processAutoCashouts = async (redis, currentMultiplier) => {
  try {
    // Get all player keys
    const playerKeys = await redis.keys('crashout:player:*');
    
    for (const key of playerKeys) {
      const username = key.split(':')[2];
      const playerData = await getPlayerData(redis, username);
      
      // Check if player is in the game, hasn't cashed out yet, and should auto-cashout
      if (playerData.joined && !playerData.cashedOut && playerData.autoCashout <= currentMultiplier) {
        // Auto cashout
        const winAmount = playerData.betAmount * currentMultiplier;
        
        // Update player data
        await updatePlayerData(redis, username, {
          cashedOut: true,
          cashedOutAt: currentMultiplier,
          winAmount
        });
        
        // Add to recent cashouts
        await addCashout(redis, username, currentMultiplier, winAmount);
      }
    }
  } catch (error) {
    console.error('Error processing auto-cashouts:', error);
    throw error;
  }
};

// Process game crash - handle players who didn't cash out
const processGameCrash = async (redis, crashPoint) => {
  try {
    // Get all player keys
    const playerKeys = await redis.keys('crashout:player:*');
    
    // Add the crash to history
    await addGameToHistory(redis, crashPoint);
    
    for (const key of playerKeys) {
      const username = key.split(':')[2];
      const playerData = await getPlayerData(redis, username);
      
      // Mark uncashed players as losers
      if (playerData.joined && !playerData.cashedOut) {
        await updatePlayerData(redis, username, {
          cashedOut: false,
          lost: true,
          winAmount: 0
        });
      }
    }
    
    // Clear all player data for next round
    await resetAllPlayersForNewRound(redis);
  } catch (error) {
    console.error('Error processing game crash:', error);
    throw error;
  }
};

// Reset all players for a new round
const resetAllPlayersForNewRound = async (redis) => {
  try {
    // Get all player keys
    const playerKeys = await redis.keys('crashout:player:*');
    
    for (const key of playerKeys) {
      const username = key.split(':')[2];
      // Reset player's game status but keep their bet preferences
      const playerData = await getPlayerData(redis, username);
      
      await updatePlayerData(redis, username, {
        joined: false,
        cashedOut: false,
        lost: false,
        cashedOutAt: null,
        winAmount: null,
        // Keep betAmount and autoCashout preferences
        betAmount: playerData.betAmount,
        autoCashout: playerData.autoCashout
      });
    }
  } catch (error) {
    console.error('Error resetting players for new round:', error);
    throw error;
  }
};

// Record player activity to track online users
const recordPlayerActivity = async (redis, username) => {
  try {
    await redis.hset('crashout:active-players', username, Date.now());
    
    // Count active players (within last 2 minutes)
    const allPlayers = await redis.hgetall('crashout:active-players');
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
    
    let activeCount = 0;
    for (const [_, timestamp] of Object.entries(allPlayers)) {
      if (parseInt(timestamp) > twoMinutesAgo) {
        activeCount++;
      }
    }
    
    // Update online player count in game state
    const gameState = await getGameState(redis);
    await updateGameState(redis, {
      onlinePlayers: activeCount
    });
    
    return activeCount;
  } catch (error) {
    console.error('Error recording player activity:', error);
    throw error;
  }
};

// Main API handler
export default async function handler(req, res) {
  const redis = getRedisClient();
  
  try {
    // GET requests - fetch game state
    if (req.method === 'GET') {
      const gameState = await getGameState(redis);
      const history = await getGameHistory(redis);
      const cashouts = await getRecentCashouts(redis);
      
      return res.status(200).json({
        success: true,
        gameState,
        history,
        cashouts
      });
    }
    
    // POST requests - handle actions
    if (req.method === 'POST') {
      const { action, username, betAmount, autoCashout } = req.body;
      
      // Record player activity regardless of action
      if (username) {
        await recordPlayerActivity(redis, username);
      }
      
      switch (action) {
        case 'placeBet':
          const betResult = await placeBet(redis, username, parseFloat(betAmount), parseFloat(autoCashout));
          return res.status(200).json(betResult);
          
        case 'cashout':
          const cashoutResult = await processCashout(redis, username);
          return res.status(200).json(cashoutResult);
          
        case 'sync':
          const gameState = await getGameState(redis);
          const history = await getGameHistory(redis);
          const cashouts = await getRecentCashouts(redis);
          
          // If player is provided, get their status
          let playerData = null;
          if (username) {
            playerData = await getPlayerData(redis, username);
          }
          
          return res.status(200).json({
            success: true,
            gameState,
            history,
            cashouts,
            playerData
          });
          
        case 'playerActivity':
          if (!username) {
            return res.status(400).json({ success: false, message: 'Username required' });
          }
          
          // Record player's bet preferences
          await updatePlayerData(redis, username, {
            betAmount: parseFloat(betAmount) || 10,
            autoCashout: parseFloat(autoCashout) || 2.0
          });
          
          const activeCount = await recordPlayerActivity(redis, username);
          return res.status(200).json({ success: true, activeCount });
          
        case 'logCrash':
          const { crashPoint } = req.body;
          await addGameToHistory(redis, crashPoint);
          return res.status(200).json({ success: true });
          
        default:
          return res.status(400).json({ success: false, message: 'Unknown action' });
      }
    }
    
    // Handle other HTTP methods
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Game API error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  } finally {
    // Always disconnect Redis client
    redis.disconnect();
  }
} 