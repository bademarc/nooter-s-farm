// Noot.io - A simplified agar.io-like game
const canvas = document.getElementById('cvs');
const ctx = canvas.getContext('2d');
let socket; // Define socket variable, will be assigned later
let isOfflineMode = false;
let isGameInitialized = false; // Flag to prevent multiple initializations
let bots = []; // Array for offline bots
const BOT_COUNT = 50; // Changed from 100 to 50 bots
const BIG_BOT_COUNT = 10; // Number of big bots to add
const WORLD_WIDTH = 4000; // Define world size
const WORLD_HEIGHT = 4000;
const FOOD_COUNT = 200; // How much food in offline mode

// --- Helper to get WebSocket URL ---
function getWebSocketURL() {
  // Connect to the deployed Fly.io backend
  const url = 'wss://noot-nootio.fly.dev';
  console.log(`[Noot.io App] Connecting to WebSocket: ${url}`);
  return url;
}
// --- End Helper ---

let player = {};
let players = []; // Holds OTHER players in online mode
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

// Function to notify the wrapper about mode changes
function notifyWrapperOfModeChange(mode) {
  try {
    window.parent.postMessage({
      type: 'noot-io',
      action: 'game-mode-changed',
      mode: mode // 'offline' or 'online'
    }, parentOrigin);
    console.log(`[Noot.io App] Notified wrapper about mode change: ${mode}`);
  } catch (e) {
    console.error('[Noot.io App] Error notifying wrapper:', e);
  }
}

