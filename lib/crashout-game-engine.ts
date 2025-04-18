import { kv } from '@vercel/kv';
import { getPusherServer } from '@/utils/pusher-server';

// --- Constants ---
const COUNTDOWN_SECONDS = 10;
const CRASH_DELAY_MS = 3000; // Time between crash and reset
const RESET_DELAY_MS = 5000; // Time between reset and next countdown start
const GAME_LOOP_INTERVAL_MS = 60; // Target interval for external loop
const HISTORY_LENGTH = 20; // Number of history entries to keep
const PLAYER_INITIAL_BALANCE = 1000;

// --- KV Keys ---
// Using a prefix for better organization in KV store
const KV_PREFIX = 'crashout';
const KEYS = {
    STATE: `${KV_PREFIX}:state`, // Stores "inactive", "countdown", "active", "crashed"
    MULTIPLIER: `${KV_PREFIX}:multiplier`, // Stores current multiplier value
    COUNTDOWN: `${KV_PREFIX}:countdown`, // Stores remaining countdown seconds
    CRASH_POINT: `${KV_PREFIX}:crashPoint`, // Stores the multiplier value where the game will crash
    GAME_ID: `${KV_PREFIX}:gameId`, // Stores unique ID for the current game instance
    NEXT_GAME_START: `${KV_PREFIX}:nextGameStart`, // Timestamp (ms) when next game should start
    HISTORY: `${KV_PREFIX}:history`, // Vercel KV List storing history entries
    PLAYER_DATA: (username: string) => `${KV_PREFIX}:player:${username}`, // Hash storing data for a specific player
    ACTIVE_USERNAMES: `${KV_PREFIX}:activeUsernames`, // Vercel KV Set storing active usernames
    PLAYERS_IN_ROUND: `${KV_PREFIX}:playersInRound`, // Vercel KV Set storing usernames who bet this round
    GAME_LOOP_LOCK: `${KV_PREFIX}:gameLoopLock`, // Simple lock to prevent concurrent loops (basic)
};

// --- Interfaces (assuming PlayerData and GameHistoryEntry are needed elsewhere) ---
export interface GameHistoryEntry {
    value: string;
    color: string;
    timestamp: number;
}

export interface PlayerData {
    username: string;
    betAmount: number;
    autoCashoutAt: number | null;
    // Removed round-specific flags, manage via PLAYERS_IN_ROUND set
    balance: number;
}

// --- Pusher Helper ---
async function triggerPusher(event: string, data: any) {
    // IMPORTANT: Use private channels for user-specific data in production!
    const targetChannel = 'crashout-game'; 
    const pusher = getPusherServer();
    try {
        // console.log(`[Pusher] Triggering event: ${event} on channel ${targetChannel}`, data);
        await pusher.trigger(targetChannel, event, data);
    } catch (error) {
        console.error(`[Pusher] Failed to trigger event ${event}:`, error);
    }
}

// --- State Management Functions (using Vercel KV) ---

// Helper to get player data or create if not exists
async function ensureGetPlayerData(username: string): Promise<PlayerData> {
    const key = KEYS.PLAYER_DATA(username);
    let playerData = await kv.hgetall<PlayerData>(key);
    if (!playerData) {
        console.log(`[KV Engine] Creating new player data for: ${username}`);
        playerData = {
            username: username,
            betAmount: 0,
            autoCashoutAt: null,
            balance: PLAYER_INITIAL_BALANCE,
        };
        await kv.hset(key, playerData);
        // Add to active users set if not present
        const added = await kv.sadd(KEYS.ACTIVE_USERNAMES, username);
        if (added) await broadcastPlayerCount();
    }
    // Ensure balance is a number
    playerData.balance = Number(playerData.balance) || 0;
    playerData.betAmount = Number(playerData.betAmount) || 0;
    playerData.autoCashoutAt = playerData.autoCashoutAt ? Number(playerData.autoCashoutAt) : null;
    return playerData;
}

