// API endpoint to debug Vercel environment variables
// DO NOT USE IN PRODUCTION - Contains sensitive information

export default function handler(req, res) {
  // Only allow in development or with secret
  if (process.env.NODE_ENV === 'production' && req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get environment variables (mask sensitive data)
  const redisUrl = process.env.REDIS_URL || '';
  const maskedRedisUrl = redisUrl
    ? redisUrl.replace(/(redis:\/\/[^:]+:)([^@]+)(@.+)/, '$1********$3')
    : 'Not set';

  // Get all environment variables names
  const allEnvKeys = Object.keys(process.env).sort();
  
  // Return sanitized environment info
  return res.status(200).json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION,
      VERCEL_URL: process.env.VERCEL_URL,
    },
    redis: {
      url_set: Boolean(process.env.REDIS_URL),
      masked_url: maskedRedisUrl,
    },
    env_keys: allEnvKeys,
  });
} 