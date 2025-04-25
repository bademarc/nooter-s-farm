const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const cors = require('cors'); // Add cors

const app = express();
const server = http.Server(app);

// Setup CORS before Socket.IO
app.use(cors({ // Enable CORS for all origins (adjust in production)
  origin: '*', // TODO: Restrict this in production to your frontend URL
  methods: ["GET", "POST"]
}));

const io = socketIO(server, {
  cors: {
    origin: "*", // Also configure Socket.IO CORS
    methods: ["GET", "POST"]
  },
  pingInterval: 30000, // Send pings every 30 seconds (default 25s)
  pingTimeout: 60000   // Wait 60 seconds for pong response (default 20s)
});

// Game constants
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 4000;
const MAX_FOOD = 500;
const FOOD_MASS = 1;
const START_MASS = 10;
const PLAYER_SPEED = 5;
const MASS_DECAY_RATE = 0.001;
const MIN_MASS_TO_SPLIT = 35; // Minimum mass to split
const MIN_MASS_TO_FEED = 20; // Minimum mass to feed
const FEED_MASS_COST = 10; // Mass lost when feeding
const FEED_MASS_SPAWNED = 8; // Mass of the ejected food
const MASS_FOOD_SPEED = 15; // Speed of ejected food
const MASS_FOOD_DECAY_RATE = 0.005; // Decay rate for ejected food

// Spatial Grid Constants
const GRID_CELL_SIZE = 200; // Size of each grid cell (adjust based on typical player size)
const GRID_COLS = Math.ceil(WORLD_WIDTH / GRID_CELL_SIZE);
const GRID_ROWS = Math.ceil(WORLD_HEIGHT / GRID_CELL_SIZE);

// Game state
let players = {};
let foods = [];
let sockets = {};
let leaderboard = [];
let massFood = []; // Array to store ejected mass

// Add a basic health check endpoint for Fly.io
app.get('/', (req, res) => {
  // Add a check for players object existence
  if (typeof players === 'undefined') {
    console.error('[Health Check] CRITICAL: players object is undefined!');
    return res.status(500).send('Server Error: Game state corrupted');
  }
  // Basic check is okay, potentially add more checks (e.g., loop running?)
  res.status(200).send('Noot.io Server OK');
});

// Generate a random color
function getRandomColor() {
  const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Initialize food
function initializeFood() {
  foods = []; // Clear existing food first
  for (let i = 0; i < MAX_FOOD; i++) {
    generateFood(); // This now also emits spawn event
  }
  console.log(`Initialized ${foods.length} food items.`);
}

// Generate a food at random position
function generateFood() {
  const food = {
    id: Date.now() + Math.random().toString(36).substr(2, 5),
    x: Math.floor(Math.random() * WORLD_WIDTH),
    y: Math.floor(Math.random() * WORLD_HEIGHT),
    color: getRandomColor(),
    mass: FOOD_MASS
  };
  foods.push(food);
  io.emit('foodSpawned', food); // Broadcast new food to all clients
  return food;
}

// Update leaderboard
function updateLeaderboard() {
  // Convert players object to array and sort by mass
  const playerArray = Object.values(players).sort((a, b) => b.mass - a.mass);
  // Take top 10 players
  leaderboard = playerArray.slice(0, 10).map(player => ({
    id: player.id,
    name: player.name,
    mass: Math.floor(player.mass)
  }));
}

// --- Collision Detection using Spatial Grid ---

// Helper to get grid cell coordinates
function getGridCell(x, y) {
  const cellX = Math.floor(x / GRID_CELL_SIZE);
  const cellY = Math.floor(y / GRID_CELL_SIZE);
  return { cellX, cellY };
}

// Helper to get key for grid map
function getGridKey(cellX, cellY) {
  return `${cellX}_${cellY}`;
}

// Build the spatial grid for players and food
function buildSpatialGrid() {
    const grid = new Map(); // Use Map for better performance than object

    // Add players to grid
    for (const id in players) {
        const p = players[id];
        const { cellX, cellY } = getGridCell(p.x, p.y);
        const key = getGridKey(cellX, cellY);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(p); // Store the player object itself
    }

    // Add foods to grid
    foods.forEach(f => {
        const { cellX, cellY } = getGridCell(f.x, f.y);
        const key = getGridKey(cellX, cellY);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(f); // Store the food object itself
    });

    // Add mass foods to grid
    massFood.forEach(mf => {
        const { cellX, cellY } = getGridCell(mf.x, mf.y);
        const key = getGridKey(cellX, cellY);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(mf); // Store the mass food object itself
    });

    return grid;
}

// Get entities from surrounding cells (including center)
function getNearbyEntities(grid, cellX, cellY) {
    const nearby = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const checkX = cellX + dx;
            const checkY = cellY + dy;
            // Skip cells outside world grid (optional, assumes world starts at 0,0)
            if (checkX < 0 || checkX >= GRID_COLS || checkY < 0 || checkY >= GRID_ROWS) {
                continue;
            }
            const key = getGridKey(checkX, checkY);
            if (grid.has(key)) {
                nearby.push(...grid.get(key)); // Add all entities from this cell
            }
        }
    }
    return nearby;
}

