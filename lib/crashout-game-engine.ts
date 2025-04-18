// Simple stub game engine for Crashout Game
// This is a simplified version for Pages API routes compatibility

export interface GameHistoryEntry {
  value: string;
  color: string;
  timestamp: number;
}

export interface PlayerData {
  username: string;
  betAmount: number;
  autoCashoutAt: number | null;
  balance: number;
}

// Function to get the current state for clients
export async function getCurrentGameState() {
  return {
    state: "inactive",
    multiplier: 1.0,
    countdown: 0,
    playersJoined: 0,
    history: [],
    nextGameStart: Date.now() + 5000,
    gameId: `default-${Date.now()}`,
  };
}

// Simplified placeholder functions
export async function placeBet(username: string, betAmount: number, autoCashoutAt: number | null): Promise<{ success: boolean; error?: string; balance?: number }> {
  console.log(`[Game Engine] Handling bet: ${username}, amount: ${betAmount}, autoCashout: ${autoCashoutAt}`);
  return { success: true, balance: 1000 };
}

export async function cashout(username: string): Promise<{ success: boolean; error?: string; multiplier?: number; winnings?: number; balance?: number }> {
  console.log(`[Game Engine] Handling cashout for: ${username}`);
  return { success: true, multiplier: 2.0, winnings: 20, balance: 1020 };
}

export async function updateUserUsername(oldUsername: string | undefined, newUsername: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[Game Engine] Updating username from ${oldUsername} to ${newUsername}`);
  return { success: true };
}

export async function handleUserDisconnect(username: string) {
  console.log(`[Game Engine] Handling disconnect for: ${username}`);
}

export async function resetGame() {
  console.log("[Game Engine] Game reset called");
  return { success: true };
}

export async function startCountdown() {
  console.log("[Game Engine] Countdown started");
  return { success: true };
}

export async function decrementCountdown() {
  console.log("[Game Engine] Countdown decremented");
  return { success: true };
}

export async function advanceGameLoop() {
  console.log("[Game Engine] Game loop advanced");
  return { success: true };
} 