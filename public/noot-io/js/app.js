// Noot.io - A simplified version of the Agar.io game
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let socket; // Define socket variable, will be assigned later

// --- Helper to get WebSocket URL ---
function getWebSocketURL() {
  // Connect to the deployed Fly.io backend
  const url = 'wss://noot-nootio.fly.dev';
  console.log(`[Noot.io App] Connecting to WebSocket: ${url}`);
  return url;
}
// --- End Helper ---

let player = {};
let players = [];
let foods = [];
let leaderboard = [];
let mouseX = 0;
let mouseY = 0;
const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];

// --- Noot Wrapper Communication ---
let initialFarmCoins = 0;
let lastKnownMass = 0;
let parentOrigin = '*'; // IMPORTANT: Replace '*' with the actual origin of the parent window in production

// Listen for initial data from the wrapper
window.addEventListener('message', (event) => {
  // IMPORTANT: Validate event.origin here in production for security
  // if (event.origin !== 'YOUR_EXPECTED_ORIGIN') return;

  if (event.data && event.data.type === 'noot-io-init') {
    initialFarmCoins = event.data.farmCoins || 0;
    parentOrigin = event.origin; // Store the origin for sending messages back
    console.log('[Noot.io Game] Received initial farm coins:', initialFarmCoins);
  }
});

// Function to send earned coins back to the wrapper
function sendEarnedCoins(coins) {
  if (coins > 0) {
    console.log(`[Noot.io Game] Sending ${coins} earned coins.`);
    window.parent.postMessage({
      type: 'noot-io',
      action: 'earn-coins',
      coins: coins
    }, parentOrigin); // Use the stored origin
  }
}

// Function to check for earned coins based on mass
function checkEarnedCoins(currentMass) {
  const massThreshold = 100;
  const coinsPerThreshold = 10;

  const previousThreshold = Math.floor(lastKnownMass / massThreshold);
  const currentThreshold = Math.floor(currentMass / massThreshold);

  if (currentThreshold > previousThreshold) {
    const earnedCoins = (currentThreshold - previousThreshold) * coinsPerThreshold;
    sendEarnedCoins(earnedCoins);
  }

  lastKnownMass = currentMass; // Update last known mass
}
// --- End Noot Wrapper Communication ---