// Helper to update player balance atomically
async function updatePlayerBalance(username: string, amount: number): Promise<number | null> {
    const key = KEYS.PLAYER_DATA(username);
    try {
        // Use HINCRBYFLOAT for atomic update
        const newBalance = await kv.hincrbyfloat(key, 'balance', amount);
        console.log(`[KV Engine] Updated balance for ${username}: ${newBalance} (added ${amount})`);
        return newBalance;
    } catch (error) {
        console.error(`[KV Engine] Failed to update balance for ${username}:`, error);
        // Attempt to fetch current balance as fallback
        const currentData = await kv.hget<number>(key, 'balance');
        return currentData ?? null;
    }
}

// Helper to add to game history (LPUSH + LTRIM)
async function addGameHistory(entry: GameHistoryEntry) {
    try {
        await kv.lpush(KEYS.HISTORY, JSON.stringify(entry));
        await kv.ltrim(KEYS.HISTORY, 0, HISTORY_LENGTH - 1);
    } catch (error) {
        console.error("[KV Engine] Failed to update history:", error);
    }
}

// Function to get the current state from KV for clients
export async function getCurrentGameState() {
    try {
        const pipeline = kv.pipeline();
        pipeline.get<string>(KEYS.STATE);
        pipeline.get<number>(KEYS.MULTIPLIER);
        pipeline.get<number>(KEYS.COUNTDOWN);
        pipeline.scard(KEYS.ACTIVE_USERNAMES); // Get count of active users
        pipeline.lrange(KEYS.HISTORY, 0, HISTORY_LENGTH - 1);
        pipeline.get<number>(KEYS.NEXT_GAME_START);
        pipeline.get<string>(KEYS.GAME_ID);

        const [state, multiplier, countdown, playersJoined, historyJson, nextGameStart, gameId] =
            await pipeline.exec<[string | null, number | null, number | null, number, string[], number | null, string | null]>();

        const history = (historyJson || []).map(item => JSON.parse(item) as GameHistoryEntry);

        return {
            state: state ?? "inactive",
            multiplier: Number(multiplier) || 1.0,
            countdown: Number(countdown) || 0,
            playersJoined: Number(playersJoined) || 0,
            history: history,
            nextGameStart: Number(nextGameStart) || (Date.now() + RESET_DELAY_MS),
            gameId: gameId ?? `default-${Date.now()}`,
        };
    } catch (error) {
        console.error("[KV Engine] Failed to get current game state:", error);
        // Return default error state
        return {
            state: "inactive",
            multiplier: 1.0,
            countdown: 0,
            playersJoined: 0,
            history: [],
            nextGameStart: Date.now() + RESET_DELAY_MS,
            gameId: `error-${Date.now()}`,
        };
    }
}

async function broadcastPlayerCount() {
    const count = await kv.scard(KEYS.ACTIVE_USERNAMES);
    triggerPusher('player-count', count);
}

// --- Core Game Logic Functions (To be called externally or by Cron) ---

// Resets the game state in KV
export async function resetGame() {
    console.log(`[KV Engine] Resetting game state...`);
    try {
        const pipeline = kv.pipeline();
        pipeline.set(KEYS.STATE, "inactive");
        pipeline.set(KEYS.MULTIPLIER, 1.0);
        pipeline.set(KEYS.CRASH_POINT, 0);
        pipeline.del(KEYS.COUNTDOWN); // Remove countdown key
        pipeline.del(KEYS.PLAYERS_IN_ROUND); // Clear players who played last round
        const newGameId = `game-${Date.now()}`;
        pipeline.set(KEYS.GAME_ID, newGameId);
        const nextStart = Date.now() + RESET_DELAY_MS;
        pipeline.set(KEYS.NEXT_GAME_START, nextStart);

        await pipeline.exec();

        console.log(`[KV Engine] Game reset. Next game scheduled ~${new Date(nextStart).toLocaleTimeString()}. Game ID: ${newGameId}`);

        const currentState = await getCurrentGameState();
        triggerPusher('game-state', currentState);

        // IMPORTANT: Scheduling the *next* step (startCountdown) needs
        // to happen reliably, likely outside this function if called by a
        // short-lived API route. A Cron job or external scheduler is needed.
        // ScheduleNextGameCycle(RESET_DELAY_MS); // Placeholder

    } catch (error) {
        console.error("[KV Engine] Failed to reset game:", error);
    }
}

