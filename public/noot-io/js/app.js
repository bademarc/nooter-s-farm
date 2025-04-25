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

// Interpolation factor (adjust for smoother/more responsive)
const INTERPOLATION_FACTOR = 0.15;

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
    isGameRunning = false; // Stop game logic
    players = []; // Clear local player list on disconnect
    foods = [];
    massFood = []; // Clear mass food too
    player = {}; // Reset local player
    // Show start menu again
    const startMenu = document.getElementById('start-menu');
    const gameCanvas = document.getElementById('game-canvas');
    if (startMenu) startMenu.style.display = 'block';
    if (gameCanvas) gameCanvas.style.display = 'none';
    // Hide restart button if visible
    const restartButton = document.getElementById('restart-button');
    if (restartButton) restartButton.style.display = 'none';
  });

  // NEW: Handle player's own state updates
  socket.on('updatedSelf', (data) => {
      if (!player || player.id !== data.id) return; // Ignore if not our player

      // --- DEBUGGING ---
      // console.log('[Noot.io Debug] Received updatedSelf:', JSON.stringify(data));
      // --- END DEBUGGING ---

      // Store the authoritative server position
      player.serverX = data.x;
      player.serverY = data.y;
      // Update mass and check coins
      if (player.mass !== data.mass) {
          player.mass = data.mass;
          checkEarnedCoins(player.mass);
      }
      // Update other properties if they exist in the payload (e.g., color, name - though these rarely change)
      if (data.color) player.color = data.color;
      if (data.name) player.name = data.name;
  });

  // NEW: Handle updates for entities nearby the player
  socket.on('nearbyEntitiesUpdate', (data) => {
      if (!player || !player.id) return; // Only process if we are playing

      // --- Update Nearby Players ---
      const serverNearbyPlayers = data.players || [];
      const localPlayerIds = new Set(players.map(p => p.id));
      const serverPlayerIds = new Set(serverNearbyPlayers.map(p => p.id));

      // Update or add players from server data
      serverNearbyPlayers.forEach(serverP => {
          let localP = players.find(p => p.id === serverP.id);
          if (localP) {
              // Update existing player's server state
              localP.serverX = serverP.x;
              localP.serverY = serverP.y;
              localP.mass = serverP.mass;
              localP.color = serverP.color;
              localP.name = serverP.name;
          } else {
              // Add new player seen nearby
              serverP.renderX = serverP.x; // Initialize render pos
              serverP.renderY = serverP.y;
              serverP.serverX = serverP.x; // Initialize server pos
              serverP.serverY = serverP.y;
              players.push(serverP);
              // console.log(`[Noot.io App] Added nearby player ${serverP.name} (${serverP.id})`);
          }
      });

      // Remove players who are no longer nearby
      players = players.filter(localP => serverPlayerIds.has(localP.id));


      // --- Update Nearby Food ---
      const serverNearbyFood = data.foods || [];
      const localFoodIds = new Set(foods.map(f => f.id));
      const serverFoodIds = new Set(serverNearbyFood.map(f => f.id));

      // Add new food items seen nearby
      serverNearbyFood.forEach(serverF => {
          if (!localFoodIds.has(serverF.id)) {
              foods.push(serverF);
          }
          // No need to update food positions usually, they don't move
      });

       // Remove food items that are no longer nearby (more efficient than full replace)
      foods = foods.filter(localF => serverFoodIds.has(localF.id));


      // --- Update Nearby Mass Food ---
      const serverNearbyMassFood = data.massFood || [];
      const localMassFoodIds = new Set(massFood.map(mf => mf.id));
      const serverMassFoodIds = new Set(serverNearbyMassFood.map(mf => mf.id));

       // Update or add mass food items
      serverNearbyMassFood.forEach(serverMF => {
          let localMF = massFood.find(mf => mf.id === serverMF.id);
          if (localMF) {
               // Update existing mass food's position (server state)
               // Mass food doesn't use interpolation currently, so update directly?
               // Or store server pos for potential future interpolation
              localMF.x = serverMF.x;
              localMF.y = serverMF.y;
              localMF.mass = serverMF.mass; // Mass decays
              localMF.color = serverMF.color;
          } else {
              // Add new mass food seen nearby
              massFood.push(serverMF);
          }
      });

       // Remove mass food items that are no longer nearby
      massFood = massFood.filter(localMF => serverMassFoodIds.has(localMF.id));

  });


  // Listen for being eaten
  socket.on('eaten', (data) => {
      console.log(`[Noot.io App] Eaten by ${data.by}!`);
      isGameRunning = false; // Stop local processing
      // Show restart prompt
      const restartButton = document.getElementById('restart-button');
      if (restartButton) restartButton.style.display = 'block';
      // Clear local player state, server handles respawn data
      player = {};
      players = []; // Clear other players too
      foods = [];
      massFood = [];
  });

  // Listen for explicit respawn data from server
  socket.on('respawned', (data) => {
      console.log("[Noot.io App] Received respawn data");
      // Update player object with new server state and reset render position
      // Re-initialize the player object fully from respawn data
      player = {
          id: data.id || socket.id, // Use id from data or fallback
          name: data.name, // Use name from data
          x: data.x,
          y: data.y,
          serverX: data.x,
          serverY: data.y,
          renderX: data.x,
          renderY: data.y,
          mass: data.mass,
          color: data.color
      };
      lastKnownMass = player.mass; // Reset mass tracker
      isGameRunning = true; // Re-enable game loop
      // Hide restart button
      const restartButton = document.getElementById('restart-button');
      if (restartButton) restartButton.style.display = 'none';
      console.log("[Noot.io App] Respawned as:", player);
  });

  // Listen for initial game state
  socket.on('initGame', (data) => {
    // --- DEBUGGING --- Log received initial player data
    // console.log('[Noot.io Debug] Received data.player in initGame:', JSON.stringify(data.player));
    // --- END DEBUGGING ---

    console.log("[Noot.io App] Received initGame");
    player = data.player || {};
    // Initialize server and render positions
    player.serverX = player.x;
    player.serverY = player.y;
    player.renderX = player.x;
    player.renderY = player.y;

    // Initialize other players received in initGame (now simplified)
    players = (data.players || []).filter(p => p.id !== player.id).map(p => ({
        ...p,
        renderX: p.x, // Initial render = server position
        renderY: p.y,
        serverX: p.x, // Initial server position
        serverY: p.y
    }));

    foods = data.foods || []; // Initialize local food list (simplified data)
    massFood = data.massFood || []; // Initialize mass food list (simplified data)
    leaderboard = []; // Leaderboard comes via 'leaderboardUpdate'
    lastKnownMass = player.mass || 0;
    isGameRunning = true; // Allow game loop to run

    console.log("[Noot.io App] My Player Initialized:", player);
    console.log("[Noot.io App] Initial Other Players:", players);

    // Hide menu, show canvas AFTER initGame
    const startMenu = document.getElementById('start-menu');
    const gameCanvas = document.getElementById('game-canvas');
    if (startMenu) startMenu.style.display = 'none';
    if (gameCanvas) gameCanvas.style.display = 'block';
    resizeCanvas(); // Ensure canvas is sized correctly

    // --- DEBUGGING --- Log the created player object
    // console.log('[Noot.io Debug] Client player object created:', JSON.stringify(player));
    // --- END DEBUGGING ---
  });

   // Handle new players joining (add to local list for interpolation)
  socket.on('playerJoined', (newPlayer) => {
    // No longer strictly needed if nearbyEntitiesUpdate handles adds,
    // but can keep for immediate visibility or logging.
    if (player.id && newPlayer.id !== player.id && !players.some(p => p.id === newPlayer.id)) {
      console.log("[Noot.io App] Player Joined:", newPlayer.name);
      // Add with initial positions (nearbyEntitiesUpdate will refine)
      newPlayer.renderX = newPlayer.x;
      newPlayer.renderY = newPlayer.y;
      newPlayer.serverX = newPlayer.x;
      newPlayer.serverY = newPlayer.y;
      players.push(newPlayer);
    }
  });

  // Handle players leaving (remove from local list)
  socket.on('playerLeft', (playerId) => {
    console.log("[Noot.io App] Player Left:", playerId);
    players = players.filter(p => p.id !== playerId);
  });

  // Handle food spawning
  socket.on('foodSpawned', function(food) {
    // Only add if we don't have it (nearbyEntitiesUpdate might also add it)
    if (!foods.find(f => f.id === food.id)) {
      foods.push(food);
    }
  });

  // Handle food eating
  socket.on('foodEaten', function(foodId) {
    foods = foods.filter(f => f.id !== foodId);
  });

  // NEW: Handle mass food spawning
  socket.on('massFoodSpawned', function(mf) {
      // Only add if we don't have it
      if (!massFood.find(m => m.id === mf.id)) {
          massFood.push(mf);
      }
  });

  // NEW: Handle single mass food removal (decay/out of bounds)
  socket.on('massFoodRemoved', function(mfId) {
      massFood = massFood.filter(mf => mf.id !== mfId);
  });

   // NEW: Handle batch mass food removal (eaten by players)
  socket.on('massFoodRemovedBatch', function(mfIds) {
      const idSet = new Set(mfIds);
      massFood = massFood.filter(mf => !idSet.has(mf.id));
  });

  // NEW: Handle leaderboard updates
  socket.on('leaderboardUpdate', function(newLeaderboard) {
      leaderboard = newLeaderboard || [];
  });
}

