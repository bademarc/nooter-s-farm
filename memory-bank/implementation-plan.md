# Implementation Plan for "Defend Your Farm"

This plan outlines the steps to implement "Defend Your Farm," a casual defense game where players protect crops from waves of pests using direct action (swatting) and farm-themed defenses. The game will be built using a **hybrid approach** that combines **Phaser.js** for game mechanics with **React** for UI integration, ensuring seamless compatibility with the existing application.

## Integration Strategy

Rather than creating a standalone game, "Defend Your Farm" will be embedded as a React component that houses the Phaser.js game canvas. This approach:

1. Leverages Phaser's optimized game features (physics, animations, game loop)
2. Maintains consistency with the existing React application structure
3. Allows easy integration with the app's token system and UI patterns

## Development Phases

### Phase 1: Core Setup and Integration

**Step 1: Create Basic React Component Structure**

```jsx
// components/farm-game/FarmGame.jsx
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

export const FarmGame = ({ farmCoins, addFarmCoins }) => {
  const gameRef = useRef(null);
  
  useEffect(() => {
    // Initialize Phaser game within React component
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'phaser-game-container',
      scene: [GameScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      }
    };
    
    // Create the game instance
    gameRef.current = new Phaser.Game(config);
    
    // Pass external data to the game scene
    gameRef.current.registry.set('farmCoins', farmCoins);
    gameRef.current.registry.set('addFarmCoins', addFarmCoins);
    
    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);
  
  return (
    <div className="noot-card">
      <div className="border-b border-[#333] p-4">
        <h2 className="noot-header flex items-center text-white noot-title">
          <span className="mr-2">🛡️</span>
          Defend Your Farm
        </h2>
        <p className="text-white/60 text-sm noot-text">
          Protect your crops from waves of hungry pests
        </p>
      </div>
      <div id="phaser-game-container" className="w-full h-[600px] bg-[#111]"></div>
    </div>
  );
};
```

**Step 2: Create Basic Game Scene**