// Puts the game into countdown state in KV
export async function startCountdown() {
    console.log("[KV Engine] Starting countdown...");
    try {
        // Check current state first
        const currentState = await kv.get<string>(KEYS.STATE);
        if (currentState !== "inactive") {
            console.warn(`[KV Engine] Cannot start countdown, state is not inactive: ${currentState}`);
            return;
        }

        const pipeline = kv.pipeline();
        pipeline.set(KEYS.STATE, "countdown");
        pipeline.set(KEYS.COUNTDOWN, COUNTDOWN_SECONDS);
        await pipeline.exec();

        const gameStateNow = await getCurrentGameState();
        triggerPusher('game-state', gameStateNow);

        // IMPORTANT: The actual countdown timer logic needs to run reliably.
        // If this is called from an API route, it won't complete.
        // An external process or frequent Cron job needs to call a
        // `decrementCountdown` function repeatedly.
        // ScheduleDecrementCountdown(1000); // Placeholder

    } catch (error) {
        console.error("[KV Engine] Failed to start countdown:", error);
    }
}

// Function to be called repeatedly by external process/cron to decrement countdown
export async function decrementCountdown() {
    try {
        const currentCountdown = await kv.decr(KEYS.COUNTDOWN);

        if (currentCountdown < 0) {
             await kv.del(KEYS.COUNTDOWN); // Clean up if it went negative
             // Check if we should start the game
             const state = await kv.get<string>(KEYS.STATE);
             if (state === 'countdown') {
                 await startGame();
             }
             return; // Stop decrementing
        }
        
        console.log(`[KV Engine] Countdown decremented to: ${currentCountdown}`);
        triggerPusher('countdown', { count: currentCountdown });

        // External scheduler needs to call this again after ~1 second
        // ScheduleDecrementCountdown(1000); // Placeholder

    } catch (error) {
        console.error("[KV Engine] Failed to decrement countdown:", error);
    }
}

// Puts the game into active state in KV
async function startGame() {
    console.log("[KV Engine] Starting game...");
    try {
        // Generate crash point
        const random = Math.random();
        let crashPoint = 1.0 + Math.pow(random, 3) * 15;
        crashPoint = Math.max(1.01, crashPoint);
        crashPoint = parseFloat(crashPoint.toFixed(4)); // Precision
        console.log(`[KV Engine] Crash point set to: ${crashPoint.toFixed(2)}`);

        const pipeline = kv.pipeline();
        pipeline.set(KEYS.STATE, "active");
        pipeline.set(KEYS.MULTIPLIER, 1.0);
        pipeline.set(KEYS.CRASH_POINT, crashPoint);
        pipeline.del(KEYS.COUNTDOWN); // Ensure countdown is removed

        await pipeline.exec();

        const gameStateNow = await getCurrentGameState();
        triggerPusher('game-state', gameStateNow);

        // IMPORTANT: The game loop needs to run reliably.
        // An external process or frequent Cron job needs to call the
        // `advanceGameLoop` function repeatedly (e.g., every 60ms).
        // ScheduleGameLoopTick(GAME_LOOP_INTERVAL_MS); // Placeholder

    } catch (error) {
        console.error("[KV Engine] Failed to start game:", error);
    }
}