// Function to notify the wrapper when game starts
function notifyWrapperOfGameStart(mode) {
  try {
    window.parent.postMessage({
      type: 'noot-io',
      action: 'game-started',
      mode: mode // 'offline' or 'online'
    }, parentOrigin);
    console.log(`[Noot.io App] Notified wrapper about game start: ${mode}`);
  } catch (e) {
    console.error('[Noot.io App] Error notifying wrapper:', e);
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

// Helper function to set game messages
function setGameMessage(message) {
  const gameMessage = document.getElementById('gameMessage');
  if (gameMessage) {
    if (message) {
      gameMessage.textContent = message;
      gameMessage.style.display = 'block';
    } else {
      gameMessage.style.display = 'none';
    }
  }
}

// Function to initialize offline mode
function initOfflineMode() {
  console.log("[Noot.io App] Initializing OFFLINE mode...");
  isOfflineMode = true;
  isGameInitialized = true;
  
  // Notify wrapper
  notifyWrapperOfModeChange('offline');
  
  // Show start menu
  const startMenu = document.getElementById('startMenu');
  if (startMenu) startMenu.style.display = 'block';
  
  // Hide game area until game starts
  const gameWrapper = document.getElementById('gameAreaWrapper');
  if (gameWrapper) gameWrapper.style.display = 'block';
  
  // Update game message
  setGameMessage('Ready to play in Offline Mode');
  
  // Activate the offline button visually
  const offlineButton = document.getElementById('offlineButton');
  const onlineButton = document.getElementById('onlineButton');
  if (offlineButton) {
    offlineButton.classList.add('active');
    if (onlineButton) onlineButton.classList.remove('active');
  }
  
  console.log("[Noot.io App] OFFLINE mode initialized successfully.");
}

// Function to initialize online mode
function initOnlineMode() {
  console.log("[Noot.io App] Initializing ONLINE mode...");
  isOfflineMode = false;
  
  // Notify wrapper
  notifyWrapperOfModeChange('online');
  
  // Activate the online button visually
  const onlineButton = document.getElementById('onlineButton');
  const offlineButton = document.getElementById('offlineButton');
  if (onlineButton) {
    onlineButton.classList.add('active');
    if (offlineButton) offlineButton.classList.remove('active');
  }
  
  // Update game message
  setGameMessage('Connecting to online server...');
  
  // Show loading indicator
  const loadingIndicator = document.getElementById('loading');
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  
  // Initialize the socket connection
  try {
    const websocketURL = getWebSocketURL();
    socket = io(websocketURL, { /* options */ });
    setupSocketListeners(); // Setup listeners for real socket
    
    socket.once('connect', () => {
      console.log("[Noot.io App] Socket connected for online mode.");
      isGameInitialized = true;
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      
      // Update game message
      setGameMessage('Connected! Ready to play online.');
      
      // Display start menu
      const startMenu = document.getElementById('startMenu');
      if (startMenu) startMenu.style.display = 'block';
    });
    
    socket.once('connect_error', (err) => {
      console.error("[Noot.io App] Initial connection failed:", err.message);
      isGameInitialized = false;
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      
      // Show error message
      const serverStatus = document.getElementById('server-status');
      if (serverStatus) serverStatus.style.display = 'block';
      
      // Update game message
      setGameMessage('Connection failed. Switching to offline mode...');
      
      // Switch to offline mode automatically
      setTimeout(() => initOfflineMode(), 1000);
    });
  } catch (error) {
    console.error("[Noot.io App] Failed to initialize socket connection:", error);
    isGameInitialized = false;
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    
    // Show error message
    const serverStatus = document.getElementById('server-status');
    if (serverStatus) serverStatus.style.display = 'block';
    
    // Update game message
    setGameMessage('Connection error. Switching to offline mode...');
    
    // Switch to offline mode automatically
    setTimeout(() => initOfflineMode(), 1000);
  }
}

// Game Constants (Added for Prediction)
const START_MASS = 10; // Assuming this matches server START_MASS
const PLAYER_SPEED = 5; // Assuming this matches server PLAYER_SPEED

// Set canvas to full container size
function resizeCanvas() {
  if (!canvas) return;
  
  const container = canvas.parentElement;
  if (!container) return;
  
  // Force the gameAreaWrapper to have proper height
  const gameWrapper = document.getElementById('gameAreaWrapper');
  if (gameWrapper) {
    gameWrapper.style.height = '100%';
    gameWrapper.style.minHeight = '600px';
  }
  
  // Set canvas dimensions to match container
  canvas.width = container.clientWidth;
  canvas.height = Math.max(600, container.clientHeight); // Ensure minimum height
  
  console.log(`[Noot.io App] Canvas resized to ${canvas.width}x${canvas.height}`);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// Track mouse position
function setupMouseTracking() {
  if (!canvas) return;
  
  // Set initial mouse position to center of screen to avoid movement issues
  mouseX = canvas.width / 2;
  mouseY = canvas.height / 2;
  
  // Desktop mouse movement
  canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  
  // Touch support for mobile
  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault(); // Prevent scrolling
    if (e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      mouseX = touch.clientX - rect.left;
      mouseY = touch.clientY - rect.top;
    }
  }, { passive: false });
  
  // Log initialization
  console.log("[Noot.io App] Mouse tracking initialized.");
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

// --- Socket Listeners (ONLY for Online Mode) ---
function setupSocketListeners() {
  if (!socket) return; // Should only be called if socket exists (online)

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
    isGameInitialized = false; // Allow trying again maybe?
    const startMenu = document.getElementById('startMenu');
    if (startMenu) startMenu.style.display = 'block'; // Show menu again
    // Add user feedback about connection error
  });

  socket.on('disconnect', (reason) => {
    console.log('[Noot.io App] Socket disconnected:', reason);
    isGameRunning = false;
    isGameInitialized = false; // Allow re-init/mode selection
    player = {};
    players = [];
    foods = [];
    massFood = [];
    // Show start menu again, hide canvas/wrapper
    const startMenu = document.getElementById('startMenu');
    const gameWrapper = document.getElementById('gameAreaWrapper');
    if (startMenu) startMenu.style.display = 'block';
    if (gameWrapper) gameWrapper.style.display = 'none';
    // Hide restart button
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
      if (isOfflineMode || !player || !player.id) return; // Ignore in offline mode
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
              // Update skin path if provided by server
              if(serverP.skinPath) {
                localP.skinPath = serverP.skinPath;
                localP.skin = skinsLoaded ? loadedSkins[serverP.skinPath] : null;
              }
              updatedPlayers.push(localP);
          } else if (serverP.id !== player.id) {
              // Add new player seen nearby
              serverP.renderX = serverP.x; // Initialize render pos
              serverP.renderY = serverP.y;
              serverP.serverX = serverP.x; // Initialize server pos
              serverP.serverY = serverP.y;
               // Assign skin if provided by server
              if(serverP.skinPath) {
                serverP.skin = skinsLoaded ? loadedSkins[serverP.skinPath] : null;
              }
              updatedPlayers.push(serverP);
          }
      });
      players = updatedPlayers; // Update the main players array

      // --- Update Nearby Food --- (Replace local with server's list)
      foods = data.foods || [];

      // --- Update Nearby Mass Food --- (Replace local with server's list)
      massFood = data.massFood || [];
  });

  // Listen for being eaten
  socket.on('eaten', (data) => {
      if (isOfflineMode) return;
      console.log(`[Noot.io App] Eaten by ${data.by}!`);
      isGameRunning = false; // Stop local processing
      isGameInitialized = false; // Allow re-init/mode selection
      const restartButton = document.getElementById('restart-button');
      if (restartButton) restartButton.style.display = 'block';
      player = {};
      players = [];
      foods = [];
      massFood = [];
  });

  // Listen for explicit respawn data from server
  socket.on('respawned', (data) => {
      if (isOfflineMode) return;
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
      };
      
      // Assign player skin again on respawn
      if (player && skinsLoaded && data.skinPath) {
          player.skinPath = data.skinPath;
          player.skin = loadedSkins[data.skinPath];
      } else if (player && skinsLoaded) { // Fallback to default if server didn't send path
          const defaultSkin = 'case items/bronze/noot-noot.jpg';
          player.skinPath = defaultSkin;
          player.skin = loadedSkins[defaultSkin];
      }

      lastKnownMass = player.mass; // Reset mass tracker
      isGameRunning = true; // Re-enable game loop
      const restartButton = document.getElementById('restart-button');
      if (restartButton) restartButton.style.display = 'none';
      console.log("[Noot.io App] Respawned as:", player);
  });

  // Listen for initial game state (simplified for 'nearbyEntitiesUpdate')
  socket.on('initGame', (data) => {
    if (isOfflineMode) return;
    console.log("[Noot.io App] Received initGame");
    player = data.player || {};
    player.serverX = player.x;
    player.serverY = player.y;
    player.renderX = player.x;
    player.renderY = player.y;

    // Assign player skin upon initial join based on server data
    if (player && skinsLoaded && data.player.skinPath) {
        player.skinPath = data.player.skinPath;
        player.skin = loadedSkins[data.player.skinPath];
    } else if (player && skinsLoaded) { // Fallback
        const defaultSkin = 'case items/bronze/noot-noot.jpg';
        player.skinPath = defaultSkin;
        player.skin = loadedSkins[defaultSkin];
    }

    players = []; // Nearby players come via nearbyEntitiesUpdate
    foods = []; // Nearby food comes via nearbyEntitiesUpdate
    massFood = []; // Nearby massFood comes via nearbyEntitiesUpdate
    leaderboard = [];
    lastKnownMass = player.mass || 0;
    isGameRunning = true;

    console.log("[Noot.io App] My Player Initialized (Online):", player);

    // Hide start menu, show canvas/wrapper
    const startMenu = document.getElementById('startMenu');
    const startMenuWrapper = document.getElementById('startMenuWrapper');
    const gameWrapper = document.getElementById('gameAreaWrapper'); // Target the wrapper div
    
    if (startMenu) startMenu.style.display = 'none';
    if (startMenuWrapper) {
        startMenuWrapper.style.display = 'none';
        startMenuWrapper.style.zIndex = '-1';
    }
    if (gameWrapper) {
        gameWrapper.style.display = 'block';
        gameWrapper.style.zIndex = '1';
    }
    
    resizeCanvas(); // Ensure canvas size is correct
  });

  // Handle leaderboard updates
  socket.on('leaderboardUpdate', function(newLeaderboard) {
      if (isOfflineMode) return;
      leaderboard = newLeaderboard || [];
  });

  // Events below might be redundant if nearbyEntitiesUpdate is comprehensive,
  // but keep for now or specific use cases (like immediate feedback).

  // Handle new players joining (less critical now)
  socket.on('playerJoined', (newPlayer) => {
    if (isOfflineMode || !player.id || newPlayer.id === player.id || players.some(p => p.id === newPlayer.id)) return;
     // ... existing code ...
     // Assign skin if provided
      if (newPlayer.skinPath && skinsLoaded) {
          newPlayer.skin = loadedSkins[newPlayer.skinPath];
      }
      players.push(newPlayer);
  });

  // Handle players leaving (still useful)
  socket.on('playerLeft', (playerId) => {
    if (isOfflineMode) return;
    console.log("[Noot.io App] Player Left:", playerId);
    players = players.filter(p => p.id !== playerId);
  });

  // Handle food spawning (less critical)
  socket.on('foodSpawned', function(food) {
    if (isOfflineMode || foods.find(f => f.id === food.id)) return;
    foods.push(food);
  });

  // Handle food eating (still useful)
  socket.on('foodEaten', function(foodId) {
    if (isOfflineMode) return;
    foods = foods.filter(f => f.id !== foodId);
  });

  // Handle mass food spawning (less critical)
  socket.on('massFoodSpawned', function(mf) {
      if (isOfflineMode || massFood.find(m => m.id === mf.id)) return;
      massFood.push(mf);
  });

  // Handle single mass food removal (still useful)
  socket.on('massFoodRemoved', function(mfId) {
      if (isOfflineMode) return;
      massFood = massFood.filter(mf => mf.id !== mfId);
  });

  // Handle batch mass food removal (still useful)
  socket.on('massFoodRemovedBatch', function(mfIds) {
      if (isOfflineMode) return;
      const idSet = new Set(mfIds);
      massFood = massFood.filter(mf => !idSet.has(mf.id));
  });
}
// --- End Socket Listeners ---

// Simple Linear Interpolation function
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

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
    if (!leaderboard || !leaderboard.length) return;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width - 170, 10, 160, 20 + Math.min(leaderboard.length, 10) * 20);
    
    // Title
    drawText('Leaderboard', canvas.width - 90, 25, '#FFFFFF', 16);

    // List entries
    leaderboard.slice(0, 10).forEach((player, i) => {
        // Skip invalid entries
        if (!player || typeof player !== 'object') return;
        
        // Ensure the player has a name property
        const playerName = player.name || 'Anonymous';
        const playerMass = Math.floor(player.mass || 0);
        
        // Highlight player's position in the leaderboard
        const isPlayer = isOfflineMode ? 
            (i === 0 && playerName === window.player.name) : 
            (player.id === window.player.id);
            
        const color = isPlayer ? '#FFFF00' : '#FFFFFF';
        drawText(`${i+1}. ${playerName}: ${playerMass}`, 
            canvas.width - 90, 45 + i * 20, color, 14);
    });
}

