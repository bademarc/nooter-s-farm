/**
 * Wave Progression Direct Fix
 * 
 * This script can be directly included in the game HTML to fix wave progression issues.
 * It patches the Enemy.destroy method and adds wave progression safety checks.
 */

(function() {
  console.log("Loading wave progression direct fix...");
  
  // Wait for the game to initialize
  const checkInterval = setInterval(function() {
    try {
      // Check if the game functions are available
      if (window.gameFunctions) {
        clearInterval(checkInterval);
        applyFix();
      }
    } catch (error) {
      console.error("Error checking game availability:", error);
    }
  }, 1000);
  
  // Apply the wave progression fix
  function applyFix() {
    console.log("Applying wave progression fix...");
    
    try {
      // Find game iframe if it exists
      const gameIframe = document.querySelector('iframe');
      const targetWindow = gameIframe ? gameIframe.contentWindow : window;
      
      // Function to patch the game scene
      function patchGameScene() {
        // Modified forceNextWave function with better error handling
        function improvedForceNextWave() {
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
        
        // Safety check function for the update method
        function updateSafetyChecks(time) {
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
        }
        
        // Run code in the target window
        targetWindow.eval(`
          (function() {
            try {
              // Check if we can access the game scene
              const getGameScene = function() {
                if (window.gameInstanceRef && window.gameInstanceRef.current) {
                  return window.gameInstanceRef.current.scene.getScene('GameScene');
                }
                return null;
              };
              
              const gameScene = getGameScene();
              if (gameScene) {
                console.log("Found game scene, patching methods...");
                
                // Patch the forceNextWave method
                gameScene.forceNextWave = ${improvedForceNextWave.toString()};
                
                // Patch the update method to add safety checks
                const originalUpdate = gameScene.update;
                gameScene.update = function(time, delta) {
                  // Call the original update
                  originalUpdate.call(this, time, delta);
                  
                  // Add our safety checks
                  (${updateSafetyChecks.toString()}).call(this, time);
                };
                
                // Also ensure the wave progression check is running
                window.waveCheckInterval = setInterval(function() {
                  try {
                    const scene = getGameScene();
                    if (!scene) return;
                    
                    // Check for completed waves that didn't progress
                    if (scene.gameState?.isActive && 
                        scene.enemies?.length === 0 && 
                        !scene.isSpawningEnemies &&
                        scene.enemiesSpawned >= scene.totalEnemiesInWave &&
                        scene.waveInProgress) {
                      
                      console.log("Wave completion detected, forcing next wave");
                      scene.forceNextWave();
                    }
                  } catch(err) {
                    console.error("Error in wave check interval:", err);
                  }
                }, 2000);
                
                console.log("Wave progression fix applied successfully!");
              } else {
                console.log("Game scene not found yet, will retry...");
                // Retry later
                setTimeout(arguments.callee, 2000);
              }
            } catch(error) {
              console.error("Error applying wave progression fix:", error);
            }
          })();
        `);
      }
      
      // Start patching
      patchGameScene();
      
      console.log("Wave progression fix initialized");
    } catch (error) {
      console.error("Failed to apply wave progression fix:", error);
    }
  }
})(); 