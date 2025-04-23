'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import dynamic from 'next/dynamic';

// Preload entity classes to avoid repeated dynamic imports during gameplay
let PhaserLoaded = false;
let EnemyClass = null;
let CropClass = null;
let GameSceneClass = null;

// Create a dynamic component with SSR disabled
const FarmGameInner = ({ farmCoins, addFarmCoins }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isClient = useRef(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [localFarmCoins, setLocalFarmCoins] = useState(0);
  const gameContainerRef = useRef(null);
  const gameInstanceRef = useRef(null);
  const gameModulesRef = useRef({ 
    Enemy: null, 
    Crop: null, 
    GameScene: null 
  });
  const initializationAttempted = useRef(false);
  const { toast } = useToast();
  
  // Add a check for mobile screens
  const [isMobile, setIsMobile] = useState(false);
  
  // Add mobile detection
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Mount effect
  useEffect(() => {
    console.log("FarmGame mounted on client side");
    isClient.current = true;
    
    // Trigger initialization once after mount
    initializeGame(farmCoins, addFarmCoins); 

    // Cleanup function remains the same
    return () => {
      console.log("FarmGame unmounting, cleaning up...");
      if (gameInstanceRef.current) {
        try {
          console.log("Destroying game instance");
          gameInstanceRef.current.destroy(true);
          gameInstanceRef.current = null;
        } catch (error) {
          console.error("Error destroying game on unmount:", error);
        }
      }
      isClient.current = false;
    };
  }, []);

  // Preload game modules once to prevent repeated dynamic imports
  const preloadGameModules = async () => {
    try {
      if (!PhaserLoaded) {
        console.log("Loading Phaser and game modules (first time)...");
        
        // Load Phaser with proper error handling
        console.log("Loading Phaser module...");
        let Phaser;
        try {
          const PhaserModule = await import('phaser');
          Phaser = PhaserModule.default;
          console.log("Phaser module loaded:", !!Phaser);
        } catch (error) {
          console.error("Failed to load Phaser:", error);
          setHasError(true);
          throw new Error("Failed to load Phaser module: " + error.message);
        }
        
        // Load Enemy module with error handling
        console.log("Loading Enemy module...");
        try {
          const enemyModule = await import('./entities/Enemy');
          EnemyClass = enemyModule.default;
          console.log("Enemy module loaded:", !!EnemyClass);
        } catch (error) {
          console.error("Failed to load Enemy module:", error);
          setHasError(true);
          throw new Error("Failed to load Enemy module: " + error.message);
        }
        
        // Load Crop module with error handling
        console.log("Loading Crop module...");
        try {
          const cropModule = await import('./entities/Crop');
          CropClass = cropModule.default;
          console.log("Crop module loaded:", !!CropClass);
        } catch (error) {
          console.error("Failed to load Crop module:", error);
          setHasError(true);
          throw new Error("Failed to load Crop module: " + error.message);
        }
        
        // Load GameScene module with error handling
        console.log("Loading GameScene module...");
        try {
          const gameSceneModule = await import('./scenes/GameScene');
          GameSceneClass = gameSceneModule.GameScene;
          console.log("GameScene loaded:", !!GameSceneClass);
        } catch (error) {
          console.error("Failed to load GameScene module:", error);
          setHasError(true);
          throw new Error("Failed to load GameScene module: " + error.message);
        }
        
        // Verify all modules are loaded
        if (!Phaser || !EnemyClass || !CropClass || !GameSceneClass) {
          throw new Error("Failed to load one or more game modules");
        }
        
        PhaserLoaded = true;
        console.log("All game modules loaded and cached successfully");
        
        // Store modules in ref for use
        gameModulesRef.current = {
          Phaser,
          Enemy: EnemyClass,
          Crop: CropClass,
          GameScene: GameSceneClass
        };
        
        return Phaser;
      } else {
        console.log("Using cached game modules");
        return gameModulesRef.current.Phaser;
      }
    } catch (error) {
      console.error("Error preloading game modules:", error);
      setHasError(true);
      throw error;
    }
  };

  // Initialize game - Now takes dependencies as arguments
  const initializeGame = useCallback(async (initialFarmCoins, addFarmCoinsCallback) => {
    if (!isClient.current || !gameContainerRef.current || isInitializing || gameInstanceRef.current) {
      console.log("Skipping game initialization (guard check):", {
        isClient: isClient.current,
        hasContainer: !!gameContainerRef.current,
        isInitializing,
        hasGameInstance: !!gameInstanceRef.current
      });
      return;
    }

    setIsInitializing(true);
    console.log("Starting game initialization...");

    try {
      let Phaser;
      try {
        Phaser = await preloadGameModules();
      } catch (error) {
        console.error("Failed to use preloaded modules, trying direct import:", error);
        
        // Try loading Phaser directly as fallback
        const PhaserModule = await import('phaser').catch(err => {
          console.error("Direct Phaser import failed:", err);
          throw new Error("All Phaser loading methods failed");
        });
        Phaser = PhaserModule.default;
      }

      if (!Phaser) {
        throw new Error("Failed to load Phaser module after all attempts");
      }

      // Load game modules individually with error handling
      console.log("Loading game modules individually...");
      let EnemyClass, CropClass, DefenseClass, UpgradeClass, GameSceneClass;
      
      try {
        const [EnemyModule, CropModule, DefenseModule, UpgradeModule, GameSceneModule] = await Promise.allSettled([
          import('./entities/Enemy'),
          import('./entities/Crop'),
          import('./entities/Defense'),
          import('./entities/Upgrade'),
          import('./scenes/GameScene')
        ]);

        // Handle each module individually
        if (EnemyModule.status === 'fulfilled') {
          EnemyClass = EnemyModule.value.default;
        } else {
          console.error("Failed to load Enemy module:", EnemyModule.reason);
          throw new Error("Failed to load Enemy module");
        }
        
        if (CropModule.status === 'fulfilled') {
          CropClass = CropModule.value.default;
        } else {
          console.error("Failed to load Crop module:", CropModule.reason);
          throw new Error("Failed to load Crop module");
        }
        
        if (DefenseModule.status === 'fulfilled') {
          DefenseClass = DefenseModule.value.default;
        } else {
          console.error("Failed to load Defense module:", DefenseModule.reason);
          throw new Error("Failed to load Defense module");
        }
        
        if (UpgradeModule.status === 'fulfilled') {
          UpgradeClass = UpgradeModule.value.default;
        } else {
          console.error("Failed to load Upgrade module:", UpgradeModule.reason);
          throw new Error("Failed to load Upgrade module");
        }
        
        if (GameSceneModule.status === 'fulfilled') {
          GameSceneClass = GameSceneModule.value.GameScene;
        } else {
          console.error("Failed to load GameScene module:", GameSceneModule.reason);
          throw new Error("Failed to load GameScene module");
        }
      } catch (error) {
        console.error("Error loading game modules:", error);
        setHasError(true);
        throw error;
      }

      // Use the passed initialFarmCoins
      const safeFarmCoins = Math.min(Number(initialFarmCoins) || 0, 1000000);

      // Create game configuration
      const config = {
        type: Phaser.AUTO,
        parent: gameContainerRef.current,
        width: 800,
        height: 600,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
        scene: GameSceneClass,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 800,
          height: 600,
          min: {
            width: 320,
            height: 240
          },
          max: {
            width: 1600,
            height: 1200
          },
          autoRound: true
        },
        render: {
          pixelArt: false,
          antialias: true,
          roundPixels: true,
          transparent: false
        },
        autoFocus: true,
        disableContextMenu: true
      };

      console.log("Creating game instance with config:", config);
      const game = new Phaser.Game(config);
      gameInstanceRef.current = game;
      window.game = game;

      // Store classes in game registry
      game.registry.set('EnemyClass', EnemyClass);
      game.registry.set('CropClass', CropClass);
      game.registry.set('DefenseClass', DefenseClass);
      game.registry.set('UpgradeClass', UpgradeClass);
      game.registry.set('farmCoins', safeFarmCoins);

      // Store the addFarmCoins callback correctly
      if (typeof addFarmCoinsCallback === 'function') {
        game.registry.set('addFarmCoins', (amount) => {
          try {
            console.log(`[Phaser Registry] Calling addFarmCoinsCallback with: ${amount}`);
            addFarmCoinsCallback(amount); 
          } catch (error) {
            console.error("Error in registry addFarmCoins callback:", error);
          }
        });
      } else {
        console.error("addFarmCoins callback was not provided to initializeGame");
      }

      // Wait for the game to be ready
      game.events.once('ready', () => {
        console.log("Game is ready!");
        setGameStarted(true);
      });

      console.log("Game initialization complete!");
    } catch (error) {
      console.error("Error initializing game:", error);
      setHasError(true);
    } finally {
        setIsInitializing(false);
    }
  }, [isInitializing]);

  // Wave progression check
  useEffect(() => {
    if (!isClient.current || !gameInstanceRef.current || !gameStarted) return;
    
    /* // Remove this interval - wave progression is handled in GameScene.js update loop
    const checkWaveProgression = setInterval(() => {
      try {
        const scene = gameInstanceRef.current?.scene?.getScene('GameScene');
        if (!scene) return;
        
        if (scene?.gameState?.isActive && 
            Array.isArray(scene.enemies) && 
            scene.enemies.length === 0 && 
            !scene.isSpawningEnemies &&
            scene.enemiesSpawned >= scene.totalEnemiesInWave) {
          
          console.log("Wave completion check: no enemies left");
          
          if (typeof scene.forceNextWave === 'function') {
            console.log("Forcing next wave");
            scene.forceNextWave();
          }
        }
      } catch (err) {
        console.error("Error in wave progression check:", err);
      }
    }, 1000); // Check every second
    
    return () => clearInterval(checkWaveProgression);
    */
  }, [isClient, gameStarted]);

  // Add reset game method
  const resetGame = useCallback(() => {
    if (gameInstanceRef.current) {
      try {
        // Reset farm coins to 0
        const safeFarmCoins = 0;
        addFarmCoins(-farmCoins); // Reset to 0 by subtracting current amount
        
        // Reset game instance
        const scene = gameInstanceRef.current.scene.getScene('GameScene');
        if (scene) {
          // Reset game state
          scene.gameState = {
            isActive: false,
            isPaused: false,
            score: 0,
            lives: 3,
            wave: 1,
            farmCoins: safeFarmCoins,
            clickDamage: 1,
            canPlant: true
          };
          
          // Clear all enemies
          scene.enemies.forEach(enemy => {
            if (enemy && enemy.destroy) {
              enemy.destroy();
            }
          });
          scene.enemies = [];
          
          // Clear all crops
          Object.values(scene.crops).forEach(crop => {
            if (crop && crop.destroy) {
              crop.destroy();
            }
          });
          scene.crops = {};
          
          // Clear all defenses
          if (Array.isArray(scene.defenses)) {
            scene.defenses.forEach(defense => {
              if (defense && defense.destroy) {
                defense.destroy();
              }
            });
            scene.defenses = [];
          }
          
          // Reset wave state
          scene.isSpawningEnemies = false;
          scene.enemiesSpawned = 0;
          scene.totalEnemiesInWave = 0;
          
          // Update UI
          if (scene.waveText) {
            scene.waveText.setText(`Wave: 1`);
          }
          if (scene.scoreText) {
            scene.scoreText.setText(`Score: 0`);
          }
          if (scene.livesText) {
            scene.livesText.setText(`Lives: 3`);
          }
          
          // Show start button again
          scene.showStartButton();
          
          console.log("Game reset successfully");
        }
      } catch (err) {
        console.error("Error resetting game:", err);
      }
    }
  }, [farmCoins, addFarmCoins]);

  // Expose reset game method to parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create a global object to store game functions
      if (!window.gameFunctions) {
        window.gameFunctions = {};
      }
      window.gameFunctions.resetGame = resetGame;
    }
  }, [resetGame]);

  return (
    <div className={`w-full flex ${isMobile ? 'flex-col' : 'flex-row'} items-start justify-center`}>
      {/* Left side text - hidden or condensed on mobile */}
      {!isMobile && (
        <div className="w-64 mr-4 text-white">
          <h2 className="text-xl font-bold mb-4">Farm Area</h2>
          <div className="bg-black/30 p-4 rounded-lg">
            <p className="mb-2">🌾 Plant crops here to earn coins</p>
            <p className="mb-2">💰 Each crop costs 5 Farm Coins</p>
            <p className="mb-2">⏱️ Crops grow over time</p>
            <p className="mb-2">🔄 Harvest crops for coins</p>
          </div>
          
          <h2 className="text-xl font-bold mt-6 mb-4">Controls</h2>
          <div className="bg-black/30 p-4 rounded-lg">
            <p className="mb-2">👆 Click enemies to attack</p>
            <p className="mb-2">P - Plant crops mode</p>
            <p className="mb-2">1 - Place ABSTER Mage (35 coins)</p>
            <p className="mb-2">2 - Place NOOT Mage (50 coins)</p>
          </div>
          
          {isClient.current && (
            <div className="mt-6 bg-black/30 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-2">Stats</h2>
              <p className="mb-2">Farm Coins: {localFarmCoins.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Mobile controls banner - only shown on mobile */}
      {isMobile && isClient.current && (
        <div className="w-full mb-2 p-2 bg-black/30 text-white text-sm flex justify-between items-center">
          <div>💰 {localFarmCoins.toLocaleString()} coins</div>
          <div>👆 Tap to attack</div>
        </div>
      )}
      
      {/* Game container - with responsive classes based on mobile or desktop */}
      <div className={`${isMobile ? 'w-full' : 'w-[800px]'} ${isMobile ? 'h-[450px]' : 'h-[600px]'} bg-black/20 border border-white/10`} ref={gameContainerRef}>
        {(!isClient.current || isInitializing) && (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-white">{isInitializing ? "Initializing game..." : "Loading game..."}</p>
          </div>
        )}
        {hasError && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 text-lg mb-2">Failed to load game</p>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Right side text - hidden or condensed on mobile */}
      {!isMobile && (
        <div className="text-white p-4 w-1/5">
          <div className="Right Side Text">
            <div className="mt-5 pt-2">
              <h3 className="text-xl mb-3 font-bold text-blue-100">Defense Area: <span className="text-yellow-300">Penguin Mages</span></h3>
              <p className="mb-2">Place penguin mages on the right side to defend against waves of enemies:</p>
              <ul className="list-disc pl-5 mb-4">
                <li className="mb-1"><span style={{color: '#0088FF'}}><strong>ABS Ice Mage</strong> (35 coins)</span>: Freezes flying enemies, slowing them down</li>
                <li className="mb-1"><span style={{color: '#FF4400'}}><strong>NOOT Fire Mage</strong> (50 coins)</span>: Burns ground enemies, dealing heavy damage</li>
              </ul>
              <p className="text-sm mt-2">Enemies come from the right side - protect your crops from being destroyed!</p>
            </div>
            
            <div className="mt-4 pt-2 border-t border-gray-700">
              <h3 className="text-lg mb-2 font-bold text-blue-100">Game Info</h3>
              <ul className="text-sm list-disc pl-5">
                <li className="mb-1">You have <span className="text-red-400 font-bold">3 lives</span>. Lose all to game over!</li>
                <li className="mb-1">Each <span className="text-yellow-300 font-bold">wave</span> brings stronger enemies</li>
                <li className="mb-1">Earn <span className="text-yellow-300 font-bold">coins</span> from crops and defeating enemies</li>
              </ul>
            </div>
            
            <div className="mt-6">
              <button 
                className="py-2 px-4 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded hover:from-red-500 hover:to-red-700 transition-all shadow-md"
                onClick={() => {
                  if (gameInstanceRef.current) {
                    try {
                      const scene = gameInstanceRef.current.scene.getScene('GameScene');
                      if (scene && scene.forceNextWave) {
                        scene.forceNextWave();
                      } else {
                        console.log("Scene or forceNextWave method not found");
                      }
                    } catch (error) {
                      console.error("Error forcing next wave:", error);
                    }
                  }
                }}
              >
                Force Next Wave
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile controls footer - only shown on mobile */}
      {isMobile && (
        <div className="w-full mt-2 p-2 bg-black/30 text-white text-sm flex justify-between items-center">
          <button 
            className="py-1 px-2 bg-blue-600 text-white text-xs rounded"
            onClick={() => {
              if (gameInstanceRef.current) {
                try {
                  const scene = gameInstanceRef.current.scene.getScene('GameScene');
                  if (scene && scene.forceNextWave) {
                    scene.forceNextWave();
                  }
                } catch (error) {
                  console.error("Error forcing next wave:", error);
                }
              }
            }}
          >
            Force Next Wave
          </button>
          <div className="flex space-x-2">
            <button className="py-1 px-2 bg-green-600 text-white text-xs rounded">P</button>
            <button className="py-1 px-2 bg-amber-600 text-white text-xs rounded">1</button>
            <button className="py-1 px-2 bg-purple-600 text-white text-xs rounded">2</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Create a wrapper that only renders the game component on the client side
const FarmGame = (props) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only render the game component on the client side
  if (!mounted) {
    return (
      <div className="w-full max-w-[800px] h-[600px] bg-black/20 border border-white/10 mb-4 flex items-center justify-center">
        <p className="text-white">Loading game...</p>
      </div>
    );
  }
  
  return <FarmGameInner {...props} />;
};

// Export as default
export default FarmGame; 