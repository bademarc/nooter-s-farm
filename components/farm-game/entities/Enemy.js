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
    } else if (type === 'fox') {
      // Base properties for fox - stealthy and evasive
      this.baseSpeed = 2.5; // Faster than other enemies
      this.baseHealth = 5; // Good health
      this.baseValue = 12; // Higher reward value
      
      // Scale with wave
      this.speed = this.baseSpeed + (currentWave * 0.25); // Higher speed scaling
      this.health = Math.floor(this.baseHealth * waveScaling);
      this.maxHealth = this.health;
      this.value = Math.floor(this.baseValue * waveScaling);
      
      this.color = 0xff9933; // Orange for fox
      this.weakAgainst = 'wizard'; // Weak against advanced defense
      this.weaknessMultiplier = 2.0; // Higher weakness multiplier
      
      // Special fox abilities
      this.canDodge = true; // Can dodge attacks
      this.dodgeChance = 0.25; // 25% chance to dodge
      this.stealthDuration = 0; // Tracks stealth duration
      this.stealthCooldown = 6000; // Cooldown between stealth attempts
      this.lastStealthTime = 0; // Last time stealth was activated
      
      // Use fox sprite
      this.spriteKey = 'enemy_fox';
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
    
    // ANTI-STACKING: Add slight horizontal and vertical position variation
    this.x += (Math.random() - 0.5) * 40; // Add some horizontal spread 
    this.y += (Math.random() - 0.5) * 100; // Add more vertical spread
    
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
        this.container.setDepth(100); // Use consistent depth 
        
        // Use a large visible sprite for the enemy
        this.sprite = scene.add.sprite(0, 0, this.spriteKey);
        this.sprite.setDisplaySize(60, 60); // Larger size for better visibility
        this.sprite.setInteractive({ useHandCursor: true, pixelPerfect: false }); // Make it interactive for clicks with larger hitbox
        
        // Make sprite more interactive
        this.sprite.on('pointerdown', () => {
          if (this.scene && this.scene.gameState && typeof this.scene.gameState.clickDamage === 'number') {
            const clickDamage = this.scene.gameState.clickDamage || 1;
            this.takeDamage(clickDamage);
            console.log(`Enemy clicked and taking ${clickDamage} damage`);
          }
        });
        
        // Add to container (no highlight circle)
        this.container.add([this.sprite]);
        
        console.log(`Created enemy sprite with texture: ${this.spriteKey}`);
      } else {
        // Fallback to colored circle if texture doesn't exist
        console.warn(`Texture ${this.spriteKey} not found, using fallback circle`);
        
        // Create a container
        this.container = scene.add.container(x, y);
        this.container.setDepth(100);
        
        // Create a larger, more visible sprite or icon
        this.typeText = scene.add.text(0, 0, type === 'bird' ? '🐦' : '🐰', {
          fontSize: '36px', // Larger text
          fontFamily: 'Arial',
          stroke: '#000000',
          strokeThickness: 4
        }).setOrigin(0.5);
        this.typeText.setInteractive(); // Make it interactive
        
        // Make text more interactive
        this.typeText.on('pointerdown', () => {
          if (this.scene && this.scene.gameState && typeof this.scene.gameState.clickDamage === 'number') {
            const clickDamage = this.scene.gameState.clickDamage || 1;
            this.takeDamage(clickDamage);
            console.log(`Enemy clicked and taking ${clickDamage} damage`);
          }
        });
        
        // Add to container (no highlight circle)
        this.container.add([this.typeText]);
      }
      
      // Make the container interactive to improve clicking
      this.container.setSize(80, 80); // LARGER explicit size for better clicking
      this.container.setInteractive();
      
      // Make container interactive too (triple redundancy for click handling)
      this.container.on('pointerdown', () => {
        if (this.scene && this.scene.gameState && typeof this.scene.gameState.clickDamage === 'number') {
          const clickDamage = this.scene.gameState.clickDamage || 1;
          this.takeDamage(clickDamage);
          console.log(`Enemy container clicked and taking ${clickDamage} damage`);
        }
      });
    } catch (error) {
      console.error('Error creating enemy sprite:', error);
      // Ultra fallback - create a minimal emergency representation
      this.container = scene.add.container(x, y);
      this.container.setDepth(100);
      this.container.setSize(60, 60);
      this.container.setInteractive();
      
      const emergencyText = scene.add.text(0, 0, "!", {
        fontSize: '36px',
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
        .setDepth(101)
        .setStrokeStyle(1, 0x000000),
      fill: scene.add.rectangle(x, y - 35, 40, 8, 0x00FF00)
        .setDepth(102)
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
  
  update(delta) {
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
      
      // FIX FOR HIGH REFRESH RATE DEVICES (120Hz, 144Hz)
      // Normalize movement to work consistently at all refresh rates
      const targetFrameTime = 16.67; // Target 60fps
      const timeMultiplier = delta ? Math.min(delta / targetFrameTime, 2.0) : 1.0;
      
      // ANTI-STACKING: Add small random y movement to avoid enemies moving in straight lines
      const randomYOffset = (Math.random() - 0.5) * 0.5;
      
      // Move towards left side of screen - FIXED for high refresh rates
      // Use a reduced base movement speed multiplied by timeMultiplier
      this.x -= (this.speed * 0.3) * timeMultiplier; // Reduced from original speed
      this.y += randomYOffset * timeMultiplier; // Add slight random y movement
      
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
        this.timeSinceLastMove += delta || 16; // Use delta time if available
        
        // If stuck for too long, force movement
        if (this.timeSinceLastMove > 500) { // 500ms stuck threshold
          this.stuckCounter++;
          
          // Force movement based on stuck counter
          if (this.stuckCounter > 3) {
            // More aggressive unsticking for longer stucks
            console.log(`Enemy ${this.type} appears very stuck at (${this.x}, ${this.y}) - forcing stronger movement`);
            this.x -= this.speed * 2 * timeMultiplier; // Reduced multiplier, adjusted for time
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
            this.x -= this.speed * 1.5 * timeMultiplier; // Reduced multiplier, adjusted for time
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
      
      // Force active and visible states
      this.active = true;
      this.visible = true;
      
      // Update visual elements - ENSURE VISIBILITY
      if (typeof this.updateVisuals === 'function') {
        this.updateVisuals();
      } else {
        // Fallback update if updateVisuals is missing
        if (this.container) {
          this.container.x = this.x;
          this.container.y = this.y;
          this.container.visible = true;
          this.container.setDepth(1000);
        }
        
        if (this.sprite) {
          this.sprite.visible = true;
          this.sprite.setDepth(1000);
        }
        
        if (this.healthBar) {
          const healthPercent = Math.max(0, this.health / this.maxHealth || 1);
          
          if (this.healthBar.background) {
            this.healthBar.background.x = this.x;
            this.healthBar.background.y = this.y - 35;
            this.healthBar.background.visible = true;
          }
          
          if (this.healthBar.fill) {
            this.healthBar.fill.width = 40 * healthPercent;
            this.healthBar.fill.x = this.x - 20 + (this.healthBar.fill.width / 2);
            this.healthBar.fill.y = this.y - 35;
            this.healthBar.fill.visible = true;
          }
        }
      }
      
      // Check if enemy has reached left side
      if (this.x < 0) {
        this.reachedEnd();
      }
      
      // Fox special ability: Stealth mode
      if (this.type === 'fox' && !this.stealthActive && 
          currentTime - this.lastStealthTime > this.stealthCooldown &&
          Math.random() < 0.01) { // 1% chance per update to go stealth when off cooldown
        
        this.activateStealth(currentTime);
      }
      
      // Update stealth duration if active
      if (this.stealthActive) {
        if (currentTime - this.stealthStartTime > this.stealthDuration) {
          this.deactivateStealth();
        } else {
          // Reduced visibility during stealth
          if (this.sprite) this.sprite.alpha = 0.4;
          if (this.container) this.container.alpha = 0.4;
        }
      }
    } catch (error) {
      console.error(`Error updating enemy ${this.type}:`, error);
    }
  }
  
  updateVisuals() {
    if (!this.active) return;
    
    // Force enemy to be active
    this.active = true;
    this.visible = true;
    
    // Update container position (main approach)
    if (this.container) {
      this.container.x = this.x;
      this.container.y = this.y;
      this.container.visible = true; // Force visibility
      this.container.setDepth(1000); // Extremely high depth to ensure visibility
      
      // Make container interactive if not already
      if (!this.container.input) {
        this.container.setInteractive();
        this.container.input.hitArea.width = 60;
        this.container.input.hitArea.height = 60;
      }
    } 
    // Legacy fallback for sprite-only approach
    else if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      this.sprite.visible = true;
      this.sprite.setDepth(1000);
      
      // Make sprite interactive if not already
      if (!this.sprite.input) {
        this.sprite.setInteractive();
      }
      
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
    this.updateHealthBar();
    
    // Debug log position occasionally
    if (Math.random() < 0.01) {
      console.log(`Enemy at (${this.x.toFixed(0)}, ${this.y.toFixed(0)}), health: ${this.health.toFixed(1)}/${this.maxHealth}`);
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
  
  takeDamage(amount) {
    try {
      // Early return if dead or immune
      if (this.health <= 0 || !this.active) {
        console.log(`Enemy already defeated or inactive, health: ${this.health}`);
        return false;
      }
      
      // Check for dodge (some enemies might have dodge chance)
      if (this.dodgeChance && Math.random() < this.dodgeChance) {
        // Dodge successful
        this.showDodgeEffect();
        return false;
      }
      
      // Calculate actual damage (incorporate defense if any)
      const actualDamage = this.damageResistance ? amount * (1 - this.damageResistance) : amount;
      
      // Apply damage
      this.health -= actualDamage;
      
      // Log damage taken
      console.log(`${this.type} enemy took ${actualDamage.toFixed(1)} damage. Health now: ${this.health.toFixed(1)}/${this.maxHealth}`);
      
      // Update health bar
      this.updateHealthBar();
      
      // Show hit effect
      this.showHitEffect();
      
      // Check if defeated - ensure health is exactly 0 to avoid floating point issues
      if (this.health <= 0) {
        console.log(`Enemy ${this.type} defeated by damage! Setting health to 0.`);
        this.health = 0;
        this.defeated();
        return true;
      }
      
      // Additional safety check for very low health (potential floating point issues)
      if (this.health < 0.1) {
        console.log(`Enemy ${this.type} has very low health (${this.health.toFixed(3)}). Forcing defeat.`);
        this.health = 0;
        this.defeated();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error in enemy takeDamage:", error);
      return false;
    }
  }
  
  // Show a visual effect when enemy is hit
  showHitEffect() {
    try {
      if (!this.scene || !this.active || !this.sprite) return;
      
      // Flash the sprite red
      this.sprite.setTint(0xFF0000);
      
      // Reset the tint after a short delay
      this.scene.time.delayedCall(100, () => {
        if (this.sprite && this.sprite.clearTint) {
          this.sprite.clearTint();
        }
      });
      
      // Add a hit impact circle that expands and fades
      const hitImpact = this.scene.add.circle(this.x, this.y, 10, 0xFFFFFF, 0.7);
      
      // Animate the impact effect
      this.scene.tweens.add({
        targets: hitImpact,
        alpha: 0,
        radius: 25,
        duration: 300,
        onComplete: () => hitImpact.destroy()
      });
      
    } catch (error) {
      console.error("Error in showHitEffect:", error);
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
      
      // Remove from enemies array immediately
      if (this.scene && this.scene.enemies) {
        const index = this.scene.enemies.indexOf(this);
        if (index !== -1) {
          this.scene.enemies.splice(index, 1);
        }
      }
      
      // Still use a delay for visual cleanup
      if (this.scene && this.scene.time && typeof this.scene.time.delayedCall === 'function') {
        this.scene.time.delayedCall(300, () => {
          // Clean up sprites after the delay
          this.cleanupSprites();
        });
      } else {
        // If delayed call is not available, clean up immediately
        this.cleanupSprites();
      }
    } catch (error) {
      console.error("Error destroying enemy:", error);
      
      // Fallback cleanup to prevent memory leaks
      this.cleanupSprites();
      
      // Emergency removal from the enemies array
      if (this.scene && this.scene.enemies) {
        const index = this.scene.enemies.indexOf(this);
        if (index !== -1) {
          this.scene.enemies.splice(index, 1);
        }
      }
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
  
  // Add updateHealthBar method to ensure health bar is properly updated
  updateHealthBar() {
    if (!this.healthBar || !this.active || !this.scene) return;
    
    // Calculate health percentage
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    
    // Update background
    if (this.healthBar.background) {
      this.healthBar.background.x = this.x;
      this.healthBar.background.y = this.y - 35;
      this.healthBar.background.width = 40;
      this.healthBar.background.height = 8;
      this.healthBar.background.visible = true;
      this.healthBar.background.setDepth(1002);
    }
    
    // Update fill
    if (this.healthBar.fill) {
      this.healthBar.fill.width = 40 * healthPercent;
      this.healthBar.fill.height = 8;
      this.healthBar.fill.x = this.x - 20 + (this.healthBar.fill.width / 2);
      this.healthBar.fill.y = this.y - 35;
      this.healthBar.fill.visible = true;
      this.healthBar.fill.setDepth(1003);
      
      // Change color based on health
      if (healthPercent < 0.3) {
        this.healthBar.fill.fillColor = 0xFF0000; // Red for low health
      } else if (healthPercent < 0.6) {
        this.healthBar.fill.fillColor = 0xFFFF00; // Yellow for medium health
      } else {
        this.healthBar.fill.fillColor = 0x00FF00; // Green for high health
      }
    }
    
    // Pulse effect on damage
    if (this.healthBar.fill && this.healthBar.fill.alpha !== undefined) {
      this.scene.tweens.add({
        targets: this.healthBar.fill,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          if (this.healthBar && this.healthBar.fill) {
            this.healthBar.fill.alpha = 1;
          }
        }
      });
    }
  }
  
  // Add a method to show damage text
  showDamageText(amount) {
    if (!this.scene || !this.active) return;
    
    try {
      // Convert amount to a readable format
      const damageText = amount.toFixed(1);
      
      // Create the damage text
      const text = this.scene.add.text(this.x, this.y - 20, `-${damageText}`, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      // Animate the text
      this.scene.tweens.add({
        targets: text,
        y: this.y - 60,
        alpha: 0,
        scale: 1.5,
        duration: 800,
        onComplete: () => text.destroy()
      });
    } catch (error) {
      console.error("Error showing damage text:", error);
    }
  }
  
  // Add this method to handle enemy defeat
  defeated() {
    if (!this.active) return;
    
    console.log(`Enemy ${this.type} defeated at (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
    
    // Make sure the enemy is dead
    this.health = 0;
    
    // Mark as inactive immediately to prevent multiple defeat calls
    this.active = false;
    
    // Add coins to player
    if (this.scene && this.scene.gameState) {
      this.scene.gameState.farmCoins += this.value;
      
      // Update UI elements for score
      if (typeof this.scene.updateFarmCoins === 'function') {
        this.scene.updateFarmCoins(this.value);
      }
      
      // Update score
      this.scene.gameState.score += this.value * 10;
      if (typeof this.scene.updateScoreText === 'function') {
        this.scene.updateScoreText();
      }
      
      // Show floating text for score
      if (typeof this.scene.showFloatingText === 'function') {
        this.scene.showFloatingText(this.x, this.y - 20, `+${this.value * 10}`, 0xFFFF00);
      }
    }
    
    // Play defeat animation
    if (typeof this.defeatAnimation === 'function') {
      this.defeatAnimation();
    }
    
    // Destroy this enemy
    this.destroy();
  }
  
  // Add fox-specific methods
  showDodgeEffect() {
    if (!this.scene) return;
    
    try {
      // Create a yellow flash effect
      const flash = this.scene.add.graphics();
      flash.fillStyle(0xffaa22, 0.4);
      flash.fillCircle(this.x, this.y, 30);
      
      // Animate and destroy
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => {
          flash.destroy();
        }
      });
      
      // Slight position shift to show dodge movement
      const angle = Math.random() * Math.PI * 2;
      const dodgeDistance = 20;
      
      // Dodge animation
      this.scene.tweens.add({
        targets: this,
        x: this.x + Math.cos(angle) * dodgeDistance,
        y: this.y + Math.sin(angle) * dodgeDistance,
        duration: 100,
        yoyo: true
      });
    } catch (error) {
      console.error("Error showing dodge effect:", error);
    }
  }
  
  activateStealth(currentTime) {
    try {
      this.stealthActive = true;
      this.stealthStartTime = currentTime;
      this.lastStealthTime = currentTime;
      this.stealthDuration = 3000; // 3 seconds of stealth
      
      // Increase speed during stealth
      this.speed *= 1.5;
      
      // Visual effect for stealth activation
      if (this.scene) {
        // Create stealth activation effect
        const effect = this.scene.add.graphics();
        effect.fillStyle(0xaaaaaa, 0.5);
        effect.fillCircle(this.x, this.y, 40);
        
        // Animate and destroy
        this.scene.tweens.add({
          targets: effect,
          alpha: 0,
          scale: 1.5,
          duration: 500,
          onComplete: () => {
            effect.destroy();
          }
        });
        
        // Show stealth text
        if (typeof this.scene.showFloatingText === 'function') {
          this.scene.showFloatingText(this.x, this.y - 40, "STEALTH MODE!", 0xaaaaaa);
        }
      }
    } catch (error) {
      console.error("Error activating stealth:", error);
    }
  }
  
  deactivateStealth() {
    try {
      this.stealthActive = false;
      
      // Reset speed
      this.speed = (this.baseSpeed + ((this.scene.gameState?.wave || 1) * 0.25));
      
      // Reset visibility
      if (this.sprite) this.sprite.alpha = 1;
      if (this.container) this.container.alpha = 1;
      
      // Visual effect for coming out of stealth
      if (this.scene) {
        // Create reveal effect
        const reveal = this.scene.add.graphics();
        reveal.fillStyle(0xff9933, 0.3);
        reveal.fillCircle(this.x, this.y, 30);
        
        // Animate and destroy
        this.scene.tweens.add({
          targets: reveal,
          alpha: 0,
          scale: 1.3,
          duration: 300,
          onComplete: () => {
            reveal.destroy();
          }
        });
      }
    } catch (error) {
      console.error("Error deactivating stealth:", error);
    }
  }
} 