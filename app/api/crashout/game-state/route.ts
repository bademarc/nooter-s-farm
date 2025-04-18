import { NextResponse } from 'next/server';
// Remove pusher import, it's handled by the engine
// import { getPusherServer } from '@/utils/pusher-server'; 
import { getRedisClient, REDIS_KEYS } from '@/utils/redis';

// Remove static export - This needs to be dynamic
// export const dynamic = 'force-static'; 

// Remove local interfaces/state - Handled by engine


// GET handler simply returns the current state from the engine
export async function GET() {
  console.log("API Route: GET /api/crashout/game-state invoked");
  try {
    const redis = getRedisClient();

    // Fetch multiple values efficiently using a pipeline
    const pipeline = redis.pipeline();
    pipeline.get(REDIS_KEYS.GAME_STATE);
    pipeline.get(REDIS_KEYS.CURRENT_MULTIPLIER);
    pipeline.get(REDIS_KEYS.COUNTDOWN_VALUE);
    pipeline.get(REDIS_KEYS.PLAYERS_JOINED_COUNT);
    pipeline.lrange(REDIS_KEYS.GAME_HISTORY, 0, 19); // Get latest 20 history items
    pipeline.get(REDIS_KEYS.NEXT_GAME_START_TIME);

    console.log("Executing Redis pipeline...");
    const results = await pipeline.exec<[
        string | null,      // GAME_STATE
        string | null,      // CURRENT_MULTIPLIER
        string | null,      // COUNTDOWN_VALUE
        string | null,      // PLAYERS_JOINED_COUNT
        string[] | null,    // GAME_HISTORY (LRANGE returns string[])
        string | null       // NEXT_GAME_START_TIME
    ]>();
    console.log("Redis pipeline results:", results);

    const [
      state,
      multiplierStr,
      countdownStr,
      playersJoinedStr,
      historyJsonArray,
      nextGameStartStr,
    ] = results;

    // --- Data Parsing and Formatting ---
    const parsedState = state ?? 'inactive'; // Default state
    const multiplier = multiplierStr ? parseFloat(multiplierStr) : 1.0;
    const countdown = countdownStr ? parseInt(countdownStr, 10) : null;
    const playersJoined = playersJoinedStr ? parseInt(playersJoinedStr, 10) : 0;
    const nextGameStart = nextGameStartStr ? parseInt(nextGameStartStr, 10) : null;

    // Parse history entries (assuming they are stored as JSON strings)
    const history = historyJsonArray
      ? historyJsonArray.map(entryStr => {
          try {
            // Basic validation: check if it looks like JSON
            if (entryStr && entryStr.startsWith('{') && entryStr.endsWith('}')) {
                const parsedEntry = JSON.parse(entryStr);
                // Ensure expected fields exist
                return {
                    value: String(parsedEntry.value || '?.??'),
                    color: String(parsedEntry.color || 'grey'),
                    timestamp: Number(parsedEntry.timestamp || Date.now())
                };
            } else {
                console.warn(`Invalid history entry format in Redis: ${entryStr}`);
                return { value: "err", color: "red", timestamp: Date.now() };
            }
          } catch (e) {
            console.error(`Error parsing history entry: ${entryStr}`, e);
            return { value: "err", color: "red", timestamp: Date.now() }; // Fallback for invalid JSON
          }
        })
      : [];

    // --- Response Payload ---
    const responsePayload = {
      state: parsedState,
      multiplier: multiplier,
      countdown: countdown,
      playersJoined: playersJoined,
      history: history,
      nextGameStart: nextGameStart,
      // You might want to fetch/include onlinePlayersCount if stored separately
    };

    console.log("Sending game state response:", responsePayload);
    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error("API Error: GET /api/crashout/game-state - ", error);
    // Return a structured error response
    return NextResponse.json({
        error: "Failed to fetch game state from server.",
        details: error instanceof Error ? error.message : 'Unknown error',
        // Provide safe fallback defaults for the frontend
        state: 'error',
        multiplier: 1.0,
        countdown: null,
        playersJoined: 0,
        history: [],
        nextGameStart: null,
    }, { status: 500 });
  }
}

// Remove all game loop logic (startCountdown, startGame, endGame) - It lives in the engine now 

// Optional: If your frontend absolutely requires POST for this route
// export async function POST() {
//   console.log("API Route: POST /api/crashout/game-state invoked");
//   // You can simply call the GET handler if the logic is the same
//   return GET();
// } 