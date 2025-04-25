const http = require('http');
const { Server } = require("socket.io");

const server = http.createServer((req, res) => {
  // Basic HTTP response for health checks or info
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Noot.io Backend Server Running\n');
});

const io = new Server(server, {
  cors: {
    origin: "*", // TODO: Restrict this in production!
    methods: ["GET", "POST"]
  }
});

// --- Game State ---
const players = {}; // Store player data { socketId: { x, y, size, color, name }, ... }
const food = [];    // Store food pellets { id, x, y, color }
const FOOD_COUNT = 100; // Example: Number of food pellets
const MAP_WIDTH = 2000; // Example map dimensions
const MAP_HEIGHT = 2000;

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Initialize food
function initFood() {
  food.length = 0; // Clear existing food
  for (let i = 0; i < FOOD_COUNT; i++) {
    food.push({
      id: `food-${i}-${Date.now()}`,
      x: Math.random() * MAP_WIDTH,
      y: Math.random() * MAP_HEIGHT,
      color: getRandomColor()
    });
  }
}

initFood();
console.log(`Initialized ${food.length} food pellets.`);

console.log('Socket.IO server initialized');

io.on('connection', (socket) => {
  console.log('[Connection] Player connected:', socket.id);

  // 1. Create new player object
  players[socket.id] = {
    id: socket.id,
    x: Math.random() * MAP_WIDTH * 0.8 + MAP_WIDTH * 0.1, // Start near center
    y: Math.random() * MAP_HEIGHT * 0.8 + MAP_HEIGHT * 0.1,
    size: 10, // Initial size
    color: getRandomColor(),
    name: `Player_${socket.id.substring(0, 4)}` // Simple default name
  };
  console.log('[Connection] Created player:', players[socket.id]);

  // 2. Send initial state to the new player
  socket.emit('init_game', {
    playerId: socket.id,
    players: players, // Send all current players
    food: food         // Send all current food
  });
  console.log('[Connection] Sent init_game to:', socket.id);

  // 3. Notify existing players about the new player
  socket.broadcast.emit('player_joined', players[socket.id]);
  console.log('[Connection] Broadcasted player_joined:', socket.id);


  // --- Event Listeners ---

  socket.on('disconnect', () => {
    console.log('[Disconnection] Player disconnected:', socket.id);
    // Remove player from state
    delete players[socket.id];
    // Notify remaining players
    io.emit('player_left', socket.id);
    console.log('[Disconnection] Broadcasted player_left:', socket.id);
  });

  // Listen for player updates (e.g., movement)
  socket.on('player_update', (data) => {
    const player = players[socket.id];
    if (player) {
      // Basic update - directly set position from client
      // TODO: Add validation, smoothing, server-side movement logic later
      player.x = data.x;
      player.y = data.y;
      // player.size = data.size; // Maybe update size too

      // Broadcast the updated position to other players
      socket.broadcast.emit('player_moved', { id: socket.id, x: player.x, y: player.y /*, size: player.size */ });
    } else {
      console.warn('[player_update] Received update for unknown player:', socket.id);
    }
  });

  // TODO: Handle player eating food
  socket.on('eat_food', (foodId) => {
    const player = players[socket.id];
    const foodIndex = food.findIndex(f => f.id === foodId);

    if (player && foodIndex !== -1) {
      const eatenFood = food.splice(foodIndex, 1)[0]; // Remove food
      player.size += 1; // Increase player size (simple example)

      // Notify all players about the food being eaten and the player growth
      io.emit('food_eaten', { foodId: eatenFood.id, playerId: player.id, newSize: player.size });

      // Respawn food (simple respawn logic)
      food.push({
        id: `food-${food.length}-${Date.now()}`,
        x: Math.random() * MAP_WIDTH,
        y: Math.random() * MAP_HEIGHT,
        color: getRandomColor()
      });
      io.emit('food_spawned', food[food.length - 1]);
    }
  });

  // TODO: Handle player eating other players

  // TODO: Handle setting player name
  socket.on('set_name', (name) => {
    const player = players[socket.id];
    if (player) {
      player.name = name.substring(0, 16); // Limit name length
      io.emit('player_name_changed', { id: socket.id, name: player.name });
      console.log(`Player ${socket.id} set name to ${player.name}`);
    }
  });

});

// --- Game Loop (Optional - for server-authoritative actions) ---
// Example: Periodically broadcast the full state
// setInterval(() => {
//   io.emit('game_state_update', { players, food });
// }, 1000 / 20); // e.g., 20 times per second

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 