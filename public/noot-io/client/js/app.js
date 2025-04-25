// Noot.io - A simplified agar.io-like game
const canvas = document.getElementById('cvs');
const ctx = canvas.getContext('2d');
let socket; // Define socket variable, will be assigned later
let isOfflineMode = false;
let isGameInitialized = false; // Flag to prevent multiple initializations
let bots = []; // Array for offline bots
const BOT_COUNT = 10; // How many bots in offline mode
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
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(canvas.width - 170, 10, 160, 20 + leaderboard.length * 20);
  drawText('Leaderboard', canvas.width - 90, 25, '#FFFFFF', 16);

  leaderboard.forEach((player, i) => {
    drawText(`${i+1}. ${player.name || 'Anonymous'}: ${Math.floor(player.mass)}`, canvas.width - 90, 45 + i * 20, '#FFFFFF', 14);
  });
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
function spawnOfflineBot(index) {
    // Random skin selection for bots
    let randomSkinPath = 'case items/bronze/noot-noot.jpg'; // Default fallback
    
    if (skinsLoaded) {
        const skinKeys = Object.keys(loadedSkins);
        if (skinKeys.length > 0) {
            randomSkinPath = skinKeys[Math.floor(Math.random() * skinKeys.length)];
        }
    }
    
    const bot = {
        id: `bot_${index}_${Date.now()}`,
        name: `Bot_${index}`,
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        mass: START_MASS + Math.random() * 50, // Random start mass
        color: colors[Math.floor(Math.random() * colors.length)],
        renderX: 0, // Will be set relative to camera
        renderY: 0,
        // Bot movement state
        targetX: Math.random() * WORLD_WIDTH,
        targetY: Math.random() * WORLD_HEIGHT,
        speed: 2 + Math.random() * 2, // Slower than player usually
        // Add skin to bot
        skinPath: randomSkinPath,
        skin: skinsLoaded ? loadedSkins[randomSkinPath] : null
    };
    
    bot.renderX = bot.x; // Initialize render pos
    bot.renderY = bot.y;
    bots.push(bot);
}