// Set canvas to full container size
function resizeCanvas() {
  if (!canvas) return;
  const container = canvas.parentElement;
  if (!container) return;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// Track mouse position
function setupMouseTracking() {
  if (!canvas) return;
  canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
}

// Wrap socket event listeners setup
function setupSocketListeners() {
  if (!socket) return;

  socket.on('connect', () => {
    console.log('[Noot.io App] Socket connected with ID:', socket.id);
    // Hide demo mode message if it was shown
    const serverStatus = document.getElementById('server-status');
    if (serverStatus) serverStatus.classList.add('hidden');
  });

  socket.on('connect_error', (err) => {
    console.error('[Noot.io App] Socket connection error:', err.message);
    // Show demo mode message
    const serverStatus = document.getElementById('server-status');
    if (serverStatus) serverStatus.classList.remove('hidden');
    // Potentially fall back to demo mode here
    // startDemoMode();
  });

  socket.on('disconnect', (reason) => {
    console.log('[Noot.io App] Socket disconnected:', reason);
    // TODO: Handle disconnection - maybe show message or attempt reconnect
    players = []; // Clear local player list on disconnect
    foods = [];
    player = {}; // Reset local player
    // Consider showing the start menu again
  });

  // Listen for initial game state from server
  socket.on('init_game', (data) => {
    console.log("[Noot.io App] Received init_game");
    player = data.players[data.playerId] || {}; // Store our player data
    // Filter out our own player object from the main list for rendering
    players = Object.values(data.players).filter(p => p.id !== data.playerId);
    foods = data.food;
    lastKnownMass = player.size || 0; // Initialize mass tracking
    console.log("[Noot.io App] My Player:", player);
    console.log("[Noot.io App] Other Players:", players);
  });

  // Listen for new players joining
  socket.on('player_joined', (newPlayer) => {
    console.log("[Noot.io App] Received player_joined:", newPlayer.id);
    if (newPlayer.id !== player.id) {
      players.push(newPlayer); // Add to list of other players
    }
  });

  // Listen for players leaving
  socket.on('player_left', (playerId) => {
    console.log("[Noot.io App] Received player_left:", playerId);
    players = players.filter(p => p.id !== playerId); // Remove from list
  });

  // Listen for player movement updates
  socket.on('player_moved', (data) => {
    // Update position of the specific player in our list
    const movedPlayer = players.find(p => p.id === data.id);
    if (movedPlayer) {
      movedPlayer.x = data.x;
      movedPlayer.y = data.y;
      // movedPlayer.size = data.size; // If size is sent
    }
  });

  // Listen for food being eaten
  socket.on('food_eaten', (data) => {
    // Remove food from local list
    foods = foods.filter(f => f.id !== data.foodId);
    // Update the size of the player who ate (could be us or someone else)
    if (player.id === data.playerId) {
      player.size = data.newSize;
      checkEarnedCoins(player.size); // Check for earned coins
    } else {
      const eater = players.find(p => p.id === data.playerId);
      if (eater) {
        eater.size = data.newSize;
      }
    }
  });

  // Listen for new food spawning
  socket.on('food_spawned', (newFood) => {
    foods.push(newFood);
  });

  // Listen for name changes
  socket.on('player_name_changed', (data) => {
    if (player.id === data.id) {
      player.name = data.name;
    } else {
      const namedPlayer = players.find(p => p.id === data.id);
      if (namedPlayer) {
        namedPlayer.name = data.name;
      }
    }
  });

  // --- Remove or Adapt Old Listeners ---
  // Remove the old 'update' listener if it exists
  // socket.off('update'); // Or check if it's still needed

}

// Game rendering functions
function drawCircle(x, y, radius, color) {
  // Defensive checks
  if (isNaN(x) || isNaN(y) || isNaN(radius) || radius <= 0) {
    console.error(`[drawCircle] Invalid parameters: x=${x}, y=${y}, radius=${radius}`);
    return;
  }
  console.log(`[drawCircle] Attempting: x=${x.toFixed(1)}, y=${y.toFixed(1)}, radius=${radius.toFixed(1)}, color=${color}`); // Log attempt
  try {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color || '#FF00FF'; // Default to bright magenta if color is invalid
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; // White outline
    ctx.lineWidth = 1;
    ctx.stroke(); // Draw outline
  } catch (e) {
    console.error("[drawCircle] Error during drawing:", e);
  }
}

function drawText(text, x, y, color, size) {
  if (isNaN(x) || isNaN(y) || isNaN(size) || size <= 0) {
      console.error(`[drawText] Invalid parameters: x=${x}, y=${y}, size=${size}`);
      return;
  }
  // console.log(`[drawText] Drawing "${text}" at (${x.toFixed(1)}, ${y.toFixed(1)}), size ${size}, color ${color}`);
  ctx.font = `${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

function drawPlayer(p) {
  // console.log("[drawPlayer] Data:", p); // Uncomment for full player data log
  drawCircle(p.x, p.y, p.size, p.color || '#FFFFFF');
  if (p.name) {
    drawText(p.name, p.x, p.y, '#FFFFFF', 14);
  }
}

function drawFood(food) {
   // console.log("[drawFood] Data:", food); // Uncomment for full food data log
  drawCircle(food.x, food.y, 5, food.color || '#8BC34A');
}

function drawLeaderboard() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(canvas.width - 170, 10, 160, 20 + leaderboard.length * 20);
  drawText('Leaderboard', canvas.width - 90, 25, '#FFFFFF', 16);
  
  leaderboard.forEach((player, i) => {
    drawText(`${i+1}. ${player.name || 'Anonymous'}: ${player.mass}`, canvas.width - 90, 45 + i * 20, '#FFFFFF', 14);
  });
}

// --- Collision Detection Helper ---
function checkCollision(circle1, circle2) {
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (circle1.size || circle1.mass) + (circle2.size || 5); // Assume food size is 5 if not specified
}

// Game loop
function gameLoop() {
  if (!canvas || !ctx || !player || !player.id) {
    // console.log("[Noot.io Loop] Waiting for player ID..."); // Optional: uncomment for detailed timing check
    requestAnimationFrame(gameLoop);
    return;
  }

  // --- Calculate player's intended position based on mouse ---
  // Simple linear interpolation towards mouse
  const speed = 5; // Adjust speed as needed
  let targetX = mouseX - canvas.width / 2;
  let targetY = mouseY - canvas.height / 2;
  const angle = Math.atan2(targetY, targetX);
  const deltaX = Math.cos(angle) * speed;
  const deltaY = Math.sin(angle) * speed;

  // Update local player position optimistically for smoothness
  // Server will eventually send the authoritative position
  player.x += deltaX;
  player.y += deltaY;

  // TODO: Clamp player position to map bounds (using MAP_WIDTH, MAP_HEIGHT)

  // Emit the intended position to the server
  if (socket) {
    socket.emit('player_update', { x: player.x, y: player.y });
  }

  // --- Check for food collisions ---
  // Iterate backwards for safe removal
  for (let i = foods.length - 1; i >= 0; i--) {
    const foodItem = foods[i];
    if (checkCollision(player, foodItem)) {
      // Optimistically remove food locally & increase size for responsiveness
      player.size += 1; // Keep consistent with server-side increase
      checkEarnedCoins(player.size);
      const eatenFoodId = foodItem.id;
      foods.splice(i, 1);

      // Tell the server we ate this food
      if (socket) {
        socket.emit('eat_food', eatenFoodId);
      }
      // Break after eating one piece per frame (optional)
      // break;
    }
  }

  // TODO: Add player-player collision detection and emit events

  // --- Log State Before Drawing ---
  console.log(`[Noot.io Loop] State - Player: (${player.x?.toFixed(1)}, ${player.y?.toFixed(1)}) Size: ${player.size} | Foods: ${foods.length} | Others: ${players.length}`);

  // --- Rendering ---
  try {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let cameraX = player.x;
    let cameraY = player.y;

    if (isNaN(cameraX) || isNaN(cameraY)) {
      console.error("[Noot.io Loop] Invalid camera position!", { cameraX, cameraY, player });
      cameraX = canvas.width / 2; 
      cameraY = canvas.height / 2;
    }

    // Draw food
    foods.forEach(food => {
      const drawX = food.x - cameraX + canvas.width / 2;
      const drawY = food.y - cameraY + canvas.height / 2;
      // console.log(`[Noot.io Loop] Calc Food Draw Coords: (${drawX.toFixed(1)}, ${drawY.toFixed(1)})`); // Verbose
      drawFood({ x: drawX, y: drawY, color: food.color });
    });

    // Draw other players
    players.forEach(p => {
      const drawX = p.x - cameraX + canvas.width / 2;
      const drawY = p.y - cameraY + canvas.height / 2;
       // console.log(`[Noot.io Loop] Calc Other Player Draw Coords: (${drawX.toFixed(1)}, ${drawY.toFixed(1)})`); // Verbose
      drawPlayer({ x: drawX, y: drawY, size: p.size, name: p.name, color: p.color });
    });

    // Draw current player
    const selfDrawX = canvas.width / 2;
    const selfDrawY = canvas.height / 2;
    // console.log(`[Noot.io Loop] Calc Self Draw Coords: (${selfDrawX.toFixed(1)}, ${selfDrawY.toFixed(1)})`); // Verbose
    drawPlayer({ x: selfDrawX, y: selfDrawY, size: player.size, name: player.name, color: player.color });

    // Update Stats Display
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = `Mass: ${player.size ? player.size.toLocaleString() : 0}`;
    }
  } catch (e) {
      console.error("[gameLoop] Error during rendering phase:", e);
  }

  requestAnimationFrame(gameLoop);
}

// Start game function (called by button click)
function startGame() {
  if (!socket || !socket.connected) {
    console.error("Socket not connected!");
    // Show error or server status message
    const serverStatus = document.getElementById('server-status');
    if (serverStatus) serverStatus.classList.remove('hidden');
    return;
  }
  const nicknameInput = document.getElementById('nickname');
  const nickname = nicknameInput ? nicknameInput.value.trim().substring(0, 16) || `Nooter_${Math.floor(Math.random()*1000)}` : `Nooter_${Math.floor(Math.random()*1000)}`;

  console.log("[Noot.io App] Setting name:", nickname);
  socket.emit('set_name', nickname);

  // Reset local state before starting
  player = {};
  players = [];
  foods = [];
  lastKnownMass = 0;

  // Hide menu, show canvas
  const startMenu = document.getElementById('start-menu');
  const gameCanvas = document.getElementById('game-canvas');
  if (startMenu) startMenu.style.display = 'none';
  if (gameCanvas) gameCanvas.style.display = 'block';

  resizeCanvas(); // Ensure canvas is sized correctly
  // The game loop will start rendering once player data is received via 'init_game'
}

// --- Initialization ---
async function initApp() {
  console.log("[Noot.io App] Initializing...");
  resizeCanvas();
  setupMouseTracking();

  // Initialize Socket.IO connection
  const websocketURL = getWebSocketURL();
  socket = io(websocketURL, {
    reconnectionAttempts: 3, // Example: Limit reconnection attempts
    timeout: 5000 // Example: Connection timeout
  });

  setupSocketListeners();

  // Add event listener to the start button
  const startButton = document.getElementById('start-button');
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }

  // Initial call to game loop (it will wait for player.id)
  gameLoop();
}

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initApp); 