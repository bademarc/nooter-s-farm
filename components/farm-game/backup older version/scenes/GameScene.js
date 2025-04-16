'use client';

// Set up a global flag to prevent recursive/overlapping updates
let isUpdating = false;

// Ensure we only run Phaser-specific code on the client
const isBrowser = typeof window !== 'undefined';

// Create a placeholder class for SSR
class PlaceholderScene {
  constructor() {
    this.type = 'placeholder';
  }
  
  // Add stub methods to prevent errors
  init() {}
  preload() {}
  create() {}
  update() {}
}

// Define a class that will be used on the client side
class GameSceneImpl {
  constructor() {
    if (!isBrowser) return;
    
    this.type = 'game-scene';
    this.farmCoins = 0;
    this.addFarmCoinsCallback = null;
    this.crops = {};
    this.enemies = [];
    this.isSpawningEnemies = false;
    this.gameInitialized = false;
    this.initialClickProcessed = false;
    this.allowPlanting = false;
    this.upgradeSystem = null;
    this.pendingDefensePlacement = false; // New flag to track if we're waiting for placement click
  }
  
  // Add stub methods for safety
  init() {}
  preload() {}
  create() {}
  update() {}
  createBackground() {}
  createUI() {}
  setupInputHandlers() {}
  showStartButton() {}
  startGame() {}
  forceNextWave() {}
}

// Only load and initialize Phaser on the client
let GameScene = PlaceholderScene;

