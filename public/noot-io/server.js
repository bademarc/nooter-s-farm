// Noot.io Server
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

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

// Serve static files
app.use(express.static(path.join(__dirname)));

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
    
    // If distance is less than player radius + food radius
    if (distance < player.mass) {
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
    
    for (let j = i + 1; j < playerIds.length; j++) {
      const player2 = players[playerIds[j]];
      
      // Calculate distance between players
      const dx = player1.x - player2.x;
      const dy = player1.y - player2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If they are overlapping
      if (distance < Math.max(player1.mass, player2.mass)) {
        // Determine which player is larger
        if (player1.mass > player2.mass * 1.1) {
          // Player 1 eats player 2
          player1.mass += player2.mass * 0.8;
          
          // Respawn player 2
          respawnPlayer(player2);
          
          // Notify player 2 that they were eaten
          io.to(player2.id).emit('eaten', { by: player1.name });
        } 
        else if (player2.mass > player1.mass * 1.1) {
          // Player 2 eats player 1
          player2.mass += player1.mass * 0.8;
          
          // Respawn player 1
          respawnPlayer(player1);
          
          // Notify player 1 that they were eaten
          io.to(player1.id).emit('eaten', { by: player2.name });
        }
      }
    }
  }
}

// Respawn a player at a random position
function respawnPlayer(player) {
  player.x = Math.random() * WORLD_WIDTH;
  player.y = Math.random() * WORLD_HEIGHT;
  player.mass = START_MASS;
}

// Add a function to spawn mass food (ejected by players)
function spawnMassFood(player) {
  const angle = Math.atan2(player.mouseY - player.y, player.mouseX - player.x); // Use stored mouse direction
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
    if (mf.ownerId === player.id && (Date.now() - mf.creationTime < 1000)) continue;

    const dx = player.x - mf.x;
    const dy = player.y - mf.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If distance is less than player radius + mass food radius (approx sqrt(mass))
    if (distance < player.mass + Math.sqrt(mf.mass)) {
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
  console.log('A player connected!');
  
  // When a player joins the game
  socket.on('joinGame', function(data) {
    console.log('Player joined:', data.nickname);
    
    // Create a new player
    const player = {
      id: socket.id,
      name: data.nickname || 'Anonymous',
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      mass: START_MASS,
      color: getRandomColor()
    };
    
    // Store the player
    players[socket.id] = player;
    sockets[socket.id] = socket;
    
    // Send initial game state to the player
    socket.emit('initGame', {
      player: player,
      players: Object.values(players),
      foods: foods
    });
    
    // Update leaderboard
    updateLeaderboard();
  });
  
  // When a player moves
  socket.on('mouseMove', function(data) {
    const player = players[socket.id];
    
    if (player) {
      // Calculate direction vector
      const dx = data.mouseX - player.x;
      const dy = data.mouseY - player.y;
      
      // Normalize
      const length = Math.sqrt(dx * dx + dy * dy);
      
      // Store mouse position for feeding direction
      player.mouseX = data.mouseX;
      player.mouseY = data.mouseY;
      
      if (length > 0) {
        // Calculate speed based on mass (larger = slower)
        const speed = PLAYER_SPEED / Math.sqrt(player.mass);
        
        // Move player
        player.x += (dx / length) * speed;
        player.y += (dy / length) * speed;
        
        // Keep player within bounds
        player.x = Math.max(0, Math.min(WORLD_WIDTH, player.x));
        player.y = Math.max(0, Math.min(WORLD_HEIGHT, player.y));
        
        // Check for food collision
        checkFoodCollision(player);
        // Check for mass food collision
        checkMassFoodCollision(player);
      }
    }
  });
  
  // When a player disconnects
  socket.on('disconnect', function() {
    console.log('Player disconnected!');
    
    // Remove the player
    delete players[socket.id];
    delete sockets[socket.id];
    
    // Update leaderboard
    updateLeaderboard();
  });

  // Handle Feed command (e.g., 'W' key)
  socket.on('feed', function() {
    const player = players[socket.id];
    if (player && player.mass >= MIN_MASS_TO_FEED) {
        player.mass -= FEED_MASS_COST;
        spawnMassFood(player);
         // Maybe emit an update just for this player? Or rely on main loop
    }
  });

  // Handle Split command (e.g., 'Space' key)
  // TODO: Implement actual splitting logic - complex!
  // This requires managing multiple cells per player.
  // For now, just log it.
  socket.on('split', function() {
    const player = players[socket.id];
    if (player && player.mass >= MIN_MASS_TO_SPLIT) {
        console.log(`Player ${player.name} requested split (mass: ${player.mass}). Split logic not implemented yet.`);
        // Actual split logic would involve:
        // - Creating a new cell object associated with the player
        // - Dividing mass between the cells
        // - Ejecting the new cell in the direction of the mouse
        // - Managing merging timers
        // - Updating collision and movement logic for multiple cells
    }
  });
});

// Game update loop (20 times per second)
setInterval(function() {
  // Update and decay mass food
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
  
  // Apply mass decay to all players
  for (const id in players) {
    const player = players[id];
    player.mass = Math.max(START_MASS, player.mass * (1 - MASS_DECAY_RATE));
  }
  
  // Check for player collisions
  checkPlayerCollisions();
  
  // Update leaderboard
  updateLeaderboard();
  
  // Send game state to all players
  io.emit('update', {
    players: Object.values(players),
    foods: foods,
    massFood: massFood, // Include massFood in the update
    leaderboard: leaderboard
  });
}, 50);

// Initialize food when server starts
initializeFood();

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, function() {
  console.log(`Noot.io server started on port ${PORT}`);
}); 