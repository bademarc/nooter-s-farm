// Noot.io - A simplified agar.io-like game
const canvas = document.getElementById('cvs');
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

// --- Noot Wrapper Communication --- (Moved listener into initApp)
let initialFarmCoins = 0;
let lastKnownMass = 0;
let parentOrigin = '*'; // IMPORTANT: Replace '*' with the actual origin of the parent window in production

// Function to send earned coins back to the wrapper
function sendEarnedCoins(coins) {
  if (coins > 0) {
    console.log(`[Noot.io Game] Sending ${coins} earned coins.`);
    window.parent.postMessage({ // Use window.parent for iframe context
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

// Game Constants (Added for Prediction)
const START_MASS = 10; // Assuming this matches server START_MASS
const PLAYER_SPEED = 5; // Assuming this matches server PLAYER_SPEED

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

// --- Skin Loading ---
const skinPaths = [
  'case items/bronze/noot-noot.jpg',
  'case items/bronze/NOOT.png',
  'case items/bronze/Dojo3.jpg',
  'case items/bronze/Chester.jpg',
  'case items/bronze/77-Bit.jpg',
  'case items/silver/PENGUIN.jpg',
  'case items/silver/PAINGU.jpg',
  'case items/golden/yup.jpg',
  'case items/golden/nutz.jpg',
  'case items/golden/bearish.jpg',
  'case items/golden/Wojact.jpg',
  'case items/golden/RETSBA.jpg',
  'case items/golden/PENGU.webp',
  'case items/golden/MOP.png',
  'case items/golden/Feathersabstract.jpg',
  'case items/golden/Abster.webp',
  'case items/golden/Abby.jpg',
  'case items/NFTs/bearish.jpg',
  'case items/NFTs/77-Bit.jpg'
];
const loadedSkins = {};
let skinsLoaded = false;

async function preloadSkins() {
  let loadPromises = [];
  for (const path of skinPaths) {
    loadPromises.push(new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        loadedSkins[path] = img; // Store loaded image
        console.log(`[Noot.io App] Loaded skin: ${path}`);
        resolve();
      };
      img.onerror = (err) => {
        console.error(`[Noot.io App] Failed to load skin: ${path}`, err);
        reject(err);
      };
      // Construct the path correctly relative to the HTML file in /client/
      // Assuming index.html is in /public/noot-io/client/
      // and images are in /public/case items/
      img.src = `../../../${path}`; // Corrected relative path from js/ to public/case items/
    }));
  }
  try {
    await Promise.all(loadPromises);
    skinsLoaded = true;
    console.log("[Noot.io App] All skins loaded successfully.");
  } catch (error) {
    console.error("[Noot.io App] Error loading one or more skins.", error);
    // Game can continue without skins, or show an error
  }
}
// --- End Skin Loading ---

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
    // Potentially fall back to demo mode here - handled by wrapper command now
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

  // Handle player's own state updates (with reconciliation)
  socket.on('updatedSelf', (data) => {
      if (!player || player.id !== data.id) return; // Ignore if not our player

      // Store the authoritative server position
      player.serverX = data.x;
      player.serverY = data.y;

      // Update mass and check coins
      if (player.mass !== data.mass) {
          player.mass = data.mass;
          checkEarnedCoins(player.mass);
      }
      // Update other properties if they exist in the payload
      if (data.color) player.color = data.color;
      if (data.name) player.name = data.name;

      // --- Reconciliation ---
      const diffX = player.serverX - player.x;
      const diffY = player.serverY - player.y;
      const distanceDiff = Math.sqrt(diffX * diffX + diffY * diffY);

      // If the difference is significant, gently nudge the predicted position
      if (distanceDiff > 1) {
          player.x += diffX * 0.1; // Adjust correction factor as needed
          player.y += diffY * 0.1;
      }
      // --- End Reconciliation ---
  });

  // Handle updates for entities nearby the player
  socket.on('nearbyEntitiesUpdate', (data) => {
      if (!player || !player.id) return; // Only process if we are playing

      // --- Update Nearby Players ---
      const serverNearbyPlayers = data.players || [];
      const localPlayerMap = new Map(players.map(p => [p.id, p]));
      const serverPlayerIds = new Set(serverNearbyPlayers.map(p => p.id));
      const updatedPlayers = [];

      serverNearbyPlayers.forEach(serverP => {
          let localP = localPlayerMap.get(serverP.id);
          if (localP) {
              // Update existing player's server state
              localP.serverX = serverP.x;
              localP.serverY = serverP.y;
              localP.mass = serverP.mass;
              localP.color = serverP.color;
              localP.name = serverP.name;
              // Skin data would come from server if online - not handled here
              updatedPlayers.push(localP);
          } else if (serverP.id !== player.id) {
              // Add new player seen nearby
              serverP.renderX = serverP.x; // Initialize render pos
              serverP.renderY = serverP.y;
              serverP.serverX = serverP.x; // Initialize server pos
              serverP.serverY = serverP.y;
              // Skin data would come from server if online - not handled here
              updatedPlayers.push(serverP);
          }
      });
      players = updatedPlayers;

      // --- Update Nearby Food --- (Simplified: Replace local with server's list)
      foods = data.foods || [];

      // --- Update Nearby Mass Food --- (Simplified: Replace local with server's list)
      massFood = data.massFood || [];
  });

  // Listen for being eaten
  socket.on('eaten', (data) => {
      console.log(`[Noot.io App] Eaten by ${data.by}!`);
      isGameRunning = false; // Stop local processing
      const restartButton = document.getElementById('restart-button');
      if (restartButton) restartButton.style.display = 'block';
      player = {};
      players = [];
      foods = [];
      massFood = [];
  });

  // Listen for explicit respawn data from server
  socket.on('respawned', (data) => {
      console.log("[Noot.io App] Received respawn data");
      player = {
          id: data.id || socket.id,
          name: data.name, // Use name from data
          x: data.x,
          y: data.y,
          serverX: data.x, // Initialize server pos
          serverY: data.y,
          renderX: data.x, // Initialize render pos
          renderY: data.y,
          mass: data.mass,
          color: data.color
          // Assign player skin again on respawn
          // skin: skinsLoaded ? loadedSkins['case items/bronze/noot-noot.jpg'] : null,
          // skinPath: 'case items/bronze/noot-noot.jpg'
      };

      // Assign player skin again after respawn
      if (player && skinsLoaded) {
          const playerSkinPath = 'case items/bronze/noot-noot.jpg';
          if (loadedSkins[playerSkinPath]) {
              player.skinPath = playerSkinPath;
              player.skin = loadedSkins[playerSkinPath];
          }
      }

      lastKnownMass = player.mass; // Reset mass tracker
      isGameRunning = true; // Re-enable game loop
      const restartButton = document.getElementById('restart-button');
      if (restartButton) restartButton.style.display = 'none';
      console.log("[Noot.io App] Respawned as:", player);
  });

  // Listen for initial game state (simplified for 'nearbyEntitiesUpdate')
  socket.on('initGame', (data) => {
    console.log("[Noot.io App] Received initGame");
    player = data.player || {};
    player.serverX = player.x;
    player.serverY = player.y;
    player.renderX = player.x;
    player.renderY = player.y;

    // Assign player skin upon initial join
    if (player && skinsLoaded) {
        const playerSkinPath = 'case items/bronze/noot-noot.jpg';
        if (loadedSkins[playerSkinPath]) {
            player.skinPath = playerSkinPath;
            player.skin = loadedSkins[playerSkinPath];
        }
    }

    // Nearby entities will populate players, foods, massFood
    players = [];
    foods = [];
    massFood = [];
    leaderboard = [];
    lastKnownMass = player.mass || 0;
    isGameRunning = true;

    console.log("[Noot.io App] My Player Initialized:", player);

    const startMenu = document.getElementById('start-menu');
    const gameCanvas = document.getElementById('game-canvas');
    if (startMenu) startMenu.style.display = 'none';
    if (gameCanvas) gameCanvas.style.display = 'block';
    resizeCanvas();
  });

  // Handle leaderboard updates
  socket.on('leaderboardUpdate', function(newLeaderboard) {
      leaderboard = newLeaderboard || [];
  });

  // Events below might be redundant if nearbyEntitiesUpdate is comprehensive,
  // but keep for now or specific use cases (like immediate feedback).

  // Handle new players joining (less critical now)
  socket.on('playerJoined', (newPlayer) => {
    if (player.id && newPlayer.id !== player.id && !players.some(p => p.id === newPlayer.id)) {
      console.log("[Noot.io App] Player Joined (via event):", newPlayer.name);
      newPlayer.renderX = newPlayer.x;
      newPlayer.renderY = newPlayer.y;
      newPlayer.serverX = newPlayer.x;
      newPlayer.serverY = newPlayer.y;
      // Need skin assignment logic here if using this event for online mode
      players.push(newPlayer);
    }
  });

  // Handle players leaving (still useful)
  socket.on('playerLeft', (playerId) => {
    console.log("[Noot.io App] Player Left:", playerId);
    players = players.filter(p => p.id !== playerId);
  });

  // Handle food spawning (less critical)
  socket.on('foodSpawned', function(food) {
    if (!foods.find(f => f.id === food.id)) {
      foods.push(food);
    }
  });

  // Handle food eating (still useful)
  socket.on('foodEaten', function(foodId) {
    foods = foods.filter(f => f.id !== foodId);
  });

  // Handle mass food spawning (less critical)
  socket.on('massFoodSpawned', function(mf) {
      if (!massFood.find(m => m.id === mf.id)) {
          massFood.push(mf);
      }
  });

  // Handle single mass food removal (still useful)
  socket.on('massFoodRemoved', function(mfId) {
      massFood = massFood.filter(mf => mf.id !== mfId);
  });

  // Handle batch mass food removal (still useful)
  socket.on('massFoodRemovedBatch', function(mfIds) {
      const idSet = new Set(mfIds);
      massFood = massFood.filter(mf => !idSet.has(mf.id));
  });
}