```javascript
// components/farm-game/scenes/GameScene.js
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.farmCoins = 0;
    this.addFarmCoinsCallback = null;
  }
  
  init() {
    // Retrieve data from React
    this.farmCoins = this.game.registry.get('farmCoins');
    this.addFarmCoinsCallback = this.game.registry.get('addFarmCoins');
    
    // Setup game state
    this.gameState = {
      isActive: false,
      wave: 1,
      score: 0,
      lives: 5
    };
  }
  
  preload() {
    // Initially using emoji as placeholders
    // Will replace with proper sprites later
  }
  
  create() {
    // Create basic game UI with style matching the app
    this.createUI();
    
    // Create start game button
    this.createStartButton();
  }
  
  update() {
    // Game loop logic
  }
  
  createUI() {
    // Create UI with styling that matches the app's dark theme
    this.moneyText = this.add.text(20, 20, `Farm Coins: ${this.farmCoins}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF'
    });
    
    this.waveText = this.add.text(20, 50, `Wave: ${this.gameState.wave}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF'
    });
  }
  
  createStartButton() {
    // Create a start button styled like the app's buttons
    const button = this.add.rectangle(400, 300, 200, 50, 0xFFFFFF);
    const text = this.add.text(400, 300, 'Start Game', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#000000'
    }).setOrigin(0.5);
    
    button.setInteractive();
    button.on('pointerdown', () => this.startGame());
  }
  
  startGame() {
    this.gameState.isActive = true;
    // Additional game start logic
  }
  
  // Method to update Farm Coins in the React app
  updateFarmCoins(amount) {
    if (this.addFarmCoinsCallback) {
      this.addFarmCoinsCallback(amount);
      this.farmCoins += amount;
      this.moneyText.setText(`Farm Coins: ${this.farmCoins}`);
    }
  }
}
```

**Step 3: Integrate with Farm Component**

```jsx
// components/farm.tsx (partial)
// Import the FarmGame component
import { FarmGame } from './farm-game/FarmGame';

// Add to your activeTab handling
{activeTab === "defend" && (
  <FarmGame 
    farmCoins={farmCoins} 
    addFarmCoins={addFarmCoins} 
  />
)}
```

**Test**: The Phaser game canvas should appear in the "Defend" tab, with a start button and basic UI elements that match the app's styling.

### Phase 2: Core Gameplay Loop

**Step 4: Implement Crop Planting**

```javascript
// components/farm-game/entities/Crop.js
export class Crop extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    // Initially using rectangle as placeholder
    super(scene, x, y, 'crop');
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body
    
    // Properties
    this.health = 100;
    this.value = 10;
    this.harvestable = false;
    
    // Setup growth timer
    this.growthTimer = scene.time.addEvent({
      delay: 5000, // 5 seconds to grow
      callback: () => this.setHarvestable(),
      callbackScope: this
    });
    
    // Visual representation (placeholder)
    this.setSize(40, 40);
    this.setDisplaySize(40, 40);
    this.setFillStyle(0x00FF00); // Green for crops
  }
  
  setHarvestable() {
    this.harvestable = true;
    this.setFillStyle(0xFFFF00); // Yellow for harvestable
  }
  
  damage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
    }
  }
}
```

**Update GameScene.js**:

```javascript
preload() {
  // Load placeholder assets
}

create() {
  // ...existing code
  
  // Create crops array
  this.crops = [];
  
  // Handle planting on click (when game is active)
  this.input.on('pointerdown', (pointer) => {
    if (this.gameState.isActive && this.farmCoins >= 5) {
      const crop = new Crop(this, pointer.x, pointer.y);
      this.crops.push(crop);
      this.updateFarmCoins(-5); // Cost to plant
    }
  });
}
```

**Test**: Clicking on the game area should create a crop object (green rectangle) if you have enough Farm Coins.

**Step 5: Implement Enemy Spawning**

```javascript
// components/farm-game/entities/Enemy.js
export class Enemy extends Phaser.GameObjects.Sprite {
  constructor(scene, type, x, y) {
    super(scene, x, y, type);
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Enemy properties based on type
    this.enemyTypes = {
      rabbit: { 
        health: 1, 
        speed: 100, 
        damage: 10,
        value: 2
      },
      bird: { 
        health: 1, 
        speed: 150, 
        damage: 10,
        value: 2
      }
    };
    
    // Set properties
    const typeConfig = this.enemyTypes[type];
    this.type = type;
    this.health = typeConfig.health;
    this.speed = typeConfig.speed;
    this.damage = typeConfig.damage;
    this.value = typeConfig.value;
    
    // Visual representation (placeholder)
    this.setSize(30, 30);
    this.setDisplaySize(30, 30);
    this.setFillStyle(0xFF0000); // Red for enemies
    
    // Set text to show enemy type
    this.typeText = scene.add.text(x, y - 20, this.getEmojiForType(type), {
      fontSize: '24px'
    }).setOrigin(0.5);
  }
  
  getEmojiForType(type) {
    const emojiMap = {
      rabbit: '🐰',
      bird: '🐦'
    };
    return emojiMap[type] || '❓';
  }
  
  update() {
    // Move toward nearest crop
    // Basic AI movement
    this.typeText.x = this.x;
    this.typeText.y = this.y - 20;
  }
  
  damage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.typeText.destroy();
      this.destroy();
      return true; // Enemy defeated
    }
    return false;
  }
}
```

**Update GameScene.js**:

```javascript
create() {
  // ...existing code
  
  // Create enemies array
  this.enemies = [];
  
  // Start first wave when game starts
}

startWave() {
  const wave = this.gameState.wave;
  const enemyCount = Math.min(3 + wave, 15); // Cap at 15 enemies per wave
  
  for (let i = 0; i < enemyCount; i++) {
    // Spawn enemy with delay
    this.time.addEvent({
      delay: i * 1500, // Staggered spawning
      callback: () => this.spawnEnemy(),
      callbackScope: this
    });
  }
}

spawnEnemy() {
  // Determine enemy type based on wave
  const type = Math.random() > 0.5 ? 'rabbit' : 'bird';
  
  // Spawn from right side of screen at random Y position
  const x = 800;
  const y = Phaser.Math.Between(100, 500);
  
  const enemy = new Enemy(this, type, x, y);
  this.enemies.push(enemy);
}

update() {
  // Update all enemies
  this.enemies.forEach(enemy => enemy.update());
}
```

**Test**: When the game starts, enemies should spawn from the right side of the screen with emoji representations.

**Step 6: Implement Direct Action (Swatting)**

```javascript
// Update GameScene.js

create() {
  // ...existing code
  
  // Handle enemy swatting
  this.input.on('pointerdown', (pointer) => {
    if (!this.gameState.isActive) return;
    
    // Check if clicked on an enemy
    const clickedEnemy = this.getEnemyAtPosition(pointer.x, pointer.y);
    if (clickedEnemy) {
      if (clickedEnemy.damage(1)) {
        // Enemy defeated
        this.updateFarmCoins(clickedEnemy.value);
        this.gameState.score += 10;
        this.updateScoreText();
        
        // Remove from array
        this.enemies = this.enemies.filter(e => e !== clickedEnemy);
      }
    } else if (this.farmCoins >= 5) {
      // Plant crop if not clicking on enemy
      const crop = new Crop(this, pointer.x, pointer.y);
      this.crops.push(crop);
      this.updateFarmCoins(-5); // Cost to plant
    }
  });
}

getEnemyAtPosition(x, y) {
  return this.enemies.find(enemy => {
    const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, x, y);
    return distance < 30; // Click radius
  });
}

updateScoreText() {
  if (!this.scoreText) {
    this.scoreText = this.add.text(20, 80, `Score: ${this.gameState.score}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF'
    });
  } else {
    this.scoreText.setText(`Score: ${this.gameState.score}`);
  }
}
```

**Test**: Clicking on enemies should "swat" them, reducing their health. When defeated, they should disappear and you should gain Farm Coins and score.

**Step 7: Implement Crop Harvesting**

```javascript
// Update GameScene.js

