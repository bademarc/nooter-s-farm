// Demo Mode for Noot.io
// This script simulates a server response when no real server connection is available

// Overwrite socket.io to simulate a local server
class MockSocket {
  constructor() {
    try {
      this.eventHandlers = {};
      this.player = null;
      this.players = []; // Includes player + bots
      this.foods = [];
      this.leaderboard = [];
      this.worldWidth = 4000;
      this.worldHeight = 4000;
      this.foodCount = 200;
      this.botCount = 30; // Set to 30
      this.initialized = false;
      this.intervalId = null; // To store interval ID for cleanup

      console.log("[MockSocket] Initialized");

      // Show server status message immediately for offline mode
      const serverStatus = document.getElementById('server-status');
      if (serverStatus) serverStatus.classList.remove('hidden');

    } catch (error) {
      console.error("[MockSocket] Error during constructor (possibly storage access):", error);
      // Optionally display an error to the user that offline mode might be limited
    }
  }

  on(event, callback) {
    console.log(`[MockSocket] Registering listener for: ${event}`);
    this.eventHandlers[event] = callback;
    return this;
  }

  emit(event, data) {
    console.log(`[MockSocket] Emitting event: ${event}`, data);
    if (event === 'joinGame') {
      this.joinGame(data);
    } else if (event === 'mouseMove') {
      this.updatePlayerTarget(data);
    } else if (event === 'split') {
        // TODO: Implement mock split logic if needed
        console.log("[MockSocket] Split command received (not implemented)");
    } else if (event === 'feed') {
        // TODO: Implement mock feed logic if needed
        console.log("[MockSocket] Feed command received (not implemented)");
    }
  }

  // Simulate server emitting an event to the client
  _triggerClientEvent(event, data) {
     // console.log(`[MockSocket] Triggering client event: ${event}`, data); // Can be noisy
    if (this.eventHandlers[event]) {
      try {
        this.eventHandlers[event](data);
      } catch (error) {
        console.error(`[MockSocket] Error executing client handler for ${event}:`, error);
      }
    }
  }

  // Simulate server events
  joinGame(data) {
    console.log("[MockSocket] joinGame called with data:", data);
    // Create player
    const startX = this.worldWidth / 2;
    const startY = this.worldHeight / 2;
    const playerSkinPath = 'case items/bronze/noot-noot.jpg';
    this.player = {
      id: 'player1',
      name: data.nickname || 'Nooter',
      x: startX,
      y: startY,
      renderX: startX, // Initialize render position
      renderY: startY,
      serverX: startX, // Initialize server position (mock)
      serverY: startY,
      targetX: startX, // Initialize target
      targetY: startY,
      mass: START_MASS, // Use constant from app.js
      color: this.getRandomColor(),
      skinPath: playerSkinPath, // Assign player skin path
      skin: skinsLoaded ? loadedSkins[playerSkinPath] : null
    };
    console.log("[MockSocket] Player created:", this.player);

    // Generate food and bots only once
    if (!this.initialized) {
      this.initialized = true;
      this.players = []; // Reset players list
      this.foods = [];   // Reset food list

      // Generate initial food
      for (let i = 0; i < this.foodCount; i++) {
        this.generateFood();
      }
      console.log(`[MockSocket] Generated ${this.foods.length} initial food items.`);

      // Create bots
      const availableBotSkins = skinPaths.filter(p => p !== playerSkinPath);
      for (let i = 0; i < this.botCount; i++) {
        const botSkinPath = availableBotSkins.length > 0 ? availableBotSkins[Math.floor(Math.random() * availableBotSkins.length)] : null;
        const botStartX = Math.random() * this.worldWidth;
        const botStartY = Math.random() * this.worldHeight;
        this.players.push({
          id: 'bot-' + i,
          name: 'Bot ' + (i + 1),
          x: botStartX,
          y: botStartY,
          renderX: botStartX,
          renderY: botStartY,
          serverX: botStartX,
          serverY: botStartY,
          targetX: botStartX,
          targetY: botStartY,
          mass: 10 + Math.random() * 20,
          color: this.getRandomColor(),
          skinPath: botSkinPath,
          skin: botSkinPath && skinsLoaded ? loadedSkins[botSkinPath] : null,
          // Bot specific movement properties
          direction: Math.random() * Math.PI * 2,
          changeDirectionTime: Date.now() + Math.random() * 5000
        });
      }
       console.log(`[MockSocket] Generated ${this.players.length} bots.`);
    }

    // Add player to the players list (which now includes bots)
    this.players.push(this.player);
    console.log(`[MockSocket] Total entities in players list: ${this.players.length}`);

    // Trigger the initGame event for the client
    this._triggerClientEvent('initGame', {
      player: this.player,
      // Initial nearbyEntitiesUpdate will provide others
      players: [],
      foods: [],
      massFood: []
    });

    // Start the simulation loop if not already running
    if (!this.intervalId) {
        console.log("[MockSocket] Starting simulation loop.");
        this.intervalId = setInterval(() => this.update(), 50); // Approx 20 FPS
    }
  }

