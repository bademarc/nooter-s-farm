// Demo Mode for Noot.io
// This script simulates a server response when no real server connection is available

// Overwrite socket.io to simulate a local server
class MockSocket {
  constructor() {
    this.eventHandlers = {};
    this.player = null;
    this.players = [];
    this.foods = [];
    this.leaderboard = [];
    this.worldWidth = 4000;
    this.worldHeight = 4000;
    this.foodCount = 200;
    this.botCount = 5;
    this.initialized = false;
    
    // Initialize the game after a short delay
    setTimeout(() => this.initGame(), 500);
    
    // Start game loop
    setInterval(() => this.update(), 50);
    
    // Show server status message
    document.getElementById('server-status').classList.remove('hidden');
  }
  
  on(event, callback) {
    this.eventHandlers[event] = callback;
    return this;
  }
  
  emit(event, data) {
    if (event === 'joinGame') {
      this.joinGame(data);
    } else if (event === 'mouseMove') {
      this.movePlayer(data);
    }
  }
  
  // Simulate server events
  joinGame(data) {
    // Create player
    this.player = {
      id: 'player1',
      name: data.nickname || 'Nooter',
      x: this.worldWidth / 2,
      y: this.worldHeight / 2,
      mass: 10,
      color: this.getRandomColor()
    };
    
    // Generate food
    if (!this.initialized) {
      this.initialized = true;
      
      // Generate food
      for (let i = 0; i < this.foodCount; i++) {
        this.generateFood();
      }
      
      // Create bots
      for (let i = 0; i < this.botCount; i++) {
        this.players.push({
          id: 'bot-' + i,
          name: 'Bot ' + (i + 1),
          x: Math.random() * this.worldWidth,
          y: Math.random() * this.worldHeight,
          mass: 10 + Math.random() * 20,
          color: this.getRandomColor(),
          direction: Math.random() * Math.PI * 2,
          changeDirectionTime: Date.now() + Math.random() * 5000
        });
      }
    }
    
    // Add player to players array
    this.players.push(this.player);
    
    // Trigger the init event
    if (this.eventHandlers['initGame']) {
      this.eventHandlers['initGame']({
        player: this.player,
        players: this.players,
        foods: this.foods
      });
    }
  }
  
  movePlayer(data) {
    if (!this.player) return;
    
    // Calculate direction
    const dx = data.mouseX - this.player.x;
    const dy = data.mouseY - this.player.y;
    
    // Calculate speed (larger = slower)
    const length = Math.sqrt(dx * dx + dy * dy);
    const speed = 5 / Math.sqrt(this.player.mass);
    
    if (length > 0) {
      // Move player
      this.player.x += (dx / length) * speed;
      this.player.y += (dy / length) * speed;
      
      // Keep player within bounds
      this.player.x = Math.max(0, Math.min(this.worldWidth, this.player.x));
      this.player.y = Math.max(0, Math.min(this.worldHeight, this.player.y));
      
      // Check for food collisions
      this.checkFoodCollisions();
    }
  }
  
  update() {
    if (!this.initialized) return;
    
    // Move bots
    this.moveBots();
    
    // Check player-player collisions
    this.checkPlayerCollisions();
    
    // Update leaderboard
    this.updateLeaderboard();
    
    // Emit update event
    if (this.eventHandlers['update']) {
      this.eventHandlers['update']({
        players: this.players,
        foods: this.foods,
        leaderboard: this.leaderboard
      });
    }
    
    // Update score display
    if (this.player) {
      document.getElementById('score').textContent = `Mass: ${Math.floor(this.player.mass)}`;
    }
  }
  
  // Helper methods
  getRandomColor() {
    const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  generateFood() {
    const food = {
      id: 'food-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      x: Math.random() * this.worldWidth,
      y: Math.random() * this.worldHeight,
      color: this.getRandomColor(),
      mass: 1
    };
    this.foods.push(food);
    return food;
  }
  
  moveBots() {
    for (let i = 0; i < this.players.length; i++) {
      const bot = this.players[i];
      if (bot.id === this.player.id) continue; // Skip player
      
      // Change direction occasionally
      if (Date.now() > bot.changeDirectionTime) {
        bot.direction = Math.random() * Math.PI * 2;
        bot.changeDirectionTime = Date.now() + Math.random() * 5000;
      }
      
      // Move in the current direction
      const speed = 3 / Math.sqrt(bot.mass);
      bot.x += Math.cos(bot.direction) * speed;
      bot.y += Math.sin(bot.direction) * speed;
      
      // Keep within bounds
      if (bot.x < 0 || bot.x > this.worldWidth) {
        bot.direction = Math.PI - bot.direction;
      }
      if (bot.y < 0 || bot.y > this.worldHeight) {
        bot.direction = -bot.direction;
      }
      
      bot.x = Math.max(0, Math.min(this.worldWidth, bot.x));
      bot.y = Math.max(0, Math.min(this.worldHeight, bot.y));
      
      // Check for food collisions for bots
      for (let j = 0; j < this.foods.length; j++) {
        const food = this.foods[j];
        const dx = bot.x - food.x;
        const dy = bot.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < bot.mass) {
          // Bot eats food
          bot.mass += food.mass;
          this.foods.splice(j, 1);
          this.generateFood();
          j--;
        }
      }
    }
  }
  
