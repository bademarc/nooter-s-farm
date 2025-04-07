'use client';

export default class Enemy {
  constructor(scene, type, x, y) {
    this.scene = scene;
    this.type = type;
    this.x = x;
    this.y = y;
    this.active = true;
    this.visible = true;
    this.stuck = false;
    this.stuckCounter = 0;
    this.lastX = x;
    this.lastY = y;
    this.timeSinceLastMove = 0;
    this.lastMoveTime = this.scene.time.now;
    this.removeTimeout = null;
    
    // Get current wave for scaling difficulty
    const currentWave = this.scene.gameState?.wave || 1;
    const waveScaling = Math.min(2.5, 1 + (currentWave * 0.2)); // Increased scaling
    
    // Set properties based on type with wave scaling
    if (type === 'bird') {
      // Base properties - increased health
      this.baseSpeed = 2.0;
      this.baseHealth = 3; // Increased from 1
      this.baseValue = 8;
      
      // Scale with wave
      this.speed = this.baseSpeed + (currentWave * 0.2); // Increased speed scaling
      this.health = Math.floor(this.baseHealth * waveScaling);
      this.maxHealth = this.health;
      this.value = Math.floor(this.baseValue * waveScaling);
      
      this.color = 0x3498db;
      this.weakAgainst = 'scarecrow';
      this.weaknessMultiplier = 1.5; // Reduced from 2.0
    } else {
      // Base properties - increased health
      this.baseSpeed = 1.5;
      this.baseHealth = 4; // Increased from 2
      this.baseValue = 6;
      
      // Scale with wave
      this.speed = this.baseSpeed + (currentWave * 0.15); // Increased speed scaling
      this.health = Math.floor(this.baseHealth * waveScaling);
      this.maxHealth = this.health;
      this.value = Math.floor(this.baseValue * waveScaling);
      
      this.color = 0x9b59b6;
      this.weakAgainst = 'dog';
      this.weaknessMultiplier = 1.5; // Reduced from 2.0
    }
    
    // Generate a unique ID for this enemy
    this.id = `${this.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Ensure minimum values - increased minimums
    this.health = Math.max(4, this.health); // Minimum health of 4 (increased from 2)
    this.speed = Math.max(1.2, this.speed); // Increased minimum speed
    this.value = Math.max(5, this.value); // Increased minimum value
    
    // Apply difficulty bonuses to later waves - increased bonuses
    if (currentWave > 2) {
      this.health += Math.floor(currentWave * 0.4); // Increased health scaling (from 0.25)
      this.speed += 0.15 * Math.floor(currentWave / 2); // Increased speed scaling (from 0.1)
      this.damageResistance = Math.min(0.3, (currentWave - 2) * 0.03); // Increased resistance (from 0.2, 0.02)
    }
    
    // Boss waves - increased power
    if (currentWave % 5 === 0) {
      this.health = Math.floor(this.health * 1.5); // Increased from 1.25
      this.maxHealth = this.health;
      this.value = Math.floor(this.value * 2.0); // Increased from 1.5
      this.isBoss = true;
      
      if (this.damageResistance) {
        this.damageResistance += 0.1; // Increased from 0.05
      } else {
        this.damageResistance = 0.1; // Increased from 0.05
      }
      
      // Use boss sprite for boss waves
      this.spriteKey = 'enemy_boss';
    } else {
      // Use regular enemy sprites
      this.spriteKey = type === 'bird' ? 'enemy_bird' : 'enemy_rabbit';
    }
    
    // Create visual representation using sprite images with fallback
    try {
      // Check if the sprite texture exists in the cache
      if (scene.textures.exists(this.spriteKey)) {
        // Create a container for the enemy (for better grouping)
        this.container = scene.add.container(x, y);
        this.container.setDepth(1000); // Very high depth to ensure it's visible
        
        // Use a large visible sprite for the enemy
        this.sprite = scene.add.sprite(0, 0, this.spriteKey);
        this.sprite.setDisplaySize(50, 50); // Larger size for better visibility
        
        // Add to container (no highlight circle)
        this.container.add([this.sprite]);
        
        console.log(`Created transparent enemy sprite with texture: ${this.spriteKey}`);
      } else {
        // Fallback to colored circle if texture doesn't exist
        console.warn(`Texture ${this.spriteKey} not found, using fallback circle`);
        
        // Create a container
        this.container = scene.add.container(x, y);
        this.container.setDepth(1000);
        
        // Create a larger, more visible sprite or icon
        this.typeText = scene.add.text(0, 0, type === 'bird' ? '🐦' : '🐰', {
          fontSize: '24px',
          fontFamily: 'Arial',
          stroke: '#000000',
          strokeThickness: 4
        }).setOrigin(0.5);
        
        // Add to container (no highlight circle)
        this.container.add([this.typeText]);
      }
    } catch (error) {
      console.error('Error creating enemy sprite:', error);
      // Ultra fallback - create a minimal emergency representation
      this.container = scene.add.container(x, y);
      this.container.setDepth(1000);
      
      const emergencyText = scene.add.text(0, 0, "!", {
        fontSize: '30px',
        fontFamily: 'Arial',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      
      this.container.add([emergencyText]);
    }
    
    // Add health bar with high visibility
    this.healthBar = {
      background: scene.add.rectangle(x, y - 35, 40, 8, 0xFF0000)
        .setDepth(1002)
        .setStrokeStyle(1, 0x000000),
      fill: scene.add.rectangle(x, y - 35, 40, 8, 0x00FF00)
        .setDepth(1003)
    };
    
    // Remove the emoji text since we're using sprites now
    this.typeText = null;
    
    // Add wave indicator for stronger enemies
    if (currentWave > 1) {
      this.waveIndicator = scene.add.text(x, y + 20, `W${currentWave}`, {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#FF0000'
      }).setOrigin(0.5);
      
      // Make boss wave enemies look special
      if (currentWave % 5 === 0) {
        this.waveIndicator.setText(`BOSS W${currentWave}`);
        this.waveIndicator.setColor('#FF00FF');
        
        // Make the enemy appear larger for boss waves
        this.sprite.setScale(1.2);
      }
    }
    
    console.log(`Created ${type} enemy ${this.id} at ${x},${y} - health: ${this.health}, speed: ${this.speed.toFixed(1)}, wave: ${currentWave}`);
  }
  
  update() {
    try {
      if (!this.active) return;
      
      // Store previous position to detect if enemy is stuck
      this.lastX = this.x;
      this.lastY = this.y;
      
      // Get current time for movement tracking
      const currentTime = this.scene.time.now;
      if (!this.lastMoveTime) {
        this.lastMoveTime = currentTime;
      }
      
      // Move towards left side of screen
      this.x -= this.speed;
      
      // Initialize stuck counter if not already set
      if (this.stuckCounter === undefined) {
        this.stuckCounter = 0;
      }
      
      // Make sure the enemy is marked as moving
      this.moving = true;
      
      // If enemy somehow got stuck outside the screen, fix it
      if (this.x > 850) {
        this.x = 800;
        console.log(`Fixed enemy position that was outside screen: ${this.x}`);
      }
      
      // Check if enemy is stuck (not moving despite having speed)
      if (Math.abs(this.x - this.lastX) < 0.1) {
        // Count time since last real movement
        if (!this.timeSinceLastMove) {
          this.timeSinceLastMove = 0;
        }
        this.timeSinceLastMove += 16; // Assume ~16ms per frame
        
        // If stuck for too long, force movement
        if (this.timeSinceLastMove > 500) { // 500ms stuck threshold
          this.stuckCounter++;
          
          // Force movement based on stuck counter
          if (this.stuckCounter > 3) {
            // More aggressive unsticking for longer stucks
            console.log(`Enemy ${this.type} appears very stuck at (${this.x}, ${this.y}) - forcing stronger movement`);
            this.x -= this.speed * 3;
            this.y += (Math.random() - 0.5) * 10; // Random Y jitter
            
            // If extremely stuck (10+ attempts), teleport
            if (this.stuckCounter > 10) {
              console.warn(`Enemy hopelessly stuck - teleporting`);
              this.x -= 100; // Move far to the left
              this.y = Math.random() * 400 + 100; // Random Y
              this.stuckCounter = 0; // Reset counter
            }
          } else {
            // Normal unstuck attempt
            console.log(`Enemy appears stuck - forcing movement (attempt #${this.stuckCounter})`);
            this.x -= this.speed * 2;
          }
        }
      } else {
        // Reset stuck counter if moving normally
        this.stuckCounter = 0;
        this.timeSinceLastMove = 0;
      }
      
      // Add slight vertical variation to avoid stacking
      if (Math.random() < 0.05) {
        this.y += (Math.random() - 0.5) * 4;
      }
      
      // Ensure enemy stays within playable area
      this.y = Math.max(100, Math.min(500, this.y));
      
      // Update visual elements
      this.updateVisuals();
      
      // Force visibility and depth for debugging
      if (this.sprite) {
        this.sprite.visible = true;
        this.sprite.setDepth(100); // Very high depth to ensure it's visible
      }
      if (this.typeText) {
        this.typeText.visible = true;
        this.typeText.setDepth(101);
      }
      
      // Logging for debug - position check every 60 frames
      if (Math.random() < 0.016) {
        console.log(`Enemy at position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)}), active: ${this.active}, visible: ${this.visible}`);
      }
      
      // Check if enemy has reached left side
      if (this.x < 0) {
        this.reachedEnd();
      }
    } catch (error) {
      console.error(`Error updating enemy ${this.type}:`, error);
    }
  }
  
  updateVisuals() {
    if (!this.active) return;
    
    // Update container position (main approach)
    if (this.container) {
      this.container.x = this.x;
      this.container.y = this.y;
      this.container.visible = true; // Force visibility
      this.container.setDepth(1000); // Extremely high depth to ensure visibility
    } 
    // Legacy fallback for sprite-only approach
    else if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      this.sprite.visible = true;
      this.sprite.setDepth(1000);
      
      // If the sprite is a Phaser.GameObjects.Sprite, ensure it has the correct key
      if (this.sprite.setTexture && this.scene.textures.exists(this.spriteKey)) {
        this.sprite.setTexture(this.spriteKey);
      }
      
      // Legacy text position update
      if (this.typeText) {
        this.typeText.x = this.x;
        this.typeText.y = this.y;
        this.typeText.visible = true;
        this.typeText.setDepth(1001);
      }
    }
    
    // Update wave indicator position - always separate from container
    if (this.waveIndicator) {
      this.waveIndicator.x = this.x;
      this.waveIndicator.y = this.y + 20;
      this.waveIndicator.visible = true;
      this.waveIndicator.setDepth(1002); // Very high depth
    }
    
    // Update health bar - always separate from container
    if (this.healthBar) {
      const healthPercent = Math.max(0, this.health / this.maxHealth);
      
      // Update background
      if (this.healthBar.background) {
        this.healthBar.background.x = this.x;
        this.healthBar.background.y = this.y - 35; // Higher position
        this.healthBar.background.width = 40; // Wider
        this.healthBar.background.height = 8; // Taller
        this.healthBar.background.visible = true;
        this.healthBar.background.setDepth(1002);
      }
      
      // Update fill
      if (this.healthBar.fill) {
        this.healthBar.fill.width = 40 * healthPercent; // Wider
        this.healthBar.fill.height = 8; // Taller
        this.healthBar.fill.x = this.x - 20 + (this.healthBar.fill.width / 2);
        this.healthBar.fill.y = this.y - 35; // Higher position
        this.healthBar.fill.visible = true;
        this.healthBar.fill.setDepth(1003);
      }
    }
    
    // Debug log position occasionally
    if (Math.random() < 0.01) {
      console.log(`Enemy at (${this.x.toFixed(0)}, ${this.y.toFixed(0)}), visible: ${this.container?.visible || this.sprite?.visible}`);
    }
  }
  
  reachedEnd() {
    // Enemy reached the farm - reduce lives
        if (this.scene.gameState) {
          this.scene.gameState.lives--;
          this.scene.updateLivesText();
      
      console.log("Enemy reached farm! Lives remaining:", this.scene.gameState.lives);
          
          // Show warning text
          this.scene.showFloatingText(50, 300, 'Farm Invaded! -1 Life', 0xFF0000);
          
      // Check for game over
          if (this.scene.gameState.lives <= 0) {
            this.endGame();
          }
        }
        
    // Remove the enemy
        this.destroy();
  }
  
  takeDamage(amount, source) {
    if (!this.active) return;
    
    try {
      // Apply weakness multiplier if applicable
      let finalDamage = amount;
      
      if (source?.type === this.weakAgainst) {
        finalDamage = amount * this.weaknessMultiplier;
        console.log(`${this.type} is weak against ${source.type}, damage multiplied: ${amount} -> ${finalDamage}`);
      }
      
      // If damage is coming from player click (no source), apply much higher damage
      if (!source) {
        finalDamage = Math.max(1, finalDamage); // Reduced from 2 to 1 for player clicks
        // Ignore damage resistance for player clicks
        console.log(`Player clicked enemy, applying high damage: ${finalDamage}`);
      } else {
        // Only apply damage resistance to non-player damage
        if (this.damageResistance && this.damageResistance > 0) {
          const originalDamage = finalDamage;
          finalDamage = Math.max(1, Math.floor(finalDamage * (1 - this.damageResistance)));
          console.log(`Enemy resisted damage: ${originalDamage} -> ${finalDamage} (${Math.round(this.damageResistance * 100)}% resistance)`);
        }
      }
      
      // Apply the damage (minimum 1)
      this.health -= Math.max(1, finalDamage);
      
      // Create damage text with larger font for player clicks
      if (this.scene && typeof this.scene.add.text === 'function') {
        const damageText = this.scene.add.text(this.x, this.y - 20, `-${finalDamage}`, {
          fontSize: !source ? '24px' : '16px', // Larger text for player clicks
          color: !source ? '#FF0000' : '#FF6B6B',
          stroke: '#000000',
          strokeThickness: !source ? 3 : 2
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
          targets: damageText,
          y: damageText.y - 40,
          alpha: 0,
          duration: 1000,
          onComplete: () => damageText.destroy()
        });
      }
      
      // More noticeable flash effect for player clicks
      if (this.sprite && this.scene && this.scene.tweens) {
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: !source ? 0.3 : 0.5, // More transparent flash for player clicks
          scaleX: !source ? 1.2 : 1, // Add scale effect for player clicks
          scaleY: !source ? 1.2 : 1,
          duration: !source ? 150 : 100,
          yoyo: true,
        });
      }
      
      console.log(`Enemy ${this.id} took ${finalDamage} damage, health: ${this.health}/${this.maxHealth}`);
      
      // Update health bar
      this.updateVisuals();
      
      // Check if enemy is defeated
      if (this.health <= 0) {
        console.log(`Enemy ${this.id} defeated!`);
        if (this.scene.gameState) {
          // Update coins
          this.scene.gameState.coins += this.value;
          
          // Create floating coin value text that stays longer
          const coinText = this.scene.add.text(this.x, this.y, `+${this.value}`, {
            fontSize: '24px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3
          }).setOrigin(0.5)
          .setDepth(10);
          
          // Animate the coin text
          this.scene.tweens.add({
            targets: coinText,
            y: coinText.y - 50,
            alpha: 0,
            duration: 3000, // Increased from 2000 to 3000
            onComplete: () => coinText.destroy()
          });
          
          // Update coins display - call the updateFarmCoins method directly
          if (this.scene.updateFarmCoins) {
            this.scene.updateFarmCoins(this.value);
          }
          
          if (this.isBoss) {
            const bossText = this.scene.add.text(this.x, this.y - 30, 'BOSS DEFEATED!', {
              fontSize: '24px',
              color: '#FF00FF',
              stroke: '#000000',
              strokeThickness: 4
            }).setOrigin(0.5)
            .setDepth(11);
            
            // Animate boss text
            this.scene.tweens.add({
              targets: bossText,
              y: bossText.y - 30,
              alpha: 0,
              duration: 2000,
              onComplete: () => bossText.destroy()
            });
          }
        }
        
        // Play defeat animation and destroy
        this.defeatAnimation();
        this.destroy();
      }
    } catch (error) {
      console.error('Error in takeDamage:', error);
    }
  }
  
  endGame() {
    if (!this.scene) return;
    
    console.log("Game over!");
    
    // Set game to inactive
      if (this.scene.gameState) {
        this.scene.gameState.isActive = false;
      }
      
    // Show game over text
      const gameOverText = this.scene.add.text(400, 300, 'GAME OVER', {
      fontSize: '48px',
        fontFamily: 'Arial',
        color: '#FF0000'
      }).setOrigin(0.5);
      
      // Show score
    const scoreText = this.scene.add.text(400, 350, `Final Score: ${this.scene.gameState.score}`, {
      fontSize: '24px',
        fontFamily: 'Arial',
        color: '#FFFFFF'
      }).setOrigin(0.5);
      
      // Show restart button
      const restartButton = this.scene.add.rectangle(400, 420, 200, 50, 0xFFFFFF);
      const restartText = this.scene.add.text(400, 420, 'Restart Game', {
      fontSize: '18px',
        fontFamily: 'Arial',
        color: '#000000'
      }).setOrigin(0.5);
      
      restartButton.setInteractive();
      restartButton.on('pointerdown', () => {
        this.scene.scene.restart();
      });
  }
  
  destroy() {
    try {
      console.log(`Destroying enemy at (${this.x}, ${this.y})`);
      
      // Set as inactive 
      this.active = false;
      this.visible = false;
      
      // Remove from enemies array with delay to allow animations to finish
      if (this.scene && this.scene.time && typeof this.scene.time.delayedCall === 'function') {
        this.scene.time.delayedCall(300, () => {
          if (!this.scene || !this.scene.enemies) return;
          
          const index = this.scene.enemies.indexOf(this);
          if (index !== -1) {
            this.scene.enemies.splice(index, 1);
          }
          
          // Clean up sprites after the delay
          this.cleanupSprites();
        });
      } else {
        // If delayed call is not available, clean up immediately
        if (this.scene && this.scene.enemies) {
          const index = this.scene.enemies.indexOf(this);
          if (index !== -1) {
            this.scene.enemies.splice(index, 1);
          }
        }
        this.cleanupSprites();
      }
    } catch (error) {
      console.error("Error destroying enemy:", error);
      
      // Fallback cleanup to prevent memory leaks
      this.cleanupSprites();
    }
  }
  
  setActive(state) {
    this.active = state;
    return this;
  }
  
  setVisible(state) {
    this.visible = state;
    
    if (this.sprite) this.sprite.visible = state;
    
    if (this.waveIndicator) this.waveIndicator.visible = state;
    
    if (this.healthBar) {
      if (this.healthBar.background) this.healthBar.background.visible = state;
      if (this.healthBar.fill) this.healthBar.fill.visible = state;
    }
    
    return this;
  }
  
  defeatAnimation() {
    if (!this.scene || !this.sprite) return;
    
    // Create a more dramatic explosion effect
    const explosion = this.scene.add.circle(this.x, this.y, 40, 0xFFFF00, 0.8);
    
    // Add particles if available
    if (this.scene.add.particles) {
      try {
        // Create particles in the enemy's color
        const particleColor = this.type === 'bird' ? 0x3498db : 0x9b59b6;
        const particles = this.scene.add.particles(this.x, this.y, 'pixel', {
          speed: 150,
          scale: { start: 2, end: 0 },
          blendMode: 'ADD',
          lifespan: 800,
          tint: particleColor
        });
        
        // Explode with more particles
        particles.explode(30);
        
        // Destroy after animation completes
        this.scene.time.delayedCall(800, () => particles.destroy());
      } catch (error) {
        console.log("Particle system not available:", error);
      }
    }
    
    // Animate explosion with more dramatic effect
    this.scene.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: 3,
      duration: 500,
      onComplete: () => explosion.destroy()
    });
    
    // Add defeat text with coin value - make it more visible
    const defeatText = this.scene.add.text(this.x, this.y - 20, `+${this.value}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#FFFF00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Animate the text with a more dramatic effect
    this.scene.tweens.add({
      targets: defeatText,
      y: this.y - 80,
      alpha: 0,
      scale: 1.5,
      duration: 1500,
      onComplete: () => defeatText.destroy()
    });
    
    // Add a special effect for boss enemies
    if (this.isBoss) {
      const bossText = this.scene.add.text(this.x, this.y - 40, 'BOSS DEFEATED!', {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#FF00FF',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      
      this.scene.tweens.add({
        targets: bossText,
        y: this.y - 100,
        alpha: 0,
        scale: 1.5,
        duration: 1500,
        onComplete: () => bossText.destroy()
      });
    }
  }
  
  // Helper method to clean up sprites
  cleanupSprites() {
    try {
      // Clean up container (will automatically destroy children)
      if (this.container) {
        this.container.destroy();
        this.container = null;
        
        // The sprite and typeText are automatically destroyed as container children
        this.sprite = null;
        this.typeText = null;
      }
      // Legacy cleanup for standalone sprites
      else if (this.sprite) {
        this.sprite.destroy();
        this.sprite = null;
        
        if (this.typeText) {
          this.typeText.destroy();
          this.typeText = null;
        }
      }
      
      // Always independently clean up wave indicator
      if (this.waveIndicator) {
        this.waveIndicator.destroy();
        this.waveIndicator = null;
      }
      
      // Always independently clean up health bars
      if (this.healthBar) {
        if (this.healthBar.background) {
          this.healthBar.background.destroy();
          this.healthBar.background = null;
        }
        if (this.healthBar.fill) {
          this.healthBar.fill.destroy();
          this.healthBar.fill = null;
        }
        this.healthBar = null;
      }
      
      console.log(`Enemy cleanup complete for ${this.id}`);
    } catch (error) {
      console.error("Error cleaning up enemy sprites:", error);
    }
  }
} 