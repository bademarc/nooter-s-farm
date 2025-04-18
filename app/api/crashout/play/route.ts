import { NextResponse } from 'next/server';
import { getRedisClient, REDIS_KEYS } from '@/utils/redis';
import { getPusherServer } from '@/utils/pusher-server'; // Assuming you have a Pusher server util

// Define expected game states from shared constants if available
const GAME_STATE = {
  INACTIVE: "inactive",
  COUNTDOWN: "countdown",
  ACTIVE: "active",
  CRASHED: "crashed",
};

export async function POST(request: Request) {
  console.log("API Route: POST /api/crashout/play invoked");
  let requestBody;
  try {
    requestBody = await request.json();
    console.log("Request Body:", requestBody);
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { betAmount, autoCashout, username } = requestBody;

  // --- Input Validation ---
  if (typeof username !== 'string' || !username.trim()) {
    return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
  }
  const bet = typeof betAmount === 'number' ? betAmount : parseFloat(betAmount);
  const cashoutTarget = typeof autoCashout === 'number' ? autoCashout : parseFloat(autoCashout);

  if (isNaN(bet) || bet <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid bet amount (must be positive number)' }, { status: 400 });
  }
  if (isNaN(cashoutTarget) || cashoutTarget < 1.01) {
    return NextResponse.json({ success: false, error: 'Invalid auto cashout multiplier (must be >= 1.01)' }, { status: 400 });
  }
  // TODO: Add check for player's actual coin balance (requires fetching balance, likely from another source or Redis key)
  // const playerBalance = await fetchPlayerBalance(username); // Implement this
  // if (bet > playerBalance) {
  //   return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
  // }

  // --- Game State Check & Bet Placement ---
  try {
    const redis = getRedisClient();

    // Check current game state atomically
    const currentState = await redis.get(REDIS_KEYS.GAME_STATE);
    console.log("Current game state from Redis:", currentState);

    if (currentState !== GAME_STATE.COUNTDOWN && currentState !== GAME_STATE.INACTIVE) {
        // Strict check: only allow bets during countdown/inactive phase (adjust if needed)
        // If allowing bets during inactive, the engine needs to clear them before countdown
        console.warn(`Bet rejected: Game state is '${currentState}', not '${GAME_STATE.COUNTDOWN}' or '${GAME_STATE.INACTIVE}'.`);
        return NextResponse.json({ success: false, error: 'Betting window is closed' }, { status: 400 });
    }

    // Check if player already placed a bet for this round
    const alreadyPlacedBet = await redis.sismember(REDIS_KEYS.ACTIVE_PLAYERS, username);
    if (alreadyPlacedBet) {
        console.warn(`Bet rejected: User '${username}' already placed a bet this round.`);
        return NextResponse.json({ success: false, error: 'You have already placed a bet for this round' }, { status: 400 });
    }

    // Use a Redis pipeline for atomic operations
    const pipeline = redis.pipeline();

    // 1. Store bet details (using HSET for multiple fields)
    pipeline.hset(REDIS_KEYS.PLAYER_BETS(username), {
      bet: bet,
      autoCashout: cashoutTarget,
      timestamp: Date.now() // Optional: store bet time
    });

    // 2. Add player to the set of active players for this round
    pipeline.sadd(REDIS_KEYS.ACTIVE_PLAYERS, username);

    // 3. Increment the count of joined players (important for display)
    pipeline.incr(REDIS_KEYS.PLAYERS_JOINED_COUNT);

    // Execute the pipeline
    console.log(`Executing Redis pipeline for ${username}'s bet...`);
    const results = await pipeline.exec<[number, number, number]>();
    console.log(`Redis pipeline results for ${username}'s bet:`, results);

    // Basic check if pipeline executed without Redis errors (exec doesn't throw easily)
    // results array contains the return value of each command (e.g., number of fields added/updated for HSET, 1/0 for SADD, new value for INCR)
    if (results.length !== 3) {
         console.error("Redis pipeline execution failed or returned unexpected results:", results);
         // Optional: Attempt to clean up partial writes if necessary/possible
         throw new Error("Failed to place bet due to Redis operation error.");
    }

    // TODO: Deduct bet amount from player's balance here
    // await deductPlayerBalance(username, bet); // Implement this

    // --- Trigger Pusher Event ---
    try {
      const pusher = getPusherServer();
      const joinedCount = results[2]; // Get the latest player count from INCR result
      await pusher.trigger('crashout-game', 'player-joined', {
        username: username,
        // Optionally send the new total player count for immediate UI update
        playersInGame: joinedCount
      });
      console.log(`Pusher event 'player-joined' triggered for ${username}`);
    } catch (pusherError) {
        console.error("Failed to trigger Pusher event 'player-joined':", pusherError);
        // Log error, but usually don't fail the whole bet placement for this
    }

    console.log(`Bet of ${bet} placed successfully for user ${username}`);
    // Send success response - Frontend relies on 'bet-accepted' Pusher event for UI lock
    return NextResponse.json({ success: true, message: 'Bet placed successfully' });

  } catch (error) {
    console.error("API Error: POST /api/crashout/play - ", error);
    // General error handling
    return NextResponse.json({
        success: false,
        error: "Failed to place bet.",
        details: error instanceof Error ? error.message : 'Unknown server error'
    }, { status: 500 });
  }
} 