// Redis status API endpoint
import Redis from 'ioredis';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  let redis = null;
  
  try {
    // Get Redis URL with proper masking for logging
    const redisUrl = process.env.REDIS_URL || '';
    const maskedUrl = redisUrl.replace(/:([^@]+)@/, ':******@');
    console.log('Checking Redis status with URL:', maskedUrl || 'REDIS_URL not set');
    
    if (!redisUrl) {
      return res.status(500).json({
        success: false,
        connected: false,
        message: 'REDIS_URL environment variable is not set',
        timestamp: Date.now()
      });
    }
    
    // Initialize Redis client with timeout
    redis = new Redis(process.env.REDIS_URL, {
      connectTimeout: 5000,
      maxRetriesPerRequest: 1
    });
    
    // Use ping to test connection
    const pong = await redis.ping();
    
    // Test some basic operations
    const testKey = 'redis-status-test';
    await redis.set(testKey, 'test-value');
    const testValue = await redis.get(testKey);
    await redis.del(testKey);
    
    const memoryInfo = await redis.info('memory');
    const serverInfo = await redis.info('server');
    
    return res.status(200).json({
      success: true,
      connected: true,
      pingResult: pong,
      testValue,
      memoryInfo,
      serverInfo,
      message: 'Redis is connected and operational',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Redis status check error:', error);
    
    return res.status(500).json({
      success: false,
      connected: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      message: 'Failed to connect to Redis',
      timestamp: Date.now()
    });
  } finally {
    // Clean up Redis connection
    if (redis) {
      try {
        redis.disconnect();
      } catch (e) {
        console.error('Error disconnecting Redis:', e);
      }
    }
  }
} 