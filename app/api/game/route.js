import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL || 'redis://default:AThgAAIjcDEyMjQ5OWE4Y2IwNTQ0ZjM4YjM3NjZlZTkzMDJlNWRkNHAxMA@suited-jaguar-14432.upstash.io:6379',
  token: process.env.REDIS_TOKEN,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, username, crashPoint, playerCount, activePlayers, betAmount, autoCashout } = body;

    // Update heartbeat on any valid request
    await redis.set('crashout:lastHeartbeat', Date.now().toString());

    // Simple game API that handles common actions without complex client logic
    switch (action) {
      case 'logCrash':
        if (!crashPoint) {
          return NextResponse.json({ error: 'Missing crash point' }, { status: 400 });
        }
        
        // Log the crash
        const gameResult = {
          crashPoint,
          playerCount: playerCount || 0,
          activePlayerCount: activePlayers || 0,
          timestamp: Date.now()
        };
        
        await redis.lpush('crashout:history', JSON.stringify(gameResult));
        await redis.ltrim('crashout:history', 0, 99);
        
        // Update game state
        await redis.set('crashout:gameState', JSON.stringify({
          state: 'inactive',
          nextGameTime: Date.now() + 10000,
          lastUpdate: Date.now()
        }));
        
        return NextResponse.json({ success: true });
        
      case 'playerActivity':
        if (!username) {
          return NextResponse.json({ error: 'Missing username' }, { status: 400 });
        }
        
        // Update player data
        const playerData = {
          username,
          lastBet: betAmount || 0,
          autoCashout: autoCashout || 2.0,
          lastActive: Date.now()
        };
        
        await redis.hset('crashout:players', username, JSON.stringify(playerData));
        return NextResponse.json({ success: true });
        
      case 'sync':
        // Get game state
        const gameState = await redis.get('crashout:gameState');
        
        // Get recent history
        const history = await redis.lrange('crashout:history', 0, 49);
        const parsedHistory = history.map(item => JSON.parse(item));
        
        // Get stats
        const stats = await redis.get('crashout:stats');
        
        return NextResponse.json({
          success: true,
          gameState: gameState ? JSON.parse(gameState) : null,
          history: parsedHistory,
          stats: stats ? JSON.parse(stats) : null
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Game API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 