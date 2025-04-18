import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.error('FATAL: Upstash Redis environment variables UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set.');
      // In a real app, you might throw an error or handle this more gracefully depending on required uptime.
      // For now, we log a fatal error and potentially let it fail downstream.
      // You could throw new Error(...) here to halt execution if Redis is critical.
       throw new Error('Missing Upstash Redis connection details in environment variables');
    }
    
    console.log("Initializing Upstash Redis client...");
    redis = new Redis({
      url: url,
      token: token,
    });
    console.log("Upstash Redis client initialized.");
  }
  return redis;
}

// Optional: Define common Redis keys centrally
export const REDIS_KEYS = {
  GAME_STATE: 'crashout:gameState', // Current state: inactive, countdown, active, crashed
  CURRENT_MULTIPLIER: 'crashout:multiplier',
  COUNTDOWN_VALUE: 'crashout:countdown',
  PLAYERS_JOINED_COUNT: 'crashout:playersJoined', 
  GAME_HISTORY: 'crashout:history', // Use Redis List (LPUSH, LRANGE, LTRIM)
  NEXT_GAME_START_TIME: 'crashout:nextGameStart', // Timestamp (ms)
  ACTIVE_PLAYERS: 'crashout:activePlayers', // Use a Set or Hash to store players in the current round
  PLAYER_BETS: (username: string) => `crashout:player:${username}:bet`, // Hash to store bet amount, autoCashout
  PLAYER_CASHOUT: (username: string) => `crashout:player:${username}:cashout`, // Store cashout multiplier if successful
  // Add other keys as needed (e.g., leaderboard)
}; 