// Simple Linear Interpolation function
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

// --- NEW: Function to initialize socket connection (real or mock) ---
function initializeSocketConnection(mode) {
  return new Promise((resolve, reject) => {
    if (mode === 'offline') {
      console.log("[Noot.io App] Starting in OFFLINE mode.");
      // Ensure MockSocket is available (loaded via index.html)
      if (typeof MockSocket !== 'undefined') {
        try {
          socket = new MockSocket(); // Instantiate the mock
          setupSocketListeners(); // Set up listeners for the mock socket
          resolve(socket);
        } catch (error) {
           console.error("[Noot.io App] Error initializing MockSocket:", error);
           reject(error);
        }
      } else {
        console.error("[Noot.io App] MockSocket class not found. Cannot start offline mode.");
        reject(new Error("MockSocket not found"));
      }
    } else { // Default to online mode
      console.log("[Noot.io App] Starting in ONLINE mode.");
      const websocketURL = getWebSocketURL();
      try {
        socket = io(websocketURL, {
          reconnectionAttempts: 3,
          timeout: 10000,
          transports: ['websocket'] // Prioritize websocket
        });
        setupSocketListeners(); // Set up listeners for the real socket
        resolve(socket);
      } catch (error) {
          console.error("[Noot.io App] Error initializing real Socket.IO connection:", error);
          reject(error);
      }
    }
  });
}
// --- END NEW FUNCTION ---