// Function to be called repeatedly (e.g., 60ms interval) by external process/cron
export async function advanceGameLoop() {
    // Basic lock to prevent multiple instances running concurrently (very basic)
    // NX = Set only if key does not exist, EX = Expire after seconds
    const lockAcquired = await kv.set(KEYS.GAME_LOOP_LOCK, 'running', { nx: true, ex: 1 });
    if (!lockAcquired) {
        // console.log("[KV Engine] Game loop tick already in progress. Skipping.");
        return;
    }

    try {
        const state = await kv.get<string>(KEYS.STATE);
        if (state !== 'active') {
            // console.log("[KV Engine] Game not active, skipping loop tick.");
            return;
        }

        const [currentMultiplier, crashPoint] = await kv.mget<[number | null, number | null]>(
            KEYS.MULTIPLIER,
            KEYS.CRASH_POINT
        );

        if (currentMultiplier === null || crashPoint === null) {
            console.error("[KV Engine] Failed to get multiplier or crash point from KV.");
            return;
        }

        // --- Calculate New Multiplier ---
        // This calculation should ideally consider the *actual time elapsed* since the last tick
        // for perfect smoothness, but that's complex with external triggers.
        // Using a fixed increment based on the target interval is simpler here.
        const baseRate = 0.01;
        const growthFactor = Math.min((currentMultiplier - 1) / 10, 1); // Example: rate increases up to 11x
        const growthRate = baseRate + (growthFactor * 0.04); // Rate from 1% up to 5%
        let newMultiplier = currentMultiplier + currentMultiplier * growthRate * (GAME_LOOP_INTERVAL_MS / 1000);
        newMultiplier = parseFloat(newMultiplier.toFixed(4)); // Precision

        // --- Check for Crash Condition First ---
        if (newMultiplier >= crashPoint) {
            console.log(`[KV Engine] Crash condition met. Target: ${crashPoint}, Current Calc: ${newMultiplier}`);
            await endGame(crashPoint); // End game with the exact crash point
            return; // Stop processing this tick
        }

        // --- Update Multiplier in KV ---
        // Using INCRBYFLOAT is atomic and good for this
        const updatedMultiplier = await kv.incrbyfloat(KEYS.MULTIPLIER, newMultiplier - currentMultiplier);
        triggerPusher('multiplier-update', { multiplier: updatedMultiplier });

        // --- Check for Auto-Cashouts ---
        const playersInRound = await kv.smembers(KEYS.PLAYERS_IN_ROUND);
        for (const username of playersInRound) {
            const playerData = await kv.hgetall<PlayerData>(KEYS.PLAYER_DATA(username));
            if (playerData && playerData.autoCashoutAt && updatedMultiplier >= playerData.autoCashoutAt) {
                console.log(`[KV Engine] Auto-cashing out ${username} at ${playerData.autoCashoutAt}x`);
                // Attempt to remove from round *before* processing cashout to prevent double cashout
                const removed = await kv.srem(KEYS.PLAYERS_IN_ROUND, username);
                if (removed) {
                    const targetMultiplier = playerData.autoCashoutAt;
                    const winnings = Number(playerData.betAmount) * targetMultiplier;
                    const newBalance = await updatePlayerBalance(username, winnings);

                    // Notify user privately (TEMPORARILY PUBLIC)
                    triggerPusher('cashout-success', {
                        username: username,
                        multiplier: targetMultiplier,
                        winAmount: winnings,
                        balance: newBalance
                    });
                    // Notify public (Uses correct event name)
                    triggerPusher('player-cashed-out', {
                        username: username,
                        multiplier: targetMultiplier,
                        winning: winnings
                    });
                } else {
                     console.log(`[KV Engine] ${username} already removed from round (likely cashed out).`);
                }
            }
        }
        
        // --- Schedule Next Tick (Placeholder) ---
        // External scheduler needs to call this again after ~60ms
        // ScheduleGameLoopTick(GAME_LOOP_INTERVAL_MS); // Placeholder

    } catch (error) {
        console.error("[KV Engine] Error in game loop tick:", error);
    } finally {
        // Release the lock
        await kv.del(KEYS.GAME_LOOP_LOCK);
    }
}