create() {
  // ...existing code
  
  // Add harvest button
  this.harvestButton = this.add.rectangle(400, 550, 200, 40, 0xFFFFFF);
  this.harvestText = this.add.text(400, 550, 'Harvest Crops', {
    fontFamily: 'Arial',
    fontSize: '16px',
    color: '#000000'
  }).setOrigin(0.5);
  
  this.harvestButton.setInteractive();
  this.harvestButton.on('pointerdown', () => this.harvestAllCrops());
  
  // Initially hide harvest button
  this.harvestButton.setVisible(false);
  this.harvestText.setVisible(false);
}

startGame() {
  // ...existing code
  
  // Show harvest button when game starts
  this.harvestButton.setVisible(true);
  this.harvestText.setVisible(true);
}

harvestAllCrops() {
  let harvestedCount = 0;
  let totalCoins = 0;
  
  this.crops.forEach(crop => {
    if (crop.harvestable) {
      totalCoins += crop.value;
      harvestedCount++;
      crop.destroy();
    }
  });
  
  // Update coins
  if (harvestedCount > 0) {
    this.updateFarmCoins(totalCoins);
    
    // Show feedback text
    const harvestText = this.add.text(400, 300, `+${totalCoins} Farm Coins!`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FFFF00'
    }).setOrigin(0.5);
    
    // Fade out and destroy
    this.tweens.add({
      targets: harvestText,
      alpha: 0,
      y: 250,
      duration: 2000,
      onComplete: () => harvestText.destroy()
    });
  }
  
  // Remove harvested crops from array
  this.crops = this.crops.filter(crop => crop.active);
}
```

**Test**: The harvest button should appear when the game starts. When clicked, it should harvest all ready crops, adding their value to your Farm Coins.

### Phase 3: Additional Game Elements

**Step 8: Implement Basic Defense (Scarecrow)**

```javascript
// components/farm-game/entities/Defense.js
export class Defense extends Phaser.GameObjects.Sprite {
  constructor(scene, type, x, y) {
    super(scene, x, y, type);
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body
    
    // Defense properties based on type
    this.defenseTypes = {
      scarecrow: {
        range: 150,
        effectiveness: {
          bird: 0.8,
          rabbit: 0.2
        },
        cost: 20
      },
      dog: {
        range: 200,
        effectiveness: {
          bird: 0.3,
          rabbit: 0.9
        },
        cost: 35
      }
    };
    
    // Set properties
    const typeConfig = this.defenseTypes[type];
    this.type = type;
    this.range = typeConfig.range;
    this.effectiveness = typeConfig.effectiveness;
    
    // Visual representation (placeholder)
    this.setSize(40, 40);
    this.setDisplaySize(40, 40);
    this.setFillStyle(0x0000FF); // Blue for defenses
    
    // Set text to show defense type
    this.typeText = scene.add.text(x, y - 20, this.getEmojiForType(type), {
      fontSize: '24px'
    }).setOrigin(0.5);
    
    // Debug: show range
    this.rangeCircle = scene.add.circle(x, y, this.range, 0x0000FF, 0.1);
  }
  
