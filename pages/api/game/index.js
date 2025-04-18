// Game API handler for Crashout Game
import Redis from 'ioredis';

// Initialize Redis client
const getRedisClient = () => {
  try {
    // Log Redis connection details (without exposing password)
    const redisUrl = process.env.REDIS_URL || '';
    
    if (!redisUrl) {
      console.error('REDIS_URL environment variable is not set');
      throw new Error('REDIS_URL environment variable is not set');
    }
    
    const maskedUrl = redisUrl.replace(/:([^@]+)@/, ':******@');
    console.log('Connecting to Redis with URL:', maskedUrl);
    
    // Additional options for better Vercel compatibility
    const options = {
      enableAutoPipelining: false, // Disable auto pipelining for better compatibility
      connectTimeout: 10000,       // Increase timeout
      retryStrategy: (times) => {  // Simple retry strategy
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 3,     // Limit retries per request
      enableOfflineQueue: true     // Enable offline queue
    };
    
    // Initialize Redis client with options
    const redis = new Redis(process.env.REDIS_URL, options);
    
    // Handle connection events
    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
    
    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
    
    redis.on('reconnecting', (delay) => {
      console.log(`Redis reconnecting in ${delay}ms`);
    });
    
    return redis;
  } catch (error) {
    console.error('Error creating Redis client:', error);
    throw error;
  }
};

// Constants for game states
const GAME_STATE = {
  INACTIVE: "inactive",
  COUNTDOWN: "countdown",
  ACTIVE: "active",
  CRASHED: "crashed",
  CASHED_OUT: "cashed_out",
};

// Constants for game timing
const COUNTDOWN_SECONDS = 15; // 15 seconds for countdown
const JOIN_WINDOW_SECONDS = 15; // 15 seconds for join window

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
    
    // Add safer JSON parsing with error handling
    try {
      return JSON.parse(gameStateRaw);
    } catch (parseError) {
      console.error('Error parsing game state JSON:', parseError);
      console.error('Raw game state:', gameStateRaw);
      
      // Log the first few characters for debugging
      const sample = gameStateRaw.slice(0, 50) + (gameStateRaw.length > 50 ? '...' : '');
      console.error('Game state sample:', sample);
      
      // Create a fallback game state
      const fallbackState = {
        state: GAME_STATE.INACTIVE,
        multiplier: 1.0,
        countdown: 10,
        nextGameTime: Date.now() + 5000,
        playersInGame: 0,
        onlinePlayers: 0,
        crashPoint: 0,
        joinWindowTimeLeft: 0,
        lastUpdate: Date.now(),
        parseError: parseError.message,
      };
      
      // Attempt to repair the game state in Redis
      try {
        console.log('Attempting to repair corrupted game state in Redis');
        await redis.set('crashout:gameState', JSON.stringify(fallbackState));
      } catch (repairError) {
        console.error('Error repairing game state:', repairError);
      }
      
      return fallbackState;
    }
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
    
    // Add safer JSON parsing with error handling
    try {
      return JSON.parse(playerDataRaw);
    } catch (parseError) {
      console.error(`Error parsing player data JSON for ${username}:`, parseError);
      console.error('Raw player data:', playerDataRaw);
      
      // Create a fallback player state
      const fallbackData = { 
        betAmount: 0, 
        autoCashout: 2.0, 
        joined: false, 
        cashedOut: false,
        parseError: parseError.message
      };
      
      // Attempt to repair the player data in Redis
      try {
        console.log(`Attempting to repair corrupted player data for ${username}`);
        await redis.set(`crashout:player:${username}`, JSON.stringify(fallbackData));
      } catch (repairError) {
        console.error('Error repairing player data:', repairError);
      }
      
      return fallbackData;
    }
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
    
    // Parse each history item safely
    return historyRaw.map(item => {
      try {
        // First try regular JSON parse
        return JSON.parse(item);
      } catch (parseError) {
        console.error('Error parsing history item JSON:', parseError);
        console.error('Raw history item:', item);
        
        try {
          // Extract values directly using regex
          const crashPointMatch = item.match(/crashPoint\\?:(\d+(\.\d+)?)/);
          const timestampMatch = item.match(/timestamp\\?:(\d+)/);
          const colorMatch = item.match(/color\\?:\\?(\w+)\\?/);
          
          console.log('Regex extraction values:', {
            crashPoint: crashPointMatch ? crashPointMatch[1] : 'not found',
            timestamp: timestampMatch ? timestampMatch[1] : 'not found',
            color: colorMatch ? colorMatch[1] : 'not found'
          });
          
          // Create a new object directly from the extracted values
          if (crashPointMatch || timestampMatch || colorMatch) {
            const crashPoint = crashPointMatch ? parseFloat(crashPointMatch[1]) : 1.0;
            const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();
            const color = colorMatch ? colorMatch[1] : "red";
            
            console.log('Created new object from extracted values:', { crashPoint, timestamp, color });
            
            return {
              crashPoint,
              timestamp,
              color,
              recovered: true
            };
          }
          
          // Manual parsing as fallback
          if (item.includes('\\crashPoint\\:') && item.includes('\\timestamp\\:') && item.includes('\\color\\:')) {
            console.log('Using direct string extraction method');
            
            // Example: {\crashPoint\:2.5,\timestamp\:1745000000000,\color\:\green\}
            const crashPointStr = item.split('\\crashPoint\\:')[1]?.split(',')[0];
            const timestampStr = item.split('\\timestamp\\:')[1]?.split(',')[0];
            const colorStr = item.split('\\color\\:')[1]?.split('\\}')[0].replace('\\', '');
            
            console.log('Manual parsing results:', { crashPointStr, timestampStr, colorStr });
            
            // Create object directly with correct types
            return {
              crashPoint: crashPointStr ? parseFloat(crashPointStr) : 1.0,
              timestamp: timestampStr ? parseInt(timestampStr) : Date.now(),
              color: colorStr || "red",
              recovered: true,
              manuallyParsed: true
            };
          }
          
          // Fallback to basic default object as last resort
          return {
            crashPoint: 1.0,
            timestamp: Date.now(),
            color: "red",
            recovered: true,
            fallback: true
          };
        } catch (extractError) {
          console.error('Error extracting data:', extractError);
          
          // Return a fallback history item as last resort
          return {
            crashPoint: 1.0,
            timestamp: Date.now(),
            color: "red",
            parseError: parseError.message,
            extractError: extractError.message
          };
        }
      }
    });
  } catch (error) {
    console.error('Error getting game history:', error);
    return []; // Return empty array instead of throwing
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
    
    // Parse each cashout safely
    return cashoutsRaw.map(item => {
      try {
        return JSON.parse(item);
      } catch (parseError) {
        console.error('Error parsing cashout JSON:', parseError);
        console.error('Raw cashout item:', item);
        
        // Return a fallback cashout item
        return {
          username: "unknown",
          multiplier: 1.0,
          winning: 0,
          timestamp: Date.now(),
          parseError: parseError.message
        };
      }
    });
  } catch (error) {
    console.error('Error getting recent cashouts:', error);
    return []; // Return empty array instead of throwing
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
    console.log(`Attempting to place bet for ${username} with amount ${betAmount} and auto cashout ${autoCashout}`);
    
    const gameState = await getGameState(redis);
    console.log('Current game state:', gameState);
    
    // Always allow bets during countdown regardless of joinWindowTimeLeft
    // This fixes the bug where the join window is showing but bets aren't accepted
    if (gameState.state !== GAME_STATE.COUNTDOWN) {
      console.log(`Cannot place bet: Game not in countdown state (current: ${gameState.state})`);
      return { success: false, message: "Cannot place bet now. Game is not in join phase." };
    }
    
    // Check if player has already joined this round
    const playerData = await getPlayerData(redis, username);
    if (playerData.joined && !playerData.cashedOut) {
      console.log(`Player ${username} already placed a bet for this round`);
      return { success: false, message: "Already placed a bet for this round." };
    }
    
    // Validate bet amount and auto cashout
    if (isNaN(betAmount) || betAmount <= 0) {
      console.log(`Invalid bet amount: ${betAmount}`);
      return { success: false, message: "Invalid bet amount." };
    }
    if (isNaN(autoCashout) || autoCashout < 1.01) {
      console.log(`Invalid auto cashout: ${autoCashout}`);
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
      playersInGame: (gameState.playersInGame || 0) + 1
    });
    
    console.log(`Bet successfully placed for ${username}`);
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