  checkFoodCollisions() {
    if (!this.player) return;
    
    for (let i = 0; i < this.foods.length; i++) {
      const food = this.foods[i];
      const dx = this.player.x - food.x;
      const dy = this.player.y - food.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.player.mass) {
        // Player eats food
        this.player.mass += food.mass;
        this.foods.splice(i, 1);
        this.generateFood();
        i--;
        
        // Use the central function to check for earned coins
        checkEarnedCoins(this.player.mass);
      }
    }
  }
  
  checkPlayerCollisions() {
    if (!this.player) return;
    
    for (let i = 0; i < this.players.length; i++) {
      const otherPlayer = this.players[i];
      if (otherPlayer.id === this.player.id) continue;
      
      const dx = this.player.x - otherPlayer.x;
      const dy = this.player.y - otherPlayer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Define interaction distance (e.g., based on the larger player's radius)
      const interactionDistance = Math.max(this.player.mass, otherPlayer.mass);

      // Define mass difference threshold for eating
      const eatThreshold = 1.1; // Player must be 10% bigger
      
      // If they overlap
      if (distance < interactionDistance) { 
        // Player eats other player
        if (this.player.mass > otherPlayer.mass * eatThreshold && distance < this.player.mass) { 
          this.player.mass += otherPlayer.mass * 0.8; // Gain 80% of eaten mass
          
          // Use the central function to check for earned coins
          checkEarnedCoins(this.player.mass);

          // Remove the eaten player and spawn a new bot
          this.players.splice(i, 1);
          this.spawnNewBot();
          i--; // Adjust index after removal
        } 
        // Other player eats player
        else if (otherPlayer.mass > this.player.mass * eatThreshold && distance < otherPlayer.mass) {
          // Player is eaten - reset player state (or handle game over)
          console.log("[Demo Mode] Player eaten by", otherPlayer.name);
          // Reset player or trigger game over sequence
          this.resetPlayer(); 
          // No need to check coins here as player lost mass / died
          break; // Exit loop since player is gone/reset
        }
      }
    }
  }
  
  spawnNewBot() {
    const bot = {
      id: 'bot-' + Date.now(),
      name: 'Bot ' + Math.floor(Math.random() * 100),
      x: Math.random() * this.worldWidth,
      y: Math.random() * this.worldHeight,
      mass: 10 + Math.random() * 20,
      color: this.getRandomColor(),
      direction: Math.random() * Math.PI * 2,
      changeDirectionTime: Date.now() + Math.random() * 5000
    };
    this.players.push(bot);
  }
  
  updateLeaderboard() {
    // Sort players by mass
    const sortedPlayers = [...this.players].sort((a, b) => b.mass - a.mass);
    
    // Get top 10
    this.leaderboard = sortedPlayers.slice(0, 10).map(player => ({
      id: player.id,
      name: player.name,
      mass: Math.floor(player.mass)
    }));
  }

  resetPlayer() {
    // Example reset logic: Send player back to start, reset mass
    if (this.player) {
        this.player.x = this.worldWidth / 2;
        this.player.y = this.worldHeight / 2;
        this.player.mass = 10;
        lastKnownMass = 10; // Reset mass tracking in app.js as well
        // Potentially show a restart message/button if needed
    }
  }
}

// Check if we need to use mock socket (demo mode)
// Returns a Promise that resolves with the socket instance (real or mock)
function checkForDemoMode() {
  return new Promise((resolve) => {
    const wsURL = getWebSocketURL(); // Get the dynamic URL
    console.log("[Noot.io] Checking server connection at:", wsURL);
    try {
      // Explicitly pass the URL and options to io()
      const socketCheck = io(wsURL, { 
        timeout: 1500, // Shorter timeout
        reconnection: false, // Don't retry connection here
        transports: ['websocket'] // Prefer websocket transport
      });

      socketCheck.on('connect_error', (err) => {
        console.log('[Noot.io] Failed to connect to server, switching to demo mode. Error:', err.message);
        socketCheck.disconnect();
        document.getElementById('server-status')?.classList.remove('hidden');
        resolve(new MockSocket()); // Resolve with mock socket
      });

      socketCheck.on('connect_timeout', () => {
        console.log('[Noot.io] Connection timed out, switching to demo mode.');
        socketCheck.disconnect();
        document.getElementById('server-status')?.classList.remove('hidden');
        resolve(new MockSocket()); // Resolve with mock socket
      });

      socketCheck.on('connect', () => {
        console.log('[Noot.io] Connected to server, using real multiplayer.');
        socketCheck.disconnect(); // Disconnect the check socket
        // Resolve with a new real socket instance using the same URL
        resolve(io(wsURL, { transports: ['websocket'] })); 
      });

    } catch (e) {
      console.error('[Noot.io] Error during connection check, switching to demo mode:', e);
      document.getElementById('server-status')?.classList.remove('hidden');
      resolve(new MockSocket()); // Resolve with mock socket on error
    }
  });
}

// REMOVE the automatic execution on load
// window.addEventListener('load', checkForDemoMode); 