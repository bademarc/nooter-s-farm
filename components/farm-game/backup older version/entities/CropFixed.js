'use client';

export default class Crop {
  constructor(scene, x, y) {
    try {
      this.scene = scene;
      this.x = x;
      this.y = y;
      this.health = 10;
      this.maxHealth = 10;
      this.value = 2; // Coins per tick
      this.harvestInterval = 5000; // 5 seconds
      this.nextHarvestTime = scene.time.now + this.harvestInterval; // Prevent immediate harvest
      this.isHarvestable = false; // Not harvestable immediately
      
      // Create visual representation
      this.sprite = scene.add.rectangle(x, y, 30, 30, 0x00FF00);
      
      // Add health bar
      this.healthBar = {
        background: scene.add.rectangle(x, y - 20, 40, 5, 0xFF0000),
        fill: scene.add.rectangle(x, y - 20, 40, 5, 0x00FF00)
      };
      
      // Show an initial growing indicator
      this.growingText = scene.add.text(x, y, '🌱', {
        fontSize: '16px',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      
      console.log(`Crop planted at ${x},${y}`);
      
      // Setup growth and harvest timer in a separate method to avoid errors
      this.setupTimers();
    } catch (error) {
      console.error("Error creating crop:", error);
    }
  }
  
  setupTimers() {
    try {
      // First set a timer to make the crop harvestable
      this.growthTimer = this.scene.time.addEvent({
        delay: this.harvestInterval,
        callback: () => {
          this.isHarvestable = true;
          // Change visual to show it's ready
          if (this.growingText) {
            this.growingText.setText('🌿');
          }
          // Now setup recurring harvest timer
          this.harvestTimer = this.scene.time.addEvent({
            delay: this.harvestInterval,
            callback: this.harvest,
            callbackScope: this,
            loop: true,
            startAt: 0 // Start immediately after becoming harvestable
          });
        },
        callbackScope: this,
        loop: false
      });
    } catch (error) {
      console.error("Error setting up crop timers:", error);
    }
  }
  
  update() {
    try {
      if (!this.sprite || !this.healthBar) return;
      
      // Update health bar
      const healthPercent = this.health / this.maxHealth;
      this.healthBar.fill.width = 40 * healthPercent;
      this.healthBar.fill.x = this.x - 20 + (this.healthBar.fill.width / 2);
      
      // Update position of growing text if it exists
      if (this.growingText) {
        this.growingText.x = this.x;
        this.growingText.y = this.y;
      }
    } catch (error) {
      console.error("Error updating crop:", error);
    }
  }
  
  damage(amount) {
    try {
      this.health -= amount;
      this.update();
      
      if (this.health <= 0) {
        this.destroy();
        return true; // Crop was destroyed
      }
      
      return false;
    } catch (error) {
      console.error("Error damaging crop:", error);
      return false;
    }
  }
  
  harvest() {
    try {
      // Don't harvest if not active or not harvestable yet
      if (!this.scene.gameState || !this.scene.gameState.isActive || !this.isHarvestable) {
        return;
      }
      
      // Generate coins based on crop value
      if (this.scene.updateFarmCoins) {
        this.scene.updateFarmCoins(this.value);
        
        // Show floating coins text
        if (this.scene.showFloatingText) {
          this.scene.showFloatingText(this.x, this.y, `+${this.value}`, 0xFFFF00);
        }
        
        // Update next harvest time
        this.nextHarvestTime = this.scene.time.now + this.harvestInterval;
      }
    } catch (error) {
      console.error("Error harvesting crop:", error);
    }
  }
  
  destroy() {
    try {
      // Clean up timers
      if (this.growthTimer) {
        this.growthTimer.remove();
        this.growthTimer = null;
      }
      
      if (this.harvestTimer) {
        this.harvestTimer.remove();
        this.harvestTimer = null;
      }
      
      // Clean up sprites
      if (this.sprite) {
        this.sprite.destroy();
        this.sprite = null;
      }
      
      if (this.healthBar) {
        if (this.healthBar.background) this.healthBar.background.destroy();
        if (this.healthBar.fill) this.healthBar.fill.destroy();
        this.healthBar = null;
      }
      
      if (this.growingText) {
        this.growingText.destroy();
        this.growingText = null;
      }
      
      console.log("Crop destroyed");
    } catch (error) {
      console.error("Error destroying crop:", error);
    }
  }
} 