// Draw improved offline stats in left side
function drawOfflineStats() {
    // Background for stats panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 200, 110);
    
    // Player stats
    ctx.textAlign = 'left';
    
    // Get total player mass including split cells
    const totalPlayerMass = player.mass + bots
        .filter(b => b.isPlayerSplit)
        .reduce((total, cell) => total + cell.mass, 0);
    
    // Count player cells (main cell + split cells)
    const playerCellCount = 1 + bots.filter(b => b.isPlayerSplit).length;
    
    ctx.fillStyle = '#FFFFFF'; // Ensure text color is white
    
    // Display stats
    ctx.font = '16px Arial';
    ctx.fillText(`Mass: ${Math.floor(totalPlayerMass).toLocaleString()}`, 20, 30);
    ctx.fillText(`Cells: ${playerCellCount}`, 20, 50);
    ctx.fillText(`Bots: ${bots.filter(b => !b.isPlayerSplit).length}`, 20, 70);
    ctx.fillText(`FPS: ${Math.round(fps)}`, 20, 90);
    
    // Reset text alignment
    ctx.textAlign = 'center';
}

// Add FPS counter
let lastFrameTime = 0;
let fps = 60;

// Update FPS calculation in gameLoop
function updateFPS() {
    const now = performance.now();
    const delta = now - lastFrameTime;
    lastFrameTime = now;
    fps = 1000 / delta;
    // Smooth FPS for display
    fps = Math.min(60, Math.max(0, fps));
}

let isGameRunning = false; // Flag to control game loop execution

// Helper function for offline food
function spawnOfflineFood() {
    foods.push({
        id: `food_${Date.now()}_${Math.random()}`,
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        color: colors[Math.floor(Math.random() * colors.length)],
        mass: 1 // Example food mass
    });
}

// Helper function for offline bots
function spawnOfflineBot(index, isBigBot = false) {
    // Random skin selection for bots
    let randomSkinPath = 'case items/bronze/noot-noot.jpg'; // Default fallback
    
    if (skinsLoaded) {
        const skinKeys = Object.keys(loadedSkins);
        if (skinKeys.length > 0) {
            randomSkinPath = skinKeys[Math.floor(Math.random() * skinKeys.length)];
        }
    }
    
    const startMass = isBigBot ? 
        START_MASS * (50 + Math.random() * 150) : // Big bots are 50-200x starting mass
        START_MASS + Math.random() * 50; // Regular bots
    
    const bot = {
        id: `bot_${index}_${Date.now()}`,
        name: isBigBot ? `BigBot_${index}` : `Bot_${index}`,
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        mass: startMass,
        color: colors[Math.floor(Math.random() * colors.length)],
        renderX: 0, // Will be set relative to camera
        renderY: 0,
        // Bot movement state
        targetX: Math.random() * WORLD_WIDTH,
        targetY: Math.random() * WORLD_HEIGHT,
        speed: isBigBot ? 1 + Math.random() * 1 : 2 + Math.random() * 2, // Big bots are slower
        // Split behavior
        lastSplitTime: 0,
        splitCooldown: 10000, // 10 seconds between splits
        // Add skin to bot
        skinPath: randomSkinPath,
        skin: skinsLoaded ? loadedSkins[randomSkinPath] : null,
        // Bot type flag
        isBigBot: isBigBot
    };
    
    bot.renderX = bot.x; // Initialize render pos
    bot.renderY = bot.y;
    bots.push(bot);
}

// Add bot split functionality
function botSplit(bot) {
    if (bot.mass < START_MASS * 2 || Date.now() - bot.lastSplitTime < bot.splitCooldown) return false;
    
    // Calculate direction based on target
    const dx = bot.targetX - bot.x;
    const dy = bot.targetY - bot.y;
    const angle = Math.atan2(dy, dx);
    
    // Create a new cell by ejecting half the mass
    const splitMass = bot.mass / 2;
    bot.mass = splitMass;
    bot.lastSplitTime = Date.now();
    
    // Create a split cell
    const splitCell = {
        id: `bot_split_${Date.now()}_${Math.random()}`,
        name: bot.name,
        x: bot.x,
        y: bot.y,
        mass: splitMass,
        color: bot.color,
        renderX: bot.x,
        renderY: bot.y,
        skinPath: bot.skinPath,
        skin: bot.skin,
        isBotSplit: true, // Flag to identify this is a bot's split cell
        parentBot: bot.id, // Track which bot this belongs to
        targetX: bot.x + Math.cos(angle) * 500, // Launch in split direction
        targetY: bot.y + Math.sin(angle) * 500,
        speed: 25, // Initial high speed that will decay
        moveDecay: 0.9, // Speed decay factor
        mergeCooldown: Date.now() + 10000, // 10 second cooldown before merging
        lastSplitTime: Date.now() // To prevent instant re-splitting
    };
    
    bots.push(splitCell);
    return true;
}

// Add mass food ejection functionality for offline mode
function spawnOfflineMassFood(sourceX, sourceY, direction, speed, mass) {
    const id = `massFood_${Date.now()}_${Math.random()}`;
    const angle = direction || Math.random() * Math.PI * 2;
    const velocity = speed || 10;
    
    massFood.push({
        id: id,
        x: sourceX,
        y: sourceY,
        dx: Math.cos(angle) * velocity,
        dy: Math.sin(angle) * velocity,
        mass: mass || 10,
        color: player.color,
        createdAt: Date.now()
    });
}

// Offline split logic
function offlineSplit() {
    if (player.mass < START_MASS * 2) return; // Need minimum mass
    
    // Calculate direction based on mouse position
    const dx = mouseX - canvas.width / 2;
    const dy = mouseY - canvas.height / 2;
    const angle = Math.atan2(dy, dx);
    
    // Create a new cell by ejecting half the mass
    const splitMass = player.mass / 2;
    player.mass = splitMass;
    
    // Create a "fake" bot that represents the split cell
    const splitCell = {
        id: `split_${Date.now()}_${Math.random()}`,
        name: player.name,
        x: player.x,
        y: player.y,
        mass: splitMass,
        color: player.color,
        renderX: player.x,
        renderY: player.y,
        skinPath: player.skinPath,
        skin: player.skin,
        isPlayerSplit: true, // Flag to identify this is player's split cell
        targetX: player.x + Math.cos(angle) * 500, // Launch in direction of mouse
        targetY: player.y + Math.sin(angle) * 500,
        speed: 25, // Initial high speed that will decay
        moveDecay: 0.9, // Speed decay factor
        mergeCooldown: Date.now() + 10000 // 10 second cooldown before merging
    };
    
    // Add to bots array (will be handled by bot movement logic)
    bots.push(splitCell);
}

// Add feed functionality to offline mode
function offlineFeed() {
    if (player.mass <= START_MASS + 10) return; // Need minimum mass
    
    // Calculate direction based on mouse position
    const dx = mouseX - canvas.width / 2;
    const dy = mouseY - canvas.height / 2;
    const angle = Math.atan2(dy, dx);
    
    // Reduce player mass
    player.mass -= 10;
    
    // Create mass food in the direction of mouse
    spawnOfflineMassFood(player.x, player.y, angle, 15, 10);
}

