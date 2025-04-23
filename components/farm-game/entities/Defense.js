'use client';

export default class Defense {
  constructor(scene, type, x, y) {
    this.scene = scene;
    this.type = type;
    this.x = x;
    this.y = y;
    this.active = true;
    this.range = 200; // Reduced range
    this.cooldown = 1800; // Increased cooldown
    this.damage = 0.45; // Reduced damage
    this.targetTypes = []; // Types of enemies this defense can target
    
    // Mana properties
    this.maxMana = 100; // Default max mana
    this.currentMana = this.maxMana;
    this.manaCostPerShot = 10; // Increased mana cost
    this.manaRegenRate = 3.5; // Reduced mana regen
    this.isOutOfMana = false;
    
    // Special attack properties
    this.specialAttackAvailable = false;
    this.specialAttackCooldown = 10000; // 10 seconds cooldown
    this.specialAttackLastUsed = 0;
    this.specialAttackDamageMultiplier = 2.5; // Special attack deals 2.5x normal damage
    this.enemiesDefeated = 0; // Track enemies defeated by this mage
    this.enemiesNeededForSpecial = 5; // Number of enemies needed to unlock special attack
    
    // Default AOE properties (can be overridden by type)
    this.aoeRadius = 70; // Reduced AOE radius
    this.aoeDamageMultiplier = 0.4; // Reduced AOE damage
    
    // Get current wave for scaling
    const currentWave = this.scene.gameState?.wave || 1;
    
    // Set properties based on defense type
    if (type === 'scarecrow') {
      this.cost = 35;
      this.range = 200; // Reduced range
      this.cooldown = 1800; // Increased cooldown
      this.damage = 0.45; // Reduced damage
      this.targetTypes = ['bird'];
      this.aoeRadius = 70; // Reduced AOE radius
      this.aoeDamageMultiplier = 0.4; // Reduced AOE damage
      this.maxMana = 50;
      this.currentMana = this.maxMana;
      this.manaCostPerShot = 10; // Increased mana cost
      this.manaRegenRate = 3.5; // Reduced mana regen
      this.createABSMage();
    } else if (type === 'dog') {
      this.cost = 50;
      this.range = 170; // Reduced range
      this.cooldown = 1700; // Increased cooldown
      this.damage = 0.75; // Reduced damage
      this.targetTypes = ['rabbit'];
      this.aoeRadius = 55; // Reduced AOE radius
      this.aoeDamageMultiplier = 0.5; // Reduced AOE damage
      this.maxMana = 60;
      this.currentMana = this.maxMana;
      this.manaCostPerShot = 12; // Increased mana cost
      this.manaRegenRate = 4.5; // Reduced mana regen
      this.createNOOTMage();
    } else if (type === 'wizard') {
      this.cost = 110;
      this.range = 245; // Reduced range
      this.cooldown = 2300; // Increased cooldown
      this.damage = 1.2; // Reduced damage
      this.targetTypes = ['bird', 'rabbit', 'fox', 'slime', 'ghost', 'skeleton', 'bat', 'spider', 'wolf', 'snake', 'goblin'];
      this.maxMana = 80;
      this.currentMana = this.maxMana;
      this.manaCostPerShot = 20; // Increased mana cost
      this.manaRegenRate = 5.5; // Reduced mana regen
      this.createWizard();
    } else if (type === 'cannon') {
      this.cost = 165;
      this.range = 290; // Reduced range
      this.cooldown = 4000; // Increased cooldown
      this.damage = 2.1; // Reduced damage
      this.targetTypes = ['rabbit', 'fox', 'slime', 'skeleton', 'spider', 'wolf', 'snake', 'goblin'];
      this.aoeRadius = 90; // Reduced AOE radius
      this.aoeDamageMultiplier = 0.35; // Reduced AOE damage
      this.maxMana = 100;
      this.currentMana = this.maxMana;
      this.manaCostPerShot = 35; // Increased mana cost
      this.manaRegenRate = 7.0; // Reduced mana regen
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
    // Create "No mana" text indicator
    this.createNoManaText();
    
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
  
  createWizard() {
    // Create visual representation of Wizard
    this.sprite = this.scene.add.image(this.x, this.y, 'wizard_idle');
    this.sprite.setDisplaySize(48, 48); // Scale to appropriate size
    this.sprite.setDepth(101); // Ensure visible above ground tiles
    
    // Add a range indicator (usually invisible, shown on hover)
    this.rangeIndicator = this.scene.add.circle(this.x, this.y, this.range, 0xFFFFFF, 0.1);
    this.rangeIndicator.setStrokeStyle(2, 0xFF00FF); // Purple outline for range
    this.rangeIndicator.visible = false;
    this.rangeIndicator.setDepth(100);
    
    // Make it interactive
    this.sprite.setInteractive();
    this.sprite.on('pointerover', () => this.showRange());
    this.sprite.on('pointerout', () => this.hideRange());
  }
  
  createCannon() {
    // Create visual representation of Cannon
    this.sprite = this.scene.add.image(this.x, this.y, 'cannon_idle');
    this.sprite.setDisplaySize(48, 48); // Scale to appropriate size
    this.sprite.setDepth(101); // Ensure visible above ground tiles
    
    // Add a range indicator (usually invisible, shown on hover)
    this.rangeIndicator = this.scene.add.circle(this.x, this.y, this.range, 0xFFFFFF, 0.1);
    this.rangeIndicator.setStrokeStyle(2, 0xCC0000); // Dark red outline for range
    this.rangeIndicator.visible = false;
    this.rangeIndicator.setDepth(100);
    
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
    const color = this.getColor(); // Use helper method for color
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
    
    // Create ready indicator using color from helper
    const readyColor = Phaser.Display.Color.HexStringToColor(this.getColor()).color; 
    this.readyIndicator = this.scene.add.circle(this.x, this.y - 25, 5, readyColor, 0.8);
    this.readyIndicator.setStrokeStyle(1, 0xFFFFFF);
    this.readyIndicator.setDepth(300);
    this.readyIndicator.visible = true;
  }
  
  createNoManaText() {
    this.noManaText = this.scene.add.text(this.x, this.y - 45, 'No mana', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#FF8888', // Light red
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.noManaText.setDepth(301); // Above cooldown text
    this.noManaText.visible = false; // Initially hidden
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
        // Hide cooldown text if out of mana, otherwise show it
        this.cooldownText.setVisible(!this.isOutOfMana);
        
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
      const indicatorColor = Phaser.Display.Color.HexStringToColor(this.getColor()).color;
      this.cooldownIndicator.fillStyle(indicatorColor, 1);
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
      
      // Define indicatorColor earlier in the scope
      const indicatorColor = Phaser.Display.Color.HexStringToColor(this.getColor()).color;

      // Make visible
      this.cooldownContainer.setVisible(true);
      
      // Update position to follow the mage
      this.cooldownContainer.x = this.x;
      this.cooldownContainer.y = this.y;
      
      // Clear previous drawing
      this.cooldownIndicator.clear();
      
      // Only draw if actually on cooldown
      if (remainingPercent > 0) {
        this.cooldownIndicator.fillStyle(indicatorColor, 1);
        
        // Calculate end angle based on remaining percent (radians)
        // 0 at top, increases clockwise
        const startAngle = -Math.PI / 2; // Start at top (-90 degrees)
        const endAngle = startAngle + (Math.PI * 2 * (1 - remainingPercent)); // Full circle is 2*PI
        
        // Draw the arc
        this.cooldownIndicator.beginPath();
        this.cooldownIndicator.arc(this.x, this.y, 25, startAngle, endAngle, false);
        this.cooldownIndicator.lineTo(this.x, this.y);
        this.cooldownIndicator.closePath();
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
  
  update(delta) { // Pass delta to update
    if (!this.active) return;

    // Regenerate Mana
    this.regenerateMana(delta);

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
    
    // ADDED: Update "No mana" text position
    if (this.noManaText) {
        this.noManaText.x = this.x;
        this.noManaText.y = this.y - 45; // Position above cooldown text
        this.noManaText.visible = this.isOutOfMana;
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
    
    // ADDED: Check for mana before finding enemy
    if (this.currentMana < this.manaCostPerShot) {
        if (!this.isOutOfMana) {
            this.isOutOfMana = true;
            if(this.noManaText) this.noManaText.visible = true;
            if(this.cooldownText) this.cooldownText.visible = false; // Hide cooldown when OOM
        }
        return false; // Not enough mana to attack
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
    
    // Ensure enemy has proper position values - PRIORITIZE CONTAINER
    const enemyX = (enemy.container ? enemy.container.x : (enemy.sprite ? enemy.sprite.x : enemy.x)) || 0;
    const enemyY = (enemy.container ? enemy.container.y : (enemy.sprite ? enemy.sprite.y : enemy.y)) || 0;
    
    // Safety check - if we can't determine enemy position, skip
    if (!enemyX || !enemyY) {
      return false;
    }
    
    // Calculate distance
    const dx = this.x - enemyX;
    const dy = this.y - enemyY;
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
      damageAmount = enemy.health * 5; // Increased from 3
      
      // Force health to zero for critical hits
      if (enemy.health <= 1.1) {
        enemy.health = 0; // Force to zero
      }
      
      // Display critical hit message
      this.showDamageText(enemy, "CRITICAL!", 0xFFFF00);
    }
    
    // ADDED: Deduct mana cost
    this.currentMana -= this.manaCostPerShot;

    // Apply damage to primary target
    this.applyDamageToEnemy(enemy, damageAmount);
    
    // Apply area of effect damage to nearby enemies
    if (this.type === 'scarecrow') {
      // Ice mage AOE attack
      this.performAreaAttack(enemyX, enemyY, this.aoeRadius, this.damage * this.aoeDamageMultiplier, 'ice');
    } else if (this.type === 'dog') {
      // Fire mage AOE attack
      this.performAreaAttack(enemyX, enemyY, this.aoeRadius, this.damage * this.aoeDamageMultiplier, 'fire');
    } else if (this.type === 'wizard') {
      if (this.sprite) {
        this.sprite.setTexture('wizard_attack');
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.1, scaleY: 1.1, duration: 150, yoyo: true,
          onComplete: () => { if (this.sprite && this.sprite.active) this.sprite.setTexture('wizard_idle'); }
        });
      }
      // Launch a projectile (e.g., magic bolt)
      this.launchProjectile(enemy, 'magic'); 
      this.showDamageText(enemy, `${damageAmount.toFixed(1)}`, 0xFF00FF);
    } else if (this.type === 'cannon') {
      if (this.sprite) {
        this.sprite.setTexture('cannon_attack');
        // Add recoil animation
        const originalX = this.x;
        this.scene.tweens.add({
          targets: this.sprite,
          x: this.x - 5, // Move back slightly
          duration: 100,
          yoyo: true,
          onComplete: () => { 
            if (this.sprite && this.sprite.active) {
               this.sprite.setTexture('cannon_idle');
               this.sprite.x = originalX; // Ensure it returns to original position
            } 
          }
        });
      }
      // Launch a projectile (e.g., cannonball)
      this.launchProjectile(enemy, 'cannonball');
      this.performAreaAttack(enemyX, enemyY, this.aoeRadius, damageAmount * this.aoeDamageMultiplier, 'explosion');
      this.showDamageText(enemy, `${damageAmount.toFixed(1)}`, 0xCC0000);
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
    }
    
    // Add simple attack effect
    this.createAttackEffect(enemy);
    
    return true;
  }
  
  // Apply damage to a single enemy
  applyDamageToEnemy(enemy, damageAmount) {
    try {
      // ADDED: Log entry
      console.log(`Applying ${damageAmount.toFixed(1)} damage to enemy ${enemy.id}`);
      
      // Store initial health to check if this attack defeats the enemy
      const initialHealth = enemy.health || 0;
      
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
      
      // Check if this attack defeated the enemy
      if (initialHealth > 0 && enemy.health <= 0) {
        // Track this defeat for special attack charging
        this.onEnemyDefeated();
      }
      
      // Force health bar update
      if (typeof enemy.updateHealthBar === 'function') {
        // ADDED: Log health bar call
        console.log(`Calling updateHealthBar for enemy ${enemy.id}`);
        enemy.updateHealthBar();
      } else if (enemy.healthBar) {
        // ADDED: Log manual update
        console.log(`Manually updating healthBar for enemy ${enemy.id}`);
        // Manual health bar update
        const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
        
        if (enemy.healthBar.fill) {
          const enemyX = enemy.x || (enemy.sprite ? enemy.sprite.x : 0) || (enemy.container ? enemy.container.x : 0);
          enemy.healthBar.fill.width = 40 * healthPercent;
          enemy.healthBar.fill.x = enemyX - 20 + (enemy.healthBar.fill.width / 2);
        }
      }
    } catch (error) {
      console.error("Error applying damage to enemy:", error);
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
          // --- START FIX for scene/add error in callback ---
          // Check if scene and adder are still valid before creating explosion
          if (this.scene && this.scene.add) {
              // Create explosion effect
              const explosion = this.scene.add.circle(
                enemyX, 
                enemyY, 
                20, 
                color === 'blue' ? 0x00AAFF : 0xFF4400, 
                0.7
              );
              explosion.setDepth(201);
              
              // Check if tweens manager is still valid before animating explosion
              if (this.scene.tweens) {
                  // Fade out explosion
                  this.scene.tweens.add({
                    targets: explosion,
                    alpha: 0,
                    scale: 2,
                    duration: 300,
                    onComplete: () => {
                        // Check if explosion still exists before destroying
                         if (explosion && explosion.scene) explosion.destroy();
                    }
                  });
              } else {
                  // If tweens are gone, destroy explosion immediately
                   if (explosion && explosion.scene) explosion.destroy();
              }
          } else {
             // console.log("Scene or scene.add became invalid before fireball explosion.");
          }
          // --- END FIX ---
          
          // Create AOE effect at impact point
          if (fireball.isAOE) {
            // Destroy the glow
            if (glow && glow.scene) {
              glow.destroy();
            }
            
            // Trigger the AOE effect at the impact point
            clearInterval(trailInterval);
          }
          
          // Destroy fireball - check if active first
          if (fireball && fireball.active) {
              fireball.destroy();
          }
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
      // Skip if scene or target is invalid
      if (!this.scene || !this.scene.add || !this.scene.tweens || !target || !target.active) {
         // console.log("Skipping damage text: Invalid scene or target.");
         return;
      }
      
      // Create text style - improve visibility
      const textStyle = {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px', // Slightly smaller than default floating text
        color: Phaser.Display.Color.ValueToColor(color).rgba,
        stroke: '#000000',
        strokeThickness: 3, // Thicker stroke
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2
        }
      };
      
      // --- START FIX for amount.toFixed error ---
      let displayAmount = '';
      if (typeof amount === 'number') {
          // Format number to one decimal place, add minus sign
          displayAmount = `-${amount.toFixed(1)}`;
      } else if (typeof amount === 'string') {
          // Display string directly (e.g., "CRITICAL!") - don't add minus sign
          displayAmount = amount;
      } else if (typeof amount === 'bigint') {
          // Convert BigInt to string, add minus sign
          displayAmount = `-${amount.toString()}`;
      } else {
          // Handle other unexpected types by converting to string
          console.warn("showDamageText: Unexpected amount type:", typeof amount, amount);
          displayAmount = `-${String(amount)}`;
      }
      // --- END FIX ---
      
      // Create the text object slightly offset from the target
      // Use the processed displayAmount
      const text = this.scene.add.text(target.x, target.y - 40, displayAmount, textStyle);
      text.setOrigin(0.5);
      text.setDepth(2000); // Ensure visibility
      
      // Add animation for rising and fading
      this.scene.tweens.add({
        targets: text,
        y: target.y - 80, // Move higher
        alpha: 0,
        duration: 1200, // Longer duration
        ease: 'Cubic.easeOut',
        onComplete: () => {
          // Check if text still exists and has a scene context before destroying
          if (text && text.scene) {
            text.destroy();
          }
        }
      });
    } catch (error) {
      console.error("Error in showDamageText:", error, "Target:", target, "Amount:", amount);
       if (this.scene) {
            console.error("Scene state:", { sys: !!this.scene.sys, add: !!this.scene.add, tweens: !!this.scene.tweens });
       }
    }
  }
  
  createAttackEffect(enemy) {
    // --- START FIX for scene/tween errors ---
    // Early exit checks
    if (!this.scene || !this.scene.sys || !this.scene.add || !this.scene.tweens || !enemy || !enemy.active) {
        // console.log("Skipping attack effect: Invalid scene or enemy.");
        return; // Exit if scene or essential parts/enemy are invalid/inactive
    }
    // --- END FIX ---

    const effectColor = this.type === 'scarecrow' ? 0x00AAFF : 0xFF4400;
    const enemyX = enemy.x || 0;
    const enemyY = enemy.y || 0;

    try {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const x = enemyX + Math.cos(angle) * 20;
            const y = enemyY + Math.sin(angle) * 20;

            // Check scene validity *again* right before creating graphics/tweens
            if (!this.scene || !this.scene.add || !this.scene.tweens) {
                // console.log("Skipping spark creation loop: Scene became invalid mid-effect.");
                return; // Stop creating more sparks if scene died
            }

            const spark = this.scene.add.circle(
                x, y, 3,
                effectColor,
                0.8
            ).setDepth(190); // Ensure visibility

            // Animate spark outward
            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * 15,
                y: y + Math.sin(angle) * 15,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    // Check if spark and scene still exist before destroying
                    if (spark && spark.scene) {
                        spark.destroy();
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error creating attack effect sparks:", error, "Enemy:", enemy);
        if (this.scene) {
          console.error("Scene state:", { sys: !!this.scene.sys, add: !!this.scene.add, tweens: !!this.scene.tweens });
        }
    }
}

  
  destroy() {
    try {
      // console.log(`Attempting destroy on Defense ${this.type} at (${this.x?.toFixed(0)}, ${this.y?.toFixed(0)}) - Active: ${this.active}`);
      if (!this.active) {
        // console.log(`Defense ${this.type} already inactive/destroyed.`);
        return; // Already destroyed or being destroyed
      }
      this.active = false; // Mark as inactive immediately

      // --- START FIX: Kill tweens before destroying objects ---
      if (this.scene && this.scene.tweens) {
          if (this.sprite) this.scene.tweens.killTweensOf(this.sprite);
          if (this.rangeIndicator) this.scene.tweens.killTweensOf(this.rangeIndicator);
          if (this.cooldownText) this.scene.tweens.killTweensOf(this.cooldownText);
          if (this.readyIndicator) this.scene.tweens.killTweensOf(this.readyIndicator);
          if (this.noManaText) this.scene.tweens.killTweensOf(this.noManaText);
          if (this.cooldownIndicator) this.scene.tweens.killTweensOf(this.cooldownIndicator);
          if (this.cooldownContainer) this.scene.tweens.killTweensOf(this.cooldownContainer);
          if (this.specialAttackIndicator) this.scene.tweens.killTweensOf(this.specialAttackIndicator);
          if (this.specialAttackReadyIndicator) this.scene.tweens.killTweensOf(this.specialAttackReadyIndicator);
          if (this.specialAttackText) this.scene.tweens.killTweensOf(this.specialAttackText);
          if (this.targetLine) this.scene.tweens.killTweensOf(this.targetLine);
          if (this.label) this.scene.tweens.killTweensOf(this.label);
          // Kill tweens associated with this specific game object instance if possible
          // Note: This might require more specific tween management if tweens aren't directly targeting these objects.
          // Example: If tweens target generic properties, they might need explicit stopping elsewhere.
      }
      // --- END FIX ---


      // Destroy sprite and remove listeners
      if (this.sprite) {
        this.sprite.off('pointerover');
        this.sprite.off('pointerout');
        this.sprite.destroy();
        this.sprite = null;
      }

      // Destroy range indicator
      if (this.rangeIndicator) {
        this.rangeIndicator.destroy();
        this.rangeIndicator = null;
      }

      // Destroy cooldown text
      if (this.cooldownText) {
        this.cooldownText.destroy();
        this.cooldownText = null;
      }

      // Destroy ready indicator
      if (this.readyIndicator) {
        this.readyIndicator.destroy();
        this.readyIndicator = null;
      }

      // Destroy no mana text
      if (this.noManaText) {
        this.noManaText.destroy();
        this.noManaText = null;
      }

      // Destroy cooldown indicator graphics and container
      if (this.cooldownIndicator) {
        this.cooldownIndicator.destroy();
        this.cooldownIndicator = null;
      }
      if (this.cooldownContainer) {
        this.cooldownContainer.destroy();
        this.cooldownContainer = null;
      }

      // Destroy special attack indicators and text
      if (this.specialAttackIndicator) {
        this.specialAttackIndicator.destroy();
        this.specialAttackIndicator = null;
      }
      if (this.specialAttackReadyIndicator) {
        this.specialAttackReadyIndicator.destroy();
        this.specialAttackReadyIndicator = null;
      }
       if (this.specialAttackText) {
        this.specialAttackText.destroy();
        this.specialAttackText = null;
      }

      // Destroy target line if it exists
      if (this.targetLine) {
        this.targetLine.destroy();
        this.targetLine = null;
      }

      // Destroy fallback label if it exists
       if (this.label && typeof this.label.destroy === 'function') {
        this.label.destroy();
        this.label = null;
      }

      // Remove from scene's defenses array - Handled by GameScene.cleanupCurrentGame

      // Final log after attempting cleanup
      // console.log(`Defense ${this.type} destroy process completed.`);
    } catch (error) {
      console.error("Error during Defense destroy:", error, "Type:", this.type);
    } finally {
        // Ensure essential references are nullified even if errors occurred
        this.sprite = null;
        this.rangeIndicator = null;
        this.cooldownText = null;
        this.readyIndicator = null;
        this.noManaText = null;
        this.cooldownIndicator = null;
        this.cooldownContainer = null;
        this.specialAttackIndicator = null;
        this.specialAttackReadyIndicator = null;
        this.specialAttackText = null;
        this.targetLine = null;
        this.label = null;
        this.scene = null; // Break reference to scene LAST
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
      return '#CC0000'; // Dark Red for Cannon
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
    
    // Store original damage for reference - UPDATED to reflect new base damage
    // Determine original damage based on type AFTER the nerfs applied above
    let originalDamage;
    if (this.type === 'scarecrow') {
      originalDamage = 0.45; // Updated base damage
    } else if (this.type === 'dog') {
      originalDamage = 0.75; // Updated base damage
    } else if (this.type === 'wizard') {
      originalDamage = 1.2; // Updated base damage
    } else if (this.type === 'cannon') {
      originalDamage = 2.1; // Updated base damage
    } else {
      // Default or fallback damage if type is unknown
      originalDamage = 1.0;
    }

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
      const coinReward = this.type === 'scarecrow' ? 3 : 5;
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
      const color = this.type === 'scarecrow' ? 0x00FFFF : 0xFF6600;
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
          color: this.type === 'scarecrow' ? '#00FFFF' : '#FF6600',
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
      const color = this.type === 'scarecrow' ? 0x00FFFF : 0xFF6600;
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
    const now = this.scene ? this.scene.time.now : 0;
    if (!this.specialAttackAvailable || (now - this.specialAttackLastUsed < this.specialAttackCooldown)) {
      return false;
    }
    
    // Find all enemies within a much larger radius
    const specialRange = this.range * 1.5;
    const enemiesInRange = this.getEnemiesInRange(specialRange);
    
    if (enemiesInRange.length === 0) {
      return false; // No enemies to attack
    }
    
    // Set the last used time
    this.specialAttackLastUsed = now;
    
    // Special attack animation
    if (this.sprite) {
      // Make the mage grow and glow
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 400,
        yoyo: true,
        onComplete: () => {
          if (this.sprite && this.sprite.active) {
            this.sprite.setScale(1.0);
          }
        }
      });
      
      // Add a glow effect
      const glowColor = this.type === 'scarecrow' ? 0x00FFFF : 0xFF6600;
      const glow = this.scene.add.circle(this.x, this.y, 40, glowColor, 0.4);
      glow.setDepth(99);
      
      this.scene.tweens.add({
        targets: glow,
        alpha: 0,
        scale: 2,
        duration: 500,
        onComplete: () => glow.destroy()
      });
    }
    
    // For ice mage - freeze all enemies in range
    if (this.type === 'scarecrow') {
      // Launch multiple ice projectiles
      enemiesInRange.forEach(enemy => {
        this.launchProjectile(enemy, 'blue', true);
        
        // Apply enhanced damage and slow effect
        const damageAmount = this.damage * this.specialAttackDamageMultiplier;
        this.applyDamageToEnemy(enemy, damageAmount);
        
        // Apply slow effect if possible
        if (typeof enemy.applyStatusEffect === 'function') {
          enemy.applyStatusEffect('freeze', 5); // Freeze for 5 seconds
        }
        
        this.showDamageText(enemy, `${damageAmount.toFixed(1)}`, 0x00FFFF);
      });
      
      // Create ice explosion in the center
      this.performAreaAttack(this.x, this.y, specialRange, this.damage * this.specialAttackDamageMultiplier * 0.5, 'ice');
    } 
    // For fire mage - massive fire explosion
    else if (this.type === 'dog') {
      // Launch multiple fire projectiles
      enemiesInRange.forEach(enemy => {
        this.launchProjectile(enemy, 'red', true);
        
        // Apply enhanced damage and burn effect
        const damageAmount = this.damage * this.specialAttackDamageMultiplier;
        this.applyDamageToEnemy(enemy, damageAmount);
        
        // Apply burn effect if possible
        if (typeof enemy.applyStatusEffect === 'function') {
          enemy.applyStatusEffect('burn', 5); // Burn for 5 seconds
        }
        
        this.showDamageText(enemy, `${damageAmount.toFixed(1)}`, 0xFF6600);
      });
      
      // Create fire explosion in the center
      this.performAreaAttack(this.x, this.y, specialRange, this.damage * this.specialAttackDamageMultiplier * 0.7, 'fire');
    }
    
    // Remove the special attack indicator
    if (this.specialAttackReadyIndicator) {
      this.specialAttackReadyIndicator.destroy();
      this.specialAttackReadyIndicator = null;
    }
    
    if (this.specialAttackText) {
      this.specialAttackText.destroy();
      this.specialAttackText = null;
    }
    
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

  // --- MOVE launchProjectile INSIDE THE CLASS DEFINITION --- 
  launchProjectile(enemy, projectileType) {
    try {
      if (!this.scene || !enemy) return;

      const enemyX = enemy.x || (enemy.container && enemy.container.x) || 400;
      const enemyY = enemy.y || (enemy.container && enemy.container.y) || 300;

      let projectile;
      let textureKey = 'pixel'; // Default fallback
      let size = 10;
      let color = 0xFFFFFF;

      if (projectileType === 'magic') {
        textureKey = 'magic_particle'; // Use a specific magic texture if available
        size = 15;
        color = 0xFF00FF;
      } else if (projectileType === 'cannonball') {
        textureKey = 'pixel'; // Use pixel for simple cannonball
        size = 20;
        color = 0x333333;
      } else if (projectileType === 'ice') { // Added for consistency
        textureKey = 'iceball'; 
        size = 18;
        color = 0x66CCFF;
      } else if (projectileType === 'fire') { // Added for consistency
        textureKey = 'fireball';
        size = 18;
        color = 0xFF6600;
      }

      if (this.scene.textures.exists(textureKey) && textureKey !== 'pixel') { // Prioritize texture if exists and not pixel
        projectile = this.scene.add.image(this.x, this.y, textureKey);
        projectile.setDisplaySize(size, size);
      } else { // Fallback to circle or pixel image
        if (textureKey === 'pixel' && this.scene.textures.exists('pixel')) {
           projectile = this.scene.add.image(this.x, this.y, 'pixel');
           projectile.setDisplaySize(size, size).setTint(color); // Tint the pixel
        } else {
           projectile = this.scene.add.circle(this.x, this.y, size / 2, color); // Circle fallback
        }
      }

      projectile.setDepth(200);
      projectile.targetEnemy = enemy;
      projectile.damage = this.damage; // Use defense's damage
      projectile.projectileType = projectileType;
      projectile.originX = this.x; // Store origin for distance check
      projectile.originY = this.y;

      const angle = Phaser.Math.Angle.Between(this.x, this.y, enemyX, enemyY);
      if (projectile.setRotation) projectile.setRotation(angle);

      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemyX, enemyY);
      const duration = distance * (projectileType === 'cannonball' ? 3 : 2); // Cannonballs slower

      this.scene.tweens.add({
        targets: projectile,
        x: enemyX,
        y: enemyY,
        duration: duration,
        ease: 'Linear',
        onComplete: () => {
          // Trigger hit effect based on type
          if (this.scene && typeof this.scene.createHitEffect === 'function') {
            this.scene.createHitEffect(enemyX, enemyY, this.type); // Pass defense type
          }
          
          // Apply damage directly on hit ONLY if it's NOT a cannonball (cannonball applies damage via AOE)
          if (projectileType !== 'cannonball' && projectile.targetEnemy && typeof projectile.targetEnemy.takeDamage === 'function') {
              // Verify enemy still exists and is active before applying damage
              if (projectile.targetEnemy.active && projectile.targetEnemy.health > 0) {
                   this.applyDamageToEnemy(projectile.targetEnemy, projectile.damage);
              }
          }

          // Cannonballs trigger AOE damage on impact
          if (projectileType === 'cannonball' && typeof this.performAreaAttack === 'function') {
            this.performAreaAttack(enemyX, enemyY, this.aoeRadius, this.damage * this.aoeDamageMultiplier, 'explosion');
          }

          if (projectile.active) projectile.destroy(); // Check active before destroy
        }
      });

    } catch (error) {
      console.error("Error launching projectile:", error);
    }
  }
  // --- END launchProjectile METHOD DEFINITION ---

  // Regenerate mana over time
  regenerateMana(delta) {
      // ADDED: Log delta for debugging
      if (!delta || typeof delta !== 'number' || delta <= 0) {
          // Log only once if delta seems invalid
          if (!this.loggedInvalidDelta) {
              console.warn(`Defense ${this.type} ID ${this.id || ''}: Invalid delta received: ${delta}. Mana regen might not work.`);
              this.loggedInvalidDelta = true; 
          }
          delta = 16.67; // Fallback to assuming ~60fps if delta is invalid
      }
      else {
          // Reset flag if valid delta received later
          this.loggedInvalidDelta = false;
      }

      if (this.currentMana < this.maxMana) {
          const manaToAdd = this.manaRegenRate * (delta / 1000);
          this.currentMana += manaToAdd;
          this.currentMana = Math.min(this.currentMana, this.maxMana);

          // ADDED: Log mana changes
          if (manaToAdd > 0 && Math.random() < 0.05) { // Log occasionally when mana changes
              console.log(`Defense ${this.type} ID ${this.id || ''}: Mana +${manaToAdd.toFixed(3)}, Current: ${this.currentMana.toFixed(2)}/${this.maxMana}, Delta: ${delta.toFixed(2)}`);
          }

          // If mana regenerated enough for a shot, update state
          if (this.isOutOfMana && this.currentMana >= this.manaCostPerShot) {
              // ADDED: Log mana recovery state change
              console.log(`Defense ${this.type} ID ${this.id || ''}: Recovered mana! Now ${this.currentMana.toFixed(2)}, Cost ${this.manaCostPerShot}. Setting isOutOfMana=false.`);
              this.isOutOfMana = false;
              if(this.noManaText) this.noManaText.visible = false;
              // Make cooldown text visible again if cooldown isn't finished
              const now = this.scene ? this.scene.time.now : 0;
              const elapsed = now - this.lastAttackTime;
              const remainingCooldown = Math.max(0, this.cooldown - elapsed);
              if(this.cooldownText && remainingCooldown > 0) {
                  this.cooldownText.visible = true;
              }
          }
      }
  }
} 