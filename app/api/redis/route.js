import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL || 'redis://default:AThgAAIjcDEyMjQ5OWE4Y2IwNTQ0ZjM4YjM3NjZlZTkzMDJlNWRkNHAxMA@suited-jaguar-14432.upstash.io:6379',
  token: process.env.REDIS_TOKEN,
});

export async function GET(req) {
  try {
    // Handle different operations based on query params
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'getGameState') {
      // Get current game state
      const gameState = await redis.get('crashout:gameState');
      return NextResponse.json({ success: true, gameState: gameState ? JSON.parse(gameState) : null });
    } 
    else if (action === 'getHistory') {
      // Get game history
      const history = await redis.lrange('crashout:history', 0, 49);
      return NextResponse.json({ 
        success: true, 
        history: history.map(item => JSON.parse(item))
      });
    }
    else if (action === 'getStats') {
      // Get game stats
      const stats = await redis.get('crashout:stats');
      return NextResponse.json({ success: true, stats: stats ? JSON.parse(stats) : null });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Redis API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, data } = body;

    // Update heartbeat on any valid request
    await redis.set('crashout:lastHeartbeat', Date.now().toString());

    if (action === 'updatePlayer') {
      // Validate required fields
      if (!data.playerId) {
        return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
      }

      // Update player data
      const playerData = {
        ...data,
        lastActive: Date.now()
      };
      
      await redis.hset('crashout:players', data.playerId, JSON.stringify(playerData));
      return NextResponse.json({ success: true });
    }
    else if (action === 'logGameResult') {
      // Validate game result data
      if (!data.crashPoint) {
        return NextResponse.json({ error: 'Crash point required' }, { status: 400 });
      }

      // Add to history
      const gameResult = {
        ...data,
        timestamp: Date.now()
      };
      
      await redis.lpush('crashout:history', JSON.stringify(gameResult));
      // Trim to 100 entries
      await redis.ltrim('crashout:history', 0, 99);
      
      return NextResponse.json({ success: true });
    }
    else if (action === 'updateGameState') {
      // Update game state
      await redis.set('crashout:gameState', JSON.stringify({
        ...data,
        lastUpdate: Date.now()
      }));
      return NextResponse.json({ success: true });
    }
    else if (action === 'updateHeartbeat') {
      // Just update the heartbeat timestamp (already done above)
      return NextResponse.json({ success: true });
    }
    else if (action === 'updateStats') {
      // Update game statistics based on client data
      const currentStats = await redis.get('crashout:stats');
      const parsedStats = currentStats ? JSON.parse(currentStats) : {};
      
      const updatedStats = {
        ...parsedStats,
        ...data,
        lastClientUpdate: Date.now()
      };
      
      await redis.set('crashout:stats', JSON.stringify(updatedStats));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Redis API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 