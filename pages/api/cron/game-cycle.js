// Daily Maintenance Cron Job for Crashout Game
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

// Clean up inactive players (no activity in last 7 days)
const cleanupInactivePlayers = async (redis) => {
  try {
    // Get all player keys
    const playerKeys = await redis.keys('crashout:player:*');
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days in ms
    let removedCount = 0;
    
    for (const key of playerKeys) {
      const playerData = await redis.get(key);
      if (playerData) {
        const parsed = JSON.parse(playerData);
        // If player has no lastUpdate or it's older than 7 days
        if (!parsed.lastUpdate || parsed.lastUpdate < sevenDaysAgo) {
          await redis.del(key);
          removedCount++;
        }
      }
    }
    
    return removedCount;
  } catch (error) {
    console.error('Error cleaning up inactive players:', error);
    throw error;
  }
};

// Clean up online players tracking
const cleanupOnlinePlayers = async (redis) => {
  try {
    // Get all online players
    const allPlayers = await redis.hgetall('crashout:active-players');
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000); // 1 day in ms
    let removedCount = 0;
    
    // Remove players inactive for more than a day
    for (const [player, timestamp] of Object.entries(allPlayers)) {
      if (parseInt(timestamp) < oneDayAgo) {
        await redis.hdel('crashout:active-players', player);
        removedCount++;
      }
    }
    
    return removedCount;
  } catch (error) {
    console.error('Error cleaning up online players:', error);
    throw error;
  }
};

// Archive old game history data (keeps Redis data size manageable)
const archiveOldGameHistory = async (redis) => {
  try {
    // Get current history length
    const historyLength = await redis.llen('crashout:history');
    
    // If we have more than 100 items, trim to 50
    if (historyLength > 100) {
      await redis.ltrim('crashout:history', 0, 49);
      return historyLength - 50; // Number of items removed
    }
    
    return 0;
  } catch (error) {
    console.error('Error archiving old game history:', error);
    throw error;
  }
};

// Reset game state if stuck
const resetStuckGameState = async (redis) => {
  try {
    const gameState = await getGameState(redis);
    const now = Date.now();
    
    // Check if game state is potentially stuck
    if (gameState.lastUpdate && (now - gameState.lastUpdate) > (30 * 60 * 1000)) { // 30 minutes
      // Game state hasn't been updated in 30 minutes, likely stuck
      console.log('Detected potentially stuck game state, resetting...');
      
      // Reset to inactive state
      await updateGameState(redis, {
        state: GAME_STATE.INACTIVE,
        multiplier: 1.0,
        countdown: 10,
        nextGameTime: now + 5000,
        playersInGame: 0,
        onlinePlayers: 0,
        crashPoint: 0,
        joinWindowTimeLeft: 0,
        lastUpdate: now,
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error resetting stuck game state:', error);
    throw error;
  }
};

// Generate daily statistics
const generateDailyStats = async (redis) => {
  try {
    // Get all recorded game history for the past day
    const historyRaw = await redis.lrange('crashout:history', 0, -1);
    const history = historyRaw.map(item => JSON.parse(item));
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    // Filter to last 24 hours
    const recentHistory = history.filter(item => item.timestamp > oneDayAgo);
    
    if (recentHistory.length === 0) {
      return {
        gamesPlayed: 0,
        averageCrashPoint: 0,
        highestCrashPoint: 0,
        lowestCrashPoint: 0
      };
    }
    
    // Calculate stats
    const crashPoints = recentHistory.map(item => 
      typeof item.crashPoint === 'string' ? parseFloat(item.crashPoint) : item.crashPoint
    );
    
    const stats = {
      gamesPlayed: recentHistory.length,
      averageCrashPoint: crashPoints.reduce((a, b) => a + b, 0) / crashPoints.length,
      highestCrashPoint: Math.max(...crashPoints),
      lowestCrashPoint: Math.min(...crashPoints)
    };
    
    // Store daily stats
    await redis.set(`crashout:stats:${new Date().toISOString().split('T')[0]}`, JSON.stringify(stats));
    
    return stats;
  } catch (error) {
    console.error('Error generating daily stats:', error);
    throw error;
  }
};

// Main cron job handler - runs once per day
export default async function handler(req, res) {
  // Verify this is a cron job request from Vercel
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  const redis = getRedisClient();
  
  try {
    console.log('Running daily maintenance for Crashout game...');
    
    // Perform maintenance tasks
    const inactivePlayersRemoved = await cleanupInactivePlayers(redis);
    const onlinePlayersRemoved = await cleanupOnlinePlayers(redis);
    const historyItemsArchived = await archiveOldGameHistory(redis);
    const wasGameStateReset = await resetStuckGameState(redis);
    const dailyStats = await generateDailyStats(redis);
    
    // Return summary of maintenance activities
    return res.status(200).json({
      success: true,
      maintenance: {
        inactivePlayersRemoved,
        onlinePlayersRemoved,
        historyItemsArchived,
        wasGameStateReset
      },
      dailyStats
    });
  } catch (error) {
    console.error('Error in daily maintenance cron job:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    // Close Redis connection
    redis.disconnect();
  }
} 