// Check for collisions between player and food (using grid)
function checkFoodCollision(player, nearbyEntities) {
    let eatenFood = null;
    for (let i = nearbyEntities.length - 1; i >= 0; i--) {
        const entity = nearbyEntities[i];
        // Check if entity is food (might need a type property or duck typing)
        if (entity.mass === FOOD_MASS && !players[entity.id] && !massFood.some(mf => mf.id === entity.id)) { // Basic check: is it food?
            const food = entity;
            const dx = player.x - food.x;
            const dy = player.y - food.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const playerRadius = Math.sqrt(player.mass / Math.PI); // More accurate radius calc
            const foodRadius = Math.sqrt(food.mass / Math.PI); // More accurate radius calc

            if (distance < playerRadius) { // Player must overlap center of food
                // Find the actual food index in the global 'foods' array to remove it
                const foodIndex = foods.findIndex(f => f.id === food.id);
                if (foodIndex !== -1) {
                    eatenFood = foods[foodIndex];
                    foods.splice(foodIndex, 1); // Remove from global list
                    // Increase player mass
                    player.mass += eatenFood.mass;
                    io.emit('foodEaten', eatenFood.id); // Broadcast food eaten event
                    // Generate new food
                    generateFood(); // This also broadcasts spawn
                    return true; // Collision occurred, exit check for this player tick
                } else {
                    console.warn(`Food ${food.id} found in grid but not in global list?`);
                }
            }
        }
    }
    return false;
}

// Check for collisions between player and mass food (using grid)
function checkMassFoodCollision(player, nearbyEntities) {
  let eatenMassFoodIds = []; // Collect IDs of eaten items
  let massGained = 0;

  for (let i = nearbyEntities.length - 1; i >= 0; i--) {
    const entity = nearbyEntities[i];
    // Check if entity is mass food (duck typing)
    if (entity.speedX !== undefined && entity.ownerId !== undefined) {
        const mf = entity;
        // Don't let players eat their own ejected mass immediately
        const age = Date.now() - mf.creationTime;
        if (mf.ownerId === player.id && age < 1000) continue; // 1 second immunity

        const dx = player.x - mf.x;
        const dy = player.y - mf.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const playerRadius = Math.sqrt(player.mass / Math.PI);
        // const mfRadius = Math.sqrt(mf.mass / Math.PI); // Mass food radius is tiny, ignore for collision check

        // Simplified collision: Player radius overlaps mass food center
        if (distance < playerRadius) {
            // Check if this mf is still in the global list (important check)
            const mfIndex = massFood.findIndex(m => m.id === mf.id);
            if (mfIndex !== -1) {
                massGained += massFood[mfIndex].mass;
                eatenMassFoodIds.push(mf.id);
                // Don't splice here! We'll filter later.
            } else {
                 // Already eaten by someone else this tick or removed?
            }
        }
    }
  }

  // After checking all nearby entities, update player mass and filter global list
  if (eatenMassFoodIds.length > 0) {
    player.mass += massGained;
    // Filter the global massFood array
    massFood = massFood.filter(mf => !eatenMassFoodIds.includes(mf.id));
    return true; // Indicate that *some* collision happened
  }

  return false;
}

