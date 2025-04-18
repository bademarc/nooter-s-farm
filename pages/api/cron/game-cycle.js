// Game Cycle Cron Job for Crashout Game
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

// Count active players (within last 2 minutes)
const countActivePlayers = async (redis) => {
  try {
    const allPlayers = await redis.hgetall('crashout:active-players');
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
    
    let activeCount = 0;
    for (const [_, timestamp] of Object.entries(allPlayers)) {
      if (parseInt(timestamp) > twoMinutesAgo) {
        activeCount++;
      }
    }
    
    return activeCount;
  } catch (error) {
    console.error('Error counting active players:', error);
    throw error;
  }
};

// Main cron job handler
export default async function handler(req, res) {
  // Verify this is a cron job request from Vercel
  // You can add more security here if needed
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  const redis = getRedisClient();
  
  try {
    // Get the current game state
    const gameState = await getGameState(redis);
    
    // Count active players for metrics
    const activePlayerCount = await countActivePlayers(redis);
    
    console.log(`Game cycle - Current state: ${gameState.state}, Players: ${gameState.playersInGame}/${activePlayerCount}`);
    
    // Game state machine
    switch (gameState.state) {
      case GAME_STATE.INACTIVE:
        // Start countdown phase
        await updateGameState(redis, {
          state: GAME_STATE.COUNTDOWN,
          countdown: 10,
          joinWindowTimeLeft: 10,
          multiplier: 1.0,
          playersInGame: 0,
          onlinePlayers: activePlayerCount
        });
        
        // Reset all players for new round
        await resetAllPlayersForNewRound(redis);
        
        console.log('Game moved to COUNTDOWN state');
        break;
        
      case GAME_STATE.COUNTDOWN:
        if (gameState.countdown > 0) {
          // Continue countdown
          await updateGameState(redis, {
            countdown: gameState.countdown - 1,
            joinWindowTimeLeft: Math.max(0, gameState.joinWindowTimeLeft - 1),
            onlinePlayers: activePlayerCount
          });
          
          console.log(`Countdown: ${gameState.countdown - 1}s, Join window: ${Math.max(0, gameState.joinWindowTimeLeft - 1)}s`);
        } else {
          // Start active phase
          // Generate a random crash point between 1.1 and 10
          const crashPoint = generateCrashPoint();
          
          await updateGameState(redis, {
            state: GAME_STATE.ACTIVE,
            multiplier: 1.0,
            crashPoint,
            startTime: Date.now(),
            onlinePlayers: activePlayerCount
          });
          
          console.log(`Game moved to ACTIVE state, Crash point: ${crashPoint.toFixed(2)}x`);
        }
        break;
        
      case GAME_STATE.ACTIVE:
        // Increase multiplier
        const newMultiplier = gameState.multiplier * 1.01; // Increase by 1% each tick
        
        // Check if we should crash
        if (newMultiplier >= gameState.crashPoint) {
          // Game crashed
          await updateGameState(redis, {
            state: GAME_STATE.CRASHED,
            multiplier: gameState.crashPoint, // Use exact crash point
            onlinePlayers: activePlayerCount
          });
          
          // Process the crash
          await processGameCrash(redis, gameState.crashPoint);
          
          console.log(`Game CRASHED at ${gameState.crashPoint.toFixed(2)}x`);
        } else {
          // Update multiplier
          await updateGameState(redis, {
            multiplier: newMultiplier,
            onlinePlayers: activePlayerCount
          });
          
          // Process auto-cashouts at this multiplier
          await processAutoCashouts(redis, newMultiplier);
          
          // Log every 0.5x increase
          if (Math.floor(newMultiplier * 2) > Math.floor(gameState.multiplier * 2)) {
            console.log(`Multiplier reached ${newMultiplier.toFixed(2)}x`);
          }
        }
        break;
        
      case GAME_STATE.CRASHED:
        // Wait some time in crashed state to show the crash
        // Then reset to inactive for the next round
        const crashedDuration = Date.now() - gameState.lastUpdate;
        
        if (crashedDuration > 5000) { // 5 seconds in crashed state
          await updateGameState(redis, {
            state: GAME_STATE.INACTIVE,
            multiplier: 1.0,
            nextGameTime: Date.now() + 3000, // 3 seconds until next game
            onlinePlayers: activePlayerCount
          });
          
          console.log('Game reset to INACTIVE state, ready for next round');
        }
        break;
        
      default:
        // Handle invalid state
        console.error(`Invalid game state: ${gameState.state}`);
        await updateGameState(redis, {
          state: GAME_STATE.INACTIVE,
          multiplier: 1.0,
          nextGameTime: Date.now() + 5000,
          onlinePlayers: activePlayerCount
        });
    }
    
    return res.status(200).json({
      success: true,
      newState: gameState.state,
      playersCount: gameState.playersInGame,
      activePlayerCount
    });
  } catch (error) {
    console.error('Game cycle cron error:', error);
    return res.status(500).json({ success: false, message: 'Game cycle error', error: error.message });
  } finally {
    // Always disconnect Redis client
    redis.disconnect();
  }
} 