if (isBrowser) {
  // We're on the client side, so we can safely use Phaser
  console.log("Browser detected, loading Phaser...");
  import('phaser').then(module => {
    try {
      console.log("Phaser module loaded:", !!module);
      const Phaser = module.default;
      console.log("Phaser loaded:", !!Phaser);
      
      // Now define the real GameScene that extends Phaser.Scene
      class GameSceneClient extends Phaser.Scene {
        constructor() {
          super('GameScene');
          this.type = 'phaser-scene';
          this.farmCoins = 0;
          this.addFarmCoinsCallback = null;
          this.crops = {};
          this.enemies = [];
          this.isSpawningEnemies = false;
          this.gameInitialized = false;
          this.initialClickProcessed = false;
          this.allowPlanting = false;
          this.waveTimer = null;
          this.waveInProgress = false;
          this.gameState = {
            isActive: false,
            isPaused: false,
            score: 0,
            lives: 3,
            wave: 1,
            farmCoins: 0,
            clickDamage: 0.5,
            canPlant: true
          };
          this.enemiesSpawned = 0;
          this.totalEnemiesInWave = 0;
          this.upgradeSystem = null;
          this.pendingDefensePlacement = false; // New flag to track if we're waiting for placement click
        }
        
        init(data) {
          console.log("GameScene init started");
          try {
            // Initialize game state with safe values
            this.gameState = {
              isActive: false,
              isPaused: false,
              score: 0,
              lives: 3,
              wave: 1,
              farmCoins: 0, // Reset to zero
              clickDamage: 0.5, // Reduced from 1
              canPlant: true
            };
            
            // Store callbacks
            this.addFarmCoins = this.registry.get('addFarmCoins');
            this.EnemyClass = this.registry.get('EnemyClass');
            this.CropClass = this.registry.get('CropClass');
            this.UpgradeClass = this.registry.get('UpgradeClass');
            
            console.log("GameScene initialized with state:", this.gameState);
          } catch (error) {
            console.error("Error in GameScene init:", error);
            throw error;
          }
        }
        
        preload() {
          try {
            console.log("GameScene preload started");
            
            // Load Upgrade module
            this.UpgradeClass = this.registry.get('UpgradeClass');
            
            // Load tree/plant assets
            this.load.image('Fruit_tree3', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees_shadow/Fruit_tree3.png');
            this.load.image('Moss_tree3', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees_shadow/Moss_tree3.png');
            
            // Load fireball assets
            this.load.image('fireball', '/fireball.png');
            this.load.image('iceball', '/iceball.png');
            
            // Load tileset assets
            this.load.image('tileset', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/1 Tiles/FieldsTileset.png');
            this.load.image('tileset2', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/1.1 Tiles/Tileset2.png');
            
            // Load individual tiles for specific uses
            this.load.image('grass1', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/1 Tiles/FieldsTile_01.png');
            this.load.image('grass2', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/1 Tiles/FieldsTile_02.png');
            this.load.image('soil1', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/1 Tiles/FieldsTile_11.png');
            this.load.image('soil2', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/1 Tiles/FieldsTile_12.png');
            
            // Load decorative objects
            this.load.image('towerPlace1', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/2 Objects/PlaceForTower1.png');
            this.load.image('towerPlace2', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/2 Objects/PlaceForTower2.png');
            
            // Load trees
            this.load.image('tree1', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Tree1.png');
            this.load.image('tree2', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Tree2.png');
            this.load.image('tree3', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Tree3.png');
            this.load.image('fruitTree1', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Fruit_tree1.png');
            this.load.image('fruitTree2', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Fruit_tree2.png');
            this.load.image('flowerTree1', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Flower_tree1.png');
            this.load.image('flowerTree2', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Flower_tree2.png');
            
            // Load houses
            this.load.image('house1', '/characters/2 Objects/7 House/1.png');
            this.load.image('house2', '/characters/2 Objects/7 House/2.png');
            this.load.image('house3', '/characters/2 Objects/7 House/3.png');
            this.load.image('house4', '/characters/2 Objects/7 House/4.png');
            
            // Load decorative elements
            this.load.image('decor1', '/characters/2 Objects/3 Decor/1.png');
            this.load.image('decor2', '/characters/2 Objects/3 Decor/2.png');
            this.load.image('decor3', '/characters/2 Objects/3 Decor/3.png');
            this.load.image('decor4', '/characters/2 Objects/3 Decor/4.png');
            this.load.image('decor5', '/characters/2 Objects/3 Decor/5.png');
            this.load.image('decor6', '/characters/2 Objects/3 Decor/6.png');
            this.load.image('decor7', '/characters/2 Objects/3 Decor/7.png');
            this.load.image('decor8', '/characters/2 Objects/3 Decor/8.png');
            
            // Load penguin mage assets
            this.load.image('ABS_idle', '/ABS.png');
            this.load.image('ABS_attack', '/ABS.png');
            this.load.image('NOOT_idle', '/NOOT.png');
            this.load.image('NOOT_attack', '/NOOT.png');
            
            // Load enemy images with proper path and error handling
            this.load.image('enemy_bird', 'characters/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon1.png');
            this.load.image('enemy_rabbit', 'characters/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon2.png');
            this.load.image('enemy_boss', 'characters/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon3.png');
            
            // Load shadows
            this.load.image('shadow1', '/characters/2 Objects/1 Shadow/1.png');
            this.load.image('shadow2', '/characters/2 Objects/1 Shadow/2.png');
            
            // Load plant assets for crops
            this.load.image('plant1_idle', '/characters/craftpix-net-922184-free-predator-plant-mobs-pixel-art-pack/PNG/Plant1/Idle/Plant1_Idle_head.png');
            this.load.image('plant2_idle', '/characters/craftpix-net-922184-free-predator-plant-mobs-pixel-art-pack/PNG/Plant2/Idle/Plant2_Idle_head.png');
            this.load.image('plant3_idle', '/characters/craftpix-net-922184-free-predator-plant-mobs-pixel-art-pack/PNG/Plant3/Idle/Plant3_Idle_head.png');
            
            // Load essential pixel for effects
            this.load.image('pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
            
            // Add load error handling
            this.load.on('loaderror', (fileObj) => {
              console.error('Error loading asset:', fileObj.key);
              
              // Create a placeholder for missing fireball assets
              if (fileObj.key === 'fireball_blue' || fileObj.key === 'fireball_red') {
                const color = fileObj.key === 'fireball_blue' ? 0x0088FF : 0xFF4400;
                const graphics = this.make.graphics();
                graphics.fillStyle(color, 1);
                graphics.fillCircle(16, 16, 16);
                graphics.generateTexture(fileObj.key, 32, 32);
                console.log(`Created fallback texture for ${fileObj.key}`);
              }
            });
            
            // Create fallback textures for commonly missing assets as a failsafe
            this.load.on('complete', () => {
              // Check if fireball textures exist, if not create them
              if (!this.textures.exists('fireball_blue')) {
                const blueGraphics = this.make.graphics();
                blueGraphics.fillStyle(0x0088FF, 1);
                blueGraphics.fillCircle(16, 16, 16);
                // Add glow effect
                blueGraphics.fillStyle(0x66BBFF, 0.4);
                blueGraphics.fillCircle(16, 16, 20);
                blueGraphics.generateTexture('fireball_blue', 40, 40);
                console.log('Created fallback texture for fireball_blue on load complete');
              }
              
              if (!this.textures.exists('fireball_red')) {
                const redGraphics = this.make.graphics();
                redGraphics.fillStyle(0xFF4400, 1);
                redGraphics.fillCircle(16, 16, 16);
                // Add glow effect
                redGraphics.fillStyle(0xFF8866, 0.4);
                redGraphics.fillCircle(16, 16, 20);
                redGraphics.generateTexture('fireball_red', 40, 40);
                console.log('Created fallback texture for fireball_red on load complete');
              }
            });
            
            console.log("GameScene assets preloaded");
          } catch (error) {
            console.error("Error in GameScene preload:", error);
            throw error;
          }
        }
        
        create() {
          try {
            console.log("GameScene create start");
            
            // Prepare game state
            this.gameState = {
              wave: 1,
              score: 0,
              farmCoins: 50,
              isActive: false,
              lives: 3,
              clickDamage: 1,
            };
            
            // Create dynamic textures for fireballs if they don't exist
            if (!this.textures.exists('fireball_red')) {
              try {
                // Create red fireball (for fire mage)
                const redGraphics = this.make.graphics();
                redGraphics.fillStyle(0xFF4400, 1); // Core
                redGraphics.fillCircle(16, 16, 10);
                redGraphics.fillStyle(0xFF8866, 0.7); // Mid glow
                redGraphics.fillCircle(16, 16, 14);
                redGraphics.fillStyle(0xFF9977, 0.3); // Outer glow
                redGraphics.fillCircle(16, 16, 20);
                redGraphics.generateTexture('fireball_red', 40, 40);
                console.log('Created red fireball texture');
              } catch (error) {
                console.error("Error creating red fireball texture:", error);
              }
            }
            
            if (!this.textures.exists('fireball_blue')) {
              try {
                // Create blue iceball (for ice mage)
                const blueGraphics = this.make.graphics();
                blueGraphics.fillStyle(0x0088FF, 1); // Core
                blueGraphics.fillCircle(16, 16, 10);
                blueGraphics.fillStyle(0x66BBFF, 0.7); // Mid glow
                blueGraphics.fillCircle(16, 16, 14);
                blueGraphics.fillStyle(0x99CCFF, 0.3); // Outer glow
                blueGraphics.fillCircle(16, 16, 20);
                blueGraphics.generateTexture('fireball_blue', 40, 40);
                console.log('Created blue iceball texture');
              } catch (error) {
                console.error("Error creating blue iceball texture:", error);
              }
            }
            
            // Initialize global flag for update loop
            isUpdating = false;
            
            console.log("GameScene create started");
            
            // Initialize the defense range indicator early
            this.defenseRangeIndicator = this.add.circle(0, 0, 150, 0xFFFFFF, 0.2);
            this.defenseRangeIndicator.setStrokeStyle(2, 0xFFFFFF);
            this.defenseRangeIndicator.setVisible(false);
            
            // Define the range functions early
            this.showDefenseRange = (x, y, radius) => {
              if (this.defenseRangeIndicator) {
                this.defenseRangeIndicator.x = x;
                this.defenseRangeIndicator.y = y;
                this.defenseRangeIndicator.setRadius(radius);
                this.defenseRangeIndicator.setVisible(true);
              }
            };
            
            this.hideDefenseRange = () => {
              if (this.defenseRangeIndicator) {
                this.defenseRangeIndicator.setVisible(false);
              }
            };
            
            // Debug texture loading
            this.verifyTextureLoading();
            
            // Add debug renderer
            this.createDebugRenderer();
            
            // Create enemies array first
            this.enemies = [];
            
            // Create background
            this.createBackground();
            
            // Create UI elements
            this.createUI();
            
            // Set up defenses array
            this.defenses = [];
            
            // Initialize defense mode
            this.currentDefenseType = null; // null = not in defense placement mode
            this.toolMode = 'attack'; // Default mode: attack, not plant
            this.pendingDefensePlacement = false;
            this.pendingDefenseType = null;
            
            // Create toolbar for easier selection
            this.createToolbar();
            
            // Create start button
            this.showStartButton();
            
            // Create a planting area indicator
            this.plantingIndicator = this.add.rectangle(0, 0, 32, 32, 0x00FF00, 0.3);
            this.plantingIndicator.setStrokeStyle(2, 0x00FF00);
            this.plantingIndicator.visible = false;
            
            // Create a message to show where planting is allowed
            this.plantingHelpText = this.add.text(200, 50, "Plant crops on the LEFT side only", {
              fontFamily: 'Arial',
              fontSize: '18px',
              color: '#00FF00'
            }).setOrigin(0.5);
            this.plantingHelpText.visible = false;
            
            // Create a global click handler for the main game area
            const gameArea = this.add.rectangle(400, 300, 800, 500, 0, 0);
            gameArea.setInteractive();
            gameArea.on('pointerdown', (pointer) => {
              // Skip if clicking in toolbar area
              if (pointer.y > 520) return;
              
              // Skip if game not active
              if (!this.gameState.isActive) return;
              
              console.log("Game area clicked at", pointer.x, pointer.y, "tool mode:", this.toolMode);
              
              // ATTACK MODE - Check for enemies
              if (this.toolMode === 'attack') {
                const clickedEnemy = this.getEnemyAtPosition(pointer.x, pointer.y);
                if (clickedEnemy) {
                  // Apply damage to the enemy
                  clickedEnemy.takeDamage(this.gameState.clickDamage || 1);
                  
                  // Show attack effect
                  this.showFloatingText(clickedEnemy.x, clickedEnemy.y - 20, 
                    `-${(this.gameState.clickDamage || 1).toFixed(1)}`, 0xFF0000);
                    
                  // Create attack effect
                  this.createClickAttackEffect(clickedEnemy.x, clickedEnemy.y);
                  return;
                }
              }
              
              // CROP PLANTING MODE
              if (this.toolMode === 'plant') {
                if (this.isPointInFarmArea(pointer.x, pointer.y)) {
                  if (this.gameState.farmCoins >= 5) {
                    this.plantCrop(pointer.x, pointer.y);
                  } else {
                    this.showFloatingText(pointer.x, pointer.y, "Need 5 coins!", 0xFF0000);
                  }
                } else {
                  this.showFloatingText(pointer.x, pointer.y, "Plant on LEFT side only!", 0xFF0000);
                }
                return;
              }
              
              // DEFENSE PLACEMENT MODE - For both scarecrow and dog
              if (this.pendingDefensePlacement && this.pendingDefenseType) {
                // Check valid placement area
                if (pointer.x < 200) {
                  this.showFloatingText(pointer.x, pointer.y, "Place on RIGHT side only!", 0xFF0000);
                  return;
                }
                
                // Calculate cost
                const cost = this.pendingDefenseType === 'scarecrow' ? 35 : 50;
                
                // Check if enough coins
                if (this.gameState.farmCoins < cost) {
                  this.showFloatingText(pointer.x, pointer.y, `Need ${cost} coins!`, 0xFF0000);
                  return;
                }
                
                // Place the defense
                if (typeof this.placeDefense === 'function') {
                  // Place defense
                  const defense = this.placeDefense(this.pendingDefenseType, pointer.x, pointer.y);
                  
                  // Show success message and range indicator
                  if (defense) {
                    const defenseName = this.pendingDefenseType === 'scarecrow' ? 'Ice Mage' : 'Fire Mage';
                    const color = this.pendingDefenseType === 'scarecrow' ? 0x0088FF : 0xFF4400;
                    this.showFloatingText(pointer.x, pointer.y - 30, `${defenseName} placed!`, color);
                    
                    // Create range visual effect
                    const range = this.pendingDefenseType === 'scarecrow' ? 250 : 200;
                    const rangeEffect = this.add.circle(pointer.x, pointer.y, range, color, 0.2);
                    rangeEffect.setStrokeStyle(2, color);
                    this.tweens.add({
                      targets: rangeEffect,
                      alpha: 0,
                      scale: 1.2,
                      duration: 1500,
                      onComplete: () => rangeEffect.destroy()
                    });
                    
                    // Deduct cost
                    this.updateFarmCoins(-cost);
                  }
                  
                  // Reset flags
                  this.pendingDefensePlacement = false;
                  this.pendingDefenseType = null;
                  
                  // Return to attack mode
                  this.setToolMode('attack');
                  
                  // Hide placement indicator
                  this.plantingIndicator.visible = false;
                  this.plantingHelpText.visible = false;
                } else {
                  console.error("placeDefense method is not defined");
                  this.showFloatingText(pointer.x, pointer.y, "Can't place defense - error!", 0xFF0000);
                }
                return;
              }
            });
            
            // Add pointer move handler for planting indicator
            this.input.on('pointermove', (pointer) => {
              // Skip if clicking in toolbar area
              if (pointer.y > 520) {
                this.plantingIndicator.visible = false;
                this.plantingHelpText.visible = false;
                return;
              }
              
              if (this.gameState && this.gameState.isActive) {
                if (this.toolMode === 'plant') {
                  // Crop planting mode
                  this.showCropPlacementIndicator(pointer);
                } else if (this.pendingDefensePlacement) {
                  // Defense placement mode
                  this.showDefensePlacementIndicator(pointer, this.pendingDefenseType);
                } else {
                  // Attack mode - hide indicators
                  this.plantingIndicator.visible = false;
                  this.plantingHelpText.visible = false;
                }
              }
            });
            
            // Add helper functions
            this.addHelperFunctions();
            
            // Initialize the upgrade system
            if (this.UpgradeClass) {
              this.upgradeSystem = new this.UpgradeClass(this);
              this.upgradeSystem.createUI();
            } else {
              console.error("UpgradeClass not available");
            }
            
            // Add keyboard handling for special attacks
            this.input.keyboard.on('keydown-S', () => {
              this.triggerSpecialAttack();
            });
            
            // Add right-click handler for special attacks
            this.input.on('pointerdown', (pointer) => {
              if (pointer.rightButtonDown()) {
                this.triggerSpecialAttack();
              }
            });
            
            console.log("GameScene created successfully");
          } catch (error) {
            console.error("Error in GameScene create:", error);
            throw error;
          }
        }
        
        createBackground() {
          try {
            console.log("Creating background...");
            
            // Define grid cell size for the game
            this.gridCellSize = 32;
            
            // Create a dark green background base
            const bg = this.add.rectangle(400, 300, 800, 600, 0x1a4d1a).setOrigin(0.5);
            
            // Create the farm area (left side)
            const farmArea = this.add.container(0, 0);
            for (let y = 0; y < 600; y += this.gridCellSize) {
              for (let x = 0; x < 200; x += this.gridCellSize) {
                // Create soil pattern using pixel art tiles
                const soilTile = this.add.image(
                  x + this.gridCellSize/2, 
                  y + this.gridCellSize/2,
                  Math.random() > 0.5 ? 'soil1' : 'soil2'
                ).setDisplaySize(this.gridCellSize, this.gridCellSize);
                farmArea.add(soilTile);
              }
            }
            
            // Create defense area (right side)
            const defenseArea = this.add.container(200, 0);
            for (let y = 0; y < 600; y += this.gridCellSize) {
              for (let x = 0; x < 600; x += this.gridCellSize) {
                // Create grass pattern using pixel art tiles
                const grassTile = this.add.image(
                  x + this.gridCellSize/2, 
                  y + this.gridCellSize/2,
                  Math.random() > 0.5 ? 'grass1' : 'grass2'
                ).setDisplaySize(this.gridCellSize, this.gridCellSize);
                defenseArea.add(grassTile);
              }
            }
            
            // Add farm buildings and decorations (left side)
            // Add a farmhouse
            const farmhouse = this.add.image(100, 150, 'house1').setDisplaySize(80, 80);
            farmArea.add(farmhouse);
            
            // Add a barn
            const barn = this.add.image(50, 250, 'house2').setDisplaySize(70, 70);
            farmArea.add(barn);
            
            // Add fruit trees around the farm
            const fruitTree1 = this.add.image(30, 100, 'fruitTree1').setDisplaySize(60, 60);
            farmArea.add(fruitTree1);
            
            const fruitTree2 = this.add.image(150, 80, 'fruitTree2').setDisplaySize(50, 50);
            farmArea.add(fruitTree2);
            
            // Add decorative elements to the farm
            const decor1 = this.add.image(40, 180, 'decor1').setDisplaySize(30, 30);
            farmArea.add(decor1);
            
            const decor2 = this.add.image(120, 200, 'decor2').setDisplaySize(25, 25);
            farmArea.add(decor2);
            
            // Add defense area decorations (right side)
            // Add trees around the defense area
            const tree1 = this.add.image(250, 100, 'tree1').setDisplaySize(70, 70);
            defenseArea.add(tree1);
            
            const tree2 = this.add.image(700, 150, 'tree2').setDisplaySize(60, 60);
            defenseArea.add(tree2);
            
            const tree3 = this.add.image(600, 80, 'tree3').setDisplaySize(65, 65);
            defenseArea.add(tree3);
            
            // Add flower trees for decoration
            const flowerTree1 = this.add.image(350, 120, 'flowerTree1').setDisplaySize(55, 55);
            defenseArea.add(flowerTree1);
            
            const flowerTree2 = this.add.image(500, 100, 'flowerTree2').setDisplaySize(50, 50);
            defenseArea.add(flowerTree2);
            
            // Add decorative elements to the defense area
            const decor3 = this.add.image(300, 200, 'decor3').setDisplaySize(30, 30);
            defenseArea.add(decor3);
            
            const decor4 = this.add.image(450, 180, 'decor4').setDisplaySize(25, 25);
            defenseArea.add(decor4);
            
            const decor5 = this.add.image(550, 220, 'decor5').setDisplaySize(35, 35);
            defenseArea.add(decor5);
            
            const decor6 = this.add.image(650, 250, 'decor6').setDisplaySize(30, 30);
            defenseArea.add(decor6);
            
            // Add shadows for depth
            const shadow1 = this.add.image(100, 170, 'shadow1').setDisplaySize(40, 20).setAlpha(0.5);
            farmArea.add(shadow1);
            
            const shadow2 = this.add.image(250, 120, 'shadow2').setDisplaySize(50, 25).setAlpha(0.5);
            defenseArea.add(shadow2);
            
            // Add tower placement indicators using pixel art
            for (let y = 100; y < 500; y += 100) {
              for (let x = 250; x < 750; x += 100) {
                // Skip placement if there's a tree or decoration nearby
                if ((x > 230 && x < 270 && y > 80 && y < 120) || // Near tree1
                    (x > 680 && x < 720 && y > 130 && y < 170) || // Near tree2
                    (x > 580 && x < 620 && y > 60 && y < 100) || // Near tree3
                    (x > 330 && x < 370 && y > 100 && y < 140) || // Near flowerTree1
                    (x > 480 && x < 520 && y > 80 && y < 120)) { // Near flowerTree2
                  continue;
                }
                
                const towerPlace = this.add.image(x, y, 
                  Math.random() > 0.5 ? 'towerPlace1' : 'towerPlace2'
                ).setDisplaySize(48, 48).setAlpha(0.7);
                defenseArea.add(towerPlace);
              }
            }
            
            // Add farm area indicator with a more natural look
            this.farmArea = this.add.rectangle(100, 300, 180, 600, 0x2d572d, 0.2);
            this.farmArea.setStrokeStyle(3, 0x3a6b3a);
            
            // Add subtle grid lines
            for (let i = 0; i <= 25; i++) {
              // Horizontal lines
              const hLine = this.add.line(0, i * this.gridCellSize, 0, 0, 800, 0, 0x3a6b3a, 0.2);
              hLine.setLineWidth(1);
              
              // Vertical lines
              const vLine = this.add.line(i * this.gridCellSize, 0, 0, 0, 0, 600, 0x3a6b3a, 0.2);
              vLine.setLineWidth(1);
            }
            
            // Add border around the game area
            const border = this.add.rectangle(400, 300, 800, 600, 0x000000, 0);
            border.setStrokeStyle(4, 0x2d572d);
            
            // Add game title with pixel art style - moved to top of screen and made smaller
            this.add.text(400, 10, "NOOTER'S FARM DEFENSE", {
              fontFamily: 'monospace',
              fontSize: '20px',
              color: '#4a8f4a',
              fontWeight: 'bold',
              stroke: '#2d572d',
              strokeThickness: 3,
              shadow: { color: '#000000', blur: 5, stroke: true, fill: true }
            }).setOrigin(0.5, 0);
            
            console.log("Background created successfully");
          } catch (error) {
            console.error("Error creating background:", error);
            throw error;
          }
        }
        
        createUI() {
          try {
            console.log("Creating UI");
            // Create basic UI elements - moved to top corners to avoid gameplay interference
            this.scoreText = this.add.text(10, 10, "Score: 0", { 
              color: "#ffffff",
              fontSize: '14px',
              backgroundColor: '#000000',
              padding: { x: 5, y: 2 }
            });
            
            this.livesText = this.add.text(10, 30, "Lives: 3", { 
              color: "#ffffff",
              fontSize: '14px',
              backgroundColor: '#000000',
              padding: { x: 5, y: 2 }
            });
            
            this.waveText = this.add.text(10, 50, "Wave: 0", { 
              color: "#ffffff",
              fontSize: '14px',
              backgroundColor: '#000000',
              padding: { x: 5, y: 2 }
            });
            
            this.farmCoinsText = this.add.text(10, 70, "Coins: 0", { 
              color: "#ffff00",
              fontSize: '14px',
              backgroundColor: '#000000',
              padding: { x: 5, y: 2 }
            });
            
            // Add keyboard shortcuts
            this.input.keyboard.on('keydown-P', () => {
              // Set tool mode to plant
              this.setToolMode('plant');
            });
            
            this.input.keyboard.on('keydown-ONE', () => {
              // Set tool mode to scarecrow
              this.setToolMode('scarecrow');
            });
            
            this.input.keyboard.on('keydown-TWO', () => {
              // Set tool mode to dog
              this.setToolMode('dog');
            });
            
            this.input.keyboard.on('keydown-ESC', () => {
              // Reset to attack mode
              this.setToolMode('attack');
              this.pendingDefensePlacement = false; // Cancel placement on ESC
            });
            
            // Add special attack instructions
            this.specialAttackText = this.add.text(400, 20, "Press 'S' or Right-Click near a mage to use Special Attack", {
              fontFamily: 'Arial',
              fontSize: '14px',
              color: '#FFFFFF',
              stroke: '#000000',
              strokeThickness: 3
            }).setOrigin(0.5);
            this.specialAttackText.setDepth(400);
            
            // Make it pulse to draw attention
            this.tweens.add({
              targets: this.specialAttackText,
              alpha: 0.7,
              duration: 1000,
              yoyo: true,
              repeat: -1
            });
          } catch (error) {
            console.error("Error creating UI:", error);
          }
        }
        
        setupInputHandlers() {
          try {
            console.log("Setting up input handlers");
            
            // Create a global click handler for the main game area
            const gameArea = this.add.rectangle(400, 300, 800, 500, 0, 0);
            gameArea.setInteractive();
            gameArea.on('pointerdown', (pointer) => {
              // Skip if clicking in toolbar area
              if (pointer.y > 520) return;
              
              // Skip if game not active
              if (!this.gameState.isActive) return;
              
              console.log("Game area clicked at", pointer.x, pointer.y, "tool mode:", this.toolMode);
              
              // ATTACK MODE - Check for enemies
              if (this.toolMode === 'attack') {
                const clickedEnemy = this.getEnemyAtPosition(pointer.x, pointer.y);
                if (clickedEnemy) {
                  // Apply damage to the enemy
                  clickedEnemy.takeDamage(this.gameState.clickDamage || 1);
                  
                  // Show attack effect
                  this.showFloatingText(clickedEnemy.x, clickedEnemy.y - 20, 
                    `-${(this.gameState.clickDamage || 1).toFixed(1)}`, 0xFF0000);
                    
                  // Create attack effect
                  this.createClickAttackEffect(clickedEnemy.x, clickedEnemy.y);
                  return;
                }
              }
              
              // CROP PLANTING MODE
              if (this.toolMode === 'plant') {
                if (this.isPointInFarmArea(pointer.x, pointer.y)) {
                  if (this.gameState.farmCoins >= 5) {
                    this.plantCrop(pointer.x, pointer.y);
                  } else {
                    this.showFloatingText(pointer.x, pointer.y, "Need 5 coins!", 0xFF0000);
                  }
                } else {
                  this.showFloatingText(pointer.x, pointer.y, "Plant on LEFT side only!", 0xFF0000);
                }
                return;
              }
              
              // DEFENSE PLACEMENT MODE - For both scarecrow and dog
              if (this.pendingDefensePlacement && this.pendingDefenseType) {
                // Check valid placement area
                if (pointer.x < 200) {
                  this.showFloatingText(pointer.x, pointer.y, "Place on RIGHT side only!", 0xFF0000);
                  return;
                }
                
                // Calculate cost
                const cost = this.pendingDefenseType === 'scarecrow' ? 35 : 50;
                
                // Check if enough coins
                if (this.gameState.farmCoins < cost) {
                  this.showFloatingText(pointer.x, pointer.y, `Need ${cost} coins!`, 0xFF0000);
                  return;
                }
                
                // Place the defense
                if (typeof this.placeDefense === 'function') {
                  // Place defense
                  const defense = this.placeDefense(this.pendingDefenseType, pointer.x, pointer.y);
                  
                  // Show success message and range indicator
                  if (defense) {
                    const defenseName = this.pendingDefenseType === 'scarecrow' ? 'Ice Mage' : 'Fire Mage';
                    const color = this.pendingDefenseType === 'scarecrow' ? 0x0088FF : 0xFF4400;
                    this.showFloatingText(pointer.x, pointer.y - 30, `${defenseName} placed!`, color);
                    
                    // Create range visual effect
                    const range = this.pendingDefenseType === 'scarecrow' ? 250 : 200;
                    const rangeEffect = this.add.circle(pointer.x, pointer.y, range, color, 0.2);
                    rangeEffect.setStrokeStyle(2, color);
                    this.tweens.add({
                      targets: rangeEffect,
                      alpha: 0,
                      scale: 1.2,
                      duration: 1500,
                      onComplete: () => rangeEffect.destroy()
                    });
                    
                    // Deduct cost
                    this.updateFarmCoins(-cost);
                  }
                  
                  // Reset flags
                  this.pendingDefensePlacement = false;
                  this.pendingDefenseType = null;
                  
                  // Return to attack mode
                  this.setToolMode('attack');
                  
                  // Hide placement indicator
                  this.plantingIndicator.visible = false;
                  this.plantingHelpText.visible = false;
                } else {
                  console.error("placeDefense method is not defined");
                  this.showFloatingText(pointer.x, pointer.y, "Can't place defense - error!", 0xFF0000);
                }
                return;
              }
            });
            
            // Add pointer move handler for planting indicator
            this.input.on('pointermove', (pointer) => {
              // Skip if clicking in toolbar area
              if (pointer.y > 520) {
                this.plantingIndicator.visible = false;
                this.plantingHelpText.visible = false;
                return;
              }
              
              if (this.gameState && this.gameState.isActive) {
                if (this.toolMode === 'plant') {
                  // Crop planting mode
                  this.showCropPlacementIndicator(pointer);
                } else if (this.pendingDefensePlacement) {
                  // Defense placement mode
                  this.showDefensePlacementIndicator(pointer, this.pendingDefenseType);
                } else {
                  // Attack mode - hide indicators
                  this.plantingIndicator.visible = false;
                  this.plantingHelpText.visible = false;
                }
              }
            });
          } catch (error) {
            console.error("Error setting up input handlers:", error);
          }
        }
        
        // Create visual effect for click attack
        createClickAttackEffect(x, y) {
          try {
            // Create a burst effect
            const burst = this.add.circle(x, y, 10, 0xFF0000, 0.7);
            burst.setStrokeStyle(2, 0xFFFFFF);
            
            // Animate the burst
            this.tweens.add({
              targets: burst,
              scale: 2,
              alpha: 0,
              duration: 300,
              onComplete: () => burst.destroy()
            });
            
            // Add some sparkles
            for (let i = 0; i < 6; i++) {
              const angle = Math.random() * Math.PI * 2;
              const distance = 15 + Math.random() * 10;
              const sparkX = x + Math.cos(angle) * distance;
              const sparkY = y + Math.sin(angle) * distance;
              
              const spark = this.add.circle(sparkX, sparkY, 2, 0xFFFFFF, 1);
              
              this.tweens.add({
                targets: spark,
                x: sparkX + Math.cos(angle) * 10,
                y: sparkY + Math.sin(angle) * 10,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => spark.destroy()
              });
            }
          } catch (error) {
            console.error("Error creating click attack effect:", error);
          }
        }
        
        // Add a new method to update placement preview
        updatePlacementPreview(pointer) {
          try {
            // Skip if game is inactive
            if (!this.gameState.isActive) return;
            
            // For crop planting preview
            if (this.toolMode === 'plant') {
              // Check if in valid farm area
              const isValidPosition = this.isPointInFarmArea(pointer.x, pointer.y);
              
              // Calculate grid position
              const gridCellSize = this.gridCellSize || 32;
              const gridX = Math.floor(pointer.x / gridCellSize) * gridCellSize + (gridCellSize / 2);
              const gridY = Math.floor(pointer.y / gridCellSize) * gridCellSize + (gridCellSize / 2);
              
              // Highlight the target cell
              if (!this.placementPreview) {
                this.placementPreview = this.add.rectangle(gridX, gridY, gridCellSize, gridCellSize, 
                  isValidPosition ? 0x00FF00 : 0xFF0000, 0.3);
              } else {
                this.placementPreview.x = gridX;
                this.placementPreview.y = gridY;
                this.placementPreview.fillColor = isValidPosition ? 0x00FF00 : 0xFF0000;
                this.placementPreview.setVisible(true);
              }
            }
            
            // For defense placement preview
            else if (this.toolMode === 'scarecrow' || this.toolMode === 'dog') {
              // Check if position is valid (right side)
              const isValidPosition = pointer.x >= 200;
              
              // Update range circle position and color
              if (this.placementCircle) {
                this.placementCircle.x = pointer.x;
                this.placementCircle.y = pointer.y;
                this.placementCircle.setStrokeStyle(2, 
                  isValidPosition ? 
                  (this.toolMode === 'scarecrow' ? 0x0088FF : 0xFF4400) : 
                  0xFF0000);
                this.placementCircle.setVisible(true);
              }
              
              // Show defense preview sprite if it doesn't exist
              const spriteKey = this.toolMode === 'scarecrow' ? 'ABS_idle' : 'NOOT_idle';
              if (!this.defensePreview && this.textures.exists(spriteKey)) {
                this.defensePreview = this.add.image(pointer.x, pointer.y, spriteKey);
                this.defensePreview.setDisplaySize(48, 48);
                this.defensePreview.setAlpha(0.7);
              } 
              // Update existing preview
              else if (this.defensePreview) {
                this.defensePreview.x = pointer.x;
                this.defensePreview.y = pointer.y;
                this.defensePreview.setTexture(spriteKey);
                this.defensePreview.setVisible(true);
                this.defensePreview.setAlpha(isValidPosition ? 0.7 : 0.4);
              }
            }
          } catch (error) {
            console.error("Error updating placement preview:", error);
          }
        }
        
        // Helper method to detect clicked enemies
        getEnemyAtPosition(x, y) {
          if (!this.enemies || !Array.isArray(this.enemies)) return null;
          
          // Increase click radius for easier enemy selection
          const clickRadius = 40; // Larger radius makes it easier to click enemies
          
          // Find the first enemy that contains the point
          for (const enemy of this.enemies) {
            // Skip inactive enemies
            if (!enemy || !enemy.active) continue;
            
            // Get enemy position
            const enemyX = enemy.x || (enemy.container && enemy.container.x) || (enemy.sprite && enemy.sprite.x);
            const enemyY = enemy.y || (enemy.container && enemy.container.y) || (enemy.sprite && enemy.sprite.y);
            
            if (!enemyX || !enemyY) continue;
            
            // Check distance
            const dx = x - enemyX;
            const dy = y - enemyY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= clickRadius) {
              return enemy;
            }
          }
          
          return null;
        }
        
        // Helper method to check if point is in farm area (left side)
        isPointInFarmArea(x, y) {
          // Farm area is the left portion of the screen (first 200 pixels)
          return x < 200 && y < 520;
        }
        
        // Plant a crop at specified position
        plantCrop(x, y) {
          try {
            // Make sure gridCellSize is defined
            if (!this.gridCellSize) {
              this.gridCellSize = 32; // Default if not set
              console.log("Setting default gridCellSize to 32");
            }
            
            console.log("Attempting to plant crop at:", x, y);
            
            // Calculate grid position
            const gridX = Math.floor(x / this.gridCellSize) * this.gridCellSize + (this.gridCellSize / 2);
            const gridY = Math.floor(y / this.gridCellSize) * this.gridCellSize + (this.gridCellSize / 2);
            const gridKey = `${gridX},${gridY}`;
            
            console.log("Grid position:", gridX, gridY, "Grid key:", gridKey);
            
            // Initialize crops object if it doesn't exist
            if (!this.crops) {
              this.crops = {};
              console.log("Initializing crops object");
            }
            
            // Check if position is already occupied
            if (this.crops[gridKey]) {
              console.log("Position already occupied");
              return;
            }
            
            // Check if we have enough coins
            if (this.gameState.farmCoins < 5) {
              console.log("Not enough coins to plant crop");
              this.showFloatingText(x, y, "Need 5 coins!", 0xFF0000);
              return;
            }
            
            // Deduct coins
            this.updateFarmCoins(-5);
            
            // Get the Crop class from registry
            const CropClass = this.registry.get('CropClass');
            console.log("CropClass from registry:", !!CropClass);
            
            // IMPORTANT: Always use trees as crops - NEVER change this!
            // These are fixed to Fruit_tree3 and Moss_tree3 in the Crop class
            const cropType = 'tree';
            console.log(`Using tree as crop type (using Fruit_tree3/Moss_tree3 textures)`);
            
            if (CropClass) {
              try {
                console.log("Creating new crop instance at", gridX, gridY);
                const crop = new CropClass(this, gridX, gridY, cropType);
                this.crops[gridKey] = crop;
                console.log("Crop planted at:", gridX, gridY);
                this.showFloatingText(gridX, gridY, "+", 0x00FF00);
              } catch (cropError) {
                console.error("Error creating crop instance:", cropError);
                this.updateFarmCoins(5); // Refund coins if crop creation fails
              }
            } else {
              console.error("CropClass not found in registry");
              this.updateFarmCoins(5); // Refund coins if CropClass is missing
              
              // Try to load the Crop class directly as a fallback
              import('../entities/Crop').then(module => {
                if (module && module.default) {
                  console.log("Loaded Crop class directly");
                  try {
                    const crop = new module.default(this, gridX, gridY, cropType);
                    this.crops[gridKey] = crop;
                    console.log("Crop planted using direct import");
                  } catch (directError) {
                    console.error("Error creating crop with direct import:", directError);
                  }
                }
              }).catch(error => {
                console.error("Failed to load Crop class directly:", error);
              });
            }
          } catch (error) {
            console.error("Error planting crop:", error);
            // Refund coins on error
            this.updateFarmCoins(5);
          }
        }
        
        // Show floating text that fades up and out
        showFloatingText(x, y, message, color = 0xFFFFFF) {
          try {
            const text = this.add.text(x, y, message, {
              fontFamily: 'Arial',
              fontSize: '16px',
              color: '#' + color.toString(16).padStart(6, '0')
            }).setOrigin(0.5);
            
            // Animate the text
            this.tweens.add({
              targets: text,
              y: y - 50,
              alpha: 0,
              duration: 1500,
              onComplete: () => text.destroy()
            });
          } catch (error) {
            console.error("Error showing floating text:", error);
          }
        }
        
        showStartButton() {
          try {
            console.log("Showing start button");
            
            // Create a button to start the game
            this.startButton = this.add.rectangle(400, 300, 200, 50, 0xFFFFFF);
            this.startText = this.add.text(400, 300, "Start Game", {
              fontFamily: 'Arial',
              fontSize: '18px',
              color: '#000000'
            }).setOrigin(0.5);
            
            // Make the button interactive - ensure it has proper depth
            this.startButton.setInteractive();
            this.startButton.setDepth(1000);
            this.startText.setDepth(1001);
            
            // Add click handler directly to both rectangle and text
            this.startButton.on('pointerdown', () => {
              console.log("Start button clicked (rectangle)");
              this.startGame();
            });
            
            // Also make text interactive as a backup
            this.startText.setInteractive();
            this.startText.on('pointerdown', () => {
              console.log("Start button clicked (text)");
              this.startGame();
            });
            
            // Add hover effect
            this.startButton.on('pointerover', () => {
              this.startButton.fillColor = 0xDDDDDD;
            });
            
            this.startButton.on('pointerout', () => {
              this.startButton.fillColor = 0xFFFFFF;
            });
            
            // Make sure button is prominent
            this.startButton.width = 200;
            this.startButton.height = 60;
            
            // Add a more obvious border
            this.startButton.setStrokeStyle(4, 0x000000);
            
            console.log("Start button created and events attached");
          } catch (error) {
            console.error("Error showing start button:", error);
          }
        }
        
        startGame() {
          try {
            console.log("Start button clicked - starting game");
            
            // Remove start button
            if (this.startButton) {
              this.startButton.destroy();
              this.startText.destroy();
            }
            
            // Set game to active state
            this.gameState.isActive = true;
            this.gameState.wave = 1;
            this.updateWaveText();
            
            // Start first wave
            this.startWave();
            
            // Reset game stats
            this.gameState.score = 0;
            this.gameState.lives = 3;
            this.gameState.clickDamage = 0.5;
            
            // Reset farm coins to 50 to start with
            this.gameState.farmCoins = 50;
            this.updateFarmCoins(0); // Update display
            
            // Reset the upgrade system if it exists
            if (this.upgradeSystem) {
              this.upgradeSystem.destroy();
              this.upgradeSystem = new this.UpgradeClass(this);
              this.upgradeSystem.createUI();
            }
            
            console.log("Game started successfully");
          } catch (error) {
            console.error("Error starting game:", error);
          }
        }
        
        // Update farm coins and UI
        updateFarmCoins(amount) {
          try {
            const currentCoins = this.gameState.farmCoins || 0;
            const newCoins = Math.max(0, currentCoins + amount); // Ensure coins don't go below 0
            this.gameState.farmCoins = newCoins;
            
            // Update registry
            this.registry.set('farmCoins', newCoins);
            
            // Update UI
            if (this.farmCoinsText) {
              this.farmCoinsText.setText(`Coins: ${newCoins}`);
            }
            
            // Call the callback if it exists
            const addFarmCoins = this.registry.get('addFarmCoins');
            if (typeof addFarmCoins === 'function') {
              addFarmCoins(amount);
            }
            
            console.log("Farm coins updated:", newCoins);
          } catch (error) {
            console.error("Error updating farm coins:", error);
          }
        }
        
        // Update score text
        updateScoreText() {
          if (this.scoreText) {
            this.scoreText.setText(`Score: ${this.gameState.score}`);
          }
        }
        
        // Update wave text
        updateWaveText() {
          if (this.waveText) {
            this.waveText.setText(`Wave: ${this.gameState.wave}`);
          }
        }
        
        // Update lives text
        updateLivesText() {
          if (this.livesText) {
            this.livesText.setText(`Lives: ${this.gameState.lives}`);
          }
        }
        
        // Start a new wave of enemies - make waves more difficult over time
        startWave() {
          try {
            // Calculate number of enemies based on wave - increased scaling
            const baseEnemyCount = 3;
            const enemyCountScaling = 3; // Increased from 2
            const enemyCount = baseEnemyCount + (this.gameState.wave * enemyCountScaling);
            
            // Reset wave state
            this.isSpawningEnemies = true;
            this.waveInProgress = true;
            this.enemiesSpawned = 0;
            this.totalEnemiesInWave = enemyCount;
            
            console.log(`Starting wave ${this.gameState.wave} with ${enemyCount} enemies`);
            
            // Start spawning enemies
            this.spawnEnemies();
          } catch (error) {
            console.error("Error starting wave:", error);
          }
        }
        
        // Spawn enemies for the current wave
        spawnEnemies() {
          if (!this.isSpawningEnemies || !this.gameState.isActive) return;
          
          // Get the Enemy class from registry
          const EnemyClass = this.registry.get('EnemyClass');
          
          if (!EnemyClass) {
            console.error("EnemyClass not found in registry");
            return;
          }
          
          // If we've spawned all enemies for this wave, stop spawning
          if (this.enemiesSpawned >= this.totalEnemiesInWave) {
            this.isSpawningEnemies = false;
            console.log(`All ${this.totalEnemiesInWave} enemies spawned for wave ${this.gameState.wave}`);
            return;
          }
          
          // Create a random enemy type
          const enemyTypes = ['rabbit', 'bird'];
          const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
          
          // Calculate spawn position (from the right side) - randomize both X and Y
          const spawnY = Phaser.Math.Between(100, 500);
          const spawnX = Phaser.Math.Between(850, 900); // Randomize X position off-screen
          
          // Add a visual indicator at spawn point (for debugging)
          const spawnIndicator = this.add.circle(spawnX, spawnY, 10, 0xFF0000, 0.7);
          this.time.delayedCall(1000, () => {
            spawnIndicator.destroy();
          });
          
          try {
            // Log texture status
            const textureKey = enemyType === 'bird' ? 'enemy_bird' : 'enemy_rabbit';
            console.log(`Using texture '${textureKey}' for enemy, exists: ${this.textures.exists(textureKey)}`);
            
            // Create the enemy
            const enemy = new EnemyClass(
              this,
              enemyType,
              spawnX,
              spawnY,
              this.gameState.wave // Pass current wave for difficulty scaling
            );
            
            // Add to enemies array
            if (!this.enemies) {
              console.warn("Enemies array not initialized, creating now");
              this.enemies = [];
            }
            
            this.enemies.push(enemy);
            this.enemiesSpawned++;
            
            // Debug: Show enemy count
            console.log(`Spawned ${enemyType} enemy (${this.enemiesSpawned}/${this.totalEnemiesInWave}), total enemies: ${this.enemies.length}`);
            
            // Debug: Force visibility after a short delay
            this.time.delayedCall(100, () => {
              if (enemy.sprite) {
                enemy.sprite.visible = true;
                enemy.sprite.setDepth(100);
                console.log(`Forced visibility for enemy sprite at (${enemy.x}, ${enemy.y})`);
              }
            });
            
            // Schedule next enemy spawn with variable timing
            // Make spawns faster in later waves
            const baseDelay = 2000; // 2 seconds base
            const minDelay = 500; // Minimum 0.5 seconds
            const scaleFactor = 0.8; // 20% reduction per wave
            
            const delay = Math.max(
              minDelay,
              baseDelay * Math.pow(scaleFactor, this.gameState.wave - 1)
            );
            
            // Schedule next spawn
            this.time.delayedCall(delay, () => this.spawnEnemies());
          } catch (error) {
            console.error("Error spawning enemy:", error);
          }
        }
        
        // Force the next wave to start
        forceNextWave() {
          try {
            console.log("Force next wave called");
            
            // Allow forcing next wave even if the current wave is still spawning
            if (this.isSpawningEnemies) {
              console.log("Interrupting current spawning to start next wave");
              this.isSpawningEnemies = false;
              
              // Clear any pending spawn events
              if (this.spawnEvent) {
                this.spawnEvent.remove();
                this.spawnEvent = null;
              }
            }
            
            // End current wave
            this.waveInProgress = false;
            
            // Increase wave counter
            this.gameState.wave++;
            this.updateWaveText();
            
            // Start next wave
            this.startWave();
            
            console.log(`Forced start of wave ${this.gameState.wave}`);
            
            // Show notification
            this.showFloatingText(400, 300, `WAVE ${this.gameState.wave} STARTING!`, 0xFFFF00);
          } catch (error) {
            console.error("Error forcing next wave:", error);
          }
        }
        
        createToolbar() {
          try {
            // Create a larger background for the toolbar to accommodate the attack button
            const toolbarBg = this.add.rectangle(160, 550, 320, 50, 0x333333, 0.8);
            
            // Add attack button
            const attackButton = this.add.rectangle(40, 550, 60, 40, 0xFF4400);
            attackButton.setInteractive();
            attackButton.on('pointerdown', () => {
              this.pendingDefensePlacement = false; // Reset placement flag
              this.setToolMode('attack');
            });
            
            const attackText = this.add.text(40, 550, '👆', {
              fontFamily: 'Arial',
              fontSize: '24px'
            }).setOrigin(0.5);
            
            // Add crop button
            const cropButton = this.add.rectangle(110, 550, 60, 40, 0x006600);
            cropButton.setInteractive();
            cropButton.on('pointerdown', () => {
              this.pendingDefensePlacement = false; // Reset placement flag
              this.setToolMode('plant');
            });
            
            // IMPORTANT: Always use tree images for crops - NEVER change this!
            if (this.textures.exists('Fruit_tree3')) {
              const cropImage = this.add.image(110, 550, 'Fruit_tree3');
              cropImage.setDisplaySize(32, 32);
            } else {
              // Fallback to emoji if image doesn't exist
              const cropText = this.add.text(110, 550, '🌳', {
                fontFamily: 'Arial',
                fontSize: '24px'
              }).setOrigin(0.5);
            }
            
            // Add scarecrow button (ABS mage)
            const scarecrowButton = this.add.rectangle(180, 550, 60, 40, 0x000066);
            scarecrowButton.setInteractive();
            scarecrowButton.on('pointerdown', () => {
              // Select defense without auto-placing
              this.pendingDefenseType = 'scarecrow';
              this.pendingDefensePlacement = true;
              this.setToolMode('scarecrow');
              
              // Show message to indicate selection
              this.showFloatingText(400, 300, "ABS Ice Mage selected - Click map to place", 0x0088FF);
              
              console.log("Scarecrow selected, waiting for placement click");
            });
            
            // Use ABS image instead of emoji
            const absImageKey = 'ABS_idle';
            if (this.textures.exists(absImageKey)) {
              const absImage = this.add.image(180, 550, absImageKey);
              absImage.setDisplaySize(32, 32);
            } else {
              // Fallback to emoji if image doesn't exist
              const scarecrowText = this.add.text(180, 550, '🧙‍♂️', {
                fontFamily: 'Arial',
                fontSize: '24px'
              }).setOrigin(0.5);
            }
            
            // Add dog button (NOOT mage)
            const dogButton = this.add.rectangle(250, 550, 60, 40, 0x660000);
            dogButton.setInteractive();
            dogButton.on('pointerdown', () => {
              // Select defense without auto-placing
              this.pendingDefenseType = 'dog';
              this.pendingDefensePlacement = true;
              this.setToolMode('dog');
              
              // Show message to indicate selection
              this.showFloatingText(400, 300, "NOOT Fire Mage selected - Click map to place", 0xFF4400);
              
              console.log("Dog selected, waiting for placement click");
            });
            
            // Use NOOT image instead of emoji
            const nootImageKey = 'NOOT_idle';
            if (this.textures.exists(nootImageKey)) {
              const nootImage = this.add.image(250, 550, nootImageKey);
              nootImage.setDisplaySize(32, 32);
            } else {
              // Fallback to emoji if image doesn't exist
              const dogText = this.add.text(250, 550, '🧙‍♀️', {
                fontFamily: 'Arial',
                fontSize: '24px'
              }).setOrigin(0.5);
            }
            
            // Add upgrade button
            const upgradeButton = this.add.rectangle(320, 550, 60, 40, 0x555500);
            upgradeButton.setInteractive();
            upgradeButton.on('pointerdown', () => this.toggleUpgradePanel());
            
            const upgradeText = this.add.text(320, 550, '⚙️', {
              fontFamily: 'Arial',
              fontSize: '24px'
            }).setOrigin(0.5);
            
            // Store buttons for reference
            this.toolbarButtons = {
              attack: attackButton, // Add the attack button to the reference object
              plant: cropButton,
              scarecrow: scarecrowButton,
              dog: dogButton,
              upgrade: upgradeButton
            };
            
            // Add costs/labels underneath
            this.add.text(40, 570, 'Attack', {
              fontFamily: 'Arial',
              fontSize: '12px',
              color: '#FFFFFF'
            }).setOrigin(0.5);
            
            this.add.text(110, 570, '5', {
              fontFamily: 'Arial',
              fontSize: '12px',
              color: '#FFFF00'
            }).setOrigin(0.5);
            
            this.add.text(180, 570, '35', {
              fontFamily: 'Arial',
              fontSize: '12px',
              color: '#FFFF00'
            }).setOrigin(0.5);
            
            this.add.text(250, 570, '50', {
              fontFamily: 'Arial',
              fontSize: '12px',
              color: '#FFFF00'
            }).setOrigin(0.5);
            
            // Set initial tool to attack mode
            this.setToolMode('attack');
          } catch (error) {
            console.error("Error creating toolbar:", error);
          }
        }

        // Set the current tool mode (attack, plant, or defense)
        setToolMode(mode) {
          try {
            console.log(`Setting tool mode to: ${mode}`);
            
            // Update tool mode
            this.toolMode = mode;
            
            // Hide range indicators
            this.hideDefenseRange();
            
            // Cancel any existing placement preview
            if (this.placementPreview) {
              this.placementPreview.destroy();
              this.placementPreview = null;
            }
            
            // Hide any existing placement circles
            if (this.placementCircle) {
              this.placementCircle.setVisible(false);
            }
            
            // Reset placement state if switching to attack or plant mode
            if (mode === 'attack' || mode === 'plant') {
              this.pendingDefensePlacement = false;
              
              // Destroy defense preview
              if (this.defensePreview) {
                this.defensePreview.destroy();
                this.defensePreview = null;
              }
            }
            
            // Start showing placement preview if planting or placing defenses
            if (mode === 'plant' || mode === 'scarecrow' || mode === 'dog') {
              // For defenses, show the range circle that follows the cursor
              if (mode === 'scarecrow' || mode === 'dog') {
                const range = mode === 'scarecrow' ? 200 : 150;
                
                // Create circle if it doesn't exist
                if (!this.placementCircle) {
                  this.placementCircle = this.add.circle(0, 0, range, 0xFFFFFF, 0.2);
                  this.placementCircle.setStrokeStyle(2, mode === 'scarecrow' ? 0x0088FF : 0xFF4400);
                }
                
                // Update circle properties
                this.placementCircle.setRadius(range);
                this.placementCircle.setStrokeStyle(2, mode === 'scarecrow' ? 0x0088FF : 0xFF4400);
                this.placementCircle.setVisible(true);
                
                // Make the circle follow the pointer
                this.input.on('pointermove', (pointer) => {
                  if ((this.toolMode === mode || this.pendingDefensePlacement) && this.placementCircle) {
                    this.placementCircle.x = pointer.x;
                    this.placementCircle.y = pointer.y;
                  }
                });
              }
            }
            
            // Update button colors to show active state
            if (this.toolbarButtons) {
              Object.keys(this.toolbarButtons).forEach(key => {
                const isActive = key === mode;
                if (this.toolbarButtons[key]) {
                  this.toolbarButtons[key].fillColor = isActive ? this.getToolColor(key, true) : this.getToolColor(key, false);
                }
              });
            }
            
            // Show info text based on mode
            let infoText = "";
            let textColor = 0xFFFFFF;
            
            switch (mode) {
              case 'attack':
                infoText = "ATTACK MODE: Click on enemies";
                textColor = 0xFF4400;
                break;
              case 'plant':
                infoText = "PLANT MODE: Plant crops (5 coins)";
                textColor = 0x00FF00;
                break;
              case 'scarecrow':
                infoText = "ABS ICE MAGE: Click again to place (35 coins)";
                textColor = 0x0088FF;
                break;
              case 'dog':
                infoText = "NOOT FIRE MAGE: Click again to place (50 coins)";
                textColor = 0xFF8800;
                break;
            }
            
            // Show mode change message in center of screen
            this.showFloatingText(400, 300, infoText, textColor);
            
            console.log(`Tool mode set to: ${mode}`);
          } catch (error) {
            console.error("Error setting tool mode:", error);
          }
        }
        
        // Get color for tool buttons
        getToolColor(tool, isActive) {
          // Default inactive colors
          const colors = {
            attack: 0x660000,
            plant: 0x006600,
            scarecrow: 0x000066,
            dog: 0x660000,
            upgrade: 0x555500
          };
          
          // Active colors are brighter
          const activeColors = {
            attack: 0xFF4400,
            plant: 0x00FF00,
            scarecrow: 0x0088FF,
            dog: 0xFF8800,
            upgrade: 0xFFFF00
          };
          
          return isActive ? (activeColors[tool] || 0xFFFFFF) : (colors[tool] || 0x333333);
        }

        verifyTextureLoading() {
          try {
            // Check if textures are loaded
            const textures = [
              'enemy_bird', 'enemy_rabbit', 'enemy_boss',
              'Fruit_tree3', 'Moss_tree3', 'fireball', 'iceball'
            ];
            
            textures.forEach(texture => {
              if (this.textures.exists(texture)) {
                console.log(`✅ Texture '${texture}' loaded successfully`);
                
                // Debug: show texture at known position
                const debugSprite = this.add.sprite(100 + textures.indexOf(texture) * 50, 100, texture);
                debugSprite.setDisplaySize(32, 32);
                debugSprite.setAlpha(0.5);
                this.time.delayedCall(5000, () => {
                  debugSprite.destroy();
                });
              } else {
                console.error(`❌ Texture '${texture}' NOT FOUND`);
                
                // Create fallback texture if needed
                if (texture === 'fireball') {
                  const fireGraphics = this.make.graphics();
                  fireGraphics.fillStyle(0xFF4400, 1);
                  fireGraphics.fillCircle(16, 16, 16);
                  fireGraphics.fillStyle(0xFF8866, 0.4);
                  fireGraphics.fillCircle(16, 16, 20);
                  fireGraphics.generateTexture('fireball', 40, 40);
                  console.log('Created fallback texture for fireball');
                } else if (texture === 'iceball') {
                  const iceGraphics = this.make.graphics();
                  iceGraphics.fillStyle(0x0088FF, 1);
                  iceGraphics.fillCircle(16, 16, 16);
                  iceGraphics.fillStyle(0x66BBFF, 0.4);
                  iceGraphics.fillCircle(16, 16, 20);
                  iceGraphics.generateTexture('iceball', 40, 40);
                  console.log('Created fallback texture for iceball');
                }
                
                // Create visual indicator for missing texture
                const errorText = this.add.text(100 + textures.indexOf(texture) * 50, 100, '❌', {
                  fontSize: '24px',
                  fontFamily: 'Arial',
                  color: '#FF0000'
                }).setOrigin(0.5);
                this.time.delayedCall(5000, () => {
                  errorText.destroy();
                });
              }
            });
            
            // Add visible debug indicator at spawn position
            const spawnPoint = this.add.circle(850, 300, 10, 0xFF0000);
            spawnPoint.setAlpha(0.7);
            this.time.delayedCall(5000, () => {
              spawnPoint.destroy();
            });
            
          } catch (error) {
            console.error("Error verifying textures:", error);
          }
        }

        addHelperFunctions() {
          // Add the missing isPointInFarmArea function
          this.isPointInFarmArea = (x, y) => {
            // Farm area is on the left side (x < 200)
            return x < 200 && y < 520;
          };
          
          // Add the missing showCropPlacementIndicator function
          this.showCropPlacementIndicator = (pointer) => {
            // Calculate grid position for placement
            const gridX = Math.floor(pointer.x / this.gridCellSize) * this.gridCellSize + (this.gridCellSize / 2);
            const gridY = Math.floor(pointer.y / this.gridCellSize) * this.gridCellSize + (this.gridCellSize / 2);
            
            // Check if position is in farm area (left side)
            const canPlantHere = this.isPointInFarmArea(pointer.x, pointer.y);
            
            // Show planting indicator
            this.plantingIndicator.x = gridX;
            this.plantingIndicator.y = gridY;
            this.plantingIndicator.visible = true;
            
            // Change color based on whether planting is allowed
            if (canPlantHere) {
              this.plantingIndicator.setStrokeStyle(2, 0x00FF00);
              this.plantingIndicator.fillColor = 0x00FF00;
              this.plantingIndicator.alpha = 0.3;
              this.plantingHelpText.visible = false;
            } else {
              this.plantingIndicator.setStrokeStyle(2, 0xFF0000);
              this.plantingIndicator.fillColor = 0xFF0000;
              this.plantingIndicator.alpha = 0.3;
              this.plantingHelpText.visible = true;
              this.plantingHelpText.setText("Plant crops on the LEFT side only");
            }
          };
          
          // Add the missing showDefensePlacementIndicator function
          this.showDefensePlacementIndicator = (pointer, defenseType) => {
            // Calculate grid position for placement
            const gridX = Math.floor(pointer.x / this.gridCellSize) * this.gridCellSize + (this.gridCellSize / 2);
            const gridY = Math.floor(pointer.y / this.gridCellSize) * this.gridCellSize + (this.gridCellSize / 2);
            
            // Check if position is in defense area (right side)
            const canPlaceDefense = pointer.x >= 200 && pointer.y < 520;
            
            // Show placement indicator
            this.plantingIndicator.x = gridX;
            this.plantingIndicator.y = gridY;
            this.plantingIndicator.visible = true;
            
            // Change color based on whether defense placement is allowed
            if (canPlaceDefense) {
              this.plantingIndicator.setStrokeStyle(2, 0x0000FF);
              this.plantingIndicator.fillColor = 0x0000FF;
              this.plantingIndicator.alpha = 0.3;
              this.plantingHelpText.visible = false;
              
              // Show defense range if applicable
              if (defenseType === 'scarecrow') {
                this.showDefenseRange(gridX, gridY, 150);  // ABS mage range: 150
              } else if (defenseType === 'dog') {
                this.showDefenseRange(gridX, gridY, 100);  // NOOT mage range: 100
              }
            } else {
              this.plantingIndicator.setStrokeStyle(2, 0xFF0000);
              this.plantingIndicator.fillColor = 0xFF0000;
              this.plantingIndicator.alpha = 0.3;
              this.plantingHelpText.visible = true;
              this.plantingHelpText.setText("Place defenses on the RIGHT side only");
              
              // Hide range indicator if showing
              this.hideDefenseRange();
            }
          };
          
          // Show a circular range indicator for defenses
          this.showDefenseRange = (x, y, radius) => {
            // Create the range indicator if it doesn't exist
            if (!this.defenseRangeIndicator) {
              this.defenseRangeIndicator = this.add.circle(x, y, radius, 0xFFFFFF, 0.1);
              this.defenseRangeIndicator.setStrokeStyle(2, 0x0000FF);
            } else {
              // Update existing indicator
              this.defenseRangeIndicator.setPosition(x, y);
              this.defenseRangeIndicator.setRadius(radius);
              this.defenseRangeIndicator.setVisible(true);
            }
          };
          
          // Hide the range indicator
          this.hideDefenseRange = () => {
            if (this.defenseRangeIndicator) {
              this.defenseRangeIndicator.setVisible(false);
            }
          };
          
          // Add the missing placeDefense function
          this.placeDefense = (defenseType, x, y) => {
            console.log(`Attempting to place ${defenseType} at ${x},${y}`);
            
            // Check if position is valid (right side of screen)
            if (x < 200) {
              this.showFloatingText(x, y, "Place on RIGHT side only!", 0xFF0000);
              return;
            }
            
            // Calculate cost based on defense type
            const cost = defenseType === 'scarecrow' ? 35 : 50;
            
            // Check if player has enough coins
            if (this.gameState.farmCoins < cost) {
              this.showFloatingText(x, y, `Need ${cost} coins!`, 0xFF0000);
              return;
            }
            
            // Add Defense class from registry
            const DefenseClass = this.registry.get('DefenseClass');
            
            if (!DefenseClass) {
              console.error("Defense class not available");
              return;
            }
            
            // Create defense - handle upgrades in the Defense constructor
            const defense = new DefenseClass(this, defenseType, x, y);
            
            // Add to defenses array
            if (!this.defenses) {
              this.defenses = [];
            }
            this.defenses.push(defense);
            
            // Deduct cost
            this.updateFarmCoins(-cost);
            
            // Show success message
            const defenseName = defenseType === 'scarecrow' ? 'ABS ice mage' : 'NOOT fire mage';
            this.showFloatingText(x, y, `${defenseName} placed!`, 0x00FFFF);
            
            console.log(`Defense ${defenseType} placed at ${x},${y}`);
          };
        }

        createDebugRenderer() {
          // Create a debug graphics object
          this.debugGraphics = this.add.graphics();
          this.debugGraphics.setDepth(5000); // Very high depth to ensure visibility
          
          // Create a toggle for debug mode - default OFF
          this.debugMode = false;
          
          // Add keyboard shortcut to toggle debug mode 
          this.input.keyboard.on('keydown-D', () => {
            this.debugMode = !this.debugMode;
            this.debugGraphics.clear();
            console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
          });
          
          // Add test enemy shortcut (T key)
          this.input.keyboard.on('keydown-T', () => {
            this.createTestEnemy();
          });
          
          // Add update callback
          this.events.on('postupdate', this.updateDebugGraphics, this);
        }
        
        createTestEnemy() {
          console.log("Creating test enemy");
          
          try {
            // Get enemy class
            const EnemyClass = this.registry.get('EnemyClass');
            
            if (!EnemyClass) {
              console.error("EnemyClass not found in registry");
              return;
            }
            
            // Create directly in the middle of the game for maximum visibility
            const enemy = new EnemyClass(
              this,
              Math.random() > 0.5 ? 'bird' : 'rabbit',
              400, // x - middle of screen
              300, // y - middle of screen
              1 // wave
            );
            
            // Initialize enemies array if needed
            if (!this.enemies) {
              this.enemies = [];
            }
            
            // Add to enemies array
            this.enemies.push(enemy);
            
            console.log(`Created test enemy at 400,300 - total enemies: ${this.enemies.length}`);
            
            // Force visibility
            if (enemy.container) {
              enemy.container.setAlpha(1);
              enemy.container.visible = true;
              enemy.container.setDepth(1000);
            }
            
            // No visual indicator
          } catch (error) {
            console.error("Error creating test enemy:", error);
          }
        }
        
        updateDebugGraphics() {
          if (!this.debugMode) return;
          
          // Clear previous debug graphics
          this.debugGraphics.clear();
          
          // Draw stage boundaries
          this.debugGraphics.lineStyle(2, 0xFF00FF, 0.8);
          this.debugGraphics.strokeRect(0, 0, 800, 600);
          
          // Draw farm/defense boundary
          this.debugGraphics.lineStyle(2, 0x00FFFF, 0.6);
          this.debugGraphics.moveTo(200, 0);
          this.debugGraphics.lineTo(200, 600);
          
          // Draw spawn line
          this.debugGraphics.lineStyle(2, 0xFF0000, 0.6);
          this.debugGraphics.moveTo(850, 0);
          this.debugGraphics.lineTo(850, 600);
          
          // Draw enemy positions but without the yellow circles
          if (this.enemies && this.enemies.length > 0) {
            this.enemies.forEach(enemy => {
              // Skip invalid enemies
              if (!enemy || !enemy.active) return;
              
              // Only draw direction indicator (no circles)
              this.debugGraphics.lineStyle(1, 0x00FF00, 0.4);
              this.debugGraphics.moveTo(enemy.x, enemy.y);
              this.debugGraphics.lineTo(enemy.x - 20, enemy.y);
            });
            
            // Print enemy count
            if (this.enemies.length > 0) {
              const text = `Enemies: ${this.enemies.length}`;
              // Debug overlay text
              if (!this.debugText) {
                this.debugText = this.add.text(20, 580, text, {
                  font: '14px Arial',
                  fill: '#FFFF00',
                  backgroundColor: '#000000'
                }).setDepth(5001);
              } else {
                this.debugText.setText(text);
              }
            }
          }
        }

        update(time, delta) {
          try {
            // Skip if game is inactive or if an update is already in progress
            if (!this.gameState || !this.gameState.isActive || isUpdating) {
              return;
            }
            
            // Set flag to prevent recursive updates
            isUpdating = true;
            
            // CRITICAL FIX: Ensure all enemies are active and can be targeted
            if (this.enemies && this.enemies.length > 0) {
              this.enemies.forEach(enemy => {
                if (enemy) {
                  // Force enemy to be active
                  enemy.active = true;
                  enemy.visible = true;
                  
                  // Ensure enemy has proper position if missing
                  if (typeof enemy.x !== 'number' || typeof enemy.y !== 'number') {
                    if (enemy.container) {
                      enemy.x = enemy.container.x;
                      enemy.y = enemy.container.y;
                    } else if (enemy.sprite) {
                      enemy.x = enemy.sprite.x;
                      enemy.y = enemy.sprite.y;
                    }
                  }
                }
              });
            }
            
            // CRITICAL FIX: Update all projectiles
            if (this.projectiles && this.projectiles.length > 0) {
              // Create a copy of the array to safely modify during iteration
              const projectilesToUpdate = [...this.projectiles];
              
              // Update each projectile
              projectilesToUpdate.forEach(projectile => {
                if (projectile && typeof projectile.update === 'function') {
                  try {
                    // Call the projectile's update method with delta time
                    projectile.update(delta / 1000); // Convert to seconds if needed by some projectiles
                  } catch (error) {
                    console.error("Error updating projectile:", error);
                    // Clean up errored projectile
                    if (projectile.destroy) {
                      projectile.destroy();
                    }
                  }
                } else if (projectile) {
                  // If no update method but has movement properties, apply basic movement
                  if (typeof projectile.vx === 'number' && typeof projectile.vy === 'number') {
                    projectile.x += projectile.vx;
                    projectile.y += projectile.vy;
                    
                    // Basic cleanup if offscreen
                    if (projectile.x < 0 || projectile.x > 800 || projectile.y < 0 || projectile.y > 600) {
                      projectile.destroy();
                    }
                  }
                }
              });
              
              // Clean up the projectiles array to remove destroyed objects
              this.projectiles = this.projectiles.filter(p => p && p.active !== false);
            }
            
            // CRITICAL FIX: Make clickable enemies more responsive
            if (this.enemies && this.enemies.length > 0) {
              this.enemies.forEach(enemy => {
                if (enemy && enemy.container) {
                  // Ensure container is interactive with large hit area
                  enemy.container.setSize(80, 80);
                  enemy.container.setInteractive();
                  
                  // Force all sprites to be interactive too
                  if (enemy.sprite) {
                    enemy.sprite.setInteractive({ useHandCursor: true });
                  }
                }
              });
            }
            
            // Calculate frame-independent movement factor
            // default to 16.67ms (60fps) if delta is unavailable 
            const deltaFactor = delta ? delta / 16.67 : 1.0;
            
            // Update enemies - frame-rate independent movement
            if (this.enemies && this.enemies.length > 0) {
              // Using forEach with catch error for safety
              this.enemies.forEach(enemy => {
                try {
                  if (enemy && enemy.update) {
                    enemy.update(delta);
                    
                    // Original base speed is defined in the Enemy class (around 1.5-2.0)
                    // We apply frame-independent movement based on delta time
                    const frameIndependentSpeed = 0.5 * deltaFactor;
                    
                    // Force enemy position to move at consistent speed regardless of frame rate
                    enemy.x -= frameIndependentSpeed;
                    
                    // ANTI-STACKING: Add random Y movement 
                    if (Math.random() < 0.1) {
                      enemy.y += (Math.random() - 0.5) * 2;
                    }
                    
                    // Ensure enemy is visibly updated
                    if (enemy.container) {
                      enemy.container.x = enemy.x;
                      enemy.container.y = enemy.y;
                      enemy.container.visible = true;
                      enemy.container.setDepth(100);
                    }
                    
                    // Update health bar position
                    if (enemy.healthBar) {
                      if (enemy.healthBar.background) {
                        enemy.healthBar.background.x = enemy.x;
                        enemy.healthBar.background.y = enemy.y - 35;
                        enemy.healthBar.background.visible = true;
                      }
                      if (enemy.healthBar.fill) {
                        const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
                        enemy.healthBar.fill.width = 40 * healthPercent;
                        enemy.healthBar.fill.x = enemy.x - 20 + (enemy.healthBar.fill.width / 2);
                        enemy.healthBar.fill.y = enemy.y - 35;
                        enemy.healthBar.fill.visible = true;
                      }
                    }
                  }
                } catch (enemyError) {
                  console.error("Error updating enemy:", enemyError);
                }
              });
            }
            
            // CRITICAL FIX: Reset all defense cooldowns if they're stuck
            // This ensures mages can attack regularly
            if (this.defenses && this.defenses.length > 0 && Math.random() < 0.05) {
              // Occasionally reset all cooldowns to ensure attacks happen
              this.defenses.forEach(defense => {
                if (defense && defense.active) {
                  // Reset cooldown if it's been too long since last attack
                  if (this.scene && this.scene.time && this.scene.time.now - (defense.lastAttackTime || 0) > 5000) {
                    defense.cooldownRemaining = 0;
                    console.log(`Resetting stuck cooldown for ${defense.type} defense`);
                  }
                }
              });
            }
            
            // Update defenses - force update every frame
            if (this.defenses && this.defenses.length > 0) {
              // Call update on each defense
              this.defenses.forEach(defense => {
                try {
                  if (defense && defense.active && typeof defense.update === 'function') {
                    defense.update();
                    
                    // Log occasional debug information
                    if (Math.random() < 0.001) {
                      console.log(`Defense at (${defense.x}, ${defense.y}) active: ${defense.active}, cooldown: ${defense.cooldownRemaining || 0}`);
                      
                      // Count visible enemies in range
                      if (this.enemies && this.enemies.length > 0) {
                        let enemiesInRange = 0;
                        this.enemies.forEach(enemy => {
                          if (enemy && enemy.active) {
                            const dx = enemy.x - defense.x;
                            const dy = enemy.y - defense.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance <= defense.range * 1.5) {
                              enemiesInRange++;
                            }
                          }
                        });
                        console.log(`Defense at (${defense.x}, ${defense.y}) has ${enemiesInRange} enemies in range out of ${this.enemies.length} total`);
                      }
                    }
                  }
                } catch (defenseError) {
                  console.error("Error updating defense:", defenseError);
                }
              });
            }
            
            // CRITICAL FIX: Super aggressive direct forced attacks
            // This bypass ensures mages ALWAYS attack regardless of other conditions
            this.superForceDefensesToAttack();
            
            // Force defenses to attack every frame - AGGRESSIVE APPROACH
            this.forceDefensesToAttack();
            
            // Update defenses' attacks separately to ensure they attack
            this.updateDefenseAttacks();
            
            // Check if all enemies are gone and we've spawned all for this wave
            if (!this.isSpawningEnemies && this.enemies.length === 0 && this.waveInProgress) {
              this.waveInProgress = false;
              
              // Start next wave after delay
              this.time.delayedCall(5000, () => {
                if (this.gameState && this.gameState.isActive) {
                  this.gameState.wave++;
                  this.updateWaveText();
                  this.startWave();
                }
              });
              
              // Show wave complete message
              this.showFloatingText(400, 300, `Wave ${this.gameState.wave} complete!`, 0x00FF00);
              
              // Award bonus coins for completing wave
              const waveBonus = 20 + (this.gameState.wave * 5);
              this.updateFarmCoins(waveBonus);
              this.showFloatingText(400, 350, `+${waveBonus} coins bonus!`, 0xFFFF00);
            }
            
            // Clear flag when done
            isUpdating = false;
          } catch (error) {
            // Make sure flag is cleared even if there's an error
            isUpdating = false;
            console.error("Error in update loop:", error);
          }
        }
        
        updateDefenseAttacks() {
          if (!this.defenses || !this.gameState || !this.gameState.isActive) {
            return;
          }
          
          // Always initialize enemies array if it doesn't exist
          if (!this.enemies) {
            this.enemies = [];
          }
          
          // Force each defense to find and attack enemies
          this.defenses.forEach(defense => {
            if (defense && defense.active) {
              // Ensure defense can attack any enemy type
              defense.targetTypes = []; // Empty array = can target any enemy
              
              // Force attack attempt
              defense.attackNearestEnemy(true);
            }
          });
        }
        
        // Find enemy with lowest health for priority targeting
        findLowHealthEnemy(defense) {
          if (!defense || !this.enemies || this.enemies.length === 0) {
            return null;
          }
          
          let lowestHealthEnemy = null;
          let lowestHealth = Infinity;
          
          // Look for low health enemies first - use a wider range
          for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (!enemy) continue;
            
            // Force enemy to be active - this fixes the issue with inactive enemies
            enemy.active = true;
            
            // Calculate distance
            const dx = enemy.x - defense.x;
            const dy = enemy.y - defense.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Use a much larger range for targeting low health enemies
            // This helps mages to finish off enemies anywhere on screen
            const extendedRange = defense.range * 1.75; // Increased from 1.5
            
            if (distance <= extendedRange) {
              // Prioritize very low health enemies to ensure kills
              // Count all enemies with less than 5 health as low health
              if (enemy.health <= 5) { // Increased from 3
                // The lower the health, the higher the priority
                const priority = 6 - enemy.health; // Give priority boost to lowest health
                
                if (enemy.health < lowestHealth || 
                   (enemy.health === lowestHealth && distance < defense.range)) {
                  lowestHealthEnemy = enemy;
                  lowestHealth = enemy.health;
                }
              }
            }
          }
          
          // If we found a low health enemy, log it occasionally for debugging
          if (lowestHealthEnemy && Math.random() < 0.05) {
            console.log(`Defense at (${defense.x}, ${defense.y}) found low health enemy with ${lowestHealth.toFixed(1)} HP`);
          }
          
          return lowestHealthEnemy;
        }
        
        // Get closest enemy regardless of range
        getClosestEnemy(defense) {
          if (!defense || !this.enemies || this.enemies.length === 0) {
            return null;
          }
          
          let closestEnemy = null;
          let closestDistance = Infinity;
          
          // Find closest enemy - more aggressive search
          for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            
            // Skip completely invalid enemies
            if (!enemy) continue;
            
            // Force enemy to be active for targeting
            enemy.active = true;
            
            // Ensure enemy has valid position
            if (typeof enemy.x !== 'number' || typeof enemy.y !== 'number') {
              // Try to find position in alternative properties
              if (enemy.sprite && typeof enemy.sprite.x === 'number' && typeof enemy.sprite.y === 'number') {
                enemy.x = enemy.sprite.x;
                enemy.y = enemy.sprite.y;
              } else if (enemy.container && typeof enemy.container.x === 'number' && typeof enemy.container.y === 'number') {
                enemy.x = enemy.container.x;
                enemy.y = enemy.container.y;
              } else {
                // Skip enemies without position
                continue;
              }
            }
            
            // Calculate distance
            const dx = enemy.x - defense.x;
            const dy = enemy.y - defense.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if this enemy is a valid target - more permissive type checking
            let canTarget = !defense.targetTypes || 
                           defense.targetTypes.length === 0 || 
                           defense.targetTypes.includes(enemy.type) || 
                           defense.targetTypes.includes('all');
            
            // In desperate situations (few enemies), target anyway
            if (!canTarget && this.enemies.length <= 3) {
              canTarget = true;
            }
            
            // Update closest enemy tracking
            if (canTarget && distance < closestDistance) {
              closestDistance = distance;
              closestEnemy = enemy;
            }
          }
          
          // Only return if within reasonable distance (extended range)
          // Use a larger extended range for better targeting
          const extendedRange = defense.range * 2.0; // Increased from 1.5
          
          if (closestEnemy && closestDistance <= extendedRange) {
            // Log occasionally for debugging
            if (Math.random() < 0.05) {
              console.log(`Defense at (${defense.x}, ${defense.y}) found closest enemy at distance ${closestDistance.toFixed(1)}px`);
            }
            return closestEnemy;
          }
          
          return null;
        }

        // Add a method to destroy defenses properly
        destroyDefense(defense) {
          // Destroy sprite
          if (defense.sprite) {
            defense.sprite.destroy();
          }
          
          // Destroy glow effect
          if (defense.glow) {
            defense.glow.destroy();
          }
          
          // Remove from defenses array
          const index = this.defenses.indexOf(defense);
          if (index !== -1) {
            this.defenses.splice(index, 1);
          }
        }

        // Add this function to toggle the upgrade panel
        toggleUpgradePanel() {
          if (this.upgradeSystem) {
            const isVisible = this.upgradeSystem.toggleUI();
            
            // Highlight the upgrade button when panel is open
            if (this.toolbarButtons && this.toolbarButtons.upgrade) {
              this.toolbarButtons.upgrade.fillColor = isVisible ? 0x888800 : 0x555500;
            }
            
            console.log(`Upgrade panel ${isVisible ? 'opened' : 'closed'}`);
          }
        }

        // Find an enemy within range of a defense
        getEnemyInRange(defense) {
          if (!defense || !this.enemies || this.enemies.length === 0) {
            return null;
          }
          
          let closestEnemy = null;
          let closestDistance = Infinity;
          let weakestEnemy = null;
          let lowestHealth = Infinity;
          
          // Loop through all enemies to find potential targets
          for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (!enemy || !enemy.active) {
              continue;
            }
            
            // Calculate distance from defense to enemy
            const dx = enemy.x - defense.x;
            const dy = enemy.y - defense.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if enemy is in range and the defense can target this enemy type
            const inRange = distance <= defense.range * 1.2; // 20% increased range
            if (inRange) {
              // Check if this defense can target this enemy type - be more permissive
              let canTarget = defense.targetTypes.length === 0 || 
                            defense.targetTypes.includes(enemy.type) || 
                            defense.targetTypes.includes('all');
                            
              // In desperate situations (few enemies), target anyway
              if (!canTarget && this.enemies.length <= 2) {
                canTarget = true;
              }
              
              if (canTarget && distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
              }
            }
          }
          
          return closestEnemy;
        }

        // New method to force defenses to attack enemies
        forceDefensesToAttack() {
          // Skip if no defenses or enemies
          if (!this.defenses || !this.enemies || this.defenses.length === 0 || this.enemies.length === 0) {
            return;
          }
          
          // Loop through each defense
          for (let i = 0; i < this.defenses.length; i++) {
            const defense = this.defenses[i];
            if (!defense || !defense.active) continue;
            
            // Skip if defense is on cooldown
            if (defense.cooldownRemaining && defense.cooldownRemaining > 0) {
              continue;
            }
            
            // Force all enemies to be active
            this.enemies.forEach(enemy => {
              if (enemy) {
                enemy.active = true;
              }
            });
            
            // Direct attack - find the closest enemy and attack it
            let closestEnemy = null;
            let closestDistance = Infinity;
            
            // Find closest enemy
            for (let j = 0; j < this.enemies.length; j++) {
              const enemy = this.enemies[j];
              if (!enemy) continue;
              
              // Calculate distance
              const dx = enemy.x - defense.x;
              const dy = enemy.y - defense.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Use a very generous range for targeting
              const maxRange = 500; // Almost entire screen width
              
              if (distance < closestDistance && distance <= maxRange) {
                closestDistance = distance;
                closestEnemy = enemy;
              }
            }
            
            // If found an enemy, force attack it
            if (closestEnemy) {
              // Force direct attack regardless of range or type
              if (typeof defense.attack === 'function') {
                defense.attack(closestEnemy);
                
                // Log attack occasionally
                if (Math.random() < 0.05) {
                  console.log(`FORCED attack from ${defense.type} at (${defense.x}, ${defense.y}) on enemy at (${closestEnemy.x}, ${closestEnemy.y})`);
                }
              }
            }
          }
        }

        // CRITICAL FIX: Ultra aggressive direct attack method - highest priority
        superForceDefensesToAttack() {
          if (!this.defenses || !this.enemies || this.defenses.length === 0 || this.enemies.length === 0) {
            return;
          }
          
          // For each defense, directly attack the first enemy
          this.defenses.forEach(defense => {
            // Skip invalid defenses
            if (!defense || !defense.active) return;
            
            // Skip if on cooldown
            if (defense.cooldownRemaining > 0) return;
            
            // Pick ANY enemy to attack, priority to the closest
            let targetEnemy = null;
            let minDistance = Infinity;
            
            // Find ANY valid enemy
            for (let i = 0; i < this.enemies.length; i++) {
              const enemy = this.enemies[i];
              if (!enemy) continue;
              
              // Force enemy to be active - critical fix
              enemy.active = true;
              enemy.visible = true;
              
              // Calculate distance
              const dx = enemy.x - defense.x;
              const dy = enemy.y - defense.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Update closest enemy
              if (distance < minDistance) {
                minDistance = distance;
                targetEnemy = enemy;
              }
            }
            
            // If we found any enemy, attack it regardless of range
            if (targetEnemy) {
              // Directly modify defense properties to ensure attack works
              defense.cooldownRemaining = 0;
              defense.lastAttackTime = 0;
              
              // Force attack by directly accessing the method
              if (typeof defense.attack === 'function') {
                const success = defense.attack(targetEnemy);
                
                if (success && Math.random() < 0.1) {
                  console.log(`SUPER FORCED attack from ${defense.type} at (${defense.x}, ${defense.y}) to enemy at (${targetEnemy.x}, ${targetEnemy.y})`);
                }
              }
            }
          });
        }

        showDefensePlacementIndicator(pointer, type) {
          try {
            // Make the planting indicator visible
            this.plantingIndicator.visible = true;
            
            // Adjust size based on type
            const size = type === 'scarecrow' ? 250 : 200; // Match the actual range of the mage
            
            // Update indicator position to follow pointer
            this.plantingIndicator.x = pointer.x;
            this.plantingIndicator.y = pointer.y;
            this.plantingIndicator.width = this.plantingIndicator.height = size * 2; // Double for full diameter
            
            // Update color based on defense type
            const strokeColor = type === 'scarecrow' ? 0x0088FF : 0xFF4400;
            const fillColor = type === 'scarecrow' ? 0x0088FF : 0xFF4400;
            this.plantingIndicator.setStrokeStyle(2, strokeColor);
            this.plantingIndicator.fillColor = fillColor;
            this.plantingIndicator.fillAlpha = 0.1;
            
            // Show help text for where defenses can be placed
            this.plantingHelpText.visible = true;
            this.plantingHelpText.x = 400;
            this.plantingHelpText.y = 50;
            
            // Update help text color
            const textColor = type === 'scarecrow' ? '#0088FF' : '#FF4400';
            const defenseName = type === 'scarecrow' ? 'Ice Mage' : 'Fire Mage';
            this.plantingHelpText.setText(`Place ${defenseName} on the RIGHT side of the map`);
            this.plantingHelpText.setColor(textColor);
            
            // Check if placement is valid (right side of screen)
            if (pointer.x < 200) {
              // Invalid position
              this.plantingIndicator.fillColor = 0xFF0000;
              this.plantingIndicator.setStrokeStyle(2, 0xFF0000);
              this.plantingIndicator.fillAlpha = 0.3;
            }
          } catch (error) {
            console.error("Error showing defense placement indicator:", error);
          }
        }

        // Add this new method after the "addHelperFunctions" method
        triggerSpecialAttack() {
          // Ensure we have defenses to work with
          if (!this.defenses || this.defenses.length === 0) {
            return;
          }
          
          // Try to find the closest defense to the pointer
          const pointer = this.input.activePointer;
          let closestDefense = null;
          let closestDistance = 100; // Maximum distance to consider "selected"
          
          // Find closest defense
          for (const defense of this.defenses) {
            if (!defense || !defense.active) continue;
            
            const dx = defense.x - pointer.x;
            const dy = defense.y - pointer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestDefense = defense;
            }
          }
          
          // If we found a defense close to the cursor, trigger its special attack
          if (closestDefense && typeof closestDefense.performSpecialAttack === 'function') {
            const result = closestDefense.performSpecialAttack();
            
            // Provide feedback if special attack was used
            if (result) {
              const color = closestDefense.type === 'scarecrow' ? 0x00FFFF : 0xFF6600;
              const text = closestDefense.type === 'scarecrow' ? 'ICE STORM!' : 'FIRE BLAST!';
              
              // Show floating text above the mage
              this.showFloatingText(closestDefense.x, closestDefense.y - 60, text, color);
              
              // Add screen shake for dramatic effect
              this.cameras.main.shake(300, 0.005);
            }
          } else {
            // Inform player how to use special attacks
            this.showFloatingText(
              this.input.activePointer.x,
              this.input.activePointer.y - 30,
              "Move cursor near a mage with SPECIAL ready!",
              0xFFFFFF
            );
          }
        }
      }
      
      // Replace the placeholder with the real implementation
      GameScene = GameSceneClient;
      console.log("Client-side GameScene loaded successfully");
    } catch (error) {
      console.error("Error initializing Phaser GameScene:", error);
    }
  }).catch(error => {
    console.error("Failed to load Phaser:", error);
  });
}

// Export the GameScene
export { GameScene }; 