  getEmojiForType(type) {
    const emojiMap = {
      scarecrow: '🎭',
      dog: '🐕'
    };
    return emojiMap[type] || '❓';
  }
  
  affectsEnemy(enemy) {
    // Check if enemy is in range
    const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
    if (distance <= this.range) {
      // Check effectiveness against this enemy type
      const effectiveness = this.effectiveness[enemy.type] || 0;
      return Math.random() < effectiveness;
    }
    return false;
  }
}
```

**Update GameScene.js**:

```javascript
create() {
  // ...existing code
  
  // Create defenses array
  this.defenses = [];
  
  // Add defense placement UI
  this.createDefenseUI();
}

createDefenseUI() {
  // Create defense buttons
  const scarecrowButton = this.add.rectangle(700, 100, 80, 40, 0xFFFFFF);
  const scarecrowText = this.add.text(700, 100, '🎭 (20)', {
    fontFamily: 'Arial',
    fontSize: '16px',
    color: '#000000'
  }).setOrigin(0.5);
  
  scarecrowButton.setInteractive();
  scarecrowButton.on('pointerdown', () => this.selectDefense('scarecrow'));
  
  // Add dog defense later
}

selectDefense(type) {
  const cost = this.getDefenseCost(type);
  
  if (this.farmCoins >= cost) {
    // Enter placement mode
    this.selectedDefense = type;
    
    // Show placement cursor
    if (!this.placementCursor) {
      this.placementCursor = this.add.text(0, 0, this.getEmojiForDefenseType(type), {
        fontSize: '24px'
      }).setOrigin(0.5);
    } else {
      this.placementCursor.setText(this.getEmojiForDefenseType(type));
    }
    
    // Move cursor with pointer
    this.input.on('pointermove', (pointer) => {
      if (this.selectedDefense) {
        this.placementCursor.x = pointer.x;
        this.placementCursor.y = pointer.y;
      }
    });
    
    // Place on click
    this.input.on('pointerdown', (pointer) => {
      if (this.selectedDefense) {
        this.placeDefense(this.selectedDefense, pointer.x, pointer.y);
        this.selectedDefense = null;
        this.placementCursor.setVisible(false);
      }
    });
  }
}

getDefenseCost(type) {
  const costs = {
    scarecrow: 20,
    dog: 35
  };
  return costs[type] || 0;
}

getEmojiForDefenseType(type) {
  const emojis = {
    scarecrow: '🎭',
    dog: '🐕'
  };
  return emojis[type] || '❓';
}

placeDefense(type, x, y) {
  const cost = this.getDefenseCost(type);
  
  if (this.farmCoins >= cost) {
    const defense = new Defense(this, type, x, y);
    this.defenses.push(defense);
    this.updateFarmCoins(-cost);
  }
}

update() {
  // ...existing code
  
  // Check if defenses affect enemies
  this.defenses.forEach(defense => {
    this.enemies.forEach(enemy => {
      if (defense.affectsEnemy(enemy)) {
        // Change enemy direction or slow them down
        enemy.speed = -enemy.speed; // Simple example: reverse direction
      }
    });
  });
}
```

**Test**: Click on the scarecrow button, then place it on the field. It should deter birds more effectively than rabbits, causing them to change direction.

**Step 9: Implement Wave Progression**

```javascript
// Update GameScene.js

create() {
  // ...existing code
  
  // Add wave indicator
  this.waveText = this.add.text(20, 50, `Wave: ${this.gameState.wave}`, {
    fontFamily: 'Arial',
    fontSize: '18px',
    color: '#FFFFFF'
  });
}