  // Update player target based on mouse move
  updatePlayerTarget(data) {
    if (!this.player) return;
    this.player.targetX = data.mouseX;
    this.player.targetY = data.mouseY;
  }

  // Main simulation loop
  update() {
    if (!this.initialized || !this.player) return;

    // 1. Move all entities (player + bots)
    this.players.forEach(p => {
        if (p.id === this.player.id) {
            this.moveEntity(this.player);
        } else {
            this.moveBot(p);
        }
    });

    // 2. Check collisions
    this.players.forEach(p => {
        // Food collisions (player + bots)
        this.checkFoodCollisions(p);
        // Player collisions (only need to check player vs bots)
        if (p.id === this.player.id) {
            this.checkPlayerCollisions(this.player);
        }
    });

    // 3. Update leaderboard
    this.updateLeaderboard();

    // 4. Emit updates to the client
    // Emit player's own state
    this._triggerClientEvent('updatedSelf', {
      id: this.player.id,
      x: this.player.x,
      y: this.player.y,
      mass: this.player.mass,
      color: this.player.color,
      name: this.player.name
    });

    // Emit nearby entities (simplified: send all bots and food for demo)
    // In a real scenario, you'd filter based on viewport/proximity
    this._triggerClientEvent('nearbyEntitiesUpdate', {
      players: this.players.filter(p => p.id !== this.player.id).map(p => ({ // Exclude self
          id: p.id, x: p.x, y: p.y, mass: p.mass, color: p.color, name: p.name, skinPath: p.skinPath
      })),
      foods: this.foods.map(f => ({ id: f.id, x: f.x, y: f.y, color: f.color })),
      massFood: [] // Assuming no feed/split in mock for now
    });

    // Emit leaderboard periodically (or always in demo)
    this._triggerClientEvent('leaderboardUpdate', this.leaderboard);

  }

