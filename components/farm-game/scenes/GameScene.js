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
            this.load.image('ABS_idle', '/defense/abster idle.png');
            this.load.image('ABS_attack', '/defense/abster attacks.png');
            this.load.image('NOOT_idle', '/defense/noot idle.png');
            this.load.image('NOOT_attack', '/defense/noot attack.png');
            
            // Load enemy images with proper path and error handling
            this.load.image('enemy_bird', 'characters/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon1.png');
            this.load.image('enemy_rabbit', 'characters/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon2.png');
            this.load.image('enemy_boss', 'characters/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon3.png');
            this.load.image('enemy_fox', 'characters/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon9.png');
            
            // Load advanced defense textures
            this.load.image('wizard_idle', '/defense/wizard idle.png');
            this.load.image('wizard_attack', '/defense/wizard attack.png');
            this.load.image('cannon_idle', '/defense/cannon idle.png');
            this.load.image('cannon_attack', '/defense/cannon attack.png');
            
            // Load shadows
            this.load.image('shadow1', '/characters/2 Objects/1 Shadow/1.png');
            this.load.image('shadow2', '/characters/2 Objects/1 Shadow/2.png');
            
            // Load plant assets for crops
            this.load.image('plant1_idle', '/characters/craftpix-net-922184-free-predator-plant-mobs-pixel-art-pack/PNG/Plant1/Idle/Plant1_Idle_head.png');
            this.load.image('plant2_idle', '/characters/craftpix-net-922184-free-predator-plant-mobs-pixel-art-pack/PNG/Plant2/Idle/Plant2_Idle_head.png');
            this.load.image('plant3_idle', '/characters/craftpix-net-922184-free-predator-plant-mobs-pixel-art-pack/PNG/Plant3/Idle/Plant3_Idle_head.png');
            
            // Load particle effects
            this.load.spritesheet('fire_particle', 
              '/particules/Spritesheets/Fire+Sparks-Sheet.png', 
              { frameWidth: 48, frameHeight: 48 }
            );
            this.load.spritesheet('rocket_fire', 
              '/particules/Spritesheets/Rocket Fire 2-Sheet.png', 
              { frameWidth: 32, frameHeight: 32 }
            );
            
            // Use the fireball particles as fallbacks
            this.load.image('magic_particle', '/fireball.png');
            this.load.image('fireball_red', '/fireball.png');
            this.load.image('fireball_blue', '/iceball.png');
            
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
              
              // Create placeholders for missing wizard/cannon assets
              if (fileObj.key === 'wizard_idle' || fileObj.key === 'wizard_attack' || 
                  fileObj.key === 'cannon_idle' || fileObj.key === 'cannon_attack') {
                console.log(`Creating placeholder for missing asset: ${fileObj.key}`);
                
                // We'll create the fallbacks in the complete handler
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
              
              // Create fallback for wizard assets
              if (!this.textures.exists('wizard_idle')) {
                const wizardGraphics = this.make.graphics();
                // Create a purple wizard shape
                wizardGraphics.fillStyle(0xFF00FF, 1);
                wizardGraphics.fillCircle(20, 20, 18);
                wizardGraphics.fillStyle(0x9900CC, 1);
                // Add a wizard hat
                wizardGraphics.fillTriangle(10, 20, 30, 20, 20, 0);
                wizardGraphics.generateTexture('wizard_idle', 40, 40);
                console.log('Created fallback texture for wizard_idle');
              }
              
              if (!this.textures.exists('wizard_attack')) {
                // Just use the same texture for attack
                if (this.textures.exists('wizard_idle')) {
                  // Create a new key that references the same texture frame
                  const idleTexture = this.textures.get('wizard_idle');
                  this.textures.addImage('wizard_attack', idleTexture.getSourceImage());
                } else {
                  // Create if needed
                  const wizardGraphics = this.make.graphics();
                  wizardGraphics.fillStyle(0xFF00FF, 1);
                  wizardGraphics.fillCircle(20, 20, 20);
                  wizardGraphics.fillStyle(0x9900CC, 1);
                  wizardGraphics.fillTriangle(10, 20, 30, 20, 20, 0);
                  wizardGraphics.generateTexture('wizard_attack', 40, 40);
                }
                console.log('Created fallback texture for wizard_attack');
              }
              
              // Create fallback for cannon assets
              if (!this.textures.exists('cannon_idle')) {
                const cannonGraphics = this.make.graphics();
                // Create a red cannon shape
                cannonGraphics.fillStyle(0x666666, 1); // Base
                cannonGraphics.fillRect(10, 20, 20, 15);
                cannonGraphics.fillStyle(0xFF0000, 1); // Barrel
                cannonGraphics.fillRect(18, 10, 15, 10);
                cannonGraphics.generateTexture('cannon_idle', 40, 40);
                console.log('Created fallback texture for cannon_idle');
              }
              
              if (!this.textures.exists('cannon_attack')) {
                // Just use the same texture for attack
                if (this.textures.exists('cannon_idle')) {
                  // Create a new key that references the same texture frame
                  const idleTexture = this.textures.get('cannon_idle');
                  this.textures.addImage('cannon_attack', idleTexture.getSourceImage());
                } else {
                  // Create if needed
                  const cannonGraphics = this.make.graphics();
                  cannonGraphics.fillStyle(0x666666, 1);
                  cannonGraphics.fillRect(10, 20, 20, 15);
                  cannonGraphics.fillStyle(0xFF0000, 1);
                  cannonGraphics.fillRect(18, 10, 15, 10);
                  cannonGraphics.generateTexture('cannon_attack', 40, 40);
                }
                console.log('Created fallback texture for cannon_attack');
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
                console.log('Using loaded red fireball texture');
                // Skipping dynamic creation since we're loading the texture directly
              } catch (error) {
                console.error("Error creating red fireball texture:", error);
              }
            }
            
            if (!this.textures.exists('fireball_blue')) {
              try {
                console.log('Using loaded blue fireball texture');
                // Skipping dynamic creation since we're loading the texture directly
              } catch (error) {
                console.error("Error creating blue fireball texture:", error);
              }
            }
            
            // Initialize global flag for update loop
            isUpdating = false;
            
            console.log("GameScene create started");
            
            // Setup particle animations
            this.createParticleAnimations();
            
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
            
            // Create fallback textures for advanced defenses
            this.createAdvancedDefenseTextures();
            
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
            
            // Optimize input performance
            this.input.on('pointerdown', (pointer) => {
              this.lastPointerDown = {
                time: this.time.now,
                x: pointer.x,
                y: pointer.y
              };
            });
            
            // Setup wave progression check interval
            this.waveCheckInterval = this.time.addEvent({
              delay: 2000,
              callback: () => {
                try {
                  // Check for completed waves that didn't progress
                  if (this.gameState?.isActive && 
                      this.enemies?.length === 0 && 
                      !this.isSpawningEnemies &&
                      this.enemiesSpawned >= this.totalEnemiesInWave &&
                      this.waveInProgress) {
                    
                    console.log("Wave completion detected, forcing next wave");
                    this.forceNextWave();
                  }
                } catch(err) {
                  console.error("Error in wave check interval:", err);
                }
              },
              loop: true
            });

            console.log("Wave progression fix applied successfully!");
            
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
            // Create text displays
            this.scoreText = this.add.text(10, 10, "Score: 0", {
              fontFamily: 'Arial',
              fontSize: '18px',
              color: '#FFFFFF'
            });
            
            this.farmCoinsText = this.add.text(10, 30, "Farm Coins: 0", {
              fontFamily: 'Arial',
              fontSize: '18px',
              color: '#FFFF00'
            });
            
            this.waveText = this.add.text(10, 50, "Wave: 0", {
              fontFamily: 'Arial',
              fontSize: '18px',
              color: '#FFFFFF'
            });
            
            this.livesText = this.add.text(10, 70, "Lives: 3", {
              fontFamily: 'Arial',
              fontSize: '18px',
              color: '#FF0000'
            });
            
            // Add Next Wave button with a delay before it appears
            const nextWaveButton = this.add.rectangle(750, 30, 120, 40, 0x00AA00);
            nextWaveButton.setInteractive({ useHandCursor: true });
            nextWaveButton.on('pointerdown', () => {
              this.forceNextWave();
            });
            
            const nextWaveText = this.add.text(750, 30, "Next Wave", {
              fontFamily: 'Arial',
              fontSize: '16px',
              color: '#FFFFFF'
            }).setOrigin(0.5);
            
            // Store reference to button for enabling/disabling
            this.nextWaveButton = { button: nextWaveButton, text: nextWaveText };
            
            // Hide initially until game starts
            this.nextWaveButton.button.visible = false;
            this.nextWaveButton.text.visible = false;
            
            console.log("UI created");
          } catch (error) {
            console.error("Error creating UI:", error);
          }
        }
        
        // Show Next Wave button after a delay
        showNextWaveButton() {
          // Show button if it was hidden
          if (this.nextWaveButton) {
            this.nextWaveButton.button.visible = true;
            this.nextWaveButton.text.visible = true;
            
            // Make the button more noticeable with animation
            this.tweens.add({
              targets: [this.nextWaveButton.button, this.nextWaveButton.text],
              scale: { from: 0.8, to: 1 },
              duration: 500,
              yoyo: true,
              repeat: 2
            });
            
            // Change color to make it more noticeable
            this.nextWaveButton.button.fillColor = 0xFF8800;
          }
        }
        
        // Start the game
        startGame() {
          try {
            console.log("Starting game");
            
            this.gameState.isActive = true;
            this.gameState.wave = 1;
            this.updateWaveText();
            
            // Start first wave
            this.startWave();
            
            // Hide start button
            if (this.startButton) {
              this.startButton.destroy();
              this.startText.destroy();
            }
            
            // Show next wave button immediately
            this.showNextWaveButton();
            
            console.log("Game started");
          } catch (error) {
            console.error("Error starting game:", error);
          }
        }
        
        setupInputHandlers() {
          try {
            console.log("Setting up input handlers");
            
            // Create a global click handler for the main game area with expanded hit area
            const gameArea = this.add.rectangle(400, 300, 800, 500, 0, 0);
            gameArea.setInteractive();
            
            // Use DOWN event for faster response
            gameArea.on('pointerdown', (pointer) => {
              // Skip if clicking in toolbar area - moved up to give more game area
              if (pointer.y > 510) return;
              
              // Skip if game not active
              if (!this.gameState.isActive) return;
              
              console.log("Game area clicked at", pointer.x, pointer.y, "tool mode:", this.toolMode);
              
              // ATTACK MODE - Check for enemies with expanded hit area
              if (this.toolMode === 'attack') {
                // Find closest enemy within a reasonable distance (easier clicking)
                let closestEnemy = null;
                let closestDistance = 40; // Increased click radius from default
                
                if (this.enemies && this.enemies.length > 0) {
                  this.enemies.forEach(enemy => {
                    if (enemy && enemy.active) {
                      const dx = enemy.x - pointer.x;
                      const dy = enemy.y - pointer.y;
                      const distance = Math.sqrt(dx * dx + dy * dy);
                      
                      if (distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                      }
                    }
                  });
                }
                
                if (closestEnemy) {
                  // Apply damage to the enemy
                  closestEnemy.takeDamage(this.gameState.clickDamage || 1);
                  
                  // Show attack effect
                  this.showFloatingText(closestEnemy.x, closestEnemy.y - 20, 
                    `-${(this.gameState.clickDamage || 1).toFixed(1)}`, 0xFF0000);
                    
                  // Create attack effect
                  this.createClickAttackEffect(closestEnemy.x, closestEnemy.y);
                  return;
                }
                
                // Allow defense placement when in attack mode too (easier workflow)
                if (pointer.x >= 200) {
                  // Try to find a special attack to trigger
                  this.triggerSpecialAttack();
                }
              }
              
              // CROP PLANTING MODE with improved grid snapping
              else if (this.toolMode === 'plant') {
                if (this.isPointInFarmArea(pointer.x, pointer.y)) {
                  if (this.gameState.farmCoins >= 5) {
                    // Better grid alignment for crops
                    const gridSize = this.gridCellSize || 32;
                    const snappedX = Math.floor(pointer.x / gridSize) * gridSize + (gridSize / 2);
                    const snappedY = Math.floor(pointer.y / gridSize) * gridSize + (gridSize / 2);
                    this.plantCrop(snappedX, snappedY);
                  } else {
                    this.showFloatingText(pointer.x, pointer.y, "Need 5 coins!", 0xFF0000);
                  }
                } else {
                  this.showFloatingText(pointer.x, pointer.y, "Plant on LEFT side only!", 0xFF0000);
                }
                return;
              }
              
              // DEFENSE PLACEMENT MODE - For any defense type
              else if (this.isDefenseMode(this.toolMode) || this.pendingDefensePlacement) {
                // Store the defense type from either source
                const defenseType = this.pendingDefenseType || this.toolMode;
                
                // Check valid placement area
                if (pointer.x < 200) {
                  this.showFloatingText(pointer.x, pointer.y, "Place on RIGHT side only!", 0xFF0000);
                  return;
                }
                
                // Calculate cost based on defense type
                let cost = 0;
                switch (defenseType) {
                  case 'scarecrow': cost = 35; break;
                  case 'dog': cost = 50; break;
                  case 'wizard': cost = 100; break;
                  case 'cannon': cost = 150; break;
                  default: cost = 50; break;
                }
                
                // Check if enough coins
                if (this.gameState.farmCoins < cost) {
                  this.showFloatingText(pointer.x, pointer.y, `Need ${cost} coins!`, 0xFF0000);
                  return;
                }
                
                // Grid snap the defense for better placement
                const gridSize = 40; // Use slightly larger grid for defenses
                const snappedX = Math.floor(pointer.x / gridSize) * gridSize + (gridSize / 2);
                const snappedY = Math.floor(pointer.y / gridSize) * gridSize + (gridSize / 2);
                
                // Place the defense at the snapped position
                const success = this.placeDefense(snappedX, snappedY, defenseType);
                
                if (success) {
                  // Reset flags
                  this.pendingDefensePlacement = false;
                  this.pendingDefenseType = null;
                  
                  // Return to attack mode automatically for better user experience
                  this.setToolMode('attack');
                  
                  // Hide any indicators that might be visible
                  if (this.plantingIndicator) this.plantingIndicator.visible = false;
                  if (this.plantingHelpText) this.plantingHelpText.visible = false;
                }
                
                return;
              }
            });
            
            // Initialize pointerMoveListener for tracking tool placement
            this.pointerMoveListener = (pointer) => {
              // Skip if clicking in toolbar area
              if (pointer.y > 520) {
                if (this.plantingIndicator) this.plantingIndicator.visible = false;
                if (this.plantingHelpText) this.plantingHelpText.visible = false;
                if (this.placementCircle) this.placementCircle.visible = false;
                return;
              }
              
              if (this.gameState && this.gameState.isActive) {
                if (this.toolMode === 'plant') {
                  // Crop planting mode
                  this.updatePlacementPreview(pointer);
                } else if (this.isDefenseMode(this.toolMode) || this.pendingDefensePlacement) {
                  // Defense placement mode - show range indicator
                  if (this.placementCircle) {
                    this.placementCircle.x = pointer.x;
                    this.placementCircle.y = pointer.y;
                    this.placementCircle.visible = true;
                  }
                } else {
                  // Attack mode - hide indicators
                  if (this.plantingIndicator) this.plantingIndicator.visible = false;
                  if (this.plantingHelpText) this.plantingHelpText.visible = false;
                  if (this.placementCircle) this.placementCircle.visible = false;
                }
              }
            };
            
            // Add pointer move handler
            this.input.on('pointermove', this.pointerMoveListener);
          } catch (error) {
            console.error("Error setting up input handlers:", error);
          }
        }
        
        // Create visual effect for click attack
        createClickAttackEffect(x, y) {
          try {
            // Create a larger burst effect for better visibility
            const burst = this.add.circle(x, y, 15, 0xFF0000, 0.7); // Increased size from 10
            burst.setStrokeStyle(3, 0xFFFFFF); // Thicker stroke
            
            // Animate the burst with larger scale
            this.tweens.add({
              targets: burst,
              scale: 3, // Increased from 2
              alpha: 0,
              duration: 400, // Longer duration
              onComplete: () => burst.destroy()
            });
            
            // Add more sparkles for better visual feedback
            for (let i = 0; i < 10; i++) { // Increased from 6
              const angle = Math.random() * Math.PI * 2;
              const distance = 20 + Math.random() * 15; // Increased range
              const sparkX = x + Math.cos(angle) * distance;
              const sparkY = y + Math.sin(angle) * distance;
              
              const spark = this.add.circle(sparkX, sparkY, 3, 0xFFFFFF, 1); // Larger sparks
              
              this.tweens.add({
                targets: spark,
                x: sparkX + Math.cos(angle) * 15, // Longer travel distance
                y: sparkY + Math.sin(angle) * 15,
                alpha: 0,
                scale: 0.5,
                duration: 300, // Longer duration
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
          try {
            // If no enemies exist, return null
            if (!this.enemies || this.enemies.length === 0) {
              return null;
            }
            
            // Larger click radius for easier targeting
            const clickRadius = 40; // Increased from default
            let closestEnemy = null;
            let closestDistance = clickRadius;
            
            // Find closest enemy within click radius
            this.enemies.forEach(enemy => {
              if (enemy && enemy.active) {
                const dx = enemy.x - x;
                const dy = enemy.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestEnemy = enemy;
                }
              }
            });
            
            return closestEnemy;
          } catch (error) {
            console.error("Error in getEnemyAtPosition:", error);
            return null;
          }
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
            // Create text with larger font size and a shadow for better visibility
            const textConfig = {
              fontFamily: 'Arial',
              fontSize: '24px', // Increased from default
              color: this.rgbToHex(color),
              stroke: '#000000',
              strokeThickness: 4, // Added stroke for better visibility
              shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 2
              }
            };
            
            const floatingText = this.add.text(x, y, message, textConfig).setOrigin(0.5);
            
            // Add a rising and fading animation
            this.tweens.add({
              targets: floatingText,
              y: y - 60, // Move further up for better visibility
              alpha: 0,
              duration: 1200, // Longer duration so text is visible longer
              ease: 'Cubic.easeOut',
              onComplete: () => {
                floatingText.destroy();
              }
            });
          } catch (error) {
            console.error("Error showing floating text:", error);
          }
        }
        
        // Helper function to convert RGB color to hex string
        rgbToHex(color) {
          const r = (color >> 16) & 0xFF;
          const g = (color >> 8) & 0xFF;
          const b = color & 0xFF;
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
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
            if (!this.gameState.isActive) return;
            
            console.log(`Starting wave ${this.gameState.wave}`);
            
            // Update advanced defense buttons (to ensure proper unlocking)
            if (typeof this.updateAdvancedDefenseButtons === 'function') {
              this.updateAdvancedDefenseButtons();
            }
            
            // Show wave announcement
            this.showWaveStartText(this.gameState.wave);
            
            // Determine number of enemies based on wave number - IMPROVED SCALING
            let numEnemies = Math.min(50, Math.floor(3 + (this.gameState.wave * 1.5)));
            
            // Improved wave scaling with better progression
            if (this.gameState.wave > 10) {
              numEnemies = Math.min(75, Math.floor(20 + (this.gameState.wave - 10) * 2));
            }
            
            // Calculate enemy types based on wave
            const enemyTypes = this.calculateEnemyTypes(this.gameState.wave);
            
            // Store wave data
            this.totalEnemiesInWave = numEnemies;
            this.enemiesSpawned = 0;
            this.waveInProgress = true;
            
            // Show wave start text with the available showFloatingText method
            this.showFloatingText(400, 300, `WAVE ${this.gameState.wave} STARTING!`, 0xFFFF00);
            
            // Start spawning enemies with a delay
            this.isSpawningEnemies = true;
            
            // Add wave bonus - increased coins for higher waves
            const waveBonus = Math.floor(10 + (this.gameState.wave * 5));
            this.updateFarmCoins(waveBonus);
            this.showFloatingText(400, 100, `Wave ${this.gameState.wave} Bonus: +${waveBonus} coins!`, 0xFFFF00);
            
            // Set up spawning loop based on wave difficulty
            const spawnInterval = Math.max(500, 2000 - (this.gameState.wave * 100)); // Faster spawns in later waves
            
            // Clear any existing spawn timer
            if (this.spawnTimer) {
              this.spawnTimer.remove();
            }
            
            // Start spawning enemies
            this.spawnTimer = this.time.addEvent({
              delay: spawnInterval,
              callback: () => {
                if (this.enemiesSpawned < this.totalEnemiesInWave) {
                  // Select an enemy type from available types
                  const enemyType = this.selectEnemyType(enemyTypes);
                  
                  // Spawn the enemy
                  this.spawnEnemy(enemyType);
                  this.enemiesSpawned++;
                } else {
                  // All enemies spawned, stop timer
                  this.spawnTimer.remove();
                  this.spawnTimer = null;
                }
              },
              callbackScope: this,
              loop: true
            });
          } catch (error) {
            console.error("Error starting wave:", error);
          }
        }
        
        // New method to determine enemy types based on wave
        calculateEnemyTypes(wave) {
          const types = {
            bird: { weight: 70, minWave: 1 },
            rabbit: { weight: 70, minWave: 1 },
            fox: { weight: 0, minWave: 3 }
          };
          
          // Adjust weights based on wave progression
          if (wave >= 3) {
            // Start introducing foxes at wave 3
            types.fox.weight = Math.min(40, (wave - 2) * 10);
          }
          
          if (wave >= 5) {
            // More foxes in later waves
            types.fox.weight = Math.min(50, 30 + (wave - 5) * 5);
          }
          
          // Boss waves have more advanced enemies
          if (wave % 5 === 0) {
            types.fox.weight += 20;
          }
          
          return types;
        }
        
        // Helper to select enemy type based on weights
        selectEnemyType(enemyTypes) {
          // Filter types available at current wave
          const availableTypes = Object.entries(enemyTypes)
            .filter(([type, data]) => this.gameState.wave >= data.minWave && data.weight > 0);
          
          if (availableTypes.length === 0) return 'rabbit'; // Fallback
          
          // Calculate total weight
          const totalWeight = availableTypes.reduce((sum, [_, data]) => sum + data.weight, 0);
          
          // Random selection based on weight
          let random = Math.random() * totalWeight;
          
          for (const [type, data] of availableTypes) {
            random -= data.weight;
            if (random <= 0) return type;
          }
          
          // Fallback to first available type
          return availableTypes[0][0];
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
        
        // Spawn a single enemy of the specified type
        spawnEnemy(type = null) {
          try {
            // Skip if scene is inactive or paused
            if (!this.gameState || !this.gameState.isActive || this.gameState.isPaused) {
              console.log("Game inactive or paused, not spawning enemy");
              return;
            }
            
            // If no type specified, choose randomly based on wave
            if (!type) {
              const wave = this.gameState.wave;
              
              // Determine enemy type probabilities based on wave number
              let birdChance = 0.6;
              let rabbitChance = 0.4;
              let foxChance = 0;
              
              // Adjust probabilities based on wave number
              if (wave >= 3) {
                birdChance = 0.5;
                rabbitChance = 0.3;
                foxChance = 0.2;
              }
              if (wave >= 6) {
                birdChance = 0.4;
                rabbitChance = 0.3;
                foxChance = 0.3;
              }
              if (wave >= 9) {
                birdChance = 0.3;
                rabbitChance = 0.3;
                foxChance = 0.4;
              }
              
              // Special case for boss waves
              if (wave % 5 === 0) {
                foxChance += 0.1; // Increase fox chance on boss waves
                // Adjust other chances to maintain total of 1.0
                const total = birdChance + rabbitChance + foxChance;
                birdChance = birdChance / total;
                rabbitChance = rabbitChance / total;
                foxChance = foxChance / total;
              }
              
              // Determine type based on calculated probabilities
              const roll = Math.random();
              if (roll < birdChance) {
                type = 'bird';
              } else if (roll < birdChance + rabbitChance) {
                type = 'rabbit';
              } else {
                type = 'fox';
              }
            }
            
            // Calculate spawn position (always start from right edge)
            const x = 800 + (Math.random() * 50); // Add some randomness to entry position
            
            // Calculate random y position within the playable area
            const y = 150 + (Math.random() * 300);
            
            // Use the Enemy class from registry
            const EnemyClass = this.registry.get('EnemyClass');
            if (!EnemyClass) {
              console.error("Enemy class not available in registry");
              return;
            }
            
            // Create the enemy
            const enemy = new EnemyClass(this, type, x, y);
            
            // Add to enemies array
            if (!this.enemies) {
              this.enemies = [];
            }
            this.enemies.push(enemy);
            
            // Update enemy count
            this.enemiesSpawned++;
            
            // Update wave progress UI if available
            if (typeof this.updateWaveProgressUI === 'function') {
              this.updateWaveProgressUI();
            }
            
            console.log(`Spawned ${type} enemy at (${x}, ${y})`);
            
            return enemy;
          } catch (error) {
            console.error("Error in spawnEnemy:", error);
            return null;
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
              if (this.spawnTimer) {
                this.spawnTimer.remove();
                this.spawnTimer = null;
              }
              
              if (this.spawnEvent) {
                this.spawnEvent.remove();
                this.spawnEvent = null;
              }
            }
            
            // Ensure enemies array exists
            if (!this.enemies) {
              this.enemies = [];
            }
            
            // Clear any remaining enemies (this ensures we don't get stuck)
            if (this.enemies && this.enemies.length > 0) {
              console.log(`Clearing ${this.enemies.length} remaining enemies`);
              
              // Destroy all remaining enemies
              this.enemies.forEach(enemy => {
                if (enemy && typeof enemy.destroy === 'function') {
                  enemy.destroy();
                }
              });
              
              // Clear the array completely to ensure no lingering references
              this.enemies = [];
            }
            
            // End current wave
            this.waveInProgress = false;
            
            // Increase wave counter
            this.gameState.wave++;
            this.updateWaveText();
            
            // Delay before starting next wave to ensure clean transition
            this.time.delayedCall(500, () => {
              // Start next wave
              this.startWave();
              
              console.log(`Forced start of wave ${this.gameState.wave}`);
              
              // Show notification
              this.showFloatingText(400, 300, `WAVE ${this.gameState.wave} STARTING!`, 0xFFFF00);
              
              // Flash the screen to indicate wave change
              const flash = this.add.rectangle(400, 300, 800, 600, 0xFFFF00, 0.3);
              this.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 500,
                onComplete: () => flash.destroy()
              });
            });
          } catch (error) {
            console.error("Error forcing next wave:", error);
            
            // Emergency recovery - make sure wave progresses even if there's an error
            try {
              this.waveInProgress = false;
              this.isSpawningEnemies = false;
              this.enemies = [];
              this.gameState.wave++;
              
              // Try to start next wave after a short delay
              this.time.delayedCall(1000, () => {
                if (this.gameState && this.gameState.isActive) {
                  this.startWave();
                }
              });
            } catch (recoveryError) {
              console.error("Emergency wave recovery failed:", recoveryError);
            }
          }
        }
        
        createToolbar() {
          try {
            // Create a larger background for the toolbar to accommodate all buttons
            const toolbarBg = this.add.rectangle(200, 550, 420, 65, 0x333333, 0.8);
            
            // LARGER BUTTONS - Increase size from 60x40 to 70x50
            
            // Add attack button
            const attackButton = this.add.rectangle(40, 550, 70, 50, 0xFF4400);
            attackButton.setInteractive({ useHandCursor: true });
            // Set much larger hit area to make it very easy to click
            attackButton.input.hitArea.setTo(-40, -30, 80, 60);
            attackButton.on('pointerdown', () => {
              this.pendingDefensePlacement = false; // Reset placement flag
              this.setToolMode('attack');
            });
            
            const attackText = this.add.text(40, 550, '👆', {
              fontFamily: 'Arial',
              fontSize: '32px' // Increased from 24px
            }).setOrigin(0.5);
            // Make text interactive too for better touch/click response
            attackText.setInteractive({ useHandCursor: true });
            attackText.on('pointerdown', () => {
              this.pendingDefensePlacement = false;
              this.setToolMode('attack');
            });
            
            // Add crop button
            const cropButton = this.add.rectangle(110, 550, 70, 50, 0x006600);
            cropButton.setInteractive({ useHandCursor: true });
            cropButton.input.hitArea.setTo(-40, -30, 80, 60);
            cropButton.on('pointerdown', () => {
              this.pendingDefensePlacement = false; // Reset placement flag
              this.setToolMode('plant');
            });
            
            // IMPORTANT: Always use tree images for crops - NEVER change this!
            let cropImage;
            if (this.textures.exists('Fruit_tree3')) {
              cropImage = this.add.image(110, 550, 'Fruit_tree3');
              cropImage.setDisplaySize(40, 40); // Increased from 32x32
              // Make crop image interactive
              cropImage.setInteractive({ useHandCursor: true });
              cropImage.on('pointerdown', () => {
                this.pendingDefensePlacement = false;
                this.setToolMode('plant');
              });
            } else {
              // Fallback to emoji if image doesn't exist
              cropImage = this.add.text(110, 550, '🌳', {
                fontFamily: 'Arial',
                fontSize: '32px' // Increased from 24px
              }).setOrigin(0.5);
              cropImage.setInteractive({ useHandCursor: true });
              cropImage.on('pointerdown', () => {
                this.pendingDefensePlacement = false;
                this.setToolMode('plant');
              });
            }
            
            // Add scarecrow button (ABS mage)
            const scarecrowButton = this.add.rectangle(180, 550, 70, 50, 0x000066);
            scarecrowButton.setInteractive({ useHandCursor: true });
            scarecrowButton.input.hitArea.setTo(-40, -30, 80, 60);
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
            let absImage;
            if (this.textures.exists(absImageKey)) {
              absImage = this.add.image(180, 550, absImageKey);
              absImage.setDisplaySize(40, 40); // Increased from 32x32
              // Make the image interactive too
              absImage.setInteractive({ useHandCursor: true });
              absImage.on('pointerdown', () => {
                this.pendingDefenseType = 'scarecrow';
                this.pendingDefensePlacement = true;
                this.setToolMode('scarecrow');
                this.showFloatingText(400, 300, "ABS Ice Mage selected - Click map to place", 0x0088FF);
              });
            } else {
              // Fallback to emoji if image doesn't exist
              absImage = this.add.text(180, 550, '🧙‍♂️', {
                fontFamily: 'Arial',
                fontSize: '32px' // Increased from 24px
              }).setOrigin(0.5);
              absImage.setInteractive({ useHandCursor: true });
              absImage.on('pointerdown', () => {
                this.pendingDefenseType = 'scarecrow';
                this.pendingDefensePlacement = true;
                this.setToolMode('scarecrow');
                this.showFloatingText(400, 300, "ABS Ice Mage selected - Click map to place", 0x0088FF);
              });
            }
            
            // Add dog button (NOOT mage)
            const dogButton = this.add.rectangle(250, 550, 70, 50, 0x660000);
            dogButton.setInteractive({ useHandCursor: true });
            dogButton.input.hitArea.setTo(-40, -30, 80, 60);
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
            let nootImage;
            if (this.textures.exists(nootImageKey)) {
              nootImage = this.add.image(250, 550, nootImageKey);
              nootImage.setDisplaySize(40, 40); // Increased from 32x32
              // Make the image interactive too
              nootImage.setInteractive({ useHandCursor: true });
              nootImage.on('pointerdown', () => {
                this.pendingDefenseType = 'dog';
                this.pendingDefensePlacement = true;
                this.setToolMode('dog');
                this.showFloatingText(400, 300, "NOOT Fire Mage selected - Click map to place", 0xFF4400);
              });
            } else {
              // Fallback to emoji if image doesn't exist
              nootImage = this.add.text(250, 550, '🧙‍♀️', {
                fontFamily: 'Arial',
                fontSize: '32px' // Increased from 24px
              }).setOrigin(0.5);
              nootImage.setInteractive({ useHandCursor: true });
              nootImage.on('pointerdown', () => {
                this.pendingDefenseType = 'dog';
                this.pendingDefensePlacement = true;
                this.setToolMode('dog');
                this.showFloatingText(400, 300, "NOOT Fire Mage selected - Click map to place", 0xFF4400);
              });
            }
            
            // Advanced defenses - only if unlocked in the upgrade system
            let wizardButton, cannonButton;
            
            // ALWAYS show the wizard button regardless of upgrade system
            // Add wizard button
            wizardButton = this.add.rectangle(320, 550, 70, 50, 0x990099);
            wizardButton.setInteractive({ useHandCursor: true });
            wizardButton.input.hitArea.setTo(-40, -30, 80, 60);
            wizardButton.on('pointerdown', () => {
              // Select defense without auto-placing
              this.pendingDefenseType = 'wizard';
              this.pendingDefensePlacement = true;
              this.setToolMode('wizard');
              
              // Show message to indicate selection
              this.showFloatingText(400, 300, "Wizard selected - Click map to place", 0xFF00FF);
              
              console.log("Wizard selected, waiting for placement click");
            });
            
            // Use wizard image or emoji
            let wizardImage;
            if (this.textures.exists('wizard_idle')) {
              wizardImage = this.add.image(320, 550, 'wizard_idle');
              wizardImage.setDisplaySize(40, 40); // Increased from 32x32
              // Make image interactive too
              wizardImage.setInteractive({ useHandCursor: true });
              wizardImage.on('pointerdown', () => {
                this.pendingDefenseType = 'wizard';
                this.pendingDefensePlacement = true; 
                this.setToolMode('wizard');
                this.showFloatingText(400, 300, "Wizard selected - Click map to place", 0xFF00FF);
              });
            } else {
              // Fallback to emoji if image doesn't exist
              wizardImage = this.add.text(320, 550, '🧙', {
                fontFamily: 'Arial',
                fontSize: '32px' // Increased from 24px
              }).setOrigin(0.5);
              wizardImage.setInteractive({ useHandCursor: true });
              wizardImage.on('pointerdown', () => {
                this.pendingDefenseType = 'wizard';
                this.pendingDefensePlacement = true;
                this.setToolMode('wizard');
                this.showFloatingText(400, 300, "Wizard selected - Click map to place", 0xFF00FF);
              });
            }
            
            // Add wizard cost
            const wizardCostText = this.add.text(320, 570, '100', {
              fontFamily: 'Arial',
              fontSize: '12px',
              color: '#FFFF00'
            }).setOrigin(0.5);
            
            // Hide wizard by default
            wizardButton.visible = false;
            wizardImage.visible = false;
            wizardCostText.visible = false;
            
            // ALWAYS show the cannon button regardless of upgrade system
            // Add cannon button
            cannonButton = this.add.rectangle(390, 550, 70, 50, 0x990000);
            cannonButton.setInteractive({ useHandCursor: true });
            cannonButton.input.hitArea.setTo(-40, -30, 80, 60);
            cannonButton.on('pointerdown', () => {
              // Select defense without auto-placing
              this.pendingDefenseType = 'cannon';
              this.pendingDefensePlacement = true;
              this.setToolMode('cannon');
              
              // Show message to indicate selection
              this.showFloatingText(400, 300, "Cannon selected - Click map to place", 0xFF0000);
              
              console.log("Cannon selected, waiting for placement click");
            });
            
            // Use cannon image or emoji
            let cannonImage;
            if (this.textures.exists('cannon_idle')) {
              cannonImage = this.add.image(390, 550, 'cannon_idle');
              cannonImage.setDisplaySize(40, 40); // Increased from 32x32
              // Make image interactive too
              cannonImage.setInteractive({ useHandCursor: true });
              cannonImage.on('pointerdown', () => {
                this.pendingDefenseType = 'cannon';
                this.pendingDefensePlacement = true;
                this.setToolMode('cannon');
                this.showFloatingText(400, 300, "Cannon selected - Click map to place", 0xFF0000);
              });
            } else {
              // Fallback to emoji if image doesn't exist
              cannonImage = this.add.text(390, 550, '💣', {
                fontFamily: 'Arial',
                fontSize: '32px' // Increased from 24px
              }).setOrigin(0.5);
              cannonImage.setInteractive({ useHandCursor: true });
              cannonImage.on('pointerdown', () => {
                this.pendingDefenseType = 'cannon';
                this.pendingDefensePlacement = true;
                this.setToolMode('cannon');
                this.showFloatingText(400, 300, "Cannon selected - Click map to place", 0xFF0000);
              });
            }
            
            // Add cannon cost
            const cannonCostText = this.add.text(390, 570, '150', {
              fontFamily: 'Arial',
              fontSize: '12px',
              color: '#FFFF00'
            }).setOrigin(0.5);
            
            // Hide cannon by default
            cannonButton.visible = false;
            cannonImage.visible = false;
            cannonCostText.visible = false;
            
            // Add upgrade button - moved to the right end
            const upgradeButton = this.add.rectangle(460, 550, 70, 50, 0x555500);
            upgradeButton.setInteractive({ useHandCursor: true });
            upgradeButton.input.hitArea.setTo(-40, -30, 80, 60);
            upgradeButton.on('pointerdown', () => this.toggleUpgradePanel());
            
            const upgradeText = this.add.text(460, 550, '⚙️', {
              fontFamily: 'Arial',
              fontSize: '32px' // Increased from 24px
            }).setOrigin(0.5);
            upgradeText.setInteractive({ useHandCursor: true });
            upgradeText.on('pointerdown', () => this.toggleUpgradePanel());
            
            // Store buttons for reference
            this.toolbarButtons = {
              attack: attackButton, // Add the attack button to the reference object
              plant: cropButton,
              scarecrow: scarecrowButton,
              dog: dogButton,
              upgrade: upgradeButton,
              wizard: wizardButton,
              cannon: cannonButton
            };
            
            // Add advanced defense buttons if unlocked
            if (this.upgradeSystem) {
              if (this.upgradeSystem.unlockedDefenses.wizard && wizardButton) {
                this.toolbarButtons.wizard = wizardButton;
              }
              if (this.upgradeSystem.unlockedDefenses.cannon && cannonButton) {
                this.toolbarButtons.cannon = cannonButton;
              }
            }
            
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
            
            // Add upgrade label
            this.add.text(460, 570, 'Upgrade', {
              fontFamily: 'Arial',
              fontSize: '12px',
              color: '#FFFFFF'
            }).setOrigin(0.5);
            
            // Set initial tool to attack mode
            this.setToolMode('attack');
            
            // Initialize advanced defense button visibility
            this.updateAdvancedDefenseButtons();
          } catch (error) {
            console.error("Error creating toolbar:", error);
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
            // Don't allow recursive updates
            if (isUpdating) return;
            isUpdating = true;
            
            // Skip updates if game is not active
            if (!this.gameState.isActive) {
              isUpdating = false;
              return;
            }
            
            // Check if crop placement mode is active
            if (this.toolMode === 'plant' && this.plantingIndicator) {
              // Update crop placement preview on mouse movement
              const pointer = this.input.activePointer;
              this.updatePlacementPreview(pointer);
            } else if (this.isDefenseMode(this.toolMode) && this.pendingDefensePlacement) {
              // Update defense placement preview
              const pointer = this.input.activePointer;
              this.showDefensePlacementIndicator(pointer, this.pendingDefenseType);
            }
            
            // Update defenses
            if (this.defenses && this.defenses.length > 0) {
              this.updateDefenseAttacks();
            }
            
            // Update crops if they exist
            if (this.crops) {
              this.updateCrops();
            }
            
            // Update enemies
            if (this.enemies && this.enemies.length > 0) {
              // Update each enemy
              this.enemies.forEach(enemy => {
                if (enemy && enemy.active) {
                  if (typeof enemy.update === 'function') {
                    enemy.update(delta);
                  } else {
                    console.warn("Enemy missing update method");
                  }
                } else if (enemy && !enemy.active) {
                  // Handle inactive enemies - might need cleanup
                  // Will be handled by the destroy method
                } else {
                  console.warn("Null or undefined enemy in array");
                }
              });
              
              // Clean up null/undefined entries in enemies array
              this.enemies = this.enemies.filter(enemy => enemy != null && enemy !== undefined);
            }
            
            // Check for wave completion
            if (this.waveInProgress && 
                this.enemies.length === 0 && 
                this.enemiesSpawned >= this.totalEnemiesInWave && 
                !this.isSpawningEnemies) {
              this.waveInProgress = false;
              
              // Add a bit of delay before next wave
              this.time.delayedCall(2000, () => {
                if (this.gameState.isActive) {
                  // Reward player for completing the wave
                  const waveReward = Math.ceil(this.gameState.wave * 15); // 15 coins per wave level
                  this.updateFarmCoins(waveReward);
                  this.showFloatingText(400, 300, `Wave ${this.gameState.wave} Complete! +${waveReward} coins`, 0x00FF00);
                  
                  // Start next wave
                  this.gameState.wave++;
                  this.updateWaveText();
                  
                  // Check for defense unlocks after wave increase
                  this.updateAdvancedDefenseButtons();
                  
                  // Start the next wave after a delay
                  this.time.delayedCall(3000, () => {
                    if (this.gameState.isActive) {
                      this.startWave();
                    }
                  });
                }
              });
            }
            
            // Safety check: if game is active but no wave is in progress and we're not spawning enemies
            // This catches situations where the wave transition got stuck
            if (this.gameState?.isActive && 
                !this.waveInProgress && 
                !this.isSpawningEnemies && 
                this.enemies?.length === 0 &&
                time % 5000 < 16) { // Only check occasionally
              console.log("Safety check: game active but no wave in progress - forcing next wave");
              
              // Start next wave
              this.gameState.wave++;
              this.updateWaveText();
              this.startWave();
            }
            
            // Debug info occasionally
            if (time % 5000 < 16) { // roughly every 5 seconds
              console.log(`Active enemies: ${this.enemies.length}, Wave: ${this.gameState.wave}, Coins: ${this.gameState.farmCoins}`);
            }
            
            // Release the update lock
            isUpdating = false;
            
          } catch (error) {
            console.error("Error in update loop:", error);
            isUpdating = false; // Always release the lock
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

        // Toggle the upgrade panel visibility
        toggleUpgradePanel() {
          try {
            if (!this.upgradeSystem) return;
            
            // Get current state
            const isVisible = this.upgradeSystem.uiElements?.panel?.visible || false;
            
            // Toggle visibility
            this.upgradeSystem.setUIVisible(!isVisible);
            
            // Update defense buttons
            this.updateAdvancedDefenseButtons();
            
            console.log(`Upgrade panel ${isVisible ? 'hidden' : 'shown'}`);
          } catch (error) {
            console.error("Error toggling upgrade panel:", error);
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
            // Get defense cost to check affordability
            const cost = type === 'scarecrow' ? 35 : 
                         type === 'dog' ? 50 : 
                         type === 'wizard' ? 100 : 
                         type === 'cannon' ? 150 : 0;
            
            // Only allow placement on right side of map
            const canAfford = this.gameState.farmCoins >= cost;
            const validSide = pointer.x >= 200; // Only allow on right side
            
            // Set indicator color based on affordability and placement area
            let color = 0xFF0000; // Default red for invalid
            
            if (validSide) {
              color = canAfford ? 0x00FF00 : 0xFFFF00; // Green if affordable, yellow if valid position but can't afford
            }
            
            // Don't show if clicking in toolbar area
            if (pointer.y > 520) {
              if (this.plantingIndicator) this.plantingIndicator.visible = false;
              if (this.plantingHelpText) this.plantingHelpText.visible = false;
              return;
            }
            
            // Create or update indicator
            if (!this.plantingIndicator) {
              this.plantingIndicator = this.add.rectangle(pointer.x, pointer.y, 40, 40, color, 0.4);
              this.plantingIndicator.setStrokeStyle(2, color);
            } else {
              this.plantingIndicator.x = pointer.x;
              this.plantingIndicator.y = pointer.y;
              this.plantingIndicator.fillColor = color;
              this.plantingIndicator.strokeColor = color;
              this.plantingIndicator.visible = true;
            }
            
            // Set indicator text based on defense type
            let text = "";
            let textColor = "#FFFFFF";
            
            if (!validSide) {
              text = "Place on RIGHT side only";
              textColor = "#FF0000";
            } else if (!canAfford) {
              text = `Need ${cost} coins`;
              textColor = "#FFFF00";
            } else {
              // Set text based on defense type
              if (type === 'scarecrow') {
                text = "ABS Ice Mage (35 coins)";
                textColor = "#00AAFF";
              } else if (type === 'dog') {
                text = "NOOT Fire Mage (50 coins)";
                textColor = "#FF4400";
              } else if (type === 'wizard') {
                text = "Wizard (100 coins)";
                textColor = "#FF00FF";
              } else if (type === 'cannon') {
                text = "Cannon (150 coins)";
                textColor = "#FF0000";
              }
            }
            
            // Update help text
            if (!this.plantingHelpText) {
              this.plantingHelpText = this.add.text(400, 50, text, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: textColor
              }).setOrigin(0.5);
            } else {
              this.plantingHelpText.setText(text);
              this.plantingHelpText.setColor(textColor);
              this.plantingHelpText.visible = true;
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
            
            // Remove any existing pointermove listener
            if (this.pointerMoveListener) {
              this.input.off('pointermove', this.pointerMoveListener);
              this.pointerMoveListener = null;
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
            if (mode === 'plant' || this.isDefenseMode(mode)) {
              // For defenses, show the range circle that follows the cursor
              if (this.isDefenseMode(mode)) {
                let range = 200; // Default range
                let color = 0x0088FF; // Default color
                
                // Set range and color based on defense type
                if (mode === 'scarecrow') {
                  range = 250;
                  color = 0x0088FF; // Blue for ABS
                } else if (mode === 'dog') {
                  range = 200;
                  color = 0xFF4400; // Red for NOOT
                } else if (mode === 'wizard') {
                  range = 300;
                  color = 0xFF00FF; // Purple for wizard
                } else if (mode === 'cannon') {
                  range = 350;
                  color = 0xFF0000; // Red for cannon
                }
                
                // Create circle if it doesn't exist
                if (!this.placementCircle) {
                  this.placementCircle = this.add.circle(0, 0, range, 0xFFFFFF, 0.2);
                  this.placementCircle.setStrokeStyle(2, color);
                } else {
                  // Update existing circle
                  this.placementCircle.setRadius(range);
                  this.placementCircle.setStrokeStyle(2, color);
                }
                
                // Make sure the circle is visible
                this.placementCircle.setVisible(true);
                
                // Get current pointer position and update placement circle
                const pointer = this.input.activePointer;
                this.placementCircle.x = pointer.x;
                this.placementCircle.y = pointer.y;
                
                // Create a new pointermove listener
                this.pointerMoveListener = (pointer) => {
                  if (this.placementCircle && (this.isDefenseMode(this.toolMode) || this.pendingDefensePlacement)) {
                    this.placementCircle.x = pointer.x;
                    this.placementCircle.y = pointer.y;
                  }
                };
                
                // Add new listener
                this.input.on('pointermove', this.pointerMoveListener);
              }
            }
            
            // Update button highlighting in toolbar
            if (this.toolbarButtons) {
              Object.keys(this.toolbarButtons).forEach(key => {
                const isActive = key === mode;
                if (this.toolbarButtons[key]) {
                  this.toolbarButtons[key].fillColor = this.getToolColor(key, isActive);
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
                infoText = "ABS ICE MAGE: Click to place (35 coins)";
                textColor = 0x0088FF;
                break;
              case 'dog':
                infoText = "NOOT FIRE MAGE: Click to place (50 coins)";
                textColor = 0xFF8800;
                break;
              case 'wizard':
                infoText = "WIZARD: Click to place (100 coins)";
                textColor = 0xFF00FF;
                break;
              case 'cannon':
                infoText = "CANNON: Click to place (150 coins)";
                textColor = 0xFF0000;
                break;
            }
            
            // Show mode change message in center of screen
            this.showFloatingText(400, 300, infoText, textColor);
            
            console.log(`Tool mode set to: ${mode}`);
          } catch (error) {
            console.error("Error setting tool mode:", error);
          }
        }

        // Helper method to check if a mode is a defense mode
        isDefenseMode(mode) {
          return ['scarecrow', 'dog', 'wizard', 'cannon'].includes(mode);
        }

        // Get color for tool buttons
        getToolColor(tool, isActive) {
          const colors = {
            attack: 0x444444,
            plant: 0x444444,
            scarecrow: 0x444444,
            dog: 0x444444,
            upgrade: 0xFFFF00
          };
          
          const activeColors = {
            attack: 0xFF0000,
            plant: 0x00FF00,
            scarecrow: 0x0088FF,
            dog: 0xFF4400,
            upgrade: 0xFFFF00
          };
          
          return isActive ? (activeColors[tool] || 0xFFFFFF) : (colors[tool] || 0x333333);
        }

        placeDefense(x, y, type) {
          try {
            console.log(`Placing defense: ${type} at ${x}, ${y}`);
            
            // Only allow placement on right side
            if (x < 200) {
              this.showFloatingText(x, y, "Place on RIGHT side only!", 0xFF0000);
              return false;
            }
            
            // Check defense costs
            const cost = type === 'scarecrow' ? 35 : 
                         type === 'dog' ? 50 : 
                         type === 'wizard' ? 100 : 
                         type === 'cannon' ? 150 : 0;
            
            // Check if player has enough coins
            if (this.gameState.farmCoins < cost) {
              this.showFloatingText(x, y, `Need ${cost} coins!`, 0xFF0000);
              return false;
            }
            
            // Add the defense
            if (!this.defenses) {
              this.defenses = [];
            }
            
            // Import Defense class if available
            const DefenseClass = this.registry.get('DefenseClass');
            
            // Create the defense using the class or fallback to basic rectangle
            let defense;
            
            if (DefenseClass) {
              defense = new DefenseClass(this, type, x, y);
            } else {
              // Fallback if DefenseClass isn't available
              defense = {
                type,
                x,
                y,
                active: true,
                range: type === 'scarecrow' ? 250 : 
                       type === 'dog' ? 200 : 
                       type === 'wizard' ? 300 : 
                       type === 'cannon' ? 350 : 200,
                sprite: this.add.rectangle(x, y, 40, 40, 
                  type === 'scarecrow' ? 0x0088FF : 
                  type === 'dog' ? 0xFF4400 : 
                  type === 'wizard' ? 0xFF00FF : 
                  type === 'cannon' ? 0xFF0000 : 0x666666)
              };
              
              // Add defense type text
              const emojiMap = {
                'scarecrow': '🧙‍♂️',
                'dog': '🧙‍♀️',
                'wizard': '🧙',
                'cannon': '💣'
              };
              
              const emoji = emojiMap[type] || '❓';
              defense.label = this.add.text(x, y, emoji, {
                fontSize: '24px',
                fontFamily: 'Arial'
              }).setOrigin(0.5);
            }
            
            // Add to defenses array
            this.defenses.push(defense);
            
            // Deduct coins
            this.updateFarmCoins(-cost);
            
            // Show confirmation text
            const defenseNames = {
              'scarecrow': 'ABS Ice Mage',
              'dog': 'NOOT Fire Mage',
              'wizard': 'Wizard',
              'cannon': 'Cannon'
            };
            
            const defenseName = defenseNames[type] || type;
            this.showFloatingText(x, y - 50, `${defenseName} placed!`, 0x00FF00);
            
            console.log(`Placed ${type} defense at ${x}, ${y}`);
            
            // Reset the tool mode to attack
            if (this.pendingDefensePlacement) {
              this.pendingDefensePlacement = false;
              
              // Hide placement indicators
              if (this.plantingIndicator) {
                this.plantingIndicator.visible = false;
              }
              
              if (this.plantingHelpText) {
                this.plantingHelpText.visible = false;
              }
              
              if (this.placementCircle) {
                this.placementCircle.visible = false;
              }
            }
            
            return true;
          } catch (error) {
            console.error("Error placing defense:", error);
            return false;
          }
        }

        verifyTextureLoading() {
          try {
            // Log all available textures for debugging
            if (this.textures) {
              const textureKeys = Object.keys(this.textures.list);
              console.log(`Available textures (${textureKeys.length}):`, textureKeys.join(', '));
            }
          } catch (error) {
            console.error("Error verifying textures:", error);
          }
        }
        
        // Create fallback textures for advanced defenses
        createAdvancedDefenseTextures() {
          try {
            console.log("Checking for advanced defense textures");
            
            // Only create fallback textures if the actual textures aren't loaded
            // Wizard textures
            if (!this.textures.exists('wizard_idle')) {
              console.log("Creating fallback wizard_idle texture");
              const wizardGraphics = this.make.graphics();
              wizardGraphics.fillStyle(0xFF00FF, 1);
              wizardGraphics.fillCircle(20, 20, 20);
              wizardGraphics.fillStyle(0x9900CC, 1);
              wizardGraphics.fillTriangle(10, 20, 30, 20, 20, 0);
              wizardGraphics.generateTexture('wizard_idle', 40, 40);
            }
            
            if (!this.textures.exists('wizard_attack')) {
              console.log("Creating fallback wizard_attack texture");
              if (this.textures.exists('wizard_idle')) {
                // Replace addKey with the correct way to reuse a texture
                const idleTexture = this.textures.get('wizard_idle');
                this.textures.addImage('wizard_attack', idleTexture.getSourceImage());
              } else {
                const wizardGraphics = this.make.graphics();
                wizardGraphics.fillStyle(0xFF00FF, 1);
                wizardGraphics.fillCircle(20, 20, 18);
                wizardGraphics.fillStyle(0x9900CC, 1);
                wizardGraphics.fillTriangle(10, 20, 30, 20, 20, 0);
                wizardGraphics.generateTexture('wizard_attack', 40, 40);
              }
            }
            
            // Create cannon textures
            if (!this.textures.exists('cannon_idle')) {
              console.log("Creating fallback cannon_idle texture");
              const cannonGraphics = this.make.graphics();
              cannonGraphics.fillStyle(0x666666, 1);
              cannonGraphics.fillRect(10, 20, 20, 15);
              cannonGraphics.fillStyle(0xFF0000, 1);
              cannonGraphics.fillRect(18, 10, 15, 10);
              cannonGraphics.generateTexture('cannon_idle', 40, 40);
            }
            
            if (!this.textures.exists('cannon_attack')) {
              console.log("Creating fallback cannon_attack texture");
              if (this.textures.exists('cannon_idle')) {
                // Replace addKey with the correct way to reuse a texture
                const idleTexture = this.textures.get('cannon_idle');
                this.textures.addImage('cannon_attack', idleTexture.getSourceImage());
              } else {
                const cannonGraphics = this.make.graphics();
                cannonGraphics.fillStyle(0x666666, 1);
                cannonGraphics.fillRect(10, 20, 20, 15);
                cannonGraphics.fillStyle(0xFF0000, 1);
                cannonGraphics.fillRect(18, 10, 15, 10);
                cannonGraphics.generateTexture('cannon_attack', 40, 40);
              }
            }
            
            console.log("Defense textures verified successfully");
          } catch (error) {
            console.error("Error creating fallback textures:", error);
          }
        }

        // Display large wave start text animation in the center of the screen
        showWaveStartText(waveNumber) {
          try {
            // Create large centered text
            const waveText = this.add.text(400, 300, `WAVE ${waveNumber}`, {
              fontFamily: 'Arial',
              fontSize: '48px',
              color: '#FFFF00',
              stroke: '#000000',
              strokeThickness: 5,
              align: 'center'
            }).setOrigin(0.5);
            
            // Set initial scale and alpha
            waveText.setScale(0.5);
            waveText.setAlpha(0);
            
            // Create animation sequence
            this.tweens.add({
              targets: waveText,
              scale: 1.2,
              alpha: 1,
              duration: 1000,
              ease: 'Bounce.easeOut',
              onComplete: () => {
                // Second animation to fade out
                this.tweens.add({
                  targets: waveText,
                  scale: 1.5,
                  alpha: 0,
                  duration: 800,
                  delay: 500,
                  onComplete: () => waveText.destroy()
                });
              }
            });
            
            // Add additional flair - particles or effect if supported
            if (this.particles) {
              const emitter = this.particles.createEmitter({
                x: 400,
                y: 300,
                speed: { min: -100, max: 100 },
                scale: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                lifespan: 1000,
                quantity: 20
              });
              
              // Stop and destroy after a short time
              this.time.delayedCall(2000, () => {
                emitter.stop();
                this.time.delayedCall(1000, () => emitter.remove());
              });
            }
          } catch (error) {
            console.error("Error showing wave start text:", error);
          }
        }

        // Update and process crops - ensure they are harvestable
        updateCrops() {
          try {
            // Skip if crops object doesn't exist or is empty
            if (!this.crops || Object.keys(this.crops).length === 0) {
              return;
            }
            
            // Process each crop
            Object.values(this.crops).forEach(crop => {
              if (!crop || !crop.isActive) return;
              
              // Call crop's update method if it exists
              if (typeof crop.update === 'function') {
                crop.update();
              }
              
              // CRITICAL FIX: Make sure harvestable crops respond to clicks
              if (crop.isHarvestable && crop.setInteractive && !crop.input) {
                crop.setInteractive({ useHandCursor: true });
                
                // Re-bind pointerdown event if it was lost
                crop.on('pointerdown', () => {
                  if (crop.isHarvestable) {
                    // Ensure we directly call the harvest method with proper this context
                    crop.harvest();
                    
                    // Show floating text as additional feedback
                    const yieldAmount = crop.calculateYield ? crop.calculateYield() : crop.value || 2;
                    this.showFloatingText(crop.x, crop.y, `+${yieldAmount}`, 0xFFFF00);
                    
                    console.log(`Manually harvested crop at ${crop.x},${crop.y} for ${yieldAmount} coins`);
                  }
                });
              }
              
              // Make sure the harvestable indicator is visible
              if (crop.isHarvestable && crop.harvestIndicator) {
                crop.harvestIndicator.setVisible(true);
              }
              
              // Debug: randomly log crop status
              if (Math.random() < 0.001) {
                console.log(`Crop at ${crop.x},${crop.y}: Active=${crop.isActive}, Harvestable=${crop.isHarvestable}, GrowthProgress=${crop.growthProgress}/${crop.maxGrowth}`);
              }
            });
          } catch (error) {
            console.error("Error updating crops:", error);
          }
        }

        // Update defense button visibility based on unlocks
        updateAdvancedDefenseButtons() {
          if (!this.upgradeSystem) return;
          
          try {
            // Update wizard button
            if (this.toolbarButtons.wizard) {
              const wizardVisible = this.upgradeSystem.isDefenseUnlocked('wizard');
              this.toolbarButtons.wizard.visible = wizardVisible;
              
              // Also update the associated image and cost text
              const wizardImage = this.children.list.find(child => 
                (child.type === 'Image' && child.texture.key === 'wizard_idle') ||
                (child.type === 'Text' && child.text === '🧙')
              );
              
              const wizardCost = this.children.list.find(child => 
                child.type === 'Text' && 
                child.text === '100' && 
                Math.abs(child.x - 320) < 5 && 
                Math.abs(child.y - 570) < 5
              );
              
              if (wizardImage) wizardImage.visible = wizardVisible;
              if (wizardCost) wizardCost.visible = wizardVisible;
              
              // Show notification when first unlocked
              if (wizardVisible && !this.wizardUnlockNotified) {
                this.showFloatingText(400, 300, "Wizard Defense Unlocked!", 0xFF00FF);
                this.wizardUnlockNotified = true;
              }
            }
            
            // Update cannon button
            if (this.toolbarButtons.cannon) {
              const cannonVisible = this.upgradeSystem.isDefenseUnlocked('cannon');
              this.toolbarButtons.cannon.visible = cannonVisible;
              
              // Also update the associated image and cost text
              const cannonImage = this.children.list.find(child => 
                (child.type === 'Image' && child.texture.key === 'cannon_idle') ||
                (child.type === 'Text' && child.text === '💣')
              );
              
              const cannonCost = this.children.list.find(child => 
                child.type === 'Text' && 
                child.text === '150' && 
                Math.abs(child.x - 390) < 5 && 
                Math.abs(child.y - 570) < 5
              );
              
              if (cannonImage) cannonImage.visible = cannonVisible;
              if (cannonCost) cannonCost.visible = cannonVisible;
              
              // Show notification when first unlocked
              if (cannonVisible && !this.cannonUnlockNotified) {
                this.showFloatingText(400, 300, "Cannon Defense Unlocked!", 0xFF0000);
                this.cannonUnlockNotified = true;
              }
            }
          } catch (error) {
            console.error("Error updating advanced defense buttons:", error);
          }
        }

        createParticleAnimations() {
          try {
            // Fire+Sparks animation
            this.anims.create({
              key: 'fire_sparks_anim',
              frames: this.anims.generateFrameNumbers('fire_particle', { start: 0, end: 7 }),
              frameRate: 12,
              repeat: -1
            });
            
            // Rocket Fire animation
            this.anims.create({
              key: 'rocket_fire_anim',
              frames: this.anims.generateFrameNumbers('rocket_fire', { start: 0, end: 7 }),
              frameRate: 12,
              repeat: -1
            });
            
            console.log('Particle animations created successfully');
          } catch (error) {
            console.error('Error creating particle animations:', error);
          }
        }

        createMagicAura() {
          // ... existing code ...
        }
        
        // Create hit effect when projectile hits target
        createHitEffect(x, y, defenseType) {
          try {
            if (!this || !this.add) return;
            
            // Determine effect color based on defense type
            let color = 0xff0000;
            let particleTexture = 'pixel';
            
            switch (defenseType) {
              case 'ABS': // Ice Mage
                color = 0x66ccff;
                break;
              case 'NOOT': // Fire Mage
                color = 0xff6600;
                break;
              case 'wizard':
                color = 0xff00ff;
                break;
              case 'cannon':
                color = 0xff0000;
                break;
            }
            
            // Create impact particle
            const particles = this.add.particles(x, y, particleTexture, {
              speed: { min: 50, max: 150 },
              scale: { start: 1, end: 0 },
              tint: color,
              blendMode: 'ADD',
              lifespan: 300,
              quantity: 15
            });
            
            // Clean up after animation completes
            this.time.delayedCall(300, () => {
              particles.destroy();
            });
          } catch (error) {
            console.error("Error creating hit effect:", error);
          }
        }
        
        createCombatAura() {
          // ... existing code ...
        }
        
        // Clean up resources when scene is shutdown or destroyed
        shutdown() {
          try {
            console.log("GameScene shutting down, cleaning up resources");
            
            // Clean up wave check interval
            if (this.waveCheckInterval) {
              this.waveCheckInterval.remove();
              this.waveCheckInterval = null;
            }
            
            // Clean up any other timers or events
            if (this.spawnTimer) {
              this.spawnTimer.remove();
              this.spawnTimer = null;
            }
            
            if (this.spawnEvent) {
              this.spawnEvent.remove();
              this.spawnEvent = null;
            }
            
            // Clean up pointer event listeners
            if (this.pointerMoveListener) {
              this.input.off('pointermove', this.pointerMoveListener);
              this.pointerMoveListener = null;
            }
            
            // Remove any placement UI elements
            if (this.placementCircle) {
              this.placementCircle.destroy();
              this.placementCircle = null;
            }
            
            if (this.placementPreview) {
              this.placementPreview.destroy();
              this.placementPreview = null;
            }
            
            if (this.defensePreview) {
              this.defensePreview.destroy();
              this.defensePreview = null;
            }
            
            console.log("GameScene resources cleaned up");
          } catch (error) {
            console.error("Error in shutdown method:", error);
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