// Simple Linear Interpolation function
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

// Game rendering functions
function drawCircle(x, y, radius, color) {
  // Add a check for NaN as well, just in case
  if (typeof x !== 'number' || isNaN(x) || typeof y !== 'number' || isNaN(y) || typeof radius !== 'number' || isNaN(radius) || radius <= 0) {
      console.error(`[drawCircle] Invalid parameters: x=${x}, y=${y}, radius=${radius}, color=${color}`);
      return; // Don't draw if parameters are invalid
  }
  // console.log(`[drawCircle] Attempting: x=${x.toFixed(1)}, y=${y.toFixed(1)}, radius=${radius.toFixed(1)}, color=${color}`); // Commented out - Performance intensive!
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
  // --- DEBUGGING --- Log the player object being drawn
  // console.log(`[Noot.io Debug] drawPlayer called with p (ID: ${p.id}):`, JSON.stringify(p)); // Commented out - too noisy potentially
  // --- END DEBUGGING ---

  // Calculate radius based on mass (e.g., sqrt for area relation)
  const radius = p.mass; // Still using mass directly for radius for now
  drawCircle(p.x, p.y, radius, p.color || '#FFFFFF');
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

let isGameRunning = false; // Flag to control game loop execution

// Game loop
function gameLoop() {
  if (!canvas || !ctx) {
    requestAnimationFrame(gameLoop);
    return;
  }

  // Only run game logic/rendering if connected and initialized
  if (!isGameRunning || !player || !player.id) {
     ctx.fillStyle = '#111827'; // Draw background
     ctx.fillRect(0, 0, canvas.width, canvas.height);
     // Optional: Draw a "Connecting..." or "Disconnected" message
     if (!socket || !socket.connected) {
         drawText('Disconnected. Reconnecting...', canvas.width / 2, canvas.height / 2, '#AAAAAA', 20);
     } else if (!isGameRunning) {
         drawText('Waiting for server...', canvas.width / 2, canvas.height / 2, '#AAAAAA', 20);
     }
     requestAnimationFrame(gameLoop);
     return;
  }

  // --- Send mouse position to server ---
  if (socket && socket.connected) {
    // Map mouse coords relative to the player's *current render position* for target calculation
    const worldMouseX = player.renderX + (mouseX - canvas.width / 2);
    const worldMouseY = player.renderY + (mouseY - canvas.height / 2);
    socket.emit('mouseMove', { mouseX: worldMouseX, mouseY: worldMouseY });
  }

  // --- Interpolate Positions ---
  // Interpolate self
  if (player.serverX !== undefined) {
      player.renderX = lerp(player.renderX, player.serverX, INTERPOLATION_FACTOR);
      player.renderY = lerp(player.renderY, player.serverY, INTERPOLATION_FACTOR);
  }
  // Interpolate others
  players.forEach(p => {
      if (p.serverX !== undefined) {
          p.renderX = lerp(p.renderX, p.serverX, INTERPOLATION_FACTOR);
          p.renderY = lerp(p.renderY, p.serverY, INTERPOLATION_FACTOR);
      }
  });

  // --- Rendering (uses interpolated renderX/renderY) ---
  try {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Use interpolated render position for camera center
    let cameraX = player.renderX;
    let cameraY = player.renderY;

    if (isNaN(cameraX) || isNaN(cameraY)) {
      console.error("[Noot.io Loop] Invalid camera position!", { cameraX, cameraY, player });
      cameraX = canvas.width / 2;
      cameraY = canvas.height / 2;
    }

    // Draw food
    foods.forEach(food => {
      const drawX = food.x - cameraX + canvas.width / 2;
      const drawY = food.y - cameraY + canvas.height / 2;
      const radius = food.mass ? Math.max(2, Math.sqrt(food.mass)) : 5;
      if (drawX + radius > 0 && drawX - radius < canvas.width && drawY + radius > 0 && drawY - radius < canvas.height) {
          drawFood({ x: drawX, y: drawY, color: food.color, mass: food.mass });
      }
    });

    // Draw mass food
    massFood.forEach(mf => {
      const drawX = mf.x - cameraX + canvas.width / 2;
      const drawY = mf.y - cameraY + canvas.height / 2;
      const radius = Math.max(2, Math.sqrt(mf.mass));
      if (drawX + radius > 0 && drawX - radius < canvas.width && drawY + radius > 0 && drawY - radius < canvas.height) {
          drawCircle(drawX, drawY, radius, mf.color);
      }
    });

    // Draw other players (using their renderX/renderY)
    players.forEach(p => {
      const drawX = p.renderX - cameraX + canvas.width / 2;
      const drawY = p.renderY - cameraY + canvas.height / 2;
      const radius = p.mass || 10;
       if (drawX + radius > 0 && drawX - radius < canvas.width && drawY + radius > 0 && drawY - radius < canvas.height) {
          drawPlayer({ x: drawX, y: drawY, mass: p.mass, name: p.name, color: p.color });
      }
    });

    // Draw current player (always draw self, centered, using interpolated position for data but drawing at center)
    const selfDrawX = canvas.width / 2;
    const selfDrawY = canvas.height / 2;
    drawPlayer({ x: selfDrawX, y: selfDrawY, mass: player.mass, name: player.name, color: player.color });

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
  socket.emit('joinGame', { nickname: nickname });

  // DO NOT hide menu/show canvas here anymore. Wait for initGame.
  /*
  const startMenu = document.getElementById('start-menu');
  const gameCanvas = document.getElementById('game-canvas');
  if (startMenu) startMenu.style.display = 'none';
  if (gameCanvas) gameCanvas.style.display = 'block';
  resizeCanvas(); 
  */
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
    timeout: 10000 // Increase timeout to 10 seconds
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

  // Initial call to game loop (it will now wait for player.id)
  gameLoop();
}

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initApp); 