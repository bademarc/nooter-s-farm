// Redis repair tool for Crashout Game
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
    
    return redis;
  } catch (error) {
    console.error('Error creating Redis client:', error);
    throw error;
  }
};

// Repair all game data in Redis
const repairGameData = async (redis) => {
  const results = {
    gameState: {
      before: null,
      after: null,
      repaired: false,
      error: null
    },
    playerData: [],
    history: {
      valid: 0,
      repaired: 0,
      error: null
    },
    cashouts: {
      valid: 0,
      repaired: 0,
      error: null
    }
  };
  
  // Repair game state
  try {
    const gameStateRaw = await redis.get('crashout:gameState');
    results.gameState.before = gameStateRaw;
    
    let gameState;
    try {
      // Try to parse
      if (gameStateRaw) {
        gameState = JSON.parse(gameStateRaw);
      }
    } catch (parseError) {
      // Create a fresh game state
      gameState = {
        state: GAME_STATE.INACTIVE,
        multiplier: 1.0,
        countdown: 10,
        nextGameTime: Date.now() + 5000,
        playersInGame: 0,
        onlinePlayers: 0,
        crashPoint: 0,
        joinWindowTimeLeft: 0,
        lastUpdate: Date.now(),
        wasRepaired: true
      };
      
      // Save the repaired state
      await redis.set('crashout:gameState', JSON.stringify(gameState));
      results.gameState.repaired = true;
    }
    
    results.gameState.after = gameState;
  } catch (error) {
    results.gameState.error = error.message;
  }
  
  // Repair player data
  try {
    // Get all player keys
    const playerKeys = await redis.keys('crashout:player:*');
    
    for (const key of playerKeys) {
      const playerResult = {
        key,
        before: null,
        after: null,
        repaired: false,
        error: null
      };
      
      try {
        const playerDataRaw = await redis.get(key);
        playerResult.before = playerDataRaw;
        
        let playerData;
        try {
          // Try to parse
          if (playerDataRaw) {
            playerData = JSON.parse(playerDataRaw);
          }
        } catch (parseError) {
          // Create a default player data
          playerData = { 
            betAmount: 0, 
            autoCashout: 2.0, 
            joined: false, 
            cashedOut: false,
            wasRepaired: true
          };
          
          // Save the repaired data
          await redis.set(key, JSON.stringify(playerData));
          playerResult.repaired = true;
        }
        
        playerResult.after = playerData;
      } catch (error) {
        playerResult.error = error.message;
      }
      
      results.playerData.push(playerResult);
    }
  } catch (error) {
    results.playerData.error = error.message;
  }
  
  // Repair history data
  try {
    const historyRaw = await redis.lrange('crashout:history', 0, -1);
    let validItems = [];
    
    for (const item of historyRaw) {
      try {
        const historyItem = JSON.parse(item);
        validItems.push(item); // Keep valid items
        results.history.valid++;
      } catch (parseError) {
        // This item is corrupted - ignore it
        results.history.repaired++;
      }
    }
    
    // If we had to repair any items, rebuild the list with only valid items
    if (results.history.repaired > 0) {
      await redis.del('crashout:history');
      
      // Only restore if we have valid items
      if (validItems.length > 0) {
        await redis.lpush('crashout:history', ...validItems);
      } else {
        // Add a default item if all were corrupted
        const defaultItem = {
          crashPoint: 2.0,
          timestamp: Date.now(),
          color: "green",
          wasRepaired: true
        };
        await redis.lpush('crashout:history', JSON.stringify(defaultItem));
      }
    }
  } catch (error) {
    results.history.error = error.message;
  }
  
  // Repair cashouts data
  try {
    const cashoutsRaw = await redis.lrange('crashout:cashouts', 0, -1);
    let validItems = [];
    
    for (const item of cashoutsRaw) {
      try {
        const cashoutItem = JSON.parse(item);
        validItems.push(item); // Keep valid items
        results.cashouts.valid++;
      } catch (parseError) {
        // This item is corrupted - ignore it
        results.cashouts.repaired++;
      }
    }
    
    // If we had to repair any items, rebuild the list with only valid items
    if (results.cashouts.repaired > 0) {
      await redis.del('crashout:cashouts');
      
      // Only restore if we have valid items
      if (validItems.length > 0) {
        await redis.lpush('crashout:cashouts', ...validItems);
      }
    }
  } catch (error) {
    results.cashouts.error = error.message;
  }
  
  return results;
};

export default async function handler(req, res) {
  // Restrict access to authorized requests with admin key
  const { adminKey } = req.query;
  const correctKey = process.env.ADMIN_REPAIR_KEY || 'farmAdmin123';
  
  if (adminKey !== correctKey) {
    return res.status(403).json({ success: false, message: 'Unauthorized access' });
  }
  
  let redis;
  
  try {
    redis = getRedisClient();
    await redis.ping();
    
    const results = await repairGameData(redis);
    
    redis.disconnect();
    
    return res.status(200).json({
      success: true,
      message: 'Repair operation completed',
      results,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error in Redis repair operation:', error);
    
    if (redis) {
      try {
        redis.disconnect();
      } catch(e) {
        console.error('Error disconnecting Redis:', e);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Redis repair operation failed',
      error: error.message,
      timestamp: Date.now()
    });
  }
} 