startGame() {
  this.gameState.isActive = true;
  this.gameState.wave = 1;
  this.gameState.lives = 5;
  this.gameState.score = 0;
  
  // Update UI
  this.updateWaveText();
  this.updateLivesText();
  this.updateScoreText();
  
  // Start first wave
  this.startWave();
}

startWave() {
  // Show wave announcement
  const waveAnnouncement = this.add.text(400, 300, `Wave ${this.gameState.wave}`, {
    fontFamily: 'Arial',
    fontSize: '36px',
    color: '#FFFFFF'
  }).setOrigin(0.5);
  
  // Fade out announcement
  this.tweens.add({
    targets: waveAnnouncement,
    alpha: 0,
    y: 250,
    duration: 2000,
    onComplete: () => {
      waveAnnouncement.destroy();
      this.spawnWaveEnemies();
    }
  });
}

spawnWaveEnemies() {
  const wave = this.gameState.wave;
  const enemyCount = Math.min(3 + wave, 15);
  
  // Track remaining enemies
  this.enemiesRemaining = enemyCount;
  
  for (let i = 0; i < enemyCount; i++) {
    this.time.addEvent({
      delay: i * 1500,
      callback: () => this.spawnEnemy(),
      callbackScope: this
    });
  }
}

updateWaveText() {
  this.waveText.setText(`Wave: ${this.gameState.wave}`);
}

