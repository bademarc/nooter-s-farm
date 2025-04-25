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

// Game state
let players = {};
let foods = [];
let sockets = {};
let leaderboard = [];
let massFood = []; // Array to store ejected mass

// Add a basic health check endpoint for Fly.io
app.get('/', (req, res) => {
  res.status(200).send('Noot.io Server OK');
});

// Generate a random color
function getRandomColor() {
  const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Initialize food
function initializeFood() {
  for (let i = 0; i < MAX_FOOD; i++) {
    generateFood();
  }
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

// Check for collisions between player and food
function checkFoodCollision(player) {
  for (let i = 0; i < foods.length; i++) {
    const food = foods[i];
    const dx = player.x - food.x;
    const dy = player.y - food.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If distance is less than player radius (use mass directly for radius approximation)
    if (distance < player.mass) { // Simplified: radius ~ mass
      // Remove the food
      foods.splice(i, 1);
      // Increase player mass
      player.mass += food.mass;
      // Generate new food
      generateFood();
      // Return true to indicate collision
      return true;
    }
  }
  return false;
}

// Check for collisions between players
function checkPlayerCollisions() {
  const playerIds = Object.keys(players);

  for (let i = 0; i < playerIds.length; i++) {
    const player1 = players[playerIds[i]];
    if (!player1) continue; // Check if player still exists

    for (let j = i + 1; j < playerIds.length; j++) {
      const player2 = players[playerIds[j]];
      if (!player2) continue; // Check if player still exists

      // Calculate distance between players
      const dx = player1.x - player2.x;
      const dy = player1.y - player2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Use mass directly for radius approximation
      const radius1 = player1.mass;
      const radius2 = player2.mass;

      // If distance is less than the larger radius (simplistic overlap check)
      if (distance < Math.max(radius1, radius2)) {
        // Determine which player is larger (add threshold for eating)
        if (player1.mass > player2.mass * 1.1) { // Player 1 eats player 2
          player1.mass += player2.mass * 0.8; // Gain percentage of mass
          io.to(player2.id).emit('eaten', { by: player1.name });
          respawnPlayer(player2);
        }
        else if (player2.mass > player1.mass * 1.1) { // Player 2 eats player 1
          player2.mass += player1.mass * 0.8;
          io.to(player1.id).emit('eaten', { by: player2.name });
          respawnPlayer(player1);
        }
      }
    }
  }
}

// Respawn a player at a random position
function respawnPlayer(player) {
    if (!player) return; // Check if player exists
    const socket = sockets[player.id]; // Get the socket
    console.log(`Respawning player ${player.name} (${player.id})`);
    player.x = Math.random() * WORLD_WIDTH;
    player.y = Math.random() * WORLD_HEIGHT;
    player.mass = START_MASS;
    // Optionally, notify the specific player about their respawn details
    if (socket) {
        socket.emit('respawned', { x: player.x, y: player.y, mass: player.mass });
    }
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

// Check for collisions between player and mass food
function checkMassFoodCollision(player) {
  for (let i = massFood.length - 1; i >= 0; i--) {
    const mf = massFood[i];
    // Don't let players eat their own ejected mass immediately
    const age = Date.now() - mf.creationTime;
    if (mf.ownerId === player.id && age < 1000) continue; // 1 second immunity

    const dx = player.x - mf.x;
    const dy = player.y - mf.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If distance is less than player radius + mass food radius (approx sqrt(mass))
    if (distance < player.mass + Math.max(2, Math.sqrt(mf.mass))) { // Use sqrt(mass) for radius
      // Increase player mass
      player.mass += mf.mass;
      // Remove the mass food
      massFood.splice(i, 1);
      // Return true to indicate collision
      return true;
    }
  }
  return false;
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
    // Use targetX/Y for feed direction instead of mouseX/Y
    const angle = Math.atan2(player.targetY - player.y, player.targetX - player.x);
    if (player && player.mass >= MIN_MASS_TO_FEED) {
        player.mass -= FEED_MASS_COST;
        spawnMassFood(player, angle); // Pass angle to spawn function
    }
  });

  // Handle Split command
  socket.on('split', function() {
    const player = players[socket.id];
    if (player && player.mass >= MIN_MASS_TO_SPLIT) {
        console.log(`Player ${player.name} requested split (mass: ${player.mass}). Split logic not implemented yet.`);
        // TODO: Implement actual splitting logic
    }
  });
});

// Game update loop (e.g., 20 times per second -> 50ms interval)
const TICK_RATE = 50; // ms per tick
setInterval(function() {
  // 1. Update Player Positions (SERVER-AUTHORITATIVE MOVEMENT)
  for (const id in players) {
      const player = players[id];
      const targetX = player.targetX;
      const targetY = player.targetY;
      const currentX = player.x;
      const currentY = player.y;

      const dx = targetX - currentX;
      const dy = targetY - currentY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1) { // Only move if target is significantly away
          // Calculate speed based on mass (larger = slower)
          const speed = PLAYER_SPEED / Math.max(1, Math.sqrt(player.mass / START_MASS));

          // Calculate movement step for this tick
          // Ensure movement doesn't overshoot the target in one tick
          const moveX = Math.min(speed, dist) * (dx / dist);
          const moveY = Math.min(speed, dist) * (dy / dist);

          player.x += moveX;
          player.y += moveY;

          // Keep player within bounds
          player.x = Math.max(0, Math.min(WORLD_WIDTH, player.x));
          player.y = Math.max(0, Math.min(WORLD_HEIGHT, player.y));
      }

      // Check collisions AFTER moving the player
      checkFoodCollision(player);
      checkMassFoodCollision(player);
  }

  // 2. Update Movable Entities (Mass Food)
  for (let i = massFood.length - 1; i >= 0; i--) {
    const mf = massFood[i];
    mf.x += mf.speedX;
    mf.y += mf.speedY;
    mf.mass *= (1 - MASS_FOOD_DECAY_RATE); // Decay mass

    // Remove if out of bounds or too small
    if (mf.x < 0 || mf.x > WORLD_WIDTH || mf.y < 0 || mf.y > WORLD_HEIGHT || mf.mass < 1) {
      massFood.splice(i, 1);
    }
  }

  // 3. Apply Player Mass Decay
  for (const id in players) {
    const player = players[id];
    player.mass = Math.max(START_MASS, player.mass * (1 - MASS_DECAY_RATE));
  }

  // 4. Check Player vs Player Collisions (uses updated positions)
  checkPlayerCollisions();

  // 5. Update Leaderboard
  updateLeaderboard();

  // 6. Broadcast Game State (with authoritative positions)
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
    foods: foods, // Sending full food list might be inefficient for large numbers
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