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
const START_MASS = 100; // Player starting mass
const INITIAL_FOODS = 200; // Initial food count
const OFFLINE_BOTS = 50; // Number of bots in offline mode

// --- Helper to get WebSocket URL ---
function getWebSocketURL() {
  // Connect to the deployed Fly.io backend
  const url = 'wss://noot-nootio.fly.dev';
  console.log(`[Noot.io App] Connecting to WebSocket: ${url}`);
  return url;
}
// --- End Helper ---

// Initialize player with default values
let player = {
  id: `player_${Date.now()}`,
  name: "Player",
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  renderX: WORLD_WIDTH / 2,
  renderY: WORLD_HEIGHT / 2,
  mass: START_MASS,
  color: '#2196F3',
  skin: null,
  skinPath: null
};

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
function setGameMessage(message, isRespawnMessage = false) {
  const gameMessage = document.getElementById('gameMessage');
  if (gameMessage) {
    if (message) {
      gameMessage.textContent = message;
      gameMessage.style.display = 'block';
      
      // Clear any existing animation class
      gameMessage.classList.remove('respawn-animation');
      
      // Apply animation for respawn messages
      if (isRespawnMessage) {
        // Force a reflow (necessary for animation restart)
        void gameMessage.offsetWidth;
        gameMessage.classList.add('respawn-animation');
      }
    } else {
      gameMessage.style.display = 'none';
      gameMessage.classList.remove('respawn-animation');
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
  
  // Set default player skin for offline mode
  if (skinsLoaded) {
    const defaultSkin = 'case items/bronze/noot-noot.jpg';
    player.skinPath = defaultSkin;
    player.skin = loadedSkins[defaultSkin];
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
      isGameInitialized = true; // Keep initialization
      player = {};
      players = [];
      foods = [];
      massFood = [];
      
      // Show respawn message
      setGameMessage('Respawning in 2 seconds...', true);
      
      // Auto-respawn after 2 seconds
      setTimeout(() => {
          // Request respawn from server
          if (socket && socket.connected) {
              socket.emit('respawn', { name: player.name || 'Player' });
              
              // Show respawn notification briefly
              setGameMessage('Respawned!', true);
              setTimeout(() => setGameMessage(''), 2000);
          } else {
              setGameMessage('Connection lost. Please refresh.', true);
          }
      }, 2000);
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
      
      // Hide start menu, show canvas/wrapper
      const startMenu = document.getElementById('startMenu');
      const startMenuWrapper = document.getElementById('startMenuWrapper');
      const gameWrapper = document.getElementById('gameAreaWrapper');
      
      if (startMenu) startMenu.style.display = 'none';
      if (startMenuWrapper) {
          startMenuWrapper.style.display = 'none';
          startMenuWrapper.style.zIndex = '-1';
      }
      if (gameWrapper) {
          gameWrapper.style.display = 'block';
          gameWrapper.style.zIndex = '1';
      }
      
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
    if (!leaderboard || !Array.isArray(leaderboard) || leaderboard.length === 0) return;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width - 170, 10, 160, 20 + Math.min(leaderboard.length, 10) * 20);
    
    // Title
    drawText('Leaderboard', canvas.width - 90, 25, '#FFFFFF', 16);

    // List entries
    leaderboard.slice(0, 10).forEach((entry, i) => {
        // Skip invalid entries
        if (!entry || typeof entry !== 'object') return;
        
        // Ensure the player has a name property
        const playerName = entry.name || 'Anonymous';
        const playerMass = Math.floor(entry.mass || 0);
        
        // Highlight player's position in the leaderboard
        let isPlayer = false;
        if (player) {
            isPlayer = isOfflineMode ? 
                (i === 0 && playerName === player.name) : 
                (entry.id && player.id && entry.id === player.id);
        }
            
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
    
    // Use push to add the new bot (safer than splice)
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
  try {
      // Skip rendering if game not running
      if (!isGameRunning) {
          requestAnimationFrame(gameLoop);
          return;
      }
      
      // Update FPS counter
      updateFPS();
      
      // For offline mode - handle collisions, respawns, etc.
      if (isOfflineMode) {
          // Handle player-food collisions, bot AI, etc.
          handleEntityCollisions();
          
          // Auto-respawn player if dead in offline mode
          if (player.mass <= 0) {
              player.mass = START_MASS;
              player.x = Math.random() * WORLD_WIDTH;
              player.y = Math.random() * WORLD_HEIGHT;
              player.renderX = player.x;
              player.renderY = player.y;
              
              // Update leaderboard after respawn
              updateOfflineLeaderboard();
          }
          
          // Respawn food to maintain count
          while (foods.length < FOOD_COUNT) {
              spawnOfflineFood();
          }
          
          // Update bots
          if (bots && bots.length > 0) {
              // Process each living bot
              bots.forEach(bot => {
                  if (!bot || bot.mass <= 0) return;
                  
                  // If it's a player split cell, handle differently
                  if (bot.isPlayerSplit) {
                      // Handle split cell movement and merge cooldown
                      const now = Date.now();
                      
                      // Move toward target at decreasing speed (emulate split physics)
                      if (bot.speed > 1) {
                          bot.speed *= 0.98; // Decay speed
                          bot.x += Math.cos(bot.angle) * bot.speed;
                          bot.y += Math.sin(bot.angle) * bot.speed;
                      } else {
                          // After speed decay, follow player
                          const dx = player.x - bot.x;
                          const dy = player.y - bot.y;
                          const dist = Math.sqrt(dx * dx + dy * dy);
                          
                          // Only move if beyond merge distance
                          if (dist > 50) {
                              const angle = Math.atan2(dy, dx);
                              bot.x += Math.cos(angle) * Math.min(1, dist / 50);
                              bot.y += Math.sin(angle) * Math.min(1, dist / 50);
                          }
                          
                          // Check if it's time to merge back
                          if (now - bot.splitTime > 10000 && dist < 50) {
                              player.mass += bot.mass;
                              bot.mass = 0; // Mark for removal
                          }
                      }
                  } else if (bot.isBotSplit) {
                      // Handle bot split cell movement
                      if (bot.speed > 1) {
                          bot.speed *= bot.moveDecay || 0.98; // Decay speed
                          const dx = bot.targetX - bot.x;
                          const dy = bot.targetY - bot.y;
                          const dist = Math.sqrt(dx * dx + dy * dy);
                          const angle = Math.atan2(dy, dx);
                          
                          bot.x += Math.cos(angle) * bot.speed;
                          bot.y += Math.sin(angle) * bot.speed;
                      } else {
                          // Find a parent bot to merge back with
                          const parentBot = bots.find(b => !b.isBotSplit && b.id === bot.parentBot);
                          if (parentBot && Date.now() > bot.mergeCooldown) {
                              const dx = parentBot.x - bot.x;
                              const dy = parentBot.y - bot.y;
                              const dist = Math.sqrt(dx * dx + dy * dy);
                              
                              if (dist < 50) {
                                  // Merge back
                                  parentBot.mass += bot.mass;
                                  bot.mass = 0; // Mark for removal
                              } else {
                                  // Move toward parent for merging
                                  const angle = Math.atan2(dy, dx);
                                  bot.x += Math.cos(angle) * Math.min(2, dist / 50);
                                  bot.y += Math.sin(angle) * Math.min(2, dist / 50);
                              }
                          }
                      }
                  } else {
                      // Regular bot AI
                      // Find a new random target occasionally
                      if (Math.random() < 0.01 || 
                          (Math.abs(bot.x - bot.targetX) < 10 && Math.abs(bot.y - bot.targetY) < 10)) {
                          bot.targetX = Math.max(100, Math.min(WORLD_WIDTH - 100, bot.x + (Math.random() - 0.5) * 1000));
                          bot.targetY = Math.max(100, Math.min(WORLD_HEIGHT - 100, bot.y + (Math.random() - 0.5) * 1000));
                      }
                      
                      // Find nearby food or smaller bots to chase
                      const target = findNearbyTarget(bot);
                      if (target) {
                          bot.targetX = target.x;
                          bot.targetY = target.y;
                      }
                      
                      // Move toward target
                      const dx = bot.targetX - bot.x;
                      const dy = bot.targetY - bot.y;
                      const dist = Math.sqrt(dx * dx + dy * dy);
                      const angle = Math.atan2(dy, dx);
                      
                      // Speed based on mass (bigger = slower)
                      const speed = bot.speed / (1 + bot.mass / 1000);
                      
                      bot.x += Math.cos(angle) * Math.min(speed, dist);
                      bot.y += Math.sin(angle) * Math.min(speed, dist);
                      
                      // Split logic for bots
                      if (bot.mass > START_MASS * 2 && Math.random() < 0.001) {
                          botSplit(bot);
                      }
                  }
                  
                  // Smooth position updates with linear interpolation
                  if (bot.renderX && bot.renderY) {
                      bot.renderX = lerp(bot.renderX, bot.x, 0.1);
                      bot.renderY = lerp(bot.renderY, bot.y, 0.1);
                  }
              });
              
              // Filter out dead entities instead of splicing
              bots = bots.filter(bot => bot && bot.mass > 0);
          }
          
          // Update offline leaderboard
          updateOfflineLeaderboard();
      }
      
      // Make sure restart button is hidden during gameplay
      if (player && player.mass > 0) {
          const restartButton = document.getElementById('restart-button');
          if (restartButton) restartButton.style.display = 'none';
      }
      
      // Update mass food movement for both offline & online
      if (massFood && massFood.length > 0) {
          massFood.forEach(mf => {
              if (!mf) return;
              
              // Apply velocity
              mf.x += mf.dx;
              mf.y += mf.dy;
              
              // Apply drag
              mf.dx *= 0.98;
              mf.dy *= 0.98;
              
              // Remove old mass food by marking it
              if (Date.now() - mf.createdAt > 5000) {
                  mf.mass = 0; // Mark for removal
              }
          });
          
          // Filter expired mass food instead of splicing
          massFood = massFood.filter(mf => mf && mf.mass > 0);
      }
      
      // Apply mouse controls to player movement
      if (player.mass > 0) { // Only if player is alive
          // Calculate direction based on mouse
          const dx = mouseX - canvas.width / 2;
          const dy = mouseY - canvas.height / 2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 0) {
              // Speed based on mass (bigger = slower)
              const speed = 5 / (1 + player.mass / 1000);
              
              const normalizedDx = dx / dist;
              const normalizedDy = dy / dist;
              
              // Update logical position
              player.x += normalizedDx * speed;
              player.y += normalizedDy * speed;
              
              // Keep within bounds
              player.x = Math.max(0, Math.min(WORLD_WIDTH, player.x));
              player.y = Math.max(0, Math.min(WORLD_HEIGHT, player.y));
          }
          
          // Smooth position updates with linear interpolation
          player.renderX = lerp(player.renderX, player.x, 0.1);
          player.renderY = lerp(player.renderY, player.y, 0.1);
          
          // Check for earned coins - farming coin integration
          if (!isNaN(player.mass)) {
              checkEarnedCoins(player.mass);
          }
      }
      
      // Clear canvas with a dark background
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Make sure player has valid render coordinates
      if (!player.renderX || !player.renderY || isNaN(player.renderX) || isNaN(player.renderY)) {
          console.warn("[Noot.io Loop] Invalid camera position! Resetting.", { player });
          // Reset camera to logical position
          player.renderX = player.x || WORLD_WIDTH / 2;
          player.renderY = player.y || WORLD_HEIGHT / 2;
      }

      // Use player's interpolated render position for camera center
      let cameraX = player.renderX;
      let cameraY = player.renderY;
      if (isNaN(cameraX) || isNaN(cameraY)) {
         console.warn("[Noot.io Loop] Invalid camera position! Resetting.", { player });
         // Reset camera to logical position if render is NaN
         cameraX = player.x || WORLD_WIDTH / 2;
         cameraY = player.y || WORLD_HEIGHT / 2;
         // Also reset render positions to prevent propagation
         player.renderX = player.x || WORLD_WIDTH / 2;
         player.renderY = player.y || WORLD_HEIGHT / 2;
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
           if (!p || p.mass <= 0) return; // Don't draw dead entities
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
           if (Array.isArray(leaderboard)) {
               drawLeaderboard();
           }
      } else {
           // Draw both stats and leaderboard in offline mode
           drawOfflineStats();
           if (Array.isArray(leaderboard)) {
               drawLeaderboard();
           }
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
  
  // Set default player skin for offline mode
  if (skinsLoaded) {
    const defaultSkin = 'case items/bronze/noot-noot.jpg';
    player.skinPath = defaultSkin;
    player.skin = loadedSkins[defaultSkin];
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
    
    console.log("[Noot.io App] Starting game in mode:", isOfflineMode ? "Offline" : "Online");
    
    // Reset game state
    isGameRunning = true;
    
    // Hide start menu and its wrapper
    const startMenu = document.getElementById('startMenu');
    const startMenuWrapper = document.getElementById('startMenuWrapper');
    
    if (startMenu) startMenu.style.display = 'none';
    if (startMenuWrapper) {
        startMenuWrapper.style.display = 'none';
        startMenuWrapper.style.zIndex = '-1';
    }
    
    // Show game area
    const gameWrapper = document.getElementById('gameAreaWrapper');
    if (gameWrapper) {
        gameWrapper.style.display = 'block';
        gameWrapper.style.zIndex = '1';
    }
    
    // Explicitly hide restart button when game starts
    const restartButton = document.getElementById('restart-button');
    if (restartButton) restartButton.style.display = 'none';
    
    // Clear game message when actively playing
    setGameMessage('');
    
    // Notify wrapper that game is starting
    notifyWrapperOfGameStart(isOfflineMode ? 'offline' : 'online');
    
    // Initialize player 
    player.mass = START_MASS;
    player.x = WORLD_WIDTH / 2;
    player.y = WORLD_HEIGHT / 2;
    player.renderX = player.x;
    player.renderY = player.y;
    
    // Assign default skin to player when starting game
    if (skinsLoaded) {
        const defaultSkin = 'case items/bronze/noot-noot.jpg';
        player.skinPath = defaultSkin;
        player.skin = loadedSkins[defaultSkin];
    }
    
    // Initialize game based on current mode
    if (isOfflineMode) {
        // Reset offline game state (clear bots, foods)
        bots = [];
        foods = [];
        leaderboard = [];
        massFood = [];
        
        // Initialize offline game entities
        for (let i = 0; i < INITIAL_FOODS; i++) {
            spawnOfflineFood();
        }
        
        for (let i = 0; i < OFFLINE_BOTS; i++) {
            spawnOfflineBot(i, i < 3); // First 3 bots are "big bots"
        }
        
        updateOfflineLeaderboard();
    } else {
        // For online mode, ensure socket is connected
        if (!socket || !socket.connected) {
            console.warn("[Noot.io App] Socket not connected, attempting to reconnect");
            initOnlineMode();
            
            // Wait for socket connection before continuing
            setTimeout(() => {
                if (socket && socket.connected) {
                    console.log("[Noot.io App] Socket reconnected, starting game");
                    if (socket) socket.emit('respawn', { name: player.name });
                } else {
                    console.error("[Noot.io App] Failed to connect socket, defaulting to offline mode");
                    isOfflineMode = true;
                    startGame(); // Recursively call with offline mode
                }
            }, 1000);
            return;
        }
        
        // Emit respawn event to server
        if (socket) socket.emit('respawn', { name: player.name });
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
            
            // Make sure start menu stays hidden during restart
            const startMenu = document.getElementById('startMenu');
            const startMenuWrapper = document.getElementById('startMenuWrapper');
            if (startMenu) startMenu.style.display = 'none';
            if (startMenuWrapper) startMenuWrapper.style.display = 'none';
            
            // Start the game with a slight delay to allow loading indicator to display
            setTimeout(() => {
                startGame();
                // Hide loading indicator when game starts
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            }, 500);
        });
    }

    // --- Wrapper Command/Init Listener ---
    window.addEventListener('message', (event) => {
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
                // Make sure restart button is hidden
                const restartButton = document.getElementById('restart-button');
                if (restartButton) restartButton.style.display = 'none';
            }

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

// Handle player vs Bots & Bot vs Bots collision detection
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
                  // Mark bot for removal by setting mass to 0
                  p2.mass = 0;
                  
                  // Spawn a new bot (keeping same type)
                  spawnOfflineBot(bots.length, p2.isBigBot); 
              } else if (p2.isPlayerSplit || p2.isBotSplit) {
                  // Just mark split cells as eaten
                  p2.mass = 0;
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
                  isGameInitialized = true; // Keep initialization
                  player.mass = 0; // Mark player as dead
                  
                  // Show respawn message
                  setGameMessage('Respawning in 2 seconds...', true);
                  
                  // Auto-respawn after 2 seconds
                  setTimeout(() => {
                      // Respawn player
                      player.mass = START_MASS;
                      player.x = Math.random() * WORLD_WIDTH;
                      player.y = Math.random() * WORLD_HEIGHT;
                      player.renderX = player.x;
                      player.renderY = player.y;
                      
                      // Restart game logic
                      isGameRunning = true;
                      
                      // Show respawn notification briefly
                      setGameMessage('Respawned!', true);
                      setTimeout(() => setGameMessage(''), 2000);
                      
                      // Update leaderboard after respawn
                      updateOfflineLeaderboard();
                  }, 2000);
                  
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

// Add findNearbyTarget function for bot AI
function findNearbyTarget(bot) {
    // Don't hunt if bot is too small
    if (bot.mass < START_MASS * 1.5) return null;
    
    // Look for food first (easiest to catch)
    let closestFood = null;
    let closestFoodDist = 500; // Max detection range for food
    
    foods.forEach(food => {
        if (!food) return;
        const dx = food.x - bot.x;
        const dy = food.y - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < closestFoodDist) {
            closestFoodDist = dist;
            closestFood = food;
        }
    });
    
    // Look for smaller bots to eat (higher priority than food)
    let closestBot = null;
    let closestBotDist = 300; // Max detection range for bots
    
    bots.forEach(otherBot => {
        if (!otherBot || otherBot.id === bot.id || otherBot.mass <= 0) return;
        
        // Only chase bots that are smaller and can be eaten
        if (otherBot.mass >= bot.mass * 0.9) return;
        
        const dx = otherBot.x - bot.x;
        const dy = otherBot.y - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < closestBotDist) {
            closestBotDist = dist;
            closestBot = otherBot;
        }
    });
    
    // Check if player is in range and smaller (highest priority)
    if (player && player.mass > 0 && player.mass < bot.mass * 0.9) {
        const dx = player.x - bot.x;
        const dy = player.y - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 400) { // Bots have greater player detection range
            return player; // Chase player first
        }
    }
    
    // Return the closest valid target (prioritize bots over food)
    return closestBot || closestFood;
}
