// Redis URL validator API route
import Redis from 'ioredis';

export default async function handler(req, res) {
  const redisUrl = process.env.REDIS_URL;
  
  // Check if Redis URL exists
  if (!redisUrl) {
    return res.status(200).json({
      success: false,
      error: 'REDIS_URL environment variable is not set',
      tip: 'Make sure to set the REDIS_URL environment variable in your Vercel project settings'
    });
  }
  
  // Basic format validation
  let formatValid = false;
  let formatError = null;
  let parsedUrl = null;
  
  try {
    // Try to parse the URL to check its format
    // Redacted URLs for security
    if (redisUrl.startsWith('redis://')) {
      formatValid = true;
      
      // Basic parsing for diagnostics (without exposing credentials)
      const urlParts = redisUrl.split('@');
      if (urlParts.length > 1) {
        const hostPart = urlParts[1];
        parsedUrl = {
          protocol: 'redis://',
          hasCredentials: true,
          host: hostPart.split(':')[0],
          hasPort: hostPart.includes(':')
        };
      }
    } else {
      formatError = 'URL does not start with redis://';
    }
  } catch (e) {
    formatError = 'Invalid URL format';
  }
  
  // Test actual connection
  let connectionValid = false;
  let connectionError = null;
  
  if (formatValid) {
    try {
      const redis = new Redis(redisUrl, {
        connectTimeout: 10000,
        retryStrategy: (times) => {
          return Math.min(times * 50, 2000);
        }
      });
      
      // Add a timeout to avoid hanging
      const connectionTimeout = setTimeout(() => {
        try {
          redis.disconnect();
        } catch (e) {
          // Ignore
        }
        
        if (!connectionValid) {
          connectionError = 'Connection timeout after 10 seconds';
        }
      }, 10000);
      
      // Test connection
      await redis.ping();
      connectionValid = true;
      
      // Clear timeout and disconnect
      clearTimeout(connectionTimeout);
      redis.disconnect();
    } catch (e) {
      connectionError = e.message;
    }
  }
  
  return res.status(200).json({
    success: formatValid && connectionValid,
    url: {
      exists: Boolean(redisUrl),
      format: formatValid ? 'valid' : 'invalid',
      formatError,
      parsed: parsedUrl
    },
    connection: {
      status: connectionValid ? 'connected' : 'failed',
      error: connectionError
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION
    },
    recommendations: !formatValid
      ? ['Check your REDIS_URL format - it should start with redis://']
      : !connectionValid
      ? [
          'Make sure your Upstash Redis instance is running',
          'Check if your Redis instance allows connections from Vercel',
          'Verify that the password in the URL is correct',
          'Make sure you\'re using the correct host and port'
        ]
      : ['Your Redis configuration appears to be working correctly']
  });
} 