'use client';

export default class Defense {
  constructor(scene, type, x, y) {
    this.scene = scene;
    this.type = type;
    this.x = x;
    this.y = y;
    this.active = true;
    this.range = 150; // Default range
    this.cooldown = 0; // Cooldown timer
    this.damage = 1; // Default damage
    this.targetTypes = []; // Types of enemies this defense can target
    
    // Get current wave for scaling
    const currentWave = this.scene.gameState?.wave || 1;
    
    // Set properties based on defense type
    if (type === 'scarecrow') {
      this.cost = 35; 
      this.range = 200; 
      this.cooldown = 2000; // 2 seconds cooldown
      this.damage = 1; 
      this.targetTypes = ['bird'];
      this.createABSMage();
    } else if (type === 'dog') {
      this.cost = 50;
      this.range = 150;
      this.cooldown = 1500; // 1.5 seconds cooldown
      this.damage = 2;
      this.targetTypes = ['rabbit'];
      this.createNOOTMage();
    }
    
    // Store the last time this defense attacked
    this.lastAttackTime = 0;
    
    // Add visual range indicator that's visible for a few seconds after placement
    this.showRange();
    this.scene.time.delayedCall(3000, () => this.hideRange());
    
    const defenseName = type === 'scarecrow' ? 'ABS ice mage' : 'NOOT fire mage';
    console.log(`Created ${defenseName} at ${x}, ${y}`);
    
    // Apply any existing upgrades
    this.applyUpgrades();
  }
  
  createABSMage() {
    // Create visual representation of ABS penguin
    this.sprite = this.scene.add.image(this.x, this.y, 'ABS_idle');
    this.sprite.setDisplaySize(48, 48); // Scale to appropriate size
    
    // Add a range indicator (usually invisible, shown on hover)
    this.rangeIndicator = this.scene.add.circle(this.x, this.y, this.range, 0xFFFFFF, 0.1);
    this.rangeIndicator.setStrokeStyle(2, 0x0000FF); // Blue outline for range
    
    // Make it interactive
    this.sprite.setInteractive();
    this.sprite.on('pointerover', () => this.showRange());
    this.sprite.on('pointerout', () => this.hideRange());
  }
  
  createNOOTMage() {
    // Create visual representation of NOOT penguin
    this.sprite = this.scene.add.image(this.x, this.y, 'NOOT_idle');
    this.sprite.setDisplaySize(48, 48); // Scale to appropriate size
    
    // Add a range indicator (usually invisible, shown on hover)
    this.rangeIndicator = this.scene.add.circle(this.x, this.y, this.range, 0xFFFFFF, 0.1);
    this.rangeIndicator.setStrokeStyle(2, 0xFF0000); // Red outline for range
    
    // Make it interactive
    this.sprite.setInteractive();
    this.sprite.on('pointerover', () => this.showRange());
    this.sprite.on('pointerout', () => this.hideRange());
  }
  
  showRange() {
    if (this.rangeIndicator) {
      this.rangeIndicator.visible = true;
    }
  }
  
  hideRange() {
    if (this.rangeIndicator) {
      this.rangeIndicator.visible = false;
    }
  }
  
  update() {
    // IMPORTANT: Ensure mages never ignore enemies - perform aggressive scanning
    
    // Check for enemies in range more frequently (every frame)
    this.checkForEnemiesInRange();
    
    // Reduce attack cooldown time - ensure we're using the proper property name
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining -= 16.67; // Approximately 60 frames per second
      
      // Don't let cooldown get stuck at small values - clean reset to 0
      if (this.cooldownRemaining < 1) {
        this.cooldownRemaining = 0;
      }
    }
    
