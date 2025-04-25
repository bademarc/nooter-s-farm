this.foods = [];
this.leaderboard = [];
this.worldWidth = 4000;
this.worldHeight = 4000;
this.foodCount = 200;
this.botCount = 30;
this.initialized = false;

// Initialize the game after a short delay 

// Create bots
const availableBotSkins = skinPaths.filter(p => p !== 'case items/bronze/noot-noot.jpg');
for (let i = 0; i < this.botCount; i++) {
    const botSkinPath = availableBotSkins.length > 0 ? availableBotSkins[Math.floor(Math.random() * availableBotSkins.length)] : null;
    const botSkin = botSkinPath && skinsLoaded ? loadedSkins[botSkinPath] : null;

    this.players.push({
      id: 'bot-' + i,
      name: 'Bot ' + (i + 1),
      x: Math.random() * this.worldWidth,
      y: Math.random() * this.worldHeight,
      mass: 10 + Math.random() * 20,
      color: this.getRandomColor(),
      direction: Math.random() * Math.PI * 2,
      changeDirectionTime: Date.now() + Math.random() * 5000,
      // --- Assign skin --- 
      skin: botSkin,
      skinPath: botSkinPath
    });
  }
} 