// Game loop
function gameLoop() {
  if (!canvas || !ctx) {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (!isGameRunning) {
     ctx.fillStyle = '#111827'; // Draw background
     ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (!isGameInitialized) { // Before mode selected
           drawText('Select mode above.', canvas.width / 2, canvas.height / 2, '#AAAAAA', 20);
       } else if (!isOfflineMode && (!socket || !socket.connected)) { // Trying online but disconnected
           drawText('Disconnected. Trying to reconnect...', canvas.width / 2, canvas.height / 2, '#AAAAAA', 20);
       } else { // Waiting to start (e.g., after being eaten)
           drawText('Waiting for player start...', canvas.width / 2, canvas.height / 2, '#AAAAAA', 20);
       }
     requestAnimationFrame(gameLoop);
     return;
  }

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
      // --- Offline Bot Movement ---
      bots.forEach(bot => {
          if (bot.mass <= 0) return; // Skip dead bots
          
          // Intelligence based on size comparison with player
          const botRadius = Math.sqrt(bot.mass / Math.PI) * 10;
          const playerRadius = Math.sqrt(player.mass / Math.PI) * 10;
          const distToPlayer = Math.sqrt((bot.x - player.x)**2 + (bot.y - player.y)**2);
          const awarenessRadius = 300; // How far bots can "see" the player
          
          if (distToPlayer < awarenessRadius) {
              // Bot is aware of player
              if (bot.mass > player.mass * 1.2) {
                  // Bot is bigger than player - HUNT PLAYER!
                  console.log(`Bot ${bot.name} is hunting player!`);
                  bot.targetX = player.x;
                  bot.targetY = player.y;
                  bot.speed = 3 + Math.random(); // Aggressive speed
              } else if (player.mass > bot.mass * 1.2) {
                  // Player is bigger than bot - RUN AWAY!
                  console.log(`Bot ${bot.name} is fleeing from player!`);
                  // Calculate vector away from player
                  const fleeX = bot.x - player.x;
                  const fleeY = bot.y - player.y;
                  const fleeDist = Math.sqrt(fleeX*fleeX + fleeY*fleeY);
                  if (fleeDist > 0) {
                      // Normalize and scale to position at edge of world
                      const escapeMultiplier = 500 / fleeDist;
                      bot.targetX = bot.x + fleeX * escapeMultiplier;
                      bot.targetY = bot.y + fleeY * escapeMultiplier;
                      
                      // Ensure target is within world bounds
                      bot.targetX = Math.max(100, Math.min(WORLD_WIDTH - 100, bot.targetX));
                      bot.targetY = Math.max(100, Math.min(WORLD_HEIGHT - 100, bot.targetY));
                      bot.speed = 4 + Math.random(); // Faster when fleeing
                  }
              }
          } else {
              // Normal wandering behavior when player is not nearby
              const botDx = bot.targetX - bot.x;
              const botDy = bot.targetY - bot.y;
              const botDist = Math.sqrt(botDx * botDx + botDy * botDy);
              
              // If bot has reached target or doesn't have one, pick a new random target
              if (botDist < 20 || isNaN(bot.targetX) || isNaN(bot.targetY)) {
                  bot.targetX = Math.random() * WORLD_WIDTH;
                  bot.targetY = Math.random() * WORLD_HEIGHT;
                  bot.speed = 2 + Math.random(); // Normal wandering speed
              }
          }
          
          // Bot movement logic (unchanged)
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
       // Ensure minimum food count
       while (foods.length < FOOD_COUNT * 0.8) {
           spawnOfflineFood();
       }

      // Player vs Bots & Bot vs Bots (Simplified)
      let entities = [player, ...bots];
      for (let i = 0; i < entities.length; i++) {
           if (!entities[i] || entities[i].mass <= 0) continue; // Skip null/dead entities
          for (let j = i + 1; j < entities.length; j++) {
               if (!entities[j] || entities[j].mass <= 0) continue; // Skip null/dead entities
              let p1 = entities[i];
              let p2 = entities[j];
              const distSq = (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
              const r1 = Math.sqrt(p1.mass / Math.PI) * 10;
              const r2 = Math.sqrt(p2.mass / Math.PI) * 10;

              // Check for overlap based on larger radius containing center of smaller one + mass check
              const eatThreshold = 1.2; // Must be 20% bigger (more challenging)
              const overlapFactor = 0.7; // Center must be within 70% of radius (better detection)

              if (p1.mass > p2.mass * eatThreshold && distSq < (r1 * overlapFactor)**2) { // P1 eats P2
                  console.log(`${p1.name} ate ${p2.name}`);
                  p1.mass += p2.mass * 0.8; // Only gain 80% of eaten mass (more balanced)
                  if (p1 === player) checkEarnedCoins(player.mass);

                  // Mark p2 as eaten (set mass to 0)
                  p2.mass = 0;
                  const botIndex = bots.findIndex(b => b.id === p2.id);
                  if (botIndex !== -1) {
                      // Respawn bot after a delay? For now, just remove and add new one
                      bots.splice(botIndex, 1);
                      spawnOfflineBot(bots.length); // Keep count stable
                  }
                  // Update entities array for next checks? No, use mass check
                  continue; // P2 is gone, check next entity against P1
              } else if (p2.mass > p1.mass * eatThreshold && distSq < (r2 * overlapFactor)**2) { // P2 eats P1
                  console.log(`${p2.name} ate ${p1.name}`);
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
                  } else {
                      // Bot ate another bot
                      p1.mass = 0; // Mark p1 as eaten
                      const botIndex = bots.findIndex(b => b.id === p1.id);
                      if (botIndex !== -1) {
                          bots.splice(botIndex, 1);
                          spawnOfflineBot(bots.length);
                      }
                      // Restart inner loop for p2 vs remaining entities? No, just continue outer loop.
                  }
              }
          }
          if (!isGameRunning) break; // Exit outer loop if player was eaten
      }
       // Clean up dead bots from main array
       bots = bots.filter(b => b.mass > 0);


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


      // Update Stats Display (shared) - Use different elements?
      // const scoreElement = document.getElementById('score'); // Assuming this exists
      // if (scoreElement) {
      //   scoreElement.textContent = `Mass: ${player.mass ? Math.floor(player.mass).toLocaleString() : 0}`;
      // }

      // Draw leaderboard (Online) or Offline Stats
      if (!isOfflineMode) {
           drawLeaderboard();
      } else {
           // Draw offline score/stats top-left
           ctx.textAlign = 'left'; // Align left for stats
           drawText(`Mass: ${player.mass ? Math.floor(player.mass).toLocaleString() : 0}`, 20, 30, '#FFFFFF', 16);
           drawText(`Bots: ${bots.length}`, 20, 50, '#FFFFFF', 16);
           // Could add FPS counter here too
      }


  } catch (e) {
      console.error("[gameLoop] Error during rendering phase:", e);
      isGameRunning = false; // Stop loop on critical error
      isGameInitialized = false;
  }

  requestAnimationFrame(gameLoop);
}


// Start game function (called by button click or restart)
// Modify startGame to accept an optional mode hint, but rely on isOfflineMode
function startGame() {
    console.log(`[Noot.io App] startGame called. isOfflineMode: ${isOfflineMode}`);
    const restartButton = document.getElementById('restart-button');
    if (restartButton) restartButton.style.display = 'none';

    // Ensure Nickname input ID is correct in index.html, maybe 'playerNameInput'?
    const nicknameInput = document.getElementById('playerNameInput');
    const nickname = nicknameInput ? nicknameInput.value.trim().substring(0, 16) || `Nooter_${Math.floor(Math.random()*1000)}` : `Nooter_${Math.floor(Math.random()*1000)}`;

    if (isOfflineMode) {
        console.log("[Noot.io App] Setting up OFFLINE game...");
        // Setup local player
        player = {
            id: `offline_${Date.now()}`, // Unique enough for offline
            name: nickname,
            x: WORLD_WIDTH/2 + (Math.random() * 400 - 200), // Spawn near center with slight randomization
            y: WORLD_HEIGHT/2 + (Math.random() * 400 - 200), // Spawn near center with slight randomization
            mass: START_MASS,
            color: colors[Math.floor(Math.random() * colors.length)],
            renderX: 0, // Will be set relative to camera
            renderY: 0,
            // Assign default skin
            skinPath: 'case items/bronze/noot-noot.jpg',
            skin: skinsLoaded ? loadedSkins['case items/bronze/noot-noot.jpg'] : null
        };
        player.renderX = player.x; // Init render pos
        player.renderY = player.y;
        lastKnownMass = player.mass;

        // Reset and spawn initial food
        foods = [];
        for (let i = 0; i < FOOD_COUNT; i++) {
            spawnOfflineFood();
        }

        // Reset and spawn bots
        bots = [];
        players = []; // Clear remote players array
        for (let i = 0; i < BOT_COUNT; i++) {
            spawnOfflineBot(i);
        }

        isGameRunning = true; // Start the game loop logic

        // Hide start menu, show canvas wrapper
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
        console.log("[Noot.io App] Offline game setup complete. Player:", player);

    } else { // Online Mode
        if (!socket || !socket.connected) {
            console.error("Socket not ready for online play!");
            // Display error to user? Show start menu again?
             const startMenu = document.getElementById('startMenu');
             if (startMenu) startMenu.style.display = 'block';
             isGameInitialized = false; // Allow retrying connection/mode selection
            return;
        }
        console.log("[Noot.io App] Requesting to join ONLINE game with name:", nickname);
        socket.emit('joinGame', { nickname: nickname });
        // isGameRunning will be set true by the 'initGame' event from server
    }
}


// --- Initialization ---
async function initApp() {
    console.log("[Noot.io App] Initializing...");
    resizeCanvas();
    setupMouseTracking();

    // Hide game area initially
    const gameWrapper = document.getElementById('gameAreaWrapper');
    if (gameWrapper) gameWrapper.style.display = 'none';
    
    // Get restart button once for the entire function
    const restartButton = document.getElementById('restart-button');
    
    // Hide restart button initially
    if (restartButton) restartButton.style.display = 'none';


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
                // Offline split logic (Example: lose half mass, create smaller piece - complex)
                console.log("Offline split attempted (not implemented)");
                 if (player.mass >= START_MASS * 2) {
                    // player.mass /= 2;
                    // Create a new 'cell' - needs more logic
                 }
            }
        }
        if (e.key === 'w' || e.key === 'W') { // Feed
            e.preventDefault();
            if (!isOfflineMode && socket && socket.connected) {
                socket.emit('feed');
            } else if (isOfflineMode) {
                 // Offline feed logic (Example: lose small mass, create mass food)
                 console.log("Offline feed attempted (not implemented)");
                  if (player.mass > START_MASS + 10) { // Need minimum mass to feed
                     // player.mass -= 10; // Cost of feeding
                     // spawnMassFood(player.x, player.y, 10); // Need this function
                  }
            }
         }
    });

    // --- Wrapper Command/Init Listener ---
    window.addEventListener('message', async (event) => {
        // IMPORTANT: Validate event.origin in production
        // if (event.origin !== 'YOUR_EXPECTED_ORIGIN') { console.warn("Ignoring message from wrong origin:", event.origin); return; }

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
                isOfflineMode = true;
                isGameInitialized = true; // Mark as initialized (mode selected)
                // Show start menu to enter name etc.
                const startMenu = document.getElementById('startMenu');
                if (startMenu) startMenu.style.display = 'block';
                 const gameWrapper = document.getElementById('gameAreaWrapper');
                 if (gameWrapper) gameWrapper.style.display = 'none'; // Hide game area until startGame
                console.log("[Noot.io App] Mode set to OFFLINE. Ready for player name.");

            } else if (command === 'start-online') {
                 if (isGameInitialized) return; // Double check guard
                isOfflineMode = false;
                // Initialize the REAL socket connection
                try {
                    const websocketURL = getWebSocketURL();
                    socket = io(websocketURL, { /* options */ });
                    setupSocketListeners(); // Setup listeners ONLY for real socket

                    // Wait for connection confirmation before marking initialized? Or handle in listeners.
                     socket.once('connect', () => { // Use once to avoid multiple calls if reconnects
                        console.log("[Noot.io App] Socket connected for online mode.");
                         isGameInitialized = true; // Mark as initialized (mode selected + connected)
                         // Show start menu to enter name etc.
                         const startMenu = document.getElementById('startMenu');
                         if (startMenu) startMenu.style.display = 'block';
                          const gameWrapper = document.getElementById('gameAreaWrapper');
                          if (gameWrapper) gameWrapper.style.display = 'none'; // Hide game area
                     });
                     socket.once('connect_error', (err) => { // Use once
                         console.error("[Noot.io App] Initial connection failed:", err.message);
                         isGameInitialized = false; // Reset flag on failure
                          // Provide user feedback (e.g., alert or message on screen)
                          alert("Failed to connect to online server. Please try again later or play offline.");
                     });

                } catch (error) {
                    console.error("[Noot.io App] Failed to initialize real socket connection:", error);
                    isGameInitialized = false;
                    alert("Error setting up online mode. Please try again later or play offline.");
                }
            }
        } else if (event.data && event.data.type === 'noot-io-init') {
            // Handle initial farm coins data
            initialFarmCoins = event.data.farmCoins || 0;
            parentOrigin = event.origin;
            console.log('[Noot.io Game] Received initial farm coins:', initialFarmCoins);
        }
    });

    // --- UI Button Listeners ---
    // Use correct ID for start button, e.g., 'startButton'
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', () => {
             if (!isGameInitialized) {
                 console.warn("Game mode not initialized yet. Please select Online/Offline.");
                 return;
             }
             startGame(); // Calls the modified startGame
         });
    }

    // Add listener for restart button (using the already defined variable)
    if (restartButton) {
        restartButton.addEventListener('click', () => {
             // Restart should respect the current mode (isOfflineMode)
              console.log("Restart button clicked. Restarting in", isOfflineMode ? "Offline" : "Online", "mode.");
              isGameRunning = false; // Ensure loop stops if somehow still running
              startGame();
        });
    }

    // Initial call to game loop
    gameLoop();
} // End of initApp

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initApp);

// Ensure element IDs in index.html match:
// - Canvas: id="cvs"
// - Start Menu Div: id="startMenu"
// - Game Area Wrapper Div: id="gameAreaWrapper" (contains canvas, chat, etc.)
// - Nickname Input: id="playerNameInput" (or whatever it is)
// - Start Button: id="startButton"
// - Restart Button: id="restart-button" (needs to be added to HTML)