    // Debug
    if (this.debugMode && this.scene && this.scene.time && this.scene.time.now % 1000 < 20) {
      console.log(`Defense at ${this.x},${this.y} actively scanning for enemies. Cooldown: ${this.cooldownRemaining}`);
    }
  }
  
  pulse() {
    // Simple pulse animation to show the defense is active
    if (!this.scene || !this.sprite) return;
    
    // Skip if already pulsing
    if (this.isPulsing) return;
    this.isPulsing = true;
    
    // Create pulse effect
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.7,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        this.isPulsing = false;
      }
    });
  }
  
  checkForEnemiesInRange() {
    // Initialize cooldownRemaining if it doesn't exist
    if (this.cooldownRemaining === undefined) {
      this.cooldownRemaining = 0;
    }
    
    // Skip if on cooldown
    if (this.cooldownRemaining > 0) {
      return;
    }
    
    // Check if scene has enemies
    if (!this.scene || !this.scene.enemies) return;
    
    // If no enemies, create empty array
    if (!this.scene.enemies) {
      this.scene.enemies = [];
      return;
    }
    
    let foundEnemy = false;
    let bestTarget = null;
    let bestScore = -Infinity;
    
    // AGGRESSIVE SEARCH - Find best enemy to target using a scoring system
    for (let i = 0; i < this.scene.enemies.length; i++) {
      const enemy = this.scene.enemies[i];
      if (!enemy) continue;
      
      // Skip inactive enemies (unless this is the only enemy)
      if (!enemy.active && this.scene.enemies.length > 1) continue;
      
      // Try multiple ways to get position - be very thorough
      const enemyX = enemy.x || 
                    (enemy.sprite ? enemy.sprite.x : null) || 
                    (enemy.container ? enemy.container.x : null);
      const enemyY = enemy.y || 
                    (enemy.sprite ? enemy.sprite.y : null) || 
                    (enemy.container ? enemy.container.y : null);
      
      // Skip enemies without position
      if (enemyX === null || enemyY === null) continue;
      
      // Calculate distance
      const dx = enemyX - this.x;
      const dy = enemyY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Skip enemies that are extremely far away
      if (distance > this.range * 2) continue;
      
      // Check if we can target this enemy type - be more permissive
      let canTarget = this.targetTypes.length === 0 || 
                      this.targetTypes.includes(enemy.type) || 
                      this.targetTypes.includes('all');
      
      // In desperate situations (few enemies), target anyway
      if (!canTarget && this.scene.enemies.length <= 3) {
        canTarget = true;
      }
      
      // Skip if we can't target this type and we're enforcing type rules
      if (!canTarget) continue;
      
      // Enemy is found
      foundEnemy = true;
      
      // Calculate targeting score - higher is better
      let score = 0;
      
      // Factor 1: Distance penalty (closer is better)
      score -= distance * 0.5;
      
      // Factor 2: Low health bonus (prioritize finishing off enemies)
      if (enemy.health && enemy.maxHealth) {
        const healthPercent = enemy.health / enemy.maxHealth;
        
        // Huge bonus for nearly dead enemies
        if (healthPercent <= 0.2) {
          score += 1000;
        }
        // Good bonus for weakened enemies
        else if (healthPercent <= 0.5) {
          score += 500;
        }
      }
      
      // Factor 3: Matching type bonus
      if (this.targetTypes.includes(enemy.type)) {
        score += 300;
      }
      
      // Factor 4: In range bonus
      if (distance <= this.range) {
        score += 200;
      }
      
      // Factor 5: Getting close to left side (emergency priority)
      if (enemyX < 200) {
        score += 2000; // Very high emergency priority
      }
      
      // Update best target if this enemy has a better score
      if (score > bestScore) {
        bestScore = score;
        bestTarget = enemy;
      }
    }
    
    // Attack best target if found
    if (foundEnemy && bestTarget) {
      // Just attack without showing any visual line - this fixes the React update error
      this.attack(bestTarget);
      
      // We're removing all visual feedback lines here to prevent React errors
      // No line connections, no tweens that could cause re-renders
    }
  }
  
  attack(enemy) {
    if (!this.active) return false;
    
    // Initialize cooldownRemaining if it doesn't exist
    if (this.cooldownRemaining === undefined) {
      this.cooldownRemaining = 0;
    }
    
    const currentTime = this.scene ? this.scene.time.now : 0;
    
    // Skip if on cooldown
    if (this.cooldownRemaining > 0) {
      return false;
    }
    
    // If no enemy provided or invalid, return false
    if (!enemy) return false;
    
    // Force enemy to be active - this ensures we can attack even if the enemy was previously marked inactive
    enemy.active = true;
    
    // Ensure enemy has proper position values
    const enemyX = enemy.x || (enemy.sprite ? enemy.sprite.x : 0) || (enemy.container ? enemy.container.x : 0);
    const enemyY = enemy.y || (enemy.sprite ? enemy.sprite.y : 0) || (enemy.container ? enemy.container.y : 0);
    
    // Safety check - if we can't determine enemy position, skip
    if (!enemyX || !enemyY) {
      return false;
    }
    
    // Calculate distance
    const dx = enemyX - this.x;
    const dy = enemyY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // RELAXED RANGE CHECK - Allow attacking even if slightly out of normal range
    // This makes mages more aggressive and less likely to skip enemies
    const attackRange = this.range * 1.25; // 25% increased range
    
    if (distance > attackRange) {
      // Only log occasionally to avoid spam
      if (Math.random() < 0.01) {
        console.log(`Enemy out of increased range: ${distance.toFixed(1)} > ${attackRange} for ${this.type}`);
      }
      return false;
    }
    
    // Calculate damage with special logic for low-health enemies
    let damageAmount = this.damage;
    
    // IMPORTANT FIX: Always kill enemies with low health
    // This prevents enemies getting stuck at 1 HP
    if (enemy.health <= 2) {
      // GUARANTEED KILL: Set damage higher than remaining health
      damageAmount = enemy.health * 3; // Triple the damage for low health enemies
      
      // Force health to zero for critical hits
      if (enemy.health <= 1.1) {
        enemy.health = 0; // Force to zero
      }
      
      // Display critical hit message
      this.showDamageText(enemy, "CRITICAL!", 0xFFFF00);
    }
    
    // Apply damage to enemy - try multiple approaches to ensure it works
    try {
      // First try the standard takeDamage method
      if (typeof enemy.takeDamage === 'function') {
        enemy.takeDamage(damageAmount);
      } 
      // If that fails, apply damage directly
      else {
        enemy.health -= damageAmount;
        
        // If health is zero or below, destroy the enemy
        if (enemy.health <= 0) {
          enemy.health = 0;
          
          // Try different destruction methods
          if (typeof enemy.defeat === 'function') {
            enemy.defeat();
          } else if (typeof enemy.destroy === 'function') {
            enemy.destroy();
          }
        }
      }
      
      // Force health bar update
      if (typeof enemy.updateHealthBar === 'function') {
        enemy.updateHealthBar();
      } else if (enemy.healthBar) {
        // Manual health bar update
        const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
        
        if (enemy.healthBar.fill) {
          enemy.healthBar.fill.width = 40 * healthPercent;
          enemy.healthBar.fill.x = enemyX - 20 + (enemy.healthBar.fill.width / 2);
        }
      }
    } catch (error) {
      console.error("Error applying damage to enemy:", error);
    }
    
    // Reset cooldown to full duration
    this.cooldownRemaining = this.cooldown || 2000;
    this.lastAttackTime = currentTime;
    
    // Show attack animation
    if (this.type === 'scarecrow') {
      // ABS penguin mage attack animation
      if (this.sprite) {
        this.sprite.setTexture('ABS_attack');
        
        // Cast animation effect
        if (this.scene && this.scene.tweens) {
          this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            onComplete: () => {
              // Switch back to idle sprite
              if (this.sprite && this.sprite.active) {
                this.sprite.setTexture('ABS_idle');
              }
            }
          });
        }
      }
      
      // Launch fireball
      this.launchFireball(enemy, 'blue');
      
      // Show spell effect
      this.showDamageText(enemy, `${damageAmount.toFixed(1)}`, 0x0088FF);
    } else if (this.type === 'dog') {
      // NOOT penguin mage attack animation
      if (this.sprite) {
        this.sprite.setTexture('NOOT_attack');
        
        // Cast animation effect
        if (this.scene && this.scene.tweens) {
          this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            onComplete: () => {
              // Switch back to idle sprite
              if (this.sprite && this.sprite.active) {
                this.sprite.setTexture('NOOT_idle');
              }
            }
          });
        }
      }
      
      // Launch fireball
      this.launchFireball(enemy, 'red');
      
      // Show spell effect
      this.showDamageText(enemy, `${damageAmount.toFixed(1)}`, 0xFF4400);
    }
    
    // Add simple attack effect
    this.createAttackEffect(enemy);
    
    return true;
  }
  
  // New method to launch fireball
  launchFireball(enemy, color) {
    // Create fireball sprite
    const fireball = this.scene.add.image(
      this.x, 
      this.y,
      color === 'blue' ? 'fireball_blue' : 'fireball_red'
    );
    fireball.setDisplaySize(24, 24);
    
    // Calculate angle for rotation
    const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
    fireball.setRotation(angle);
    
    // Calculate duration based on distance
    const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
    const duration = distance * 2; // 2ms per pixel
    
    // Animate the fireball
    this.scene.tweens.add({
      targets: fireball,
      x: enemy.x,
      y: enemy.y,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        // Create explosion effect
        const explosion = this.scene.add.circle(
          enemy.x, 
          enemy.y, 
          20, 
          color === 'blue' ? 0x00AAFF : 0xFF4400, 
          0.7
        );
        
        // Fade out explosion
        this.scene.tweens.add({
          targets: explosion,
          alpha: 0,
          scale: 2,
          duration: 300,
          onComplete: () => explosion.destroy()
        });
        
        // Destroy fireball
        fireball.destroy();
      }
    });
    
    // Add rotation animation for fireball
    this.scene.tweens.add({
      targets: fireball,
      rotation: angle + Math.PI * 4, // Rotate 2 full circles
      duration: duration,
      ease: 'Linear'
    });
  }
  
  // Helper function to convert number to hex string
  convertToHexString(color) {
    // Convert number to hex string and ensure it has 6 digits
    let hexString = color.toString(16);
    // Pad with zeros if needed
    while (hexString.length < 6) {
      hexString = '0' + hexString;
    }
    return '#' + hexString;
  }
  
  // Show damage text floating up
  showDamageText(target, amount, color = 0xFF0000) {
    try {
      // Skip if scene is invalid
      if (!this.scene) return;

      // Get the target position
      let x, y;
      if (typeof target === 'object' && target !== null) {
        // If target is an enemy object
        x = target.x;
        y = target.y;
      } else {
        // If x,y coordinates were passed directly
        x = target;
        y = amount;
        amount = color;
        color = arguments[3] || 0xFF0000;
      }

      // Convert color number to hex string directly
      let colorHex = '#FF0000'; // Default red
      if (typeof color === 'number') {
        colorHex = '#' + color.toString(16).padStart(6, '0');
      }

      const text = this.scene.add.text(x, y, amount, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: colorHex,
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      // Animate text
      this.scene.tweens.add({
        targets: text,
        y: y - 30,
        alpha: 0,
        duration: 1000,
        onComplete: () => text.destroy()
      });
    } catch (error) {
      console.error("Error showing damage text:", error);
    }
  }
  
  createAttackEffect(enemy) {
    // Create sparkling effect around enemy when hit
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const x = enemy.x + Math.cos(angle) * 20;
      const y = enemy.y + Math.sin(angle) * 20;
      
      const spark = this.scene.add.circle(
        x, y, 3, 
        this.type === 'scarecrow' ? 0x00AAFF : 0xFF4400, 
        0.8
      );
      
      // Animate spark outward
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 15,
        y: y + Math.sin(angle) * 15,
        alpha: 0,
        duration: 300,
        onComplete: () => spark.destroy()
      });
    }
  }
  
  destroy() {
    console.log(`Destroying ${this.type} at (${this.x}, ${this.y})`);
    this.active = false;
    
    // Clean up sprites
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    
    if (this.rangeIndicator) {
      this.rangeIndicator.destroy();
      this.rangeIndicator = null;
    }
    
    // Remove from defenses array in scene
    if (this.scene && this.scene.defenses) {
      const index = this.scene.defenses.indexOf(this);
      if (index !== -1) {
        this.scene.defenses.splice(index, 1);
      }
    }
  }
  
  // Helper method to get the display name for this defense
  getDisplayName() {
    if (this.type === 'scarecrow') {
      return 'ABS Ice Mage';
    } else if (this.type === 'dog') {
      return 'NOOT Fire Mage';
    } else {
      return this.type.charAt(0).toUpperCase() + this.type.slice(1);
    }
  }
  
  // Helper method to get the color for this defense
  getColor() {
    if (this.type === 'scarecrow') {
      return '#0088FF'; // Blue for ABS
    } else if (this.type === 'dog') {
      return '#FF4400'; // Red for NOOT
    } else {
      return '#FFFFFF'; // Default white
    }
  }
  
  // Helper method to get the element type
  getElement() {
    if (this.type === 'scarecrow') {
      return 'ice';
    } else if (this.type === 'dog') {
      return 'fire';
    } else {
      return 'normal';
    }
  }
  
  // Apply upgrades from the upgrade system
  applyUpgrades() {
    if (!this.scene.upgradeSystem) return;
    
    try {
      // Apply type-specific power upgrades
      if (this.type === 'scarecrow') {
        const powerMultiplier = this.scene.upgradeSystem.getUpgradeValue('scarecrowPower');
        this.updatePower(powerMultiplier);
      } else if (this.type === 'dog') {
        const powerMultiplier = this.scene.upgradeSystem.getUpgradeValue('dogPower');
        this.updatePower(powerMultiplier);
      }
    } catch (err) {
      console.error("Error applying defense upgrades:", err);
    }
  }
  
  // Update the power of this defense
  updatePower(multiplier) {
    if (typeof multiplier !== 'number' || multiplier <= 0) return;
    
    // Store original damage for reference
    const originalDamage = this.type === 'scarecrow' ? 1 : 2;
    
    // Apply multiplier to damage
    this.damage = originalDamage * multiplier;
    
    console.log(`${this.type} power updated to ${this.damage.toFixed(1)} (×${multiplier.toFixed(1)})`);
    
    // Visual feedback for power upgrade
    if (this.sprite) {
      // Create a pulse effect
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 200,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          if (this.sprite) {
            this.sprite.setScale(1.0);
          }
        }
      });
      
      // Create a color flash effect based on defense type
      const tint = this.type === 'scarecrow' ? 0x00FFFF : 0xFF4400;
      this.scene.tweens.add({
        targets: this.sprite,
        tint: tint,
        duration: 200,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          if (this.sprite) {
            this.sprite.clearTint();
          }
        }
      });
    }
  }
  
  // Show a temporary line connecting defense to target
  showTargetLine(enemy) {
    if (!this.scene || !enemy) return;
    
    // Create line if it doesn't exist
    if (!this.targetLine) {
      this.targetLine = this.scene.add.line(0, 0, this.x, this.y, 
        enemy.x, enemy.y, this.type === 'scarecrow' ? 0x00FFFF : 0xFF4400, 0.3);
      this.targetLine.setLineWidth(1);
    } else {
      // Update existing line
      this.targetLine.setTo(this.x, this.y, enemy.x, enemy.y);
      this.targetLine.setVisible(true);
    }
    
    // Hide after short delay
    this.scene.time.delayedCall(200, () => {
      if (this.targetLine) this.targetLine.setVisible(false);
    });
  }
  
  // Perform a scanning animation when no enemies are in range
  performScanAnimation() {
    if (!this.scene || !this.sprite) return;
    if (this.isScanning) return;
    
    // Set scanning flag to prevent multiple concurrent scans
    this.isScanning = true;
    
    // Small rotation to simulate looking around
    this.scene.tweens.add({
      targets: this.sprite,
      angle: '+=30',
      duration: 1000,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        this.isScanning = false;
      }
    });
  }
} 