// Game rendering functions
function drawCircle(x, y, radius, color) {
  if (typeof x !== 'number' || isNaN(x) || typeof y !== 'number' || isNaN(y) || typeof radius !== 'number' || isNaN(radius) || radius <= 0) {
      console.error(`[drawCircle] Invalid parameters: x=${x}, y=${y}, radius=${radius}, color=${color}`);
      return;
  }
  try {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color || '#FF00FF';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; // White outline
    ctx.lineWidth = 1;
    // ctx.stroke(); // Outline is drawn in drawPlayer after potential skin
  } catch (e) {
    console.error("[drawCircle] Error during drawing:", e);
  }
}

function drawText(text, x, y, color, size) {
  if (isNaN(x) || isNaN(y) || isNaN(size) || size <= 0) {
      console.error(`[drawText] Invalid parameters: x=${x}, y=${y}, size=${size}`);
      return;
  }
  ctx.font = `${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

// --- Modified drawPlayer to handle skins ---
function drawPlayer(p) {
  // Use renderX/renderY for drawing position
  const drawX = p.renderX;
  const drawY = p.renderY;
  const radius = Math.sqrt((p.mass || START_MASS) / Math.PI) * 10; // Example scaling radius based on mass

  // Default values
  let fillColor = p.color || '#FFFFFF';
  let strokeColor = '#FFFFFF'; // White outline by default

  // Use skin if available and loaded
  const skinPath = p.skinPath; // Get path from player object
  if (skinPath && skinsLoaded && loadedSkins[skinPath]) {
    const skinImg = loadedSkins[skinPath];

    ctx.save();
    ctx.beginPath();
    // Create a circular clipping path based on draw position and radius
    ctx.arc(drawX, drawY, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Draw the image centered within the clip path
    const imgWidth = skinImg.width;
    const imgHeight = skinImg.height;
    const diameter = radius * 2;
    let renderWidth, renderHeight, offsetX, offsetY;

    // Maintain aspect ratio, cover the circle
    if (imgWidth / imgHeight > 1) { // Image wider than tall
        renderHeight = diameter;
        renderWidth = diameter * (imgWidth / imgHeight);
        offsetX = drawX - renderWidth / 2;
        offsetY = drawY - radius;
    } else { // Image taller than wide or square
        renderWidth = diameter;
        renderHeight = diameter * (imgHeight / imgWidth);
        offsetX = drawX - radius;
        offsetY = drawY - renderHeight / 2;
    }

    // Ensure the covering dimension is at least the diameter
     if (renderWidth < diameter) {
          renderWidth = diameter;
          renderHeight = diameter * (imgHeight / imgWidth);
          offsetX = drawX - radius;
          offsetY = drawY - renderHeight / 2;
     }
     if (renderHeight < diameter) {
          renderHeight = diameter;
          renderWidth = diameter * (imgWidth / imgHeight);
          offsetX = drawX - renderWidth / 2;
          offsetY = drawY - radius;
     }

    // Draw the image
    try {
        ctx.drawImage(skinImg, offsetX, offsetY, renderWidth, renderHeight);
    } catch (e) {
        console.error("[drawPlayer] Error drawing skin image:", e, skinImg.src);
        ctx.restore(); // Need to restore before drawing fallback
        drawCircle(drawX, drawY, radius, fillColor);
    }

    ctx.restore(); // Remove the clipping path

    // Draw outline over the clipped image
    ctx.beginPath();
    ctx.arc(drawX, drawY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();

  } else {
    // Fallback: Draw colored circle if no skin or not loaded
    drawCircle(drawX, drawY, radius, fillColor);
    ctx.beginPath(); // Need a new path for the stroke
    ctx.arc(drawX, drawY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw name on top
  if (p.name) {
    // Draw name centered on the cell
    drawText(p.name, drawX, drawY, '#FFFFFF', 14);
  }
}
// --- End Modified drawPlayer ---

// Keep this one:
function drawFood(food) {
  // Radius calculation might differ from player, keep simple for now
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
     if (!socket || !socket.connected) {
         drawText('Disconnected. Select mode above.', canvas.width / 2, canvas.height / 2, '#AAAAAA', 20);
     } else if (!isGameRunning) {
         drawText('Waiting for server or player start...', canvas.width / 2, canvas.height / 2, '#AAAAAA', 20);
     }
     requestAnimationFrame(gameLoop);
     return;
  }

  // --- Calculate local movement based on mouse (Client-Side Prediction) ---
  const targetWorldX = player.x + (mouseX - canvas.width / 2);
  const targetWorldY = player.y + (mouseY - canvas.height / 2);
  const dx = targetWorldX - player.x;
  const dy = targetWorldY - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  let moveX = 0;
  let moveY = 0;

  if (dist > 1) {
      const speed = PLAYER_SPEED / Math.max(1, Math.sqrt(player.mass / START_MASS));
      moveX = Math.min(speed, dist) * (dx / dist);
      moveY = Math.min(speed, dist) * (dy / dist);

      // Apply predicted movement to logical position
      player.x += moveX;
      player.y += moveY;

      // Clamp position to world bounds (Assuming 0,0 to WORLD_WIDTH, WORLD_HEIGHT)
      const WORLD_WIDTH = 4000;
      const WORLD_HEIGHT = 4000;
      player.x = Math.max(0, Math.min(WORLD_WIDTH, player.x));
      player.y = Math.max(0, Math.min(WORLD_HEIGHT, player.y));
  }
  // --- End Client-Side Prediction ---

  // --- Send Input to Server ---
  if (socket && (socket.connected || socket instanceof MockSocket)) {
      const worldMouseX = player.x + (mouseX - canvas.width / 2);
      const worldMouseY = player.y + (mouseY - canvas.height / 2);
      // Use '0' for real socket based on server.js, use 'mouseMove' for MockSocket
      const eventName = (socket instanceof MockSocket) ? 'mouseMove' : '0';
      const payload = (socket instanceof MockSocket) ? { mouseX: worldMouseX, mouseY: worldMouseY } : { x: worldMouseX, y: worldMouseY };
      socket.emit(eventName, payload);
  }

  // --- Interpolate Render Positions ---
  player.renderX = lerp(player.renderX, player.x, INTERPOLATION_FACTOR);
  player.renderY = lerp(player.renderY, player.y, INTERPOLATION_FACTOR);

  players.forEach(p => {
      if (p.serverX !== undefined) {
          p.renderX = lerp(p.renderX, p.serverX, INTERPOLATION_FACTOR);
          p.renderY = lerp(p.renderY, p.serverY, INTERPOLATION_FACTOR);
      } else {
          // If server pos is unknown, set render pos directly
          p.renderX = p.x;
          p.renderY = p.y;
      }
  });
  // --- End Interpolate Render Positions ---

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
          // Pass world coords to drawFood
          drawFood({ ...food, x: drawX, y: drawY });
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
        // We need to pass the render coordinates to drawPlayer
        const playerToDraw = {
            ...p,
            renderX: p.renderX - cameraX + canvas.width / 2,
            renderY: p.renderY - cameraY + canvas.height / 2
        };
        const radius = Math.sqrt((p.mass || START_MASS) / Math.PI) * 10;
        // Culling check based on render coordinates
        if (playerToDraw.renderX + radius > 0 && playerToDraw.renderX - radius < canvas.width &&
            playerToDraw.renderY + radius > 0 && playerToDraw.renderY - radius < canvas.height) {
            drawPlayer(playerToDraw); // Pass the object with adjusted render coords
        }
    });

    // Draw current player (always draw self, centered, using interpolated position for data)
    const selfDrawData = {
      ...player,
      renderX: canvas.width / 2, // Draw self at center
      renderY: canvas.height / 2
    };
    drawPlayer(selfDrawData);

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

  if (!socket) { // Check if socket is initialized (either real or mock)
    console.error("Socket not initialized! Select Online/Offline mode first.");
    // Optionally show an error message to the user
    return;
  }

  const nicknameInput = document.getElementById('nickname');
  const nickname = nicknameInput ? nicknameInput.value.trim().substring(0, 16) || `Nooter_${Math.floor(Math.random()*1000)}` : `Nooter_${Math.floor(Math.random()*1000)}`;

  // Wait for initGame event after emitting joinGame
  console.log("[Noot.io App] Requesting to join game with name:", nickname);
  socket.emit('joinGame', { nickname: nickname });

  // Assign player skin (moved from initGame handler)
  // This happens *before* we receive the initial player state from the server/mock
  // We'll store the path and apply it when the player object is created/updated
  // Note: player object might not be fully populated here yet.

}


// --- Initialization ---
async function initApp() {
    console.log("[Noot.io App] Initializing...");
    resizeCanvas();
    setupMouseTracking();

    // --- Preload skins --- 
    await preloadSkins(); // Wait for skins to load (or fail)
    // --- End Preload --- 

    // Add key listeners for split/feed
    window.addEventListener('keydown', (e) => {
        if (!player || !player.id) return; // Only send if playing

        if (e.code === 'Space') { // Split
            e.preventDefault();
            // Check if socket exists and is connected before emitting
            if (socket && socket.connected) socket.emit('split');
            else if (socket instanceof MockSocket) socket.emit('split'); // Allow in offline mode
        }
        if (e.key === 'w' || e.key === 'W') { // Feed
            e.preventDefault();
            // Check if socket exists and is connected before emitting
            if (socket && socket.connected) socket.emit('feed');
            else if (socket instanceof MockSocket) socket.emit('feed'); // Allow in offline mode
         }
    });

    // --- NEW: Wait for command from wrapper before initializing socket ---
    window.addEventListener('message', async (event) => {
        // IMPORTANT: Validate event.origin in production
        // if (event.origin !== 'YOUR_EXPECTED_ORIGIN') return;

        if (event.data && event.data.type === 'noot-io-command') {
            const command = event.data.command;
            console.log(`[Noot.io App] Received command: ${command}`);

            if (command === 'start-offline' || command === 'start-online') {
                // Determine mode based on command
                const mode = command === 'start-offline' ? 'offline' : 'online';

                // Initialize the appropriate socket connection
                try {
                    await initializeSocketConnection(mode);
                    // Now that socket is initialized (real or mock), show the start menu
                    const startMenu = document.getElementById('start-menu');
                    if (startMenu) startMenu.style.display = 'block';
                    console.log("[Noot.io App] Socket initialized, ready for player to start.");
                } catch (error) {
                    console.error("[Noot.io App] Failed to initialize socket connection:", error);
                    // Handle initialization failure (e.g., show error message)
                }
            }
        } else if (event.data && event.data.type === 'noot-io-init') {
            // Handle initial farm coins data (moved listener here for better timing)
            initialFarmCoins = event.data.farmCoins || 0;
            parentOrigin = event.origin; // Store the origin for sending messages back
            console.log('[Noot.io Game] Received initial farm coins:', initialFarmCoins);
        }
    });
    // --- END NEW COMMAND/INIT LISTENER ---

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
} // End of initApp

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initApp);
