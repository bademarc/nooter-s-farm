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
    
    // Special attack properties
    this.specialAttackAvailable = false;
    this.specialAttackCooldown = 10000; // 10 seconds cooldown
    this.specialAttackLastUsed = 0;
    this.specialAttackDamageMultiplier = 2.5; // Special attack deals 2.5x normal damage
    this.enemiesDefeated = 0; // Track enemies defeated by this mage
    this.enemiesNeededForSpecial = 5; // Number of enemies needed to unlock special attack
    
    // Get current wave for scaling
    const currentWave = this.scene.gameState?.wave || 1;
    
    // Set properties based on defense type
    if (type === 'scarecrow') {
      this.cost = 35; 
      this.range = 250; // Increased range for ice mage
      this.cooldown = 1000; // 1 second cooldown for ice mage
      this.damage = 1.2; // Reduced damage for balance (was 1.5)
      this.targetTypes = ['bird'];
      this.aoeRadius = 80; // Radius of area effect for ice mage
      this.aoeDamageMultiplier = 0.7; // AoE damage is 70% of direct damage
      this.createABSMage();
    } else if (type === 'dog') {
      this.cost = 50;
      this.range = 200; // Increased range for fire mage
      this.cooldown = 800; // 0.8 second cooldown for fire mage
      this.damage = 2.0; // Reduced damage for balance (was 2.5)
      this.targetTypes = ['rabbit'];
      this.aoeRadius = 60; // Radius of area effect for fire mage
      this.aoeDamageMultiplier = 0.8; // AoE damage is 80% of direct damage
      this.createNOOTMage();
    } else if (type === 'wizard') {
      this.cost = 100;
      this.range = 300; // Longer range for wizard
      this.cooldown = 1500; // 1.5 second cooldown
      this.damage = 3.0; // High damage
      this.targetTypes = ['bird', 'rabbit']; // Can target all enemy types
      this.aoeRadius = 120; // Larger area of effect
      this.aoeDamageMultiplier = 0.9; // Strong area effect
      this.createWizard();
    } else if (type === 'cannon') {
      this.cost = 150;
      this.range = 350; // Very long range for cannon
      this.cooldown = 2000; // 2 second cooldown
      this.damage = 5.0; // Very high damage
      this.targetTypes = ['bird', 'rabbit']; // Can target all enemy types
      this.aoeRadius = 150; // Largest area of effect
      this.aoeDamageMultiplier = 1.0; // Full damage in area
      this.createCannon();
    }
    
    // Store the last time this defense attacked
    this.lastAttackTime = 0;
    this.cooldownRemaining = 0;
    
    // Add visual range indicator that's visible for a few seconds after placement
    this.showRange();
    this.scene.time.delayedCall(3000, () => this.hideRange());
    
    // Create cooldown text indicator
    this.createCooldownText();
    
    const defenseName = type === 'scarecrow' ? 'ABS ice mage' : type === 'dog' ? 'NOOT fire mage' : type === 'wizard' ? 'Wizard' : type === 'cannon' ? 'Cannon' : type.charAt(0).toUpperCase() + type.slice(1);
    console.log(`Created ${defenseName} at ${x}, ${y} with range ${this.range}`);
    
    // Apply any existing upgrades
    this.applyUpgrades();
  }
  
  createABSMage() {
    // Create visual representation of ABS penguin
    this.sprite = this.scene.add.image(this.x, this.y, 'ABS_idle');
    this.sprite.setDisplaySize(48, 48); // Scale to appropriate size
    
    // Add a range indicator (usually invisible, shown on hover)
    this.rangeIndicator = this.scene.add.circle(this.x, this.y, this.range, 0xFFFFFF, 0.1);
    this.rangeIndicator.setStrokeStyle(2, 0x0088FF); // Blue outline for range
    
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
  
  createCooldownText() {
    // Create a text object to display cooldown
    const color = this.type === 'scarecrow' ? '#0088FF' : this.type === 'dog' ? '#FF4400' : this.type === 'wizard' ? '#FF00FF' : this.type === 'cannon' ? '#FF0000' : '#FFFFFF';
    this.cooldownText = this.scene.add.text(this.x, this.y - 30, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: color,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // Set depth to ensure it's visible above other elements
    this.cooldownText.setDepth(300);
    
    // Hide initially
    this.cooldownText.visible = false;
    
    // Create ready indicator
    const readyColor = this.type === 'scarecrow' ? 0x0088FF : this.type === 'dog' ? 0xFF4400 : this.type === 'wizard' ? 0xFF00FF : this.type === 'cannon' ? 0xFF0000 : 0xFFFFFF;
    this.readyIndicator = this.scene.add.circle(this.x, this.y - 25, 5, readyColor, 0.8);
    this.readyIndicator.setStrokeStyle(1, 0xFFFFFF);
    this.readyIndicator.setDepth(300);
    this.readyIndicator.visible = true;
  }
  
  updateCooldownText() {
    try {
      if (!this.active || !this.cooldownText) return;
      
      // Calculate remaining cooldown
      const now = this.scene ? this.scene.time.now : 0;
      const elapsed = now - this.lastAttackTime;
      const remaining = Math.max(0, this.cooldown - elapsed);
      
      // Update the cooldown text
      if (remaining <= 0) {
        // Hide cooldown when ready
        this.cooldownText.setVisible(false);
      } else {
        // Show seconds with one decimal point
        const seconds = (remaining / 1000).toFixed(1);
        this.cooldownText.setText(`${seconds}s`);
        this.cooldownText.setVisible(true);
        
        // Position the text above the defense tower
        if (this.sprite) {
          this.cooldownText.x = this.sprite.x;
          this.cooldownText.y = this.sprite.y - 50;
        }
        
        // Colorize based on remaining time
        if (remaining < this.cooldown * 0.3) {
          // Almost ready - green
          this.cooldownText.setFill('#00FF00');
        } else if (remaining < this.cooldown * 0.7) {
          // Mid cooldown - yellow
          this.cooldownText.setFill('#FFFF00');
        } else {
          // Just started cooldown - red
          this.cooldownText.setFill('#FF0000');
        }
        
        // Add a cooldown indicator on mage head
        this.updateCooldownIndicator(remaining / this.cooldown);
      }
    } catch (error) {
      console.error("Error updating cooldown text:", error);
    }
  }
  
  // Create a visual cooldown indicator on the mage
  createCooldownIndicator() {
    try {
      if (!this.scene) return;
      
      // Remove existing indicator if any
      if (this.cooldownIndicator) {
        this.cooldownIndicator.destroy();
      }
      
      // Create container for cooldown graphics
      this.cooldownContainer = this.scene.add.container(this.x, this.y);
      this.cooldownContainer.setDepth(120);
      
      // Background circle - semi-transparent black
      this.cooldownBg = this.scene.add.circle(0, -40, 15, 0x000000, 0.5);
      this.cooldownContainer.add(this.cooldownBg);
      
      // Foreground arc for indicating progress - starts empty
      this.cooldownIndicator = this.scene.add.graphics();
      this.cooldownIndicator.fillStyle(this.type === 'scarecrow' ? 0x66CCFF : this.type === 'dog' ? 0xFF6644 : this.type === 'wizard' ? 0xFF00FF : this.type === 'cannon' ? 0xFF0000 : 0xFFFFFF, 1);
      this.cooldownContainer.add(this.cooldownIndicator);
      
      // Add this to our container if it exists
      if (this.container) {
        this.container.add(this.cooldownContainer);
      }
      
      // Hide by default until needed
      this.cooldownContainer.setVisible(false);
    } catch (error) {
      console.error("Error creating cooldown indicator:", error);
    }
  }
  
  // Update the cooldown indicator visual based on remaining cooldown percentage
  updateCooldownIndicator(remainingPercent) {
    try {
      if (!this.cooldownContainer || !this.cooldownIndicator) {
        // Create if doesn't exist
        this.createCooldownIndicator();
        if (!this.cooldownIndicator) return;
      }
      
      // Make visible
      this.cooldownContainer.setVisible(true);
      
      // Update position to follow the mage
      this.cooldownContainer.x = this.x;
      this.cooldownContainer.y = this.y;
      
      // Clear previous drawing
      this.cooldownIndicator.clear();
      
      // Only draw if actually on cooldown
      if (remainingPercent > 0) {
        // Draw cooldown arc - we draw clockwise from top, so it depletes clockwise
        this.cooldownIndicator.fillStyle(this.type === 'scarecrow' ? 0x66CCFF : this.type === 'dog' ? 0xFF6644 : this.type === 'wizard' ? 0xFF00FF : this.type === 'cannon' ? 0xFF0000 : 0xFFFFFF, 1);
        
        // Calculate end angle based on remaining percent (radians)
        // 0 at top, increases clockwise
        const startAngle = -Math.PI / 2; // Start at top (-90 degrees)
        const endAngle = startAngle + (Math.PI * 2 * (1 - remainingPercent)); // Full circle is 2*PI
        
        // Draw the arc
        this.cooldownIndicator.slice(0, -40, 15, startAngle, endAngle, false);
        this.cooldownIndicator.fillPath();
      } else {
        // Hide when cooldown is complete
        this.cooldownContainer.setVisible(false);
      }
    } catch (error) {
      console.error("Error updating cooldown indicator:", error);
    }
  }
  
  // Reset cooldown
  resetCooldown() {
    // Set the last attack time
    this.lastAttackTime = this.scene ? this.scene.time.now : 0;
    
    // Show the cooldown
    if (this.cooldownText) {
      this.cooldownText.setVisible(true);
    }
    
    // Create initial cooldown text if doesn't exist
    if (!this.cooldownText && this.scene) {
      this.createCooldownText();
    }
    
    // Create cooldown indicator if doesn't exist
    if (!this.cooldownIndicator && this.scene) {
      this.createCooldownIndicator();
    }
    
    // Update the cooldown display immediately
    this.updateCooldownText();
  }
  
  update() {
    // Update cooldown
    if (this.cooldownRemaining > 0) {
      // Reduce cooldown based on time since last frame 
      // (we'll assume 16.67ms if delta isn't available - 60fps)
      this.cooldownRemaining -= 16.67;
      if (this.cooldownRemaining < 0) {
        this.cooldownRemaining = 0;
      }
      
      // Update cooldown text
      this.updateCooldownText();
    } else if (!this.updatedReadyState) {
      // Update once when cooldown reaches zero
      this.updateCooldownText();
      this.updatedReadyState = true;
    }
    
    // Also check if special attack is available
    this.checkSpecialAttackAvailability();
    
    // Make sure cooldown text and ready indicator stay above the mage
    if (this.cooldownText) {
      this.cooldownText.x = this.x;
      this.cooldownText.y = this.y - 30;
    }
    
    if (this.readyIndicator) {
      this.readyIndicator.x = this.x;
      this.readyIndicator.y = this.y - 25;
    }
    
    // Only attempt to attack if not on cooldown
    if (this.cooldownRemaining <= 0) {
      this.attackNearestEnemy(true);
    }
    
    // Occasionally pulse to show we're active
    if (Math.random() < 0.01) {
      this.pulse();
    }
  }
  
  attackNearestEnemy(forceAttack = false) {
    // Try to use special attack first if it's available
    if (this.specialAttackAvailable && Math.random() < 0.2) { // 20% chance to use special when available
      const specialUsed = this.performSpecialAttack();
      if (specialUsed) return true;
    }
    
    // Skip if on cooldown and not forcing attack
    if (this.cooldownRemaining > 0 && !forceAttack) {
      return false;
    }
    
    // Check if scene has enemies
    if (!this.scene || !Array.isArray(this.scene.enemies) || this.scene.enemies.length === 0) {
      return false;
    }
    
    // Find best enemy to attack
    let bestEnemy = null;
    let bestDistance = Infinity;
    
    // Use actual range for radius-based attack
    const attackRange = this.range;
    
    // Check all enemies
    for (const enemy of this.scene.enemies) {
      if (!enemy || !enemy.active) continue;
      
      // Ensure enemy has position
      const enemyX = enemy.x || (enemy.container && enemy.container.x) || (enemy.sprite && enemy.sprite.x);
      const enemyY = enemy.y || (enemy.container && enemy.container.y) || (enemy.sprite && enemy.sprite.y);
      
      if (!enemyX || !enemyY) continue;
      
      // Calculate distance
      const dx = this.x - enemyX;
      const dy = this.y - enemyY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If this is closer than our best so far, and within range, store it
      if (distance < bestDistance && distance <= attackRange) {
        bestDistance = distance;
        bestEnemy = enemy;
      }
    }
    
    // If found an enemy to attack, attack it
    if (bestEnemy) {
      const attacked = this.attack(bestEnemy);
      return attacked;
    }
    
    return false;
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
  
  attack(enemy) {
    if (!this.active) return false;
    
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
    
    // Check if enemy is within range
    if (distance > this.range) {
      return false;
    }
    
    // Calculate damage with special logic for low-health enemies
    let damageAmount = this.damage;
    
    // IMPORTANT FIX: Always kill enemies with low health
    // This prevents enemies getting stuck at 1 HP
    if (enemy.health <= 2) {
      // GUARANTEED KILL: Set damage higher than remaining health
      damageAmount = enemy.health * 10; // Increased dramatically to ensure kill
      
      // Force health to zero for critical hits
      if (enemy.health <= 1.1) {
        console.log(`Critical hit on enemy with ${enemy.health.toFixed(1)} health! Forcing to 0.`);
        enemy.health = 0; // Force to zero
        
        // Force call to defeated if available
        if (typeof enemy.defeated === 'function') {
          enemy.defeated();
          this.showDamageText(enemy, "CRITICAL!", 0xFFFF00);
          return true;
        }
      }
      
      // Display critical hit message
      this.showDamageText(enemy, "CRITICAL!", 0xFFFF00);
    }
    
    // Apply damage to primary target
    const defeated = this.applyDamageToEnemy(enemy, damageAmount);
    
    // Apply area of effect damage to nearby enemies
    if (this.type === 'scarecrow') {
      // Ice mage AOE attack
      this.performAreaAttack(enemyX, enemyY, this.aoeRadius, this.damage * this.aoeDamageMultiplier, 'ice');
    } else if (this.type === 'dog') {
      // Fire mage AOE attack
      this.performAreaAttack(enemyX, enemyY, this.aoeRadius, this.damage * this.aoeDamageMultiplier, 'fire');
    }
    
    // Reset and display cooldown
    this.resetCooldown();
    
    // Record last attack time
    this.lastAttackTime = this.scene ? this.scene.time.now : 0;
    
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
    } else {
      // Generic attack effect
      this.createAttackEffect(enemy);
    }
    
    return defeated;
  }
  
  // Apply damage to a single enemy
  applyDamageToEnemy(enemy, damageAmount) {
    try {
      // Safety check
      if (!enemy || !enemy.active) {
        console.log("Cannot damage inactive enemy");
        return false;
      }
      
      console.log(`Applying ${damageAmount.toFixed(1)} damage to ${enemy.type} enemy with health ${enemy.health.toFixed(1)}/${enemy.maxHealth}`);
      
      // Store initial health to check if this attack defeats the enemy
      const initialHealth = enemy.health || 0;
      
      // First try the standard takeDamage method
      let defeated = false;
      if (typeof enemy.takeDamage === 'function') {
        defeated = enemy.takeDamage(damageAmount);
      } 
      // If that fails, apply damage directly
      else {
        enemy.health -= damageAmount;
        
        // If health is zero or below, destroy the enemy
        if (enemy.health <= 0) {
          enemy.health = 0;
          defeated = true;
          
          // Try different destruction methods
          if (typeof enemy.defeated === 'function') {
            console.log("Calling enemy.defeated()");
            enemy.defeated();
          } else if (typeof enemy.defeat === 'function') {
            console.log("Calling enemy.defeat()");
            enemy.defeat();
          } else if (typeof enemy.destroy === 'function') {
            console.log("Calling enemy.destroy()");
            enemy.destroy();
          }
        }
      }
      
      // Check if this attack defeated the enemy
      if (initialHealth > 0 && (enemy.health <= 0 || defeated)) {
        console.log(`Enemy defeated by defense attack! Initial health: ${initialHealth.toFixed(1)}, Final health: ${enemy.health.toFixed(1)}`);
        
        // Ensure defeated method is called if health is zero but the enemy is still active
        if (enemy.health <= 0 && enemy.active && typeof enemy.defeated === 'function') {
          console.log("Forcing enemy.defeated() call");
          enemy.defeated();
        }
        
        // Track this defeat for special attack charging
        this.onEnemyDefeated();
        return true;
      }
      
      // Force health bar update
      if (typeof enemy.updateHealthBar === 'function') {
        enemy.updateHealthBar();
      } else if (enemy.healthBar) {
        // Manual health bar update
        const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
        
        if (enemy.healthBar.fill) {
          const enemyX = enemy.x || (enemy.sprite ? enemy.sprite.x : 0) || (enemy.container ? enemy.container.x : 0);
          enemy.healthBar.fill.width = 40 * healthPercent;
          enemy.healthBar.fill.x = enemyX - 20 + (enemy.healthBar.fill.width / 2);
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error applying damage to enemy:", error);
      return false;
    }
  }
  
  // Method to handle area of effect damage for mage attacks
  performAreaAttack(targetX, targetY, radius, damage, element, isSpecial = false) {
    try {
      if (!this.scene || !this.scene.enemies) return;
      
      // Create visual effect for AOE
      const aoeColor = element === 'ice' ? 0x66CCFF : 0xFF6644;
      const aoeVisual = this.scene.add.circle(targetX, targetY, radius, aoeColor, isSpecial ? 0.5 : 0.3);
      aoeVisual.setDepth(150);
      
      // Play sound effect if available
      if (this.scene.sound) {
        const soundKey = element === 'ice' ? 'ice_attack' : 'fire_attack';
        if (this.scene.sound.get(soundKey)) {
          this.scene.sound.play(soundKey, { volume: isSpecial ? 0.6 : 0.4 });
        }
      }
      
      // Animation for the AOE effect - enhanced for special attacks
      this.scene.tweens.add({
        targets: aoeVisual,
        alpha: 0,
        scale: isSpecial ? 2.0 : 1.5,
        duration: isSpecial ? 800 : 600,
        onComplete: () => aoeVisual.destroy()
      });
      
      // Create particle effects based on element
      const particleCount = Math.min(Math.floor(radius * 0.8), 40); // Scale with radius, but cap
      
      for (let i = 0; i < particleCount; i++) {
        // Random position within the circle
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius * 0.9; // Keep within 90% of radius
        const particleX = targetX + Math.cos(angle) * distance;
        const particleY = targetY + Math.sin(angle) * distance;
        
        // Element specific particle
        let particle;
        if (element === 'ice') {
          // Ice shard or snowflake
          particle = this.scene.add.circle(particleX, particleY, 3 + Math.random() * 2, 0xAACCFF, 0.8);
        } else {
          // Fire spark or ember
          particle = this.scene.add.circle(particleX, particleY, 2 + Math.random() * 3, 0xFF8844, 0.8);
        }
        
        particle.setDepth(151);
        
        // Animate particle
        this.scene.tweens.add({
          targets: particle,
          alpha: 0,
          scale: { from: 1.0, to: 0.2 },
          x: particleX + (Math.random() * 20 - 10),
          y: particleY + (Math.random() * 20 - 10),
          duration: 300 + Math.random() * 300,
          onComplete: () => particle.destroy()
        });
      }
      
      // Apply damage to all enemies in radius
      let enemiesHit = 0;
      this.scene.enemies.forEach(enemy => {
        if (!enemy || !enemy.active) return;
        
        // Get enemy position
        const enemyX = enemy.x || (enemy.container && enemy.container.x);
        const enemyY = enemy.y || (enemy.container && enemy.container.y);
        
        if (!enemyX || !enemyY) return;
        
        // Calculate distance to explosion center
        const dx = enemyX - targetX;
        const dy = enemyY - targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply damage to enemies within radius
        if (distance <= radius) {
          // Calculate damage falloff based on distance (full damage at center, 50% at edge)
          const damageMultiplier = 1 - (distance / radius) * 0.5;
          const finalDamage = damage * damageMultiplier;
          
          // Apply damage to enemy
          if (typeof enemy.takeDamage === 'function') {
            enemy.takeDamage(finalDamage);
            enemiesHit++;
            
            // Apply status effect based on element
            if (element === 'ice' && typeof enemy.applyStatusEffect === 'function') {
              enemy.applyStatusEffect('slow', 2); // Apply slow for 2 seconds
            } else if (element === 'fire' && typeof enemy.applyStatusEffect === 'function') {
              enemy.applyStatusEffect('burn', 3); // Apply burn for 3 seconds
            }
            
            // Show damage number
            this.showDamageNumber(enemyX, enemyY, finalDamage, element === 'ice' ? 0x66CCFF : 0xFF4400);
          }
        }
      });
      
      return enemiesHit;
    } catch (error) {
      console.error("Error performing area attack:", error);
      return 0;
    }
  }
  
  // Helper method to show damage numbers
  showDamageNumber(x, y, amount, color = 0xFFFFFF) {
    if (!this.scene) return;
    
    try {
      // Create text object for damage number
      const damageText = this.scene.add.text(
        x, 
        y - 20, // Position above the target
        Math.round(amount).toString(),
        { 
          fontFamily: 'Arial', 
          fontSize: '16px', 
          color: color ? '#' + color.toString(16).padStart(6, '0') : '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 2
        }
      );
      damageText.setDepth(300); // Very high depth to be above everything
      
      // Animate the damage number
      this.scene.tweens.add({
        targets: damageText,
        y: y - 40, // Float upward
        alpha: 0,
        scale: 1.2, // Grow slightly
        duration: 800,
        onComplete: () => damageText.destroy()
      });
    } catch (error) {
      console.error("Error showing damage number:", error);
    }
  }
  
  // New method to launch fireball
  launchFireball(enemy, color, isSpecial = false) {
    try {
      // Ensure we have required references
      if (!this.scene || !enemy) return;
      
      // Get enemy position with fallbacks
      const enemyX = enemy.x || (enemy.container && enemy.container.x) || (enemy.sprite && enemy.sprite.x) || 400;
      const enemyY = enemy.y || (enemy.container && enemy.container.y) || (enemy.sprite && enemy.sprite.y) || 300;
      
      // Create fireball sprite with fallbacks
      let fireball;
      
      // Use the new assets for fireballs 
      const textureKey = color === 'blue' ? 'iceball' : 'fireball';
      
      // Try to use the appropriate texture
      if (this.scene.textures.exists(textureKey)) {
        fireball = this.scene.add.image(
          this.x, 
          this.y,
          textureKey
        );
        fireball.setDisplaySize(isSpecial ? 32 : 24, isSpecial ? 32 : 24);
      } else {
        // Fallback to a colored circle
        fireball = this.scene.add.circle(
          this.x,
          this.y,
          isSpecial ? 16 : 12,
          color === 'blue' ? 0x00AAFF : 0xFF4400
        );
      }
      
      // Add glowing effect for the fireball
      const glow = this.scene.add.circle(
        this.x,
        this.y,
        isSpecial ? 18 : 14,
        color === 'blue' ? 0x66BBFF : 0xFF8844,
        0.4
      );
      glow.setDepth(199);
      
      // Ensure the projectile is created at a high depth to be visible
      fireball.setDepth(200);
      
      // Store reference to enemy and damage
      fireball.targetEnemy = enemy;
      fireball.damage = isSpecial ? this.damage * this.specialAttackDamageMultiplier : this.damage;
      fireball.glow = glow; // Store reference to the glow effect
      fireball.isAOE = true; // Mark as AOE projectile
      fireball.isSpecial = isSpecial; // Mark as special projectile
      
      // Calculate angle for rotation
      const angle = Phaser.Math.Angle.Between(this.x, this.y, enemyX, enemyY);
      if (fireball.setRotation) {
        fireball.setRotation(angle);
      }
      
      // Calculate duration based on distance
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemyX, enemyY);
      const duration = distance * 2; // 2ms per pixel
      
      // Add movement properties in case tweens fail
      fireball.vx = Math.cos(angle) * 5;
      fireball.vy = Math.sin(angle) * 5;
      
      // Add to scene projectiles array
      if (!this.scene.projectiles) {
        this.scene.projectiles = [];
      }
      this.scene.projectiles.push(fireball);
      
      // Add custom update function as a backup
      fireball.update = function() {
        // Move towards target
        this.x += this.vx;
        this.y += this.vy;
        
        // Update glow position
        if (this.glow) {
          this.glow.x = this.x;
          this.glow.y = this.y;
        }
        
        // Get current enemy position
        const targetX = this.targetEnemy.x || (this.targetEnemy.container && this.targetEnemy.container.x) || 400;
        const targetY = this.targetEnemy.y || (this.targetEnemy.container && this.targetEnemy.container.y) || 300;
        
        // Check for hit
        const dx = this.x - targetX;
        const dy = this.y - targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 20) {
          // Hit enemy
          if (typeof this.targetEnemy.takeDamage === 'function') {
            this.targetEnemy.takeDamage(this.damage);
          }
          // Destroy the fireball (the explosion will be handled in the tween onComplete)
          this.destroy();
        }
        
        // Destroy if offscreen
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
          // Also destroy the glow
          if (this.glow) {
            this.glow.destroy();
          }
          this.destroy();
        }
      };
      
      // Create fireball trail for visual effect
      const trailInterval = setInterval(() => {
        if (!fireball.active) {
          clearInterval(trailInterval);
          return;
        }
        
        // Create trail particle based on mage type
        const trailParticle = this.scene.add.circle(
          fireball.x + (Math.random() * 6 - 3),
          fireball.y + (Math.random() * 6 - 3),
          3 + Math.random() * 3,
          color === 'blue' ? 0x99CCFF : 0xFF8844,
          0.7
        );
        trailParticle.setDepth(198);
        
        // Fade out trail
        this.scene.tweens.add({
          targets: trailParticle,
          alpha: 0,
          scale: 0.5,
          duration: 300,
          onComplete: () => trailParticle.destroy()
        });
      }, 50); // Create trail particle every 50ms
      
      // Animate the fireball with tweens (preferred method)
      this.scene.tweens.add({
        targets: fireball,
        x: enemyX,
        y: enemyY,
        duration: duration,
        ease: 'Linear',
        onUpdate: () => {
          // Update glow position
          if (glow) {
            glow.x = fireball.x;
            glow.y = fireball.y;
          }
        },
        onComplete: () => {
          // Create explosion effect
          const explosion = this.scene.add.circle(
            enemyX, 
            enemyY, 
            20, 
            color === 'blue' ? 0x00AAFF : 0xFF4400, 
            0.7
          );
          explosion.setDepth(201);
          
          // Fade out explosion
          this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => explosion.destroy()
          });
          
          // Create AOE effect at impact point
          if (fireball.isAOE) {
            // Destroy the glow
            if (glow) {
              glow.destroy();
            }
            
            // Trigger the AOE effect at the impact point
            clearInterval(trailInterval);
          }
          
          // Destroy fireball
          fireball.destroy();
        }
      });
      
      // Add rotation animation for fireball (if it's an image)
      if (fireball.setRotation) {
        this.scene.tweens.add({
          targets: fireball,
          rotation: angle + Math.PI * 4, // Rotate 2 full circles
          duration: duration,
          ease: 'Linear'
        });
      }
      
      // Add pulsing effect to the glow
      this.scene.tweens.add({
        targets: glow,
        scale: { from: 1.0, to: 1.3 },
        alpha: { from: 0.4, to: 0.2 },
        duration: 400,
        yoyo: true,
        repeat: -1
      });
    } catch (error) {
      console.error("Error launching fireball:", error);
    }
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
        this.type === 'scarecrow' ? 0x00AAFF : this.type === 'dog' ? 0xFF4400 : this.type === 'wizard' ? 0xFF00FF : this.type === 'cannon' ? 0xFF0000 : 0xFFFFFF, 
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
    
    // Clean up cooldown text
    if (this.cooldownText) {
      this.cooldownText.destroy();
      this.cooldownText = null;
    }
    
    // Clean up ready indicator
    if (this.readyIndicator) {
      this.readyIndicator.destroy();
      this.readyIndicator = null;
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
    } else if (this.type === 'wizard') {
      return 'Wizard';
    } else if (this.type === 'cannon') {
      return 'Cannon';
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
    } else if (this.type === 'wizard') {
      return '#FF00FF'; // Purple for Wizard
    } else if (this.type === 'cannon') {
      return '#FF0000'; // Red for Cannon
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
    } else if (this.type === 'wizard') {
      return 'magic';
    } else if (this.type === 'cannon') {
      return 'rocket';
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
      } else if (this.type === 'wizard') {
        const powerMultiplier = this.scene.upgradeSystem.getUpgradeValue('wizardPower');
        this.updatePower(powerMultiplier);
      } else if (this.type === 'cannon') {
        const powerMultiplier = this.scene.upgradeSystem.getUpgradeValue('cannonPower');
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
    const originalDamage = this.type === 'scarecrow' ? 1.2 : this.type === 'dog' ? 2.0 : this.type === 'wizard' ? 3.0 : this.type === 'cannon' ? 5.0 : 1;
    
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
      const tint = this.type === 'scarecrow' ? 0x00FFFF : this.type === 'dog' ? 0xFF4400 : this.type === 'wizard' ? 0xFF00FF : this.type === 'cannon' ? 0xFF0000 : 0xFFFFFF;
      
      // Check if sprite has tint method before using it
      if (this.sprite.setTint && this.sprite.clearTint) {
        this.scene.tweens.add({
          targets: this.sprite,
          tint: tint,
          duration: 200,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            if (this.sprite && this.sprite.clearTint) {
              this.sprite.clearTint();
            }
          }
        });
      } else {
        // Alternative visual effect for sprites without tint support
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0.7,
          duration: 100,
          yoyo: true,
          repeat: 5
        });
      }
    }
  }
  
  // Show a temporary line connecting defense to target
  showTargetLine(enemy) {
    if (!this.scene || !enemy) return;
    
    // Create line if it doesn't exist
    if (!this.targetLine) {
      this.targetLine = this.scene.add.line(0, 0, this.x, this.y, 
        enemy.x, enemy.y, this.type === 'scarecrow' ? 0x00FFFF : this.type === 'dog' ? 0xFF4400 : this.type === 'wizard' ? 0xFF00FF : this.type === 'cannon' ? 0xFF0000 : 0xFFFFFF, 0.3);
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
  
  // Track enemy defeats by this mage
  onEnemyDefeated() {
    this.enemiesDefeated++;
    
    // Check if we've reached the threshold for special attack
    if (this.enemiesDefeated >= this.enemiesNeededForSpecial && !this.specialAttackAvailable) {
      this.specialAttackAvailable = true;
      this.showSpecialAttackReady();
    }
    
    // Award coins based on mage type
    if (this.scene && this.scene.gameState) {
      const coinReward = this.type === 'scarecrow' ? 3 : this.type === 'dog' ? 5 : this.type === 'wizard' ? 10 : this.type === 'cannon' ? 15 : 0;
      if (typeof this.scene.updateFarmCoins === 'function') {
        this.scene.updateFarmCoins(coinReward);
      }
    }
  }
  
  // Check if special attack is available
  checkSpecialAttackAvailability() {
    // Check cooldown for special attack
    if (this.specialAttackAvailable) {
      const now = this.scene ? this.scene.time.now : 0;
      const elapsed = now - this.specialAttackLastUsed;
      
      // Special attack is on cooldown
      if (elapsed < this.specialAttackCooldown) {
        // Update special attack cooldown indicator if it exists
        if (this.specialAttackIndicator) {
          const remainingPercent = 1 - (elapsed / this.specialAttackCooldown);
          this.updateSpecialAttackIndicator(remainingPercent);
        }
      } else {
        // Special attack is ready - show the indicator
        this.showSpecialAttackReady();
      }
    }
  }
  
  // Show an indicator that special attack is ready
  showSpecialAttackReady() {
    // Create or update the special attack ready indicator
    if (!this.specialAttackReadyIndicator && this.scene) {
      const color = this.type === 'scarecrow' ? 0x00FFFF : this.type === 'dog' ? 0xFF6600 : this.type === 'wizard' ? 0xFF00FF : this.type === 'cannon' ? 0xFF0000 : 0xFFFFFF;
      this.specialAttackReadyIndicator = this.scene.add.circle(this.x, this.y - 40, 10, color, 0.7);
      this.specialAttackReadyIndicator.setStrokeStyle(2, 0xFFFFFF);
      this.specialAttackReadyIndicator.setDepth(300);
      
      // Add pulsing animation to draw attention
      this.scene.tweens.add({
        targets: this.specialAttackReadyIndicator,
        scale: 1.3,
        alpha: 1,
        duration: 600,
        yoyo: true,
        repeat: -1
      });
      
      // Add text "SPECIAL" above the mage
      if (!this.specialAttackText) {
        this.specialAttackText = this.scene.add.text(this.x, this.y - 60, "SPECIAL", {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: this.type === 'scarecrow' ? '#00FFFF' : this.type === 'dog' ? '#FF6600' : this.type === 'wizard' ? '#FF00FF' : this.type === 'cannon' ? '#FF0000' : '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);
        this.specialAttackText.setDepth(300);
      }
    }
  }
  
  // Update the special attack cooldown indicator
  updateSpecialAttackIndicator(remainingPercent) {
    if (!this.specialAttackIndicator && this.scene) {
      // Create indicator if it doesn't exist
      this.specialAttackIndicator = this.scene.add.graphics();
      this.specialAttackIndicator.setDepth(300);
    }
    
    if (this.specialAttackIndicator) {
      this.specialAttackIndicator.clear();
      const color = this.type === 'scarecrow' ? 0x00FFFF : this.type === 'dog' ? 0xFF6600 : this.type === 'wizard' ? 0xFF00FF : this.type === 'cannon' ? 0xFF0000 : 0xFFFFFF;
      this.specialAttackIndicator.fillStyle(color, 0.5);
      
      // Draw an arc around the mage showing cooldown
      const radius = 25;
      const startAngle = -Math.PI / 2; // Start at top
      const endAngle = startAngle + (Math.PI * 2 * (1 - remainingPercent));
      
      this.specialAttackIndicator.beginPath();
      this.specialAttackIndicator.arc(this.x, this.y, radius, startAngle, endAngle, false);
      this.specialAttackIndicator.lineTo(this.x, this.y);
      this.specialAttackIndicator.closePath();
      this.specialAttackIndicator.fillPath();
    }
  }
  
  // Perform the special "Cooldown Attack"
  performSpecialAttack() {
    // Check if special attack is available and not on cooldown
    if (!this.specialAttackAvailable || 
        !this.scene || 
        (this.scene.time.now - this.specialAttackLastUsed < this.specialAttackCooldown)) {
      return false;
    }
    
    console.log(`${this.type} special attack activated!`);
    
    // Get all enemies in range (increased range for special)
    const specialRange = this.range * 1.5;
    const enemiesInRange = this.getEnemiesInRange(specialRange);
    
    if (enemiesInRange.length === 0) {
      // No targets in range
      return false;
    }
    
    // Reset glow colors to avoid linter errors
    const specialGlowColor = this.type === 'scarecrow' ? 0x00FFFF : 
                             this.type === 'dog' ? 0xFF6600 : 
                             this.type === 'wizard' ? 0xFF00FF : 
                             this.type === 'cannon' ? 0xFF0000 : 0xFFFFFF;
    
    // Perform different special attacks based on defense type
    if (this.type === 'scarecrow') {
      // Ice Mage: Freeze all enemies in range
      this.performFreezeAttack(enemiesInRange);
    } else if (this.type === 'dog') {
      // Fire Mage: Meteor strike on all enemies
      this.performMeteorAttack(enemiesInRange);
    } else if (this.type === 'wizard') {
      // Wizard: Chain lightning that hits all enemies
      this.performChainLightningAttack(enemiesInRange);
    } else if (this.type === 'cannon') {
      // Cannon: Massive explosion that damages all enemies
      this.performExplosionAttack(enemiesInRange);
    }
    
    // Show special attack effect
    const specialEffect = this.scene.add.graphics();
    specialEffect.fillStyle(specialGlowColor, 0.6);
    specialEffect.fillCircle(this.x, this.y, specialRange);
    
    // Animate and destroy the effect
    this.scene.tweens.add({
      targets: specialEffect,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        specialEffect.destroy();
      }
    });
    
    // Record last used time
    this.specialAttackLastUsed = this.scene.time.now;
    
    // Reset counter for next special
    this.enemiesDefeated = 0;
    this.specialAttackAvailable = false;
    
    return true;
  }
  
  // Helper to get enemies in range
  getEnemiesInRange(range) {
    const enemiesInRange = [];
    
    if (!this.scene || !Array.isArray(this.scene.enemies)) {
      return enemiesInRange;
    }
    
    for (const enemy of this.scene.enemies) {
      if (!enemy || !enemy.active) continue;
      
      // Get enemy position
      const enemyX = enemy.x || (enemy.container && enemy.container.x) || (enemy.sprite && enemy.sprite.x);
      const enemyY = enemy.y || (enemy.container && enemy.container.y) || (enemy.sprite && enemy.sprite.y);
      
      if (!enemyX || !enemyY) continue;
      
      // Calculate distance
      const dx = this.x - enemyX;
      const dy = this.y - enemyY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If within range, add to array
      if (distance <= range) {
        enemiesInRange.push(enemy);
      }
    }
    
    return enemiesInRange;
  }
  
  // Perform a freeze attack that temporarily slows enemies
  performFreezeAttack(enemies) {
    try {
      if (!this.scene || !enemies || !enemies.length) return;
      
      console.log(`Performing freeze attack on ${enemies.length} enemies`);
      
      // Calculate damage based on level and special multiplier
      const baseDamage = this.damage * this.specialAttackDamageMultiplier;
      
      // Blue ice color
      const freezeColor = 0x00CCFF;
      
      // Create an expanding freeze wave effect
      const freezeWave = this.scene.add.circle(this.x, this.y, 10, freezeColor, 0.3);
      freezeWave.setStrokeStyle(4, freezeColor, 0.8);
      
      // Animate the freeze wave
      this.scene.tweens.add({
        targets: freezeWave,
        radius: this.range * 1.2,
        alpha: 0,
        duration: 1000,
        ease: 'Sine.easeOut',
        onComplete: () => freezeWave.destroy()
      });
      
      // Process each enemy
      enemies.forEach(enemy => {
        if (!enemy || !enemy.active) return;
        
        // Apply damage
        const wasDefeated = this.applyDamageToEnemy(enemy, baseDamage);
        
        if (!wasDefeated) {
          // Add slow effect (if enemy has the property)
          if (typeof enemy.setSpeed === 'function') {
            enemy.setSpeed(enemy.speed * 0.5); // Slow to 50% speed
            
            // Reset speed after 3 seconds
            this.scene.time.delayedCall(3000, () => {
              if (enemy && enemy.active && typeof enemy.resetSpeed === 'function') {
                enemy.resetSpeed();
              }
            });
          }
          
          // Create frost particle effect on the enemy
          const frostEffect = this.scene.add.circle(enemy.x, enemy.y, 20, freezeColor, 0.4);
          
          // Animate the frost effect
          this.scene.tweens.add({
            targets: frostEffect,
            alpha: 0,
            scale: 0.5,
            duration: 1000,
            onComplete: () => frostEffect.destroy()
          });
          
          // Add visual indicator that enemy is frozen
          const freezeIcon = this.scene.add.text(enemy.x, enemy.y - 30, '❄️', {
            fontSize: '20px'
          }).setOrigin(0.5);
          
          // Animate the freeze icon
          this.scene.tweens.add({
            targets: freezeIcon,
            y: enemy.y - 50,
            alpha: 0,
            duration: 2000,
            onComplete: () => freezeIcon.destroy()
          });
        }
      });
      
      // Play freeze sound if available
      if (this.scene.sound && this.scene.sound.play) {
        try {
          // Safely try to play sound
          this.scene.sound.play('freeze_sound', { volume: 0.5 });
        } catch (error) {
          console.log("Freeze sound not available or failed to play");
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error in performFreezeAttack:", error);
      return false;
    }
  }
  
  // Add the missing Meteor Attack function for Fire Mage
  performMeteorAttack(enemies) {
    try {
      if (!this.scene || !enemies || !enemies.length) return;
      
      console.log(`Performing meteor attack on ${enemies.length} enemies`);
      
      // Calculate damage based on level and special multiplier
      const baseDamage = this.damage * this.specialAttackDamageMultiplier;
      
      // Fire color
      const fireColor = 0xFF4400;
      
      // Create meteor impact point at center of enemies
      let centerX = 0;
      let centerY = 0;
      let validEnemies = 0;
      
      // Calculate center point of all enemies
      enemies.forEach(enemy => {
        if (!enemy || !enemy.active) return;
        centerX += enemy.x;
        centerY += enemy.y;
        validEnemies++;
      });
      
      if (validEnemies === 0) return false;
      
      // Get average position
      centerX /= validEnemies;
      centerY /= validEnemies;
      
      // Create meteor falling effect
      const meteorStart = { x: centerX, y: centerY - 300 };
      const meteorEnd = { x: centerX, y: centerY };
      
      // Create meteor visual
      const meteor = this.scene.add.circle(meteorStart.x, meteorStart.y, 20, fireColor, 1);
      meteor.setStrokeStyle(3, 0xFFAA00);
      
      // Add glow and trail to meteor
      const meteorGlow = this.scene.add.circle(meteorStart.x, meteorStart.y, 30, fireColor, 0.3);
      
      // Animate meteor falling
      this.scene.tweens.add({
        targets: [meteor, meteorGlow],
        x: meteorEnd.x,
        y: meteorEnd.y,
        duration: 600,
        ease: 'Cubic.easeIn',
        onUpdate: (tween) => {
          // Create trailing particles
          if (meteor.active && Math.random() < 0.3) {
            const trail = this.scene.add.circle(
              meteor.x + (Math.random() * 10 - 5), 
              meteor.y - (Math.random() * 20), 
              5 + Math.random() * 5, 
              0xFFAA00, 
              0.7
            );
            
            this.scene.tweens.add({
              targets: trail,
              alpha: 0,
              scale: 0.5,
              y: '+=20',
              duration: 300,
              onComplete: () => trail.destroy()
            });
          }
        },
        onComplete: () => {
          // Create explosion on impact
          const explosion = this.scene.add.circle(centerX, centerY, 30, 0xFFFF00, 0.8);
          
          // Animate explosion
          this.scene.tweens.add({
            targets: explosion,
            radius: this.range * 1.2,
            alpha: 0,
            duration: 800,
            onComplete: () => explosion.destroy()
          });
          
          // Create particle explosion
          for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.range * 0.8;
            const speed = 2 + Math.random() * 3;
            const size = 5 + Math.random() * 10;
            
            const particle = this.scene.add.circle(
              centerX, 
              centerY, 
              size, 
              0xFFAA00, 
              0.8
            );
            
            // Calculate end position
            const endX = centerX + Math.cos(angle) * distance;
            const endY = centerY + Math.sin(angle) * distance;
            
            // Animate particle
            this.scene.tweens.add({
              targets: particle,
              x: endX,
              y: endY,
              alpha: 0,
              radius: size * 0.5,
              duration: 500 + Math.random() * 500,
              ease: 'Cubic.easeOut',
              onComplete: () => particle.destroy()
            });
          }
          
          // Destroy meteor and glow
          meteor.destroy();
          meteorGlow.destroy();
          
          // Apply damage to all enemies in range
          enemies.forEach(enemy => {
            if (!enemy || !enemy.active) return;
            
            // Calculate distance from impact
            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Apply damage with falloff based on distance
            if (distance <= this.range) {
              // More damage closer to impact
              const damageMultiplier = 1 - (distance / this.range) * 0.5;
              const finalDamage = baseDamage * damageMultiplier;
              
              // Apply damage
              this.applyDamageToEnemy(enemy, finalDamage);
              
              // Create hit effect on enemy
              const hitEffect = this.scene.add.circle(enemy.x, enemy.y, 15, 0xFF6600, 0.6);
              
              this.scene.tweens.add({
                targets: hitEffect,
                alpha: 0,
                radius: 30,
                duration: 400,
                onComplete: () => hitEffect.destroy()
              });
              
              // Show damage text
              this.showDamageText(enemy, finalDamage.toFixed(1), 0xFF4400);
            }
          });
          
          // Play explosion sound if available
          if (this.scene.sound && this.scene.sound.play) {
            try {
              this.scene.sound.play('explosion_sound', { volume: 0.6 });
            } catch (error) {
              console.log("Explosion sound not available or failed to play");
            }
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error("Error in performMeteorAttack:", error);
      return false;
    }
  }
  
  performChainLightningAttack(enemies) {
    if (!this.scene || enemies.length === 0) return;
    
    try {
      // Calculate damage based on special attack multiplier
      const specialDamage = this.damage * this.specialAttackDamageMultiplier;
      
      // Create lightning effect between enemies
      let previousEnemy = null;
      let delay = 0;
      
      // Start from mage to first enemy
      const firstEnemy = enemies[0];
      this.createLightningEffect(this.x, this.y, firstEnemy.x, firstEnemy.y, 0);
      
      // Chain through all enemies
      enemies.forEach((enemy, index) => {
        // Apply damage with delay
        setTimeout(() => {
          if (enemy && enemy.active) {
            // Deal high damage
            this.damageEnemy(enemy, specialDamage);
            
            // Show damage text
            this.showDamageText(enemy, `${specialDamage.toFixed(1)}`, 0xFF00FF);
            
            // Create lightning flash effect on enemy
            this.createLightningFlash(enemy);
          }
        }, delay);
        
        // Connect with lightning to previous enemy or mage
        if (previousEnemy) {
          this.createLightningEffect(
            previousEnemy.x, previousEnemy.y,
            enemy.x, enemy.y,
            delay
          );
        }
        
        previousEnemy = enemy;
        delay += 150; // Stagger the lightning effect
      });
      
      // Show special attack text
      this.showFloatingText(this.x, this.y - 50, "CHAIN LIGHTNING!", 0xFF00FF);
      
      return true;
    } catch (error) {
      console.error("Error performing chain lightning attack:", error);
      return false;
    }
  }
  
  performExplosionAttack(enemies) {
    if (!this.scene || enemies.length === 0) return;
    
    try {
      // Calculate damage based on special attack multiplier
      const specialDamage = this.damage * this.specialAttackDamageMultiplier;
      
      // Find center point of enemies for explosion
      let centerX = 0;
      let centerY = 0;
      
      enemies.forEach(enemy => {
        centerX += enemy.x;
        centerY += enemy.y;
      });
      
      centerX /= enemies.length;
      centerY /= enemies.length;
      
      // Create explosion effect
      this.createExplosionEffect(centerX, centerY);
      
      // Apply damage to all enemies with slight delay
      setTimeout(() => {
        enemies.forEach(enemy => {
          if (enemy && enemy.active) {
            // Deal high damage
            this.damageEnemy(enemy, specialDamage);
            
            // Show damage text
            this.showDamageText(enemy, `${specialDamage.toFixed(1)}`, 0xFF0000);
            
            // Knockback effect - push enemies away from center
            if (enemy.x && enemy.y) {
              const dx = enemy.x - centerX;
              const dy = enemy.y - centerY;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              
              // Apply knockback
              enemy.x += (dx / dist) * 50;
              enemy.y += (dy / dist) * 50;
            }
          }
        });
      }, 300);
      
      // Show special attack text
      this.showFloatingText(this.x, this.y - 50, "MASSIVE EXPLOSION!", 0xFF0000);
      
      return true;
    } catch (error) {
      console.error("Error performing explosion attack:", error);
      return false;
    }
  }
  
  createLightningEffect(x1, y1, x2, y2, delay) {
    if (!this.scene) return;
    
    try {
      setTimeout(() => {
        // Create zigzag lightning path between points
        const path = this.generateLightningPath(x1, y1, x2, y2);
        
        // Draw lightning
        const lightning = this.scene.add.graphics();
        lightning.lineStyle(3, 0xFF00FF, 0.8);
        
        // Draw the path
        lightning.beginPath();
        lightning.moveTo(path[0].x, path[0].y);
        
        for (let i = 1; i < path.length; i++) {
          lightning.lineTo(path[i].x, path[i].y);
        }
        
        lightning.strokePath();
        
        // Flash and fade out
        this.scene.tweens.add({
          targets: lightning,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            lightning.destroy();
          }
        });
      }, delay);
    } catch (error) {
      console.error("Error creating lightning effect:", error);
    }
  }
  
  generateLightningPath(x1, y1, x2, y2) {
    const path = [];
    path.push({ x: x1, y: y1 });
    
    // Generate random zigzag points
    const segments = 5;
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;
    
    for (let i = 1; i < segments; i++) {
      const deviation = 20 * (Math.random() - 0.5);
      path.push({
        x: x1 + dx * i + deviation,
        y: y1 + dy * i + deviation
      });
    }
    
    path.push({ x: x2, y: y2 });
    return path;
  }
  
  createLightningFlash(enemy) {
    if (!this.scene || !enemy) return;
    
    // Create flash effect around enemy
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xFF00FF, 0.6);
    flash.fillCircle(enemy.x, enemy.y, 30);
    
    // Fade out
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        flash.destroy();
      }
    });
  }
  
  createExplosionEffect(x, y) {
    if (!this.scene) return;
    
    try {
      // Create explosion circle
      const explosion = this.scene.add.graphics();
      explosion.fillStyle(0xFF0000, 0.7);
      explosion.fillCircle(x, y, 20);
      
      // Expand and fade
      this.scene.tweens.add({
        targets: explosion,
        scaleX: 8,
        scaleY: 8,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          explosion.destroy();
        }
      });
      
      // Add some particles for extra effect
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const distance = 30 + Math.random() * 100;
        const size = 3 + Math.random() * 4; // Define the size variable
        
        const particle = this.scene.add.circle(
          x, y, size, 
          0xFF0000, 0.8
        );
        
        // Set movement
        this.scene.tweens.add({
          targets: particle,
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          alpha: 0,
          radius: size * 0.5,
          duration: 500 + Math.random() * 500,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            particle.destroy();
          }
        });
      }
    } catch (error) {
      console.error("Error creating explosion effect:", error);
    }
  }

  createWizard() {
    try {
      // Create the wizard sprite
      if (this.scene.textures.exists('wizard_idle')) {
        this.sprite = this.scene.add.sprite(this.x, this.y, 'wizard_idle');
        this.sprite.setScale(0.8);
      } else {
        // Fallback if texture is missing
        this.sprite = this.scene.add.rectangle(this.x, this.y, 40, 40, 0xFF00FF); // Purple for wizard
        // Add wizard emoji representation
        this.label = this.scene.add.text(this.x, this.y, '🧙', {
          fontSize: '24px',
          fontFamily: 'Arial'
        }).setOrigin(0.5);
      }
      
      // Make sprite interactive
      if (this.sprite) {
        this.sprite.setInteractive({ useHandCursor: true });
        this.sprite.on('pointerdown', () => {
          this.showInfoPanel();
        });
      }
      
      // Add special effect for wizard placement
      this.createPlacementEffect('purple');
      
      // Create magic aura
      this.createMagicAura();
      
      // Add wizard-specific details
      this.createInfoPanel();
      
      // Create health bar/status indicator
      this.createHealthBar();
      
      // Special attack stats for wizard
      this.specialAttackCooldown = 8000; // 8 seconds
      this.enemiesNeededForSpecial = 4; // Easier to charge
      this.specialAttackDamageMultiplier = 3.0; // Higher damage multiplier
      
      // Set base stats
      this.damage = 3.0;
      this.range = 300; // Longer range
      this.cooldown = 1000; // Fast attacks
      this.aoeRadius = 100; // Medium area effect
      this.aoeDamageMultiplier = 0.5; // 50% damage to nearby enemies

      console.log(`Created wizard at ${this.x}, ${this.y} with range ${this.range}`);
    } catch (error) {
      console.error("Error creating wizard:", error);
    }
  }
  
  createCannon() {
    try {
      // Create the cannon sprite
      if (this.scene.textures.exists('cannon_idle')) {
        this.sprite = this.scene.add.sprite(this.x, this.y, 'cannon_idle');
        this.sprite.setScale(0.9);
      } else {
        // Fallback if texture is missing
        this.sprite = this.scene.add.rectangle(this.x, this.y, 45, 45, 0xFF0000); // Red for cannon
        // Add cannon emoji representation
        this.label = this.scene.add.text(this.x, this.y, '💣', {
          fontSize: '24px',
          fontFamily: 'Arial'
        }).setOrigin(0.5);
      }
      
      // Make sprite interactive
      if (this.sprite) {
        this.sprite.setInteractive({ useHandCursor: true });
        this.sprite.on('pointerdown', () => {
          this.showInfoPanel();
        });
      }
      
      // Add special effect for cannon placement
      this.createPlacementEffect('red');
      
      // Create aura for range indication
      this.createCombatAura();
      
      // Add cannon-specific details
      this.createInfoPanel();
      
      // Create health bar/status indicator
      this.createHealthBar();
      
      // Special attack stats for cannon
      this.specialAttackCooldown = 12000; // 12 seconds
      this.enemiesNeededForSpecial = 6; // Harder to charge
      this.specialAttackDamageMultiplier = 4.0; // Very high damage
      
      // Set base stats
      this.damage = 5.0; // Highest base damage
      this.range = 350; // Longest range
      this.cooldown = 2000; // Slow attacks
      this.aoeRadius = 150; // Large area effect
      this.aoeDamageMultiplier = 0.7; // 70% damage to nearby enemies

      console.log(`Created cannon at ${this.x}, ${this.y} with range ${this.range}`);
    } catch (error) {
      console.error("Error creating cannon:", error);
    }
  }
  
  createMagicAura() {
    try {
      if (!this.scene) return;
      
      // Create magic particles
      const particles = this.scene.add.particles(0, 0, 'magic_particle', {
        lifespan: 2000,
        speed: { min: 20, max: 50 },
        scale: { start: 0.5, end: 0 },
        blendMode: 'ADD',
        emitting: true,
        quantity: 1,
        frequency: 100,
        alpha: { start: 0.6, end: 0 }
      });
      
      // If no particles system, create a basic aura
      if (!particles) {
        const aura = this.scene.add.graphics();
        aura.fillStyle(0xFF00FF, 0.3);
        aura.fillCircle(this.x, this.y, 20);
        
        // Pulse animation
        this.scene.tweens.add({
          targets: aura,
          alpha: 0.1,
          duration: 1000,
          yoyo: true,
          repeat: -1
        });
      } else {
        particles.setPosition(this.x, this.y);
        this.particles = particles;
      }
    } catch (error) {
      console.error("Error creating magic aura:", error);
    }
  }
  
  createCombatAura() {
    try {
      if (!this.scene) return;
      
      // Create a red pulsing aura
      const aura = this.scene.add.circle(this.x, this.y, 20, 0xFF0000, 0.2);
      
      // Pulse animation
      this.scene.tweens.add({
        targets: aura,
        alpha: 0.4,
        scale: 1.2,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      
      this.aura = aura;
    } catch (error) {
      console.error("Error creating combat aura:", error);
    }
  }
  
  // Helper method to create placement effect with different colors
  createPlacementEffect(color) {
    try {
      if (!this.scene) return;
      
      let effectColor;
      switch (color) {
        case 'blue':
          effectColor = 0x0088FF;
          break;
        case 'red':
          effectColor = 0xFF4400;
          break;
        case 'purple':
          effectColor = 0xFF00FF;
          break;
        default:
          effectColor = 0xFFFFFF;
      }
      
      // Create expanding circle
      const effect = this.scene.add.circle(this.x, this.y, 10, effectColor, 0.7);
      
      // Animate and destroy
      this.scene.tweens.add({
        targets: effect,
        alpha: 0,
        radius: this.range,
        duration: 1000,
        onComplete: () => {
          effect.destroy();
        }
      });
    } catch (error) {
      console.error("Error creating placement effect:", error);
    }
  }
  
  // Create info panel on hover/click
  createInfoPanel() {
    // Will be implemented if needed for full gameplay
  }
  
  createHealthBar() {
    try {
      if (!this.scene) return;
      
      // Create health bar container
      this.healthBar = {
        container: this.scene.add.container(this.x, this.y - 20),
        width: 40,
        height: 5
      };
      
      // Background (gray)
      this.healthBar.background = this.scene.add.rectangle(
        0, 0, 
        this.healthBar.width, this.healthBar.height, 
        0x333333, 0.8
      );
      
      // Fill (color based on defense type)
      const healthColor = this.type === 'scarecrow' ? 0x00AAFF : 
                         this.type === 'dog' ? 0xFF4400 : 
                         this.type === 'wizard' ? 0xFF00FF : 
                         this.type === 'cannon' ? 0xFF0000 : 0x00FF00;
      
      this.healthBar.fill = this.scene.add.rectangle(
        0, 0, 
        this.healthBar.width, this.healthBar.height, 
        healthColor, 1
      );
      
      // Add to container
      this.healthBar.container.add(this.healthBar.background);
      this.healthBar.container.add(this.healthBar.fill);
      
      // Set depth to ensure visibility
      this.healthBar.container.setDepth(100);
      
      // Start invisible
      this.healthBar.container.setVisible(false);
      
      console.log(`Created health bar for ${this.type}`);
    } catch (error) {
      console.error("Error creating health bar:", error);
    }
  }
  
  // Update health bar to show status
  updateHealthBar(percent = 1) {
    try {
      if (!this.healthBar || !this.healthBar.fill) return;
      
      // Update fill width based on percent
      this.healthBar.fill.width = this.healthBar.width * percent;
      
      // Center the fill properly
      const offsetX = (this.healthBar.width - this.healthBar.fill.width) / 2;
      this.healthBar.fill.x = offsetX;
      
      // Update position to follow defense
      if (this.healthBar.container) {
        this.healthBar.container.x = this.x;
        this.healthBar.container.y = this.y - 20;
      }
    } catch (error) {
      console.error("Error updating health bar:", error);
    }
  }
  
  // Show the health bar
  showHealthBar() {
    if (this.healthBar && this.healthBar.container) {
      this.healthBar.container.setVisible(true);
    }
  }
  
  // Hide the health bar
  hideHealthBar() {
    if (this.healthBar && this.healthBar.container) {
      this.healthBar.container.setVisible(false);
    }
  }

  // Utility method to display floating text above a position
  showFloatingText(x, y, text, color = 0xFFFFFF) {
    try {
      if (!this.scene) return;
      
      // Create the text object
      const colorString = color ? '#' + color.toString(16).padStart(6, '0') : '#FFFFFF';
      const floatingText = this.scene.add.text(x, y, text, {
        fontFamily: 'Arial',
        fontSize: '18px',
        fontWeight: 'bold',
        color: colorString,
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5);
      
      // Set high depth to ensure visibility
      floatingText.setDepth(300);
      
      // Animate the text
      this.scene.tweens.add({
        targets: floatingText,
        y: y - 40,
        alpha: 0,
        scale: 1.5,
        duration: 1500,
        ease: 'Power2',
        onComplete: () => {
          floatingText.destroy();
        }
      });
      
      return floatingText;
    } catch (error) {
      console.error("Error showing floating text:", error);
      return null;
    }
  }
  
  // Apply damage to an enemy with proper effects
  damageEnemy(enemy, amount) {
    try {
      if (!enemy || !enemy.active) return false;
      
      // Apply damage through the existing method
      const defeated = this.applyDamageToEnemy(enemy, amount);
      
      // Create visual hit effect
      const hitColor = this.type === 'scarecrow' ? 0x00AAFF : 
                      this.type === 'dog' ? 0xFF4400 : 
                      this.type === 'wizard' ? 0xFF00FF : 
                      this.type === 'cannon' ? 0xFF0000 : 0xFFFFFF;
      
      // Create hit flash
      const flash = this.scene.add.circle(enemy.x, enemy.y, 20, hitColor, 0.6);
      
      // Animate flash
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => {
          flash.destroy();
        }
      });
      
      return defeated;
    } catch (error) {
      console.error("Error applying damage to enemy:", error);
      return false;
    }
  }
} 