// Game loop
function gameLoop() {
  // Update FPS
  updateFPS();
  
  if (!canvas || !ctx) {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (!isGameRunning) {
     ctx.fillStyle = '#111827'; // Draw background
     ctx.fillRect(0, 0, canvas.width, canvas.height);
     
     // Message is now handled by the HTML element, no need to draw here
     
     requestAnimationFrame(gameLoop);
     return;
  }
  
  // Game is running, ensure message is hidden
  setGameMessage('');

  // Clear the background at the start of a running game
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- Shared: Calculate local player movement based on mouse ---
  const targetWorldX = player.x + (mouseX - canvas.width / 2);
  const targetWorldY = player.y + (mouseY - canvas.height / 2);
  const dx = targetWorldX - player.x;
  const dy = targetWorldY - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  let moveX = 0;
  let moveY = 0;

  // Player movement - check if movement is detected and player exists
  if (dist > 0.1 && player && player.mass > 0) { // Changed from 1 to 0.1 for more responsive movement
    // Calculate speed based on mass (larger = slower)
    const speed = PLAYER_SPEED / Math.max(1, Math.sqrt(player.mass / START_MASS));
    
    // Calculate movement vector
    moveX = Math.min(speed, dist) * (dx / dist);
    moveY = Math.min(speed, dist) * (dy / dist);
    
    // Apply movement
    player.x += moveX;
    player.y += moveY;
    
    // Ensure player stays within world bounds with a buffer
    const buffer = 50; // Prevent getting stuck at edges
    player.x = Math.max(buffer, Math.min(WORLD_WIDTH - buffer, player.x));
    player.y = Math.max(buffer, Math.min(WORLD_HEIGHT - buffer, player.y));
    
    // Debug movement periodically
    if (Math.random() < 0.01) { // Only log occasionally
      console.log(`[Noot.io App] Player moving: ${Math.round(moveX)},${Math.round(moveY)} to ${Math.round(player.x)},${Math.round(player.y)}`);
    }
  } else if (!player || player.mass <= 0) {
    console.warn("[Noot.io App] Player not valid for movement:", player);
  }
  // --- End Player Movement ---

  // --- Mode Specific Logic ---
  if (isOfflineMode) {
      // --- Process mass food movement ---
      const MASS_FOOD_LIFETIME = 5000; // 5 seconds lifetime
      const currentTime = Date.now();
      
      // Filter and update mass food
      massFood = massFood.filter(mf => {
          // Check lifetime
          if (currentTime - mf.createdAt > MASS_FOOD_LIFETIME) {
              return false; // Remove expired mass food
          }
          
          // Move mass food
          if (mf.dx || mf.dy) {
              mf.x += mf.dx;
              mf.y += mf.dy;
              
              // Slow down over time
              mf.dx *= 0.95;
              mf.dy *= 0.95;
              
              // Stop if too slow
              if (Math.abs(mf.dx) < 0.1 && Math.abs(mf.dy) < 0.1) {
                  mf.dx = 0;
                  mf.dy = 0;
              }
          }
          
          return true; // Keep this mass food
      });
      
      // --- Check for split cells merging ---
      // Handle both player and bot split cells merging
      const playerSplitCells = bots.filter(b => b.isPlayerSplit);
      if (playerSplitCells.length > 0) {
          // Find cells ready to merge
          const readyToMerge = playerSplitCells.filter(cell => 
              cell.mergeCooldown <= currentTime && 
              Math.sqrt((cell.x - player.x)**2 + (cell.y - player.y)**2) < 
                  (Math.sqrt(cell.mass / Math.PI) * 10 + Math.sqrt(player.mass / Math.PI) * 10)
          );
          
          // Merge cells back to player
          if (readyToMerge.length > 0) {
              readyToMerge.forEach(cell => {
                  player.mass += cell.mass;
                  // Remove from bots array
                  const cellIndex = bots.findIndex(b => b.id === cell.id);
                  if (cellIndex !== -1) {
                      bots.splice(cellIndex, 1);
                  }
              });
          }
      }
      
      // Bot split cells merging logic
      const botSplitCells = bots.filter(b => b.isBotSplit);
      botSplitCells.forEach(splitCell => {
          if (splitCell.mergeCooldown <= currentTime) {
              // Find parent bot
              const parentBot = bots.find(b => b.id === splitCell.parentBot);
              if (parentBot) {
                  // Check if close enough to merge
                  const distance = Math.sqrt((splitCell.x - parentBot.x)**2 + (splitCell.y - parentBot.y)**2);
                  const mergeDistance = Math.sqrt(splitCell.mass / Math.PI) * 10 + Math.sqrt(parentBot.mass / Math.PI) * 10;
                  
                  if (distance < mergeDistance) {
                      // Merge back to parent
                      parentBot.mass += splitCell.mass;
                      // Remove split cell
                      const cellIndex = bots.findIndex(b => b.id === splitCell.id);
                      if (cellIndex !== -1) {
                          bots.splice(cellIndex, 1);
                      }
                  }
              } else {
                  // Parent bot is gone, convert to regular bot
                  splitCell.isBotSplit = false;
                  delete splitCell.parentBot;
                  delete splitCell.mergeCooldown;
              }
          }
      });
      
      // --- Offline Bot Movement with improved fighting logic ---
      bots.forEach(bot => {
          if (bot.mass <= 0) return; // Skip dead bots
          
          // Special handling for player's split cells
          if (bot.isPlayerSplit) {
              // Adjust speed based on decay
              bot.speed *= bot.moveDecay;
              
              // Cap minimum speed
              if (bot.speed < 3) bot.speed = 3;
              
              // Player split cells follow mouse after initial thrust
              if (bot.speed < 10) {
                  bot.targetX = player.x + (mouseX - canvas.width / 2);
                  bot.targetY = player.y + (mouseY - canvas.height / 2);
              }
          } 
          // Special handling for bot split cells
          else if (bot.isBotSplit) {
              // Adjust speed based on decay
              bot.speed *= bot.moveDecay;
              
              // Cap minimum speed
              if (bot.speed < 3) bot.speed = 3;
              
              // After initial thrust, target nearby smaller entities
              if (bot.speed < 10) {
                  findNearbyTarget(bot);
              }
          }
          else {
              // Regular bot AI - improved to prioritize fighting with others
              findNearbyTarget(bot);
              
              // Bot splitting logic
              const shouldTrySplit = Math.random() < 0.01; // 1% chance each frame to consider splitting
              if (shouldTrySplit) {
                  // Find potential nearby victims that are smaller but not too small
                  const nearbyEntities = [...bots.filter(b => b !== bot && !b.isPlayerSplit && !b.isBotSplit), player].filter(e => e.mass > 0);
                  const potentialVictims = nearbyEntities.filter(entity => {
                      if (entity.mass <= 0 || entity === player && player.mass <= 0) return false;
                      const sizeDiff = bot.mass / entity.mass;
                      const distance = Math.sqrt((bot.x - entity.x)**2 + (bot.y - entity.y)**2);
                      // Target should be smaller, but not too small, and within split range
                      return sizeDiff > 2 && sizeDiff < 4 && distance < 500;
                  });
                  
                  if (potentialVictims.length > 0) {
                      // Target the closest victim
                      const victim = potentialVictims.reduce((closest, current) => {
                          const closestDist = Math.sqrt((bot.x - closest.x)**2 + (bot.y - closest.y)**2);
                          const currentDist = Math.sqrt((bot.x - current.x)**2 + (bot.y - current.y)**2);
                          return currentDist < closestDist ? current : closest;
                      });
                      
                      // Update target to victim position
                      bot.targetX = victim.x;
                      bot.targetY = victim.y;
                      
                      // Try to split
                      botSplit(bot);
                  }
              }
          }
          
          // Bot movement logic 
          const botDx = bot.targetX - bot.x;
          const botDy = bot.targetY - bot.y;
          const botDist = Math.sqrt(botDx * botDx + botDy * botDy);
          const botSpeed = bot.speed / Math.max(1, Math.sqrt(bot.mass / START_MASS));
          
          // Only move if there's a valid direction
          if (botDist > 0) {
              bot.x += Math.min(botSpeed, botDist) * (botDx / botDist);
              bot.y += Math.min(botSpeed, botDist) * (botDy / botDist);
              // Clamp bot position
              bot.x = Math.max(0, Math.min(WORLD_WIDTH, bot.x));
              bot.y = Math.max(0, Math.min(WORLD_HEIGHT, bot.y));
          }
      });
      
      // Function to find target for bot hunting
      function findNearbyTarget(bot) {
          // Find all entities (bots and player)
          const entities = [...bots.filter(b => b !== bot && !b.isPlayerSplit && b.mass > 0), player].filter(e => e.mass > 0);
          
          // Calculate distances and size differences
          const entityData = entities.map(entity => {
              const distance = Math.sqrt((bot.x - entity.x)**2 + (bot.y - entity.y)**2);
              const sizeDiff = bot.mass / entity.mass; // >1 means bot is bigger
              return { entity, distance, sizeDiff };
          });
          
          // Get nearby entities within awareness range
          const awarenessRadius = 400 + bot.mass/5; // Bigger bots can see further
          const nearbyEntities = entityData.filter(ed => ed.distance < awarenessRadius);
          
          if (nearbyEntities.length === 0) {
              // No nearby entities, wander randomly
              if (Math.random() < 0.01 || isNaN(bot.targetX) || 
                  Math.sqrt((bot.x - bot.targetX)**2 + (bot.y - bot.targetY)**2) < 20) {
                  bot.targetX = Math.random() * WORLD_WIDTH;
                  bot.targetY = Math.random() * WORLD_HEIGHT;
              }
              return;
          }
          
          // Categorize nearby entities
          const smallerEntities = nearbyEntities.filter(ed => ed.sizeDiff > 1.2);
          const similarSizedEntities = nearbyEntities.filter(ed => ed.sizeDiff >= 0.8 && ed.sizeDiff <= 1.2);
          const largerEntities = nearbyEntities.filter(ed => ed.sizeDiff < 0.8);
          
          // Prioritize hunting:
          // 1. Similar-sized bots (most interesting fights)
          // 2. Smaller bots
          // 3. Run from larger bots
          
          // Changed logic to prefer similar-sized entities
          if (similarSizedEntities.length > 0) {
              // Hunt similar-sized entity (most interesting for gameplay)
              const target = similarSizedEntities.reduce((closest, current) => 
                  current.distance < closest.distance ? current : closest
              );
              console.log(`Bot ${bot.name} is hunting similar-sized ${target.entity.name || 'player'}`);
              bot.targetX = target.entity.x;
              bot.targetY = target.entity.y;
          } 
          else if (smallerEntities.length > 0) {
              // If no similar-sized entities, hunt smaller ones
              // Find the largest of the smaller entities (more rewarding)
              const target = smallerEntities.reduce((largest, current) => 
                  current.entity.mass > largest.entity.mass ? current : largest
              );
              console.log(`Bot ${bot.name} is hunting smaller ${target.entity.name || 'player'}`);
              bot.targetX = target.entity.x;
              bot.targetY = target.entity.y;
          } 
          else if (largerEntities.length > 0) {
              // Run away from larger entities
              // Find the closest larger entity (most dangerous)
              const threat = largerEntities.reduce((closest, current) => 
                  current.distance < closest.distance ? current : closest
              );
              
              console.log(`Bot ${bot.name} is fleeing from ${threat.entity.name || 'player'}`);
              
              // Calculate vector away from threat
              const fleeX = bot.x - threat.entity.x;
              const fleeY = bot.y - threat.entity.y;
              const fleeDist = Math.sqrt(fleeX*fleeX + fleeY*fleeY);
              
              // Normalize and scale the flee vector
              if (fleeDist > 0) {
                  const escapeMultiplier = 500 / fleeDist;
                  bot.targetX = bot.x + fleeX * escapeMultiplier;
                  bot.targetY = bot.y + fleeY * escapeMultiplier;
                  
                  // Ensure target is within world bounds
                  bot.targetX = Math.max(100, Math.min(WORLD_WIDTH - 100, bot.targetX));
                  bot.targetY = Math.max(100, Math.min(WORLD_HEIGHT - 100, bot.targetY));
              }
          }
      }
      
      // --- Offline Collision Detection ---
      const playerRadius = Math.sqrt(player.mass / Math.PI) * 10;

      // Player vs Food
      foods = foods.filter(food => {
          const foodRadius = 5; // Match drawFood radius approx
          const collisionDistSq = (player.x - food.x)**2 + (player.y - food.y)**2;
          const radiiSumSq = (playerRadius + foodRadius)**2; // Maybe playerRadius^2 is enough?
          if (collisionDistSq < playerRadius*playerRadius * 0.9) { // Eat if food center is inside player radius
              player.mass += food.mass;
              checkEarnedCoins(player.mass); // Check for farm coin gain
              // Respawn one food elsewhere
              food.x = Math.random() * WORLD_WIDTH;
              food.y = Math.random() * WORLD_HEIGHT;
              return true; // Keep the food object, just move it
              // return false; // Remove eaten food - leads to empty world
          }
          return true; // Keep food
      });
      
      // Add collision detection for mass food
      massFood = massFood.filter(mf => {
          const massFoodRadius = Math.max(2, Math.sqrt(mf.mass));
          const collisionDistSq = (player.x - mf.x)**2 + (player.y - mf.y)**2;
          if (collisionDistSq < playerRadius*playerRadius) {
              player.mass += mf.mass;
              checkEarnedCoins(player.mass);
              return false; // Remove eaten mass food
          }
          return true; // Keep mass food
      });
      
      // Also check if bots can eat mass food
      for (const bot of bots) {
          if (bot.mass <= 0) continue;
          const botRadius = Math.sqrt(bot.mass / Math.PI) * 10;
          
          massFood = massFood.filter(mf => {
              const massFoodRadius = Math.max(2, Math.sqrt(mf.mass));
              const collisionDistSq = (bot.x - mf.x)**2 + (bot.y - mf.y)**2;
              if (collisionDistSq < botRadius*botRadius) {
                  bot.mass += mf.mass;
                  return false; // Remove eaten mass food
              }
              return true; // Keep mass food
          });
      }
      
      // Player vs Bots & Bot vs Bots collision detection
      handleEntityCollisions();

      // Clean up dead bots from main array
      bots = bots.filter(b => b.mass > 0);

      // Build offline leaderboard with proper display
      updateOfflineLeaderboard();

      // Interpolate Player render position
      player.renderX = lerp(player.renderX, player.x, INTERPOLATION_FACTOR);
      player.renderY = lerp(player.renderY, player.y, INTERPOLATION_FACTOR);
       // Interpolate bot render positions
       bots.forEach(bot => {
           if (bot.mass > 0) {
              bot.renderX = lerp(bot.renderX, bot.x, INTERPOLATION_FACTOR * 0.5); // Slower lerp maybe
              bot.renderY = lerp(bot.renderY, bot.y, INTERPOLATION_FACTOR * 0.5);
           }
       });

  } else { // Online Mode
      // Send Input to Server
      if (socket && socket.connected) {
          const worldMouseX = player.x + (mouseX - canvas.width / 2);
          const worldMouseY = player.y + (mouseY - canvas.height / 2);
          socket.emit('0', { x: worldMouseX, y: worldMouseY }); // '0' is the event name for player movement
      }
      // Interpolate Player render position based on logical position (prediction)
      player.renderX = lerp(player.renderX, player.x, INTERPOLATION_FACTOR);
      player.renderY = lerp(player.renderY, player.y, INTERPOLATION_FACTOR);
      // Interpolate OTHER players based on server data
      players.forEach(p => {
          if (p.serverX !== undefined) {
              p.renderX = lerp(p.renderX, p.serverX, INTERPOLATION_FACTOR);
              p.renderY = lerp(p.renderY, p.serverY, INTERPOLATION_FACTOR);
          } else {
              p.renderX = p.x; p.renderY = p.y; // Fallback
          }
      });
  }

  // --- Rendering (Shared Logic) ---
  try {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Use player's interpolated render position for camera center
      let cameraX = player.renderX;
      let cameraY = player.renderY;
      if (isNaN(cameraX) || isNaN(cameraY)) {
         console.warn("[Noot.io Loop] Invalid camera position! Resetting.", { player });
         // Reset camera to logical position if render is NaN
         cameraX = player.x;
         cameraY = player.y;
         // Also reset render positions to prevent propagation
         player.renderX = player.x;
         player.renderY = player.y;
      }

      // Draw food (shared)
      foods.forEach(food => {
          const drawX = food.x - cameraX + canvas.width / 2;
          const drawY = food.y - cameraY + canvas.height / 2;
          const radius = 5; // Consistent food size
           if (drawX + radius > 0 && drawX - radius < canvas.width && drawY + radius > 0 && drawY - radius < canvas.height) {
               drawCircle(drawX, drawY, radius, food.color || '#8BC34A');
           }
      });

      // Draw mass food (Only relevant for online? Render if exists)
      massFood.forEach(mf => {
         const drawX = mf.x - cameraX + canvas.width / 2;
         const drawY = mf.y - cameraY + canvas.height / 2;
         const radius = Math.max(2, Math.sqrt(mf.mass));
         if (drawX + radius > 0 && drawX - radius < canvas.width && drawY + radius > 0 && drawY - radius < canvas.height) {
             drawCircle(drawX, drawY, radius, mf.color);
         }
      });

      // Draw other entities (Bots in offline, Players in online)
      const entitiesToDraw = isOfflineMode ? bots : players;
      entitiesToDraw.forEach(p => {
           if (p.mass <= 0) return; // Don't draw dead entities
          const entityDrawData = {
              ...p,
              renderX: p.renderX - cameraX + canvas.width / 2, // Adjust position relative to camera
              renderY: p.renderY - cameraY + canvas.height / 2
          };
          const radius = Math.sqrt(p.mass / Math.PI) * 10;
          if (entityDrawData.renderX + radius > 0 && entityDrawData.renderX - radius < canvas.width &&
              entityDrawData.renderY + radius > 0 && entityDrawData.renderY - radius < canvas.height) {
              drawPlayer(entityDrawData);
          }
      });

      // Draw current player (centered) only if alive
      if (player.mass > 0) {
          const selfDrawData = {
            ...player,
            renderX: canvas.width / 2,
            renderY: canvas.height / 2
          };
          drawPlayer(selfDrawData);
      }

      // Make sure leaderboard is always up-to-date before rendering
      if (isOfflineMode) {
          updateOfflineLeaderboard();
      }

      // Draw leaderboard (Online) or Offline Stats
      if (!isOfflineMode) {
           drawLeaderboard();
      } else {
           // Draw both stats and leaderboard in offline mode
           drawOfflineStats();
           drawLeaderboard();
      }

  } catch (e) {
      console.error("[gameLoop] Error during rendering phase:", e);
      isGameRunning = false; // Stop loop on critical error
      isGameInitialized = false;
  }

  requestAnimationFrame(gameLoop);
}


// --- Function to update wrapper about mode changes ---
function notifyWrapperOfModeChange(mode) {
  try {
    window.parent.postMessage({
      type: 'noot-io',
      action: 'game-mode-changed',
      mode: mode // 'offline' or 'online'
    }, parentOrigin);
    console.log(`[Noot.io App] Notified wrapper about mode change: ${mode}`);
  } catch (e) {
    console.error('[Noot.io App] Error notifying wrapper:', e);
  }
}

// --- Function to notify wrapper when game starts ---
function notifyWrapperOfGameStart(mode) {
  try {
    window.parent.postMessage({
      type: 'noot-io',
      action: 'game-started',
      mode: mode // 'offline' or 'online'
    }, parentOrigin);
    console.log(`[Noot.io App] Notified wrapper about game start: ${mode}`);
  } catch (e) {
    console.error('[Noot.io App] Error notifying wrapper:', e);
  }
}

// --- Offline Mode Initialization ---
function initOfflineMode() {
  console.log("[Noot.io App] Initializing OFFLINE mode...");
  isOfflineMode = true;
  isGameInitialized = true;
  
  // Notify wrapper
  notifyWrapperOfModeChange('offline');
  
  // Show start menu
  const startMenu = document.getElementById('startMenu');
  if (startMenu) startMenu.style.display = 'block';
  
  // Hide game area until game starts
  const gameWrapper = document.getElementById('gameAreaWrapper');
  if (gameWrapper) gameWrapper.style.display = 'block';
  
  // Update game message
  setGameMessage('Ready to play in Offline Mode');
  
  // Activate the offline button visually
  const offlineButton = document.getElementById('offlineButton');
  const onlineButton = document.getElementById('onlineButton');
  if (offlineButton) {
    offlineButton.classList.add('active');
    if (onlineButton) onlineButton.classList.remove('active');
  }
  
  console.log("[Noot.io App] OFFLINE mode initialized successfully.");
}

// --- Online Mode Initialization ---
function initOnlineMode() {
  console.log("[Noot.io App] Initializing ONLINE mode...");
  isOfflineMode = false;
  
  // Notify wrapper
  notifyWrapperOfModeChange('online');
  
  // Activate the online button visually
  const onlineButton = document.getElementById('onlineButton');
  const offlineButton = document.getElementById('offlineButton');
  if (onlineButton) {
    onlineButton.classList.add('active');
    if (offlineButton) offlineButton.classList.remove('active');
  }
  
  // Update game message
  setGameMessage('Connecting to online server...');
  
  // Show loading indicator
  const loadingIndicator = document.getElementById('loading');
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  
  // Initialize the socket connection
  try {
    const websocketURL = getWebSocketURL();
    socket = io(websocketURL, { /* options */ });
    setupSocketListeners(); // Setup listeners for real socket
    
    socket.once('connect', () => {
      console.log("[Noot.io App] Socket connected for online mode.");
      isGameInitialized = true;
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      
      // Update game message
      setGameMessage('Connected! Ready to play online.');
      
      // Display start menu
      const startMenu = document.getElementById('startMenu');
      if (startMenu) startMenu.style.display = 'block';
    });
    
    socket.once('connect_error', (err) => {
      console.error("[Noot.io App] Initial connection failed:", err.message);
      isGameInitialized = false;
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      
      // Show error message
      const serverStatus = document.getElementById('server-status');
      if (serverStatus) serverStatus.style.display = 'block';
      
      // Update game message
      setGameMessage('Connection failed. Switching to offline mode...');
      
      // Switch to offline mode automatically
      setTimeout(() => initOfflineMode(), 1000);
    });
  } catch (error) {
    console.error("[Noot.io App] Failed to initialize socket connection:", error);
    isGameInitialized = false;
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    
    // Show error message
    const serverStatus = document.getElementById('server-status');
    if (serverStatus) serverStatus.style.display = 'block';
    
    // Update game message
    setGameMessage('Connection error. Switching to offline mode...');
    
    // Switch to offline mode automatically
    setTimeout(() => initOfflineMode(), 1000);
  }
}

// --- Setup mode selection buttons ---
function setupModeButtons() {
  const onlineButton = document.getElementById('onlineButton');
  const offlineButton = document.getElementById('offlineButton');
  
  if (offlineButton) {
    offlineButton.addEventListener('click', () => {
      if (isGameInitialized && isGameRunning) return; // Don't change mode during gameplay
      
      console.log("[Noot.io App] Offline button clicked");
      initOfflineMode();
    });
  } else {
    console.error("[Noot.io App] Could not find offline button element!");
  }
  
  if (onlineButton) {
    onlineButton.addEventListener('click', () => {
      if (isGameInitialized && isGameRunning) return; // Don't change mode during gameplay
      
      console.log("[Noot.io App] Online button clicked");
      initOnlineMode();
    });
  } else {
    console.error("[Noot.io App] Could not find online button element!");
  }
  
  // Add direct method to play offline mode
  window.playOffline = function() {
    console.log("[Noot.io App] Direct offline mode requested");
    initOfflineMode();
    setTimeout(() => {
      const startButton = document.getElementById('startButton');
      if (startButton) startButton.click();
    }, 500);
  };
  
  // Check if the "Play Offline" button exists and wire it up
  const playOfflineButton = document.getElementById('play-offline-btn');
  if (playOfflineButton) {
    playOfflineButton.addEventListener('click', function() {
      window.playOffline();
    });
  }
}

// Start the game with selected mode
function startGame() {
    if (isGameRunning) return;
    
    isGameRunning = true;
    
    // Show game area
    const gameWrapper = document.getElementById('gameAreaWrapper');
    if (gameWrapper) gameWrapper.style.display = 'block';
    
    // Show restart button
    const restartButton = document.getElementById('restart-button');
    if (restartButton) restartButton.style.display = 'block';
    
    // Clear game message when actively playing
    setGameMessage('');
    
    // Start the appropriate game mode
    if (gameMode === 'offline') {
        initOfflineMode();
    } else {
        initOnlineMode();
    }
}

// --- Initialization ---
async function initApp() {
    console.log("[Noot.io App] Initializing...");
    resizeCanvas();
    setupMouseTracking();

    // Hide game area initially
    const gameWrapper = document.getElementById('gameAreaWrapper');
    if (gameWrapper) gameWrapper.style.display = 'block';
    
    // Get restart button once for the entire function
    const restartButton = document.getElementById('restart-button');
    
    // Hide restart button initially
    if (restartButton) restartButton.style.display = 'none';
    
    // Set initial game message
    setGameMessage('Select mode above');

    // --- Preload skins ---
    await preloadSkins();

    // --- Key Listeners ---
    window.addEventListener('keydown', (e) => {
        if (!isGameRunning || !player || player.mass <= 0) return; // Only send if playing and alive

        if (e.code === 'Space') { // Split
            e.preventDefault();
            if (!isOfflineMode && socket && socket.connected) {
                socket.emit('split');
            } else if (isOfflineMode) {
                // Implement offline split
                offlineSplit();
            }
        }
        if (e.key === 'w' || e.key === 'W') { // Feed
            e.preventDefault();
            if (!isOfflineMode && socket && socket.connected) {
                socket.emit('feed');
            } else if (isOfflineMode) {
                // Implement offline feed
                offlineFeed();
            }
         }
    });

    // --- Setup mode selection buttons ---
    const onlineButton = document.getElementById('onlineButton');
    const offlineButton = document.getElementById('offlineButton');
    const loadingIndicator = document.getElementById('loading');
    
    if (offlineButton) {
        offlineButton.addEventListener('click', () => {
            if (isGameInitialized && isGameRunning) return; // Don't change mode during gameplay
            
            console.log("[Noot.io App] Offline button clicked");
            initOfflineMode();
        });
    } else {
        console.error("[Noot.io App] Could not find offline button element!");
    }
    
    if (onlineButton) {
        onlineButton.addEventListener('click', () => {
            if (isGameInitialized && isGameRunning) return; // Don't change mode during gameplay
            
            console.log("[Noot.io App] Online button clicked");
            initOnlineMode();
        });
    } else {
        console.error("[Noot.io App] Could not find online button element!");
    }

    // --- UI Button Listeners ---
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log("[Noot.io App] Start button clicked. isGameInitialized:", isGameInitialized, "isOfflineMode:", isOfflineMode);
            
            if (!isGameInitialized) {
                console.warn("Game mode not initialized yet. Please select Online/Offline.");
                alert("Please select Online or Offline mode first!");
                return;
            }
            
            // Show loading indicator
            if (loadingIndicator) loadingIndicator.style.display = 'block';
            
            
            // Start the game with a slight delay to allow loading indicator to display
            setTimeout(() => {
                startGame();
                // Hide loading indicator when game starts
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            }, 500);
        });
    } else {
        console.error("[Noot.io App] Could not find start button element!");
    }

    // Add listener for restart button
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            // Show loading indicator
            const loadingIndicator = document.getElementById('loading');
            if (loadingIndicator) loadingIndicator.style.display = 'block';
            
            // Restart should respect the current mode (isOfflineMode)
            console.log("Restart button clicked. Restarting in", isOfflineMode ? "Offline" : "Online", "mode.");
            isGameRunning = false; // Ensure loop stops if somehow still running
            
            // Start the game with a slight delay to allow loading indicator to display
            setTimeout(() => {
                startGame();
                // Hide loading indicator when game starts
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            }, 500);
        });
    }

    // --- Wrapper Command/Init Listener ---
    window.addEventListener('message', async (event) => {
        // Save origin for future communication
        parentOrigin = event.origin === 'null' ? '*' : event.origin;
        
        if (event.data && event.data.type === 'noot-io-command') {
            if (isGameInitialized && isGameRunning) { // Don't re-init if game is actively running
                console.log("[Noot.io App] Game already running, ignoring command.");
                return;
            }
             if (isGameInitialized && !isGameRunning) { // Allow selecting mode again if game ended (e.g., eaten)
                  isGameInitialized = false; // Reset flag to allow mode selection
                  // Ensure start menu is visible if game ended
                  const startMenu = document.getElementById('startMenu');
                   if (startMenu) startMenu.style.display = 'block';
                   const gameWrapper = document.getElementById('gameAreaWrapper');
                   if (gameWrapper) gameWrapper.style.display = 'none';
             }

             // Now proceed if !isGameInitialized

            const command = event.data.command;
            console.log(`[Noot.io App] Received command: ${command}`);

            if (command === 'start-offline') {
                 if (isGameInitialized) return; // Double check guard
                 initOfflineMode();
                 
                // Auto-start game after a short delay if requested from wrapper
                setTimeout(() => {
                    const startButton = document.getElementById('startButton');
                    if (startButton) startButton.click();
                }, 500);
            } else if (command === 'start-online') {
                 if (isGameInitialized) return; // Double check guard
                 initOnlineMode();
            }
        } else if (event.data && event.data.type === 'noot-io-init') {
            // Handle initial farm coins data
            initialFarmCoins = event.data.farmCoins || 0;
            parentOrigin = event.origin === 'null' ? '*' : event.origin;
            console.log('[Noot.io Game] Received initial farm coins:', initialFarmCoins);
        }
    });

    // Add direct method to play offline mode
    window.playOffline = function() {
        console.log("[Noot.io App] Direct offline mode requested");
        initOfflineMode();
        setTimeout(() => {
            const startButton = document.getElementById('startButton');
            if (startButton) startButton.click();
        }, 500);
    };
    
    // Check if the "Play Offline" button exists and wire it up
    const playOfflineButton = document.getElementById('play-offline-btn');
    if (playOfflineButton) {
        playOfflineButton.addEventListener('click', function() {
            window.playOffline();
        });
    }

    // Initial call to game loop
    gameLoop();
    
    // Add a safety check to auto-click the offline button if none are active after a short delay
    setTimeout(() => {
        if (!isGameInitialized && !isGameRunning) {
            console.log("[Noot.io App] No mode selected, defaulting to offline mode");
            initOfflineMode();
        }
    }, 1000);
}

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initApp);

