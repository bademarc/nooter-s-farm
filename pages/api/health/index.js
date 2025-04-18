// Health check API route
import Redis from 'ioredis';

// Initialize Redis client with debugging
const getRedisClient = () => {
  try {
    // Log Redis connection details (without exposing password)
    const redisUrl = process.env.REDIS_URL || '';
    const maskedUrl = redisUrl.replace(/:([^@]+)@/, ':******@');
    console.log('Health check connecting to Redis with URL:', maskedUrl || 'REDIS_URL not set');
    
    // Additional options for better Vercel compatibility
    const options = {
      enableAutoPipelining: false, // Disable auto pipelining for better compatibility
      connectTimeout: 10000,       // Increase timeout
      retryStrategy: (times) => {  // Simple retry strategy
        return Math.min(times * 50, 2000);
      }
    };
    
    // Initialize Redis client with options
    const redis = new Redis(process.env.REDIS_URL, options);
    
    // Handle connection events
    redis.on('error', (err) => {
      console.error('Redis connection error in health check:', err);
    });
    
    redis.on('connect', () => {
      console.log('Redis connected successfully in health check');
    });
    
    return redis;
  } catch (error) {
    console.error('Error creating Redis client in health check:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  // Return environment info (without sensitive data)
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_REGION: process.env.VERCEL_REGION,
    REDIS_URL_EXISTS: process.env.REDIS_URL ? true : false
  };

  // Test Redis connection
  let redisStatus = 'disconnected';
  let redisError = null;
  
  try {
    const redis = getRedisClient();
    await redis.ping();
    redisStatus = 'connected';
    redis.disconnect();
  } catch (error) {
    console.error('Redis health check failed:', error);
    redisStatus = 'error';
    redisError = error.message;
  }
  
  return res.status(200).json({
    success: redisStatus === 'connected',
    timestamp: Date.now(),
    redis: {
      status: redisStatus,
      error: redisError
    },
    environment: envInfo
  });
} 