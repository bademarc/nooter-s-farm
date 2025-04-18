// Automatic repair tool for Crashout Game Redis Data
import Redis from 'ioredis';

// Constants for game states (must match game/index.js)
const GAME_STATE = {
  INACTIVE: "inactive",
  COUNTDOWN: "countdown",
  ACTIVE: "active",
  CRASHED: "crashed",
  CASHED_OUT: "cashed_out",
};

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
    console.log('Auto-repair connecting to Redis with URL:', maskedUrl);
    
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
      console.error('Redis connection error in auto-repair:', err);
    });
    
    redis.on('connect', () => {
      console.log('Redis connected successfully for auto-repair');
    });
    
    return redis;
  } catch (error) {
    console.error('Error creating Redis client for auto-repair:', error);
    throw error;
  }
};

// Repair any corrupted data in the Redis store
const autoRepairData = async (redis, diagnosticData = {}) => {
  const results = {
    repaired: false,
    problems: [],
    fixedItems: [],
    gameState: null,
    history: null,
    diagnosticData,
  };
  
  try {
    // Check if game state is corrupted
    const gameStateRaw = await redis.get('crashout:gameState');
    
    let currentGameState = null;
    let gameStateCorrupted = false;
    
    try {
      // Try to parse the game state
      if (gameStateRaw) {
        currentGameState = JSON.parse(gameStateRaw);
      }
    } catch (parseError) {
      gameStateCorrupted = true;
      results.problems.push({
        type: 'gameState', 
        error: parseError.message,
        raw: gameStateRaw.slice(0, 50) + (gameStateRaw.length > 50 ? '...' : '')
      });
      
      // Create a recovery game state
      currentGameState = {
        state: GAME_STATE.INACTIVE,
        multiplier: 1.0,
        countdown: 10,
        nextGameTime: Date.now() + 5000,
        playersInGame: 0,
        onlinePlayers: 0,
        crashPoint: 0,
        joinWindowTimeLeft: 0,
        lastUpdate: Date.now(),
        wasAutoRepaired: true,
        repairTime: new Date().toISOString()
      };
      
      // Save the recovery state
      await redis.set('crashout:gameState', JSON.stringify(currentGameState));
      results.repaired = true;
      results.fixedItems.push('gameState');
    }
    
    results.gameState = currentGameState;
    
    // Check history for corrupted items
    const historyRaw = await redis.lrange('crashout:history', 0, -1);
    const validHistoryItems = [];
    const corruptedHistoryItems = [];
    
    for (const item of historyRaw) {
      try {
        const parsedItem = JSON.parse(item);
        validHistoryItems.push(item);
      } catch (parseError) {
        corruptedHistoryItems.push({
          raw: item.slice(0, 50) + (item.length > 50 ? '...' : ''),
          error: parseError.message
        });
      }
    }
    
    if (corruptedHistoryItems.length > 0) {
      results.problems.push({
        type: 'history',
        corruptedItems: corruptedHistoryItems,
        validCount: validHistoryItems.length,
        corruptedCount: corruptedHistoryItems.length
      });
      
      // Rebuild history with only valid items
      await redis.del('crashout:history');
      
      if (validHistoryItems.length > 0) {
        await redis.lpush('crashout:history', ...validHistoryItems);
      } else {
        // Add a default item if all were corrupted
        const defaultItem = {
          crashPoint: 2.0,
          timestamp: Date.now(),
          color: "green",
          wasAutoRepaired: true,
          repairTime: new Date().toISOString()
        };
        await redis.lpush('crashout:history', JSON.stringify(defaultItem));
      }
      
      results.repaired = true;
      results.fixedItems.push('history');
    }
    
    // Get the updated history
    const updatedHistoryRaw = await redis.lrange('crashout:history', 0, 10);
    results.history = updatedHistoryRaw.map(item => {
      try {
        return JSON.parse(item);
      } catch (e) {
        return { error: e.message, raw: item.slice(0, 30) };
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error in auto-repair process:', error);
    return {
      repaired: false,
      error: error.message,
      diagnosticData
    };
  }
};

export default async function handler(req, res) {
  // This endpoint should be called by client code when JSON parsing errors are detected
  // Optional: restrict to internal requests only
  // const isInternalRequest = req.headers['x-internal-request'] === process.env.INTERNAL_REQUEST_KEY;
  // if (!isInternalRequest) return res.status(403).json({ error: 'Unauthorized' });
  
  const { errorData } = req.body || {};
  let redis;
  
  try {
    redis = getRedisClient();
    await redis.ping();
    
    const repairResults = await autoRepairData(redis, errorData);
    
    redis.disconnect();
    
    return res.status(200).json({
      success: true,
      repaired: repairResults.repaired,
      message: repairResults.repaired 
        ? 'Auto-repair completed successfully'
        : 'No issues requiring repair were found',
      timestamp: Date.now(),
      results: repairResults
    });
  } catch (error) {
    console.error('Error in auto-repair handler:', error);
    
    if (redis) {
      try {
        redis.disconnect();
      } catch (e) {
        console.error('Error disconnecting from Redis in auto-repair:', e);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Auto-repair failed',
      error: error.message,
      timestamp: Date.now()
    });
  }
} 