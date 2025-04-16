'use client';

export default class Crop extends Phaser.GameObjects.Container {
  constructor(scene, x, y, cropType = 'carrot') {
    super(scene, x, y);
    scene.add.existing(this);
    
    // Store properties
    this.scene = scene;
    this.cropType = cropType;
    this.growthState = 'seedling';
    this.growthProgress = 0;
    this.maxGrowth = 100;
    this.growthRate = 0.5;
    this.isHarvestable = false;
    this.health = 100;
    this.maxHealth = 100;
    this.isActive = true;
    this.damageSound = null;
    this.value = 2; // Coins per harvest
    this.growthMultiplier = 1.0; // Multiplier from upgrades
    this.yieldMultiplier = 1.0;  // Multiplier from upgrades
    
    // Create plant sprite based on crop type
    this.createSprites();
    
    // Create health bar for crop
    this.createHealthBar();
    
    // Add interactions
    this.setSize(32, 32);
    this.setInteractive();
    this.on('pointerdown', () => {
      if (this.isHarvestable) {
        this.harvest();
      }
    });
    
    // Start growth
    this.startGrowth();
    
    // Apply game balance adjustments based on current wave
    this.adjustForWave();
    
    // Apply any existing upgrades
    this.applyUpgrades();
    
    console.log(`Created ${this.cropType} crop at (${x}, ${y})`);
  }
  
  createSprites() {
    // Use tree textures for crops instead of plant sprites
    const treeTypes = ['Fruit_tree3', 'Moss_tree3'];
    const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
    
    // Create shadow sprite
    this.shadowSprite = this.scene.add.image(0, 8, 'shadow1');
    this.shadowSprite.setScale(0.6);
    this.shadowSprite.setAlpha(0.4);
    this.add(this.shadowSprite);
    
    // Create plant sprite using tree textures
    this.plantSprite = this.scene.add.image(0, 0, treeType);
    this.plantSprite.setScale(0.4); // Trees are larger, so use smaller scale
    this.add(this.plantSprite);
    
    // Add a small indicator that the plant is harvestable (initially hidden)
    this.harvestIndicator = this.scene.add.text(0, -20, '✓', {
      font: 'bold 14px Arial',
      fill: '#00FF00'
    }).setOrigin(0.5);
    this.harvestIndicator.setVisible(false);
    this.add(this.harvestIndicator);
  }
  
  createHealthBar() {
    // Create health bar background
    this.healthBarBg = this.scene.add.rectangle(0, -25, 30, 4, 0x000000);
    this.healthBarBg.setAlpha(0.7);
    this.add(this.healthBarBg);
    
    // Create health bar fill
    this.healthBar = this.scene.add.rectangle(-15, -25, 30, 4, 0x00FF00);
    this.healthBar.setOrigin(0, 0.5);
    this.add(this.healthBar);
    
    // Hide health bar initially
    this.healthBarBg.setVisible(false);
    this.healthBar.setVisible(false);
  }
  
  startGrowth() {
    if (this.growthTimer) {
      return; // Already growing
    }
    
    // Calculate actual growth delay based on growth speed and multiplier
    const growthDelay = Math.max(500, 1000 / this.growthMultiplier);
    
    // Create a timer that increments growth
    this.growthTimer = this.scene.time.addEvent({
      delay: growthDelay,
      callback: this.grow,
      callbackScope: this,
      loop: true
    });
  }
  
  grow() {
    if (!this.isActive || this.growthProgress >= this.maxGrowth) {
      return;
    }
    
    // Increment growth based on growth speed and multiplier
    const effectiveGrowthSpeed = this.growthRate * this.growthMultiplier;
    this.growthProgress += effectiveGrowthSpeed;
    
    // Cap growth
    if (this.growthProgress >= this.maxGrowth) {
      this.growthProgress = this.maxGrowth;
      this.setGrowthState('mature');
    } else if (this.growthProgress >= this.maxGrowth / 2 && this.growthState === 'seedling') {
      this.setGrowthState('growing');
    }
  }
  
