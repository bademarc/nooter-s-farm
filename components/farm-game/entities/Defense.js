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
    
    // Reduce attack cooldown time
    if (this.attackCooldown > 0) {
      this.attackCooldown -= 16.67; // Approximately 60 frames per second
    }
    
    // Debug
    if (this.debugMode && this.scene && this.scene.time && this.scene.time.now % 1000 < 20) {
      console.log(`Defense at ${this.x},${this.y} actively scanning for enemies. Cooldown: ${this.attackCooldown}`);
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
    // IMPORTANT: Aggressive enemy targeting to make sure mages never ignore enemies
    
    // Skip if on cooldown but show ready status
    if (this.attackCooldown > 0) {
      // Set "ready" appearance when cooldown almost done
      if (this.attackCooldown < 500 && this.sprite && !this.readyState) {
        this.readyState = true;
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 300,
          yoyo: true,
          repeat: 0
        });
      }
      return;
    }
    
    // Reset ready state
    this.readyState = false;
    
    // Always check for enemies (even if list appears empty - for safety)
    if (!this.scene.enemies) this.scene.enemies = [];
    
    let foundEnemy = false;
    let closestDistance = Infinity;
    let closestEnemy = null;
    
    // Find closest enemy in range - aggressive checking
    for (let i = 0; i < this.scene.enemies.length; i++) {
      const enemy = this.scene.enemies[i];
      if (!enemy) continue;
      
      // Try multiple ways to get position - in case enemy structure varies
      const enemyX = enemy.x || (enemy.sprite ? enemy.sprite.x : 0);
      const enemyY = enemy.y || (enemy.sprite ? enemy.sprite.y : 0);
      
      // Skip enemies without position
      if (!enemyX || !enemyY) continue;
      
      const dx = enemyX - this.x;
      const dy = enemyY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= this.range && distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
        foundEnemy = true;
      }
    }
    
    // Attack if found - NEVER ignore a valid target!
    if (foundEnemy && closestEnemy) {
      this.attack(closestEnemy);
      
      // Show targeting visuals
      this.showTargetLine(closestEnemy);
      
      // High visibility mode for debug
      if (this.debugMode) {
        console.log(`Defense attacking enemy at ${closestEnemy.x},${closestEnemy.y} from ${this.x},${this.y}`);
      }
    } else {
      // Perform a scanning animation to show the mage is actively looking
      this.performScanAnimation();
    }
  }
  
  attack(enemy) {
    if (!this.active || !enemy || !enemy.active) return;
    
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastAttackTime < this.cooldown) return;
    
    // Check if enemy is in range
    const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
    if (distance > this.range) return;
    
    // Check if enemy type is valid target
    if (!this.targetTypes.includes(enemy.type)) return;
    
    // Apply damage
    enemy.takeDamage(this.damage);
    
    // Update last attack time
    this.lastAttackTime = currentTime;
    
    // Show attack animation
    if (this.type === 'scarecrow') {
      // ABS penguin mage attack animation
      this.sprite.setTexture('ABS_attack');
      
      // Cast animation effect
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        onComplete: () => {
          // Switch back to idle sprite
          this.sprite.setTexture('ABS_idle');
        }
      });
      
      // Launch fireball
      this.launchFireball(enemy, 'blue');
      
      // Show spell effect
      this.showDamageText(enemy, "FREEZE!", 0x0088FF);
    } else if (this.type === 'dog') {
      // NOOT penguin mage attack animation
      this.sprite.setTexture('NOOT_attack');
      
      // Cast animation effect
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        onComplete: () => {
          // Switch back to idle sprite
          this.sprite.setTexture('NOOT_idle');
        }
      });
      
      // Launch fireball
      this.launchFireball(enemy, 'red');
      
      // Show spell effect
      this.showDamageText(enemy, "BURN!", 0xFF4400);
    }
    
    // Create attack effect (visual-only effects)
    this.createAttackEffect(enemy);
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
  showDamageText(x, y, amount, color = 0xFF0000) {
    try {
      // Skip if scene is invalid
      if (!this.scene) return;

      // Convert color number to hex string
      const colorString = this.convertToHexString(color);

      const text = this.scene.add.text(x, y, amount, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: colorString
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
  
  // Show damage text floating up
  showDamageText(x, y, amount, color = 0xFF0000) {
    try {
      // Skip if scene is invalid
      if (!this.scene) return;

      // Convert color number to hex string directly
      let colorHex = '#FF0000'; // Default red
      if (typeof color === 'number') {
        colorHex = '#' + color.toString(16).padStart(6, '0');
      }

      const text = this.scene.add.text(x, y, amount, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: colorHex
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