// Puts the game into crashed state in KV
async function endGame(crashMultiplier: number) {
    console.log(`[KV Engine] Ending game at crash point: ${crashMultiplier}`);
    try {
        // Use MULTI/EXEC for atomicity if needed, though less critical here
        await kv.set(KEYS.STATE, "crashed");
        await kv.set(KEYS.MULTIPLIER, crashMultiplier); // Set final multiplier

        const historyEntry: GameHistoryEntry = {
            value: crashMultiplier.toFixed(2),
            color: crashMultiplier < 1.5 ? "red" : (crashMultiplier < 3 ? "orange" : "green"),
            timestamp: Date.now()
        };
        await addGameHistory(historyEntry);
        const history = await kv.lrange(KEYS.HISTORY, 0, HISTORY_LENGTH - 1);

        // Notify players still in the round that they lost
        const playersWhoLost = await kv.smembers(KEYS.PLAYERS_IN_ROUND);
        for (const username of playersWhoLost) {
            const betAmount = await kv.hget<number>(KEYS.PLAYER_DATA(username), 'betAmount');
            console.log(`[KV Engine] Player ${username} lost bet.`);
            // Notify user privately (TEMPORARILY PUBLIC)
            triggerPusher('game-lost', {
                username: username,
                betAmount: Number(betAmount) || 0
            });
        }
        // Clear the set of players in the round after notifying losers
        await kv.del(KEYS.PLAYERS_IN_ROUND);

        // Notify all clients of crash
        triggerPusher('game-crashed', {
            crashPoint: crashMultiplier,
            history: history.map(item => JSON.parse(item)),
        });

        console.log("[KV Engine] Game ended. Scheduling reset.");

        // IMPORTANT: Schedule the reset reliably
        // ScheduleNextGameCycle(CRASH_DELAY_MS); // Placeholder
         // For local dev testing ONLY, we can trigger the reset directly
         // THIS WILL NOT WORK RELIABLY IN PRODUCTION API ROUTES
         // setTimeout(resetGame, CRASH_DELAY_MS);

    } catch (error) {
        console.error("[KV Engine] Failed to end game:", error);
    }
}

// --- API Route Helper Functions ---

// Handles player placing a bet via API route
export async function placeBet(username: string, betAmount: number, autoCashoutAt: number | null): Promise<{ success: boolean; error?: string; balance?: number }> {
    try {
        const state = await kv.get<string>(KEYS.STATE);
        const countdown = await kv.get<number>(KEYS.COUNTDOWN);

        // 1. Check Game State
        if (state !== "inactive" && state !== "countdown") {
            return { success: false, error: "Not in betting phase" };
        }
        // Basic join window check
        if (state === "countdown" && (Number(countdown) || 0) <= 3) {
            return { success: false, error: "Join window closed" };
        }

        const player = await ensureGetPlayerData(username);

        // 2. Check if already played this round (using KV Set)
        const alreadyPlayed = await kv.sismember(KEYS.PLAYERS_IN_ROUND, username);
        if (alreadyPlayed) {
            return { success: false, error: "Already placed a bet this round" };
        }

        // 3. Check Balance
        if (player.balance < betAmount) {
            return { success: false, error: "Insufficient balance", balance: player.balance };
        }

        // --- Atomic update using MULTI --- 
        const pipeline = kv.multi();
        // 4. Deduct Bet Amount
        pipeline.hincrbyfloat(KEYS.PLAYER_DATA(username), 'balance', -betAmount);
        // 5. Update Player Bet Info
        pipeline.hset(KEYS.PLAYER_DATA(username), {
            betAmount: betAmount,
            autoCashoutAt: autoCashoutAt ? Math.max(1.01, autoCashoutAt) : null
        });
        // 6. Add player to the set for this round
        pipeline.sadd(KEYS.PLAYERS_IN_ROUND, username);

        const results = await pipeline.exec<[number, number, number]>();
        const newBalance = results[0];
        
        if (newBalance === null) { // Check if MULTI failed
             console.error(`[KV Engine] Failed to place bet transaction for ${username}.`);
             // Attempt to refund if balance update failed but might be hard to guarantee
             return { success: false, error: "Bet placement failed (KV transaction)" };
        }
        
        console.log(`[KV Engine] Bet placed for ${username}: ${betAmount}. New Balance: ${newBalance}`);

        // 7. Notify clients (TEMPORARILY PUBLIC)
        triggerPusher('player-joined', { username: username });
        triggerPusher('bet-accepted', {
            username: username, // Include username for client check
            betAmount: betAmount,
            autoCashoutAt: autoCashoutAt ? Math.max(1.01, autoCashoutAt) : null,
            balance: newBalance
        });

        // 8. Trigger countdown if this was the *first* bet
        if (state === "inactive") {
             const playersInRoundCount = await kv.scard(KEYS.PLAYERS_IN_ROUND);
             if (playersInRoundCount === 1) { // If we just added the first player
                console.log("[KV Engine] First bet placed, initiating countdown...");
                await startCountdown(); // Directly start it (needs reliable scheduling)
             }
        }

        return { success: true, balance: newBalance };

    } catch (error) {
        console.error("[KV Engine] Error in placeBet:", error);
        return { success: false, error: "Internal server error placing bet" };
    }
}