// Ensure element IDs in index.html match:
// - Canvas: id="cvs"
// - Start Menu Div: id="startMenu"
// - Game Area Wrapper Div: id="gameAreaWrapper" (contains canvas, chat, etc.)
// - Nickname Input: id="playerNameInput" (or whatever it is)
// - Start Button: id="startButton"
// - Restart Button: id="restart-button" (needs to be added to HTML)

// Build offline leaderboard with proper display
function updateOfflineLeaderboard() {
  try {
    // Create a fresh leaderboard array
    leaderboard = [];
    
    // Add player to leaderboard if alive
    if (player && player.mass > 0) {
        // Calculate total player mass including split cells
        const totalPlayerMass = player.mass + bots
            .filter(b => b.isPlayerSplit)
            .reduce((total, cell) => total + cell.mass, 0);
        
        leaderboard.push({
            id: player.id,
            name: player.name,
            mass: totalPlayerMass
        });
    }
    
    // Add bots to leaderboard (excluding player split cells)
    bots.filter(b => !b.isPlayerSplit && b.mass > 0)
        .forEach(bot => {
            // Skip invalid bots
            if (!bot || !bot.name) return;
            
            // Calculate total bot mass including split cells
            let totalBotMass = bot.mass;
            if (!bot.isBotSplit) {
                // Add mass from this bot's split cells
                const botSplits = bots.filter(b => b.isBotSplit && b.parentBot === bot.id);
                totalBotMass += botSplits.reduce((total, cell) => total + cell.mass, 0);
            }
            
            // Only add non-split cells to leaderboard to avoid duplicates
            if (!bot.isBotSplit) {
                leaderboard.push({
                    id: bot.id,
                    name: bot.name,
                    mass: totalBotMass
                });
            }
        });
    
    // Sort leaderboard by mass (descending)
    leaderboard.sort((a, b) => b.mass - a.mass);
    
    // Limit leaderboard to top 10
    leaderboard = leaderboard.slice(0, 10);
  } catch (e) {
    console.error("[updateOfflineLeaderboard] Error:", e);
    // If there's an error, ensure leaderboard is still valid
    if (!Array.isArray(leaderboard)) leaderboard = [];
  }
}

