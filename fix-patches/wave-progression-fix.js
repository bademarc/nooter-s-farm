// Wave Progression Fix
// This file contains fixes for the wave progression in the farm game

/**
 * Improved wave progression checker
 * This code should be included in the FarmGame.js's useEffect for wave checking
 */
function checkWaveProgression() {
  if (!gameInstanceRef.current?.scene) return;
  
  try {
    const scene = gameInstanceRef.current.scene.getScene('GameScene');
    if (!scene) {
      console.log("No GameScene found, skipping wave check");
      return;
    }
    
    // Debug info to track wave state
    if (scene.gameState?.isActive) {
      console.log(`Wave check: enemies=${scene.enemies?.length || 0}, spawning=${scene.isSpawningEnemies}, spawned=${scene.enemiesSpawned || 0}/${scene.totalEnemiesInWave || 0}, inProgress=${scene.waveInProgress}`);
    }
    
    // First condition: All enemies defeated, no more spawning
    const allEnemiesDefeated = 
      scene?.gameState?.isActive && 
      Array.isArray(scene.enemies) && 
      scene.enemies.length === 0 && 
      !scene.isSpawningEnemies &&
      scene.enemiesSpawned >= scene.totalEnemiesInWave &&
      scene.waveInProgress;
    
    // Second condition: Wave complete but next wave not started
    const waveCompleteButStuck = 
      scene?.gameState?.isActive && 
      Array.isArray(scene.enemies) && 
      scene.enemies.length === 0 && 
      !scene.isSpawningEnemies &&
      !scene.waveInProgress && 
      scene.gameState.wave > 0;
      
    // Third condition: Game active but no wave in progress
    const gameActiveButNoWave = 
      scene?.gameState?.isActive &&
      !scene.waveInProgress &&
      !scene.isSpawningEnemies &&
      scene.gameState.wave > 0 &&
      (scene.enemies?.length === 0 || !scene.enemies);
      
    if (allEnemiesDefeated || waveCompleteButStuck || gameActiveButNoWave) {
      console.log("Wave completion check: no enemies left, forcing next wave", {
        allEnemiesDefeated,
        waveCompleteButStuck,
        gameActiveButNoWave
      });
      
      if (typeof scene.forceNextWave === 'function') {
        // Ensure we log if waves are stuck
        if (waveCompleteButStuck) {
          console.warn("Detected stuck wave, forcing next wave start");
        }
        
        try {
          scene.forceNextWave();
          console.log("Next wave forced successfully");
        } catch (forceError) {
          console.error("Error forcing next wave:", forceError);
          
          // Emergency recovery - try to reset the wave state
          try {
            console.log("Attempting emergency wave reset");
            scene.waveInProgress = false;
            scene.isSpawningEnemies = false;
            scene.gameState.wave++;
            
            // Try to start next wave with delay
            setTimeout(() => {
              if (scene.gameState?.isActive && typeof scene.startWave === 'function') {
                scene.startWave();
              }
            }, 1000);
          } catch (emergencyError) {
            console.error("Emergency recovery failed:", emergencyError);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error in wave progression check:", err);
  }
}

/**
 * Improved forceNextWave method
 * This code should replace the forceNextWave method in GameScene.js
 */
function forceNextWave() {
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
    if (this.enemies.length > 0) {
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
    
    // Start next wave immediately (no delay)
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
  } catch (error) {
    console.error("Error forcing next wave:", error);
    
    // Emergency recovery - make sure wave progresses even if there's an error
    try {
      this.waveInProgress = false;
      this.isSpawningEnemies = false;
      this.enemies = [];
      this.gameState.wave++;
      
      // Start next wave immediately without delay
      if (this.gameState && this.gameState.isActive) {
        this.startWave();
      }
    } catch (recoveryError) {
      console.error("Emergency wave recovery failed:", recoveryError);
    }
  }
}

/**
 * Safety checks for the update method
 * This code should be added to the update method in GameScene.js
 */
function updateSafetyChecks(time) {
  // Safety check: if game is active but no wave is in progress and we're not spawning enemies
  // This catches situations where the wave transition got stuck
  if (this.gameState.isActive && 
      !this.waveInProgress && 
      !this.isSpawningEnemies && 
      this.enemies.length === 0) {
    console.log("Safety check: game active but no wave in progress - forcing next wave");
    
    // Start next wave
    this.gameState.wave++;
    this.updateWaveText();
    this.startWave();
  }
}

// Export the functions
window.waveProgressionFix = {
  checkWaveProgression,
  forceNextWave,
  updateSafetyChecks
};

console.log("Wave progression fix loaded successfully"); 