# Crashout Game - Online Implementation

This document explains how the online implementation of the Crashout game works using Vercel, Redis and Cron jobs.

## Architecture Overview

The online implementation uses:

1. **Colyseus.js**: For real-time multiplayer communication
2. **Upstash Redis**: For persistent storage and state management
3. **Vercel Cron Jobs**: For scheduled maintenance and cleanup

## Key Components

### 1. Redis Integration

- **State Persistence**: Game state, history, and player data are stored in Redis
- **Player Analytics**: Tracks player activity, bet history, and game performance
- **Game History**: Maintains history of past games for statistics and display

### 2. API Endpoints

- **/api/redis**: Handles Redis operations for the game
  - `GET`: Retrieves game state, history, or stats
  - `POST`: Updates player data or logs game results
  
- **/api/cron**: Scheduled maintenance
  - Cleans up stale player data
  - Resets game state if needed
  - Updates game statistics
  
### 3. Game Component Integration

The `crashout-game.tsx` component has been enhanced with:

- Redis synchronization functions
- Player activity logging
- Game result persistence
- Automatic fallback to demo mode when server is unavailable

## Data Structure

### Redis Keys

- `crashout:gameState`: Current game state information
- `crashout:players`: Hash map of player data
- `crashout:history`: List of recent game results
- `crashout:stats`: Game statistics
- `crashout:lastHeartbeat`: Last server heartbeat timestamp

## Setup Instructions

1. **Environment Variables**:
   - `REDIS_URL`: Your Upstash Redis connection string
   - `CRON_SECRET`: Secret for authenticating cron job requests

2. **Vercel Configuration**:
   - `vercel.json` includes cron job configuration (runs every 5 minutes)

3. **Dependencies**:
   - `@upstash/redis`: For Redis operations
   - `axios`: For API requests

## Deployment

When deploying to Vercel:

1. Set up the required environment variables
2. Ensure the cron job is enabled in the Vercel dashboard
3. Monitor Redis usage through the Upstash dashboard

## Local Development

For local development:

1. Create a `.env.local` file with the appropriate Redis credentials
2. Use `npm run dev` to start the development server
3. The game will connect to Redis but cron jobs won't run locally

## Troubleshooting

- If the game shows "Demo Mode," check Redis connection
- Connection issues can be monitored in browser console logs
- Redis operations are logged in Vercel function logs 