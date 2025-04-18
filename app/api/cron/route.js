import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL || 'redis://default:AThgAAIjcDEyMjQ5OWE4Y2IwNTQ0ZjM4YjM3NjZlZTkzMDJlNWRkNHAxMA@suited-jaguar-14432.upstash.io:6379',
  token: process.env.REDIS_TOKEN,
});

export async function GET(req) {
  // Check for CRON_SECRET authentication
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Check last heartbeat and game state
    const lastHeartbeat = await redis.get('crashout:lastHeartbeat');
    const currentGameState = await redis.get('crashout:gameState');
    const now = Date.now();

    // If no heartbeat for 5 minutes, reset game state
    if (!lastHeartbeat || (now - parseInt(lastHeartbeat)) > 300000) {
      await redis.set('crashout:gameState', JSON.stringify({
        state: 'inactive',
        nextGameTime: now + 10000,
        lastReset: now
      }));
      console.log('Game state reset due to inactivity');
    }

    // 2. Clean up stale player data (inactive for more than 1 hour)
    const activePlayers = await redis.hgetall('crashout:players');
    if (activePlayers) {
      for (const [playerId, playerData] of Object.entries(activePlayers)) {
        const player = JSON.parse(playerData);
        if (now - player.lastActive > 3600000) {
          await redis.hdel('crashout:players', playerId);
          console.log(`Removed stale player: ${playerId}`);
        }
      }
    }

    // 3. Update game statistics
    const gameHistory = await redis.lrange('crashout:history', 0, 100);
    const stats = {
      totalGames: gameHistory.length,
      averageMultiplier: 0,
      timestamp: now
    };

    if (gameHistory.length > 0) {
      const sum = gameHistory.reduce((acc, game) => {
        const parsedGame = JSON.parse(game);
        return acc + parseFloat(parsedGame.crashPoint || 1);
      }, 0);
      stats.averageMultiplier = sum / gameHistory.length;
    }

    await redis.set('crashout:stats', JSON.stringify(stats));

    // Update heartbeat
    await redis.set('crashout:lastHeartbeat', now.toString());

    return NextResponse.json({ 
      success: true, 
      message: 'Game maintenance completed',
      statsUpdated: true,
      timestamp: now 
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ 
      error: 'Cron job failed', 
      message: error.message 
    }, { status: 500 });
  }
} 