// Check for collisions between players (using grid)
function checkPlayerCollisions(player, nearbyEntities) {
    for (let i = 0; i < nearbyEntities.length; i++) {
        const otherEntity = nearbyEntities[i];
        // Check if entity is another player and not self
        if (players[otherEntity.id] && otherEntity.id !== player.id) {
            const player1 = player;
            const player2 = otherEntity;

            // Calculate distance between players
            const dx = player1.x - player2.x;
            const dy = player1.y - player2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const radius1 = Math.sqrt(player1.mass / Math.PI);
            const radius2 = Math.sqrt(player2.mass / Math.PI);

            // Check for overlap (distance < sum of radii, minus a bit to ensure engulfment)
            if (distance < radius1 + radius2 * 0.8) { // Player 1 must substantially overlap Player 2 center
                // Determine which player is larger (add threshold for eating)
                if (player1.mass > player2.mass * 1.1 && distance < radius1 - radius2 * 0.5) { // P1 mass > P2 mass AND P1 mostly engulfs P2
                    console.log(`${player1.name} ate ${player2.name}`);
                    player1.mass += player2.mass * 0.8; // Gain percentage of mass
                    io.to(player2.id).emit('eaten', { by: player1.name });
                    respawnPlayer(player2);
                    // No need to return, player1 might eat others in the same tick
                } 
                // Player 2 eating player 1 is handled when the loop gets to player 2
            }
        }
    }
}

// Respawn a player at a random position
function respawnPlayer(player) {
    if (!player) return; // Check if player exists
    const socket = sockets[player.id]; // Get the socket
    if (!socket) {
        console.warn(`Cannot respawn player ${player.id}, socket not found.`);
        // Player might have fully disconnected between being eaten and respawn attempt
        delete players[player.id]; // Clean up player data
        updateLeaderboard();
        return;
    }
    console.log(`Respawning player ${player.name} (${player.id})`);
    player.x = Math.random() * WORLD_WIDTH;
    player.y = Math.random() * WORLD_HEIGHT;
    player.mass = START_MASS;
    player.targetX = player.x; // Reset target
    player.targetY = player.y;
    // Notify the specific player about their respawn details
    socket.emit('respawned', { x: player.x, y: player.y, mass: player.mass });
    // No need to update leaderboard here, happens in main loop
}


// Add a function to spawn mass food (ejected by players)
function spawnMassFood(player, angle) {
  const spawnedMass = {
    id: Date.now() + Math.random().toString(36).substr(2, 5),
    x: player.x + Math.cos(angle) * (player.mass + 5), // Spawn ahead of player
    y: player.y + Math.sin(angle) * (player.mass + 5),
    mass: FEED_MASS_SPAWNED,
    color: player.color,
    speedX: Math.cos(angle) * MASS_FOOD_SPEED,
    speedY: Math.sin(angle) * MASS_FOOD_SPEED,
    ownerId: player.id, // Keep track of owner initially to avoid self-consumption
    creationTime: Date.now() // To prevent immediate re-consumption
  };
  massFood.push(spawnedMass);
  return spawnedMass;
}

// Socket.IO connection handling
io.on('connection', function(socket) {
  console.log('A player connected!', socket.id);

  // When a player joins the game
  socket.on('joinGame', function(data) {
    console.log('Player joined:', data.nickname, socket.id);

    // Calculate starting position first
    const startX = Math.random() * WORLD_WIDTH;
    const startY = Math.random() * WORLD_HEIGHT;

    // Create a new player using the calculated start position
    const player = {
      id: socket.id,
      name: data.nickname || 'Anonymous',
      x: startX,
      y: startY,
      mass: START_MASS,
      color: getRandomColor(),
      // Use the calculated start positions for the initial target
      targetX: startX,
      targetY: startY
    };

    // Store the player and socket
    players[socket.id] = player;
    sockets[socket.id] = socket;

    // Send initial game state ONLY to the new player
    socket.emit('initGame', {
      player: player,                 // Send their specific player object
      players: Object.values(players), // Send the current list of all players (including self for initial draw)
      foods: foods,                    // Send the current food state
      massFood: massFood              // Send the current mass food state
    });

    // Notify existing players about the new player (optional, if 'update' handles adds)
     socket.broadcast.emit('playerJoined', player); // Inform others a new player connected

    updateLeaderboard(); // Update leaderboard after join
    console.log('Total players:', Object.keys(players).length);
  });

  // When a player sends mouse coordinates (NOW JUST UPDATES TARGET)
  socket.on('mouseMove', function(data) {
    const player = players[socket.id];
    if (player) {
        // Store the target world coordinates sent by the client
        player.targetX = data.mouseX;
        player.targetY = data.mouseY;
    }
    // DO NOT calculate movement or check collisions here anymore
  });

  // When a player disconnects
  socket.on('disconnect', function(reason) {
    console.log(`Player disconnected: ${socket.id}, Reason: ${reason}`);
    const player = players[socket.id];
    if (player) {
        // Notify others
        socket.broadcast.emit('playerLeft', socket.id);
        // Remove the player and socket
        delete players[socket.id];
        delete sockets[socket.id];
        updateLeaderboard(); // Update leaderboard after leave
        console.log('Total players:', Object.keys(players).length);
    } else {
        console.log('Disconnected socket had no associated player:', socket.id);
    }
  });

  // Handle Feed command
  socket.on('feed', function() {
    const player = players[socket.id];
    if (!player) return;
    const angle = Math.atan2(player.targetY - player.y, player.targetX - player.x);
    if (player.mass >= MIN_MASS_TO_FEED) {
        player.mass -= FEED_MASS_COST;
        spawnMassFood(player, angle);
    }
  });

  // Handle Split command
  socket.on('split', function() {
    const player = players[socket.id];
    if (!player) return;
    if (player.mass >= MIN_MASS_TO_SPLIT) {
        console.log(`Player ${player.name} requested split (mass: ${player.mass}). Split logic not implemented yet.`);
        // TODO: Implement actual splitting logic
    }
  });
});