// Player vs Bots & Bot vs Bots collision detection
function handleEntityCollisions() {
  // Create a fresh array of valid entities
  let entities = [player, ...bots].filter(e => e && e.mass > 0);
  
  for (let i = 0; i < entities.length; i++) {
      let p1 = entities[i];
      if (!p1 || p1.mass <= 0) continue; // Skip dead entities
      
      for (let j = i + 1; j < entities.length; j++) {
          let p2 = entities[j];
          if (!p2 || p2.mass <= 0) continue; // Skip dead entities
          
          const distSq = (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
          const r1 = Math.sqrt(p1.mass / Math.PI) * 10;
          const r2 = Math.sqrt(p2.mass / Math.PI) * 10;

          // Check for overlap based on larger radius containing center of smaller one + mass check
          const eatThreshold = 1.2; // Must be 20% bigger (more challenging)
          const overlapFactor = 0.7; // Center must be within 70% of radius (better detection)

          if (p1.mass > p2.mass * eatThreshold && distSq < (r1 * overlapFactor)**2) { // P1 eats P2
              console.log(`${p1.name || 'Player'} ate ${p2.name || 'Player'}`);
              p1.mass += p2.mass * 0.8; // Only gain 80% of eaten mass (more balanced)
              if (p1 === player) checkEarnedCoins(player.mass);

              // Mark p2 as eaten (set mass to 0)
              p2.mass = 0;
              
              // Handle respawning if p2 is a bot (not a split cell)
              if (p2 !== player && !p2.isPlayerSplit && !p2.isBotSplit) {
                  const botIndex = bots.findIndex(b => b.id === p2.id);
                  if (botIndex !== -1) {
                      // Remove the bot
                      bots.splice(botIndex, 1);
                      
                      // Spawn a new bot (keeping same type)
                      spawnOfflineBot(bots.length, p2.isBigBot); 
                  }
              } else if (p2.isPlayerSplit || p2.isBotSplit) {
                  // Just remove split cells when eaten
                  const botIndex = bots.findIndex(b => b.id === p2.id);
                  if (botIndex !== -1) {
                      bots.splice(botIndex, 1);
                  }
              }
              
              // After eating, immediately update leaderboard to avoid stale references
              if (isOfflineMode) updateOfflineLeaderboard();
              
              continue; // P2 is gone, check next entity against P1
          } else if (p2.mass > p1.mass * eatThreshold && distSq < (r2 * overlapFactor)**2) { // P2 eats P1
              console.log(`${p2.name || 'Player'} ate ${p1.name || 'Player'}`);
              p2.mass += p1.mass * 0.8; // Only gain 80% of eaten mass (more balanced)

              if (p1 === player) { // Player was eaten
                  console.log("[Noot.io App] Player eaten in offline mode!");
                  isGameRunning = false; // Stop game logic
                  isGameInitialized = false; // Allow re-init
                  player.mass = 0; // Mark player as dead
                  // Show restart button
                  const restartButton = document.getElementById('restart-button');
                  if (restartButton) restartButton.style.display = 'block';
                  break; // Exit inner loop
              } else if (p1.isPlayerSplit || p1.isBotSplit) {
                  // Just remove split cells when eaten
                  const botIndex = bots.findIndex(b => b.id === p1.id);
                  if (botIndex !== -1) {
                      bots.splice(botIndex, 1);
                  }
              } else {
                  // Handle respawning if p1 is a bot (not a split cell)
                  p1.mass = 0; // Mark p1 as eaten
                  const botIndex = bots.findIndex(b => b.id === p1.id);
                  if (botIndex !== -1) {
                      // Remove the bot
                      bots.splice(botIndex, 1);
                      
                      // Spawn a new bot (keeping same type)
                      spawnOfflineBot(bots.length, p1.isBigBot);
                  }
              }
              
              // After eating, immediately update leaderboard to avoid stale references
              if (isOfflineMode) updateOfflineLeaderboard();
          }
      }
      if (!isGameRunning) break; // Exit outer loop if player was eaten
  }
}