updateLivesText() {
  if (!this.livesText) {
    this.livesText = this.add.text(20, 110, `Lives: ${this.gameState.lives}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF'
    });
  } else {
    this.livesText.setText(`Lives: ${this.gameState.lives}`);
  }
}

checkWaveComplete() {
  if (this.enemies.length === 0 && this.enemiesRemaining === 0) {
    // Wave completed
    const completionText = this.add.text(400, 300, 'Wave Completed!', {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#00FF00'
    }).setOrigin(0.5);
    
    // Advance to next wave
    this.time.addEvent({
      delay: 3000,
      callback: () => {
        completionText.destroy();
        this.gameState.wave++;
        this.updateWaveText();
        this.startWave();
      },
      callbackScope: this
    });
  }
}

update() {
  // ...existing code
  
  // Check for wave completion
  this.checkWaveComplete();
}
```

**Test**: When the game starts, "Wave 1" should appear briefly. After defeating all enemies in the wave, "Wave Completed!" should appear, followed by the next wave with more enemies.

**Step 10: Add Basic UI Elements and Game Over**

```javascript
// Update GameScene.js

create() {
  // ...existing code
  
  // Create main game UI
  this.createMainUI();
}

createMainUI() {
  // UI Container
  this.uiContainer = this.add.container(0, 0);
  
  // Background for UI
  const uiBg = this.add.rectangle(400, 30, 800, 60, 0x111111).setOrigin(0.5, 0.5);
  this.uiContainer.add(uiBg);
  
  // Farm Coins
  this.moneyText = this.add.text(20, 20, `Farm Coins: ${this.farmCoins}`, {
    fontFamily: 'Arial',
    fontSize: '18px',
    color: '#FFFFFF'
  });
  this.uiContainer.add(this.moneyText);
  
  // Wave indicator
  this.waveText = this.add.text(250, 20, `Wave: ${this.gameState.wave}`, {
    fontFamily: 'Arial',
    fontSize: '18px',
    color: '#FFFFFF'
  });
  this.uiContainer.add(this.waveText);
  
  // Lives indicator
  this.livesText = this.add.text(400, 20, `Lives: ${this.gameState.lives}`, {
    fontFamily: 'Arial',
    fontSize: '18px',
    color: '#FFFFFF'
  });
  this.uiContainer.add(this.livesText);
  
  // Score
  this.scoreText = this.add.text(550, 20, `Score: ${this.gameState.score}`, {
    fontFamily: 'Arial',
    fontSize: '18px',
    color: '#FFFFFF'
  });
  this.uiContainer.add(this.scoreText);
  
  // End game button
  const endGameButton = this.add.rectangle(700, 20, 100, 30, 0xFF0000).setOrigin(0.5, 0.5);
  const endGameText = this.add.text(700, 20, 'End Game', {
    fontFamily: 'Arial',
    fontSize: '14px',
    color: '#FFFFFF'
  }).setOrigin(0.5, 0.5);
  
  endGameButton.setInteractive();
  endGameButton.on('pointerdown', () => this.endGame(false));
  
  this.uiContainer.add(endGameButton);
  this.uiContainer.add(endGameText);
}

endGame(victory) {
  this.gameState.isActive = false;
  
  // Stop all enemies
  this.enemies.forEach(enemy => {
    enemy.speed = 0;
  });
  
  // Show game over screen
  const resultText = victory ? 'Victory!' : 'Game Over';
  const gameOverText = this.add.text(400, 250, resultText, {
    fontFamily: 'Arial',
    fontSize: '48px',
    color: victory ? '#00FF00' : '#FF0000'
  }).setOrigin(0.5);
  
  const scoreText = this.add.text(400, 320, `Score: ${this.gameState.score}`, {
    fontFamily: 'Arial',
    fontSize: '24px',
    color: '#FFFFFF'
  }).setOrigin(0.5);
  
  const wavesText = this.add.text(400, 360, `Waves Completed: ${this.gameState.wave - 1}`, {
    fontFamily: 'Arial',
    fontSize: '24px',
    color: '#FFFFFF'
  }).setOrigin(0.5);
  
  // Restart button
  const restartButton = this.add.rectangle(400, 430, 200, 50, 0xFFFFFF);
  const restartText = this.add.text(400, 430, 'Play Again', {
    fontFamily: 'Arial',
    fontSize: '24px',
    color: '#000000'
  }).setOrigin(0.5);
  
  restartButton.setInteractive();
  restartButton.on('pointerdown', () => {
    // Clean up
    gameOverText.destroy();
    scoreText.destroy();
    wavesText.destroy();
    restartButton.destroy();
    restartText.destroy();
    
    // Restart game
    this.cleanupCurrentGame();
    this.startGame();
  });
}

cleanupCurrentGame() {
  // Destroy all game objects
  this.enemies.forEach(enemy => enemy.destroy());
  this.crops.forEach(crop => crop.destroy());
  this.defenses.forEach(defense => {
    defense.rangeCircle.destroy();
    defense.destroy();
  });
  
  // Clear arrays
  this.enemies = [];
  this.crops = [];
  this.defenses = [];
  this.enemiesRemaining = 0;
}
```

**Test**: The game should have a clean UI with Farm Coins, Wave, Lives, and Score indicators. When the game ends, a game over screen should appear with the option to play again.

## Asset Integration Plan

Initially, the game will use placeholder visuals (emoji, colored rectangles) to focus on gameplay mechanics. Later phases will integrate proper art assets:

1. **Phase 1**: Continue using emoji/shapes for rapid development.
2. **Phase 2**: Create or source farm-themed sprites for:
   - Crops (carrots, corn)
   - Enemies (rabbits, birds)
   - Defenses (scarecrows, dogs)
   - UI elements (buttons, backgrounds)
3. **Phase 3**: Add animations and visual effects:
   - Growing crops
   - Enemy movements
   - Attack/defeat animations

## Testing Strategy

1. **Manual Testing**: Each feature will be tested manually during development.
2. **Iterative Feedback**: Gather player feedback on gameplay balance and usability.
3. **Future Automated Testing**: Once the core game is stable, implement:
   - Unit tests for game logic
   - Integration tests for React/Phaser communication

## Integration Points

- **Token System**: The game will use the app's existing Farm Coins system.
- **UI Design**: Game UI will match the app's dark theme and white button style.
- **Component Structure**: The game will be embedded as a React component in the farm tab.

## Future Enhancements

After implementing the core game, consider these additions:

1. **More Enemy Types**: Add deer and boars with unique behaviors.
2. **Additional Defenses**: Implement traps, fences, and more defensive options.
3. **Upgrades System**: Allow players to improve defenses and farming tools.
4. **Sound Effects**: Add audio feedback for game actions.
5. **Difficulty Settings**: Implement adjustable difficulty levels.

This implementation plan provides a clear roadmap for building "Defend Your Farm" as an integrated component within your existing React application, while leveraging Phaser.js for optimized game mechanics.