// Game update loop (e.g., 20 times per second -> 50ms interval)
const TICK_RATE = 50; // ms per tick
setInterval(function() {
  // 0. Build Spatial Grid (once per tick)
  const spatialGrid = buildSpatialGrid();

  // 1. Update Entities (Players, Mass Food)
  // Update Mass Food first (so collisions use updated positions)
  for (let i = massFood.length - 1; i >= 0; i--) {
    const mf = massFood[i];
    mf.x += mf.speedX;
    mf.y += mf.speedY;
    mf.mass *= (1 - MASS_FOOD_DECAY_RATE); // Decay mass

    // Remove if out of bounds or too small
    if (mf.x < 0 || mf.x > WORLD_WIDTH || mf.y < 0 || mf.y > WORLD_HEIGHT || mf.mass < 1) {
      massFood.splice(i, 1);
    } else {
        // Re-insert into grid if it moved cell? - Simpler: grid rebuilds each tick anyway
    }
  }

  // Update Players
  const playerIds = Object.keys(players);
  for (const id of playerIds) {
      const player = players[id];
      if (!player) continue; // Player might have disconnected during loop

      // Get nearby entities using the pre-built grid
      const { cellX, cellY } = getGridCell(player.x, player.y);
      const nearbyEntities = getNearbyEntities(spatialGrid, cellX, cellY);

      // --- Movement --- (Same logic as before)
      const targetX = player.targetX;
      const targetY = player.targetY;
      const currentX = player.x;
      const currentY = player.y;

      const dx = targetX - currentX;
      const dy = targetY - currentY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1) {
          const speed = PLAYER_SPEED / Math.max(1, Math.sqrt(player.mass / START_MASS));
          const moveX = Math.min(speed, dist) * (dx / dist);
          const moveY = Math.min(speed, dist) * (dy / dist);
          player.x += moveX;
          player.y += moveY;
          player.x = Math.max(0, Math.min(WORLD_WIDTH, player.x));
          player.y = Math.max(0, Math.min(WORLD_HEIGHT, player.y));
      }
      // --- End Movement ---

      // --- Collisions (use nearby entities) ---
      checkFoodCollision(player, nearbyEntities);
      checkMassFoodCollision(player, nearbyEntities);
      checkPlayerCollisions(player, nearbyEntities);
      // --- End Collisions ---

      // --- Mass Decay ---
      player.mass = Math.max(START_MASS, player.mass * (1 - MASS_DECAY_RATE));
      // --- End Mass Decay ---
  }

  // 2. Update Leaderboard (after all updates/collisions)
  updateLeaderboard();

  // 3. Broadcast Game State (Optimized)
  // Prepare state payload (send only necessary data)
  const playersState = Object.values(players).map(p => ({
      id: p.id,
      x: p.x,
      y: p.y,
      mass: p.mass,
      color: p.color,
      name: p.name
  }));
  const massFoodState = massFood.map(mf => ({
      id: mf.id,
      x: mf.x,
      y: mf.y,
      mass: mf.mass,
      color: mf.color
  }));

  io.emit('update', {
    players: playersState,
    // foods: foods, // REMOVED - Handled by foodSpawned/foodEaten
    massFood: massFoodState,
    leaderboard: leaderboard
  });
}, TICK_RATE);

// Initialize food when server starts
initializeFood();

// Start the server
const PORT = process.env.PORT || 8080; // Use 8080 for Fly.io default
server.listen(PORT, () => {
  console.log(`Noot.io server started on port ${PORT}`);
}); 