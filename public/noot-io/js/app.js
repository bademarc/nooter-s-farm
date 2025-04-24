// Noot.io - A simplified version of the Agar.io game
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let socket; // Define socket variable, will be assigned later

// --- Helper to get WebSocket URL ---
function getWebSocketURL() {
  // Use wss:// if the page is loaded via https://, otherwise ws://
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Connect to the same host the page is served from
  const host = window.location.host; 
  console.log(`[Noot.io App] Attempting WebSocket connection to: ${protocol}//${host}`);
  return `${protocol}//${host}`;
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
  });

  socket.on('disconnect', (reason) => {
    console.log('[Noot.io App] Socket disconnected:', reason);
    // Handle disconnection - maybe show message or attempt reconnect if using real socket
  });

  socket.on('initGame', function(data) {
    console.log("[Noot.io App] Received initGame");
    player = data.player;
    players = data.players;
    foods = data.foods;
    lastKnownMass = player.mass || 0; // Initialize mass tracking
  });

  socket.on('update', function(data) {
    // Find the current player's updated data
    const updatedPlayer = data.players.find(p => p.id === player.id);
    if (updatedPlayer) {
      checkEarnedCoins(updatedPlayer.mass); // Check for earned coins
      player = updatedPlayer; // Update the local player object fully
    } else {
      // Player might not be in the update (e.g., died in demo mode reset)
      // Find if player exists in the list at all, if not, maybe handle game over state
      const playerExists = data.players.some(p => p.id === player.id);
      if (!playerExists && player.id) { // Check if player had an id before
          console.log("[Noot.io App] Player no longer in update, might be dead/reset.");
          // Handle potential game over display or reset
      }
    }
    
    // Update other lists
    players = data.players;
    foods = data.foods;
    leaderboard = data.leaderboard;
  });
}

// Game rendering functions
function drawCircle(x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawText(text, x, y, color, size) {
  ctx.font = `${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

function drawPlayer(p) {
  drawCircle(p.x, p.y, p.mass, p.color || '#FFFFFF');
  if (p.name) {
    drawText(p.name, p.x, p.y, '#FFFFFF', 14);
  }
}

function drawFood(food) {
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

// Game loop
function gameLoop() {
  if (!canvas || !ctx) return; 
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Find current player data from the players list for accurate rendering
  // Use local player copy as fallback if not found in list yet
  const currentPlayerState = players.find(p => p.id === player.id) || player;
  
  // Calculate center position for camera based on the latest state
  let cameraX = currentPlayerState.x || canvas.width / 2;
  let cameraY = currentPlayerState.y || canvas.height / 2;
  
  // Draw food
  foods.forEach(food => {
    drawFood({
      x: food.x - cameraX + canvas.width / 2,
      y: food.y - cameraY + canvas.height / 2,
      color: food.color
    });
  });
  
  // Draw other players
  players.forEach(p => {
    // Ensure player object and id exist before comparison
    if (player && player.id && p.id !== player.id) {
      drawPlayer({
        x: p.x - cameraX + canvas.width / 2,
        y: p.y - cameraY + canvas.height / 2,
        mass: p.mass,
        name: p.name,
        color: p.color
      });
    }
  });
  
  // Draw current player
  if (currentPlayerState.x && currentPlayerState.y) {
    drawPlayer({
      x: canvas.width / 2,
      y: canvas.height / 2,
      mass: currentPlayerState.mass,
      name: currentPlayerState.name,
      color: currentPlayerState.color
    });
  }
  
  // Draw leaderboard
  if (leaderboard.length > 0) {
    drawLeaderboard();
  }
  
  // Send mouse position to server based on the latest state
  // Ensure player object and socket exist
  if (socket && currentPlayerState.x && currentPlayerState.y) {
      socket.emit('mouseMove', {
          mouseX: mouseX - canvas.width / 2 + currentPlayerState.x,
          mouseY: mouseY - canvas.height / 2 + currentPlayerState.y
      });
  }
  
  requestAnimationFrame(gameLoop);
}

// Start game function (called by button click)
function startGame() {
  if (!socket) {
    console.error("Socket not initialized yet!");
    return; // Prevent starting if socket isn't ready
  }
  const nicknameInput = document.getElementById('nickname');
  const nickname = nicknameInput ? nicknameInput.value || 'Nooter' : 'Nooter';
  
  console.log("[Noot.io App] Emitting joinGame with nickname:", nickname);
  socket.emit('joinGame', { nickname });

  const startMenu = document.getElementById('start-menu');
  const gameCanvas = document.getElementById('game-canvas');
  if (startMenu) startMenu.style.display = 'none';
  if (gameCanvas) gameCanvas.style.display = 'block';

  lastKnownMass = 0; // Reset mass tracking on new game start
  resizeCanvas(); // Ensure canvas is sized correctly before starting loop
  requestAnimationFrame(gameLoop); // Start the loop AFTER joining
}

// Main initialization function
async function initApp() {
  console.log("[Noot.io App] Initializing...");
  resizeCanvas(); // Initial resize
  window.addEventListener('resize', resizeCanvas);
  setupMouseTracking();

  // Get the socket instance (real or mock)
  socket = await checkForDemoMode(); 
  console.log("[Noot.io App] Socket instance obtained:", socket instanceof MockSocket ? "MockSocket" : "Real Socket");

  setupSocketListeners(); // Setup listeners on the obtained socket

  // Initialize menu button AFTER socket is ready
  const startButton = document.getElementById('start-button');
  if (startButton) {
    startButton.addEventListener('click', startGame);
  } else {
    console.error("Start button not found!");
  }

  console.log("[Noot.io App] Initialization complete.");
}

// Run the app initialization when the DOM is ready
document.addEventListener('DOMContentLoaded', initApp); 