  // --- Helper methods ---
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
      mass: FOOD_MASS // Use constant from app.js
    };
    this.foods.push(food);
    this._triggerClientEvent('foodSpawned', food); // Notify client
    return food;
  }

  // Generic entity movement (used for player)
  moveEntity(entity) {
    const targetX = entity.targetX;
    const targetY = entity.targetY;
    const dx = targetX - entity.x;
    const dy = targetY - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
        const speed = PLAYER_SPEED / Math.max(1, Math.sqrt(entity.mass / START_MASS));
        const moveX = Math.min(speed, dist) * (dx / dist);
        const moveY = Math.min(speed, dist) * (dy / dist);

        entity.x += moveX;
        entity.y += moveY;

        // Keep entity within bounds
        entity.x = Math.max(0, Math.min(this.worldWidth, entity.x));
        entity.y = Math.max(0, Math.min(this.worldHeight, entity.y));
    }
     // Update serverX/Y for interpolation reference
     entity.serverX = entity.x;
     entity.serverY = entity.y;
  }

  // Bot-specific movement
  moveBot(bot) {
     // Change direction occasionally
    if (Date.now() > bot.changeDirectionTime) {
      bot.direction = Math.random() * Math.PI * 2;
      bot.changeDirectionTime = Date.now() + Math.random() * 5000;
    }

    // Move in the current direction
    const speed = 3 / Math.sqrt(bot.mass); // Bots might move slower
    bot.x += Math.cos(bot.direction) * speed;
    bot.y += Math.sin(bot.direction) * speed;

    // Keep within bounds and bounce (simple bounce)
    if (bot.x < 0 || bot.x > this.worldWidth) {
      bot.direction = Math.PI - bot.direction;
      bot.x = Math.max(0, Math.min(this.worldWidth, bot.x)); // Clamp after bounce
    }
    if (bot.y < 0 || bot.y > this.worldHeight) {
      bot.direction = -bot.direction;
      bot.y = Math.max(0, Math.min(this.worldHeight, bot.y)); // Clamp after bounce
    }

    // Update serverX/Y for interpolation reference
    bot.serverX = bot.x;
    bot.serverY = bot.y;
  }

  // Check food collisions for a specific entity (player or bot)
  checkFoodCollisions(entity) {
    const entityRadius = Math.sqrt(entity.mass / Math.PI) * 10; // Example radius calculation
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const food = this.foods[i];
      const dx = entity.x - food.x;
      const dy = entity.y - food.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < entityRadius) { // Simple overlap check
        entity.mass += food.mass;
        this._triggerClientEvent('foodEaten', food.id); // Notify client
        this.foods.splice(i, 1);
        this.generateFood(); // Generate new food

        // If the player ate food, check for coins
        if (entity.id === this.player.id) {
            checkEarnedCoins(this.player.mass);
        }
      }
    }
  }

  // Check player vs bot collisions
  checkPlayerCollisions(player) {
    const playerRadius = Math.sqrt(player.mass / Math.PI) * 10;
    for (let i = this.players.length - 1; i >= 0; i--) {
      const otherPlayer = this.players[i];
      if (otherPlayer.id === player.id) continue; // Skip self

      const dx = player.x - otherPlayer.x;
      const dy = player.y - otherPlayer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const otherRadius = Math.sqrt(otherPlayer.mass / Math.PI) * 10;

      const eatThreshold = 1.1; // Must be 10% bigger

      // Check for overlap
      if (distance < playerRadius + otherRadius * 0.8) {
           // Player eats bot
          if (player.mass > otherPlayer.mass * eatThreshold && distance < playerRadius - otherRadius * 0.5) {
              console.log("[MockSocket] Player ate bot:", otherPlayer.name);
              player.mass += otherPlayer.mass * 0.8;
              checkEarnedCoins(player.mass); // Check coins after eating bot
              this.resetBot(otherPlayer); // Reset the bot instead of removing
          }
          // Bot eats player
          else if (otherPlayer.mass > player.mass * eatThreshold && distance < otherRadius - playerRadius * 0.5) {
              console.log("[MockSocket] Bot ate player:", otherPlayer.name);
              this._triggerClientEvent('eaten', { by: otherPlayer.name });
              // Client handles showing restart button, we just stop simulation for player
              this.player = null; // Player is gone
              this.players = this.players.filter(p => p.id !== 'player1'); // Remove player from list
              clearInterval(this.intervalId); // Stop simulation loop
              this.intervalId = null;
              break; // Exit collision check for player
          }
      }
    }
  }

  // Reset a bot to a new random state
  resetBot(bot) {
      console.log(`[MockSocket] Resetting bot ${bot.name}`);
      bot.x = Math.random() * this.worldWidth;
      bot.y = Math.random() * this.worldHeight;
      bot.mass = 10 + Math.random() * 20;
      bot.direction = Math.random() * Math.PI * 2;
      bot.changeDirectionTime = Date.now() + Math.random() * 5000;
      // Reassign skin (or keep the same one)
      const availableBotSkins = skinPaths.filter(p => p !== 'case items/bronze/noot-noot.jpg');
      const botSkinPath = availableBotSkins.length > 0 ? availableBotSkins[Math.floor(Math.random() * availableBotSkins.length)] : null;
      bot.skinPath = botSkinPath;
      bot.skin = botSkinPath && skinsLoaded ? loadedSkins[botSkinPath] : null;
  }

  updateLeaderboard() {
    // Sort players by mass (include player and bots)
    const sortedPlayers = [...this.players].sort((a, b) => b.mass - a.mass);

    // Get top 10
    this.leaderboard = sortedPlayers.slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      mass: Math.floor(p.mass)
    }));
  }

  // Simulate disconnect (optional, if needed for testing)
  disconnect() {
    console.log("[MockSocket] Disconnecting...");
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.player = null;
    this.players = [];
    this.foods = [];
    this.initialized = false;
    this._triggerClientEvent('disconnect', 'simulation ended');
  }
}

// Keep the checkForDemoMode function (now unused, but might be useful later)
// ... (checkForDemoMode code remains here but isn't called automatically) ...