// Progress the game state based on current state and time elapsed
// This replaces the need for frequent cron jobs
const progressGameState = async (redis) => {
  try {
    const gameState = await getGameState(redis);
    const now = Date.now();
    console.log('progressGameState - current state:', gameState.state, 'countdown:', gameState.countdown);
    
    // Get active player count
    const activePlayers = await countActivePlayers(redis);
    
    // Game state transitions based on current state and timing
    if (gameState.state === GAME_STATE.INACTIVE) {
      // Start countdown if it's time for next game
      if (gameState.nextGameTime <= now) {
        console.log(`Starting new game countdown from INACTIVE state`);
        await updateGameState(redis, {
          state: GAME_STATE.COUNTDOWN,
          countdown: COUNTDOWN_SECONDS, // Use the defined countdown time
          multiplier: 1.0,
          crashPoint: generateCrashPoint(), // Pre-generate crash point
          joinWindowTimeLeft: JOIN_WINDOW_SECONDS, // Full join window time
          onlinePlayers: activePlayers,
          startTime: now // Add explicit start time for countdown
        });
      }
    } 
    else if (gameState.state === GAME_STATE.COUNTDOWN) {
      // Calculate elapsed time more accurately using startTime or lastUpdate
      const startTime = gameState.startTime || gameState.lastUpdate;
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      console.log(`COUNTDOWN state: elapsed=${elapsedSeconds}s, countdown=${gameState.countdown}`);
      
      const remainingCountdown = Math.max(0, gameState.countdown - elapsedSeconds);
      
      // Calculate remaining join window time
      const remainingJoinWindow = Math.max(0, (gameState.joinWindowTimeLeft || JOIN_WINDOW_SECONDS) - elapsedSeconds);
      
      if (remainingCountdown <= 0) {
        // Countdown completed, start the game
        console.log(`Countdown complete, transitioning to ACTIVE state`);
        await updateGameState(redis, {
          state: GAME_STATE.ACTIVE,
          countdown: 0,
          joinWindowTimeLeft: 0,
          multiplier: 1.0,
          startTime: now,
          onlinePlayers: activePlayers
        });
      } else {
        // Update countdown timer
        console.log(`Updating countdown: ${remainingCountdown}s remaining, join window: ${remainingJoinWindow}s`);
        await updateGameState(redis, {
          countdown: remainingCountdown,
          joinWindowTimeLeft: remainingJoinWindow,
          onlinePlayers: activePlayers
        });
      }
    }
    else if (gameState.state === GAME_STATE.ACTIVE) {
      // Calculate how long the game has been running
      const startTime = gameState.startTime || gameState.lastUpdate;
      const gameRunTime = now - startTime;
      const secondsActive = gameRunTime / 1000;
      
      console.log(`ACTIVE state: running for ${secondsActive.toFixed(1)}s, multiplier: ${gameState.multiplier}, crash point: ${gameState.crashPoint}`);
      
      // Calculate current multiplier based on time running (exponential growth)
      // Multiplier formula: 1.0 * e^(growth_rate * seconds)
      const growthRate = 0.05; // Adjust for faster/slower growth
      const currentMultiplier = parseFloat((1.0 * Math.exp(growthRate * secondsActive)).toFixed(2));
      
      // Process auto-cashouts at current multiplier
      await processAutoCashouts(redis, currentMultiplier);
      
      // Check if we've reached crash point
      if (currentMultiplier >= gameState.crashPoint) {
        // Game crashed
        console.log(`Game crashed at multiplier ${currentMultiplier}, crash point: ${gameState.crashPoint}`);
        await updateGameState(redis, {
          state: GAME_STATE.CRASHED,
          multiplier: gameState.crashPoint,
          onlinePlayers: activePlayers
        });
        
        // Process game crash - mark losses, etc.
        await processGameCrash(redis, gameState.crashPoint);
        
        // Schedule next game
        await updateGameState(redis, {
          nextGameTime: now + 5000 // 5 seconds after crash
        });
      } else {
        // Game still running, update multiplier
        await updateGameState(redis, {
          multiplier: currentMultiplier,
          onlinePlayers: activePlayers
        });
      }
    }
    else if (gameState.state === GAME_STATE.CRASHED) {
      // Check if it's time to reset for a new round
      if (gameState.nextGameTime <= now) {
        // Reset for next game
        console.log(`Game crash cooldown complete, transitioning to INACTIVE`);
        await resetAllPlayersForNewRound(redis);
        
        await updateGameState(redis, {
          state: GAME_STATE.INACTIVE,
          nextGameTime: now + 2000, // Start next game in 2 seconds
          multiplier: 1.0,
          playersInGame: 0,
          onlinePlayers: activePlayers
        });
      }
    }
    
    return await getGameState(redis);
  } catch (error) {
    console.error('Error progressing game state:', error);
    throw error;
  }
};