// Handles manual cashout via API route
export async function cashout(username: string): Promise<{ success: boolean; error?: string; multiplier?: number; winnings?: number; balance?: number }> {
    try {
        const state = await kv.get<string>(KEYS.STATE);

        // 1. Check Game State
        if (state !== "active") {
            return { success: false, error: "Game not active" };
        }

        // 2. Check if Player Played This Round
        // Use SISMEMBER first for efficiency
        const isPlaying = await kv.sismember(KEYS.PLAYERS_IN_ROUND, username);
        if (!isPlaying) {
            // Could be they already cashed out or didn't bet
             const playerExists = await kv.exists(KEYS.PLAYER_DATA(username));
             if (!playerExists) return { success: false, error: "Player not found" };
             // If player exists but not in round set, they likely already cashed out or didn't play
             return { success: false, error: "Not playing or already cashed out this round" };
        }

        // 3. Atomically remove player from round and get data needed for cashout
        const pipeline = kv.multi();
        pipeline.srem(KEYS.PLAYERS_IN_ROUND, username); // Remove from playing set
        pipeline.hgetall<PlayerData>(KEYS.PLAYER_DATA(username)); // Get player data
        pipeline.get<number>(KEYS.MULTIPLIER); // Get current multiplier
        
        const results = await pipeline.exec<[number, PlayerData | null, number | null]>();
        const removedCount = results[0];
        const player = results[1];
        const cashoutMultiplier = Number(results[2]) || 1.0; // Use current multiplier

        // 4. Check if successfully removed (means they hadn't cashed out yet)
        if (removedCount !== 1 || !player) {
            console.warn(`[KV Engine] Cashout failed for ${username}. Not removed from round set or player data missing.`);
            return { success: false, error: "Already cashed out or error occurred" };
        }

        // 5. Calculate Winnings & Update Balance
        const winnings = Number(player.betAmount) * cashoutMultiplier;
        const newBalance = await updatePlayerBalance(username, winnings);

        console.log(`[KV Engine] Manual cashout for ${username} at ${cashoutMultiplier.toFixed(2)}x. Won: ${winnings.toFixed(2)}. New Balance: ${newBalance}`);

        // 6. Notify Clients (TEMPORARILY PUBLIC)
        triggerPusher('cashout-success', {
            username: username,
            multiplier: cashoutMultiplier,
            winAmount: winnings,
            balance: newBalance
        });
        triggerPusher('player-cashed-out', {
            username: username,
            multiplier: cashoutMultiplier,
            winning: winnings
        });

        return { success: true, multiplier: cashoutMultiplier, winnings: winnings, balance: newBalance ?? player.balance }; // Return new or old balance

    } catch (error) {
        console.error("[KV Engine] Error in cashout:", error);
        return { success: false, error: "Internal server error cashing out" };
    }
}

