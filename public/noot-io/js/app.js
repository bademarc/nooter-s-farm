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
let massFood = []; // Add array for mass food
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

  // Listen for the main game state update
  socket.on('update', (data) => {
    // Find our player data in the update
    const updatedSelf = data.players.find(p => p.id === player.id);
    if (updatedSelf) {
      // Only update position/mass if server differs significantly?
      // For simplicity, just update based on server state
      player.x = updatedSelf.x;
      player.y = updatedSelf.y;
      if (player.mass !== updatedSelf.mass) {
          player.mass = updatedSelf.mass;
          checkEarnedCoins(player.mass); // Check coins on mass change
      }
      player.color = updatedSelf.color; // Keep color updated
    }

    // Update other players (filter out self)
    players = data.players.filter(p => p.id !== player.id);
    foods = data.foods; // Update food list
    massFood = data.massFood; // Update mass food list
    leaderboard = data.leaderboard; // Update leaderboard
  });

  // Listen for being eaten
  socket.on('eaten', (data) => {
    console.log(`[Noot.io App] Eaten by ${data.by}!`);
    // Show restart prompt or handle respawn
    const restartButton = document.getElementById('restart-button');
    if (restartButton) restartButton.style.display = 'block';
    // Reset local player state? Server might handle respawn position.
    player = {}; // Clear local player data
  });

  // --- Remove or Adapt Old Listeners ---
  // Remove the old 'update' listener if it exists
  // socket.off('update'); // Or check if it's still needed
  // Remove old granular listeners if 'update' handles everything
  socket.off('init_game');
  socket.off('player_joined');
  socket.off('player_left');
  socket.off('player_moved');
  socket.off('food_eaten');
  socket.off('food_spawned');
  socket.off('player_name_changed');
  // TODO: Re-add 'init_game' or equivalent for initial setup?
  // Need a way to get the initial player ID and state.
  // Let's keep 'initGame' on the server and add a listener here for now.
  socket.on('initGame', (data) => {
    console.log("[Noot.io App] Received initGame");
    player = data.player || {}; // Store our player data
    players = data.players.filter(p => p.id !== player.id); // Store other players
    foods = data.foods; // Store initial food
    massFood = []; // Initial mass food is empty
    lastKnownMass = player.mass || 0; // Initialize mass tracking
    console.log("[Noot.io App] My Player:", player);
  });
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
    drawText(`${i+1}. ${player.name || 'Anonymous'}: ${Math.floor(player.mass)}`, canvas.width - 90, 45 + i * 20, '#FFFFFF', 14);
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

  // --- Send mouse position to server (used for movement AND feed direction) ---
  if (socket) {
     // Map mouse coords relative to player's world position for the server
    const worldMouseX = player.x + (mouseX - canvas.width / 2);
    const worldMouseY = player.y + (mouseY - canvas.height / 2);
    socket.emit('mouseMove', { mouseX: worldMouseX, mouseY: worldMouseY });
  }

  // Remove local optimistic updates and collision checks
  // Server state from 'update' event is now the source of truth
  /*
  // --- Calculate player's intended position based on mouse ---
  // Simple linear interpolation towards mouse
  // ... removed ...

  // --- Check for food collisions ---
  // Iterate backwards for safe removal
  // ... removed ...
  */

  // --- Log State Before Drawing ---
  // console.log(`[Noot.io Loop] State - Player: (${player.x?.toFixed(1)}, ${player.y?.toFixed(1)}) Size: ${player.mass} | Foods: ${foods.length} | Others: ${players.length}`);

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
      drawFood({ x: drawX, y: drawY, color: food.color, mass: food.mass }); // Pass mass for drawing
    });

    // Draw mass food
    massFood.forEach(mf => {
      const drawX = mf.x - cameraX + canvas.width / 2;
      const drawY = mf.y - cameraY + canvas.height / 2;
      // Draw mass food similar to regular food, but maybe smaller or different shape?
      // Using drawCircle for now, size based on sqrt(mass)
      drawCircle(drawX, drawY, Math.max(2, Math.sqrt(mf.mass)), mf.color);
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
    drawPlayer({ x: selfDrawX, y: selfDrawY, mass: player.mass, name: player.name, color: player.color }); // Use mass for drawing

    // Update Stats Display
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = `Mass: ${player.mass ? Math.floor(player.mass).toLocaleString() : 0}`;
    }

    // Draw leaderboard
    drawLeaderboard();
  } catch (e) {
      console.error("[gameLoop] Error during rendering phase:", e);
  }

  requestAnimationFrame(gameLoop);
}

// Start game function (called by button click)
function startGame() {
  // Reset restart button
  const restartButton = document.getElementById('restart-button');
  if (restartButton) restartButton.style.display = 'none';

  if (!socket || !socket.connected) {
    console.error("Socket not connected!");
    // Show error or server status message
    const serverStatus = document.getElementById('server-status');
    if (serverStatus) serverStatus.classList.remove('hidden');
    return;
  }
  const nicknameInput = document.getElementById('nickname');
  const nickname = nicknameInput ? nicknameInput.value.trim().substring(0, 16) || `Nooter_${Math.floor(Math.random()*1000)}` : `Nooter_${Math.floor(Math.random()*1000)}`;

  console.log("[Noot.io App] Joining game with name:", nickname);
  // Emit joinGame event instead of set_name
  socket.emit('joinGame', { nickname: nickname });

  // Reset local state before starting (server will send initial state via initGame)
  player = {};
  players = [];
  foods = [];
  massFood = [];
  lastKnownMass = 0;

  // Hide menu, show canvas
  const startMenu = document.getElementById('start-menu');
  const gameCanvas = document.getElementById('game-canvas');
  if (startMenu) startMenu.style.display = 'none';
  if (gameCanvas) gameCanvas.style.display = 'block';

  resizeCanvas(); // Ensure canvas is sized correctly
  // The game loop will start rendering once player data is received via 'initGame'
}

// --- Initialization ---
async function initApp() {
  console.log("[Noot.io App] Initializing...");
  resizeCanvas();
  setupMouseTracking();

  // Add key listeners for split/feed
  window.addEventListener('keydown', (e) => {
    if (!player || !player.id) return; // Only send if playing

    if (e.code === 'Space') { // Split
      e.preventDefault();
      socket.emit('split');
    }
    if (e.key === 'w' || e.key === 'W') { // Feed
      e.preventDefault();
      socket.emit('feed');
    }
  });

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

  // Add listener for restart button
  const restartButton = document.getElementById('restart-button');
  if (restartButton) {
      restartButton.addEventListener('click', () => {
          startGame(); // Re-join the game
      });
  }

  // Initial call to game loop (it will wait for player.id)
  gameLoop();
}

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initApp); 