// Record player activity for online player counting
const recordPlayerActivity = async (redis, username) => {
  try {
    if (!username) return;
    
    // Update last activity timestamp for this player
    await redis.hset('crashout:active-players', username, Date.now().toString());
    
    // Clean up old entries periodically
    const shouldCleanup = Math.random() < 0.1; // 10% chance to perform cleanup on any request
    if (shouldCleanup) {
      // Get all player activity timestamps
      const allPlayers = await redis.hgetall('crashout:active-players');
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      // Remove inactive players
      for (const [player, timestamp] of Object.entries(allPlayers)) {
        if (parseInt(timestamp) < fiveMinutesAgo) {
          await redis.hdel('crashout:active-players', player);
        }
      }
    }
  } catch (error) {
    console.error('Error recording player activity:', error);
    // Non-critical failure, so don't throw
  }
};

// Main API handler
export default async function handler(req, res) {
  // Allow both GET and POST for better Vercel compatibility
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  // For GET requests, return game state too, not just health check
  if (req.method === 'GET') {
    let redis;
    try {
      // Test Redis connection for GET requests too
      redis = getRedisClient();
      await redis.ping();
      
      // Fetch current game state
      let gameState;
      try {
        gameState = await getGameState(redis);
        // Update the game state based on time elapsed
        gameState = await progressGameState(redis);
      } catch (stateError) {
        console.error('Error fetching or processing game state:', stateError);
        gameState = {
          state: GAME_STATE.INACTIVE,
          multiplier: 1.0,
          countdown: 10,
          error: stateError.message
        };
      }
      
      // Get game history
      let history = [];
      try {
        history = await getGameHistory(redis);
      } catch (historyError) {
        console.error('Error fetching game history:', historyError);
      }
      
      // Get recent cashouts
      let cashouts = [];
      try {
        cashouts = await getRecentCashouts(redis);
      } catch (cashoutError) {
        console.error('Error fetching recent cashouts:', cashoutError);
      }
      
      // Count online players
      let onlinePlayers = 0;
      try {
        onlinePlayers = await countActivePlayers(redis);
      } catch (playersError) {
        console.error('Error counting active players:', playersError);
      }
      
      if (redis) redis.disconnect();
      
      return res.status(200).json({ 
        success: true, 
        message: 'Game API is running', 
        timestamp: Date.now(),
        redis: 'connected',
        gameState,
        history,
        cashouts,
        onlinePlayers
      });
    } catch (redisError) {
      console.error('Redis connection error during health check:', redisError);
      if (redis) {
        try {
          redis.disconnect();
        } catch (disconnectError) {
          console.error('Error disconnecting Redis client:', disconnectError);
        }
      }
      
      // Return a more detailed error response
      return res.status(200).json({
        success: false,
        message: 'Game API is running but Redis is not connected',
        error: redisError.message,
        errorType: redisError.name,
        timestamp: Date.now(),
        redis: 'disconnected',
        gameState: {
          state: GAME_STATE.INACTIVE,
          multiplier: 1.0,
          countdown: 10
        },
        history: [],
        cashouts: [],
        onlinePlayers: 0
      });
    }
  }
  
  const { action, username } = req.body;
  let redis;
  
  try {
    console.log('Connecting to Redis with URL:', process.env.REDIS_URL ? 'REDIS_URL exists' : 'REDIS_URL missing');
    redis = getRedisClient();
    
    // Test Redis connection
    try {
      await redis.ping();
      console.log('Redis ping successful');
    } catch (pingError) {
      console.error('Redis ping failed:', pingError);
      return res.status(500).json({ 
        success: false, 
        message: 'Unable to connect to Redis database',
        error: pingError.message 
      });
    }
    
    // Record player activity for online count 
    if (username) {
      await recordPlayerActivity(redis, username);
    }
    
    // Handle different API actions
    switch (action) {
      case 'sync': {
        // Get latest game state
        let gameState = null;
        try {
          gameState = await getGameState(redis);
          
          // Progress the game state based on elapsed time
          // This replaces the cron job for most common state transitions
          gameState = await progressGameState(redis);
        } catch (stateError) {
          console.error('Error fetching or processing game state during sync:', stateError);
          gameState = {
            state: GAME_STATE.INACTIVE,
            multiplier: 1.0,
            countdown: 10,
            error: stateError.message
          };
        }
        
        // Get game history
        let history = [];
        try {
          history = await getGameHistory(redis);
        } catch (historyError) {
          console.error('Error fetching game history during sync:', historyError);
        }
        
        // Get recent cashouts
        let cashouts = [];
        try {
          cashouts = await getRecentCashouts(redis);
        } catch (cashoutError) {
          console.error('Error fetching recent cashouts during sync:', cashoutError);
        }
        
        // Get player-specific data if a username was provided
        let playerData = null;
        if (username) {
          try {
            playerData = await getPlayerData(redis, username);
          } catch (playerError) {
            console.error(`Error fetching player data for ${username} during sync:`, playerError);
            playerData = { 
              betAmount: 0, 
              autoCashout: 2.0, 
              joined: false, 
              cashedOut: false,
              error: playerError.message 
            };
          }
        }
        
        // Count online players
        let onlinePlayers = 0;
        try {
          onlinePlayers = await countActivePlayers(redis);
        } catch (playersError) {
          console.error('Error counting active players during sync:', playersError);
        }
        
        return res.status(200).json({
          success: true,
          gameState,
          history,
          cashouts,
          onlinePlayers,
          playerData
        });
      }
      
      case 'placeBet': {
        const { betAmount, autoCashout } = req.body;
        if (!username) {
          return res.status(400).json({ success: false, message: 'Username is required' });
        }
        
        const result = await placeBet(redis, username, parseFloat(betAmount), parseFloat(autoCashout));
        return res.status(result.success ? 200 : 400).json(result);
      }
      
      case 'cashout': {
        if (!username) {
          return res.status(400).json({ success: false, message: 'Username is required' });
        }
        
        const result = await processCashout(redis, username);
        return res.status(result.success ? 200 : 400).json(result);
      }
      
      case 'playerActivity': {
        const { oldUsername, betAmount, autoCashout } = req.body;
        
        // Handle username change if applicable
        if (oldUsername && oldUsername !== username) {
          // Copy any existing player data to new username
          const oldPlayerData = await getPlayerData(redis, oldUsername);
          await updatePlayerData(redis, username, {
            ...oldPlayerData,
            betAmount: parseFloat(betAmount) || oldPlayerData.betAmount,
            autoCashout: parseFloat(autoCashout) || oldPlayerData.autoCashout
          });
          
          // Delete old player data if it exists
          await redis.del(`crashout:player:${oldUsername}`);
        } else {
          // Update preferences if provided
          if (betAmount || autoCashout) {
            await updatePlayerData(redis, username, {
              betAmount: parseFloat(betAmount) || undefined,
              autoCashout: parseFloat(autoCashout) || undefined
            });
          }
        }
        
        return res.status(200).json({ success: true });
      }
      
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error(`Error in ${action} handler:`, error);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    // Close Redis connection
    redis.disconnect();
  }
} 