// Handles username update via API route
export async function updateUserUsername(oldUsername: string | undefined, newUsername: string): Promise<{ success: boolean; error?: string }> {
    if (!newUsername || typeof newUsername !== 'string' || newUsername.trim().length === 0) {
        return { success: false, error: 'Invalid new username' };
    }
    newUsername = newUsername.trim();

    if (oldUsername === newUsername) {
        await ensureGetPlayerData(newUsername); // Ensure exists if name hasn't changed
        return { success: true }; // No change needed
    }

    try {
        if (oldUsername && typeof oldUsername === 'string') {
            console.log(`[KV Engine] Renaming user: ${oldUsername} -> ${newUsername}`);
            // Check if new username already exists (basic collision handling)
            const newExists = await kv.exists(KEYS.PLAYER_DATA(newUsername));
            if (newExists) {
                 return { success: false, error: `Username '${newUsername}' is already taken` };
            }
            // Rename the player data key
            const renamed = await kv.rename(KEYS.PLAYER_DATA(oldUsername), KEYS.PLAYER_DATA(newUsername));
            if (!renamed) {
                console.warn(`[KV Engine] Failed to rename KV key for ${oldUsername}. User might not exist.`);
                // If rename failed, still try to ensure the new player exists
                await ensureGetPlayerData(newUsername);
            } else {
                 // Update username within the hash data itself
                 await kv.hset(KEYS.PLAYER_DATA(newUsername), { username: newUsername });
                 console.log(`[KV Engine] Successfully renamed player data key.`);
            }
            // Update active usernames set atomically
            await kv.multi()
                .srem(KEYS.ACTIVE_USERNAMES, oldUsername)
                .sadd(KEYS.ACTIVE_USERNAMES, newUsername)
                .exec();
        } else {
            // No old username, just ensure the new one exists
            await ensureGetPlayerData(newUsername);
            await kv.sadd(KEYS.ACTIVE_USERNAMES, newUsername);
        }

        await broadcastPlayerCount();
        return { success: true };

    } catch (error) {
         console.error("[KV Engine] Error updating username:", error);
         // Handle potential error if oldUsername key doesn't exist during rename
         if ((error as Error).message?.includes('no such key')) {
             console.warn(`[KV Engine] Rename failed because old username key '${oldUsername}' did not exist.`);
             // Try to ensure the new user still gets created/added
             try {
                 await ensureGetPlayerData(newUsername);
                 await kv.sadd(KEYS.ACTIVE_USERNAMES, newUsername);
                 await broadcastPlayerCount();
                 return { success: true }; // Consider it a success if new user is ensured
             } catch (ensureError) {
                 console.error("[KV Engine] Error ensuring new user exists after rename failure:", ensureError);
             }
         }
        return { success: false, error: "Internal server error updating username" };
    }
}

// Handles user disconnect (e.g., called from a WebSocket disconnect event if using WebSockets)
export async function handleUserDisconnect(username: string) {
    try {
        const removed = await kv.srem(KEYS.ACTIVE_USERNAMES, username);
        if (removed) {
            console.log(`[KV Engine] User disconnected (removed from active set): ${username}`);
            await broadcastPlayerCount();
        }
    } catch (error) {
         console.error(`[KV Engine] Error removing user ${username} from active set:`, error);
    }
}

// --- Initialization (Optional - Can be done by first API call) ---
async function initializeDefaultState() {
    console.log("[KV Engine] Checking initial KV state...");
    const stateExists = await kv.exists(KEYS.STATE);
    if (!stateExists) {
        console.log("[KV Engine] State key not found. Initializing default state in KV...");
        const pipeline = kv.pipeline();
        pipeline.set(KEYS.STATE, "inactive", { nx: true }); // Set only if not exists
        pipeline.set(KEYS.MULTIPLIER, 1.0, { nx: true });
        pipeline.set(KEYS.GAME_ID, `game-${Date.now()}`, { nx: true });
        pipeline.set(KEYS.NEXT_GAME_START, Date.now() + RESET_DELAY_MS, { nx: true });
        // Consider clearing potentially stale sets/lists on init
        pipeline.del(KEYS.PLAYERS_IN_ROUND);
        pipeline.del(KEYS.COUNTDOWN);
        pipeline.del(KEYS.GAME_LOOP_LOCK);
        // pipeline.del(KEYS.ACTIVE_USERNAMES); // Careful about clearing active users
        // pipeline.del(KEYS.HISTORY); // Careful about clearing history
        await pipeline.exec();
        console.log("[KV Engine] Default state initialized.");
    } else {
         console.log("[KV Engine] Initial KV state seems to exist.");
         // Optional: Ensure game loop isn't stuck running on load
         await kv.del(KEYS.GAME_LOOP_LOCK);
         // Optional: Check if game is stuck in active/countdown state without a loop running
         // const currentState = await kv.get<string>(KEYS.STATE);
         // if (currentState === 'active' || currentState === 'countdown') { resetGame(); }
    }
}

// Run initialization check when module loads
// NOTE: This might run multiple times in dev due to module reloading,
// but the {nx: true} option should prevent overwriting existing state.
initializeDefaultState().catch(err => console.error("Initialization error:", err));

console.log("[KV Engine] Module loaded. KV interactions enabled.");

// NOTE: REMEMBER TO IMPLEMENT A RELIABLE EXTERNAL MECHANISM
// TO CALL `advanceGameLoop()` and `decrementCountdown()` REPEATEDLY! 