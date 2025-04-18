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
    console.log('Auto-repair: Connecting to Redis with URL:', maskedUrl);
    
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
      console.error('Auto-repair: Redis connection error:', err);
    });
    
    redis.on('connect', () => {
      console.log('Auto-repair: Redis connected successfully');
    });
    
    return redis;
  } catch (error) {
    console.error('Auto-repair: Error creating Redis client:', error);
    throw error;
  }
};

// Function to repair history item JSON
const repairHistoryJson = (malformedJson) => {
  if (!malformedJson) return null;

  try {
    // First try regular JSON parse
    return JSON.parse(malformedJson);
  } catch (parseError) {
    try {
      // Extract values directly using regex
      const crashPointMatch = malformedJson.match(/crashPoint\\?:(\d+(\.\d+)?)/);
      const timestampMatch = malformedJson.match(/timestamp\\?:(\d+)/);
      const colorMatch = malformedJson.match(/color\\?:\\?(\w+)\\?/);
      
      console.log('Auto-repair regex extraction:', {
        crashPoint: crashPointMatch ? crashPointMatch[1] : 'not found',
        timestamp: timestampMatch ? timestampMatch[1] : 'not found',
        color: colorMatch ? colorMatch[1] : 'not found'
      });
      
      // Create a new object directly from the extracted values
      if (crashPointMatch || timestampMatch || colorMatch) {
        const crashPoint = crashPointMatch ? parseFloat(crashPointMatch[1]) : 1.0;
        const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();
        const color = colorMatch ? colorMatch[1] : "red";
        
        return {
          crashPoint,
          timestamp,
          color,
          recovered: true
        };
      }
      
      // Direct string manipulation as fallback
      if (malformedJson.includes('\\crashPoint\\:') && 
          malformedJson.includes('\\timestamp\\:') && 
          malformedJson.includes('\\color\\:')) {
        console.log('Auto-repair using direct string extraction');
        
        // Example: {\crashPoint\:2.5,\timestamp\:1745000000000,\color\:\green\}
        const crashPointStr = malformedJson.split('\\crashPoint\\:')[1]?.split(',')[0];
        const timestampStr = malformedJson.split('\\timestamp\\:')[1]?.split(',')[0];
        const colorStr = malformedJson.split('\\color\\:')[1]?.split('\\}')[0].replace('\\', '');
        
        console.log('Auto-repair manual parsing:', { crashPointStr, timestampStr, colorStr });
        
        // Create a brand new object with the parsed values
        return {
          crashPoint: crashPointStr ? parseFloat(crashPointStr) : 1.0,
          timestamp: timestampStr ? parseInt(timestampStr) : Date.now(),
          color: colorStr || "red",
          recovered: true,
          manuallyParsed: true
        };
      }
      
      // Fallback to default object as last resort
      return {
        crashPoint: 1.0,
        timestamp: Date.now(),
        color: "red",
        recovered: true,
        fallback: true
      };
    } catch (extractError) {
      console.error('Auto-repair: Extraction failed:', extractError);
      return null;
    }
  }
};

// Function to repair the entire history list
const repairHistoryList = async (redis) => {
  try {
    const historyRaw = await redis.lrange('crashout:history', 0, -1);
    let repairedCount = 0;
    
    for (let i = 0; i < historyRaw.length; i++) {
      const item = historyRaw[i];
      
      try {
        // Check if this item needs repair by attempting to parse it
        JSON.parse(item);
        // If we reach here, the item is already valid JSON
      } catch (parseError) {
        // Item needs repair
        const repaired = repairHistoryJson(item);
        
        if (repaired) {
          // Replace the item in Redis
          await redis.lset('crashout:history', i, JSON.stringify(repaired));
          repairedCount++;
        }
      }
    }
    
    return { 
      totalItems: historyRaw.length, 
      repairedCount 
    };
  } catch (error) {
    console.error('Error repairing history list:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  let redis = null;
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    // Initialize Redis client
    redis = getRedisClient();
    
    // Log information about the error that triggered the auto-repair
    console.log('Auto-repair triggered with error data:', req.body.errorData);
    
    // Repair history list
    const historyRepairResults = await repairHistoryList(redis);
    
    // Close Redis connection
    if (redis) {
      redis.disconnect();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Auto-repair completed successfully',
      repaired: historyRepairResults.repairedCount > 0,
      historyRepairResults
    });
  } catch (error) {
    console.error('Auto-repair error:', error);
    
    // Close Redis connection if open
    if (redis) {
      redis.disconnect();
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error during auto-repair',
      error: error.message
    });
  }
} 