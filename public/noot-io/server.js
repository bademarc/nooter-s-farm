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

// Game state
let players = {};
let foods = [];
let sockets = {};
let leaderboard = [];

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
});

// Game update loop (20 times per second)
setInterval(function() {
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