  setGrowthState(state) {
    // Update state
    this.growthState = state;
    
    // Update visual appearance
    if (state === 'seedling') {
      this.plantSprite.setScale(0.3);
      this.isHarvestable = false;
      this.harvestIndicator.setVisible(false);
    } else if (state === 'growing') {
      this.plantSprite.setScale(0.5);
      this.isHarvestable = false;
      this.harvestIndicator.setVisible(false);
    } else if (state === 'mature') {
      this.plantSprite.setScale(0.7);
      this.isHarvestable = true;
      this.harvestIndicator.setVisible(true);
      
      // Add a small "bob" animation
      this.scene.tweens.add({
        targets: this.plantSprite,
        y: -2,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Play a sound if available
      if (this.scene.sound && this.scene.sound.add) {
        try {
          const growSound = this.scene.sound.add('grow_complete', { 
            volume: 0.2,
            rate: 0.8 + Math.random() * 0.4
          });
          growSound.play();
        } catch (e) {
          console.log("Could not play grow sound", e);
        }
      }
      
      // Show floating text
      if (this.scene.showFloatingText) {
        this.scene.showFloatingText(this.x, this.y - 30, 'Ready!', 0x00FF00);
      }
    }
  }
  
  setHarvestReady(ready) {
    this.isHarvestable = ready;
    
    // Show/hide harvest indicator
    if (this.harvestIndicator) {
      this.harvestIndicator.setVisible(ready);
    }
    
    // Add "ready" animation if it's harvestable
    if (ready && this.plantSprite) {
      this.scene.tweens.add({
        targets: this.plantSprite,
        y: -2,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Show floating text
      if (this.scene.showFloatingText) {
        this.scene.showFloatingText(this.x, this.y - 30, 'Ready!', 0x00FF00);
      }
    }
  }
  
  harvest() {
    if (!this.isActive || !this.isHarvestable) {
      return 0;
    }
    
    console.log(`Harvesting ${this.cropType} crop at ${this.x}, ${this.y}, generating coins`);
    
    // Play harvest sound
    if (this.scene.soundManager) {
      this.scene.soundManager.play('harvest');
    }
    
    // Reset growth
    this.growthProgress = 0;
    this.isHarvestable = false;
    this.setGrowthState('seedling');
    
    // Calculate yield
    const yieldAmount = this.calculateYield();
    
    // Generate coins
    if (typeof this.scene.updateFarmCoins === 'function') {
      this.scene.updateFarmCoins(yieldAmount);
      
      // Show floating coins with animation
      this.scene.showFloatingText(this.x, this.y, `+${yieldAmount}`, 0xFFFF00);
      
      // Add visual effect when harvesting
      this.scene.tweens.add({
        targets: this,
        y: this.y - 10,
        duration: 100,
        yoyo: true,
        ease: 'Power1'
      });
    }
    
    return yieldAmount;
  }
  
  calculateYield() {
    // Base yield with some randomness, modified by yield multiplier
    const baseYield = this.value + Math.random() * 2;
    return Math.floor(baseYield * this.yieldMultiplier);
  }
  
  damage(amount) {
    // Reduce health
    this.health -= amount;
    
    // Update health bar
    this.healthBarBg.setVisible(true);
    this.healthBar.setVisible(true);
    this.healthBar.width = Math.max(0, (this.health / this.maxHealth) * 30);
    
    // Change color based on health
    if (this.health < this.maxHealth * 0.3) {
      this.healthBar.fillColor = 0xFF0000;
    } else if (this.health < this.maxHealth * 0.6) {
      this.healthBar.fillColor = 0xFFFF00;
    }
    
    // Check for destruction
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    
    // Hide health bar after delay
    this.scene.time.delayedCall(2000, () => {
      if (this.healthBarBg) {
        this.healthBarBg.setVisible(false);
        this.healthBar.setVisible(false);
      }
    });
    
    return false;
  }
  
  update() {
    // Override in subclasses if needed
  }
  
  adjustForWave() {
    // Get current wave
    const wave = this.scene.gameState?.wave || 1;
    
    // Adjust growth rate based on wave
    if (wave > 1) {
      this.growthRate = Math.min(1.5, 0.5 + (wave * 0.1));
    }
  }
  
  destroy() {
    // Clean up timers
    if (this.growthTimer) {
      this.growthTimer.remove();
      this.growthTimer = null;
    }
    
    // Clean up tweens
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.plantSprite);
    
    // Set as inactive
    this.isActive = false;
    
    // Remove from parent
    super.destroy();
  }
  
  // Apply existing upgrades when a crop is created
  applyUpgrades() {
    // If upgrade system exists, apply current upgrades
    if (this.scene.upgradeSystem) {
      // Apply crop yield upgrade
      this.updateYield(this.scene.upgradeSystem.getUpgradeValue('cropYield'));
      
      // Apply growth rate upgrade
      this.updateGrowthRate(this.scene.upgradeSystem.getUpgradeValue('cropGrowth'));
    }
  }
  
  // Update the yield multiplier when upgraded
  updateYield(multiplier) {
    if (typeof multiplier === 'number' && multiplier > 0) {
      this.yieldMultiplier = multiplier;
      
      // Show visual feedback
      if (this.plantSprite) {
        this.scene.tweens.add({
          targets: this.plantSprite,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 200,
          yoyo: true,
          onComplete: () => {
            if (this.plantSprite) {
              this.plantSprite.setScale(1 + (this.growthProgress / this.maxGrowth) * 0.5);
            }
          }
        });
      }
      
      console.log(`Crop yield multiplier updated to ${multiplier.toFixed(2)}`);
    }
  }
  
  // Update the growth rate multiplier when upgraded
  updateGrowthRate(multiplier) {
    if (typeof multiplier === 'number' && multiplier > 0) {
      this.growthMultiplier = multiplier;
      
      // Update the growth timer if it exists
      if (this.growthTimer) {
        this.growthTimer.remove();
        this.startGrowth(); // Restart with new delay
      }
      
      // Show visual feedback
      if (this.plantSprite) {
        this.scene.tweens.add({
          targets: this.plantSprite,
          alpha: 0.7,
          duration: 100,
          yoyo: true,
          repeat: 3
        });
      }
      
      console.log(`Crop growth multiplier updated to ${multiplier.toFixed(2)}`);
    }
  }
} 